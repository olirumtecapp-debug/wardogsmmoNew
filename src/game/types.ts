import type { CharacterId } from "./characters";

export type WeaponId =
  | "bazooka"
  | "grenade"
  | "rpg"
  | "bow"
  | "artillery"
  | "frag"
  | "cluster"
  | "airstrike";

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  radius: number;
  ammo: number;
  speed: number;
  kind: "ballistic" | "cluster" | "airstrike";
  affectedByWind: boolean;
  color: string;
  accent?: string;
  gravityScale: number;
  fuse?: number;
}

export interface Dog {
  x: number;
  y: number;
  vy: number;
  hp: number;
  maxHp: number;
  team: 0 | 1;
  facing: 1 | -1;
  aliveTicks: number;
  airborne?: boolean;
  fallStartY?: number;
  moveBudget: number;
  moveMax: number;
  jumpScale: number;
  defense: number;
  charId: CharacterId;
  hasJumped: boolean;
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
  isSub?: boolean;
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
  id: number; x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; value: string; color: string; size: number;
}

export interface ScorchMark {
  x: number; y: number; radius: number; life: number; maxLife: number;
}

export type GamePhase = "aiming" | "firing" | "resolving" | "gameover";
export type GameMode = "ai" | "hotseat" | "online";

export interface GameState {
  width: number; height: number;
  terrain: Uint8Array;
  dogs: [Dog, Dog];
  projectiles: Projectile[];
  explosions: Explosion[];
  floatingTexts: FloatingText[];
  scorchMarks: ScorchMark[];
  currentPlayer: 0 | 1;
  wind: number;
  angle: number;
  power: number;
  weapon: WeaponId;
  ammo: Record<WeaponId, number>;
  phase: GamePhase;
  winner: 0 | 1 | null;
  message: string;
  turnTimer: number;
  mode: GameMode;
  seed: number;
  airstrikeMarker?: { x: number; life: number };
  hudReserve: number;
}

