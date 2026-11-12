/* Minest · 文字制作工坊 (Text Craft Workshop) 1.0 — My World: type words, pick a craft, get a 3D exhibit.
   Built from the hand-over pack "文字制作工坊 + 3D Item 陈列" (2026-11-11) on top of the voxel exhibition engine
   (ui/world-displays.js): a crafted text is one more fixture of that engine (kind "text"), so it is placed, moved,
   turned, copied, deleted, undone and saved exactly like the others (island record → vox.bld.displays).
   Pipeline: TextSpec → normalise / count grapheme clusters → layout (1–32 solid · 33–120 plaque · longer: title +
   reader) → glyph mask (the browser shapes and draws the text; no font file is shipped, so the system font is used)
   → kit geometry (eight different builders, not one extrusion with eight materials) → display → bounds.
   Kits: stone (incised stele) · letterpress (printed sheet in a frame) · glass (solid glass letters in a lit case) ·
   voxel (stacked cubes) · wood (carved sign on a rack) · thread (stitches on a hoop) · botanical (leaf letters in
   a planter) · ceramic (one glazed tile per character). Each has its tool and a 3–4 s making-of that can be skipped;
   the making-of never decides what is saved.
   The pure part (text rules, registry, seeded numbers, the slab mesher) also loads in node for tests. */
(function (root) {
  'use strict';
  var VERSION = '1.0', SOLID_MAX = 32, PLAQUE_MAX = 120, TITLE_MAX = 24, MAX_W = 8, MIN_LINE = 0.5, MAX_TEXT = 20000;

  /* ================================================================ pure: text rules */
  function normalizeText(raw) {
    var s = String(raw == null ? '' : raw).replace(/\r\n?/g, '\n');
    try { s = s.normalize('NFC'); } catch (e) {}
    s = s.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B\u2028\u2029\uFEFF]/g, '').replace(/\t/g, ' ');
    return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) : s;
  }
  var SEG = null; try { SEG = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) {}
  function graphemes(s) {
    if (SEG) { var out = []; var it = SEG.segment(s)[Symbol.iterator](), n; while (!(n = it.next()).done) out.push(n.value.segment); return out; }
    var a = Array.from(s), o = [];   // without Intl.Segmenter: keep combining marks, joiners and variation selectors with their base
    for (var i = 0; i < a.length; i++) { if (o.length && (/[\u0300-\u036f\u1ab0-\u1aff\u20d0-\u20ff\ufe00-\ufe0f\u200d]/.test(a[i]) || o[o.length - 1].slice(-1) === '\u200d')) o[o.length - 1] += a[i]; else o.push(a[i]); }
    return o;
  }
  function count(s) { return graphemes(s.replace(/\n/g, '')).length; }
  function linesOf(s) { return s.split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).filter(function (l) { return l.trim(); }); }
  function titleOf(text) {
    var first = linesOf(text)[0] || '', g = graphemes(first.trim());
    return g.length <= TITLE_MAX ? g.join('') : g.slice(0, TITLE_MAX - 1).join('') + '…';
  }
  // how a text becomes a thing: solid letters · a plaque with the text on its face · a title that opens the reader
  function classify(text) {
    var t = normalizeText(text), ls = linesOf(t), n = count(ls.join('\n'));
    if (!n) return { mode: 'empty', n: 0, lines: 0, why: '先输入文字（空白和换行不算）' };
    if (n <= SOLID_MAX && ls.length <= 2) return { mode: 'solid', n: n, lines: ls.length, why: n + ' 个字 · 实体文字' };
    if (n <= PLAQUE_MAX) return { mode: 'plaque', n: n, lines: ls.length, why: n + ' 个字 · ' + (n <= SOLID_MAX ? '超过两行' : '超过 ' + SOLID_MAX + ' 字') + '：整段写在牌匾面上' };
    return { mode: 'entry', n: n, lines: ls.length, why: n + ' 个字 · 长文：展品只做标题，点开读全文' };
  }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0; var t = Math.imul(s ^ (s >>> 13), 3266489909); return ((t ^ (t >>> 16)) >>> 0) / 4294967296; }; }
  function h2(i, j, seed) { var h = Math.imul(i * 374761393 + j * 668265263 + (seed | 0) * 2147483647, 1274126177); return ((h ^ (h >>> 13)) >>> 0); }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ================================================================ pure: the kit registry */
  var KITS = {
    stone: { v: 1, name: '石刻', en: 'Stone', icon: '🪨', geometryKind: 'incised-slab', display: '石碑 + 阶梯低台', tool: '石锤与凿子', seconds: 4, order: 'x',
      pals: [['warm', '暖灰', { body: '#a8a39a', groove: '#4d4740', base: '#8f8a82' }], ['sand', '砂岩', { body: '#cdb892', groove: '#6b5636', base: '#b09a74' }], ['slate', '青石', { body: '#7f8a94', groove: '#2f3740', base: '#687480' }]] },
    letterpress: { v: 1, name: '活字印刷', en: 'Letterpress', icon: '🖨', geometryKind: 'printed-paper', display: '木纸框 + 立架', tool: '压印机', seconds: 4, order: 'x',
      pals: [['ink', '米纸黑墨', { paper: '#f4ecd8', ink: '#221d18', frame: '#7a5334' }], ['navy', '牛皮纸藏青', { paper: '#d9c29a', ink: '#1f2f55', frame: '#5b3c28' }], ['red', '白纸朱红', { paper: '#fbf8f0', ink: '#a8261e', frame: '#3b3b40' }]] },
    glass: { v: 1, name: '玻璃', en: 'Glass', icon: '🧊', geometryKind: 'solid-glass', display: '照明底座 + 玻璃柜', tool: '喷灯', seconds: 4, order: 'x',
      pals: [['aqua', '海水青', { glass: '#7fe3f2', base: '#2b3440', glow: '#d9fbff' }], ['amber', '琥珀', { glass: '#ffc266', base: '#3a2d22', glow: '#fff0cc' }], ['rose', '玫瑰', { glass: '#ff9fc0', base: '#3a2a33', glow: '#ffe3ee' }]] },
    voxel: { v: 1, name: '方块', en: 'Voxel', icon: '🧱', geometryKind: 'voxel-volume', display: '模块方块台', tool: '体素打印头', seconds: 4, order: 'y',
      pals: [['primary', '原色', { letters: ['#58b947', '#f2c13d', '#f08a2b', '#de4a3a', '#3f7fe0'], base: ['#f1efe6', '#58b947', '#dedbcf'] }], ['pastel', '粉彩', { letters: ['#9bd3ae', '#f6dd8d', '#f6b48f', '#f2a0b5', '#a3c4f3'], base: ['#fbf7ee', '#d9e7f5', '#efe6d6'] }], ['mono', '白瓷', { letters: ['#f4f1ea', '#e6e2d8'], base: ['#5b6472', '#48505c', '#6a7482'] }]] },
    wood: { v: 1, name: '木刻', en: 'Wood', icon: '🪵', geometryKind: 'carved-sign', display: '木牌 + 木架', tool: '木槌与刻刀', seconds: 4, order: 'x',
      pals: [['oak', '橡木', { board: '#c08a4e', groove: '#5a3518', post: '#8a5a32' }], ['walnut', '胡桃', { board: '#7d5234', groove: '#2c1a0e', post: '#5a3a24' }], ['pine', '松木', { board: '#e0b97c', groove: '#7a5326', post: '#b98d55' }]] },
    thread: { v: 1, name: '刺绣', en: 'Thread', icon: '🧵', geometryKind: 'stitched-cloth', display: '绣绷 + 小立架', tool: '针与线', seconds: 4, order: 'x',
      pals: [['red', '米布红线', { cloth: '#f3ead6', thread: '#c5302c', hoop: '#c99a5e', leaf: '#3f8a4a' }], ['navy', '米布藏青', { cloth: '#f1ecdf', thread: '#27407f', hoop: '#a9763f', leaf: '#c5302c' }], ['green', '亚麻绿线', { cloth: '#ddd2b8', thread: '#2f7a46', hoop: '#8a5a32', leaf: '#d08a2a' }]] },
    botanical: { v: 1, name: '植物', en: 'Botanical', icon: '🌿', geometryKind: 'foliage-volume', display: '花槽 + 藤架', tool: '浇水壶', seconds: 4, order: 'y',
      pals: [['fresh', '新绿', { leaves: ['#4f9d3a', '#3f8a32', '#66b34a', '#2f7430'], flower: ['#ffffff', '#b89af0', '#f6dd6a'], planter: '#b9b2a4', trellis: '#9a6a3c' }], ['autumn', '秋色', { leaves: ['#c9842b', '#b0661f', '#d9a441', '#8f4f1c'], flower: ['#f6e7b0', '#d9482b'], planter: '#9c8f80', trellis: '#6b4423' }], ['lavender', '薰衣草', { leaves: ['#5f9a62', '#4b8452', '#78b077', '#3c6f46'], flower: ['#b89af0', '#d7c4ff', '#8f6fe0'], planter: '#c9c2cf', trellis: '#8a6a4a' }]] },
    ceramic: { v: 1, name: '陶瓷', en: 'Ceramic', icon: '🏺', geometryKind: 'glazed-tiles', display: '瓷砖壁龛', tool: '字模印章', seconds: 4, order: 'x',
      pals: [['blue', '青花', { tile: '#f2ede1', glaze: '#2b56b0', ledge: '#8a5a32', wall: '#e4dccb' }], ['terracotta', '赤陶', { tile: '#d98a5f', glaze: '#fff3e0', ledge: '#6b4423', wall: '#c9b9a0' }], ['celadon', '青瓷', { tile: '#cfe3d2', glaze: '#2f6b55', ledge: '#7a5334', wall: '#e9e6da' }]] }
  };
  var KIT_IDS = ['stone', 'letterpress', 'glass', 'voxel', 'wood', 'thread', 'botanical', 'ceramic'];
  var SCALES = [['s', '小', 0.75], ['m', '标准', 1], ['l', '大', 1.5]];
  function palOf(kit, id) { var ps = KITS[kit].pals; for (var i = 0; i < ps.length; i++) if (ps[i][0] === id) return ps[i][2]; return ps[0][2]; }
  function scaleOf(id) { for (var i = 0; i < SCALES.length; i++) if (SCALES[i][0] === id) return SCALES[i][2]; return 1; }
  // a recipe as it is stored on the item; anything unknown falls back, nothing is executed
  function cleanSpec(tx) {
    tx = tx || {};
    var kit = KITS[tx.kit] ? tx.kit : null, text = normalizeText(tx.text);
    var o = { v: 1, text: text, kit: kit || 'voxel', unknownKit: kit ? undefined : (tx.kit ? String(tx.kit).slice(0, 40) : undefined), kv: KITS[kit || 'voxel'].v, seed: (tx.seed >>> 0) || 1, pal: String(tx.pal || KITS[kit || 'voxel'].pals[0][0]), size: scaleOf(tx.size) === 1 && tx.size !== 'm' ? 'm' : String(tx.size || 'm'), font: 'system' };
    if (tx.title) o.title = graphemes(normalizeText(tx.title).replace(/\n/g, ' ')).slice(0, TITLE_MAX).join('');
    if (tx.src && tx.src.mode === 'card' && tx.src.ref) o.src = { mode: 'card', ref: String(tx.src.ref) };
    if (!o.unknownKit) delete o.unknownKit;
    return o;
  }
  function cacheKey(spec, fontId) { return ['tc', VERSION, spec.kit, KITS[spec.kit].v, spec.pal, spec.size, spec.seed, fontId || 'system', hashStr(spec.text) + ':' + spec.text.length, spec.title ? hashStr(spec.title) : ''].join('|'); }

  /* ================================================================ pure: the slab mesher
     A sheet of cells (i across, j down from the top) between two depths. Faces between two filled cells are never
     made; front and back faces of neighbours with the same colour are merged into strips. order 'x' writes column
     by column (left → right), 'y' row by row from the bottom up — the making-of reveals quads in that order. */
  function slab(B, W, H, has, col, g, o) {
    o = o || {};
    var c = g.c, front = o.front !== false, back = o.back !== false, byY = o.order === 'y', fmask = (front ? 16 : 0) | (back ? 32 : 0), n = 0;
    var X = function (i) { return g.x0 + i * c; }, Y = function (j) { return g.y0 + (H - j) * c; };
    function sides(i, j) { return (i + 1 < W && has(i + 1, j) ? 0 : 1) | (i > 0 && has(i - 1, j) ? 0 : 2) | (j > 0 && has(i, j - 1) ? 0 : 4) | (j + 1 < H && has(i, j + 1) ? 0 : 8); }
    function cell(i, j) { var m = sides(i, j); if (m) { B.box(X(i), Y(j + 1), g.z0, X(i + 1), Y(j), g.z1, col(i, j), m); n++; } }
    function faceOn(i, j) { return fmask && (!o.frontHas || o.frontHas(i, j)); }
    if (byY) {
      for (var j = H - 1; j >= 0; j--) {
        var s = -1, sc = null;
        for (var i = 0; i <= W; i++) {
          var on = i < W && has(i, j), cc = on ? col(i, j) : null, f = on && faceOn(i, j);
          if (on) cell(i, j);
          if (s >= 0 && (!f || cc !== sc)) { B.box(X(s), Y(j + 1), g.z0, X(i), Y(j), g.z1, sc, fmask); n++; s = -1; }
          if (f && s < 0) { s = i; sc = cc; }
        }
      }
    } else {
      for (var i2 = 0; i2 < W; i2++) {
        var s2 = -1, sc2 = null;
        for (var j2 = 0; j2 <= H; j2++) {
          var on2 = j2 < H && has(i2, j2), cc2 = on2 ? col(i2, j2) : null, f2 = on2 && faceOn(i2, j2);
          if (on2) cell(i2, j2);
          if (s2 >= 0 && (!f2 || cc2 !== sc2)) { B.box(X(i2), Y(j2), g.z0, X(i2 + 1), Y(s2), g.z1, sc2, fmask); n++; s2 = -1; }
          if (f2 && s2 < 0) { s2 = j2; sc2 = cc2; }
        }
      }
    }
    return n;
  }

  var PURE = { VERSION: VERSION, KITS: KITS, KIT_IDS: KIT_IDS, SCALES: SCALES, SOLID_MAX: SOLID_MAX, PLAQUE_MAX: PLAQUE_MAX, TITLE_MAX: TITLE_MAX, normalizeText: normalizeText, graphemes: graphemes, count: count, linesOf: linesOf, titleOf: titleOf, classify: classify, rng: rng, h2: h2, cleanSpec: cleanSpec, cacheKey: cacheKey, slab: slab, palOf: palOf, scaleOf: scaleOf };
  if (typeof module === 'object' && module.exports) { module.exports = PURE; return; }
  if (root.MinestTextCraft && root.MinestTextCraft.VERSION === VERSION) return;
  var VD = root.MinestVoxelDisplays; if (!VD || !VD._) { if (root.console) console.warn('文字制作工坊: the voxel exhibition engine is not loaded'); return; }
  var U = VD._, T = U.T, esc = U.esc, rgb = U.rgb;

  /* ================================================================ glyph masks: the browser shapes the text, we sample it */
  var FONT = 'system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  function wide(s) { return /[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(s); }
  function rasterLine(str, R, pad) {
    var fs = Math.round(R * 0.84), font = '800 ' + fs + 'px ' + FONT, m = U.canvas(4, 4).getContext('2d'); m.font = font;
    var gs = graphemes(str), W = Math.max(2, Math.ceil(m.measureText(str).width) + 2 + 2 * (pad || 0)), cv = U.canvas(W, R), g = cv.getContext('2d');
    g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.fillText(str, 1 + (pad || 0), Math.round(R * 0.8));
    var d = g.getImageData(0, 0, W, R).data, a = new Uint8Array(W * R), col = null, gi = new Int16Array(W), pre = '', x0 = 1 + (pad || 0), any = false;
    for (var k = 0; k < gs.length; k++) { var xa = Math.round(x0 + m.measureText(pre).width); pre += gs[k]; var xb = Math.round(x0 + m.measureText(pre).width); for (var x = Math.max(0, xa); x < Math.min(W, Math.max(xb, xa + 1)); x++) gi[x] = k; }
    for (var p = 0; p < W * R; p++) {
      if (d[p * 4 + 3] < 100) continue; a[p] = 1; any = true;
      if (d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2] > 96) { if (!col) col = new Uint32Array(W * R); col[p] = (1 << 24) | (d[p * 4] << 16) | (d[p * 4 + 1] << 8) | d[p * 4 + 2]; }   // a colour glyph (emoji) keeps its colours
    }
    var l = 0, r = W - 1;
    function colEmpty(x) { for (var y = 0; y < R; y++) if (a[y * W + x]) return false; return true; }
    while (l < r && colEmpty(l)) l++; while (r > l && colEmpty(r)) r--;
    var w = any ? r - l + 1 : 1, out = { W: w, H: R, a: new Uint8Array(w * R), g: new Int16Array(w * R), col: col ? new Uint32Array(w * R) : null, n: gs.length, blank: !any };
    for (var y2 = 0; y2 < R; y2++) for (var x2 = 0; x2 < w; x2++) { var s = y2 * W + x2 + l, t = y2 * w + x2; out.a[t] = a[s]; out.g[t] = gi[x2 + l]; if (col) out.col[t] = col[s]; }
    return out;
  }
  function stack(rows, gap) {   // lines centred one above the other
    var W = 0, H = 0, off = 0; rows.forEach(function (r) { W = Math.max(W, r.W); H += r.H; }); H += gap * (rows.length - 1);
    var out = { W: W, H: H, a: new Uint8Array(W * H), g: new Int16Array(W * H), col: null, n: 0 }, y = 0;
    rows.forEach(function (r) {
      var dx = (W - r.W) >> 1;
      for (var j = 0; j < r.H; j++) for (var i = 0; i < r.W; i++) { var t = (y + j) * W + i + dx, s = j * r.W + i; out.a[t] = r.a[s]; out.g[t] = r.g[s] + off; if (r.col && r.col[s]) { if (!out.col) out.col = new Uint32Array(W * H); out.col[t] = r.col[s]; } }
      y += r.H + gap; off += r.n;
    });
    out.n = off;
    return out;
  }
  function breakLine(s) {   // one long line → two, at the space nearest the middle (or the middle character)
    var gs = graphemes(s), mid = gs.length / 2, best = -1;
    gs.forEach(function (ch, i) { if (/\s/.test(ch) && i > 0 && i < gs.length - 1 && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; });
    if (best < 0) { if (gs.length < 4 || !wide(s)) return null;   // a word without spaces is never cut in two (it is made smaller instead); Chinese may break anywhere
      best = Math.ceil(mid); return [gs.slice(0, best).join(''), gs.slice(best).join('')]; }
    return [gs.slice(0, best).join('').trim(), gs.slice(best + 1).join('').trim()];
  }

  /* ================================================================ layout: what will be made, how big */
  function plan(spec) {
    var cl = classify(spec.text), S = scaleOf(spec.size), notes = [];
    if (cl.mode === 'empty') return { mode: 'empty', why: cl.why };
    var mode = cl.mode, text = spec.text, shown = text;
    if (mode === 'entry') { shown = spec.title || titleOf(text); notes.push('展品只做标题「' + shown + '」· 全文 ' + cl.n + ' 字点开阅读'); }
    if (mode === 'plaque') return { mode: 'plaque', n: cl.n, why: cl.why, notes: notes, S: S, shown: linesOf(text).join('\n') };
    var ls = linesOf(shown).slice(0, 2), R = wide(shown) ? 22 : 14, c = S / R, tile = spec.kit === 'ceramic';
    function build(lines) { return tile ? null : stack(lines.map(function (l) { return rasterLine(l, R); }), 2); }
    function widthOf(lines) { if (!tile) return build(lines).W; var w = 0; lines.forEach(function (l) { var x = 0; graphemes(l).forEach(function (ch) { x += /\s/.test(ch) ? Math.round((R + 5) / 2) : R + 5; }); w = Math.max(w, x); }); return w; }
    var W = widthOf(ls);
    if (ls.length === 1 && W * c > MAX_W) { var two = breakLine(ls[0]); if (two) { ls = two; W = widthOf(ls); notes.push('一行太宽：自动分成两行'); } }
    if (W * c > MAX_W) {
      var c2 = MAX_W / W;
      if (c2 * R < MIN_LINE) return { mode: 'plaque', n: cl.n, why: '做成实体字会小到看不清：整段写在牌匾面上', notes: notes, S: S, shown: linesOf(shown).join('\n'), fallback: true };
      c = c2; notes.push('太宽：整体缩小到 ' + MAX_W + ' 格以内');
    }
    var mask = build(ls);
    if (mask && mask.col) notes.push('含彩色字形（emoji）：按原色做成方块');
    if (mask && !mask.a.some(function (v) { return v; })) return { mode: 'empty', why: '这些字符在本机字体里画不出来 · 换几个字试试（原文仍保留）' };
    return { mode: mode, n: cl.n, why: cl.why, notes: notes, lines: ls, R: R, c: c, S: S, mask: mask, shown: shown };
  }

  /* ================================================================ building blocks */
  function shades(hex, list) { var c = rgb(hex); return (list || [1, 0.93, 1.06, 0.97]).map(function (f) { return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)]; }); }
  function Model() { var B = U.Buf; this.solid = new B(); this.glass = new B(); this.glow = new B(); this.text = new B(); this.cover = new B(); this.tool = new B(); this.textMat = 'solid'; this.planes = []; this.order = 'x'; this.top = 1; this.w = 1; this.depth = 0.5; this.path = { x0: -0.5, x1: 0.5, y0: 0.5, y1: 0.5, z: 0.3 }; }
  function bx(B, a, hex, f) { var c = typeof hex === 'string' ? rgb(hex) : hex; if (f) c = [c[0] * f, c[1] * f, c[2] * f]; B.box(a[0], a[1], a[2], a[3], a[4], a[5], c); }
  function colourOf(v) { return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; }
  function at(m, i, j) { return i >= 0 && j >= 0 && i < m.W && j < m.H && m.a[j * m.W + i] === 1; }
  function emojiCols(m) { var cache = {}; return function (i, j) { var v = m.col && m.col[j * m.W + i]; if (!v) return null; return cache[v] || (cache[v] = colourOf(v)); }; }
  // a small voxel tool for the making-of, around the origin (it is moved along the work)
  var TOOLS = {
    stone: [[-0.07, 0.1, -0.05, 0.07, 0.22, 0.05, '#7d8088'], [-0.02, -0.12, -0.02, 0.02, 0.1, 0.02, '#8a5a32'], [0.12, -0.14, -0.015, 0.15, 0.06, 0.015, '#c9ced6']],
    wood: [[-0.08, 0.08, -0.06, 0.08, 0.2, 0.06, '#b98d55'], [-0.02, -0.14, -0.02, 0.02, 0.08, 0.02, '#8a5a32'], [0.12, -0.14, -0.012, 0.145, 0.04, 0.012, '#d5dae2']],
    voxel: [[-0.09, 0.06, -0.09, 0.09, 0.2, 0.09, '#6a7482'], [-0.03, -0.04, -0.03, 0.03, 0.06, 0.03, '#39c5e8'], [-0.02, 0.2, -0.02, 0.02, 0.6, 0.02, '#8f98a6']],
    glass: [[-0.03, -0.02, -0.03, 0.03, 0.34, 0.03, '#3a3f48'], [-0.045, -0.12, -0.045, 0.045, -0.02, 0.045, '#ff9a3c'], [-0.025, -0.2, -0.025, 0.025, -0.12, 0.025, '#ffe08a']],
    thread: [[-0.008, -0.14, -0.008, 0.008, 0.2, 0.008, '#d5dae2'], [-0.02, 0.2, -0.012, 0.02, 0.24, 0.012, '#d5dae2'], [0.02, 0.1, -0.01, 0.06, 0.34, 0.01, '#c5302c']],
    botanical: [[-0.09, 0, -0.06, 0.05, 0.14, 0.06, '#9aa3ad'], [0.05, 0.06, -0.02, 0.16, 0.1, 0.02, '#9aa3ad'], [-0.05, 0.14, -0.015, 0.01, 0.2, 0.015, '#7d8690'], [0.14, -0.1, -0.012, 0.165, 0.05, 0.012, '#7fd0f2']],
    ceramic: [[-0.07, -0.04, -0.07, 0.07, 0.04, 0.07, '#f2ede1'], [-0.025, 0.04, -0.025, 0.025, 0.2, 0.025, '#8a5a32'], [-0.045, 0.2, -0.045, 0.045, 0.25, 0.045, '#8a5a32']],
    letterpress: [[-0.4, 0, -0.3, 0.4, 0.07, 0.02, '#3a3d44'], [-0.035, 0.07, -0.17, 0.035, 0.42, -0.1, '#5a5e68'], [-0.16, 0.42, -0.165, 0.16, 0.46, -0.105, '#3a3d44']]
  };
  function tool(M, kit) { TOOLS[kit].forEach(function (b) { bx(M.tool, b, b[6]); }); }

  /* ================================================================ the eight kits: each builds its own kind of thing */
  var BUILD = {
    // 04 cubes stacked into letters on a base of modules
    voxel: function (M, P, pal, seed) {
      var m = P.mask, c = P.c, tw = m.W * c, th = m.H * c, by = 0.25, em = emojiCols(m), cols = pal.letters.map(function (h) { return shades(h); });
      var bw = Math.ceil((tw + 0.4) / 0.25) * 0.25, nb = Math.round(bw / 0.25), bs = pal.base.map(function (h) { return rgb(h); });
      for (var i = 0; i < nb; i++) for (var k = 0; k < 3; k++) { var x = -bw / 2 + i * 0.25, z = -0.375 + k * 0.25; M.solid.box(x + 0.006, 0, z + 0.006, x + 0.244, by - (h2(i, k, seed) % 7 === 0 ? 0 : 0.012), z + 0.244, bs[h2(i, k, seed) % bs.length]); }
      var many = m.a.reduce(function (n, v) { return n + v; }, 0) > 2600;
      slab(M.text, m.W, m.H, function (i, j) { return at(m, i, j); }, function (i, j) { var e = em(i, j); if (e) return e; var s = cols[m.g[j * m.W + i] % cols.length]; return many ? s[0] : s[h2(i, j, seed) % s.length]; }, { x0: -tw / 2, y0: by, c: c, z0: -1.5 * c, z1: 1.5 * c }, { order: 'y' });
      M.order = 'y'; M.w = bw; M.top = by + th; M.depth = 0.75; M.path = { x0: -tw / 2, x1: tw / 2, y0: by, y1: by + th, z: 0 };
    },
    // 05 a plank with the letters cut into it, on a rack
    wood: function (M, P, pal, seed) { carved(M, P, seed, { margin: 3, back: -1.5, floor: 0.4, top: 1.6, lift: 0.5, body: pal.board, groove: pal.groove, band: 7, streak: 13, rough: false });
      var hw = M.w / 2, yb = 0.5, post = rgb(pal.post);
      [-1, 1].forEach(function (sd) { var x = sd * (hw + 0.07); M.solid.box(x - 0.07, 0, -0.07, x + 0.07, M.top - 0.12, 0.07, post); M.solid.box(x - 0.09, 0, -0.32, x + 0.09, 0.09, 0.32, post); });
      M.solid.box(-hw - 0.07, yb - 0.1, -0.05, hw + 0.07, yb, 0.05, [post[0] * 0.9, post[1] * 0.9, post[2] * 0.9]);
      M.w = M.w + 0.3; M.depth = 0.64;
    },
    // 01 a stele with the letters cut into it, on two steps
    stone: function (M, P, pal, seed) { carved(M, P, seed, { margin: 4, back: -2.6, floor: 0.4, top: 1.9, lift: 0.5, body: pal.body, groove: pal.groove, band: 0, streak: 0, rough: true });
      var hw = M.w / 2, b = shades(pal.base, [1, 0.92]);
      M.solid.box(-hw - 0.14, 0.25, -0.3, hw + 0.14, 0.5, 0.3, b[0]); M.solid.box(-hw - 0.36, 0, -0.44, hw + 0.36, 0.25, 0.44, b[1]);
      var r = rng(seed + 5); for (var k = 0; k < 5; k++) { var x = (r() * 2 - 1) * (hw + 0.2), z = 0.3 + r() * 0.1; M.solid.box(x, 0.25, z - 0.06, x + 0.07 + r() * 0.1, 0.25 + 0.035, z + 0.04, rgb('#5f8f45')); }   // a little moss on the step
      M.w = M.w + 0.72; M.depth = 0.88;
    },
    // 03 solid glass letters on a lit base, under a glass case
    glass: function (M, P, pal) {
      var m = P.mask, c = P.c, tw = m.W * c, th = m.H * c, by = 0.3, hw = tw / 2 + 0.22, col = rgb(pal.glass), one = [col];
      M.solid.box(-hw, 0, -0.36, hw, by - 0.03, 0.36, rgb(pal.base)); M.glow.box(-hw + 0.06, by - 0.03, -0.3, hw - 0.06, by, 0.3, rgb(pal.glow));
      slab(M.text, m.W, m.H, function (i, j) { return at(m, i, j); }, function () { return one[0]; }, { x0: -tw / 2, y0: by + 0.02, c: c, z0: -1.6 * c, z1: 1.6 * c }, { order: 'x' });
      M.textMat = 'glassText'; M.tint = pal.glass;
      M.glass.box(-hw + 0.02, by, -0.33, hw - 0.02, by + th + 0.16, 0.33, [1, 1, 1]);
      M.solid.box(-hw, by + th + 0.16, -0.36, hw, by + th + 0.2, 0.36, rgb(pal.base));
      [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { M.solid.box(sx * hw - 0.02, by, sz * 0.34 - 0.02, sx * hw + 0.02, by + th + 0.16, sz * 0.34 + 0.02, rgb(pal.base)); }); });
      M.w = hw * 2; M.top = by + th + 0.2; M.depth = 0.72; M.path = { x0: -tw / 2, x1: tw / 2, y0: by + th * 0.5, y1: by + th * 0.5, z: 0.5 };
    },
    // 06 stitches standing a little proud of the cloth, in a hoop (or, for wide words, on a banner)
    thread: function (M, P, pal, seed) {
      var m = P.mask, c = P.c, round = m.W / m.H <= 2.4, cloth = shades(pal.cloth, [1, 0.965]), th = shades(pal.thread, [1, 0.84]), hoop = rgb(pal.hoop), leaf = rgb(pal.leaf);
      var Rc = Math.ceil(Math.hypot(m.W / 2, m.H / 2)) + 3, GW = round ? 2 * Rc + 6 : m.W + 10, GH = round ? 2 * Rc + 6 : m.H + 8, ox = (GW - m.W) >> 1, oy = (GH - m.H) >> 1, cx = GW / 2, cy = GH / 2;
      var by = round ? 0.34 : 0.42, gw = GW * c, g0 = { x0: -gw / 2, y0: by, c: c };
      function dist(i, j) { return Math.hypot(i + 0.5 - cx, j + 0.5 - cy); }
      function inCloth(i, j) { return round ? dist(i, j) <= Rc : (i >= 1 && i < GW - 1 && j >= 2 && j < GH - 2); }
      function inRing(i, j) { return round ? (dist(i, j) > Rc && dist(i, j) <= Rc + 2.2) : (j < 2 || j >= GH - 2); }
      slab(M.solid, GW, GH, inCloth, function (i) { return cloth[i & 1]; }, { x0: g0.x0, y0: by, c: c, z0: -0.4 * c, z1: 0.4 * c }, { order: 'x' });
      slab(M.solid, GW, GH, inRing, function () { return hoop; }, { x0: g0.x0, y0: by, c: c, z0: -1.4 * c, z1: 1.4 * c }, { order: 'x' });
      slab(M.text, GW, GH, function (i, j) { return at(m, i - ox, j - oy); }, function (i, j) { return th[(i + j) & 1]; }, { x0: g0.x0, y0: by, c: c, z0: 0.4 * c, z1: 1.05 * c }, { order: 'x', back: false });
      var fy = oy + m.H + 1; if (fy < GH - 3) for (var i = ox + 1; i < ox + m.W - 1; i += 2) if (inCloth(i, fy)) M.solid.box(g0.x0 + i * c, by + (GH - fy - 1) * c, 0.4 * c, g0.x0 + (i + 1) * c, by + (GH - fy) * c, 0.85 * c, h2(i, 3, seed) % 3 ? leaf : th[0]);   // a seeded border under the words
      if (round) { M.solid.box(-0.05, by + GH * c - 0.02, -1.6 * c, 0.05, by + GH * c + 0.07, 1.6 * c, rgb('#c9ced6')); M.solid.box(-0.05, 0.08, -0.05, 0.05, by + 3 * c, 0.05, hoop); M.solid.box(-0.3, 0, -0.22, 0.3, 0.08, 0.22, hoop); }
      else [-1, 1].forEach(function (sd) { var x = sd * (gw / 2 + 0.06); M.solid.box(x - 0.05, 0, -0.05, x + 0.05, by + GH * c + 0.05, 0.05, hoop); M.solid.box(x - 0.07, 0, -0.26, x + 0.07, 0.07, 0.26, hoop); });
      M.w = gw + (round ? 0 : 0.24); M.top = by + GH * c + 0.08; M.depth = 0.5; M.path = { x0: -m.W * c / 2, x1: m.W * c / 2, y0: by + GH * c / 2, y1: by + GH * c / 2, z: 0.28 };
    },
    // 07 leaves growing into letters on a trellis, rooted in a planter
    botanical: function (M, P, pal, seed) {
      var m = P.mask, c = P.c, tw = m.W * c, th = m.H * c, by = 0.4, hw = tw / 2 + 0.18, lv = pal.leaves.map(function (h) { return rgb(h); }), fl = pal.flower.map(function (h) { return rgb(h); }), tr = rgb(pal.trellis), pl = shades(pal.planter, [1, 0.9]), em = emojiCols(m);
      M.solid.box(-hw, 0, -0.34, hw, by - 0.04, 0.34, pl[0]); M.solid.box(-hw - 0.04, by - 0.1, -0.38, hw + 0.04, by - 0.04, 0.38, pl[1]); M.solid.box(-hw + 0.05, by - 0.04, -0.29, hw - 0.05, by, 0.29, rgb('#5a4030'));
      var step = Math.max(4, Math.round(0.3 / c)), z0 = -2.6 * c, z1 = -2.0 * c;
      for (var i = 0; i <= m.W + 2; i += step) M.solid.box(-tw / 2 + (i - 1) * c, by, z0, -tw / 2 + (i - 0.4) * c, by + th + 2 * c, z1, tr);
      for (var j = 2; j <= m.H + 1; j += step) M.solid.box(-tw / 2 - c, by + j * c, z0 - 0.2 * c, tw / 2 + c, by + (j + 0.6) * c, z1 - 0.2 * c, tr);
      var g = { x0: -tw / 2, y0: by, c: c }, has = function (i, j) { return at(m, i, j); };
      function leaf(i, j) { return em(i, j) || lv[h2(i >> 1, j >> 1, seed) % lv.length]; }
      slab(M.text, m.W, m.H, has, leaf, { x0: g.x0, y0: by, c: c, z0: -2.0 * c, z1: 1.2 * c }, { order: 'y' });
      slab(M.text, m.W, m.H, function (i, j) { return has(i, j) && h2(i, j, seed + 1) % 3 === 0; }, function (i, j) { return lv[h2(i, j, seed + 2) % lv.length]; }, { x0: g.x0, y0: by, c: c, z0: 1.2 * c, z1: 2.1 * c }, { order: 'y', back: false });
      slab(M.text, m.W, m.H, function (i, j) { return has(i, j) && h2(i, j, seed + 3) % 29 === 0; }, function (i, j) { return fl[h2(i, j, seed + 4) % fl.length]; }, { x0: g.x0, y0: by, c: c, z0: 1.2 * c, z1: 2.6 * c }, { order: 'y', back: false });
      var r = rng(seed + 9); for (var k = 0; k < Math.max(3, Math.round(tw * 3)); k++) { var x = (r() * 2 - 1) * (hw - 0.08), d = 0.05 + r() * 0.14; M.solid.box(x, by - d, 0.34, x + 0.07, by + 0.02, 0.39, lv[k % lv.length]); }   // leaves spilling over the planter
      M.order = 'y'; M.w = hw * 2 + 0.08; M.top = by + th + 2 * c; M.depth = 0.78; M.path = { x0: -tw / 2, x1: tw / 2, y0: by, y1: by + th, z: 0.3 };
    },
    // 08 one glazed tile per character, standing on ledges in a niche
    ceramic: function (M, P, pal, seed) {
      var R = P.R, c = P.c, Tc = R + 4, pitch = Tc + 1, tile = shades(pal.tile, [1, 0.96]), gl = shades(pal.glaze, [1, 0.88]), ledge = rgb(pal.ledge), wall = rgb(pal.wall);
      var rows = P.lines.map(function (l) { var x = 0, cells = []; graphemes(l).forEach(function (ch) { if (/\s/.test(ch)) { x += Math.round(pitch / 2); return; } cells.push({ ch: ch, x: x }); x += pitch; }); return { cells: cells, w: Math.max(Tc, x - 1) }; });
      var Wc = Math.max.apply(null, rows.map(function (r) { return r.w; })), tw = Wc * c, rowH = Tc * c + 0.14, by = 0.5, total = rows.length * rowH;
      M.solid.box(-tw / 2 - 0.2, 0, -0.26, tw / 2 + 0.2, by + total + 0.12, -0.14, wall); M.solid.box(-tw / 2 - 0.26, by + total + 0.12, -0.3, tw / 2 + 0.26, by + total + 0.22, -0.06, [wall[0] * 0.9, wall[1] * 0.9, wall[2] * 0.9]);
      M.solid.box(-tw / 2 - 0.2, 0, -0.14, tw / 2 + 0.2, 0.12, 0.3, [wall[0] * 0.92, wall[1] * 0.92, wall[2] * 0.92]);
      rows.forEach(function (row, ri) {
        var y0 = by + (rows.length - 1 - ri) * rowH, xs = -row.w * c / 2;
        M.solid.box(-tw / 2 - 0.14, y0 - 0.08, -0.14, tw / 2 + 0.14, y0, 0.22, ledge);
        row.cells.forEach(function (t, ti) {
          var gm = rasterLine(t.ch, R), dx = (Tc - gm.W) >> 1, dy = (Tc - gm.H) >> 1, g = { x0: xs + t.x * c, y0: y0, c: c }, em = emojiCols(gm), sh = tile[h2(ri, ti, seed) % tile.length];
          function body(i, j) { return !((i === 0 || i === Tc - 1) && (j === 0 || j === Tc - 1)); }
          function letter(i, j) { return at(gm, i - dx, j - dy); }
          function rim(i, j) { return (i === 1 || i === Tc - 2 || j === 1 || j === Tc - 2) && i > 0 && j > 0 && i < Tc - 1 && j < Tc - 1 && !((i === 1 || i === Tc - 2) && (j === 1 || j === Tc - 2)); }
          slab(M.text, Tc, Tc, body, function () { return sh; }, { x0: g.x0, y0: y0, c: c, z0: -0.1, z1: -0.1 + 2 * c }, { order: 'x' });
          slab(M.text, Tc, Tc, rim, function () { return gl[1]; }, { x0: g.x0, y0: y0, c: c, z0: -0.1 + 2 * c, z1: -0.1 + 2.35 * c }, { order: 'x', back: false });
          slab(M.text, Tc, Tc, letter, function (i, j) { return em(i - dx, j - dy) || gl[0]; }, { x0: g.x0, y0: y0, c: c, z0: -0.1 + 2 * c, z1: -0.1 + 2.9 * c }, { order: 'x', back: false });
        });
      });
      M.w = tw + 0.52; M.top = by + total + 0.22; M.depth = 0.6; M.path = { x0: -tw / 2, x1: tw / 2, y0: by + total / 2, y1: by + total / 2, z: 0.25 };
    },
    // 02 ink pressed into a sheet of paper, in a wooden frame on a stand
    letterpress: function (M, P, pal) {
      var m = P.mask, c = P.c, tw = m.W * c, th = m.H * c, sw = tw + 0.5, sh = th + 0.36, by = 0.5, fr = shades(pal.frame, [1, 0.86]), f = 0.09;
      M.solid.box(-sw / 2, by, -0.05, sw / 2, by + sh, -0.02, rgb(pal.paper)); M.solid.box(-sw / 2 - f, by - f, -0.09, sw / 2 + f, by + sh + f, -0.05, fr[1]);
      [[-sw / 2 - f, by - f, -sw / 2, by + sh + f], [sw / 2, by - f, sw / 2 + f, by + sh + f], [-sw / 2, by - f, sw / 2, by], [-sw / 2, by + sh, sw / 2, by + sh + f]].forEach(function (q) { M.solid.box(q[0], q[1], -0.05, q[2], q[3], 0.03, fr[0]); });
      [-1, 1].forEach(function (sd) { var x = sd * Math.min(sw / 2 - 0.05, 0.6); M.solid.box(x - 0.04, 0, -0.09, x + 0.04, by - f, -0.01, fr[0]); M.solid.box(x - 0.05, 0, -0.3, x + 0.05, 0.07, 0.24, fr[1]); });
      M.planes.push({ w: sw, h: sh, x: 0, y: by + sh / 2, z: -0.018, key: 'lp|' + pal.paper + pal.ink + '|' + P.lines.join('\n') + '|' + P.c, draw: function (g, Wp, Hp) {
        g.fillStyle = pal.paper; g.fillRect(0, 0, Wp, Hp);
        var r = rng(hashStr(P.lines.join('|'))); g.fillStyle = 'rgba(120,100,70,.05)'; for (var k = 0; k < 260; k++) g.fillRect(r() * Wp, r() * Hp, 1 + r() * 2, 1);   // paper fibre
        var lh = (Hp - 0.36 / sh * Hp) / P.lines.length, fs = Math.round(lh * 0.8), top = 0.18 / sh * Hp;
        g.font = '800 ' + fs + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        P.lines.forEach(function (l, i) { var y = top + lh * i + lh * 0.8; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(l, Wp / 2 + 1.5, y + 1.5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillText(l, Wp / 2 - 1, y - 1); g.fillStyle = pal.ink; g.fillText(l, Wp / 2, y); });   // the pressed-in edge, then the ink
        g.strokeStyle = pal.ink; g.globalAlpha = 0.55; g.lineWidth = Math.max(2, Hp * 0.008); g.strokeRect(Hp * 0.05, Hp * 0.05, Wp - Hp * 0.1, Hp - Hp * 0.1); g.globalAlpha = 1;
      } });
      M.w = sw + 2 * f; M.top = by + sh + f; M.depth = 0.6; M.path = { x0: 0, x1: 0, y0: by + sh / 2, y1: by + sh / 2, z: 0.04 }; M.press = true;
    }
  };
  // stone and wood: a slab whose surface stands proud everywhere except where the letters are (real walls, real floor)
  function carved(M, P, seed, o) {
    var m = P.mask, c = P.c, mg = o.margin, W = m.W + 2 * mg, H = m.H + 2 * mg, w = W * c, by = o.lift, body = shades(o.body, o.rough ? [1, 0.94, 1.05, 0.9] : [1, 0.94]), dark = shades(o.body, [0.8])[0], gr = rgb(o.groove);
    var notch = {}; if (o.rough) { var r = rng(seed); for (var k = 0; k < Math.max(4, W / 5); k++) { var i = (r() * W) | 0, n = 1 + ((r() * 2) | 0); for (var q = 0; q < n; q++) notch[(i + q) + ',0'] = 1; if (r() > 0.5) notch[i + ',1'] = 1; } notch['0,0'] = notch[(W - 1) + ',0'] = notch['0,1'] = notch[(W - 1) + ',1'] = notch['1,0'] = notch[(W - 2) + ',0'] = 1; }
    function inB(i, j) { return i >= 0 && j >= 0 && i < W && j < H && !notch[i + ',' + j]; }
    function ltr(i, j) { return at(m, i - mg, j - mg); }
    function tone(i, j) { if (o.band) { var b = (j / o.band) | 0; return o.streak && h2(i >> 3, j, seed) % o.streak === 0 ? dark : body[b & 1]; } return body[h2(i >> 1, j >> 1, seed) % body.length]; }
    var g = { x0: -w / 2, y0: by, c: c };
    slab(M.solid, W, H, inB, function (i, j) { return ltr(i, j) ? gr : tone(i, j); }, { x0: g.x0, y0: by, c: c, z0: o.back * c, z1: o.floor * c }, { order: 'x', frontHas: ltr });
    slab(M.solid, W, H, function (i, j) { return inB(i, j) && !ltr(i, j); }, tone, { x0: g.x0, y0: by, c: c, z0: o.floor * c, z1: o.top * c }, { order: 'x', back: false });
    slab(M.cover, W, H, function (i, j) { return inB(i, j) && ltr(i, j); }, tone, { x0: g.x0, y0: by, c: c, z0: o.floor * c, z1: o.top * c }, { order: 'x', back: false });   // the uncut blank: only during the making-of
    if (!o.rough) [[1, 1], [W - 3, 1], [1, H - 3], [W - 3, H - 3]].forEach(function (q) { M.solid.box(g.x0 + q[0] * c, by + (H - q[1] - 2) * c, o.top * c, g.x0 + (q[0] + 2) * c, by + (H - q[1]) * c, (o.top + 0.7) * c, rgb('#8f9499')); });
    M.w = w; M.top = by + H * c; M.depth = 0.5; M.path = { x0: -m.W * c / 2, x1: m.W * c / 2, y0: by + H * c / 2, y1: by + H * c / 2, z: o.top * c + 0.16 };
  }
  // 33–120 characters: the whole text on the face of a board in the kit's colours
  function plaque(M, P, kit, pal) {
    var th = { stone: [pal.body, pal.groove, pal.base], wood: [pal.board, pal.groove, pal.post], letterpress: [pal.paper, pal.ink, pal.frame], glass: [pal.glow, pal.base, pal.base], voxel: [pal.base && pal.base[0], '#23303d', pal.letters && pal.letters[4 % pal.letters.length]], thread: [pal.cloth, pal.thread, pal.hoop], botanical: ['#f1ecd8', pal.leaves && pal.leaves[3], pal.trellis], ceramic: [pal.tile, pal.glaze, pal.ledge] }[kit];
    var n = P.n, bw = (n <= 60 ? 5 : 6.2) * Math.min(1.25, Math.max(0.8, P.S)), U2 = 72, Wp = Math.round(bw * U2), g = U.canvas(8, 8).getContext('2d'), fs = n <= 60 ? 30 : 25, lines;
    for (;;) { g.font = '700 ' + fs + 'px ' + FONT; lines = []; P.shown.split('\n').forEach(function (para) { U.wrap(g, para, Wp - 56, 40).forEach(function (l) { lines.push(l); }); }); if (lines.length * fs * 1.36 + 48 <= 4.2 * U2 || fs <= 15) break; fs -= 2; }
    var bh = Math.max(1.1, Math.min(4.4, (lines.length * fs * 1.36 + 48) / U2)), by = 0.5, f = 0.1, fr = shades(th[2], [1, 0.86]);
    M.solid.box(-bw / 2, by, -0.1, bw / 2, by + bh, 0, rgb(th[0])); M.solid.box(-bw / 2 - f, by - f, -0.14, bw / 2 + f, by + bh + f, -0.1, fr[1]);
    [[-bw / 2 - f, by - f, -bw / 2, by + bh + f], [bw / 2, by - f, bw / 2 + f, by + bh + f], [-bw / 2, by - f, bw / 2, by], [-bw / 2, by + bh, bw / 2, by + bh + f]].forEach(function (q) { M.solid.box(q[0], q[1], -0.1, q[2], q[3], 0.05, fr[0]); });
    [-1, 1].forEach(function (sd) { var x = sd * (bw / 2 - 0.3); M.solid.box(x - 0.06, 0, -0.14, x + 0.06, by - f, -0.02, fr[0]); M.solid.box(x - 0.08, 0, -0.34, x + 0.08, 0.08, 0.26, fr[1]); });
    M.planes.push({ w: bw, h: bh, x: 0, y: by + bh / 2, z: 0.004, key: 'pq|' + kit + th.join('') + '|' + fs + '|' + P.shown, draw: function (c2, W2, H2) {
      c2.fillStyle = th[0]; c2.fillRect(0, 0, W2, H2); c2.fillStyle = th[1]; c2.font = '700 ' + fs + 'px ' + FONT; c2.textAlign = 'left'; c2.textBaseline = 'alphabetic';
      var y = (H2 - lines.length * fs * 1.36) / 2 + fs; lines.forEach(function (l) { c2.fillText(l, 28, y); y += fs * 1.36; });
    }, px: U2 });
    M.w = bw + 2 * f; M.top = by + bh + f; M.depth = 0.6; M.path = { x0: 0, x1: 0, y0: by + bh / 2, y1: by + bh / 2, z: 0.1 }; M.press = true; M.surface = true;
  }

  /* ================================================================ from recipe to meshes (cached, counted, freed) */
  function specOf(d, ix) {   // the text of a linked card is read live
    var tx = cleanSpec(d.tx);
    if (tx.src && tx.src.mode === 'card') { var c = U.cardOf(ix || U.index(U.ctx() ? U.ctx().host.boardId() : ''), tx.src.ref); if (c) tx.text = normalizeText(c.title + (c.zh ? '\n' + c.zh : '')); else tx.lost = true; }
    return tx;
  }
  function model(spec) {
    var P = plan(spec); if (P.mode === 'empty') return { P: P };
    var M = new Model(), pal = palOf(spec.kit, spec.pal);
    if (P.mode === 'plaque') plaque(M, P, spec.kit, pal); else BUILD[spec.kit](M, P, pal, spec.seed);
    tool(M, spec.kit);
    return { P: P, M: M };
  }
  function itemRes(spec) {
    return U.res(cacheKey(spec), function () {
      var r = model(spec), M = r.M, out = { P: r.P, geos: {}, planes: [], free: function () { Object.keys(out.geos).forEach(function (k) { out.geos[k].dispose(); }); out.planes.forEach(function (p) { p.map.dispose(); p.mat.dispose(); }); if (out.tmat) out.tmat.dispose(); } };
      if (!M) return out;
      ['solid', 'glass', 'glow', 'text', 'cover', 'tool'].forEach(function (k) { var g = M[k].geo(); if (g) out.geos[k] = g; });
      M.planes.forEach(function (p) {
        var px = p.px || 96, cv = U.canvas(Math.min(1024, Math.round(p.w * px)), Math.min(1024, Math.round(p.h * px))); p.draw(cv.getContext('2d'), cv.width, cv.height);
        var map = U.tex(cv, false); out.planes.push({ w: p.w, h: p.h, x: p.x, y: p.y, z: p.z, map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x3c3c3c, emissiveMap: map }) });
      });
      if (M.textMat === 'glassText') out.tmat = new (T().MeshLambertMaterial)({ color: new (T().Color)(M.tint).multiplyScalar(0.62), transparent: true, opacity: 0.9, emissive: new (T().Color)(M.tint).multiplyScalar(0.22) });   // thick tinted glass: readable through the case
      out.info = { w: M.w, top: M.top, depth: M.depth, order: M.order, path: M.path, press: !!M.press, surface: !!M.surface, tris: ['solid', 'glass', 'glow', 'text'].reduce(function (a, k) { return a + (out.geos[k] ? out.geos[k].index.count / 3 : 0); }, 0) };
      return out;
    });
  }
  function sizeOf(r) { return { w: Math.max(1, Math.ceil(r.info.w - 0.02)), d: 1, h: Math.max(1, Math.ceil(r.info.top - 0.02)) }; }
  // the meshes of one item, added to grp; returns the handle the making-of drives
  function assemble(r, grp, shadows) {
    var M = U.mats(), h = { r: r, parts: {}, planes: [] };
    function mesh(k, mat) { if (!r.geos[k]) return null; var m = new (T().Mesh)(r.geos[k], mat); m.userData.part = k === 'glass' ? 'glass' : k; grp.add(m); h.parts[k] = m; return m; }
    var s = mesh('solid', M.solid); if (s) { s.castShadow = !!shadows; s.receiveShadow = !!shadows; }
    mesh('glow', M.glow);
    var t = mesh('text', r.tmat || M.solid); if (t) { t.castShadow = !!shadows && !r.tmat; t.geometry.setDrawRange(0, Infinity); }
    var c = mesh('cover', M.solid); if (c) c.visible = false;
    var g = mesh('glass', M.glass); if (g) g.renderOrder = 2;
    r.planes.forEach(function (p) { var m = new (T().Mesh)(M.plane, p.mat); m.scale.set(p.w, p.h, 1); m.position.set(p.x, p.y, p.z); grp.add(m); h.planes.push(m); });
    var tl = mesh('tool', M.solid); if (tl) tl.visible = false;
    return h;
  }
  /* the making-of: p 0 → 1. Blank rises (0–18 %) · the tool works along the text while it appears, or while the blank
     is cut away (18–85 %) · the tool leaves and the piece settles (85–100 %). p = 1 is exactly the finished thing. */
  function pose(h, p, time) {
    var info = h.r.info, P = h.parts, a = Math.min(1, p / 0.18), b = Math.max(0, Math.min(1, (p - 0.18) / 0.67)), done = p >= 1, ease = function (x) { return 1 - Math.pow(1 - x, 3); };
    ['solid', 'glow', 'glass', 'cover'].forEach(function (k) { if (P[k]) P[k].scale.y = done ? 1 : Math.max(0.001, ease(a)); });
    if (P.glass) P.glass.visible = done || p > 0.86;
    if (P.text) { var n = P.text.geometry.index.count; P.text.geometry.setDrawRange(0, done ? n : Math.floor(n * b / 6) * 6); P.text.visible = done || a >= 1; }
    if (P.cover) { var nc = P.cover.geometry.index.count, k0 = Math.floor(nc * b / 6) * 6; P.cover.visible = !done && k0 < nc; /* the blank is whole while it rises, then is cut away */ P.cover.geometry.setDrawRange(k0, nc - k0); }
    h.planes.forEach(function (m) { m.visible = done || p > 0.62; });
    if (P.tool) {
      var on = !done && p > 0.1 && p < 0.94, path = info.path, t = time || 0, up = p > 0.85 ? (p - 0.85) / 0.09 : 0;
      P.tool.visible = on;
      if (on) {
        if (info.press) { var d = p < 0.5 ? 1 - (p - 0.1) / 0.4 : p < 0.62 ? 0 : (p - 0.62) / 0.3; P.tool.position.set(0, info.top + 0.02 + Math.max(0, d) * 0.5, path.z + 0.16); P.tool.rotation.set(0, 0, 0); }
        else if (info.order === 'y') P.tool.position.set(path.x0 + (path.x1 - path.x0) * (0.5 + 0.5 * Math.sin(t * 5)), path.y0 + (path.y1 - path.y0) * b + 0.12 + up * 0.5, path.z);
        else P.tool.position.set(path.x0 + (path.x1 - path.x0) * b, path.y0 + Math.abs(Math.sin(t * 9)) * 0.07 + up * 0.5, path.z + Math.abs(Math.sin(t * 9)) * 0.05);
      }
    }
  }
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function play(h, seconds, onDone, redraw) {   // returns stop(); stopping or finishing always leaves the finished piece
    var t0 = performance.now(), dead = false, raf = 0;
    function end() { if (dead) return; dead = true; cancelAnimationFrame(raf); pose(h, 1, 0); if (redraw) redraw(); if (onDone) onDone(); }
    if (reduced() || document.hidden) { end(); return function () {}; }
    (function step(now) { if (dead) return; var p = (now - t0) / (seconds * 1000); if (p >= 1) return end(); pose(h, p, (now - t0) / 1000); if (redraw) redraw(); raf = requestAnimationFrame(step); })(t0);
    return end;
  }

  /* ================================================================ in the world: a text is a fixture of the exhibition engine */
  VD.ext.text = {
    build: function (d, grp, api) {
      var spec = specOf(d, api.ix), r = api.use(itemRes(spec)); if (!r.info) return;
      var h = assemble(r, grp, api.shadows); pose(h, 1, 0);
      grp.userData.tc = h;
    },
    sig: function (d, ix) { var s = specOf(d, ix); return s.text + (s.lost ? '!lost' : ''); },
    open: function (d) { reader(d); },
    entry: function () { return '<div class="tw-entry"><button type="button" class="obld-btn pri" data-vd="text:new">✍️ 制作文字展品</button><small>输入文字 → 选工艺 → 放进世界 · 八种工艺</small></div>'; },
    panel: function (d) {
      var s = specOf(d), k = KITS[s.kit], cl = classify(s.text);
      return '<div class="obld-sub">' + k.icon + ' ' + k.name + ' · ' + cl.n + ' 字' + (s.src ? ' · 🔗 关联卡片' + (s.lost ? '（卡片已不在看板上，显示的是上次的文字）' : '') : '') + (s.unknownKit ? ' · 未知工艺「' + esc(s.unknownKit) + '」按方块显示' : '') + '</div>' +
        '<div class="obld-actions"><button type="button" class="obld-btn pri" data-vd="text:edit">✏️ 改文字 / 工艺 / 配色</button><button type="button" class="obld-btn" data-vd="text:open">📖 打开内容</button><button type="button" class="obld-btn" data-vd="text:replay">▶ 重播制作</button></div>';
    },
    act: function (ctx, name, arg, d) {
      if (name === 'new') return open(ctx, null);
      if (!d || d.kind !== 'text') return;
      if (name === 'edit') return open(ctx, d);
      if (name === 'open') return reader(d);
      if (name === 'replay') { var g = U.live(d.id), h = g && g.userData.tc; if (!h) return; if (g.userData.stop) g.userData.stop(); g.userData.stop = play(h, KITS[specOf(d).kit].seconds, function () { g.userData.stop = null; }); }
    }
  };
  // reading: the whole original text, as real selectable text
  function reader(d) {
    var s = specOf(d), k = KITS[s.kit], cl = classify(s.text);
    U.modal(titleOf(s.text) || '文字展品', function (box) {
      box.appendChild(U.el('span', 'vd-tag', k.icon + ' ' + k.name + ' · ' + cl.n + ' 字'));
      if (cl.mode === 'entry' || s.title) box.appendChild(U.el('h2', '', s.title || titleOf(s.text)));
      var p = U.el('div', 'tw-read', s.text || '（没有文字）'); p.setAttribute('tabindex', '0'); box.appendChild(p);
      if (s.src) box.appendChild(U.el('p', 'vd-meta', s.lost ? '关联的卡片已不在看板上' : '🔗 文字来自看板卡片，卡片改名后这里会跟着变'));
    });
  }

  /* ================================================================ the workshop */
  var W = null;   // the open workshop: { ctx, edit (the item being changed, or null), spec, state, … }
  var KEY = 'minest.textcraft.draft';
  function draftLoad() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function draftSave(spec) { try { localStorage.setItem(KEY, JSON.stringify({ text: spec.text, kit: spec.kit, pal: spec.pal, size: spec.size })); } catch (e) {} }
  function open(ctx, d) {
    if (W) close();
    var ix = U.index(ctx.host.boardId()), dr = d ? null : draftLoad(), spec = d ? specOf(d, ix) : cleanSpec({ text: (dr && dr.text) || '', kit: (dr && dr.kit) || 'voxel', pal: dr && dr.pal, size: (dr && dr.size) || 'm', seed: (Math.random() * 4e9) >>> 0 });
    if (d && d.tx && d.tx.src) spec.src = U.clone(d.tx.src);
    var el = document.createElement('div'); el.id = 'tw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '文字制作工坊');
    el.innerHTML =
      '<header><b>✍️ 文字制作工坊</b><span class="tw-mode">' + (d ? '修改这件展品' : '新作品') + '</span><button type="button" class="tw-x" data-tw="cancel" aria-label="取消，返回 My World">✕</button></header>' +
      '<div class="tw-body">' +
      '<section class="tw-left"><label class="tw-l" for="tw-text">1 输入文字</label><textarea id="tw-text" rows="3" maxlength="' + MAX_TEXT + '" placeholder="发现世界 Discover" spellcheck="false"></textarea><p class="tw-count" aria-live="polite"></p>' +
      '<div class="tw-src"><button type="button" data-tw="src" data-arg="own">独立文本</button><button type="button" data-tw="src" data-arg="card">🔗 关联看板卡片</button></div><div class="tw-link" hidden></div>' +
      '<div class="tw-title" hidden><label class="tw-l" for="tw-title">展品标题（最多 ' + TITLE_MAX + ' 字，全文点开阅读）</label><input id="tw-title" type="text" maxlength="80"></div>' +
      '<div class="tw-l">2 选择工艺</div><div class="tw-kits" role="radiogroup" aria-label="工艺">' + KIT_IDS.map(function (k) { return '<button type="button" role="radio" data-tw="kit" data-arg="' + k + '"><i>' + KITS[k].icon + '</i><b>' + KITS[k].name + '</b><small>' + KITS[k].en + '</small></button>'; }).join('') + '</div></section>' +
      '<section class="tw-mid"><div class="tw-stage"><canvas aria-label="成品预览，可拖动旋转"></canvas><p class="tw-hint">成品预览 · 拖动旋转</p><p class="tw-msg" role="status" aria-live="polite"></p></div></section>' +
      '<section class="tw-right"><div class="tw-l">3 自动匹配装置</div><p class="tw-disp"></p><div class="tw-l">配色</div><div class="tw-pals"></div><div class="tw-l">尺寸</div><div class="tw-sizes">' + SCALES.map(function (s) { return '<button type="button" data-tw="size" data-arg="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div><p class="tw-notes"></p></section>' +
      '</div>' +
      '<footer><button type="button" class="tw-go" data-tw="craft">🔨 制作展品</button><button type="button" data-tw="skip">⏩ 立即完成</button><button type="button" class="tw-place" data-tw="place" hidden>📦 领取并放进世界</button><button type="button" data-tw="again" hidden>↺ 继续修改</button><button type="button" data-tw="cancel">取消</button></footer>';
    (document.getElementById('oia-root') || document.body).appendChild(el);
    W = { ctx: ctx, edit: d || null, el: el, spec: spec, state: 'draft', req: 0, timer: 0, composing: false, yaw: 0.5, pitch: 0.12, handle: null, res: null, stop: null, dirty: true, done: false };
    var ta = el.querySelector('#tw-text'); ta.value = spec.src ? '' : spec.text;
    el.querySelector('#tw-title').value = spec.title || '';
    ta.addEventListener('compositionstart', function () { W.composing = true; });
    ta.addEventListener('compositionend', function () { W.composing = false; typed(); });
    ta.addEventListener('input', function () { if (!W.composing) typed(); });
    el.querySelector('#tw-title').addEventListener('input', function (e) { W.spec.title = e.target.value; schedule(); });
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-tw]'); if (b) { e.stopPropagation(); cmd(b.getAttribute('data-tw'), b.getAttribute('data-arg')); } });
    el.addEventListener('change', function (e) { e.stopPropagation(); if (e.target.id === 'tw-list') { W.linkList = e.target.value; drawLink(); } if (e.target.id === 'tw-card') { W.spec.src = { mode: 'card', ref: e.target.value }; linkText(); generate(); } });
    el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); cmd('cancel'); } }, false);
    ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'keyup', 'keypress'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }); });
    stage(); chrome(); generate();
    setTimeout(function () { if (W && !W.spec.src) ta.focus(); }, 60);
  }
  function typed() { W.valid = false; W.spec.text = normalizeText(W.el.querySelector('#tw-text').value); if (W.spec.src) delete W.spec.src; schedule(); }
  function schedule() { clearTimeout(W.timer); W.timer = setTimeout(generate, 250); }   // typing settles for a quarter second before anything is rebuilt
  function linkText() { var c = U.cardOf(U.index(W.ctx.host.boardId()), W.spec.src && W.spec.src.ref); if (c) W.spec.text = normalizeText(c.title + (c.zh ? '\n' + c.zh : '')); }
  function drawLink() {
    var box = W.el.querySelector('.tw-link'), ix = U.index(W.ctx.host.boardId()), on = !!W.spec.src;
    box.hidden = !on; W.el.querySelector('#tw-text').disabled = on;
    if (!on) return;
    if (!ix.lists.length) { box.innerHTML = '<p class="tw-count">这座岛的看板还没有卡片</p>'; return; }
    var L = ix.lists.filter(function (l) { return l.id === W.linkList; })[0] || ix.lists.filter(function (l) { return l.cards.some(function (c) { return c.ref === W.spec.src.ref; }); })[0] || ix.lists[0];
    W.linkList = L.id;
    if (!L.cards.some(function (c) { return c.ref === W.spec.src.ref; })) { W.spec.src.ref = L.cards[0].ref; linkText(); schedule(); }
    box.innerHTML = '<label class="tw-l" for="tw-list">列表</label><select id="tw-list">' + ix.lists.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === L.id ? ' selected' : '') + '>' + esc(l.title) + ' · ' + l.cards.length + '</option>'; }).join('') + '</select>' +
      '<label class="tw-l" for="tw-card">卡片（展品显示它的标题，卡片改名展品跟着变）</label><select id="tw-card">' + L.cards.map(function (c) { return '<option value="' + esc(c.ref) + '"' + (c.ref === W.spec.src.ref ? ' selected' : '') + '>' + esc(c.title) + '</option>'; }).join('') + '</select>';
  }
  function chrome() {
    var el = W.el, s = W.spec, k = KITS[s.kit], cl = classify(s.text), busy = W.state === 'crafting', ready = W.state === 'ready';
    [].forEach.call(el.querySelectorAll('[data-tw=kit]'), function (b) { var on = b.getAttribute('data-arg') === s.kit; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.disabled = busy; });
    [].forEach.call(el.querySelectorAll('[data-tw=size]'), function (b) { b.classList.toggle('on', b.getAttribute('data-arg') === s.size); b.disabled = busy; });
    [].forEach.call(el.querySelectorAll('[data-tw=src]'), function (b) { b.classList.toggle('on', (b.getAttribute('data-arg') === 'card') === !!s.src); });
    el.querySelector('.tw-pals').innerHTML = k.pals.map(function (p) { var v = p[2], sw = [v.body || v.paper || v.glass || (v.letters && v.letters[0]) || v.board || v.cloth || (v.leaves && v.leaves[0]) || v.tile, v.groove || v.ink || v.base || (v.letters && v.letters[1]) || v.thread || (v.flower && v.flower[0]) || v.glaze]; return '<button type="button" data-tw="pal" data-arg="' + p[0] + '" class="' + (s.pal === p[0] ? 'on' : '') + '"' + (busy ? ' disabled' : '') + '><i style="background:' + (typeof sw[0] === 'string' ? sw[0] : sw[0][0]) + '"></i><i style="background:' + (typeof sw[1] === 'string' ? sw[1] : sw[1][0]) + '"></i>' + p[1] + '</button>'; }).join('');
    el.querySelector('.tw-count').textContent = cl.mode === 'empty' ? '' : cl.why;
    el.querySelector('.tw-title').hidden = cl.mode !== 'entry';
    var P = W.res && W.res.P, sf = W.res && W.res.info && W.res.info.surface;
    el.querySelector('.tw-disp').innerHTML = '<b>' + (sf ? '牌匾 + 立架' : k.display) + ' ✓</b><small>按成品尺寸自动扩展 · 工具：' + k.tool + '</small>';
    el.querySelector('.tw-notes').textContent = (P && P.notes ? P.notes : []).concat(sf && P && P.why ? [P.why] : []).concat(W.res && W.res.info ? [Math.round(W.res.info.tris) + ' 个三角形 · 占地 ' + sizeOf(W.res).w + '×1 格，高 ' + sizeOf(W.res).h + ' 格'] : []).join(' · ');
    var ok = !!(W.valid && W.res && W.res.info);
    el.querySelector('[data-tw=craft]').hidden = ready; el.querySelector('[data-tw=skip]').hidden = ready;
    el.querySelector('[data-tw=craft]').disabled = !ok || busy; el.querySelector('[data-tw=skip]').disabled = !ok;
    el.querySelector('[data-tw=place]').hidden = !ready; el.querySelector('[data-tw=again]').hidden = !ready;
    el.querySelector('[data-tw=place]').textContent = W.edit ? '✓ 换成这一件' : '📦 领取并放进世界';
    el.querySelector('#tw-text').readOnly = busy || ready;
    drawLink();
  }
  function say(t, bad) { var m = W.el.querySelector('.tw-msg'); m.textContent = t || ''; m.classList.toggle('bad', !!bad); }
  // build the preview for the latest input; an older request that finishes later is ignored
  function generate() {
    if (!W) return;
    var id = ++W.req, spec = cleanSpec(W.spec); spec.src = W.spec.src; W.spec = spec;
    if (W.state === 'crafting' && W.stop) { W.stop(); }
    W.state = 'validating'; W.valid = false;
    var cl = classify(spec.text);
    if (cl.mode === 'empty') { W.state = 'draft'; say(spec.text.length ? cl.why : '输入文字就能看到成品'); chrome(); return; }   // the last good preview stays on the stage
    W.state = 'generating';
    var r; try { r = itemRes(spec); } catch (e) { if (id !== W.req) return; W.state = 'error'; say('这段文字没做出来：' + (e && e.message || e) + ' · 原文还在，改一改再试', true); chrome(); return; }
    if (id !== W.req) return;
    if (!r.info) { W.state = 'draft'; say(r.P.why, true); chrome(); return; }
    show(r); W.valid = true; W.state = 'preview'; say(''); draftSave(spec); chrome();
  }
  function show(r) {
    if (W.res === r && W.handle) { pose(W.handle, 1, 0); W.dirty = true; return; }
    unshow(); r.n++; W.res = r;
    W.handle = assemble(r, W.item, false); pose(W.handle, 1, 0);
    W.fw = r.info.w; W.fh = r.info.top; W.cy = r.info.top / 2; W.dirty = true;
  }
  function unshow() { if (W.res) { W.res.n--; W.res = null; } while (W.item && W.item.children.length) W.item.remove(W.item.children[0]); W.handle = null; }
  function stage() {   // the preview: its own small renderer, drawn only when something changed
    var cv = W.el.querySelector('canvas'), R;
    try { R = new (T().WebGLRenderer)({ canvas: cv, antialias: true, alpha: true }); } catch (e) { say('这台设备开不了 3D 预览 · 仍然可以制作并放进世界', true); return; }
    W.renderer = R; R.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    W.scene = new (T().Scene)(); W.cam = new (T().PerspectiveCamera)(38, 1, 0.1, 100); W.item = new (T().Group)(); W.scene.add(W.item);
    W.scene.add(new (T().HemisphereLight)(0xfff4e0, 0x6a5a48, 0.85)); var sun = new (T().DirectionalLight)(0xffffff, 0.75); sun.position.set(3, 6, 5); W.scene.add(sun);
    var floor = new (T().Mesh)(new (T().CircleGeometry)(7, 40), new (T().MeshLambertMaterial)({ color: 0xd9cdb6 })); floor.rotation.x = -Math.PI / 2; W.scene.add(floor); W.floor = floor;
    var drag = null;
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) { if (!drag) return; W.yaw -= (e.clientX - drag.x) * 0.01; W.pitch = Math.max(-0.1, Math.min(1.1, W.pitch + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY }; W.dirty = true; });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { cv.addEventListener(t, function () { drag = null; }); });
    cv.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') W.yaw += 0.15; else if (e.key === 'ArrowRight') W.yaw -= 0.15; else return; W.dirty = true; e.preventDefault(); }); cv.tabIndex = 0;
    (function loop() {
      if (!W || W.renderer !== R) return;
      var w = cv.clientWidth, h = cv.clientHeight;
      if (w && h && (W.vw !== w || W.vh !== h)) { W.vw = w; W.vh = h; R.setSize(w, h, false); W.cam.aspect = w / h; W.cam.updateProjectionMatrix(); W.dirty = true; }
      if (W.dirty && w && h && !document.hidden) {
        W.dirty = false; var tn = Math.tan(19 * Math.PI / 180), d = Math.max(((W.fh || 1) / 2 + 0.25) / tn, ((W.fw || 1) / 2 + 0.3) / (tn * W.cam.aspect)) * 1.12 + 0.5, cy = W.cy || 0.5;   // the whole piece in view, whatever the stage's shape
        W.cam.position.set(Math.sin(W.yaw) * Math.cos(W.pitch) * d, cy + Math.sin(W.pitch) * d, Math.cos(W.yaw) * Math.cos(W.pitch) * d); W.cam.lookAt(0, cy, 0);
        R.render(W.scene, W.cam);
      }
      W.raf = requestAnimationFrame(loop);
    })();
  }
  function cmd(a, arg) {
    if (!W) return;
    var busy = W.state === 'crafting';
    if (a === 'cancel') return close();
    if (a === 'kit' && KITS[arg] && !busy) { W.spec.kit = arg; W.spec.pal = KITS[arg].pals[0][0]; return generate(); }
    if (a === 'pal' && !busy) { W.spec.pal = arg; return generate(); }
    if (a === 'size' && !busy) { W.spec.size = arg; return generate(); }
    if (a === 'src') {
      if (arg === 'card') { var ix = U.index(W.ctx.host.boardId()); if (!ix.lists.length) return say('这座岛的看板还没有卡片', true); W.spec.src = W.spec.src || { mode: 'card', ref: ix.lists[0].cards[0].ref }; linkText(); }
      else if (W.spec.src) { delete W.spec.src; W.el.querySelector('#tw-text').value = W.spec.text; }   // unlinking keeps the words as a copy of its own
      return generate();
    }
    if (a === 'again') { W.state = 'preview'; say(''); return chrome(); }
    if ((a === 'craft' || a === 'skip') && W.valid && W.res && W.res.info) {
      if (busy) { if (a === 'skip' && W.stop) W.stop(); return; }   // pressing 制作 twice changes nothing; 立即完成 jumps to the same end
      if (W.state === 'ready') return;
      clearTimeout(W.timer);
      var finish = function () { if (!W) return; W.stop = null; W.state = 'ready'; say(W.edit ? '做好了 · 点「换成这一件」替换原来的展品' : '做好了 · 点「领取并放进世界」'); chrome(); var b = W.el.querySelector('[data-tw=place]'); if (b) b.focus(); };
      if (a === 'skip') { pose(W.handle, 1, 0); W.dirty = true; return finish(); }
      W.state = 'crafting'; say(KITS[W.spec.kit].tool + ' 制作中… 可以「立即完成」'); chrome();
      W.stop = play(W.handle, KITS[W.spec.kit].seconds, finish, function () { if (W) W.dirty = true; });
      return;
    }
    if (a === 'place' && W.state === 'ready' && W.valid) return place();
  }
  // into the world, once: a new item next to you, or the edited one swapped in if its new size still fits
  function place() {
    var ctx = W.ctx, host = ctx.host, r = W.res, sz = sizeOf(r), spec = cleanSpec(W.spec), ds = U.list(host);
    if (W.spec.src) spec.src = U.clone(W.spec.src);
    var label = (titleOf(spec.text) || '文字').slice(0, 24), old = W.edit && U.byId(ds, W.edit.id), d, s;
    if (W.placing) return; W.placing = true;
    try {
      if (W.edit && !old) { say('原来的展品已经不在了 · 关掉重新制作', true); return; }
      if (old) {
        d = U.clone(old); d.tx = spec; d.w = sz.w; d.d = sz.d; d.h = sz.h; d.label = label; U.snap(d);
        s = U.site(host, d, ds, d.y - 1); if (!s.ok) s = U.near(host, d, ds, d.y - 1, 2);
        if (!s.ok) { say('新尺寸在原地放不下（' + s.why + '）· 原展品没有变。缩小尺寸，或先把它搬到宽一点的地方', true); W.state = 'preview'; chrome(); return; }
        ctx.commit(function (next) { var q = U.byId(next.displays, old.id); if (q) { q.tx = spec; q.w = d.w; q.d = d.d; q.h = d.h; q.x = d.x; q.y = d.y; q.z = d.z; q.label = label; } });
        ctx.toast('✍️ 换好了 · ↶ 可撤销');
      } else {
        var v = host.view(); d = U.snap({ id: U.uid('t'), kind: 'text', x: v.x, z: v.z, y: 0, rot: U.rotToward(-v.fx, -v.fz), it: [], w: sz.w, d: sz.d, h: sz.h, tx: spec, label: label });
        s = U.near(host, d, ds, v.y, 14, true);
        if (!s.ok) { say('你面前没有放得下的平地（' + s.why + '）· 换个开阔的地方再领取，作品还在这里', true); return; }
        ctx.commit(function (next) { next.displays.push(d); });
        ctx.setSel(d.id); ctx.toast('✍️「' + label + '」放好了 · 可以用 📍 搬到你点的地方 · ↶ 可撤销');
      }
      W.done = true; close(); ctx.refresh();
    } finally { if (W) W.placing = false; }
  }
  function close() {
    if (!W) return;
    var w = W; W = null;
    clearTimeout(w.timer); if (w.stop) { var st = w.stop; w.stop = null; w.state = 'closing'; st(); }
    cancelAnimationFrame(w.raf);
    if (w.res) w.res.n--;
    if (w.renderer) { if (w.floor) { w.floor.geometry.dispose(); w.floor.material.dispose(); } w.renderer.dispose(); try { w.renderer.forceContextLoss(); } catch (e) {} }
    w.el.remove();
    var b = document.querySelector('#mn-bld-p [data-vd="text:new"], #mn-bld-p [data-vd="text:edit"]'); if (b) b.focus();
  }

  /* ================================================================ styles */
  var css = document.createElement('style'); css.id = 'minest-textcraft-style';
  css.textContent = [
    '#mn-bld-p .tw-entry{display:grid;gap:4px;margin:8px 0 2px}',
    '#mn-bld-p .tw-entry .obld-btn{min-height:44px;font-size:13.5px}',
    '#mn-bld-p .tw-entry small{font:500 11px system-ui;color:#94a3b8}',
    '#vd-modal .tw-read{margin:8px 0;white-space:pre-wrap;word-break:break-word;font:16px/1.7 system-ui,-apple-system,sans-serif;color:#1d2b4f;-webkit-user-select:text;user-select:text;max-height:56vh;overflow-y:auto}',
    '#tw{position:fixed;inset:0;z-index:2147483500;display:flex;flex-direction:column;background:#f4ead8;color:#3b2a1a;font:14px/1.45 system-ui,-apple-system,sans-serif;pointer-events:auto;-webkit-user-select:none;user-select:none}',
    '#tw header{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));background:#5a3a22;color:#fbf3e2;flex:none}',
    '#tw header b{font:800 16px system-ui}',
    '#tw .tw-mode{flex:1;font:600 12px system-ui;opacity:.85}',
    '#tw .tw-x{width:44px;height:44px;border:0;border-radius:8px;background:#7a5334;color:#fff;font:800 16px system-ui;cursor:pointer}',
    '#tw .tw-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(230px,300px) minmax(0,1fr) minmax(190px,240px);gap:12px;padding:12px}',
    '#tw section{min-height:0;overflow-y:auto;overscroll-behavior:contain}',
    '#tw .tw-left,#tw .tw-right{background:#fbf5e8;border:2px solid #d9c6a2;border-radius:10px;padding:12px}',
    '#tw .tw-l{display:block;font:800 12.5px system-ui;color:#6b4423;margin:12px 0 6px}',
    '#tw .tw-l:first-child{margin-top:0}',
    '#tw textarea,#tw input[type=text],#tw select{width:100%;box-sizing:border-box;border:2px solid #c9b48c;border-radius:8px;background:#fffdf7;color:#2b1d10;font:600 16px/1.4 system-ui;padding:9px 10px;-webkit-user-select:text;user-select:text}',
    '#tw textarea{resize:vertical;min-height:76px}',
    '#tw textarea:disabled{background:#efe6d2;color:#7a6a55}',
    '#tw .tw-count{margin:5px 0 0;font:600 12px system-ui;color:#7a5a36;min-height:16px}',
    '#tw .tw-src{display:flex;gap:6px;margin-top:8px}',
    '#tw .tw-src button,#tw .tw-sizes button{flex:1;min-height:40px;border:2px solid #c9b48c;border-radius:8px;background:#fffdf7;color:#5a3a22;font:700 12.5px system-ui;cursor:pointer}',
    '#tw .tw-sizes{display:flex;gap:6px}',
    '#tw button.on{background:#f2c13d;border-color:#b98a1c;color:#2b2205}',
    '#tw .tw-link{margin-top:8px}',
    '#tw .tw-kits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
    '#tw .tw-kits button{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;text-align:left;min-height:50px;padding:6px 9px;border:2px solid #c9b48c;border-radius:9px;background:#fffdf7;color:#3b2a1a;cursor:pointer}',
    '#tw .tw-kits i{grid-row:span 2;font-style:normal;font-size:22px}',
    '#tw .tw-kits b{font:800 13px system-ui}',
    '#tw .tw-kits small{font:600 10.5px system-ui;color:#8a6f4d}',
    '#tw .tw-kits button.on small{color:#5a4410}',
    '#tw .tw-mid{overflow:hidden}',
    '#tw .tw-stage{position:relative;width:100%;height:100%;min-height:220px;border-radius:12px;overflow:hidden;background:linear-gradient(#bfe0f7,#f3e6c8 62%,#d9cdb6);border:2px solid #d9c6a2;box-sizing:border-box}',
    '#tw canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}',
    '#tw .tw-hint{position:absolute;left:10px;top:8px;margin:0;font:700 11.5px system-ui;color:#5a3a22;background:rgba(255,253,247,.8);padding:3px 8px;border-radius:999px;pointer-events:none}',
    '#tw .tw-msg{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);margin:0;max-width:88%;text-align:center;font:700 13px/1.35 system-ui;color:#3b2a1a;background:rgba(255,253,247,.92);padding:7px 12px;border-radius:10px}',
    '#tw .tw-msg:empty{display:none}',
    '#tw .tw-msg.bad{background:#fde8e4;color:#8a1c12;border:2px solid #d9482b}',
    '#tw .tw-disp{margin:0;padding:9px 10px;border:2px solid #b98a1c;border-radius:9px;background:#fff7dc}',
    '#tw .tw-disp b{display:block;font:800 13px system-ui}',
    '#tw .tw-disp small{font:600 11px system-ui;color:#7a5a36}',
    '#tw .tw-pals{display:grid;gap:6px}',
    '#tw .tw-pals button{display:flex;align-items:center;gap:6px;min-height:40px;padding:5px 9px;border:2px solid #c9b48c;border-radius:8px;background:#fffdf7;color:#3b2a1a;font:700 12.5px system-ui;cursor:pointer}',
    '#tw .tw-pals i{width:16px;height:16px;border-radius:4px;border:1px solid #0003}',
    '#tw .tw-notes{margin:10px 0 0;font:600 11.5px/1.5 system-ui;color:#7a5a36}',
    '#tw footer{flex:none;display:flex;gap:8px;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom));background:#ead9b8;border-top:2px solid #d9c6a2}',
    '#tw footer button{min-height:46px;padding:0 16px;border:2px solid #b89a6a;border-radius:10px;background:#fffdf7;color:#3b2a1a;font:800 14px system-ui;cursor:pointer}',
    '#tw footer .tw-go,#tw footer .tw-place{flex:1;background:#2f8a4a;border-color:#1f6a36;color:#fff}',
    '#tw button:disabled{opacity:.45;cursor:default}',
    '#tw button:focus-visible,#tw textarea:focus-visible,#tw select:focus-visible,#tw input:focus-visible,#tw canvas:focus-visible{outline:3px solid #2f6fd6;outline-offset:1px}',
    '#tw [hidden]{display:none!important}',
    '@media (max-width:760px){#tw .tw-body{display:flex;flex-direction:column;overflow-y:auto;gap:10px;padding:10px}#tw section{overflow:visible;flex:none}#tw .tw-mid{order:-1;height:34vh;min-height:200px}#tw .tw-kits{grid-template-columns:repeat(4,minmax(0,1fr))}#tw .tw-kits button{grid-template-columns:1fr;justify-items:center;text-align:center;padding:6px 2px}#tw .tw-kits i{grid-row:auto}#tw .tw-kits small{display:none}#tw .tw-pals{grid-template-columns:repeat(3,minmax(0,1fr))}#tw footer button{padding:0 10px;font-size:13px}}',
    '@media (prefers-reduced-motion:reduce){#tw *{transition:none!important}}'
  ].join('\n');
  document.head.appendChild(css);

  root.MinestTextCraft = {
    VERSION: VERSION, pure: PURE,
    open: function (d) { var ctx = U.ctx(); if (!ctx) return false; open(ctx, d || null); return true; },
    close: close, isOpen: function () { return !!W; }, state: function () { return W ? W.state : null; },
    plan: function (tx) { var p = plan(cleanSpec(tx)); return { mode: p.mode, n: p.n, why: p.why, notes: p.notes, lines: p.lines, cells: p.mask ? [p.mask.W, p.mask.H] : null }; },
    measure: function (tx) { var r = itemRes(cleanSpec(tx)); return r.info ? { size: sizeOf(r), tris: r.info.tris, surface: r.info.surface, w: r.info.w, top: r.info.top } : { error: r.P.why }; },
    exportItems: function () { var ctx = U.ctx(); if (!ctx) return null; return { schemaVersion: 1, kind: 'minest-textcraft', items: U.list(ctx.host).filter(function (d) { return d.kind === 'text'; }).map(function (d) { return U.clone(d); }) }; }
  };
})(typeof window === 'object' ? window : globalThis);
