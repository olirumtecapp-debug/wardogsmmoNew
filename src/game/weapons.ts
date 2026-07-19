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
};

export const WEAPON_ORDER: WeaponId[] = ["bazooka", "grenade", "rpg", "bow", "artillery"];

export function initialAmmo(): Record<WeaponId, number> {
  const out = {} as Record<WeaponId, number>;
  for (const id of WEAPON_ORDER) out[id] = WEAPONS[id].ammo;
  return out;
}
