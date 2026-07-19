import { useEffect, useState } from "react";

export function OrientationGate({ children }: { children: React.ReactNode }) {
  const [portrait, setPortrait] = useState(false);
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

  return (
    <>
      {children}
      {portrait && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-6 text-center">
          <div className="panel p-6 max-w-xs">
            <div className="text-4xl mb-3 animate-pulse">📱↻</div>
            <h3 className="stencil text-lg">Gire o dispositivo</h3>
            <p className="text-sm text-muted-foreground mt-2">
              O WarDogs é jogado em <strong>modo paisagem</strong>. Vire seu celular na horizontal para começar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
