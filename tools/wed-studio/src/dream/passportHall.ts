// Minest · 造梦基地 — the Passport Hall: the second room of the base. A rotunda with a pedestal for every knowledge
// card; what the guest has found in the worlds stands there in colour, the rest wait as grey shapes. Stand in the
// middle, drag to turn around, tap a pedestal to read its card. (The passport is the same `dw.passport` 梦工坊 keeps.)
import * as THREE from 'three';

export class PassportHall {
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(58, 1, 0.1, 80);
  private yaw = 0; private pitch = -0.04;
  private stands: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();
  private built = '';
  constructor(private M: any) {
    const s = this.scene; s.background = new THREE.Color(0x1a2340); s.fog = new THREE.Fog(0x1a2340, 14, 40);
    s.add(new THREE.HemisphereLight(0xdbe6ff, 0x4a3a2a, 2.6));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.0); sun.position.set(4, 12, 6); s.add(sun);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshStandardMaterial({ color: 0x6b4a34, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; s.add(floor);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.MeshStandardMaterial({ color: 0x8a1f2d, roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; s.add(rug);
    const star = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.9, 40), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 })); star.rotation.x = -Math.PI / 2; star.position.y = 0.02; s.add(star);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 9, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f4a78, roughness: 0.9, side: THREE.BackSide })); wall.position.y = 4.5; s.add(wall);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 9, 12), new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.7 })); c.position.set(Math.sin(a) * 14.4, 4.5, Math.cos(a) * 14.4); s.add(c); }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1c2550, roughness: 1, side: THREE.BackSide })); dome.position.y = 9; s.add(dome);
    this.cam.position.set(0, 1.65, 0);
  }
  /** set out the pedestals for what the passport holds now */
  refresh(pass: Record<string, number>) {
    const KINDS = this.M.KINDS as Record<string, any>, kinds = Object.keys(KINDS).filter((k) => KINDS[k].fact);
    const sig = kinds.map((k) => (pass[k] ? 1 : 0)).join('');
    if (sig === this.built) return; this.built = sig;
    this.stands.forEach((o) => this.scene.remove(o)); this.stands = [];
    const grey = new THREE.MeshStandardMaterial({ color: 0x3c4660, roughness: 1 }), stone = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.8 }), gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.3 });
    const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3(), inner = Math.min(15, Math.ceil(kinds.length * 0.4));
    kinds.forEach((kind, n) => {
      const ring = n < inner ? 0 : 1, count = ring ? kinds.length - inner : inner, i = ring ? n - inner : n;
      const a = (i + (ring ? 0.5 : 0)) / count * Math.PI * 2, R = ring ? 11.2 : 7.2, K = KINDS[kind], got = !!pass[kind];
      const st = new THREE.Group(); st.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); st.rotation.y = a + Math.PI; st.userData.kind = kind;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, ring ? 1.5 : 0.9, 16), stone); ped.position.y = (ring ? 1.5 : 0.9) / 2; st.add(ped);
      if (got) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.05, 8, 28), gold); r.rotation.x = Math.PI / 2; r.position.y = ring ? 1.5 : 0.9; st.add(r); }
      try {
        const g: THREE.Object3D = this.M.build({ kind, color: K.color, text: K.text });
        g.traverse((o: any) => { if (o.isLight) o.visible = false; if (!got && o.isMesh) o.material = grey; });
        box.setFromObject(g); box.getSize(size); box.getCenter(mid);
        const k = Math.min(1.35 / Math.max(size.x, size.z, 0.01), 1.9 / Math.max(size.y, 0.01), 1.2);
        g.scale.setScalar(k); g.position.set(-mid.x * k, (ring ? 1.5 : 0.9) - box.min.y * k, -mid.z * k); st.add(g);
      } catch (e) { /* a kind that cannot be built here keeps an empty pedestal */ }
      const grip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.6, 1.7), new THREE.MeshBasicMaterial({ visible: false })); grip.position.y = 1.8; st.add(grip);
      this.scene.add(st); this.stands.push(st);
    });
  }
  look(dx: number, dy: number) { this.yaw += dx * 0.005; this.pitch = Math.max(-0.5, Math.min(0.6, this.pitch + dy * 0.004)); }
  frame(aspect: number) {
    if (this.cam.aspect !== aspect) { this.cam.aspect = aspect; this.cam.updateProjectionMatrix(); }
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  /** the kind on the pedestal under the pointer */
  pick(e: PointerEvent, rect: DOMRect): string | null {
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.cam);
    const h = this.ray.intersectObjects(this.stands, true)[0]; if (!h) return null;
    let o: THREE.Object3D | null = h.object; while (o && !o.userData.kind) o = o.parent;
    return o ? (o.userData.kind as string) : null;
  }
}
