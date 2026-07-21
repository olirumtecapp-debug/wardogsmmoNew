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
              : "fixed inset-0 z-[100] bg-[#050810]/97 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          }
        >
          {soft ? (
            <div className="panel p-3 pr-2 flex items-center gap-3 pointer-events-auto max-w-sm">
              <div className="text-2xl animate-pulse shrink-0">📱↻</div>
              <div className="min-w-0 flex-1">
                <h3 className="stencil text-sm">Gire o dispositivo</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">Melhor experiência em modo paisagem.</p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="btn-hud btn-hud-ghost !px-2 !py-1 text-xs shrink-0"
                aria-label="Dispensar"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="panel p-8 max-w-sm text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 40%, var(--accent) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="text-6xl"
                    style={{
                      animation: "wd-rotate-hint 2.4s ease-in-out infinite",
                      transformOrigin: "center",
                      display: "inline-block",
                    }}
                    aria-hidden
                  >
                    📱
                  </div>
                </div>
                <h3 className="stencil text-2xl tracking-widest mb-2" style={{ color: "var(--accent)" }}>
                  GIRE O DISPOSITIVO
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  O WarDogs é jogado em <strong className="text-white">modo paisagem</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Vire seu celular na horizontal para começar a batalha.
                </p>
                <div className="mt-5 stencil text-[10px] tracking-[0.3em] text-muted-foreground/70">
                  ↻ AGUARDANDO ROTAÇÃO
                </div>
              </div>
              <style>{`@keyframes wd-rotate-hint {
                0%,15% { transform: rotate(0deg); }
                45%,60% { transform: rotate(-90deg); }
                90%,100% { transform: rotate(0deg); }
              }`}</style>
            </div>
          )}
        </div>
      )}
    </>
  );
}
