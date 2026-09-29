/**
 * Apple Taptic Engine Micro-Haptics Simulator for Web & Mobile
 * Combines Vibration API (where supported) with synthesized physical acoustic
 * resonance (sub-bass damped impulse + mechanical solenoid strike at ~2.2kHz)
 * to authentically emulate Apple Watch / iPhone hardware tactile feedback.
 */

type HapticType =
  | 'tap'             // Light physical click when touching a badge
  | 'selection'       // Ultra-short crisp micro-tick (like Digital Crown notch)
  | 'flip'            // Heavier tactile mechanical thud when flipping medal 180°
  | 'unlock_step'     // Escalating tactile impulse during unlock sequencing
  | 'unlock_complete' // Resonant crystalline fanfare with multi-pulse haptic
  | 'drag_tick';      // Subtle micro-notch while dragging

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Triggers physical device vibration motor if supported by browser/hardware
 */
function triggerPhysicalVibration(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported contexts
    }
  }
}

/**
 * Synthesizes an authentic Apple Taptic Engine solenoid micro-click & tactile body thump
 */
function playAcousticTapticPulse(
  baseFreq: number = 135,
  endFreq: number = 42,
  duration: number = 0.024,
  gainLevel: number = 0.14,
  includeClick: boolean = true
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Low-frequency tactile body thump (135Hz down to 42Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);

    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    // 2. High-frequency solenoid mechanical click (~2.2kHz transient)
    if (includeClick) {
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const clickFilter = ctx.createBiquadFilter();

      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2200, now);
      clickFilter.Q.setValueAtTime(4, now);

      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(2400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.008);

      clickGain.gain.setValueAtTime(gainLevel * 0.45, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);

      clickOsc.start(now);
      clickOsc.stop(now + 0.009);
    }
  } catch {
    // Graceful fallback if audio context fails
  }
}

/**
 * Synthesizes a crystalline Apple Watch unlock fanfare with golden harmonic resonance
 */
function playUnlockFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    chords.forEach((freq, idx) => {
      const startTime = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.66);
    });
  } catch {
    // Ignore fallback
  }
}

/**
 * Public Haptic Dispatcher
 */
export function triggerHaptic(type: HapticType = 'tap', intensityOrStep: number = 1.0) {
  switch (type) {
    case 'tap': {
      const scale = Math.max(0.2, Math.min(2.5, intensityOrStep));
      triggerPhysicalVibration(Math.round(12 * scale));
      playAcousticTapticPulse(140 * scale, 48, 0.022, 0.16 * scale, true);
      break;
    }

    case 'selection': {
      const scale = Math.max(0.2, Math.min(2.5, intensityOrStep));
      triggerPhysicalVibration(Math.round(8 * scale));
      playAcousticTapticPulse(180 * scale, 80, 0.015, 0.10 * scale, true);
      break;
    }

    case 'flip': {
      const scale = Math.max(0.2, Math.min(2.5, intensityOrStep));
      triggerPhysicalVibration([Math.round(18 * scale), Math.round(25 * scale), Math.round(20 * scale)]);
      playAcousticTapticPulse(110, 36, 0.038, 0.22 * scale, true);
      break;
    }

    case 'unlock_step': {
      // Escalating pitch and vibration intensity as unlock animation progresses (0 to 10)
      const stepIndex = intensityOrStep;
      const freq = 110 + stepIndex * 28;
      triggerPhysicalVibration(8 + Math.min(stepIndex * 2, 20));
      playAcousticTapticPulse(freq, freq * 0.5, 0.025, 0.14 + stepIndex * 0.015, true);
      break;
    }

    case 'unlock_complete':
      triggerPhysicalVibration([25, 40, 20, 45, 55]);
      playUnlockFanfare();
      playAcousticTapticPulse(95, 30, 0.05, 0.25, true);
      break;

    case 'drag_tick': {
      // Scale intensity based on scroll velocity or rotation speed of 3D model
      const scale = Math.max(0.2, Math.min(3.0, intensityOrStep));
      const vibDuration = Math.max(2, Math.round(5 * scale));
      triggerPhysicalVibration(vibDuration);

      // Pitch slightly higher and gain scaled for crisp mechanical Taptic feel at higher speeds
      const baseFreq = Math.min(360, Math.max(160, 220 + (scale - 1.0) * 80));
      const endFreq = baseFreq * 0.5;
      const gain = Math.min(0.25, Math.max(0.02, 0.06 * Math.sqrt(scale)));
      const duration = Math.min(0.028, Math.max(0.008, 0.012 * Math.sqrt(scale)));

      playAcousticTapticPulse(baseFreq, endFreq, duration, gain, false);
      break;
    }
  }
}
