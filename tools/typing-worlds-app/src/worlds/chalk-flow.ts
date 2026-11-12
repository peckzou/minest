/**
 * WORLD 06 · Chalk Flow (粉笔黑板)
 *
 * 核心体验：
 * 粉笔在深绿/黑色黑板上自动逐笔写出字母，接触点落下细微粉尘；
 * 笔尖抬起准备下一字母；完成时划一道下划线；删除时板擦抹去字迹并散落粉尘。
 * 快速输入时，粉笔加速或由 Ghost 机制并行推进，绝不阻塞用户输入。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject, canvasTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';

const THEMES = [
  { id: 'green', label: '深绿黑板', bg: 0x1a2e22, board: 0x243b2d, wood: 0x4a3319 },
  { id: 'black', label: '哑光黑板', bg: 0x141517, board: 0x1e2023, wood: 0x3d3024 },
];

interface ChalkLetterVisual {
  id: number;
  char: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  drawn: number; // 0..1
  erasing: boolean;
  eraseProgress: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 摄像机与环境
  let theme = THEMES.find((t) => t.id === ctx.theme) ?? THEMES[0];
  ctx.scene.background = new T.Color(theme.bg);
  ctx.scene.fog = new T.Fog(theme.bg, 18, 55);
  ctx.camera.position.set(0, 0.4, 11);
  ctx.camera.lookAt(0, 0.35, 0);

  const amb = new T.AmbientLight(0xfff6ec, 0.85);
  root.add(amb);
  const dir = new T.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 8, 8);
  dir.castShadow = ctx.quality > 0;
  root.add(dir);

  // 2. 黑板与木质边框
  const boardTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#22382a';
    g.fillRect(0, 0, w, h);
    // 细腻噪点黑板纹理
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const alpha = Math.random() * 0.08;
      g.fillStyle = `rgba(255,255,255,${alpha})`;
      g.fillRect(x, y, 1.5, 1.5);
    }
    // 淡淡的板擦痕迹
    for (let i = 0; i < 15; i++) {
      const y = Math.random() * h;
      g.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`;
      g.fillRect(0, y, w, 20 + Math.random() * 40);
    }
  });

  const boardMat = new T.MeshStandardMaterial({
    map: boardTex,
    color: theme.board,
    roughness: 0.92,
    metalness: 0.02,
  });

  const boardMesh = new T.Mesh(new T.PlaneGeometry(16, 9.5), boardMat);
  boardMesh.position.set(0, 0.35, -0.05);
  boardMesh.receiveShadow = ctx.quality > 0;
  root.add(boardMesh);

  // 木质边框
  const woodMat = new T.MeshStandardMaterial({ color: theme.wood, roughness: 0.7, metalness: 0.1 });
  const frameTop = new T.Mesh(new T.BoxGeometry(16.6, 0.35, 0.3), woodMat);
  frameTop.position.set(0, 5.25, 0.05);
  root.add(frameTop);
  const frameBottom = new T.Mesh(new T.BoxGeometry(16.6, 0.45, 0.5), woodMat); // 槽板较宽，可放粉笔
  frameBottom.position.set(0, -4.55, 0.15);
  root.add(frameBottom);
  const frameLeft = new T.Mesh(new T.BoxGeometry(0.35, 9.5, 0.3), woodMat);
  frameLeft.position.set(-8.15, 0.35, 0.05);
  root.add(frameLeft);
  const frameRight = new T.Mesh(new T.BoxGeometry(0.35, 9.5, 0.3), woodMat);
  frameRight.position.set(8.15, 0.35, 0.05);
  root.add(frameRight);

  // 3. 粉尘粒子
  const dust = new Particles({
    capacity: 800,
    gravity: [0, -2.4, 0],
    drag: 1.5,
    size: 0.04,
    opacity: 0.8,
    shape: 'flake',
  });
  root.add(dust.points);

  // 4. 3D 粉笔工具模型
  const chalkGroup = new T.Group();
  const chalkGeo = new T.CylinderGeometry(0.08, 0.08, 0.8, 16);
  chalkGeo.rotateZ(Math.PI / 4);
  chalkGeo.translate(0.28, 0.28, 0);
  const chalkMat = new T.MeshStandardMaterial({ color: 0xf5f3ed, roughness: 0.85 });
  const chalkStick = new T.Mesh(chalkGeo, chalkMat);
  chalkStick.castShadow = ctx.quality > 0;
  chalkGroup.add(chalkStick);
  chalkGroup.position.set(5, -3.8, 0.3); // 初始停在黑板槽上
  root.add(chalkGroup);

  // 5. 3D 板擦模型（删除时挥动）
  const eraserGroup = new T.Group();
  const eraserWood = new T.Mesh(new T.BoxGeometry(0.9, 0.45, 0.3), woodMat);
  const eraserFelt = new T.Mesh(
    new T.BoxGeometry(0.9, 0.45, 0.1),
    new T.MeshStandardMaterial({ color: 0x333333, roughness: 0.95 })
  );
  eraserFelt.position.z = -0.15;
  eraserGroup.add(eraserWood);
  eraserGroup.add(eraserFelt);
  eraserGroup.position.set(0, 10, 0); // 藏在视野外
  root.add(eraserGroup);

  // 6. 下划线网格
  let underlineMesh: THREE.Mesh | null = null;

  // 7. 字母管理
  const visuals = new Map<number, ChalkLetterVisual>();
  const controller = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.25,
    maxQueue: 2,
    approach: 0.14,
    rest: () => new T.Vector3(5, -3.8, 0.35),
    restDelay: 0.9,
  });

  function createChalkShader() {
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor: { value: new T.Color(0xf6f4ed) },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        attribute float aU;
        varying float vU;
        varying vec2 vPos;
        void main() {
          vU = aU;
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vU;
        varying vec2 vPos;
        void main() {
          if (vU > uProgress) discard;
          // 粉笔粗糙边缘微噪
          float noise = fract(sin(dot(vPos.xy ,vec2(12.9898,78.233))) * 43758.5453);
          float alpha = smoothstep(0.0, 0.15, uProgress - vU) * (0.85 + noise * 0.15);
          gl_FragColor = vec4(uColor, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    });
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const ribbonGeo = ctx.glyphs.ribbon(glyph, 0.08);

      const mat = createChalkShader();
      const mesh = new T.Mesh(ribbonGeo, mat);

      const group = new T.Group();
      ctx.layout.apply(group, slot);
      group.add(mesh);
      root.add(group);

      const visual: ChalkLetterVisual = {
        id: ev.id,
        char: ev.char,
        group,
        mesh,
        mat,
        drawn: ev.restoring ? 1 : 0,
        erasing: false,
        eraseProgress: 0,
      };
      mat.uniforms.uProgress.value = visual.drawn;
      visuals.set(ev.id, visual);

      if (ev.restoring) return;

      const dur = ctx.tempo.duration(450, 180);

      controller.write({
        id: ev.id,
        glyph,
        slot,
        duration: dur,
        onProgress: (sample, tip) => {
          visual.drawn = sample.u;
          mat.uniforms.uProgress.value = sample.u;
          if (tip && sample.down && Math.random() < 0.65) {
            dust.emit({
              x: tip.x + (Math.random() - 0.5) * 0.05,
              y: tip.y + (Math.random() - 0.5) * 0.05,
              z: tip.z + 0.02,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.2 - Math.random() * 0.5,
              vz: 0.1 + Math.random() * 0.2,
              life: 0.6 + Math.random() * 0.4,
              color: 0xf5f3ed,
            });
            ctx.audio.play('chalk', { pitch: 0.95 + Math.random() * 0.15, gain: 0.4 });
          }
        },
        onDone: () => {
          visual.drawn = 1;
          mat.uniforms.uProgress.value = 1;
        },
      });

      ctx.keepAlive(1200);
    },

    onCharacterDelete(ev: DeleteEvent) {
      controller.cancel(ev.id);
      const visual = visuals.get(ev.id);
      if (!visual) return;

      visual.erasing = true;
      const slot = ctx.slotOf(ev.id);
      if (slot) {
        eraserGroup.position.set(slot.center.x, slot.center.y, 0.2);
        for (let i = 0; i < 24; i++) {
          dust.emit({
            x: slot.center.x + (Math.random() - 0.5) * 0.6,
            y: slot.center.y + (Math.random() - 0.5) * 0.6,
            z: 0.1,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -0.6 - Math.random() * 0.8,
            vz: 0.2 + Math.random() * 0.4,
            life: 0.8,
            color: 0xdedcd5,
          });
        }
      }
      ctx.audio.play('erase', { pitch: 1.1, gain: 0.6 });
      ctx.keepAlive(800);
    },

    onLayout() {
      for (const [id, visual] of visuals.entries()) {
        const slot = ctx.slotOf(id);
        if (slot) ctx.layout.apply(visual.group, slot);
      }
    },

    onWordComplete(word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      // 整词完成：快速在下方划一道粉笔下划线
      controller.flush();
      if (refs.length > 0) {
        const firstSlot = ctx.slotOf(refs[0].id);
        const lastSlot = ctx.slotOf(refs[refs.length - 1].id);
        if (firstSlot && lastSlot) {
          const x0 = firstSlot.origin.x - 0.1;
          const x1 = lastSlot.origin.x + lastSlot.advance + 0.1;
          const y = firstSlot.origin.y - 0.18;
          const lineGeo = new T.PlaneGeometry(x1 - x0, 0.06);
          const lineMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
          underlineMesh = new T.Mesh(lineGeo, lineMat);
          underlineMesh.position.set((x0 + x1) / 2, y, 0.01);
          root.add(underlineMesh);
          ctx.audio.play('success', { gain: 0.7 });
        }
      }
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(1800);
    },

    onTextClear() {
      controller.flush();
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
      if (underlineMesh) {
        root.remove(underlineMesh);
        underlineMesh.geometry.dispose();
        (underlineMesh.material as THREE.Material).dispose();
        underlineMesh = null;
      }
    },

    setTheme(themeId: string) {
      theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
      ctx.scene.background = new T.Color(theme.bg);
      ctx.scene.fog = new T.Fog(theme.bg, 18, 55);
      boardMat.color.set(theme.board);
      woodMat.color.set(theme.wood);
    },

    updateAnimation(dt: number, time: number): boolean {
      let moving = false;
      if (dust.update(dt, time)) moving = true;
      if (controller.update(dt)) moving = true;

      // 同步粉笔 3D 姿态
      const tool = controller.tools[0];
      if (tool) {
        chalkGroup.position.copy(tool.tip);
        const targetRotZ = tool.down ? Math.PI / 6 : Math.PI / 4;
        chalkGroup.rotation.z += (targetRotZ - chalkGroup.rotation.z) * 0.2;
        if (tool.job || tool.queue.length || tool.idle < 1.0) moving = true;
      }

      // 擦除动画
      for (const [id, visual] of visuals.entries()) {
        if (visual.erasing) {
          visual.eraseProgress += dt * 4.0;
          const k = visual.eraseProgress;
          visual.mat.uniforms.uOpacity.value = Math.max(0, 1 - k);
          if (k >= 1) {
            disposeObject(visual.group);
            visuals.delete(id);
            eraserGroup.position.set(0, 10, 0);
          }
          moving = true;
        }
      }

      // 下划线淡出
      if (underlineMesh) {
        moving = true;
      }

      return moving;
    },

    disposeWorld() {
      controller.flush();
      for (const visual of visuals.values()) {
        disposeObject(visual.group);
      }
      visuals.clear();
      if (underlineMesh) {
        root.remove(underlineMesh);
        underlineMesh.geometry.dispose();
        (underlineMesh.material as THREE.Material).dispose();
      }
      dust.dispose();
      boardTex.dispose();
      boardMat.dispose();
      woodMat.dispose();
      chalkMat.dispose();
      chalkGeo.dispose();
      disposeObject(chalkGroup);
      disposeObject(eraserGroup);
      disposeObject(root);
    },
  };
}

export const chalkFlow: WorldModule = { create };
