"use client";

type Wave = OscillatorType;

const STORAGE_KEY = "dahir-sound-muted";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private volume = 0.9;
  private last: Record<string, number> = {};
  private listening = false;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.muted = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    this.armUnlock();
  }

  /* ───────────── lifecycle ───────────── */

  // Browsers block audio until a user gesture; resume on the first one.
  private armUnlock() {
    if (this.listening) return;
    this.listening = true;
    const unlock = () => {
      this.init();
      this.ctx?.resume().catch(() => {});
      if (this.ctx && this.ctx.state === "running") {
        ["pointerdown", "keydown", "touchstart"].forEach((e) =>
          window.removeEventListener(e, unlock)
        );
      }
    };
    ["pointerdown", "keydown", "touchstart"].forEach((e) =>
      window.addEventListener(e, unlock, { passive: true })
    );
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else this.ctx.resume().catch(() => {});
    });
  }

  private init(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();

    // master → soft limiter → out, so stacked sounds never clip
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : this.volume;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;

    master.connect(limiter);
    limiter.connect(ctx.destination);

    // one reusable white-noise buffer
    const len = Math.floor(ctx.sampleRate * 0.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.noise = buf;
    return ctx;
  }

  // Returns a ready context, or null if muted / unavailable / throttled.
  private ready(key: string, minGapMs = 0): AudioContext | null {
    if (this.muted) return null;
    if (minGapMs) {
      const now = performance.now();
      if (now - (this.last[key] ?? 0) < minGapMs) return null;
      this.last[key] = now;
    }
    const ctx = this.init();
    if (!ctx || !this.master) return null;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  /* ───────────── building blocks ───────────── */

  private env(g: GainNode, t: number, peak: number, dur: number, attack = 0.002) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private burst(
    ctx: AudioContext,
    t: number,
    dur: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    peak: number,
    pan = 0
  ) {
    if (!this.noise || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;

    const g = ctx.createGain();
    this.env(g, t, peak, dur);

    src.connect(filter);
    filter.connect(g);
    this.route(ctx, g, pan);

    src.start(t, Math.random() * 0.2, dur + 0.02);
  }

  private tone(
    ctx: AudioContext,
    t: number,
    type: Wave,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
    pan = 0
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    this.env(g, t, peak, dur);
    osc.connect(g);
    this.route(ctx, g, pan);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private route(ctx: AudioContext, node: AudioNode, pan: number) {
    if (!this.master) return;
    if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      p.connect(this.master);
    } else {
      node.connect(this.master);
    }
  }

  private jitter(base: number, amount = 0.04) {
    return base * (1 + (Math.random() * 2 - 1) * amount);
  }

  /* ───────────── public sounds ───────────── */

  // Two-stage focal-plane shutter: front curtain, mirror slap, rear curtain.
  public playShutter() {
    try {
      const ctx = this.ready("shutter");
      if (!ctx) return;
      const t = ctx.currentTime;

      // front curtain click
      this.burst(ctx, t, 0.03, "bandpass", 3600, 1.2, 0.5);
      this.burst(ctx, t, 0.012, "highpass", 6000, 0.7, 0.25);

      // mirror slap: low body thump + muffled knock
      this.tone(ctx, t, "sine", 170, 38, 0.07, 0.55);
      this.burst(ctx, t + 0.012, 0.05, "lowpass", 900, 0.8, 0.28);

      // rear curtain click, slightly softer and lower
      this.burst(ctx, t + 0.065, 0.026, "bandpass", 2800, 1.2, 0.4);
      this.tone(ctx, t + 0.065, "sine", 120, 45, 0.04, 0.22);

      // tiny metallic ring-out
      this.tone(ctx, t + 0.005, "triangle", 5200, 4800, 0.09, 0.03);
    } catch {
      /* AudioContext blocked or unsupported */
    }
  }

  // Light optical detent; slight pitch variation so repeats feel organic.
  public playTick() {
    try {
      const ctx = this.ready("tick", 40);
      if (!ctx) return;
      const t = ctx.currentTime;
      const f = this.jitter(2400);
      this.tone(ctx, t, "sine", f, f / 3, 0.02, 0.09);
      this.burst(ctx, t, 0.01, "highpass", 5000, 0.7, 0.03);
    } catch {
      /* AudioContext blocked or unsupported */
    }
  }

  // Softer, higher blip for hovering controls.
  public playHover() {
    try {
      const ctx = this.ready("hover", 90);
      if (!ctx) return;
      const t = ctx.currentTime;
      const f = this.jitter(3200);
      this.tone(ctx, t, "sine", f, f * 0.6, 0.014, 0.05);
    } catch {
      /* AudioContext blocked or unsupported */
    }
  }

  // Button press: a small dial click with a bit of body.
  public playClick() {
    try {
      const ctx = this.ready("click", 60);
      if (!ctx) return;
      const t = ctx.currentTime;
      this.burst(ctx, t, 0.018, "bandpass", 3000, 1.4, 0.3);
      this.tone(ctx, t, "sine", 220, 70, 0.045, 0.28);
    } catch {
      /* AudioContext blocked or unsupported */
    }
  }

  // Lens focus whirr: filtered sweep. progress 0..1 raises the pitch.
  public playFocus(progress = 0.5) {
    try {
      const ctx = this.ready("focus", 120);
      if (!ctx || !this.master) return;
      const t = ctx.currentTime;
      const p = Math.min(1, Math.max(0, progress));
      const start = 500 + p * 900;

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90 + p * 40, t);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 4;
      filter.frequency.setValueAtTime(start, t);
      filter.frequency.exponentialRampToValueAtTime(start * 1.8, t + 0.18);

      const g = ctx.createGain();
      this.env(g, t, 0.035, 0.2, 0.03);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      /* AudioContext blocked or unsupported */
    }
  }

  /* ───────────── controls ───────────── */

  public setMuted(value: boolean) {
    this.muted = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(value ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted() {
    return this.muted;
  }

  public setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.ctx && this.master && !this.muted) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }
}

export const sound = new SoundEngine();