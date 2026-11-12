/**
 * WORLD 14 · Topiary Garden (庄园修剪)
 *
 * 核心体验：
 * 阳光明媚的英式庄园，园艺剪刀沿轮廓修剪灌木，小叶片飘落；
 * 最终形成真实植物质感的 3D 绿色立体字母；完成时镜头微升展示整体雕塑。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

interface TopiaryVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  trimK: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 英式庄园阳光与草坪
  ctx.scene.background = new T.Color(0xafe0ff);
  ctx.scene.fog = new T.Fog(0xafe0ff, 18, 60);
  ctx.camera.position.set(0, 1.8, 10.5);
  ctx.camera.lookAt(0, 0.5, 0);

  const amb = new T.AmbientLight(0xfff8ee, 1.2);
  root.add(amb);
  const sun = new T.DirectionalLight(0xfffaec, 1.6);
  sun.position.set(7, 14, 8);
  sun.castShadow = ctx.quality > 0;
  root.add(sun);

  // 庄园修剪草坪
  const lawn = new T.Mesh(
    new T.BoxGeometry(26, 1, 14),
    new T.MeshStandardMaterial({ color: 0x48942b, roughness: 0.9 })
  );
  lawn.position.set(0, -1.8, 0);
  lawn.receiveShadow = ctx.quality > 0;
  root.add(lawn);

  // 飘落绿叶粒子
  const leaves = new Particles({
    capacity: 600,
    gravity: [0, -1.8, 0],
    drag: 1.2,
    size: 0.045,
    shape: 'flake',
    opacity: 0.9,
  });
  root.add(leaves.points);

  // 园艺剪刀工具模型
  const shearsGroup = new T.Group();
  const bladeL = new T.Mesh(
    new T.BoxGeometry(0.04, 0.6, 0.02),
    new T.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 })
  );
  bladeL.rotateZ(-Math.PI / 8);
  const bladeR = new T.Mesh(
    new T.BoxGeometry(0.04, 0.6, 0.02),
    new T.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 })
  );
  bladeR.rotateZ(Math.PI / 8);
  shearsGroup.add(bladeL);
  shearsGroup.add(bladeR);
  shearsGroup.position.set(5, -3, 0.3);
  root.add(shearsGroup);

  // 植物树篱材质
  const topiaryMat = new T.MeshStandardMaterial({
    color: 0x2d6e1d,
    roughness: 0.88,
    metalness: 0.05,
  });

  const visuals = new Map<number, TopiaryVisual>();

  ctx.glyphs.loadOutlineFont().catch(() => {});

  function getGeometry(ch: string) {
    if (ctx.glyphs.outlineReady) {
      try {
        return ctx.glyphs.outline(ch.toUpperCase(), { depth: 0.36, bevel: 0.08 });
      } catch {}
    }
    const glyph = ctx.glyphs.get(ch, 'sans');
    return ctx.glyphs.tube(glyph, 0.09, 8, true);
  }

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
      const geo = getGeometry(ev.char);
      const mesh = new T.Mesh(geo, topiaryMat);
      mesh.castShadow = ctx.quality > 0;

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: TopiaryVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat: topiaryMat,
        trimK: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(450, 180);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.trimK = sample.u;
          if (tip && sample.down && Math.random() < 0.45) {
            leaves.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z + 0.05,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -0.3 - Math.random() * 0.4,
              vz: 0.2 + Math.random() * 0.3,
              life: 0.8,
              color: 0x3d9426,
            });
            ctx.audio.play('tap', { pitch: 1.6, gain: 0.35 });
          }
        },
        onDone: () => {
          visual.trimK = 1;
        },
      });

      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const v = visuals.get(ev.id);
      if (!v) return;
      v.erasing = true;
      ctx.audio.play('thud', { pitch: 1.4, gain: 0.4 });
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
      if (leaves.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      const tool = controller.tools[0];
      if (tool) {
        shearsGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      for (const [id, v] of visuals.entries()) {
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
      leaves.dispose();
      disposeObject(shearsGroup);
      disposeObject(lawn);
      disposeObject(root);
    },
  };
}

export const topiaryGarden: WorldModule = { create };
