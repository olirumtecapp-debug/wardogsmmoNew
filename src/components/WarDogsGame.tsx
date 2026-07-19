import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, WeaponId } from "@/game/types";
import { createGame, cycleWeapon, fire, setWeapon, step } from "@/game/engine";
import { render, markTerrainDirty } from "@/game/render";
import { aiTakeTurn } from "@/game/ai";
import { WEAPONS, WEAPON_ORDER } from "@/game/weapons";

interface Props {
  mode: GameMode;
  onExit: () => void;
}

export function WarDogsGame({ mode, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const aiTriggeredRef = useRef(false);
  const powerHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const angleHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; dogX: number; dogY: number } | null>(null);
  const [, setTick] = useState(0);

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!stateRef.current) {
        stateRef.current = createGame(w, h, mode);
      } else if (stateRef.current.width !== w || stateRef.current.height !== h) {
        // Recreate with same seed to keep terrain consistent
        stateRef.current = createGame(w, h, mode, stateRef.current.seed);
      }
      markTerrainDirty();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current!;
      // Handle hold-to-adjust
      if (angleHoldRef.current) {
        s.angle = Math.max(5, Math.min(88, s.angle + angleHoldRef.current.dir * 45 * dt));
      }
      if (powerHoldRef.current) {
        s.power = Math.max(10, Math.min(100, s.power + powerHoldRef.current.dir * 55 * dt));
      }
      step(s, dt);
      const ctx = canvas.getContext("2d")!;
      render(ctx, s);
      setTick(t => (t + 1) % 1000);

      // AI turn
      if (mode === "ai" && s.currentPlayer === 1 && s.phase === "aiming" && !aiTriggeredRef.current && s.winner === null) {
        aiTriggeredRef.current = true;
        setTimeout(() => aiTakeTurn(s), 600);
      }
      if (s.currentPlayer === 0 || s.phase !== "aiming") aiTriggeredRef.current = false;

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [mode]);

  // Keyboard controls
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (mode === "ai" && s.currentPlayer === 1) return;
      if (s.phase !== "aiming" || s.winner !== null) return;
      switch (e.key) {
        case "ArrowLeft": angleHoldRef.current = { dir: 1, last: 0 }; break;
        case "ArrowRight": angleHoldRef.current = { dir: -1, last: 0 }; break;
        case "ArrowUp": powerHoldRef.current = { dir: 1, last: 0 }; break;
        case "ArrowDown": powerHoldRef.current = { dir: -1, last: 0 }; break;
        case " ": e.preventDefault(); fire(s); break;
        case "Tab": e.preventDefault(); cycleWeapon(s, 1); break;
        case "1": setWeapon(s, "revolver"); break;
        case "2": setWeapon(s, "ak47"); break;
        case "3": setWeapon(s, "bazooka"); break;
        case "4": setWeapon(s, "grenade"); break;
        case "5": setWeapon(s, "artillery"); break;
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") angleHoldRef.current = null;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") powerHoldRef.current = null;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [mode]);

  // Touch/pointer aim: drag anywhere to aim from current dog
  useEffect(() => {
    const canvas = canvasRef.current!;
    const onDown = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s || s.phase !== "aiming" || s.winner !== null) return;
      if (mode === "ai" && s.currentPlayer === 1) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dog = s.dogs[s.currentPlayer];
      dragRef.current = { startX: px, startY: py, dogX: dog.x, dogY: dog.y };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      const drag = dragRef.current;
      if (!s || !drag) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dx = px - drag.startX;
      const dy = py - drag.startY;
      // Vector *away* from drag point = shot direction
      const dog = s.dogs[s.currentPlayer];
      const shotX = -dx, shotY = -dy;
      const mag = Math.hypot(shotX, shotY);
      if (mag > 6) {
        const ang = Math.atan2(-shotY, Math.abs(shotX)) * 180 / Math.PI;
        s.angle = Math.max(5, Math.min(88, ang));
        s.power = Math.max(15, Math.min(100, mag * 0.6));
        dog.facing = shotX >= 0 ? 1 : -1;
      }
    };
    const onUp = (e: PointerEvent) => {
      const s = stateRef.current;
      const drag = dragRef.current;
      dragRef.current = null;
      if (!s || !drag) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dist = Math.hypot(px - drag.startX, py - drag.startY);
      if (dist > 20 && s.phase === "aiming" && s.winner === null) fire(s);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [mode]);

  const s = stateRef.current;
  const currentTeam = s?.currentPlayer === 0 ? "green" : "red";
  const isAiTurn = mode === "ai" && s?.currentPlayer === 1;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background touch-none select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top HUD */}
      {s && (
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 pointer-events-none">
          {/* Player cards */}
          <div className="flex flex-col gap-2">
            <PlayerCard team="green" hp={s.dogs[0].hp} active={s.currentPlayer === 0} />
            <PlayerCard team="red" hp={s.dogs[1].hp} active={s.currentPlayer === 1} />
          </div>
          {/* Center message */}
          <div className="panel px-4 py-2 pointer-events-auto max-w-[45%] text-center">
            <div className="stencil text-xs text-muted-foreground uppercase tracking-widest">
              {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentTeam === "green" ? "Verde" : "Vermelho"}`}
            </div>
            <div className="text-sm font-semibold mt-0.5">{s.message}</div>
            {s.phase === "aiming" && s.winner === null && (
              <div className="text-xs text-muted-foreground mt-1">
                {isAiTurn ? "IA pensando..." : `${Math.max(0, Math.ceil(s.turnTimer))}s`}
              </div>
            )}
          </div>
          {/* Wind + exit */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <button onClick={onExit} className="btn-hud text-xs">Sair</button>
            <WindGauge wind={s.wind} />
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      {s && s.phase !== "gameover" && (
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 pointer-events-none">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Weapons */}
            <div className="panel p-2 pointer-events-auto flex gap-1.5 overflow-x-auto justify-center">
              {WEAPON_ORDER.map(id => {
                const w = WEAPONS[id];
                const ammo = s.ammo[id];
                const disabled = ammo === 0;
                const active = s.weapon === id;
                return (
                  <button
                    key={id}
                    disabled={disabled || isAiTurn}
                    onClick={() => setWeapon(s, id)}
                    className={`btn-hud text-xs px-2.5 py-2 whitespace-nowrap ${active ? "btn-primary" : ""} ${disabled ? "opacity-30" : ""}`}
                  >
                    <span className="mr-1" style={{ color: w.color }}>●</span>
                    {w.name}
                    {ammo > 0 && <span className="ml-1.5 text-[10px] opacity-70">×{ammo}</span>}
                    {ammo === -1 && <span className="ml-1.5 text-[10px] opacity-70">∞</span>}
                  </button>
                );
              })}
            </div>
            {/* Controls row */}
            <div className="flex items-end gap-2">
              <div className="panel p-2 flex-1 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="stencil text-xs w-14">Ângulo</span>
                  <HoldButton onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={1}>−</HoldButton>
                  <div className="flex-1 text-center stencil text-lg">{Math.round(s.angle)}°</div>
                  <HoldButton onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={-1}>+</HoldButton>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="stencil text-xs w-14">Força</span>
                  <HoldButton onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={-1}>−</HoldButton>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent transition-[width] duration-75" style={{ width: `${s.power}%` }} />
                  </div>
                  <HoldButton onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={1}>+</HoldButton>
                  <span className="stencil text-xs w-8 text-right">{Math.round(s.power)}</span>
                </div>
              </div>
              <button
                disabled={isAiTurn || s.phase !== "aiming"}
                onClick={() => fire(s)}
                className="btn-hud btn-danger stencil text-base px-5 py-4 pointer-events-auto disabled:opacity-40"
              >
                Fogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {s?.phase === "gameover" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="panel p-6 sm:p-8 text-center max-w-sm">
            <div className="stencil text-xs text-muted-foreground uppercase tracking-widest">Combate encerrado</div>
            <h2 className="stencil text-3xl mt-2" style={{ color: s.winner === 0 ? "var(--team-green)" : s.winner === 1 ? "var(--team-red)" : undefined }}>
              {s.winner === null ? "Empate" : `Vitória ${s.winner === 0 ? "Verde" : "Vermelho"}`}
            </h2>
            <div className="flex gap-2 mt-6 justify-center">
              <button className="btn-hud btn-primary" onClick={() => { stateRef.current = null; canvasRef.current?.parentElement?.dispatchEvent(new Event("resize")); location.reload(); }}>Revanche</button>
              <button className="btn-hud" onClick={onExit}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ team, hp, active }: { team: "green" | "red"; hp: number; active: boolean }) {
  const color = team === "green" ? "var(--team-green)" : "var(--team-red)";
  return (
    <div className={`panel px-3 py-1.5 flex items-center gap-2 pointer-events-auto ${active ? "ring-2" : "opacity-70"}`} style={active ? { boxShadow: `0 0 0 2px ${color}` } : undefined}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <div className="stencil text-xs uppercase">{team === "green" ? "Verde" : "Vermelho"}</div>
      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${hp}%`, background: color }} />
      </div>
      <div className="text-xs font-semibold w-8 text-right">{hp}</div>
    </div>
  );
}

function WindGauge({ wind }: { wind: number }) {
  const abs = Math.abs(wind);
  const dir = wind >= 0 ? "→" : "←";
  return (
    <div className="panel px-3 py-1.5 flex items-center gap-2">
      <span className="stencil text-xs uppercase text-muted-foreground">Vento</span>
      <span className="text-lg leading-none" style={{ color: abs > 0.6 ? "var(--warn)" : undefined }}>{dir}</span>
      <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${abs * 100}%` }} />
      </div>
    </div>
  );
}

function HoldButton({ children, onHold, onRelease, dir }: { children: React.ReactNode; onHold: (dir: 1 | -1) => void; onRelease: () => void; dir: 1 | -1 }) {
  return (
    <button
      className="btn-hud px-3 py-2 text-lg leading-none"
      onPointerDown={e => { e.preventDefault(); onHold(dir); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
    >
      {children}
    </button>
  );
}

// Explicit weapon id list export helper (in case caller wants it)
export type { WeaponId };
