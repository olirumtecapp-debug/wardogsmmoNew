import type { GameState } from "./types";
import { WEAPONS, WEAPON_ORDER } from "./weapons";
import { fire } from "./engine";

// Simple AI: try many angle/power/weapon combos, pick trajectory that lands closest to enemy
export function aiTakeTurn(state: GameState) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const me = state.dogs[state.currentPlayer];
  const enemy = state.dogs[1 - state.currentPlayer];
  if (!me || me.hp <= 0 || !enemy) return;

  me.facing = enemy.x > me.x ? 1 : -1;

  // Choose weapon: prefer bazooka/artillery if available, else grenade, else ak, else revolver
  const preference: (typeof WEAPON_ORDER)[number][] = ["bazooka", "artillery", "grenade", "ak47", "revolver"];
  let chosen = preference.find(w => state.ammo[w] !== 0) ?? "revolver";
  state.weapon = chosen;

  // Search
  let best = { angle: 45, power: 60, dist: Infinity };
  for (let angle = 20; angle <= 80; angle += 5) {
    for (let power = 40; power <= 100; power += 10) {
      const d = simulate(state, angle, power, chosen);
      if (d < best.dist) best = { angle, power, dist: d };
    }
  }
  // Add some inaccuracy
  state.angle = Math.max(10, Math.min(85, best.angle + (Math.random() - 0.5) * 8));
  state.power = Math.max(20, Math.min(100, best.power + (Math.random() - 0.5) * 12));

  // Animate readjust then fire after a small delay
  setTimeout(() => {
    if (state.phase === "aiming") fire(state);
  }, 1200);
}

function simulate(state: GameState, angle: number, power: number, weaponId: keyof typeof WEAPONS): number {
  const w = WEAPONS[weaponId];
  const me = state.dogs[state.currentPlayer];
  const enemy = state.dogs[1 - state.currentPlayer];
  const rad = (angle * Math.PI) / 180;
  const dir = me.facing;
  const speedScale = 6;
  let vx = Math.cos(rad) * power * 0.12 * w.speed * dir * 0.06 * speedScale;
  let vy = -Math.sin(rad) * power * 0.12 * w.speed * 0.06 * speedScale;
  let x = me.x + dir * 18, y = me.y - 6;
  const dt = 1 / 60;
  const gravity = 380 * w.gravityScale;
  const width = state.width, height = state.height;
  for (let i = 0; i < 600; i++) {
    if (w.affectedByWind) vx += state.wind * 40 * dt;
    vy += gravity * dt;
    x += vx * dt; y += vy * dt;
    if (x < 0 || x > width || y > height) break;
    // Check hit terrain
    if (isSolid(state, x, y)) return Math.hypot(x - enemy.x, y - (enemy.y - 8));
    if (w.kind === "hitscan") return Math.hypot(x - enemy.x, y - (enemy.y - 8));
  }
  return Math.hypot(x - enemy.x, y - (enemy.y - 8));
}

function isSolid(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return false;
  return state.terrain[Math.floor(y) * state.width + Math.floor(x)] === 1;
}
