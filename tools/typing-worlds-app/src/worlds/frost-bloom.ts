/**
 * WORLD 16 · Frost Bloom (冰晶绽放)
 *
 * 核心体验：
 * 冰蓝色表面上，冰核在笔画起点形成，冰晶沿笔画分叉蔓延生长；
 * 凝结为具有透明冰层与折射厚度的冰雪立体字母；Enter 时整行冰晶折射微光；
 * Delete 时冰晶融化消退。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';

interface FrostLetter {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  growth: number;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 冰蓝寒霜环境
  ctx.scene.background = new T.Color(0x0e1b29);
  ctx.scene.fog = new T.Fog(0x0e1b29, 14, 48);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0x73b2d9, 0.9);
  root.add(amb);
  const sun = new T.DirectionalLight(0xdcf4ff, 1.6);
  sun.position.set(6, 12, 8);
  root.add(sun);

  // 冰雪晶屑粒子
  const flakes = new Particles({
    capacity: 600,
    gravity: [0, -0.8, 0],
    drag: 0.8,
    size: 0.04,
    shape: 'flake',
    opacity: 0.85,
  });
  root.add(flakes.points);

  function createFrostShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor: { value: new T.Color(0xb2e8ff) },
        uIceColor: { value: new T.Color(0xffffff) },
        uOpacity: { value: 0.95 },
      },
      vertexShader: `
        attribute float aU;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          vU = aU;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uColor;
        uniform vec3 uIceColor;
        uniform float uOpacity;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(uColor, uIceColor, pow(fresnel, 1.2));
          gl_FragColor = vec4(c, uOpacity);
        }
      `,
      transparent: true,
      side: T.DoubleSide,
    });
  }

  const letters = new Map<number, FrostLetter>();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const tubeGeo = ctx.glyphs.tube(glyph, 0.075, 8, true);

      const mat = createFrostShader();
      const mesh = new T.Mesh(tubeGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: FrostLetter = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        growth: ev.restoring ? 1 : 0,
        erasing: false,
        eraseK: 0,
      };
      mat.uniforms.uProgress.value = visual.growth;
      letters.set(ev.id, visual);

      if (!ev.restoring) {
        ctx.audio.play('crack', { pitch: 1.3 + Math.random() * 0.2, gain: 0.45 });
        // 冰核释放细微晶屑
        const cx = slot.center.x;
        const cy = slot.center.y;
        for (let i = 0; i < 14; i++) {
          flakes.emit({
            x: cx + (Math.random() - 0.5) * 0.4,
            y: cy + (Math.random() - 0.5) * 0.4,
            z: 0.1,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            vz: 0.2 + Math.random() * 0.4,
            life: 0.8,
            color: 0xdff6ff,
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
        if (slot) ctx.layout.apply(l.group, slot);
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('sparkle', { pitch: 1.1, gain: 0.7 });
      // Enter: 冰晶折射闪光
      for (const l of letters.values()) {
        l.mat.uniforms.uIceColor.value.set(0xffffff);
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
      if (flakes.update(dt, time)) moving = true;

      for (const [id, l] of letters.entries()) {
        if (l.erasing) {
          l.eraseK += dt * 4.0;
          const k = l.eraseK;
          l.mat.uniforms.uOpacity.value = Math.max(0, 0.95 * (1 - k));
          if (k >= 1) {
            disposeObject(l.group);
            letters.delete(id);
          }
          moving = true;
          continue;
        }

        if (l.growth < 1) {
          l.growth = Math.min(1, l.growth + dt * 3.8);
          l.mat.uniforms.uProgress.value = l.growth;
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      for (const l of letters.values()) disposeObject(l.group);
      letters.clear();
      flakes.dispose();
      disposeObject(root);
    },
  };
}

export const frostBloom: WorldModule = { create };
