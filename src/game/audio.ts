// WarDogs Audio — Web Audio procedural SFX + ambient music.
// No external assets: everything synthesized at runtime. Zero-latency, zero-bytes.
// v2 — richer multilayer synthesis, reverb bus, ambient music.

type SfxId =
  | "explosion"
  | "explosion_small"
  | "fire"            // legacy generic; routed to fire_gun
  | "fire_gun"
  | "fire_rocket"
  | "fire_grenade"
  | "fire_mortar"
  | "fire_bow"
  | "whistle"
  | "impact_thud"
  | "bark"            // random pick of bark_1/2/3
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

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

const STORAGE_KEY = "wardogs.audio.v1";

const DEFAULTS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.35,
  muted: false,
};

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

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

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private masterComp!: DynamicsCompressorNode;
  private sfxGain!: GainNode;
  private sfxDryGain!: GainNode;
  private sfxWetSend!: GainNode;
  private reverb!: ConvolverNode;
  private reverbReturn!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private pinkBuf: AudioBuffer | null = null;
  private settings: AudioSettings = loadSettings();
  private listeners = new Set<(s: AudioSettings) => void>();
  private musicTrack: "menu" | "combat" | null = null;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicBarIdx = 0;
  private musicNextBarTime = 0;
  private activeVoices = 0;
  private readonly MAX_VOICES = 14;
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

  ensure() {
    if (this.ready) {
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();

      // ==== Master chain: [srcs] → sfx/music gains → masterComp → masterGain → dest
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.75; // headroom
      this.masterComp = this.ctx.createDynamicsCompressor();
      this.masterComp.threshold.value = -12;
      this.masterComp.knee.value = 6;
      this.masterComp.ratio.value = 4;
      this.masterComp.attack.value = 0.003;
      this.masterComp.release.value = 0.12;

      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      // Reverb bus for SFX (short room)
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.buildImpulse(1.6, 2.5);
      this.reverbReturn = this.ctx.createGain();
      this.reverbReturn.gain.value = 0.35;
      this.sfxDryGain = this.ctx.createGain();
      this.sfxWetSend = this.ctx.createGain();
      this.sfxWetSend.gain.value = 0.18;

      // Wire graph
      this.sfxDryGain.connect(this.sfxGain);
      this.sfxWetSend.connect(this.reverb);
      this.reverb.connect(this.reverbReturn);
      this.reverbReturn.connect(this.sfxGain);
      this.sfxGain.connect(this.masterComp);
      this.musicGain.connect(this.masterComp);
      this.masterComp.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyGains();

      // White noise buffer (2s)
      const len = this.ctx.sampleRate * 2;
      const wbuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const wdata = wbuf.getChannelData(0);
      for (let i = 0; i < len; i++) wdata[i] = Math.random() * 2 - 1;
      this.noiseBuf = wbuf;

      // Pink noise (Voss-McCartney approx)
      const pbuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const pdata = pbuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pdata[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      this.pinkBuf = pbuf;

      this.ready = true;
    } catch (err) {
      console.warn("[audio] failed to init", err);
    }
  }

  private buildImpulse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = this.ctx!.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  private now() { return this.ctx?.currentTime ?? 0; }

  private noiseSource(pink = false) {
    if (!this.ctx) return null;
    const buf = pink ? this.pinkBuf : this.noiseBuf;
    if (!buf) return null;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    // No loop — 2s buffer is longer than any SFX. Looping caused wrap clicks.
    s.loop = false;
    s.playbackRate.value = 0.95 + Math.random() * 0.1;
    return s;
  }

  private connectSfx(node: AudioNode) {
    node.connect(this.sfxDryGain);
    node.connect(this.sfxWetSend);
  }

  play(id: SfxId, opts?: { gain?: number }) {
    if (!this.ready || !this.ctx) return;
    if (this.settings.muted) return;
    // Voice cap: drop new SFX if too many overlap (prevents clipping/crackle)
    if (this.activeVoices >= this.MAX_VOICES) return;
    this.activeVoices++;
    const release = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
    // Auto-release after ~1.5s (longest SFX). Simpler than tracking each source.
    setTimeout(release, 1500);
    const t0 = this.now();
    const mul = opts?.gain ?? 1;
    switch (id) {
      case "explosion":       this.sfxExplosion(t0, mul, false); break;
      case "explosion_small": this.sfxExplosion(t0, mul, true); break;
      case "fire":            // legacy alias
      case "fire_gun":        this.sfxFireGun(t0, mul); break;
      case "fire_rocket":     this.sfxFireRocket(t0, mul); break;
      case "fire_grenade":    this.sfxFireGrenade(t0, mul); break;
      case "fire_mortar":     this.sfxFireMortar(t0, mul); break;
      case "fire_bow":        this.sfxFireBow(t0, mul); break;
      case "whistle":         this.sfxWhistle(t0, mul); break;
      case "impact_thud":     this.sfxImpactThud(t0, mul); break;
      case "bark":            this.sfxBark(t0, mul, Math.floor(Math.random() * 4)); break;
      case "bark_hurt":       this.sfxBarkHurt(t0, mul); break;
      case "bark_win":        this.sfxBarkWin(t0, mul); break;
      case "jump":            this.sfxJump(t0, mul); break;
      case "hit":             this.sfxHit(t0, mul); break;
      case "click":           this.sfxClick(t0, mul); break;
      case "victory":         this.sfxFanfare(t0, mul, true); this.sfxBarkWin(t0 + 0.05, mul); break;
      case "defeat":          this.sfxFanfare(t0, mul, false); break;
      case "barrage":         this.sfxBarrage(t0, mul); break;
      case "teleport":        this.sfxTeleport(t0, mul); break;
      case "rage":            this.sfxRage(t0, mul); break;
      case "shield_activate": this.sfxShieldActivate(t0, mul); break;
      case "shield_hit":      this.sfxShieldHit(t0, mul); break;
    }
  }

  // ============ SFX PRIMITIVES ============

  private env(t0: number, attack: number, decay: number, peak: number, sustain = 0, sustainDur = 0): GainNode {
    const g = this.ctx!.createGain();
    const p = Math.max(0.0001, peak);
    // Linear attack from 0 avoids click; exponential decay for natural tail
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(p, t0 + Math.max(0.002, attack));
    if (sustain > 0 && sustainDur > 0) {
      const s = Math.max(0.0001, sustain);
      g.gain.linearRampToValueAtTime(s, t0 + attack + 0.03);
      g.gain.setValueAtTime(s, t0 + attack + sustainDur);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + sustainDur + decay);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    }
    return g;
  }

  // ---- EXPLOSION (multilayer) ----
  private sfxExplosion(t0: number, mul: number, small: boolean) {
    const ctx = this.ctx!;
    const scale = small ? 0.55 : 1;
    const dur = small ? 0.55 : 1.15;

    // 1) Initial crack (bright noise burst, 30ms)
    const crack = this.noiseSource(); if (!crack) return;
    const crackHP = ctx.createBiquadFilter();
    crackHP.type = "highpass";
    crackHP.frequency.value = 2500;
    const crackG = this.env(t0, 0.001, 0.05, 0.9 * mul);
    crack.connect(crackHP).connect(crackG);
    this.connectSfx(crackG);
    crack.start(t0); crack.stop(t0 + 0.08);

    // 2) Sub-boom (sine 90→25 Hz)
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(90 * scale, t0);
    sub.frequency.exponentialRampToValueAtTime(25, t0 + dur * 0.5);
    const subG = this.env(t0, 0.005, dur * 0.7, 1.1 * mul);
    sub.connect(subG); this.connectSfx(subG);
    sub.start(t0); sub.stop(t0 + dur);

    // 3) Body — pink noise LP sweep 1200→180 Hz
    const body = this.noiseSource(true); if (!body) return;
    const bodyLP = ctx.createBiquadFilter();
    bodyLP.type = "lowpass";
    bodyLP.frequency.setValueAtTime(1200, t0);
    bodyLP.frequency.exponentialRampToValueAtTime(180, t0 + dur * 0.8);
    bodyLP.Q.value = 0.9;
    const bodyG = this.env(t0, 0.01, dur, 0.85 * mul);
    body.connect(bodyLP).connect(bodyG); this.connectSfx(bodyG);
    body.start(t0); body.stop(t0 + dur + 0.1);

    // 4) Debris tail — bandpass noise, longer
    if (!small) {
      const debris = this.noiseSource(); if (!debris) return;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 600;
      bp.Q.value = 2;
      const dG = ctx.createGain();
      dG.gain.setValueAtTime(0.0001, t0 + 0.15);
      dG.gain.exponentialRampToValueAtTime(0.25 * mul, t0 + 0.25);
      dG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
      debris.connect(bp).connect(dG); this.connectSfx(dG);
      debris.start(t0 + 0.15); debris.stop(t0 + dur + 0.5);
    }
  }

  // ---- GUN (pólvora seca) ----
  private sfxFireGun(t0: number, mul: number) {
    const ctx = this.ctx!;
    // Bright crack
    const n = this.noiseSource(); if (!n) return;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;
    const g = this.env(t0, 0.001, 0.09, 0.7 * mul);
    n.connect(hp).connect(g); this.connectSfx(g);
    n.start(t0); n.stop(t0 + 0.12);

    // Body thump (sine 220→60)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.09);
    const og = this.env(t0, 0.002, 0.11, 0.5 * mul);
    osc.connect(og); this.connectSfx(og);
    osc.start(t0); osc.stop(t0 + 0.14);
  }

  // ---- ROCKET (whoosh + rugido) ----
  private sfxFireRocket(t0: number, mul: number) {
    const ctx = this.ctx!;
    const dur = 0.75;
    // Whoosh — bandpass noise sweeping UP
    const n = this.noiseSource(true); if (!n) return;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(300, t0);
    bp.frequency.exponentialRampToValueAtTime(2200, t0 + dur);
    bp.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.65 * mul, t0 + 0.12);
    g.gain.setValueAtTime(0.65 * mul, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.15);
    n.connect(bp).connect(g); this.connectSfx(g);
    n.start(t0); n.stop(t0 + dur + 0.2);

    // Low rumble
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(75, t0);
    osc.frequency.linearRampToValueAtTime(55, t0 + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    const og = this.env(t0, 0.05, dur * 0.9, 0.4 * mul, 0.3 * mul, dur * 0.5);
    osc.connect(lp).connect(og); this.connectSfx(og);
    osc.start(t0); osc.stop(t0 + dur + 0.2);

    // Ignition click
    this.sfxFireGun(t0, mul * 0.35);
  }

  // ---- GRENADE (tock mecânico) ----
  private sfxFireGrenade(t0: number, mul: number) {
    const ctx = this.ctx!;
    // "Tock" — triangle short + noise click
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.08);
    const g = this.env(t0, 0.002, 0.1, 0.45 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.12);

    const n = this.noiseSource(); if (!n) return;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 3;
    const ng = this.env(t0, 0.001, 0.05, 0.3 * mul);
    n.connect(bp).connect(ng); this.connectSfx(ng);
    n.start(t0); n.stop(t0 + 0.08);
  }

  // ---- MORTAR (thump grave + assobio) ----
  private sfxFireMortar(t0: number, mul: number) {
    const ctx = this.ctx!;
    // Deep thump
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.22);
    const g = this.env(t0, 0.003, 0.28, 0.9 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.32);

    // Whistle rising (mortar takeoff)
    const w = ctx.createOscillator();
    w.type = "sine";
    w.frequency.setValueAtTime(1400, t0 + 0.05);
    w.frequency.exponentialRampToValueAtTime(2800, t0 + 0.4);
    const wg = this.env(t0 + 0.05, 0.02, 0.35, 0.14 * mul);
    w.connect(wg); this.connectSfx(wg);
    w.start(t0 + 0.05); w.stop(t0 + 0.45);
  }

  // ---- BOW (twang) ----
  private sfxFireBow(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 5;
    const g = this.env(t0, 0.003, 0.28, 0.4 * mul);
    osc.connect(bp).connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.35);
  }

  // ---- WHISTLE (projectile in flight) ----
  private sfxWhistle(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2200, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.5);
    const g = this.env(t0, 0.03, 0.5, 0.15 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.55);
  }

  // ---- IMPACT (baque surdo) ----
  private sfxImpactThud(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(50, t0 + 0.15);
    const g = this.env(t0, 0.002, 0.18, 0.5 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.22);

    const n = this.noiseSource(true); if (!n) return;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const ng = this.env(t0, 0.002, 0.12, 0.35 * mul);
    n.connect(lp).connect(ng); this.connectSfx(ng);
    n.start(t0); n.stop(t0 + 0.15);
  }

  // ---- BARK (formant-based woof, 4 variations) ----
  private sfxBark(t0: number, mul: number, variant: number) {
    const ctx = this.ctx!;
    const cfg = [
      { base: 240, formant: 950,  dur: 0.16, second: 0.10 },
      { base: 175, formant: 720,  dur: 0.20, second: 0.12 },
      { base: 300, formant: 1150, dur: 0.13, second: 0.08 },
      { base: 210, formant: 880,  dur: 0.14, second: 0.09 },
    ][variant % 4];

    const wof = (start: number, freqMul: number, vol: number) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = "sawtooth";
      o2.type = "square";
      const f = cfg.base * freqMul * (0.97 + Math.random() * 0.06);
      o1.frequency.setValueAtTime(f * 0.55, start);
      o1.frequency.exponentialRampToValueAtTime(f, start + 0.02);
      o1.frequency.exponentialRampToValueAtTime(f * 0.55, start + cfg.dur);
      o2.frequency.setValueAtTime(f * 1.5, start);
      o2.frequency.exponentialRampToValueAtTime(f * 0.8, start + cfg.dur);

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(cfg.formant * 0.7, start);
      bp.frequency.linearRampToValueAtTime(cfg.formant, start + cfg.dur * 0.4);
      bp.frequency.linearRampToValueAtTime(cfg.formant * 0.75, start + cfg.dur);
      bp.Q.value = 1.2;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;

      const src = ctx.createGain();
      const g1 = ctx.createGain(); g1.gain.value = 0.8;
      const g2 = ctx.createGain(); g2.gain.value = 0.5;
      o1.connect(g1).connect(src);
      o2.connect(g2).connect(src);

      // Parallel filtered + dry for punch
      const filtered = ctx.createGain(); filtered.gain.value = 0.65;
      const dry = ctx.createGain(); dry.gain.value = 0.45;
      src.connect(bp).connect(lp).connect(filtered);
      src.connect(dry);

      const eg = ctx.createGain();
      eg.gain.setValueAtTime(0.0001, start);
      eg.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * mul), start + 0.008);
      eg.gain.exponentialRampToValueAtTime(0.0001, start + cfg.dur);

      filtered.connect(eg);
      dry.connect(eg);
      // Bypass reverb — bark direto, audível
      eg.connect(this.sfxDryGain);

      o1.start(start); o2.start(start);
      o1.stop(start + cfg.dur + 0.05);
      o2.stop(start + cfg.dur + 0.05);
    };

    wof(t0, 1.0, 0.9);
    wof(t0 + cfg.second, 0.88, 0.7);
  }

  private sfxBarkHurt(t0: number, mul: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(650, t0);
    o.frequency.exponentialRampToValueAtTime(220, t0 + 0.28);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 1.5;
    const dry = ctx.createGain(); dry.gain.value = 0.5;
    const filtered = ctx.createGain(); filtered.gain.value = 0.7;
    o.connect(bp).connect(filtered);
    o.connect(dry);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.75 * mul, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.33);
    filtered.connect(g);
    dry.connect(g);
    g.connect(this.sfxDryGain);
    o.start(t0); o.stop(t0 + 0.35);
  }

  private sfxBarkWin(t0: number, mul: number) {
    this.sfxBark(t0,        mul,      3);
    this.sfxBark(t0 + 0.22, mul * 0.9, 0);
    this.sfxBark(t0 + 0.44, mul * 0.85, 2);
  }

  private sfxJump(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(680, t0 + 0.12);
    const g = this.env(t0, 0.005, 0.14, 0.28 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.18);
  }

  private sfxHit(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.15);
    const g = this.env(t0, 0.003, 0.18, 0.45 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.22);
  }

  private sfxClick(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1400, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.05);
    const g = this.env(t0, 0.002, 0.06, 0.16 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 0.08);
  }

  private sfxFanfare(t0: number, mul: number, up: boolean) {
    const ctx = this.ctx!;
    const notes = up ? [392, 523, 659, 784] : [392, 330, 262, 175];
    notes.forEach((f, i) => {
      const start = t0 + i * 0.2;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = f * 2;
      const mix = ctx.createGain();
      const g1 = ctx.createGain(); g1.gain.value = 0.6;
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      osc.connect(g1).connect(mix);
      o2.connect(g2).connect(mix);
      const eg = this.env(start, 0.02, 0.4, 0.3 * mul);
      mix.connect(eg); this.connectSfx(eg);
      osc.start(start); o2.start(start);
      osc.stop(start + 0.45); o2.stop(start + 0.45);
    });
  }

  private sfxBarrage(t0: number, mul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.linearRampToValueAtTime(880, t0 + 0.4);
    osc.frequency.linearRampToValueAtTime(320, t0 + 0.9);
    const g = this.env(t0, 0.02, 1.0, 0.4 * mul);
    osc.connect(g); this.connectSfx(g);
    osc.start(t0); osc.stop(t0 + 1.1);
    for (let i = 0; i < 5; i++) {
      const t = t0 + 1.0 + i * 0.22 + Math.random() * 0.06;
      this.sfxExplosion(t, mul * 0.8, false);
    }
  }

  private sfxTeleport(t0: number, mul: number) {
    const ctx = this.ctx!;
    // Shimmer — 3 detuned sines sweeping up
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = "sine";
      const base = 220 + i * 40;
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * 10, t0 + 0.35);
      const g = this.env(t0 + i * 0.02, 0.01, 0.4, 0.22 * mul);
      o.connect(g); this.connectSfx(g);
      o.start(t0 + i * 0.02); o.stop(t0 + 0.5);
    }
  }

  private sfxRage(t0: number, mul: number) {
    const ctx = this.ctx!;
    for (let k = 0; k < 3; k++) {
      const start = t0 + k * 0.09;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110 * (1 + k * 0.15), start);
      osc.frequency.exponentialRampToValueAtTime(55, start + 0.28);
      const g = this.env(start, 0.005, 0.3, 0.4 * mul);
      osc.connect(g); this.connectSfx(g);
      osc.start(start); osc.stop(start + 0.35);
    }
    this.sfxBark(t0 + 0.35, mul, 1);
  }

  private sfxShieldActivate(t0: number, mul: number) {
    const ctx = this.ctx!;
    // Rising shimmer + hum
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      const base = 320 + i * 90;
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * 2.4, t0 + 0.45);
      const g = this.env(t0 + i * 0.03, 0.015, 0.5, 0.2 * mul);
      o.connect(g); this.connectSfx(g);
      o.start(t0 + i * 0.03); o.stop(t0 + 0.6);
    }
  }

  private sfxShieldHit(t0: number, mul: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(880, t0);
    o.frequency.exponentialRampToValueAtTime(220, t0 + 0.18);
    const g = this.env(t0, 0.005, 0.22, 0.28 * mul);
    o.connect(g); this.connectSfx(g);
    o.start(t0); o.stop(t0 + 0.25);
  }

  // ============ AMBIENT MUSIC ============

  playMusic(track: "menu" | "combat") {
    if (!this.ready || !this.ctx) return;
    if (this.musicTrack === track) return;
    this.stopMusic();
    this.musicTrack = track;
    this.musicBarIdx = 0;
    this.musicNextBarTime = this.now() + 0.1;
    this.scheduleMusicBar();
  }

  stopMusic() {
    this.musicTrack = null;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }

  private scheduleMusicBar() {
    if (!this.ctx || !this.musicTrack) return;
    const isCombat = this.musicTrack === "combat";
    const bpm = isCombat ? 112 : 100;
    const beat = 60 / bpm;
    const bar = beat * 4;
    // Lookahead scheduler: schedule bars whose start is <= now + 0.3s ahead.
    // Immune to setTimeout drift and background-tab throttling.
    const lookahead = 0.3;
    while (this.musicNextBarTime < this.now() + lookahead) {
      const t0 = this.musicNextBarTime;

    // C major key — I-IV-V-I (menu) / I-vi-IV-V (combat). Roots in Hz (C2, F2, G2, A2).
    const C2 = 65.41, D2 = 73.42, E2 = 82.41, F2 = 87.31, G2 = 98.0, A2 = 110.0;
    const progression = isCombat
      ? [C2, A2, F2, G2]
      : [C2, F2, G2, C2];
    const root = progression[this.musicBarIdx % progression.length];
    this.musicBarIdx++;

    // Cheerful pad — root, major 3rd, 5th (all up an octave)
    this.padNote(t0, root * 2,        bar * 0.95, 0.07);
    this.padNote(t0, root * 2 * 1.26, bar * 0.95, 0.055); // major 3rd
    this.padNote(t0, root * 3,        bar * 0.95, 0.05);  // 5th

    // Bouncy tuba bass — "oom-pah" on beats 1 & 3 (root + 5th)
    this.bounceBass(t0,             root,     beat * 0.7, 0.18);
    this.bounceBass(t0 + beat,      root * 1.5, beat * 0.6, 0.12);
    this.bounceBass(t0 + beat * 2,  root,     beat * 0.7, 0.18);
    this.bounceBass(t0 + beat * 3,  root * 1.5, beat * 0.6, 0.12);

    // Marimba/xylophone melody — playful motif in major
    const scale = [root * 2, root * 2 * 1.26, root * 3, root * 4]; // root, M3, 5th, oct
    const pattern = isCombat
      ? [0, 2, 1, 3, 2, 0, 1, 2]
      : [0, 2, 3, 2, 1, 2, 0, -1];
    const noteDur = beat / 2; // eighth notes
    for (let i = 0; i < 8; i++) {
      const idx = pattern[i];
      if (idx < 0) continue;
      this.plink(t0 + i * noteDur, scale[idx], noteDur * 0.85, 0.11);
    }

    // Percussion — hihat ticks + kick/snare backbeat
    for (let b = 0; b < 4; b++) {
      this.hatTick(t0 + b * beat + beat * 0.5, 0.05);
    }
    this.softKick(t0,             0.14);
    this.softKick(t0 + beat * 2,  0.13);
    if (isCombat) {
      this.snareTick(t0 + beat,     0.09);
      this.snareTick(t0 + beat * 3, 0.09);
    }

    // Silence unused vars warnings (kept for API compatibility)
    void D2; void E2;

      this.musicNextBarTime += bar;
    }
    // Silence unused vars warnings (kept for API compatibility)
    // Re-check ~40ms before next bar-window edge
    this.musicTimer = setTimeout(() => this.scheduleMusicBar(), 100);
  }

  private padNote(start: number, freq: number, dur: number, vol: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const mkOsc = (type: OscillatorType, detune: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      return o;
    };
    const o1 = mkOsc("sine", -6);
    const o2 = mkOsc("triangle", 6);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.7;
    lp.frequency.value = 1600;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.3);
    g.gain.setValueAtTime(vol, start + dur - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    const mix = ctx.createGain();
    o1.connect(mix); o2.connect(mix);
    mix.connect(lp).connect(g).connect(this.musicGain);
    o1.start(start); o2.start(start);
    const end = start + dur + 0.1;
    o1.stop(end); o2.stop(end);
  }

  // Bouncy tuba-style bass note — quick pitch bump on attack
  private bounceBass(start: number, freq: number, dur: number, vol: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 0.75, start);
    o.frequency.exponentialRampToValueAtTime(freq, start + 0.04);
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.2;
    o.connect(g).connect(this.musicGain);
    o2.connect(g2).connect(g);
    o.start(start); o2.start(start);
    o.stop(start + dur + 0.05); o2.stop(start + dur + 0.05);
  }

  // Marimba/xylophone-like plink
  private plink(start: number, freq: number, dur: number, vol: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 4; // bright partial
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(lp).connect(g).connect(this.musicGain);
    o2.connect(g2).connect(g);
    o.start(start); o2.start(start);
    o.stop(start + dur + 0.05); o2.stop(start + dur + 0.05);
  }

  private hatTick(start: number, vol: number) {
    if (!this.ctx || !this.noiseBuf) return;
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    n.connect(hp).connect(g).connect(this.musicGain);
    n.start(start); n.stop(start + 0.08);
  }

  private snareTick(start: number, vol: number) {
    if (!this.ctx || !this.noiseBuf) return;
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    n.connect(bp).connect(g).connect(this.musicGain);
    n.start(start); n.stop(start + 0.15);

    // Body tone
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, start);
    o.frequency.exponentialRampToValueAtTime(140, start + 0.08);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, start);
    og.gain.exponentialRampToValueAtTime(vol * 0.5, start + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
    o.connect(og).connect(this.musicGain);
    o.start(start); o.stop(start + 0.12);
  }

  private softKick(start: number, vol: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, start);
    o.frequency.exponentialRampToValueAtTime(45, start + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    o.connect(g).connect(this.musicGain);
    o.start(start); o.stop(start + 0.28);
  }
}

export const audio = new AudioManager();

export function playSfx(id: SfxId, gain?: number) {
  audio.play(id, gain !== undefined ? { gain } : undefined);
}

// Weapon-specific fire sound selector.
export function playFireSfx(weaponId: string, gain = 1) {
  switch (weaponId) {
    case "bazooka":
    case "rpg":
    case "airstrike":
      playSfx("fire_rocket", gain);
      break;
    case "artillery":
      playSfx("fire_mortar", gain);
      break;
    case "grenade":
    case "frag":
    case "cluster":
      playSfx("fire_grenade", gain);
      break;
    case "bow":
      playSfx("fire_bow", gain);
      break;
    case "teleport":
      // handled by teleport sfx separately
      break;
    default:
      playSfx("fire_gun", gain);
  }
}
