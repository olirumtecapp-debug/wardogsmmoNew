import type { WeaponId } from "./types";
import { WEAPONS } from "./weapons";

export type Silhouette = "pointy" | "stocky";

export interface TeamSkin {
  name: string;
  silhouette: Silhouette;
  bodyLight: string;
  bodyBase: string;
  bodyDark: string;
  teamColor: string;
  teamDark: string;
  helmetBase: string;
  helmetTop: string;
  badgeColor: string;
  eyeIris: string;
  teamNum: string;
  badgeGlyph: string;
}

export interface WeaponSkin {
  color: string;
  accent: string;
}

export interface SkinPack {
  id: string;
  label: string;
  description: string;
  teams: [TeamSkin, TeamSkin];
  weapons: Partial<Record<WeaponId, WeaponSkin>>;
}

export const SKIN_PACKS: SkinPack[] = [
  {
    id: "classico",
    label: "Clássico",
    description: "Ranger vs. Brutus — pelotão original",
    teams: [
      {
        name: "RANGER", silhouette: "pointy",
        bodyLight: "#d2a06d", bodyBase: "#a76a2c", bodyDark: "#2a1a0c",
        teamColor: "#ff8a1a", teamDark: "#a04a10",
        helmetBase: "#0f0f12", helmetTop: "#2a2a30",
        badgeColor: "#e0b64a", eyeIris: "#ffb84a",
        teamNum: "01", badgeGlyph: "★",
      },
      {
        name: "BRUTUS", silhouette: "stocky",
        bodyLight: "#efe4d6", bodyBase: "#b57548", bodyDark: "#5a3120",
        teamColor: "#ff4838", teamDark: "#a02420",
        helmetBase: "#3d4a2a", helmetTop: "#6b7a44",
        badgeColor: "#d8d3c9", eyeIris: "#e2a24a",
        teamNum: "02", badgeGlyph: "■",
      },
    ],
    weapons: {},
  },
  {
    id: "deserto",
    label: "Deserto",
    description: "Areia, khaki e tempestade",
    teams: [
      {
        name: "SCOUT", silhouette: "pointy",
        bodyLight: "#e6c98a", bodyBase: "#b58a48", bodyDark: "#4a2f16",
        teamColor: "#e8a24a", teamDark: "#a05a12",
        helmetBase: "#5a4a28", helmetTop: "#8a7a48",
        badgeColor: "#f0d68a", eyeIris: "#f0c060",
        teamNum: "A", badgeGlyph: "▲",
      },
      {
        name: "TANK", silhouette: "stocky",
        bodyLight: "#c9a888", bodyBase: "#8a5a3a", bodyDark: "#3a2010",
        teamColor: "#c26a2a", teamDark: "#7a3a12",
        helmetBase: "#6a5028", helmetTop: "#9a7a3a",
        badgeColor: "#f0e0a0", eyeIris: "#c99050",
        teamNum: "B", badgeGlyph: "◆",
      },
    ],
    weapons: {
      bazooka: { color: "#ffb14a", accent: "#fff0a0" },
      rpg: { color: "#e08a2a", accent: "#ffd680" },
      bow: { color: "#f0d068", accent: "#ff8a3a" },
    },
  },
  {
    id: "artico",
    label: "Ártico",
    description: "Husky, gelo e aço",
    teams: [
      {
        name: "FROST", silhouette: "pointy",
        bodyLight: "#f4f8fb", bodyBase: "#c8d8e4", bodyDark: "#546878",
        teamColor: "#7ff0ff", teamDark: "#2a7a9a",
        helmetBase: "#1a2a38", helmetTop: "#3a5068",
        badgeColor: "#e0f4ff", eyeIris: "#7ff0ff",
        teamNum: "01", badgeGlyph: "❄",
      },
      {
        name: "SHADOW", silhouette: "stocky",
        bodyLight: "#4a4a52", bodyBase: "#25252c", bodyDark: "#0a0a10",
        teamColor: "#a48aff", teamDark: "#5a3aa0",
        helmetBase: "#141420", helmetTop: "#2a2a3a",
        badgeColor: "#c0b0ff", eyeIris: "#a48aff",
        teamNum: "02", badgeGlyph: "▼",
      },
    ],
    weapons: {
      bazooka: { color: "#7ff0ff", accent: "#e0f8ff" },
      rpg: { color: "#a48aff", accent: "#e0d0ff" },
      grenade: { color: "#8ac0f0", accent: "#e0f0ff" },
      bow: { color: "#c0f0ff", accent: "#a48aff" },
      artillery: { color: "#7060c0", accent: "#c0b0ff" },
    },
  },
  {
    id: "neon",
    label: "Neon",
    description: "Arcade cyberpunk saturado",
    teams: [
      {
        name: "PULSE", silhouette: "pointy",
        bodyLight: "#40ffd0", bodyBase: "#1a8a70", bodyDark: "#082820",
        teamColor: "#00ffb0", teamDark: "#008060",
        helmetBase: "#0a0a1a", helmetTop: "#20205a",
        badgeColor: "#ff40ff", eyeIris: "#40ffd0",
        teamNum: "01", badgeGlyph: "♦",
      },
      {
        name: "VOLT", silhouette: "stocky",
        bodyLight: "#ff70e0", bodyBase: "#c0208a", bodyDark: "#3a0828",
        teamColor: "#ff30a0", teamDark: "#a00060",
        helmetBase: "#20083a", helmetTop: "#40108a",
        badgeColor: "#ffe040", eyeIris: "#ff70e0",
        teamNum: "02", badgeGlyph: "✦",
      },
    ],
    weapons: {
      bazooka: { color: "#ff30a0", accent: "#ffe040" },
      grenade: { color: "#40ffd0", accent: "#ff30a0" },
      rpg: { color: "#a040ff", accent: "#40ffd0" },
      bow: { color: "#ffe040", accent: "#ff30a0" },
      artillery: { color: "#ff40ff", accent: "#40ffd0" },
    },
  },
];

let active: SkinPack = SKIN_PACKS[0];

export function setActiveSkin(id: string): SkinPack {
  const pack = SKIN_PACKS.find((p) => p.id === id);
  if (pack) active = pack;
  return active;
}

export function getActiveSkin(): SkinPack {
  return active;
}

export function teamSkin(team: 0 | 1): TeamSkin {
  return active.teams[team];
}

export function weaponColor(id: WeaponId): string {
  return active.weapons[id]?.color ?? WEAPONS[id].color;
}

export function weaponAccent(id: WeaponId): string {
  return active.weapons[id]?.accent ?? WEAPONS[id].accent ?? WEAPONS[id].color;
}
