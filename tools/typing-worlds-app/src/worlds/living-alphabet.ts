/**
 * WORLD 02 · Living Alphabet (字母精灵)
 *
 * 核心体验：
 * 原创 3D 字母角色世界，每个字母具有动作性格（滚入、跳跃、踏步、扭身）；
 * 新字母登场时已有字母转身相迎，靠近后磁吸；完成单词时全员同步跳跃庆祝。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

interface CharacterLetter {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  personality: 'roll' | 'bounce' | 'stamp' | 'twist';
  targetX: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotY: number;
  rotZ: number;
  landed: boolean;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 温暖阳光丘陵
  ctx.scene.background = new T.Color(0xbfe7ff);
  ctx.scene.fog = new T.Fog(0xbfe7ff, 18, 55);
  ctx.camera.position.set(0, 1.8, 10.5);
  ctx.camera.lookAt(0, 0.6, 0);

  const amb = new T.AmbientLight(0xfff5ea, 1.1);
  root.add(amb);
  const sun = new T.DirectionalLight(0xfffaed, 1.5);
  sun.position.set(6, 12, 8);
  sun.castShadow = ctx.quality > 0;
  root.add(sun);

  // 绿色圆润草坪丘陵
  const grass = new T.Mesh(
    new T.CylinderGeometry(18, 18, 1, 48),
    new T.MeshStandardMaterial({ color: 0x76c449, roughness: 0.85 })
  );
  grass.position.set(0, -0.5, 0);
  grass.receiveShadow = ctx.quality > 0;
  root.add(grass);

  // 角色活泼材质
  const charMat = new T.MeshStandardMaterial({
    color: 0xff6b4a,
    roughness: 0.35,
    metalness: 0.05,
    envMap: ctx.renderer.environment(),
  });

  const letters = new Map<number, CharacterLetter>();

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

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const c = ev.char.toLowerCase();
      let personality: CharacterLetter['personality'] = 'bounce';
      if (c === 'o' || c === 'c' || c === 'q' || c === 'e') personality = 'roll';
      else if (c === 'm' || c === 'w' || c === 'b' || c === 'd') personality = 'stamp';
      else if (c === 's' || c === 'z' || c === 'x') personality = 'twist';

      const group = new T.Group();
      const geo = getGeometry(ev.char);
      const mesh = new T.Mesh(geo, charMat);
      mesh.castShadow = ctx.quality > 0;
      group.add(mesh);
      root.add(group);

      const targetX = slot.center.x;
      const startX = ev.restoring ? targetX : targetX + (personality === 'roll' ? -4 : 0);
      const startY = ev.restoring ? 0.4 : personality === 'stamp' ? 6 : 4;

      const letter: CharacterLetter = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        personality,
        targetX,
        x: startX,
        y: startY,
        vx: 0,
        vy: ev.restoring ? 0 : -8,
        rotY: 0,
        rotZ: 0,
        landed: ev.restoring,
        erasing: false,
        eraseK: 0,
      };

      letters.set(ev.id, letter);

      // 已有字母转身朝向新字母欢迎！
      for (const [id, other] of letters.entries()) {
        if (id !== ev.id && other.landed) {
          other.rotY = Math.sign(targetX - other.x) * 0.4;
        }
      }

      if (!ev.restoring) {
        ctx.audio.play('pop', { pitch: 1.3 + Math.random() * 0.2, gain: 0.6 });
      }
      ctx.keepAlive(1600);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const l = letters.get(ev.id);
      if (!l) return;
      l.erasing = true;
      ctx.audio.play('pop', { pitch: 0.9, gain: 0.5 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, l] of letters.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) l.targetX = slot.center.x;
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      // Enter: 所有角色同步跳跃欢呼
      for (const l of letters.values()) {
        l.vy = 6.0 + Math.random() * 1.5;
        l.landed = false;
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
          l.eraseK += step * 4.0;
          const k = l.eraseK;
          l.group.scale.set(1 - k, 1 - k, 1 - k);
          if (k >= 1) {
            disposeObject(l.group);
            letters.delete(id);
          }
          moving = true;
          continue;
        }

        // 重力与下落
        if (!l.landed) {
          l.vy -= 26 * step;
          l.y += l.vy * step;
          if (l.y <= 0.4) {
            l.y = 0.4;
            l.landed = true;
            l.vy = 0;
            ctx.audio.play('thud', { pitch: 1.5, gain: 0.4 });
          }
          moving = true;
        }

        // 水平奔向槽位
        const dx = l.targetX - l.x;
        l.vx = (l.vx + dx * 16 * step) * Math.exp(-8 * step);
        l.x += l.vx * step;
        if (Math.abs(dx) > 0.05) moving = true;

        // 转身平滑恢复
        l.rotY *= Math.exp(-6 * step);

        // 字母个性轻微蠕动
        let idleBounce = 0;
        if (l.landed) {
          if (l.personality === 'bounce') idleBounce = Math.abs(Math.sin(time * 6 + l.id)) * 0.08;
          else if (l.personality === 'twist') l.rotZ = Math.sin(time * 5 + l.id) * 0.12;
        }

        l.group.position.set(l.x, l.y + idleBounce, 0);
        l.group.rotation.set(0, l.rotY, l.rotZ);
        moving = true;
      }

      return moving;
    },

    disposeWorld() {
      for (const l of letters.values()) disposeObject(l.group);
      letters.clear();
      charMat.dispose();
      disposeObject(grass);
      disposeObject(root);
    },
  };
}

export const livingAlphabet: WorldModule = { create };
