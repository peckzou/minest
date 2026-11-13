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
    if (THREE.GLTFLoader && root.MeshoptDecoder) return Promise.resolve();
    function add(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = siteBase() + src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
    if (!loaderP) loaderP = Promise.all([THREE.GLTFLoader ? null : add('vendor/GLTFLoader.js'), root.MeshoptDecoder ? null : add('vendor/meshopt_decoder.js')]);   // the scans ship meshopt-compressed
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
      if (!m.isMesh) return; if (!m.geometry.index) { var nIdx = []; for (var ii = 0; ii < m.geometry.attributes.position.count; ii++) nIdx.push(ii); m.geometry.setIndex(nIdx); }
      var g = m.geometry, pos = g.attributes.position, idx = g.index, M = m.matrixWorld, keep = [];
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
  /* window glass out of a scan: inside each box, drop only the triangles whose texture is near-white (the blown-out
     glass and sheers); the frames and glazing bars, darker, stay — the view outside then shows through */
  function cutGlass(model, boxes, thr) {
    if (!boxes || !boxes.length) return; model.updateMatrixWorld(true);
    var A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), cv = document.createElement('canvas'), cx = cv.getContext('2d');
    model.traverse(function (m) {
      if (!m.isMesh || !m.geometry.index || !m.material || !m.material.map || !m.material.map.image || !m.geometry.attributes.uv) return;
      var g = m.geometry, pos = g.attributes.position, uv = g.attributes.uv, idx = g.index, M = m.matrixWorld, keep = [], img = m.material.map.image, D = null, w = 0, h = 0, fy = m.material.map.flipY;
      var get = function (i, v) { return v.set(raw(pos, i, 0), raw(pos, i, 1), raw(pos, i, 2)).applyMatrix4(M); };
      for (var k = 0; k + 2 < idx.count; k += 3) {
        var a = idx.getX(k), b = idx.getX(k + 1), c = idx.getX(k + 2); get(a, A); get(b, B); get(c, C);
        var x = (A.x + B.x + C.x) / 3, y = (A.y + B.y + C.y) / 3, z = (A.z + B.z + C.z) / 3;
        if (boxes.some(function (q) { return x > q[0] && x < q[3] && y > q[1] && y < q[4] && z > q[2] && z < q[5]; })) {
          if (!D) { w = Math.max(1, img.width / 4 | 0); h = Math.max(1, img.height / 4 | 0); cv.width = w; cv.height = h; cx.drawImage(img, 0, 0, w, h); D = cx.getImageData(0, 0, w, h).data; }
          var u = (raw(uv, a, 0) + raw(uv, b, 0) + raw(uv, c, 0)) / 3, v = (raw(uv, a, 1) + raw(uv, b, 1) + raw(uv, c, 1)) / 3;
          var px = Math.min(w - 1, Math.max(0, (u % 1) * w | 0)), py = Math.min(h - 1, Math.max(0, ((fy ? 1 - v : v) % 1) * h | 0)), o = (py * w + px) * 4;
          if ((D[o] + D[o + 1] + D[o + 2]) / 3 >= thr) continue;
        }
        keep.push(a, b, c);
      }
      if (keep.length !== idx.count) g.setIndex(keep);
    });
  }
  /* the royal garden outside the King's Hall windows (both sides): a sky, lawns, a broderie parterre with box hedges,
     topiary and a fountain, a canal between avenues of trees, bosquets, a rotunda at the end, woods on the horizon */
  function royalGarden(holder) {
    var root = new THREE.Group(), side = new THREE.Group(), G = -4.5, mats = [];   // the hall is on the upper floor: the garden is seen from above
    function L(h) { return new THREE.Color(h).convertSRGBToLinear(); }
    function lam(h, o) { var m = new THREE.MeshLambertMaterial(Object.assign({ color: L(h) }, o || {})); m.userData.base = m.color.clone(); mats.push(m); return m; }
    function cvs(w, h, f) { var c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
    var skyT = cvs(8, 512, function (x, w, h) { var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3f78c0'); g.addColorStop(0.38, '#86b4e0'); g.addColorStop(0.5, '#e4edf2'); g.addColorStop(1, '#cfd8c8'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    var skyM = new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, depthWrite: false, fog: false }); skyM.userData.base = new THREE.Color(1, 1, 1); mats.push(skyM);
    var sky = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 16), skyM); sky.renderOrder = -10; root.add(sky);
    var cl = cvs(1024, 256, function (x, w, h) { for (var i = 0; i < 70; i++) { var px = Math.random() * w, py = 40 + Math.random() * 150, r = 20 + Math.random() * 50, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r * 1.8, r * 0.6, 0, 0, 6.3); x.fill(); } });
    cl.wrapS = THREE.RepeatWrapping; var clM = new THREE.MeshBasicMaterial({ map: cl, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }); clM.userData.base = new THREE.Color(1, 1, 1); mats.push(clM);
    var clouds = new THREE.Mesh(new THREE.CylinderGeometry(300, 300, 90, 32, 1, true), clM); clouds.position.y = 70; clouds.renderOrder = -9; root.add(clouds);
    var grassT = cvs(128, 128, function (x, w, h) { x.fillStyle = '#6b9a44'; x.fillRect(0, 0, w, h); for (var i = 0; i < 1600; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(40,80,30,.25)' : 'rgba(150,190,90,.25)'; x.fillRect(Math.random() * w, Math.random() * h, 1, 2); } });
    grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(160, 160);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(640, 640), lam(0xffffff, { map: grassT })); ground.rotation.x = -Math.PI / 2; ground.position.y = G; root.add(ground);
    /* one side's garden, built toward −z, then mirrored to the south windows */
    var parT = cvs(1024, 1024, function (x, w, h) {
      x.fillStyle = '#d6cbb0'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) { x.fillStyle = 'rgba(120,105,80,' + Math.random() * 0.2 + ')'; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      function quad() {
        x.fillStyle = '#4c7a34'; x.fillRect(60, 60, 380, 380); x.fillStyle = '#d6cbb0'; x.fillRect(80, 80, 340, 340);
        x.strokeStyle = '#2f5a24'; x.lineWidth = 16; x.lineCap = 'round';
        for (var k = 0; k < 2; k++) { x.save(); if (k) { x.translate(500, 0); x.scale(-1, 1); }
          x.beginPath(); x.moveTo(250, 120); x.bezierCurveTo(140, 120, 120, 220, 190, 250); x.bezierCurveTo(250, 280, 230, 340, 160, 360); x.stroke();
          x.beginPath(); x.arc(150, 170, 34, 0.4, 5.6); x.stroke(); x.beginPath(); x.arc(170, 330, 26, 3.6, 2.6 + 6.28); x.stroke(); x.restore(); }
        x.fillStyle = '#b0303a'; for (var j = 0; j < 40; j++) { x.beginPath(); x.arc(92 + j * 8.2, 92, 4, 0, 6.3); x.arc(92 + j * 8.2, 408, 4, 0, 6.3); x.fill(); }
        x.fillStyle = '#4c7a34'; x.beginPath(); x.arc(250, 250, 40, 0, 6.3); x.fill(); x.fillStyle = '#d9a0b0'; x.beginPath(); x.arc(250, 250, 26, 0, 6.3); x.fill();
      }
      [[0, 0], [512, 0], [0, 512], [512, 512]].forEach(function (q) { x.save(); x.translate(q[0], q[1]); quad(); x.restore(); });
      x.fillStyle = '#d6cbb0'; x.beginPath(); x.arc(512, 512, 110, 0, 6.3); x.fill();
    });
    parT.anisotropy = 8;
    var parterre = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), lam(0xffffff, { map: parT })); parterre.rotation.x = -Math.PI / 2; parterre.position.set(0, G + 0.02, -34); side.add(parterre);
    var gravel = lam(0xd6cbb0), stone = lam(0xe8e2d4), water = new THREE.MeshLambertMaterial({ color: L(0x7aa8c8), transparent: true, opacity: 0.92 }); water.userData.base = water.color.clone(); mats.push(water);
    var walk = new THREE.Mesh(new THREE.PlaneGeometry(44, 3), gravel); walk.rotation.x = -Math.PI / 2; walk.position.set(0, G + 0.015, -11); side.add(walk);   // the walk along the façade
    var axis = new THREE.Mesh(new THREE.PlaneGeometry(8, 30), gravel); axis.rotation.x = -Math.PI / 2; axis.position.set(0, G + 0.015, -68); side.add(axis);
    var canal = new THREE.Mesh(new THREE.PlaneGeometry(14, 110), water); canal.rotation.x = -Math.PI / 2; canal.position.set(0, G + 0.03, -138); side.add(canal);
    var rim = lam(0xe8e2d4); [[-7.3, 0], [7.3, 0]].forEach(function (q) { var r = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 110), rim); r.position.set(q[0], G + 0.17, -138); side.add(r); });
    /* the fountain in the parterre's heart */
    var f = new THREE.Group(); f.position.set(0, G, -34); side.add(f);
    var basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.6, 40, 1, true), stone); basin.position.y = 0.3; f.add(basin);
    var wd = new THREE.Mesh(new THREE.CircleGeometry(4.15, 40), water); wd.rotation.x = -Math.PI / 2; wd.position.y = 0.45; f.add(wd);
    var tier = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.5, 0], [0.35, 0.6], [0.3, 1.2], [1.4, 1.5], [1.5, 1.65], [0.3, 1.7], [0.2, 2.4], [0.7, 2.6], [0.75, 2.7], [0.15, 2.75], [0.1, 3.3], [0, 3.4]].map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 24), stone); f.add(tier);
    var jetM = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55, depthWrite: false }); jetM.userData.base = jetM.color.clone(); mats.push(jetM);
    var jet = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.4, 12, 1, true), jetM); jet.position.y = 4.4; jet.rotation.x = Math.PI; f.add(jet);
    /* box hedges round the parterre, cone topiary on its corners and edges */
    var hedgeM = lam(0x2f5a28), hb = [];
    [[0, -14, 40.6, 0.7], [0, -54, 40.6, 0.7], [-20, -34, 0.7, 40.6], [20, -34, 0.7, 40.6]].forEach(function (q) { hb.push(q); });
    hb.forEach(function (q) { var m = new THREE.Mesh(new THREE.BoxGeometry(q[2], 0.8, q[3]), hedgeM); m.position.set(q[0], G + 0.4, q[1]); side.add(m); });
    var topi = [], tr = [];
    for (var i = 0; i <= 8; i++) { var t = -20 + i * 5; topi.push([t, -14], [t, -54], [-20, -14 - i * 5], [20, -14 - i * 5]); }
    var coneG = new THREE.ConeGeometry(0.75, 2.6, 10), cones = new THREE.InstancedMesh(coneG, lam(0x2a5224), topi.length), M4 = new THREE.Matrix4();
    topi.forEach(function (q, k) { M4.makeTranslation(q[0], G + 1.3 + 0.4, q[1]); cones.setMatrixAt(k, M4); }); side.add(cones);
    /* avenues of clipped limes along the canal, bosquets behind them */
    for (var z = -16; z > -196; z -= 7) { tr.push([-26, z, 1], [26, z, 1], [-33, z - 3.5, 1], [33, z - 3.5, 1]); }
    for (var b = 0; b < 240; b++) { var bx = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60), bz = -12 - Math.random() * 180; tr.push([bx, bz, 0.8 + Math.random() * 0.6]); }
    var crownG = new THREE.SphereGeometry(3.2, 12, 8), trunkG = new THREE.CylinderGeometry(0.35, 0.45, 4, 6);
    var crowns = new THREE.InstancedMesh(crownG, lam(0xffffff), tr.length), trunks = new THREE.InstancedMesh(trunkG, lam(0x4a3626), tr.length), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), col = new THREE.Color();
    tr.forEach(function (q, k) { var sc = q[2]; P3.set(q[0], G + 4 * sc + 2.4 * sc, q[1]); S3.set(sc, sc * 1.1, sc); M4.compose(P3, Q, S3); crowns.setMatrixAt(k, M4); col.setHSL(0.27 + Math.random() * 0.06, 0.45, 0.22 + Math.random() * 0.1).convertSRGBToLinear(); crowns.setColorAt(k, col);
      P3.set(q[0], G + 2 * sc, q[1]); S3.set(sc, sc, sc); M4.compose(P3, Q, S3); trunks.setMatrixAt(k, M4); });
    side.add(crowns); side.add(trunks);
    /* the rotunda at the canal's end */
    var rot = new THREE.Group(); rot.position.set(0, G, -200); side.add(rot);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.4, 1, 32), stone); base.position.y = 0.5; rot.add(base);
    for (var c = 0; c < 12; c++) { var a = c / 12 * Math.PI * 2, colm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 7, 12), stone); colm.position.set(Math.cos(a) * 6, 4.5, Math.sin(a) * 6); rot.add(colm); }
    var ent = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 1.2, 32), stone); ent.position.y = 8.6; rot.add(ent);
    var dome = new THREE.Mesh(new THREE.SphereGeometry(6.6, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x6f8f88)); dome.position.y = 9.2; rot.add(dome);
    var lan = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 2, 12), stone); lan.position.y = 16.4; rot.add(lan);
    /* woods all round the horizon */
    var ring = []; for (var r = 0; r < 420; r++) { var ra = Math.random() * Math.PI * 2, rr = 215 + Math.random() * 60; ring.push([Math.cos(ra) * rr, Math.sin(ra) * rr, 2 + Math.random() * 2]); }
    var woods = new THREE.InstancedMesh(crownG, lam(0xffffff), ring.length);
    ring.forEach(function (q, k) { P3.set(q[0], G + 4 * q[2], q[1]); S3.set(q[2], q[2] * 1.2, q[2]); M4.compose(P3, Q, S3); woods.setMatrixAt(k, M4); col.setHSL(0.28 + Math.random() * 0.05, 0.35, 0.2 + Math.random() * 0.08).convertSRGBToLinear(); woods.setColorAt(k, col); });
    root.add(woods);
    root.add(side); var south = side.clone(); south.rotation.y = Math.PI; south.position.z = -3.9; root.add(south);   // the south windows look on a mirror garden (walls at −8.7 and +4.8)
    root.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
    holder.add(root);
    return { jet: jet, set: function (light, dusk) { var k = 0.12 + 0.88 * light; mats.forEach(function (m) { m.color.copy(m.userData.base).multiplyScalar(k); if (dusk > 0.05) m.color.lerp(new THREE.Color(1, 0.62, 0.42).multiply(m.userData.base), dusk * 0.35); }); } };
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
  /* ───────── the study's own versions of Spatial Home's things: they stay the same things (same apps, same animation),
     the room dresses them — the EC–6 board stands in a carved three-leaf screen (no easel), Octo's tank sits in a mahogany
     cabinet under a Wardian glass roof */
  function damask(S) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
    x.fillStyle = S.silk; x.fillRect(0, 0, 256, 256);
    function motif(cx, cy, s) { x.save(); x.translate(cx, cy); x.scale(s, s); x.fillStyle = S.motif;
      x.beginPath(); x.moveTo(0, -46); x.bezierCurveTo(26, -30, 30, 0, 0, 46); x.bezierCurveTo(-30, 0, -26, -30, 0, -46); x.fill();
      x.fillStyle = S.silk; x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(12, -14, 14, 4, 0, 24); x.bezierCurveTo(-14, 4, -12, -14, 0, -26); x.fill();
      x.fillStyle = S.motif; x.beginPath(); x.arc(0, 0, 6, 0, 6.3); x.fill();
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { x.beginPath(); x.ellipse(q[0] * 22, q[1] * 30, 5, 11, q[0] * q[1] * 0.6, 0, 6.3); x.fill(); }); x.restore(); }
    motif(64, 64, 1); motif(192, 192, 1); motif(192, 64, 0.5); motif(64, 192, 0.5); motif(0, 128, 0.5); motif(256, 128, 0.5); motif(128, 0, 0.5); motif(128, 256, 0.5);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function vicMats(S) {
    return { wood: new THREE.MeshStandardMaterial({ color: lin(S.wood), roughness: 0.38 }), woodL: new THREE.MeshStandardMaterial({ color: lin(S.woodL), roughness: 0.34 }),
      gilt: new THREE.MeshStandardMaterial({ color: lin(0xc9a24a), roughness: 0.28, metalness: 0.88 }), brass: new THREE.MeshStandardMaterial({ color: lin(0xb8903a), roughness: 0.22, metalness: 0.92 }) };
  }
  function bx(g, m, x, y, z, w, h, d) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; }
  function finial(g, m, x, y, z) { var f = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.035, 0.02], [0.02, 0.04], [0.032, 0.07], [0.012, 0.1], [0.018, 0.12], [0, 0.14]].map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 12), m); f.position.set(x, y, z); g.add(f); }
  function dressBoardOf(S) { return function (o) {
    var g = new THREE.Group(), M = vicMats(S), dm = damask(S), silk = new THREE.MeshStandardMaterial({ map: dm, roughness: 0.7 }), F = -o.group.position.y, TOP = 0.74;   // the board's centre is the origin; F is the floor
    function leaf(par, x0, x1, withBoard) {                 // one leaf of the screen: posts, rails, silk, gilt fillets
      var w = x1 - x0, cx = (x0 + x1) / 2;
      [x0, x1].forEach(function (px) { bx(par, M.wood, px, (F + TOP) / 2, 0, 0.07, TOP - F, 0.07); finial(par, M.gilt, px, TOP, 0); var ft = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.wood); ft.scale.y = 0.6; ft.position.set(px, F + 0.03, 0); par.add(ft); });
      bx(par, M.wood, cx, TOP - 0.03, 0, w, 0.06, 0.06); bx(par, M.wood, cx, F + 0.16, 0, w, 0.06, 0.06);
      var lowT = withBoard ? -0.68 : TOP - 0.1, lowB = F + 0.2;
      var pl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.07, lowT - lowB), silk.clone()); pl.material.map = dm.clone(); pl.material.map.needsUpdate = true; pl.material.map.repeat.set((w - 0.07) / 0.22, (lowT - lowB) / 0.22); pl.position.set(cx, (lowT + lowB) / 2, -0.005); par.add(pl);
      var back = pl.clone(); back.rotation.y = Math.PI; back.position.z = -0.012; par.add(back);
      [[cx, lowT - 0.03, w - 0.16, 0.012], [cx, lowB + 0.03, w - 0.16, 0.012]].forEach(function (q) { bx(par, M.gilt, q[0], q[1], 0.004, q[2], q[3], 0.006); });
      [x0 + 0.08, x1 - 0.08].forEach(function (px) { bx(par, M.gilt, px, (lowT + lowB) / 2, 0.004, 0.012, lowT - lowB - 0.06, 0.006); });
      if (withBoard) bx(par, M.wood, cx, -0.66, 0, w, 0.06, 0.06);
    }
    leaf(g, -0.95, 0.95, true);
    [[-0.84, 0, 0.05, 1.22], [0.84, 0, 0.05, 1.22], [0, 0.59, 1.73, 0.05], [0, -0.59, 1.73, 0.05]].forEach(function (q) { bx(g, M.gilt, q[0], q[1], 0.03, q[2], q[3], 0.035); });   // a gilt frame round the board
    var crest = new THREE.Group(); crest.position.set(0, TOP, 0); g.add(crest);       // the crest: a scrolled pediment and a brass plaque
    var arch = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 28, Math.PI), M.wood); arch.scale.y = 0.45; crest.add(arch);
    bx(crest, M.wood, 0, 0.06, 0, 0.6, 0.12, 0.05);
    var pc = document.createElement('canvas'); pc.width = 512; pc.height = 96; var px = pc.getContext('2d'); px.fillStyle = '#c9a24a'; px.fillRect(0, 0, 512, 96); px.strokeStyle = '#7a5a24'; px.lineWidth = 6; px.strokeRect(6, 6, 500, 84);
    px.fillStyle = '#3a2410'; px.font = 'bold 44px Georgia, "Times New Roman", serif'; var fs = Math.min(44, 44 * 452 / px.measureText(S.plaque).width); px.font = 'bold ' + fs.toFixed(1) + 'px Georgia, "Times New Roman", serif'; px.textAlign = 'center'; px.textBaseline = 'middle'; px.fillText(S.plaque, 256, 50);
    var pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding; var plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.094), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.3, metalness: 0.6 })); plaque.position.set(0, 0.06, 0.027); crest.add(plaque);
    if (S.crown) crown(crest, M, 0, 0.13, 0); else finial(crest, M.gilt, 0, 0.17, 0);
    [-1, 1].forEach(function (sd) { var h = new THREE.Group(); h.position.set(sd * 0.985, 0, 0); h.rotation.y = sd * -(S.fold || 0.55); g.add(h); leaf(h, sd > 0 ? 0 : -(S.leaf || 0.78), sd > 0 ? (S.leaf || 0.78) : 0, false);
      var bv = new THREE.Group(); bv.position.set(sd * 0.39, 0, 0); h.add(bv); });
    return { group: g };
  }; }
  function dressAquariumOf(S) { return function (o) {
    var g = new THREE.Group(), M = vicMats(S), X = 0.42, Z = 0.21, Y0 = 0.62, Y1 = 1.14, CX = X + 0.05, CZ = Z + 0.05;
    bx(g, M.wood, 0, 0.05, 0, 2 * CX + 0.06, 0.1, 2 * CZ + 0.06);                       // plinth
    bx(g, M.wood, 0, (0.1 + Y0 - 0.05) / 2, 0, 2 * CX, Y0 - 0.15, 2 * CZ);                // the cabinet round the old stand
    bx(g, M.woodL, 0, Y0 - 0.025, 0, 2 * CX + 0.06, 0.05, 2 * CZ + 0.06);                 // its top, moulded
    bx(g, M.gilt, 0, Y0 - 0.052, CZ + 0.031, 2 * CX + 0.06, 0.006, 0.004);
    [-1, 1].forEach(function (sd) { var cx = sd * CX / 2;                                // two panelled doors, brass knobs
      bx(g, M.woodL, cx, 0.34, CZ + 0.006, CX - 0.06, 0.38, 0.012); bx(g, M.wood, cx, 0.34, CZ + 0.014, CX - 0.14, 0.28, 0.008);
      [[0, 0.14], [0, -0.14]].forEach(function (q) { bx(g, M.gilt, cx, 0.34 + q[1], CZ + 0.019, CX - 0.14, 0.008, 0.004); });
      [-1, 1].forEach(function (k) { bx(g, M.gilt, cx + k * (CX - 0.14) / 2, 0.34, CZ + 0.019, 0.008, 0.28, 0.004); });
      var kb = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M.brass); kb.position.set(sd * 0.04, 0.36, CZ + 0.025); g.add(kb); });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var ft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.wood); ft.scale.y = 0.55; ft.position.set(q[0] * (CX - 0.03), 0.0, q[1] * (CZ - 0.03)); g.add(ft);
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, Y1 - Y0 + 0.02, 10), M.brass); col.position.set(q[0] * (X + 0.006), (Y0 + Y1) / 2, q[1] * (Z + 0.006)); g.add(col); });
    [[0, -Z - 0.006, 2 * X + 0.03, 0.02], [0, Z + 0.006, 2 * X + 0.03, 0.02]].forEach(function (q) { bx(g, M.brass, 0, Y1 + 0.02, q[1], q[2], 0.03, q[3]); bx(g, M.brass, 0, Y0 + 0.01, q[1], q[2], 0.02, q[3]); });
    [-1, 1].forEach(function (sd) { bx(g, M.brass, sd * (X + 0.006), Y1 + 0.02, 0, 0.02, 0.03, 2 * Z + 0.03); });
    /* the Wardian roof: two glass slopes on brass ribs, gable ends, a ridge with cresting and finials */
    var RH = 0.2, glassM = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    var slope = Math.hypot(Z + 0.01, RH), ang = Math.atan2(RH, Z + 0.01);
    [-1, 1].forEach(function (sd) { var pl = new THREE.Mesh(new THREE.PlaneGeometry(2 * X + 0.02, slope), glassM); pl.position.set(0, Y1 + 0.035 + RH / 2, sd * (Z + 0.01) / 2); pl.rotation.x = -Math.PI / 2 + sd * (Math.PI / 2 - ang); g.add(pl);
      for (var r = -X; r <= X + 0.001; r += X / 3) { var rib = bx(g, M.brass, r, Y1 + 0.035 + RH / 2, sd * (Z + 0.01) / 2, 0.008, slope, 0.008); rib.rotation.x = sd * -(Math.PI / 2 - ang); } });
    [-1, 1].forEach(function (sd) { var sh = new THREE.Shape(); sh.moveTo(-Z - 0.01, 0); sh.lineTo(Z + 0.01, 0); sh.lineTo(0, RH); sh.closePath();
      var gb = new THREE.Mesh(new THREE.ShapeGeometry(sh), glassM); gb.rotation.y = Math.PI / 2; gb.position.set(sd * (X + 0.01), Y1 + 0.035, 0); g.add(gb); });
    bx(g, M.brass, 0, Y1 + 0.04 + RH, 0, 2 * X + 0.04, 0.016, 0.016);
    for (var c = -X + 0.06; c < X; c += 0.08) { var fl = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 6), M.gilt); fl.position.set(c, Y1 + 0.07 + RH, 0); g.add(fl); }
    finial(g, M.gilt, -X - 0.01, Y1 + 0.04 + RH, 0); finial(g, M.gilt, X + 0.01, Y1 + 0.04 + RH, 0);
    if (S.crown) crown(g, M, 0, Y1 + 0.06 + RH, 0, 0.6);
    return { group: g };
  }; }
  /* a small royal crown: a gilt band, five points with pearls, a crimson cap, an orb and cross */
  function crown(par, M, x, y, z, sc) {
    var c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(sc || 1); par.add(c);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.05, 24, 1, true), M.gilt); band.position.y = 0.025; c.add(band);
    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: lin(0x8a1f2c), roughness: 0.8 })); cap.position.y = 0.04; c.add(cap);
    var pearl = new THREE.MeshStandardMaterial({ color: 0xf6f0e4, roughness: 0.25 });
    for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2, pnt = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 6), M.gilt); pnt.position.set(Math.cos(a) * 0.105, 0.085, Math.sin(a) * 0.105); c.add(pnt);
      var pr = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), pearl); pr.position.set(Math.cos(a) * 0.105, 0.125, Math.sin(a) * 0.105); c.add(pr);
      var gem = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x1f5ad0 : 0xb0182a, roughness: 0.1, metalness: 0.3 })); gem.position.set(Math.cos(a + 0.63) * 0.108, 0.025, Math.sin(a + 0.63) * 0.108); c.add(gem); }
    var orb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), M.gilt); orb.position.y = 0.15; c.add(orb);
    bx(c, M.gilt, 0, 0.19, 0, 0.01, 0.05, 0.01); bx(c, M.gilt, 0, 0.195, 0, 0.035, 0.01, 0.01);
  }
  var VIC_STYLE = { wood: 0x4a1f12, woodL: 0x6e3220, silk: '#1f4a34', motif: 'rgba(217,180,106,.38)', plaque: 'EC–6  STUDY BOARD' };
  var KH_STYLE = { wood: 0x2e1a10, woodL: 0x4a2a18, silk: '#6e1520', motif: 'rgba(222,184,96,.42)', plaque: 'EC–6 · THE KING’S BOARD', crown: true, leaf: 0.55, fold: 1.0 };
  /* the King's Hall, finished the same way: warm reflections, the crystal chandelier lit with candles */
  function kingsFinish(ctx) {
    var R = SR.renderer, scene = ctx.scene, envTex = null;
    if (R && THREE.PMREMGenerator) {
      var es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12), new THREE.MeshBasicMaterial({ color: lin(0x6a5a4a), side: THREE.BackSide })));
      [[0, 2.4, -6, 0xfff4e0, 4], [-6, 2, -2, 0xe8e4ff, 3], [6, 2, -2, 0xe8e4ff, 3], [0, 3.4, 0, 0xffe0b0, 2]].forEach(function (q) { var p = new THREE.Mesh(new THREE.PlaneGeometry(q[4], q[4] * 0.6), new THREE.MeshBasicMaterial({ color: lin(q[3]), side: THREE.DoubleSide })); p.position.set(q[0], q[1], q[2]); p.lookAt(0, 1.5, 0); es.add(p); });
      var pm = new THREE.PMREMGenerator(R); envTex = pm.fromScene(es, 0.04).texture; pm.dispose(); scene.environment = envTex;
    }
    var cl = new THREE.PointLight(0xffd29a, 0.9, 9, 2); cl.position.set(0.01, 2.55, -1.765); ctx.holder.add(cl);
    /* a clean painted sash in each opening: it hides the scan's ragged edge and gives the glass its glazing bars */
    var paint = new THREE.MeshStandardMaterial({ color: lin(0xf1ece2), roughness: 0.5 }), pane = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.05, metalness: 0.2, depthWrite: false });
    (KINGS.panes || []).forEach(function (q) { var x0 = q[0], x1 = q[1], z = q[2], y0 = 1.0, y1 = 3.38, cx = (x0 + x1) / 2, w = x1 - x0, h = y1 - y0, fw = 0.13, d = 0.12, n = z < 0 ? 1 : -1;
      var fg = new THREE.Group(); ctx.holder.add(fg);
      function b(x, y, bw, bh) { var m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), paint); m.position.set(x, y, z); fg.add(m); }
      b(cx, y1 - fw / 2, w + 0.04, fw); b(cx, y0 + fw / 2, w + 0.04, fw); b(x0 + fw / 2, (y0 + y1) / 2, fw, h); b(x1 - fw / 2, (y0 + y1) / 2, fw, h);
      b(cx, (y0 + y1) / 2, 0.05, h - fw); for (var k = 1; k < 4; k++) b(cx, y0 + h * k / 4, w - fw, 0.04);
      var gl = new THREE.Mesh(new THREE.PlaneGeometry(w - fw, h - fw), pane); gl.position.set(cx, (y0 + y1) / 2, z - n * 0.01); fg.add(gl); });
    var garden = royalGarden(ctx.holder), mode = 'auto';
    function apply() { var T = SR.timeOfDay(mode), N = T.night; cl.intensity = 0.6 + 0.7 * N; garden.set(T.light, T.dusk); }
    apply();
    return { tick: function (t) { cl.intensity = (0.6 + 0.7 * SR.timeOfDay(mode).night) * (0.95 + 0.05 * Math.sin(t * 6.3) * Math.sin(t * 2.9)); garden.jet.scale.set(1 + 0.06 * Math.sin(t * 7), 1 + 0.08 * Math.sin(t * 5.3), 1 + 0.06 * Math.sin(t * 7)); },
      setTime: function (m) { mode = m || 'auto'; apply(); },
      dispose: function () { if (scene.environment === envTex) scene.environment = null; if (envTex) envTex.dispose(); } };
  }
  /* the study's new French window (east wall, beside the desk, after the user's reference): the bookcase there is cut
     away, a walnut casement with glazing bars, reveals, a sill, green velvet drapes under a pelmet; outside, an English
     garden — lawn, a gravel walk, borders of roses, a yew hedge, a sundial, trees and soft hills under the sky */
  function studyWindow(holder) {
    var X = 8.38, Z0 = -4.6, Z1 = -2.6, Y0 = 0.25, Y1 = 3.3, ZC = (Z0 + Z1) / 2, g = new THREE.Group(), mats = []; holder.add(g);
    var wal = new THREE.MeshStandardMaterial({ color: lin(0x3a2214), roughness: 0.4 }), brass = new THREE.MeshStandardMaterial({ color: lin(0xb8903a), roughness: 0.25, metalness: 0.9 });
    function b(m, x, y, z, w, h, d) { var k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); g.add(k); return k; }
    b(wal, 7.95, (Y0 + Y1) / 2, Z0 - 0.06, 1.0, Y1 - Y0 + 0.12, 0.14); b(wal, 7.95, (Y0 + Y1) / 2, Z1 + 0.06, 1.0, Y1 - Y0 + 0.12, 0.14);   // reveals over the cut bookcase
    b(wal, 7.95, Y1 + 0.08, ZC, 1.0, 0.18, Z1 - Z0 + 0.26); b(wal, 7.95, Y0 - 0.05, ZC, 1.06, 0.1, Z1 - Z0 + 0.26);                        // head, sill
    var fw = 0.09, W = Z1 - Z0, H = Y1 - Y0;
    b(wal, X, Y1 - fw / 2, ZC, 0.08, fw, W); b(wal, X, Y0 + fw / 2, ZC, 0.08, fw, W); b(wal, X, (Y0 + Y1) / 2, Z0 + fw / 2, 0.08, H, fw); b(wal, X, (Y0 + Y1) / 2, Z1 - fw / 2, 0.08, H, fw);
    b(wal, X, (Y0 + Y1) / 2, ZC, 0.08, H, 0.07); var TR = Y1 - 0.75; b(wal, X, TR, ZC, 0.08, 0.07, W);                                    // the meeting stiles, the transom
    for (var r = 1; r < 4; r++) b(wal, X, Y0 + (TR - Y0) * r / 4, ZC, 0.05, 0.03, W - 0.1);
    [Z0 + W / 6, Z0 + W / 3 + 0.02, ZC + W / 6 - 0.02, Z1 - W / 6].forEach(function (z) { b(wal, X, (Y0 + TR) / 2, z, 0.05, TR - Y0, 0.03); });
    for (var t = 1; t < 4; t++) b(wal, X, (TR + Y1) / 2, Z0 + W * t / 4, 0.05, Y1 - TR, 0.03);
    [ZC - 0.07, ZC + 0.07].forEach(function (z) { b(brass, X - 0.06, (Y0 + TR) / 2, z, 0.03, 0.18, 0.02); });
    var glassM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0.2, depthWrite: false });
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), glassM); pane.rotation.y = -Math.PI / 2; pane.position.set(X + 0.01, (Y0 + Y1) / 2, ZC); g.add(pane);
    /* drapes and a pelmet */
    var velC = document.createElement('canvas'); velC.width = 64; velC.height = 256; var vx = velC.getContext('2d'), vg = vx.createLinearGradient(0, 0, 64, 0);
    vg.addColorStop(0, '#173a26'); vg.addColorStop(0.5, '#2a5a3c'); vg.addColorStop(1, '#173a26'); vx.fillStyle = vg; vx.fillRect(0, 0, 64, 256);
    var velT = new THREE.CanvasTexture(velC); velT.encoding = THREE.sRGBEncoding; velT.wrapS = THREE.RepeatWrapping; velT.repeat.x = 6;
    var vel = new THREE.MeshStandardMaterial({ map: velT, roughness: 0.85, side: THREE.DoubleSide });
    [[Z0 - 0.45, 1], [Z1 + 0.45, -1]].forEach(function (q) { var geo = new THREE.PlaneGeometry(0.75, Y1 - 0.05 + 0.4, 18, 1), pp = geo.attributes.position;
      for (var i = 0; i < pp.count; i++) pp.setZ(i, Math.sin((pp.getX(i) + 0.375) * 26) * 0.05); geo.computeVertexNormals();
      var d = new THREE.Mesh(geo, vel); d.rotation.y = -Math.PI / 2; d.position.set(7.72, (Y1 + 0.4) / 2, q[0]); g.add(d);
      var tie = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 16), brass); tie.rotation.y = Math.PI / 2; tie.scale.set(1, 0.4, 1); tie.position.set(7.66, 1.05, q[0]); g.add(tie); });
    b(wal, 7.68, Y1 + 0.35, ZC, 0.2, 0.32, W + 1.8); b(brass, 7.57, Y1 + 0.22, ZC, 0.01, 0.02, W + 1.8);
    var day = new THREE.PointLight(0xfff2dc, 0.7, 9, 2); day.position.set(7.0, 2.4, ZC); g.add(day);
    /* the garden */
    var out = new THREE.Group(), GY = -0.25; g.add(out);
    function L2(h) { return new THREE.Color(h).convertSRGBToLinear(); }
    function lam(h, o) { var m = new THREE.MeshLambertMaterial(Object.assign({ color: L2(h) }, o || {})); m.userData.base = m.color.clone(); mats.push(m); return m; }
    var skyC = document.createElement('canvas'); skyC.width = 8; skyC.height = 512; var sx = skyC.getContext('2d'), sg = sx.createLinearGradient(0, 0, 0, 512);
    sg.addColorStop(0, '#4a82c4'); sg.addColorStop(0.42, '#9cc2e2'); sg.addColorStop(0.5, '#e8eef0'); sg.addColorStop(1, '#c8d4c0'); sx.fillStyle = sg; sx.fillRect(0, 0, 8, 512);
    var skyT = new THREE.CanvasTexture(skyC); skyT.encoding = THREE.sRGBEncoding; var skyM = new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, depthWrite: false }); skyM.userData.base = new THREE.Color(1, 1, 1); mats.push(skyM);
    var sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16, Math.PI * 0.6, Math.PI * 0.8, 0, Math.PI * 0.5), skyM); sky.renderOrder = -10; sky.position.set(8.4, 0, ZC); out.add(sky);   // only the window's side: the room's own seams stay dark
    var lawn = new THREE.Mesh(new THREE.PlaneGeometry(300, 600), lam(0x6c9a46)); lawn.rotation.x = -Math.PI / 2; lawn.position.set(8.6 + 150, GY, ZC); out.add(lawn);
    var path = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.2), lam(0xd2c6a8)); path.rotation.x = -Math.PI / 2; path.position.set(30, GY + 0.01, ZC); out.add(path);
    var hedge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 60), lam(0x2c5426)); hedge.position.set(34, GY + 0.9, ZC); out.add(hedge);
    var sd = new THREE.Group(); sd.position.set(16, GY, ZC); out.add(sd);
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.0, 12), lam(0xd8d0bf)); col.position.y = 0.5; sd.add(col);
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), lam(0x9a7a3a)); dial.position.y = 1.03; sd.add(dial);
    var rose = [], M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), C = new THREE.Color();
    for (var i = 0; i < 70; i++) { var side = i % 2 ? 1 : -1; rose.push([12 + (i >> 1) * 0.75, ZC + side * (1.6 + Math.random() * 0.4)]); }
    var bush = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), lam(0xffffff), rose.length);
    rose.forEach(function (q, k) { P3.set(q[0], GY + 0.35, q[1]); S3.set(1, 0.8, 1); M4.compose(P3, Q, S3); bush.setMatrixAt(k, M4); C.set(k % 3 ? 0x3a6a2e : (k % 2 ? 0xc0304a : 0xe890a8)).convertSRGBToLinear(); bush.setColorAt(k, C); }); out.add(bush);
    var trees = []; for (var j = 0; j < 160; j++) { var tx = 14 + Math.random() * 150, tz = ZC + (Math.random() * 2 - 1) * (20 + tx * 0.9); if (Math.abs(tz - ZC) < 4 && tx < 40) continue; trees.push([tx, tz, 0.7 + Math.random() * 0.9]); }
    var crowns = new THREE.InstancedMesh(new THREE.SphereGeometry(3, 12, 8), lam(0xffffff), trees.length), trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 6), lam(0x4a3626), trees.length);
    trees.forEach(function (q, k) { var sc = q[2]; P3.set(q[0], GY + 6 * sc, q[1]); S3.set(sc, sc * 1.15, sc); M4.compose(P3, Q, S3); crowns.setMatrixAt(k, M4); C.setHSL(0.26 + Math.random() * 0.07, 0.42, 0.2 + Math.random() * 0.12).convertSRGBToLinear(); crowns.setColorAt(k, C);
      P3.set(q[0], GY + 2 * sc, q[1]); S3.set(sc, sc, sc); M4.compose(P3, Q, S3); trunks.setMatrixAt(k, M4); }); out.add(crowns); out.add(trunks);
    var hills = new THREE.Mesh(new THREE.CylinderGeometry(240, 240, 30, 48, 1, true, 0, Math.PI), lam(0x7a9a6a, { side: THREE.BackSide })); hills.position.set(8.4, GY + 5, ZC); hills.scale.y = 0.4; out.add(hills);
    out.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
    return { set: function (light, dusk) { var k = 0.12 + 0.88 * light; mats.forEach(function (m) { m.color.copy(m.userData.base).multiplyScalar(k); if (dusk > 0.05) m.color.lerp(new THREE.Color(1, 0.62, 0.42).multiply(m.userData.base), dusk * 0.35); }); day.intensity = 0.15 + 0.6 * light; } };
  }
  /* an antique globe for the desk: a brass meridian on a turned stand, a sepia map of blobs for land */
  function globe() {
    var g = new THREE.Group(), brass = new THREE.MeshStandardMaterial({ color: lin(0xb8903a), roughness: 0.25, metalness: 0.9 }), wood = new THREE.MeshStandardMaterial({ color: lin(0x3a2214), roughness: 0.4 });
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.03, 20), wood); base.position.y = 0.015; g.add(base);
    var st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.12, 10), brass); st.position.y = 0.09; g.add(st);
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var x = c.getContext('2d'); x.fillStyle = '#c9b48a'; x.fillRect(0, 0, 512, 256);
    x.fillStyle = '#7a5a34'; [[90, 80, 50, 40], [120, 170, 30, 50], [250, 90, 60, 45], [270, 170, 35, 45], [380, 90, 80, 45], [420, 180, 30, 20]].forEach(function (q) { x.beginPath(); x.ellipse(q[0], q[1], q[2], q[3], 0.3, 0, 6.3); x.fill(); });
    x.strokeStyle = 'rgba(80,50,20,.35)'; x.lineWidth = 1; for (var i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke(); } for (var j = 1; j < 4; j++) { x.beginPath(); x.moveTo(0, j * 64); x.lineTo(512, j * 64); x.stroke(); }
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 28, 18), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 })); ball.position.y = 0.27; ball.rotation.z = 0.41; g.add(ball);
    var mer = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.006, 6, 40), brass); mer.position.y = 0.27; mer.rotation.y = Math.PI / 2; mer.rotation.x = 0.41; g.add(mer);
    return { group: g, ball: ball };
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
    var lamp = new THREE.Group(); lamp.position.set(-0.7, 0.78, -2.2); lamp.rotation.y = Math.PI; desk.add(lamp);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 20), brass); base.position.y = 0.015; lamp.add(base);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10), brass); stem.position.y = 0.19; lamp.add(stem);
    var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.09, 24, 1, true, 0, Math.PI), shadeM); shade.rotation.z = Math.PI / 2; shade.rotation.y = Math.PI / 2; shade.position.set(0, 0.36, 0.04); shade.scale.set(1, 1.6, 1); lamp.add(shade);
    var lampL = new THREE.PointLight(0xfff0c8, 0.55, 2.4, 2); lampL.position.set(0.05, 0.3, 0.05); lamp.add(lampL);
    var bookCols = [0x7a1c22, 0x1c2340, 0x2f5a3a, 0x8a6a2a], bk = new THREE.Group(); bk.position.set(0.68, 0.78, -2.2); bk.rotation.y = 0.2; desk.add(bk);
    bookCols.forEach(function (col, i) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.22 - i * 0.012, 0.035, 0.16 - i * 0.008), new THREE.MeshStandardMaterial({ color: lin(col), roughness: 0.7 })); b.position.y = 0.018 + i * 0.036; b.rotation.y = (i % 2 - 0.5) * 0.12; bk.add(b);
      var pg = new THREE.Mesh(new THREE.BoxGeometry(0.205 - i * 0.012, 0.028, 0.004), new THREE.MeshStandardMaterial({ color: lin(0xf0e6cf), roughness: 0.8 })); pg.position.set(0, 0.018 + i * 0.036, 0.08 - i * 0.004); bk.add(pg); });
    var gl = globe(); gl.group.position.set(0.66, 0.78, -1.62); desk.add(gl.group);
    var win = studyWindow(holder);
    var mode = 'auto';
    function apply() { var T = SR.timeOfDay(mode), N = T.night; win.set(T.light, T.dusk); lights.forEach(function (q) { q.base = 0.75 + 0.5 * N; }); lampL.intensity = 0.35 + 0.45 * N; ctx.hemi.intensity = 0.55 + 0.2 * (1 - N); }
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
      else if (def.easel) easel(g, def.easel[0], def.easel[1], def.easel[2]);
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
        var GL = new THREE.GLTFLoader(); if (root.MeshoptDecoder && GL.setMeshoptDecoder) GL.setMeshoptDecoder(root.MeshoptDecoder);
        GL.load(siteBase() + def.glb, function (gl) {
          if (!holder.parent) return;                                   // the room was switched away while loading
          var m = gl.scene; m.position.fromArray(def.offset); m.rotation.y = def.ry || 0;
          m.traverse(function (o) { if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.receiveShadow = !!def.lit; if (o.material.map) o.material.map.anisotropy = 4; } });
          holder.add(m); cut(m, def.cut); if (def.glass) cutGlass(m, def.glass, def.glassThr != null ? def.glassThr : 232);
          var furn = takeMovables(def, m);
          var R = solidsOf(m, 0, office); R.solids.forEach(function (s) { solids.push(s); });
          var SF = surfacesOf(m, def.walk); holder.add(SF.group); surfaces.push(SF.group);      // things can stand on the model now
          if (def.finish) try { fin = def.finish({ holder: holder, model: m, scene: scene, hemi: hemi, templates: Object.keys(TPL).filter(function (k) { return k.indexOf('glb:' + def.id + ':') === 0; }).map(function (k) { return TPL[k]; }) }); if (fin && fin.setTime) fin.setTime(tmode); } catch (er) { if (root.console) console.warn('Spatial Home: finishing ' + def.id, er); }
          if (def.movable) try { root.dispatchEvent(new CustomEvent('spatialhome:furnish', { detail: { env: def.id, items: furn } })); } catch (er) {}
        }, undefined, function (e) { if (root.console) console.warn('Spatial Home: ' + def.id + ' model could not load', e); });
      }, function () {});

      return {
        id: def.id, name: def.name, group: g, holder: holder, far: def.far || 80, size: { W: 3.0, D: 2.6, H: def.h },
        anchors: A, avatar: PT.avatar, start: def.start || PT.start, desk: def.deskCam || PT.deskCam, solids: solids, areas: areas, credit: def.credit,
        surfaces: surfaces, dress: def.dress || null, realistic: !!def.realistic, upgrade: def.upgrade || null, movable: !!def.movable,
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
  /* The King's Hall as a state study (2026-11-13, after the oval-office arrangement): the presidential desk stands before
     the middle window with its one chair, two standards behind it, console tables with busts between the windows, a great
     oval carpet in front; the room's own things line the side walls so the middle stays clear; the royal garden outside */
  var DK = 0.792, KX = -0.15;
  var KH_ITEMS = [
    { kind: 'kh-desk', title: '总统大书桌', p: [KX, 0, -7.1], ry: 0, uid: 9130 }, { kind: 'kh-exec', title: '高背御座椅', p: [KX, 0, -8.0], ry: 0, uid: 9131 },
    { kind: 'kh-banner', title: '深红旗帜', p: [KX - 0.85, 0, -8.35], ry: 0, uid: 9132 }, { kind: 'kh-banner2', title: '藏蓝旗帜', p: [KX + 1.18, 0, -8.35], ry: PI, uid: 9133 },
    { kind: 'kh-console', title: '雕花边桌 · 铜像', p: [-1.8, 0, -8.28], ry: 0, uid: 9134 }, { kind: 'kh-console', title: '雕花边桌 · 铜像', p: [1.44, 0, -8.42], ry: 0, uid: 9135 },
    { kind: 'kh-oval', title: '椭圆国事地毯', p: [0, 0, -4.4], ry: 0, uid: 9120 },
    { kind: 'kh-girandole', title: '镀金烛台', p: [-4.7, 0, -7.9], ry: 0, uid: 9121 }, { kind: 'kh-girandole', title: '镀金烛台', p: [4.5, 0, -8.1], ry: 0, uid: 9122 },
    { kind: 'kh-plinth', p: [3.9, 0, -5.4], ry: -PI / 2, uid: 9111 }, { kind: 'kh-plinth', p: [3.9, 0, -4.5], ry: -PI / 2, uid: 9112 },
    { kind: 'kh-plinth', p: [3.9, 0, -3.6], ry: -PI / 2, uid: 9113 }, { kind: 'kh-plinth', p: [3.9, 0, -2.7], ry: -PI / 2, uid: 9114 },
    { kind: 'kh-plinth', p: [3.9, 0, -1.8], ry: -PI / 2, uid: 9115 }];
  var KINGS = { realistic: true, id: 'kings-hall', name: "The King's Hall · Skokloster", glb: 'interiors-glb/assets/kings_hall.glb', h: 4.5, showroom: true, far: 700,
    offset: [0.37, 1.3, -10.735], walk: [-5.6, -9.9, 5.6, 5.2],
    cut: [[-1.1, 0.06, -2.86, 1.2, 1.5, -0.93], [-0.52, 1.6, -2.3, 0.54, 3.42, -1.22],   // the scanned table and chairs; the chandelier (below the ceiling rosette)
          [-9, -2, -30, 9, 9, -8.92], [-9, -2, 5.3, 9, 9, 30]],                                // the scan's rough outer shell behind the window walls (it hid the garden)
    glass: [[-3.86, 1.0, -16, -2.79, 3.38, -8.45], [-0.8, 1.0, -16, 0.38, 3.38, -8.55], [2.5, 1.0, -16, 3.5, 3.38, -8.62],
            [-3.37, 1.0, 4.58, -2.36, 3.38, 12], [-0.31, 1.0, 4.52, 0.79, 3.38, 12], [2.69, 1.0, 4.42, 3.77, 3.38, 12]], glassThr: 0,
    panes: [[-3.86, -2.79, -8.58], [-0.8, 0.38, -8.68], [2.5, 3.5, -8.78], [-3.37, -2.36, 4.92], [-0.31, 0.79, 4.86], [2.69, 3.77, 4.74]],   // x0, x1, the glass plane
    chandelier: [0.01, -1.765, 3.42],
    easel: null, finish: kingsFinish,
    dress: { board: dressBoardOf(KH_STYLE), aquarium: dressAquariumOf(KH_STYLE) },
    /* v2: the state-study arrangement (the long table and its four chairs go; the things you had moved here go back to
       their new places once) */
    upgrade: { v: 3, fn: function (L) {
      var ex = (L.extras || []).filter(function (e) { return !(e.uid >= 9101 && e.uid <= 9105); });
      KH_ITEMS.forEach(function (n) { var e = ex.filter(function (x) { return x.uid === n.uid; })[0]; if (e) { e.kind = n.kind; e.p = n.p.slice(); e.ry = n.ry; if (n.title) e.title = n.title; } else ex.push(JSON.parse(JSON.stringify(n))); });
      L.extras = ex;
      Object.keys(L).forEach(function (k) { var v = L[k]; if (v && typeof v === 'object' && !Array.isArray(v) && v.p && !v.stashed) delete L[k]; });
    } },
    start: { pos: [0, 1.6, 3.0], yaw: 0, pitch: -0.08 }, deskCam: { pos: [KX, 1.5, -8.05], look: [KX, 0.8, -6.9] },
    anchors: {
      'desk.left': { p: [KX, DK, -7.3], ry: PI }, 'desk.right': { p: [KX - 0.55, DK, -7.3], ry: PI + 0.2 }, 'desk.quill': { p: [KX + 0.55, DK, -7.35], ry: PI - 0.3 },
      'desk.key': { p: [KX + 0.75, DK, -6.95], ry: PI }, 'desk.mochi': { p: [KX - 0.75, DK, -6.9], ry: PI + 0.4 }, 'desk.book': { p: [KX + 0.3, DK, -6.9], ry: PI },
      'wall.left': { p: [-3.8, 1.62, -5.3], ry: 1.32 }, 'wall.right': { p: [3.9, 0.92, -1.8], ry: -PI / 2 },
      'shelf.mid': { p: [3.9, 0.92, -5.4], ry: -PI / 2 }, 'cabinet.left': { p: [3.9, 0.92, -4.5], ry: -PI / 2 }, 'cabinet.top': { p: [3.9, 0.92, -3.6], ry: -PI / 2 },
      'cabinet.right': { p: [3.9, 0.92, -2.7], ry: -PI / 2 }, 'sill.left': { p: [3.9, 0.92, -1.8], ry: -PI / 2 },
      'corner.window': { p: [-3.95, 0, -2.3], ry: PI / 2 }, 'floor.pack': { p: [-2.6, 0, 3.8], ry: 0.4 }, 'floor.gramo': { p: [-3.9, 0, 0.3], ry: PI / 2 },
      'floor.film': { p: [3.8, 0, 1.3], ry: -PI / 2 }, 'floor.portal': { p: [-3.3, 0, 2.9], ry: PI / 2 }, 'floor.holo': { p: [3.7, 0, -6.6], ry: -PI / 2 },
      'floor.window': { p: [3.85, 0, 3.9], ry: -PI / 2 }
    },
    layout: { extras: JSON.parse(JSON.stringify(KH_ITEMS)) },
    credit: 'The King\u2019s Hall, Skokloster Castle — scan by Erik Lernestål, CC BY 4.0' };
  /* The Victorian Study, embedded deep: its south round table is the desk (things on its top), the north table carries
     the projector, album, medals, car and ornament, and its own armchairs, tables, vases, viola, rugs and ladders are
     movable furniture. The model's floor is 0.2 m up, so it sits 0.2 m down; the south table lands on the desk spot. */
  var VY = 0.725, DY = 0.78;                                         // the round tables; the pedestal desk
  var VICT = { realistic: true, id: 'victorian', name: 'EC–6 Victorian Study', finish: victorianFinish, glb: 'interiors-glb/assets/victorian_study.glb', h: 6.5, lit: true, showroom: true,
    offset: [0, -0.2, -5.1], walk: [-8.4, -13.5, 8.4, 3.4], easel: null, far: 600,
    cut: [[7.75, 0.25, -4.6, 14, 3.3, -2.6]],                          // the bookcase where the new window goes
    start: { pos: [0.7, 1.5, 1.4], yaw: 0.1, pitch: -0.12 }, deskCam: { pos: [0, 1.5, -2.85], look: [0, 0.78, -1.7] },
    dress: { board: dressBoardOf(VIC_STYLE), aquarium: dressAquariumOf(VIC_STYLE) },
    /* v1: the round table makes way for the pedestal desk (and its chair); it goes to the west reading corner with its vase */
    /* v2 (after the user's reference): the desk turned to face the room, a buttoned leather chair behind it */
    upgrade: { v: 2, fn: function (L) {
      var ex = L.extras = L.extras || [];
      if ((L.up | 0) < 1) ex.forEach(function (e) { if (e.kind === 'glb:victorian:Table_South' || e.kind === 'glb:victorian:Vase_South') { e.p = [e.p[0] - 4.4, e.p[1], e.p[2] + 2.6]; } });
      var d = ex.filter(function (e) { return e.uid === 9601; })[0]; if (d) { d.p = [0, 0, -1.9]; d.ry = Math.PI; } else ex.push({ kind: 'vic-desk', title: '维多利亚书桌', p: [0, 0, -1.9], ry: Math.PI, uid: 9601 });
      var c = ex.filter(function (e) { return e.uid === 9602; })[0]; if (c) { c.kind = 'vic-exec'; c.title = '皮质高背椅'; c.p = [0, 0, -2.78]; c.ry = 0; } else ex.push({ kind: 'vic-exec', title: '皮质高背椅', p: [0, 0, -2.78], ry: 0, uid: 9602 });
      Object.keys(L).forEach(function (k) { var v = L[k]; if (v && v.p && !v.stashed && Math.abs(v.p[0]) < 1.2 && v.p[2] < -0.8 && v.p[2] > -3 && v.p[1] > 0.6 && v.p[1] < 0.9) delete L[k]; });   // things on the old desk go to its new places
    } },
    movable: [
      { node: 'Armchair_NE', name: '扶手椅' }, { node: 'Armchair_NW', name: '扶手椅' }, { node: 'Armchair_SE', name: '扶手椅' }, { node: 'Armchair_SW', name: '扶手椅' },
      { node: 'Table_North', name: '圆桌' }, { node: 'Table_South', name: '圆桌 · 书桌' }, { node: 'Vase_North', name: '花瓶' }, { node: 'Vase_South', name: '花瓶' },
      { node: 'Viola', name: '小提琴' }, { node: 'Rug_Hearth_North', name: '壁炉地毯' }, { node: 'Rug_Reading_South', name: '阅读地毯' },
      { node: 'Ladder_North', name: '图书梯' }, { node: 'Ladder_West', name: '图书梯' }
    ],
    anchors: {
      'desk.left': { p: [0, DY, -1.98], ry: Math.PI }, 'desk.right': { p: [-0.42, DY, -2.08], ry: Math.PI + 0.2 }, 'desk.quill': { p: [0.4, DY, -2.14], ry: Math.PI - 0.3 },
      'desk.key': { p: [0.32, DY, -1.6], ry: Math.PI }, 'desk.mochi': { p: [-0.68, DY, -1.6], ry: Math.PI + 0.3 }, 'desk.book': { p: [-0.3, DY, -1.6], ry: Math.PI },
      'wall.left': { p: [-2.7, 1.62, -0.38], ry: 0.35 }, 'wall.right': { p: [0, VY, -8.95], ry: 0 },
      'cabinet.top': { p: [-0.5, VY, -9.4], ry: 0 }, 'cabinet.left': { p: [0.5, VY, -9.4], ry: 0 }, 'cabinet.right': { p: [0, VY, -8.95], ry: 0 },
      'shelf.mid': { p: [-0.45, VY, -9.95], ry: 0 }, 'sill.left': { p: [0.45, VY, -9.95], ry: 0 },
      'corner.window': { p: [4.2, 0, -1.6], ry: -Math.PI / 2 }, 'floor.pack': { p: [-1.1, 0, 0.5], ry: 0.45 }, 'floor.gramo': { p: [-3.6, 0, -4.2], ry: Math.PI / 2 },
      'floor.film': { p: [3.4, 0, -0.4], ry: -Math.PI / 2 }, 'floor.portal': { p: [-6.6, 0, -6.0], ry: Math.PI / 2 }, 'floor.holo': { p: [3.6, 0, -4.6], ry: -Math.PI / 2 },
      'floor.window': { p: [-7.6, 0, -1.0], ry: Math.PI / 2 }
    },
    credit: 'Victorian Study — Fox Dev assets, with the author\u2019s permission' };
  SR.register({ id: 'kings-hall', name: "The King's Hall", zh: '斯科克洛斯特城堡 · 国王大厅', icon: '♛', build: makeEnv(KINGS) });
  SR.register({ id: 'victorian', name: 'EC–6 Victorian Study', zh: 'EC–6 备考书房 · 维多利亚', icon: '▤', build: makeEnv(VICT) });
})(window);
