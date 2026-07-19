import type { Weapon, WeaponId } from "./types";

export const WEAPONS: Record<WeaponId, Weapon> = {
  revolver: {
    id: "revolver", name: "Revólver", damage: 25, radius: 18, ammo: -1,
    speed: 14, kind: "hitscan", affectedByWind: false, color: "#f6d365", gravityScale: 0,
  },
  ak47: {
    id: "ak47", name: "AK-47", damage: 18, radius: 16, ammo: 4,
    speed: 16, kind: "hitscan", affectedByWind: false, color: "#ffb347", gravityScale: 0,
  },
  bazooka: {
    id: "bazooka", name: "Bazuca", damage: 55, radius: 42, ammo: 3,
    speed: 12, kind: "ballistic", affectedByWind: true, color: "#ff6b35", gravityScale: 1,
  },
  grenade: {
    id: "grenade", name: "Granada", damage: 45, radius: 38, ammo: 3,
    speed: 10, kind: "cluster", affectedByWind: true, color: "#8fbc8f", gravityScale: 1, fuse: 2.5,
  },
  artillery: {
    id: "artillery", name: "Artilharia", damage: 75, radius: 55, ammo: 1,
    speed: 14, kind: "ballistic", affectedByWind: true, color: "#e94560", gravityScale: 1.2,
  },
};

export const WEAPON_ORDER: WeaponId[] = ["revolver", "ak47", "bazooka", "grenade", "artillery"];

export function initialAmmo(): Record<WeaponId, number> {
  const out = {} as Record<WeaponId, number>;
  for (const id of WEAPON_ORDER) out[id] = WEAPONS[id].ammo;
  return out;
}
