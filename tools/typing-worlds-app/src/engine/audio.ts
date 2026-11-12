/**
 * Synthesized sound cues (Web Audio, no assets). Muted state is persisted.
 * All cues are tiny, randomized and rate-limited so fast typing never stacks into noise.
 */
export type Cue =
  | 'pop'
  | 'squish'
  | 'tick'
  | 'chalk'
  | 'sparkle'
  | 'chime'
  | 'zap'
  | 'hum'
  | 'bubble'
  | 'whoosh'
  | 'thud'
  | 'tap'
  | 'crack'
  | 'scratch'
  | 'boom'
  | 'success'
  | 'error'
  | 'erase';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private last = new Map<string, number>();
  private noiseBuf: AudioBuffer | null = null;
  enabled: boolean;
  /** disabled for gallery previews */
  silent = false;

  constructor() {
    this.enabled = localStorage.getItem('tw.sound') !== 'off';
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    localStorage.setItem('tw.sound', on ? 'on' : 'off');
    if (on) this.unlock();
  }

  /** must be called from a user gesture */
  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 0.5;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  play(cue: Cue, opts: { gain?: number; pitch?: number; minGap?: number } = {}) {
    if (!this.enabled || this.silent || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const gap = opts.minGap ?? 0.03;
    if (now - (this.last.get(cue) ?? -1) < gap) return;
    this.last.set(cue, now);
    const g = opts.gain ?? 1;
    const p = (opts.pitch ?? 1) * (0.94 + Math.random() * 0.12);
    const c = this.ctx;
    const out = this.master;

    const env = (node: AudioNode, a: number, peak: number, d: number) => {
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * g), now + a);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + a + d);
      node.connect(gn).connect(out);
      return gn;
    };
    const osc = (type: OscillatorType, f0: number, f1: number, dur: number) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0 * p, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * p), now + dur);
      o.start(now);
      o.stop(now + dur + 0.05);
      return o;
    };
    const noise = (dur: number, type: BiquadFilterType, freq: number, q = 1) => {
      const s = c.createBufferSource();
      s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq * p;
      f.Q.value = q;
      s.connect(f);
      s.start(now, Math.random() * 0.3);
      s.stop(now + dur + 0.05);
      return f;
    };

    switch (cue) {
      case 'pop':
        env(osc('sine', 520, 180, 0.12), 0.005, 0.5, 0.12);
        break;
      case 'squish':
        env(osc('sine', 180, 90, 0.18), 0.01, 0.6, 0.18);
        env(noise(0.08, 'lowpass', 600), 0.005, 0.15, 0.08);
        break;
      case 'tick':
        env(osc('triangle', 1800, 1200, 0.03), 0.002, 0.2, 0.03);
        break;
      case 'tap':
        env(noise(0.04, 'bandpass', 2400, 2), 0.002, 0.4, 0.04);
        break;
      case 'chalk':
        env(noise(0.16, 'bandpass', 3200, 0.8), 0.02, 0.18, 0.14);
        break;
      case 'scratch':
        env(noise(0.2, 'highpass', 4500, 0.7), 0.02, 0.12, 0.18);
        break;
      case 'erase':
        env(noise(0.25, 'lowpass', 1400, 0.6), 0.03, 0.18, 0.22);
        break;
      case 'sparkle':
        env(osc('sine', 1800, 2600, 0.25), 0.005, 0.12, 0.25);
        env(osc('sine', 2700, 3300, 0.18), 0.02, 0.06, 0.18);
        break;
      case 'chime':
        [1, 1.5, 2].forEach((m, i) => {
          const o = c.createOscillator();
          o.type = 'sine';
          o.frequency.value = 880 * m * p;
          o.start(now + i * 0.07);
          o.stop(now + 1.2);
          const gn = c.createGain();
          gn.gain.setValueAtTime(0.0001, now + i * 0.07);
          gn.gain.exponentialRampToValueAtTime(0.12 * g, now + i * 0.07 + 0.01);
          gn.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
          o.connect(gn).connect(out);
        });
        break;
      case 'zap':
        env(osc('sawtooth', 90, 60, 0.25), 0.005, 0.12, 0.25);
        env(noise(0.1, 'bandpass', 5000, 3), 0.002, 0.15, 0.1);
        break;
      case 'hum':
        env(osc('sawtooth', 120, 120, 0.5), 0.05, 0.05, 0.45);
        break;
      case 'bubble':
        env(osc('sine', 300, 900, 0.09), 0.004, 0.3, 0.09);
        break;
      case 'whoosh':
        env(noise(0.45, 'bandpass', 900, 0.6), 0.12, 0.25, 0.35);
        break;
      case 'thud':
        env(osc('sine', 120, 50, 0.2), 0.005, 0.6, 0.2);
        break;
      case 'crack':
        env(noise(0.08, 'highpass', 2000, 1), 0.001, 0.4, 0.08);
        break;
      case 'boom':
        env(noise(0.8, 'lowpass', 300, 0.7), 0.01, 0.6, 0.8);
        env(osc('sine', 80, 35, 0.6), 0.01, 0.5, 0.6);
        break;
      case 'success':
        [0, 4, 7, 12].forEach((s, i) => {
          const o = c.createOscillator();
          o.type = 'triangle';
          o.frequency.value = 523.25 * Math.pow(2, s / 12);
          const t0 = now + i * 0.06;
          o.start(t0);
          o.stop(t0 + 0.4);
          const gn = c.createGain();
          gn.gain.setValueAtTime(0.0001, t0);
          gn.gain.exponentialRampToValueAtTime(0.12 * g, t0 + 0.01);
          gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
          o.connect(gn).connect(out);
        });
        break;
      case 'error':
        env(osc('square', 220, 160, 0.2), 0.005, 0.08, 0.2);
        break;
    }
  }
}
