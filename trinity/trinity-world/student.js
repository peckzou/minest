/* Trinity College - student life (phase 2, step 2): "Staircase K" (a design-approximate student staircase in the south range
 * of Great Court), its study + bedroom, public seats in the Great Hall and the Wren Library, and the interactions:
 * sit / stand, take a book from a shelf and read it / return it, reading lamps, display slots for the user's own Items.
 *
 * NOT a survey: Trinity's real staircases differ; every size and the layout here is a design approximation.
 * Layout (metres, x west->east, z north->south, the court is at z < 42.5):
 *   south range block x -36..-12, z 42.5..51.5.  Ground floor: stair hall x -28..-24 (door in the court wall at x -26).
 *   A 19-step stair rises toward +z to a landing at y 3.7; the study (x -23.6..-17) and the bedroom (x -16.6..-12) are on
 *   the first floor, entered from the landing. The rest of the block is solid (not open).
 * Exposes TrinityLife = { build(world, THREE, tex, opts) -> { group, colliders, seats, life, update } }.
 */
(function (root) {
  'use strict';
  const FL = 3.7, CEIL = 7.7, ATTIC = 12.5, ZI0 = 43.2, ZI1 = 50.8, STEPS = 19;
  const KEY = 'trinity.student.v1';

  const TITLES = [
    ['Philosophiae Naturalis Principia Mathematica', 'Isaac Newton'], ['Opticks', 'Isaac Newton'], ['Novum Organum', 'Francis Bacon'],
    ['Principia Mathematica', 'A. N. Whitehead & B. Russell'], ['Tractatus Logico-Philosophicus', 'Ludwig Wittgenstein'],
    ['Winnie-the-Pooh', 'A. A. Milne'], ['Don Juan', 'Lord Byron'], ['In Memoriam A.H.H.', 'Alfred Tennyson'],
    ['The History of England', 'T. B. Macaulay'], ['A Treatise on Electricity and Magnetism', 'J. C. Maxwell'],
    ['A Course of Pure Mathematics', 'G. H. Hardy'], ['The Temple', 'George Herbert'], ['剑桥日记', '示例'], ['读书笔记', '示例'], ['诗选', '示例'], ['数学笔记', '示例']
  ];
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function bookInfo(id) { const t = TITLES[hash(String(id)) % TITLES.length]; return { id: String(id), title: t[0], author: t[1] }; }

  function build(world, THREE, tex, opts) {
    opts = opts || {};
    const SC = root.TrinityScene, M = root.TrinityMats.get(THREE), mats = opts.mats || {};
    const group = new THREE.Group(), colliders = [], seats = [], lights = {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const mStone = mats.stone || std({ color: 0xcfc6ad, roughness: 0.92 }), mTrim = mats.trim || std({ color: 0xf1e9d3, roughness: 0.85 }), mSlab = mats.slab || std({ color: 0xb9b2a2 });
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    const Qt = new THREE.Quaternion(), Up = new THREE.Vector3(0, 1, 0);
    const mat4 = (x, y, z, ry, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Qt.setFromAxisAngle(Up, ry || 0), new THREE.Vector3(sx, sy, sz));
    const batches = new Map();
    function add(mat, geo, m, uv) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m); if (uv && mat.map) SC.worldUV(g, uv); if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(g); }
    const uvOf = (mat) => (mat === mStone || mat === mTrim ? 2.4 : mat === mSlab ? 3.6 : 1);
    function box(mat, x0, x1, y0, y1, z0, z1, collide) {
      if (x1 <= x0 || y1 <= y0 || z1 <= z0) return;
      add(mat, UNIT, mat4((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, x1 - x0, y1 - y0, z1 - z0), uvOf(mat));
      if (collide) colliders.push({ min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } });
    }
    // centred, optionally rotated (ry) box for furniture; collider only when ry = 0 or a multiple of PI/2 (axis aligned)
    function boxC(mat, x, y, z, w, h, d, ry, collide) {
      add(mat, UNIT, mat4(x, y, z, ry || 0, w, h, d), uvOf(mat));
      if (collide) { const sw = Math.abs(Math.sin(ry || 0)) > 0.7; const hw = (sw ? d : w) / 2, hd = (sw ? w : d) / 2; colliders.push({ min: { x: x - hw, y: y - h / 2, z: z - hd }, max: { x: x + hw, y: y + h / 2, z: z + hd } }); }
    }
    function plane(mat, x0, x1, z0, z1, y, up, uv) {
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); add(mat, g, null, uv || uvOf(mat));
    }
    // a wall along axis ax ('x' or 'z') spanning a0..a1 at thickness c0..c1 with rectangular holes {a0,a1,y0,y1}
    function wall(mat, ax, a0, a1, y0, y1, c0, c1, holes, collide) {
      const bp = [a0, a1]; holes.forEach((h) => bp.push(h.a0, h.a1)); const pts = Array.from(new Set(bp)).sort((p, q) => p - q);
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], mid = (a + b) / 2;
        const iv = holes.filter((h) => h.a0 <= mid && h.a1 >= mid).map((h) => [h.y0, h.y1]).sort((p, q) => p[0] - q[0]);
        let y = y0; const seg = (ya, yb) => { if (yb <= ya) return; if (ax === 'x') box(mat, a, b, ya, yb, c0, c1, collide); else box(mat, c0, c1, ya, yb, a, b, collide); };
        for (const v of iv) { if (v[0] > y) seg(y, Math.min(v[0], y1)); y = Math.max(y, v[1]); }
        seg(y, y1);
      }
    }

    /* ================= stone shell of the staircase block ================= */
    const RX0 = world.residence.x0, RX1 = world.residence.x1, Z0 = world.IZ, Z1 = world.IZ + world.DEPTH;
    const DOORX = -26;                                    // centre of the court door
    const H_DOOR = { a0: DOORX - 0.8, a1: DOORX + 0.8, y0: 0, y1: 2.7 };
    const WIN = [                                           // first-floor windows in the court wall (sill 1.55 m above the floor)
      { id: 'hall', cx: DOORX, w: 1.0 }, { id: 'study', cx: -20.3, w: 1.6 }, { id: 'bed', cx: -14.65, w: 1.5 }
    ].map((w) => ({ id: w.id, cx: w.cx, w: w.w, a0: w.cx - w.w / 2, a1: w.cx + w.w / 2, y0: FL + 1.55, y1: FL + 3.85 }));
    wall(mStone, 'x', RX0, RX1, 0, ATTIC, Z0, ZI0, [H_DOOR].concat(WIN), true);   // court wall (0.7 m, with reveals)
    box(mStone, RX0, RX1, 0, ATTIC, ZI1, Z1, true);                                // back wall
    box(mStone, RX0, -28, 0, ATTIC, ZI0, ZI1, true);                               // west part: solid, not open
    box(mStone, -24, RX1, 0, FL, ZI0, ZI1, true);                                  // under the first floor
    box(mStone, -28, RX1, CEIL, ATTIC, ZI0, ZI1, true);                            // above the ceilings
    const DOOR2 = { a0: 49.5, a1: 50.7, y0: FL, y1: FL + 2.4 };                    // landing -> study
    wall(mStone, 'z', ZI0, ZI1, FL, CEIL, -24, -23.6, [DOOR2], true);
    const DOOR3 = { a0: 46.5, a1: 47.7, y0: FL, y1: FL + 2.4 };                    // study -> bedroom
    wall(M.plaster, 'z', ZI0, ZI1, FL, CEIL, -17.0, -16.6, [DOOR3], true);
    // the stair: STEPS risers, 0.26 m treads, full width of the stair hall; the landing is solid underneath
    const rise = FL / STEPS, tread = 0.26, SZ0 = 44.2, LAND0 = SZ0 + STEPS * tread;
    for (let i = 0; i < STEPS; i++) box(mSlab, -28, -24, 0, (i + 1) * rise, SZ0 + i * tread, SZ0 + (i + 1) * tread, true);
    box(mSlab, -28, -24, 0, FL, LAND0, ZI1, true);
    plane(mSlab, DOORX - 0.8, DOORX + 0.8, Z0, ZI0, 0.01, true); plane(mSlab, -28, -24, ZI0, SZ0, 0.01, true);
    // stair hall: timber handrails and a newel on the open stair; landing balustrade is the court-wall plane
    for (let i = 0; i <= STEPS; i += 3) { const y = i * rise; box(M.oakDark, -26.04, -25.96, y, y + 1.0, SZ0 + i * tread - 0.02, SZ0 + i * tread + 0.04, false); }
    { const g = new THREE.BoxGeometry(0.07, 0.07, Math.hypot(STEPS * tread, FL)); const a = Math.atan2(FL, STEPS * tread); g.rotateX(a); g.translate(-26, FL / 2 + 1.0, SZ0 + STEPS * tread / 2); add(M.oakDark, g, null, 1); }
    // door surround, lintel and plaque on the court side
    box(mTrim, DOORX - 1.05, DOORX - 0.8, 0, 2.95, Z0 - 0.12, ZI0, false); box(mTrim, DOORX + 0.8, DOORX + 1.05, 0, 2.95, Z0 - 0.12, ZI0, false);
    box(mTrim, DOORX - 1.05, DOORX + 1.05, 2.7, 2.95, Z0 - 0.12, ZI0, false);
    box(M.oakDark, DOORX - 0.84, DOORX - 0.76, 0, 2.7, Z0 - 1.6, Z0 - 0.02, false);                               // door leaf, swung open against the court
    { const hinge = M.brass; box(hinge, DOORX - 0.86, DOORX - 0.74, 0.5, 0.62, Z0 - 0.06, Z0, false); box(hinge, DOORX - 0.86, DOORX - 0.74, 2.0, 2.12, Z0 - 0.06, Z0, false); }
    // study / bedroom door frames (oak architraves) and an open leaf each
    function frameX(x0, x1, y0, y1, c0, c1) { box(M.oakDark, x0 - 0.07, x0, y0, y1, c0, c1, false); box(M.oakDark, x1, x1 + 0.07, y0, y1, c0, c1, false); box(M.oakDark, x0 - 0.07, x1 + 0.07, y1, y1 + 0.08, c0, c1, false); }
    function frameZ(z0, z1, y0, y1, c0, c1) { box(M.oakDark, c0, c1, y0, y1, z0 - 0.07, z0, false); box(M.oakDark, c0, c1, y0, y1, z1, z1 + 0.07, false); box(M.oakDark, c0, c1, y0, y1 + 0.08, z0 - 0.07, z1 + 0.07, false); }
    frameZ(DOOR2.a0, DOOR2.a1, FL, FL + 2.4, -24.1, -23.5); frameZ(DOOR3.a0, DOOR3.a1, FL, FL + 2.4, -17.1, -16.5);
    box(M.oakDark, -23.58, -23.5, FL, FL + 2.38, 48.7, 49.5, false);   // study door leaf, open against the wall (stays clear of the opening)
    box(M.oakDark, -16.6, -16.52, FL, FL + 2.38, 47.7, 48.5, false);
    // exterior plaque
    {
      const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
      x.fillStyle = '#2c2218'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#c9a24a'; x.lineWidth = 4; x.strokeRect(4, 4, 248, 88);
      x.fillStyle = '#e8d49a'; x.font = 'bold 28px Georgia,serif'; x.textAlign = 'center'; x.fillText('STAIRCASE K', 128, 42); x.font = '15px system-ui,sans-serif'; x.fillText('学生宿舍 · 二楼 房间 K2 (设计近似)', 128, 72);
      const t = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); p.position.set(DOORX, 3.35, Z0 - 0.14); p.rotation.y = Math.PI; group.add(p);
    }

    /* ================= linings, floors, ceilings ================= */
    const Wd = { oak: M.oak, plaster: M.plaster };
    function room(x0, x1, name, frontHoles) {
      // plaster lining on the court / back / side walls (windows keep stone reveals)
      wall(M.plaster, 'x', x0, x1, FL, CEIL, ZI0, ZI0 + 0.06, frontHoles, false);
      wall(M.plaster, 'x', x0, x1, FL, CEIL, ZI1 - 0.06, ZI1, [], false);
      plane(M.floorBoards, x0, x1, ZI0 + 0.06, ZI1 - 0.06, FL + 0.012, true, 1);
      plane(M.plaster, x0, x1, ZI0, ZI1, CEIL - 0.01, false, 1.5);
      // dado, skirting, picture rail, cornice
      wall(M.oak, 'x', x0, x1, FL, FL + 1.05, ZI0 + 0.06, ZI0 + 0.095, frontHoles.filter((h) => h.y0 < FL + 1.05), false);
      box(M.oak, x0, x1, FL, FL + 0.14, ZI1 - 0.105, ZI1 - 0.06, false); box(M.oak, x0, x1, FL + 0.05 + 1.0, FL + 1.1, ZI1 - 0.095, ZI1 - 0.06, false);
      box(M.oak, x0, x1, FL, FL + 0.14, ZI0 + 0.06, ZI0 + 0.105, false);
      box(M.plaster, x0, x1, CEIL - 0.14, CEIL, ZI0 + 0.06, ZI0 + 0.2, false); box(M.plaster, x0, x1, CEIL - 0.14, CEIL, ZI1 - 0.2, ZI1 - 0.06, false);
    }
    room(-23.54, -17.06, 'study', [WIN[1]]);
    room(-16.54, -12.06, 'bedroom', [WIN[2]]);
    // end walls + west lining
    wall(M.plaster, 'z', ZI0, ZI1, FL, CEIL, -23.66, -23.6, [DOOR2], false);
    box(M.plaster, -12.06, -12, FL, CEIL, ZI0, ZI1, false);
    for (const [xa, xb, sg] of [[-23.66, -23.6, -1], [-17.06, -17.0, 1], [-16.6, -16.54, -1], [-12.06, -12.0, 1]]) { /* skirting on the side walls */
      const e = sg > 0 ? xa - 0.045 : xb; box(M.oak, e, e + 0.045, FL, FL + 0.14, ZI0 + 0.06, ZI1 - 0.06, false);
    }
    box(M.oak, -23.66 - 0.0, -23.66 + 0.02, FL + 0.0, FL + 1.05, ZI0 + 0.06, DOOR2.a0 - 0.07, false);   // west dado up to the door
    // stair hall: ceiling lamp-lit stone; landing floor boards
    plane(M.floorBoards, -28, -24, LAND0, ZI1, FL + 0.012, true, 1);

    /* ================= windows: frames, glass, curtains ================= */
    for (const w of WIN) {
      const zg = ZI0 + 0.3, y0 = w.y0, y1 = w.y1, wd = w.a1 - w.a0;
      box(M.oakDark, w.a0 - 0.05, w.a1 + 0.05, y0 - 0.06, y0, Z0 + 0.05, ZI0 + 0.28, false);                         // sill
      for (const [a, b] of [[w.a0, w.a0 + 0.05], [w.a1 - 0.05, w.a1]]) box(M.oak, a, b, y0, y1, zg - 0.03, zg + 0.03, false);
      box(M.oak, w.a0, w.a1, y1 - 0.05, y1, zg - 0.03, zg + 0.03, false); box(M.oak, w.a0, w.a1, y0, y0 + 0.05, zg - 0.03, zg + 0.03, false);
      box(M.oak, w.cx - 0.02, w.cx + 0.02, y0, y1, zg - 0.02, zg + 0.02, false);
      box(M.oak, w.a0, w.a1, (y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02, zg - 0.02, zg + 0.02, false);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(wd, y1 - y0), M.glass); gl.position.set(w.cx, (y0 + y1) / 2, zg); group.add(gl);
      if (w.id === 'hall') continue;
      const cm = M.fabric(w.id === 'study' ? 0x2f5a3c : 0x6a3a44);
      for (const sx of [-1, 1]) box(cm, w.cx + sx * (wd / 2 + 0.12) - 0.14, w.cx + sx * (wd / 2 + 0.12) + 0.14, FL + 0.18, CEIL - 0.34, ZI0 + 0.08, ZI0 + 0.22, false);
      box(M.brass, w.a0 - 0.35, w.a1 + 0.35, CEIL - 0.34, CEIL - 0.3, ZI0 + 0.12, ZI0 + 0.16, false);
    }

    /* ================= furniture ================= */
    const BOOKCOL = [0x7a3b2a, 0x3d5a45, 0x2f3f66, 0x8a6a3a, 0x5a3a52, 0x9a8a68, 0x6a2a2a, 0x3a4a52, 0xb09a6a, 0x4a3a2a, 0x2a4a4a, 0x8a4a3a];
    function table(x, z, w, d, h, mat) {
      boxC(mat, x, FL + h - 0.03, z, w, 0.06, d, 0, true);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxC(mat, x + sx * (w / 2 - 0.06), FL + (h - 0.06) / 2, z + sz * (d / 2 - 0.06), 0.07, h - 0.06, 0.07, 0, false);
    }
    // study desk under the window + chair, desk lamp
    table(-20.3, 43.7, 1.6, 0.72, 0.76, M.oak);
    box(M.leather, -20.95, -19.65, FL + 0.765, FL + 0.775, 43.4, 43.95, false);                                   // leather desk blotter
    function chair(x, z, ry, mat) {   // seat faces local -z; ry rotates it
      const c = Math.cos(ry), s = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
      let p = P(0, 0); boxC(mat, p[0], FL + 0.45, p[1], 0.46, 0.05, 0.44, ry, false);
      p = P(0, 0.22); boxC(mat, p[0], FL + 0.75, p[1], 0.46, 0.5, 0.04, ry, false);
      for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.19], [0.19, 0.19]]) { p = P(lx, lz); boxC(mat, p[0], FL + 0.22, p[1], 0.04, 0.44, 0.04, ry, false); }
    }
    chair(-20.3, 44.85, 0, M.oak);
    // study bookcase on the back wall: x -22.7..-17.4, five shelves
    const BC = { x0: -22.7, x1: -17.4, zb: ZI1 - 0.06, d: 0.34, h: 2.35, sh: [0.12, 0.6, 1.08, 1.56, 2.04] };
    box(M.oakDark, BC.x0 - 0.04, BC.x0, FL, FL + BC.h, BC.zb - BC.d, BC.zb, true); box(M.oakDark, BC.x1, BC.x1 + 0.04, FL, FL + BC.h, BC.zb - BC.d, BC.zb, true);
    box(M.oakDark, BC.x0, BC.x1, FL, FL + BC.h, BC.zb - 0.02, BC.zb, false); box(M.oak, BC.x0 - 0.06, BC.x1 + 0.06, FL + BC.h, FL + BC.h + 0.06, BC.zb - BC.d - 0.04, BC.zb, false);
    for (const y of BC.sh) box(M.oak, BC.x0, BC.x1, FL + y, FL + y + 0.035, BC.zb - BC.d, BC.zb - 0.02, false);
    box(M.oak, BC.x0, BC.x1, FL, FL + 0.12, BC.zb - BC.d, BC.zb, false);
    // books (instanced): varied thickness, height, tone, the odd lean and gap
    const bk = { pos: [], sc: [], rot: [], col: [], ids: [] };
    {
      let r = 1707; const rnd = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
      BC.sh.forEach((sy, si) => {
        let x = BC.x0 + 0.04; const gapAt = 0.3 + rnd() * 0.6;
        while (x < BC.x1 - 0.14) {
          const th = 0.035 + rnd() * 0.05, h = 0.2 + rnd() * 0.14, lean = rnd() < 0.05 ? (rnd() - 0.5) * 0.35 : 0;
          if (rnd() < 0.025) { x += 0.1 + rnd() * 0.12; continue; }
          bk.pos.push(x + th / 2, FL + sy + 0.035 + h / 2, BC.zb - BC.d / 2 - 0.01 + (rnd() - 0.5) * 0.03); bk.sc.push(th, h, 0.2 + rnd() * 0.06); bk.rot.push(lean);
          bk.col.push(BOOKCOL[(rnd() * BOOKCOL.length) | 0]); bk.ids.push('R' + (si + 1) + '-' + bk.ids.length); x += th + 0.004 + Math.abs(lean) * 0.12;
          if (si === 4 && x > BC.x0 + 3.6 + gapAt) break;
        }
      });
    }
    const bookMesh = new THREE.InstancedMesh(UNIT, std({ color: 0xffffff, roughness: 0.75 }), bk.ids.length);
    const bookHome = [];
    { const col = new THREE.Color(); for (let i = 0; i < bk.ids.length; i++) { const m = new THREE.Matrix4().compose(new THREE.Vector3(bk.pos[i * 3], bk.pos[i * 3 + 1], bk.pos[i * 3 + 2]), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bk.rot[i]), new THREE.Vector3(bk.sc[i * 3], bk.sc[i * 3 + 1], bk.sc[i * 3 + 2])); bookHome.push(m); bookMesh.setMatrixAt(i, m); bookMesh.setColorAt(i, col.setHex(bk.col[i]).convertSRGBToLinear()); } }
    bookMesh.instanceMatrix.needsUpdate = true; if (bookMesh.instanceColor) bookMesh.instanceColor.needsUpdate = true; bookMesh.castShadow = true; group.add(bookMesh);
    // reading nook: armchair against the partition, floor lamp
    function armchair(x, z, ry) {
      const c = Math.cos(ry), s = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c], f = M.fabric(0x7a3a30);
      let p = P(0, 0); boxC(f, p[0], FL + 0.3, p[1], 0.82, 0.3, 0.8, ry, true);
      p = P(0, 0.4); boxC(f, p[0], FL + 0.75, p[1], 0.82, 0.62, 0.16, ry, false);
      for (const sx of [-1, 1]) { p = P(sx * 0.41, 0.04); boxC(f, p[0], FL + 0.52, p[1], 0.14, 0.34, 0.74, ry, false); }
      for (const [lx, lz] of [[-0.36, -0.32], [0.36, -0.32], [-0.36, 0.34], [0.36, 0.34]]) { p = P(lx, lz); boxC(M.oakDark, p[0], FL + 0.07, p[1], 0.05, 0.14, 0.05, ry, false); }
    }
    armchair(-17.7, 48.6, Math.PI / 2);
    // rugs
    box(M.fabric(0x6a2630), -22.0, -18.6, FL + 0.012, FL + 0.03, 45.6, 48.0, false); box(M.fabric(0xc9a24a), -21.9, -18.7, FL + 0.03, FL + 0.036, 45.7, 47.9, false); box(M.fabric(0x6a2630), -21.8, -18.8, FL + 0.036, FL + 0.042, 45.8, 47.8, false);
    box(M.fabric(0x3f5a78), -15.9, -12.9, FL + 0.012, FL + 0.03, 45.0, 47.3, false);
    // lamps (emissive shade + PointLight; intensity is toggled so shaders never recompile)
    const lamps = {};
    function lamp(id, x, z, baseY, tall, label) {
      const sh = std({ color: 0xf3e3b8, emissive: 0xffc870, emissiveIntensity: 0, roughness: 0.8, side: THREE.DoubleSide });
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), M.brass); base.position.y = 0.02; g.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, tall, 8), M.brass); pole.position.y = tall / 2; g.add(pole);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.19, 0.22, 14, 1, true), sh); shade.position.y = tall + 0.05; g.add(shade);
      g.position.set(x, baseY, z); group.add(g);
      const L = new THREE.PointLight(0xffcf8c, 0, 6.5, 1.5); L.position.set(x, baseY + tall + 0.05, z); group.add(L);
      lamps[id] = { id, shade: sh, light: L, on: false, pos: [x, baseY + tall, z], label };
    }
    lamp('desk', -19.7, 43.55, FL + 0.78, 0.3, '书桌灯'); lamp('read', -17.5, 49.6, FL, 1.45, '阅读落地灯');
    // fill lights (constant, subtle) so the rooms read in daylight without a sun through the windows
    for (const [id, x, y, z, I, d] of [['study', -20.3, FL + 2.8, 46.8, 0.42, 11], ['bed', -14.3, FL + 2.8, 46.8, 0.34, 9], ['stair', -26, 3.4, 47, 0.4, 12]]) { const L = new THREE.PointLight(0xfff0d8, I, d, 1.4); L.position.set(x, y, z); group.add(L); lights[id] = L; }
    // bedroom: bed, nightstand, wardrobe
    {
      const f = M.fabric(0x4a6a8a), w = M.fabric(0xe8e2d2), bx = -14.3;
      boxC(M.oakDark, bx, FL + 0.22, 49.77, 1.14, 0.3, 2.06, 0, true); boxC(w, bx, FL + 0.44, 49.77, 1.04, 0.16, 1.96, 0, false);
      boxC(f, bx, FL + 0.56, 49.35, 1.06, 0.08, 1.2, 0, false); boxC(w, bx, FL + 0.58, 50.4, 0.7, 0.14, 0.34, 0, false);
      boxC(M.oakDark, bx, FL + 0.75, ZI1 - 0.09, 1.2, 1.2, 0.07, 0, false);                                           // headboard
      boxC(M.oak, -15.35, FL + 0.28, 50.5, 0.42, 0.56, 0.42, 0, true);                                                // nightstand
      boxC(M.oak, -12.36, FL + 1.1, 45.0, 0.6, 2.2, 1.6, 0, true); box(M.brass, -12.7, -12.66, FL + 1.0, FL + 1.3, 44.8, 44.84, false);
      box(M.brass, -12.7, -12.66, FL + 1.0, FL + 1.3, 45.16, 45.2, false);
    }
    // wall shelves for the display slots (partition wall x -17.06 faces -x)
    const SLOTS = [];
    function shelfSlot(id, label, x, y, z, nx, nz, along, len) {   // a board with its front toward (nx,nz); `along` = unit vector (ax,az) of the board
      const ry = Math.atan2(nx, nz);
      boxC(M.oakDark, x, y - 0.02, z, along[0] ? len : 0.22, 0.035, along[1] ? len : 0.22, 0, false);
      SLOTS.push({ id, label, x, y: y, z, nx, nz, ax: along[0], az: along[1], len, ry });
    }
    const SY = FL + 1.55;
    shelfSlot('s1', '壁架 1', -17.17, SY, 44.3, -1, 0, [0, 1], 0.9); shelfSlot('s2', '壁架 2', -17.17, SY, 45.5, -1, 0, [0, 1], 0.9);
    shelfSlot('s3', '壁架 3', -17.17, SY, 48.1, -1, 0, [0, 1], 0.9); shelfSlot('s4', '壁架 4', -17.17, SY, 49.3, -1, 0, [0, 1], 0.9);
    shelfSlot('b1', '床头柜', -15.35, FL + 0.585, 50.5, 0, -1, [1, 0], 0.4);
    shelfSlot('b2', '床头画框位', -14.3, FL + 1.52, ZI1 - 0.18, 0, -1, [1, 0], 0.9);

    for (const [k, list] of batches) { const m = new THREE.Mesh(SC.mergeGeoms(list), k); m.castShadow = true; m.receiveShadow = true; group.add(m); }
    batches.clear();

    /* ================= public seats: Great Hall benches, Wren reader chairs ================= */
    {
      const h = world.hall, cx = h.x, dz1 = h.z0 + 3.4, b0 = dz1 + 1.2, b1 = h.z1 - 5.2;
      for (const [tx, bx, yaw, ex] of [[-3, -3.9, -Math.PI / 2, -4.9], [-3, -2.1, Math.PI / 2, -1.3], [3, 2.1, -Math.PI / 2, 1.3], [3, 3.9, Math.PI / 2, 4.9]]) for (const z of [b0 + 3, (b0 + b1) / 2, b1 - 3]) seats.push({ id: 'hall-' + bx + '-' + z.toFixed(0), place: 'great_hall', x: cx + bx, y: 0.25, z, yaw, pitch: -0.22, floor: 0, exit: { x: cx + ex, z } });
      const L = world.wren, fy = L.floorY, mC = M.oak;
      for (let i = 0; i < 4; i++) {
        const z = L.z0 + 6 + i * ((L.z1 - L.z0 - 12) / 3);
        for (const [sx, yaw] of [[1.05, Math.PI / 2], [-1.05, -Math.PI / 2]]) {
          const c = Math.cos(yaw), s = Math.sin(yaw), x = L.x + sx;
          const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
          let p = P(0, 0); const seat = new THREE.Mesh(UNIT, mC); seat.scale.set(0.46, 0.05, 0.44); seat.position.set(p[0], fy + 0.45, p[1]); seat.rotation.y = yaw; group.add(seat);
          p = P(0, 0.22); const back = new THREE.Mesh(UNIT, mC); back.scale.set(0.46, 0.5, 0.04); back.position.set(p[0], fy + 0.75, p[1]); back.rotation.y = yaw; group.add(back);
          for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.19], [0.19, 0.19]]) { p = P(lx, lz); const lg = new THREE.Mesh(UNIT, M.oakDark); lg.scale.set(0.04, 0.44, 0.04); lg.position.set(p[0], fy + 0.22, p[1]); group.add(lg); }
          seats.push({ id: 'wren-' + i + (sx > 0 ? 'e' : 'w'), place: 'wren', x, y: fy + 0.2, z, yaw, pitch: -0.3, floor: fy, exit: { x: L.x + sx * 1.6, z } });
        }
      }
    }
    seats.push({ id: 'desk', place: 'residence', x: -20.3, y: FL + 0.2, z: 44.85, yaw: 0, pitch: -0.1, floor: FL, exit: { x: -20.3, z: 46.1 } });
    seats.push({ id: 'armchair', place: 'residence', x: -17.85, y: FL + 0.12, z: 48.6, yaw: Math.PI / 2, pitch: -0.2, floor: FL, exit: { x: -19.0, z: 48.6 } });
    seats.push({ id: 'bed', place: 'residence', x: -14.3, y: FL + 0.4, z: 48.95, yaw: 0, pitch: -0.12, floor: FL, exit: { x: -14.3, z: 47.6 } });

    /* ================= state, persistence ================= */
    const state = { v: 1, lamps: { desk: false, read: false }, slots: {} };
    function loadState() {
      let s = null; try { s = window.__trStudent ? window.__trStudent.load() : JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
      if (s && s.v === 1) { Object.assign(state.lamps, s.lamps || {}); state.slots = s.slots || {}; }
    }
    function saveState() { try { const s = JSON.parse(JSON.stringify(state)); if (window.__trStudent) window.__trStudent.save(s); else localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* blocked storage */ } }
    loadState();

    // ===== display slots: visuals =====
    const slotObj = {};          // id -> { mesh, tex }
    function disposeSlot(id) { const o = slotObj[id]; if (!o) return; group.remove(o.mesh); o.mesh.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }); delete slotObj[id]; }
    const KIND = { book: ['📘', '#2f4a72'], photo: ['🖼️', '#7a5a3a'], card: ['🗂️', '#e8dfc6'], item: ['⭐', '#5a3a6a'] };
    function cardTex(it) {
      const k = KIND[it.kind] || KIND.item, c = document.createElement('canvas'); c.width = 256; c.height = 352; const x = c.getContext('2d');
      x.fillStyle = k[1]; x.fillRect(0, 0, 256, 352); x.fillStyle = it.kind === 'card' ? '#2a2418' : '#f3ecd8'; x.strokeStyle = x.fillStyle; x.lineWidth = 4; x.strokeRect(12, 12, 232, 328);
      x.font = '64px system-ui'; x.textAlign = 'center'; x.fillText(k[0], 128, 90); x.font = 'bold 26px system-ui,sans-serif';
      const t = String(it.missing ? '（原内容已不存在）' : it.title || '未命名'); const lines = []; let cur = '';
      for (const ch of t) { if (x.measureText(cur + ch).width > 200) { lines.push(cur); cur = ch; } else cur += ch; }
      lines.push(cur); lines.slice(0, 5).forEach((l, i) => x.fillText(l, 128, 150 + i * 36));
      const tx = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding !== undefined) tx.encoding = THREE.sRGBEncoding; tx.anisotropy = 4; return tx;
    }
    function renderSlot(id) {
      disposeSlot(id); const s = SLOTS.find((q) => q.id === id), rec = state.slots[id]; if (!s || !rec || !rec.item) return;
      const it = rec.item, shape = { book: [0.2, 0.3, 0.05], photo: [0.3, 0.22, 0.03], card: [0.22, 0.3, 0.012], item: [0.18, 0.18, 0.18] }[it.kind] || [0.18, 0.18, 0.18];
      const tx = cardTex(it), face = std({ map: tx, roughness: 0.7 }), edge = std({ color: it.kind === 'photo' ? 0xc9a24a : 0x2a2018, roughness: 0.6, metalness: it.kind === 'photo' ? 0.8 : 0 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(shape[0], shape[1], shape[2]), [edge, edge, edge, edge, face, edge]); mesh.castShadow = true;
      const off = Math.max(-(s.len / 2 - shape[0] / 2 - 0.02), Math.min(s.len / 2 - shape[0] / 2 - 0.02, rec.dx || 0));
      mesh.position.set(s.x + s.ax * off + s.nx * 0.03, s.y + shape[1] / 2 + 0.005, s.z + s.az * off + s.nz * 0.03); mesh.rotation.order = 'YXZ'; mesh.rotation.y = s.ry + (rec.ry || 0);
      if (it.kind === 'photo') mesh.rotation.x = -0.18;     // leans on the wall
      mesh.userData.slot = id; group.add(mesh); slotObj[id] = { mesh };
    }
    function renderAll() { for (const s of SLOTS) renderSlot(s.id); }
    function setLamp(id, on) { const l = lamps[id]; if (!l) return; l.on = on == null ? !l.on : !!on; l.light.intensity = l.on ? 1.1 : 0; l.shade.emissiveIntensity = l.on ? 1.0 : 0; state.lamps[id] = l.on; saveState(); }
    for (const id in lamps) { const l = lamps[id]; l.on = !!state.lamps[id]; l.light.intensity = l.on ? 1.1 : 0; l.shade.emissiveIntensity = l.on ? 1.0 : 0; }
    renderAll();

    /* ================= UI + interaction (needs the app context) ================= */
    const hist = [];
    const snap = () => { hist.push(JSON.stringify(state.slots)); if (hist.length > 30) hist.shift(); };
    const life = {
      state, slots: SLOTS, lamps, seats, bookInfo, bookMesh, bookIds: bk.ids,
      resident: { x0: -23.6, x1: -12, z0: ZI0, z1: ZI1, y0: FL - 0.1, y1: CEIL },
      ctx: null, ui: null, hold: null,
      setLamp,
      place(slotId, item) { if (!SLOTS.some((q) => q.id === slotId) || !item || !item.id) return false; snap(); state.slots[slotId] = { item: { id: String(item.id), title: item.title || '', kind: item.kind || 'item', source: item.source || '' }, dx: 0, ry: 0, t: Date.now() }; saveState(); renderSlot(slotId); return true; },
      remove(slotId) { if (!state.slots[slotId]) return false; snap(); delete state.slots[slotId]; saveState(); renderSlot(slotId); return true; },
      adjust(slotId, ddx, dry) { const r = state.slots[slotId]; if (!r) return; snap(); r.dx = Math.max(-0.5, Math.min(0.5, (r.dx || 0) + (ddx || 0))); r.ry = Math.max(-0.6, Math.min(0.6, (r.ry || 0) + (dry || 0))); saveState(); renderSlot(slotId); },
      undo() { if (!hist.length) return false; state.slots = JSON.parse(hist.pop()); saveState(); renderAll(); return true; },
      // re-read titles from the original Items (My World bridge); missing ones keep their id and are marked
      async refresh() {
        const br = window.__trItems; if (!br || !br.get) return;
        for (const id in state.slots) { const rec = state.slots[id]; try { const cur = await br.get(rec.item.id); if (cur) { if (cur.title !== rec.item.title || (cur.kind && cur.kind !== rec.item.kind)) { rec.item.title = cur.title; if (cur.kind) rec.item.kind = cur.kind; } rec.item.missing = false; } else rec.item.missing = true; } catch (e) { /* keep as is */ } renderSlot(id); }
        saveState();
      },
      hasUndo() { return hist.length > 0; }
    };
    life.dispose = function () { for (const id of Object.keys(slotObj)) disposeSlot(id); group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); };
    return { group, colliders, seats, life, update() {}, bookMesh };
  }

  root.TrinityLife = { build, bookInfo, KEY };
  if (typeof module !== 'undefined') module.exports = root.TrinityLife;
})(typeof window !== 'undefined' ? window : globalThis);
