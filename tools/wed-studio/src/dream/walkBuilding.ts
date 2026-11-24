// Minest · 造梦基地 — the Minest Imagineer Building, to walk into. The guest stands on the plaza in front of the doors;
// the doors open as they come near; inside, a corridor runs the length of the building with the eight rooms open on
// both sides, their Imagineers at work. Walk into a room (or tap it) to go in. The picture at the far end of the
// corridor is the doll's-house view of the whole building (building.ts), which stays as the overview.
import * as THREE from 'three';
import { CrewMember, ROOMS, RD, RH, RW, RoomId, roomBay, workCrew } from './building';

const LEFT: RoomId[] = ['model-table', 'kem-weber-desk', 'drafting', 'blueprint-wall'], RIGHT: RoomId[] = ['walts-office', 'animatronics-lab', 'machine-shop', 'hall'];
const HALF = 3.0, Z0 = -1.2, LEN = RW * 4, EYE = 1.6;      // the corridor: half its width, where the rooms begin, how far they run
function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const mat = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

export class WalkBuilding {
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(62, 1, 0.1, 160);
  private crew: CrewMember[] = [];
  private grips: THREE.Mesh[] = [];
  private leaves: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();
  private p = { x: 0, z: 10, yaw: 0, pitch: 0 };
  private joy = { x: 0, y: 0 }; private keys: Record<string, boolean> = {};
  private t = 0; private walkTo: { x: number; z: number; then: RoomId | 'overview' } | null = null;
  active = false;

  constructor(M: any) {
    const s = this.scene; s.background = new THREE.Color(0x8fcbf5); s.fog = new THREE.Fog(0x8fcbf5, 50, 130);
    s.add(new THREE.HemisphereLight(0xffffff, 0x9a8a70, 2.3));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.9); sun.position.set(8, 20, 16); s.add(sun);
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); s.add(o); return o; };
    const cream = mat(0xf2e6cf), trim = mat(0xb23a2e), gold = mat(0xfbbf24, { metalness: 0.5, roughness: 0.35 });
    const grass = add(new THREE.CircleGeometry(90, 48), mat(0x7fb86a), 0, 0, 0); grass.rotation.x = -Math.PI / 2;
    const path = add(new THREE.PlaneGeometry(7, 16), mat(0xd9cbb0), 0, 0.02, 8); path.rotation.x = -Math.PI / 2;
    const BW = (HALF + RD) * 2 + 0.6, zEnd = Z0 - LEN - 0.3, H = RH + 0.3;
    // the front: two walls beside the doors, the lintel over them, the cornice and the name
    const side = (BW - 2.6) / 2;
    [-1, 1].forEach((d) => add(new THREE.BoxGeometry(side, H, 0.4), cream, d * (1.3 + side / 2), H / 2, 0));
    add(new THREE.BoxGeometry(2.6, H - 3.3, 0.4), cream, 0, 3.3 + (H - 3.3) / 2, 0);
    add(new THREE.BoxGeometry(BW + 1.2, 0.5, 1.2), trim, 0, H + 0.25, 0.1);
    add(new THREE.PlaneGeometry(12, 2.1), new THREE.MeshBasicMaterial({ map: tex(1024, 180, (c, w, h) => {
      c.fillStyle = '#1e2a4a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 84px Georgia, serif'; c.fillText('MINEST IMAGINEER', w / 2, 72);
      c.fillStyle = '#fff'; c.font = '700 40px "PingFang SC", sans-serif'; c.fillText('✨ 造 梦 大 楼 ✨', w / 2, 140);
    }) }), 0, H + 1.7, 0.4);
    [-4.2, 4.2].forEach((x) => { add(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }), x, 2.5, 0.22); add(new THREE.BoxGeometry(2.5, 0.14, 0.3), trim, x, 1.55, 0.25); });
    [-1, 1].forEach((d) => {   // the two door leaves, hinged at the jambs
      const hinge = new THREE.Group(); hinge.position.set(d * 1.3, 0, 0.05); s.add(hinge);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.3, 0.1), mat(0x2f6b5a)); leaf.position.set(-d * 0.65, 1.65, 0); hinge.add(leaf);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), gold); knob.position.set(-d * 1.1, 1.5, 0.1); hinge.add(knob);
      hinge.userData.dir = d; this.leaves.push(hinge);
    });
    const dark = add(new THREE.PlaneGeometry(2.6, 3.3), new THREE.MeshBasicMaterial({ color: 0x2a1c12 }), 0, 1.65, -0.3); void dark;   // what is behind the doors is the studio, not this shell
    // the shell: the outer walls, the back, the roof (its underside is the ceiling)
    [-1, 1].forEach((d) => add(new THREE.BoxGeometry(0.4, H, -zEnd), cream, d * (BW / 2 - 0.2), H / 2, zEnd / 2));
    add(new THREE.BoxGeometry(BW, H, 0.4), cream, 0, H / 2, zEnd);
    add(new THREE.BoxGeometry(BW + 0.8, 0.4, -zEnd + 0.8), mat(0xe9dcc2), 0, H + 0.2, zEnd / 2);
    const fl = add(new THREE.PlaneGeometry(HALF * 2, -zEnd), mat(0xb08a5f), 0, 0.02, zEnd / 2); fl.rotation.x = -Math.PI / 2;
    const rug = add(new THREE.PlaneGeometry(2.2, -zEnd - 1), mat(0x8a1f2d, { roughness: 1 }), 0, 0.03, zEnd / 2); rug.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.25, 12, 10), mat(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 1.8 }), 0, H - 0.45, Z0 - RW / 2 - i * RW);
    // the rooms along both sides, open to the corridor
    [LEFT, RIGHT].forEach((ids, sd) => ids.forEach((id, i) => {
      const r = ROOMS.find((q) => q.id === id)!, d = sd ? 1 : -1, z = Z0 - RW / 2 - i * RW;
      const bay = roomBay(M, r, this.crew); bay.position.set(d * HALF, 0.02, z); bay.rotation.y = -d * Math.PI / 2; s.add(bay);
      add(new THREE.BoxGeometry(RD, H, 0.25), cream, d * (HALF + RD / 2), H / 2, z + RW / 2);
      if (i === 3) add(new THREE.BoxGeometry(RD, H, 0.25), cream, d * (HALF + RD / 2), H / 2, z - RW / 2);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(RD, RH, RW - 0.4), new THREE.MeshBasicMaterial({ visible: false })); grip.position.set(d * (HALF + RD / 2), RH / 2, z); grip.userData.room = id; s.add(grip); this.grips.push(grip);
    }));
    // at the far end: the picture of the whole building — the overview
    const pic = add(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: tex(420, 260, (c, w, h) => {
      c.fillStyle = '#8fcbf5'; c.fillRect(0, 0, w, h); c.fillStyle = '#7fb86a'; c.fillRect(0, h - 50, w, 50);
      c.fillStyle = '#f2e6cf'; c.fillRect(60, 70, 300, 150); c.fillStyle = '#b23a2e'; c.fillRect(50, 58, 320, 16);
      ['#8a5a44', '#5a6f94', '#6a8a6e', '#1e4a94', '#2f4a78', '#9a6b3f', '#6b5a8a', '#70645a'].forEach((col, i) => { c.fillStyle = col; c.fillRect(68 + (i % 4) * 73, 80 + Math.floor(i / 4) * 70, 65, 60); });
      c.strokeStyle = '#d9b25a'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
    }) }), 0, 2.3, zEnd + 0.25);
    pic.userData.room = 'overview'; this.grips.push(pic);
    ([[-9, 6], [9, 5], [-12, 12], [12.5, 11], [-6.5, 13]] as [number, number][]).forEach(([x, z], i) => { try { const t = M.build({ kind: 'tree', color: i % 2 ? '#5f9a4a' : '#4f7a3d' }); t.scale.setScalar(1.2 + (i % 3) * 0.25); t.position.set(x, 0, z); s.add(t); } catch (e) { /* no trees */ } });
    window.addEventListener('keydown', (e) => { if (this.active && !/INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName || '')) { this.keys[e.code] = true; if (/Arrow/.test(e.code)) e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }
  private bayZ(id: RoomId) { const i = LEFT.indexOf(id) >= 0 ? LEFT.indexOf(id) : RIGHT.indexOf(id); return Z0 - RW / 2 - i * RW; }
  /** on the plaza before the doors — or, coming back out of a room, in the corridor in front of it */
  reset(from: RoomId | null) {
    this.walkTo = null; this.joy.x = this.joy.y = 0; this.keys = {};
    if (!from) { this.p = { x: 0, z: 10, yaw: 0, pitch: 0 }; return; }
    const left = LEFT.indexOf(from) >= 0;
    this.p = { x: left ? -0.8 : 0.8, z: this.bayZ(from), yaw: left ? Math.PI / 2 : -Math.PI / 2, pitch: 0 };
  }
  look(dx: number, dy: number) { this.p.yaw -= dx * 0.005; this.p.pitch = Math.max(-0.7, Math.min(0.7, this.p.pitch - dy * 0.004)); }
  setJoy(x: number, y: number) { this.joy.x = x; this.joy.y = y; }
  /** a tap: the guest walks up to the doors and in */
  tap(_e: PointerEvent, _rect: DOMRect): { id: RoomId | 'overview'; name: string; icon: string } | null {
    this.walkTo = { x: 0, z: 0.1, then: 'model-table' };
    return { id: 'model-table', name: '走进大门', icon: '🚪' };
  }
  private tapCorridor(e: PointerEvent, rect: DOMRect): { id: RoomId | 'overview'; name: string; icon: string } | null {
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.cam);
    const h = this.ray.intersectObjects(this.grips, false)[0]; if (!h) return null;
    const id = h.object.userData.room as RoomId | 'overview';
    if (id === 'overview') { this.walkTo = { x: 0, z: Z0 - LEN + 1.5, then: id }; return { id, name: '大楼一览', icon: '🏢' }; }
    const r = ROOMS.find((q) => q.id === id)!, left = LEFT.indexOf(id) >= 0;
    this.walkTo = { x: (left ? -1 : 1) * (HALF + 1.6), z: this.bayZ(id), then: id };
    return { id, name: r.name, icon: r.icon };
  }
  /** one frame; returns the room the guest has just walked into (or 'overview'), if any */
  frame(dt: number, aspect: number): RoomId | 'overview' | 'inside' | null {
    this.t += dt; const p = this.p, c = this.cam;
    if (c.aspect !== aspect) { c.aspect = aspect; c.updateProjectionMatrix(); }
    let mx = this.joy.x, my = this.joy.y; const k = this.keys;
    if (k.KeyW || k.ArrowUp) my = 1; if (k.KeyS || k.ArrowDown) my = -1; if (k.KeyA) mx = -1; if (k.KeyD) mx = 1;
    if (k.ArrowLeft) p.yaw += dt * 1.9; if (k.ArrowRight) p.yaw -= dt * 1.9;
    if (mx || my) this.walkTo = null;
    let nx = p.x, nz = p.z; const sp = 3.4 * dt;
    if (this.walkTo) {   // walking to what was tapped: through the doors first, then along the corridor, then across
      const w = this.walkTo, via = p.z > 0.6 ? { x: 0, z: -0.6 } : Math.abs(p.z - w.z) > 0.25 ? { x: Math.abs(p.x) > 1 ? 0 : p.x, z: Math.abs(p.x) > 1.2 ? p.z : w.z } : { x: w.x, z: w.z };
      const dx = via.x - p.x, dz = via.z - p.z, d = Math.hypot(dx, dz);
      if (d > 0.05) { nx += dx / d * Math.min(sp, d); nz += dz / d * Math.min(sp, d); const want = Math.atan2(-dx, -dz); p.yaw += Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw)) * Math.min(1, dt * 4); p.pitch *= 1 - Math.min(1, dt * 3); }
      if (w.then === 'overview' && Math.hypot(w.x - nx, w.z - nz) < 0.2) { this.walkTo = null; return 'overview'; }
    } else {
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      nx += (fx * my - fz * mx) * sp; nz += (fz * my + fx * mx) * sp;
    }
    // where a guest can stand: the plaza, the doorway, the corridor — and a step into any room
    if (nz > 0.5) { nx = Math.max(-13, Math.min(13, nx)); nz = Math.min(15, nz); if (Math.abs(nx) > 0.95 && nz < 0.9) nz = 0.9; }
    else if (nz > Z0 + 0.2) nx = Math.max(-0.95 - (0.5 - nz) * 1.2, Math.min(0.95 + (0.5 - nz) * 1.2, nx));
    else { nz = Math.max(Z0 - LEN + 0.9, nz); nx = Math.max(-HALF - 2.0, Math.min(HALF + 2.0, nx)); }
    p.x = nx; p.z = nz;
    if (p.z < 0.45) { this.walkTo = null; p.z = 1.2; return 'inside'; }   /* through the doors: the workshop itself is the studio (App.tsx) */
    const moving = !!(mx || my || this.walkTo);
    c.position.set(p.x, EYE + (moving ? Math.sin(this.t * 9) * 0.035 : 0), p.z);
    c.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
    const open = Math.max(0, Math.min(1, (7 - p.z) / 3.5));
    this.leaves.forEach((h) => { const to = -h.userData.dir * open * 1.75; h.rotation.y += (to - h.rotation.y) * Math.min(1, dt * 5); });
    workCrew(this.crew, this.t);
    if (p.z < Z0 && Math.abs(p.x) > HALF + 1.3) {   // over a room's threshold: in
      const ids = p.x < 0 ? LEFT : RIGHT, i = Math.max(0, Math.min(3, Math.floor((Z0 - p.z) / RW)));
      this.walkTo = null; return ids[i];
    }
    return null;
  }
}
