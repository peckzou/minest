/* Minest · 70 · 体素陈列引擎 (Voxel Exhibition Engine 3D) — My World 的陈列体系，为体素世界重做的 3D 版。
   What it replaces: the four one-card props of 69 (easel / shelf / showcase / wall, drawn with tilted sticks and a
   cylinder, fed from a card list that never loaded, standing on sea rocks).
   What it is:
   · Ten fixtures built from 1/8-block voxels on the block grid (quarter turns only), lit and fogged like the world:
     画架 · 画廊墙 · 沙龙墙 · 书架 · 玻璃展柜 · 展台 · 玻璃展台 · 领奖台 · 模型桌 · 时间线 · 宝箱.
   · Every fixture has slots. A slot shows a real card of the island's board, by reference "<list id>/<card id>"
     (the same reference My World's own displays use; cards are never copied): a framed pixel picture on walls, a
     book on shelves, an extruded 16×16 voxel relic on stands and tables.
   · 策展: pick a list, get 2–3 ways to show it with the reason, one tap builds the whole exhibition on free, level
     ground next to you (inside the world, above water, off buildings, not through another fixture).
   · Edits are one undo step each and are stored where 69 stored them (island record → vox.bld.displays, dv: 2).
   The pure part (catalogue, geometry of slots, migration, curation, row planning) also loads in node for tests. */
(function (root) {
  'use strict';
  var VERSION = '70.0', PX = 1 / 8;

  /* ================================================================ catalogue */
  var THEMES = {
    aegean: { name: '爱琴海', base: '#f3efe6', trim: '#2f6fd6', accent: '#f2c13d', wood: '#8f5f3d', dark: '#5d3f2a', metal: '#c9ced6', cloth: '#2f6fd6', paper: '#fbf7ee', ink: '#1d2b4f' },
    museum: { name: '博物馆', base: '#454852', trim: '#2a2c34', accent: '#d9b24a', wood: '#5e4a39', dark: '#30251d', metal: '#b08d3c', cloth: '#7a1f2b', paper: '#f4efe2', ink: '#2a2c34' },
    oak:    { name: '橡木',   base: '#c99c66', trim: '#8a5a3a', accent: '#efe1b4', wood: '#a8733f', dark: '#6b4423', metal: '#8f9499', cloth: '#3f7a4f', paper: '#fbf5e6', ink: '#4a2f18' },
    marble: { name: '大理石', base: '#e8eaee', trim: '#b4bbc6', accent: '#c9a227', wood: '#d6cfc0', dark: '#9aa1ab', metal: '#e5e7eb', cloth: '#394867', paper: '#ffffff', ink: '#394867' }
  };
  var THEME_IDS = ['aegean', 'museum', 'oak', 'marble'];

  function grid(xs, ys, o) { var out = []; ys.forEach(function (y) { xs.forEach(function (x) { var s = { x: x, y: y }; for (var k in o) s[k] = o[k]; out.push(s); }); }); return out; }

  // sizes in blocks (w across, d deep, h tall) · slots and boxes in px (1/8 block), origin = middle of the footprint
  // on the ground, front = +z. mode: frame (flat on a wall) · book (stands on a shelf) · relic (voxel object).
  var KINDS = {
    easel: { name: '画架', en: 'Easel', icon: '🎨', surface: 'wall', w: 1, d: 1, h: 2, why: '一张画，单独立着',
      slots: [{ x: 0, y: 10.5, z: 2.5, w: 8, h: 8, mode: 'frame' }],
      boxes: [[-3.5, 0, 1, -2.5, 15, 2, 'wood'], [2.5, 0, 1, 3.5, 15, 2, 'wood'], [-0.5, 0, -3, 0.5, 13, -2, 'dark'], [-0.5, 12, -2, 0.5, 13, 1, 'dark'], [-4, 5.5, 1, 4, 6.5, 3.5, 'wood'], [-3.5, 14.5, 1, 3.5, 15.5, 2, 'wood']] },
    framewall: { name: '画廊墙', en: 'Gallery wall', icon: '🖼', surface: 'wall', w: 4, d: 1, h: 3, why: '图片整齐排成两行',
      slots: grid([-10, 0, 10], [15, 6.5], { z: 1, w: 8, h: 7, mode: 'frame' }),
      sign: { x: 0, y: 22, z: 2.06, w: 24, h: 3 },
      boxes: [[-16, 0, -2, 16, 20, 1, 'base'], [-16, 0, -3, 16, 2, 2, 'trim'], [-16, 20, -3, 16, 24, 2, 'trim']] },
    salon: { name: '沙龙墙', en: 'Salon wall', icon: '🏛', surface: 'wall', w: 5, d: 1, h: 3, why: '一张主图居中，四张小图围着',
      slots: [{ x: 0, y: 11, z: 1, w: 13, h: 14, mode: 'frame' }, { x: -14, y: 15, z: 1, w: 8, h: 7, mode: 'frame' }, { x: 14, y: 15, z: 1, w: 8, h: 7, mode: 'frame' }, { x: -14, y: 6.5, z: 1, w: 8, h: 7, mode: 'frame' }, { x: 14, y: 6.5, z: 1, w: 8, h: 7, mode: 'frame' }],
      sign: { x: 0, y: 22, z: 2.06, w: 28, h: 3 },
      boxes: [[-20, 0, -2, 20, 20, 1, 'base'], [-20, 0, -3, 20, 2, 2, 'trim'], [-20, 20, -3, 20, 24, 2, 'trim']] },
    bookshelf: { name: '书架', en: 'Bookshelf', icon: '📚', surface: 'shelf', w: 3, d: 1, h: 3, why: '卡片像书一样封面朝外',
      slots: grid([-8.25, -2.75, 2.75, 8.25], [15, 8, 1], { z: 0.5, w: 4.5, h: 5.5, mode: 'book' }),
      sign: { x: 0, y: 22.5, z: 3.06, w: 20, h: 2.4 },
      boxes: [[-12, 0, -3, -11, 24, 3, 'wood'], [11, 0, -3, 12, 24, 3, 'wood'], [-11, 0, -3, 11, 24, -2, 'dark'], [-11, 0, -2, 11, 1, 3, 'wood'], [-11, 7, -2, 11, 8, 3, 'wood'], [-11, 14, -2, 11, 15, 3, 'wood'], [-11, 21, -2, 11, 24, 3, 'wood']] },
    cabinet: { name: '玻璃展柜', en: 'Glass cabinet', icon: '🗄', surface: 'cabinet', w: 2, d: 1, h: 3, why: '三层玻璃，立体藏品',
      slots: grid([-4, 4], [16.5, 10.5, 4.25], { z: 0, s: 5, mode: 'relic' }),
      sign: { x: 0, y: 2, z: 4.06, w: 13, h: 2.6 },
      boxes: [[-8, 0, -4, 8, 4, 4, 'base'], [-8, 22, -4, 8, 24, 4, 'base'], [-8, 4, -4, -7, 22, -3, 'metal'], [7, 4, -4, 8, 22, -3, 'metal'], [-8, 4, 3, -7, 22, 4, 'metal'], [7, 4, 3, 8, 22, 4, 'metal'],
        [-6, 21.5, -2, 6, 22, 2, 'glow'], [-7, 4, -3.5, 7, 22, 3.5, 'glass'], [-7, 10, -3, 7, 10.4, 3, 'glass'], [-7, 16, -3, 7, 16.4, 3, 'glass']] },
    pedestal: { name: '展台', en: 'Pedestal', icon: '🏺', surface: 'pedestal', w: 1, d: 1, h: 2, why: '一件珍品，单独打光',
      slots: [{ x: 0, y: 8.2, z: 0, s: 6.5, mode: 'relic', spin: 1 }],
      sign: { x: 0, y: 4.2, z: 2.56, w: 4.6, h: 3.6, src: 'item' },
      boxes: [[-3.5, 0, -3.5, 3.5, 1, 3.5, 'trim'], [-2.5, 1, -2.5, 2.5, 7, 2.5, 'base'], [-3.5, 7, -3.5, 3.5, 8, 3.5, 'trim'], [-1, 8, -1, 1, 8.2, 1, 'glow']] },
    vitrine: { name: '玻璃展台', en: 'Vitrine', icon: '💎', surface: 'pedestal', w: 1, d: 1, h: 2, why: '罩在玻璃里的镇馆之宝',
      slots: [{ x: 0, y: 8.2, z: 0, s: 5.5, mode: 'relic', spin: 1 }],
      sign: { x: 0, y: 4.2, z: 2.56, w: 4.6, h: 3.6, src: 'item' },
      boxes: [[-3.5, 0, -3.5, 3.5, 1, 3.5, 'trim'], [-2.5, 1, -2.5, 2.5, 7, 2.5, 'base'], [-3.5, 7, -3.5, 3.5, 8, 3.5, 'trim'], [-1, 8, -1, 1, 8.2, 1, 'glow'], [-3.25, 8, -3.25, 3.25, 15.5, 3.25, 'glass'], [-3.5, 15.5, -3.5, 3.5, 16, 3.5, 'metal']] },
    podium: { name: '领奖台', en: 'Podium', icon: '🏆', surface: 'pedestal', w: 3, d: 1, h: 2, why: '前三名，各上一级台阶',
      slots: [{ x: 0, y: 6, z: 0, s: 6, mode: 'relic' }, { x: -8, y: 4, z: 0, s: 5.5, mode: 'relic' }, { x: 8, y: 2.5, z: 0, s: 5.5, mode: 'relic' }],
      labels: [{ x: 0, y: 3, z: 4.06, w: 3, h: 3, text: '1' }, { x: -8, y: 2, z: 4.06, w: 3, h: 3, text: '2' }, { x: 8, y: 1.25, z: 4.06, w: 2.5, h: 2.5, text: '3' }],
      boxes: [[-4, 0, -4, 4, 6, 4, 'base'], [-12, 0, -4, -4, 4, 4, 'base'], [4, 0, -4, 12, 2.5, 4, 'base'], [-4, 5.5, -4, 4, 6, 4, 'accent'], [-12, 3.5, -4, -4, 4, 4, 'trim'], [4, 2, -4, 12, 2.5, 4, 'trim']] },
    table: { name: '模型桌', en: 'Model table', icon: '🧩', surface: 'table', w: 3, d: 2, h: 2, why: '六件模型摆满一桌',
      slots: grid([-8, 0, 8], [6.2], { s: 4.5, mode: 'relic' }).map(function (s, i) { s.z = -4; return s; }).concat(grid([-8, 0, 8], [6.2], { s: 4.5, mode: 'relic' }).map(function (s) { s.z = 4; return s; })),
      boxes: [[-11, 0, -7, -10, 5, -6, 'dark'], [10, 0, -7, 11, 5, -6, 'dark'], [-11, 0, 6, -10, 5, 7, 'dark'], [10, 0, 6, 11, 5, 7, 'dark'], [-12, 5, -8, 12, 6, 8, 'wood'], [-12, 6, -1.5, 12, 6.2, 1.5, 'cloth']] },
    timeline: { name: '时间线', en: 'Timeline path', icon: '🧭', surface: 'path', w: 7, d: 1, h: 2, why: '按日期沿小路一站一站走',
      slots: [-22, -11, 0, 11, 22].map(function (x) { return { x: x, y: 10.5, z: 0.5, w: 8, h: 7, mode: 'frame', tag: { x: x, y: 4.2, z: 0.56, w: 6, h: 2.2 } }; }),
      boxes: [[-28, 0, -2.5, 28, 0.5, 2.5, 'metal'], [-22, 5, -0.25, 22, 5.5, 0.25, 'accent']].concat([-22, -11, 0, 11, 22].map(function (x) { return [x - 0.5, 0, -0.5, x + 0.5, 7, 0.5, 'wood']; })) },
    chest: { name: '宝箱', en: 'Treasure chest', icon: '🧰', surface: 'container', w: 1, d: 1, h: 1, cap: 24, why: '一箱装下 24 件，点开看全部',
      slots: [{ x: 0, y: 4.2, z: 0, s: 3, mode: 'relic' }, { x: -2.3, y: 4.2, z: 0.6, s: 2.4, mode: 'relic' }, { x: 2.3, y: 4.2, z: 0.6, s: 2.4, mode: 'relic' }],
      boxes: [[-3.5, 0, -2.5, 3.5, 4, 2.5, 'wood'], [-3.5, 0, -2.6, -2.5, 4.1, 2.6, 'metal'], [2.5, 0, -2.6, 3.5, 4.1, 2.6, 'metal'], [-3.5, 4, -2.5, 3.5, 8, -1.5, 'wood'], [-3.5, 7.4, -2.6, 3.5, 8, -1.4, 'metal'], [-0.6, 2.4, 2.5, 0.6, 3.8, 2.8, 'accent']] }
  };
  // a made thing (文字制作工坊): its size is on the record, its meshes come from the module that registered it (EXT)
  KINDS.text = { name: '文字展品', en: 'Crafted text', icon: '✍️', surface: 'made', custom: true, w: 1, d: 1, h: 1, why: '', slots: [], boxes: [] };
  // a machine you operate (动态陈列装置): which machine and its state are on the record (mx)
  KINDS.machine = { name: '动态陈列装置', en: 'Display machine', icon: '🎠', surface: 'machine', custom: true, w: 1, d: 1, h: 1, why: '', slots: [], boxes: [] };
  var KIND_IDS = ['easel', 'framewall', 'salon', 'bookshelf', 'cabinet', 'pedestal', 'vitrine', 'podium', 'table', 'timeline', 'chest'];
  var LEGACY_KIND = { shelf: 'bookshelf', showcase: 'vitrine', wall: 'framewall', easel: 'easel' };
  function capOf(kind) { var k = KINDS[kind]; return k ? (k.cap || k.slots.length) : 0; }

  /* ================================================================ pure helpers */
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // 69 → 70: one card (cardId) becomes slot 0; old kinds map to the new fixtures; the centre snaps to the block grid
  function normalize(d) {
    var kind = KINDS[d.kind] ? d.kind : (LEGACY_KIND[d.kind] || 'easel');
    var o = { id: String(d.id), kind: kind, x: +d.x || 0, y: Math.round(+d.y || 0), z: +d.z || 0, rot: (d.rot | 0) & 3, it: [] };
    var cap = capOf(kind), src = Array.isArray(d.it) ? d.it : (d.cardId ? [d.cardId] : []);
    for (var i = 0; i < Math.min(cap, src.length); i++) o.it.push(src[i] ? String(src[i]) : null);
    while (o.it.length && o.it[o.it.length - 1] == null) o.it.pop();
    if (THEMES[d.theme]) o.theme = d.theme;
    if (d.ex) o.ex = String(d.ex);
    if (d.label) o.label = String(d.label).slice(0, 60);
    if (d.list) o.list = String(d.list);
    if (KINDS[kind].custom) { o.w = Math.max(1, Math.min(12, Math.round(+d.w || 1))); o.d = Math.max(1, Math.min(4, Math.round(+d.d || 1))); o.h = Math.max(1, Math.min(8, Math.round(+d.h || 1))); if (d.tx && typeof d.tx === 'object') o.tx = clone(d.tx); if (d.mx && typeof d.mx === 'object') o.mx = clone(d.mx); }
    return snap(o);
  }
  // the four props 69 seeded by itself (on sea rocks, with sample cards): gone unless someone moved or edited them
  var SEED69 = { 'disp-1': [18.5, 22.5, 'easel'], 'disp-2': [32.5, 26.5, 'shelf'], 'disp-3': [24.5, 35.5, 'showcase'], 'disp-4': [15.5, 28.5, 'wall'] };
  function migrate(list) {
    return (list || []).filter(function (d) {
      var s = d && SEED69[d.id];
      return d && d.id && !(s && s[0] === d.x && s[1] === d.z && s[2] === d.kind && /^r-art-/.test(d.room || ''));
    }).map(normalize);
  }
  function dims(d) { var k = KINDS[d.kind]; if (k.custom) k = { w: d.w || 1, d: d.d || 1, h: d.h || 1 }; return (d.rot & 1) ? { w: k.d, d: k.w, h: k.h } : { w: k.w, d: k.d, h: k.h }; }
  function rect(d) { var m = dims(d), x0 = Math.round(d.x - m.w / 2), z0 = Math.round(d.z - m.d / 2); return { x0: x0, z0: z0, x1: x0 + m.w - 1, z1: z0 + m.d - 1, y: d.y, h: m.h }; }
  function snap(d) { var m = dims(d), r = rect(d); d.x = r.x0 + m.w / 2; d.z = r.z0 + m.d / 2; return d; }
  function hits(a, b) { return a.x0 <= b.x1 && b.x0 <= a.x1 && a.z0 <= b.z1 && b.z0 <= a.z1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1; }
  // the fixture's cells plus the one row in front of it (where you stand to look)
  function frontOf(r, rot) { var f = FRONT[rot & 3]; return { x0: r.x0 + Math.min(0, f[0]), x1: r.x1 + Math.max(0, f[0]), z0: r.z0 + Math.min(0, f[1]), z1: r.z1 + Math.max(0, f[1]), y: r.y, h: r.h }; }
  function bounds(d) { var m = dims(d), r = rect(d); return { x: r.x0 + m.w / 2, y: d.y + m.h / 2, z: r.z0 + m.d / 2, w: m.w, h: m.h, d: m.d }; }
  // which quarter turn makes the front (+z at rot 0) look along (dx, dz)
  function rotToward(dx, dz) { return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz >= 0 ? 0 : 2); }
  var FRONT = [[0, 1], [1, 0], [0, -1], [-1, 0]], ALONG = [[1, 0], [0, -1], [-1, 0], [0, 1]];   // front normal · local +x, per quarter turn

  function yearOf(c) {
    var v = c && (c.date || c.due || c.dueDate);
    if (v) { var t = typeof v === 'number' ? new Date(v) : new Date(String(v)); if (!isNaN(t)) return t.getFullYear() + (t.getMonth() + 1) / 100 + t.getDate() / 10000; }
    var m = /(?:^|[^0-9])(1[0-9]{3}|20[0-9]{2})(?![0-9])/.exec(String(c && c.title || ''));
    return m ? +m[1] : null;
  }
  // 策展: how to show this list, best first, each with its reason
  function curate(list) {
    var cards = (list && list.cards) || [], n = cards.length, pics = 0, dated = 0, sc = {}, why = {};
    cards.forEach(function (c) { if (c.pic) pics++; if (yearOf(c) != null) dated++; });
    function add(k, v, w) { sc[k] = (sc[k] || 0) + v; if (w && (!why[k] || v >= 3)) why[k] = w; }
    if (!n) return [];
    if (n === 1) { add('vitrine', 6, '只有一件：罩在玻璃里当镇馆之宝'); add('pedestal', 5, '只有一件：单独上展台'); add('easel', pics ? 5 : 2, '只有一张：立在画架上'); }
    else if (n <= 3) { add('podium', 6, n + ' 件：每件上一级领奖台'); add('pedestal', 4, n + ' 件：一件一个展台'); add('easel', pics ? 4 : 1, n + ' 张：一张一个画架'); }
    if (n >= 3 && dated / n >= 0.6) add('timeline', 7, dated + '/' + n + ' 张带年份或日期：按时间排成一条路');
    if (n >= 2 && pics / n >= 0.5) { add('salon', n <= 5 ? 6 : 3, pics + ' 张有图：一张主图配四张小图'); add('framewall', n > 5 ? 6 : 4, pics + ' 张有图：整齐排成画廊墙'); }
    if (n >= 4 && pics / n < 0.5) add('bookshelf', n >= 7 ? 6 : 3, '多是文字卡：像书一样封面朝外，一架 12 张');
    if (n >= 4 && n <= 12) { add('cabinet', n <= 6 ? 5 : 4, n + ' 件：分三层放进玻璃展柜'); add('table', n <= 6 ? 4 : 3, n + ' 件：摆满一张模型桌'); }
    if (n >= 13) { add('chest', 3, n + ' 件很多：一个宝箱装 24 件，点开看全部'); add('bookshelf', 2, n + ' 张：书架最省地方'); add('framewall', 1, n + ' 张：多排几面画廊墙'); }
    if (n >= 4) add('framewall', 1, '通用：排成画廊墙');
    return Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a] || KIND_IDS.indexOf(a) - KIND_IDS.indexOf(b); }).slice(0, 3).map(function (k) { return { kind: k, why: why[k] || KINDS[k].why, score: sc[k], fixtures: Math.min(MAXFIX, Math.ceil(n / capOf(k))), left: Math.max(0, n - MAXFIX * capOf(k)) }; });
  }
  var MAXFIX = 4;
  function sortCards(cards, mode, seed) {
    var a = cards.slice();
    if (mode === 'title') a.sort(function (p, q) { return String(p.title).localeCompare(String(q.title), 'zh'); });
    else if (mode === 'date') a.sort(function (p, q) { var x = yearOf(p), y = yearOf(q); return (x == null ? 1e9 : x) - (y == null ? 1e9 : y); });
    else if (mode === 'pic') a.sort(function (p, q) { return (q.pic ? 1 : 0) - (p.pic ? 1 : 0); });
    else if (mode === 'shuffle') { var s = (seed >>> 0) || 1; for (var i = a.length - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; var j = s % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } }
    return a;
  }
  // a row of fixtures, side by side with one block between, centred on (cx, cz) and all facing the same way
  function planRow(kind, count, cx, cz, rot) {
    var k = KINDS[kind], gap = 1, total = count * k.w + (count - 1) * gap, ax = ALONG[rot & 3], out = [];
    for (var i = 0; i < count; i++) {
      var off = -total / 2 + k.w / 2 + i * (k.w + gap);
      out.push(snap({ id: '_row' + i, kind: kind, rot: rot & 3, x: cx + ax[0] * off, z: cz + ax[1] * off, y: 0 }));
    }
    return out;
  }
  function spiral(R) {
    var out = [];
    for (var dz = -R; dz <= R; dz++) for (var dx = -R; dx <= R; dx++) out.push([dx, dz, dx * dx + dz * dz]);
    return out.sort(function (a, b) { return a[2] - b[2]; });
  }

  var PURE = { VERSION: VERSION, KINDS: KINDS, KIND_IDS: KIND_IDS, THEMES: THEMES, capOf: capOf, normalize: normalize, migrate: migrate, dims: dims, rect: rect, snap: snap, hits: hits, frontOf: frontOf, bounds: bounds, rotToward: rotToward, curate: curate, sortCards: sortCards, planRow: planRow, yearOf: yearOf, hash: hash, FRONT: FRONT, ALONG: ALONG };
  if (typeof module === 'object' && module.exports) { module.exports = PURE; return; }
  if (root.MinestVoxelDisplays && root.MinestVoxelDisplays.VERSION === VERSION) return;

  /* ================================================================ cards: the island's board, read live */
  var T = function () { return root.THREE; };
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function picOf(c) { var v = c && c.cover && c.cover.type !== 'color' && c.cover.type !== 'link' && (c.cover.value || c.cover.url); return v || (c && typeof c.image === 'string' ? c.image : '') || ''; }
  function boards() { try { return (root.MinestAI && root.MinestAI.boards && root.MinestAI.boards()) || []; } catch (e) { return []; } }
  var IX = { key: '', lists: [], byRef: {}, byId: {}, at: 0 };
  function card(c, L, ref) {
    return { ref: ref, id: c.id, title: String(c.title || c.term || '卡片'), zh: c.titleZh && c.titleZh !== c.title ? String(c.titleZh) : '', desc: String(c.meaning || c.desc || c.text || ''), pic: picOf(c), date: c.date || c.due || c.dueDate || null, done: !!c.complete, mastery: c.mastery || 0, list: L.title, lid: L.id };
  }
  // lists as My World counts them: a column's plain cards are one list, a card with sub-cards is a list of its own
  function index(bid) {
    var now = Date.now(), bs = boards(), b = bs.filter(function (x) { return x.id === bid; })[0] || bs[0];
    var key = (b ? b.id : '') + ':' + bs.length;
    if (IX.key === key && IX.board === b && now - IX.at < 4000) return IX;
    var lists = [], byRef = {}, byId = {};
    function reg(L, c, ref) { var k = card(c, L, ref); L.cards.push(k); byRef[ref] = k; if (!byId[c.id]) byId[c.id] = k; }
    if (b) (b.columns || []).forEach(function (col) {
      var L = { id: col.id, title: String(col.title || 'List'), cards: [] };
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (c.stack && c.stack.length) { var S = { id: c.id, title: String(c.title || 'List'), cards: [] }; c.stack.forEach(function (s) { if (s && s.id) reg(S, s, c.id + '/' + s.id); }); if (S.cards.length) lists.push(S); }
        else reg(L, c, col.id + '/' + c.id);
      });
      if (L.cards.length) lists.push(L);
    });
    bs.forEach(function (ob) { if (ob === b) return; (ob.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id && !byId[c.id]) byId[c.id] = card(c, { id: col.id, title: String(col.title || '') }, col.id + '/' + c.id); }); }); });   // 69 kept bare card ids of any board
    IX = { key: key, board: b, bid: b ? b.id : '', title: b ? String(b.title || '') : '', lists: lists, byRef: byRef, byId: byId, at: now };
    return IX;
  }
  function cardOf(ix, ref) { if (!ref) return null; return ix.byRef[ref] || ix.byId[ref] || ix.byId[String(ref).split('/').pop()] || null; }
  function listOf(ix, id) { return ix.lists.filter(function (L) { return L.id === id; })[0] || null; }

  /* ================================================================ pictures and textures */
  var IMG = {}, CACHE = {}, bumpT = 0, dirtyAll = false;
  function pic(url) {   // 0 loading · 1 ready · 2 no picture (failed, or its server does not allow reading it)
    if (!url) return null;
    var e = IMG[url]; if (e) return e;
    e = IMG[url] = { st: 0, img: new Image() };
    if (!/^data:|^blob:/.test(url)) e.img.crossOrigin = 'anonymous';
    e.img.onload = function () { e.st = 1; bump(); };
    e.img.onerror = function () { e.st = 2; bump(); };
    e.img.src = url;
    return e;
  }
  function bump() { clearTimeout(bumpT); bumpT = setTimeout(function () { if (LAST) render(LAST); }, 120); }
  function picState(c) { if (!c || !c.pic) return 2; var e = pic(c.pic); return e.st; }
  function hsl(h, s, l) { return 'hsl(' + Math.round(h) + ',' + Math.round(s) + '%,' + Math.round(l) + '%)'; }
  function hueOf(c) { return hash(c.lid || c.list || c.title) % 360; }
  var EMOJI = null; try { EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u'); } catch (e) {}
  function glyph(title) { var a = Array.from(String(title || '?').trim()), g = a[0] || '?'; if (EMOJI && EMOJI.test(g) && a[1] === '️') g += a[1]; return { g: /[a-z]/.test(g) ? g.toUpperCase() : g, emoji: !!(EMOJI && EMOJI.test(g)) }; }
  function canvas(w, h) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
  function wrap(g, text, maxW, maxLines) {
    var out = [], cur = '', parts = String(text).split(/(\s+)/).reduce(function (a, p) { if (/[^\x00-\xff]/.test(p)) Array.from(p).forEach(function (ch) { a.push(ch); }); else a.push(p); return a; }, []);
    for (var i = 0; i < parts.length; i++) {
      var t = cur + parts[i];
      if (g.measureText(t.trim()).width > maxW && cur.trim()) { out.push(cur.trim()); cur = parts[i]; if (out.length === maxLines) break; } else cur = t;
    }
    if (out.length < maxLines && cur.trim()) out.push(cur.trim());
    else if (out.length === maxLines && i < parts.length) { var last = out[maxLines - 1]; while (last.length > 1 && g.measureText(last + '…').width > maxW) last = last.slice(0, -1); out[maxLines - 1] = last + '…'; }
    return out;
  }
  function coverFit(g, img, x, y, w, h) { var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k; g.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h); }
  function tex(cv, pixel) {
    var t = new (T().CanvasTexture)(cv);
    t.magFilter = pixel ? T().NearestFilter : T().LinearFilter; t.minFilter = T().LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  }
  // one cached thing (texture + material, or geometry) with a reference count, freed when nobody shows it any more
  function res(key, make) { var r = CACHE[key]; if (!r) { r = CACHE[key] = make(); r.n = 0; } return r; }
  function prune() {
    var keys = Object.keys(CACHE); if (keys.length < 160) return;
    keys.forEach(function (k) { var r = CACHE[k]; if (r.n > 0 || r.keep) return; if (r.free) r.free(); if (r.map) r.map.dispose(); if (r.mat) r.mat.dispose(); if (r.geo) r.geo.dispose(); delete CACHE[k]; });
  }
  // a card as a framed pixel picture (w × h in px of the fixture, 12 canvas px each)
  function faceRes(c, w, h, th, st, book) {
    var key = 'f|' + (c ? c.ref + '|' + c.title + '|' + c.pic + '|' + st : 'empty') + '|' + w + 'x' + h + '|' + th.name + (book ? '|b' : '');
    return res(key, function () {
      var U = 20, W = Math.round(w * U), H = Math.round(h * U), cv = canvas(W, H), g = cv.getContext('2d'), b = Math.round(U * (book ? 0.3 : 0.75));
      g.fillStyle = th.wood; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, H - b / 2, W, b / 2); g.fillRect(W - b / 2, 0, b / 2, H);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 0, W, b / 3); g.fillRect(0, 0, b / 3, H);
      var x = b, y = b, iw = W - 2 * b, ih = H - 2 * b;
      g.fillStyle = th.paper; g.fillRect(x, y, iw, ih);
      if (!c) {
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.strokeRect(x + 6, y + 6, iw - 12, ih - 12);
      } else {
        var th2 = Math.max(18, Math.round(ih * (book ? 0.46 : 0.3))), ph = ih - th2, e = st === 1 && pic(c.pic), drawn = false;
        if (e) try {   // the picture drawn small and blown up in blocks: a voxel picture
            var q = canvas(Math.max(8, Math.round(iw / 3)), Math.max(8, Math.round(ph / 3))); coverFit(q.getContext('2d'), e.img, 0, 0, q.width, q.height);
            g.imageSmoothingEnabled = false; g.drawImage(q, x, y, iw, ph); drawn = true;
          } catch (err) {}
        if (!drawn) {
          var hu = hueOf(c), gl = glyph(c.title);
          g.fillStyle = hsl(hu, 55, 62); g.fillRect(x, y, iw, ph);
          g.fillStyle = hsl(hu, 55, 54); for (var i = 0; i < 6; i++) g.fillRect(x + ((hash(c.ref + i) % 100) / 100) * (iw - 10), y + ((hash(i + c.ref) % 100) / 100) * (ph - 10), 10, 10);
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 ' + Math.round(ph * 0.62) + 'px ' + (gl.emoji ? 'serif' : 'system-ui,sans-serif');
          g.fillText(gl.g, x + iw / 2, y + ph / 2 + 2);
        }
        g.fillStyle = th.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
        var fs = Math.max(11, Math.min(19, Math.round(iw / (book ? 6.6 : 8.2)))); g.font = '700 ' + fs + 'px system-ui,sans-serif';
        var lines = wrap(g, c.title, iw - 6, Math.max(1, Math.min(book ? 3 : 2, Math.floor(th2 / (fs + 1)))));
        lines.forEach(function (ln, i2) { g.fillText(ln, x + iw / 2, y + ph + th2 / 2 + (i2 - (lines.length - 1) / 2) * (fs + 1)); });
      }
      var map = tex(cv, false);
      return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x4a4a4a, emissiveMap: map }) };
    });
  }
  // a line of text on a small plate (signs, year tags, podium numbers)
  function signRes(text, w, h, bg, fg) {
    return res('s|' + text + '|' + w + 'x' + h + '|' + bg + fg, function () {
      var U = 16, W = Math.max(16, Math.round(w * U)), H = Math.max(12, Math.round(h * U)), cv = canvas(W, H), g = cv.getContext('2d');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, H - 2, W, 2); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, 2);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      var fs = Math.round(H * 0.62); g.font = '800 ' + fs + 'px system-ui,sans-serif';
      var lines = wrap(g, text, W - 8, H > 44 ? 2 : 1);
      if (lines.length > 1) { fs = Math.round(H * 0.36); g.font = '800 ' + fs + 'px system-ui,sans-serif'; lines = wrap(g, text, W - 8, 2); }
      while (lines.length === 1 && fs > 9 && g.measureText(lines[0]).width > W - 8) { fs--; g.font = '800 ' + fs + 'px system-ui,sans-serif'; }
      lines.forEach(function (ln, i) { g.fillText(ln, W / 2, H / 2 + 1 + (i - (lines.length - 1) / 2) * (fs + 2)); });
      var map = tex(cv, false);
      return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x505050, emissiveMap: map }) };
    });
  }

  /* ================================================================ voxel geometry */
  var SHADE = [0.86, 0.86, 1, 0.62, 0.94, 0.8];   // +x −x +y −y +z −z
  function Buf() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; }
  Buf.prototype.quad = function (v, nx, ny, nz, r, g, b, uv) {
    var o = this.p.length / 3;
    for (var k = 0; k < 4; k++) { this.p.push(v[k * 3], v[k * 3 + 1], v[k * 3 + 2]); this.n.push(nx, ny, nz); this.c.push(r, g, b); this.u.push(uv[k * 2], uv[k * 2 + 1]); }
    this.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  // a box, optionally only some faces (mask bits: +x −x +y −y +z −z); k scales uv (texels follow the world's 16 per block)
  Buf.prototype.box = function (x0, y0, z0, x1, y1, z1, col, mask, k) {
    if (mask == null) mask = 63; k = k || 1;
    var f = this, r = col[0], g = col[1], b = col[2];
    function q(bit, v, nx, ny, nz, uv) { if (mask & (1 << bit)) { var s = SHADE[bit]; f.quad(v, nx, ny, nz, r * s, g * s, b * s, uv.map(function (t) { return t * k; })); } }
    q(0, [x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1], 1, 0, 0, [z1, y0, z0, y0, z0, y1, z1, y1]);
    q(1, [x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0], -1, 0, 0, [z0, y0, z1, y0, z1, y1, z0, y1]);
    q(2, [x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0], 0, 1, 0, [x0, z1, x1, z1, x1, z0, x0, z0]);
    q(3, [x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1], 0, -1, 0, [x0, z0, x1, z0, x1, z1, x0, z1]);
    q(4, [x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1], 0, 0, 1, [x0, y0, x1, y0, x1, y1, x0, y1]);
    q(5, [x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0], 0, 0, -1, [x1, y0, x0, y0, x0, y1, x1, y1]);
  };
  Buf.prototype.geo = function () {
    if (!this.i.length) return null;
    var g = new (T().BufferGeometry)(), F = T().Float32BufferAttribute;
    g.setAttribute('position', new F(this.p, 3)); g.setAttribute('normal', new F(this.n, 3)); g.setAttribute('color', new F(this.c, 3)); g.setAttribute('uv', new F(this.u, 2));
    g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  };
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  var MAT = null;
  function mats() {
    if (MAT) return MAT;
    var cv = canvas(16, 16), g = cv.getContext('2d'), s = 7;   // the grain every block face of the world has
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; var v = 222 + (s >>> 16) % 34; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x, y, 1, 1); }
    var grain = tex(cv, true); grain.wrapS = grain.wrapT = T().RepeatWrapping;
    MAT = {
      solid: new (T().MeshLambertMaterial)({ vertexColors: true, map: grain }),
      relic: new (T().MeshLambertMaterial)({ vertexColors: true, emissive: 0x2a2a2a }),
      glow: new (T().MeshBasicMaterial)({ vertexColors: true }),
      glass: new (T().MeshLambertMaterial)({ color: 0xbfe6ff, transparent: true, opacity: 0.26, depthWrite: false, emissive: 0x223344 }),
      plane: new (T().PlaneGeometry)(1, 1), box: new (T().BoxGeometry)(1, 1, 1)
    };
    return MAT;
  }
  // the fixture itself: three merged meshes at most (solid · glow · glass), cached per kind and theme; in block units
  function fixtureRes(kind, theme) {
    return res('k|' + kind + '|' + theme, function () {
      var K = KINDS[kind], th = THEMES[theme], S = new Buf(), G = new Buf(), L = new Buf(), hw = K.w * 4, hd = K.d * 4;
      K.boxes.forEach(function (b, i) {
        var m = b[6], t = m === 'glass' ? L : m === 'glow' ? G : S, c = m === 'glass' ? [1, 1, 1] : m === 'glow' ? [1, 0.93, 0.7] : rgb(th[m] || th.base);
        var j = 1 - ((hash(kind + i) % 7) / 100);   // each part a touch different, like the world's blocks
        t.box(b[0] * PX, b[1] * PX, b[2] * PX, b[3] * PX, b[4] * PX, b[5] * PX, [c[0] * j, c[1] * j, c[2] * j]);
      });
      if (K.surface !== 'container') S.box(-hw * PX + 0.02, -1, -hd * PX + 0.02, hw * PX - 0.02, 0, hd * PX - 0.02, rgb(th.base), 51);   // footing: shows only where the ground dips under it
      var r = { keep: 1, solid: S.geo(), glow: G.geo(), glass: L.geo() };
      return r;
    });
  }
  // a card as a voxel relic: its picture (or its first letter / emoji on a tile) on a 16 × 16 grid, pushed out into blocks
  var NREL = 16;
  function relicRes(c, st) {
    return res('r|' + c.ref + '|' + c.title + '|' + c.pic + '|' + st, function () {
      var N = NREL, cv = canvas(N, N), g = cv.getContext('2d'), d = null, raised = null, e = st === 1 && pic(c.pic);
      if (e) try { coverFit(g, e.img, 0, 0, N, N); d = g.getImageData(0, 0, N, N).data; } catch (err) { d = null; g.clearRect(0, 0, N, N); }
      if (!d) {
        var gl = glyph(c.title), hu = hueOf(c);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        if (gl.emoji) { g.font = '14px serif'; g.fillText(gl.g, N / 2, N / 2 + 1); d = g.getImageData(0, 0, N, N).data; }
        else {
          g.fillStyle = '#fff'; g.font = '800 13px system-ui,sans-serif'; g.fillText(gl.g, N / 2, N / 2 + 1);
          var a = g.getImageData(0, 0, N, N).data; d = new Uint8ClampedArray(N * N * 4); raised = new Uint8Array(N * N);
          var bg = T() ? new (T().Color)(hsl(hu, 58, 52)) : null, rim = new (T().Color)(hsl(hu, 58, 38));
          for (var p = 0; p < N * N; p++) {
            var x = p % N, y = (p / N) | 0, edge = x === 0 || y === 0 || x === N - 1 || y === N - 1, on = a[p * 4 + 3] > 96, col = on ? { r: 1, g: 1, b: 1 } : edge ? rim : bg;
            d[p * 4] = col.r * 255; d[p * 4 + 1] = col.g * 255; d[p * 4 + 2] = col.b * 255; d[p * 4 + 3] = 255; raised[p] = on || edge ? 1 : 0;
          }
        }
      }
      var B = new Buf(), t = 1, filled = function (x, y) { return x >= 0 && y >= 0 && x < N && y < N && d[(y * N + x) * 4 + 3] > 127; }, up = function (x, y) { return filled(x, y) && raised && raised[y * N + x]; };
      for (var py = 0; py < N; py++) for (var px = 0; px < N; px++) {
        if (!filled(px, py)) continue;
        var o = (py * N + px) * 4, col2 = [d[o] / 255, d[o + 1] / 255, d[o + 2] / 255], x0 = px - N / 2, y0 = N - 1 - py;
        var mask = 48 | (filled(px + 1, py) ? 0 : 1) | (filled(px - 1, py) ? 0 : 2) | (filled(px, py - 1) ? 0 : 4) | (filled(px, py + 1) ? 0 : 8);
        B.box(x0, y0, -t, x0 + 1, y0 + 1, t, col2, mask);
        if (up(px, py)) {
          var m2 = (up(px + 1, py) ? 0 : 1) | (up(px - 1, py) ? 0 : 2) | (up(px, py - 1) ? 0 : 4) | (up(px, py + 1) ? 0 : 8);
          B.box(x0, y0, t, x0 + 1, y0 + 1, t + 0.7, col2, m2 | 16); B.box(x0, y0, -t - 0.7, x0 + 1, y0 + 1, -t, col2, m2 | 32);
        }
      }
      return { geo: B.geo() };
    });
  }

  /* ================================================================ the scene: one group per fixture, rebuilt only when it changed */
  var EXT = {}, lastCtx = null;
  var LIVE = {}, GROUP = null, LAST = null, SPIN = [], rafOn = false, STATS = { fixtures: 0, items: 0, rebuilt: 0 };
  function themeOf(d) { return THEMES[d.theme] ? d.theme : 'aegean'; }
  function plate(r, w, h, x, y, z) { var m = new (T().Mesh)(mats().plane, r.mat); m.scale.set(w * PX, h * PX, 1); m.position.set(x * PX, y * PX, z * PX); return m; }
  function build(d, ix, shadows) {
    var K = KINDS[d.kind], thId = themeOf(d), th = THEMES[thId], M = mats(), grp = new (T().Group)(), used = [];
    function use(r) { r.n++; used.push(r); return r; }
    grp.name = 'vd-' + d.id; grp.userData = { isDisplay: true, dispId: d.id, kind: d.kind, used: used };
    if (K.custom) {
      if (EXT[d.kind]) try { EXT[d.kind].build(d, grp, { use: use, shadows: shadows, ix: ix }); } catch (err) { if (root.console) console.error('voxel-displays ext', err); }
      grp.position.set(d.x, d.y, d.z); grp.rotation.y = d.rot * Math.PI / 2;
      return grp;
    }
    var fx = use(fixtureRes(d.kind, thId));
    [['solid', M.solid], ['glow', M.glow], ['glass', M.glass]].forEach(function (p) {
      if (!fx[p[0]]) return; var m = new (T().Mesh)(fx[p[0]], p[1]); m.userData.part = p[0];
      if (p[0] === 'solid') { m.castShadow = !!shadows; m.receiveShadow = !!shadows; } else if (p[0] === 'glass') m.renderOrder = 2;
      grp.add(m);
    });
    var cards = (d.it || []).map(function (ref) { return cardOf(ix, ref); }), first = cards.filter(Boolean)[0];
    if (K.sign) {
      var text = K.sign.src === 'item' ? (first ? first.title : '') : (d.label || (d.list && (listOf(ix, d.list) || {}).title) || '');
      if (text) grp.add(plate(use(signRes(text, K.sign.w, K.sign.h, K.sign.src === 'item' ? th.accent : th.trim, K.sign.src === 'item' ? '#2b2205' : '#ffffff')), K.sign.w, K.sign.h, K.sign.x, K.sign.y, K.sign.z));
    }
    (K.labels || []).forEach(function (L) { grp.add(plate(use(signRes(L.text, L.w, L.h, th.accent, '#2b2205')), L.w, L.h, L.x, L.y, L.z)); });
    K.slots.forEach(function (s, i) {
      var c = cards[i] || null, st = c ? picState(c) : 2, node = null;
      if (s.mode === 'frame') {
        var f = use(faceRes(c, s.w, s.h, th, st));
        var side = use(res('m|side|' + thId, function () { return { mat: new (T().MeshLambertMaterial)({ color: new (T().Color)(th.wood) }) }; })).mat;
        node = new (T().Mesh)(M.box, [side, side, side, side, f.mat, side]);
        node.scale.set(s.w * PX, s.h * PX, 0.75 * PX); node.position.set(s.x * PX, s.y * PX, (s.z + 0.375) * PX);
        if (s.tag && c) { var yr = yearOf(c); grp.add(plate(use(signRes(yr != null ? String(Math.floor(yr)) : '第 ' + (i + 1) + ' 站', s.tag.w, s.tag.h, th.accent, '#2b2205')), s.tag.w, s.tag.h, s.tag.x, s.tag.y, s.tag.z)); }
      } else if (!c) return;
      else if (s.mode === 'book') {
        var bk = use(faceRes(c, s.w, s.h, th, st, true)), spine = use(res('m|' + hueOf(c), function () { return { mat: new (T().MeshLambertMaterial)({ color: new (T().Color)(hsl(hueOf(c), 50, 42)) }) }; }));
        node = new (T().Mesh)(M.box, [spine.mat, spine.mat, spine.mat, spine.mat, bk.mat, spine.mat]);
        node.scale.set(s.w * PX, s.h * PX, 2.2 * PX); node.position.set(s.x * PX, (s.y + s.h / 2) * PX, (s.z + 1.1) * PX);
      } else {
        var rl = use(relicRes(c, st)); if (!rl.geo) return;
        node = new (T().Mesh)(rl.geo, M.relic);
        var k = s.s * PX / NREL; node.scale.set(k, k, k); node.position.set(s.x * PX, s.y * PX, s.z * PX);
        node.castShadow = !!shadows;
        if (s.spin) SPIN.push(node);
      }
      node.userData = { isItem: true, slot: i, ref: c ? c.ref : null };
      grp.add(node); if (c) STATS.items++;
    });
    grp.position.set(d.x, d.y, d.z); grp.rotation.y = d.rot * Math.PI / 2;
    return grp;
  }
  function drop(id) {
    var L = LIVE[id]; if (!L) return;
    (L.grp.userData.used || []).forEach(function (r) { r.n--; });
    if (L.grp.userData.stop) L.grp.userData.stop();
    SPIN = SPIN.filter(function (m) { return m.parent !== L.grp; });
    if (L.grp.parent) L.grp.parent.remove(L.grp);
    delete LIVE[id];
  }
  function sigOf(d, ix) { if (KINDS[d.kind].custom) return JSON.stringify(d) + '§' + (EXT[d.kind] && EXT[d.kind].sig ? EXT[d.kind].sig(d, ix) : ''); return JSON.stringify(d) + '§' + (d.it || []).map(function (ref) { var c = cardOf(ix, ref); return c ? c.title + '~' + c.pic + '~' + picState(c) : '-'; }).join('|') + '§' + (d.list ? (listOf(ix, d.list) || {}).title : ''); }
  function render(host) {
    if (!T() || !host) return 0;
    LAST = host;
    var scene = host.scene(); if (!scene) return 0;
    if (!GROUP) { GROUP = new (T().Group)(); GROUP.name = 'minest-voxel-displays-70'; }
    if (GROUP.parent !== scene) { Object.keys(LIVE).forEach(drop); scene.add(GROUP); }
    var ds = list(host), ix = index(host.boardId()), seen = {}, shadows = host.shadows ? host.shadows() : true, n = 0;
    ds.forEach(function (d) {
      seen[d.id] = 1;
      var sig = sigOf(d, ix), L = LIVE[d.id];
      if (L && L.sig === sig) return;
      if (L) drop(d.id);
      var grp = build(d, ix, shadows); GROUP.add(grp); LIVE[d.id] = { sig: sig, grp: grp }; n++;
    });
    Object.keys(LIVE).forEach(function (id) { if (!seen[id]) { drop(id); n++; } });
    if (n) { STATS.rebuilt += n; STATS.fixtures = ds.length; STATS.items = ds.reduce(function (a, d) { return a + (d.it || []).filter(function (r) { return cardOf(ix, r); }).length; }, 0); prune(); }
    if (SPIN.length && !rafOn) { rafOn = true; requestAnimationFrame(tick); }
    return n;
  }
  function tick(t) {
    if (!SPIN.length || !GROUP || !GROUP.parent || !root.__oiaOn) { rafOn = false; return; }
    for (var i = 0; i < SPIN.length; i++) SPIN[i].rotation.y = t / 1600 + i;
    requestAnimationFrame(tick);
  }

  /* ================================================================ the list of fixtures: stored · migrated from 69 · or the opening exhibition */
  var memo = { src: null, key: '', out: null }, START = {};
  function list(host) {
    var rec = host.record(), src = rec && rec.displays, key = (host.boardId() || '') + ':' + (rec && rec.dv || 0) + ':' + (src ? src.length : -1);
    if (src && memo.src === src && memo.key === key) return memo.out;
    var out = rec && rec.dv === 2 ? (src || []).map(normalize) : migrate(src);
    if (!(rec && rec.dv === 2) && !out.length) return starter(host);
    memo = { src: src, key: key, out: out };
    return out;
  }
  // nothing set up yet: the island's first two lists, shown on the main square the way the curator would
  function starter(host) {
    var w = host.world(), bid = host.boardId() || ''; if (!w) return [];
    if (START[bid]) return START[bid];
    var ix = index(bid), lists = ix.lists.filter(function (L) { return L.cards.length >= 2; }).slice(0, 2);
    if (!lists.length) return [];
    var lm = (w.landmarks || []).filter(function (l) { return l.id === 'platsani'; })[0] || { x: w.W / 2, z: w.D / 2 }, out = [];
    lists.forEach(function (L, i) {
      var c = curate(L)[0]; if (!c) return;
      var made = exhibit(host, out, L, c.kind, { x: lm.x + (i ? 7 : -7), z: lm.z + 4, y: null, fx: 0, fz: -1 }, 'x-start-' + i, 28);
      out = out.concat(made.list);
    });
    START[bid] = out;
    return out;
  }

  /* ================================================================ the world: ground, free sites */
  var BAD = null;
  function badTop(w) { if (!BAD) { BAD = {}; ['LEAF', 'FLOWER', 'LAMP', 'POOL', 'THATCH', 'AWN_B', 'AWN_O', 'DOME', 'TILE', 'GLASS'].forEach(function (n) { if (w.B && w.B[n] != null) BAD[w.B[n]] = 1; }); } return BAD; }
  function ground(w, x, z, from) { for (var y = Math.min(w.H - 1, from == null ? w.H - 1 : from); y >= 0; y--) if (w.blocks[w.idx(x, y, z)] !== 0) return y; return -1; }
  // can this fixture stand here? → { ok, y } or { ok: false, why }
  // clear: also keep the row in front free (of blocks and of other fixtures), for places chosen automatically
  function site(host, d, others, hintY, clear) {
    var w = host.world(), r = rect(d), lo = 1e9, hi = -1, bad = badTop(w), sea = w.WATER_Y == null ? 0 : w.WATER_Y;
    for (var z = r.z0; z <= r.z1; z++) for (var x = r.x0; x <= r.x1; x++) {
      if (!w.inb(x, 1, z)) return { ok: false, why: '出了世界边界' };
      var g = ground(w, x, z, hintY == null ? null : hintY + 3);
      if (g < 0 || g + 1 <= sea) return { ok: false, why: '那里是海' };
      if (bad[w.blocks[w.idx(x, g, z)]]) return { ok: false, why: '那里是屋顶、树或水池' };
      if ((clear || hintY == null) && w.hm && g + 1 !== w.hm[x + w.W * z]) return { ok: false, why: '不在地面上' };   // a place chosen for you is on the terrain itself, not on a pillar, wall or awning (by hand: anywhere level)
      if (hintY != null && Math.abs(g - hintY) > 3) return { ok: false, why: '和你所在的地面高度差太大' };
      lo = Math.min(lo, g); hi = Math.max(hi, g);
    }
    if (hi - lo > (clear ? 0 : 1)) return { ok: false, why: '地面不平' };   // a place chosen for you is level; by hand one block of dip is allowed (the footing fills it)
    var bs = w.buildings || [];
    for (var i = 0; i < bs.length; i++) { var b = bs[i]; if (r.x0 <= b.x1 && b.x0 <= r.x1 && r.z0 <= b.z1 && b.z0 <= r.z1) return { ok: false, why: '被建筑挡住' }; }
    var y = hi + 1;
    for (var yy = y; yy < Math.min(w.H, y + r.h); yy++) for (var z2 = r.z0; z2 <= r.z1; z2++) for (var x2 = r.x0; x2 <= r.x1; x2++) if (w.blocks[w.idx(x2, yy, z2)] !== 0) return { ok: false, why: '上面有东西挡着' };
    var me = { x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1, y: y, h: r.h }, mf = frontOf(me, d.rot);
    if (clear) for (var fz = mf.z0; fz <= mf.z1; fz++) for (var fx = mf.x0; fx <= mf.x1; fx++) {
      if (fx >= r.x0 && fx <= r.x1 && fz >= r.z0 && fz <= r.z1) continue;
      if (!w.inb(fx, y, fz) || w.blocks[w.idx(fx, y, fz)] !== 0 || w.blocks[w.idx(fx, Math.min(w.H - 1, y + 1), fz)] !== 0) return { ok: false, why: '正面被墙挡住' };
    }
    for (var j = 0; j < others.length; j++) {
      var o = others[j]; if (o.id === d.id) continue; var ro = rect(o);
      if (hits(me, ro)) return { ok: false, why: '和「' + KINDS[o.kind].name + '」重叠' };
      if (clear && (hits(mf, ro) || hits(me, frontOf(ro, o.rot)))) return { ok: false, why: '挡住了「' + KINDS[o.kind].name + '」的正面' };
    }
    return { ok: true, y: y };
  }
  var SP = {};
  function near(host, d, others, hintY, R, clear) {   // the closest free place for d around where it is
    var sp = SP[R] || (SP[R] = spiral(R)), x = d.x, z = d.z, why = '';
    for (var i = 0; i < sp.length; i++) { d.x = x + sp[i][0]; d.z = z + sp[i][1]; var s = site(host, d, others, hintY, clear); if (s.ok) { d.y = s.y; return s; } if (!i) why = s.why; }
    d.x = x; d.z = z;
    return { ok: false, why: why || '附近没有空地' };
  }
  function uid(p) { return (p || 'd') + '-' + Date.now().toString(36) + (Math.random() * 1e6 | 0).toString(36); }
  // a whole list as one exhibition: enough fixtures in a row facing the viewer, cards dealt out in order
  function exhibit(host, others, L, kind, at, exId, R) {
    var cap = capOf(kind), cards = L.cards.slice(), n = Math.min(MAXFIX, Math.ceil(cards.length / cap)), rot = rotToward(-at.fx, -at.fz), sp = SP[R || 14] || (SP[R || 14] = spiral(R || 14)), placed = null;
    for (var i = 0; i < sp.length && !placed; i++) {   // the whole row first …
      var row = planRow(kind, n, at.x + sp[i][0], at.z + sp[i][1], rot), ok = true, ys = [];
      for (var j = 0; j < row.length && ok; j++) { var s = site(host, row[j], others.concat(row.slice(0, j)), at.y, true); if (!s.ok) ok = false; else { row[j].y = s.y; ys.push(s.y); } }
      if (ok && Math.max.apply(null, ys) - Math.min.apply(null, ys) <= 1) placed = row;
    }
    if (!placed) {   // … else each one wherever it fits nearby
      placed = [];
      planRow(kind, n, at.x, at.z, rot).forEach(function (d) { if (near(host, d, others.concat(placed), at.y, R || 14, true).ok) placed.push(d); });
    }
    placed.forEach(function (d, k) {
      d.id = exId + '-' + k; d.ex = exId; d.list = L.id; d.label = n > 1 ? L.title + ' ' + (k + 1) + '/' + n : L.title;
      d.it = cards.slice(k * cap, (k + 1) * cap).map(function (c) { return c.ref; });
    });
    return { list: placed, shown: Math.min(cards.length, placed.length * cap), total: cards.length };
  }

  /* ================================================================ picking */
  function ray(host, cx, cy) {
    var cv = host.canvas(), cam = host.camera(); if (!cv || !cam) return null;
    var r = cv.getBoundingClientRect(), rc = new (T().Raycaster)();
    cam.updateMatrixWorld(true);
    rc.setFromCamera(new (T().Vector2)((cx - r.left) / r.width * 2 - 1, 1 - (cy - r.top) / r.height * 2), cam);
    return rc;
  }
  function blockHit(host, rc, max) {   // the first block the ray meets
    var w = host.world(), o = rc.ray.origin, v = rc.ray.direction, st = 0.2;
    for (var t = 0; t < (max || 900); t += st) {
      var x = Math.floor(o.x + v.x * t), y = Math.floor(o.y + v.y * t), z = Math.floor(o.z + v.z * t);
      if (y < 0) return null;
      if (w.inb(x, y, z) && w.blocks[w.idx(x, y, z)] !== 0) return { x: x, y: y, z: z, t: t };
      if (t > 60) st = 0.4;
    }
    return null;
  }
  function pick(host, cx, cy) {
    if (!GROUP || !GROUP.children.length) return null;
    var rc = ray(host, cx, cy); if (!rc) return null;
    var hs = rc.intersectObjects(GROUP.children, true).filter(function (h) { return h.object.userData.part !== 'glass'; });   // taps go through glass
    if (!hs.length) return null;
    var wall = blockHit(host, rc, hs[0].distance + 1); if (wall && wall.t < hs[0].distance - 0.3) return null;   // behind a wall
    var o = hs[0].object, slot = o.userData.isItem ? o.userData.slot : null;
    while (o && !o.userData.isDisplay) o = o.parent;
    return o ? { id: o.userData.dispId, slot: slot } : null;
  }

  /* ================================================================ editing */
  var ui = { list: null, slot: null, picking: false, pickList: null, arm: null, more: false };
  function byId(ds, id) { return (ds || []).filter(function (d) { return d.id === id; })[0] || null; }
  function selOf(ctx) { return byId(list(ctx.host), ctx.sel()); }
  function curList(ix) { return listOf(ix, ui.list) || ix.lists[0] || null; }
  function view(ctx) { return ctx.host.view(); }
  function steps(v, dir) {   // one block along the view: forward / back / left / right snapped to the grid
    var f = Math.abs(v.fx) > Math.abs(v.fz) ? [v.fx > 0 ? 1 : -1, 0] : [0, v.fz > 0 ? 1 : -1], r = [-f[1], f[0]];
    return dir === 'f' ? f : dir === 'b' ? [-f[0], -f[1]] : dir === 'l' ? [-r[0], -r[1]] : r;
  }
  function change(ctx, id, fn, done) {   // one fixture, checked where it would stand, then saved as one undo step
    var ds = list(ctx.host), cur = byId(ds, id); if (!cur) return ctx.toast('先选一个展架');
    var d = clone(cur); fn(d); snap(d);
    var s = site(ctx.host, d, ds, d.y + 1);
    if (!s.ok) return ctx.toast('放不了：' + s.why);
    d.y = s.y;
    ctx.commit(function (next) { var q = byId(next.displays, id); if (q) { q.x = d.x; q.y = d.y; q.z = d.z; q.rot = d.rot; } });
    if (done) ctx.toast(done);
  }
  function edit(ctx, id, fn) { ctx.commit(function (next) { var q = byId(next.displays, id); if (q) fn(q, next); }); }
  function putCard(ctx, ref) {
    var d = selOf(ctx); if (!d) return ctx.toast('先选一个展架');
    var cap = capOf(d.kind), it = (d.it || []).slice(), at = ui.slot;
    if (it.indexOf(ref) >= 0 && it.indexOf(ref) !== at) it[it.indexOf(ref)] = null;   // the same card twice on one fixture: it moves
    if (at == null || at >= cap) { for (at = 0; at < cap; at++) if (!it[at]) break; }
    if (at >= cap) return ctx.toast('「' + KINDS[d.kind].name + '」满了（' + cap + ' 件）· 先取下一件');
    it[at] = ref;
    edit(ctx, d.id, function (q) { q.it = it; });
    var c = cardOf(index(ctx.host.boardId()), ref);
    ui.slot = null; for (var i = at + 1; i < cap; i++) if (!it[i]) { ui.slot = i; break; }   // on to the next empty slot
    ui.picking = ui.slot != null;
    ctx.toast('📄「' + (c ? c.title : '卡片') + '」放到第 ' + (at + 1) + ' 格');
  }
  var ACT = {
    add: function (ctx, kind) {
      kind = KINDS[kind] ? kind : LEGACY_KIND[kind]; if (!kind) return;
      var v = view(ctx), ds = list(ctx.host), d = snap({ id: uid(), kind: kind, x: v.x, z: v.z, y: 0, rot: rotToward(-v.fx, -v.fz), it: [] });
      var s = near(ctx.host, d, ds, v.y, 12, true);
      if (!s.ok) return ctx.toast('附近没有能放「' + KINDS[kind].name + '」的平地：' + s.why);
      ctx.commit(function (next) { next.displays.push(d); });
      ui.slot = null; ui.picking = false; ctx.setSel(d.id); ctx.refresh();
      ctx.toast('＋ ' + KINDS[kind].name + ' · ' + capOf(kind) + ' 格 · 选卡片或「用列表填满」');
    },
    curate: function (ctx, kind) {
      var ix = index(ctx.host.boardId()), L = curList(ix); if (!L) return ctx.toast('这座岛的看板还没有卡片');
      if (!KINDS[kind]) { var c = curate(L)[0]; if (!c) return; kind = c.kind; }
      var made = exhibit(ctx.host, list(ctx.host), L, kind, view(ctx), uid('x'), 16);
      if (!made.list.length) return ctx.toast('附近没有能摆下这个展览的平地 · 换个开阔些的地方');
      ctx.commit(function (next) { made.list.forEach(function (d) { next.displays.push(d); }); });
      ui.slot = null; ui.picking = false; ctx.setSel(made.list[0].id); ctx.refresh();
      ctx.toast('✦「' + L.title + '」→ ' + made.list.length + ' 个' + KINDS[kind].name + ' · ' + made.shown + '/' + made.total + ' 件' + (made.total > made.shown ? '（其余没摆出来）' : '') + ' · ↶ 可撤销');
    },
    auto: function (ctx) { return ACT.curate(ctx, null); },
    move: function (ctx, dir) { var st = steps(view(ctx), dir); change(ctx, ctx.sel(), function (d) { d.x += st[0]; d.z += st[1]; }); },
    rot: function (ctx) { change(ctx, ctx.sel(), function (d) { d.rot = (d.rot + 1) & 3; }); },
    del: function (ctx) {
      var id = ctx.sel(); if (!id) return;
      ctx.commit(function (next) { next.displays = next.displays.filter(function (q) { return q.id !== id; }); });
      ctx.setSel(null); ui.slot = null; ui.picking = false; ctx.refresh(); ctx.toast('展架已移除 · 卡片还在看板上');
    },
    arm: function (ctx) { ui.arm = ui.arm ? null : 'move'; ctx.refresh(); if (ui.arm) ctx.toast('📍 点一下地面，展架就搬到那里'); },
    theme: function (ctx, t) {
      var d = selOf(ctx); if (!d || !THEMES[t]) return;
      ctx.commit(function (next) { next.displays.forEach(function (q) { if (q.id === d.id || (d.ex && q.ex === d.ex)) q.theme = t; }); });
    },
    slot: function (ctx, i) { i = +i; if (ui.slot === i) { ui.slot = null; ui.picking = false; } else { ui.slot = i; var d = selOf(ctx); ui.picking = !!d && !(d.it || [])[i]; } ctx.refresh(); },
    pick: function (ctx) { ui.picking = !ui.picking; ctx.refresh(); },
    more: function (ctx) { ui.more = !ui.more; ctx.refresh(); },
    put: function (ctx, ref) { putCard(ctx, ref); },
    take: function (ctx) {
      var d = selOf(ctx); if (!d || ui.slot == null || !(d.it || [])[ui.slot]) return;
      var at = ui.slot; edit(ctx, d.id, function (q) { q.it[at] = null; while (q.it.length && q.it[q.it.length - 1] == null) q.it.pop(); });
      ctx.toast('取下了 · 卡片还在看板上');
    },
    view: function (ctx) { var d = selOf(ctx), c = d && cardOf(index(ctx.host.boardId()), (d.it || [])[ui.slot == null ? 0 : ui.slot]); if (c) openCard(c); },
    fill: function (ctx) {
      var d = selOf(ctx), ix = index(ctx.host.boardId()), L = curList(ix); if (!d || !L) return;
      var cap = capOf(d.kind), have = {}, it = (d.it || []).slice(), n = 0;
      list(ctx.host).forEach(function (q) { (q.it || []).forEach(function (r) { if (r) have[r] = 1; }); });
      L.cards.forEach(function (c) { if (have[c.ref]) return; for (var i = 0; i < cap; i++) if (!it[i]) { it[i] = c.ref; n++; return; } });
      if (!n) return ctx.toast(it.filter(Boolean).length >= cap ? '已经满了' : '「' + L.title + '」的卡片都已经摆出来了');
      edit(ctx, d.id, function (q) { q.it = it; if (!q.label) { q.list = L.id; } });
      ctx.toast('🪄 从「' + L.title + '」放上 ' + n + ' 件');
    },
    sort: function (ctx, mode) {
      var d = selOf(ctx); if (!d) return;
      var ix = index(ctx.host.boardId()), group = list(ctx.host).filter(function (q) { return q.id === d.id || (d.ex && q.ex === d.ex); });
      var cards = []; group.forEach(function (q) { (q.it || []).forEach(function (r) { var c = cardOf(ix, r); if (c) cards.push(c); }); });
      if (cards.length < 2) return;
      if (mode === 'list') { var ord = {}; ix.lists.forEach(function (L, a) { L.cards.forEach(function (c, b) { ord[c.ref] = a * 1e4 + b; }); }); cards.sort(function (p, q) { return (ord[p.ref] || 0) - (ord[q.ref] || 0); }); }
      else cards = sortCards(cards, mode, Date.now());
      var k = 0, plan = {}; group.forEach(function (q) { var cap = capOf(q.kind); plan[q.id] = cards.slice(k, k + cap).map(function (c) { return c.ref; }); k += cap; });
      ctx.commit(function (next) { next.displays.forEach(function (q) { if (plan[q.id]) q.it = plan[q.id]; }); });
      ui.slot = null; ctx.toast('🔀 已按' + ({ list: '列表顺序', title: '名称', date: '时间', pic: '有图在前', shuffle: '随机' }[mode] || '') + '重排 ' + cards.length + ' 件');
    },
    exdown: function (ctx, ex) {
      var n = 0; ctx.commit(function (next) { next.displays = next.displays.filter(function (q) { if (q.ex === ex) { n++; return false; } return true; }); });
      ctx.setSel(null); ui.slot = null; ctx.refresh(); ctx.toast('撤展了 ' + n + ' 个展架 · 卡片还在看板上 · ↶ 可撤销');
    },
    exchange: function (ctx, kind) {   // the same things, shown another way, where the exhibition stood
      var d = selOf(ctx); if (!d || !d.ex || !KINDS[kind]) return;
      var ds = list(ctx.host), ix = index(ctx.host.boardId()), old = ds.filter(function (q) { return q.ex === d.ex; }), rest = ds.filter(function (q) { return q.ex !== d.ex; });
      var cards = []; old.forEach(function (q) { (q.it || []).forEach(function (r) { var c = cardOf(ix, r); if (c) cards.push(c); }); });
      var L0 = listOf(ix, d.list), L = { id: d.list || '', title: L0 ? L0.title : (d.label || '展览'), cards: cards };
      var cx = 0, cz = 0; old.forEach(function (q) { cx += q.x; cz += q.z; }); cx /= old.length; cz /= old.length;
      var fr = FRONT[d.rot], made = exhibit(ctx.host, rest, L, kind, { x: cx, z: cz, y: d.y, fx: -fr[0], fz: -fr[1] }, d.ex, 12);
      if (!made.list.length) return ctx.toast('这里摆不下「' + KINDS[kind].name + '」');
      made.list.forEach(function (q) { if (d.theme) q.theme = d.theme; });
      ctx.commit(function (next) { next.displays = next.displays.filter(function (q) { return q.ex !== d.ex; }).concat(made.list); });
      ui.slot = null; ui.picking = false; ctx.setSel(made.list[0].id); ctx.refresh();
      ctx.toast('换成 ' + made.list.length + ' 个' + KINDS[kind].name + ' · ' + made.shown + '/' + made.total + ' 件');
    },
    dup: function (ctx) {
      var cur = selOf(ctx); if (!cur) return;
      var d = clone(cur); d.id = uid(); delete d.ex;
      var s = near(ctx.host, d, list(ctx.host), d.y, 8, true);
      if (!s.ok) return ctx.toast('旁边没有空地放复制品：' + s.why);
      ctx.commit(function (next) { next.displays.push(d); });
      ctx.setSel(d.id); ctx.refresh(); ctx.toast('⧉ 复制了一件 · 各自独立');
    },
    show: function (ctx, id) { var d = byId(list(ctx.host), id); if (!d) return; ctx.setSel(d.id); ui.slot = null; ui.picking = false; ctx.refresh(); if (ctx.host.focus) ctx.host.focus(bounds(d), FRONT[d.rot]); }
  };
  function act(ctx, name, arg) {
    lastCtx = ctx; ui.arm = name === 'arm' ? ui.arm : null;
    if (ACT[name]) return ACT[name](ctx, arg);
    var x = name.split(':'); if (EXT[x[0]] && EXT[x[0]].act) return EXT[x[0]].act(ctx, x[1], arg, selOf(ctx));
    return null;
  }

  // a tap in the world: place where armed · select a fixture and its slot while editing · open the card while visiting
  function tap(ctx, cx, cy) {
    lastCtx = ctx;
    if (ui.arm === 'move' && ctx.sel()) {
      var rc = ray(ctx.host, cx, cy), h = rc && blockHit(ctx.host, rc);
      if (!h) { ctx.toast('点在地面上'); return true; }
      ui.arm = null;
      var ds = list(ctx.host), cur = byId(ds, ctx.sel()), d = cur && clone(cur);
      if (d) { d.x = h.x + 0.5; d.z = h.z + 0.5; snap(d); var s = near(ctx.host, d, ds, h.y, 3); if (!s.ok) ctx.toast('那里放不了：' + s.why); else { ctx.commit(function (next) { var q = byId(next.displays, d.id); if (q) { q.x = d.x; q.y = d.y; q.z = d.z; } }); ctx.toast('📍 搬过去了 · ↶ 可撤销'); } }
      ctx.refresh();
      return true;
    }
    var p = pick(ctx.host, cx, cy); if (!p) return false;
    var d2 = byId(list(ctx.host), p.id); if (!d2) return false;
    var c = p.slot != null ? cardOf(index(ctx.host.boardId()), (d2.it || [])[p.slot]) : null;
    if (!ctx.editing()) {
      if (KINDS[d2.kind].custom) { if (EXT[d2.kind] && EXT[d2.kind].open) EXT[d2.kind].open(d2, ctx); } else if (d2.kind === 'chest') openChest(ctx, d2); else if (c) openCard(c); else ctx.toast(KINDS[d2.kind].icon + ' ' + (d2.label || KINDS[d2.kind].name));
      return true;
    }
    ctx.setSel(d2.id); ui.slot = p.slot; ui.picking = p.slot != null && !c;
    ctx.refresh();
    ctx.toast(KINDS[d2.kind].icon + ' ' + (d2.label || KINDS[d2.kind].name) + (c ? ' · ' + c.title : p.slot != null ? ' · 第 ' + (p.slot + 1) + ' 格（空）' : ''));
    return true;
  }

  /* ================================================================ panel (inside 🎨 陈列 of the console) */
  function btn(a, arg, label, cls, title) { return '<button type="button" class="obld-btn ' + (cls || '') + '" data-vd="' + a + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + (title ? ' title="' + esc(title) + '"' : '') + '>' + label + '</button>'; }
  function panel(ctx) {
    lastCtx = ctx;
    var host = ctx.host, ds = list(host), ix = index(host.boardId()), d = selOf(ctx), L = curList(ix), h = '';
    var nItems = ds.reduce(function (a, q) { return a + (q.it || []).filter(function (r) { return cardOf(ix, r); }).length; }, 0);
    h += '<div class="obld-card vd"><b class="t">🎨 体素陈列 <small>' + ds.length + ' 个展架 · ' + nItems + ' 件展品</small></b>';
    Object.keys(EXT).forEach(function (k) { if (EXT[k].entry && !d) h += EXT[k].entry(ctx); });
    if (!ix.lists.length) h += '<div class="obld-sub">这座岛的看板还没有卡片 · 先在看板里加几张，再回来陈列</div>';
    else {
      h += '<div class="vd-row"><label class="vd-lab" for="vd-list">列表</label><select id="vd-list" data-vd-change="list">' + ix.lists.map(function (q) { return '<option value="' + esc(q.id) + '"' + (L && q.id === L.id ? ' selected' : '') + '>' + esc(q.title) + ' · ' + q.cards.length + '</option>'; }).join('') + '</select></div>';
      if (!d) {
        h += '<div class="vd-h">✦ 策展：一键把整个列表摆出来</div><div class="vd-sugs">' + curate(L).map(function (s, i) {
          return '<button type="button" class="vd-sug' + (i ? '' : ' best') + '" data-vd="curate" data-arg="' + s.kind + '"><i>' + KINDS[s.kind].icon + '</i><span><b>' + KINDS[s.kind].name + (s.fixtures > 1 ? ' × ' + s.fixtures : '') + '</b><small>' + esc(s.why) + (s.left ? ' · 多出的 ' + s.left + ' 件先不摆' : '') + '</small></span></button>';
        }).join('') + '</div>';
      }
    }
    if (d && KINDS[d.kind].custom) {
      h += '<div class="vd-sel"><div class="vd-h">' + KINDS[d.kind].icon + ' ' + esc(d.label || KINDS[d.kind].name) + '</div>' + (EXT[d.kind] && EXT[d.kind].panel ? EXT[d.kind].panel(d, ctx) : '');
      h += '<div class="vd-h2">摆放</div><div class="vd-pad">' + btn('move', 'f', '↑') + '<div>' + btn('move', 'l', '←') + btn('rot', null, '⟳') + btn('move', 'r', '→') + '</div>' + btn('move', 'b', '↓') + '</div>';
      h += '<div class="obld-actions">' + btn('arm', null, ui.arm ? '📍 点地面…（再点取消）' : '📍 搬到我点的地方', ui.arm ? 'on' : '') + btn('dup', null, '⧉ 复制') + btn('del', null, '🗑 删除', 'warn') + '</div></div>';
    } else if (d) {
      var K = KINDS[d.kind], cap = capOf(d.kind), it = d.it || [], used = it.filter(Boolean).length, cur = ui.slot != null ? cardOf(ix, it[ui.slot]) : null;
      h += '<div class="vd-sel"><div class="vd-h">' + K.icon + ' ' + esc(d.label || K.name) + ' <small>' + K.name + ' · ' + used + '/' + cap + '</small></div>';
      h += '<div class="vd-slots' + (cap > 12 ? ' many' : '') + '">';
      for (var i = 0; i < cap; i++) { var c = cardOf(ix, it[i]); h += '<button type="button" class="vd-slot' + (ui.slot === i ? ' on' : '') + (c ? '' : ' empty') + '" data-vd="slot" data-arg="' + i + '" title="' + esc(c ? c.title : '空格') + '">' + (c ? esc(c.title) : '＋') + '</button>'; }
      h += '</div>';
      if (ui.slot != null) h += '<div class="obld-actions">' + (cur ? btn('view', null, '📄 查看卡片') + btn('take', null, '✖ 取下') : '') + btn('pick', null, ui.picking ? '▴ 收起卡片' : (cur ? '🔁 换一张' : '＋ 选卡片'), ui.picking ? 'on' : '') + '</div>';
      else h += '<div class="obld-actions">' + btn('pick', null, ui.picking ? '▴ 收起卡片' : '＋ 选卡片放上去', ui.picking ? 'on' : '') + (L ? btn('fill', null, '🪄 用列表填满', '', '把「' + L.title + '」里还没摆出来的卡片放进空格') : '') + '</div>';
      if (ui.picking && L) {
        var out = {}; ds.forEach(function (q) { (q.it || []).forEach(function (r) { if (r) out[r] = q.id === d.id ? 2 : 1; }); });
        h += '<div class="vd-cards">' + L.cards.slice(0, 80).map(function (c2) { return '<button type="button" class="' + (out[c2.ref] === 2 ? 'here' : out[c2.ref] ? 'out' : '') + '" data-vd="put" data-arg="' + esc(c2.ref) + '">' + (c2.pic ? '🖼 ' : '') + esc(c2.title) + (out[c2.ref] === 2 ? ' <small>在这里</small>' : out[c2.ref] ? ' <small>已在别处</small>' : '') + '</button>'; }).join('') + (L.cards.length > 80 ? '<p class="obld-sub">只列出前 80 张</p>' : '') + '</div>';
      }
      h += '<div class="vd-h2">摆放</div><div class="vd-pad">' + btn('move', 'f', '↑') + '<div>' + btn('move', 'l', '←') + btn('rot', null, '⟳') + btn('move', 'r', '→') + '</div>' + btn('move', 'b', '↓') + '</div>';
      h += '<div class="obld-actions">' + btn('arm', null, ui.arm ? '📍 点地面…（再点取消）' : '📍 搬到我点的地方', ui.arm ? 'on' : '') + btn('del', null, '🗑 删除展架', 'warn') + '</div>';
      h += '<div class="vd-h2">外观' + (d.ex ? '（整个展览）' : '') + '</div><div class="vd-chips">' + THEME_IDS.map(function (t) { return '<button type="button" class="' + (themeOf(d) === t ? 'on' : '') + '" data-vd="theme" data-arg="' + t + '"><i style="background:' + THEMES[t].base + ';border-color:' + THEMES[t].trim + '"></i>' + THEMES[t].name + '</button>'; }).join('') + '</div>';
      h += '<div class="vd-h2">重排' + (d.ex ? '（整个展览）' : '') + '</div><div class="vd-chips">' + [['list', '列表顺序'], ['title', 'A–Z'], ['date', '时间'], ['pic', '有图在前'], ['shuffle', '随机']].map(function (m) { return '<button type="button" data-vd="sort" data-arg="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
      if (d.ex) h += '<div class="vd-h2">整个展览 · 换一种摆法</div><div class="vd-chips">' + KIND_IDS.filter(function (k) { return k !== d.kind; }).map(function (k) { return '<button type="button" data-vd="exchange" data-arg="' + k + '">' + KINDS[k].icon + ' ' + KINDS[k].name + '</button>'; }).join('') + '</div><div class="obld-actions">' + btn('exdown', d.ex, '🧹 撤展（整个展览）', 'warn') + '</div>';
      h += '</div>';
    }
    h += '<div class="vd-h">＋ 单个展架' + (d ? '' : ' <small>放在你面前的平地上</small>') + '</div><div class="vd-kinds">' + (ui.more || !d ? KIND_IDS : KIND_IDS.slice(0, 0)).map(function (k) { return '<button type="button" data-vd="add" data-arg="' + k + '" title="' + esc(KINDS[k].why) + '"><i>' + KINDS[k].icon + '</i><b>' + KINDS[k].name + '</b><small>' + capOf(k) + ' 格</small></button>'; }).join('') + '</div>' + (d ? '<div class="obld-actions">' + btn('more', null, ui.more ? '▴ 收起展架种类' : '▾ 展开 11 种展架') + '</div>' : '');
    var exs = {}, order = [];
    ds.forEach(function (q) { var k = q.ex || q.id; if (!exs[k]) { exs[k] = { first: q, n: 0, items: 0, ex: q.ex }; order.push(k); } exs[k].n++; exs[k].items += (q.it || []).filter(function (r) { return cardOf(ix, r); }).length; });
    if (order.length) h += '<div class="vd-h">这里的陈列</div><div class="vd-here">' + order.map(function (k) { var e = exs[k], q = e.first, nm = e.ex ? String(q.label || KINDS[q.kind].name).replace(/ \d+\/\d+$/, '') : (q.label || KINDS[q.kind].name); return '<button type="button" class="' + (d && (d.id === q.id || (d.ex && d.ex === e.ex)) ? 'on' : '') + '" data-vd="show" data-arg="' + esc(q.id) + '">' + KINDS[q.kind].icon + ' ' + esc(nm) + ' <small>' + (e.n > 1 ? e.n + ' 架 · ' : '') + e.items + ' 件</small></button>'; }).join('') + '</div>';
    return h + '</div>';
  }
  function click(ctx, e) {
    var g = e.target.closest && e.target.closest('[data-vd]'); if (!g) return false;
    act(ctx, g.getAttribute('data-vd'), g.getAttribute('data-arg'));
    return true;
  }
  function changed(ctx, e) {
    var t = e.target; if (!t || !t.getAttribute || t.getAttribute('data-vd-change') !== 'list') return false;
    ui.list = t.value; ctx.refresh(); return true;
  }

  /* ================================================================ looking at a card */
  function modal(title, fill) {
    var old = document.getElementById('vd-modal'); if (old) old.remove();
    var m = document.createElement('div'); m.id = 'vd-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', title);
    var box = document.createElement('div'); box.className = 'vd-box'; m.appendChild(box);
    var x = document.createElement('button'); x.type = 'button'; x.className = 'vd-x'; x.textContent = '✕'; x.setAttribute('aria-label', '关闭'); box.appendChild(x);
    fill(box);
    function close() { m.remove(); document.removeEventListener('keydown', key, true); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    x.addEventListener('click', close); m.addEventListener('click', function (e) { if (e.target === m) close(); });
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel'].forEach(function (t) { m.addEventListener(t, function (e) { e.stopPropagation(); }); });
    document.addEventListener('keydown', key, true);
    (document.getElementById('oia-root') || document.body).appendChild(m); x.focus();
    return close;
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function openCard(c) {
    modal(c.title, function (box) {
      box.appendChild(el('span', 'vd-tag', c.list || '卡片'));
      var e = c.pic && pic(c.pic); if (e && e.st === 1) { var im = el('img', 'vd-pic'); im.src = c.pic; im.alt = ''; box.appendChild(im); }
      var h = el('h2', '', c.title); if (c.zh) h.appendChild(el('small', '', ' ' + c.zh)); box.appendChild(h);
      if (c.desc) box.appendChild(el('p', 'vd-desc', c.desc.length > 600 ? c.desc.slice(0, 600) + '…' : c.desc));
      var meta = []; if (c.done) meta.push('✓ 已完成'); if (c.mastery) meta.push('熟练度 ' + c.mastery + '/5'); var y = yearOf(c); if (y != null) meta.push(String(Math.floor(y)));
      if (meta.length) box.appendChild(el('p', 'vd-meta', meta.join(' · ')));
    });
  }
  function openChest(ctx, d) {
    var ix = index(ctx.host.boardId()), cards = (d.it || []).map(function (r) { return cardOf(ix, r); }).filter(Boolean);
    var close = modal(d.label || '宝箱', function (box) {
      box.appendChild(el('span', 'vd-tag', '🧰 宝箱 · ' + cards.length + ' 件'));
      box.appendChild(el('h2', '', d.label || '宝箱'));
      if (!cards.length) box.appendChild(el('p', 'vd-desc', '箱子还是空的。'));
      var ul = el('div', 'vd-chest');
      cards.forEach(function (c) { var b = el('button', '', c.title); b.type = 'button'; b.addEventListener('click', function () { close(); openCard(c); }); ul.appendChild(b); });
      box.appendChild(ul);
    });
  }

  /* ================================================================ styles */
  var css = document.createElement('style'); css.id = 'minest-voxel-displays-style';
  css.textContent = [
    '#mn-bld-p .vd .t small{font:600 11px system-ui;color:#94a3b8;margin-left:6px}',
    '#mn-bld-p .vd-row{display:flex;align-items:center;gap:8px;margin:8px 0}',
    '#mn-bld-p .vd-lab{font:700 12px system-ui;color:#cbd5e1;flex:none}',
    '#mn-bld-p .vd select{flex:1;min-width:0;min-height:40px;background:#0f172a;color:#f8fafc;border:1px solid #475569;border-radius:8px;padding:6px 8px;font:600 13px system-ui}',
    '#mn-bld-p .vd-h{font:800 13px system-ui;color:#fff;margin:14px 0 6px}',
    '#mn-bld-p .vd-h small,#mn-bld-p .vd-h2{font:600 11px system-ui;color:#94a3b8}',
    '#mn-bld-p .vd-h2{margin:10px 0 5px}',
    '#mn-bld-p .vd-sugs{display:grid;gap:6px}',
    '#mn-bld-p .vd-sug{display:flex;gap:10px;align-items:center;text-align:left;padding:9px 10px;min-height:52px;background:#273449;border:1px solid #475569;border-radius:9px;color:#fff;cursor:pointer;font:inherit}',
    '#mn-bld-p .vd-sug.best{background:#1d4ed8;border-color:#93c5fd}',
    '#mn-bld-p .vd-sug i{font-style:normal;font-size:24px;flex:none}',
    '#mn-bld-p .vd-sug b{display:block;font:800 13px system-ui}',
    '#mn-bld-p .vd-sug small{display:block;font:500 11px/1.35 system-ui;color:#dbe4f0}',
    '#mn-bld-p .vd-sel{margin-top:10px;padding:10px;border:1px solid #f2c13d;border-radius:10px;background:#172033}',
    '#mn-bld-p .vd-sel .vd-h{margin-top:0}',
    '#mn-bld-p .vd-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-bottom:8px}',
    '#mn-bld-p .vd-slots.many{grid-template-columns:repeat(4,minmax(0,1fr))}',
    '#mn-bld-p .vd-slot{min-height:40px;padding:4px 5px;background:#334155;border:2px solid transparent;border-radius:7px;color:#fff;font:600 11px/1.2 system-ui;cursor:pointer;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}',
    '#mn-bld-p .vd-slot.empty{background:#1e293b;border:2px dashed #475569;color:#94a3b8}',
    '#mn-bld-p .vd-slot.on{border:2px solid #f2c13d;background:#3b4a63}',
    '#mn-bld-p .obld-btn.on{background:#b7791f}',
    '#mn-bld-p .vd-cards{max-height:210px;overflow-y:auto;display:grid;gap:4px;margin-bottom:8px;padding:6px;background:#0f172a;border-radius:8px;overscroll-behavior:contain}',
    '#mn-bld-p .vd-cards button{min-height:38px;text-align:left;padding:6px 9px;background:#1e293b;border:1px solid #334155;border-radius:7px;color:#f1f5f9;font:600 12px/1.3 system-ui;cursor:pointer}',
    '#mn-bld-p .vd-cards button.out{color:#94a3b8}',
    '#mn-bld-p .vd-cards button.here{border-color:#f2c13d}',
    '#mn-bld-p .vd-cards small{color:#94a3b8;font-weight:500}',
    '#mn-bld-p .vd-pad{display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:8px}',
    '#mn-bld-p .vd-pad div{display:flex;gap:4px}',
    '#mn-bld-p .vd-pad .obld-btn{min-width:52px;min-height:40px;font-size:15px}',
    '#mn-bld-p .vd-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}',
    '#mn-bld-p .vd-chips button{min-height:34px;padding:5px 9px;background:#334155;border:1px solid #475569;border-radius:999px;color:#fff;font:600 11.5px system-ui;cursor:pointer;display:inline-flex;align-items:center;gap:5px}',
    '#mn-bld-p .vd-chips button.on{background:#f2c13d;border-color:#f2c13d;color:#2b2205}',
    '#mn-bld-p .vd-chips i{width:12px;height:12px;border:3px solid;border-radius:3px;display:inline-block}',
    '#mn-bld-p .vd-kinds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}',
    '#mn-bld-p .vd-kinds button{display:flex;flex-direction:column;align-items:center;gap:1px;min-height:62px;padding:6px 2px;background:#334155;border:1px solid #475569;border-radius:8px;color:#fff;cursor:pointer;font:inherit}',
    '#mn-bld-p .vd-kinds i{font-style:normal;font-size:20px;line-height:1.1}',
    '#mn-bld-p .vd-kinds b{font:700 11.5px system-ui}',
    '#mn-bld-p .vd-kinds small{font:500 10px system-ui;color:#cbd5e1}',
    '#mn-bld-p .vd-here{display:grid;gap:4px}',
    '#mn-bld-p .vd-here button{min-height:38px;text-align:left;padding:6px 9px;background:#1e293b;border:1px solid #334155;border-radius:7px;color:#f1f5f9;font:600 12px system-ui;cursor:pointer}',
    '#mn-bld-p .vd-here button.on{border-color:#f2c13d}',
    '#mn-bld-p .vd-here small{color:#94a3b8;font-weight:500}',
    '#mn-bld-p .vd button:focus-visible,#vd-modal button:focus-visible{outline:3px solid #8ec5ff;outline-offset:1px}',
    '#vd-modal{position:fixed;inset:0;z-index:2147483600;background:rgba(8,12,22,.66);display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto}',
    '#vd-modal .vd-box{position:relative;width:min(440px,94vw);max-height:84vh;overflow-y:auto;background:#fbf7ee;color:#1d2b4f;border:4px solid #2f6fd6;border-radius:6px;box-shadow:0 0 0 4px #10131c,0 16px 40px rgba(0,0,0,.5);padding:18px;font:14px/1.5 system-ui,-apple-system,sans-serif}',
    '#vd-modal .vd-x{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;border-radius:6px;background:#e7e0cf;color:#1d2b4f;font:800 16px system-ui;cursor:pointer}',
    '#vd-modal .vd-tag{display:inline-block;padding:3px 9px;background:#2f6fd6;color:#fff;border-radius:4px;font:700 11px system-ui;margin:0 48px 8px 0}',
    '#vd-modal h2{margin:0 0 6px;font:800 21px/1.25 system-ui;color:#1d2b4f}',
    '#vd-modal h2 small{font:500 15px system-ui;color:#5b6785}',
    '#vd-modal .vd-pic{display:block;width:100%;max-height:220px;object-fit:cover;border-radius:4px;margin-bottom:10px;image-rendering:auto}',
    '#vd-modal .vd-desc{margin:8px 0;white-space:pre-wrap;color:#33405f}',
    '#vd-modal .vd-meta{margin:8px 0 0;font:600 12px system-ui;color:#5b6785}',
    '#vd-modal .vd-chest{display:grid;gap:5px;margin-top:8px}',
    '#vd-modal .vd-chest button{min-height:40px;text-align:left;padding:7px 10px;background:#fff;border:1px solid #cdd5e4;border-radius:5px;color:#1d2b4f;font:600 13px system-ui;cursor:pointer}'
  ].join('\n');
  document.head.appendChild(css);

  root.MinestVoxelDisplays = {
    VERSION: VERSION, KINDS: KINDS, THEMES: THEMES, pure: PURE,
    list: list, render: render, pick: pick, bounds: bounds, tap: tap, act: act, panel: panel, click: click, changed: changed,
    curate: function (host, listId) { var ix = index(host.boardId()); return curate(listOf(ix, listId) || ix.lists[0]); },
    lists: function (host) { return index(host.boardId()).lists.map(function (L) { return { id: L.id, title: L.title, n: L.cards.length }; }); },
    site: site, ui: function () { return ui; }, select: function (listId) { ui.list = listId; },
    stats: function () { var tris = 0; if (GROUP) GROUP.traverse(function (o) { if (o.isMesh && o.geometry) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return { fixtures: Object.keys(LIVE).length, items: STATS.items, rebuilt: STATS.rebuilt, triangles: Math.round(tris), cached: Object.keys(CACHE).length, spinning: SPIN.length }; },
    ext: EXT,
    _: { faceRes: faceRes, signRes: signRes, picState: picState, openCard: openCard, THEMES: THEMES, listOf: listOf, curList: function (ix) { return curList(ix); }, Buf: Buf, res: res, mats: mats, tex: tex, canvas: canvas, wrap: wrap, rgb: rgb, hsl: hsl, hash: hash, esc: esc, el: el, modal: modal, uid: uid, clone: clone, snap: snap, site: site, near: near, list: list, index: index, cardOf: cardOf, rotToward: rotToward, byId: byId, ctx: function () { return lastCtx; }, T: T, live: function (id) { return LIVE[id] ? LIVE[id].grp : null; }, redraw: function () { if (LAST) render(LAST); }, PX: PX },
    reset: function () { Object.keys(LIVE).forEach(drop); memo = { src: null, key: '', out: null }; START = {}; IX.key = ''; }
  };
})(typeof window === 'object' ? window : globalThis);
