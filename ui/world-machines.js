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
  var VERSION = '4.0', Q = Math.PI / 2, RAD = Math.PI / 180;

  /* ================================================================ pure: the eleven machines of the brief */
  var CATALOG = [
    { id: 'carousel', no: '03', name: '旋转明信片展架', en: 'Rotating Carousel', icon: '🎠', phase: 1, kind: '实体机械', ready: true },
    { id: 'rolodex', no: '10', name: '旋转卡片档案轮', en: 'Rolodex', icon: '📇', phase: 2, kind: '实体机械', ready: true },
    { id: 'flip', no: '12', name: '翻页转轮', en: 'Flip Carousel', icon: '🗞', phase: 2, kind: '实体机械', ready: true },
    { id: 'paternoster', no: '20', name: '循环升降货架', en: 'Paternoster Shelf', icon: '🛗', phase: 2, kind: '实体机械 + 自动检索', ready: true },
    { id: 'splitflap', no: '09', name: '机械翻牌清单机', en: 'Split-Flap List', icon: '🛫', phase: 3, kind: '自动循环 + 主动交互', ready: true },
    { id: 'sorter', no: '11', name: '自动文字分拣机', en: 'Sorting Machine', icon: '🏭', phase: 3, kind: '主动操作 + 自动执行', ready: true },
    { id: 'drum', no: '13', name: '文字滚筒', en: 'Word Drum', icon: '🥁', phase: 3, kind: '实体机械 + 自动显示', ready: true },
    { id: 'ferris', no: '14', name: '文字摩天轮', en: 'Word Ferris Wheel', icon: '🎡', phase: 3, kind: '实体机械 + 自动循环', ready: true },
    { id: 'jukebox', no: '19', name: '点唱机清单', en: 'Jukebox List', icon: '📻', phase: 3, kind: '实体机械 + 自动取物', ready: true },
    { id: 'retype', no: '78', name: '自重组文字群', en: 'Reassembling Typography', icon: '🌌', phase: 4, kind: '自动动态 + 空间交互', ready: true },
    { id: 'comic', no: '79', name: '漫画式空间文字', en: 'Comic Space', icon: '💬', phase: 4, kind: '自动动态 + 叙事交互', ready: true }
  ];
  function modeOf(id) { for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i]; return null; }
  function mod(x, n) { return ((x % n) + n) % n; }
  function rng(seed) { var x = (seed >>> 0) || 1; return function () { x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9e3779b9) >>> 0; var t = Math.imul(x ^ (x >>> 13), 3266489909); return ((t ^ (t >>> 16)) >>> 0) / 4294967296; }; }
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
  var ROL = { cap: 24, cw: 0.44, ch: 0.3, ct: 0.008, cy: 0.5, r0: 0.1, read: 112, lie: 18, pack: 8, back: 168, flat: 2, size: { w: 1, d: 1, h: 1 } };
  // the deeper in the stack, the tighter the cards are pressed together (they never go round under the hub)
  function packed(n, first, room) { return room * (1 - Math.exp(-n * first / room)); }
  function rolAngle(rel) {
    if (rel >= 0) return ROL.read + packed(rel, ROL.pack, ROL.back - ROL.read);
    if (rel <= -1) return ROL.lie - packed(-rel - 1, ROL.pack, ROL.lie - ROL.flat);
    var t = -rel, e = t < 0.8 ? (t / 0.8) * (t / 0.8) * 1.07 : 1.07 - 0.07 * ((t - 0.8) / 0.2);
    return ROL.read - (ROL.read - ROL.lie) * e;
  }

  /* ================================================================ pure: 12 the flip carousel
     A ring of n places, every card hinged at the top of the spool (like a flip clock). u = how far a card is behind
     the front one (0 … n). The front half stands, packed behind the front card and held by the catch; the rest
     hang in front, the one that fell last in front of all the others. The front card (v = turn of the crank since
     it came to the front, 0 → 1) is pushed forward to the catch, then let go: it falls under its own weight and
     bounces once. The oldest hanging cards swing round behind the spool and stand up again at the back. */
  var FLP = { cap: 30, min: 10, cw: 0.42, ch: 0.3, ct: 0.008, cy: 0.5, rho: 0.06, fan: 3.2, gap: 0.009, zf: 0.064, zh: 0.024, tilt: 1.2, size: { w: 1, d: 1, h: 1 }, perTurn: 3 };
  function flipRing(n) { return clamp(n, FLP.min, FLP.cap); }
  function flipFall(v) {   // the angle of the falling card: 90° standing → −90° hanging
    if (v <= 0) return 90; if (v >= 1) return -90;
    if (v < 0.5) return 90 - 14 * (v / 0.5);
    var t = (v - 0.5) / 0.5, g = t < 0.8 ? (t / 0.8) * (t / 0.8) : 1 - 0.07 * Math.sin((t - 0.8) / 0.2 * Math.PI);
    return 76 - 166 * g;
  }
  function flipPose(i, a, n) {   // → { z (of the hinge, front +), phi (deg, the card's own angle: 90 up, −90 down), state }
    var u = mod(i - a, n), half = n / 2, g = FLP.gap;   // the gap between hinges is wider than a card is thick: no two cards meet
    if (u <= half) return { z: FLP.zf - u * g, phi: 90 + u * FLP.fan, state: u < 1e-9 ? 'front' : 'standing' };
    var v = n - u;
    if (v < 1) return { z: FLP.zf, phi: flipFall(v), state: 'falling' };
    var k = v - 1, zh = Math.max(FLP.zh, FLP.zf - k * g), ph = -90 - FLP.tilt * k, w = clamp((v - (half - 3)) / 3, 0, 1);
    return { z: zh + w * (FLP.zf - half * g - zh), phi: ph + w * ((90 + half * FLP.fan - 360) - ph), state: w > 0 ? 'returning' : 'hanging' };
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
    if (mx.cfg && typeof mx.cfg === 'object') o.cfg = cleanCfg(mx.cfg);
    if (mx.type && !(m && m.ready)) o.unknown = String(mx.type).slice(0, 30);
    return o;
  }
  // a machine's own choices (its sort rule, which drums show what …): plain values only, sizes capped, nothing to run
  function cleanCfg(c) {
    var o = {};
    Object.keys(c).slice(0, 16).forEach(function (k) {
      var v = c[k];
      if (typeof v === 'string') o[k] = v.slice(0, 200);
      else if (typeof v === 'number' && isFinite(v)) o[k] = v;
      else if (typeof v === 'boolean') o[k] = v;
      else if (Array.isArray(v)) o[k] = v.slice(0, 500).filter(function (x) { return typeof x === 'number' ? isFinite(x) : typeof x === 'string'; }).map(function (x) { return typeof x === 'number' ? x : x.slice(0, 200); });
      else if (v && typeof v === 'object') { var m = {}; Object.keys(v).slice(0, 2000).forEach(function (kk) { var x = v[kk]; if (typeof x === 'number' && isFinite(x)) m[String(kk).slice(0, 200)] = x; else if (typeof x === 'string') m[String(kk).slice(0, 200)] = x.slice(0, 60); }); o[k] = m; }
    });
    return o;
  }
  function initial(title) { var ch = Array.from(String(title || '').trim())[0] || '#'; return /[a-z]/.test(ch) ? ch.toUpperCase() : ch; }

  /* ================================================================ pure: 14 the ferris wheel
     n gondolas round a wheel turning in its own plane; gondola i stands at the bottom (the boarding place) when a = i.
     A gondola hangs from its pin and stays level whatever the wheel does. */
  var FER = { cap: 12, min: 6, R: 0.82, cy: 1.27, cw: 0.2, ch: 0.27, ct: 0.008, size: { w: 2, d: 1, h: 3 } };
  function ferRing(n) { return clamp(n, FER.min, FER.cap); }
  function ferAngle(i, a, n) { return -Math.PI / 2 + (i - a) * 2 * Math.PI / n; }

  /* ================================================================ pure: 19 the jukebox
     The records stand side by side in a crate, leaning, spines to the left; the arm runs on a rail above them. */
  var JBX = { cap: 24, x0: -0.33, x1: 0.33, y: 0.62, z: -0.04, cw: 0.2, ch: 0.2, ct: 0.008, lean: 0.42, stage: [0, 1.34, 0.2], big: 2.3, size: { w: 1, d: 1, h: 2 } };
  function jbxX(s, n) { n = Math.max(2, n); return JBX.x0 + (JBX.x1 - JBX.x0) * s / (n - 1); }

  /* ================================================================ pure: 11 the sorting machine
     Items go one by one from the hopper along the belt, past the scanner, to their bin, where a pusher puts them in.
     a = how many items have gone through (a fraction: the one on its way). Grouping is a display layout; the list
     changes only when the user confirms writing the order back. */
  var SRT = { cap: 30, bins: 6, cw: 0.2, ch: 0.14, ct: 0.008, beltZ: -0.2, beltY: 0.44, x0: -1.02, scanX: -0.9, binX: [-0.7, -0.38, -0.06, 0.26, 0.58, 0.9], binZ: 0.14, binFloor: 0.12, hopX: -1.28, speed: 0.75, size: { w: 3, d: 1, h: 1 } };
  var LABELS = { 'l-green': '绿', 'l-red': '红', 'l-blue': '蓝', 'l-yellow': '黄', 'l-purple': '紫', 'l-orange': '橙', 'l-pink': '粉', 'l-sky': '天蓝', 'l-lime': '青柠', 'l-black': '黑' };
  var RULES = [['initial', '首字母'], ['list', '原始分类'], ['label', '标签'], ['study', '学习状态'], ['custom', '自定义分组']];
  function sortKey(c, rule) {
    if (rule === 'initial') return initial(c.title);
    if (rule === 'list') return c.list || '（无列表）';
    if (rule === 'label') { var l = c.labels && c.labels[0]; return l ? (LABELS[l] || String(l).replace(/^l-/, '')) : '无标签'; }
    if (rule === 'length') { var L = Array.from(String(c.title || '')).length; return L <= 8 ? '1 短' : L <= 18 ? '2 中' : '3 长'; }
    if (rule === 'study') return c.done ? '3 已完成' : c.mastery >= 4 ? '2 熟练' : c.mastery >= 2 ? '1 学习中' : '0 新卡';
    return '组 1';
  }
  function hasStudy(cards) { return cards.some(function (c) { return c.done || c.mastery > 0; }); }
  // → { bins: [{ label, refs }], binOf: { ref: k } }: one bin a group; more groups than bins → neighbours share (A–D); then the user's own moves
  function sortBins(cards, rule, man, nb) {
    nb = nb || SRT.bins; var bins = [], keys = {}, order = [];
    if (rule === 'custom') { for (var b = 0; b < nb; b++) bins.push({ label: '组 ' + (b + 1), refs: [] }); cards.forEach(function (c) { bins[man && man[c.ref] != null ? clamp(man[c.ref] | 0, 0, nb - 1) : 0].refs.push(c.ref); }); }
    else {
      cards.forEach(function (c) { var k = sortKey(c, rule); if (!keys[k]) { keys[k] = []; order.push(k); } keys[k].push(c.ref); });
      order.sort(function (p, q) { return String(p).localeCompare(String(q), 'zh'); });
      var nice = function (k) { return String(k).replace(/^\d /, ''); };
      if (order.length <= nb) bins = order.map(function (k) { return { label: nice(k), refs: keys[k].slice() }; });
      else {
        var total = cards.length, cum = 0, raw = [];
        order.forEach(function (k) { var at = Math.min(nb - 1, Math.floor((cum + keys[k].length / 2) / total * nb)); cum += keys[k].length; if (!raw[at]) raw[at] = { keys: [], refs: [] }; raw[at].keys.push(k); raw[at].refs = raw[at].refs.concat(keys[k]); });
        bins = raw.filter(Boolean).map(function (r) { var a0 = nice(r.keys[0]), a1 = nice(r.keys[r.keys.length - 1]); return { label: a0 === a1 ? a0 : a0 + '–' + a1, refs: r.refs }; });
      }
      if (man) Object.keys(man).forEach(function (ref) { var to = man[ref] | 0; if (to < 0 || to >= bins.length) return; bins.forEach(function (bb) { var i = bb.refs.indexOf(ref); if (i >= 0) bb.refs.splice(i, 1); }); if (cards.some(function (c) { return c.ref === ref; })) bins[to].refs.push(ref); });
    }
    var pos = {}; cards.forEach(function (c, i) { pos[c.ref] = i; });
    var binOf = {}; bins.forEach(function (bb, k) { bb.refs.sort(function (p, q) { return pos[p] - pos[q]; }); bb.refs.forEach(function (r) { binOf[r] = k; }); });
    return { bins: bins, binOf: binOf };
  }
  // the new order of the list when the user writes the sorting back: bin by bin, each in the order it came
  function sortedOrder(sort) { var out = []; sort.bins.forEach(function (b) { out = out.concat(b.refs); }); return out; }
  // where item i is at a, as stages 0 … 5: waiting · onto the belt · along the belt · pushed · into the bin · in the bin
  function srtStage(i, a) { var t = a - i; return t <= 0 ? 0 : t < 0.12 ? 1 : t < 0.62 ? 2 : t < 0.8 ? 3 : t < 1 ? 4 : 5; }

  /* ================================================================ pure: 09 the split-flap board
     Each module has a drum of flaps; it turns flap by flap to the next character, never jumping. Characters that are
     not on the drum (Chinese, accents) are printed on a short run of their own: four flaps go past, then theirs. */
  var DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-&'/:?!#";
  var SPF = { rows: 6, cols: 15, cap: 6, mw: 0.064, mh: 0.094, gx: 0.007, gy: 0.02, top: 1.62, size: { w: 2, d: 1, h: 2 } };
  function sfUp(ch) { return /[a-z]/.test(ch) ? ch.toUpperCase() : ch; }
  function sfLine(s, n) { var g = Array.from(String(s || '').replace(/\s+/g, ' ').trim()).map(sfUp); if (g.length > n) g = g.slice(0, n - 1).concat(['…']); while (g.length < n) g.push(' '); return g; }
  function flapSeq(from, to, seed) {
    if (from === to) return [];
    var j = DRUM.indexOf(to), out = [];
    if (j >= 0) { var i = DRUM.indexOf(from); if (i < 0) i = 0; for (var k = (i + 1) % DRUM.length; ; k = (k + 1) % DRUM.length) { out.push(DRUM[k]); if (k === j) break; } return out; }
    for (var n = 0; n < 4; n++) out.push(DRUM[1 + ((Math.abs(seed | 0) + n * 7) % 26)]);
    out.push(to); return out;
  }

  /* ================================================================ pure: 13 the word drum
     Eight drums side by side; each carries the same ring of characters (A–Z for a Latin list, else the list's own
     most used characters) and turns one way only, a click at a time. */
  var WDR = { k: 8, face: 0.06, w: 0.085, gap: 0.012, cy: 0.6, maxRing: 36, size: { w: 1, d: 1, h: 1 } };
  function drumRing(titles) {
    var all = titles.join('');
    if (/^[\x20-\x7e]*$/.test(all)) return Array.from(' ABCDEFGHIJKLMNOPQRSTUVWXYZ' + (/[0-9]/.test(all) ? '0123456789' : '') + '·');
    var f = {}; Array.from(all.toUpperCase()).forEach(function (ch) { if (ch.trim()) f[ch] = (f[ch] || 0) + 1; });
    return [' '].concat(Object.keys(f).sort(function (p, q) { return f[q] - f[p] || (p < q ? -1 : 1); }).slice(0, WDR.maxRing - 2)).concat(['·']);
  }
  // a title on k drums: the part `chunk` of it (a word longer than the drums is shown part by part), centred
  function drumWord(title, ring, k, chunk) {
    var g = Array.from(String(title || '').toUpperCase().replace(/\s+/g, ' ').trim()).map(function (ch) { return ring.indexOf(ch) >= 0 ? ch : ' ' === ch ? ' ' : '·'; });
    var parts = [], cur = [];   // whole words where they fit; only a word longer than the drums is cut
    g.join('').split(' ').filter(Boolean).forEach(function (wd) {
      var w = Array.from(wd);
      while (w.length > k) { if (cur.length) { parts.push(cur); cur = []; } parts.push(w.slice(0, k)); w = w.slice(k); }
      if (!w.length) return;
      if (!cur.length) cur = w; else if (cur.length + 1 + w.length <= k) cur = cur.concat([' '], w); else { parts.push(cur); cur = w; }
    });
    if (cur.length || !parts.length) parts.push(cur);
    var chunks = parts.length, c = clamp(chunk | 0, 0, chunks - 1), part = parts[c], pad = Math.floor((k - part.length) / 2), faces = [];
    for (var i = 0; i < k; i++) faces.push(Math.max(0, ring.indexOf(i >= pad && i < pad + part.length ? part[i - pad] : ' ')));
    return { faces: faces, chunks: chunks, chunk: c, text: part.join('').trim() };
  }
  function drumRead(faces, ring) { return faces.map(function (f) { return ring[mod(Math.round(f), ring.length)]; }).join('').replace(/\s+/g, ' ').trim(); }
  function forward(from, to, n) { return from + mod(to - from, n); }   // a drum only turns one way

  /* ================================================================ pure: 78 reassembling typography
     Every item of the list is a word block. A composition says where each block goes; going from one to another
     every block travels on its own, a little after the one before. Planar compositions are scaled to fit the
     stage (k) so that no two words cover each other; the cloud and the ring are round things in depth. */
  var RTY = { cap: 24, h: 0.1, d: 0.03, cy: 1.15, W: 2.0, gap: 0.04, maxW: 0.93, step: Math.PI / 12, size: { w: 2, d: 1, h: 2 } };
  var RT_MODES = [['cloud', '云团'], ['groups', '分组'], ['ring', '环绕'], ['line', '列表']];
  var RT_RULES = [['initial', '首字母'], ['label', '标签'], ['study', '学习状态'], ['length', '长短']];
  // items [{ w, g }] → { pos: [{ x, y, z }], labels: [{ g, x, y, z }], k }
  function rtLayout(mode, items, ngroups) {
    var n = items.length, out = [], labels = [], H = RTY.h, gap = RTY.gap, k = 1;
    if (!n) return { pos: [], labels: [], k: 1 };
    if (mode === 'cloud') {   // a loose cloud that stays readable: the words shuffled, set in uneven rows that never cover each other, each at its own depth
      var order = items.map(function (it, i) { return i; }).sort(function (p, q) { return ((p * 2654435761) >>> 0) % 1009 - ((q * 2654435761) >>> 0) % 1009; });
      for (var kk = 1; kk > 0.3; kk *= 0.92) {
        var rowsC = [], row = [], rw = 0, lim = RTY.W * 0.94;
        order.forEach(function (i) { var w = items[i].w * kk + 0.07 * kk; if (row.length && rw + w > lim) { rowsC.push({ ks: row, w: rw }); row = []; rw = 0; } row.push(i); rw += w; });
        rowsC.push({ ks: row, w: rw });
        var lh = (H + 0.075) * kk; if (rowsC.length * lh <= 1.5) break;
      }
      rowsC.forEach(function (rr, ri) {
        var x = -rr.w / 2 + ((ri * 37) % 5 - 2) * 0.02 * kk, y = RTY.cy + (rowsC.length - 1) / 2 * lh - ri * lh;
        rr.ks.forEach(function (i) { var w = items[i].w * kk; out[i] = { x: x + w / 2 + 0.035 * kk, y: y + (((i * 31) % 7) - 3) * 0.006 * kk, z: ((((i + 3) * 7919) % 13) / 12 - 0.5) * 0.55 }; x += w + 0.07 * kk; });
      });
      return { pos: out, labels: [], k: kk };
    }
    if (mode === 'ring') {   // a ring lying in depth, words spaced by their own width
      var sum = items.reduce(function (a, it) { return a + it.w + 0.08; }, 0), R2 = clamp(sum / (2 * Math.PI) * 0.6, 0.5, 0.95), acc = 0;
      for (var j = 0; j < n; j++) { var t = (acc + items[j].w / 2) / sum * 2 * Math.PI; acc += items[j].w + 0.08; out.push({ x: Math.sin(t) * R2, y: RTY.cy + Math.sin(t * 3) * 0.1, z: Math.cos(t) * R2 * 0.75 }); }
      return { pos: out, labels: [], k: 1 };
    }
    var cols = [];
    if (mode === 'groups') {   // a column per group (a long one carries on in the next), the group's name on top
      var by = []; for (var g = 0; g < ngroups; g++) by.push([]);
      items.forEach(function (it, q) { by[clamp(it.g | 0, 0, ngroups - 1)].push(q); });
      by.forEach(function (ks, gi) { for (var s = 0; s < ks.length; s += 8) cols.push({ g: gi, ks: ks.slice(s, s + 8), first: s === 0 }); });
    } else {   // line: a centred column (several side by side for a long list)
      for (var s2 = 0; s2 < n; s2 += 10) { var ks2 = []; for (var q2 = s2; q2 < Math.min(n, s2 + 10); q2++) ks2.push(q2); cols.push({ g: -1, ks: ks2 }); }
    }
    cols.forEach(function (c) { c.w = Math.max.apply(null, c.ks.map(function (q) { return items[q].w; }).concat([0.2])); });
    // the columns go in one band, or two or three bands one above the other — whichever lets the words be biggest;
    // a group's columns always stay together in one band
    var units = []; cols.forEach(function (c) { var last = units[units.length - 1]; if (mode === 'groups' && last && last[0].g === c.g) last.push(c); else units.push([c]); });
    var uw = function (u) { return u.reduce(function (a, c) { return a + c.w; }, 0) + gap * 2 * (u.length - 1); };
    var best = null;
    for (var nb = 1; nb <= Math.min(3, units.length); nb++) {
      var bands = [], cur = [], acc = 0, target = units.reduce(function (a, u) { return a + uw(u); }, 0) / nb;
      units.forEach(function (u, ui) { if (cur.length && acc + uw(u) / 2 > target * (bands.length + 1) && bands.length < nb - 1) { bands.push(cur); cur = []; } cur.push(u); acc += uw(u); });
      bands.push(cur);
      var bw = bands.map(function (b) { var cs = [].concat.apply([], b); return cs.reduce(function (a, c) { return a + c.w; }, 0) + gap * 2 * (cs.length - 1); });
      var bh = bands.map(function (b) { var cs = [].concat.apply([], b); return Math.max.apply(null, cs.map(function (c) { return c.ks.length; })) * (H + gap) + (mode === 'groups' ? H + 0.03 : 0); });
      var kk = Math.min(1, RTY.W / Math.max.apply(null, bw), 1.5 / (bh.reduce(function (a, v) { return a + v; }, 0) + 0.08 * (bands.length - 1)));
      if (!best || kk > best.k + 0.02) best = { k: kk, bands: bands, bw: bw, bh: bh };
    }
    k = best.k; var totalH = (best.bh.reduce(function (a, v) { return a + v; }, 0) + 0.08 * (best.bands.length - 1)) * k, y = RTY.cy + totalH / 2;
    best.bands.forEach(function (b, bi) {
      var cs = [].concat.apply([], b), x = -best.bw[bi] * k / 2, top = y - (mode === 'groups' ? (H + 0.03) * k : 0) - H * k / 2;
      cs.forEach(function (c) {
        var cx = x + c.w * k / 2;
        c.ks.forEach(function (q, r) { out[q] = { x: cx, y: top - r * (H + gap) * k, z: 0 }; });
        if (c.first) labels.push({ g: c.g, x: cx, y: top + (H + 0.03) * k, z: 0 });
        x += (c.w + gap * 2) * k;
      });
      y -= (best.bh[bi] + 0.08) * k;
    });
    return { pos: out, labels: labels, k: k };
  }

  /* ================================================================ pure: 79 comic space
     The panels hang in space like a comic page pulled apart in depth. A list is told as a story only when it reads
     like one (steps, numbers, years) or the user says so; otherwise it is a storyboard wall, in list order, with no
     numbers or arrows claiming that one thing leads to the next. */
  var CMX = { cap: 9, w: 0.62, h: 0.46, t: 0.02, size: { w: 3, d: 1, h: 2 } };
  function comicNarrative(titles) {
    if (titles.length < 2) return false;
    var marked = titles.filter(function (t) { t = String(t || ''); return /^\s*(\d+\s*[.)、:：-]|\d+\s|step\b|stage\b|phase\b|chapter\b|part\b|第\s*[\d一二三四五六七八九十]+|[ivx]+[.)]\s)/i.test(t) || /(^|[^0-9])(1[0-9]{3}|20[0-9]{2})([^0-9]|$)/.test(t); }).length;
    return marked / titles.length >= 0.6;
  }
  function comicLayout(n) {
    var cols = n <= 4 ? 2 : 3, rows = Math.max(1, Math.ceil(n / cols)), out = [];
    for (var i = 0; i < n; i++) { var r = Math.floor(i / cols), c = i % cols; out.push({ x: (c - (cols - 1) / 2) * (CMX.w + 0.12), y: 1.2 + ((rows - 1) / 2 - r) * (CMX.h + 0.1), z: (r + c) % 2 ? -0.16 : 0.1, ry: (c - (cols - 1) / 2) * -0.12 }); }
    return out;
  }

  var PURE = { RTY: RTY, RT_MODES: RT_MODES, RT_RULES: RT_RULES, rtLayout: rtLayout, CMX: CMX, comicNarrative: comicNarrative, comicLayout: comicLayout, FER: FER, ferRing: ferRing, ferAngle: ferAngle, JBX: JBX, jbxX: jbxX, SRT: SRT, RULES: RULES, sortKey: sortKey, sortBins: sortBins, sortedOrder: sortedOrder, srtStage: srtStage, hasStudy: hasStudy, DRUM: DRUM, SPF: SPF, sfLine: sfLine, flapSeq: flapSeq, WDR: WDR, drumRing: drumRing, drumWord: drumWord, drumRead: drumRead, forward: forward, cleanCfg: cleanCfg, VERSION: VERSION, CATALOG: CATALOG, modeOf: modeOf, mod: mod, spin: spin, drive: drive, shortWay: shortWay, CAR: CAR, pocket: pocket, pages: pages, faceAt: faceAt, angleFor: angleFor, ROL: ROL, rolAngle: rolAngle, FLP: FLP, flipRing: flipRing, flipFall: flipFall, flipPose: flipPose, PAT: PAT, patPath: patPath, patTray: patTray, patSlot: patSlot, patLoad: patLoad, orderRefs: orderRefs, swapped: swapped, cleanMx: cleanMx, initial: initial };
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
    var mx = cleanMx(d.mx), D = DRV[mx.type], L = mx.list === '*' ? allLists(ix) : U.listOf(ix, mx.list), all = L ? L.cards : [], by = {}; all.forEach(function (c) { by[c.ref] = c; });
    var refs = orderRefs(all, mx), np = pages(refs.length, D.cap), page = Math.min(mx.page, np - 1);
    return { mx: mx, list: L, refs: refs, pages: np, page: page, shown: refs.slice(page * D.cap, (page + 1) * D.cap).map(function (r) { return by[r]; }) };
  }
  function allLists(ix) { var seen = {}, cards = []; ix.lists.forEach(function (l) { l.cards.forEach(function (c) { if (!seen[c.ref]) { seen[c.ref] = 1; cards.push(c); } }); }); return { id: '*', title: (ix.title || '看板') + ' · 全部列表', cards: cards }; }
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
        [-1, 1].forEach(function (sd) { var x = sd * 0.3; S.box(x - 0.02, 0.06, -0.16, x + 0.02, FLP.cy + FLP.rho + 0.01, 0.16, iron); });
        S.box(-0.3, 0.06, -0.19, 0.3, 0.16, -0.16, iron);
        S.box(-0.3, FLP.cy + 0.07, 0.05, -0.27, FLP.cy + FLP.ch + 0.09, 0.08, iron); S.box(-0.3, FLP.cy + FLP.ch + 0.065, 0.03, -0.18, FLP.cy + FLP.ch + 0.09, 0.1, brass);   // the catch that holds the standing cards
        Sp.box(-0.28, -0.014, -0.014, 0.28, 0.014, 0.014, iron); Sp.box(-0.38, -0.01, -0.01, 0.46, 0.01, 0.01, steel);   // a thin spool: the cards hang in front of it
        Cr.box(0, -0.025, -0.025, 0.03, 0.2, 0.025, steel); Cr.box(0.03, 0.15, -0.03, 0.13, 0.21, 0.03, red);   // crank arm and handle
        function gear(B, r, col) { disc(B, 0, 0.03, 0, 0, r, col, 0.03); for (var k = 0; k < 8; k++) { var t = k * Math.PI / 4, y = Math.sin(t) * (r + 0.015), z = Math.cos(t) * (r + 0.015); B.box(0, y - 0.022, z - 0.022, 0.03, y + 0.022, z + 0.022, col); } }
        gear(G1, 0.11, brass); gear(G2, 0.07, steel);
        return { keep: 1, solid: S.geo(), spool: Sp.geo(), crank: Cr.geo(), g1: G1.geo(), g2: G2.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()); grp.add(solid(fr.solid, shadows));
      h.spool = solid(fr.spool, shadows); h.spool.position.set(0, FLP.cy + FLP.rho - 0.016, 0); grp.add(h.spool);
      h.crank = solid(fr.crank, shadows); h.crank.position.set(0.46, FLP.cy + FLP.rho - 0.016, 0); grp.add(h.crank);
      h.g1 = solid(fr.g1, shadows); h.g1.position.set(0.335, FLP.cy + FLP.rho - 0.016, 0); grp.add(h.g1);
      h.g2 = solid(fr.g2, shadows); h.g2.position.set(0.335, FLP.cy - 0.03, 0.185); grp.add(h.g2);
      h.carrier = new (T().Group)(); grp.add(h.carrier); h.ring = flipRing(h.info.shown.length); h.block = h.spool;
    },
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) { var p = flipPose(c.slot, a, h.ring); hingeCard(o, FLP.cy + FLP.rho, p.z, p.phi, FLP.ch); },
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
        var Dv = new U.Buf(); Dv.box(-0.4, PAT.y0, -0.012, 0.4, PAT.y0 + PAT.Ls, 0.012, dark);   // the partition between the up and the down run: the window shows its own tray only
        return { keep: 1, solid: S.geo(), glow: G.geo(), divider: Dv.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()); grp.add(solid(fr.solid, shadows)); grp.add(new (T().Mesh)(fr.glow, U.mats().glow));
      h.divider = solid(fr.divider, shadows); grp.add(h.divider);
      h.carrier = new (T().Group)(); grp.add(h.carrier); h.trays = [];
      var wood = use(matRes('#8f5f3d')).mat, lip = use(matRes('#5d3f2a')).mat;
      for (var t = 0; t < PAT.trays; t++) {
        var g = new (T().Group)(), b = new (T().Mesh)(U.mats().box, wood); b.scale.set(0.82, 0.03, 0.22); b.position.y = -0.015; g.add(b);
        var l = new (T().Mesh)(U.mats().box, lip); l.scale.set(0.82, 0.05, 0.02); l.position.set(0, 0.01, 0.11); g.add(l);
        var tag = new (T().Mesh)(U.mats().plane, use(U.signRes(String(t + 1), 1.6, 1.6, '#f2c13d', '#2b2205')).mat); tag.scale.set(0.07, 0.07, 1); tag.position.set(-0.36, 0.005, 0.1215); g.add(tag);
        h.carrier.add(g); h.trays.push(g);
      }
      h.block = h.divider;
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

  // ---------------------------------------------------------------- 14 ferris wheel
  DRV.ferris = {
    size: FER.size, cap: FER.cap, cs: FER, step: 1, autoSpeed: 0.22, axis: 'x', gain: 4, dir: 1, flip: 'y', motor: 1.3, waitArrive: true,
    cam: { p: [0, 1.3, 4.4], look: [0, 1.12, 0] }, hint: '左右拖动转动摩天轮 · 点一个吊舱（或下面的编号），它会转到上下客台 · 点舱里的卡片打开它',
    frame: function (n) {
      return U.res('mc|ferris|frame|' + n, function () {
        var S = new U.Buf(), Rr = new U.Buf(), steel = rgb('#c9ced6'), white = rgb('#f3efe6'), blue = rgb('#2f6fd6'), wood = rgb('#7a5334'), dark = rgb('#3b4250'), gold = rgb('#d9b24a'), stone = rgb('#b9b2a4');
        S.box(-0.95, 0, -0.45, 0.95, 0.08, 0.45, wood);
        S.box(-0.3, 0.08, 0.14, 0.3, 0.13, 0.42, stone); S.box(-0.12, 0.13, 0.3, 0.12, 0.16, 0.42, rgb('#9a6a3c'));   // the boarding platform and its step
        [-0.18, 0.18].forEach(function (z) { for (var t = 0; t <= 1.0001; t += 1 / 26) { [-1, 1].forEach(function (sd) { var x = sd * 0.64 * (1 - t), y = 0.08 + (FER.cy - 0.08) * t; S.box(x - 0.025, y - 0.025, z - 0.025, x + 0.025, y + 0.025, z + 0.025, steel); }); } });   // two A-frames to the axle
        S.box(-0.045, FER.cy - 0.045, -0.22, 0.045, FER.cy + 0.045, 0.22, dark);
        for (var k = 0; k < 150; k++) { var t = k / 150 * 2 * Math.PI, x = Math.cos(t) * FER.R, y = Math.sin(t) * FER.R; Rr.box(x - 0.021, y - 0.021, -0.115, x + 0.021, y + 0.021, -0.085, k % 6 === 0 ? gold : white); Rr.box(x - 0.021, y - 0.021, 0.085, x + 0.021, y + 0.021, 0.115, k % 6 === 3 ? gold : white); }   // two rims, lamps along them
        for (var j = 0; j < n; j++) {
          var tj = -Math.PI / 2 + j * 2 * Math.PI / n;
          for (var r = 0.09; r < FER.R; r += 0.045) { var x2 = Math.cos(tj) * r, y2 = Math.sin(tj) * r; Rr.box(x2 - 0.011, y2 - 0.011, -0.111, x2 + 0.011, y2 + 0.011, -0.089, steel); Rr.box(x2 - 0.011, y2 - 0.011, 0.089, x2 + 0.011, y2 + 0.011, 0.111, steel); }
          var px = Math.cos(tj) * FER.R, py = Math.sin(tj) * FER.R; Rr.box(px - 0.016, py - 0.016, -0.13, px + 0.016, py + 0.016, 0.13, gold);   // the pin a gondola hangs from
        }
        Rr.box(-0.09, -0.09, -0.125, 0.09, 0.09, 0.125, blue);
        return { keep: 1, solid: S.geo(), rotor: Rr.geo() };
      });
    },
    gondola: function (col) {
      return U.res('mc|ferris|gondola|' + col, function () {
        var B = new U.Buf(), c = rgb(col), steel = rgb('#c9ced6'), dark = rgb('#3b4250');
        B.box(-0.012, -0.075, -0.012, 0.012, 0, 0.012, steel);
        B.box(-0.17, -0.095, -0.12, 0.17, -0.065, 0.12, c); B.box(-0.16, -0.375, -0.12, 0.16, -0.345, 0.12, c);   // roof · floor
        B.box(-0.16, -0.345, -0.12, 0.16, -0.095, -0.1, dark);   // back
        [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { B.box(sx * 0.16 - 0.011, -0.345, sz * 0.11 - 0.011, sx * 0.16 + 0.011, -0.095, sz * 0.11 + 0.011, steel); }); });
        B.box(-0.16, -0.345, 0.1, 0.16, -0.29, 0.12, c);   // the front rail
        return { keep: 1, geo: B.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var n = ferRing(h.info.shown.length), fr = use(this.frame(n)), cols = ['#de4a3a', '#f2c13d', '#3f7fe0', '#58b947'];
      h.n = n; grp.add(solid(fr.solid, shadows));
      h.rotor = solid(fr.rotor, shadows); h.rotor.position.set(0, FER.cy, 0); grp.add(h.rotor); h.block = null;
      h.gond = []; h.cabins = []; h.swing = 0; h.lastA = null;
      for (var i = 0; i < n; i++) { var g = new (T().Group)(), m = solid(use(this.gondola(cols[i % 4])).geo, shadows); m.userData.gondola = i; g.add(m); grp.add(g); h.gond.push(g); h.cabins.push(m); }
    },
    pickables: function (h) { return h.cabins; },
    parentOf: function (h, c) { return h.gond[c.slot]; },
    home: function (h, c, a, o) { o.position.set(0, -0.345 + FER.ch / 2 + 0.003, 0); o.rotation.set(0, 0, 0); },
    apply: function (h, a, first) {
      var d = h.lastA == null ? 0 : a - h.lastA; h.lastA = a; h.swing += (clamp(d * 9, -0.3, 0.3) - h.swing) * 0.12;   // the gondolas lag a little behind the wheel, then hang level again
      h.rotor.rotation.z = -a * 2 * Math.PI / h.n;
      for (var i = 0; i < h.n; i++) { var t = ferAngle(i, a, h.n); h.gond[i].position.set(Math.cos(t) * FER.R, FER.cy + Math.sin(t) * FER.R, 0); h.gond[i].rotation.z = h.swing; }
      if (first) h.cards.forEach(function (c) { DRV.ferris.home(h, c, a, c.mesh); });
    },
    aOf: function (pos, info) { return mod(pos, ferRing(info.shown.length)); }, posOf: function (a, info) { return mod(Math.round(a), ferRing(info.shown.length)); },
    target: function (h, c, a) { return shortWay(a, c.slot, h.n); },
    front: function (h, a) { var i = mod(Math.round(a), h.n); return h.cards.filter(function (c) { return Math.abs(mod(c.slot - i + h.n / 2, h.n) - h.n / 2) <= 2; }); },
    where: function (c) { return '第 ' + (c.slot + 1) + ' 号吊舱'; },
    fetchSay: function (c) { return '把第 ' + (c.slot + 1) + ' 号吊舱转到上下客台…'; },
    tap: function (h, o, I) { if (o.userData.gondola == null) return; DRV.ferris.cmd(h, 'car', String(o.userData.gondola), I); },
    extra: function (h, a) { var at = mod(Math.round(a), h.n), out = []; for (var i = 0; i < h.n; i++) { var c = h.cards.filter(function (q) { return q.slot === i; })[0]; out.push('<button type="button" data-mc="car" data-arg="' + i + '"' + (i === at ? ' class="on"' : '') + '>' + (i + 1) + '<small>' + (c ? esc(initial(c.card.title)) : '空') + '</small></button>'); } return '<div class="mc-tabs" aria-label="吊舱">' + out.join('') + '</div>'; },
    cmd: function (h, a, arg, I) {
      if (a !== 'car') return;
      if (I.out) { I.api.back(function () { DRV.ferris.cmd(h, a, arg, I); }); return true; }
      var i = +arg, t = shortWay(I.s.a, i, h.n); I.api.go(t, true); I.api.say('第 ' + (i + 1) + ' 号吊舱 → 上下客台' + (Math.round(Math.abs(t - I.s.a)) ? '（转 ' + Math.round(Math.abs(t - I.s.a)) + ' 格）' : '')); return true;
    }
  };

  // ---------------------------------------------------------------- 19 jukebox
  DRV.jukebox = {
    size: JBX.size, cap: JBX.cap, cs: JBX, step: 1, autoSpeed: 0, axis: 'x', gain: 7, dir: 1, flip: 'y', motor: 6, waitArrive: true, worldAuto: false, keepFront: false,
    autoLabel: ['▶ 自动点播', '⏸ 停止点播'],
    cam: { p: [0, 1.25, 2.95], look: [0, 1.04, 0] }, hint: '左右拖动翻看唱片架 · 点编号键（或一张唱片），机械臂把它取到中央展示台 · 放回时机械臂送回原位',
    frame: function () {
      return U.res('mc|jukebox|frame', function () {
        var S = new U.Buf(), G = new U.Buf(), L = new U.Buf(), wood = rgb('#8a4b2a'), dark = rgb('#3a2016'), chrome = rgb('#d5dae2'), red = rgb('#c5302c');
        S.box(-0.46, 0, -0.32, 0.46, 0.2, 0.34, wood);   // plinth
        S.box(-0.46, 0.2, -0.32, -0.4, 1.55, 0.34, wood); S.box(0.4, 0.2, -0.32, 0.46, 1.55, 0.34, wood);   // sides
        S.box(-0.4, 0.2, -0.32, 0.4, 1.55, -0.28, dark);   // back
        S.box(-0.4, 0.2, 0.28, 0.4, 0.42, 0.34, wood);   // the panel with the keys
        S.box(-0.4, 0.48, -0.2, 0.4, 0.52, 0.14, dark); S.box(-0.4, 0.52, 0.11, 0.4, 0.58, 0.14, dark); S.box(-0.4, 0.52, -0.2, 0.4, 0.58, -0.17, dark);   // the crate the records stand in
        S.box(-0.4, 0.96, -0.08, 0.4, 0.99, -0.03, chrome);   // the rail
        S.box(-0.13, 1.07, 0.05, 0.13, 1.11, 0.3, chrome); S.box(-0.03, 0.52, -0.27, 0.03, 1.11, -0.21, chrome); S.box(-0.03, 1.07, -0.27, 0.03, 1.11, 0.06, chrome);   // the stage, on an arm from the back wall (the records stay in sight)
        G.box(-0.1, 1.11, 0.08, 0.1, 1.12, 0.27, rgb('#f2a33a'));
        for (var x = -0.46; x < 0.46; x += 0.04) { var y = Math.sqrt(Math.max(0, 0.46 * 0.46 - (x + 0.02) * (x + 0.02))); for (var yy = 1.55 + Math.max(0, y - 0.1); yy < 1.55 + y; yy += 0.04) S.box(x, yy, -0.32, x + 0.04, yy + 0.04, 0.34, wood); var yi = 1.55 + Math.max(0, y - 0.13); G.box(x + 0.005, yi, 0.33, x + 0.035, yi + 0.025, 0.35, x < -0.1 ? red : x > 0.1 ? rgb('#3f7fe0') : rgb('#f2c13d')); }   // the arch, lit
        [-0.42, 0.42].forEach(function (x) { S.box(x - 0.02, 0.42, 0.33, x + 0.02, 1.55, 0.36, chrome); });
        L.box(-0.4, 0.42, 0.3, 0.4, 1.55, 0.31, [1, 1, 1]);   // the glass
        return { keep: 1, solid: S.geo(), glow: G.geo(), glass: L.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()), M = U.mats(); grp.add(solid(fr.solid, shadows)); grp.add(new (T().Mesh)(fr.glow, M.glow));
      var gl = new (T().Mesh)(fr.glass, M.glass); gl.renderOrder = 2; grp.add(gl); h.glass = gl;
      h.n = Math.max(1, h.info.shown.length); h.carrier = new (T().Group)(); grp.add(h.carrier); h.block = null;
      var chrome = use(matRes('#d5dae2')).mat, dark = use(matRes('#3b4250')).mat;
      h.cart = new (T().Mesh)(M.box, chrome); h.cart.scale.set(0.07, 0.05, 0.08); grp.add(h.cart);
      h.rod = new (T().Mesh)(M.box, dark); grp.add(h.rod);
      h.grip = new (T().Mesh)(M.box, chrome); h.grip.scale.set(0.1, 0.025, 0.05); grp.add(h.grip);
      h.keys = [];
      var cols = 12, kw = 0.056; for (var s = 0; s < h.n; s++) {
        var r = Math.floor(s / cols), c = s % cols, x = -0.33 + c * (kw + 0.004) + kw / 2, y = 0.36 - r * 0.075;
        var k = new (T().Mesh)(M.box, use(matRes('#efe6d2')).mat); k.scale.set(kw, 0.06, 0.02); k.position.set(x, y, 0.345); k.userData.key = s; grp.add(k); h.keys.push(k);
        var lab = new (T().Mesh)(M.plane, use(U.signRes(String(s + 1), 1.4, 1.4, '#efe6d2', '#2b2205')).mat); lab.scale.set(0.045, 0.045, 1); lab.position.set(x, y, 0.3555); grp.add(lab);
      }
    },
    pickables: function (h) { return h.keys; },
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) { o.position.set(jbxX(c.slot, h.n), JBX.y + 0.04 * Math.max(0, 1 - Math.abs(c.slot - a)), JBX.z); o.rotation.set(0, Math.PI / 2 - JBX.lean, 0); },   // the record the arm is over stands a little up
    apply: function (h, a) {
      h.cards.forEach(function (c) { if (!c.busy) DRV.jukebox.home(h, c, a, c.mesh); });
      var carry = h.cards.filter(function (c) { return c.busy; })[0], x = carry ? carry.mesh.position.x : jbxX(a, h.n), y = carry ? carry.mesh.position.y + carry.mesh.scale.y / 2 + 0.02 : JBX.y + JBX.ch / 2 + 0.16;
      h.cart.position.set(x, 0.995, -0.055); h.rod.position.set(x, (0.97 + y) / 2, -0.055); h.rod.scale.set(0.018, Math.max(0.01, 0.97 - y), 0.018); h.grip.position.set(x, y, carry ? carry.mesh.position.z : -0.055);   // the arm hangs from its carriage down to the record it carries
    },
    tick: function (h) { return h.cards.some(function (c) { return c.busy; }); },
    aOf: function (pos, info) { return clamp(pos, 0, Math.max(0, info.shown.length - 1)); }, posOf: function (a, info) { return clamp(Math.round(a), 0, Math.max(0, info.shown.length - 1)); },
    limit: function (info) { return [0, Math.max(0, info.shown.length - 1)]; },
    target: function (h, c) { return c.slot; },
    handPose: function (I, flipped) { var st = JBX.stage, p = I.grp.localToWorld(new (T().Vector3)(st[0], st[1], st[2])), q = I.grp.getWorldQuaternion(new (T().Quaternion)()); if (flipped) q.multiply(new (T().Quaternion)().setFromEuler(new (T().Euler)(0, Math.PI, 0))); return { p: p, q: q, s: new (T().Vector3)(JBX.cw * JBX.big, JBX.ch * JBX.big, JBX.ct * 2) }; },
    front: function (h, a) { var i = Math.round(a); return h.cards.filter(function (c) { return Math.abs(c.slot - i) <= 2; }); },
    where: function (c) { return '唱片架第 ' + (c.slot + 1) + ' 号'; },
    fetchSay: function (c) { return '第 ' + (c.slot + 1) + ' 号 · 机械臂过去取…'; },
    tap: function (h, o, I) { if (o.userData.key == null) return; DRV.jukebox.cmd(h, 'num', String(o.userData.key), I); },
    extra: function (h, a, I) { return '<div class="mc-tabs" aria-label="点播编号">' + h.cards.map(function (c) { return '<button type="button" data-mc="num" data-arg="' + c.slot + '"' + (I.out && I.out.slot === c.slot || I.pending === c ? ' class="on"' : '') + ' title="' + esc(c.card.title) + '">' + (c.slot + 1) + '<small>' + esc(initial(c.card.title)) + '</small></button>'; }).join('') + '</div>'; },
    cmd: function (h, a, arg, I) {
      if (a !== 'num') return;
      var c = h.cards.filter(function (q) { return q.slot === +arg; })[0]; if (!c) return true;
      if (I.out === c) return true;
      if (I.out) { I.api.back(function () { I.api.pull(c); }); return true; }
      I.api.pull(c); return true;
    },
    // auto: one record after another — fetched, shown a while, put back by the arm
    autoTick: function (h, dt, I) {
      h.at = (h.at || 0) + dt;
      if (I.pending || h.cards.some(function (c) { return c.busy && c !== I.out; })) return;
      if (I.out) { if (h.at > 4.5) { h.at = 0; I.api.back(); } return; }
      if (h.at > 1.2 && h.cards.length) { h.at = 0; var next = h.cards[mod((h.lastAuto == null ? Math.round(I.s.a) - 1 : h.lastAuto) + 1, h.cards.length)]; h.lastAuto = next.slot; I.keepAuto = true; I.api.pull(next); I.keepAuto = false; }
    }
  };

  // ---------------------------------------------------------------- 11 sorting machine
  var BINCOL = ['#de4a3a', '#f08a2b', '#f2c13d', '#58b947', '#3f7fe0', '#8f6fe0'];
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  DRV.sorter = {
    size: SRT.size, cap: SRT.cap, cs: SRT, step: 1, autoSpeed: 0, axis: 'x', gain: 5, dir: 1, flip: 'y', worldAuto: false, keepFront: true,
    autoLabel: ['▶ 运行', '⏸ 暂停'],
    cam: { p: [0.1, 1.55, 2.9], look: [0, 0.36, 0] }, hint: '选分类规则，按「运行」：卡片一张张经过检测区，被推进对应的仓 · 左右拖动传送带可以前后拨 · 点一个仓看里面有什么',
    frame: function () {
      return U.res('mc|sorter|frame', function () {
        var S = new U.Buf(), G = new U.Buf(), steel = rgb('#9aa3ad'), dark = rgb('#2f3540'), yellow = rgb('#f2c13d'), wood = rgb('#7a5334'), black = rgb('#1f2329');
        S.box(-1.45, 0, -0.45, 1.45, 0.06, 0.45, wood);
        S.box(-1.12, SRT.beltY - 0.06, SRT.beltZ - 0.1, 1.12, SRT.beltY - 0.02, SRT.beltZ + 0.1, black);   // the belt
        [-1.12, 1.12].forEach(function (x) { S.box(x - 0.04, SRT.beltY - 0.08, SRT.beltZ - 0.11, x + 0.04, SRT.beltY, SRT.beltZ + 0.11, steel); });   // its rollers
        for (var x = -1.0; x <= 1.0; x += 0.4) { S.box(x - 0.025, 0.06, SRT.beltZ - 0.09, x + 0.025, SRT.beltY - 0.06, SRT.beltZ - 0.06, steel); S.box(x - 0.025, 0.06, SRT.beltZ + 0.06, x + 0.025, SRT.beltY - 0.06, SRT.beltZ + 0.09, steel); }
        S.box(-1.12, SRT.beltY - 0.02, SRT.beltZ - 0.12, 1.12, SRT.beltY + 0.03, SRT.beltZ - 0.1, steel);   // the back guide rail
        // the hopper: a chute the items wait in, lying flat; the bottom one goes out onto the belt
        S.box(SRT.hopX - 0.14, SRT.beltY, SRT.beltZ - 0.12, SRT.hopX - 0.12, SRT.beltY + 0.5, SRT.beltZ + 0.12, dark); S.box(SRT.hopX + 0.12, SRT.beltY + 0.04, SRT.beltZ - 0.12, SRT.hopX + 0.14, SRT.beltY + 0.5, SRT.beltZ + 0.12, dark);
        S.box(SRT.hopX - 0.14, SRT.beltY, SRT.beltZ - 0.14, SRT.hopX + 0.14, SRT.beltY + 0.5, SRT.beltZ - 0.12, dark); S.box(SRT.hopX - 0.14, SRT.beltY - 0.06, SRT.beltZ - 0.14, SRT.hopX + 0.14, SRT.beltY - 0.02, SRT.beltZ + 0.14, dark);
        S.box(SRT.hopX - 0.16, 0.06, SRT.beltZ - 0.03, SRT.hopX - 0.12, SRT.beltY, SRT.beltZ + 0.03, steel);
        // the scanner arch
        S.box(SRT.scanX - 0.04, SRT.beltY - 0.02, SRT.beltZ - 0.14, SRT.scanX + 0.04, SRT.beltY + 0.26, SRT.beltZ - 0.11, yellow); S.box(SRT.scanX - 0.04, SRT.beltY - 0.02, SRT.beltZ + 0.11, SRT.scanX + 0.04, SRT.beltY + 0.26, SRT.beltZ + 0.14, yellow);
        S.box(SRT.scanX - 0.04, SRT.beltY + 0.26, SRT.beltZ - 0.14, SRT.scanX + 0.04, SRT.beltY + 0.3, SRT.beltZ + 0.14, yellow);
        // the bins in front of the belt, a chute from the belt into each
        SRT.binX.forEach(function (bx, k) {
          var c = rgb(BINCOL[k]), z0 = SRT.binZ - 0.06, z1 = SRT.binZ + 0.3;
          S.box(bx - 0.15, 0.06, z0, bx + 0.15, SRT.binFloor, z1, c);
          S.box(bx - 0.15, SRT.binFloor, z0, bx - 0.13, 0.32, z1, c); S.box(bx + 0.13, SRT.binFloor, z0, bx + 0.15, 0.32, z1, c);
          S.box(bx - 0.13, SRT.binFloor, z1 - 0.02, bx + 0.13, 0.24, z1, c); S.box(bx - 0.13, SRT.binFloor, z0, bx + 0.13, 0.3, z0 + 0.02, c);
          S.box(bx - 0.12, SRT.beltY - 0.05, SRT.beltZ + 0.1, bx + 0.12, SRT.beltY - 0.03, z0 + 0.02, steel);   // the chute
          S.box(bx - 0.03, SRT.beltY - 0.02, SRT.beltZ - 0.22, bx + 0.03, SRT.beltY + 0.09, SRT.beltZ - 0.14, dark);   // the pusher's cylinder
        });
        G.box(SRT.scanX - 0.03, SRT.beltY + 0.3, SRT.beltZ - 0.03, SRT.scanX + 0.03, SRT.beltY + 0.33, SRT.beltZ + 0.03, [1, 1, 1]);
        return { keep: 1, solid: S.geo(), glow: G.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()), M = U.mats(); grp.add(solid(fr.solid, shadows)); grp.add(new (T().Mesh)(fr.glow, M.glow));
      h.carrier = new (T().Group)(); grp.add(h.carrier); h.block = null;
      var cfg = h.info.mx.cfg || {}, cards = h.info.shown.filter(Boolean);
      h.list = cards; h.n = cards.length; h.studyOk = hasStudy(cards); h.src = h.info.mx.list;
      h.rule = RULES.some(function (r) { return r[0] === cfg.rule; }) ? cfg.rule : 'initial';
      if (h.rule === 'list' && h.src !== '*') h.rule = 'initial'; if (h.rule === 'study' && !h.studyOk) h.rule = 'initial';
      h.man = cfg.man || {}; DRV.sorter.resort(h);
      h.binMesh = []; h.binSign = [];
      SRT.binX.forEach(function (bx, k) {
        var pl = new (T().Mesh)(M.box, use(matRes(BINCOL[k])).mat); pl.scale.set(0.3, 0.02, 0.36); pl.position.set(bx, SRT.binFloor - 0.01, SRT.binZ + 0.12); pl.userData.bin = k; grp.add(pl); h.binMesh.push(pl);
        var b = h.sort.bins[k], sg = new (T().Mesh)(M.plane, use(U.signRes(b ? (k + 1) + ' · ' + b.label : (k + 1) + ' · 空', 3.6, 1.2, '#1f2329', '#ffffff')).mat); sg.scale.set(0.26, 0.085, 1); sg.position.set(bx, 0.2, SRT.binZ + 0.305); sg.userData.bin = k; grp.add(sg); h.binSign.push(sg);
      });
      h.push = SRT.binX.map(function (bx) { var m = new (T().Mesh)(M.box, use(matRes('#c9ced6')).mat); m.scale.set(0.16, 0.08, 0.025); grp.add(m); return m; });
      h.slats = []; for (var i = 0; i < 22; i++) { var sl = new (T().Mesh)(M.box, use(matRes('#3a3f48')).mat); sl.scale.set(0.02, 0.006, 0.19); grp.add(sl); h.slats.push(sl); }
      h.lamp = new (T().Mesh)(M.box, use(U.res('mc|sorter|lamp|' + U.uid(), function () { return { mat: new (T().MeshBasicMaterial)({ color: 0x444444 }) }; })).mat); h.lamp.scale.set(0.05, 0.03, 0.05); h.lamp.position.set(SRT.scanX, SRT.beltY + 0.335, SRT.beltZ); grp.add(h.lamp);
    },
    resort: function (h) {
      h.sort = sortBins(h.list, h.rule, h.man, SRT.bins); h.stack = {};
      h.sort.bins.forEach(function (b) { b.refs.forEach(function (r, j) { h.stack[r] = j; }); });
    },
    pickables: function (h) { return h.binMesh.concat(h.binSign); },   // a bin's label (or its floor) chooses the bin; a card in it is taken out
    parentOf: function (h) { return h.carrier; },
    home: function (h, c, a, o) {
      var i = c.slot, t = a - i, k = h.sort.binOf[c.card.ref] || 0, bx = SRT.binX[k], j = Math.min(h.stack[c.card.ref] || 0, 18), up = SRT.beltY + SRT.ch / 2;
      var bin = { x: bx, y: SRT.binFloor + SRT.ch / 2 + 0.005, z: SRT.binZ + j * 0.014, rx: -0.12 };
      if (t <= 0) { o.position.set(SRT.hopX, SRT.beltY + 0.012 + (i - a) * 0.012, SRT.beltZ); o.rotation.set(-Math.PI / 2, 0, 0); return; }   // waiting in the hopper, flat, the stack sinking as items leave
      if (t < 0.12) { var e = ease(t / 0.12); o.position.set(SRT.hopX + (SRT.x0 - SRT.hopX) * e, SRT.beltY + 0.012 + (up - SRT.beltY - 0.012) * e, SRT.beltZ); o.rotation.set(-Math.PI / 2 * (1 - e), 0, 0); return; }   // out of the hopper, standing up
      if (t < 0.62) { o.position.set(SRT.x0 + (bx - SRT.x0) * ease((t - 0.12) / 0.5), up, SRT.beltZ); o.rotation.set(0, 0, 0); return; }   // along the belt, past the scanner
      if (t < 0.8) { var p = ease((t - 0.62) / 0.18); o.position.set(bx, up, SRT.beltZ + (SRT.binZ - 0.02 - SRT.beltZ) * p); o.rotation.set(0, 0, 0); return; }   // pushed off the belt
      if (t < 1) { var q = ease((t - 0.8) / 0.2); o.position.set(bx, up + (bin.y - up) * q, SRT.binZ - 0.02 + (bin.z - SRT.binZ + 0.02) * q); o.rotation.set(bin.rx * q, 0, 0); return; }   // down the chute
      o.position.set(bin.x, bin.y, bin.z); o.rotation.set(bin.rx, 0, 0);
    },
    apply: function (h, a) {
      h.cards.forEach(function (c) { if (!c.busy) DRV.sorter.home(h, c, a, c.mesh); });
      var i = Math.floor(a), t = a - i, cur = h.list[i], k = cur ? h.sort.binOf[cur.ref] : -1;
      h.push.forEach(function (m, b) { var e = b === k && t > 0.6 && t < 0.84 ? Math.sin((t - 0.6) / 0.24 * Math.PI) : 0; m.position.set(SRT.binX[b], SRT.beltY + 0.03, SRT.beltZ - 0.13 + e * 0.2); });
      var run = clamp(a, 0, h.n) * 0.9; h.slats.forEach(function (sl, j) { sl.position.set(-1.1 + mod(j * 0.1 + run, 2.2), SRT.beltY - 0.017, SRT.beltZ); });   // the belt moves with the items
      var scan = cur && t > 0.14 && t < 0.36; h.lamp.material.color.set(scan ? BINCOL[k] : '#444444');   // the scanner lights in the colour of the bin it chose
    },
    aOf: function (pos, info) { return clamp(pos, 0, info.shown.filter(Boolean).length); }, posOf: function (a, info) { return clamp(Math.round(a), 0, info.shown.filter(Boolean).length); },
    limit: function (info) { return [0, info.shown.filter(Boolean).length]; },
    target: function (h, c, a) { return a; },
    front: function (h, a) {
      if (h.selBin != null) { var b = h.sort.bins[h.selBin]; return b ? b.refs.map(function (r) { return h.cards.filter(function (c) { return c.card.ref === r; })[0]; }).filter(Boolean) : []; }
      var i = Math.floor(a); return h.cards.filter(function (c) { return c.slot >= i - 1 && c.slot <= i + 2; });
    },
    where: function (c, h) { return '分好的仓里'; },
    tap: function (h, o, I) { if (o.userData.bin == null) return; DRV.sorter.cmd(h, 'bin', String(o.userData.bin), I); },
    extra: function (h, a, I) {
      var done = a >= h.n - 1e-6 && h.n > 0, rules = RULES.map(function (r) { var off = r[0] === 'list' && h.src !== '*' || r[0] === 'study' && !h.studyOk; return '<button type="button" data-mc="rule" data-arg="' + r[0] + '"' + (h.rule === r[0] ? ' class="on"' : '') + (off ? ' disabled title="' + (r[0] === 'list' ? '原始分类要先选「分整块看板」' : '这些卡片还没有学习记录') + '"' : '') + '>' + r[1] + '</button>'; }).join('');
      var bins = SRT.binX.map(function (x, k) { var b = h.sort.bins[k]; return '<button type="button" data-mc="bin" data-arg="' + k + '"' + (h.selBin === k ? ' class="on"' : '') + (b ? '' : ' disabled') + ' style="border-color:' + BINCOL[k] + '">' + (k + 1) + '<small>' + esc(b ? b.label + ' · ' + b.refs.length : '空') + '</small></button>'; }).join('');
      var wb = done && h.src !== '*' && h.n === (h.info.list ? h.info.list.cards.length : -1) ? '<button type="button" data-mc="write">✍️ 按分仓顺序写回看板…</button>' : '';
      return '<div class="mc-tabs" aria-label="分类规则">' + rules + '<button type="button" data-mc="src">' + (h.src === '*' ? '↩ 只分这个列表' : '🗂 分整块看板') + '</button></div>' +
        '<div class="mc-tabs" aria-label="仓位">' + bins + '<button type="button" data-mc="restart">↺ 重新装料</button>' + wb + (I.undoWrite ? '<button type="button" data-mc="unwrite">↶ 撤销写回</button>' : '') + '</div>';
    },
    cardActions: function (h, c) { return '<span class="mc-l">放进：</span>' + SRT.binX.map(function (x, k) { var b = h.sort.bins[k]; return b || h.rule === 'custom' ? '<button type="button" data-mc="tobin" data-arg="' + k + '"' + ((h.sort.binOf[c.card.ref] || 0) === k ? ' class="on"' : '') + ' style="border-color:' + BINCOL[k] + '">' + (k + 1) + '</button>' : ''; }).join(''); },
    // run: the belt goes on by itself to the last item, then stops
    autoTick: function (h, dt, I) {
      if (I.out) return;
      if (I.s.a < h.n) { I.s.a = Math.min(h.n, I.s.a + SRT.speed * dt); I.s.target = null; I.s.w = 0; if (I.s.a >= h.n) { I.mx.auto = false; I.s.a = h.n; I.mx.pos = h.n; I.api.chrome(); I.api.say('分拣完成：' + h.sort.bins.map(function (b, k) { return (k + 1) + '「' + b.label + '」' + b.refs.length; }).join(' · ')); } }
      else { I.mx.auto = false; I.api.chrome(); }
    },
    reload: function (h, I, msg) { I.mx.pos = 0; I.api.load(); I.mx.auto = true; I.s.a = 0; I.api.chrome(); I.api.say(msg); },
    cmd: function (h, a, arg, I) {
      var cfg = I.mx.cfg = I.mx.cfg || {};
      if (a === 'rule') { if (I.out) { I.api.back(function () { DRV.sorter.cmd(h, a, arg, I); }); return true; } cfg.rule = arg; cfg.man = {}; DRV.sorter.reload(h, I, '按「' + RULES.filter(function (r) { return r[0] === arg; })[0][1] + '」重新分拣'); return true; }
      if (a === 'restart') { if (I.out) { I.api.back(function () { DRV.sorter.cmd(h, a, arg, I); }); return true; } DRV.sorter.reload(h, I, '重新装料 · 再分一遍'); return true; }
      if (a === 'src') { if (I.out) { I.api.back(function () { DRV.sorter.cmd(h, a, arg, I); }); return true; } if (I.mx.list === '*') { I.mx.list = cfg.home || ''; if (cfg.rule === 'list') cfg.rule = 'initial'; } else { cfg.home = I.mx.list; I.mx.list = '*'; cfg.rule = 'list'; } cfg.man = {}; I.mx.page = 0; DRV.sorter.reload(h, I, I.mx.list === '*' ? '整块看板的卡片都装进料斗（一页 ' + SRT.cap + ' 张），按原始分类分' : '回到原来的列表'); return true; }
      if (a === 'bin') { var k = +arg; h.selBin = h.selBin === k ? null : k; I.api.chrome(); var b = h.sort.bins[k]; I.api.say(h.selBin == null ? '' : b ? '仓 ' + (k + 1) + '「' + b.label + '」· ' + b.refs.length + ' 件（下面一排）· 点一张取出来看' : '仓 ' + (k + 1) + ' 是空的'); return true; }
      if (a === 'tobin') {   // the user moves one item to another bin: kept as their own choice (only the layout of the machine)
        if (!I.out) return true; var c = I.out, to = +arg; h.man[c.card.ref] = to; cfg.man = h.man; DRV.sorter.resort(h);
        I.api.back(function () { if (INS) { INS.api.chrome(); } }); I.api.say('「' + c.card.title + '」放进仓 ' + (to + 1) + (h.sort.bins[to] ? '「' + h.sort.bins[to].label + '」' : '') + ' · 只是装置里的布局'); return true;
      }
      if (a === 'write') { DRV.sorter.confirm(h, I); return true; }
      if (a === 'write-no') { var cf = I.el.querySelector('.mc-confirm'); if (cf) cf.remove(); return true; }
      if (a === 'write-yes') { var cf2 = I.el.querySelector('.mc-confirm'); if (cf2) cf2.remove(); DRV.sorter.write(h, I); return true; }
      if (a === 'unwrite') { DRV.sorter.unwrite(h, I); return true; }
    },
    confirm: function (h, I) {
      var L = h.info.list, box = document.createElement('div'); box.className = 'mc-confirm'; box.setAttribute('role', 'alertdialog');
      box.innerHTML = '<p>按分好的仓，把看板里「' + esc(L.title) + '」的 ' + h.n + ' 张卡片重新排序？<br><small>先仓 1 再仓 2 …，同一仓里保持原来的先后。卡片的内容不变，可以撤销一次。</small></p><div><button type="button" data-mc="write-no">取消</button><button type="button" class="go" data-mc="write-yes">✓ 重排看板列表</button></div>';
      I.el.querySelector('.mc-stage').appendChild(box); box.querySelector('.go').focus();
    },
    // the one place a machine changes a list — only after the user said yes, and only the order
    reorder: function (bid, lid, ids) {
      var A = root.MinestAI, prev = null; if (!A || !A.updateBoard) return null;
      A.updateBoard(bid, function (b) {
        var cols = (b.columns || []).map(function (col) {
          if (col.id === lid) { var plain = col.cards.filter(function (c) { return !(c.stack && c.stack.length); }), by = {}; plain.forEach(function (c) { by[c.id] = c; }); if (ids.some(function (id) { return !by[id]; }) || ids.length !== plain.length) return col; prev = plain.map(function (c) { return c.id; }); var k = 0; return Object.assign({}, col, { cards: col.cards.map(function (c) { return c.stack && c.stack.length ? c : by[ids[k++]]; }) }); }
          var hit = false, cards = col.cards.map(function (c) { if (c.id !== lid || !(c.stack && c.stack.length)) return c; var by = {}; c.stack.forEach(function (s) { by[s.id] = s; }); if (ids.length !== c.stack.length || ids.some(function (id) { return !by[id]; })) return c; hit = true; prev = c.stack.map(function (s) { return s.id; }); return Object.assign({}, c, { stack: ids.map(function (id) { return by[id]; }) }); });
          return hit ? Object.assign({}, col, { cards: cards }) : col;
        });
        return Object.assign({}, b, { columns: cols });
      });
      return prev;
    },
    write: function (h, I) {
      var L = h.info.list, ix = U.index(I.ctx.host.boardId()), ids = sortedOrder(h.sort).map(function (r) { return r.split('/').pop(); }), prev = DRV.sorter.reorder(ix.bid, L.id, ids);
      if (!prev) return I.api.say('没有写回：这个列表在看板上变了（或找不到），请重新装料再试');
      I.undoWrite = { bid: ix.bid, lid: L.id, ids: prev }; I.mx.order = 'list'; I.mx.pos = h.n; setTimeout(function () { if (INS === I) { I.api.load(); I.s.a = h.n; I.api.chrome(); } }, 450);
      I.api.say('写好了：看板里「' + L.title + '」已按分仓顺序排好 · 可以撤销一次');
    },
    unwrite: function (h, I) { var u = I.undoWrite; if (!u) return; var ok = DRV.sorter.reorder(u.bid, u.lid, u.ids); I.undoWrite = null; setTimeout(function () { if (INS === I) { I.api.load(); I.s.a = h.n; I.api.chrome(); } }, 450); I.api.say(ok ? '撤销了：看板列表回到原来的顺序' : '没能撤销：列表已经变了'); }
  };

  // ---------------------------------------------------------------- 09 split-flap board
  // one character half (top or bottom) as a flap face: dark flap, light character, the hinge line
  function flapRes(ch, half) {
    return U.res('sf|' + ch + '|' + half, function () {
      var W = 64, H = 96, full = U.canvas(W, H), g = full.getContext('2d'), cjk = /[^\x00-\x7f…]/.test(ch);
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a2a2c'); gr.addColorStop(0.5, '#1c1c1e'); gr.addColorStop(1, '#242426'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f4f1e8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = (cjk ? '700 54px' : '800 74px') + ' system-ui,-apple-system,"PingFang SC",sans-serif'; g.fillText(ch, W / 2, H / 2 + (cjk ? 2 : 4));
      var cv = U.canvas(W, H / 2), c2 = cv.getContext('2d'); c2.drawImage(full, 0, half === 't' ? 0 : H / 2, W, H / 2, 0, 0, W, H / 2);
      c2.fillStyle = '#000'; c2.fillRect(0, half === 't' ? H / 2 - 2 : 0, W, 2);   // the gap at the hinge
      var map = U.tex(cv, false);
      return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x555555, emissiveMap: map }) };
    });
  }
  function sfMat(h, ch, half) { var k = ch + '|' + half; if (!h.mats[k]) h.mats[k] = h.use(flapRes(ch, half)).mat; return h.mats[k]; }
  function sfTexts(h) {   // the board's lines for what it shows now: "NN TITLE…" per row
    var info = h.info, out = [];
    for (var r = 0; r < SPF.rows; r++) { var c = info.shown[r]; out.push(c ? sfLine(String(info.page * SPF.rows + r + 1).padStart(2, '0') + ' ' + c.title, SPF.cols) : sfLine('', SPF.cols)); }
    return out;
  }
  DRV.splitflap = {
    size: SPF.size, cap: SPF.cap, cs: null, step: 1, autoSpeed: 0, axis: 'none', ownCards: true, worldAuto: false, flip: 'y',
    autoLabel: ['▶ 自动翻页', '⏸ 停止翻页'],
    cam: { p: [0, 1.35, 2.15], look: [0, 1.33, 0] }, hint: '◀ ▶ 翻页，或在下面换一个列表：每一格字片都一片片翻到新字 · 点一行把它亮起来，再打开它',
    frame: function () {
      return U.res('mc|splitflap|frame', function () {
        var S = new U.Buf(), black = rgb('#16181c'), dark = rgb('#2b2f36'), steel = rgb('#9aa3ad'), yellow = rgb('#f2c13d'), W = SPF.cols * (SPF.mw + SPF.gx) + 0.1, Hh = SPF.rows * (SPF.mh + SPF.gy) + 0.16, top = SPF.top + 0.11, bot = top - Hh;
        S.box(-W / 2, bot, -0.08, W / 2, top, -0.03, black);   // the case
        S.box(-W / 2 - 0.03, bot - 0.03, -0.09, W / 2 + 0.03, bot, 0.05, dark); S.box(-W / 2 - 0.03, top, -0.09, W / 2 + 0.03, top + 0.06, 0.05, dark);
        S.box(-W / 2 - 0.03, bot, -0.09, -W / 2, top, 0.05, dark); S.box(W / 2, bot, -0.09, W / 2 + 0.03, top, 0.05, dark);
        S.box(-W / 2 + 0.02, top + 0.012, 0.05, W / 2 - 0.02, top + 0.05, 0.06, yellow);   // the header strip
        [-1, 1].forEach(function (sd) { var x = sd * (W / 2 - 0.12); S.box(x - 0.03, 0.06, -0.08, x + 0.03, bot - 0.03, -0.02, steel); S.box(x - 0.14, 0, -0.22, x + 0.14, 0.06, 0.16, dark); });   // two legs
        return { keep: 1, solid: S.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var fr = use(this.frame()), M = U.mats(); grp.add(solid(fr.solid, shadows)); h.block = null; h.mats = {}; h.mods = []; h.plates = []; h.lamps = [];
      var x0 = -(SPF.cols * (SPF.mw + SPF.gx) - SPF.gx) / 2 + SPF.mw / 2, lines = sfTexts(h), plateMat = use(matRes('#0d0e10')).mat;
      h.lampOn = use(U.res('mc|sf|lamp1', function () { return { keep: 1, mat: new (T().MeshBasicMaterial)({ color: 0xf2c13d }) }; })).mat; h.lampOff = use(U.res('mc|sf|lamp0', function () { return { keep: 1, mat: new (T().MeshBasicMaterial)({ color: 0x3a3424 }) }; })).mat;
      for (var r = 0; r < SPF.rows; r++) {
        var y = SPF.top - r * (SPF.mh + SPF.gy) - SPF.mh / 2, pl = new (T().Mesh)(M.box, plateMat);
        pl.scale.set(SPF.cols * (SPF.mw + SPF.gx) + 0.02, SPF.mh + SPF.gy * 0.6, 0.012); pl.position.set(0, y, -0.026); pl.userData.row = r; grp.add(pl); h.plates.push(pl);
        var lp = new (T().Mesh)(M.box, h.lampOff); lp.scale.set(0.032, 0.032, 0.012); lp.position.set(x0 - SPF.mw / 2 - 0.024, y, -0.012); grp.add(lp); h.lamps.push(lp);
        for (var c = 0; c < SPF.cols; c++) {
          var g = new (T().Group)(); g.position.set(x0 + c * (SPF.mw + SPF.gx), y, 0); grp.add(g);
          var ch = lines[r][c], top = new (T().Mesh)(M.plane, sfMat(h, ch, 't')), bot = new (T().Mesh)(M.plane, sfMat(h, ch, 'b'));
          top.scale.set(SPF.mw, SPF.mh / 2, 1); top.position.y = SPF.mh / 4; bot.scale.set(SPF.mw, SPF.mh / 2, 1); bot.position.y = -SPF.mh / 4; g.add(top); g.add(bot);
          var flap = new (T().Group)(), ff = new (T().Mesh)(M.plane, sfMat(h, ch, 't')), fb = new (T().Mesh)(M.plane, sfMat(h, ch, 'b'));
          ff.scale.set(SPF.mw, SPF.mh / 2, 1); ff.position.set(0, SPF.mh / 4, 0.0015); fb.scale.set(SPF.mw, SPF.mh / 2, 1); fb.position.set(0, SPF.mh / 4, -0.0005); fb.rotation.x = Math.PI;
          flap.add(ff); flap.add(fb); flap.visible = false; g.add(flap);
          h.mods.push({ r: r, c: c, top: top, bot: bot, flap: flap, ff: ff, fb: fb, cur: ch, next: ch, queue: [], t: -1, wait: 0, dur: 0.08 });
        }
      }
      h.sel = null;
    },
    // send the board to show what h.info says now: every module flips its own way there, a little after the one before
    retarget: function (h) {
      var lines = sfTexts(h);
      h.mods.forEach(function (m) {
        var to = lines[m.r][m.c], from = m.queue.length ? m.queue[m.queue.length - 1] : m.t >= 0 ? m.next : m.cur;
        var seq = flapSeq(from, to, m.r * 31 + m.c * 7); if (!seq.length) return;
        if (!m.queue.length && m.t < 0) m.wait = m.r * 0.1 + m.c * 0.035;
        m.queue = m.queue.concat(seq);
      });
      h.sel = null; DRV.splitflap.lamps(h);
    },
    lamps: function (h) { h.lamps.forEach(function (l, r) { l.material = h.sel === r ? h.lampOn : h.lampOff; }); },
    tick: function (h, dt) {
      var busy = false;
      h.mods.forEach(function (m) {
        if (m.t >= 0) {
          busy = true; m.t += dt / m.dur;
          if (m.t >= 1) { m.t = -1; m.flap.visible = false; m.cur = m.next; m.bot.material = sfMat(h, m.cur, 'b'); }   // the flap has landed: the new character is whole
          else m.flap.rotation.x = Math.PI * Math.pow(m.t, 1.7);   // the top half falls over the hinge, faster as it goes
          return;
        }
        if (!m.queue.length) return;
        busy = true; if ((m.wait -= dt) > 0) return;
        m.next = m.queue.shift(); m.dur = m.queue.length > 10 ? 0.045 : 0.075;
        m.top.material = sfMat(h, m.next, 't'); m.ff.material = sfMat(h, m.cur, 't'); m.fb.material = sfMat(h, m.next, 'b');   // behind the falling flap the next character's top is already there; under it the old bottom stays until the flap covers it
        m.flap.rotation.x = 0; m.flap.visible = true; m.t = 0;
      });
      h.busy = busy; return busy;
    },
    apply: function () {},
    aOf: function () { return 0; }, posOf: function () { return 0; },
    target: function (h, c, a) { return a; },
    pickables: function (h) { return h.plates; },
    front: function () { return null; },
    where: function () { return ''; },
    tap: function (h, o, I) { if (o.userData.row == null) return; DRV.splitflap.cmd(h, 'row', String(o.userData.row), I); },
    extra: function (h, a, I) {
      var ix = U.index(I.ctx.host.boardId()), sel = h.sel != null && h.info.shown[h.sel];
      return '<div class="mc-tabs" aria-label="列表">' + ix.lists.slice(0, 12).map(function (L) { return '<button type="button" data-mc="list" data-arg="' + esc(L.id) + '"' + (I.mx.list === L.id ? ' class="on"' : '') + '>' + esc(L.title.length > 14 ? L.title.slice(0, 13) + '…' : L.title) + '<small>' + L.cards.length + '</small></button>'; }).join('') + '</div>' +
        (sel ? '<div class="mc-tabs"><button type="button" class="go" data-mc="open">📄 打开「' + esc(sel.title.length > 24 ? sel.title.slice(0, 23) + '…' : sel.title) + '」</button><button type="button" data-mc="row" data-arg="' + h.sel + '">✕ 取消选中</button></div>' : '');
    },
    show: function (h, I, msg) { h.info = cardsOf({ mx: I.mx }, U.index(I.ctx.host.boardId())); I.mx.page = h.info.page; DRV.splitflap.retarget(h); I.api.chrome(); I.api.say(msg); },
    cmd: function (h, a, arg, I) {
      if (a === 'turn' || a === 'page') { if (h.info.pages < 2) { I.api.say('这个列表只有一页 · 可以在下面换一个列表'); return true; } I.mx.page = mod(h.info.page + (+arg), h.info.pages); DRV.splitflap.show(h, I, '第 ' + (I.mx.page + 1) + ' / ' + h.info.pages + ' 页'); return true; }
      if (a === 'list') { I.mx.list = arg; I.mx.page = 0; if (I.mx.order === 'custom') I.mx.order = 'list'; delete I.mx.it; var L = U.listOf(U.index(I.ctx.host.boardId()), arg); DRV.splitflap.show(h, I, '换到「' + (L ? L.title : '') + '」· 只是显示，列表本身不变'); return true; }
      if (a === 'order') { if (arg === 'custom') return true; I.mx.order = arg; delete I.mx.it; I.mx.page = 0; DRV.splitflap.show(h, I, arg === 'title' ? '按 A–Z 重新翻牌' : '按列表顺序重新翻牌'); return true; }
      if (a === 'row') { var r = +arg, c = h.info.shown[r]; h.sel = h.sel === r || !c ? null : r; DRV.splitflap.lamps(h); I.mx.sel = h.sel != null ? c.ref : I.mx.sel; I.moving = true; I.api.chrome(); I.api.say(h.sel != null ? '第 ' + (h.info.page * SPF.rows + r + 1) + ' 行：' + c.title + (Array.from(c.title).length > SPF.cols - 3 ? '（板上放不下，末尾显示 …）' : '') : ''); return true; }
      if (a === 'open') { var c2 = h.sel != null && h.info.shown[h.sel]; if (c2) U.openCard(c2); return true; }
      if (a === 'auto') { I.mx.auto = !I.mx.auto; h.at = 0; I.api.chrome(); I.api.say(I.mx.auto ? '自动翻页：每页停几秒' + (h.info.pages < 2 ? '（只有一页：轮流换列表）' : '') : '停在这一页'); return true; }
    },
    // auto: when the board has settled, wait a moment, then the next page (one page only: the next list)
    autoTick: function (h, dt, I) {
      if (h.busy) { h.at = 0; return; }
      h.at = (h.at || 0) + dt; if (h.at < 5) return; h.at = 0;
      if (h.info.pages > 1) { I.mx.page = mod(h.info.page + 1, h.info.pages); DRV.splitflap.show(h, I, '第 ' + (I.mx.page + 1) + ' / ' + h.info.pages + ' 页'); return; }
      var ls = U.index(I.ctx.host.boardId()).lists, i = ls.map(function (L) { return L.id; }).indexOf(I.mx.list); if (ls.length < 2) return;
      I.mx.list = ls[mod(i + 1, ls.length)].id; I.mx.page = 0; DRV.splitflap.show(h, I, '「' + ls[mod(i + 1, ls.length)].title + '」');
    }
  };

  // ---------------------------------------------------------------- 13 word drum
  function drumFaceRes(ch) {
    return U.res('wd|' + ch, function () {
      var cv = U.canvas(64, 48), g = cv.getContext('2d'), cjk = /[^\x00-\x7f·]/.test(ch);
      var gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, '#e8dfc8'); gr.addColorStop(0.5, '#fbf6e9'); gr.addColorStop(1, '#e8dfc8'); g.fillStyle = gr; g.fillRect(0, 0, 64, 48);
      g.fillStyle = '#8a7a5c'; g.fillRect(0, 0, 64, 1); g.fillRect(0, 47, 64, 1);
      g.fillStyle = '#1d2b4f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = (cjk ? '700 34px' : '800 40px') + ' Georgia,"Songti SC","PingFang SC",serif'; g.fillText(ch, 32, 26);
      var map = U.tex(cv, false);
      return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x3a3a3a, emissiveMap: map }) };
    });
  }
  DRV.drum = {
    size: WDR.size, cap: 40, cs: null, step: 1, autoSpeed: 0, axis: 'none', ownCards: true, worldAuto: false, flip: 'y', keepFront: false,
    autoLabel: ['▶ 自动展示', '⏸ 停止展示'],
    cam: { p: [0, 0.98, 1.85], look: [0, 0.6, 0] }, hint: '上下拨一个滚筒，它一格一格地转 · 点下面的词，滚筒自动拼出它 · 🔀 把词拆散，自己转回来',
    frame: function (r) {
      return U.res('mc|drum|frame|' + r.toFixed(3), function () {
        var S = new U.Buf(), F = new U.Buf(), wood = rgb('#6b4423'), dark = rgb('#2f3540'), brass = rgb('#d9b24a'), W = WDR.k * (WDR.w + WDR.gap) / 2 + 0.05, cy = WDR.cy, win = 0.105;
        S.box(-W - 0.03, 0, -0.28, W + 0.03, 0.2, 0.36, wood);   // the base
        S.box(-W - 0.03, 0.2, -r - 0.06, -W, cy + r + 0.06, r + 0.06, wood); S.box(W, 0.2, -r - 0.06, W + 0.03, cy + r + 0.06, r + 0.06, wood);   // the cheeks the drums turn between
        S.box(-W, 0.2, -r - 0.06, W, cy + r + 0.06, -r - 0.03, dark);   // the back
        S.box(-W - 0.03, cy + r + 0.06, -r - 0.06, W + 0.03, cy + r + 0.1, r + 0.06, wood);   // the lid
        S.box(-W, cy - 0.006, -0.02, W, cy + 0.006, 0.02, rgb('#aab2bf'));   // the shared axle (shows at the ends)
        // the front covers: everything but a window on the middle row
        F.box(-W, cy + win / 2, r + 0.012, W, cy + r + 0.06, r + 0.04, wood); F.box(-W, 0.2, r + 0.012, W, cy - win / 2, r + 0.04, wood);
        F.box(-W, cy + win / 2 - 0.006, r + 0.035, W, cy + win / 2, r + 0.05, brass); F.box(-W, cy - win / 2, r + 0.035, W, cy - win / 2 + 0.006, r + 0.05, brass);
        return { keep: 1, solid: S.geo(), front: F.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var M = U.mats(), cfg = h.info.mx.cfg || {}, shown = h.info.shown.filter(Boolean);
      h.cards = shown.map(function (c, s) { return { slot: s, card: c, mesh: null }; });
      h.ring = drumRing(shown.length ? shown.map(function (c) { return c.title; }) : ['MINEST']); h.F = h.ring.length; h.r = h.F * WDR.face / (2 * Math.PI);
      var fr = use(this.frame(h.r)); grp.add(solid(fr.solid, shadows)); h.block = new (T().Mesh)(fr.front, M.solid); grp.add(h.block);
      var mats = h.ring.map(function (ch) { return use(drumFaceRes(ch)).mat; }), brass = use(matRes('#b98a3a')).mat, chord = 2 * h.r * Math.sin(Math.PI / h.F) * 1.01, R0 = h.r * 0.97;
      var capGeo = use(U.res('mc|drum|cap|' + h.F, function () { var gg = new (T().CylinderGeometry)(R0, R0, 0.004, h.F); gg.rotateZ(Math.PI / 2); return { keep: 1, geo: gg }; })).geo;
      h.drums = []; h.faces = []; h.knobs = [];
      for (var k = 0; k < WDR.k; k++) {
        var x = (k - (WDR.k - 1) / 2) * (WDR.w + WDR.gap), g = new (T().Group)(); g.position.set(x, WDR.cy, 0); grp.add(g);
        for (var j = 0; j < h.F; j++) { var al = j * 2 * Math.PI / h.F, f = new (T().Mesh)(M.plane, mats[j]); f.scale.set(WDR.w, chord, 1); f.position.set(0, h.r * Math.sin(al), h.r * Math.cos(al)); f.rotation.x = -al; f.userData.drum = k; g.add(f); h.faces.push(f); }
        [-1, 1].forEach(function (sd) { var cap = new (T().Mesh)(capGeo, brass); cap.position.x = sd * WDR.w / 2; g.add(cap); });   // round end plates: they turn with the drum and stay inside the case
        var kn = new (T().Mesh)(M.box, brass); kn.scale.set(0.05, 0.04, 0.03); kn.position.set(x, 0.29, h.r + 0.05); kn.userData.knob = k; grp.add(kn); h.knobs.push(kn);
        h.drums.push({ g: g, a: 0, w: 0, target: null, motor: false, delay: 0, v: 0 });
      }
      var start = Array.isArray(cfg.dr) && cfg.dr.length === WDR.k ? cfg.dr : null, sel = h.cards.filter(function (c) { return c.card.ref === h.info.mx.sel; })[0] || h.cards[0];
      h.word = sel ? sel.card : null; h.chunk = clamp(cfg.chunk | 0, 0, 99); h.puzzle = null;
      var faces = start || (h.word ? drumWord(h.word.title, h.ring, WDR.k, h.chunk).faces : h.drums.map(function () { return 0; }));
      h.drums.forEach(function (d, k) { d.a = mod(faces[k] | 0, h.F); d.g.rotation.x = d.a * 2 * Math.PI / h.F; });
      h.lastRead = drumRead(h.drums.map(function (d) { return d.a; }), h.ring);
    },
    pickables: function (h) { return h.faces.concat(h.knobs); },
    // spell a card on the drums: each drum turns forward (the only way it can), one after the other
    spell: function (h, c, I, chunk) {
      var w = drumWord(c.title, h.ring, WDR.k, chunk);
      h.word = c; h.chunk = w.chunk; h.chunks = w.chunks; h.puzzle = null; I.mx.sel = c.ref;
      h.drums.forEach(function (d, k) { var from = Math.round(d.a); d.a = from; d.w = 0; d.target = forward(from, w.faces[k], h.F); d.motor = d.target !== from; d.delay = k * 0.07; });
      I.api.say('拼出「' + w.text + '」' + (w.chunks > 1 ? '（第 ' + (w.chunk + 1) + ' / ' + w.chunks + ' 段）' : '')); I.api.chrome();
    },
    pull: function (h, c, I) { if (I.mx.auto) { I.mx.auto = false; } DRV.drum.spell(h, c.card, I, 0); },
    tick: function (h, dt, I) {
      var busy = false;
      h.drums.forEach(function (d) {
        if (d.motor) { busy = true; if ((d.delay -= dt) > 0) return; var s = { a: d.a, w: d.w, target: d.target }; if (!drive(s, dt, 22)) { d.motor = false; d.target = null; d.a = mod(Math.round(s.a), h.F); d.w = 0; } else { d.a = s.a; d.w = s.w; } }
        else if (d.target != null || Math.abs(d.w) > 0) { busy = true; var s2 = { a: d.a, w: d.w, target: d.target }, on = spin(s2, dt, 1); d.a = s2.a; d.w = s2.w; d.target = s2.target; if (!on) { d.target = null; d.a = mod(Math.round(d.a), h.F); } }
        d.g.rotation.x = d.a * 2 * Math.PI / h.F;
      });
      if (!busy && !h.dragging) {   // all still: read what the drums say
        var faces = h.drums.map(function (d) { return d.a; }), read = drumRead(faces, h.ring);
        if (read !== h.lastRead) {
          h.lastRead = read;
          if (h.puzzle && h.puzzle.text === read) { I.api.say('拼对了！「' + read + '」'); h.puzzle = null; h.match = h.word; I.api.chrome(); }
          else if (!h.puzzle) { var m = h.cards.filter(function (c) { var w = drumWord(c.card.title, h.ring, WDR.k, 0); for (var q = 0; q < w.chunks; q++) if (drumWord(c.card.title, h.ring, WDR.k, q).text === read) return true; return false; })[0]; h.match = m ? m.card : null; if (m && read) I.api.say('滚筒上是「' + read + '」→ 列表里的「' + m.card.title + '」'); I.api.chrome(); }
        }
      }
      return busy || !!h.dragging;
    },
    down: function (h, o, I) { if (o.userData.drum == null) return false; var d = h.drums[o.userData.drum]; d.motor = false; d.target = null; d.w = 0; d.v = 0; h.dragging = d; if (I.mx.auto) { I.mx.auto = false; I.api.chrome(); } return true; },
    move: function (h, o, dx, dy, dt, I) { var d = h.drums[o.userData.drum], px = Math.max(18, I.R.domElement.clientHeight * 0.045), da = dy / px; d.a += da; d.v = d.v * 0.6 + (da / Math.max(0.001, dt)) * 0.4; },
    up: function (h, o, moved, idle, I) { var d = h.drums[o.userData.drum]; h.dragging = null; if (!moved) return; d.w = idle > 90 ? 0 : clamp(d.v, -20, 20); d.target = d.w ? null : Math.round(d.a); },   // let go: it turns on a little, then clicks into place
    tap: function (h, o, I, p) {
      var k = o.userData.knob != null ? o.userData.knob : o.userData.drum; if (k == null) return; var d = h.drums[k], step = 1;
      if (o.userData.drum != null && p) step = p.y > WDR.cy ? -1 : 1;   // the upper half turns it back, the lower half on
      if (I.mx.auto) { I.mx.auto = false; I.api.chrome(); }
      d.motor = false; d.target = Math.round(d.target != null ? d.target : d.a) + step; d.w = 0;
    },
    apply: function () {},
    aOf: function () { return 0; }, posOf: function () { return 0; },
    target: function (h, c, a) { return a; },
    front: function (h) { return h.cards; },
    where: function () { return ''; },
    extra: function (h, a, I) {
      var w = h.word ? drumWord(h.word.title, h.ring, WDR.k, h.chunk) : null, out = '';
      if (w && w.chunks > 1) out += '<button type="button" data-mc="chunk" data-arg="-1">‹ 上一段</button><button type="button" data-mc="chunk" data-arg="1">下一段 ›</button>';
      out += '<button type="button" data-mc="mix"' + (h.word ? '' : ' disabled') + '>🔀 拆散重组</button>';
      if (h.match) out += '<button type="button" class="go" data-mc="open">📄 打开「' + esc(h.match.title.length > 20 ? h.match.title.slice(0, 19) + '…' : h.match.title) + '」</button>';
      return '<div class="mc-tabs">' + out + '<small style="align-self:center;color:#94a3b8;flex:none">' + h.F + ' 格字环</small></div>';
    },
    cmd: function (h, a, arg, I) {
      if (a === 'turn') { var at = h.word ? h.cards.filter(function (c) { return c.card === h.word; })[0] : null, i = at ? at.slot : -1, nx = h.cards[mod(i + (+arg), h.cards.length)]; if (nx) DRV.drum.spell(h, nx.card, I, 0); return true; }
      if (a === 'chunk') { if (h.word) DRV.drum.spell(h, h.word, I, h.chunk + (+arg)); return true; }
      if (a === 'open') { if (h.match) U.openCard(h.match); return true; }
      if (a === 'mix') {   // the letters of the word, shuffled across the drums: turn them back yourself (the list is not touched)
        if (!h.word) return true; var w = drumWord(h.word.title, h.ring, WDR.k, h.chunk), f = w.faces.slice(), r = rng(Date.now() & 0xffff);
        for (var tries = 0; tries < 8; tries++) { for (var i = f.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = f[i]; f[i] = f[j]; f[j] = t; } if (drumRead(f, h.ring) !== w.text) break; }
        h.puzzle = { text: drumRead(w.faces, h.ring) }; h.match = null; if (I.mx.auto) I.mx.auto = false;
        h.drums.forEach(function (d, k) { var from = Math.round(d.a); d.a = from; d.target = forward(from, f[k], h.F); d.motor = d.target !== from; d.delay = k * 0.07; });
        h.lastRead = null; I.api.chrome(); I.api.say('拆散了「' + w.text + '」· 一个个转回去把它拼对'); return true;
      }
      if (a === 'auto') { I.mx.auto = !I.mx.auto; h.at = 0; h.puzzle = null; I.api.chrome(); I.api.say(I.mx.auto ? '自动展示：一个词接一个词（长词分段）' : '停住'); return true; }
    },
    autoTick: function (h, dt, I) {
      if (h.drums.some(function (d) { return d.motor || d.target != null; })) { h.at = 0; return; }
      h.at = (h.at || 0) + dt; if (h.at < 2.6 || !h.cards.length) return; h.at = 0;
      var at = h.word ? h.cards.filter(function (c) { return c.card === h.word; })[0] : null, w = h.word ? drumWord(h.word.title, h.ring, WDR.k, h.chunk) : null;
      if (w && h.chunk + 1 < w.chunks) return DRV.drum.spell(h, h.word, I, h.chunk + 1);
      var nx = h.cards[mod((at ? at.slot : -1) + 1, h.cards.length)]; DRV.drum.spell(h, nx.card, I, 0);
    },
    state: function (h) { return { ring: h.ring.join(''), F: h.F, faces: h.drums.map(function (d) { return +d.a.toFixed(3); }), read: drumRead(h.drums.map(function (d) { return d.a; }), h.ring), puzzle: h.puzzle ? h.puzzle.text : null, word: h.word ? h.word.title : null, chunk: h.chunk }; },
    beforeSave: function (h, I) { I.mx.cfg = I.mx.cfg || {}; I.mx.cfg.dr = h.drums.map(function (d) { return mod(Math.round(d.a), h.F); }); I.mx.cfg.chunk = h.chunk | 0; }
  };

  // ---------------------------------------------------------------- 78 reassembling typography
  var RT_COL = ['#3f7fe0', '#de4a3a', '#2f9e44', '#e8891a', '#8f6fe0', '#1fa6a6', '#d9488f', '#6b7a8a'];
  var FONT = 'system-ui,-apple-system,"PingFang SC","Hiragino Sans GB",sans-serif';
  function wordTex(text, col) {   // a word on its block: as wide as the word, long ones shortened with …
    return U.res('rt|' + col + '|' + text, function () {
      var H = 64, fs = 38, g0 = U.canvas(8, 8).getContext('2d'), t = String(text); g0.font = '800 ' + fs + 'px ' + FONT;
      var w = g0.measureText(t).width; if (w > 560) { fs = 31; g0.font = '800 ' + fs + 'px ' + FONT; w = g0.measureText(t).width; while (w > 560 && t.length > 2) { t = t.slice(0, -2) + '…'; w = g0.measureText(t).width; } }
      var W = Math.ceil(w + 36), cv = U.canvas(W, H), g = cv.getContext('2d');
      g.fillStyle = col; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, 6); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, H - 6, W, 6);
      g.font = '800 ' + fs + 'px ' + FONT; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, W / 2, H / 2 + 2);
      return { map: U.tex(cv, false), ratio: W / H };
    });
  }
  function wordBackTex(c) {
    return U.res('rtb|' + c.ref + '|' + c.title + '|' + c.zh + '|' + U.hash(c.desc || ''), function () {
      var W = 480, H = 64, cv = U.canvas(W, H), g = cv.getContext('2d'), t = c.zh || c.desc || c.title;
      g.fillStyle = '#1d2433'; g.fillRect(0, 0, W, H); g.fillStyle = '#f3ead6'; g.font = '600 26px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(U.wrap(g, String(t).replace(/\s+/g, ' '), W - 24, 1)[0] || '', W / 2, H / 2 + 1);
      return { map: U.tex(cv, false) };
    });
  }
  function ownMat(h, map, opts) { var o = { map: map, emissive: 0x555555, emissiveMap: map, transparent: true }; for (var k in opts || {}) o[k] = opts[k]; return h.use(U.res('mc|own|' + U.uid(), function () { return { mat: new (T().MeshLambertMaterial)(o) }; })).mat; }   // a material of this machine only (it fades on its own)
  function easeIO(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  DRV.retype = {
    size: RTY.size, cap: RTY.cap, cs: { cw: 0.5, ch: RTY.h, ct: RTY.d }, step: RTY.step, autoSpeed: 0, axis: 'x', gain: 3, dir: 1, flip: 'y', ownCards: true, worldAuto: false, keepFront: false,
    autoLabel: ['▶ 自动重组', '⏸ 停止重组'],
    cam: { p: [0, 1.3, 3.3], look: [0, 1.14, 0] }, hint: '左右拖动转这团文字 · 点一个词把它拿到面前，同组的词会亮着 · 下面换构图和分组规则',
    frame: function () {
      return U.res('mc|retype|frame', function () {
        var S = new U.Buf(), G = new U.Buf(), dark = rgb('#232a36'), steel = rgb('#8f98a6');
        for (var x = -0.66; x < 0.66; x += 0.06) for (var z = -0.42; z < 0.42; z += 0.06) { var rr = Math.hypot((x + 0.03) / 0.66, (z + 0.03) / 0.42); if (rr <= 1) S.box(x, 0, z, x + 0.06, rr > 0.86 ? 0.14 : 0.1, z + 0.06, rr > 0.86 ? steel : dark); if (rr > 0.72 && rr <= 0.86) G.box(x + 0.01, 0.1, z + 0.01, x + 0.05, 0.115, z + 0.05, [0.55, 0.85, 1]); }   // a projector base with a lit ring
        return { keep: 1, solid: S.geo(), glow: G.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var M = U.mats(), cfg = h.info.mx.cfg || {}, shown = h.info.shown.filter(Boolean), fr = use(this.frame());
      grp.add(solid(fr.solid, shadows)); grp.add(new (T().Mesh)(fr.glow, M.glow));
      h.root = new (T().Group)(); grp.add(h.root); h.block = null; h.time = 0;
      h.rule = RT_RULES.some(function (r) { return r[0] === cfg.rule; }) ? cfg.rule : 'initial'; h.mode = RT_MODES.some(function (m) { return m[0] === cfg.mode; }) ? cfg.mode : 'cloud';
      h.list = shown; h.labelMeshes = [];
      h.cards = shown.map(function (c, s) {
        var back = ownMat(h, use(wordBackTex(c)).map), front = ownMat(h, null), side = ownMat(h, null, { map: null, emissiveMap: null, emissive: 0x222222 });
        var m = new (T().Mesh)(M.box, [side, side, side, side, front, back]); m.userData = { isItem: true, slot: s, ref: c.ref, mc: true }; h.root.add(m);
        return { slot: s, card: c, mesh: m, front: front, back: back, side: side, op: 1, phase: (U.hash(c.ref) % 628) / 100, w: 0.4 };
      });
      DRV.retype.regroup(h); DRV.retype.relayout(h, true); DRV.retype.tick(h, 0, null);   // placed at once (the world has no frame loop for it)
    },
    regroup: function (h) {   // the colour of a word is its group under the rule
      h.sort = sortBins(h.list, h.rule, null, 8);
      h.cards.forEach(function (c) { var g = h.sort.binOf[c.card.ref] || 0, wt = h.use(wordTex(c.card.title, RT_COL[g % RT_COL.length])); c.g = g; c.front.map = wt.map; c.front.emissiveMap = wt.map; c.front.needsUpdate = true; c.side.color.set(RT_COL[g % RT_COL.length]); c.side.needsUpdate = true; c.w = Math.min(RTY.maxW, RTY.h * wt.ratio); });
      h.labelMeshes.forEach(function (m) { if (m.parent) m.parent.remove(m); }); h.labelMeshes = h.sort.bins.map(function (b, g) { var sr = h.use(U.signRes(b.label, 2.6, 0.7, '#0f1520', RT_COL[g % RT_COL.length])), m = new (T().Mesh)(U.mats().plane, h.use(U.res('mc|own|' + U.uid(), function () { return { mat: sr.mat.clone() }; })).mat); m.material.transparent = true; m.material.opacity = 0; m.scale.set(0.26, 0.07, 1); h.root.add(m); return m; });
    },
    // every word sets off for its new place, a little after the one before; nothing jumps
    relayout: function (h, now) {
      var L = rtLayout(h.mode, h.cards.map(function (c) { return { w: c.w, g: c.g }; }), h.sort.bins.length);
      h.k = L.k; h.labels = L.labels; if (h.mode === 'groups') h.lastGroupsRule = h.rule;   // what the groups were last shown by
      h.cards.forEach(function (c, i) {
        var to = { x: L.pos[i].x, y: L.pos[i].y, z: L.pos[i].z, k: L.k };
        if (now || !c.cur) { c.cur = to; c.from = to; c.to = to; c.t0 = -1; return; }
        c.from = { x: c.cur.x, y: c.cur.y, z: c.cur.z, k: c.cur.k }; c.to = to; c.t0 = h.time + i * 0.035; c.dur = 1.3;
      });
      h.labelMeshes.forEach(function (m, g) { var l = h.labels.filter(function (q) { return q.g === g; })[0]; m.userData.to = l ? { x: l.x, y: l.y, z: l.z, op: 1, k: h.k } : { x: m.position.x, y: m.position.y, z: m.position.z, op: 0, k: h.k }; });
    },
    csOf: function (h, c) { var k = c.cur ? c.cur.k : 1; return { cw: c.w * k, ch: RTY.h * k, ct: RTY.d }; },
    parentOf: function (h) { return h.root; },
    home: function (h, c, a, o) { var p = c.to || c.cur; o.position.set(p.x, p.y, p.z); o.rotation.set(0, -a, 0); },
    tick: function (h, dt, I) {
      h.time += dt; var moving = false, yaw = h.root.rotation.y, out = I && I.out, gOut = out ? out.g : null, auto = I && I.mx.auto;
      h.cards.forEach(function (c) {
        if (c.t0 >= 0) { var e = (h.time - c.t0) / c.dur; if (e >= 1) { c.cur = c.to; c.t0 = -1; } else if (e > 0) { var q = easeIO(e); c.cur = { x: c.from.x + (c.to.x - c.from.x) * q, y: c.from.y + (c.to.y - c.from.y) * q + Math.sin(q * Math.PI) * 0.08, z: c.from.z + (c.to.z - c.from.z) * q, k: c.from.k + (c.to.k - c.from.k) * q }; } moving = true; }
        var opT = out && c !== out ? (c.g === gOut ? 1 : 0.18) : 1; if (Math.abs(c.op - opT) > 0.005) { c.op += (opT - c.op) * Math.min(1, dt * 7); moving = true; } else c.op = opT;   // the words of the same group stay clear, the others step back
        c.front.opacity = c.side.opacity = c.back.opacity = c.op; c.front.depthWrite = c.side.depthWrite = c.op > 0.9;
        if (c.busy) return;
        var fy = auto ? Math.sin(h.time * 0.8 + c.phase) * 0.022 : 0, fx = auto ? Math.sin(h.time * 0.5 + c.phase * 1.7) * 0.012 : 0;   // a slow float, never more than a couple of centimetres
        c.mesh.position.set(c.cur.x + fx, c.cur.y + fy, c.cur.z); c.mesh.rotation.set(0, -yaw, 0); c.mesh.scale.set(c.w * c.cur.k, RTY.h * c.cur.k, RTY.d);   // every word faces you, however the group is turned
      });
      h.labelMeshes.forEach(function (m) { var t = m.userData.to; if (!t) return; m.position.lerp(new (T().Vector3)(t.x, t.y, t.z), Math.min(1, dt * 4)); m.material.opacity += ((h.mode === 'groups' ? t.op : 0) - m.material.opacity) * Math.min(1, dt * 4); m.rotation.y = -yaw; m.scale.set(0.26 * t.k * 1.4, 0.07 * t.k * 1.4, 1); });
      return moving || auto;
    },
    apply: function (h, a) { h.root.rotation.y = a; },
    aOf: function (pos) { return pos * RTY.step; }, posOf: function (a) { return mod(Math.round(a / RTY.step), 24); },
    target: function (h, c, a) { return a; },
    front: function (h) { return h.cards; },
    where: function () { return '它在构图里的位置'; },
    extra: function (h, a, I) {
      var g = I.out ? h.sort.bins[I.out.g] : null;
      return '<div class="mc-tabs" aria-label="构图">' + RT_MODES.map(function (m) { return '<button type="button" data-mc="rtmode" data-arg="' + m[0] + '"' + (h.mode === m[0] ? ' class="on"' : '') + '>' + m[1] + '</button>'; }).join('') + '<span class="mc-gap"></span>' +
        RT_RULES.map(function (r) { var off = r[0] === 'study' && !hasStudy(h.list); return '<button type="button" data-mc="rtrule" data-arg="' + r[0] + '"' + (h.rule === r[0] ? ' class="on"' : '') + (off ? ' disabled title="这些卡片还没有学习记录"' : '') + '>按' + r[1] + '</button>'; }).join('') + '</div>' +
        (g ? '<div class="mc-tabs"><small style="align-self:center;color:#cbd5e1">同组「' + esc(g.label) + '」' + (g.refs.length - 1) + ' 个词亮着</small></div>' : '');
    },
    cmd: function (h, a, arg, I) {
      var cfg = I.mx.cfg = I.mx.cfg || {};
      if (a === 'rtmode') { h.mode = cfg.mode = arg; DRV.retype.relayout(h); I.api.chrome(); I.api.say('重新组合成「' + RT_MODES.filter(function (m) { return m[0] === arg; })[0][1] + '」'); return true; }
      if (a === 'rtrule') { h.rule = cfg.rule = arg; DRV.retype.regroup(h); DRV.retype.relayout(h); I.api.chrome(); I.api.say('按' + RT_RULES.filter(function (r) { return r[0] === arg; })[0][1] + '分成 ' + h.sort.bins.length + ' 组：' + h.sort.bins.map(function (b) { return b.label + ' ' + b.refs.length; }).join(' · ')); return true; }
    },
    // auto: drift slowly round, and every few seconds take a new shape (the groups one comes back with the next rule)
    autoTick: function (h, dt, I) {
      if (I.out) return;
      I.s.a += 0.1 * dt; I.s.target = null; I.s.w = 0; h.at = (h.at || 0) + dt;
      if (h.at < 7) return; h.at = 0;
      var order = ['cloud', 'groups', 'ring', 'line'], next = order[(order.indexOf(h.mode) + 1) % order.length], cfg = I.mx.cfg = I.mx.cfg || {};
      if (next === 'groups' && h.lastGroupsRule === h.rule) { var rs = RT_RULES.map(function (r) { return r[0]; }).filter(function (r) { return r !== 'study' || hasStudy(h.list); }); h.rule = cfg.rule = rs[(rs.indexOf(h.rule) + 1) % rs.length]; DRV.retype.regroup(h); }
      h.mode = cfg.mode = next; DRV.retype.relayout(h); I.api.chrome();
      I.api.say('「' + RT_MODES.filter(function (m) { return m[0] === next; })[0][1] + '」' + (next === 'groups' ? ' · 按' + RT_RULES.filter(function (r) { return r[0] === h.rule; })[0][1] : ''));
    },
    state: function (h) { return { mode: h.mode, rule: h.rule, k: h.k, moving: h.cards.filter(function (c) { return c.t0 >= 0; }).length, groups: h.sort.bins.map(function (b) { return b.label + ':' + b.refs.length; }), dim: h.cards.filter(function (c) { return c.op < 0.5; }).length, cur: h.cards.map(function (c) { return c.cur && [+c.cur.x.toFixed(3), +c.cur.y.toFixed(3), +c.cur.z.toFixed(3), +c.cur.k.toFixed(3), +c.w.toFixed(3)]; }) }; }
  };

  // ---------------------------------------------------------------- 79 comic space
  function comicTex(c, story) {
    var st = U.picState(c);
    return U.res('cm|' + c.ref + '|' + c.title + '|' + c.pic + '|' + st, function () {
      var W = 512, H = 380, cv = U.canvas(W, H), g = cv.getContext('2d'), hu = U.hash(c.ref + c.title) % 360, e = st === 1 && U.pic(c.pic);   // each panel its own colour
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.fillRect(8, 8, W - 16, H - 16);
      var x0 = 16, y0 = 16, iw = W - 32, ih = H - 32; g.fillStyle = 'hsl(' + hu + ',60%,62%)'; g.fillRect(x0, y0, iw, ih);
      var drawn = false; if (e) try { var iwd = e.img.naturalWidth || e.img.width, iht = e.img.naturalHeight || e.img.height, k = Math.max(iw / iwd, ih / iht); g.drawImage(e.img, (iwd - iw / k) / 2, (iht - ih / k) / 2, iw / k, ih / k, x0, y0, iw, ih); drawn = true; } catch (err) {}
      if (!drawn) {   // speed lines and a big letter, comic style
        g.save(); g.translate(x0 + iw * 0.62, y0 + ih * 0.55); g.strokeStyle = 'hsla(' + hu + ',70%,92%,.55)'; g.lineWidth = 3; for (var a = 0; a < 40; a++) { var t = a / 40 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(t) * 40, Math.sin(t) * 40); g.lineTo(Math.cos(t) * 360, Math.sin(t) * 360); g.stroke(); } g.restore();
        g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 8; g.font = '900 170px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; var ch = initial(c.title); g.strokeText(ch, x0 + iw * 0.62, y0 + ih * 0.58); g.fillText(ch, x0 + iw * 0.62, y0 + ih * 0.58);
      }
      g.fillStyle = 'rgba(0,0,0,.14)'; for (var yy = y0; yy < y0 + ih; yy += 9) for (var xx = x0 + ((yy / 9) % 2) * 4.5; xx < x0 + iw; xx += 9) { g.beginPath(); g.arc(xx, yy, 1.6, 0, 6.29); g.fill(); }   // halftone dots
      g.font = '800 30px ' + FONT; var lines = U.wrap(g, c.title, iw * 0.62, 2), bw = Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; })) + 28, bh = lines.length * 36 + 18;
      g.fillStyle = '#ffe66b'; g.fillRect(x0 + 10, y0 + 10, bw, bh); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(x0 + 10, y0 + 10, bw, bh);   // the caption box
      g.fillStyle = '#111'; g.textAlign = 'left'; g.textBaseline = 'top'; lines.forEach(function (l, i) { g.fillText(l, x0 + 24, y0 + 20 + i * 36); });
      var map = U.tex(cv, false); return { map: map, mat: new (T().MeshLambertMaterial)({ map: map, emissive: 0x505050, emissiveMap: map }) };
    });
  }
  function bubbleTex(c, long) {   // what the panel says: a short line, or (open) all of it
    return U.res('cmb|' + c.ref + '|' + c.title + '|' + c.zh + '|' + U.hash(c.desc || '') + '|' + (long ? 1 : 0), function () {
      var W = long ? 520 : 360, H = long ? 340 : 170, cv = U.canvas(W, H), g = cv.getContext('2d'), pad = 26, tail = 34;
      var more = [c.zh, c.desc].filter(Boolean), text = long ? [c.title].concat(more.length ? more : ['（这张卡没有写更多内容）']).join('\n') : (more[0] || '…');   // nothing more to say: a thought, not the title again
      g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 6;
      var r = 40, x = 4, y = 4, w = W - 8, hh = H - 8 - tail; g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + hh - r); g.quadraticCurveTo(x + w, y + hh, x + w - r, y + hh); g.lineTo(x + 90, y + hh); g.lineTo(x + 40, H - 6); g.lineTo(x + 60, y + hh); g.lineTo(x + r, y + hh); g.quadraticCurveTo(x, y + hh, x, y + hh - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#111'; var fs = long ? 26 : 30; g.font = '700 ' + fs + 'px ' + FONT; g.textBaseline = 'top';
      var lines = []; String(text).split('\n').forEach(function (p, i) { U.wrap(g, p, w - pad * 2, long ? 8 : 2).forEach(function (l) { lines.push(l); }); });
      var max = Math.floor((hh - pad * 1.4) / (fs + 6)); if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = lines[max - 1].replace(/.$/, '…'); }
      lines.forEach(function (l, i) { g.fillText(l, x + pad, y + pad * 0.8 + i * (fs + 6)); });
      var map = U.tex(cv, false); return { map: map, mat: new (T().MeshBasicMaterial)({ map: map, transparent: true }) };
    });
  }
  function easeBack(t) { t = clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  DRV.comic = {
    size: CMX.size, cap: CMX.cap, cs: { cw: CMX.w, ch: CMX.h, ct: CMX.t }, step: 1, autoSpeed: 0, axis: 'none', flip: 'y', ownCards: true, worldAuto: false,
    autoLabel: ['▶ 讲一遍', '⏸ 停止'],
    cam: { p: [0, 1.25, 3.5], look: [0, 1.18, 0] }, hint: '点一格分镜，它会到你面前，对话框展开 · ◀ ▶ 前后翻 · 「讲一遍」：分镜逐个出现，镜头一格格走过去',
    frame: function () {
      return U.res('mc|comic|frame', function () {
        var S = new U.Buf(), dark = rgb('#1d2433'), mid = rgb('#2b3446');
        S.box(-1.25, 0, -0.42, 1.25, 0.06, 0.42, dark); S.box(-1.2, 0.06, -0.36, 1.2, 0.09, 0.36, mid);
        [-1.1, 1.1].forEach(function (x) { S.box(x - 0.025, 0.09, -0.3, x + 0.025, 1.98, -0.25, mid); }); S.box(-1.1, 1.95, -0.3, 1.1, 1.98, -0.25, mid);   // the frame the panels hang from
        return { keep: 1, solid: S.geo() };
      });
    },
    build: function (h, grp, use, shadows) {
      var M = U.mats(), cfg = h.info.mx.cfg || {}, shown = h.info.shown.filter(Boolean), edge = use(matRes('#111111')).mat;
      grp.add(solid(use(this.frame()).solid, shadows)); h.block = null; h.time = 0; h.grp = grp;
      h.auto = comicNarrative(shown.map(function (c) { return c.title; })); h.story = cfg.story != null ? !!cfg.story : h.auto;   // told as a story only when it reads like one (or the user said so)
      h.pos = comicLayout(shown.length); h.revealed = shown.length; h.tourK = null;
      h.cards = shown.map(function (c, s) {
        var m = new (T().Mesh)(M.box, [edge, edge, edge, edge, use(comicTex(c)).mat, use(backRes(c, CMX.w, CMX.h, false)).mat]); m.userData = { isItem: true, slot: s, ref: c.ref, mc: true }; grp.add(m);
        var b = new (T().Mesh)(M.plane, use(bubbleTex(c, false)).mat); b.renderOrder = 3; grp.add(b);
        var num = new (T().Mesh)(M.plane, use(U.signRes(String(s + 1), 1.2, 1.2, '#ffe66b', '#111111')).mat); grp.add(num);
        return { slot: s, card: c, mesh: m, bubble: b, num: num, numFor: s, vis: 1, ex: 0, popT: -9 };
      });
      h.arrows = [];
      if (h.story) for (var i = 0; i + 1 < h.pos.length; i++) {   // arrows from each panel to the next (only when it is a story)
        var a = h.pos[i], b2 = h.pos[i + 1], ar = new (T().Group)(), dx = b2.x - a.x, dy = b2.y - a.y, L = Math.hypot(dx, dy), shaft = new (T().Mesh)(M.box, use(matRes('#ffe66b')).mat), head = new (T().Mesh)(M.box, use(matRes('#ffe66b')).mat);
        shaft.scale.set(Math.max(0.04, L - CMX.w * 0.9), 0.022, 0.02); head.scale.set(0.05, 0.05, 0.02); head.rotation.z = Math.PI / 4; head.position.x = (Math.max(0.04, L - CMX.w * 0.9)) / 2;
        ar.add(shaft); ar.add(head); ar.position.set((a.x + b2.x) / 2, (a.y + b2.y) / 2, Math.max(a.z, b2.z) + 0.03); ar.rotation.z = Math.atan2(dy, dx); grp.add(ar); h.arrows.push(ar);
        if (Math.abs(dy) > 0.2) ar.visible = L < 2.5;   // the jump to the next row reads from the end of one row to the start of the next
      }
      DRV.comic.tick(h, 0, null);   // placed at once (the world has no frame loop for it)
    },
    csOf: function () { return { cw: CMX.w, ch: CMX.h, ct: CMX.t }; },
    // in the hand: in front of the whole-page view (the eye goes back there when a panel is taken), whatever the tour was doing
    handPose: function (I, flipped) {
      var b = I.camBase, c2 = new (T().PerspectiveCamera)(40, I.cam.aspect, 0.05, 50); c2.position.copy(b.p); c2.lookAt(b.l); c2.updateMatrixWorld(true);
      var fwd = new (T().Vector3)(); c2.getWorldDirection(fwd); var dist = 1.15, vh = 2 * dist * Math.tan(20 * RAD), k = Math.min(vh * 0.62 / CMX.h, vh * c2.aspect * 0.8 / CMX.w), q = c2.quaternion.clone();
      if (flipped) q.multiply(new (T().Quaternion)().setFromEuler(new (T().Euler)(0, Math.PI, 0)));
      return { p: c2.position.clone().addScaledVector(fwd, dist).add(new (T().Vector3)(0, vh * 0.06, 0)), q: q, s: new (T().Vector3)(CMX.w * k, CMX.h * k, CMX.t * 2) };
    },
    parentOf: function (h) { return h.grp; },
    home: function (h, c, a, o) { var p = h.pos[c.slot]; o.position.set(p.x, p.y, p.z); o.rotation.set(0, p.ry, 0); },
    tick: function (h, dt, I) {
      h.time += dt; var moving = false, focus = I && I.out ? I.out : h.tourK != null && h.tourK >= 0 ? h.cards[h.tourK] : null, V = T().Vector3;
      if (I && !I.mx.auto && (h.tourK != null || h.revealed < h.cards.length || h.touring)) { h.tourK = null; h.touring = false; h.cards.forEach(function (c) { if (c.slot >= h.revealed) c.popT = h.time; }); h.revealed = h.cards.length; }   // stopped: every panel is back
      h.cards.forEach(function (c) {
        var shown = c.slot < h.revealed, e = shown ? (c.popT > -9 ? easeBack((h.time - c.popT) / 0.45) : 1) : 0;
        if (shown && h.time - c.popT < 0.5) moving = true;
        if (!c.busy) { DRV.comic.home(h, c, 0, c.mesh); c.mesh.scale.set(CMX.w * Math.max(0.001, e), CMX.h * Math.max(0.001, e), CMX.t); c.mesh.updateMatrix(); }
        c.mesh.visible = e > 0.01;
        var exT = c === focus ? 1 : 0; if (Math.abs(c.ex - exT) > 0.01) { c.ex += (exT - c.ex) * Math.min(1, dt * 5); moving = true; } else c.ex = exT;   // the speech bubble opens on the panel in focus
        var want = c.ex > 0.5 ? 'long' : 'short'; if (c.bState !== want) { c.bubble.material = h.use ? h.use(bubbleTex(c.card, want === 'long')).mat : c.bubble.material; c.bState = want; }
        var s = c.mesh.scale.x / CMX.w, bw = (0.22 + 0.32 * c.ex) * s, bh = (0.1 + 0.14 * c.ex) * s, fx = bw / CMX.w / s / 2, fy = bh / CMX.h / s / 2, p = new V((0.5 - fx - 0.02) * (1 - c.ex) + (0.5 - fx + 0.06) * c.ex, (0.5 - fy - 0.04) * (1 - c.ex) + (0.5 + fy + 0.03) * c.ex, 2.5).applyMatrix4(c.mesh.matrix);   // closed: in its own panel's corner; open: just above the panel, so it covers no picture
        c.bubble.position.copy(p); c.bubble.quaternion.copy(c.mesh.quaternion); c.bubble.scale.set(Math.max(0.001, bw), Math.max(0.001, bh), 1); c.bubble.visible = c.mesh.visible && s > 0.1 && !c.busy;   // in your hand: turn it over for all of it
        var np = new V(0.42, -0.42, 3).applyMatrix4(c.mesh.matrix); c.num.position.copy(np); c.num.quaternion.copy(c.mesh.quaternion); c.num.scale.set(0.07 * s, 0.07 * s, 1); c.num.visible = h.story && c.mesh.visible && s > 0.1;
        if (c.numFor !== c.slot && h.use) { c.num.material = h.use(U.signRes(String(c.slot + 1), 1.2, 1.2, '#ffe66b', '#111111')).mat; c.numFor = c.slot; }   // reordered: its number follows its new place
      });
      return moving;
    },
    // the tour: the eye goes from panel to panel and back to the whole page
    camTick: function (h, dt, I) {
      var base = I.camBase, V = T().Vector3, tp, tl;
      if (h.tourK != null && h.tourK >= 0 && h.cards[h.tourK] && !I.out) { var m = h.cards[h.tourK].mesh, n = new V(0, 0, 1).applyQuaternion(m.quaternion); tl = m.position.clone().add(new V(0, 0.13, 0)); tp = tl.clone().addScaledVector(n, 1.4).add(new V(0, 0.02, 0)); }   // the panel and its open bubble above it, both in view
      else { tp = base.p; tl = base.l; }
      if (!h.cp) h.cp = { p: base.p.clone(), l: base.l.clone() };
      if (h.cp.p.distanceTo(tp) < 1e-4 && h.cp.l.distanceTo(tl) < 1e-4) return null;
      var k = Math.min(1, dt * 2.4); h.cp.p.lerp(tp, k); h.cp.l.lerp(tl, k); h.camAt = h.cp.p.distanceTo(tp);
      return { p: h.cp.p, l: h.cp.l };
    },
    autoTick: function (h, dt, I) {
      if (I.out) return;
      if (!h.touring) { h.touring = true; h.tourK = -1; h.revealed = 0; h.tt = 0; I.api.say('从头讲：' + h.cards.length + ' 格' + (h.story ? '' : '（故事板墙：只是列表的先后，不代表情节）')); }
      h.tt += dt;
      if (h.tourK === -1) { if (h.tt > 1.0) { h.tourK = 0; h.revealed = 1; h.cards[0].popT = h.time; h.tt = 0; } return; }
      if (h.tourK == null) { if (h.tt > 3.2) { h.touring = false; } return; }   // the whole page for a while, then again from the start
      if (h.tt > 3.4) { h.tt = 0; if (h.tourK + 1 < h.cards.length) { h.tourK++; h.revealed = h.tourK + 1; h.cards[h.tourK].popT = h.time; I.api.say((h.story ? '第 ' + (h.tourK + 1) + ' 格 · ' : '') + h.cards[h.tourK].card.title); } else { h.tourK = null; h.revealed = h.cards.length; I.api.say('回到整页'); } }
    },
    apply: function () {},
    aOf: function () { return 0; }, posOf: function () { return 0; },
    target: function (h, c, a) { return a; },
    front: function (h) { return h.cards; },
    where: function (c) { return '第 ' + (c.slot + 1) + ' 格'; },
    cardActions: function (h, c) { return '<button type="button" data-mc="earlier"' + (c.slot === 0 ? ' disabled' : '') + '>◀ 往前放</button><button type="button" data-mc="later"' + (c.slot >= h.cards.length - 1 ? ' disabled' : '') + '>往后放 ▶</button>'; },
    extra: function (h) { return '<div class="mc-tabs"><button type="button" data-mc="story"' + (h.story ? ' class="on"' : '') + '>' + (h.story ? '📖 按故事顺序讲述（编号 · 箭头）' : '🗂 故事板墙（不排先后）') + '</button><small style="align-self:center;color:#94a3b8">' + (h.auto && h.story ? '标题带有步骤或年份，按故事讲' : h.story ? '你选了按故事讲' : '这个列表看不出先后，只按列表顺序摆放') + '</small></div>'; },
    cmd: function (h, a, arg, I) {
      var cfg = I.mx.cfg = I.mx.cfg || {};
      if (a === 'turn') { var cur = I.out ? I.out.slot : h.lastSlot != null ? h.lastSlot : -1, nx = h.cards[mod(cur + (+arg), h.cards.length)]; if (!nx) return true; h.lastSlot = nx.slot; if (I.out) I.api.back(function () { I.api.pull(nx); }); else I.api.pull(nx); return true; }
      if (a === 'story') { cfg.story = !h.story; I.api.load(); I.api.chrome(); I.api.say(cfg.story ? '按故事顺序：编号和箭头表示先后（你自己选的）' : '故事板墙：只按列表顺序摆，不表示情节先后'); return true; }
      if (a === 'earlier' || a === 'later') { if (!I.out) return true; var o = h.cards.filter(function (q) { return q.slot === I.out.slot + (a === 'earlier' ? -1 : 1); })[0]; if (o) { var t = I.out.card.title; I.api.swap(o); I.api.say('「' + t + '」' + (a === 'earlier' ? '往前' : '往后') + '放了一格 · 只改了这里的叙事顺序'); } return true; }
    },
    state: function (h) { return { story: h.story, autoStory: h.auto, tourK: h.tourK, revealed: h.revealed, arrows: h.arrows.length, ex: h.cards.map(function (c) { return +c.ex.toFixed(2); }), cam: h.cp ? [+h.cp.p.x.toFixed(2), +h.cp.p.y.toFixed(2), +h.cp.p.z.toFixed(2)] : null }; }
  };

  // one machine: frame, moving parts, cards — into grp. Returns the handle that operates it.
  function buildMachine(d, grp, ix, use, shadows) {
    var info = cardsOf(d, ix), D = DRV[info.mx.type], h = { info: info, D: D, cards: [], use: use, ix: ix };
    D.build(h, grp, use, shadows); if (!D.ownCards) addCards(h, D, use, D.upside);
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
      if (h.info.mx.auto && h.D.worldAuto !== false && !reduced() && h.cards.length) { TURN.push({ id: d.id, grp: grp, h: h, a0: h.D.aOf(h.info.mx.pos, h.info), t0: performance.now() }); if (!turning) { turning = true; requestAnimationFrame(worldTick); } }
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
      '<div class="mc-card" hidden><span class="mc-cx"></span><button type="button" data-mc="flip">🔄 翻面</button><button type="button" data-mc="swap">↔ 和另一张换位置</button><button type="button" data-mc="detail">📄 卡片详情</button><button type="button" class="go" data-mc="back">↩ 放回原位</button></div></div>' +
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
    INS = { api: API, ctx: ctx, d: d, D: D, el: el, R: R, scene: scene, cam: cam, grp: grp, floor: floor, used: [], mx: mx, mx0: JSON.stringify(mx), s: { a: 0, w: 0, target: null }, held: null, out: null, flipped: false, swap: false, motor: false, tweens: [], last: performance.now(), moving: true };
    try { load(); } catch (err) { if (root.console) console.error('machine', err); leave(false); return ctx.toast('这台装置没能打开：' + (err && err.message || err)); }   // never an empty view that looks open
    ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'keyup', 'keypress', 'click'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }); });
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-mc]'); if (b) cmd(b.getAttribute('data-mc'), b.getAttribute('data-arg')); });
    el.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); return INS.out ? cmd('back') : cmd('close'); }
      if (e.target.tagName === 'BUTTON') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { cmd('turn', '-1'); e.preventDefault(); } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { cmd('turn', '1'); e.preventDefault(); }
    });
    cv.tabIndex = 0;
    cv.addEventListener('pointerdown', function (e) {
      if (!INS) return; try { cv.setPointerCapture(e.pointerId); } catch (x) {} INS.held = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false, v: 0 };
      if (D.down && !INS.out) { var hh = pickAt(e.clientX, e.clientY); if (hh && !hh.object.userData.mc && D.down(INS.h, hh.object, INS)) INS.held.custom = hh.object; }
    });
    cv.addEventListener('pointermove', function (e) {
      var H = INS && INS.held; if (!H || H.id !== e.pointerId) return;
      var now = performance.now(), dt = Math.max(1, now - H.t) / 1000, dp = D.axis === 'y' ? (e.clientY - H.y) / Math.max(200, cv.clientHeight) : (e.clientX - H.x) / Math.max(200, cv.clientWidth);
      if (H.custom) { if (!H.moved && Math.hypot(e.clientX - H.x0, e.clientY - H.y0) > 6) H.moved = true; if (H.moved) { D.move(INS.h, H.custom, e.clientX - H.x, e.clientY - H.y, dt, INS); INS.moving = true; } H.x = e.clientX; H.y = e.clientY; H.t = now; return; }
      if (D.axis === 'none') dp = 0;
      if (!H.moved && Math.hypot(e.clientX - H.x0, e.clientY - H.y0) > 6) { H.moved = true; if (!INS.out && D.axis !== 'none') grab(); }
      if (H.moved && !INS.out) { var da = dp * D.gain; INS.s.a += da; bound(); H.v = H.v * 0.6 + (da / dt) * 0.4; INS.moving = true; }   // the machine follows the finger
      H.x = e.clientX; H.y = e.clientY; H.t = now;
    });
    function up(e) {
      var H = INS && INS.held; if (!H || H.id !== e.pointerId) return; INS.held = null;
      if (H.custom) { D.up(INS.h, H.custom, H.moved, performance.now() - H.t, INS); if (!H.moved && e.type === 'pointerup') tapAt(e.clientX, e.clientY); return; }
      if (H.moved && D.axis === 'none') return;
      if (H.moved) {   // let go: it carries on with the speed of the finger — or, let go still, it settles on the nearest stop
        if (!INS.out) { var vm = D.step === 1 ? 12 : 9; INS.s.w = performance.now() - H.t > 90 ? 0 : clamp(H.v, -vm, vm); INS.s.target = INS.s.w ? null : Math.round(INS.s.a / D.step) * D.step; bound(); INS.moving = true; }
        return;
      }
      if (e.type === 'pointerup') tapAt(e.clientX, e.clientY);
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (!INS || INS.out) return; go(Math.round(INS.s.a / D.step) * D.step + (e.deltaY > 0 ? 1 : -1) * D.step * D.dir, false); }, { passive: false });
    (function loop(now) {
      if (!INS || INS.R !== R) return;
      if (!root.__oiaOn || !el.isConnected) return leave(true);   // the world was closed under it: put everything back, keep what was chosen
      var I = INS, w = cv.clientWidth, h = cv.clientHeight, dt = Math.min(0.05, (now - I.last) / 1000 || 0); I.last = now;
      if (w && h && (I.vw !== w || I.vh !== h)) {
        I.vw = w; I.vh = h; R.setSize(w, h, false); cam.aspect = w / h;
        var c = D.cam, k = Math.max(1, 1 / Math.min(1, cam.aspect * 1.45)), lk = new (T().Vector3)(c.look[0], c.look[1], c.look[2]), p = new (T().Vector3)(c.p[0], c.p[1], c.p[2]).sub(lk).multiplyScalar(k).add(lk);
        cam.position.copy(p); cam.lookAt(lk); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); I.moving = true; I.camBase = { p: p.clone(), l: lk.clone() };
      }
      if (!I.held || !I.held.moved) {
        if (I.mx.auto && D.autoTick && !I.held) { D.autoTick(I.h, dt, I); I.moving = true; }   // a machine with its own way of running by itself
        if (I.mx.auto && !D.autoTick && !I.out && !I.held && !I.motor && I.s.target == null && Math.abs(I.s.w) < 0.5 * D.step) {   // Auto Play: steady, until a hand takes over
          I.s.a += D.autoSpeed * dt; I.s.w = 0; var lm = D.limit && D.limit(I.h.info); if (lm && I.s.a > lm[1] + 0.3) I.s.a = lm[0]; I.moving = true;
        } else if (I.motor && I.s.target != null) { if (!drive(I.s, dt, D.motor || 7)) { I.motor = false; I.s.target = null; settled(); arrived(); } I.moving = true; }
        else if (I.s.target != null || Math.abs(I.s.w) > 0) { var on = spin(I.s, dt, D.step); bound(); I.moving = true; if (!on) { I.s.target = null; settled(); arrived(); } }   // arrived: done (once), not again every frame
      }
      if (D.tick && D.tick(I.h, dt, I)) I.moving = true;
      if (D.camTick && I.camBase) { var cp = D.camTick(I.h, dt, I); if (cp) { cam.position.copy(cp.p); cam.lookAt(cp.l); cam.updateMatrixWorld(true); I.moving = true; } }
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
  function grab() { var I = INS, was = I.mx.auto; if (!I.keepAuto) I.mx.auto = false; I.motor = false; I.pending = null; I.s.target = null; I.s.w = 0; if (was && !I.keepAuto) chrome(); }
  function arrived() { var I = INS; if (I && I.pending) { var c = I.pending; I.pending = null; pull(c, true); } }   // a hand on the machine stops Auto Play and the motor
  function restAt() { var I = INS; return I.s.target != null ? I.s.target : I.s.a; }
  function settled() { INS.mx.pos = INS.D.posOf(INS.s.a, INS.h.info); chrome(); }
  function chrome() {
    var I = INS, el = I.el, info = I.h.info, a = restAt();
    el.querySelector('.mc-sub').textContent = (info.list ? '「' + info.list.title + '」' + info.refs.length + ' 张' : '列表已不在看板上') + ' · 只是引用，列表本身不会变';
    var al = I.D.autoLabel || ['▶ 自动', '⏸ 暂停']; el.querySelector('[data-mc=auto]').textContent = I.mx.auto ? al[1] : al[0];
    [].forEach.call(el.querySelectorAll('[data-mc=order]'), function (b) { var k = b.getAttribute('data-arg'); b.classList.toggle('on', I.mx.order === k); if (k === 'custom') b.hidden = I.mx.order !== 'custom'; });
    var pg = el.querySelector('.mc-pg'); pg.hidden = info.pages < 2; pg.querySelector('b').textContent = (info.page + 1) + ' / ' + info.pages;
    el.querySelector('.mc-card').hidden = !I.out;
    var sw = el.querySelector('[data-mc=swap]'); sw.classList.toggle('on', I.swap); sw.textContent = I.swap ? '↔ 在下面点另一张…' : '↔ 和另一张换位置';
    setHtml(el.querySelector('.mc-extra'), I.D.extra ? I.D.extra(I.h, a, I) : '');
    setHtml(el.querySelector('.mc-cx'), I.out && I.D.cardActions ? I.D.cardActions(I.h, I.out, I) : '');
    var reach = I.D.front(I.h, a, I), fr = el.querySelector('.mc-front'); fr.hidden = reach === null; if (reach === null) return;
    var bySlot = function (p, q) { return p.slot - q.slot; }; if (I.D !== DRV.flip && !I.D.keepFront) reach.sort(bySlot);   // the flip carousel lists them in the order they will come up
    setHtml(el.querySelector('.mc-front'), reach.map(function (c) { return '<button type="button" data-mc="pull" data-arg="' + c.slot + '"' + (I.out && I.out.slot === c.slot ? ' class="on"' : '') + '>' + esc(c.card.title) + '</button>'; }).join('') || '<small>这里是空的</small>');
  }
  function setHtml(node, html) { if (node.__h !== html) { node.__h = html; node.innerHTML = html; } }
  function tween(o, p1, q1, s1, dur, done) { INS.tweens = INS.tweens.filter(function (t) { return t.o !== o; }); INS.tweens.push({ o: o, p0: o.position.clone(), q0: o.quaternion.clone(), s0: o.scale.clone(), p1: p1, q1: q1, s1: s1, t: 0, dur: reduced() ? 0.01 : dur, done: done }); INS.moving = true; }
  // in the hand: straight in front of the eye, as big as the view allows, facing you (turned over about the card's own axis)
  function handPose(flipped) {
    if (INS.D.handPose) return INS.D.handPose(INS, flipped);   // the jukebox shows a record on its own stage, not in your hand
    var I = INS, cs = I.D.csOf && I.out ? I.D.csOf(I.h, I.out) : I.D.cs, cam = I.cam, dist = 1.15, fwd = new (T().Vector3)(); cam.getWorldDirection(fwd);
    var vh = 2 * dist * Math.tan(20 * RAD), k = Math.min(vh * 0.62 / cs.ch, vh * cam.aspect * 0.8 / cs.cw);
    var q = cam.quaternion.clone(); if (flipped) q.multiply(new (T().Quaternion)().setFromEuler(new (T().Euler)(I.D.flip === 'x' ? Math.PI : 0, I.D.flip === 'x' ? 0 : Math.PI, 0)));
    return { p: cam.position.clone().addScaledVector(fwd, dist).add(new (T().Vector3)(0, vh * 0.06, 0)), q: q, s: new (T().Vector3)(cs.cw * k, cs.ch * k, cs.ct * 2) };
  }
  function homePose(c, a) { var I = INS, o = new (T().Object3D)(), cs = I.D.csOf ? I.D.csOf(I.h, c) : I.D.cs; I.D.home(I.h, c, a, o); o.scale.set(cs.cw, cs.ch, cs.ct); return o; }
  // a card leaves its place and comes to you
  function pull(c, arrived) {
    var I = INS; if (I.out || !c) return;
    if (I.D.pull) return I.D.pull(I.h, c, I);
    var tg = I.D.target(I.h, c, I.s.a);
    if (!arrived) {
      var wasAuto = I.mx.auto && !I.keepAuto; grab(); if (wasAuto) I.resume = true;
      I.s.target = tg; I.motor = !!I.D.motor && Math.abs(tg - I.s.a) > (I.D.waitArrive ? 0.01 : 0.6); bound();   // the machine brings that card's place to hand and stops
      if (I.D.waitArrive && I.motor) { I.pending = c; I.mx.sel = c.card.ref; chrome(); return say(I.D.fetchSay ? I.D.fetchSay(c, I.h) : '…'); }   // … and only then is it taken out
    }
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
    tween(c.mesh, o.position.clone(), o.quaternion.clone(), o.scale.clone(), 0.38, function () { c.busy = false; c.mesh.scale.copy(o.scale); if (INS && INS.resume && !INS.out) { INS.resume = false; INS.mx.auto = true; INS.s.target = null; chrome(); } if (then) then(); });   // it was running when you took the card: it runs on
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
  function pickAt(x, y) {
    var I = INS, r = I.R.domElement.getBoundingClientRect(), rc = new (T().Raycaster)();
    I.scene.updateMatrixWorld(true); rc.setFromCamera(new (T().Vector2)((x - r.left) / r.width * 2 - 1, 1 - (y - r.top) / r.height * 2), I.cam);
    var objs = I.h.cards.filter(function (c) { return c.mesh; }).map(function (c) { return c.mesh; }).concat(I.h.block ? [I.h.block] : []).concat(I.D.pickables ? I.D.pickables(I.h) : []);
    var hs = rc.intersectObjects(objs, false);   // the machine's own body hides the cards behind it
    return hs.length ? hs[0] : null;
  }
  function cardOf(o) { return o ? INS.h.cards.filter(function (c) { return c.mesh === o; })[0] || null : null; }
  function hit(x, y) { var hh = pickAt(x, y); return hh ? cardOf(hh.object) : null; }
  function tapAt(x, y) {
    var I = INS, hh = pickAt(x, y), c = hh ? cardOf(hh.object) : null;
    if (I.out) { if (c === I.out) return flip(); if (c && I.swap) return swapWith(c); return putBack(); }
    if (c) return pull(c);
    if (hh && I.D.tap) I.D.tap(I.h, hh.object, I, hh.point);
  }
  function go(target, motor) { var I = INS; grab(); I.s.target = target; I.motor = !!motor; bound(); I.mx.pos = I.D.posOf(I.s.target, I.h.info); I.moving = true; chrome(); }
  function cmd(a, arg) {
    var I = INS; if (!I) return;
    if (a === 'close') return leave(true);
    if (I.D.cmd) { var r = I.D.cmd(I.h, a, arg, I); if (r !== undefined) return r; }   // a machine's own buttons (and its own meaning of the shared ones)
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
  // what the user chose, written to the island record (one undo step, only if it changed since the last write)
  function keep(I) {
    if (!I || !I.h) return;
    I.mx.pos = I.D.posOf(I.s.target != null ? I.s.target : I.s.a, I.h.info); I.mx.page = I.h.info.page;
    if (I.D.beforeSave) I.D.beforeSave(I.h, I);
    var mx = cleanMx(I.mx), js = JSON.stringify(mx);
    if (js !== I.mx0) try { I.ctx.commit(function (next) { var q = U.byId(next.displays, I.d.id); if (q) q.mx = mx; }); I.mx0 = js; } catch (e) { I.ctx.toast('装置的状态没能保存'); }
  }
  // the page goes away (refresh, close, another app) while a machine is being operated: keep what was chosen
  ['pagehide', 'visibilitychange'].forEach(function (t) { root.addEventListener && document.addEventListener(t, function () { if (INS && (t === 'pagehide' || document.visibilityState === 'hidden')) keep(INS); }, true); });
  root.addEventListener && root.addEventListener('pagehide', function () { if (INS) keep(INS); });
  // leaving: whatever is in the air goes home, then only what the user chose is saved (one undo step, only if changed)
  function leave(save) {
    var I = INS; if (!I) return; INS = null;
    cancelAnimationFrame(I.raf);
    if (save) keep(I);
    I.used.forEach(function (r) { r.n--; });
    I.floor.geometry.dispose(); I.floor.material.dispose(); I.R.dispose(); try { I.R.forceContextLoss(); } catch (e) {}
    I.el.remove();
    if (save) I.ctx.refresh();
  }

  var API = { swap: function (b) { swapWith(b); }, pull: function (c) { pull(c); }, back: function (then) { putBack(then); }, say: function (t) { say(t); }, chrome: function () { chrome(); }, go: function (t, m) { go(t, m); }, load: function () { load(); }, flip: function () { flip(); }, grab: function () { grab(); }, tween: function (o, p, q, s, d, f) { tween(o, p, q, s, d, f); } };

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
    '#mc .mc-cx{display:contents}',
    '#mc .mc-cx .mc-l{align-self:center;font:700 12px system-ui;background:rgba(17,22,31,.82);padding:4px 8px;border-radius:8px}',
    '#mc .mc-confirm{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,90%);background:#fbf6e9;color:#1d2b4f;border:3px solid #2f6fd6;border-radius:8px;padding:16px;font:600 14px/1.5 system-ui;box-shadow:0 12px 40px #0009;z-index:3}',
    '#mc .mc-confirm p{margin:0 0 12px}',
    '#mc .mc-confirm div{display:flex;gap:8px;justify-content:flex-end}',
    '#mc .mc-confirm button{color:#1d2b4f;background:#fff;border-color:#b9c2d0}',
    '#mc .mc-confirm button.go{color:#fff}',
    '#mc button{min-height:44px;padding:0 13px;border:2px solid #56637a;border-radius:10px;background:#2b3545;color:#f3ead6;font:700 13px system-ui;cursor:pointer}',
    '#mc button.on{background:#f2c13d;border-color:#b98a1c;color:#2b2205}',
    '#mc button.go{background:#2f8a4a;border-color:#1f6a36;color:#fff}',
    '#mc button:disabled{opacity:.38;cursor:default}',
    '#mc footer{flex:none;padding:8px 10px;padding-bottom:max(8px,env(safe-area-inset-bottom));background:#11161f;display:grid;grid-template-columns:minmax(0,1fr);gap:7px}',
    '#mc footer>*{min-width:0}',
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
        cards: I.h.cards.map(function (c) { if (!c.mesh) return { slot: c.slot, ref: c.card.ref }; c.mesh.getWorldPosition(P); return { slot: c.slot, ref: c.card.ref, inPlace: c.mesh.parent !== I.scene, y: +P.y.toFixed(3), z: +P.z.toFixed(3), rx: +c.mesh.rotation.x.toFixed(3) }; }),
        machine: I.D.state ? I.D.state(I.h) : null,
        trays: I.h.trays ? I.h.trays.map(function (g, t) { return { id: t + 1, y: +g.position.y.toFixed(3), z: +g.position.z.toFixed(3), tilt: g.rotation.x + g.rotation.z }; }) : null, tweens: I.tweens.length };
    },
    cmd: function (a, arg) { cmd(a, arg); }
  };
})(typeof window === 'object' ? window : globalThis);
