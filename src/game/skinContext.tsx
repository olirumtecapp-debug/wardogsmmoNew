import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SKIN_PACKS, setActiveSkin, type SkinPack } from "@/game/skins";

interface SkinCtxValue {
  pack: SkinPack;
  setPack: (id: string) => void;
  packs: SkinPack[];
}

const SkinCtx = createContext<SkinCtxValue>({
  pack: SKIN_PACKS[0],
  setPack: () => {},
  packs: SKIN_PACKS,
});

const STORAGE_KEY = "wardogs.skin";

export function SkinProvider({ children }: { children: ReactNode }) {
  const [pack, setPackState] = useState<SkinPack>(SKIN_PACKS[0]);

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        const found = SKIN_PACKS.find((p) => p.id === saved);
        if (found) {
          setPackState(found);
          setActiveSkin(found.id);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setPack = (id: string) => {
    const found = SKIN_PACKS.find((p) => p.id === id);
    if (!found) return;
    setPackState(found);
    setActiveSkin(found.id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <SkinCtx.Provider value={{ pack, setPack, packs: SKIN_PACKS }}>{children}</SkinCtx.Provider>
  );
}

export const useSkin = () => useContext(SkinCtx);
