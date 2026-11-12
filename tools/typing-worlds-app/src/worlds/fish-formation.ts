/**
 * WORLD 05 · Fish Formation (鱼群成字)
 *
 * 核心体验：
 * 一群真实游动的小鱼从远处水底游来，转弯、聚拢并按目标字母轮廓编队形成清晰字母；
 * 鱼尾轻微摆动保持字形可读；Enter 后鱼群整散重汇游向远处。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

const THEMES = [
  { id: 'silver', label: '银色鱼群', color: 0xd8e8f8, metal: 0.8, rough: 0.2 },
  { id: 'tropical', label: '彩色热带鱼', color: 0xffaa33, metal: 0.1, rough: 0.4 },
  { id: 'luminous', label: '荧光鱼群', color: 0x44ffcc, metal: 0.2, rough: 0.1 },
];

const FISH_PER_LETTER = 36;

interface Boid {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  phase: number;
  state: 'swimming' | 'formed' | 'dispersing';
}

interface LetterFishSchool {
  id: number;
  char: string;
  boids: Boid[];
  mesh: THREE.InstancedMesh;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 深海场景与光线
  ctx.scene.background = new T.Color(0x061b36);
  ctx.scene.fog = new T.FogExp2(0x061b36, 0.04);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0x1a4575, 1.2);
  root.add(amb);
  const sun = new T.DirectionalLight(0x7ad0ff, 1.6);
  sun.position.set(5, 15, 8);
  root.add(sun);

  // 2. 鱼单体几何与材质
  let currentTheme = THEMES.find((t) => t.id === ctx.theme) ?? THEMES[0];
  const fishMat = new T.MeshStandardMaterial({
    color: currentTheme.color,
    metalness: currentTheme.metal,
    roughness: currentTheme.rough,
  });

  // 流线型小鱼模型
  const fishGeo = new T.ConeGeometry(0.045, 0.24, 6);
  fishGeo.rotateX(Math.PI / 2);

  const schools = new Map<number, LetterFishSchool>();
  const dummy = new T.Object3D();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const points = ctx.glyphs.pointsByCount(glyph, FISH_PER_LETTER);

      const boids: Boid[] = [];
      const instMesh = new T.InstancedMesh(fishGeo, fishMat, points.length || 1);
      root.add(instMesh);

      const startFarX = slot.center.x + (Math.random() - 0.5) * 8;
      const startFarY = slot.center.y - 6 - Math.random() * 4;
      const startFarZ = -8 - Math.random() * 6;

      points.forEach((pt, i) => {
        const target = ctx.layout.toWorld(slot, pt.x, pt.y, 0);
        boids.push({
          x: ev.restoring ? target.x : startFarX + (Math.random() - 0.5) * 3,
          y: ev.restoring ? target.y : startFarY + (Math.random() - 0.5) * 3,
          z: ev.restoring ? target.z : startFarZ + (Math.random() - 0.5) * 3,
          vx: 0,
          vy: 0,
          vz: 0,
          targetX: target.x,
          targetY: target.y,
          targetZ: target.z,
          phase: Math.random() * Math.PI * 2,
          state: ev.restoring ? 'formed' : 'swimming',
        });
      });

      schools.set(ev.id, { id: ev.id, char: ev.char, boids, mesh: instMesh });

      if (!ev.restoring) {
        ctx.audio.play('whoosh', { pitch: 1.3 + Math.random() * 0.2, gain: 0.4 });
      }
      ctx.keepAlive(2000);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const school = schools.get(ev.id);
      if (!school) return;
      for (const b of school.boids) {
        b.state = 'dispersing';
        b.vx = (Math.random() - 0.5) * 10;
        b.vy = 4 + Math.random() * 6;
        b.vz = -5 - Math.random() * 8;
      }
      ctx.setTimeout(() => {
        root.remove(school.mesh);
        school.mesh.dispose();
        schools.delete(ev.id);
      }, 700);
      ctx.audio.play('bubble', { pitch: 1.2, gain: 0.5 });
      ctx.keepAlive(800);
    },

    onLayout() {
      for (const [id, school] of schools.entries()) {
        const slot = ctx.slotOf(id);
        if (!slot) continue;
        const glyph = ctx.glyphs.get(school.char, 'sans');
        const points = ctx.glyphs.pointsByCount(glyph, school.boids.length);
        points.forEach((pt, idx) => {
          if (school.boids[idx]) {
            const target = ctx.layout.toWorld(slot, pt.x, pt.y, 0);
            school.boids[idx].targetX = target.x;
            school.boids[idx].targetY = target.y;
            school.boids[idx].targetZ = target.z;
          }
        });
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      // Enter: 整个单词所有小鱼散开并汇成一大股鱼群游向远方
      for (const school of schools.values()) {
        for (const b of school.boids) {
          b.state = 'dispersing';
          b.vx = 8 + Math.random() * 6;
          b.vy = 2 + (Math.random() - 0.5) * 4;
          b.vz = -10 - Math.random() * 10;
        }
      }
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(3000);
    },

    onTextClear() {
      for (const s of schools.values()) {
        root.remove(s.mesh);
        s.mesh.dispose();
      }
      schools.clear();
    },

    setTheme(themeId: string) {
      currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
      fishMat.color.set(currentTheme.color);
      fishMat.metalness = currentTheme.metal;
      fishMat.roughness = currentTheme.rough;
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      const step = Math.min(dt, 1 / 30);

      for (const school of schools.values()) {
        school.boids.forEach((b, i) => {
          if (b.state === 'dispersing') {
            b.x += b.vx * step;
            b.y += b.vy * step;
            b.z += b.vz * step;
            dummy.position.set(b.x, b.y, b.z);
            dummy.rotation.set(0, 0, Math.atan2(b.vy, b.vx) - Math.PI / 2);
            dummy.updateMatrix();
            school.mesh.setMatrixAt(i, dummy.matrix);
            moving = true;
            return;
          }

          // 引导力吸附编队目标
          const dx = b.targetX - b.x;
          const dy = b.targetY - b.y;
          const dz = b.targetZ - b.z;

          b.vx = (b.vx + dx * 16 * step) * Math.exp(-9 * step);
          b.vy = (b.vy + dy * 16 * step) * Math.exp(-9 * step);
          b.vz = (b.vz + dz * 16 * step) * Math.exp(-9 * step);

          b.x += b.vx * step;
          b.y += b.vy * step;
          b.z += b.vz * step;

          // 鱼尾轻微游动摆动
          const tailWag = Math.sin(time * 14 + b.phase) * 0.12;

          dummy.position.set(b.x, b.y, b.z);
          dummy.rotation.set(0, 0, Math.atan2(dy || 0.01, dx || 0.01) - Math.PI / 2 + tailWag);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          school.mesh.setMatrixAt(i, dummy.matrix);

          if (Math.hypot(dx, dy, dz) > 0.05) moving = true;
        });

        school.mesh.instanceMatrix.needsUpdate = true;
      }

      return moving;
    },

    disposeWorld() {
      for (const s of schools.values()) {
        root.remove(s.mesh);
        s.mesh.dispose();
      }
      schools.clear();
      fishGeo.dispose();
      fishMat.dispose();
      disposeObject(root);
    },
  };
}

export const fishFormation: WorldModule = { create };
