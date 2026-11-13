/**
 * WORLD 17 · Noble Gas Neon (稀有气体霓虹)
 *
 * 核心体验：
 * 每个字母由真正具有立体厚度的玻璃放电管与金属电极构成；
 * 按键后电极通电产生微弱电火花，放电沿灯管迅速扩散蔓延，气体稳定发光；
 * Enter 时电流从第一个字母依次传向最后一个字母，全词同时达到最高辉光，再回归稳定状态。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';

const GASES = [
  { id: 'neon', label: '氖 (Neon)', color: 0xff4d26, coreColor: 0xffffff, bloom: 0xff734d },
  { id: 'argon', label: '氩 (Argon)', color: 0x7559ff, coreColor: 0xffffff, bloom: 0xa894ff },
  { id: 'helium', label: '氦 (Helium)', color: 0xff7b91, coreColor: 0xffffff, bloom: 0xffa8b8 },
  { id: 'xenon', label: '氙 (Xenon)', color: 0xaec8ff, coreColor: 0xffffff, bloom: 0xd6e5ff },
];

interface NeonLetterVisual {
  id: number;
  char: string;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  glassMesh: THREE.Mesh;
  coreMat: THREE.ShaderMaterial;
  glassMat: THREE.MeshStandardMaterial;
  charge: number; // 0..1 current spread
  intensity: number; // glow multiplier
  flickerTime: number;
  surge: number;
  erasing: boolean;
  eraseProgress: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. Minimal dark stage (classic Neon look): near-black, dim moonlight, a dark matte floor
  ctx.scene.background = new T.Color(0x020203);
  ctx.scene.fog = new T.FogExp2(0x020203, 0.045);
  ctx.camera.position.set(0, 0.5, 10.5);
  ctx.camera.lookAt(0, 0.45, 0);

  root.add(new T.HemisphereLight(0x8fa2c8, 0x0a0806, 0.16));
  const moon = new T.DirectionalLight(0x9db4ff, 0.32);
  moon.position.set(-5, 6, 4);
  root.add(moon);

  const floor = new T.Mesh(
    new T.PlaneGeometry(80, 40),
    new T.MeshStandardMaterial({ color: 0x08080a, roughness: 0.6, metalness: 0.25 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.3;
  root.add(floor);

  // electrode clips (shared across letters)
  const beamMat = new T.MeshStandardMaterial({ color: 0x22222a, roughness: 0.5, metalness: 0.8 });
  beamMat.userData.shared = true;

  // 2. 放电火花粒子
  const sparks = new Particles({
    capacity: 400,
    gravity: [0, -4, 0],
    drag: 2.0,
    size: 0.035,
    shape: 'spark',
    opacity: 0.95,
  });
  root.add(sparks.points);

  let currentGas = GASES.find((g) => g.id === ctx.theme) ?? GASES[0];

  // 3. 霓虹管材质构造函数
  function createCoreShader(gas: typeof currentGas) {
    return new T.ShaderMaterial({
      uniforms: {
        uCharge: { value: 0.0 },
        uIntensity: { value: 1.0 },
        uColor: { value: new T.Color(gas.color) },
        uCoreColor: { value: new T.Color(gas.coreColor) },
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
        uniform float uCharge;
        uniform float uIntensity;
        uniform vec3 uColor;
        uniform vec3 uCoreColor;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uCharge) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(uCoreColor, uColor, 0.45 + 0.55 * pow(fresnel, 0.8));
          gl_FragColor = vec4(c * (1.05 * uIntensity), 1.0);
        }
      `,
      side: T.DoubleSide,
    });
  }

  function createGlassMaterial() {
    // thin clear sleeve: a faint specular shell over the glowing core (no transmission pass)
    return new T.MeshStandardMaterial({
      color: 0x9aa8c0,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
  }

  const visuals = new Map<number, NeonLetterVisual>();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');

      // 双层管：发光气体核心管 (r=0.06) + 外部透明玻璃护套 (r=0.1)
      const coreGeo = ctx.glyphs.tube(glyph, 0.065, 8, true);
      const glassGeo = ctx.glyphs.tube(glyph, 0.105, 10, true);

      const coreMat = createCoreShader(currentGas);
      const glassMat = createGlassMaterial();

      const coreMesh = new T.Mesh(coreGeo, coreMat);
      const glassMesh = new T.Mesh(glassGeo, glassMat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(coreMesh);
      group.add(glassMesh);

      // 金属电极接头（底座端点）
      if (glyph.strokes.length > 0) {
        const p0 = glyph.strokes[0].pts;
        const clipGeo = new T.CylinderGeometry(0.09, 0.09, 0.18, 12);
        clipGeo.rotateX(Math.PI / 2);
        const clipMesh = new T.Mesh(clipGeo, beamMat);
        clipMesh.position.set(p0[0], p0[1], -0.15);
        group.add(clipMesh);
      }

      root.add(group);

      const visual: NeonLetterVisual = {
        id: ev.id,
        char: ev.char,
        group,
        coreMesh,
        glassMesh,
        coreMat,
        glassMat,
        charge: ev.restoring ? 1 : 0,
        intensity: ev.restoring ? 1 : 0,
        flickerTime: ev.restoring ? 0 : 0.25, // 通电闪烁
        surge: 0,
        erasing: false,
        eraseProgress: 0,
      };

      visuals.set(ev.id, visual);

      if (!ev.restoring) {
        ctx.audio.play('zap', { pitch: 1.0 + Math.random() * 0.2, gain: 0.5 });
        ctx.audio.play('hum', { pitch: 1.1, gain: 0.3 });

        // 喷射通电火花
        const worldPos = new T.Vector3();
        group.getWorldPosition(worldPos);
        for (let i = 0; i < 16; i++) {
          sparks.emit({
            x: worldPos.x,
            y: worldPos.y + 0.5,
            z: worldPos.z + 0.1,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            vz: 0.5 + Math.random() * 1.5,
            life: 0.35 + Math.random() * 0.25,
            color: currentGas.color,
          });
        }
      }

      ctx.keepAlive(1200);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const visual = visuals.get(ev.id);
      if (!visual) return;
      visual.erasing = true;
      ctx.audio.play('zap', { pitch: 0.7, gain: 0.4 });
      ctx.keepAlive(500);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      // Enter: 电流依次级联脉冲
      ctx.audio.play('zap', { pitch: 1.3, gain: 0.7 });
      refs.forEach((r, idx) => {
        const visual = visuals.get(r.id);
        if (visual) {
          ctx.setTimeout(() => {
            visual.surge = 1.0;
            ctx.audio.play('tick', { pitch: 1.5 + idx * 0.1, gain: 0.4 });
          }, idx * 60);
        }
      });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
    },

    setTheme(themeId: string) {
      currentGas = GASES.find((g) => g.id === themeId) ?? GASES[0];
      for (const visual of visuals.values()) {
        visual.coreMat.uniforms.uColor.value.set(currentGas.color);
        visual.coreMat.uniforms.uCoreColor.value.set(currentGas.coreColor);
      }
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (sparks.update(dt, time)) moving = true;

      for (const [id, visual] of visuals.entries()) {
        if (visual.erasing) {
          visual.eraseProgress += dt * 5.0;
          const k = visual.eraseProgress;
          visual.intensity = Math.max(0, 1 - k);
          visual.coreMat.uniforms.uIntensity.value = visual.intensity;
          if (k >= 1) {
            disposeObject(visual.group);
            visuals.delete(id);
          }
          moving = true;
          continue;
        }

        // 1. 放电扩散
        if (visual.charge < 1.0) {
          visual.charge = Math.min(1.0, visual.charge + dt * 4.5);
          visual.coreMat.uniforms.uCharge.value = visual.charge;
          moving = true;
        }

        // 2. 初始通电微弱闪烁
        if (visual.flickerTime > 0) {
          visual.flickerTime -= dt;
          const noise = Math.random() > 0.35 ? 1.4 : 0.2;
          visual.intensity = noise;
          moving = true;
        } else {
          // 3. 电流涌动浪涌衰减
          if (visual.surge > 0) {
            visual.surge = Math.max(0, visual.surge - dt * 2.5);
            visual.intensity = 1.0 + visual.surge * 1.5;
            moving = true;
          } else {
            // 微妙的放电轻微脉动
            visual.intensity = 1.0 + Math.sin(time * 6 + visual.id) * 0.04;
          }
        }

        visual.coreMat.uniforms.uIntensity.value = visual.intensity;
      }

      return moving;
    },

    disposeWorld() {
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
      sparks.dispose();
      beamMat.dispose();
      disposeObject(root);
    },
  };
}

export const nobleGasNeon: WorldModule = { create };
