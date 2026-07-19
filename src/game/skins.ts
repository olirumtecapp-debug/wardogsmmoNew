// Fixed Ranger vs Brutus identity (from key art). Skin packs removed —
// scenarios now drive visual variety. This file stays as a thin API layer
// so render.ts and callers don't need to change signatures.
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

export const RANGER: TeamSkin = {
  name: "RANGER", silhouette: "pointy",
  bodyLight: "#d2a06d", bodyBase: "#a76a2c", bodyDark: "#2a1a0c",
  teamColor: "#ff8a1a", teamDark: "#a04a10",
  helmetBase: "#0f0f12", helmetTop: "#2a2a30",
  badgeColor: "#e0b64a", eyeIris: "#ffb84a",
  teamNum: "01", badgeGlyph: "★",
};

export const BRUTUS: TeamSkin = {
  name: "BRUTUS", silhouette: "stocky",
  bodyLight: "#efe4d6", bodyBase: "#b57548", bodyDark: "#5a3120",
  teamColor: "#ff4838", teamDark: "#a02420",
  helmetBase: "#3d4a2a", helmetTop: "#6b7a44",
  badgeColor: "#d8d3c9", eyeIris: "#e2a24a",
  teamNum: "02", badgeGlyph: "■",
};

export const TEAM_SKINS: [TeamSkin, TeamSkin] = [RANGER, BRUTUS];

export function teamSkin(team: 0 | 1): TeamSkin {
  return TEAM_SKINS[team];
}

export function weaponColor(id: WeaponId): string {
  return WEAPONS[id].color;
}

export function weaponAccent(id: WeaponId): string {
  return WEAPONS[id].accent ?? WEAPONS[id].color;
}
