/**
 * Animation helpers: easing, springs, a tiny timeline/tween runner, seeded random.
 * Worlds call `tweens.update(dt)` from updateAnimation().
 */

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp(t), 3);
export const easeInOutCubic = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (t: number, s = 1.70158) => {
  t = clamp(t) - 1;
  return t * t * ((s + 1) * t + s) + 1;
};
export const easeOutElastic = (t: number) => {
  t = clamp(t);
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};
/** frame-rate independent exponential approach */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Critically/under-damped scalar spring */
export class Spring {
  v = 0;
  constructor(public x = 0, public target = 0, public k = 180, public c = 12) {}
  update(dt: number) {
    // semi-implicit euler with sub-steps for stability
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  impulse(v: number) {
    this.v += v;
  }
  get resting() {
    return Math.abs(this.v) < 1e-3 && Math.abs(this.x - this.target) < 1e-3;
  }
  snap() {
    this.x = this.target;
    this.v = 0;
  }
}

export interface Tween {
  t: number;
  dur: number;
  delay: number;
  fn: (k: number) => void;
  done?: () => void;
  cancelled?: boolean;
}

/** Minimal tween runner. Every tween always finishes (fn(1)) — even when fast-forwarded. */
export class Tweens {
  private list: Tween[] = [];
  add(dur: number, fn: (k: number) => void, opts: { delay?: number; done?: () => void } = {}): Tween {
    const tw: Tween = { t: 0, dur: Math.max(1e-4, dur), delay: opts.delay ?? 0, fn, done: opts.done };
    this.list.push(tw);
    return tw;
  }
  /** returns true if any tween is active */
  update(dt: number): boolean {
    if (!this.list.length) return false;
    const list = this.list;
    this.list = [];
    const keep: Tween[] = [];
    for (const tw of list) {
      if (tw.cancelled) continue;
      if (tw.delay > 0) {
        tw.delay -= dt;
        keep.push(tw);
        continue;
      }
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(k);
      if (k >= 1) tw.done?.();
      else keep.push(tw);
    }
    this.list = keep.concat(this.list);
    return this.list.length > 0;
  }
  /** complete everything immediately */
  finishAll() {
    let guard = 0;
    while (this.list.length && guard++ < 20) {
      const list = this.list;
      this.list = [];
      for (const tw of list) {
        if (tw.cancelled) continue;
        tw.fn(1);
        tw.done?.();
      }
    }
  }
  clear() {
    this.list = [];
  }
  get active() {
    return this.list.length;
  }
}

/** Deterministic random (mulberry32) */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
