/* Minest · 时代广场 Times Square World
   A walkable, real-scale Times Square "bowtie" at blue hour (Broadway × 7th Ave, W 42nd–47th St).
   Every screen and ticker is painted from the learning snapshot Spatial Home posts in ({tsq:1, op:'content', data}).
   No real advertisers, logos or exchange names: the LED band is the "Minest Ticker".
   three.js r128 UMD (global THREE), no build step. Everything is unlit MeshBasic / small shaders with baked shading. */
(function () {
  'use strict';
  var T = THREE;

  /* ───────────────────────── utilities ───────────────────────── */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var R = rng(20261112);
  function rand(a, b) { return a + (b - a) * R(); }
  function pick(a) { return a[(R() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pot(x) { return Math.pow(2, Math.round(Math.log(Math.max(1, x)) / Math.LN2)); }
  function hexRGB(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h.slice(0, 6), 16); if (!/^[0-9a-f]{6}/i.test(h) || isNaN(n)) return [150, 150, 170];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { var c = hexRGB(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shadeHex(hex, k) { var c = hexRGB(hex); return 'rgb(' + c.map(function (v) { return clamp(Math.round(v * k), 0, 255); }).join(',') + ')'; }
  function mixHex(a, b, t) { var x = hexRGB(a), y = hexRGB(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); }).join(',') + ')'; }
  function col3(hex, k) { var c = hexRGB(hex); k = k == null ? 1 : k; return [c[0] / 255 * k, c[1] / 255 * k, c[2] / 255 * k]; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  var EMBED = (function () { try { return window.parent !== window; } catch (e) { return true; } })();
  var DEBUG = /[?&]debug=1/.test(location.search);

  /* ───────────────────────── city layout (metres; x east, z south, north = -z) ───────────────────────── */
  var SLOPE = 0.24;                                  // Broadway centre: x = SLOPE * z (east of 7th at 42nd, west of it at 47th)
  var AVE_HW = 9, AVE_SW = 5;                        // 7th Avenue roadway half-width, sidewalk
  var BWX = 8 * Math.sqrt(1 + SLOPE * SLOPE);        // Broadway half-width measured along x
  var BW_SW = 5, ST_SW = 4.5;
  var STREETS = [];                                  // z of cross streets, 50th St (-480) … 39th St (+480)
  for (var k = 0; k <= 12; k++) STREETS.push(480 - 80 * k);
  var STREET_NAME = {}; STREETS.forEach(function (z) { STREET_NAME[z] = 'W ' + (45 - z / 80) + ' St'; });
  function streetHW(z) { return z === 240 ? 10 : 7; }   // 42nd is the wide one
  var XMAX = 300;
  var EYE = 1.7, WALK = 4.2, RUN = 9;

  /* ───────────────────────── content (from Spatial Home) ───────────────────────── */
  var SUBS = {
    ela: { zh: '语言艺术', en: 'Language Arts', color: '#ff5d7a', glyph: '📚' },
    math: { zh: '数学', en: 'Math', color: '#3fa7ff', glyph: '🔢' },
    sci: { zh: '科学', en: 'Science', color: '#34d399', glyph: '🔬' },
    ss: { zh: '社会', en: 'Social Studies', color: '#ffb347', glyph: '🗺️' },
    other: { zh: '其他', en: 'Other', color: '#b48cff', glyph: '🎨' }
  };
  var THEMES = [
    { id: 'ela', sub: 'ela', target: 'chart', zh: '语言艺术', en: 'Language Arts', color: '#ff5d7a', glyph: '📚' },
    { id: 'math', sub: 'math', target: 'chart', zh: '数学', en: 'Math', color: '#3fa7ff', glyph: '🔢' },
    { id: 'sci', sub: 'sci', target: 'chart', zh: '科学', en: 'Science', color: '#34d399', glyph: '🔬' },
    { id: 'ss', sub: 'ss', target: 'chart', zh: '社会', en: 'Social Studies', color: '#ffb347', glyph: '🗺️' },
    { id: 'words', target: 'words', zh: '单词塔', en: 'Words', color: '#b48cff', glyph: '🔤' },
    { id: 'works', target: 'works', zh: '作品馆', en: 'Workshop', color: '#ffd54a', glyph: '🎨' }
  ];

  function daysBetween(a, b) { var x = Date.parse(a + 'T00:00:00'), y = Date.parse(b + 'T00:00:00'); return isNaN(x) || isNaN(y) ? null : Math.round((y - x) / 864e5); }
  function sampleData() {
    var d = todayISO(), ex = (new Date().getFullYear() + 1) + '-02-28';
    return {
      date: d, exam: { name: '示例考试 Sample Exam', date: ex, daysLeft: daysBetween(d, ex) },
      charts: [
        { sub: 'math', name: 'Math', zh: '数学', ink: '#3fa7ff', glyph: '🔢', title: 'Place Value to 1,000', text: 'Each digit has a value set by its place: hundreds, tens and ones.', mastered: false },
        { sub: 'sci', name: 'Science', zh: '科学', ink: '#34d399', glyph: '🔬', title: 'States of Matter', text: 'Solid, liquid, gas — heating and cooling change the state.', mastered: true },
        { sub: 'ela', name: 'Language Arts', zh: '语言艺术', ink: '#ff5d7a', glyph: '📚', title: 'Main Idea & Key Details', text: '', mastered: false }
      ],
      big3: [{ title: '复习一张 Anchor Chart', done: true }, { title: '认识 10 个新单词', done: false }, { title: '朗读 20 分钟', done: false }],
      words: { list: '示例词表 Sample list', cur: 'habitat', next: ['predict', 'compare', 'evidence', 'pattern', 'observe'], left: 12, total: 20, knownToday: 3 },
      progress: { big3Done: 1, big3Have: 3, charts: 1, chartsOf: 5, wordsToday: 3 },
      works: [{ title: 'ocean', kind: 'neon' }, { title: 'planet', kind: 'chrome' }],
      custom: ['欢迎来到时代广场 · Welcome to Times Square'],
      demo: true
    };
  }
  function str(v, n) { v = v == null ? '' : String(v); v = v.replace(/\s+/g, ' ').trim(); return v.length > n ? v.slice(0, n - 1) + '…' : v; }
  function normalize(d, isSample) {
    d = d && typeof d === 'object' ? d : {};
    var c = { isSample: !!isSample || !!d.demo, date: str(d.date, 20) || todayISO() };
    var ex = d.exam && typeof d.exam === 'object' ? d.exam : null;
    c.exam = ex && (ex.name || ex.date || typeof ex.daysLeft === 'number') ? { name: str(ex.name, 60), date: str(ex.date, 20), daysLeft: typeof ex.daysLeft === 'number' && isFinite(ex.daysLeft) ? Math.round(ex.daysLeft) : (ex.date ? daysBetween(c.date, ex.date) : null) } : null;
    c.charts = (Array.isArray(d.charts) ? d.charts : []).slice(0, 8).filter(function (x) { return x && typeof x === 'object'; }).map(function (x) {
      var sub = SUBS[x.sub] ? x.sub : 'other', S = SUBS[sub];
      return { sub: sub, name: str(x.name, 40) || S.en, zh: str(x.zh, 30) || S.zh, ink: /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(x.ink || '') ? x.ink : S.color,
        glyph: Array.from(str(x.glyph, 12)).slice(0, 2).join('') || S.glyph, title: str(x.title, 90), text: str(x.text, 180), mastered: !!x.mastered };
    });
    c.big3 = (Array.isArray(d.big3) ? d.big3 : []).slice(0, 3).filter(function (x) { return x && typeof x === 'object'; }).map(function (x) { return { title: str(x.title, 70), done: !!x.done }; });
    var w = d.words && typeof d.words === 'object' ? d.words : null;
    c.words = w ? { list: str(w.list, 40), cur: str(w.cur, 40), next: (Array.isArray(w.next) ? w.next : []).map(function (s) { return str(s, 30); }).filter(Boolean).slice(0, 8),
      left: typeof w.left === 'number' ? w.left : null, total: typeof w.total === 'number' ? w.total : null, knownToday: typeof w.knownToday === 'number' ? w.knownToday : 0 } : null;
    var p = d.progress && typeof d.progress === 'object' ? d.progress : {};
    function num(v, dflt) { return typeof v === 'number' && isFinite(v) ? v : dflt; }
    c.progress = { big3Done: num(p.big3Done, c.big3.filter(function (b) { return b.done; }).length), big3Have: num(p.big3Have, c.big3.length),
      charts: num(p.charts, c.charts.filter(function (x) { return x.mastered; }).length), chartsOf: num(p.chartsOf, 5), wordsToday: num(p.wordsToday, c.words ? c.words.knownToday : 0) };
    c.works = (Array.isArray(d.works) ? d.works : []).slice(0, 24).filter(function (x) { return x && (x.title || x.kind); }).map(function (x) { return { title: str(x.title, 40) || '…', kind: str(x.kind, 20) }; });
    c.custom = (Array.isArray(d.custom) ? d.custom : []).map(function (s) { return str(s, 120); }).filter(Boolean).slice(0, 6);
    return c;
  }
  var content = null;     // normalized; null until sample or parent data arrives

  /* ───────────────────────── canvas painting ───────────────────────── */
  var FONT = '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",-apple-system,"Helvetica Neue",Arial,sans-serif';
  function font(px, w) { return (w || 700) + ' ' + Math.max(6, Math.round(px)) + 'px ' + FONT; }
  var TOK = /[⺀-鿿豈-﫿＀-￯　-〿]|\s+|[^\s⺀-鿿豈-﫿＀-￯　-〿]+/g;
  function wrap(ctx, text, maxW, maxLines) {
    var toks = String(text || '').match(TOK) || [], lines = [], cur = '', cut = false;
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (/^\s+$/.test(tk)) { if (cur) cur += ' '; continue; }
      if (ctx.measureText(cur + tk).width <= maxW) { cur += tk; continue; }
      if (cur.trim()) { lines.push(cur.trim()); cur = ''; if (lines.length >= maxLines) { cut = true; break; } }
      if (ctx.measureText(tk).width > maxW) {
        var chars = Array.from(tk);
        for (var j = 0; j < chars.length; j++) {
          if (cur && ctx.measureText(cur + chars[j]).width > maxW) { lines.push(cur); cur = ''; if (lines.length >= maxLines) { cut = true; break; } }
          cur += chars[j];
        }
        if (cut) break;
      } else cur = tk;
    }
    if (!cut && cur.trim()) { if (lines.length < maxLines) lines.push(cur.trim()); else cut = true; }
    if (cut && lines.length) {
      var l = lines[lines.length - 1];
      while (l.length > 1 && ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1);
      lines[lines.length - 1] = l + '…';
    }
    return lines;
  }
  /* largest font size (<= size) at which text fits in maxW × maxH within maxLines */
  function fitWrap(ctx, text, maxW, maxH, size, minSize, weight, maxLines, lh) {
    lh = lh || 1.18; var s = size, lines;
    for (var it = 0; it < 14; it++) {
      ctx.font = font(s, weight);
      var n = Math.max(1, Math.min(maxLines, Math.floor(maxH / (s * lh))));
      lines = wrap(ctx, text, maxW, n);
      var full = wrap(ctx, text, maxW, 99);
      if ((full.length <= n && lines.length * s * lh <= maxH + 1) || s <= minSize) break;
      s = Math.max(minSize, s * 0.88);
    }
    return { lines: lines, size: s, lh: s * lh };
  }
  function fitLine(ctx, text, maxW, size, minSize, weight) {
    ctx.font = font(size, weight); var w = ctx.measureText(text).width;
    var s = w > maxW ? Math.max(minSize, size * maxW / w) : size; ctx.font = font(s, weight); return s;
  }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function paintBG(ctx, W, H, s) {
    var a = s.accent || '#7c6cff', L = Math.min(W, H), g;
    if (s.bg === 'light') {
      g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, mixHex('#fff1d6', a, 0.25));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = a; ctx.fillRect(0, 0, W, L * 0.035); ctx.fillRect(0, H - L * 0.035, W, L * 0.035);
      return;
    }
    if (s.bg === 'vivid') {
      g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, shadeHex(a, 1.05)); g.addColorStop(0.6, mixHex(a, '#2a0f5c', 0.55)); g.addColorStop(1, '#120a2e');
    } else {
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1030'); g.addColorStop(1, '#05060f');
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r = ctx.createRadialGradient(W * 0.12, H * 0.1, 0, W * 0.12, H * 0.1, Math.max(W, H) * 0.95);
    r.addColorStop(0, rgba(a, s.bg === 'vivid' ? 0.35 : 0.6)); r.addColorStop(0.5, rgba(a, 0.14)); r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#fff'; ctx.lineWidth = L * 0.03;
    for (var i = -H; i < W + H; i += L * 0.16) { ctx.beginPath(); ctx.moveTo(i, H); ctx.lineTo(i + H, 0); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = rgba(a, 0.95); ctx.lineWidth = L * 0.014; ctx.strokeRect(L * 0.007, L * 0.007, W - L * 0.014, H - L * 0.014);
  }
  function kickerPill(ctx, text, x, y, size, s, align, maxW) {
    size = fitLine(ctx, text, maxW - size * 1.2, size, size * 0.55, 800);
    var w = ctx.measureText(text).width + size * 1.1, h = size * 1.55, x0 = align === 'center' ? x - w / 2 : x;
    rr(ctx, x0, y, w, h, h / 2); ctx.fillStyle = s.bg === 'light' ? s.accent : 'rgba(255,255,255,0.16)'; ctx.fill();
    ctx.fillStyle = s.bg === 'light' ? '#fff' : '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(text, x0 + size * 0.55, y + h / 2 + size * 0.04); ctx.textBaseline = 'alphabetic';
    return h;
  }
  function sampleTag(ctx, W, H) {
    if (!content || !content.isSample) return;
    var L = Math.min(W, H), sz = L * 0.05; ctx.font = font(sz, 800);
    var t = '示例 SAMPLE', w = ctx.measureText(t).width + sz;
    rr(ctx, W - w - L * 0.04, L * 0.04, w, sz * 1.5, sz * 0.4); ctx.fillStyle = 'rgba(255,196,64,0.95)'; ctx.fill();
    ctx.fillStyle = '#231500'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t, W - w - L * 0.04 + sz / 2, L * 0.04 + sz * 0.78); ctx.textBaseline = 'alphabetic';
  }
  function glyphDisc(ctx, cx, cy, r, s) {
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, s.bg === 'vivid' ? 'rgba(255,255,255,0.45)' : shadeHex(s.accent, 1.25)); g.addColorStop(1, s.bg === 'vivid' ? 'rgba(255,255,255,0.12)' : shadeHex(s.accent, 0.55));
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.font = font(r * 1.05, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText(s.glyph, cx, cy + r * 0.06); ctx.textBaseline = 'alphabetic';
  }

  function paintCard(ctx, W, H, s) {
    paintBG(ctx, W, H, s);
    var L = Math.min(W, H), hor = W > H * 1.15, pad = L * 0.085, fg = s.bg === 'light' ? '#14142a' : '#ffffff';
    var x = pad, y = pad, tw = W - 2 * pad, bottom = H - pad, align = hor ? 'left' : 'center', cx = hor ? x : W / 2;
    if (s.glyph) {
      if (hor) { var gr = Math.min(H * 0.32, W * 0.16); glyphDisc(ctx, W - pad - gr, H / 2, gr, s); tw = W - 3 * pad - 2 * gr; }
      else { var gr2 = Math.min(W * 0.24, H * 0.13); glyphDisc(ctx, W / 2, pad + gr2, gr2, s); y = pad + gr2 * 2 + pad * 0.5; }
    }
    if (s.kicker) { y += kickerPill(ctx, s.kicker, cx, y, L * 0.072, s, align, tw) + L * 0.05; }
    if (s.footer) {
      var fsz = fitLine(ctx, s.footer, tw, L * 0.064, L * 0.04, 650);
      ctx.fillStyle = s.bg === 'light' ? shadeHex(s.accent, 0.7) : 'rgba(255,255,255,0.86)'; ctx.textAlign = align;
      ctx.fillText(s.footer, cx, bottom); bottom -= fsz * 1.6;
    }
    ctx.textAlign = align;
    if (s.big) {
      var avail = (bottom - y) * (s.title || s.body ? 0.62 : 0.95);
      var bs = fitLine(ctx, s.big, tw, Math.min(avail * 0.92, L * 0.6), L * 0.08, 900);
      ctx.fillStyle = s.bigColor || fg;
      if (s.bg !== 'light') { ctx.shadowColor = rgba(s.accent, 0.9); ctx.shadowBlur = bs * 0.25; }
      ctx.fillText(s.big, cx, y + bs * 0.86); ctx.shadowBlur = 0; y += bs * 1.08;
    }
    if (s.title) {
      var th = (bottom - y) * (s.body ? 0.6 : 1);
      var f = fitWrap(ctx, s.title, tw, th, L * (s.big ? 0.1 : 0.15), L * 0.055, 800, hor ? 3 : 4);
      ctx.fillStyle = fg; ctx.font = font(f.size, 800);
      f.lines.forEach(function (ln, i) { ctx.fillText(ln, cx, y + f.size * 0.9 + i * f.lh); });
      y += f.lines.length * f.lh + L * 0.03;
    }
    if (s.body && bottom - y > L * 0.05) {
      var fb = fitWrap(ctx, s.body, tw, bottom - y, L * 0.07, L * 0.042, 500, 4);
      ctx.fillStyle = s.bg === 'light' ? '#3a3a55' : 'rgba(255,255,255,0.84)'; ctx.font = font(fb.size, 500);
      fb.lines.forEach(function (ln, i) { ctx.fillText(ln, cx, y + fb.size * 0.9 + i * fb.lh); });
    }
  }
  function ring(ctx, cx, cy, r, frac, color, lw) {
    ctx.lineCap = 'round'; ctx.lineWidth = lw;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    if (frac > 0) { ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = lw * 0.8; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); ctx.stroke(); ctx.shadowBlur = 0; }
  }
  function paintRings(ctx, W, H, s) {
    paintBG(ctx, W, H, s);
    var L = Math.min(W, H), hor = W > H * 1.15, pad = L * 0.08, n = s.items.length;
    var top = pad + kickerPill(ctx, s.kicker, hor ? pad : W / 2, pad, L * 0.07, s, hor ? 'left' : 'center', W - 2 * pad) + L * 0.04;
    var bottom = H - pad;
    if (s.footer) { var fz = fitLine(ctx, s.footer, W - 2 * pad, L * 0.075, L * 0.04, 800); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(s.footer, W / 2, bottom); bottom -= fz * 1.5; }
    s.items.forEach(function (it, i) {
      var cx, cy, r;
      if (hor) { var cw = (W - 2 * pad) / n; cx = pad + cw * (i + 0.5); r = Math.min(cw * 0.36, (bottom - top) * 0.36); cy = top + r * 1.15; }
      else { var ch = (bottom - top) / n; cy = top + ch * (i + 0.42); r = Math.min(ch * 0.32, W * 0.3); cx = W / 2; }
      ring(ctx, cx, cy, r, it.frac, it.color, r * 0.2);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      fitLine(ctx, it.val, r * 1.4, r * 0.62, r * 0.25, 900); ctx.fillText(it.val, cx, cy + r * 0.22);
      fitLine(ctx, it.label, hor ? (W - 2 * pad) / n * 0.95 : W * 0.9, r * 0.32, r * 0.16, 700);
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillText(it.label, cx, cy + r * 1.62);
    });
  }
  function paintList(ctx, W, H, s) {
    paintBG(ctx, W, H, s);
    var L = Math.min(W, H), pad = L * 0.085, y = pad;
    y += kickerPill(ctx, s.kicker, pad, y, L * 0.07, s, 'left', W - 2 * pad) + L * 0.05;
    var bottom = H - pad;
    if (s.footer) { var fz = fitLine(ctx, s.footer, W - 2 * pad, L * 0.06, L * 0.04, 650); ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.textAlign = 'left'; ctx.fillText(s.footer, pad, bottom); bottom -= fz * 1.6; }
    var n = Math.max(1, s.items.length), rh = Math.min((bottom - y) / n, L * 0.24), fsz = rh * 0.46;
    s.items.forEach(function (it, i) {
      var cy = y + rh * (i + 0.5), m = fsz * 0.62;
      ctx.beginPath(); ctx.arc(pad + m, cy, m, 0, Math.PI * 2);
      if (it.done) { ctx.fillStyle = it.color || '#34d399'; ctx.fill(); ctx.fillStyle = '#06130c'; ctx.font = font(m * 1.4, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', pad + m, cy + m * 0.05); }
      else { ctx.lineWidth = m * 0.22; ctx.strokeStyle = it.color || 'rgba(255,255,255,0.8)'; ctx.stroke(); if (it.mark) { ctx.fillStyle = '#fff'; ctx.font = font(m * 1.1, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.mark, pad + m, cy + m * 0.05); } }
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var tx = pad + m * 2 + fsz * 0.6, maxW = W - tx - pad;
      fitLine(ctx, it.text, maxW, fsz, fsz * 0.5, 750);
      var line = wrap(ctx, it.text, maxW, 1)[0] || '';
      ctx.fillStyle = it.done ? 'rgba(255,255,255,0.62)' : '#fff'; ctx.fillText(line, tx, cy);
      if (it.sub) { ctx.font = font(fsz * 0.5, 600); ctx.fillStyle = it.color || 'rgba(255,255,255,0.7)'; ctx.textAlign = 'right'; ctx.fillText(it.sub, W - pad, cy - fsz * 0.75); }
      ctx.textBaseline = 'alphabetic';
    });
  }
  function paintChips(ctx, W, H, s) {
    paintBG(ctx, W, H, s);
    var L = Math.min(W, H), pad = L * 0.085, y = pad, hor = W > H * 1.15;
    y += kickerPill(ctx, s.kicker, hor ? pad : W / 2, y, L * 0.07, s, hor ? 'left' : 'center', W - 2 * pad) + L * 0.06;
    var sz = L * 0.12, chips = s.chips, rows;
    for (var it = 0; it < 10; it++) {
      ctx.font = font(sz, 800); rows = [[]]; var rw = 0, maxW = W - 2 * pad;
      chips.forEach(function (c) { var w = ctx.measureText(c).width + sz * 1.1; if (rw + w > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push({ t: c, w: Math.min(w, maxW) }); rw += w + sz * 0.35; });
      if (rows.length * sz * 1.9 <= H - y - pad || sz < L * 0.05) break; sz *= 0.88;
    }
    rows.forEach(function (row, ri) {
      var tot = row.reduce(function (a, c) { return a + c.w + sz * 0.35; }, -sz * 0.35), x = hor ? pad : (W - tot) / 2, cy = y + ri * sz * 1.9;
      row.forEach(function (c, ci) {
        rr(ctx, x, cy, c.w, sz * 1.5, sz * 0.75); ctx.fillStyle = ci === 0 && ri === 0 && s.firstHot ? s.accent : 'rgba(255,255,255,0.14)'; ctx.fill();
        ctx.strokeStyle = rgba(s.accent, 0.9); ctx.lineWidth = sz * 0.07; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = font(sz, 800);
        ctx.fillText(wrap(ctx, c.t, c.w - sz * 1.0, 1)[0] || '', x + sz * 0.55, cy + sz * 0.78); ctx.textBaseline = 'alphabetic';
        x += c.w + sz * 0.35;
      });
    });
  }
  function paintBrand(ctx, W, H, s) {
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1b0b48'); g.addColorStop(0.5, '#4a1180'); g.addColorStop(1, '#0a2a6a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var L = Math.min(W, H), t = s.phase || 0;
    for (var i = 0; i < 7; i++) { ctx.fillStyle = ['rgba(255,93,122,.35)', 'rgba(63,167,255,.35)', 'rgba(52,211,153,.3)', 'rgba(255,213,74,.3)'][i % 4]; ctx.beginPath(); ctx.arc(W * ((i * 0.37 + t) % 1), H * ((i * 0.61 + 0.2) % 1), L * (0.25 + 0.08 * (i % 3)), 0, 7); ctx.fill(); }
    ctx.textAlign = 'center'; var bs = fitLine(ctx, 'MINEST', W * 0.84, L * 0.36, L * 0.1, 900);
    var tg = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.6); tg.addColorStop(0, '#fff'); tg.addColorStop(1, '#ffd54a');
    ctx.fillStyle = tg; ctx.shadowColor = '#ff5df0'; ctx.shadowBlur = bs * 0.3; ctx.fillText('MINEST', W / 2, H * 0.5 + bs * 0.05); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; fitLine(ctx, '时代广场 · Times Square', W * 0.84, L * 0.11, L * 0.05, 800); ctx.fillText('时代广场 · Times Square', W / 2, H * 0.5 + bs * 0.05 + L * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; fitLine(ctx, s.line, W * 0.84, L * 0.065, L * 0.04, 600); ctx.fillText(s.line, W / 2, H - L * 0.09);
  }
  function paintFeed(ctx, W, H, s) {
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    var n = s.items.length, ch = H / n, pad = W * 0.07;
    s.items.forEach(function (it, i) {
      var y = i * ch, a = it.accent;
      var g = ctx.createLinearGradient(0, y, W, y + ch); g.addColorStop(0, shadeHex(a, 0.75)); g.addColorStop(1, mixHex(a, '#0b0830', 0.75));
      ctx.fillStyle = g; rr(ctx, pad * 0.5, y + ch * 0.05, W - pad, ch * 0.9, W * 0.05); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.86)'; ctx.textAlign = 'left';
      var ks = fitLine(ctx, it.kicker, W - pad * 2.2, W * 0.075, W * 0.045, 750); ctx.fillText(it.kicker, pad * 1.1, y + ch * 0.05 + ks * 1.6);
      var f = fitWrap(ctx, it.title, W - pad * 2.2, ch * 0.9 - ks * 2.6, W * 0.13, W * 0.06, 850, 3);
      ctx.fillStyle = '#fff'; ctx.font = font(f.size, 850);
      f.lines.forEach(function (ln, j) { ctx.fillText(ln, pad * 1.1, y + ch * 0.05 + ks * 2.2 + f.size * 0.95 + j * f.lh); });
    });
  }
  function paintSlide(ctx, W, H, s) {
    ctx.save(); ctx.textBaseline = 'alphabetic';
    if (s.kind === 'rings') paintRings(ctx, W, H, s);
    else if (s.kind === 'list') paintList(ctx, W, H, s);
    else if (s.kind === 'chips') paintChips(ctx, W, H, s);
    else if (s.kind === 'brand') paintBrand(ctx, W, H, s);
    else if (s.kind === 'feed') paintFeed(ctx, W, H, s);
    else paintCard(ctx, W, H, s);
    if (s.kind !== 'brand') sampleTag(ctx, W, H);
    ctx.restore();
  }

  /* ───────────────────────── slide decks from content ───────────────────────── */
  function chartSlide(c, i) {
    return { kind: 'card', accent: c.ink, bg: i % 2 ? 'dark' : 'vivid', glyph: c.glyph, kicker: c.zh + ' ' + c.name + ' · 今日 Anchor Chart',
      title: c.title || '（未命名卡片 Untitled card）', body: c.text, footer: c.mastered ? '✓ 已掌握 Mastered' : '今天的卡片 · Today\'s card' };
  }
  function chartEmpty(sub) {
    var S = SUBS[sub] || SUBS.other;
    return { kind: 'card', accent: S.color, bg: 'dark', glyph: S.glyph, kicker: S.zh + ' ' + S.en, title: '今天还没有选 Anchor Chart', body: 'No anchor chart picked today — choose one on the board in Spatial Home.' };
  }
  function themeIntro(t) {
    return { kind: 'card', accent: t.color, bg: 'vivid', glyph: t.glyph, kicker: '入口 Entrance', big: t.zh, title: t.en, footer: '走到门口进入 · Walk to the door to enter' };
  }
  function wordSlides() {
    var w = content.words;
    if (!w || !w.cur) {
      var out = [{ kind: 'card', accent: '#b48cff', bg: 'dark', glyph: '🔤', kicker: '今日单词 Today\'s Words', title: '今天还没有单词任务', body: 'No word list for today yet.' }];
      return out;
    }
    var foot = (w.left != null && w.total != null ? '剩余 ' + w.left + ' / ' + w.total + ' · ' : '') + '今天认识 ' + (w.knownToday || 0) + ' 个 Known today';
    var s = [{ kind: 'card', accent: '#b48cff', bg: 'light', kicker: '今日单词 Today\'s Words' + (w.list ? ' · ' + w.list : ''), big: w.cur, bigColor: '#1a1040', footer: foot }];
    if (w.next.length) s.push({ kind: 'chips', accent: '#b48cff', bg: 'dark', kicker: '接下来 Up next', chips: w.next });
    return s;
  }
  function progressSlide() {
    var p = content.progress, w = content.words;
    var items = [
      { label: 'Big 3 今日三件事', val: p.big3Done + '/' + p.big3Have, frac: p.big3Have ? p.big3Done / p.big3Have : 0, color: '#ffd54a' },
      { label: 'Anchor Charts', val: p.charts + '/' + p.chartsOf, frac: p.chartsOf ? p.charts / p.chartsOf : 0, color: '#3fa7ff' },
      { label: '单词 Words today', val: String(p.wordsToday), frac: w && w.total ? (w.total - (w.left || 0)) / w.total : (p.wordsToday ? 1 : 0), color: '#b48cff' }
    ];
    var ex = content.exam;
    return { kind: 'rings', accent: '#34d399', bg: 'dark', kicker: '学习进度 Progress · ' + content.date, items: items,
      footer: ex && ex.daysLeft != null ? '距考试 ' + ex.daysLeft + ' 天 · ' + (ex.daysLeft >= 0 ? 'days to exam' : 'exam passed') : '' };
  }
  function countdownSlide() {
    var ex = content.exam;
    if (!ex || ex.daysLeft == null) return { kind: 'card', accent: '#ff7a59', bg: 'dark', glyph: '⏳', kicker: '考试倒计时 Countdown', title: '还没有设置考试日期', body: 'No exam date set yet.' };
    return { kind: 'card', accent: '#ff7a59', bg: 'vivid', kicker: '距考试 Days to exam', big: String(ex.daysLeft) + ' 天', title: ex.name || '考试 Exam', footer: (ex.date ? ex.date + ' · ' : '') + '今天 ' + content.date };
  }
  function big3Slide() {
    var b = content.big3;
    if (!b.length) return { kind: 'card', accent: '#ffd54a', bg: 'dark', glyph: '✅', kicker: '今日三件事 Big Three', title: '今天还没有 Big Three', body: 'No Big Three tasks for today yet.' };
    return { kind: 'list', accent: '#ffd54a', bg: 'dark', kicker: '今日三件事 Big Three', footer: b.filter(function (x) { return x.done; }).length + ' / ' + b.length + ' 完成 done',
      items: b.map(function (x, i) { return { text: x.title || '（未填写 empty）', done: x.done, mark: String(i + 1), color: '#ffd54a' }; }) };
  }
  function worksSlides() {
    var w = content.works;
    if (!w.length) return [{ kind: 'card', accent: '#ffd54a', bg: 'dark', glyph: '🎨', kicker: '作品馆 Works & Collections', title: '还没有作品', body: 'No works yet — make one in Type Workshop.' }];
    var out = [];
    for (var i = 0; i < Math.min(w.length, 12); i += 4) out.push({ kind: 'list', accent: '#ffd54a', bg: 'dark', kicker: '作品馆 Works · ' + w.length + ' 件',
      items: w.slice(i, i + 4).map(function (x) { return { text: x.title, sub: x.kind, done: false, mark: '★', color: '#ffd54a' }; }) });
    out.unshift({ kind: 'card', accent: '#ffd54a', bg: 'vivid', glyph: '🎨', kicker: '作品馆 Workshop', big: w[0].title, footer: (w[0].kind ? w[0].kind + ' · ' : '') + '最新作品 Latest work' });
    return out;
  }
  function customSlides() {
    if (!content.custom.length) return [{ kind: 'card', accent: '#ff5df0', bg: 'dark', glyph: '💬', kicker: '留言 Messages', title: '还没有留言', body: 'No custom messages yet.' }];
    return content.custom.map(function (m, i) { return { kind: 'card', accent: ['#ff5df0', '#3fa7ff', '#34d399'][i % 3], bg: 'vivid', kicker: '💬 留言 Message', title: m }; });
  }
  function brandSlide() { return { kind: 'brand', accent: '#ff5df0', phase: R(), line: content ? '今日学习 Today\'s learning · ' + content.date : 'Today\'s learning, lit up' }; }
  function feedSlide() {
    var items = [];
    content.charts.forEach(function (c) { items.push({ accent: c.ink, kicker: c.glyph + ' ' + c.zh + ' Anchor Chart', title: c.title || '…' }); });
    if (content.words && content.words.cur) items.push({ accent: '#b48cff', kicker: '🔤 今日单词 Word', title: content.words.cur });
    content.big3.forEach(function (b) { items.push({ accent: '#ffd54a', kicker: (b.done ? '✓' : '○') + ' Big 3', title: b.title || '（未填写）' }); });
    content.works.slice(0, 3).forEach(function (w) { items.push({ accent: '#ffb347', kicker: '🎨 作品 Work', title: w.title }); });
    content.custom.slice(0, 2).forEach(function (m) { items.push({ accent: '#ff5df0', kicker: '💬 留言', title: m }); });
    if (content.exam && content.exam.daysLeft != null) items.push({ accent: '#ff7a59', kicker: '⏳ 距考试', title: content.exam.daysLeft + ' 天 days' });
    if (!items.length) items.push({ accent: '#7c6cff', kicker: 'MINEST', title: '今天还没有学习内容 · Nothing scheduled yet' });
    while (items.length < 4) items = items.concat(items);
    return { kind: 'feed', items: items.slice(0, 8) };
  }
  function deckFor(ch, sh) {
    if (!content) return [brandSlide()];
    var m, out;
    if ((m = /^sub:(\w+)$/.exec(ch))) {
      var th = THEMES.filter(function (t) { return t.sub === m[1]; })[0];
      out = content.charts.filter(function (c) { return c.sub === m[1]; }).map(chartSlide);
      if (!out.length) out = [chartEmpty(m[1])];
      if (th && sh && sh.themed) out.push(themeIntro(th));
      return out;
    }
    switch (ch) {
      case 'words': return wordSlides().concat(sh && sh.themed ? [themeIntro(THEMES[4])] : []);
      case 'works': return worksSlides().concat(customSlides().slice(0, 1));
      case 'progress': return [progressSlide(), countdownSlide(), big3Slide()];
      case 'countdown': return [countdownSlide(), progressSlide()];
      case 'big3': return [big3Slide(), progressSlide()];
      case 'custom': return customSlides().concat([brandSlide()]);
      case 'brand': return [brandSlide(), countdownSlide()];
      case 'feed': return [feedSlide()];
      default:
        out = content.charts.map(chartSlide);
        if (!out.length) out.push(chartEmpty('other'));
        out = out.concat(wordSlides().slice(0, 1), [progressSlide(), big3Slide(), countdownSlide()], worksSlides().slice(0, 1), customSlides().slice(0, 1), [brandSlide()]);
        return out;
    }
  }
  function tickerSegments(variant) {
    var Y = '#ffd54a', G = '#4dff9a', Rd = '#ff5b5b', W = '#f2f4ff', C = '#5fd4ff', out = [];
    function seg(t, c) { out.push({ t: t, c: c }); }
    seg('MINEST TICKER ▸', Y);
    if (!content) { seg('时代广场 · Times Square · 今日学习 Today\'s learning', W); return out; }
    if (content.isSample) seg('示例内容 SAMPLE', Y);
    if (variant === 0) {
      if (content.charts.length) content.charts.forEach(function (c) { seg(c.zh + ' ' + c.name.toUpperCase(), W); seg((c.mastered ? '▲ ' : '● ') + (c.title || '…'), c.mastered ? G : C); });
      else seg('今天还没有选 Anchor Chart · No anchor chart today', C);
      var p = content.progress; seg('BIG3 ' + p.big3Done + '/' + p.big3Have, W); seg(p.big3Have && p.big3Done >= p.big3Have ? '▲' : '▼', p.big3Have && p.big3Done >= p.big3Have ? G : Rd);
      seg('CHARTS ' + p.charts + '/' + p.chartsOf, W); seg(p.charts ? '▲' : '▼', p.charts ? G : Rd);
      if (content.words && content.words.cur) { seg('WORDS 今日单词', W); seg(content.words.cur + ' ▲' + (content.words.knownToday || 0), G); }
      else seg('今天还没有单词任务 · No words today', C);
      if (content.exam && content.exam.daysLeft != null) { seg('距考试 ' + content.exam.daysLeft + ' 天', Rd); seg((content.exam.name || 'EXAM') + ' ▼', W); }
    } else {
      seg(content.date, W);
      if (content.big3.length) content.big3.forEach(function (b) { seg((b.done ? '✓ ' : '○ ') + (b.title || '（未填写）'), b.done ? G : Y); });
      else seg('今天还没有 Big Three', C);
      if (content.words && content.words.next.length) { seg('UP NEXT 接下来', W); seg(content.words.next.join(' · '), C); }
      if (content.works.length) { seg('作品馆 WORKS', W); seg(content.works.slice(0, 5).map(function (w) { return w.title; }).join(' · '), Y); }
      else seg('作品馆 · 还没有作品 No works yet', C);
      content.custom.forEach(function (m) { seg('💬 ' + m, W); });
    }
    return out;
  }

  /* ───────────────────────── renderer, scene, sky ───────────────────────── */
  var canvas = document.getElementById('c');
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance', stencil: false });
  var MAXPR = Math.min(window.devicePixelRatio || 1, 2), pr = MAXPR;
  renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
  var ANISO = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  var FOGC = new T.Color('#2c2f5c');
  var scene = new T.Scene(); scene.background = FOGC.clone();
  scene.fog = new T.FogExp2(FOGC.getHex(), 0.0024);
  var camera = new T.PerspectiveCamera(66, innerWidth / innerHeight, 0.3, 2600);
  camera.rotation.order = 'YXZ';
  var FOGU = { fogColor: { value: FOGC }, fogDensity: { value: 0.0024 } };
  var TIME = { value: 0 };

  var sky = new T.Mesh(new T.SphereGeometry(2000, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { cHor: { value: new T.Color('#2c2f5c') }, cGlow: { value: new T.Color('#7a5a8e') }, cMid: { value: new T.Color('#24306e') }, cTop: { value: new T.Color('#070b26') } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cHor,cGlow,cMid,cTop; varying vec3 vD; void main(){ float y=vD.y; vec3 c=cHor;' +
      'c=mix(c,cGlow,smoothstep(0.0,0.06,y)); c=mix(c,cMid,smoothstep(0.05,0.28,y)); c=mix(c,cTop,smoothstep(0.25,0.85,y));' +
      'float h=fract(sin(dot(floor(vD*420.0),vec3(12.9898,78.233,37.719)))*43758.5453); c+=vec3(step(0.9985,h)*smoothstep(0.3,0.6,y)*0.6);' +
      'gl_FragColor=vec4(c,1.0); }'
  }));
  sky.renderOrder = -20; sky.frustumCulled = false; scene.add(sky);

  /* ───────────────────────── geometry buffer (vertex colours + uv, no normals: all unlit) ───────────────────────── */
  function GB() { this.p = []; this.c = []; this.uv = []; this.ix = []; this.n = 0; }
  GB.prototype.v = function (x, y, z, c, u, v) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); this.uv.push(u || 0, v || 0); return this.n++; };
  GB.prototype.q = function (a, b, c, d) { this.ix.push(a, b, c, a, c, d); };
  GB.prototype.geo = function () {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.ix); g.computeBoundingSphere(); return g;
  };
  /* vertical quad from L to Rt (Rt is to the right when seen from the front) */
  GB.prototype.wall = function (lx, lz, rx, rz, y0, y1, cb, ct, u0, u1, v0, v1) {
    var a = this.v(lx, y0, lz, cb, u0, v0), b = this.v(rx, y0, rz, cb, u1, v0), c = this.v(rx, y1, rz, ct, u1, v1), d = this.v(lx, y1, lz, ct, u0, v1);
    this.q(a, b, c, d);
  };
  /* horizontal quad facing up; pts given anticlockwise seen from above, i.e. (x0,z1),(x1,z1),(x1,z0),(x0,z0) */
  GB.prototype.flat = function (pts, y, c, uvScale) {
    var s = uvScale || 0, self = this, ids = pts.map(function (p) { return self.v(p[0], y, p[1], c, s ? p[0] / s : 0.5 / 32, s ? p[1] / s : 0.5 / 32); });
    for (var i = 1; i < ids.length - 1; i++) this.ix.push(ids[0], ids[i], ids[i + 1]);
  };
  GB.prototype.box = function (x0, x1, y0, y1, z0, z1, c, top, uvDark) {
    var u = uvDark ? 0.5 / 32 : 0, sh = [1, 0.8, 0.66, 0.88];
    var cs = sh.map(function (k) { return [c[0] * k, c[1] * k, c[2] * k]; });
    this.wall(x0, z1, x1, z1, y0, y1, cs[0], cs[0], u, u, u, u);
    this.wall(x1, z1, x1, z0, y0, y1, cs[1], cs[1], u, u, u, u);
    this.wall(x1, z0, x0, z0, y0, y1, cs[2], cs[2], u, u, u, u);
    this.wall(x0, z0, x0, z1, y0, y1, cs[3], cs[3], u, u, u, u);
    if (top !== false) this.flat([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], y1, top || c, 0);
  };
  /* oriented box: centre, unit right r (xz), normal n (xz), sizes */
  GB.prototype.obox = function (cx, cy, cz, rx, rz, w, h, d, c) {
    var nx = rz, nz = -rx;   // normal = right rotated: r = (n.z, -n.x)  ⇒ n = (-r.z, r.x)… keep consistent below
    nx = -rz; nz = rx;
    var hw = w / 2, hd = d / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    function P(sx, sd) { return [cx + rx * sx + nx * sd, cz + rz * sx + nz * sd]; }
    var fl = P(-hw, hd), fr = P(hw, hd), bl = P(-hw, -hd), br = P(hw, -hd);
    var k = [c, [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8], [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6]];
    this.wall(fl[0], fl[1], fr[0], fr[1], y0, y1, k[0], k[0]);
    this.wall(fr[0], fr[1], br[0], br[1], y0, y1, k[1], k[1]);
    this.wall(br[0], br[1], bl[0], bl[1], y0, y1, k[2], k[2]);
    this.wall(bl[0], bl[1], fl[0], fl[1], y0, y1, k[1], k[1]);
    this.flat([fl, fr, br, bl].map(function (p) { return p; }), y1, k[1]);
    this.flat([bl, br, fr, fl], y0, k[2]);
  };
  GB.prototype.prism = function (cx, cz, r0, r1, y0, y1, seg, cb, ct, cap, uvDark) {
    var u = uvDark ? 0.5 / 32 : 0;
    for (var i = 0; i < seg; i++) {
      var a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, k = 0.7 + 0.3 * Math.cos(a0 - 0.6);
      var b = [cb[0] * k, cb[1] * k, cb[2] * k], t = [ct[0] * k, ct[1] * k, ct[2] * k];
      var A = this.v(cx + Math.sin(a0) * r0, y0, cz + Math.cos(a0) * r0, b, u, u), B = this.v(cx + Math.sin(a1) * r0, y0, cz + Math.cos(a1) * r0, b, u, u);
      var C = this.v(cx + Math.sin(a1) * r1, y1, cz + Math.cos(a1) * r1, t, u, u), D = this.v(cx + Math.sin(a0) * r1, y1, cz + Math.cos(a0) * r1, t, u, u);
      this.q(A, B, C, D);
    }
    if (cap && r1 > 0) { var pts = []; for (var j = seg - 1; j >= 0; j--) { var a = j / seg * Math.PI * 2; pts.push([cx + Math.sin(a) * r1, cz + Math.cos(a) * r1]); } this.flat(pts.reverse(), y1, cap); }
  };

  /* ───────────────────────── procedural textures ───────────────────────── */
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function canvasTex(c, opt) {
    var t = new T.CanvasTexture(c); opt = opt || {};
    t.anisotropy = opt.aniso || ANISO; t.wrapS = opt.wrapS || T.ClampToEdgeWrapping; t.wrapT = opt.wrapT || T.ClampToEdgeWrapping;
    if (opt.nearest) t.magFilter = T.NearestFilter;
    if (opt.nomip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    return t;
  }
  var NC = 32, NR = 32, CW = 2.3, FH = 3.4;   // window cells per texture, metres per cell
  function windowTex(style) {
    var S = 1024, cell = S / NC, c = mkCanvas(S, S), x = c.getContext('2d'), r = rng(77 + style * 13);
    var face = ['#24212b', '#141a2b', '#1f1f27'][style];
    x.fillStyle = face; x.fillRect(0, 0, S, S);
    var warm = ['#ffd9a0', '#ffe8c4', '#ffc982', '#fff2dc', '#ffb870'], cool = ['#d6e6ff', '#e9f1ff', '#bfe0ff', '#fff6e6'];
    for (var j = 0; j < NR; j++) {
      var rowLit = r() < 0.2 ? 0.62 : r() < 0.5 ? 0.08 : 0.3;
      for (var i = 0; i < NC; i++) {
        var px = i * cell, py = j * cell;
        if (i === 0) { x.fillStyle = '#121218'; x.fillRect(px, py, cell, cell); continue; }
        var lit = r() < rowLit, palette = style === 1 ? cool : r() < 0.75 ? warm : cool;
        if (style === 0) {
          var g = x.createLinearGradient(0, py + cell * 0.2, 0, py + cell * 0.88);
          if (lit) { var cc = pick(palette); g.addColorStop(0, shadeHex(cc, 0.86)); g.addColorStop(1, shadeHex(cc, 0.58)); }
          else { g.addColorStop(0, '#2a3350'); g.addColorStop(1, '#0d1120'); }
          x.fillStyle = g; x.fillRect(px + cell * 0.2, py + cell * 0.18, cell * 0.6, cell * 0.66);
          x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px + cell * 0.48, py + cell * 0.18, cell * 0.04, cell * 0.66);
        } else if (style === 1) {
          var g2 = x.createLinearGradient(px, py, px + cell, py + cell);
          if (lit) { var c2 = pick(palette); g2.addColorStop(0, shadeHex(c2, 0.82)); g2.addColorStop(1, shadeHex(c2, 0.5)); }
          else { g2.addColorStop(0, '#2b3d66'); g2.addColorStop(0.5, '#16223f'); g2.addColorStop(1, '#0c1326'); }
          x.fillStyle = g2; x.fillRect(px + 1, py + cell * 0.12, cell - 2, cell * 0.84);
          x.fillStyle = '#0a0e18'; x.fillRect(px, py + cell * 0.1, 2, cell * 0.86);
        } else {
          for (var h = 0; h < 2; h++) {
            var l2 = r() < rowLit + 0.1;
            x.fillStyle = l2 ? pick(['#cdd6ec', '#e6d8b8', '#c4d2ee']) : '#1b2236';
            x.fillRect(px + cell * (0.08 + h * 0.48), py + cell * 0.26, cell * 0.38, cell * 0.56);
          }
        }
      }
    }
    var t = canvasTex(c, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
    return t;
  }
  function storefrontTex() {
    var c = mkCanvas(1024, 128), x = c.getContext('2d'), r = rng(9);
    x.fillStyle = '#16141c'; x.fillRect(0, 0, 1024, 128);
    var px = 0;
    while (px < 1024) {
      var w = Math.min(1024 - px, 40 + r() * 140), kind = r();
      if (kind < 0.72) {
        var hue = Math.floor(r() * 360), g = x.createLinearGradient(0, 30, 0, 128);
        g.addColorStop(0, 'hsl(' + hue + ',55%,78%)'); g.addColorStop(1, 'hsl(' + ((hue + 30) % 360) + ',45%,42%)');
        x.fillStyle = g; x.fillRect(px + 4, 34, w - 8, 94);
        x.fillStyle = 'hsl(' + hue + ',90%,' + (45 + r() * 20) + '%)'; x.fillRect(px + 2, 6, w - 4, 22);
        x.fillStyle = 'rgba(255,255,255,0.85)';
        for (var b = px + 8; b < px + w - 14; b += 9 + r() * 9) x.fillRect(b, 12, 5 + r() * 5, 10);   // abstract sign "lettering" (no real names)
        x.fillStyle = 'rgba(20,16,26,0.75)'; for (var m = px + 4 + 30; m < px + w - 8; m += 30) x.fillRect(m, 34, 3, 94);
      } else if (kind < 0.86) {
        x.fillStyle = '#2d2a36'; x.fillRect(px, 0, w, 128); x.fillStyle = '#ffdca0'; x.fillRect(px + w * 0.3, 54, w * 0.4, 74);
      } else { x.fillStyle = '#0e0d13'; x.fillRect(px, 0, w, 128); }
      x.fillStyle = '#0b0a10'; x.fillRect(px, 0, 4, 128);
      px += w;
    }
    return canvasTex(c, { wrapS: T.RepeatWrapping });
  }
  function noiseTex() {
    var c = mkCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(5);
    for (var i = 0; i < 256 * 256; i++) { var v = 200 + r() * 55; if (r() < 0.02) v = 255; d.data[i * 4] = v; d.data[i * 4 + 1] = v; d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
    return canvasTex(c, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
  }
  function glowTex(kind) {
    var c = mkCanvas(128, 128), x = c.getContext('2d');
    if (kind === 'halo') {           // soft rounded-rect glow, the screen sits in the middle
      var hd = x.createImageData(128, 128);
      for (var hj = 0; hj < 128; hj++) for (var hi = 0; hi < 128; hi++) {
        var ex = Math.max(0, Math.abs(hi - 63.5) - 30) / 34, ey = Math.max(0, Math.abs(hj - 63.5) - 30) / 34, dd = Math.min(1, Math.hypot(ex, ey)), ho = (hj * 128 + hi) * 4;
        hd.data[ho] = hd.data[ho + 1] = hd.data[ho + 2] = 255; hd.data[ho + 3] = Math.round(255 * Math.pow(1 - dd, 2.2));
      }
      x.putImageData(hd, 0, 0);
    } else if (kind === 'pool') {
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    } else if (kind === 'ring') {
      var g3 = x.createRadialGradient(64, 64, 20, 64, 64, 64); g3.addColorStop(0, 'rgba(255,255,255,0)'); g3.addColorStop(0.62, 'rgba(255,255,255,1)'); g3.addColorStop(0.75, 'rgba(255,255,255,0.35)'); g3.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g3; x.fillRect(0, 0, 128, 128);
    } else {                          // wet-street streak: bright at the base (v=0), fading towards the viewer
      var d = x.createImageData(128, 128), r = rng(3);
      for (var j = 0; j < 128; j++) for (var i = 0; i < 128; i++) {
        var u = (i - 63.5) / 64, v = j / 127, a = Math.exp(-u * u * 5) * Math.pow(1 - v, 1.6) * (0.75 + 0.25 * Math.sin(j * 0.9 + r() * 2)), o = (j * 128 + i) * 4;
        d.data[o] = d.data[o + 1] = d.data[o + 2] = 255; d.data[o + 3] = clamp(a * 255, 0, 255);
      }
      x.putImageData(d, 0, 0);
    }
    return canvasTex(c, { aniso: 1 });
  }

  /* ───────────────────────── materials ───────────────────────── */
  var WIN = [windowTex(0), windowTex(1), windowTex(2)];
  var matBld = WIN.map(function (t) { return new T.MeshBasicMaterial({ map: t, vertexColors: true }); });
  var matStore = new T.MeshBasicMaterial({ map: storefrontTex(), vertexColors: true });
  var matMisc = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide });
  var matGround = new T.MeshBasicMaterial({ map: noiseTex(), vertexColors: true, side: T.DoubleSide, depthFunc: T.AlwaysDepth });
  function addMat(tex) { return new T.MeshBasicMaterial({ map: tex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false, vertexColors: false, toneMapped: false }); }
  var texHalo = glowTex('halo'), texPool = glowTex('pool'), texStreak = glowTex('streak'), texRing = glowTex('ring');

  /* ───────────────────────── road geometry helpers ───────────────────────── */
  function bwX(z) { return SLOPE * z; }
  function inBowtie(z) { return z > -160 && z < 160; }
  function inSquare(x, z) {
    if (z < -265 || z > 265) return false;
    if (Math.abs(x) < AVE_HW + AVE_SW + 1.5) return true;
    if (Math.abs(x - bwX(z)) < BWX + 7) return true;
    if (inBowtie(z) && x > Math.min(-14, bwX(z) - 10) && x < Math.max(14, bwX(z) + 10)) return true;
    return false;
  }
  function onCrossNear(x, z) {
    for (var i = 0; i < STREETS.length; i++) { var zs = STREETS[i]; if (zs < -250 || zs > 250) continue; if (Math.abs(z - zs) < streetHW(zs) + ST_SW + 1 && Math.abs(x - bwX(z) * 0.5) < 80) return true; }
    return false;
  }

  /* ───────────────────────── ground (one draw call; layers painted in order with depthFunc=Always) ───────────────────────── */
  var ground = new GB();
  (function buildGround() {
    var SW = [0.36, 0.35, 0.4], PLZ = [0.42, 0.25, 0.28], ASP = [0.11, 0.115, 0.145], CURB = [0.52, 0.52, 0.56], WHITE = [0.75, 0.75, 0.78], YEL = [0.75, 0.6, 0.2];
    var E = 1400, U = 7;
    function rect(x0, x1, z0, z1, c) { ground.flat([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], 0, c, U); }
    function bwPoly(za, zb, hw, c) { ground.flat([[bwX(zb) - hw, zb], [bwX(zb) + hw, zb], [bwX(za) + hw, za], [bwX(za) - hw, za]], 0, c, U); }
    rect(-E, E, -E, E, SW);                                                   // sidewalks / everything
    bwPoly(-152, 230, BWX + 2, PLZ);                                          // pedestrian Broadway (42nd–47th)
    ground.flat([[9, 152], [bwX(152) + BWX + 2, 152], [bwX(0) + BWX, 0], [9, 0]], 0, PLZ, U);
    ground.flat([[-9, 0], [bwX(0) - BWX, 0], [bwX(-152) - BWX - 2, -152], [-9, -152]], 0, PLZ, U);
    // curbs (light lines along the road edges)
    for (var i = 0; i < STREETS.length - 1; i++) {
      var za = STREETS[i + 1] + streetHW(STREETS[i + 1]), zb = STREETS[i] - streetHW(STREETS[i]);
      rect(-AVE_HW - 0.35, -AVE_HW, za, zb, CURB); rect(AVE_HW, AVE_HW + 0.35, za, zb, CURB);
    }
    STREETS.forEach(function (z) { var h = streetHW(z); rect(-E, E, z - h - 0.35, z - h, CURB); rect(-E, E, z + h, z + h + 0.35, CURB); });
    bwPoly(-E, -152, 8, ASP); bwPoly(230, E, 8, ASP);                         // Broadway as a road outside the bowtie
    rect(-AVE_HW, AVE_HW, -E, E, ASP);                                        // 7th Avenue
    STREETS.forEach(function (z) { var h = streetHW(z); rect(-E, E, z - h, z + h, ASP); });
    // lane dashes on 7th Ave
    [-4.5, 0, 4.5].forEach(function (lx) {
      for (var zz = -E; zz < E; zz += 9) {
        var mid = zz + 1.5, inX = STREETS.some(function (s) { return Math.abs(mid - s) < streetHW(s) + 4; });
        if (!inX) rect(lx - 0.07, lx + 0.07, zz, zz + 3, lx === 0 ? YEL : WHITE);
      }
    });
    // crosswalks at every 7th Ave intersection + stop bars
    STREETS.forEach(function (z) {
      var h = streetHW(z);
      [-1, 1].forEach(function (sd) {
        var zc = z + sd * (h + 2.2);
        for (var x = -AVE_HW + 0.4; x < AVE_HW; x += 1.2) rect(x, x + 0.6, zc - 1.6, zc + 1.6, WHITE);
        rect(-AVE_HW, AVE_HW, z + sd * (h + 4.4) - 0.2, z + sd * (h + 4.4) + 0.2, WHITE);
        var xc = sd * (AVE_HW + 2.2);
        for (var zz2 = z - h + 0.4; zz2 < z + h; zz2 += 1.2) rect(xc - 1.6, xc + 1.6, zz2, zz2 + 0.6, WHITE);
      });
      [-1, 1].forEach(function (sd) {                                        // dashed centre line on the cross street
        for (var xx = AVE_HW + 6; xx < 320; xx += 10) rect(sd > 0 ? xx : -xx - 3, sd > 0 ? xx + 3 : -xx, z - 0.08, z + 0.08, WHITE);
      });
    });
  })();
  var groundMesh = new T.Mesh(ground.geo(), matGround); groundMesh.renderOrder = -10; groundMesh.frustumCulled = false; scene.add(groundMesh);

  /* ───────────────────────── lots & buildings ───────────────────────── */
  var buildings = [], colliders = [];
  function forbidden(za, zb) {
    var out = [[-AVE_HW - AVE_SW, AVE_HW + AVE_SW]];
    var ped = zb > -185 && za < 250, sw = ped ? 1.5 : BW_SW;
    var lo = bwX(za) - BWX - sw, hi = bwX(zb) + BWX + sw;
    out.push([lo, hi]);
    if (zb > -160 && za < 160) out.push([Math.min(lo, -14), Math.max(hi, 14)]);
    return out;
  }
  function freeIntervals(za, zb) {
    var fb = forbidden(za, zb).sort(function (a, b) { return a[0] - b[0]; }), out = [], x = -XMAX;
    fb.forEach(function (f) { if (f[0] > x) out.push([x, f[0]]); x = Math.max(x, f[1]); });
    if (x < XMAX) out.push([x, XMAX]);
    return out;
  }
  function sqDist(cx, cz) { return Math.min(Math.abs(cx), Math.abs(cx - bwX(cz)) / 1.03) + Math.max(0, Math.abs(cz) - 170) * 0.8; }
  for (var bi = 0; bi < STREETS.length - 1; bi++) {
    var zN = STREETS[bi + 1], zS = STREETS[bi];
    var za0 = zN + streetHW(zN) + ST_SW, zb0 = zS - streetHW(zS) - ST_SW;
    var rows = R() < 0.72 || Math.abs(zN + 40) < 180 ? [[za0, (za0 + zb0) / 2 + rand(-3, 3)], [0, zb0]] : [[za0, zb0]];
    if (rows.length === 2) rows[1][0] = rows[0][1];
    rows.forEach(function (row) {
      freeIntervals(row[0], row[1]).forEach(function (iv) {
        var a = iv[0], b = iv[1];
        if (b - a < 8) return;
        var cuts = [a];
        while (b - cuts[cuts.length - 1] > 0) {
          var x0 = cuts[cuts.length - 1], w = rand(13, 32);
          if (b - x0 - w < 10) w = b - x0;
          cuts.push(x0 + w);
        }
        for (var i = 0; i < cuts.length - 1; i++) {
          var lot = { x0: cuts[i] + 0.2, x1: cuts[i + 1] - 0.2, z0: row[0] + 0.2, z1: row[1] - 0.2 };
          if (lot.x1 - lot.x0 < 6) continue;
          buildings.push(lot);
        }
      });
    });
  }
  buildings.forEach(function (b) {
    var cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, ds = sqDist(cx, cz);
    b.cx = cx; b.cz = cz; b.ds = ds; b.core = ds < 75 && Math.abs(cz) < 290;
    if (b.core) b.h = R() < 0.15 ? rand(200, 250) : rand(60, 190);
    else { b.h = rand(28, 150) * (1 - Math.min(ds, 330) / 560) + (R() < 0.09 ? rand(90, 190) : 0); b.h = Math.max(b.h, 22); }
    if (b.x0 >= 12 && b.x1 <= 40 && b.z0 >= 165 && b.z1 <= 205) { b.special = 'south'; b.h = 118; }
    if (b.x0 >= -40 && b.x1 <= -12 && b.z0 >= -205 && b.z1 <= -165) { b.special = 'north'; b.h = 150; }
    b.style = b.special ? 2 : (R() < 0.38 ? 1 : R() < 0.55 ? 0 : 2);
    var fac = pick([[0.95, 0.9, 1.0], [1.05, 0.97, 0.9], [0.85, 0.9, 1.05], [1.0, 1.0, 1.0], [1.1, 0.95, 0.85]]);
    b.tint = fac; b.uo = Math.floor(R() * 32) * CW; b.vo = Math.floor(R() * 32) * FH;
    // tiers (setbacks)
    var H = b.h, tiers = [], h1 = H;
    if (H > 60 && !b.special) h1 = H * rand(0.32, 0.62);
    if (b.core) h1 = Math.max(h1, Math.min(H, rand(48, 70)));
    if (b.special === 'south') h1 = 104; if (b.special === 'north') h1 = 96;
    tiers.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, y0: 0, y1: h1 });
    var t = tiers[0];
    while (t.y1 < H - 1 && tiers.length < 4) {
      var ins = rand(1.5, 4.5), n = { x0: t.x0 + ins * (R() < 0.8 ? 1 : 0), x1: t.x1 - ins, z0: t.z0 + ins, z1: t.z1 - ins * (R() < 0.8 ? 1 : 0), y0: t.y1 };
      if (n.x1 - n.x0 < 5 || n.z1 - n.z0 < 5) { t.y1 = H; break; }
      n.y1 = tiers.length === 3 || H - t.y1 < 25 ? H : t.y1 + (H - t.y1) * rand(0.45, 0.8);
      tiers.push(n); t = n;
    }
    b.tiers = tiers; b.h1 = h1;
    colliders.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 });
  });

  var bldBufs = [new GB(), new GB(), new GB()], store = new GB(), misc = new GB();
  var GLOWTINT = [0.26, 0.12, 0.32];
  buildings.forEach(function (b) {
    var buf = bldBufs[b.style], base = b.tint, shade = [1.0, 0.8, 0.68, 0.9];
    var lum = rand(0.85, 1.12);
    b.tiers.forEach(function (t) {
      var faces = [[t.x0, t.z1, t.x1, t.z1], [t.x1, t.z1, t.x1, t.z0], [t.x1, t.z0, t.x0, t.z0], [t.x0, t.z0, t.x0, t.z1]];
      faces.forEach(function (f, i) {
        var w = Math.hypot(f[2] - f[0], f[3] - f[1]), uo = b.uo + i * 11 * CW;
        function cAt(y) {
          var g = b.ds < 120 ? Math.exp(-y / 45) * (1 - b.ds / 120) : 0, k = shade[i] * lum * (1 - 0.15 * Math.min(1, y / 220));
          return [base[0] * k + GLOWTINT[0] * g, base[1] * k + GLOWTINT[1] * g, base[2] * k + GLOWTINT[2] * g];
        }
        buf.wall(f[0], f[1], f[2], f[3], t.y0, t.y1, cAt(t.y0), cAt(t.y1), uo / (CW * NC), (uo + w) / (CW * NC), (t.y0 + b.vo) / (FH * NR), (t.y1 + b.vo) / (FH * NR));
      });
      buf.flat([[t.x0, t.z1], [t.x1, t.z1], [t.x1, t.z0], [t.x0, t.z0]], t.y1, [0.75, 0.75, 0.8], 0);
      // parapet
      buf.box(t.x0, t.x1, t.y1, t.y1 + 1.1, t.z0, t.z0 + 0.4, [0.6, 0.6, 0.65], null, true);
    });
    var top = b.tiers[b.tiers.length - 1], far = b.ds > 260;
    if (!far) {
      var nTank = R() < 0.55 ? 1 : 0, tw = top.x1 - top.x0, td = top.z1 - top.z0;
      for (var q = 0; q < nTank; q++) {
        var tx = top.x0 + 3 + R() * Math.max(0, tw - 6), tz = top.z0 + 3 + R() * Math.max(0, td - 6);
        buf.prism(tx, tz, 2.2, 2.2, b.h + 2, b.h + 6, 8, [0.95, 0.75, 0.6], [0.95, 0.75, 0.6], null, true);
        buf.prism(tx, tz, 2.4, 0.2, b.h + 6, b.h + 7.4, 8, [0.8, 0.7, 0.6], [0.8, 0.7, 0.6], null, true);
        buf.box(tx - 1.6, tx + 1.6, b.h, b.h + 2, tz - 1.6, tz + 1.6, [0.5, 0.5, 0.5], null, true);
      }
      var nm = (R() * 3) | 0;
      for (var m = 0; m < nm; m++) {
        var mw = rand(3, Math.min(9, tw * 0.5)), md = rand(3, Math.min(9, td * 0.5)), mx = top.x0 + R() * (tw - mw), mz = top.z0 + R() * (td - md);
        buf.box(mx, mx + mw, b.h, b.h + rand(2, 5), mz, mz + md, [0.7, 0.7, 0.75], null, true);
      }
      if (b.h > 150 && R() < 0.5) {
        var ah = rand(15, 40); buf.box(top.x0 + tw / 2 - 0.4, top.x0 + tw / 2 + 0.4, b.h, b.h + ah, top.z0 + td / 2 - 0.4, top.z0 + td / 2 + 0.4, [0.6, 0.6, 0.7], null, true);
        misc.box(top.x0 + tw / 2 - 0.7, top.x0 + tw / 2 + 0.7, b.h + ah, b.h + ah + 1.4, top.z0 + td / 2 - 0.7, top.z0 + td / 2 + 0.7, [1, 0.15, 0.1]);
      }
      if (b.h > 110 && R() < 0.35) {      // crown light band
        var cc = col3(pick(['#7fe6ff', '#ffffff', '#ff6fd8', '#ffc76a', '#8a7dff']), 0.95);
        b.crown = cc;
        misc.box(top.x0 - 0.15, top.x1 + 0.15, top.y1 - 3, top.y1 - 1, top.z0 - 0.15, top.z1 + 0.15, cc);
      }
    }
    // storefront band (ground floor) on all four sides
    if (b.ds < 300) {
      var t0 = b.tiers[0], f4 = [[t0.x0, t0.z1 + 0.06, t0.x1, t0.z1 + 0.06], [t0.x1 + 0.06, t0.z1, t0.x1 + 0.06, t0.z0], [t0.x1, t0.z0 - 0.06, t0.x0, t0.z0 - 0.06], [t0.x0 - 0.06, t0.z0, t0.x0 - 0.06, t0.z1]];
      var su = R() * 25;
      f4.forEach(function (f) {
        var w = Math.hypot(f[2] - f[0], f[3] - f[1]);
        store.wall(f[0], f[1], f[2], f[3], 0, 4.6, [1, 1, 1], [0.9, 0.9, 0.95], su / 40, (su + w) / 40, 0, 1); su += w;
      });
      store.wall(t0.x0 - 0.06, t0.z1 + 0.06, t0.x1 + 0.06, t0.z1 + 0.06, 4.6, 5.2, [0.12, 0.12, 0.14], [0.12, 0.12, 0.14], 0.5 / 1024 * 40 / 40, 0.5 / 1024, 0.6, 0.6);
    }
  });

  /* ───────────────────────── facades facing the square, themes, screens ───────────────────────── */
  function facesOf(b) {
    var t = b.tiers[0];
    return [
      { side: 0, Lx: t.x0, Lz: t.z1, rx: 1, rz: 0, nx: 0, nz: 1, W: t.x1 - t.x0 },
      { side: 1, Lx: t.x1, Lz: t.z1, rx: 0, rz: -1, nx: 1, nz: 0, W: t.z1 - t.z0 },
      { side: 2, Lx: t.x1, Lz: t.z0, rx: -1, rz: 0, nx: 0, nz: -1, W: t.x1 - t.x0 },
      { side: 3, Lx: t.x0, Lz: t.z0, rx: 0, rz: 1, nx: -1, nz: 0, W: t.z1 - t.z0 }
    ].map(function (f) {
      f.b = b; f.h1 = t.y1;
      f.cx = f.Lx + f.rx * f.W / 2; f.cz = f.Lz + f.rz * f.W / 2;
      var px = f.cx + f.nx * 9, pz = f.cz + f.nz * 9;
      f.main = inSquare(px, pz); f.cross = !f.main && onCrossNear(px, pz);
      f.d = Math.hypot(f.cx - 6, f.cz - 10);
      return f;
    });
  }
  buildings.forEach(function (b) { if (b.ds < 140 && Math.abs(b.cz) < 300) b.faces = facesOf(b); });
  var allFaces = [];
  buildings.forEach(function (b) { if (b.faces) b.faces.forEach(function (f) { if (f.main || f.cross) allFaces.push(f); }); });
  allFaces.sort(function (a, b) { return (a.d + (a.main ? 0 : 60)) - (b.d + (b.main ? 0 : 60)); });

  // choose the six themed buildings: big main facades near the bowtie, spread apart
  var themeB = [];
  (function () {
    var cands = allFaces.filter(function (f) { return f.main && !f.b.special && f.W >= 14 && Math.abs(f.cz) < 200 && f.h1 >= 40 && f.d < 220; });
    var chosen = [];
    for (var i = 0; i < cands.length && chosen.length < 6; i++) {
      var f = cands[i], dx = f.cx + f.nx * 3, dz = f.cz + f.nz * 3;
      if (chosen.some(function (c) { return c.b === f.b || Math.hypot(c.dx - dx, c.dz - dz) < 48; })) continue;
      f.dx = dx; f.dz = dz; chosen.push(f);
    }
    chosen.forEach(function (f, i) { var th = THEMES[i]; f.theme = th; f.b.theme = th; th.face = f; themeB.push(f); });
  })();

  /* screens */
  var SCREEN_VS = 'varying vec2 vUv; varying float vDepth; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }';
  var SCREEN_FS = [
    'uniform sampler2D map0; uniform sampler2D map1; uniform float mixv; uniform float mode; uniform float scroll; uniform float bright;',
    'uniform vec3 fogColor; uniform float fogDensity; varying vec2 vUv; varying float vDepth;',
    'void main(){',
    '  vec2 uv=vUv; if(mode>1.5){ uv.y=uv.y*0.25+scroll; }',
    '  vec3 col;',
    '  if(mode>0.5 && mode<1.5){ vec2 ua=vec2(uv.x+mixv,uv.y); vec2 ub=vec2(uv.x+mixv-1.0,uv.y); vec3 a=texture2D(map0,ua).rgb; vec3 b=texture2D(map1,ub).rgb; col=mix(b,a,step(ua.x,1.0)); }',
    '  else { col=mix(texture2D(map0,uv).rgb, texture2D(map1,uv).rgb, mixv); }',
    '  col*=bright;',
    '  float f=1.0-exp(-fogDensity*fogDensity*vDepth*vDepth*0.4);',
    '  gl_FragColor=vec4(mix(col,fogColor,f),1.0);',
    '}'].join('\n');
  var unitPlane = new T.PlaneGeometry(1, 1);
  var screens = [], MAX_SCREENS = 60;
  var haloList = [], poolList = [], streakSrc = [];

  function makeScreen(o) {
    // o: {mesh geometry or flat (pos,n,w,h)}, channel, w, h (h = height, w = texture width in metres)
    var scrollMode = o.channel === 'feed', aspect = o.w / o.h;
    var cw = pot(clamp(o.w * 20, 128, 1024)), ch = pot(clamp(o.h * 20 * (scrollMode ? 4 : 1), 128, scrollMode ? 2048 : 1024));
    var vw, vh;
    if (aspect >= 1) { vw = 1000; vh = 1000 / aspect; } else { vh = 1000; vw = 1000 * aspect; }
    if (scrollMode) vh *= 4;
    var cv = [mkCanvas(cw, ch), mkCanvas(cw, ch)];
    var tx = cv.map(function (c) { return canvasTex(c, { wrapT: scrollMode ? T.RepeatWrapping : T.ClampToEdgeWrapping }); });
    var mat = new T.ShaderMaterial({
      uniforms: { map0: { value: tx[0] }, map1: { value: tx[1] }, mixv: { value: 0 }, mode: { value: scrollMode ? 2 : (R() < 0.4 ? 1 : 0) }, scroll: { value: R() },
        bright: { value: rand(1.0, 1.12) }, fogColor: FOGU.fogColor, fogDensity: FOGU.fogDensity },
      vertexShader: SCREEN_VS, fragmentShader: SCREEN_FS
    });
    var mesh = new T.Mesh(o.geo || unitPlane, mat);
    if (!o.geo) { mesh.position.set(o.x, o.y, o.z); mesh.rotation.y = Math.atan2(o.nx, o.nz); mesh.scale.set(o.w, o.h, 1); }
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    scene.add(mesh);
    var s = { mesh: mesh, mat: mat, cv: cv, tx: tx, cur: 0, vw: vw, vh: vh, channel: o.channel, deck: null, idx: (R() * 6) | 0, next: 0, trans: -1, big: o.w * o.h > 250,
      x: o.x, y: o.y, z: o.z, nx: o.nx, nz: o.nz, w: o.w, h: o.h, accent: '#7c6cff', halo: -1, pool: -1, scroll: scrollMode, speed: rand(0.012, 0.022), themed: !!o.themed };
    screens.push(s);
    if (!o.geo) {
      s.halo = haloList.length; haloList.push({ x: o.x - o.nx * 0.22, y: o.y, z: o.z - o.nz * 0.22, ry: mesh.rotation.y, w: o.w + 3 + Math.min(o.w, o.h) * 0.7, h: o.h + 3 + Math.min(o.w, o.h) * 0.7, s: s });
      misc.obox(o.x - o.nx * 0.18, o.y, o.z - o.nz * 0.18, o.nz, -o.nx, o.w + 0.6, o.h + 0.6, 0.3, [0.05, 0.05, 0.07]);
    }
    if (o.w * o.h > 120 && o.y - o.h / 2 < 40) {
      var gx = (o.gx != null ? o.gx : o.x + o.nx * 3), gz = (o.gz != null ? o.gz : o.z + o.nz * 3);
      s.pool = poolList.length; poolList.push({ x: gx + o.nx * 4, z: gz + o.nz * 4, r: Math.min(26, o.w * 0.9), s: s });
      streakSrc.push({ x: gx, z: gz, w: Math.min(o.w * 0.55, 14), s: s, area: o.w * o.h });
    }
    return s;
  }
  function flatOnFace(f, sCenter, yC, w, h, channel) {
    return makeScreen({ x: f.Lx + f.rx * sCenter + f.nx * 0.42, y: yC, z: f.Lz + f.rz * sCenter + f.nz * 0.42, nx: f.nx, nz: f.nz, w: w, h: h, channel: channel });
  }
  function angledOnFace(f, sCenter, yC, w, h, channel) {
    var tx = 6 - (f.Lx + f.rx * sCenter), tz = 10 - (f.Lz + f.rz * sCenter), tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    var best = null;
    [-0.42, 0.42].forEach(function (phi) {
      var nx = f.nx * Math.cos(phi) + f.nz * Math.sin(phi), nz = -f.nx * Math.sin(phi) + f.nz * Math.cos(phi), sc = nx * tx + nz * tz;
      if (!best || sc > best.sc) best = { nx: nx, nz: nz, sc: sc, phi: phi };
    });
    var rx = best.nz, rz = -best.nx, kk = rx * f.nx + rz * f.nz, proj = w * Math.cos(best.phi);
    var hx, hz, cx, cz;
    if (kk > 0) { hx = f.Lx + f.rx * (sCenter - proj / 2) + f.nx * 0.5; hz = f.Lz + f.rz * (sCenter - proj / 2) + f.nz * 0.5; cx = hx + rx * w / 2; cz = hz + rz * w / 2; }
    else { hx = f.Lx + f.rx * (sCenter + proj / 2) + f.nx * 0.5; hz = f.Lz + f.rz * (sCenter + proj / 2) + f.nz * 0.5; cx = hx - rx * w / 2; cz = hz - rz * w / 2; }
    misc.obox(hx, yC, hz, f.rx, f.rz, 0.8, h * 0.9, 1.2, [0.08, 0.08, 0.1]);       // bracket at the hinge
    return makeScreen({ x: cx, y: yC, z: cz, nx: best.nx, nz: best.nz, w: w, h: h, channel: channel, gx: f.cx + f.nx * 3, gz: f.cz + f.nz * 3 });
  }
  function wrapScreen(A, B, a, b, y0, y1, channel) {
    var Rr = 6, d = 2.1, N = 10;
    var Cx = A.Lx + A.rx * A.W, Cz = A.Lz + A.rz * A.W;
    var ccx = Cx - (Rr - d) * (A.nx + B.nx), ccz = Cz - (Rr - d) * (A.nz + B.nz);
    function path(Rad) {
      var pts = [[ccx + Rad * A.nx - a * B.nx, ccz + Rad * A.nz - a * B.nz]];
      for (var i = 0; i <= N; i++) { var th = i / N * Math.PI / 2, dx = A.nx * Math.cos(th) + B.nx * Math.sin(th), dz = A.nz * Math.cos(th) + B.nz * Math.sin(th); pts.push([ccx + Rad * dx, ccz + Rad * dz]); }
      pts.push([ccx + Rad * B.nx - b * A.nx, ccz + Rad * B.nz - b * A.nz]);
      return pts;
    }
    var pts = path(Rr), len = [0];
    for (var i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var tot = len[len.length - 1], g = new GB(), one = [1, 1, 1];
    for (var j = 0; j < pts.length - 1; j++) g.wall(pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], y0, y1, one, one, len[j] / tot, len[j + 1] / tot, 0, 1);
    var bk = path(Rr - 0.3), dark = [0.05, 0.05, 0.07];
    for (var k = 0; k < bk.length - 1; k++) misc.wall(bk[k][0], bk[k][1], bk[k + 1][0], bk[k + 1][1], y0 - 0.4, y1 + 0.4, dark, dark);
    [y0 - 0.4, y1 + 0.4].forEach(function (yy) {      // caps from the wall corner out to the screen
      var inner = [Cx - (A.nx + B.nx) * 0.5, Cz - (A.nz + B.nz) * 0.5];
      for (var q = 0; q < bk.length - 1; q++) { var i0 = misc.v(inner[0], yy, inner[1], dark), i1 = misc.v(bk[q][0], yy, bk[q][1], dark), i2 = misc.v(bk[q + 1][0], yy, bk[q + 1][1], dark); misc.ix.push(i0, i1, i2); }
    });
    var mid = pts[(pts.length / 2) | 0];
    return makeScreen({ geo: g.geo(), x: mid[0], y: (y0 + y1) / 2, z: mid[1], nx: (A.nx + B.nx) * 0.7, nz: (A.nz + B.nz) * 0.7, w: tot, h: y1 - y0, channel: channel, gx: Cx + (A.nx + B.nx) * 3, gz: Cz + (A.nz + B.nz) * 3 });
  }

  var GENERAL = ['mix', 'mix', 'mix', 'progress', 'words', 'countdown', 'big3', 'mix', 'works', 'custom', 'mix', 'feed'];
  var gi = 0;
  function nextChannel(f, big) {
    if (f.theme) return f.theme.sub ? 'sub:' + f.theme.sub : f.theme.id;
    if (f.b.theme) return f.b.theme.sub ? 'sub:' + f.b.theme.sub : f.b.theme.id;
    var c = GENERAL[gi++ % GENERAL.length];
    if (c === 'feed' && big) c = 'mix';
    return c;
  }
  function layoutFace(f, y0, yMax, pattern) {
    var W = f.W, m = 1.2, uw = W - 2 * m, out = [], y = y0;
    if (uw < 5 || yMax - y < 6) return y;
    function add(s, yc, w, h, ang) {
      if (screens.length >= MAX_SCREENS) return;
      var big = w * h > 250, ch = nextChannel(f, big);
      if (ch === 'feed' && w > h) ch = 'mix';
      var sc = ang ? angledOnFace(f, s, yc, w, h, ch) : flatOnFace(f, s, yc, w, h, ch);
      if (f.b.theme && sc) { sc.themed = true; }
    }
    pattern = pattern || (uw < 10 ? pick(['stack', 'single']) : pick(['single', 'single', 'stack', 'grid', 'tower', 'angled', 'stack']));
    if (pattern === 'single') {
      var w = uw * rand(0.82, 1), h = clamp(w * rand(0.42, 1.5), 7, yMax - y); if (h > w * 2) h = w * 2;
      add(m + (uw - w) * R() + w / 2, y + h / 2, w, h); y += h + 1.8;
      if (yMax - y > 8 && R() < 0.65) { var h2 = Math.min(yMax - y, rand(6, 14)), w2 = uw * rand(0.5, 0.9); add(m + w2 / 2 + R() * (uw - w2), y + h2 / 2, w2, h2); y += h2 + 1.8; }
    } else if (pattern === 'stack') {
      var cnt = 0;
      while (yMax - y > 5 && cnt < 5) { var hs = Math.min(rand(5, 13), yMax - y), ws = uw * rand(0.72, 1), al = pick([0, 0.5, 1]); add(m + ws / 2 + (uw - ws) * al, y + hs / 2, ws, hs); y += hs + 1.3; cnt++; }
    } else if (pattern === 'grid') {
      var cols = uw > 22 ? 3 : 2, rowsN = 2 + (R() < 0.4 ? 1 : 0), cwid = (uw - (cols - 1)) / cols, chh = Math.min(cwid * rand(0.55, 0.8), (yMax - y) / rowsN - 1);
      if (chh > 2.5) { for (var rI = 0; rI < rowsN; rI++) for (var cI = 0; cI < cols; cI++) add(m + cI * (cwid + 1) + cwid / 2, y + rI * (chh + 1) + chh / 2, cwid, chh); y += rowsN * (chh + 1) + 1; }
      if (yMax - y > 10) { var hb = Math.min(yMax - y, uw * rand(0.4, 0.6)); add(W / 2, y + hb / 2, uw * 0.95, hb); y += hb + 1.8; }
    } else if (pattern === 'tower') {
      var wt = Math.min(uw * rand(0.35, 0.55), 18), ht = Math.min(wt * rand(1.6, 2.6), yMax - y), left = R() < 0.5;
      add(left ? m + wt / 2 : W - m - wt / 2, y + ht / 2, wt, ht);
      var wr = uw - wt - 1.2;
      if (wr > 6) { var hr = Math.min(ht * 0.55, wr * 0.6); add(left ? W - m - wr / 2 : m + wr / 2, y + hr / 2, wr, hr); }
      y += ht + 1.8;
    } else if (pattern === 'angled') {
      var wa = Math.min(uw * 0.7, 22), ha = wa * rand(0.45, 0.62);
      if (yMax - y > ha + 2) { add(W / 2, y + 1.5 + ha / 2, wa, ha, true); y += ha + 4; }
      if (yMax - y > 8) { var h3 = Math.min(yMax - y, uw * rand(0.4, 0.8)); add(W / 2, y + h3 / 2, uw * 0.9, h3); y += h3 + 1.8; }
    }
    return y;
  }

  /* tickers */
  var TICK_FS = [
    'uniform sampler2D map; uniform float off; uniform float rep; uniform vec2 tsz; uniform vec3 fogColor; uniform float fogDensity;',
    'varying vec2 vUv; varying float vDepth;',
    'void main(){ vec2 uv=vec2(vUv.x*rep+off, vUv.y); vec3 c=texture2D(map,uv).rgb;',
    '  vec2 cell=fract(uv*tsz)-0.5; float m=smoothstep(0.5,0.26,length(cell)); float k=1.0-smoothstep(16.0,85.0,vDepth);',
    '  vec3 lit=c*1.45*m+vec3(0.05,0.045,0.06)*m; vec3 col=mix(c*0.85+vec3(0.02), lit, k);',
    '  float f=1.0-exp(-fogDensity*fogDensity*vDepth*vDepth*0.45); gl_FragColor=vec4(mix(col,fogColor,f),1.0); }'].join('\n');
  var tickers = [], tickerTex = [null, null];
  function tickerTexture(variant) {
    var segs = tickerSegments(variant), Hh = 32, fz = 23, c0 = mkCanvas(8, 8).getContext('2d');
    c0.font = font(fz, 800);
    var widths = segs.map(function (s) { return c0.measureText(s.t).width + 26; }), tot = widths.reduce(function (a, b) { return a + b; }, 0) + 60;
    while (tot > 4096 && segs.length > 2) { segs.pop(); tot -= widths.pop(); }
    var Wd = Math.min(4096, Math.max(512, Math.pow(2, Math.ceil(Math.log(tot) / Math.LN2))));
    var c = mkCanvas(Wd, Hh), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, Wd, Hh); x.font = font(fz, 800); x.textBaseline = 'middle';
    var px = 30;
    for (var rep = 0; rep < 4 && px < Wd - 40; rep++) {
      for (var i = 0; i < segs.length; i++) {
        if (px + widths[i] > Wd - 10) { px = Wd; break; }
        x.fillStyle = segs[i].c; x.fillText(segs[i].t, px, Hh / 2 + 1); px += widths[i];
      }
      if (px < Wd) { x.fillStyle = '#ffd54a'; x.fillText('◆', px, Hh / 2); px += 60; }
      if (tot * 2 > Wd) break;
    }
    var old = tickerTex[variant];
    var t = canvasTex(c, { wrapS: T.RepeatWrapping, nearest: true });
    tickerTex[variant] = t;
    tickers.forEach(function (tk) { if (tk.variant === variant) { tk.mat.uniforms.map.value = t; tk.mat.uniforms.tsz.value.set(Wd, Hh); tk.mat.uniforms.rep.value = tk.perim / (Wd * tk.band / Hh); tk.offRate = 2.8 * tk.k / (Wd * tk.band / Hh); } });
    if (old) old.dispose();
  }
  function addTicker(b, y0, y1, variant) {
    var t = b.tiers[0], d = 0.5, x0 = t.x0 - d, x1 = t.x1 + d, z0 = t.z0 - d, z1 = t.z1 + d;
    var pts = [[x0, z1], [x1, z1], [x1, z0], [x0, z0], [x0, z1]], g = new GB(), len = [0], one = [1, 1, 1];
    for (var i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var per = len[len.length - 1];
    for (var j = 0; j < 4; j++) g.wall(pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], y0, y1, one, one, len[j] / per, len[j + 1] / per, 0, 1);
    var mat = new T.ShaderMaterial({ uniforms: { map: { value: null }, off: { value: R() }, rep: { value: 1 }, tsz: { value: new T.Vector2(1024, 32) }, fogColor: FOGU.fogColor, fogDensity: FOGU.fogDensity },
      vertexShader: SCREEN_VS, fragmentShader: TICK_FS });
    var mesh = new T.Mesh(g.geo(), mat); scene.add(mesh); mesh.matrixAutoUpdate = false;
    var dk = [0.04, 0.04, 0.05];
    for (var k = 0; k < 4; k++) {   // backing band + soffit
      misc.wall(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], y0 - 0.35, y1 + 0.35, dk, dk);
    }
    misc.flat([[t.x0 - d, t.z1 + d], [t.x1 + d, t.z1 + d], [t.x1 + d, t.z0 - d], [t.x0 - d, t.z0 - d]], y0 - 0.35, dk);
    tickers.push({ mesh: mesh, mat: mat, perim: per, band: y1 - y0, variant: variant, k: rand(0.85, 1.2), offRate: 0.01 });
  }

  // lay out: wraps first, then main facades, then cross-street facades
  var wraps = 0, tickerCount = 0;
  buildings.forEach(function (b) { if (b.faces) b.faces.forEach(function (f) { f.y0 = 10.5; }); });
  var nearB = buildings.filter(function (b) { return b.faces && b.faces.some(function (f) { return f.main; }); }).sort(function (a, b) { return a.ds + Math.abs(a.cz) * 0.3 - (b.ds + Math.abs(b.cz) * 0.3); });
  nearB.forEach(function (b) {
    if (tickerCount < 9 && Math.abs(b.cz) < 230 && (b.special || R() < 0.6)) { addTicker(b, 6.3, 8.5, tickerCount % 2); tickerCount++; b.ticker = true; }
    if (wraps < 5 && !b.special && !b.theme) {
      for (var i = 0; i < 4; i++) {
        var A = b.faces[i], B = b.faces[(i + 1) % 4];
        if ((A.main || A.cross) && (B.main || B.cross) && (A.main || B.main) && A.W >= 12 && B.W >= 12 && R() < 0.7) {
          var hb = rand(9, 15), y0 = b.ticker ? 10.5 : 7;
          wrapScreen(A, B, Math.min(A.W * 0.45, 15), Math.min(B.W * 0.45, 15), y0, y0 + hb, R() < 0.5 ? 'mix' : pick(['words', 'progress', 'countdown']));
          A.y0 = B.y0 = y0 + hb + 2; wraps++; break;
        }
      }
    }
  });
  var signs = [];
  // special towers first
  buildings.forEach(function (b) {
    if (!b.special || !b.faces) return;
    var f = b.faces[b.special === 'south' ? 2 : 0];
    var y = 10.5, i = 0, chans = b.special === 'south' ? ['countdown', 'words', 'mix', 'progress', 'brand', 'mix'] : ['mix', 'progress', 'words', 'big3', 'mix'];
    while (y < f.h1 - 8 && i < chans.length) {
      var h = b.special === 'north' && i === 1 ? Math.min(30, f.h1 - y - 4) : rand(9, 14), w = f.W - 1.2;
      flatOnFace(f, f.W / 2, y + h / 2, w, h, chans[i]); y += h + 1.4; i++;
    }
    [1, 3].forEach(function (si) { var g = b.faces[si]; if (g.W > 10) flatOnFace(g, g.W / 2, 10.5 + 12, Math.min(g.W - 3, 24), 22, si === 1 ? 'feed' : 'mix'); });
  });
  // themed facades
  themeB.forEach(function (f) {
    var yTop = Math.min(f.h1 - 12, f.y0 + rand(40, 60));
    var y = layoutFace(f, f.y0, yTop, f.W > 20 ? pick(['single', 'tower', 'grid']) : 'stack');
    f.signY = Math.min(y + 2, f.h1 - 10);
  });
  allFaces.forEach(function (f) {
    if (f.theme || f.b.special || screens.length >= MAX_SCREENS) return;
    if (!f.main && R() < 0.45) return;
    var yTop = Math.min(f.h1 - 2, f.y0 + (f.main ? rand(30, 85) : rand(14, 35)));
    layoutFace(f, f.y0, yTop);
  });

  /* theme signs, doors and rings */
  var doors = [];
  function signCanvas(th) {
    var c = mkCanvas(1024, 256), x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 1024, 256); g.addColorStop(0, '#0b0820'); g.addColorStop(1, mixHex(th.color, '#0b0820', 0.6));
    x.fillStyle = g; x.fillRect(0, 0, 1024, 256);
    x.strokeStyle = th.color; x.lineWidth = 14; x.shadowColor = th.color; x.shadowBlur = 30; rr(x, 14, 14, 996, 228, 40); x.stroke(); x.shadowBlur = 0;
    x.font = font(150, 400); x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(th.glyph, 140, 132);
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.shadowColor = th.color; x.shadowBlur = 24;
    var s = fitLine(x, th.zh, 520, 128, 60, 900); x.fillText(th.zh, 250, 104);
    x.shadowBlur = 0; x.fillStyle = th.color; fitLine(x, th.en.toUpperCase() + ' · 入口 ENTRANCE', 740, 50, 26, 800); x.fillText(th.en.toUpperCase() + ' · 入口 ENTRANCE', 252, 200);
    return c;
  }
  function doorCanvas(th) {
    var c = mkCanvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#0a0812'; x.fillRect(0, 0, 256, 256);
    var g = x.createLinearGradient(0, 70, 0, 256); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, shadeHex(th.color, 1.3)); g.addColorStop(1, th.color);
    x.fillStyle = g; rr(x, 40, 70, 176, 200, 70); x.fill();
    x.fillStyle = 'rgba(10,8,18,0.55)'; x.fillRect(126, 120, 4, 136);
    x.fillStyle = th.color; x.fillRect(0, 0, 256, 56); x.fillStyle = '#0a0812'; x.textAlign = 'center'; x.textBaseline = 'middle';
    fitLine(x, '进入 ENTER · ' + th.zh, 236, 30, 14, 900); x.fillText('进入 ENTER · ' + th.zh, 128, 30);
    return c;
  }
  themeB.forEach(function (f) {
    var th = f.theme, sw = Math.min(f.W * 0.9, 28), sh = sw / 4;
    var sy = clamp(f.signY + sh / 2, 14, f.h1 - sh / 2 - 1);
    var sm = new T.Mesh(unitPlane, new T.MeshBasicMaterial({ map: canvasTex(signCanvas(th)) }));
    sm.position.set(f.cx + f.nx * 0.5, sy, f.cz + f.nz * 0.5); sm.rotation.y = Math.atan2(f.nx, f.nz); sm.scale.set(sw, sh, 1); scene.add(sm);
    misc.obox(f.cx + f.nx * 0.3, sy, f.cz + f.nz * 0.3, f.rx, f.rz, sw + 0.8, sh + 0.8, 0.35, [0.04, 0.04, 0.06]);
    haloList.push({ x: f.cx + f.nx * 0.12, y: sy, z: f.cz + f.nz * 0.12, ry: sm.rotation.y, w: sw + 8, h: sh + 8, color: th.color });
    // a vertical blade sign at the corner nearest the plaza centre, visible from up the street
    var dm = new T.Mesh(unitPlane, new T.MeshBasicMaterial({ map: canvasTex(doorCanvas(th)) }));
    var dx = f.cx + f.nx * 0.16, dz = f.cz + f.nz * 0.16;
    dm.position.set(dx, 2.6, dz); dm.rotation.y = Math.atan2(f.nx, f.nz); dm.scale.set(4.6, 5.2, 1); scene.add(dm);
    var fc = col3(th.color, 1.15);
    misc.obox(dx - f.rx * 2.55, 2.75, dz - f.rz * 2.55, f.rx, f.rz, 0.5, 5.5, 0.5, fc);
    misc.obox(dx + f.rx * 2.55, 2.75, dz + f.rz * 2.55, f.rx, f.rz, 0.5, 5.5, 0.5, fc);
    misc.obox(dx, 5.55, dz, f.rx, f.rz, 5.6, 0.5, 0.5, fc);
    misc.obox(dx + f.nx * 1.2, 5.9, dz + f.nz * 1.2, f.rx, f.rz, 7.5, 0.25, 2.4, [0.08, 0.07, 0.1]);   // canopy
    if (f.b.tiers.length) { var tt = f.b.tiers[f.b.tiers.length - 1]; misc.box(tt.x0 - 0.2, tt.x1 + 0.2, tt.y1 - 3.5, tt.y1 - 1, tt.z0 - 0.2, tt.z1 + 0.2, col3(th.color, 1)); }
    doors.push({ th: th, f: f, x: f.cx + f.nx * 1.6, z: f.cz + f.nz * 1.6 });
    poolList.push({ x: f.cx + f.nx * 5, z: f.cz + f.nz * 5, r: 12, color: th.color });
  });

  /* ───────────────────────── TKTS-style red steps (generic) ───────────────────────── */
  var STEPS = { x0: -30, x1: -11, zFront: -137, n: 12, d: 1.2, rise: 0.42 };
  (function () {
    for (var i = 0; i < STEPS.n; i++) {
      var zF = STEPS.zFront - i * STEPS.d, zB = zF - STEPS.d, y1 = (i + 1) * STEPS.rise;
      misc.box(STEPS.x0, STEPS.x1, 0, y1, zB, zF, [0.55, 0.06, 0.08], [0.8, 0.12, 0.14]);
      misc.wall(STEPS.x0, zF + 0.01, STEPS.x1, zF + 0.01, y1 - STEPS.rise, y1, [1.0, 0.16, 0.2], [1.0, 0.45, 0.42]);   // glowing risers
    }
    var zb = STEPS.zFront - STEPS.n * STEPS.d, top = STEPS.n * STEPS.rise;
    misc.box(STEPS.x0 - 0.4, STEPS.x0, 0, top + 1, zb, STEPS.zFront - STEPS.d, [0.25, 0.25, 0.3]);
    misc.box(STEPS.x1, STEPS.x1 + 0.4, 0, top + 1, zb, STEPS.zFront - STEPS.d, [0.25, 0.25, 0.3]);
    misc.box(STEPS.x0, STEPS.x1, top, top + 1.1, zb - 0.3, zb, [0.3, 0.3, 0.36]);
    colliders.push({ x0: STEPS.x0 - 0.4, x1: STEPS.x0, z0: zb, z1: STEPS.zFront - STEPS.d });
    colliders.push({ x0: STEPS.x1, x1: STEPS.x1 + 0.4, z0: zb, z1: STEPS.zFront - STEPS.d });
    colliders.push({ x0: STEPS.x0, x1: STEPS.x1, z0: zb - 0.3, z1: zb });
    poolList.push({ x: (STEPS.x0 + STEPS.x1) / 2, z: STEPS.zFront + 2, r: 16, color: '#ff2a3a' });
  })();
  function groundY(x, z) {
    if (x > STEPS.x0 && x < STEPS.x1 && z < STEPS.zFront && z > STEPS.zFront - STEPS.n * STEPS.d) return (Math.floor((STEPS.zFront - z) / STEPS.d) + 1) * STEPS.rise;
    return 0;
  }

  /* ───────────────────────── static meshes ───────────────────────── */
  bldBufs.forEach(function (g, i) { var m = new T.Mesh(g.geo(), matBld[i]); m.matrixAutoUpdate = false; scene.add(m); });
  var storeMesh = new T.Mesh(store.geo(), matStore); storeMesh.matrixAutoUpdate = false; scene.add(storeMesh);
  var miscMesh = new T.Mesh(misc.geo(), matMisc); miscMesh.matrixAutoUpdate = false; scene.add(miscMesh);

  /* ───────────────────────── instanced: halos, ground pools, streaks ───────────────────────── */
  var dummy = new T.Object3D(), tmpC = new T.Color();
  var haloMesh = new T.InstancedMesh(unitPlane, addMat(texHalo), haloList.length);
  haloMesh.material.opacity = 0.9; haloMesh.frustumCulled = false;
  haloList.forEach(function (h, i) {
    dummy.position.set(h.x, h.y, h.z); dummy.rotation.set(0, h.ry, 0); dummy.scale.set(h.w, h.h, 1); dummy.updateMatrix();
    haloMesh.setMatrixAt(i, dummy.matrix); haloMesh.setColorAt(i, tmpC.set(h.color || '#7c6cff'));
  });
  scene.add(haloMesh);

  // lamps (pole + arm + head) along 7th Ave and near cross streets
  var lampPos = [];
  for (var lz = -440; lz <= 440; lz += 28) {
    if (STREETS.some(function (s) { return Math.abs(lz - s) < streetHW(s) + 6; })) continue;
    lampPos.push([-AVE_HW - 0.7, lz, 1]); lampPos.push([AVE_HW + 0.7, lz + 14, -1]);
  }
  STREETS.forEach(function (zs) { if (Math.abs(zs) > 330) return; [-60, -110, 60, 110].forEach(function (x) { if (!inSquare(x, zs)) { lampPos.push([x, zs - streetHW(zs) - 0.7, 0, 1]); } }); });
  var lampGB = new GB();
  lampGB.prism(0, 0, 0.13, 0.09, 0, 8.6, 6, [0.16, 0.16, 0.19], [0.22, 0.22, 0.26]);
  lampGB.box(0, 2.3, 8.4, 8.6, -0.08, 0.08, [0.2, 0.2, 0.24]);
  lampGB.box(1.9, 2.8, 8.05, 8.4, -0.28, 0.28, [0.25, 0.25, 0.3], [0.25, 0.25, 0.3]);
  lampGB.flat([[1.95, 0.24], [2.75, 0.24], [2.75, -0.24], [1.95, -0.24]].reverse(), 8.03, [1.0, 0.92, 0.75]);
  var lampMesh = new T.InstancedMesh(lampGB.geo(), new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide }), lampPos.length);
  lampMesh.frustumCulled = false;
  lampPos.forEach(function (p, i) {
    var ry = p.length > 3 ? (p[3] > 0 ? -Math.PI / 2 : Math.PI / 2) : (p[2] > 0 ? 0 : Math.PI);
    dummy.position.set(p[0], 0, p[1]); dummy.rotation.set(0, ry, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lampMesh.setMatrixAt(i, dummy.matrix);
    var hx = p[0] + Math.cos(ry) * 2.35, hz = p[1] - Math.sin(ry) * 2.35;
    if (Math.hypot(hx, hz) < 520) poolList.push({ x: hx, z: hz, r: 7, color: '#ffcf8a', k: 0.32 });
  });
  scene.add(lampMesh);

  var poolMesh = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), addMat(texPool), poolList.length);
  poolMesh.frustumCulled = false; poolMesh.renderOrder = 2;
  poolList.forEach(function (p, i) {
    dummy.position.set(p.x, 0.04, p.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(p.r * 2, 1, p.r * 2); dummy.updateMatrix(); poolMesh.setMatrixAt(i, dummy.matrix);
    poolMesh.setColorAt(i, tmpC.set(p.color || '#7c6cff').multiplyScalar(p.k || 0.3));
  });
  scene.add(poolMesh);

  streakSrc.sort(function (a, b) { return b.area - a.area; }); streakSrc.length = Math.min(streakSrc.length, 26);
  var streakGeo = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
  var streakMesh = new T.InstancedMesh(streakGeo, addMat(texStreak), Math.max(1, streakSrc.length));
  streakMesh.frustumCulled = false; streakMesh.renderOrder = 3; streakMesh.count = streakSrc.length;
  streakSrc.forEach(function (s, i) { streakMesh.setColorAt(i, tmpC.set('#7c6cff').multiplyScalar(0.3)); });
  scene.add(streakMesh);

  var ringMesh = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), addMat(texRing), Math.max(1, doors.length));
  ringMesh.frustumCulled = false; ringMesh.count = doors.length;
  doors.forEach(function (d, i) { ringMesh.setColorAt(i, tmpC.set(d.th.color)); });
  scene.add(ringMesh);

  /* ───────────────────────── traffic lights ───────────────────────── */
  var sigGB = new GB(), dkS = [0.12, 0.13, 0.15];
  sigGB.prism(0, 0, 0.16, 0.13, 0, 6.4, 6, dkS, dkS);
  sigGB.box(0, 7.5, 6.1, 6.35, -0.1, 0.1, dkS);
  sigGB.box(6.6, 7.1, 4.3, 6.1, -0.3, 0.3, [0.16, 0.15, 0.08]);
  var sigPoles = [], sigLamps = [];
  STREETS.forEach(function (zs) {
    if (Math.abs(zs) > 330) return;
    var h = streetHW(zs);
    sigPoles.push({ x: -AVE_HW - 0.8, z: zs - h - 1.2, ry: 0, zs: zs, axis: 0 });          // arm east over 7th, faces north
    sigPoles.push({ x: AVE_HW + 0.8, z: zs + h + 1.2, ry: -Math.PI / 2 + Math.PI, zs: zs, axis: 1 });
  });
  var sigMesh = new T.InstancedMesh(sigGB.geo(), new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide }), sigPoles.length);
  sigMesh.frustumCulled = false;
  var lampQuad = new T.PlaneGeometry(0.34, 0.34);
  var sigLampMesh = new T.InstancedMesh(lampQuad, new T.MeshBasicMaterial({ fog: true }), sigPoles.length * 3);
  sigLampMesh.frustumCulled = false;
  sigPoles.forEach(function (p, i) {
    dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, p.ry, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); sigMesh.setMatrixAt(i, dummy.matrix);
    var ax = Math.cos(p.ry), az = -Math.sin(p.ry);              // local +x in world
    var hx = p.x + ax * 6.85, hz = p.z + az * 6.85, fnx = -az, fnz = ax;   // face normal = local -z… choose facing oncoming traffic
    fnx = Math.sin(p.ry + Math.PI); fnz = Math.cos(p.ry + Math.PI);
    for (var k = 0; k < 3; k++) {
      dummy.position.set(hx + fnx * 0.32, 5.75 - k * 0.55, hz + fnz * 0.32); dummy.rotation.set(0, Math.atan2(fnx, fnz), 0); dummy.updateMatrix();
      sigLampMesh.setMatrixAt(i * 3 + k, dummy.matrix); sigLampMesh.setColorAt(i * 3 + k, tmpC.set('#222'));
      sigLamps.push({ i: i * 3 + k, k: k, p: p });
    }
  });
  scene.add(sigMesh); scene.add(sigLampMesh);
  var sigPhase = -1;
  function updateSignals(t) {
    var ph = Math.floor((t % 30) / 1) , st7 = ph < 12 ? 'g' : ph < 15 ? 'y' : 'r';
    var key = st7 + (ph < 27 ? 'a' : 'b'); if (key === sigPhase) return; sigPhase = key;
    sigLamps.forEach(function (L) {
      var s = L.p.axis === 0 ? st7 : (st7 === 'r' ? (ph < 27 ? 'g' : 'y') : 'r');
      var on = (L.k === 0 && s === 'r') || (L.k === 1 && s === 'y') || (L.k === 2 && s === 'g');
      sigLampMesh.setColorAt(L.i, tmpC.set(on ? ['#ff3b30', '#ffcc00', '#3dff8a'][L.k] : '#1c1c22'));
    });
    sigLampMesh.instanceColor.needsUpdate = true;
  }

  /* ───────────────────────── cabs ───────────────────────── */
  var cabGB = new GB(), Y = [0.98, 0.74, 0.08], GL = [0.08, 0.1, 0.14];
  cabGB.box(-0.9, 0.9, 0.32, 1.05, -2.3, 2.3, Y, [1, 0.82, 0.2]);
  cabGB.box(-0.82, 0.82, 1.05, 1.58, -1.15, 0.95, GL, [0.85, 0.66, 0.1]);
  cabGB.box(-0.3, 0.3, 1.58, 1.82, -0.25, 0.25, [1, 0.95, 0.8]);
  [-1.5, 1.5].forEach(function (wz) { cabGB.box(-0.95, 0.95, 0, 0.6, wz - 0.35, wz + 0.35, [0.05, 0.05, 0.06]); });
  [-0.6, 0.6].forEach(function (hx) {
    cabGB.wall(hx - 0.22, 2.31, hx + 0.22, 2.31, 0.66, 0.86, [1, 1, 0.92], [1, 1, 0.92]);
    cabGB.wall(hx + 0.22, -2.31, hx - 0.22, -2.31, 0.7, 0.88, [1, 0.1, 0.08], [1, 0.1, 0.08]);
  });
  var cabs = [];
  [-6.75, -2.25, 2.25, 6.75].forEach(function (lx) { for (var i = 0; i < 6; i++) cabs.push({ ax: 'z', lane: lx, p: rand(-450, 450), v: rand(8, 13), dir: 1 }); });
  STREETS.forEach(function (zs, si) { if (Math.abs(zs) > 330) return; var dir = zs === 240 ? 0 : (si % 2 ? 1 : -1);
    for (var i = 0; i < 3; i++) { var d = dir || (i % 2 ? 1 : -1); cabs.push({ ax: 'x', lane: zs + (dir ? (i % 2 ? 2.2 : -2.2) : d * 2.6), p: rand(-320, 320), v: rand(7, 11), dir: d }); } });
  var cabMesh = new T.InstancedMesh(cabGB.geo(), new T.MeshBasicMaterial({ vertexColors: true }), cabs.length);
  cabMesh.frustumCulled = false; scene.add(cabMesh);
  function updateCabs(dt) {
    cabs.forEach(function (c, i) {
      c.p += c.v * c.dir * dt; var lim = c.ax === 'z' ? 460 : 330;
      if (c.p > lim) c.p -= 2 * lim; if (c.p < -lim) c.p += 2 * lim;
      if (c.ax === 'z') { dummy.position.set(c.lane, 0, c.p); dummy.rotation.set(0, 0, 0); }
      else { dummy.position.set(c.p, 0, c.lane); dummy.rotation.set(0, c.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0); }
      dummy.scale.set(1, 1, 1); dummy.updateMatrix(); cabMesh.setMatrixAt(i, dummy.matrix);
    });
    cabMesh.instanceMatrix.needsUpdate = true;
  }

  /* ───────────────────────── pedestrians (instanced silhouettes) ───────────────────────── */
  var pedGB = new GB();
  pedGB.prism(0, 0, 0.17, 0.2, 0, 0.85, 6, [0.25, 0.25, 0.3], [0.35, 0.35, 0.4]);
  pedGB.prism(0, 0, 0.21, 0.17, 0.85, 1.5, 6, [0.6, 0.6, 0.65], [0.7, 0.7, 0.75]);
  pedGB.prism(0, 0, 0.11, 0.1, 1.5, 1.74, 6, [0.55, 0.45, 0.4], [0.55, 0.45, 0.4], [0.2, 0.15, 0.12]);
  var peds = [];
  function pedSeg(a, b) { return { ax: a[0], az: a[1], bx: b[0], bz: b[1] }; }
  var segs = [];
  [-11.6, 11.6, -13, 13].forEach(function (x) { segs.push(pedSeg([x, -440], [x, 440])); });
  for (var o = -7; o <= 2; o += 3) segs.push(pedSeg([bwX(-150) + o, -150], [bwX(150) + o, 150]));
  STREETS.forEach(function (zs) { if (Math.abs(zs) > 260) return; var h = streetHW(zs) + 2.2; segs.push(pedSeg([-200, zs - h], [200, zs - h])); segs.push(pedSeg([-200, zs + h], [200, zs + h])); });
  for (var pi = 0; pi < 150; pi++) {
    var sg = segs[pi % segs.length], len = Math.hypot(sg.bx - sg.ax, sg.bz - sg.az);
    peds.push({ s: sg, len: len, t: R() * len, v: rand(1.1, 1.6) * (R() < 0.5 ? 1 : -1), off: rand(-0.8, 0.8), ph: R() * 6, sc: rand(0.92, 1.08) });
  }
  for (var si2 = 0; si2 < 26; si2++) {            // people sitting on the red steps
    var st = (R() * STEPS.n) | 0;
    peds.push({ sit: true, x: rand(STEPS.x0 + 0.6, STEPS.x1 - 0.6), z: STEPS.zFront - st * STEPS.d - 0.75, y: (st + 1) * STEPS.rise - 0.55, sc: rand(0.92, 1.05), ry: Math.PI + rand(-0.4, 0.4) });
  }
  var pedMesh = new T.InstancedMesh(pedGB.geo(), new T.MeshBasicMaterial({ vertexColors: true }), peds.length);
  pedMesh.frustumCulled = false;
  peds.forEach(function (p, i) { pedMesh.setColorAt(i, tmpC.set(pick(['#5a5f78', '#7a4f5a', '#3d5a6c', '#6b6b52', '#4a3f66', '#806040', '#2f3442', '#8a8a96']))); });
  scene.add(pedMesh);
  var pedAcc = 0;
  function updatePeds(dt, t) {
    pedAcc += dt; if (pedAcc < 1 / 30) return; var step = pedAcc; pedAcc = 0;
    peds.forEach(function (p, i) {
      if (p.sit) { dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.ry, 0); dummy.scale.set(p.sc, p.sc * 0.95, p.sc); }
      else {
        p.t += p.v * step; if (p.t > p.len) { p.t = p.len; p.v = -p.v; } if (p.t < 0) { p.t = 0; p.v = -p.v; }
        var s = p.s, ux = (s.bx - s.ax) / p.len, uz = (s.bz - s.az) / p.len, x = s.ax + ux * p.t - uz * p.off, z = s.az + uz * p.t + ux * p.off;
        dummy.position.set(x, Math.abs(Math.sin(t * 5.5 + p.ph)) * 0.05, z);
        dummy.rotation.set(0, Math.atan2(ux * Math.sign(p.v), uz * Math.sign(p.v)), 0); dummy.scale.set(p.sc, p.sc, p.sc);
      }
      dummy.updateMatrix(); pedMesh.setMatrixAt(i, dummy.matrix);
    });
    pedMesh.instanceMatrix.needsUpdate = true;
  }

  /* ───────────────────────── screen content driver ───────────────────────── */
  var paintQueue = [];
  function enqueue(s) { if (paintQueue.indexOf(s) < 0) paintQueue.push(s); }
  function rebuildDecks() {
    screens.forEach(function (s) { s.deck = deckFor(s.channel, s); s.idx = s.idx % s.deck.length; s.next = 0; enqueue(s); });
    tickerTexture(0); tickerTexture(1);
  }
  function paintNext(s, now) {
    var back = 1 - s.cur, slide = s.deck[s.idx % s.deck.length], c = s.cv[back], ctx = c.getContext('2d');
    ctx.setTransform(c.width / s.vw, 0, 0, c.height / s.vh, 0, 0);
    paintSlide(ctx, s.vw, s.vh, slide);
    s.tx[back].needsUpdate = true;
    s.mat.uniforms.map1.value = s.tx[back];
    s.trans = now; s.accentNext = slide.accent || '#ff5df0';
    s.next = now + rand(5.5, 9.5) + (s.deck.length < 2 ? 1e9 : 0);
  }
  function finishTrans(s) {
    s.cur = 1 - s.cur; s.mat.uniforms.map0.value = s.tx[s.cur]; s.mat.uniforms.mixv.value = 0; s.trans = -1;
    s.accent = s.accentNext;
    var c = tmpC.set(s.accent);
    if (s.halo >= 0) { haloMesh.setColorAt(s.halo, c); haloMesh.instanceColor.needsUpdate = true; }
    if (s.pool >= 0) { poolMesh.setColorAt(s.pool, tmpC.set(s.accent).multiplyScalar(0.34)); poolMesh.instanceColor.needsUpdate = true; }
    var si = streakSrc.findIndex(function (q) { return q.s === s; });
    if (si >= 0) { streakMesh.setColorAt(si, tmpC.set(s.accent).multiplyScalar(0.3)); streakMesh.instanceColor.needsUpdate = true; }
  }
  function updateScreens(now, dt) {
    var budget = 2;
    for (var i = 0; i < screens.length; i++) {
      var s = screens[i];
      if (s.trans >= 0) {
        var k = (now - s.trans) / 0.9;
        if (k >= 1) finishTrans(s); else s.mat.uniforms.mixv.value = k * k * (3 - 2 * k);
      } else if (s.deck && now > s.next && paintQueue.indexOf(s) < 0) { s.idx = (s.idx + 1) % s.deck.length; enqueue(s); }
      if (s.scroll) { var u = s.mat.uniforms.scroll; u.value = (u.value + s.speed * dt) % 1; }
    }
    while (budget-- > 0 && paintQueue.length) { var q = paintQueue.shift(); if (q.trans >= 0) finishTrans(q); paintNext(q, now); }
  }

  /* ───────────────────────── player & controls ───────────────────────── */
  var SPAWN = { x: 25, z: 138, yaw: 0.16, pitch: 0.14 };   // middle of the south bowtie plaza, looking up Broadway
  var player = { x: SPAWN.x, z: SPAWN.z, y: EYE, yaw: SPAWN.yaw, pitch: SPAWN.pitch, run: false };
  var keys = {}, joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0 }, turnTo = null;
  var joyEl = document.getElementById('joy'), joyKnob = joyEl.firstElementChild;
  addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (e.code === 'Enter' && nearDoor) { e.preventDefault(); enterDoor(nearDoor); }
    if (e.code === 'KeyR') toggleRun();
  });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  addEventListener('blur', function () { keys = {}; });
  canvas.addEventListener('pointerdown', function (e) {
    canvas.focus && canvas.focus({ preventScroll: true });
    hideHint();
    if (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.5 && joy.id === null) {
      joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
      joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; joyKnob.style.transform = '';
    } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; look.mouse = e.pointerType === 'mouse'; }
    try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
  });
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerId === joy.id) {
      var dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, l = Math.hypot(dx, dy), mx = 52;
      if (l > mx) { dx *= mx / l; dy *= mx / l; }
      joy.dx = dx / mx; joy.dy = dy / mx; joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    } else if (e.pointerId === look.id) {
      var k = look.mouse ? 0.0032 : 0.0052;
      player.yaw -= (e.clientX - look.x) * k; player.pitch = clamp(player.pitch - (e.clientY - look.y) * k, -1.15, 1.35);
      look.x = e.clientX; look.y = e.clientY; turnTo = null;
    }
  });
  function endPtr(e) {
    if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; joyEl.style.display = 'none'; }
    if (e.pointerId === look.id) look.id = null;
  }
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr); canvas.addEventListener('lostpointercapture', endPtr);
  document.addEventListener('touchmove', function (e) { if (e.target === canvas) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var runBtn = document.getElementById('run');
  function toggleRun() { player.run = !player.run; runBtn.classList.toggle('on', player.run); }
  runBtn.addEventListener('click', toggleRun);

  function collide(px, pz) {
    var r = 0.42;
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      if (px < c.x0 - r || px > c.x1 + r || pz < c.z0 - r || pz > c.z1 + r) continue;
      var qx = clamp(px, c.x0, c.x1), qz = clamp(pz, c.z0, c.z1), dx = px - qx, dz = pz - qz, d = Math.hypot(dx, dz);
      if (d > 1e-6) { if (d < r) { px = qx + dx / d * r; pz = qz + dz / d * r; } }
      else {
        var m = [px - c.x0, c.x1 - px, pz - c.z0, c.z1 - pz], mi = m.indexOf(Math.min.apply(null, m));
        if (mi === 0) px = c.x0 - r; else if (mi === 1) px = c.x1 + r; else if (mi === 2) pz = c.z0 - r; else pz = c.z1 + r;
      }
    }
    return [clamp(px, -440, 440), clamp(pz, -450, 450)];
  }
  function updatePlayer(dt) {
    var f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
    if (keys.ArrowLeft) player.yaw += 1.9 * dt; if (keys.ArrowRight) player.yaw -= 1.9 * dt;
    if (joy.id !== null) { f -= joy.dy; s += joy.dx; }
    var l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
    if (l > 0.01) hideHint();
    var sp = (player.run || keys.ShiftLeft || keys.ShiftRight ? RUN : WALK) * dt;
    var sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
    var nx = player.x + (-sy * f + cy * s) * sp, nz = player.z + (-cy * f - sy * s) * sp;
    var gy0 = groundY(player.x, player.z), gy1 = groundY(nx, nz);
    if (gy1 - gy0 > 0.6) { nx = player.x; nz = player.z; }       // only climb the steps one at a time, from the front
    var p = collide(nx, nz); player.x = p[0]; player.z = p[1];
    if (turnTo !== null) {
      var dyaw = ((turnTo - player.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      player.yaw += dyaw * Math.min(1, dt * 5); if (Math.abs(dyaw) < 0.01) turnTo = null;
    }
    var gy = groundY(player.x, player.z) + EYE;
    player.y += (gy - player.y) * Math.min(1, dt * 10);
    var bob = l > 0.01 ? Math.sin(performance.now() / 1000 * (player.run ? 13 : 9)) * 0.03 * Math.min(1, l) : 0;
    camera.position.set(player.x, player.y + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  }

  /* ───────────────────────── HUD: prompt, entrances, minimap, toast ───────────────────────── */
  var promptEl = document.getElementById('prompt'), ptEl = document.getElementById('pt'), psEl = document.getElementById('ps'), pgo = document.getElementById('pgo');
  var toastEl = document.getElementById('toast'), hintEl = document.getElementById('hint'), sampleEl = document.getElementById('sample');
  var nearDoor = null, toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600); }
  var hintHidden = false;
  function hideHint() { if (hintHidden) return; hintHidden = true; setTimeout(function () { hintEl.style.opacity = '0'; }, 1500); }
  setTimeout(hideHint, 9000);
  function doorDetail(th) {
    if (!content) return '';
    if (th.target === 'chart') {
      var c = content.charts.filter(function (x) { return x.sub === th.sub; })[0];
      return c ? '今日 Anchor Chart：' + (c.title || '（未命名）') + (c.mastered ? ' ✓' : '') : '今天还没有选 Anchor Chart · No chart today';
    }
    if (th.target === 'words') return content.words && content.words.cur ? '今日单词：' + content.words.cur + (content.words.left != null ? ' · 剩余 ' + content.words.left : '') : '今天还没有单词任务 · No words today';
    return content.works.length ? content.works.length + ' 件作品 works · 最新：' + content.works[0].title : '还没有作品 · No works yet';
  }
  function showPrompt(d) {
    if (nearDoor === d) return; nearDoor = d;
    if (!d) { promptEl.classList.remove('on'); return; }
    ptEl.textContent = '进入 ' + d.th.zh + ' ' + d.th.en; psEl.textContent = doorDetail(d.th);
    pgo.style.color = d.th.color; promptEl.style.borderColor = d.th.color; promptEl.classList.add('on');
  }
  function enterDoor(d) {
    var th = d.th, msg = th.target === 'chart' ? { tsq: 1, op: 'enter', target: 'chart', sub: th.sub } : { tsq: 1, op: 'enter', target: th.target };
    if (EMBED) { try { window.parent.postMessage(msg, '*'); } catch (e) {} toast('正在打开 ' + th.zh + ' ' + th.en + '…'); }
    else toast('从 Spatial Home 进入后可打开对应学习内容');
  }
  pgo.addEventListener('click', function () { if (nearDoor) enterDoor(nearDoor); });
  document.getElementById('close').addEventListener('click', function () {
    if (EMBED) { try { window.parent.postMessage({ tsq: 1, op: 'close' }, '*'); } catch (e) {} }
    else history.back();
  });

  var entsEl = document.getElementById('ents'), rows = [];
  doors.forEach(function (d) {
    var li = document.createElement('li');
    li.innerHTML = '<i></i><span></span><em></em><b>↑</b>';
    li.firstChild.style.background = d.th.color; li.firstChild.style.color = d.th.color;
    li.children[1].textContent = d.th.zh + ' ' + d.th.en;
    li.title = '朝向 ' + d.th.zh; li.style.cursor = 'pointer';
    li.addEventListener('click', function () { turnTo = Math.atan2(-(d.x - player.x), -(d.z - player.z)); player.pitch = 0.08; });
    entsEl.appendChild(li); rows.push({ d: d, li: li });
  });
  var mapEl = document.getElementById('map');
  document.getElementById('mapToggle').addEventListener('click', function () { mapEl.classList.toggle('min'); this.textContent = mapEl.classList.contains('min') ? '▸' : '▾'; });
  if (innerWidth < 520 && innerHeight < 800) { /* phones: keep it, but compact via CSS */ }

  var mini = document.getElementById('mini'), mctx = mini.getContext('2d'), MAPC = { x: 0, z: 40, half: 210 }, mapBg = mkCanvas(312, 312);
  function m2p(x, z) { return [(x - MAPC.x + MAPC.half) / (2 * MAPC.half) * 312, (z - MAPC.z + MAPC.half) / (2 * MAPC.half) * 312]; }
  (function drawMapBg() {
    var x = mapBg.getContext('2d'); x.fillStyle = '#3a3a48'; x.fillRect(0, 0, 312, 312);
    x.fillStyle = '#4a2a33';
    var a = m2p(bwX(-152) - BWX, -152), b = m2p(bwX(230) - BWX, 230), c = m2p(bwX(230) + BWX, 230), d = m2p(bwX(-152) + BWX, -152);
    x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.fill();
    x.fillStyle = '#16171d'; var p0 = m2p(-AVE_HW, -600), p1 = m2p(AVE_HW, 600); x.fillRect(p0[0], 0, p1[0] - p0[0], 312);
    STREETS.forEach(function (z) { var q = m2p(0, z - streetHW(z)), q2 = m2p(0, z + streetHW(z)); x.fillRect(0, q[1], 312, q2[1] - q[1]); });
    x.fillStyle = '#121216'; var e0 = m2p(bwX(-400), -400), e1 = m2p(bwX(-152), -152); x.lineWidth = 16 / 420 * 312; x.strokeStyle = '#16171d';
    x.beginPath(); x.moveTo(e0[0], e0[1]); x.lineTo(e1[0], e1[1]); x.stroke(); e0 = m2p(bwX(400), 400); e1 = m2p(bwX(230), 230); x.beginPath(); x.moveTo(e0[0], e0[1]); x.lineTo(e1[0], e1[1]); x.stroke();
    x.fillStyle = '#0c0d14';
    buildings.forEach(function (bd) { var u = m2p(bd.x0, bd.z0), v = m2p(bd.x1, bd.z1); x.fillRect(u[0], u[1], v[0] - u[0], v[1] - u[1]); });
    x.fillStyle = '#ff2a3a'; var s0 = m2p(STEPS.x0, STEPS.zFront - STEPS.n * STEPS.d), s1 = m2p(STEPS.x1, STEPS.zFront); x.fillRect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1]);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.font = '600 15px ' + FONT;
    [[240, '42'], [80, '44'], [-80, '46'], [-160, '47']].forEach(function (s) { var q = m2p(-200, s[0]); x.fillText(s[1] + ' St', 4, q[1] + 5); });
  })();
  function drawMap() {
    mctx.drawImage(mapBg, 0, 0);
    doors.forEach(function (d) {
      var p = m2p(d.x, d.z); mctx.beginPath(); mctx.arc(p[0], p[1], 9, 0, 7); mctx.fillStyle = d.th.color; mctx.shadowColor = d.th.color; mctx.shadowBlur = 10; mctx.fill(); mctx.shadowBlur = 0;
      mctx.font = '14px ' + FONT; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText(d.th.glyph, p[0], p[1] + 1);
    });
    var pp = m2p(player.x, player.z); pp[0] = clamp(pp[0], 8, 304); pp[1] = clamp(pp[1], 8, 304);
    mctx.save(); mctx.translate(pp[0], pp[1]); mctx.rotate(-player.yaw);
    mctx.fillStyle = 'rgba(255,255,255,0.18)'; mctx.beginPath(); mctx.moveTo(0, 0); mctx.arc(0, 0, 46, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); mctx.fill();
    mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, -12); mctx.lineTo(8, 9); mctx.lineTo(0, 4); mctx.lineTo(-8, 9); mctx.closePath(); mctx.fill();
    mctx.restore();
    mctx.fillStyle = 'rgba(255,255,255,0.8)'; mctx.font = '700 15px ' + FONT; mctx.textAlign = 'center'; mctx.fillText('N', 296, 16);
    rows.forEach(function (r) {
      var dx = r.d.x - player.x, dz = r.d.z - player.z, dist = Math.hypot(dx, dz);
      var bearing = Math.atan2(-dx, -dz), rel = bearing - player.yaw;
      r.li.children[2].textContent = dist < 1000 ? Math.round(dist) + 'm' : '';
      r.li.children[3].style.transform = 'rotate(' + (-rel) + 'rad)';
    });
  }

  /* ───────────────────────── messaging with Spatial Home ───────────────────────── */
  var gotContent = false;
  function setContent(data, isSample) {
    content = normalize(data, isSample);
    sampleEl.classList.toggle('on', content.isSample);
    document.getElementById('sub').textContent = (content.isSample ? '示例 · ' : '') + content.date + (content.exam && content.exam.daysLeft != null ? ' · 距考试 ' + content.exam.daysLeft + ' 天' : '');
    rebuildDecks();
    if (nearDoor) { var d = nearDoor; nearDoor = null; showPrompt(d); }
  }
  addEventListener('message', function (e) {
    var m = e.data;
    if (!m || typeof m !== 'object' || m.tsq !== 1) return;
    if (EMBED && e.source !== window.parent) return;
    if (m.op === 'content') { gotContent = true; setContent(m.data, false); }
  });
  if (EMBED) {
    try { window.parent.postMessage({ tsq: 1, op: 'ready' }, '*'); } catch (e) {}
    setTimeout(function () { if (!gotContent) setContent(sampleData(), true); }, 1500);
  } else setContent(sampleData(), true);
  // until content arrives, the screens show the Minest brand loop
  screens.forEach(function (s) { if (!s.deck) { s.deck = deckFor(s.channel, s); enqueue(s); } });
  if (!tickerTex[0]) { tickerTexture(0); tickerTexture(1); }

  /* ───────────────────────── resize, adaptive resolution, loop ───────────────────────── */
  function resize() {
    var w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < h ? 78 : 66; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); addEventListener('orientationchange', function () { setTimeout(resize, 200); });
  resize();

  var statsEl = document.getElementById('stats'); if (DEBUG) statsEl.style.display = 'block';
  var last = performance.now(), t0 = last, frames = 0, ftAcc = 0, adaptT = 0, mapT = 0, first = true, fps = 60;
  var streakV = new T.Vector3();
  function updateStreaks() {
    for (var i = 0; i < streakSrc.length; i++) {
      var s = streakSrc[i], dx = player.x - s.x, dz = player.z - s.z, D = Math.hypot(dx, dz) || 1;
      var L = clamp(D * 0.85, 4, 130);
      dummy.position.set(s.x, 0.05, s.z); dummy.rotation.set(0, Math.atan2(dx, dz), 0); dummy.scale.set(s.w, 1, L); dummy.updateMatrix();
      streakMesh.setMatrixAt(i, dummy.matrix);
    }
    streakMesh.instanceMatrix.needsUpdate = true;
  }
  function frame(nowMs) {
    requestAnimationFrame(frame);
    var dt = clamp((nowMs - last) / 1000, 0, 0.05); last = Math.max(last, nowMs);
    var t = Math.max(0, (nowMs - t0) / 1000); TIME.value = t;
    updatePlayer(dt);
    updateScreens(t, dt);
    for (var i = 0; i < tickers.length; i++) { var u = tickers[i].mat.uniforms.off; u.value = (u.value + tickers[i].offRate * dt) % 1; }
    updateCabs(dt); updatePeds(dt, t); updateSignals(t); updateStreaks();
    sky.position.copy(camera.position);
    var pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    ringMesh.material.opacity = 0.45 + 0.4 * pulse;
    doors.forEach(function (d, j) { dummy.position.set(d.x + d.f.nx * 1.4, 0.06, d.z + d.f.nz * 1.4); dummy.rotation.set(0, 0, 0); var r = 4.2 + pulse * 0.8; dummy.scale.set(r, 1, r); dummy.updateMatrix(); ringMesh.setMatrixAt(j, dummy.matrix); });
    ringMesh.instanceMatrix.needsUpdate = true;
    // nearest door
    var best = null, bd = 6;
    doors.forEach(function (d) { var dd = Math.hypot(d.x - player.x, d.z - player.z); if (dd < bd) { bd = dd; best = d; } });
    showPrompt(best);
    mapT -= dt; if (mapT <= 0) { mapT = 0.15; drawMap(); }
    renderer.render(scene, camera);
    if (first) { first = false; setTimeout(function () { document.getElementById('loading').classList.add('off'); }, 250); }
    // adaptive pixel ratio
    frames++; ftAcc += dt; adaptT += dt;
    if (adaptT > 2.5) {
      fps = frames / ftAcc;
      if (!document.hidden) {
        if (fps < 48 && pr > 1) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); resize(); }
        else if (fps > 58 && pr < MAXPR) { pr = Math.min(MAXPR, pr + 0.25); renderer.setPixelRatio(pr); resize(); }
      }
      frames = 0; ftAcc = 0; adaptT = 0;
    }
    if (DEBUG) { var inf = renderer.info.render; statsEl.textContent = 'fps ' + fps.toFixed(0) + '  pr ' + pr + '\ncalls ' + inf.calls + '  tris ' + inf.triangles + '\nscreens ' + screens.length + '  tickers ' + tickers.length; }
  }
  requestAnimationFrame(frame);

  window.__tsq = {
    renderer: renderer, screens: screens, doors: doors, player: player, colliders: colliders,
    info: function () { var i = renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, screens: screens.length, tickers: tickers.length, buildings: buildings.length, pr: pr, fps: fps }; },
    content: function () { return content; },
    teleport: function (x, z, yaw, pitch) { player.x = x; player.z = z; if (yaw != null) player.yaw = yaw; if (pitch != null) player.pitch = pitch; }
  };
})();
