/* Minest My World — Knowledge Train (prototype) · "Journey Through Knowledge"
   You sit by the window of a moving low-poly train. Each List is a railway line; its cards stand outside as billboards and
   buildings with murals; a stack starts at a little station. Tap something outside: the train eases to a stop with it framed
   in the window; tap it again to flip it to the meaning; ▶ (or a tap on the scenery) and the journey goes on.
   Reuses Knowledge Drive's data, billboard art and landscapes (rail-common.js). Cards are refs, never copied. */
(function () {
  'use strict';
  var K = window.KRail, T = window.THREE; if (!K || !T || window.MinestTrain) return;
  var STORE = 'minest.train.v1', LEAD = 140, SP = 54, TAIL = 80, VIEW = 380, CHUNK = 60, EYE_Y = 2.35, SEAT = -.9;
  var SPEEDS = [[9, 'Gentle'], [15, 'Express'], [24, 'Rapid']];
  var UP = new T.Vector3(0, 1, 0), clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc;
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
  function save(key, v) { try { var a = load(); a[key] = v; localStorage.setItem(STORE, JSON.stringify(a)); } catch (e) {} }

  function Train(opts) {
    var self = this, P = opts.provider || K.defaultProvider(), PL = K.plan(P, opts.source || { type: 'workspace' });
    if (!PL.roads.length) throw new Error('No cards to ride past'); PL.roads.forEach(function (r) { r.title = String(r.title).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '') || r.title; });
    var saved = opts.fresh ? {} : (load()[PL.key] || {}), seed = saved.seed != null ? saved.seed : K.hash(PL.key) % 100000;
    var st = { style: opts.style || saved.style || 'countryside', hist: [], speed: saved.speed != null ? saved.speed : 1, playing: true, v: 0, focus: null, anim: null };

    var root = document.createElement('div'); root.className = 'kt-root';
    root.innerHTML = '<canvas class="kt-gl"></canvas>' +
      '<div class="kt-top"><div class="kt-line"><i></i><span><b></b><small></small></span></div><button type="button" class="kt-b" data-kt="exit" aria-label="Exit">✕</button></div>' +
      '<div class="kt-toast"></div>' +
      '<div class="kt-bar"><button type="button" class="kt-b kt-play" data-kt="play"></button><button type="button" class="kt-b" data-kt="station" title="Next Station">⏭ <span>Next Station</span></button>' +
      '<button type="button" class="kt-b" data-kt="map" title="Journey Map">🗺 <span>Map</span></button><button type="button" class="kt-b kt-sg" data-kt="suggest"></button><button type="button" class="kt-b" data-kt="prevstyle" title="Previous scenery">↺</button><button type="button" class="kt-b kt-sp" data-kt="speed"></button></div>' +
      '<div class="kt-map" hidden><div class="kt-mapcard"><div class="kt-maphead"><b>Journey Map</b><button type="button" class="kt-b" data-kt="map">✕</button></div><div class="kt-mapbody"></div></div></div>';
    (opts.container || document.body).appendChild(root);
    var $ = function (s) { return root.querySelector(s); }, cvs = $('.kt-gl');

    var dpr = Math.min(window.devicePixelRatio || 1, 2), R = new T.WebGLRenderer({ canvas: cvs, antialias: dpr < 2 }); R.setPixelRatio(dpr);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(55, 1, .2, 700), hemi = new T.HemisphereLight('#fff', '#888', .8), sun = new T.DirectionalLight('#fff', 1); scene.add(hemi, sun, sun.target);
    var skyGeo = new T.SphereGeometry(560, 18, 12), sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; scene.add(sky);
    var ground = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshStandardMaterial({ roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    var world = new T.Group(); scene.add(world);
    var mats = { bed: new T.MeshStandardMaterial({ color: '#8a8478', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }), rail: new T.MeshStandardMaterial({ color: '#b9bcc2', metalness: .4, roughness: .5 }),
      water: new T.MeshStandardMaterial({ color: '#2f8fc4', roughness: .3, flatShading: true }), plat: new T.MeshStandardMaterial({ color: '#cfc8bb', flatShading: true }), pole: new T.MeshStandardMaterial({ color: '#59606a', flatShading: true }) };

    // ---------------- the carriage: its own camera, so focusing never moves the window
    var inside = new T.Scene(), icam = new T.PerspectiveCamera(50, 1, .05, 10), car = new T.Group(); inside.add(car);
    inside.add(new T.HemisphereLight('#fff1dc', '#5a4636', .95)); var il = new T.DirectionalLight('#ffe2b8', .55); il.position.set(1, 1, .5); inside.add(il);
    var wallM = new T.MeshStandardMaterial({ color: '#eadfca', flatShading: true, roughness: .9 }), woodM = new T.MeshStandardMaterial({ color: '#7a5537', flatShading: true, roughness: .7 }),
      darkM = new T.MeshStandardMaterial({ color: '#3b2c22', flatShading: true }), clothM = new T.MeshStandardMaterial({ color: '#8f2f3a', flatShading: true, roughness: 1 }), seatM = new T.MeshStandardMaterial({ color: '#2f4f7a', flatShading: true, roughness: 1 });
    function rrShape(w, h, r, cx, cy) { var s = new T.Shape(), x = cx - w / 2, y = cy - h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
    var hole = { w: 1, h: 1, cy: 0 };
    function buildCarriage(w, h) {
      car.children.slice().forEach(function (o) { car.remove(o); if (o.geometry) o.geometry.dispose(); });
      icam.aspect = w / h; icam.updateProjectionMatrix();
      var vh = 2 * Math.tan(T.MathUtils.degToRad(25)), vw = vh * icam.aspect, narrow = w / h < 1;
      hole.w = vw * (narrow ? .9 : .74); hole.h = vh * (narrow ? .56 : .6); hole.cy = vh * (narrow ? .1 : .07);
      var wall = new T.Shape(); wall.moveTo(-vw, -vh); wall.lineTo(vw, -vh); wall.lineTo(vw, vh); wall.lineTo(-vw, vh); wall.lineTo(-vw, -vh);
      var r = Math.min(hole.w, hole.h) * .12; wall.holes.push(rrShape(hole.w, hole.h, r, 0, hole.cy));
      var wm = new T.Mesh(new T.ShapeGeometry(wall, 10), wallM); wm.position.z = -1; car.add(wm);
      // wood panelling below the window
      var low = new T.Mesh(new T.PlaneGeometry(vw * 2, vh * .5), woodM); low.position.set(0, hole.cy - hole.h / 2 - vh * .25 - .005, -.999); car.add(low);
      // the frame: a ring around the hole
      var ring = rrShape(hole.w + vh * .05, hole.h + vh * .05, r * 1.15, 0, hole.cy); ring.holes.push(rrShape(hole.w, hole.h, r, 0, hole.cy));
      var fr = new T.Mesh(new T.ExtrudeGeometry(ring, { depth: .03, bevelEnabled: true, bevelThickness: .008, bevelSize: .006, bevelSegments: 1, curveSegments: 6 }), woodM); fr.position.z = -.99; car.add(fr);
      // the table under the window, a cup and a little book
      var ty = hole.cy - hole.h / 2 - vh * .03, table = new T.Mesh(new T.BoxGeometry(hole.w * .62, vh * .025, .42), woodM); table.position.set(0, ty, -.8); table.rotation.x = .38; car.add(table);
      var cup = new T.Mesh(new T.CylinderGeometry(.022, .018, .05, 8), new T.MeshStandardMaterial({ color: '#f4efe6', flatShading: true })); cup.position.set(hole.w * .17, ty + .05, -.8); car.add(cup);
      var book = new T.Mesh(new T.BoxGeometry(.11, .016, .08), clothM); book.position.set(-hole.w * .16, ty + .03, -.78); book.rotation.y = .3; car.add(book);
      // curtains, the seat back, the luggage rack
      [-1, 1].forEach(function (sd) { for (var i = 0; i < 3; i++) { var c = new T.Mesh(new T.BoxGeometry(vw * .035, hole.h * 1.12, .02), clothM); c.position.set(sd * (hole.w / 2 + vw * (.01 + i * .028)), hole.cy, -.96 + i * .004); c.rotation.y = sd * (i % 2 ? .25 : -.2); car.add(c); } });
      var seat = new T.Mesh(new T.BoxGeometry(vw * .2, vh * .5, .1), seatM); seat.position.set(-vw / 2 - vw * .02, -vh * .32, -.7); seat.rotation.z = -.08; car.add(seat);
      var rack = new T.Mesh(new T.BoxGeometry(vw * 2, vh * .03, .05), darkM); rack.position.set(0, vh / 2 - vh * .06, -.95); car.add(rack);
      var glass = new T.Mesh(new T.PlaneGeometry(hole.w, hole.h), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .05, depthWrite: false })); glass.position.set(0, hole.cy, -1.001); car.add(glass);
      root.style.setProperty('--kt-win-bottom', ((1 - ((hole.cy - hole.h / 2) / vh + .5)) * 100).toFixed(1) + '%');
    }

    function applyStyle() {
      var S = K.styleById(st.style), c0 = new T.Color(S.sky[0]), c1 = new T.Color(S.sky[1]), c2 = new T.Color(S.sky[2]), pos = skyGeo.attributes.position, col = [];
      for (var i = 0; i < pos.count; i++) { var y = pos.getY(i) / 560, c = new T.Color(); if (y < 0) c.copy(c2); else if (y < .28) c.copy(c2).lerp(c1, y / .28); else c.copy(c1).lerp(c0, Math.min(1, (y - .28) / .5)); col.push(c.r, c.g, c.b); }
      skyGeo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      scene.fog = new T.Fog(S.fog, 90, VIEW + 60); scene.background = new T.Color(S.fog);
      hemi.color.set(S.hemi[0]); hemi.groundColor.set(S.hemi[1]); hemi.intensity = S.hemi[2]; sun.color.set(S.sun[0]); sun.intensity = S.sun[1]; sun.userData.dir = new T.Vector3().fromArray(S.sun[2]).normalize();
      ground.material.color.set(S.ground); $('.kt-sg').innerHTML = S.icon + ' <span>Scenic</span>'; $('.kt-sg').title = S.name + ' · Scenic Suggest';
    }

    // ---------------- the line: one track segment per List, joined end to end (Smart order, deterministic from the seed)
    var segs = [], segN = 0;
    function makeSeg(li, start, dir, g0) {
      var line = PL.roads[li], k = segN++, r = K.rng(K.hash(seed + ':t:' + line.id + ':' + k)), pts = [start.clone()], p = start.clone(), h0 = Math.atan2(dir.x, dir.z), h = h0;
      var need = LEAD + line.items.length * SP + TAIL, got = 0;
      while (got < need + 60) { h = clamp(h + (r() - .5) * .36, h0 - .7, h0 + .7); var stp = 50 + r() * 20; p = p.clone().add(new T.Vector3(Math.sin(h), 0, Math.cos(h)).multiplyScalar(stp)); pts.push(p); got += stp; }
      var curve = new T.CatmullRomCurve3(pts, false, 'centripetal'); curve.arcLengthDivisions = pts.length * 24;
      var seg = { k: k, li: li, curve: curve, lenAll: curve.getLength(), len: need, g0: g0, group: new T.Group(), chunks: {}, stops: [], tex: [] };
      line.items.forEach(function (it, i) { seg.stops.push({ ref: it.ref, i: i, s: LEAD + i * SP, kind: it.sectionStart ? 'sign' : (i % 3 === 2 ? 'house' : 'board'), lat: -(12 + (i % 2) * 3.5), section: it.section, seg: seg }); });
      buildTrack(seg); world.add(seg.group); segs.push(seg); return seg;
    }
    function frame(seg, s, o) { var u = clamp(s / seg.lenAll, 0, 1); o = o || {}; o.p = seg.curve.getPointAt(u, o.p || new T.Vector3()); o.t = seg.curve.getTangentAt(u, o.t || new T.Vector3()).setY(0).normalize(); o.l = (o.l || new T.Vector3()).set(o.t.z, 0, -o.t.x); return o; }
    function ribbon(seg, s0, s1, a, b, y, step) {
      var n = Math.max(1, Math.ceil((s1 - s0) / step)), pos = [], idx = [], F = {};
      for (var i = 0; i <= n; i++) { frame(seg, s0 + (s1 - s0) * i / n, F); var A = F.p.clone().addScaledVector(F.l, a), B = F.p.clone().addScaledVector(F.l, b); pos.push(A.x, y, A.z, B.x, y, B.z); if (i) { var o = (i - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); } return g;
    }
    function place(obj, seg, s, lat, faceTrack) { var F = frame(seg, s, {}); obj.position.copy(F.p).addScaledVector(F.l, lat); if (faceTrack) { var lk = obj.position.clone().addScaledVector(F.l, lat < 0 ? 1 : -1).addScaledVector(F.t, -.18); obj.lookAt(lk.x, obj.position.y, lk.z); } return F; }
    function buildTrack(seg) {
      var L = seg.lenAll, line = PL.roads[seg.li];
      seg.group.add(new T.Mesh(ribbon(seg, 0, L, -2.6, 2.6, .03, 6), mats.bed));
      [-.75, .75].forEach(function (x) { var m = new T.Mesh(ribbon(seg, 0, L, x - .06, x + .06, .16, 6), mats.rail); seg.group.add(m); });
      // the station where the line begins: platform, canopy, the line's name
      var pl = new T.Mesh(ribbon(seg, 20, 120, -3.2, -9, 1.05, 10), mats.plat); seg.group.add(pl);
      var edge = new T.Mesh(ribbon(seg, 20, 120, -3.2, -3.6, 1.07, 10), new T.MeshBasicMaterial({ color: '#f2c94c' })); seg.group.add(edge);
      for (var s = 30; s <= 110; s += 20) { var po = new T.Mesh(new T.BoxGeometry(.25, 3.2, .25), mats.pole); place(po, seg, s, -8, false); po.position.y = 2.6; seg.group.add(po); }
      var roof = new T.Mesh(ribbon(seg, 22, 118, -2.8, -9.4, 4.2, 10), new T.MeshStandardMaterial({ color: line.color, flatShading: true, side: T.DoubleSide })); seg.group.add(roof);
      var tx = K.signTex([line.title, (seg.li + 1) + ' · ' + line.region + ' · ' + line.items.length + ' stops'], '#1d2a44', '#ffffff', 768, 200); seg.tex.push(tx);
      var sg = new T.Mesh(new T.PlaneGeometry(6.6, 1.7), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); place(sg, seg, 70, -7.6, true); sg.position.y = 3.1; seg.group.add(sg);
      seg.stationSign = sg;
    }
    function disposeSeg(seg) {
      Object.keys(seg.chunks).forEach(function (k) { dropChunk(seg, k); }); seg.stops.forEach(release);
      seg.group.traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); if (Object.values(mats).indexOf(o.material) < 0) o.material.dispose(); } }); seg.tex.forEach(function (t) { t.dispose(); });
      world.remove(seg.group); segs.splice(segs.indexOf(seg), 1);
    }

    // ---------------- outside the window: scenery with parallax (poles flick by, trees drift, hills crawl)
    function scatter(seg, ci) {
      var S = K.styleById(st.style), KT = K.kit(), r = K.rng(K.hash(seed + ':tc:' + seg.k + ':' + ci + ':' + S.id)), s0 = ci * CHUNK, s1 = Math.min(seg.lenAll, s0 + CHUNK), items = {}, F = {};
      function add(kind, s, lat, sc, tint, sy) { if (s > 15 && s < 125 && lat < 0 && lat > -14) return; frame(seg, s, F); var p = F.p.clone().addScaledVector(F.l, lat); (items[kind] = items[kind] || []).push([p.x, p.z, sc, r() * 6.28, tint, sy || 1, Math.atan2(F.t.x, F.t.z)]); }
      for (var s = s0; s < s1; s += 6) {
        if (s % 30 < 6) add('pole', s, -3.4, 1, null, -1);
        if (S.id === 'countryside') { if (r() < .3) add('round', s, -(9 + r() * 7), .7 + r() * .5, r() < .3 ? '#9fc46a' : null); if (r() < .4) add('round', s, -(20 + r() * 30), .9 + r() * .6, r() < .3 ? '#e0b060' : null); if (r() < .45) add('field', s, -(24 + r() * 70), 0, ['#d9b860', '#9fbf5a', '#c99b5a', '#b9c96a'][(r() * 4) | 0]); if (r() < .06) add('house', s, -(30 + r() * 40), 1); if (r() < .1) add('hill', s, -(170 + r() * 160), 50 + r() * 60, ['#6f8c4a', '#7c9550', '#8a9a5a'][(r() * 3) | 0], .4 + r() * .5); }
        else if (S.id === 'coastal') { if (r() < .25) add('bush', s, -(9 + r() * 5), .7, '#a8c47a'); if (r() < .35) add('palm', s, -(18 + r() * 6), .9 + r() * .4); if (r() < .2) add('rock', s, -(30 + r() * 6), .8 + r() * 1.5); if (r() < .05) add('hill', s, -(260 + r() * 120), 40 + r() * 50, '#9fb0a0', .3 + r() * .2); }
        else if (S.id === 'forest') { add('pine', s + r() * 4, -(18 + r() * 8), .9 + r() * .7); if (r() < .8) add('pine', s, -(26 + r() * 40), 1 + r()); if (r() < .1) add('hill', s, -(150 + r() * 120), 60 + r() * 50, '#3e5a34', .6 + r() * .4); }
        else { if (s % 12 < 6) { add('bldg', s + 3, -(22 + r() * 6), 0, ['#c9c4cf', '#b8c3d6', '#d8c9b5', '#a9b1c2'][(r() * 4) | 0], 1); if (r() < .9) add('bldg', s + 3, -(45 + r() * 30), 0, ['#9aa4bb', '#c0b3c8', '#8e98ad'][(r() * 3) | 0], 2); } }
        if (r() < .25) add('bush', s, -(6 + r() * 4), .6 + r() * .4, '#6f9a4a');
      }
      var g = new T.Group(), m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), c = new T.Color();
      Object.keys(items).forEach(function (kind) {
        var list = items[kind], kk = KT[kind], im = new T.InstancedMesh(kk.geo, kk.mat, list.length);
        list.forEach(function (it, i) {
          if (kind === 'bldg') { var big = it[5] === 2, w = big ? 14 + r() * 10 : 9 + r() * 6; sc.set(w, big ? 22 + r() * 40 : 10 + r() * 16, w * .9); q.setFromAxisAngle(UP, it[6]); }
          else if (kind === 'field') { sc.set(16 + r() * 26, 1, 12 + r() * 20); q.setFromAxisAngle(UP, it[3]); }
          else if (kind === 'hill') { sc.set(it[2] * 2, it[2] * it[5], it[2] * 2); q.setFromAxisAngle(UP, it[3]); }
          else if (kind === 'pole') { sc.set(1, 1, 1); q.setFromAxisAngle(UP, it[6] + Math.PI); }
          else { sc.setScalar(it[2]); q.setFromAxisAngle(UP, it[3]); }
          v.set(it[0], 0, it[1]); m.compose(v, q, sc); im.setMatrixAt(i, m);
          c.set(it[4] || '#ffffff'); im.setColorAt(i, c);
        });
        if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im);
      });
      if (S.id === 'coastal') { g.add(new T.Mesh(ribbon(seg, Math.max(0, s0 - 2), s1 + 2, -38, -420, .05, 12), mats.water)); }
      return g;
    }
    function dropChunk(seg, k) { var g = seg.chunks[k]; if (!g) return; g.traverse(function (o) { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); }); world.remove(g); delete seg.chunks[k]; }
    function manageChunks(g) {
      segs.forEach(function (seg) { var a = g - seg.g0 - 80, b = g - seg.g0 + VIEW, n = Math.ceil(seg.lenAll / CHUNK);
        for (var ci = 0; ci < n; ci++) { var s0 = ci * CHUNK, want = s0 + CHUNK > a && s0 < b && s0 < seg.len + 20; if (want && !seg.chunks[ci]) { seg.chunks[ci] = scatter(seg, ci); world.add(seg.chunks[ci]); } else if (!want && seg.chunks[ci]) dropChunk(seg, ci); } });
    }

    // ---------------- knowledge nodes: billboards and houses with a mural (the card's art), pooled
    var picks = [], texCache = new Map(), houseGeo = (function () { var G = new T.BoxGeometry(7, 5.2, 6); G.translate(0, 2.6, 0); return G; })(), roofGeo = new T.ConeGeometry(5.6, 2.6, 4);
    var houseM = new T.MeshStandardMaterial({ color: '#efe3cf', flatShading: true }), roofM = new T.MeshStandardMaterial({ color: '#b5533c', flatShading: true }), frameM = new T.MeshStandardMaterial({ color: '#e9e4da', flatShading: true }), postM = mats.pole;
    function makeNode(kind) {
      var g = new T.Group(), face = new T.Group(), W = kind === 'house' ? 5.4 : 5.5, H = kind === 'house' ? 3.4 : 3.44, y = kind === 'house' ? 2.6 : 4.4;
      if (kind === 'house') { var hb = new T.Mesh(houseGeo, houseM), rf = new T.Mesh(roofGeo, roofM); rf.position.y = 6.5; rf.rotation.y = Math.PI / 4; g.add(hb, rf); face.position.set(0, y, 3.02); }
      else { var f = new T.Mesh(new T.BoxGeometry(W + .4, H + .4, .3), kind === 'sign' ? new T.MeshStandardMaterial({ color: '#2d5ea8', flatShading: true }) : frameM); face.add(f); face.position.y = y; [-1.8, 1.8].forEach(function (x) { var p = new T.Mesh(new T.BoxGeometry(.28, y - H / 2, .28), postM); p.position.set(x, (y - H / 2) / 2, 0); g.add(p); }); }
      var front = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ color: '#ccc', toneMapped: false })), back = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ color: '#f6f1e6', toneMapped: false }));
      front.position.z = .17; back.position.z = -.17; back.rotation.y = Math.PI; face.add(front, back); g.add(face);
      g.userData = { face: face, front: front, back: back, kind: kind }; front.userData.kind = back.userData.kind = 'stop'; return g;
    }
    var pools = { board: [], house: [], sign: [] };
    function attach(sp) {
      var n = pools[sp.kind].pop() || makeNode(sp.kind); sp.node = n; n.userData.front.userData.stop = n.userData.back.userData.stop = sp; n.userData.face.rotation.y = 0; sp.flip = 0; n.scale.setScalar(1);
      place(n, sp.seg, sp.s, sp.kind === 'house' ? sp.lat - 4 : sp.lat, true); world.add(n); picks.push(n.userData.front, n.userData.back);
      var I = K.info(P, sp.ref); sp.I = I; if (!I) { n.visible = false; return; } n.visible = true;
      var key = I.ref.id + ':' + I.sig, hit = texCache.get(key), fm = n.userData.front.material; fm.color.set(PL.roads[sp.seg.li].color);
      (hit ? Promise.resolve(hit) : K.loadImg(I.img).then(function (im) { var t = K.drawBoard(I, 'near', im, PL.roads[sp.seg.li].color); texCache.set(key, t); if (texCache.size > 36) { var k0 = texCache.keys().next().value, t0 = texCache.get(k0); texCache.delete(k0); if (!segs.some(function (s) { return s.stops.some(function (x) { return x.node && x.node.userData.front.material.map === t0; }); })) t0.dispose(); } return t; }))
        .then(function (t) { if (sp.node === n) { fm.map = t; fm.color.set('#ffffff'); fm.needsUpdate = true; } });
    }
    function release(sp) { var n = sp.node; if (!n) return; world.remove(n); [n.userData.front, n.userData.back].forEach(function (o) { var i = picks.indexOf(o); if (i >= 0) picks.splice(i, 1); }); n.userData.front.material.map = null; var bm = n.userData.back.material; if (bm.map) { bm.map.dispose(); bm.map = null; } pools[n.userData.kind].push(n); sp.node = null; }
    function manageNodes(g) { segs.forEach(function (seg) { seg.stops.forEach(function (sp) { var d = seg.g0 + sp.s - g, want = d > -70 && d < VIEW - 20; if (want && !sp.node) attach(sp); else if (!want && sp.node && sp !== st.focus) release(sp); }); }); }

    // ---------------- motion
    var pos = { seg: null, s: 0 }, F = {}, look = new T.Vector3(), lookTo = new T.Vector3(), fov = 55, baseFov = 55;
    function gNow() { return pos.seg.g0 + pos.s; }
    function segAt(g) { for (var i = 0; i < segs.length; i++) if (g < segs[i].g0 + segs[i].len) return segs[i]; return segs[segs.length - 1]; }
    function ensureAhead() {
      var last = segs[segs.length - 1];
      if (gNow() + VIEW + 60 > last.g0 + last.len) { var Fe = frame(last, last.len, {}); makeSeg((last.li + 1) % PL.roads.length, Fe.p.clone(), Fe.t.clone(), last.g0 + last.len); }
      while (segs.length > 1 && segs[0] !== pos.seg && segs[0].g0 + segs[0].len < gNow() - 120) disposeSeg(segs[0]);
    }
    function goTo(g, dur, then) { st.anim = { from: gNow(), to: g, t: 0, dur: dur, then: then }; }

    // ---------------- Window Focus: the train eases to a stop with the node framed in the window
    function focus(sp) {
      if (!sp || !sp.node || !sp.I) return; unfocus(); st.focus = sp; st.wasPlaying = st.playing; hap();
      var g = gNow(), target = sp.seg.g0 + sp.s - 3; if (target < g) target = g + Math.min(8, st.v * .7);
      goTo(target, clamp((target - g) / Math.max(5, st.v || 8) * 1.6, .8, 4), function () { st.playing = false; playLabel(); toast('Tap it to flip · ▶ journey on'); });
      var bm = sp.node.userData.back.material; if (bm.map) bm.map.dispose(); bm.map = K.drawBack(sp.I, PL.roads[sp.seg.li].color); bm.color.set('#ffffff'); bm.needsUpdate = true;
    }
    function unfocus() { var sp = st.focus; if (sp) sp.flip = 0; st.focus = null; }
    function resume() { if (!st.focus) return; unfocus(); st.playing = true; playLabel(); }

    // ---------------- HUD
    var toastT = 0;
    function toast(t) { var e = $('.kt-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 2000); }
    function hap() { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }
    function playLabel() { var b = $('.kt-play'); b.innerHTML = st.playing ? '⏸ <span>Pause</span>' : '▶ <span>Journey</span>'; b.title = st.playing ? 'Pause (Space)' : 'Auto Journey (Space)'; }
    function speedLabel() { $('.kt-sp').textContent = SPEEDS[st.speed][1]; }
    function hud() {
      var line = PL.roads[pos.seg.li], passed = pos.seg.stops.filter(function (sp) { return sp.s < pos.s + 2; }).length, nx = pos.seg.stops.filter(function (sp) { return sp.s > pos.s + 6; })[0];
      $('.kt-line i').style.background = line.color; $('.kt-line b').textContent = line.title + ' Line';
      $('.kt-line small').textContent = passed + '/' + line.items.length + (nx && nx.I ? ' · next: ' + nx.I.title : nx ? '' : ' · next station: ' + PL.roads[(pos.seg.li + 1) % PL.roads.length].title);
    }
    function journeyMap() {
      var m = $('.kt-map'); if (!m.hidden) { m.hidden = true; return; }
      var cur = pos.seg.li;
      $('.kt-mapbody').innerHTML = PL.roads.map(function (r, i) {
        var here = i === cur, n = r.items.length, done = here ? pos.seg.stops.filter(function (sp) { return sp.s < pos.s + 2; }).length : 0;
        return '<div class="kt-ml' + (here ? ' here' : '') + '" style="--c:' + r.color + '"><button type="button" data-kt="go" data-li="' + i + '"><b>' + esc(r.title) + ' Line</b><small>' + esc(r.region) + ' · ' + n + ' stops' + (here ? ' · you are here' : '') + '</small></button>' +
          '<div class="kt-track">' + r.items.slice(0, 40).map(function (it, j) { return '<i class="' + (here && j < done ? 'past' : '') + (here && j === done ? ' now' : '') + (it.sectionStart ? ' sec' : '') + '"></i>'; }).join('') + '</div></div>';
      }).join('');
      m.hidden = false;
    }
    function travelTo(li) {   // Next Station / Journey Map: glide to the station of that line
      unfocus(); $('.kt-map').hidden = true;
      var seg = segs.filter(function (s) { return s.li === li && s.g0 + 60 > gNow(); })[0];
      if (!seg) { segs.slice().forEach(function (s) { if (s !== pos.seg) disposeSeg(s); }); var Fe = frame(pos.seg, pos.seg.len, {}); seg = makeSeg(li, Fe.p.clone(), Fe.t.clone(), pos.seg.g0 + pos.seg.len); }
      var g = seg.g0 + 60; toast('🚉 ' + PL.roads[li].title + ' Line'); st.playing = true; playLabel();
      goTo(g, clamp((g - gNow()) / 60, 1.6, 4.5));
    }

    // ---------------- input
    var down = null, ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(x, y) { var r = cvs.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); var h = ray.intersectObjects(picks, false)[0]; return h ? h.object : null; }
    cvs.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cvs.addEventListener('pointerup', function (e) {
      if (!down) return; var mv = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null; if (mv > 10 || dt > 600) return;
      var o = pickAt(e.clientX, e.clientY);
      if (o && o.userData.stop === st.focus && !st.anim) { st.focus.flip = st.focus.flip ? 0 : 1; hap(); return; }
      if (o) return focus(o.userData.stop);
      if (st.focus) resume();
    });
    cvs.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') cvs.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : ''; });
    function act(k, el) {
      if (k === 'exit') return self.close();
      if (k === 'play') { if (st.focus) return resume(); st.playing = !st.playing; playLabel(); }
      else if (k === 'station') travelTo((pos.seg.li + 1) % PL.roads.length);
      else if (k === 'map') journeyMap();
      else if (k === 'go') travelTo(+el.dataset.li);
      else if (k === 'speed') { st.speed = (st.speed + 1) % SPEEDS.length; speedLabel(); }
      else if (k === 'suggest') { st.hist.push(st.style); var i = K.STYLES.findIndex(function (s) { return s.id === st.style; }); setStyle(K.STYLES[(i + 1) % K.STYLES.length].id); }
      else if (k === 'prevstyle') { if (st.hist.length) setStyle(st.hist.pop()); }
      hap(); persist();
    }
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-kt]'); if (b) { e.preventDefault(); act(b.dataset.kt, b); } });
    function onKey(e) {
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); if (!$('.kt-map').hidden) return journeyMap(); if (st.focus) return resume(); return self.close(); }
      var m = { ' ': 'play', n: 'station', N: 'station', m: 'map', M: 'map', l: 'suggest', L: 'suggest', s: 'speed', S: 'speed' }[k];
      if ((k === 'f' || k === 'F') && st.focus) { st.focus.flip = st.focus.flip ? 0 : 1; return; }
      if (k === 'Enter') { var nx = null, g = gNow(); segs.forEach(function (s) { s.stops.forEach(function (sp) { var d = s.g0 + sp.s - g; if (sp.node && d > 8 && (!nx || d < nx.d)) nx = { sp: sp, d: d }; }); }); if (nx) focus(nx.sp); return; }
      if (m) { e.preventDefault(); act(m); }
    }
    window.addEventListener('keydown', onKey);
    function setStyle(id) { st.style = id; applyStyle(); segs.forEach(function (s) { Object.keys(s.chunks).forEach(function (k) { dropChunk(s, k); }); }); toast(K.styleById(id).icon + ' ' + K.styleById(id).name); }
    function persist() { if (pos.seg) save(PL.key, { li: PL.roads[pos.seg.li].id, s: Math.round(pos.s), seed: seed, style: st.style, speed: st.speed }); }

    // ---------------- loop
    var raf = 0, last = 0, mg = 0, ht = 0, sv = 0, alive = true, W = 1, H = 1;
    var railSnd = window.MinestSfx ? MinestSfx.loop('rail') : null;   // wheels on the rail joints, a horn when the train sets off (sfx.js)
    function step(now) {
      raf = 0; if (!alive) return; schedule(); var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      if (st.anim) { var A = st.anim; A.t += dt; var k = clamp(A.t / A.dur, 0, 1), g = lerp(A.from, A.to, ease(k)), ps = gNow(); pos.seg = segAt(g); pos.s = g - pos.seg.g0; st.v = Math.abs(gNow() - ps) / Math.max(dt, 1e-3); if (k >= 1) { st.anim = null; if (A.then) A.then(); } }
      else { var tv = st.playing ? SPEEDS[st.speed][0] : 0; st.v = lerp(st.v, tv, 1 - Math.exp(-dt * (tv > st.v ? .5 : 1.6))); if (st.v < .05 && !tv) st.v = 0; if (railSnd) railSnd.set(st.v / SPEEDS[SPEEDS.length - 1][0]); pos.s += st.v * dt; while (pos.s > pos.seg.len) { var i = segs.indexOf(pos.seg), nx = segs[i + 1]; if (!nx) { ensureAhead(); nx = segs[i + 1]; } if (!nx) break; pos.s -= pos.seg.len; pos.seg = nx; toast('🚉 ' + PL.roads[nx.li].title + ' Line'); } }
      ensureAhead();
      frame(pos.seg, pos.s, F);
      var eye = F.p.clone().addScaledVector(F.l, SEAT); eye.y = EYE_Y + Math.sin(now / 170) * .006 * Math.min(1, st.v / 6) + Math.sin(now / 53) * .0025 * Math.min(1, st.v / 10);   // the gentle rattle of the rails
      cam.position.copy(eye);
      var fs = st.focus;
      if (fs && fs.node) {
        fs.node.userData.front.getWorldPosition(lookTo);
        var dist = eye.distanceTo(lookTo), sz = 1.08, win = .36 * (W / H < 1 ? 1.2 : 1), want = clamp(T.MathUtils.radToDeg(Math.max(2 * Math.atan(3.44 * sz / win / 2 / dist), 2 * Math.atan(5.5 * sz / (W / H < 1 ? .62 : .46) / 2 / dist / cam.aspect))), 14, baseFov);
        fov = lerp(fov, want, 1 - Math.exp(-dt * 2.5)); fs.node.scale.setScalar(lerp(fs.node.scale.x, sz, 1 - Math.exp(-dt * 3)));
      } else {
        var d = F.l.clone().multiplyScalar(-Math.cos(.32)).addScaledVector(F.t, Math.sin(.32)); lookTo.copy(eye).addScaledVector(d, 30); lookTo.y = EYE_Y - .35;   // out of the window, a little ahead
        fov = lerp(fov, baseFov, 1 - Math.exp(-dt * 2));
      }
      segs.forEach(function (s) { s.stops.forEach(function (sp) { if (!sp.node) return; var fc = sp.node.userData.face, to = sp.flip ? Math.PI : 0; if (Math.abs(fc.rotation.y - to) > .001) fc.rotation.y = lerp(fc.rotation.y, to, 1 - Math.exp(-dt * 7)); if (sp !== fs && sp.node.scale.x !== 1) sp.node.scale.setScalar(Math.abs(sp.node.scale.x - 1) < .003 ? 1 : lerp(sp.node.scale.x, 1, 1 - Math.exp(-dt * 3))); }); });
      look.lerp(lookTo, 1 - Math.exp(-dt * (fs ? 2.6 : 4))); cam.lookAt(look);
      if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
      cam.setViewOffset(W, H, 0, (hole.cy / (2 * Math.tan(T.MathUtils.degToRad(25)))) * H, W, H);   // the view's centre sits in the window, not the screen
      sky.position.copy(eye); ground.position.set(eye.x, 0, eye.z); var sd = sun.userData.dir; sun.position.copy(eye).addScaledVector(sd, 100); sun.target.position.copy(eye);
      mg += dt; if (mg > .2) { mg = 0; manageChunks(gNow()); manageNodes(gNow()); }
      ht += dt; if (ht > .3) { ht = 0; hud(); }
      sv += dt; if (sv > 2) { sv = 0; persist(); }
      R.autoClear = true; R.render(scene, cam); R.autoClear = false; R.clearDepth(); R.render(inside, icam); R.autoClear = true;
    }
    function schedule() { if (!raf && alive && !document.hidden) raf = requestAnimationFrame(step); }
    function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; persist(); } else { last = 0; schedule(); } }
    document.addEventListener('visibilitychange', onVis);
    function resize() { var r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); R.setSize(W, H, false); cam.aspect = W / H; baseFov = clamp(2 * T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(70) / 2) / cam.aspect)), 48, 80); if (!st.focus) fov = baseFov; cam.fov = fov; cam.updateProjectionMatrix(); buildCarriage(W, H); root.classList.toggle('narrow', W < 600); }
    var ro = new ResizeObserver(resize); ro.observe(root);

    applyStyle(); playLabel(); speedLabel();
    var startLi = PL.start, startS = 40; if (saved.li) PL.roads.forEach(function (r, i) { if (r.id === saved.li) { startLi = i; startS = saved.s || 40; } });
    pos.seg = makeSeg(startLi, new T.Vector3(), new T.Vector3(0, 0, -1), 0); pos.s = clamp(startS, 0, pos.seg.len - 5);
    resize(); frame(pos.seg, pos.s, F); look.copy(F.p).addScaledVector(F.l, -30); ensureAhead(); manageChunks(gNow()); manageNodes(gNow()); hud();
    toast(saved.li ? '↺ Resuming the ' + PL.roads[startLi].title + ' Line' : '🚆 ' + PL.roads[startLi].title + ' Line'); schedule();

    this.close = function () { if (!alive) return; if (railSnd) railSnd.stop(); persist(); alive = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); ro.disconnect(); segs.slice().forEach(disposeSeg); texCache.forEach(function (t) { t.dispose(); }); R.dispose(); root.remove(); if (opts.onExit) opts.onExit(); };
    this.state = function () { return { line: PL.roads[pos.seg.li].title, s: Math.round(pos.s), playing: st.playing, focus: st.focus && st.focus.I ? st.focus.I.title : null, flip: st.focus ? st.focus.flip : 0, style: st.style, nodes: picks.length / 2, segs: segs.length, fov: Math.round(cam.fov), dist: st.focus && st.focus.node ? Math.round(cam.position.distanceTo(st.focus.node.userData.front.getWorldPosition(new T.Vector3()))) : null }; };
    this.focusNext = function () { onKey({ key: 'Enter', preventDefault: function () {} }); };
    this.act = act;
    this._jump = function (d) { ensureAhead(); goTo(gNow() + d, .5); };   // testing
  }
  var CUR = null;
  window.MinestTrain = { open: function (o) { if (CUR) CUR.close(); CUR = new Train(o || {}); return CUR; }, current: function () { return CUR; } };
})();
