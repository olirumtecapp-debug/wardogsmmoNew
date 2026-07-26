import { useEffect, useState, type ReactNode } from "react";
import { useScenario, type Difficulty } from "@/game/scenarioContext";
import type { GameMode } from "@/game/types";
import type { ScenarioId } from "@/game/scenarios";
import { CHARACTER_LIST, CHARACTERS, type CharacterId } from "@/game/characters";
import { CharacterInfoPopover } from "@/components/CharacterInfoPopover";
import { characterUnlockHint, isCharacterUnlocked } from "@/lib/unlocks";

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

function CharCard({
  charId,
  active,
  onSelect,
  locked,
  lockHint,
}: {
  charId: CharacterId;
  active: boolean;
  onSelect: () => void;
  locked?: boolean;
  lockHint?: string;
}) {
  const c = CHARACTERS[charId];
  const color = c.skin.teamColor;
  return (
    <CharacterInfoPopover charId={charId}>
      <button
        onClick={() => { if (!locked) onSelect(); }}
        disabled={locked}
        className={`btn-hud p-1.5 flex flex-col gap-1 items-center text-center w-full relative ${active ? "is-selected" : ""} ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
        style={active ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88` } : undefined}
        title={locked ? lockHint : `${c.name} — ${c.tagline}`}
      >
        <div className="relative w-full aspect-square rounded bg-black/40 overflow-hidden" style={{ boxShadow: `0 0 6px ${color}` }}>
          <img
            src={c.portraitUrl}
            alt={c.name}
            className={`absolute inset-0 w-full h-full object-contain ${locked ? "grayscale" : ""}`}
            style={{ transform: `scale(${c.sizing.portraitScale})`, transformOrigin: "bottom center" }}
          />
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
              <span className="text-2xl" aria-hidden>🔒</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 justify-center w-full min-w-0">
          <div className="stencil text-[11px] uppercase tracking-widest truncate" style={{ color }}>{c.name}</div>
          {c.tier === "elite" && (
            <span
              className="text-[7px] uppercase tracking-[0.15em] px-1 rounded font-bold shrink-0"
              style={{ color: "#0b0f16", background: color }}
            >
              E
            </span>
          )}
        </div>
      </button>
    </CharacterInfoPopover>
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
      <div className="min-h-dvh flex flex-col p-3 sm:p-4 gap-3 max-w-3xl mx-auto w-full">
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
              thumb={<img src={c1.portraitUrl} alt={c1.name} className="w-full h-full object-contain" style={{ transform: `scale(${c1.sizing.portraitScale})`, transformOrigin: "bottom center" }} />}
              onClick={() => setPicker("p1")}
            />

            <SummaryCard
              label={mode === "ai" ? "IA (Jogador 2)" : "Jogador 2"}
              title={c2.name}
              subtitle={`${c2.breed} — ${c2.tagline}`}
              color={c2.skin.teamColor}
              thumb={<img src={c2.portraitUrl} alt={c2.name} className="w-full h-full object-contain" style={{ transform: `scale(${c2.sizing.portraitScale})`, transformOrigin: "bottom center" }} />}
              onClick={() => setPicker("p2")}
            />
          </div>
        </div>

        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Duração da partida</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {DURATION_OPTIONS.map(o => {
              const active = duration === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setDuration(o.value)}
                  className={`btn-hud px-2 py-1.5 text-left ${active ? "is-selected" : ""}`}
                  style={active ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent), 0 0 10px var(--accent)" } : undefined}
                >
                  <div className="stencil text-[12px] tracking-widest">{o.label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">{o.desc}</div>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5">
            Quando o tempo zera, vence quem tiver mais HP.
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
          <p className="text-[10px] text-muted-foreground mb-2">
            Personagens de elite (Corso, Miu) são desbloqueados concluindo missões da Campanha.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {CHARACTER_LIST.map(c => {
              const locked = !isCharacterUnlocked(c.id);
              return (
                <CharCard
                  key={`p1-${c.id}`}
                  charId={c.id}
                  active={p1 === c.id}
                  locked={locked}
                  lockHint={characterUnlockHint(c.id)}
                  onSelect={() => { setP1(c.id); close(); }}
                />
              );
            })}
          </div>
        </PickerModal>
      )}

      {picker === "p2" && (
        <PickerModal title={mode === "ai" ? "Escolher IA" : "Escolher Jogador 2"} onClose={close}>
          <p className="text-[10px] text-muted-foreground mb-2">
            Personagens de elite (Corso, Miu) são desbloqueados concluindo missões da Campanha.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {CHARACTER_LIST.map(c => {
              const locked = !isCharacterUnlocked(c.id);
              return (
                <CharCard
                  key={`p2-${c.id}`}
                  charId={c.id}
                  active={p2 === c.id}
                  locked={locked}
                  lockHint={characterUnlockHint(c.id)}
                  onSelect={() => { setP2(c.id); close(); }}
                />
              );
            })}
          </div>
        </PickerModal>
      )}
    </div>
  );
}
