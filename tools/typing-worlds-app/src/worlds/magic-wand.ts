/**
 * WORLD 19 · Magic Wand (魔法棒)
 *
 * 核心体验：
 * 魔法棒飞入，棒尖沿字母笔画移动，留下明亮的发光轨迹与星尘粒子；
 * 星尘凝聚成悬浮的魔法立体字母；
 * Enter 时魔法棒在单词下方划出优雅弧线，所有字母同时迸发璀璨光芒；
 * Delete 时字母化作流散星光消散。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

const THEMES = [
  { id: 'fairy', label: '蓝精灵魔法', color: 0x62b6ff, glow: 0x9ed5ff, star: 0xd6eeff },
  { id: 'gold', label: '金色咒语', color: 0xffd166, glow: 0xffea9f, star: 0xfff6cf },
  { id: 'rainbow', label: '彩虹魔棒', color: 0xff7ad9, glow: 0x7afcff, star: 0xfff0fa },
];

interface WandLetterVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  drawn: number;
  glow: number;
  erasing: boolean;
  eraseProgress: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 深邃奇幻夜空背景
  let currentTheme = THEMES.find((t) => t.id === ctx.theme) ?? THEMES[0];
  ctx.scene.background = new T.Color(0x0c1224);
  ctx.scene.fog = new T.Fog(0x0c1224, 16, 50);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0x28385a, 0.9);
  root.add(amb);
  const dir = new T.DirectionalLight(0xaad0ff, 1.1);
  dir.position.set(4, 8, 6);
  root.add(dir);

  // 2. 星尘粒子系统
  const stardust = new Particles({
    capacity: 900,
    gravity: [0, -0.4, 0],
    drag: 1.0,
    size: 0.045,
    shape: 'spark',
    opacity: 0.95,
  });
  root.add(stardust.points);

  // 3. 3D 魔法棒模型
  const wandGroup = new T.Group();

  // 棒身：优雅深木色/银色细长杆
  const rodGeo = new T.CylinderGeometry(0.04, 0.025, 1.4, 12);
  rodGeo.translate(0, 0.7, 0);
  rodGeo.rotateZ(Math.PI / 4);
  const rodMat = new T.MeshStandardMaterial({ color: 0x3d304a, roughness: 0.3, metalness: 0.7 });
  const rodMesh = new T.Mesh(rodGeo, rodMat);
  wandGroup.add(rodMesh);

  // 棒尖水晶星辉
  const tipGeo = new T.OctahedronGeometry(0.09, 0);
  const tipMat = new T.MeshBasicMaterial({ color: currentTheme.glow });
  const tipMesh = new T.Mesh(tipGeo, tipMat);
  tipMesh.position.set(0, 0, 0);
  wandGroup.add(tipMesh);

  wandGroup.position.set(5, 3, 0.5);
  root.add(wandGroup);

  // 4. 字母着色器
  function createMagicShader(th: typeof currentTheme) {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uGlow: { value: 1.0 },
        uColor: { value: new T.Color(th.color) },
        uCore: { value: new T.Color(th.glow) },
        uTime: { value: 0 },
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
        uniform float uGlow;
        uniform vec3 uColor;
        uniform vec3 uCore;
        uniform float uTime;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          float shimmer = 0.85 + 0.15 * sin(uTime * 8.0 + vU * 20.0);
          vec3 c = mix(uColor, uCore, pow(fresnel, 1.4)) * shimmer * uGlow;
          gl_FragColor = vec4(c, 1.0);
        }
      `,
      side: T.DoubleSide,
    });
  }

  // 5. 控制器与字母管理
  const visuals = new Map<number, WandLetterVisual>();
  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.35,
    maxQueue: 2,
    approach: 0.15,
    rest: () => new T.Vector3(5, 3, 0.5),
    restDelay: 1.0,
  });

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const tubeGeo = ctx.glyphs.tube(glyph, 0.055, 8, true);

      const mat = createMagicShader(currentTheme);
      const mesh = new T.Mesh(tubeGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: WandLetterVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        drawn: ev.restoring ? 1 : 0,
        glow: 1,
        erasing: false,
        eraseProgress: 0,
      };

      mat.uniforms.uProgress.value = visual.drawn;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(420, 160);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down) {
            stardust.emit({
              x: tip.x,
              y: tip.y,
              z: tip.z + 0.05,
              vx: (Math.random() - 0.5) * 0.8,
              vy: 0.2 + (Math.random() - 0.5) * 0.6,
              vz: 0.2 + Math.random() * 0.4,
              life: 0.7 + Math.random() * 0.3,
              size: 1.2,
              color: currentTheme.star,
            });
            if (Math.random() < 0.35) {
              ctx.audio.play('sparkle', { pitch: 1.0 + Math.random() * 0.3, gain: 0.35 });
            }
          }
        },
        onDone: () => {
          visual.drawn = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.audio.play('chime', { pitch: 1.1 + Math.random() * 0.2, gain: 0.45 });
      ctx.keepAlive(1200);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const visual = visuals.get(ev.id);
      if (!visual) return;
      visual.erasing = true;

      const slot = ctx.slotOf(ev.id);
      if (slot) {
        for (let i = 0; i < 30; i++) {
          stardust.emit({
            x: slot.center.x + (Math.random() - 0.5) * 0.5,
            y: slot.center.y + (Math.random() - 0.5) * 0.5,
            z: 0.1,
            vx: (Math.random() - 0.5) * 2.0,
            vy: (Math.random() - 0.5) * 2.0,
            vz: 0.5 + Math.random() * 1.5,
            life: 0.8,
            color: currentTheme.glow,
          });
        }
      }
      ctx.audio.play('pop', { pitch: 1.5, gain: 0.4 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      controller.flush();
      ctx.audio.play('success', { gain: 0.8 });

      // 魔法棒弧线挥动 & 所有字母高亮闪耀
      for (const visual of visuals.values()) {
        visual.glow = 2.4;
      }

      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      controller.flush();
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
    },

    setTheme(themeId: string) {
      currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
      tipMat.color.set(currentTheme.glow);
      for (const visual of visuals.values()) {
        visual.mat.uniforms.uColor.value.set(currentTheme.color);
        visual.mat.uniforms.uCore.value.set(currentTheme.glow);
      }
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (stardust.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      // 魔法棒姿态同步
      const tool = controller.tools[0];
      if (tool) {
        wandGroup.position.copy(tool.tip);
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      // 闪烁和消散更新
      for (const [id, visual] of visuals.entries()) {
        visual.mat.uniforms.uTime.value = time;

        if (visual.glow > 1.0) {
          visual.glow = Math.max(1.0, visual.glow - dt * 2.0);
          visual.mat.uniforms.uGlow.value = visual.glow;
          moving = true;
        }

        if (visual.erasing) {
          visual.eraseProgress += dt * 4.5;
          const k = visual.eraseProgress;
          visual.glow = Math.max(0, 1 - k);
          visual.mat.uniforms.uGlow.value = visual.glow;
          if (k >= 1) {
            disposeObject(visual.group);
            visuals.delete(id);
          }
          moving = true;
        }
      }

      return moving;
    },

    disposeWorld() {
      controller.flush();
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
      stardust.dispose();
      rodGeo.dispose();
      rodMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      disposeObject(wandGroup);
      disposeObject(root);
    },
  };
}

export const magicWand: WorldModule = { create };
