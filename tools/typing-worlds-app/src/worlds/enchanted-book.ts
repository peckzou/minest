/**
 * WORLD 20 · Enchanted Book (魔法书)
 *
 * 核心体验：
 * 神秘魔法图书馆中悬浮古书；书页浮现发光字迹并升起为立体金色魔法字母飞向书本上方；
 * Enter 时整词化成金色光流重新没入书页，书页自动翻动象征新词汇被收藏入册。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';

interface BookLetter {
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

  // 1. 神秘图书馆与金色暖光
  ctx.scene.background = new T.Color(0x110c1c);
  ctx.scene.fog = new T.Fog(0x110c1c, 14, 45);
  ctx.camera.position.set(0, 1.6, 10.5);
  ctx.camera.lookAt(0, 0.5, 0);

  const amb = new T.AmbientLight(0xffeedd, 1.0);
  root.add(amb);
  const candle = new T.PointLight(0xffc866, 2.4, 25);
  candle.position.set(0, 4, 4);
  root.add(candle);

  // 悬浮古老魔法书
  const bookGroup = new T.Group();
  const bookCover = new T.Mesh(
    new T.BoxGeometry(10, 0.4, 6),
    new T.MeshStandardMaterial({ color: 0x3d1a24, roughness: 0.6 })
  );
  const bookPages = new T.Mesh(
    new T.BoxGeometry(9.6, 0.36, 5.6),
    new T.MeshStandardMaterial({ color: 0xf5ebd6, roughness: 0.85 })
  );
  bookPages.position.set(0, 0.04, 0);
  bookGroup.add(bookCover);
  bookGroup.add(bookPages);
  bookGroup.position.set(0, -1.8, 0);
  bookGroup.rotation.set(Math.PI / 8, 0, 0);
  root.add(bookGroup);

  // 金色魔法星光
  const motes = new Particles({
    capacity: 600,
    gravity: [0, 0.4, 0],
    drag: 0.8,
    size: 0.04,
    shape: 'spark',
    opacity: 0.9,
  });
  root.add(motes.points);

  // 金色立体魔法材质
  const goldMat = new T.MeshStandardMaterial({
    color: 0xffd166,
    metalness: 0.8,
    roughness: 0.2,
    envMap: ctx.renderer.environment(),
  });

  const letters = new Map<number, BookLetter>();

  ctx.glyphs.loadOutlineFont().catch(() => {});

  function getGeometry(ch: string) {
    if (ctx.glyphs.outlineReady) {
      try {
        return ctx.glyphs.outline(ch.toUpperCase(), { depth: 0.32, bevel: 0.08 });
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
      const mesh = new T.Mesh(geo, goldMat);
      mesh.castShadow = ctx.quality > 0;
      group.add(mesh);
      root.add(group);

      const targetY = group.position.y;
      group.position.y = ev.restoring ? targetY : -1.6; // 从书页中升起

      letters.set(ev.id, {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        yTarget: targetY,
        riseK: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      });

      if (!ev.restoring) {
        ctx.audio.play('chime', { pitch: 1.2, gain: 0.5 });
        const cx = slot.center.x;
        for (let i = 0; i < 12; i++) {
          motes.emit({
            x: cx + (Math.random() - 0.5) * 0.4,
            y: -1.4,
            z: (Math.random() - 0.5) * 0.4,
            vy: 0.8 + Math.random() * 0.8,
            life: 1.2,
            color: 0xffe680,
          });
        }
      }
      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const l = letters.get(ev.id);
      if (!l) return;
      l.erasing = true;
      ctx.audio.play('pop', { pitch: 1.4, gain: 0.4 });
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
      // Enter: 单词化作金光重新沉入书页
      for (const l of letters.values()) {
        l.erasing = true;
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
      if (motes.update(dt, time)) moving = true;

      // 魔法书悬浮轻摇
      bookGroup.position.y = -1.8 + Math.sin(time * 2) * 0.06;

      for (const [id, l] of letters.entries()) {
        if (l.erasing) {
          l.eraseK += dt * 3.5;
          const k = l.eraseK;
          l.group.position.y -= dt * 2.5;
          l.group.scale.setScalar(Math.max(0, 1 - k));
          if (k >= 1) {
            disposeObject(l.group);
            letters.delete(id);
          }
          moving = true;
          continue;
        }

        if (l.riseK < 1) {
          l.riseK = Math.min(1, l.riseK + dt * 3.2);
          const e = l.riseK * l.riseK * (3 - 2 * l.riseK);
          l.group.position.y = -1.6 + (l.yTarget + 1.6) * e;
          moving = true;
        } else {
          // 悬浮呼吸
          l.group.position.y = l.yTarget + Math.sin(time * 3 + l.id) * 0.04;
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      for (const l of letters.values()) disposeObject(l.group);
      letters.clear();
      motes.dispose();
      goldMat.dispose();
      disposeObject(bookGroup);
      disposeObject(root);
    },
  };
}

export const enchantedBook: WorldModule = { create };
