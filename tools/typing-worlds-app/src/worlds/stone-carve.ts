/**
 * WORLD 08 · Stone Carve (石刻)
 *
 * 核心体验：
 * 温润天然石板，金属凿刀沿轮廓移动，小木槌快速轻敲；
 * 石材刻槽逐渐加深，细微石粉散落，呈现真实雕刻立体深度。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

interface CarveVisual {
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

  // 1. 石板神殿光影
  ctx.scene.background = new T.Color(0x1a1917);
  ctx.scene.fog = new T.Fog(0x1a1917, 16, 50);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xffeedd, 1.0);
  root.add(amb);
  const dir = new T.DirectionalLight(0xfff5ea, 1.6);
  dir.position.set(5, 9, 8);
  dir.castShadow = ctx.quality > 0;
  root.add(dir);

  // 天然大石板
  const stoneTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#8a8378';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++) {
      g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  const stoneMat = new T.MeshStandardMaterial({ map: stoneTex, roughness: 0.88, metalness: 0.05 });
  const slab = new T.Mesh(new T.BoxGeometry(16, 9.5, 0.8), stoneMat);
  slab.position.set(0, 0.35, -0.45);
  slab.receiveShadow = ctx.quality > 0;
  root.add(slab);

  // 石粉粒子
  const dust = new Particles({
    capacity: 600,
    gravity: [0, -3.0, 0],
    drag: 1.6,
    size: 0.035,
    shape: 'flake',
    opacity: 0.85,
  });
  root.add(dust.points);

  // 凿刀模型
  const chiselGroup = new T.Group();
  const chiselBlade = new T.Mesh(
    new T.BoxGeometry(0.12, 0.9, 0.04),
    new T.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.3 })
  );
  chiselBlade.translateY(0.45);
  chiselBlade.rotateZ(-Math.PI / 6);
  chiselGroup.add(chiselBlade);
  chiselGroup.position.set(5, -3, 0.3);
  root.add(chiselGroup);

  // 凹槽着色器 (刻入石材呈现阴影内陷)
  function createGrooveShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uDepthColor: { value: new T.Color(0x38342f) },
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
        uniform vec3 uDepthColor;
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          gl_FragColor = vec4(uDepthColor, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, CarveVisual>();

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

      const glyph = ctx.glyphs.get(ev.char, 'serif');
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.08);

      const mat = createGrooveShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: CarveVisual = {
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

      const dur = ctx.tempo.duration(460, 190);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.5) {
            dust.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z + 0.05,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -0.4 - Math.random() * 0.5,
              vz: 0.1 + Math.random() * 0.3,
              life: 0.7,
              color: 0xc4bcb0,
            });
            ctx.audio.play('tap', { pitch: 1.1 + Math.random() * 0.2, gain: 0.4 });
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
      ctx.audio.play('thud', { pitch: 1.2, gain: 0.4 });
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
        chiselGroup.position.copy(tool.tip);
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
      stoneTex.dispose();
      stoneMat.dispose();
      disposeObject(chiselGroup);
      disposeObject(slab);
      disposeObject(root);
    },
  };
}

export const stoneCarve: WorldModule = { create };
