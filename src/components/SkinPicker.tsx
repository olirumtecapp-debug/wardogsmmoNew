import { useSkin } from "@/game/skinContext";

interface Props {
  compact?: boolean;
  className?: string;
}

export function SkinPicker({ compact, className }: Props) {
  const { pack, setPack, packs } = useSkin();
  return (
    <div className={`flex gap-1.5 ${compact ? "flex-nowrap" : "flex-wrap justify-center"} ${className ?? ""}`}>
      {packs.map((p) => {
        const active = p.id === pack.id;
        const a = p.teams[0].teamColor;
        const b = p.teams[1].teamColor;
        return (
          <button
            key={p.id}
            onClick={() => setPack(p.id)}
            title={p.description}
            className={`btn-hud px-2 py-1 flex items-center gap-1.5 transition-all ${active ? "is-selected" : ""}`}
            style={
              active
                ? {
                    borderColor: a,
                    boxShadow: `inset 0 0 0 1px ${a}55, 0 0 18px ${a}55`,
                  }
                : undefined
            }
          >
            <span className="flex gap-0.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: a, boxShadow: `0 0 4px ${a}` }}
              />
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: b, boxShadow: `0 0 4px ${b}` }}
              />
            </span>
            <span className="stencil text-[10px] uppercase tracking-widest">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
