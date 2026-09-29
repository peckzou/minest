/**
 * SpringPhysicsIntegrator
 * High-precision Second-Order ODE (Mass-Spring-Damper) Physical Integrator for rAF loop
 * 
 * Equations of Motion:
 *   m * x'' + c * x' + k * x = F_ext
 *   a(t) = -(k/m) * x(t) - (c/m) * v(t)
 * 
 * Synchronizes visual displacement, velocity extrema, and zero-crossing points
 * with hardware haptic impulses (navigator.vibrate) at millisecond precision (<16ms per frame).
 */

export interface SpringConfig {
  mass: number;         // Mass in kg (default: 0.85)
  stiffness: number;    // Spring constant k in N/m (default: 380)
  damping: number;      // Damping coefficient c in N·s/m (default: 26)
  initialDisplacement: number; // x0 in normalized units (default: 1.0)
  initialVelocity: number;     // v0 in units/s (default: 12.0)
  restTolerance: number;       // Settle threshold (default: 0.001)
}

export interface SpringPhysicsTelemetry {
  timeMs: number;
  displacement: number;    // x (position relative to equilibrium)
  velocity: number;        // v (dx/dt)
  acceleration: number;    // a (dv/dt)
  kineticEnergy: number;   // 0.5 * m * v^2
  potentialEnergy: number; // 0.5 * k * x^2
  totalEnergy: number;
  springForce: number;     // -k * x
  dampingForce: number;    // -c * v
  isSettled: boolean;
  activePeak: 'impact' | 'rebound_crest' | 'trough' | 'none';
  hapticImpulseActive: boolean;
}

export class SpringPhysicsIntegrator {
  // Physical parameters
  public mass: number = 0.85;
  public stiffness: number = 380;
  public damping: number = 26;
  public restTolerance: number = 0.001;

  // Dynamic state
  public x: number = 0;       // Displacement
  public v: number = 0;       // Velocity
  public a: number = 0;       // Acceleration
  public target: number = 0;  // Equilibrium position

  // Previous frame tracking for peak & zero-crossing detection
  private prevV: number = 0;
  private prevX: number = 0;
  private peakCount: number = 0;
  private isSettled: boolean = false;
  private elapsedMs: number = 0;

  // Haptic state synchronization
  private hapticFiredImpact: boolean = false;
  private hapticFiredReboundPeak: boolean = false;
  private hapticFiredSecondaryTremor: boolean = false;
  public lastHapticTime: number = 0;
  public isHapticActive: boolean = false;

  // Event callbacks
  public onImpact?: (telemetry: SpringPhysicsTelemetry) => void;
  public onPeakOvershoot?: (telemetry: SpringPhysicsTelemetry, peakIndex: number) => void;
  public onSettle?: (telemetry: SpringPhysicsTelemetry) => void;
  public onHapticTrigger?: (type: string, intensity: number) => void;

  constructor(config?: Partial<SpringConfig>) {
    if (config) {
      this.configure(config);
    }
  }

  public configure(config: Partial<SpringConfig>) {
    if (config.mass !== undefined) this.mass = Math.max(0.1, config.mass);
    if (config.stiffness !== undefined) this.stiffness = Math.max(10, config.stiffness);
    if (config.damping !== undefined) this.damping = Math.max(1, config.damping);
    if (config.restTolerance !== undefined) this.restTolerance = config.restTolerance;
  }

  /**
   * Reset the integrator with initial impact impulse (at moment of snap)
   */
  public reset(initialDisplacement = 1.0, initialVelocity = 14.5) {
    this.x = initialDisplacement;
    this.v = initialVelocity;
    this.a = -(this.stiffness / this.mass) * this.x - (this.damping / this.mass) * this.v;
    this.prevX = this.x;
    this.prevV = this.v;
    this.peakCount = 0;
    this.isSettled = false;
    this.elapsedMs = 0;
    this.hapticFiredImpact = false;
    this.hapticFiredReboundPeak = false;
    this.hapticFiredSecondaryTremor = false;
    this.lastHapticTime = 0;
    this.isHapticActive = false;

    // Trigger Primary Impact Haptic exactly at t=0 (Impact contact)
    this.dispatchHaptic('snap_impact', 1.0);
    this.hapticFiredImpact = true;
  }

  /**
   * High-accuracy Semi-Implicit Euler numerical integration step
   * @param dtSeconds delta time in seconds (clamped to prevent explosion on tab blur)
   */
  public step(dtSeconds: number): SpringPhysicsTelemetry {
    if (this.isSettled) {
      return this.getTelemetry('none');
    }

    // Sub-stepping for maximum numerical stability during rapid snap
    const maxSubStep = 0.004; // 4ms sub-steps
    const clampedDt = Math.min(0.05, Math.max(0.0001, dtSeconds));
    const subSteps = Math.ceil(clampedDt / maxSubStep);
    const subDt = clampedDt / subSteps;

    let activePeak: 'impact' | 'rebound_crest' | 'trough' | 'none' = 'none';

    for (let i = 0; i < subSteps; i++) {
      // 1. Compute forces and acceleration: F = -k*(x - target) - c*v
      const displacement = this.x - this.target;
      const springForce = -this.stiffness * displacement;
      const dampingForce = -this.damping * this.v;
      const totalForce = springForce + dampingForce;
      this.a = totalForce / this.mass;

      // 2. Velocity update (Semi-implicit Euler)
      this.prevV = this.v;
      this.v += this.a * subDt;

      // 3. Position update
      this.prevX = this.x;
      this.x += this.v * subDt;

      this.elapsedMs += subDt * 1000;

      // 4. Zero-crossing and Velocity-Inversion Extreme Peak Detection
      // When velocity changes sign: d(x)/dt = 0 -> local maximum or minimum overshoot
      if ((this.prevV > 0 && this.v <= 0) || (this.prevV < 0 && this.v >= 0)) {
        this.peakCount++;
        if (this.x > this.target) {
          activePeak = 'rebound_crest';
          // Rebound Crest Haptic: fired synchronously when spring hits max outward recoil
          if (!this.hapticFiredReboundPeak && this.peakCount === 1) {
            this.hapticFiredReboundPeak = true;
            this.dispatchHaptic('rebound_crest', 0.65);
            if (this.onPeakOvershoot) {
              this.onPeakOvershoot(this.getTelemetry(activePeak), 1);
            }
          }
        } else {
          activePeak = 'trough';
          // Secondary Micro-tremor Haptic at second rebound
          if (!this.hapticFiredSecondaryTremor && this.peakCount === 2) {
            this.hapticFiredSecondaryTremor = true;
            this.dispatchHaptic('secondary_trough', 0.35);
          }
        }
      }
    }

    // 5. Energy-based settle evaluation
    const kineticEnergy = 0.5 * this.mass * this.v * this.v;
    const potentialEnergy = 0.5 * this.stiffness * Math.pow(this.x - this.target, 2);
    const totalEnergy = kineticEnergy + potentialEnergy;

    if (totalEnergy < this.restTolerance && Math.abs(this.x - this.target) < 0.005) {
      this.x = this.target;
      this.v = 0;
      this.a = 0;
      this.isSettled = true;
      if (this.onSettle) {
        this.onSettle(this.getTelemetry('none'));
      }
    }

    // Auto clear visual haptic pulse after 160ms
    if (this.isHapticActive && performance.now() - this.lastHapticTime > 160) {
      this.isHapticActive = false;
    }

    return this.getTelemetry(activePeak);
  }

  private dispatchHaptic(type: 'snap_impact' | 'rebound_crest' | 'secondary_trough', intensity: number) {
    this.lastHapticTime = performance.now();
    this.isHapticActive = true;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        switch (type) {
          case 'snap_impact':
            navigator.vibrate(Math.round(22 * intensity));
            break;
          case 'rebound_crest':
            navigator.vibrate(Math.round(12 * intensity));
            break;
          case 'secondary_trough':
            navigator.vibrate(Math.round(6 * intensity));
            break;
        }
      } catch {}
    }

    if (this.onHapticTrigger) {
      this.onHapticTrigger(type, intensity);
    }
  }

  public getTelemetry(activePeak: 'impact' | 'rebound_crest' | 'trough' | 'none' = 'none'): SpringPhysicsTelemetry {
    const disp = this.x - this.target;
    const ke = 0.5 * this.mass * this.v * this.v;
    const pe = 0.5 * this.stiffness * disp * disp;
    return {
      timeMs: this.elapsedMs,
      displacement: disp,
      velocity: this.v,
      acceleration: this.a,
      kineticEnergy: ke,
      potentialEnergy: pe,
      totalEnergy: ke + pe,
      springForce: -this.stiffness * disp,
      dampingForce: -this.damping * this.v,
      isSettled: this.isSettled,
      activePeak,
      hapticImpulseActive: this.isHapticActive,
    };
  }

  public forceSettle() {
    this.x = this.target;
    this.v = 0;
    this.a = 0;
    this.isSettled = true;
  }
}
