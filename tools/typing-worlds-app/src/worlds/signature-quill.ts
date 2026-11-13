/**
 * WORLD 07 · Signature Quill (鹅毛笔签名)
 *
 * 核心体验：
 * 悬浮鹅毛笔在典雅木桌平铺纸张上书写花体字，墨迹具有粗细变化；
 * 墨迹刚写出时微湿发亮，随后自然变干；完成单词出现优雅收笔。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';
import { ToolController } from '../engine/tools';

interface InkVisual {
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
  // letters lie flat on the paper (the default vertical layout cut them in half at the desk)
  const prevLayout = { ...ctx.layout.opts };
  ctx.layout.setOptions({ metric: 'script', size: 1.1, tracking: 0.05, maxWidth: 10, maxLines: 2, lineHeight: 1.7, origin: [0, 0.03, 0.2], plane: 'xz', minScale: 0.4 });

  // 1. 暗色书桌：近黑背景，一束暖光照在信纸上（经典 3D Type 的 Quill 风格）
  ctx.scene.background = new T.Color(0x0a0605);
  ctx.scene.fog = new T.Fog(0x0a0605, 12, 26);
  ctx.camera.position.set(0, 5.5, 8.5);
  ctx.camera.lookAt(0, 0, 0);

  const amb = new T.HemisphereLight(0xfff0dc, 0x1a0f08, 0.35);
  root.add(amb);
  const lamp = new T.SpotLight(0xffd6a0, 170, 0, 0.62, 0.85, 2);
  lamp.position.set(2.5, 11, 5);
  lamp.target.position.set(0, 0, 0);
  lamp.castShadow = ctx.quality > 0;
  root.add(lamp, lamp.target);

  // 暗哑桌面（几乎融入背景）
  const deskMat = new T.MeshStandardMaterial({ color: 0x120b07, roughness: 0.9, metalness: 0 });
  const desk = new T.Mesh(new T.PlaneGeometry(40, 30), deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = ctx.quality > 0;
  root.add(desk);

  // 平铺羊皮信纸
  const paperTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#ddd0b8';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 20000; i++) {
      g.fillStyle = `rgba(180,150,120,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  const paperMat = new T.MeshStandardMaterial({ map: paperTex, roughness: 0.85 });
  const paper = new T.Mesh(new T.PlaneGeometry(11, 5), paperMat);
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(0, 0.02, 0);
  paper.receiveShadow = ctx.quality > 0;
  root.add(paper);

  // 墨水瓶
  const inkwell = new T.Mesh(
    new T.CylinderGeometry(0.35, 0.45, 0.6, 16),
    new T.MeshStandardMaterial({ color: 0x111116, roughness: 0.2, metalness: 0.8 })
  );
  inkwell.position.set(4.6, 0.3, -3.4);
  root.add(inkwell);

  // 2. 3D 悬浮鹅毛笔
  const quillGroup = new T.Group();
  // 笔杆
  const stem = new T.Mesh(
    new T.CylinderGeometry(0.025, 0.01, 1.8, 8),
    new T.MeshStandardMaterial({ color: 0xedebe4, roughness: 0.4 })
  );
  stem.translateY(0.9);
  stem.rotateZ(Math.PI / 5);
  quillGroup.add(stem);
  // 羽毛片
  const feather = new T.Mesh(
    new T.PlaneGeometry(0.3, 1.2),
    new T.MeshStandardMaterial({ color: 0xfcfbf7, roughness: 0.7, side: T.DoubleSide })
  );
  feather.position.set(0.35, 1.1, 0);
  feather.rotateZ(Math.PI / 5);
  quillGroup.add(feather);

  quillGroup.position.set(4.6, 0.8, -3.1);
  root.add(quillGroup);

  // 3. 墨迹着色器 (粗细变化与湿干过渡)
  function createInkShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 0.92 },
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
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          // 深棕铁胆墨水
          vec3 inkColor = vec3(0.12, 0.09, 0.07);
          gl_FragColor = vec4(inkColor, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, InkVisual>();

  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.28,
    maxQueue: 2,
    approach: 0.16,
    rest: () => new T.Vector3(4.6, 0.8, -3.1),
    restDelay: 1.0,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'script');
      // 花体压力粗细变化
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.09, (u, su, tx, ty) => {
        return 0.6 + Math.abs(ty) * 0.9;
      });

      const mat = createInkShader();
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
        drawn: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.drawn;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(440, 180);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.25) {
            ctx.audio.play('scratch', { pitch: 1.2 + Math.random() * 0.2, gain: 0.35 });
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
      ctx.audio.play('scratch', { pitch: 0.8, gain: 0.4 });
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
        quillGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      for (const [id, v] of visuals.entries()) {
        if (v.erasing) {
          v.eraseK += dt * 4.0;
          const k = v.eraseK;
          v.mat.uniforms.uOpacity.value = Math.max(0, 0.92 * (1 - k));
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
      paperTex.dispose();
      paperMat.dispose();
      deskMat.dispose();
      disposeObject(quillGroup);
      disposeObject(root);
      ctx.layout.setOptions(prevLayout);
    },
  };
}

export const signatureQuill: WorldModule = { create };
