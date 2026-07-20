import { useState } from "react";
import { useScenario, type Difficulty } from "@/game/scenarioContext";
import type { GameMode } from "@/game/types";
import type { ScenarioId } from "@/game/scenarios";
import { CHARACTER_LIST, CHARACTERS, characterBars, type CharacterId } from "@/game/characters";

interface Props {
  mode: GameMode;
  onStart: (chars: [CharacterId, CharacterId]) => void;
  onBack: () => void;
}

const DIFF_INFO: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "recruit", label: "Recruta", desc: "Distraído, erros frequentes", color: "var(--team-green)" },
  { id: "sergeant", label: "Sargento", desc: "Equilibrado, mira decente", color: "var(--accent)" },
  { id: "general", label: "General", desc: "Preciso, aproveita cada abertura", color: "var(--team-red)" },
];

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] uppercase tracking-widest text-muted-foreground w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-black/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function CharCard({
  charId,
  active,
  disabled,
  onSelect,
}: {
  charId: CharacterId;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const c = CHARACTERS[charId];
  const b = characterBars(charId);
  const color = c.skin.teamColor;
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`btn-hud p-2 flex flex-col gap-1 items-stretch text-left ${active ? "is-selected" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      style={active ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88` } : undefined}
      title={c.tagline}
    >
      <div className="flex items-center gap-2">
        <img
          src={c.portraitUrl}
          alt={c.name}
          className="w-10 h-10 rounded object-contain bg-black/40 shrink-0"
          style={{ boxShadow: `0 0 6px ${color}` }}
        />
        <div className="min-w-0">
          <div className="stencil text-[11px] uppercase tracking-widest truncate" style={{ color }}>{c.name}</div>
          <div className="text-[9px] text-muted-foreground truncate">{c.breed}</div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 mt-0.5">
        <StatRow label="HP" value={b.hp} color={color} />
        <StatRow label="MOV" value={b.mob} color={color} />
        <StatRow label="PULO" value={b.jump} color={color} />
        <StatRow label="DEF" value={b.def} color={color} />
      </div>
    </button>
  );
}

export function PreMatchBriefing({ mode, onStart, onBack }: Props) {
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
  const [scenarioSel, setScenarioSel] = useState<ScenarioId>(scenario.id);
  const [diffSel, setDiffSel] = useState<Difficulty>(difficulty);
  const [p1, setP1] = useState<CharacterId>("ranger");
  const [p2, setP2] = useState<CharacterId>("brutus");

  const handleStart = () => {
    setScenario(scenarioSel);
    if (mode === "ai") setDifficulty(diffSel);
    onStart([p1, p2]);
  };

  return (
    <div className="fixed inset-0 overflow-auto bg-[#0b0f16]">
      <div className="min-h-screen flex flex-col p-3 sm:p-4 gap-3 max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Briefing</div>
            <div className="stencil text-lg sm:text-xl tracking-widest">
              {mode === "ai" ? "Missão vs IA" : "Duelo Hotseat"}
            </div>
          </div>
          <button className="btn-hud text-[11px] px-2 py-1" onClick={onBack}>← Voltar</button>
        </header>

        {/* Personagens */}
        <div className="panel p-3 card-in text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="stencil text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Personagens</div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Escolha um cão para cada lado
            </span>
          </div>

          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Jogador 1 <span className="text-[9px] opacity-70">— {CHARACTERS[p1].tagline}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
            {CHARACTER_LIST.map(c => (
              <CharCard key={`p1-${c.id}`} charId={c.id} active={p1 === c.id} onSelect={() => setP1(c.id)} />
            ))}
          </div>

          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "ai" ? "IA (Jogador 2)" : "Jogador 2"} <span className="text-[9px] opacity-70">— {CHARACTERS[p2].tagline}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {CHARACTER_LIST.map(c => (
              <CharCard key={`p2-${c.id}`} charId={c.id} active={p2 === c.id} onSelect={() => setP2(c.id)} />
            ))}
          </div>
        </div>

        {/* Cenário */}
        <div className="panel p-3 card-in text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="stencil text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Cenário</div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {scenarios.find(s => s.id === scenarioSel)?.description}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {scenarios.map(sc => {
              const active = sc.id === scenarioSel;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenarioSel(sc.id)}
                  className={`btn-hud p-1.5 flex flex-col items-center gap-1 ${active ? "is-selected" : ""}`}
                  style={active ? { borderColor: sc.sky[2], boxShadow: `inset 0 0 0 1px ${sc.sky[2]}55, 0 0 14px ${sc.sky[2]}55` } : undefined}
                  title={sc.description}
                >
                  <span
                    className="w-full h-10 rounded overflow-hidden"
                    style={{
                      backgroundImage: `url(${sc.bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  />
                  <span className="stencil text-[9px] uppercase tracking-widest">{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dificuldade */}
        {mode === "ai" && (
          <div className="panel p-3 card-in text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="stencil text-xs uppercase tracking-widest" style={{ color: "var(--team-red)" }}>Dificuldade da IA</div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {DIFF_INFO.find(d => d.id === diffSel)?.desc}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DIFF_INFO.map(d => {
                const active = diffSel === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDiffSel(d.id)}
                    className={`btn-hud p-2 flex flex-col items-start gap-0.5 ${active ? "is-selected" : ""}`}
                    style={active ? { borderColor: d.color, boxShadow: `inset 0 0 0 1px ${d.color}, 0 0 12px ${d.color}` } : undefined}
                  >
                    <span className="stencil text-[11px] uppercase tracking-widest" style={{ color: d.color }}>{d.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-1">
          <button className="btn-hud flex-1 py-3 text-[12px]" onClick={onBack}>Cancelar</button>
          <button
            className="btn-hud is-selected flex-[2] py-3 stencil text-base tracking-widest"
            onClick={handleStart}
            style={{ borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent), 0 0 20px var(--accent)" }}
          >
            Iniciar Partida ▸
          </button>
        </div>
      </div>
    </div>
  );
}
