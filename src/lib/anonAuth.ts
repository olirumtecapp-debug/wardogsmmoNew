import { supabase } from "@/integrations/supabase/client";

let pending: Promise<{ userId: string } | null> | null = null;

function getFallbackUserId(): string {
  if (typeof window === "undefined") return "usr_guest_ssr";
  let tabUid = sessionStorage.getItem("wardogs.tab_user_id");
  if (!tabUid) {
    tabUid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("wardogs.tab_user_id", tabUid);
  }
  return tabUid;
}

/**
 * Garante uma sessão de jogador (Supabase Auth anônima ou identificador único persistente local).
 * Retorna sempre um userId válido para não travar o lobby multiplayer.
 */
export async function ensureAnonSession(): Promise<{ userId: string }> {
  if (pending) {
    const res = await pending;
    if (res) return res;
  }
  const p = (async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id) {
        return { userId: session.session.user.id };
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data?.user?.id) {
        return { userId: data.user.id };
      }
    } catch {
      // Ignora erro de rede ou provider anônimo desativado
    }
    return { userId: getFallbackUserId() };
  })();

  pending = p;
  const result = await p;
  return result || { userId: getFallbackUserId() };
}

export function randomNickname(): string {
  const adj = [
    "Alfa", "Bravo", "Cargo", "Delta", "Echo", "Foxtrot", "Ghost", "Hunter",
    "Iron", "Juliet", "Kilo", "Lima", "Mike", "Nova", "Oscar", "Papa",
    "Quebec", "Romeo", "Sierra", "Tango", "Viper", "Whisky", "Xray", "Yankee", "Zulu"
  ];
  const noun = [
    "Dog", "Wolf", "Fang", "Bark", "Bone", "Paw", "Snarl", "Growl",
    "Howl", "K9", "Sarge", "Recon", "Bomber", "Sniper", "Scout"
  ];
  const n = Math.floor(Math.random() * 99);
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${n}`;
}
