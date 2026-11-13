/**
 * WORLD 12 · Firework Typography (烟花字)
 *
 * 核心体验：
 * 每敲一个键发射一枚礼花弹升空，在目标位置沿字母轮廓爆开；
 * 发光粒子组成清晰字母并逐渐进入微弱余烬状态；
 * Enter 时全词同时再次辉煌绽放并化为星尘。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';

interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  color: THREE.Color;
  life: number;
  maxLife: number;
  settled: boolean;
}

interface FireworkLetter {
  id: number;
  char: string;
  sparks: Spark[];
  launchY: number;
  phase: 'launch' | 'burst' | 'afterglow';
  t: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 漆黑夜空与深蓝星尘
  ctx.scene.background = new T.Color(0x020308);
  ctx.scene.fog = new T.FogExp2(0x020308, 0.035);
  ctx.camera.position.set(0, 0.5, 11);
  ctx.camera.lookAt(0, 0.45, 0);

  const amb = new T.AmbientLight(0x201535, 0.5);
  root.add(amb);

  // 2. 烟花粒子系统
  const particles = new Particles({
    capacity: 4200,
    gravity: [0, -0.6, 0],
    drag: 0.8,
    size: 0.11,
    shape: 'spark',
    opacity: 1.0,
  });
  root.add(particles.points);

  const letters = new Map<number, FireworkLetter>();
  const COLORS = [0xff4d33, 0xffd13b, 0x47e5ff, 0xff66cc, 0x57ff8a];

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const pts = ctx.glyphs.pointsByCount(glyph, 45);
      const colorVal = COLORS[ev.id % COLORS.length];
      const col = new T.Color(colorVal);

      const sparks: Spark[] = [];
      pts.forEach((p) => {
        const target = ctx.layout.toWorld(slot, p.x, p.y, 0);
        sparks.push({
          x: target.x,
          y: ev.restoring ? target.y : -6,
          z: target.z,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          vz: (Math.random() - 0.5) * 2,
          targetX: target.x,
          targetY: target.y,
          targetZ: target.z,
          color: col,
          life: 1.0,
          maxLife: 1.0,
          settled: ev.restoring,
        });
      });

      letters.set(ev.id, {
        id: ev.id,
        char: ev.char,
        sparks,
        launchY: -6,
        phase: ev.restoring ? 'afterglow' : 'launch',
        t: 0,
      });

      if (!ev.restoring) {
        ctx.audio.play('whoosh', { pitch: 1.5, gain: 0.5 });
      }
      ctx.keepAlive(2000);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const l = letters.get(ev.id);
      if (!l) return;
      ctx.audio.play('pop', { pitch: 1.6, gain: 0.4 });
      for (const s of l.sparks) {
        particles.emit({
          x: s.x,
          y: s.y,
          z: s.z,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 2,
          vz: (Math.random() - 0.5) * 2,
          life: 0.5,
          color: s.color,
        });
      }
      letters.delete(ev.id);
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, l] of letters.entries()) {
        const slot = ctx.slotOf(id);
        if (!slot) continue;
        const glyph = ctx.glyphs.get(l.char, 'sans');
        const pts = ctx.glyphs.pointsByCount(glyph, l.sparks.length);
        pts.forEach((p, idx) => {
          if (l.sparks[idx]) {
            const target = ctx.layout.toWorld(slot, p.x, p.y, 0);
            l.sparks[idx].targetX = target.x;
            l.sparks[idx].targetY = target.y;
            l.sparks[idx].targetZ = target.z;
          }
        });
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('boom', { pitch: 1.0, gain: 0.9 });
      // Enter: 全词同时重新点亮并爆发终极绽放
      for (const l of letters.values()) {
        for (const s of l.sparks) {
          for (let k = 0; k < 3; k++) {
            particles.emit({
              x: s.targetX,
              y: s.targetY,
              z: s.targetZ,
              vx: (Math.random() - 0.5) * 9,
              vy: 2 + (Math.random() - 0.5) * 8,
              vz: (Math.random() - 0.5) * 5,
              life: 1.4 + Math.random() * 0.6,
              color: s.color,
            });
          }
        }
      }
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2500);
    },

    onTextClear() {
      letters.clear();
      particles.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      const step = Math.min(dt, 1 / 30);

      for (const l of letters.values()) {
        if (l.phase === 'launch') {
          l.launchY += step * 24;
          const targetY = l.sparks[0]?.targetY ?? 0;
          particles.emit({
            x: l.sparks[0]?.targetX ?? 0,
            y: l.launchY,
            z: 0,
            vy: -1,
            size: 0.6,
            life: 0.25,
            color: 0xffe6a3,
          });
          if (l.launchY >= targetY) {
            l.phase = 'burst';
            l.t = 0;
            ctx.audio.play('crack', { pitch: 1.2, gain: 0.7 });
          }
          moving = true;
          continue;
        }

        if (l.phase === 'burst') {
          l.t += step;
          l.sparks.forEach((s) => {
            s.x += s.vx * step;
            s.y += s.vy * step;
            s.vx = (s.vx + (s.targetX - s.x) * 14 * step) * Math.exp(-8 * step);
            s.vy = (s.vy + (s.targetY - s.y) * 14 * step) * Math.exp(-8 * step);
            particles.emit({
              x: s.x,
              y: s.y,
              z: s.z,
              life: 0.2,
              size: 0.8,
              color: s.color,
            });
          });
          if (l.t > 0.6) l.phase = 'afterglow';
          moving = true;
          continue;
        }

        // afterglow: 余烬闪烁
        l.sparks.forEach((s, idx) => {
          if (Math.random() < 0.6) {
            const glow = 0.85 + Math.sin(time * 8 + idx) * 0.15;
            particles.emit({
              x: s.targetX + (Math.random() - 0.5) * 0.04,
              y: s.targetY + (Math.random() - 0.5) * 0.04,
              z: s.targetZ,
              life: 0.18,
              size: glow,
              color: s.color,
            });
          }
        });
        moving = true;
      }

      if (particles.update(dt, time)) moving = true;
      return moving;
    },

    disposeWorld() {
      letters.clear();
      particles.dispose();
      disposeObject(root);
    },
  };
}

export const fireworks: WorldModule = { create };
