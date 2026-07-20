import type { GameState, Explosion, WeaponId } from "./types";
import { WEAPONS } from "./weapons";
import { weaponColor, weaponAccent, type TeamSkin } from "./skins";
import { characterSkin } from "./characters";
import { getActiveScenario } from "./scenarios";
import rangerSideAsset from "@/assets/wardogs-ranger-side.png.asset.json";
import brutusSideAsset from "@/assets/wardogs-brutus-side.png.asset.json";

// Image asset cache — loaded once
function loadImg(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}
// In-game sprites use the side poses (both face right in the source art;
// drawDog flips horizontally via ctx.scale(facing, 1)).
const rangerImg = typeof window !== "undefined" ? loadImg(rangerSideAsset.url) : null;
const brutusImg = typeof window !== "undefined" ? loadImg(brutusSideAsset.url) : null;

// Per-scenario background cache
const scenarioBgCache: Record<string, HTMLImageElement> = {};
function getScenarioBg(url: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!scenarioBgCache[url]) scenarioBgCache[url] = loadImg(url);
  return scenarioBgCache[url];
}

let terrainCanvas: HTMLCanvasElement | null = null;
let terrainDirty = true;
let lastTerrainRef: Uint8Array | null = null;
let lastScenarioId: string | null = null;

// Twinkling stars, persistent between renders
let stars: { x: number; y: number; r: number; p: number }[] | null = null;

// Wind-borne dust particles
interface DustParticle { x: number; y: number; vx: number; vy: number; life: number; size: number; alpha: number }
let dustParticles: DustParticle[] = [];
let lastDustSpawn = 0;

export function markTerrainDirty() { terrainDirty = true; }

function ensureTerrainCanvas(state: GameState) {
  if (!terrainCanvas || terrainCanvas.width !== state.width || terrainCanvas.height !== state.height) {
    terrainCanvas = document.createElement("canvas");
    terrainCanvas.width = state.width;
    terrainCanvas.height = state.height;
    terrainDirty = true;
  }
  if (lastTerrainRef !== state.terrain) {
    lastTerrainRef = state.terrain;
    terrainDirty = true;
  }
  const scId = getActiveScenario().id;
  if (lastScenarioId !== scId) {
    lastScenarioId = scId;
    terrainDirty = true;
  }
  if (terrainDirty) {
    const sc = getActiveScenario();
    const [tR, tG, tB] = sc.terrainTop;
    const [mR, mG, mB] = sc.terrainMid;
    const [dR, dG, dB] = sc.terrainDeep;
    const tctx = terrainCanvas.getContext("2d")!;
    const img = tctx.createImageData(state.width, state.height);
    const t = state.terrain;
    const w = state.width, h = state.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const j = i * 4;
        if (t[i]) {
          const above = y > 0 && !t[i - w];
          const near1 = !above && y > 1 && !t[i - w * 2];
          const near2 = !above && !near1 && y > 3 && !t[i - w * 4];
          const depthT = Math.min(1, (y - Math.max(0, y - 40)) / 40);
          const n = ((x * 92837 + y * 12971) % 30) - 15;

          let r: number, g: number, b: number;
          if (above) {
            const gn = ((x * 17 + y * 31) % 20) - 10;
            r = tR + (gn >> 2); g = tG + (gn >> 1); b = tB + (gn >> 3);
          } else if (near1) {
            r = mR; g = mG; b = mB;
          } else if (near2) {
            r = Math.round((mR + dR) / 2); g = Math.round((mG + dG) / 2); b = Math.round((mB + dB) / 2);
          } else if (y > h * 0.72) {
            const nn = n >> 1;
            r = Math.max(0, dR - 20 + nn); g = Math.max(0, dG - 12 + nn); b = Math.max(0, dB - 4 + nn);
          } else {
            r = dR + (n >> 1); g = dG + (n >> 2); b = dB + (n >> 2);
            r = Math.max(0, r - Math.floor(depthT * 6));
            g = Math.max(0, g - Math.floor(depthT * 6));
          }

          if (!above && (
            (x > 0 && !t[i - 1]) ||
            (x < w - 1 && !t[i + 1]) ||
            (y > 0 && !t[i - w])
          )) {
            r = Math.max(0, r - 26); g = Math.max(0, g - 26); b = Math.max(0, b - 26);
          }

          if (!above && !near1 && ((x * 7 + y * 13) % 173 === 0)) {
            r = Math.max(0, r - 20); g = Math.max(0, g - 20); b = Math.max(0, b - 20);
          }

          img.data[j] = Math.min(255, Math.max(0, r));
          img.data[j + 1] = Math.min(255, Math.max(0, g));
          img.data[j + 2] = Math.min(255, Math.max(0, b));
          img.data[j + 3] = 0xff;
        } else {
          img.data[j + 3] = 0;
        }
      }
    }
    tctx.putImageData(img, 0, 0);

    // Draw individual grass tufts on top surface
    tctx.save();
    const sc2 = getActiveScenario();
    tctx.strokeStyle = `rgb(${Math.min(255, sc2.terrainTop[0] + 30)}, ${Math.min(255, sc2.terrainTop[1] + 20)}, ${Math.min(255, sc2.terrainTop[2] + 20)})`;
    tctx.lineWidth = 1;
    tctx.globalAlpha = 0.9;
    for (let x = 0; x < w; x += 3) {
      // find surface y
      let sy = -1;
      for (let y = 0; y < h; y++) {
        if (t[y * w + x]) { sy = y; break; }
      }
      if (sy < 0) continue;
      const seed = (x * 2654435761) >>> 0;
      const rnd = ((seed % 100) / 100);
      if (rnd < 0.35) continue;
      const len = 2 + rnd * 3;
      const lean = (rnd - 0.5) * 2;
      tctx.beginPath();
      tctx.moveTo(x + 0.5, sy);
      tctx.lineTo(x + 0.5 + lean, sy - len);
      tctx.stroke();
    }
    tctx.restore();

    terrainDirty = false;
  }
  return terrainCanvas;
}

function ensureStars(w: number, h: number, seed: number) {
  if (stars && stars.length && stars[0].x < w && stars[0].y < h) return stars;
  stars = [];
  let s = seed || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const count = Math.floor((w * h) / 12000);
  for (let i = 0; i < count; i++) {
    stars.push({ x: rand() * w, y: rand() * h * 0.55, r: 0.4 + rand() * 1.2, p: rand() * Math.PI * 2 });
  }
  return stars;
}

function updateDust(w: number, h: number, wind: number, dt: number, now: number) {
  // Spawn a few new particles per second based on wind strength
  const spawnRate = 8 + Math.abs(wind) * 40;
  if (now - lastDustSpawn > 1000 / spawnRate) {
    lastDustSpawn = now;
    const fromRight = wind < 0;
    dustParticles.push({
      x: fromRight ? w + 5 : -5,
      y: h * (0.15 + Math.random() * 0.7),
      vx: wind * (30 + Math.random() * 40) + (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 12,
      life: 4 + Math.random() * 3,
      size: 0.6 + Math.random() * 1.4,
      alpha: 0.15 + Math.random() * 0.25,
    });
  }
  for (const p of dustParticles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  dustParticles = dustParticles.filter(p => p.life > 0 && p.x > -20 && p.x < w + 20);
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width: w, height: h } = state;
  const now = performance.now();
  const dt = 1 / 60;

  // Sky gradient from scenario
  const sc = getActiveScenario();
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, sc.sky[0]);
  sky.addColorStop(0.45, sc.sky[1]);
  sky.addColorStop(0.85, sc.sky[2]);
  sky.addColorStop(1, sc.sky[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const bgImg = getScenarioBg(sc.bgImage);
  const keyArtActive = !!(bgImg && bgImg.complete && bgImg.naturalWidth > 0);

  if (keyArtActive) {
    const iw = bgImg!.naturalWidth;
    const ih = bgImg!.naturalHeight;
    // cover fit with per-scenario focal anchor
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const fx = sc.bgFocus?.x ?? 0.5;
    const fy = sc.bgFocus?.y ?? 0.5;
    const px = Math.sin(now * 0.00006) * 3;
    const dx = (w - dw) * fx + px;
    const dy = (h - dh) * fy;
    ctx.drawImage(bgImg!, dx, dy, dw, dh);

    // Scenario tint on top of background
    if (sc.tint) {
      ctx.save();
      ctx.globalCompositeOperation = sc.tintBlend;
      ctx.fillStyle = sc.tint;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Bottom fade for terrain blend (softer so horizon doesn't disappear)
    const fade = ctx.createLinearGradient(0, h * 0.70, 0, h);
    fade.addColorStop(0, "rgba(10,8,4,0)");
    fade.addColorStop(1, "rgba(10,8,4,0.45)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);

    // Edge vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Aurora shimmer (fallback while image loads)
    const auroraY = h * 0.28;
    const auroraShift = Math.sin(now * 0.0004) * 40;
    const aur = ctx.createLinearGradient(0, auroraY - 20, 0, auroraY + 40);
    aur.addColorStop(0, "rgba(80,180,140,0)");
    aur.addColorStop(0.5, `rgba(90,200,150,${0.08 + Math.sin(now * 0.0006) * 0.03})`);
    aur.addColorStop(1, "rgba(80,180,140,0)");
    ctx.fillStyle = aur;
    ctx.save();
    ctx.translate(auroraShift, 0);
    ctx.fillRect(-40, auroraY - 20, w + 80, 60);
    ctx.restore();
  }



  if (!keyArtActive) {
    // Stars
    const st = ensureStars(w, h, state.seed);
    ctx.save();
    for (const s of st) {
      const tw = 0.5 + 0.5 * Math.sin(now * 0.002 + s.p);
      ctx.globalAlpha = 0.4 * tw + 0.15;
      ctx.fillStyle = "#e6f0ff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Distant mountains
    ctx.fillStyle = "#20293a";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.66);
    for (let x = 0; x <= w; x += 30) {
      ctx.lineTo(x, h * 0.66 - Math.sin(x * 0.006 + state.seed * 0.001) * 55 - 20);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Mid mountains
    ctx.fillStyle = "#182234";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.74 - Math.sin(x * 0.011 + state.seed * 0.002 + 1.3) * 40 - 12);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Ruins silhouettes (close parallax) — broken buildings
    ctx.fillStyle = "#0e1521";
    const ruinSeed = state.seed * 0.001;
    for (let rx = 40; rx < w; rx += 130) {
      const off = Math.sin(rx * 0.02 + ruinSeed) * 10;
      const bh = 40 + Math.abs(Math.sin(rx * 0.05)) * 30;
      const by = h * 0.78 + off;
      ctx.fillRect(rx, by - bh, 24, bh);
      ctx.fillRect(rx + 6, by - bh - 6, 8, 6);
      ctx.fillStyle = "rgba(255,180,80,0.15)";
      ctx.fillRect(rx + 8, by - bh + 12, 3, 5);
      ctx.fillStyle = "#0e1521";
    }

    // Ground haze
    const haze = ctx.createLinearGradient(0, h * 0.6, 0, h);
    haze.addColorStop(0, "rgba(60,50,30,0)");
    haze.addColorStop(1, "rgba(60,50,30,0.4)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }


  // Wind dust particles behind terrain
  updateDust(w, h, state.wind, dt, now);
  ctx.save();
  for (const p of dustParticles) {
    ctx.globalAlpha = p.alpha * Math.min(1, p.life);
    ctx.fillStyle = sc.particleColor;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Terrain
  const tc = ensureTerrainCanvas(state);
  ctx.drawImage(tc, 0, 0);

  // Persistent scorch marks
  for (const s of state.scorchMarks) {
    const t = s.life / s.maxLife;
    const alpha = Math.min(1, t) * 0.6;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
    g.addColorStop(0, `rgba(10,6,4,${alpha})`);
    g.addColorStop(0.6, `rgba(20,12,8,${alpha * 0.75})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
    const freshT = (s.maxLife - s.life);
    if (freshT < 0.4) {
      ctx.save();
      ctx.globalAlpha = 1 - freshT / 0.4;
      ctx.strokeStyle = "#ff9138";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * (0.9 + freshT * 0.6), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  // Dogs — ensure no residual composite/alpha from previous passes dims them
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < state.dogs.length; i++) {
    const dog = state.dogs[i];
    const skin = characterSkin(dog.charId);
    const active = state.phase === "aiming" && state.currentPlayer === i && state.winner === null;
    // Contact shadow under the dog for separation from background
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(dog.x, dog.y + 2, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Soft rim glow to lift the silhouette off the terrain
    ctx.save();
    ctx.shadowColor = skin.teamColor;
    ctx.shadowBlur = active ? 14 : 8;
    drawDog(ctx, dog.x, dog.y, skin, dog.facing, dog.hp, now, active, state.angle);
    ctx.restore();
    drawHpBar(ctx, dog.x, dog.y - 46, dog.hp, dog.maxHp, skin.teamColor, skin.teamDark);
    if (active && dog.hp > 0) drawActiveMarker(ctx, dog.x, dog.y - 62, now, skin.teamColor);
  }
  ctx.restore();


  // Aim indicator
  if (state.phase === "aiming" && state.winner === null) {
    const dog = state.dogs[state.currentPlayer];
    if (dog.hp > 0) drawAim(ctx, dog, state.angle, state.power, state.wind, state.weapon, now);
  }

  // Projectiles
  for (const p of state.projectiles) {
    const w2 = WEAPONS[p.weapon];
    const ang = Math.atan2(p.vy, p.vx);
    const wcol = weaponColor(p.weapon);
    const wacc = weaponAccent(p.weapon);

    // Trail
    ctx.save();
    for (let i = 0; i < p.trail.length; i++) {
      const [tx, ty] = p.trail[i];
      const a = i / p.trail.length;
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = wcol;
      ctx.beginPath(); ctx.arc(tx, ty, 1 + a * 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    if (w2.id === "bow") {
      drawArrow(ctx, p.x, p.y, ang, wcol, now);
    } else if (w2.id === "rpg") {
      drawRocket(ctx, p.x, p.y, ang, now);
    } else if (w2.id === "grenade") {
      drawGrenade(ctx, p.x, p.y, p.age, w2.fuse ?? 2.5, now);
    } else if (w2.id === "artillery") {
      drawShell(ctx, p.x, p.y, ang);
    } else {
      // Bazooka projectile — small missile
      drawMissile(ctx, p.x, p.y, ang, wacc);
    }
  }


  // Explosions
  for (const e of state.explosions) {
    const t = e.age / e.maxAge;
    if (t < 1) {
      const r = e.radius * (0.4 + t * 1.1);
      // Shockwave ring
      if (t < 0.4) {
        ctx.save();
        ctx.globalAlpha = 1 - t / 0.4;
        ctx.strokeStyle = "#fff8d8";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.2, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // White flash core (very short)
      if (t < 0.15) {
        ctx.save();
        ctx.globalAlpha = (1 - t / 0.15) * 0.8;
        const fg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 0.5);
        fg.addColorStop(0, "#ffffff");
        fg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // Fire core with noise texture
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      g.addColorStop(0, "rgba(255,250,220,0.98)");
      g.addColorStop(0.35, "rgba(255,150,50,0.85)");
      g.addColorStop(0.7, "rgba(200,60,20,0.55)");
      g.addColorStop(1, "rgba(30,10,5,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      // Fire fingers (bumpy edge)
      ctx.save();
      ctx.globalAlpha = 0.6 * (1 - t);
      ctx.fillStyle = "#ffb055";
      const spikes = 10;
      ctx.beginPath();
      for (let k = 0; k < spikes; k++) {
        const a = (k / spikes) * Math.PI * 2;
        const rr = r * (0.7 + Math.sin(a * 3 + now * 0.02) * 0.15);
        const px = e.x + Math.cos(a) * rr;
        const py = e.y + Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Smoke halo
      const s = ctx.createRadialGradient(e.x, e.y - r * 0.3, r * 0.3, e.x, e.y - r * 0.3, r * 1.7);
      s.addColorStop(0, `rgba(60,50,45,${0.45 * (1 - t)})`);
      s.addColorStop(1, "rgba(60,50,45,0)");
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.3, r * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    // Particles + debris
    drawExplosionParticles(ctx, e);
  }

  // Floating damage numbers
  for (const f of state.floatingTexts) {
    const t = f.life / f.maxLife;
    const age = f.maxLife - f.life;
    const pop = age < 0.12 ? (age / 0.12) : 1;
    const alpha = Math.min(1, f.life / 0.3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    ctx.scale(pop, pop);
    ctx.font = `900 ${f.size}px "Chakra Petch", "Black Ops One", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.strokeText(f.value, 0, 0);
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 8 * t;
    ctx.fillText(f.value, 0, 0);
    ctx.restore();
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";

  // Airstrike targeting marker (large red X on the ground)
  if (state.airstrikeMarker) {
    const m = state.airstrikeMarker;
    const gy = surfaceYQuick(state, m.x);
    const alpha = Math.min(1, m.life);
    const pulse = 1 + Math.sin(now * 0.02) * 0.15;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(m.x, gy - 6);
    ctx.strokeStyle = "#ff2a2a";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff2a2a"; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -14); ctx.lineTo(14, 14);
    ctx.moveTo(-14, 14); ctx.lineTo(14, -14);
    ctx.stroke();
    ctx.restore();
  }

  // Scenario global tint (arctic/desert/jungle)
  if (sc.tint) {
    ctx.save();
    ctx.globalCompositeOperation = sc.tintBlend;
    ctx.fillStyle = sc.tint;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function surfaceYQuick(state: GameState, x: number): number {
  const xi = Math.max(0, Math.min(state.width - 1, Math.floor(x)));
  for (let y = 0; y < state.height; y++) {
    if (state.terrain[y * state.width + xi]) return y;
  }
  return state.height;
}

// ============ PROJECTILE DRAWERS ============

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, color: string, now: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Vibration for feel
  const vib = Math.sin(now * 0.08) * 0.3;
  ctx.translate(0, vib);
  // shaft
  const shaftG = ctx.createLinearGradient(-12, 0, 8, 0);
  shaftG.addColorStop(0, "#4a2c14"); shaftG.addColorStop(1, "#8a5a2e");
  ctx.strokeStyle = shaftG; ctx.lineWidth = 1.8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
  // metallic head (diamond)
  const headG = ctx.createLinearGradient(6, -3, 12, 3);
  headG.addColorStop(0, "#f5f7fa"); headG.addColorStop(1, "#7a8794");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.moveTo(12, 0); ctx.lineTo(6, -2.8); ctx.lineTo(8, 0); ctx.lineTo(6, 2.8); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3a4652"; ctx.lineWidth = 0.5; ctx.stroke();
  // fletching (two-colored feathers)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-12, 0); ctx.lineTo(-16, -3.2); ctx.lineTo(-9, -0.5); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-12, 0); ctx.lineTo(-16, 3.2); ctx.lineTo(-9, 0.5); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, now: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Flame with blue core
  const flick = 1 + (Math.sin(now * 0.06) + 1) * 0.3;
  const fg = ctx.createLinearGradient(-18 * flick, 0, -4, 0);
  fg.addColorStop(0, "rgba(120,180,255,0)");
  fg.addColorStop(0.3, "rgba(255,180,60,0.7)");
  fg.addColorStop(0.7, "rgba(255,240,180,1)");
  fg.addColorStop(1, "rgba(180,220,255,1)");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-4, -3.2); ctx.lineTo(-18 * flick, 0); ctx.lineTo(-4, 3.2); ctx.closePath(); ctx.fill();
  // body
  const bg = ctx.createLinearGradient(0, -3.5, 0, 3.5);
  bg.addColorStop(0, "#e8e4dd");
  bg.addColorStop(0.5, "#a09a90");
  bg.addColorStop(1, "#5a554e");
  ctx.fillStyle = bg;
  roundRect(ctx, -4, -3.5, 13, 7, 1.5); ctx.fill();
  // yellow warning stripe
  ctx.fillStyle = "#ffcc33";
  ctx.fillRect(3, -3.5, 2, 7);
  // nose cone
  const ng = ctx.createLinearGradient(9, -3, 15, 3);
  ng.addColorStop(0, "#e04a1e"); ng.addColorStop(1, "#7a1e0a");
  ctx.fillStyle = ng;
  ctx.beginPath(); ctx.moveTo(9, -3.5); ctx.lineTo(15, 0); ctx.lineTo(9, 3.5); ctx.closePath(); ctx.fill();
  // fins (top and bottom)
  ctx.fillStyle = "#3a3a42";
  ctx.beginPath(); ctx.moveTo(-4, -3.5); ctx.lineTo(-8, -5.5); ctx.lineTo(-1, -3.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 3.5); ctx.lineTo(-8, 5.5); ctx.lineTo(-1, 3.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawGrenade(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, fuse: number, now: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(now * 0.008);
  // Pineapple body
  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 6);
  g.addColorStop(0, "#7a9260"); g.addColorStop(1, "#3d4a2a");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
  // Segmented lines (pineapple pattern)
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 0.6;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(-5, i * 2); ctx.lineTo(5, i * 2); ctx.stroke();
  }
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 2, -5); ctx.lineTo(i * 2, 5); ctx.stroke();
  }
  // Top cap + pin
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(-2, -7, 4, 2);
  ctx.strokeStyle = "#c9b74a"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(3.5, -6.5, 1.2, 0, Math.PI * 2); ctx.stroke();
  // Fuse blinker — pulses faster near explosion
  const remaining = Math.max(0.001, fuse - age);
  const blinkSpeed = 0.006 + (1 - remaining / fuse) * 0.025;
  const blink = Math.sin(now * blinkSpeed * 60) > 0;
  if (blink) {
    ctx.fillStyle = "#ff3020";
    ctx.shadowColor = "#ff3020";
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, -6, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawShell(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Shell body
  const g = ctx.createLinearGradient(0, -4, 0, 4);
  g.addColorStop(0, "#c9c4bd"); g.addColorStop(1, "#4a463f");
  ctx.fillStyle = g;
  roundRect(ctx, -6, -4, 10, 8, 1); ctx.fill();
  // Red warhead
  const wg = ctx.createLinearGradient(4, -4, 12, 4);
  wg.addColorStop(0, "#e94560"); wg.addColorStop(1, "#7a1428");
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(12, 0); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();
  // Yellow warning stripe
  ctx.fillStyle = "#ffcc33";
  ctx.fillRect(-2, -4, 1.5, 8);
  ctx.fillStyle = "#000";
  ctx.fillRect(-4, -4, 1, 8);
  // Base ring
  ctx.fillStyle = "#2a2822";
  ctx.fillRect(-6, -4, 1.2, 8);
  ctx.restore();
}

function drawMissile(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // body
  const g = ctx.createLinearGradient(0, -2.5, 0, 2.5);
  g.addColorStop(0, "#d8d3c9"); g.addColorStop(1, "#5a554d");
  ctx.fillStyle = g;
  roundRect(ctx, -5, -2.5, 8, 5, 1); ctx.fill();
  // Nose
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.moveTo(3, -2.5); ctx.lineTo(8, 0); ctx.lineTo(3, 2.5); ctx.closePath(); ctx.fill();
  // fins
  ctx.fillStyle = "#333";
  ctx.beginPath(); ctx.moveTo(-5, -2.5); ctx.lineTo(-7, -4); ctx.lineTo(-2, -2.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, 2.5); ctx.lineTo(-7, 4); ctx.lineTo(-2, 2.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawExplosionParticles(ctx: CanvasRenderingContext2D, e: Explosion) {
  for (const pt of e.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
    // Sparks are diamond-shaped for hotter feel
    if (pt.color === "#ffe066" || pt.color === "#fff8d8") {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 4;
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
      ctx.restore();
    } else {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
  }
  ctx.globalAlpha = 1;
}

// ============ DOGS ============

function drawDog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  skin: TeamSkin,
  facing: 1 | -1,
  hp: number,
  now: number,
  active: boolean,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);

  // Silhouette + palette come from the active skin pack.
  // pointy = shepherd/husky/doberman-style; stocky = bulldog-style.
  const pointy = skin.silhouette === "pointy";
  const isShepherd = pointy; // alias to preserve existing branch logic below
  const bodyLight = skin.bodyLight;
  const bodyBase  = skin.bodyBase;
  const bodyDark  = skin.bodyDark;
  const teamColor = skin.teamColor;
  const teamDark  = skin.teamDark;
  const helmetBase = skin.helmetBase;
  const helmetTop  = skin.helmetTop;
  const badgeColor = skin.badgeColor;
  const teamNum   = skin.teamNum;
  const eyeIris   = skin.eyeIris;
  const name      = skin.name;
  const badgeGlyph = skin.badgeGlyph;


  // Ground shadow
  ctx.save();
  const shadowG = ctx.createRadialGradient(0, 16, 2, 0, 16, 24);
  shadowG.addColorStop(0, "rgba(0,0,0,0.55)");
  shadowG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath(); ctx.ellipse(0, 16, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Photo-based skin (Classic pack) — use key-art portrait for RANGER/BRUTUS
  const photoImg = name === "RANGER" ? rangerImg : name === "BRUTUS" ? brutusImg : null;
  if (photoImg && photoImg.complete && photoImg.naturalWidth > 0 && hp > 0) {
    const injured = hp < 40;
    const critical = hp < 20;
    const bob = Math.sin(now * 0.004) * 0.9 + (injured ? Math.sin(now * 0.02) * 0.6 : 0);
    ctx.save();
    ctx.translate(0, bob);
    ctx.scale(facing, 1);
    // Size to match roughly the vector art footprint (~48px wide, ~50px tall)
    const targetH = 54;
    const ratio = photoImg.naturalWidth / photoImg.naturalHeight;
    const targetW = targetH * ratio;
    if (critical) {
      ctx.filter = "brightness(0.85) saturate(0.7)";
    }
    ctx.drawImage(photoImg, -targetW / 2, -targetH + 16, targetW, targetH);
    ctx.restore();
    ctx.restore(); // matches the outer ctx.save() at top of drawDog
    return;
  }



  if (hp <= 0) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.rotate((Math.PI / 2) * facing * 0.85);
    ctx.fillStyle = bodyDark;
    roundRect(ctx, -14, -7, 28, 14, 7); ctx.fill();
    ctx.fillStyle = bodyBase;
    roundRect(ctx, -12, -5, 24, 10, 5); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 10px Chakra Petch, sans-serif";
    ctx.fillText("X_X", -8, -9);
    ctx.restore();
    ctx.strokeStyle = "#6a5033"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-6, -22); ctx.moveTo(-12, -15); ctx.lineTo(0, -15); ctx.stroke();
    ctx.restore();
    return;
  }

  const injured = hp < 40;
  const critical = hp < 20;
  const bob = Math.sin(now * 0.004) * 0.9 + (injured ? Math.sin(now * 0.02) * 0.6 : 0);
  const breath = 1 + Math.sin(now * 0.005) * 0.03 + (critical ? Math.sin(now * 0.02) * 0.02 : 0);
  ctx.translate(0, bob);
  ctx.scale(facing, 1);

  // ---- Legs ----
  ctx.fillStyle = bodyDark;
  roundRect(ctx, -11, 5, 5, 8, 2); ctx.fill();
  roundRect(ctx, -8, 5.5, 5, 7.5, 2); ctx.fill();
  ctx.fillStyle = "#2e2010";
  roundRect(ctx, 3, 5, 5, 8, 2); ctx.fill();
  roundRect(ctx, 6, 5.5, 5, 7.5, 2); ctx.fill();
  // paws
  ctx.fillStyle = "#1a1108";
  ctx.fillRect(-11, 12, 5, 1.5);
  ctx.fillRect(-8, 12.5, 5, 1);
  ctx.fillRect(3, 12, 5, 1.5);
  ctx.fillRect(6, 12.5, 5, 1);
  // Boots (front paws)
  ctx.fillStyle = teamDark;
  ctx.fillRect(3, 11.5, 5, 2.2);
  ctx.fillRect(6, 12, 5, 2);

  // ---- Tail ----
  const wagFreq = active ? 0.014 : 0.003;
  const wagAmp = active ? 0.45 : 0.08;
  const wag = Math.sin(now * wagFreq) * wagAmp;
  ctx.save();
  ctx.translate(-13, -8);
  ctx.rotate(-0.6 + wag);
  if (isShepherd) {
    // long fluffy tail
    ctx.strokeStyle = bodyBase; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, -2, -14, 2);
    ctx.stroke();
    ctx.strokeStyle = bodyDark; ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-10, 1);
    ctx.quadraticCurveTo(-14, 3, -16, 1);
    ctx.stroke();
  } else {
    // short stub tail
    ctx.fillStyle = bodyBase;
    ctx.beginPath();
    ctx.moveTo(0, -2); ctx.lineTo(-5, -1); ctx.lineTo(-4, 2); ctx.lineTo(0, 1); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- Body silhouette (breed-shaped) ----
  ctx.save();
  ctx.scale(1, breath);
  const bodyG = ctx.createLinearGradient(0, -16, 0, 8);
  bodyG.addColorStop(0, bodyLight);
  bodyG.addColorStop(0.55, bodyBase);
  bodyG.addColorStop(1, bodyDark);
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  if (isShepherd) {
    // sleeker, elongated
    ctx.moveTo(-13, -6);
    ctx.bezierCurveTo(-15, -17, -6, -18, 2, -16);
    ctx.bezierCurveTo(10, -15, 15, -12, 15, -6);
    ctx.bezierCurveTo(15, 2, 12, 8, 6, 8);
    ctx.bezierCurveTo(-4, 9, -12, 6, -13, -6);
  } else {
    // stockier bulldog: broader chest, lower back
    ctx.moveTo(-13, -4);
    ctx.bezierCurveTo(-15, -14, -6, -16, 2, -14);
    ctx.bezierCurveTo(11, -13, 17, -10, 17, -3);
    ctx.bezierCurveTo(17, 5, 13, 9, 5, 9);
    ctx.bezierCurveTo(-5, 10, -13, 7, -13, -4);
  }
  ctx.closePath();
  ctx.fill();

  // Shepherd back saddle marking
  if (isShepherd) {
    ctx.fillStyle = "rgba(30,20,10,0.55)";
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.bezierCurveTo(-6, -17, 4, -16, 10, -13);
    ctx.bezierCurveTo(8, -10, 0, -9, -10, -11);
    ctx.closePath();
    ctx.fill();
  }
  // Fur strokes along back
  ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 0.6;
  for (let i = -10; i <= 10; i += 2.5) {
    ctx.beginPath();
    ctx.moveTo(i, -14);
    ctx.lineTo(i + 1.2, -12);
    ctx.stroke();
  }
  // Rim light on top
  ctx.strokeStyle = "rgba(255,210,150,0.35)"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, -15);
  ctx.bezierCurveTo(-4, -18, 4, -18, 12, -14);
  ctx.stroke();
  ctx.restore();

  // ---- Ammo belt across chest ----
  ctx.save();
  ctx.rotate(-0.25);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(-2, -8, 20, 3);
  ctx.fillStyle = "#e0b850";
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(-1 + i * 3, -7.5, 1.8, 2);
    ctx.fillStyle = "#8a6a20";
    ctx.fillRect(-1 + i * 3, -6, 1.8, 0.5);
    ctx.fillStyle = "#e0b850";
  }
  ctx.restore();

  // ---- Tactical vest ----
  ctx.fillStyle = teamDark;
  roundRect(ctx, -11, -5, 22, 10, 4); ctx.fill();
  // stitching
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 0.6;
  ctx.setLineDash([1.5, 1.5]);
  ctx.strokeRect(-10.5, -4.5, 21, 9);
  ctx.setLineDash([]);
  // pockets
  const pocketY = -1;
  for (let i = 0; i < 3; i++) {
    const px = -8 + i * 6.5;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(px, pocketY, 4.5, 4.5);
    ctx.fillStyle = "#d4a84a";
    ctx.fillRect(px + 1.5, pocketY + 3.2, 1.5, 1);
    // stitch
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 0.3;
    ctx.strokeRect(px + 0.3, pocketY + 0.3, 3.9, 3.9);
  }
  // team stripe
  ctx.fillStyle = teamColor;
  ctx.fillRect(-11, -5, 22, 1.5);
  // shoulder patch (circle with team num)
  ctx.fillStyle = teamColor;
  ctx.beginPath(); ctx.arc(-9, -3.5, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 0.4; ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 3.5px Chakra Petch";
  ctx.textAlign = "center";
  ctx.fillText(teamNum, -9, -2.3);
  ctx.textAlign = "start";
  // Holster with pistol grip
  ctx.fillStyle = "#1a1108";
  roundRect(ctx, 6, 2, 5, 5, 1); ctx.fill();
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(7.5, 2.5, 2, 3.5);

  // ---- Spiked collar (metallic spikes around the neck) ----
  ctx.save();
  ctx.translate(6, -7);
  ctx.rotate(-0.3);
  ctx.fillStyle = "#1a1a1e";
  roundRect(ctx, -8, -1.5, 14, 3, 1); ctx.fill();
  // spikes
  for (let i = 0; i < 6; i++) {
    const sx = -7 + i * 2.6;
    const spikeG = ctx.createLinearGradient(sx, -4, sx, -1);
    spikeG.addColorStop(0, "#f2f4f8"); spikeG.addColorStop(1, "#6a707a");
    ctx.fillStyle = spikeG;
    ctx.beginPath();
    ctx.moveTo(sx, -1.5); ctx.lineTo(sx + 0.9, -4.2); ctx.lineTo(sx + 1.8, -1.5);
    ctx.closePath(); ctx.fill();
  }
  // buckle
  ctx.fillStyle = "#c9a84c";
  ctx.fillRect(4, -1.2, 2, 2.4);
  ctx.restore();

  ctx.save();
  ctx.translate(11, -14);

  // Snout — shepherd long/pointy, bulldog short/wide
  const snoutG = ctx.createLinearGradient(0, -2, 0, 8);
  snoutG.addColorStop(0, bodyLight); snoutG.addColorStop(1, bodyBase);
  ctx.fillStyle = snoutG;
  if (isShepherd) {
    roundRect(ctx, 4, -1, 14, 7, 3.5); ctx.fill();
  } else {
    // wider, shorter, with jaw
    roundRect(ctx, 3, 0, 10, 8, 3); ctx.fill();
    // lower jaw (bulldog underbite)
    ctx.fillStyle = bodyDark;
    roundRect(ctx, 3, 5, 9, 4, 2); ctx.fill();
    ctx.fillStyle = snoutG;
    // teeth peek
    ctx.fillStyle = "#f0ede4";
    ctx.fillRect(5, 5.5, 1, 1.5);
    ctx.fillRect(8, 5.5, 1, 1.5);
  }
  // Mouth line + rare snarl teeth when active
  ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 0.7;
  if (isShepherd) {
    ctx.beginPath(); ctx.moveTo(6, 4); ctx.quadraticCurveTo(11, 5.5, 15, 4); ctx.stroke();
  }
  if (active && Math.sin(now * 0.005) > 0.4) {
    ctx.fillStyle = "#e85a75";
    roundRect(ctx, isShepherd ? 11 : 7, isShepherd ? 4.5 : 6, 3, 1.8, 1); ctx.fill();
  }
  // Nose
  const noseX = isShepherd ? 17 : 12.5;
  const noseG = ctx.createRadialGradient(noseX, 0, 0, noseX, 0, 3);
  noseG.addColorStop(0, "#3a2a24"); noseG.addColorStop(1, "#0a0806");
  ctx.fillStyle = noseG;
  ctx.beginPath(); ctx.arc(noseX, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath(); ctx.arc(noseX - 0.6, -0.6, 0.7, 0, Math.PI * 2); ctx.fill();

  // Skull
  const headG = ctx.createLinearGradient(0, -10, 0, 8);
  headG.addColorStop(0, bodyLight); headG.addColorStop(1, bodyBase);
  ctx.fillStyle = headG;
  ctx.beginPath();
  if (isShepherd) {
    ctx.moveTo(-4, -2);
    ctx.bezierCurveTo(-5, -10, 4, -12, 8, -10);
    ctx.bezierCurveTo(13, -8, 13, 2, 8, 5);
    ctx.bezierCurveTo(2, 6, -4, 4, -4, -2);
  } else {
    // wider, blockier
    ctx.moveTo(-4, -1);
    ctx.bezierCurveTo(-6, -10, 6, -12, 10, -9);
    ctx.bezierCurveTo(14, -6, 13, 4, 6, 6);
    ctx.bezierCurveTo(0, 7, -4, 5, -4, -1);
  }
  ctx.closePath();
  ctx.fill();

  // Ears — pointy (shepherd) or stub (bulldog)
  const earSway = Math.sin(now * 0.003) * 0.08;
  ctx.save();
  if (isShepherd) {
    // back ear
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(-4, -18);
    ctx.lineTo(3, -12);
    ctx.closePath();
    ctx.fill();
    // front ear
    ctx.translate(2, -10);
    ctx.rotate(earSway);
    ctx.fillStyle = bodyBase;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-1, -9);
    ctx.lineTo(5, -1);
    ctx.closePath();
    ctx.fill();
    // pink inner
    ctx.fillStyle = "rgba(255,180,170,0.7)";
    ctx.beginPath();
    ctx.moveTo(0, -1); ctx.lineTo(0, -6); ctx.lineTo(3, -2); ctx.closePath();
    ctx.fill();
  } else {
    // Small folded rose ears
    ctx.translate(-1, -9);
    ctx.rotate(earSway);
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, 2, -2, 6);
    ctx.quadraticCurveTo(2, 3, 3, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,180,170,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, 1); ctx.quadraticCurveTo(-2, 4, -1, 5); ctx.closePath();
    ctx.fill();
    // second ear (further)
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(4, -1);
    ctx.quadraticCurveTo(7, 1, 6, 5);
    ctx.quadraticCurveTo(4, 3, 3, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Eye with sclera + iris
  const cycle = (now / 4000) % 1;
  const blink = cycle > 0.98;
  const eyeX = isShepherd ? 4 : 3;
  const eyeY = isShepherd ? -3 : -2;
  if (!blink) {
    // sclera
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(eyeX, eyeY, 1.9, 0, Math.PI * 2); ctx.fill();
    // iris (team-colored)
    ctx.fillStyle = eyeIris;
    ctx.beginPath(); ctx.arc(eyeX, eyeY, 1.3, 0, Math.PI * 2); ctx.fill();
    // pupil
    ctx.fillStyle = "#0a0806";
    const pupilShift = active ? Math.sin(now * 0.002) * 0.4 : 0;
    ctx.beginPath(); ctx.arc(eyeX + pupilShift, eyeY, 0.7, 0, Math.PI * 2); ctx.fill();
    // reflection
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(eyeX + 0.5, eyeY - 0.5, 0.35, 0, Math.PI * 2); ctx.fill();
    // Eyebrow (angry when active)
    ctx.strokeStyle = bodyDark; ctx.lineWidth = 0.8; ctx.lineCap = "round";
    ctx.beginPath();
    if (active) {
      ctx.moveTo(eyeX - 2, eyeY - 2.8); ctx.lineTo(eyeX + 2, eyeY - 2);
    } else if (critical) {
      ctx.moveTo(eyeX - 2, eyeY - 2); ctx.lineTo(eyeX + 2, eyeY - 2.8);
    } else {
      ctx.moveTo(eyeX - 2, eyeY - 2.5); ctx.lineTo(eyeX + 2, eyeY - 2.5);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = bodyDark; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(eyeX - 1.5, eyeY); ctx.lineTo(eyeX + 1.5, eyeY); ctx.stroke();
  }

  // Tactical goggles
  const goggleG = ctx.createLinearGradient(0, -5, 0, 1);
  goggleG.addColorStop(0, "#0f0f10"); goggleG.addColorStop(1, "#242428");
  ctx.fillStyle = goggleG;
  roundRect(ctx, -1, -5.5, 13, 4, 1.8); ctx.fill();
  ctx.strokeStyle = "#6a6a72"; ctx.lineWidth = 0.6;
  ctx.strokeRect(-0.5, -5.2, 12, 3.5);
  ctx.fillStyle = "rgba(160,240,190,0.65)";
  ctx.beginPath(); ctx.moveTo(1, -4.7); ctx.lineTo(4, -4.7); ctx.lineTo(3, -2.3); ctx.lineTo(0, -2.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(160,240,190,0.45)";
  ctx.fillRect(7, -4.8, 3, 0.8);
  ctx.strokeStyle = bodyDark; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-4, -3.5); ctx.lineTo(12, -3.5); ctx.stroke();

  // Helmet — tactical shell (black for Ranger, olive for Brutus)
  ctx.fillStyle = helmetBase;
  ctx.beginPath();
  ctx.ellipse(4, -10.5, 12, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  const helmG = ctx.createLinearGradient(0, -17, 0, -8);
  helmG.addColorStop(0, helmetTop); helmG.addColorStop(1, helmetBase);
  ctx.fillStyle = helmG;
  ctx.beginPath();
  ctx.ellipse(4, -10.5, 11, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Camo splotches on helmet
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(-2, -13, 2.2, 1.4, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, -15, 2, 1.2, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11, -12, 1.4, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  // side band
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-7, -10.5, 22, 1.4);
  // Rectangular badge plate (paw for Ranger / bulldog for Brutus)
  ctx.fillStyle = badgeColor;
  roundRect(ctx, 1, -14.5, 6, 4, 0.6); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 0.5;
  ctx.strokeRect(1, -14.5, 6, 4);
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.font = "bold 3.2px Black Ops One, Chakra Petch";
  ctx.textAlign = "center";
  ctx.fillText(badgeGlyph, 4, -11.7);
  ctx.textAlign = "start";

  // Antenna with blinking LED (kept in team color for turn feedback)
  ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-8, -22); ctx.stroke();
  const ledBlink = (now % 900) < 450;
  ctx.fillStyle = ledBlink ? teamColor : "#3a3a3a";
  ctx.shadowColor = ledBlink ? teamColor : "transparent";
  ctx.shadowBlur = ledBlink ? 6 : 0;
  ctx.beginPath(); ctx.arc(-8, -22.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore(); // head

  // Bandage when injured
  if (injured) {
    ctx.fillStyle = "#f4ecd8";
    ctx.fillRect(-6, 1, 8, 3);
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 0.5;
    ctx.setLineDash([1.2, 1.2]);
    ctx.strokeRect(-6, 1, 8, 3);
    ctx.setLineDash([]);
    ctx.fillStyle = "#c02020";
    ctx.beginPath(); ctx.arc(-2, 2.5, 0.9, 0, Math.PI * 2); ctx.fill();
  }

  // Weapon
  const gunAngle = active ? -angle * Math.PI / 180 : -0.3;
  ctx.save();
  ctx.translate(14, -6);
  ctx.rotate(gunAngle);
  ctx.fillStyle = "#2a1e14";
  roundRect(ctx, -2, -2, 6, 4, 1); ctx.fill();
  const barrelG = ctx.createLinearGradient(0, -1.5, 0, 1.5);
  barrelG.addColorStop(0, "#4a4a52"); barrelG.addColorStop(1, "#1a1a20");
  ctx.fillStyle = barrelG;
  roundRect(ctx, 4, -1.5, 14, 3, 1); ctx.fill();
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(17, -1, 2, 2);
  // scope
  ctx.fillStyle = "#1a1a20";
  roundRect(ctx, 2, -3.5, 5, 2, 1); ctx.fill();
  ctx.fillStyle = teamColor;
  ctx.fillRect(4, -3, 1, 1);
  ctx.restore();

  ctx.restore(); // outer scale/translate

  // Active pulse ring at base
  if (active) {
    ctx.save();
    const t = (now % 1200) / 1200;
    ctx.globalAlpha = (1 - t) * 0.65;
    ctx.strokeStyle = teamColor; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 16, 12 + t * 16, 3.5 + t * 3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Nameplate flag stuck in the ground
    ctx.save();
    ctx.translate(-18, 8);
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();
    // flag with slight wave
    const wave = Math.sin(now * 0.005) * 1.2;
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, -13 + wave);
    ctx.lineTo(10, -10);
    ctx.lineTo(12, -7 - wave);
    ctx.lineTo(0, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 4px Black Ops One, Chakra Petch";
    ctx.fillText(name, 1, -10.5);
    ctx.restore();
  }
}


function drawActiveMarker(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, color: string) {
  const bob = Math.sin(now * 0.006) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  // Golden halo behind
  const rotAngle = now * 0.002;
  ctx.save();
  ctx.rotate(rotAngle);
  ctx.strokeStyle = "rgba(255,220,120,0.35)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  // Arrow
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-6, -4);
  ctx.lineTo(6, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}


function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, color: string, dark: string) {
  const segCount = 10;
  const segW = 4, segGap = 1;
  const totalW = segCount * segW + (segCount - 1) * segGap;
  const barH = 5;
  const startX = x - totalW / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, startX - 3, y - 2, totalW + 6, barH + 4, 3); ctx.fill();
  const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const filled = Math.round(pct * segCount);
  const critical = pct < 0.3;
  const pulse = critical ? 0.6 + 0.4 * Math.abs(Math.sin(performance.now() * 0.008)) : 1;
  for (let i = 0; i < segCount; i++) {
    const sx = startX + i * (segW + segGap);
    if (i < filled) {
      const g = ctx.createLinearGradient(0, y, 0, y + barH);
      g.addColorStop(0, color); g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.globalAlpha = pulse;
      ctx.fillRect(sx, y, segW, barH);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(sx, y, segW, barH);
    }
  }
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px Chakra Petch, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 3;
  ctx.fillText(`${hp}`, x, y - 4);
  ctx.textAlign = "start";
  ctx.restore();
}


function drawAim(ctx: CanvasRenderingContext2D, dog: { x: number; y: number; facing: 1 | -1 }, angle: number, power: number, _wind: number, weapon: string, now: number) {
  const rad = (angle * Math.PI) / 180;
  const dir = dog.facing;
  const len = 34 + (power / 100) * 60;
  const x0 = dog.x + dir * 18;
  const y0 = dog.y - 10;
  const x1 = x0 + Math.cos(rad) * dir * len;
  const y1 = y0 - Math.sin(rad) * len;
  const color = weaponColor(weapon as WeaponId);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -now * 0.03;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.setLineDash([]);
  // Reticle
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x1, y1, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1 - 10, y1); ctx.lineTo(x1 - 4, y1);
  ctx.moveTo(x1 + 4, y1); ctx.lineTo(x1 + 10, y1);
  ctx.moveTo(x1, y1 - 10); ctx.lineTo(x1, y1 - 4);
  ctx.moveTo(x1, y1 + 4); ctx.lineTo(x1, y1 + 10);
  ctx.stroke();
  // center dot
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x1, y1, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
