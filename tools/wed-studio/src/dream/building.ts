// Minest · 造梦基地 — the Minest Imagineer Building: the way in. The building stands with its front open like a doll's
// house: eight rooms on two floors, each a department of the workshop with its little Imagineers at work. Tap a room
// and the camera goes in; the studio (or the Passport Hall) opens at that department. Drag to look along the building.
import * as THREE from 'three';

export type RoomId = 'model-table' | 'drafting' | 'kem-weber-desk' | 'blueprint-wall' | 'animatronics-lab' | 'machine-shop' | 'walts-office' | 'hall';
export interface Room { id: RoomId; icon: string; name: string; en: string; col: number; floor: 0 | 1; wall: number; props: [string, number, number, number, number?][]; crew: [number, number, string, number][] }
// props: [kind, x, z, size, turn]; crew: [x, z, what they do, coat colour] — all inside the room, x from −3 to 3
export const ROOMS: Room[] = [
  { id: 'walts-office', icon: '💡', name: '灵感办公室', en: 'IDEAS', col: 0, floor: 1, wall: 0x8a5a44, props: [['clock', -2.1, -1.2, 1.9], ['star', 1.9, -0.9, 1.5], ['globe', 0.2, -1.4, 1.3]], crew: [[-0.6, 0.5, 'think', 0x7d7d86], [1.5, 0.9, 'wave', 0xb3202a]] },
  { id: 'kem-weber-desk', icon: '🎞', name: '故事部', en: 'STORY', col: 1, floor: 1, wall: 0x5a6f94, props: [['book', -1.8, -0.9, 1.6], ['picture', 1.7, -1.3, 1.7], ['sign', 0, -1.5, 1.5]], crew: [[-0.4, 0.6, 'point', 0x2f7d6b], [1.6, 0.9, 'walk', 0xd97706]] },
  { id: 'drafting', icon: '📐', name: '绘图室', en: 'DRAFTING', col: 2, floor: 1, wall: 0x6a8a6e, props: [['eiffel', -2.0, -1.2, 2.4], ['pagoda', 1.9, -1.2, 2.2], ['podium', 0, -0.4, 1.0]], crew: [[0, 0.5, 'draw', 0x4f6d8f], [-1.7, 1.0, 'think', 0x8a6a4a]] },
  { id: 'blueprint-wall', icon: '🗺', name: '蓝图室', en: 'MASTER PLANS', col: 3, floor: 1, wall: 0x1e4a94, props: [['castle', 0, -1.2, 2.6], ['windmill', -2.2, -1.0, 1.9], ['lamp', 2.3, -0.6, 2.2]], crew: [[1.3, 0.7, 'point', 0xf5f0e0], [-1.2, 0.9, 'walk', 0x6d28d9]] },
  { id: 'hall', icon: '📔', name: '护照馆', en: 'PASSPORT HALL', col: 0, floor: 0, wall: 0x2f4a78, props: [['column', -2.3, -1.2, 2.8], ['column', 2.3, -1.2, 2.8], ['pyramid', -0.9, -1.0, 1.5], ['panda', 0.9, -0.8, 1.3]], crew: [[0, 0.8, 'wave', 0x2f7d6b]] },
  { id: 'model-table', icon: '🏗', name: '模型车间', en: 'MODEL SHOP', col: 1, floor: 0, wall: 0x9a6b3f, props: [['stage', 0, -0.5, 3.4], ['carousel', -1.9, -1.4, 1.6], ['tree', 2.2, -1.3, 1.6]], crew: [[-1.4, 0.9, 'hammer', 0xb3202a], [1.4, 0.9, 'carry', 0x1f4f9a]] },
  { id: 'animatronics-lab', icon: '🤖', name: '机械角色室', en: 'AUDIO-ANIMATRONICS', col: 2, floor: 0, wall: 0x6b5a8a, props: [['robot', 0.4, -0.9, 1.9], ['dino', -2.0, -1.1, 1.8], ['musicbox', 2.2, -1.1, 1.2]], crew: [[-0.8, 0.8, 'hammer', 0x38bdf8], [1.8, 0.9, 'think', 0xec4899]] },
  { id: 'machine-shop', icon: '⚙️', name: '机械车间', en: 'MACHINE SHOP', col: 3, floor: 0, wall: 0x70645a, props: [['train', 0.2, -1.0, 3.2, Math.PI / 2], ['gears', -2.2, -1.2, 1.6], ['rocket', 2.3, -1.2, 2.2]], crew: [[-0.9, 0.9, 'hammer', 0xd97706], [1.3, 1.0, 'walk', 0x4f7a3d]] },
];
export const RW = 6.4, RH = 4.2, RD = 4.6;
function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });

/** the little Imagineers at work: each keeps doing its one thing (hammer, wave, think, point, draw, carry, walk) */
export interface CrewMember { g: THREE.Object3D; rig: any; what: string; x0: number; seed: number }
export function workCrew(crew: CrewMember[], time: number) {
  crew.forEach((p) => {
    const r = p.rig, t = time + p.seed; if (!r) return;
      r.armL.rotation.set(0, 0, -0.06); r.armR.rotation.set(0, 0, 0.06); r.head.rotation.set(0, 0, 0); r.spine.rotation.set(0, 0, 0); r.legL.rotation.x = r.legR.rotation.x = 0;
      r.spine.position.y = Math.sin(t * 1.8) * 0.01;
      if (p.what === 'hammer') { r.armR.rotation.x = -1.5 + Math.abs(Math.sin(t * 5)) * 1.1; r.spine.rotation.x = 0.18; }
      else if (p.what === 'wave') { r.armR.rotation.x = -2.6; r.armR.rotation.z = 0.25 + Math.sin(t * 6) * 0.3; r.head.rotation.y = Math.sin(t * 0.8) * 0.3; }
      else if (p.what === 'think') { r.armR.rotation.x = -2.0; r.armR.rotation.z = -0.5; r.head.rotation.z = Math.sin(t * 0.7) * 0.12; r.head.rotation.x = 0.1; }
      else if (p.what === 'point') { r.armR.rotation.x = -1.55 + Math.sin(t * 1.3) * 0.15; r.head.rotation.y = Math.sin(t * 0.9) * 0.4; }
      else if (p.what === 'draw') { r.spine.rotation.x = 0.3; r.armR.rotation.x = -1.2 + Math.sin(t * 4) * 0.12; r.armR.rotation.z = Math.sin(t * 2.7) * 0.25; r.armL.rotation.x = -0.9; }
      else if (p.what === 'carry') { r.armL.rotation.x = r.armR.rotation.x = -1.3; p.g.position.x = p.x0 + Math.sin(t * 0.5) * 0.7; p.g.rotation.y = Math.cos(t * 0.5) > 0 ? Math.PI / 2 : -Math.PI / 2; r.legL.rotation.x = Math.sin(t * 5) * 0.4; r.legR.rotation.x = -Math.sin(t * 5) * 0.4; }
      else if (p.what === 'walk') { p.g.position.x = p.x0 + Math.sin(t * 0.6) * 0.9; p.g.rotation.y = Math.cos(t * 0.6) > 0 ? Math.PI / 2 : -Math.PI / 2; const sw = Math.sin(t * 6) * 0.5; r.legL.rotation.x = sw; r.legR.rotation.x = -sw; r.armL.rotation.x = -sw * 0.7; r.armR.rotation.x = sw * 0.7; }
    });
}

/** one room, in its own frame (x −3.2…3.2, back wall at z = −RD, open at z = 0): its wall, floor, lamp, name plate,
 *  things and Imagineers — the doll's house stacks these, the walk-in building sets them along its corridor */
export function roomBay(M: any, r: Room, crew: CrewMember[]): THREE.Group {
  const g = new THREE.Group(), box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(RW - 0.3, RH - 0.3), mat(r.wall)); wall.position.set(0, RH / 2 - 0.15, -RD + 0.08); g.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW - 0.3, RD), mat(r.floor ? 0xb08a5f : 0x9c7a55)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, -RD / 2); g.add(floor);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 1.6 })); lamp.position.set(0, RH - 0.75, -RD / 2 - 0.8); g.add(lamp);
  // the name over the door
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.85), new THREE.MeshBasicMaterial({ map: tex(436, 80, (c, w, h) => {
    c.fillStyle = '#3f2716'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9b25a'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.font = '44px sans-serif'; c.textBaseline = 'middle'; c.fillText(r.icon, 16, 42); c.fillStyle = '#fde68a'; c.font = '700 34px "PingFang SC", sans-serif'; c.fillText(r.name, 78, 42);
  }) })); plate.position.set(0, RH - 0.66, 0.55); g.add(plate);
  r.props.forEach(([kind, x, z, sz, turn]) => {
    try {
      const K = M.KINDS[kind], p: THREE.Object3D = M.build({ kind, color: K.color, text: kind === 'sign' ? r.name : K.text });
      p.traverse((o: any) => { if (o.isLight) o.visible = false; });
      box.setFromObject(p); box.getSize(size); box.getCenter(mid);
      const k = Math.min(sz / Math.max(size.x, size.z, 0.01), (RH - 1.3) / Math.max(size.y, 0.01));
      const h = new THREE.Group(); p.scale.setScalar(k); p.position.set(-mid.x * k, -box.min.y * k, -mid.z * k); h.add(p);
      h.position.set(x, 0.02, -RD / 2 + z + 0.6); h.rotation.y = turn || 0; g.add(h);
    } catch (e) { /* a prop that cannot be built is left out */ }
  });
  r.crew.forEach(([x, z, what, coat], i) => {
    const f: THREE.Object3D = M.figure({ height: 1.5, coat: '#' + coat.toString(16).padStart(6, '0'), hair: i % 2 ? '#3a2a20' : '#191514', shirt: '#f2efe6', skin: i % 2 ? '#e2b48c' : '#c98f62' });
    f.position.set(x, 0.02, -RD / 2 + z + 0.9); g.add(f);
    crew.push({ g: f, rig: f.userData.rig, what, x0: x, seed: r.col * 3 + r.floor * 7 + i * 1.7 });
  });
  return g;
}

export class ImagineerBuilding {
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  private ray = new THREE.Raycaster();
  private grips: THREE.Mesh[] = [];
  private frames: Record<string, THREE.MeshStandardMaterial> = {};
  private crew: CrewMember[] = [];
  private yaw = 0; private t = 0;
  private fly: { t: number; to: THREE.Vector3; look: THREE.Vector3; done: () => void } | null = null;
  private pos = new THREE.Vector3(0, 5.4, 30); private look3 = new THREE.Vector3(0, 4.4, 0);
  private hover: string | null = null;

  constructor(private M: any) {
    const s = this.scene; s.background = new THREE.Color(0x8fcbf5); s.fog = new THREE.Fog(0x8fcbf5, 60, 140);
    s.add(new THREE.HemisphereLight(0xffffff, 0x9a8a70, 2.4));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(10, 20, 24); s.add(sun);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(90, 48), mat(0x7fb86a)); grass.rotation.x = -Math.PI / 2; s.add(grass);
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(34, 12), mat(0xd9cbb0)); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.02, 6); s.add(plaza);
    const W = RW * 4, cream = mat(0xf2e6cf), trim = mat(0xb23a2e), gold = mat(0xfbbf24, { metalness: 0.5, roughness: 0.35 });
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); s.add(o); return o; };
    add(new THREE.BoxGeometry(W + 1.2, 0.5, RD + 1.6), mat(0xa39680), 0, 0.25, -RD / 2 + 0.3);                 // the plinth
    [0, 1, 2].forEach((f) => add(new THREE.BoxGeometry(W + 0.8, 0.3, RD + 0.6), cream, 0, 0.5 + f * RH + (f ? 0 : -0.15) + 0.15, -RD / 2));   // floors and the roof slab
    for (let c = 0; c <= 4; c++) add(new THREE.BoxGeometry(0.3, RH * 2 + 0.3, RD + 0.4), cream, -W / 2 + c * RW, 0.5 + RH, -RD / 2);       // the walls between rooms
    add(new THREE.BoxGeometry(W + 0.8, RH * 2 + 0.3, 0.3), cream, 0, 0.5 + RH, -RD - 0.1);                                           // the back
    add(new THREE.BoxGeometry(W + 1.6, 0.5, RD + 1.4), trim, 0, 0.5 + RH * 2 + 0.55, -RD / 2);                                       // the cornice
    const sign = add(new THREE.PlaneGeometry(17, 3.0), new THREE.MeshBasicMaterial({ map: tex(1024, 180, (c, w, h) => {
      c.fillStyle = '#1e2a4a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 84px Georgia, serif'; c.fillText('MINEST IMAGINEER', w / 2, 72);
      c.fillStyle = '#fff'; c.font = '700 40px "PingFang SC", sans-serif'; c.fillText('✨ 造 梦 大 楼 ✨', w / 2, 140);
    }) }), 0, 0.5 + RH * 2 + 2.5, -RD / 2 + 1.2);
    void sign;
    [-7.8, 7.8].forEach((x) => { add(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), gold, x, 0.5 + RH * 2 + 1.8, -RD / 2 + 1.2); });
    add(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8), gold, 11.5, 0.5 + RH * 2 + 2.4, -RD / 2);
    const flag = add(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide }), 12.45, 0.5 + RH * 2 + 3.5, -RD / 2); void flag;
    ([[-17, 3], [17, 2], [-20, -4], [20.5, -5], [-15.5, 8], [16, 9]] as [number, number][]).forEach(([x, z], i) => { try { const t = M.build({ kind: 'tree', color: i % 2 ? '#5f9a4a' : '#4f7a3d' }); t.scale.setScalar(1.3 + (i % 3) * 0.25); t.position.set(x, 0, z); s.add(t); } catch (e) { /* no trees */ } });

    ROOMS.forEach((r) => {
      const g = roomBay(M, r, this.crew); g.position.set(-W / 2 + RW / 2 + r.col * RW, 0.5 + r.floor * RH + 0.3, 0); s.add(g);
      const fm = mat(0xfbbf24, { emissive: 0xfbbf24, emissiveIntensity: 0, transparent: true, opacity: 0 }); this.frames[r.id] = fm;
      ([[0, 0.06, RW - 0.3, 0.12], [0, RH - 0.9, RW - 0.3, 0.12], [-RW / 2 + 0.21, RH / 2 - 0.4, 0.12, RH - 0.9], [RW / 2 - 0.21, RH / 2 - 0.4, 0.12, RH - 0.9]] as number[][]).forEach((f) => { const b = new THREE.Mesh(new THREE.BoxGeometry(f[2], f[3], 0.12), fm); b.position.set(f[0], f[1], 0.2); g.add(b); });
      const grip = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.3, RH - 0.3, RD), new THREE.MeshBasicMaterial({ visible: false })); grip.position.set(0, RH / 2 - 0.15, -RD / 2); grip.userData.room = r.id; g.add(grip); this.grips.push(grip);
    });
  }
  reset() { this.fly = null; this.yaw = 0; this.hover = null; }
  drag(dx: number) { if (!this.fly) this.yaw = Math.max(-0.55, Math.min(0.55, this.yaw - dx * 0.003)); }
  private room(e: PointerEvent, rect: DOMRect): RoomId | null {
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.cam);
    const h = this.ray.intersectObjects(this.grips, false)[0];
    return h ? (h.object.userData.room as RoomId) : null;
  }
  point(e: PointerEvent, rect: DOMRect) { if (!this.fly) this.hover = this.room(e, rect); return this.hover; }
  /** a tap: the room under the pointer, and the camera on its way in (done is called as it arrives) */
  enter(e: PointerEvent, rect: DOMRect, done: (id: RoomId) => void): { id: RoomId; name: string; icon: string } | null {
    if (this.fly) return null;
    const id = this.room(e, rect); if (!id) return null;
    const r = ROOMS.find((q) => q.id === id) as Room, cx = -RW * 2 + RW / 2 + r.col * RW, cy = 0.8 + r.floor * RH + RH / 2;
    this.hover = id;
    this.fly = { t: 0, to: new THREE.Vector3(cx, cy, 4.2), look: new THREE.Vector3(cx, cy - 0.3, -RD / 2), done: () => done(id) };
    return { id, name: r.name, icon: r.icon };
  }
  frame(dt: number, aspect: number) {
    this.t += dt;
    const c = this.cam; if (c.aspect !== aspect) { c.aspect = aspect; c.updateProjectionMatrix(); }
    const dist = aspect < 1 ? 27 / aspect * 0.62 : aspect < 1.5 ? 33 : 27;      // a narrow screen stands further back
    const home = new THREE.Vector3(Math.sin(this.yaw) * dist, 5.6 + Math.sin(this.t * 0.4) * 0.15, Math.cos(this.yaw) * dist), homeLook = new THREE.Vector3(0, 5.0, -1);
    if (this.fly) {
      const f = this.fly; f.t = Math.min(1, f.t + dt / 1.3); const k = f.t * f.t * (3 - 2 * f.t);
      this.pos.lerpVectors(home, f.to, k); this.look3.lerpVectors(homeLook, f.look, k);
      if (f.t >= 1) { this.fly = null; f.done(); }
    } else { this.pos.copy(home); this.look3.copy(homeLook); }
    c.position.copy(this.pos); c.lookAt(this.look3);
    Object.keys(this.frames).forEach((id) => { const m = this.frames[id], on = id === this.hover; m.opacity += ((on ? 1 : 0) - m.opacity) * Math.min(1, dt * 10); m.emissiveIntensity = on ? 1.2 + 0.5 * Math.sin(this.t * 6) : 0; });
    workCrew(this.crew, this.t);
  }
}
