import type { Weapon, WeaponId } from "./types";

export const WEAPONS: Record<WeaponId, Weapon> = {
  bazooka: {
    id: "bazooka", name: "Bazuca", damage: 45, radius: 44, ammo: -1,
    speed: 12, kind: "ballistic", affectedByWind: true,
    color: "#ff7a1a", accent: "#ffd166", gravityScale: 1,
  },
  grenade: {
    id: "grenade", name: "Granada", damage: 55, radius: 55, ammo: 3,
    speed: 10, kind: "cluster", affectedByWind: true,
    color: "#8fbc55", accent: "#f4d02c", gravityScale: 1, fuse: 2.5,
  },
  rpg: {
    id: "rpg", name: "RPG", damage: 55, radius: 55, ammo: 3,
    speed: 11, kind: "ballistic", affectedByWind: false,
    color: "#2b7fff", accent: "#7ff0ff", gravityScale: 0.15,
  },
  bow: {
    id: "bow", name: "Arco & Flecha", damage: 30, radius: 22, ammo: -1,
    speed: 14, kind: "ballistic", affectedByWind: true,
    color: "#c8f77d", accent: "#ff4d9e", gravityScale: 0.65,
  },
  artillery: {
    id: "artillery", name: "Artilharia", damage: 70, radius: 70, ammo: 2,
    speed: 14, kind: "ballistic", affectedByWind: true,
    color: "#e94560", accent: "#ffcc33", gravityScale: 1.2,
  },
  frag: {
    id: "frag", name: "Frag Rápida", damage: 50, radius: 38, ammo: 4,
    speed: 12, kind: "cluster", affectedByWind: true,
    color: "#a0e070", accent: "#ffe040", gravityScale: 1, fuse: 1.0,
  },
  cluster: {
    id: "cluster", name: "Cluster", damage: 32, radius: 32, ammo: 2,
    speed: 12, kind: "cluster", affectedByWind: true,
    color: "#ff5aa8", accent: "#ffe040", gravityScale: 1,
  },
  airstrike: {
    id: "airstrike", name: "Air Strike", damage: 55, radius: 50, ammo: 1,
    speed: 0, kind: "airstrike", affectedByWind: false,
    color: "#ff2a2a", accent: "#ffdc4a", gravityScale: 0,
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  "bazooka", "grenade", "rpg", "bow", "artillery", "frag", "cluster", "airstrike",
];

export function initialAmmo(): Record<WeaponId, number> {
  const out = {} as Record<WeaponId, number>;
  for (const id of WEAPON_ORDER) out[id] = WEAPONS[id].ammo;
  return out;
}
