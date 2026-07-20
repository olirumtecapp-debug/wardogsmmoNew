import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import { useScenario } from "@/game/scenarioContext";
import heroImg from "@/assets/wardogs-menu-bg.jpg";
import logoAsset from "@/assets/wardogs-logo.png.asset.json";
import keyHeroAsset from "@/assets/wardogs-menu-hero.png.asset.json";
const logoImg = logoAsset.url;
const keyHeroImg = keyHeroAsset.url;

import type { GameMode } from "@/game/types";

export const Route = createFileRoute("/")({
  component: Home,
});


function Home() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();

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
    <OrientationGate soft>
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Background layer */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#0b0f16",
          filter: "brightness(0.45) saturate(0.9)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-20 opacity-50 mix-blend-screen pointer-events-none">
        <MenuBackdrop />
      </div>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,10,14,0.55) 0%, rgba(8,10,14,0.15) 30%, rgba(8,10,14,0.55) 75%, rgba(8,10,14,0.95) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 hero-vignette pointer-events-none" aria-hidden />

      {/* Header — logo canto superior, permanece */}
      <header className="p-3 sm:p-5 flex items-center justify-between relative gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoImg}
            alt="WarDogs"
            className="h-8 sm:h-10 w-auto object-contain float-slow drop-shadow-[0_0_18px_rgba(255,138,26,0.4)] shrink-0"
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

      <main className="flex-1 flex flex-col items-center px-4 pb-6 gap-4 sm:gap-6 relative">
        {/* Key art central — nunca cortada */}
        <div className="w-full flex justify-center">
          <img
            src={keyHeroImg}
            alt="WarDogs — Ranger & Brutus"
            className="w-full max-w-5xl h-auto max-h-[42vh] sm:max-h-[52vh] lg:max-h-[58vh] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.75)] title-in-left"
          />
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full panel text-[10px] uppercase tracking-[0.3em] badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
            Ranger &amp; Brutus · 8 armas · 4 cenários
          </div>
        </div>

        {/* Modos */}
        <div className="w-full max-w-3xl grid gap-3 sm:grid-cols-3">
          <ModeCard title="vs IA" subtitle="Contra o computador" color="var(--team-green)" delay={0} icon={<TargetIcon />} onClick={() => setMode("ai")} />
          <ModeCard title="Hotseat" subtitle="2 jogadores, mesmo aparelho" color="var(--accent)" delay={90} icon={<VersusIcon />} onClick={() => setMode("hotseat")} />
          <ModeCard title="Online" subtitle="Em breve" color="var(--team-red)" delay={180} icon={<GlobeIcon />} disabled onClick={() => setShowOnlineNotice(true)} />
        </div>

        {showOnlineNotice && (
          <div className="w-full max-w-2xl panel p-4 text-sm text-left card-in">
            <div className="stencil text-xs uppercase text-warn mb-1">Multiplayer online</div>
            O modo online por código de sala exige infraestrutura WebSocket persistente.
            O jogo base — física, terreno, IA e hotseat — já está funcionando.
            <button className="btn-hud mt-3 text-xs" onClick={() => setShowOnlineNotice(false)}>Fechar</button>
          </div>
        )}

        {/* Cenário + Dificuldade lado a lado */}
        <div className="w-full max-w-4xl grid gap-3 sm:grid-cols-2">
          <div className="panel px-4 py-3 card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--accent)" }}>Cenário</div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{scenario.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map(sc => {
                const active = sc.id === scenario.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setScenario(sc.id)}
                    className={`btn-hud p-2 flex flex-col items-center gap-1 ${active ? "is-selected" : ""}`}
                    style={active ? { borderColor: sc.sky[2], boxShadow: `inset 0 0 0 1px ${sc.sky[2]}55, 0 0 18px ${sc.sky[2]}55` } : undefined}
                    title={sc.description}
                  >
                    <span
                      className="w-full h-9 rounded overflow-hidden"
                      style={{
                        backgroundImage: `url(${sc.bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        boxShadow: "inset 0 -8px 12px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    />
                    <span className="stencil text-[10px] uppercase tracking-widest">{sc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel px-4 py-3 card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--team-red)" }}>Dificuldade da IA</div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {difficulty === "recruit" ? "Recruta" : difficulty === "sergeant" ? "Sargento" : "General"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "recruit" as const, label: "Recruta", desc: "Distraído" },
                { id: "sergeant" as const, label: "Sargento", desc: "Equilibrado" },
                { id: "general" as const, label: "General", desc: "Preciso" },
              ]).map(d => {
                const active = difficulty === d.id;
                const color = d.id === "recruit" ? "var(--team-green)" : d.id === "sergeant" ? "var(--accent)" : "var(--team-red)";
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`btn-hud p-2 flex flex-col items-start gap-1 ${active ? "is-selected" : ""}`}
                    style={active ? { borderColor: color as string, boxShadow: `inset 0 0 0 1px ${color}, 0 0 14px ${color}` } : undefined}
                  >
                    <span className="stencil text-xs uppercase tracking-widest" style={{ color }}>{d.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <details className="w-full max-w-2xl text-xs text-muted-foreground">
          <summary className="cursor-pointer uppercase tracking-[0.25em] text-[10px] hover:text-foreground transition-colors">Atalhos ▸</summary>
          <div className="mt-2 grid gap-1">
            <div>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">← →</kbd> ângulo ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑ ↓</kbd> força ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">Espaço</kbd> atirar ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">1–8</kbd> arma
            </div>
            <div>No celular: arraste a partir do cachorro pra mirar e solte pra atirar.</div>
          </div>
        </details>
      </main>

      <div className="stripe-warn h-2 opacity-70 shrink-0" aria-hidden />
      <footer className="py-2 text-center text-[10px] text-muted-foreground uppercase tracking-[0.25em] shrink-0">
        Segure firme o capacete · Ajuste o ângulo · Boa sorte, soldado
      </footer>
    </div>
    </OrientationGate>
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
      className={`panel p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl card-in ${disabled ? "opacity-60 hover:translate-y-0" : ""}`}
      style={{ borderColor: color, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="stencil text-lg tracking-wider" style={{ color }}>{title}</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{subtitle}</div>
        </div>
        <div className="opacity-80" style={{ color }}>{icon}</div>
      </div>
      {!disabled && (
        <div className="mt-3 h-1 rounded-full overflow-hidden bg-black/40">
          <div className="h-full w-1/3 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
        </div>
      )}
    </button>
  );
}

function TargetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
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
    <svg width="36" height="32" viewBox="0 0 40 36" fill="none">
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
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="18" cy="18" rx="6" ry="14" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 18h28M6 11h24M6 25h24" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
