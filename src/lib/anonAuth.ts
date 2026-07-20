import { supabase } from "@/integrations/supabase/client";

let pending: Promise<{ userId: string } | null> | null = null;

/**
 * Garante uma sessão Supabase (anônima se não houver login).
 * Retorna o user_id da sessão.
 */
export async function ensureAnonSession(): Promise<{ userId: string } | null> {
  if (pending) return pending;
  pending = (async () => {
    const { data: session } = await supabase.auth.getSession();
    if (session.session?.user?.id) return { userId: session.session.user.id };
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error("[anon-auth] falhou", error);
      return null;
    }
    return { userId: data.user.id };
  })();
  return pending;
}

export function randomNickname(): string {
  const adj = ["Alfa","Bravo","Cargo","Delta","Echo","Foxtrot","Ghost","Hunter","Iron","Juliet","Kilo","Lima","Mike","Nova","Oscar","Papa","Quebec","Romeo","Sierra","Tango","Viper","Whisky","Xray","Yankee","Zulu"];
  const noun = ["Dog","Wolf","Fang","Bark","Bone","Paw","Snarl","Growl","Howl","K9","Sarge","Recon","Bomber","Sniper","Scout"];
  const n = Math.floor(Math.random() * 99);
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${n}`;
}
