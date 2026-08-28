import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Lock, Star } from "lucide-react";
import { MISSIONS, loadProgress, isUnlocked } from "@/game/campaign";
import { SCENARIOS } from "@/game/scenarios";
import { OrientationGate } from "@/components/OrientationGate";
import keyArtAsset from "@/assets/wardogs-keyart-menu.png.asset.json";

export const Route = createFileRoute("/campaign/")({
  head: () => ({
    meta: [
      { title: "Campanha — WarDogs" },
      { name: "description", content: "Missões táticas com dificuldade progressiva e recompensas em estrelas." },
      { property: "og:title", content: "Campanha — WarDogs" },
      { property: "og:description", content: "Missões táticas com dificuldade progressiva e recompensas em estrelas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignMap,
});

const DIFF_LABEL: Record<string, { label: string; color: string }> = {
  recruit: { label: "Recruta", color: "var(--team-green)" },
  sergeant: { label: "Sargento", color: "var(--accent)" },
  general: { label: "General", color: "var(--team-red)" },
};

function CampaignMap() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => loadProgress());
  const totalStars = useMemo(
    () => Object.values(progress.stars).reduce((a, b) => a + b, 0),
    [progress],
  );
  const maxStars = MISSIONS.length * 3;

  const resetProgress = () => {
    if (!confirm("Zerar todo o progresso da campanha?")) return;
    try { localStorage.removeItem("wardogs.campaign.v1"); } catch { /* ignore */ }
    setProgress(loadProgress());
  };

  return (
    <OrientationGate soft>
      <div className="relative min-h-dvh overflow-auto flex flex-col">
        <div
          className="fixed inset-0 -z-20 hero-bg-responsive"
          style={{
            backgroundImage: `url(${keyArtAsset.url})`,
          }}
          aria-hidden
        />
        <div
          className="fixed inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,9,14,0.88) 0%, rgba(6,9,14,0.75) 50%, rgba(6,9,14,0.96) 100%)",
          }}
          aria-hidden
        />

        <header className="flex items-center justify-between p-3 sm:p-5 gap-3 shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Campanha</div>
            <div className="stencil text-lg sm:text-2xl tracking-widest">Operações WarDogs</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="panel px-2.5 py-1 flex items-center gap-1.5">
              <Star size={14} className="fill-[color:var(--warn)] text-[color:var(--warn)]" />
              <span className="stencil text-xs" style={{ color: "var(--warn)" }}>
                {totalStars}/{maxStars}
              </span>
            </div>
            <Link to="/" className="btn-hud text-[11px] px-2 py-1">← Menu</Link>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-6 pb-6 max-w-4xl w-full mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MISSIONS.map(m => {
              const unlocked = isUnlocked(m, progress);
              const stars = progress.stars[m.id] ?? 0;
              const scenario = SCENARIOS.find(s => s.id === m.scenario)!;
              const diff = DIFF_LABEL[m.difficulty];
              const accent = m.bonus ? "var(--warn)" : diff.color;

              return (
                <button
                  key={m.id}
                  disabled={!unlocked}
                  onClick={() => navigate({ to: "/campaign/$missionId", params: { missionId: m.id } })}
                  className={`panel p-3 flex gap-3 text-left transition-all ${
                    unlocked ? "hover:-translate-y-0.5 hover:shadow-2xl" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ borderColor: accent, boxShadow: unlocked ? `inset 0 0 0 1px ${accent}44, 0 0 12px ${accent}22` : undefined }}
                >
                  <div
                    className="w-20 h-20 rounded shrink-0 overflow-hidden relative"
                    style={{
                      backgroundImage: `url(${scenario.bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      boxShadow: `inset 0 0 0 1px ${accent}66`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute top-1 left-1 stencil text-[10px] px-1 rounded bg-black/70" style={{ color: accent }}>
                      {m.bonus ? "★" : m.index}
                    </div>
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Lock size={22} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="stencil text-sm uppercase tracking-widest truncate" style={{ color: accent }}>
                        {m.name}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3].map(i => (
                          <Star
                            key={i}
                            size={13}
                            className={i <= stars ? "fill-[color:var(--warn)] text-[color:var(--warn)]" : "text-muted-foreground/40"}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      {m.brief}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mt-auto">
                      <span>{scenario.label}</span>
                      <span>·</span>
                      <span style={{ color: diff.color }}>{diff.label}</span>
                      {m.bonus && <><span>·</span><span style={{ color: "var(--warn)" }}>Bônus</span></>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center">
            <button className="btn-hud text-[10px] px-3 py-1 opacity-70 hover:opacity-100" onClick={resetProgress}>
              Zerar progresso
            </button>
          </div>
        </main>
      </div>
    </OrientationGate>
  );
}
