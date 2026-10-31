/* Minest My World — Rotating Rack (prototype): Rotate → Select → Pull → Read → Resume.
   A 12-slot display turns slowly; each card rides it as a book, a memory orb or a badge. Drag to spin it (it settles on a slot),
   tap a piece: the rack stops, brings it round to you, it slides out and comes forward; tap to flip; tap anywhere and it goes
   back, the rack turns on. Suggest: ring turntable → vertical tower → two-tier carousel. Built on showcase-common.js. */
(function () {
  'use strict';
  var X = window.KShow, K = window.KRail, T = window.THREE; if (!X || window.MinestRack) return;
  var clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc, TAU = Math.PI * 2;
  var SHAPES = [['ring', '◎ Ring Turntable'], ['tower', '▥ Vertical Tower'], ['tiers', '☰ Two-Tier Carousel']];
  var MATS = [['wood', '🪵 Walnut', { color: '#7a5233', roughness: .7 }], ['metal', '⚙️ Brushed Metal', { color: '#b9bfc9', metalness: .75, roughness: .32 }], ['glass', '🔷 Glass', { color: '#cfe6ff', transparent: true, opacity: .4, metalness: .2, roughness: .05, depthWrite: false }]];
  var DB = X.store('minest.rack.v1');

  function Rack(opts) {
    var P = opts.provider || K.defaultProvider(), C = X.collect(P, opts.source || { type: 'workspace' }), saved = opts.fresh ? {} : DB.get(C.key);
    if (!C.all.length) throw new Error('No cards for the rack');
    var st = { shape: opts.shape || saved.shape || 'ring', mat: saved.mat || 'wood', angle: saved.angle || 0, vel: 0, auto: saved.auto !== false, target: null, hist: [] };
    var S = X.stage({ cls: 'kr-root', container: opts.container, onExit: opts.onExit, hFov: 64, maxFov: 92,
      html: '<div class="kx-top"><div class="kx-pill"><i></i><span><b></b><small></small></span></div><button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button></div>' +
        '<div class="kx-bar"><button type="button" class="kx-b" data-kx="prev" aria-label="Previous">◀</button><button type="button" class="kx-b kr-auto" data-kx="auto"></button><button type="button" class="kx-b" data-kx="next" aria-label="Next">▶</button>' +
        '<button type="button" class="kx-b" data-kx="suggest">✨ <span>Suggest</span></button><button type="button" class="kx-b kr-mat" data-kx="mat"></button></div>' });
    var scene = S.scene, cam = S.cam, RD = X.reader(S);
    // studio: warm backdrop, floor, soft key + rim light
    scene.background = new T.Color('#1d1a22');
    var bd = new T.CylinderGeometry(30, 30, 30, 32, 6, true), cols = [], pa = bd.attributes.position; for (var i = 0; i < pa.count; i++) { var y = (pa.getY(i) + 15) / 30, c = new T.Color('#3a2f3a').lerp(new T.Color('#0f0d14'), y); cols.push(c.r, c.g, c.b); }
    bd.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); scene.add(new T.Mesh(bd, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    var floor = new T.Mesh(new T.CircleGeometry(14, 48), X.M('#2a2430', { roughness: .9 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var pool = new T.Mesh(new T.CircleGeometry(4.2, 48), new T.MeshBasicMaterial({ color: '#fff0d0', transparent: true, opacity: .07, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = .01; scene.add(pool);
    scene.add(new T.HemisphereLight('#ffeedd', '#2a2030', .75)); var key = new T.DirectionalLight('#ffe2b8', 1); key.position.set(3, 7, 6); scene.add(key); var rim = new T.DirectionalLight('#9fb8ff', .5); rim.position.set(-6, 4, -5); scene.add(rim);
    var spot = new T.SpotLight('#fff1d6', 1.1, 14, .42, .6, 1.2); spot.position.set(0, 5.5, 5); scene.add(spot); scene.add(spot.target);   // the front slot sits in a pool of light
    var rack = new T.Group(); scene.add(rack); var slots = [], picks = [];

    function carrierFor(it, i) {   // Smart: books stay books, people get badges, the rest share orbs / badges / books
      var t = it.I.type; if (t === 'book') return 'book'; if (t === 'portrait' || t === 'album') return 'badge'; if (t === 'poster') return 'orb'; return ['orb', 'book', 'badge'][i % 3];
    }
    function build() {
      RD.back(true); rack.children.slice().forEach(function (o) { rack.remove(o); }); slots = []; picks = [];
      var mat = new T.MeshStandardMaterial(Object.assign({ flatShading: true }, MATS.filter(function (m) { return m[0] === st.mat; })[0][2])), brass = X.M('#c9a24a', { metalness: .6, roughness: .35 });
      var items = C.all.slice(0, 12), n = 12, layout = [];
      if (st.shape === 'ring') { for (var i = 0; i < n; i++) layout.push({ a: i / n * TAU, r: 2.5, y: .42, step: TAU / n }); }
      else if (st.shape === 'tower') { for (var j = 0; j < n; j++) { var tier = Math.floor(j / 4); layout.push({ a: (j % 4) / 4 * TAU + tier * Math.PI / 4, r: 1.3, y: .35 + tier * 1.05, step: TAU / 4 }); } }
      else { for (var k = 0; k < n; k++) { var up = k >= 6; layout.push({ a: (k % 6) / 6 * TAU + (up ? Math.PI / 6 : 0), r: up ? 1.55 : 2.45, y: up ? 1.45 : .42, step: TAU / 6 }); } }
      // the stand itself
      if (st.shape === 'ring') { add(new T.CylinderGeometry(2.9, 3.05, .3, 36), mat, 0, .15); add(new T.CylinderGeometry(.5, .6, .5, 16), brass, 0, .45); add(new T.TorusGeometry(2.9, .04, 6, 48), brass, 0, .31, Math.PI / 2); }
      else if (st.shape === 'tower') { add(new T.CylinderGeometry(1.7, 1.8, .2, 32), mat, 0, .1); add(new T.CylinderGeometry(.14, .14, 3.2, 10), brass, 0, 1.7); [0, 1, 2].forEach(function (t) { add(new T.CylinderGeometry(1.55, 1.55, .08, 32), mat, 0, .3 + t * 1.05); }); }
      else { add(new T.CylinderGeometry(2.85, 3, .3, 36), mat, 0, .15); add(new T.CylinderGeometry(.16, .16, 1.3, 10), brass, 0, .9); add(new T.CylinderGeometry(1.9, 1.9, .1, 32), mat, 0, 1.4); }
      function add(geo, m, x, y2, rx) { var o = new T.Mesh(geo, m); o.position.set(x, y2, 0); if (rx) o.rotation.x = rx; rack.add(o); return o; }
      items.forEach(function (it, i) {
        var L = layout[i], sc = { ring: 1.45, tower: 1.05, tiers: 1.2 }[st.shape], kind = carrierFor(it, i), g = X.carriers[kind](it), holder = new T.Group();
        holder.position.set(Math.sin(L.a) * L.r, L.y, Math.cos(L.a) * L.r); holder.rotation.y = L.a; rack.add(holder);
        var pad = new T.Mesh(new T.CylinderGeometry(.3, .3, .04, 16), brass); pad.position.y = -.02; holder.add(pad);
        if (kind === 'book') { g.rotation.y = -Math.PI / 2; g.scale.setScalar(sc); } else g.scale.setScalar(sc);   // books show their cover outward
        holder.add(g); g.traverse(function (o) { if (o.isMesh) { o.userData.slot = i; } }); picks.push(g);
        slots.push({ it: it, holder: holder, g: g, L: L, kind: kind });
      });
      persist(); hud();
    }
    function frontSlot() {   // the slot nearest the viewer
      var best = null, bd2 = 1e9, v = new T.Vector3(); slots.forEach(function (s, i) { s.holder.getWorldPosition(v); var d = v.distanceToSquared(cam.position) - (st.shape === 'tower' ? 0 : 0); if (d < bd2) { bd2 = d; best = i; } }); return best;
    }
    function bring(i, then) {   // turn the rack so slot i faces the camera
      var L = slots[i].L, want = -L.a, cur = st.angle, d = ((want - cur) % TAU + TAU * 1.5) % TAU - TAU / 2; st.target = { from: cur, to: cur + d, t: 0, dur: clamp(Math.abs(d) * .45, .35, .9), then: then };
    }
    function step(dir) { var f = frontSlot(); if (f == null) return; var L = slots[f].L, d = dir * L.step; st.target = { from: st.angle, to: Math.round((st.angle + d) / L.step) * L.step + (Math.abs(((st.angle % L.step) + L.step) % L.step) > 1e-3 ? 0 : 0), t: 0, dur: .5 }; }
    function select(i) {
      var s = slots[i]; if (!s) return; st.wasAuto = st.auto; st.auto = false; autoLabel(); S.hap();
      bring(i, function () { var out = new T.Vector3(0, 0, 1); RD.pull(s.g, s.it, { slide: out.applyQuaternion(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), 0)), dist: 2.1, onBack: function () { if (st.wasAuto) { st.auto = true; autoLabel(); } hud(); } }); hud(i); });
    }
    function hud(i) {
      var f = i != null ? i : frontSlot(), s = slots[f], sh = SHAPES.filter(function (x) { return x[0] === st.shape; })[0];
      S.$('.kx-pill i').style.background = s && s.it.g ? s.it.g.color : '#c9a24a';
      S.$('.kx-pill b').textContent = s ? s.it.I.title : 'Rotating Rack';
      S.$('.kx-pill small').textContent = (s ? (s.it.g ? s.it.g.title + ' · ' : '') + ({ book: '📕 Book', orb: '🔮 Memory Orb', badge: '🏅 Badge' }[s.kind]) + ' · ' : '') + sh[1].replace(/^\S+\s/, '') + ' · ' + slots.length + ' slots';
      S.$('.kr-mat').innerHTML = MATS.filter(function (m) { return m[0] === st.mat; })[0][1].replace(' ', ' <span>') + '</span>';
    }
    function autoLabel() { S.$('.kr-auto').innerHTML = st.auto ? '⏸ <span>Pause</span>' : '⟳ <span>Auto Rotate</span>'; }
    function persist() { DB.set(C.key, { shape: st.shape, mat: st.mat, angle: st.angle, auto: RD.open && st.wasAuto != null ? st.wasAuto : st.auto }); }

    // input
    S.onDrag = function (dx) { if (RD.open) return; st.target = null; st.dragging = true; st.vel = dx * .008 / .016; st.angle += dx * .008; };
    S.onDragEnd = function () { st.dragging = false; };
    S.onTap = function (e) {
      var h = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes.concat(picks) : picks);
      if (RD.open) { if (RD.hit(h)) RD.flip(); else RD.back(); return; }
      if (h && h.object.userData.slot != null) select(h.object.userData.slot);
    };
    S.onHover = function (e) { S.cvs.style.cursor = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes : picks) ? 'pointer' : ''; };
    S.onAct = function (k) {
      if (k === 'exit') return self.close();
      if (k === 'auto') { st.auto = !st.auto; autoLabel(); }
      else if (k === 'prev' || k === 'next') { RD.back(true); step(k === 'next' ? -1 : 1); }
      else if (k === 'suggest') { st.hist.push(st.shape); var i = SHAPES.findIndex(function (s) { return s[0] === st.shape; }); st.shape = SHAPES[(i + 1) % SHAPES.length][0]; build(); S.toast('✨ ' + SHAPES[(i + 1) % SHAPES.length][1]); }
      else if (k === 'mat') { var j = MATS.findIndex(function (m) { return m[0] === st.mat; }); st.mat = MATS[(j + 1) % MATS.length][0]; build(); S.toast(MATS[(j + 1) % MATS.length][1]); }
      persist();
    };
    S.onKey = function (e) { var k = e.key; if (k === 'Escape') { e.preventDefault(); if (RD.open) return RD.back(); return self.close(); } if (k === 'ArrowLeft') S.onAct('prev'); if (k === 'ArrowRight') S.onAct('next'); if (k === ' ') { e.preventDefault(); if (RD.open) RD.flip(); else S.onAct('auto'); } if (k === 'Enter' && !RD.open) { var f = frontSlot(); if (f != null) select(f); } if (k === 's' || k === 'S') S.onAct('suggest'); };
    S.onHide = persist;

    var saveT = 0, hudT = 0;
    S.tick(function (dt, now) {
      if (st.target) { var tg = st.target; tg.t += dt; var k = clamp(tg.t / tg.dur, 0, 1); st.angle = lerp(tg.from, tg.to, ease(k)); if (k >= 1) { st.target = null; if (tg.then) tg.then(); } }
      else if (!st.dragging) {
        if (Math.abs(st.vel) > .02) { st.angle += st.vel * dt; st.vel *= Math.exp(-dt * 3.2); if (Math.abs(st.vel) <= .02) { var f = frontSlot(); if (f != null) bring(f); } }   // fling, then settle on a slot
        else if (st.auto && !RD.open) st.angle += dt * .16;
      }
      rack.rotation.y = st.angle;
      slots.forEach(function (s) { if (s.kind === 'orb' && s.g.userData.spin) s.g.userData.spin.rotation.y = -st.angle - s.L.a + Math.sin(now / 900 + s.L.a) * .25; });   // orbs keep their card turned to you
      var tw = st.shape === 'tower', ti = st.shape === 'tiers', nar = S.W / S.H < .8; cam.position.set(0, tw ? 2.6 : ti ? 2.3 : 1.75, (tw ? 5.8 : ti ? 6 : 5.5) + (nar ? .9 : 0)); cam.lookAt(0, tw ? 1.55 : ti ? 1 : .75, 0); spot.target.position.set(0, tw ? 1.2 : .5, tw ? 1.3 : 2.5);
      hudT += dt; if (hudT > .25 && !RD.open) { hudT = 0; hud(); } saveT += dt; if (saveT > 2) { saveT = 0; persist(); }
    });
    var self = this;
    build(); autoLabel(); S.start(); S.toast('Drag to turn · tap a piece to pull it out');
    this.close = function () { persist(); S.close(); };
    this.state = function () { var f = frontSlot(); return { shape: st.shape, mat: st.mat, auto: st.auto, angle: +st.angle.toFixed(2), front: slots[f] && slots[f].it.I.title, frontKind: slots[f] && slots[f].kind, reading: RD.item() ? RD.item().I.title : null, kinds: slots.map(function (s) { return s.kind; }).join(',') }; };
    this.select = function (i) { select(i == null ? frontSlot() : i); }; this.flip = RD.flip; this.back = function () { RD.back(); }; this.act = S.onAct;
  }
  var CUR = null;
  window.MinestRack = { open: function (o) { if (CUR) CUR.close(); CUR = new Rack(o || {}); return CUR; }, current: function () { return CUR; }, shapes: SHAPES, materials: MATS };
})();
