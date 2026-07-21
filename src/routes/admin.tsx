import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CHARACTER_LIST, type CharacterId } from "@/game/characters";
import { MISSIONS, awardStars, loadProgress, saveProgress } from "@/game/campaign";
import { loadUnlocks, saveUnlocks, setAdminOverride, unlockCharacter } from "@/lib/unlocks";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "WarDogs · Painel do Desenvolvedor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const SESSION_KEY = "wardogs.admin.session";
const ADMIN_USER = "olirumdev";
const ADMIN_PASS = "16Bl33@p";

function AdminPage() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      setAuthed(true);
      setError(null);
    } else {
      setError("Credenciais inválidas.");
    }
  };

  const onLogout = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setAuthed(false);
    setUser("");
    setPass("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6">
        <form onSubmit={onLogin} className="panel p-6 w-full max-w-sm flex flex-col gap-3">
          <div className="stencil text-xl tracking-widest text-center" style={{ color: "var(--accent)" }}>
            PAINEL DEV
          </div>
          <p className="text-xs text-muted-foreground text-center">Acesso restrito ao criador do jogo.</p>
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Usuário
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              autoComplete="username"
              className="w-full mt-1 px-3 py-2 rounded bg-black/40 border border-white/10 text-sm outline-none focus:border-[color:var(--accent)]"
            />
          </label>
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Senha
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoComplete="current-password"
              className="w-full mt-1 px-3 py-2 rounded bg-black/40 border border-white/10 text-sm outline-none focus:border-[color:var(--accent)]"
            />
          </label>
          {error && <div className="text-xs text-[color:var(--destructive)]">{error}</div>}
          <button className="btn-hud is-selected py-2 stencil tracking-widest">Entrar</button>
          <Link to="/" className="text-[11px] text-center text-muted-foreground hover:text-white">← Voltar ao menu</Link>
        </form>
      </div>
    );
  }

  const unlocks = loadUnlocks();
  const progress = loadProgress();
  void tick;

  return (
    <div className="min-h-screen bg-[#050810] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">WarDogs</div>
            <div className="stencil text-2xl tracking-widest" style={{ color: "var(--accent)" }}>PAINEL DEV</div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="btn-hud text-xs px-3 py-1.5">Menu</Link>
            <button onClick={onLogout} className="btn-hud text-xs px-3 py-1.5">Sair</button>
          </div>
        </header>

        <section className="panel p-4">
          <h2 className="stencil text-sm tracking-widest mb-3" style={{ color: "var(--accent)" }}>DESBLOQUEIOS GLOBAIS</h2>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!unlocks.adminOverride}
              onChange={e => { setAdminOverride(e.target.checked); refresh(); }}
              className="w-4 h-4"
            />
            <span>Liberar todos os personagens e conteúdos (override)</span>
          </label>
          <p className="text-[11px] text-muted-foreground mt-2">
            Quando ativado, ignora regras de progressão e libera Corso, Miu e futuros elites.
          </p>
        </section>

        <section className="panel p-4">
          <h2 className="stencil text-sm tracking-widest mb-3" style={{ color: "var(--accent)" }}>PERSONAGENS</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHARACTER_LIST.map(c => {
              const forced = unlocks.characters.includes(c.id);
              return (
                <div key={c.id} className="panel p-2 flex items-center gap-2">
                  <img src={c.portraitUrl} alt={c.name} className="w-12 h-12 object-contain rounded bg-black/40" />
                  <div className="min-w-0 flex-1">
                    <div className="stencil text-xs tracking-widest truncate" style={{ color: c.skin.teamColor }}>
                      {c.name} {c.tier === "elite" && "★"}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.breed}</div>
                  </div>
                  {c.tier === "elite" && (
                    <button
                      onClick={() => {
                        if (forced) {
                          const s = loadUnlocks();
                          s.characters = s.characters.filter(x => x !== c.id);
                          saveUnlocks(s);
                        } else {
                          unlockCharacter(c.id as CharacterId);
                        }
                        refresh();
                      }}
                      className={`btn-hud text-[10px] px-2 py-1 ${forced ? "is-selected" : ""}`}
                    >
                      {forced ? "Liberado" : "Liberar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="stencil text-sm tracking-widest" style={{ color: "var(--accent)" }}>CAMPANHA</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { MISSIONS.forEach(m => awardStars(m.id, 3)); refresh(); }}
                className="btn-hud text-[10px] px-2 py-1"
              >
                3★ em tudo
              </button>
              <button
                onClick={() => { saveProgress({ stars: {} }); refresh(); }}
                className="btn-hud text-[10px] px-2 py-1"
              >
                Zerar progresso
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-auto pr-1">
            {MISSIONS.map(m => {
              const stars = progress.stars[m.id] ?? 0;
              return (
                <div key={m.id} className="panel p-2 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] stencil tracking-widest truncate">{m.index}. {m.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.scenario} · {m.difficulty}{m.bonus ? " · bônus" : ""}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => { awardStars(m.id, n); refresh(); }}
                        className={`w-6 h-6 rounded text-xs ${stars >= n ? "text-yellow-300" : "text-muted-foreground/50 hover:text-white"}`}
                        title={`Conceder ${n} estrela${n > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="stencil text-sm tracking-widest mb-3" style={{ color: "var(--accent)" }}>ATALHOS DE TESTE</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className="btn-hud text-xs px-3 py-2">Menu principal</Link>
            <Link to="/campaign" className="btn-hud text-xs px-3 py-2">Campanha</Link>
            <Link to="/online" className="btn-hud text-xs px-3 py-2">Online</Link>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Dica: durante uma partida, a barra do <b>Bombardeio Canino</b> pode ser carregada acertando o inimigo. No modo Campanha, a barra vermelha da <b>Fúria</b> também é habilitada.
          </p>
        </section>
      </div>
    </div>
  );
}
