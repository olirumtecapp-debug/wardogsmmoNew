import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import { useScenario } from "@/game/scenarioContext";
import { teamSkin, type TeamSkin } from "@/game/skins";
import heroImg from "@/assets/wardogs-menu-bg.jpg";
import logoAsset from "@/assets/wardogs-logo.png.asset.json";
const logoImg = logoAsset.url;
import rangerPortrait from "@/assets/wardogs-ranger.png.asset.json";
import brutusPortrait from "@/assets/wardogs-brutus.png.asset.json";


const PORTRAITS: Record<string, string> = {
  RANGER: rangerPortrait.url,
  BRUTUS: brutusPortrait.url,
};


import type { GameMode } from "@/game/types";

export const Route = createFileRoute("/")({
  component: Home,
});


function Home() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
  const teamA = teamSkin(0);
  const teamB = teamSkin(1);

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
      {/* Key art background — primary layer */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundColor: "#0b0f16",
        }}
        aria-hidden
      />
      {/* Animated particles/projectiles above the art but transparent */}
      <div className="absolute inset-0 -z-20 opacity-60 mix-blend-screen pointer-events-none">
        <MenuBackdrop />
      </div>
      {/* Subtle darkening only at the very bottom for text legibility */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,10,14,0) 0%, rgba(8,10,14,0) 45%, rgba(8,10,14,0.55) 78%, rgba(8,10,14,0.92) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 hero-vignette pointer-events-none" aria-hidden />


      <header className="p-4 sm:p-6 flex items-center justify-between relative gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoImg}
            alt="WarDogs"
            className="h-8 sm:h-10 w-auto object-contain float-slow drop-shadow-[0_0_18px_rgba(255,138,26,0.35)] shrink-0"
          />
          <div className="min-w-0 hidden xs:block sm:block">
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

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8 relative">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full panel text-[10px] uppercase tracking-[0.3em] badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
            Arsenal ampliado: 8 armas · 4 cenários
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end justify-items-center gap-3 sm:gap-6 max-w-3xl mx-auto pb-2">
            <img
              src={PORTRAITS.RANGER}
              alt="Ranger"
              className="max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] w-auto object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)] title-in-left justify-self-end"
              style={{ animationDelay: "0ms" }}
            />
            <img
              src={logoImg}
              alt="WarDogs"
              className="w-[min(38vw,220px)] sm:w-[min(30vw,240px)] lg:w-[280px] h-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)] title-in-left self-center"
            />
            <img
              src={PORTRAITS.BRUTUS}
              alt="Brutus"
              className="max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] w-auto object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)] title-in-left justify-self-start"
              style={{ animationDelay: "120ms" }}
            />
          </div>



          <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Ranger &amp; Brutus. Bazuca, RPG, arco, granadas, cluster e air strike.
            <br className="hidden sm:block" />
            Escolha o cenário, calcule o vento, detone o adversário.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <ModeCard title="vs IA" subtitle="Contra o computador" color="var(--team-green)" delay={0} icon={<TargetIcon />} onClick={() => setMode("ai")} />
            <ModeCard title="Hotseat" subtitle="2 jogadores, mesmo aparelho" color="var(--accent)" delay={90} icon={<VersusIcon />} onClick={() => setMode("hotseat")} />
            <ModeCard title="Online" subtitle="Em breve" color="var(--team-red)" delay={180} icon={<GlobeIcon />} disabled onClick={() => setShowOnlineNotice(true)} />
          </div>

          {showOnlineNotice && (
            <div className="mt-6 panel p-4 text-sm text-left card-in">
              <div className="stencil text-xs uppercase text-warn mb-1">Multiplayer online</div>
              O modo online por código de sala exige infraestrutura WebSocket persistente (Durable Objects na Cloudflare).
              O jogo base — física, terreno, IA e hotseat — já está funcionando.
              <button className="btn-hud mt-3 text-xs" onClick={() => setShowOnlineNotice(false)}>Fechar</button>
            </div>
          )}

          {/* Cenário */}
          <div className="mt-10 panel px-4 py-3 max-w-2xl mx-auto card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--accent)" }}>Cenário</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{scenario.description}</div>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{scenario.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      className="w-full h-10 rounded overflow-hidden"
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

          {/* Dificuldade IA */}
          <div className="mt-4 panel px-4 py-3 max-w-2xl mx-auto card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--team-red)" }}>Dificuldade da IA</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Aplica ao modo vs IA</div>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {difficulty === "recruit" ? "Recruta" : difficulty === "sergeant" ? "Sargento" : "General"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "recruit" as const, label: "Recruta", desc: "Aleatório e distraído" },
                { id: "sergeant" as const, label: "Sargento", desc: "Simulação decente" },
                { id: "general" as const, label: "General", desc: "Busca profunda, usa vento e todo arsenal" },
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
            <DogDossier skin={teamA} role="Recon" />
            <DogDossier skin={teamB} role="Assalto" />
          </div>

          <div className="mt-10 text-xs text-muted-foreground grid gap-1 max-w-md mx-auto">
            <div>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">← →</kbd> ângulo ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑ ↓</kbd> força ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">Espaço</kbd> atirar ·{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">1–8</kbd> arma
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

function DogDossier({ skin, role }: { skin: TeamSkin; role: string }) {
  const color = skin.teamColor;
  const accent = skin.bodyBase;
  const traits = skin.silhouette === "pointy"
    ? ["Velocidade", "Foco", "Lealdade"]
    : ["Força", "Resistência", "Proteção"];
  const subtitle = `${skin.silhouette === "pointy" ? "Pastor Alemão" : "Bulldog"} · ${role}`;
  return (
    <div
      className="panel p-4 flex items-center gap-3 card-in text-left transition-all"
      style={{ borderColor: color, boxShadow: `inset 0 0 0 1px ${color}55, 0 10px 30px -10px rgba(0,0,0,0.6)` }}
    >
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: `radial-gradient(circle at 30% 30%, ${accent}, #0e0e12)`, boxShadow: `0 0 18px ${color}55` }}
      >
        {PORTRAITS[skin.name] && (
          <img src={PORTRAITS[skin.name]} alt={skin.name} className="w-full h-full object-contain object-bottom p-0.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="stencil text-xl leading-none" style={{ color }}>{skin.name}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{subtitle}</div>
        <div className="flex flex-wrap gap-1 mt-2">
          {traits.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest border" style={{ borderColor: `${color}66`, color, background: "rgba(0,0,0,0.35)" }}>
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
    </svg>
  );
}
