import type { GameState } from "./types";
import { WEAPONS } from "./weapons";

let terrainCanvas: HTMLCanvasElement | null = null;
let terrainDirty = true;
let lastTerrainRef: Uint8Array | null = null;

// Twinkling stars, persistent between renders
let stars: { x: number; y: number; r: number; p: number }[] | null = null;

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
  if (terrainDirty) {
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
          // Depth for stratification (0..1 top->bottom of terrain column-wise not needed, use y)
          const depthT = Math.min(1, (y - Math.max(0, y - 40)) / 40); // local darkening
          const n = ((x * 92837 + y * 12971) % 30) - 15; // noise -15..14

          let r: number, g: number, b: number;
          if (above) {
            // Grass rim highlight
            r = 0x9c; g = 0xd1; b = 0x54;
          } else if (near1) {
            r = 0x74; g = 0x9c; b = 0x3d;
          } else if (near2) {
            r = 0x56; g = 0x72; b = 0x2d;
          } else if (y > h * 0.72) {
            // Deep rock stratum
            const nn = n >> 1;
            r = 0x2a + nn; g = 0x24 + nn; b = 0x22 + nn;
          } else {
            // Dirt with noise + slight depth darkening
            r = 0x46 + (n >> 1); g = 0x2f + (n >> 2); b = 0x1e + (n >> 2);
            r = Math.max(0, r - Math.floor(depthT * 6));
            g = Math.max(0, g - Math.floor(depthT * 6));
          }

          // Crater edge shadow: darken pixels near a destroyed neighbor at any diagonal
          if (!above && (
            (x > 0 && !t[i - 1]) ||
            (x < w - 1 && !t[i + 1]) ||
            (y > 0 && !t[i - w])
          )) {
            r = Math.max(0, r - 22);
            g = Math.max(0, g - 22);
            b = Math.max(0, b - 22);
          }

          img.data[j] = r; img.data[j + 1] = g; img.data[j + 2] = b;
          img.data[j + 3] = 0xff;
        } else {
          img.data[j + 3] = 0;
        }
      }
    }
    tctx.putImageData(img, 0, 0);
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

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width: w, height: h } = state;
  const now = performance.now();

  // Sky gradient — dusk-tinted
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0b1220");
  sky.addColorStop(0.45, "#1b2b3a");
  sky.addColorStop(0.85, "#3a3222");
  sky.addColorStop(1, "#1a1408");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun glow
  const sunX = w * 0.72, sunY = h * 0.55;
  const sunG = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.55);
  sunG.addColorStop(0, "rgba(255,180,90,0.35)");
  sunG.addColorStop(0.4, "rgba(255,140,60,0.12)");
  sunG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sunG;
  ctx.fillRect(0, 0, w, h);

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

  // Distant mountains (parallax back)
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

  // Ground haze
  const haze = ctx.createLinearGradient(0, h * 0.6, 0, h);
  haze.addColorStop(0, "rgba(60,50,30,0)");
  haze.addColorStop(1, "rgba(60,50,30,0.4)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  // Terrain
  const tc = ensureTerrainCanvas(state);
  ctx.drawImage(tc, 0, 0);

  // Persistent scorch marks over the terrain
  for (const s of state.scorchMarks) {
    const t = s.life / s.maxLife;
    const alpha = Math.min(1, t) * 0.55;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
    g.addColorStop(0, `rgba(10,6,4,${alpha})`);
    g.addColorStop(0.6, `rgba(20,12,8,${alpha * 0.75})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
    // Fresh rim shockwave (first 0.4s of life relative to maxLife)
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

  // Dogs
  for (let i = 0; i < state.dogs.length; i++) {
    const dog = state.dogs[i];
    const active = state.phase === "aiming" && state.currentPlayer === i && state.winner === null;
    drawDog(ctx, dog.x, dog.y, dog.team === 0 ? "green" : "red", dog.facing, dog.hp, now, active, state.angle);
    drawHpBar(ctx, dog.x, dog.y - 44, dog.hp, dog.team === 0 ? "green" : "red");
    if (active && dog.hp > 0) drawActiveMarker(ctx, dog.x, dog.y - 58, now, dog.team === 0 ? "green" : "red");
  }

  // Aim indicator
  if (state.phase === "aiming" && state.winner === null) {
    const dog = state.dogs[state.currentPlayer];
    if (dog.hp > 0) drawAim(ctx, dog, state.angle, state.power, state.wind, state.weapon, now);
  }

  // Projectiles
  for (const p of state.projectiles) {
    const w2 = WEAPONS[p.weapon];
    const ang = Math.atan2(p.vy, p.vx);

    // Glow trail
    ctx.save();
    for (let i = 0; i < p.trail.length; i++) {
      const [tx, ty] = p.trail[i];
      const a = i / p.trail.length;
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = w2.color;
      ctx.beginPath(); ctx.arc(tx, ty, 1 + a * 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    if (w2.id === "bow") {
      // Arrow oriented along velocity
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      // shaft
      ctx.strokeStyle = "#6b3a1e"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
      // head
      ctx.fillStyle = "#dfe4ea";
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -2.4); ctx.lineTo(2, 2.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#889099"; ctx.lineWidth = 0.6; ctx.stroke();
      // fletching
      ctx.fillStyle = w2.color;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-13, -3); ctx.lineTo(-8, 0); ctx.lineTo(-13, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (w2.id === "rpg") {
      // Rocket body + flame
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      // flame
      const flick = 1 + (Math.sin(now * 0.06) + 1) * 0.25;
      const fg = ctx.createLinearGradient(-14 * flick, 0, -4, 0);
      fg.addColorStop(0, "rgba(255,80,20,0)");
      fg.addColorStop(0.5, "rgba(255,160,60,0.8)");
      fg.addColorStop(1, "rgba(255,240,180,1)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-4, -2.8); ctx.lineTo(-14 * flick, 0); ctx.lineTo(-4, 2.8); ctx.closePath(); ctx.fill();
      // body
      const bg = ctx.createLinearGradient(0, -3, 0, 3);
      bg.addColorStop(0, "#e8e4dd"); bg.addColorStop(1, "#6a655c");
      ctx.fillStyle = bg;
      roundRect(ctx, -4, -3, 12, 6, 1.5); ctx.fill();
      // nose cone
      ctx.fillStyle = "#c94a1e";
      ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(13, 0); ctx.lineTo(8, 3); ctx.closePath(); ctx.fill();
      // fins
      ctx.fillStyle = "#4a4a52";
      ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(-7, -5); ctx.lineTo(-2, -3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, 3); ctx.lineTo(-7, 5); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // Default core (bazooka, grenade, artillery)
      ctx.save();
      ctx.shadowColor = w2.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x, p.y, w2.id === "grenade" ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
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
      // Fire core
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      g.addColorStop(0, "rgba(255,250,220,0.98)");
      g.addColorStop(0.35, "rgba(255,150,50,0.85)");
      g.addColorStop(0.7, "rgba(200,60,20,0.55)");
      g.addColorStop(1, "rgba(30,10,5,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      // Smoke halo
      const s = ctx.createRadialGradient(e.x, e.y - r * 0.3, r * 0.3, e.x, e.y - r * 0.3, r * 1.6);
      s.addColorStop(0, `rgba(60,50,45,${0.4 * (1 - t)})`);
      s.addColorStop(1, "rgba(60,50,45,0)");
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.3, r * 1.6, 0, Math.PI * 2); ctx.fill();
    }
    for (const pt of e.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  // Floating damage numbers (drawn on top of everything)
  for (const f of state.floatingTexts) {
    const t = f.life / f.maxLife;
    const age = f.maxLife - f.life;
    const pop = age < 0.12 ? (age / 0.12) : 1; // scale-in
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
}

function drawDog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: "green" | "red",
  facing: 1 | -1,
  hp: number,
  now: number,
  active: boolean,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);

  const bodyLight = color === "green" ? "#a4855a" : "#9a6f52";
  const bodyBase = color === "green" ? "#7d6238" : "#78503a";
  const bodyDark = color === "green" ? "#4a3820" : "#4a2e20";
  const teamColor = color === "green" ? "#7dd66a" : "#ff5148";
  const teamDark = color === "green" ? "#3f7a2c" : "#a02824";

  if (hp <= 0) {
    ctx.rotate(Math.PI / 2 * facing * 0.9);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = bodyDark;
    roundRect(ctx, -14, -6, 28, 12, 6); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px Chakra Petch, sans-serif";
    ctx.fillText("X_X", -8, -10);
    ctx.restore();
    return;
  }

  // Idle breathing bob
  const bob = Math.sin(now * 0.004) * 0.9;
  ctx.translate(0, bob);

  ctx.scale(facing, 1);

  // Ground shadow
  ctx.save();
  ctx.scale(1 / facing, 1);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(0, 12, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Tail (wagging when active)
  const wag = active ? Math.sin(now * 0.012) * 0.25 : 0;
  ctx.save();
  ctx.translate(-13, -10);
  ctx.rotate(-0.5 + wag);
  ctx.fillStyle = bodyBase;
  roundRect(ctx, -10, -3, 12, 5, 2.5); ctx.fill();
  ctx.fillStyle = bodyDark;
  ctx.beginPath(); ctx.arc(-10, -0.5, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Back legs
  ctx.fillStyle = bodyDark;
  roundRect(ctx, -10, 4, 6, 8, 2); ctx.fill();
  roundRect(ctx, 4, 4, 6, 8, 2); ctx.fill();

  // Body with gradient
  const bodyG = ctx.createLinearGradient(0, -14, 0, 8);
  bodyG.addColorStop(0, bodyLight);
  bodyG.addColorStop(1, bodyDark);
  ctx.fillStyle = bodyG;
  roundRect(ctx, -14, -14, 28, 22, 10); ctx.fill();

  // Tactical vest
  ctx.fillStyle = teamDark;
  roundRect(ctx, -12, -6, 24, 10, 4); ctx.fill();
  // Vest pockets
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-8, -2, 5, 5);
  ctx.fillRect(-1, -2, 5, 5);
  ctx.fillRect(6, -2, 4, 5);
  // Vest team stripe
  ctx.fillStyle = teamColor;
  ctx.fillRect(-12, -6, 24, 1.5);

  // Head
  ctx.save();
  ctx.translate(10, -14);
  // Snout
  ctx.fillStyle = bodyBase;
  roundRect(ctx, 4, -2, 12, 9, 4); ctx.fill();
  ctx.fillStyle = bodyDark;
  ctx.beginPath(); ctx.arc(15, 0, 2, 0, Math.PI * 2); ctx.fill();
  // Head main
  const headG = ctx.createLinearGradient(0, -10, 0, 8);
  headG.addColorStop(0, bodyLight);
  headG.addColorStop(1, bodyBase);
  ctx.fillStyle = headG;
  roundRect(ctx, -4, -10, 16, 16, 7); ctx.fill();

  // Ear (folded)
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.moveTo(-2, -10); ctx.quadraticCurveTo(-6, -6, -2, -2); ctx.quadraticCurveTo(2, -6, 2, -10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.moveTo(-1, -8); ctx.quadraticCurveTo(-3, -5, -1, -3); ctx.closePath(); ctx.fill();

  // Tactical goggles
  const goggleG = ctx.createLinearGradient(0, -4, 0, 2);
  goggleG.addColorStop(0, "#0a0a0a");
  goggleG.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = goggleG;
  roundRect(ctx, 0, -4, 12, 4, 2); ctx.fill();
  // Lens shine
  ctx.fillStyle = "rgba(140,220,180,0.7)";
  ctx.fillRect(2, -3.5, 3, 1);
  ctx.fillRect(8, -3.5, 2, 1);
  // Goggle strap
  ctx.strokeStyle = bodyDark; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(12, -2); ctx.stroke();

  // Helmet
  ctx.fillStyle = teamDark;
  ctx.beginPath();
  ctx.ellipse(4, -10, 12, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Helmet highlight
  const helmG = ctx.createLinearGradient(0, -17, 0, -8);
  helmG.addColorStop(0, teamColor);
  helmG.addColorStop(1, teamDark);
  ctx.fillStyle = helmG;
  ctx.beginPath();
  ctx.ellipse(4, -10, 11, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Helmet rim
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(-8, -10, 24, 1.5);
  // Star
  ctx.fillStyle = "#fff";
  drawStar(ctx, 4, -13, 2.4, 5);

  ctx.restore();

  // Weapon (rotates by angle when active)
  const gunAngle = active ? -angle * Math.PI / 180 : -0.3;
  ctx.save();
  ctx.translate(14, -6);
  ctx.rotate(gunAngle);
  // Stock
  ctx.fillStyle = "#2a1e14";
  roundRect(ctx, -2, -2, 6, 4, 1); ctx.fill();
  // Barrel
  const barrelG = ctx.createLinearGradient(0, -1.5, 0, 1.5);
  barrelG.addColorStop(0, "#4a4a52");
  barrelG.addColorStop(1, "#1a1a20");
  ctx.fillStyle = barrelG;
  roundRect(ctx, 4, -1.5, 14, 3, 1); ctx.fill();
  // Muzzle
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(17, -1, 2, 2);
  ctx.restore();

  ctx.restore();
}

function drawActiveMarker(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, team: "green" | "red") {
  const bob = Math.sin(now * 0.006) * 3;
  const color = team === "green" ? "#7dd66a" : "#ff5148";
  ctx.save();
  ctx.translate(x, y + bob);
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

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, team: "green" | "red") {
  const w = 42, h = 5;
  ctx.save();
  // Backdrop
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, x - w / 2 - 2, y - 2, w + 4, h + 4, 3); ctx.fill();
  // Fill
  const color = team === "green" ? "#7dd66a" : "#ff5148";
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, color);
  g.addColorStop(1, team === "green" ? "#3f7a2c" : "#a02824");
  ctx.fillStyle = g;
  roundRect(ctx, x - w / 2, y, (w * hp) / 100, h, 2); ctx.fill();
  // Value
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px Chakra Petch, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 3;
  ctx.fillText(`${hp}`, x, y - 5);
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
  const color = WEAPONS[weapon as keyof typeof WEAPONS]?.color ?? "#fff";
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -now * 0.03;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.setLineDash([]);
  // Crosshair
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 - 8, y1); ctx.lineTo(x1 + 8, y1); ctx.moveTo(x1, y1 - 8); ctx.lineTo(x1, y1 + 8); ctx.stroke();
  ctx.restore();
}
