import { useCallback, useEffect, useState } from "react";

type FSDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type FSElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function getFsElement(): Element | null {
  const d = document as FSDoc;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function fullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FSElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export async function requestFullscreenNow(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FSElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else {
      return false;
    }
    // Attempt to lock landscape (may reject on iOS)
    const orient = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
    if (orient?.lock) {
      try { await orient.lock("landscape"); } catch { /* ignore */ }
    }
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreenNow(): Promise<void> {
  const d = document as FSDoc;
  try {
    if (d.exitFullscreen) await d.exitFullscreen();
    else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
  } catch { /* ignore */ }
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!getFsElement());

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!getFsElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as EventListener);
    };
  }, []);

  const request = useCallback(() => requestFullscreenNow(), []);
  const exit = useCallback(() => exitFullscreenNow(), []);

  return { isFullscreen, request, exit, supported: fullscreenSupported(), isMobile: isMobileDevice() };
}
