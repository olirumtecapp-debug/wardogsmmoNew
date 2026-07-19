export type ScenarioId = "battlefield" | "arctic" | "desert" | "jungle";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  useKeyArtBg: boolean;
  sky: [string, string, string, string];
  tint: string | null;
  tintBlend: GlobalCompositeOperation;
  particleColor: string;
  particleShape: "dust" | "snow" | "leaf" | "ember";
  windScale: number;
  gravityScale: number;
  terrainTop: [number, number, number];
  terrainMid: [number, number, number];
  terrainDeep: [number, number, number];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "battlefield",
    label: "Zona de Guerra",
    description: "Céu de crepúsculo, ruínas e fumaça — mapa principal",
    useKeyArtBg: true,
    sky: ["#0b1220", "#1b2b3a", "#3a3222", "#1a1408"],
    tint: null,
    tintBlend: "source-over",
    particleColor: "#c9b78a",
    particleShape: "ember",
    windScale: 1,
    gravityScale: 1,
    terrainTop: [0x9c, 0xd1, 0x54],
    terrainMid: [0x74, 0x9c, 0x3d],
    terrainDeep: [0x46, 0x2f, 0x1e],
  },
  {
    id: "arctic",
    label: "Ártico",
    description: "Frente congelada, neve e ventania",
    useKeyArtBg: false,
    sky: ["#0a1a2a", "#26466a", "#88b0d0", "#dfeef8"],
    tint: "rgba(180,220,255,0.18)",
    tintBlend: "screen",
    particleColor: "#eaf5ff",
    particleShape: "snow",
    windScale: 1.6,
    gravityScale: 1,
    terrainTop: [0xea, 0xf2, 0xf8],
    terrainMid: [0xa8, 0xbf, 0xd0],
    terrainDeep: [0x2a, 0x3a, 0x4a],
  },
  {
    id: "desert",
    label: "Deserto",
    description: "Dunas, sol pesado e tempestade de areia",
    useKeyArtBg: false,
    sky: ["#3a1a08", "#8a3a12", "#e08a2a", "#f0d068"],
    tint: "rgba(230,180,80,0.15)",
    tintBlend: "multiply",
    particleColor: "#f0c880",
    particleShape: "dust",
    windScale: 1.4,
    gravityScale: 1,
    terrainTop: [0xf0, 0xc0, 0x66],
    terrainMid: [0xc4, 0x8a, 0x3a],
    terrainDeep: [0x5a, 0x2e, 0x14],
  },
  {
    id: "jungle",
    label: "Selva",
    description: "Verde denso, folhagem e umidade",
    useKeyArtBg: false,
    sky: ["#0a1810", "#183822", "#4a6a2a", "#c8e070"],
    tint: "rgba(80,160,60,0.12)",
    tintBlend: "screen",
    particleColor: "#8adf5a",
    particleShape: "leaf",
    windScale: 1.1,
    gravityScale: 1,
    terrainTop: [0x66, 0xc8, 0x4a],
    terrainMid: [0x3a, 0x7a, 0x2e],
    terrainDeep: [0x22, 0x3a, 0x18],
  },
];

let active: Scenario = SCENARIOS[0];

export function setActiveScenario(id: ScenarioId): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (s) active = s;
  return active;
}

export function getActiveScenario(): Scenario {
  return active;
}
