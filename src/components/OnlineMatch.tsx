import { useEffect, useMemo, useRef, useState } from "react";
import type { GameState, WeaponId } from "@/game/types";
import { createGame, destroyTerrain, endTurn, fire, jumpDog, moveDog, setWeapon, step } from "@/game/engine";
import { render, markTerrainDirty } from "@/game/render";
import { WEAPONS, WEAPON_ORDER } from "@/game/weapons";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { setActiveScenario, SCENARIOS, type ScenarioId } from "@/game/scenarios";
import { openMatchChannel, type MatchChannel, type NetEvent, type InputAction } from "@/net/matchChannel";
import type { MatchRow, MatchPlayerRow } from "@/lib/matchApi";
import { updateMatch, updateSelfPlayer, getStoredMatchDuration } from "@/lib/matchApi";
import { ComicIntro, shouldSkipIntro } from "@/components/ComicIntro";
import { WeaponIcon, WEAPON_SHORT } from "@/components/WarDogsGame";

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
  const angleHoldRef = useRef<{ dir: 1 | -1 } | null>(null);
  const powerHoldRef = useRef<{ dir: 1 | -1 } | null>(null);
  const moveHoldRef = useRef<{ dir: 1 | -1 } | null>(null);
  const lastAimSendRef = useRef(0);
  const lastMoveSendRef = useRef(0);
  const localEditUntilRef = useRef(0); // ignore host snapshot angle/power/weapon while user editing
  const [, setTick] = useState(0);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [showIntro, setShowIntro] = useState(() => !shouldSkipIntro());
  const [arsenalOpen, setArsenalOpen] = useState(false);

  const fighters = players.filter(p => p.slot < 2).sort((a, b) => a.slot - b.slot);
  const me = players.find(p => p.user_id === myUserId) ?? null;
  const mySlot = me?.slot ?? -1;
  const isHost = match.host_id === myUserId;
  const iAmFighter = mySlot === 0 || mySlot === 1;
  const chars: [CharacterId, CharacterId] = useMemo(() => [
    (fighters[0]?.char_id as CharacterId) ?? "ranger",
    (fighters[1]?.char_id as CharacterId) ?? "brutus",
  ], [fighters]);

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
        // Local optimistic hold-controls (only during my turn)
        const myTurnLocal = iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null;
        if (myTurnLocal) {
          if (angleHoldRef.current) {
            s.angle = clamp(s.angle + angleHoldRef.current.dir * 45 * dt, 5, 88);
            localEditUntilRef.current = now + 250;
            if (now - lastAimSendRef.current > 60) {
              lastAimSendRef.current = now;
              sendInput({ k: "angle", v: s.angle }, /*localAlreadyApplied*/ true);
            }
          }
          if (powerHoldRef.current) {
            s.power = clamp(s.power + powerHoldRef.current.dir * 55 * dt, 10, 100);
            localEditUntilRef.current = now + 250;
            if (now - lastAimSendRef.current > 60) {
              lastAimSendRef.current = now;
              sendInput({ k: "power", v: s.power }, true);
            }
          }
          if (moveHoldRef.current) {
            // apply locally for feedback
            moveDog(s, moveHoldRef.current.dir, dt);
            if (now - lastMoveSendRef.current > 50) {
              lastMoveSendRef.current = now;
              const elapsed = (now - (lastMoveSendRef.current - 50)) / 1000;
              sendInput({ k: "move", dir: moveHoldRef.current.dir, dt: elapsed }, true);
            }
          }
        }

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
  }, [isHost, iAmFighter, mySlot]);

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
      const skipAim = iAmFighter && (ev.state as Snapshot).currentPlayer === mySlot && performance.now() < localEditUntilRef.current;
      apply(s, ev.state as Snapshot, skipAim);
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

  const sendInput = (action: InputAction, localAlreadyApplied = false) => {
    const s = stateRef.current;
    if (!s) return;
    if (s.currentPlayer !== mySlot) return;
    // Optimistic local apply (unless already applied by hold loop)
    if (!localAlreadyApplied) {
      // For move/jump only apply locally if non-host to avoid double
      if (action.k === "angle" || action.k === "power" || action.k === "weapon") {
        applyAction(s, action);
        localEditUntilRef.current = performance.now() + 250;
      } else if (!isHost && (action.k === "move" || action.k === "jump")) {
        applyAction(s, action);
      } else if (isHost) {
        applyAction(s, action);
      }
    }
    if (!isHost) netRef.current?.send({ t: "input", slot: mySlot, action });
  };

  // Keyboard bindings
  useEffect(() => {
    if (!iAmFighter) return;
    const onDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.repeat) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); moveHoldRef.current = { dir: -1 }; }
      else if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); moveHoldRef.current = { dir: 1 }; }
      else if (e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); angleHoldRef.current = { dir: 1 }; }
      else if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); angleHoldRef.current = { dir: -1 }; }
      else if (e.code === "KeyQ") { e.preventDefault(); powerHoldRef.current = { dir: -1 }; }
      else if (e.code === "KeyE") { e.preventDefault(); powerHoldRef.current = { dir: 1 }; }
      else if (e.code === "Space") { e.preventDefault(); sendInput({ k: "jump" }); }
      else if (e.code === "Enter") { e.preventDefault(); sendInput({ k: "fire" }); }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "KeyA" || e.code === "KeyD") moveHoldRef.current = null;
      if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "KeyW" || e.code === "KeyS") angleHoldRef.current = null;
      if (e.code === "KeyQ" || e.code === "KeyE") powerHoldRef.current = null;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iAmFighter, mySlot]);

  const s = stateRef.current;
  const myTurn = !!(s && iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null);
  const currentName = s ? CHARACTERS[s.dogs[s.currentPlayer].charId].name : "";
  const currentWeapon = s ? WEAPONS[s.weapon] : null;

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

      {/* Bottom HUD — OUTSIDE canvas frame */}
      {s && iAmFighter && currentWeapon && (
        <div className="shrink-0 border-t border-white/10 bg-background/95 backdrop-blur px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="max-w-[720px] mx-auto flex items-stretch gap-1.5 sm:gap-2 relative">
            {/* Mobility */}
            <div className="panel px-1.5 py-1 flex items-center gap-1 shrink-0">
              <HoldButton disabled={!myTurn} onHold={() => (moveHoldRef.current = { dir: -1 })} onRelease={() => (moveHoldRef.current = null)}>◀</HoldButton>
              <button disabled={!myTurn} onClick={() => sendInput({ k: "jump" })}
                className="btn-hud text-[11px] px-2 py-1 disabled:opacity-40">⇧</button>
              <HoldButton disabled={!myTurn} onHold={() => (moveHoldRef.current = { dir: 1 })} onRelease={() => (moveHoldRef.current = null)}>▶</HoldButton>
            </div>

            {/* Arsenal */}
            <div className="relative">
              {arsenalOpen && (
                <div className="absolute left-0 bottom-full mb-2 panel p-2 z-30 shadow-2xl w-[280px] sm:w-[380px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="stencil text-[10px] uppercase tracking-widest text-muted-foreground">Arsenal</div>
                    <button className="btn-hud !px-2 !py-0.5 text-[10px]" onClick={() => setArsenalOpen(false)}>✕</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
                    {WEAPON_ORDER.map(id => {
                      const w = WEAPONS[id];
                      const a = s.ammo[id];
                      const empty = a === 0;
                      const active = s.weapon === id;
                      return (
                        <button key={id} disabled={empty || !myTurn}
                          onClick={() => { sendInput({ k: "weapon", v: id }); setArsenalOpen(false); }}
                          className={`btn-hud flex-col items-center !px-1 py-1 min-w-0 ${active ? "is-selected" : ""} ${empty ? "opacity-40" : ""}`}
                          style={active ? { borderColor: w.color, boxShadow: `0 0 12px ${w.color}55` } : undefined}>
                          <WeaponIcon id={id} className="w-5 h-5" />
                          <span className="stencil text-[9px] leading-tight truncate w-full text-center">{WEAPON_SHORT[id]}</span>
                          <span className="text-[9px] opacity-70 tabular-nums">{a === -1 ? "∞" : `×${a}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <button type="button" disabled={!myTurn} onClick={() => setArsenalOpen(v => !v)}
                className={`btn-hud h-full flex items-center gap-1.5 px-2 py-1 min-w-[110px] sm:min-w-[140px] ${arsenalOpen ? "is-selected" : ""}`}
                style={{ borderColor: currentWeapon.color }}>
                <WeaponIcon id={s.weapon} className="w-5 h-5" />
                <span className="flex flex-col items-start min-w-0 flex-1">
                  <span className="stencil text-[8px] uppercase tracking-widest text-muted-foreground leading-none">Arma</span>
                  <span className="stencil text-[11px] truncate" style={{ color: currentWeapon.color }}>{WEAPON_SHORT[s.weapon]}</span>
                </span>
                <span className="text-[10px] tabular-nums shrink-0 opacity-80">{s.ammo[s.weapon] === -1 ? "∞" : `×${s.ammo[s.weapon]}`}</span>
                <span className="text-[10px] opacity-70">{arsenalOpen ? "▾" : "▸"}</span>
              </button>
            </div>

            {/* Angle */}
            <div className="panel px-1.5 py-1 flex items-center gap-1 shrink-0">
              <HoldButton disabled={!myTurn} onHold={() => (angleHoldRef.current = { dir: -1 })} onRelease={() => (angleHoldRef.current = null)}>−</HoldButton>
              <div className="flex flex-col items-center min-w-[34px]">
                <span className="stencil text-[8px] text-muted-foreground leading-none">ÂNG</span>
                <span className="stencil text-sm leading-none" style={{ color: "var(--accent)" }}>{Math.round(s.angle)}°</span>
              </div>
              <HoldButton disabled={!myTurn} onHold={() => (angleHoldRef.current = { dir: 1 })} onRelease={() => (angleHoldRef.current = null)}>+</HoldButton>
            </div>

            {/* Power */}
            <div className="panel px-1.5 py-1 flex items-center gap-1 shrink-0">
              <HoldButton disabled={!myTurn} onHold={() => (powerHoldRef.current = { dir: -1 })} onRelease={() => (powerHoldRef.current = null)}>−</HoldButton>
              <div className="flex flex-col items-center min-w-[38px]">
                <span className="stencil text-[8px] text-muted-foreground leading-none">FORÇA</span>
                <span className="stencil text-sm leading-none" style={{ color: "var(--accent)" }}>{Math.round(s.power)}</span>
              </div>
              <HoldButton disabled={!myTurn} onHold={() => (powerHoldRef.current = { dir: 1 })} onRelease={() => (powerHoldRef.current = null)}>+</HoldButton>
            </div>

            {/* Fire */}
            <button disabled={!myTurn} onClick={() => sendInput({ k: "fire" })}
              className="fire-btn fire-btn-compact ml-auto shrink-0 disabled:opacity-40">FOGO</button>
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

// --- touch button -----------------------------------------------------

function HoldButton({ children, onHold, onRelease, disabled }: { children: React.ReactNode; onHold: () => void; onRelease: () => void; disabled?: boolean }) {
  const [held, setHeld] = useState(false);
  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setHeld(true);
    onHold();
  };
  const stop = () => { setHeld(false); onRelease(); };
  return (
    <button
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={`btn-hud !px-2 !py-1 !text-sm leading-none min-w-[34px] min-h-[34px] ${held ? "hold-active" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
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
  const now = performance.now();
  const localEditing = now < (window as unknown as { __wdEditUntil?: number }).__wdEditUntil!;
  // Note: localEditUntilRef is component-scoped; using module-safe fallback via closure not possible here.
  // We compare against a per-instance ref in the OnlineMatch scope by passing via s.__ hack? Simpler: skip angle/power/weapon when snap.currentPlayer equals a marker only if the applying instance is the one editing. We defer that check in caller.
  void localEditing;
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
