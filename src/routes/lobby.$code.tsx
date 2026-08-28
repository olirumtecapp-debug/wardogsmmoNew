import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureAnonSession } from "@/lib/anonAuth";
import {
  fetchMatchByCode, fetchPlayers, updateSelfPlayer, updateMatch, leaveMatch,
  type MatchRow, type MatchPlayerRow,
} from "@/lib/matchApi";
import { supabase } from "@/integrations/supabase/client";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { SCENARIOS } from "@/game/scenarios";
import { ArrowLeft, Copy, Check, LogOut, Loader2, Play } from "lucide-react";

export const Route = createFileRoute("/lobby/$code")({
  component: Lobby,
  head: () => ({
    meta: [
      { title: "WarDogs — Sala de espera" },
      { name: "description", content: "Sala de espera do multiplayer WarDogs. Escolha seu personagem, marque pronto e aguarde o anfitrião iniciar." },
      { property: "og:title", content: "WarDogs — Sala de espera" },
      { property: "og:description", content: "Sala de espera do multiplayer WarDogs. Escolha seu personagem, marque pronto e aguarde o anfitrião iniciar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const CHAR_IDS: CharacterId[] = ["ranger", "brutus", "musa", "ozzy", "negao", "miu", "barto"];

function Lobby() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [players, setPlayers] = useState<MatchPlayerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigatedRef = useRef(false);

  // Init: get session, fetch match & players
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await ensureAnonSession();
      if (!s) { setError("Sem sessão"); return; }
      if (cancelled) return;
      setUserId(s.userId);
      const m = await fetchMatchByCode(code);
      if (cancelled) return;
      if (!m) { setError("Sala não encontrada"); return; }
      setMatch(m);
      const ps = await fetchPlayers(m.id);
      if (cancelled) return;
      setPlayers(ps);
      const iAmIn = ps.some(p => p.user_id === s.userId);
      if (!iAmIn) {
        setError("Você não está nesta sala. Volte e entre pelo código.");
      }
    })().catch(e => setError(e instanceof Error ? e.message : "Erro"));
    return () => { cancelled = true; };
  }, [code]);

  // Realtime subscriptions & polling fallback
  useEffect(() => {
    if (!match) return;
    const ch = supabase.channel(`lobby:${match.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${match.id}` }, async () => {
        const ps = await fetchPlayers(match.id);
        setPlayers(ps);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${match.id}` }, async () => {
        const next = await fetchMatchByCode(code);
        if (next) {
          setMatch(next);
          const ps = await fetchPlayers(next.id);
          setPlayers(ps);
          if (next.status === "playing" && !navigatedRef.current) {
            navigatedRef.current = true;
            navigate({ to: "/match/$code", params: { code: next.code } });
          }
        }
      })
      .subscribe();

    // Polling fallback every 1.5s
    const timer = setInterval(async () => {
      const next = await fetchMatchByCode(code);
      if (next) {
        setMatch(next);
        const ps = await fetchPlayers(next.id);
        setPlayers(ps);
        if (next.status === "playing" && !navigatedRef.current) {
          navigatedRef.current = true;
          navigate({ to: "/match/$code", params: { code: next.code } });
        }
      }
    }, 1500);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(timer);
    };
  }, [match, navigate, code]);

  // Mark me as connected on mount, disconnected on unmount
  useEffect(() => {
    if (!match) return;
    updateSelfPlayer(match.id, { connected: true }).catch(() => {});
    const onUnload = () => { updateSelfPlayer(match.id, { connected: false }).catch(() => {}); };
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("beforeunload", onUnload); };
  }, [match]);

  const me = useMemo(() => players.find(p => p.user_id === userId) ?? null, [players, userId]);
  const isHost = Boolean(me && me.slot === 0 && match && (match.host_id === userId || match.host_id === me.user_id));
  const readyCount = players.filter(p => p.ready).length;
  const canStart = isHost && players.length >= 2 && readyCount === players.length;

  const onToggleReady = async () => {
    if (!match || !me) return;
    await updateSelfPlayer(match.id, { ready: !me.ready });
  };
  const onPickChar = async (charId: CharacterId) => {
    if (!match || !me) return;
    await updateSelfPlayer(match.id, { char_id: charId });
  };
  const onLeave = async () => {
    if (!match) return;
    await leaveMatch(match.id);
    navigate({ to: "/online" });
  };
  const onStart = async () => {
    if (!match || !isHost) return;
    setStarting(true);
    try {
      await updateMatch(match.id, { status: "playing", started_at: new Date().toISOString(), turn_slot: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar");
      setStarting(false);
    }
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const scenario = match ? SCENARIOS.find(s => s.id === match.scenario) : null;

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <div className="panel p-4 max-w-md text-center space-y-3">
          <div className="stencil text-warn text-sm uppercase">Sala indisponível</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/online" className="btn-hud inline-flex items-center gap-1"><ArrowLeft size={14} /> Voltar</Link>
        </div>
      </div>
    );
  }

  if (!match || !me) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slots = Array.from({ length: match.max_players }, (_, i) => players.find(p => p.slot === i) ?? null);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="p-3 sm:p-4 flex items-center gap-3 flex-wrap">
        <button onClick={onLeave} className="btn-hud text-xs inline-flex items-center gap-1"><LogOut size={14} /> Sair</button>
        <div className="stencil uppercase tracking-[0.3em] text-sm">Sala de espera</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="panel px-3 py-1.5 font-mono text-xl tracking-[0.4em] uppercase">{code}</div>
          <button onClick={copyCode} className="btn-hud text-xs inline-flex items-center gap-1">
            {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Código</>}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-6 max-w-3xl mx-auto w-full space-y-4">
        {scenario && (
          <div className="panel p-3 text-xs flex items-center justify-between">
            <div><span className="text-muted-foreground uppercase tracking-widest text-[10px]">Cenário: </span><span className="stencil">{scenario.label}</span></div>
            <div className="text-muted-foreground">{scenario.description}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((p, i) => (
            <div key={i} className={`panel p-3 ${p ? "" : "opacity-60 border-dashed"}`}>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Slot {i + 1}</span>
                {p && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${p.ready ? "bg-[color:var(--team-green)] text-black" : "bg-secondary"}`}>
                    {p.ready ? "PRONTO" : "AJUSTANDO"}
                  </span>
                )}
              </div>
              {p ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-14 h-14 rounded bg-secondary/60 border border-border/60 overflow-hidden flex items-center justify-center">
                    <img
                      src={CHARACTERS[(p.char_id as CharacterId) ?? "ranger"]?.portraitUrl}
                      alt={CHARACTERS[(p.char_id as CharacterId) ?? "ranger"]?.name ?? p.char_id}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.nickname}{p.user_id === userId ? " (você)" : ""}{p.user_id === match.host_id ? " ⚑" : ""}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{CHARACTERS[(p.char_id as CharacterId) ?? "ranger"]?.name ?? p.char_id}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-muted-foreground italic">Vaga aberta</div>
              )}
            </div>
          ))}
        </div>


        <section className="panel p-3 space-y-2">
          <div className="stencil text-xs uppercase tracking-widest text-muted-foreground">Seu personagem</div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {CHAR_IDS.map(id => {
              const c = CHARACTERS[id];
              const active = me.char_id === id;
              return (
                <button
                  key={id}
                  onClick={() => onPickChar(id)}
                  className={`btn-hud p-1.5 flex flex-col items-center gap-1 ${active ? "is-selected" : ""}`}
                  title={c.name}
                >
                  <div className="w-full aspect-square rounded bg-secondary/60 border border-border/50 overflow-hidden flex items-center justify-center">
                    <img src={c.portraitUrl} alt={c.name} className="w-full h-full object-contain" draggable={false} />
                  </div>
                  <div className="text-[10px] stencil uppercase tracking-wider truncate w-full text-center">{c.name}</div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={onToggleReady} className={`btn-hud text-xs px-3 py-1.5 ${me.ready ? "btn-primary" : ""}`}>
              {me.ready ? "Cancelar pronto" : "Marcar pronto"}
            </button>
            {isHost && (
              <button onClick={onStart} disabled={!canStart || starting}
                className="btn-hud btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1">
                {starting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                Iniciar partida
              </button>
            )}
          </div>
          {!canStart && isHost && (
            <div className="text-[10px] text-muted-foreground">
              {players.length < 2 ? "Aguardando pelo menos 2 jogadores." : "Aguardando todos ficarem prontos."}
            </div>
          )}
        </section>

        <div className="text-[10px] text-muted-foreground text-center">
          Compartilhe o código <span className="font-mono tracking-widest">{code}</span> para outros entrarem.
        </div>
      </main>
      <button
        onClick={() => router.invalidate()}
        className="sr-only"
        aria-hidden
      />
    </div>
  );
}
