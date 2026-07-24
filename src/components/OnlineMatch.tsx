import { useEffect, useMemo, useRef, useState } from "react";
import type { GameState, WeaponId } from "@/game/types";
import { activateShield, createGame, destroyTerrain, endTurn, fire, jumpDog, moveDog, setWeapon, step, triggerCanineBarrage, SPECIAL_READY_THRESHOLD, SHIELD_READY_THRESHOLD, SHIELD_SOS_HP_RATIO, SHIELD_SOS_MIN_CHARGE } from "@/game/engine";
import { render, markTerrainDirty, setAimAssist } from "@/game/render";
import { WEAPONS } from "@/game/weapons";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { setActiveScenario, SCENARIOS, type ScenarioId } from "@/game/scenarios";
import { openMatchChannel, type MatchChannel, type NetEvent, type InputAction } from "@/net/matchChannel";
import type { MatchRow, MatchPlayerRow } from "@/lib/matchApi";
import { updateMatch, getStoredMatchDuration } from "@/lib/matchApi";
import { ComicIntro } from "@/components/ComicIntro";
import {
  ArsenalPopup,
  HoldButton,
  MatchCountdown,
  MiniPlayer,
  MobilityBar,
  WindGauge,
} from "@/components/WarDogsGame";

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
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const lastAimSendRef = useRef(0);
  const lastMoveSendRef = useRef(0);
  const localEditUntilRef = useRef(0);
  const lastBroadcastTurnRef = useRef<number>(-1);
  const pendingSnapshotRef = useRef<Snapshot | null>(null);
  const pendingTurnRef = useRef<{ slot: number; wind: number } | null>(null);
  const lastTurnBeatRef = useRef(0);




  const [, setTick] = useState(0);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [showIntro, setShowIntro] = useState(true);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [hoveredWeapon, setHoveredWeapon] = useState<WeaponId | null>(null);
  const [aimAssist, setAimAssistState] = useState<boolean>(() => {
    try { return localStorage.getItem("wardogs.aimAssist") !== "0"; } catch { return true; }
  });
  useEffect(() => {
    setAimAssist(aimAssist);
    try { localStorage.setItem("wardogs.aimAssist", aimAssist ? "1" : "0"); } catch {}
  }, [aimAssist]);

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

  // Init canvas + state. ONLINE uses a CANONICAL world size so host and guest
  // simulate identical coordinates regardless of device — screen only scales
  // the render, never the world.
  useEffect(() => {
    if (fighters.length < 2) return;
    const canvas = canvasRef.current;
    const parent = frameRef.current;
    if (!canvas || !parent) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const storedDur = getStoredMatchDuration(match.code);

    // Canonical world — the HOST wrote world_w/world_h when creating the match
    // (portrait dims for mobile host, landscape otherwise). Every client uses
    // those exact numbers, guaranteeing identical simulation coordinates.
    const WORLD_W = match.world_w || 1280;
    const WORLD_H = match.world_h || 720;
    // Reserve HUD/top space as a proportion of world height so portrait worlds
    // don't crush the playfield.
    const HUD_RESERVE = Math.round(WORLD_H * 0.20);
    const TOP_RESERVE = Math.round(WORLD_H * 0.15);

    const initIfNeeded = () => {
      if (stateRef.current) return;
      try {
        stateRef.current = createGame(WORLD_W, WORLD_H, "online", match.seed, HUD_RESERVE, chars, storedDur, false, TOP_RESERVE);
      } catch (err) {
        console.error("[OnlineMatch] createGame failed", err);
        throw err instanceof Error ? err : new Error("Falha ao iniciar simulação");
      }
      markTerrainDirty();
      // Wire host explosion broadcast IMMEDIATELY after state exists. Doing this
      // in a separate effect that depends on stateRef.current is unreliable
      // because refs don't trigger re-renders — the effect would run once with
      // stateRef.current === null and never re-run, so onExplosion would never
      // be attached and the guest would never see terrain destruction.
      if (isHost && stateRef.current) {
        stateRef.current.onExplosion = (x, y, r) => {
          seenExplosionsRef.current.add(fp(x, y, r));
          netRef.current?.send({ t: "explosion", x, y, r });
        };
      }
      // Drena eventos que chegaram antes do state existir (guest que abriu
      // canal antes do canvas medir).
      const pendSnap = pendingSnapshotRef.current;
      if (pendSnap && !isHost) {
        apply(stateRef.current!, pendSnap, false);
        pendingSnapshotRef.current = null;
      }
      const pendTurn = pendingTurnRef.current;
      if (pendTurn && !isHost && stateRef.current) {
        stateRef.current.currentPlayer = pendTurn.slot === 0 ? 0 : 1;
        stateRef.current.wind = pendTurn.wind;
        stateRef.current.phase = "aiming";
        pendingTurnRef.current = null;
      }
      // Host: se o canal já estava subscrito, reenvia snapshot inicial agora
      // que o state existe (o onSubscribed rodou antes do createGame).
      if (isHost && netRef.current && stateRef.current) {
        netRef.current.send({ t: "snapshot", state: serialize(stateRef.current) });
        netRef.current.send({ t: "turn", slot: stateRef.current.currentPlayer, wind: stateRef.current.wind });
        lastBroadcastTurnRef.current = stateRef.current.currentPlayer;
      }
    };



    const adapt = () => {
      initIfNeeded();
      const s = stateRef.current;
      if (!s) return;
      const r = parent.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      const scale = Math.min(r.width / s.width, r.height / s.height);
      const cssW = Math.max(1, Math.floor(s.width * scale));
      const cssH = Math.max(1, Math.floor(s.height * scale));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      const ctx = canvas.getContext("2d")!;
      const sx = (cssW * dpr) / s.width;
      const sy = (cssH * dpr) / s.height;
      ctx.setTransform(sx, 0, 0, sy, 0, 0);
      markTerrainDirty();
      setDisplaySize(prev => (prev.w === cssW && prev.h === cssH ? prev : { w: cssW, h: cssH }));
    };
    adapt();
    const ro = new ResizeObserver(adapt);
    ro.observe(parent);

    return () => { ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.seed, match.id, match.world_w, match.world_h, fighters.length]);



  // Pointer (mouse/touch) aim + tap-to-fire on the canvas — mirrors vs IA.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const toWorld = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      const sx = s ? s.width / Math.max(1, rect.width) : 1;
      const sy = s ? s.height / Math.max(1, rect.height) : 1;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    };
    const isMyTurn = () => {
      const s = stateRef.current;
      return !!(s && iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null);
    };
    const onDown = (e: PointerEvent) => {
      if (!isMyTurn()) return;
      const { x, y } = toWorld(e);
      dragRef.current = { startX: x, startY: y };
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      const drag = dragRef.current;
      if (!s || !drag || !isMyTurn()) return;
      const { x: px, y: py } = toWorld(e);
      const dog = s.dogs[s.currentPlayer];
      const dx = (px - drag.startX) * -dog.facing;
      const dy = drag.startY - py;
      const mag = Math.hypot(px - drag.startX, py - drag.startY);
      if (mag > 6) {
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        if (ang >= 0 && ang <= 90) {
          s.angle = clamp(ang, 5, 88);
        }
        const pw = Math.min(100, mag * 1.2);
        if (pw > 15) s.power = pw;
        localEditUntilRef.current = performance.now() + 250;
        const now = performance.now();
        if (now - lastAimSendRef.current > 60) {
          lastAimSendRef.current = now;
          sendInput({ k: "angle", v: s.angle }, true);
          sendInput({ k: "power", v: s.power }, true);
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || !isMyTurn()) return;
      const { x: px, y: py } = toWorld(e);
      const dist = Math.hypot(px - drag.startX, py - drag.startY);
      if (dist <= 20) {
        // tap = fire
        sendInput({ k: "fire" });
      } else {
        // drag release also fires (matches vs IA behaviour)
        sendInput({ k: "fire" });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iAmFighter, mySlot]);


  // Realtime channel — abre assim que match.id/myUserId existirem. NÃO depende
  // de stateRef.current (ref não é reativa; dependeria disso quebraria o guest
  // quando o layout inicializasse depois do primeiro render).
  useEffect(() => {
    const emitInitialHostState = () => {
      if (!isHost) return;
      const s = stateRef.current;
      if (!s) return;
      netRef.current?.send({ t: "snapshot", state: serialize(s) });
      netRef.current?.send({ t: "turn", slot: s.currentPlayer, wind: s.wind });
      lastBroadcastTurnRef.current = s.currentPlayer;
    };
    const ch = openMatchChannel(match.id, myUserId, (ev) => onNetEvent(ev), {
      onSubscribed: emitInitialHostState,
      onPeerJoin: () => emitInitialHostState(),
    });
    netRef.current = ch;
    return () => { ch.close(); netRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, myUserId, isHost]);


  // Host explosion broadcast is wired inside initIfNeeded() (right after
  // createGame) — a ref-dependent effect wouldn't re-run when stateRef gets
  // populated, so onExplosion would never be attached and the guest would
  // never receive terrain-destruction events.


  // Main loop
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s) {
        const myTurnLocal = iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null;
        if (myTurnLocal) {
          if (angleHoldRef.current) {
            s.angle = clamp(s.angle + angleHoldRef.current.dir * 45 * dt, 5, 88);
            localEditUntilRef.current = now + 250;
            if (now - lastAimSendRef.current > 60) {
              lastAimSendRef.current = now;
              sendInput({ k: "angle", v: s.angle }, true);
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
            moveDog(s, moveHoldRef.current.dir, dt);
            if (now - lastMoveSendRef.current > 50) {
              const elapsed = (now - lastMoveSendRef.current) / 1000;
              lastMoveSendRef.current = now;
              sendInput({ k: "move", dir: moveHoldRef.current.dir, dt: Math.min(0.2, elapsed) }, true);
            }
          }
        }

        if (isHost) {
          step(s, dt);
          if (now - lastSnapshotAtRef.current > 100) {
            lastSnapshotAtRef.current = now;
            netRef.current?.send({ t: "snapshot", state: serialize(s) });
          }
          // Reinforce turn signalling — broadcast on flip AND persist so late
          // joiners / snapshot drops still converge on the correct turn.
          if (s.phase === "aiming" && s.currentPlayer !== lastBroadcastTurnRef.current) {
            lastBroadcastTurnRef.current = s.currentPlayer;
            netRef.current?.send({ t: "turn", slot: s.currentPlayer, wind: s.wind });
            updateMatch(match.id, { current_slot: s.currentPlayer, turn_slot: s.currentPlayer }).catch(() => {});
          }
          // Heartbeat de turno: reenvia a cada ~1s enquanto está mirando —
          // se o guest entrou depois ou perdeu o broadcast, converge rápido.
          if (s.phase === "aiming" && now - lastTurnBeatRef.current > 1000) {
            lastTurnBeatRef.current = now;
            netRef.current?.send({ t: "turn", slot: s.currentPlayer, wind: s.wind });
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
    // State ainda não pronto (canvas mediu 0px etc.) — guarda último snapshot/turn
    // para reaplicar assim que createGame terminar.
    if (!s) {
      if (ev.t === "snapshot") pendingSnapshotRef.current = ev.state as Snapshot;
      else if (ev.t === "turn") pendingTurnRef.current = { slot: ev.slot, wind: ev.wind };
      return;
    }
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
    } else if (ev.t === "turn" && !isHost) {
      // Explicit turn signal — override snapshot lag so the guest never gets
      // stuck unable to act on their own turn.
      s.currentPlayer = (ev.slot === 0 ? 0 : 1);
      s.wind = ev.wind;
      s.phase = "aiming";
      localEditUntilRef.current = 0;
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
    else if (a.k === "barrage") triggerCanineBarrage(s);
    else if (a.k === "shield") activateShield(s);
  }


  const sendInput = (action: InputAction, localAlreadyApplied = false) => {
    const s = stateRef.current;
    if (!s) return;
    if (s.currentPlayer !== mySlot) return;
    if (!localAlreadyApplied) {
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

  // Keyboard bindings for desktop
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
  const hudVisible = !!(s && s.phase === "aiming" && s.winner === null);
  const hudReserve = s?.hudReserve ?? 148;
  const hudCssPxRaw = displaySize.h && s ? (displaySize.h * hudReserve) / s.height : 0;
  // HUD ocupa a largura visível toda; altura reservada responsiva sem depender de scale.
  const isCompactHud = displaySize.w > 0 && displaySize.w < 720;
  const hudMinPx = isCompactHud ? 76 : 92;
  const hudCssPx = Math.max(hudCssPxRaw, hudMinPx);

  useEffect(() => { if (!myTurn && arsenalOpen) setArsenalOpen(false); }, [myTurn, arsenalOpen]);

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
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background touch-none select-none">
      <div ref={frameRef} className="relative flex-1 min-h-0 flex items-center justify-center">
        <div className="relative" style={displaySize.w > 0 ? { width: displaySize.w, height: displaySize.h } : undefined}>
          <canvas ref={canvasRef} className="block" style={{ touchAction: "none" }} />

          {s && (
            <div className="absolute top-0 left-0 right-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start p-2 sm:p-3 gap-2 pointer-events-none">
              <div className="flex flex-col gap-1.5 pointer-events-auto">
                <MiniPlayer dog={s.dogs[0]} active={s.currentPlayer === 0} />
                <MiniPlayer dog={s.dogs[1]} active={s.currentPlayer === 1} />
              </div>

              <div className="flex flex-col items-center gap-1 justify-self-center min-w-0 max-w-full pointer-events-auto">
                <MatchCountdown matchDuration={s.matchDuration} matchTimer={s.matchTimer} />
                <div className="panel px-2 py-1.5 sm:px-3 text-center min-w-0 max-w-full">
                  <div className="stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentName}`}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-tight">
                    {iAmFighter && s.currentPlayer === mySlot ? `Sua vez — ${currentName}` : `Vez de ${currentName}`}
                  </div>
                  {s.phase === "aiming" && s.winner === null && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {iAmFighter && s.currentPlayer !== mySlot ? "Aguardando oponente…" : `Turno ${Math.max(0, Math.ceil(s.turnTimer))}s`}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 pointer-events-auto min-w-0 justify-self-end">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAimAssistState(v => !v)}
                    className={`btn-hud text-[10px] px-2 py-1 ${aimAssist ? "is-selected" : "opacity-70"}`}
                    aria-pressed={aimAssist}
                    title="Mira assistida"
                  >
                    🎯 {aimAssist ? "Mira ON" : "Mira OFF"}
                  </button>
                  <button onClick={onExit} className="btn-hud text-[10px] px-2 py-1">Sair</button>
                </div>
                <WindGauge wind={s.wind} />
              </div>
            </div>
          )}

          {s && s.phase !== "gameover" && hudCssPx > 0 && iAmFighter && currentWeapon && (
            <div
              className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 sm:px-3 sm:pb-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-end"
              style={{ height: hudCssPx, opacity: hudVisible ? 1 : 0.85 }}
              aria-hidden={!hudVisible}
            >
              <div
                className="flex flex-row items-stretch gap-1 sm:gap-2 flex-nowrap"
                style={{
                  transform: `scale(${hudScale})`,
                  transformOrigin: "bottom center",
                  width: `${100 / hudScale}%`,
                }}
              >
                <div className="shrink-0 [&>button]:!px-1.5 [&>button]:!text-[10px] sm:[&>button]:!px-3 sm:[&>button]:!text-xs">
                <ArsenalPopup
                  open={arsenalOpen}
                  onToggle={() => setArsenalOpen(v => { if (v) setHoveredWeapon(null); return !v; })}
                  current={s.weapon}
                  ammo={s.ammo}
                  hovered={hoveredWeapon}
                  setHovered={setHoveredWeapon}
                  disabled={!myTurn}
                  onSelect={(id) => { sendInput({ k: "weapon", v: id }); setArsenalOpen(false); setHoveredWeapon(null); }}
                />
                </div>


                <MobilityBar
                  dog={s.dogs[s.currentPlayer]}
                  disabled={!myTurn}
                  onHold={(dir) => { moveHoldRef.current = { dir }; }}
                  onRelease={() => { moveHoldRef.current = null; }}
                  onJump={() => sendInput({ k: "jump" })}
                />

                <div className={`panel px-2 py-1.5 flex-1 min-w-[150px] sm:min-w-[200px] flex items-center gap-2 ${hudVisible ? "" : "opacity-70"}`}>
                  <div className="flex items-center gap-1 shrink-0">
                    <HoldButton disabled={!myTurn} onHold={dir => { angleHoldRef.current = { dir }; }} onRelease={() => (angleHoldRef.current = null)} dir={-1}>−</HoldButton>
                    <div className="flex flex-col items-center min-w-[38px]">
                      <span className="stencil text-[9px] text-muted-foreground leading-none">ÂNG</span>
                      <span className="stencil text-base leading-tight" style={{ color: "var(--accent)" }}>{Math.round(s.angle)}°</span>
                    </div>
                    <HoldButton disabled={!myTurn} onHold={dir => { angleHoldRef.current = { dir }; }} onRelease={() => (angleHoldRef.current = null)} dir={1}>+</HoldButton>
                  </div>

                  <div className="hud-divider" />

                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <HoldButton disabled={!myTurn} onHold={dir => { powerHoldRef.current = { dir }; }} onRelease={() => (powerHoldRef.current = null)} dir={-1}>−</HoldButton>
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
                    <HoldButton disabled={!myTurn} onHold={dir => { powerHoldRef.current = { dir }; }} onRelease={() => (powerHoldRef.current = null)} dir={1}>+</HoldButton>
                  </div>
                </div>

                {(() => {
                  const dog = s.dogs[s.currentPlayer];
                  const pct = Math.max(0, Math.min(100, dog.specialCharge));
                  const ready = pct >= SPECIAL_READY_THRESHOLD;
                  return (
                    <div className="panel px-1.5 py-1 sm:px-2 sm:py-1.5 flex flex-col items-center gap-1 shrink-0 w-[60px] sm:w-[74px] md:w-[86px]">
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground/80 w-full text-center truncate">Bombardeio</span>
                      <button
                        disabled={!myTurn || !ready || s.phase !== "aiming"}
                        onClick={() => sendInput({ k: "barrage" })}
                        className={`relative w-full py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] stencil tracking-widest border transition ${
                          ready
                            ? "border-amber-300 text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 animate-pulse shadow-[0_0_10px_rgba(255,200,60,0.6)]"
                            : "border-white/15 text-muted-foreground/80 bg-white/5"
                        } disabled:cursor-not-allowed`}
                        aria-label="Bombardeio Canino"
                        title={ready ? "Bombardeio Canino pronto!" : "Acerte tiros para carregar"}
                      >
                        {ready ? "💣 GO" : `💣 ${Math.floor(pct)}%`}
                      </button>
                      <div className="w-full h-1 sm:h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full transition-[width] duration-150"
                          style={{
                            width: `${pct}%`,
                            background: ready ? "linear-gradient(90deg,#ffdc4a,#ff8a1a)" : "linear-gradient(90deg,#7a4a1a,#ffb84a)",
                            boxShadow: ready ? "0 0 8px rgba(255,200,60,0.7)" : undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const dog = s.dogs[s.currentPlayer];
                  const pct = Math.max(0, Math.min(100, dog.shieldCharge));
                  const hpRatio = dog.hp / dog.maxHp;
                  const sosOk = hpRatio <= SHIELD_SOS_HP_RATIO && pct >= SHIELD_SOS_MIN_CHARGE;
                  const fullOk = pct >= SHIELD_READY_THRESHOLD;
                  const ready = (fullOk || sosOk) && !dog.shieldActive;
                  const active = dog.shieldActive;
                  return (
                    <div className="panel px-1.5 py-1 sm:px-2 sm:py-1.5 flex flex-col items-center gap-1 shrink-0 w-[60px] sm:w-[74px] md:w-[86px]">
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground/80 w-full text-center truncate">Escudo</span>
                      <button
                        disabled={!myTurn || active || !ready || s.phase !== "aiming"}
                        onClick={() => sendInput({ k: "shield" })}
                        className={`relative w-full py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] stencil tracking-widest border transition ${
                          active
                            ? "border-cyan-200 text-cyan-100 bg-cyan-500/25 shadow-[0_0_10px_rgba(120,220,255,0.7)]"
                            : ready
                            ? "border-cyan-300 text-cyan-100 bg-cyan-500/20 hover:bg-cyan-500/30 animate-pulse shadow-[0_0_10px_rgba(120,220,255,0.55)]"
                            : "border-white/15 text-muted-foreground/80 bg-white/5"
                        } disabled:cursor-not-allowed`}
                        aria-label="Campo de Força"
                        title={active ? "Escudo ativo" : ready ? (sosOk && !fullOk ? "SOS disponível (HP baixo)" : "Escudo pronto") : "Recebendo dano carrega a barra"}
                      >
                        {active ? "🛡️ ON" : ready ? "🛡️ GO" : `🛡️ ${Math.floor(pct)}%`}
                      </button>
                      <div className="w-full h-1 sm:h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5 relative">
                        <div
                          className="h-full rounded-full transition-[width] duration-150"
                          style={{
                            width: `${pct}%`,
                            background: ready ? "linear-gradient(90deg,#7ee8ff,#38a8ff)" : "linear-gradient(90deg,#1a4a6a,#7ee8ff)",
                            boxShadow: ready ? "0 0 8px rgba(120,220,255,0.7)" : undefined,
                          }}
                        />
                        <div className="absolute top-0 h-full w-px bg-white/60" style={{ left: `${SHIELD_READY_THRESHOLD}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <button
                  disabled={!myTurn}
                  onClick={() => sendInput({ k: "fire" })}
                  aria-label="Atirar"
                  className="fire-btn !w-11 !h-11 !min-h-[44px] !text-[10px] !rounded-full sm:!w-[4.5rem] sm:!h-[4.5rem] sm:!text-[0.85rem] shrink-0"
                >
                  FOGO
                </button>


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
    ammo: s.ammo, turnTimer: s.turnTimer, matchTimer: s.matchTimer,
  };
}

type Snapshot = ReturnType<typeof serialize>;

function apply(s: GameState, snap: Snapshot, skipAim = false) {
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
  if (!skipAim) {
    s.angle = snap.angle;
    s.power = snap.power;
    s.weapon = snap.weapon as WeaponId;
  }
  s.phase = snap.phase as GameState["phase"];
  s.message = snap.message;
  s.winner = snap.winner as GameState["winner"];
  s.ammo = snap.ammo as GameState["ammo"];
  s.turnTimer = snap.turnTimer;
  s.matchTimer = snap.matchTimer;
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

void endTurn;
