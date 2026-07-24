import { useEffect, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { audio, playSfx, type AudioSettings } from "@/game/audio";
import { HudScaleSetting } from "@/components/HudScaleSetting";

interface Props {
  onClose: () => void;
}

export function AudioSettingsPanel({ onClose }: Props) {
  const [s, setS] = useState<AudioSettings>(audio.getSettings());

  useEffect(() => {
    const unsub = audio.subscribe(setS);
    return unsub;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (patch: Partial<AudioSettings>) => audio.setSettings(patch);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm card-in"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="stencil text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]">
            Áudio
          </div>
          <button onClick={onClose} className="btn-hud p-1.5" aria-label="Fechar">
            <X size={14} />
          </button>
        </div>

        <button
          onClick={() => { set({ muted: !s.muted }); if (s.muted) playSfx("click"); }}
          className="btn-hud w-full inline-flex items-center justify-center gap-2 py-2 mb-4 text-[11px] uppercase tracking-[0.25em]"
        >
          {s.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {s.muted ? "Som desativado" : "Som ativo"}
        </button>

        <SliderRow
          label="Volume geral"
          value={s.masterVolume}
          onChange={(v) => set({ masterVolume: v })}
          disabled={s.muted}
        />
        <SliderRow
          label="Efeitos"
          value={s.sfxVolume}
          onChange={(v) => set({ sfxVolume: v })}
          onCommit={() => playSfx("click")}
          disabled={s.muted}
        />
        <SliderRow
          label="Música"
          value={s.musicVolume}
          onChange={(v) => set({ musicVolume: v })}
          disabled={s.muted}
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { playSfx("bark"); }}
            className="btn-hud flex-1 py-1.5 text-[10px] uppercase tracking-[0.2em]"
          >
            Testar latido
          </button>
          <button
            onClick={() => { playSfx("explosion"); }}
            className="btn-hud flex-1 py-1.5 text-[10px] uppercase tracking-[0.2em]"
          >
            Testar explosão
          </button>
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <HudScaleSetting compact />
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  onCommit,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={() => onCommit?.()}
        onTouchEnd={() => onCommit?.()}
        className="w-full accent-[color:var(--accent)] disabled:opacity-40"
      />
    </div>
  );
}
