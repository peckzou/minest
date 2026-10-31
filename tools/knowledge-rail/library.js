/* Minest My World — Library Corridor (prototype): Walk → Browse → Pull → Read → Return.
   A long walnut library: tall shelves on both sides, one section per List (a brass sign hangs where it begins), every Card a
   book with its title on the spine among plain filler books. Walk the corridor (auto or drag), tap a shelf to step up to it,
   tap a book: it slides out and comes to you (showcase-common.js's reader, shared with the Rack and the Museum), tap to flip,
   tap outside and it slides back into its gap. Category Jump goes straight to a List's shelves. Suggest: Walnut Hall →
   Oak Archive → Night Reading. Far shelves are instanced filler; real card books are built only near you. */
(function () {
  'use strict';
  var X = window.KShow, K = window.KRail, T = window.THREE; if (!X || window.MinestLibrary) return;
  var clamp = K.clamp, lerp = K.lerp, esc = K.esc;
  var BW = 2.4, HALF = 1.6, SH = .66, LEVELS = 5, CPB = 10, BLOCK = 4, FILL = [2, 1, 3, 0, 4];   // bay width, corridor half-width, shelf pitch, cards per bay, pairs per instanced block, eye-level shelves first
  var ATMOS = [
    { id: 'walnut', name: '🪵 Walnut Hall', wood: '#5a3a22', trim: '#c9a24a', floor: '#6b4a2e', rug: '#7a2a24', wall: '#2a1d16', fog: '#1c140e', lamp: '#ffd9a0', key: '#ffe0b0', hemi: .55 },
    { id: 'oak', name: '📜 Oak Archive', wood: '#8a6a44', trim: '#b89a5a', floor: '#9a7a52', rug: '#2f4a5a', wall: '#3a3026', fog: '#2a241c', lamp: '#fff0d0', key: '#fff2dc', hemi: .75 },
    { id: 'night', name: '🌙 Night Reading', wood: '#3e2a1e', trim: '#d4af37', floor: '#3a2a1e', rug: '#24304a', wall: '#141820', fog: '#0b0e16', lamp: '#ffc070', key: '#ffb870', hemi: .32 }];
  var LEATHER = ['#6b2e2a', '#2f4a3a', '#3a3f5a', '#7a5a2a', '#5a3a4a', '#2a4a5a', '#8a6a3a', '#4a2a2a', '#5e4630', '#33404a'];
  var DB = X.store('minest.library.v1');

  function Library(opts) {
    var P = opts.provider || K.defaultProvider(), C = X.collect(P, opts.source || { type: 'workspace' }), saved = opts.fresh ? {} : DB.get(C.key);
    if (!C.all.length) throw new Error('No cards for the library');
    var atm = ATMOS.filter(function (a) { return a.id === (opts.atm || saved.atm); })[0] || ATMOS[0];
    var S = X.stage({ cls: 'kl-root', container: opts.container, onExit: opts.onExit, hFov: 74, maxFov: 88, far: 80,
      html: '<div class="kx-top"><div class="kx-pill"><i></i><span><b></b><small></small></span></div><div class="kx-tr"><button type="button" class="kx-b" data-kx="cats" aria-label="Category Jump">📚 <span>Categories</span></button><button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button></div></div>' +
        '<div class="kx-bar"><button type="button" class="kx-b" data-kx="prev" aria-label="Previous shelf">◀</button><button type="button" class="kx-b kl-walk" data-kx="walk"></button><button type="button" class="kx-b" data-kx="next" aria-label="Next shelf">▶</button>' +
        '<button type="button" class="kx-b kl-out" data-kx="out" hidden>⤺ <span>Corridor</span></button><button type="button" class="kx-b" data-kx="suggest">✨ <span>Suggest</span></button></div>' +
        '<div class="kx-sheet" hidden><div class="kx-card"><div class="kx-head"><b>📚 Category Jump</b><button type="button" class="kx-b" data-kx="cats">✕</button></div><div class="kx-list"></div></div></div>' });
    var scene = S.scene, cam = S.cam, RD = X.reader(S), rnd = K.rng(K.hash(C.key));

    // ---------------- plan: List → section → bays (left, right, left, …); each bay holds up to CPB cards, 2 per shelf
    var bays = [], sections = [];
    C.groups.forEach(function (g) {
      if (!g.items.length) return; var sec = { g: g, first: bays.length, n: g.items.length };
      if (bays.length % 2) bays.push({ empty: true, sec: sections.length - 1 });   // a section opens on a new pair (left side)
      sec.first = bays.length;
      for (var i = 0; i < g.items.length; i += CPB) bays.push({ sec: sections.length, items: g.items.slice(i, i + CPB), part: i / CPB });
      sec.last = bays.length - 1; sections.push(sec);
    });
    if (bays.length % 2) bays.push({ empty: true, sec: sections.length - 1 });
    bays.forEach(function (b, k) { b.k = k; b.side = k % 2 ? 1 : -1; b.pair = k >> 1; b.zc = -(b.pair + .5) * BW; b.items = b.items || []; });
    var PAIRS = bays.length / 2, ZEND = -PAIRS * BW;

    // ---------------- materials (one set, recoloured by Suggest)
    var mWood = X.M(atm.wood, { roughness: .8 }), mTrim = X.M(atm.trim, { metalness: .55, roughness: .35 }), mFloor = new T.MeshStandardMaterial({ roughness: .85 }), mRug = X.M(atm.rug, { roughness: 1 }), mWall = X.M(atm.wall, { roughness: 1 });
    var mBook = new T.MeshStandardMaterial({ roughness: .8, flatShading: true }), mLamp = new T.MeshBasicMaterial({ color: atm.lamp });
    var floorTex = (function () { var c = document.createElement('canvas'); c.width = 256; c.height = 256; var x = c.getContext('2d'); for (var i = 0; i < 8; i++) { var v = 200 + ((i * 37) % 40); x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect(i * 32, 0, 32, 256); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * 32, 0, 2, 256); x.fillRect(i * 32, (i * 97) % 256, 32, 2); } var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1.5, PAIRS * 2 + 2); return t; })();
    mFloor.map = floorTex;
    var hemi = new T.HemisphereLight('#ffe8cc', '#2a1a10', atm.hemi); scene.add(hemi);
    var lantern = new T.PointLight(atm.key, 1.15, 11, 1.4); scene.add(lantern);   // a warm light that walks with you
    var amb = new T.AmbientLight('#ffffff', .12); scene.add(amb);
    function applyAtmos() {
      mWood.color.set(atm.wood); mTrim.color.set(atm.trim); mFloor.color.set(atm.floor); mRug.color.set(atm.rug); mWall.color.set(atm.wall); mLamp.color.set(atm.lamp);
      scene.background = new T.Color(atm.fog); scene.fog = new T.Fog(atm.fog, 7, 30); hemi.intensity = atm.hemi; lantern.color.set(atm.key); S.root.style.background = atm.fog;
    }

    // ---------------- the room: floor, rug, ceiling beams, end walls with an arched window, pendant lamps
    var L = PAIRS * BW + 6;
    var floor = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 1.4, L + 2), mFloor); floor.rotation.x = -Math.PI / 2; floor.position.z = ZEND / 2 - .4; scene.add(floor);
    var rug = new T.Mesh(new T.PlaneGeometry(1.3, L - 3), mRug); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .006, ZEND / 2); scene.add(rug);
    var ceil = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 1.4, L), mWall); ceil.rotation.x = Math.PI / 2; ceil.scale.y = (L + 2) / L; ceil.position.set(0, 4.3, ZEND / 2 - .4); scene.add(ceil);
    var endW = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 1.4, 4.4), mWall); endW.position.set(0, 2.2, ZEND - 2.4); scene.add(endW);
    var winTex = (function () {   // an arched window with leaded panes and warm light behind it
      var c = document.createElement('canvas'); c.width = 256; c.height = 384; var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#fff4d0'); g.addColorStop(1, '#e8b860'); x.fillStyle = g;
      x.beginPath(); x.moveTo(16, 384); x.lineTo(16, 128); x.arc(128, 128, 112, Math.PI, 0); x.lineTo(240, 384); x.closePath(); x.fill();
      x.strokeStyle = '#3a2614'; x.lineWidth = 6; x.stroke(); x.lineWidth = 4; for (var i = 1; i < 4; i++) { x.beginPath(); x.moveTo(16 + i * 56, i === 2 ? 16 : 40); x.lineTo(16 + i * 56, 384); x.stroke(); } for (var j = 0; j < 4; j++) { x.beginPath(); x.moveTo(16, 150 + j * 60); x.lineTo(240, 150 + j * 60); x.stroke(); }
      return new T.CanvasTexture(c); })();
    var win = new T.Mesh(new T.PlaneGeometry(1.2, 1.8), new T.MeshBasicMaterial({ map: winTex, transparent: true, fog: false })); win.position.set(0, 2.1, ZEND - 2.38); scene.add(win);
    [-1, 1].forEach(function (sx) { var w = new T.Mesh(new T.PlaneGeometry(L + 2, 4.4), mWall); w.position.set(sx * (HALF + .5), 2.2, ZEND / 2 - .4); w.rotation.y = -sx * Math.PI / 2; scene.add(w); });   // panelled walls behind and beyond the shelves
    var startW = endW.clone(); startW.position.z = 4; startW.rotation.y = Math.PI; scene.add(startW);
    var beams = new T.InstancedMesh(new T.BoxGeometry(HALF * 2 + 1.4, .16, .2), mWood, PAIRS + 2), lamps = new T.InstancedMesh(new T.CylinderGeometry(.12, .2, .2, 8), mLamp, PAIRS), cords = new T.InstancedMesh(new T.CylinderGeometry(.008, .008, .5, 4), mTrim, PAIRS);
    var mx = new T.Matrix4();
    for (var p = 0; p <= PAIRS + 1; p++) { mx.makeTranslation(0, 4.22, -p * BW + .6); beams.setMatrixAt(p, mx); }
    for (var q = 0; q < PAIRS; q++) { mx.makeTranslation(0, 3.55, -(q + .5) * BW); lamps.setMatrixAt(q, mx); mx.makeTranslation(0, 3.9, -(q + .5) * BW); cords.setMatrixAt(q, mx); }
    [beams, lamps, cords].forEach(function (m) { m.frustumCulled = false; scene.add(m); });

    // ---------------- shelves + filler books, instanced per block of BLOCK pairs (visibility by distance)
    var blocks = [], cardSlots = [], hitBoxes = [];   // cardSlots[k][j] = { it, x, y, z, th, ht, dp, block, inst }
    var dummy = new T.Object3D(), col = new T.Color();
    function blockOf(pair) { return Math.floor(pair / BLOCK); }
    (function buildShelves() {
      var nB = Math.ceil(PAIRS / BLOCK);
      for (var b = 0; b < nB; b++) blocks.push({ boards: [], books: [], z0: -b * BLOCK * BW, z1: -Math.min(PAIRS, (b + 1) * BLOCK) * BW });
      bays.forEach(function (bay) {
        var B = blocks[blockOf(bay.pair)], sx = bay.side, z0 = bay.zc, sec = sections[bay.sec], tint = new T.Color(sec ? sec.g.color : '#886644');
        function board(x, y, z, w, h, d) { B.boards.push([x, y, z, w, h, d]); }
        board(sx * (HALF + .44), 1.78, z0, .05, 3.56, BW);                                  // back panel
        for (var l = 0; l <= LEVELS; l++) board(sx * (HALF + .22), .08 + l * SH, z0, .46, .04, BW - .02);   // shelf boards
        board(sx * (HALF + .22), 3.62, z0, .56, .16, BW + .04);                            // crown
        board(sx * (HALF + .22), 1.8, z0 - BW / 2, .48, 3.6, .07); board(sx * (HALF + .22), 1.8, z0 + BW / 2, .48, 3.6, .07);   // uprights
        board(sx * (HALF + .02), .05, z0, .06, .1, BW);                                   // kick plate
        var hb = new T.Mesh(new T.PlaneGeometry(BW, 3.5), new T.MeshBasicMaterial({ visible: false })); hb.position.set(sx * (HALF + .3), 1.8, z0); hb.rotation.y = -sx * Math.PI / 2; hb.userData.bay = bay.k; scene.add(hb); hitBoxes.push(hb);
        // the books: per shelf, the cards in their place and filler books around them
        var slots = cardSlots[bay.k] = [], per = [];
        bay.items.forEach(function (it, j) { var lv = FILL[Math.floor(j / 2) % LEVELS]; (per[lv] = per[lv] || []).push(it); });
        for (var lv = 0; lv < LEVELS; lv++) {
          var cards = per[lv] || [], y = .1 + lv * SH, span = BW - .16, items = [], used = 0;
          var cw = cards.map(function (it) { return .15 + (K.hash(it.ref.id) % 5) / 100; }); cw.forEach(function (w) { used += w + .01; });
          while (used < span - .1) {
            var r = rnd(), w2, e;
            if (r < .07) { w2 = .26; e = { box: 1, w: w2, h: .3, d: .34 }; }            // an archive box
            else if (r < .14) { w2 = .06 + rnd() * .05; e = { gap: 1, w: w2 }; }          // a little gap
            else { w2 = .045 + rnd() * .045; e = { w: w2, h: .36 + rnd() * .2, d: .26 + rnd() * .08 }; }
            if (used + w2 > span - .02) break; items.push(e); used += w2 + .004;
          }
          cards.forEach(function (it, j) { var at = Math.round((j + 1) / (cards.length + 1) * items.length); items.splice(at + j, 0, { card: it, w: cw[j] }); });
          var u = -span / 2 + Math.max(0, (span - used) / 2);
          items.forEach(function (e) {
            var zc = z0 + (u + e.w / 2) * (sx < 0 ? 1 : -1);   // both sides read left-to-right when you face them
            if (e.card) {
              var ht = .48 + (K.hash(e.card.ref.id) % 6) / 100, dp = .34, sl = { it: e.card, bay: bay.k, x: sx * (HALF + .02 + dp / 2), y: y + .02, z: zc, th: e.w, ht: ht, dp: dp, color: sec.g.color, inst: B.books.length };
              slots.push(sl); B.books.push([sl.x, y + .02 + ht / 2, zc, dp, ht, e.w, new T.Color(sec.g.color).offsetHSL(0, -.05, -.05)]);
            } else if (!e.gap) {
              var d = e.d; col.set(e.box ? '#a08a6a' : LEATHER[Math.floor(rnd() * LEATHER.length)]).lerp(tint, .14).offsetHSL(0, 0, (rnd() - .5) * .08);
              var lean = !e.box && rnd() < .04 ? (rnd() - .5) * .3 : 0;
              B.books.push([sx * (HALF + .02 + d / 2 + .02), y + .02 + e.h / 2, zc, d, e.h, e.w, col.clone(), lean]);
            }
            u += e.w + .004;
          });
        }
      });
      blocks.forEach(function (B) {
        var bm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mWood, B.boards.length);
        B.boards.forEach(function (a, i) { dummy.position.set(a[0], a[1], a[2]); dummy.scale.set(a[3], a[4], a[5]); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); bm.setMatrixAt(i, dummy.matrix); });
        var km = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mBook, B.books.length);
        B.books.forEach(function (a, i) { dummy.position.set(a[0], a[1], a[2]); dummy.scale.set(a[3], a[4], a[5]); dummy.rotation.set(a[7] || 0, 0, 0); dummy.updateMatrix(); km.setMatrixAt(i, dummy.matrix); km.setColorAt(i, a[6]); });
        bm.frustumCulled = km.frustumCulled = false; scene.add(bm, km); B.bm = bm; B.km = km;
      });
    })();
    // ladders (one where each section begins, on its left) and the section signs over the corridor
    var signs = [];
    sections.forEach(function (sec, i) {
      var bay = bays[sec.first], z = bay.zc + BW / 2 - .1, sx = bay.side, lad = new T.Group();
      [-.22, .22].forEach(function (o) { var r = new T.Mesh(new T.BoxGeometry(.05, 3.7, .06), mWood); r.position.set(0, 1.85, o); lad.add(r); });
      for (var s = 0; s < 11; s++) { var rg = new T.Mesh(new T.CylinderGeometry(.018, .018, .44, 6), mTrim); rg.rotation.x = Math.PI / 2; rg.position.y = .25 + s * .32; lad.add(rg); }
      lad.position.set(sx * (HALF - .3), 0, bay.zc + BW / 2 - .02);   // leaning on the upright where the section begins lad.rotation.z = sx * -.1; scene.add(lad);
      var t = X.labelTex([sec.g.title, sec.n + (sec.n === 1 ? ' card' : ' cards')], '#2b2116', atm.trim), sg = new T.Mesh(new T.PlaneGeometry(1.7, .46), new T.MeshBasicMaterial({ map: t, toneMapped: false }));
      sg.position.set(0, 3.45, z); scene.add(sg); var rimS = new T.Mesh(new T.BoxGeometry(1.78, .54, .03), mTrim); rimS.position.set(0, 3.45, z - .02); scene.add(rimS);
      signs.push(sg);
    });

    // ---------------- real card books near you (the instanced stand-in is hidden while the real one exists)
    var built = {}, picks = [];
    function showInst(sl, on) { var B = blocks[blockOf(bays[sl.bay].pair)], a = B.books[sl.inst]; dummy.position.set(a[0], a[1], a[2]); dummy.scale.set(on ? a[3] : 0, on ? a[4] : 0, on ? a[5] : 0); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); B.km.setMatrixAt(sl.inst, dummy.matrix); B.km.instanceMatrix.needsUpdate = true; }
    function buildBay(k) {
      if (built[k]) return; var list = built[k] = [];
      (cardSlots[k] || []).forEach(function (sl, j) {
        var g = X.carriers.book(sl.it, { th: sl.th, h: sl.ht, d: sl.dp, noArt: true }); g.position.set(sl.x, sl.y, sl.z); g.rotation.y = bays[k].side < 0 ? Math.PI / 2 : -Math.PI / 2;
        g.traverse(function (o) { if (o.isMesh) o.userData.card = { k: k, j: j }; }); scene.add(g); picks.push(g); list.push(g); showInst(sl, false);
      });
      var b = bays[k], sec = sections[b.sec]; if (sec && !b.empty) { var pt = X.labelTex([sec.g.title, (b.part + 1) + ' / ' + (sec.last - sec.first + 1)], '#2b2116', atm.trim), pl = new T.Mesh(new T.PlaneGeometry(.62, .17), new T.MeshBasicMaterial({ map: pt, toneMapped: false })); pl.position.set(b.side * (HALF - .06), 3.62, b.zc); pl.rotation.y = -b.side * Math.PI / 2; scene.add(pl); list.plate = pl; }
    }
    function dropBay(k) {
      var list = built[k]; if (!list) return; if (RD.open && cardSlots[k].some(function (sl) { return sl.it === RD.item(); })) return;   // never drop the book you are reading
      list.forEach(function (g, j) { scene.remove(g); picks.splice(picks.indexOf(g), 1); g.traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(function (m) { if (m.map && m.map !== g.userData.faceMat.map) m.map.dispose(); m.dispose(); }); } }); showInst(cardSlots[k][j], true); });
      if (list.plate) { scene.remove(list.plate); list.plate.material.map.dispose(); list.plate.material.dispose(); }
      delete built[k];
    }
    function stream() {   // real books within a few pairs of you; blocks shown by distance (fog hides the rest)
      var pz = -cur.z / BW, lo = Math.floor(pz) - 2, hi = Math.floor(pz) + 4;
      bays.forEach(function (b) { if (b.pair >= lo && b.pair <= hi) buildBay(b.k); else if (built[b.k]) dropBay(b.k); });
      blocks.forEach(function (B) { var v = B.z1 < cur.z + 8 && B.z0 > cur.z - 34; B.bm.visible = B.km.visible = v; });
    }

    // ---------------- camera: walk the corridor, or stand at a shelf
    var cur = { x: 0, y: 1.6, z: 2.6, yaw: 0, pitch: -.02 }, tgt = Object.assign({}, cur), st = { walk: false, focus: -1, panZ: 0, panY: 0, arrive: null };
    if (saved.z != null) { cur.z = tgt.z = clamp(saved.z, ZEND + .4, 2.6); cur.yaw = tgt.yaw = saved.yaw || 0; }
    function nearestBay(side) { var pr = clamp(Math.floor(-cur.z / BW), 0, PAIRS - 1), yaw = ((cur.yaw % 6.283) + 6.283) % 6.283; var s = side || (yaw > .4 && yaw < 3.14 ? -1 : yaw >= 3.14 && yaw < 5.88 ? 1 : -1); return pr * 2 + (s < 0 ? 0 : 1); }
    function focusBay(k, then, panZ) {
      k = clamp(k, 0, bays.length - 1); var b = bays[k]; st.walk = false; st.focus = k; st.panZ = panZ || 0; st.panY = 0; st.arrive = then || null; poseFocus(); ui();
    }
    function poseFocus() { var b = bays[st.focus], nar = S.W / S.H < .8, d = nar ? 2.6 : 2.05; tgt.x = -b.side * (d - HALF); tgt.y = 1.62 + st.panY; tgt.z = b.zc + st.panZ; tgt.yaw = b.side < 0 ? Math.PI / 2 : -Math.PI / 2; tgt.pitch = -.07; }
    function unfocus() { if (st.focus < 0) return; RD.back(true); var b = bays[st.focus]; st.focus = -1; tgt.x = 0; tgt.y = 1.6; tgt.z = b.zc + .6; tgt.yaw = b.side < 0 ? .5 : -.5; tgt.pitch = -.02; ui(); }
    function pull(k, j) {
      var sl = cardSlots[k][j], g = built[k] && built[k][j]; if (!g) return;
      if (st.focus !== k || Math.abs(cur.z - (bays[k].zc + st.panZ)) > .2 || Math.abs(cur.x - tgt.x) > .1) {   // step up to the shelf first, centred on the book
        var pz = clamp(sl.z - bays[k].zc, -(BW / 2 - .5), BW / 2 - .5); focusBay(k, function () { pull(k, j); }, pz); st.panY = clamp(sl.y + .3 - 1.62, -.9, 1.3); poseFocus(); return;
      }
      RD.pull(g, sl.it, { slide: new T.Vector3(-bays[k].side, 0, 0), dist: 1.8, onBack: function () { ui(); } }); ui(sl);
    }
    function step(dir) { RD.back(true); var k = st.focus >= 0 ? st.focus : nearestBay() - dir; k += dir; while (bays[k] && bays[k].empty) k += dir; if (!bays[k]) return S.toast(dir > 0 ? 'End of the corridor' : 'The entrance'); focusBay(k); }

    // ---------------- HUD
    function ui(reading) {
      var k = st.focus >= 0 ? st.focus : nearestBay(), b = bays[k], sec = sections[b.sec];
      S.$('.kx-pill i').style.background = sec ? sec.g.color : atm.trim;
      S.$('.kx-pill b').textContent = reading ? reading.it.I.title : sec ? sec.g.title : 'Library';
      S.$('.kx-pill small').textContent = (reading ? (sec ? sec.g.title + ' · ' : '') : '') + 'Shelf ' + (k + 1) + ' / ' + bays.length + ' · ' + C.all.length + ' cards · ' + atm.name.replace(/^\S+\s/, '');
      S.$('.kl-walk').innerHTML = st.walk ? '⏸ <span>Stop</span>' : '🚶 <span>Walk</span>';
      S.$('.kl-out').hidden = st.focus < 0;
      S.$('.kl-walk').classList.toggle('on', st.walk);
    }
    function catsSheet() {
      var sh = S.$('.kx-sheet'), here = sections.indexOf(sections[bays[st.focus >= 0 ? st.focus : nearestBay()].sec]);
      if (!sh.hidden) { sh.hidden = true; return; }
      S.$('.kx-list').innerHTML = sections.map(function (s, i) { return '<button type="button" data-kx="jump" data-i="' + i + '" class="' + (i === here ? 'on' : '') + '" style="--c:' + esc(s.g.color) + '"><i>' + esc((s.g.title || '?').trim().charAt(0).toUpperCase()) + '</i><span><b>' + esc(s.g.title) + '</b><small>' + s.n + ' cards · shelves ' + (s.first + 1) + '–' + (s.last + 1) + '</small></span></button>'; }).join('');
      sh.hidden = false;
    }

    // ---------------- input
    S.onDrag = function (dx, dy) {
      if (RD.open) return;
      if (st.focus >= 0) { st.panZ = clamp(st.panZ + dx * .006 * (bays[st.focus].side < 0 ? 1 : -1), -(BW / 2 - .4), BW / 2 - .4); st.panY = clamp(st.panY + dy * .006, -1, 1.4); st.arrive = null; poseFocus(); return; }
      st.walk = false; tgt.yaw += dx * .004; tgt.z = clamp(tgt.z + dy * .014, ZEND + .4, 2.6); ui();
    };
    S.onWheel = function (d) { if (RD.open) return; if (st.focus >= 0) { st.panY = clamp(st.panY - d * .002, -1, 1.4); poseFocus(); } else { tgt.z = clamp(tgt.z + d * .006, ZEND + .4, 2.6); } };
    S.onTap = function (e) {
      if (RD.open) { var h0 = S.pick(e.clientX, e.clientY, RD.meshes); if (RD.hit(h0)) RD.flip(); else RD.back(); return; }
      var h = S.pick(e.clientX, e.clientY, picks.concat(hitBoxes));
      if (h && h.object.userData.card) return pull(h.object.userData.card.k, h.object.userData.card.j);
      if (h && h.object.userData.bay != null && !bays[h.object.userData.bay].empty) { if (st.focus !== h.object.userData.bay) focusBay(h.object.userData.bay); return; }
      if (st.focus >= 0) unfocus();
    };
    S.onHover = function (e) { S.cvs.style.cursor = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes : picks) ? 'pointer' : ''; };
    S.onAct = function (k, el) {
      if (k === 'exit') return self.close();
      if (k === 'cats') return catsSheet();
      if (k === 'jump') { S.$('.kx-sheet').hidden = true; var sec = sections[+el.dataset.i]; RD.back(true); focusBay(sec.first); return S.toast('📚 ' + sec.g.title); }
      if (k === 'walk') { RD.back(true); if (st.focus >= 0) unfocus(); st.walk = !st.walk; if (st.walk) { tgt.yaw = 0; tgt.x = 0; } }
      if (k === 'prev' || k === 'next') step(k === 'next' ? 1 : -1);
      if (k === 'out') unfocus();
      if (k === 'suggest') { var i = ATMOS.indexOf(atm); atm = ATMOS[(i + 1) % ATMOS.length]; applyAtmos(); S.toast('✨ ' + atm.name); }
      ui(); persist();
    };
    S.onKey = function (e) {
      var k = e.key; if (k === 'Escape') { e.preventDefault(); if (!S.$('.kx-sheet').hidden) return catsSheet(); if (RD.open) return RD.back(); if (st.focus >= 0) return unfocus(); return self.close(); }
      if (k === 'ArrowLeft') S.onAct('prev'); if (k === 'ArrowRight') S.onAct('next');
      if (k === 'ArrowUp' && st.focus < 0) { st.walk = false; tgt.z = clamp(tgt.z - BW / 2, ZEND + .4, 2.6); } if (k === 'ArrowDown' && st.focus < 0) { st.walk = false; tgt.z = clamp(tgt.z + BW / 2, ZEND + .4, 2.6); }
      if (k === ' ') { e.preventDefault(); if (RD.open) RD.flip(); else S.onAct('walk'); }
      if (k === 's' || k === 'S') S.onAct('suggest'); if (k === 'c' || k === 'C') catsSheet();
    };
    function persist() { DB.set(C.key, { z: +(st.focus >= 0 ? bays[st.focus].zc + .6 : tgt.z).toFixed(2), yaw: +tgt.yaw.toFixed(2), atm: atm.id }); }
    S.onHide = persist;

    var saveT = 0, hudT = 0, lookV = new T.Vector3();
    S.tick(function (dt) {
      if (st.walk) { tgt.z -= dt * .75; if (tgt.z <= ZEND + .4) { tgt.z = ZEND + .4; st.walk = false; ui(); S.toast('End of the corridor'); } }
      var a = 1 - Math.exp(-dt * (st.walk ? 6 : 4.2));
      cur.x = lerp(cur.x, tgt.x, a); cur.y = lerp(cur.y, tgt.y, a); cur.z = lerp(cur.z, tgt.z, a); cur.pitch = lerp(cur.pitch, tgt.pitch, a);
      var dy = ((tgt.yaw - cur.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; cur.yaw += dy * a;
      cam.position.set(cur.x, cur.y, cur.z); lookV.set(cur.x - Math.sin(cur.yaw) * Math.cos(cur.pitch), cur.y + Math.sin(cur.pitch), cur.z - Math.cos(cur.yaw) * Math.cos(cur.pitch)); cam.lookAt(lookV);
      lantern.position.set(cur.x, 3.1, cur.z - .6);
      if (st.arrive && Math.abs(cur.x - tgt.x) < .03 && Math.abs(cur.z - tgt.z) < .03 && Math.abs(dy) < .02 && Math.abs(cur.y - tgt.y) < .03) { var f = st.arrive; st.arrive = null; f(); }
      stream();
      hudT += dt; if (hudT > .3 && !RD.open) { hudT = 0; ui(); } saveT += dt; if (saveT > 2) { saveT = 0; persist(); }
    });
    S.onResize = function () { if (st.focus >= 0) poseFocus(); };
    var self = this;
    applyAtmos(); stream(); ui(); S.start(); S.toast('Walk the corridor · tap a shelf to step up · tap a book to pull it out');
    this.close = function () { persist(); S.close(); };
    this.state = function () { var k = st.focus >= 0 ? st.focus : nearestBay(); return { atm: atm.id, z: +cur.z.toFixed(2), walk: st.walk, focus: st.focus, shelf: k, section: sections[bays[k].sec] && sections[bays[k].sec].g.title, reading: RD.item() ? RD.item().I.title : null, bays: bays.length, sections: sections.length, built: Object.keys(built).length, books: picks.length }; };
    this.pull = function (k, j) { buildBay(k); pull(k, j || 0); }; this.focus = focusBay; this.flip = RD.flip; this.back = function () { RD.back(); }; this.act = S.onAct; this.unfocus = unfocus;
  }
  var CUR = null;
  window.MinestLibrary = { open: function (o) { if (CUR) CUR.close(); CUR = new Library(o || {}); return CUR; }, current: function () { return CUR; }, atmospheres: ATMOS };
})();
