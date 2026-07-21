// WarDogs Audio — Web Audio procedural SFX + ambient music.
// No external assets: everything synthesized at runtime. Zero-latency, zero-bytes.

type SfxId =
  | "explosion"
  | "fire"
  | "bark"
  | "jump"
  | "hit"
  | "click"
  | "victory"
  | "defeat"
  | "barrage"
  | "teleport"
  | "rage";

export interface AudioSettings {
  masterVolume: number; // 0..1
  sfxVolume: number;    // 0..1
  musicVolume: number;  // 0..1
  muted: boolean;
}

const STORAGE_KEY = "wardogs.audio.v1";

const DEFAULTS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.35,
  muted: false,
};

function loadSettings(): AudioSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw);
    return {
      masterVolume: clamp01(p.masterVolume ?? DEFAULTS.masterVolume),
      sfxVolume: clamp01(p.sfxVolume ?? DEFAULTS.sfxVolume),
      musicVolume: clamp01(p.musicVolume ?? DEFAULTS.musicVolume),
      muted: !!p.muted,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private settings: AudioSettings = loadSettings();
  private listeners = new Set<(s: AudioSettings) => void>();
  private musicTrack: "menu" | "combat" | null = null;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private ready = false;

  getSettings(): AudioSettings { return { ...this.settings }; }

  subscribe(fn: (s: AudioSettings) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit() {
    const s = this.getSettings();
    this.listeners.forEach(fn => fn(s));
  }

  setSettings(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    this.applyGains();
    this.emit();
  }

  private applyGains() {
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(m, this.ctx.currentTime, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.02);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, this.ctx.currentTime, 0.02);
  }

  // Must be called from a user gesture. Safe to call multiple times.
  ensure() {
    if (this.ready) {
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();
      // Build a 2s white-noise buffer.
      const len = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.ready = true;
    } catch (err) {
      console.warn("[audio] failed to init", err);
    }
  }

  private now() { return this.ctx?.currentTime ?? 0; }

  private noiseSource() {
    if (!this.ctx || !this.noiseBuf) return null;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    return s;
  }

  play(id: SfxId, opts?: { gain?: number }) {
    if (!this.ready || !this.ctx) return;
    if (this.settings.muted) return;
    const t0 = this.now();
    const gainMul = opts?.gain ?? 1;
    switch (id) {
      case "explosion": this.sfxExplosion(t0, gainMul); break;
      case "fire":      this.sfxFire(t0, gainMul); break;
      case "bark":      this.sfxBark(t0, gainMul); break;
      case "jump":      this.sfxJump(t0, gainMul); break;
      case "hit":       this.sfxHit(t0, gainMul); break;
      case "click":     this.sfxClick(t0, gainMul); break;
      case "victory":   this.sfxFanfare(t0, gainMul, true); break;
      case "defeat":    this.sfxFanfare(t0, gainMul, false); break;
      case "barrage":   this.sfxBarrage(t0, gainMul); break;
      case "teleport":  this.sfxTeleport(t0, gainMul); break;
      case "rage":      this.sfxRage(t0, gainMul); break;
    }
  }

  // ============ SFX PRIMITIVES ============

  private envGain(t0: number, attack: number, decay: number, peak: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    return g;
  }

  private sfxExplosion(t0: number, mul: number) {
    const ctx = this.ctx!;
    // Low rumble (sine sweep down)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.exponentialRampToValueAtTime(30, t0 + 0.5);
    const oscG = this.envGain(t0, 0.005, 0.55, 0.9 * mul);
    osc.connect(oscG).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.7);

    // Noise burst through lowpass
    const noise = this.noiseSource(); if (!noise) return;
    const bp = ctx.createBiquadFilter();
    bp.type = "lowpass";
    bp.frequency.setValueAtTime(1800, t0);
    bp.frequency.exponentialRampToValueAtTime(200, t0 + 0.6);
    const nG = this.envGain(t0, 0.005, 0.7, 0.7 * mul);
    noise.connect(bp).connect(nG).connect(this.sfxGain);
    noise.start(t0); noise.stop(t0 + 0.8);
  }

  private sfxFire(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, t0);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.22);
    const g = this.envGain(t0, 0.005, 0.22, 0.55 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.3);

    const noise = this.noiseSource(); if (!noise) return;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.setValueAtTime(2400, t0);
    hp.frequency.exponentialRampToValueAtTime(700, t0 + 0.2);
    const nG = this.envGain(t0, 0.005, 0.2, 0.5 * mul);
    noise.connect(hp).connect(nG).connect(this.sfxGain);
    noise.start(t0); noise.stop(t0 + 0.3);
  }

  private sfxBark(t0: number, mul: number) {
    const ctx = this.ctx!;
    // "Woof" via two quick formant blips (open-close vowel).
    const play = (start: number, f: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f * 0.6, start);
      osc.frequency.exponentialRampToValueAtTime(f, start + 0.02);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, start + dur);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 2;
      const g = this.envGain(start, 0.01, dur, vol * mul);
      osc.connect(bp).connect(g).connect(this.sfxGain);
      osc.start(start); osc.stop(start + dur + 0.05);
    };
    play(t0, 220, 0.12, 0.55);
    play(t0 + 0.09, 180, 0.18, 0.45);
  }

  private sfxJump(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(720, t0 + 0.14);
    const g = this.envGain(t0, 0.005, 0.16, 0.32 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.2);
  }

  private sfxHit(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.15);
    const g = this.envGain(t0, 0.003, 0.18, 0.5 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.22);
  }

  private sfxClick(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1400, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.05);
    const g = this.envGain(t0, 0.002, 0.06, 0.18 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.08);
  }

  private sfxFanfare(t0: number, mul: number, up: boolean) {
    const ctx = this.ctx!;
    const notes = up ? [392, 523, 659, 784] : [392, 330, 262, 220];
    notes.forEach((f, i) => {
      const start = t0 + i * 0.18;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = f;
      const g = this.envGain(start, 0.01, 0.32, 0.28 * mul);
      osc.connect(g).connect(this.sfxGain);
      osc.start(start); osc.stop(start + 0.4);
    });
  }

  private sfxBarrage(t0: number, mul: number) {
    // Siren whoop
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.linearRampToValueAtTime(880, t0 + 0.4);
    osc.frequency.linearRampToValueAtTime(320, t0 + 0.9);
    const g = this.envGain(t0, 0.02, 1.0, 0.35 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 1.1);
    // Rolling explosions
    for (let i = 0; i < 5; i++) {
      const t = t0 + 1.0 + i * 0.22 + Math.random() * 0.06;
      this.sfxExplosion(t, mul * 0.8);
    }
  }

  private sfxTeleport(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(2200, t0 + 0.35);
    const g = this.envGain(t0, 0.01, 0.4, 0.35 * mul);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.5);
  }

  private sfxRage(t0: number, mul: number) {
    const ctx = this.ctx!;
    for (let k = 0; k < 3; k++) {
      const start = t0 + k * 0.09;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110 * (1 + k * 0.15), start);
      osc.frequency.exponentialRampToValueAtTime(55, start + 0.28);
      const g = this.envGain(start, 0.005, 0.3, 0.4 * mul);
      osc.connect(g).connect(this.sfxGain);
      osc.start(start); osc.stop(start + 0.35);
    }
  }

  // ============ MUSIC (procedural loop) ============

  playMusic(track: "menu" | "combat") {
    if (!this.ready || !this.ctx) return;
    if (this.musicTrack === track) return;
    this.stopMusic();
    this.musicTrack = track;
    this.scheduleMusicBar();
  }

  stopMusic() {
    this.musicTrack = null;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
    // musicGain nodes fade naturally; nothing scheduled after this call will connect.
  }

  private scheduleMusicBar() {
    if (!this.ctx || !this.musicTrack) return;
    const isCombat = this.musicTrack === "combat";
    // Bar timing
    const bpm = isCombat ? 128 : 92;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const t0 = this.now() + 0.05;

    // Chord progression (minor, tactical vibe)
    const roots = isCombat
      ? [55, 55, 65.4, 61.7]      // A1 A1 C2 B1
      : [55, 65.4, 49, 55];       // A1 C2 G1 A1
    const root = roots[Math.floor((t0 / bar) % roots.length)];

    // Bass line — root on 1, root*1.5 on 3
    this.noteMusic(t0,              root,       beat * 0.9, 0.25, "sawtooth", 220);
    this.noteMusic(t0 + beat * 2,   root * 1.5, beat * 0.9, 0.22, "sawtooth", 220);

    // Pad — chord (fifth + minor third octave up)
    this.noteMusic(t0, root * 2,        bar * 0.95, 0.09, "sine", 800);
    this.noteMusic(t0, root * 2 * 1.19, bar * 0.95, 0.07, "sine", 900); // ~min third
    this.noteMusic(t0, root * 3,        bar * 0.95, 0.06, "sine", 1200);

    // Combat drums — kick + hat
    if (isCombat) {
      for (let b = 0; b < 4; b++) {
        this.kick(t0 + b * beat, 0.35);
      }
      for (let b = 0; b < 8; b++) {
        this.hat(t0 + b * (beat / 2), 0.08);
      }
    } else {
      // Menu — soft sub pulse
      this.kick(t0, 0.15);
      this.kick(t0 + beat * 2, 0.15);
    }

    // Schedule next bar
    this.musicTimer = setTimeout(() => this.scheduleMusicBar(), bar * 1000 - 20);
  }

  private noteMusic(start: number, freq: number, dur: number, vol: number, type: OscillatorType, cutoff: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(lp).connect(g).connect(this.musicGain);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  private kick(start: number, vol: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, start);
    osc.frequency.exponentialRampToValueAtTime(40, start + 0.15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    osc.connect(g).connect(this.musicGain);
    osc.start(start); osc.stop(start + 0.25);
  }

  private hat(start: number, vol: number) {
    if (!this.ctx || !this.noiseBuf) return;
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
    n.connect(hp).connect(g).connect(this.musicGain);
    n.start(start); n.stop(start + 0.08);
  }
}

export const audio = new AudioManager();

// Convenience helper — safe to call before ensure().
export function playSfx(id: SfxId, gain?: number) {
  audio.play(id, gain !== undefined ? { gain } : undefined);
}
