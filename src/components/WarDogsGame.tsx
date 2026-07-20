import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, WeaponId } from "@/game/types";
import { createGame, fire, jumpDog, moveDog, MOVE_BUDGET, setWeapon, step } from "@/game/engine";
import { render, markTerrainDirty } from "@/game/render";
import { aiTakeTurn } from "@/game/ai";
import { WEAPONS, WEAPON_ORDER } from "@/game/weapons";
import { teamSkin } from "@/game/skins";
import { useScenario } from "@/game/scenarioContext";
import rangerPortrait from "@/assets/wardogs-ranger.png.asset.json";
import brutusPortrait from "@/assets/wardogs-brutus.png.asset.json";

const PORTRAITS: Record<string, string> = {
  RANGER: rangerPortrait.url,
  BRUTUS: brutusPortrait.url,
};

const WEAPON_DESC: Record<WeaponId, string> = {
  bazooka: "Foguete clássico. Voa em arco e sofre o vento — a arma segura de todo turno.",
  grenade: "Granada com pavio de 2.5s. Quica no terreno antes de explodir com raio generoso.",
  rpg: "Foguete rápido de baixa gravidade. Ignora o vento — mira quase reta em alvos distantes.",
  bow: "Flecha leve e precisa. Dano menor, mas trajetória mais tensa e certeira em curta distância.",
  artillery: "Obus pesado com o maior raio de explosão. Cai forte, ideal pra destruir terreno.",
  frag: "Frag rápida com pavio curto (1s). Boa pra acertos próximos que não dão tempo de fugir.",
  cluster: "Munição cluster: no impacto libera 4 sub-bombas que espalham dano em área.",
  airstrike: "Chame um bombardeio aéreo. Toque no céu pra marcar o alvo — 3 bombas em linha.",
};


interface Props {
  mode: GameMode;
  onExit: () => void;
}

function WeaponIcon({ id, className }: { id: WeaponId; className?: string }) {
  const cls = className ?? "w-7 h-7";
  switch (id) {
    case "bazooka":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><linearGradient id="wi-bz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffcf6b" /><stop offset="1" stopColor="#ff5a0e" /></linearGradient></defs>
          <path d="M3 17 L21 12 L28 13 L29 17 L28 21 L21 22 L3 18 Z" fill="url(#wi-bz)" stroke="#1a1108" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 13 L11 8 L15 10" stroke="#1a1108" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="17" r="1.4" fill="#1a1108" />
          <path d="M3 17 L1 15 M3 17 L1 19" stroke="#ffe08a" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "grenade":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><radialGradient id="wi-gr" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#c3e07a" /><stop offset="1" stopColor="#3d5220" /></radialGradient></defs>
          <path d="M14 4 h4 v3 h-4z" fill="#8a8a8a" />
          <circle cx="16" cy="19" r="9" fill="url(#wi-gr)" stroke="#1a1108" strokeWidth="1.2" />
          <path d="M7 19 h18 M16 10 v18" stroke="#1a1108" strokeWidth="0.9" strokeOpacity="0.55" />
          <circle cx="16" cy="10" r="1.2" fill="#f4d02c" />
        </svg>
      );
    case "rpg":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><linearGradient id="wi-rp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7ff0ff" /><stop offset="0.5" stopColor="#2b7fff" /><stop offset="1" stopColor="#0e2a80" /></linearGradient></defs>
          <path d="M5 17 L21 13 L27 14 L29 16 L27 18 L21 19 L5 18 Z" fill="url(#wi-rp)" stroke="#0a1128" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M22 11 L20 13 M22 23 L20 20" stroke="#0a1128" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="24" cy="16" r="1.1" fill="#7ff0ff" />
        </svg>
      );
    case "bow":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><linearGradient id="wi-bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfffb0" /><stop offset="1" stopColor="#5a8a2e" /></linearGradient></defs>
          <path d="M9 4 C 22 8, 22 24, 9 28" stroke="url(#wi-bw)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M4 16 L26 16" stroke="#c9b48a" strokeWidth="1.4" />
          <path d="M26 16 L21 13 L21 19 Z" fill="#e8e8ee" stroke="#1a1108" strokeWidth="0.8" />
          <path d="M4 16 L7 13 M4 16 L7 19" stroke="#ff4d9e" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "artillery":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><linearGradient id="wi-ar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8a95" /><stop offset="1" stopColor="#8a1428" /></linearGradient></defs>
          <path d="M6 22 L14 22 L23 11 L27 11 L27 15 L18 26 L6 26 Z" fill="url(#wi-ar)" stroke="#1a0308" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="9" cy="26" r="2.4" fill="#1a1108" />
          <circle cx="15" cy="26" r="2.4" fill="#1a1108" />
          <path d="M22 12 L28 6" stroke="#ffcc33" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="28" cy="6" r="1.3" fill="#ffcc33" />
        </svg>
      );
    case "frag":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><radialGradient id="wi-fg" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stopColor="#d3f27a" /><stop offset="1" stopColor="#2e4210" /></radialGradient></defs>
          <path d="M13 3 h6 v3 h-6z" fill="#8a8a8a" />
          <circle cx="16" cy="18" r="10" fill="url(#wi-fg)" stroke="#1a1108" strokeWidth="1.2" />
          <path d="M8 18 h16 M16 10 v16" stroke="#1a1108" strokeWidth="0.8" opacity="0.6" />
          <path d="M6 8 l3 -3 M23 5 l3 3" stroke="#ffdc4a" strokeWidth="1.4" strokeLinecap="round" />
          <text x="16" y="21" textAnchor="middle" fontFamily="Black Ops One" fontSize="7" fill="#1a1108">F</text>
        </svg>
      );
    case "cluster":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><radialGradient id="wi-cl" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stopColor="#ff9ec8" /><stop offset="1" stopColor="#8a184e" /></radialGradient></defs>
          <circle cx="16" cy="16" r="7" fill="url(#wi-cl)" stroke="#1a0108" strokeWidth="1" />
          <circle cx="5" cy="7" r="3" fill="url(#wi-cl)" stroke="#1a0108" strokeWidth="0.8" />
          <circle cx="27" cy="6" r="3" fill="url(#wi-cl)" stroke="#1a0108" strokeWidth="0.8" />
          <circle cx="6" cy="26" r="3" fill="url(#wi-cl)" stroke="#1a0108" strokeWidth="0.8" />
          <circle cx="26" cy="26" r="3" fill="url(#wi-cl)" stroke="#1a0108" strokeWidth="0.8" />
          <path d="M11 12 L7 9 M21 12 L25 9 M11 21 L8 24 M21 21 L24 24" stroke="#ffdc4a" strokeWidth="0.9" />
        </svg>
      );
    case "airstrike":
      return (
        <svg viewBox="0 0 32 32" className={cls} fill="none">
          <defs><linearGradient id="wi-as" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffe6a0" /><stop offset="1" stopColor="#ff2a2a" /></linearGradient></defs>
          <path d="M2 12 L18 8 L28 10 L30 12 L28 14 L18 16 L2 14 Z" fill="url(#wi-as)" stroke="#1a0208" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M12 10 L8 4 L16 8 M12 15 L8 21 L16 17" fill="#e94560" stroke="#1a0208" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="26" cy="12" r="1.1" fill="#fff" />
          <path d="M4 22 L28 22 M6 26 L26 26" stroke="#ff2a2a" strokeWidth="1.2" strokeDasharray="2 2" strokeLinecap="round" />
        </svg>
      );
  }
}


export function WarDogsGame({ mode, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const aiTriggeredRef = useRef(false);
  const powerHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const angleHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const moveHoldRef = useRef<{ dir: 1 | -1 } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; dogX: number; dogY: number } | null>(null);
  const [, setTick] = useState(0);
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [hoveredWeapon, setHoveredWeapon] = useState<WeaponId | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!.parentElement!; // the flex-1 container
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const initIfNeeded = () => {
      if (stateRef.current) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      // Reserve bottom band for the overlaid HUD (scales with viewport)
      const hudReserve = window.matchMedia("(min-width: 640px)").matches ? 130 : 118;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current = createGame(w, h, mode, undefined, hudReserve);
      markTerrainDirty();
    };

    // Adapt display size to the container without recreating the world.
    // Terrain is baked into the state; we only rescale the CSS box.
    const adaptDisplay = () => {
      const s = stateRef.current;
      if (!s) return;
      const rect = parent.getBoundingClientRect();
      const availW = Math.max(1, rect.width);
      const availH = Math.max(1, rect.height);
      const scale = Math.min(availW / s.width, availH / s.height);
      const cssW = Math.floor(s.width * scale);
      const cssH = Math.floor(s.height * scale);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      setDisplaySize(prev => (prev.w === cssW && prev.h === cssH ? prev : { w: cssW, h: cssH }));
    };

    initIfNeeded();
    adaptDisplay();
    const ro = new ResizeObserver(adaptDisplay);
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
      if (moveHoldRef.current && !(mode === "ai" && s.currentPlayer === 1)) {
        moveDog(s, moveHoldRef.current.dir, dt);
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

  useEffect(() => {
    const canvas = canvasRef.current!;
    const toWorld = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      const sx = s ? s.width / Math.max(1, rect.width) : 1;
      const sy = s ? s.height / Math.max(1, rect.height) : 1;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    };
    const onDown = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s || s.phase !== "aiming" || s.winner === null && mode === "ai" && s.currentPlayer === 1) return;
      const { x, y } = toWorld(e);
      const dog = s.dogs[s.currentPlayer];
      dragRef.current = { startX: x, startY: y, dogX: dog.x, dogY: dog.y };
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      const drag = dragRef.current;
      if (!s || !drag) return;
      const { x: px, y: py } = toWorld(e);
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
      const { x: px, y: py } = toWorld(e);
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

  // Keyboard: arrows to walk, space to jump, enter to fire
  useEffect(() => {
    const isAi = () => mode === "ai" && stateRef.current?.currentPlayer === 1;
    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s || isAi()) return;
      if (e.repeat) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); moveHoldRef.current = { dir: -1 }; }
      else if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); moveHoldRef.current = { dir: 1 }; }
      else if (e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); angleHoldRef.current = { dir: -1, last: 0 }; }
      else if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); angleHoldRef.current = { dir: 1, last: 0 }; }
      else if (e.code === "Space") { e.preventDefault(); jumpDog(s); }
      else if (e.code === "Enter") { e.preventDefault(); fire(s); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "KeyA" || e.code === "KeyD") moveHoldRef.current = null;
      if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "KeyW" || e.code === "KeyS") angleHoldRef.current = null;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [mode]);



  const s = stateRef.current;
  const teamA = teamSkin(0);
  const teamB = teamSkin(1);
  const currentSkin = s?.currentPlayer === 0 ? teamA : teamB;
  const isAiTurn = mode === "ai" && s?.currentPlayer === 1;
  const hudVisible = s?.phase === "aiming" && s?.winner === null;

  const hudReserve = s?.hudReserve ?? 148;
  const hudCssPx = displaySize.h && s ? (displaySize.h * hudReserve) / s.height : 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-background touch-none select-none">
      <div ref={frameRef} className="relative flex-1 min-h-0 flex items-center justify-center">
        <div
          className="relative"
          style={displaySize.w > 0 ? { width: displaySize.w, height: displaySize.h } : undefined}
        >
          <canvas ref={canvasRef} className="block" />

          {s && (
            <div className="absolute top-0 left-0 right-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start p-2 sm:p-3 gap-2 pointer-events-none">
              <div className="flex flex-col gap-1.5 pointer-events-auto">
                <MiniPlayer skin={teamA} hp={s.dogs[0].hp} active={s.currentPlayer === 0} />
                <MiniPlayer skin={teamB} hp={s.dogs[1].hp} active={s.currentPlayer === 1} />
              </div>

              <div className="panel px-2 py-1.5 sm:px-3 pointer-events-auto text-center min-w-0 justify-self-center max-w-full">
                <div className="stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                  {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentSkin.name}`}
                </div>
                <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-tight">{s.message}</div>
                {s.phase === "aiming" && s.winner === null && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {isAiTurn ? "IA pensando..." : `${Math.max(0, Math.ceil(s.turnTimer))}s`}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 pointer-events-auto min-w-0 justify-self-end">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSettingsOpen(v => !v)}
                    className={`btn-hud text-[10px] px-2 py-1 ${settingsOpen ? "is-selected" : ""}`}
                    title="Cenário / IA"
                  >
                    ⚙ {scenario.label}
                  </button>
                  <button onClick={onExit} className="btn-hud text-[10px] px-2 py-1">Sair</button>
                </div>
                <WindGauge wind={s.wind} />
                {settingsOpen && (
                  <div className="panel p-2.5 mt-1 animate-fade-in w-56 space-y-2">
                    <div>
                      <div className="stencil text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Cenário</div>
                      <div className="flex flex-wrap gap-1">
                        {scenarios.map(sc => (
                          <button
                            key={sc.id}
                            onClick={() => setScenario(sc.id)}
                            className={`btn-hud text-[10px] px-2 py-0.5 ${scenario.id === sc.id ? "is-selected" : ""}`}
                          >{sc.label}</button>
                        ))}
                      </div>
                    </div>
                    {mode === "ai" && (
                      <div>
                        <div className="stencil text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Dificuldade</div>
                        <div className="flex gap-1">
                          {(["recruit","sergeant","general"] as const).map(d => (
                            <button
                              key={d}
                              onClick={() => setDifficulty(d)}
                              className={`btn-hud text-[10px] px-2 py-0.5 ${difficulty === d ? "is-selected" : ""}`}
                            >{d === "recruit" ? "Recruta" : d === "sergeant" ? "Sargento" : "General"}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-[9px] text-muted-foreground pt-1 border-t border-white/10">
                      Nova partida aplica cenário.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {s && s.phase !== "gameover" && hudCssPx > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 sm:px-3 sm:pb-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent flex flex-col justify-end gap-1.5 sm:gap-2"
              style={{ height: hudCssPx, opacity: hudVisible ? 1 : 0.85 }}
              aria-hidden={!hudVisible}
            >
              <ArsenalPopup
                open={arsenalOpen}
                onToggle={() => setArsenalOpen(v => { if (v) setHoveredWeapon(null); return !v; })}
                current={s.weapon}
                ammo={s.ammo}
                hovered={hoveredWeapon}
                setHovered={setHoveredWeapon}
                disabled={isAiTurn || s.phase !== "aiming"}
                onSelect={(id) => { setWeapon(s, id); setArsenalOpen(false); setHoveredWeapon(null); setTick(t => (t + 1) % 1000); }}
              />


              <div className="flex flex-row items-stretch gap-1.5 sm:gap-2 flex-wrap">
                <MobilityBar
                  dog={s.dogs[s.currentPlayer]}
                  disabled={!hudVisible || isAiTurn}
                  onHold={(dir) => { moveHoldRef.current = { dir }; }}
                  onRelease={() => { moveHoldRef.current = null; }}
                  onJump={() => jumpDog(s)}
                />

                <div className={`panel px-2 py-1.5 flex-1 min-w-[180px] flex items-center gap-2 ${hudVisible ? "" : "opacity-70"}`}>

                  <div className="flex items-center gap-1 shrink-0">
                    <HoldButton disabled={!hudVisible || isAiTurn} onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={1}>−</HoldButton>
                    <div className="flex flex-col items-center min-w-[38px]">
                      <span className="stencil text-[9px] text-muted-foreground leading-none">ÂNG</span>
                      <span className="stencil text-base leading-tight" style={{ color: "var(--accent)" }}>{Math.round(s.angle)}°</span>
                    </div>
                    <HoldButton disabled={!hudVisible || isAiTurn} onHold={dir => { angleHoldRef.current = { dir, last: 0 }; }} onRelease={() => (angleHoldRef.current = null)} dir={-1}>+</HoldButton>
                  </div>

                  <div className="hud-divider" />

                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <HoldButton disabled={!hudVisible || isAiTurn} onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={-1}>−</HoldButton>
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
                    <HoldButton disabled={!hudVisible || isAiTurn} onHold={dir => { powerHoldRef.current = { dir, last: 0 }; }} onRelease={() => (powerHoldRef.current = null)} dir={1}>+</HoldButton>
                  </div>
                </div>

                <button
                  disabled={isAiTurn || s.phase !== "aiming"}
                  onClick={() => fire(s)}
                  aria-label="Atirar"
                  className="fire-btn fire-btn-compact sm:!w-[4.5rem] sm:!h-[4.5rem] sm:!rounded-full sm:!text-[0.85rem] shrink-0"
                >
                  FOGO
                </button>
              </div>
            </div>
          )}

          {s?.phase === "gameover" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="panel p-6 sm:p-8 text-center max-w-sm">
                <div className="stencil text-xs text-muted-foreground uppercase tracking-[0.25em]">Combate encerrado</div>
                <h2 className="stencil text-3xl mt-2" style={{ color: s.winner === 0 ? teamA.teamColor : s.winner === 1 ? teamB.teamColor : undefined }}>
                  {s.winner === null ? "Empate" : `Vitória ${s.winner === 0 ? teamA.name : teamB.name}`}
                </h2>

                <div className="flex gap-2 mt-6 justify-center">
                  <button className="btn-hud btn-primary" onClick={() => { stateRef.current = null; location.reload(); }}>Revanche</button>
                  <button className="btn-hud" onClick={onExit}>Menu</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MiniPlayer({ skin, hp, active }: { skin: import("@/game/skins").TeamSkin; hp: number; active: boolean }) {
  const color = skin.teamColor;
  const name = skin.name;
  const portrait = PORTRAITS[name];
  return (
    <div
      className={`panel px-2 py-1 flex items-center gap-1.5 transition-all ${active ? "" : "opacity-60 scale-95"}`}
      style={active ? { boxShadow: `0 0 0 1.5px ${color}, 0 0 16px ${color}66`, borderColor: color } : undefined}
    >
      {portrait ? (
        <img src={portrait} alt="" className="w-7 h-7 rounded-md object-contain object-bottom shrink-0 bg-black/30" style={{ boxShadow: `0 0 6px ${color}` }} />
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      )}
      <div className="stencil text-[9px] uppercase tracking-widest">{name}</div>
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

function HoldButton({ children, onHold, onRelease, dir, disabled }: { children: React.ReactNode; onHold: (dir: 1 | -1) => void; onRelease: () => void; dir: 1 | -1; disabled?: boolean }) {
  const [held, setHeld] = useState(false);
  const down = (e: React.PointerEvent) => { if (disabled) return; e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); setHeld(true); onHold(dir); };
  const up = () => { setHeld(false); onRelease(); };
  return (
    <button
      aria-label={dir > 0 ? "Diminuir" : "Aumentar"}
      disabled={disabled}
      className={`btn-hud btn-hud-ghost !px-2 !py-1 !text-base leading-none min-w-[36px] min-h-[36px] ${held ? "hold-active" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
    >
      <span style={{ display: "inline-block", transform: held ? `translateX(${dir > 0 ? 2 : -2}px)` : "none", transition: "transform 120ms" }}>
        {children}
      </span>
    </button>
  );
}

function MobilityBar({ dog, disabled, onHold, onRelease, onJump }: {
  dog: import("@/game/types").Dog;
  disabled: boolean;
  onHold: (dir: 1 | -1) => void;
  onRelease: () => void;
  onJump: () => void;
}) {
  const pct = Math.max(0, Math.min(100, (dog.moveBudget / MOVE_BUDGET) * 100));
  const canMove = !disabled && dog.moveBudget > 0 && !dog.airborne;
  const canJump = !disabled && !dog.hasJumped && !dog.airborne;
  return (
    <div className={`panel px-2 py-1.5 flex flex-col gap-1 shrink-0 w-[112px] sm:w-[124px] ${disabled ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-1 justify-center">
        <MoveHoldButton disabled={!canMove} onHold={() => onHold(-1)} onRelease={onRelease} label="Andar esquerda">◀</MoveHoldButton>
        <button
          disabled={!canJump}
          onClick={onJump}
          aria-label="Pular"
          title={dog.hasJumped ? "Pulo já usado neste turno" : "Pular (Espaço)"}
          className="btn-hud !px-1.5 !py-1 !text-[10px] leading-none min-h-[34px] flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⇧
        </button>
        <MoveHoldButton disabled={!canMove} onHold={() => onHold(1)} onRelease={onRelease} label="Andar direita">▶</MoveHoldButton>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between items-baseline">
          <span className="stencil text-[8px] text-muted-foreground leading-none tracking-widest">MOV</span>
          <span className="stencil text-[9px] leading-none tabular-nums" style={{ color: "var(--accent)" }}>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--team-green), var(--accent))" }}
          />
        </div>
      </div>
    </div>
  );
}

function MoveHoldButton({ children, onHold, onRelease, disabled, label }: {
  children: React.ReactNode; onHold: () => void; onRelease: () => void; disabled?: boolean; label: string;
}) {
  const [held, setHeld] = useState(false);
  const down = (e: React.PointerEvent) => { if (disabled) return; e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); setHeld(true); onHold(); };
  const up = () => { setHeld(false); onRelease(); };
  return (
    <button
      aria-label={label}
      disabled={disabled}
      className={`btn-hud btn-hud-ghost !px-2 !py-1 !text-sm leading-none min-w-[36px] min-h-[36px] ${held ? "hold-active" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
    >
      {children}
    </button>
  );
}


function ArsenalPopup({ open, onToggle, current, ammo, hovered, setHovered, onSelect, disabled }: {
  open: boolean;
  onToggle: () => void;
  current: WeaponId;
  ammo: Record<WeaponId, number>;
  hovered: WeaponId | null;
  setHovered: (id: WeaponId | null) => void;
  onSelect: (id: WeaponId) => void;
  disabled: boolean;
}) {
  const currentW = WEAPONS[current];
  const currentAmmo = ammo[current];
  const focus = hovered ?? current;
  const focusW = WEAPONS[focus];

  return (
    <div className="relative">
      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-2 panel p-2 sm:p-3 animate-fade-in z-20 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="stencil text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Arsenal</div>
            <button className="btn-hud !px-2 !py-0.5 text-[10px]" onClick={onToggle} aria-label="Fechar arsenal">✕</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {WEAPON_ORDER.map(id => {
              const w = WEAPONS[id];
              const a = ammo[id];
              const empty = a === 0;
              const active = current === id;
              return (
                <button
                  key={id}
                  disabled={empty || disabled}
                  onClick={() => onSelect(id)}
                  onPointerEnter={() => setHovered(id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(id)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={active}
                  aria-label={`${w.name}${a === -1 ? "" : `, ${a} munições`}${empty ? ", sem munição" : ""}`}
                  className={`btn-hud btn-hud-weapon flex-col items-center py-1.5 ${active ? "is-selected" : ""} ${empty ? "is-empty opacity-40" : ""}`}
                  style={active ? { borderColor: w.color, boxShadow: `inset 0 0 0 1px ${w.color}55, 0 0 18px ${w.color}55` } : undefined}
                >
                  <span aria-hidden><WeaponIcon id={id} className="w-6 h-6" /></span>
                  <span className="stencil text-[9px] uppercase tracking-wider leading-tight mt-0.5 text-center">
                    {w.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] opacity-70 tabular-nums leading-none">
                    {a === -1 ? "∞" : `×${a}`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-2 text-[10px]">
            <div className="shrink-0" style={{ color: focusW.color }} aria-hidden>
              <WeaponIcon id={focus} className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="stencil text-xs" style={{ color: focusW.color }}>{focusW.name}</div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground mt-0.5">
                <span>Dano <b className="text-foreground">{focusW.damage}</b></span>
                <span>Raio <b className="text-foreground">{focusW.radius}</b></span>
                <span>Tipo <b className="text-foreground">{focusW.kind === "ballistic" ? "Balístico" : focusW.kind === "cluster" ? "Cluster" : "Aéreo"}</b></span>
                <span>Vento <b className="text-foreground">{focusW.affectedByWind ? "sim" : "não"}</b></span>
                <span>Munição <b className="text-foreground">{ammo[focus] === -1 ? "∞" : ammo[focus]}</b></span>
              </div>
              <div className="mt-1 text-foreground/80 leading-snug">{WEAPON_DESC[focus]}</div>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => (open ? onClose() : setHovered(null))}
        aria-expanded={open}
        aria-label={`Arsenal — ${currentW.name}`}
        disabled={disabled}
        className={`btn-hud w-full flex items-center gap-2 px-2 py-1.5 ${open ? "is-selected" : ""}`}
        style={{ borderColor: currentW.color, boxShadow: open ? `0 0 18px ${currentW.color}77` : undefined }}
      >
        <span aria-hidden><WeaponIcon id={current} className="w-6 h-6" /></span>
        <span className="flex flex-col items-start min-w-0 flex-1">
          <span className="stencil text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-none">Arsenal</span>
          <span className="stencil text-xs sm:text-sm truncate max-w-full" style={{ color: currentW.color }}>{currentW.name}</span>
        </span>
        <span className="text-[10px] tabular-nums shrink-0 opacity-80">
          {currentAmmo === -1 ? "∞" : `×${currentAmmo}`}
        </span>
        <span className="text-[10px] opacity-70 shrink-0" aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
    </div>
  );
}


export type { WeaponId };
