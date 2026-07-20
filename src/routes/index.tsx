import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import { PreMatchBriefing } from "@/components/PreMatchBriefing";
import logoAsset from "@/assets/wardogs-logo.png.asset.json";
import keyHeroAsset from "@/assets/wardogs-menu-hero.png.asset.json";
import keyArtAsset from "@/assets/wardogs-keyart-menu.png.asset.json";
const logoImg = logoAsset.url;
const bgImg = keyArtAsset.url;
void keyHeroAsset;

import type { GameMode } from "@/game/types";
import type { CharacterId } from "@/game/characters";

export const Route = createFileRoute("/")({
  component: Home,
});

type Stage =
  | { kind: "menu" }
  | { kind: "briefing"; mode: GameMode }
  | { kind: "playing"; mode: GameMode; chars: [CharacterId, CharacterId] };

function Home() {
  const [stage, setStage] = useState<Stage>({ kind: "menu" });
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

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
          <WarDogsGame mode={stage.mode} chars={stage.chars} onExit={() => setStage({ kind: "menu" })} />
        </div>
      </OrientationGate>
    );
  }

  if (stage.kind === "briefing") {
    return (
      <OrientationGate soft>
        <PreMatchBriefing
          mode={stage.mode}
          onStart={(chars) => setStage({ kind: "playing", mode: stage.mode, chars })}
          onBack={() => setStage({ kind: "menu" })}
        />
      </OrientationGate>
    );
  }

  const pickMode = (mode: GameMode) => setStage({ kind: "briefing", mode });

  return (
    <OrientationGate soft>
    <div className="relative min-h-screen overflow-hidden flex flex-col">
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
              Artilharia canina · 2 jogadores
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--team-green)] badge-live" />
          Pelotão pronto
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between px-4 pb-4 gap-3 relative">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full panel text-[10px] uppercase tracking-[0.3em] badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
            Ranger &amp; Brutus · 8 armas · 4 cenários
          </div>
        </div>

        {/* Espaço reservado para a arte de fundo respirar */}
        <div className="flex-1 min-h-0" aria-hidden />

        {/* Modos — compactos */}
        <div className="w-full max-w-2xl grid gap-2 grid-cols-3">
          <ModeCard title="vs IA" subtitle="Contra o computador" color="var(--team-green)" delay={0} icon={<TargetIcon />} onClick={() => pickMode("ai")} />
          <ModeCard title="Hotseat" subtitle="2 jogadores" color="var(--accent)" delay={90} icon={<VersusIcon />} onClick={() => pickMode("hotseat")} />
          <ModeCard title="Online" subtitle="Em breve" color="var(--team-red)" delay={180} icon={<GlobeIcon />} disabled onClick={() => setShowOnlineNotice(true)} />
        </div>

        {showOnlineNotice && (
          <div className="w-full max-w-2xl panel p-3 text-xs text-left card-in">
            <div className="stencil text-[10px] uppercase text-warn mb-1">Multiplayer online</div>
            O modo online exige infraestrutura WebSocket persistente. O jogo base — física, terreno, IA e hotseat — já está funcionando.
            <button className="btn-hud mt-2 text-[10px]" onClick={() => setShowOnlineNotice(false)}>Fechar</button>
          </div>
        )}

        {/* Botão discreto — Como Jogar */}
        <button
          onClick={() => setShowHowTo(true)}
          className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
        >
          <HelpCircle size={14} />
          Como jogar
        </button>
      </main>


      <div className="stripe-warn h-2 opacity-70 shrink-0" aria-hidden />
      <footer className="py-2 text-center text-[10px] text-muted-foreground uppercase tracking-[0.25em] shrink-0">
        Segure firme o capacete · Ajuste o ângulo · Boa sorte, soldado
      </footer>

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
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

        <div className="mt-4 pt-3 border-t border-border/40 text-center text-muted-foreground text-[10px] uppercase tracking-widest">
          No celular · arraste do cachorro pra mirar e solte pra atirar
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
