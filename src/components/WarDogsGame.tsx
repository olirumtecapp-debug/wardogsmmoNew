import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, WeaponId } from "@/game/types";
import { activateRage, createGame, fire, jumpDog, moveDog, RAGE_READY_THRESHOLD, setWeapon, step, triggerCanineBarrage, SPECIAL_READY_THRESHOLD, setTeleportTarget, clearTeleportTarget, confirmTeleport, TELEPORT_CONFIRM_TOL, TELEPORT_MAX_RANGE, TELEPORT_HP_COST } from "@/game/engine";
import { render, markTerrainDirty, setAimAssist } from "@/game/render";
import { aiTakeTurn } from "@/game/ai";
import { WEAPONS, WEAPON_ORDER } from "@/game/weapons";
import { CHARACTERS, characterSkin, type CharacterId } from "@/game/characters";



const WEAPON_DESC: Record<WeaponId, string> = {
  bazooka: "Foguete clássico. Voa em arco e sofre o vento — a arma segura de todo turno.",
  grenade: "Granada com pavio de 2.5s. Quica no terreno antes de explodir com raio generoso.",
  rpg: "Foguete rápido de baixa gravidade. Ignora o vento — mira quase reta em alvos distantes.",
  bow: "Flecha leve e precisa. Dano menor, mas trajetória mais tensa e certeira em curta distância.",
  artillery: "Obus pesado com o maior raio de explosão. Cai forte, ideal pra destruir terreno.",
  frag: "Frag rápida com pavio curto (1s). Boa pra acertos próximos que não dão tempo de fugir.",
  cluster: "Munição cluster: no impacto libera 4 sub-bombas que espalham dano em área.",
  airstrike: "Chame um bombardeio aéreo. Toque no céu pra marcar o alvo — 3 bombas em linha.",
  teleport: `Toque no mapa pra marcar o destino, depois toque na marca (ou em CONFIRMAR) pra se teletransportar. Alcance ${TELEPORT_MAX_RANGE}px, custa ${TELEPORT_HP_COST} HP e encerra o turno.`,
};

// Short labels for the arsenal grid cells (avoid overflowing narrow columns on mobile).
const WEAPON_SHORT: Record<WeaponId, string> = {
  bazooka: "Bazuca",
  grenade: "Granada",
  rpg: "RPG",
  bow: "Arco",
  artillery: "Artilh.",
  frag: "Frag",
  cluster: "Cluster",
  airstrike: "Aéreo",
  teleport: "Teleport",
};


interface MissionConfig {
  enemyHpBonus?: number;
  allowedWeapons?: WeaponId[];
  windMultiplier?: number;
  disableAimAssist?: boolean;
  enemyRageCharged?: boolean;
  hidePower?: boolean;
  turnTimeSeconds?: number;
  chaosWind?: boolean;
}

interface Props {
  mode: GameMode;
  onExit: () => void;
  chars?: [CharacterId, CharacterId];
  missionConfig?: MissionConfig;
  onGameOver?: (result: { winner: 0 | 1 | null; playerHpPct: number }) => void;
  matchDuration?: number; // segundos; 0 = sem limite
  rageEnabled?: boolean;  // Modo Fúria (Campanha)
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


export function WarDogsGame({ mode, onExit, chars = ["ranger", "brutus"], missionConfig, onGameOver, matchDuration, rageEnabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const aiTriggeredRef = useRef(false);
  const powerHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const angleHoldRef = useRef<{ dir: 1 | -1; last: number } | null>(null);
  const moveHoldRef = useRef<{ dir: 1 | -1 } | null>(null);
  const gameOverFiredRef = useRef(false);
  const onGameOverRef = useRef(onGameOver);
  const missionConfigRef = useRef(missionConfig);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
  useEffect(() => { missionConfigRef.current = missionConfig; }, [missionConfig]);
  const dragRef = useRef<{ startX: number; startY: number; dogX: number; dogY: number } | null>(null);
  const [, setTick] = useState(0);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [hoveredWeapon, setHoveredWeapon] = useState<WeaponId | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [rageHelpOpen, setRageHelpOpen] = useState(false);
  const aimAssistLocked = !!missionConfig?.disableAimAssist;
  const hidePower = !!missionConfig?.hidePower;
  const [aimAssist, setAimAssistState] = useState<boolean>(() => {
    if (missionConfig?.disableAimAssist) return false;
    try { return localStorage.getItem("wardogs.aimAssist") !== "0"; } catch { return true; }
  });
  useEffect(() => {
    const effective = aimAssistLocked ? false : aimAssist;
    setAimAssist(effective);
    if (!aimAssistLocked) {
      try { localStorage.setItem("wardogs.aimAssist", aimAssist ? "1" : "0"); } catch {}
    }
  }, [aimAssist, aimAssistLocked]);
  const rageTipShownRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!.parentElement!; // the flex-1 container
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const initIfNeeded = () => {
      if (stateRef.current) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      // Reserve top band (HP bars/turn card) and bottom band (arsenal HUD).
      // Both scale with actual canvas height so short landscape phones get more headroom.
      const shortLandscape = h < 460;
      const isTablet = window.matchMedia("(min-width: 640px)").matches && h >= 520;
      const hudReserve = isTablet ? 112 : shortLandscape ? 156 : 148;
      const topReserve = isTablet ? 90 : shortLandscape ? 140 : 110;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current = createGame(w, h, mode, undefined, hudReserve, chars, matchDuration, !!rageEnabled, topReserve);
      const cfg = missionConfigRef.current;
      if (cfg) {
        const st = stateRef.current;
        if (cfg.enemyHpBonus && cfg.enemyHpBonus > 0) {
          const d = st.dogs[1];
          d.maxHp = d.maxHp + cfg.enemyHpBonus;
          d.hp = d.maxHp;
        }
        if (cfg.allowedWeapons && cfg.allowedWeapons.length > 0) {
          const allow = new Set<WeaponId>(cfg.allowedWeapons);
          (Object.keys(st.ammo) as WeaponId[]).forEach(k => {
            if (!allow.has(k)) st.ammo[k] = 0;
          });
          if (!allow.has(st.weapon)) {
            const first = WEAPON_ORDER.find(w => allow.has(w));
            if (first) st.weapon = first;
          }
        }
        if (cfg.windMultiplier && cfg.windMultiplier !== 1) {
          st.wind = Math.max(-1, Math.min(1, st.wind * cfg.windMultiplier));
        }
        if (cfg.turnTimeSeconds && cfg.turnTimeSeconds > 0) {
          st.turnTimeLimit = cfg.turnTimeSeconds;
          st.turnTimer = cfg.turnTimeSeconds;
        }
        if (cfg.chaosWind) st.chaosWind = true;
        if (cfg.enemyRageCharged && st.rageEnabled) {
          st.dogs[1].rageCharge = 100;
        }
      }
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

      if (s.phase === "gameover" && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        const p = s.dogs[0];
        onGameOverRef.current?.({
          winner: s.winner,
          playerHpPct: p.maxHp > 0 ? Math.max(0, p.hp / p.maxHp) : 0,
        });
      }

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
      // Teleport aim: tap the mark to confirm, tap elsewhere to (re)position it.
      if (s.weapon === "teleport") {
        const t = s.teleportAiming;
        if (t && t.valid && Math.hypot(x - t.x, y - t.y) <= TELEPORT_CONFIRM_TOL) {
          confirmTeleport(s);
        } else {
          setTeleportTarget(s, x, y);
        }
        return;
      }
      const dog = s.dogs[s.currentPlayer];
      dragRef.current = { startX: x, startY: y, dogX: dog.x, dogY: dog.y };
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      // Only re-aim the teleport mark while a pointer is actively pressed
      // (e.buttons > 0 on mouse, or a touch is down). Prevents the mouse
      // simply hovering over the canvas from stealing the mark.
      if (s.weapon === "teleport" && s.teleportAiming && e.buttons > 0) {
        const { x, y } = toWorld(e);
        setTeleportTarget(s, x, y);
        return;
      }
      const drag = dragRef.current;
      if (!drag) return;
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
      if (!s) return;
      if (s.weapon === "teleport") return; // teleport is tap-only, confirm via canvas or HUD
      if (!drag) return;
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
      else if (e.code === "KeyF") {
        e.preventDefault();
        const dog = s.dogs[s.currentPlayer];
        const r = activateRage(s);
        if (r === "low") {
          s.floatingTexts.push({
            id: Math.random(), x: dog.x, y: dog.y - 34, vx: 0, vy: -60,
            life: 1.4, maxLife: 1.4,
            value: `Fúria ${Math.floor(dog.rageCharge)}/${RAGE_READY_THRESHOLD}`,
            color: "#ffb84a", size: 18,
          });
        }
      }
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
  const canAim = s?.phase === "aiming" && s?.winner === null;
  useEffect(() => { if (!canAim && arsenalOpen) setArsenalOpen(false); }, [canAim, arsenalOpen]);
  useEffect(() => { if (!canAim && rageHelpOpen) setRageHelpOpen(false); }, [canAim, rageHelpOpen]);
  const teamA = characterSkin(chars[0]);
  const teamB = characterSkin(chars[1]);
  const currentSkin = s?.currentPlayer === 0 ? teamA : teamB;
  const isAiTurn = mode === "ai" && s?.currentPlayer === 1;
  const hudVisible = s?.phase === "aiming" && s?.winner === null;

  const hudReserve = s?.hudReserve ?? 148;
  const hudCssPx = displaySize.h && s ? (displaySize.h * hudReserve) / s.height : 0;

  const tryRage = () => {
    if (!s) return;
    const dog = s.dogs[s.currentPlayer];
    const before = dog.rageActive;
    const result = activateRage(s);
    if (result === "low") {
      s.floatingTexts.push({
        id: Math.random(), x: dog.x, y: dog.y - 34, vx: 0, vy: -60,
        life: 1.4, maxLife: 1.4,
        value: `Fúria ${Math.floor(dog.rageCharge)}/${RAGE_READY_THRESHOLD}`,
        color: "#ffb84a", size: 18,
      });
    } else if (result === "unavailable" && !before && dog.hp > 0) {
      s.floatingTexts.push({
        id: Math.random(), x: dog.x, y: dog.y - 34, vx: 0, vy: -60,
        life: 1.2, maxLife: 1.2, value: "Fúria indisponível", color: "#b8b8b8", size: 16,
      });
    }
  };

  // Dica automática na 1ª vez que a barra ficar pronta (campanha)
  useEffect(() => {
    if (!s || !s.rageEnabled) return;
    if (rageTipShownRef.current) return;
    const dog = s.dogs[s.currentPlayer];
    if (!dog || dog.rageActive || dog.rageCharge < RAGE_READY_THRESHOLD) return;
    try {
      if (localStorage.getItem("wardogs.rage.tipShown") === "1") {
        rageTipShownRef.current = true;
        return;
      }
      localStorage.setItem("wardogs.rage.tipShown", "1");
    } catch {}
    rageTipShownRef.current = true;
    setRageHelpOpen(true);
  });


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
                <MiniPlayer dog={s.dogs[0]} active={s.currentPlayer === 0} />
                <MiniPlayer dog={s.dogs[1]} active={s.currentPlayer === 1} reinforced={(missionConfig?.enemyHpBonus ?? 0) >= 60} />
              </div>

              <div className="flex flex-col items-center gap-1 justify-self-center min-w-0 max-w-full pointer-events-auto">
                <MatchCountdown matchDuration={s.matchDuration} matchTimer={s.matchTimer} />
                <div className="panel px-2 py-1.5 sm:px-3 text-center min-w-0 max-w-full">
                  <div className="stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    {s.phase === "gameover" ? "Fim de combate" : `Turno ${currentSkin.name}`}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-0.5 leading-tight">{s.message}</div>
                  {s.phase === "aiming" && s.winner === null && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Turno {isAiTurn ? "IA…" : `${Math.max(0, Math.ceil(s.turnTimer))}s`}
                    </div>
                  )}
                </div>
              </div>



              <div className="flex flex-col items-end gap-1.5 pointer-events-auto min-w-0 justify-self-end">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { if (!aimAssistLocked) setAimAssistState(v => !v); }}
                    disabled={aimAssistLocked}
                    className={`btn-hud text-[10px] px-2 py-1 ${aimAssist && !aimAssistLocked ? "is-selected" : "opacity-70"} ${aimAssistLocked ? "cursor-not-allowed" : ""}`}
                    aria-pressed={aimAssist && !aimAssistLocked}
                    title={aimAssistLocked ? "Mira assistida travada nesta missão" : "Mira assistida: mostra o arco previsto do tiro"}
                  >
                    🎯 {aimAssistLocked ? "Mira 🔒" : (aimAssist ? "Mira ON" : "Mira OFF")}
                  </button>
                  <button onClick={onExit} className="btn-hud text-[10px] px-2 py-1">Sair</button>
                </div>
                <WindGauge wind={s.wind} />
              </div>
            </div>
          )}

          {s && s.phase === "aiming" && s.weapon === "teleport" && !isAiTurn && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[76px] sm:top-[92px] pointer-events-none z-20 animate-fade-in">
              <div
                className="panel px-3 py-1.5 flex items-center gap-2 shadow-xl"
                style={{
                  borderColor: s.teleportAiming?.valid ? "#38f0ff" : s.teleportAiming ? "#ff5a5a" : "rgba(255,255,255,0.2)",
                  boxShadow: s.teleportAiming?.valid ? "0 0 14px rgba(56,240,255,0.55)" : undefined,
                }}
              >
                <span className="text-lg leading-none">🌀</span>
                <div className="stencil text-[10px] sm:text-[11px] tracking-widest leading-tight text-center">
                  {!s.teleportAiming
                    ? <>TOQUE NO MAPA PARA MARCAR O DESTINO</>
                    : s.teleportAiming.valid
                      ? <span style={{ color: "#7ff0ff" }}>TOQUE NA MARCA OU EM CONFIRMAR</span>
                      : <span style={{ color: "#ff9a9a" }}>PONTO INVÁLIDO — TENTE MAIS PERTO</span>}
                </div>
              </div>
            </div>
          )}


          {s && s.phase !== "gameover" && hudCssPx > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 sm:px-3 sm:pb-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-end"
              style={{ height: hudCssPx, opacity: hudVisible ? 1 : 0.85 }}
              aria-hidden={!hudVisible}
            >
              <div className="flex flex-row items-stretch gap-1.5 sm:gap-2 flex-wrap w-full">
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

                <MobilityBar
                  dog={s.dogs[s.currentPlayer]}
                  disabled={!hudVisible || isAiTurn}
                  onHold={(dir) => { moveHoldRef.current = { dir }; }}
                  onRelease={() => { moveHoldRef.current = null; }}
                  onJump={() => jumpDog(s)}
                />

                <div className={`panel px-2 py-1.5 flex-1 min-w-[200px] flex items-center gap-2 ${hudVisible ? "" : "opacity-70"}`}>

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
                        <span className="stencil text-xs leading-none" style={{ color: "var(--accent)" }}>{hidePower ? "??" : Math.round(s.power)}</span>
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

                {s.rageEnabled && (() => {
                  const dog = s.dogs[s.currentPlayer];
                  const pct = Math.max(0, Math.min(100, dog.rageCharge));
                  const ready = pct >= RAGE_READY_THRESHOLD && !dog.rageActive;
                  const queued = !!dog.rageQueued;
                  const barColor = pct >= 100
                    ? "linear-gradient(90deg,#ffdc4a,#ff3838)"
                    : ready
                      ? "linear-gradient(90deg,#ff9138,#ff3838)"
                      : "linear-gradient(90deg,#7a4a1a,#ff9138)";
                  const label = dog.rageActive
                    ? "FÚRIA!"
                    : queued
                      ? "PRONTO"
                      : ready
                        ? "⚡ USAR"
                        : `⚡ ${Math.floor(pct)}%`;
                  return (
                    <div className="panel px-2 py-1.5 flex flex-col items-center gap-1 shrink-0 w-[92px] relative">
                      <div className="flex items-center gap-1 w-full">
                        <span className="text-[8px] uppercase tracking-widest text-muted-foreground/80 flex-1">Fúria</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRageHelpOpen(v => !v); }}
                          className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-[9px] leading-none flex items-center justify-center text-muted-foreground pointer-events-auto"
                          aria-label="Como funciona a Fúria"
                        >
                          ?
                        </button>
                      </div>
                      <button
                        disabled={isAiTurn || dog.rageActive || dog.hp <= 0}
                        onClick={tryRage}
                        className={`relative w-full py-1.5 rounded text-[11px] stencil tracking-widest border transition ${
                          dog.rageActive
                            ? "border-[color:var(--destructive)] text-[color:var(--destructive)] bg-[color:var(--destructive)]/20 animate-pulse"
                            : ready
                              ? "border-[color:var(--destructive)] text-[color:var(--destructive)] bg-[color:var(--destructive)]/15 hover:bg-[color:var(--destructive)]/25 animate-pulse shadow-[0_0_10px_rgba(255,56,56,0.5)]"
                              : queued
                                ? "border-amber-400/70 text-amber-300 bg-amber-500/10"
                                : "border-white/15 text-muted-foreground/80 bg-white/5 hover:bg-white/10"
                        } disabled:cursor-not-allowed`}
                        aria-label="Ativar Modo Fúria"
                      >
                        {label}
                        <span className="absolute -top-1 -right-1 text-[7px] px-1 rounded bg-black/70 border border-white/10 text-muted-foreground">F</span>
                      </button>
                      <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-white/5 relative">
                        <div
                          className="h-full rounded-full transition-[width] duration-150"
                          style={{
                            width: `${pct}%`,
                            background: barColor,
                            boxShadow: ready ? "0 0 8px rgba(255,56,56,0.7)" : undefined,
                          }}
                        />
                        {/* marca do limiar de ativação */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-white/50"
                          style={{ left: `${RAGE_READY_THRESHOLD}%` }}
                        />
                      </div>
                      {rageHelpOpen && (
                        <div className="absolute bottom-full mb-2 right-0 w-64 panel p-3 text-left pointer-events-auto z-50 shadow-xl">
                          <div className="flex items-center justify-between mb-1">
                            <div className="stencil text-[color:var(--destructive)] text-sm">MODO FÚRIA</div>
                            <button onClick={() => setRageHelpOpen(false)} className="text-muted-foreground text-xs px-1">✕</button>
                          </div>
                          <ul className="text-[11px] text-muted-foreground space-y-1 leading-snug">
                            <li>• Acerte tiros diretos pra encher a barra vermelha.</li>
                            <li>• A partir de <b className="text-white">{RAGE_READY_THRESHOLD}%</b> (marca branca) o botão fica pronto.</li>
                            <li>• Aperte <b className="text-white">⚡ USAR</b> ou a tecla <b className="text-white">F</b> pra ativar.</li>
                            <li>• Se apertar durante o tiro, ativa no <b className="text-white">próximo turno</b>.</li>
                            <li>• Durante 1 turno: <b className="text-white">+40% dano</b>, <b className="text-white">+10s tempo</b>, vento reduzido.</li>
                            <li>• Exclusivo do modo <b className="text-white">Campanha</b>.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  const dog = s.dogs[s.currentPlayer];
                  const pct = Math.max(0, Math.min(100, dog.specialCharge));
                  const ready = pct >= SPECIAL_READY_THRESHOLD;
                  return (
                    <div className="panel px-2 py-1.5 flex flex-col items-center gap-1 shrink-0 w-[86px]">
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground/80 w-full text-center">Bombardeio</span>
                      <button
                        disabled={isAiTurn || !ready || s.phase !== "aiming"}
                        onClick={() => triggerCanineBarrage(s)}
                        className={`relative w-full py-1.5 rounded text-[11px] stencil tracking-widest border transition ${
                          ready
                            ? "border-amber-300 text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 animate-pulse shadow-[0_0_10px_rgba(255,200,60,0.6)]"
                            : "border-white/15 text-muted-foreground/80 bg-white/5"
                        } disabled:cursor-not-allowed`}
                        aria-label="Bombardeio Canino"
                        title={ready ? "Bombardeio Canino pronto!" : "Acerte tiros para carregar"}
                      >
                        {ready ? "💣 GO" : `💣 ${Math.floor(pct)}%`}
                      </button>
                      <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5">
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

                {s.weapon === "teleport" ? (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      disabled={isAiTurn || s.phase !== "aiming" || !s.teleportAiming?.valid}
                      onClick={() => confirmTeleport(s)}
                      aria-label="Confirmar teletransporte"
                      className="px-3 h-9 sm:h-11 rounded-md stencil text-[11px] sm:text-xs tracking-widest border-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: s.teleportAiming?.valid ? "#38f0ff" : "rgba(255,255,255,0.15)",
                        color: s.teleportAiming?.valid ? "#0a1418" : "rgba(255,255,255,0.5)",
                        background: s.teleportAiming?.valid ? "linear-gradient(180deg,#7ff0ff,#38c8e0)" : "rgba(255,255,255,0.05)",
                        boxShadow: s.teleportAiming?.valid ? "0 0 12px rgba(56,240,255,0.55)" : undefined,
                      }}
                    >
                      CONFIRMAR
                    </button>
                    <button
                      disabled={isAiTurn}
                      onClick={() => { clearTeleportTarget(s); setWeapon(s, "bazooka"); }}
                      aria-label="Cancelar teletransporte"
                      className="px-3 h-7 sm:h-8 rounded-md stencil text-[10px] tracking-widest border border-white/20 text-muted-foreground hover:bg-white/5"
                    >
                      CANCELAR
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={isAiTurn || s.phase !== "aiming"}
                    onClick={() => fire(s)}
                    aria-label="Atirar"
                    className="fire-btn fire-btn-compact sm:!w-[4.5rem] sm:!h-[4.5rem] sm:!rounded-full sm:!text-[0.85rem] shrink-0"
                  >
                    FOGO
                  </button>
                )}


              </div>
            </div>
          )}


          {s?.phase === "gameover" && !onGameOver && (
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


function MatchCountdown({ matchDuration, matchTimer }: { matchDuration: number; matchTimer: number }) {
  if (matchDuration === 0) {
    return (
      <div className="panel px-2.5 py-1 flex items-center gap-1.5 shadow-lg">
        <span className="stencil text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Partida</span>
        <span className="stencil text-base leading-none opacity-80">∞</span>
      </div>
    );
  }
  const t = Math.max(0, matchTimer);
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  const expired = t <= 0;
  const critical = t <= 30 && !expired;
  const warn = !critical && t <= 60;
  const color = expired || critical ? "var(--destructive)" : warn ? "var(--accent)" : "var(--team-green)";
  return (
    <div
      className={`panel px-2.5 py-1 flex items-center gap-1.5 shadow-lg ${critical || expired ? "animate-pulse" : ""}`}
      style={{ borderColor: color, boxShadow: `0 0 12px ${color}55` }}
    >
      <span className="stencil text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Partida</span>
      {expired ? (
        <span className="stencil text-[11px] leading-none" style={{ color }}>TEMPO ESGOTADO</span>
      ) : (
        <span className="stencil text-base leading-none tabular-nums" style={{ color }}>
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

function MiniPlayer({ dog, active, reinforced }: { dog: import("@/game/types").Dog; active: boolean; reinforced?: boolean }) {
  const char = CHARACTERS[dog.charId];
  const color = char.skin.teamColor;
  const portrait = char.portraitUrl;
  const hp = dog.hp;
  const pct = Math.max(0, Math.min(100, (hp / dog.maxHp) * 100));
  return (
    <div
      className={`panel px-2 py-1 flex items-center gap-1.5 transition-all relative ${active ? "" : "opacity-60 scale-95"}`}
      style={active ? { boxShadow: `0 0 0 1.5px ${color}, 0 0 16px ${color}66`, borderColor: color } : undefined}
    >
      {portrait ? (
        <img src={portrait} alt="" className="w-7 h-7 rounded-md object-contain object-bottom shrink-0 bg-black/30" style={{ boxShadow: `0 0 6px ${color}` }} />
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      )}
      <div className="flex flex-col leading-tight min-w-0">
        <div className="stencil text-[9px] uppercase tracking-widest truncate">{char.name}</div>
        <div className="text-[8px] text-muted-foreground truncate">{char.breed}</div>
      </div>
      {reinforced && (
        <span className="absolute -top-1.5 -right-1 stencil text-[8px] tracking-widest px-1 py-[1px] rounded bg-[color:var(--destructive)] text-white shadow-[0_0_6px_rgba(255,56,56,0.7)] animate-pulse">
          REFORÇO
        </span>
      )}
      <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div className="h-full transition-all rounded-full" style={{ width: `${pct}%`, background: color }} />
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
  const pct = Math.max(0, Math.min(100, (dog.moveBudget / Math.max(1, dog.moveMax)) * 100));
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
    <div className="relative shrink-0">
      {open && (
        <div className="absolute left-0 bottom-full mb-2 panel p-2 sm:p-3 animate-fade-in z-20 shadow-2xl w-[280px] sm:w-[420px]">
          <div className="flex items-center justify-between mb-2">
            <div className="stencil text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Arsenal</div>
            <button className="btn-hud !px-2 !py-0.5 text-[10px]" onClick={onToggle} aria-label="Fechar arsenal">✕</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 sm:gap-1.5">
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
                  className={`btn-hud btn-hud-weapon flex-col items-center !px-1 py-1.5 min-w-0 overflow-hidden ${active ? "is-selected" : ""} ${empty ? "is-empty opacity-40" : ""}`}
                  style={active ? { borderColor: w.color, boxShadow: `inset 0 0 0 1px ${w.color}55, 0 0 18px ${w.color}55` } : undefined}
                >
                  <span aria-hidden><WeaponIcon id={id} className="w-6 h-6" /></span>
                  <span className="stencil text-[9px] uppercase tracking-wider leading-tight mt-0.5 text-center w-full truncate">
                    {WEAPON_SHORT[id]}
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
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Arsenal — ${currentW.name}`}
        disabled={disabled}
        className={`btn-hud h-full flex items-center gap-1.5 px-2 py-1.5 min-w-[128px] sm:min-w-[150px] ${open ? "is-selected" : ""}`}
        style={{ borderColor: currentW.color, boxShadow: open ? `0 0 18px ${currentW.color}77` : undefined }}
      >
        <span aria-hidden><WeaponIcon id={current} className="w-6 h-6" /></span>
        <span className="flex flex-col items-start min-w-0 flex-1">
          <span className="stencil text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-none">Arma</span>
          <span className="stencil text-xs truncate max-w-full" style={{ color: currentW.color }}>{currentW.name.split(" ")[0]}</span>
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
