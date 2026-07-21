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
}

const ONOMATOPEIAS = ["POW!", "BARK!", "GRRR!", "BOOM!", "WOOF!", "BAM!", "HISS!", "RAWR!"];

export function ComicIntro({ chars, scenarioLabel, bgImage, onDone }: Props) {
  const [a, b] = chars;
  const A = CHARACTERS[a];
  const B = CHARACTERS[b];
  const [dlg] = useState(() => pickDialogue(a, b));
  const [panel, setPanel] = useState(0); // 0,1,2
  const [ready, setReady] = useState(false);

  // Onomatopeia aleatória por painel (40% de chance cada)
  const [fx] = useState(() => ({
    a: Math.random() < 0.4 ? ONOMATOPEIAS[Math.floor(Math.random() * ONOMATOPEIAS.length)] : null,
    b: Math.random() < 0.4 ? ONOMATOPEIAS[Math.floor(Math.random() * ONOMATOPEIAS.length)] : null,
  }));

  useEffect(() => {
    const t1 = setTimeout(() => setPanel(1), 900);
    const t2 = setTimeout(() => setPanel(2), 1900);
    const t3 = setTimeout(() => setReady(true), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      if ((e.key === "Enter" || e.key === " ") && ready) onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone, ready]);

  const bgStyle: React.CSSProperties = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(180deg,#0e141c,#050709)" };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-1 sm:p-4 md:p-6 gap-2 sm:gap-3 overflow-hidden">
      <div
        className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 w-full select-none"
        style={{
          height: "min(72dvh, 620px)",
          maxWidth: "min(100%, calc(min(72dvh, 620px) * 9 / 4))",
        }}
      >
        <div className="min-w-0 min-h-0">
          <ComicPanel
            visible={panel >= 0}
            rotate={-1.2}
            bgStyle={bgStyle}
            side="left"
            portrait={A.comicPortraitUrl ?? A.portraitUrl}
            name={A.name}
            color={A.skin.teamColor}
            text={dlg.challenge}
            fx={fx.a}
          />
        </div>
        <div className="min-w-0 min-h-0">
          <ComicPanel
            visible={panel >= 1}
            rotate={1.4}
            bgStyle={bgStyle}
            side="right"
            portrait={B.comicPortraitUrl ?? B.portraitUrl}
            name={B.name}
            color={B.skin.teamColor}
            text={dlg.reply}
            fx={fx.b}
          />
        </div>
        <div className="min-w-0 min-h-0">
          <VsPanel visible={panel >= 2} scenarioLabel={scenarioLabel} colorA={A.skin.teamColor} colorB={B.skin.teamColor} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 sm:gap-3 mt-1 sm:mt-2 shrink-0">
        <button
          onClick={onDone}
          disabled={!ready}
          className={`btn-hud btn-primary uppercase tracking-[0.28em] transition-all ${
            ready ? "animate-pulse shadow-[0_0_24px_rgba(255,180,80,0.55)]" : "opacity-40 cursor-not-allowed"
          }`}
          style={{
            fontSize: "clamp(11px, 2.2vw, 15px)",
            padding: "clamp(8px, 1.4vh, 14px) clamp(18px, 4vw, 32px)",
            minHeight: 44,
          }}
        >
          {ready ? "▶ Iniciar Batalha" : "Preparando..."}
        </button>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onDone}
            className="btn-hud text-[10px] uppercase tracking-[0.3em] px-3 py-1.5 opacity-80"
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
    </div>
  );
}

function SpeechBubble({ text, side }: { text: string; side: "left" | "right" }) {
  const shout = /!!|!\s*$/.test(text.trim());
  // rabinho aponta para o personagem: painel esquerdo → tail no canto inferior-esquerdo (personagem à esquerda)
  const tailOnLeft = side === "left";
  // rotação suave estilo desenhada à mão
  const rot = tailOnLeft ? -2 : 2;

  return (
    <div
      className={`absolute top-1.5 ${side === "left" ? "right-1.5" : "left-1.5"} z-20`}
      style={{ maxWidth: "78%", transform: `rotate(${rot}deg)` }}
    >
      <div
        className={`relative bg-white text-black border-[3px] border-black px-2.5 py-1.5 ${shout ? "rounded-md" : "rounded-2xl"}`}
        style={{
          boxShadow: "4px 4px 0 0 #000",
          fontFamily: "var(--font-comic)",
          fontWeight: 700,
          lineHeight: 1.1,
          fontSize: "clamp(11px, 1.9vw, 16px)",
          letterSpacing: shout ? "0.03em" : "0",
          fontStyle: shout ? "italic" : "normal",
          textTransform: shout ? "uppercase" : "none",
        }}
      >
        {text}
        {/* Rabinho do balão — dois triângulos SVG sobrepostos (contorno + preenchimento) */}
        <svg
          width="28"
          height="22"
          viewBox="0 0 28 22"
          className="absolute"
          style={{
            [tailOnLeft ? "left" : "right"]: "18px",
            bottom: "-19px",
            transform: tailOnLeft ? "none" : "scaleX(-1)",
          }}
          aria-hidden
        >
          {/* Contorno preto */}
          <path d="M2 0 L26 0 L4 21 Z" fill="#000" />
          {/* Preenchimento branco (menor, offset para deixar borda visível) */}
          <path d="M6 -1 L24 -1 L8 18 Z" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}

function ComicPanel({
  visible, rotate, bgStyle, side, portrait, name, color, text, fx,
}: {
  visible: boolean; rotate: number; bgStyle: React.CSSProperties;
  side: "left" | "right"; portrait: string; name: string; color: string; text: string; fx: string | null;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-md border-[3px] border-black bg-black shadow-[6px_6px_0_rgba(0,0,0,0.9)] h-full w-full transition-all duration-300"
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
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[86%] max-w-[92%] w-auto h-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
      />

      {/* Onomatopeia opcional */}
      {fx && (
        <div
          className={`absolute z-10 pointer-events-none ${side === "left" ? "top-2 left-2" : "top-2 right-2"}`}
          style={{
            fontFamily: "var(--font-comic-title)",
            fontSize: "clamp(18px, 3.4vw, 30px)",
            color: "#FFD84D",
            WebkitTextStroke: "2px #000",
            textShadow: "3px 3px 0 #000",
            transform: `rotate(${side === "left" ? -8 : 8}deg)`,
            letterSpacing: "0.04em",
          }}
        >
          {fx}
        </div>
      )}

      <SpeechBubble text={text} side={side} />

      <div
        className="absolute bottom-1.5 left-1.5 tracking-widest px-1.5 py-0.5 bg-black/80 border-2 border-white/30 rounded"
        style={{
          color,
          fontFamily: "var(--font-comic-title)",
          fontSize: "clamp(11px, 1.7vw, 16px)",
          letterSpacing: "0.08em",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function VsPanel({ visible, scenarioLabel, colorA, colorB }: { visible: boolean; scenarioLabel?: string; colorA: string; colorB: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-md border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.9)] h-full w-full transition-all duration-300 flex items-center justify-center"
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
          className="font-black leading-none"
          style={{
            fontFamily: "var(--font-comic-title)",
            fontSize: "clamp(44px, min(13vw, 20vh), 180px)",
            color: "#fff",
            textShadow: `4px 4px 0 #000, 8px 8px 0 ${colorA}, -4px -4px 0 ${colorB}`,
            letterSpacing: "0.05em",
          }}
        >
          VS
        </div>
        {scenarioLabel && (
          <div
            className="mt-2 stencil tracking-[0.3em] text-white/90 bg-black/60 inline-block px-2 py-1 border border-white/20 rounded truncate max-w-full"
            style={{ fontSize: "clamp(8px, 1.4vw, 13px)" }}
          >
            {scenarioLabel}
          </div>
        )}
      </div>
    </div>
  );
}
