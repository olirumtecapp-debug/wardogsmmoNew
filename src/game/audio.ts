import { REAL_DOG_BARKS } from "./dog_sounds";

export type SfxId =
  | "explosion"
  | "explosion_rocket"
  | "explosion_grenade"
  | "explosion_mortar"
  | "explosion_small"
  | "fire"
  | "fire_gun"
  | "fire_rocket"
  | "fire_grenade"
  | "fire_mortar"
  | "fire_bow"
  | "whistle"
  | "impact_thud"
  | "bark"
  | "bark_heavy"
  | "bark_medium"
  | "bark_light"
  | "bark_hurt"
  | "bark_win"
  | "jump"
  | "hit"
  | "click"
  | "victory"
  | "defeat"
  | "barrage"
  | "teleport"
  | "rage"
  | "shield_activate"
  | "shield_hit";

export interface MusicTrackInfo {
  id: string;
  name: string;
  subtitle: string;
  artist: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  file: string;
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  {
    id: "fiddles_mcginty",
    name: "Fiddles McGinty",
    subtitle: "Aventura Celta Animada & Violinos",
    artist: "Kevin MacLeod (incompetech.com)",
    license: "CC-BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400051",
    file: "music_fiddles_mcginty.mp3",
  },
  {
    id: "cartoon_battle",
    name: "Cartoon Battle",
    subtitle: "Tática Dinâmica & Aventura Cômica",
    artist: "Kevin MacLeod (incompetech.com)",
    license: "CC-BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100693",
    file: "music_adventure_war.mp3",
  },
  {
    id: "arcadia",
    name: "Arcadia",
    subtitle: "Jornada Épica & Cordas",
    artist: "Kevin MacLeod (incompetech.com)",
    license: "CC-BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100007",
    file: "music_arcadia.mp3",
  },
  {
    id: "life_of_riley",
    name: "Life of Riley",
    subtitle: "Acústico Alegre & Descontraído",
    artist: "Kevin MacLeod (incompetech.com)",
    license: "CC-BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400054",
    file: "music_life_of_riley.mp3",
  },
  {
    id: "military_march",
    name: "Semper Fidelis",
    subtitle: "Marcha Heroica de Metais",
    artist: "United States Marine Band",
    license: "Domínio Público (CC0)",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sousa%27s_%22Semper_Fidelis%22_-_United_States_Marine_Band_(2016).mp3",
    file: "music_military_march.mp3",
  },
];

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  selectedTrackId: string;
  muted: boolean;
}

const STORAGE_KEY = "wardogs.audio.v1";

const DEFAULTS: AudioSettings = {
  masterVolume: 0.85,
  sfxVolume: 0.95,
  musicVolume: 0.45,
  selectedTrackId: "fiddles_mcginty",
  muted: false,
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

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
      selectedTrackId: p.selectedTrackId ?? DEFAULTS.selectedTrackId,
      muted: !!p.muted,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// =========================================================================
// ACOUSTIC BUFFER BUILDERS (IN-MEMORY PCM GENERATION)
// =========================================================================

function buildDogBarkBuffer(
  ctx: AudioContext,
  basePitch: number,
  formant1: number,
  formant2: number,
  duration = 0.24,
  rasp = 0.38,
  multiCount = 2,
  spacing = 0.12
): AudioBuffer {
  const sr = ctx.sampleRate;
  const totalLen = Math.floor(sr * (spacing * multiCount + duration + 0.1));
  const buffer = ctx.createBuffer(1, totalLen, sr);
  const out = buffer.getChannelData(0);

  for (let bIdx = 0; bIdx < multiCount; bIdx++) {
    const startSample = Math.floor(bIdx * spacing * sr);
    const barkSamples = Math.floor(duration * sr);
    const raw = new Float32Array(barkSamples);
    let phase = 0;

    for (let i = 0; i < barkSamples; i++) {
      const t = i / sr;
      const normT = t / duration;

      // Realistic canine pitch curve: sharp explosive vocal burst then exponential throat drop
      const pitch =
        normT < 0.08
          ? basePitch * (0.85 + 0.35 * (normT / 0.08))
          : basePitch * 1.2 * Math.exp(-3.8 * (normT - 0.08));

      const jitter = 1.0 + (Math.random() - 0.5) * 0.08 * rasp;
      phase += (pitch * jitter) / sr;
      if (phase >= 1.0) phase -= 1.0;

      // Glottal pulse waveform
      let glottal = 0;
      if (phase < 0.4) {
        glottal = 0.5 * (1.0 - Math.cos((Math.PI * phase) / 0.4));
      } else if (phase < 0.6) {
        glottal = Math.cos((Math.PI * (phase - 0.4)) / 0.2);
      }

      const turbulence = (Math.random() * 2 - 1) * rasp * 0.45;
      const excitation = glottal + turbulence;

      // Envelope
      let env = 0;
      if (normT < 0.04) {
        env = normT / 0.04;
      } else if (normT < 0.38) {
        env = 1.0 - 0.2 * ((normT - 0.04) / 0.34);
      } else {
        env = 0.8 * Math.exp(-8.5 * (normT - 0.38));
      }

      raw[i] = excitation * env;
    }

    // Apply Bi-quad Formant Filters (F1: Throat, F2: Mouth opening)
    const applyFormant = (data: Float32Array, fCenter: number, q: number): Float32Array => {
      const w0 = (2.0 * Math.PI * fCenter) / sr;
      const alpha = Math.sin(w0) / (2.0 * q);
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1.0 + alpha;
      const a1 = -2.0 * Math.cos(w0);
      const a2 = 1.0 - alpha;

      const res = new Float32Array(data.length);
      let x1 = 0,
        x2 = 0,
        y1 = 0,
        y2 = 0;
      for (let j = 0; j < data.length; j++) {
        const x = data[j];
        const y =
          (b0 / a0) * x +
          (b1 / a0) * x1 +
          (b2 / a0) * x2 -
          (a1 / a0) * y1 -
          (a2 / a0) * y2;
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
        res[j] = y;
      }
      return res;
    };

    const f1Out = applyFormant(raw, formant1, 2.4);
    const f2Out = applyFormant(raw, formant2, 3.2);

    for (let i = 0; i < barkSamples; i++) {
      if (startSample + i < totalLen) {
        const val = f1Out[i] * 0.65 + f2Out[i] * 0.4 + raw[i] * 0.15;
        out[startSample + i] += val;
      }
    }
  }

  // Normalize
  let maxA = 0;
  for (let i = 0; i < totalLen; i++) maxA = Math.max(maxA, Math.abs(out[i]));
  if (maxA > 0) {
    const scale = 0.92 / maxA;
    for (let i = 0; i < totalLen; i++) out[i] *= scale;
  }

  return buffer;
}

function buildHurtYelpBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.36;
  const len = Math.floor(sr * dur);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const normT = t / dur;
    const pitch = 620 * Math.exp(-2.6 * normT);
    phase += pitch / sr;
    if (phase >= 1.0) phase -= 1.0;

    const s = Math.sin(2 * Math.PI * phase) + 0.35 * Math.sin(4 * Math.PI * phase);
    const tremolo = 1.0 + 0.25 * Math.sin(2 * Math.PI * 19 * t);
    const env = Math.sin(Math.PI * Math.pow(normT, 0.45)) * Math.exp(-3.2 * normT);
    out[i] = s * tremolo * env * 0.85;
  }
  return buffer;
}

function buildExplosionBuffer(
  ctx: AudioContext,
  subBass: number,
  duration = 1.1,
  shrapnel = false
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  let subPhase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const normT = t / duration;

    // Sub-bass thump (concussive shockwave)
    const freq = subBass * Math.exp(-3.8 * normT);
    subPhase += freq / sr;
    const subEnv = Math.exp(-4.2 * normT);
    const sub = Math.sin(2 * Math.PI * subPhase) * subEnv * 1.3;

    // Blast noise
    const noise = (Math.random() * 2 - 1) * Math.exp(-7.5 * normT);

    // Debris & shrapnel
    let debris = 0;
    if (normT > 0.06 && Math.random() < 0.3 * (1 - normT)) {
      debris = (Math.random() * 2 - 1) * Math.exp(-2.6 * normT) * 0.7;
    }
    let ring = 0;
    if (shrapnel) {
      ring = Math.sin(2 * Math.PI * 3400 * t) * Math.exp(-9.0 * normT) * 0.4;
    }

    out[i] = sub + noise * 1.2 + debris + ring;
  }

  // Normalize
  let maxA = 0;
  for (let i = 0; i < len; i++) maxA = Math.max(maxA, Math.abs(out[i]));
  if (maxA > 0) {
    const scale = 0.94 / maxA;
    for (let i = 0; i < len; i++) out[i] *= scale;
  }
  return buffer;
}

function buildGunFireBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.32;
  const len = Math.floor(sr * dur);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const normT = t / dur;
    const crack = (Math.random() * 2 - 1) * Math.exp(-24 * normT);
    const punch =
      Math.sin(2 * Math.PI * (190 * Math.exp(-12 * normT)) * t) *
      Math.exp(-14 * normT);
    const tail = (Math.random() * 2 - 1) * Math.exp(-6 * normT) * 0.3;
    out[i] = (crack * 1.3 + punch * 0.9 + tail) * 0.85;
  }
  return buffer;
}

function buildRocketFireBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.52;
  const len = Math.floor(sr * dur);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const normT = t / dur;
    const freq = 150 + 520 * Math.pow(normT, 1.4);
    const flame =
      (Math.random() * 2 - 1) * (0.35 + 0.65 * Math.sin(Math.PI * normT));
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.45;
    out[i] = (flame + tone) * Math.sin(Math.PI * normT) * 0.88;
  }
  return buffer;
}

function buildBowFireBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.38;
  const len = Math.floor(sr * dur);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const normT = t / dur;
    const stringFreq = 290 * (1.0 + 0.05 * Math.sin(2 * Math.PI * 36 * t));
    const twang = Math.sin(2 * Math.PI * stringFreq * t) * Math.exp(-11 * normT);
    const whistle =
      Math.sin(2 * Math.PI * (1650 + 400 * normT) * t) *
      Math.exp(-8 * normT) *
      0.35;
    out[i] = (twang * 1.1 + whistle) * 0.85;
  }
  return buffer;
}

function buildMusicBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const bpm = 120;
  const beatsPerBar = 4;
  const bars = 8;
  const totalBeats = bars * beatsPerBar;
  const beatDur = 60 / bpm;
  const totalDur = totalBeats * beatDur;
  const len = Math.floor(sr * totalDur);
  const buffer = ctx.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);

  // Snare roll & beats
  for (let b = 0; b < totalBeats; b++) {
    const beatT = b * beatDur;
    for (let sub = 0; sub < 4; sub++) {
      const noteT = beatT + sub * (beatDur / 4);
      const isAccent = (sub === 0 && b % 2 === 1) || (sub === 2 && b % 4 === 3);
      const snareDur = isAccent ? 0.12 : 0.06;
      const vol = isAccent ? 0.45 : sub === 2 ? 0.2 : 0.12;

      const startI = Math.floor(noteT * sr);
      const durI = Math.floor(snareDur * sr);
      for (let j = 0; j < durI; j++) {
        if (startI + j < len) {
          const sT = j / sr;
          const noise = (Math.random() * 2 - 1) * Math.exp(-28 * sT);
          const body = Math.sin(2 * Math.PI * 210 * sT) * Math.exp(-32 * sT) * 0.6;
          out[startI + j] += (noise + body) * vol;
        }
      }
    }
  }

  // Bass taiko drums (Beats 1 & 3)
  for (let b = 0; b < totalBeats; b += 2) {
    const beatT = b * beatDur;
    const startI = Math.floor(beatT * sr);
    const durI = Math.floor(0.6 * sr);
    for (let j = 0; j < durI; j++) {
      if (startI + j < len) {
        const timpT = j / sr;
        const freq = 68 * Math.exp(-3.5 * timpT);
        out[startI + j] += Math.sin(2 * Math.PI * freq * timpT) * Math.exp(-4.5 * timpT) * 0.6;
      }
    }
  }

  // Heroic Horns & Brass Chords (Dm - F - C - G / Dm - Bb - F - A)
  const CHORDS = [
    [146.83, 220.0, 293.66, 349.23],
    [174.61, 220.0, 261.63, 349.23],
    [130.81, 196.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 392.0],
    [146.83, 220.0, 293.66, 349.23],
    [116.54, 233.08, 293.66, 349.23],
    [174.61, 220.0, 261.63, 349.23],
    [110.0, 220.0, 277.18, 329.63],
  ];

  for (let bar = 0; bar < bars; bar++) {
    const freqs = CHORDS[bar % CHORDS.length];
    const barStartT = bar * (beatsPerBar * beatDur);
    const startI = Math.floor(barStartT * sr);
    const durI = Math.floor(beatsPerBar * beatDur * sr);

    for (let j = 0; j < durI; j++) {
      if (startI + j < len) {
        const t = j / sr;
        const normT = t / (beatsPerBar * beatDur);
        let chord = 0;
        for (const f of freqs) {
          const vib = 1.0 + 0.005 * Math.sin(2 * Math.PI * 5.2 * t);
          const h1 = Math.sin(2 * Math.PI * f * vib * t) * 0.4;
          const h2 = Math.sin(2 * Math.PI * f * 2 * vib * t) * 0.22;
          const h3 = Math.sin(2 * Math.PI * f * 3 * vib * t) * 0.1;
          chord += h1 + h2 + h3;
        }
        const env = Math.sin(Math.PI * Math.pow(normT, 0.6)) * 0.24;
        out[startI + j] += chord * env;
      }
    }
  }

  // Normalize music
  let maxA = 0;
  for (let i = 0; i < len; i++) maxA = Math.max(maxA, Math.abs(out[i]));
  if (maxA > 0) {
    const scale = 0.85 / maxA;
    for (let i = 0; i < len; i++) out[i] *= scale;
  }
  return buffer;
}


// =========================================================================
// AUDIO MANAGER CLASS
// =========================================================================

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private masterComp!: DynamicsCompressorNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private settings: AudioSettings = loadSettings();
  private listeners = new Set<(s: AudioSettings) => void>();
  private musicTrack: "menu" | "combat" | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private ready = false;

  constructor() {
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.ensure();
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  subscribe(fn: (s: AudioSettings) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const s = this.getSettings();
    this.listeners.forEach((fn) => fn(s));
  }

  setSettings(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignore */
    }
    this.applyGains();
    this.emit();
  }

  private applyGains() {
    if (this.bgAudio) {
      const vol = this.settings.muted
        ? 0
        : clamp01(this.settings.masterVolume * this.settings.musicVolume);
      this.bgAudio.volume = vol;
    }
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(m, this.ctx.currentTime, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.02);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, this.ctx.currentTime, 0.02);
  }

  ensure() {
    try {
      if (!this.ctx) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctx();

        this.masterGain = this.ctx.createGain();
        this.masterComp = this.ctx.createDynamicsCompressor();
        this.masterComp.threshold.value = -10;
        this.masterComp.knee.value = 6;
        this.masterComp.ratio.value = 3.5;
        this.masterComp.attack.value = 0.003;
        this.masterComp.release.value = 0.1;

        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterComp);
        this.musicGain.connect(this.masterComp);
        this.masterComp.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.applyGains();
        this.generateAllBuffers();
        this.ready = true;
      }

      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
    } catch (err) {
      console.warn("[audio] failed to init audio context", err);
    }
  }

  private generateAllBuffers() {
    if (!this.ctx) return;
    try {
      // 1. Canine barks (Acoustic vocal tract model)
      this.bufferCache.set("bark_heavy", buildDogBarkBuffer(this.ctx, 140, 520, 980, 0.24, 0.45, 2, 0.14));
      this.bufferCache.set("bark_medium", buildDogBarkBuffer(this.ctx, 230, 780, 1450, 0.18, 0.32, 2, 0.11));
      this.bufferCache.set("bark_light", buildDogBarkBuffer(this.ctx, 310, 1050, 1850, 0.14, 0.26, 2, 0.09));
      this.bufferCache.set("bark_hurt", buildHurtYelpBuffer(this.ctx));
      this.bufferCache.set("bark_win", buildDogBarkBuffer(this.ctx, 270, 880, 1550, 0.16, 0.22, 3, 0.13));

      // 2. Explosions (Concussive physics)
      this.bufferCache.set("explosion_rocket", buildExplosionBuffer(this.ctx, 110, 1.2, false));
      this.bufferCache.set("explosion_grenade", buildExplosionBuffer(this.ctx, 85, 0.85, true));
      this.bufferCache.set("explosion_mortar", buildExplosionBuffer(this.ctx, 140, 1.4, false));

      // 3. Weapons
      this.bufferCache.set("fire_gun", buildGunFireBuffer(this.ctx));
      this.bufferCache.set("fire_rocket", buildRocketFireBuffer(this.ctx));
      this.bufferCache.set("fire_mortar", buildExplosionBuffer(this.ctx, 130, 0.45, false));
      this.bufferCache.set("fire_bow", buildBowFireBuffer(this.ctx));

      // 4. Music
      this.bufferCache.set("music_adventure_war", buildMusicBuffer(this.ctx));
    } catch (e) {
      console.warn("[audio] Buffer generation error:", e);
    }
  }

  private playBuffer(bufKey: string, volume = 1.0, pitchVariation = 0.04) {
    this.ensure();
    if (!this.ctx || this.settings.muted) return;

    let buf = this.bufferCache.get(bufKey);
    if (!buf) {
      this.generateAllBuffers();
      buf = this.bufferCache.get(bufKey);
    }
    if (!buf) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      if (pitchVariation > 0) {
        source.playbackRate.value = 1.0 + (Math.random() - 0.5) * pitchVariation;
      }
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = Math.max(0, Math.min(2.5, volume));
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
      source.start();
    } catch (err) {
      console.warn(`[audio] Error playing ${bufKey}:`, err);
    }
  }

  private playRealBark(key: string, gain = 1.0) {
    if (this.settings.muted) return;
    const uri = REAL_DOG_BARKS[key] || REAL_DOG_BARKS.bark_heavy;
    if (!uri) return;
    try {
      const vol = clamp01(this.settings.masterVolume * this.settings.sfxVolume * gain);
      const snd = new Audio(uri);
      snd.volume = Math.max(0.01, Math.min(1.0, vol));
      snd.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }

  play(id: SfxId, opts?: { gain?: number; charId?: string }) {
    this.ensure();
    if (this.settings.muted) return;
    const gain = opts?.gain ?? 1.0;

    switch (id) {
      case "bark":
        this.playBark(opts?.charId, gain);
        break;
      case "bark_heavy":
        this.playRealBark("bark_heavy", gain * 1.0);
        break;
      case "bark_medium":
        this.playRealBark("bark_medium", gain * 1.0);
        break;
      case "bark_light":
        this.playRealBark("bark_light", gain * 1.0);
        break;
      case "bark_hurt":
        this.playRealBark("bark_hurt", gain * 1.0);
        break;
      case "bark_win":
        this.playRealBark("bark_win", gain * 1.1);
        break;
      case "explosion":
      case "explosion_rocket":
        this.playBuffer("explosion_rocket", gain * 1.1);
        break;
      case "explosion_grenade":
        this.playBuffer("explosion_grenade", gain * 1.0);
        break;
      case "explosion_mortar":
        this.playBuffer("explosion_mortar", gain * 1.15);
        break;
      case "explosion_small":
        this.playBuffer("explosion_grenade", gain * 0.7);
        break;
      case "fire":
      case "fire_gun":
        this.playBuffer("fire_gun", gain * 0.9);
        break;
      case "fire_rocket":
        this.playBuffer("fire_rocket", gain * 1.0);
        break;
      case "fire_grenade":
        this.playBuffer("fire_gun", gain * 0.75);
        break;
      case "fire_mortar":
        this.playBuffer("fire_mortar", gain * 1.0);
        break;
      case "fire_bow":
        this.playBuffer("fire_bow", gain * 0.9);
        break;
      case "jump":
        this.playBark(opts?.charId, 0.6);
        break;
      case "victory":
        this.playRealBark("bark_win", gain * 1.15);
        break;
      case "defeat":
        this.playRealBark("bark_hurt", gain * 1.0);
        break;
      case "barrage":
        this.playBuffer("fire_mortar", gain * 1.0);
        setTimeout(() => this.playBuffer("explosion_mortar", gain * 0.95), 400);
        break;
      case "rage":
        this.playRealBark("bark_heavy", gain * 1.25);
        break;
      case "shield_activate":
      case "shield_hit":
      case "click":
      case "teleport":
      case "hit":
      default:
        this.playBuffer("fire_gun", gain * 0.45);
        break;
    }
  }

  playBark(charId?: string, gain = 1.0) {
    if (this.settings.muted) return;
    const cid = (charId || "").toLowerCase();
    if (cid.includes("brutus") || cid.includes("corso")) {
      this.playRealBark("bark_heavy", gain * 1.05);
    } else if (cid.includes("musa") || cid.includes("ranger")) {
      this.playRealBark("bark_medium", gain);
    } else if (cid.includes("miu") || cid.includes("ozzy") || cid.includes("barto")) {
      this.playRealBark("bark_light", gain * 0.95);
    } else {
      const picks = ["bark_heavy", "bark_medium", "bark_light"];
      const pick = picks[Math.floor(Math.random() * picks.length)];
      this.playRealBark(pick, gain);
    }
  }

  playExplosion(weaponId?: string, radius?: number, gain = 1.0) {
    this.ensure();
    if (this.settings.muted) return;
    const wid = (weaponId || "").toLowerCase();
    const scale = radius ? Math.min(1.3, Math.max(0.65, radius / 50)) : 1.0;
    const vol = gain * scale;

    if (wid.includes("mortar") || wid.includes("airstrike") || wid.includes("artillery")) {
      this.playBuffer("explosion_mortar", vol * 1.15);
    } else if (wid.includes("grenade") || wid.includes("frag") || wid.includes("cluster")) {
      this.playBuffer("explosion_grenade", vol);
    } else {
      this.playBuffer("explosion_rocket", vol);
    }
  }

  // ============ REAL ADVENTURE WAR MUSIC ============

  setMusicTrack(trackId: string) {
    const found = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (!found) return;
    this.setSettings({ selectedTrackId: trackId });
    if (this.musicTrack) {
      const current = this.musicTrack;
      this.stopMusic();
      this.playMusic(current);
    }
  }

  playMusic(track: "menu" | "combat") {
    if (this.settings.muted) return;
    if (this.musicTrack === track && this.bgAudio && !this.bgAudio.paused) return;

    this.stopMusic();
    this.musicTrack = track;

    try {
      const currentTrack =
        MUSIC_TRACKS.find((t) => t.id === this.settings.selectedTrackId) || MUSIC_TRACKS[0];
      const audioUrl = `/games/wardogs-mmo/audio/${currentTrack.file}`;
      const fallbackUrl = `/audio/${currentTrack.file}`;

      const el = new Audio();
      el.src =
        typeof window !== "undefined" &&
        window.location.pathname.includes("/games/wardogs-mmo")
          ? audioUrl
          : fallbackUrl;
      el.loop = true;
      const vol = clamp01(this.settings.masterVolume * this.settings.musicVolume);
      el.volume = vol;
      this.bgAudio = el;
      el.play().catch(() => {
        // Autoplay policy: will start on next user click
      });
    } catch (e) {
      console.warn("[audio] Music play error:", e);
    }
  }

  stopMusic() {
    this.musicTrack = null;
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      this.bgAudio = null;
    }
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch {
        /* ignore */
      }
      this.musicSource = null;
    }
  }
}

export const audio = new AudioManager();

export function playSfx(id: SfxId, gain?: number, charId?: string) {
  audio.play(id, { gain, charId });
}

export function playBark(charId?: string, gain?: number) {
  audio.playBark(charId, gain);
}

export function playExplosion(weaponId?: string, radius?: number, gain?: number) {
  audio.playExplosion(weaponId, radius, gain);
}

// Weapon-specific fire sound selector
export function playFireSfx(weaponId: string, gain = 1, charId?: string) {
  switch (weaponId) {
    case "bazooka":
    case "rpg":
    case "airstrike":
      audio.play("fire_rocket", { gain, charId });
      break;
    case "artillery":
      audio.play("fire_mortar", { gain, charId });
      break;
    case "grenade":
    case "frag":
    case "cluster":
      audio.play("fire_grenade", { gain, charId });
      break;
    case "bow":
      audio.play("fire_bow", { gain, charId });
      break;
    case "teleport":
      audio.play("teleport", { gain, charId });
      break;
    default:
      audio.play("fire_gun", { gain, charId });
  }

  // Cachorrinho solta um latido ao atirar!
  if (charId) {
    setTimeout(() => {
      audio.playBark(charId, 0.75);
    }, 90);
  }
}
