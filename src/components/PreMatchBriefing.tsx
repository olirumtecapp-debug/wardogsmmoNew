import { useEffect, useState, type ReactNode } from "react";
import { useScenario, type Difficulty } from "@/game/scenarioContext";
import type { GameMode } from "@/game/types";
import type { ScenarioId } from "@/game/scenarios";
import { CHARACTER_LIST, CHARACTERS, characterBars, type CharacterId } from "@/game/characters";

interface Props {
  mode: GameMode;
  onStart: (chars: [CharacterId, CharacterId], matchDuration: number) => void;
  onBack: () => void;
}


type PickerKey = "scenario" | "difficulty" | "p1" | "p2" | null;

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
  onSelect,
}: {
  charId: CharacterId;
  active: boolean;
  onSelect: () => void;
}) {
  const c = CHARACTERS[charId];
  const b = characterBars(charId);
  const color = c.skin.teamColor;
  return (
    <button
      onClick={onSelect}
      className={`btn-hud p-2 flex flex-col gap-1 items-stretch text-left ${active ? "is-selected" : ""}`}
      style={active ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88` } : undefined}
      title={c.tagline}
    >
      <div className="flex items-center gap-2">
        <img
          src={c.portraitUrl}
          alt={c.name}
          className="w-12 h-12 rounded object-contain bg-black/40 shrink-0"
          style={{ boxShadow: `0 0 6px ${color}` }}
        />
        <div className="min-w-0">
          <div className="stencil text-[12px] uppercase tracking-widest truncate" style={{ color }}>{c.name}</div>
          <div className="text-[9px] text-muted-foreground truncate">{c.breed}</div>
        </div>
      </div>
      <div className="text-[9px] text-muted-foreground leading-tight line-clamp-2">{c.tagline}</div>
      <div className="flex flex-col gap-0.5 mt-0.5">
        <StatRow label="HP" value={b.hp} color={color} />
        <StatRow label="MOV" value={b.mob} color={color} />
        <StatRow label="PULO" value={b.jump} color={color} />
        <StatRow label="DEF" value={b.def} color={color} />
      </div>
    </button>
  );
}

function SummaryCard({
  label,
  title,
  subtitle,
  thumb,
  color,
  onClick,
}: {
  label: string;
  title: string;
  subtitle?: string;
  thumb: ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-hud p-2.5 flex items-center gap-3 text-left"
      style={{ borderColor: color, boxShadow: `inset 0 0 0 1px ${color}55, 0 0 10px ${color}33` }}
    >
      <div className="w-14 h-14 rounded overflow-hidden shrink-0 bg-black/40 flex items-center justify-center"
           style={{ boxShadow: `0 0 6px ${color}66` }}>
        {thumb}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <div className="stencil text-[13px] uppercase tracking-widest truncate" style={{ color }}>{title}</div>
        {subtitle && <div className="text-[9px] text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">Trocar ▸</span>
    </button>
  );
}

function PickerModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm card-in"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-3xl max-h-[85vh] overflow-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="stencil text-sm uppercase tracking-widest" style={{ color: "var(--accent)" }}>{title}</div>
          <button className="btn-hud text-[11px] px-2 py-1" onClick={onClose}>✕ Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const DURATION_OPTIONS: { value: number; label: string; desc: string }[] = [
  { value: 180, label: "3 min", desc: "Combate rápido" },
  { value: 300, label: "5 min", desc: "Padrão equilibrado" },
  { value: 480, label: "8 min", desc: "Duelo prolongado" },
  { value: 0,   label: "Sem limite", desc: "Vale o último dog em pé" },
];

export function PreMatchBriefing({ mode, onStart, onBack }: Props) {
  const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
  const [scenarioSel, setScenarioSel] = useState<ScenarioId>(scenario.id);
  const [diffSel, setDiffSel] = useState<Difficulty>(difficulty);
  const [p1, setP1] = useState<CharacterId>("ranger");
  const [p2, setP2] = useState<CharacterId>("brutus");
  const [duration, setDuration] = useState<number>(300);
  const [picker, setPicker] = useState<PickerKey>(null);

  const currentScenario = scenarios.find(s => s.id === scenarioSel) ?? scenarios[0];
  const currentDiff = DIFF_INFO.find(d => d.id === diffSel)!;
  const c1 = CHARACTERS[p1];
  const c2 = CHARACTERS[p2];

  const handleStart = () => {
    setScenario(scenarioSel);
    if (mode === "ai") setDifficulty(diffSel);
    onStart([p1, p2], duration);
  };


  const close = () => setPicker(null);

  return (
    <div className="fixed inset-0 overflow-auto bg-[#0b0f16]">
      <div className="min-h-screen flex flex-col p-3 sm:p-4 gap-3 max-w-3xl mx-auto w-full">
        <header className="flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Briefing</div>
            <div className="stencil text-lg sm:text-xl tracking-widest">
              {mode === "ai" ? "Missão vs IA" : "Duelo Hotseat"}
            </div>
          </div>
          <button className="btn-hud text-[11px] px-2 py-1" onClick={onBack}>← Voltar</button>
        </header>

        <div className="panel p-3 card-in">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Toque em cada item para escolher
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SummaryCard
              label="Cenário"
              title={currentScenario.label}
              subtitle={currentScenario.description}
              color={currentScenario.sky[2]}
              thumb={
                <div className="w-full h-full" style={{
                  backgroundImage: `url(${currentScenario.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }} />
              }
              onClick={() => setPicker("scenario")}
            />

            {mode === "ai" ? (
              <SummaryCard
                label="Dificuldade da IA"
                title={currentDiff.label}
                subtitle={currentDiff.desc}
                color={currentDiff.color}
                thumb={<span className="stencil text-lg" style={{ color: currentDiff.color }}>★</span>}
                onClick={() => setPicker("difficulty")}
              />
            ) : (
              <div className="btn-hud p-2.5 flex items-center gap-3 opacity-60">
                <div className="w-14 h-14 rounded bg-black/40 flex items-center justify-center stencil text-lg">2P</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Modo</div>
                  <div className="stencil text-[13px] uppercase tracking-widest">Hotseat</div>
                  <div className="text-[9px] text-muted-foreground">Dois jogadores, mesmo dispositivo</div>
                </div>
              </div>
            )}

            <SummaryCard
              label="Jogador 1"
              title={c1.name}
              subtitle={`${c1.breed} — ${c1.tagline}`}
              color={c1.skin.teamColor}
              thumb={<img src={c1.portraitUrl} alt={c1.name} className="w-full h-full object-contain" />}
              onClick={() => setPicker("p1")}
            />

            <SummaryCard
              label={mode === "ai" ? "IA (Jogador 2)" : "Jogador 2"}
              title={c2.name}
              subtitle={`${c2.breed} — ${c2.tagline}`}
              color={c2.skin.teamColor}
              thumb={<img src={c2.portraitUrl} alt={c2.name} className="w-full h-full object-contain" />}
              onClick={() => setPicker("p2")}
            />
          </div>
        </div>

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

      {picker === "scenario" && (
        <PickerModal title="Escolher Cenário" onClose={close}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenarios.map(sc => {
              const active = sc.id === scenarioSel;
              return (
                <button
                  key={sc.id}
                  onClick={() => { setScenarioSel(sc.id); close(); }}
                  className={`btn-hud p-2 flex flex-col items-stretch gap-1 text-left ${active ? "is-selected" : ""}`}
                  style={active ? { borderColor: sc.sky[2], boxShadow: `inset 0 0 0 1px ${sc.sky[2]}, 0 0 14px ${sc.sky[2]}88` } : undefined}
                >
                  <span className="w-full h-20 rounded overflow-hidden" style={{
                    backgroundImage: `url(${sc.bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }} />
                  <span className="stencil text-[11px] uppercase tracking-widest">{sc.label}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight line-clamp-2">{sc.description}</span>
                </button>
              );
            })}
          </div>
        </PickerModal>
      )}

      {picker === "difficulty" && (
        <PickerModal title="Escolher Dificuldade" onClose={close}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DIFF_INFO.map(d => {
              const active = d.id === diffSel;
              return (
                <button
                  key={d.id}
                  onClick={() => { setDiffSel(d.id); close(); }}
                  className={`btn-hud p-3 flex flex-col items-start gap-1 text-left ${active ? "is-selected" : ""}`}
                  style={active ? { borderColor: d.color, boxShadow: `inset 0 0 0 1px ${d.color}, 0 0 12px ${d.color}` } : undefined}
                >
                  <span className="stencil text-sm uppercase tracking-widest" style={{ color: d.color }}>{d.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{d.desc}</span>
                </button>
              );
            })}
          </div>
        </PickerModal>
      )}

      {picker === "p1" && (
        <PickerModal title="Escolher Jogador 1" onClose={close}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHARACTER_LIST.map(c => (
              <CharCard key={`p1-${c.id}`} charId={c.id} active={p1 === c.id} onSelect={() => { setP1(c.id); close(); }} />
            ))}
          </div>
        </PickerModal>
      )}

      {picker === "p2" && (
        <PickerModal title={mode === "ai" ? "Escolher IA" : "Escolher Jogador 2"} onClose={close}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHARACTER_LIST.map(c => (
              <CharCard key={`p2-${c.id}`} charId={c.id} active={p2 === c.id} onSelect={() => { setP2(c.id); close(); }} />
            ))}
          </div>
        </PickerModal>
      )}
    </div>
  );
}
