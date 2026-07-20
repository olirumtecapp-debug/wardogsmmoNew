import type { Dog, Explosion, GameMode, GameState, Projectile, WeaponId } from "./types";
import { WEAPONS, WEAPON_ORDER, initialAmmo } from "./weapons";
import { markTerrainDirty } from "./render";
import { getActiveScenario } from "./scenarios";
import { CHARACTERS, type CharacterId } from "./characters";

const GRAVITY = 500; // px/s^2
const MAX_TURN_TIME = 30;
const RAGE_TURN_BONUS = 10; // segundos extras no turno em Fúria
const RAGE_DAMAGE_MULT = 1.4;
const RAGE_WIND_MULT = 0.5;
export const RAGE_READY_THRESHOLD = 60; // barra pronta para ativação
export const MATCH_DURATION_DEFAULT = 300; // 5 minutos
export const MOVE_BUDGET = 120; // px per turn (padrão para HUD)
const MOVE_SPEED = 95; // px/s
const STEP_UP = 14; // max ledge height (px) to walk over
const JUMP_VY = -280;


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

export function createGame(
  width: number,
  height: number,
  mode: GameMode,
  seed = Date.now(),
  hudReserve = 150,
  chars: [CharacterId, CharacterId] = ["ranger", "brutus"],
  matchDuration: number = MATCH_DURATION_DEFAULT,
  rageEnabled: boolean = false,
): GameState {
  const rng = mulberry32(seed);
  const usableH = Math.max(200, height - hudReserve);
  const terrain = generateTerrain(width, height, usableH, rng);
  const dogs = placeDogs(terrain, width, height, rng, chars);
  const sc = getActiveScenario();
  const c0 = CHARACTERS[chars[0]];
  const dur = Math.max(0, matchDuration);
  return {
    width, height, terrain, dogs,
    projectiles: [], explosions: [],
    floatingTexts: [], scorchMarks: [],
    currentPlayer: 0,
    wind: (rng() - 0.5) * 2 * sc.windScale,
    angle: 45, power: 60,
    weapon: "bazooka",
    ammo: initialAmmo(),
    phase: "aiming",
    winner: null,
    message: mode === "ai" ? `Sua vez — ${c0.name}` : `Vez de ${c0.name}`,
    turnTimer: MAX_TURN_TIME,
    matchTimer: dur,
    matchDuration: dur,
    mode,
    seed,
    hudReserve,
    rageEnabled,
  };
}


function generateTerrain(w: number, h: number, usableH: number, rng: () => number): Uint8Array {
  const terrain = new Uint8Array(w * h);
  const heights = new Float32Array(w);
  const baseline = usableH * 0.62;
  const amp = usableH * 0.10;
  const octaves = [
    { freq: 0.002, amp: amp * 0.7, phase: rng() * Math.PI * 2 },
    { freq: 0.006, amp: amp * 0.25, phase: rng() * Math.PI * 2 },
    { freq: 0.015, amp: amp * 0.10, phase: rng() * Math.PI * 2 },
    { freq: 0.04, amp: amp * 0.04, phase: rng() * Math.PI * 2 },
  ];
  for (let x = 0; x < w; x++) {
    let y = baseline;
    for (const o of octaves) y += Math.sin(x * o.freq + o.phase) * o.amp;
    heights[x] = Math.max(usableH * 0.45, Math.min(usableH - 12, y));
  }
  for (let x = 0; x < w; x++) {
    const top = Math.floor(heights[x]);
    const bottom = Math.min(h, usableH);
    for (let y = top; y < bottom; y++) terrain[y * w + x] = 1;
  }
  return terrain;
}


function placeDogs(terrain: Uint8Array, w: number, h: number, rng: () => number, chars: [CharacterId, CharacterId]): [Dog, Dog] {
  const p1x = Math.floor(w * (0.10 + rng() * 0.10));
  const p2x = Math.floor(w * (0.80 + rng() * 0.10));
  const mk = (x: number, team: 0 | 1, facing: 1 | -1, charId: CharacterId): Dog => {
    const c = CHARACTERS[charId];
    return {
      x, y: surfaceY(terrain, w, h, x) - 18, vy: 0,
      hp: c.stats.hp, maxHp: c.stats.hp,
      team, facing, aliveTicks: 0, airborne: false,
      moveBudget: c.stats.mobility, moveMax: c.stats.mobility,
      jumpScale: c.stats.jump, defense: c.stats.defense,
      charId, hasJumped: false,
      rageCharge: 0, rageActive: false,
    };
  };

  return [mk(p1x, 0, 1, chars[0]), mk(p2x, 1, -1, chars[1])];
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
  const dir = dog.facing;

  // Airstrike: 3 rockets falling from the top of the screen at a target derived from angle+power
  if (weapon.id === "airstrike") {
    const targetX = Math.max(60, Math.min(state.width - 60, dog.x + dir * (state.power * 3.5)));
    state.airstrikeMarker = { x: targetX, life: 1.4 };
    const spawnBomb = (k: number) => {
      state.projectiles.push({
        x: targetX + (k - 1) * 44 + (Math.random() - 0.5) * 8,
        y: 20,
        vx: state.wind * 15,
        vy: 260,
        weapon: "airstrike",
        age: 0,
        ownerTeam: state.currentPlayer,
        trail: [],
      });
    };
    spawnBomb(0);
    setTimeout(() => spawnBomb(1), 350);
    setTimeout(() => spawnBomb(2), 700);
    return;
  }

  const rad = (state.angle * Math.PI) / 180;
  const v = state.power * weapon.speed * 0.6;
  const vx = Math.cos(rad) * v * dir;
  const vy = -Math.sin(rad) * v;
  const muzzleX = dog.x + dir * 18;
  const muzzleY = dog.y - 6;

  const p: Projectile = {
    x: muzzleX, y: muzzleY, vx, vy,
    weapon: state.weapon, age: 0, ownerTeam: state.currentPlayer, trail: [],
  };
  state.projectiles.push(p);
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

export function applyExplosionDamage(state: GameState, x: number, y: number, radius: number, damage: number, ownerTeam?: 0 | 1) {
  destroyTerrain(state, x, y, radius);
  state.scorchMarks.push({ x, y, radius: radius * 1.05, life: 6, maxLife: 6 });
  state.onExplosion?.(x, y, radius);
  // Shooter (if any) for rage accumulation
  const shooter = ownerTeam !== undefined ? state.dogs.find(d => d.team === ownerTeam) : undefined;
  const dmgMult = shooter?.rageActive ? RAGE_DAMAGE_MULT : 1;
  let totalDamage = 0;
  let hits = 0;
  const stackOffsets = new Map<number, number>();
  for (const dog of state.dogs) {
    if (dog.hp <= 0) continue;
    const dx = dog.x - x, dy = dog.y - 8 - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + 14) {
      const falloff = Math.max(0, 1 - dist / (radius + 14));
      const dmg = Math.round(damage * dmgMult * falloff * dog.defense);
      dog.hp = Math.max(0, dog.hp - dmg);
      const push = falloff * 180;
      dog.vy = -Math.abs(push * 0.6) - 40;
      dog.x += (dx / (dist || 1)) * push * 0.06;
      const key = Math.round(dog.x / 24);
      const stackIdx = stackOffsets.get(key) ?? 0;
      stackOffsets.set(key, stackIdx + 1);
      const color = dmg >= 40 ? "#ff3838" : dmg >= 20 ? "#ff9138" : dmg > 0 ? "#ffd93a" : "#b8b8b8";
      const size = dmg >= 40 ? 30 : dmg >= 20 ? 26 : 22;
      state.floatingTexts.push({
        id: Math.random(),
        x: dog.x,
        y: dog.y - 32 - stackIdx * 18,
        vx: (Math.random() - 0.5) * 30, vy: -70,
        life: 1.2, maxLife: 1.2,
        value: dmg > 0 ? `-${dmg}` : "0",
        color, size,
      });
      if (dmg > 0) {
        totalDamage += dmg;
        hits++;
        // Rage: acumula no atirador quando acerta inimigo (só na Campanha)
        if (state.rageEnabled && shooter && dog.team !== ownerTeam && !shooter.rageActive) {
          let gain = dmg >= 31 ? 85 : dmg >= 16 ? 55 : 35;
          if (dog.hp <= 0) gain += 15; // bônus por finalização
          shooter.rageCharge = Math.min(100, shooter.rageCharge + gain);
        }
        // Fúria de revanche: quem toma dano forte carrega um pouco também
        if (state.rageEnabled && dog.team !== ownerTeam && !dog.rageActive && dmg >= 20) {
          dog.rageCharge = Math.min(100, dog.rageCharge + 10);
        }
      }
    }
  }
  if (hits > 1) {
    state.floatingTexts.push({
      id: Math.random(), x, y: y - radius - 10, vx: 0, vy: -50,
      life: 1.4, maxLife: 1.4, value: `-${totalDamage} TOTAL`,
      color: "#ffe6a3", size: 22,
    });
  }
}


// Robust "supported" check: sample a window across the dog's feet
function isSupported(state: GameState, dog: Dog): boolean {
  for (let dx = -4; dx <= 4; dx++) {
    if (terrainAt(state, dog.x + dx, dog.y + 19)) return true;
  }
  return false;
}

export function step(state: GameState, dt: number) {
  const scGravity = getActiveScenario().gravityScale;

  // Dogs — gravity + fall damage
  for (const dog of state.dogs) {
    if (dog.hp <= 0) continue;
    dog.aliveTicks++;

    const supported = isSupported(state, dog);
    if (!supported) {
      if (!dog.airborne) {
        dog.airborne = true;
        dog.fallStartY = dog.y;
      }
      dog.vy += GRAVITY * scGravity * dt;
      dog.y += dog.vy * dt;

      // land check
      if (isSupported(state, dog)) {
        const startY = dog.fallStartY ?? dog.y;
        const fallDist = dog.y - startY;
        // snap to surface
        const sy = surfaceY(state.terrain, state.width, state.height, dog.x);
        dog.y = sy - 18;
        dog.vy = 0;
        dog.airborne = false;
        dog.fallStartY = undefined;
        // Fall damage — no damage under 45px, then linear up to 60
        if (fallDist > 45) {
          const dmg = Math.min(60, Math.round((fallDist - 45) * 0.4 * dog.defense));
          if (dmg > 0) {
            dog.hp = Math.max(0, dog.hp - dmg);
            state.floatingTexts.push({
              id: Math.random(), x: dog.x, y: dog.y - 32,
              vx: 0, vy: -70, life: 1.2, maxLife: 1.2,
              value: `-${dmg} QUEDA`,
              color: dmg >= 30 ? "#ff5238" : "#ffd93a",
              size: dmg >= 30 ? 24 : 20,
            });
          }
        }
      }
    } else {
      // resting — snap to surface, kill vy
      dog.vy = 0;
      dog.airborne = false;
      dog.fallStartY = undefined;
      const sy = surfaceY(state.terrain, state.width, state.height, dog.x);
      if (Math.abs((sy - 18) - dog.y) > 2) dog.y = sy - 18;
    }

    if (dog.y > (state.height - state.hudReserve) + 40) dog.hp = 0;
    dog.x = Math.max(10, Math.min(state.width - 10, dog.x));
  }

  // Airstrike marker fade
  if (state.airstrikeMarker) {
    state.airstrikeMarker.life -= dt;
    if (state.airstrikeMarker.life <= 0) state.airstrikeMarker = undefined;
  }

  // Projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    const w = WEAPONS[p.weapon];
    p.age += dt;

    if (w.id === "rpg" && p.age < 1.4) {
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const ux = p.vx / sp, uy = p.vy / sp;
      p.vx += ux * 260 * dt;
      p.vy += uy * 260 * dt;
    }
    p.vy += GRAVITY * w.gravityScale * dt;
    if (w.affectedByWind) {
      const shooter = state.dogs.find(d => d.team === p.ownerTeam);
      const windMul = shooter?.rageActive ? RAGE_WIND_MULT : 1;
      p.vx += state.wind * 40 * dt * windMul;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.trail.push([p.x, p.y]);
    if (p.trail.length > 24) p.trail.shift();

    if (w.id === "rpg" && Math.random() < 0.9) {
      state.explosions.push({
        x: p.x, y: p.y, radius: 4, age: 0.35, maxAge: 0.4,
        particles: [{
          x: p.x + (Math.random() - 0.5) * 3,
          y: p.y + (Math.random() - 0.5) * 3,
          vx: -p.vx * 0.15 + (Math.random() - 0.5) * 40,
          vy: -p.vy * 0.15 + (Math.random() - 0.5) * 40 - 10,
          life: 0.4 + Math.random() * 0.4,
          color: Math.random() < 0.5 ? "#4a4238" : "#ff9138",
        }],
      });
    }

    let exploded = false;

    // Fuse (grenade / frag)
    if (w.fuse && p.age >= w.fuse) exploded = true;

    if (p.x < -20 || p.x > state.width + 20 || p.y > state.height + 20) {
      state.projectiles.splice(i, 1); continue;
    }

    if (!exploded && terrainAt(state, p.x, p.y)) {
      if (w.id === "grenade" || w.id === "frag") {
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
      applyExplosionDamage(state, p.x, p.y, w.radius, w.damage, p.ownerTeam);

      // Cluster bomb: on first-stage explosion, spawn 4 short-fuse sub-grenades
      if (w.id === "cluster" && !p.isSub) {
        for (let k = 0; k < 4; k++) {
          const ang = -Math.PI / 2 + (k - 1.5) * 0.55;
          const sp = 160 + Math.random() * 40;
          state.projectiles.push({
            x: p.x, y: p.y - 6,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            weapon: "cluster",
            age: 0,
            ownerTeam: p.ownerTeam,
            trail: [],
            isSub: true,
          });
        }
      }
      state.projectiles.splice(i, 1);
    }
  }

  // Explosions
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

  // Floating texts
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const f = state.floatingTexts[i];
    f.vy += 90 * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.life -= dt;
    if (f.x < 24) f.x = 24;
    if (f.x > state.width - 24) f.x = state.width - 24;
    if (f.life <= 0) state.floatingTexts.splice(i, 1);
  }

  // Scorch marks
  for (let i = state.scorchMarks.length - 1; i >= 0; i--) {
    const s = state.scorchMarks[i];
    s.life -= dt;
    if (s.life <= 0) state.scorchMarks.splice(i, 1);
  }

  // Match timer — decrement whenever the fight is ongoing (skip se sem limite)
  if (state.phase !== "gameover" && state.matchDuration > 0) {
    state.matchTimer = Math.max(0, state.matchTimer - dt);
  }

  // Win check
  if (state.phase !== "gameover") {
    const alive0 = state.dogs[0].hp > 0;
    const alive1 = state.dogs[1].hp > 0;
    if (!alive0 || !alive1) {
      state.phase = "gameover";
      state.winner = alive0 ? 0 : alive1 ? 1 : null;
      state.message = state.winner === null
        ? "Empate!"
        : `Vitória de ${CHARACTERS[state.dogs[state.winner].charId].name.toUpperCase()}!`;
    } else if (state.matchDuration > 0 && state.matchTimer <= 0) {
      state.phase = "gameover";
      const hp0 = state.dogs[0].hp, hp1 = state.dogs[1].hp;
      state.winner = hp0 > hp1 ? 0 : hp1 > hp0 ? 1 : null;
      state.message = state.winner === null
        ? "Empate por tempo!"
        : `Tempo esgotado — vitória de ${CHARACTERS[state.dogs[state.winner].charId].name.toUpperCase()}!`;
    }
  }


  if (state.phase === "firing" && state.projectiles.length === 0) {
    state.phase = "resolving";
  }
  if (state.phase === "resolving") {
    // Wait for dogs to settle AND land
    const settled = state.dogs.every(d => d.hp <= 0 || (!d.airborne && Math.abs(d.vy) < 2));
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
  // Encerra Fúria de quem estava jogando
  const prev = state.dogs[state.currentPlayer];
  if (prev.rageActive) {
    prev.rageActive = false;
    prev.rageCharge = 0;
  }
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.phase = "aiming";
  state.turnTimer = MAX_TURN_TIME;
  const windScale = getActiveScenario().windScale;
  state.wind = Math.max(-1, Math.min(1, state.wind + (Math.random() - 0.5) * 0.6 * windScale));
  const dog = state.dogs[state.currentPlayer];
  const other = state.dogs[1 - state.currentPlayer];
  dog.facing = other.x > dog.x ? 1 : -1;
  dog.moveBudget = dog.moveMax;
  dog.hasJumped = false;
  state.angle = 45;
  // Auto-pick next available weapon if current is empty
  if (state.ammo[state.weapon] === 0) {
    const next = WEAPON_ORDER.find(w => state.ammo[w] !== 0);
    if (next) state.weapon = next;
  }
  state.message = `Vez de ${CHARACTERS[dog.charId].name.toUpperCase()}`;
  // Consome Fúria enfileirada (pedida no turno anterior enquanto o tiro resolvia)
  if (dog.rageQueued && dog.hp > 0 && dog.rageCharge >= RAGE_READY_THRESHOLD) {
    dog.rageQueued = false;
    activateRage(state);
  } else {
    dog.rageQueued = false;
  }
}

export function activateRage(state: GameState): "activated" | "queued" | "low" | "unavailable" {
  if (!state.rageEnabled || state.winner !== null) return "unavailable";
  const dog = state.dogs[state.currentPlayer];
  if (dog.hp <= 0 || dog.rageActive) return "unavailable";
  if (dog.rageCharge < RAGE_READY_THRESHOLD) return "low";
  if (state.phase !== "aiming") {
    dog.rageQueued = true;
    state.floatingTexts.push({
      id: Math.random(), x: dog.x, y: dog.y - 40, vx: 0, vy: -60,
      life: 1.4, maxLife: 1.4, value: "FÚRIA NO PRÓXIMO TURNO", color: "#ffb84a", size: 18,
    });
    return "queued";
  }
  dog.rageActive = true;
  state.turnTimer = Math.min(MAX_TURN_TIME + RAGE_TURN_BONUS, state.turnTimer + RAGE_TURN_BONUS);
  state.message = "MODO FÚRIA ATIVADO";
  state.floatingTexts.push({
    id: Math.random(), x: dog.x, y: dog.y - 40, vx: 0, vy: -60,
    life: 1.6, maxLife: 1.6, value: "FÚRIA!", color: "#ff3838", size: 30,
  });
  return "activated";
}


export function moveDog(state: GameState, dir: 1 | -1, dt: number) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const dog = state.dogs[state.currentPlayer];
  if (dog.hp <= 0 || dog.airborne || dog.moveBudget <= 0) return;
  let dx = dir * MOVE_SPEED * dt;
  if (Math.abs(dx) > dog.moveBudget) dx = dir * dog.moveBudget;
  const newX = Math.max(10, Math.min(state.width - 10, dog.x + dx));
  const currentSurface = surfaceY(state.terrain, state.width, state.height, dog.x);
  const targetSurface = surfaceY(state.terrain, state.width, state.height, newX);
  // Allow step-up up to STEP_UP; step-down always allowed (dog will fall)
  if (currentSurface - targetSurface <= STEP_UP) {
    dog.x = newX;
    dog.y = targetSurface - 18;
    dog.moveBudget -= Math.abs(dx);
    dog.facing = dir;
  }
}

export function jumpDog(state: GameState) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const dog = state.dogs[state.currentPlayer];
  if (dog.hp <= 0 || dog.airborne || dog.hasJumped) return;
  dog.vy = JUMP_VY * dog.jumpScale;
  dog.airborne = true;
  dog.fallStartY = dog.y;
  dog.hasJumped = true;
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
