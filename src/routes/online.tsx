import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureAnonSession, randomNickname } from "@/lib/anonAuth";
import { createMatch, joinMatchByCode } from "@/lib/matchApi";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { SCENARIOS } from "@/game/scenarios";
import { ArrowLeft, Users, KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/online")({
  component: OnlineHome,
  head: () => ({
    meta: [
      { title: "WarDogs — Multiplayer online" },
      { name: "description", content: "Crie uma sala ou entre com código para jogar WarDogs online com até 4 companheiros de pelotão." },
    ],
  }),
});

const CHAR_IDS: CharacterId[] = ["ranger", "brutus", "musa", "ozzy"];

function OnlineHome() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(randomNickname());
  const [charId, setCharId] = useState<CharacterId>("ranger");
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [difficulty] = useState("sergeant");
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { ensureAnonSession(); }, []);

  const onCreate = async () => {
    setError(null); setBusy("create");
    try {
      const m = await createMatch({ nickname, charId, scenario, difficulty, maxPlayers });
      navigate({ to: "/lobby/$code", params: { code: m.code } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar sala");
      setBusy(null);
    }
  };

  const onJoin = async () => {
    setError(null); setBusy("join");
    try {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) throw new Error("Digite o código da sala");
      const { matchId: _mid } = await joinMatchByCode(clean, nickname, charId);
      void _mid;
      navigate({ to: "/lobby/$code", params: { code: clean } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao entrar";
      setError(msg);
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-3 sm:p-4 flex items-center gap-3">
        <Link to="/" className="btn-hud text-xs inline-flex items-center gap-1"><ArrowLeft size={14} /> Base</Link>
        <div className="stencil uppercase tracking-[0.3em] text-sm">Multiplayer online</div>
      </header>

      <main className="flex-1 px-4 pb-6 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <section className="panel p-4 space-y-3">
            <div className="stencil text-xs uppercase tracking-widest text-muted-foreground">Seu operador</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs">
                <span className="block mb-1 text-muted-foreground uppercase tracking-widest text-[10px]">Codinome</span>
                <input value={nickname} onChange={e => setNickname(e.target.value.slice(0, 20))}
                  className="w-full bg-secondary/70 border border-border/60 rounded px-2 py-1.5 text-sm" />
              </label>
              <div className="text-xs">
                <span className="block mb-1 text-muted-foreground uppercase tracking-widest text-[10px]">Personagem</span>
                <div className="flex flex-wrap gap-1">
                  {CHAR_IDS.map(id => (
                    <button key={id} onClick={() => setCharId(id)}
                      className={`btn-hud text-[11px] px-2 py-1 ${charId === id ? "is-selected" : ""}`}>{CHARACTERS[id].name}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="panel p-4 space-y-3">
              <div className="flex items-center gap-2"><Users size={16} /><div className="stencil text-xs uppercase tracking-widest">Criar sala</div></div>
              <div className="text-xs text-muted-foreground">Você é o anfitrião. Compartilhe o código com seus aliados.</div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cenário</div>
                <div className="flex flex-wrap gap-1">
                  {SCENARIOS.map(sc => (
                    <button key={sc.id} onClick={() => setScenario(sc.id)}
                      className={`btn-hud text-[11px] px-2 py-1 ${scenario === sc.id ? "is-selected" : ""}`}>{sc.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Vagas</div>
                <div className="flex gap-1">
                  {[2, 3, 4].map(n => (
                    <button key={n} onClick={() => setMaxPlayers(n as 2 | 3 | 4)}
                      className={`btn-hud text-[11px] px-3 py-1 ${maxPlayers === n ? "is-selected" : ""}`}>{n} jogadores</button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Combate ao vivo hoje: 2 jogadores. 3–4 vagas ficam na sala como aguardando (próxima atualização).
                </div>
              </div>
              <button onClick={onCreate} disabled={busy !== null || !nickname}
                className="btn-hud btn-primary w-full inline-flex items-center justify-center gap-2">
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : null}
                Abrir sala
              </button>
            </div>

            <div className="panel p-4 space-y-3">
              <div className="flex items-center gap-2"><KeyRound size={16} /><div className="stencil text-xs uppercase tracking-widest">Entrar com código</div></div>
              <div className="text-xs text-muted-foreground">Peça o código de 5 letras ao seu anfitrião.</div>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="EX: 7KDXA" maxLength={6}
                className="w-full text-center tracking-[0.3em] font-mono bg-secondary/70 border border-border/60 rounded px-2 py-3 text-xl uppercase" />
              <button onClick={onJoin} disabled={busy !== null || code.length < 4 || !nickname}
                className="btn-hud w-full inline-flex items-center justify-center gap-2">
                {busy === "join" ? <Loader2 size={14} className="animate-spin" /> : null}
                Entrar na sala
              </button>
            </div>
          </section>

          {error && (
            <div className="panel p-3 text-xs text-warn border-warn">Erro: {error}</div>
          )}
        </div>
      </main>
    </div>
  );
}
