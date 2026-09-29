/**
 * High-performance Web Audio spatial synthesizer and Web Haptic feedback
 * Zero external audio assets required - runs purely on Web Audio API oscillators and gain nodes
 */

class BadgeAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Smooth turbine deceleration spin-down acoustic effect
  playSpinDownSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const dur = 0.85;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + dur);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch {}
  }

  // Metallic tick for bracket dock or rotation click
  playClick(pitch = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(320 * pitch, t + 0.04);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch {}
  }

  // Bracket snap latch sound (supports animation speed synchronization)
  playBracketSnap(index = 0, speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const t = this.ctx.currentTime;
      const baseFreq = 800 + index * 120;
      const dur = 0.08 / s;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + dur);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq, t);
      filter.Q.value = 8;

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur * 1.15);
    } catch {}
  }

  // Lock energy charge pulse hum (synchronized with speed)
  playEnergyPulse(speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const t = this.ctx.currentTime;
      const tPeak = 0.25 / s;
      const tEnd = 0.38 / s;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(380, t + tPeak);
      osc.frequency.exponentialRampToValueAtTime(60, t + tEnd);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + tPeak * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + tEnd);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + tEnd + 0.02);
    } catch {}
  }

  // High-speed vortex spin whoosh (duration automatically stretches with speed)
  playSpinWhoosh(duration = 0.9, speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const actualDuration = duration / s;
      const t = this.ctx.currentTime;
      // White noise buffer for wind/whoosh scaled to playback speed
      const bufferSize = Math.floor(this.ctx.sampleRate * Math.min(actualDuration, 3.0));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, t);
      filter.frequency.linearRampToValueAtTime(1800, t + actualDuration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(300, t + actualDuration);
      filter.Q.value = 5.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.18, t + actualDuration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + actualDuration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + actualDuration);
    } catch {}
  }

  // Mechanical burst explosion (synchronized with speed)
  playBurst(speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const t = this.ctx.currentTime;
      const dur = 0.28 / s;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + dur);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur * 1.15);
    } catch {}
  }

  // Apple Fitness Ring Completion Sound
  playRingCloseSound(ringIndex = 0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Distinct crystalline bell frequencies for Move, Exercise, Stand
      const ringNotes = [
        [587.33, 880.0, 1174.66], // D5, A5, D6 (Move)
        [659.25, 1046.5, 1318.51], // E5, C6, E6 (Exercise)
        [880.0, 1318.51, 1760.0],  // A5, E6, A6 (Stand)
      ];
      const freqs = ringNotes[ringIndex % 3] || ringNotes[0];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = t + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.99, noteStart + 0.6);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), noteStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.7);
      });
    } catch {}
  }

  // All 3 rings closed master celebration flourish with sub-bass & crystal overtones
  playAllRingsMasterFlourish() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0]; // C Major Arpeggio

      // 1. Crystal bell arpeggio notes
      arpeggio.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = t + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.09, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.9);
      });

      // 2. Resonant sub-bass foundation (65.4Hz C2)
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65.4, t);
      sub.frequency.exponentialRampToValueAtTime(45.0, t + 0.7);

      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(0.18, t + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(t);
      sub.stop(t + 0.8);
    } catch {}
  }

  // Apple-grade celebratory shimmer chime (synchronized with speed)
  playCelebrationChime(speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      const step = 0.055 / s;
      const decay = 0.7 / s;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = t + idx * step;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.09, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + decay + 0.05);
      });
    } catch {}
  }

  // Crisp metallic snap & sub-bass tactile acoustic vibration on release collision
  playKineticSnapRebound(velocity = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const intensity = Math.min(2.0, Math.max(0.25, velocity));
      const dur = 0.08 + Math.min(0.08, intensity * 0.04);

      // 1. Dual tuned metallic resonant oscillators (Anodized Aluminum / Titanium high strike)
      const f1 = 1750;
      const f2 = 3380;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const bandFilter = this.ctx.createBiquadFilter();
      const highGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(f1, t);
      osc1.frequency.exponentialRampToValueAtTime(f1 * 0.42, t + dur);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(f2, t);
      osc2.frequency.exponentialRampToValueAtTime(f2 * 0.32, t + dur);

      bandFilter.type = 'bandpass';
      bandFilter.frequency.setValueAtTime(2100, t);
      bandFilter.Q.value = 5.5;

      const highVol = 0.13 * Math.min(1.3, intensity);
      highGain.gain.setValueAtTime(highVol, t);
      highGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc1.connect(bandFilter);
      osc2.connect(bandFilter);
      bandFilter.connect(highGain);
      highGain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.01);
      osc2.stop(t + dur + 0.01);

      // 2. Low-Frequency Acoustic Vibration & Transducer Thump (45Hz ~ 72Hz Sub-Bass Rumble)
      // Generates physical tactile rumble sensation through headphones/speakers like a Taptic Engine kick
      const subOsc = this.ctx.createOscillator();
      const subFilter = this.ctx.createBiquadFilter();
      const subGain = this.ctx.createGain();

      const subBaseFreq = 54 * Math.min(1.3, Math.max(0.8, 0.9 + intensity * 0.25));
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(subBaseFreq, t);
      subOsc.frequency.exponentialRampToValueAtTime(subBaseFreq * 0.55, t + dur * 1.3);

      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(110, t);
      subFilter.Q.value = 2.0;

      const subVol = 0.24 * Math.min(1.6, intensity);
      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(subVol, t + 0.006);
      subGain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.3);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(t);
      subOsc.stop(t + dur * 1.35);
    } catch {}
  }

  // High-friction racing brake grinding sparks & sizzling friction squeal
  playBrakeSparksSizzle(intensity = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const norm = Math.min(2.0, Math.max(0.3, intensity));
      const dur = 0.22 * norm;

      // 1. High-frequency ceramic friction squeal / screech
      const screechOsc = this.ctx.createOscillator();
      const screechGain = this.ctx.createGain();
      const screechFilter = this.ctx.createBiquadFilter();

      screechOsc.type = 'sawtooth';
      screechOsc.frequency.setValueAtTime(2850, t);
      screechOsc.frequency.exponentialRampToValueAtTime(1400, t + dur);

      screechFilter.type = 'bandpass';
      screechFilter.frequency.setValueAtTime(3200, t);
      screechFilter.Q.value = 7.0;

      screechGain.gain.setValueAtTime(0.001, t);
      screechGain.gain.linearRampToValueAtTime(0.06 * norm, t + 0.02);
      screechGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      screechOsc.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(this.ctx.destination);

      screechOsc.start(t);
      screechOsc.stop(t + dur + 0.01);

      // 2. Grinding friction white noise burst
      const bufLen = Math.floor(this.ctx.sampleRate * Math.min(dur, 0.4));
      const buffer = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.3 ? 1 : 0.2);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2400, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, t);
      noiseGain.gain.linearRampToValueAtTime(0.09 * norm, t + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + dur + 0.01);
    } catch {}
  }

  // Crackling spark firework burst with sizzling harmonics
  playSparksEruption() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Burst core whoosh
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);
      oscGain.gain.setValueAtTime(0.18, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);

      // Sizzling sparkle noise bursts
      const sparkBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.5), this.ctx.sampleRate);
      const data = sparkBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // intermittent crackles
        data[i] = Math.random() > 0.65 ? (Math.random() * 2 - 1) : 0;
      }
      const sparkSource = this.ctx.createBufferSource();
      sparkSource.buffer = sparkBuffer;

      const sparkFilter = this.ctx.createBiquadFilter();
      sparkFilter.type = 'highpass';
      sparkFilter.frequency.setValueAtTime(2500, t);

      const sparkGain = this.ctx.createGain();
      sparkGain.gain.setValueAtTime(0.15, t);
      sparkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);

      sparkSource.connect(sparkFilter);
      sparkFilter.connect(sparkGain);
      sparkGain.connect(this.ctx.destination);

      sparkSource.start(t);
      sparkSource.stop(t + 0.5);
    } catch {}
  }

  // Turbine spin acceleration hum
  playTurbineAcceleration() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(2200, t + 1.2);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.3);
    } catch {}
  }

  // Magnetic snap latch sound with spring overshoot micro-bounce & metallic resonance
  playMagneticSnap(speed = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const s = Math.max(0.2, speed);
      const t = this.ctx.currentTime;

      // 1. Primary sharp impact snap click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1800, t);
      osc1.frequency.exponentialRampToValueAtTime(320, t + 0.045 / s);

      gain1.gain.setValueAtTime(0.22, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.05 / s);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.055 / s);

      // 2. Secondary micro-bounce / overshoot recoil tick (delayed by ~35ms)
      const tBounce = t + 0.038 / s;
      const oscBounce = this.ctx.createOscillator();
      const gainBounce = this.ctx.createGain();
      oscBounce.type = 'sine';
      oscBounce.frequency.setValueAtTime(2400, tBounce);
      oscBounce.frequency.exponentialRampToValueAtTime(680, tBounce + 0.03 / s);

      gainBounce.gain.setValueAtTime(0.001, t);
      gainBounce.gain.setValueAtTime(0.12, tBounce);
      gainBounce.gain.exponentialRampToValueAtTime(0.0001, tBounce + 0.035 / s);
      oscBounce.connect(gainBounce);
      gainBounce.connect(this.ctx.destination);
      oscBounce.start(tBounce);
      oscBounce.stop(tBounce + 0.04 / s);

      // 3. Resonant metallic body thud & precision titanium dish tone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(740, t + 0.008 / s);
      osc2.frequency.exponentialRampToValueAtTime(380, t + 0.16 / s);

      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.setValueAtTime(0.11, t + 0.008 / s);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.18 / s);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.008 / s);
      osc2.stop(t + 0.2 / s);
    } catch {}
  }

  // Magnetic pull-back anticipation sound
  playPullbackAnticipation() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.18);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }
}

export const badgeAudio = new BadgeAudioEngine();

export type HapticFeedbackType =
  | 'tap'
  | 'selection'
  | 'impact'
  | 'spring-snap'
  | 'spring-rebound'
  | 'pullback'
  | 'success'
  | 'warning';

export function triggerHaptic(type: HapticFeedbackType = 'tap') {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'tap':
          navigator.vibrate(10);
          break;
        case 'selection':
          navigator.vibrate(14);
          break;
        case 'impact':
          navigator.vibrate(28);
          break;
        case 'pullback':
          navigator.vibrate([12, 10, 8]);
          break;
        case 'spring-snap':
          // Precision magnetic snap + spring overshoot rebound double-pulse
          navigator.vibrate([26, 16, 14]);
          break;
        case 'spring-rebound':
          // Subtle micro-tremor vibration
          navigator.vibrate([10, 8, 6]);
          break;
        case 'success':
          navigator.vibrate([15, 40, 25, 30, 40]);
          break;
        case 'warning':
          navigator.vibrate([30, 60, 30]);
          break;
      }
    } catch {}
  }
}

/**
 * Trigger calibrated physical vibration for spring overshoot based on elasticity
 */
export function triggerSpringOvershootHaptic(elasticity = 1.0) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const snapDur = Math.round(22 * Math.min(2.0, Math.max(0.5, elasticity)));
      const reboundDur = Math.round(12 * Math.min(2.0, Math.max(0.5, elasticity)));
      navigator.vibrate([snapDur, 14, reboundDur]);
    } catch {}
  }
}

/**
 * Dynamically adjust physical haptic intensity & multi-pulse pattern based on collision velocity
 */
export function triggerDynamicImpactHaptic(intensity = 1.0) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const norm = Math.min(2.2, Math.max(0.3, intensity));
      if (norm < 0.6) {
        // Soft gentle contact
        navigator.vibrate(Math.round(10 * norm));
      } else if (norm < 1.2) {
        // Crisp standard impact double-tap
        navigator.vibrate([Math.round(16 * norm), 10, Math.round(10 * norm)]);
      } else {
        // Energetic heavy rebound multi-pulse shockwave
        navigator.vibrate([Math.round(24 * norm), 14, Math.round(14 * norm), 10, 8]);
      }
    } catch {}
  }
}
