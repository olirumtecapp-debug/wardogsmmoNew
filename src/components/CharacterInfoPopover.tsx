import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CHARACTERS, characterBars, type CharacterId } from "@/game/characters";

interface Props {
  charId: CharacterId;
  children: ReactNode;
  /** preferred anchor side; auto-flips if not enough room */
  placement?: "top" | "bottom";
}

const STAT_META: { key: "hp" | "mob" | "jump" | "def"; icon: string; label: string }[] = [
  { key: "hp", icon: "♥", label: "Vida" },
  { key: "mob", icon: "⚡", label: "Mobilidade" },
  { key: "jump", icon: "▲", label: "Pulo" },
  { key: "def", icon: "◆", label: "Defesa" },
];

const POPOVER_W = 224; // 14rem
const GUTTER = 12;

export function CharacterInfoPopover({ charId, children, placement = "top" }: Props) {
  const c = CHARACTERS[charId];
  const bars = characterBars(charId);
  const color = c.skin.teamColor;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [measured, setMeasured] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const lpTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (lpTimer.current) window.clearTimeout(lpTimer.current);
  }, []);

  const compute = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const clientW = document.documentElement.clientWidth || window.innerWidth;
    const clientH = document.documentElement.clientHeight || window.innerHeight;
    const maxW = Math.min(POPOVER_W, clientW - GUTTER * 2);
    const popRect = popRef.current?.getBoundingClientRect();
    const w = popRect?.width ? Math.min(popRect.width, maxW) : maxW;
    const h = popRect?.height ?? 180;
    const spaceTop = r.top;
    const spaceBottom = clientH - r.bottom;
    const flipToBottom = placement === "top"
      ? spaceTop < h + GUTTER && spaceBottom > spaceTop
      : spaceBottom >= h + GUTTER || spaceBottom > spaceTop;
    const top = flipToBottom
      ? Math.min(clientH - h - GUTTER, r.bottom + 6)
      : Math.max(GUTTER, r.top - h - 6);
    const centerX = r.left + r.width / 2 - w / 2;
    const left = Math.max(GUTTER, Math.min(centerX, clientW - w - GUTTER));
    setCoords({ left, top });
    if (popRect) setMeasured(true);
  };

  useLayoutEffect(() => {
    if (!open) {
      setMeasured(false);
      return;
    }
    compute();
    const raf = requestAnimationFrame(() => compute());
    const onScroll = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    let ro: ResizeObserver | null = null;
    if (popRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => compute());
      ro.observe(popRef.current);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    window.setTimeout(() => setOpen(false), 2200);
  };

  const clientW = typeof document !== "undefined"
    ? (document.documentElement.clientWidth || window.innerWidth)
    : POPOVER_W + GUTTER * 2;
  const width = Math.min(POPOVER_W, clientW - GUTTER * 2);


  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
      {open && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={popRef}
          className="pointer-events-none fixed z-[100]"
          style={{ left: coords.left, top: coords.top, width, visibility: measured ? "visible" : "hidden" }}
        >

          <div
            className="panel p-2 text-left shadow-xl card-in overflow-hidden"
            style={{ borderColor: color, boxShadow: `0 6px 20px rgba(0,0,0,0.6), 0 0 0 1px ${color}88` }}
          >
            <div className="flex items-center gap-1.5 mb-1 min-w-0">
              <span className="stencil text-[11px] uppercase tracking-widest truncate min-w-0" style={{ color }}>
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
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 truncate">{c.breed}</div>
            <div className="text-[10px] text-foreground/80 leading-tight mb-1.5 break-words line-clamp-3">{c.tagline}</div>
            <div className="space-y-0.5">
              {STAT_META.map(s => {
                const pct = Math.round(bars[s.key] * 100);
                return (
                  <div key={s.key} className="flex items-center gap-1.5 text-[9px] min-w-0">
                    <span className="w-3 text-center shrink-0" style={{ color }}>{s.icon}</span>
                    <span className="w-14 uppercase tracking-widest text-muted-foreground shrink-0 truncate">{s.label}</span>
                    <div className="flex-1 min-w-0 h-1 rounded-full bg-black/50 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
