/**
 * WORLD 11 · Genesis Lab (创世实验室)
 *
 * 核心体验：
 * 借鉴《西部世界》片头的高对比度黑白机械制造，全黑背景与冷白聚光灯；
 * 精密机械臂喷出极细白色合成丝线，交织形成三维骨架并逐步固化为白色立体雕塑。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { ToolController } from '../engine/tools';

interface GenesisVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  progress: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 极致黑白电影光影
  ctx.scene.background = new T.Color(0x020203);
  ctx.scene.fog = new T.Fog(0x020203, 14, 45);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0x222228, 0.6);
  root.add(amb);
  const spot = new T.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.4);
  spot.position.set(0, 14, 8);
  spot.castShadow = ctx.quality > 0;
  root.add(spot);

  // 纯黑台面
  const stage = new T.Mesh(
    new T.CylinderGeometry(14, 14, 0.4, 48),
    new T.MeshStandardMaterial({ color: 0x08080a, roughness: 0.8, metalness: 0.2 })
  );
  stage.position.set(0, -2.5, 0);
  root.add(stage);

  // 机械臂模型
  const armGroup = new T.Group();
  const segment1 = new T.Mesh(
    new T.CylinderGeometry(0.06, 0.08, 1.4, 8),
    new T.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.2 })
  );
  segment1.translateY(0.7);
  segment1.rotateZ(Math.PI / 4);
  armGroup.add(segment1);
  const nozzle = new T.Mesh(
    new T.ConeGeometry(0.04, 0.2, 8),
    new T.MeshBasicMaterial({ color: 0xffffff })
  );
  nozzle.translateY(-0.1);
  armGroup.add(nozzle);
  armGroup.position.set(5, 4, 0.5);
  root.add(armGroup);

  // 合成丝线织造着色器
  function createWeaveShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 1.0 },
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
        uniform float uOpacity;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(vec3(0.95), vec3(1.0), fresnel);
          gl_FragColor = vec4(c, uOpacity);
        }
      `,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, GenesisVisual>();

  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.35,
    maxQueue: 2,
    approach: 0.16,
    rest: () => new T.Vector3(5, 4, 0.5),
    restDelay: 1.0,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const tubeGeo = ctx.glyphs.tube(glyph, 0.08, 10, true);

      const mat = createWeaveShader();
      const mesh = new T.Mesh(tubeGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: GenesisVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        progress: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.progress;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(480, 200);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.progress = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.2) {
            ctx.audio.play('tick', { pitch: 1.8, gain: 0.25 });
          }
        },
        onDone: () => {
          visual.progress = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.audio.play('hum', { pitch: 1.4, gain: 0.3 });
      ctx.keepAlive(1600);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const v = visuals.get(ev.id);
      if (!v) return;
      v.erasing = true;
      ctx.audio.play('zap', { pitch: 1.5, gain: 0.4 });
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
        armGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      for (const [id, v] of visuals.entries()) {
        if (v.erasing) {
          v.eraseK += dt * 4.0;
          const k = v.eraseK;
          v.mat.uniforms.uOpacity.value = Math.max(0, 1 - k);
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
      disposeObject(armGroup);
      disposeObject(stage);
      disposeObject(root);
    },
  };
}

export const genesisLab: WorldModule = { create };
