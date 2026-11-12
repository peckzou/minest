/* Minest · 动态陈列装置 (Dynamic & Interactive Display Gallery) 2.0 — machines that show a List and can be operated.
   From the brief "11 种动态文字陈列模式开发指令 V1.0". A machine is one more fixture of the voxel exhibition engine
   (ui/world-displays.js, kind "machine"): it is placed, moved, turned, copied, deleted, undone and saved like the
   others, and it only REFERENCES the cards of a list ("<list id>/<card id>") — nothing is copied, and nothing a
   machine does changes the list itself.
   Built so far (phases 1 and 2), each with its own structure, its own way of being handled and its own way of
   showing the cards:
   03 · Rotating Carousel   a rack on a bearing: drag it round (inertia, settles on a face), postcards in pockets
   10 · Rolodex             a wheel of index cards on a horizontal axle: riffle them over the top one by one (each
                            card springs over and lands), letter tabs jump to a card
   12 · Flip Carousel       a crank and gears turn a spool; the standing card is pushed past the catch and FALLS
                            (gravity, a bounce) — a flip-book for fast looking through, it goes round for ever
   20 · Paternoster Shelf   eight trays on an endless chain, always level; pick a tray (or a card) and the motor
                            brings it to the window the short way round; every tray has its number and its load
   In all of them a card really leaves its place, comes to you, turns over and goes back to the place it came from;
   two cards can change places (the machine's own order). The standard is the 格物致知 cabinet: things follow the
   finger, then settle; only how things stand in the machine is kept.
   Kept on the record (mx): which machine, the list, the order (if you made your own), the position it rests at,
   the page, auto-play, the card last taken out. Never kept: positions in between, speeds, cards in the air.
   The other seven machines are listed in CATALOG with their phase and are not built yet.
   The pure part (catalogue, places, order, the physics and the paths) also loads in node for tests. */
(function (root) {
  'use strict';
  var VERSION = '2.0', Q = Math.PI / 2, RAD = Math.PI / 180;

  /* ================================================================ pure: the eleven machines of the brief */
  var CATALOG = [
    { id: 'carousel', no: '03', name: '旋转明信片展架', en: 'Rotating Carousel', icon: '🎠', phase: 1, kind: '实体机械', ready: true },
    { id: 'rolodex', no: '10', name: '旋转卡片档案轮', en: 'Rolodex', icon: '📇', phase: 2, kind: '实体机械', ready: true },
    { id: 'flip', no: '12', name: '翻页转轮', en: 'Flip Carousel', icon: '🗞', phase: 2, kind: '实体机械', ready: true },
    { id: 'paternoster', no: '20', name: '循环升降货架', en: 'Paternoster Shelf', icon: '🛗', phase: 2, kind: '实体机械 + 自动检索', ready: true },
    { id: 'splitflap', no: '09', name: '机械翻牌清单机', en: 'Split-Flap List', icon: '🛫', phase: 3, kind: '自动循环 + 主动交互' },
    { id: 'sorter', no: '11', name: '自动文字分拣机', en: 'Sorting Machine', icon: '🏭', phase: 3, kind: '主动操作 + 自动执行' },
    { id: 'drum', no: '13', name: '文字滚筒', en: 'Word Drum', icon: '🥁', phase: 3, kind: '实体机械 + 自动显示' },
    { id: 'ferris', no: '14', name: '文字摩天轮', en: 'Word Ferris Wheel', icon: '🎡', phase: 3, kind: '实体机械 + 自动循环' },
    { id: 'jukebox', no: '19', name: '点唱机清单', en: 'Jukebox List', icon: '📻', phase: 3, kind: '实体机械 + 自动取物' },
    { id: 'retype', no: '78', name: '自重组文字群', en: 'Reassembling Typography', icon: '🌌', phase: 4, kind: '自动动态 + 空间交互' },
    { id: 'comic', no: '79', name: '漫画式空间文字', en: 'Comic Space', icon: '💬', phase: 4, kind: '自动动态 + 叙事交互' }
  ];
  function modeOf(id) { for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i]; return null; }
  function mod(x, n) { return ((x % n) + n) % n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ================================================================ pure: how a machine moves when the hand lets go
     spin: it coasts and slows (friction); once slow it is drawn to the nearest stop (a multiple of step) and settles
     there with a small bounce. s = { a position, w speed, target (null while coasting) }; true while it still moves. */
  function spin(s, dt, step) {
    step = step || Q; dt = Math.min(0.05, dt);
    if (s.target == null) {
      s.a += s.w * dt; s.w *= Math.exp(-2.4 * dt);
      if (Math.abs(s.w) < 0.4 * step) s.target = Math.round((s.a + s.w * 0.12) / step) * step;
      return true;
    }
    var k = 70, c = 2 * Math.sqrt(k) * 0.82;
    s.w += (-k * (s.a - s.target) - c * s.w) * dt; s.a += s.w * dt;
    if (Math.abs(s.a - s.target) < 0.0013 * step && Math.abs(s.w) < 0.02 * step) { s.a = s.target; s.w = 0; return false; }
    return true;
  }
  // drive: a motor takes it to the target at a steady speed, easing in at the end (no bounce); true while it moves
  function drive(s, dt, vmax) {
    dt = Math.min(0.05, dt);
    var d = s.target - s.a, v = clamp(d * 5, -vmax, vmax);
    if (Math.abs(d) < 0.004) { s.a = s.target; s.w = 0; return false; }
    if (Math.abs(v) < 0.25) v = d > 0 ? 0.25 : -0.25;
    s.w = v; s.a += Math.abs(v * dt) > Math.abs(d) ? d : v * dt;
    return true;
  }
  // the nearest position equal to `to` on a ring of n, seen from `from` (the short way round)
  function shortWay(from, to, n) { return from + (mod(to - from + n / 2, n) - n / 2); }

  /* ================================================================ pure: 03 the carousel's pockets */
  var CAR = { faces: 4, tiers: 4, cols: 2, cap: 32, cw: 0.25, ch: 0.36, ct: 0.012, tierY: [2.1, 1.62, 1.14, 0.66], colX: [-0.145, 0.145], z: 0.236, size: { w: 1, d: 1, h: 3 } };
  // pocket s (0 … 31): dealt round the four faces (so a short list still dresses every face), top tier first, left
  // to right — and where its card stands on that face
  function pocket(s) { var f = s % CAR.faces, r = Math.floor(s / CAR.faces), t = Math.floor(r / CAR.cols), c = r % CAR.cols; return { face: f, tier: t, col: c, x: CAR.colX[c], y: CAR.tierY[t], z: CAR.z }; }
  function pages(n, cap) { return Math.max(1, Math.ceil(n / cap)); }
  function faceAt(a) { return mod(Math.round(-a / Q), 4); }
  function angleFor(face, near) { var a = -face * Q; if (near == null) return a; return a + Math.round((near - a) / (2 * Math.PI)) * 2 * Math.PI; }

  /* ================================================================ pure: 10 the rolodex
     Cards hang by their lower edge on the hub. rel = card − position: the card you read (rel 0) leans back facing
     you; those behind it (rel > 0) are packed behind; those you passed (rel ≤ −1) lie forward, face down. Between
     0 and −1 a card goes over the top: fast, a little too far, and back (paper springing over). Angle in degrees
     from the front (0°) up over the top (90°) to the back. */
  var ROL = { cap: 24, cw: 0.44, ch: 0.3, ct: 0.008, cy: 0.5, r0: 0.1, read: 112, lie: 18, pack: 8, size: { w: 1, d: 1, h: 1 } };
  function rolAngle(rel) {
    if (rel >= 0) return ROL.read + rel * ROL.pack;
    if (rel <= -1) return ROL.lie - (-rel - 1) * ROL.pack;
    var t = -rel, e = t < 0.8 ? (t / 0.8) * (t / 0.8) * 1.07 : 1.07 - 0.07 * ((t - 0.8) / 0.2);
    return ROL.read - (ROL.read - ROL.lie) * e;
  }

  /* ================================================================ pure: 12 the flip carousel
     A spool of n places; cards are hinged round it. u = how far a card is behind the front one (0 … n). The front
     half stands (held by the catch), the rest hang. The front card (v = turn of the crank since it came to the
     front, 0 → 1) is pushed forward to the catch, then let go: it falls under its own weight and bounces once. */
  var FLP = { cap: 30, min: 10, cw: 0.42, ch: 0.3, ct: 0.008, cy: 0.5, rho: 0.06, fan: 3.2, size: { w: 1, d: 1, h: 1 }, perTurn: 3 };
  function flipRing(n) { return clamp(n, FLP.min, FLP.cap); }
  function flipFall(v) {   // the angle of the falling card: 90° standing → −90° hanging
    if (v <= 0) return 90; if (v >= 1) return -90;
    if (v < 0.5) return 90 - 14 * (v / 0.5);
    var t = (v - 0.5) / 0.5, g = t < 0.8 ? (t / 0.8) * (t / 0.8) : 1 - 0.07 * Math.sin((t - 0.8) / 0.2 * Math.PI);
    return 76 - 166 * g;
  }
  function flipPose(i, a, n) {   // → { hinge (deg round the spool), phi (deg, the card's own angle), state }
    var u = mod(i - a, n), hinge = 90 + (u > n / 2 ? u - n : u) * (360 / n);
    if (u <= n / 2) return { hinge: hinge, phi: 90 + u * FLP.fan, state: u < 1e-9 ? 'front' : 'standing' };
    var v = n - u;
    return v < 1 ? { hinge: hinge, phi: flipFall(v), state: 'falling' } : { hinge: hinge, phi: -90, state: 'hanging' };
  }

  /* ================================================================ pure: 20 the paternoster
     Eight trays on an endless chain: up the front, over the top, down the back, under the bottom. A tray never
     tilts. s runs along the chain from the foot of the front run. Tray t stands at the window when position = t. */
  var PAT = { trays: 8, per: 3, cap: 24, pitch: 0.42, R: 0.2, y0: 0.45, cw: 0.2, ch: 0.27, ct: 0.008, colX: [-0.25, 0, 0.25], size: { w: 1, d: 1, h: 3 } };
  PAT.L = PAT.trays * PAT.pitch; PAT.Ls = (PAT.L - 2 * Math.PI * PAT.R) / 2; PAT.win = PAT.Ls / 2;
  function patPath(s) {   // → { y, z } of the chain at s
    var R = PAT.R, Ls = PAT.Ls, arc = Math.PI * R; s = mod(s, PAT.L);
    if (s < Ls) return { y: PAT.y0 + s, z: R, run: 'front' };
    if (s < Ls + arc) { var t = (s - Ls) / R; return { y: PAT.y0 + Ls + R * Math.sin(t), z: R * Math.cos(t), run: 'top' }; }
    if (s < 2 * Ls + arc) return { y: PAT.y0 + Ls - (s - Ls - arc), z: -R, run: 'back' };
    var t2 = (s - 2 * Ls - arc) / R; return { y: PAT.y0 - R * Math.sin(t2), z: -R * Math.cos(t2), run: 'bottom' };
  }
  function patTray(t, a) { return patPath(PAT.win + (t - a) * PAT.pitch); }
  function patSlot(s) { return { tray: Math.floor(s / PAT.per), k: s % PAT.per }; }
  function patLoad(n) { var out = []; for (var t = 0; t < PAT.trays; t++) out.push({ id: t + 1, items: clamp(n - t * PAT.per, 0, PAT.per) }); return out; }

  /* ================================================================ pure: order and the record */
  // the order the cards stand in: the list's own · A–Z · or the one you made (cards gone from the list drop out, new ones go last)
  function orderRefs(cards, mx) {
    var refs = cards.map(function (c) { return c.ref; });
    if (mx.order === 'title') return cards.slice().sort(function (p, q) { return String(p.title).localeCompare(String(q.title), 'zh'); }).map(function (c) { return c.ref; });
    if (mx.order === 'custom' && Array.isArray(mx.it)) { var have = {}, out = []; refs.forEach(function (r) { have[r] = 1; }); mx.it.forEach(function (r) { if (have[r] === 1) { out.push(r); have[r] = 2; } }); refs.forEach(function (r) { if (have[r] === 1) out.push(r); }); return out; }
    return refs;
  }
  function swapped(refs, i, j) { var o = refs.slice(), t = o[i]; o[i] = o[j]; o[j] = t; return o; }
  // the state kept on the record: only what the user chose, checked on the way in
  function cleanMx(mx) {
    mx = mx || {};
    var m = modeOf(mx.type), pos = mx.pos != null ? mx.pos : mx.face, o = { v: 2, type: m && m.ready ? mx.type : 'carousel', list: String(mx.list || ''), order: mx.order === 'title' || mx.order === 'custom' ? mx.order : 'list', pos: clamp(Math.round(+pos || 0), 0, 63), page: Math.max(0, mx.page | 0), auto: !!mx.auto };
    if (o.type === 'carousel') o.pos = mod(Math.round(+pos || 0), 4);
    if (o.order === 'custom') o.it = (Array.isArray(mx.it) ? mx.it : []).slice(0, 2000).map(String);
    if (mx.sel) o.sel = String(mx.sel);
    if (mx.type && !(m && m.ready)) o.unknown = String(mx.type).slice(0, 30);
    return o;
  }
  function initial(title) { var ch = Array.from(String(title || '').trim())[0] || '#'; return /[a-z]/.test(ch) ? ch.toUpperCase() : ch; }

  var PURE = { VERSION: VERSION, CATALOG: CATALOG, modeOf: modeOf, mod: mod, spin: spin, drive: drive, shortWay: shortWay, CAR: CAR, pocket: pocket, pages: pages, faceAt: faceAt, angleFor: angleFor, ROL: ROL, rolAngle: rolAngle, FLP: FLP, flipRing: flipRing, flipFall: flipFall, flipPose: flipPose, PAT: PAT, patPath: patPath, patTray: patTray, patSlot: patSlot, patLoad: patLoad, orderRefs: orderRefs, swapped: swapped, cleanMx: cleanMx, initial: initial };
  if (typeof module === 'object' && module.exports) { module.exports = PURE; return; }
  if (root.MinestMachines && root.MinestMachines.VERSION === VERSION) return;
  var VD = root.MinestVoxelDisplays; if (!VD || !VD._) { if (root.console) console.warn('动态陈列装置: the voxel exhibition engine is not loaded'); return; }
  var U = VD._, T = U.T, esc = U.esc, rgb = U.rgb;
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ================================================================ cards (the same thing in every machine: a front, a back, a thickness) */
  var PC = { name: 'postcard', wood: '#fbf8f0', paper: '#fffdf7', ink: '#1d2b4f' };
  // the back: what the card says. upside: drawn head down, for cards that are turned over top to bottom
  function backRes(c, w, h, upside) {
    return U.res('mcb|' + c.ref + '|' + c.title + '|' + U.hash(c.desc || '') + '|' + c.zh + '|' + w + 'x' + h + (upside ? 'u' : ''), function () {
      var k = 300 / Math.max(w, h), W = Math.round(w * k), H = Math.round(h * k);
      var cv = U.canvas(W, H), g = cv.getContext('2d'), F = 'system-ui,-apple-system,"PingFang SC",sans-serif', fs = Math.max(13, Math.round(Math.min(W, H) * 0.085));
      if (upside) { g.translate(W, H); g.rotate(Math.PI); }
      g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8a6f4d'; g.textAlign = 'left'; g.font = '700 ' + Math.round(fs * 0.55) + 'px ' + F; g.fillText(U.wrap(g, String(c.list || ''), W - 28, 1)[0] || '', 14, fs * 1.05);
      g.fillStyle = '#1d2b4f'; g.font = '800 ' + fs + 'px ' + F; var y = fs * 2.35;
      U.wrap(g, c.title, W - 28, 2).forEach(function (l) { g.fillText(l, 14, y); y += fs * 1.2; });
      if (c.zh) { g.fillStyle = '#5b6785'; g.font = '600 ' + Math.round(fs * 0.75) + 'px ' + F; U.wrap(g, c.zh, W - 28, 1).forEach(function (l) { g.fillText(l, 14, y); y += fs; }); }
      g.strokeStyle = '#d9cdb6'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, y - fs * 0.4); g.lineTo(W - 14, y - fs * 0.4); g.stroke(); y += fs * 0.5;
      g.fillStyle = '#33405f'; var ds = Math.round(fs * 0.68); g.font = '500 ' + ds + 'px ' + F;
      var lines = [], room = Math.max(1, Math.floor((H - y - 4) / (ds * 1.35)) + 1); String(c.desc || '（这张卡片还没有写说明）').split('\n').forEach(function (p) { U.wrap(g, p, W - 28, 14).forEach(function (l) { lines.push(l); }); });
      lines.slice(0, room).forEach(function (l, i) { g.fillText(i === room - 1 && lines.length > room ? l.slice(0, -1) + '…' : l, 14, y); y += ds * 1.35; });
      var map = U.tex(cv, false);
      return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x505050, emissiveMap: map }) };
    });
  }
  function edgeRes() { return U.res('mc|edge', function () { return { keep: 1, mat: new (T().MeshLambertMaterial)({ color: 0xf2ecdd }) }; }); }
  function matRes(hex) { return U.res('mc|m|' + hex, function () { return { keep: 1, mat: new (T().MeshLambertMaterial)({ color: new (T().Color)(hex) }) }; }); }
  function mkCard(c, s, cs, use, upside) {
    var st = U.picState(c), front = use(U.faceRes(c, cs.cw * 20, cs.ch * 20, PC, st, false)), back = use(backRes(c, cs.cw, cs.ch, upside)), edge = use(edgeRes()).mat;
    var m = new (T().Mesh)(U.mats().box, [edge, edge, edge, edge, front.mat, back.mat]); m.scale.set(cs.cw, cs.ch, cs.ct);
    m.userData = { isItem: true, slot: s, ref: c.ref, mc: true };
    return { mesh: m, slot: s, card: c };
  }
  // a card that turns on its lower edge about the x axis: hinge point (y, z) and its angle phi (deg: 0 front, 90 up)
  function hingeCard(m, hy, hz, phi, len) { var p = phi * RAD; m.position.set(0, hy + Math.sin(p) * len / 2, hz + Math.cos(p) * len / 2); m.rotation.set(Math.PI / 2 - p, 0, 0); }
  function disc(B, x0, x1, cy, cz, r, col, cell) { cell = cell || 0.04; var n = Math.ceil(r / cell); for (var j = -n; j < n; j++) for (var k = -n; k < n; k++) if (Math.hypot(j + 0.5, k + 0.5) * cell <= r) B.box(x0, cy + j * cell, cz + k * cell, x1, cy + (j + 1) * cell, cz + (k + 1) * cell, col); }
  // the cards of a machine, in their order, on the page shown
  function cardsOf(d, ix) {
    var mx = cleanMx(d.mx), D = DRV[mx.type], L = U.listOf(ix, mx.list), all = L ? L.cards : [], by = {}; all.forEach(function (c) { by[c.ref] = c; });
    var refs = orderRefs(all, mx), np = pages(refs.length, D.cap), page = Math.min(mx.page, np - 1);
    return { mx: mx, list: L, refs: refs, pages: np, page: page, shown: refs.slice(page * D.cap, (page + 1) * D.cap).map(function (r) { return by[r]; }) };
  }
  function addCards(h, D, use, upside) { h.info.shown.forEach(function (c, s) { if (c) { var k = mkCard(c, s, D.cs, use, upside); h.cards.push(k); D.parentOf(h, k).add(k.mesh); } }); }
  function solid(geo, shadows) { var m = new (T().Mesh)(geo, U.mats().solid); m.castShadow = !!shadows; m.receiveShadow = !!shadows; return m; }

  /* ================================================================ the machines. Each driver says:
     size · cap · cs (card size) · step (distance between stops) · autoSpeed · axis and gain of the drag ·
     build(h, grp, use, shadows) the fixed and the moving parts · apply(h, a) put every part where position a puts
     it · home(h, c, a, o) the place of card c at a · parentOf(h, c) · aOf(pos, info) / posOf(a, info) ·
     target(h, c, a) the position that brings c to hand · front(h, a) the cards within reach · cam */
  var DRV = {};

  // ---------------------------------------------------------------- 03 carousel
  DRV.carousel = {
    size: CAR.size, cap: CAR.cap, cs: CAR, step: Q, autoSpeed: 0.3, axis: 'x', gain: 3.2, dir: -1, flip: 'y',
    cam: { p: [0, 1.5, 3.3], look: [0, 1.34, 0] }, hint: '左右拖动，展架会转 · 点一张明信片把它抽出来',
    frame: function () {
      return U.res('mc|carousel|frame', function () {
        var S = new U.Buf(), R = new U.Buf(), wood = rgb('#7a5334'), dark = rgb('#4a3222'), metal = rgb('#3b4250'), steel = rgb('#aab2bf'), gold = rgb('#d9b24a');
        S.box(-0.42, 0, -0.42, 0.42, 0.1, 0.42, dark); S.box(-0.3, 0.1, -0.3, 0.3, 0.18, 0.3, wood); S.box(-0.1, 0.18, -0.1, 0.1, 0.26, 0.1, steel); S.box(-0.035, 0.26, -0.035, 0.035, 2.52, 0.035, steel);
        function face(i, x0, y0, z0, x1, y1, z1, col) { var q = [[x0, z0, x1, z1], [z0, -x1, z1, -x0], [-x1, -z1, -x0, -z0], [-z1, x0, -z0, x1]][i]; R.box(q[0], y0, q[1], q[2], y1, q[3], col); }
        for (var i = 0; i < 4; i++) {
          face(i, -0.29, 0.4, 0.2, 0.29, 2.34, 0.215, metal); face(i, -0.3, 0.4, 0.2, -0.28, 2.34, 0.235, steel); face(i, 0.28, 0.4, 0.2, 0.3, 2.34, 0.235, steel);
          CAR.tierY.forEach(function (y) { face(i, -0.29, y - 0.2, 0.215, 0.29, y - 0.18, 0.262, steel); face(i, -0.29, y - 0.2, 0.25, 0.29, y - 0.12, 0.262, steel); });
        }
        R.box(-0.31, 2.34, -0.31, 0.31, 2.39, 0.31, metal); R.box(-0.31, 0.36, -0.31, 0.31, 0.4, 0.31, metal); R.box(-0.06, 2.39, -0.06, 0.06, 2.5, 0.06, gold); R.box(-0.09, 0.28, -0.09, 0.09, 0.36, 0.09, metal);
        return { keep: 1, solid: S.geo(), rotor: R.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()); grp.add(solid(fr.solid, shadows));
      h.rotor = new (T().Group)(); grp.add(h.rotor); h.block = solid(fr.rotor, shadows); h.rotor.add(h.block); h.faces = [];
      for (var f = 0; f < 4; f++) { var g = new (T().Group)(); g.rotation.y = f * Q; h.rotor.add(g); h.faces.push(g); }
    },
    parentOf: function (h, c) { return h.faces[pocket(c.slot).face]; },
    home: function (h, c, a, o) { var p = pocket(c.slot); o.position.set(p.x, p.y, p.z); o.rotation.set(-0.05, 0, 0); },
    apply: function (h, a, first) { h.rotor.rotation.y = a; if (first) h.cards.forEach(function (c) { DRV.carousel.home(h, c, a, c.mesh); }); },
    aOf: function (pos) { return angleFor(pos); }, posOf: function (a) { return faceAt(a); },
    target: function (h, c, a) { return angleFor(pocket(c.slot).face, a); },
    front: function (h, a) { var f = faceAt(a); return h.cards.filter(function (c) { return pocket(c.slot).face === f; }); },
    where: function (c) { var p = pocket(c.slot); return '第 ' + (p.face + 1) + ' 面 · 第 ' + (p.tier + 1) + ' 层的插槽'; }
  };

  // ---------------------------------------------------------------- 10 rolodex
  DRV.rolodex = {
    size: ROL.size, cap: ROL.cap, cs: ROL, step: 1, autoSpeed: 0.55, axis: 'y', gain: 9, dir: 1, flip: 'y',
    cam: { p: [0, 1.0, 1.75], look: [0, 0.56, 0] }, hint: '上下拨动，卡片一张张翻过轮顶 · 点正对你的那张把它抽出来',
    frame: function () {
      return U.res('mc|rolodex|frame', function () {
        var S = new U.Buf(), Wb = new U.Buf(), dark = rgb('#2f3540'), steel = rgb('#aab2bf'), wood = rgb('#7a5334'), gold = rgb('#d9b24a');
        S.box(-0.44, 0, -0.26, 0.44, 0.07, 0.26, wood); S.box(-0.4, 0.07, -0.2, 0.4, 0.1, 0.2, dark);
        [-1, 1].forEach(function (sd) { var x = sd * 0.36; S.box(x - 0.025, 0.1, -0.08, x + 0.025, ROL.cy + 0.04, 0.08, dark); S.box(x - 0.035, ROL.cy - 0.04, -0.04, x + 0.035, ROL.cy + 0.04, 0.04, steel); });
        Wb.box(-0.34, -0.022, -0.022, 0.34, 0.022, 0.022, steel);   // the axle, the hub and the two wheels turn together
        Wb.box(-0.25, -ROL.r0 * 0.7, -ROL.r0 * 0.7, 0.25, ROL.r0 * 0.7, ROL.r0 * 0.7, dark);
        disc(Wb, -0.3, -0.27, 0, 0, 0.2, dark); disc(Wb, 0.27, 0.3, 0, 0, 0.2, dark);
        [[0.13, 0], [-0.13, 0], [0, 0.13], [0, -0.13]].forEach(function (q) { Wb.box(-0.305, q[0] - 0.02, q[1] - 0.02, -0.3, q[0] + 0.02, q[1] + 0.02, gold); Wb.box(0.3, q[0] - 0.02, q[1] - 0.02, 0.305, q[0] + 0.02, q[1] + 0.02, gold); });
        Wb.box(0.3, 0.1, -0.03, 0.42, 0.16, 0.03, gold);   // the knob you would turn it by
        return { keep: 1, solid: S.geo(), wheel: Wb.geo() };
      });
    },
    build: function (h, grp, use, shadows) { var fr = use(this.frame()); grp.add(solid(fr.solid, shadows)); h.wheel = solid(fr.wheel, shadows); h.wheel.position.set(0, ROL.cy, 0); grp.add(h.wheel); h.carrier = new (T().Group)(); grp.add(h.carrier); h.block = h.wheel; },
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) { var phi = rolAngle(c.slot - a), p = phi * RAD; hingeCard(o, ROL.cy + Math.sin(p) * ROL.r0, Math.cos(p) * ROL.r0, phi, ROL.ch); },
    apply: function (h, a) { h.wheel.rotation.x = -a * 0.3; h.cards.forEach(function (c) { if (!c.busy) DRV.rolodex.home(h, c, a, c.mesh); }); },
    aOf: function (pos, info) { return clamp(pos, 0, Math.max(0, info.shown.length - 1)); }, posOf: function (a, info) { return clamp(Math.round(a), 0, Math.max(0, info.shown.length - 1)); },
    limit: function (info) { return [0, Math.max(0, info.shown.length - 1)]; },
    target: function (h, c) { return c.slot; },
    front: function (h, a) { var i = Math.round(a); return h.cards.filter(function (c) { return c.slot >= i - 1 && c.slot <= i + 3; }); },
    where: function (c) { return '第 ' + (c.slot + 1) + ' 张的位置'; },
    extra: function (h) { var seen = {}, out = []; h.cards.forEach(function (c) { var l = initial(c.card.title); if (!seen[l]) { seen[l] = 1; out.push('<button type="button" data-mc="jump" data-arg="' + c.slot + '">' + esc(l) + '</button>'); } }); return out.length > 1 ? '<div class="mc-tabs" aria-label="字母索引">' + out.join('') + '</div>' : ''; }
  };

  // ---------------------------------------------------------------- 12 flip carousel
  DRV.flip = {
    size: FLP.size, cap: FLP.cap, cs: FLP, step: 1, autoSpeed: 0.9, axis: 'x', gain: 5, dir: 1, flip: 'x', upside: true,
    cam: { p: [0.2, 0.86, 1.9], look: [0.05, 0.5, 0] }, hint: '左右拖动就是摇摇柄 · 立着的卡片被推过卡扣后自己翻落 · 点立着的那张把它取出来',
    frame: function () {
      return U.res('mc|flip|frame', function () {
        var S = new U.Buf(), Sp = new U.Buf(), Cr = new U.Buf(), G1 = new U.Buf(), G2 = new U.Buf(), iron = rgb('#30343c'), steel = rgb('#aab2bf'), wood = rgb('#7a5334'), brass = rgb('#d9b24a'), red = rgb('#b8322a');
        S.box(-0.46, 0, -0.26, 0.5, 0.06, 0.26, wood);
        [-1, 1].forEach(function (sd) { var x = sd * 0.3; S.box(x - 0.02, 0.06, -0.16, x + 0.02, FLP.cy + 0.07, 0.16, iron); });
        S.box(-0.3, 0.06, -0.19, 0.3, 0.16, -0.16, iron);
        S.box(-0.3, FLP.cy + 0.07, 0.05, -0.27, FLP.cy + FLP.ch + 0.09, 0.08, iron); S.box(-0.3, FLP.cy + FLP.ch + 0.065, 0.03, -0.18, FLP.cy + FLP.ch + 0.09, 0.1, brass);   // the catch that holds the standing cards
        Sp.box(-0.28, -FLP.rho * 0.7, -FLP.rho * 0.7, 0.28, FLP.rho * 0.7, FLP.rho * 0.7, iron); Sp.box(-0.38, -0.02, -0.02, 0.46, 0.02, 0.02, steel);
        Cr.box(0, -0.025, -0.025, 0.03, 0.2, 0.025, steel); Cr.box(0.03, 0.15, -0.03, 0.13, 0.21, 0.03, red);   // crank arm and handle
        function gear(B, r, col) { disc(B, 0, 0.03, 0, 0, r, col, 0.03); for (var k = 0; k < 8; k++) { var t = k * Math.PI / 4, y = Math.sin(t) * (r + 0.015), z = Math.cos(t) * (r + 0.015); B.box(0, y - 0.022, z - 0.022, 0.03, y + 0.022, z + 0.022, col); } }
        gear(G1, 0.11, brass); gear(G2, 0.07, steel);
        return { keep: 1, solid: S.geo(), spool: Sp.geo(), crank: Cr.geo(), g1: G1.geo(), g2: G2.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()); grp.add(solid(fr.solid, shadows));
      h.spool = solid(fr.spool, shadows); h.spool.position.set(0, FLP.cy, 0); grp.add(h.spool);
      h.crank = solid(fr.crank, shadows); h.crank.position.set(0.46, FLP.cy, 0); grp.add(h.crank);
      h.g1 = solid(fr.g1, shadows); h.g1.position.set(0.335, FLP.cy, 0); grp.add(h.g1);
      h.g2 = solid(fr.g2, shadows); h.g2.position.set(0.335, FLP.cy - 0.03, 0.185); grp.add(h.g2);
      h.carrier = new (T().Group)(); grp.add(h.carrier); h.ring = flipRing(h.info.shown.length); h.block = h.spool;
    },
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) { var p = flipPose(c.slot, a, h.ring), q = p.hinge * RAD; hingeCard(o, FLP.cy + Math.sin(q) * FLP.rho, Math.cos(q) * FLP.rho, p.phi, FLP.ch); },
    apply: function (h, a) {
      var t = a * 2 * Math.PI / FLP.perTurn; h.crank.rotation.x = t; h.g1.rotation.x = t; h.g2.rotation.x = -t * 11 / 7 + 0.3; h.spool.rotation.x = a * 2 * Math.PI / h.ring;
      h.cards.forEach(function (c) { if (!c.busy) DRV.flip.home(h, c, a, c.mesh); });
    },
    aOf: function (pos) { return pos; }, posOf: function (a, info) { return mod(Math.round(a), flipRing(info.shown.length)); },
    target: function (h, c, a) { return shortWay(a, c.slot, h.ring); },
    front: function (h, a) { var i = mod(Math.round(a), h.ring); return h.cards.filter(function (c) { return mod(c.slot - i, h.ring) <= 3; }).sort(function (p, q) { return mod(p.slot - i, h.ring) - mod(q.slot - i, h.ring); }); },
    where: function (c) { return '转轮上第 ' + (c.slot + 1) + ' 个卡位'; }
  };

  // ---------------------------------------------------------------- 20 paternoster
  DRV.paternoster = {
    size: PAT.size, cap: PAT.cap, cs: PAT, step: 1, autoSpeed: 0.4, axis: 'y', gain: 5, dir: 1, flip: 'y', motor: 1.8,
    cam: { p: [0.55, 1.5, 3.7], look: [0, 1.22, 0] }, hint: '点一层的编号，电机把它送到取物窗口 · 也可以上下拖动链条 · 点窗口里的卡片取出来',
    frame: function () {
      return U.res('mc|paternoster|frame', function () {
        var S = new U.Buf(), G = new U.Buf(), iron = rgb('#39414d'), dark = rgb('#252b34'), steel = rgb('#aab2bf'), brass = rgb('#d9b24a'), top = PAT.y0 + PAT.Ls + PAT.R, wy = PAT.y0 + PAT.win;
        S.box(-0.48, 0, -0.42, 0.48, 0.12, 0.42, dark); S.box(-0.48, top + 0.42, -0.42, 0.48, top + 0.56, 0.42, dark);
        [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { S.box(sx * 0.46 - 0.02, 0.12, sz * 0.4 - 0.02, sx * 0.46 + 0.02, top + 0.42, sz * 0.4 + 0.02, iron); }); });
        S.box(-0.46, 0.12, -0.42, 0.46, top + 0.42, -0.4, iron);   // the back
        [-1, 1].forEach(function (sd) { var x = sd * 0.43; for (var s = 0; s < PAT.L; s += 0.07) { var p = patPath(s); S.box(x - 0.008, p.y - 0.012, p.z - 0.012, x + 0.008, p.y + 0.012, p.z + 0.012, steel); } disc(S, x - 0.012, x + 0.012, PAT.y0, 0, 0.11, iron, 0.036); disc(S, x - 0.012, x + 0.012, PAT.y0 + PAT.Ls, 0, 0.11, iron, 0.036); });   // chains and sprockets
        S.box(-0.46, wy + 0.36, 0.4, 0.46, wy + 0.39, 0.43, brass); S.box(-0.46, wy - 0.06, 0.4, 0.46, wy - 0.03, 0.43, brass);   // the window
        S.box(-0.48, wy - 0.06, 0.4, -0.44, wy + 0.39, 0.43, brass); S.box(0.44, wy - 0.06, 0.4, 0.48, wy + 0.39, 0.43, brass);
        G.box(-0.4, wy + 0.4, 0.405, 0.4, wy + 0.42, 0.42, [1, 0.93, 0.7]);
        return { keep: 1, solid: S.geo(), glow: G.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()); grp.add(solid(fr.solid, shadows)); grp.add(new (T().Mesh)(fr.glow, U.mats().glow));
      h.carrier = new (T().Group)(); grp.add(h.carrier); h.trays = [];
      var wood = use(matRes('#8f5f3d')).mat, lip = use(matRes('#5d3f2a')).mat;
      for (var t = 0; t < PAT.trays; t++) {
        var g = new (T().Group)(), b = new (T().Mesh)(U.mats().box, wood); b.scale.set(0.82, 0.03, 0.22); b.position.y = -0.015; g.add(b);
        var l = new (T().Mesh)(U.mats().box, lip); l.scale.set(0.82, 0.05, 0.02); l.position.set(0, 0.01, 0.11); g.add(l);
        var tag = new (T().Mesh)(U.mats().plane, use(U.signRes(String(t + 1), 1.6, 1.6, '#f2c13d', '#2b2205')).mat); tag.scale.set(0.07, 0.07, 1); tag.position.set(-0.36, 0.005, 0.1215); g.add(tag);
        h.carrier.add(g); h.trays.push(g);
      }
      h.block = null;
    },
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) { var q = patSlot(c.slot), p = patTray(q.tray, a); o.position.set(PAT.colX[q.k], p.y + PAT.ch / 2, p.z - 0.02); o.rotation.set(-0.1, 0, 0); },
    apply: function (h, a) { h.trays.forEach(function (g, t) { var p = patTray(t, a); g.position.set(0, p.y, p.z); }); h.cards.forEach(function (c) { if (!c.busy) DRV.paternoster.home(h, c, a, c.mesh); }); },
    aOf: function (pos) { return mod(pos, PAT.trays); }, posOf: function (a) { return mod(Math.round(a), PAT.trays); },
    target: function (h, c, a) { return shortWay(a, patSlot(c.slot).tray, PAT.trays); },
    front: function (h, a) { var t = mod(Math.round(a), PAT.trays); return h.cards.filter(function (c) { return patSlot(c.slot).tray === t; }); },
    where: function (c) { var q = patSlot(c.slot); return '第 ' + (q.tray + 1) + ' 层 · 第 ' + (q.k + 1) + ' 格'; },
    extra: function (h, a) { var at = mod(Math.round(a), PAT.trays); return '<div class="mc-tabs" aria-label="货架层">' + patLoad(h.cards.length).map(function (t, i) { return '<button type="button" data-mc="tray" data-arg="' + i + '"' + (i === at ? ' class="on"' : '') + ' title="第 ' + t.id + ' 层，' + t.items + ' 件">' + t.id + '<small>' + (t.items ? '●●●'.slice(0, t.items) : '空') + '</small></button>'; }).join('') + '</div>'; }
  };

  // one machine: frame, moving parts, cards — into grp. Returns the handle that operates it.
  function buildMachine(d, grp, ix, use, shadows) {
    var info = cardsOf(d, ix), D = DRV[info.mx.type], h = { info: info, D: D, cards: [] };
    D.build(h, grp, use, shadows); addCards(h, D, use, D.upside);
    D.apply(h, D.aOf(info.mx.pos, info), true);
    return h;
  }

  /* ================================================================ in the world */
  var TURN = [], turning = false, menu = false;   // machines that run by themselves (auto), one loop for all of them
  function worldTick(t) {
    TURN = TURN.filter(function (r) { return r.grp.parent; });
    if (!TURN.length || !root.__oiaOn) { turning = false; return; }
    TURN.forEach(function (r) {
      if (INS && INS.d.id === r.id) return;
      var a = r.a0 + (t - r.t0) / 1000 * r.h.D.autoSpeed * 0.75, lm = r.h.D.limit && r.h.D.limit(r.h.info);
      if (lm) a = lm[0] + mod(a - lm[0], lm[1] - lm[0] + 1);   // a wheel with an end starts again from its first card
      r.h.D.apply(r.h, a);
    });
    requestAnimationFrame(worldTick);
  }
  VD.ext.machine = {
    build: function (d, grp, api) {
      var h = buildMachine(d, grp, api.ix, api.use, api.shadows); grp.userData.mc = h;
      if (h.info.mx.auto && !reduced() && h.cards.length) { TURN.push({ id: d.id, grp: grp, h: h, a0: h.D.aOf(h.info.mx.pos, h.info), t0: performance.now() }); if (!turning) { turning = true; requestAnimationFrame(worldTick); } }
    },
    sig: function (d, ix) { return cardsOf(d, ix).shown.map(function (c) { return c ? c.title + '~' + c.pic + '~' + U.picState(c) + '~' + U.hash(c.desc || '') : '-'; }).join('|'); },
    open: function (d, ctx) { inspect(ctx, d); },
    entry: function (ctx) {
      var ix = U.index(ctx.host.boardId()), L = U.curList(ix);
      var h = '<div class="tw-entry"><button type="button" class="obld-btn pri" data-vd="machine:menu">🎠 动态陈列装置' + (menu ? ' ▴' : ' ▾') + '</button><small>能亲手操作的机械装置 · 引用列表，不复制内容</small></div>';
      if (menu) h += '<div class="mc-menu">' + (L ? '<p class="obld-sub">把上面选的列表「' + esc(L.title) + '」（' + L.cards.length + ' 张）装进：</p>' : '') + CATALOG.map(function (m) { return '<button type="button" data-vd="machine:new" data-arg="' + m.id + '"' + (m.ready && L ? '' : ' disabled') + '><i>' + m.icon + '</i><span><b>' + m.no + ' · ' + m.name + '</b><small>' + m.kind + (m.ready ? ' · 一页 ' + DRV[m.id].cap + ' 张' : ' · 第 ' + m.phase + ' 阶段，还没做') + '</small></span></button>'; }).join('') + '</div>';
      return h;
    },
    panel: function (d, ctx) {
      var info = cardsOf(d, U.index(ctx.host.boardId())), m = modeOf(info.mx.type);
      return '<div class="obld-sub">' + m.icon + ' ' + m.no + ' · ' + m.name + ' · ' + (info.list ? '「' + esc(info.list.title) + '」' + info.refs.length + ' 张' + (info.pages > 1 ? ' · 第 ' + (info.page + 1) + '/' + info.pages + ' 页' : '') : '列表已不在看板上') + ' · ' + ({ list: '列表顺序', title: 'A–Z', custom: '自定义顺序' }[info.mx.order]) + '</div>' +
        '<div class="obld-actions"><button type="button" class="obld-btn pri" data-vd="machine:open">🔍 走近操作</button><button type="button" class="obld-btn' + (info.mx.auto ? ' on' : '') + '" data-vd="machine:auto">' + (info.mx.auto ? '⏸ 停止自动运转' : '▶ 自动运转') + '</button></div>';
    },
    act: function (ctx, name, arg, d) {
      if (name === 'menu') { menu = !menu; return ctx.refresh(); }
      if (name === 'new') return place(ctx, arg);
      if (!d || d.kind !== 'machine') return;
      if (name === 'open') return inspect(ctx, d);
      if (name === 'auto') { var on = !cleanMx(d.mx).auto; ctx.commit(function (next) { var q = U.byId(next.displays, d.id); if (q) { q.mx = cleanMx(q.mx); q.mx.auto = on; } }); ctx.toast(on ? '▶ 自动运转' : '⏸ 停住'); }
    }
  };
  function place(ctx, type) {
    var m = modeOf(type); if (!m || !m.ready) return ctx.toast((m ? m.name : '这个装置') + '还没做（第 ' + (m ? m.phase : '?') + ' 阶段）');
    var host = ctx.host, ix = U.index(host.boardId()), L = U.curList(ix), D = DRV[type]; if (!L) return ctx.toast('这座岛的看板还没有卡片');
    var v = host.view(), d = U.snap({ id: U.uid('m'), kind: 'machine', x: v.x, z: v.z, y: 0, rot: U.rotToward(-v.fx, -v.fz), it: [], w: D.size.w, d: D.size.d, h: D.size.h, label: L.title, mx: cleanMx({ type: type, list: L.id, auto: true }) });
    var s = U.near(host, d, U.list(host), v.y, 12, true);
    if (!s.ok) return ctx.toast('你面前没有放得下的平地：' + s.why);
    ctx.commit(function (next) { next.displays.push(d); });
    menu = false; ctx.setSel(d.id); ctx.refresh();
    ctx.toast(m.icon + ' ' + m.name + '放好了 · 「' + L.title + '」' + Math.min(L.cards.length, D.cap) + ' 张' + (L.cards.length > D.cap ? '（共 ' + pages(L.cards.length, D.cap) + ' 页）' : '') + ' · 点它走近操作');
  }

  /* ================================================================ Inspect: the operating view (its own stage; the machine is really operated here) */
  var INS = null;
  function inspect(ctx, d0) {
    if (INS) leave(false);
    var d = U.byId(U.list(ctx.host), d0.id) || d0, mx = cleanMx(d.mx), m = modeOf(mx.type), D = DRV[mx.type], el = document.createElement('div');
    el.id = 'mc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', m.name + '，操作视角');
    el.innerHTML = '<header><b>' + m.icon + ' ' + m.name + '</b><span class="mc-sub"></span><button type="button" class="mc-x" data-mc="close" aria-label="离开，回到 My World">✕</button></header>' +
      '<div class="mc-stage"><canvas aria-label="' + esc(D.hint) + '"></canvas><p class="mc-say" role="status" aria-live="polite"></p>' +
      '<div class="mc-card" hidden><button type="button" data-mc="flip">🔄 翻面</button><button type="button" data-mc="swap">↔ 和另一张换位置</button><button type="button" data-mc="detail">📄 卡片详情</button><button type="button" class="go" data-mc="back">↩ 放回原位</button></div></div>' +
      '<footer><div class="mc-row"><button type="button" data-mc="turn" data-arg="-1" aria-label="退一格">◀</button><button type="button" data-mc="auto"></button><button type="button" data-mc="turn" data-arg="1" aria-label="进一格">▶</button>' +
      '<span class="mc-gap"></span><button type="button" data-mc="order" data-arg="list">列表顺序</button><button type="button" data-mc="order" data-arg="title">A–Z</button><button type="button" data-mc="order" data-arg="custom" hidden>我的顺序</button>' +
      '<span class="mc-pg" hidden><button type="button" data-mc="page" data-arg="-1" aria-label="上一页">‹</button><b></b><button type="button" data-mc="page" data-arg="1" aria-label="下一页">›</button></span></div>' +
      '<div class="mc-extra"></div><div class="mc-front" aria-label="伸手够得到的卡片"></div></footer>';
    (document.getElementById('oia-root') || document.body).appendChild(el);
    var cv = el.querySelector('canvas'), R;
    try { R = new (T().WebGLRenderer)({ canvas: cv, antialias: true, alpha: true }); } catch (e) { el.remove(); return ctx.toast('这台设备开不了操作视角'); }
    R.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    var scene = new (T().Scene)(), cam = new (T().PerspectiveCamera)(40, 1, 0.05, 50), grp = new (T().Group)(); scene.add(grp);
    scene.add(new (T().HemisphereLight)(0xfff4e0, 0x6a5a48, 0.62)); var sun = new (T().DirectionalLight)(0xffffff, 0.42); sun.position.set(2.5, 5, 4); scene.add(sun);
    var floor = new (T().Mesh)(new (T().CircleGeometry)(5, 40), new (T().MeshLambertMaterial)({ color: 0xcdbf9f })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    INS = { ctx: ctx, d: d, D: D, el: el, R: R, scene: scene, cam: cam, grp: grp, floor: floor, used: [], mx: mx, mx0: JSON.stringify(mx), s: { a: 0, w: 0, target: null }, held: null, out: null, flipped: false, swap: false, motor: false, tweens: [], last: performance.now(), moving: true };
    load();
    ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'keyup', 'keypress', 'click'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }); });
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-mc]'); if (b) cmd(b.getAttribute('data-mc'), b.getAttribute('data-arg')); });
    el.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); return INS.out ? cmd('back') : cmd('close'); }
      if (e.target.tagName === 'BUTTON') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { cmd('turn', '-1'); e.preventDefault(); } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { cmd('turn', '1'); e.preventDefault(); }
    });
    cv.tabIndex = 0;
    cv.addEventListener('pointerdown', function (e) { if (!INS) return; try { cv.setPointerCapture(e.pointerId); } catch (x) {} INS.held = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false, v: 0 }; });
    cv.addEventListener('pointermove', function (e) {
      var H = INS && INS.held; if (!H || H.id !== e.pointerId) return;
      var now = performance.now(), dt = Math.max(1, now - H.t) / 1000, dp = D.axis === 'y' ? (e.clientY - H.y) / Math.max(200, cv.clientHeight) : (e.clientX - H.x) / Math.max(200, cv.clientWidth);
      if (!H.moved && Math.hypot(e.clientX - H.x0, e.clientY - H.y0) > 6) { H.moved = true; if (!INS.out) grab(); }
      if (H.moved && !INS.out) { var da = dp * D.gain; INS.s.a += da; bound(); H.v = H.v * 0.6 + (da / dt) * 0.4; INS.moving = true; }   // the machine follows the finger
      H.x = e.clientX; H.y = e.clientY; H.t = now;
    });
    function up(e) {
      var H = INS && INS.held; if (!H || H.id !== e.pointerId) return; INS.held = null;
      if (H.moved) { if (!INS.out) { var vm = D.step === 1 ? 12 : 9; INS.s.w = performance.now() - H.t > 90 ? 0 : clamp(H.v, -vm, vm); INS.s.target = null; INS.moving = true; } return; }   // let go: it carries on with the speed of the finger
      if (e.type === 'pointerup') tapAt(e.clientX, e.clientY);
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (!INS || INS.out) return; go(Math.round(INS.s.a / D.step) * D.step + (e.deltaY > 0 ? 1 : -1) * D.step * D.dir, false); }, { passive: false });
    (function loop(now) {
      if (!INS || INS.R !== R) return;
      var I = INS, w = cv.clientWidth, h = cv.clientHeight, dt = Math.min(0.05, (now - I.last) / 1000 || 0); I.last = now;
      if (w && h && (I.vw !== w || I.vh !== h)) {
        I.vw = w; I.vh = h; R.setSize(w, h, false); cam.aspect = w / h;
        var c = D.cam, k = Math.max(1, 1 / Math.min(1, cam.aspect * 1.45)), lk = new (T().Vector3)(c.look[0], c.look[1], c.look[2]), p = new (T().Vector3)(c.p[0], c.p[1], c.p[2]).sub(lk).multiplyScalar(k).add(lk);
        cam.position.copy(p); cam.lookAt(lk); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); I.moving = true;
      }
      if (!I.held || !I.held.moved) {
        if (I.mx.auto && !I.out && !I.held && !I.motor && I.s.target == null && Math.abs(I.s.w) < 0.5 * D.step) {   // Auto Play: steady, until a hand takes over
          I.s.a += D.autoSpeed * dt; I.s.w = 0; var lm = D.limit && D.limit(I.h.info); if (lm && I.s.a > lm[1] + 0.3) I.s.a = lm[0]; I.moving = true;
        } else if (I.motor && I.s.target != null) { if (!drive(I.s, dt, D.motor || 7)) { I.motor = false; settled(); } I.moving = true; }
        else if (I.s.target != null || Math.abs(I.s.w) > 0) { var on = spin(I.s, dt, D.step); bound(); I.moving = true; if (!on) settled(); }
      }
      D.apply(I.h, I.s.a);
      for (var i = I.tweens.length - 1; i >= 0; i--) { var tw = I.tweens[i]; tw.t = Math.min(1, tw.t + dt / tw.dur); var e2 = 1 - Math.pow(1 - tw.t, 3); tw.o.position.lerpVectors(tw.p0, tw.p1, e2); tw.o.quaternion.copy(tw.q0).slerp(tw.q1, e2); tw.o.scale.lerpVectors(tw.s0, tw.s1, e2); I.moving = true; if (tw.t >= 1) { I.tweens.splice(i, 1); if (tw.done) tw.done(); } }
      if (I.moving && w && h) { I.moving = false; R.render(scene, cam); }
      I.raf = requestAnimationFrame(loop);
    })(performance.now());
    chrome(); say(D.hint);
    setTimeout(function () { if (INS) cv.focus(); }, 60);
  }
  // (re)build the machine on the stage from the working state
  function load() {
    var I = INS; I.used.forEach(function (r) { r.n--; }); I.used = []; while (I.grp.children.length) I.grp.remove(I.grp.children[0]);
    I.tweens = []; I.out = null; I.flipped = false; I.swap = false; I.motor = false;
    var d = U.clone(I.d); d.mx = I.mx;
    I.h = buildMachine(d, I.grp, U.index(I.ctx.host.boardId()), function (r) { r.n++; I.used.push(r); return r; }, false);
    I.mx.page = I.h.info.page; I.s = { a: I.D.aOf(I.mx.pos, I.h.info), w: 0, target: null }; I.moving = true;
  }
  // a machine with ends (the rolodex) gives a little past its first and last card, then comes back
  function bound() { var I = INS; if (!I.D.limit) return; var lm = I.D.limit(I.h.info), lo = lm[0] - 0.35, hi = lm[1] + 0.35; if (I.s.a < lo) { I.s.a = lo; I.s.w = 0; } if (I.s.a > hi) { I.s.a = hi; I.s.w = 0; } if (I.s.target != null) I.s.target = clamp(I.s.target, lm[0], lm[1]); else if (!I.held && (I.s.a < lm[0] || I.s.a > lm[1])) I.s.target = clamp(I.s.a, lm[0], lm[1]); }
  function say(t) { if (INS) INS.el.querySelector('.mc-say').textContent = t || ''; }
  function grab() { var I = INS, was = I.mx.auto; I.mx.auto = false; I.motor = false; I.s.target = null; I.s.w = 0; if (was) chrome(); }   // a hand on the machine stops Auto Play and the motor
  function restAt() { var I = INS; return I.s.target != null ? I.s.target : I.s.a; }
  function settled() { INS.mx.pos = INS.D.posOf(INS.s.a, INS.h.info); chrome(); }
  function chrome() {
    var I = INS, el = I.el, info = I.h.info, a = restAt();
    el.querySelector('.mc-sub').textContent = (info.list ? '「' + info.list.title + '」' + info.refs.length + ' 张' : '列表已不在看板上') + ' · 只是引用，列表本身不会变';
    el.querySelector('[data-mc=auto]').textContent = I.mx.auto ? '⏸ 暂停' : '▶ 自动';
    [].forEach.call(el.querySelectorAll('[data-mc=order]'), function (b) { var k = b.getAttribute('data-arg'); b.classList.toggle('on', I.mx.order === k); if (k === 'custom') b.hidden = I.mx.order !== 'custom'; });
    var pg = el.querySelector('.mc-pg'); pg.hidden = info.pages < 2; pg.querySelector('b').textContent = (info.page + 1) + ' / ' + info.pages;
    el.querySelector('.mc-card').hidden = !I.out;
    var sw = el.querySelector('[data-mc=swap]'); sw.classList.toggle('on', I.swap); sw.textContent = I.swap ? '↔ 在下面点另一张…' : '↔ 和另一张换位置';
    el.querySelector('.mc-extra').innerHTML = I.D.extra ? I.D.extra(I.h, a) : '';
    el.querySelector('.mc-front').innerHTML = I.D.front(I.h, a).map(function (c) { return '<button type="button" data-mc="pull" data-arg="' + c.slot + '"' + (I.out && I.out.slot === c.slot ? ' class="on"' : '') + '>' + esc(c.card.title) + '</button>'; }).join('') || '<small>这里是空的</small>';
  }
  function tween(o, p1, q1, s1, dur, done) { INS.tweens = INS.tweens.filter(function (t) { return t.o !== o; }); INS.tweens.push({ o: o, p0: o.position.clone(), q0: o.quaternion.clone(), s0: o.scale.clone(), p1: p1, q1: q1, s1: s1, t: 0, dur: reduced() ? 0.01 : dur, done: done }); INS.moving = true; }
  // in the hand: straight in front of the eye, as big as the view allows, facing you (turned over about the card's own axis)
  function handPose(flipped) {
    var I = INS, cs = I.D.cs, cam = I.cam, dist = 1.15, fwd = new (T().Vector3)(); cam.getWorldDirection(fwd);
    var vh = 2 * dist * Math.tan(20 * RAD), k = Math.min(vh * 0.62 / cs.ch, vh * cam.aspect * 0.8 / cs.cw);
    var q = cam.quaternion.clone(); if (flipped) q.multiply(new (T().Quaternion)().setFromEuler(new (T().Euler)(I.D.flip === 'x' ? Math.PI : 0, I.D.flip === 'x' ? 0 : Math.PI, 0)));
    return { p: cam.position.clone().addScaledVector(fwd, dist).add(new (T().Vector3)(0, vh * 0.06, 0)), q: q, s: new (T().Vector3)(cs.cw * k, cs.ch * k, cs.ct * 2) };
  }
  function homePose(c, a) { var I = INS, o = new (T().Object3D)(); I.D.home(I.h, c, a, o); o.scale.set(I.D.cs.cw, I.D.cs.ch, I.D.cs.ct); return o; }
  // a card leaves its place and comes to you
  function pull(c) {
    var I = INS; if (I.out || !c) return;
    grab(); I.s.target = I.D.target(I.h, c, I.s.a); I.motor = !!I.D.motor && Math.abs(I.s.target - I.s.a) > 0.6; bound();   // the machine brings that card's place to hand and stops
    c.busy = true; I.scene.attach(c.mesh); I.out = c; I.flipped = false; I.mx.sel = c.card.ref;
    var hp = handPose(false); tween(c.mesh, hp.p, hp.q, hp.s, 0.42);
    chrome(); say('「' + c.card.title + '」· 点它翻面 · 放回原位它会回到原来的地方'); var b = I.el.querySelector('[data-mc=flip]'); if (b) b.focus();
  }
  function flip() { var I = INS; if (!I.out) return; I.flipped = !I.flipped; var hp = handPose(I.flipped); tween(I.out.mesh, hp.p, hp.q, hp.s, 0.4); say(I.flipped ? '背面：卡片的说明' : '正面'); }
  // … and goes back to the place it came from (or the one it was swapped into)
  function putBack(then) {
    var I = INS, c = I.out; if (!c) { if (then) then(); return; }
    I.out = null; I.swap = false; I.flipped = false;
    I.D.parentOf(I.h, c).attach(c.mesh); var o = homePose(c, restAt());
    tween(c.mesh, o.position.clone(), o.quaternion.clone(), o.scale.clone(), 0.38, function () { c.busy = false; c.mesh.scale.copy(o.scale); if (then) then(); });
    chrome(); say('放回' + I.D.where(c));
  }
  // two cards change places: the machine's own order (kept as "my order"); the list is not touched
  function swapWith(b) {
    var I = INS, a = I.out; if (!a || a === b) return;
    var base = I.h.info.page * I.D.cap, refs = swapped(I.h.info.refs, base + a.slot, base + b.slot), sa = a.slot, sb = b.slot;
    I.mx.order = 'custom'; I.mx.it = refs; I.h.info.refs = refs;
    a.slot = sb; b.slot = sa; a.mesh.userData.slot = sb; b.mesh.userData.slot = sa;
    b.busy = true; I.D.parentOf(I.h, b).attach(b.mesh); var o = homePose(b, restAt());
    tween(b.mesh, o.position.clone(), o.quaternion.clone(), o.scale.clone(), 0.5, function () { b.busy = false; });
    putBack(); say('换好了：「' + a.card.title + '」↔「' + b.card.title + '」· 只改了装置里的位置');
  }
  function hit(x, y) {
    var I = INS, r = I.R.domElement.getBoundingClientRect(), rc = new (T().Raycaster)();
    rc.setFromCamera(new (T().Vector2)((x - r.left) / r.width * 2 - 1, 1 - (y - r.top) / r.height * 2), I.cam);
    var hs = rc.intersectObjects(I.h.cards.map(function (c) { return c.mesh; }).concat(I.h.block ? [I.h.block] : []), false);   // the machine's own body hides the cards behind it
    return hs.length ? I.h.cards.filter(function (c) { return c.mesh === hs[0].object; })[0] : null;
  }
  function tapAt(x, y) {
    var I = INS, c = hit(x, y);
    if (I.out) { if (c === I.out) return flip(); if (c && I.swap) return swapWith(c); return putBack(); }
    if (c) pull(c);
  }
  function go(target, motor) { var I = INS; grab(); I.s.target = target; I.motor = !!motor; bound(); I.mx.pos = I.D.posOf(I.s.target, I.h.info); I.moving = true; chrome(); }
  function cmd(a, arg) {
    var I = INS; if (!I) return;
    if (a === 'close') return leave(true);
    if (a === 'flip') return flip();
    if (a === 'back') return putBack(function () { if (INS) INS.R.domElement.focus(); });
    if (a === 'detail' && I.out) return U.openCard(I.out.card);
    if (a === 'swap' && I.out) { I.swap = !I.swap; chrome(); return say(I.swap ? '在下面一排里点另一张（或点装置上能看到的），两张互换位置' : ''); }
    if (a === 'pull') { var c = I.h.cards.filter(function (q) { return q.slot === +arg; })[0]; if (I.out && I.out === c) return flip(); if (I.out && I.swap && c) return swapWith(c); return I.out ? putBack(function () { pull(c); }) : pull(c); }
    if (a === 'turn') { if (I.out) return; return go(Math.round(I.s.a / I.D.step) * I.D.step + (+arg) * I.D.step * I.D.dir, false); }
    if (a === 'jump') { if (I.out) return putBack(function () { cmd('jump', arg); }); go(+arg, true); return say('转到「' + initial(I.h.cards.filter(function (q) { return q.slot === +arg; })[0].card.title) + '」'); }
    if (a === 'tray') { if (I.out) return putBack(function () { cmd('tray', arg); }); var t = shortWay(I.s.a, +arg, PAT.trays), n = Math.abs(Math.round(t - I.s.a)); go(t, true); return say('第 ' + (+arg + 1) + ' 层 → 取物窗口' + (n ? '（走近的一边，' + n + ' 层）' : '')); }
    if (a === 'auto') { if (I.out) return putBack(function () { cmd('auto'); }); I.mx.auto = !I.mx.auto; I.motor = false; if (I.mx.auto) { I.s.target = null; I.s.w = 0; } else { I.s.target = Math.round(I.s.a / I.D.step) * I.D.step; bound(); } I.moving = true; chrome(); return say(I.mx.auto ? '自动运转 · 伸手一拖就停' : '停住'); }
    if (a === 'order' || a === 'page') {
      var run = function () { var I2 = INS; I2.mx.pos = I2.D.posOf(restAt(), I2.h.info); if (a === 'order') { if (arg === 'custom' && I2.mx.order !== 'custom') return; I2.mx.order = arg; if (arg !== 'custom') delete I2.mx.it; I2.mx.page = 0; } else { I2.mx.page = clamp(I2.h.info.page + (+arg), 0, I2.h.info.pages - 1); I2.mx.pos = 0; } load(); chrome(); say(a === 'order' ? '按' + ({ list: '列表顺序', title: 'A–Z', custom: '你排的顺序' }[arg]) + '重新装好 · 列表本身的顺序没有变' : '第 ' + (I2.mx.page + 1) + ' 页'); };
      return I.out ? putBack(run) : run();
    }
  }
  // leaving: whatever is in the air goes home, then only what the user chose is saved (one undo step, only if changed)
  function leave(save) {
    var I = INS; if (!I) return; INS = null;
    cancelAnimationFrame(I.raf);
    if (save) {
      I.mx.pos = I.D.posOf(I.s.target != null ? I.s.target : I.s.a, I.h.info); I.mx.page = I.h.info.page;
      var mx = cleanMx(I.mx);
      if (JSON.stringify(mx) !== I.mx0) try { I.ctx.commit(function (next) { var q = U.byId(next.displays, I.d.id); if (q) q.mx = mx; }); } catch (e) { I.ctx.toast('装置的状态没能保存'); }
    }
    I.used.forEach(function (r) { r.n--; });
    I.floor.geometry.dispose(); I.floor.material.dispose(); I.R.dispose(); try { I.R.forceContextLoss(); } catch (e) {}
    I.el.remove();
    if (save) I.ctx.refresh();
  }

  /* ================================================================ styles */
  var css = document.createElement('style'); css.id = 'minest-machines-style';
  css.textContent = [
    '#mn-bld-p .mc-menu{display:grid;gap:5px;margin:2px 0 8px}',
    '#mn-bld-p .mc-menu button{display:flex;gap:9px;align-items:center;text-align:left;min-height:46px;padding:6px 9px;background:#273449;border:1px solid #475569;border-radius:8px;color:#fff;cursor:pointer;font:inherit}',
    '#mn-bld-p .mc-menu button:disabled{opacity:.5;cursor:default}',
    '#mn-bld-p .mc-menu i{font-style:normal;font-size:21px;flex:none}',
    '#mn-bld-p .mc-menu b{display:block;font:800 12.5px system-ui}',
    '#mn-bld-p .mc-menu small{display:block;font:500 10.5px system-ui;color:#cbd5e1}',
    '#mc{position:fixed;inset:0;z-index:2147483500;display:flex;flex-direction:column;background:#1b2230;color:#f3ead6;font:14px/1.4 system-ui,-apple-system,sans-serif;pointer-events:auto;-webkit-user-select:none;user-select:none}',
    '#mc header{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top));background:#11161f}',
    '#mc header b{font:800 15px system-ui;white-space:nowrap}',
    '#mc .mc-sub{flex:1;min-width:0;font:600 12px system-ui;color:#b9c2d0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#mc .mc-x{width:44px;height:44px;border:0;border-radius:8px;background:#334155;color:#fff;font:800 16px system-ui;cursor:pointer;flex:none}',
    '#mc .mc-stage{position:relative;flex:1;min-height:0;background:radial-gradient(ellipse at 50% 38%,#4a586e,#232c3b 70%)}',
    '#mc canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}',
    '#mc canvas:active{cursor:grabbing}',
    '#mc .mc-say{position:absolute;left:50%;top:10px;transform:translateX(-50%);margin:0;width:max-content;max-width:92%;text-align:center;font:700 13px/1.35 system-ui;background:rgba(17,22,31,.82);padding:6px 12px;border-radius:14px;pointer-events:none}',
    '#mc .mc-say:empty{display:none}',
    '#mc .mc-card{position:absolute;left:0;right:0;bottom:10px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:0 8px}',
    '#mc button{min-height:44px;padding:0 13px;border:2px solid #56637a;border-radius:10px;background:#2b3545;color:#f3ead6;font:700 13px system-ui;cursor:pointer}',
    '#mc button.on{background:#f2c13d;border-color:#b98a1c;color:#2b2205}',
    '#mc button.go{background:#2f8a4a;border-color:#1f6a36;color:#fff}',
    '#mc footer{flex:none;padding:8px 10px;padding-bottom:max(8px,env(safe-area-inset-bottom));background:#11161f;display:grid;gap:7px}',
    '#mc .mc-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '#mc .mc-gap{flex:1}',
    '#mc .mc-pg{display:inline-flex;align-items:center;gap:6px}',
    '#mc .mc-pg b{font:700 13px system-ui;min-width:44px;text-align:center}',
    '#mc .mc-extra:empty{display:none}',
    '#mc .mc-tabs{display:flex;gap:5px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}',
    '#mc .mc-tabs button{flex:none;min-width:44px;padding:0 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}',
    '#mc .mc-tabs small{font:600 8px system-ui;opacity:.8;letter-spacing:1px}',
    '#mc .mc-front{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}',
    '#mc .mc-front button{flex:none;max-width:170px;min-height:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;font-size:12.5px}',
    '#mc .mc-front small{color:#94a3b8}',
    '#mc button:focus-visible,#mc canvas:focus-visible{outline:3px solid #8ec5ff;outline-offset:1px}',
    '#mc [hidden]{display:none!important}'
  ].join('\n');
  document.head.appendChild(css);

  root.MinestMachines = {
    VERSION: VERSION, pure: PURE, catalog: CATALOG,
    isOpen: function () { return !!INS; }, close: function () { leave(true); },
    // what a test (or a curious person) can read of the machine being operated — and the same hands the screen has
    state: function () {
      if (!INS) return null; var I = INS, P = new (T().Vector3)();
      return { type: I.mx.type, a: I.s.a, speed: I.s.w, target: I.s.target, motor: I.motor, pos: I.D.posOf(restAt(), I.h.info), auto: I.mx.auto, order: I.mx.order, page: I.h.info.page, pages: I.h.info.pages,
        out: I.out ? { ref: I.out.card.ref, slot: I.out.slot, flipped: I.flipped, parent: I.out.mesh.parent === I.scene ? 'hand' : 'machine' } : null,
        cards: I.h.cards.map(function (c) { c.mesh.getWorldPosition(P); return { slot: c.slot, ref: c.card.ref, inPlace: c.mesh.parent !== I.scene, y: +P.y.toFixed(3), z: +P.z.toFixed(3), rx: +c.mesh.rotation.x.toFixed(3) }; }),
        trays: I.h.trays ? I.h.trays.map(function (g, t) { return { id: t + 1, y: +g.position.y.toFixed(3), z: +g.position.z.toFixed(3), tilt: g.rotation.x + g.rotation.z }; }) : null, tweens: I.tweens.length };
    },
    cmd: function (a, arg) { cmd(a, arg); }
  };
})(typeof window === 'object' ? window : globalThis);
