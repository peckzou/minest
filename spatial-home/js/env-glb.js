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

  function makeEnv(def) {
    return function build(scene) {
      var holder = new THREE.Group(); holder.name = 'env-' + def.id; scene.add(holder);
      var g = new THREE.Group(); holder.add(g);
      PT.theme(null); PT.desk(g); PT.chair(g); PT.bookshelf(g); PT.cabinet(g);   // the office corner: Spatial Home's own furniture
      easel(g, -1.9, -2.42, 0);
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
      var solids = PT.solids().slice(), office = [-3.1, -2.7, 3.1, 2.7];
      var areas = [def.walk.slice()];                                   // the whole hall can be walked; the model's own obstacles stop you

      gltfLoader().then(function () {
        new THREE.GLTFLoader().load(siteBase() + def.glb, function (gl) {
          if (!holder.parent) return;                                   // the room was switched away while loading
          var m = gl.scene; m.position.fromArray(def.offset); m.rotation.y = def.ry || 0;
          m.traverse(function (o) { if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.receiveShadow = !!def.lit; if (o.material.map) o.material.map.anisotropy = 4; } });
          holder.add(m);
          var R = solidsOf(m, 0, office); R.solids.forEach(function (s) { solids.push(s); });
        }, undefined, function (e) { if (root.console) console.warn('Spatial Home: ' + def.id + ' model could not load', e); });
      }, function () {});

      return {
        id: def.id, name: def.name, group: g, holder: holder, far: 80, size: { W: 3.0, D: 2.6, H: def.h },
        anchors: A, avatar: PT.avatar, start: PT.start, desk: PT.deskCam, solids: solids, areas: areas, credit: def.credit,
        setTime: function () {}, tick: function () {},
        dispose: function () { SR.disposeTree(holder); scene.background = null; }
      };
    };
  }
  /* offset: where the model sits so the office corner (x −3…3, z −2.6…2.6, desk at the back) lands in an open part of the room */
  var KINGS = { id: 'kings-hall', name: "The King's Hall · Skokloster", glb: 'interiors-glb/assets/kings_hall.glb', h: 4.5,
    offset: [0.37, 1.5, -5.8], walk: [-5.6, -5.0, 5.6, 10.1], credit: 'The King’s Hall, Skokloster Castle — scan by Erik Lernestål, CC BY 4.0' };
  var VICT = { id: 'victorian', name: 'Victorian Study', glb: 'interiors-glb/assets/victorian_study.glb', h: 6.5, lit: true, ry: Math.PI,
    offset: [0, 0, 5.4], walk: [-8.4, -3.2, 8.4, 13.9], credit: 'Victorian Study — Fox Dev assets, with the author’s permission' };
  SR.register({ id: 'kings-hall', name: "The King's Hall", zh: '斯科克洛斯特城堡 · 国王大厅', icon: '♛', build: makeEnv(KINGS) });
  SR.register({ id: 'victorian', name: 'Victorian Study', zh: '维多利亚书房', icon: '▤', build: makeEnv(VICT) });
})(window);
