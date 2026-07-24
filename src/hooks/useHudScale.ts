import { useEffect, useState, useCallback } from "react";

/**
 * HUD density scale. Persistent via localStorage.
 * 0.85 = Compacto, 1 = Padrão, 1.15 = Ampliado.
 */
export type HudScale = 0.85 | 1 | 1.15;
const KEY = "wardogs.hudScale";
const DEFAULT: HudScale = 1;

function read(): HudScale {
  if (typeof window === "undefined") return DEFAULT;
  const v = parseFloat(window.localStorage.getItem(KEY) ?? "");
  if (v === 0.85 || v === 1 || v === 1.15) return v as HudScale;
  return DEFAULT;
}

function apply(v: HudScale) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--hud-scale", String(v));
}

const listeners = new Set<(v: HudScale) => void>();

export function useHudScale(): [HudScale, (v: HudScale) => void] {
  const [scale, setScale] = useState<HudScale>(() => read());

  useEffect(() => {
    apply(scale);
    const cb = (v: HudScale) => setScale(v);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, [scale]);

  const set = useCallback((v: HudScale) => {
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(KEY, String(v)); } catch {}
    }
    apply(v);
    setScale(v);
    listeners.forEach(fn => fn(v));
  }, []);

  return [scale, set];
}

// Ensure the CSS var is set even before any component mounts.
if (typeof window !== "undefined") apply(read());
