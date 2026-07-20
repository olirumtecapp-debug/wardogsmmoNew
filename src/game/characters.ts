import type { TeamSkin } from "./skins";
import { RANGER, BRUTUS } from "./skins";
import rangerPortrait from "@/assets/wardogs-ranger.png.asset.json";
import brutusPortrait from "@/assets/wardogs-brutus.png.asset.json";
import musaPortrait from "@/assets/wardogs-musa.png.asset.json";
import ozzyPortrait from "@/assets/wardogs-ozzy.png.asset.json";

export type CharacterId = "ranger" | "brutus" | "musa" | "ozzy";

export interface CharacterStats {
  hp: number;         // pontos de vida iniciais e máximos
  mobility: number;   // px de movimento por turno
  jump: number;       // multiplicador do impulso de pulo
  defense: number;    // multiplicador do dano recebido (menor = mais resistente)
}

export interface Character {
  id: CharacterId;
  name: string;
  breed: string;
  tagline: string;
  portraitUrl: string;
  stats: CharacterStats;
  skin: TeamSkin;
}

// Musa (Boxer) — bruta, boa defesa, dano decente
const MUSA_SKIN: TeamSkin = {
  ...BRUTUS,
  name: "MUSA",
  silhouette: "stocky",
  teamColor: "#7ab648",
  teamDark: "#3d5a20",
  bodyLight: "#c99a6a",
  bodyBase: "#7a4a24",
  bodyDark: "#2a1508",
  eyeIris: "#e8a24a",
  teamNum: "03",
  badgeGlyph: "◆",
};

// Ozzy (Pinscher) — ágil, saltador, frágil
const OZZY_SKIN: TeamSkin = {
  ...RANGER,
  name: "OZZY",
  silhouette: "pointy",
  teamColor: "#3aa0ff",
  teamDark: "#1a4e88",
  bodyLight: "#d38a3a",
  bodyBase: "#8a4a1a",
  bodyDark: "#2a1108",
  teamNum: "04",
  badgeGlyph: "▲",
};

export const CHARACTERS: Record<CharacterId, Character> = {
  ranger: {
    id: "ranger",
    name: "Ranger",
    breed: "Pastor Alemão",
    tagline: "Equilibrado — bom em todo terreno.",
    portraitUrl: rangerPortrait.url,
    stats: { hp: 100, mobility: 120, jump: 1.0, defense: 1.0 },
    skin: RANGER,
  },
  brutus: {
    id: "brutus",
    name: "Brutus",
    breed: "Bulldog",
    tagline: "Tanque — encaixa dano, se move menos.",
    portraitUrl: brutusPortrait.url,
    stats: { hp: 130, mobility: 80, jump: 0.8, defense: 0.75 },
    skin: BRUTUS,
  },
  musa: {
    id: "musa",
    name: "Musa",
    breed: "Boxer",
    tagline: "Bruta força — resistente e agressiva.",
    portraitUrl: musaPortrait.url,
    stats: { hp: 115, mobility: 105, jump: 1.05, defense: 0.9 },
    skin: MUSA_SKIN,
  },
  ozzy: {
    id: "ozzy",
    name: "Ozzy",
    breed: "Pinscher",
    tagline: "Rápido e saltador, mas frágil.",
    portraitUrl: ozzyPortrait.url,
    stats: { hp: 85, mobility: 150, jump: 1.35, defense: 1.2 },
    skin: OZZY_SKIN,
  },
};

export const CHARACTER_LIST: Character[] = [
  CHARACTERS.ranger,
  CHARACTERS.brutus,
  CHARACTERS.musa,
  CHARACTERS.ozzy,
];

export function characterSkin(id: CharacterId): TeamSkin {
  return CHARACTERS[id].skin;
}

// Barras normalizadas 0–1 para renderização no briefing
export function characterBars(id: CharacterId) {
  const s = CHARACTERS[id].stats;
  return {
    hp: Math.min(1, s.hp / 140),
    mob: Math.min(1, s.mobility / 160),
    jump: Math.min(1, s.jump / 1.4),
    def: Math.min(1, (1.3 - s.defense) / 0.9), // menor defense = barra mais cheia
  };
}
