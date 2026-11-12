/**
 * WORLD 01 · Magnetic Jelly (磁力果冻)
 *
 * 核心体验：
 * 3D 果冻字母从空中沿抛物线跳跃进入奶白色世界，落地发生局部压缩回弹，
 * 受到相邻字母磁力吸引并发生碰撞与冲击波链式传递（传播时差 + 振幅衰减 + 弹性恢复），
 * 地面留下局部凹陷与扩散波纹。运动结束后完全静止。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

const THEMES = [
  { id: 'jelly', label: 'Jelly', color: 0xff6e9a, rough: 0.16, metal: 0.0, trans: 0.35, clearcoat: 0.8 },
  { id: 'crystal', label: 'Crystal', color: 0x8ec8ff, rough: 0.05, metal: 0.0, trans: 0.55, clearcoat: 1.0 },
  { id: 'glass', label: 'Glass', color: 0xe0f2f7, rough: 0.02, metal: 0.0, trans: 0.8, clearcoat: 1.0 },
  { id: 'rubber', label: 'Rubber', color: 0x4ecdc4, rough: 0.82, metal: 0.0, trans: 0.0, clearcoat: 0.1 },
  { id: 'chrome', label: 'Chrome', color: 0xecf0f4, rough: 0.12, metal: 0.95, trans: 0.0, clearcoat: 0.5 },
  { id: 'clay', label: 'Clay', color: 0xde8c68, rough: 0.78, metal: 0.0, trans: 0.0, clearcoat: 0.0 },
];

interface JellyLetter {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  squash: number; // Y scale factor - 1
  vSquash: number;
  rot: number;
  vRot: number;
  landed: boolean;
  flash: number;
  shockDelay: number;
  shockAmp: number;
  shockHops: number;
  alive: boolean;
  state: 'falling' | 'settling' | 'removing' | 'celebrating';
  removeProgress: number;
}

interface Ripple {
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  dent: THREE.Mesh;
  dentMat: THREE.MeshBasicMaterial;
  t: number;
  dur: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 奶白色环境与光照
  ctx.scene.background = new T.Color(0xf4ebe1);
  ctx.scene.fog = new T.Fog(0xf4ebe1, 24, 75);
  ctx.camera.position.set(0, 3.2, 11.5);
  ctx.camera.lookAt(0, 1.1, 0);

  const hemi = new T.HemisphereLight(0xfff6ec, 0xd4c2b0, 0.85);
  root.add(hemi);

  const keyLight = new T.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(7, 14, 9);
  keyLight.castShadow = ctx.quality > 0;
  if (keyLight.shadow) {
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.001;
  }
  root.add(keyLight);

  const fillLight = new T.DirectionalLight(0xdceaff, 0.45);
  fillLight.position.set(-8, 6, -5);
  root.add(fillLight);

  // 2. 珍珠质感弹性地面
  const groundMat = new T.MeshStandardMaterial({
    color: 0xeddccb,
    roughness: 0.45,
    metalness: 0.05,
    envMap: ctx.renderer.environment(),
    envMapIntensity: 0.5,
  });
  const ground = new T.Mesh(new T.CircleGeometry(42, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = ctx.quality > 0;
  root.add(ground);

  // 3. 奶油山丘（远景点缀）
  const hillsGroup = new T.Group();
  for (let i = 0; i < 7; i++) {
    const r = 5.5 + (i % 3) * 3.2;
    const g = new T.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const m = new T.MeshStandardMaterial({ color: 0xf3e5d7, roughness: 0.92, metalness: 0 });
    const hill = new T.Mesh(g, m);
    const a = -Math.PI / 2 + (i - 3) * 0.38 + 0.15;
    const dist = 28 + (i % 3) * 5;
    hill.position.set(Math.sin(a) * dist, -0.6, -Math.cos(a) * dist - 4);
    hill.scale.y = 0.32 + (i % 2) * 0.14;
    hill.receiveShadow = ctx.quality > 0;
    hillsGroup.add(hill);
  }
  root.add(hillsGroup);

  // 4. 材质管理
  let currentThemeId = ctx.theme || 'jelly';
  let sharedMaterial = buildMaterial(currentThemeId);

  function buildMaterial(themeId: string) {
    const th = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
    if (th.trans > 0) {
      return new T.MeshPhysicalMaterial({
        color: th.color,
        roughness: th.rough,
        metalness: th.metal,
        transmission: Math.min(0.38, th.trans * 0.5),
        thickness: 0.8,
        attenuationColor: th.color,
        attenuationDistance: 0.6,
        ior: 1.45,
        clearcoat: th.clearcoat,
        clearcoatRoughness: 0.15,
        envMap: ctx.renderer.environment(),
        envMapIntensity: 0.9,
      });
    }
    return new T.MeshStandardMaterial({
      color: th.color,
      roughness: th.rough,
      metalness: th.metal,
      envMap: ctx.renderer.environment(),
      envMapIntensity: 0.7,
    });
  }

  // 5. 字母管理
  const letters = new Map<number, JellyLetter>();
  const ripples: Ripple[] = [];
  const rippleGeo = new T.RingGeometry(0.3, 0.44, 40);
  const dentGeo = new T.CircleGeometry(0.85, 32);

  // 接触阴影贴图
  const shadowGeo = new T.PlaneGeometry(1.4, 1.4);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new T.MeshBasicMaterial({
    color: 0x7a6350,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });

  // 预加载立体几何体
  ctx.glyphs.loadOutlineFont().catch(() => {});

  function getGeometry(ch: string): THREE.BufferGeometry {
    if (ctx.glyphs.outlineReady) {
      try {
        return ctx.glyphs.outline(ch.toUpperCase(), { depth: 0.36, bevel: 0.08, curve: 8 });
      } catch {
        /* fallback */
      }
    }
    return new T.BoxGeometry(0.9, 1.2, 0.38);
  }

  function spawnRipple(x: number, z: number) {
    if (ctx.quality === 0 && ripples.length > 3) return;
    const dentMat = new T.MeshBasicMaterial({
      color: 0x9e836b,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const dent = new T.Mesh(dentGeo, dentMat);
    dent.rotation.x = -Math.PI / 2;
    dent.position.set(x, 0.005, z);
    root.add(dent);

    const ringMat = new T.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const ring = new T.Mesh(rippleGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.012, z);
    root.add(ring);

    ripples.push({ ring, ringMat, dent, dentMat, t: 0, dur: 0.95 });
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      const targetX = slot ? slot.center.x : (ev.index - 2) * 1.2;
      const targetZ = slot ? slot.center.z : 0;

      const group = new T.Group();
      const geo = getGeometry(ev.char);
      const mesh = new T.Mesh(geo, sharedMaterial);
      mesh.castShadow = ctx.quality > 0;
      mesh.receiveShadow = ctx.quality > 0;
      mesh.position.set(-0.45, 0, 0); // baseline-left -> center
      group.add(mesh);

      // 局部接触阴影
      const shadow = new T.Mesh(shadowGeo, shadowMat);
      shadow.position.set(0, 0.003, 0);
      group.add(shadow);

      root.add(group);

      const tempo = ctx.tempo.tempo;
      const startHeight = ev.restoring ? 0.6 : tempo === 'fast' ? 4.5 : 8.0;
      const startVy = ev.restoring ? 0 : tempo === 'fast' ? -12 : -3;
      const startVx = ev.restoring ? 0 : (Math.random() - 0.5) * 1.5;

      const startX = ev.restoring ? targetX : targetX + (Math.random() - 0.5) * 2 - 1.2;
      const startZ = ev.restoring ? targetZ : targetZ + (Math.random() - 0.5) * 0.8;

      group.position.set(startX, startHeight, startZ);

      const letter: JellyLetter = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        shadow,
        x: startX,
        y: startHeight,
        z: startZ,
        vx: startVx,
        vy: startVy,
        vz: 0,
        squash: 0,
        vSquash: 0,
        rot: 0,
        vRot: ev.restoring ? 0 : (Math.random() - 0.5) * 0.4,
        landed: ev.restoring,
        flash: 1,
        shockDelay: 0,
        shockAmp: 0,
        shockHops: 0,
        alive: true,
        state: ev.restoring ? 'settling' : 'falling',
        removeProgress: 0,
      };

      letters.set(ev.id, letter);

      if (!ev.restoring) {
        ctx.audio.play('pop', { pitch: 1.1 + Math.random() * 0.2, gain: 0.6 });
      }
      ctx.keepAlive(1200);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const letter = letters.get(ev.id);
      if (!letter) return;
      letter.alive = false;
      letter.state = 'removing';
      ctx.audio.play('squish', { pitch: 1.4, gain: 0.6 });
      ctx.keepAlive(600);
    },

    onLayout() {
      // 布局槽位更新由每帧弹簧自动拉近
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      for (const letter of letters.values()) {
        letter.state = 'celebrating';
        letter.vy = 4.8 + Math.random() * 1.2;
        letter.landed = false;
        letter.vSquash = 0.28;
        letter.flash = 1;
      }
      saved.then((res) => {
        if (!res.ok) {
          ctx.audio.play('error', { gain: 0.6 });
        }
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const letter of letters.values()) {
        disposeObject(letter.group);
      }
      letters.clear();
    },

    setTheme(themeId: string) {
      currentThemeId = themeId;
      sharedMaterial.dispose();
      sharedMaterial = buildMaterial(themeId);
      for (const letter of letters.values()) {
        letter.mesh.material = sharedMaterial;
      }
    },

    updateAnimation(dt: number): boolean {
      const step = Math.min(dt, 1 / 30);
      let moving = false;

      // 1. 波纹与凹陷更新
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.t += step;
        const k = rip.t / rip.dur;
        if (k >= 1) {
          root.remove(rip.ring);
          root.remove(rip.dent);
          rip.ringMat.dispose();
          rip.dentMat.dispose();
          ripples.splice(i, 1);
        } else {
          moving = true;
          const s = 1 + k * 2.8;
          rip.ring.scale.set(s, s, 1);
          rip.ringMat.opacity = (1 - k) * 0.65;
          const ds = 1 + k * 1.5;
          rip.dent.scale.set(ds, ds, 1);
          rip.dentMat.opacity = (1 - k) * 0.35;
        }
      }

      // 2. 字母物理模拟
      const sorted = [...letters.values()].sort((a, b) => a.id - b.id);
      const GROUND_BASE = 0.6; // 字母中心到地面的半高

      for (let i = 0; i < sorted.length; i++) {
        const letter = sorted[i];

        if (letter.state === 'removing') {
          letter.removeProgress += step * 5.0;
          const k = letter.removeProgress;
          if (k >= 1) {
            disposeObject(letter.group);
            letters.delete(letter.id);
            continue;
          }
          moving = true;
          const scale = Math.max(0, 1 - k);
          letter.group.scale.set(scale * (1 + k * 0.5), scale * (1 - k * 0.3), scale);
          letter.group.position.y += step * 2.5;
          continue;
        }

        // 下落与重力
        if (!letter.landed) {
          moving = true;
          letter.vy -= 28 * step;
          letter.y += letter.vy * step;
          letter.x += letter.vx * step;
          letter.vx *= 0.98;

          if (letter.y <= GROUND_BASE) {
            letter.y = GROUND_BASE;
            letter.landed = true;
            letter.vy = 0;
            letter.squash = -0.42;
            letter.vSquash = 0.35;
            letter.flash = 1;
            ctx.audio.play('squish', { pitch: 0.9 + Math.random() * 0.2, gain: 0.5 });
            spawnRipple(letter.x, letter.z);

            // 落地冲击传给左邻字母：Magnetic Chain
            const left = sorted[i - 1];
            if (left && left.landed) {
              left.shockDelay = 0.05;
              left.shockAmp = 3.2;
              left.shockHops = 0;
            }
          }
        }

        // 冲击波传递
        if (letter.shockDelay > 0) {
          moving = true;
          letter.shockDelay -= step;
          if (letter.shockDelay <= 0) {
            const amp = letter.shockAmp;
            letter.vx -= amp * 0.8;
            letter.vSquash += amp * 0.08;
            letter.flash = Math.min(1, letter.flash + amp * 0.25);
            letter.shockAmp = 0;

            const left = sorted[i - 1];
            if (left && left.landed) {
              left.shockDelay = 0.055;
              left.shockAmp = amp * 0.72; // 每跳衰减 28%
              left.shockHops = letter.shockHops + 1;
            }
          }
        }

        // 槽位目标与磁力弹簧
        const slot = ctx.slotOf(letter.id);
        const targetX = slot ? slot.center.x : 0;
        const targetZ = slot ? slot.center.z : 0;

        if (letter.landed) {
          const dx = targetX - letter.x;
          const dz = targetZ - letter.z;
          letter.vx = (letter.vx + dx * 14 * step) * Math.exp(-9 * step);
          letter.vz = (letter.vz + dz * 14 * step) * Math.exp(-9 * step);
          letter.x += letter.vx * step;
          letter.z += letter.vz * step;
        }

        // 果冻果肉弹性振动 (Squash & Stretch)
        letter.vSquash = (letter.vSquash - letter.squash * 60 * step) * Math.exp(-8 * step);
        letter.squash += letter.vSquash * step;

        // 倾斜恢复
        letter.vRot = (letter.vRot - letter.rot * 30 * step) * Math.exp(-9 * step);
        letter.rot += letter.vRot * step;

        // 碰撞排斥与磁力链条
        if (i < sorted.length - 1) {
          const next = sorted[i + 1];
          if (letter.landed && next.landed) {
            const diffX = next.x - letter.x;
            const minDist = 1.15;
            if (Math.abs(diffX) < minDist) {
              const overlap = (minDist - Math.abs(diffX)) * Math.sign(diffX || 1);
              letter.vx -= overlap * 8 * step;
              next.vx += overlap * 8 * step;
              letter.vSquash -= Math.abs(overlap) * 0.1;
              next.vSquash -= Math.abs(overlap) * 0.1;
              moving = true;
            }
          }
        }

        // 运动判定
        if (
          Math.abs(letter.vx) > 0.005 ||
          Math.abs(letter.vy) > 0.005 ||
          Math.abs(letter.squash) > 0.005 ||
          Math.abs(letter.rot) > 0.005
        ) {
          moving = true;
        }

        // 更新 3D 变换
        const sy = 1 + letter.squash;
        const sx = 1 - letter.squash * 0.5;
        const sz = 1 - letter.squash * 0.5;
        letter.group.position.set(letter.x, letter.y, letter.z);
        letter.mesh.scale.set(sx, sy, sz);
        letter.mesh.rotation.z = letter.rot;

        // 接触阴影动态跟随
        const heightFromFloor = Math.max(0, letter.y - GROUND_BASE);
        const shadowAlpha = Math.max(0, 0.4 - heightFromFloor * 0.06);
        const shadowScale = 1 + heightFromFloor * 0.25;
        letter.shadow.scale.set(shadowScale, shadowScale, 1);
        (letter.shadow.material as THREE.MeshBasicMaterial).opacity = shadowAlpha;
      }

      return moving || ripples.length > 0;
    },

    disposeWorld() {
      for (const letter of letters.values()) {
        disposeObject(letter.group);
      }
      letters.clear();
      for (const rip of ripples) {
        root.remove(rip.ring);
        root.remove(rip.dent);
        rip.ringMat.dispose();
        rip.dentMat.dispose();
      }
      ripples.length = 0;
      sharedMaterial.dispose();
      groundMat.dispose();
      shadowMat.dispose();
      rippleGeo.dispose();
      dentGeo.dispose();
      shadowGeo.dispose();
      disposeObject(root);
    },
  };
}

export const magneticJelly: WorldModule = { create };
