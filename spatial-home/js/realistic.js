/* Minest · Spatial Home — the things, made real (2026-11-13). In the outside-model rooms (the King's Hall, the Victorian
   Study) the voxel look of Spatial Home's own things does not belong: each thing is dressed with a modelled, period
   version in wood, brass, leather, glass and paper, the same size and in the same place. Only the solid voxel blocks are
   hidden (app.js dress()); what is not voxel stays — the live board, the holo light, the portal's view, Octo, the record,
   the medals, the film beam — so every thing still works and still shows what it shows.
   SpatialRealistic.dress(o) → { group, hideVox: true, tick? } for a thing id, or null. */
(function (root) {
  'use strict';
  var T = root.THREE, M = null;
  function L(h) { return new T.Color(h).convertSRGBToLinear(); }
  function cvs(w, h, f) { var c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  function noise(x, w, h, a) { var im = x.getImageData(0, 0, w, h), D = im.data; for (var i = 0; i < D.length; i += 4) { var n = (Math.random() - 0.5) * a; D[i] += n; D[i + 1] += n; D[i + 2] += n; } x.putImageData(im, 0, 0); }
  function mats() {
    if (M) return M;
    var grain = cvs(256, 256, function (x, w, h) { x.fillStyle = '#7a4a2a'; x.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { x.strokeStyle = 'rgba(40,20,10,' + (0.08 + Math.random() * 0.15) + ')'; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); var y = Math.random() * h; x.moveTo(0, y); for (var k = 0; k <= 8; k++) x.lineTo(k * w / 8, y + Math.sin(k + i) * 3 + (Math.random() - 0.5) * 3); x.stroke(); } noise(x, w, h, 10); });
    grain.wrapS = grain.wrapT = T.RepeatWrapping;
    var leatherT = cvs(128, 128, function (x, w, h) { x.fillStyle = '#6a3a22'; x.fillRect(0, 0, w, h); for (var i = 0; i < 1200; i++) { x.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.12 + ')'; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6, 0, 6.3); x.fill(); } noise(x, w, h, 12); });
    leatherT.wrapS = leatherT.wrapT = T.RepeatWrapping;
    var paperT = cvs(256, 256, function (x, w, h) { x.fillStyle = '#f2ead6'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(40,40,60,.55)'; for (var i = 0; i < 9; i++) x.fillRect(28, 40 + i * 20, 120 + Math.random() * 80, 3); noise(x, w, h, 8); });
    return (M = {
      walnut: new T.MeshStandardMaterial({ map: grain, color: L(0x8a6040), roughness: 0.42, metalness: 0.04 }),
      walnutD: new T.MeshStandardMaterial({ map: grain, color: L(0x4a2c1a), roughness: 0.4, metalness: 0.04 }),
      brass: new T.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.24, metalness: 0.92 }),
      steel: new T.MeshStandardMaterial({ color: L(0xb8bcc4), roughness: 0.22, metalness: 0.95 }),
      black: new T.MeshStandardMaterial({ color: L(0x15161a), roughness: 0.28, metalness: 0.35 }),
      enamel: new T.MeshStandardMaterial({ color: L(0x7a1a22), roughness: 0.22, metalness: 0.2 }),
      leather: new T.MeshStandardMaterial({ map: leatherT, color: L(0xb08060), roughness: 0.55 }),
      leatherR: new T.MeshStandardMaterial({ map: leatherT, color: L(0xa04040), roughness: 0.5 }),
      leatherB: new T.MeshStandardMaterial({ map: leatherT, color: L(0x405a8a), roughness: 0.5 }),
      velvet: new T.MeshStandardMaterial({ color: L(0x6a1420), roughness: 0.9 }),
      paper: new T.MeshStandardMaterial({ map: paperT, roughness: 0.85 }),
      pages: new T.MeshStandardMaterial({ color: L(0xeee4cc), roughness: 0.9 }),
      ivory: new T.MeshStandardMaterial({ color: L(0xf3ead6), roughness: 0.35 }),
      marble: new T.MeshStandardMaterial({ color: L(0xe8e2d6), roughness: 0.18 }),
      stone: new T.MeshStandardMaterial({ color: L(0xd6cbb6), roughness: 0.7 }),
      glass: new T.MeshPhysicalMaterial ? new T.MeshPhysicalMaterial({ color: 0xeef8ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.25, depthWrite: false }) : new T.MeshStandardMaterial({ color: 0xeef8ff, transparent: true, opacity: 0.25, depthWrite: false }),
      crystal: new T.MeshStandardMaterial({ color: L(0xcfe8ff), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 }),
      ink: new T.MeshStandardMaterial({ color: L(0x101830), roughness: 0.1, metalness: 0.2 }),
      sand: new T.MeshStandardMaterial({ color: L(0xd9c69a), roughness: 0.95 }),
      rock: new T.MeshStandardMaterial({ color: L(0x7a7468), roughness: 0.8 }),
      weed: new T.MeshStandardMaterial({ color: L(0x3f7a3a), roughness: 0.7, side: T.DoubleSide }),
      canvas: new T.MeshStandardMaterial({ color: L(0xf4f1ea), roughness: 0.95 }),
      feather: new T.MeshStandardMaterial({ map: cvs(64, 256, function (x, w, h) { x.clearRect(0, 0, w, h); x.fillStyle = '#f6f2ea'; x.beginPath(); x.moveTo(32, 2); x.quadraticCurveTo(64, 120, 36, 254); x.lineTo(28, 254); x.quadraticCurveTo(0, 120, 32, 2); x.fill(); x.strokeStyle = 'rgba(150,140,120,.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 4); x.lineTo(32, 254); x.stroke(); for (var i = 0; i < 40; i++) { x.strokeStyle = 'rgba(180,170,150,.35)'; x.beginPath(); x.moveTo(32, 10 + i * 6); x.lineTo(i % 2 ? 6 : 58, 20 + i * 6); x.stroke(); } }), transparent: true, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.8 })
    });
  }
  function B(g, m, x, y, z, w, h, d) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; }
  function C(g, m, x, y, z, r0, r1, h, seg) { var c = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 20), m); c.position.set(x, y, z); c.castShadow = true; g.add(c); return c; }
  function lathe(g, m, pts, seg) { var l = new T.Mesh(new T.LatheGeometry(pts.map(function (q) { return new T.Vector2(q[0], q[1]); }), seg || 24), m); l.castShadow = true; g.add(l); return l; }
  function S(g, m, x, y, z, r) { var s = new T.Mesh(new T.SphereGeometry(r, 14, 10), m); s.position.set(x, y, z); g.add(s); return s; }

  var R = {};
  /* a 1920s black typewriter: a shaped frame, round glass-topped keys in four stepped rows, the type-bar basket, a platen
     with knobs and the return lever, paper in it */
  R.typewriter = function () {
    var m = mats(), g = new T.Group();
    var sh = new T.Shape(); sh.moveTo(-0.17, 0); sh.lineTo(0.17, 0); sh.lineTo(0.15, 0.05); sh.lineTo(0.12, 0.1); sh.lineTo(-0.12, 0.1); sh.lineTo(-0.15, 0.05); sh.closePath();
    var body = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), m.black); body.position.set(0, 0.006, -0.13); body.castShadow = true; g.add(body);
    B(g, m.black, 0, 0.03, 0.12, 0.34, 0.05, 0.1);                                          // the keyboard deck
    [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.15], [0.15, 0.15]].forEach(function (q) { C(g, m.walnutD, q[0], 0.004, q[1], 0.014, 0.016, 0.008, 10); });
    for (var r = 0; r < 4; r++) { var n = 10 - (r === 3 ? 1 : 0), z = 0.16 - r * 0.035, y = 0.058 + r * 0.014;
      for (var i = 0; i < n; i++) { var x = -0.135 + i * 0.03 + (r % 2) * 0.012; C(g, m.steel, x, y - 0.01, z, 0.0025, 0.0025, 0.02, 6); C(g, m.ivory, x, y + 0.003, z, 0.011, 0.011, 0.005, 14); var ring = new T.Mesh(new T.TorusGeometry(0.011, 0.0018, 4, 14), m.steel); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + 0.003, z); g.add(ring); } }
    B(g, m.ivory, 0, 0.05, 0.19, 0.16, 0.008, 0.018);                                         // space bar
    var bask = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.03, 24, 1, true, Math.PI, Math.PI), m.steel); bask.rotation.x = Math.PI / 2; bask.position.set(0, 0.1, -0.02); g.add(bask);
    var plat = C(g, m.black, 0, 0.14, -0.1, 0.022, 0.022, 0.42, 18); plat.rotation.z = Math.PI / 2;
    [-0.225, 0.225].forEach(function (x) { var k = C(g, m.black, x, 0.14, -0.1, 0.02, 0.02, 0.02, 14); k.rotation.z = Math.PI / 2; });
    B(g, m.steel, 0, 0.162, -0.075, 0.4, 0.005, 0.008);
    var lev = new T.Mesh(new T.TorusGeometry(0.04, 0.004, 6, 16, Math.PI / 2), m.steel); lev.position.set(-0.22, 0.17, -0.08); lev.rotation.y = Math.PI / 2; g.add(lev);
    var paper = new T.Mesh(new T.PlaneGeometry(0.21, 0.2), m.paper); paper.position.set(0, 0.24, -0.105); paper.rotation.x = -0.12; g.add(paper);
    var badge = new T.Mesh(new T.PlaneGeometry(0.07, 0.016), m.brass); badge.position.set(0, 0.075, 0.068); badge.rotation.x = -0.6; g.add(badge);
    return g;
  };
  /* the planner: a leather-bound journal with gilt edges, a ribbon, a fountain pen beside it */
  R.planner = function () {
    var m = mats(), g = new T.Group();
    B(g, m.leatherB, 0, 0.016, 0, 0.24, 0.032, 0.32); B(g, m.pages, 0.004, 0.016, 0, 0.228, 0.024, 0.305);
    B(g, m.brass, -0.121, 0.016, 0, 0.003, 0.03, 0.31); B(g, m.brass, 0, 0.0325, 0.12, 0.22, 0.001, 0.004); B(g, m.brass, 0, 0.0325, -0.12, 0.22, 0.001, 0.004);
    B(g, m.enamel, 0.05, 0.02, 0.17, 0.012, 0.002, 0.04);
    var pen = C(g, m.black, 0.165, 0.008, 0.0, 0.007, 0.007, 0.15, 12); pen.rotation.x = Math.PI / 2; var cap = C(g, m.brass, 0.165, 0.008, -0.07, 0.0075, 0.0075, 0.02, 12); cap.rotation.x = Math.PI / 2;
    return g;
  };
  /* the album: a gilt-cornered leather album on a little walnut easel, leaning back */
  R.album = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnutD, 0, 0.01, 0, 0.34, 0.02, 0.16); B(g, m.walnutD, 0, 0.032, 0.06, 0.34, 0.025, 0.02);
    var back = B(g, m.walnutD, 0, 0.14, -0.06, 0.03, 0.26, 0.02); back.rotation.x = -0.2;
    var a = new T.Group(); a.position.set(0, 0.025, 0.035); a.rotation.x = -0.2; g.add(a);
    B(a, m.leatherR, 0, 0.16, -0.025, 0.27, 0.33, 0.04); B(a, m.pages, 0.004, 0.16, -0.025, 0.258, 0.315, 0.032);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { B(a, m.brass, q[0] * 0.122, 0.16 + q[1] * 0.152, -0.004, 0.026, 0.026, 0.003); });
    var oval = new T.Mesh(new T.CircleGeometry(0.06, 24), m.brass); oval.scale.y = 1.3; oval.position.set(0, 0.17, -0.004); a.add(oval);
    return g;
  };
  /* the holo projector: a walnut drum with a brass collar and a crystal lens — the holo light above it stays */
  R.projector = function () {
    var m = mats(), g = new T.Group();
    lathe(g, m.walnutD, [[0, 0], [0.15, 0], [0.155, 0.02], [0.14, 0.04], [0.13, 0.055], [0, 0.055]], 32);
    lathe(g, m.brass, [[0, 0.055], [0.13, 0.055], [0.125, 0.07], [0.11, 0.075], [0, 0.075]], 32);
    lathe(g, m.walnut, [[0, 0.075], [0.11, 0.075], [0.105, 0.1], [0.085, 0.105], [0, 0.105]], 32);
    var lens = new T.Mesh(new T.SphereGeometry(0.06, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.crystal); lens.position.y = 0.105; g.add(lens);
    var ring = new T.Mesh(new T.TorusGeometry(0.062, 0.006, 8, 28), m.brass); ring.rotation.x = Math.PI / 2; ring.position.y = 0.107; g.add(ring);
    B(g, m.brass, 0.0, 0.035, 0.15, 0.06, 0.016, 0.006);
    return g;
  };
  /* the ornament: a marble foot with a brass ring and a crystal heart — its own rings and glow keep turning */
  R.ornament = function () {
    var m = mats(), g = new T.Group();
    lathe(g, m.marble, [[0, 0], [0.08, 0], [0.082, 0.015], [0.07, 0.025], [0.05, 0.04], [0.045, 0.05], [0, 0.05]], 28);
    var r = new T.Mesh(new T.TorusGeometry(0.068, 0.005, 8, 28), m.brass); r.rotation.x = Math.PI / 2; r.position.y = 0.022; g.add(r);
    C(g, m.brass, 0, 0.08, 0, 0.008, 0.012, 0.06, 10);
    S(g, m.crystal, 0, 0.16, 0, 0.05);
    return g;
  };
  /* the backpack: a leather-and-brass steamer trunk with a domed lid, straps and corner caps */
  R.backpack = function () {
    var m = mats(), g = new T.Group(), W = 0.58, D = 0.5, H = 0.36;
    B(g, m.leather, 0, H / 2 + 0.02, 0.02, W, H, D);
    var lid = new T.Mesh(new T.CylinderGeometry(D / 2, D / 2, W, 24, 1, false, 0, Math.PI), m.leather); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.scale.set(1, 1, 0.45); lid.position.set(0, H + 0.02, 0.02); g.add(lid);
    [-0.18, 0.18].forEach(function (x) { B(g, m.walnutD, x, H / 2 + 0.02, 0.02, 0.05, H + 0.004, D + 0.006); var st = new T.Mesh(new T.CylinderGeometry(D / 2 + 0.003, D / 2 + 0.003, 0.05, 24, 1, true, 0, Math.PI), m.walnutD); st.rotation.z = Math.PI / 2; st.rotation.y = Math.PI / 2; st.scale.set(1, 1, 0.45); st.position.set(x, H + 0.02, 0.02); g.add(st); B(g, m.brass, x, H - 0.05, D / 2 + 0.025, 0.04, 0.03, 0.006); });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { B(g, m.brass, q[0] * (W / 2 - 0.02), 0.04, 0.02 + q[1] * (D / 2 - 0.02), 0.045, 0.045, 0.045); });
    B(g, m.brass, 0, H - 0.01, D / 2 + 0.025, 0.07, 0.06, 0.008); C(g, m.walnutD, 0, 0.02, 0.02, 0.01, 0.01, 0.01).visible = false;
    var handle = new T.Mesh(new T.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), m.leather); handle.position.set(0, H + 0.02 + D / 2 * 0.45, 0.02); g.add(handle);
    return g;
  };
  /* the gramophone: a walnut cabinet with a crank, a brass horn, the tone arm — the record and turntable stay */
  R.gramophone = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnut, 0.03, 0.22, 0, 0.52, 0.42, 0.4); B(g, m.walnutD, 0.03, 0.44, 0, 0.55, 0.035, 0.43); B(g, m.walnutD, 0.03, 0.02, 0, 0.55, 0.04, 0.43);
    [[-1, 1], [1, 1]].forEach(function (q) { B(g, m.brass, 0.03 + q[0] * 0.13, 0.22, 0.202, 0.16, 0.24, 0.004).material = m.walnutD; });
    var crank = C(g, m.brass, 0.3, 0.3, 0, 0.008, 0.008, 0.08, 8); crank.rotation.z = Math.PI / 2; B(g, m.brass, 0.34, 0.27, 0, 0.008, 0.07, 0.008); C(g, m.black, 0.345, 0.235, 0.0, 0.012, 0.012, 0.04, 10).rotation.x = Math.PI / 2;
    C(g, m.brass, 0.19, 0.49, -0.05, 0.022, 0.026, 0.06, 14);
    var arm = new T.Mesh(new T.CylinderGeometry(0.009, 0.012, 0.22, 10), m.brass); arm.rotation.z = Math.PI / 2 - 0.2; arm.rotation.y = 0.5; arm.position.set(0.1, 0.52, 0.01); g.add(arm);
    /* the horn: from the arm's back, up and forward, flaring like a lily */
    var pts = []; for (var i = 0; i <= 24; i++) { var t = i / 24; pts.push(new T.Vector2(0.018 + Math.pow(t, 3) * 0.24, t * 0.46)); }
    var horn = new T.Mesh(new T.LatheGeometry(pts, 32), new T.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.22, metalness: 0.9, side: T.DoubleSide })); horn.position.set(0.06, 0.56, -0.12); horn.rotation.x = 0.75; g.add(horn);
    var neck = C(g, m.brass, 0.13, 0.53, -0.1, 0.018, 0.018, 0.14, 12); neck.rotation.z = 1.2;
    return g;
  };
  /* the film projector: a black-and-chrome machine on a walnut tripod, two spoked reels, a lens; the beam stays.
     Its screen stands in front: a walnut frame on feet, a white canvas */
  R.projector16 = function () {
    var m = mats(), g = new T.Group(), reels = [];
    [0, 1, 2].forEach(function (i) { var a = i / 3 * Math.PI * 2, leg = new T.Mesh(new T.CylinderGeometry(0.012, 0.018, 0.86, 8), m.walnutD); leg.position.set(Math.sin(a) * 0.14, 0.42, Math.cos(a) * 0.14); leg.rotation.set(Math.cos(a) * 0.32, 0, -Math.sin(a) * 0.32); g.add(leg); });
    C(g, m.brass, 0, 0.84, 0, 0.05, 0.06, 0.04, 16);
    B(g, m.black, 0, 0.94, 0.03, 0.16, 0.16, 0.3);
    var lensT = C(g, m.steel, 0, 0.95, 0.22, 0.035, 0.04, 0.1, 18); lensT.rotation.x = Math.PI / 2; var lg = C(g, m.crystal, 0, 0.95, 0.272, 0.032, 0.032, 0.006, 18); lg.rotation.x = Math.PI / 2;
    [[1.06, -0.08], [1.03, 0.12]].forEach(function (q) { var reel = new T.Group(); reel.position.set(-0.01, q[0], q[1]); g.add(reel); reels.push(reel);
      var disc = new T.Mesh(new T.TorusGeometry(0.1, 0.008, 6, 32), m.steel); disc.rotation.y = Math.PI / 2; reel.add(disc);
      for (var s = 0; s < 3; s++) { var sp = B(reel, m.steel, 0, 0, 0, 0.004, 0.19, 0.012); sp.rotation.x = s * Math.PI / 3; }
      var film = C(reel, m.black, 0, 0, 0, 0.07, 0.07, 0.014, 24); film.rotation.z = Math.PI / 2; C(reel, m.steel, 0, 0, 0, 0.015, 0.015, 0.03, 10).rotation.z = Math.PI / 2; });
    B(g, m.steel, -0.085, 0.94, 0.03, 0.006, 0.12, 0.24);
    /* the screen (its canvas sits just behind the old voxel screen's face) */
    var sc = new T.Group(); sc.position.set(0, 0, 1.32); g.add(sc);
    [-0.47, 0.47].forEach(function (x) { B(sc, m.walnutD, x, 0.78, 0, 0.04, 1.56, 0.04); B(sc, m.walnutD, x, 0.02, 0, 0.06, 0.04, 0.4); });
    B(sc, m.walnutD, 0, 1.54, 0, 0.98, 0.05, 0.05); B(sc, m.walnutD, 0, 0.4, 0, 0.98, 0.04, 0.04);
    var cv = new T.Mesh(new T.PlaneGeometry(0.9, 1.08), m.canvas); cv.position.set(0, 0.98, -0.012); cv.rotation.y = Math.PI; sc.add(cv);
    var cv2 = cv.clone(); cv2.rotation.y = 0; cv2.position.z = -0.016; sc.add(cv2);
    return { group: g, tick: function (t) { reels.forEach(function (r) { r.rotation.x = t * 1.6; }); } };
  };
  /* the portal: a carved stone archway with gilt mouldings, a keystone, on plinths — the view through it stays */
  R.tsqPortal = function () {
    var m = mats(), g = new T.Group(), RA = 0.6, CY = 1.66;
    [-1, 1].forEach(function (s) { B(g, m.stone, s * 0.6, 0.12, 0, 0.32, 0.24, 0.3); B(g, m.stone, s * 0.6, 0.9, 0, 0.24, 1.36, 0.24); B(g, m.brass, s * 0.6, 1.6, 0, 0.27, 0.04, 0.27); B(g, m.brass, s * 0.6, 0.25, 0, 0.27, 0.02, 0.27);
      for (var f = 0; f < 3; f++) B(g, m.marble, s * 0.6 + (f - 1) * 0.06, 0.92, 0.121, 0.02, 1.2, 0.004); });
    var arch = new T.Mesh(new T.TorusGeometry(RA, 0.12, 10, 32, Math.PI), m.stone); arch.position.y = CY; arch.scale.z = 1.1; g.add(arch);
    var gilt = new T.Mesh(new T.TorusGeometry(RA - 0.12, 0.012, 6, 32, Math.PI), m.brass); gilt.position.set(0, CY, 0.125); g.add(gilt);
    var gilt2 = new T.Mesh(new T.TorusGeometry(RA + 0.12, 0.012, 6, 32, Math.PI), m.brass); gilt2.position.set(0, CY, 0.125); g.add(gilt2);
    B(g, m.marble, 0, CY + RA + 0.02, 0.02, 0.16, 0.24, 0.3); B(g, m.brass, 0, CY + RA + 0.02, 0.172, 0.08, 0.12, 0.004);
    B(g, m.stone, 0, CY + RA + 0.2, 0, 1.6, 0.1, 0.34); B(g, m.brass, 0, CY + RA + 0.145, 0.172, 1.6, 0.012, 0.004);
    return g;
  };
  /* the holo console: a walnut writing-cabinet base with brass trim — the holo rings, globe and panes above stay */
  R.holoDesk = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnutD, 0, 0.04, 0, 0.82, 0.08, 0.6); B(g, m.walnut, 0, 0.38, 0, 0.76, 0.6, 0.54); B(g, m.walnutD, 0, 0.69, 0, 0.84, 0.03, 0.62);
    B(g, m.brass, 0, 0.672, 0, 0.845, 0.008, 0.625);
    [-0.2, 0.2].forEach(function (x) { B(g, m.walnutD, x, 0.38, 0.273, 0.32, 0.5, 0.012); B(g, m.brass, x, 0.42, 0.282, 0.06, 0.012, 0.006); });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { C(g, m.brass, q[0] * 0.38, 0.38, q[1] * 0.26, 0.018, 0.018, 0.6, 10); });
    return g;
  };
  /* the aquarium's inside: real sand, smooth stones, a broken column, swaying weed (the cabinet and roof are the room's) */
  R.aquarium = function () {
    var m = mats(), g = new T.Group(), Y0 = 0.62, weeds = [];
    var sand = new T.Mesh(new T.BoxGeometry(0.8, 0.05, 0.38), m.sand); sand.position.y = Y0 + 0.035; g.add(sand);
    [[-0.25, -0.06, 0.07], [-0.18, 0.06, 0.045], [0.22, -0.08, 0.06], [0.3, 0.05, 0.035], [0.05, 0.1, 0.03]].forEach(function (q) { var r = new T.Mesh(new T.DodecahedronGeometry(q[2], 1), m.rock); r.scale.y = 0.7; r.position.set(q[0], Y0 + 0.06 + q[2] * 0.4, q[1]); r.rotation.set(Math.random(), Math.random(), 0); g.add(r); });
    var col = C(g, m.marble, 0.1, Y0 + 0.13, -0.08, 0.025, 0.028, 0.14, 12); var col2 = C(g, m.marble, 0.17, Y0 + 0.07, -0.05, 0.025, 0.025, 0.06, 12); col2.rotation.z = 1.4;
    [[-0.32, 0.06], [-0.1, -0.12], [0.34, 0.08], [0.25, -0.12], [-0.02, 0.0]].forEach(function (p, j) {
      var w = new T.Group(); w.position.set(p[0], Y0 + 0.06, p[1]); g.add(w); weeds.push(w);
      for (var k = 0; k < 3; k++) { var pl = new T.Mesh(new T.PlaneGeometry(0.03, 0.2 + (j % 3) * 0.06), m.weed); pl.position.y = (0.2 + (j % 3) * 0.06) / 2; pl.rotation.y = k * 1.05; w.add(pl); } });
    return { group: g, tick: function (t) { weeds.forEach(function (w, j) { w.rotation.z = Math.sin(t * 1.1 + j) * 0.12; w.rotation.x = Math.sin(t * 0.8 + j * 2) * 0.06; }); } };
  };
  /* the quill: a crystal inkwell with a brass cap on a walnut tray, a white feather in it */
  R.quill = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnutD, 0, 0.008, 0, 0.24, 0.016, 0.2); B(g, m.brass, 0, 0.017, 0.098, 0.24, 0.004, 0.004);
    B(g, m.crystal, -0.06, 0.05, -0.02, 0.08, 0.07, 0.08); B(g, m.ink, -0.06, 0.035, -0.02, 0.06, 0.04, 0.06);
    lathe(g, m.brass, [[0, 0.085], [0.03, 0.085], [0.032, 0.095], [0.02, 0.1], [0.008, 0.11], [0, 0.11]], 20).position.set(-0.06, 0, -0.02);
    var f = new T.Mesh(new T.PlaneGeometry(0.05, 0.3), m.feather); f.position.set(-0.08, 0.22, -0.02); f.rotation.z = 0.28; f.rotation.y = 0.5; g.add(f);
    var f2 = f.clone(); f2.rotation.y = 0.5 + Math.PI / 2; g.add(f2);
    var pen = C(g, m.brass, 0.06, 0.024, 0.02, 0.005, 0.005, 0.12, 8); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.3;
    return g;
  };
  /* the car key: a brass key with a pierced bow on a ring, a stitched leather fob */
  R.carkey = function () {
    var m = mats(), g = new T.Group();
    var bow = new T.Mesh(new T.TorusGeometry(0.018, 0.006, 8, 20), m.brass); bow.rotation.x = Math.PI / 2; bow.position.set(-0.035, 0.006, 0); g.add(bow);
    B(g, m.brass, 0.02, 0.005, 0, 0.07, 0.004, 0.012); for (var i = 0; i < 4; i++) B(g, m.brass, 0.03 + i * 0.012, 0.005, 0.009, 0.006, 0.004, 0.008);
    var ring = new T.Mesh(new T.TorusGeometry(0.022, 0.002, 6, 24), m.steel); ring.rotation.x = Math.PI / 2; ring.position.set(-0.065, 0.004, 0); g.add(ring);
    var fob = B(g, m.leather, -0.105, 0.005, 0.0, 0.05, 0.008, 0.032); fob.rotation.y = 0.3; var cr = new T.Mesh(new T.CircleGeometry(0.009, 16), m.brass); cr.rotation.x = -Math.PI / 2; cr.position.set(-0.11, 0.01, 0.0); g.add(cr);
    return g;
  };
  /* the medal box: a walnut case lined with crimson velvet, its glazed lid standing open — the medals stay */
  R.medals = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnutD, 0, 0.025, 0, 0.32, 0.05, 0.21); B(g, m.velvet, 0, 0.052, 0, 0.29, 0.006, 0.18);
    var lid = new T.Group(); lid.position.set(0, 0.05, -0.105); lid.rotation.x = -1.9; g.add(lid);
    B(lid, m.walnutD, 0, 0.002, 0.105, 0.32, 0.02, 0.21); var gl = new T.Mesh(new T.PlaneGeometry(0.27, 0.16), m.glass); gl.rotation.x = Math.PI / 2; gl.position.set(0, -0.009, 0.105); lid.add(gl);
    B(g, m.brass, 0, 0.03, 0.106, 0.03, 0.018, 0.004);
    return g;
  };
  /* the book stand: a walnut lectern, a great open book on it, a ribbon */
  R.bookstand = function () {
    var m = mats(), g = new T.Group();
    B(g, m.walnutD, 0, 0.012, 0, 0.26, 0.024, 0.18);
    var top = new T.Group(); top.position.set(0, 0.03, 0.0); top.rotation.x = -0.45; g.add(top);
    B(top, m.walnutD, 0, 0.07, 0, 0.26, 0.012, 0.16); B(top, m.brass, 0, 0.078, 0.078, 0.26, 0.012, 0.008);
    [-1, 1].forEach(function (s) { var p = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.2, 16, 1, true, s > 0 ? 0 : Math.PI, Math.PI / 2), m.pages); p.rotation.x = Math.PI / 2; p.rotation.z = 0; p.scale.set(0.55, 1, 0.12); p.position.set(0, 0.082, 0); top.add(p); });
    var pg = new T.Mesh(new T.PlaneGeometry(0.24, 0.15), m.paper); pg.rotation.x = -Math.PI / 2; pg.position.set(0, 0.092, 0); top.add(pg);
    B(top, m.leatherR, 0, 0.078, 0, 0.255, 0.006, 0.165);
    B(top, m.enamel, 0.02, 0.09, 0.06, 0.008, 0.002, 0.07);
    B(g, m.walnutD, 0, 0.05, -0.05, 0.03, 0.08, 0.03);
    return g;
  };
  /* the vintage car: a maroon tourer with black wings, a chrome radiator, lamps, spoked wheels, a spare — it faces −x */
  R.carmodel = function () {
    var m = mats(), g = new T.Group();
    B(g, m.black, 0, 0.035, 0, 0.34, 0.012, 0.09);
    B(g, m.enamel, -0.08, 0.07, 0, 0.13, 0.06, 0.08); B(g, m.enamel, 0.06, 0.075, 0, 0.16, 0.07, 0.1);
    var hood = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.13, 16, 1, false, 0, Math.PI), m.enamel); hood.rotation.z = Math.PI / 2; hood.position.set(-0.08, 0.1, 0); g.add(hood);
    B(g, m.steel, -0.152, 0.08, 0, 0.012, 0.08, 0.075); B(g, m.black, 0.06, 0.135, 0, 0.12, 0.006, 0.1);
    [-0.04, 0.04].forEach(function (z) { B(g, m.steel, 0.0, 0.13, z, 0.004, 0.05, 0.004); });
    var ws = new T.Mesh(new T.PlaneGeometry(0.085, 0.045), m.glass); ws.rotation.y = Math.PI / 2; ws.position.set(-0.012, 0.13, 0); g.add(ws);
    [[-0.11, 0.055], [0.11, 0.055], [-0.11, -0.055], [0.11, -0.055]].forEach(function (q) {
      var w = new T.Group(); w.position.set(q[0], 0.035, q[1]); g.add(w);
      var tyre = new T.Mesh(new T.TorusGeometry(0.028, 0.008, 8, 20), m.black); w.add(tyre);
      for (var s = 0; s < 6; s++) { var sp = B(w, m.ivory, 0, 0, 0, 0.002, 0.05, 0.002); sp.rotation.z = s * Math.PI / 6; }
      var fw = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.024, 16, 1, true, -Math.PI / 2, Math.PI), m.black); fw.rotation.x = Math.PI / 2; fw.position.set(q[0], 0.04, q[1]); g.add(fw); });
    [-0.03, 0.03].forEach(function (z) { var lp = C(g, m.steel, -0.16, 0.105, z, 0.013, 0.013, 0.02, 12); lp.rotation.z = Math.PI / 2; var lg = new T.Mesh(new T.CircleGeometry(0.011, 12), m.crystal); lg.rotation.y = -Math.PI / 2; lg.position.set(-0.171, 0.105, z); g.add(lg); });
    var spare = new T.Mesh(new T.TorusGeometry(0.026, 0.008, 8, 20), m.black); spare.rotation.y = Math.PI / 2; spare.position.set(0.16, 0.08, 0); g.add(spare);
    return g;
  };
  /* the board: its own voxel frame and cork go; a walnut back behind the live board picture (the screen and the gilt frame
     are the room's) */
  R.board = function () { var m = mats(), g = new T.Group(); B(g, m.walnutD, 0, 0, 0.012, 1.6, 1.1, 0.024); return g; };

  root.SpatialRealistic = {
    dress: function (o) {
      var f = R[o.id]; if (!f || (o.id === 'medals' && o.anchor === 'wall.right')) return null;   // the medal board on the wall keeps its own look
      var r = f(); if (r && r.isObject3D) r = { group: r };
      r.hideVox = true; return r;
    },
    has: function (id) { return !!R[id]; }
  };
})(window);
