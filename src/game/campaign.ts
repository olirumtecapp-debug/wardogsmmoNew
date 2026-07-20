import type { ScenarioId } from "./scenarios";
import type { CharacterId } from "./characters";
import type { WeaponId } from "./types";
import type { Difficulty } from "./scenarioContext";

export interface MissionModifiers {
  enemyHpBonus?: number;
  allowedWeapons?: WeaponId[];
  windMultiplier?: number;
  /** Desliga a mira assistida (arco preditivo) e trava o toggle na HUD. */
  disableAimAssist?: boolean;
  /** Inimigo começa com a barra de Fúria cheia. */
  enemyRageCharged?: boolean;
  /** Oculta o valor numérico da força no HUD. */
  hidePower?: boolean;
  /** Sobrescreve o tempo de cada turno em segundos. */
  turnTimeSeconds?: number;
  /** Re-sorteia o vento a cada projétil disparado. */
  chaosWind?: boolean;
}

export interface Mission {
  id: string;
  index: number;              // ordem de exibição (1..N)
  name: string;
  brief: string;
  scenario: ScenarioId;
  difficulty: Difficulty;
  enemy: CharacterId;
  suggestedPlayer: CharacterId;
  modifiers?: MissionModifiers;
  bonus?: boolean;            // missão bônus (desbloqueia após última normal)
}

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    index: 1,
    name: "Treinamento",
    brief: "Primeiro tiro no campo de provas. Aqueça o cano, soldado.",
    scenario: "battlefield",
    difficulty: "recruit",
    enemy: "brutus",
    suggestedPlayer: "ranger",
  },
  {
    id: "m2",
    index: 2,
    name: "Patrulha no Deserto",
    brief: "Uma sombra suspeita cruzou as dunas. Elimine o alvo antes do pôr-do-sol.",
    scenario: "desert",
    difficulty: "recruit",
    enemy: "ozzy",
    suggestedPlayer: "musa",
  },
  {
    id: "m3",
    index: 3,
    name: "Emboscada na Selva",
    brief: "Vento forte entre as copas. Corrija a mira ou desperdice munição.",
    scenario: "jungle",
    difficulty: "sergeant",
    enemy: "musa",
    suggestedPlayer: "ranger",
    modifiers: { windMultiplier: 1.5 },
  },
  {
    id: "m4",
    index: 4,
    name: "Assalto Ártico",
    brief: "O inimigo se entrincheirou no gelo com armadura reforçada.",
    scenario: "arctic",
    difficulty: "sergeant",
    enemy: "brutus",
    suggestedPlayer: "ozzy",
    modifiers: { enemyHpBonus: 25 },
  },
  {
    id: "m5",
    index: 5,
    name: "Duelo do Comandante",
    brief: "General inimigo em campo aberto. Cada tiro precisa contar.",
    scenario: "battlefield",
    difficulty: "general",
    enemy: "ranger",
    suggestedPlayer: "brutus",
  },
  {
    id: "m6",
    index: 6,
    name: "Última Trincheira",
    brief: "Arsenal limitado. Só bazuca, granada e arco. Boa sorte.",
    scenario: "arctic",
    difficulty: "general",
    enemy: "musa",
    suggestedPlayer: "ranger",
    modifiers: {
      allowedWeapons: ["bazooka", "grenade", "bow"],
      enemyHpBonus: 15,
    },
  },
  {
    id: "m7",
    index: 7,
    name: "Névoa Cortante",
    brief: "Rajadas erráticas cortam o Ártico. Confie no instinto — não no vento.",
    scenario: "arctic",
    difficulty: "sergeant",
    enemy: "ozzy",
    modifiers: { chaosWind: true, turnTimeSeconds: 20 },
    suggestedPlayer: "ranger",
  },
  {
    id: "m8",
    index: 8,
    name: "Sniper de Dunas",
    brief: "Sem mira assistida. Só arco, RPG e bazuca. Leia o vento e respire.",
    scenario: "desert",
    difficulty: "general",
    enemy: "ranger",
    modifiers: {
      disableAimAssist: true,
      allowedWeapons: ["bow", "rpg", "bazooka"],
    },
    suggestedPlayer: "musa",
  },
  {
    id: "m9",
    index: 9,
    name: "Trovoada",
    brief: "Vento dobrado, força escondida, sem mira assistida. Só cães de verdade sobrevivem.",
    scenario: "jungle",
    difficulty: "general",
    enemy: "brutus",
    modifiers: {
      windMultiplier: 2,
      disableAimAssist: true,
      hidePower: true,
    },
    suggestedPlayer: "ozzy",
  },
  {
    id: "bonus1",
    index: 10,
    name: "Cão Louco",
    brief: "Missão bônus. Vento errante, blindagem inimiga máxima e General à espreita.",
    scenario: "jungle",
    difficulty: "general",
    enemy: "ozzy",
    suggestedPlayer: "musa",
    modifiers: { enemyHpBonus: 40, windMultiplier: 2 },
    bonus: true,
  },
  {
    id: "bonus2",
    index: 11,
    name: "Cão Insano",
    brief: "Reforço inimigo em campo: HP dobrado, Fúria pronta desde o 1º turno, mira travada, vento caótico. Só pra veteranos.",
    scenario: "battlefield",
    difficulty: "general",
    enemy: "brutus",
    suggestedPlayer: "ranger",
    modifiers: {
      enemyHpBonus: 80,
      enemyRageCharged: true,
      disableAimAssist: true,
      chaosWind: true,
      turnTimeSeconds: 20,
    },
    bonus: true,
  },
  {
    id: "bonus3",
    index: 12,
    name: "Blackout",
    brief: "Missão bônus: só explosivos de área, sem mira assistida e inimigo reforçado.",
    scenario: "arctic",
    difficulty: "general",
    enemy: "musa",
    suggestedPlayer: "ranger",
    modifiers: {
      allowedWeapons: ["grenade", "frag", "cluster"],
      disableAimAssist: true,
      enemyHpBonus: 30,
    },
    bonus: true,
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find(m => m.id === id);
}

export function nextMission(id: string): Mission | undefined {
  const idx = MISSIONS.findIndex(m => m.id === id);
  if (idx < 0 || idx >= MISSIONS.length - 1) return undefined;
  return MISSIONS[idx + 1];
}

// ---------------- Progress (localStorage) ----------------

const KEY = "wardogs.campaign.v1";

export interface CampaignProgress {
  stars: Record<string, number>;   // missionId -> 0..3
  lastCharacter?: CharacterId;
}

const empty = (): CampaignProgress => ({ stars: {} });

export function loadProgress(): CampaignProgress {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as CampaignProgress;
    return { stars: p.stars ?? {}, lastCharacter: p.lastCharacter };
  } catch {
    return empty();
  }
}

export function saveProgress(p: CampaignProgress) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function awardStars(missionId: string, stars: number) {
  const p = loadProgress();
  const prev = p.stars[missionId] ?? 0;
  if (stars > prev) {
    p.stars[missionId] = stars;
    saveProgress(p);
  }
}

export function setLastCharacter(c: CharacterId) {
  const p = loadProgress();
  p.lastCharacter = c;
  saveProgress(p);
}

export function isUnlocked(mission: Mission, progress: CampaignProgress): boolean {
  if (mission.index === 1) return true;
  if (mission.bonus) {
    // desbloqueia bônus após concluir todas as normais (>= 1 estrela em cada)
    return MISSIONS.filter(m => !m.bonus).every(m => (progress.stars[m.id] ?? 0) >= 1);
  }
  const prev = MISSIONS.find(m => m.index === mission.index - 1);
  if (!prev) return true;
  return (progress.stars[prev.id] ?? 0) >= 1;
}

export function computeStars(playerHpPct: number, won: boolean): number {
  if (!won) return 0;
  if (playerHpPct >= 0.7) return 3;
  if (playerHpPct >= 0.3) return 2;
  return 1;
}
