import { supabase } from "@/integrations/supabase/client";
import { ensureAnonSession } from "./anonAuth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
function genCode(len = 5) {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

export interface MatchRow {
  id: string;
  code: string;
  host_id: string;
  seed: number;
  scenario: string;
  difficulty: string;
  status: "lobby" | "playing" | "ended";
  turn_slot: number;
  max_players: number;
  started_at: string | null;
  ended_at: string | null;
}

export interface MatchPlayerRow {
  id: string;
  match_id: string;
  user_id: string;
  slot: number;
  nickname: string;
  char_id: string;
  ready: boolean;
  hp: number;
  connected: boolean;
}

export async function createMatch(opts: { nickname: string; charId: string; scenario: string; difficulty: string; maxPlayers?: number; matchDuration?: number }) {
  const s = await ensureAnonSession();
  if (!s) throw new Error("Sem sessão — recarregue a página e tente novamente");

  // Revalida uid diretamente do servidor para evitar cache stale logo após signup anônimo.
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const uid = userData?.user?.id ?? s.userId;
  if (userErr) console.warn("[createMatch] getUser warn:", userErr);
  if (!uid) throw new Error("Sessão inválida");

  const seed = Math.floor(Math.random() * 0x7fffffff);
  const maxPlayers = opts.maxPlayers ?? 4;

  // try a few codes on collision
  let code = "";
  let match: MatchRow | null = null;
  let lastError: unknown = null;
  for (let i = 0; i < 5; i++) {
    code = genCode();
    const { data, error } = await supabase.from("matches").insert({
      code, host_id: uid, seed, scenario: opts.scenario, difficulty: opts.difficulty, max_players: maxPlayers,
    }).select().single();
    if (!error && data) { match = data as MatchRow; break; }
    lastError = error;
    if (error) {
      const msg = `${error.message}`.toLowerCase();
      const isDup = msg.includes("duplicate") || error.code === "23505";
      if (!isDup) {
        console.error("[createMatch] insert matches falhou:", error);
        throw new Error(`Falha ao criar sala: ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
      }
    }
  }
  if (!match) {
    console.error("[createMatch] esgotou tentativas de código:", lastError);
    throw new Error("Não foi possível gerar código único");
  }

  // Persist chosen duration client-side (schema não tem coluna dedicada).
  if (typeof sessionStorage !== "undefined" && opts.matchDuration !== undefined) {
    try { sessionStorage.setItem(`wardogs.dur.${match.code}`, String(opts.matchDuration)); } catch { /* ignore */ }
  }

  const { error: pErr } = await supabase.from("match_players").insert({
    match_id: match.id, user_id: uid, slot: 0, nickname: opts.nickname, char_id: opts.charId,
  });
  if (pErr) {
    console.error("[createMatch] insert match_players falhou, revertendo sala:", pErr);
    await supabase.from("matches").delete().eq("id", match.id);
    throw new Error(`Falha ao registrar jogador: ${pErr.message}${pErr.hint ? ` (${pErr.hint})` : ""}`);
  }

  return match;
}

export function getStoredMatchDuration(code: string): number | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  try {
    const v = sessionStorage.getItem(`wardogs.dur.${code}`);
    return v === null ? undefined : Math.max(0, parseInt(v, 10));
  } catch { return undefined; }
}


export async function joinMatchByCode(code: string, nickname: string, charId: string) {
  await ensureAnonSession();
  const { data, error } = await supabase.rpc("join_match_by_code", { _code: code.trim().toUpperCase(), _nickname: nickname, _char_id: charId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { matchId: row.match_id as string, slot: row.slot as number };
}

export async function fetchMatch(matchId: string) {
  const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
  if (error) throw error;
  return data as MatchRow | null;
}

export async function fetchMatchByCode(code: string) {
  const { data, error } = await supabase.from("matches").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data as MatchRow | null;
}

export async function fetchPlayers(matchId: string) {
  const { data, error } = await supabase.from("match_players").select("*").eq("match_id", matchId).order("slot");
  if (error) throw error;
  return (data ?? []) as MatchPlayerRow[];
}

export async function updateSelfPlayer(matchId: string, patch: Partial<Pick<MatchPlayerRow, "ready" | "char_id" | "nickname" | "connected" | "hp">>) {
  const s = await ensureAnonSession();
  if (!s) throw new Error("Sem sessão");
  const { error } = await supabase.from("match_players").update(patch).eq("match_id", matchId).eq("user_id", s.userId);
  if (error) throw error;
}

export async function updateMatch(matchId: string, patch: Partial<Pick<MatchRow, "status" | "turn_slot" | "scenario" | "difficulty" | "started_at" | "ended_at">>) {
  const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
  if (error) throw error;
}

export async function leaveMatch(matchId: string) {
  const s = await ensureAnonSession();
  if (!s) return;
  await supabase.from("match_players").delete().eq("match_id", matchId).eq("user_id", s.userId);
}
