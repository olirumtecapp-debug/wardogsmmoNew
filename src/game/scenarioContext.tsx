import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SCENARIOS, setActiveScenario, type Scenario, type ScenarioId } from "./scenarios";

interface Ctx {
  scenario: Scenario;
  setScenario: (id: ScenarioId) => void;
  scenarios: Scenario[];
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}

export type Difficulty = "recruit" | "sergeant" | "general";

const SC_KEY = "wardogs.scenario";
const DF_KEY = "wardogs.difficulty";

let _diff: Difficulty = "sergeant";
export function getAIDifficulty(): Difficulty { return _diff; }
export function _setAIDifficulty(d: Difficulty) { _diff = d; }

const Ctx = createContext<Ctx>({
  scenario: SCENARIOS[0], setScenario: () => {}, scenarios: SCENARIOS,
  difficulty: "sergeant", setDifficulty: () => {},
});

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioState] = useState<Scenario>(SCENARIOS[0]);
  const [difficulty, setDiffState] = useState<Difficulty>("sergeant");

  useEffect(() => {
    try {
      const s = localStorage.getItem(SC_KEY) as ScenarioId | null;
      if (s) {
        const f = SCENARIOS.find(x => x.id === s);
        if (f) { setScenarioState(f); setActiveScenario(f.id); }
      }
      const d = localStorage.getItem(DF_KEY) as Difficulty | null;
      if (d === "recruit" || d === "sergeant" || d === "general") {
        setDiffState(d); _setAIDifficulty(d);
      }
    } catch { /* ignore */ }
  }, []);

  const setScenario = (id: ScenarioId) => {
    const f = SCENARIOS.find(x => x.id === id); if (!f) return;
    setScenarioState(f); setActiveScenario(f.id);
    try { localStorage.setItem(SC_KEY, id); } catch {}
  };
  const setDifficulty = (d: Difficulty) => {
    setDiffState(d); _setAIDifficulty(d);
    try { localStorage.setItem(DF_KEY, d); } catch {}
  };

  return <Ctx.Provider value={{ scenario, setScenario, scenarios: SCENARIOS, difficulty, setDifficulty }}>{children}</Ctx.Provider>;
}

export const useScenario = () => useContext(Ctx);
