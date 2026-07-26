import type { TeamSkin } from "./skins";
import { RANGER, BRUTUS } from "./skins";
// Frontal portraits — usados no menu de seleção, cards e quadrinhos.
// (In-game os sprites laterais v7 são carregados diretamente em render.ts.)
import rangerFront from "@/assets/wardogs-ranger-front-v2.png.asset.json";
import brutusFront from "@/assets/wardogs-brutus-front-v2.png.asset.json";
import musaFront from "@/assets/wardogs-musa-front-v8.png.asset.json";
import ozzyFront from "@/assets/wardogs-ozzy-front-v2.png.asset.json";
import corsoFront from "@/assets/corso-front-v5.png.asset.json";
import miuFront from "@/assets/miu-front-v6.png.asset.json";
import bartoFront from "@/assets/wardogs-barto-front.png.asset.json";

export type CharacterId = "ranger" | "brutus" | "musa" | "ozzy" | "negao" | "miu" | "barto";

export type CharacterTier = "standard" | "elite";

export interface CharacterStats {
  hp: number;         // pontos de vida iniciais e máximos
  mobility: number;   // px de movimento por turno
  jump: number;       // multiplicador do impulso de pulo
  defense: number;    // multiplicador do dano recebido (menor = mais resistente)
}

export interface CharacterSizing {
  /** Multiplier applied to the in-game side sprite target height. */
  spriteScale: number;
  /** Multiplier applied to the frontal portrait in menus / comics (transform: scale). */
  portraitScale: number;
  /** Fraction of the side PNG that is empty below the feet — used to push sprite down so paws touch the ground. */
  spriteBottomPad: number;
}

export interface Character {
  id: CharacterId;
  name: string;
  breed: string;
  tagline: string;
  portraitUrl: string;
  comicPortraitUrl: string;
  stats: CharacterStats;
  skin: TeamSkin;
  tier: CharacterTier;
  sizing: CharacterSizing;
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

// Corso (Cane Corso) — tanque elite, blindagem pesada
const NEGAO_SKIN: TeamSkin = {
  ...BRUTUS,
  name: "CORSO",
  silhouette: "stocky",
  teamColor: "#a855f7",
  teamDark: "#5b21b6",
  bodyLight: "#4a4a52",
  bodyBase: "#1a1a1e",
  bodyDark: "#050507",
  helmetBase: "#141418",
  helmetTop: "#2a2a30",
  eyeIris: "#ffcc33",
  teamNum: "05",
  badgeGlyph: "☠",
};

// Miu (Street Cat) — assassina elite, ágil e felina
const MIU_SKIN: TeamSkin = {
  ...RANGER,
  name: "MIU",
  silhouette: "pointy",
  teamColor: "#f472b6",
  teamDark: "#9d174d",
  bodyLight: "#6a6a72",
  bodyBase: "#2a2a30",
  bodyDark: "#0a0a10",
  helmetBase: "#1a1a20",
  helmetTop: "#3a3a44",
  eyeIris: "#7ff0ff",
  teamNum: "06",
  badgeGlyph: "✦",
};

// Bartô (Bulldog Francês) — elite, tanque baixinho de peito grande.
// Passiva "Coração de Buldogue": +25% dano e -20% dano recebido quando HP < 50%.
const BARTO_SKIN: TeamSkin = {
  ...BRUTUS,
  name: "BARTÔ",
  silhouette: "stocky",
  teamColor: "#ff8a1a",
  teamDark: "#7a3a0a",
  bodyLight: "#f5efe5",
  bodyBase: "#d8cfc0",
  bodyDark: "#4a4238",
  helmetBase: "#4a5028",
  helmetTop: "#7a8244",
  eyeIris: "#5a3a1a",
  teamNum: "07",
  badgeGlyph: "✚",
};

// Sizing — sprites are already normalized on a 1024 canvas with breed-accurate
// height fractions, so runtime scale stays at 1.0 across the board.
const SIZING: Record<CharacterId, CharacterSizing> = {
  ranger: { spriteScale: 1.18, portraitScale: 1.0, spriteBottomPad: 0.01 },
  brutus: { spriteScale: 1.20, portraitScale: 1.0, spriteBottomPad: 0.01 },
  musa:   { spriteScale: 1.18, portraitScale: 1.0, spriteBottomPad: 0.01 },
  ozzy:   { spriteScale: 1.28, portraitScale: 1.0, spriteBottomPad: 0.01 },
  negao:  { spriteScale: 1.20, portraitScale: 1.0, spriteBottomPad: 0.01 },
  miu:    { spriteScale: 1.32, portraitScale: 1.0, spriteBottomPad: 0.01 },
  barto:  { spriteScale: 1.10, portraitScale: 1.0, spriteBottomPad: 0.01 },
};

export const CHARACTERS: Record<CharacterId, Character> = {
  ranger: {
    id: "ranger",
    name: "Ranger",
    breed: "Pastor Alemão",
    tagline: "Equilibrado — bom em todo terreno.",
    portraitUrl: rangerFront.url,
    comicPortraitUrl: rangerFront.url,
    stats: { hp: 100, mobility: 120, jump: 1.0, defense: 1.0 },
    skin: RANGER,
    tier: "standard",
    sizing: SIZING.ranger,
  },
  brutus: {
    id: "brutus",
    name: "Brutus",
    breed: "Bulldog",
    tagline: "Tanque — encaixa dano, se move menos.",
    portraitUrl: brutusFront.url,
    comicPortraitUrl: brutusFront.url,
    stats: { hp: 130, mobility: 80, jump: 0.8, defense: 0.75 },
    skin: BRUTUS,
    tier: "standard",
    sizing: SIZING.brutus,
  },
  musa: {
    id: "musa",
    name: "Musa",
    breed: "Boxer",
    tagline: "Bruta força — resistente e agressiva.",
    portraitUrl: musaFront.url,
    comicPortraitUrl: musaFront.url,
    stats: { hp: 115, mobility: 105, jump: 1.05, defense: 0.9 },
    skin: MUSA_SKIN,
    tier: "standard",
    sizing: SIZING.musa,
  },
  ozzy: {
    id: "ozzy",
    name: "Ozzy",
    breed: "Pinscher",
    tagline: "Rápido e saltador, mas frágil.",
    portraitUrl: ozzyFront.url,
    comicPortraitUrl: ozzyFront.url,
    stats: { hp: 85, mobility: 150, jump: 1.35, defense: 1.2 },
    skin: OZZY_SKIN,
    tier: "standard",
    sizing: SIZING.ozzy,
  },
  negao: {
    id: "negao",
    name: "Corso",
    breed: "Cane Corso · Elite",
    tagline: "Tanque de elite — blindagem pesada e mordida esmagadora.",
    portraitUrl: corsoFront.url,
    comicPortraitUrl: corsoFront.url,
    stats: { hp: 150, mobility: 90, jump: 0.9, defense: 0.7 },
    skin: NEGAO_SKIN,
    tier: "elite",
    sizing: SIZING.negao,
  },
  miu: {
    id: "miu",
    name: "Miu",
    breed: "Street Cat · Elite",
    tagline: "Assassina felina — rápida, alta e imprevisível.",
    portraitUrl: miuFront.url,
    comicPortraitUrl: miuFront.url,
    stats: { hp: 95, mobility: 170, jump: 1.5, defense: 1.0 },
    skin: MIU_SKIN,
    tier: "elite",
    sizing: SIZING.miu,
  },
  barto: {
    id: "barto",
    name: "Bartô",
    breed: "Bulldog Francês · Elite",
    tagline: "Coração de Buldogue — fica mais forte quando está machucado.",
    portraitUrl: bartoFront.url,
    comicPortraitUrl: bartoFront.url,
    stats: { hp: 125, mobility: 95, jump: 0.95, defense: 0.8 },
    skin: BARTO_SKIN,
    tier: "elite",
    sizing: SIZING.barto,
  },
};

export const CHARACTER_LIST: Character[] = [
  CHARACTERS.ranger,
  CHARACTERS.brutus,
  CHARACTERS.musa,
  CHARACTERS.ozzy,
  CHARACTERS.negao,
  CHARACTERS.miu,
  CHARACTERS.barto,
];

export function characterSkin(id: CharacterId): TeamSkin {
  return CHARACTERS[id].skin;
}

// Barras normalizadas 0–1 para renderização no briefing
export function characterBars(id: CharacterId) {
  const s = CHARACTERS[id].stats;
  return {
    hp: Math.min(1, s.hp / 160),
    mob: Math.min(1, s.mobility / 180),
    jump: Math.min(1, s.jump / 1.6),
    def: Math.min(1, (1.3 - s.defense) / 0.9), // menor defense = barra mais cheia
  };
}
