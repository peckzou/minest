/**
 * Adaptive typing tempo.
 *
 * Tracks recent inter-key intervals and the number of visuals still "in flight"
 * and turns that into a time scale for animations: slow typists see the full
 * process; fast typists get compressed key actions and parallel generation.
 */
import type { Tempo } from './types';

export class TempoTracker {
  private stamps: number[] = [];
  /** number of letter animations currently in progress (reported by worlds) */
  backlog = 0;
  reducedMotion = false;

  key(now = performance.now()) {
    this.stamps.push(now);
    if (this.stamps.length > 8) this.stamps.shift();
  }

  /** burst insert (paste): counts as very fast typing */
  burst(n: number, now = performance.now()) {
    for (let i = 0; i < Math.min(n, 6); i++) this.stamps.push(now - (6 - i) * 40);
    while (this.stamps.length > 8) this.stamps.shift();
  }

  /** average interval of recent keys (ms); Infinity when idle */
  interval(now = performance.now()): number {
    const s = this.stamps;
    if (s.length < 2) return Infinity;
    if (now - s[s.length - 1] > 1500) return Infinity;
    let sum = 0;
    let n = 0;
    for (let i = Math.max(1, s.length - 5); i < s.length; i++) {
      sum += s[i] - s[i - 1];
      n++;
    }
    return sum / n;
  }

  get tempo(): Tempo {
    const iv = this.interval();
    if (iv < 170 || this.backlog > 3) return 'fast';
    if (iv < 380 || this.backlog > 1) return 'normal';
    return 'slow';
  }

  /**
   * Duration for a key action.
   * @param slowMs full-process duration (slow typing)
   * @param fastMs compressed duration (fast typing) — should still be readable
   */
  duration(slowMs: number, fastMs = slowMs * 0.35): number {
    const iv = this.interval();
    // map interval 120ms → 1, 500ms+ → 0
    let k = iv === Infinity ? 0 : Math.min(1, Math.max(0, (500 - iv) / 380));
    k = Math.max(k, Math.min(1, this.backlog / 5));
    let d = slowMs + (fastMs - slowMs) * k;
    if (this.reducedMotion) d *= 0.6;
    return d / 1000;
  }

  /** multiplier for decorative particle counts */
  get detail(): number {
    const t = this.tempo;
    return this.reducedMotion ? 0.3 : t === 'fast' ? 0.45 : t === 'normal' ? 0.75 : 1;
  }
}
