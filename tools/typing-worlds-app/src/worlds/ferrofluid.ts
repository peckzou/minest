/**
 * WORLD 15 · Ferrofluid (磁流体)
 *
 * 核心体验：
 * 奶白色实验台上，黑色高反光磁流体受到隐形磁场牵引，从平静液面升起尖刺与流动曲面；
 * 稳定后呈现乌黑镜面金属光泽；删除时液滴重新融回液面。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

interface FerroLetter {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  yTarget: number;
  riseK: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 奶白色科学实验室空间
  ctx.scene.background = new T.Color(0xf6f6f2);
  ctx.scene.fog = new T.Fog(0xf6f6f2, 18, 55);
  ctx.camera.position.set(0, 1.8, 10.5);
  ctx.camera.lookAt(0, 0.6, 0);

  const amb = new T.AmbientLight(0xffffff, 1.2);
  root.add(amb);
  const key = new T.DirectionalLight(0xffffff, 1.8);
  key.position.set(6, 14, 8);
  key.castShadow = ctx.quality > 0;
  root.add(key);

  // 光滑陶瓷实验台面
  const dishMat = new T.MeshStandardMaterial({
    color: 0xedebe6,
    roughness: 0.2,
    metalness: 0.1,
    envMap: ctx.renderer.environment(),
  });
  const dish = new T.Mesh(new T.CylinderGeometry(14, 14, 0.4, 48), dishMat);
  dish.position.set(0, -0.2, 0);
  dish.receiveShadow = ctx.quality > 0;
  root.add(dish);

  // 黑色高反射磁流体材质
  const ferroMat = new T.MeshPhysicalMaterial({
    color: 0x0a0a0c,
    roughness: 0.08,
    metalness: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMap: ctx.renderer.environment(),
    envMapIntensity: 1.5,
  });

  const letters = new Map<number, FerroLetter>();

  ctx.glyphs.loadOutlineFont().catch(() => {});

  function getGeometry(ch: string) {
    if (ctx.glyphs.outlineReady) {
      try {
        return ctx.glyphs.outline(ch.toUpperCase(), { depth: 0.32, bevel: 0.07 });
      } catch {}
    }
    const glyph = ctx.glyphs.get(ch, 'sans');
    return ctx.glyphs.tube(glyph, 0.09, 8, true);
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const group = new T.Group();
      ctx.layout.apply(group, slot);

      const geo = getGeometry(ev.char);
      const mesh = new T.Mesh(geo, ferroMat);
      mesh.castShadow = ctx.quality > 0;
      mesh.receiveShadow = ctx.quality > 0;
      group.add(mesh);
      root.add(group);

      const yT = group.position.y;
      group.position.y = ev.restoring ? yT : -0.2; // 从液面内部升起

      letters.set(ev.id, {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        yTarget: yT,
        riseK: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      });

      if (!ev.restoring) {
        ctx.audio.play('squish', { pitch: 1.2, gain: 0.5 });
      }
      ctx.keepAlive(1200);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const l = letters.get(ev.id);
      if (!l) return;
      l.erasing = true;
      ctx.audio.play('squish', { pitch: 0.8, gain: 0.4 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, l] of letters.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) {
          ctx.layout.apply(l.group, slot);
          l.yTarget = l.group.position.y;
        }
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      // Enter: 磁力脉冲，表面微刺震颤
      for (const l of letters.values()) {
        l.group.scale.set(1.1, 1.2, 1.1);
      }
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const l of letters.values()) disposeObject(l.group);
      letters.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      const step = Math.min(dt, 1 / 30);

      for (const [id, l] of letters.entries()) {
        if (l.erasing) {
          l.eraseK += step * 4.5;
          const k = l.eraseK;
          l.group.position.y -= step * 3.5;
          l.group.scale.set(1 - k, 1 - k, 1 - k);
          if (k >= 1) {
            disposeObject(l.group);
            letters.delete(id);
          }
          moving = true;
          continue;
        }

        if (l.riseK < 1) {
          l.riseK = Math.min(1, l.riseK + step * 3.2);
          const e = l.riseK * l.riseK * (3 - 2 * l.riseK);
          l.group.position.y = -0.2 + (l.yTarget + 0.2) * e;
          // 尖刺拉起形变
          l.mesh.scale.set(0.85 + e * 0.15, 0.4 + e * 0.6, 0.85 + e * 0.15);
          moving = true;
        } else {
          // 磁流体微小表面流动扰动
          const wobble = Math.sin(time * 5 + l.id) * 0.02;
          l.mesh.scale.set(1 + wobble, 1 - wobble, 1 + wobble);
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      for (const l of letters.values()) disposeObject(l.group);
      letters.clear();
      ferroMat.dispose();
      dishMat.dispose();
      disposeObject(dish);
      disposeObject(root);
    },
  };
}

export const ferrofluid: WorldModule = { create };
