/* Minest My World — Knowledge Skyscraper (prototype) · "Explore Knowledge Vertically"
   A Board is a glass tower in a night skyline: 1F Knowledge Lobby, a floor per List (a long List spans floors, small Lists
   share one), and the Discovery Observatory on the roof. Ride the central elevator (doors, rolling floor numbers — tap to
   skip), or open the Cutaway view (the glass fades, every floor shows like a dollhouse) and tap a floor to walk straight in.
   Each floor is an exhibition — Word Wall, Bookshelf, Museum Gallery, Cabinet of Knowledge, Sculpture Gallery, Memory Orb
   Archive. Tap an item: it slides out to you; tap again to flip it to the meaning; tap anywhere to put it back.
   Cards are refs (rail-common.js reads them live); floors keep only their exhibition style and lock, saved on their own. */
(function () {
  'use strict';
  var K = window.KRail, T = window.THREE; if (!K || !T || window.MinestTower) return;
  var STORE = 'minest.tower.v1', clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc, FONT = K.FONT;
  var FW = 22, FD = 16, FH = 4.6, LOBBY_H = 5.6, PER_FLOOR = 10;
  var KINDS = [['wall', '🔤 Word Wall'], ['books', '📚 Bookshelf'], ['gallery', '🖼 Museum Gallery'], ['cabinet', '🗄 Cabinet of Knowledge'], ['sculpt', '🗿 Sculpture Gallery'], ['orbs', '🔮 Memory Orb Archive']];
  var EXTS = [
    { id: 'azure', name: 'Azure Glass', glass: '#5d8fd0', frame: '#3f5f8f', slab: '#e8eef6', inner: '#f3efe6' },
    { id: 'champagne', name: 'Champagne', glass: '#d9b878', frame: '#8a6a3a', slab: '#f2ebe0', inner: '#f6efe2' },
    { id: 'pearl', name: 'Pearl White', glass: '#c9d6e3', frame: '#e6e9ee', slab: '#ffffff', inner: '#f4f2ee' },
    { id: 'obsidian', name: 'Obsidian', glass: '#3a4258', frame: '#1c2030', slab: '#2a2f3c', inner: '#ece6dc' }];
  var FLOORCOL = { wall: '#c9a77a', books: '#a8794e', gallery: '#e8e2d8', cabinet: '#d8d2c6', sculpt: '#cfc8bb', orbs: '#2f3348', lobby: '#e9e1d2', roof: '#8a8f99' };
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
  function save(key, v) { try { var a = load(); a[key] = v; localStorage.setItem(STORE, JSON.stringify(a)); } catch (e) {} }
  function cleanTitle(t) { return String(t || 'Untitled').replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '') || 'Untitled'; }

  function Tower(opts) {
    var self = this, P = opts.provider || K.defaultProvider(), src = opts.source || {}, board = P.boards().filter(function (b) { return b.id === src.bid; })[0] || P.boards()[0];
    if (!board) throw new Error('No board for the tower');
    var KEY = 'tower:' + board.id, saved = opts.fresh ? {} : (load()[KEY] || {}), seed = K.hash(KEY);
    var st = { view: 'skyline', floor: 0, ext: opts.ext || saved.ext || 'azure', fl: saved.fl || {}, tw: null, read: null, yaw: .62, pitch: .2, dist: 1, cut: 0, cutTo: 0, lookYaw: 0, lookPitch: 0 };

    // ---------------- Smart Floor Generation: Lobby, a floor per List (long ones span floors, small ones share), Rooftop
    var floors = [{ id: 'lobby', kind: 'lobby', name: 'Knowledge Lobby', items: [] }], pend = null;
    (board.columns || []).forEach(function (col) {
      var items = []; (col.cards || []).forEach(function (c) { if (!c || c.archived) return; items.push({ ref: { bid: board.id, col: col.id, id: c.id }, section: null }); (c.stack || []).forEach(function (s) { items.push({ ref: { bid: board.id, col: col.id, id: s.id, parent: c.id }, section: c.title }); }); });
      var title = cleanTitle(col.title);
      if (items.length > PER_FLOOR) { if (pend) { floors.push(pend); pend = null; } var parts = Math.ceil(items.length / PER_FLOOR), per = Math.ceil(items.length / parts); for (var i = 0; i < parts; i++) floors.push({ id: col.id + '#' + i, name: title + ' · ' + (i + 1) + '/' + parts, lists: [title], items: items.slice(i * per, (i + 1) * per) }); return; }   // even shares
      if (pend && pend.items.length + items.length <= PER_FLOOR && items.length <= 4 && pend.items.length <= 6) { pend.items = pend.items.concat(items); pend.lists.push(title); pend.name = pend.lists.join(' & '); pend.id += '+' + col.id; return; }
      if (pend) floors.push(pend); pend = { id: col.id, name: title, lists: [title], items: items };
    });
    if (pend) floors.push(pend);
    floors.push({ id: 'roof', kind: 'roof', name: 'Discovery Observatory', items: [] });
    function smartKind(f, i) {   // the exhibition that suits the cards, then variety by the seed
      var tally = {}; f.items.slice(0, 8).forEach(function (it) { var I = K.info(P, it.ref); if (I) tally[I.type] = (tally[I.type] || 0) + 1; });
      var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0];
      if (top === 'book') return 'books'; if (top === 'portrait') return 'gallery'; if (top === 'poster' || top === 'album') return 'gallery'; if (!f.items.length) return 'gallery';
      if (top === 'typography' && (tally.typography || 0) > f.items.length / 2 && used.wall == null) return 'wall';
      var order = ['gallery', 'cabinet', 'sculpt', 'orbs', 'wall', 'books'], off = seed % order.length;   // variety: the next style no floor has yet
      for (var j = 0; j < order.length; j++) { var k = order[(off + j) % order.length]; if (used[k] == null) return k; }
      return order[(off + i) % order.length];
    }
    var used = {};
    floors.forEach(function (f, i) {
      if (f.kind === 'lobby' || f.kind === 'roof') return;
      var s = st.fl[f.id]; f.kind = s && s.kind ? s.kind : smartKind(f, i); used[f.kind] = i; f.locked = !!(s && s.locked);
    });
    var y = 0; floors.forEach(function (f, i) { f.i = i; f.y = y; f.h = f.kind === 'lobby' ? LOBBY_H : f.kind === 'roof' ? 0 : FH; y += f.h; });
    var TOP = floors[floors.length - 1].y;
    st.floor = clamp(saved.floor || 0, 0, floors.length - 1);
    var startAt = src.col ? floors.filter(function (f) { return f.items.some(function (it) { return it.ref.col === src.col; }) || f.id.split(/[#+]/).indexOf(src.col) >= 0; })[0] : null;   // started from a List: go to its floor
    function label(f) { return f.kind === 'lobby' ? '1' : f.kind === 'roof' ? 'R' : String(f.i + 1); }

    // ---------------- DOM
    var root = document.createElement('div'); root.className = 'ks-root';
    root.innerHTML = '<canvas class="ks-gl"></canvas>' +
      '<div class="ks-top"><div class="ks-pill"><i></i><span><b></b><small></small></span></div><button type="button" class="ks-b" data-ks="exit" aria-label="Exit">✕</button></div>' +
      '<div class="ks-toast"></div>' +
      '<div class="ks-panel" aria-label="Elevator"><div class="ks-disp"><span class="ks-arrow"></span><b class="ks-num"></b></div><div class="ks-floors"></div></div>' +
      '<div class="ks-bar"><button type="button" class="ks-b" data-ks="skyline">🏙 <span>Skyline</span></button><button type="button" class="ks-b" data-ks="cut">◧ <span>Cutaway</span></button><button type="button" class="ks-b" data-ks="suggest">✨ <span>Suggest</span></button><button type="button" class="ks-b ks-lock" data-ks="lock"></button></div>' +
      '<div class="ks-lift" hidden><div class="ks-door l"></div><div class="ks-door r"></div><div class="ks-liftdisp"><span class="ks-arrow"></span><b></b><small></small></div><p>Tap to skip</p></div>';
    (opts.container || document.body).appendChild(root);
    var $ = function (s) { return root.querySelector(s); }, cvs = $('.ks-gl');
    $('.ks-floors').innerHTML = floors.slice().reverse().map(function (f) { return '<button type="button" data-ks="go" data-f="' + f.i + '" title="' + esc(f.name) + '"><b>' + label(f) + '</b><span>' + esc(f.name) + '</span></button>'; }).join('');

    // ---------------- renderer, night city
    var dpr = Math.min(window.devicePixelRatio || 1, 2), R = new T.WebGLRenderer({ canvas: cvs, antialias: dpr < 2 }); R.setPixelRatio(dpr);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(55, 1, .1, 900);
    scene.background = new T.Color('#0b1022'); scene.fog = new T.Fog('#141a33', 160, 620);
    var hemi = new T.HemisphereLight('#9fb4ff', '#1a1a22', .75), moon = new T.DirectionalLight('#c8d4ff', .55); moon.position.set(-60, 120, 80); scene.add(hemi, moon); var lamp = new T.PointLight('#ffd9a0', .65, 30, 1.4); scene.add(lamp);
    var skyGeo = new T.SphereGeometry(700, 16, 10), col = [], c0 = new T.Color('#050817'), c1 = new T.Color('#1a2350'), c2 = new T.Color('#4a3f6b'), pa = skyGeo.attributes.position;
    for (var si = 0; si < pa.count; si++) { var yy = pa.getY(si) / 700, cc = new T.Color(); if (yy < .05) cc.copy(c2); else if (yy < .3) cc.copy(c2).lerp(c1, (yy - .05) / .25); else cc.copy(c1).lerp(c0, Math.min(1, (yy - .3) / .5)); col.push(cc.r, cc.g, cc.b); }
    skyGeo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); scene.add(new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false })));
    (function stars() { var g = new T.BufferGeometry(), p = [], r = K.rng(7); for (var i = 0; i < 500; i++) { var a = r() * 6.28, b = .15 + r() * 1.3, d = 650; p.push(Math.cos(a) * Math.cos(b) * d, Math.sin(b) * d, Math.sin(a) * Math.cos(b) * d); } g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: '#dfe6ff', size: 1.6, sizeAttenuation: false, fog: false }))); })();
    var ground = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshStandardMaterial({ color: '#1a1e2a', roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    (function city() {   // the skyline around the tower (instanced, lit windows), roads and a little plaza
      var KT = K.kit(), r = K.rng(seed + 11), m = new T.Matrix4(), q = new T.Quaternion(), list = [];
      for (var i = 0; i < 220; i++) { var a = r() * 6.28, d = 48 + Math.pow(r(), .7) * 260, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 26 && z > 0 && z < 60) continue; list.push([x, z, 10 + r() * 22, 6 + r() * Math.min(48, 8 + (d - 40) * .22), r() * .4]); }
      var im = new T.InstancedMesh(KT.bldg.geo, KT.bldg.mat, list.length), cl = new T.Color();
      list.forEach(function (b, i) { q.setFromAxisAngle(new T.Vector3(0, 1, 0), b[4]); m.compose(new T.Vector3(b[0], 0, b[1]), q, new T.Vector3(b[2], b[3], b[2] * .9)); im.setMatrixAt(i, m); cl.setHSL(.62 + r() * .06, .15, .35 + r() * .2); im.setColorAt(i, cl); });
      scene.add(im);
      var roadM = new T.MeshStandardMaterial({ color: '#2a2e38', roughness: 1 }); [[0, 24, 600, 10], [0, -40, 600, 10]].forEach(function (rd) { var g = new T.Mesh(new T.PlaneGeometry(rd[2], rd[3]), roadM); g.rotation.x = -Math.PI / 2; g.position.set(rd[0], .02, rd[1]); scene.add(g); });
      var plaza = new T.Mesh(new T.BoxGeometry(FW + 14, .3, FD + 14), new T.MeshStandardMaterial({ color: '#3a3f4c', flatShading: true })); plaza.position.y = .15; scene.add(plaza);
      for (var t = 0; t < 8; t++) { var tr = new T.Mesh(KT.round.geo, KT.round.mat); var ang = t / 8 * 6.28; tr.position.set(Math.cos(ang) * (FW / 2 + 5), .3, Math.sin(ang) * (FD / 2 + 5)); tr.scale.setScalar(.6); scene.add(tr); }
    })();

    // ---------------- the tower
    var M = function (c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .8 }, o || {})); };
    var mat = { slab: M('#e8eef6'), frame: M('#3f5f8f', { metalness: .3, roughness: .5 }), inner: M('#f3efe6', { emissive: '#4a3a24', emissiveIntensity: .35 }), glass: M('#5d8fd0', { transparent: true, opacity: .32, metalness: .4, roughness: .1, depthWrite: false }),
      glassCut: M('#5d8fd0', { transparent: true, opacity: .32, metalness: .4, roughness: .1, depthWrite: false }), light: new T.MeshBasicMaterial({ color: '#fff0cc' }), ceil: M('#ece6da', { emissive: '#3a3024', emissiveIntensity: .4 }), shaft: M('#cfd6e0', { metalness: .3 }), car: M('#c9a24a', { metalness: .5, roughness: .4 }), win: new T.MeshBasicMaterial({ color: '#ffd98a' }) };
    var tower = new T.Group(), cutMull = new T.Group(), floorGroups = []; scene.add(tower); tower.add(cutMull);
    function box(w, h, d, m, x, y2, z, g) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y2, z); (g || tower).add(o); return o; }
    floors.forEach(function (f) {
      var g = new T.Group(); g.userData.floor = f.i; floorGroups.push(g); tower.add(g); f.g = g;
      var fm = M(FLOORCOL[f.kind] || '#d8d2c6', { emissive: '#5a4020', emissiveIntensity: .3 }); f.floorMat = fm;
      var slab = box(FW + .4, .4, FD + .4, mat.frame, 0, f.y + .2, 0, g); slab.userData.floor = f.i;
      var fl = box(FW - .4, .05, FD - .4, fm, 0, f.y + .42, 0, g); fl.userData.floor = f.i;
      if (f.kind === 'roof') return buildRoof(f);
      var h = f.h;
      box(.3, h - .4, FD, mat.inner, -FW / 2 + .15, f.y + .4 + (h - .4) / 2, 0, g).userData.floor = f.i;   // left wall
      box(FW, h - .4, .3, mat.inner, 0, f.y + .4 + (h - .4) / 2, -FD / 2 + .15, g).userData.floor = f.i;   // back wall
      box(FW, .12, FD, mat.ceil, 0, f.y + h - .06, 0, g); [-4.5, 0, 4.5].forEach(function (zz) { box(FW - 4, .04, .9, mat.light, 0, f.y + h - .13, zz, g); });   // ceiling with light strips
      // glass: front and right are cut away in the Cutaway view; back and left keep a skin
      var front = new T.Mesh(new T.PlaneGeometry(FW, h - .4), mat.glassCut); front.position.set(0, f.y + .4 + (h - .4) / 2, FD / 2 + .05); front.userData.floor = f.i; tower.add(front);
      var right = new T.Mesh(new T.PlaneGeometry(FD, h - .4), mat.glassCut); right.rotation.y = Math.PI / 2; right.position.set(FW / 2 + .05, f.y + .4 + (h - .4) / 2, 0); right.userData.floor = f.i; tower.add(right);
      var back = new T.Mesh(new T.PlaneGeometry(FW, h - .4), mat.glass); back.rotation.y = Math.PI; back.position.set(0, f.y + .4 + (h - .4) / 2, -FD / 2 - .05); tower.add(back);
      var left = new T.Mesh(new T.PlaneGeometry(FD, h - .4), mat.glass); left.rotation.y = -Math.PI / 2; left.position.set(-FW / 2 - .05, f.y + .4 + (h - .4) / 2, 0); tower.add(left);
      for (var x = -FW / 2; x <= FW / 2 + .01; x += 2.2) box(.12, h - .4, .12, mat.frame, x, f.y + .4 + (h - .4) / 2, FD / 2 + .08, cutMull);
      for (var z = -FD / 2; z <= FD / 2 + .01; z += 2.2) box(.12, h - .4, .12, mat.frame, FW / 2 + .08, f.y + .4 + (h - .4) / 2, z, cutMull);
      for (var z2 = -FD / 2; z2 <= FD / 2 + .01; z2 += 2.2) box(.12, h - .4, .12, mat.frame, -FW / 2 - .08, f.y + .4 + (h - .4) / 2, z2);
      for (var x2 = -FW / 2; x2 <= FW / 2 + .01; x2 += 2.2) box(.12, h - .4, .12, mat.frame, x2, f.y + .4 + (h - .4) / 2, -FD / 2 - .08);
      // the floor number on the back wall, beside the elevator
      var nt = numTex(label(f), f.name), np = new T.Mesh(new T.PlaneGeometry(2.6, .8), new T.MeshBasicMaterial({ map: nt, toneMapped: false })); np.position.set(-3.4, f.y + 2.9, -FD / 2 + .32); g.add(np);
      // the elevator doors on this floor (in the core)
      box(2.6, 2.7, .1, mat.car, 0, f.y + .4 + 1.35, -FD / 2 + 2.85, g);
    });
    box(3.4, TOP + 1.5, 2.4, mat.shaft, 0, (TOP + 1.5) / 2, -FD / 2 + 1.5);   // the core
    var car = box(2.8, 3, 2, mat.car, 0, 0, -FD / 2 + 1.5); car.position.z = -FD / 2 + 1.5; car.renderOrder = 2;
    var crown = box(FW + .8, 1.2, FD + .8, mat.frame, 0, TOP - .6, 0); crown.visible = false;
    function numTex(n, name) { var c = document.createElement('canvas'); c.width = 512; c.height = 160; var x = c.getContext('2d'); x.fillStyle = '#1d2433'; x.fillRect(0, 0, 512, 160); x.fillStyle = '#ffd38a'; x.font = '800 96px ' + FONT; x.textBaseline = 'middle'; x.fillText(n, 24, 84); x.fillStyle = '#fff'; x.font = '600 34px ' + FONT; var t = name; while (x.measureText(t).width > 330 && t.length > 4) t = t.slice(0, -2) + '…'; x.fillText(t, 150, 84); return new T.CanvasTexture(c); }
    function buildRoof(f) {
      var g = f.g, KT = K.kit();
      [[FW + .4, .9, .25, 0, f.y + .85, FD / 2], [FW + .4, .9, .25, 0, f.y + .85, -FD / 2], [.25, .9, FD + .4, FW / 2, f.y + .85, 0], [.25, .9, FD + .4, -FW / 2, f.y + .85, 0]].forEach(function (b) { box(b[0], b[1], b[2], mat.glass, b[3], b[4], b[5], g); });
      var dome = new T.Mesh(new T.SphereGeometry(4.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M('#a8c8f0', { transparent: true, opacity: .3, metalness: .5, roughness: .1, depthWrite: false })); dome.position.set(-5, f.y + .4, -3); g.add(dome);
      var tele = new T.Group(); box(.5, 1.2, .5, M('#3a3f4c'), 0, .6, 0, tele); var tube = box(.45, .45, 3, M('#d8dde6', { metalness: .4 }), 0, 1.6, .4, tele); tube.rotation.x = -.6; tele.position.set(-5, f.y + .4, -3); g.add(tele);
      for (var i = 0; i < 5; i++) { var tr = new T.Mesh(KT.bush.geo, KT.bush.mat); tr.position.set(6 + (i % 2) * 2, f.y + .45, -5 + i * 2.4); g.add(tr); }
    }

    // ---------------- exhibitions: fixtures + card slots (low-detail colour far away, the card's art nearby)
    var items = [], picks = [], texCache = new Map();
    var woodM = M('#7a5537'), darkM = M('#2b2f36'), brassM = M('#c9a24a', { metalness: .5, roughness: .4 }), glassM = M('#bfe0ff', { transparent: true, opacity: .18, depthWrite: false, metalness: .3, roughness: .1 });
    function slot(f, x, y2, z, ry, w, h, extra) { var s = { f: f, pos: new T.Vector3(x, f.y + y2, z), ry: ry, w: w, h: h, extra: extra }; return s; }
    function layout(f) {   // where the cards go, by exhibition kind (camera stands at the elevator, looking to the front glass)
      var S = [], g = f.ex, L = -FW / 2 + .32, Rx = 3.2;   // you stand by the front-right glass, looking at the left wall and the core
      if (f.kind === 'wall') {
        box(.12, 3, 11, M('#2e4a3c'), L - .05, f.y + 2.1, 1, g);
        for (var r = 0; r < 2; r++) for (var c2 = 0; c2 < 4; c2++) S.push(slot(f, L + .03, 2.85 - r * 1.35, -3.2 + c2 * 2.75, Math.PI / 2, 2.2, 1.2));
        box(.12, 2.6, 5.4, M('#2e4a3c'), Rx, f.y + 1.9, -2.5, g); box(.3, 1, .3, darkM, Rx, f.y + .9, -5, g); box(.3, 1, .3, darkM, Rx, f.y + .9, 0, g);
        for (var c3 = 0; c3 < 2; c3++) S.push(slot(f, Rx + .08, 2.2, -3.8 + c3 * 2.6, Math.PI / 2, 2.2, 1.3));
      } else if (f.kind === 'books') {
        [[L + .45, Math.PI / 2, -4, 9], [Rx, Math.PI / 2, -6.5, 6]].forEach(function (bc, bi) {
          var len = bc[3], cz = bc[2] + len / 2; box(.8, 3.3, len, woodM, bc[0], f.y + .4 + 1.65, cz, g);
          for (var sh = 0; sh < 3; sh++) { box(.86, .08, len, woodM, bc[0], f.y + .9 + sh * 1.05, cz, g);
            var spines = new T.InstancedMesh(new T.BoxGeometry(.6, .7, .14), M('#ffffff'), 18), mm = new T.Matrix4(), cl = new T.Color(), rr = K.rng(seed + f.i * 9 + sh + bi * 3);
            for (var k = 0; k < 18; k++) { var hz = .55 + rr() * .3; mm.compose(new T.Vector3(bc[0], f.y + .95 + sh * 1.05 + hz / 2, bc[2] + .4 + k * (len - .8) / 18), new T.Quaternion(), new T.Vector3(1, hz / .7, 1)); spines.setMatrixAt(k, mm); cl.setHSL(rr(), .45, .45); spines.setColorAt(k, cl); }
            g.add(spines); }
          var n = bi ? 4 : 6; for (var b = 0; b < n; b++) S.push(slot(f, bc[0] + .45, 1.45 + (b % 2) * 1.05, bc[2] + 1 + Math.floor(b / 2) * (len - 2) / Math.max(1, Math.ceil(n / 2) - 1 || 1), bc[1], .8, 1.1));
        });
      } else if (f.kind === 'gallery') {
        for (var gi = 0; gi < 5; gi++) { S.push(slot(f, L + .06, 2.2, -4.2 + gi * 2.6, Math.PI / 2, 2.1, 1.45, 'frame')); box(.3, .1, .3, M('#fff5d6', { emissive: '#ffe7b0', emissiveIntensity: 1 }), L + .5, f.y + 3.5, -4.2 + gi * 2.6, g); }
        [[Rx, -4.6], [Rx, -.8]].forEach(function (p, pi) { box(.2, 2.8, 3.2, M('#f2efe8'), p[0], f.y + 1.8, p[1], g); S.push(slot(f, p[0] + .12, 2.1, p[1], Math.PI / 2, 2.2, 1.5, 'frame')); });
        box(.9, .45, 3, woodM, -3, f.y + .62, 2, g);
      } else if (f.kind === 'cabinet') {
        [[-5.2, -3.6], [-.6, -3.6], [-5.2, .9], [-.6, .9]].forEach(function (cp, ci) {
          box(3.6, .9, 1.4, woodM, cp[0], f.y + .85, cp[1], g); var gl = box(3.6, 1.8, 1.4, glassM, cp[0], f.y + 2.2, cp[1], g); gl.renderOrder = 3;
          S.push(slot(f, cp[0] - .85, 2.15, cp[1] + .1, 0, 1.4, .9)); S.push(slot(f, cp[0] + .85, 2.15, cp[1] + .1, 0, 1.4, .9));
        });
        box(.8, 3, 7, woodM, L + .5, f.y + 1.9, 1, g); S.push(slot(f, L + .95, 2.2, -1, Math.PI / 2, 1.5, 1)); S.push(slot(f, L + .95, 2.2, 2.6, Math.PI / 2, 1.5, 1));
      } else if (f.kind === 'sculpt') {
        for (var pi2 = 0; pi2 < 8; pi2++) { var px = -7.5 + (pi2 % 4) * 3.4, pz = -4.5 + Math.floor(pi2 / 4) * 4.2; box(1.1, 1.1, 1.1, M('#f2efe8'), px, f.y + .95, pz, g); S.push(slot(f, px, 1.05, pz + .58, 0, .85, .55, 'sculpt')); }
      } else if (f.kind === 'orbs') {
        for (var oi = 0; oi < 9; oi++) { var a = -1.05 + oi * .26, ox = -2 + Math.sin(a) * 7, oz = -1 - Math.cos(a) * 4; box(.25, 1.2, .25, brassM, ox, f.y + 1, oz, g); S.push(slot(f, ox, 2.15, oz, .5 + Math.sin(a) * .4, .85, .55, 'orb')); }
      } else if (f.kind === 'lobby') {
        box(5, 1.1, 1.4, woodM, 3, f.y + .95, 1, g); box(5.2, .1, 1.6, brassM, 3, f.y + 1.55, 1, g);
        var dt = dirTex(), dp = new T.Mesh(new T.PlaneGeometry(4.4, 4.4 * dt.image.height / dt.image.width), new T.MeshBasicMaterial({ map: dt, toneMapped: false })); dp.rotation.y = Math.PI / 2; dp.position.set(L + .05, f.y + 2.8, -1.5); dp.userData.kind = 'directory'; g.add(dp); picks.push(dp);
        var tt = numTex('', board.title), tp = new T.Mesh(new T.PlaneGeometry(5.2, 1.6), new T.MeshBasicMaterial({ map: tt, toneMapped: false })); tp.position.set(0, f.y + 4.4, -FD / 2 + 2.82); g.add(tp);
        var KT = K.kit(); [[-6, 5], [6, -5], [-8, -4]].forEach(function (pp) { var tr = new T.Mesh(KT.round.geo, KT.round.mat); tr.scale.setScalar(.45); tr.position.set(pp[0], f.y + .4, pp[1]); g.add(tr); });
      } else if (f.kind === 'roof') {   // Discovery Observatory: the board's picture cards on stands under the sky
        for (var ri = 0; ri < 6; ri++) { var rx2 = -7 + (ri % 3) * 3.4, rz = 1 + Math.floor(ri / 3) * 3.4; box(.2, 1.1, .2, darkM, rx2, f.y + 1, rz, g); S.push(slot(f, rx2, 2, rz, .6, 1.8, 1.15)); }
      }
      return S;
    }
    function dirTex() {
      var rows = floors.slice().reverse(), c = document.createElement('canvas'); c.width = 600; c.height = 110 + rows.length * 62; var x = c.getContext('2d');
      x.fillStyle = '#1d2433'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#ffd38a'; x.font = '800 44px ' + FONT; x.textBaseline = 'middle'; x.fillText('Directory', 30, 56);
      rows.forEach(function (f, i) { var yy = 120 + i * 62; x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(20, yy - 26, 560, 52); x.fillStyle = '#ffd38a'; x.font = '800 34px ' + FONT; x.fillText(label(f), 40, yy); x.fillStyle = '#fff'; x.font = '500 28px ' + FONT; var t = f.name + (f.kind && KINDS.filter(function (k) { return k[0] === f.kind; })[0] ? ' · ' + KINDS.filter(function (k) { return k[0] === f.kind; })[0][1].replace(/^\S+\s/, '') : ''); while (x.measureText(t).width > 470 && t.length > 4) t = t.slice(0, -2) + '…'; x.fillText(t, 100, yy); });
      return new T.CanvasTexture(c);
    }
    function sculptObj(I, f, s) {   // a low-poly piece above the plaque, its shape and colour from the card
      var h = K.hash(I ? I.ref.id : 'x'), shapes = [new T.IcosahedronGeometry(.45, 0), new T.TorusKnotGeometry(.3, .1, 40, 6), new T.OctahedronGeometry(.5, 0), new T.DodecahedronGeometry(.45, 0), new T.ConeGeometry(.42, .9, 6)];
      var o = new T.Mesh(shapes[h % shapes.length], M(K.PAL[h % K.PAL.length], { metalness: .2, roughness: .5 })); o.position.set(s.pos.x, f.y + 2.05, s.pos.z - .58); o.userData.spin = .4 + (h % 5) * .1; f.ex.add(o); return o;
    }
    function buildExhibition(f) {
      if (f.ex) { f.g.remove(f.ex); f.ex.traverse(function (o) { if (o.isMesh && !o.isInstancedMesh && o.geometry) o.geometry.dispose(); }); items = items.filter(function (it) { if (it.f === f) { var i = picks.indexOf(it.mesh); if (i >= 0) picks.splice(i, 1); return false; } return true; }); }
      f.ex = new T.Group(); f.g.add(f.ex); f.floorMat.color.set(FLOORCOL[f.kind] || '#d8d2c6');
      var slots = layout(f), list = f.kind === 'roof' ? highlights() : f.items;
      slots.forEach(function (s, i) {
        var it = list[i]; if (!it) return;
        var I = K.info(P, it.ref), color = K.PAL[(f.i + i) % K.PAL.length];
        var mesh = new T.Mesh(new T.PlaneGeometry(s.w, s.h), new T.MeshBasicMaterial({ color: color, toneMapped: false })); mesh.position.copy(s.pos); mesh.rotation.y = s.ry; f.ex.add(mesh);
        if (s.extra === 'frame') { var fr = new T.Mesh(new T.BoxGeometry(s.w + .24, s.h + .24, .08), brassM); fr.position.copy(s.pos); fr.rotation.y = s.ry; fr.translateZ(-.05); f.ex.add(fr); }
        if (s.extra === 'orb') { var orb = new T.Mesh(new T.SphereGeometry(.7, 16, 12), M('#9fd0ff', { transparent: true, opacity: .22, emissive: '#6fb0ff', emissiveIntensity: .6, depthWrite: false })); orb.position.copy(s.pos); f.ex.add(orb); }
        var obj = s.extra === 'sculpt' ? sculptObj(I, f, s) : null;
        var rec = { f: f, s: s, ref: it.ref, I: I, mesh: mesh, obj: obj, color: color, lod: null }; mesh.userData.item = rec; items.push(rec); picks.push(mesh);
      });
      if (!list.length && f.kind !== 'lobby') toastLater = 'This hall is waiting for its first card';
    }
    function highlights() { var out = []; floors.forEach(function (f) { f.items.forEach(function (it) { var I = K.info(P, it.ref); if (I && I.img && out.length < 6 && !out.some(function (o) { return o.ref.col === it.ref.col; })) out.push(it); }); }); floors.forEach(function (f) { f.items.forEach(function (it) { var I = K.info(P, it.ref); if (I && I.img && out.length < 6 && out.indexOf(it) < 0) out.push(it); }); }); return out; }
    var toastLater = null;
    floors.forEach(buildExhibition);
    function lodPass() {   // the current floor and its neighbours get the cards' art; the others stay plain colour
      var cur = st.view === 'floor' || st.view === 'lift' ? st.floor : -99;
      items.forEach(function (it) {
        var want = Math.abs(it.f.i - cur) <= 1 || (st.view === 'cut' && it.f.i === st.hover) ? 'near' : 'flat';
        if (want === it.lod || !it.I) return; it.lod = want; var m = it.mesh.material;
        if (want === 'flat') { m.map = null; m.color.set(it.color); m.needsUpdate = true; return; }
        var key = it.I.ref.id + ':' + it.I.sig, hit = texCache.get(key);
        (hit ? Promise.resolve(hit) : K.loadImg(it.I.img).then(function (im) { var t = K.drawBoard(it.I, 'near', im, it.color); texCache.set(key, t); return t; })).then(function (t) { if (it.lod === 'near') { m.map = t; m.color.set('#fff'); m.needsUpdate = true; } });
      });
      if (texCache.size > 60) { var inUse = new Set(items.map(function (x) { return x.mesh.material.map; })); texCache.forEach(function (t, k) { if (!inUse.has(t) && texCache.size > 40) { t.dispose(); texCache.delete(k); } }); }
      floors.forEach(function (f) { f.ex.visible = st.view !== 'floor' && st.view !== 'lift' || Math.abs(f.i - st.floor) <= 1; });
    }

    // ---------------- styles
    function applyExt() {
      var E = EXTS.filter(function (e) { return e.id === st.ext; })[0] || EXTS[0];
      mat.glass.color.set(E.glass); mat.glassCut.color.set(E.glass); mat.frame.color.set(E.frame); mat.inner.color.set(E.inner);
    }
    // ---------------- camera: tweens (skippable), orbit outside, look-around inside
    var camPos = new T.Vector3(), camTgt = new T.Vector3(), tmpP = new T.Vector3(), tmpT = new T.Vector3();
    function outsidePose(cut) { var d = (cut ? 62 : 78) * st.dist, cy = TOP / 2 + (cut ? 0 : 4), yaw = st.yaw, p = st.pitch; return { p: new T.Vector3(Math.sin(yaw) * Math.cos(p) * d, cy + Math.sin(p) * d, Math.cos(yaw) * Math.cos(p) * d), t: new T.Vector3(0, cy - (cut ? 2 : 0), 0) }; }
    function floorPose(i) { var f = floors[i]; if (f.kind === 'roof') return { p: new T.Vector3(6, f.y + 2.4, 7), t: new T.Vector3(-5, f.y + 1.6, -1) }; return { p: new T.Vector3(8.4, f.y + 1.75, 6.2), t: new T.Vector3(-5.5, f.y + 1.75, -3.2) }; }
    function tween(to, dur, then) { st.tw = { p0: camPos.clone(), t0: camTgt.clone(), p1: to.p, t1: to.t, t: 0, dur: dur, then: then }; }
    function skipTween() { if (!st.tw) return false; st.tw.t = st.tw.dur; return true; }

    // ---------------- views
    function hud() {
      var f = floors[st.floor], k = KINDS.filter(function (x) { return x[0] === f.kind; })[0];
      $('.ks-pill i').style.background = (EXTS.filter(function (e) { return e.id === st.ext; })[0] || EXTS[0]).glass;
      $('.ks-pill b').textContent = st.view === 'skyline' ? board.title : st.view === 'cut' ? board.title + ' · Cutaway' : label(f) + 'F · ' + f.name;
      $('.ks-pill small').textContent = st.view === 'skyline' ? floors.length + ' floors · tap the tower to go in' : st.view === 'cut' ? 'Tap any floor to walk straight in' : (k ? k[1] : f.kind === 'lobby' ? 'Lobby · Directory' : 'Rooftop · Discovery Observatory') + ' · ' + (f.kind === 'roof' ? 6 : f.items.length) + ' items' + (f.locked ? ' · 🔒' : '');
      $('.ks-num').textContent = label(f); root.dataset.view = st.view;
      root.querySelectorAll('.ks-floors button').forEach(function (b) { b.classList.toggle('on', +b.dataset.f === st.floor && (st.view === 'floor' || st.view === 'lift')); });
      var lk = $('.ks-lock'); lk.hidden = st.view !== 'floor' || f.kind === 'lobby' || f.kind === 'roof'; lk.innerHTML = f.locked ? '🔒 <span>Locked</span>' : '🔓 <span>Lock floor</span>';
      persist();
    }
    function toSkyline() { putBack(); st.view = 'skyline'; st.cutTo = 0; tween(outsidePose(false), 1.4); hud(); lodPass(); }
    function toCut() { putBack(); st.view = 'cut'; st.cutTo = 1; tween(outsidePose(true), 1.1); hud(); lodPass(); toast('Tap any floor to go in'); }
    function enter(i, how) {   // walk straight into a floor (from the cutaway / skyline)
      putBack(); st.floor = i; st.view = 'floor'; st.cutTo = st.cutTo; st.lookYaw = st.lookPitch = 0; lodPass(); hud();
      tween(floorPose(i), how === 'fly' ? 1.5 : .9, function () { st.cutTo = 0; if (toastLater && !floors[i].items.length && floors[i].kind !== 'lobby' && floors[i].kind !== 'roof') toast(toastLater); });
    }
    // Elevator: doors close, the floor numbers roll, doors open — tap to skip; short rides for nearby floors
    function ride(i) {
      if (i === st.floor && st.view === 'floor') return; putBack();
      if (st.view !== 'floor') return enter(i, 'fly');
      var from = st.floor, dir = i > from ? 1 : -1, lift = $('.ks-lift'), steps = Math.abs(i - from), per = clamp(1.4 / steps, .12, .32);
      st.view = 'lift'; lift.hidden = false; lift.classList.remove('open'); $('.ks-liftdisp .ks-arrow').textContent = dir > 0 ? '▲' : '▼'; $('.ks-panel .ks-arrow').textContent = dir > 0 ? '▲' : '▼';
      $('.ks-liftdisp b').textContent = label(floors[from]); $('.ks-liftdisp small').textContent = floors[i].name; hap();
      requestAnimationFrame(function () { lift.classList.add('shut'); });
      var cur = from, timer = null, done = false;
      function finish() {
        if (done) return; done = true; clearInterval(timer); st.floor = i; $('.ks-liftdisp b').textContent = label(floors[i]); $('.ks-panel .ks-arrow').textContent = '';
        var pose = floorPose(i); camPos.copy(pose.p); camTgt.copy(pose.t); st.tw = null; st.view = 'floor'; st.lookYaw = st.lookPitch = 0; lodPass(); hud();
        lift.classList.add('open'); lift.classList.remove('shut'); setTimeout(function () { lift.hidden = true; lift.classList.remove('open'); }, 520); lift.onclick = null;
      }
      lift.onclick = finish;
      setTimeout(function () { if (done) return; timer = setInterval(function () { cur += dir; $('.ks-liftdisp b').textContent = label(floors[cur]); $('.ks-num').textContent = label(floors[cur]); st.carY = floors[cur].y; if (cur === i) { clearInterval(timer); setTimeout(finish, 260); } }, per * 1000); }, 480);
    }

    // ---------------- items: tap → slides out to you; tap again → flips; tap elsewhere → back in place
    var reader = new T.Group(), rFront = new T.Mesh(new T.PlaneGeometry(1.6, 1), new T.MeshBasicMaterial({ toneMapped: false })), rBack = new T.Mesh(new T.PlaneGeometry(1.6, 1), new T.MeshBasicMaterial({ toneMapped: false })), rFace = new T.Group();
    rBack.rotation.y = Math.PI; rBack.position.z = -.035; rFace.add(rFront, rBack); var rFrame = new T.Mesh(new T.BoxGeometry(1.68, 1.08, .02), brassM); rFrame.position.z = -.012; rFace.add(rFrame); reader.add(rFace); reader.visible = false; scene.add(reader);
    rFront.userData.kind = rBack.userData.kind = 'reader';
    function pullOut(it) {
      if (!it.I) return; putBack(true); hap(); st.read = { it: it, t: 0, flip: 0, out: true };
      rFront.material.map = it.mesh.material.map; rFront.material.color.set(it.mesh.material.map ? '#fff' : it.color); rFront.material.needsUpdate = true;
      if (rBack.material.map) rBack.material.map.dispose(); rBack.material.map = K.drawBack(it.I, it.color); rBack.material.needsUpdate = true;
      reader.visible = true; it.mesh.visible = false; rFace.rotation.y = 0;
      if (!it.mesh.material.map) K.loadImg(it.I.img).then(function (im) { if (st.read && st.read.it === it) { rFront.material.map = K.drawBoard(it.I, 'near', im, it.color); rFront.material.color.set('#fff'); rFront.material.needsUpdate = true; } });
      toast('Tap it to flip · tap anywhere to put it back');
    }
    function putBack(now) { var r = st.read; if (!r) return; if (now) { r.it.mesh.visible = true; reader.visible = false; st.read = null; } else { r.out = false; r.t = 0; } }

    // ---------------- input: orbit outside, look around inside, taps
    var down = null, ray = new T.Raycaster(), ndc = new T.Vector2(), pinch = null;
    function pick(x, y2, list) { var r = cvs.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y2 - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.intersectObjects(list, true)[0]; }
    cvs.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY }; try { cvs.setPointerCapture(e.pointerId); } catch (x) {} });
    cvs.addEventListener('pointermove', function (e) {
      if (!down) { if (e.pointerType === 'mouse') { var h = pick(e.clientX, e.clientY, st.view === 'cut' ? floorGroups : st.view === 'skyline' ? [tower] : picks.concat([rFront, rBack])); cvs.style.cursor = h ? 'pointer' : ''; if (st.view === 'cut') { var fi = h && floorIndex(h.object); if (fi !== st.hover) { st.hover = fi; lodPass(); } } } return; }
      var dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) return; down.drag = true; skipTween();
      if (st.view === 'skyline' || st.view === 'cut') { st.yaw -= dx * .006; st.pitch = clamp(st.pitch + dy * .004, -.05, .9); var o = outsidePose(st.view === 'cut'); camPos.copy(o.p); camTgt.copy(o.t); }
      else if (st.view === 'floor') { st.lookYaw = clamp(st.lookYaw - dx * .004, -1.3, 1.3); st.lookPitch = clamp(st.lookPitch + dy * .003, -.35, .35); }
    });
    cvs.addEventListener('pointerup', function (e) {
      var d = down; down = null; if (!d || d.drag || performance.now() - d.t > 700) return;
      if (skipTween()) return;
      if (st.view === 'skyline') { if (pick(e.clientX, e.clientY, [tower])) enter(0, 'fly'); return; }
      if (st.view === 'cut') { var h = pick(e.clientX, e.clientY, floorGroups); var fi = h && floorIndex(h.object); if (fi != null) enter(fi, 'fly'); return; }
      if (st.view !== 'floor') return;
      var hit = pick(e.clientX, e.clientY, picks.concat(st.read ? [rFront, rBack] : []));
      if (hit && hit.object.userData.kind === 'reader') { st.read.flip = st.read.flip ? 0 : 1; hap(); return; }
      if (hit && hit.object.userData.kind === 'directory') { var uv = hit.uv, idx = Math.floor(((1 - uv.y) * (110 + floors.length * 62) - 94) / 62); var f = floors.slice().reverse()[idx]; if (f) ride(f.i); return; }
      if (hit && hit.object.userData.item) { var it = hit.object.userData.item; if (st.read && st.read.it === it) return; return pullOut(it); }
      if (st.read) putBack();
    });
    cvs.addEventListener('wheel', function (e) { if (st.view === 'skyline' || st.view === 'cut') { e.preventDefault(); st.dist = clamp(st.dist * (1 + e.deltaY * .001), .45, 1.6); skipTween(); var o = outsidePose(st.view === 'cut'); camPos.copy(o.p); camTgt.copy(o.t); } }, { passive: false });
    cvs.addEventListener('touchstart', function (e) { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), s: st.dist }; }, { passive: true });
    cvs.addEventListener('touchmove', function (e) { if (pinch && e.touches.length === 2 && st.view !== 'floor') { var dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); st.dist = clamp(pinch.s * pinch.d / dd, .45, 1.6); var o = outsidePose(st.view === 'cut'); camPos.copy(o.p); camTgt.copy(o.t); } }, { passive: true });
    cvs.addEventListener('touchend', function () { pinch = null; });
    function floorIndex(o) { while (o && o.userData.floor == null) o = o.parent; return o ? o.userData.floor : null; }
    function act(k, el) {
      if (k === 'exit') { if (st.view === 'floor' || st.view === 'cut') return toSkyline(); return self.close(); }
      if (k === 'skyline') toSkyline();
      else if (k === 'cut') { if (st.view === 'cut') enter(st.floor, 'fly'); else toCut(); }
      else if (k === 'go') ride(+el.dataset.f);
      else if (k === 'lock') { var f = floors[st.floor]; f.locked = !f.locked; st.fl[f.id] = { kind: f.kind, locked: f.locked }; toast(f.locked ? '🔒 This floor keeps its exhibition' : '🔓 Suggest may restyle this floor'); hud(); }
      else if (k === 'suggest') suggest();
      hap();
    }
    function suggest() {
      if (st.view === 'skyline') { var i = EXTS.findIndex(function (e) { return e.id === st.ext; }); st.ext = EXTS[(i + 1) % EXTS.length].id; applyExt(); toast('✨ ' + EXTS[(i + 1) % EXTS.length].name); hud(); return; }
      var targets = st.view === 'floor' ? [floors[st.floor]] : floors, n = 0;
      targets.forEach(function (f) {
        if (f.kind === 'lobby' || f.kind === 'roof') return; if (f.locked) { if (st.view === 'floor') toast('🔒 This floor is locked'); return; }
        var i2 = KINDS.findIndex(function (k) { return k[0] === f.kind; }), nb = [floors[f.i - 1], floors[f.i + 1]].map(function (x) { return x && x.kind; });   // never the same style as the floor above or below
        for (var step = 1; step <= KINDS.length; step++) { var cand = KINDS[(i2 + step) % KINDS.length][0]; if (nb.indexOf(cand) < 0) { f.kind = cand; break; } } st.fl[f.id] = { kind: f.kind, locked: false }; buildExhibition(f); n++;
      });
      if (st.view === 'cut') { var j = EXTS.findIndex(function (e) { return e.id === st.ext; }); st.ext = EXTS[(j + 1) % EXTS.length].id; applyExt(); }
      lodPass(); hud(); rebuildDirectory(); if (n) toast(st.view === 'floor' ? '✨ ' + KINDS.filter(function (k) { return k[0] === floors[st.floor].kind; })[0][1] : '✨ ' + n + ' floors restyled · locked floors kept');
    }
    function rebuildDirectory() { var lob = floors[0]; buildExhibition(lob); }
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-ks]'); if (b) { e.preventDefault(); act(b.dataset.ks, b); } });
    function onKey(e) {
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); if (st.read) return putBack(); return act('exit'); }
      if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); return ride(Math.min(floors.length - 1, st.floor + 1)); }
      if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); return ride(Math.max(0, st.floor - 1)); }
      if (k === 'c' || k === 'C') return act('cut'); if (k === 's' || k === 'S') return act('suggest'); if (k === 'k' || k === 'K') return act('skyline');
      if ((k === 'f' || k === 'F') && st.read) st.read.flip = st.read.flip ? 0 : 1;
      if (/^[1-9]$/.test(k)) { var i = +k - 1; if (floors[i]) ride(i); } if (k === 'r' || k === 'R') ride(floors.length - 1);
    }
    window.addEventListener('keydown', onKey);
    var toastT = 0;
    function toast(t) { var e = $('.ks-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 2000); }
    function hap() { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }
    function persist() { save(KEY, { ext: st.ext, fl: st.fl, floor: st.floor }); }

    // ---------------- loop
    var raf = 0, last = 0, alive = true, W = 1, H = 1, idle = 0;
    function step(now) {
      raf = 0; if (!alive) return; schedule(); var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      if (st.tw) { var w = st.tw; w.t += dt; var k = clamp(w.t / w.dur, 0, 1), e2 = ease(k); camPos.lerpVectors(w.p0, w.p1, e2); camTgt.lerpVectors(w.t0, w.t1, e2); if (k >= 1) { st.tw = null; if (w.then) w.then(); } }
      else if (st.view === 'skyline' && !down) { idle += dt; if (idle > 2.5) { st.yaw += dt * .05; var o = outsidePose(false); camPos.lerp(o.p, .05); camTgt.lerp(o.t, .05); } } else idle = 0;
      // cutaway: front and right glass fade, their mullions go
      st.cut = lerp(st.cut, st.cutTo, 1 - Math.exp(-dt * 4)); mat.glassCut.opacity = .32 * (1 - st.cut); mat.glassCut.visible = st.cut < .98; cutMull.visible = st.cut < .6;
      lamp.position.set(0, floors[st.floor].y + 3.6, 0); lamp.visible = st.view === 'floor' || st.view === 'lift';
      // the elevator car rides the core
      var cy = st.carY != null ? st.carY : floors[st.floor].y; car.position.y = lerp(car.position.y, cy + 1.9, 1 - Math.exp(-dt * 6));
      // camera (+ look-around inside)
      cam.position.copy(camPos);
      if (st.view === 'floor' && !st.tw) { var dir = tmpT.copy(camTgt).sub(camPos); var yaw0 = Math.atan2(dir.x, dir.z), len = dir.length(); tmpP.set(Math.sin(yaw0 + st.lookYaw) * len, dir.y + Math.tan(st.lookPitch) * len, Math.cos(yaw0 + st.lookYaw) * len).add(camPos); cam.lookAt(tmpP); }
      else cam.lookAt(camTgt);
      // the item being read: out in front of you, then back in its place
      var r = st.read;
      if (r) {
        r.t = Math.min(1, r.t + dt * 2.6); var it = r.it, kk = ease(r.t), fw = new T.Vector3(); cam.getWorldDirection(fw);
        var outP = cam.position.clone().addScaledVector(fw, 2), q0 = it.mesh.getWorldQuaternion(new T.Quaternion()), q1 = cam.quaternion.clone(), s0 = it.s.w / 1.6, wp = it.mesh.getWorldPosition(new T.Vector3());
        var a = r.out ? kk : 1 - kk; reader.position.lerpVectors(wp, outP, a); reader.quaternion.copy(q0).slerp(q1, a); reader.scale.setScalar(lerp(s0, 1, a) * (W / H < 1 ? .62 : 1));
        rFace.rotation.y = lerp(rFace.rotation.y, r.flip ? Math.PI : 0, 1 - Math.exp(-dt * 8));
        if (!r.out && r.t >= 1) { it.mesh.visible = true; reader.visible = false; st.read = null; }
      }
      items.forEach(function (it) { if (it.obj && it.f.ex.visible) it.obj.rotation.y += dt * it.obj.userData.spin; });
      R.render(scene, cam);
    }
    function schedule() { if (!raf && alive && !document.hidden) raf = requestAnimationFrame(step); }
    function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; persist(); } else { last = 0; schedule(); } }
    document.addEventListener('visibilitychange', onVis);
    function resize() { var rc = root.getBoundingClientRect(); W = Math.max(1, rc.width); H = Math.max(1, rc.height); R.setSize(W, H, false); cam.aspect = W / H; cam.fov = clamp(2 * T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(72) / 2) / cam.aspect)), 50, 84); cam.updateProjectionMatrix(); root.classList.toggle('narrow', W < 640); root.classList.toggle('compact', W < 1100); }
    var ro = new ResizeObserver(resize); ro.observe(root);

    applyExt(); resize();
    var start = outsidePose(false); camPos.copy(start.p).multiplyScalar(1.5); camTgt.copy(start.t); hud(); lodPass();
    if (startAt) tween(start, 1.2, function () { enter(startAt.i, 'fly'); }); else tween(start, 1.8);
    toast('🏙 ' + board.title + ' · ' + floors.length + ' floors'); schedule();

    this.close = function () { if (!alive) return; persist(); alive = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); ro.disconnect(); texCache.forEach(function (t) { t.dispose(); }); R.dispose(); root.remove(); if (opts.onExit) opts.onExit(); };
    this.state = function () { var f = floors[st.floor]; return { view: st.view, floor: label(f) + ' ' + f.name, kind: f.kind, locked: !!f.locked, floors: floors.map(function (x) { return label(x) + ':' + x.name + ':' + (x.kind || '') + ':' + x.items.length; }), reading: st.read ? st.read.it.I.title : null, flip: st.read ? st.read.flip : 0, ext: st.ext, near: items.filter(function (x) { return x.lod === 'near'; }).length, items: items.length }; };
    this.act = act; this.ride = ride; this.enter = enter; this.cut = toCut; this.skyline = toSkyline;
    this.read = function (n) { var list = items.filter(function (x) { return x.f.i === st.floor; }); if (list[n || 0]) pullOut(list[n || 0]); };
    this.flip = function () { if (st.read) st.read.flip = st.read.flip ? 0 : 1; };
  }
  var CUR = null;
  window.MinestTower = { open: function (o) { if (CUR) CUR.close(); CUR = new Tower(o || {}); return CUR; }, current: function () { return CUR; }, kinds: KINDS, exteriors: EXTS };
})();
