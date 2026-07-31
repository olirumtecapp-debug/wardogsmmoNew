import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelpCircle, X, Maximize2, Minimize2, Volume2, VolumeX, Heart } from "lucide-react";
import { SupportPixDialog } from "@/components/SupportPixDialog";
import { InstallAppButton } from "@/components/InstallAppButton";
import { audio, playSfx } from "@/game/audio";
import { AudioSettingsPanel } from "@/components/AudioSettingsPanel";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import { PreMatchBriefing } from "@/components/PreMatchBriefing";
import { ComicIntro, shouldSkipIntro } from "@/components/ComicIntro";
import { getActiveScenario } from "@/game/scenarios";
import { useFullscreen, requestFullscreenNow } from "@/hooks/useFullscreen";
import logoAsset from "@/assets/wardogs-logo.png.asset.json";
import menuHeroAsset from "@/assets/wardogs-menu-hero-v2.png.asset.json";
const logoImg = logoAsset.url;
const bgImg = menuHeroAsset.url;

import type { GameMode } from "@/game/types";
import type { CharacterId } from "@/game/characters";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WarDogs — Batalhas táticas entre pelotões caninos" },
      { name: "description", content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais." },
      { property: "og:title", content: "WarDogs — Batalhas táticas entre pelotões caninos" },
      { property: "og:description", content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WarDogs — Batalhas táticas entre pelotões caninos" },
      { name: "twitter:description", content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais." },
    ],
  }),
  component: Home,
});

type Stage =
  | { kind: "menu" }
  | { kind: "briefing"; mode: GameMode }
  | { kind: "intro"; mode: GameMode; chars: [CharacterId, CharacterId]; matchDuration: number }
  | { kind: "playing"; mode: GameMode; chars: [CharacterId, CharacterId]; matchDuration: number };

function Home() {
  const [stage, setStage] = useState<Stage>({ kind: "menu" });
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [muted, setMuted] = useState(() => audio.getSettings().muted);
  const navigate = useNavigate();
  const { isFullscreen, isMobile, supported: fsSupported } = useFullscreen();

  // Init audio on first pointer/keyboard interaction (browser autoplay policy).
  useEffect(() => {
    const kick = () => {
      audio.ensure();
      if (stage.kind === "menu") audio.playMusic("menu");
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [stage.kind]);

  // Track mute state
  useEffect(() => audio.subscribe((s) => setMuted(s.muted)), []);

  // Menu music when returning to menu
  useEffect(() => {
    if (stage.kind === "menu") audio.playMusic("menu");
    else if (stage.kind === "playing") audio.playMusic("combat");
  }, [stage.kind]);


  useEffect(() => {
    if (!showHowTo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowHowTo(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHowTo]);

  if (stage.kind === "playing") {
    return (
      <OrientationGate>
        <div className="fixed inset-0">
          <WarDogsGame
            mode={stage.mode}
            chars={stage.chars}
            matchDuration={stage.matchDuration}
            onExit={() => setStage({ kind: "menu" })}
          />
        </div>
      </OrientationGate>
    );
  }

  if (stage.kind === "intro") {
    const sc = getActiveScenario();
    return (
      <ComicIntro
        chars={stage.chars}
        scenarioLabel={sc.label}
        bgImage={sc.bgImage}
        onDone={() => setStage({ kind: "playing", mode: stage.mode, chars: stage.chars, matchDuration: stage.matchDuration })}
      />
    );
  }

  if (stage.kind === "briefing") {
    return (
      <OrientationGate soft>
        <PreMatchBriefing
          mode={stage.mode}
          onStart={(chars, matchDuration) => {
            if (shouldSkipIntro()) {
              setStage({ kind: "playing", mode: stage.mode, chars, matchDuration });
            } else {
              setStage({ kind: "intro", mode: stage.mode, chars, matchDuration });
            }
          }}
          onBack={() => setStage({ kind: "menu" })}
        />
      </OrientationGate>
    );
  }


  const pickMode = (mode: GameMode) => {
    // User gesture — safe to request fullscreen on Android/Chrome.
    if (isMobile && fsSupported && !isFullscreen) {
      void requestFullscreenNow();
    }
    setStage({ kind: "briefing", mode });
  };

  return (
    <OrientationGate soft>
    <div className="relative min-h-dvh overflow-hidden flex flex-col safe-pad">
      {/* Background layer — key art */}
      <div
        className="fixed inset-0 -z-30"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0b0f16",
        }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-20 opacity-20 mix-blend-screen pointer-events-none">
        <MenuBackdrop />
      </div>
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,9,14,0.75) 0%, rgba(6,9,14,0.35) 35%, rgba(6,9,14,0.45) 65%, rgba(6,9,14,0.92) 100%)",
        }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 hero-vignette pointer-events-none" aria-hidden />

      {/* Header — logo canto superior */}
      <header className="p-3 sm:p-5 flex items-center justify-between relative gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoImg}
            alt="WarDogs"
            className="h-10 sm:h-14 w-auto object-contain float-slow drop-shadow-[0_0_22px_rgba(255,138,26,0.55)] shrink-0"
          />
          <div className="min-w-0 hidden sm:block">
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.3em] truncate">
              Artilharia canina · Squad até 4 · Online, IA & Hotseat
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--team-green)] badge-live" />
          Pelotão pronto
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between px-4 pb-3 gap-2 relative">
        {/* Espaço reservado para a arte de fundo respirar */}
        <div className="flex-1 min-h-0" aria-hidden />

        {/* Modos — compactos */}
        <div className="w-full max-w-3xl grid gap-2 grid-cols-2 sm:grid-cols-4">
          <ModeCard title="Campanha" subtitle="Missões + estrelas" color="var(--warn)" delay={0} icon={<StarIcon />} onClick={() => navigate({ to: "/campaign" })} />
          <ModeCard title="vs IA" subtitle="Contra o computador" color="var(--team-green)" delay={70} icon={<TargetIcon />} onClick={() => pickMode("ai")} />
          <ModeCard title="Hotseat" subtitle="2 jogadores" color="var(--accent)" delay={140} icon={<VersusIcon />} onClick={() => pickMode("hotseat")} />
          <ModeCard title="Online" subtitle="Sala + código" color="var(--team-red)" delay={210} icon={<GlobeIcon />} onClick={() => navigate({ to: "/online" })} />
        </div>


        {/* Botões discretos — Como Jogar + Áudio + Tela Cheia */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => { playSfx("click"); setShowHowTo(true); }}
            className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
          >
            <HelpCircle size={14} />
            Como jogar
          </button>
          <button
            onClick={() => { audio.ensure(); playSfx("click"); setShowAudio(true); }}
            className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
            aria-label="Áudio"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            Áudio
          </button>
          {fsSupported && (
            <button
              onClick={() => { playSfx("click"); void (isFullscreen ? exitFullscreenNow() : requestFullscreenNow()); }}
              className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
              aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            </button>
          )}
          <InstallAppButton className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]" />
          <button
            onClick={() => { playSfx("click"); setShowSupport(true); }}
            className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
            style={{ borderColor: "var(--warn)", color: "var(--warn)" }}
            aria-label="Apoiar o projeto"
          >
            <Heart size={14} className="fill-current" />
            Apoiar
          </button>

        </div>
      </main>


      <div className="stripe-warn h-2 opacity-70 shrink-0" aria-hidden />
      <footer className="py-2 text-center text-[10px] text-muted-foreground uppercase tracking-[0.25em] shrink-0">
        Segure firme o capacete · Ajuste o ângulo · Boa sorte, soldado
      </footer>

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
      {showAudio && <AudioSettingsPanel onClose={() => setShowAudio(false)} />}
    </div>
    </OrientationGate>
  );
}

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm card-in"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-lg p-5 max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="stencil text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]">
            Como jogar
          </div>
          <button
            onClick={onClose}
            className="btn-hud p-1.5"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
          <ShortcutRow label="Ângulo" keys={["←", "→"]} />
          <ShortcutRow label="Força" keys={["↑", "↓"]} />
          <ShortcutRow label="Atirar" keys={["Espaço"]} />
          <ShortcutRow label="Mover" keys={["A", "D"]} />
          <ShortcutRow label="Pulo" keys={["W"]} />
          <ShortcutRow label="Arma" keys={["1", "–", "8"]} />
        </div>

        <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">
            No celular · arraste do cachorro pra mirar e solte pra atirar
          </div>
          <div className="text-[10px] text-[color:var(--accent)]/90 text-center">
            🌀 <b>Teletransporte:</b> toque no mapa pra marcar o destino, depois toque na marca (ou em CONFIRMAR) pra reaparecer lá.
          </div>
        </div>

      </div>
    </div>
  );
}

function ModeCard({
  title, subtitle, color, onClick, disabled, icon, delay,
}: {
  title: string; subtitle: string; color: string; onClick: () => void;
  disabled?: boolean; icon: React.ReactNode; delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`panel p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl card-in ${disabled ? "opacity-60 hover:translate-y-0" : ""}`}
      style={{ borderColor: color, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <div className="opacity-80 shrink-0" style={{ color }}>{icon}</div>
        <div className="min-w-0">
          <div className="stencil text-sm tracking-wider truncate" style={{ color }}>{title}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest truncate">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[22px] px-1.5 py-0.5 text-center bg-secondary/80 border border-border/60 rounded text-[10px] font-mono shadow-inner"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <circle cx="18" cy="18" r="1.4" fill="currentColor" />
      <path d="M18 2v6M18 28v6M2 18h6M28 18h6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function VersusIcon() {
  return (
    <svg width="24" height="22" viewBox="0 0 40 36" fill="none">
      <g fill="currentColor">
        <path d="M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z" opacity="0.85" />
      </g>
      <g fill="currentColor" transform="translate(40 0) scale(-1 1)">
        <path d="M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z" opacity="0.85" />
      </g>
      <text x="20" y="22" textAnchor="middle" fontFamily="Black Ops One, sans-serif" fontSize="9" fill="currentColor">VS</text>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="18" cy="18" rx="6" ry="14" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 18h28" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
      <path d="M18 3 L22.2 13.2 L33 14.2 L24.6 21.6 L27.2 32 L18 26.4 L8.8 32 L11.4 21.6 L3 14.2 L13.8 13.2 Z"
        fill="currentColor" opacity="0.9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
