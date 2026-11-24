// Minest · 造梦基地 — the rooms of the Minest Imagineer Building, each its own place (in the building's own look):
// 灵感办公室, 故事部, 绘图室, 蓝图室, 机械角色室, 机械车间 — and 模型车间, the room around the model table, where 梦工坊's
// engine draws the miniature (dreamHost.ts). Every room has its Imagineers at work, a door back out to the building,
// and something of the open work on its wall: the storyboard (故事部), the plan (绘图室), every work's blueprint (蓝图室).
import * as THREE from 'three';
import { CrewMember, RoomId, workCrew } from './building';

export type RoomTap = { type: 'door' } | { type: 'work'; id: string } | null;
export interface RoomData { work: any | null; works: any[]; beats: { icon: string; name: string; text: string }[] }
type Prop = [string, number, number, number, number?];          // kind, x, z, size, turn
type Crew = [number, number, string, number];                   // x, z, what, coat
const W = 15, D = 9.5, H = 6.2;
const SPEC: Record<string, { wall: number; floor: number; props: Prop[]; crew: Crew[] }> = {
  'walts-office': { wall: 0x8a5a44, floor: 0x6b4226, props: [['clock', -6.2, -3.6, 2.4], ['globe', 5.6, -3.2, 2.0], ['book', -3.6, -3.4, 1.8], ['star', 3.2, -3.4, 1.6], ['podium', 0, -0.6, 1.6], ['lamp', 6.4, 0.5, 2.6], ['chair', 0, -1.9, 1.0, Math.PI]], crew: [[0, -1.3, 'think', 0x7d7d86], [-3.5, 1.2, 'walk', 0xb3202a], [4.2, 1.5, 'wave', 0x2f7d6b]] },
  'kem-weber-desk': { wall: 0x5a6f94, floor: 0x7b5434, props: [['book', -6.0, -3.2, 2.0], ['picture', 6.0, -3.4, 2.0], ['bench', -4.5, 1.6, 2.4, Math.PI / 2], ['musicbox', 5.4, 0.8, 1.4]], crew: [[-2.6, -1.6, 'point', 0x2f7d6b], [2.8, 1.4, 'walk', 0xd97706], [5.2, -1.2, 'think', 0x6d28d9]] },
  drafting: { wall: 0x6a8a6e, floor: 0x7b5434, props: [['eiffel', -6.0, -3.0, 3.0], ['pagoda', 6.0, -3.0, 2.8], ['podium', -3.4, 0.6, 1.4], ['podium', 3.4, 0.6, 1.4], ['lamp', -6.6, 1.2, 2.6]], crew: [[-3.4, 1.3, 'draw', 0x4f6d8f], [3.4, 1.3, 'draw', 0x8a6a4a], [0.4, -1.4, 'point', 0xf5f0e0]] },
  'blueprint-wall': { wall: 0x23406e, floor: 0x5f6b7a, props: [['castle', -6.0, -2.6, 3.0], ['windmill', 6.2, -2.8, 2.6], ['globe', 5.0, 1.6, 1.6]], crew: [[-2.4, 1.6, 'carry', 0x1f4f9a], [3.0, -0.8, 'point', 0xb3202a]] },
  'animatronics-lab': { wall: 0x6b5a8a, floor: 0x55506a, props: [['robot', -1.2, -2.4, 2.6], ['dino', 3.4, -2.6, 2.4], ['unicorn', -5.4, -2.6, 2.2], ['gears', 6.2, -3.0, 2.0], ['treasure', 5.6, 1.4, 1.4], ['spot', -6.6, 1.0, 2.8]], crew: [[-2.6, -0.6, 'hammer', 0x38bdf8], [2.0, -0.8, 'hammer', 0xec4899], [0, 1.8, 'walk', 0xfbbf24]] },
  'machine-shop': { wall: 0x70645a, floor: 0x4f4a45, props: [['train', -2.4, -2.4, 5.0, Math.PI / 2], ['rocket', 5.6, -2.8, 3.0], ['gears', -6.2, -3.0, 2.2], ['carousel', 4.6, 1.2, 2.6], ['biplane', -4.8, 1.6, 3.0, 0.6]], crew: [[-0.6, -0.6, 'hammer', 0xd97706], [2.6, -0.4, 'think', 0x4f7a3d], [0.6, 2.0, 'carry', 0x1f4f9a]] },
};
function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, lines: number) {
  let line = '', n = 0;
  for (const ch of text) { if (c.measureText(line + ch).width > max) { c.fillText(n === lines - 1 ? line.slice(0, -1) + '…' : line, x, y + n * lh); if (++n >= lines) return; line = ch; } else line += ch; }
  if (line) c.fillText(line, x, y + n * lh);
}
function blueprint(c: CanvasRenderingContext2D, w: number, h: number, work: any, title = true) {
  c.fillStyle = '#1e4a94'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1;
  for (let x = 20; x < w; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 20; y < h; y += 20) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12);
  if (!work) return;
  const top = title ? h * 0.2 : 0, R = Math.min(w, h - top) * 0.44, cx = w / 2, cy = top + (h - top) / 2;
  if (title) { c.fillStyle = '#fff'; c.font = `700 ${Math.round(h * 0.11)}px "PingFang SC", sans-serif`; c.textBaseline = 'top'; let t = work.title || '未命名的梦'; while (t.length > 1 && c.measureText(t).width > w - 40) t = t.slice(0, -1); c.fillText(t, 20, 16); }
  c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  (work.zones || []).forEach((z: any) => { c.strokeStyle = '#7dffb8'; c.setLineDash([6, 5]); c.beginPath(); c.arc(cx + z.x / 16 * R, cy + z.z / 16 * R, z.r / 16 * R, 0, 7); c.stroke(); c.setLineDash([]); });
  const r = work.route || []; if (r.length > 1) { c.strokeStyle = '#fde047'; c.lineWidth = 3; c.beginPath(); r.forEach((p: any, i: number) => { const x = cx + p.x / 16 * R, y = cy + p.z / 16 * R; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); }
  (work.objects || []).forEach((o: any) => { c.fillStyle = '#e6f1ff'; c.beginPath(); c.arc(cx + o.x / 16 * R, cy + o.z / 16 * R, Math.max(3, R * 0.03), 0, 7); c.fill(); });
}

class Room {
  scene = new THREE.Scene();
  crew: CrewMember[] = [];
  door: THREE.Object3D;
  wallArt = new THREE.Group();
  hits: THREE.Mesh[] = [];
  constructor(id: string, M: any) {
    const sp = SPEC[id], s = this.scene; s.background = new THREE.Color(0x141c2e);
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2.3));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.8); sun.position.set(3, 10, 8); s.add(sun);
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; s.add(o); return o; };
    const wall = mat(sp.wall), fl = add(new THREE.PlaneGeometry(W, D + 4), mat(sp.floor), 0, 0, 2 - D / 2 + D / 2); fl.rotation.x = -Math.PI / 2;
    add(new THREE.PlaneGeometry(W, H), wall, 0, H / 2, -D / 2);
    add(new THREE.PlaneGeometry(D + 4, H), mat(sp.wall, { color: new THREE.Color(sp.wall).multiplyScalar(0.82) }), -W / 2, H / 2, 2, Math.PI / 2);
    add(new THREE.PlaneGeometry(D + 4, H), mat(sp.wall, { color: new THREE.Color(sp.wall).multiplyScalar(0.82) }), W / 2, H / 2, 2, -Math.PI / 2);
    add(new THREE.BoxGeometry(W, 0.35, 0.2), mat(0xf2e6cf), 0, 0.18, -D / 2 + 0.1);
    [-4, 4].forEach((x) => add(new THREE.SphereGeometry(0.3, 14, 10), mat(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 1.8 }), x, H - 0.7, -1));
    // the door back out to the building, on the right wall
    const door = new THREE.Group(); door.position.set(W / 2 - 0.08, 0, -1.2); door.rotation.y = -Math.PI / 2; s.add(door);
    door.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.4, 0.12), mat(0x2f6b5a))); door.children[0].position.y = 1.7;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(0xfbbf24, { metalness: 0.6, roughness: 0.3 })); knob.position.set(0.65, 1.6, 0.12); door.add(knob);
    const exit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshBasicMaterial({ map: tex(150, 60, (c) => { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, 150, 60); c.font = '40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏢', 75, 32); }) })); exit.position.set(0, 3.85, 0.05); door.add(exit);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 1.2), new THREE.MeshBasicMaterial({ visible: false })); grip.position.y = 2.2; door.add(grip); this.door = grip;
    s.add(this.wallArt);
    const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
    sp.props.forEach(([kind, x, z, sz, turn]) => {
      try {
        const K = M.KINDS[kind], p: THREE.Object3D = M.build({ kind, color: K.color, text: K.text });
        p.traverse((o: any) => { if (o.isLight) o.visible = false; });
        box.setFromObject(p); box.getSize(size); box.getCenter(mid);
        const k = Math.min(sz / Math.max(size.x, size.z, 0.01), (H - 1.6) / Math.max(size.y, 0.01), 2.2);
        const h = new THREE.Group(); p.scale.setScalar(k); p.position.set(-mid.x * k, -box.min.y * k, -mid.z * k); h.add(p);
        h.position.set(x, 0.01, z); h.rotation.y = turn || 0; s.add(h);
      } catch (e) { /* left out */ }
    });
    sp.crew.forEach(([x, z, what, coat], i) => {
      const f: THREE.Object3D = M.figure({ height: 1.7, coat: '#' + coat.toString(16).padStart(6, '0'), hair: i % 2 ? '#3a2a20' : '#191514', shirt: '#f2efe6', skin: i % 2 ? '#e2b48c' : '#c98f62' });
      f.position.set(x, 0.01, z); s.add(f); this.crew.push({ g: f, rig: f.userData.rig, what, x0: x, seed: i * 2.3 + id.length });
    });
  }
  /** what hangs on the back wall: sheets of [x, y, w, h, texture, id?] */
  hang(items: [number, number, number, number, THREE.Texture, string?][]) {
    this.wallArt.traverse((o: any) => { if (o.material && o.material.map) o.material.map.dispose(); if (o.geometry) o.geometry.dispose(); });
    this.wallArt.clear(); this.hits = [];
    items.forEach(([x, y, w, h, map, id]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map })); m.position.set(x, y, -D / 2 + 0.06); this.wallArt.add(m);
      if (id) { m.userData.work = id; this.hits.push(m); }
    });
  }
}

export class Rooms {
  private rooms: Record<string, Room> = {};
  shop = new THREE.Scene();                 // 模型车间: the room around the model table (the engine draws the rest)
  private shopCrew: CrewMember[] = [];
  cam = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  private ray = new THREE.Raycaster();
  private yaw = 0; private t = 0;
  constructor(private M: any) {
    Object.keys(SPEC).forEach((id) => { this.rooms[id] = new Room(id, M); });
    this.buildShop();
  }
  private buildShop() {
    const s = this.shop, cx = 0.85, cz = 0.35; s.background = new THREE.Color(0x141c2e);
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6); sun.position.set(-4, 12, 8); s.add(sun);
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; s.add(o); return o; };
    const fl = add(new THREE.PlaneGeometry(26, 24), mat(0x9c7a55), cx, 0, cz + 2); fl.rotation.x = -Math.PI / 2;
    const wall = mat(0x9a6b3f), side = mat(0x7f5732);
    add(new THREE.PlaneGeometry(26, 9), wall, cx, 4.5, cz - 8);
    add(new THREE.PlaneGeometry(24, 9), side, cx - 13, 4.5, cz + 2, Math.PI / 2); add(new THREE.PlaneGeometry(24, 9), side, cx + 13, 4.5, cz + 2, -Math.PI / 2);
    add(new THREE.BoxGeometry(26, 0.4, 0.25), mat(0xf2e6cf), cx, 0.2, cz - 7.9);
    [-6, 6].forEach((x) => { add(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }), cx + x * 1.7, 6.3, cz - 7.95); add(new THREE.BoxGeometry(3.7, 0.16, 0.2), mat(0xf2e6cf), cx + x * 1.7, 4.95, cz - 7.9); });
    // the table: the felt is where the engine's disc, racks, desk and board stand (dreamHost.ts, TABLE_POS)
    const oak = mat(0x6b4226);
    add(new THREE.BoxGeometry(7.3, 0.26, 5.5), oak, cx, 1.215, cz); add(new THREE.BoxGeometry(6.9, 0.02, 5.1), mat(0x2f5a44, { roughness: 1 }), cx, 1.352, cz);
    ([[-3.3, -2.4], [3.3, -2.4], [-3.3, 2.4], [3.3, 2.4]] as number[][]).forEach(([x, z]) => add(new THREE.BoxGeometry(0.24, 1.1, 0.24), oak, cx + x, 0.55, cz + z));
    const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
    ([['castle', -9.5, -5.6, 3.2], ['ferris', 10.6, -5.4, 3.0], ['tree', -10.8, 3.2, 2.2], ['bench', 10.6, 2.4, 2.6, -Math.PI / 2], ['lamp', -11.2, -1.0, 3.0]] as Prop[]).forEach(([kind, x, z, sz, turn]) => {
      try {
        const K = this.M.KINDS[kind], p: THREE.Object3D = this.M.build({ kind, color: K.color }); p.traverse((o: any) => { if (o.isLight) o.visible = false; });
        box.setFromObject(p); box.getSize(size); box.getCenter(mid); const k = Math.min(sz / Math.max(size.x, size.z, 0.01), 6 / Math.max(size.y, 0.01));
        const h = new THREE.Group(); p.scale.setScalar(k); p.position.set(-mid.x * k, -box.min.y * k, -mid.z * k); h.add(p); h.position.set(cx + x, 0.01, cz + z); h.rotation.y = turn || 0; s.add(h);
      } catch (e) { /* left out */ }
    });
    ([[-6.4, -1.5, 'carry', 0x1f4f9a], [7.2, 0.5, 'hammer', 0xb3202a], [-7.6, 3.6, 'think', 0x2f7d6b], [6.0, -5.2, 'walk', 0xd97706]] as Crew[]).forEach(([x, z, what, coat], i) => {
      const f: THREE.Object3D = this.M.figure({ height: 1.7, coat: '#' + coat.toString(16).padStart(6, '0'), hair: i % 2 ? '#3a2a20' : '#191514', shirt: '#f2efe6' });
      f.position.set(cx + x, 0.01, cz + z); if (what === 'hammer') f.rotation.y = -Math.PI / 2; s.add(f); this.shopCrew.push({ g: f, rig: f.userData.rig, what, x0: cx + x, seed: i * 1.9 });
    });
  }
  shopFrame(dt: number) { this.t += dt; workCrew(this.shopCrew, this.t); }
  /** what the room shows of the work: the storyboard, the plan, every work's blueprint */
  refresh(id: RoomId, d: RoomData) {
    const r = this.rooms[id]; if (!r) return; this.yaw = this.yaw || 0;
    if (id === 'kem-weber-desk') {
      r.hang(d.beats.slice(0, 10).map((b, i) => [-5.6 + (i % 5) * 2.8, 4.4 - Math.floor(i / 5) * 1.9, 2.5, 1.6, tex(300, 192, (c, w, h) => {
        c.fillStyle = '#f5e9c8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a5a35'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
        c.fillStyle = '#8a1f2d'; c.beginPath(); c.arc(30, 30, 18, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '700 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 30, 31);
        c.textAlign = 'left'; c.fillStyle = '#3f2716'; c.font = '700 24px "PingFang SC", sans-serif'; c.fillText(b.icon + ' ' + b.name.slice(0, 7), 58, 31);
        c.font = '22px "PingFang SC", sans-serif'; c.textBaseline = 'top'; wrap(c, b.text, 16, 62, w - 32, 30, 4);
      })] as [number, number, number, number, THREE.Texture]));
    } else if (id === 'drafting') {
      r.hang([[0, 3.4, 6.6, 4.4, tex(660, 440, (c, w, h) => blueprint(c, w, h, d.work))]]);
    } else if (id === 'blueprint-wall') {
      r.hang(d.works.slice(0, 12).map((wk, i) => [-5.25 + (i % 4) * 3.5, 4.9 - Math.floor(i / 4) * 1.75, 3.1, 1.55, tex(372, 186, (c, w, h) => { blueprint(c, w, h, wk); if (d.work && d.work.id === wk.id) { c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); } }), wk.id] as [number, number, number, number, THREE.Texture, string]));
    }
  }
  reset() { this.yaw = 0; }
  drag(dx: number) { this.yaw = Math.max(-0.6, Math.min(0.6, this.yaw - dx * 0.003)); }
  render(renderer: THREE.WebGLRenderer, id: RoomId, dt: number, aspect: number) {
    const r = this.rooms[id]; if (!r) return; this.t += dt;
    const c = this.cam; if (c.aspect !== aspect) { c.aspect = aspect; c.updateProjectionMatrix(); }
    const dist = aspect < 1 ? 13 : 10.5;
    c.position.set(Math.sin(this.yaw) * dist, 3.4, -1 + Math.cos(this.yaw) * dist); c.lookAt(0, 2.5, -1.5);
    workCrew(r.crew, this.t);
    renderer.render(r.scene, c);
  }
  tap(e: PointerEvent, rect: DOMRect, id: RoomId): RoomTap {
    const r = this.rooms[id]; if (!r) return null;
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.cam);
    const h = this.ray.intersectObjects([r.door, ...r.hits], false)[0]; if (!h) return null;
    return h.object === r.door ? { type: 'door' } : { type: 'work', id: h.object.userData.work as string };
  }
}
