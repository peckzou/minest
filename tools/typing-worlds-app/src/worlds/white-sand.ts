/**
 * WORLD 10 · White Sand Trace (白沙书写)
 *
 * 核心体验：
 * 极简沙盘与细腻白沙，竹笔工具沿笔画划出字母；
 * 细沙被推向两侧留下真实凹槽与沙脊；完成后轻风拂过柔化边缘。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

interface SandVisual {
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

  // 1. 禅意日式沙盘空间
  ctx.scene.background = new T.Color(0xf5f0e6);
  ctx.scene.fog = new T.Fog(0xf5f0e6, 16, 50);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xfff6ec, 1.2);
  root.add(amb);
  const sun = new T.DirectionalLight(0xfff5ea, 1.4);
  sun.position.set(4, 10, 8);
  root.add(sun);

  // 白沙盘
  const sandTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#ece4d4';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40000; i++) {
      g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(160,140,110,0.08)';
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  });
  const sandMat = new T.MeshStandardMaterial({ map: sandTex, roughness: 0.95 });
  const tray = new T.Mesh(new T.BoxGeometry(16, 9.5, 0.6), sandMat);
  tray.position.set(0, 0.35, -0.35);
  root.add(tray);

  // 沙粒微尘
  const dust = new Particles({
    capacity: 600,
    gravity: [0, -2.0, 0],
    drag: 1.5,
    size: 0.035,
    shape: 'flake',
    opacity: 0.8,
  });
  root.add(dust.points);

  // 竹笔工具
  const bambooGroup = new T.Group();
  const stylus = new T.Mesh(
    new T.CylinderGeometry(0.04, 0.015, 1.2, 10),
    new T.MeshStandardMaterial({ color: 0xd9b873, roughness: 0.5 })
  );
  stylus.translateY(0.6);
  stylus.rotateZ(-Math.PI / 5);
  bambooGroup.add(stylus);
  bambooGroup.position.set(5, -3, 0.3);
  root.add(bambooGroup);

  // 凹槽阴影着色器
  function createSandShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uGroove: { value: new T.Color(0xb5a691) },
        uOpacity: { value: 0.95 },
      },
      vertexShader: `
        attribute float aU;
        varying float vU;
        void main() {
          vU = aU;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uGroove;
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          gl_FragColor = vec4(uGroove, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, SandVisual>();

  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.25,
    maxQueue: 2,
    approach: 0.15,
    rest: () => new T.Vector3(5, -3, 0.3),
    restDelay: 1.0,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.09);

      const mat = createSandShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: SandVisual = {
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

      const dur = ctx.tempo.duration(450, 180);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.4) {
            dust.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z + 0.05,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.2 - Math.random() * 0.4,
              vz: 0.1 + Math.random() * 0.2,
              life: 0.6,
              color: 0xe4dac8,
            });
            ctx.audio.play('scratch', { pitch: 1.6, gain: 0.3 });
          }
        },
        onDone: () => {
          visual.drawn = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const v = visuals.get(ev.id);
      if (!v) return;
      v.erasing = true;
      ctx.audio.play('whoosh', { pitch: 1.5, gain: 0.4 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      controller.flush();
      ctx.audio.play('success', { gain: 0.7 });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(1800);
    },

    onTextClear() {
      controller.flush();
      for (const v of visuals.values()) disposeObject(v.group);
      visuals.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (dust.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      const tool = controller.tools[0];
      if (tool) {
        bambooGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      for (const [id, v] of visuals.entries()) {
        if (v.erasing) {
          v.eraseK += dt * 4.0;
          const k = v.eraseK;
          v.mat.uniforms.uOpacity.value = Math.max(0, 0.95 * (1 - k));
          if (k >= 1) {
            disposeObject(v.group);
            visuals.delete(id);
          }
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      controller.flush();
      for (const v of visuals.values()) disposeObject(v.group);
      visuals.clear();
      dust.dispose();
      sandTex.dispose();
      sandMat.dispose();
      disposeObject(bambooGroup);
      disposeObject(tray);
      disposeObject(root);
    },
  };
}

export const whiteSand: WorldModule = { create };
