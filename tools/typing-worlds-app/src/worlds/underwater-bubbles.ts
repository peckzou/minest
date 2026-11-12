/**
 * WORLD 04 · Underwater Bubbles (海底气泡)
 *
 * 核心体验：
 * 字母落入深蓝色海底世界，扰动水体；每次按键均伴随小气泡群上升并逐渐消散；
 * 悬浮水生微粒随洋流浮动；Enter 时一条鱼类剪影游过。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 深海空间与体积光
  ctx.scene.background = new T.Color(0x04162e);
  ctx.scene.fog = new T.FogExp2(0x04162e, 0.045);
  ctx.camera.position.set(0, 0.5, 11);
  ctx.camera.lookAt(0, 0.4, 0);

  const amb = new T.AmbientLight(0x133866, 1.2);
  root.add(amb);

  const sunBeam = new T.DirectionalLight(0x73b9ff, 1.8);
  sunBeam.position.set(4, 16, 6);
  root.add(sunBeam);

  // 远景海底沙地微丘
  const seaFloor = new T.Mesh(
    new T.PlaneGeometry(36, 16, 32, 16),
    new T.MeshStandardMaterial({ color: 0x07213d, roughness: 0.9 })
  );
  seaFloor.rotation.x = -Math.PI / 2;
  seaFloor.position.set(0, -4.5, -2);
  root.add(seaFloor);

  // 2. 气泡系统
  const bubbles = new Particles({
    capacity: 1000,
    gravity: [0, 1.8, 0],
    drag: 0.4,
    size: 0.065,
    shape: 'ring',
    opacity: 0.85,
  });
  root.add(bubbles.points);

  // 3. 远景游动的鱼类剪影 (Enter 时掠过)
  const fishGroup = new T.Group();
  const fishBody = new T.Mesh(
    new T.ConeGeometry(0.3, 1.4, 8),
    new T.MeshBasicMaterial({ color: 0x0e3b66, transparent: true, opacity: 0.45 })
  );
  fishBody.rotation.z = -Math.PI / 2;
  fishGroup.add(fishBody);
  fishGroup.position.set(-20, 2, -6);
  root.add(fishGroup);
  let fishActive = false;

  // 4. 水下珊瑚/海蓝质感字母
  const letterMat = new T.MeshPhysicalMaterial({
    color: 0x54c4ff,
    roughness: 0.15,
    metalness: 0.1,
    transmission: 0.6,
    thickness: 0.5,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
    envMap: ctx.renderer.environment(),
  });

  interface BubbleLetter {
    id: number;
    char: string;
    group: THREE.Group;
    mesh: THREE.Mesh;
    yBase: number;
    wobble: number;
    erasing: boolean;
    eraseK: number;
  }

  const visuals = new Map<number, BubbleLetter>();

  ctx.glyphs.loadOutlineFont().catch(() => {});

  function getGeometry(ch: string) {
    if (ctx.glyphs.outlineReady) {
      try {
        return ctx.glyphs.outline(ch.toUpperCase(), { depth: 0.28, bevel: 0.06 });
      } catch {}
    }
    const glyph = ctx.glyphs.get(ch, 'sans');
    return ctx.glyphs.tube(glyph, 0.08, 8, true);
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const group = new T.Group();
      ctx.layout.apply(group, slot);

      const geo = getGeometry(ev.char);
      const mesh = new T.Mesh(geo, letterMat);
      mesh.castShadow = ctx.quality > 0;
      group.add(mesh);
      root.add(group);

      const y0 = group.position.y;
      group.position.y = ev.restoring ? y0 : y0 + 3.0;

      const visual: BubbleLetter = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        yBase: y0,
        wobble: Math.random() * Math.PI * 2,
        erasing: false,
        eraseK: 0,
      };
      visuals.set(ev.id, visual);

      if (!ev.restoring) {
        ctx.audio.play('bubble', { pitch: 0.9 + Math.random() * 0.3, gain: 0.6 });
        // 字母周围释放真实气泡群
        const cx = slot.center.x;
        const cy = slot.center.y;
        for (let i = 0; i < 20; i++) {
          bubbles.emit({
            x: cx + (Math.random() - 0.5) * 0.8,
            y: cy + (Math.random() - 0.5) * 0.6,
            z: slot.center.z + (Math.random() - 0.5) * 0.4,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.4 + Math.random() * 0.8,
            vz: (Math.random() - 0.5) * 0.3,
            wobble: 1.2,
            life: 1.8 + Math.random() * 1.2,
            size: 0.8 + Math.random() * 0.8,
            color: 0x9be8ff,
          });
        }
      }
      ctx.keepAlive(1500);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const visual = visuals.get(ev.id);
      if (!visual) return;
      visual.erasing = true;
      ctx.audio.play('bubble', { pitch: 1.4, gain: 0.5 });

      const slot = ctx.slotOf(ev.id);
      if (slot) {
        for (let i = 0; i < 15; i++) {
          bubbles.emit({
            x: slot.center.x + (Math.random() - 0.5) * 0.6,
            y: slot.center.y + (Math.random() - 0.5) * 0.6,
            z: 0,
            vy: 1.2 + Math.random() * 1.5,
            wobble: 1.5,
            life: 1.2,
            size: 1.0,
            color: 0xc4f4ff,
          });
        }
      }
      ctx.keepAlive(800);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) {
          ctx.layout.apply(visual.group, slot);
          visual.yBase = visual.group.position.y;
        }
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      // 触发远景鱼类剪影游动掠过
      fishGroup.position.set(-18, 1.8, -6);
      fishActive = true;
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2500);
    },

    onTextClear() {
      for (const visual of visuals.values()) disposeObject(visual.group);
      visuals.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (bubbles.update(dt, time)) moving = true;

      for (const [id, visual] of visuals.entries()) {
        if (visual.erasing) {
          visual.eraseK += dt * 4.0;
          const k = visual.eraseK;
          visual.group.scale.setScalar(Math.max(0, 1 - k));
          if (k >= 1) {
            disposeObject(visual.group);
            visuals.delete(id);
          }
          moving = true;
          continue;
        }

        // 下沉回落到平衡位置
        if (visual.group.position.y > visual.yBase) {
          visual.group.position.y = Math.max(visual.yBase, visual.group.position.y - dt * 3.5);
          moving = true;
        }

        // 水流微动
        visual.group.position.y = visual.yBase + Math.sin(time * 2 + visual.wobble) * 0.06;
        visual.group.rotation.z = Math.cos(time * 1.5 + visual.wobble) * 0.03;
        moving = true;
      }

      // 鱼群剪影游过
      if (fishActive) {
        fishGroup.position.x += dt * 14;
        fishGroup.position.y += Math.sin(time * 3) * 0.02;
        if (fishGroup.position.x > 20) fishActive = false;
        moving = true;
      }

      return moving;
    },

    disposeWorld() {
      for (const visual of visuals.values()) disposeObject(visual.group);
      visuals.clear();
      bubbles.dispose();
      letterMat.dispose();
      disposeObject(fishGroup);
      disposeObject(seaFloor);
      disposeObject(root);
    },
  };
}

export const underwaterBubbles: WorldModule = { create };
