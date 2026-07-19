import type { Dog, Explosion, GameMode, GameState, Projectile, WeaponId } from "./types";
import { WEAPONS, WEAPON_ORDER, initialAmmo } from "./weapons";
import { markTerrainDirty } from "./render";

const GRAVITY = 500; // px/s^2
const MAX_TURN_TIME = 30;

// Deterministic PRNG (mulberry32)
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(width: number, height: number, mode: GameMode, seed = Date.now()): GameState {
  const rng = mulberry32(seed);
  const terrain = generateTerrain(width, height, rng);
  const dogs = placeDogs(terrain, width, height, rng);
  return {
    width, height, terrain, dogs,
    projectiles: [], explosions: [],
    floatingTexts: [], scorchMarks: [],
    currentPlayer: 0,
    wind: (rng() - 0.5) * 2,
    angle: 45, power: 60,
    weapon: "bazooka",
    ammo: initialAmmo(),
    phase: "aiming",
    winner: null,
    message: mode === "ai" ? "Sua vez — jogador Verde" : "Vez do jogador Verde",
    turnTimer: MAX_TURN_TIME,
    mode,
    seed,
  };
}

function generateTerrain(w: number, h: number, rng: () => number): Uint8Array {
  const terrain = new Uint8Array(w * h);
  // 1D height map via octave noise
  const heights = new Float32Array(w);
  const baseline = h * 0.55;
  const amp = h * 0.22;
  // Sum sines with random phase/amp for organic look
  const octaves = [
    { freq: 0.002, amp: amp * 0.7, phase: rng() * Math.PI * 2 },
    { freq: 0.006, amp: amp * 0.25, phase: rng() * Math.PI * 2 },
    { freq: 0.015, amp: amp * 0.10, phase: rng() * Math.PI * 2 },
    { freq: 0.04, amp: amp * 0.04, phase: rng() * Math.PI * 2 },
  ];
  for (let x = 0; x < w; x++) {
    let y = baseline;
    for (const o of octaves) y += Math.sin(x * o.freq + o.phase) * o.amp;
    heights[x] = Math.max(60, Math.min(h - 20, y));
  }
  for (let x = 0; x < w; x++) {
    const top = Math.floor(heights[x]);
    for (let y = top; y < h; y++) terrain[y * w + x] = 1;
  }
  return terrain;
}

function placeDogs(terrain: Uint8Array, w: number, h: number, rng: () => number): [Dog, Dog] {
  const p1x = Math.floor(w * (0.10 + rng() * 0.10));
  const p2x = Math.floor(w * (0.80 + rng() * 0.10));
  return [
    { x: p1x, y: surfaceY(terrain, w, h, p1x) - 18, vy: 0, hp: 100, team: 0, facing: 1, aliveTicks: 0 },
    { x: p2x, y: surfaceY(terrain, w, h, p2x) - 18, vy: 0, hp: 100, team: 1, facing: -1, aliveTicks: 0 },
  ];
}

export function surfaceY(terrain: Uint8Array, w: number, h: number, x: number): number {
  const xi = Math.max(0, Math.min(w - 1, Math.floor(x)));
  for (let y = 0; y < h; y++) if (terrain[y * w + xi]) return y;
  return h;
}

export function terrainAt(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return false;
  return state.terrain[Math.floor(y) * state.width + Math.floor(x)] === 1;
}

export function destroyTerrain(state: GameState, cx: number, cy: number, r: number) {
  const { width: w, height: h, terrain } = state;
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) terrain[y * w + x] = 0;
    }
  }
  markTerrainDirty();
}

export function fire(state: GameState) {
  if (state.phase !== "aiming") return;
  const weapon = WEAPONS[state.weapon];
  if (state.ammo[state.weapon] === 0) return;
  if (state.ammo[state.weapon] > 0) state.ammo[state.weapon]--;
  state.phase = "firing";
  state.message = "Fogo!";

  const dog = state.dogs[state.currentPlayer];
  const rad = (state.angle * Math.PI) / 180;
  const dir = dog.facing;
  // Worms-style muzzle velocity: power (10..100) * weapon.speed * 0.6
  const v = state.power * weapon.speed * 0.6;
  const vx = Math.cos(rad) * v * dir;
  const vy = -Math.sin(rad) * v;
  const muzzleX = dog.x + dir * 18;
  const muzzleY = dog.y - 6;

  if (weapon.kind === "hitscan") {
    // Ray march up to 2000px
    const step = 4;
    const range = 2400;
    let x = muzzleX, y = muzzleY;
    const dx = Math.cos(rad) * dir, dy = -Math.sin(rad);
    let hitX = x, hitY = y;
    let hitDog: Dog | null = null;
    for (let d = 0; d < range; d += step) {
      x += dx * step; y += dy * step;
      if (x < 0 || x >= state.width || y >= state.height) break;
      // Check dog hit
      for (const other of state.dogs) {
        if (other === dog || other.hp <= 0) continue;
        const ex = x - other.x, ey = y - (other.y - 8);
        if (ex * ex + ey * ey < 220) { hitDog = other; hitX = x; hitY = y; break; }
      }
      if (hitDog) break;
      if (terrainAt(state, x, y)) { hitX = x; hitY = y; break; }
    }
    // Immediate visual: create a small explosion at hit
    spawnExplosion(state, hitX, hitY, weapon.radius, weapon.color);
    if (weapon.id === "ak47") {
      // Burst: 4 additional pellets with spread
      for (let i = 0; i < 3; i++) {
        setTimeout(() => spawnHitscanBurst(state, dog, weapon.id), 90 * (i + 1));
      }
    }
    applyExplosionDamage(state, hitX, hitY, weapon.radius, weapon.damage);
    setTimeout(() => endTurn(state), 700);
  } else {
    const p: Projectile = {
      x: muzzleX, y: muzzleY, vx, vy,
      weapon: state.weapon, age: 0, ownerTeam: state.currentPlayer, trail: [],
    };
    state.projectiles.push(p);
  }
}

function spawnHitscanBurst(state: GameState, dog: Dog, weaponId: WeaponId) {
  const weapon = WEAPONS[weaponId];
  const rad = (state.angle * Math.PI) / 180 + (Math.random() - 0.5) * 0.06;
  const dir = dog.facing;
  const step = 4;
  const range = 2000;
  const dx = Math.cos(rad) * dir, dy = -Math.sin(rad);
  let x = dog.x + dir * 18, y = dog.y - 6;
  let hitX = x, hitY = y;
  for (let d = 0; d < range; d += step) {
    x += dx * step; y += dy * step;
    if (x < 0 || x >= state.width || y >= state.height) break;
    let hitDog = false;
    for (const other of state.dogs) {
      if (other === dog || other.hp <= 0) continue;
      const ex = x - other.x, ey = y - (other.y - 8);
      if (ex * ex + ey * ey < 220) { hitX = x; hitY = y; hitDog = true; break; }
    }
    if (hitDog) break;
    if (terrainAt(state, x, y)) { hitX = x; hitY = y; break; }
  }
  spawnExplosion(state, hitX, hitY, weapon.radius, weapon.color);
  applyExplosionDamage(state, hitX, hitY, weapon.radius, weapon.damage);
}

function spawnExplosion(state: GameState, x: number, y: number, radius: number, color: string) {
  const particles: Explosion["particles"] = [];
  const count = Math.min(60, Math.floor(radius * 1.2));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * 220;
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
      life: 0.4 + Math.random() * 0.6,
      color: Math.random() < 0.3 ? "#fff2b3" : color,
    });
  }
  state.explosions.push({ x, y, radius, age: 0, maxAge: 0.45, particles });
}

export function applyExplosionDamage(state: GameState, x: number, y: number, radius: number, damage: number) {
  destroyTerrain(state, x, y, radius);
  // Persistent scorch mark on the terrain
  state.scorchMarks.push({
    x, y, radius: radius * 1.05,
    life: 6, maxLife: 6,
  });
  let totalDamage = 0;
  let hits = 0;
  const stackOffsets = new Map<number, number>();
  for (const dog of state.dogs) {
    if (dog.hp <= 0) continue;
    const dx = dog.x - x, dy = dog.y - 8 - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + 14) {
      const falloff = Math.max(0, 1 - dist / (radius + 14));
      const dmg = Math.round(damage * falloff);
      dog.hp = Math.max(0, dog.hp - dmg);
      // Knockback
      const push = falloff * 180;
      dog.vy = -Math.abs(push * 0.6) - 40;
      dog.x += (dx / (dist || 1)) * push * 0.06;
      // Floating damage number over the dog
      const key = Math.round(dog.x / 24);
      const stackIdx = stackOffsets.get(key) ?? 0;
      stackOffsets.set(key, stackIdx + 1);
      const color = dmg >= 40 ? "#ff3838" : dmg >= 20 ? "#ff9138" : dmg > 0 ? "#ffd93a" : "#b8b8b8";
      const size = dmg >= 40 ? 30 : dmg >= 20 ? 26 : 22;
      state.floatingTexts.push({
        id: Math.random(),
        x: dog.x,
        y: dog.y - 32 - stackIdx * 18,
        vx: (Math.random() - 0.5) * 30,
        vy: -70,
        life: 1.2, maxLife: 1.2,
        value: dmg > 0 ? `-${dmg}` : "0",
        color, size,
      });
      if (dmg > 0) { totalDamage += dmg; hits++; }
    }
  }
  // Combined damage banner when multiple targets are hit
  if (hits > 1) {
    state.floatingTexts.push({
      id: Math.random(),
      x, y: y - radius - 10,
      vx: 0, vy: -50,
      life: 1.4, maxLife: 1.4,
      value: `-${totalDamage} TOTAL`,
      color: "#ffe6a3",
      size: 22,
    });
  }
}

export function step(state: GameState, dt: number) {
  // Update dogs (gravity)
  for (const dog of state.dogs) {
    if (dog.hp <= 0) continue;
    dog.aliveTicks++;
    dog.vy += GRAVITY * dt;
    dog.y += dog.vy * dt;
    // Ground collision
    const sy = surfaceY(state.terrain, state.width, state.height, dog.x);
    if (dog.y + 18 > sy) {
      dog.y = sy - 18;
      dog.vy = 0;
    }
    if (dog.y > state.height + 40) { dog.hp = 0; }
    dog.x = Math.max(10, Math.min(state.width - 10, dog.x));
  }

  // Update projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    const w = WEAPONS[p.weapon];
    p.age += dt;
    p.vy += GRAVITY * w.gravityScale * dt;
    if (w.affectedByWind) p.vx += state.wind * 40 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.trail.push([p.x, p.y]);
    if (p.trail.length > 24) p.trail.shift();

    let exploded = false;

    // Grenade fuse
    if (w.fuse && p.age >= w.fuse) exploded = true;

    // Out of bounds sides / bottom
    if (p.x < -20 || p.x > state.width + 20 || p.y > state.height + 20) {
      state.projectiles.splice(i, 1); continue;
    }

    // Terrain collision
    if (!exploded && terrainAt(state, p.x, p.y)) {
      if (w.id === "grenade") {
        // Bounce
        // Estimate normal via terrain sampling
        const nx = terrainAt(state, p.x - 3, p.y) ? 1 : terrainAt(state, p.x + 3, p.y) ? -1 : 0;
        const ny: number = terrainAt(state, p.x, p.y - 3) ? 1 : 0;
        p.x -= p.vx * dt * 1.2; p.y -= p.vy * dt * 1.2;
        if (nx !== 0) p.vx = -p.vx * 0.55;
        if (ny !== 0 || p.vy > 0) p.vy = -p.vy * 0.55;
        if (Math.abs(p.vx) + Math.abs(p.vy) < 40) p.vy += 20;
      } else {
        exploded = true;
      }
    }

    // Dog collision
    if (!exploded) {
      for (const dog of state.dogs) {
        if (dog.hp <= 0) continue;
        if (dog.team === p.ownerTeam && p.age < 0.15) continue;
        const dx = p.x - dog.x, dy = p.y - (dog.y - 8);
        if (dx * dx + dy * dy < 260) { exploded = true; break; }
      }
    }

    if (exploded) {
      spawnExplosion(state, p.x, p.y, w.radius, w.color);
      applyExplosionDamage(state, p.x, p.y, w.radius, w.damage);
      state.projectiles.splice(i, 1);
    }
  }

  // Update explosions
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const e = state.explosions[i];
    e.age += dt;
    for (const pt of e.particles) {
      pt.vy += 220 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    e.particles = e.particles.filter(pt => pt.life > 0);
    if (e.age > e.maxAge + 1.2) state.explosions.splice(i, 1);
  }

  // Check win
  if (state.phase !== "gameover") {
    const alive0 = state.dogs[0].hp > 0;
    const alive1 = state.dogs[1].hp > 0;
    if (!alive0 || !alive1) {
      state.phase = "gameover";
      state.winner = alive0 ? 0 : alive1 ? 1 : null;
      state.message = state.winner === null
        ? "Empate!"
        : `Vitória do jogador ${state.winner === 0 ? "Verde" : "Vermelho"}!`;
    }
  }

  // Phase transitions
  if (state.phase === "firing" && state.projectiles.length === 0) {
    state.phase = "resolving";
  }
  if (state.phase === "resolving") {
    // Wait for dogs to settle
    const settled = state.dogs.every(d => Math.abs(d.vy) < 2);
    if (settled) endTurn(state);
  }

  if (state.phase === "aiming") {
    state.turnTimer -= dt;
    if (state.turnTimer <= 0) {
      state.message = "Tempo esgotado!";
      endTurn(state);
    }
  }
}

export function endTurn(state: GameState) {
  if (state.phase === "gameover") return;
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.phase = "aiming";
  state.turnTimer = MAX_TURN_TIME;
  state.wind = Math.max(-1, Math.min(1, state.wind + (Math.random() - 0.5) * 0.6));
  // Refresh angle so it points toward opponent naturally
  const dog = state.dogs[state.currentPlayer];
  const other = state.dogs[1 - state.currentPlayer];
  dog.facing = other.x > dog.x ? 1 : -1;
  state.angle = 45;
  state.message = `Vez do jogador ${state.currentPlayer === 0 ? "Verde" : "Vermelho"}`;
}

export function cycleWeapon(state: GameState, dir: 1 | -1) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const idx = WEAPON_ORDER.indexOf(state.weapon);
  for (let i = 1; i <= WEAPON_ORDER.length; i++) {
    const next = WEAPON_ORDER[(idx + dir * i + WEAPON_ORDER.length) % WEAPON_ORDER.length];
    if (state.ammo[next] !== 0) { state.weapon = next; return; }
  }
}

export function setWeapon(state: GameState, id: WeaponId) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  if (state.ammo[id] === 0) return;
  state.weapon = id;
}
