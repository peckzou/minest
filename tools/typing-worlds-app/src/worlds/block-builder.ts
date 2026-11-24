/**
 * WORLD 18 · Block Builder (方块建造)
 *
 * A voxel valley in daylight: every letter is a real 3D build, three blocks deep, made of the land's own blocks.
 * - A translucent blueprint of the letter appears first.
 * - Blocks fly in from all around (sides, behind, above) along curved paths, tumbling,
 *   hover over their cell, then drop and lock in with a flash and a click.
 *   Build order is bottom-up / back-to-front, so blocks always stack on blocks below.
 * - Backspace unlocks the letter: blocks pop loose, tumble, bounce on the plate and vanish.
 * - Enter: a light wave runs through the finished word, then it disassembles into the sky.
 * Each block keeps its own position, rotation and state; everything is one InstancedMesh per letter.
 */
import * as THREE from 'three';
import { LetterWorld, type LetterVisual, canvasTexture } from '../engine/letter-world';
import { clamp, damp, lerp, rand, easeInOutCubic, easeOutCubic } from '../engine/anim';
import { Particles } from '../engine/particles';
import { DEFAULT_LAYOUT, type Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

const THEMES: Record<string, { color: number; rough: number; metal: number; ghost: number }> = {
  diamond: { color: 0x2fd6e0, rough: 0.2, metal: 0.25, ghost: 0x58c8ff },
  gold: { color: 0xffcf3a, rough: 0.22, metal: 0.75, ghost: 0xffd27a },
  emerald: { color: 0x2fd468, rough: 0.15, metal: 0.2, ghost: 0x7dffb0 },
  stone: { color: 0x9a968e, rough: 0.85, metal: 0.0, ghost: 0xb8c8d8 },
};

const CELL = 0.13; // glyph units
const THICK = 0.085;
const LAYERS = 3;
const GROUND = -1.05; // top of the grass: just under the descenders
/** edge of a land block: the letters' block size at full scale */
const LAND = 1.4 * CELL;

type CellState = 'wait' | 'fly' | 'drop' | 'locked' | 'loose' | 'gone';

interface Cell {
  gx: number;
  gy: number;
  gz: number;
  state: CellState;
  delay: number;
  t: number;
  dur: number;
  from: THREE.Vector3;
  ctrl: THREE.Vector3;
  q0: THREE.Quaternion;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Quaternion;
  spin: THREE.Vector3;
  flash: number;
  shade: number;
  scale: number;
  bounced: number;
}

interface BuildVisual extends LetterVisual {
  mesh: THREE.InstancedMesh;
  ghost: THREE.InstancedMesh;
  cells: Cell[];
  locked: number;
  finaleT: number;
  finaleDelay: number;
  dirty: boolean;
  lastKey: string;
}

const grey = (k: number) => {
  const v = Math.round(Math.min(1, k) * 255);
  return `rgb(${v},${v},${v})`;
};
const tint = (rgb: readonly [number, number, number], k: number) => `rgb(${rgb.map((c) => Math.round(Math.min(255, c * k))).join(',')})`;

/** a 16 × 16 pixel-art texture, shown unfiltered */
function pixelTexture(seed: number, paint: (x: number, y: number, R: () => number) => string) {
  let s = seed >>> 0;
  const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const tex = canvasTexture(16, 16, (g) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        g.fillStyle = paint(x, y, R);
        g.fillRect(x, y, 1, 1);
      }
  });
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), ux), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), ux), uy);
}
/** land height in blocks at world (x, z): flat where the letters are built, hills behind and at the sides */
function landHeight(x: number, z: number) {
  const n = vnoise(x * 0.24 + 7.1, z * 0.24 + 3.3) * 0.65 + vnoise(x * 0.63, z * 0.63) * 0.35;
  const back = -z - 2.4;
  const ax = Math.abs(x);
  let h = 0;
  if (back > 0) h += Math.min(back * 2.3, 15) * (0.18 + n) * (0.42 + 0.58 * clamp((ax - 2.5) / 7));
  if (ax > 9.5 && z < 2) h += (ax - 9.5) * 1.7 * (0.5 + n);
  return Math.floor(h);
}

class BlockBuilderWorld extends LetterWorld<BuildVisual> {
  private boxGeo: THREE.BoxGeometry;
  private blockMat: THREE.MeshStandardMaterial;
  private ghostMat: THREE.MeshBasicMaterial;
  private faceTex: THREE.Texture;
  private landTex: THREE.Texture[] = [];
  private camDist = 8.4;
  private sparks: Particles;
  private dust: Particles;
  private dummy = new THREE.Object3D();
  private tmp = new THREE.Vector3();
  private col = new THREE.Color();
  private white = new THREE.Color(0xffffff);
  private identity = new THREE.Quaternion();
  private theme: string;
  private lockSounds = 0;

  constructor(ctx: WorldContext) {
    super(ctx);
    this.theme = THEMES[ctx.theme] ? ctx.theme : 'diamond';
    const scene = ctx.scene;
    ctx.layout.setOptions({ ...DEFAULT_LAYOUT, metric: 'sans', size: 1.4, tracking: 0.12, maxWidth: 11.5, maxLines: 1, origin: [0, 0.2, 0], plane: 'xy', minScale: 0.25 });
    // A voxel valley in daylight: grass blocks underfoot, stepped hills and blocky trees behind, square clouds.
    // The letters are built of the same blocks as the land they stand over.
    scene.background = new THREE.Color(0x3f86d8);
    scene.fog = new THREE.Fog(0x8fbfe8, 22, 70);
    this.placeCamera(true);

    this.root.add(new THREE.HemisphereLight(0xdcecff, 0x4a6a3a, 0.7));
    const sun = new THREE.DirectionalLight(0xfff1d0, 1.7);
    sun.position.set(-6, 12, 9);
    if (ctx.quality > 1) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const c = sun.shadow.camera as THREE.OrthographicCamera;
      c.left = -10;
      c.right = 10;
      c.top = 7;
      c.bottom = -5;
      c.near = 1;
      c.far = 40;
      sun.shadow.bias = -0.0008;
    }
    this.root.add(sun);
    scene.environment = ctx.renderer.environment();
    scene.environmentIntensity = 0.35;

    // block face, 16 × 16 pixels (tinted by the theme): dark outline, bevel lit from the top left, a few facets
    this.faceTex = pixelTexture(18, (x, y, R) => {
      const edge = Math.min(x, y, 15 - x, 15 - y);
      if (edge === 0) return grey(0.6);
      if (edge === 1) return grey(x === 1 || y === 1 ? 1 : 0.76);
      const streak = (x + y) % 7 === 0 || (x - y + 16) % 9 === 0;
      return grey(streak ? 1 : 0.84 + R() * 0.1);
    });
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.boxGeo.userData.shared = true;
    this.blockMat = new THREE.MeshStandardMaterial({ map: this.faceTex });
    this.blockMat.userData.shared = true;
    this.ghostMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false });
    this.ghostMat.userData.shared = true;
    this.applyTheme();

    this.buildLand();

    this.sparks = new Particles({ capacity: 500, gravity: [0, -2, 0], drag: 2.2, size: 0.05, shape: 'spark' });
    this.dust = new Particles({ capacity: 400, gravity: [0, 0.2, 0], drag: 1.8, size: 0.16, shape: 'dot', blending: THREE.NormalBlending, opacity: 0.5, floor: GROUND });
    this.root.add(this.sparks.points, this.dust.points);
  }

  private placeCamera(snap: boolean, dt = 0) {
    const cam = this.ctx.camera;
    const aspect = this.ctx.renderer.size.aspect || 1.6;
    const v = Math.tan((cam.fov * Math.PI) / 360);
    const b = this.ctx.layout.bounds;
    const halfW = Math.max(2.5, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.x), Math.abs(b.max.x))) + 0.9;
    const want = Math.min(30, Math.max(8.4, halfW / (v * aspect)));
    this.camDist = snap ? want : damp(this.camDist, want, 3, dt);
    cam.position.set(0, 0.35 + this.camDist * 0.13, this.camDist);
    cam.lookAt(0, 0.3, 0);
    return Math.abs(this.camDist - want) > 0.01;
  }

  /** grass, hills, trees and clouds — all of it blocks */
  private buildLand() {
    const T = THREE;
    const q = this.ctx.quality;
    const P = LAND;
    const GRASS = [74, 138, 44] as const;
    const DIRT = [112, 78, 52] as const;
    const top = pixelTexture(3, (_x, _y, R) => tint(GRASS, 0.84 + R() * 0.28));
    const dirt = pixelTexture(5, (_x, _y, R) => (R() < 0.07 ? tint([112, 112, 112], 0.9 + R() * 0.2) : tint(DIRT, 0.8 + R() * 0.3)));
    const fringe = Array.from({ length: 16 }, (_, x) => 2 + ((hash2(x, 9) * 3) | 0));
    const side = pixelTexture(7, (x, y, R) => (y < fringe[x] ? tint(GRASS, 0.8 + R() * 0.26) : tint(DIRT, 0.8 + R() * 0.3)));
    const plain = pixelTexture(11, (_x, _y, R) => grey(0.8 + R() * 0.2));
    this.landTex.push(top, dirt, side, plain);

    const X = q === 0 ? 13 : 17;
    const ZF = 3.4;
    const ZB = q === 0 ? -12 : -17;
    const nx = Math.round((2 * X) / P);
    const nz = Math.round((ZF - ZB) / P);
    const H = new Int16Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) H[iz * nx + ix] = landHeight(-X + (ix + 0.5) * P, ZF - (iz + 0.5) * P);
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const idx: number[][] = [[], [], []];
    const quad = (m: number, v: number[], n: [number, number, number], us: number, vs: number) => {
      const i = pos.length / 3;
      pos.push(...v);
      for (let k = 0; k < 4; k++) nor.push(...n);
      uv.push(0, 0, us, 0, us, vs, 0, vs);
      idx[m].push(i, i + 1, i + 2, i, i + 2, i + 3);
    };
    const yOf = (h: number) => GROUND + h * P;
    for (let iz = 0; iz < nz; iz++) {
      const z0 = ZF - iz * P;
      const z1 = z0 - P;
      // tops: one quad for every run of equal height along x
      for (let ix = 0; ix < nx; ) {
        const h = H[iz * nx + ix];
        let e = ix + 1;
        while (e < nx && H[iz * nx + e] === h) e++;
        const x0 = -X + ix * P;
        const x1 = -X + e * P;
        const y = yOf(h);
        quad(0, [x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], [0, 1, 0], e - ix, 1);
        ix = e;
      }
      // walls where the neighbour is lower: a grass-edged block on top, dirt under it
      for (let ix = 0; ix < nx; ix++) {
        const h = H[iz * nx + ix];
        const x0 = -X + ix * P;
        const x1 = x0 + P;
        const wall = (hn: number, a: [number, number], b: [number, number], n: [number, number, number]) => {
          if (hn >= h) return;
          const yt = yOf(h);
          const ym = yt - P;
          quad(1, [a[0], ym, a[1], b[0], ym, b[1], b[0], yt, b[1], a[0], yt, a[1]], n, 1, 1);
          const d = h - 1 - hn;
          if (d > 0) quad(2, [a[0], yOf(hn), a[1], b[0], yOf(hn), b[1], b[0], ym, b[1], a[0], ym, a[1]], n, 1, d);
        };
        wall(iz > 0 ? H[(iz - 1) * nx + ix] : h - 3, [x0, z0], [x1, z0], [0, 0, 1]);
        if (ix > 0) wall(H[iz * nx + ix - 1], [x0, z1], [x0, z0], [-1, 0, 0]);
        if (ix < nx - 1) wall(H[iz * nx + ix + 1], [x1, z0], [x1, z1], [1, 0, 0]);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex([...idx[0], ...idx[1], ...idx[2]]);
    geo.addGroup(0, idx[0].length, 0);
    geo.addGroup(idx[0].length, idx[1].length, 1);
    geo.addGroup(idx[0].length + idx[1].length, idx[2].length, 2);
    const land = new T.Mesh(geo, [top, side, dirt].map((map) => new T.MeshLambertMaterial({ map })));
    land.receiveShadow = q > 1;
    this.root.add(land);

    // trees and clouds: plain blocks, coloured per instance
    const boxes: { x: number; y: number; z: number; sx: number; sy: number; sz: number; c: number }[] = [];
    const tree = (x: number, z: number, tall: number) => {
      const bx = Math.round(x / P) * P + P / 2;
      const bz = Math.round(z / P) * P + P / 2;
      const y0 = yOf(landHeight(bx, bz));
      for (let k = 0; k < tall; k++) boxes.push({ x: bx, y: y0 + (k + 0.5) * P, z: bz, sx: P, sy: P, sz: P, c: 0x7a5230 });
      for (let ly = 0; ly < 4; ly++) {
        const r = ly < 2 ? 2 : 1;
        for (let dx = -r; dx <= r; dx++)
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) === r && Math.abs(dz) === r && (r === 1 || hash2(dx + ly * 3 + x, dz + z) < 0.6)) continue;
            if (dx === 0 && dz === 0 && ly < 2) continue;
            boxes.push({ x: bx + dx * P, y: y0 + (tall - 1 + ly + 0.5) * P, z: bz + dz * P, sx: P, sy: P, sz: P, c: hash2(dx + ly, dz + x) < 0.5 ? 0x3f8f2e : 0x4aa236 });
          }
      }
    };
    tree(-7.4, -4.6, 5);
    tree(8.1, -5.4, 6);
    tree(-11.2, -7.5, 6);
    tree(11.6, -3.2, 5);
    if (q > 0) {
      tree(-4.6, -9.5, 5);
      tree(5.2, -10.4, 6);
      tree(-13.6, -1.4, 5);
      tree(14.2, -8.6, 6);
    }
    const blocks = new T.InstancedMesh(this.boxGeo, new T.MeshLambertMaterial({ map: plain }), boxes.length);
    boxes.forEach((b, i) => {
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.quaternion.identity();
      this.dummy.scale.set(b.sx, b.sy, b.sz);
      this.dummy.updateMatrix();
      blocks.setMatrixAt(i, this.dummy.matrix);
      blocks.setColorAt(i, this.col.setHex(b.c));
    });
    blocks.castShadow = q > 1;
    blocks.frustumCulled = false;
    this.root.add(blocks);

    const puffs: [number, number, number, number, number][] = [];
    const cloud = (x: number, y: number, z: number, w: number) => {
      puffs.push([x, y, z, w, 2.6], [x - w * 0.18, y + 0.75, z, w * 0.55, 2.2], [x + w * 0.3, y - 0.75, z, w * 0.5, 2]);
    };
    cloud(-17, 9.5, -34, 12);
    cloud(4, 12.5, -40, 15);
    cloud(21, 8.5, -32, 10);
    cloud(-33, 13.5, -42, 13);
    cloud(36, 14, -44, 14);
    const clouds = new T.InstancedMesh(this.boxGeo, new T.MeshBasicMaterial({ color: 0xffffff, fog: false }), puffs.length);
    puffs.forEach((c, i) => {
      this.dummy.position.set(c[0], c[1], c[2]);
      this.dummy.quaternion.identity();
      this.dummy.scale.set(c[3], 0.75, c[4]);
      this.dummy.updateMatrix();
      clouds.setMatrixAt(i, this.dummy.matrix);
    });
    clouds.frustumCulled = false;
    this.root.add(clouds);

    // the sky: deeper overhead, pale at the horizon
    const sky = new T.Mesh(
      new T.PlaneGeometry(260, 90),
      new T.ShaderMaterial({
        depthWrite: false,
        fog: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec2 vUv; void main(){
          vec3 col = mix(vec3(0.5, 0.72, 0.93), vec3(0.1, 0.33, 0.74), smoothstep(0.22, 0.44, vUv.y));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
      })
    );
    sky.position.set(0, 22, -60);
    sky.renderOrder = -10;
    this.root.add(sky);
  }

  private applyTheme() {
    const t = THEMES[this.theme] ?? THEMES.diamond;
    this.blockMat.color.setHex(t.color);
    this.blockMat.roughness = t.rough;
    this.blockMat.metalness = t.metal;
    this.ghostMat.color.setHex(t.ghost);
  }

  setTheme(id: string) {
    if (!THEMES[id]) return;
    this.theme = id;
    this.applyTheme();
    for (const v of this.letters.values()) {
      for (const c of v.cells) c.flash = Math.max(c.flash, 0.6);
      v.dirty = true;
    }
    this.ctx.keepAlive(800);
  }

  /* ------------------------------------------------------------ helpers */

  /** world-space cell edge length for a slot */
  private edge(slot: Slot) {
    return slot.size * CELL;
  }

  private targetOf(v: BuildVisual, c: Cell, out: THREE.Vector3) {
    this.ctx.layout.toWorld(v.slot, c.gx, c.gy, 0, out);
    out.z -= c.gz * this.edge(v.slot);
    return out;
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): BuildVisual | null {
    if (ev.char === ' ' || ev.char === '\n') return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    const raster = this.ctx.glyphs.raster(glyph, CELL, THICK);
    const cells: Cell[] = [];
    for (const rc of raster.cells) {
      for (let z = 0; z < LAYERS; z++) {
        cells.push({
          gx: rc.x,
          gy: rc.y,
          gz: z,
          state: 'wait',
          delay: 0,
          t: 0,
          dur: 0.5,
          from: new THREE.Vector3(),
          ctrl: new THREE.Vector3(),
          q0: new THREE.Quaternion(),
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          rot: new THREE.Quaternion(),
          spin: new THREE.Vector3(),
          flash: 0,
          shade: rand(0.86, 1.04) - z * 0.08,
          scale: 1,
          bounced: 0,
        });
      }
    }
    // bottom-up, back-to-front, left-to-right: blocks always land on something
    cells.sort((a, b) => a.gy - b.gy || b.gz - a.gz || a.gx - b.gx);
    const n = Math.max(1, cells.length);
    const mesh = new THREE.InstancedMesh(this.boxGeo, this.blockMat, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = this.ctx.quality > 1;
    mesh.receiveShadow = this.ctx.quality > 1;
    mesh.frustumCulled = false;
    const ghost = new THREE.InstancedMesh(this.boxGeo, this.ghostMat, n);
    ghost.frustumCulled = false;
    ghost.renderOrder = 2;
    const group = new THREE.Group();
    group.add(mesh, ghost);
    this.root.add(group);

    const v: BuildVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, mesh, ghost, cells, locked: 0, finaleT: 0, finaleDelay: 0, dirty: true, lastKey: '' };
    const e = this.edge(slot);
    if (ev.restoring || this.ctx.reducedMotion) {
      for (const c of cells) {
        c.state = 'locked';
        this.targetOf(v, c, c.pos);
      }
      v.locked = cells.length;
      v.state = 'alive';
    } else {
      const build = this.ctx.tempo.duration(1150, 380);
      const fly = this.ctx.tempo.duration(560, 260);
      const burst = ev.burstSize > 1 ? ev.burstIndex * 0.08 : 0;
      cells.forEach((c, i) => {
        c.delay = burst + (i / n) * build;
        c.dur = fly * rand(0.85, 1.15);
        this.targetOf(v, c, this.tmp);
        // come in from anywhere around: left, right, behind, above (never through the camera)
        const a = rand(0, Math.PI * 2);
        const r = rand(3, 5.5);
        c.from.set(this.tmp.x + Math.cos(a) * r, this.tmp.y + rand(0.5, 3.5), this.tmp.z - Math.abs(Math.sin(a)) * r * 0.7 - 0.5);
        c.ctrl.set(lerp(c.from.x, this.tmp.x, 0.5), Math.max(c.from.y, this.tmp.y) + rand(1, 2.2), lerp(c.from.z, this.tmp.z, 0.5));
        c.q0.setFromEuler(new THREE.Euler(rand(-3, 3), rand(-3, 3), rand(-3, 3)));
        c.pos.copy(c.from);
        c.scale = 0;
      });
      this.ctx.audio.play('whoosh', { gain: 0.25, pitch: 1.3 });
    }
    // blueprint ghost
    cells.forEach((c, i) => {
      this.targetOf(v, c, this.dummy.position);
      this.dummy.quaternion.identity();
      this.dummy.scale.setScalar(c.state === 'locked' ? 0 : e * 1.02);
      this.dummy.updateMatrix();
      ghost.setMatrixAt(i, this.dummy.matrix);
    });
    ghost.instanceMatrix.needsUpdate = true;
    this.writeAll(v);
    this.ctx.keepAlive(1600);
    return v;
  }

  protected removeLetter(v: BuildVisual, ev: DeleteEvent): void {
    const quick = ev.burstSize > 2;
    const cx = this.ctx.layout.toWorld(v.slot, v.slot.advance / v.slot.size / 2, 0.4, 0, new THREE.Vector3());
    for (const c of v.cells) {
      if (c.state === 'wait') {
        c.state = 'gone';
        c.scale = 0;
        continue;
      }
      c.state = 'loose';
      this.tmp.subVectors(c.pos, cx);
      c.vel.set(this.tmp.x * 3 + rand(-1, 1), rand(1.5, 4), rand(0.5, 2.5));
      if (quick) c.vel.multiplyScalar(0.6);
      c.spin.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
      c.t = 0;
    }
    v.ghost.visible = false;
    this.ctx.audio.play('crack', { gain: 0.4, pitch: 1.3 });
    this.ctx.keepAlive(1800);
  }

  protected playFinale(_word: string, visuals: BuildVisual[], saved: Promise<SaveOutcome>): void {
    visuals.sort((a, b) => a.slot.origin.x - b.slot.origin.x);
    visuals.forEach((v, i) => {
      // finish any unfinished build instantly-ish
      for (const c of v.cells) {
        if (c.state !== 'locked') {
          c.state = 'locked';
          this.targetOf(v, c, c.pos);
          c.scale = 1;
          c.flash = 1;
        }
      }
      v.ghost.visible = false;
      v.finaleT = 0;
      v.finaleDelay = i * 0.12;
      v.dirty = true;
    });
    this.ctx.audio.play('success', { gain: 0.7 });
    saved.then((r) => {
      if (!r.ok) this.ctx.audio.play('error', { gain: 0.5 });
    });
    this.ctx.keepAlive(3500 + visuals.length * 150);
  }

  /* ------------------------------------------------------------ update */

  private writeAll(v: BuildVisual) {
    const e = this.edge(v.slot);
    const d = this.dummy;
    v.cells.forEach((c, i) => {
      d.position.copy(c.pos);
      d.quaternion.copy(c.rot);
      d.scale.setScalar(e * 0.97 * c.scale);
      d.updateMatrix();
      v.mesh.setMatrixAt(i, d.matrix);
      this.col.setScalar(c.shade).lerp(this.white, clamp(c.flash) * 0.8);
      v.mesh.setColorAt(i, this.col);
    });
    v.mesh.instanceMatrix.needsUpdate = true;
    if (v.mesh.instanceColor) v.mesh.instanceColor.needsUpdate = true;
  }

  protected updateLetter(v: BuildVisual, dt: number, time: number): boolean {
    const key = `${v.slot.origin.x.toFixed(3)},${v.slot.origin.y.toFixed(3)},${v.slot.size.toFixed(3)}`;
    const moved = key !== v.lastKey;
    v.lastKey = key;
    let moving = false;
    const e = this.edge(v.slot);

    if (v.state === 'finale') return this.updateFinale(v, dt, time);

    for (const c of v.cells) {
      switch (c.state) {
        case 'wait':
          c.delay -= dt;
          moving = true;
          if (c.delay <= 0) {
            c.state = 'fly';
            c.t = 0;
            c.scale = 1;
          }
          break;
        case 'fly': {
          c.t += dt / c.dur;
          const k = easeInOutCubic(Math.min(1, c.t));
          // hover point just above the cell
          this.targetOf(v, c, this.tmp);
          this.tmp.y += e * 1.4;
          const u = 1 - k;
          c.pos.set(
            u * u * c.from.x + 2 * u * k * c.ctrl.x + k * k * this.tmp.x,
            u * u * c.from.y + 2 * u * k * c.ctrl.y + k * k * this.tmp.y,
            u * u * c.from.z + 2 * u * k * c.ctrl.z + k * k * this.tmp.z
          );
          c.rot.slerpQuaternions(c.q0, this.identity, easeOutCubic(Math.min(1, c.t * 1.15)));
          moving = true;
          if (c.t >= 1) {
            c.state = 'drop';
            c.t = 0;
          }
          break;
        }
        case 'drop': {
          c.t += dt / 0.09;
          this.targetOf(v, c, this.tmp);
          const k = Math.min(1, c.t);
          c.pos.copy(this.tmp);
          c.pos.y += e * 1.4 * (1 - k * k);
          c.rot.identity();
          moving = true;
          if (k >= 1) {
            c.state = 'locked';
            c.flash = 1;
            v.locked++;
            this.onLock(v, c);
          }
          break;
        }
        case 'locked':
          if (moved || v.dirty) this.targetOf(v, c, c.pos);
          if (c.flash > 0) {
            c.flash = Math.max(0, c.flash - dt * 3.2);
            moving = true;
          }
          break;
        case 'loose':
          moving = this.fall(c, dt, e) || moving;
          break;
        case 'gone':
          break;
      }
    }
    if (v.state === 'creating' && v.locked >= v.cells.length) {
      v.state = 'alive';
      this.ctx.audio.play('chime', { gain: 0.3, pitch: 1.4 });
      for (let i = 0; i < 8; i++) {
        const c = v.cells[(Math.random() * v.cells.length) | 0];
        if (c) this.sparks.emit({ x: c.pos.x, y: c.pos.y, z: c.pos.z + e, vx: rand(-1, 1), vy: rand(0.5, 2), vz: rand(0, 1), life: 0.6, color: 0xffffff, size: 1.6 });
      }
    }
    if (v.state === 'removing') {
      if (v.cells.every((c) => c.state === 'gone')) {
        this.release(v);
        return false;
      }
      moving = true;
    }
    if (moving || moved || v.dirty) {
      this.writeAll(v);
      if (moved && v.ghost.visible) {
        v.cells.forEach((c, i) => {
          this.targetOf(v, c, this.dummy.position);
          this.dummy.quaternion.identity();
          this.dummy.scale.setScalar(c.state === 'locked' ? 0 : e * 1.02);
          this.dummy.updateMatrix();
          v.ghost.setMatrixAt(i, this.dummy.matrix);
        });
        v.ghost.instanceMatrix.needsUpdate = true;
      }
      v.dirty = false;
    }
    if (v.state === 'alive' && v.ghost.visible) v.ghost.visible = false;
    return moving;
  }

  private onLock(v: BuildVisual, c: Cell) {
    const i = v.cells.indexOf(c);
    if (i >= 0 && v.ghost.visible) {
      v.ghost.getMatrixAt(i, this.dummy.matrix);
      this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      v.ghost.setMatrixAt(i, this.dummy.matrix);
      v.ghost.instanceMatrix.needsUpdate = true;
    }
    if (Math.random() < 0.35 * this.ctx.tempo.detail) {
      this.dust.emit({ x: c.pos.x + rand(-0.05, 0.05), y: c.pos.y - this.edge(v.slot) * 0.5, z: c.pos.z + 0.05, vx: rand(-0.4, 0.4), vy: rand(0, 0.2), vz: rand(0, 0.3), life: 0.5, color: 0xffffff, size: 0.6 });
    }
    if (this.lockSounds < 40) {
      this.lockSounds++;
      this.ctx.audio.play('tick', { gain: 0.25, pitch: 0.8 + (c.gy + 0.35) * 0.5, minGap: 0.035 });
    }
  }

  /** a loose block: gravity, spin, one bounce on the plate, then shrink away */
  private fall(c: Cell, dt: number, e: number) {
    c.t += dt;
    c.vel.y -= 14 * dt;
    c.pos.addScaledVector(c.vel, dt);
    const half = e * 0.5 * c.scale;
    if (c.pos.y < GROUND + half && c.vel.y < 0) {
      c.pos.y = GROUND + half;
      c.vel.y *= -0.35;
      c.vel.x *= 0.6;
      c.vel.z *= 0.6;
      c.spin.multiplyScalar(0.5);
      if (c.bounced++ === 0 && Math.random() < 0.3) this.ctx.audio.play('tap', { gain: 0.2, minGap: 0.04 });
    }
    this.tmp.copy(c.spin).multiplyScalar(dt);
    const dq = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.tmp.x, this.tmp.y, this.tmp.z));
    c.rot.multiply(dq);
    if (c.t > 0.8) c.scale = Math.max(0, c.scale - dt * 2.5);
    if (c.scale <= 0) c.state = 'gone';
    return true;
  }

  private updateFinale(v: BuildVisual, dt: number, _time: number) {
    if (v.finaleDelay > 0) {
      v.finaleDelay -= dt;
      return true;
    }
    v.finaleT += dt;
    const t = v.finaleT;
    const e = this.edge(v.slot);
    const left = v.slot.origin.x;
    for (const c of v.cells) {
      if (c.state === 'gone') continue;
      const lx = c.gx * v.slot.size;
      if (t < 0.9) {
        // light wave sweeps through (left → right inside the letter, bottom → top)
        const w = clamp((t * 2.2 - (lx / Math.max(0.3, v.slot.advance)) * 0.4 - (c.gy + 0.35) * 0.35) * 2);
        const pulse = Math.sin(w * Math.PI);
        this.targetOf(v, c, c.pos);
        c.pos.z += pulse * e * 0.6;
        c.flash = pulse;
        if (pulse > 0.95 && Math.random() < 0.03) this.sparks.emit({ x: c.pos.x, y: c.pos.y, z: c.pos.z + e, vx: rand(-0.5, 0.5), vy: rand(0.5, 1.5), vz: 0.5, life: 0.5, color: 0xffffff, size: 1.4 });
      } else {
        if (c.state === 'locked') {
          // unlock upward, spiralling into the sky
          c.state = 'loose';
          c.vel.set((c.pos.x - left) * 0.3 + rand(-0.6, 0.6), rand(4, 8), rand(-0.6, 0.6));
          c.spin.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
          c.t = rand(-0.4, 0);
        }
        c.t += dt;
        if (c.t > 0) {
          c.vel.y += 3 * dt;
          c.pos.addScaledVector(c.vel, dt);
          this.tmp.copy(c.spin).multiplyScalar(dt);
          c.rot.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.tmp.x, this.tmp.y, this.tmp.z)));
          c.scale = Math.max(0, 1 - c.t * 0.9);
          c.flash = Math.max(0, c.flash - dt);
          if (c.scale <= 0) c.state = 'gone';
        }
      }
    }
    if (t > 0.9 && v.cells.every((c) => c.state === 'gone')) {
      this.release(v);
      return false;
    }
    this.writeAll(v);
    return true;
  }

  protected updateWorld(dt: number, time: number): boolean {
    this.lockSounds = Math.max(0, this.lockSounds - dt * 30);
    let moving = this.sparks.update(dt, time);
    if (this.dust.update(dt, time)) moving = true;
    if (this.placeCamera(false, dt)) moving = true;
    return moving;
  }

  onLayout(): void {
    for (const v of this.letters.values()) v.dirty = true;
    this.ctx.keepAlive(300);
  }

  protected release(v: BuildVisual) {
    v.mesh.dispose();
    v.ghost.dispose();
    super.release(v);
  }

  disposeWorld(): void {
    for (const v of [...this.letters.values(), ...this.detached]) {
      v.mesh.dispose();
      v.ghost.dispose();
    }
    this.sparks.dispose();
    this.dust.dispose();
    super.disposeWorld();
    this.boxGeo.dispose();
    this.blockMat.dispose();
    this.ghostMat.dispose();
    this.faceTex.dispose();
    for (const t of this.landTex) t.dispose();
    this.ctx.scene.environment = null;
  }
}

export function create(ctx: WorldContext) {
  return new BlockBuilderWorld(ctx);
}

export const blockBuilder: WorldModule = { create };
