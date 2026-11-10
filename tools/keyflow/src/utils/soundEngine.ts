export type SoundProfile = 'thock' | 'clicky' | 'typewriter' | 'melodic' | 'mute';

// QWERTY horizontal position map (0.0 left to 1.0 right) for subtle stereo panning & pitch coloring
const KEY_PAN_MAP: Record<string, number> = {
  q: 0.1, w: 0.18, e: 0.26, r: 0.34, t: 0.42, y: 0.5, u: 0.58, i: 0.66, o: 0.74, p: 0.82,
  a: 0.12, s: 0.2, d: 0.28, f: 0.36, g: 0.44, h: 0.52, j: 0.6, k: 0.68, l: 0.76,
  z: 0.16, x: 0.24, c: 0.32, v: 0.4, b: 0.48, n: 0.56, m: 0.64,
};

// Pentatonic frequencies (C4 major pentatonic across 2.5 octaves)
const PENTATONIC_NOTES = [
  261.63, 293.66, 329.63, 392.00, 440.00,
  523.25, 587.33, 659.25, 783.99, 880.00,
  1046.50, 1174.66, 1318.51
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public playKeystroke(key: string, profile: SoundProfile, combo = 0) {
    if (profile === 'mute') return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const lowerKey = key.toLowerCase();
    const pos = KEY_PAN_MAP[lowerKey] ?? 0.5;
    const pitchVariance = 0.92 + pos * 0.16 + (Math.random() * 0.04 - 0.02);

    if (profile === 'thock') {
      // Deep POM/Cream switch "Mahjong Thock": warm low-mid body + muffled housing impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const isSpace = key === ' ' || key === 'Space' || key === 'Enter';
      const baseFreq = isSpace ? 115 : 165 * pitchVariance;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.4, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.055);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      // Filtered woody stem tap
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSpace ? 680 : 950 * pitchVariance, now);
      filter.Q.setValueAtTime(2.4, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.24, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.035);
    } else if (profile === 'clicky') {
      // Crisp Blue Switch: sharp high-frequency click jacket + bottom-out clack
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(2900 * pitchVariance, now);
      clickOsc.frequency.exponentialRampToValueAtTime(900, now + 0.014);

      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.018);

      // Secondary bottom-out clack 12ms later
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(320 * pitchVariance, now + 0.01);
      bodyOsc.frequency.exponentialRampToValueAtTime(110, now + 0.045);

      bodyGain.gain.setValueAtTime(0.2, now + 0.01);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodyOsc.start(now + 0.01);
      bodyOsc.stop(now + 0.05);
    } else if (profile === 'typewriter') {
      // Heavy mechanical metal typebar strike against platen roller
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200 * pitchVariance, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.03);

      // Metallic spring resonance
      const metalOsc = ctx.createOscillator();
      const metalGain = ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(620 * pitchVariance, now);
      metalOsc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      metalGain.gain.setValueAtTime(0.14, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      metalOsc.connect(metalGain);
      metalGain.connect(ctx.destination);
      metalOsc.start(now);
      metalOsc.stop(now + 0.05);
    } else if (profile === 'melodic') {
      // Harmonic Kalimba / Marimba note progression
      const noteIdx = (lowerKey.charCodeAt(0) + combo) % PENTATONIC_NOTES.length;
      const freq = PENTATONIC_NOTES[Math.max(0, noteIdx)] || 440;

      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();
      const overtoneGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      overtoneGain.gain.setValueAtTime(0.05, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      overtone.connect(overtoneGain);
      gain.connect(ctx.destination);
      overtoneGain.connect(ctx.destination);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 0.34);
      overtone.stop(now + 0.14);
    }
  }

  public playWordForged(profile: SoundProfile) {
    if (profile === 'mute') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (profile === 'typewriter') {
      // Authentic brass typewriter carriage bell "DING!"
      const bell = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();

      bell.type = 'sine';
      bell.frequency.setValueAtTime(2093, now); // C7 bell tone
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(4186 * 1.19, now); // Metallic inharmonic overtone

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);

      bell.connect(gain);
      overtone.connect(gain);
      gain.connect(ctx.destination);

      bell.start(now);
      overtone.start(now);
      bell.stop(now + 0.68);
      overtone.stop(now + 0.68);
      return;
    }

    // Uplifting forged chord arpeggio (C5 - E5 - G5 - C6)
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  public playError(profile: SoundProfile) {
    if (profile === 'mute') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(115, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playPluck(index: number, profile: SoundProfile) {
    if (profile === 'mute') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freq = PENTATONIC_NOTES[index % PENTATONIC_NOTES.length] || 523.25;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.08);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playSuperBoost(profile: SoundProfile) {
    if (profile === 'mute') return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.14);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }
}

export const soundEngine = new SoundEngine();

export function speakWord(word: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on unsupported browsers
  }
}
