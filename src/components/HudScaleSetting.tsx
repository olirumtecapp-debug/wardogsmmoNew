import { useHudScale, type HudScale } from "@/hooks/useHudScale";

const OPTIONS: { v: HudScale; label: string; hint: string }[] = [
  { v: 0.85, label: "Compacto", hint: "85%" },
  { v: 1,    label: "Padrão",   hint: "100%" },
  { v: 1.15, label: "Ampliado", hint: "115%" },
];

export function HudScaleSetting({ compact = false }: { compact?: boolean }) {
  const [scale, setScale] = useHudScale();
  return (
    <div className={`panel ${compact ? "p-2" : "p-3"} flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className="stencil text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Tamanho do HUD
        </span>
        <span className="text-[10px] text-muted-foreground">Atual: {Math.round(scale * 100)}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.v}
            onClick={() => setScale(opt.v)}
            className={`btn-hud !px-2 !py-1.5 text-[11px] leading-tight ${scale === opt.v ? "is-selected" : ""}`}
            aria-pressed={scale === opt.v}
          >
            <div className="stencil tracking-wider">{opt.label}</div>
            <div className="text-[9px] opacity-70">{opt.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
