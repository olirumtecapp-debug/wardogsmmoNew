import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureAnonSession } from "@/lib/anonAuth";
import { fetchMatchByCode, fetchPlayers, type MatchRow, type MatchPlayerRow } from "@/lib/matchApi";
import { supabase } from "@/integrations/supabase/client";
import { OnlineMatch } from "@/components/OnlineMatch";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/match/$code")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "WarDogs — Combate online" },
      { name: "description", content: "Combate multiplayer online em curso — WarDogs." },
    ],
  }),
});

function MatchPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [players, setPlayers] = useState<MatchPlayerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    })().catch(e => setError(e instanceof Error ? e.message : "Erro"));
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (!match) return;
    const ch = supabase.channel(`match-meta:${match.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` }, (payload) => {
        setMatch(payload.new as MatchRow);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_players", filter: `match_id=eq.${match.id}` }, async () => {
        const ps = await fetchPlayers(match.id);
        setPlayers(ps);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [match]);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <div className="panel p-4 max-w-md text-center space-y-3">
          <div className="stencil text-warn text-sm">Erro</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/" className="btn-hud inline-flex items-center gap-1"><ArrowLeft size={14} /> Base</Link>
        </div>
      </div>
    );
  }

  if (!match || !userId || players.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (match.status !== "playing" && match.status !== "ended") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <div className="panel p-4 max-w-md text-center space-y-3">
          <div className="stencil text-sm uppercase">Aguardando início</div>
          <Link to="/lobby/$code" params={{ code }} className="btn-hud">Voltar ao lobby</Link>
        </div>
      </div>
    );
  }

  return (
    <OnlineMatch
      match={match}
      players={players}
      myUserId={userId}
      onExit={() => navigate({ to: "/" })}
    />
  );
}
