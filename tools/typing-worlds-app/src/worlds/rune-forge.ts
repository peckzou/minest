/**
 * WORLD 21 · Rune Forge (符文熔铸)
 *
 * 核心体验：
 * 神秘石质神殿，石片升起，无形力量沿字母路径雕刻凹槽，
 * 蓝金符文光芒沿刻痕蔓延觉醒；Enter 时整词符文共同点亮激活一座短暂魔法阵。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

interface RuneVisual {
  id: number;
  char: string;
  group: THREE.Group;
  slabMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  charge: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 神殿暗蓝石质空间
  ctx.scene.background = new T.Color(0x0a1017);
  ctx.scene.fog = new T.Fog(0x0a1017, 14, 48);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0x284055, 1.0);
  root.add(amb);
  const dir = new T.DirectionalLight(0x6ad0ff, 1.6);
  dir.position.set(6, 12, 8);
  root.add(dir);

  const slabMat = new T.MeshStandardMaterial({
    color: 0x222a33,
    roughness: 0.8,
    metalness: 0.2,
  });

  function createRuneShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor: { value: new T.Color(0x52c9ff) },
        uGlow: { value: 1.0 },
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
        uniform vec3 uColor;
        uniform float uGlow;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          gl_FragColor = vec4(uColor * (1.8 * uGlow), 1.0);
        }
      `,
      side: T.DoubleSide,
    });
  }

  const runes = new Map<number, RuneVisual>();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const tubeGeo = ctx.glyphs.tube(glyph, 0.065, 8, true);

      // 悬浮符文石板基底
      const slabMesh = new T.Mesh(new T.BoxGeometry(1.2, 1.5, 0.16), slabMat);
      slabMesh.position.set(slot.advance / slot.size / 2, 0.5, -0.1);

      const mat = createRuneShader();
      const glowMesh = new T.Mesh(tubeGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(slabMesh);
      group.add(glowMesh);
      root.add(group);

      const visual: RuneVisual = {
        id: ev.id,
        char: ev.char,
        group,
        slabMesh,
        glowMesh,
        mat,
        charge: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.charge;
      runes.set(ev.id, visual);

      if (!ev.restoring) {
        ctx.audio.play('zap', { pitch: 1.4, gain: 0.5 });
      }
      ctx.keepAlive(1400);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const r = runes.get(ev.id);
      if (!r) return;
      r.erasing = true;
      ctx.audio.play('pop', { pitch: 0.9, gain: 0.5 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, r] of runes.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(r.group, slot);
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('chime', { pitch: 1.2, gain: 0.9 });
      for (const r of runes.values()) {
        r.mat.uniforms.uGlow.value = 2.8;
      }
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const r of runes.values()) disposeObject(r.group);
      runes.clear();
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;

      for (const [id, r] of runes.entries()) {
        if (r.erasing) {
          r.eraseK += dt * 4.0;
          const k = r.eraseK;
          r.group.scale.set(1 - k, 1 - k, 1 - k);
          if (k >= 1) {
            disposeObject(r.group);
            runes.delete(id);
          }
          moving = true;
          continue;
        }

        if (r.charge < 1) {
          r.charge = Math.min(1, r.charge + dt * 4.0);
          r.mat.uniforms.uProgress.value = r.charge;
          moving = true;
        }

        if (r.mat.uniforms.uGlow.value > 1.0) {
          r.mat.uniforms.uGlow.value = Math.max(1.0, r.mat.uniforms.uGlow.value - dt * 2.0);
          moving = true;
        }

        // 石板轻微悬浮呼吸
        r.group.position.y = Math.sin(time * 2 + r.id) * 0.03;
        moving = true;
      }

      return moving;
    },

    disposeWorld() {
      for (const r of runes.values()) disposeObject(r.group);
      runes.clear();
      slabMat.dispose();
      disposeObject(root);
    },
  };
}

export const runeForge: WorldModule = { create };
