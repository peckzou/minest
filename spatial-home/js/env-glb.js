/* Minest · Spatial Home — two rooms made from the interiors' GLBs (interiors-glb/assets, 2026-11-13):
   "kings-hall"  The King's Hall, Skokloster Castle (scan by Erik Lernestål, CC BY 4.0 — credited on screen)
   "victorian"   The Victorian Study (Fox Dev assets, published with the author's permission per the user)
   Each room gets an office corner with Spatial Home's own desk, chair, shelf and cabinet, so every thing keeps its usual
   place (the same anchor names as the other rooms); the EC–6 board stands on an easel. The rest of the hall is open to
   walk; what you cannot walk through comes from the model itself (triangles between knee and chest height, rasterised
   into a 20 cm grid once it has loaded — the same method as the walk-in viewer). The GLB loads in the background; the
   office corner is there at once. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts;
  if (!SR || !PT) return;

  function siteBase() {
    if (/^https?:$/.test(location.protocol)) return /\/spatial-home\//.test(location.pathname) ? '../' : '';
    return 'https://minest-app.vercel.app/';
  }
  var loaderP = null;
  function gltfLoader() {
    if (THREE.GLTFLoader) return Promise.resolve();
    if (!loaderP) loaderP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = siteBase() + 'vendor/GLTFLoader.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return loaderP;
  }
  function raw(attr, i, c) {
    var a = attr.isInterleavedBufferAttribute ? attr.data.array : attr.array, v = c === 0 ? attr.getX(i) : c === 1 ? attr.getY(i) : attr.getZ(i);
    if (!attr.normalized) return v;
    if (a instanceof Int16Array) return Math.max(v / 32767, -1); if (a instanceof Uint16Array) return v / 65535;
    if (a instanceof Int8Array) return Math.max(v / 127, -1); if (a instanceof Uint8Array) return v / 255; return v;
  }
  /* obstacles of a loaded model, in room coordinates: runs of blocked 20 cm cells → [x0, z0, x1, z1] boxes */
  function solidsOf(model, floorY, keepOut) {
    model.updateMatrixWorld(true);
    var CELL = 0.2, box = new THREE.Box3().setFromObject(model), x0 = box.min.x, z0 = box.min.z, nx = Math.ceil((box.max.x - x0) / CELL) + 1, nz = Math.ceil((box.max.z - z0) / CELL) + 1;
    var block = new Uint8Array(nx * nz), lo = floorY + 0.32, hi = floorY + 1.7, A = new THREE.Vector3();
    model.traverse(function (m) {
      if (!m.isMesh) return; var pos = m.geometry.attributes.position, idx = m.geometry.index, cnt = idx ? idx.count : pos.count, M = m.matrixWorld, P = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (var k = 0; k + 2 < cnt; k += 3) {
        for (var j = 0; j < 3; j++) { var i = idx ? idx.getX(k + j) : k + j; A.set(raw(pos, i, 0), raw(pos, i, 1), raw(pos, i, 2)).applyMatrix4(M); P[j * 3] = A.x; P[j * 3 + 1] = A.y; P[j * 3 + 2] = A.z; }
        var ymin = Math.min(P[1], P[4], P[7]), ymax = Math.max(P[1], P[4], P[7]); if (ymax < lo || ymin > hi) continue;
        var xa = Math.min(P[0], P[3], P[6]), xb = Math.max(P[0], P[3], P[6]), za = Math.min(P[2], P[5], P[8]), zb = Math.max(P[2], P[5], P[8]);
        if ((xb - xa) * (zb - za) > 2.5) continue;
        for (var gz = Math.floor((za - z0) / CELL); gz <= Math.floor((zb - z0) / CELL); gz++) for (var gx = Math.floor((xa - x0) / CELL); gx <= Math.floor((xb - x0) / CELL); gx++)
          if (gx >= 0 && gz >= 0 && gx < nx && gz < nz) block[gz * nx + gx] = 1;
      }
    });
    for (var e = 0; e < nx; e++) { block[e] = block[(nz - 1) * nx + e] = 1; } for (var f = 0; f < nz; f++) { block[f * nx] = block[f * nx + nx - 1] = 1; }
    var out = [];
    for (var z = 0; z < nz; z++) {
      var run = -1;
      for (var x = 0; x <= nx; x++) {
        var b = x < nx && block[z * nx + x];
        if (b && run < 0) run = x;
        if (!b && run >= 0) {
          var r = [x0 + run * CELL, z0 + z * CELL, x0 + x * CELL, z0 + (z + 1) * CELL];
          if (!keepOut || !(r[2] > keepOut[0] && r[0] < keepOut[2] && r[3] > keepOut[1] && r[1] < keepOut[3])) out.push(r);   // the office corner is ours
          run = -1;
        }
      }
    }
    return { solids: out, box: box };
  }
  /* an easel for the board (the hall has no wall where the board should hang) */
  function easel(g, x, z, ry) {
    var e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry || 0; g.add(e);
    var wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.6 }), brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 });
    function b(m, px, py, pz, w, h, d) { var k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(px, py, pz); k.castShadow = true; e.add(k); return k; }
    [-1.12, 1.12].forEach(function (dx) { b(wood, dx, 1.25, -0.06, 0.07, 2.5, 0.07).rotation.x = 0.06; b(wood, dx, 0.03, -0.06, 0.12, 0.06, 0.5); });
    b(wood, 0, 0.86, -0.18, 2.3, 0.05, 0.16); b(wood, 0, 2.42, 0, 2.4, 0.08, 0.08); b(brass, 0, 2.42, -0.05, 0.1, 0.1, 0.1);
    return e;
  }

  /* take the scanned furniture out of the room mesh (it is fused in, full of holes): drop every triangle whose centre
     falls in a cut box [x0, y0, z0, x1, y1, z1] (room coordinates) — the floor under it stays */
  function cut(model, boxes) {
    if (!boxes || !boxes.length) return; model.updateMatrixWorld(true);
    var A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    model.traverse(function (m) {
      if (!m.isMesh || !m.geometry.index) return; var g = m.geometry, pos = g.attributes.position, idx = g.index, M = m.matrixWorld, keep = [];
      var get = function (i, v) { return v.set(raw(pos, i, 0), raw(pos, i, 1), raw(pos, i, 2)).applyMatrix4(M); };
      for (var k = 0; k + 2 < idx.count; k += 3) {
        var a = idx.getX(k), b = idx.getX(k + 1), c = idx.getX(k + 2); get(a, A); get(b, B); get(c, C);
        var x = (A.x + B.x + C.x) / 3, y = (A.y + B.y + C.y) / 3, z = (A.z + B.z + C.z) / 3;
        if (boxes.some(function (q) { return x > q[0] && x < q[3] && y > q[1] && y < q[4] && z > q[2] && z < q[5]; })) continue;
        keep.push(a, b, c);
      }
      if (keep.length !== idx.count) g.setIndex(keep);
    });
  }
  /* the surfaces of an outside model that things can stand on — so Spatial Home's things can be set out on it, not only
     on our own furniture: every horizontal face between 0.2 m and 2.3 m (table tops, cabinets, sills, mantels, shelves)
     plus one floor plane, as an invisible mesh the placing ray looks at (far fewer triangles than the model itself) */
  function surfacesOf(model, walk) {
    model.updateMatrixWorld(true);
    var A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), out = [];
    model.traverse(function (m) {
      if (!m.isMesh || !m.visible) return; var pos = m.geometry.attributes.position, idx = m.geometry.index, cnt = idx ? idx.count : pos.count, M = m.matrixWorld;
      var get = function (k, v) { var i = idx ? idx.getX(k) : k; return v.set(raw(pos, i, 0), raw(pos, i, 1), raw(pos, i, 2)).applyMatrix4(M); };
      for (var k = 0; k + 2 < cnt; k += 3) {
        get(k, A); get(k + 1, B); get(k + 2, C); var y = (A.y + B.y + C.y) / 3; if (y < 0.2 || y > 2.3) continue;
        e1.subVectors(B, A); e2.subVectors(C, A); n.crossVectors(e1, e2); var L = n.length(); if (L < 2e-4 || Math.abs(n.y / L) < 0.82) continue;
        out.push(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z);
      }
    });
    var mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), grp = new THREE.Group(); grp.name = 'surfaces';
    if (out.length) { var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); geo.computeBoundingSphere(); var sm = new THREE.Mesh(geo, mat); sm.visible = false; grp.add(sm); }
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(walk[2] - walk[0], walk[3] - walk[1]), mat); fl.rotation.x = -Math.PI / 2; fl.position.set((walk[0] + walk[2]) / 2, 0.001, (walk[1] + walk[3]) / 2); fl.visible = false; grp.add(fl);
    return { group: grp, tris: out.length / 9 };
  }
  /* the King's Hall chandelier, after the photograph of the room: a long red velvet rope from the ceiling sculpture, a gilt
     crown, and a cascade of crystal strands (clear, with blue glass beads) — narrow at the top, full in the middle,
     drawn to a point at the bottom — with candles inside. ~700 beads in one instanced mesh. */
  function chandelier(g, x, z, ceil) {
    var L = function (h) { return new THREE.Color(h).convertSRGBToLinear(); };
    var gold = new THREE.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.28, metalness: 0.9 }), velvet = new THREE.MeshStandardMaterial({ color: L(0x8a1f2c), roughness: 0.85 });
    var wax = new THREE.MeshStandardMaterial({ color: L(0xf3ead6), roughness: 0.6 });
    var flame = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    var c = new THREE.Group(); c.name = 'chandelier'; c.position.set(x, 0, z); g.add(c);
    var top = 2.78, bottom = 1.72;
    var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, ceil - top - 0.02, 12), velvet); rope.position.y = (ceil + top) / 2; c.add(rope);
    var tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 12), velvet); tassel.position.y = top + 0.06; c.add(tassel);
    var crown = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 8, 32), gold); crown.rotation.x = Math.PI / 2; crown.position.y = top; c.add(crown);
    var hoop = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.01, 8, 40), gold); hoop.rotation.x = Math.PI / 2; hoop.position.y = 2.2; c.add(hoop);
    /* the profile of the cascade: radius at height y */
    function rad(y) { var t = (top - y) / (top - bottom); return t < 0.55 ? 0.17 + (0.42 - 0.17) * Math.sin(t / 0.55 * Math.PI / 2) : 0.42 * Math.cos((t - 0.55) / 0.45 * Math.PI / 2) + 0.012; }
    var STR = 30, PER = 24, n = STR * PER, beadG = new THREE.OctahedronGeometry(0.016, 0);
    var beadM = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, shininess: 180, specular: 0xffffff, vertexColors: false });
    var inst = new THREE.InstancedMesh(beadG, beadM, n); inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), blue = new THREE.Color(0x5b7fe0), clear = new THREE.Color(0xf4f8ff), k = 0;
    for (var s2 = 0; s2 < STR; s2++) {
      var a0 = s2 / STR * Math.PI * 2;
      for (var j2 = 0; j2 < PER; j2++) {
        var y = top - 0.03 - j2 / (PER - 1) * (top - bottom - 0.03), r = rad(y), a = a0 + j2 * 0.035;   // the strands twist a little
        pos.set(Math.cos(a) * r, y, Math.sin(a) * r); var big = 0.8 + 0.5 * Math.sin(j2 * 1.7 + s2);
        sc.set(big, big * 1.5, big); m4.compose(pos, q, sc); inst.setMatrixAt(k, m4);
        var col = (j2 + s2) % 5 === 0 ? blue : clear; inst.instanceColor.setXYZ(k, col.r, col.g, col.b); k++;
      }
    }
    inst.instanceMatrix.needsUpdate = true; c.add(inst);
    var tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), beadM); tip.scale.set(1, 2.2, 1); tip.position.y = bottom - 0.05; c.add(tip);
    var cupG = new THREE.CylinderGeometry(0.03, 0.02, 0.025, 12), candleG = new THREE.CylinderGeometry(0.011, 0.011, 0.1, 8), flameG = new THREE.SphereGeometry(0.013, 8, 6);
    for (var i2 = 0; i2 < 8; i2++) {                                          // candles inside the cascade
      var b = i2 / 8 * Math.PI * 2, cx = Math.cos(b) * 0.24, cz = Math.sin(b) * 0.24;
      var cup = new THREE.Mesh(cupG, gold); cup.position.set(cx, 2.2, cz); c.add(cup);
      var cd = new THREE.Mesh(candleG, wax); cd.position.set(cx, 2.26, cz); c.add(cd);
      var fl = new THREE.Mesh(flameG, flame); fl.scale.set(1, 1.7, 1); fl.position.set(cx, 2.33, cz); c.add(fl);
    }
    var light = new THREE.PointLight(0xffe2b0, 0.85, 7, 2); light.position.y = 2.25; c.add(light);
    return c;
  }
  /* deep embedding: an outside model's own furniture becomes Spatial Home furniture. Each named node in def.movable is
     taken out of the room, kept as a template (origin at the bottom centre of its box) and offered as a Magical Backpack
     fixture 'glb:<room>:<node>'; the room is furnished once with them where they stood (event 'spatialhome:furnish'),
     after that they move, turn, carry things and go into the backpack like any other furniture. */
  var TPL = {};
  function kindOf(env, node) { return 'glb:' + env + ':' + node; }
  function registerMovable(def) {
    var SF = root.SpatialFurniture = root.SpatialFurniture || {}, CAT = root.SpatialFurnitureCatalog = root.SpatialFurnitureCatalog || [];
    (def.movable || []).forEach(function (mv) {
      var k = kindOf(def.id, mv.node);
      SF[k] = function () { var t = TPL[k]; if (!t) return { group: new THREE.Group(), hb: [0.1, 0.1, 0.1], place: 'floor' };   // not loaded yet: nothing until the room has loaded
        return { group: t.group.clone(true), hb: t.hb.slice(), place: t.place }; };
      if (!CAT.some(function (c) { return c.id === k; })) CAT.push({ id: k, name: mv.name, en: mv.node, icon: '▣', place: mv.place || 'floor', size: [0.5, 0.5, 0.5], note: def.name + ' 的家具' });
    });
  }
  function takeMovables(def, model) {
    var items = [], box = new THREE.Box3(), c = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
    model.updateMatrixWorld(true);
    (def.movable || []).forEach(function (mv, i) {
      var n = model.getObjectByName(mv.node); if (!n) return; var k = kindOf(def.id, mv.node);
      box.setFromObject(n); box.getCenter(c); c.y = box.min.y; var size = box.getSize(new THREE.Vector3());
      var t = n.clone(true); n.matrixWorld.decompose(P, Q, S); t.position.copy(P).sub(c); t.quaternion.copy(Q); t.scale.copy(S);
      var g = new THREE.Group(); g.add(t); t.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      TPL[k] = { group: g, node: mv.node, hb: [size.x, size.y, size.z], place: c.y > 0.08 ? 'surface' : (mv.place || 'floor') };
      n.parent.remove(n);
      items.push({ kind: k, title: mv.name, p: [+c.x.toFixed(3), +c.y.toFixed(3), +c.z.toFixed(3)], ry: 0, uid: 9500 + i });
    });
    return items;
  }

  /* ───────── the Victorian Study, finished as the EC–6 room (2026-11-13) ───────── */
  function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  /* the study's movable rugs come with a blurry texture: a Persian rug, painted (field, medallion, spandrels, a border
     with guard stripes and a vine), mapped flat over the rug's top */
  function rugTexture() {
    var c = document.createElement('canvas'); c.width = 1536; c.height = 1024; var x = c.getContext('2d'), W = c.width, H = c.height, i;
    x.fillStyle = '#1c2340'; x.fillRect(0, 0, W, H);
    function frame(m, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.strokeRect(m, m, W - 2 * m, H - 2 * m); }
    frame(14, '#c99a4a', 10); frame(30, '#7a1c22', 8);
    x.strokeStyle = '#d9b46a'; x.lineWidth = 5; x.beginPath();
    var P = 2 * (W - 160) + 2 * (H - 160);
    for (i = 0; i <= 1200; i++) { var d = i / 1200 * P, w = Math.sin(i / 1200 * 260) * 16, px, py;
      if (d < W - 160) { px = 80 + d; py = 80 + w; } else if ((d -= W - 160) < H - 160) { px = W - 80 + w; py = 80 + d; } else if ((d -= H - 160) < W - 160) { px = W - 80 - d; py = H - 80 + w; } else { d -= W - 160; px = 80 + w; py = H - 80 - d; }
      if (i) x.lineTo(px, py); else x.moveTo(px, py); }
    x.stroke();
    for (i = 0; i < 260; i++) { var t = i / 260 * P, q = t, qx, qy; if (q < W - 160) { qx = 80 + q; qy = 80; } else if ((q -= W - 160) < H - 160) { qx = W - 80; qy = 80 + q; } else if ((q -= H - 160) < W - 160) { qx = W - 80 - q; qy = H - 80; } else { q -= W - 160; qx = 80; qy = H - 80 - q; }
      x.fillStyle = i % 2 ? '#a8323a' : '#f0e2c0'; x.beginPath(); x.arc(qx, qy, 6, 0, 6.3); x.fill(); }
    frame(124, '#c99a4a', 10); frame(140, '#f0e2c0', 4);
    x.fillStyle = '#7a1c22'; x.fillRect(146, 146, W - 292, H - 292);
    x.strokeStyle = 'rgba(217,180,106,.35)'; x.lineWidth = 3;          // the field's lattice of small flowers
    for (var gx = 190; gx < W - 160; gx += 64) for (var gy = 190; gy < H - 160; gy += 64) { x.beginPath(); x.moveTo(gx - 10, gy); x.lineTo(gx, gy - 10); x.lineTo(gx + 10, gy); x.lineTo(gx, gy + 10); x.closePath(); x.stroke(); x.fillStyle = (gx + gy) % 128 ? 'rgba(28,35,64,.6)' : 'rgba(240,226,192,.45)'; x.beginPath(); x.arc(gx, gy, 3.5, 0, 6.3); x.fill(); }
    function loz(rx, ry, col) { x.fillStyle = col; x.beginPath(); x.moveTo(W / 2 - rx, H / 2); x.quadraticCurveTo(W / 2 - rx * 0.3, H / 2 - ry * 0.35, W / 2, H / 2 - ry); x.quadraticCurveTo(W / 2 + rx * 0.3, H / 2 - ry * 0.35, W / 2 + rx, H / 2); x.quadraticCurveTo(W / 2 + rx * 0.3, H / 2 + ry * 0.35, W / 2, H / 2 + ry); x.quadraticCurveTo(W / 2 - rx * 0.3, H / 2 + ry * 0.35, W / 2 - rx, H / 2); x.fill(); }
    loz(470, 330, '#c99a4a'); loz(440, 300, '#1c2340'); loz(330, 220, '#a8323a'); loz(200, 135, '#f0e2c0'); loz(140, 92, '#2f5a3a'); loz(60, 40, '#d9b46a');
    for (i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; x.fillStyle = i % 2 ? '#d9b46a' : '#f0e2c0'; x.beginPath(); x.arc(W / 2 + Math.cos(a) * 265, H / 2 + Math.sin(a) * 175, 12, 0, 6.3); x.fill(); }
    [[146, 146, 1, 1], [W - 146, 146, -1, 1], [146, H - 146, 1, -1], [W - 146, H - 146, -1, -1]].forEach(function (q) {
      x.fillStyle = '#1c2340'; x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[0] + q[2] * 260, q[1]); x.quadraticCurveTo(q[0] + q[2] * 120, q[1] + q[3] * 120, q[0], q[1] + q[3] * 180); x.fill();
      x.fillStyle = '#c99a4a'; x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[0] + q[2] * 160, q[1]); x.quadraticCurveTo(q[0] + q[2] * 70, q[1] + q[3] * 70, q[0], q[1] + q[3] * 110); x.fill(); });
    var im = x.getImageData(0, 0, W, H), D = im.data;                   // wool: a little noise and the pile's lines
    for (i = 0; i < D.length; i += 4) { var n = (Math.random() - 0.5) * 18 - ((i / 4 / W | 0) % 3 === 0 ? 6 : 0); D[i] += n; D[i + 1] += n; D[i + 2] += n; }
    x.putImageData(im, 0, 0);
    var tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; tx.anisotropy = 8; return tx;
  }
  /* flat UVs over a rug's top, from its own positions (the long side along u) */
  function rugUV(geo) {
    var p = geo.attributes.position, n = p.count, mn = [1e9, 1e9], mx = [-1e9, -1e9], i;
    for (i = 0; i < n; i++) { mn[0] = Math.min(mn[0], p.getX(i)); mx[0] = Math.max(mx[0], p.getX(i)); mn[1] = Math.min(mn[1], p.getZ(i)); mx[1] = Math.max(mx[1], p.getZ(i)); }
    var sw = (mx[0] - mn[0]) < (mx[1] - mn[1]), uv = new Float32Array(n * 2);
    for (i = 0; i < n; i++) { var u = (p.getX(i) - mn[0]) / (mx[0] - mn[0] || 1), v = (p.getZ(i) - mn[1]) / (mx[1] - mn[1] || 1); uv[2 * i] = sw ? v : u; uv[2 * i + 1] = sw ? u : v; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  /* a Victorian coffered ceiling under the model's plain one: walnut beams on a 2.5 m grid (each chandelier hangs in the
     middle of a coffer), cream panels with a gilt fillet and a painted rosette, a stepped crown moulding, gilt medallions */
  function cofferTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 512; var x = c.getContext('2d'), S = 512, m = S / 2, i;
    var g = x.createRadialGradient(m, m, 20, m, m, 330); g.addColorStop(0, '#f4ead2'); g.addColorStop(1, '#d9c8a0'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.strokeStyle = '#b8903a'; x.lineWidth = 10; x.strokeRect(34, 34, S - 68, S - 68);
    x.strokeStyle = '#7a5a24'; x.lineWidth = 2; x.strokeRect(48, 48, S - 96, S - 96);
    x.strokeStyle = '#c9a24a'; x.lineWidth = 3; x.strokeRect(70, 70, S - 140, S - 140);
    [[70, 70], [S - 70, 70], [70, S - 70], [S - 70, S - 70]].forEach(function (q) { x.fillStyle = '#c9a24a'; x.beginPath(); x.arc(q[0], q[1], 12, 0, 6.3); x.fill(); x.fillStyle = '#5a7a6a'; x.beginPath(); x.arc(q[0], q[1], 5, 0, 6.3); x.fill(); });
    for (i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; x.save(); x.translate(m, m); x.rotate(a); x.fillStyle = i % 2 ? '#8aa898' : '#6a8a7a';
      x.beginPath(); x.moveTo(0, 18); x.quadraticCurveTo(34, 70, 0, 118); x.quadraticCurveTo(-34, 70, 0, 18); x.fill();
      x.strokeStyle = '#c9a24a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 26); x.lineTo(0, 108); x.stroke(); x.restore(); }
    x.strokeStyle = '#c9a24a'; x.lineWidth = 4; x.beginPath(); x.arc(m, m, 128, 0, 6.3); x.stroke(); x.lineWidth = 1.5; x.beginPath(); x.arc(m, m, 138, 0, 6.3); x.stroke();
    for (i = 0; i < 24; i++) { var b = i / 24 * Math.PI * 2; x.fillStyle = '#b8903a'; x.beginPath(); x.arc(m + Math.cos(b) * 133, m + Math.sin(b) * 133, 3, 0, 6.3); x.fill(); }
    x.fillStyle = '#c9a24a'; x.beginPath(); x.arc(m, m, 22, 0, 6.3); x.fill(); x.fillStyle = '#9a3a2a'; x.beginPath(); x.arc(m, m, 10, 0, 6.3); x.fill();
    var im = x.getImageData(0, 0, S, S), D = im.data; for (i = 0; i < D.length; i += 4) { var n = (Math.random() - 0.5) * 10; D[i] += n; D[i + 1] += n; D[i + 2] += n; } x.putImageData(im, 0, 0);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  }
  function cofferedCeiling(holder) {
    var X0 = -8.45, X1 = 8.45, Z0 = -13.55, Z1 = 3.35, Y = 6.06, G = 2.5, gx0 = 1.25, gz0 = -0.65, g = new THREE.Group(); g.name = 'ceiling'; holder.add(g);
    var tex = cofferTexture(), geo = new THREE.BufferGeometry(), P = [X0, Y, Z0, X1, Y, Z0, X1, Y, Z1, X0, Y, Z1], U = [];
    for (var i = 0; i < 4; i++) U.push((P[3 * i] - gx0) / G, (P[3 * i + 2] - gz0) / G);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    var panelM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 }); g.add(new THREE.Mesh(geo, panelM));
    var wood = new THREE.MeshStandardMaterial({ color: lin(0x4a2a18), roughness: 0.45, metalness: 0.05 }), gilt = new THREE.MeshStandardMaterial({ color: lin(0xc9a24a), roughness: 0.3, metalness: 0.85 });
    var BW = 0.24, BD = 0.26, box = new THREE.BoxGeometry(1, 1, 1), beams = [], beads = [];
    function beam(x, z, w, d) { beams.push([x, Y - BD / 2, z, w, BD, d]); beads.push([x, Y - BD - 0.012, z, Math.max(w > d ? w : 0.06, 0.06), 0.024, Math.max(d > w ? d : 0.06, 0.06)]); }
    for (var bx = gx0 - G * 4; bx <= X1; bx += G) if (bx > X0 + 0.3 && bx < X1 - 0.3) beam(bx, (Z0 + Z1) / 2, BW, Z1 - Z0);
    for (var bz = gz0 - G * 6; bz <= Z1; bz += G) if (bz > Z0 + 0.3 && bz < Z1 - 0.3) beam(0, bz, X1 - X0, BW);
    function inst(list, mat) { var im = new THREE.InstancedMesh(box, mat, list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(); list.forEach(function (b, k) { M.compose(new THREE.Vector3(b[0], b[1], b[2]), q, new THREE.Vector3(b[3], b[4], b[5])); im.setMatrixAt(k, M); }); g.add(im); }
    inst(beams, wood); inst(beads, gilt);
    /* the crown moulding: three steps round the walls, a gilt fillet between */
    var crown = [], cg = [];
    [[0.34, 0.5, 0], [0.22, 0.3, 0.34], [0.12, 0.16, 0.56]].forEach(function (st) { var dpt = st[0], h = st[1], o = st[2];
      crown.push([(X0 + X1) / 2, Y - h / 2, Z0 + o + dpt / 2, X1 - X0, h, dpt], [(X0 + X1) / 2, Y - h / 2, Z1 - o - dpt / 2, X1 - X0, h, dpt], [X0 + o + dpt / 2, Y - h / 2, (Z0 + Z1) / 2, dpt, h, Z1 - Z0], [X1 - o - dpt / 2, Y - h / 2, (Z0 + Z1) / 2, dpt, h, Z1 - Z0]);
      cg.push([(X0 + X1) / 2, Y - h - 0.01, Z0 + o + dpt, X1 - X0, 0.02, 0.03], [(X0 + X1) / 2, Y - h - 0.01, Z1 - o - dpt, X1 - X0, 0.02, 0.03], [X0 + o + dpt, Y - h - 0.01, (Z0 + Z1) / 2, 0.03, 0.02, Z1 - Z0], [X1 - o - dpt, Y - h - 0.01, (Z0 + Z1) / 2, 0.03, 0.02, Z1 - Z0]); });
    inst(crown, wood); inst(cg, gilt);
    /* a gilt medallion over each chandelier: a turned rosette with a ring of leaves */
    var prof = [[0, 0], [0.62, 0], [0.62, -0.03], [0.55, -0.05], [0.5, -0.04], [0.42, -0.07], [0.3, -0.06], [0.22, -0.1], [0.12, -0.12], [0.08, -0.2], [0, -0.21]].map(function (q) { return new THREE.Vector2(q[0], q[1]); });
    var med = new THREE.LatheGeometry(prof, 40), leaf = new THREE.SphereGeometry(0.07, 10, 6), cream = new THREE.MeshStandardMaterial({ color: lin(0xf0e2c0), roughness: 0.6 });
    [[0, -9.4], [0, -1.9]].forEach(function (c) {
      var m = new THREE.Mesh(med, gilt); m.position.set(c[0], Y - 0.001, c[1]); g.add(m);
      var plate = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), cream); plate.rotation.x = Math.PI / 2; plate.position.set(c[0], Y - 0.003, c[1]); g.add(plate);
      for (var k = 0; k < 16; k++) { var a = k / 16 * Math.PI * 2, l = new THREE.Mesh(leaf, gilt); l.scale.set(0.6, 0.35, 1.6); l.position.set(c[0] + Math.cos(a) * 0.74, Y - 0.03, c[1] + Math.sin(a) * 0.74); l.rotation.y = -a + Math.PI / 2; g.add(l); }
    });
    return function () { tex.dispose(); panelM.dispose(); };
  }
  function victorianFinish(ctx) {
    var holder = ctx.holder, model = ctx.model, scene = ctx.scene, R = SR.renderer, parts = [], lights = [];
    var rug = rugTexture(), rugM = new THREE.MeshStandardMaterial({ map: rug, roughness: 0.95, metalness: 0 });
    ctx.templates.forEach(function (t) { if (!/Rug/.test(t.node || '')) return; t.group.traverse(function (o) { if (o.isMesh) { o.geometry = o.geometry.clone(); rugUV(o.geometry); o.material = rugM; } }); });
    var ceilDispose = cofferedCeiling(holder);
    /* reflections: a small warm room rendered once into an environment map */
    var envTex = null;
    if (R && THREE.PMREMGenerator) {
      var es = new THREE.Scene(), bx = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 12), new THREE.MeshBasicMaterial({ color: lin(0x3a2416), side: THREE.BackSide })); es.add(bx);
      [[0, 2.5, -5, 0xffc27a, 3], [0, 2.9, 0, 0xffe0b0, 2], [-5, 1.5, 0, 0x8a5a3a, 1.2], [5, 1.5, 2, 0x8a5a3a, 1.2]].forEach(function (q) { var p = new THREE.Mesh(new THREE.PlaneGeometry(q[4], q[4] * 0.6), new THREE.MeshBasicMaterial({ color: lin(q[3]), side: THREE.DoubleSide })); p.position.set(q[0], q[1], q[2]); p.lookAt(0, 1.5, 0); es.add(p); });
      var pm = new THREE.PMREMGenerator(R); envTex = pm.fromScene(es, 0.04).texture; pm.dispose(); scene.environment = envTex;
    }
    /* the chandeliers light the room: candle-warm, a slight flicker */
    [[0, 4.7, -9.4], [0, 4.7, -1.9]].forEach(function (p) { var l = new THREE.PointLight(0xffc98a, 1.1, 12, 2); l.position.fromArray(p); holder.add(l); lights.push({ l: l, base: 0.9, f: Math.random() * 9 }); });
    /* the fire in the hearth: logs, flames, embers, its light */
    var fire = new THREE.Group(); fire.position.set(0, 0.17, -12.3); holder.add(fire);
    var logM = new THREE.MeshStandardMaterial({ color: lin(0x3a2416), roughness: 0.9 }), emb = new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false }), ash = new THREE.MeshStandardMaterial({ color: lin(0x2a2420), roughness: 1 });
    [[-0.12, 0.3], [0.14, -0.35]].forEach(function (q) { var lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 10), logM); lg.rotation.z = Math.PI / 2; lg.rotation.y = q[1]; lg.position.set(q[0] * 0.3, 0.08, q[0]); fire.add(lg); });
    var bed = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), ash); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.006; fire.add(bed);
    var embers = []; for (var e = 0; e < 18; e++) { var eb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018 + Math.random() * 0.02, 0), emb.clone()); var ea = Math.random() * 6.3, er = Math.random() * 0.24; eb.position.set(Math.cos(ea) * er, 0.015, Math.sin(ea) * er * 0.6); fire.add(eb); embers.push(eb); }
    var flameTex = (function () { var c = document.createElement('canvas'); c.width = 64; c.height = 128; var x = c.getContext('2d'), g = x.createRadialGradient(32, 96, 4, 32, 80, 60); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.35, 'rgba(255,170,60,0.85)'); g.addColorStop(0.7, 'rgba(230,80,20,0.35)'); g.addColorStop(1, 'rgba(120,20,0,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(32, 2); x.quadraticCurveTo(64, 70, 50, 120); x.lineTo(14, 120); x.quadraticCurveTo(0, 70, 32, 2); x.fill(); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
    var flames = []; for (var i = 0; i < 9; i++) { var fm = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.5), new THREE.MeshBasicMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })); fm.position.set((i - 4) * 0.065, 0.27, (i % 3 - 1) * 0.06); fm.rotation.y = (i % 3 - 1) * 0.5; fire.add(fm); flames.push(fm); }
    var fireL = new THREE.PointLight(0xff8a3a, 1.4, 7, 2); fireL.position.set(0, 0.6, 0.5); fire.add(fireL);
    /* the desk: a green banker's lamp and the EC–6 study books */
    var desk = new THREE.Group(); holder.add(desk);
    var brass = new THREE.MeshStandardMaterial({ color: lin(0xc9a24a), roughness: 0.28, metalness: 0.9 }), shadeM = new THREE.MeshStandardMaterial({ color: lin(0x1f6b3a), roughness: 0.25, metalness: 0.1, emissive: lin(0x0a2a14), side: THREE.DoubleSide });
    var lamp = new THREE.Group(); lamp.position.set(-0.62, 0.725, -2.1); desk.add(lamp);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 20), brass); base.position.y = 0.015; lamp.add(base);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10), brass); stem.position.y = 0.19; lamp.add(stem);
    var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.09, 24, 1, true, 0, Math.PI), shadeM); shade.rotation.z = Math.PI / 2; shade.rotation.y = Math.PI / 2; shade.position.set(0, 0.36, 0.04); shade.scale.set(1, 1.6, 1); lamp.add(shade);
    var lampL = new THREE.PointLight(0xfff0c8, 0.55, 2.4, 2); lampL.position.set(0.05, 0.3, 0.05); lamp.add(lampL);
    var bookCols = [0x7a1c22, 0x1c2340, 0x2f5a3a, 0x8a6a2a], bk = new THREE.Group(); bk.position.set(0.05, 0.725, -2.55); bk.rotation.y = 0.2; desk.add(bk);
    bookCols.forEach(function (col, i) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.22 - i * 0.012, 0.035, 0.16 - i * 0.008), new THREE.MeshStandardMaterial({ color: lin(col), roughness: 0.7 })); b.position.y = 0.018 + i * 0.036; b.rotation.y = (i % 2 - 0.5) * 0.12; bk.add(b);
      var pg = new THREE.Mesh(new THREE.BoxGeometry(0.205 - i * 0.012, 0.028, 0.004), new THREE.MeshStandardMaterial({ color: lin(0xf0e6cf), roughness: 0.8 })); pg.position.set(0, 0.018 + i * 0.036, 0.08 - i * 0.004); bk.add(pg); });
    var mode = 'auto';
    function apply() { var T = SR.timeOfDay(mode), N = T.night; lights.forEach(function (q) { q.base = 0.75 + 0.5 * N; }); lampL.intensity = 0.35 + 0.45 * N; ctx.hemi.intensity = 0.55 + 0.2 * (1 - N); }
    apply();
    return {
      tick: function (t) {
        var f = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7) + 0.08 * Math.sin(t * 23);
        fireL.intensity = 1.2 * f; flames.forEach(function (m, i) { var k = 0.8 + 0.3 * Math.sin(t * (6 + i) + i * 2); m.scale.set(1, k, 1); m.position.y = 0.12 + 0.13 * k; m.material.opacity = 0.75 + 0.25 * Math.sin(t * 11 + i); });
        embers.forEach(function (b, i) { b.material.color.setHSL(0.04 + 0.03 * Math.sin(t * 2 + i), 1, 0.45 + 0.12 * Math.sin(t * 3.1 + i * 1.7)); });
        lights.forEach(function (q) { q.l.intensity = q.base * (0.94 + 0.06 * Math.sin(t * 7 + q.f)); });
      },
      setTime: function (m) { mode = m || 'auto'; apply(); },
      dispose: function () { if (scene.environment === envTex) scene.environment = null; if (envTex) envTex.dispose(); ceilDispose(); rug.dispose(); rugM.dispose(); }
    };
  }
  function makeEnv(def) {
    registerMovable(def);
    return function build(scene) {
      var holder = new THREE.Group(); holder.name = 'env-' + def.id; scene.add(holder);
      var g = new THREE.Group(); holder.add(g);
      PT.theme(null);
      if (!def.showroom) { PT.desk(g); PT.chair(g); PT.bookshelf(g); PT.cabinet(g); easel(g, -1.9, -2.42, 0); }   // the office corner: Spatial Home's own furniture
      else easel(g, def.easel[0], def.easel[1], def.easel[2]);
      var hemi = new THREE.HemisphereLight(0xfff3e0, 0x3a2e24, def.lit ? 0.75 : 0.9); holder.add(hemi);
      var sun = new THREE.DirectionalLight(0xffe9c8, 0.8); sun.position.set(-2, 5, 3); sun.target.position.set(0, 0.6, -1.2);
      sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); var sc = sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 14; sun.shadow.bias = -0.0006;
      holder.add(sun); holder.add(sun.target);
      if (def.lit) [[0, 3.6, 0], [-3.5, 3, 4], [3.5, 3, 4], [0, 3.4, 8]].forEach(function (p) { var l = new THREE.PointLight(0xffd9a6, 0.55, 12, 2); l.position.fromArray(p); holder.add(l); });
      scene.fog = null; scene.background = new THREE.Color(def.bg || 0x0e0b09);

      var A = PT.anchors(0.95), PI = Math.PI;
      A['sill.left'] = { p: [-0.85, 0.78, -2.3], ry: 0 };               // no window sill here: the ornament stands at the back of the desk
      A['wall.left'] = { p: [-1.9, 1.62, -2.4], ry: 0 };                // the EC–6 board, on the easel
      A['wall.right'] = { p: [1.6, 1.55, -2.45], ry: 0 };
      A['floor.portal'] = { p: [-2.4, 0, 1.6], ry: PI / 2 };            // the portal arch stands free in the hall
      A['floor.holo'] = { p: [1.6, 0, 1.05], ry: -PI / 2 };
      if (def.anchors) Object.keys(def.anchors).forEach(function (k) { A[k] = def.anchors[k]; });   // a showroom places every thing itself
      var solids = def.showroom ? [] : PT.solids().slice(), office = def.showroom ? null : [-3.1, -2.7, 3.1, 2.7];
      var areas = [def.walk.slice()], surfaces = [], fin = null, tmode = 'auto';
      if (def.chandelier) chandelier(g, def.chandelier[0], def.chandelier[1], def.chandelier[2]);                                   // the whole hall can be walked; the model's own obstacles stop you

      gltfLoader().then(function () {
        new THREE.GLTFLoader().load(siteBase() + def.glb, function (gl) {
          if (!holder.parent) return;                                   // the room was switched away while loading
          var m = gl.scene; m.position.fromArray(def.offset); m.rotation.y = def.ry || 0;
          m.traverse(function (o) { if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.receiveShadow = !!def.lit; if (o.material.map) o.material.map.anisotropy = 4; } });
          holder.add(m); cut(m, def.cut);
          var furn = takeMovables(def, m);
          var R = solidsOf(m, 0, office); R.solids.forEach(function (s) { solids.push(s); });
          var SF = surfacesOf(m, def.walk); holder.add(SF.group); surfaces.push(SF.group);      // things can stand on the model now
          if (def.finish) try { fin = def.finish({ holder: holder, model: m, scene: scene, hemi: hemi, templates: Object.keys(TPL).filter(function (k) { return k.indexOf('glb:' + def.id + ':') === 0; }).map(function (k) { return TPL[k]; }) }); if (fin && fin.setTime) fin.setTime(tmode); } catch (er) { if (root.console) console.warn('Spatial Home: finishing ' + def.id, er); }
          if (def.movable) try { root.dispatchEvent(new CustomEvent('spatialhome:furnish', { detail: { env: def.id, items: furn } })); } catch (er) {}
        }, undefined, function (e) { if (root.console) console.warn('Spatial Home: ' + def.id + ' model could not load', e); });
      }, function () {});

      return {
        id: def.id, name: def.name, group: g, holder: holder, far: 80, size: { W: 3.0, D: 2.6, H: def.h },
        anchors: A, avatar: PT.avatar, start: def.start || PT.start, desk: def.deskCam || PT.deskCam, solids: solids, areas: areas, credit: def.credit,
        surfaces: surfaces,
        defaultLayout: def.layout ? function () { return JSON.parse(JSON.stringify(def.layout)); } : null,
        setTime: function (m) { tmode = m || 'auto'; if (fin && fin.setTime) fin.setTime(tmode); }, tick: function (t) { if (fin && fin.tick) fin.tick(t); },
        dispose: function () { if (fin && fin.dispose) fin.dispose(); SR.disposeTree(holder); scene.background = null; }
      };
    };
  }
  /* offset: where the model sits so the office corner (x −3…3, z −2.6…2.6, desk at the back) lands in an open part of the room */
  /* The King's Hall showroom: the hall's own long table (rebuilt clean, furniture.js) is the desk — the model sits so the
     table stands where the Spatial Home desk is (centre 0, −1.9); the scanned table and chairs are cut out of the mesh and
     the clean ones stand in their exact places. Things on the table top (0.80 m), the board on an easel, the rest on
     pedestals along the right — all movable, all furniture in the Magical Backpack. */
  var PI = Math.PI, TY = 0.805;
  var KINGS = { id: 'kings-hall', name: "The King's Hall · Skokloster", glb: 'interiors-glb/assets/kings_hall.glb', h: 4.5, showroom: true,
    offset: [0.37, 1.3, -10.735], walk: [-5.6, -9.9, 5.6, 5.2],
    cut: [[-1.1, 0.06, -2.86, 1.2, 1.5, -0.93], [-0.52, 1.6, -2.3, 0.54, 3.42, -1.22]],   // the table and chairs; the chandelier (below the ceiling rosette)
    chandelier: [0.01, -1.765, 3.42],
    easel: [-2.0, -0.75, 0],
    start: { pos: [0.6, 1.5, 1.6], yaw: 0.12, pitch: -0.12 }, deskCam: { pos: [0, 1.45, -0.2], look: [0, 0.82, -2.1] },
    anchors: {
      'desk.left': { p: [0, TY, -1.5], ry: 0 }, 'desk.right': { p: [0.22, TY, -2.08], ry: 0.1 }, 'desk.quill': { p: [-0.26, TY, -1.72], ry: 0.25 },
      'desk.key': { p: [0.27, TY, -1.42], ry: 0.3 }, 'desk.mochi': { p: [-0.22, TY, -2.38], ry: -0.3 }, 'desk.book': { p: [0.16, TY, -2.46], ry: 0 },
      'wall.left': { p: [-2.0, 1.62, -0.73], ry: 0 }, 'wall.right': { p: [2.1, 0.92, -0.5], ry: -PI / 2 },
      'shelf.mid': { p: [2.1, 0.92, -3.3], ry: -PI / 2 }, 'cabinet.left': { p: [2.1, 0.92, -2.6], ry: -PI / 2 }, 'cabinet.top': { p: [2.1, 0.92, -1.9], ry: -PI / 2 },
      'cabinet.right': { p: [2.1, 0.92, -1.2], ry: -PI / 2 }, 'sill.left': { p: [2.1, 0.92, -0.5], ry: -PI / 2 },
      'corner.window': { p: [-2.6, 0, -3.6], ry: PI / 2 }, 'floor.pack': { p: [-1.2, 0, 0.5], ry: 0.45 }, 'floor.gramo': { p: [-2.7, 0, -2.2], ry: PI / 2 },
      'floor.film': { p: [2.9, 0, 1.4], ry: -PI / 2 }, 'floor.portal': { p: [-3.6, 0, 1.6], ry: PI / 2 }, 'floor.holo': { p: [3.0, 0, -4.4], ry: -PI / 2 }
    },
    layout: { extras: [
      { kind: 'kh-table', p: [-0.0, 0, -1.9], ry: 0, uid: 9101 },
      { kind: 'kh-chair', p: [-0.66, 0, -2.25], ry: PI / 2, uid: 9102 }, { kind: 'kh-chair', p: [-0.66, 0, -1.55], ry: PI / 2, uid: 9103 },
      { kind: 'kh-chair', p: [0.66, 0, -2.25], ry: -PI / 2, uid: 9104 }, { kind: 'kh-chair', p: [0.66, 0, -1.55], ry: -PI / 2, uid: 9105 },
      { kind: 'pedestal', p: [2.1, 0, -3.3], ry: -PI / 2, uid: 9111 }, { kind: 'pedestal', p: [2.1, 0, -2.6], ry: -PI / 2, uid: 9112 },
      { kind: 'pedestal', p: [2.1, 0, -1.9], ry: -PI / 2, uid: 9113 }, { kind: 'pedestal', p: [2.1, 0, -1.2], ry: -PI / 2, uid: 9114 },
      { kind: 'pedestal', p: [2.1, 0, -0.5], ry: -PI / 2, uid: 9115 }
    ] },
    credit: 'The King\u2019s Hall, Skokloster Castle — scan by Erik Lernestål, CC BY 4.0' };
  /* The Victorian Study, embedded deep: its south round table is the desk (things on its top), the north table carries
     the projector, album, medals, car and ornament, and its own armchairs, tables, vases, viola, rugs and ladders are
     movable furniture. The model's floor is 0.2 m up, so it sits 0.2 m down; the south table lands on the desk spot. */
  var VY = 0.725;
  var VICT = { id: 'victorian', name: 'EC–6 Victorian Study', finish: victorianFinish, glb: 'interiors-glb/assets/victorian_study.glb', h: 6.5, lit: true, showroom: true,
    offset: [0, -0.2, -5.1], walk: [-8.4, -13.5, 8.4, 3.4], easel: [-2.7, -0.4, 0.35],
    start: { pos: [0.7, 1.5, 1.4], yaw: 0.1, pitch: -0.12 }, deskCam: { pos: [0, 1.4, -0.4], look: [0, 0.75, -2.0] },
    movable: [
      { node: 'Armchair_NE', name: '扶手椅' }, { node: 'Armchair_NW', name: '扶手椅' }, { node: 'Armchair_SE', name: '扶手椅' }, { node: 'Armchair_SW', name: '扶手椅' },
      { node: 'Table_North', name: '圆桌' }, { node: 'Table_South', name: '圆桌 · 书桌' }, { node: 'Vase_North', name: '花瓶' }, { node: 'Vase_South', name: '花瓶' },
      { node: 'Viola', name: '小提琴' }, { node: 'Rug_Hearth_North', name: '壁炉地毯' }, { node: 'Rug_Reading_South', name: '阅读地毯' },
      { node: 'Ladder_North', name: '图书梯' }, { node: 'Ladder_West', name: '图书梯' }
    ],
    anchors: {
      'desk.left': { p: [0.15, VY, -1.35], ry: 0 }, 'desk.right': { p: [0.5, VY, -1.95], ry: -0.3 }, 'desk.quill': { p: [-0.45, VY, -1.5], ry: 0.3 },
      'desk.key': { p: [0.35, VY, -1.2], ry: 0.3 }, 'desk.mochi': { p: [0.45, VY, -2.45], ry: -0.3 }, 'desk.book': { p: [-0.35, VY, -2.5], ry: 0 },
      'wall.left': { p: [-2.7, 1.62, -0.38], ry: 0.35 }, 'wall.right': { p: [0, VY, -8.95], ry: 0 },
      'cabinet.top': { p: [-0.5, VY, -9.4], ry: 0 }, 'cabinet.left': { p: [0.5, VY, -9.4], ry: 0 }, 'cabinet.right': { p: [0, VY, -8.95], ry: 0 },
      'shelf.mid': { p: [-0.45, VY, -9.95], ry: 0 }, 'sill.left': { p: [0.45, VY, -9.95], ry: 0 },
      'corner.window': { p: [4.2, 0, -1.6], ry: -Math.PI / 2 }, 'floor.pack': { p: [-1.1, 0, 0.5], ry: 0.45 }, 'floor.gramo': { p: [-3.6, 0, -4.2], ry: Math.PI / 2 },
      'floor.film': { p: [3.4, 0, -0.4], ry: -Math.PI / 2 }, 'floor.portal': { p: [-6.6, 0, -6.0], ry: Math.PI / 2 }, 'floor.holo': { p: [3.6, 0, -4.6], ry: -Math.PI / 2 }
    },
    credit: 'Victorian Study — Fox Dev assets, with the author\u2019s permission' };
  SR.register({ id: 'kings-hall', name: "The King's Hall", zh: '斯科克洛斯特城堡 · 国王大厅', icon: '♛', build: makeEnv(KINGS) });
  SR.register({ id: 'victorian', name: 'EC–6 Victorian Study', zh: 'EC–6 备考书房 · 维多利亚', icon: '▤', build: makeEnv(VICT) });
})(window);
