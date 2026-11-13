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
  var ARR = [['grid', '网格 Grid'], ['arc', '弧形 Arc'], ['stack', '叠放 Stack'], ['free', '自由 Free']];
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
    if (arr === 'arc') {
      var rows = n > 14 ? 3 : n > 6 ? 2 : 1, per = Math.ceil(n / rows), R = N ? 3.0 : 4.6, step = 1.1 / R, cz = 0.5 + R, s = Math.min(1, 2.6 / (rows * 0.74));
      for (i = 0; i < n; i++) { var r = Math.floor(i / per), k = i % per, cnt = r === rows - 1 ? n - r * per : per, th = (k - (cnt - 1) / 2) * step * s;
        out.push({ p: V(R * Math.sin(th), C.y + ((rows - 1) / 2 - r) * 0.74 * s, cz - R * Math.cos(th)), ry: -th, rx: 0, s: s }); }
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
  P.retarget = function () { var s = P.slots(P.panels.length); P.panels.forEach(function (pn, i) { pn.slot = s[i]; pn.i = i; }); };
  P.clear = function () { if (P.root) HL.contentRoot.remove(P.root); P.root = null; P.panels = []; P.bag.free(); };
  P.enter = function () { P.build(false); };
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
  P.update = function (dt, t) {
    var k = damp(dt, 6), rd = reduce(), lp = L().panels;
    for (var i = 0; i < P.panels.length; i++) {
      var pn = P.panels[i], g = pn.g, a = pn.born === -1 ? 1 : HL.appear(i, 0.06), sl = pn.slot; if (!sl) continue;
      if (!pn.dragging && a > 0) {
        var ty = sl.p.y + (rd ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.02), tz = sl.p.z + (P.sel === pn ? 0.12 : 0);
        g.position.x = lerp(g.position.x, sl.p.x, k); g.position.y = lerp(g.position.y, ty, k); g.position.z = lerp(g.position.z, tz, k);
      }
      var rot = sl.ry + (lp.rot[pn.it.uid] || 0);
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
    var pages = P.pages();
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

  /* ════════════════════════ 2 · 字母拆解 Typography Disassembly ════════════════════════ */
  var D = { id: 'dis', zh: '字母拆解', en: 'LETTERS', bag: new Bag(), pieces: [], ex: 0, exT: 0, iso: -1, root: null, phase: 0 };
  var VOW = 'aeiouAEIOU';
  var CH_COL = ['#6fe3ff', '#ffd27a', '#b58cff', '#7dffb0', '#ff8fb1', '#9fc4ff'];
  /* approximate English syllables (rule based; labelled as an estimate in the UI) */
  function syllables(word) {
    var w = word.toLowerCase(), n = w.length, i, k;
    if (!/^[a-z]+$/.test(w) || n <= 3) return [[0, n]];
    function isV(j) { return 'aeiou'.indexOf(w[j]) >= 0 || (w[j] === 'y' && j > 0 && 'aeiou'.indexOf(w[j - 1]) < 0); }
    var G = [];
    for (i = 0; i < n;) { if (isV(i)) { var j = i; while (j < n && isV(j)) j++; G.push([i, j]); i = j; } else i++; }
    if (G.length > 1) { var lg = G[G.length - 1]; if (lg[0] === n - 1 && w[n - 1] === 'e' && !(w[n - 2] === 'l' && !isV(n - 3))) G.pop(); }
    if (G.length > 1) { var lg2 = G[G.length - 1]; if (lg2[0] === n - 2 && /e[sd]$/.test(w) && !/[td]ed$|[sxz]es$|[cs]hes$/.test(w)) G.pop(); }
    if (G.length <= 1) return [[0, n]];
    var DIG = ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'ng', 'qu'], BL = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'th', 'ch', 'sh', 'ph', 'wh'];
    var cuts = [];
    for (k = 0; k < G.length - 1; k++) {
      var a = G[k][1], b = G[k + 1][0], C = w.slice(a, b), cut;
      if (k === G.length - 2 && G[k + 1][0] === n - 1 && w[n - 1] === 'e' && w[n - 2] === 'l' && C.length >= 2) cut = b - 2;      // consonant-le
      else if (C.length <= 1) cut = a;
      else if (C.length === 2 && DIG.indexOf(C) >= 0) cut = (C === 'ck' || C === 'ng') ? b : a;
      else { cut = a + 1; if (C.length >= 3 && BL.indexOf(C.slice(-2)) >= 0) cut = b - 2; }
      cuts.push(cut);
    }
    var out = [], s = 0; cuts.forEach(function (c) { if (c > s && c < n) { out.push([s, c]); s = c; } }); out.push([s, n]);
    return out;
  }
  D.syllables = syllables;
  D.candidates = function () {
    var c = HL.content, out = [], seen = {};
    function ok(it) { var t = (it.title || '').trim(); return t && t.length <= 18 && /[A-Za-zÀ-ɏ぀-ヿ一-鿿]/.test(t) && t.split(/\s+/).length <= 2; }
    c.words.concat(c.works, c.charts, c.knowledge).forEach(function (it) { if (ok(it) && !seen[it.uid]) { seen[it.uid] = 1; out.push(it); } });
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
  /* a polyline curve for stroke tubes */
  class PolyCurve extends T.Curve {
    constructor(pts) { super(); this.pts = pts; var L0 = [0]; for (var i = 1; i < pts.length; i++) L0.push(L0[i - 1] + pts[i].distanceTo(pts[i - 1])); this.L = L0; this.total = L0[L0.length - 1] || 1; }
    getPoint(t, target) {
      target = target || new T.Vector3(); var d = t * this.total, L0 = this.L, i = 1;
      while (i < L0.length - 1 && L0[i] < d) i++;
      var seg = (L0[i] - L0[i - 1]) || 1; return target.copy(this.pts[i - 1]).lerp(this.pts[i], clamp((d - L0[i - 1]) / seg, 0, 1));
    }
  }
  D.build = function (keep) {
    var prevEx = D.ex, prevT = D.exT; D.mats = {}; D.clear();
    D.it = D.item(); var it = D.it;
    if (!it) { HL.empty('还没有可拆解的单词 · No words to take apart yet', '单词表里的单词和 3D Type 作品会出现在这里'); return; }
    HL.empty('');
    D.root = new T.Group(); HL.contentRoot.add(D.root);
    var word = it.title.trim().slice(0, 18), chars = Array.from(word), level = L().dis.level;
    if (level === 'strokes' && !HL.strokes) level = 'letters';
    D.level = level; D.word = word;
    var syl = syllables(word), chunkOf = []; syl.forEach(function (s, j) { for (var i = s[0]; i < s[1]; i++) chunkOf[i] = j; });
    D.syl = syl;
    var sz = 0.5, font = HL.font, res = font ? font.data.resolution : 1000, adv = [], W = 0;
    chars.forEach(function (ch) { var a = ch === ' ' ? sz * 0.35 : (font && font.data.glyphs[ch] ? font.data.glyphs[ch].ha * sz / res : sz * 0.72); adv.push(a); W += a + sz * 0.04; });
    var maxW = HL.narrow ? 3.1 : 4.6, s = Math.min(1.25, maxW / Math.max(W, 0.01)); D.s = s;
    var pen = -W * s / 2, C = HL.CENTER, homes = [];
    chars.forEach(function (ch, i) { homes.push(V(pen + adv[i] * s / 2, C.y, 0.3)); pen += (adv[i] + sz * 0.04) * s; });
    // pieces
    var pieces = [], li = 0;
    chars.forEach(function (ch, i) {
      if (ch === ' ') return;
      var vowel = VOW.indexOf(ch) >= 0, chunk = chunkOf[i] || 0, idx = li++;
      var color = level === 'chunks' ? CH_COL[chunk % CH_COL.length] : vowel ? '#ffd27a' : '#6fe3ff';
      if (level === 'strokes') {
        var g = HL.strokes.strokeGlyph(ch);
        if (g) {
          var capH = sz * 0.72 * s, gw = g.w * capH, n = g.strokes.length;
          g.strokes.forEach(function (st, k) {
            var pts = st.map(function (p) { return V(homes[i].x - gw / 2 + p[0] * capH, homes[i].y - capH / 2 + p[1] * capH, homes[i].z); });
            var cen = V(); pts.forEach(function (p) { cen.add(p); }); cen.multiplyScalar(1 / pts.length);
            var local = pts.map(function (p) { return p.clone().sub(cen); });
            var geo = D.bag.add(new T.TubeGeometry(new PolyCurve(local.length > 1 ? local : [local[0], local[0].clone().add(V(0.001))]), Math.max(8, local.length * 3), 0.03 * s + 0.008, 6, false));
            var col = CH_COL[k % CH_COL.length], m = new T.Mesh(geo, dmat('s' + k, col));
            var out = cen.clone().sub(homes[i]); out.z = 0; if (out.lengthSq() < 1e-4) out.set(0, 1, 0); out.normalize();
            pieces.push({ mesh: m, home: cen, out: out, ch: ch, i: i, li: idx, stroke: k, nStrokes: n, color: col, size: capH, matKey: 's' + k });
          });
          return;
        }
      }
      var geo = text3D(ch, sz * s, 0.14 * s), m;
      if (geo) { D.bag.add(geo); m = new T.Mesh(geo, dmat(level === 'chunks' ? 'c' + (chunk % CH_COL.length) : vowel ? 'v' : 'c', color)); }
      else { m = glyphPlane(ch, color, D.bag); m.scale.setScalar(sz * 1.3 * s); m.userData.plane = true; }
      pieces.push({ mesh: m, home: homes[i], ch: ch, i: i, li: idx, vowel: vowel, chunk: chunk, color: color, size: sz * s, matKey: level === 'chunks' ? 'c' + (chunk % CH_COL.length) : vowel ? 'v' : 'c' });
    });
    D.nLetters = li;
    pieces.forEach(function (p, j) { p.j = j; p.cur = HL.EMIT.clone(); p.off = V(); p.mesh.position.copy(p.cur); p.baseScale = p.mesh.scale.x; p.mesh.scale.setScalar(0.001); D.root.add(p.mesh); });
    if (keep) pieces.forEach(function (p) { p.cur.copy(p.home); });
    D.pieces = pieces;
    // labels: per piece + per chunk + title
    var nl = pieces.length + syl.length + 1, atlas = D.atlas = HL.Atlas(256, 72, 1024);
    D.bag.add(atlas);
    var bb = D.labels = HL.Billboards(nl, atlas); D.bag.add(bb); D.root.add(bb.mesh);
    pieces.forEach(function (p, j) {
      var sub = level === 'strokes' ? '第 ' + (p.stroke + 1) + ' 笔' : (p.vowel ? '元音 vowel' : /[A-Za-z]/.test(p.ch) ? '辅音 consonant' : '字 char');
      bb.uv(j, atlas.alloc(HL.labelDraw(level === 'strokes' ? p.ch.toUpperCase() + ' · ' + (p.stroke + 1) : p.ch, sub, p.color)));
    });
    D.chunkLab = pieces.length;
    syl.forEach(function (sy, j) { bb.uv(pieces.length + j, atlas.alloc(HL.labelDraw(word.slice(sy[0], sy[1]), '音节 ' + (j + 1) + '/' + syl.length, CH_COL[j % CH_COL.length], { plate: true }))); });
    D.titleLab = nl - 1;
    var preview = syl.length > 1 ? syl.map(function (sy) { return word.slice(sy[0], sy[1]); }).join(' · ') : word;
    bb.uv(nl - 1, atlas.alloc(HL.labelDraw(preview, (it.text ? u.str(it.text, 34) : (HL.KIND[it.kind] || [''])[0]), '#6fe3ff', { size: 34 })));
    bb.commit();
    D.ex = keep ? prevEx : 0; D.exT = keep ? prevT : 0; D.iso = -1;
    // hit spheres for picking (screen space)
  };
  var _p = V();
  D.expPos = function (p, t, out) {
    var C = HL.CENTER, n = D.pieces.length;
    if (D.level === 'strokes') { var sp = 0.32 + 0.1 * (p.stroke % 2); out.copy(p.home).addScaledVector(p.out, sp); out.z += (p.stroke % 2 ? 0.35 : -0.15) + Math.sin(t * 0.8 + p.j) * 0.05; out.x *= 1.25; return out; }
    if (D.level === 'chunks') {
      var m = D.syl.length, j = p.chunk, sy = D.syl[j], gap = 0.55 * D.s, total = 0, starts = [];
      D.syl.forEach(function (q) { starts.push(total); total += (D.homeW(q)) * 1.18 + gap; }); total -= gap;
      var scale = Math.min(1, (HL.narrow ? 3.3 : 4.9) / Math.max(total, 0.01)); D.chunkScale = scale;
      var x0 = (-total / 2 + starts[j]) * scale, inChunk = (p.home.x - D.pieces.filter(function (q) { return q.chunk === j; })[0].home.x) * 1.18 * scale;
      var firstW = D.pieces.filter(function (q) { return q.chunk === j; })[0].size * 0.36;
      out.set(x0 + inChunk + firstW, C.y + Math.sin(t * 0.9 + j * 1.3) * 0.06 * (reduce() ? 0 : 1) + (j % 2 ? 0.12 : -0.12), 0.5 + Math.cos(j * 1.7) * 0.25);
      return out;
    }
    var R = clamp(0.24 * n, 1.0, HL.narrow ? 1.45 : 2.1), th = p.j / n * Math.PI * 2 + D.phase;
    return out.set(R * Math.sin(th), C.y + 0.28 * Math.sin(th * 2 + 0.6) , 0.15 + R * 0.6 * Math.cos(th));
  };
  D.homeW = function (sy) { var ps = D.pieces.filter(function (q) { return q.i >= sy[0] && q.i < sy[1]; }); if (!ps.length) return 0.3; return ps[ps.length - 1].home.x - ps[0].home.x + ps[0].size * 0.72; };
  var _d = V(), ISO = V();
  D.update = function (dt, t) {
    if (!D.pieces.length) return;
    var rd = reduce(), sp = rd ? 6 : 1.6;
    D.ex += clamp(D.exT - D.ex, -sp * dt, sp * dt);
    var e = ease(D.ex), k = damp(dt, 7);
    if (!rd && D.iso < 0) D.phase += dt * 0.22 * e;
    ISO.set(0, HL.CENTER.y + 0.2, HL.narrow ? 1.2 : 1.5);
    var bb = D.labels, cs = [];
    for (var j = 0; j < D.pieces.length; j++) {
      var p = D.pieces[j], m = p.mesh, a = HL.appear(j, 0.05);
      D.expPos(p, t, _d); _d.lerp(p.home, 1 - e).add(p.off);
      var sc = 1, op = 1;
      if (D.iso >= 0) { if (D.iso === j) { _d.copy(ISO); sc = 2.3; } else { _d.z -= 0.9; op = 0.22; } }
      if (a <= 0) continue;
      if (!p.dragging) { p.cur.lerp(_d, a < 1 ? damp(dt, 4) : k); m.position.copy(p.cur); }
      var target = p.baseScale * sc * a; var ns = lerp(m.scale.x, target, k); m.scale.setScalar(Math.max(ns, 0.001));
      if (m.userData.plane) m.quaternion.copy(HL.camera.quaternion);
      else { m.rotation.y = D.iso === j ? Math.sin(t * 0.7) * 0.5 : e * Math.sin(t * 0.8 + j) * (rd ? 0.15 : 0.55); m.rotation.x = e * Math.sin(t * 0.6 + j * 2) * (rd ? 0.05 : 0.2); }
      m.material = D.iso >= 0 && D.iso !== j ? dmat('dim', '#2a5a7a') : D.iso === j ? dmat('hi', '#ffffff') : dmat(p.matKey, p.color);
      // label under each piece (exploded only)
      var la = (D.iso < 0 ? e : (D.iso === j ? 1 : 0)) * a * op;
      _p.copy(m.position); _p.y -= p.size * (D.iso === j ? 1.6 : 0.78) + 0.05;
      var lw = (HL.narrow ? 0.62 : 0.55) * (D.iso === j ? 1.4 : 1);
      bb.set(j, _p, la > 0.02 ? lw : 0, la > 0.02 ? lw * 72 / 256 : 0); bb.tint(j, 1, 1, 1, la);
      cs[p.chunk] = cs[p.chunk] || V(); if (!cs[p.chunk].n) cs[p.chunk].n = 0; cs[p.chunk].add(m.position); cs[p.chunk].n++;
    }
    // chunk labels: chunks level only, above each syllable group
    for (var c = 0; c < D.syl.length; c++) {
      var show = D.level === 'chunks' && D.iso < 0 && cs[c] ? e : 0, idx = D.chunkLab + c;
      if (cs[c]) { _p.copy(cs[c]).multiplyScalar(1 / cs[c].n); _p.y += 0.5 * D.s + 0.12; }
      var w = HL.narrow ? 0.7 : 0.62; bb.set(idx, _p, show > 0.02 ? w : 0, show > 0.02 ? w * 72 / 256 : 0); bb.tint(idx, 1, 1, 1, show);
    }
    var ta = (1 - e) * HL.appear(D.pieces.length, 0.05) * (D.iso < 0 ? 1 : 0), tw = HL.narrow ? 1.5 : 1.7;
    _p.set(0, HL.CENTER.y + 0.55 * D.s + 0.45, 0.3); bb.set(D.titleLab, _p, ta > 0.02 ? tw : 0, ta > 0.02 ? tw * 72 / 256 : 0); bb.tint(D.titleLab, 1, 1, 1, ta);
    bb.commit();
  };
  D.pick = function (x, y) {
    var best = null, bd = Infinity;
    D.pieces.forEach(function (p, j) {
      var s = HL.screenOf(p.mesh.position); if (s.behind) return;
      var r = Math.max(26, p.size * p.mesh.scale.x / (p.baseScale || 1) * s.ppu * 0.6), d = Math.hypot(s.x - x, s.y - y);
      if (d < r && s.depth + d * 0.001 < bd) { bd = s.depth + d * 0.001; best = { p: p, j: j, drag: true }; }
    });
    return best;
  };
  D.tap = function (h) {
    if (!h) { if (D.iso >= 0) { D.iso = -1; HL.info(''); } else HL.detail.close(); return; }
    if (D.exT < 0.5) { D.exT = 1; HL.refreshTools(); return; }
    if (D.iso === h.j) { D.iso = -1; HL.info(''); return; }
    D.iso = h.j; var p = h.p;
    if (D.level === 'strokes') HL.info('“' + p.ch.toUpperCase() + '” 第 ' + (p.stroke + 1) + ' 笔 / 共 ' + p.nStrokes + ' 笔 · stroke ' + (p.stroke + 1) + ' of ' + p.nStrokes + ' (大写笔顺 capital form)');
    else {
      var sy = D.syl[p.chunk] || [0, D.word.length];
      HL.info('第 ' + (p.li + 1) + ' 个字母 · “' + p.ch + '” · ' + (p.vowel ? '元音 vowel' : /[A-Za-z]/.test(p.ch) ? '辅音 consonant' : '字符') + (D.syl.length > 1 ? ' · 音节 ' + (p.chunk + 1) + '/' + D.syl.length + ' “' + D.word.slice(sy[0], sy[1]) + '”' : ''));
    }
  };
  D.dragStart = function (h, x, y) { var p = h.p; p.dragging = true; p.drag = HL.dragPlane(p.mesh.position.clone(), x, y); };
  D.dragMove = function (h, x, y) { var q = h.p.drag.to(x, y); if (q) { h.p.mesh.position.copy(q); h.p.cur.copy(q); } };
  D.dragEnd = function (h) {
    var p = h.p; p.dragging = false;
    if (D.iso === h.j) return;
    D.expPos(p, HL.now, _d); _d.lerp(p.home, 1 - ease(D.ex)); p.off.copy(p.mesh.position).sub(_d);
  };
  D.setWord = function (uid) { L().dis.word = uid; HL.save(); D.build(false); D.exT = 0; HL.refreshTools(); };
  D.tools = function (box) {
    var ui = HL.ui, cs = D.candidates(), cur = D.it;
    if (!cs.length) return;
    var sel = document.createElement('select'); sel.setAttribute('aria-label', '选择单词 Choose a word');
    var groups = {}; cs.forEach(function (it) { var g = it.groupTitle || ''; (groups[g] = groups[g] || []).push(it); });
    Object.keys(groups).forEach(function (g) { var og = document.createElement('optgroup'); og.label = g; groups[g].forEach(function (it) { var o = document.createElement('option'); o.value = it.uid; o.textContent = it.title; if (cur && it.uid === cur.uid) o.selected = true; og.appendChild(o); }); sel.appendChild(og); });
    sel.onchange = function () { D.setWord(sel.value); };
    var i0 = cur ? cs.indexOf(cur) : 0;
    ui.chip(box, '◂', false, function () { D.setWord(cs[(i0 - 1 + cs.length) % cs.length].uid); });
    box.appendChild(sel);
    ui.chip(box, '▸', false, function () { D.setWord(cs[(i0 + 1) % cs.length].uid); });
    ui.sep(box);
    [['chunks', '音节 Syllables'], ['letters', '字母 Letters'], ['strokes', '笔画 Strokes']].forEach(function (lv) {
      var b = ui.chip(box, lv[1], D.level === lv[0], function () { L().dis.level = lv[0]; HL.save(); D.build(true); D.exT = 1; HL.refreshTools(); },
        lv[0] === 'chunks' ? '音节为自动估计 · syllables are estimated by rule' : lv[0] === 'strokes' ? '大写字母的笔画 · strokes of the capital letters' : '');
      if (lv[0] === 'strokes' && !HL.strokes) b.disabled = true;
    });
    ui.sep(box);
    ui.chip(box, D.exT > 0.5 ? '🧩 重组 Assemble' : '✦ 拆解 Explode', false, function () {
      D.exT = D.exT > 0.5 ? 0 : 1; D.iso = -1; HL.info('');
      if (!D.exT) D.pieces.forEach(function (p) { p.off.set(0, 0, 0); });
      HL.refreshTools();
    });
    ui.chip(box, 'ⓘ 词条', false, function () { if (D.it) HL.detail.open(D.it, { sub: D.syl && D.syl.length > 1 ? '音节（自动估计）: ' + D.syl.map(function (s) { return D.word.slice(s[0], s[1]); }).join(' · ') : '' }); });
  };
  HL.register(D);

  /* ════════════════════════ 3 · 知识星图 Knowledge Constellation ════════════════════════ */
  var S = { id: 'stars', zh: '知识星图', en: 'CONSTELLATION', bag: new Bag(), nodes: [], edges: [], focus: -1, alpha: 0, root: null };
  S.clear = function () { if (S.root) HL.contentRoot.remove(S.root); S.root = null; S.nodes = []; S.edges = []; S.bag.free(); S.focus = -1; };
  S.exit = function () { S.clear(); };
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
    for (var i = 0; i < n.length; i++) {
      var N0 = n[i], a = HL.appear(Math.min(i, 60) * 0.3, 0.03);
      _w.copy(N0.p).multiplyScalar(a);
      var hi = foc < 0 ? 1 : (i === foc ? 1.6 : nb[i] ? 1.1 : 0.25);
      var gs = (N0.hub ? 0.36 : 0.18) * NW * (i === foc ? 1.5 : 1) * a * (0.92 + 0.08 * Math.sin(t * 2 + i));
      S.glow.set(i, _w, gs, gs); S.glow.tintC(i, N0.col, hi);
      var many = n.length > 70, la = foc < 0 ? (N0.hub ? 1 : many ? 0.42 : 0.9) : (i === foc || nb[i] ? 1 : 0.12);
      var lw = (N0.hub ? 0.95 : many ? 0.6 : 0.8) * NW * (i === foc ? 1.6 : nb && nb[i] ? 1.2 : 1);
      _w.y -= (N0.hub ? 0.22 : 0.13) * NW; S.lab.set(i, _w, lw * a, lw * 72 / 384 * a); S.lab.tint(i, 1, 1, 1, la * a);
    }
    S.glow.commit(); S.lab.commit();
    var pos = S.eg.attributes.position.array, hiA = S.eg.attributes.aHi.array, ea = HL.appear(20, 0.03);
    S.edges.forEach(function (e, k) {
      var A = n[e[0]].p, B = n[e[1]].p; pos[k * 6] = A.x * ea; pos[k * 6 + 1] = A.y * ea; pos[k * 6 + 2] = A.z * ea; pos[k * 6 + 3] = B.x * ea; pos[k * 6 + 4] = B.y * ea; pos[k * 6 + 5] = B.z * ea;
      hiA[k * 2] = hiA[k * 2 + 1] = foc >= 0 && (e[0] === foc || e[1] === foc) ? 1 : 0;
    });
    S.eg.attributes.position.needsUpdate = true; S.eg.attributes.aHi.needsUpdate = true;
    S.lines.material.uniforms.uFocus.value = foc >= 0 ? 1 : 0; S.lines.material.uniforms.uShow.value = ea;
    if (foc >= 0 && !S.dragging) { S.root.localToWorld(_w.copy(n[foc].p)); HL.cam.g.tgt.lerp(_w, damp(dt, 3)); }
  };
  S.world = function (i) { return S.root.localToWorld(n0(i)); function n0(k) { return S.nodes[k].p.clone(); } };
  S.pick = function (x, y) {
    var best = null, bd = Infinity;
    S.nodes.forEach(function (N0, i) {
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
