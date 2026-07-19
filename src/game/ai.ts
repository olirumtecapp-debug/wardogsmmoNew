import type { GameState, WeaponId } from "./types";
import { WEAPONS, WEAPON_ORDER } from "./weapons";
import { fire } from "./engine";
import { getAIDifficulty } from "./scenarioContext";

// Difficulty-aware AI. Recruit=random, Sergeant=simulation, General=deep search + weapon strategy.
export function aiTakeTurn(state: GameState) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const me = state.dogs[state.currentPlayer];
  const enemy = state.dogs[1 - state.currentPlayer];
  if (!me || me.hp <= 0 || !enemy) return;

  me.facing = enemy.x > me.x ? 1 : -1;

  const diff = getAIDifficulty();

  if (diff === "recruit") {
    // Pick any weapon with ammo, mostly bazooka
    const roll = Math.random();
    const pool: WeaponId[] = roll < 0.6 ? ["bazooka"] : ["bazooka", "grenade", "bow"];
    const chosen = pool.find(w => state.ammo[w] !== 0) ?? "bazooka";
    state.weapon = chosen;
    state.angle = 30 + Math.random() * 45;
    state.power = 50 + Math.random() * 40;
    setTimeout(() => { if (state.phase === "aiming") fire(state); }, 900);
    return;
  }

  // Pick weapons to try
  let candidates: WeaponId[];
  if (diff === "general") {
    // Consider all weapons with ammo; strongly prefer high-damage / area effects when enemy hp low
    candidates = WEAPON_ORDER.filter(w => state.ammo[w] !== 0);
    if (enemy.hp < 40) {
      const strong: WeaponId[] = ["airstrike", "cluster", "artillery", "rpg"];
      const s = strong.filter(w => state.ammo[w] !== 0);
      if (s.length) candidates = [...s, ...candidates.filter(w => !s.includes(w))];
    }
  } else {
    // Sergeant: moderate weapon set
    const pref: WeaponId[] = ["rpg", "bazooka", "grenade", "frag", "bow", "artillery"];
    candidates = pref.filter(w => state.ammo[w] !== 0);
    if (!candidates.length) candidates = ["bazooka"];
  }

  const angleStep = diff === "general" ? 3 : 6;
  const powerStep = diff === "general" ? 6 : 12;
  const angleMin = 15, angleMax = 82;
  const powerMin = 30, powerMax = 100;

  let best = { weapon: candidates[0], angle: 45, power: 60, dist: Infinity };

  for (const wId of candidates.slice(0, diff === "general" ? candidates.length : 3)) {
    for (let angle = angleMin; angle <= angleMax; angle += angleStep) {
      for (let power = powerMin; power <= powerMax; power += powerStep) {
        const d = simulate(state, angle, power, wId);
        if (d < best.dist) best = { weapon: wId, angle, power, dist: d };
      }
    }
  }

  state.weapon = best.weapon;
  const jitterAng = diff === "general" ? 2 : 6;
  const jitterPow = diff === "general" ? 3 : 10;
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

  // Airstrike lands vertically from top at derived x
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
  for (let i = 0; i < 600; i++) {
    if (w.affectedByWind) vx += wind * 40 * dt;
    // RPG thrust (simplified)
    if (w.id === "rpg" && i * dt < 1.4) {
      const sp = Math.hypot(vx, vy) || 1;
      vx += (vx / sp) * 260 * dt;
      vy += (vy / sp) * 260 * dt;
    }
    vy += gravity * dt;
    x += vx * dt; y += vy * dt;
    if (x < 0 || x > width || y > height) break;
    if (isSolid(state, x, y)) return Math.hypot(x - enemy.x, y - (enemy.y - 8));
  }
  return Math.hypot(x - enemy.x, y - (enemy.y - 8));
}

function isSolid(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return false;
  return state.terrain[Math.floor(y) * state.width + Math.floor(x)] === 1;
}
