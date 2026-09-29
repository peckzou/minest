/**
 * Apple-Grade Spatial Audio & Physical Acoustic Engine
 * Synthesizes high-fidelity 'chime' and 'clink' sound effects using the Web Audio API,
 * coupled with a subtle 3D spatial background soundscape that reacts dynamically
 * to 3D badge orientation, light temperature, and inertial interaction.
 */

export type ClinkVariant = 'tap' | 'rotate_tick' | 'flip' | 'facet' | 'heavy' | 'slider';
export type ChimeVariant = 'unlock_step' | 'unlock_fanfare' | 'crystallize' | 'celestial';

interface SpatialAudioState {
  isMuted: boolean;
  masterVolume: number;
  soundscapeEnabled: boolean;
  soundscapeVolume: number;
}

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundscapeGain: GainNode | null = null;
  private soundscapeFilter: BiquadFilterNode | null = null;
  private soundscapePanner: StereoPannerNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isSoundscapeRunning: boolean = false;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private lastDragTickTime: number = 0;
  private currentAzimuth: number = 0; // -1 (left) to 1 (right)

  private state: SpatialAudioState = {
    isMuted: false,
    masterVolume: 0.85,
    soundscapeEnabled: true,
    soundscapeVolume: 0.12, // Subtle, ethereal ambient presence
  };

  private listeners: Array<(state: SpatialAudioState) => void> = [];

  constructor() {
    // Lazy AudioContext initialization on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.getAudioContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  public subscribe(cb: (state: SpatialAudioState) => void): () => void {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.setupAudioGraph();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupAudioGraph() {
    if (!this.ctx) return;

    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(
      this.state.isMuted ? 0 : this.state.masterVolume,
      this.ctx.currentTime
    );
    this.masterGain.connect(this.ctx.destination);

    // 2. Synthetic Acoustic Studio Reverb (Algorithmic impulse response)
    this.reverbNode = this.createStudioReverbNode(this.ctx, 1.8, 0.035);
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    // 3. Ambient Soundscape Sub-Bus
    this.soundscapeGain = this.ctx.createGain();
    this.soundscapeGain.gain.setValueAtTime(
      this.state.soundscapeEnabled && !this.state.isMuted ? this.state.soundscapeVolume : 0,
      this.ctx.currentTime
    );

    this.soundscapeFilter = this.ctx.createBiquadFilter();
    this.soundscapeFilter.type = 'lowpass';
    this.soundscapeFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.soundscapeFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    if (this.ctx.createStereoPanner) {
      this.soundscapePanner = this.ctx.createStereoPanner();
      this.soundscapePanner.pan.setValueAtTime(0, this.ctx.currentTime);
      this.soundscapeGain.connect(this.soundscapeFilter);
      this.soundscapeFilter.connect(this.soundscapePanner);
      this.soundscapePanner.connect(this.masterGain);
    } else {
      this.soundscapeGain.connect(this.soundscapeFilter);
      this.soundscapeFilter.connect(this.masterGain);
    }

    if (this.state.soundscapeEnabled) {
      this.startSoundscape();
    }
  }

  /**
   * Generates a pristine synthetic impulse response modeling an Apple acoustic studio
   */
  private createStudioReverbNode(ctx: AudioContext, duration: number, decay: number): ConvolverNode {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-t / decay) * (1 - t / duration);
      // High-density white noise with subtle stereo decorrelation
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Continuous, subtle ethereal spatial soundscape (crystalline resonant air)
   */
  public startSoundscape() {
    const ctx = this.getAudioContext();
    if (!ctx || !this.soundscapeGain || this.isSoundscapeRunning) return;

    this.isSoundscapeRunning = true;
    const now = ctx.currentTime;

    // Harmonic crystalline drone chords: Root (216Hz), 5th (324Hz), Octave (432Hz), 9th (486Hz)
    const freqs = [216.0, 324.0, 432.0, 486.0];
    this.ambientOscillators = [];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle slow beating LFO for organic breathing shimmer
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, now);
      lfoGain.gain.setValueAtTime(freq * 0.008, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      const targetGain = 0.025 / (idx + 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(targetGain, now + 2.5);

      osc.connect(gain);
      gain.connect(this.soundscapeGain!);
      osc.start(now);
      this.ambientOscillators.push(osc);
    });

    // Very soft high-frequency colored air noise (~4.5kHz bandpass)
    try {
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(4200, now);
      noiseFilter.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.006, now + 3.0);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.soundscapeGain!);
      noise.start(now);
      this.ambientNoiseSource = noise;
    } catch {}
  }

  public stopSoundscape() {
    if (!this.isSoundscapeRunning || !this.ctx || !this.soundscapeGain) return;
    const now = this.ctx.currentTime;
    this.soundscapeGain.gain.cancelScheduledValues(now);
    this.soundscapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    setTimeout(() => {
      this.ambientOscillators.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
      this.ambientOscillators = [];
      if (this.ambientNoiseSource) {
        try {
          this.ambientNoiseSource.stop();
          this.ambientNoiseSource.disconnect();
        } catch {}
        this.ambientNoiseSource = null;
      }
      this.isSoundscapeRunning = false;
    }, 900);
  }

  /**
   * Updates dynamic spatial parameters based on 3D badge orientation & lighting
   * @param azimuth Horizontal rotation / pan (-1.0 to 1.0)
   * @param elevation Vertical tilt (-1.0 to 1.0)
   * @param angularVelocity Rotation speed to dynamically modulate air shimmer
   * @param colorTemp Lighting Kelvin (2700K to 8500K) to adjust acoustic brightness
   */
  public updateSpatialState(
    azimuth: number = 0,
    elevation: number = 0,
    angularVelocity: number = 0,
    colorTemp: number = 5800
  ) {
    this.currentAzimuth = Math.max(-1, Math.min(1, azimuth));
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Stereo Pan smooth transition
    if (this.soundscapePanner) {
      this.soundscapePanner.pan.setTargetAtTime(this.currentAzimuth * 0.65, now, 0.08);
    }

    // 2. Adjust acoustic warmth based on color temperature (Planckian locus shift)
    if (this.soundscapeFilter) {
      // 2700K -> warm lowpass ~900Hz, 8500K -> airy bright lowpass ~2800Hz
      const targetCutoff = 800 + (colorTemp - 2700) * 0.35;
      this.soundscapeFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);
    }

    // 3. Dynamic air swirl if user is spinning the badge actively
    if (this.soundscapeGain && this.state.soundscapeEnabled && !this.state.isMuted) {
      const speedBoost = Math.min(0.08, angularVelocity * 0.25);
      const targetGain = this.state.soundscapeVolume + speedBoost;
      this.soundscapeGain.gain.setTargetAtTime(targetGain, now, 0.06);
    }
  }

  /**
   * Synthesizes a high-fidelity physical 'clink' sound (liquid glass & milled metal medal)
   * @param variant Type of clink interaction
   * @param pan Stereo panning (-1 to 1) based on screen/3D hit point
   */
  public playClink(variant: ClinkVariant = 'tap', pan: number = 0) {
    if (this.state.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const panPos = Math.max(-1, Math.min(1, pan !== 0 ? pan : this.currentAzimuth));

    // Spatial Panner for individual clink event
    let panner: StereoPannerNode | null = null;
    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(panPos, now);
      panner.connect(this.masterGain);
      if (this.reverbNode) {
        panner.connect(this.reverbNode);
      }
    }

    const outputNode: AudioNode = panner || this.masterGain;

    switch (variant) {
      case 'tap': {
        // Crisp, high-end Apple Watch medal tap (sapphire glass + titanium body)
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 2850,
          overtones: [4320, 6800, 9400],
          bodyThump: 180,
          decay: 0.09,
          transientGain: 0.18,
          ringGain: 0.12,
        });
        break;
      }

      case 'rotate_tick': {
        // High-precision micro-clink during dragging (rate limited)
        if (now - this.lastDragTickTime < 0.05) return;
        this.lastDragTickTime = now;

        const pitchShift = 1.0 + (Math.random() * 0.12 - 0.06);
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 3400 * pitchShift,
          overtones: [5800 * pitchShift, 8200 * pitchShift],
          bodyThump: 220,
          decay: 0.035,
          transientGain: 0.09,
          ringGain: 0.05,
        });
        break;
      }

      case 'flip': {
        // Heavier, satisfying metallic clink when flipping 180° to space-gray backplate
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 1650,
          overtones: [2480, 3960, 5600],
          bodyThump: 92,
          decay: 0.22,
          transientGain: 0.28,
          ringGain: 0.18,
        });
        break;
      }

      case 'facet': {
        // Crystal glass facet clink (delicate, high-pitched prism ring)
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 3820,
          overtones: [5940, 8420, 11600],
          bodyThump: 310,
          decay: 0.14,
          transientGain: 0.14,
          ringGain: 0.15,
        });
        break;
      }

      case 'heavy': {
        // Deep unibody medal strike
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 1280,
          overtones: [2150, 3420, 5100],
          bodyThump: 78,
          decay: 0.32,
          transientGain: 0.32,
          ringGain: 0.22,
        });
        break;
      }

      case 'slider': {
        // Ultra-crisp tactile notch micro-clink
        this.synthesizeGlassMetalClink(ctx, outputNode, {
          fundamental: 4200,
          overtones: [7800],
          bodyThump: 450,
          decay: 0.02,
          transientGain: 0.08,
          ringGain: 0.04,
        });
        break;
      }
    }
  }

  /**
   * Synthesizes a physical glass-metal strike using multi-modal inharmonic partials
   */
  private synthesizeGlassMetalClink(
    ctx: AudioContext,
    destination: AudioNode,
    params: {
      fundamental: number;
      overtones: number[];
      bodyThump: number;
      decay: number;
      transientGain: number;
      ringGain: number;
    }
  ) {
    const now = ctx.currentTime;

    // 1. Ultra-sharp contact transient (initial strike click 4-8kHz)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(4500, now);

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(6200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.006);

    clickGain.gain.setValueAtTime(params.transientGain, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.008);

    // 2. Glass / Metal Fundamental Ringing Mode
    const fundOsc = ctx.createOscillator();
    const fundGain = ctx.createGain();

    fundOsc.type = 'sine';
    fundOsc.frequency.setValueAtTime(params.fundamental, now);

    fundGain.gain.setValueAtTime(params.ringGain, now);
    fundGain.gain.exponentialRampToValueAtTime(0.0001, now + params.decay);

    fundOsc.connect(fundGain);
    fundGain.connect(destination);

    fundOsc.start(now);
    fundOsc.stop(now + params.decay + 0.01);

    // 3. Inharmonic Glass Crystal Overtones (Modal synthesis)
    params.overtones.forEach((freq, idx) => {
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();

      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq, now);

      const overtoneDecay = params.decay * (0.85 / (idx + 1));
      overtoneGain.gain.setValueAtTime(params.ringGain * (0.65 / (idx + 1)), now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + overtoneDecay);

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(destination);

      overtoneOsc.start(now);
      overtoneOsc.stop(now + overtoneDecay + 0.01);
    });

    // 4. Low-mid medal body weight thump
    if (params.bodyThump > 0) {
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();

      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(params.bodyThump, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(params.bodyThump * 0.45, now + 0.04);

      bodyGain.gain.setValueAtTime(params.transientGain * 0.7, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(destination);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.05);
    }
  }

  /**
   * Synthesizes distinct, high-fidelity 'chimes' for badge unlocking & achievements
   * @param variant Type of chime to trigger
   * @param step Optional unlock step index (0 to 10) for progressive musical ascent
   */
  public playChime(variant: ChimeVariant = 'unlock_fanfare', step: number = 0) {
    if (this.state.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    switch (variant) {
      case 'unlock_step': {
        // Ascending crystalline step chime as the badge morphs during unlock sequence
        const pentatonicScale = [
          523.25, // C5
          587.33, // D5
          659.25, // E5
          783.99, // G5
          880.00, // A5
          1046.50, // C6
          1174.66, // D6
          1318.51, // E6
          1567.98, // G6
          1760.00, // A6
          2093.00, // C7
        ];
        const noteIndex = Math.min(step, pentatonicScale.length - 1);
        const pitch = pentatonicScale[noteIndex];
        const panPos = ((noteIndex / pentatonicScale.length) * 2 - 1) * 0.55;

        this.synthesizeCrystallineChimeNote(ctx, pitch, now, 0.45, 0.14, panPos);
        break;
      }

      case 'unlock_fanfare': {
        // Majestic Apple Award Grand Unlock Fanfare
        // Celestial 5-note crystalline chord cascading with spatial stereo spread
        const fanfareChords = [
          { freq: 659.25, delay: 0.0, pan: -0.45, duration: 1.8 }, // E5
          { freq: 783.99, delay: 0.07, pan: -0.2, duration: 2.0 }, // G5
          { freq: 987.77, delay: 0.14, pan: 0.05, duration: 2.2 }, // B5
          { freq: 1174.66, delay: 0.22, pan: 0.3, duration: 2.5 }, // D6
          { freq: 1567.98, delay: 0.32, pan: 0.55, duration: 2.8 }, // G6
          { freq: 2349.32, delay: 0.42, pan: 0.0, duration: 2.4 }, // D7 (shimmer crown)
        ];

        fanfareChords.forEach((note) => {
          this.synthesizeCrystallineChimeNote(
            ctx,
            note.freq,
            now + note.delay,
            note.duration,
            0.16,
            note.pan
          );
        });

        // Add a gentle resonant sub-bass anchor (130Hz) for physical satisfaction
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(130.81, now);
        subGain.gain.setValueAtTime(0.18, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + 1.25);
        break;
      }

      case 'crystallize': {
        // High-frequency crystal sparkle chime (e.g. when specular light glides across)
        const shimmerNotes = [2093.0, 2637.02, 3135.96, 4186.01]; // C7, E7, G7, C8
        shimmerNotes.forEach((freq, idx) => {
          this.synthesizeCrystallineChimeNote(
            ctx,
            freq,
            now + idx * 0.05,
            0.9,
            0.08,
            (idx - 1.5) * 0.35
          );
        });
        break;
      }

      case 'celestial': {
        // Deep pure singing-bowl chime when opening detail view
        this.synthesizeCrystallineChimeNote(ctx, 880.0, now, 2.2, 0.18, 0);
        this.synthesizeCrystallineChimeNote(ctx, 1320.0, now + 0.04, 1.8, 0.12, 0.2);
        this.synthesizeCrystallineChimeNote(ctx, 1760.0, now + 0.08, 1.5, 0.09, -0.2);
        break;
      }
    }
  }

  /**
   * Synthesizes an individual crystalline bell chime with stereo spatialization & reverb
   */
  private synthesizeCrystallineChimeNote(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number,
    pan: number
  ) {
    if (!this.masterGain) return;

    // Stereo Panner Node
    let panner: StereoPannerNode | null = null;
    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);
      panner.connect(this.masterGain);
      if (this.reverbNode) {
        panner.connect(this.reverbNode);
      }
    }

    const dest: AudioNode = panner || this.masterGain;

    // 1. Primary Bell Fundamental (pure sine)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);

    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.exponentialRampToValueAtTime(volume, startTime + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(gain1);
    gain1.connect(dest);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.05);

    // 2. Shimmering Detuned Double (Chorused singing glass effect)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 1.0025, startTime); // Subtle 4 cents detune

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.exponentialRampToValueAtTime(volume * 0.45, startTime + 0.012);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.8);

    osc2.connect(gain2);
    gain2.connect(dest);

    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.05);

    // 3. High Crystal Sparkle Harmonic (2.75x and 4.0x partials)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(frequency * 2.76, startTime);

    gain3.gain.setValueAtTime(volume * 0.25, startTime);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.45);

    osc3.connect(gain3);
    gain3.connect(dest);

    osc3.start(startTime);
    osc3.stop(startTime + duration * 0.5);
  }

  // --- Public State Controls ---

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(
        this.state.isMuted ? 0 : this.state.masterVolume,
        now
      );
    }
    this.notify();
    return this.state.isMuted;
  }

  public setMuted(muted: boolean) {
    if (this.state.isMuted === muted) return;
    this.state.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : this.state.masterVolume,
        now
      );
    }
    this.notify();
  }

  public setSoundscapeEnabled(enabled: boolean) {
    this.state.soundscapeEnabled = enabled;
    if (enabled) {
      this.startSoundscape();
      if (this.soundscapeGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.soundscapeGain.gain.cancelScheduledValues(now);
        this.soundscapeGain.gain.setValueAtTime(
          this.state.isMuted ? 0 : this.state.soundscapeVolume,
          now
        );
      }
    } else {
      this.stopSoundscape();
    }
    this.notify();
  }

  public setSoundscapeVolume(vol: number) {
    this.state.soundscapeVolume = Math.max(0, Math.min(1, vol));
    if (this.soundscapeGain && this.ctx && this.state.soundscapeEnabled && !this.state.isMuted) {
      this.soundscapeGain.gain.setTargetAtTime(this.state.soundscapeVolume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getState(): SpatialAudioState {
    return { ...this.state };
  }
}

// Global Singleton Instance
export const spatialAudio = new SpatialAudioEngine();
