/**
 * WORLD 03 · Lightsaber Writing (能量剑书写)
 *
 * 核心体验：
 * 深色科幻空间中，原创科幻能量剑快速挥动，剑尖沿正确笔画路径运动，
 * 留下一道高亮能量轨迹并逐渐稳定为清晰字母；完成单词时产生能量脉冲。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { ToolController } from '../engine/tools';

interface SaberVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  drawn: number;
  pulse: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. Minimal dark stage (classic 3D Type look): near-black, a faint floor + one inlaid line
  ctx.scene.background = new T.Color(0x020203);
  ctx.scene.fog = new T.FogExp2(0x020203, 0.05);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  root.add(new T.HemisphereLight(0x6f86a8, 0x07090c, 0.35));
  const dir = new T.DirectionalLight(0x8aa0c8, 0.5);
  dir.position.set(-7, 10, 6);
  root.add(dir);

  const floor = new T.Mesh(
    new T.PlaneGeometry(80, 40),
    new T.MeshStandardMaterial({ color: 0x07080b, roughness: 0.55, metalness: 0.3 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.6;
  root.add(floor);
  const inlay = new T.Mesh(new T.PlaneGeometry(80, 0.025), new T.MeshBasicMaterial({ color: 0x1a1f28 }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.set(0, -1.596, 0);
  root.add(inlay);

  // 2. 能量剑模型 (hilt + glowing blade)
  const saberGroup = new T.Group();
  const hilt = new T.Mesh(
    new T.CylinderGeometry(0.04, 0.04, 0.4, 10),
    new T.MeshStandardMaterial({ color: 0x333338, metalness: 0.9, roughness: 0.2 })
  );
  hilt.translateY(0.2);
  hilt.rotateZ(-Math.PI / 4);
  saberGroup.add(hilt);

  const blade = new T.Mesh(
    new T.CylinderGeometry(0.035, 0.035, 1.4, 12),
    new T.MeshBasicMaterial({ color: 0x58c7ff })
  );
  blade.translateY(1.0);
  blade.rotateZ(-Math.PI / 4);
  saberGroup.add(blade);
  saberGroup.position.set(5, 4, 0.5);
  root.add(saberGroup);

  // 3. 能量光轨着色器
  function createBladeShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uCore: { value: new T.Color(0xffffff) },
        uGlow: { value: new T.Color(0x38b0ff) },
        uPulse: { value: 1.0 },
      },
      vertexShader: `
        attribute float aU;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          vU = aU;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uCore;
        uniform vec3 uGlow;
        uniform float uPulse;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(uCore, uGlow, 0.35 + 0.65 * pow(fresnel, 0.55)) * (1.0 * uPulse);
          gl_FragColor = vec4(c, 1.0);
        }
      `,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, SaberVisual>();

  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.35,
    maxQueue: 2,
    approach: 0.14,
    rest: () => new T.Vector3(5, 4, 0.5),
    restDelay: 1.0,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const tubeGeo = ctx.glyphs.tube(glyph, 0.07, 8, true);

      const mat = createBladeShader();
      const mesh = new T.Mesh(tubeGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: SaberVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        drawn: ev.restoring ? 1 : 0,
        pulse: 1,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.drawn;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(420, 160);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
        },
        onDone: () => {
          visual.drawn = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.audio.play('hum', { pitch: 1.6, gain: 0.4 });
      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const v = visuals.get(ev.id);
      if (!v) return;
      v.erasing = true;
      ctx.audio.play('zap', { pitch: 1.2, gain: 0.4 });
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
      ctx.audio.play('zap', { pitch: 1.6, gain: 0.8 });
      for (const v of visuals.values()) v.pulse = 2.5;
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      controller.flush();
      for (const v of visuals.values()) disposeObject(v.group);
      visuals.clear();
    },

    updateAnimation(dt: number): boolean {
      let moving = false;
      if (controller.update(dt)) moving = true;

      const tool = controller.tools[0];
      if (tool) {
        saberGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      for (const [id, v] of visuals.entries()) {
        if (v.pulse > 1) {
          v.pulse = Math.max(1, v.pulse - dt * 3.0);
          v.mat.uniforms.uPulse.value = v.pulse;
          moving = true;
        }

        if (v.erasing) {
          v.eraseK += dt * 4.0;
          const k = v.eraseK;
          v.group.scale.set(1 - k, 1 - k, 1 - k);
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
      disposeObject(saberGroup);
      disposeObject(root);
    },
  };
}

export const lightsaber: WorldModule = { create };
