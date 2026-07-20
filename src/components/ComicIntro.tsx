import { useEffect, useState } from "react";
import { CHARACTERS, type CharacterId } from "@/game/characters";
import { pickDialogue } from "@/game/dialogues";

const SKIP_KEY = "wardogs.skipIntro";

export function shouldSkipIntro(): boolean {
  try { return localStorage.getItem(SKIP_KEY) === "1"; } catch { return false; }
}
export function setSkipIntro(v: boolean) {
  try { localStorage.setItem(SKIP_KEY, v ? "1" : "0"); } catch {
    /* ignore */
  }
}

interface Props {
  chars: [CharacterId, CharacterId];
  scenarioLabel?: string;
  bgImage?: string;
  onDone: () => void;
  autoMs?: number;
}

export function ComicIntro({ chars, scenarioLabel, bgImage, onDone, autoMs = 4800 }: Props) {
  const [a, b] = chars;
  const A = CHARACTERS[a];
  const B = CHARACTERS[b];
  const [dlg] = useState(() => pickDialogue(a, b));
  const [panel, setPanel] = useState(0); // 0,1,2

  useEffect(() => {
    const t1 = setTimeout(() => setPanel(1), 1100);
    const t2 = setTimeout(() => setPanel(2), 2400);
    const t3 = setTimeout(() => onDone(), autoMs);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone, autoMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  const bgStyle: React.CSSProperties = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(180deg,#0e141c,#050709)" };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3 sm:p-6 gap-3">
      <div
        onClick={onDone}
        className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-5xl cursor-pointer select-none"
        role="button"
        aria-label="Pular introdução"
      >
        <ComicPanel
          visible={panel >= 0}
          rotate={-1.2}
          bgStyle={bgStyle}
          side="left"
          portrait={A.portraitUrl}
          name={A.name}
          color={A.skin.teamColor}
          text={dlg.challenge}
        />
        <ComicPanel
          visible={panel >= 1}
          rotate={1.4}
          bgStyle={bgStyle}
          side="right"
          portrait={B.portraitUrl}
          name={B.name}
          color={B.skin.teamColor}
          text={dlg.reply}
        />
        <VsPanel visible={panel >= 2} scenarioLabel={scenarioLabel} colorA={A.skin.teamColor} colorB={B.skin.teamColor} />
      </div>

      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={onDone}
          className="btn-hud text-[11px] uppercase tracking-[0.3em] px-3 py-1.5"
        >
          Pular ▶
        </button>
        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={shouldSkipIntro()}
            onChange={(e) => setSkipIntro(e.target.checked)}
            className="accent-[color:var(--accent)]"
          />
          Não mostrar mais
        </label>
      </div>
    </div>
  );
}

function ComicPanel({
  visible, rotate, bgStyle, side, portrait, name, color, text,
}: {
  visible: boolean; rotate: number; bgStyle: React.CSSProperties;
  side: "left" | "right"; portrait: string; name: string; color: string; text: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-md border-[3px] border-black bg-black shadow-[6px_6px_0_rgba(0,0,0,0.9)] aspect-[3/4] transition-all duration-300"
      style={{
        transform: `rotate(${rotate}deg) scale(${visible ? 1 : 0.9})`,
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="absolute inset-0" style={bgStyle} aria-hidden />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at ${side === "left" ? "20%" : "80%"} 60%, ${color}55 0%, transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.7))`,
        }}
        aria-hidden
      />
      <img
        src={portrait}
        alt={name}
        className={`absolute bottom-0 ${side === "left" ? "left-0" : "right-0"} h-[85%] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]`}
        style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}
      />
      <div
        className={`absolute top-2 ${side === "left" ? "right-2" : "left-2"} max-w-[62%] bg-white text-black px-2 py-1.5 border-[2px] border-black rounded-md text-[11px] sm:text-[13px] leading-tight font-bold`}
        style={{ boxShadow: "3px 3px 0 rgba(0,0,0,0.9)" }}
      >
        {text}
        <span
          className={`absolute w-3 h-3 bg-white border-[2px] border-black rotate-45 -bottom-2 ${side === "left" ? "right-6" : "left-6"}`}
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
          aria-hidden
        />
      </div>
      <div className="absolute bottom-1.5 left-1.5 stencil text-[11px] tracking-widest px-1.5 py-0.5 bg-black/70 border border-white/20 rounded"
           style={{ color }}>
        {name}
      </div>
    </div>
  );
}

function VsPanel({ visible, scenarioLabel, colorA, colorB }: { visible: boolean; scenarioLabel?: string; colorA: string; colorB: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-md border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.9)] aspect-[3/4] transition-all duration-300 flex items-center justify-center"
      style={{
        transform: `scale(${visible ? 1 : 0.85})`,
        opacity: visible ? 1 : 0,
        background: `repeating-linear-gradient(45deg, #111 0 10px, #1a1a1a 10px 20px)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(80% 60% at 30% 40%, ${colorA}44 0%, transparent 60%), radial-gradient(80% 60% at 70% 60%, ${colorB}44 0%, transparent 60%)`,
        }}
        aria-hidden
      />
      <div className="relative text-center">
        <div
          className="stencil font-black leading-none"
          style={{
            fontSize: "clamp(72px, 18vw, 180px)",
            color: "#fff",
            textShadow: `4px 4px 0 #000, 8px 8px 0 ${colorA}, -4px -4px 0 ${colorB}`,
            letterSpacing: "0.05em",
          }}
        >
          VS
        </div>
        {scenarioLabel && (
          <div className="mt-2 stencil text-[11px] sm:text-sm tracking-[0.35em] text-white/90 bg-black/60 inline-block px-2 py-1 border border-white/20 rounded">
            {scenarioLabel}
          </div>
        )}
      </div>
    </div>
  );
}
