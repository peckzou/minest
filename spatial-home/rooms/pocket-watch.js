/* Minest · Spatial Home · Rooms 2.0 — the pocket watch: a gold hunter-case watch hanging on a small brass stand on the
   desk, its lid open, the hands showing the real time, a small star map of light turning over it.
   Tap it and the Holographic Console opens, unfolding from the watch (the same console the 全息操作台 opens: js/holo-lab.js).
   Spatial Home's own files stay as they are: this file adds the watch to the list of things SpatialEntries.make() returns
   and gives every room a place for it — the room's own anchor 'desk.watch', else a spot on the desk between the car key
   and the left of the desk. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SE = root.SpatialEntries, SO = root.SpatialObjects;
  if (!THREE || !SE || !SO) return;
  var PI = Math.PI;
  function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  function tex(n, draw) {
    var c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function dialTex() {
    return tex(512, function (x, n) {
      var c = n / 2, i, g = x.createRadialGradient(c, c, 20, c, c, c); g.addColorStop(0, '#fffdf6'); g.addColorStop(1, '#efe6d0');
      x.fillStyle = g; x.fillRect(0, 0, n, n);
      x.strokeStyle = '#1b1b22'; x.lineWidth = 3; x.beginPath(); x.arc(c, c, 236, 0, 2 * PI); x.stroke(); x.beginPath(); x.arc(c, c, 214, 0, 2 * PI); x.stroke();
      for (i = 0; i < 60; i++) { var a = i * PI / 30, l = i % 5 ? 216 : 208; x.lineWidth = i % 5 ? 2 : 5; x.beginPath(); x.moveTo(c + Math.sin(a) * l, c - Math.cos(a) * l); x.lineTo(c + Math.sin(a) * 234, c - Math.cos(a) * 234); x.stroke(); }
      x.fillStyle = '#16161c'; x.font = '600 46px "Times New Roman", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      ['XII', 'I', 'II', 'III', 'IIII', 'V', '', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach(function (s, k) {
        if (!s) return; var a2 = k * PI / 6; x.save(); x.translate(c + Math.sin(a2) * 172, c - Math.cos(a2) * 172); x.rotate(a2); x.fillText(s, 0, 0); x.restore();
      });
      x.font = 'italic 600 24px "Times New Roman", Georgia, serif'; x.fillText('Minest', c, c - 84); x.font = '600 12px Helvetica, Arial, sans-serif'; x.fillText('CHRONOMETER', c, c - 58);
      x.lineWidth = 2; x.beginPath(); x.arc(c, c + 112, 54, 0, 2 * PI); x.stroke(); x.fillStyle = '#f6efdd'; x.fill(); x.fillStyle = '#16161c';   // the small seconds
      for (i = 0; i < 12; i++) { var a3 = i * PI / 6; x.lineWidth = i % 3 ? 1.5 : 3; x.beginPath(); x.moveTo(c + Math.sin(a3) * 44, c + 112 - Math.cos(a3) * 44); x.lineTo(c + Math.sin(a3) * 52, c + 112 - Math.cos(a3) * 52); x.stroke(); }
    });
  }
  function lidTex() {                                                         // engine turning inside the lid, a monogram in the middle
    return tex(512, function (x, n) {
      var c = n / 2, i; x.fillStyle = '#d6ad55'; x.fillRect(0, 0, n, n);
      x.strokeStyle = 'rgba(96,62,10,.55)'; x.lineWidth = 1.4;
      for (i = 0; i < 48; i++) { var a = i * PI / 24; x.beginPath(); x.arc(c + Math.cos(a) * 92, c + Math.sin(a) * 92, 140, 0, 2 * PI); x.stroke(); }
      x.fillStyle = '#e6c577'; x.beginPath(); x.arc(c, c, 76, 0, 2 * PI); x.fill(); x.strokeStyle = '#7a5312'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#6a4710'; x.font = 'italic 700 86px "Times New Roman", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', c, c + 4);
    });
  }

  function pocketWatch() {
    var g = new THREE.Group(), i;
    var gold = new THREE.MeshStandardMaterial({ color: lin(0xe8bd5a), roughness: 0.28, metalness: 0.7, emissive: lin(0x2e2006) }),
        brass = new THREE.MeshStandardMaterial({ color: lin(0xc49a3a), roughness: 0.35, metalness: 0.7, emissive: lin(0x1c1404) }),
        wood = new THREE.MeshStandardMaterial({ color: lin(0x4a2a17), roughness: 0.45 }),
        blue = new THREE.MeshStandardMaterial({ color: lin(0x1b2c6b), roughness: 0.25, metalness: 0.9 });
    function add(geo, m, x, y, z, p) { var q = new THREE.Mesh(geo, m); q.position.set(x, y, z); (p || g).add(q); q.castShadow = true; return q; }
    function light(o) { var m = new THREE.MeshBasicMaterial(o); m.blending = THREE.AdditiveBlending; m.transparent = true; m.depthWrite = false; m.fog = false; return m; }
    /* the stand: a turned walnut foot, a brass post and hook */
    add(new THREE.CylinderGeometry(0.05, 0.056, 0.012, 40), wood, 0, 0.006, 0); add(new THREE.TorusGeometry(0.05, 0.0022, 8, 48), brass, 0, 0.012, 0).rotation.x = PI / 2;
    add(new THREE.CylinderGeometry(0.004, 0.006, 0.006, 16), brass, 0, 0.015, -0.03); add(new THREE.CylinderGeometry(0.0026, 0.0026, 0.142, 10), brass, 0, 0.083, -0.03);
    var hook = add(new THREE.TorusGeometry(0.015, 0.0026, 8, 20, PI), brass, 0, 0.154, -0.015); hook.rotation.y = PI / 2;
    add(new THREE.SphereGeometry(0.0042, 10, 8), brass, 0, 0.152, 0);
    /* the watch, hanging from its bow */
    var W = new THREE.Group(); W.position.set(0, 0.094, 0.002); g.add(W);
    var R = 0.036;
    add(new THREE.CylinderGeometry(R, R, 0.011, 56), gold, 0, 0, 0, W).rotation.x = PI / 2;
    add(new THREE.TorusGeometry(R - 0.001, 0.0034, 12, 64), gold, 0, 0, 0.0052, W); add(new THREE.TorusGeometry(R - 0.001, 0.0034, 12, 64), gold, 0, 0, -0.0052, W);
    add(new THREE.CircleGeometry(R - 0.0038, 56), new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.35 }), 0, 0, 0.0058, W).castShadow = false;
    var glow = add(new THREE.RingGeometry(R - 0.0052, R - 0.0036, 64), light({ color: 0x6fe3ff, opacity: 0.5 }), 0, 0, 0.0062, W); glow.castShadow = false;
    function hand(len, w, m) { var p = new THREE.Group(); p.position.z = 0.0068; W.add(p); add(new THREE.BoxGeometry(w, len, 0.0006), m, 0, len / 2 - len * 0.14, 0, p).castShadow = false; return p; }
    var hh = hand(0.019, 0.0024, blue), mh = hand(0.028, 0.0016, blue); mh.position.z = 0.0076;
    var sh = hand(0.0062, 0.0007, blue); sh.position.set(0, -R * 0.44, 0.0068);
    add(new THREE.CylinderGeometry(0.0016, 0.0016, 0.0024, 12), gold, 0, 0, 0.0074, W).rotation.x = PI / 2;
    var glass = add(new THREE.CircleGeometry(R - 0.0038, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false }), 0, 0, 0.0088, W); glass.castShadow = false;
    add(new THREE.CylinderGeometry(0.0034, 0.0042, 0.008, 16), gold, 0, R + 0.0036, 0, W);                       // the crown, fluted
    add(new THREE.CylinderGeometry(0.0052, 0.0052, 0.0046, 18), gold, 0, R + 0.0096, 0, W);
    add(new THREE.TorusGeometry(0.0088, 0.0015, 8, 28), gold, 0, R + 0.019, 0, W).rotation.y = PI / 2;             // the bow, on the hook
    /* the lid: hinged at nine o'clock, standing open; engine-turned inside */
    var lid = new THREE.Group(); lid.position.set(-R - 0.0014, 0, 0.0062); W.add(lid);
    add(new THREE.CylinderGeometry(0.0016, 0.0016, 0.014, 8), gold, 0, 0, 0, lid);
    add(new THREE.CylinderGeometry(R, R, 0.0022, 56), gold, R + 0.0014, 0, 0.0016, lid).rotation.x = PI / 2;
    add(new THREE.TorusGeometry(R - 0.0008, 0.0018, 8, 56), gold, R + 0.0014, 0, 0.0016, lid);
    var inner = add(new THREE.CircleGeometry(R - 0.003, 56), new THREE.MeshStandardMaterial({ map: lidTex(), roughness: 0.3, metalness: 0.85 }), R + 0.0014, 0, 0.0003, lid); inner.rotation.y = PI; inner.castShadow = false;
    /* the chain: off the bow, down to the foot and round it, a T-bar at its end */
    var pts = [[0.006, R + 0.02, 0.003], [0.03, R + 0.006, 0.012], [0.052, -0.03, 0.02], [0.066, -0.078, 0.022], [0.078, -0.0915, 0.03]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
    for (i = 0; i <= 14; i++) { var a = -0.25 + i * 0.2; pts.push(new THREE.Vector3(Math.cos(a) * (0.084 - i * 0.0012), -0.0915, 0.002 + Math.sin(a) * (0.084 - i * 0.0012))); }
    var curve = new THREE.CatmullRomCurve3(pts), n = 110, link = new THREE.TorusGeometry(0.0021, 0.00062, 5, 10), chain = new THREE.InstancedMesh(link, gold, n), D = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
    for (i = 0; i < n; i++) { var u = i / (n - 1), p0 = curve.getPointAt(u), tg = curve.getTangentAt(u); D.position.copy(p0); D.quaternion.setFromUnitVectors(up, tg); D.rotateY(i % 2 ? PI / 2 : 0); D.updateMatrix(); chain.setMatrixAt(i, D.matrix); }
    chain.castShadow = true; W.add(chain);
    var end = curve.getPointAt(1); add(new THREE.CylinderGeometry(0.0012, 0.0012, 0.02, 8), gold, end.x, end.y + 0.0006, end.z, W).rotation.set(PI / 2, 0, 0.6);
    /* the star map of light over the watch: rings, a few stars joined by lines */
    var holo = new THREE.Group(); holo.position.set(0, 0.215, 0); g.add(holo);
    var rings = [[0.034, 0.0], [0.026, 1.0], [0.042, -0.6]].map(function (r, k) { var m = new THREE.Mesh(new THREE.TorusGeometry(r[0], 0.0007, 5, 64), light({ color: k === 1 ? 0x6fdcff : 0x2f9fe0, opacity: 0.6 })); m.rotation.set(PI / 2 + r[1] * 0.45, r[1], 0); holo.add(m); return m; });
    var sp = [], seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < 12; i++) { var aa = rnd() * 2 * PI, rr = 0.008 + rnd() * 0.026; sp.push(Math.cos(aa) * rr, (rnd() - 0.5) * 0.03, Math.sin(aa) * rr); }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    var stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcffbff, size: 0.0045, sizeAttenuation: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); holo.add(stars);
    var lp = []; for (i = 0; i < 11; i++) { if (i % 3 === 2) continue; lp.push(sp[i * 3], sp[i * 3 + 1], sp[i * 3 + 2], sp[i * 3 + 3], sp[i * 3 + 4], sp[i * 3 + 5]); }
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); var lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5fd8ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); holo.add(lines);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.004, 0.07, 28, 1, true), light({ color: 0x2f9fe0, opacity: 0.07, side: THREE.DoubleSide })); beam.position.y = 0.176; g.add(beam);
    var lamp = new THREE.PointLight(0x4fc8ff, 0.12, 0.7, 2); lamp.position.set(0, 0.2, 0.03); g.add(lamp);
    var hit = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.27, 0.13), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0.01, 0.135, 0.005); g.add(hit);
    var kk = 0, still = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function screenPoint() {
      var cam = root.SpatialRoom && root.SpatialRoom.camera, cv = document.querySelector('canvas'); if (!cam || !cv) return null;
      var v = new THREE.Vector3(0, 0.094, 0.01); g.localToWorld(v); v.project(cam); if (!(v.z < 1)) return null;
      var r = cv.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    }
    return {
      id: 'pocketWatch', name: '怀表', en: 'Pocket watch', icon: '⌚', feature: 'holo', anchor: 'desk.watch', group: g,
      hit: hit, label: [0, 0.3, 0],
      focus: { pos: [0, 1.1, 0.5], look: [0, 0.9, 0] },                                     // replaced by focusL below: the close-up is kept relative to the watch
      focusL: { pos: [0.05, 0.2, 0.4], look: [0, 0.13, 0] }, focus2L: null,
      /* tapped: the lid swings wide, the star map grows — then the Holographic Console unfolds from the dial */
      panel: function () { return new Promise(function (res) {
        var H = root.SpatialHoloLab; if (!H || !H.open) { res(null); return; }
        try { H.open(res, { from: screenPoint() || { x: innerWidth / 2, y: innerHeight / 2 } }); } catch (e) { res(null); }
      }); },
      set: function (k) {
        kk = k; var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        lid.rotation.y = -2.2 - 0.75 * e; holo.scale.setScalar(1 + 0.9 * e); holo.position.y = 0.215 + 0.035 * e;
        beam.material.opacity = 0.07 + 0.07 * e; beam.scale.set(1 + 0.8 * e, 1 + 0.5 * e, 1 + 0.8 * e); beam.position.y = 0.176 + 0.017 * e; lamp.intensity = 0.12 + 0.9 * e; glow.material.opacity = 0.5 + 0.5 * e;
      },
      idle: function (t) {
        var d = new Date(), s = d.getSeconds() + (still ? 0 : d.getMilliseconds() / 1000), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
        hh.rotation.z = -h * PI / 6; mh.rotation.z = -m * PI / 30; sh.rotation.z = -s * PI / 30;
        if (still) return;
        rings[0].rotation.z = t * 0.6; rings[1].rotation.z = -t * 0.9; rings[2].rotation.z = t * 0.35; stars.rotation.y = lines.rotation.y = t * (0.35 + kk * 1.4);
        holo.position.y = 0.215 + 0.035 * kk + Math.sin(t * 1.3) * 0.003; if (kk < 0.02) glow.material.opacity = 0.42 + 0.16 * Math.sin(t * 2.2);
      }
    };
  }

  var make0 = SE.make;
  SE.make = function (opts) { var list = make0.apply(this, arguments); try { list.push(pocketWatch()); } catch (e) { if (root.console) console.warn('[rooms] pocket watch', e); } return list; };
  /* A room without its own 'desk.watch' gets one: the emptiest spot among the things already on its desk (inside the outline
     their anchors draw, so it is on the desk top), where nothing stands between the watch and the eye that leans in to it. */
  var RAD = { 'desk.left': 0.3, 'desk.right': 0.24, 'desk.book': 0.26 };
  function spot(A) {
    var k = A['desk.key']; if (!k) return null;
    var l = A['desk.left'] || k, ry = A['desk.left'] ? l.ry : 0;
    var fallback = { p: [k.p[0] + (l.p[0] - k.p[0]) * 0.42, k.p[1], k.p[2] + (l.p[2] - k.p[2]) * 0.42 + 0.02], ry: ry };
    var P = []; Object.keys(A).forEach(function (n) { if (n.indexOf('desk.') === 0 && A[n] && A[n].p && Math.abs(A[n].p[1] - k.p[1]) < 0.12) P.push({ x: A[n].p[0], z: A[n].p[2], r: RAD[n] || 0.14 }); });
    if (P.length < 3) return fallback;
    var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; P.forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); });
    function cross(o, a, b) { return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x); }
    var S = P.slice().sort(function (a, b) { return a.x - b.x || a.z - b.z; }), H = [], i, n;
    for (i = 0; i < S.length; i++) { while (H.length >= 2 && cross(H[H.length - 2], H[H.length - 1], S[i]) <= 0) H.pop(); H.push(S[i]); }
    for (i = S.length - 2, n = H.length + 1; i >= 0; i--) { while (H.length >= n && cross(H[H.length - 2], H[H.length - 1], S[i]) <= 0) H.pop(); H.push(S[i]); }
    H.pop(); if (H.length < 3) return fallback;
    function inside(q) { for (var j = 0; j < H.length; j++) if (cross(H[j], H[(j + 1) % H.length], q) < -1e-9) return false; return true; }
    var best = null, bs = -1e9, N = 28, TURN = [0, 0.45, -0.45, 0.9, -0.9], u, v, w;
    for (w = 0; w < TURN.length; w++) {                                                       // it may turn a little towards a gap between the things on the desk
      var ang = ry + TURN[w], ex = 0.05 * Math.cos(ang) + 0.46 * Math.sin(ang), ez = -0.05 * Math.sin(ang) + 0.46 * Math.cos(ang);
      for (u = 0; u <= N; u++) for (v = 0; v <= N; v++) {
        var q = { x: x0 + (x1 - x0) * u / N, z: z0 + (z1 - z0) * v / N }; if (!inside(q)) continue;
        var sc = 1e9;
        for (i = 0; i < P.length; i++) {
          var dx = P[i].x - q.x, dz = P[i].z - q.z, d = Math.sqrt(dx * dx + dz * dz) - P[i].r;
          var tt = Math.max(0, Math.min(1, (dx * ex + dz * ez) / (ex * ex + ez * ez))), sx = dx - ex * tt, sz = dz - ez * tt;
          if (Math.sqrt(sx * sx + sz * sz) < P[i].r + 0.04) d -= 0.3;                         // it would stand between the watch and the eye
          if (d < sc) sc = d;
        }
        sc -= Math.abs(TURN[w]) * 0.04;
        if (sc > bs) { bs = sc; best = { p: [q.x, k.p[1], q.z], ry: ang }; }
      }
    }
    return best || fallback;
  }
  var build0 = SO.build;
  SO.build = function (room) {
    var A = room && room.anchors;
    if (A && !A['desk.watch']) { var w = spot(A); if (w) A['desk.watch'] = w; }
    return build0.apply(this, arguments);
  };
  root.SpatialPocketWatch = { make: pocketWatch };
})(window);
