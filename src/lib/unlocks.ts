import type { CharacterId } from "@/game/characters";
import { MISSIONS, loadProgress } from "@/game/campaign";

const KEY = "wardogs.unlocks.v1";

export interface UnlocksState {
  characters: CharacterId[];
  adminOverride?: boolean;
}

function empty(): UnlocksState {
  return { characters: [] };
}

export function loadUnlocks(): UnlocksState {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as UnlocksState;
    return { characters: p.characters ?? [], adminOverride: p.adminOverride };
  } catch {
    return empty();
  }
}

export function saveUnlocks(s: UnlocksState) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function unlockCharacter(id: CharacterId) {
  const s = loadUnlocks();
  if (!s.characters.includes(id)) {
    s.characters.push(id);
    saveUnlocks(s);
  }
}

export function setAdminOverride(v: boolean) {
  const s = loadUnlocks();
  s.adminOverride = v;
  saveUnlocks(s);
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("wardogs:admin-override-changed")); } catch { /* ignore */ }
  }
}

export function isAdminOverride(): boolean {
  return !!loadUnlocks().adminOverride;
}


/**
 * Regras de desbloqueio:
 * - ranger, brutus, musa, ozzy → sempre disponíveis
 * - negao (Corso, Elite) → concluir 6 missões da campanha (≥1 estrela cada)
 * - miu (Elite) → concluir 9 missões da campanha (≥1 estrela cada)
 * - Admin override desbloqueia todos.
 */
export function isCharacterUnlocked(id: CharacterId): boolean {
  const s = loadUnlocks();
  if (s.adminOverride) return true;
  if (s.characters.includes(id)) return true;
  if (id === "negao" || id === "miu") {
    const prog = loadProgress();
    const completed = MISSIONS.filter(m => !m.bonus && (prog.stars[m.id] ?? 0) >= 1).length;
    const need = id === "negao" ? 6 : 9;
    return completed >= need;
  }
  return true;
}

export function characterUnlockHint(id: CharacterId): string {
  if (id === "negao") return "Conclua 6 missões da Campanha para desbloquear Corso.";
  if (id === "miu") return "Conclua 9 missões da Campanha para desbloquear Miu.";
  return "";
}
