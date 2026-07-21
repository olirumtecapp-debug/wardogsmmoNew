import type { Barricade, BarricadeKind, Dog, Explosion, GameMode, GameState, Projectile, WeaponId } from "./types";
import { WEAPONS, WEAPON_ORDER, initialAmmo } from "./weapons";
import { markTerrainDirty } from "./render";
import { getActiveScenario } from "./scenarios";
import { CHARACTERS, type CharacterId } from "./characters";
import { playSfx } from "./audio";

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
  topReserve = 0,
): GameState {
  const rng = mulberry32(seed);
  const usableH = Math.max(200, height - hudReserve - topReserve);
  const terrain = generateTerrain(width, height, usableH, topReserve, rng);
  const terrainBottom = Math.min(height, usableH + topReserve);
  // 1) Barricadas primeiro (sem restrição de proximidade de cães).
  const barricades = spawnBarricades(terrain, width, height, rng);
  // 1.5) Obstáculos flutuantes (balões) — mesma máscara/erosão, só arte diferente.
  spawnFloatingObstacles(terrain, barricades, width, height, topReserve, rng);
  // 2) Cães podem nascer no chão OU em cima de uma barricada/pilha na sua metade.
  const dogs = placeDogs(terrain, barricades, width, height, rng, chars, terrainBottom);
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
    turnTimeLimit: MAX_TURN_TIME,
    matchTimer: dur,
    matchDuration: dur,
    mode,
    seed,
    hudReserve,
    topReserve,
    terrainBottom,
    matchStartGrace: 0.8,
    rageEnabled,
    barricades,
    teleportAiming: null,
  };
}


function spawnBarricades(
  terrain: Uint8Array, w: number, h: number, rng: () => number,
): Barricade[] {
  const kinds: { k: BarricadeKind; w: number; h: number; weight: number }[] = [
    { k: "concrete", w: 40, h: 60, weight: 3 },
    { k: "sandbag", w: 50, h: 24, weight: 4 },
    { k: "container", w: 70, h: 40, weight: 3 },
    { k: "minitank", w: 60, h: 32, weight: 2 },
  ];
  const totalWeight = kinds.reduce((s, k) => s + k.weight, 0);
  function pickKind() {
    let r = rng() * totalWeight;
    for (const k of kinds) { r -= k.weight; if (r <= 0) return k; }
    return kinds[0];
  }
  const stackTop = kinds.filter(k => k.k === "sandbag" || k.k === "concrete");

  const out: Barricade[] = [];
  const stackCount = 3 + Math.floor(rng() * 3);
  const tries = stackCount * 10;
  const centerMin = w * 0.15;
  const centerMax = w * 0.85;
  let stacksPlaced = 0;

  function tryPlace(x: number, y: number, spec: { w: number; h: number }): boolean {
    for (const b of out) {
      if (x < b.x + b.w + 8 && x + spec.w + 8 > b.x && y < b.y + b.h + 4 && y + spec.h + 4 > b.y) return false;
    }
    return true;
  }
  function push(spec: { k: BarricadeKind; w: number; h: number }, x: number, y: number) {
    const mask = new Uint8Array(spec.w * spec.h);
    mask.fill(1);
    out.push({
      id: `b${out.length}_${Math.floor(rng() * 1e6)}`,
      x, y, w: spec.w, h: spec.h,
      x0: x, y0: y, w0: spec.w, h0: spec.h, mask,
      kind: spec.k,
    });
  }

  for (let t = 0; t < tries && stacksPlaced < stackCount; t++) {
    const base = pickKind();
    const cx = centerMin + rng() * (centerMax - centerMin);
    const sy = surfaceY(terrain, w, h, cx);
    if (sy >= h - 8) continue;
    const bx = Math.round(cx - base.w / 2);
    const by = Math.round(sy - base.h);
    if (!tryPlace(bx, by, base)) continue;
    push(base, bx, by);

    if ((base.k === "concrete" || base.k === "container" || base.k === "sandbag") && rng() < 0.55) {
      const extras = 1 + Math.floor(rng() * 2);
      let topY = by;
      for (let s = 0; s < extras; s++) {
        const spec = stackTop[Math.floor(rng() * stackTop.length)];
        const sx = Math.round(cx - spec.w / 2 + (rng() - 0.5) * Math.max(0, base.w - spec.w) * 0.6);
        const syy = topY - spec.h;
        if (syy < 8) break;
        if (!tryPlace(sx, syy, spec)) break;
        push(spec, sx, syy);
        topY = syy;
      }
    }
    stacksPlaced++;
  }
  return out;
}

// Balões/obstáculos flutuantes: mesma mecânica de barricada (máscara pixel, erosão),
// mas posicionados no ar — não são plataforma jogável, apenas atrapalham trajetórias.
function spawnFloatingObstacles(
  terrain: Uint8Array, out: Barricade[], w: number, h: number, topReserve: number, rng: () => number,
): void {
  const count = 2 + Math.floor(rng() * 3); // 2..4
  const bw = 44, bh = 34;
  const minY = topReserve + 20;
  const tries = count * 12;
  let placed = 0;
  for (let t = 0; t < tries && placed < count; t++) {
    const cx = w * 0.12 + rng() * (w * 0.76);
    const groundY = surfaceY(terrain, w, h, cx);
    const maxY = groundY - 60;
    if (maxY - minY < 40) continue;
    const cy = minY + rng() * (maxY - minY);
    const bx = Math.round(cx - bw / 2);
    const by = Math.round(cy - bh / 2);
    // Distância mínima horizontal a outros balões e barricadas.
    let ok = true;
    for (const b of out) {
      if (bx < b.x0 + b.w0 + 24 && bx + bw + 24 > b.x0 && by < b.y0 + b.h0 + 16 && by + bh + 16 > b.y0) {
        ok = false; break;
      }
    }
    if (!ok) continue;
    const mask = new Uint8Array(bw * bh);
    // Máscara elíptica (formato balão) — o resto fica transparente e não colide.
    const rx = bw / 2 - 1, ry = 12; // corpo do balão (elipse superior)
    const ecx = bw / 2, ecy = 12;
    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const dx = (px - ecx) / rx, dy = (py - ecy) / ry;
        if (dx * dx + dy * dy <= 1) mask[py * bw + px] = 1;
      }
    }
    // Cesta (retângulo pequeno pendurado)
    const cbw = 14, cbh = 8;
    const cbx = Math.floor((bw - cbw) / 2);
    const cby = bh - cbh - 1;
    for (let py = cby; py < cby + cbh; py++) {
      for (let px = cbx; px < cbx + cbw; px++) mask[py * bw + px] = 1;
    }
    out.push({
      id: `f${out.length}_${Math.floor(rng() * 1e6)}`,
      x: bx, y: by, w: bw, h: bh,
      x0: bx, y0: by, w0: bw, h0: bh, mask,
      kind: "balloon",
    });
    placed++;
  }
}




function generateTerrain(w: number, h: number, usableH: number, topReserve: number, rng: () => number): Uint8Array {
  const terrain = new Uint8Array(w * h);
  const heights = new Float32Array(w);
  const baseline = usableH * 0.60;
  const amp = usableH * 0.20;
  const octaves = [
    { freq: 0.0012, amp: amp * 0.55, phase: rng() * Math.PI * 2 }, // grandes elevações
    { freq: 0.003,  amp: amp * 0.30, phase: rng() * Math.PI * 2 }, // colinas médias
    { freq: 0.008,  amp: amp * 0.18, phase: rng() * Math.PI * 2 }, // ondulações
    { freq: 0.020,  amp: amp * 0.08, phase: rng() * Math.PI * 2 }, // rochas
    { freq: 0.055,  amp: amp * 0.03, phase: rng() * Math.PI * 2 }, // detalhe fino
  ];
  for (let x = 0; x < w; x++) {
    let y = baseline;
    for (const o of octaves) y += Math.sin(x * o.freq + o.phase) * o.amp;
    heights[x] = Math.max(usableH * 0.35, Math.min(usableH - 8, y));
  }

  // Suavização nas zonas de spawn (achata plataformas iniciais dos cães)
  const flattenBand = (start: number, end: number) => {
    const s = Math.floor(w * start);
    const e = Math.floor(w * end);
    if (e - s < 4) return;
    let sum = 0;
    for (let x = s; x < e; x++) sum += heights[x];
    const avg = sum / (e - s);
    for (let x = s; x < e; x++) {
      // mistura 70% média + 30% valor original — plataforma estável mas não totalmente reta
      heights[x] = heights[x] * 0.3 + avg * 0.7;
    }
  };
  flattenBand(0.08, 0.22);
  flattenBand(0.78, 0.92);

  // Garante cobertura mínima: pelo menos 60% das colunas têm terreno alto o bastante
  const minTop = usableH - 20;
  let goodCols = 0;
  for (let x = 0; x < w; x++) if (heights[x] < minTop) goodCols++;
  if (goodCols / w < 0.6) {
    const lift = usableH * 0.08;
    for (let x = 0; x < w; x++) heights[x] = Math.max(usableH * 0.35, heights[x] - lift);
  }

  // Aplica topReserve e desenha o terreno sólido
  for (let x = 0; x < w; x++) heights[x] += topReserve;
  const bottom = Math.min(h, usableH + topReserve);
  for (let x = 0; x < w; x++) {
    const top = Math.floor(heights[x]);
    for (let y = top; y < bottom; y++) terrain[y * w + x] = 1;
  }
  return terrain;
}


function placeDogs(
  terrain: Uint8Array, barricades: Barricade[], w: number, h: number,
  rng: () => number, chars: [CharacterId, CharacterId], terrainBottom: number,
): [Dog, Dog] {
  const mk = (x: number, y: number, team: 0 | 1, facing: 1 | -1, charId: CharacterId): Dog => {
    const c = CHARACTERS[charId];
    return {
      x, y, vy: 0,
      hp: c.stats.hp, maxHp: c.stats.hp,
      team, facing, aliveTicks: 0, airborne: false,
      moveBudget: c.stats.mobility, moveMax: c.stats.mobility,
      jumpScale: c.stats.jump, defense: c.stats.defense,
      charId, hasJumped: false,
      rageCharge: 0, rageActive: false,
      specialCharge: 0,
    };
  };

  // Escolhe (x, y) para o time. 60% em cima de uma barricada elegível, se houver.
  function pickSpawn(team: 0 | 1, occupiedX: number | null): { x: number; y: number } {
    const zoneMin = team === 0 ? w * 0.08 : w * 0.58;
    const zoneMax = team === 0 ? w * 0.42 : w * 0.92;
    // Candidatos: barricadas cuja coluna central cai na zona do time.
    const candidates: Array<{ x: number; y: number }> = [];
    for (const b of barricades) {
      if (b.kind === "balloon") continue; // flutuante — não spawn em cima
      const cx = b.x0 + b.w0 / 2;
      if (cx < zoneMin || cx > zoneMax) continue;
      if (b.w0 < 20) continue;
      // Topo real via máscara.
      let topLy = -1;
      const midLx = Math.floor(b.w0 / 2);
      for (let ly = 0; ly < b.h0; ly++) {
        if (b.mask[ly * b.w0 + midLx]) { topLy = ly; break; }
      }
      if (topLy < 0) continue;
      const topY = b.y0 + topLy;
      const groundY = surfaceY(terrain, w, h, cx);
      // Precisa estar razoavelmente acima do chão pra fazer sentido "em cima".
      if (groundY - topY < 12) continue;
      if (occupiedX !== null && Math.abs(cx - occupiedX) < 60) continue;
      candidates.push({ x: Math.round(cx), y: topY - 18 });
    }
    if (candidates.length > 0 && rng() < 0.6) {
      return candidates[Math.floor(rng() * candidates.length)];
    }
    // Fallback: chão com pequena variação horizontal.
    const baseX = team === 0 ? 0.15 : 0.85;
    const jitter = ((rng() - 0.5) * 2 * 40) / w;
    const fx = Math.floor(w * Math.max(0.08, Math.min(0.92, baseX + jitter)));
    const sy = surfaceY(terrain, w, h, fx);
    const fy = Math.min(sy - 18, terrainBottom - 20);
    return { x: fx, y: fy };
  }

  const s0 = pickSpawn(0, null);
  const s1 = pickSpawn(1, s0.x);
  return [mk(s0.x, s0.y, 0, 1, chars[0]), mk(s1.x, s1.y, 1, -1, chars[1])];
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

  // Teleport is a utility weapon — requires a valid target picked beforehand.
  if (weapon.id === "teleport") {
    const t = state.teleportAiming;
    if (!t || !t.valid) return;
    if (state.ammo[state.weapon] > 0) state.ammo[state.weapon]--;
    executeTeleport(state, t.x, t.y);
    state.teleportAiming = null;
    return;
  }

  if (state.chaosWind) {
    const sc = getActiveScenario();
    state.wind = (Math.random() - 0.5) * 2 * Math.max(1, sc.windScale);
  }
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
  playSfx("fire");
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
  if (radius >= 10) playSfx("explosion", Math.min(1.2, radius / 60));
}

export function applyExplosionDamage(state: GameState, x: number, y: number, radius: number, damage: number, ownerTeam?: 0 | 1) {
  destroyTerrain(state, x, y, radius);
  erodeBarricades(state, x, y, radius);
  state.scorchMarks.push({ x, y, radius: radius * 1.05, life: 6, maxLife: 6 });
  state.onExplosion?.(x, y, radius);

  // Shooter (if any) for rage accumulation
  const shooter = ownerTeam !== undefined ? state.dogs.find(d => d.team === ownerTeam) : undefined;
  const dmgMult = shooter?.rageActive ? RAGE_DAMAGE_MULT : 1;
  let totalDamage = 0;
  let hits = 0;
  let selfDamage = 0;
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
        if (ownerTeam !== undefined && dog.team === ownerTeam) {
          selfDamage += dmg;
        }
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
        // Bombardeio Canino: carrega em todos os modos ao acertar inimigo
        if (shooter && dog.team !== ownerTeam) {
          const gain = Math.min(45, 8 + dmg * 0.7);
          shooter.specialCharge = Math.min(100, shooter.specialCharge + gain);
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
  // Contra-golpe: se o atirador se explodiu, o adversário vivo recupera 40% do dano.
  if (selfDamage > 0 && ownerTeam !== undefined) {
    const foe = state.dogs.find(d => d.team !== ownerTeam && d.hp > 0);
    if (foe && foe.hp < foe.maxHp) {
      const heal = Math.max(1, Math.round(selfDamage * 0.4));
      const applied = Math.min(heal, foe.maxHp - foe.hp);
      if (applied > 0) {
        foe.hp += applied;
        state.floatingTexts.push({
          id: Math.random(), x: foe.x, y: foe.y - 46,
          vx: 0, vy: -60, life: 1.6, maxLife: 1.6,
          value: `+${applied} CONTRA-GOLPE`,
          color: "#7cff8a", size: 22,
        });
        state.message = `Contra-golpe! Adversário recuperou ${applied} HP`;
      }
    }
  }
}


// Barricade helpers (mask-based: barricades erode pixel by pixel like terrain)
export function barricadeAt(state: GameState, x: number, y: number): Barricade | null {
  const xi = Math.floor(x), yi = Math.floor(y);
  for (const b of state.barricades) {
    const lx = xi - b.x0, ly = yi - b.y0;
    if (lx < 0 || ly < 0 || lx >= b.w0 || ly >= b.h0) continue;
    if (b.mask[ly * b.w0 + lx]) return b;
  }
  return null;
}

function barricadeTopAt(state: GameState, x: number, y: number, tol = 2): Barricade | null {
  const xi = Math.floor(x);
  for (const b of state.barricades) {
    const lx = xi - b.x0;
    if (lx < 0 || lx >= b.w0) continue;
    for (let dy = -tol; dy <= 2; dy++) {
      const ly = Math.floor(y - b.y0) + dy;
      if (ly < 0 || ly >= b.h0) continue;
      if (b.mask[ly * b.w0 + lx]) {
        if (ly === 0 || !b.mask[(ly - 1) * b.w0 + lx]) return b;
        break;
      }
    }
  }
  return null;
}

// Robust "supported" check: sample a window across the dog's feet
function isSupported(state: GameState, dog: Dog): boolean {
  for (let dx = -4; dx <= 4; dx++) {
    const fy = dog.y + 19;
    if (terrainAt(state, dog.x + dx, fy)) return true;
    if (barricadeTopAt(state, dog.x + dx, fy)) return true;
  }
  return false;
}

// Highest solid surface (terrain top OR barricade top) at column x.
function surfaceOrBarricadeY(state: GameState, x: number): number {
  let sy = surfaceY(state.terrain, state.width, state.height, x);
  const xi = Math.floor(x);
  for (const b of state.barricades) {
    const lx = xi - b.x0;
    if (lx < 0 || lx >= b.w0) continue;
    for (let ly = 0; ly < b.h0; ly++) {
      if (b.mask[ly * b.w0 + lx]) {
        const yy = b.y0 + ly;
        if (yy < sy) sy = yy;
        break;
      }
    }
  }
  return sy;
}

// Erode barricades hit by an explosion: destroy pixels within the blast circle.
// Barricades are treated like terrain — they shrink progressively and open holes
// where hit, but stay on the map until almost fully destroyed.
function erodeBarricades(state: GameState, cx: number, cy: number, r: number) {
  const rr = Math.max(2, r * 0.9);
  const rr2 = rr * rr;
  for (let i = state.barricades.length - 1; i >= 0; i--) {
    const b = state.barricades[i];
    if (cx + rr < b.x0 || cx - rr > b.x0 + b.w0 || cy + rr < b.y0 || cy - rr > b.y0 + b.h0) continue;
    const lx0 = Math.max(0, Math.floor(cx - rr - b.x0));
    const lx1 = Math.min(b.w0 - 1, Math.ceil(cx + rr - b.x0));
    const ly0 = Math.max(0, Math.floor(cy - rr - b.y0));
    const ly1 = Math.min(b.h0 - 1, Math.ceil(cy + rr - b.y0));
    let changed = false;
    for (let ly = ly0; ly <= ly1; ly++) {
      const dy = (b.y0 + ly) - cy;
      for (let lx = lx0; lx <= lx1; lx++) {
        const dx = (b.x0 + lx) - cx;
        if (dx * dx + dy * dy <= rr2) {
          const idx = ly * b.w0 + lx;
          if (b.mask[idx]) { b.mask[idx] = 0; changed = true; }
        }
      }
    }
    if (!changed) continue;
    b._dirty = true;
    // Recompute effective AABB + live-pixel count.
    let minX = b.w0, maxX = -1, minY = b.h0, maxY = -1, live = 0;
    for (let ly = 0; ly < b.h0; ly++) {
      for (let lx = 0; lx < b.w0; lx++) {
        if (b.mask[ly * b.w0 + lx]) {
          live++;
          if (lx < minX) minX = lx;
          if (lx > maxX) maxX = lx;
          if (ly < minY) minY = ly;
          if (ly > maxY) maxY = ly;
        }
      }
    }
    const total = b.w0 * b.h0;
    if (live < total * 0.08 || maxX - minX < 6 || maxY - minY < 6) {
      state.barricades.splice(i, 1);
      continue;
    }
    b.x = b.x0 + minX;
    b.y = b.y0 + minY;
    b.w = maxX - minX + 1;
    b.h = maxY - minY + 1;
  }
}


// How many solid pixels exist in a short vertical window just below the dog's feet.
function columnDepth(state: GameState, x: number, fromY: number, span = 24): number {
  let count = 0;
  for (let dy = 0; dy < span; dy++) {
    if (terrainAt(state, x, fromY + dy)) count++;
  }
  return count;
}

// True when the dog has essentially no ground under it across a small horizontal window.
function noGroundBeneath(state: GameState, dog: Dog): boolean {
  let solid = 0;
  for (let dx = -6; dx <= 6; dx += 2) {
    solid += columnDepth(state, dog.x + dx, dog.y + 19, 20);
  }
  return solid < 6;
}

// Find a safe rescue column: solid depth >= 12px, headroom >= 30px, far from the current x.
function findRescueColumn(state: GameState, dog: Dog): number {
  let best = dog.x;
  let bestScore = -Infinity;
  for (let x = 24; x < state.width - 24; x += 6) {
    const sy = surfaceY(state.terrain, state.width, state.height, x);
    if (sy >= state.terrainBottom - 4) continue;
    const depth = columnDepth(state, x, sy, 24);
    if (depth < 12) continue;
    if (sy < 40) continue; // headroom
    const dist = Math.abs(x - dog.x);
    if (dist < 40) continue;
    // Prefer nearer safe columns but require the min distance above.
    const score = -dist + depth * 0.5;
    if (score > bestScore) { bestScore = score; best = x; }
  }
  return best;
}

export function step(state: GameState, dt: number) {
  const scGravity = getActiveScenario().gravityScale;
  if (state.matchStartGrace && state.matchStartGrace > 0) {
    state.matchStartGrace = Math.max(0, state.matchStartGrace - dt);
  }


  // Dogs — gravity + fall damage
  for (const dog of state.dogs) {
    if (dog.hp <= 0) continue;
    dog.aliveTicks++;
    if (dog.rescueCooldown && dog.rescueCooldown > 0) {
      dog.rescueCooldown = Math.max(0, dog.rescueCooldown - dt);
    }

    let rescuedThisFrame = false;

    // Proactive rescue: no viable ground beneath — teleport before oscillation starts.
    if (!state.matchStartGrace && !dog.rescueCooldown && noGroundBeneath(state, dog)) {
      const rescueX = findRescueColumn(state, dog);
      if (rescueX !== dog.x) {
        const sy = surfaceY(state.terrain, state.width, state.height, rescueX);
        dog.x = rescueX;
        dog.y = sy - 18;
        dog.vy = 0;
        dog.airborne = false;
        dog.fallStartY = undefined;
        dog.unsupportedTicks = 0;
        dog.hasJumped = false;
        dog.moveBudget = Math.max(dog.moveBudget, Math.round(dog.moveMax * 0.5));
        dog.rescueCooldown = 1.2;
        const dmg = Math.round(10 * dog.defense);
        dog.hp = Math.max(1, dog.hp - dmg);
        state.floatingTexts.push({
          id: Math.random(), x: dog.x, y: dog.y - 32, vx: 0, vy: -70,
          life: 1.4, maxLife: 1.4, value: `RESGATE -${dmg} HP`,
          color: "#ffb84a", size: 18,
        });
        rescuedThisFrame = true;
      }
    }

    if (!rescuedThisFrame) {
      const supported = isSupported(state, dog);
      // Debounce: require 2 consecutive unsupported frames before entering airborne,
      // preventing single-pixel oscillation on jagged crater edges.
      if (!supported) {
        dog.unsupportedTicks = (dog.unsupportedTicks ?? 0) + 1;
      } else {
        dog.unsupportedTicks = 0;
      }

      const treatAirborne = (dog.unsupportedTicks ?? 0) >= 2 || (dog.airborne && !supported) || dog.vy < 0;

      if (treatAirborne) {
        if (!dog.airborne) {
          dog.airborne = true;
          dog.fallStartY = dog.y;
        }
        dog.vy += GRAVITY * scGravity * dt;
        dog.y += dog.vy * dt;

        // land check — only pouso real se coluna tem base sólida
        if (isSupported(state, dog) && dog.vy >= 0) {
          const beneath = columnDepth(state, dog.x, dog.y + 19, 12);
          if (beneath >= 4) {
            const startY = dog.fallStartY ?? dog.y;
            const fallDist = dog.y - startY;
            const sy = surfaceY(state.terrain, state.width, state.height, dog.x);
            dog.y = sy - 18;
            dog.vy = 0;
            dog.airborne = false;
            dog.fallStartY = undefined;
            dog.unsupportedTicks = 0;
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
        }
      } else if (supported) {
        // resting — snap to surface, kill vy
        dog.vy = 0;
        dog.airborne = false;
        dog.fallStartY = undefined;
        const sy = surfaceY(state.terrain, state.width, state.height, dog.x);
        if (Math.abs((sy - 18) - dog.y) > 2) dog.y = sy - 18;
      }

      // Off-world rescue (fell through everything)
      const rescueThreshold = state.terrainBottom + 20;
      if (!state.matchStartGrace && !dog.rescueCooldown && dog.y > rescueThreshold) {
        const rescueX = findRescueColumn(state, dog);
        const sy = surfaceY(state.terrain, state.width, state.height, rescueX);
        dog.x = rescueX;
        dog.y = sy - 18;
        dog.vy = 0;
        dog.airborne = false;
        dog.fallStartY = undefined;
        dog.unsupportedTicks = 0;
        dog.hasJumped = false;
        dog.moveBudget = Math.max(dog.moveBudget, Math.round(dog.moveMax * 0.5));
        dog.rescueCooldown = 1.2;
        const dmg = Math.round(10 * dog.defense);
        dog.hp = Math.max(1, dog.hp - dmg);
        state.floatingTexts.push({
          id: Math.random(), x: dog.x, y: dog.y - 32, vx: 0, vy: -70,
          life: 1.4, maxLife: 1.4, value: `RESGATE -${dmg} HP`,
          color: "#ffb84a", size: 18,
        });
      }
    }

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

    // Barricade hit — behave exactly like terrain: bounce for grenade/frag, explode otherwise.
    // Erosion of the barricade happens through the explosion (see erodeBarricades).
    const hitBarricade = !exploded ? barricadeAt(state, p.x, p.y) : null;
    if (hitBarricade) {
      if (w.id === "grenade" || w.id === "frag") {
        p.x -= p.vx * dt * 1.2; p.y -= p.vy * dt * 1.2;
        p.vx = -p.vx * 0.5; p.vy = -p.vy * 0.5;
      } else {
        exploded = true;
      }
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
      // Armas com fuse (granada/frag/cluster/sub) NÃO detonam por proximidade —
      // só por tempo, terreno ou barricada. Evita "explode no ar" próximo ao alvo.
      const proximityArm = !w.fuse;
      if (proximityArm) {
        for (const dog of state.dogs) {
          if (dog.hp <= 0) continue;
          if (dog.team === p.ownerTeam && p.age < 0.15) continue;
          if (dog.team !== p.ownerTeam && p.age < 0.05) continue;
          const dx = p.x - dog.x, dy = p.y - (dog.y - 8);
          const d2 = dx * dx + dy * dy;
          if (d2 > 170) continue; // ~13px — hit realmente próximo
          // Precisa estar se aproximando (produto escalar velocidade·(dog-proj) > 0)
          const toDogX = dog.x - p.x, toDogY = (dog.y - 8) - p.y;
          if (p.vx * toDogX + p.vy * toDogY < 0) continue;
          exploded = true; break;
        }
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
  state.teleportAiming = null;
  state.turnTimer = state.turnTimeLimit ?? MAX_TURN_TIME;
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
  const limit = state.turnTimeLimit ?? MAX_TURN_TIME;
  state.turnTimer = Math.min(limit + RAGE_TURN_BONUS, state.turnTimer + RAGE_TURN_BONUS);
  state.message = "MODO FÚRIA ATIVADO";
  state.floatingTexts.push({
    id: Math.random(), x: dog.x, y: dog.y - 40, vx: 0, vy: -60,
    life: 1.6, maxLife: 1.6, value: "FÚRIA!", color: "#ff3838", size: 30,
  });
  playSfx("rage");
  return "activated";
}


export function moveDog(state: GameState, dir: 1 | -1, dt: number) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const dog = state.dogs[state.currentPlayer];
  if (dog.hp <= 0 || dog.airborne || dog.moveBudget <= 0) return;
  let dx = dir * MOVE_SPEED * dt;
  if (Math.abs(dx) > dog.moveBudget) dx = dir * dog.moveBudget;
  const newX = Math.max(10, Math.min(state.width - 10, dog.x + dx));
  const currentSurface = surfaceOrBarricadeY(state, dog.x);
  const targetSurface = surfaceOrBarricadeY(state, newX);
  // Block if we'd enter the side of a tall barricade (step-up too big)
  if (currentSurface - targetSurface > STEP_UP) return;
  // Block if the new position would clip through a barricade body
  if (barricadeAt(state, newX, targetSurface - 10) || barricadeAt(state, newX, targetSurface + 10)) return;
  dog.x = newX;
  dog.y = targetSurface - 18;
  dog.moveBudget -= Math.abs(dx);
  dog.facing = dir;
}

export function jumpDog(state: GameState) {
  if (state.phase !== "aiming" || state.winner !== null) return;
  const dog = state.dogs[state.currentPlayer];
  if (dog.hp <= 0 || dog.airborne || dog.hasJumped) return;
  dog.vy = JUMP_VY * dog.jumpScale;
  dog.airborne = true;
  dog.fallStartY = dog.y;
  dog.hasJumped = true;
  playSfx("jump");
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
  state.teleportAiming = null;
}

export const SPECIAL_READY_THRESHOLD = 65;

/**
 * Bombardeio Canino — ataque especial automático.
 * Ao carregar 100%, spawn 8 projéteis do tipo airstrike caindo em cima do inimigo.
 * Retorna "activated" | "low" | "unavailable".
 */
export function triggerCanineBarrage(state: GameState): "activated" | "low" | "unavailable" {
  if (state.winner !== null || state.phase !== "aiming") return "unavailable";
  const dog = state.dogs[state.currentPlayer];
  if (!dog || dog.hp <= 0) return "unavailable";
  if (dog.specialCharge < SPECIAL_READY_THRESHOLD) return "low";
  const enemy = state.dogs[1 - state.currentPlayer];
  if (!enemy) return "unavailable";
  dog.specialCharge = 0;
  state.phase = "firing";
  state.message = "BOMBARDEIO CANINO!";
  state.floatingTexts.push({
    id: Math.random(), x: state.width / 2, y: 40, vx: 0, vy: 0,
    life: 2.2, maxLife: 2.2, value: "⚡ BOMBARDEIO CANINO",
    color: "#ffdc4a", size: 32,
  });
  const targetX = enemy.x;
  state.airstrikeMarker = { x: targetX, life: 2.4 };
  const spawnBomb = (k: number) => {
    state.projectiles.push({
      x: targetX + (k - 3.5) * 30 + (Math.random() - 0.5) * 20,
      y: 20,
      vx: (Math.random() - 0.5) * 30,
      vy: 260,
      weapon: "airstrike",
      age: 0,
      ownerTeam: state.currentPlayer,
      trail: [],
    });
  };
  for (let i = 0; i < 8; i++) {
    setTimeout(() => spawnBomb(i), i * 180);
  }
  playSfx("barrage");
  return "activated";
}

// ============ Teleport ============

export const TELEPORT_MAX_RANGE = 320;
export const TELEPORT_HP_COST = 5;

export function isValidTeleportTarget(state: GameState, tx: number, ty: number): boolean {
  const dog = state.dogs[state.currentPlayer];
  if (!dog || dog.hp <= 0) return false;
  if (tx < 24 || tx > state.width - 24) return false;
  const dist = Math.hypot(tx - dog.x, ty - dog.y);
  const maxR = Math.min(TELEPORT_MAX_RANGE, state.width * 0.5);
  if (dist > maxR) return false;
  // ground column beneath target must be solid
  const sy = surfaceOrBarricadeY(state, tx);
  if (sy >= state.terrainBottom - 4) return false;
  if (sy < 40) return false;
  // Reject if the drop point is inside a barricade body
  if (barricadeAt(state, tx, sy + 4)) return false;
  return true;
}

export function setTeleportTarget(state: GameState, tx: number, ty: number) {
  if (state.weapon !== "teleport" || state.phase !== "aiming") return;
  const valid = isValidTeleportTarget(state, tx, ty);
  state.teleportAiming = { x: tx, y: ty, valid };
}

export function clearTeleportTarget(state: GameState) {
  state.teleportAiming = null;
}

// Tolerance (in world pixels) around the current teleport mark that a
// second tap should treat as "confirm" instead of "move mark".
export const TELEPORT_CONFIRM_TOL = 42;

// Confirm the current teleport target. Returns true when the teleport
// actually executed. Callers should treat `false` as "keep aiming".
export function confirmTeleport(state: GameState): boolean {
  if (state.weapon !== "teleport" || state.phase !== "aiming") return false;
  const t = state.teleportAiming;
  if (!t || !t.valid) return false;
  if ((state.ammo.teleport ?? 0) <= 0) return false;
  state.ammo.teleport = Math.max(0, (state.ammo.teleport ?? 0) - 1);
  executeTeleport(state, t.x, t.y);
  state.teleportAiming = null;
  return true;
}


function executeTeleport(state: GameState, tx: number, _ty: number) {
  const dog = state.dogs[state.currentPlayer];
  const sy = surfaceOrBarricadeY(state, tx);
  // dissipation FX at origin
  spawnExplosion(state, dog.x, dog.y - 8, 18, "#38f0ff");
  dog.x = tx;
  dog.y = sy - 18;
  dog.vy = 0;
  dog.airborne = false;
  dog.fallStartY = undefined;
  dog.unsupportedTicks = 0;
  dog.hp = Math.max(1, dog.hp - TELEPORT_HP_COST);
  // materialization FX at destination
  spawnExplosion(state, dog.x, dog.y - 8, 18, "#38f0ff");
  state.floatingTexts.push({
    id: Math.random(), x: dog.x, y: dog.y - 40, vx: 0, vy: -60,
    life: 1.5, maxLife: 1.5, value: `TELEPORTE -${TELEPORT_HP_COST} HP`,
    color: "#7ff0ff", size: 20,
  });
  state.phase = "resolving";
  state.message = "Reposicionado!";
}

