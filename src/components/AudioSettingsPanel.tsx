import { useEffect, useState } from "react";
import { Volume2, VolumeX, X, Music, Disc3, ShieldCheck, ExternalLink, Play, Check } from "lucide-react";
import { audio, playSfx, MUSIC_TRACKS, type AudioSettings } from "@/game/audio";

interface Props {
  onClose: () => void;
}

export function AudioSettingsPanel({ onClose }: Props) {
  const [s, setS] = useState<AudioSettings>(audio.getSettings());
  const [showCredits, setShowCredits] = useState(false);

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

  const onSelectTrack = (trackId: string) => {
    audio.setMusicTrack(trackId);
    playSfx("click");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm card-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-md p-4 sm:p-5 my-auto max-h-[90dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-[color:var(--accent)]" />
            <div className="stencil text-sm uppercase tracking-[0.25em] text-[color:var(--accent)]">
              Central de Áudio
            </div>
          </div>
          <button onClick={onClose} className="btn-hud p-1.5" aria-label="Fechar">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Mute Button */}
          <button
            onClick={() => {
              set({ muted: !s.muted });
              if (s.muted) playSfx("click");
            }}
            className={`btn-hud w-full inline-flex items-center justify-center gap-2 py-2 text-[11px] uppercase tracking-[0.2em] ${
              s.muted ? "opacity-75" : "btn-primary"
            }`}
          >
            {s.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {s.muted ? "Áudio desativado (Mudo)" : "Áudio ativo"}
          </button>

          {/* Sliders */}
          <div className="space-y-2.5">
            <SliderRow
              label="Volume geral"
              value={s.masterVolume}
              onChange={(v) => set({ masterVolume: v })}
              disabled={s.muted}
            />
            <SliderRow
              label="Efeitos sonoros & latidos"
              value={s.sfxVolume}
              onChange={(v) => set({ sfxVolume: v })}
              onCommit={() => playSfx("bark")}
              disabled={s.muted}
            />
            <SliderRow
              label="Música de fundo"
              value={s.musicVolume}
              onChange={(v) => set({ musicVolume: v })}
              disabled={s.muted}
            />
          </div>

          {/* Jukebox / Soundtracks Selection */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] stencil uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Disc3 size={13} className="text-[color:var(--team-green)]" />
                Trilha Sonora de Aventura
              </span>
              <button
                type="button"
                onClick={() => setShowCredits(!showCredits)}
                className="text-[9px] text-[color:var(--accent)] hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <ShieldCheck size={11} />
                {showCredits ? "Ocultar licenças" : "Ver licenças & créditos"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {MUSIC_TRACKS.map((t) => {
                const active = s.selectedTrackId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTrack(t.id)}
                    disabled={s.muted}
                    className={`btn-hud p-2 text-left flex items-center justify-between gap-2 transition-all ${
                      active
                        ? "is-selected border-[color:var(--accent)] bg-primary/10"
                        : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        {active && <Check size={12} className="text-[color:var(--accent)] shrink-0" />}
                        <span className="truncate">{t.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.subtitle}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground shrink-0 uppercase font-mono">
                      {t.license}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copyright & Licensing Drawer */}
          {showCredits && (
            <div className="panel p-3 bg-secondary/30 text-[10px] space-y-2 border border-border/60 card-in">
              <div className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck size={13} className="text-[color:var(--team-green)]" />
                Atribuição Legal & Direitos Autorais
              </div>
              <p className="text-muted-foreground leading-relaxed text-[10px]">
                Todas as músicas utilizadas no WarDogs são licenciadas legalmente sob{" "}
                <strong>Creative Commons Attribution 4.0 International (CC-BY 4.0)</strong> e{" "}
                <strong>Domínio Público (CC0)</strong>. Gravadas com instrumentação orquestral e acústica autêntica.
              </p>
              <div className="space-y-1 pt-1 border-t border-border/40 font-mono text-[9px] text-muted-foreground">
                <div>• <strong>Fiddles McGinty</strong> by Kevin MacLeod (incompetech.com) - CC-BY 4.0</div>
                <div>• <strong>Cartoon Battle</strong> by Kevin MacLeod (incompetech.com) - CC-BY 4.0</div>
                <div>• <strong>Arcadia</strong> by Kevin MacLeod (incompetech.com) - CC-BY 4.0</div>
                <div>• <strong>Life of Riley</strong> by Kevin MacLeod (incompetech.com) - CC-BY 4.0</div>
                <div>• <strong>Semper Fidelis</strong> by U.S. Marine Band - Public Domain (CC0)</div>
              </div>
            </div>
          )}

          {/* Test Buttons */}
          <div className="pt-1 flex gap-2 border-t border-border/40">
            <button
              onClick={() => {
                playSfx("bark");
              }}
              className="btn-hud flex-1 py-1.5 text-[10px] uppercase tracking-[0.2em]"
            >
              Testar latido
            </button>
            <button
              onClick={() => {
                playSfx("explosion");
              }}
              className="btn-hud flex-1 py-1.5 text-[10px] uppercase tracking-[0.2em]"
            >
              Testar explosão
            </button>
          </div>
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
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value * 100)}%</span>
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
