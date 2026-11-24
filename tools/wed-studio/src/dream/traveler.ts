// Minest · 造梦基地 — the traveller, the same figure as in the park (theme-park-island/tp-world/sw-savi.js: traveler):
// boots, trousers, a tunic and vest, a belt with its pouch, a scarf, goggles pushed up, a pack with a bedroll.
import * as THREE from 'three';

export interface Look { tunic?: number; vest?: number; trousers?: number; skin?: number; hair?: number; scarf?: number; pack?: number; long?: boolean }
export function buildTraveler(o: Look = {}): THREE.Group {
  const g = new THREE.Group(), rig: any = {}, L = (c: number, side = false) => new THREE.MeshLambertMaterial({ color: c, side: side ? THREE.DoubleSide : THREE.FrontSide });
  const add = (p: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const q = new THREE.Mesh(geo, m); q.position.set(x, y, z); p.add(q); return q; };
  const tc = o.tunic ?? 0xd9c8a0, tunic = L(tc), dark = L(new THREE.Color(tc).multiplyScalar(0.8).getHex()), vest = L(o.vest ?? 0x6b4a2a), trs = L(o.trousers ?? 0x3b3f4a), boot = L(0x2a1c12), leather = L(0x4a3220), skin = L(o.skin ?? 0xe2b48c), hair = L(o.hair ?? 0x3a2a20, true), scarf = L(o.scarf ?? 0x2f8f8a), pack = L(o.pack ?? 0x7a5a3a), gold = new THREE.MeshPhongMaterial({ color: 0xc9a24a, shininess: 60 });
  [-1, 1].forEach((s) => { const hip = new THREE.Group(); hip.position.set(s * 0.11, 0.84, 0); g.add(hip); add(hip, new THREE.BoxGeometry(0.16, 0.62, 0.18), trs, 0, -0.31, 0); add(hip, new THREE.BoxGeometry(0.18, 0.24, 0.3), boot, 0, -0.72, 0.04); add(hip, new THREE.BoxGeometry(0.19, 0.05, 0.31), leather, 0, -0.6, 0.04); rig[s < 0 ? 'legL' : 'legR'] = hip; });
  const body = new THREE.Group(); g.add(body); rig.body = body;
  add(body, new THREE.BoxGeometry(0.44, 0.58, 0.26), tunic, 0, 1.15, 0); add(body, new THREE.BoxGeometry(0.47, 0.18, 0.29), tunic, 0, 0.82, 0); [-0.15, 0.15].forEach((x) => add(body, new THREE.BoxGeometry(0.16, 0.5, 0.29), vest, x, 1.17, 0)); add(body, new THREE.BoxGeometry(0.46, 0.5, 0.04), vest, 0, 1.17, -0.13);
  add(body, new THREE.BoxGeometry(0.48, 0.07, 0.3), leather, 0, 0.91, 0); add(body, new THREE.BoxGeometry(0.08, 0.07, 0.02), gold, 0, 0.91, 0.16); add(body, new THREE.BoxGeometry(0.12, 0.15, 0.08), leather, 0.2, 0.83, 0.13); add(body, new THREE.BoxGeometry(0.05, 0.72, 0.02), leather, 0.02, 1.18, 0.15).rotation.z = 0.6;
  add(body, new THREE.TorusGeometry(0.15, 0.05, 6, 16), scarf, 0, 1.46, 0.01).rotation.x = Math.PI / 2; add(body, new THREE.BoxGeometry(0.1, 0.3, 0.04), scarf, 0.1, 1.3, 0.15);
  add(body, new THREE.BoxGeometry(0.34, 0.44, 0.17), pack, 0, 1.18, -0.23); add(body, new THREE.BoxGeometry(0.36, 0.14, 0.19), leather, 0, 1.36, -0.23); add(body, new THREE.CylinderGeometry(0.08, 0.08, 0.42, 10), scarf, 0, 1.49, -0.23).rotation.z = Math.PI / 2; [-0.12, 0.12].forEach((x) => add(body, new THREE.BoxGeometry(0.04, 0.5, 0.3), leather, x, 1.2, -0.02));
  [-1, 1].forEach((s) => { const sh = new THREE.Group(); sh.position.set(s * 0.29, 1.4, 0); body.add(sh); add(sh, new THREE.BoxGeometry(0.12, 0.34, 0.14), tunic, 0, -0.17, 0); add(sh, new THREE.BoxGeometry(0.11, 0.28, 0.13), dark, 0, -0.47, 0); add(sh, new THREE.BoxGeometry(0.12, 0.12, 0.13), leather, 0, -0.66, 0); rig[s < 0 ? 'armL' : 'armR'] = sh; });
  const hd = new THREE.Group(); hd.position.y = 1.56; body.add(hd); rig.head = hd;
  add(hd, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skin); add(hd, new THREE.SphereGeometry(0.16, 16, 12), skin, 0, 0.17, 0).scale.set(1, 1.05, 0.95);
  add(hd, new THREE.SphereGeometry(0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, 0, 0.19, -0.01).rotation.x = -0.28; if (o.long) add(hd, new THREE.BoxGeometry(0.3, 0.26, 0.08), hair, 0, 0.08, -0.13);
  [-1, 1].forEach((s) => { add(hd, new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: 0x1a1410 }), s * 0.06, 0.19, 0.145); add(hd, new THREE.BoxGeometry(0.055, 0.012, 0.02), hair, s * 0.06, 0.235, 0.148); add(hd, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), gold, s * 0.06, 0.31, 0.12).rotation.x = Math.PI / 2 - 0.5; });
  add(hd, new THREE.ConeGeometry(0.024, 0.06, 6), skin, 0, 0.16, 0.165).rotation.x = Math.PI / 2; add(hd, new THREE.BoxGeometry(0.06, 0.012, 0.02), L(0x9a4a3a), 0, 0.1, 0.15); add(hd, new THREE.TorusGeometry(0.165, 0.014, 4, 18), leather, 0, 0.29, 0).rotation.x = Math.PI / 2 - 0.12;
  g.userData = { rig, ph: 0 }; return g;
}
/** walking: legs and arms swing in step with the ground covered; standing: a breath */
export function animateTraveler(av: THREE.Object3D, dt: number, speed: number, clock: number) {
  const u = av.userData as any, r = u.rig, amp = Math.min(1, speed / 3); u.ph += speed * dt * 3.3; const sw = Math.sin(u.ph) * amp * 0.75;
  r.legL.rotation.x = sw; r.legR.rotation.x = -sw; r.body.position.y = Math.abs(Math.cos(u.ph)) * 0.03 * amp + Math.sin(clock * 1.7) * 0.004; r.armL.rotation.x = -sw * 0.8; r.armR.rotation.x = sw * 0.8;
}
