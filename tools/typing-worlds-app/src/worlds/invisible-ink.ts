/**
 * WORLD 22 · Invisible Ink (隐形墨水)
 *
 * 核心体验：
 * 古典木质桌面与羊皮纸、暖光蜡烛；隐形墨水先在纸上出现湿润透明笔迹，
 * 金光沿笔画蔓延烘烤，留下古铜色墨迹；Enter 时全词从左至右重新亮起。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';

interface InkVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  heat: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 暖调古典书房
  ctx.scene.background = new T.Color(0x1a120b);
  ctx.scene.fog = new T.Fog(0x1a120b, 14, 45);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xffedd8, 1.0);
  root.add(amb);
  const candle = new T.PointLight(0xffa834, 2.5, 20);
  candle.position.set(-6, 2, 4);
  root.add(candle);

  // 羊皮纸背板
  const paperTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#edd7b6';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 25000; i++) {
      g.fillStyle = `rgba(130,90,50,${Math.random() * 0.04})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  const paper = new T.Mesh(new T.PlaneGeometry(16, 9.5), new T.MeshStandardMaterial({ map: paperTex, roughness: 0.9 }));
  paper.position.set(0, 0.35, -0.05);
  root.add(paper);

  // 蜡烛台模型
  const candleGroup = new T.Group();
  const candleWax = new T.Mesh(
    new T.CylinderGeometry(0.2, 0.2, 1.2, 12),
    new T.MeshStandardMaterial({ color: 0xfaf2de, roughness: 0.5 })
  );
  candleWax.translateY(0.6);
  const flame = new T.Mesh(
    new T.OctahedronGeometry(0.12, 0),
    new T.MeshBasicMaterial({ color: 0xffa834 })
  );
  flame.position.set(0, 1.3, 0);
  candleGroup.add(candleWax);
  candleGroup.add(flame);
  candleGroup.position.set(-6.5, -3.2, 0.5);
  root.add(candleGroup);

  // 显色着色器
  function createSecretInkShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uHeatColor: { value: new T.Color(0xffc247) },
        uInkColor: { value: new T.Color(0x4a2a14) },
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
        uniform vec3 uHeatColor;
        uniform vec3 uInkColor;
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          float heatK = smoothstep(0.0, 0.25, uProgress - vU);
          vec3 c = mix(uHeatColor, uInkColor, heatK);
          gl_FragColor = vec4(c, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, InkVisual>();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'script');
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.08);

      const mat = createSecretInkShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: InkVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        heat: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.heat;
      visuals.set(ev.id, visual);

      if (!ev.restoring) {
        ctx.audio.play('sparkle', { pitch: 1.4, gain: 0.4 });
      }
      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const v = visuals.get(ev.id);
      if (!v) return;
      v.erasing = true;
      ctx.audio.play('pop', { pitch: 0.8, gain: 0.4 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.7 });
      // Enter: 从左至右重新亮起
      refs.forEach((r, idx) => {
        const v = visuals.get(r.id);
        if (v) {
          ctx.setTimeout(() => {
            v.mat.uniforms.uHeatColor.value.set(0xfff0aa);
          }, idx * 70);
        }
      });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const v of visuals.values()) disposeObject(v.group);
      visuals.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;

      // 蜡烛火苗跳动
      flame.scale.set(1 + Math.sin(time * 12) * 0.15, 1 + Math.cos(time * 10) * 0.2, 1);
      candle.intensity = 2.4 + Math.sin(time * 14) * 0.2;
      moving = true;

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
          continue;
        }

        if (v.heat < 1) {
          v.heat = Math.min(1, v.heat + dt * 3.4);
          v.mat.uniforms.uProgress.value = v.heat;
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      for (const v of visuals.values()) disposeObject(v.group);
      visuals.clear();
      paperTex.dispose();
      disposeObject(candleGroup);
      disposeObject(paper);
      disposeObject(root);
    },
  };
}

export const invisibleInk: WorldModule = { create };
