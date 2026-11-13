/* The Study - scene (three.js r128 meshes built in code).
 * A dark-wood English private library: shelves on every wall, a wide carved desk before the window, a brass rail with a
 * rolling ladder along the east shelves, a coffered ceiling with a chandelier, Persian carpet, leather chairs.
 * Static furniture is merged per material (few draw calls); the ladder is its own group so it can slide.
 * Books: ~4000 generic spines in ONE InstancedMesh, plus the user's own books in ONE merged mesh whose spines carry
 * their titles (atlas). Ids are stable: user books use their own id, generic ones "g-<unit>-<row>-<n>".
 * Exposes StudyScene = { build(world, THREE, tex, opts) -> { group, colliders, ladder, books, update(dt), stats } }.
 */
(function (root) {
  'use strict';
  function build(W, T, tex, opts) {
    opts = opts || {};
    const V3 = T.Vector3, M4 = T.Matrix4, group = new T.Group();
    const colliders = [];
    const SH = W.SH;
    function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

    /* ---------------------------------------------------------------- materials */
    const lin = (h) => new T.Color(h).convertSRGBToLinear();   // r128 treats hex as linear; the output is sRGB, so convert
    const std = (o) => { o = Object.assign({ roughness: 0.7, metalness: 0 }, o); if (o.color != null) o.color = lin(o.color); if (o.emissive != null) o.emissive = lin(o.emissive); return new T.MeshStandardMaterial(o); };
    const woodT = tex.wood('dark'), woodL = tex.wood('light');
    const mat = {
      wood: std({ color: 0xb59a86, map: woodT, roughness: 0.55 }),
      woodL: std({ color: 0xd9bda0, map: woodL, roughness: 0.5 }),
      back: std({ color: 0x4a3322, map: woodT, roughness: 0.8 }),
      brass: std({ color: 0xc9a24a, metalness: 0.85, roughness: 0.32 }),
      leatherG: std({ color: 0xffffff, map: tex.leather(), roughness: 0.85 }),
      chair: std({ color: 0x3a1b17, roughness: 0.5 }),
      chairG: std({ color: 0x1f3a2a, roughness: 0.5 }),
      plaster: std({ color: 0xffffff, map: tex.plaster(), roughness: 0.95 }),
      ceil: std({ color: 0x5a4a38, roughness: 0.9 }),
      paper: std({ color: 0xe9dfc3, roughness: 0.9 }),
      shade: std({ color: 0xf1e3bf, emissive: 0xffd58a, emissiveIntensity: 0.55, roughness: 0.9, side: T.DoubleSide }),
      greenShade: std({ color: 0x1f6b43, emissive: 0x1a5a38, emissiveIntensity: 0.5, roughness: 0.4, side: T.DoubleSide }),
      bulb: new T.MeshBasicMaterial({ color: lin(0xfff1c9) }),
      glass: std({ color: 0xcfe1ff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.18 }),
      stone: std({ color: 0x8a8378, roughness: 0.9 }),
      globe: std({ color: 0x4d6a78, roughness: 0.5 }),
      dark: std({ color: 0x1b1410, roughness: 0.8 })
    };
    const SCALE = { wood: 1 / 0.9, woodL: 1 / 0.9, back: 1 / 0.9, plaster: 1 / 1.4 };

    /* ---------------------------------------------------------------- batching: boxes etc. merged per material */
    const bins = {};
    const _m = new M4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = new V3(), _s = new V3();
    function put(key, geo, m) { (bins[key] || (bins[key] = [])).push({ geo, m: m.clone() }); }
    const UNIT = new T.BoxGeometry(1, 1, 1);
    function box(key, cx, cy, cz, sx, sy, sz, ry, rx, rz) {
      _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(cx, cy, cz); _s.set(sx, sy, sz);
      put(key, UNIT, _m.compose(_p, _q, _s));
    }
    function shape(key, geo, cx, cy, cz, ry, rx, rz, sx, sy, sz) {
      _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(cx, cy, cz); _s.set(sx || 1, sy || 1, sz || 1);
      put(key, geo, _m.compose(_p, _q, _s));
    }
    function mergeBin(key, list) {
      const geos = list.map((e) => { const g = e.geo.index ? e.geo.toNonIndexed() : e.geo.clone(); g.applyMatrix4(e.m); return g; });
      let n = 0; geos.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), sc = SCALE[key] || 1;
      let o = 0;
      geos.forEach((g) => {
        const P = g.attributes.position, N = g.attributes.normal, c = P.count;
        let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, minz = 1e9, maxz = -1e9;
        for (let i = 0; i < c; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; if (z < minz) minz = z; if (z > maxz) maxz = z; }
        const flat = Math.max(maxx - minx, maxz - minz) > (maxy - miny) * 1.8;   // horizontal member: grain runs along it
        for (let i = 0; i < c; i++) {
          const x = P.getX(i), y = P.getY(i), z = P.getZ(i), nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
          pos[(o + i) * 3] = x; pos[(o + i) * 3 + 1] = y; pos[(o + i) * 3 + 2] = z; nor[(o + i) * 3] = nx; nor[(o + i) * 3 + 1] = ny; nor[(o + i) * 3 + 2] = nz;
          const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz); let u, v;
          if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
          if (flat && !(ay >= ax && ay >= az)) { const t = u; u = v; v = t; }
          uv[(o + i) * 2] = u * sc; uv[(o + i) * 2 + 1] = v * sc;
        }
        o += c;
      });
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
      const mesh = new T.Mesh(g, mat[key]); mesh.castShadow = key !== 'plaster' && key !== 'glass'; mesh.receiveShadow = true; return mesh;
    }
    function flush() { Object.keys(bins).forEach((k) => { group.add(mergeBin(k, bins[k])); }); Object.keys(bins).forEach((k) => delete bins[k]); }
    const col = (x0, y0, z0, x1, y1, z1) => colliders.push({ min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } });

    /* ---------------------------------------------------------------- room shell */
    const { X0, X1, Z0, Z1, H, win, door } = W, WL = X1 - X0, DL = Z1 - Z0;
    // floor (parquet) and carpet
    const floorTex = tex.parquet(); floorTex.repeat.set(WL / 1.2, DL / 1.2);
    const floor = new T.Mesh(new T.PlaneGeometry(WL, DL), std({ color: 0xd8c0a0, map: floorTex, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
    const carpet = new T.Mesh(new T.PlaneGeometry(3.8, 5.0), std({ color: 0xffffff, map: tex.carpet(), roughness: 0.95 }));
    carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.012, 0.15); carpet.receiveShadow = true; group.add(carpet);
    // ceiling: plaster panels between dark coffer beams
    const ceil = new T.Mesh(new T.PlaneGeometry(WL, DL), mat.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; group.add(ceil);
    for (let i = -3; i <= 3; i++) box('wood', i * 1.25, H - 0.09, 0, 0.16, 0.18, DL, 0);
    for (let k = -2; k <= 2; k++) box('wood', 0, H - 0.09, k * 1.28, WL, 0.18, 0.16, 0);
    // walls: slabs with the window and the door cut out
    const wt = 0.2;
    box('plaster', (X0 - wt / 2), H / 2, 0, wt, H, DL + 0.4, 0); box('plaster', (X1 + wt / 2), H / 2, 0, wt, H, DL + 0.4, 0);
    // north wall around the window
    box('plaster', (X0 + win.x0) / 2 - 0.0, H / 2, Z0 - wt / 2, win.x0 - X0, H, wt, 0); box('plaster', (win.x1 + X1) / 2, H / 2, Z0 - wt / 2, X1 - win.x1, H, wt, 0);
    box('plaster', (win.x0 + win.x1) / 2, (win.y0) / 2, Z0 - wt / 2, win.x1 - win.x0, win.y0, wt, 0); box('plaster', (win.x0 + win.x1) / 2, (win.y1 + H) / 2, Z0 - wt / 2, win.x1 - win.x0, H - win.y1, wt, 0);
    // south wall around the door
    box('plaster', (X0 + door.x0) / 2, H / 2, Z1 + wt / 2, door.x0 - X0, H, wt, 0); box('plaster', (door.x1 + X1) / 2, H / 2, Z1 + wt / 2, X1 - door.x1, H, wt, 0);
    box('plaster', 0, (door.h + H) / 2, Z1 + wt / 2, door.x1 - door.x0, H - door.h, wt, 0);
    // the door: a panelled leaf with brass handle, a little inside the opening
    box('wood', 0, door.h / 2, Z1 - 0.05, door.x1 - door.x0 - 0.04, door.h, 0.06, 0);
    for (const [py, ph] of [[0.65, 0.8], [1.65, 0.9]]) box('wood', 0, py, Z1 - 0.09, 0.78, ph, 0.03, 0);
    box('brass', 0.42, 1.05, Z1 - 0.12, 0.05, 0.05, 0.08, 0);
    box('wood', -(door.x1 - door.x0) / 2 - 0.05, door.h / 2, Z1 - 0.07, 0.1, door.h, 0.12, 0); box('wood', (door.x1 - door.x0) / 2 + 0.05, door.h / 2, Z1 - 0.07, 0.1, door.h, 0.12, 0); box('wood', 0, door.h + 0.05, Z1 - 0.07, door.x1 - door.x0 + 0.2, 0.1, 0.12, 0);
    // window: frame, mullions, sheers, bright "outside"
    const wx = (win.x0 + win.x1) / 2, ww = win.x1 - win.x0, wh = win.y1 - win.y0;
    box('wood', win.x0 - 0.05, (win.y0 + win.y1) / 2, Z0 + 0.02, 0.1, wh + 0.2, 0.16, 0); box('wood', win.x1 + 0.05, (win.y0 + win.y1) / 2, Z0 + 0.02, 0.1, wh + 0.2, 0.16, 0);
    box('wood', wx, win.y1 + 0.05, Z0 + 0.02, ww + 0.2, 0.1, 0.16, 0); box('wood', wx, win.y0 - 0.05, Z0 + 0.1, ww + 0.3, 0.1, 0.3, 0);
    box('wood', wx, (win.y0 + win.y1) / 2, Z0 + 0.03, 0.05, wh, 0.06, 0); box('wood', wx, (win.y0 + win.y1) / 2 + 0.2, Z0 + 0.03, ww, 0.05, 0.06, 0);
    for (const dx of [-0.55, 0.55]) box('wood', wx + dx, (win.y0 + win.y1) / 2, Z0 + 0.03, 0.04, wh, 0.05, 0);
    const sky = new T.Mesh(new T.PlaneGeometry(ww + 1.5, wh + 1.5), new T.MeshBasicMaterial({ color: 0xe7f0ff }));
    sky.position.set(wx, (win.y0 + win.y1) / 2, Z0 - 0.6); group.add(sky);
    const sheer = new T.Mesh(new T.PlaneGeometry(ww, wh), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: T.DoubleSide }));
    sheer.position.set(wx, (win.y0 + win.y1) / 2, Z0 + 0.12); group.add(sheer);
    // curtains with pleats, pelmet and rod
    const damask = tex.damask(); damask.repeat.set(1, 3);
    function curtain(cx, w) {
      const g = new T.PlaneGeometry(w, 3.25, 22, 1), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin((P.getX(i) / w + 0.5) * 22) * 0.045);
      g.computeVertexNormals();
      const m = new T.Mesh(g, std({ color: 0xffffff, map: damask, roughness: 0.9, side: T.DoubleSide })); m.position.set(cx, 1.55, Z0 + 0.3); m.castShadow = true; group.add(m);
    }
    curtain(wx - ww / 2 - 0.18, 0.78); curtain(wx + ww / 2 + 0.18, 0.78);
    box('wood', wx, 3.2, Z0 + 0.28, ww + 1.5, 0.22, 0.22, 0); box('brass', wx, 3.3, Z0 + 0.3, ww + 1.6, 0.035, 0.035, 0);
    for (const sx of [-1, 1]) shape('brass', new T.SphereGeometry(0.06, 10, 8), wx + sx * (ww / 2 + 0.85), 3.3, Z0 + 0.3, 0, 0, 0);

    /* ---------------------------------------------------------------- shelves (merged) */
    const rowsDef = [];   // each: { unit, k, y, a, b }
    W.units.forEach((u) => {
      const d = SH.depth, len = u.b - u.a, mid = (u.a + u.b) / 2, f = u.fix + u.side * d / 2;
      const along = (c, thick, h, y, dep, mk) => u.axis === 'z' ? box(mk, f - u.side * (d / 2 - dep / 2), y, c, dep, h, thick, 0) : box(mk, c, y, f - u.side * (d / 2 - dep / 2), thick, h, dep, 0);
      // back panel + sides + plinth + boards
      if (u.axis === 'z') {
        box('back', u.fix + u.side * 0.02, SH.height / 2, mid, 0.04, SH.height, len, 0);
        for (const c of [u.a + 0.025, u.b - 0.025]) box('wood', f, SH.height / 2, c, d, SH.height, 0.05, 0);
        box('wood', u.fix + u.side * (d - 0.02), SH.plinth / 2, mid, 0.04, SH.plinth, len, 0);
        for (let k = 0; k <= SH.rows; k++) box('wood', f, SH.plinth + k * SH.pitch + SH.board / 2, mid, d, SH.board, len, 0);
        col(u.side > 0 ? u.fix : u.fix - d, 0, u.a, u.side > 0 ? u.fix + d : u.fix, H, u.b);
      } else {
        box('back', mid, SH.height / 2, u.fix + u.side * 0.02, len, SH.height, 0.04, 0);
        for (const c of [u.a + 0.025, u.b - 0.025]) box('wood', c, SH.height / 2, f, 0.05, SH.height, d, 0);
        box('wood', mid, SH.plinth / 2, u.fix + u.side * (d - 0.02), len, SH.plinth, 0.04, 0);
        for (let k = 0; k <= SH.rows; k++) box('wood', mid, SH.plinth + k * SH.pitch + SH.board / 2, f, len, SH.board, d, 0);
        col(u.a, 0, u.side > 0 ? u.fix : u.fix - d, u.b, H, u.side > 0 ? u.fix + d : u.fix);
      }
      // carved cornice: a crown band, dentils and corbel brackets at the ends (the look of the reference)
      const top = SH.height, front = u.fix + u.side * d;
      if (u.axis === 'z') {
        box('wood', u.fix + u.side * (d / 2 + 0.03), top + 0.1, mid, d + 0.06, 0.2, len + 0.04, 0);
        box('wood', u.fix + u.side * (d / 2 + 0.07), top + 0.27, mid, d + 0.14, 0.1, len + 0.08, 0);
        for (let c = u.a + 0.05; c < u.b - 0.04; c += 0.09) box('wood', front + u.side * 0.015, top - 0.04, c, 0.03, 0.06, 0.045, 0);
        for (const c of [u.a, u.b]) { box('wood', front + u.side * 0.02, top - 0.14, c, 0.1, 0.4, 0.12, 0); shape('wood', new T.SphereGeometry(0.075, 10, 8), front + u.side * 0.08, top - 0.36, c, 0, 0, 0); }
      } else {
        box('wood', mid, top + 0.1, u.fix + u.side * (d / 2 + 0.03), len + 0.04, 0.2, d + 0.06, 0);
        box('wood', mid, top + 0.27, u.fix + u.side * (d / 2 + 0.07), len + 0.08, 0.1, d + 0.14, 0);
        for (let c = u.a + 0.05; c < u.b - 0.04; c += 0.09) box('wood', c, top - 0.04, front + u.side * 0.015, 0.045, 0.06, 0.03, 0);
        for (const c of [u.a, u.b]) { box('wood', c, top - 0.14, front + u.side * 0.02, 0.12, 0.4, 0.1, 0); shape('wood', new T.SphereGeometry(0.075, 10, 8), c, top - 0.36, front + u.side * 0.08, 0, 0, 0); }
      }
      for (let k = 0; k < SH.rows; k++) rowsDef.push({ unit: u, k, y: SH.plinth + k * SH.pitch + SH.board, a: u.a + 0.06, b: u.b - 0.06 });
    });
    // the brass rail for the ladder, on the east shelves
    const L = W.ladder;
    box('brass', X1 - SH.depth - 0.055, L.railY, 0, 0.035, 0.035, L.zMax - L.zMin + 1.2, 0);
    for (const z of [L.zMin - 0.35, L.zMax + 0.35, 0]) box('brass', X1 - SH.depth - 0.03, L.railY, z, 0.05, 0.1, 0.035, 0);
    // a brass picture-light bar over the north-east shelves is skipped; the chandelier lights the room

    /* ---------------------------------------------------------------- desk */
    const D = W.desk, dx = D.x, dz = D.z;
    box('woodL', dx, D.h - 0.03, dz, D.w, 0.06, D.d, 0);                                          // top
    box('leatherG', dx, D.h + 0.001, dz, D.w - 0.22, 0.004, D.d - 0.2, 0);                          // leather inlay (textured box)
    box('woodL', dx, D.h - 0.075, dz + D.d / 2 - 0.02, D.w - 0.1, 0.07, 0.05, 0);                  // carved apron (front)
    for (const sx of [-1, 1]) {
      const px = dx + sx * (D.w / 2 - 0.3);
      box('woodL', px, (D.h - 0.06) / 2, dz, 0.55, D.h - 0.06, D.d - 0.08, 0);                       // pedestal
      for (let i = 0; i < 3; i++) {
        const y = 0.13 + i * 0.2; box('woodL', px, y, dz + D.d / 2 - 0.035, 0.46, 0.17, 0.03, 0);
        box('brass', px, y, dz + D.d / 2 - 0.01, 0.1, 0.02, 0.02, 0);
      }
      for (const fz of [-1, 1]) shape('woodL', new T.SphereGeometry(0.06, 10, 8), px + sx * 0.22, 0.05, dz + fz * (D.d / 2 - 0.1), 0, 0, 0);
      shape('woodL', new T.CylinderGeometry(0.1, 0.1, 0.02, 14), px, D.h - 0.17, dz + D.d / 2 + 0.002, 0, Math.PI / 2, 0);   // carved roundel
    }
    box('woodL', dx, 0.35, dz - D.d / 2 + 0.04, D.w - 0.9, 0.7, 0.04, 0);                           // kneehole back
    col(dx - D.w / 2, 0, dz - D.d / 2, dx + D.w / 2, D.h, dz + D.d / 2);
    // things on the desk
    const top = D.h + 0.004;
    shape('brass', new T.CylinderGeometry(0.07, 0.09, 0.03, 14), dx - 0.65, top + 0.015, dz - 0.08, 0, 0, 0);          // lamp base
    shape('brass', new T.CylinderGeometry(0.012, 0.012, 0.34, 8), dx - 0.65, top + 0.19, dz - 0.08, 0, 0, 0);
    shape('greenShade', new T.CylinderGeometry(0.1, 0.17, 0.12, 18, 1, true), dx - 0.65, top + 0.4, dz - 0.08, 0, 0, 0);
    shape('bulb', new T.SphereGeometry(0.03, 8, 6), dx - 0.65, top + 0.36, dz - 0.08, 0, 0, 0);
    shape('dark', new T.CylinderGeometry(0.035, 0.04, 0.05, 10), dx + 0.62, top + 0.025, dz - 0.18, 0, 0, 0);       // inkwell
    box('brass', dx + 0.62, top + 0.055, dz - 0.18, 0.02, 0.012, 0.02, 0);
    for (let i = 0; i < 4; i++) box(i % 2 ? 'chair' : 'chairG', dx + 0.7, top + 0.025 + i * 0.045, dz + 0.1, 0.26 - i * 0.012, 0.04, 0.19, 0.1 - i * 0.05);   // stack of books
    for (const sx of [-1, 1]) { shape('brass', new T.CylinderGeometry(0.02, 0.035, 0.2, 10), dx + sx * 0.3 + 0.05, top + 0.1, dz + 0.3, 0, 0, 0); shape('paper', new T.CylinderGeometry(0.012, 0.012, 0.09, 8), dx + sx * 0.3 + 0.05, top + 0.25, dz + 0.3, 0, 0, 0); }   // candlesticks on the far side   // candlesticks
    box('chairG', dx - 0.1, top + 0.012, dz + 0.06, 0.5, 0.024, 0.34, 0.12);                                    // the open book: covers and pages
    box('paper', dx - 0.22, top + 0.03, dz + 0.06, 0.23, 0.02, 0.31, 0.12, 0, 0.05); box('paper', dx + 0.02, top + 0.03, dz + 0.04, 0.23, 0.02, 0.31, 0.12, 0, -0.05);
    box('brass', dx + 0.3, top + 0.02, dz - 0.32, 0.12, 0.035, 0.06, 0.3);                                          // pen tray
    shape('brass', new T.CylinderGeometry(0.045, 0.045, 0.03, 18), dx - 0.35, top + 0.02, dz + 0.32, 0, Math.PI / 2, 0);   // little clock

    /* ---------------------------------------------------------------- chairs, side table, globe, floor lamp */
    function chair(cx, cz, yaw, big, key) {
      const c = Math.cos(yaw), s = Math.sin(yaw), at = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
      const w = big ? 0.8 : 0.52, d = big ? 0.78 : 0.5, sh = big ? 0.43 : 0.46;
      let p = at(0, 0); box(key, p[0], sh, p[1], w, 0.16, d, yaw);                                   // seat
      p = at(0, -d / 2 + 0.04); box(key, p[0], sh + (big ? 0.42 : 0.3), p[1], w, big ? 0.82 : 0.6, 0.1, yaw, -0.12);   // back
      for (const sx of [-1, 1]) { p = at(sx * (w / 2 - 0.03), -0.02); box(key, p[0], sh + 0.2, p[1], 0.09, 0.2, d - 0.1, yaw); }   // arms
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p = at(sx * (w / 2 - 0.05), sz * (d / 2 - 0.05)); box('wood', p[0], 0.18, p[1], 0.06, 0.36, 0.06, yaw); }
      return at;
    }
    chair(0, -2.62, Math.PI, false, 'chair');           // behind the desk, facing the room
    chair(0, -0.7, 0, false, 'chairG');                 // the visitor's chair
    chair(-2.55, 1.95, -Math.PI / 2 + 0.55, true, 'chair');   // wing armchair by the shelves
    col(-0.3, 0, -2.9, 0.3, 0.9, -2.34); col(-0.3, 0, -0.98, 0.3, 0.9, -0.42); col(-3.0, 0, 1.55, -2.1, 1.0, 2.4);
    shape('wood', new T.CylinderGeometry(0.28, 0.3, 0.04, 20), -1.9, 0.62, 2.85, 0, 0, 0); shape('wood', new T.CylinderGeometry(0.04, 0.07, 0.6, 10), -1.9, 0.3, 2.85, 0, 0, 0);   // side table
    box('chairG', -1.9, 0.67, 2.85, 0.2, 0.05, 0.15, 0.3); shape('paper', new T.CylinderGeometry(0.04, 0.035, 0.07, 10), -1.78, 0.68, 2.9, 0, 0, 0);
    col(-2.2, 0, 2.55, -1.6, 0.7, 3.15);
    shape('woodL', new T.TorusGeometry(0.3, 0.018, 8, 28), -3.15, 1.08, -2.6, 0.4, 0.4, 0); shape('globe', new T.SphereGeometry(0.26, 18, 14), -3.15, 1.08, -2.6, 0, 0, 0);   // globe
    shape('woodL', new T.CylinderGeometry(0.03, 0.14, 0.9, 10), -3.15, 0.45, -2.6, 0, 0, 0);
    col(-3.45, 0, -2.9, -2.85, 1.4, -2.3);
    shape('brass', new T.CylinderGeometry(0.015, 0.05, 1.5, 8), -3.2, 0.75, 2.75, 0, 0, 0); shape('shade', new T.CylinderGeometry(0.16, 0.26, 0.26, 18, 1, true), -3.2, 1.62, 2.75, 0, 0, 0);   // floor lamp
    shape('bulb', new T.SphereGeometry(0.04, 8, 6), -3.2, 1.58, 2.75, 0, 0, 0);
    col(-3.35, 0, 2.6, -3.05, 1.8, 2.9);

    /* ---------------------------------------------------------------- chandelier */
    shape('brass', new T.CylinderGeometry(0.012, 0.012, 0.6, 6), 0, H - 0.5, 0, 0, 0, 0);
    shape('brass', new T.SphereGeometry(0.1, 14, 10), 0, H - 0.84, 0, 0, 0, 0); shape('brass', new T.CylinderGeometry(0.035, 0.02, 0.28, 10), 0, H - 1.05, 0, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, rx = Math.cos(a) * 0.46, rz = Math.sin(a) * 0.46;
      box('brass', rx / 2, H - 0.86, rz / 2, 0.46, 0.02, 0.02, -a); shape('brass', new T.SphereGeometry(0.032, 8, 6), rx, H - 0.86, rz, 0, 0, 0);
      shape('brass', new T.CylinderGeometry(0.018, 0.018, 0.1, 6), rx, H - 0.8, rz, 0, 0, 0);
      shape('shade', new T.CylinderGeometry(0.075, 0.14, 0.18, 14, 1, true), rx, H - 0.66, rz, 0, 0, 0);
      shape('bulb', new T.SphereGeometry(0.03, 8, 6), rx, H - 0.74, rz, 0, 0, 0);
    }
    shape('brass', new T.TorusGeometry(0.46, 0.012, 6, 36), 0, H - 0.86, 0, 0, Math.PI / 2, 0);

    flush();

    /* ---------------------------------------------------------------- lights (set up by app.js too, here the local ones) */
    const lights = [];
    function pl(c, i, d, x, y, z, shadow) { const l = new T.PointLight(c, i, d, 1.6); l.position.set(x, y, z); group.add(l); lights.push(l); return l; }
    pl(0xffd9a0, 1.05, 15, 0, H - 1.0, 0.2); pl(0xffe0a8, 0.55, 6, -0.65 + D.x, 1.25, D.z - 0.08); pl(0xffd9a0, 0.5, 6, -3.2, 1.9, 2.75);

    /* ---------------------------------------------------------------- the ladder (own group, slides on the rail) */
    const ladder = new T.Group(); ladder.name = 'ladder';
    {
      const dxl = L.topX - L.baseX, ang = Math.atan2(dxl, L.railY), len = Math.hypot(dxl, L.railY);
      const lb = { wood: [], brass: [] };
      const lbox = (k, x, y, z, sx, sy, sz) => { _p.set(x, y, z); _q.identity(); _s.set(sx, sy, sz); lb[k].push({ geo: UNIT, m: new M4().compose(_p, _q, _s) }); };
      // built upright in local space (y up along the ladder), then leaned
      for (const sz of [-1, 1]) lbox('wood', 0, len / 2, sz * L.half, 0.055, len + 0.2, 0.045);
      for (let y = 0.25; y < len; y += 0.27) lbox('wood', 0, y, 0, 0.05, 0.035, L.half * 2);
      lbox('brass', 0.05, len + 0.1, -L.half, 0.07, 0.06, 0.07); lbox('brass', 0.05, len + 0.1, L.half, 0.07, 0.06, 0.07);   // hooks over the rail
      for (const sz of [-1, 1]) lbox('brass', -0.02, 0.02, sz * L.half, 0.07, 0.04, 0.07);                                       // brass shoes
      ['wood', 'brass'].forEach((k) => { if (!lb[k].length) return; const m = mergeBin(k === 'wood' ? 'woodL' : 'brass', lb[k]); m.material = mat[k === 'wood' ? 'woodL' : 'brass']; m.castShadow = true; ladder.add(m); });
      ladder.children.forEach((m) => { m.rotation.z = -ang; });
      ladder.userData = { ang, len };
      ladder.position.set(L.baseX, 0, L.z);
    }
    group.add(ladder);
    function setLadderZ(z) { L.z = Math.max(L.zMin, Math.min(L.zMax, z)); ladder.position.z = L.z; }

    /* ---------------------------------------------------------------- books */
    const bookGroup = new T.Group(); group.add(bookGroup);
    const B = { generic: null, user: null, ids: [], meta: {}, index: {}, taken: new Set(), userBooks: [], count: 0, userCount: 0, atlas: null, geoRange: [] };
    const spineTex = tex.spine();
    const genMat = std({ color: 0xffffff, map: spineTex, roughness: 0.75 });
    const BOX = new T.BoxGeometry(1, 1, 1);
    function normalOf(u) { return u.axis === 'z' ? (u.side > 0 ? 1 : -1) : 0; }
    function placeOf(u, c, w, h, d, y) {   // centre of a book standing at coordinate c along the unit, against the back panel
      const dep = SH.depth - 0.1;
      if (u.axis === 'z') return { x: u.fix + u.side * (0.045 + d / 2), y: y + h / 2, z: c, ry: u.side > 0 ? Math.PI / 2 : -Math.PI / 2 };
      return { x: c, y: y + h / 2, z: u.fix + u.side * (0.045 + d / 2), ry: u.side > 0 ? 0 : Math.PI };
    }
    function layout(userBooks) {
      // dispose the old books
      [B.generic, B.user].forEach((m) => { if (m) { bookGroup.remove(m); m.geometry.dispose(); } });
      if (B.atlas && B.atlas.texture) B.atlas.texture.dispose();
      B.ids = []; B.meta = {}; B.index = {}; B.taken = new Set(); B.generic = B.user = null;
      userBooks = (userBooks || []).slice(); const atlas = tex.spineAtlas(userBooks); B.atlas = atlas; userBooks = userBooks.slice(0, atlas.count); B.userBooks = userBooks;
      const r = rng(1859), order = [];
      // where the user's books go: a run of at most CAP per shelf, west wall at eye level and east wall up by the ladder rail first
      const ORDER = ['W3', 'E6', 'W2', 'E5', 'W4', 'E4', 'E3', 'W5', 'W1', 'E2', 'NW3', 'NE3', 'W6', 'E1', 'SW3', 'SE3'], CAP = 12;
      const pri = (rw) => { const i = ORDER.indexOf(rw.unit.id + rw.k); return i < 0 ? 100 + rw.k : i; };
      const rowsSorted = rowsDef.slice().sort((a, b) => pri(a) - pri(b));
      const slots = [], gen = [];
      let ui = 0;
      const bookDims = (userBook) => {
        const w = userBook ? 0.036 + (tex.hash(userBook.id || userBook.title) % 5) * 0.004 : 0.025 + r() * 0.035, h = userBook ? 0.26 + (tex.hash(String(userBook.id || userBook.title) + 'h') % 10) * 0.012 : 0.2 + r() * 0.17, d = userBook ? 0.21 : 0.17 + r() * 0.07;
        return { w, h: Math.min(h, SH.pitch - SH.board - 0.03), d };
      };
      rowsSorted.forEach((rw) => {
        let c = rw.a, n = 0, here = 0; const mine = ui < userBooks.length;
        const end = rw.b - (!mine && r() < 0.22 ? r() * (rw.b - rw.a) * 0.18 : 0);
        const from = (rw.a + rw.b) / 2 - CAP * 0.045 / 2;   // the user's run sits in the middle of the shelf (within the ladder's reach on the east wall)
        for (;;) {
          const ub = ui < userBooks.length && here < CAP && c >= from ? userBooks[ui] : null, bd = bookDims(ub);
          if (c + bd.w > end) break;
          const p = placeOf(rw.unit, c + bd.w / 2, bd.w, bd.h, bd.d, rw.y);
          if (ub) { slots.push({ b: ub, w: bd.w, h: bd.h, d: bd.d, p, rw, n }); ui++; here++; } else gen.push({ w: bd.w, h: bd.h, d: bd.d, p, rw, n, lean: r() < 0.015 });
          c += bd.w + 0.002; n++;
        }
      });
      // generic spines: one InstancedMesh, per-instance colour
      const gm = new T.InstancedMesh(BOX, genMat, gen.length), mm = new M4(), q = new T.Quaternion(), e = new T.Euler(), pos = new V3(), sc = new V3(), cc = new T.Color();
      gen.forEach((g, i) => {
        e.set(0, g.p.ry, g.lean ? (r() < .5 ? .22 : -.22) : 0); q.setFromEuler(e);
        const id = 'g-' + g.rw.unit.id + '-' + g.rw.k + '-' + g.n;
        // spine thickness is along the shelf (local x), height y, depth z: rotate the unit box into place
        pos.set(g.p.x, g.p.y, g.p.z); sc.set(g.w, g.h, g.d); mm.compose(pos, q, sc); gm.setMatrixAt(i, mm);
        cc.set(tex.color(id)); cc.offsetHSL(0, 0, (r() - .5) * .08); cc.convertSRGBToLinear(); gm.setColorAt(i, cc);
        B.ids.push(id);
      });
      gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true; gm.castShadow = false; gm.receiveShadow = true; bookGroup.add(gm); B.generic = gm;
      // the user's books: one merged mesh, spines from the atlas
      const n = slots.length, P = new Float32Array(n * 36 * 3), N = new Float32Array(n * 36 * 3), U = new Float32Array(n * 36 * 2);
      B.userRange = [];
      const base = BOX.toNonIndexed(), bp = base.attributes.position, bn = base.attributes.normal, bu = base.attributes.uv, v = new V3(), nv = new V3(), nm = new T.Matrix3();
      slots.forEach((s, i) => {
        const cell = atlas.cells[i], m = new M4().compose(new V3(s.p.x, s.p.y, s.p.z), new T.Quaternion().setFromEuler(new T.Euler(0, s.p.ry, 0)), new V3(s.w, s.h, s.d));
        nm.getNormalMatrix(m);
        for (let j = 0; j < 36; j++) {
          v.fromBufferAttribute(bp, j).applyMatrix4(m); nv.fromBufferAttribute(bn, j).applyMatrix3(nm).normalize();
          const o = i * 36 + j; P[o * 3] = v.x; P[o * 3 + 1] = v.y; P[o * 3 + 2] = v.z; N[o * 3] = nv.x; N[o * 3 + 1] = nv.y; N[o * 3 + 2] = nv.z;
          if (j >= 24 && j < 30) { U[o * 2] = cell[0] + (cell[2] - cell[0]) * bu.getX(j); U[o * 2 + 1] = cell[1] + (cell[3] - cell[1]) * bu.getY(j); }   // +z face = the spine
          else { U[o * 2] = (cell[0] + cell[2]) / 2; U[o * 2 + 1] = cell[3] - 3 / 1024; }
        }
        const id = s.b.id != null ? String(s.b.id) : 'u-' + i;
        B.ids.push(id); B.index[id] = i; B.meta[id] = { i, title: s.b.title, author: s.b.author || '', ref: s.b.ref || null, text: s.b.text || '', unit: s.rw.unit.id, row: s.rw.k, base: [s.p.x, s.p.y, s.p.z], out: s.rw.unit.axis === 'z' ? [s.rw.unit.side, 0, 0] : [0, 0, s.rw.unit.side] };
        B.userRange.push(id);
      });
      const ug = new T.BufferGeometry(); ug.setAttribute('position', new T.BufferAttribute(P, 3)); ug.setAttribute('normal', new T.BufferAttribute(N, 3)); ug.setAttribute('uv', new T.BufferAttribute(U, 2));
      const um = new T.Mesh(ug, std({ color: 0xffffff, map: atlas.texture, roughness: 0.65 })); um.receiveShadow = true; um.visible = n > 0; bookGroup.add(um); B.user = um;
      B.count = gen.length + n; B.userCount = n;
    }
    function userIdAt(faceIndex) { const i = Math.floor(faceIndex / 12); return B.userRange[i] || null; }
    function take(id, on) {   // slide the book half out of the shelf (or push it back)
      const mta = B.meta[id]; if (!mta || !B.user) return null;
      if (on == null) on = !B.taken.has(id);
      const P = B.user.geometry.attributes.position, off = on ? 0.13 : -0.13;
      if (on === B.taken.has(id)) return on;
      for (let j = 0; j < 36; j++) { const o = mta.i * 36 + j; P.setX(o, P.getX(o) + mta.out[0] * off); P.setZ(o, P.getZ(o) + mta.out[2] * off); P.setY(o, P.getY(o) + (on ? 0.012 : -0.012)); }
      P.needsUpdate = true; B.user.geometry.computeBoundingSphere(); B.user.geometry.boundingBox = null;
      if (on) B.taken.add(id); else B.taken.delete(id);
      return on;
    }
    layout(opts.books || []);

    return {
      group, colliders, ladder, ladderCfg: L, setLadderZ,
      books: {
        get count() { return B.count; }, get userCount() { return B.userCount; }, ids: () => B.userRange.slice(), meta: (id) => B.meta[id] || null,
        get mesh() { return B.user; }, userIdAt, take, isTaken: (id) => B.taken.has(id), set: layout, capacity: () => (B.atlas ? B.atlas.capacity : 0), takenIds: () => Array.from(B.taken)
      },
      update(dt) { /* static room: nothing animates; the chandelier is steady */ },
      lights
    };
  }
  root.StudyScene = { build };
})(typeof window !== 'undefined' ? window : globalThis);
