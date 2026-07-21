import type { GameState, WeaponId } from "./types";
import { WEAPONS, WEAPON_ORDER } from "./weapons";
import { activateRage, fire, jumpDog, moveDog, RAGE_READY_THRESHOLD } from "./engine";
import { getAIDifficulty } from "./scenarioContext";

// Difficulty-aware AI.
// Recruit  = mostly random, frequent big misses.
// Sergeant = coarse simulation with meaningful jitter, sometimes picks a sub-optimal solution.
// General  = fine search with small imperfections (never surgical) so the player can still win.
export function aiTakeTurn(state: GameState) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const me = state.dogs[state.currentPlayer];
  const enemy = state.dogs[1 - state.currentPlayer];
  if (!me || me.hp <= 0 || !enemy) return;

  me.facing = enemy.x > me.x ? 1 : -1;

  // Auto-Fúria: se disponível e barra pronta, ativa antes de mirar
  if (state.rageEnabled && !me.rageActive && me.rageCharge >= RAGE_READY_THRESHOLD) {
    activateRage(state);
  }

  const diff = getAIDifficulty();

  // ---------- RECRUIT ----------
  if (diff === "recruit") {
    const basic: WeaponId[] = ["bazooka", "grenade", "bow"];
    const pool = basic.filter(w => state.ammo[w] !== 0);
    state.weapon = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "bazooka";

    // Big spread — no aiming logic at all
    const wildMiss = Math.random() < 0.35;
    state.angle = 15 + Math.random() * 65;
    state.power = 30 + Math.random() * 70;
    if (wildMiss) {
      // Force a bad shot: extreme angle or low power
      state.angle = Math.random() < 0.5 ? 15 + Math.random() * 15 : 70 + Math.random() * 15;
      state.power = 30 + Math.random() * 30;
    }

    setTimeout(() => { if (state.phase === "aiming") fire(state); }, 900);
    return;
  }

  // ---------- SERGEANT & GENERAL: simulation-based ----------
  let candidates: WeaponId[];
  if (diff === "general") {
    candidates = WEAPON_ORDER.filter(w => state.ammo[w] !== 0);
    if (enemy.hp < 40) {
      const strong: WeaponId[] = ["airstrike", "cluster", "artillery", "rpg"];
      const s = strong.filter(w => state.ammo[w] !== 0);
      if (s.length) candidates = [...s, ...candidates.filter(w => !s.includes(w))];
    }
  } else {
    // Sergeant: moderate arsenal, no priority combos
    const pref: WeaponId[] = ["bazooka", "grenade", "bow", "frag", "rpg"];
    candidates = pref.filter(w => state.ammo[w] !== 0);
    if (!candidates.length) candidates = ["bazooka"];
  }

  const angleStep = diff === "general" ? 3 : 8;
  const powerStep = diff === "general" ? 6 : 15;
  const angleMin = 15, angleMax = 82;
  const powerMin = 30, powerMax = diff === "general" ? 95 : 100;

  const maxWeapons = diff === "general" ? candidates.length : 2;
  type Sol = { weapon: WeaponId; angle: number; power: number; dist: number };
  const solutions: Sol[] = [];

  for (const wId of candidates.slice(0, maxWeapons)) {
    for (let angle = angleMin; angle <= angleMax; angle += angleStep) {
      for (let power = powerMin; power <= powerMax; power += powerStep) {
        const d = simulate(state, angle, power, wId);
        solutions.push({ weapon: wId, angle, power, dist: d });
      }
    }
  }

  solutions.sort((a, b) => a.dist - b.dist);

  // Sergeant: 25% chance to pick the 2nd/3rd best instead of the optimum
  let pickIdx = 0;
  if (diff === "sergeant" && solutions.length > 3 && Math.random() < 0.25) {
    pickIdx = 1 + Math.floor(Math.random() * 2);
  }
  const best = solutions[pickIdx] ?? { weapon: candidates[0], angle: 45, power: 60, dist: Infinity };

  // Jitter — General has small imperfections; Sergeant is noticeably wobbly
  let jitterAng = diff === "general" ? 4 : 10;
  let jitterPow = diff === "general" ? 6 : 18;

  // General: 15% chance of an "off" turn with doubled jitter
  if (diff === "general" && Math.random() < 0.15) {
    jitterAng *= 2;
    jitterPow *= 2;
  }

  state.weapon = best.weapon;
  state.angle = Math.max(10, Math.min(85, best.angle + (Math.random() - 0.5) * jitterAng));
  state.power = Math.max(20, Math.min(100, best.power + (Math.random() - 0.5) * jitterPow));

  setTimeout(() => {
    if (state.phase === "aiming") fire(state);
  }, diff === "general" ? 1400 : 1100);
}

function simulate(state: GameState, angle: number, power: number, weaponId: WeaponId): number {
  const w = WEAPONS[weaponId];
  const me = state.dogs[state.currentPlayer];
  const enemy = state.dogs[1 - state.currentPlayer];

  if (w.id === "airstrike") {
    const targetX = me.x + me.facing * (power * 3.5);
    return Math.abs(targetX - enemy.x);
  }

  const rad = (angle * Math.PI) / 180;
  const dir = me.facing;
  const v = power * w.speed * 0.6;
  let vx = Math.cos(rad) * v * dir;
  let vy = -Math.sin(rad) * v;
  let x = me.x + dir * 18, y = me.y - 6;
  const dt = 1 / 60;
  const gravity = 500 * w.gravityScale;
  const wind = state.wind;
  const width = state.width, height = state.height;
  const diff = getAIDifficulty();

  for (let i = 0; i < 600; i++) {
    if (w.affectedByWind) vx += wind * 40 * dt;
    if (w.id === "rpg" && i * dt < 1.4) {
      const sp = Math.hypot(vx, vy) || 1;
      vx += (vx / sp) * 260 * dt;
      vy += (vy / sp) * 260 * dt;
    }
    vy += gravity * dt;
    x += vx * dt; y += vy * dt;
    if (x < 0 || x > width || y > height) break;
    if (isSolid(state, x, y)) {
      let dist = Math.hypot(x - enemy.x, y - (enemy.y - 8));
      // Penalize self-hits (only General fully avoids them)
      const selfDist = Math.hypot(x - me.x, y - me.y);
      if (selfDist < 40) {
        dist += diff === "general" ? 500 : 120;
      }
      return dist;
    }
  }
  return Math.hypot(x - enemy.x, y - (enemy.y - 8));
}

function isSolid(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return false;
  return state.terrain[Math.floor(y) * state.width + Math.floor(x)] === 1;
}
