/**
 * Tool & Character Controller
 *
 * Drives one or more tools (chalk, wand, quill, chisel, plane…) along glyph pen plans.
 * - Jobs are distributed to the least busy tool (round-robin on ties) so several tools
 *   can write different letters at the same time (e.g. 3 skywriting planes).
 * - When a tool falls behind, queued jobs are fast-forwarded by a "ghost" writer
 *   (the letter still draws itself in stroke order, just without the tool), so the
 *   visual never lags far behind the real text and nothing ever blocks input.
 * - Tool tips move continuously (approach arcs between letters, no teleporting).
 */
import * as THREE from 'three';
import type { GlyphEngine, Glyph, PenPlan, PenSample } from './glyphs/glyph-engine';
import type { Layout, Slot } from './layout';

export interface WriteJob {
  id: number;
  glyph: Glyph;
  slot: Slot;
  /** seconds for the pen-down part at normal speed */
  duration: number;
  /** called every frame with progress; tip is null for ghost writing */
  onProgress: (s: PenSample, tip: THREE.Vector3 | null, job: WriteJob) => void;
  onDone?: (job: WriteJob) => void;
  onStart?: (job: WriteJob, tool: Tool) => void;
  /** internal */
  plan?: PenPlan;
  t?: number;
  phase?: 'queued' | 'approach' | 'draw' | 'ghost' | 'done';
  approachT?: number;
  approachDur?: number;
  from?: THREE.Vector3;
  speed?: number;
}

export interface Tool {
  index: number;
  /** current tip world position */
  tip: THREE.Vector3;
  /** tip velocity (world units/s) */
  vel: THREE.Vector3;
  /** pen touching surface */
  down: boolean;
  /** 0..1 lift amount */
  lift: number;
  job: WriteJob | null;
  queue: WriteJob[];
  idle: number;
  /** rest position when idle */
  rest: THREE.Vector3;
  /** last pen sample (glyph-local) */
  sample: PenSample;
}

export interface ToolOptions {
  count?: number;
  /** lift height in glyph units (cap = 1) */
  liftHeight?: number;
  /** max queued jobs per tool before ghosting older ones */
  maxQueue?: number;
  /** time (s) to fly to the next letter start */
  approach?: number;
  /** where the tools rest */
  rest?: (i: number) => THREE.Vector3;
  /** seconds idle before returning to rest */
  restDelay?: number;
}

export class ToolController {
  tools: Tool[] = [];
  private ghosts: WriteJob[] = [];
  private rr = 0;
  private tmp = new THREE.Vector3();
  private prev = new THREE.Vector3();
  opts: Required<ToolOptions>;

  constructor(private glyphs: GlyphEngine, private layout: Layout, opts: ToolOptions = {}) {
    this.opts = {
      count: 1,
      liftHeight: 0.35,
      maxQueue: 1,
      approach: 0.16,
      rest: () => new THREE.Vector3(4, 2, 1),
      restDelay: 1.2,
      ...opts,
    } as Required<ToolOptions>;
    for (let i = 0; i < this.opts.count; i++) {
      const rest = this.opts.rest(i);
      this.tools.push({
        index: i,
        tip: rest.clone(),
        vel: new THREE.Vector3(),
        down: false,
        lift: 1,
        job: null,
        queue: [],
        idle: 10,
        rest,
        sample: { x: 0, y: 0, down: false, lift: 1, u: 0, stroke: 0, tx: 1, ty: 0 },
      });
    }
  }

  get busy() {
    return this.ghosts.length > 0 || this.tools.some((t) => t.job || t.queue.length);
  }

  pending() {
    return this.ghosts.length + this.tools.reduce((a, t) => a + (t.job ? 1 : 0) + t.queue.length, 0);
  }

  write(job: WriteJob) {
    job.plan = this.glyphs.plan(job.glyph);
    job.t = 0;
    job.phase = 'queued';
    job.speed = 1;
    // least busy tool, round robin on ties
    let best: Tool | null = null;
    let bestLoad = Infinity;
    for (let k = 0; k < this.tools.length; k++) {
      const t = this.tools[(this.rr + k) % this.tools.length];
      const load = (t.job ? 1 : 0) + t.queue.length;
      if (load < bestLoad) {
        best = t;
        bestLoad = load;
      }
    }
    this.rr = (this.rr + 1) % this.tools.length;
    best!.queue.push(job);
    // too far behind: ghost-write the oldest queued jobs
    while (best!.queue.length > this.opts.maxQueue) {
      const g = best!.queue.shift()!;
      g.phase = 'ghost';
      g.speed = 2.2;
      this.ghosts.push(g);
    }
  }

  /** letter deleted: drop its job wherever it is */
  cancel(id: number) {
    this.ghosts = this.ghosts.filter((g) => g.id !== id);
    for (const t of this.tools) {
      t.queue = t.queue.filter((j) => j.id !== id);
      if (t.job?.id === id) {
        t.job.phase = 'done';
        t.job = null;
      }
    }
  }

  /** finish everything instantly (Enter during writing, reduced motion) */
  flush() {
    const all = [...this.ghosts];
    for (const t of this.tools) {
      if (t.job) all.push(t.job);
      all.push(...t.queue);
      t.job = null;
      t.queue = [];
    }
    this.ghosts = [];
    for (const j of all) this.finish(j, null);
  }

  private finish(j: WriteJob, tip: THREE.Vector3 | null) {
    const s = this.glyphs.samplePlan(j.plan!, 1);
    s.u = 1;
    j.onProgress(s, tip, j);
    j.phase = 'done';
    j.onDone?.(j);
  }

  /** returns true while anything is moving */
  update(dt: number): boolean {
    let moving = false;
    // ghosts
    for (const g of this.ghosts) {
      g.t! += (dt / Math.max(0.05, g.duration)) * g.speed!;
      const s = this.glyphs.samplePlan(g.plan!, g.t!);
      g.onProgress(s, null, g);
      if (g.t! >= 1) {
        g.phase = 'done';
        g.onDone?.(g);
      }
    }
    this.ghosts = this.ghosts.filter((g) => g.phase !== 'done');
    if (this.ghosts.length) moving = true;

    for (const tool of this.tools) {
      this.prev.copy(tool.tip);
      if (!tool.job && tool.queue.length) {
        const j = tool.queue.shift()!;
        tool.job = j;
        j.phase = 'approach';
        j.from = tool.tip.clone();
        const start = this.glyphs.samplePlan(j.plan!, 0);
        this.layout.toWorld(j.slot, start.x, start.y, 0, this.tmp);
        const dist = j.from.distanceTo(this.tmp);
        j.approachDur = Math.min(0.45, this.opts.approach * (0.6 + dist * 0.25)) / (1 + tool.queue.length * 0.8);
        j.approachT = 0;
        j.onStart?.(j, tool);
      }
      const j = tool.job;
      if (j) {
        moving = true;
        tool.idle = 0;
        // speed up when the queue grows
        const boost = 1 + tool.queue.length * 0.9;
        if (j.phase === 'approach') {
          j.approachT! += dt / Math.max(0.01, j.approachDur!);
          const k = Math.min(1, j.approachT!);
          const e = k * k * (3 - 2 * k);
          const start = this.glyphs.samplePlan(j.plan!, 0);
          this.layout.toWorld(j.slot, start.x, start.y, 0, this.tmp);
          tool.tip.lerpVectors(j.from!, this.tmp, e);
          // arc up while travelling
          const lift = Math.sin(Math.PI * k) * this.opts.liftHeight * j.slot.size * 1.4;
          if (j.slot.plane === 'xy') tool.tip.z += lift;
          else tool.tip.y += lift;
          tool.down = false;
          tool.lift = Math.max(0.15, Math.sin(Math.PI * k));
          if (k >= 1) j.phase = 'draw';
        } else if (j.phase === 'draw') {
          j.t! += (dt / Math.max(0.05, j.duration)) * boost;
          const s = this.glyphs.samplePlan(j.plan!, j.t!, tool.sample);
          this.layout.toWorld(j.slot, s.x, s.y, s.lift * this.opts.liftHeight, tool.tip);
          tool.down = s.down;
          tool.lift = s.lift;
          j.onProgress(s, tool.tip, j);
          if (j.t! >= 1) {
            j.phase = 'done';
            j.onDone?.(j);
            tool.job = null;
            tool.lift = 1;
          }
        }
      } else {
        tool.idle += dt;
        tool.down = false;
        if (tool.idle > this.opts.restDelay) {
          const d = tool.tip.distanceTo(tool.rest);
          if (d > 0.002) {
            tool.tip.lerp(tool.rest, 1 - Math.exp(-3 * dt));
            moving = true;
          }
        } else {
          // hover slightly above the surface while waiting for the next key
          moving = true;
        }
      }
      if (dt > 0) tool.vel.subVectors(tool.tip, this.prev).divideScalar(dt);
    }
    return moving;
  }
}
