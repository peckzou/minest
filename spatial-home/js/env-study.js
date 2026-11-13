/* Minest · Spatial Home — environment "study": EC–6 Study Studio.
   Not a new room: it is THE STUDY (study/ on main, commit 8ba6e75 — an English private library: walnut shelves on every
   wall, a carved desk with a green leather top and a banker's lamp, coffered ceiling, chandelier, parquet, a Persian carpet,
   leather chairs, a rolling ladder), built by its own unchanged builder (js/study/world.js, textures.js, scene.js).
   This file only:
   · moves the ladder to the north end of its rail (layout data, not code) so a credenza fits in front of the east shelves;
   · adds three pieces in the Study's own walnut: an easel that carries the EC–6 board (the room's centre, in front of the
     west shelves), a credenza (projector, album, medals, car model) and a lectern by the armchair (the reading stand);
   · gives every thing of Spatial Home its place (the same anchor names as the other environments) without stacking
     anything on the Study's own desk things (lamp, inkwell, candlesticks, open book, pen tray, clock);
   · lets the window and the lights follow the time of day (the Living Window): the sky behind the glass and the daylight
     through it by day, the chandelier, banker's lamp and floor lamp warmer at night. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts;
  if (!SR || !root.StudyWorld || !root.StudyScene || !root.StudyTex) return;

  function walnut(TX) {
    var lin = function (h) { return new THREE.Color(h).convertSRGBToLinear(); };
    return {
      dark: new THREE.MeshStandardMaterial({ color: lin(0xb59a86), map: TX.wood('dark'), roughness: 0.55 }),
      light: new THREE.MeshStandardMaterial({ color: lin(0xd9bda0), map: TX.wood('light'), roughness: 0.5 }),
      brass: new THREE.MeshStandardMaterial({ color: lin(0xc9a24a), roughness: 0.32, metalness: 0.85 }),
      leather: new THREE.MeshStandardMaterial({ color: lin(0xffffff), map: TX.leather(), roughness: 0.6 })
    };
  }
  function box(g, m, x, y, z, w, h, d, ry) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry;
    b.castShadow = true; b.receiveShadow = true; g.add(b); return b;
  }

  /* the easel: two raked walnut posts, a cross rail, a ledge the board stands on; the board itself is the EC–6 board object */
  function easel(g, M, x, z) {
    var e = new THREE.Group(); e.position.set(x, 0, z); g.add(e);
    [-1.12, 1.12].forEach(function (dz) {
      var post = box(e, M.dark, 0.06, 1.25, dz, 0.07, 2.5, 0.07); post.rotation.z = -0.06;
      box(e, M.dark, 0.06, 0.03, dz, 0.5, 0.06, 0.12);                                     // foot
      box(e, M.brass, 0.1, 0.06, dz, 0.06, 0.03, 0.14);
    });
    box(e, M.dark, 0.18, 0.86, 0, 0.16, 0.05, 2.3);                                        // ledge
    box(e, M.light, 0.24, 0.9, 0, 0.04, 0.04, 2.3);                                        // lip
    box(e, M.dark, 0.0, 2.42, 0, 0.08, 0.08, 2.4);                                         // top rail
    box(e, M.brass, 0.05, 2.42, 0, 0.1, 0.1, 0.1);                                         // finial
    return e;
  }
  /* the credenza: three panelled doors, brass pulls, a leather top */
  function credenza(g, M, x0, z0, z1) {
    var d = 0.5, h = 0.78, cx = x0 + d / 2, cz = (z0 + z1) / 2, L = z1 - z0;
    box(g, M.dark, cx, h / 2, cz, d, h - 0.02, L);
    box(g, M.light, cx, h + 0.01, cz, d + 0.04, 0.03, L + 0.04);
    box(g, M.leather, cx, h + 0.027, cz, d - 0.08, 0.004, L - 0.1);
    for (var i = 0; i < 3; i++) {
      var a = z0 + 0.05 + i * (L - 0.1) / 3, b = a + (L - 0.1) / 3 - 0.03;
      box(g, M.light, x0 - 0.005, 0.42, (a + b) / 2, 0.02, 0.56, b - a);
      box(g, M.brass, x0 - 0.025, 0.5, b - 0.06, 0.02, 0.1, 0.02);
    }
    box(g, M.dark, cx, 0.03, cz, d - 0.04, 0.06, L - 0.04);
  }
  function lectern(g, M, x, z) {
    box(g, M.dark, x, 0.02, z, 0.42, 0.04, 0.42);
    box(g, M.light, x, 0.38, z, 0.1, 0.7, 0.1);
    box(g, M.dark, x, 0.75, z, 0.46, 0.04, 0.4);
    box(g, M.brass, x, 0.05, z, 0.12, 0.04, 0.12);
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-study'; scene.add(holder);
    var W = root.StudyWorld.create();
    W.ladder.z = -1.6;                                   // layout data only: the ladder waits at the north end of its rail
    var built = root.StudyScene.build(W, THREE, root.StudyTex, { books: [] });
    holder.add(built.group);
    built.group.traverse(function (m) { if (m.isMesh && !m.isInstancedMesh) { m.receiveShadow = true; } });
    var M = walnut(root.StudyTex), g = new THREE.Group(); holder.add(g);

    var X0 = W.X0, X1 = W.X1, Z0 = W.Z0, Z1 = W.Z1, H = W.H, SHD = W.SH.depth;
    easel(g, M, X0 + SHD + 0.22, -0.3);
    credenza(g, M, X1 - SHD - 0.52, 0.95, 2.65);
    lectern(g, M, -1.25, 2.2);

    /* light: the Study's own warm room, daylight through the north window */
    var hemi = new THREE.HemisphereLight(0xffe9cc, 0x3b2a1c, 0.7); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xdbe6ff, 1.0); sun.position.set(0.5, 4.2, Z0 - 4); sun.target.position.set(0, 0.6, 0.5);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 0.5; sc.far = 14;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var bank = new THREE.PointLight(0x9fe0a8, 0.25, 2.2, 2); bank.position.set(W.desk.x - 0.65, W.desk.h + 0.35, W.desk.z - 0.08); holder.add(bank);   // the green banker's lamp
    var boardLight = new THREE.SpotLight(0xffe2b8, 0.55, 5, 0.6, 0.6, 1.5); boardLight.position.set(X0 + 1.9, H - 0.3, -0.3); boardLight.target.position.set(X0 + 0.5, 1.6, -0.3); holder.add(boardLight); holder.add(boardLight.target);
    scene.fog = null; scene.background = new THREE.Color(0x15100c);

    /* the window's sky (the Study draws it as a plain plane behind the glass) */
    var sky = null; built.group.traverse(function (m) { if (!sky && m.isMesh && m.material && m.material.isMeshBasicMaterial && m.material.color && m.material.color.getHex() === 0xe7f0ff) sky = m; });
    var sheer = null; built.group.traverse(function (m) { if (!sheer && m.isMesh && m.material && m.material.isMeshBasicMaterial && m.material.transparent && Math.abs(m.material.opacity - 0.45) < 0.01 && m.material.color.getHex() === 0xffffff) sheer = m; });
    var base = (built.lights || []).map(function (l) { return l.intensity; });
    var mode = 'auto', lastApply = -99;
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var T = SR.timeOfDay(mode), L = T.light, K = T.dusk, N = T.night;
      if (sky) sky.material.color.copy(c3('#101a35', '#e7f0ff', L)).lerp(new THREE.Color('#f6b48a'), K * 0.6);
      sun.intensity = 0.05 + 0.95 * L; sun.color.copy(c3('#8fa4ff', '#dbe6ff', L)).lerp(new THREE.Color('#ffb27a'), K * 0.6);
      hemi.intensity = 0.32 + 0.38 * L;
      (built.lights || []).forEach(function (l, i) { l.intensity = (base[i] || 0.5) * (0.75 + 0.6 * N); });
      bank.intensity = 0.15 + 0.5 * N; boardLight.intensity = 0.35 + 0.45 * N;
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the Study (y = the surface it stands on) */
    var top = W.desk.h + 0.004, dz = W.desk.z, PI = Math.PI;
    var anchors = {
      'desk.left': { p: [-0.15, top, dz - 0.24], ry: PI },              // typewriter: in front of the chair, between the lamp and the pen tray
      'desk.right': { p: [0.3, top, dz + 0.03], ry: PI },               // planner: beside the open book
      'desk.quill': { p: [-0.42, top, dz - 0.3], ry: PI + 0.25 },
      'desk.mochi': { p: [0.8, top, dz - 0.3], ry: PI - 0.3 },
      'desk.key': { p: [0.06, top, dz + 0.28], ry: PI + 0.3 },
      'desk.book': { p: [-1.25, 0.77, 2.2], ry: PI },                   // the reading stand on the lectern by the armchair
      'sill.left': { p: [-0.72, W.win.y0, Z0 + 0.12], ry: 0 },          // the magic ornament on the window sill
      'corner.window': { p: [1.8, 0, Z1 - SHD - 0.42], ry: PI },        // Octo's aquarium in front of the south-east shelves
      'wall.left': { p: [X0 + SHD + 0.26, 1.6, -0.3], ry: PI / 2 },      // the EC–6 board on the easel
      'cabinet.left': { p: [X1 - SHD - 0.27, 0.81, 1.15], ry: -PI / 2 },
      'shelf.mid': { p: [X1 - SHD - 0.27, 0.81, 1.6], ry: -PI / 2 },
      'cabinet.top': { p: [X1 - SHD - 0.27, 0.81, 2.04], ry: -PI / 2 },
      'cabinet.right': { p: [X1 - SHD - 0.27, 0.81, 2.43], ry: -PI / 2 },
      'wall.right': { p: [X1 - SHD - 0.005, 1.65, 1.8], ry: -PI / 2 },
      'floor.pack': { p: [-1.45, 0, W.desk.z + 0.1], ry: 0.45 },             // the backpack, on the floor left of the desk
      'floor.gramo': { p: [X1 - SHD - 0.4, 0, -0.35], ry: -PI / 2 },        // the gramophone in front of the east shelves
      'floor.film': { p: [-1.7, 0, 0.95], ry: 0 },                          // the film projector and its screen, on the open floor by the easel
      'floor.portal': { p: [X0 + SHD + 0.2, 0, 2.3], ry: PI / 2 },
      'floor.holo': { p: [2.15, 0, 0.25], ry: -PI / 2 }                     // the holo lab console, open floor before the east shelves          // the Times Square archway, west side by the reading corner
    };
    /* what you cannot walk through: the Study's own colliders that reach the floor, and the pieces added here */
    var solids = (built.colliders || []).filter(function (c) { return c.min.y < 1 && c.max.y > 0.2; }).map(function (c) { return [c.min.x, c.min.z, c.max.x, c.max.z]; });
    solids.push([X0, -1.5, X0 + SHD + 0.55, 0.9], [X1 - SHD - 0.56, 0.9, X1, 2.7], [-1.5, 1.95, -1.0, 2.45], [1.35, Z1 - SHD - 0.66, 2.25, Z1]);

    return {
      id: 'study', name: 'EC–6 Study Studio', group: built.group, holder: holder, far: 60, size: { W: X1, D: Z1, H: H },
      anchors: anchors, avatar: PT.avatar, backdrop: [sky, sheer].filter(Boolean),   // the plain sky behind the glass and the sheer: hidden (sheer drawn back) when a window view is chosen (views.js)
      start: { pos: [0.7, 1.5, 2.2], yaw: 0.32, pitch: -0.08 },
      /* the desk chair, for the resident: it sits facing the desk and gets in and out from the east side */
      seat: { x: 0, z: W.desk.z - 0.84, yaw: 0, approach: [0.62, W.desk.z - 0.78], y: 0.46 },
      desk: { pos: [0, 1.5, W.desk.z - 1.05], look: [0, 0.78, W.desk.z + 1.1] },        // sitting in the desk chair, facing the room
      solids: solids,
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t) { if (t - lastApply > 20) { lastApply = t; apply(); } },
      dispose: function () { SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'study', name: 'English Study', zh: '英式书房（原 EC–6 书房）', icon: '📚', build: build });   // 2026-11-13: the EC–6 room is now the Victorian Study
})(window);
