import { useEffect, useRef, useState } from "react";
import type { GameState, WeaponId } from "@/game/types";
import { createGame, destroyTerrain, endTurn, fire, jumpDog, moveDog, setWeapon, step } from "@/game/engine";
import { render, markTerrainDirty } from "@/game/render";
import { WEAPON_ORDER } from "@/game/weapons";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { setActiveScenario, SCENARIOS, type ScenarioId } from "@/game/scenarios";
import { openMatchChannel, type MatchChannel, type NetEvent, type InputAction } from "@/net/matchChannel";
import type { MatchRow, MatchPlayerRow } from "@/lib/matchApi";
import { updateMatch, updateSelfPlayer, getStoredMatchDuration } from "@/lib/matchApi";
import { ComicIntro, shouldSkipIntro } from "@/components/ComicIntro";

interface Props {
  match: MatchRow;
  players: MatchPlayerRow[];
  myUserId: string;
  onExit: () => void;
}

export function OnlineMatch({ match, players, myUserId, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const netRef = useRef<MatchChannel | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSnapshotAtRef = useRef(0);
  const seenExplosionsRef = useRef<Set<string>>(new Set());
  const [, setTick] = useState(0);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [showIntro, setShowIntro] = useState(() => !shouldSkipIntro());

  const fighters = players.filter(p => p.slot < 2).sort((a, b) => a.slot - b.slot);
  const me = players.find(p => p.user_id === myUserId) ?? null;
  const mySlot = me?.slot ?? -1;
  const isHost = match.host_id === myUserId;
  const iAmFighter = mySlot === 0 || mySlot === 1;
  const chars: [CharacterId, CharacterId] = [
    (fighters[0]?.char_id as CharacterId) ?? "ranger",
    (fighters[1]?.char_id as CharacterId) ?? "brutus",
  ];

  useEffect(() => {
    setActiveScenario(match.scenario as ScenarioId);
  }, [match.scenario]);

  // Init canvas + state
  useEffect(() => {
    if (fighters.length < 2) return;
    const canvas = canvasRef.current;
    const parent = frameRef.current;
    if (!canvas || !parent) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const rect = parent.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(240, Math.floor(rect.height));
    // HUD lives OUTSIDE the canvas frame now, so no bottom reserve is needed.
    const hudReserve = 8;
    const topReserve = window.matchMedia("(min-width: 640px)").matches && h >= 480 ? 88 : 104;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const storedDur = getStoredMatchDuration(match.code);

    try {
      stateRef.current = createGame(w, h, "online", match.seed, hudReserve, chars, storedDur, false, topReserve);
    } catch (err) {
      console.error("[OnlineMatch] createGame failed", err);
      throw err instanceof Error ? err : new Error("Falha ao iniciar simulação");
    }

    markTerrainDirty();

    const adapt = () => {
      const s = stateRef.current;
      if (!s) return;
      const r = parent.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      const scale = Math.min(r.width / s.width, r.height / s.height);
      const cssW = Math.floor(s.width * scale);
      const cssH = Math.floor(s.height * scale);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      setDisplaySize(prev => (prev.w === cssW && prev.h === cssH ? prev : { w: cssW, h: cssH }));
    };
    adapt();
    const ro = new ResizeObserver(adapt);
    ro.observe(parent);

    return () => { ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.seed, match.id, fighters.length]);

  // Realtime channel
  useEffect(() => {
    if (!stateRef.current) return;
    const ch = openMatchChannel(match.id, myUserId, (ev) => onNetEvent(ev));
    netRef.current = ch;
    return () => { ch.close(); netRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, myUserId, stateRef.current]);

  // Host: broadcast explosions
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    if (isHost) {
      s.onExplosion = (x, y, r) => {
        seenExplosionsRef.current.add(fp(x, y, r));
        netRef.current?.send({ t: "explosion", x, y, r });
      };
    } else {
      s.onExplosion = undefined;
    }
    return () => { if (s) s.onExplosion = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, stateRef.current]);

  // Main loop
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s) {
        if (isHost) {
          step(s, dt);
          if (now - lastSnapshotAtRef.current > 100) {
            lastSnapshotAtRef.current = now;
            netRef.current?.send({ t: "snapshot", state: serialize(s) });
          }
        } else {
          advanceCosmetic(s, dt);
        }
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) render(ctx, s);
        setTick(t => (t + 1) % 1000);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  useEffect(() => {
    if (!isHost) return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s && s.phase === "gameover" && match.status !== "ended") {
        updateMatch(match.id, { status: "ended", ended_at: new Date().toISOString() }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [isHost, match.id, match.status]);

  function onNetEvent(ev: NetEvent) {
    const s = stateRef.current;
    if (!s) return;
    if (ev.t === "snapshot" && !isHost) {
      apply(s, ev.state as Snapshot);
    } else if (ev.t === "explosion" && !isHost) {
      const key = fp(ev.x, ev.y, ev.r);
      if (!seenExplosionsRef.current.has(key)) {
        seenExplosionsRef.current.add(key);
        destroyTerrain(s, ev.x, ev.y, ev.r);
        s.scorchMarks.push({ x: ev.x, y: ev.y, radius: ev.r * 1.05, life: 6, maxLife: 6 });
      }
    } else if (ev.t === "input" && isHost) {
      if (ev.slot !== s.currentPlayer) return;
      applyAction(s, ev.action);
    }
  }

  function applyAction(s: GameState, a: InputAction) {
    if (a.k === "angle") s.angle = clamp(a.v, 5, 88);
    else if (a.k === "power") s.power = clamp(a.v, 10, 100);
    else if (a.k === "weapon") setWeapon(s, a.v as WeaponId);
    else if (a.k === "move") moveDog(s, a.dir, a.dt);
    else if (a.k === "jump") jumpDog(s);
    else if (a.k === "fire") fire(s);
  }

  const sendInput = (action: InputAction) => {
    const s = stateRef.current;
    if (!s) return;
    if (s.currentPlayer !== mySlot) return;
    if (isHost) {
      applyAction(s, action);
    } else {
      netRef.current?.send({ t: "input", slot: mySlot, action });
    }
  };

  // Keyboard bindings + continuous move
  useEffect(() => {
    if (!iAmFighter) return;
    const moveTimer: { dir: 1 | -1 | 0 } = { dir: 0 };
    let raf: number | null = null;
    const tick = (last: number) => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      if (moveTimer.dir !== 0) sendInput({ k: "move", dir: moveTimer.dir as 1 | -1, dt });
      raf = requestAnimationFrame(() => tick(now));
    };
    raf = requestAnimationFrame(() => tick(performance.now()));

    const onDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.repeat) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); moveTimer.dir = -1; }
      else if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); moveTimer.dir = 1; }
      else if (e.code === "ArrowUp") { e.preventDefault(); sendInput({ k: "angle", v: (stateRef.current?.angle ?? 45) + 2 }); }
      else if (e.code === "ArrowDown") { e.preventDefault(); sendInput({ k: "angle", v: (stateRef.current?.angle ?? 45) - 2 }); }
      else if (e.code === "KeyW") { e.preventDefault(); sendInput({ k: "power", v: (stateRef.current?.power ?? 60) + 3 }); }
      else if (e.code === "KeyS") { e.preventDefault(); sendInput({ k: "power", v: (stateRef.current?.power ?? 60) - 3 }); }
      else if (e.code === "Space") { e.preventDefault(); sendInput({ k: "jump" }); }
      else if (e.code === "Enter") { e.preventDefault(); sendInput({ k: "fire" }); }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "KeyA" || e.code === "KeyD") moveTimer.dir = 0;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iAmFighter, mySlot]);

  const s = stateRef.current;
  const myTurn = !!(s && iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null);
  const currentName = s ? CHARACTERS[s.dogs[s.currentPlayer].charId].name : "";

  if (fighters.length < 2) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background flex-col gap-3 p-6 text-center">
        <div className="stencil text-warn">Precisa de 2 combatentes nos slots 1 e 2 para começar.</div>
        <button onClick={onExit} className="btn-hud">Voltar</button>
      </div>
    );
  }

  const sc = SCENARIOS.find(x => x.id === (match.scenario as ScenarioId));

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background select-none">
      {/* Game frame — canvas + top overlay only */}
      <div ref={frameRef} className="relative flex-1 min-h-0 flex items-center justify-center touch-none">
        <div className="relative" style={displaySize.w > 0 ? { width: displaySize.w, height: displaySize.h } : undefined}>
          <canvas ref={canvasRef} className="block" />

          {s && (
            <div className="absolute top-0 left-0 right-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start p-2 sm:p-3 gap-2 pointer-events-none">
              <div className="flex flex-col gap-1.5 pointer-events-auto">
                {fighters.map((p, i) => (
                  <div key={p.id} className={`panel px-2 py-1 text-[10px] ${s.currentPlayer === i ? "border-[color:var(--accent)]" : ""}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.currentPlayer === i ? "bg-[color:var(--accent)]" : "bg-muted"}`} />
                      <span className="stencil truncate max-w-[80px]">{p.nickname}</span>
                      <span className="text-muted-foreground ml-1">HP {Math.max(0, s.dogs[i].hp)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel px-2 py-1.5 sm:px-3 pointer-events-auto text-center min-w-0 justify-self-center">
                <div className="stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                  {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentName}`}
                </div>
                <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-tight">{s.message}</div>
                {iAmFighter && s.currentPlayer !== mySlot && s.phase === "aiming" && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">Aguardando oponente...</div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
                <button onClick={onExit} className="btn-hud text-[10px] px-2 py-1">Sair</button>
                <div className="panel px-2 py-1 text-[10px]">
                  Vento {(s.wind * 10).toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {s?.phase === "gameover" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
              <div className="panel p-5 text-center space-y-3">
                <div className="stencil text-lg uppercase">{s.message}</div>
                <button onClick={onExit} className="btn-hud btn-primary">Voltar à base</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom HUD — OUTSIDE canvas frame; never overlaps terrain */}
      {s && iAmFighter && (
        <div className="shrink-0 border-t border-white/10 bg-background/95 backdrop-blur px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="max-w-[860px] mx-auto flex flex-col gap-1.5">
            {/* Row 1: stats + aim controls */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              <span className="panel px-2 py-1 tabular-nums">Âng {Math.round(s.angle)}°</span>
              <HoldButton disabled={!myTurn} onFire={() => sendInput({ k: "angle", v: (stateRef.current?.angle ?? 45) + 2 })}>▲</HoldButton>
              <HoldButton disabled={!myTurn} onFire={() => sendInput({ k: "angle", v: (stateRef.current?.angle ?? 45) - 2 })}>▼</HoldButton>
              <span className="panel px-2 py-1 tabular-nums">Força {Math.round(s.power)}</span>
              <HoldButton disabled={!myTurn} onFire={() => sendInput({ k: "power", v: (stateRef.current?.power ?? 60) + 3 })}>＋</HoldButton>
              <HoldButton disabled={!myTurn} onFire={() => sendInput({ k: "power", v: (stateRef.current?.power ?? 60) - 3 })}>－</HoldButton>
            </div>

            {/* Row 2: weapons */}
            <div className="flex flex-wrap gap-1 justify-center">
              {WEAPON_ORDER.map(w => (
                <button key={w} disabled={!myTurn || s.ammo[w] === 0}
                  onClick={() => sendInput({ k: "weapon", v: w })}
                  className={`btn-hud text-[10px] px-1.5 py-0.5 ${s.weapon === w ? "is-selected" : ""} ${s.ammo[w] === 0 ? "opacity-40" : ""}`}>
                  {w}{s.ammo[w] > 0 ? ` (${s.ammo[w]})` : " ✕"}
                </button>
              ))}
            </div>

            {/* Row 3: move + jump + fire */}
            <div className="flex items-center justify-center gap-1.5">
              <MoveHoldButton disabled={!myTurn} onMove={(dt) => sendInput({ k: "move", dir: -1, dt })}>◀</MoveHoldButton>
              <MoveHoldButton disabled={!myTurn} onMove={(dt) => sendInput({ k: "move", dir: 1, dt })}>▶</MoveHoldButton>
              <button disabled={!myTurn} onClick={() => sendInput({ k: "jump" })}
                className="btn-hud text-[11px] px-3 py-1.5 disabled:opacity-40">Pular</button>
              <button disabled={!myTurn} onClick={() => sendInput({ k: "fire" })}
                className="btn-hud btn-primary text-[12px] px-5 py-1.5 disabled:opacity-40">ATIRAR</button>
            </div>
          </div>
        </div>
      )}

      {showIntro && (
        <div className="fixed inset-0 z-50">
          <ComicIntro
            chars={chars}
            scenarioLabel={sc?.label}
            bgImage={sc?.bgImage}
            onDone={() => setShowIntro(false)}
          />
        </div>
      )}
    </div>
  );
}

// --- touch buttons ---------------------------------------------------

function HoldButton({ children, onFire, disabled }: { children: React.ReactNode; onFire: () => void; disabled?: boolean }) {
  const timerRef = useRef<number | null>(null);
  const stop = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };
  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onFire();
    stop();
    timerRef.current = window.setInterval(onFire, 90);
  };
  useEffect(() => () => stop(), []);
  return (
    <button
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="btn-hud text-[12px] leading-none px-2.5 py-1.5 min-w-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function MoveHoldButton({ children, onMove, disabled }: { children: React.ReactNode; onMove: (dt: number) => void; disabled?: boolean }) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const stop = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };
  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    lastRef.current = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      onMove(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };
  useEffect(() => () => stop(), []);
  return (
    <button
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="btn-hud text-[14px] leading-none px-3 py-1.5 min-w-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

// --- helpers ---------------------------------------------------------

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function fp(x: number, y: number, r: number) { return `${Math.round(x)},${Math.round(y)},${Math.round(r)}`; }

function serialize(s: GameState) {
  return {
    dogs: s.dogs.map(d => ({
      x: d.x, y: d.y, vy: d.vy, hp: d.hp, facing: d.facing, airborne: !!d.airborne,
      moveBudget: d.moveBudget, hasJumped: d.hasJumped, aliveTicks: d.aliveTicks,
    })),
    projectiles: s.projectiles.map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, weapon: p.weapon, age: p.age, ownerTeam: p.ownerTeam, isSub: !!p.isSub, trail: p.trail.slice(-12) })),
    currentPlayer: s.currentPlayer, wind: s.wind, angle: s.angle, power: s.power,
    weapon: s.weapon, phase: s.phase, message: s.message, winner: s.winner,
    ammo: s.ammo, turnTimer: s.turnTimer,
  };
}

type Snapshot = ReturnType<typeof serialize>;

function apply(s: GameState, snap: Snapshot) {
  for (let i = 0; i < s.dogs.length; i++) {
    const d = s.dogs[i]; const sd = snap.dogs[i];
    if (!sd) continue;
    d.x = sd.x; d.y = sd.y; d.vy = sd.vy; d.hp = sd.hp; d.facing = sd.facing;
    d.airborne = sd.airborne; d.moveBudget = sd.moveBudget; d.hasJumped = sd.hasJumped; d.aliveTicks = sd.aliveTicks;
  }
  s.projectiles = snap.projectiles.map(p => ({
    x: p.x, y: p.y, vx: p.vx, vy: p.vy, weapon: p.weapon as WeaponId, age: p.age, ownerTeam: p.ownerTeam as 0 | 1, trail: p.trail as Array<[number, number]>, isSub: p.isSub,
  }));
  s.currentPlayer = snap.currentPlayer as 0 | 1;
  s.wind = snap.wind;
  s.angle = snap.angle;
  s.power = snap.power;
  s.weapon = snap.weapon as WeaponId;
  s.phase = snap.phase as GameState["phase"];
  s.message = snap.message;
  s.winner = snap.winner as GameState["winner"];
  s.ammo = snap.ammo as GameState["ammo"];
  s.turnTimer = snap.turnTimer;
}

function advanceCosmetic(s: GameState, dt: number) {
  for (let i = s.explosions.length - 1; i >= 0; i--) {
    const e = s.explosions[i];
    e.age += dt;
    for (const pt of e.particles) {
      pt.vy += 220 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
    }
    e.particles = e.particles.filter(pt => pt.life > 0);
    if (e.age > e.maxAge + 1.2) s.explosions.splice(i, 1);
  }
  for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
    const f = s.floatingTexts[i]; f.vy += 90 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt;
    if (f.life <= 0) s.floatingTexts.splice(i, 1);
  }
  for (let i = s.scorchMarks.length - 1; i >= 0; i--) {
    s.scorchMarks[i].life -= dt;
    if (s.scorchMarks[i].life <= 0) s.scorchMarks.splice(i, 1);
  }
  if (s.airstrikeMarker) {
    s.airstrikeMarker.life -= dt;
    if (s.airstrikeMarker.life <= 0) s.airstrikeMarker = undefined;
  }
}

void endTurn; void updateSelfPlayer;
