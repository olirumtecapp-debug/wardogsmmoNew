import bgWarzone from "@/assets/bg-warzone.jpg.asset.json";
import bgArctic from "@/assets/bg-arctic.jpg.asset.json";
import bgDesert from "@/assets/bg-desert.jpg.asset.json";
import bgJungle from "@/assets/bg-jungle.jpg.asset.json";

export type ScenarioId = "battlefield" | "arctic" | "desert" | "jungle";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  bgImage: string;
  bgFocus: { x: number; y: number };
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
  aimColor?: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "battlefield",
    label: "Zona de Guerra",
    description: "Operação Cerco Total — ruínas em chamas",
    bgImage: bgWarzone.url,
    bgFocus: { x: 0.5, y: 0.4 },
    sky: ["#0b1220", "#1b2b3a", "#3a3222", "#1a1408"],
    tint: "rgba(255,140,60,0.06)",
    tintBlend: "screen",
    particleColor: "#c9b78a",
    particleShape: "ember",
    windScale: 1,
    gravityScale: 1,
    terrainTop: [0x8a, 0x7a, 0x62],
    terrainMid: [0x5a, 0x4a, 0x38],
    terrainDeep: [0x2a, 0x20, 0x14],
  },
  {
    id: "arctic",
    label: "Ártico",
    description: "Operação Gelo Negro — frente congelada",
    bgImage: bgArctic.url,
    bgFocus: { x: 0.5, y: 0.55 },
    sky: ["#0a1a2a", "#26466a", "#88b0d0", "#dfeef8"],
    tint: "rgba(180,220,255,0.14)",
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
    description: "Operação Areia Vermelha — dunas ao crepúsculo",
    bgImage: bgDesert.url,
    bgFocus: { x: 0.5, y: 0.55 },
    sky: ["#3a1a08", "#8a3a12", "#e08a2a", "#f0d068"],
    tint: "rgba(230,180,80,0.12)",
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
    description: "Operação Garra Silenciosa — verde denso",
    bgImage: bgJungle.url,
    bgFocus: { x: 0.5, y: 0.35 },
    sky: ["#0a1810", "#183822", "#4a6a2a", "#c8e070"],
    tint: "rgba(80,160,60,0.10)",
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
