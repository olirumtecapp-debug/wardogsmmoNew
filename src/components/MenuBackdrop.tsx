import { useEffect, useRef } from "react";

/**
 * Animated background for the WarDogs main menu.
 * Renders a dusk sky, parallax ruins, patrolling dog silhouettes,
 * arcing projectiles with tiny explosions, and rising smoke plumes.
 * Pauses while the tab is hidden.
 */
export function MenuBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let running = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const smallScreen = window.innerWidth < 640;
      if (smallScreen) dpr = Math.min(dpr, 1.25);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random() * 0.55, r: Math.random() * 1.2 + 0.3,
      tw: Math.random() * Math.PI * 2,
    }));

    type Proj = { x: number; y: number; vx: number; vy: number; trail: [number, number][]; color: string };
    const projectiles: Proj[] = [];
    type Explosion = { x: number; y: number; age: number; max: number; r: number };
    const explosions: Explosion[] = [];
    type Smoke = { x: number; y: number; r: number; life: number };
    const smokes: Smoke[] = [];

    let lastShot = 0;
    let lastSmoke = 0;

    const dogWalkers = [
      { x: 0.1, speed: 12, y: 0.78, facing: 1 as 1 | -1 },
      { x: 0.6, speed: 8,  y: 0.82, facing: -1 as 1 | -1 },
      { x: 0.35, speed: 10, y: 0.76, facing: 1 as 1 | -1 },
    ];

    const drawMountain = (yBase: number, amp: number, color: string, seed: number, offset: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = 40;
      for (let x = -offset % step; x <= w + step; x += step) {
        const n = Math.sin((x + seed) * 0.008) * 0.6 + Math.sin((x + seed) * 0.021) * 0.4;
        ctx.lineTo(x, yBase + n * amp);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    const drawDogSilhouette = (x: number, y: number, facing: 1 | -1, t: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(facing, 1);
      ctx.fillStyle = "rgba(6,10,14,0.9)";
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // head
      ctx.beginPath();
      ctx.arc(7, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      // ears
      ctx.beginPath();
      ctx.moveTo(6, -6); ctx.lineTo(7, -8); ctx.lineTo(8.5, -5.5); ctx.closePath(); ctx.fill();
      // tail (wag)
      const wag = Math.sin(t * 0.008) * 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -1); ctx.lineTo(-11, -4 + wag); ctx.lineTo(-10, -1); ctx.closePath(); ctx.fill();
      // legs animated
      const g = Math.sin(t * 0.012) * 1.5;
      ctx.fillRect(-5, 2, 1.6, 4 + g);
      ctx.fillRect(-2, 2, 1.6, 4 - g);
      ctx.fillRect(2, 2, 1.6, 4 + g);
      ctx.fillRect(5, 2, 1.6, 4 - g);
      // helmet dome
      ctx.beginPath();
      ctx.ellipse(7, -5, 3.4, 1.8, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Sky
      const skyShift = (Math.sin(now * 0.00008) + 1) * 0.5;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, `oklch(0.16 0.04 ${260 + skyShift * 20})`);
      sky.addColorStop(0.55, `oklch(0.26 0.10 ${40 + skyShift * 20})`);
      sky.addColorStop(0.85, `oklch(0.20 0.08 30)`);
      sky.addColorStop(1, `oklch(0.10 0.02 250)`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Moon
      const moonX = w * 0.82, moonY = h * 0.18;
      const moonG = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
      moonG.addColorStop(0, "rgba(255,240,210,0.9)");
      moonG.addColorStop(0.15, "rgba(255,230,190,0.35)");
      moonG.addColorStop(1, "rgba(255,220,180,0)");
      ctx.fillStyle = moonG;
      ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
      ctx.fillStyle = "rgba(255,240,215,0.95)";
      ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI * 2); ctx.fill();

      // Stars
      for (const s of stars) {
        s.tw += dt * 2;
        const a = 0.4 + (Math.sin(s.tw) + 1) * 0.3;
        ctx.fillStyle = `rgba(240,240,220,${a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant sun glow
      const sunG = ctx.createRadialGradient(w * 0.15, h * 0.55, 0, w * 0.15, h * 0.55, w * 0.4);
      sunG.addColorStop(0, "rgba(255,150,60,0.35)");
      sunG.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = sunG;
      ctx.fillRect(0, 0, w, h);

      // Parallax mountains (drift slowly)
      const drift = now * 0.005;
      drawMountain(h * 0.62, 30, "rgba(12,18,26,0.75)", 100, drift * 0.6);
      drawMountain(h * 0.72, 22, "rgba(10,14,22,0.9)", 300, drift);
      drawMountain(h * 0.82, 16, "rgba(6,10,16,1)", 550, drift * 1.6);

      // Ruins silhouettes on the horizon
      ctx.fillStyle = "rgba(4,6,10,1)";
      for (let i = 0; i < 8; i++) {
        const rx = ((i * w / 8) + (drift * 1.6) % (w / 8)) - 40;
        const rh = 20 + ((i * 37) % 30);
        ctx.fillRect(rx, h * 0.82 - rh, 14, rh);
        ctx.fillRect(rx + 20, h * 0.82 - rh * 0.6, 10, rh * 0.6);
      }

      // Patrolling dogs
      for (const d of dogWalkers) {
        d.x += (d.speed * dt) / w * d.facing;
        if (d.x > 1.1) { d.x = -0.1; }
        if (d.x < -0.1) { d.x = 1.1; }
        drawDogSilhouette(d.x * w, d.y * h, d.facing, now);
      }

      // Spawn projectiles
      if (now - lastShot > 1400 + Math.random() * 1200) {
        lastShot = now;
        const fromLeft = Math.random() < 0.5;
        const x0 = fromLeft ? -20 : w + 20;
        const y0 = h * (0.55 + Math.random() * 0.15);
        const targetX = fromLeft ? w * (0.4 + Math.random() * 0.4) : w * (0.2 + Math.random() * 0.4);
        const targetY = h * (0.7 + Math.random() * 0.1);
        const t = 2.2 + Math.random() * 0.6;
        const g = 260;
        const vx = (targetX - x0) / t;
        const vy = (targetY - y0 - 0.5 * g * t * t) / t;
        projectiles.push({
          x: x0, y: y0, vx, vy, trail: [],
          color: Math.random() < 0.5 ? "#ff8c1a" : "#7dd66a",
        });
      }

      // Update projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.trail.push([p.x, p.y]);
        if (p.trail.length > 22) p.trail.shift();

        // Draw trail
        for (let k = 0; k < p.trail.length; k++) {
          const a = k / p.trail.length;
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.trail[k][0], p.trail[k][1], 1 + a * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (p.y >= h * 0.83 || p.x < -60 || p.x > w + 60) {
          explosions.push({ x: p.x, y: Math.min(p.y, h * 0.83), age: 0, max: 0.7, r: 22 + Math.random() * 14 });
          smokes.push({ x: p.x, y: h * 0.83, r: 4, life: 3 });
          projectiles.splice(i, 1);
        }
      }

      // Explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        e.age += dt;
        const t2 = e.age / e.max;
        if (t2 >= 1) { explosions.splice(i, 1); continue; }
        const r = e.r * (0.4 + t2 * 1.2);
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        g.addColorStop(0, `rgba(255,240,180,${(1 - t2) * 0.9})`);
        g.addColorStop(0.5, `rgba(255,140,40,${(1 - t2) * 0.7})`);
        g.addColorStop(1, "rgba(255,80,20,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      }

      // Rising smoke plumes (ambient)
      if (now - lastSmoke > 400) {
        lastSmoke = now;
        smokes.push({ x: Math.random() * w, y: h * 0.83, r: 3 + Math.random() * 3, life: 4 + Math.random() * 3 });
      }
      for (let i = smokes.length - 1; i >= 0; i--) {
        const s = smokes[i];
        s.life -= dt;
        s.y -= 12 * dt;
        s.r += 6 * dt;
        if (s.life <= 0) { smokes.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, s.life / 5) * 0.35;
        ctx.fillStyle = "rgba(60,60,70,1)";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
