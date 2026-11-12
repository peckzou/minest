/**
 * WORLD 13 · Skywriting (飞机烟迹)
 *
 * 核心体验：
 * 蔚蓝天空与体面白云背景，三架特技飞机轮流书写字母笔画；
 * 机翼转弯自然倾斜，尾迹留下逐渐扩散的白色柔软烟雾；
 * Enter 时三架飞机呈编队掠过，整个云朵单词微受气流扰动。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

interface CloudVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  drawn: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 蓝天与白云
  ctx.scene.background = new T.Color(0x57a6f2);
  ctx.scene.fog = new T.Fog(0x57a6f2, 25, 75);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xffffff, 1.2);
  root.add(amb);
  const sun = new T.DirectionalLight(0xfff8ee, 1.4);
  sun.position.set(8, 16, 10);
  root.add(sun);

  // 2. 烟迹粒子
  const smokeParticles = new Particles({
    capacity: 1200,
    gravity: [0, 0.1, 0],
    drag: 0.6,
    size: 0.08,
    shape: 'flake',
    opacity: 0.6,
  });
  root.add(smokeParticles.points);

  // 3. 3 架特技飞机模型
  const planesGroup = new T.Group();
  const planeMeshes: THREE.Group[] = [];

  function buildAirplane(color: number) {
    const p = new T.Group();
    // 机身
    const body = new T.Mesh(new T.ConeGeometry(0.08, 0.5, 6), new T.MeshStandardMaterial({ color }));
    body.rotation.x = Math.PI / 2;
    p.add(body);
    // 机翼
    const wing = new T.Mesh(new T.BoxGeometry(0.7, 0.02, 0.14), new T.MeshStandardMaterial({ color: 0xffffff }));
    wing.position.set(0, 0, 0.05);
    p.add(wing);
    // 尾翼
    const tail = new T.Mesh(new T.BoxGeometry(0.24, 0.02, 0.08), new T.MeshStandardMaterial({ color }));
    tail.position.set(0, 0, -0.2);
    p.add(tail);
    const fin = new T.Mesh(new T.BoxGeometry(0.02, 0.12, 0.08), new T.MeshStandardMaterial({ color }));
    fin.position.set(0, 0.06, -0.2);
    p.add(fin);
    return p;
  }

  const PLANE_COLORS = [0xff3b30, 0xffcc00, 0x007aff];
  for (let i = 0; i < 3; i++) {
    const pl = buildAirplane(PLANE_COLORS[i]);
    pl.position.set((i - 1) * 3, 6, -2);
    planesGroup.add(pl);
    planeMeshes.push(pl);
  }
  root.add(planesGroup);

  // 4. 烟迹笔画着色器
  function createSmokeShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 0.85 },
      },
      vertexShader: `
        attribute float aU;
        varying float vU;
        varying vec2 vPos;
        void main() {
          vU = aU;
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uOpacity;
        varying float vU;
        varying vec2 vPos;
        void main() {
          if (vU > uProgress) discard;
          float n = fract(sin(dot(vPos ,vec2(12.9898,78.233))) * 43758.5453);
          float alpha = smoothstep(0.0, 0.1, uProgress - vU) * (0.8 + n * 0.2);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, CloudVisual>();

  // 3 架飞机多机调度器
  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 3,
    liftHeight: 0.4,
    maxQueue: 2,
    approach: 0.2,
    rest: (i) => new T.Vector3((i - 1) * 4, 5, 0.5),
    restDelay: 1.2,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.12);

      const mat = createSmokeShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: CloudVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        drawn: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.drawn;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(480, 200);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.6) {
            smokeParticles.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              vz: (Math.random() - 0.5) * 0.2,
              life: 1.5,
              size: 1.2,
              color: 0xffffff,
            });
          }
        },
        onDone: () => {
          visual.drawn = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.audio.play('whoosh', { pitch: 1.4, gain: 0.4 });
      ctx.keepAlive(1600);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const visual = visuals.get(ev.id);
      if (!visual) return;
      visual.erasing = true;
      ctx.audio.play('whoosh', { pitch: 0.8, gain: 0.4 });
      ctx.keepAlive(700);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      controller.flush();
      ctx.audio.play('success', { gain: 0.8 });
      // Enter: 三机编队低空掠过
      planeMeshes.forEach((p, idx) => {
        p.position.set(-14 + idx * 2, 0.4 + idx * 0.6, 1);
      });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2500);
    },

    onTextClear() {
      controller.flush();
      for (const visual of visuals.values()) disposeObject(visual.group);
      visuals.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (smokeParticles.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      // 同步 3 架飞机的 3D 姿态
      controller.tools.forEach((t, i) => {
        const pMesh = planeMeshes[i];
        if (!pMesh) return;
        pMesh.position.copy(t.tip);

        // 倾斜机翼银行角 (bank angle)
        const bank = THREE.MathUtils.clamp(t.vel.x * 0.15, -0.6, 0.6);
        pMesh.rotation.z = -bank;
        pMesh.rotation.y = Math.atan2(t.vel.x, t.vel.y || 0.01) * 0.3;
        if (t.job || t.queue.length || t.idle < 1.0) moving = true;
      });

      // 删除淡出
      for (const [id, visual] of visuals.entries()) {
        if (visual.erasing) {
          visual.eraseK += dt * 3.5;
          const k = visual.eraseK;
          visual.mat.uniforms.uOpacity.value = Math.max(0, 0.85 * (1 - k));
          if (k >= 1) {
            disposeObject(visual.group);
            visuals.delete(id);
          }
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      controller.flush();
      for (const visual of visuals.values()) disposeObject(visual.group);
      visuals.clear();
      smokeParticles.dispose();
      disposeObject(planesGroup);
      disposeObject(root);
    },
  };
}

export const skywriting: WorldModule = { create };
