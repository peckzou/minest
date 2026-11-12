/* Minest · Spatial Home — environment "train": Rocky Mountain Express · Banff (班夫 · 加拿大落基山脉豪华列车移动办公室).
   A private luxury carriage 12 × 3.2 m running east–west along x: a reading lounge (sofa, cabinet of curios) at the back,
   the office in the middle (desk facing the left windows), a collection end (bookshelf, display cases, the aquarium) and a
   glass-roofed panorama section. Both sides are windows.
   Outside is a real 3D landscape that never loops: the track is cut into 300 m stretches; each stretch's kind comes from its
   index (forest · emerald river · alpine lake · canyon bridge · tunnel) and the ground is ONE continuous height function of
   the track distance, so stretches join without seams. Stretches are built ahead as the train runs and dropped behind.
   Far ranges (snow peaks) are their own 2 km stretches. Parallax is just perspective: everything passes at train speed.
   The carriage itself never moves (so the things in it never drift); the world slides past, and the camera feels a
   very small sway. Day / night / dusk from the local time; lamps come up in tunnels. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT, SR = root.SpatialRoom, PT = SR.parts;
  var LEN = 6, WID = 1.6, H = 2.5, RAIL = -1.05, SPEED = 17;           // half length, half width, wall height, rail top, m/s
  var THEME = {
    woodLight: '#8a5a3a', wood: '#6d4329', woodDark: '#4a2c1b', blue: '#20403a', blueDeep: '#173029', blueSoft: '#b9c8b8',
    plaster: '#ece4d4', plaster2: '#ddd3bf', straw: '#c8a46a', terracotta: '#8a4e33', stone: '#cbc2b2', stone2: '#b9b0a0', cream: '#f1e6cf',
    gold: '#c9a25a', coral: '#a8553f', leafDark: '#2f5a34'
  };
  function hash(a, b) { var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise(x, z) { var xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf), a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }

  /* ------------------------------------------------------------ the route: what each 300 m stretch is */
  var L = 300, KINDS = ['forest', 'river', 'lake', 'bridge', 'tunnel'];
  var kindMemo = {};
  function kind(i) {
    if (kindMemo[i]) return kindMemo[i];
    var r = hash(i, 7), k = r < 0.34 ? 'forest' : (r < 0.58 ? 'river' : (r < 0.74 ? 'lake' : (r < 0.87 ? 'bridge' : 'tunnel')));
    if (i >= -2 && i <= 1) k = i === 1 ? 'river' : 'forest';            // a gentle start
    var p = i > -50 ? kind(i - 1) : 'forest';
    if (k !== 'forest' && k === p) k = 'forest';
    if ((k === 'tunnel' && p === 'bridge') || (k === 'bridge' && p === 'tunnel')) k = 'forest';
    return (kindMemo[i] = k);
  }
  function side(i) { return hash(i, 13) < 0.5 ? -1 : 1; }
  /* how much of a kind is at track distance X: sin² across its stretch, so it is 0 at both ends — no seams */
  function amt(X, k) { var i = Math.floor(X / L); if (kind(i) !== k) return 0; var s = Math.sin(Math.PI * (X - i * L) / L); return s * s; }
  function sideAt(X) { return side(Math.floor(X / L)); }
  /* the ground: valley floor by the track, slopes rising away, plus the river, lake, gorge and tunnel mountain */
  function ground(X, z) {
    var a = Math.abs(z), h = RAIL - 0.35 + Math.max(0, a - 6) * 0.03 + Math.max(0, a - 120) * 0.2 + (noise(X / 55, z / 55) - 0.5) * Math.min(1, a / 40) * 5;
    h += (noise(X / 260, z / 260) - 0.45) * Math.min(1, Math.max(0, a - 60) / 200) * 70;
    var s = sideAt(X), same = (z > 0 ? 1 : -1) === s;
    var rv = amt(X, 'river'); if (rv > 0 && same) h -= rv * 5.5 * Math.exp(-Math.pow((a - 19) / 6, 2));
    var lk = amt(X, 'lake'); if (lk > 0 && same && a > 22) h = h * (1 - Math.min(1, lk * 1.6)) + Math.min(1, lk * 1.6) * Math.min(h, -9 + Math.max(0, a - 320) * 0.4);
    var gz = amt(X, 'bridge'); if (gz > 0) h -= gz * 58 * Math.exp(-Math.pow(a / 70, 2));
    var tn = amt(X, 'tunnel'); if (tn > 0) h += Math.min(1, tn * 2.5) * 55 * Math.exp(-Math.pow(a / 60, 2));
    return h;
  }
  var WATER_RIVER = RAIL - 4.2, WATER_LAKE = -8, WATER_GORGE = RAIL - 52;

  /* ------------------------------------------------------------ one stretch of country (built ahead, dropped behind) */
  function stretch(i) {
    var g = new THREE.Group(), v = new VB(9000 + (i & 1023)), k = kind(i), X0 = i * L, r = v.r, x, z, c, s = side(i);
    function col(h, X, zz) { if (h > 70) return h > 95 ? '#eef2f6' : '#8a8d90'; var n = noise(X / 18, zz / 18); if (h < RAIL - 4) { var band = Math.floor(h / 3.5) & 3; return ['#7a6450', '#8c7560', '#6c5845', '#9a8470'][band]; } return n < 0.4 ? '#4f7a3e' : (n < 0.75 ? '#5b8a46' : '#6c9550'); }   // canyon walls in rock strata
    /* near: 4 m cells to 44 m, middle: 20 m cells to 420 m — both sides */
    [-1, 1].forEach(function (sg) {
      for (x = 0; x < L; x += 4) for (z = 4; z < 44; z += 4) { var X = X0 + x + 2, zz = sg * (z + 2), h = ground(X, zz), t = Math.round(h * 2) / 2; v.box(x, t - 7, sg > 0 ? z : -z - 4, x + 4, t, sg > 0 ? z + 4 : -z, col(h, X, zz)); }
      for (x = 0; x < L; x += 20) for (z = 44; z < 420; z += 20) { var X2 = X0 + x + 10, z2 = sg * (z + 10), h2 = ground(X2, z2), t2 = Math.round(h2); v.box(x, t2 - 30, sg > 0 ? z : -z - 20, x + 20, t2, sg > 0 ? z + 20 : -z, col(h2, X2, z2)); }
    });
    /* ballast and the embankment right under the train (the rails are one long mesh of their own) */
    v.box(0, RAIL - 1.2, -3.4, L, RAIL - 0.35, 3.4, '#8c8478');
    /* pines: thick in forests, along the shore elsewhere; never in water, never on the track */
    var nT = k === 'forest' ? 150 : (k === 'tunnel' ? 40 : 80);
    for (c = 0; c < nT; c++) {
      var tx = r() * L, tz = (r() < 0.5 ? -1 : 1) * (7 + Math.pow(r(), 1.6) * 260), th = ground(X0 + tx, tz);
      if (th < WATER_RIVER + 0.5 && Math.abs(tz) < 40 && amt(X0 + tx, 'river') > 0.05) continue;
      if ((amt(X0 + tx, 'lake') > 0.2 && Math.abs(tz) > 22 && th < WATER_LAKE + 1) || th > 80) continue;
      var sz = 4 + r() * 6;
      v.box(tx - 0.3, th - 1, tz - 0.3, tx + 0.3, th + sz * 0.25, tz + 0.3, '#5b3f2a');
      for (var q = 0; q < 4; q++) { var w2 = sz * (0.38 - q * 0.08), y0 = th + sz * (0.15 + q * 0.24); v.box(tx - w2, y0, tz - w2, tx + w2, y0 + sz * 0.28, tz + w2, q % 2 ? '#2a5030' : '#24472b', 0.08); }
    }
    /* the canyon bridge: a steel-and-timber trestle under the track */
    if (k === 'bridge') {
      for (x = 6; x < L - 6; x += 12) {
        var gh = ground(X0 + x, 0); if (gh > RAIL - 3) continue;
        v.box(x - 0.5, gh, -2.6, x + 0.5, RAIL - 1.1, -1.8, '#5a4636'); v.box(x - 0.5, gh, 1.8, x + 0.5, RAIL - 1.1, 2.6, '#5a4636');
        for (var yy = gh + 6; yy < RAIL - 2; yy += 8) v.box(x - 6, yy, -2.4, x + 6, yy + 0.5, 2.4, '#6b5240');
      }
      v.box(0, RAIL - 1.25, -2.7, L, RAIL - 0.9, 2.7, '#4a3a2e');
    }
    /* the tunnel: an arched tube with portals at both ends, under the mountain */
    var tunnel = null;
    if (k === 'tunnel') {
      var tv = new VB(9500 + (i & 255)), a0 = 70, a1 = L - 70;
      for (x = a0; x < a1; x += 3) { tv.box(x, RAIL - 0.4, -3.6, x + 3, 4.6, -3.1, '#4a4642'); tv.box(x, RAIL - 0.4, 3.1, x + 3, 4.6, 3.6, '#4a4642'); tv.box(x, 4.6, -3.6, x + 3, 5.2, 3.6, '#3f3b38'); if ((x / 3) % 8 === 0) { tv.box(x, 3.9, -3.1, x + 0.6, 4.1, -2.9, '#ffd58a'); tv.box(x, 3.9, 2.9, x + 0.6, 4.1, 3.1, '#ffd58a'); } }
      [a0, a1].forEach(function (px) { tv.box(px - 1.5, RAIL - 0.4, -5.5, px + 1.5, 7.2, -3.6, '#8a8178'); tv.box(px - 1.5, RAIL - 0.4, 3.6, px + 1.5, 7.2, 5.5, '#8a8178'); tv.box(px - 1.5, 5.2, -5.5, px + 1.5, 7.2, 5.5, '#8a8178'); });
      tunnel = { a0: X0 + a0, a1: X0 + a1 }; g.add(tv.mesh(null, true));
    }
    g.add(v.mesh(null, true));
    /* water: the emerald river and the lakes — the ground above them hides what is not water */
    var wm = new THREE.MeshLambertMaterial({ color: 0x14a394, emissive: 0x0a5e57, emissiveIntensity: 0.55, transparent: true, opacity: 0.94 });   // glacial emerald (rock flour), not a mirror
    if (k === 'river') { var rw = new THREE.Mesh(new THREE.PlaneGeometry(L, 26), wm); rw.rotation.x = -Math.PI / 2; rw.position.set(L / 2, WATER_RIVER, s * 19); g.add(rw); }
    if (k === 'lake') { var lw = new THREE.Mesh(new THREE.PlaneGeometry(L, 420), wm); lw.rotation.x = -Math.PI / 2; lw.position.set(L / 2, WATER_LAKE, s * 230); g.add(lw); }
    if (k === 'bridge') { var bw = new THREE.Mesh(new THREE.PlaneGeometry(L, 60), wm); bw.rotation.x = -Math.PI / 2; bw.position.set(L / 2, WATER_GORGE, 0); g.add(bw); }
    g.userData = { i: i, tunnel: tunnel };
    return g;
  }
  /* far ranges: 2 km stretches of snow peaks well off the track */
  function range(j) {
    var v = new VB(9800 + (j & 511)), FL = 2000, X0 = j * FL, x, z, sg;
    for (sg = -1; sg <= 1; sg += 2) for (x = 0; x < FL; x += 70) for (z = 700; z < 3600; z += 70) {
      var X = X0 + x + 35, d = z + 35, n = noise(X / 520, sg * d / 520 + 9), ridge = Math.pow(Math.max(0, n - 0.25) / 0.75, 1.6) * 1400 + noise(X / 140, d / 140) * 160;
      var h = -30 + Math.min(1, (d - 700) / 900) * ridge, snow = 650 + noise(X / 200, d / 90) * 180;
      v.box(x, h - 400, sg > 0 ? z : -z - 70, x + 70, h, sg > 0 ? z + 70 : -z, h > snow ? '#f2f5f9' : (h > snow - 250 ? '#7f8388' : '#4c6a4e'));
    }
    var m = v.mesh(null, true); m.userData = { j: j }; return m;
  }

  /* ------------------------------------------------------------ the carriage */
  function carriage(g, inner) {
    var v = new VB(8001), x, z;
    /* floor: a dark wood parquet and a runner down the aisle */
    v.box(-LEN, -0.2, -WID, LEN, -0.02, WID, '#3a261a');
    for (x = -LEN; x < LEN; x += 0.4) for (z = -WID; z < WID; z += 0.2) v.box(x + 0.005, -0.02, z + 0.005, x + 0.395, 0, z + 0.195, (((x * 5) | 0) + ((z * 10) | 0)) % 2 ? '#6b4430' : '#5e3b26', 0.06);
    v.box(-LEN + 0.3, 0, 0.35, LEN - 0.3, 0.012, 1.25, '#7a2a2a'); v.box(-LEN + 0.35, 0.012, 0.4, LEN - 0.35, 0.014, 0.45, '#c9a25a'); v.box(-LEN + 0.35, 0.012, 1.15, LEN - 0.35, 0.014, 1.2, '#c9a25a');
    /* walls: wainscot under the windows, pillars between them; the end walls with doors */
    [-1, 1].forEach(function (sg) {
      var z0 = sg > 0 ? WID : -WID - 0.15, z1 = sg > 0 ? WID + 0.15 : -WID;
      v.box(-LEN, 0, z0, LEN, 0.8, z1, '#5e3b26', 0.03); v.box(-LEN, 0.76, z0 - sg * 0.04, LEN, 0.82, z1 - sg * 0.04, '#c9a25a');
      for (x = -LEN; x <= LEN; x += 1.5) v.box(x - 0.08, 0.8, z0, x + 0.08, H, z1, '#4a2c1b');
      v.box(-LEN, H - 0.12, z0, LEN, H, z1, '#4a2c1b');
    });
    v.box(-LEN - 0.15, 0, -WID - 0.15, -LEN, H + 0.6, WID + 0.15, '#4a2c1b'); v.box(LEN, 0, -WID - 0.15, LEN + 0.15, H + 0.6, WID + 0.15, '#4a2c1b');
    v.box(-LEN + 0.004, 0, 0.75, -LEN + 0.02, 2.1, 1.45, '#6d4329'); v.box(LEN - 0.02, 0, 0.75, LEN - 0.004, 2.1, 1.45, '#6d4329');
    v.box(-LEN + 0.02, 1.0, 1.32, -LEN + 0.05, 1.08, 1.38, '#c9a25a'); v.box(LEN - 0.05, 1.0, 1.32, LEN - 0.02, 1.08, 1.38, '#c9a25a');
    /* roof: a panelled ceiling over the lounge, glass over the office and the panorama end */
    v.box(-LEN, H, -WID - 0.15, -2.6, H + 0.15, WID + 0.15, '#efe6d4');
    for (x = -2.6; x < LEN; x += 1.0) { v.box(x - 0.05, H, -WID - 0.15, x + 0.05, H + 0.55, -WID + 0.1, '#4a2c1b'); v.box(x - 0.05, H, WID - 0.1, x + 0.05, H + 0.55, WID + 0.15, '#4a2c1b'); v.box(x - 0.04, H + 0.55, -WID, x + 0.04, H + 0.62, WID, '#4a2c1b'); }
    /* the partition between lounge and office (the bulletin board hangs on it), a brass rail */
    v.box(-2.7, 0, -WID, -2.5, H, 0.0, '#6d4329', 0.03); v.box(-2.72, 1.0, 0.0, -2.48, 1.04, 0.05, '#c9a25a');
    /* window sills, wide enough to keep small things */
    v.box(-LEN, 0.8, -WID, LEN, 0.84, -WID + 0.12, '#8a5a3a'); v.box(-LEN, 0.8, WID - 0.12, LEN, 0.84, WID, '#8a5a3a');
    /* collection end: two glass display cases on the right wall, brass lamps */
    [3.3, 4.4].forEach(function (cx) { v.box(cx - 0.45, 0, WID - 0.5, cx + 0.45, 0.75, WID - 0.12, '#4a2c1b'); v.box(cx - 0.42, 0.75, WID - 0.47, cx + 0.42, 0.77, WID - 0.15, '#c9a25a'); v.cb(cx - 0.2, 0.77, WID - 0.3, 0.12, 0.14, 0.1, '#7f93ad'); v.cb(cx + 0.18, 0.77, WID - 0.32, 0.1, 0.2, 0.1, '#c8744a'); });
    /* little reading lamps on the pillars, a hat rack in the lounge */
    for (x = -4.5; x <= 4.5; x += 3) { v.box(x - 0.03, 1.9, -WID + 0.02, x + 0.03, 2.0, -WID + 0.14, '#c9a25a'); v.cb(x, 1.82, -WID + 0.18, 0.12, 0.1, 0.12, '#f1e6cf'); }
    v.box(-5.2, 0, 1.2, -5.15, 1.8, 1.25, '#c9a25a'); v.box(-5.35, 1.75, 1.1, -5.0, 1.8, 1.4, '#c9a25a');
    g.add(v.mesh());
    var lv = new VB(8002); for (x = -4.5; x <= 4.5; x += 3) lv.cb(x, 1.8, -WID + 0.18, 0.08, 0.02, 0.08, '#fff1cf');
    lv.box(-LEN + 0.2, H - 0.02, -0.05, -2.8, H, 0.05, '#fff1cf'); var lamps = lv.mesh(MAT.glow(0.9), true); g.add(lamps);
    /* the glass: side windows and the dome */
    var gm = new THREE.MeshPhongMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.07, shininess: 160, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide });
    [-1, 1].forEach(function (sg) { var p = new THREE.Mesh(new THREE.PlaneGeometry(2 * LEN, H - 0.8), gm); p.position.set(0, (H + 0.8) / 2, sg * (WID + 0.07)); g.add(p); });
    var dome = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 2.6, 2 * WID), gm); dome.rotation.x = -Math.PI / 2; dome.position.set((LEN - 2.6) / 2, H + 0.6, 0); g.add(dome);
    return lamps;
  }
  /* the shared furniture, each piece moved into its place in the carriage (the anchors move with it) */
  var ZONE = {
    office: { t: [0, 0, 1.0], ry: 0 },
    shelf: { t: [3, 0, 0.8], ry: 0 },
    cabinet: { t: [-3, 0, 1.2], ry: Math.PI },
    sofa: { t: [-4.3, 0, 1.4], ry: -Math.PI / 2 }
  };
  function zone(g, name, fn) { var z = ZONE[name], sub = new THREE.Group(); sub.position.fromArray(z.t); sub.rotation.y = z.ry; g.add(sub); fn(sub); }
  function xf(name, a) {
    var z = ZONE[name], c = Math.cos(z.ry), s = Math.sin(z.ry), x = a.p[0], y = a.p[1], zz = a.p[2];
    return { p: [x * c + zz * s + z.t[0], y + z.t[1], -x * s + zz * c + z.t[2]], ry: a.ry + z.ry };
  }
  function anchors() {
    var A = PT.anchors(0.84), out = {};
    ['desk.left', 'desk.right', 'desk.quill', 'desk.key', 'desk.mochi', 'desk.book', 'floor.pack'].forEach(function (k) { out[k] = xf('office', A[k]); });
    out['shelf.mid'] = xf('shelf', A['shelf.mid']);
    ['cabinet.top', 'cabinet.left', 'cabinet.right', 'wall.right'].forEach(function (k) { out[k] = xf('cabinet', A[k]); });
    out['corner.window'] = { p: [3.85, 0, -1.08], ry: 0 };                      // the aquarium: collection end, by the left windows
    out['wall.left'] = { p: [-2.495, 1.6, -0.8], ry: Math.PI / 2 };             // the bulletin board on the partition
    out['sill.left'] = { p: [-1.75, 0.84, -WID + 0.06], ry: 0 };               // the magic ornament on the window sill
    return out;
  }

  /* the long things that never change: two rails, a sleeper texture that runs */
  function rails(holder) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64; var x = c.getContext('2d');
    x.fillStyle = '#7d766b'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#4a3a2e'; x.fillRect(22, 0, 20, 64);   // one sleeper across the track
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1400, 1); t.encoding = THREE.sRGBEncoding;
    var bed = new THREE.Mesh(new THREE.PlaneGeometry(1400 * 0.7, 3.0), new THREE.MeshLambertMaterial({ map: t })); bed.rotation.x = -Math.PI / 2; bed.position.set(200, RAIL - 0.29, 0); holder.add(bed);
    var rv = new VB(8101); rv.box(-800, RAIL - 0.3, -0.78, 1200, RAIL, -0.7, 'metal'); rv.box(-800, RAIL - 0.3, 0.7, 1200, RAIL, 0.78, 'metal'); holder.add(rv.mesh(null, true));
    return t;
  }

  function sky(holder) {
    var sg = new THREE.SphereGeometry(5200, 24, 12), col = new Float32Array(sg.attributes.position.count * 3); sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); holder.add(m);
    var top = new THREE.Color(), hor = new THREE.Color(), t = new THREE.Color();
    return { mesh: m, set: function (a, b) { top.copy(a).convertSRGBToLinear(); hor.copy(b).convertSRGBToLinear(); var P = sg.attributes.position; for (var i = 0; i < P.count; i++) { var k = Math.max(0, Math.min(1, (P.getY(i) + 200) / 2800)); t.copy(hor).lerp(top, Math.pow(k, 0.6)); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; } sg.attributes.color.needsUpdate = true; } };
  }
  function clouds(holder) {
    var v = new VB(8201), r = v.r, i, k;
    for (i = 0; i < 22; i++) { var ox = -3000 + r() * 6000, oy = 700 + r() * 500, oz = (r() < 0.5 ? -1 : 1) * (800 + r() * 2500), n = 4 + ((r() * 4) | 0); for (k = 0; k < n; k++) v.box(ox + k * 110 - r() * 50, oy + r() * 40, oz - r() * 70, ox + k * 110 + 170 + r() * 90, oy + 45 + r() * 60, oz + 110 + r() * 70, '#ffffff'); }
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }); var m = new THREE.Mesh(v.geometry(), mat); holder.add(m); return { mesh: m, mat: mat };
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-train'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    var lamps = carriage(g);
    PT.theme(THEME);
    zone(g, 'office', function (s) { PT.desk(s); PT.chair(s); });
    zone(g, 'shelf', function (s) { PT.bookshelf(s); });
    zone(g, 'cabinet', function (s) { PT.cabinet(s); });
    zone(g, 'sofa', function (s) { PT.bench(s); });
    PT.theme(null);

    /* the world outside slides past in -x; it lives in "world" (moved every frame), the far ranges in "far" */
    var world = new THREE.Group(), far = new THREE.Group(); holder.add(world); holder.add(far);
    var sleeper = rails(holder), S = sky(holder), CL = clouds(holder);
    var JKEY = 'minest.spatialHome.train.v1', live = {}, liveFar = {}, dist = 0, savedAt = 0;
    try { var jd = JSON.parse(localStorage.getItem(JKEY) || 'null'); if (jd && isFinite(jd.dist)) dist = jd.dist; } catch (e) {}
    function keepJourney() { try { localStorage.setItem(JKEY, JSON.stringify({ dist: Math.round(dist) })); } catch (e) {} }
    function keep() {
      var i0 = Math.floor((dist - 700) / L), i1 = Math.floor((dist + 2300) / L), n = 0;
      Object.keys(live).forEach(function (k) { var i = +k; if (i < i0 || i > i1) { SR.disposeTree(live[k]); delete live[k]; } });
      for (var i = i0; i <= i1; i++) if (!live[i] && n < 1) { var m = stretch(i); m.position.x = i * L; world.add(m); live[i] = m; n++; }   // at most one new stretch a frame
      var j0 = Math.floor((dist - 2500) / 2000), j1 = Math.floor((dist + 4500) / 2000);
      Object.keys(liveFar).forEach(function (k) { var j = +k; if (j < j0 || j > j1) { SR.disposeTree(liveFar[k]); delete liveFar[k]; } });
      for (var j = j0; j <= j1; j++) if (!liveFar[j] && n < 1) { var f = range(j); f.position.x = j * 2000; far.add(f); liveFar[j] = f; n++; }
    }
    /* first fill: everything near is there before the room is shown */
    for (var w0 = 0; w0 < 14; w0++) keep();

    var hemi = new THREE.HemisphereLight(0xe6f0fb, 0x5b6a4a, 0.85); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d6, 1.0); sun.position.set(-3, 7, -5); sun.target.position.set(0, 0.3, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 22;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var lamp1 = new THREE.PointLight(0xffd9a0, 0.3, 7, 2); lamp1.position.set(-3.5, 2.2, 0); holder.add(lamp1);
    var lamp2 = new THREE.PointLight(0xffd9a0, 0.3, 7, 2); lamp2.position.set(1.5, 2.2, 0); holder.add(lamp2);
    var lamp3 = new THREE.PointLight(0xffd9a0, 0.25, 6, 2); lamp3.position.set(4.6, 2.2, 0); holder.add(lamp3);
    scene.fog = new THREE.Fog(0xd6e6f2, 900, 4800); scene.background = null;

    var mode = 'auto', lastApply = -99, last = 0, tunnelK = 0, base = { sun: 1, hemi: 0.85, lamp: 0.3 }, fogFar = 4800, horC = new THREE.Color();
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var T = SR.timeOfDay(mode), Lt = T.light, K = T.dusk, N = T.night;
      var top = c3('#0a1430', '#4f94dd', Lt), hor = c3('#1f2b4a', '#d6e8f7', Lt); top.lerp(new THREE.Color('#5a5e9a'), K * 0.4); hor.lerp(new THREE.Color('#f2b08f'), K * 0.7);
      S.set(top, hor); horC.copy(hor);
      base.sun = 0.12 + 1.0 * Lt; sun.color.copy(c3('#8fa4ff', '#fff3dc', Lt)).lerp(new THREE.Color('#ff9a6b'), K * 0.7);
      base.hemi = 0.3 + 0.55 * Lt; hemi.color.copy(c3('#4b5a86', '#e6f0fb', Lt));
      base.lamp = 0.25 + 0.55 * N; CL.mat.color.copy(c3('#2e3550', '#ffffff', Lt)).lerp(new THREE.Color('#ffc9ad'), K * 0.6);
    }
    apply();
    function inTunnel(X) { var i = Math.floor(X / L), m = live[i]; var tn = m && m.userData.tunnel; if (!tn) return 0; var a = (X - tn.a0) / 12, b = (tn.a1 - X) / 12; return Math.max(0, Math.min(1, a, b)); }
    return {
      id: 'train', name: 'Rocky Mountain Express · Banff', group: g, holder: holder, far: 6000, size: { W: LEN, D: WID, H: H },
      anchors: anchors(), start: { pos: [0.9, 1.5, 0.9], yaw: 0.35, pitch: -0.08 }, avatar: PT.avatar,
      desk: { pos: [0, 1.34, 0.08], look: [0, 1.2, -1.6] },
      solids: [[-1.1, -1.5, 1.1, -0.5], [-0.26, -0.45, 0.26, 0.08], [5.55, -0.75, 6, 0.75], [-6, -0.75, -5.45, 0.75], [-4.75, -1.6, -3.25, -1.05], [-2.7, -1.6, -2.5, 0.0], [3.35, -1.6, 4.35, -0.75], [2.8, 1.05, 4.9, 1.6]],
      setTime: function (m) { mode = m || 'auto'; apply(); },
      /* a very small sway: the camera feels the rails, the carriage and its things stay put */
      shake: function (t) { return { y: Math.sin(t * 7.3) * 0.0025 + Math.sin(t * 2.1) * 0.0015, roll: Math.sin(t * 1.3) * 0.0022 }; },
      tick: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        dist += SPEED * dt; world.position.x = -dist; far.position.x = -dist; keep();
        sleeper.offset.x = (dist / 0.7) % 1;
        CL.mesh.position.x = -((dist * 0.08) % 3000) + 1500;                  // clouds are far: they barely move
        if (t - lastApply > 20) { lastApply = t; apply(); }
        if (t - savedAt > 10) { savedAt = t; keepJourney(); }
        var tk = inTunnel(dist); tunnelK += (tk - tunnelK) * Math.min(1, dt * 3);
        sun.intensity = base.sun * (1 - 0.92 * tunnelK); hemi.intensity = base.hemi * (1 - 0.8 * tunnelK);
        var lp = base.lamp + 0.7 * tunnelK; lamp1.intensity = lp; lamp2.intensity = lp; lamp3.intensity = lp * 0.8; lamps.material.opacity = 0.5 + 0.5 * Math.min(1, lp);
        scene.fog.color.copy(horC).lerp(new THREE.Color('#1a1a1c'), tunnelK); scene.fog.far = fogFar - 4700 * tunnelK; scene.fog.near = 900 - 890 * tunnelK; S.mesh.visible = tunnelK < 0.98;
      },
      /* for tests and for "skip ahead": the route ahead, and jumping to a distance (the stretches rebuild) */
      route: function (n) { var i0 = Math.floor(dist / L), out = []; for (var i = i0; i < i0 + (n || 12); i++) out.push(i + ':' + kind(i)); return out; },
      jump: function (d) { dist = d; Object.keys(live).forEach(function (k) { SR.disposeTree(live[k]); delete live[k]; }); Object.keys(liveFar).forEach(function (k) { SR.disposeTree(liveFar[k]); delete liveFar[k]; }); for (var q = 0; q < 16; q++) keep(); world.position.x = -dist; far.position.x = -dist; },
      state: function () { var i = Math.floor(dist / L); return { dist: Math.round(dist), stretch: i, kind: kind(i), live: Object.keys(live).length, far: Object.keys(liveFar).length }; },
      dispose: function () { keepJourney(); SR.disposeTree(holder); scene.fog = null; }
    };
  }
  SR.register({ id: 'train', name: 'Rocky Mountain Express · Banff', zh: '班夫 · 落基山脉豪华列车', icon: '🚂', build: build });
})(window);
