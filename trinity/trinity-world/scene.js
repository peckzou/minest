/* Trinity College, Cambridge - Great Court block-out (phase 1, step 1). three.js r128 meshes, all built in code.
 *
 * What is here: the four ranges of Great Court with ashlar walls, string courses, window openings (instanced),
 * crenellated parapets and slate roofs; the Great Gate (east) and Queen's Gate (south) as walkable gatehouses; the Chapel
 * (north); the Great Hall with its louvre (west); the Master's Lodge; King Edward's Tower with its clock; the octagonal
 * fountain; lawns, flagstone paths; Trinity Street outside. Static geometry is merged per material, repeated parts are
 * instanced, so the whole court is well under 30 draw calls.
 *
 * Every size is flagged ESTIMATE in world.js until it is checked against a survey plan. Positions of King Edward's
 * Tower and the Chapel along the north range, and the exact gate offsets, are NOT verified.
 *
 * Exposes TrinityScene = { build(world, THREE, tex, opts) -> { group, colliders, books, update, ... } }.
 */
(function (root) {
  'use strict';

  function mergeGeoms(list) {
    let n = 0;
    const parts = list.map((g) => { const ng = g.index ? g.toNonIndexed() : g; n += ng.attributes.position.count; return ng; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of parts) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += c;
    }
    const T = root.THREE, out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  }
  // world-space UVs so a texture keeps one size in metres on every merged piece
  function worldUV(g, scale) {
    const p = g.attributes.position, nn = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i));
      let u, v;
      if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
      else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
      else { u = p.getX(i); v = p.getY(i); }
      uv.setXY(i, u / scale, v / scale);
    }
  }

  function paneTexture(THREE) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#6f8aa6'); g.addColorStop(0.55, '#2c3947'); g.addColorStop(1, '#1b232d');
    x.fillStyle = g; x.fillRect(0, 0, 64, 128);
    x.strokeStyle = '#d9d2bf'; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(32, 0); x.lineTo(32, 128); x.stroke();                                         // mullion
    for (const y of [40, 84]) { x.beginPath(); x.moveTo(0, y); x.lineTo(64, y); x.stroke(); }              // transoms
    x.strokeStyle = 'rgba(210,205,190,0.35)'; x.lineWidth = 1;
    for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(0, i * 16); x.lineTo(64, i * 16); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function build(world, THREE, tex, opts) {
    opts = opts || {};
    const group = new THREE.Group();
    const colliders = [];
    const IX = world.IX, IZ = world.IZ, DEPTH = world.DEPTH;
    const Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), upY = new THREE.Vector3(0, 1, 0);
    function mat4(x, y, z, ry, sx, sy, sz) { Q.setFromAxisAngle(upY, ry || 0); V.set(x, y, z); Sc.set(sx || 1, sy || 1, sz || 1); return new THREE.Matrix4().compose(V, Q, Sc); }

    /* ---------- materials ---------- */
    const T = tex || {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const tStone = T.stone && T.stone(), tGrass = T.grass && T.grass(), tSlab = T.slab && T.slab(), tSlate = T.slate && T.slate(), tRoad = T.road && T.road();
    const mStone = std({ color: 0xffffff, map: tStone, roughness: 0.92, envMapIntensity: 0.35 });
    const mRoof = std({ color: 0xffffff, map: tSlate, roughness: 0.75, envMapIntensity: 0.4 });
    const mGrass = std({ color: 0xffffff, map: tGrass, roughness: 1.0, envMapIntensity: 0.2 });
    const mSlab = std({ color: 0xffffff, map: tSlab, roughness: 0.9, envMapIntensity: 0.3 });
    const mRoad = std({ color: 0xffffff, map: tRoad, roughness: 0.95, envMapIntensity: 0.15 });
    const mGround = std({ color: 0x8c9a7a, roughness: 1.0, envMapIntensity: 0.1 });
    const mTrim = std({ color: 0xf1e9d3, roughness: 0.85, envMapIntensity: 0.35 });
    const mGold = std({ color: 0xe2bc5a, roughness: 0.3, metalness: 1.0 });
    const mWater = std({ color: 0x4d7f9c, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.2 });
    const mStatue = std({ color: 0xd9d3c4, roughness: 0.7 });
    if (T.load) { const b = opts.base || ''; T.load(tStone, 'limestone_diff.jpg', b); T.load(tGrass, 'lawn_diff.jpg', b); T.load(tSlab, 'paving_diff.jpg', b); T.load(tSlate, 'roof_slate_diff.jpg', b); }

    /* ---------- merged static geometry ---------- */
    const batches = new Map();
    function add(mat, geo, m, uvScale) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (m) g.applyMatrix4(m);
      if (uvScale) worldUV(g, uvScale);
      if (!batches.has(mat)) batches.set(mat, []);
      batches.get(mat).push(g);
    }
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    function box(mat, x0, x1, y0, y1, z0, z1, collide) {
      add(mat, UNIT, mat4((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, x1 - x0, y1 - y0, z1 - z0), mat === mStone || mat === mTrim ? 2.4 : 1);
      if (collide) colliders.push({ min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } });
    }
    function plane(mat, x0, x1, z0, z1, y, tile) {
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
      add(mat, g, null, tile);
    }
    function prism(x0, x1, z0, z1, y0, rise, ridge) {          // gabled slate roof, ridge along 'x' or 'z'
      const span = ridge === 'x' ? z1 - z0 : x1 - x0, len = ridge === 'x' ? x1 - x0 : z1 - z0, ov = 0.45;
      const sh = new THREE.Shape(); sh.moveTo(-span / 2 - ov, 0); sh.lineTo(span / 2 + ov, 0); sh.lineTo(0, rise); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: len + ov * 2, bevelEnabled: false });
      g.translate(0, 0, -(len + ov * 2) / 2);
      if (ridge === 'x') g.rotateY(Math.PI / 2);
      g.translate((x0 + x1) / 2, y0, (z0 + z1) / 2);
      add(mRoof, g, null, 2.4);
    }
    function cyl(mat, x, z, y0, y1, r, seg, uvs) { const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg || 12); g.translate(x, (y0 + y1) / 2, z); add(mat, g, null, uvs || 0); }
    function cone(mat, x, z, y0, h, r, seg) { const g = new THREE.ConeGeometry(r, h, seg || 8); g.translate(x, y0 + h / 2, z); add(mat, g, null, 0); }

    /* ---------- windows + merlons (instanced) ---------- */
    const wins = [], merlons = [];
    // a row of windows along (x0,z0)->(x1,z1); (nx,nz) = outward normal of that face
    function windowRow(x0, z0, x1, z1, nx, nz, y, w, h, spacing, skip) {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(L / spacing)), step = L / n, dx = (x1 - x0) / L, dz = (z1 - z0) / L;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) * step, x = x0 + dx * t, z = z0 + dz * t;
        if (skip && skip(x, z)) continue;
        wins.push({ x: x + nx * 0.02, y, z: z + nz * 0.02, ry: Math.atan2(nx, nz), w, h });
      }
    }
    function storeys(x0, z0, x1, z1, nx, nz, eave, skip, wide) {
      const sp = wide || 3.7;
      windowRow(x0, z0, x1, z1, nx, nz, 2.6, 1.4, 2.3, sp, skip);
      if (eave > 8) windowRow(x0, z0, x1, z1, nx, nz, 6.4, 1.4, 2.3, sp, skip);
      if (eave > 11.5) windowRow(x0, z0, x1, z1, nx, nz, 9.7, 1.25, 1.9, sp, skip);
    }
    function parapet(x0, z0, x1, z1, y, nx, nz) {              // crenellations along a roof edge, set back a little
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 1.9), dx = (x1 - x0) / L, dz = (z1 - z0) / L;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) * (L / n); merlons.push({ x: x0 + dx * t - nx * 0.25, z: z0 + dz * t - nz * 0.25, y, ry: Math.atan2(dx, dz) }); }
      const mx = (x0 + x1) / 2 - nx * 0.25, mz = (z0 + z1) / 2 - nz * 0.25;
      add(mStone, UNIT, mat4(mx, y - 0.35, mz, Math.atan2(dx, dz), 0.5, 0.7, L), 2.4);
    }

    const H = 12.5;                                             // eaves of the ordinary ranges
    const GATE_W = 2.5, GATE_H = 5.6;

    /* ================= ground ================= */
    plane(mGround, -400, 400, -400, 400, -0.03, 8);
    plane(mSlab, -IX, IX, -IZ, IZ, 0.0, 3.6);                  // the court's paving
    // lawns in four quadrants (the paths form a cross and a ring)
    const PM = 3.6, PC = 1.6;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const xa = sx < 0 ? -IX + PM : PC, xb = sx < 0 ? -PC : IX - PM, za = sz < 0 ? -IZ + PM : PC, zb = sz < 0 ? -PC : IZ - PM;
      plane(mGrass, xa, xb, za, zb, 0.05, 4);
      box(mTrim, xa - 0.12, xb + 0.12, 0, 0.06, za - 0.12, za, false); box(mTrim, xa - 0.12, xb + 0.12, 0, 0.06, zb, zb + 0.12, false);
      box(mTrim, xa - 0.12, xa, 0, 0.06, za, zb, false); box(mTrim, xb, xb + 0.12, 0, 0.06, za, zb, false);
    }
    // Trinity Street, east of the Great Gate, with pavements
    const SX = IX + DEPTH;
    plane(mSlab, SX, SX + 3.2, -150, 150, 0.0, 3.6);
    plane(mRoad, SX + 3.2, SX + 15.2, -150, 150, 0.0, 6);
    plane(mSlab, SX + 15.2, SX + 22, -150, 150, 0.0, 3.6);
    for (let z = -140; z < 140; z += 6) box(mTrim, SX + 9.0, SX + 9.12, 0.0, 0.01, z, z + 3, false);   // centre dashes

    /* ================= east range + Great Gate ================= */
    {
      const x0 = IX, x1 = IX + DEPTH, zz = IZ + DEPTH;
      box(mStone, x0, x1, 0, H, -zz, -GATE_W, true); box(mStone, x0, x1, 0, H, GATE_W, zz, true);
      box(mStone, x0, x1, GATE_H, H, -GATE_W, GATE_W, true);
      // gatehouse tower
      box(mStone, x0, x1, H, 21, -6.8, 6.8, true);
      for (const sz of [-1, 1]) for (const sx of [0, 1]) { const cx = sx ? x1 - 0.6 : x0 + 0.6; cyl(mStone, cx, sz * 6.4, H, 24.2, 0.95, 10, 2.4); cone(mRoof, cx, sz * 6.4, 24.2, 3.2, 1.15, 10); }
      prism(x0, x1, -6.8, 6.8, 21, 3.2, 'z');
      box(mTrim, x0 - 0.15, x1 + 0.15, GATE_H + 0.0, GATE_H + 0.5, -GATE_W - 0.6, GATE_W + 0.6, false);   // arch hood
      for (const [fx, nx] of [[x0, -1], [x1, 1]]) {            // oriel + Henry VIII's niche on both faces
        box(mTrim, fx + nx * 0.05 - (nx < 0 ? 0.55 : 0), fx + nx * 0.05 + (nx > 0 ? 0.55 : 0), 14.2, 18.6, -1.8, 1.8, false);
        cyl(mStatue, fx + nx * 0.4, 0, 14.4, 15.6, 0.32, 8); const hd = new THREE.SphereGeometry(0.28, 10, 8); hd.translate(fx + nx * 0.4, 16.0, 0); add(mStatue, hd, null, 0);
        windowRow(fx, -5.4, fx, 5.4, nx, 0, 10.0, 1.3, 1.9, 2.7, (x, z) => Math.abs(z) < 3.2);
        windowRow(fx, -5.4, fx, 5.4, nx, 0, 19.2, 1.2, 1.7, 2.7, (x, z) => false);
        parapet(fx, -6.8, fx, 6.8, 21.5, nx, 0);
      }
      // the rest of the range
      const keepOut = (x, z) => Math.abs(z) < 7.6;
      storeys(x0, -IZ + 2.5, x0, IZ - 2.5, -1, 0, H, keepOut);                                  // court side
      storeys(x1, -zz + 3, x1, zz - 3, 1, 0, H, keepOut);                                       // street side
      parapet(x0, -zz, x0, -6.8, H + 0.9, -1, 0); parapet(x0, 6.8, x0, zz, H + 0.9, -1, 0);
      parapet(x1, -zz, x1, -6.8, H + 0.9, 1, 0); parapet(x1, 6.8, x1, zz, H + 0.9, 1, 0);
      box(mStone, x0, x1, H, H + 0.9, -zz, -6.8, false); box(mStone, x0, x1, H, H + 0.9, 6.8, zz, false);
      prism(x0 + 0.5, x1 - 0.5, -zz, -6.8, H + 0.9, 3.0, 'z'); prism(x0 + 0.5, x1 - 0.5, 6.8, zz, H + 0.9, 3.0, 'z');
      box(mTrim, x0 - 0.1, x0, 4.2, 4.45, -IZ, IZ, false); box(mTrim, x0 - 0.1, x0, 8.2, 8.4, -IZ, IZ, false);
    }

    /* ================= south range + Queen's Gate ================= */
    {
      const z0 = IZ, z1 = IZ + DEPTH;
      box(mStone, -IX, -GATE_W, 0, H, z0, z1, true); box(mStone, GATE_W, IX, 0, H, z0, z1, true);
      box(mStone, -GATE_W, GATE_W, GATE_H, H, z0, z1, true);
      box(mStone, -6.2, 6.2, H, 19, z0, z1, true);
      for (const sx of [-1, 1]) for (const sz of [0, 1]) { cyl(mStone, sx * 5.8, sz ? z1 - 0.6 : z0 + 0.6, H, 21.8, 0.9, 10, 2.4); cone(mRoof, sx * 5.8, sz ? z1 - 0.6 : z0 + 0.6, 21.8, 3.0, 1.1, 10); }
      prism(-6.2, 6.2, z0, z1, 19, 3.0, 'x');
      box(mTrim, -GATE_W - 0.6, GATE_W + 0.6, GATE_H, GATE_H + 0.5, z0 - 0.15, z1 + 0.15, false);
      box(mTrim, -1.8, 1.8, 13.6, 17.4, z0 - 0.55, z0 + 0.05, false);   // niche for Elizabeth I (court side)
      cyl(mStatue, 0, z0 - 0.35, 13.8, 15.0, 0.3, 8); { const hd = new THREE.SphereGeometry(0.26, 10, 8); hd.translate(0, 15.4, z0 - 0.35); add(mStatue, hd, null, 0); }
      const keepOut = (x) => Math.abs(x) < 7.2;
      storeys(-IX, z0, IX, z0, 0, -1, H, (x, z) => keepOut(x));
      windowRow(-5.2, z0, 5.2, z0, 0, -1, 9.8, 1.25, 1.9, 2.6, (x) => Math.abs(x) < 2.2);
      parapet(-IX, z0, -6.2, z0, H + 0.9, 0, -1); parapet(6.2, z0, IX, z0, H + 0.9, 0, -1); parapet(-6.2, z0, 6.2, z0, 19.5, 0, -1);
      box(mStone, -IX, IX, H, H + 0.9, z0, z1, false);
      prism(-IX, -6.2, z0 + 0.5, z1 - 0.5, H + 0.9, 3.0, 'x'); prism(6.2, IX, z0 + 0.5, z1 - 0.5, H + 0.9, 3.0, 'x');
      box(mTrim, -IX, IX, 4.2, 4.45, z0 - 0.1, z0, false); box(mTrim, -IX, IX, 8.2, 8.4, z0 - 0.1, z0, false);
    }

    /* ================= north range: Chapel + King Edward's Tower ================= */
    {
      const z1 = -IZ, zc = -IZ - 12.5;                          // chapel depth 12.5 (ESTIMATE)
      const cx0 = -36, cx1 = cx0 + 62.5;                         // ESTIMATE position, length 62.5 m is documented
      box(mStone, -IX, cx0, 0, H, -IZ - DEPTH, z1, true); box(mStone, cx1, IX, 0, H, -IZ - DEPTH, z1, true);
      box(mStone, cx0, cx1, 0, 15, zc, z1, true);
      prism(cx0, cx1, zc, z1, 15, 6.0, 'x');
      for (const [px, pz] of [[cx0 + 0.7, z1 - 0.7], [cx1 - 0.7, z1 - 0.7], [cx0 + 0.7, zc + 0.7], [cx1 - 0.7, zc + 0.7]]) { cyl(mStone, px, pz, 15, 19.4, 0.7, 8, 2.4); cone(mRoof, px, pz, 19.4, 2.4, 0.85, 8); }
      // tall perpendicular-style windows on the court side
      windowRow(cx0 + 4, z1, cx1 - 3, z1, 0, 1, 9.0, 2.3, 8.4, 5.2, null);
      box(mTrim, cx0, cx1, 4.2, 4.45, z1, z1 + 0.1, false); box(mTrim, cx0, cx1, 14.6, 15.0, z1, z1 + 0.18, false);
      // remaining stretches of the range
      storeys(-IX + 2, z1, cx0 - 1, z1, 0, 1, H, null); storeys(cx1 + 1, z1, IX - 2, z1, 0, 1, H, null);
      parapet(-IX, z1, cx0, z1, H + 0.9, 0, 1); parapet(cx1, z1, IX, z1, H + 0.9, 0, 1);
      box(mStone, -IX, cx0, H, H + 0.9, -IZ - DEPTH, z1, false); box(mStone, cx1, IX, H, H + 0.9, -IZ - DEPTH, z1, false);
      prism(-IX, cx0, -IZ - DEPTH + 0.5, z1 - 0.5, H + 0.9, 3.0, 'x'); prism(cx1, IX, -IZ - DEPTH + 0.5, z1 - 0.5, H + 0.9, 3.0, 'x');
      // King Edward's Tower (position along the range NOT verified)
      const tx0 = -46.5, tx1 = -38.5;
      box(mStone, tx0, tx1, H, 27, -IZ - DEPTH, z1 + 1.0, true);
      windowRow(tx0, z1 + 1.0, tx1, z1 + 1.0, 0, 1, 16.0, 1.2, 2.2, 3.0, null);
      const clk = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshStandardMaterial({ color: 0xf6f1e2, roughness: 0.5 }));
      clk.position.set((tx0 + tx1) / 2, 21.5, z1 + 1.04); group.add(clk);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.12, 8, 40), mGold); rim.position.copy(clk.position); group.add(rim);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 })); hand.position.set(clk.position.x, clk.position.y + 0.55, clk.position.z + 0.03); group.add(hand);
      const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 })); hand2.position.set(clk.position.x + 0.45, clk.position.y, clk.position.z + 0.03); hand2.rotation.z = -Math.PI / 2 + 0.3; group.add(hand2);
      for (const px of [tx0 + 0.6, tx1 - 0.6]) for (const pz of [-IZ - DEPTH + 0.6, z1 + 0.4]) { cyl(mStone, px, pz, 27, 30.4, 0.6, 8, 2.4); cone(mRoof, px, pz, 30.4, 2.2, 0.75, 8); }
      parapet(tx0, z1 + 1.0, tx1, z1 + 1.0, 27.5, 0, 1);
      prism(tx0 + 0.9, tx1 - 0.9, -IZ - DEPTH + 0.9, z1 + 0.1, 27, 3.0, 'x');
      box(mStone, tx0, tx1, 27, 27.9, -IZ - DEPTH, z1 + 1.0, false);
    }

    /* ================= west range: Hall, passage to Nevile's Court, Master's Lodge ================= */
    const hall = world.hall;
    {
      const wx1 = -IX, wx0 = -IX - DEPTH;
      const hz0 = hall.z0, hz1 = hall.z1, hH = 13.5, dz = hall.doorZ, GW = 2.4;
      const hx0 = hall.x - hall.W / 2 - 0.3;
      const pz0 = hz1, pz1 = hz1 + 3.4;                               // passage between hall and lodge
      const zz = IZ + DEPTH;
      // northern staircases (court's NW corner down to the Hall)
      box(mStone, wx0, wx1, 0, H, -IZ - DEPTH, hz0, true);
      storeys(wx1, -IZ + 2, wx1, hz0, 1, 0, H, null);
      storeys(wx0, -IZ - DEPTH + 3, wx0, hz0, -1, 0, H, null);
      parapet(wx1, -IZ - DEPTH, wx1, hz0, H + 0.9, 1, 0); box(mStone, wx0, wx1, H, H + 0.9, -IZ - DEPTH, hz0, false); prism(wx0 + 0.5, wx1 - 0.5, -IZ - DEPTH, hz0, H + 0.9, 3.0, 'z');
      // Great Hall outer shell (30.5 x 12.2 m); the court (east) wall has a doorway at dz
      box(mStone, hx0, wx1 + 0.3, 0, hH, hz0 - 0.3, hz0, true);       // north gable base
      box(mStone, hx0, wx1 + 0.3, 0, hH, hz1, hz1 + 0.3, true);       // south end
      box(mStone, hx0 - 0.3, hx0, 0, hH, hz0, hz1, true);            // west (back) wall
      box(mStone, wx1, wx1 + 0.3, 0, hH, hz0, dz - GW / 2, true);
      box(mStone, wx1, wx1 + 0.3, 0, hH, dz + GW / 2, hz1, true);
      box(mStone, wx1, wx1 + 0.3, GATE_H, hH, dz - GW / 2, dz + GW / 2, true);   // lintel over the court door
      box(mTrim, wx1 - 0.1, wx1 + 0.4, GATE_H, GATE_H + 0.4, dz - GW / 2 - 0.4, dz + GW / 2 + 0.4, false);
      prism(hx0, wx1 + 0.3, hz0, hz1, hH, 7.6, 'z');
      windowRow(wx1, hz0 + 3.0, wx1, hz1 - 3.0, 1, 0, 8.0, 2.3, 6.6, 5.4, (x, z) => Math.abs(z - dz) < 3.0);   // court-side windows
      windowRow(hx0, hz0 + 3.0, hx0, hz1 - 3.0, -1, 0, 8.0, 2.3, 6.6, 5.4, null);                              // back-wall windows
      box(mTrim, wx1 - 0.0, wx1 + 0.16, 4.2, 4.45, hz0, hz1, false);
      parapet(wx1, hz0, wx1, hz1, hH, 1, 0); box(mStone, wx1 - 0.3, wx1 + 0.3, hH, hH + 0.4, hz0, hz1, false);
      box(mStone, hall.x - 1.8, hall.x + 1.8, 20.6, 21.6, hz0 + (hz1 - hz0) * 0.42 - 1.0, hz0 + (hz1 - hz0) * 0.42 + 1.0, false);   // louvre
      cone(mRoof, hall.x, hz0 + (hz1 - hz0) * 0.42, 21.6, 3.0, 2.4, 4); cyl(mGold, hall.x, hz0 + (hz1 - hz0) * 0.42, 24.6, 26.2, 0.07, 6);
      // the screens passage (court -> Nevile's Court), then the Lodge
      box(mStone, hx0, wx1 + 0.3, GATE_H - 1.0, H, pz0, pz1, true);
      box(mStone, wx0, wx1, 0, H, pz1, zz, true);
      storeys(wx1, pz1, wx1, IZ - 2, 1, 0, H, null);
      storeys(wx0, pz1 + 1, wx0, zz - 3, -1, 0, H, null);
      parapet(wx1, pz1, wx1, zz, H + 0.9, 1, 0); box(mStone, wx0, wx1, H, H + 0.9, pz1, zz, false); prism(wx0 + 0.5, wx1 - 0.5, pz1, zz, H + 0.9, 3.0, 'z');
      box(mTrim, wx1, wx1 + 0.12, 4.2, 4.45, pz1, IZ, false);
      box(mStone, hx0, hx0 + 0.3, 0, H, pz0, pz1, true);              // passage closed until Nevile's Court exists
    }
    // the Great Hall interior
    const hallBuilt = root.TrinityHall ? root.TrinityHall.build(hall, THREE, T, opts) : null;
    if (hallBuilt) {
      group.add(hallBuilt.group); for (const c of hallBuilt.colliders) colliders.push(c);
      // a soft warm fill inside the enclosed hall so the panelling and portraits read in daytime
      const f1 = new THREE.PointLight(0xfff0d8, 0.5, 34, 1.6); f1.position.set(hall.x, 6, hall.z0 + 6); group.add(f1);
      const f2 = new THREE.PointLight(0xfff0d8, 0.45, 34, 1.6); f2.position.set(hall.x, 6, hall.z1 - 8); group.add(f2);
      const fh = new THREE.HemisphereLight(0xffe9c8, 0x3a2c1e, 0.35); fh.position.set(hall.x, 8, (hall.z0 + hall.z1) / 2); group.add(fh);
    }

    /* ================= fountain (octagonal conduit) ================= */
    {
      const R = 4.3, wR = 3.7;
      const basin = new THREE.CylinderGeometry(R, R * 1.04, 1.0, 8, 1, false); basin.rotateY(Math.PI / 8); basin.translate(0, 0.5, 0); add(mStone, basin, null, 2.4);
      const rim = new THREE.CylinderGeometry(R + 0.22, R + 0.22, 0.18, 8); rim.rotateY(Math.PI / 8); rim.translate(0, 1.05, 0); add(mTrim, rim, null, 2.4);
      colliders.push({ min: { x: -R, y: 0, z: -R }, max: { x: R, y: 1.2, z: R } });
      const water = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR, 0.05, 8), mWater); water.rotation.y = Math.PI / 8; water.position.y = 0.96; group.add(water);
      // the conduit: central shaft, eight columns, an arcade ring and a lantern roof
      cyl(mStone, 0, 0, 1.0, 4.4, 0.55, 8, 2.4); cyl(mStone, 0, 0, 0.9, 1.5, 1.4, 8, 2.4);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cyl(mStone, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 1.0, 4.6, 0.17, 8, 2.4); }
      const ring = new THREE.CylinderGeometry(2.6, 2.6, 0.35, 8); ring.rotateY(Math.PI / 8); ring.translate(0, 4.75, 0); add(mTrim, ring, null, 2.4);
      cone(mRoof, 0, 0, 4.9, 2.2, 2.7, 8); cyl(mStone, 0, 0, 7.0, 7.9, 0.28, 8, 2.4); cone(mGold, 0, 0, 7.9, 1.0, 0.32, 8);
    }

    flush();
    function flush() {
      for (const [mat, list] of batches) {
        const mesh = new THREE.Mesh(mergeGeoms(list), mat);
        mesh.castShadow = mat !== mGround && mat !== mSlab && mat !== mRoad; mesh.receiveShadow = true;
        group.add(mesh);
      }
      batches.clear();
    }

    /* ================= instanced windows and merlons ================= */
    const paneMap = paneTexture(THREE);
    const mPane = std({ color: 0xffffff, map: paneMap, roughness: 0.15, metalness: 0.5, envMapIntensity: 1.0 });
    const panes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mPane, wins.length);
    const frames = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mTrim, wins.length);
    const sills = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mTrim, wins.length);
    wins.forEach((w, i) => {
      const nx = Math.sin(w.ry), nz = Math.cos(w.ry);
      panes.setMatrixAt(i, mat4(w.x + nx * 0.12, w.y, w.z + nz * 0.12, w.ry, w.w, w.h, 1));
      frames.setMatrixAt(i, mat4(w.x + nx * 0.05, w.y, w.z + nz * 0.05, w.ry, w.w + 0.55, w.h + 0.55, 0.1));
      sills.setMatrixAt(i, mat4(w.x + nx * 0.12, w.y - w.h / 2 - 0.35, w.z + nz * 0.12, w.ry, w.w + 0.8, 0.14, 0.26));
    });
    for (const m of [panes, frames, sills]) { m.instanceMatrix.needsUpdate = true; m.receiveShadow = true; group.add(m); }
    const mer = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, 0.8, 0.5), mStone, merlons.length);
    merlons.forEach((m, i) => mer.setMatrixAt(i, mat4(m.x, m.y + 0.4, m.z, m.ry, 1, 1, 1)));
    mer.instanceMatrix.needsUpdate = true; mer.castShadow = true; group.add(mer);

    /* ================= buildings across Trinity Street (placeholder facades) ================= */
    {
      const bx0 = SX + 24, bx1 = SX + 36, list = [];
      const wall = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0, 11, 280), mStone);
      wall.position.set((bx0 + bx1) / 2, 5.5, 0); wall.castShadow = true; wall.receiveShadow = true; group.add(wall);
      colliders.push({ min: { x: bx0, y: 0, z: -140 }, max: { x: bx1, y: 11, z: 140 } });
      const st = [];
      for (let z = -136; z < 136; z += 3.8) for (const y of [2.6, 6.4]) st.push([z, y]);
      const sp = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mPane, st.length);
      st.forEach(([z, y], i) => sp.setMatrixAt(i, mat4(bx0 - 0.05, y, z, -Math.PI / 2, 1.3, 2.0, 1)));
      sp.instanceMatrix.needsUpdate = true; group.add(sp);
      const fr = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mTrim, st.length);
      st.forEach(([z, y], i) => fr.setMatrixAt(i, mat4(bx0 - 0.02, y, z, -Math.PI / 2, 1.9, 2.6, 0.1)));
      fr.instanceMatrix.needsUpdate = true; group.add(fr);
    }
    // keep the player inside: wall off the street ends, and the college's west boundary
    colliders.push({ min: { x: SX - 1, y: 0, z: -151 }, max: { x: SX + 40, y: 10, z: -150 } });
    colliders.push({ min: { x: SX - 1, y: 0, z: 150 }, max: { x: SX + 40, y: 10, z: 151 } });

    /* ================= API (same shape as Admont's) ================= */
    const books = { mesh: new THREE.Group(), count: 0, ids: [], meta: [], index: Object.create(null), setCollected() {} };
    return { group, colliders, books, cases: [], sculptures: [], windows: wins.length, frescoes: 0, doorLeaves: {}, update() {}, merlons: merlons.length };
  }

  root.TrinityScene = { build, mergeGeoms };
  if (typeof module !== 'undefined') module.exports = root.TrinityScene;
})(typeof window !== 'undefined' ? window : globalThis);
