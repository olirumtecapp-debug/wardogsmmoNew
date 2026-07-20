import { useEffect, useState } from "react";

export function OrientationGate({ children, soft = false }: { children: React.ReactNode; soft?: boolean }) {
  const [portrait, setPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const check = () => {
      const isMobile = window.matchMedia("(pointer: coarse)").matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      setPortrait(isMobile && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const show = portrait && !(soft && dismissed);

  return (
    <>
      {children}
      {show && (
        <div
          className={
            soft
              ? "fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none"
              : "fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-6 text-center"
          }
        >
          <div className={soft ? "panel p-3 pr-2 flex items-center gap-3 pointer-events-auto max-w-sm" : "panel p-6 max-w-xs text-center"}>
            <div className={soft ? "text-2xl animate-pulse shrink-0" : "text-4xl mb-3 animate-pulse"}>📱↻</div>
            <div className="min-w-0 flex-1">
              <h3 className={soft ? "stencil text-sm" : "stencil text-lg"}>Gire o dispositivo</h3>
              <p className={soft ? "text-[11px] text-muted-foreground leading-tight" : "text-sm text-muted-foreground mt-2"}>
                {soft ? "Melhor experiência em modo paisagem." : (
                  <>O WarDogs é jogado em <strong>modo paisagem</strong>. Vire seu celular na horizontal para começar.</>
                )}
              </p>
            </div>
            {soft && (
              <button
                onClick={() => setDismissed(true)}
                className="btn-hud btn-hud-ghost !px-2 !py-1 text-xs shrink-0"
                aria-label="Dispensar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
