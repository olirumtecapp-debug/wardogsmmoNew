import type { GameState } from "./types";
import { WEAPONS } from "./weapons";

const SKY_TOP = "#3a4a2a";
const SKY_BOTTOM = "#1a2410";
const GRASS_TOP = "#6b8e3d";
const GRASS_DARK = "#3e5622";
const DIRT = "#3a2818";

let terrainCanvas: HTMLCanvasElement | null = null;
let terrainDirty = true;
let lastTerrainRef: Uint8Array | null = null;

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
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = y * state.width + x;
        const j = i * 4;
        if (t[i]) {
          // grass surface if air above
          const above = y > 0 && !t[i - state.width];
          const nearSurface = above || (y > 1 && !t[i - state.width * 2]);
          if (above) {
            img.data[j] = 0x8f; img.data[j + 1] = 0xc5; img.data[j + 2] = 0x4a;
          } else if (nearSurface) {
            img.data[j] = 0x6b; img.data[j + 1] = 0x8e; img.data[j + 2] = 0x3d;
          } else if (y > 3 && !t[i - state.width * 4]) {
            img.data[j] = 0x54; img.data[j + 1] = 0x6a; img.data[j + 2] = 0x2d;
          } else {
            // dirt with noise
            const n = ((x * 928371 + y * 12971) % 25);
            img.data[j] = 0x3a + n; img.data[j + 1] = 0x28 + (n >> 1); img.data[j + 2] = 0x18;
          }
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

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width: w, height: h } = state;

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Distant mountains
  ctx.fillStyle = "#2a3820";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, h * 0.7 - Math.sin(x * 0.008 + state.seed * 0.001) * 40 - 20);
  }
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

  // Terrain
  const tc = ensureTerrainCanvas(state);
  ctx.drawImage(tc, 0, 0);

  // Dogs
  for (const dog of state.dogs) {
    drawDog(ctx, dog.x, dog.y, dog.team === 0 ? "green" : "red", dog.facing, dog.hp);
    // HP bar above
    drawHpBar(ctx, dog.x, dog.y - 32, dog.hp, dog.team === 0 ? "green" : "red");
  }

  // Aim indicator for current player
  if (state.phase === "aiming" && state.winner === null) {
    const dog = state.dogs[state.currentPlayer];
    if (dog.hp > 0) drawAim(ctx, dog, state.angle, state.power, state.wind, state.weapon);
  }

  // Projectiles
  for (const p of state.projectiles) {
    const w2 = WEAPONS[p.weapon];
    ctx.strokeStyle = w2.color + "88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < p.trail.length; i++) {
      const [tx, ty] = p.trail[i];
      if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    ctx.fillStyle = w2.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, w2.id === "grenade" ? 5 : 4, 0, Math.PI * 2); ctx.fill();
  }

  // Explosions
  for (const e of state.explosions) {
    const t = e.age / e.maxAge;
    if (t < 1) {
      const r = e.radius * (0.4 + t * 0.9);
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      g.addColorStop(0, "rgba(255,240,180,0.95)");
      g.addColorStop(0.4, "rgba(255,140,40,0.7)");
      g.addColorStop(1, "rgba(80,20,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
    }
    for (const pt of e.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

function drawDog(ctx: CanvasRenderingContext2D, x: number, y: number, color: "green" | "red", facing: 1 | -1, hp: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const bodyColor = color === "green" ? "#8b6f3a" : "#7a5a3a";
  const bodyDark = color === "green" ? "#5f4a20" : "#513a20";
  const teamColor = color === "green" ? "#7fbf3f" : "#e0403a";

  if (hp <= 0) {
    // Fallen
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-14, -4, 28, 8);
    ctx.fillStyle = "#000";
    ctx.font = "12px system-ui";
    ctx.fillText("X_X", -8, -8);
    ctx.restore();
    return;
  }

  // Body (rounded rect)
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -14, -14, 28, 20, 8); ctx.fill();
  // Belly shadow
  ctx.fillStyle = bodyDark;
  roundRect(ctx, -14, -4, 28, 10, 5); ctx.fill();

  // Legs
  ctx.fillStyle = bodyDark;
  ctx.fillRect(-11, 4, 5, 6);
  ctx.fillRect(6, 4, 5, 6);

  // Tail
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-22, -14, -18, -20); ctx.lineTo(-14, -14); ctx.closePath(); ctx.fill();

  // Head
  ctx.fillStyle = bodyColor;
  roundRect(ctx, 6, -22, 18, 16, 6); ctx.fill();
  // Snout
  ctx.fillStyle = bodyDark;
  roundRect(ctx, 18, -12, 8, 6, 3); ctx.fill();
  // Nose
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(25, -10, 1.8, 0, Math.PI * 2); ctx.fill();
  // Eye (grumpy)
  ctx.strokeStyle = "#111"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(13, -16); ctx.lineTo(18, -14); ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(16, -14.5, 1.4, 0, Math.PI * 2); ctx.fill();
  // Eyebrow (angry)
  ctx.strokeStyle = "#3a2410"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(11, -19); ctx.lineTo(19, -17); ctx.stroke();

  // Helmet
  ctx.fillStyle = teamColor;
  ctx.beginPath();
  ctx.ellipse(15, -24, 13, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color === "green" ? "#5a8a2a" : "#a02020";
  ctx.fillRect(2, -24, 26, 2);
  // Helmet strap
  ctx.strokeStyle = "#2a1e10"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(9, -14); ctx.stroke();
  // Star on helmet
  ctx.fillStyle = "#fff";
  drawStar(ctx, 15, -26, 3, 5);

  // Ear
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.moveTo(8, -20); ctx.lineTo(4, -12); ctx.lineTo(10, -14); ctx.closePath(); ctx.fill();

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
  const w = 40, h = 5;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = team === "green" ? "#7fbf3f" : "#e0403a";
  ctx.fillRect(x - w / 2, y, (w * hp) / 100, h);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px Rajdhani, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${hp}`, x, y - 3);
  ctx.textAlign = "start";
}

function drawAim(ctx: CanvasRenderingContext2D, dog: { x: number; y: number; facing: 1 | -1 }, angle: number, power: number, _wind: number, weapon: string) {
  const rad = (angle * Math.PI) / 180;
  const dir = dog.facing;
  const len = 28 + (power / 100) * 40;
  const x0 = dog.x + dir * 18;
  const y0 = dog.y - 6;
  const x1 = x0 + Math.cos(rad) * dir * len;
  const y1 = y0 - Math.sin(rad) * len;
  // Dashed line
  ctx.save();
  ctx.strokeStyle = WEAPONS[weapon as keyof typeof WEAPONS]?.color ?? "#fff";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.setLineDash([]);
  // Arrow head
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(x1, y1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
