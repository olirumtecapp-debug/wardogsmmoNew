import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import {
  getMission,
  nextMission,
  loadProgress,
  awardStars,
  setLastCharacter,
  computeStars,
  type Mission,
} from "@/game/campaign";
import { setActiveScenario, SCENARIOS } from "@/game/scenarios";
import { _setAIDifficulty } from "@/game/scenarioContext";
import { CHARACTER_LIST, CHARACTERS, type CharacterId } from "@/game/characters";
import { ComicIntro, shouldSkipIntro } from "@/components/ComicIntro";
import keyArtAsset from "@/assets/wardogs-keyart-menu.png.asset.json";

export const Route = createFileRoute("/campaign/$missionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Missão — WarDogs` },
      { name: "description", content: `Briefing da missão ${params.missionId} da campanha WarDogs.` },
      { property: "og:title", content: `Missão ${params.missionId} — WarDogs` },
      { property: "og:description", content: "Missão da campanha WarDogs." },
    ],
  }),
  component: MissionPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Missão não encontrada. <Link to="/campaign" className="btn-hud ml-2 text-xs px-2 py-1">Voltar</Link>
    </div>
  ),
});

type Stage = "briefing" | "intro" | "playing" | "result";

function MissionPage() {
  const { missionId } = Route.useParams();
  const navigate = useNavigate();
  const mission = getMission(missionId);

  if (!mission) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Missão não encontrada.
        <Link to="/campaign" className="btn-hud ml-2 text-xs px-2 py-1">Voltar</Link>
      </div>
    );
  }

  const progress = loadProgress();
  const [player, setPlayer] = useState<CharacterId>(
    progress.lastCharacter ?? mission.suggestedPlayer,
  );
  const [duration, setDuration] = useState<number>(300);
  const [stage, setStage] = useState<Stage>("briefing");
  const [result, setResult] = useState<{ won: boolean; stars: number } | null>(null);


  useEffect(() => {
    setActiveScenario(mission.scenario);
    _setAIDifficulty(mission.difficulty);
  }, [mission.scenario, mission.difficulty]);

  const scenario = useMemo(() => SCENARIOS.find(s => s.id === mission.scenario)!, [mission.scenario]);

  if (stage === "playing") {
    return (
      <OrientationGate>
        <div className="fixed inset-0">
          <WarDogsGame
            mode="ai"
            chars={[player, mission.enemy]}
            missionConfig={mission.modifiers}
            matchDuration={duration}
            rageEnabled
            onExit={() => navigate({ to: "/campaign" })}
            onGameOver={({ winner, playerHpPct }) => {
              const won = winner === 0;
              const stars = computeStars(playerHpPct, won);
              if (won) awardStars(mission.id, stars);
              setResult({ won, stars });
              setStage("result");
            }}
          />

        </div>
      </OrientationGate>
    );
  }

  if (stage === "intro") {
    return (
      <ComicIntro
        chars={[player, mission.enemy]}
        scenarioLabel={scenario.label}
        bgImage={scenario.bgImage}
        onDone={() => setStage("playing")}
      />
    );

  if (stage === "result" && result) {
    return <ResultScreen mission={mission} result={result} onRetry={() => {
      setResult(null);
      setStage("playing");
    }} />;
  }

  // Briefing
  return (
    <OrientationGate soft>
      <div className="relative min-h-screen overflow-auto">
        <div
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: `url(${scenario.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#0b0f16",
          }}
          aria-hidden
        />
        <div className="fixed inset-0 -z-10 bg-black/70" aria-hidden />

        <div className="max-w-3xl mx-auto p-3 sm:p-5 flex flex-col gap-3">
          <header className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Missão {mission.bonus ? "Bônus" : mission.index}
              </div>
              <div className="stencil text-xl sm:text-2xl tracking-widest">{mission.name}</div>
            </div>
            <Link to="/campaign" className="btn-hud text-[11px] px-2 py-1">← Campanha</Link>
          </header>

          <div className="panel p-3 sm:p-4 card-in">
            <div className="text-sm leading-relaxed">{mission.brief}</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] uppercase tracking-widest">
              <Chip label="Cenário" value={scenario.label} />
              <Chip label="Dificuldade" value={mission.difficulty === "recruit" ? "Recruta" : mission.difficulty === "sergeant" ? "Sargento" : "General"} />
              <Chip label="Inimigo" value={CHARACTERS[mission.enemy].name} />
              <Chip label="Modificador" value={modifierLabel(mission)} />
            </div>
          </div>

          <div className="panel p-3 sm:p-4">
            <div className="stencil text-xs uppercase tracking-[0.25em] text-[color:var(--accent)] mb-2">
              Escolher operador
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHARACTER_LIST.map(c => {
                const active = c.id === player;
                const color = c.skin.teamColor;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setPlayer(c.id); setLastCharacter(c.id); }}
                    className={`btn-hud p-2 flex flex-col gap-1 items-center text-center ${active ? "is-selected" : ""}`}
                    style={active ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88` } : undefined}
                  >
                    <img src={c.portraitUrl} alt={c.name} className="w-14 h-14 object-contain" style={{ filter: active ? `drop-shadow(0 0 6px ${color})` : undefined }} />
                    <div className="stencil text-[11px] tracking-widest" style={{ color: active ? color : undefined }}>
                      {c.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate w-full">{c.breed}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Duração da missão</div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { v: 180, l: "3 min" },
                { v: 300, l: "5 min" },
                { v: 480, l: "8 min" },
                { v: 0,   l: "∞" },
              ].map(o => (
                <button key={o.v} onClick={() => setDuration(o.v)}
                  className={`btn-hud text-[11px] px-2 py-1.5 ${duration === o.v ? "is-selected" : ""}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Encha a barra ⚡ FÚRIA acertando tiros diretos para liberar um turno com +40% dano.
            </div>
          </div>


          <div className="flex gap-2">
            <Link to="/campaign" className="btn-hud flex-1 py-3 text-center text-[12px]">Cancelar</Link>
            <button
              className="btn-hud is-selected flex-[2] py-3 stencil text-base tracking-widest"
              style={{ borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent), 0 0 20px var(--accent)" }}
              onClick={() => setStage(shouldSkipIntro() ? "playing" : "intro")}
            >
              Iniciar Missão ▸
            </button>
          </div>
        </div>
      </div>
    </OrientationGate>
  );
}

function modifierLabel(m: Mission): string {
  const mods = m.modifiers;
  if (!mods) return "Padrão";
  const parts: string[] = [];
  if (mods.enemyHpBonus) parts.push(`+${mods.enemyHpBonus} HP inimigo`);
  if (mods.windMultiplier && mods.windMultiplier !== 1) parts.push(`Vento ${mods.windMultiplier}×`);
  if (mods.allowedWeapons) parts.push(`Arsenal ${mods.allowedWeapons.length} armas`);
  return parts.join(" · ") || "Padrão";
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-2 py-1.5 leading-tight">
      <div className="text-[8px] text-muted-foreground">{label}</div>
      <div className="text-[11px] tracking-wider truncate normal-case">{value}</div>
    </div>
  );
}

function ResultScreen({
  mission, result, onRetry,
}: {
  mission: Mission;
  result: { won: boolean; stars: number };
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const next = nextMission(mission.id);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="panel p-6 sm:p-8 text-center max-w-sm w-full">
        <div className="stencil text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {result.won ? "Missão cumprida" : "Missão falhou"}
        </div>
        <h2 className="stencil text-3xl mt-2" style={{ color: result.won ? "var(--warn)" : "var(--team-red)" }}>
          {mission.name}
        </h2>

        <div className="flex gap-2 justify-center mt-4">
          {[1, 2, 3].map(i => (
            <Star
              key={i}
              size={38}
              className={i <= result.stars ? "fill-[color:var(--warn)] text-[color:var(--warn)] drop-shadow-[0_0_10px_rgba(255,180,80,0.7)]" : "text-muted-foreground/30"}
            />
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest">
          {result.won
            ? result.stars === 3 ? "Sem arranhões" : result.stars === 2 ? "Pouca vida restante" : "Vitória apertada"
            : "Tente de novo, soldado"}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button className="btn-hud flex-1 py-2" onClick={onRetry}>
            Tentar de novo
          </button>
          <button className="btn-hud flex-1 py-2" onClick={() => navigate({ to: "/campaign" })}>
            Mapa
          </button>
          {result.won && next && (
            <button
              className="btn-hud flex-1 py-2 is-selected"
              style={{ borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent), 0 0 14px var(--accent)" }}
              onClick={() => navigate({ to: "/campaign/$missionId", params: { missionId: next.id } })}
            >
              Próxima ▸
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
