export type WeaponId = "bazooka" | "grenade" | "rpg" | "bow" | "artillery";

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  radius: number; // explosion radius (px)
  ammo: number; // -1 = infinite
  speed: number; // initial power multiplier
  kind: "ballistic" | "cluster";
  affectedByWind: boolean;
  color: string;
  accent?: string; // secondary/highlight color for FX
  gravityScale: number;
  fuse?: number; // seconds until auto-explode (grenade)
}

export interface Dog {
  x: number;
  y: number;
  vy: number;
  hp: number;
  team: 0 | 1;
  facing: 1 | -1;
  aliveTicks: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weapon: WeaponId;
  age: number;
  ownerTeam: 0 | 1;
  trail: Array<[number, number]>;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  age: number;
  maxAge: number;
  particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  value: string;
  color: string;
  size: number;
}

export interface ScorchMark {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export type GamePhase = "aiming" | "firing" | "resolving" | "gameover";
export type GameMode = "ai" | "hotseat" | "online";

export interface GameState {
  width: number;
  height: number;
  terrain: Uint8Array; // 1 = solid, 0 = air
  dogs: [Dog, Dog];
  projectiles: Projectile[];
  explosions: Explosion[];
  floatingTexts: FloatingText[];
  scorchMarks: ScorchMark[];
  currentPlayer: 0 | 1;
  wind: number; // -1..1
  angle: number; // degrees, 0 = right, 90 = up
  power: number; // 10..100
  weapon: WeaponId;
  ammo: Record<WeaponId, number>;
  phase: GamePhase;
  winner: 0 | 1 | null;
  message: string;
  turnTimer: number; // seconds remaining
  mode: GameMode;
  seed: number;
}
