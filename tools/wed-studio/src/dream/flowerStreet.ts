// Minest · 造梦基地 — 1401 Flower Street, to walk through. The inside of the building, laid out after what visitors and
// Imagineers have described in public of WED / Walt Disney Imagineering's Glendale headquarters (see the README for the
// sources): the lobby, the Monorail Hallway with its windows and the timeline of the company, the Model Shop (a large
// room with a two-storey ceiling, its models on 4 ft tables, the carpentry shop beside it), the Blaine Gibson Sculpture
// Studio (glass cabinets of maquettes and heads; Snow White and the seven dwarfs), the Show Designers' studio, the
// sound studio, the library with its vault of concept art, and MAPO, where the Audio-Animatronics figures are made.
// It is a likeness in boxes and cylinders, not a survey: the rooms and what is in them are real, the plan is ours.
// The Model Shop's big table stands where 梦工坊's engine draws the miniature (dreamHost.ts, TABLE_POS).
import * as THREE from 'three';
import type { CrewMember, RoomId } from './building';
import { paint, Scene } from './wallArt';

export interface Place { id: RoomId; name: string; icon: string; x: number; z: number; r: number }
export interface Flower { scene: THREE.Scene; root: THREE.Group; crew: CrewMember[]; places: Place[]; bounds: [number, number, number, number]; door: [number, number]; spots: Record<string, [number, number, number]> }

const X0 = -21, X1 = 23, ZN = -8, ZS = 9.5, HZ = 13, ZF = 20.5, XW = -9, XE = 11, H = 3.7, HM = 7.6;   // walls: west, east, north, the hallway's two sides, the front; the Model Shop's two sides; ceilings
function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const mats = new Map<string, THREE.MeshStandardMaterial>();
const M = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => { const k = c + JSON.stringify(o); let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o }); mats.set(k, m); } return m; };

export function buildFlowerStreet(DM: any): Flower {
  const scene = new THREE.Scene(), root = new THREE.Group(), crew: CrewMember[] = []; scene.add(root);
  scene.background = new THREE.Color(0x10151f);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2.3));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.5); sun.position.set(6, 20, 10); scene.add(sun);
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; root.add(o); return o; };
  const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); root.add(o); return o; };
  const sph = (r: number, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); o.position.set(x, y, z); root.add(o); return o; };
  const flat = (w: number, d: number, m: THREE.Material, x: number, y: number, z: number, up = true) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; o.position.set(x, y, z); root.add(o); return o; };
  /** a picture on a wall: facing +z (ry 0), −z (π), +x (π/2) or −x (−π/2) */
  const pic = (w: number, h: number, x: number, y: number, z: number, ry: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, pw = 384) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(pw, Math.round(pw * h / w), draw) })); o.position.set(x, y, z); o.rotation.y = ry; root.add(o); return o; };
  const cream = M(0xe9e2d3), wain = M(0x6b4a34), grey = M(0xb9bcc0);
  // walls with doorways: along x at one z, or along z at one x; over each doorway a lintel
  const trimM = M(0x5a3d28), base = M(0x4a3526);
  const wallX = (z: number, x0: number, x1: number, gaps: [number, number][], h = H, m: THREE.Material = cream) => {
    gaps.forEach(([g0, g1]) => { [g0 - 0.07, g1 + 0.07].forEach((x) => box(0.16, 2.78, 0.37, trimM, x, 1.39, z)); box(g1 - g0 + 0.3, 0.16, 0.37, trimM, (g0 + g1) / 2, 2.78, z); });
    let a = x0; [...gaps, [x1, x1] as [number, number]].forEach(([g0, g1]) => { if (g0 > a) { box(g0 - a, h, 0.25, m, (a + g0) / 2, h / 2, z); box(g0 - a, 0.16, 0.31, base, (a + g0) / 2, 0.08, z); } if (g1 > g0) box(g1 - g0, h - 2.7, 0.25, m, (g0 + g1) / 2, 2.7 + (h - 2.7) / 2, z); a = g1; });
  };
  const wallZ = (x: number, z0: number, z1: number, gaps: [number, number][], h = H, m: THREE.Material = cream) => {
    gaps.forEach(([g0, g1]) => { [g0 - 0.07, g1 + 0.07].forEach((z) => box(0.37, 2.78, 0.16, trimM, x, 1.39, z)); box(0.37, 0.16, g1 - g0 + 0.3, trimM, x, 2.78, (g0 + g1) / 2); });
    let a = z0; [...gaps, [z1, z1] as [number, number]].forEach(([g0, g1]) => { if (g0 > a) { box(0.25, h, g0 - a, m, x, h / 2, (a + g0) / 2); box(0.31, 0.16, g0 - a, base, x, 0.08, (a + g0) / 2); } if (g1 > g0) box(0.25, h - 2.7, g1 - g0, m, x, 2.7 + (h - 2.7) / 2, (g0 + g1) / 2); a = g1; });
  };
  const sign = (icon: string, name: string, en: string, x: number, y: number, z: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, map: tex(384, 128, (c) => {
      c.fillStyle = '#3f2716'; c.beginPath(); c.roundRect(4, 4, 376, 120, 22); c.fill(); c.strokeStyle = '#d9b25a'; c.lineWidth = 6; c.beginPath(); c.roundRect(8, 8, 368, 112, 18); c.stroke();
      c.font = '56px sans-serif'; c.textBaseline = 'middle'; c.fillText(icon, 26, 62); c.fillStyle = '#fde68a'; c.font = '700 38px "PingFang SC", sans-serif'; c.fillText(name, 104, 48);
      c.fillStyle = '#d9b25a'; c.font = '600 19px sans-serif'; c.fillText(en, 106, 92);
    }) })); sp.scale.set(1.7, 0.57, 1); sp.position.set(x, y, z); root.add(sp);
  };
  /** a painting in a gilt frame, on a wall: facing +z (ry 0), −z (π), +x (π/2) or −x (−π/2) */
  const framed = (scene: Scene, w: number, h: number, x: number, y: number, z: number, ry: number, dark = false) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; root.add(g);
    const fr = M(dark ? 0x3f2716 : 0xc9a24a, dark ? {} : { metalness: 0.55, roughness: 0.35 }), t = 0.09;
    ([[0, h / 2 + t / 2, w + t * 2, t], [0, -h / 2 - t / 2, w + t * 2, t], [-w / 2 - t / 2, 0, t, h], [w / 2 + t / 2, 0, t, h]] as number[][]).forEach(([px, py, bw, bh]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.08), fr); b.position.set(px, py, 0.02); g.add(b); });
    const cv = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(512, Math.round(512 * h / w), (c, cw, ch) => paint(scene, c, cw, ch)) })); cv.position.z = 0.03; g.add(cv);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.05, 0.12), M(0xd9b25a, { metalness: 0.6, roughness: 0.3 })); lamp.position.set(0, h / 2 + 0.22, 0.14); g.add(lamp);   // the picture light
    return g;
  };
  // the Imagineers: each a little different — hair, a cap or glasses, an apron in the shops, and the tool of their trade in hand
  const HAIR = ['#191514', '#3a2a20', '#6b4a2a', '#c9a24a', '#8a8a8a', '#5a2a1a'], SKIN = ['#e2b48c', '#c98f62', '#f0c8a0', '#8a5a3a'];
  const person = (x: number, z: number, what: string, coat: number, ry = 0, height = 0) => {
    const n = crew.length, hair = HAIR[n % 6], hh = height || 1.6 + ((n * 37) % 5) * 0.045;
    const f: THREE.Object3D = DM.figure({ height: hh, coat: '#' + coat.toString(16).padStart(6, '0'), hair, shirt: '#f2efe6', skin: SKIN[n % 4], legs: ['#2f3542', '#3b3b44', '#4a3f35', '#26262c'][n % 4] });
    const r = f.userData.rig, k = r.k, add = (to: THREE.Object3D, w: number, h: number, d: number, col: number, px: number, py: number, pz: number) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * k, h * k, d * k), M(col)); b.position.set(px * k, py * k, pz * k); to.add(b); return b; };
    const hc = parseInt(hair.slice(1), 16);
    if (n % 3 === 1) { add(r.head, 0.27, 0.3, 0.07, hc, 0, 0.2, -0.13); add(r.head, 0.05, 0.26, 0.22, hc, -0.13, 0.19, -0.02); add(r.head, 0.05, 0.26, 0.22, hc, 0.13, 0.19, -0.02); }     // longer hair
    else if (n % 3 === 2) { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075 * k, 10, 8), M(hc)); bun.position.set(0, 0.42 * k, -0.07 * k); r.head.add(bun); }                 // a bun
    if (n % 4 === 0) { add(r.head, 0.27, 0.035, 0.012, 0x15151a, 0, 0.262, 0.128); add(r.head, 0.09, 0.07, 0.012, 0xbfe6ff, -0.062, 0.262, 0.13); add(r.head, 0.09, 0.07, 0.012, 0xbfe6ff, 0.062, 0.262, 0.13); }   // glasses
    if (n % 5 === 3) { add(r.head, 0.28, 0.07, 0.28, coat, 0, 0.405, 0); add(r.head, 0.24, 0.02, 0.14, coat, 0, 0.375, 0.2); }                                                          // a cap
    if (what === 'hammer' || what === 'carry') { add(r.spine, 0.4, 0.62, 0.02, 0xe8dcc0, 0, 0.14, 0.14); add(r.spine, 0.2, 0.2, 0.02, 0xd9cdb0, 0, 0.06, 0.155); }                       // a shop apron
    const hand = (w: number, h: number, d: number, col: number, py: number, pz = 0) => add(r.armR, w, h, d, col, 0, py, pz);
    if (what === 'hammer') { hand(0.035, 0.34, 0.035, 0x8a5a35, -0.78); hand(0.07, 0.07, 0.16, 0x9aa3ad, -0.94); }
    else if (what === 'draw') { hand(0.02, 0.22, 0.02, 0xfbbf24, -0.74); }
    else if (what === 'point') { hand(0.02, 0.5, 0.02, 0x5a3d28, -0.86); }
    else if (what === 'carry') { add(r.spine, 0.5, 0.34, 0.3, 0xc9a36b, 0, 0.08, 0.36); }
    else if (what === 'think') { add(r.armL, 0.22, 0.3, 0.02, 0xf5f1e8, 0, -0.56, 0.1); }
    f.position.set(x, 0.01, z); f.rotation.y = ry; root.add(f); crew.push({ g: f, rig: r, what, x0: x, seed: n * 1.7 }); return f;
  };
  const plant = (x: number, z: number, s = 1) => { cyl(0.26 * s, 0.2 * s, 0.5 * s, M(0x9c4a2f), x, 0.25 * s, z, 12); for (let i = 0; i < 7; i++) { const a = i * 0.9, l = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 8, 6), M(i % 2 ? 0x2f8f55 : 0x3aa863)); l.scale.set(0.5, 1.6, 0.5); l.position.set(x + Math.cos(a) * 0.14 * s, (0.75 + (i % 3) * 0.18) * s, z + Math.sin(a) * 0.14 * s); l.rotation.set(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5); root.add(l); } };
  const stool = (x: number, z: number) => { cyl(0.2, 0.2, 0.05, M(0x8a5a35), x, 0.62, z, 12); [0, 2.1, 4.2].forEach((a) => cyl(0.02, 0.02, 0.62, M(0x3a3a40), x + Math.cos(a) * 0.13, 0.31, z + Math.sin(a) * 0.13, 6)); };
  const prop = (kind: string, x: number, z: number, size: number, ry = 0, y = 0) => {
    try {
      const K = DM.KINDS[kind], p: THREE.Object3D = DM.build({ kind, color: K.color, text: K.text }); p.traverse((o: any) => { if (o.isLight) o.visible = false; });
      const b = new THREE.Box3().setFromObject(p), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), k = size / Math.max(s.x, s.z, 0.01);
      const h = new THREE.Group(); p.scale.setScalar(k); p.position.set(-c.x * k, -b.min.y * k, -c.z * k); h.add(p); h.position.set(x, y, z); h.rotation.y = ry; root.add(h);
    } catch (e) { /* left out */ }
  };
  const table = (x: number, z: number, w: number, d: number, h = 0.9, m: THREE.Material = M(0x7b5434)) => { box(w, 0.08, d, m, x, h, z); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.09, h, 0.09, m, x + a * (w / 2 - 0.1), h / 2, z + b * (d / 2 - 0.1))); };

  // ---------------------------------------------------------------- the shell
  flat(X1 - X0, ZF - ZN, M(0x8c7358), (X0 + X1) / 2, 0, (ZN + ZF) / 2);                                  // the floor
  flat(XE - XW, ZS - ZN, M(0x6f7a80, { roughness: 0.95 }), (XW + XE) / 2, 0.005, (ZN + ZS) / 2);          // the Model Shop's shop floor
  flat(X1 - X0, HZ - ZS, M(0x39506b), (X0 + X1) / 2, 0.006, (ZS + HZ) / 2);                               // the hallway's carpet
  const ceil = M(0xf4efe4);
  flat(XW - X0, ZS - ZN, ceil, (X0 + XW) / 2, H, (ZN + ZS) / 2, false); flat(X1 - XE, ZS - ZN, ceil, (XE + X1) / 2, H, (ZN + ZS) / 2, false);
  flat(X1 - X0, ZF - ZS, ceil, (X0 + X1) / 2, H, (ZS + ZF) / 2, false); flat(XE - XW, ZS - ZN, M(0xdfe6ea), (XW + XE) / 2, HM, (ZN + ZS) / 2, false);
  wallX(ZN, X0, XW, []); wallX(ZN, XW, XE, [], HM); wallX(ZN, XE, X1, []);                                 // north
  wallZ(X0, ZN, ZF, []); wallZ(X1, ZN, ZF, []);                                                            // west, east
  wallX(ZF, X0, X1, [[0, 2.4]]);                                                                           // the front, with the doors
  wallZ(XW, ZN, ZS, [[3.2, 5.6]], HM); wallZ(XE, ZN, ZS, [[3.2, 5.6]], HM);                                 // the Model Shop's sides: through to sculpture and to MAPO
  wallX(ZS, X0, XW, [[-16.2, -13.8]]); wallX(ZS, XW, XE, [[-0.4, 2.6]], HM); wallX(ZS, XE, X1, [[15.8, 18.2]]);   // the hallway's north side
  wallX(HZ, X0, X1, [[-13.2, -10.8], [0, 2.4], [9.8, 12.2], [17.8, 20.2]]);                                 // the hallway's south side
  wallZ(-5, HZ, ZF, []); wallZ(7, HZ, ZF, []); wallZ(15, HZ, ZF, []);                                       // between show design, the lobby, the sound studio and the library
  for (let x = X0 + 3; x < X1; x += 6) for (const z of [(ZS + HZ) / 2, 16.8, 0.5]) if (!(x > XW && x < XE && z < ZS)) sph(0.2, M(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 1.6 }), x, H - 0.3, z);
  for (let x = XW + 2.5; x < XE; x += 5) flat(1.2, 12, new THREE.MeshBasicMaterial({ color: 0xeaf6ff }), x, HM - 0.02, 0.5, false);   // the Model Shop's skylights

  // ---------------------------------------------------------------- the lobby (x −5…7, z 13…20.5)
  box(3.4, 1.05, 0.9, M(0x4a3526), 3.6, 0.52, 16.2); box(3.6, 0.06, 1.1, M(0xd9b25a, { metalness: 0.5, roughness: 0.35 }), 3.6, 1.08, 16.2);
  pic(4.6, 1.5, -4.86, 2.2, 16.8, Math.PI / 2, (c, w, h) => { c.fillStyle = '#1e2a4a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 60px Georgia, serif'; c.fillText('WED', w / 2, h * 0.38); c.font = '600 22px sans-serif'; c.fillStyle = '#fff'; c.fillText('1401 FLOWER STREET · GLENDALE', w / 2, h * 0.74); }, 512);
  framed('street', 4.6, 2.3, 6.86, 2.05, 16.8, -Math.PI / 2); framed('plan', 2.0, 1.35, -2.6, 2.1, ZF - 0.14, Math.PI, true);
  flat(5.4, 3.6, M(0x8a1f2d, { roughness: 1 }), 0.6, 0.008, 16.9); flat(4.8, 3.0, M(0xa8343f, { roughness: 1 }), 0.6, 0.009, 16.9);   // the lobby's rug
  box(2.4, 0.42, 0.9, M(0x2f5a6b), -3.4, 0.3, 17.4, Math.PI / 2); box(2.4, 0.5, 0.2, M(0x284c5a), -4.0, 0.72, 17.4, Math.PI / 2); plant(-4.3, 19.6, 1.3); plant(6.2, 19.7, 1.3); plant(6.2, 13.8, 1.1);
  person(3.6, 15.4, 'wave', 0x1f4f9a, 0); person(-2.0, 17.2, 'think', 0x6d28d9, Math.PI / 2);

  // ---------------------------------------------------------------- the Monorail Hallway (z 9.5…13): the monorail's stripe, its windows, and the timeline
  ([[X0 + 0.3, -13.2], [-10.8, 0], [2.4, 9.8], [12.2, 17.8], [20.2, X1 - 0.3]] as number[][]).forEach(([a, b]) => {   // between the doorways
    box(b - a, 0.22, 0.06, M(0xd0262d), (a + b) / 2, 1.05, HZ - 0.16); box(b - a, 0.5, 0.05, M(0xf4f6f8, { roughness: 0.4 }), (a + b) / 2, 0.68, HZ - 0.15);
  });
  // the monorail's windows: through each, a place in the parks
  (['castle', 'jungle', 'sphere', 'mountain', 'pirates', 'space', 'mansion', 'street'] as Scene[]).forEach((sc, i) => {
    const x = [-19.2, -16.6, -8.4, -5.8, -3.2, 5.0, 7.4, 14.8][i];
    const wdw = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.15), new THREE.MeshBasicMaterial({ map: tex(320, 194, (c, w, h) => { paint(sc, c, w, h); c.strokeStyle = '#e8edf2'; c.lineWidth = 16; c.beginPath(); c.roundRect(0, 0, w, h, 30); c.stroke(); }) })); wdw.position.set(x, 1.95, HZ - 0.14); wdw.rotation.y = Math.PI; root.add(wdw);
  });
  box(X1 - X0 - 0.6, 0.12, 0.05, M(0xf4f6f8, { roughness: 0.4 }), (X0 + X1) / 2, 2.72, HZ - 0.15);
  // the timeline: a painting for each year that mattered, its year on a small brass plate beneath
  ([['1952', 'plan', -19.4], ['1955', 'street', -11.6], ['1961', 'monorail', -7.2], ['1965', 'pirates', -3.2], ['1971', 'castle', 4.8], ['1982', 'sphere', 8.2], ['1986', 'space', 13.2], ['', 'mountain', 20.6]] as [string, Scene, number][]).forEach(([y, sc, x]) => {
    framed(sc, 2.1, 1.3, x, 2.05, ZS + 0.14, 0);
    if (y) pic(0.5, 0.17, x, 1.12, ZS + 0.15, 0, (c, w, h) => { c.fillStyle = '#c9a24a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3f2716'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 26px Georgia, serif'; c.fillText(y, w / 2, h / 2 + 2); }, 120);
  });
  // wainscot under the paintings, benches and plants along the way, a runner down the middle
  ([[X0 + 0.2, -16.3], [-13.7, -0.5], [2.7, 15.7], [18.3, X1 - 0.2]] as number[][]).forEach(([a, b]) => { box(b - a, 0.85, 0.06, M(0x6b4a34), (a + b) / 2, 0.58, ZS + 0.15); box(b - a, 0.05, 0.1, M(0x5a3d28), (a + b) / 2, 1.02, ZS + 0.16); });
  flat(X1 - X0 - 1.5, 1.5, M(0x8a1f2d, { roughness: 1 }), (X0 + X1) / 2, 0.009, (ZS + HZ) / 2); flat(X1 - X0 - 1.5, 1.2, M(0xa8343f, { roughness: 1 }), (X0 + X1) / 2, 0.011, (ZS + HZ) / 2);
  [-17.9, -6.6, 6.2, 21.6].forEach((x) => plant(x, ZS + 0.55, 1.1)); [-10.4, 11.0].forEach((x) => { box(1.8, 0.1, 0.5, M(0x7b5434), x, 0.48, ZS + 0.5); [-0.75, 0.75].forEach((d) => box(0.08, 0.46, 0.44, M(0x3a3a40), x + d, 0.23, ZS + 0.5)); });
  person(-7.5, 11.3, 'walk', 0x2f7d6b, Math.PI / 2); person(14, 11.2, 'carry', 0xd97706, Math.PI / 2);

  // ---------------------------------------------------------------- the Model Shop (x −9…11, z −8…9.5), two storeys high
  const oak = M(0x6b4226);
  box(7.3, 0.26, 5.5, oak, 0.85, 1.215, 0.35); box(6.9, 0.02, 5.1, M(0x2f5a44, { roughness: 1 }), 0.85, 1.352, 0.35);
  ([[-3.3, -2.4], [3.3, -2.4], [-3.3, 2.4], [3.3, 2.4]] as number[][]).forEach(([x, z]) => box(0.24, 1.1, 0.24, oak, 0.85 + x, 0.55, 0.35 + z));
  // the models in progress, on 4 ft tables: massing models in neutral grey, and one silver sphere
  ([[-6.6, -5.2], [-6.6, 5.6], [8.4, -5.2], [8.4, 6.2], [-6.8, 0.2]] as number[][]).forEach(([x, z], i) => {
    table(x, z, 1.25, 1.25, 0.85, M(0x9a7a55)); flat(1.2, 1.2, M(0xe8e6e0), x, 0.9, z);
    if (i === 0) { sph(0.34, M(0xd8dde2, { metalness: 0.85, roughness: 0.2 }), x, 1.36, z); [[-0.2, -0.2], [0.2, -0.2], [0, 0.25]].forEach(([a, b]) => cyl(0.03, 0.03, 0.2, grey, x + a, 1.0, z + b, 6)); }
    else for (let k = 0; k < 5; k++) box(0.2 + (k * 37 % 5) * 0.05, 0.12 + (k * 53 % 7) * 0.06, 0.2 + (k * 29 % 4) * 0.06, grey, x - 0.4 + (k % 3) * 0.38, 0.97 + (k * 53 % 7) * 0.03, z - 0.3 + Math.floor(k / 3) * 0.55);
  });
  for (let i = 0; i < 3; i++) { box(3.2, 0.06, 0.5, oak, -3.6 + i * 4.4, 1.5 + (i % 2) * 0.6, ZN + 0.4); for (let k = 0; k < 5; k++) box(0.34, 0.3 + (k % 3) * 0.12, 0.3, M([0xf4acb7, 0x93c5fd, 0xfde68a, 0xa7f3d0, 0xddd6fe][k]), -4.8 + i * 4.4 + k * 0.6, 1.72 + (i % 2) * 0.6 + (k % 3) * 0.06, ZN + 0.4); }
  // the carpentry shop in the corner
  table(8.6, -1.2, 2.4, 1.1, 0.9); cyl(0.32, 0.32, 0.03, M(0x9aa3ad, { metalness: 0.7, roughness: 0.3 }), 8.6, 1.02, -1.2, 20).rotation.z = Math.PI / 2; box(0.5, 0.5, 0.5, M(0x4f6d8f), 9.9, 0.25, 1.0); for (let k = 0; k < 4; k++) box(0.1, 2.2, 0.3, M(0xc9a36b), 10.4, 1.1, -3.0 + k * 0.35);
  framed('plan', 4.4, 2.8, XW + 0.14, 3.2, -3.4, Math.PI / 2, true); framed('sphere', 3.6, 2.2, XE - 0.14, 3.2, -3.6, -Math.PI / 2, true);   // the big drawings the models are built from
  for (let k = 0; k < 4; k++) stool(-5.6 + (k % 2) * 13.2, -4.0 + Math.floor(k / 2) * 9.6);
  box(0.9, 0.85, 0.5, M(0x55606e), -8.2, 0.42, 3.0); for (let k = 0; k < 8; k++) cyl(0.07, 0.07, 0.16, M([0xd0262d, 0xfbbf24, 0x2563eb, 0x16a34a, 0xf8fafc, 0x7c3aed, 0xf97316, 0x0ea5e9][k]), -8.45 + (k % 4) * 0.17, 0.93, 2.9 + Math.floor(k / 4) * 0.2, 8);   // the paint cart
  person(-5.4, 0.3, 'hammer', 0xb3202a, -Math.PI / 2); person(7.2, -5.2, 'think', 0x4f6d8f, Math.PI / 2); person(7.3, -1.2, 'hammer', 0x4f7a3d, Math.PI / 2); person(-5.2, 6.4, 'carry', 0x1f4f9a);

  // ---------------------------------------------------------------- the Blaine Gibson Sculpture Studio (x −21…−9, z −8…9.5)
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.22, roughness: 0.1 }), clay = [0xb9a48c, 0x8a6a4a, 0xd8d2c4, 0x9a8f80, 0x6f5a48];
  const bust = (x: number, y: number, z: number, s: number, col: number) => { cyl(0.09 * s, 0.12 * s, 0.14 * s, M(col), x, y + 0.07 * s, z, 8); sph(0.13 * s, M(col), x, y + 0.26 * s, z); box(0.05 * s, 0.06 * s, 0.05 * s, M(col), x, y + 0.25 * s, z + 0.13 * s); };
  const cabinet = (x: number, z: number, ry: number) => {   // 2.4 wide, glass-fronted, three shelves of heads and maquettes
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
    const add = (o: THREE.Mesh) => { g.add(o); return o; }, bx = (w: number, h: number, d: number, m: THREE.Material, px: number, py: number, pz: number) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(px, py, pz); return add(o); };
    bx(2.4, 2.5, 0.06, oak, 0, 1.25, -0.27); bx(2.4, 0.3, 0.6, oak, 0, 0.15, 0); bx(2.4, 0.08, 0.6, oak, 0, 2.5, 0); [-1.17, 1.17].forEach((px) => bx(0.06, 2.5, 0.6, oak, px, 1.25, 0)); bx(2.3, 2.1, 0.02, glass, 0, 1.4, 0.29);
    for (let s = 0; s < 3; s++) { bx(2.3, 0.04, 0.5, M(0xe9e2d3), 0, 0.5 + s * 0.68, 0); for (let k = 0; k < 6; k++) { const col = M(clay[(k + s * 2) % 5]), px = -0.95 + k * 0.38, py = 0.52 + s * 0.68, sc = 0.75 + ((k + s) % 3) * 0.12; const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * sc, 0.09 * sc, 0.12 * sc, 8), col); b1.position.set(px, py + 0.06 * sc, 0); add(b1); const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.11 * sc, 12, 10), col); b2.position.set(px, py + 0.22 * sc, 0); add(b2); } }
  };
  for (let i = 0; i < 4; i++) { cabinet(-19.2 + i * 2.7, ZN + 0.45, 0); cabinet(X0 + 0.45, -5.2 + i * 2.9, Math.PI / 2); }
  ([[-13.2, -2.6, 0], [-16.4, -0.4, 2], [-12.6, 2.2, 4]] as number[][]).forEach(([x, z, c]) => { cyl(0.05, 0.05, 1.0, M(0x3a3a40), x, 0.5, z, 8); cyl(0.28, 0.28, 0.04, oak, x, 1.02, z, 16); cyl(0.3, 0.36, 0.06, M(0x3a3a40), x, 0.03, z, 12); bust(x, 1.04, z, 1.9, clay[c]); });
  // Snow White and the seven dwarfs (the grotto's statues: she is hardly taller than they are)
  box(4.2, 0.3, 1.5, M(0x8b8d8a, { roughness: 1 }), -17.2, 0.15, 7.6);
  for (let i = 0; i < 8; i++) { const sw = i === 3, f: THREE.Object3D = DM.figure(sw ? { height: 0.98, coat: '#2f5fb0', legs: '#f5d04a', hair: '#15151a', shirt: '#f5d04a' } : { height: 0.8, coat: ['#b3202a', '#4f7a3d', '#8a6a4a', '', '#6d28d9', '#d97706', '#2f7d6b', '#4f6d8f'][i], hair: '#e6e6e6', beard: '#f0f0f0' }); f.traverse((o: any) => { if (o.isMesh) o.material = M(0xf4f1ea, { roughness: 0.5 }); }); f.position.set(-19.0 + i * 0.5, 0.3, 7.6); root.add(f); }
  table(-12.4, 6.2, 2.6, 1.1, 0.88, M(0x9a7a55)); for (let k = 0; k < 4; k++) sph(0.16 + (k % 2) * 0.06, M(clay[k]), -13.3 + k * 0.6, 1.08, 6.2); framed('mansion', 2.2, 1.4, XW - 0.14, 2.2, -4.6, -Math.PI / 2, true); plant(-10.0, 8.6, 1.2);
  person(-14.2, -2.4, 'draw', 0x8a6a4a, -Math.PI / 2); person(-15.4, 0.6, 'think', 0x2b2b33, -Math.PI / 2); person(-16.6, 5.4, 'point', 0xb3202a, 0);

  // ---------------------------------------------------------------- MAPO (x 11…23, z −8…9.5): where the Audio-Animatronics figures are made
  cyl(1.1, 1.2, 0.3, M(0x3a3a40), 15.2, 0.15, -3.4, 24); prop('lincoln', 15.2, -3.4, 0.9, Math.PI, 0.3);
  for (let i = 0; i < 4; i++) cyl(0.03, 0.03, 2.3, M(0x9aa3ad, { metalness: 0.7, roughness: 0.3 }), 15.2 + Math.cos(i * 1.57) * 0.75, 1.45, -3.4 + Math.sin(i * 1.57) * 0.75, 6);
  box(2.6, 1.0, 0.8, M(0x4b5563), 12.6, 0.5, -5.6, Math.PI / 2); [0.5, -0.5].forEach((d) => { const r = cyl(0.3, 0.3, 0.05, M(0xd8dde2, { metalness: 0.6, roughness: 0.3 }), 12.95, 1.25, -5.6 + d, 20); r.rotation.z = Math.PI / 2; });
  prop('robot', 19.6, -5.8, 1.5, -0.5); prop('gears', 21.9, -2.0, 1.7, -Math.PI / 2); prop('dino', 20.4, -1.2, 1.9, -1.2);
  table(17.2, 2.2, 3.0, 1.1, 0.92, M(0x55606e)); box(0.5, 0.36, 0.5, M(0x4f6d8f), 16.4, 1.14, 2.2); cyl(0.05, 0.05, 0.5, M(0x9aa3ad, { metalness: 0.7 }), 16.4, 1.55, 2.2, 8);            // a drill press
  table(20.4, 5.6, 3.2, 1.0, 0.92, M(0x55606e)); const lathe = cyl(0.16, 0.16, 2.0, M(0x9aa3ad, { metalness: 0.7, roughness: 0.3 }), 20.4, 1.2, 5.6, 14); lathe.rotation.z = Math.PI / 2; box(0.5, 0.5, 0.5, M(0x2f6b5a), 19.2, 1.22, 5.6);
  pic(3.2, 0.9, 17, 2.9, ZN + 0.14, 0, (c, w, h) => { c.fillStyle = '#1f2430'; c.fillRect(0, 0, w, h); c.fillStyle = '#fbbf24'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 70px Georgia, serif'; c.fillText('M A P O', w / 2, h / 2 + 4); }, 384);
  box(3.0, 1.6, 0.06, M(0xb08a5f), 22.84, 1.9, 1.6, Math.PI / 2); for (let k = 0; k < 10; k++) box(0.05, 0.3 + (k % 3) * 0.12, 0.08, M(k % 2 ? 0x9aa3ad : 0xd0262d), 22.76, 1.8 + (k % 2) * 0.4, 0.3 + k * 0.28);   // the tool board
  framed('pirates', 2.4, 1.5, XE + 0.14, 2.2, 6.6, Math.PI / 2, true);
  person(13.6, -3.0, 'hammer', 0x38bdf8, Math.PI / 2); person(13.4, -5.6, 'think', 0xec4899, -Math.PI / 2); person(19.8, 2.9, 'hammer', 0xd97706, Math.PI); person(20.4, 6.8, 'draw', 0x4f7a3d, Math.PI);

  // ---------------------------------------------------------------- the Show Designers' studio (x −21…−5, z 13…20.5)
  const easel = (x: number, z: number, ry: number, col: string) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.05), M(0xf5f1e8)); b.position.set(0, 1.25, 0); b.rotation.x = -0.5; g.add(b); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshBasicMaterial({ map: tex(320, 200, (c, w, h) => paint(col as Scene, c, w, h)) })); p.position.set(0, 1.27, 0.04); p.rotation.x = -0.5; g.add(p); [-0.6, 0.6].forEach((dx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 0.07), oak); l.position.set(dx, 0.65, -0.2); g.add(l); }); };
  easel(-17.6, 15.4, 0.5, 'space'); easel(-14.4, 15.0, -0.3, 'pirates'); easel(-17.8, 18.4, 0.9, 'sphere');
  (['jungle', 'mansion', 'mountain'] as Scene[]).forEach((sc, i) => framed(sc, 2.4, 1.5, -19.3 + i * 3.0, 2.15, ZF - 0.14, Math.PI));
  framed('castle', 2.6, 1.6, X0 + 0.14, 2.15, 16.8, Math.PI / 2); plant(-20.2, 19.8, 1.2); stool(-13.3, 16.4); stool(-17.2, 16.2);
  box(5.0, 2.0, 0.08, M(0x9a6b3f), -8.6, 1.7, ZF - 0.2);   // the storyboard
  table(-16.0, 16.9, 2.2, 1.0, 0.8); sph(0.16, M(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 2 }), -16.7, 1.25, 16.9); cyl(0.02, 0.02, 0.4, M(0x3a3a40), -16.7, 1.0, 16.9, 6);
  person(-16.0, 17.8, 'think', 0x7d7d86, Math.PI); person(-13.6, 15.7, 'draw', 0x6d28d9, Math.PI + 0.3); person(-11.9, 19.0, 'point', 0x2f7d6b, 0.6);

  // ---------------------------------------------------------------- the sound studio (x 7…15, z 13…20.5)
  for (let i = 0; i < 6; i++) box(1.1, 1.6, 0.08, M(i % 2 ? 0x55506a : 0x6b5a8a), 7.9 + i * 1.25, 2.0, ZF - 0.2);
  box(3.0, 0.9, 1.0, M(0x2b2b33), 11, 0.45, 18.4); const desk = box(3.0, 0.08, 1.1, M(0x4b5563), 11, 0.98, 18.3); desk.rotation.x = -0.25; for (let k = 0; k < 9; k++) box(0.06, 0.05, 0.3, M(k % 3 ? 0xfbbf24 : 0xf472b6), 9.9 + k * 0.27, 1.05, 18.3);
  [8.2, 13.8].forEach((x) => { box(0.6, 1.0, 0.5, M(0x1f2430), x, 1.5, 19.9); cyl(0.2, 0.2, 0.02, M(0x9aa3ad), x, 1.5, 19.64, 16).rotation.x = Math.PI / 2; });
  cyl(0.03, 0.03, 1.5, M(0x9aa3ad, { metalness: 0.7 }), 10.2, 0.75, 15.2, 8); sph(0.09, M(0x3a3a40), 10.2, 1.55, 15.2); prop('musicbox', 13.2, 15.0, 1.1);
  framed('space', 1.9, 1.2, 7.14, 2.2, 16.6, Math.PI / 2, true); box(1.5, 0.95, 0.6, M(0x1f1a17), 13.9, 0.48, 14.2); box(1.5, 0.05, 0.3, M(0xf8fafc), 13.9, 0.82, 14.55); stool(13.9, 15.1);   // an upright piano
  person(11, 17.3, 'draw', 0xec4899, 0); person(10.9, 15.2, 'wave', 0xfbbf24, Math.PI / 2);

  // ---------------------------------------------------------------- the library and its vault (x 15…23, z 13…20.5)
  const shelf = (x: number, z: number, ry: number) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.45), oak); b.position.y = 1.3; g.add(b); for (let s = 0; s < 4; s++) for (let k = 0; k < 9; k++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.06), M([0xb3202a, 0x1f4f9a, 0x2f7d6b, 0xd9b25a, 0x6d28d9][(k + s) % 5])); bk.position.set(-0.96 + k * 0.24, 0.45 + s * 0.6, 0.24); g.add(bk); } };
  for (let i = 0; i < 3; i++) shelf(16.6 + i * 2.6, ZF - 0.4, Math.PI); shelf(X1 - 0.4, 15.2, -Math.PI / 2);
  box(2.2, 0.9, 1.3, M(0x9aa3ad, { metalness: 0.4, roughness: 0.5 }), 18.6, 0.45, 15.6); for (let k = 0; k < 5; k++) box(2.1, 0.02, 0.02, M(0x3a3a40), 18.6, 0.14 + k * 0.17, 16.26);   // the flat files of the vault
  table(20.2, 15.2, 1.8, 1.0, 0.76); sph(0.13, M(0xfff4c2, { emissive: 0xffe9a8, emissiveIntensity: 2 }), 20.8, 1.1, 15.2); framed('jungle', 1.8, 1.15, 15.14, 2.2, 18.4, Math.PI / 2, true);
  prop('globe', 21.4, 17.8, 0.9); person(17.2, 16.6, 'carry', 0x1f4f9a, 0); person(20.6, 19.0, 'think', 0x8a6a4a, Math.PI);

  // ---------------------------------------------------------------- the names over the doorways
  sign('🏗', '模型车间', 'MODEL SHOP', 1.1, 3.2, ZS + 0.4); sign('🗿', '雕塑工作室', 'SCULPTURE STUDIO', -15, 3.1, ZS + 0.4); sign('🤖', 'MAPO 机械角色', 'AUDIO-ANIMATRONICS', 17, 3.1, ZS + 0.4);
  sign('🎨', '演出设计室', 'SHOW DESIGN', -12, 3.1, HZ - 0.4); sign('🎙', '录音室', 'SOUND STUDIO', 11, 3.1, HZ - 0.4); sign('📚', '资料馆', 'LIBRARY', 19, 3.1, HZ - 0.4); sign('🛎', '大厅', 'LOBBY', 1.2, 3.1, HZ - 0.4);

  const places: Place[] = [
    { id: 'walts-office', name: '演出设计室 · 灵感', icon: '💡', x: -16.0, z: 16.9, r: 1.4 },
    { id: 'kem-weber-desk', name: '演出设计室 · 故事板', icon: '🎞', x: -8.6, z: 19.6, r: 1.2 },
    { id: 'animatronics-lab', name: 'MAPO · 机械角色', icon: '🤖', x: 15.2, z: -3.4, r: 1.6 },
    { id: 'machine-shop', name: 'MAPO · 机械车间', icon: '⚙️', x: 18.8, z: 4.0, r: 2.2 },
  ];
  // where a room tapped in the doll's house puts the guest: [x, z, yaw]
  const spots: Record<string, [number, number, number]> = {
    door: [1.2, 19.4, 0], table: [0.85, 6.8, 0], 'model-table': [0.85, 6.8, 0], 'walts-office': [-13.6, 17.6, 1.3], 'kem-weber-desk': [-8.6, 16.6, Math.PI],
    drafting: [-12, 14.2, Math.PI], 'blueprint-wall': [19, 14.2, Math.PI], 'animatronics-lab': [17.5, 5.0, 0], 'machine-shop': [20.0, 6.6, Math.PI], hall: [-15, 7.6, 0],
  };
  return { scene, root, crew, places, bounds: [X0 + 0.5, X1 - 0.5, ZN + 0.5, ZF - 0.5], door: [1.2, 19.4], spots };
}
