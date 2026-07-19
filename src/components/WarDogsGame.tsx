import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, WeaponId } from "@/game/types";
import { createGame, fire, setWeapon, step } from "@/game/engine";
import { render, markTerrainDirty } from "@/game/render";
import { aiTakeTurn } from "@/game/ai";
import { WEAPONS, WEAPON_ORDER } from "@/game/weapons";

interface Props {
  mode: GameMode;
  onExit: () => void;
}

// Compact icon per weapon (SVG paths as simple text glyphs)
const WEAPON_ICON: Record<WeaponId, string> = {
  bazooka: "🚀",
  grenade: "💣",
  dynamite: "🧨",
  cluster: "✳",
  airstrike: "✈",
  revolver: "🔫",
  ak47: "🎯",
};

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

  // Pointer aiming: drag anywhere to fine-tune angle/power
  useEffect(() => {
    const canvas = canvasRef.current!;
    const onDown = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s || s.phase !== "aiming" || s.winner === null && mode === "ai" && s.currentPlayer === 1) return;
      const rect = canvas.getBoundingClientRect();
      const dog = s.dogs[s.currentPlayer];
      dragRef.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top, dogX: dog.x, dogY: dog.y };
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      const drag = dragRef.current;
      if (!s || !drag) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dog = s.dogs[s.currentPlayer];
      const dx = (px - drag.startX) * -dog.facing;
      const dy = drag.startY - py;
      if (Math.hypot(px - drag.startX, py - drag.startY) > 6) {
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        if (ang >= 0 && ang <= 90) s.angle = Math.max(5, Math.min(88, ang));
        const pw = Math.min(100, Math.hypot(px - drag.startX, py - drag.startY) * 1.2);
        if (pw > 15) s.power = pw;
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
  const hudVisible = s?.phase === "aiming" && s?.winner === null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background touch-none select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top HUD — mini player cards + wind + exit */}
      {s && (
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2 sm:p-3 gap-2 pointer-events-none">
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <MiniPlayer team="green" hp={s.dogs[0].hp} active={s.currentPlayer === 0} />
            <MiniPlayer team="red" hp={s.dogs[1].hp} active={s.currentPlayer === 1} />
          </div>

          <div className="panel px-3 py-1.5 pointer-events-auto text-center max-w-[45%]">
            <div className="stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentTeam === "green" ? "Verde" : "Vermelho"}`}
            </div>
            <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-tight">{s.message}</div>
            {s.phase === "aiming" && s.winner === null && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {isAiTurn ? "IA pensando..." : `${Math.max(0, Math.ceil(s.turnTimer))}s`}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            <button onClick={onExit} className="btn-hud text-[10px] px-2 py-1">Sair</button>
            <WindGauge wind={s.wind} />
          </div>
        </div>
      )}

      {/* Bottom HUD — floating, auto-hides during firing */}
      {s && s.phase !== "gameover" && (
        <div className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 pointer-events-none ${hudVisible ? "hud-show" : "hud-hide"}`}>
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* Weapons carousel */}
            <div className="panel px-2 py-1.5 pointer-events-auto flex gap-1 overflow-x-auto justify-center scrollbar-none">
              {WEAPON_ORDER.map(id => {
                const w = WEAPONS[id];
                const ammo = s.ammo[id];
                const disabled = ammo === 0;
                const active = s.weapon === id;
                return (
                  <button
                    key={id}
                    disabled={disabled || isAiTurn || s.phase !== "aiming"}
                    onClick={() => { setWeapon(s, id); setTick(t => (t + 1) % 1000); }}
                    title={w.name}
                    className={`btn-hud !px-2 !py-1.5 flex-col leading-none min-w-[46px] ${active ? "btn-primary" : ""} ${disabled ? "opacity-30" : ""}`}
                    style={active ? { borderColor: w.color } : undefined}
                  >
                    <span className="text-base" style={{ filter: active ? "none" : "grayscale(0.3)" }}>{WEAPON_ICON[id]}</span>
                    <span className="text-[8px] mt-0.5 opacity-80">
                      {ammo === -1 ? "∞" : `×${ammo}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Controls: single row with angle, power, fire */}
            <div className="flex items-stretch gap-2">
              <div className="panel px-2 py-1.5 flex-1 pointer-events-auto flex items-center gap-2">
                {/* Angle */}
                <div className="flex items-center gap-1">
                  <HoldButton onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={1}>−</HoldButton>
                  <div className="flex flex-col items-center min-w-[42px]">
                    <span className="stencil text-[9px] text-muted-foreground leading-none">ÂNG</span>
                    <span className="stencil text-base leading-tight" style={{ color: "var(--accent)" }}>{Math.round(s.angle)}°</span>
                  </div>
                  <HoldButton onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={-1}>+</HoldButton>
                </div>

                <div className="w-px h-8 bg-border/60" />

                {/* Power */}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <HoldButton onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={-1}>−</HoldButton>
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="stencil text-[9px] text-muted-foreground leading-none">FORÇA</span>
                      <span className="stencil text-xs leading-none" style={{ color: "var(--accent)" }}>{Math.round(s.power)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                      <div
                        className="h-full transition-[width] duration-75 rounded-full"
                        style={{
                          width: `${s.power}%`,
                          background: `linear-gradient(90deg, var(--team-green), var(--accent) 60%, var(--destructive))`,
                          boxShadow: "0 0 8px rgba(255,180,80,0.5)",
                        }}
                      />
                    </div>
                  </div>
                  <HoldButton onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={1}>+</HoldButton>
                </div>
              </div>

              <button
                disabled={isAiTurn || s.phase !== "aiming"}
                onClick={() => fire(s)}
                className="fire-btn pointer-events-auto"
              >
                FOGO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {s?.phase === "gameover" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="panel p-6 sm:p-8 text-center max-w-sm">
            <div className="stencil text-xs text-muted-foreground uppercase tracking-[0.25em]">Combate encerrado</div>
            <h2 className="stencil text-3xl mt-2" style={{ color: s.winner === 0 ? "var(--team-green)" : s.winner === 1 ? "var(--team-red)" : undefined }}>
              {s.winner === null ? "Empate" : `Vitória ${s.winner === 0 ? "Verde" : "Vermelho"}`}
            </h2>
            <div className="flex gap-2 mt-6 justify-center">
              <button className="btn-hud btn-primary" onClick={() => { stateRef.current = null; location.reload(); }}>Revanche</button>
              <button className="btn-hud" onClick={onExit}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniPlayer({ team, hp, active }: { team: "green" | "red"; hp: number; active: boolean }) {
  const color = team === "green" ? "var(--team-green)" : "var(--team-red)";
  return (
    <div
      className={`panel px-2 py-1 flex items-center gap-1.5 transition-all ${active ? "" : "opacity-60 scale-95"}`}
      style={active ? { boxShadow: `0 0 0 1.5px ${color}, 0 0 16px ${color}66`, borderColor: color } : undefined}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <div className="stencil text-[9px] uppercase tracking-widest">{team === "green" ? "Verde" : "Vermelho"}</div>
      <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div className="h-full transition-all rounded-full" style={{ width: `${hp}%`, background: color }} />
      </div>
      <div className="text-[10px] font-bold w-6 text-right tabular-nums">{hp}</div>
    </div>
  );
}

function WindGauge({ wind }: { wind: number }) {
  const abs = Math.abs(wind);
  const rot = wind >= 0 ? 0 : 180;
  return (
    <div className="panel px-2 py-1 flex items-center gap-1.5">
      <span className="stencil text-[9px] uppercase text-muted-foreground tracking-widest">Vento</span>
      <svg width="18" height="14" viewBox="0 0 18 14" style={{ transform: `rotate(${rot}deg)`, transition: "transform 300ms" }}>
        <path d="M2 7 L14 7 M11 3 L14 7 L11 11" stroke={abs > 0.6 ? "var(--warn)" : "currentColor"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="w-10 h-1 bg-black/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${abs * 100}%`, background: abs > 0.6 ? "var(--warn)" : "var(--accent)" }} />
      </div>
    </div>
  );
}

function HoldButton({ children, onHold, onRelease, dir }: { children: React.ReactNode; onHold: (dir: 1 | -1) => void; onRelease: () => void; dir: 1 | -1 }) {
  return (
    <button
      className="btn-hud !px-2 !py-1 !text-base leading-none min-w-[26px]"
      onPointerDown={e => { e.preventDefault(); onHold(dir); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
    >
      {children}
    </button>
  );
}

export type { WeaponId };
