// Minest · 造梦基地 — walking in the workshop. Behind the building's doors is the WED studio itself (26 × 22 m, built in
// three/buildImagineerWorkshop.ts): the guest walks its floor in first person, past the drafting boards, the story
// desks, the Audio-Animatronics bench, the machine shop and Walt's office, and up to the model table — where walking
// stops and the hands take over (the table view). The Imagineers at the departments are 梦工坊's own little figures.
import * as THREE from 'three';
import { CrewMember, RoomId, workCrew } from './building';
import type { Flower } from './flowerStreet';

export const PLACES: { id: RoomId; name: string; icon: string; x: number; z: number; r: number }[] = [
  { id: 'drafting', name: '绘图室', icon: '📐', x: -5.2, z: 1.85, r: 1.5 },
  { id: 'kem-weber-desk', name: '故事部', icon: '🎞', x: -7.35, z: -2.55, r: 1.6 },
  { id: 'animatronics-lab', name: '机械角色室', icon: '🤖', x: 6.35, z: -1.75, r: 1.6 },
  { id: 'machine-shop', name: '机械车间', icon: '⚙️', x: 6.35, z: 2.65, r: 1.6 },
  { id: 'walts-office', name: '灵感办公室', icon: '💡', x: -6.95, z: 5.45, r: 1.9 },
  { id: 'blueprint-wall', name: '蓝图墙', icon: '🗺', x: 0.8, z: -5.4, r: 0.4 },
];
const TABLE = { x0: -3.3, x1: 5.0, z0: -3.3, z1: 4.3 };   // the model table with its racks, board and control desk
const EYE = 1.62;

export class StudioWalk {
  on = false;
  private p = { x: 0.85, z: 9.6, yaw: 0, pitch: -0.05 };
  private solid: THREE.Object3D[] = []; private ray = new THREE.Raycaster();
  /** what the guest cannot walk through: the studio's walls and furniture (everything that stands between knee and head) */
  setColliders(roots: THREE.Object3D[]) {
    const box = new THREE.Box3(); this.solid = [];
    roots.forEach((r) => { r.updateMatrixWorld(true); r.traverse((o: any) => {
      if (!o.isMesh || (o.material && (o.material.transparent || o.material.visible === false))) return;
      for (let q: THREE.Object3D | null = o; q; q = q.parent) if (!q.visible) return;
      box.setFromObject(o); if (box.max.y < 0.25 || box.min.y > 1.9) return;
      this.solid.push(o);
    }); });
  }
  private blocked(x: number, z: number, dx: number, dz: number): boolean {
    const l = Math.hypot(dx, dz); if (l < 1e-5 || !this.solid.length) return false;
    this.ray.far = l + 0.42;
    for (const h of [0.45, 1.2]) { this.ray.set(new THREE.Vector3(x, h, z), new THREE.Vector3(dx / l, 0, dz / l)); if (this.ray.intersectObjects(this.solid, false).length) return true; }
    return false;
  }
  private keys: Record<string, boolean> = {}; private joy = { x: 0, y: 0 }; private t = 0;
  private crew: CrewMember[] = [];
  private places = PLACES; private bounds: [number, number, number, number] = [-10.8, 9.9, -5.6, 10.4]; private spots: Record<string, [number, number, number]> | null = null;
  /** walk 1401 Flower Street (flowerStreet.ts) instead of the old one-room studio */
  use(f: Flower) { this.crew = f.crew; this.places = f.places; this.bounds = f.bounds; this.spots = f.spots; this.setColliders([f.root]); }
  constructor() {
    window.addEventListener('keydown', (e) => { if (this.on && !/INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName || '')) { this.keys[e.code] = true; if (/Arrow/.test(e.code)) e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }
  /** the Imagineers, one or two at each department, into the studio's scene */
  staff(scene: THREE.Scene, M: any) {
    if (this.crew.length) return;
    ([[-4.4, 2.9, 'draw', 0x4f6d8f, 2.4], [-6.3, -1.6, 'point', 0x2f7d6b, 2.4], [-8.4, -1.2, 'think', 0xd97706, 1.2], [5.2, -1.0, 'hammer', 0x38bdf8, -1.2], [7.4, -0.6, 'think', 0xec4899, -2.0],
      [5.3, 3.5, 'hammer', 0xd97706, -1.2], [7.6, 4.0, 'carry', 0x4f7a3d, 0], [-5.4, 6.6, 'wave', 0xb3202a, 2.0], [-1.2, 7.4, 'walk', 0x1f4f9a, 0], [2.6, -4.6, 'point', 0x6d28d9, Math.PI]] as [number, number, string, number, number][]).forEach(([x, z, what, coat, ry], i) => {
      const f: THREE.Object3D = M.figure({ height: 1.72, coat: '#' + coat.toString(16).padStart(6, '0'), hair: i % 2 ? '#3a2a20' : '#191514', shirt: '#f2efe6', skin: i % 3 ? '#e2b48c' : '#c98f62' });
      f.position.set(x, 0.02, z); f.rotation.y = ry; scene.add(f); this.crew.push({ g: f, rig: f.userData.rig, what, x0: x, seed: i * 1.7 });
    });
  }
  /** stand at the studio door, or in front of a department, facing it */
  place(at: RoomId | 'door' | 'table') {
    this.keys = {}; this.joy.x = this.joy.y = 0;
    const sp = this.spots && this.spots[at];
    if (sp) { this.p = { x: sp[0], z: sp[1], yaw: sp[2], pitch: -0.04 }; return; }
    if (at === 'door') { this.p = { x: 0.85, z: 9.6, yaw: 0, pitch: -0.05 }; return; }   /* in from the front of the studio, the model table straight ahead */
    if (at === 'table') { this.p = { x: 0.85, z: 6.6, yaw: 0, pitch: -0.12 }; return; }
    const d = PLACES.find((q) => q.id === at); if (!d) return;
    const cx = 0.85, cz = 2.2, dx = cx - d.x, dz = cz - d.z, l = Math.hypot(dx, dz) || 1, x = d.x + dx / l * (d.r + 1.5), z = d.z + dz / l * (d.r + 1.5);
    this.p = { x, z, yaw: Math.atan2(-(d.x - x), -(d.z - z)), pitch: -0.08 };
  }
  look(dx: number, dy: number) { this.p.yaw -= dx * 0.005; this.p.pitch = Math.max(-0.8, Math.min(0.7, this.p.pitch - dy * 0.004)); }
  setJoy(x: number, y: number) { this.joy.x = x; this.joy.y = y; }
  /** one frame of walking; tells what the guest is near, and whether they have walked up to the model table */
  frame(dt: number, cam: THREE.PerspectiveCamera): { near: RoomId | null; table: boolean } {
    this.t += dt; workCrew(this.crew, this.t);
    if (!this.on) return { near: null, table: false };
    const p = this.p, k = this.keys; let mx = this.joy.x, my = this.joy.y;
    if (k.KeyW || k.ArrowUp) my = 1; if (k.KeyS || k.ArrowDown) my = -1; if (k.KeyA) mx = -1; if (k.KeyD) mx = 1;
    if (k.ArrowLeft) p.yaw += dt * 1.9; if (k.ArrowRight) p.yaw -= dt * 1.9;
    const sp = (k.ShiftLeft || k.ShiftRight ? 5.5 : 3.0) * dt, fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let nx = p.x + (fx * my - fz * mx) * sp, nz = p.z + (fz * my + fx * mx) * sp, table = false;
    nx = Math.max(this.bounds[0], Math.min(this.bounds[1], nx)); nz = Math.max(this.bounds[2], Math.min(this.bounds[3], nz));
    if (this.blocked(p.x, p.z, nx - p.x, 0)) nx = p.x;     // walls and furniture stop the guest; along them the guest slides
    if (this.blocked(nx, p.z, 0, nz - p.z)) nz = p.z;
    if (nx > TABLE.x0 && nx < TABLE.x1 && nz > TABLE.z0 && nz < TABLE.z1) { table = !!(mx || my); nx = p.x; nz = p.z; }                                             // up against the table
    p.x = nx; p.z = nz;
    cam.position.set(p.x, EYE + ((mx || my) ? Math.sin(this.t * 9) * 0.03 : 0), p.z); cam.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
    let near: RoomId | null = null, best = 2.6;
    this.places.forEach((d) => { const l = Math.hypot(p.x - d.x, p.z - d.z) - d.r; if (l < best) { best = l; near = d.id; } });
    return { near, table };
  }
}
