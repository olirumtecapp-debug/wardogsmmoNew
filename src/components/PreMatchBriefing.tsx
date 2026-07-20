import { useState } from "react";
import { useScenario, type Difficulty } from "@/game/scenarioContext";
import type { GameMode } from "@/game/types";
import type { ScenarioId } from "@/game/scenarios";

interface Props {
  mode: GameMode;
  onStart: () => void;
  onBack: () => void;
}

const DIFF_INFO: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "recruit", label: "Recruta", desc: "Distraído, erros frequentes", color: "var(--team-green)" },
  { id: "sergeant", label: "Sargento", desc: "Equilibrado, mira decente", color: "var(--accent)" },
  { id: "general", label: "General", desc: "Preciso, aproveita cada abertura", color: "var(--team-red)" },
];

export function PreMatchBriefing({ mode, onStart, onBack }: Props) {
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
  const [scenarioSel, setScenarioSel] = useState<ScenarioId>(scenario.id);
  const [diffSel, setDiffSel] = useState<Difficulty>(difficulty);

  const handleStart = () => {
    setScenario(scenarioSel);
    if (mode === "ai") setDifficulty(diffSel);
    onStart();
  };

  return (
    <div className="fixed inset-0 overflow-auto bg-[#0b0f16]">
      <div className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Briefing</div>
            <div className="stencil text-xl sm:text-2xl tracking-widest">
              {mode === "ai" ? "Missão vs IA" : "Duelo Hotseat"}
            </div>
          </div>
          <button className="btn-hud text-xs" onClick={onBack}>← Voltar</button>
        </header>

        <div className="panel p-4 card-in text-left">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--accent)" }}>Cenário</div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {scenarios.find(s => s.id === scenarioSel)?.description}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenarios.map(sc => {
              const active = sc.id === scenarioSel;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenarioSel(sc.id)}
                  className={`btn-hud p-2 flex flex-col items-center gap-1 ${active ? "is-selected" : ""}`}
                  style={active ? { borderColor: sc.sky[2], boxShadow: `inset 0 0 0 1px ${sc.sky[2]}55, 0 0 18px ${sc.sky[2]}55` } : undefined}
                  title={sc.description}
                >
                  <span
                    className="w-full h-16 rounded overflow-hidden"
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

        {mode === "ai" && (
          <div className="panel p-4 card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--team-red)" }}>Dificuldade da IA</div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {DIFF_INFO.find(d => d.id === diffSel)?.desc}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DIFF_INFO.map(d => {
                const active = diffSel === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDiffSel(d.id)}
                    className={`btn-hud p-3 flex flex-col items-start gap-1 ${active ? "is-selected" : ""}`}
                    style={active ? { borderColor: d.color, boxShadow: `inset 0 0 0 1px ${d.color}, 0 0 14px ${d.color}` } : undefined}
                  >
                    <span className="stencil text-sm uppercase tracking-widest" style={{ color: d.color }}>{d.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-2">
          <button className="btn-hud flex-1 py-4 text-sm" onClick={onBack}>Cancelar</button>
          <button
            className="btn-hud is-selected flex-[2] py-4 stencil text-lg tracking-widest"
            onClick={handleStart}
            style={{ borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent), 0 0 24px var(--accent)" }}
          >
            Iniciar Partida ▸
          </button>
        </div>
      </div>
    </div>
  );
}
