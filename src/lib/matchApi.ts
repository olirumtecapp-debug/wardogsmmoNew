import { supabase } from "@/integrations/supabase/client";
import { ensureAnonSession } from "./anonAuth";
import { getDeviceKind, DeviceMismatchError, type DeviceKind } from "./device";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
function genCode(len = 5) {
  let out = "";
  for (let i = 0; i < len; i++)
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
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
  world_w: number;
  world_h: number;
  current_slot: number;
  host_device: DeviceKind | null;
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

interface RoomStatePayload {
  scenario?: string;
  difficulty?: string;
  max_players?: number;
  seed?: number;
  world_w?: number;
  world_h?: number;
  host_device?: DeviceKind | null;
  match_duration?: number;
  turn_slot?: number;
  current_slot?: number;
  started_at?: string | null;
  ended_at?: string | null;
  players?: Array<{
    user_id: string;
    slot: number;
    nickname: string;
    char_id: string;
    ready: boolean;
    hp: number;
    connected: boolean;
  }>;
}

function mapRoomToMatch(room: any): MatchRow {
  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  return {
    id: room.id,
    code: room.code,
    host_id: room.host_id,
    status: room.status as "lobby" | "playing" | "ended",
    seed: st.seed ?? 12345,
    scenario: st.scenario ?? "warzone",
    difficulty: st.difficulty ?? "sergeant",
    max_players: st.max_players ?? 2,
    turn_slot: st.turn_slot ?? 0,
    current_slot: st.current_slot ?? 0,
    world_w: st.world_w ?? 1280,
    world_h: st.world_h ?? 720,
    host_device: (st.host_device as DeviceKind) ?? null,
    started_at: st.started_at ?? null,
    ended_at: st.ended_at ?? null,
  };
}

export async function createMatch(opts: {
  nickname: string;
  charId: string;
  scenario: string;
  difficulty: string;
  maxPlayers?: number;
  matchDuration?: number;
}) {
  const s = await ensureAnonSession();
  const uid = s.userId;

  const seed = Math.floor(Math.random() * 0x7fffffff);
  const maxPlayers = opts.maxPlayers ?? 2;

  let worldW = 1280;
  let worldH = 720;
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse && h > w) {
      worldW = 900;
      worldH = 1400;
    }
  } catch {
    /* ignore SSR */
  }

  const initialPlayer = {
    user_id: uid,
    slot: 0,
    nickname: opts.nickname,
    char_id: opts.charId,
    ready: false,
    hp: 100,
    connected: true,
  };

  const roomState: RoomStatePayload = {
    scenario: opts.scenario,
    difficulty: opts.difficulty,
    max_players: maxPlayers,
    seed,
    world_w: worldW,
    world_h: worldH,
    host_device: getDeviceKind(),
    match_duration: opts.matchDuration ?? 300,
    turn_slot: 0,
    current_slot: 0,
    players: [initialPlayer],
  };

  let room: any = null;
  let lastError: any = null;

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        host_id: uid,
        status: "lobby",
        state: roomState as any,
      })
      .select()
      .single();

    if (!error && data) {
      room = data;
      break;
    }
    lastError = error;
  }

  if (!room) {
    console.error("[createMatch] falha ao criar sala:", lastError);
    throw new Error(
      `Falha ao criar sala: ${lastError?.message || "Não foi possível gerar código único"}`
    );
  }

  // Insere jogador na tabela room_players
  await supabase.from("room_players").insert({
    room_id: room.id,
    user_id: uid,
    seat: 0,
    is_ready: false,
  });

  if (typeof sessionStorage !== "undefined" && opts.matchDuration !== undefined) {
    try {
      sessionStorage.setItem(`wardogs.dur.${room.code}`, String(opts.matchDuration));
    } catch {
      /* ignore */
    }
  }

  return mapRoomToMatch(room);
}

export function getStoredMatchDuration(code: string): number | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  try {
    const v = sessionStorage.getItem(`wardogs.dur.${code}`);
    return v === null ? undefined : Math.max(0, parseInt(v, 10));
  } catch {
    return undefined;
  }
}

export async function joinMatchByCode(code: string, nickname: string, charId: string) {
  const s = await ensureAnonSession();
  const uid = s.userId;
  const cleanCode = code.trim().toUpperCase();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", cleanCode)
    .maybeSingle();

  if (roomErr || !room) {
    throw new Error("Sala não encontrada com este código");
  }

  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  const hostDevice = (st.host_device as DeviceKind) || null;
  if (hostDevice) {
    const local = getDeviceKind();
    if (hostDevice !== local) throw new DeviceMismatchError(hostDevice, local);
  }

  const existingPlayers = st.players || [];
  const myExistingIndex = existingPlayers.findIndex((p) => p.user_id === uid);

  let assignedSlot = 0;
  if (myExistingIndex >= 0) {
    assignedSlot = existingPlayers[myExistingIndex].slot;
    existingPlayers[myExistingIndex] = {
      ...existingPlayers[myExistingIndex],
      nickname,
      char_id: charId,
      connected: true,
    };
  } else {
    const occupiedSlots = new Set(existingPlayers.map((p) => p.slot));
    const maxP = st.max_players ?? 2;
    let freeSlot = -1;
    for (let sIdx = 0; sIdx < maxP; sIdx++) {
      if (!occupiedSlots.has(sIdx)) {
        freeSlot = sIdx;
        break;
      }
    }
    if (freeSlot === -1) {
      throw new Error("A sala já está cheia!");
    }
    assignedSlot = freeSlot;
    existingPlayers.push({
      user_id: uid,
      slot: assignedSlot,
      nickname,
      char_id: charId,
      ready: false,
      hp: 100,
      connected: true,
    });
  }

  // Atualiza estado da sala com a lista de jogadores
  await supabase
    .from("rooms")
    .update({ state: { ...st, players: existingPlayers } as any })
    .eq("id", room.id);

  // Insere ou atualiza em room_players
  await supabase.from("room_players").upsert(
    {
      room_id: room.id,
      user_id: uid,
      seat: assignedSlot,
      is_ready: false,
    },
    { onConflict: "room_id,user_id" }
  );

  return { matchId: room.id as string, slot: assignedSlot };
}

export async function fetchMatch(matchId: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRoomToMatch(data);
}

export async function fetchMatchByCode(code: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  return mapRoomToMatch(data);
}

export async function fetchPlayers(matchId: string): Promise<MatchPlayerRow[]> {
  const { data: room } = await supabase
    .from("rooms")
    .select("state")
    .eq("id", matchId)
    .maybeSingle();

  if (!room) return [];
  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  const pList = st.players || [];

  return pList.map((p) => ({
    id: `${matchId}_${p.user_id}`,
    match_id: matchId,
    user_id: p.user_id,
    slot: p.slot,
    nickname: p.nickname,
    char_id: p.char_id,
    ready: !!p.ready,
    hp: p.hp ?? 100,
    connected: p.connected !== false,
  }));
}

export async function updateSelfPlayer(
  matchId: string,
  patch: Partial<Pick<MatchPlayerRow, "ready" | "char_id" | "nickname" | "connected" | "hp">>
) {
  const s = await ensureAnonSession();
  const uid = s.userId;

  const { data: room } = await supabase
    .from("rooms")
    .select("state")
    .eq("id", matchId)
    .maybeSingle();

  if (!room) return;
  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  const pList = st.players || [];
  const idx = pList.findIndex((p) => p.user_id === uid);

  if (idx >= 0) {
    pList[idx] = {
      ...pList[idx],
      ...(patch.ready !== undefined ? { ready: patch.ready } : {}),
      ...(patch.char_id !== undefined ? { char_id: patch.char_id } : {}),
      ...(patch.nickname !== undefined ? { nickname: patch.nickname } : {}),
      ...(patch.connected !== undefined ? { connected: patch.connected } : {}),
      ...(patch.hp !== undefined ? { hp: patch.hp } : {}),
    };

    await supabase
      .from("rooms")
      .update({ state: { ...st, players: pList } as any })
      .eq("id", matchId);
  }
}

export async function updateMatch(
  matchId: string,
  patch: Partial<
    Pick<
      MatchRow,
      | "status"
      | "turn_slot"
      | "scenario"
      | "difficulty"
      | "started_at"
      | "ended_at"
      | "current_slot"
    >
  >
) {
  const { data: room } = await supabase
    .from("rooms")
    .select("status, state")
    .eq("id", matchId)
    .maybeSingle();

  if (!room) return;
  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  const updatedState: RoomStatePayload = {
    ...st,
    ...(patch.scenario !== undefined ? { scenario: patch.scenario } : {}),
    ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
    ...(patch.turn_slot !== undefined ? { turn_slot: patch.turn_slot } : {}),
    ...(patch.current_slot !== undefined ? { current_slot: patch.current_slot } : {}),
    ...(patch.started_at !== undefined ? { started_at: patch.started_at } : {}),
    ...(patch.ended_at !== undefined ? { ended_at: patch.ended_at } : {}),
  };

  const updateFields: any = {
    state: updatedState as any,
  };
  if (patch.status !== undefined) {
    updateFields.status = patch.status;
  }

  await supabase.from("rooms").update(updateFields).eq("id", matchId);
}

export async function leaveMatch(matchId: string) {
  const s = await ensureAnonSession();
  const uid = s.userId;

  const { data: room } = await supabase
    .from("rooms")
    .select("state")
    .eq("id", matchId)
    .maybeSingle();

  if (!room) return;
  const st: RoomStatePayload = (room.state || {}) as RoomStatePayload;
  const pList = (st.players || []).filter((p) => p.user_id !== uid);

  await supabase
    .from("rooms")
    .update({ state: { ...st, players: pList } as any })
    .eq("id", matchId);

  await supabase
    .from("room_players")
    .delete()
    .eq("room_id", matchId)
    .eq("user_id", uid);
}
