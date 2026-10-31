/* Minest My World — Museum Walkthrough (prototype): Walk → Discover → Focus → Read → Continue.
   Exhibition halls in a row, joined by short corridors, one hall per List (big Lists fill several). Each hall has a theme:
   🖼 Picture Gallery (framed pictures on the walls), 🗿 Sculpture Hall (plinths: a low-poly sculpture and the card as an index
   card), 🔎 Cabinet of Curiosities (glass vitrines with books and medals). Guided Tour walks the route slowly and stops at each
   exhibit; drag (or tap the floor) to walk freely; tap an exhibit to step up to it, tap again to pull it out (showcase-common.js's
   reader), tap to flip, tap outside to put it back, then Resume Tour carries on from where the tour was. Tour Map shows the halls,
   the route and where you are. Suggest re-themes the halls. Exhibits are built only in the hall you are in and its neighbours. */
(function () {
  'use strict';
  var X = window.KShow, K = window.KRail, T = window.THREE; if (!X || window.MinestMuseum) return;
  var clamp = K.clamp, lerp = K.lerp, esc = K.esc, PI = Math.PI;
  var W = 5, D = 10, CL = 3, DOOR = 1.2, HH = 4.6;   // hall half-width, hall depth, corridor length, door half-width, hall height
  var THEMES = [
    { id: 'gallery', name: '🖼 Picture Gallery', wall: '#2f4a3e', floor: '#7a5a3a', trim: '#c9a24a', ceil: '#1c2a24' },
    { id: 'sculpture', name: '🗿 Sculpture Hall', wall: '#e4ddd0', floor: '#a8a298', trim: '#8a8478', ceil: '#cfc8ba' },
    { id: 'cabinet', name: '🔎 Cabinet of Curiosities', wall: '#25324a', floor: '#5a3f2a', trim: '#c9a24a', ceil: '#141c2c' }];
  // slots in a hall (relative to its centre): walls first, then the middle; n = the way the exhibit faces
  var SLOTS = { L1: [-W, 3.3, 1, 0], L2: [-W, 1.1, 1, 0], L3: [-W, -1.1, 1, 0], L4: [-W, -3.3, 1, 0], R1: [W, 3.3, -1, 0], R2: [W, 1.1, -1, 0], R3: [W, -1.1, -1, 0], R4: [W, -3.3, -1, 0],
    B1: [-3.1, -D / 2, 0, 1], B2: [3.1, -D / 2, 0, 1], C1: [-1.7, .6, 0, 1], C2: [1.7, .6, 0, 1] };
  var PICK = ['L2', 'R2', 'B1', 'B2', 'C1', 'L3', 'R3', 'C2', 'L1', 'R1', 'L4', 'R4'], ROUTE = ['L1', 'L2', 'L3', 'L4', 'C1', 'C2', 'R1', 'R2', 'R3', 'R4', 'B2', 'B1'];
  var DB = X.store('minest.museum.v1');

  function Museum(opts) {
    var P = opts.provider || K.defaultProvider(), C = X.collect(P, opts.source || { type: 'workspace' }), saved = opts.fresh ? {} : DB.get(C.key);
    if (!C.all.length) throw new Error('No cards for the museum');
    var per = clamp(opts.perHall || 12, 1, 12), maxH = opts.maxHalls || 12, shift = saved.shift || 0;
    var S = X.stage({ cls: 'ku-root', container: opts.container, onExit: opts.onExit, hFov: 76, maxFov: 88, far: 90, hint: 'Tap to flip · tap outside to put it back',
      html: '<div class="kx-top"><div class="kx-pill"><i></i><span><b></b><small></small></span></div><div class="kx-tr"><button type="button" class="kx-b" data-kx="map" aria-label="Tour Map">🗺 <span>Map</span></button><button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button></div></div>' +
        '<div class="kx-bar"><button type="button" class="kx-b" data-kx="prev" aria-label="Previous exhibit">◀</button><button type="button" class="kx-b ku-tour" data-kx="tour"></button><button type="button" class="kx-b" data-kx="next" aria-label="Next exhibit">▶</button>' +
        '<button type="button" class="kx-b ku-resume" data-kx="resume" hidden>⟲ <span>Resume Tour</span></button><button type="button" class="kx-b" data-kx="suggest">✨ <span>Suggest</span></button></div>' +
        '<div class="kx-sheet" hidden><div class="kx-card"><div class="kx-head"><b>🗺 Tour Map</b><button type="button" class="kx-b" data-kx="map">✕</button></div><div class="kx-map"></div></div></div>' });
    var scene = S.scene, cam = S.cam, RD = X.reader(S);

    // ---------------- plan: List → hall(s) → exhibits in route order
    var halls = [], EX = [];
    C.groups.forEach(function (g) { for (var i = 0; i < g.items.length && halls.length < maxH && !(opts.onePerList && i); i += per) halls.push({ g: g, items: g.items.slice(i, i + per), part: i / per, parts: Math.ceil(g.items.length / per) }); });
    halls.forEach(function (h, k) {
      h.k = k; h.z0 = -k * (D + CL); h.cz = h.z0 - D / 2;
      var pics = h.items.filter(function (it) { return it.I.img; }).length, persons = h.items.filter(function (it) { return it.I.type === 'portrait'; }).length;
      h.smart = persons || pics >= h.items.length * .8 ? 0 : 1 + (k % 2);   // Smart: mostly pictures or people → gallery, otherwise cabinets / sculptures
      var used = PICK.slice(0, h.items.length), order = ROUTE.filter(function (s) { return used.indexOf(s) >= 0; });
      h.ex = order.map(function (slot, j) {
        var s = SLOTS[slot], n = new T.Vector3(s[2], 0, s[3]), e = { i: EX.length, hall: k, slot: slot, it: h.items[j], n: n, wallX: s[0], wallZ: h.cz + s[1] };
        EX.push(e); return e;
      });
    });
    var ZEND = halls[halls.length - 1].z0 - D;
    function theme(h) { return THEMES[(h.smart + shift) % THEMES.length]; }

    // ---------------- rooms: floors, walls with doorways, corridors, ceilings with a skylight, hall signs
    scene.background = new T.Color('#0d0c10'); scene.fog = new T.Fog('#0d0c10', 14, 42);
    var hemi = new T.HemisphereLight('#fff6e8', '#30281f', .7); scene.add(hemi); var sun = new T.DirectionalLight('#fff2dc', .5); sun.position.set(3, 9, 4); scene.add(sun);
    var lantern = new T.PointLight('#ffe6c4', .8, 12, 1.4); scene.add(lantern);
    var mStone = X.M('#3a3633', { roughness: .95 }), mDark = X.M('#1e1b1a'), mGlass = new T.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: .18, roughness: .05, metalness: .1, depthWrite: false }), mPlinth = X.M('#efeae0', { roughness: .6 });
    var mBeam = new T.MeshBasicMaterial({ color: '#fff3d6', transparent: true, opacity: .07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    var roomGroup = new T.Group(); scene.add(roomGroup); var floors = [];
    function box(w, h, d, m, x, y, z, parent) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (parent || roomGroup).add(o); return o; }
    function wallX(x0, x1, z, h, m, door, last) {   // a wall across the corridor axis, with a doorway in the middle unless last
      if (last || !door) return box(x1 - x0, h, .2, m, (x0 + x1) / 2, h / 2, z);
      box(-DOOR - x0, h, .2, m, (x0 - DOOR) / 2, h / 2, z); box(x1 - DOOR, h, .2, m, (x1 + DOOR) / 2, h / 2, z); box(DOOR * 2, h - 3, .2, m, 0, 3 + (h - 3) / 2, z);
    }
    function buildRooms() {
      roomGroup.children.slice().forEach(function (o) { roomGroup.remove(o); o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); }); floors = [];
      // the vestibule you start in
      var vf = box(DOOR * 2 + .4, .1, 3.6, mStone, 0, -.05, 1.8); floors.push(vf); box(.2, 3.2, 3.6, mDark, -DOOR - .1, 1.6, 1.8); box(.2, 3.2, 3.6, mDark, DOOR + .1, 1.6, 1.8); box(DOOR * 2 + .4, .2, 3.6, mDark, 0, 3.3, 1.8); box(DOOR * 2 + .4, 3.2, .2, mDark, 0, 1.6, 3.6);
      halls.forEach(function (h, k) {
        var th = theme(h), mW = X.M(th.wall, { roughness: .9 }), mF = X.M(th.floor, { roughness: .8 }), mT = X.M(th.trim, { metalness: .5, roughness: .4 }), mC = X.M(th.ceil, { roughness: 1 }), last = k === halls.length - 1;
        floors.push(box(W * 2, .1, D, mF, 0, -.05, h.cz)); box(W * 2, .2, D, mC, 0, HH, h.cz);
        var sky = new T.Mesh(new T.PlaneGeometry(W, D * .6), new T.MeshBasicMaterial({ color: '#fff8e8' })); sky.rotation.x = PI / 2; sky.position.set(0, HH - .11, h.cz); roomGroup.add(sky);
        box(.2, HH, D, mW, -W - .1, HH / 2, h.cz); box(.2, HH, D, mW, W + .1, HH / 2, h.cz);
        wallX(-W, W, h.z0, HH, mW, true, false); wallX(-W, W, h.z0 - D, HH, mW, true, last);
        box(W * 2, .12, .06, mT, 0, .06, h.z0 - D + .13); box(.06, .12, D, mT, -W + .03, .06, h.cz); box(.06, .12, D, mT, W - .03, .06, h.cz);   // skirting
        [h.z0, h.z0 - D].forEach(function (z, i) { if (i && last) return; box(.14, 3.06, .3, mT, -DOOR, 1.53, z); box(.14, 3.06, .3, mT, DOOR, 1.53, z); box(DOOR * 2 + .14, .14, .3, mT, 0, 3.06, z); });   // door frames
        var t = X.labelTex(['Hall ' + (k + 1) + ' · ' + h.g.title + (h.parts > 1 ? ' ' + (h.part + 1) + '/' + h.parts : ''), th.name.replace(/^\S+\s/, '') + ' · ' + h.items.length + ' exhibits'], '#1d1a17', th.id === 'sculpture' ? '#e8c878' : th.trim);
        var sign = new T.Mesh(new T.PlaneGeometry(2.4, .66), new T.MeshBasicMaterial({ map: t, toneMapped: false })); sign.position.set(0, 3.75, h.z0 + .12); roomGroup.add(sign);
        if (!last) { floors.push(box(DOOR * 2 + .4, .1, CL, mStone, 0, -.05, h.z0 - D - CL / 2)); box(.2, 3.2, CL, mDark, -DOOR - .1, 1.6, h.z0 - D - CL / 2); box(.2, 3.2, CL, mDark, DOOR + .1, 1.6, h.z0 - D - CL / 2); box(DOOR * 2 + .4, .2, CL, mDark, 0, 3.3, h.z0 - D - CL / 2); }
        if (th.id === 'gallery') box(1.7, .42, .5, X.M('#4a3020'), 0, .21, h.cz - 2.3);   // a bench in the middle
      });
    }

    // ---------------- exhibits (built per hall, near you)
    var SHAPES = [function () { return new T.IcosahedronGeometry(.34, 0); }, function () { return new T.DodecahedronGeometry(.32, 0); }, function () { return new T.OctahedronGeometry(.38, 0); }, function () { return new T.TorusKnotGeometry(.2, .07, 48, 6); }, function () { return new T.ConeGeometry(.3, .62, 6); }];
    var built = {}, picks = [];
    function buildHall(k) {
      if (built[k]) return; var h = halls[k], th = theme(h), list = built[k] = [];
      h.ex.forEach(function (e) {
        var g = new T.Group(), n = e.n, yaw = Math.atan2(n.x, n.z), col = e.it.g ? e.it.g.color : '#888', wall = /^[LRB]/.test(e.slot), base = new T.Vector3(e.wallX, 0, e.wallZ), obj, slide, look;
        g.userData.ex = e.i; scene.add(g); list.push(g);
        if (th.id === 'gallery') {
          var portrait = e.it.I.type === 'portrait', fw = portrait ? 1.1 : 1.6, fh = portrait ? 1.35 : 1;
          obj = X.carriers.frame(e.it, { w: fw, h: fh, frame: th.trim });
          if (wall) { obj.position.copy(base).addScaledVector(n, .06); obj.position.y = 1.75; }
          else { var st = box(fw + .4, 2.4, .1, X.M(th.wall), 0, 1.2, 0, g); st.position.copy(base); st.position.y = 1.2; st.rotation.y = yaw; obj.position.copy(base).addScaledVector(n, .1); obj.position.y = 1.75; }
          obj.rotation.y = yaw; slide = n.clone(); look = new T.Vector3(obj.position.x, 1.75, obj.position.z);
          var pl = X.carriers.plate(e.it); pl.position.copy(obj.position).addScaledVector(n, .01); pl.position.y = 1.75 - fh / 2 - .3; pl.rotation.y = yaw; g.add(pl);
        } else {
          var at = wall ? base.clone().addScaledVector(n, 1.05) : base.clone();
          if (th.id === 'sculpture') {
            var pli = box(.8, 1, .8, mPlinth, at.x, .5, at.z, g); pli.rotation.y = yaw;
            var sc = new T.Mesh(SHAPES[K.hash(e.it.ref.id) % SHAPES.length](), X.M(col, { metalness: .25, roughness: .45 })); sc.position.set(at.x, 1.42, at.z); sc.userData.spin = 1; g.add(sc);
            obj = X.carriers.index(e.it); obj.scale.setScalar(1.1); obj.position.copy(at).addScaledVector(n, .44); obj.position.y = .62; obj.rotation.y = yaw; slide = n.clone().multiplyScalar(.7).add(new T.Vector3(0, .5, 0)); look = new T.Vector3(at.x, 1.1, at.z);
          } else {
            var vb = box(.95, .85, .65, X.M('#5a3a22', { roughness: .7 }), at.x, .425, at.z, g); vb.rotation.y = yaw;
            var gl = box(.9, .62, .6, mGlass, at.x, 1.16, at.z, g); gl.rotation.y = yaw; gl.renderOrder = 2;
            var cap = box(.95, .04, .65, X.M(th.trim, { metalness: .5, roughness: .35 }), at.x, 1.49, at.z, g); cap.rotation.y = yaw;
            var asBook = e.it.I.type === 'book' || e.i % 2 === 0;
            if (asBook) { obj = X.carriers.book(e.it, { th: .1, h: .5, d: .36 }); obj.position.set(at.x, .86, at.z); obj.rotation.y = Math.atan2(-n.z, n.x); obj.rotation.z = 0; }   // cover (+x) towards you
            else { obj = X.carriers.badge(e.it); obj.scale.setScalar(.85); obj.position.set(at.x, .66, at.z); obj.rotation.y = yaw; }
            slide = new T.Vector3(0, 1, 0); look = new T.Vector3(at.x, 1.05, at.z);
          }
        }
        g.add(obj); e.obj = obj; e.slide = slide; e.look = look;
        var beam = new T.Mesh(new T.CylinderGeometry(.12, .85, HH - look.y + .2, 16, 1, true), mBeam); beam.position.set(look.x, (HH + look.y - .2) / 2, look.z); g.add(beam);   // a soft spotlight shaft
        g.traverse(function (o) { if (o.isMesh && o !== beam) { o.userData.ex = e.i; picks.push(o); } });
      });
    }
    function dropHall(k) {
      var list = built[k]; if (!list) return; if (RD.open && RD.item() && halls[k].ex.some(function (e) { return e.it === RD.item(); })) return;
      var keep = [mBeam, mGlass, mPlinth]; halls[k].ex.forEach(function (e) { if (e.obj && e.obj.userData.faceMat) keep.push(e.obj.userData.faceMat); });   // card art lives in the shared cache: never dispose it here
      list.forEach(function (g) { scene.remove(g); g.traverse(function (o) { if (o.isMesh) { var i = picks.indexOf(o); if (i >= 0) picks.splice(i, 1); o.geometry.dispose(); [].concat(o.material).forEach(function (m) { if (keep.indexOf(m) >= 0) { if (m !== mBeam && m !== mGlass && m !== mPlinth) m.dispose(); return; } if (m.map) m.map.dispose(); m.dispose(); }); } }); });
      halls[k].ex.forEach(function (e) { e.obj = null; }); delete built[k];
    }
    function hallAt(z) { for (var k = 0; k < halls.length; k++) if (z > halls[k].z0 - D - CL / 2) return k; return halls.length - 1; }
    function stream() { var hk = hallAt(cur.z); halls.forEach(function (h, k) { if (Math.abs(k - hk) <= 1) buildHall(k); else dropHall(k); }); }

    // ---------------- camera + movement (paths through doorways), free walk with walls
    var cur = { x: 0, y: 1.62, z: 2.6, yaw: 0, pitch: -.02 }, st = { tour: false, idx: saved.idx || 0, dwell: 0, path: null, final: null, arrive: null, focus: -1, wandered: false };
    if (saved.z != null) { cur.x = saved.x || 0; cur.z = saved.z; cur.yaw = saved.yaw || 0; st.wandered = true; }
    var want = { yaw: cur.yaw, pitch: cur.pitch };
    function inside(x, z) {
      if (z > 3.3 || z < ZEND + .5) return false; if (Math.abs(x) < DOOR - .35) return true;
      var k = hallAt(z), h = halls[k]; return z < h.z0 - .45 && z > h.z0 - D + .45 && Math.abs(x) < W - .45 && !blocked(x, z, k);
    }
    function blocked(x, z, k) { var th = theme(halls[k]); if (th.id === 'gallery') return false; return halls[k].ex.some(function (e) { if (/^[LRB]/.test(e.slot)) return false; return Math.abs(x - e.wallX) < .75 && Math.abs(z - e.wallZ) < .75; }); }
    function viewOf(e) {   // where to stand for an exhibit
      var dist = theme(halls[e.hall]).id === 'gallery' ? (e.it.I.type === 'portrait' ? 2.4 : 2.7) : 2.1, nar = S.W / S.H < .8, lk = e.look || new T.Vector3(e.wallX, 1.4, e.wallZ);
      dist += nar ? .6 : 0; var p = new T.Vector3(lk.x, 0, lk.z).addScaledVector(e.n, dist);
      return { x: p.x, z: p.z, yaw: Math.atan2(e.n.x, e.n.z), pitch: Math.atan2(lk.y - 1.62, dist) };
    }
    function route(x, z) {   // waypoints from where you are to (x, z): out of this hall's door, along corridors, into the target hall
      var a = hallAt(cur.z), b = hallAt(z), pts = [];
      if (a !== b) { var dir = b > a ? 1 : -1; for (var k = a; k !== b; k += dir) { var h = halls[k]; if (dir > 0) { pts.push({ x: 0, z: h.z0 - D + 1 }); pts.push({ x: 0, z: halls[k + 1].z0 - 1 }); } else { pts.push({ x: 0, z: h.z0 - 1 }); pts.push({ x: 0, z: halls[k - 1].z0 - D + 1 }); } } }
      else if (cur.z > halls[0].z0 - .3 && z < halls[0].z0) pts.push({ x: 0, z: halls[0].z0 - 1 });
      pts.push({ x: x, z: z }); return pts;
    }
    function goTo(x, z, final, then) { st.path = route(x, z); st.final = final || null; st.arrive = then || null; }
    function focusEx(i, then) {
      var e = EX[i]; if (!e) return; buildHall(e.hall); st.focus = i; var v = viewOf(e); goTo(v.x, v.z, v, then); ui();
    }
    function pullEx(i) {
      var e = EX[i]; if (!e || !e.obj) return; st.focus = i;
      RD.pull(e.obj, e.it, { slide: e.slide, dist: 1.8, onBack: function () { ui(); if (st.paused) S.toast('⟲ Resume Tour continues the visit'); } }); ui();
    }
    function startTour(fromHere) {
      RD.back(true); st.tour = true; st.paused = false; st.wandered = false; if (fromHere && st.focus >= 0) st.idx = st.focus; st.dwell = 0; focusEx(st.idx, arrived); ui();
      function arrived() { st.dwell = 4.2; }
    }
    function pauseTour() { if (st.tour) { st.tour = false; st.paused = true; } ui(); }
    function nextStop() { if (st.idx >= EX.length - 1) { st.tour = false; st.paused = false; ui(); return S.toast('🏁 End of the tour — thank you for visiting'); } st.idx++; focusEx(st.idx, function () { st.dwell = 4.2; }); }

    // ---------------- HUD + Tour Map
    function ui() {
      var e = st.focus >= 0 ? EX[st.focus] : null, at = e && (RD.open || near(e)), hk = at ? e.hall : hallAt(cur.z), h = halls[hk], th = theme(h);
      S.$('.kx-pill i').style.background = h.g.color;
      S.$('.kx-pill b').textContent = at ? e.it.I.title : 'Hall ' + (hk + 1) + ' · ' + h.g.title;
      S.$('.kx-pill small').textContent = (at ? 'Hall ' + (hk + 1) + ' · ' : th.name.replace(/^\S+\s/, '') + ' · ') + (st.tour ? 'Guided Tour ' + (st.idx + 1) + ' / ' + EX.length : 'Free Walk · ' + EX.length + ' exhibits');
      S.$('.ku-tour').innerHTML = st.tour ? '⏸ <span>Pause</span>' : '▶ <span>Guided Tour</span>'; S.$('.ku-tour').classList.toggle('on', st.tour);
      S.$('.ku-resume').hidden = st.tour || !(st.paused || st.wandered);
    }
    function near(e) { var v = viewOf(e); return Math.hypot(cur.x - v.x, cur.z - v.z) < .4; }
    function mapSheet() {
      var sh = S.$('.kx-sheet'); if (!sh.hidden) { sh.hidden = true; return; }
      var vert = S.W < 640, U = function (x, z) { return vert ? [x + W + 1, -z + 4] : [-z + 4, x + W + 1]; }, len = -ZEND + 4 + 1, Wd = vert ? W * 2 + 2 : len, Ht = vert ? len : W * 2 + 2, out = [];
      function rect(x0, z0, x1, z1, fill, stroke, extra) { var a = U(x0, z0), b = U(x1, z1), x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]); out.push('<rect ' + (extra || '') + ' x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + Math.abs(a[0] - b[0]).toFixed(2) + '" height="' + Math.abs(a[1] - b[1]).toFixed(2) + '" rx=".3" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".08"/>'); }
      rect(-DOOR, 3.5, DOOR, 0, 'rgba(255,255,255,.06)', 'rgba(255,255,255,.3)');
      halls.forEach(function (h, k) {
        var th = theme(h), ink = th.id === 'sculpture' ? '#2a2620' : '#fff'; out.push('<g class="room" data-kx="hall" data-k="' + k + '">'); rect(-W, h.z0, W, h.z0 - D, th.wall, h.g.color);
        var c = U(0, h.cz); out.push('<text x="' + c[0].toFixed(2) + '" y="' + (c[1] - .2).toFixed(2) + '" font-size=".8" fill="' + ink + '" text-anchor="middle" font-weight="700">' + esc('Hall ' + (k + 1)) + '</text><text x="' + c[0].toFixed(2) + '" y="' + (c[1] + .8).toFixed(2) + '" font-size=".62" fill="' + ink + '" opacity=".75" text-anchor="middle">' + esc(h.g.title.slice(0, 18)) + '</text></g>');
        if (k < halls.length - 1) rect(-DOOR, h.z0 - D, DOOR, h.z0 - D - CL, 'rgba(255,255,255,.06)', 'rgba(255,255,255,.3)');
      });
      var pts = [U(0, 2.6)]; EX.forEach(function (e) { var v = viewOf(e); pts.push(U(v.x, v.z)); });
      out.push('<polyline points="' + pts.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ') + '" fill="none" stroke="#e8c878" stroke-width=".07" stroke-dasharray=".25 .18" opacity=".8"/>');
      EX.forEach(function (e) { var a = U(e.wallX + e.n.x * .35, e.wallZ + e.n.z * .35); out.push('<g class="room" data-kx="ex" data-i="' + e.i + '"><circle cx="' + a[0].toFixed(2) + '" cy="' + a[1].toFixed(2) + '" r=".42" fill="' + esc(e.it.g ? e.it.g.color : '#999') + '" stroke="#fff" stroke-width="' + (e.i === st.idx ? .14 : .05) + '"/><title>' + esc(e.it.I.title) + '</title></g>'); });
      var me = U(cur.x, cur.z), hd = U(cur.x - Math.sin(cur.yaw) * 1.1, cur.z - Math.cos(cur.yaw) * 1.1);
      out.push('<line x1="' + me[0].toFixed(2) + '" y1="' + me[1].toFixed(2) + '" x2="' + hd[0].toFixed(2) + '" y2="' + hd[1].toFixed(2) + '" stroke="#ffd257" stroke-width=".16" stroke-linecap="round"/><circle class="kx-here" cx="' + me[0].toFixed(2) + '" cy="' + me[1].toFixed(2) + '" r=".45" fill="#ffd257"/>');
      S.$('.kx-map').innerHTML = '<svg viewBox="0 0 ' + Wd.toFixed(1) + ' ' + Ht.toFixed(1) + '" style="' + (vert ? 'max-height:70vh;width:auto;margin:auto' : '') + '">' + out.join('') + '</svg><p style="opacity:.7;font-size:12px;margin:8px 2px 0">Tap a hall or an exhibit to walk there · ● you are here</p>';
      sh.hidden = false;
    }

    // ---------------- input
    S.onDrag = function (dx, dy) {
      if (RD.open) return; if (st.tour) pauseTour(); st.path = null; st.final = null; st.arrive = null; st.wandered = true; st.focus = -1;
      want.yaw += dx * .0045; want.pitch = clamp(want.pitch, -.3, .2);
      var sp = -dy * .016, nx = cur.x - Math.sin(want.yaw) * sp, nz = cur.z - Math.cos(want.yaw) * sp; if (inside(nx, nz)) { cur.x = nx; cur.z = nz; } else if (inside(nx, cur.z)) cur.x = nx; else if (inside(cur.x, nz)) cur.z = nz;
      want.pitch = lerp(want.pitch, -.02, .1);
    };
    S.onWheel = function (d) { S.onDrag(0, d * .4); };
    S.onTap = function (e) {
      if (!S.$('.kx-sheet').hidden) return;
      if (RD.open) { var h0 = S.pick(e.clientX, e.clientY, RD.meshes); if (RD.hit(h0)) RD.flip(); else RD.back(); return; }
      var h = S.pick(e.clientX, e.clientY, picks.concat(floors));
      if (h && h.object.userData.ex != null) {
        var i = h.object.userData.ex; if (st.tour) pauseTour(); st.wandered = true;
        if (st.focus === i && near(EX[i]) && !st.path) return pullEx(i);
        return focusEx(i, function () { S.toast('Tap it again to take a closer look'); });
      }
      if (h && floors.indexOf(h.object) >= 0) {   // tap the floor: walk there
        var p = h.point; if (st.tour) pauseTour(); st.wandered = true; st.focus = -1;
        if (inside(p.x, p.z)) goTo(p.x, p.z, null); ui();
      }
    };
    S.onHover = function (e) { var h = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes : picks); S.cvs.style.cursor = h ? 'pointer' : ''; };
    S.onAct = function (k, el) {
      if (k === 'exit') return self.close();
      if (k === 'map') return mapSheet();
      if (k === 'hall') { S.$('.kx-sheet').hidden = true; if (st.tour) pauseTour(); st.wandered = true; var h = halls[+el.dataset.k]; st.focus = -1; goTo(0, h.z0 - 1.6, { yaw: 0, pitch: -.02 }); ui(); return; }
      if (k === 'ex') { S.$('.kx-sheet').hidden = true; if (st.tour) pauseTour(); st.wandered = true; focusEx(+el.dataset.i); return; }
      if (k === 'tour') { if (st.tour) pauseTour(); else startTour(st.focus >= 0); }
      if (k === 'resume') startTour(false);
      if (k === 'prev' || k === 'next') { RD.back(true); var base = st.focus >= 0 ? st.focus : st.idx, j = clamp(base + (k === 'next' ? 1 : -1), 0, EX.length - 1); if (st.tour) { st.idx = j; st.dwell = 0; focusEx(j, function () { st.dwell = 4.2; }); } else { st.wandered = true; focusEx(j); } }
      if (k === 'suggest') { RD.back(true); shift = (shift + 1) % THEMES.length; Object.keys(built).forEach(function (kk) { dropHall(+kk); }); buildRooms(); stream(); S.toast('✨ ' + halls.map(function (h) { return theme(h).name.split(' ')[0]; }).join(' ') + ' — halls re-themed'); }
      ui(); persist();
    };
    S.onKey = function (e) {
      var k = e.key; if (k === 'Escape') { e.preventDefault(); if (!S.$('.kx-sheet').hidden) return mapSheet(); if (RD.open) return RD.back(); return self.close(); }
      if (k === 'ArrowLeft') S.onAct('prev'); if (k === 'ArrowRight') S.onAct('next');
      if (k === 'ArrowUp') S.onDrag(0, -40); if (k === 'ArrowDown') S.onDrag(0, 40);
      if (k === ' ') { e.preventDefault(); if (RD.open) RD.flip(); else S.onAct('tour'); }
      if (k === 'Enter' && st.focus >= 0 && !RD.open) pullEx(st.focus); if (k === 'm' || k === 'M') mapSheet(); if (k === 's' || k === 'S') S.onAct('suggest');
    };
    function persist() { DB.set(C.key, { x: +cur.x.toFixed(2), z: +cur.z.toFixed(2), yaw: +want.yaw.toFixed(2), idx: st.idx, shift: shift }); }
    S.onHide = persist;

    var saveT = 0, hudT = 0, lookV = new T.Vector3(), t0 = 0;
    S.tick(function (dt, now) {
      if (st.path && st.path.length) {   // follow the path, facing the way you walk
        var p = st.path[0], dx = p.x - cur.x, dz = p.z - cur.z, d = Math.hypot(dx, dz), sp = (st.tour && st.path.length <= 1 ? 1.25 : 2.2) * dt;   // stroll up to an exhibit, walk briskly through doorways
        if (d <= sp) { cur.x = p.x; cur.z = p.z; st.path.shift(); } else { cur.x += dx / d * sp; cur.z += dz / d * sp; if (d > .5) { want.yaw = Math.atan2(-dx, -dz); want.pitch = -.02; } }
        if (!st.path.length) { st.path = null; if (st.final) { want.yaw = st.final.yaw; want.pitch = st.final.pitch; } }
      } else if (st.final || st.arrive) {
        var dy0 = Math.abs(((want.yaw - cur.yaw + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI);
        if (dy0 < .03) { st.final = null; var f = st.arrive; st.arrive = null; if (f) f(); ui(); }
      }
      if (st.tour && !st.path && !RD.open && st.dwell > 0) { st.dwell -= dt; if (st.dwell <= 0) nextStop(); }
      var a = 1 - Math.exp(-dt * 4), dyw = ((want.yaw - cur.yaw + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI; cur.yaw += dyw * a; cur.pitch = lerp(cur.pitch, want.pitch, a);
      var bob = st.path ? Math.sin(now / 260) * .015 : 0;
      cam.position.set(cur.x, cur.y + bob, cur.z); lookV.set(cur.x - Math.sin(cur.yaw) * Math.cos(cur.pitch), cur.y + bob + Math.sin(cur.pitch), cur.z - Math.cos(cur.yaw) * Math.cos(cur.pitch)); cam.lookAt(lookV);
      lantern.position.set(cur.x, 3.4, cur.z);
      t0 += dt; if (t0 > .1) { t0 = 0; stream(); }
      Object.keys(built).forEach(function (k) { built[k].forEach(function (g) { g.children.forEach(function (o) { if (o.userData.spin) o.rotation.y += dt * .5; }); }); });
      hudT += dt; if (hudT > .3 && !RD.open) { hudT = 0; ui(); } saveT += dt; if (saveT > 2) { saveT = 0; persist(); }
    });
    var self = this;
    buildRooms(); stream(); ui(); S.start();
    if (!st.wandered) { S.toast('Welcome — the Guided Tour begins'); setTimeout(function () { if (S.alive && !st.tour && !st.wandered) startTour(false); }, 1200); }
    else S.toast('Welcome back — ⟲ Resume Tour, or drag to walk');
    if (EX.length < C.all.length) setTimeout(function () { if (S.alive) S.toast(halls.length + ' halls · ' + EX.length + ' of ' + C.all.length + ' cards on show'); }, 2600);
    this.close = function () { persist(); S.close(); };
    this.state = function () { var e = st.focus >= 0 ? EX[st.focus] : null; return { halls: halls.length, exhibits: EX.length, themes: halls.map(function (h) { return theme(h).id; }).join(','), hall: hallAt(cur.z) + 1, x: +cur.x.toFixed(2), z: +cur.z.toFixed(2), tour: st.tour, idx: st.idx, focus: e ? e.it.I.title : null, reading: RD.item() ? RD.item().I.title : null, walking: !!st.path, built: Object.keys(built).join(',') }; };
    this.focus = focusEx; this.pull = function (i) { pullEx(i == null ? st.focus : i); }; this.flip = RD.flip; this.back = function () { RD.back(); }; this.act = S.onAct; this.walk = function (dy) { S.onDrag(0, dy); };
  }
  var CUR = null;
  window.MinestMuseum = { open: function (o) { if (CUR) CUR.close(); CUR = new Museum(o || {}); return CUR; }, current: function () { return CUR; }, themes: THEMES };
})();
