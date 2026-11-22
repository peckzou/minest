/* Minest · 全息文字操作台 — the four live text modes
   1 悬浮面板 Floating Panels · 2 字母拆解 Typography Disassembly · 3 知识星图 Knowledge Constellation · 4 单词光环 Word Rings
   Every mode reads HL.content (the parent's real data, or the badged sample) and draws into HL.contentRoot. */
(function () {
  'use strict';
  var T = THREE, u = HL.u, clamp = u.clamp, lerp = u.lerp, ease = u.ease;
  function V(x, y, z) { return new T.Vector3(x || 0, y || 0, z || 0); }
  function L() { return HL.layout(); }
  function reduce() { return L().settings.reduce; }
  function damp(dt, r) { return 1 - Math.exp(-dt * r); }
  var PLANE = new T.PlaneGeometry(1, 1);

  /** a bag of GPU resources owned by a mode, freed when it exits / rebuilds */
  function Bag() { this.list = []; }
  Bag.prototype.add = function (x) { if (x) this.list.push(x); return x; };
  Bag.prototype.free = function () { this.list.forEach(function (x) { try { x.dispose(); } catch (e) {} }); this.list = []; };

  /* ───────────────────────── fonts (3D letters, stroke alphabet) ───────────────────────── */
  HL.font = null; HL.strokes = null;
  fetch('../type3d/vendor/fonts/helvetiker_bold.typeface.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j) return; HL.font = new T.Font(j); if (HL.active && HL.active.onFont) HL.active.onFont();
  }).catch(function () {});
  try {
    (new Function('u', 'return import(u)'))(new URL('../type3d/strokefont.js', location.href).href).then(function (m) {
      HL.strokes = m; if (HL.active && HL.active.onFont) HL.active.onFont();
    }).catch(function () {});
  } catch (e) {}
  function hasGlyphs(s) { if (!HL.font || !s) return false; var g = HL.font.data.glyphs; for (var i = 0; i < s.length; i++) { if (s[i] !== ' ' && !g[s[i]]) return false; } return /\S/.test(s); }
  function text3D(s, size, depth) {
    if (!hasGlyphs(s)) return null;
    var g = new T.TextGeometry(s, { font: HL.font, size: size, height: depth, curveSegments: 3, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: size * 0.022, bevelSegments: 1 });
    g.computeBoundingBox(); var b = g.boundingBox; g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
    return g;
  }
  /** a glowing glyph on a transparent plane (fallback for characters the 3D font lacks) */
  function glyphPlane(ch, color, bag) {
    var s = HL.texPR(), cv = document.createElement('canvas'); cv.width = cv.height = Math.round(160 * s); var x = cv.getContext('2d'); x.scale(s, s);
    x.font = '800 120px ' + HL.FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 18; x.fillStyle = '#eafaff';
    x.fillText(ch, 80, 86); x.shadowBlur = 0; x.fillText(ch, 80, 86);
    var tex = bag.add(HL.canvasTex(cv)), mat = bag.add(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, color: new T.Color(color) }));
    var m = new T.Mesh(PLANE, mat); return m;
  }

  /* ════════════════════════ 1 · 悬浮面板 Floating Panels ════════════════════════ */
  var P = { id: 'panels', zh: '悬浮面板', en: 'PANELS', panels: [], sel: null, bag: new Bag(), root: null };
  var SRC = [['all', '全部'], ['words', '单词'], ['charts', 'Anchor'], ['knowledge', '知识'], ['works', '作品']];
  var ARR = [['dome', '半球 Dome'], ['grid', '网格 Grid'], ['arc', '弧形 Arc'], ['stack', '叠放 Stack'], ['free', '自由 Free']];
  function srcList(src) { var c = HL.content; return src === 'words' ? c.words : src === 'charts' ? c.charts : src === 'knowledge' ? c.knowledge : src === 'works' ? c.works : c.all; }
  P.ordered = function () {
    var lp = L().panels, idx = {}; lp.order.forEach(function (x, i) { idx[x] = i; });
    return srcList(lp.src).map(function (it, i) { return { it: it, i: i }; }).sort(function (a, b) {
      var ia = idx[a.it.uid], ib = idx[b.it.uid];
      if (ia == null && ib == null) return a.i - b.i; if (ia == null) return 1; if (ib == null) return -1; return ia - ib;
    }).map(function (x) { return x.it; });
  };
  P.per = function () { return HL.narrow ? 12 : 20; };
  P.pages = function () { return Math.max(1, Math.ceil(P.ordered().length / P.per())); };
  P.slots = function (n) {
    var arr = L().panels.arrange, out = [], N = HL.narrow, C = HL.CENTER, i;
    if (arr === 'dome') {
      /* a hemisphere round you (2026-11-19, the user): the panels on the inside of a sphere whose centre is your eye —
         a wide band at eye level, smaller bands above and below tipped towards you, each panel facing the centre */
      var Rd = N ? 3.2 : 4.4, cz2 = 0.5 + Rd, bands = n <= 5 ? [0] : n <= 12 ? [0.24, -0.06] : [0.42, 0.16, -0.12, -0.38].slice(0, n > 22 ? 4 : 3);
      var w = bands.map(function (ph) { return Math.cos(ph); }), wsum = w.reduce(function (a, b) { return a + b; }, 0), counts = w.map(function (x) { return Math.max(1, Math.round(n * x / wsum)); });
      var diff = n - counts.reduce(function (a, b) { return a + b; }, 0), mid = bands.length > 1 ? 1 : 0; counts[mid] += diff;
      var sd = Math.min(1, 2.9 / (bands.length * 0.78)), k0 = 0;
      bands.forEach(function (ph, b) {
        var cnt = counts[b], step = Math.min(1.08 * sd / (Rd * Math.cos(ph)), (N ? 2.0 : 2.5) / Math.max(1, cnt - 1));
        for (var q = 0; q < cnt && k0 < n; q++, k0++) {
          var th = (q - (cnt - 1) / 2) * step;
          out.push({ p: V(Rd * Math.sin(th) * Math.cos(ph), C.y + Rd * Math.sin(ph) * 0.9, cz2 - Rd * Math.cos(th) * Math.cos(ph)), ry: -th, rx: ph * 0.9, s: sd, cz: cz2, th: th });
        }
      });
      return out;
    }
    if (arr === 'arc') {
      var rows = n > 14 ? 3 : n > 6 ? 2 : 1, per = Math.ceil(n / rows), R = N ? 3.0 : 4.6, step = 1.1 / R, cz = 0.5 + R, s = Math.min(1, 2.6 / (rows * 0.74));
      for (i = 0; i < n; i++) { var r = Math.floor(i / per), k = i % per, cnt = r === rows - 1 ? n - r * per : per, th = (k - (cnt - 1) / 2) * step * s;
        out.push({ p: V(R * Math.sin(th), C.y + ((rows - 1) / 2 - r) * 0.74 * s, cz - R * Math.cos(th)), ry: -th, rx: 0, s: s, cz: cz, th: th }); }
      return out;
    }
    if (arr === 'stack') {
      var dy = Math.min(0.13, 2.0 / Math.max(1, n));
      for (i = 0; i < n; i++) out.push({ p: V(-0.2 + i * 0.025, 1.6 + i * dy, 0.9 - i * 0.14), ry: 0.18, rx: -0.16, s: N ? 0.95 : 1.05 });
      return out;
    }
    var cols = N ? (n <= 4 ? 2 : 3) : Math.min(6, Math.max(2, Math.ceil(Math.sqrt(n * 1.7)))), rws = Math.ceil(n / cols), dx = 1.1, dyy = 0.72;
    var sc = Math.min(1.1, 2.8 / (rws * dyy), (N ? 3.5 : 6.6) / (cols * dx));
    for (i = 0; i < n; i++) {
      var c = i % cols, rr = Math.floor(i / cols), rc = rr === rws - 1 ? n - rr * cols : cols;
      out.push({ p: V((c - (rc - 1) / 2) * dx * sc, C.y + ((rws - 1) / 2 - rr) * dyy * sc, 0.3), ry: 0, rx: 0, s: sc });
    }
    if (arr === 'free') { var fr = L().panels.free; P.panels.forEach(function (pn, j) { var f = fr[pn.it.uid]; if (f && out[j]) out[j] = { p: V(f[0], f[1], f[2]), ry: 0, rx: 0, s: out[j].s }; }); }
    return out;
  };
  function workCanvas(it) {
    var W = 640, H = 400, s = HL.texPR() * 0.75, cv = document.createElement('canvas'); cv.width = W * s; cv.height = H * s; var x = cv.getContext('2d'); x.scale(s, s);
    var col = it.lookCss || '#ff5a2a';
    HL.rr(x, 4, 4, W - 8, H - 8, 22); x.fillStyle = 'rgba(6,18,34,0.35)'; x.fill(); x.lineWidth = 3; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 16; x.globalAlpha = 0.8; x.stroke(); x.globalAlpha = 1; x.shadowBlur = 0;
    x.font = '700 22px ' + HL.FONT; x.fillStyle = col; x.textBaseline = 'top'; x.fillText('3D TYPE · ' + String(it.look).toUpperCase() + ' · ' + it.mode, 32, 26);
    x.fillStyle = 'rgba(200,235,255,0.6)'; x.font = '600 18px ' + HL.FONT; x.fillText('轻触查看 · 在 3D Type 打开', 32, H - 46);
    if (!hasGlyphs(it.title)) {    // no 3D glyphs for this word → glow text on the panel
      var sz = 110; x.font = '800 ' + sz + 'px ' + HL.FONT; while (sz > 30 && x.measureText(it.title).width > W - 80) { sz -= 6; x.font = '800 ' + sz + 'px ' + HL.FONT; }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = col; x.shadowBlur = 24; x.fillStyle = '#fff6ee'; x.fillText(it.title, W / 2, H / 2); x.shadowBlur = 0; x.fillText(it.title, W / 2, H / 2);
    }
    return cv;
  }
  P.makePanel = function (it, i) {
    var g = new T.Group(), bag = P.bag, pn = { it: it, g: g, i: i, solid: null };
    var cv = it.kind === 'work' ? workCanvas(it) : HL.cardCanvas(it, 640, 400);
    pn.cv = cv; pn.tex = bag.add(HL.canvasTex(cv)); pn.mat = bag.add(HL.panelMat(pn.tex));
    pn.mesh = new T.Mesh(PLANE, pn.mat); pn.mesh.scale.set(1, 0.625, 1); pn.mesh.userData.pn = pn; g.add(pn.mesh);
    if (it.kind === 'work') {
      var geo = text3D(it.title.slice(0, 16), 0.2, 0.07);
      if (geo) { bag.add(geo); geo.computeBoundingBox(); var w = geo.boundingBox.max.x - geo.boundingBox.min.x; var m = new T.Mesh(geo, bag.add(HL.solidMat(it.lookCss))); m.scale.setScalar(Math.min(1, 0.84 / Math.max(w, 0.01))); m.position.z = 0.08; g.add(m); pn.solid = m; }
    }
    g.position.copy(HL.EMIT); g.scale.setScalar(0.001);
    pn.pos = g.position; pn.rot = 0;
    return pn;
  };
  P.build = function (keep) {
    var old = {}; if (keep) P.panels.forEach(function (pn) { old[pn.it.uid] = { p: pn.g.position.clone(), r: pn.g.rotation.y, s: pn.g.scale.x }; });
    var selUid = P.sel && P.sel.it.uid;
    P.clear();
    if (P.wallOn()) { P.buildWall(); P.sel = null; return; }
    P.wall = null;
    var lp = L().panels, all = P.ordered(), per = P.per(), pages = Math.max(1, Math.ceil(all.length / per));
    lp.page = clamp(lp.page, 0, pages - 1);
    var items = all.slice(lp.page * per, lp.page * per + per);
    P.root = new T.Group(); HL.contentRoot.add(P.root);
    P.panels = items.map(function (it, i) { var pn = P.makePanel(it, i); var o = old[it.uid]; if (o && HL.appear(0, 0) >= 1 && o.s > 0.05) { pn.g.position.copy(o.p); pn.g.rotation.y = o.r; pn.g.scale.setScalar(o.s); pn.born = -1; } P.root.add(pn.g); return pn; });
    P.retarget();
    P.sel = null; if (selUid) P.panels.forEach(function (pn) { if (pn.it.uid === selUid) P.select(pn); });
    if (!items.length) {
      var src = lp.src, msg = { all: ['还没有内容 · Nothing yet', '在 Minest 里添加单词表、Anchor Chart 或作品后会出现在这里'], words: ['还没有单词表 · No word lists yet', '在 Minest 里建一个单词表或看板列表'], charts: ['今天还没有 Anchor Chart · No charts yet', '在 EC-6 看板里挑今天的 Anchor Chart'], knowledge: ['还没有知识卡 · No knowledge yet', '知识卡会从你的看板里读取'], works: ['还没有 3D Type 作品 · No works yet', '去 3D Type 工坊做一个立体的字'] }[src];
      HL.empty(msg[0], msg[1]);
    } else HL.empty('');
  };
  P.retarget = function () { if (P.wall) return; var s = P.slots(P.panels.length); P.panels.forEach(function (pn, i) { pn.slot = s[i]; pn.i = i; }); };
  P.clear = function () { if (P.root) HL.contentRoot.remove(P.root); P.root = null; P.panels = []; P.bag.free(); };
  P.enter = function () { P.scr.x = P.scr.y = P.scr.vx = P.scr.vy = 0; P.build(false); };
  P.exit = function () { P.clear(); P.sel = null; };
  P.onContent = function () { P.build(true); HL.refreshTools(); };
  P.onFont = function () { if (P.panels.some(function (pn) { return pn.it.kind === 'work'; })) P.build(true); };
  P.resize = function () { var n = HL.narrow; if (P._narrow !== undefined && P._narrow !== n) { P.build(true); HL.refreshTools(); } else P.retarget(); P._narrow = n; };
  P.onItemEdited = function (it) {
    P.panels.forEach(function (pn) { if (pn.it === it) { var cv = HL.cardCanvas(it, 640, 400); var x = pn.cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pn.cv.width, pn.cv.height); x.drawImage(cv, 0, 0, pn.cv.width, pn.cv.height); pn.tex.needsUpdate = true; } });
  };
  P.select = function (pn) {
    P.sel = pn; P.panels.forEach(function (q) { q.mat.uniforms.uSel.value = q === pn ? 1 : 0; });
  };

  /* ── the endless wall (2026-11-19, the user: pull the wall, and cards come in from every side) ──
     On the dome the whole source is laid out as a large grid that wraps round on itself; only a window of it is on
     the hemisphere (one more column and row than you see, so cards slide in at the edges). Panels leaving one side
     come round to the other carrying the next cards. Fewer cards than fill the view: the plain dome. */
  P.wallOn = function () { return L().panels.arrange === 'dome' && P.ordered().length > P.wallDims().cv * P.wallDims().rv; };
  P.wallDims = function () { var N = HL.narrow; return { cv: N ? 4 : 6, rv: 3, R: N ? 3.2 : 4.4, st: N ? 0.36 : 0.27, sp: 0.29, s: N ? 0.82 : 0.92 }; };
  function mod(a, n) { return ((a % n) + n) % n; }
  P.buildWall = function () {
    var all = P.ordered(), N = all.length, d = P.wallDims();
    var rows = Math.max(d.rv + 1, Math.round(Math.sqrt(N / 2.2))), cols = Math.ceil(N / rows);
    P.wall = { all: all, N: N, rows: rows, cols: cols, d: d };
    P.root = new T.Group(); HL.contentRoot.add(P.root);
    var pool = [];
    for (var j = 0; j <= d.rv; j++) for (var i = 0; i <= d.cv; i++) {
      var pn = P.makePanel(all[(j * cols + i) % N], pool.length); pn.wi = i; pn.wj = j; pn.bound = null; P.root.add(pn.g); pool.push(pn);
    }
    P.panels = pool; HL.empty('');
  };
  function bindPanel(pn, it) {
    if (pn.bound === it.uid) return; pn.bound = it.uid; pn.it = it;
    var cv = it.kind === 'work' ? workCanvas(it) : HL.cardCanvas(it, 640, 400), x = pn.cv.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pn.cv.width, pn.cv.height); x.drawImage(cv, 0, 0, pn.cv.width, pn.cv.height); pn.tex.needsUpdate = true;
    if (pn.solid) { pn.g.remove(pn.solid); pn.solid = null; }
  }
  P.updateWall = function (dt, t) {
    var W = P.wall, d = W.d, C = HL.CENTER, cz = 0.5 + d.R, k = damp(dt, P.scr.held ? 18 : 8), rd = reduce();
    if (!P.scr.held) { var f = Math.exp(-dt * 3.5); P.scr.x += P.scr.vx * dt * 30; P.scr.y += P.scr.vy * dt * 30; P.scr.vx *= f; P.scr.vy *= f;
      if (Math.abs(P.scr.vx) < 0.002) P.scr.x += (Math.round(P.scr.x) - P.scr.x) * damp(dt, 4);   // settle on a whole column / row
      if (Math.abs(P.scr.vy) < 0.002) P.scr.y += (Math.round(P.scr.y) - P.scr.y) * damp(dt, 4); }
    var ox = -P.scr.x, oy = -P.scr.y, bc = Math.floor(ox), fx = ox - bc, br = Math.floor(oy), fy = oy - br;
    P.panels.forEach(function (pn, n) {
      var i = pn.wi, j = pn.wj, gc = mod(bc + i, W.cols), gr = mod(br + j, W.rows), idx = mod(gr * W.cols + gc, W.N);
      bindPanel(pn, W.all[idx]);
      var th = (i - fx - d.cv / 2) * d.st, ph = ((d.rv - 1) / 2 - (j - fy)) * d.sp;
      var edge = Math.min(1, Math.max(0, (d.cv / 2 + 0.55 - Math.abs(i - fx - d.cv / 2)) / 0.6), Math.max(0, ((d.rv - 1) / 2 + 0.75 - Math.abs((d.rv - 1) / 2 - (j - fy))) / 0.6));
      var g = pn.g, a = HL.appear(n, 0.03), tx = d.R * Math.sin(th) * Math.cos(ph), ty = C.y + d.R * Math.sin(ph) * 0.9 + (rd ? 0 : Math.sin(t * 0.8 + n * 1.7) * 0.015), tz = cz - d.R * Math.cos(th) * Math.cos(ph) + (P.sel === pn ? 0.12 : 0);
      if (!pn.dragging) { g.position.x = lerp(g.position.x, tx, k); g.position.y = lerp(g.position.y, ty, k); g.position.z = lerp(g.position.z, tz, k); }
      g.rotation.y = lerp(g.rotation.y, -th, k); g.rotation.x = lerp(g.rotation.x, ph * 0.9, k);
      var sc = d.s * a * (P.sel === pn ? 1.06 : 1); g.scale.set(lerp(g.scale.x, sc, k) || 0.001, lerp(g.scale.y, sc, k) || 0.001, 1);
      pn.mat.uniforms.uOpacity.value = (0.25 + 0.75 * a) * edge; pn.mesh.visible = edge > 0.02;
    });
  };
  /* pulling the wall (2026-11-19, the user: dragging should pull the wall of cards, the holo table must not turn): on
     the dome / arc it turns round you, elsewhere it slides; it glides on and springs back past its ends */
  P.scr = { x: 0, y: 0, vx: 0, vy: 0, held: false };
  P.range = function () {
    var arr = L().panels.arrange, sl = P.panels.map(function (pn) { return pn.slot; }).filter(Boolean);
    if (!sl.length) return { x: 0, y: 0 };
    if (arr === 'dome' || arr === 'arc') { var mth = Math.max.apply(null, sl.map(function (q) { return Math.abs(q.th || 0); })); return { x: Math.max(0.25, mth + 0.15), y: 0.9 }; }
    var mx = Math.max.apply(null, sl.map(function (q) { return Math.abs(q.p.x); })), my = Math.max.apply(null, sl.map(function (q) { return Math.abs(q.p.y - HL.CENTER.y); }));
    return { x: Math.max(0.6, mx), y: Math.max(0.5, my) };
  };
  P.emptyDrag = function (dx, dy) {
    if (P.wall) { var cw = (HL.narrow ? 150 : 190); P.scr.x += dx / cw; P.scr.y -= dy / 170; P.scr.vx = dx / cw; P.scr.vy = -dy / 170; P.scr.held = true; return true; }
    var arr = L().panels.arrange, curved = arr === 'dome' || arr === 'arc', rg = P.range(), sx = curved ? 0.0042 : 0.006, sy = 0.006;
    var over = function (v, lim) { return Math.abs(v) > lim ? 0.35 : 1; };   // resistance past the ends
    P.scr.x += dx * sx * over(P.scr.x, rg.x); P.scr.y -= dy * sy * over(P.scr.y, rg.y); P.scr.vx = dx * sx; P.scr.vy = -dy * sy; P.scr.held = true;
    return true;
  };
  P.emptyDragEnd = function () { P.scr.held = false; };
  function scrolled(sl, out) {
    var a = P.scr.x, arr = L().panels.arrange;
    if ((arr === 'dome' || arr === 'arc') && sl.cz != null) {
      var x = sl.p.x, zr = sl.p.z - sl.cz, c = Math.cos(a), s2 = Math.sin(a);
      out.p.set(x * c - zr * s2, sl.p.y + P.scr.y, sl.cz + zr * c + x * s2); out.ry = sl.ry - a; return out;
    }
    out.p.set(sl.p.x + a, sl.p.y + P.scr.y, sl.p.z); out.ry = sl.ry; return out;
  }
  var _sl = { p: V(), ry: 0 };
  P.update = function (dt, t) {
    if (P.wall) { P.updateWall(dt, t); return; }
    var k = damp(dt, 6), rd = reduce(), lp = L().panels;
    if (!P.scr.held) {   // glide on, then spring back inside the range
      var rg = P.range(), f = Math.exp(-dt * 4);
      P.scr.x += P.scr.vx * dt * 30; P.scr.y += P.scr.vy * dt * 30; P.scr.vx *= f; P.scr.vy *= f;
      if (Math.abs(P.scr.x) > rg.x) P.scr.x += (Math.sign(P.scr.x) * rg.x - P.scr.x) * damp(dt, 8);
      if (Math.abs(P.scr.y) > rg.y) P.scr.y += (Math.sign(P.scr.y) * rg.y - P.scr.y) * damp(dt, 8);
    }
    for (var i = 0; i < P.panels.length; i++) {
      var pn = P.panels[i], g = pn.g, a = pn.born === -1 ? 1 : HL.appear(i, 0.06), sl = pn.slot; if (!sl) continue;
      var sp = scrolled(sl, _sl), kk = P.scr.held ? damp(dt, 18) : k;
      if (!pn.dragging && a > 0) {
        var ty = sp.p.y + (rd ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.02), tz = sp.p.z + (P.sel === pn ? 0.12 : 0);
        g.position.x = lerp(g.position.x, sp.p.x, kk); g.position.y = lerp(g.position.y, ty, kk); g.position.z = lerp(g.position.z, tz, kk);
      }
      var rot = sp.ry + (lp.rot[pn.it.uid] || 0);
      g.rotation.y = lerp(g.rotation.y, rot, k); g.rotation.x = lerp(g.rotation.x, sl.rx, k);
      var s = sl.s * a * (P.sel === pn ? 1.06 : 1);
      g.scale.set(lerp(g.scale.x, s, k * 1.4) || 0.001, lerp(g.scale.y, s * (a * a), k * 1.4) || 0.001, 1);
      pn.mat.uniforms.uOpacity.value = 0.25 + 0.75 * a;
      if (pn.solid) pn.solid.rotation.y = rd ? 0 : Math.sin(t * 0.9 + i) * 0.35;
    }
  };
  P.pick = function (x, y) {
    if (!P.panels.length) return null;
    var hits = HL.rayAt(x, y).intersectObjects(P.panels.map(function (p) { return p.mesh; }), false);
    return hits.length ? { pn: hits[0].object.userData.pn, drag: true } : null;
  };
  P.dragStart = function (h, x, y) { var pn = h.pn; pn.dragging = true; pn.drag = HL.dragPlane(pn.g.position.clone(), x, y); P.select(pn); };
  P.dragMove = function (h, x, y) { var p = h.pn.drag.to(x, y); if (p) h.pn.g.position.copy(p); };
  P.dragEnd = function (h) {
    var pn = h.pn, lp = L().panels; pn.dragging = false;
    if (P.wall) return;
    if (lp.arrange === 'free') { var q = pn.g.position; lp.free[pn.it.uid] = [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)]; pn.slot = { p: q.clone(), ry: 0, rx: 0, s: pn.slot.s }; HL.save(); return; }
    var slots = P.slots(P.panels.length), best = pn.i, bd = Infinity;
    slots.forEach(function (s, j) { var d = s.p.distanceTo(pn.g.position); if (d < bd) { bd = d; best = j; } });
    if (best !== pn.i) {
      P.panels.splice(pn.i, 1); P.panels.splice(best, 0, pn);
      var vis = P.panels.map(function (q) { return q.it.uid; }), full = P.ordered().map(function (it) { return it.uid; }), start = lp.page * P.per();
      full = full.slice(0, start).concat(vis, full.slice(start + vis.length));
      var inFull = {}; full.forEach(function (x) { inFull[x] = 1; });
      lp.order = full.concat(lp.order.filter(function (x) { return !inFull[x]; }));
      HL.save(); HL.toast('顺序已保存 · Order saved', 1200);
    }
    P.retarget();
  };
  P.tap = function (h) {
    if (!h) { if (P.sel) { P.select(null); HL.detail.close(); HL.refreshTools(); } return; }
    P.select(h.pn); HL.detail.open(h.pn.it, { actions: [['⟲', function () { P.twist(-Math.PI / 8); }], ['⟳', function () { P.twist(Math.PI / 8); }]] }); HL.refreshTools();
  };
  P.onDetailClosed = function () { if (P.sel) { P.select(null); HL.refreshTools(); } };
  P.twist = function (d) { if (!P.sel) return; var r = L().panels.rot, k = P.sel.it.uid; r[k] = clamp((r[k] || 0) + d, -Math.PI, Math.PI); HL.save(); };
  P.tools = function (box) {
    var lp = L().panels, ui = HL.ui, c = HL.content;
    ui.lab(box, '来源');
    SRC.forEach(function (s) { var n = srcList(s[0]).length; ui.chip(box, s[1] + ' ' + n, lp.src === s[0], function () { lp.src = s[0]; lp.page = 0; HL.detail.close(); P.build(false); HL.save(); HL.refreshTools(); }); });
    ui.sep(box); ui.lab(box, '排序');
    ARR.forEach(function (a) { ui.chip(box, a[1], lp.arrange === a[0], function () { lp.arrange = a[0]; P.retarget(); HL.save(); HL.refreshTools(); }, a[0] === 'free' ? '拖到哪里就停在哪里' : '重新排列 · Re-arrange'); });
    var pages = P.wall ? 1 : P.pages();
    if (pages > 1) {
      ui.sep(box);
      ui.chip(box, '◂', false, function () { lp.page = (lp.page - 1 + pages) % pages; HL.detail.close(); P.build(false); HL.save(); HL.refreshTools(); }).disabled = false;
      ui.lab(box, (lp.page + 1) + ' / ' + pages);
      ui.chip(box, '▸', false, function () { lp.page = (lp.page + 1) % pages; HL.detail.close(); P.build(false); HL.save(); HL.refreshTools(); });
    }
    if (P.sel) {
      ui.sep(box);
      ui.chip(box, '⟲', false, function () { P.twist(-Math.PI / 8); }, '向左转 Rotate left');
      ui.chip(box, '⟳', false, function () { P.twist(Math.PI / 8); }, '向右转 Rotate right');
      ui.chip(box, '摆正', false, function () { delete lp.rot[P.sel.it.uid]; HL.save(); }, '回正 Reset rotation');
    }
    ui.sep(box);
    ui.chip(box, '↺ 默认', false, function () { var all = {}; srcList(lp.src).forEach(function (it) { all[it.uid] = 1; }); lp.order = lp.order.filter(function (x) { return !all[x]; }); Object.keys(all).forEach(function (k) { delete lp.rot[k]; delete lp.free[k]; }); P.build(true); HL.save(); HL.toast('已恢复默认顺序 · Default order', 1200); }, '恢复默认顺序和角度');
  };
  HL.register(P);

  /* ════════════════════════ 2 · 构词拆解 Word Breakdown (was 字母拆解) ════════════════════════
     2026-11-19, the user: splitting into letters means nothing — split by roots, by sense groups, and take sentences
     apart into words. Three levels, each from the card's own breakdown (HL item .bd, sent by the parent: the card's
     parts from the AI fill, the AI breakdown kept on the device, or conservative rules), never invented here:
       词根 morph  — prefix / root / suffix in their colours, each with its meaning
       意群 chunk  — a phrase in sense groups
       句子 sent   — the example sentence: its sense groups as arcs, each word a piece (content words bright, function
                     words dim), the word's gloss under it when the AI breakdown gave one */
  var D = { id: 'dis', zh: '构词拆解', en: 'WORD PARTS', bag: new Bag(), pieces: [], ex: 0, exT: 0, iso: -1, root: null, phase: 0 };
  var KCOL = { pre: '#ffd27a', root: '#6fe3ff', suf: '#7dffb0' }, KZH = { pre: '前缀', root: '词根', suf: '后缀' }, GCOL = ['#6fe3ff', '#ffd27a', '#b58cff', '#7dffb0', '#ff8fb1', '#9fc4ff', '#ffb27a', '#8fffe8'];
  function wordPlane(str, color, bag) {   // a glowing word on a plane, for text the 3D font lacks (Chinese, accents)
    var s = HL.texPR(), W = 512, H = 160, cv = document.createElement('canvas'); cv.width = W * s; cv.height = H * s; var x = cv.getContext('2d'); x.scale(s, s);
    var sz = 96; x.font = '800 ' + sz + 'px ' + HL.FONT; while (sz > 30 && x.measureText(str).width > W - 20) { sz -= 6; x.font = '800 ' + sz + 'px ' + HL.FONT; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 18; x.fillStyle = '#eafaff'; x.fillText(str, W / 2, H / 2 + 4); x.shadowBlur = 0; x.fillText(str, W / 2, H / 2 + 4);
    var tex = bag.add(HL.canvasTex(cv)), mat = bag.add(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, color: new T.Color(color) }));
    var m = new T.Mesh(PLANE, mat); m.userData.plane = true; m.userData.aspect = W / H; return m;
  }
  function levels(it) { var b = it && it.bd || {}; return { morph: !!(b.morph && b.morph.length > 1), chunk: !!(b.chunks && b.chunks.length > 1), sent: !!(b.sentence && b.sentence.chunks && b.sentence.chunks.length) }; }
  D.candidates = function () {
    var c = HL.content, out = [], seen = {}, lv = L().dis.level;
    c.words.concat(c.works, c.charts, c.knowledge).forEach(function (it) {
      if (seen[it.uid] || !(it.title || '').trim()) return; var ok = levels(it);
      if (lv === 'morph' ? ok.morph || ok.chunk : lv === 'chunk' ? ok.chunk || ok.morph : ok.sent) { seen[it.uid] = 1; out.push(it); }
    });
    return out;
  };
  D.item = function () { var cs = D.candidates(), w = L().dis.word; for (var i = 0; i < cs.length; i++) if (cs[i].uid === w) return cs[i]; return cs[0] || null; };
  D.clear = function () { if (D.root) HL.contentRoot.remove(D.root); D.root = null; D.pieces = []; D.labels = null; D.bag.free(); D.iso = -1; HL.info(''); };
  D.exit = function () { D.clear(); };
  D.enter = function () { D.build(); };
  D.onContent = function () { D.build(true); HL.refreshTools(); };
  D.onFont = function () { D.build(true); HL.refreshTools(); };
  D.onItemEdited = function (it) { if (D.it === it) { D.build(true); HL.refreshTools(); } };
  D.resize = function () { if (D._narrow !== undefined && D._narrow !== HL.narrow) D.build(true); D._narrow = HL.narrow; };
  D.mats = {};
  function dmat(key, color) { if (!D.mats[key]) D.mats[key] = D.bag.add(HL.solidMat(color)); return D.mats[key]; }
  /* the segments for the level in view: [{ text, sub (label), color, group }] */
  function segments(it, lv) {
    var b = it.bd || {}, out = [];
    if (lv === 'sent' && b.sentence) { b.sentence.chunks.forEach(function (c, g) { c.words.forEach(function (w) { out.push({ text: w.w, sub: w.zh ? w.zh + (w.pos ? ' · ' + w.pos : '') : (w.fn ? '功能词' : '实词'), color: w.fn ? '#7f9fbf' : GCOL[g % GCOL.length], group: g, gzh: c.zh, gtext: c.text, fn: w.fn }); }); }); return out; }
    if ((lv === 'chunk' || !(b.morph && b.morph.length)) && b.chunks && b.chunks.length > 1) { b.chunks.forEach(function (c, g) { out.push({ text: c.text, sub: c.zh || ('意群 ' + (g + 1)), color: GCOL[g % GCOL.length], group: g }); }); return out; }
    if (b.morph && b.morph.length) { b.morph.forEach(function (m, g) { out.push({ text: m.p, sub: (m.m || '') + ' · ' + (b.form && m.k === 'root' ? '原形' : KZH[m.k] || ''), color: KCOL[m.k] || '#6fe3ff', group: g, k: m.k }); }); return out; }
    return out;
  }
  D.build = function (keep) {
    var prevEx = D.ex, prevT = D.exT, wasGame = D.game && D.game.on; D.mats = {}; D.clear(); D.game = { on: false }; D.slotMeshes = null;
    D.it = D.item(); var it = D.it, lv = L().dis.level; D.lv = lv;
    if (!it) { HL.empty({ morph: '还没有可拆的构词 · Nothing to take apart yet', chunk: '还没有可分意群的短语 · No phrases yet', sent: '还没有例句 · No example sentences yet' }[lv] || '', '在 Minest 的爆炸学习卡里点「✦ AI 拆解」，或给卡片补全例句后会出现在这里'); return; }
    HL.empty('');
    D.root = new T.Group(); HL.contentRoot.add(D.root);
    var segs = segments(it, lv); D.segs = segs;
    var nG = segs.reduce(function (m, x) { return Math.max(m, x.group + 1); }, 0); D.nG = nG;
    var sz = lv === 'sent' ? 0.3 : 0.42, gapW = sz * 0.42, maxW = HL.narrow ? 2.8 : 3.8, C = HL.CENTER;
    /* the pieces, each a whole segment in 3D letters (or a glowing plane when the font lacks a character) */
    var pieces = segs.map(function (sg, j) {
      var shown = lv === 'morph' ? String(sg.text).replace(/^-|-$/g, '') || sg.text : sg.text;   // the hyphen stays in the label, not in the letters
      var geo = text3D(shown, sz, 0.12), m, w;
      if (geo) { D.bag.add(geo); w = geo.boundingBox.max.x - geo.boundingBox.min.x; m = new T.Mesh(geo, dmat('g' + j, sg.color)); }
      else { m = wordPlane(shown, sg.color, D.bag); w = sz * 1.4 * m.userData.aspect * 0.5; m.scale.set(w, w / m.userData.aspect, 1); }
      return { mesh: m, w: w, seg: sg, j: j, color: sg.color, size: sz };
    });
    /* assembled: the word / phrase / sentence read as one line (a sentence wraps by sense group) */
    var lines = [[]], lw = 0, LW = [];
    pieces.forEach(function (p, j) { var add = p.w + (lines[lines.length - 1].length ? gapW * (lv === 'morph' ? 0.15 : 1) : 0); if (lv === 'sent' && lw + add > maxW * 1.25 && lines[lines.length - 1].length && (j === 0 || p.seg.group !== pieces[j - 1].seg.group)) { LW.push(lw); lines.push([]); lw = 0; add = p.w; } lines[lines.length - 1].push(p); lw += add; });
    LW.push(lw);
    var widest = Math.max.apply(null, LW), s = Math.min(1, maxW / Math.max(widest, 0.01)); D.s = s;
    lines.forEach(function (ln, r) {
      var pen = -LW[r] * s / 2, y = C.y + ((lines.length - 1) / 2 - r) * sz * 1.9 * s;
      ln.forEach(function (p, q) { if (q) pen += gapW * (lv === 'morph' ? 0.15 : 1) * s; p.home = V(pen + p.w * s / 2, y, 0.3); pen += p.w * s; });
    });
    pieces.forEach(function (p) { p.cur = HL.EMIT.clone(); p.off = V(); p.mesh.position.copy(p.cur); p.baseScale = p.mesh.scale.x; p.baseScaleY = p.mesh.scale.y; p.mesh.scale.multiplyScalar(0.001); if (!p.mesh.userData.plane) p.mesh.scale.setScalar(s * 0.001); D.root.add(p.mesh); p.base = p.mesh.userData.plane ? p.baseScale * s : s; });
    if (keep) pieces.forEach(function (p) { p.cur.copy(p.home); });
    D.pieces = pieces;
    /* labels: one per piece (its meaning / role), one per sense group (sentence), and a title line */
    var nl = pieces.length + nG + 1, atlas = D.atlas = HL.Atlas(256, 72, 1024); D.bag.add(atlas);
    var bb = D.labels = HL.Billboards(nl, atlas); D.bag.add(bb); D.root.add(bb.mesh);
    pieces.forEach(function (p, j) { bb.uv(j, atlas.alloc(HL.labelDraw(p.seg.text, p.seg.sub, p.color))); });
    D.groupLab = pieces.length;
    for (var g = 0; g < nG; g++) { var first = pieces.filter(function (p) { return p.seg.group === g; })[0], gz = first && first.seg.gzh; bb.uv(pieces.length + g, atlas.alloc(HL.labelDraw(lv === 'sent' ? '意群 ' + (g + 1) : '', gz || (first ? u.str(first.seg.gtext || '', 30) : ''), GCOL[g % GCOL.length], { plate: true }))); }
    D.titleLab = nl - 1;
    var b = it.bd || {}, sub = lv === 'morph' ? (b.origin || (b.form ? '词形变化 · 原形 + 词尾' : '按真实词根词缀拆分')) : lv === 'chunk' ? '按意群切分' : '句子按意群分组 · 逐词拆开';
    bb.uv(nl - 1, atlas.alloc(HL.labelDraw(lv === 'sent' ? u.str(it.title, 24) : it.title, sub + (b.ai ? ' · AI' : ''), '#6fe3ff', { size: 34 })));
    bb.commit();
    D.ex = keep ? prevEx : 0; D.exT = keep ? prevT : 0; D.iso = -1;
    if (wasGame && D.pieces.length > 1) D.startGame();
  };
  var _p = V();
  /* exploded: morphemes / groups move apart on a shallow arc round you; a sentence's groups become arcs of their own,
     stacked, the words inside a group spaced out */
  D.expPos = function (p, t, out) {
    var C = HL.CENTER, n = D.pieces.length, lv = D.lv, s = D.s, rd = reduce() ? 0 : 1;
    if (lv === 'sent') {
      var g = p.seg.group, nG = D.nG, inG = D.pieces.filter(function (q) { return q.seg.group === g; }), k = inG.indexOf(p), m = inG.length;
      var R = HL.narrow ? 2.6 : 3.6, row = g, rows = nG, y = C.y + ((rows - 1) / 2 - row) * 0.62 * Math.min(1, 4 / rows);
      var span = Math.min(1.4, 0.36 * m), th = (k - (m - 1) / 2) * (span / Math.max(1, m - 1)) + (g % 2 ? 0.08 : -0.08);
      return out.set(R * Math.sin(th), y + Math.sin(t * 0.8 + p.j) * 0.03 * rd, 0.5 + R - R * Math.cos(th) - R * 0.9 + (g % 2 ? 0.15 : 0));
    }
    /* morphemes / groups move apart along the line they were read on: each keeps its width, with clear space between,
       bowed gently towards you */
    var spread = 0.22 + 0.06 * Math.min(4, n), x = p.home.x * 1.12 + (p.j - (n - 1) / 2) * spread;
    return out.set(x, C.y + Math.sin(t * 0.9 + p.j * 1.3) * 0.05 * rd + (p.j % 2 ? 0.12 : -0.06), 0.45 + Math.abs(x) * 0.18);
  };
  var ISO = V();
  D.update = function (dt, t) {
    if (!D.pieces.length) return;
    var rd = reduce(), sp = rd ? 6 : 1.6;
    D.ex += clamp(D.exT - D.ex, -sp * dt, sp * dt);
    var e = ease(D.ex), k = damp(dt, 7), _d = V();
    ISO.set(0, HL.CENTER.y + 0.2, HL.narrow ? 1.2 : 1.5);
    var bb = D.labels, cs = [];
    for (var j = 0; j < D.pieces.length; j++) {
      var p = D.pieces[j], m = p.mesh, a = HL.appear(j, 0.05);
      var GM = D.game.on;
      if (GM) { _d.copy(p.placed ? p.slot : p.scatter); if (D.game.done) _d.y += Math.sin((t - D.game.doneAt) * 6 + j * 0.6) * 0.04 * Math.max(0, 1 - (t - D.game.doneAt) / 2.5); }
      else { D.expPos(p, t, _d); _d.lerp(p.home, 1 - e).add(p.off); }
      var sc = 1, op = 1;
      if (D.iso >= 0) { if (D.iso === j) { _d.copy(ISO); sc = 2.0; } else { _d.z -= 0.9; op = 0.22; } }
      if (a <= 0) continue;
      if (!p.dragging) { p.cur.lerp(_d, a < 1 ? damp(dt, 4) : k); m.position.copy(p.cur); }
      if (m.userData.plane) { var tw = p.base * sc * a; m.scale.set(lerp(m.scale.x, tw, k) || 0.001, lerp(m.scale.y, tw / m.userData.aspect, k) || 0.001, 1); m.quaternion.copy(HL.camera.quaternion); }
      else { var ns = lerp(m.scale.x, p.base * sc * a, k); m.scale.setScalar(Math.max(ns, 0.001)); m.rotation.y = D.iso === j ? Math.sin(t * 0.7) * 0.4 : e * Math.sin(t * 0.6 + j) * (rd ? 0.08 : 0.25) - (D.lv !== 'morph' ? e * Math.atan2(m.position.x, 3.5) : 0); m.rotation.x = e * Math.sin(t * 0.5 + j * 2) * (rd ? 0.03 : 0.1); }
      if (!m.userData.plane) m.material = D.game.on && D.game.done ? dmat('hi', '#ffffff') : D.iso >= 0 && D.iso !== j ? dmat('dim', '#2a5a7a') : D.iso === j ? dmat('hi', '#ffffff') : dmat('g' + j, p.color);
      if (D.game.on && !p.placed && !p.dragging && !m.userData.plane) m.rotation.z = lerp(m.rotation.z, p.tilt, k); else if (!m.userData.plane) m.rotation.z = lerp(m.rotation.z, 0, k);
      var la = D.game.on ? a * (p.placed && !D.game.done ? 0.55 : 1) : (D.iso < 0 ? e : (D.iso === j ? 1 : 0)) * a * op;
      _p.copy(m.position); _p.y -= p.size * D.s * (D.iso === j ? 1.5 : 0.8) + 0.08;
      var lw = (HL.narrow ? 0.95 : 0.9) * (D.iso === j ? 1.3 : 1);
      bb.set(j, _p, la > 0.02 ? lw : 0, la > 0.02 ? lw * 72 / 256 : 0); bb.tint(j, 1, 1, 1, la);
      var gi = p.seg.group; cs[gi] = cs[gi] || V(); if (!cs[gi].n) cs[gi].n = 0; cs[gi].add(m.position); cs[gi].n++;
    }
    for (var c = 0; c < D.nG; c++) {
      var show = D.lv === 'sent' && D.iso < 0 && cs[c] ? e : 0, idx = D.groupLab + c;
      if (cs[c]) { _p.copy(cs[c]).multiplyScalar(1 / cs[c].n); _p.y += 0.34; }
      var w = HL.narrow ? 0.72 : 0.66; bb.set(idx, _p, show > 0.02 ? w : 0, show > 0.02 ? w * 72 / 256 : 0); bb.tint(idx, 1, 1, 1, show);
    }
    if (D.game.on && D.slotMeshes) { var dragged = D.pieces.filter(function (q) { return q.dragging; })[0]; D.slotMeshes.forEach(function (sm, si) { var near = false; if (dragged) { var a1 = HL.screenOf(dragged.mesh.position), b1 = HL.screenOf(D.pieces[si].slot); near = Math.hypot(a1.x - b1.x, a1.y - b1.y) < Math.max(44, (D.pieces[si].w * D.s + 0.12) * b1.ppu * 0.6); } sm.material.opacity = near ? 1 : 0.5 + 0.15 * Math.sin(t * 3 + si); sm.material.color.set(near ? '#ffffff' : '#6fe3ff'); }); }
    var ta = D.game.on ? 0 : (1 - e) * HL.appear(D.pieces.length, 0.05) * (D.iso < 0 ? 1 : 0), tw2 = HL.narrow ? 1.6 : 1.8;
    _p.set(0, HL.CENTER.y + 0.75, 0.3); bb.set(D.titleLab, _p, ta > 0.02 ? tw2 : 0, ta > 0.02 ? tw2 * 72 / 256 : 0); bb.tint(D.titleLab, 1, 1, 1, ta);
    bb.commit();
  };
  D.pick = function (x, y) {
    var best = null, bd = Infinity;
    D.pieces.forEach(function (p, j) {
      var sc = HL.screenOf(p.mesh.position); if (sc.behind) return;
      var r = Math.max(28, p.w * D.s * sc.ppu * 0.55), d = Math.hypot(sc.x - x, sc.y - y);
      if (d < r && sc.depth + d * 0.001 < bd) { bd = sc.depth + d * 0.001; best = { p: p, j: j, drag: true }; }
    });
    return best;
  };
  D.tap = function (h) {
    if (D.game.on) { if (h) HL.info('“' + h.p.seg.text + '” · ' + h.p.seg.sub); return; }
    if (!h) { if (D.iso >= 0) { D.iso = -1; HL.info(''); } else HL.detail.close(); return; }
    if (D.exT < 0.5) { D.exT = 1; HL.refreshTools(); return; }
    if (D.iso === h.j) { D.iso = -1; HL.info(''); return; }
    D.iso = h.j; var sg = h.p.seg;
    HL.info('“' + sg.text + '” · ' + sg.sub + (D.lv === 'sent' && sg.gtext ? ' · 意群 ' + (sg.group + 1) + '：' + sg.gtext + (sg.gzh ? '（' + sg.gzh + '）' : '') : ''));
  };

  /* ── 🧩 拼装 — the breakdown as an assembly game (2026-11-19, the user): the pieces fly apart and shuffle above, the
     slots wait in reading order below (dashed outlines); each piece carries its meaning; drag a piece into its slot — the
     right one locks in, a wrong one springs back ("不是这里"). All in: the whole lights up, with the time and the misses. ── */
  D.game = { on: false };
  var _beep = null;
  function chime(ok) {   // a short synthesised tone (no files): up for right, down for wrong
    try { _beep = _beep || new (window.AudioContext || window.webkitAudioContext)(); var a = _beep, o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(ok ? 660 : 220, t0); o.frequency.exponentialRampToValueAtTime(ok ? 990 : 150, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(t0 + 0.25); } catch (e) {}
  }
  D.startGame = function () {
    if (!D.pieces.length) return;
    var G = D.game = { on: true, t0: HL.now, misses: 0, done: false, doneAt: 0 }, C = HL.CENTER, n = D.pieces.length, maxW = HL.narrow ? 2.8 : 3.9;
    /* shuffled places above the slots, never in their own order */
    var order = D.pieces.map(function (p, j) { return j; });
    for (var tries = 0; tries < 8; tries++) { order.sort(function () { return Math.random() - 0.5; }); if (n < 2 || order.some(function (x, j) { return x !== j; })) break; }
    var cols = Math.min(n, HL.narrow ? 3 : 5), rows = Math.ceil(n / cols);
    D.pieces.forEach(function (p, j) {
      var k = order.indexOf(j), c = k % cols, r = Math.floor(k / cols);
      p.scatter = V((c - (cols - 1) / 2) * (maxW / Math.max(1, cols - 0.4)) + (Math.random() - 0.5) * 0.15, C.y + 0.7 + (rows - 1 - r) * 0.42 + (Math.random() - 0.5) * 0.1, 0.55 + Math.random() * 0.2);
      p.placed = false; p.tilt = (Math.random() - 0.5) * 0.5; p.off.set(0, 0, 0);
    });
    /* the slots: a dashed outline where each piece belongs (reading order) */
    D.slotMeshes = D.pieces.map(function (p) {
      var w = p.w * D.s + 0.12, h = p.size * D.s * 1.35, geo = D.bag.add(new T.EdgesGeometry(new T.PlaneGeometry(w, h)));
      var mat = D.bag.add(new T.LineDashedMaterial({ color: 0x6fe3ff, dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.65 }));
      var m = new T.LineSegments(geo, mat); m.computeLineDistances(); m.position.copy(p.home); m.position.y -= 0.45; D.root.add(m); return m;
    });
    D.pieces.forEach(function (p) { p.slot = p.home.clone(); p.slot.y -= 0.45; });
    D.iso = -1; HL.info('把碎片拖进下面的空槽，按它们本来的顺序拼起来');
    HL.refreshTools();
  };
  D.stopGame = function () {
    D.game = { on: false }; (D.slotMeshes || []).forEach(function (m) { if (m.parent) m.parent.remove(m); }); D.slotMeshes = null;
    D.pieces.forEach(function (p) { p.placed = false; p.off.set(0, 0, 0); }); HL.info(''); HL.refreshTools();
  };
  function gameDrop(p) {
    /* measured on the screen: the piece floats in front of the slots, so in space they never quite meet */
    var G = D.game, best = -1, bd = 1e9, sp = HL.screenOf(p.mesh.position), lim = 0;
    D.pieces.forEach(function (q, j) { if (q.placed) return; var ss = HL.screenOf(q.slot), d = Math.hypot(ss.x - sp.x, ss.y - sp.y); if (d < bd) { bd = d; best = j; lim = Math.max(44, (q.w * D.s + 0.12) * ss.ppu * 0.6); } });
    if (best < 0 || bd > lim) { p.scatter.copy(p.mesh.position); return; }   // let go in the open: it stays there
    var want = D.pieces[best];
    if (want === p || (want.seg.text === p.seg.text && !want.placed)) {
      if (want !== p) { var tmp = want.slot; want.slot = p.slot; p.slot = tmp; }   // the same text twice: either fits
      p.placed = true; p.cur.copy(p.mesh.position); chime(true);
      if (D.slotMeshes) D.slotMeshes[D.pieces.indexOf(p)].visible = false;
      if (D.pieces.every(function (q) { return q.placed; })) {
        G.done = true; G.doneAt = HL.now; var secs = Math.round(HL.now - G.t0);
        HL.toast('✓ 拼好了！' + secs + ' 秒 · 放错 ' + G.misses + ' 次', 3200); HL.info('“' + (D.it ? D.it.title : '') + '” 拼好了 · 点「▸ 下一个」继续'); HL.refreshTools();
      }
    } else { G.misses++; chime(false); HL.info('不是这里 · “' + p.seg.text + '” 的意思是：' + p.seg.sub); }
  }
  D.dragStart = function (h, x, y) { var p = h.p; if (D.game.on && p.placed) return; p.dragging = true; p.drag = HL.dragPlane(p.mesh.position.clone(), x, y); };
  D.dragMove = function (h, x, y) { if (!h.p.dragging) return; var q = h.p.drag.to(x, y); if (q) { h.p.mesh.position.copy(q); h.p.cur.copy(q); } };
  D.dragEnd = function (h) {
    var p = h.p, _d = V(); p.dragging = false;
    if (D.game.on) { if (!p.placed) gameDrop(p); return; }
    if (D.iso === h.j) return;
    D.expPos(p, HL.now, _d); _d.lerp(p.home, 1 - ease(D.ex)); p.off.copy(p.mesh.position).sub(_d);
  };
  D.setWord = function (uid) { L().dis.word = uid; HL.save(); D.build(false); D.exT = 0; HL.refreshTools(); };
  D.tools = function (box) {
    var ui = HL.ui, cs = D.candidates(), cur = D.it;
    [['morph', '词根 Roots'], ['chunk', '意群 Chunks'], ['sent', '句子 Sentence']].forEach(function (lv) {
      ui.chip(box, lv[1], L().dis.level === lv[0], function () { L().dis.level = lv[0]; HL.save(); D.build(false); D.exT = 1; HL.refreshTools(); },
        lv[0] === 'morph' ? '前缀 · 词根 · 后缀及含义' : lv[0] === 'chunk' ? '短语按意群切分' : '例句按意群分组，逐词拆开');
    });
    if (!cs.length) return;
    ui.sep(box);
    var sel = document.createElement('select'); sel.setAttribute('aria-label', '选择词条 Choose an entry');
    var groups = {}; cs.forEach(function (it) { var g = it.groupTitle || ''; (groups[g] = groups[g] || []).push(it); });
    Object.keys(groups).forEach(function (g) { var og = document.createElement('optgroup'); og.label = g; groups[g].forEach(function (it) { var o = document.createElement('option'); o.value = it.uid; o.textContent = it.title; if (cur && it.uid === cur.uid) o.selected = true; og.appendChild(o); }); sel.appendChild(og); });
    sel.onchange = function () { D.setWord(sel.value); };
    var i0 = cur ? cs.indexOf(cur) : 0;
    ui.chip(box, '◂', false, function () { D.setWord(cs[(i0 - 1 + cs.length) % cs.length].uid); });
    box.appendChild(sel);
    ui.chip(box, '▸', false, function () { D.setWord(cs[(i0 + 1) % cs.length].uid); });
    ui.sep(box);
    if (D.game.on) {
      ui.chip(box, '🧩 拼装中 · 退出', true, function () { D.stopGame(); });
      ui.chip(box, '↻ 重来', false, function () { D.startGame(); });
      ui.chip(box, '▸ 下一个', D.game.done, function () { D.setWord(cs[(i0 + 1) % cs.length].uid); D.startGame(); });
      return;
    }
    ui.chip(box, '🧩 拼装 Game', false, function () { if (D.pieces.length > 1) D.startGame(); else HL.toast('这一条只有一块，换一个再拼', 1800); }, '打乱碎片，拖进空槽拼回去');
    ui.chip(box, D.exT > 0.5 ? '🧩 合起 Assemble' : '✦ 拆开 Explode', false, function () {
      D.exT = D.exT > 0.5 ? 0 : 1; D.iso = -1; HL.info('');
      if (!D.exT) D.pieces.forEach(function (p) { p.off.set(0, 0, 0); });
      HL.refreshTools();
    });
    ui.chip(box, 'ⓘ 词条', false, function () { if (D.it) HL.detail.open(D.it, {}); });
  };
  HL.register(D);

  /* ════════════════════════ 3 · 知识星图 Knowledge Constellation ════════════════════════ */
  var S = { id: 'stars', zh: '知识星图', en: 'CONSTELLATION', bag: new Bag(), nodes: [], edges: [], focus: -1, alpha: 0, root: null };
  S.clear = function () { if (S.root) HL.contentRoot.remove(S.root); S.root = null; S.nodes = []; S.edges = []; S.bag.free(); S.focus = -1; };
  S.exit = function () { if (S.wb && S.wb.exit) S.wb.exit(); S.clear(); };
  S.enter = function () { S.build(); };
  S.onContent = function () { var f = S.focus >= 0 && S.nodes[S.focus] && S.nodes[S.focus].uid; S.build(true); if (f) S.nodes.forEach(function (n, i) { if (n.uid === f) S.setFocus(i, true); }); HL.refreshTools(); };
  S.onItemEdited = function (it) { S.nodes.forEach(function (n) { if (n.it === it) S.atlas.redraw(n.uv, HL.labelDraw(it.title, null, n.color)); }); };
  S.resize = function () { if (S._narrow !== undefined && S._narrow !== HL.narrow) S.build(true); S._narrow = HL.narrow; };
  S.build = function (keep) {
    var oldPos = {}; if (keep) S.nodes.forEach(function (n) { oldPos[n.uid] = n.p.clone(); });
    S.clear();
    var c = HL.content, items = [];
    items = items.concat(c.charts.slice(0, 24), c.knowledge.slice(0, 48));
    var lists = c.lists.slice(0, 12).map(function (l) { return l.items.slice(); }), room = 112 - items.length, more = true;
    while (room > 0 && more) { more = false; for (var li = 0; li < lists.length && room > 0; li++) { var x = lists[li].shift(); if (x) { items.push(x); room--; more = true; } } }
    if (!items.length) { HL.empty('还没有可连接的内容 · Nothing to connect yet', '单词表、Anchor Chart 和知识卡会在这里连成星图'); return; }
    HL.empty('');
    var hubs = {}, nodes = [], edges = [], R0 = u.rng(7);
    items.forEach(function (it) {
      if (!hubs[it.group]) { var h = { hub: true, uid: 'hub:' + it.group, it: { kind: 'group', id: it.group, title: it.groupTitle, text: '', uid: 'hub:' + it.group, groupTitle: '', tags: [], listKey: /^l:/.test(it.group) ? it.group.slice(2) : null }, members: [], color: '#ffd27a' }; hubs[it.group] = h; nodes.push(h); }
      if (it.kind === 'chart') hubs[it.group].color = it.ink;
    });
    var nh = nodes.length;
    items.forEach(function (it) { var n = { uid: it.uid, it: it, color: HL.kindColor(it), hub: false }; nodes.push(n); var h = hubs[it.group]; h.members.push(it); edges.push([nodes.length - 1, nodes.indexOf(h), 0]); });
    // Knowledge tree parent links — the strongest relation when present
    var byId = {}; nodes.forEach(function (n, i) { if (!n.hub) byId[n.it.id] = i; });
    nodes.forEach(function (n, i) { if (n.hub || !n.it.parents) return; n.it.parents.forEach(function (pid) { var j = byId[pid]; if (j != null && j !== i && edges.length < 440) edges.push([i, j, 2]); }); });
    // shared tags (same tag → a chain through those items) — capped so the picture stays legible
    var byTag = {}; nodes.forEach(function (n, i) { if (n.hub) return; (n.it.tags || []).forEach(function (t) { t = t.toLowerCase(); (byTag[t] = byTag[t] || []).push(i); }); });
    Object.keys(byTag).forEach(function (t) { var a = byTag[t]; if (a.length < 2 || a.length > 16) return; for (var i = 0; i < a.length - 1 && edges.length < 420; i++) edges.push([a[i], a[i + 1], 1]); if (a.length > 2 && edges.length < 420) edges.push([a[a.length - 1], a[0], 1]); });
    // the same words appearing in different lists/subjects (same title) → link
    var byTitle = {}; nodes.forEach(function (n, i) { if (n.hub) return; var k = (n.it.title || '').toLowerCase(); (byTitle[k] = byTitle[k] || []).push(i); });
    Object.keys(byTitle).forEach(function (k) { var a = byTitle[k]; for (var i = 0; i < a.length - 1 && edges.length < 440; i++) edges.push([a[i], a[i + 1], 1]); });
    nodes.forEach(function (n) { if (n.hub) n.it.text = n.members.slice(0, 40).map(function (m) { return '· ' + m.title; }).join('\n') + (n.members.length > 40 ? '\n…' : ''); });
    var RX = HL.narrow ? 1.5 : 2.4, RY = 1.05;
    nodes.forEach(function (n, i) {
      n.v = V(); n.adj = [];
      if (oldPos[n.uid]) { n.p = oldPos[n.uid]; return; }
      if (n.hub) { var a = i / Math.max(1, nh) * Math.PI * 2; n.p = V(Math.cos(a) * RX * 0.55, (R0() - 0.5) * 0.8, Math.sin(a) * RX * 0.4); }
      else n.p = V((R0() - 0.5) * RX, (R0() - 0.5) * RY, (R0() - 0.5) * RX * 0.6);
    });
    nodes.forEach(function (n) { if (!n.hub) { var h = hubs[n.it.group]; if (!oldPos[n.uid]) n.p.copy(h.p).add(V((R0() - 0.5) * 0.6, (R0() - 0.5) * 0.6, (R0() - 0.5) * 0.6)); } });
    edges.forEach(function (e) { nodes[e[0]].adj.push(e[1]); nodes[e[1]].adj.push(e[0]); });
    S.nodes = nodes; S.edges = edges; S.alpha = keep ? 0.25 : 1;
    if (S.wb && S.wb.onBuild) S.wb.onBuild(nodes, edges);
    S.root = new T.Group(); S.root.position.copy(HL.CENTER); HL.contentRoot.add(S.root);
    var N = nodes.length;
    S.glow = S.bag.add(HL.Billboards(N)); S.root.add(S.glow.mesh);
    S.atlas = S.bag.add(HL.Atlas(384, 72, 2048));
    S.lab = S.bag.add(HL.Billboards(N, S.atlas)); S.root.add(S.lab.mesh);
    var col = new T.Color();
    nodes.forEach(function (n, i) {
      n.col = new T.Color(n.color);
      n.uv = S.atlas.alloc(n.hub ? HL.labelDraw(n.it.title, n.members.length + ' 项', n.color, { plate: true, size: 34 }) : HL.labelDraw(n.it.title, null, n.color, { size: 36 }));
      S.lab.uv(i, n.uv);
    });
    // edges: one LineSegments, positions rewritten while the layout settles
    var E = edges.length, pos = new Float32Array(E * 6), aT = new Float32Array(E * 2), aSeed = new Float32Array(E * 2), aHi = new Float32Array(E * 2), aCol = new Float32Array(E * 6);
    edges.forEach(function (e, i) { aT[i * 2] = 0; aT[i * 2 + 1] = 1; var sd = u.rng(i + 3)(); aSeed[i * 2] = aSeed[i * 2 + 1] = sd;
      var ca = nodes[e[0]].col, cb = e[2] === 2 ? new T.Color('#ffffff') : e[2] ? new T.Color('#b58cff') : nodes[e[1]].col; aCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], i * 6); });
    var eg = S.bag.add(new T.BufferGeometry());
    eg.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); eg.setAttribute('aT', new T.BufferAttribute(aT, 1)); eg.setAttribute('aSeed', new T.BufferAttribute(aSeed, 1));
    eg.setAttribute('aHi', new T.BufferAttribute(aHi, 1).setUsage(T.DynamicDrawUsage)); eg.setAttribute('aCol', new T.BufferAttribute(aCol, 3));
    var em = S.bag.add(new T.ShaderMaterial({
      uniforms: { uTime: HL.U.uTime, uBright: HL.U.uBright, uFocus: { value: 0 }, uShow: { value: 0 } },
      vertexShader: 'attribute float aT, aSeed, aHi; attribute vec3 aCol; varying float vT, vSeed, vHi; varying vec3 vCol; void main(){ vT = aT; vSeed = aSeed; vHi = aHi; vCol = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uTime, uBright, uFocus, uShow; varying float vT, vSeed, vHi; varying vec3 vCol; void main(){ float p = fract(vSeed - uTime * 0.35); float pulse = smoothstep(0.14, 0.0, abs(vT - p)); float a = (0.16 + 0.6 * pulse) * (1.0 - 0.82 * uFocus * (1.0 - vHi)) + vHi * 0.55; gl_FragColor = vec4(mix(vCol, vec3(1.0), pulse * 0.5) * a * uBright * uShow, 1.0); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending
    }));
    S.lines = new T.LineSegments(eg, em); S.lines.frustumCulled = false; S.root.add(S.lines);
    S.eg = eg;
  };
  S.step = function () {
    var n = S.nodes, a = S.alpha, i, j, RX = HL.narrow ? 1.55 : 2.5;
    for (i = 0; i < n.length; i++) {
      var pi = n[i].p, vi = n[i].v;
      for (j = i + 1; j < n.length; j++) {
        var pj = n[j].p, dx = pi.x - pj.x, dy = pi.y - pj.y, dz = pi.z - pj.z, d2 = dx * dx + dy * dy + dz * dz + 0.01, f = (n[i].hub && n[j].hub ? 0.06 : 0.012) / d2 * a, inv = 1 / Math.sqrt(d2);
        dx *= inv * f; dy *= inv * f; dz *= inv * f; vi.x += dx; vi.y += dy; vi.z += dz; n[j].v.x -= dx; n[j].v.y -= dy; n[j].v.z -= dz;
      }
    }
    S.edges.forEach(function (e) {
      var A = n[e[0]], B = n[e[1]], L0 = e[2] === 2 ? 0.34 : e[2] ? 0.7 : 0.42, k = (e[2] === 2 ? 0.09 : e[2] ? 0.02 : 0.06) * a, dx = B.p.x - A.p.x, dy = B.p.y - A.p.y, dz = B.p.z - A.p.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-3, f = (d - L0) * k / d;
      A.v.x += dx * f; A.v.y += dy * f; A.v.z += dz * f; B.v.x -= dx * f; B.v.y -= dy * f; B.v.z -= dz * f;
    });
    for (i = 0; i < n.length; i++) {
      var N0 = n[i]; if (N0.pinned) { N0.v.set(0, 0, 0); continue; }
      N0.v.x -= N0.p.x * 0.012 * a; N0.v.y -= N0.p.y * 0.03 * a; N0.v.z -= N0.p.z * 0.02 * a;
      N0.v.multiplyScalar(0.82); N0.p.add(N0.v);
      var r = Math.hypot(N0.p.x, N0.p.z); if (r > RX) { N0.p.x *= RX / r; N0.p.z *= RX / r; }
      N0.p.y = clamp(N0.p.y, -1.15, 1.25);
    }
    S.alpha *= 0.992; if (S.alpha < 0.004) S.alpha = 0;
  };
  var _w = V();
  S.update = function (dt, t) {
    if (!S.nodes.length) return;
    if (S.alpha > 0) { S.step(); if (S.alpha > 0.1) S.step(); }
    if (!reduce() && S.focus < 0 && !S.dragging) S.root.rotation.y += dt * 0.05;
    var n = S.nodes, foc = S.focus, nb = foc >= 0 ? n[foc].adjSet : null, NW = HL.narrow ? 1.25 : 1;
    var WB = S.wb;   // the Holographic Workbench (workbench.js): levels, collapse, pulled cards, explode, time, path
    if (WB && WB.beforeUpdate) WB.beforeUpdate(dt, t);
    for (var i = 0; i < n.length; i++) {
      var N0 = n[i], a = HL.appear(Math.min(i, 60) * 0.3, 0.03), wv = WB ? WB.vis(i) : 1;
      _w.copy(WB ? WB.pos(i) : N0.p).multiplyScalar(a);
      var hi = (foc < 0 ? 1 : (i === foc ? 1.6 : nb[i] ? 1.1 : 0.25)) * (WB ? WB.hi(i) : 1);
      var gs = (N0.hub ? 0.36 : 0.18) * NW * (i === foc ? 1.5 : 1) * a * (0.92 + 0.08 * Math.sin(t * 2 + i));
      gs *= wv; S.glow.set(i, _w, gs, gs); S.glow.tintC(i, N0.col, hi);
      var many = n.length > 70, la = foc < 0 ? (N0.hub ? 1 : many ? 0.42 : 0.9) : (i === foc || nb[i] ? 1 : 0.12);
      var lw = (N0.hub ? 0.95 : many ? 0.6 : 0.8) * NW * (i === foc ? 1.6 : nb && nb[i] ? 1.2 : 1);
      la *= wv * (WB ? WB.hi(i) : 1); lw *= wv > 0.05 ? 1 : 0;
      _w.y -= (N0.hub ? 0.22 : 0.13) * NW; S.lab.set(i, _w, lw * a, lw * 72 / 384 * a); S.lab.tint(i, 1, 1, 1, la * a);
    }
    S.glow.commit(); S.lab.commit();
    var pos = S.eg.attributes.position.array, hiA = S.eg.attributes.aHi.array, ea = HL.appear(20, 0.03);
    S.edges.forEach(function (e, k) {
      var A = WB ? WB.pos(e[0]) : n[e[0]].p, B = WB ? WB.pos(e[1]) : n[e[1]].p; pos[k * 6] = A.x * ea; pos[k * 6 + 1] = A.y * ea; pos[k * 6 + 2] = A.z * ea; pos[k * 6 + 3] = B.x * ea; pos[k * 6 + 4] = B.y * ea; pos[k * 6 + 5] = B.z * ea;
      hiA[k * 2] = hiA[k * 2 + 1] = foc >= 0 && (e[0] === foc || e[1] === foc) ? 1 : 0;
    });
    S.eg.attributes.position.needsUpdate = true; S.eg.attributes.aHi.needsUpdate = true;
    S.lines.material.uniforms.uFocus.value = foc >= 0 ? 1 : 0; S.lines.material.uniforms.uShow.value = ea;
    if (foc >= 0 && !S.dragging) { S.root.localToWorld(_w.copy(WB ? WB.pos(foc) : n[foc].p)); HL.cam.g.tgt.lerp(_w, damp(dt, 3)); }
    if (WB && WB.afterUpdate) WB.afterUpdate(dt, t);
  };
  S.world = function (i) { return S.root.localToWorld((S.wb ? S.wb.pos(i) : S.nodes[i].p).clone()); };
  S.pick = function (x, y) {
    var best = null, bd = Infinity;
    S.nodes.forEach(function (N0, i) {
      if (S.wb && S.wb.vis(i) < 0.3) return;
      var s = HL.screenOf(S.world(i)); if (s.behind) return;
      var r = Math.max(20, (N0.hub ? 0.2 : 0.11) * s.ppu), d = Math.hypot(s.x - x, s.y - y);
      if (d < r && d < bd) { bd = d; best = { i: i, drag: true }; }
    });
    return best;
  };
  S.setFocus = function (i, quiet) {
    S.focus = i; var N0 = S.nodes[i]; N0.adjSet = {}; N0.adj.forEach(function (j) { N0.adjSet[j] = 1; });
    HL.focus(S.world(i), HL.cam.homeDist * 0.55);
    if (!quiet) {
      var it = N0.it, nbs = N0.adj.map(function (j) { return S.nodes[j].it.title; }).filter(function (t, k, a) { return a.indexOf(t) === k; });
      HL.detail.open(it, { sub: N0.hub ? N0.members.length + ' 项 · ' + (N0.adj.length) + ' 条连线' : '相连 linked: ' + nbs.slice(0, 6).join(' · ') + (nbs.length > 6 ? ' …' : '') });
    }
  };
  S.tap = function (h) {
    if (S.wb && S.wb.tap && S.wb.tap(h)) return;
    if (!h) { if (S.focus >= 0) { S.focus = -1; HL.home(); } HL.detail.close(); return; }
    S.setFocus(h.i);
  };
  S.onDetailClosed = function () { if (S.focus >= 0) { S.focus = -1; HL.home(); } };
  S.dragStart = function (h, x, y) { var N0 = S.nodes[h.i]; N0.pinned = true; S.dragging = true; N0.drag = HL.dragPlane(S.world(h.i), x, y); };
  S.dragMove = function (h, x, y) { var N0 = S.nodes[h.i], q = N0.drag.to(x, y); if (q) { S.root.worldToLocal(q); N0.p.copy(q); S.alpha = Math.max(S.alpha, 0.3); } };
  S.dragEnd = function (h) { S.nodes[h.i].pinned = false; S.dragging = false; };
  S.tools = function (box) {
    var ui = HL.ui;
    if (!S.nodes.length) return;
    ui.chip(box, '↻ 重新布局', false, function () { S.focus = -1; HL.detail.close(); HL.home(); S.build(false); HL.appearAt = HL.now; });
    ui.chip(box, '◎ 回中心', false, function () { S.focus = -1; HL.detail.close(); HL.home(); });
    ui.sep(box);
    [['#6fe3ff', '单词'], ['#9fc4ff', '卡片'], ['#e0a060', 'Anchor'], ['#b58cff', '知识'], ['#ffd27a', '分组']].forEach(function (l) { var s = document.createElement('span'); s.className = 'lab'; s.innerHTML = '<b style="color:' + l[0] + '">●</b> ' + l[1]; box.appendChild(s); });
    ui.sep(box); ui.lab(box, S.nodes.length + ' 节点 · ' + S.edges.length + ' 连线');
    if (S.wb && S.wb.tools) S.wb.tools(box);
  };
  HL.register(S);

  /* ════════════════════════ 4 · 单词光环 Holographic Word Rings ════════════════════════ */
  var R = { id: 'rings', zh: '单词光环', en: 'RINGS', bag: new Bag(), rings: [], words: [], sel: -1, fly: 0, root: null };
  var RCOL = ['#6fe3ff', '#b58cff', '#7dffb0', '#ffd27a', '#ff8fb1'];
  R.groups = function () {
    var c = HL.content, gs = [];
    c.lists.forEach(function (l) { if (l.items.length) gs.push({ key: 'l:' + l.key, title: l.title, items: l.items.slice() }); });
    if (c.charts.length) gs.push({ key: 'charts', title: 'Anchor Charts', items: c.charts.slice() });
    var kb = {}; c.knowledge.forEach(function (k) { if (!kb[k.group]) { kb[k.group] = { key: k.group, title: k.groupTitle, items: [] }; gs.push(kb[k.group]); } kb[k.group].items.push(k); });
    var max = HL.narrow ? 4 : 5, shown = gs.slice(0, max), byKey = {}; shown.forEach(function (g) { byKey[g.key] = g; });
    var A = L().rings.assign;
    // user ring assignment: move words between rings (only between rings that exist now)
    shown.forEach(function (g) { g.items = g.items.filter(function (it) { var to = A[it.uid]; if (to && to !== g.key && byKey[to]) { byKey[to].moved = byKey[to].moved || []; byKey[to].moved.push(it); return false; } return true; }); });
    shown.forEach(function (g) { if (g.moved) g.items = g.items.concat(g.moved); });
    R.hidden = gs.length - shown.length;
    return shown;
  };
  R.per = function () { return HL.narrow ? 10 : 14; };
  R.wordW = function (ring) { return Math.min(HL.narrow ? 0.95 : 1.0, 2 * Math.PI * ring.r / Math.max(ring.n, 1) * 1.15); };
  R.clear = function () { if (R.root) HL.contentRoot.remove(R.root); R.root = null; R.rings = []; R.words = []; R.bag.free(); R.sel = -1; R.fly = 0; R.card = null; };
  R.exit = function () { R.clear(); };
  R.enter = function () { R.build(); };
  R.onContent = function () { var s = R.sel >= 0 && R.words[R.sel] && R.words[R.sel].it.uid; R.build(true); if (s) R.words.forEach(function (w, i) { if (w.it.uid === s) R.select(i, true); }); HL.refreshTools(); };
  R.onItemEdited = function (it) { R.words.forEach(function (w) { if (w.it === it) R.atlas.redraw(w.uv, R.drawWord(it, w.ring.color)); }); if (R.sel >= 0 && R.words[R.sel].it === it) R.makeCard(it); };
  R.resize = function () { if (R._narrow !== undefined && R._narrow !== HL.narrow) R.build(true); R._narrow = HL.narrow; };
  R.drawWord = function (it, color) { return HL.labelDraw((it.learned ? '✓ ' : '') + it.title, null, it.kind === 'chart' ? it.ink : color); };
  R.build = function (keep) {
    var oldAng = {}; if (keep) R.rings.forEach(function (r) { oldAng[r.key] = r.ang; });
    R.clear();
    var gs = R.groups();
    if (!gs.length) { HL.empty('还没有单词表 · No word lists yet', '单词表、Anchor Chart 和知识卡会排成光环'); return; }
    HL.empty('');
    R.root = new T.Group(); HL.contentRoot.add(R.root);
    var N = HL.narrow, per = R.per(), page = L().rings.page, pages = 1;
    gs.forEach(function (g) { pages = Math.max(pages, Math.ceil(g.items.length / per)); });
    page = L().rings.page = clamp(page, 0, pages - 1); R.pages = pages;
    var nR = gs.length, spacing = nR > 1 ? Math.min(0.62, (N ? 2.3 : 2.0) / (nR - 1)) : 0;
    var nW = 0; gs.forEach(function (g) { nW += Math.min(per, Math.max(0, g.items.length - page * per) || Math.min(per, g.items.length)); });
    R.atlas = R.bag.add(HL.Atlas(384, 72, 2048));
    R.lab = R.bag.add(HL.Billboards(nW + gs.length, R.atlas)); R.root.add(R.lab.mesh);
    var torusG = [];
    gs.forEach(function (g, k) {
      var r = (N ? 1.0 : 1.6) + (k % 2) * (N ? 0.12 : 0.22) + (nR - 1 - Math.abs(k - (nR - 1) / 2) * 2) * 0.03, color = RCOL[k % RCOL.length];
      var holder = new T.Object3D(); holder.position.set(0, HL.CENTER.y + 0.1 + ((nR - 1) / 2 - k) * spacing, 0); holder.rotation.set(0.2 + 0.06 * (k % 3), 0, (k % 2 ? -1 : 1) * 0.07);
      var spin = new T.Object3D(); holder.add(spin); R.root.add(holder);
      var tg = R.bag.add(new T.TorusGeometry(r, 0.007, 6, 160)); tg.rotateX(Math.PI / 2);
      var tm = R.bag.add(new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
      var torus = new T.Mesh(tg, tm); spin.add(torus);
      var bg = R.bag.add(new T.RingGeometry(r - 0.06, r + 0.06, 128)); bg.rotateX(-Math.PI / 2);
      var bm = R.bag.add(new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      spin.add(new T.Mesh(bg, bm));
      var items = g.items.slice(page * per, page * per + per); if (!items.length) items = g.items.slice(0, per);
      var ring = { key: g.key, title: g.title, r: r, color: color, holder: holder, spin: spin, ang: oldAng[g.key] != null ? oldAng[g.key] : k * 0.7, vel: 0, w: (k % 2 ? -1 : 1) * (0.1 + k * 0.015), n: items.length, k: k, tm: tm, total: g.items.length };
      R.rings.push(ring);
      items.forEach(function (it, i) { var w = { it: it, ring: ring, i: i, phi: i / items.length * Math.PI * 2, idx: R.words.length, wp: V(), cur: V() }; w.uv = R.atlas.alloc(R.drawWord(it, color)); R.lab.uv(w.idx, w.uv); R.words.push(w); });
    });
    R.titleBase = R.words.length;
    R.rings.forEach(function (ring, k) { R.lab.uv(R.titleBase + k, R.atlas.alloc(HL.labelDraw(ring.title, ring.total + ' 项', ring.color, { plate: true }))); });
    R.lab.commit();
  };
  R.makeCard = function (it) {
    if (R.card) { R.root.remove(R.card.mesh); R.card.tex.dispose(); R.card.mat.dispose(); }
    var cv = HL.cardCanvas(it, 640, 400, { big: true, lines: 5 }), tex = HL.canvasTex(cv), mat = HL.panelMat(tex), m = new T.Mesh(PLANE, mat);
    m.scale.set(0.001, 0.001, 1); R.root.add(m); R.card = { mesh: m, tex: tex, mat: mat, t: 0 };
  };
  var _c = V(), _cd = V(), FLY = V(), _q = V();
  R.update = function (dt, t) {
    if (!R.rings.length) return;
    var rd = reduce(), auto = rd || R.sel >= 0 || R.held ? 0 : 1, N = HL.narrow;
    R.rings.forEach(function (ring) {
      ring.ang += (ring.w * auto + ring.vel) * dt; ring.vel *= Math.exp(-dt * 1.6); ring.spin.rotation.y = ring.ang;
      var a = HL.appear(ring.k * 3, 0.08); ring.spin.scale.setScalar(Math.max(0.001, a)); ring.tm.opacity = 0.85 * a;
      ring.holder.updateMatrixWorld(true);
    });
    R.fly = clamp(R.fly + (R.sel >= 0 ? dt : -dt) * (rd ? 8 : 2.6), 0, 1);
    if (R.fly === 0 && R.sel < 0) R.flyIdx = -1;
    var fe = ease(R.fly);
    FLY.set(0, HL.CENTER.y + (N ? 1.12 : 0.95), N ? 1.5 : 1.7);
    var cp = HL.camera.position;
    for (var i = 0; i < R.words.length; i++) {
      var w = R.words[i], ring = w.ring, r = ring.r;
      _c.set(r * Math.sin(w.phi), 0, r * Math.cos(w.phi)); ring.spin.localToWorld(_c);
      ring.holder.getWorldPosition(_q);
      _cd.copy(cp).sub(_q).normalize(); var facing = _c.clone().sub(_q).dot(_cd) / r;   // −1 back … +1 front
      var vis = 0.25 + 0.75 * ease((facing + 0.55) / 1.25), a = HL.appear(ring.k * 3 + w.i * 0.25, 0.08);
      var base = R.wordW(ring);
      var sw = base * (0.82 + 0.18 * vis), al = vis * a;
      if (R.flyIdx === i) { _c.lerp(FLY, fe); sw = lerp(sw, N ? 1.9 : 1.8, fe); al = lerp(al, 1, fe); }
      else if (R.sel >= 0) al *= 0.45;
      w.wp.copy(_c);
      R.lab.set(i, _c, sw * a, sw * 72 / 384 * a); R.lab.tint(i, 1, 1, 1, al);
    }
    R.rings.forEach(function (ring, k) {
      _c.set(-ring.r - (HL.narrow ? 0.05 : 0.35), 0.12, 0); ring.holder.localToWorld(_c);
      var a = HL.appear(ring.k * 3 + 1, 0.08), tw = (N ? 1.1 : 1.0) * a; R.lab.set(R.titleBase + k, _c, tw, tw * 72 / 384); R.lab.tint(R.titleBase + k, 1, 1, 1, (R.sel >= 0 ? 0.35 : 0.95) * a);
    });
    R.lab.commit();
    if (R.card) {
      var cm = R.card.mesh, ce = ease(R.fly), cw = N ? 1.7 : 1.5;
      cm.position.set(0, FLY.y - (N ? 0.62 : 0.6), FLY.z - 0.05); cm.scale.set(Math.max(0.001, cw * ce), Math.max(0.001, cw * 0.625 * ce * ce), 1);
      cm.quaternion.copy(HL.camera.quaternion); R.card.mat.uniforms.uOpacity.value = ce;
      if (R.fly === 0 && R.sel < 0) { R.root.remove(cm); R.card.tex.dispose(); R.card.mat.dispose(); R.card = null; }
    }
  };
  R.pick = function (x, y) {
    var best = null, bd = Infinity;
    for (var i = 0; i < R.words.length; i++) {
      var w = R.words[i], s = HL.screenOf(w.wp); if (s.behind) continue;
      var ring = w.ring, base = R.wordW(ring) * (R.flyIdx === i ? 1.8 : 1);
      var hw = base * s.ppu / 2 * 0.7, hh = Math.max(14, base * 72 / 384 * s.ppu / 2);
      if (Math.abs(s.x - x) < hw && Math.abs(s.y - y) < hh) { var sc = s.depth - (R.flyIdx === i ? 100 : 0); if (sc < bd) { bd = sc; best = { i: i, spin: true }; } }
    }
    return best;
  };
  R.select = function (i, quiet) {
    R.sel = i; R.flyIdx = i; var w = R.words[i];
    R.makeCard(w.it);
    if (quiet) return;
    var acts = R.rings.filter(function (r) { return r !== w.ring; }).map(function (r) { return ['→ 移到「' + u.str(r.title, 14) + '」', function () { L().rings.assign[w.it.uid] = r.key; HL.save(); HL.detail.close(); R.build(true); HL.toast('已移到 ' + r.title, 1400); }]; });
    var orig = null; HL.content.lists.forEach(function (l) { if (l.items.indexOf(w.it) >= 0) orig = 'l:' + l.key; });
    if (L().rings.assign[w.it.uid]) acts.push(['↺ 回原光环', function () { delete L().rings.assign[w.it.uid]; HL.save(); HL.detail.close(); R.build(true); }]);
    HL.detail.open(w.it, { sub: '光环 ring: ' + w.ring.title, actions: acts });
  };
  R.tap = function (h) {
    if (!h) { if (R.sel >= 0) { R.sel = -1; HL.detail.close(); } return; }
    if (R.sel === h.i) return;
    R.select(h.i);
  };
  R.onDetailClosed = function () { R.sel = -1; };
  R.spinStart = function (h) { R.held = true; R.spinRing = R.words[h.i].ring; };
  R.spinMove = function (h, dx) { var r = R.spinRing; if (!r) return; r.ang += dx * 0.008; r.vel = dx * 0.008 * 30; };
  R.spinEnd = function () { R.held = false; R.spinRing = null; };
  R.emptyDrag = function (dx, dy) {
    if (!R.rings.length) return false;
    R.held = true; R.rings.forEach(function (r) { r.ang += dx * 0.006; r.vel = dx * 0.006 * 30; });
    HL.cam.g.el = clamp(HL.cam.g.el + dy * 0.004, -0.08, 0.62);
    return true;
  };
  R.emptyDragEnd = function () { R.held = false; };
  R.tools = function (box) {
    var ui = HL.ui; if (!R.rings.length) return;
    ui.chip(box, '◎ 回正', false, function () { R.rings.forEach(function (r) { r.vel = 0; }); HL.home(); });
    if (R.pages > 1) {
      ui.sep(box);
      ui.chip(box, '◂', false, function () { var rr = L().rings; rr.page = (rr.page - 1 + R.pages) % R.pages; HL.save(); HL.detail.close(); R.build(true); HL.refreshTools(); });
      ui.lab(box, '第 ' + (L().rings.page + 1) + ' / ' + R.pages + ' 组');
      ui.chip(box, '▸', false, function () { var rr = L().rings; rr.page = (rr.page + 1) % R.pages; HL.save(); HL.detail.close(); R.build(true); HL.refreshTools(); });
    }
    ui.sep(box);
    R.rings.forEach(function (r) { var s = document.createElement('span'); s.className = 'lab'; s.innerHTML = '<b style="color:' + r.color + '">◯</b> '; s.appendChild(document.createTextNode(u.str(r.title, 16) + ' ' + r.total)); box.appendChild(s); });
    if (R.hidden > 0) ui.lab(box, '+' + R.hidden + ' 个列表未显示');
  };
  HL.register(R);
})();
