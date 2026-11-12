/**
 * WORLD 18 · Block Builder (方块建造)
 *
 * 核心体验：
 * 借鉴 Minecraft 体素建造机制，钻石、黄金、绿宝石方块逐块吸附网格拼出立体字母；
 * Delete 时方块碎裂下落；Enter 全词作为 3D 体素雕塑呈现。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { disposeObject } from '../engine/letter-world';

const THEMES = [
  { id: 'diamond', label: '钻石', color: 0x4eedf0, rough: 0.1 },
  { id: 'gold', label: '黄金', color: 0xfacf2b, rough: 0.2 },
  { id: 'emerald', label: '绿宝石', color: 0x2bcc5a, rough: 0.1 },
  { id: 'stone', label: '圆石', color: 0x8a8a8a, rough: 0.8 },
];

const CELL_SIZE = 0.16;

interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  targetY: number;
  fallSpeed: number;
  landed: boolean;
}

interface LetterVoxels {
  id: number;
  char: string;
  blocks: VoxelBlock[];
  mesh: THREE.InstancedMesh;
  erasing: boolean;
  eraseK: number;
}

export function create(ctx: WorldContext): WorldInstance {
  const T = ctx.THREE;
  const root = new THREE.Group();
  ctx.scene.add(root);

  // 1. 体素明亮天空与草地方块地面
  ctx.scene.background = new T.Color(0x7ec8ff);
  ctx.scene.fog = new T.Fog(0x7ec8ff, 18, 60);
  ctx.camera.position.set(0, 1.2, 10.5);
  ctx.camera.lookAt(0, 0.5, 0);

  const amb = new T.AmbientLight(0xffffff, 1.1);
  root.add(amb);
  const sun = new T.DirectionalLight(0xfffae8, 1.6);
  sun.position.set(8, 14, 8);
  sun.castShadow = ctx.quality > 0;
  root.add(sun);

  // 方块地面
  const grassMat = new T.MeshStandardMaterial({ color: 0x5da836, roughness: 0.85 });
  const ground = new T.Mesh(new T.BoxGeometry(26, 1, 14), grassMat);
  ground.position.set(0, -1.8, 0);
  ground.receiveShadow = ctx.quality > 0;
  root.add(ground);

  // 方块单元
  const boxGeo = new T.BoxGeometry(CELL_SIZE * 0.94, CELL_SIZE * 0.94, CELL_SIZE * 0.94);
  let currentTheme = THEMES.find((t) => t.id === ctx.theme) ?? THEMES[0];
  const blockMat = new T.MeshStandardMaterial({
    color: currentTheme.color,
    roughness: currentTheme.rough,
    metalness: 0.2,
  });

  const letters = new Map<number, LetterVoxels>();
  const dummy = new T.Object3D();

  return {
    onCharacterInput(ev: InsertEvent) {
      if (ev.char === ' ' || ev.char === '\n') return;
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;

      const glyph = ctx.glyphs.get(ev.char, 'sans');
      const raster = ctx.glyphs.raster(glyph, CELL_SIZE, 0.12);

      const blocks: VoxelBlock[] = [];
      const instMesh = new T.InstancedMesh(boxGeo, blockMat, raster.cells.length || 1);
      instMesh.castShadow = ctx.quality > 0;
      instMesh.receiveShadow = ctx.quality > 0;
      root.add(instMesh);

      raster.cells.forEach((c) => {
        const worldPos = ctx.layout.toWorld(slot, c.x, c.y, 0);
        blocks.push({
          x: worldPos.x,
          y: ev.restoring ? worldPos.y : worldPos.y + 3.5 + Math.random() * 2,
          z: worldPos.z,
          targetY: worldPos.y,
          fallSpeed: 14 + Math.random() * 6,
          landed: ev.restoring,
        });
      });

      letters.set(ev.id, {
        id: ev.id,
        char: ev.char,
        blocks,
        mesh: instMesh,
        erasing: false,
        eraseK: 0,
      });

      if (!ev.restoring) {
        ctx.audio.play('thud', { pitch: 1.4 + Math.random() * 0.3, gain: 0.5 });
      }
      ctx.keepAlive(1500);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const l = letters.get(ev.id);
      if (!l) return;
      l.erasing = true;
      ctx.audio.play('pop', { pitch: 0.8, gain: 0.5 });
      ctx.keepAlive(600);
    },

    onLayout() {
      for (const [id, l] of letters.entries()) {
        const slot = ctx.slotOf(id);
        if (!slot) continue;
        const glyph = ctx.glyphs.get(l.char, 'sans');
        const raster = ctx.glyphs.raster(glyph, CELL_SIZE, 0.12);
        raster.cells.forEach((c, idx) => {
          if (l.blocks[idx]) {
            const worldPos = ctx.layout.toWorld(slot, c.x, c.y, 0);
            l.blocks[idx].x = worldPos.x;
            l.blocks[idx].targetY = worldPos.y;
            l.blocks[idx].z = worldPos.z;
          }
        });
      }
    },

    onWordComplete(word: string, _refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      ctx.audio.play('success', { gain: 0.8 });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.5 });
      });
      ctx.keepAlive(2000);
    },

    onTextClear() {
      for (const l of letters.values()) {
        root.remove(l.mesh);
        l.mesh.dispose();
      }
      letters.clear();
    },

    setTheme(themeId: string) {
      currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
      blockMat.color.set(currentTheme.color);
      blockMat.roughness = currentTheme.rough;
    },

    updateAnimation(dt: number): boolean {
      let moving = false;
      const step = Math.min(dt, 1 / 30);

      for (const [id, l] of letters.entries()) {
        if (l.erasing) {
          l.eraseK += step * 4.0;
          const k = l.eraseK;
          const scale = Math.max(0, 1 - k);
          l.blocks.forEach((b, idx) => {
            b.y -= step * 4;
            dummy.position.set(b.x, b.y, b.z);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            l.mesh.setMatrixAt(idx, dummy.matrix);
          });
          l.mesh.instanceMatrix.needsUpdate = true;
          if (k >= 1) {
            root.remove(l.mesh);
            l.mesh.dispose();
            letters.delete(id);
          }
          moving = true;
          continue;
        }

        l.blocks.forEach((b, idx) => {
          if (!b.landed) {
            b.y -= b.fallSpeed * step;
            if (b.y <= b.targetY) {
              b.y = b.targetY;
              b.landed = true;
            }
            moving = true;
          }
          dummy.position.set(b.x, b.y, b.z);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          l.mesh.setMatrixAt(idx, dummy.matrix);
        });

        l.mesh.instanceMatrix.needsUpdate = true;
      }

      return moving;
    },

    disposeWorld() {
      for (const l of letters.values()) {
        root.remove(l.mesh);
        l.mesh.dispose();
      }
      letters.clear();
      boxGeo.dispose();
      blockMat.dispose();
      grassMat.dispose();
      disposeObject(ground);
      disposeObject(root);
    },
  };
}

export const blockBuilder: WorldModule = { create };
