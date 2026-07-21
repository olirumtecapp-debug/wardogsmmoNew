import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHARACTERS, characterBars, type CharacterId } from "@/game/characters";

interface Props {
  charId: CharacterId;
  children: ReactNode;
  /** where to anchor the popover relative to the trigger */
  placement?: "top" | "bottom";
}

const STAT_META: { key: "hp" | "mob" | "jump" | "def"; icon: string; label: string }[] = [
  { key: "hp", icon: "♥", label: "Vida" },
  { key: "mob", icon: "⚡", label: "Mobilidade" },
  { key: "jump", icon: "▲", label: "Pulo" },
  { key: "def", icon: "◆", label: "Defesa" },
];

/**
 * Wraps a character card trigger and shows a floating info popover
 * on hover (desktop) or long-press (mobile) with stats and lore.
 */
export function CharacterInfoPopover({ charId, children, placement = "top" }: Props) {
  const c = CHARACTERS[charId];
  const bars = characterBars(charId);
  const color = c.skin.teamColor;
  const [open, setOpen] = useState(false);
  const lpTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (lpTimer.current) window.clearTimeout(lpTimer.current);
  }, []);

  const clearLp = () => {
    if (lpTimer.current) {
      window.clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
  };

  const onTouchStart = () => {
    clearLp();
    lpTimer.current = window.setTimeout(() => setOpen(true), 380);
  };
  const onTouchEnd = () => {
    clearLp();
    // keep open briefly so mobile users can read; close on next tap outside
    window.setTimeout(() => setOpen(false), 2200);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
      {open && (
        <div
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-40 w-56 ${
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <div
            className="panel p-2 text-left shadow-xl card-in"
            style={{ borderColor: color, boxShadow: `0 6px 20px rgba(0,0,0,0.6), 0 0 0 1px ${color}88` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="stencil text-[11px] uppercase tracking-widest truncate" style={{ color }}>
                {c.name}
              </span>
              {c.tier === "elite" && (
                <span
                  className="text-[7px] uppercase tracking-[0.15em] px-1 rounded font-bold shrink-0"
                  style={{ color: "#0b0f16", background: color }}
                >
                  Elite
                </span>
              )}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{c.breed}</div>
            <div className="text-[10px] text-foreground/80 leading-tight mb-1.5">{c.tagline}</div>
            <div className="space-y-0.5">
              {STAT_META.map(s => {
                const pct = Math.round(bars[s.key] * 100);
                return (
                  <div key={s.key} className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-3 text-center" style={{ color }}>{s.icon}</span>
                    <span className="w-14 uppercase tracking-widest text-muted-foreground">{s.label}</span>
                    <div className="flex-1 h-1 rounded-full bg-black/50 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
