/**
 * WORLD 09 · Woodcarve (木刻)
 *
 * 核心体验：
 * 浅枫木/胡桃木木板上，弯口木雕刀沿路径切削；
 * 微小卷曲木屑卷起落下，刻槽露出浅色木质内部，完成时工具抬起。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

interface WoodVisual {
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

  // 1. 暖调工坊环境
  ctx.scene.background = new T.Color(0x23180f);
  ctx.scene.fog = new T.Fog(0x23180f, 16, 50);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xffeedd, 1.1);
  root.add(amb);
  const dir = new T.DirectionalLight(0xffebc4, 1.6);
  dir.position.set(5, 8, 8);
  root.add(dir);

  // 胡桃木木纹板
  const woodTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#6b4526';
    g.fillRect(0, 0, w, h);
    // 木质年轮纹理
    for (let y = 0; y < h; y += 4) {
      const alpha = 0.05 + 0.05 * Math.sin(y * 0.1);
      g.fillStyle = `rgba(0,0,0,${alpha})`;
      g.fillRect(0, y, w, 2);
    }
  });
  const boardMat = new T.MeshStandardMaterial({ map: woodTex, roughness: 0.75, metalness: 0.05 });
  const board = new T.Mesh(new T.BoxGeometry(16, 9.5, 0.8), boardMat);
  board.position.set(0, 0.35, -0.45);
  root.add(board);

  // 木屑粒子
  const shavings = new Particles({
    capacity: 600,
    gravity: [0, -2.5, 0],
    drag: 1.4,
    size: 0.045,
    shape: 'flake',
    opacity: 0.9,
  });
  root.add(shavings.points);

  // 雕刀模型
  const knifeGroup = new T.Group();
  const handle = new T.Mesh(
    new T.CylinderGeometry(0.06, 0.06, 0.8, 12),
    new T.MeshStandardMaterial({ color: 0x3d2011, roughness: 0.6 })
  );
  handle.translateY(0.4);
  handle.rotateZ(-Math.PI / 5);
  const blade = new T.Mesh(
    new T.BoxGeometry(0.08, 0.25, 0.02),
    new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.2 })
  );
  blade.translateY(-0.1);
  blade.rotateZ(-Math.PI / 5);
  knifeGroup.add(handle);
  knifeGroup.add(blade);
  knifeGroup.position.set(5, -3, 0.3);
  root.add(knifeGroup);

  // 刻槽着色器 (浅枫木内芯)
  function createGougeShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uWoodInner: { value: new T.Color(0xf4dfbe) },
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
        uniform vec3 uWoodInner;
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          gl_FragColor = vec4(uWoodInner, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const visuals = new Map<number, WoodVisual>();

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
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.085);

      const mat = createGougeShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: WoodVisual = {
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
          if (tip && sample.down && Math.random() < 0.45) {
            shavings.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z + 0.05,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.3 - Math.random() * 0.4,
              vz: 0.2 + Math.random() * 0.3,
              life: 0.65,
              color: 0xedd6b4,
            });
            ctx.audio.play('scratch', { pitch: 1.4, gain: 0.35 });
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
      ctx.audio.play('scratch', { pitch: 0.9, gain: 0.4 });
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
      if (shavings.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      const tool = controller.tools[0];
      if (tool) {
        knifeGroup.position.copy(tool.tip);
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
      shavings.dispose();
      woodTex.dispose();
      boardMat.dispose();
      disposeObject(knifeGroup);
      disposeObject(board);
      disposeObject(root);
    },
  };
}

export const woodcarve: WorldModule = { create };
