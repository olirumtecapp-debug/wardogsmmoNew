import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import heroImg from "@/assets/hero-wardogs.jpg";
import emblem from "@/assets/emblem-paw.png";
import type { GameMode } from "@/game/types";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);

  if (mode) {
    return (
      <OrientationGate>
        <div className="fixed inset-0">
          <WarDogsGame mode={mode} onExit={() => setMode(null)} />
        </div>
      </OrientationGate>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Animated canvas backdrop */}
      <div className="absolute inset-0 -z-10">
        <MenuBackdrop />
      </div>
      {/* Hero photo overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          maskImage: "radial-gradient(ellipse at 50% 45%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 30%, transparent 85%)",
        }}
        aria-hidden
      />
      {/* Vignette so text stays readable */}
      <div className="absolute inset-0 -z-10 hero-vignette" aria-hidden />

      <header className="p-5 sm:p-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <img
            src={emblem}
            alt=""
            width={48}
            height={48}
            className="w-11 h-11 sm:w-14 sm:h-14 float-slow drop-shadow-[0_0_18px_rgba(125,214,106,0.35)]"
          />
          <div>
            <div className="stencil text-xl sm:text-2xl leading-none tracking-wider">WarDogs</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.3em]">
              Artilharia canina
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--team-green)] badge-live" />
          Pelotão pronto
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8 relative">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full panel text-[10px] uppercase tracking-[0.3em] badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
            Novo arsenal: RPG · Arco &amp; Flecha
          </div>

          <h1 className="stencil mt-5 text-6xl sm:text-8xl leading-[0.9] tracking-tight">
            <span className="inline-block title-in-left glow-green" style={{ color: "var(--team-green)" }}>WAR</span>
            <span className="inline-block title-in-right glow-red ml-2 sm:ml-4" style={{ color: "var(--team-red)" }}>DOGS</span>
          </h1>

          <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Cães marrentos de capacete militar. Bazuca, granada, RPG e arco &amp; flecha. Terreno destrutível.
            <br className="hidden sm:block" />
            Escolha o ângulo. Calcule o vento. Detone o adversário.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <ModeCard
              title="vs IA"
              subtitle="Contra o computador"
              color="var(--team-green)"
              delay={0}
              icon={<TargetIcon />}
              onClick={() => setMode("ai")}
            />
            <ModeCard
              title="Hotseat"
              subtitle="2 jogadores, mesmo aparelho"
              color="var(--accent)"
              delay={90}
              icon={<VersusIcon />}
              onClick={() => setMode("hotseat")}
            />
            <ModeCard
              title="Online"
              subtitle="Em breve"
              color="var(--team-red)"
              delay={180}
              icon={<GlobeIcon />}
              disabled
              onClick={() => setShowOnlineNotice(true)}
            />
          </div>

          {showOnlineNotice && (
            <div className="mt-6 panel p-4 text-sm text-left card-in">
              <div className="stencil text-xs uppercase text-warn mb-1">Multiplayer online</div>
              O modo online por código de sala exige infraestrutura WebSocket persistente (Durable Objects na Cloudflare).
              O jogo base — física, terreno, IA e hotseat — já está funcionando. Peça pra ativar o online quando quiser que eu
              provisione o backend WebSocket.
              <button className="btn-hud mt-3 text-xs" onClick={() => setShowOnlineNotice(false)}>Fechar</button>
            </div>
          )}

          {/* Ranger vs Brutus dossiers */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
            <DogDossier
              name="Ranger"
              subtitle="Pastor Alemão · Recon"
              color="var(--team-green)"
              traits={["Velocidade", "Foco", "Lealdade"]}
              accent="#ff8a1a"
            />
            <DogDossier
              name="Brutus"
              subtitle="Bulldog · Assalto"
              color="var(--team-red)"
              traits={["Força", "Resistência", "Proteção"]}
              accent="#6b7a44"
            />
          </div>


          <div className="mt-10 text-xs text-muted-foreground grid gap-1 max-w-md mx-auto">
            <div>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">← →</kbd> ângulo ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑ ↓</kbd> força ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">Espaço</kbd> atirar ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">1–5</kbd> arma
            </div>
            <div>No celular: arraste a partir do cachorro pra mirar e solte pra atirar.</div>
          </div>
        </div>
      </main>

      <div className="stripe-warn h-2 opacity-70" aria-hidden />
      <footer className="p-4 text-center text-xs text-muted-foreground uppercase tracking-[0.25em]">
        Segure firme o capacete · Ajuste o ângulo · Boa sorte, soldado
      </footer>
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
      className={`panel p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl card-in ${disabled ? "opacity-60 hover:translate-y-0" : ""}`}
      style={{ borderColor: color, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="stencil text-xl tracking-wider" style={{ color }}>{title}</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{subtitle}</div>
        </div>
        <div className="opacity-80" style={{ color }}>{icon}</div>
      </div>
      {!disabled && (
        <div className="mt-4 h-1 rounded-full overflow-hidden bg-black/40">
          <div className="h-full w-1/3 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
        </div>
      )}
    </button>
  );
}

function DogDossier({
  name, subtitle, color, traits, accent,
}: { name: string; subtitle: string; color: string; traits: string[]; accent: string }) {
  return (
    <div
      className="panel p-4 flex items-center gap-3 card-in text-left"
      style={{ borderColor: color, boxShadow: `inset 0 0 0 1px ${color}55, 0 10px 30px -10px rgba(0,0,0,0.6)` }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `radial-gradient(circle at 30% 30%, ${accent}, #0e0e12)`, boxShadow: `0 0 18px ${color}55` }}
      >
        <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
          <path d="M6 8 L10 3 L12 9 Z M26 8 L22 3 L20 9 Z" fill={color} opacity="0.9" />
          <path d="M8 22 c 0 -8 6 -12 8 -12 s 8 4 8 12 c 0 4 -3 6 -8 6 s -8 -2 -8 -6z" fill={color} />
          <circle cx="12" cy="18" r="1.6" fill="#0a0a0e" />
          <circle cx="20" cy="18" r="1.6" fill="#0a0a0e" />
          <path d="M14 24 q 2 2 4 0" stroke="#0a0a0e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="stencil text-xl leading-none" style={{ color }}>{name}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{subtitle}</div>
        <div className="flex flex-wrap gap-1 mt-2">
          {traits.map(t => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest border"
              style={{ borderColor: `${color}66`, color, background: "rgba(0,0,0,0.35)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="18" cy="18" r="1.4" fill="currentColor" />
      <path d="M18 2v6M18 28v6M2 18h6M28 18h6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function VersusIcon() {
  return (
    <svg width="40" height="36" viewBox="0 0 40 36" fill="none">
      {/* Two dog head silhouettes facing each other */}
      <g fill="currentColor">
        <path d="M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z" opacity="0.85" />
        <path d="M4 12l3-4 2 3z" />
      </g>
      <g fill="currentColor" transform="translate(40 0) scale(-1 1)">
        <path d="M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z" opacity="0.85" />
        <path d="M4 12l3-4 2 3z" />
      </g>
      <text x="20" y="22" textAnchor="middle" fontFamily="Black Ops One, sans-serif" fontSize="9" fill="currentColor">VS</text>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="18" cy="18" rx="6" ry="14" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 18h28M6 11h24M6 25h24" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="24" cy="11" r="3" fill="currentColor" opacity="0.9" />
      <path d="M24 9v-2M22.5 10l-1.5-1M25.5 10l1.5-1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
