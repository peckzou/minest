/* Admont Abbey Library - three.js MESH builders (Option D, three.js r128).
 *
 * The whole interior, built in code:
 *   - illusionistic marble floor (rhomb inlay that reads as 3D cubes)
 *   - two long walls: solid lower storey, tall windows in the upper storey, gilt cornice
 *   - lower bookcases along every wall, a gallery with a balustrade, upper bookcases
 *     between the windows; about 10 000 book spines in ONE InstancedMesh
 *   - six vaulted ceiling bays + the central dome = the 7 Altomonte frescoes (frescoes.js)
 *   - 16 Stammel sculpture proxies: the Four Last Things groups in the rotunda corners and
 *     12 single figures in the two halls; 2 gilt reliefs over the end doors
 *   - window glass + soft light shafts on the sunny side
 *
 * Static architecture is merged per material (Batch) so the scene stays well under 80 draw
 * calls. Higher-fidelity CC0 meshes could later replace the sculpture proxies in
 * buildSculptures(); no GLTF loader is wired by default.
 *
 * Collect-books hook: every book instance has a stable id "<case>-<row>-<n>" (deterministic
 * seed, so ids survive reloads). books.ids[i] maps instanceId -> id, books.meta[i] gives the
 * case and wing, books.setCollected(i, on) tints the spine gold. app.js raycasts and persists.
 *
 * Exposes AdmontScene = { build(world, THREE, tex, opts) -> { group, colliders, books, cases,
 *   doorLeaves, update(dt) } }.
 */
(function (root) {
  'use strict';

  const C = {
    wall: 0xf7f4ec, gold: 0xe2bc5a, caseWhite: 0xf4eee0, shelf: 0xe9e0cc,
    stone: 0xe8e2d6, bronze: 0x4e3a24, door: 0x7a5a3a
  };

  /* ---------- tiny geometry merge (r128 core has no BufferGeometryUtils) ---------- */
  function mergeGeoms(list) {
    let n = 0;
    const parts = list.map((g) => { const ng = g.index ? g.toNonIndexed() : g; n += ng.attributes.position.count; return ng; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let hasCol = parts.some((g) => g.attributes.color), col = hasCol ? new Float32Array(n * 3) : null;
    let o = 0;
    for (const g of parts) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      if (col) { if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); }
      o += c;
    }
    const T = root.THREE, out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    if (col) out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  }
  // world-space box UVs: textures keep a constant size in metres on merged boxes
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

  function build(world, THREE, tex, opts) {
    opts = opts || {};
    const q = opts.q || 1;
    const group = new THREE.Group();
    const colliders = [];
    const X0 = world.X0, X1 = world.X1, Z0 = world.Z0, Z1 = world.Z1;
    const W = world.W, D = world.D, H = world.H, DOME_H = world.DOME_H;
    const WALL_T = 0.6, IN = D / 2 - WALL_T / 2;        // inner wall face at z = +-6.7
    const XIN = W / 2 - WALL_T / 2;                      // inner end-wall face at x = +-34.7
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    const upY = new THREE.Vector3(0, 1, 0);
    function mat4(x, y, z, ry, sx, sy, sz) {
      Q.setFromAxisAngle(upY, ry || 0); V.set(x, y, z); Sc.set(sx || 1, sy || 1, sz || 1);
      return new THREE.Matrix4().compose(V, Q, Sc);
    }

    /* ---------- materials ---------- */
    const T = tex || {};
    function std(o) { return new THREE.MeshStandardMaterial(o); }
    const tWall = T.stuccoWall && T.stuccoWall();
    const tGold = T.goldTrim && T.goldTrim();
    const tCase = T.woodCase && T.woodCase();
    const mWall = std({ color: C.wall, map: tWall, roughness: 0.9, envMapIntensity: 0.6 });
    const mGold = std({ color: C.gold, map: tGold, roughness: 0.28, metalness: 1.0 });
    const mCase = std({ color: C.caseWhite, map: tCase, roughness: 0.55, envMapIntensity: 0.6 });
    const mShelf = std({ color: C.shelf, roughness: 0.8 });
    const mStone = std({ color: C.stone, roughness: 0.35 });
    const mBronze = std({ color: C.bronze, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.45 });
    const mDoor = std({ color: C.door, roughness: 0.6 });
    const tFloor = T.marbleFloor && T.marbleFloor();
    if (tFloor && tFloor.userData && tFloor.userData.tile) tFloor.repeat.set(W / tFloor.userData.tile[0], D / tFloor.userData.tile[1]);
    const mFloor = std({ color: 0xe8e4dc, map: tFloor, roughness: 0.2, metalness: 0.0, envMapIntensity: 0.7 });
    if (T.load) {
      const b = opts.base || '';
      T.load(tWall, 'white_plaster_diff.jpg', b); T.load(tGold, 'gold_leaf_diff.jpg', b);
      T.load(tCase, 'carved_wood_diff.jpg', b); T.load(tFloor, 'marble_floor_diff.jpg', b);
    }

    /* ---------- Batch: collect static boxes/geometries per material, merge at the end ---------- */
    const batches = new Map();
    function add(mat, geo, m, uvScale) {
      const g = (geo.index ? geo.toNonIndexed() : geo.clone());
      if (m) g.applyMatrix4(m);
      if (uvScale) worldUV(g, uvScale);
      if (!batches.has(mat)) batches.set(mat, []);
      batches.get(mat).push(g);
    }
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    function box(mat, w, h, d, x, y, z, collide, ry) {
      add(mat, UNIT, mat4(x, y, z, ry || 0, w, h, d), mat === mGold ? 0.6 : 2);
      if (collide) colliders.push({ min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 }, max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 } });
    }
    function flush() {
      for (const [mat, list] of batches) {
        const mesh = new THREE.Mesh(mergeGeoms(list), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        group.add(mesh);
      }
      batches.clear();
    }

    /* ================= floor ================= */
    {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mFloor);
      m.rotation.x = -Math.PI / 2; m.receiveShadow = true; group.add(m);
    }

    /* ================= walls ================= */
    // upper storey: tall windows between piers, one window bay every 5 m
    const BAY = 5, NB = Math.round(W / BAY), PIER = 2.6, WIN_W = BAY - PIER;
    const SILL = 4.8, WIN_TOP = 9.8, GAL_Y = 4.38, GAL_D = 1.2;
    const windows = [];
    for (const zc of [Z0, Z1]) {
      const s = Math.sign(zc);
      box(mWall, W, SILL, WALL_T, 0, SILL / 2, zc, true);                                   // solid lower storey
      box(mWall, W, H - WIN_TOP, WALL_T, 0, WIN_TOP + (H - WIN_TOP) / 2, zc, true);         // above the windows
      for (let i = 0; i <= NB; i++) box(mWall, PIER, WIN_TOP - SILL, WALL_T, X0 + i * BAY, (SILL + WIN_TOP) / 2, zc, true);
      for (let i = 0; i < NB; i++) windows.push({ x: X0 + BAY / 2 + i * BAY, z: zc, s });
      box(mGold, W, 0.5, 0.35, 0, H - 0.4, s * (IN - 0.15), false);                          // gilt cornice
      box(mWall, W, 0.3, 0.55, 0, H - 0.8, s * (IN - 0.25), false);                          // cornice bed
      box(mGold, W, 0.08, 0.6, 0, H - 0.98, s * (IN - 0.3), false);
    }
    // end walls with doorways
    const DOOR_W = 2.6, DOOR_H = 4.6;
    for (const xc of [X0, X1]) {
      const sw = (D - DOOR_W) / 2, sx = Math.sign(xc);
      box(mWall, WALL_T, H, sw, xc, H / 2, Z0 + sw / 2, true);
      box(mWall, WALL_T, H, sw, xc, H / 2, Z1 - sw / 2, true);
      box(mWall, WALL_T, H - DOOR_H, DOOR_W, xc, DOOR_H + (H - DOOR_H) / 2, 0, true);
      // gilt door surround and pediment
      box(mGold, 0.12, 0.28, DOOR_W + 0.6, xc - sx * 0.32, DOOR_H + 0.14, 0, false);
      box(mGold, 0.12, DOOR_H, 0.2, xc - sx * 0.32, DOOR_H / 2, DOOR_W / 2 + 0.1, false);
      box(mGold, 0.12, DOOR_H, 0.2, xc - sx * 0.32, DOOR_H / 2, -DOOR_W / 2 - 0.1, false);
      box(mGold, 0.5, 0.5, 0.7 * D, xc - sx * 0.15, H - 0.4, 0, false);                          // cornice
      for (const zw of [-4.2, 4.2]) windows.push({ x: xc, z: zw, s: 0, end: sx });               // upper end windows
    }
    for (const xc of [X0, X1]) {   // piers of the end windows: the end wall itself, plus surrounds
      const sx = Math.sign(xc);
      for (const zw of [-4.2, 4.2]) {
        box(mGold, 0.1, 0.18, 2.2, xc - sx * 0.31, 9.9, zw, false);
        box(mGold, 0.1, 0.18, 2.2, xc - sx * 0.31, 5.3, zw, false);
      }
    }

    /* ================= window glass + light shafts ================= */
    {
      const glassG = [];
      for (const w of windows) {
        if (w.end) { const g = new THREE.PlaneGeometry(2.0, 4.4); g.applyMatrix4(mat4(w.x - w.end * (WALL_T / 2 + 0.02), 7.6, w.z, -w.end * Math.PI / 2)); glassG.push(g); }
        else { const g = new THREE.PlaneGeometry(WIN_W, WIN_TOP - SILL); g.applyMatrix4(mat4(w.x, (SILL + WIN_TOP) / 2, w.z + w.s * 0.05, w.s > 0 ? Math.PI : 0)); glassG.push(g); }
      }
      // the end walls are solid boxes: cut nothing, the glass sits on the inner face as a bright panel
      const tg = T.windowGlass && T.windowGlass();
      const mGlass = new THREE.MeshBasicMaterial({ map: tg, color: 0xffffff, fog: false });
      mGlass.color.setScalar(1.35);
      const glass = new THREE.Mesh(mergeGeoms(glassG), mGlass);
      group.add(glass);
      // the end-window panels must sit just inside the wall
      // (handled by the -w.end*0.05 offset above: inner face is at x = +-34.7)
    }
    // shafts: sunlight enters through the +z windows and falls toward -z (matches app.js sun)
    const SUN = new THREE.Vector3(-18, -30, -24).normalize();
    {
      const pos = [], col = [];
      function quad(a, b, c, d, ca, cb) { // a,b near the window (bright), c,d at the floor (dim)
        for (const [p, k] of [[a, ca], [b, ca], [c, cb], [a, ca], [c, cb], [d, cb]]) { pos.push(p.x, p.y, p.z); col.push(k * 1.0, k * 0.93, k * 0.78); }
      }
      for (const w of windows) {
        if (w.s <= 0) continue;
        const zf = w.z - WALL_T / 2;
        const corners = [[-WIN_W / 2 + 0.2, SILL + 0.2], [WIN_W / 2 - 0.2, SILL + 0.2], [WIN_W / 2 - 0.2, WIN_TOP - 0.2], [-WIN_W / 2 + 0.2, WIN_TOP - 0.2]];
        const top = corners.map(([dx, y]) => new THREE.Vector3(w.x + dx, y, zf));
        const bot = top.map((p) => p.clone().addScaledVector(SUN, -p.y / SUN.y));     // hit the floor
        for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; quad(top[k], top[k2], bot[k2], bot[k], 0.022, 0.0); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const shafts = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      shafts.renderOrder = 5;
      group.add(shafts);
    }

    /* ================= bookcases + books ================= */
    const books = { pos: [], rotY: [], scale: [], color: [], ids: [], meta: [] };
    const cases = [];
    let rs = 1776;
    const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
    const PALE = [0xf4ecd8, 0xefe4cc, 0xf6efdf, 0xe8dcc0, 0xf1e6cf];
    const DARK = [0x7a4a2a, 0x5a3620, 0x8a5a2e, 0x6a2a20, 0x3c2a1c, 0x9a6a3a];
    function wingOf(x) { return x < world.NORTH_X1 ? 'adm_north' : x > world.SOUTH_X0 ? 'adm_south' : 'adm_rotunda'; }

    // a run of shelving along an axis. axis 'x': case runs along x against a z-wall;
    // axis 'z': along z against an x-wall. out = +-1, the direction from the wall into the room.
    function shelving(id, axis, a0, a1, wallAt, out, y0, y1, depth, rows, modW) {
      const len = a1 - a0, cen = (a0 + a1) / 2;
      const face = wallAt + out * depth;                    // front plane of the case
      const ctr = wallAt + out * depth / 2;
      const B = (w, h, d, a, y, n) => axis === 'x' ? box(mCase, w, h, d, a, y, n, false) : box(mCase, d, h, w, n, y, a, false);
      const G = (w, h, d, a, y, n) => axis === 'x' ? box(mGold, w, h, d, a, y, n, false) : box(mGold, d, h, w, n, y, a, false);
      const S = (w, h, d, a, y, n) => axis === 'x' ? box(mShelf, w, h, d, a, y, n, false) : box(mShelf, d, h, w, n, y, a, false);
      const ht = y1 - y0;
      S(len, ht, 0.06, cen, y0 + ht / 2, wallAt + out * 0.03);                   // back board
      G(len + 0.1, 0.22, depth + 0.08, cen, y0 + 0.11, ctr + out * 0.04);        // gilt plinth
      G(len + 0.14, 0.26, depth + 0.14, cen, y1 - 0.13, ctr + out * 0.07);       // gilt cornice
      B(len, 0.12, depth + 0.04, cen, y1 - 0.32, ctr + out * 0.02);              // frieze
      const nMod = Math.max(1, Math.round(len / modW)), mw = len / nMod;
      for (let i = 0; i <= nMod; i++) {
        const a = a0 + i * mw;
        B(0.1, ht - 0.2, depth + 0.02, a, y0 + ht / 2, ctr + out * 0.01);         // upright
        G(0.035, ht - 0.7, 0.02, a, y0 + ht / 2, face + out * 0.025);            // gilt strip
      }
      const usable0 = y0 + 0.22, usable1 = y1 - 0.38, rowH = (usable1 - usable0) / rows;
      for (let r = 0; r <= rows; r++) S(len, 0.035, depth - 0.04, cen, usable0 + r * rowH, ctr);
      const caseRec = { id, axis, a0, a1, wall: wallAt, out, y0, y1, wing: wingOf(axis === 'x' ? cen : wallAt), books: [] };
      cases.push(caseRec);
      // books
      const bookD = depth - 0.12;
      for (let r = 0; r < rows; r++) {
        const yb = usable0 + r * rowH + 0.02;
        const hMax = rowH - 0.07;
        let n = 0;
        for (let mI = 0; mI < nMod; mI++) {
          let a = a0 + mI * mw + 0.07;
          const aEnd = a0 + (mI + 1) * mw - 0.07;
          while (a < aEnd - 0.03) {
            const t = 0.035 + rnd() * 0.06;
            if (a + t > aEnd) break;
            if (rnd() < 0.015) { a += 0.05 + rnd() * 0.1; continue; }             // a small gap
            const h = hMax * (0.78 + rnd() * 0.22);
            const along = a + t / 2;
            const n0 = face - out * (0.035 + bookD / 2);
            const dark = rnd() < 0.32;
            const colr = dark ? DARK[(rnd() * DARK.length) | 0] : PALE[(rnd() * PALE.length) | 0];
            books.pos.push(axis === 'x' ? along : n0, yb + h / 2, axis === 'x' ? n0 : along);
            books.rotY.push(axis === 'x' ? (out > 0 ? 0 : Math.PI) : (out > 0 ? Math.PI / 2 : -Math.PI / 2));
            books.scale.push(t, h, bookD);
            books.color.push(colr);
            books.ids.push(id + '-' + r + '-' + n);
            books.meta.push({ case: id, wing: caseRec.wing, row: r });
            caseRec.books.push(books.ids.length - 1);
            n++; a += t + 0.004;
          }
        }
      }
      // collider for the case body
      if (axis === 'x') colliders.push({ min: { x: a0, y: y0, z: Math.min(wallAt, face) }, max: { x: a1, y: y1, z: Math.max(wallAt, face) } });
      else colliders.push({ min: { x: Math.min(wallAt, face), y: y0, z: a0 }, max: { x: Math.max(wallAt, face), y: y1, z: a1 } });
      return caseRec;
    }

    const LOW_D = 0.55, UP_D = 0.42;
    // lower storey: one run per wall per section (north hall / rotunda / south hall)
    const runs = [[X0 + 0.35, world.NORTH_X1, 'N'], [world.NORTH_X1, world.SOUTH_X0, 'R'], [world.SOUTH_X0, X1 - 0.35, 'S']];
    for (const zs of [-1, 1]) {
      for (const [a0, a1, tag] of runs) shelving('L' + tag + (zs > 0 ? '+' : '-'), 'x', a0, a1, zs * IN, -zs, 0, 4.2, LOW_D, 6, 1.3);
    }
    // the end walls, either side of the door
    for (const xs of [-1, 1]) {
      for (const zs of [-1, 1]) {
        const a0 = zs < 0 ? -(IN - LOW_D) : DOOR_W / 2 + 0.35, a1 = zs < 0 ? -(DOOR_W / 2 + 0.35) : IN - LOW_D;
        shelving('E' + (xs > 0 ? 'S' : 'N') + (zs > 0 ? '+' : '-'), 'z', a0, a1, xs * XIN, -xs, 0, 4.2, LOW_D, 6, 1.3);
      }
    }
    // upper storey: a case on each pier between the windows
    for (const zs of [-1, 1]) {
      for (let i = 1; i < NB; i++) {
        const xc = X0 + i * BAY;
        shelving('U' + (zs > 0 ? '+' : '-') + (i < 10 ? '0' : '') + i, 'x', xc - (PIER - 0.2) / 2, xc + (PIER - 0.2) / 2, zs * IN, -zs, GAL_Y, WIN_TOP, UP_D, 8, 1.2);
      }
    }

    /* ================= gallery + balustrade ================= */
    {
      const balG = [];
      const bal = new THREE.CylinderGeometry(0.035, 0.05, 0.78, 6);
      for (const zs of [-1, 1]) {
        const zEdge = zs * (IN - GAL_D);
        box(mCase, W - 1.2, 0.18, GAL_D, 0, GAL_Y - 0.09, zs * (IN - GAL_D / 2), true);   // walkable floor
        box(mGold, W - 1.2, 0.12, 0.08, 0, GAL_Y - 0.12, zEdge, false);                      // gilt edge
        box(mGold, W - 1.2, 0.08, 0.12, 0, GAL_Y + 0.92, zEdge, false);                      // hand rail
        box(mCase, W - 1.2, 0.06, 0.1, 0, GAL_Y + 0.05, zEdge, false);
        colliders.push({ min: { x: X0 + 0.6, y: GAL_Y, z: zEdge - 0.06 }, max: { x: X1 - 0.6, y: GAL_Y + 1.0, z: zEdge + 0.06 } });
        for (let x = X0 + 0.8; x < X1 - 0.7; x += 0.26) { const g = bal.clone(); g.translate(x, GAL_Y + 0.47, zEdge); balG.push(g); }
        // gilt consoles under the gallery edge, one per bookcase module
        for (let x = X0 + 1; x < X1 - 0.8; x += 2.6) box(mGold, 0.16, 0.45, GAL_D - LOW_D, x, GAL_Y - 0.4, zs * (IN - LOW_D - (GAL_D - LOW_D) / 2), false);
      }
      for (const g of balG) add(mCase, g, null, 0);
    }

    /* ================= transverse gilt arches between the sections and bays ================= */
    const wingLen = world.NORTH_X1 - X0, bayLen = wingLen / 3;
    const archXs = [world.NORTH_X1, world.SOUTH_X0, X0 + bayLen, X0 + 2 * bayLen, world.SOUTH_X0 + bayLen, world.SOUTH_X0 + 2 * bayLen];
    for (const ax of archXs) {
      const main = Math.abs(ax) === world.ROT_HALF;
      box(mWall, main ? 1.0 : 0.6, 0.5, D - 1.2, ax, H - 0.25, 0, false);
      box(mGold, main ? 1.1 : 0.7, 0.1, D - 1.2, ax, H - 0.52, 0, false);
      if (main) for (const zs of [-1, 1]) {      // gilt pilaster pair framing the rotunda
        box(mWall, 1.0, H - 4.2 - 0.5, 0.25, ax, 4.2 + (H - 4.7) / 2, zs * (IN - 0.13), false);
        box(mGold, 0.14, H - 5.2, 0.06, ax, 4.4 + (H - 5.2) / 2, zs * (IN - 0.28), false);
      }
    }

    /* ================= ceilings: 6 fresco vaults + the dome ================= */
    const F = root.AdmontFrescoes;
    const frescoMats = [];
    function frescoMat(i) {
      const f = F ? F.make(i, { q: q, base: opts.base }) : null;
      const m = std({ color: 0xffffff, map: f && f.tex, roughness: 0.92, emissive: 0xffffff, emissiveMap: f && f.tex, emissiveIntensity: 0.32 });
      m.shadowSide = THREE.DoubleSide;
      frescoMats.push(m);
      return m;
    }
    function vault(x0, x1, matI, rise) {
      const len = x1 - x0, g = new THREE.PlaneGeometry(len, D - 0.2, 24, 36), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const px = p.getX(i), py = p.getY(i);
        p.setZ(i, -rise * Math.cos(Math.PI * px / len) * Math.cos(Math.PI * py / (D - 0.2)));
      }
      g.computeVertexNormals();
      g.rotateX(Math.PI / 2); g.translate((x0 + x1) / 2, H, 0);
      const m = new THREE.Mesh(g, frescoMat(matI));
      m.castShadow = true; m.receiveShadow = false;
      group.add(m);
    }
    const RISE = 1.0;
    for (let b = 0; b < 3; b++) vault(X0 + b * bayLen, X0 + (b + 1) * bayLen, b, RISE);
    for (let b = 0; b < 3; b++) vault(world.SOUTH_X0 + b * bayLen, world.SOUTH_X0 + (b + 1) * bayLen, 4 + b, RISE);
    // the rotunda: flat stucco ceiling with a round opening, a short drum, the dome
    {
      const R = D / 2 - 0.35, DRUM = 0.5, domeRise = DOME_H - H - DRUM;
      const sh = new THREE.Shape();
      const rx = world.ROT_HALF;
      sh.moveTo(-rx, -D / 2); sh.lineTo(rx, -D / 2); sh.lineTo(rx, D / 2); sh.lineTo(-rx, D / 2); sh.lineTo(-rx, -D / 2);
      const hole = new THREE.Path(); hole.absarc(0, 0, R, 0, Math.PI * 2, true); sh.holes.push(hole);
      const cg = new THREE.ShapeGeometry(sh, 48); cg.rotateX(Math.PI / 2); cg.translate(0, H, 0);
      add(mWall, cg, null, 2);
      const drum = new THREE.CylinderGeometry(R, R, DRUM, 64, 1, true);
      const mDrum = std({ color: C.wall, map: tWall, roughness: 0.9, side: THREE.BackSide }); mDrum.shadowSide = THREE.DoubleSide;
      const dm = new THREE.Mesh(drum, mDrum); dm.position.set(0, H + DRUM / 2, 0); dm.castShadow = true; group.add(dm);
      const ring = new THREE.TorusGeometry(R - 0.02, 0.09, 6, 96); ring.rotateX(Math.PI / 2);
      add(mGold, ring, mat4(0, H + 0.02, 0), 0); add(mGold, ring, mat4(0, H + DRUM, 0), 0);
      const dg = new THREE.RingGeometry(0.001, R, 96, 28), p = dg.attributes.position;
      for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)) / R; p.setZ(i, -domeRise * Math.sqrt(Math.max(0, 1 - r * r))); }
      dg.computeVertexNormals(); dg.rotateX(Math.PI / 2); dg.translate(0, H + DRUM, 0);
      const dome = new THREE.Mesh(dg, frescoMat(3)); dome.castShadow = true; group.add(dome);
      // flat ceiling strips over the window line so no gap shows above the cornice
    }

    /* ================= sculptures (Josef Stammel, proxies) ================= */
    // Stammel's figures are carved limewood with a bronze-coloured finish, so the proxies use
    // a dark bronze material, not white marble.
    const sculpt = [];
    function figure(m, s, pose) {
      pose = pose || {};
      const prof = [[0.30, 0], [0.33, 0.08], [0.27, 0.5], [0.21, 0.95], [0.17, 1.22], [0.21, 1.36], [0.13, 1.47], [0.06, 1.52], [0.001, 1.53]].map(([r, y]) => new THREE.Vector2(r * s, y * s));
      const robe = new THREE.LatheGeometry(prof, 14);
      const tilt = new THREE.Matrix4().makeRotationZ(pose.lean || 0);
      const push = (g, local) => { g.applyMatrix4(local || new THREE.Matrix4()); g.applyMatrix4(tilt); g.applyMatrix4(m); sculpt.push(g); };
      push(robe);
      push(new THREE.SphereGeometry(0.115 * s, 12, 9), new THREE.Matrix4().makeTranslation(0, 1.65 * s, 0.01 * s));
      const arm = (ang, side, fwd) => {
        const g = new THREE.CylinderGeometry(0.05 * s, 0.04 * s, 0.62 * s, 6); g.translate(0, -0.31 * s, 0);
        const r = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-(fwd || 0), 0, side * ang));
        r.premultiply(new THREE.Matrix4().makeTranslation(side * 0.2 * s, 1.42 * s, 0));
        push(g, r);
      };
      arm(pose.l != null ? pose.l : 0.35, -1, pose.lf); arm(pose.r != null ? pose.r : 0.35, 1, pose.rf);
      if (pose.wings) for (const sd of [-1, 1]) {
        const w = new THREE.SphereGeometry(1, 10, 6); w.scale(0.05 * s, 0.55 * s, 0.32 * s);
        push(w, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.4, sd * 0.5, sd * 0.5)).premultiply(new THREE.Matrix4().makeTranslation(sd * 0.22 * s, 1.55 * s, -0.22 * s)));
      }
      if (pose.book) push(new THREE.BoxGeometry(0.26 * s, 0.05 * s, 0.2 * s), new THREE.Matrix4().makeTranslation(0.22 * s, 1.05 * s, 0.2 * s));
      if (pose.globe) push(new THREE.SphereGeometry(0.16 * s, 12, 8), new THREE.Matrix4().makeTranslation(-0.3 * s, 0.9 * s, 0.18 * s));
      if (pose.skull) push(new THREE.SphereGeometry(0.1 * s, 10, 7), new THREE.Matrix4().makeTranslation(0.25 * s, 0.25 * s, 0.25 * s));
      if (pose.trumpet) { const t = new THREE.CylinderGeometry(0.06 * s, 0.015 * s, 0.7 * s, 8); push(t, new THREE.Matrix4().makeRotationX(-1.1).premultiply(new THREE.Matrix4().makeTranslation(0.12 * s, 1.75 * s, 0.32 * s))); }
    }
    function pedestal(x, z, w, h, d, ry) {
      box(mStone, w, h, d, x, h / 2, z, true, ry);
      box(mGold, w + 0.08, 0.08, d + 0.08, x, h - 0.04, z, false, ry);
      box(mGold, w + 0.1, 0.1, d + 0.1, x, 0.05, z, false, ry);
    }
    // the Four Last Things, at the four corners of the rotunda, facing the centre
    const LAST = [
      { name: '死亡 Death', x: -6.2, z: -4.4, main: { l: 0.2, r: 1.2, skull: true }, side: [{ lean: 0.4, l: 0.9 }, { lean: -0.2 }] },
      { name: '审判 Last Judgement', x: 6.2, z: -4.4, main: { trumpet: true, r: 2.4, l: 0.3, wings: true }, side: [{ book: true }, { lean: 0.25, l: 1.4 }] },
      { name: '地狱 Hell', x: -6.2, z: 4.4, main: { lean: 0.35, l: 2.2, r: 1.8 }, side: [{ lean: -0.5, l: 2.4 }, { lean: 0.6, r: 2.0 }] },
      { name: '天堂 Heaven', x: 6.2, z: 4.4, main: { wings: true, l: 2.6, r: 2.6 }, side: [{ wings: true, l: 1.0 }, { globe: true }] }
    ];
    const sculptures = [];
    for (const g of LAST) {
      const ry = Math.atan2(-g.x, -g.z);
      pedestal(g.x, g.z, 1.7, 1.0, 1.7, ry);
      const base = mat4(g.x, 1.0, g.z, ry);
      const rock = new THREE.IcosahedronGeometry(0.75, 1); rock.scale(1.2, 0.42, 0.95); rock.translate(0, 0.25, 0);
      rock.applyMatrix4(base); sculpt.push(rock);
      figure(new THREE.Matrix4().multiplyMatrices(base, new THREE.Matrix4().makeTranslation(0, 0.45, 0)), 1.25, g.main);
      figure(new THREE.Matrix4().multiplyMatrices(base, new THREE.Matrix4().makeTranslation(-0.55, 0.3, 0.25)), 0.75, g.side[0]);
      figure(new THREE.Matrix4().multiplyMatrices(base, new THREE.Matrix4().makeTranslation(0.6, 0.3, 0.2)), 0.7, g.side[1]);
      sculptures.push({ id: 'last_' + sculptures.length, name: g.name, x: g.x, z: g.z, group: true });
    }
    // twelve single figures in the halls, on pedestals in front of the lower cases
    const POSES = [{ book: true }, { globe: true, l: 0.6 }, { r: 1.6, rf: 0.6 }, { book: true, l: 1.0 }, { wings: true }, { lean: 0.12, r: 0.9 }];
    let pi = 0;
    for (const zs of [-1, 1]) {
      for (let b = 0; b < 3; b++) {
        for (const xs of [X0 + (b + 0.5) * bayLen, world.SOUTH_X0 + (b + 0.5) * bayLen]) {
          const z = zs * (IN - LOW_D - 0.45), ry = zs > 0 ? Math.PI : 0;
          pedestal(xs, z, 0.75, 0.9, 0.75, ry);
          figure(mat4(xs, 0.9, z, ry), 1.12, POSES[pi % POSES.length]);
          sculptures.push({ id: 'fig_' + pi, name: 'Stammel figure ' + (pi + 1), x: xs, z: z });
          pi++;
        }
      }
    }
    {
      const sm = new THREE.Mesh(mergeGeoms(sculpt), mBronze);
      sm.castShadow = true; sm.receiveShadow = true; group.add(sm);
    }

    /* ================= two gilt reliefs over the end doors ================= */
    for (const [xc, seed] of [[X0, 5], [X1, 9]]) {
      const sx = Math.sign(xc), rt = T.relief && T.relief(seed);
      const m = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), std({ color: 0xffffff, map: rt, roughness: 0.35, metalness: 0.85 }));
      m.position.set(xc - sx * (WALL_T / 2 + 0.03), 6.9, 0); m.rotation.y = -sx * Math.PI / 2;
      group.add(m);
      const fr = new THREE.TorusGeometry(1.3, 0.1, 8, 64);
      add(mGold, fr, new THREE.Matrix4().makeRotationY(-sx * Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(xc - sx * (WALL_T / 2 + 0.05), 6.9, 0)), 0);
      sculptures.push({ id: 'relief_' + (sx > 0 ? 'S' : 'N'), name: 'Relief', x: xc, z: 0, relief: true });
    }

    /* ================= benches + doors ================= */
    for (const s of world.seats) {
      box(mDoor, 2.2, 0.08, 0.5, s.x, 0.46, s.z, false);
      for (const dx of [-0.9, 0.9]) box(mDoor, 0.08, 0.44, 0.44, s.x + dx, 0.22, s.z, false);
    }
    // the entrance door leaves swing; a bright daylight panel stands behind every end door
    const doorLeaves = {};
    const mDay = new THREE.MeshBasicMaterial({ color: 0xfff8ea, fog: false }); mDay.color.setScalar(1.25);
    for (const xc of [X0, X1]) {
      const sx = Math.sign(xc);
      const day = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W, DOOR_H), mDay);
      day.position.set(xc + sx * 0.5, DOOR_H / 2, 0); day.rotation.y = -sx * Math.PI / 2; group.add(day);
      const leaves = [];
      for (const zs of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(xc - sx * 0.05, 0, zs * DOOR_W / 2);
        const lg = new THREE.Mesh(new THREE.BoxGeometry(0.08, DOOR_H - 0.05, DOOR_W / 2 - 0.02), mDoor);
        lg.position.set(0, DOOR_H / 2, -zs * DOOR_W / 4); lg.castShadow = true; piv.add(lg);
        const tr = new THREE.Mesh(new THREE.BoxGeometry(0.1, DOOR_H * 0.8, 0.05), mGold);
        tr.position.set(-sx * 0.02, DOOR_H / 2, -zs * (DOOR_W / 2 - 0.12)); piv.add(tr);
        group.add(piv); leaves.push({ piv, zs, sx, a: 0 });
      }
      const d = world.doors.filter((dd) => Math.abs(dd.x - xc) < 1)[0];
      if (d) doorLeaves[d.id] = leaves;
    }

    flush();

    /* ================= the book instances ================= */
    const nBooks = books.ids.length;
    const tSpine = T.bookSpine && T.bookSpine();
    const mBooks = std({ color: 0xffffff, map: tSpine, roughness: 0.75 });
    const bookMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mBooks, nBooks);
    bookMesh.castShadow = true; bookMesh.receiveShadow = true;
    const base = new Float32Array(nBooks * 3);
    {
      const col = new THREE.Color();
      for (let i = 0; i < nBooks; i++) {
        bookMesh.setMatrixAt(i, mat4(books.pos[i * 3], books.pos[i * 3 + 1], books.pos[i * 3 + 2], books.rotY[i], books.scale[i * 3], books.scale[i * 3 + 1], books.scale[i * 3 + 2]));
        col.setHex(books.color[i]); bookMesh.setColorAt(i, col);
        base[i * 3] = col.r; base[i * 3 + 1] = col.g; base[i * 3 + 2] = col.b;
      }
      bookMesh.instanceMatrix.needsUpdate = true;
      if (bookMesh.instanceColor) bookMesh.instanceColor.needsUpdate = true;
    }
    bookMesh.name = 'books';
    group.add(bookMesh);
    const GOLD = new THREE.Color(0xffc93a);
    const bookApi = {
      mesh: bookMesh, count: nBooks, ids: books.ids, meta: books.meta,
      index: Object.create(null),
      position(i) { return new THREE.Vector3(books.pos[i * 3], books.pos[i * 3 + 1], books.pos[i * 3 + 2]); },
      setCollected(i, on) {
        const c = on ? GOLD : new THREE.Color(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
        bookMesh.setColorAt(i, c); bookMesh.instanceColor.needsUpdate = true;
      }
    };
    for (let i = 0; i < nBooks; i++) bookApi.index[books.ids[i]] = i;

    /* ================= per-frame (door swing) ================= */
    function update(dt) {
      for (const id in doorLeaves) {
        const d = world.doors.filter((dd) => dd.id === id)[0]; if (!d) continue;
        for (const L of doorLeaves[id]) {
          const target = d.open ? L.zs * L.sx * -1.35 : 0;
          L.a += (target - L.a) * Math.min(1, dt * 4);
          L.piv.rotation.y = L.a;
        }
      }
    }

    return { group, colliders, books: bookApi, cases, sculptures, windows: windows.length, frescoes: frescoMats.length, doorLeaves, update };
  }

  root.AdmontScene = { build, mergeGeoms };
  if (typeof module !== 'undefined') module.exports = root.AdmontScene;
})(typeof window !== 'undefined' ? window : globalThis);
