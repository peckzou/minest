/* web31 · Minest Live — a class game played through the Study Arcade (Gimkit-style economy, level map).
   Teacher (🎓 in the top bar): pick a board, the lists and the levels → host → students join with a code.
   Student: a level map of the Arcade games (Card Flinger → Swipe Judgment → Glass Fruit → Glass Blast →
   Whack-a-Term → What's Missing? → Smash It). Clearing a level unlocks the next and pays a bonus by stars.
   Inside a level every judged card earns or costs money: (money per question + streak bonus × streak) ×
   multiplier. The answer games pay the full amount; the two self-judged warm-ups pay a flat amount per card,
   so an honest "again" costs nothing there. Between levels, the shop: upgrades and power-ups.
   The teacher sees a live board: money, level trail, what each student is playing, accuracy; at the end a
   podium and the cards to reteach.
   The same panel publishes the board to a Web 20 course room (/api/rooms/CODE).
   Student page: web31.1.play.html?code=CODE (/play) — this file plus the Study Arcade, nothing else.
   Data: Firebase Realtime Database /minest-live/{CODE}: host (board snapshot, levels, pace, goal, state) and
   players/{pid}. Streams with EventSource, falls back to polling. */
(function () {
  'use strict';
  if (window.MinestLive) return;

  var DB = 'https://minest-33761-default-rtdb.firebaseio.com/minest-live/';
  var API = /vercel\.app$/.test(location.hostname) ? '' : 'https://minest-app.vercel.app';
  var PLAY_PAGE = 'web31.1.play.html';

  // ------------------------------------------------------------------ helpers
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function cleanCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
  function newCode() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = ''; for (var i = 0; i < 6; i++) o += a[Math.floor(Math.random() * a.length)]; return o; }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function key(id) { return String(id).replace(/[.#$\[\]\/]/g, '_').slice(0, 120); }   // a database key
  function cut(s, n) { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function money(n) {
    n = Math.floor(n || 0); var neg = n < 0; n = Math.abs(n);
    var s = n >= 1e9 ? (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K' : n.toLocaleString();
    return (neg ? '−' : '') + '🪙 ' + s.replace('.0', '');
  }
  function points(n) { return Math.floor(Number(n) || 0).toLocaleString() + ' pts'; }
  function clock(ms) { ms = Math.max(0, ms); var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function pct(c, w) { return c + w ? Math.round(100 * c / (c + w)) + '%' : '—'; }

  function db(path, method, body) {
    return fetch(DB + path + '.json', { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('Live service ' + r.status); return r.json(); });
  }
  // a live copy of one path: EventSource (put/patch) or polling every 1.5 s
  function watch(path, onData) {
    var tree = null, es = null, poll = null, closed = false;
    function setAt(p, v) {
      if (p === '/' || !p) { tree = v; return; }
      var ks = p.replace(/^\//, '').split('/'), o = tree && typeof tree === 'object' ? tree : (tree = {});
      for (var i = 0; i < ks.length - 1; i++) { if (!o[ks[i]] || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
      if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
    }
    function startPoll() {
      if (poll || closed) return;
      var tick = function () { db(path).then(function (d) { if (!closed) { tree = d; onData(tree); } }).catch(function () {}); };
      tick(); poll = setInterval(tick, 1500);
    }
    try {
      es = new EventSource(DB + path + '.json');
      es.addEventListener('put', function (e) { var m = JSON.parse(e.data); setAt(m.path, m.data); onData(tree); });
      es.addEventListener('patch', function (e) { var m = JSON.parse(e.data); Object.keys(m.data || {}).forEach(function (k) { setAt((m.path === '/' ? '' : m.path) + '/' + k, m.data[k]); }); onData(tree); });
      es.onerror = function () { if (es && es.readyState === 2) { es = null; startPoll(); } };
    } catch (e) { startPoll(); }
    return { close: function () { closed = true; if (es) es.close(); if (poll) clearInterval(poll); } };
  }

  // tiny synthesized cues
  var actx = null;
  function beep(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(kind === 'good' ? 880 : kind === 'buy' ? 660 : kind === 'bad' ? 160 : kind === 'win' ? 523 : 440, t);
      if (kind === 'win' || kind === 'buy') o.frequency.exponentialRampToValueAtTime(kind === 'win' ? 1046 : 990, t + 0.25);
      g.gain.setValueAtTime(kind === 'bad' ? 0.05 : 0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'win' ? 0.45 : 0.18));
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.5);
    } catch (e) {}
  }

  // ------------------------------------------------------------------ levels: the Study Arcade games
  var LEVELS = [
    { k: 'flinger', name: 'Card Flinger', icon: '🃏', tag: 'Learn · see every card', self: true },
    { k: 'swipe', name: 'Swipe Judgment', icon: '👆', tag: 'Learn · know it or not', self: true },
    { k: 'slice', name: 'Glass Fruit', icon: '🍉', tag: 'Slice the right answer' },
    { k: 'blast', name: 'Glass Blast', icon: '🚀', tag: 'Shoot the right answer' },
    { k: 'whack', name: 'Whack-a-Term', icon: '🔨', tag: 'Bonk the right answer' },
    { k: 'missing', name: "What's Missing?", icon: '🧩', tag: 'Which card vanished?' },
    { k: 'smash', name: 'Smash It', icon: '💎', tag: 'Boss level · smash the answer' }
  ];
  function levelInfo(k) { return LEVELS.filter(function (l) { return l.k === k; })[0] || LEVELS[0]; }
  // the board the students play: only the chosen lists, only what the games read
  function snapshot(b, colIds) {
    return { id: b.id, title: b.title || 'Minest board', columns: (b.columns || []).filter(function (c) { return !colIds || colIds.indexOf(c.id) >= 0; }).map(function (c) {
      return { id: c.id, title: c.title || 'List', color: c.color || '#60a5fa', cards: (c.cards || []).filter(function (k) { return k && k.title; }).map(function (k) {
        var o = { id: String(k.id), title: k.title, desc: k.desc || k.description || '' };
        if (Array.isArray(k.checklistItems) && k.checklistItems.length) o.checklistItems = k.checklistItems.map(function (it) { return { text: it.text || it.title || '' }; });
        if (Array.isArray(k.stack) && k.stack.length) o.stack = k.stack.filter(function (s) { return s && s.title; }).map(function (s) { return { id: String(s.id), title: s.title, desc: s.desc || s.description || '' }; });
        return o;
      }) };
    }) };
  }
  function cardsIn(board) {
    var out = {};
    (board.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { out[key(k.id)] = k.title; (k.stack || []).forEach(function (s) { out[key(s.id)] = s.title; }); }); });
    return out;
  }
  function withBack(board) {
    var n = 0; (board.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (String(k.desc || '').trim() || (k.checklistItems || []).length) n++; }); });
    return n;
  }

  // ------------------------------------------------------------------ the shop (Gimkit Classic values)
  var UPG = {
    mpq: { name: 'Coins per Question', icon: '🪙', vals: [1, 5, 50, 100, 500, 2000, 5000, 10000, 250000, 1000000], cost: [0, 10, 100, 1000, 10000, 75000, 300000, 1000000, 10000000, 100000000], fmt: function (v) { return money(v); } },
    sb: { name: 'Streak Bonus', icon: '🔥', vals: [1, 3, 10, 50, 250, 1200, 6500, 35000, 175000, 1000000], cost: [0, 20, 200, 2000, 20000, 200000, 2000000, 20000000, 200000000, 2000000000], fmt: function (v) { return money(v); } },
    mult: { name: 'Multiplier', icon: '✖️', vals: [1, 1.5, 2, 3, 5, 8, 12, 18, 30, 100], cost: [0, 50, 300, 2000, 12000, 85000, 700000, 6500000, 65000000, 1000000000], fmt: function (v) { return '×' + v; } },
    ins: { name: 'Insurance', icon: '🛡', vals: [0, 10, 25, 40, 50, 70, 80, 90, 95, 99], cost: [0, 10, 250, 1000, 25000, 100000, 1000000, 5000000, 25000000, 500000000], fmt: function (v) { return v + '%'; } }
  };
  var POWER = {
    mini: { name: 'Mini Bonus', icon: '⚡', desc: '×2 on every right answer in your next level', price: function (e) { return Math.max(25, e * 8); } },
    mega: { name: 'Mega Bonus', icon: '💥', desc: '×5 on every right answer in your next level', price: function (e) { return Math.max(150, e * 40); } },
    shield: { name: 'Streak Shield', icon: '🧲', desc: 'Your streak survives the next 3 misses', price: function (e) { return Math.max(60, e * 12); } }
  };
  // ------------------------------------------------------------------ card packs: collectible cards with perks
  var RAR = {
    common: { name: 'Common', c: 'linear-gradient(160deg,#64748b,#334155)', g: 'rgba(148,163,184,.45)', p: 2, st: 1 },
    rare: { name: 'Rare', c: 'linear-gradient(160deg,#0ea5e9,#1e3a8a)', g: 'rgba(56,189,248,.6)', p: 5, st: 1 },
    epic: { name: 'Epic', c: 'linear-gradient(160deg,#a855f7,#4c1d95)', g: 'rgba(168,85,247,.7)', p: 10, st: 2 },
    legendary: { name: 'Legendary', c: 'linear-gradient(160deg,#fbbf24,#b45309)', g: 'rgba(245,158,11,.8)', p: 20, st: 3 },
    mythic: { name: 'Mythic', c: 'linear-gradient(160deg,#fb7185,#7c3aed 55%,#0ea5e9)', g: 'rgba(244,63,94,.85)', p: 40, st: 5 }
  };
  var RORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  var PERK = { cash: 'coins on right answers', bonus: 'level bonus', guard: 'insurance', streak: 'start streak' };
  // the badges are the user's 3D badge library, as its pre-rendered images (badge-index/thumbs, transparent)
  var BADGE_BASE = (/vercel\.app$/.test(location.hostname) ? '' : 'https://minest-app.vercel.app') + '/badge-index/thumbs/';
  // Minest Live avatars — 50 cute characters in a ClassDojo-like style: a round, chunky head, flat colours with a soft
  // light from the top left, big shiny eyes, rosy cheeks. Ocean animals, zoo animals and a few friendly monsters.
  // The ids are the old ones (monster-sunny … monster-night, monster-09 … monster-50), so saved avatars stay.
  var MNAV = (function () {
    var DK = '#2b2140';
    function c(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || '') + '/>'; }
    function e(x, y, rx, ry, f, rot, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + (ex || '') + '/>'; }
    function p(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || '') + '/>'; }
    function s(d, col, w) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
    function eye(x, y, k) { k = k || 1; return e(x, y, 4.4 * k, 5.2 * k, DK) + c(x + 1.5 * k, y - 2 * k, 1.7 * k, '#fff') + c(x - 1.3 * k, y + 1.9 * k, 0.8 * k, '#fff'); }
    function eyes(y, dx, k) { return eye(50 - dx, y, k) + eye(50 + dx, y, k); }
    function happy(y, dx) { return s('M' + (50 - dx - 4.5) + ' ' + y + ' q4.5 -4.5 9 0', DK, 2.8) + s('M' + (50 + dx - 4.5) + ' ' + y + ' q4.5 -4.5 9 0', DK, 2.8); }
    function cheeks(y, dx, col) { return e(50 - dx, y, 5, 3.2, col || '#ff7fa3', 0, ' opacity=".5"') + e(50 + dx, y, 5, 3.2, col || '#ff7fa3', 0, ' opacity=".5"'); }
    function smile(y, w) { w = w || 5; return s('M' + (50 - w) + ' ' + y + ' q' + w + ' ' + (w * 0.85) + ' ' + (2 * w) + ' 0', DK, 2.6); }
    function wm(y) { return s('M44 ' + y + ' q3 3.4 6 0 q3 3.4 6 0', DK, 2.4); }
    function open(y, w, h) { w = w || 6; h = h || 6; return p('M' + (50 - w) + ' ' + y + ' q' + w + ' ' + (h * 1.9) + ' ' + (2 * w) + ' 0 z', '#7a2440') + e(50, y + h * 0.62, w * 0.55, h * 0.36, '#ff7b9c'); }
    function mirror(svg) { return '<g transform="translate(100 0) scale(-1 1)">' + svg + '</g>'; }
    function both(svg) { return svg + mirror(svg); }
    function ring(n, R, r, col, cx, cy) { var o = ''; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; o += c((cx || 50) + Math.cos(a) * R, (cy || 56) + Math.sin(a) * R, r, col); } return o; }
    function spikes(n, r0, r1, col) { var o = ''; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, b = 0.18; o += p('M' + (50 + Math.cos(a - b) * r0) + ' ' + (56 + Math.sin(a - b) * r0) + ' L' + (50 + Math.cos(a) * r1) + ' ' + (56 + Math.sin(a) * r1) + ' L' + (50 + Math.cos(a + b) * r0) + ' ' + (56 + Math.sin(a + b) * r0) + ' Z', col, ' stroke="' + col + '" stroke-width="2" stroke-linejoin="round"'); } return o; }
    function star(R, r) { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? ' L' : 'M') + (50 + Math.cos(a) * q).toFixed(1) + ' ' + (57 + Math.sin(a) * q).toFixed(1); } return d + ' Z'; }
    function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); } return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }

    // each: [id, name, colour, back (behind the head), front (on the head), head (optional, its own shape)] — G = the head's fill
    var L = [
      ['monster-sunny', 'Sea Otter', '#a9724b', both(c(25, 33, 8, '#7c4f30') + c(25, 33, 4, '#e2b48c')),
        e(50, 68, 21, 15, '#f3dcc0') + eyes(54, 12) + e(50, 62, 5, 3.6, DK) + wm(67) + both(c(39, 68, 1.1, DK) + c(36, 65, 1.1, DK)) + cheeks(65, 21)],
      ['monster-berry', 'Penguin', '#334155', '',
        p('M50 40C38 32 22 44 26 62C29 80 42 86 50 86C58 86 71 80 74 62C78 44 62 32 50 40Z', '#fff') + eyes(56, 10) + p('M44 64L56 64L50 71Z', '#fb923c') + cheeks(66, 17)],
      ['monster-mint', 'Sea Turtle', '#86d99b', '',
        p('M18 52C18 30 34 18 50 18C66 18 82 30 82 52C70 45 30 45 18 52Z', '#2f855a') + s('M38 30L45 25L55 25L62 30L58 40L42 40Z', '#1f6b45', 2) + s('M28 44L38 30M72 44L62 30M42 40L40 46M58 40L60 46', '#1f6b45', 2) + eyes(59, 11) + smile(69, 5) + cheeks(67, 20)],
      ['monster-sky', 'Dolphin', '#5aa9e6', p('M52 27C56 12 66 7 73 9C67 15 64 23 64 31Z', '#3b82c4'),
        e(50, 72, 15, 10, '#cde7fb') + eyes(53, 12) + s('M41 72q9 6 18 0', '#2b6a9e', 2.4) + c(50, 31, 2, '#2b6a9e') + cheeks(64, 21)],
      ['monster-lilac', 'Bunny', '#efe3ff', e(38, 22, 8, 20, '#e3d0fb', -10) + e(62, 22, 8, 20, '#e3d0fb', 10) + e(38, 24, 4, 13, '#fbb6ce', -10) + e(62, 24, 4, 13, '#fbb6ce', 10),
        eyes(55, 11) + p('M47 63h6l-3 3.5z', '#f472b6') + wm(67) + '<rect x="47.5" y="69" width="5" height="4.5" rx="1" fill="#fff" stroke="#d8c7ee" stroke-width=".6"/>' + cheeks(64, 20)],
      ['monster-coral', 'Fox', '#f97316', both(p('M22 40L18 11L43 27Z', '#ea580c') + p('M21 19L18 11L27 16Z', DK)),
        p('M18 60C26 58 40 62 50 74C60 62 74 58 82 60C80 78 66 88 50 88C34 88 20 78 18 60Z', '#fff7ed') + eyes(54, 12) + e(50, 71, 4.5, 3.2, DK) + smile(76, 3.5) + cheeks(65, 22)],
      ['monster-lime', 'Panda', '#f8fafc', both(c(24, 30, 9, DK)),
        e(38, 55, 8, 10, DK, -25) + e(62, 55, 8, 10, DK, 25) + both(c(39, 55, 3.8, '#fff') + c(39.6, 55.6, 2, DK) + c(40.4, 54.2, .8, '#fff')) + e(50, 66, 4.5, 3.2, DK) + wm(70) + cheeks(69, 23)],
      ['monster-night', 'Lion', '#fbbf24', c(50, 56, 38, '#ea580c') + ring(14, 37, 9, '#ea580c') + both(c(29, 31, 7, '#f59e0b')),
        e(50, 69, 14, 10, '#fde68a') + eyes(54, 11) + p('M45 64h10l-5 5z', '#7c2d12') + wm(71) + cheeks(64, 18), c(50, 57, 29, 'G')],
      ['monster-09', 'Seal', '#94a3b8', '',
        e(43, 67, 8, 6.5, '#e2e8f0') + e(57, 67, 8, 6.5, '#e2e8f0') + e(50, 62, 4.5, 3.2, DK) + eyes(52, 12, 1.1) + both(c(41, 67, 1, '#64748b') + c(39, 70, 1, '#64748b')) + s('M47 74q3 2 6 0', DK, 2) + c(30, 40, 2.2, '#7b8ba1') + c(68, 35, 2.6, '#7b8ba1') + c(74, 46, 1.8, '#7b8ba1') + cheeks(61, 23)],
      ['monster-10', 'Clownfish', '#fb923c', p('M40 28Q50 8 63 26Z', '#f97316', ' stroke="' + DK + '" stroke-width="1.6"') + p('M80 56Q97 45 93 67Z', '#f97316', ' stroke="' + DK + '" stroke-width="1.6"'),
        p('M29 30Q37 56 29 84Q20 76 18 56Q20 38 29 30Z', '#fff', ' stroke="' + DK + '" stroke-width="1.6"') + p('M66 27Q74 56 66 85L58 85Q66 56 58 27Z', '#fff', ' stroke="' + DK + '" stroke-width="1.6"') + eye(42, 52) + eye(52, 52) + c(47, 67, 3, '#7a2440') + e(38, 62, 4, 2.6, '#ff7fa3', 0, ' opacity=".5"'), e(50, 56, 33, 30, 'G')],
      ['monster-11', 'Walrus', '#b07a5a', '',
        p('M43 71L45 89L48 72Z', '#fffaf0') + p('M57 71L55 89L52 72Z', '#fffaf0') + e(42, 66, 10, 8, '#d9a77f') + e(58, 66, 10, 8, '#d9a77f') + e(50, 60, 4.5, 3, DK) + both(c(40, 66, 1, '#7c4f30') + c(38, 69, 1, '#7c4f30') + c(43, 70, 1, '#7c4f30')) + eyes(49, 12) + cheeks(57, 23)],
      ['monster-12', 'Starfish', '#f472b6', '',
        c(50, 40, 2, '#fbcfe8') + c(30, 50, 2, '#fbcfe8') + c(70, 50, 2, '#fbcfe8') + c(38, 76, 2, '#fbcfe8') + c(62, 76, 2, '#fbcfe8') + eyes(55, 8, .9) + smile(64, 4) + cheeks(62, 14),
        p(star(42, 21), 'G', ' stroke="G" stroke-width="10" stroke-linejoin="round"')],
      ['monster-13', 'Axolotl', '#f9a8d4', both(s('M24 46Q12 40 8 31', '#ec4899', 6) + s('M21 56Q10 56 4 54', '#ec4899', 6) + s('M24 66Q12 70 9 79', '#ec4899', 6) + c(8, 31, 3.6, '#f472b6') + c(4, 54, 3.6, '#f472b6') + c(9, 79, 3.6, '#f472b6')),
        eyes(54, 14, .9) + s('M38 65Q50 73 62 65', DK, 2.6) + cheeks(63, 23), e(50, 58, 30, 27, 'G')],
      ['monster-14', 'Narwhal', '#7dd3fc', p('M47 26L50 1L53 26Z', '#fde68a') + s('M48 20l4-2M48.5 14l3-1.5M49 8l2-1', '#d4a72c', 1.5),
        eyes(56, 11) + smile(67, 5) + c(31, 44, 2, '#4fb0e0') + c(68, 38, 2.4, '#4fb0e0') + c(73, 50, 1.6, '#4fb0e0') + cheeks(65, 21)],
      ['monster-15', 'Jellyfish', '#c4b5fd', s('M32 64q-5 10 1 18q5 6-1 12', '#a78bfa', 4) + s('M41 66q-4 10 1 17q4 6 0 11', '#a78bfa', 4) + s('M50 66q-3 10 1 18q3 6 0 10', '#a78bfa', 4) + s('M59 66q-4 10 1 17q4 6 0 11', '#a78bfa', 4) + s('M68 64q-5 10 1 18q5 6-1 12', '#a78bfa', 4),
        eyes(48, 11) + smile(57, 4) + cheeks(55, 21) + c(37, 33, 2.6, 'rgba(255,255,255,.55)') + c(62, 30, 1.8, 'rgba(255,255,255,.55)'),
        p('M18 64C18 34 32 22 50 22C68 22 82 34 82 64Q75 70 66 64Q58 70 50 64Q42 70 34 64Q25 70 18 64Z', 'G')],
      ['monster-16', 'Seahorse', '#facc15', p('M38 28l4-11l4 9l4-11l4 11l4-9l3 11Z', '#f59e0b') + e(80, 62, 13, 6.5, '#fbbf24') + c(92, 62, 3, '#f59e0b'),
        eyes(53, 10) + smile(64, 4) + s('M30 76q20 9 40 0', '#eab308', 2) + s('M33 82q17 7 34 0', '#eab308', 2) + cheeks(62, 19)],
      ['monster-17', 'Pufferfish', '#fde047', spikes(16, 28, 41, '#eab308'),
        e(50, 69, 22, 14, '#fef9c3') + eyes(52, 12, 1.15) + c(50, 70, 3.4, '#7a2440') + cheeks(62, 22)],
      ['monster-18', 'Blue Whale', '#3b82f6', s('M50 27Q46 16 39 14', '#93c5fd', 3) + s('M50 27Q54 16 61 14', '#93c5fd', 3) + c(50, 21, 2.6, '#bfdbfe'),
        p('M15 63Q50 93 85 63Q77 85 50 89Q23 85 15 63Z', '#bfdbfe') + s('M30 76q20 7 40 0M36 82q14 5 28 0', '#93c5fd', 1.6) + eyes(54, 14) + smile(64, 6) + cheeks(63, 25), e(50, 58, 36, 31, 'G')],
      ['monster-19', 'Octopus', '#fb7185', e(28, 83, 7, 9, '#f43f5e', 20) + e(42, 88, 7, 9, '#f43f5e', 8) + e(58, 88, 7, 9, '#f43f5e', -8) + e(72, 83, 7, 9, '#f43f5e', -20),
        c(36, 31, 3, '#fda4af') + c(60, 28, 2.2, '#fda4af') + c(68, 40, 2.6, '#fda4af') + eyes(53, 11) + smile(64, 5) + cheeks(61, 20), e(50, 51, 31, 32, 'G')],
      ['monster-20', 'Shark', '#94a3b8', p('M44 27C50 8 60 3 67 5C61 11 58 19 58 29Z', '#64748b'),
        p('M19 62Q50 92 81 62Q75 85 50 89Q25 85 19 62Z', '#f1f5f9') + s('M36 68Q50 78 64 68', DK, 2.4) + p('M40 70.5l2.5 4l2.5-3.2ZM47.5 73l2.5 4l2.5-4ZM55 71.3l2.5 3.2l2.5-4Z', '#fff', ' stroke="#cbd5e1" stroke-width=".6"') + eyes(52, 13) + s('M24 50q-2 4 0 8M28 48q-2 5 0 10', '#64748b', 1.8) + cheeks(62, 23)],
      ['monster-21', 'Crab', '#ef4444', s('M40 34L36 17', '#dc2626', 4) + s('M60 34L64 17', '#dc2626', 4) + both(p('M20 48C5 46 3 30 13 25L20 34L12 37C14 43 20 43 22 41Z', '#dc2626')),
        c(36, 15, 6.5, '#fff') + eye(36, 15.5, .72) + c(64, 15, 6.5, '#fff') + eye(64, 15.5, .72) + s('M38 64Q50 74 62 64', DK, 2.6) + cheeks(61, 20) + c(32, 72, 1.8, '#fca5a5') + c(68, 72, 1.8, '#fca5a5'), e(50, 58, 31, 27, 'G')],
      ['monster-22', 'Koala', '#9ca3af', both(c(20, 36, 14, '#9ca3af') + c(20, 36, 8, '#f1f5f9')),
        e(50, 62, 7, 9, '#3f3f46') + c(48, 58, 1.6, 'rgba(255,255,255,.35)') + eyes(52, 15) + s('M46 75q4 3 8 0', DK, 2) + cheeks(67, 21)],
      ['monster-23', 'Giraffe', '#fcd34d', s('M40 29L37 12', '#b45309', 4) + c(37, 11, 4, '#92400e') + s('M60 29L63 12', '#b45309', 4) + c(63, 11, 4, '#92400e') + e(19, 41, 9, 5, '#fbbf24', -25) + e(81, 41, 9, 5, '#fbbf24', 25),
        c(30, 41, 4, '#d97706') + c(67, 34, 5, '#d97706') + c(74, 50, 3.4, '#d97706') + c(38, 30, 2.6, '#d97706') + e(50, 70, 16, 11, '#fde68a') + c(45, 68, 1.6, '#92400e') + c(55, 68, 1.6, '#92400e') + eyes(54, 12) + smile(75, 4) + cheeks(64, 23)],
      ['monster-24', 'Red Panda', '#ea580c', both(p('M20 40L22 15L42 28Z', '#c2410c') + p('M25 34L26 21L36 28Z', '#fff7ed')),
        e(50, 70, 15, 11, '#fff7ed') + both(e(38, 44, 5, 3, '#fff7ed') + s('M37 60Q35 68 39 75', '#7c2d12', 3)) + eyes(54, 12) + e(50, 66, 4, 3, DK) + smile(72, 3.5)],
      ['monster-25', 'Polar Bear', '#f1f5f9', both(c(26, 30, 8, '#e2e8f0') + c(26, 30, 4, '#cbd5e1')),
        e(50, 68, 15, 11, '#fff', 0, ' stroke="#e2e8f0" stroke-width="1.2"') + e(50, 64, 5, 3.6, DK) + wm(70) + eyes(54, 12) + cheeks(64, 23)],
      ['monster-26', 'Zebra', '#f8fafc', p('M37 27L41 14L46 25L50 11L54 25L59 14L63 27Z', DK) + both(e(26, 31, 6, 11, '#f8fafc', -30) + e(24, 25, 3.4, 5, DK, -30)),
        both(s('M20 46q8 3 11 11M19 58q7 1 10 7M36 30q4 4 4 11', DK, 3.2)) + e(50, 72, 16, 12, '#a1a1aa') + c(45, 72, 1.9, DK) + c(55, 72, 1.9, DK) + eyes(54, 12) + s('M46 79q4 2 8 0', DK, 2)],
      ['monster-27', 'Capybara', '#b98b5e', both(c(28, 31, 5, '#8b5e34')) + c(50, 23, 7, '#fb923c') + p('M50 16q4-5 8-2q-4 3-8 2Z', '#22c55e'),
        e(50, 70, 17, 12, '#a0714a') + e(45, 66, 2, 1.4, DK) + e(55, 66, 2, 1.4, DK) + s('M33 52q5 3 10 0M57 52q5 3 10 0', DK, 2.6) + s('M46 76q4 2 8 0', DK, 2) + cheeks(60, 22),
        '<rect x="20" y="27" width="60" height="60" rx="27" fill="G"/>'],
      ['monster-28', 'Flamingo', '#f9a8d4', p('M48 26q-6-10 2-17q2 8 6 4q0 8-4 13Z', '#f472b6'),
        p('M46 62Q58 58 62 70Q60 80 52 80Q56 72 46 68Z', '#fde4f0') + p('M56 77Q60 75 62 70Q61 80 52 80Z', DK) + eyes(52, 12) + cheeks(63, 22)],
      ['monster-29', 'Puppy', '#f5d0a9', '',
        e(23, 54, 9, 19, '#a16207', 15) + e(77, 54, 9, 19, '#a16207', -15) + e(62, 49, 9, 8, '#d6a26a') + eyes(52, 11) + e(50, 62, 5, 3.6, DK) + s('M44 66q3 3 6 0q3 3 6 0', DK, 2.4) + e(50, 72, 4, 5, '#fb7185') + cheeks(64, 20)],
      ['monster-30', 'Kitten', '#fdba74', both(p('M20 42L22 13L44 30Z', '#fb923c') + p('M25 36L26 21L37 29Z', '#fbcfe8')),
        s('M44 30l2 8M50 28v9M56 30l-2 8', '#ea580c', 2.6) + eyes(54, 12) + p('M47.5 62h5l-2.5 3z', '#f472b6') + wm(66) + both(s('M18 61L34 63M18 67L34 66', '#9a3412', 1.4)) + cheeks(67, 21)],
      ['monster-31', 'Owl', '#8b5e3c', both(p('M22 34L20 13L37 28Z', '#6b4423')),
        c(38, 52, 12, '#f5e6d3') + c(62, 52, 12, '#f5e6d3') + eye(38, 52, 1.3) + eye(62, 52, 1.3) + p('M46 61L54 61L50 69Z', '#f59e0b') + s('M36 78q4 4 8 0M48 80q4 4 8 0M44 73q4 4 8 0', '#6b4423', 1.8)],
      ['monster-32', 'Tiger', '#fb923c', both(c(26, 31, 8, '#fb923c') + c(26, 31, 4, '#fff7ed')),
        s('M50 25v9M43 27l3 7M57 27l-3 7', DK, 3) + both(s('M19 52h8M20 60h7', DK, 3)) + e(43, 70, 8, 6, '#fff7ed') + e(57, 70, 8, 6, '#fff7ed') + p('M46 63h8l-4 4z', '#f472b6') + eyes(53, 12) + s('M46 74q4 3 8 0', DK, 2)],
      ['monster-33', 'Hippo', '#c4b5fd', both(c(28, 28, 6, '#a78bfa')),
        e(50, 72, 24, 15, '#ddd6fe') + e(42, 68, 2.4, 3, '#7c3aed') + e(58, 68, 2.4, 3, '#7c3aed') + eyes(46, 12) + s('M40 78q10 6 20 0', DK, 2.4) + cheeks(56, 24), e(50, 56, 32, 30, 'G')],
      ['monster-34', 'Elephant', '#93c5fd', both(e(15, 52, 16, 20, '#7cb4f0') + e(15, 52, 10, 14, '#fbcfe8')),
        s('M50 60Q50 80 58 82Q63 82 62 77', '#7cb4f0', 10) + eyes(51, 13) + cheeks(62, 22)],
      ['monster-35', 'Sloth', '#d6c3a5', '',
        e(50, 58, 25, 20, '#f5ebdc') + e(38, 56, 8, 5, '#6b4f35', 25) + e(62, 56, 8, 5, '#6b4f35', -25) + c(39, 55, 2.6, DK) + c(61, 55, 2.6, DK) + c(40, 54, 1, '#fff') + c(62, 54, 1, '#fff') + e(50, 64, 4, 3, DK) + smile(70, 5)],
      ['monster-36', 'Frog', '#4ade80', both(c(34, 37, 12, 'G') + c(34, 36, 8, '#fff') + eye(34, 37, .9)),
        s('M30 67Q50 81 70 67', DK, 2.8) + cheeks(67, 27, '#f472b6') + c(46, 57, 1.2, DK) + c(54, 57, 1.2, DK), e(50, 62, 33, 26, 'G')],
      ['monster-37', 'Hamster', '#fcd9a8', both(c(28, 30, 7, '#f4b183') + c(28, 30, 3.6, '#fbcfe8')),
        e(30, 68, 12, 10, '#fff7ed') + e(70, 68, 12, 10, '#fff7ed') + eyes(54, 12) + c(50, 63, 2.6, '#f472b6') + wm(66) + '<rect x="47.8" y="68.6" width="4.4" height="4" rx="1" fill="#fff" stroke="#e8d3b6" stroke-width=".6"/>' + cheeks(66, 22)],
      ['monster-38', 'Raccoon', '#9ca3af', both(p('M22 38L24 15L42 28Z', '#6b7280') + p('M26 33L27 21L36 28Z', '#f3f4f6')),
        both(e(36, 42, 6, 2.5, '#f3f4f6')) + p('M19 52Q30 42 44 50Q50 54 56 50Q70 42 81 52Q76 63 62 60Q50 58 38 60Q24 63 19 52Z', DK) + c(36, 53, 6, '#fff') + eye(36, 53, .85) + c(64, 53, 6, '#fff') + eye(64, 53, .85) + e(50, 70, 13, 9, '#f3f4f6') + e(50, 66, 4, 3, DK) + smile(72, 3.5)],
      // the monsters (Monsters, Inc. spirit — furry, horned, one-eyed, all friendly)
      ['monster-39', 'Big Blue', '#60a5fa', both(p('M30 30Q23 16 31 11Q32 22 38 26Z', '#e9d5ff')),
        c(30, 43, 5, '#a78bfa') + c(70, 40, 4, '#a78bfa') + c(26, 66, 3.6, '#a78bfa') + c(73, 68, 5, '#a78bfa') + c(58, 30, 3, '#a78bfa') + eyes(52, 11) + p('M36 64Q50 82 64 64Z', '#3b0764') + p('M40 64.5l3 4.2l3-4.2ZM54 64.5l3 4.2l3-4.2Z', '#fff') + cheeks(62, 22)],
      ['monster-40', 'One-Eye Green', '#84cc16', both(p('M33 29L29 15L41 24Z', '#f8fafc')),
        c(50, 50, 15, '#fff') + c(50, 51, 9, '#22c55e') + c(50, 51, 5, DK) + c(53, 47.5, 2.4, '#fff') + s('M34 70Q50 83 66 70', DK, 3) + cheeks(70, 24), e(50, 58, 33, 31, 'G')],
      ['monster-41', 'Purple Slug', '#a855f7', both(s('M41 30L34 12', '#7e22ce', 3) + c(34, 11, 4.4, '#f0abfc')),
        eye(40, 54) + eye(60, 54) + both(p('M35 51q5-7 10 0Z', '#9333ea')) + smile(67, 6) + cheeks(64, 21),
        p('M17 84C17 42 30 27 50 27C70 27 83 42 83 84Z', 'G')],
      ['monster-42', 'Pink Fluff', '#f9a8d4', ring(16, 31, 8, '#f9a8d4') + p('M58 24l8-6v12zM74 24l-8-6v12z', '#a78bfa') + c(66, 24, 3, '#c4b5fd'),
        eyes(53, 11, 1.1) + open(64, 6, 6) + cheeks(62, 21, '#ec4899')],
      ['monster-43', 'Yellow Spiky', '#facc15', p('M26 34L30 15L38 30L44 11L50 28L56 11L62 30L70 15L74 34Z', '#f59e0b'),
        eye(38, 54, .9) + eye(50, 47, .9) + eye(62, 54, .9) + smile(67, 6) + cheeks(65, 22)],
      ['monster-44', 'Orange Two-Horn', '#fb923c', both(s('M31 34Q18 26 22 14Q28 11 29 19', '#fde68a', 6)),
        both(c(33, 63, 1.2, '#c2410c') + c(36, 66, 1.2, '#c2410c') + c(31, 67, 1.2, '#c2410c')) + eyes(53, 11) + smile(66, 7) + p('M53 67.5l2 5l2-5Z', '#fff')],
      ['monster-45', 'Teal Tentacle', '#2dd4bf', s('M40 29q-5-10 2-17', '#0d9488', 5) + s('M50 26q0-12 6-16', '#0d9488', 5) + s('M60 29q5-10-2-17', '#0d9488', 5),
        c(50, 52, 12.5, '#fff') + eye(50, 52, 1.45) + smile(69, 5) + cheeks(66, 23)],
      ['monster-46', 'Red Fuzzy', '#f87171', ring(18, 31, 7, '#f87171') + both(p('M34 25L31 13L40 21Z', '#fff7ed')),
        eyes(53, 12, 1.15) + open(65, 5, 5) + cheeks(63, 22, '#dc2626')],
      ['monster-47', 'Lime Antenna', '#a3e635', both(s('M42 29L37 12', DK, 2.6) + c(37, 10, 5, '#fde047') + c(37, 10, 8, 'rgba(253,224,71,.35)')),
        eyes(54, 11) + smile(66, 6) + '<rect x="48" y="69" width="4" height="4.2" rx=".8" fill="#fff"/>' + cheeks(64, 22)],
      ['monster-48', 'Lavender Three-Eye', '#c4b5fd', both(p('M32 28L30 16L39 25Z', '#7c3aed')),
        eye(38, 57) + eye(62, 57) + eye(50, 43) + open(67, 6, 6) + cheeks(68, 23)],
      ['monster-49', 'Cloud Puff', '#e0f2fe', '',
        happy(57, 10) + smile(65, 3) + cheeks(63, 19, '#f9a8d4'),
        c(31, 61, 18, 'G') + c(50, 47, 22, 'G') + c(69, 61, 18, 'G') + c(50, 67, 22, 'G')],
      ['monster-50', 'Stripey Snaggletooth', '#8b5cf6', both(p('M28 32L24 13L38 26Z', '#fde68a')),
        both(s('M20 46q8-2 12 4M22 66q8-2 10 4', '#6d28d9', 4)) + eyes(52, 11) + smile(68, 7) + p('M45 70.5l2 6l2-6Z', '#fff') + cheeks(64, 23)]
    ];
    // outfits, drawn over any avatar (the head is about 33 across, its top near y 23, the eyes near y 54)
    var WEAR = [
      ['party', 'Party Hat', 20, p('M39 27L50 1L61 27Z', '#a78bfa') + s('M44 19l9-4M42 24l14-6M47 12l5-2', '#f9a8d4', 2.4) + c(50, 2, 4.4, '#f9a8d4')],
      ['bow', 'Bow', 20, '<g transform="translate(16 2)">' + p('M50 22L35 13L35 31Z', '#f472b6') + p('M50 22L65 13L65 31Z', '#f472b6') + c(50, 22, 4.4, '#ec4899') + '</g>'],
      ['flower', 'Flower', 20, ring(6, 5.4, 4.2, '#fde047', 68, 24) + c(68, 24, 3.6, '#f97316')],
      ['beanie', 'Beanie', 25, p('M27 31Q27 8 50 8Q73 8 73 31Z', '#38bdf8') + s('M36 14v14M44 10v18M52 10v18M60 12v16', '#7dd3fc', 2) + '<rect x="25" y="26" width="50" height="8" rx="4" fill="#0ea5e9"/>' + c(50, 7, 5.4, '#f0f9ff')],
      ['glasses', 'Glasses', 25, '<circle cx="39" cy="54" r="8" fill="rgba(255,255,255,.18)" stroke="#1f2937" stroke-width="2.4"/><circle cx="61" cy="54" r="8" fill="rgba(255,255,255,.18)" stroke="#1f2937" stroke-width="2.4"/>' + s('M47 53q3-2 6 0M31 52l-9-3M69 52l9-3', '#1f2937', 2.4)],
      ['shades', 'Sunglasses', 35, '<rect x="28" y="47" width="20" height="13" rx="5.5" fill="#111827"/><rect x="52" y="47" width="20" height="13" rx="5.5" fill="#111827"/>' + s('M48 51h4M28 50l-7-2M72 50l7-2', '#111827', 2.6) + p('M31 50l6 0-4 6z', 'rgba(255,255,255,.35)') + p('M55 50l6 0-4 6z', 'rgba(255,255,255,.35)')],
      ['phones', 'Headphones', 40, s('M18 54Q18 15 50 15Q82 15 82 54', '#334155', 5) + '<rect x="11" y="45" width="11" height="19" rx="5.5" fill="#ef4444"/><rect x="78" y="45" width="11" height="19" rx="5.5" fill="#ef4444"/>'],
      ['tophat', 'Top Hat', 50, '<rect x="37" y="2" width="26" height="22" rx="3" fill="#1f2937"/><rect x="37" y="15" width="26" height="5" fill="#ef4444"/><rect x="27" y="22" width="46" height="6" rx="3" fill="#111827"/>'],
      ['crown', 'Crown', 60, p('M33 25L36 9L44 18L50 5L56 18L64 9L67 25Z', '#facc15', ' stroke="#f59e0b" stroke-width="1.4" stroke-linejoin="round"') + '<rect x="33" y="22" width="34" height="7" rx="2.5" fill="#f59e0b"/>' + c(50, 25.5, 2.2, '#ef4444') + c(40, 25.5, 1.6, '#38bdf8') + c(60, 25.5, 1.6, '#22c55e')],
      ['pirate', 'Pirate Hat', 60, p('M22 29Q50 -2 78 29Q50 22 22 29Z', '#1f2937') + c(50, 17, 4.4, '#f8fafc') + s('M45 23l10-3M45 20l10 3', '#f8fafc', 1.6)],
      ['grad', 'Grad Cap', 80, '<rect x="38" y="20" width="24" height="9" rx="2" fill="#1f2937"/>' + p('M22 19L50 8L78 19L50 30Z', '#111827') + s('M50 19L71 22V34', '#facc15', 1.8) + c(71, 35, 2.6, '#facc15')],
      ['halo', 'Halo', 100, '<ellipse cx="50" cy="12" rx="18" ry="5" fill="none" stroke="#fef08a" stroke-width="5" opacity=".45"/><ellipse cx="50" cy="12" rx="18" ry="5" fill="none" stroke="#fde047" stroke-width="2.6"/>']
    ];
    var WBY = {}; WEAR.forEach(function (w) { WBY[w[0]] = w; });
    var BY = {}; L.forEach(function (a) { BY[a[0]] = a; });
    function svg(id, wear) {
      var a = BY[String(id)] || L[0], gid = 'mnav-' + a[0], G = 'url(#' + gid + ')', col = a[2];
      var headSvg = (a[5] || c(50, 56, 33, 'G')).replace(/"G"/g, '"' + G + '"');
      return '<svg class="mlv-monster" viewBox="0 0 100 100" role="img" aria-label="' + a[1] + '"><defs><radialGradient id="' + gid + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + shade(col, .28) + '"/><stop offset=".62" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.14) + '"/></radialGradient></defs>' +
        e(50, 95, 24, 3.4, 'rgba(25,18,55,.2)') + a[3].replace(/"G"/g, '"' + G + '"') + headSvg + p('M29 37q9-13 25-11q-15 4-22 16z', 'rgba(255,255,255,.3)') + a[4] + (wear && WBY[wear] ? WBY[wear][3] : '') + '</svg>';
    }
    var names = {}; L.forEach(function (a) { names[a[0]] = a[1]; });
    return { svg: svg, names: names, ids: L.map(function (a) { return a[0]; }), wear: WEAR.map(function (w) { return { id: w[0], name: w[1], cost: w[2] }; }) };
  })();
  var CARDS = [
    ['monster-sunny', 'Sunny Sea Otter', 'common', 'cash'], ['monster-berry', 'Berry Penguin', 'common', 'guard'], ['monster-mint', 'Mint Turtle', 'common', 'bonus'], ['monster-sky', 'Sky Dolphin', 'common', 'streak'],
    ['monster-lilac', 'Lilac Bunny', 'rare', 'bonus'], ['monster-coral', 'Coral Fox', 'rare', 'cash'], ['monster-lime', 'Lime Panda', 'epic', 'guard'], ['monster-night', 'Night Lion', 'legendary', 'streak'],
    ['strike-3', '3-Day Strike', 'common', 'cash'], ['strike-7', '7-Day Strike', 'common', 'guard'], ['perfect-week', 'Perfect Week', 'common', 'bonus'],
    ['minion-stuart', 'Stuart', 'common', 'streak'], ['pikachu', 'Pikachu', 'common', 'cash'],
    ['strike-14', '14-Day Emerald Strike', 'rare', 'bonus'], ['strike-30', '30-Day Strike', 'rare', 'cash'], ['strike-40', '40-Day Strike', 'rare', 'guard'],
    ['lucy-axolotl', 'Lucy the Axolotl', 'rare', 'streak'], ['archimedes-owl', 'Archimedes Owl', 'rare', 'bonus'],
    ['strike-50', '50-Day Strike', 'epic', 'cash'], ['strike-60', '60-Day Strike', 'epic', 'guard'], ['octopus-polymath', 'Octopus Polymath', 'epic', 'bonus'], ['sith-lightsaber', 'Lightsaber', 'epic', 'streak'],
    ['strike-80', '80-Day Strike', 'legendary', 'guard'], ['ender-dragon', 'Ender Dragon', 'legendary', 'cash'], ['study-streak-365', '365-Day Study Streak', 'legendary', 'streak'],
    ['strike-90', '90-Day Strike', 'mythic', 'bonus'], ['strike-100', '100-Day Strike', 'mythic', 'cash']
  ].map(function (a) {
    var m = /^strike-(\d+)$/.exec(a[0]);
    return { id: a[0], name: a[1], r: a[2], perk: a[3], monster: /^monster-/.test(a[0]), img: m ? BADGE_BASE + 'hd/strike-' + m[1] + '-days.webp' : BADGE_BASE + a[0] + '.webp' };
  });
  ['Seal', 'Clownfish', 'Koala', 'Giraffe', 'Red Panda', 'Sea Lion', 'Starfish', 'Zebra', 'Axolotl', 'Narwhal', 'Arctic Fox', 'Capybara', 'Jellyfish', 'Flamingo', 'Puppy', 'Butterfly', 'Sea Horse', 'Tiger', 'Puffin', 'Dolphin', 'Sloth', 'Octopus', 'Meerkat', 'Blue Whale', 'Lemur', 'Coral Fish', 'Hippo', 'Toucan', 'Manatee', 'Cheetah', 'Frog', 'Penguin', 'Otter', 'Parrot', 'Sea Turtle', 'Panda', 'Bunny', 'Shark', 'Elephant', 'Kitten', 'Walrus', 'Lion Cub'].map(function (name, i) { return i >= 30 ? ['Fuzzy Cloud', 'Glowbug', 'One-Eye Sprout', 'Blue Puff', 'Tumble Monster', 'Mossy Friend', 'Button-Eye', 'Moon Fuzz', 'Berry Blob', 'Tiny Tangle', 'Cuddle Creature', 'Star Puff'][i - 30] : name; }).forEach(function (name, i) { CARDS.splice(8 + i, 0, { id: 'monster-' + String(i + 9).padStart(2, '0'), name: name, r: i < 20 ? 'common' : i < 34 ? 'rare' : 'epic', perk: ['cash', 'guard', 'bonus', 'streak'][i % 4], monster: true, img: '' }); });
  CARDS.forEach(function (c) { if (c.monster && MNAV.names[c.id]) c.name = MNAV.names[c.id]; });   // the new animals' names
  var STARTER_MONSTERS = CARDS.filter(function (c) { return c.monster; }).map(function (c) { return c.id; });
  var MONSTER_THEMES = [
    { body: '#ff7a90', belly: '#ffd166', accent: '#ff477e', horn: '#7c3aed' },
    { body: '#ffad66', belly: '#fff1b8', accent: '#ef476f', horn: '#2563eb' },
    { body: '#54d6b1', belly: '#d9f99d', accent: '#0f766e', horn: '#f59e0b' },
    { body: '#66b7ff', belly: '#dbeafe', accent: '#2563eb', horn: '#f472b6' },
    { body: '#b794f4', belly: '#f5d0fe', accent: '#7c3aed', horn: '#fbbf24' },
    { body: '#ff8f70', belly: '#ffe4e6', accent: '#e11d48', horn: '#14b8a6' },
    { body: '#a3e635', belly: '#ecfccb', accent: '#4d7c0f', horn: '#f97316' },
    { body: '#6478d8', belly: '#c7d2fe', accent: '#312e81', horn: '#f9a8d4' }
  ];
  function monsterSvg(id) { return MNAV.svg(id); }   // tools/web31/avatars.js
  function iconHtml(c, cls) { return c && c.monster ? monsterSvg(c.id) : '<img class="' + (cls || 'mlv-avi') + '" src="' + c.img + '" alt="" loading="lazy">'; }
  // an avatar: a badge/monster id → its image, anything else (an emoji) as text
  function avHtml(v) { var parts = String(v || '').split('~'), c = CARDS.filter(function (x) { return x.id === parts[0]; })[0]; return c ? (c.monster ? MNAV.svg(c.id, parts[1]) : iconHtml(c, 'mlv-avi')) : esc(v || '🙂'); }
  // every badge this player ever opened (any game, and the chests while waiting) — kept in this browser
  var ALBUM_KEY = 'minest.live.album.v1';
  function albumMap() { try { return JSON.parse(localStorage.getItem(ALBUM_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function albumAdd(id) { var m = albumMap(); m[id] = (m[id] || 0) + 1; try { localStorage.setItem(ALBUM_KEY, JSON.stringify(m)); } catch (e) {} return m[id]; }
  function cardById(id) { return CARDS.filter(function (c) { return c.id === id; })[0]; }
  function perkText(c, lv) {
    var R = RAR[c.r]; lv = lv || 1;
    return c.perk === 'streak' ? 'Start each level at 🔥' + (R.st * lv) : '+' + (c.perk === 'bonus' ? R.p * 2 : R.p) * lv + '% ' + PERK[c.perk];
  }
  // chests: the Pet Raising treasure chest, in three woods
  var PACKS = {
    wood: { name: 'Wooden Chest', bg: 'linear-gradient(160deg,#8a5a2b,#3b2410)', plank: ['#b98552', '#e0b27c', '#8f6236'], lid: ['#e6bf8c', '#c18f58', '#8f6236'], under: '#6b4523', glow: '255,220,120', price: function (e) { return Math.max(40, e * 12); }, odds: [62, 26, 9, 2.6, 0.4] },
    silver: { name: 'Silver Chest', bg: 'linear-gradient(160deg,#64748b,#1e293b)', plank: ['#aebed6', '#d3deee', '#93a4c0'], lid: ['#dbe5f3', '#b4c3db', '#8e9fbd'], under: '#6f7f9e', glow: '180,220,255', price: function (e) { return Math.max(400, e * 90); }, odds: [25, 42, 24, 7.5, 1.5] },
    gold: { name: 'Golden Chest', bg: 'linear-gradient(160deg,#f59e0b,#7c2d12)', plank: ['#f0c35a', '#ffe9a6', '#c38a22'], lid: ['#fff0b8', '#f2c75c', '#c38a22'], under: '#9a6a12', glow: '255,200,90', price: function (e) { return Math.max(4000, e * 700); }, odds: [0, 30, 42, 22, 6] }
  };
  // ---- the chest, drawn on a canvas (from octopus-pet-raising-v6/chest-v1.js)
  function chestScene(canvas, tier, still) {
    var P = PACKS[tier] || PACKS.wood, c = canvas.getContext('2d'), TAU = Math.PI * 2;
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W = canvas.clientWidth || 300, H = canvas.clientHeight || 300;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    var st = { open: 0, target: 0, wiggle: 0, sparks: [], t0: performance.now(), dead: false, x: W / 2, y: H * (still ? .9 : .84), s: Math.min(W * .62, H * (still ? .9 : .5)) };
    function R(a, b) { return a + (b - a) * Math.random(); }
    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function rr(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function draw(now) {
      var s = st.s, t = (now - st.t0) / 1000, open = st.open;
      c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
      var wig = Math.sin(t * 40) * st.wiggle * .08; st.wiggle *= .92;
      var bw = s, bh = s * .5, lh = s * .3, x0 = st.x - bw / 2, y1 = st.y, y0 = y1 - bh;
      c.fillStyle = 'rgba(0,10,20,.35)'; c.beginPath(); c.ellipse(st.x, st.y + s * .02, bw * .62, s * .07, 0, 0, TAU); c.fill();
      c.save(); c.translate(st.x, y1); c.rotate(wig); c.translate(-st.x, -y1);
      if (!still) {
        var pulse = .55 + .45 * Math.sin(t * 2.6), AR = Math.min(s * 1.1, W / 2, y0), ag = c.createRadialGradient(st.x, y0, 4, st.x, y0, AR);
        ag.addColorStop(0, 'rgba(' + P.glow + ',' + (.35 * pulse * (1 - open)) + ')'); ag.addColorStop(1, 'rgba(' + P.glow + ',0)');
        c.fillStyle = ag; c.beginPath(); c.arc(st.x, y0, AR, 0, TAU); c.fill();
      }
      if (open > .05) {
        c.save(); c.globalCompositeOperation = 'lighter';
        var L = Math.min(s * (1.6 + open * .9), y0 * .96, W / 2 / .78);   // the light fades out inside the canvas
        for (var i = 0; i < 9; i++) {
          var a = -Math.PI / 2 + (i - 4) * .2 + Math.sin(t * .8 + i) * .05, g = c.createLinearGradient(st.x, y0, st.x + Math.cos(a) * L, y0 + Math.sin(a) * L);
          g.addColorStop(0, 'rgba(' + P.glow + ',' + (.45 * open) + ')'); g.addColorStop(1, 'rgba(' + P.glow + ',0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(st.x - bw * .3, y0);
          c.lineTo(st.x + Math.cos(a - .07) * L, y0 + Math.sin(a - .07) * L); c.lineTo(st.x + Math.cos(a + .07) * L, y0 + Math.sin(a + .07) * L);
          c.lineTo(st.x + bw * .3, y0); c.closePath(); c.fill();
        }
        var HR = Math.min(s * .9, W / 2, y0), hg = c.createRadialGradient(st.x, y0, 2, st.x, y0, HR);
        hg.addColorStop(0, 'rgba(255,245,200,' + (.85 * open) + ')'); hg.addColorStop(1, 'rgba(' + P.glow + ',0)');
        c.fillStyle = hg; c.beginPath(); c.arc(st.x, y0, HR, 0, TAU); c.fill();
        c.restore();
      }
      var gold = c.createLinearGradient(0, y0 - lh, 0, y1); gold.addColorStop(0, '#fbe6a2'); gold.addColorStop(.5, '#d9a945'); gold.addColorStop(1, '#9c6c1e');
      var plank = c.createLinearGradient(x0, 0, x0 + bw, 0); plank.addColorStop(0, P.plank[0]); plank.addColorStop(.4, P.plank[1]); plank.addColorStop(1, P.plank[2]);
      rr(x0, y0, bw, bh, s * .05); c.fillStyle = plank; c.fill();
      c.strokeStyle = 'rgba(40,30,30,.25)'; c.lineWidth = 1;
      for (var q0 = 1; q0 < 4; q0++) { c.beginPath(); c.moveTo(x0 + 3, y0 + bh * q0 / 4); c.lineTo(x0 + bw - 3, y0 + bh * q0 / 4); c.stroke(); }
      var shade = c.createLinearGradient(0, y0, 0, y1); shade.addColorStop(0, 'rgba(255,255,255,.12)'); shade.addColorStop(1, 'rgba(30,20,40,.3)');
      rr(x0, y0, bw, bh, s * .05); c.fillStyle = shade; c.fill();
      c.fillStyle = gold;
      [.08, .92].forEach(function (f) { rr(x0 + bw * f - s * .045, y0 - 1, s * .09, bh + 1, s * .015); c.fill(); });
      [.3, .7].forEach(function (f) { rr(x0 + bw * f - s * .03, y0, s * .06, bh, s * .01); c.fill(); });
      rr(x0 - 1, y1 - s * .07, bw + 2, s * .07, s * .02); c.fill();
      c.fillStyle = '#fff3c4'; [.08, .92].forEach(function (f) { for (var rv = 0; rv < 3; rv++) { c.beginPath(); c.arc(x0 + bw * f, y0 + bh * (.18 + rv * .3), s * .012, 0, TAU); c.fill(); } });
      if (open > .05) {
        var ig = c.createLinearGradient(0, y0 - s * .05, 0, y0 + s * .08); ig.addColorStop(0, 'rgba(255,244,190,' + open + ')'); ig.addColorStop(1, 'rgba(200,140,60,' + open + ')');
        c.fillStyle = ig; c.beginPath(); c.ellipse(st.x, y0, bw * .46, s * .065 * open + 1, 0, 0, TAU); c.fill();
      }
      var lift = ease(open), ly = y0 - lift * lh * 1.2, ltop = ly - lh * (1 - lift * 1.55);
      c.beginPath(); c.moveTo(x0, ly); c.lineTo(x0 + bw, ly); c.bezierCurveTo(x0 + bw, ltop, x0, ltop, x0, ly); c.closePath();
      if (ltop > ly) { c.fillStyle = P.under; c.fill(); }
      else {
        var lg = c.createLinearGradient(x0, ltop, x0 + bw, ly); lg.addColorStop(0, P.lid[0]); lg.addColorStop(.6, P.lid[1]); lg.addColorStop(1, P.lid[2]);
        c.fillStyle = lg; c.fill();
        c.save(); c.clip(); c.fillStyle = gold;
        [.08, .92].forEach(function (f) { c.fillRect(x0 + bw * f - s * .045, ltop - 2, s * .09, ly - ltop + 4); });
        [.3, .7].forEach(function (f) { c.fillRect(x0 + bw * f - s * .03, ltop - 2, s * .06, ly - ltop + 4); });
        c.restore();
        c.fillStyle = gold; rr(x0 - 1, ly - s * .035, bw + 2, s * .045, s * .015); c.fill();
      }
      var lx = st.x, lyk = y0 + s * .1;
      c.fillStyle = gold; rr(lx - s * .07, lyk - s * .06, s * .14, s * .16, s * .03); c.fill();
      c.fillStyle = '#4a3410'; c.beginPath(); c.arc(lx, lyk + s * .005, s * .022, 0, TAU); c.fill(); c.beginPath(); c.moveTo(lx - s * .012, lyk + s * .01); c.lineTo(lx + s * .012, lyk + s * .01); c.lineTo(lx + s * .02, lyk + s * .07); c.lineTo(lx - s * .02, lyk + s * .07); c.closePath(); c.fill();
      c.restore();
      if (!still) {
        if (open < .3 && Math.random() < .12) st.sparks.push({ x: st.x + R(-bw * .5, bw * .5), y: y0 + R(-s * .2, bh * .6), vx: 0, vy: -R(6, 14), life: 0, max: R(.8, 1.4), r: R(1.5, 3) });
        if (open > .3 && Math.random() < .7) st.sparks.push({ x: st.x + R(-bw * .3, bw * .3), y: y0, vx: R(-40, 40), vy: -R(50, 130), life: 0, max: R(.9, 1.8), r: R(1.5, 3.5) });
        c.globalCompositeOperation = 'lighter';
        for (var j = st.sparks.length - 1; j >= 0; j--) {
          var sp = st.sparks[j]; sp.life += 1 / 60; if (sp.life > sp.max) { st.sparks.splice(j, 1); continue; }
          sp.x += sp.vx / 60; sp.y += sp.vy / 60; sp.vy += 12 / 60;
          var al = 1 - sp.life / sp.max;
          c.fillStyle = 'rgba(255,236,160,' + al + ')'; c.beginPath(); c.arc(sp.x, sp.y, sp.r, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,' + al * .8 + ')'; c.fillRect(sp.x - sp.r * 2, sp.y - .5, sp.r * 4, 1); c.fillRect(sp.x - .5, sp.y - sp.r * 2, 1, sp.r * 4);
        }
        c.globalCompositeOperation = 'source-over';
      }
    }
    function loop(now) { if (st.dead || !canvas.isConnected && now - st.t0 > 1000) return; st.open += (st.target - st.open) * (st.target > st.open ? .08 : .05); draw(now); if (!still) requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
    return { open: function () { st.target = 1; }, shake: function () { st.wiggle = 1; }, stop: function () { st.dead = true; } };
  }
  // the reveal: tap the chest → it shakes, the lid opens, light pours out, the badge rises
  function showChest(tier, c, o) {
    ensureCss();
    var Rr = RAR[c.r], ti = RORDER.indexOf(c.r);
    var ov = document.createElement('div'); ov.className = 'mlv-open';
    ov.innerHTML = '<div class="mlv-chestbox"><canvas></canvas><div class="mlv-rise" style="--g:' + Rr.g + '"><div class="rays"></div>' + iconHtml(c, 'mlv-avi') + '</div></div>' +
      '<div class="hint">TAP THE CHEST</div><div class="mlv-binfo" style="--c:' + Rr.c + '"></div>';
    document.body.appendChild(ov);
    OCTO.place('stage'); OCTO.act('look', 'Ooh, a chest!', 1400);
    var sc = chestScene($(ov, 'canvas'), tier), opened = false;
    function reveal() {
      if (opened) return; opened = true;
      $(ov, '.hint').textContent = '';
      sc.shake(); beep('buy'); setTimeout(function () { sc.shake(); beep('buy'); }, 380);
      setTimeout(function () { sc.open(); beep('good'); var f = document.createElement('div'); f.className = 'flash'; ov.appendChild(f); }, 760);
      setTimeout(function () {
        $(ov, '.mlv-rise').classList.add('go');
        for (var i = 0, n = [14, 24, 40, 64, 90][ti]; i < n; i++) {
          var sp = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 120 + Math.random() * (180 + ti * 60);
          sp.className = 'mlv-spark'; sp.style.setProperty('--c', ['#fde047', '#fff', Rr.g.replace(/[\d.]+\)$/, '1)')][i % 3]);
          sp.style.setProperty('--x', Math.cos(a) * d + 'px'); sp.style.setProperty('--y', Math.sin(a) * d + 'px'); sp.style.animationDelay = (Math.random() * .3) + 's';
          ov.appendChild(sp);
        }
      }, 1000);
      setTimeout(function () {
        var inf = $(ov, '.mlv-binfo');
        inf.innerHTML = '<em>' + Rr.name.toUpperCase() + '</em><b>' + esc(c.name) + '</b>' + (o.perk ? '<small>' + o.perk + '</small>' : '') + '<div class="tag">' + esc(o.tag || '') + '</div>' +
          '<div class="mlv-row">' + (o.onAgain ? '<button class="mlv-btn" data-again' + (o.againOff ? ' disabled' : '') + '>' + esc(o.againLabel || 'Open another') + '</button>' : '') +
          (o.onEquip ? '<button class="mlv-btn alt" data-eq>Use as avatar</button>' : '') + '<button class="mlv-btn alt" data-ok>Done</button></div>';
        inf.classList.add('go');
        beep(ti >= 3 ? 'win' : 'good'); if (ti >= 3) { setTimeout(function () { beep('win'); }, 260); burstConfetti(ti === 4 ? 140 : 80); }
        OCTO.cheer(ti >= 2); OCTO.act(null, ti >= 3 ? 'WOW! ' + Rr.name + '!' : 'Nice badge!', 1800);
        var done = function () { sc.stop(); ov.remove(); };
        $(inf, '[data-ok]').onclick = function () { done(); if (o.onDone) o.onDone(); };
        var ag = $(inf, '[data-again]'); if (ag) ag.onclick = function () { done(); o.onAgain(); };
        var eq = $(inf, '[data-eq]'); if (eq) eq.onclick = function () { o.onEquip(); eq.remove(); };
      }, 1900);
    }
    $(ov, '.mlv-chestbox').onclick = reveal;
    setTimeout(reveal, 2200);   // opens by itself if nobody taps
  }
  function burstConfetti(n) {
    var cols = ['#86efac', '#fde047', '#c4b5fd', '#f9a8d4', '#7dd3fc', '#fdba74'];
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i'); d.className = 'mlv-conf';
      d.style.left = (Math.random() * 100) + 'vw'; d.style.background = cols[i % cols.length];
      d.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); d.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      d.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; d.style.animationDelay = (Math.random() * .5) + 's';
      document.body.appendChild(d); (function (x) { setTimeout(function () { x.remove(); }, 3800); })(d);
    }
  }
  // the album: every badge this browser has opened
  function showAlbum() {
    ensureCss();
    var m = albumMap(), have = CARDS.filter(function (c) { return m[c.id]; }).length;
    var ov = document.createElement('div'); ov.className = 'mlv-open mlv-album';
    ov.innerHTML = '<div class="mlv-albumbox"><div class="mlv-row" style="margin-top:0;justify-content:space-between"><h2 style="margin:0">🏅 My badges · ' + have + '/' + CARDS.length + '</h2><button class="mlv-btn alt" data-ok>Close</button></div>' +
      '<p class="mlv-note">Win badges from chests — while you wait, and in the game. Tap one to make it your avatar.</p><div class="mlv-coll">' +
      CARDS.slice().sort(function (a, b) { return RORDER.indexOf(b.r) - RORDER.indexOf(a.r); }).map(function (c) {
        var R = RAR[c.r], n = m[c.id] || 0, eq = localAv() === c.id;
        return '<button type="button" class="mlv-mini' + (n ? '' : ' no') + (eq ? ' eq' : '') + '" data-b="' + c.id + '" style="--c:' + R.c + ';--g:' + R.g + '"' + (n ? '' : ' disabled') + '><span class="rb">' + R.name + '</span>' + (n > 1 ? '<span class="lvb">×' + n + '</span>' : '') +
          iconHtml(c, 'mlv-card-icon') + '<b>' + (n ? esc(c.name) : '???') + '</b></button>';
      }).join('') + '</div></div>';
    document.body.appendChild(ov);
    $(ov, '[data-ok]').onclick = function () { ov.remove(); };
    $$(ov, '[data-b]').forEach(function (b) { b.onclick = function () { localAv(b.getAttribute('data-b')); ov.remove(); showAlbum(); beep('buy'); }; });
  }
  function localAv(v) { try { if (v) localStorage.setItem('minest.live.av', v); return localStorage.getItem('minest.live.av') || ''; } catch (e) { return v || ''; } }
  // a chest while waiting (no game): the badge goes to the album
  function openChestFree(tier, cb) {
    var c = pull(tier), n = albumAdd(c.id);
    if (!localAv()) localAv(c.id);
    showChest(tier, c, { tag: n > 1 ? 'You have ×' + n : 'NEW BADGE!', onEquip: localAv() !== c.id ? function () { localAv(c.id); } : null, onDone: cb });
  }
  function pull(pk) {
    var o = PACKS[pk].odds, x = Math.random() * 100, r = 'common';
    for (var i = 0, acc = 0; i < o.length; i++) { acc += o[i]; if (x < acc) { r = RORDER[i]; break; } }
    var pool = CARDS.filter(function (c) { return c.r === r; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // what the cards a player owns add up to (a duplicate levels its card up, to Lv 5)
  function perksOf(s) {
    var o = { cash: 0, bonus: 0, guard: 0, streak: 0 };
    Object.keys(s.coll || {}).forEach(function (id) {
      var c = cardById(id), lv = Math.min(5, s.coll[id] || 0), R = c && RAR[c.r]; if (!c || !lv) return;
      if (c.perk === 'streak') o.streak = Math.max(o.streak, R.st * lv);
      else o[c.perk] += (c.perk === 'bonus' ? R.p * 2 : R.p) * lv;
    });
    o.cash = Math.min(300, o.cash); o.bonus = Math.min(400, o.bonus); o.guard = Math.min(60, o.guard);
    return o;
  }
  function earnOf(s) { return (UPG.mpq.vals[s.u.mpq] + UPG.sb.vals[s.u.sb] * s.streak) * UPG.mult.vals[s.u.mult] * (1 + (s.coll ? perksOf(s).cash : 0) / 100); }
  function lossOf(s) { return UPG.mpq.vals[s.u.mpq] * UPG.mult.vals[s.u.mult] * (1 - Math.min(99, UPG.ins.vals[s.u.ins] + (s.coll ? perksOf(s).guard : 0)) / 100); }
  var RANK = {
    money: { name: '🪙 Coins', cmp: function (a, b) { return b.m - a.m || b.cleared - a.cleared || b.c - a.c; }, show: function (p) { return money(p.m); } },
    score: { name: '⭐ Score', cmp: function (a, b) { return b.sc - a.sc || b.m - a.m; }, show: function (p) { return p.sc.toLocaleString() + ' pts'; } },
    stars: { name: '★ Stars', cmp: function (a, b) { return b.stars - a.stars || b.cleared - a.cleared || b.sc - a.sc; }, show: function (p) { return p.stars + '★'; } },
    acc: { name: '🎯 Accuracy', cmp: function (a, b) { return b.acc - a.acc || (b.c + b.w) - (a.c + a.w); }, show: function (p) { return p.acc < 0 ? '—' : Math.round(p.acc * 100) + '%'; } }
  };
  function starsOf(c, w) { var a = c + w ? c / (c + w) : 1; return a >= 0.9 ? 3 : a >= 0.75 ? 2 : 1; }

  // ------------------------------------------------------------------ styles
  var CSS = [
    '.mlv{position:fixed;inset:0;z-index:2147483200;display:flex;flex-direction:column;background:radial-gradient(900px 600px at 0 -10%,rgba(124,92,255,.35),transparent 60%),radial-gradient(900px 600px at 100% 110%,rgba(32,201,151,.25),transparent 60%),#0d1020;color:#f4f6ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI","PingFang SC",sans-serif;-webkit-font-smoothing:antialiased;overflow:auto}',
    '.mlv[hidden]{display:none}.mlv *{box-sizing:border-box}.mlv button{font:inherit;cursor:pointer}',
    '.mlv-top{display:flex;align-items:center;gap:12px;padding:14px 18px;position:sticky;top:0;background:rgba(13,16,32,.75);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:2;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.mlv-brand{font-weight:900;font-size:17px;letter-spacing:.01em;display:flex;align-items:center;gap:9px}.mlv-brand i{font-style:normal;display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(140deg,#8b5cf6,#22c55e)}',
    '.mlv-sp{flex:1}.mlv-x{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;border-radius:11px;padding:8px 13px;font-weight:700}',
    '.mlv-body{width:min(1100px,100%);margin:0 auto;padding:22px 18px 60px;flex:1}',
    '.mlv-card{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);border-radius:20px;padding:18px;margin-bottom:14px}',
    '.mlv h2{margin:0 0 6px;font-size:20px}.mlv h3{margin:0 0 10px;font-size:15px}.mlv .sub{color:#a9b0d6;font-size:13px;line-height:1.5;margin:0 0 12px}',
    '.mlv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}',
    '.mlv label.f{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#a9b0d6;margin:14px 0 6px}',
    '.mlv select,.mlv input[type=text]{width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.25);color:#fff;border-radius:11px;padding:11px 12px;font:inherit;font-size:14px}',
    '.mlv-chips{display:flex;flex-wrap:wrap;gap:7px}.mlv-chip{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#e6e9ff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700}.mlv-chip.on{background:#8b5cf6;border-color:#a78bfa;color:#fff}',
    '.mlv-btn{border:0;border-radius:13px;padding:12px 18px;font-weight:850;font-size:15px;color:#0b1020;background:linear-gradient(135deg,#a3e635,#22c55e);box-shadow:0 10px 26px rgba(34,197,94,.3)}.mlv-btn:disabled{opacity:.45;cursor:default}',
    '.mlv-btn.alt{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:none}.mlv-btn.warn{background:linear-gradient(135deg,#fb7185,#f43f5e);color:#fff}',
    '.mlv-row{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:14px}',
    '.mlv-code{font-size:clamp(46px,9vw,92px);font-weight:950;letter-spacing:.12em;line-height:1;background:linear-gradient(135deg,#c4b5fd,#86efac);-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.mlv-link{font-size:14px;color:#c7cdf5;word-break:break-all}',
    '.mlv-players{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.mlv-players span{background:rgba(139,92,246,.2);border:1px solid rgba(167,139,250,.35);border-radius:999px;padding:7px 13px;font-weight:750;animation:mlvPop .35s ease}',
    '@keyframes mlvPop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}',
    '.mlv-lb{display:grid;gap:7px}.mlv-lb .r{display:grid;grid-template-columns:40px minmax(0,1.2fr) minmax(0,1.6fr) auto 60px;gap:12px;align-items:center;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}',
    '.mlv-lb .r b{font-size:18px}.mlv-lb .nm{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mlv-lb .m{font-weight:900;color:#86efac;font-variant-numeric:tabular-nums;text-align:right}.mlv-lb .a{color:#a9b0d6;font-size:12px;text-align:right}',
    '.mlv-trail{display:flex;gap:3px;align-items:center;font-size:12px;color:#c7cdf5;min-width:0}.mlv-trail i{font-style:normal;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-size:12px;flex:none}.mlv-trail i.done{background:rgba(34,197,94,.25)}.mlv-trail i.now{background:#8b5cf6;box-shadow:0 0 0 2px #c4b5fd}',
    '.mlv-trail span{margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mlv-stat{display:flex;gap:18px;flex-wrap:wrap;align-items:center}.mlv-stat div{min-width:100px}.mlv-stat small{display:block;color:#a9b0d6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.mlv-stat strong{font-size:28px;font-variant-numeric:tabular-nums}',
    '.mlv-bar{height:10px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:10px}.mlv-bar i{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#22c55e);transition:width .6s}',
    '.mlv-pod{display:flex;align-items:flex-end;justify-content:center;gap:12px;margin:18px 0 6px}.mlv-pod div{width:min(30%,200px);text-align:center;border-radius:16px 16px 6px 6px;padding:12px 8px;background:linear-gradient(180deg,rgba(139,92,246,.5),rgba(139,92,246,.12));font-weight:850}',
    '.mlv-pod div em{display:block;font-style:normal;font-size:30px}.mlv-pod div small{display:block;color:#86efac;font-size:14px;margin-top:4px}',
    '.mlv-hud{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.mlv-cash{font-size:28px;font-weight:950;color:#86efac;font-variant-numeric:tabular-nums}.mlv-pill{background:rgba(255,255,255,.08);border-radius:999px;padding:6px 11px;font-size:13px;font-weight:800}',
    /* the level map */
    '.mlv-map{position:relative;display:grid;gap:14px;max-width:560px;margin:8px auto 0}',
    '.mlv-lv{position:relative;display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;padding:14px 16px;border-radius:22px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;text-align:left;width:86%;transition:transform .15s}',
    '.mlv-lv:nth-child(odd){justify-self:start}.mlv-lv:nth-child(even){justify-self:end}',
    '.mlv-lv .ic{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;font-size:32px;background:rgba(255,255,255,.08)}',
    '.mlv-lv b{display:block;font-size:17px}.mlv-lv small{display:block;color:#a9b0d6;font-size:12px;margin-top:2px}.mlv-lv .st{font-size:18px;letter-spacing:1px;white-space:nowrap}',
    '.mlv-lv.open{border-color:rgba(167,139,250,.7);background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(34,197,94,.18));box-shadow:0 14px 34px rgba(139,92,246,.28);animation:mlvGlow 2.2s ease-in-out infinite}',
    '.mlv-lv.open .ic{background:linear-gradient(140deg,#8b5cf6,#22c55e)}.mlv-lv.done .ic{background:rgba(34,197,94,.25)}',
    '.mlv-lv.lock{opacity:.45;cursor:default}.mlv-lv.lock .ic{filter:grayscale(1)}.mlv-lv:not(.lock):active{transform:scale(.98)}',
    '@keyframes mlvGlow{50%{box-shadow:0 14px 44px rgba(139,92,246,.5)}}',
    /* the money bar over the arcade */
    '.mlv-float{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483300;display:flex;align-items:center;gap:10px;padding:7px 14px;border-radius:999px;background:rgba(10,14,30,.82);border:1px solid rgba(134,239,172,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font:800 14px Inter,system-ui,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.mlv-float .c{color:#86efac;font-size:18px;font-variant-numeric:tabular-nums}.mlv-float .t{color:#c7cdf5}',
    '.mlv-pop{position:fixed;left:50%;bottom:calc(58px + env(safe-area-inset-bottom));z-index:2147483301;font:950 22px Inter,system-ui,sans-serif;pointer-events:none;animation:mlvUp 1s ease-out forwards;text-shadow:0 2px 10px rgba(0,0,0,.5)}',
    '.mlv-float.in{position:static;transform:none;padding:4px 10px;gap:7px;font-size:12px;box-shadow:none;background:rgba(34,197,94,.14);flex:none}.mlv-float.in .c{font-size:14px}',
    '.mlv-pop.top{bottom:auto;top:calc(58px + env(safe-area-inset-top))}',
    '.mlv-pop.good{color:#86efac}.mlv-pop.bad{color:#fda4af}',
    '@keyframes mlvUp{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.05)}100%{opacity:0;transform:translate(-50%,-34px)}}',
    /* level result */
    '.mlv-res,.mlv-res *,.mlv-float,.mlv-pop{box-sizing:border-box}',
    '.mlv-res{position:fixed;inset:0;z-index:2147483302;display:grid;place-items:center;background:rgba(5,8,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:mlvPop .3s ease}',
    '.mlv-res .box{width:min(420px,calc(100vw - 32px));text-align:center;border-radius:26px;padding:26px 22px;background:linear-gradient(160deg,#1b1640,#0f1a2c);border:1px solid rgba(167,139,250,.4);color:#fff;font-family:Inter,system-ui,sans-serif}',
    '.mlv-res .stars{font-size:44px;letter-spacing:6px;margin:8px 0}.mlv-res .stars i{font-style:normal;opacity:.18}.mlv-res .stars i.on{opacity:1;color:#fde047;animation:mlvPop .4s ease backwards}',
    '.mlv-res h2{margin:4px 0;font-size:24px}.mlv-res p{color:#c7cdf5;margin:6px 0 16px;line-height:1.5}',
    '.mlv-res .mlv-btn{border:0;border-radius:13px;padding:12px 18px;font:850 15px Inter,system-ui,sans-serif;cursor:pointer}',
    '.mlv-shop{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:11px}.mlv-up{border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:14px}',
    '.mlv-up .t{font-weight:850;display:flex;gap:8px;align-items:center}.mlv-up .lv{display:flex;gap:3px;margin:9px 0}.mlv-up .lv i{flex:1;height:6px;border-radius:9px;background:rgba(255,255,255,.12)}.mlv-up .lv i.on{background:#22c55e}',
    '.mlv-up .v{font-size:13px;color:#c7cdf5;margin-bottom:9px}.mlv-up button{width:100%}',
    '.mlv-table{width:100%;border-collapse:collapse;font-size:13px}.mlv-table td,.mlv-table th{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left}.mlv-table th{color:#a9b0d6;font-size:11px;text-transform:uppercase;letter-spacing:.06em}',
    /* map path */
    '.mlv-map::before{content:"";position:absolute;left:50%;top:30px;bottom:30px;border-left:4px dotted rgba(167,139,250,.28);transform:translateX(-2px)}',
    '.mlv-lv{z-index:1;background:#171b36}.mlv-lv.done{background:#132a2a}',
    /* card packs */
    '.mlv-pk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}',
    '.mlv-pkbtn{position:relative;border-radius:20px;padding:16px 14px 14px;text-align:center;color:#fff;border:1px solid rgba(255,255,255,.18);overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,.3)}',
    '.mlv-pkbtn::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.22) 45%,transparent 60%);transform:translateX(-100%);animation:mlvShine 3.2s ease-in-out infinite}',
    '@keyframes mlvShine{60%,100%{transform:translateX(100%)}}',
    '.mlv-pkbtn .i{font-size:52px;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45));animation:mlvBob 2.4s ease-in-out infinite}',
    '.mlv-pkbtn b{display:block;margin-top:6px;font-size:16px}.mlv-pkbtn .odds{display:flex;height:6px;border-radius:9px;overflow:hidden;margin:10px 0 4px;background:rgba(0,0,0,.3)}',
    '.mlv-pkbtn .ol{font-size:10px;color:rgba(255,255,255,.75);margin-bottom:10px}.mlv-pkbtn .mlv-btn{width:100%;position:relative;z-index:1}',
    '@keyframes mlvBob{50%{transform:translateY(-6px) rotate(-4deg)}}',
    '.mlv-open{position:fixed;inset:0;z-index:2147483400;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 45%,rgba(76,29,149,.9),rgba(3,5,15,.96));color:#fff;font-family:Inter,system-ui,sans-serif;overflow:hidden;box-sizing:border-box;padding:16px}',
    '.mlv-open *{box-sizing:border-box}.mlv-open .pk{font-size:132px;cursor:pointer;user-select:none;filter:drop-shadow(0 22px 40px rgba(0,0,0,.55));animation:mlvBob 1.6s ease-in-out infinite;background:none;border:0;line-height:1}',
    '.mlv-open .pk.shake{animation:mlvShake .8s linear}',
    '@keyframes mlvShake{0%,100%{transform:none}10%,50%,90%{transform:translateX(-10px) rotate(-8deg) scale(1.06)}30%,70%{transform:translateX(10px) rotate(8deg) scale(1.14)}}',
    '.mlv-open .hint{font-weight:850;color:#c4b5fd;letter-spacing:.06em;animation:mlvPulse 1.2s ease-in-out infinite}@keyframes mlvPulse{50%{opacity:.4}}',
    '.mlv-open .flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,#fff,transparent 55%);animation:mlvFlash .7s ease-out forwards;pointer-events:none}@keyframes mlvFlash{from{opacity:1}to{opacity:0}}',
    '.mlv-cx{width:230px;height:316px;perspective:1000px}',
    '.mlv-cx .in{position:relative;width:100%;height:100%;transform-style:preserve-3d;transform:rotateY(180deg) scale(.6);transition:transform 1s cubic-bezier(.2,.9,.3,1.15)}.mlv-cx.flip .in{transform:none}',
    '.mlv-cx .f,.mlv-cx .b{position:absolute;inset:0;border-radius:24px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}',
    '.mlv-cx .b{transform:rotateY(180deg);background:linear-gradient(140deg,#312e81,#0f172a);border:3px solid rgba(255,255,255,.25);font-size:70px}',
    '.mlv-cx .f{background:var(--c);border:3px solid rgba(255,255,255,.6);box-shadow:0 0 50px var(--g),0 0 130px var(--g)}',
    '.mlv-cx .rays{position:absolute;inset:-60%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0 9deg,transparent 9deg 18deg);animation:mlvSpin 9s linear infinite}@keyframes mlvSpin{to{transform:rotate(360deg)}}',
    '.mlv-cx .ic{position:relative;font-size:100px;line-height:1.1;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45))}',
    '.mlv-cx b{position:relative;font-size:23px;margin-top:8px;text-shadow:0 2px 8px rgba(0,0,0,.55)}',
    '.mlv-cx em{position:relative;font-style:normal;font-weight:950;letter-spacing:.2em;font-size:12px;margin-top:5px;padding:4px 11px;border-radius:99px;background:rgba(0,0,0,.38)}',
    '.mlv-cx small{position:relative;margin-top:12px;font-size:13px;font-weight:800;background:rgba(0,0,0,.32);padding:6px 11px;border-radius:11px;text-align:center;max-width:90%}',
    '.mlv-open .tag{font-size:28px;font-weight:950;letter-spacing:.04em;text-shadow:0 4px 18px rgba(0,0,0,.5);animation:mlvPop .4s ease backwards;animation-delay:.7s;min-height:34px;text-align:center}',
    '.mlv-open .mlv-row{animation:mlvPop .4s ease backwards;animation-delay:1s;justify-content:center}',
    '.mlv-open .mlv-btn{border:0;border-radius:13px;padding:12px 18px;font:850 15px Inter,system-ui,sans-serif;cursor:pointer}',
    '.mlv-spark{position:absolute;left:50%;top:45%;width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c);animation:mlvSpark 1.2s ease-out forwards;pointer-events:none}',
    '@keyframes mlvSpark{to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}',
    /* collection */
    '.mlv-coll{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:11px}',
    '.mlv-mini{position:relative;border-radius:16px;aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--c);border:2px solid rgba(255,255,255,.4);color:#fff;box-shadow:0 0 18px var(--g);padding:6px;text-align:center}',
    '.mlv-mini .ic{font-size:42px;line-height:1.1}.mlv-mini b{font-size:12.5px;margin-top:4px}.mlv-mini small{font-size:10px;opacity:.9;margin-top:3px;line-height:1.25}',
    '.mlv-mini.no{background:rgba(255,255,255,.035);border:2px dashed rgba(255,255,255,.12);box-shadow:none}.mlv-mini.no .ic{filter:brightness(0);opacity:.3}.mlv-mini.no b,.mlv-mini.no small{opacity:.35}',
    '.mlv-mini.eq{outline:3px solid #22c55e;outline-offset:2px}.mlv-mini .lvb{position:absolute;top:6px;right:6px;font-size:10px;font-weight:900;background:rgba(0,0,0,.45);border-radius:6px;padding:2px 5px}',
    '.mlv-mini .rb{position:absolute;top:6px;left:6px;font-size:9px;font-weight:900;letter-spacing:.06em;background:rgba(0,0,0,.4);border-radius:6px;padding:2px 5px;text-transform:uppercase}',
    '.mlv-perks{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 14px}.mlv-perks span{background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.35);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800}',
    '.mlv-av{font-style:normal;display:inline-grid;place-items:center;width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.08);margin-right:8px;font-size:18px;vertical-align:middle;flex:none}',
    '.mlv-cash .mlv-av{width:40px;height:40px;font-size:24px;border-radius:13px;margin-right:10px}',
    /* teacher: feed + rank moves */
    '.mlv-live{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(240px,1fr);gap:14px;align-items:start}@media(max-width:900px){.mlv-live{grid-template-columns:1fr}}',
    '.mlv-feed{display:flex;flex-direction:column;gap:7px}.mlv-feed div{padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.05);font-size:13px;font-weight:700;line-height:1.35}',
    '.mlv-feed div.new{animation:mlvSlide .5s ease}.mlv-feed .k-legendary{background:linear-gradient(90deg,rgba(245,158,11,.35),rgba(255,255,255,.04))}.mlv-feed .k-mythic{background:linear-gradient(90deg,rgba(244,63,94,.4),rgba(124,58,237,.25))}.mlv-feed .k-epic{background:linear-gradient(90deg,rgba(168,85,247,.3),rgba(255,255,255,.04))}.mlv-feed .k-clear{background:linear-gradient(90deg,rgba(34,197,94,.22),rgba(255,255,255,.04))}',
    '@keyframes mlvSlide{from{transform:translateX(-24px);opacity:0}}',
    '.mlv-lb .r{transition:background .3s}.mlv-lb .r.up{background:rgba(34,197,94,.16)}',
    '.mlv-lb .r{grid-template-columns:40px minmax(0,1.1fr) minmax(0,1.5fr) auto!important}.mlv-lb .sx{display:flex;gap:4px;font-variant-numeric:tabular-nums}',
    '.mlv-lb .sx span{min-width:66px;text-align:right;color:#a9b0d6;font-size:12.5px;font-weight:700;padding:3px 6px;border-radius:8px}.mlv-lb .sx span.on{color:#86efac;font-size:16px;font-weight:950;background:rgba(34,197,94,.12)}',
    '.mlv-lb .hot{color:#fdba74;font-weight:900}.mlv-lbh{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}.mlv-lbh h3{margin:0}.mlv-lbh .mlv-chip{padding:5px 10px;font-size:12px}',
    '.mlv-lb .mlv-trail{overflow:hidden}@media(max-width:1180px){.mlv-lb .r{grid-template-columns:40px minmax(0,1fr) auto!important;row-gap:6px}.mlv-lb .r .mlv-trail{grid-column:2/-1;grid-row:2}}',
    '.mlv-lbk{display:flex;gap:14px;justify-content:flex-end;color:#a9b0d6;font-size:11px;margin-top:8px}',
    '@media(max-width:640px){.mlv-lb .r{grid-template-columns:30px 1fr!important}.mlv-lb .sx{grid-column:1/-1}.mlv-lb .sx span{flex:1;min-width:0}}',
    /* student: rank + top 5 */
    '.mlv-top5{max-width:560px;margin:0 auto 14px;padding:14px 16px}.mlv-top5 h3{display:flex;justify-content:space-between;margin-bottom:8px}.mlv-top5 .row{display:grid;grid-template-columns:28px 34px 1fr auto;gap:8px;align-items:center;padding:6px 8px;border-radius:11px;font-size:14px}',
    '.mlv-top5 .row.me{background:rgba(139,92,246,.28);outline:1px solid rgba(196,181,253,.6)}.mlv-top5 .row b{color:#86efac;font-variant-numeric:tabular-nums}.mlv-top5 .row i{font-style:normal;font-size:20px}',
    '.mlv-rank{background:linear-gradient(135deg,#8b5cf6,#22c55e);color:#fff}',
    '.mlv-map h4{justify-self:center;z-index:1;margin:6px 0 0;padding:5px 14px;border-radius:999px;background:#0d1020;border:1px solid rgba(196,181,253,.35);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#c4b5fd}',
    '.mlv-conf{position:fixed;top:-16px;width:9px;height:15px;border-radius:2px;z-index:2147483303;pointer-events:none;animation:mlvFall linear forwards}',
    '@keyframes mlvFall{to{transform:translate(var(--dx),112vh) rotate(var(--r))}}',
    '.mlv-btn.mlv-sm{padding:8px 12px;font-size:13px;border-radius:11px}',
    '.mlv-edh,.mlv-edr{display:grid;grid-template-columns:30px minmax(0,1fr) minmax(0,1.6fr) 34px;gap:8px;align-items:start}',
    '.mlv-edh{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#a9b0d6;margin:12px 0 6px}',
    '.mlv-edr{margin-bottom:6px}.mlv-edr .n{color:#a9b0d6;font-size:12px;padding-top:12px;text-align:right}',
    '.mlv textarea{width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.25);color:#fff;border-radius:11px;padding:10px 12px;font:inherit;font-size:14px;resize:vertical;line-height:1.4;overflow:hidden}',
    '.mlv textarea.empty{border-color:rgba(252,211,77,.55)}.mlv-edr button{border:0;background:rgba(255,255,255,.06);color:#fda4af;border-radius:10px;height:40px}',
    '@media(max-width:640px){.mlv-edh{display:none}.mlv-edr{grid-template-columns:1fr 34px}.mlv-edr .n{display:none}.mlv-edr textarea{grid-column:1/2}}',
    '.mlv-acct{display:flex;flex-direction:column;align-items:center;gap:4px;margin:0 0 12px}.mlv-acct img{width:34px;height:34px;border-radius:50%}',
    '.mlv-avatar-label{margin:14px 0 7px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#c7cdf5}.mlv-avatar-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:10px;margin:0 auto 14px;max-height:286px;overflow-y:auto;padding:6px 4px}.mlv-avatar-choice{width:100%;height:auto;aspect-ratio:1;padding:3px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);cursor:pointer;transition:transform .18s,border-color .18s,background .18s}.mlv-avatar-choice:hover{transform:translateY(-2px)}.mlv-avatar-choice.on{border-color:#86efac;background:rgba(34,197,94,.18);box-shadow:0 0 0 2px rgba(134,239,172,.25)}.mlv-avatar-choice .mlv-card-icon,.mlv-avatar-choice .mlv-monster{width:100%;height:100%;object-fit:contain}',
    '.mlv-acct:has(img),.mlv-acct:has(.mlv-link-btn){flex-direction:row;justify-content:center;gap:10px;font-size:14px}',
    '.mlv-gbtn{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:12px;padding:11px 18px;background:#fff;color:#1f1f1f;font-weight:750;font-size:15px;box-shadow:0 6px 18px rgba(0,0,0,.25)}.mlv-gbtn:disabled{opacity:.6}',
    '.mlv-link-btn{border:0;background:none;color:#c4b5fd;text-decoration:underline;font-size:13px}.mlv-lb .gv{color:#93c5fd;font-weight:900;font-size:10px}',
    '.mlv-wait{max-width:520px;margin:14px auto 0}.mlv-waitg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}',
    '.mlv-waitg button{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(160deg,rgba(139,92,246,.28),rgba(34,197,94,.12));color:#fff;border-radius:16px;padding:14px 8px}',
    '.mlv-waitg button .i{font-size:34px;animation:mlvBob 2.4s ease-in-out infinite}.mlv-waitg button b{font-size:14px}.mlv-waitg button small{font-size:11px;color:#c7cdf5}',
    '.mlv-waitg button.dim{opacity:.6}.mlv-waitg button.shake{animation:mlvShake .5s linear}.mlv-gems{text-align:center;margin-top:10px;font-size:15px}.mlv-gems b{color:#7dd3fc;font-size:18px}',
    '@media(max-width:640px){.mlv-waitg{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.mlv-er .energybar{height:16px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.18);margin:12px 0}.mlv-er .energybar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185);transition:width .2s}.mlv-er .qbox{text-align:left;border:1px solid rgba(125,211,252,.35);background:rgba(2,24,48,.5);border-radius:16px;padding:14px;margin:14px 0}.mlv-er .qbox h3{margin:0 0 6px;font-size:15px;color:#bae6fd}.mlv-er .qbox p{margin:0;color:#fff;line-height:1.45}.mlv-er .answer{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:12px;background:rgba(0,0,0,.24);color:#fff;font:700 16px Inter,system-ui,sans-serif}.mlv-er .feedback{min-height:22px;margin:8px 0;color:#fcd34d;font-weight:800}.mlv-er .shoprow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.mlv-er .shoprow button{border:1px solid rgba(125,211,252,.3);border-radius:11px;background:rgba(14,116,144,.45);color:#fff;padding:8px 11px;font-weight:800;cursor:pointer}.mlv-er .shoprow button:disabled{opacity:.45;cursor:default}',
    '.mlv-of{position:fixed;inset:0;z-index:2147483380;overflow:hidden;background:#062b49;color:#fff;font-family:Inter,system-ui,sans-serif;touch-action:none}',
    '.mlv-of canvas{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.mlv-of .hud{position:absolute;top:calc(12px + env(safe-area-inset-top));left:0;right:0;z-index:3;display:flex;justify-content:center;gap:10px;pointer-events:none}',
    '.mlv-of .hud span,.mlv-of .hud button{border:1px solid rgba(255,255,255,.2);background:rgba(2,24,48,.58);color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.18);backdrop-filter:blur(8px)}',
    '.mlv-of .hud span{border-radius:999px;padding:8px 14px;font-size:16px;font-weight:900}',
    '.mlv-of .hud button{pointer-events:auto;position:absolute;right:14px;top:0;width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer}.mlv-er .hud [data-shop]{right:62px;border-radius:12px;width:auto;padding:0 11px}',
    '.mlv-of .panel{position:absolute;z-index:4;left:50%;top:50%;width:min(420px,calc(100% - 32px));transform:translate(-50%,-50%);padding:25px 22px;text-align:center;border:1px solid rgba(255,255,255,.3);border-radius:24px;background:rgba(2,24,48,.78);box-shadow:0 22px 70px rgba(0,0,0,.35);backdrop-filter:blur(12px);transition:opacity .2s,transform .2s}',
    '.mlv-of .panel.hide{opacity:0;pointer-events:none;transform:translate(-50%,-46%) scale(.96)}',
    '.mlv-of .panel h2{margin:0 0 7px;font-size:30px}.mlv-of .panel p{margin:7px 0 16px;color:#c7e9ff;line-height:1.45}.mlv-of .octo-mark{font-size:58px;line-height:1;filter:drop-shadow(0 8px 12px rgba(0,0,0,.25));animation:mlvBob 2.2s ease-in-out infinite}',
    '.mlv-of .mlv-btn{border:0;border-radius:13px;padding:12px 19px;background:#38bdf8;color:#03243d;font:900 15px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(14,165,233,.3)}.mlv-of .mlv-btn.alt{background:rgba(255,255,255,.13);color:#fff}.mlv-of .row{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}',
    '.mlv-of .score-big{font-size:54px;font-weight:950;color:#bae6fd;line-height:1}.mlv-of .tiny{font-size:12px;color:#a9d9f2}',
    '.mlv-bp{position:fixed;inset:0;z-index:2147483380;background:radial-gradient(900px 600px at 50% 120%,rgba(14,165,233,.45),transparent 60%),linear-gradient(180deg,#0b1030,#081a2f);overflow:hidden;touch-action:none;font-family:Inter,system-ui,sans-serif;color:#fff}',
    '.mlv-bp .hud{position:absolute;top:calc(12px + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:center;gap:12px;z-index:3;font-weight:900;font-size:20px}',
    '.mlv-bp .hud span{background:rgba(0,0,0,.35);border-radius:999px;padding:7px 16px}.mlv-bp .hud button{position:absolute;right:14px;top:0;border:0;border-radius:50%;width:40px;height:40px;background:rgba(255,255,255,.12);color:#fff;font-size:16px}',
    '.mlv-bp .go{position:absolute;inset:0;display:grid;place-items:center;font-size:34px;font-weight:950;animation:mlvPop .4s ease}',
    '.mlv-bp .b{position:absolute;left:0;top:0;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.75),rgba(255,255,255,.12) 32%,rgba(125,211,252,.18) 60%,rgba(125,211,252,.35));box-shadow:inset 0 0 18px rgba(255,255,255,.35),0 6px 20px rgba(0,0,0,.25);font-size:26px;display:grid;place-items:center;cursor:pointer;padding:0;transition:opacity .2s}',
    '.mlv-bp .b.star{border-color:#fde047;box-shadow:inset 0 0 18px rgba(253,224,71,.5),0 0 22px rgba(253,224,71,.5)}.mlv-bp .b.bomb{border-color:#fb7185;background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.6),rgba(251,113,133,.25) 40%,rgba(127,29,29,.45))}',
    '.mlv-bp .b.pop{opacity:0;scale:1.6}.mlv-bp .fx{position:absolute;font-style:normal;font-weight:950;font-size:24px;pointer-events:none;animation:mlvUp .8s ease-out forwards;transform:translateX(-50%)}.mlv-bp .fx.good{color:#7dd3fc}.mlv-bp .fx.bad{color:#fda4af}',
    '.mlv-bp .end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(3,6,20,.6);animation:mlvPop .35s ease}.mlv-bp .end .big{font-size:56px;font-weight:950}.mlv-bp .end p{color:#c7cdf5;margin:0 0 12px}',
    '.mlv-bp .mlv-btn{border:0;border-radius:13px;padding:12px 22px;font:850 16px Inter,system-ui,sans-serif;cursor:pointer}',
    '.mlv-av img.mlv-avi,.mlv-av .mlv-avi,.mlv-av .mlv-monster{width:100%;height:100%;object-fit:contain;display:block}.mlv-av{overflow:hidden}',
    '.mlv-tilecv{display:block;width:120px;height:78px;margin:0 auto}.mlv-tilecv.sm{width:64px;height:44px}',
    '.mlv-mini img,.mlv-mini .mlv-card-icon,.mlv-mini .mlv-monster{width:70%;aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))}.mlv-mini.no img,.mlv-mini.no .mlv-card-icon,.mlv-mini.no .mlv-monster{filter:brightness(0);opacity:.28}',
    '.mlv-chestbox{position:relative;width:min(340px,86vw);height:min(340px,86vw);cursor:pointer}.mlv-chestbox canvas{width:100%;height:100%;display:block}',
    '.mlv-rise{position:absolute;left:50%;top:58%;width:56%;aspect-ratio:1;transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none}',
    '.mlv-rise.go{animation:mlvRise 1.1s cubic-bezier(.2,.9,.3,1.2) forwards}',
    '@keyframes mlvRise{0%{opacity:0;transform:translate(-50%,-30%) scale(.2)}35%{opacity:1}70%{transform:translate(-50%,-112%) scale(1.15)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}',
    '.mlv-rise img,.mlv-rise .mlv-monster{position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 26px var(--g)) drop-shadow(0 12px 22px rgba(0,0,0,.5))}',
    '.mlv-rise .rays{position:absolute;inset:-60%;border-radius:50%;background:repeating-conic-gradient(from 0deg,var(--g) 0 7deg,transparent 7deg 18deg);-webkit-mask:radial-gradient(circle,#000 18%,transparent 68%);mask:radial-gradient(circle,#000 18%,transparent 68%);animation:mlvSpin 10s linear infinite}',
    '.mlv-binfo{text-align:center;min-height:150px;opacity:0;margin-top:-6%}.mlv-binfo.go{animation:mlvPop .45s ease forwards}',
    '.mlv-binfo em{display:inline-block;font-style:normal;font-weight:950;letter-spacing:.2em;font-size:12px;padding:5px 12px;border-radius:99px;background:var(--c);box-shadow:0 0 18px rgba(255,255,255,.2)}',
    '.mlv-binfo b{display:block;font-size:26px;margin:8px 0 4px;text-shadow:0 2px 10px rgba(0,0,0,.5)}.mlv-binfo small{display:inline-block;font-size:13px;font-weight:800;background:rgba(0,0,0,.35);padding:6px 12px;border-radius:11px}',
    '.mlv-binfo .tag{font-size:22px;font-weight:950;margin-top:10px;color:#fde047}',
    '.mlv-album{overflow:auto;justify-content:flex-start;padding:24px 16px}.mlv-albumbox{width:min(760px,100%)}.mlv-album .mlv-btn{border:0;border-radius:13px;padding:10px 16px;font:800 14px Inter,system-ui,sans-serif;cursor:pointer}.mlv-album .mlv-btn.alt{background:rgba(255,255,255,.1);color:#fff}',
    '.mlv-cover{position:fixed;inset:0;z-index:2147483390;background:#0b0f1c}.mlv-cover iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
    '.mlv-cover-load{position:absolute;inset:0;display:grid;place-items:center;color:#c7cdf5;font:600 16px Inter,system-ui,sans-serif;pointer-events:none}',
    '.mlv-studybtn{display:block;width:100%;margin:14px 0 0}',
    '.mlv-note{font-size:12px;color:#a9b0d6;margin-top:8px}.mlv-err{color:#fda4af;font-size:13px;margin-top:8px;min-height:1em}',
    '@media(max-width:640px){.mlv-lb .r{grid-template-columns:30px 1fr auto;gap:8px}.mlv-lb .r .mlv-trail{grid-column:1/-1;grid-row:2}.mlv-lb .a{display:none}.mlv-lv{width:100%;grid-template-columns:52px 1fr auto}.mlv-lv .ic{width:52px;height:52px;font-size:26px}}'
  ].join('\n');
  function ensureCss() {
    if (document.getElementById('mlv-css')) return;
    var st = document.createElement('style'); st.id = 'mlv-css'; st.textContent = CSS; document.head.appendChild(st);
    ensureToon();
  }
  // ------------------------------------------------------------------ the cartoon skin (31.7, in the spirit of Blooket): a bright purple room
  // with soft stripes, white rounded cards with a thick bottom edge, chunky saturated buttons that press down, Titan One for
  // titles and buttons, Nunito for the rest. Laid over the base CSS above, so every screen and every older rule keeps working.
  // The students' side (.mlv-kid) gets bigger words and bigger targets.
  var TOON = (function () {
    var INK = '#2f2a3d', MUTE = '#7a7090', PURP = '#7b2ff7', DEEP = '#4b11b8', TEAL = '#0bc2cf', GOLD = '#ffcc00', PINK = '#ff4f7b', GREEN = '#22b35e';
    var TITLE = '"Titan One","Lilita One",Nunito,system-ui,sans-serif', BODY = 'Nunito,"Nunito Sans",ui-rounded,system-ui,sans-serif';
    var CARD = 'background:#fff;color:' + INK + ';border:0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.09),0 8px 20px rgba(40,0,90,.22)';
    var BTN = 'border:0!important;border-radius:14px!important;font-family:' + TITLE + '!important;font-weight:400!important;letter-spacing:.02em;color:#fff!important;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:inset 0 -6px 0 rgba(0,0,0,.22),0 4px 10px rgba(40,0,90,.2)!important;padding-bottom:15px!important;transition:transform .08s,box-shadow .08s,filter .12s';
    return [
      // the room
      '.mlv{background:repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 26px,transparent 26px 52px),radial-gradient(1200px 700px at 15% -10%,#a46bff,transparent 60%),linear-gradient(160deg,#6a22ee 0%,' + PURP + ' 45%,#9b4dff 100%) fixed;color:#fff;font-family:' + BODY + ';font-weight:700}',
      '.mlv h2,.mlv h3,.mlv h4,.mlv-brand,.mlv-code,.mlv-cash,.mlv-stat strong,.mlv-res h2,.mlv-of .panel h2,.mlv-of .score-big,.mlv-pop,.mlv-open .tag{font-family:' + TITLE + ';font-weight:400!important;letter-spacing:.02em}',
      '.mlv-top{background:' + DEEP + ';border-bottom:0;box-shadow:0 4px 0 rgba(0,0,0,.18);backdrop-filter:none;-webkit-backdrop-filter:none}',
      '.mlv-brand{font-size:22px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.25)}.mlv-brand i{background:' + GOLD + ';border-radius:14px;width:40px;height:40px;font-size:22px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);transform:rotate(-6deg)}',
      '.mlv-ar-ic .wi{width:104px;height:104px;display:block;margin:0 auto 6px;animation:mlvBob 2.2s ease-in-out infinite;filter:drop-shadow(0 6px 0 rgba(0,0,0,.12))}',
      '.mlv-brand i .wi{width:40px;height:40px;display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.18))}.mlv-brand i{overflow:visible;font-size:0}',
      '.mlv-x{background:#fff;color:' + PURP + ';border:0;border-radius:12px;font-family:' + TITLE + ';font-weight:400;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}',
      '.mlv h2{font-size:26px}.mlv h3{font-size:19px}',
      '.mlv-body > h3,.mlv-body > h2{text-shadow:0 3px 0 rgba(0,0,0,.2)}.mlv-body > .mlv-note,.mlv-body > p{color:rgba(255,255,255,.88)!important}',
      // white cards: dark words inside
      '.mlv-card{' + CARD + ';border-radius:20px}',
      '.mlv-card .sub,.mlv-card .mlv-note,.mlv-card label.f,.mlv-card .mlv-link,.mlv-stat small,.mlv-lv small,.mlv-up .v,.mlv-lbk,.mlv-lb .a,.mlv-table th,.mlv-edh,.mlv-edr .n,.mlv-avatar-label,.mlv-locker h4,.mlv-trail{color:' + MUTE + '!important}',
      '.mlv select,.mlv input[type=text],.mlv textarea{background:#fff;color:' + INK + ';border:3px solid #e4d9ff;border-radius:12px;font-family:' + BODY + ';font-weight:800;box-shadow:none}.mlv input:focus,.mlv select:focus,.mlv textarea:focus{outline:none;border-color:#9b4dff}',
      '.mlv input::placeholder,.mlv textarea::placeholder{color:#b3a8cc}',
      '.mlv-chip{background:#f1ebff;color:' + PURP + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08);font-weight:800}.mlv-chip.on{background:' + PURP + ';color:#fff;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}',
      // chunky buttons that press down
      '.mlv-btn,.mlv-res .mlv-btn,.mlv-open .mlv-btn,.mlv-of .mlv-btn,.mlv-bp .mlv-btn,.mlv-album .mlv-btn{background:' + TEAL + '!important;' + BTN + '}',
      '.mlv-btn:not(:disabled):hover{filter:brightness(1.06)}.mlv-btn:not(:disabled):active{transform:translateY(3px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.22)!important}',
      '.mlv-btn.alt,.mlv-res .mlv-btn.alt,.mlv-open .mlv-btn.alt,.mlv-of .mlv-btn.alt,.mlv-album .mlv-btn.alt{background:#fff!important;color:' + PURP + '!important;text-shadow:none;box-shadow:inset 0 -6px 0 rgba(0,0,0,.1),0 4px 10px rgba(40,0,90,.18)!important}',
      '.mlv-btn.warn{background:' + PINK + '!important}.mlv-btn.mlv-gkbtn{background:#ff9d00!important}.mlv-btn:disabled{opacity:.55;filter:grayscale(.4)}',
      '.mlv-gbtn{border:0;border-radius:14px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.1),0 4px 10px rgba(40,0,90,.2);color:' + INK + ';font-weight:800}',
      '.mlv-link-btn{color:#fff}.mlv-card .mlv-link-btn{color:' + PURP + '}',
      // the code and the lobby
      '.mlv-code{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:' + PURP + ';text-shadow:0 6px 0 #d9c6ff;letter-spacing:.12em}',
      '.mlv-players span{background:#f1ebff;border:0;color:' + PURP + ';box-shadow:inset 0 -3px 0 rgba(0,0,0,.08);font-weight:900}',
      // leaderboards
      '.mlv-lb .r{background:#f7f3ff;border:0;border-radius:14px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.06)}.mlv-lb .r.up{background:#dcfce7}',
      '.mlv-lb .r:nth-child(1){background:#fff4c2}.mlv-lb .r:nth-child(2){background:#eef2f7}.mlv-lb .r:nth-child(3){background:#ffe6d2}',
      '.mlv-lb .m{color:' + GREEN + '}.mlv-lb .sx span{color:' + MUTE + '}.mlv-lb .sx span.on{color:' + GREEN + ';background:#dcfce7}.mlv-lb .hot{color:#f97316}.mlv-lb .gv{color:#2563eb}',
      '.mlv-top5 .row{border-radius:12px}.mlv-top5 .row.me{background:#fff4c2;outline:3px solid ' + GOLD + '}.mlv-top5 .row b{color:' + GREEN + '}',
      '.mlv-trail i{background:#f1ebff}.mlv-trail i.done{background:#bbf7d0}',
      '.mlv-stat strong{color:' + PURP + '}.mlv-bar{background:#f1ebff;height:14px}.mlv-bar i{background:linear-gradient(90deg,' + TEAL + ',' + GREEN + ')}',
      '.mlv-pod div{border:0;color:' + INK + ';box-shadow:inset 0 -6px 0 rgba(0,0,0,.12);background:' + GOLD + '}.mlv-pod div:nth-child(1){background:#dfe6ef}.mlv-pod div:nth-child(3){background:#ffb27a}.mlv-pod div small{color:' + DEEP + '}',
      '.mlv-feed div{background:#f7f3ff;color:' + INK + '}.mlv-feed .k-legendary{background:#fff4c2}.mlv-feed .k-mythic{background:#ffe0ec}.mlv-feed .k-epic{background:#efe4ff}',
      '.mlv-table td,.mlv-table th{border-bottom:2px solid #f1ebff}',
      // the student's top bar and the level map
      '.mlv-cash{color:' + GREEN + '}.mlv-pill{background:#f1ebff;color:' + PURP + ';font-weight:900;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}.mlv-rank{background:' + GOLD + ';color:' + INK + '}',
      '.mlv-av{background:#f1ebff;border-radius:12px}',
      '.mlv-map::before{border-left:6px dashed rgba(255,255,255,.35)}',
      '.mlv-map h4{background:' + GOLD + ';border:0;color:' + INK + ';font-family:' + TITLE + ';font-weight:400;letter-spacing:.04em;box-shadow:inset 0 -4px 0 rgba(0,0,0,.15),0 4px 10px rgba(40,0,90,.2)}',
      '.mlv-lv{' + CARD + ';border-radius:20px}.mlv-lv,.mlv-lv.open{background:#fff!important}.mlv-lv b{font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em}.mlv-lv.done{background:#effdf3!important}.mlv-lv.lock{background:#e9e2f7!important}',
      '.mlv-lv .ic{border-radius:16px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.12);background:' + TEAL + '}.mlv-lv:nth-child(4n+2) .ic{background:' + PINK + '}.mlv-lv:nth-child(4n+3) .ic{background:' + GOLD + '}.mlv-lv:nth-child(4n) .ic{background:#9b4dff}',
      '.mlv-lv.open{outline:5px solid ' + GOLD + ';box-shadow:inset 0 -6px 0 rgba(0,0,0,.09),0 0 0 9px rgba(255,204,0,.25),0 10px 24px rgba(40,0,90,.3);animation:mlvToonBob 2.4s ease-in-out infinite}',
      '.mlv-lv.done .ic{background:' + GREEN + '}.mlv-lv.lock{opacity:.65;background:#e9e2f7;box-shadow:none}',
      '@keyframes mlvToonBob{50%{transform:translateY(-4px)}}',
      // shop, packs, collection
      '.mlv-up{' + CARD + ';border-radius:18px}.mlv-up .t{font-family:' + TITLE + ';font-weight:400}.mlv-up .lv i{background:#f1ebff;height:8px}.mlv-up .lv i.on{background:' + GREEN + '}',
      '.mlv-pkbtn{border:0;box-shadow:inset 0 -7px 0 rgba(0,0,0,.22),0 8px 20px rgba(40,0,90,.3);border-radius:20px}.mlv-pkbtn b{font-family:' + TITLE + ';font-weight:400;text-shadow:0 2px 0 rgba(0,0,0,.3)}.mlv-pkbtn .ol{color:#fff!important;opacity:.9}',
      '.mlv-mini{border:0;box-shadow:inset 0 -5px 0 rgba(0,0,0,.2),0 6px 14px rgba(40,0,90,.25);border-radius:16px}.mlv-mini.no{background:rgba(255,255,255,.18);border:3px dashed rgba(255,255,255,.4);box-shadow:none}.mlv-mini.eq{outline:4px solid ' + GOLD + '}',
      '.mlv-perks span{background:#fff;color:' + GREEN + ';border:0}',
      // waiting games: saturated tiles, white words
      '.mlv-waitg{grid-template-columns:repeat(3,minmax(0,1fr))}',
      '.mlv-waitg button{border:0;color:#fff;border-radius:18px;box-shadow:inset 0 -7px 0 rgba(0,0,0,.2),0 6px 14px rgba(40,0,90,.22);background:' + TEAL + '}',
      '.mlv-waitg button b{font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em;text-shadow:0 2px 0 rgba(0,0,0,.2)}.mlv-waitg button small{color:rgba(255,255,255,.92)!important}',
      '.mlv-waitg button:nth-child(6n+2){background:' + PINK + '}.mlv-waitg button:nth-child(6n+3){background:#ff9d00}.mlv-waitg button:nth-child(6n+4){background:' + GREEN + '}.mlv-waitg button:nth-child(6n+5){background:#9b4dff}.mlv-waitg button:nth-child(6n){background:#3b82f6}',
      '.mlv-waitg button .i{display:block;line-height:0}.mlv-waitg .wi{width:64px;height:64px;display:block;margin:0 auto;filter:drop-shadow(0 4px 0 rgba(0,0,0,.16))}.mlv-kid .mlv-waitg .wi{width:76px;height:76px}',
      '.mlv-waitg button:active{transform:translateY(3px);box-shadow:inset 0 -3px 0 rgba(0,0,0,.2)}.mlv-gems b{color:#0e7490}',
      // avatars and the Locker
      '.mlv-avatar-choice,.mlv-lk{background:#f7f3ff!important;border:0!important;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08)}.mlv-avatar-choice.on,.mlv-lk.on{background:#fff4c2!important;box-shadow:0 0 0 4px ' + GOLD + ',inset 0 -4px 0 rgba(0,0,0,.08)!important}',
      '.mlv-avatar-choice.lock,.mlv-lk.lock{background:#ece6f7!important}.mlv-avatar-choice .pr,.mlv-lk .pr{background:' + PURP + ';color:#fff}',
      '.mlv-lk-g{color:#0e7490}.mlv-endgem{background:#e0f7fa;color:#0e7490}',
      // inline light colours meant for the old dark theme, inside white cards
      '.mlv-card [style*="color:#86efac"],.mlv-res [style*="color:#86efac"],.mlv-lv [style*="color:#86efac"]{color:' + GREEN + '!important}',
      '.mlv-card [style*="color:#c4b5fd"],.mlv-res [style*="color:#c4b5fd"],.mlv-lv [style*="color:#c4b5fd"]{color:' + PURP + '!important}',
      '.mlv-card [style*="color:#fda4af"],.mlv-res [style*="color:#fda4af"]{color:#e11d48!important}.mlv-card [style*="color:#a9b0d6"],.mlv-card [style*="color:#c7cdf5"]{color:' + MUTE + '!important}',
      '.mlv-card [style*="color:#fde047"],.mlv-lv [style*="color:#fde047"],.mlv-res [style*="color:#fde047"]{color:#f5a400!important}.mlv-card [style*="color:#fde68a"]{color:#c27c00!important}.mlv-card .mlv-err,.mlv-err{color:#ff9fb6}.mlv-card .mlv-err{color:#e11d48}',
      // the level result, the money bar, the pops
      '.mlv-res{background:rgba(40,0,90,.5)}.mlv-res .box{' + CARD + ';border-radius:24px;font-family:' + BODY + ';font-weight:700}.mlv-res h2{color:' + PURP + '}',
      '.mlv-res p{color:' + MUTE + '}.mlv-res .stars i.on{color:' + GOLD + ';text-shadow:0 4px 0 #d18f00}',
      '.mlv-float{background:#fff;border:0;color:' + INK + ';box-shadow:inset 0 -4px 0 rgba(0,0,0,.1),0 6px 14px rgba(40,0,90,.3);font-family:' + BODY + '}.mlv-float .c{color:' + GREEN + '}.mlv-float .t{color:' + MUTE + '}.mlv-float.in{background:#f1ebff;box-shadow:none}',
      '.mlv-pop{color:#fff!important;text-shadow:0 3px 0 ' + DEEP + ',0 0 12px rgba(0,0,0,.35)}.mlv-pop.good{color:#7cffb0!important}.mlv-pop.bad{color:#ffb3c6!important}',
      // the mini-games: white panels over the reef, white HUD pills
      '.mlv-of .panel{' + CARD + ';border-radius:24px;backdrop-filter:none;-webkit-backdrop-filter:none;font-family:' + BODY + ';font-weight:700}.mlv-of .panel h2{color:' + PURP + '}',
      '.mlv-of .panel p,.mlv-of .tiny{color:' + MUTE + '}.mlv-of .score-big{color:' + PURP + ';text-shadow:0 5px 0 #d9c6ff}',
      '.mlv-of .hud span,.mlv-of .hud button{background:#fff;color:' + PURP + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.1),0 4px 10px rgba(0,0,0,.2);backdrop-filter:none;font-family:' + TITLE + ';font-weight:400}',
      '.mlv-er .qbox{background:#f1ebff!important;border:0!important;color:' + INK + '!important}.mlv-er .qbox h3{color:' + PURP + '!important}.mlv-er .feedback{color:' + MUTE + '}',
      '.mlv-er .answer{background:#fff!important;color:' + INK + '!important;border:3px solid #e4d9ff!important}.mlv-er .energybar{background:#f1ebff;border:0}',
      '.mlv-gkopts button{border:0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.22);font-family:' + TITLE + ';font-weight:400;letter-spacing:.02em}.mlv-gkopts button:active{transform:translateY(3px)}',
      '.mlv-gkopts button:nth-child(1){background:' + TEAL + '}.mlv-gkopts button:nth-child(2){background:' + PINK + '}.mlv-gkopts button:nth-child(3){background:#ff9d00}.mlv-gkopts button:nth-child(4){background:#9b4dff}',
      '.mlv-of-lb{background:#fff;color:' + INK + ';border:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.08),0 6px 14px rgba(0,0,0,.25);backdrop-filter:none}.mlv-of-lb h5{color:' + PURP + ';font-family:' + TITLE + ';font-weight:400}.mlv-of-lb .r.me{color:' + GREEN + '}',
      '.mlv-bp .end{background:rgba(40,0,90,.5)}.mlv-bp .hud span{background:#fff;color:' + PURP + ';font-family:' + TITLE + ';font-weight:400}',
      '.mlv-open{font-family:' + BODY + '}.mlv-open .tag{color:' + GOLD + ';text-shadow:0 4px 0 #b06f00}',
      // the students' side, made for children: bigger words, bigger targets (52 px and up), a clear "play" button
      '.mlv-kid{font-size:17px}.mlv-kid h2{font-size:30px}.mlv-kid h3{font-size:21px}.mlv-kid .sub{font-size:16px}.mlv-kid .mlv-note{font-size:14px}',
      '.mlv-kid .mlv-btn{min-height:54px;padding:13px 26px;font-size:19px!important}.mlv-kid .mlv-btn.mlv-sm{min-height:44px;font-size:15px!important}',
      '.mlv-kid input[type=text]{font-size:20px;padding:14px 16px;min-height:58px}',
      '.mlv-kid .mlv-avatar-label{font-size:15px}.mlv-kid .mlv-avatar-picker{grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:12px}',
      '.mlv-kid .mlv-lv{grid-template-columns:76px 1fr auto;padding:16px 18px;gap:16px}.mlv-kid .mlv-lv .ic{width:76px;height:76px;font-size:42px}',
      '.mlv-kid .mlv-lv b{font-size:21px}.mlv-kid .mlv-lv small{font-size:14px}.mlv-kid .mlv-lv .st{font-size:26px}',
      '.mlv-kid .mlv-lv.open .st{display:grid;place-items:center;width:56px;height:56px;border-radius:16px;background:' + GREEN + ';color:#fff;font-size:24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);animation:mlvToonPulse 1.4s ease-in-out infinite}',
      '@keyframes mlvToonPulse{50%{transform:scale(1.1)}}',
      '.mlv-kid .mlv-map h4{font-size:16px;padding:8px 20px}',
      '.mlv-kid .mlv-cash{font-size:36px}.mlv-kid .mlv-pill{font-size:15px;padding:8px 13px}.mlv-kid .mlv-hud .mlv-btn{min-height:46px;font-size:15px!important;padding:9px 15px 12px!important}',
      '.mlv-kid .mlv-top5 .row{font-size:16px;padding:8px 10px}.mlv-kid .mlv-top5 .row i{font-size:24px}',
      '.mlv-kid .mlv-waitg button{padding:16px 8px 20px;min-height:144px}.mlv-kid .mlv-waitg button .i{font-size:46px}.mlv-kid .mlv-waitg button b{font-size:18px}.mlv-kid .mlv-waitg button small{font-size:13px}',
      '.mlv-kid .mlv-up .t{font-size:18px}.mlv-kid .mlv-up .v{font-size:14px}.mlv-kid .mlv-stat strong{font-size:36px}.mlv-kid .mlv-stat small{font-size:13px}',
      '.mlv-kid .mlv-lk-grid{grid-template-columns:repeat(auto-fill,minmax(70px,1fr))}.mlv-kid .mlv-mini b{font-size:14px}',
      '@media(max-width:640px){.mlv-kid .mlv-waitg{grid-template-columns:repeat(2,minmax(0,1fr))}.mlv-kid .mlv-lv{grid-template-columns:62px 1fr auto}.mlv-kid .mlv-lv .ic{width:62px;height:62px;font-size:34px}}'
    ].join('\n');
  })();
  function ensureToon() {
    if (document.getElementById('mlv-toon')) return;
    if (!document.getElementById('mlv-toon-font')) { var l = document.createElement('link'); l.id = 'mlv-toon-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@600;700;800;900&display=swap'; document.head.appendChild(l); }
    var st = document.createElement('style'); st.id = 'mlv-toon'; st.textContent = TOON; document.head.appendChild(st);
  }

  // ------------------------------------------------------------------ Octo, the player's character (the Mini Pet)
  var OCTO = {
    ctl: function () { return window.__miniPetCtl || null; },
    el: function () { return document.getElementById('minest-mini-pet-p0'); },
    // where Octo stands: 'stage' (next to the Live screens), 'corner' (out of the way while a game runs), 'show' (centre, for a reveal)
    place: function (where) {
      var el = OCTO.el(); if (!el) return;
      var w = el.offsetWidth || 152, h = el.offsetHeight || 152, W = innerWidth, H = innerHeight;
      el.style.transition = 'left .6s cubic-bezier(.2,.9,.3,1.1), top .6s cubic-bezier(.2,.9,.3,1.1), opacity .3s';
      el.style.zIndex = where === 'corner' ? '2147483150' : '2147483450';
      el.style.pointerEvents = where === 'corner' ? 'none' : '';
      el.style.opacity = where === 'corner' ? '.92' : '';
      var x = where === 'show' ? (W - w) / 2 : where === 'corner' ? W - w + 6 : W - w - 10;
      var y = where === 'show' ? H * 0.62 - h / 2 : where === 'corner' ? H - h + 14 : H - h - 6;
      el.style.left = Math.max(0, x) + 'px'; el.style.top = Math.max(0, y) + 'px';
      var c = OCTO.ctl(); if (c && c.show && !c.visible) try { c.show(); } catch (e) {}
    },
    act: function (name, text, ms) {
      var c = OCTO.ctl(); if (!c) return;
      try { if (name) c.play(name); if (text) c.say(text, ms || 1800); if (name === 'hop') c.hop(); } catch (e) {}
    },
    cheer: function (big) { var c = OCTO.ctl(); if (!c) return; try { c.hop(); c.play(big ? 'barrel_roll' : 'excited'); if (big && c.burst) c.burst(); } catch (e) {} }
  };

  var current = null;   // the open overlay
  function overlay(title, standalone) {
    ensureCss(); close();
    var el = document.createElement('div'); el.className = 'mlv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
    el.innerHTML = '<div class="mlv-top"><div class="mlv-brand"><i>🎮</i><span></span></div><div class="mlv-sp"></div>' + (standalone ? '' : '<button class="mlv-x" type="button" data-x>✕ Close</button>') + '</div><div class="mlv-body"></div>';
    $(el, '.mlv-brand span').textContent = title;
    $(el, '.mlv-brand i').innerHTML = WAIT_ICONS.octo;   // Octo in the logo
    document.body.appendChild(el);
    var o = { el: el, body: $(el, '.mlv-body'), top: $(el, '.mlv-top'), cleanup: [] };
    var x = $(el, '[data-x]'); if (x) x.onclick = function () { close(); };
    current = o; return o;
  }
  function close() {
    if (!current) return;
    var c = current; current = null;
    c.cleanup.forEach(function (f) { try { f(); } catch (e) {} });
    c.el.remove();
  }

  // ================================================================== TEACHER
  function boardsList() { try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch (e) { return []; } }
  function activeBoard() { try { return window.MinestAI && MinestAI.board && MinestAI.board(); } catch (e) { return null; } }
  function playUrl(code) {
    var local = /^localhost$|^127\./.test(location.hostname);
    return (local ? location.origin + location.pathname.replace(/[^/]*$/, '') + PLAY_PAGE : (/vercel\.app$/.test(location.hostname) ? location.origin : 'https://minest-app.vercel.app') + '/play') + '?code=' + code;
  }

  // ------------------------------------------------------------------ question sets (uploaded / edited), kept in this browser
  var KITS_KEY = 'minest.live.kits.v1';
  function kits() { try { var a = JSON.parse(localStorage.getItem(KITS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveKit(k) {
    var all = kits().filter(function (x) { return x.id !== k.id; });
    k.kit = true; k.updated = Date.now(); all.unshift(k);
    try { localStorage.setItem(KITS_KEY, JSON.stringify(all.slice(0, 40))); } catch (e) { throw new Error('This browser has no room left for more sets'); }
  }
  function dropKit(id) { try { localStorage.setItem(KITS_KEY, JSON.stringify(kits().filter(function (x) { return x.id !== id; }))); } catch (e) {} }
  function kid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  // a JSON file → a board. Takes a Minest / Focusboard board (or {boards:[…]}), a Web 20 room ({board}),
  // a Trello export (lists + cards), or a plain list: [{term, meaning}], {title, items|cards|words:[…]},
  // {lists:[{title, items}]}, {questions:[{prompt, answer}]}, or {"word": "meaning", …}
  function parseKit(data, fname) {
    var title = String((data && (data.title || data.name)) || (fname || 'Uploaded set').replace(/\.json$/i, ''));
    function txt(v) { return v == null ? '' : String(v).trim(); }
    function card(x, i) {
      if (typeof x === 'string') { var m = x.split(/\s*(?:\t| - | – | — |=|:|：)\s*/); return { id: kid('k'), title: txt(m[0]), desc: txt(m.slice(1).join(' · ')) }; }
      if (!x || typeof x !== 'object') return null;
      var t = txt(x.title || x.term || x.word || x.front || x.q || x.question || x.prompt || x.name || x.zh || x.en);
      var d = txt(x.desc || x.description || x.meaning || x.definition || x.back || x.a || x.answer || x.translation || x.def);
      if (x.pinyin && d.indexOf(x.pinyin) < 0) d = txt(x.pinyin) + (d ? ' · ' + d : '');
      if (x.example) d += (d ? '\n' : '') + '例句 Example: ' + txt(x.example);
      return t ? { id: String(x.id || kid('k')), title: t, desc: d } : null;
    }
    function cards(arr) { return (arr || []).map(card).filter(Boolean); }
    if (data && data.board && data.board.columns) data = data.board;
    if (data && Array.isArray(data.boards) && data.boards[0]) data = data.boards[0];
    var cols = [];
    if (data && Array.isArray(data.columns)) cols = data.columns.map(function (c) { return { id: String(c.id || kid('c')), title: txt(c.title || c.name) || 'List', cards: cards(c.cards) }; });
    else if (data && Array.isArray(data.lists) && Array.isArray(data.cards) && data.lists[0] && data.lists[0].id) {   // Trello
      cols = data.lists.filter(function (l) { return !l.closed; }).map(function (l) { return { id: String(l.id), title: l.name || 'List', cards: cards(data.cards.filter(function (c) { return c.idList === l.id && !c.closed; }).map(function (c) { return { title: c.name, desc: c.desc }; })) }; });
    }
    else if (data && Array.isArray(data.lists)) cols = data.lists.map(function (l) { return { id: kid('c'), title: txt(l.title || l.name) || 'List', cards: cards(l.items || l.cards || l.words) }; });
    else {
      var arr = Array.isArray(data) ? data : data && (data.items || data.cards || data.words || data.questions || data.vocab);
      if (!arr && data && typeof data === 'object') arr = Object.keys(data).filter(function (k) { return typeof data[k] === 'string' && k !== 'title' && k !== 'name'; }).map(function (k) { return { term: k, meaning: data[k] }; });
      cols = [{ id: kid('c'), title: 'Cards', cards: cards(arr) }];
    }
    cols = cols.filter(function (c) { return c.cards.length; });
    if (!cols.length) throw new Error('No cards found in this file');
    return { id: kid('kit-'), title: title, columns: cols };
  }
  var KIT_TEMPLATE = { title: 'My vocabulary set', lists: [
    { title: 'Unit 1', items: [{ term: '大家好', pinyin: 'dàjiā hǎo', meaning: 'Hello everyone', example: '大家好，我叫 Grace。' }, { term: 'photosynthesis', meaning: 'how plants make food from light' }] },
    { title: 'Unit 2', items: ['apple - 苹果', 'banana - 香蕉'] }
  ] };
  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  function openTeacher() {
    var o = overlay('Minest Live · Teacher');
    var cur = activeBoard(), boards = boardsList().concat(kits());
    var st = { boardId: (cur && cur.id) || (boards[0] && boards[0].id), cols: null, levels: LEVELS.map(function (l) { return l.k; }), pace: 'normal', goal: 'levels', time: 10, target: 100000 };
    function board() { return boards.filter(function (b) { return b.id === st.boardId; })[0] || cur; }

    function render() {
      var b = board();
      if (!b) { o.body.innerHTML = '<div class="mlv-card"><h2>No board yet</h2><p class="sub">Make a board with cards (a word and its meaning on the back), then host a game from it.</p></div>'; return; }
      var cols = b.columns || [];
      if (!st.cols) st.cols = cols.map(function (c) { return c.id; });
      var snap = snapshot(b, st.cols), nCards = Object.keys(cardsIn(snap)).length, nBack = withBack(snap);
      var ok = nCards >= 3 && st.levels.length > 0;
      o.body.innerHTML =
        '<div class="mlv-grid">' +
        '<section class="mlv-card"><h2>🎮 Host a live Arcade game</h2><p class="sub">Students learn the cards first (Card Flinger → Swipe Judgment), then every Arcade game opens and they pick any one. Right answers earn money for upgrades and card packs; each cleared level pays a star bonus and its Arcade score counts on the leaderboard. You watch the race live.</p>' +
        '<label class="f">Cards to play</label><select data-board>' + [['My boards', boards.filter(function (x) { return !x.kit; })], ['Uploaded & edited sets', boards.filter(function (x) { return x.kit; })]].map(function (g) {
          return g[1].length ? '<optgroup label="' + g[0] + '">' + g[1].map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === b.id ? ' selected' : '') + '>' + (x.kit ? '📄 ' : '') + esc(x.title || 'Board') + '</option>'; }).join('') + '</optgroup>' : '';
        }).join('') + '</select>' +
        '<div class="mlv-row" style="margin-top:8px"><button class="mlv-btn alt mlv-sm" data-edit type="button">✏️ Edit cards & questions</button><button class="mlv-btn alt mlv-sm" data-upload type="button">📥 Upload JSON</button>' +
        '<button class="mlv-btn alt mlv-sm" data-export type="button">⬇ Export JSON</button><button class="mlv-btn alt mlv-sm" data-template type="button">📄 Template</button>' + (b.kit ? '<button class="mlv-btn alt mlv-sm" data-dropkit type="button">🗑 Remove set</button>' : '') +
        '<input type="file" accept=".json,application/json" data-file hidden></div><div class="mlv-err" data-kiterr></div>' +
        '<label class="f">Lists (the deck)</label><div class="mlv-chips">' + cols.map(function (c) { return '<button type="button" class="mlv-chip' + (st.cols.indexOf(c.id) >= 0 ? ' on' : '') + '" data-col="' + esc(c.id) + '">' + esc(c.title || 'List') + ' · ' + (c.cards || []).length + '</button>'; }).join('') + '</div>' +
        '<label class="f">Levels · 📖 learning first (in order), then 🎮 any game</label><div class="mlv-chips">' + LEVELS.map(function (l, i) { return '<button type="button" class="mlv-chip' + (st.levels.indexOf(l.k) >= 0 ? ' on' : '') + '" data-lv="' + l.k + '">' + (i + 1) + ' ' + l.icon + ' ' + esc(l.name) + '</button>'; }).join('') + '</div>' +
        '<label class="f">Pace</label><div class="mlv-chips">' + [['easy', 'Easy'], ['normal', 'Normal'], ['fast', 'Fast']].map(function (p) { return '<button type="button" class="mlv-chip' + (st.pace === p[0] ? ' on' : '') + '" data-pace="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
        '<label class="f">Goal</label><div class="mlv-chips">' +
        '<button type="button" class="mlv-chip' + (st.goal === 'levels' ? ' on' : '') + '" data-goal="levels">🏰 First to clear every level</button>' +
        [5, 10, 15, 20].map(function (m) { return '<button type="button" class="mlv-chip' + (st.goal === 'time' && st.time === m ? ' on' : '') + '" data-time="' + m + '">⏱ ' + m + ' min</button>'; }).join('') +
        [10000, 100000, 1000000].map(function (v) { return '<button type="button" class="mlv-chip' + (st.goal === 'money' && st.target === v ? ' on' : '') + '" data-target="' + v + '">🏁 ' + money(v) + '</button>'; }).join('') + '</div>' +
        '<p class="mlv-note"' + (nBack < 4 && st.levels.some(function (k) { return !levelInfo(k).self; }) ? ' style="color:#fcd34d"' : '') + '>' + nCards + ' cards · ' + nBack + ' with an answer on the back · ' + st.levels.length + ' levels.' +
        (nBack < 4 ? ' ⚠️ Levels 3–7 ask for the answer on the back of each card; with fewer than 4 such cards they are skipped. Pick a board whose cards have a meaning on the back (e.g. a vocabulary board).' : '') + '</p>' +
        '<div class="mlv-row"><button class="mlv-btn" data-host' + (ok ? '' : ' disabled') + '>Create game</button><button class="mlv-btn alt" data-solo' + (ok ? '' : ' disabled') + ' title="Play every level, the shop, chests and the Locker yourself — no students needed">🕹 Solo play</button></div><div class="mlv-err" data-err></div></section>' +
        '<section class="mlv-card"><h2>🎓 Course room (Web 20)</h2><p class="sub">Assign this board as a guided course: students open the link, learn list by list and play Study Arcade at their own pace. The full card & question editor is in the teacher room.</p>' +
        '<label class="f">Room code</label><div class="mlv-row" style="margin-top:0"><input type="text" data-room maxlength="8" value="' + esc(localStorage.getItem('minest.live.room') || '') + '" placeholder="e.g. CPA2G4" style="flex:1"><button class="mlv-btn alt" data-newroom type="button">New</button></div>' +
        '<div class="mlv-row"><button class="mlv-btn alt" data-publish>Publish this board to the room</button><button class="mlv-btn alt" data-editor>Open teacher editor ↗</button><button class="mlv-btn alt" data-student>Student view ↗</button></div><div class="mlv-err" data-roomnote></div></section>' +
        '</div>';
      $(o.body, '[data-board]').onchange = function (e) { st.boardId = e.target.value; st.cols = null; render(); };
      var fileIn = $(o.body, '[data-file]'), kerr = $(o.body, '[data-kiterr]');
      $(o.body, '[data-upload]').onclick = function () { fileIn.click(); };
      fileIn.onchange = function () {
        var f = fileIn.files && fileIn.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try { var k = parseKit(JSON.parse(String(rd.result).replace(/^\ufeff/, '')), f.name); saveKit(k); boards = boardsList().concat(kits()); st.boardId = k.id; st.cols = null; render(); editor(k, true); }
          catch (e) { kerr.textContent = 'Could not read ' + f.name + ': ' + e.message; }
        };
        rd.readAsText(f);
      };
      $(o.body, '[data-edit]').onclick = function () { editor(b, false); };
      $(o.body, '[data-export]').onclick = function () { download((b.title || 'minest-set').replace(/[^\w\u4e00-\u9fff-]+/g, '_') + '.json', JSON.stringify(snapshot(b), null, 2)); };
      $(o.body, '[data-template]').onclick = function () { download('minest-live-template.json', JSON.stringify(KIT_TEMPLATE, null, 2)); };
      var dk = $(o.body, '[data-dropkit]'); if (dk) dk.onclick = function () { if (!window.confirm('Remove “' + b.title + '” from this browser?')) return; dropKit(b.id); boards = boardsList().concat(kits()); st.boardId = (cur && cur.id) || (boards[0] && boards[0].id); st.cols = null; render(); };
      $$(o.body, '[data-col]').forEach(function (btn) { btn.onclick = function () { var id = btn.getAttribute('data-col'), i = st.cols.indexOf(id); if (i >= 0) st.cols.splice(i, 1); else st.cols.push(id); render(); }; });
      $$(o.body, '[data-lv]').forEach(function (btn) { btn.onclick = function () { var k = btn.getAttribute('data-lv'), i = st.levels.indexOf(k); if (i >= 0) st.levels.splice(i, 1); else st.levels.push(k); st.levels = LEVELS.map(function (l) { return l.k; }).filter(function (x) { return st.levels.indexOf(x) >= 0; }); render(); }; });
      $$(o.body, '[data-pace]').forEach(function (btn) { btn.onclick = function () { st.pace = btn.getAttribute('data-pace'); render(); }; });
      $(o.body, '[data-goal]').onclick = function () { st.goal = 'levels'; render(); };
      $$(o.body, '[data-time]').forEach(function (btn) { btn.onclick = function () { st.goal = 'time'; st.time = +btn.getAttribute('data-time'); render(); }; });
      $$(o.body, '[data-target]').forEach(function (btn) { btn.onclick = function () { st.goal = 'money'; st.target = +btn.getAttribute('data-target'); render(); }; });
      $(o.body, '[data-host]').onclick = function () { host(snap); };
      var sb = $(o.body, '[data-solo]'); if (sb) sb.onclick = function () { solo(snap); };
      var roomIn = $(o.body, '[data-room]'), note = $(o.body, '[data-roomnote]');
      function room() { var c = cleanCode(roomIn.value); roomIn.value = c; try { localStorage.setItem('minest.live.room', c); } catch (e) {} return c; }
      roomIn.oninput = room;
      $(o.body, '[data-newroom]').onclick = function () { roomIn.value = newCode(); room(); };
      $(o.body, '[data-publish]').onclick = function () {
        var c = room(); if (!c) { note.textContent = 'Enter or create a room code first.'; return; }
        note.textContent = 'Publishing…';
        publishRoom(c, b).then(function () { note.style.color = '#86efac'; note.textContent = 'Published to room ' + c + '. Students: ' + roomStudentUrl(c); })
          .catch(function (e) { note.style.color = ''; note.textContent = 'Could not publish: ' + e.message; });
      };
      $(o.body, '[data-editor]').onclick = function () { var c = room(); window.open(roomBase() + 'web20.teacher.html' + (c ? '?code=' + c : ''), '_blank', 'noopener'); };
      $(o.body, '[data-student]').onclick = function () { var c = room(); if (!c) { note.textContent = 'Enter a room code first.'; return; } window.open(roomStudentUrl(c), '_blank', 'noopener'); };
    }

    // the card & question editor: a list of lists, each card = front (term / question) + back (meaning / answer)
    function editor(src, isNew) {
      var k = JSON.parse(JSON.stringify(snapshot(src)));
      if (!src.kit) { k.id = kid('kit-'); k.title = (src.title || 'Board') + ' (game set)'; }
      function paint() {
        var missing = 0; k.columns.forEach(function (c) { c.cards.forEach(function (x) { if (!String(x.desc || '').trim()) missing++; }); });
        o.body.innerHTML = '<section class="mlv-card"><div class="mlv-row" style="margin-top:0;justify-content:space-between"><h2 style="margin:0">✏️ ' + (isNew ? 'Check the uploaded set' : 'Edit cards & questions') + '</h2>' +
          '<div class="mlv-row" style="margin-top:0"><button class="mlv-btn alt" data-cancel>Cancel</button><button class="mlv-btn" data-save>💾 Save set</button></div></div>' +
          '<p class="sub" style="margin-top:8px">Front = the word or question students see. Back = the meaning or answer the games ask for (one per card; extra lines like “例句 Example: …” are fine). ' + (src.kit ? '' : 'Your board stays as it is — this saves a separate game set.') + '</p>' +
          '<label class="f">Set name</label><input type="text" data-title value="' + esc(k.title) + '">' +
          (missing ? '<p class="mlv-note" style="color:#fcd34d">⚠️ ' + missing + ' card' + (missing === 1 ? ' has' : 's have') + ' no back — the answer games skip them.</p>' : '') + '</section>' +
          k.columns.map(function (c, ci) {
            return '<section class="mlv-card mlv-ed" data-ci="' + ci + '"><div class="mlv-row" style="margin-top:0"><input type="text" data-ctitle value="' + esc(c.title) + '" style="flex:1;font-weight:800"><span class="mlv-pill">' + c.cards.length + ' cards</span><button class="mlv-btn alt mlv-sm" data-cdel title="Delete this list">🗑</button></div>' +
              '<div class="mlv-edh"><span>#</span><span>Front · word / question</span><span>Back · meaning / answer</span><span></span></div>' +
              c.cards.map(function (x, i) {
                return '<div class="mlv-edr" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><input type="text" data-f="title" value="' + esc(x.title) + '" placeholder="Front">' +
                  '<textarea data-f="desc" rows="1" placeholder="Back — e.g. dàjiā hǎo · Hello everyone"' + (String(x.desc || '').trim() ? '' : ' class="empty"') + '>' + esc(x.desc || '') + '</textarea><button type="button" data-del title="Delete card">✕</button></div>';
              }).join('') +
              '<div class="mlv-row"><button class="mlv-btn alt mlv-sm" data-add>+ Add card</button><button class="mlv-btn alt mlv-sm" data-paste>📋 Paste many</button></div>' +
              '<div data-pastebox hidden><textarea rows="5" placeholder="One card per line:  word ⇥ meaning   (copied from Excel / Sheets)\nor  word - meaning   or  word: meaning" style="width:100%;margin-top:10px"></textarea><div class="mlv-row"><button class="mlv-btn mlv-sm" data-pasteok>Add these cards</button></div></div></section>';
          }).join('') +
          '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn alt" data-addlist>+ Add a list</button><button class="mlv-btn" data-save2>💾 Save set</button></div>';
        $(o.body, '[data-title]').oninput = function (e) { k.title = e.target.value; };
        $$(o.body, '.mlv-ed').forEach(function (sec) {
          var c = k.columns[+sec.getAttribute('data-ci')];
          $(sec, '[data-ctitle]').oninput = function (e) { c.title = e.target.value; };
          $(sec, '[data-cdel]').onclick = function () { if (c.cards.length && !window.confirm('Delete the list “' + c.title + '” and its ' + c.cards.length + ' cards?')) return; k.columns.splice(k.columns.indexOf(c), 1); paint(); };
          $$(sec, '.mlv-edr').forEach(function (row) {
            var x = c.cards[+row.getAttribute('data-i')];
            $$(row, '[data-f]').forEach(function (inp) {
              inp.oninput = function () { x[inp.getAttribute('data-f')] = inp.value; if (inp.tagName === 'TEXTAREA') { inp.classList.toggle('empty', !inp.value.trim()); inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; } };
              if (inp.tagName === 'TEXTAREA') setTimeout(function () { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; }, 0);
              inp.onkeydown = function (e) { if (e.key === 'Enter' && inp.tagName === 'INPUT') { e.preventDefault(); var nx = row.querySelector('textarea'); if (nx) nx.focus(); } };
            });
            $(row, '[data-del]').onclick = function () { c.cards.splice(c.cards.indexOf(x), 1); paint(); };
          });
          $(sec, '[data-add]').onclick = function () { c.cards.push({ id: kid('k'), title: '', desc: '' }); paint(); var rows = $$(o.body, '.mlv-ed[data-ci="' + k.columns.indexOf(c) + '"] .mlv-edr input'); if (rows.length) rows[rows.length - 1].focus(); };
          $(sec, '[data-paste]').onclick = function () { var bx = $(sec, '[data-pastebox]'); bx.hidden = !bx.hidden; if (!bx.hidden) $(bx, 'textarea').focus(); };
          $(sec, '[data-pasteok]').onclick = function () {
            String($(sec, '[data-pastebox] textarea').value || '').split(/\r?\n/).forEach(function (line) {
              line = line.trim(); if (!line) return;
              var m = line.split(/\t| - | – | — |\s*[:：=]\s*/); var t = (m.shift() || '').trim();
              if (t) c.cards.push({ id: kid('k'), title: t, desc: m.join(' · ').trim() });
            });
            paint();
          };
        });
        $(o.body, '[data-addlist]').onclick = function () { k.columns.push({ id: kid('c'), title: 'New list', cards: [{ id: kid('k'), title: '', desc: '' }] }); paint(); };
        function doSave() {
          k.title = (k.title || '').trim() || 'Game set';
          k.columns.forEach(function (c) { c.cards = c.cards.filter(function (x) { return String(x.title || '').trim(); }); });
          k.columns = k.columns.filter(function (c) { return c.cards.length; });
          if (!k.columns.length) { window.alert('Add at least one card.'); return; }
          try { saveKit(k); } catch (e) { window.alert(e.message); return; }
          boards = boardsList().concat(kits()); st.boardId = k.id; st.cols = null; render();
        }
        $(o.body, '[data-save]').onclick = doSave; $(o.body, '[data-save2]').onclick = doSave;
        $(o.body, '[data-cancel]').onclick = function () { render(); };
      }
      paint();
    }

    // 🕹 Solo play: the teacher goes through everything a student sees (learn first, every game, coins, the shop,
    // chests, the Locker, the waiting games) — a private game that starts at once and is removed on close
    function solo(snap) {
      var code = newCode(), err = $(o.body, '[data-err]'), btn = $(o.body, '[data-solo]');
      var u = GAUTH.user(), nm = (u && String(u.displayName || '').split(' ')[0]) || 'Teacher';
      var pid = 'solo' + uid().slice(1), av = String(localAv() || MNAV.ids[0]).split('~')[0];
      var game = { v: 2, title: snap.title, board: snap, levels: st.levels.slice(), pace: st.pace, goal: { type: 'levels' }, solo: true,
        state: 'live', created: { '.sv': 'timestamp' }, startedAt: { '.sv': 'timestamp' } };
      if (btn) btn.disabled = true;
      db(code + '/host', 'PUT', game).then(function (h) {
        return db(code + '/players/' + pid, 'PATCH', { name: nm, av: withWear(av), joined: { '.sv': 'timestamp' }, now: 'map', solo: true }).then(function (r) {
          o.top.querySelector('.mlv-brand span').textContent = 'Minest Live · Solo play';
          o.el.classList.add('mlv-kid');
          o.cleanup.push(function () { db(code, 'DELETE').catch(function () {}); });
          play(o, h, { code: code, pid: pid, name: nm, av: av, offset: (r && r.joined ? r.joined - Date.now() : 0), solo: true });
        });
      }).catch(function (e) { if (err) err.textContent = 'Could not start solo play: ' + e.message; if (btn) btn.disabled = false; });
    }
    function host(snap) {
      var code = newCode(), err = $(o.body, '[data-err]');
      var game = { v: 2, title: snap.title, board: snap, levels: st.levels.slice(), pace: st.pace,
        goal: st.goal === 'time' ? { type: 'time', min: st.time } : st.goal === 'money' ? { type: 'money', target: st.target } : { type: 'levels' },
        state: 'lobby', created: { '.sv': 'timestamp' } };
      $(o.body, '[data-host]').disabled = true;
      db(code + '/host', 'PUT', game).then(function (r) { game.offset = (r && r.created ? r.created - Date.now() : 0); hosting(code); lobby(code, game); })
        .catch(function (e) { err.textContent = 'Could not create the game: ' + e.message; $(o.body, '[data-host]').disabled = false; });
    }

    function lobby(code, game) {
      o.top.querySelector('.mlv-brand span').textContent = 'Minest Live · Teacher · ' + code;
      var players = {}, stateNow = 'lobby', hostData = game, ended = false, names = cardsIn(game.board), feed = [], seenEv = {}, lastPos = {};
      var link = playUrl(code);
      var w = watch(code, function (tree) {
        tree = tree || {}; players = tree.players || {};
        Object.keys(players).forEach(function (pid) {
          var p = players[pid] || {}, ev = p.ev;
          if (!ev || !ev.at || seenEv[pid] === ev.at) return;
          seenEv[pid] = ev.at;
          feed.unshift({ id: pid + ev.at, at: ev.at, k: ev.k || '', html: '<i class="mlv-av" style="width:24px;height:24px;font-size:14px;border-radius:8px">' + avHtml(p.av) + '</i><b>' + esc(p.name || 'Player') + '</b> ' + esc(ev.t || '') });
        });
        feed.sort(function (a, b) { return b.at - a.at; }); feed = feed.slice(0, 10); if (tree.host) { var off = game.offset; hostData = tree.host; hostData.offset = off; } stateNow = hostData.state;
        draw();
      });
      o.cleanup.push(function () { w.close(); });
      var rankBy = 'money', lbSent = '';
      var timer = setInterval(function () { if (stateNow === 'live') { draw(); checkEnd(); publishLb(); } }, 1000);
      o.cleanup.push(function () { clearInterval(timer); });

      function rows() {
        return Object.keys(players).map(function (k) {
          var p = players[k] || {}, lv = p.lv || {}, cleared = game.levels.filter(function (x) { return lv[x]; }).length, stars = 0;
          Object.keys(lv).forEach(function (x) { stars += lv[x] || 0; });
          var sc = 0; Object.keys(p.sc || {}).forEach(function (x) { sc += p.sc[x] || 0; });
          return { id: k, name: p.name || 'Player', google: !!p.google, av: p.av || '🙂', coll: p.coll || 0, m: p.money || 0, c: p.correct || 0, w: p.wrong || 0, lv: lv, cleared: cleared, stars: stars, now: p.now || '', cards: p.cards || {},
            sc: sc, best: p.best || 0, combo: p.combo || 0, acc: (p.correct || 0) + (p.wrong || 0) ? (p.correct || 0) / ((p.correct || 0) + (p.wrong || 0)) : -1 };
        }).sort(RANK[rankBy].cmp);
      }
      // the ranking the class sees on their own screens: top 5 + everybody's place, sent when it changes
      function publishLb() {
        var r = rows(), R = RANK[rankBy];
        var lb = { by: rankBy, n: r.length, top: r.slice(0, 5).map(function (p) { return { n: p.name, av: p.av, v: R.show(p) }; }), rank: {} };
        r.forEach(function (p, i) { lb.rank[p.id] = i + 1; });
        var j = JSON.stringify(lb); if (j === lbSent) return; lbSent = j;
        db(code + '/host/lb', 'PUT', lb).catch(function () { lbSent = ''; });
      }
      function left() { return hostData.startedAt ? hostData.startedAt + hostData.goal.min * 60000 - (Date.now() + (game.offset || 0)) : hostData.goal.min * 60000; }
      function checkEnd() {
        if (ended || stateNow !== 'live') return;
        var r = rows(), g = hostData.goal;
        if ((g.type === 'time' && left() <= 0) || (g.type === 'money' && r[0] && r[0].m >= g.target) || (g.type === 'levels' && r.some(function (p) { return p.cleared >= game.levels.length; }))) endGame();
      }
      function endGame() { ended = true; db(code + '/host', 'PATCH', { state: 'ended', endedAt: { '.sv': 'timestamp' } }).catch(function () { ended = false; }); }
      function trail(p) {
        var nowL = p.now && p.now !== 'map' && p.now !== 'shop' ? levelInfo(p.now) : null;
        return '<div class="mlv-trail">' + game.levels.map(function (k) { var l = levelInfo(k); return '<i class="' + (p.lv[k] ? 'done' : '') + (p.now === k ? ' now' : '') + '" title="' + esc(l.name) + '">' + (p.lv[k] ? '★' : l.icon) + '</i>'; }).join('') +
          '<span>' + (nowL ? '▶ ' + esc(nowL.name) : p.now === 'shop' ? '🛒 shopping' : p.now === 'cards' ? '🏅 badges' : p.now === 'cover' ? '📖 studying' : p.cleared >= game.levels.length ? '🏰 all clear' : '🗺 map') + '</span></div>';
      }

      function draw() {
        if (!current || current !== o) return;
        var r = rows();
        if (stateNow === 'lobby') {
          o.body.innerHTML = '<section class="mlv-card" style="text-align:center"><p class="sub">Join at <b>' + esc(link.replace(/\?.*/, '')) + '</b> · game code</p><div class="mlv-code">' + code + '</div>' +
            '<p class="mlv-link">' + esc(link) + '</p><div class="mlv-row" style="justify-content:center"><button class="mlv-btn alt" data-copy>Copy link</button><button class="mlv-btn alt" data-try>Open a student view ↗</button></div></section>' +
            '<section class="mlv-card"><h3>' + r.length + ' player' + (r.length === 1 ? '' : 's') + ' · ' + esc(game.title) + ' · ' + game.levels.length + ' levels · ' + (game.goal.type === 'time' ? game.goal.min + ' min' : game.goal.type === 'money' ? 'first to ' + money(game.goal.target) : 'first to clear every level') + '</h3>' +
            '<div class="mlv-players">' + (r.length ? r.map(function (p) { return '<span><i class="mlv-av" style="width:24px;height:24px;margin-right:6px">' + avHtml(p.av) + '</i>' + esc(p.name) + '</span>'; }).join('') : '<p class="sub">Waiting for students…</p>') + '</div>' +
            '<div class="mlv-row"><button class="mlv-btn" data-start' + (r.length ? '' : ' disabled') + '>▶ Start game</button><button class="mlv-btn alt" data-cancel>Cancel</button></div></section>';
          $(o.body, '[data-copy]').onclick = function () { try { navigator.clipboard.writeText(link); this.textContent = 'Copied ✓'; } catch (e) {} };
          $(o.body, '[data-try]').onclick = function () { window.open(link, '_blank', 'noopener'); };
          $(o.body, '[data-start]').onclick = function () { this.disabled = true; db(code + '/host', 'PATCH', { state: 'live', startedAt: { '.sv': 'timestamp' } }).then(function (h) { hostData.startedAt = h.startedAt; beep('win'); }); };
          $(o.body, '[data-cancel]').onclick = function () { hosting(null); db(code, 'DELETE').catch(function () {}); close(); openTeacher(); };
        } else if (stateNow === 'live') {
          var g = hostData.goal, top = r[0];
          var prog = g.type === 'time' ? 1 - left() / (g.min * 60000) : g.type === 'money' ? (top ? top.m / g.target : 0) : (r.length ? Math.max.apply(null, r.map(function (p) { return p.cleared; })) / game.levels.length : 0);
          var totC = 0, totW = 0; r.forEach(function (p) { totC += p.c; totW += p.w; });
          o.body.innerHTML = '<section class="mlv-card"><div class="mlv-stat"><div><small>' + (g.type === 'time' ? 'Time left' : 'Goal') + '</small><strong>' + (g.type === 'time' ? clock(left()) : g.type === 'money' ? money(g.target) : '🏰 ' + game.levels.length + ' levels') + '</strong></div>' +
            '<div><small>Players</small><strong>' + r.length + '</strong></div><div><small>Answers</small><strong>' + (totC + totW) + '</strong></div><div><small>Class accuracy</small><strong>' + pct(totC, totW) + '</strong></div>' +
            '<div class="mlv-sp"></div><div><button class="mlv-btn warn" data-end>End game</button></div></div><div class="mlv-bar"><i style="width:' + Math.min(100, Math.round(prog * 100)) + '%"></i></div></section>' +
            '<div class="mlv-live"><section class="mlv-card"><div class="mlv-lbh"><h3>Leaderboard · code ' + code + '</h3><div class="mlv-chips">' + Object.keys(RANK).map(function (k) { return '<button type="button" class="mlv-chip' + (k === rankBy ? ' on' : '') + '" data-rank="' + k + '">' + RANK[k].name + '</button>'; }).join('') + '</div></div><div class="mlv-lb">' + r.map(function (p, i) {
              var cell = function (k, v, t) { return '<span class="' + (k === rankBy ? 'on' : '') + '" title="' + t + '">' + v + '</span>'; };
              return '<div class="r" data-id="' + esc(p.id) + '"><b>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)) + '</b><span class="nm"><i class="mlv-av">' + avHtml(p.av) + '</i>' + esc(p.name) + (p.google ? ' <small class="gv" title="Signed in with Google">G✓</small>' : '') + (p.best >= 5 ? ' <small class="hot">🔥' + p.best + '</small>' : '') + '</span>' + trail(p) +
                '<span class="sx">' + cell('money', money(p.m), 'Coins') + cell('score', points(p.sc), 'Arcade points (best run per level)') + cell('stars', p.stars + '★', 'Stars') + cell('acc', p.acc < 0 ? '—' : Math.round(p.acc * 100) + '%', 'Right answers') + '</span></div>';
            }).join('') + '</div><div class="mlv-lbk"><span>🪙 coins</span><span>⭐ points</span><span>★ stars</span><span>🎯 right</span>' + (r.some(function (p) { return p.coll; }) ? '' : '') + '</div></section>' +
            '<section class="mlv-card"><h3>📣 Live feed</h3><div class="mlv-feed">' + (feed.length ? feed.map(function (f) { var isNew = !f.shown; f.shown = 1; return '<div class="k-' + esc(f.k) + (isNew ? ' new' : '') + '">' + f.html + '</div>'; }).join('') : '<p class="sub">Level clears and big card pulls show up here.</p>') + '</div></section></div>';
          // ranks slide to their new places
          $$(o.body, '.mlv-lb .r').forEach(function (row, i) {
            var id = row.getAttribute('data-id'), was = lastPos[id];
            if (was != null && was !== i) {
              row.style.transform = 'translateY(' + ((was - i) * (row.offsetHeight + 7)) + 'px)'; row.style.transition = 'none';
              if (was > i) row.classList.add('up');
              requestAnimationFrame(function () { requestAnimationFrame(function () { row.style.transition = 'transform .6s cubic-bezier(.2,.9,.3,1.1), background .3s'; row.style.transform = ''; }); });
            }
            lastPos[id] = i;
          });
          $(o.body, '[data-end]').onclick = function () { endGame(); };
          $$(o.body, '[data-rank]').forEach(function (b) { b.onclick = function () { rankBy = b.getAttribute('data-rank'); lastPos = {}; draw(); publishLb(); }; });
        } else if (stateNow === 'ended') {
          report(r);
        }
      }

      function report(r) {
        var cs = {};
        r.forEach(function (p) { Object.keys(p.cards).forEach(function (k) { var x = p.cards[k] || {}, s = cs[k] || (cs[k] = { c: 0, w: 0 }); s.c += x.c || 0; s.w += x.w || 0; }); });
        var hard = Object.keys(cs).map(function (k) { return { t: names[k] || k, c: cs[k].c, w: cs[k].w }; }).filter(function (s) { return s.c + s.w > 0; })
          .sort(function (a, b) { return (a.c / (a.c + a.w)) - (b.c / (b.c + b.w)) || b.w - a.w; });
        var pod = [r[1], r[0], r[2]];
        o.body.innerHTML = '<section class="mlv-card" style="text-align:center"><h2>🏆 Game over · ' + esc(game.title) + '</h2><p class="sub" style="margin:0">Ranked by ' + RANK[rankBy].name + '</p><div class="mlv-pod">' +
          pod.map(function (p, i) { if (!p) return '<div style="visibility:hidden"></div>'; var h = [150, 190, 120][i]; return '<div style="height:' + h + 'px"><em>' + ['🥈', '🥇', '🥉'][i] + '</em><span class="mlv-av" style="width:54px;height:54px;font-size:30px;margin:0 auto 4px;display:grid">' + avHtml(p.av) + '</span>' + esc(p.name) + '<small>' + money(p.m) + '</small></div>'; }).join('') + '</div></section>' +
          '<div class="mlv-grid"><section class="mlv-card"><h3>Students</h3><table class="mlv-table"><tr><th>#</th><th>Name</th><th>Coins</th><th>Points</th><th>Levels</th><th>Stars</th><th>Right</th><th>Best 🔥</th><th>Cards</th></tr>' +
          r.map(function (p, i) { return '<tr><td>' + (i + 1) + '</td><td><i class="mlv-av" style="width:22px;height:22px">' + avHtml(p.av) + '</i>' + esc(p.name) + '</td><td>' + money(p.m) + '</td><td>' + points(p.sc) + '</td><td>' + p.cleared + '/' + game.levels.length + '</td><td>' + p.stars + '★</td><td>' + pct(p.c, p.w) + '</td><td>' + p.best + '</td><td>' + p.coll + '</td></tr>'; }).join('') + '</table></section>' +
          '<section class="mlv-card"><h3>Cards to reteach</h3><table class="mlv-table"><tr><th>Card</th><th>Right</th></tr>' +
          hard.slice(0, 15).map(function (s) { return '<tr><td>' + esc(cut(s.t, 60)) + '</td><td>' + pct(s.c, s.w) + ' (' + (s.c + s.w) + ')</td></tr>'; }).join('') + '</table>' +
          (hard.length ? '' : '<p class="sub">No answers yet.</p>') + '</section></div>' +
          '<div class="mlv-row"><button class="mlv-btn" data-again>Play again</button><button class="mlv-btn alt" data-csv>Download results (CSV)</button><button class="mlv-btn alt" data-done>Done</button></div>';
        // Done ends this room and returns to the teacher setup screen inside the same overlay.
        $(o.body, '[data-again]').onclick = function () { hosting(null); db(code, 'DELETE').catch(function () {}); close(); openTeacher(); };
        $(o.body, '[data-done]').onclick = function () { hosting(null); w.close(); clearInterval(timer); db(code, 'DELETE').catch(function () {}); render(); };
        $(o.body, '[data-csv]').onclick = function () {
          var lines = [['rank', 'name', 'money', 'score', 'levels', 'stars', 'right', 'wrong', 'accuracy', 'best streak', 'cards']].concat(r.map(function (p, i) { return [i + 1, p.name, Math.floor(p.m), p.sc, p.cleared, p.stars, p.c, p.w, pct(p.c, p.w), p.best, p.coll]; }));
          lines.push([]); lines.push(['card', 'right', 'wrong']);
          hard.forEach(function (s) { lines.push([s.t, s.c, s.w]); });
          var csv = lines.map(function (l) { return l.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'minest-live-' + code + '.csv'; a.click();
        };
      }
      draw();
    }
    // a game this browser is hosting comes back when the panel opens again (closing the panel doesn't end it)
    var mine = hosting();
    if (mine) {
      db(mine + '/host').then(function (h) {
        if (!h || !h.board) { hosting(null); return; }
        if (!current || current !== o || o.resumed) return;
        o.resumed = true; h.offset = 0;
        lobby(mine, h);
      }).catch(function () {});
    }
    render();
  }
  function hosting(code) {
    try {
      if (code === undefined) return localStorage.getItem('minest.live.hosting') || '';
      if (code) localStorage.setItem('minest.live.hosting', code); else localStorage.removeItem('minest.live.hosting');
    } catch (e) {}
    return '';
  }

  // the Web 20 course room: a snapshot the student page and Study Arcade read
  function roomBase() { return API ? 'https://minest1.vercel.app/' : location.origin + '/'; }
  function roomStudentUrl(code) { return roomBase() + 'web20.0.html?code=' + code; }
  function publishRoom(code, b) {
    var snap = { id: b.id, title: b.title || 'Assigned board', columns: (b.columns || []).map(function (c) {
      return { id: c.id, title: c.title || 'List', color: c.color || '#60a5fa', cards: (c.cards || []).map(function (k) {
        return { id: k.id, title: k.title || '', desc: k.desc || k.description || '', labels: k.labels || [], complete: false, mastery: 0, checklistItems: [], questions: Array.isArray(k.questions) ? k.questions : [] };
      }) };
    }) };
    var payload = { code: code, title: snap.title, data: '', board: snap, open: true, updated: Date.now(), source: 'web31' };
    try { localStorage.setItem('minest-room-config-' + code, JSON.stringify(payload)); } catch (e) {}
    return fetch(API + '/api/rooms/' + code, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('room service ' + r.status); return r.json(); });
  }

  // ------------------------------------------------------------------ student sign-in: Google (Gmail), optional
  // The page's own Firebase project (web31 already loads it; the play page loads the SDK on first use).
  // The game keeps only the display name, the photo and the account id (as the player id, so a student
  // is the same player on any device) — never the e-mail address.
  var GAUTH = {
    sdk: function () {
      if (window.__minestFirebaseReady) return window.__minestFirebaseReady;
      if (window.firebase && typeof firebase.auth === 'function') return Promise.resolve(window.firebase);
      if (GAUTH._p) return GAUTH._p;
      var load = function (src) { return new Promise(function (ok, no) {
        var sc = document.querySelector('script[data-minest-firebase="' + src + '"]');
        if (!sc) { sc = document.createElement('script'); sc.src = src; sc.async = true; sc.setAttribute('data-minest-firebase', src); (document.head || document.documentElement).appendChild(sc); }
        sc.addEventListener('load', ok, { once: true }); sc.addEventListener('error', no, { once: true });
        if (window.firebase && typeof firebase.auth === 'function') ok(window.firebase);
      }); };
      GAUTH._p = load('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js').then(function () { return load('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'); }).then(function () {
        if (!window.firebase || typeof firebase.auth !== 'function') { var e = new Error('Firebase Auth SDK is unavailable'); e.code = 'auth/sdk-unavailable'; throw e; }
        return window.firebase;
      });
      window.__minestFirebaseReady = GAUTH._p;
      return GAUTH._p;
    },
    app: function () {
      var cfg = window.__FIREBASE_CONFIG__; if (!cfg || !window.firebase || !firebase.auth) return null;
      try {
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        return firebase.auth();
      } catch (e) {
        try { return firebase.auth(); } catch (ignore) { return null; }
      }
    },
    user: function () { try { var a = window.firebase && firebase.apps && firebase.apps.length && firebase.auth(); return a ? a.currentUser : null; } catch (e) { return null; } },
    watch: function (fn) { GAUTH.sdk().then(function () { var a = GAUTH.app(); if (!a) return; a.onAuthStateChanged(fn); if (a.getRedirectResult) a.getRedirectResult().catch(function (e) { window.__minestLastAuthError = e; }); }).catch(function (e) { window.__minestLastAuthError = e; }); },
    signIn: function () {
      return GAUTH.sdk().then(function () {
        var a = GAUTH.app(); if (!a) throw new Error('Sign-in is not set up on this page');
        var pr = new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
        var persist = a.setPersistence && firebase.auth.Auth && firebase.auth.Auth.Persistence ? a.setPersistence(firebase.auth.Auth.Persistence.LOCAL) : Promise.resolve();
        return persist.then(function () {
          var host = String(window.location && window.location.hostname || '').toLowerCase();
          if ((host === 'minest1.vercel.app' || host.endsWith('.vercel.app') && host !== 'focusboard-drab.vercel.app') && window.__minestHostedGoogleSignIn) return window.__minestHostedGoogleSignIn(a);
          return a.signInWithPopup(pr);
        }).catch(function (e) {
          var host = String(window.location && window.location.hostname || '').toLowerCase();
          if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') && host !== 'minest1.vercel.app' && !(host.endsWith('.vercel.app') && host !== 'focusboard-drab.vercel.app')) return a.signInWithRedirect(pr);
          throw e;
        });
      });
    },
    signOut: function () { try { return firebase.auth().signOut(); } catch (e) { return Promise.resolve(); } }
  };

  // ------------------------------------------------------------------ while you wait: Bubble Pop (earns 💎) and chests
  var GEMS_KEY = 'minest.live.gems.v1';
  function gems(add) {
    var g = 0; try { g = +localStorage.getItem(GEMS_KEY) || 0; } catch (e) {}
    if (add) { g = Math.max(0, g + add); try { localStorage.setItem(GEMS_KEY, String(g)); } catch (e) {} }
    return g;
  }
  var CHEST_GEMS = 60;

  // ------------------------------------------------------------------ the Locker: animals and outfits bought with 💎 (kept in this browser)
  var LOCKER_KEY = 'minest.live.locker.v1', FREE_AV = 16;
  function avFree(id) { var i = MNAV.ids.indexOf(id); return i >= 0 && i < FREE_AV; }
  function locker(L) {
    if (L) { try { localStorage.setItem(LOCKER_KEY, JSON.stringify(L)); } catch (e) {} return L; }
    var o = null; try { o = JSON.parse(localStorage.getItem(LOCKER_KEY) || 'null'); } catch (e) {}
    o = o && typeof o === 'object' ? o : {}; o.av = o.av || []; o.wear = o.wear || []; o.on = o.on || '';
    var had = String(localAv() || '').split('~')[0];   // an animal picked before the Locker existed stays yours
    if (/^monster-/.test(had) && !avFree(had) && o.av.indexOf(had) < 0) o.av.push(had);
    return o;
  }
  function ownsAv(id) { return !/^monster-/.test(id) || avFree(id) || locker().av.indexOf(id) >= 0; }
  function avCost(id) { var c = cardById(id); return !c ? 60 : c.r === 'common' ? 30 : c.r === 'rare' ? 60 : 100; }
  function wearCost(w) { var x = MNAV.wear.filter(function (q) { return q.id === w; })[0]; return x ? x.cost : 0; }
  function wearing() { return locker().on || ''; }
  // the avatar value others see: "monster-12~crown" when an outfit is on
  function withWear(v) { v = String(v || '').split('~')[0]; return /^monster-/.test(v) && wearing() ? v + '~' + wearing() : v; }
  function lockerHtml(cur) {
    var L = locker(), base = String(cur || '').split('~')[0], show = /^monster-/.test(base) ? base : MNAV.ids[0];
    return '<section class="mlv-card mlv-locker"><h3><span>👕 Locker</span><span class="mlv-lk-g">💎 <b>' + gems() + '</b></span></h3>' +
      '<div class="mlv-lk-top"><div class="mlv-lk-me">' + MNAV.svg(show, L.on) + '</div><p class="mlv-note" style="margin:0">Unlock new animals and outfits with 💎 — earn them in the waiting games and at the end of every game. Your teacher and class see your look.</p></div>' +
      '<h4>Animals</h4><div class="mlv-lk-grid">' + MNAV.ids.map(function (id) {
        var own = ownsAv(id); return '<button type="button" class="mlv-lk' + (own ? '' : ' lock') + (id === base ? ' on' : '') + '" data-lk-av="' + id + '" title="' + esc(MNAV.names[id]) + '">' + MNAV.svg(id) + (own ? '' : '<span class="pr">💎 ' + avCost(id) + '</span>') + '</button>';
      }).join('') + '</div>' +
      '<h4>Outfits</h4><div class="mlv-lk-grid"><button type="button" class="mlv-lk' + (!L.on ? ' on' : '') + '" data-lk-wear=""><span class="none">None</span></button>' + MNAV.wear.map(function (w) {
        var own = L.wear.indexOf(w.id) >= 0; return '<button type="button" class="mlv-lk' + (own ? '' : ' lock') + (L.on === w.id ? ' on' : '') + '" data-lk-wear="' + w.id + '" title="' + esc(w.name) + '">' + MNAV.svg(show, w.id) + (own ? '' : '<span class="pr">💎 ' + w.cost + '</span>') + '</button>';
      }).join('') + '</div></section>';
  }
  // onAv(id) when an animal is chosen (null: only the outfit changed); repaint() after every change
  function wireLocker(root, onAv, repaint) {
    function buy(btn, cost, done) {
      if (gems() < cost) { btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 500); OCTO.act('thinking', 'Need ' + cost + ' 💎 — play a waiting game!', 1800); return; }
      if (!btn.classList.contains('sure')) { $$(root, '.mlv-lk.sure').forEach(function (x) { x.classList.remove('sure'); var q = x.querySelector('.pr'); if (q) q.textContent = q.getAttribute('data-p'); }); btn.classList.add('sure'); var pr = btn.querySelector('.pr'); if (pr) { pr.setAttribute('data-p', pr.textContent); pr.textContent = 'Tap to buy'; } return; }
      gems(-cost); beep('win'); OCTO.cheer(true); done(); repaint();
    }
    $$(root, '[data-lk-av]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-lk-av'); if (ownsAv(id)) { onAv(id); beep('buy'); repaint(); return; } buy(b, avCost(id), function () { var L = locker(); L.av.push(id); locker(L); onAv(id); }); }; });
    $$(root, '[data-lk-wear]').forEach(function (b) { b.onclick = function () { var w = b.getAttribute('data-lk-wear'), L = locker(); if (!w || L.wear.indexOf(w) >= 0) { L.on = w; locker(L); beep('buy'); onAv(null); repaint(); return; } buy(b, wearCost(w), function () { var L2 = locker(); L2.wear.push(w); L2.on = w; locker(L2); onAv(null); }); }; });
  }
  (function () {
    var st = document.createElement('style'); st.id = 'mlv-locker-css';
    st.textContent = [
      '.mlv-avatar-choice{position:relative}.mlv-avatar-choice.lock svg,.mlv-lk.lock svg{filter:grayscale(.85) brightness(.72);opacity:.8}',
      '.mlv-avatar-choice .pr,.mlv-lk .pr{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);padding:1px 6px;border-radius:8px;background:#1e1b4b;color:#fde68a;font:800 10px/1.5 system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.45);pointer-events:none}',
      '.mlv-avatar-choice.sure,.mlv-lk.sure{border-color:#fde047!important;box-shadow:0 0 0 2px rgba(253,224,71,.45)!important}',
      '.mlv-avatar-choice.shake,.mlv-lk.shake{animation:mlvLkShake .4s}@keyframes mlvLkShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
      '.mlv-locker h3{display:flex;justify-content:space-between;align-items:center;margin-top:0}.mlv-lk-g{font-size:15px;color:#fde68a}',
      '.mlv-lk-top{display:flex;gap:14px;align-items:center;margin:4px 0 6px}.mlv-lk-me{width:86px;height:86px;flex:none}.mlv-lk-me svg{width:100%;height:100%;display:block}',
      '.mlv-locker h4{margin:12px 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#c7cdf5}',
      '.mlv-lk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:10px;max-height:236px;overflow:auto;padding:4px 2px 10px}',
      '.mlv-lk{position:relative;aspect-ratio:1;padding:3px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);cursor:pointer;color:inherit;display:grid;place-items:center}',
      '.mlv-lk svg{width:100%;height:100%;display:block}.mlv-lk.on{border-color:#86efac;background:rgba(34,197,94,.18);box-shadow:0 0 0 2px rgba(134,239,172,.25)}.mlv-lk .none{font:800 12px system-ui,sans-serif;opacity:.75}',
      '.mlv-endgem{display:inline-block;margin:2px 0 8px;padding:6px 14px;border-radius:999px;background:rgba(253,224,71,.14);color:#fde68a;font-weight:900}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  })();
  // the waiting-room tiles' pictures (31.7): flat cartoon drawings in one style instead of emoji
  var WAIT_ICONS = (function () {
    var EYE = function (x, y, r) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 1.15) + '" fill="#2f2a3d"/><circle cx="' + (x + r * .35) + '" cy="' + (y - r * .45) + '" r="' + (r * .4) + '" fill="#fff"/>'; };
    var BLUSH = function (x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="3.2" ry="2" fill="#ff6b9a" opacity=".55"/>'; };
    var OCTO = function (c, d) {   // a round octopus: head, a skirt of five tentacles, a shine
      return '<path d="M13 31Q13 51 19.5 51Q24 51 24 45Q26 53 32 53Q38 53 40 45Q40 51 44.5 51Q51 51 51 31Z" fill="' + d + '"/>' +
        '<ellipse cx="32" cy="29" rx="19" ry="18" fill="' + c + '"/><path d="M20 20q5-8 14-8q-9 3-12 10z" fill="#fff" opacity=".45"/>';
    };
    var CROWN = function (x, y, k) { k = k || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-9 4L-10-6-4.5-1 0-8 4.5-1 10-6 9 4z" fill="#fcd34d" stroke="#f59e0b" stroke-width="1.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="1.6" fill="#f472b6"/><circle cx="-10" cy="-6" r="1.4" fill="#fde68a"/><circle cx="10" cy="-6" r="1.4" fill="#fde68a"/><circle cx="0" cy="-8" r="1.4" fill="#fde68a"/></g>'; };
    var LAV = '#c4b5fd', LAVD = '#a78bfa';
    function svg(body) { return '<svg class="wi" viewBox="0 0 64 64" aria-hidden="true">' + body + '</svg>'; }
    return {
      // the logo: Octo's face with its crown
      octo: svg(OCTO(LAV, LAVD) + CROWN(32, 11, 1) + EYE(25, 29, 3.4) + EYE(39, 29, 3.4) + BLUSH(20, 36) + BLUSH(44, 36) + '<path d="M28.5 37q3.5 3.4 7 0" fill="none" stroke="#2f2a3d" stroke-width="2.2" stroke-linecap="round"/>'),
      dive: svg(OCTO(LAV, LAVD) +
        '<path d="M12.5 27Q32 21 51.5 27" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="19" y="20" width="26" height="15" rx="7" fill="#bae6fd" stroke="#0369a1" stroke-width="2.6"/>' + EYE(27, 28, 2.6) + EYE(37, 28, 2.6) +
        '<path d="M22 23l4-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M50 30Q55 24 54 9" fill="none" stroke="#f97316" stroke-width="4.4" stroke-linecap="round"/><rect x="50.5" y="5" width="7" height="5" rx="2" fill="#ea580c"/>' +
        BLUSH(22, 39) + BLUSH(42, 39) + '<path d="M29 41q3 2.6 6 0" fill="none" stroke="#2f2a3d" stroke-width="2" stroke-linecap="round"/>'),
      flap: svg('<ellipse cx="9" cy="26" rx="8" ry="11" fill="#fff" transform="rotate(-24 9 26)"/><ellipse cx="55" cy="26" rx="8" ry="11" fill="#fff" transform="rotate(24 55 26)"/>' +
        '<path d="M6 23l5 3M5 29l6 1M58 23l-5 3M59 29l-6 1" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round"/>' +
        OCTO(LAV, LAVD) + CROWN(32, 12, .9) + EYE(25, 28, 3.2) + EYE(39, 28, 3.2) + BLUSH(20, 35) + BLUSH(44, 35) +
        '<path d="M28 36q4 4 8 0" fill="none" stroke="#2f2a3d" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="54" cy="8" r="3.4" fill="#e0f2fe" stroke="#fff" stroke-width="1.2"/><circle cx="59" cy="15" r="2" fill="#e0f2fe"/>'),
      energy: svg('<path d="M37 3L13 37h16l-5 24 27-37H35z" fill="#fde047"/><path d="M37 3L13 37h7L42 3z" fill="#fff59d" opacity=".9"/><path d="M51 24L24 61l5-24h6z" fill="#facc15"/>' +
        EYE(28, 32, 2.6) + EYE(37, 30, 2.6) + BLUSH(25, 38) + BLUSH(41, 35) + '<path d="M30 38q3 2.4 6-1" fill="none" stroke="#2f2a3d" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M8 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM55 44l1.6 3.2 3.2 1.6-3.2 1.6L55 53.6l-1.6-3.2-3.2-1.6 3.2-1.6z" fill="#fff"/>'),
      bubble: svg('<circle cx="25" cy="37" r="17" fill="#bae6fd" fill-opacity=".55" stroke="#f0f9ff" stroke-width="2.6"/><path d="M14 31q3-9 12-11" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' +
        '<circle cx="47" cy="21" r="10.5" fill="#a5f3fc" fill-opacity=".55" stroke="#f0f9ff" stroke-width="2.2"/><path d="M41 17q2-5 7-6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="49" cy="46" r="6.5" fill="#c7d2fe" fill-opacity=".6" stroke="#f0f9ff" stroke-width="2"/><circle cx="46.5" cy="43.5" r="1.6" fill="#fff"/>' +
        EYE(21, 38, 2.2) + EYE(29, 38, 2.2) + '<path d="M23 44q2 1.8 4 0" fill="none" stroke="#2f2a3d" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M56 4l1.5 3 3 1.5-3 1.5L56 13l-1.5-3-3-1.5 3-1.5z" fill="#fff"/>'),
      chest: svg('<ellipse cx="32" cy="27" rx="20" ry="9" fill="#fde047" opacity=".7"/><path d="M17 26l-6-8M47 26l6-8M32 22V9M24 23l-3-8M40 23l3-8" stroke="#fff59d" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M10 30h44v21a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#b45309"/><path d="M10 30h44v6H10z" fill="#92400e"/>' +
        '<path d="M12 30L15 15Q32 9 49 15L52 30z" fill="#d97706"/><path d="M15 15Q32 9 49 15l1 4Q32 13 14 19z" fill="#f59e0b"/>' +
        '<rect x="18" y="30" width="5" height="25" fill="#fbbf24"/><rect x="41" y="30" width="5" height="25" fill="#fbbf24"/><rect x="27" y="36" width="10" height="9" rx="2" fill="#fde047"/><circle cx="32" cy="40.5" r="1.8" fill="#92400e"/>' +
        '<path d="M32 15l5 5-5 6-5-6z" fill="#22d3ee"/><path d="M32 15l5 5h-10z" fill="#a5f3fc"/>'),
      badges: svg('<path d="M17 3h11l7 23H24z" fill="#3b82f6"/><path d="M47 3H36l-7 23h11z" fill="#ef4444"/><path d="M17 3h4l7 23h-4z" fill="#60a5fa"/>' +
        '<circle cx="32" cy="41" r="17" fill="#f59e0b"/><circle cx="32" cy="41" r="13" fill="#fde047"/>' +
        '<path d="M32 31l3 6.2 6.8 1-4.9 4.7 1.2 6.7L32 46.4l-6.1 3.2 1.2-6.7-4.9-4.7 6.8-1z" fill="#f59e0b"/><path d="M22 35q3-6 9-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>')
    };
  })();
  function waitPanel(host, onChange, game, ctx) {
    var box = document.createElement('section'); box.className = 'mlv-card mlv-wait';
    function paint() {
      var g = gems();
      box.innerHTML = '<h3>While you wait</h3><div class="mlv-waitg">' +
        '<button type="button" data-dive><span class="i">' + WAIT_ICONS.dive + '</span><b>Octo Dive</b><small>Reef loot · ⚡ Gimkit</small></button>' +
        '<button type="button" data-flap><span class="i">' + WAIT_ICONS.flap + '</span><b>Flappy Octo</b><small>Swim through coral · ⚡ Gimkit</small></button>' +
        '<button type="button" data-energy><span class="i">' + WAIT_ICONS.energy + '</span><b>Energy Rush</b><small>Energy out = answer</small></button>' +
        '<button type="button" data-bubble><span class="i">' + WAIT_ICONS.bubble + '</span><b>Bubble Pop</b><small>30 s · pop 💎 for gems</small></button>' +
        '<button type="button" data-chest' + (g >= CHEST_GEMS ? '' : ' class="dim"') + '><span class="i">' + WAIT_ICONS.chest + '</span><b>Open a chest</b><small>' + CHEST_GEMS + ' 💎 · win a badge</small></button>' +
        '<button type="button" data-album><span class="i">' + WAIT_ICONS.badges + '</span><b>My badges</b><small>' + Object.keys(albumMap()).length + '/' + CARDS.length + ' collected</small></button></div>' +
        '<div class="mlv-gems">💎 <b>' + g + '</b> gems</div>';
      $(box, '[data-bubble]').onclick = function () { bubblePop(function (won) { gems(won); paint(); if (onChange) onChange(); }); };
      $(box, '[data-dive]').onclick = function () { octoDive(function (won) { gems(won); paint(); if (onChange) onChange(); }, game, ctx); };
      $(box, '[data-flap]').onclick = function () { octoFlap(function (won) { gems(won); paint(); if (onChange) onChange(); }, game, ctx); };
      $(box, '[data-energy]').onclick = function () { energyRush(game, function (won) { gems(won); paint(); if (onChange) onChange(); }); };
      $(box, '[data-chest]').onclick = function () {
        if (gems() < CHEST_GEMS) { var b = this; b.classList.add('shake'); setTimeout(function () { b.classList.remove('shake'); }, 500); OCTO.act('thinking', 'Play Bubble Pop for 💎', 1800); return; }
        gems(-CHEST_GEMS); paint();
        openChestFree('wood', function () { paint(); });
      };
      $(box, '[data-album]').onclick = function () { showAlbum(); };
    }
    var paint0 = paint; paint = function () { paint0(); $$(box, '.mlv-tilecv').forEach(function (cv) { chestScene(cv, cv.getAttribute('data-tier'), true); }); };
    host.appendChild(box); paint();
    return { repaint: paint };
  }
  // ------------------------------------------------------------------ Study Arcade outside a live game (the teacher's board, practice):
  // the five games pay 💎 too, with a chest and the Locker one tap away (a live game pays its own way)
  var REWARD_MODES = { slice: 1, blast: 1, whack: 1, missing: 1, smash: 1 };
  window.addEventListener('minest:arcade-done', function (e) {
    var d = e.detail || {};
    if (!REWARD_MODES[d.mode] || document.querySelector('.mlv')) return;
    var got = Math.max(2, Math.min(20, 2 + Math.floor((d.score || 0) / 400) + (d.cleared ? 3 : 0) + Math.min(5, Math.floor((d.combo || 0) / 3))));
    gems(got);
    setTimeout(function () { arcadeReward(got, d); }, 900);
  });
  function arcadeReward(got, d) {
    ensureCss();
    var box = document.createElement('div'); box.className = 'mlv-res mlv-areward';
    box.innerHTML = '<div class="box"><div class="mlv-ar-ic">' + WAIT_ICONS.chest + '</div><h2>+' + got + ' 💎</h2>' +
      '<p>' + esc(levelInfo(d.mode).name) + ' · ⭐ ' + points(d.score || 0) + (d.combo > 1 ? ' · combo ×' + d.combo : '') + '<br>You have <b>' + gems() + ' 💎</b> — open chests, unlock animals and outfits.</p>' +
      '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-chest>🎁 Chest · ' + CHEST_GEMS + ' 💎</button><button class="mlv-btn alt" data-locker>👕 Locker</button><button class="mlv-btn alt" data-ok>OK</button></div></div>';
    document.body.appendChild(box); beep('win');
    var ch = $(box, '[data-chest]'); if (gems() < CHEST_GEMS) ch.disabled = true;
    ch.onclick = function () { if (gems() < CHEST_GEMS) return; gems(-CHEST_GEMS); box.remove(); openChestFree('wood', function () {}); };
    $(box, '[data-locker]').onclick = function () { box.remove(); openLocker(); };
    $(box, '[data-ok]').onclick = function () { box.remove(); };
  }
  // the Locker on its own (from the Arcade, from a reward)
  function openLocker() {
    ensureCss();
    var box = document.createElement('div'); box.className = 'mlv-res mlv-lockerbox';
    function paint() {
      box.innerHTML = '<div class="box" style="width:min(660px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;text-align:left;padding:18px">' + lockerHtml(localAv()) +
        '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-done>Done</button></div></div>';
      wireLocker(box, function (id) { if (id) localAv(id); }, paint);
      $(box, '[data-done]').onclick = function () { box.remove(); };
    }
    document.body.appendChild(box); paint();
  }

  // Two underwater mini-games for the wait (Octo is the real Mini Pet):
  //   Octo Dive — swim anywhere (drag / arrow keys), catch coins, pearls and chests in a row for a combo, dodge jellyfish;
  //   Flappy Octo — tap to swim up through coral gates, grab the pearl in each gap.
  // A bump never ends a run: it costs points and gives a short shield; only the clock ends it. Best scores are kept.
  // ⚡ Gimkit mode (when the game has cards): energy drains while you swim and on every bump; at zero a card comes up —
  // a right answer refills it and pays coins (more on a streak), a wrong one shows the answer and asks another.
  // In a live game everyone's score is on a live leaderboard (players/<id>/mini_<mode>), and the class sees it.
  var REEF_BEST = 'minest.live.reefBest.v1';
  function reefBest(mode, v) {
    var b = {}; try { b = JSON.parse(localStorage.getItem(REEF_BEST) || '{}') || {}; } catch (e) {}
    if (v != null && v > (b[mode] || 0)) { b[mode] = v; try { localStorage.setItem(REEF_BEST, JSON.stringify(b)); } catch (e) {} }
    return b[mode] || 0;
  }
  function octoReefGame(mode, done, game, room) {   // room: the live game (code, pid, name, av), if any
    ensureCss();
    var flap = mode === 'flap', title = flap ? 'Flappy Octo' : 'Octo Dive', DUR = flap ? 35 : 30, best0 = reefBest(mode);
    var deck = [];
    if (game && game.board && game.board.columns) game.board.columns.forEach(function (c) {
      (c.cards || []).forEach(function (k) {
        if (k && k.title && (k.desc || k.description)) deck.push({ title: String(k.title), answer: String(k.desc || k.description) });
        (k.stack || []).forEach(function (x) { if (x && x.title && (x.desc || x.description)) deck.push({ title: String(x.title), answer: String(x.desc || x.description) }); });
      });
    });
    var gk = false, energy = 100, streak = 0, correct = 0, asking = false, field = '', lbEl = null, lbW = null, lbRows = [], prevMine = 0, sentAt = 0, sentV = -1, lbAt = 0;
    var ov = document.createElement('div'); ov.className = 'mlv-of';
    ov.innerHTML = '<canvas></canvas><div class="hud"><span data-score>' + (flap ? '⭐ 0' : '🪙 0') + '</span><span data-time>⏱ ' + DUR + '</span><span data-energy hidden>⚡ 100</span><button type="button" data-x>✕</button></div><div class="mlv-of-lb" hidden></div>' +
      '<div class="panel"><div class="octo-mark">🐙</div><h2>' + title + '</h2><p>' + (flap
        ? 'Tap, click or press Space to swim up — let go to sink. Slip through the coral gates and grab the pearls. A bump costs a star, never the run.'
        : 'Drag Octo (or use the arrow keys) to swim anywhere. Coins +1, pearls +3, chests +5 — catch them in a row for a combo. Jellyfish sting: −2.') +
      '</p><div class="row"><button class="mlv-btn" data-start>Start ' + (flap ? 'swim' : 'dive') + '</button>' + (deck.length ? '<button class="mlv-btn mlv-gkbtn" data-gk>⚡ Gimkit mode</button>' : '') + '<button class="mlv-btn alt" data-cancel>Exit</button></div>' +
      (deck.length ? '<div class="tiny">⚡ Gimkit mode: energy runs down — at zero, answer a card to recharge. ' + deck.length + ' cards' + (room && room.code ? ' · live class leaderboard' : '') + '</div>' : '') + '<div class="tiny">' +
      (flap ? 'Tap, click or Space' : 'Touch and drag, or ← ↑ → ↓') + (best0 ? ' · Best ' + best0 : '') + '</div></div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('canvas'), ctx = cv.getContext('2d'), panel = ov.querySelector('.panel'), gamePet = OCTO.el(), W = 0, H = 0, dpr = 1;
    var started = false, armed = !flap, over = false, paused = false, raf = 0, score = 0, reward = 0, last = 0, elapsed = 0, next = 0, combo = 0, shield = 0, shake = 0, petActionAt = 0, lastPetX = 0, lastPetY = 0;
    var p = { x: 0, y: 0, vy: 0, r: 34 }, target = { x: 0, y: 0 }, things = [], parts = [], pops = [];
    var TOP = 58, floorY = function () { return H - 70; };
    // the pet follows the game frame by frame (its own .6 s glide would trail behind)
    if (gamePet) gamePet.style.transition = 'opacity .2s';
    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!started) { p.x = target.x = W * .27; p.y = target.y = H * .5; }
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function start(gkMode) {
      if (started || over) return;
      if (gkMode && deck.length) { gk = true; DUR = 60; energy = 100; ov.classList.add('mlv-er', 'mlv-gk'); ov.querySelector('[data-energy]').hidden = false; }
      field = 'mini_' + mode + (gk ? 'gk' : '');
      if (room && room.code && room.pid) startLb();
      started = true; panel.classList.add('hide'); last = performance.now(); elapsed = 0; next = 0; OCTO.act('free_swim', flap ? 'Tap to swim! 🐙' : 'Dive in! 🐙', 1400); raf = requestAnimationFrame(frame); }
    function flapUp() { if (!started || over || paused || asking) return; armed = true; p.vy = -330; beep('good'); }
    function petAct(name, text, cooldown) { var now = performance.now(); if (now - petActionAt < (cooldown || 650)) return; petActionAt = now; OCTO.act(name, text, 900); }
    function sMul() { return gk ? 1 + Math.min(10, streak) * 0.1 : 1; }
    function pop(x, y, text, color) { pops.push({ x: x, y: y, t: 0, text: text, color: color || '#fef08a' }); }
    function burst(x, y, color, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 170; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: .45 + Math.random() * .35, color: color }); } }
    function ouch(lose, text) {
      if (shield > 0) return false;
      if (gk) {   // Gimkit: a bump costs energy, not coins
        energy = Math.max(0, energy - 18); combo = 0; shield = 1.1; shake = .35;
        pop(p.x, p.y - 40, '−18 ⚡', '#fda4af'); burst(p.x, p.y, '#fb7185', 12); beep('bad'); petAct('confused', 'Ouch!', 250);
        return true;
      }
      score = Math.max(0, score - lose); combo = 0; shield = 1.1; shake = .35;
      pop(p.x, p.y - 40, text, '#fda4af'); burst(p.x, p.y, '#fb7185', 12); beep('bad'); petAct('confused', 'Ouch!', 250);
      return true;
    }

    // ---- the reef
    function background(t) {
      // a cartoon sea (bright and flat, like the rest of Minest Live): soft rays, two rows of round hills sliding by,
      // a sandy floor with kelp, round coral, rocks, starfish and shells, white-rimmed bubbles
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6be0ff'); g.addColorStop(.5, '#2bbcf2'); g.addColorStop(1, '#1d93e6'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#fff';
      for (var i = -1; i < 8; i++) { var sx = i * W / 6 + Math.sin(t * .0003 + i) * 22; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 44, 0); ctx.lineTo(sx + 175, H * .82); ctx.lineTo(sx + 112, H * .82); ctx.fill(); }
      ctx.restore();
      function hills(speed, step, top, low, col) {
        var off = (t * speed) % step; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-off - step, H);
        for (var x = -off - step; x < W + step; x += step) { ctx.lineTo(x, H - low); ctx.quadraticCurveTo(x + step / 2, H - top, x + step, H - low); }
        ctx.lineTo(W + step, H); ctx.closePath(); ctx.fill();
      }
      hills(.008, 300, 230, 150, '#5ac8f5'); hills(.016, 220, 165, 110, '#3fa9ec');
      // the sand
      var floor = H - 60, drift = (t * .03) % 150;
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.moveTo(0, H);
      for (var x2 = -drift - 150; x2 < W + 150; x2 += 75) ctx.quadraticCurveTo(x2 + 37, floor - 12, x2 + 75, floor);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f5bf5c'; for (var d = 0; d < 26; d++) { var dx = ((d * 97 + 31) - drift * 1.0 + W * 2) % (W + 20), dy = floor + 14 + (d % 4) * 9; ctx.beginPath(); ctx.ellipse(dx, dy, 4 + d % 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }
      // things on the floor, every 150 px, sliding with the sand
      for (var k = -1; k < W / 150 + 2; k++) {
        var n = ((k + Math.floor(t * .03 / 150)) % 6 + 6) % 6, bx = k * 150 + 40 - drift, by = floor + 4;
        ctx.save(); ctx.translate(bx, by);
        if (n === 0 || n === 3) {   // kelp: two thick green ribbons swaying
          ctx.lineCap = 'round';
          [['#22c55e', -8, 92], ['#16a34a', 9, 70]].forEach(function (q) {
            ctx.strokeStyle = q[0]; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(q[1], 0);
            for (var s = 1; s <= 4; s++) ctx.lineTo(q[1] + Math.sin(t * .002 + s + q[1]) * 7, -q[2] * s / 4);
            ctx.stroke();
          });
        } else if (n === 1 || n === 4) {   // round coral
          var cc = n === 1 ? ['#ff6b9a', '#e0457a'] : ['#b26bff', '#8b45e6'];
          ctx.fillStyle = cc[1]; ctx.fillRect(-5, -38, 10, 38);
          [[0, -46, 15], [-17, -30, 11], [17, -32, 12], [-8, -62, 9], [10, -60, 8]].forEach(function (b) { ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(b[0] - b[2] * .35, b[1] - b[2] * .35, b[2] * .3, 0, Math.PI * 2); ctx.fill(); });
        } else if (n === 2) {   // a rock with a starfish
          ctx.fillStyle = '#7c6fd6'; ctx.beginPath(); ctx.ellipse(0, -12, 34, 20, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-12, -22, 10, 5, -.3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff9d00'; ctx.beginPath(); for (var a = 0; a < 10; a++) { var ang = -Math.PI / 2 + a * Math.PI / 5, r = a % 2 ? 5 : 12; ctx.lineTo(26 + Math.cos(ang) * r, -4 + Math.sin(ang) * r); } ctx.closePath(); ctx.fill();
        } else {   // a shell
          ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -30, 14, 0); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#ff6b9a'; ctx.lineWidth = 2; for (var r2 = -2; r2 <= 2; r2++) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(r2 * 6, -16 + Math.abs(r2) * 4); ctx.stroke(); }
        }
        ctx.restore();
      }
      // bubbles
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
      for (var b2 = 0; b2 < 16; b2++) { var bx2 = (b2 * 137 + t * .018) % (W + 30), by2 = H - 80 - ((b2 * 67 + t * .035) % Math.max(150, H - 150)), rr = 3 + b2 % 4; ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(bx2, by2, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    // a coral pillar from y0 to y1 with its rounded cap at the gap side (flat candy pink, a darker side, a shine)
    function coral(x, w, y0, y1, capDown, hot) {
      if (y1 - y0 < 4) return;
      var r = w / 2, base = hot ? '#ffb3c6' : '#ff6b9a', side = hot ? '#ff8fb1' : '#e0457a';
      function shape() {
        ctx.beginPath();
        if (capDown) { ctx.moveTo(x, y0); ctx.lineTo(x, y1 - r); ctx.arc(x + r, y1 - r, r, Math.PI, 0, true); ctx.lineTo(x + w, y0); }
        else { ctx.moveTo(x, y1); ctx.lineTo(x, y0 + r); ctx.arc(x + r, y0 + r, r, Math.PI, 0); ctx.lineTo(x + w, y1); }
        ctx.closePath();
      }
      ctx.save(); shape(); ctx.fillStyle = base; ctx.fill(); ctx.clip();
      ctx.fillStyle = side; ctx.fillRect(x + w * .7, y0 - 2, w * .3 + 2, y1 - y0 + 4);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x + w * .14, y0, w * .13, y1 - y0);
      ctx.fillStyle = 'rgba(160,20,80,.28)'; for (var yy = y0 + 16; yy < y1 - 10; yy += 28) { ctx.beginPath(); ctx.arc(x + w * .5 + ((yy / 28) % 2) * 7 - 3, yy, 4.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    function drawThing(o, t) {
      if (o.gate) {
        coral(o.x, o.w, -10, o.top, true, o.hitAt && t - o.hitAt < 300); coral(o.x, o.w, o.top + o.gap, floorY() + 12, false, o.hitAt && t - o.hitAt < 300);
        if (!o.pearl) return;
        o = { x: o.x + o.w / 2, y: o.top + o.gap / 2 + Math.sin(t * .004 + o.x * .01) * 6, kind: 'pearl', inGate: true };
      }
      ctx.save(); ctx.translate(o.x, o.y);
      if (o.kind === 'coin') {
        var sx = Math.abs(Math.cos(t * .006 + o.ph)); ctx.scale(Math.max(.25, sx), 1);
        var cg = ctx.createRadialGradient(-5, -6, 2, 0, 0, 18); cg.addColorStop(0, '#fef9c3'); cg.addColorStop(.5, '#facc15'); cg.addColorStop(1, '#a16207');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#854d0e'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 1);
      } else if (o.kind === 'pearl') {
        if (!o.inGate) { ctx.fillStyle = '#f9a8d4'; ctx.beginPath(); ctx.moveTo(-22, 8); for (var k = 0; k <= 6; k++) { var a = Math.PI + k * Math.PI / 6; ctx.lineTo(Math.cos(a) * 24, 8 + Math.sin(a) * 20); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(157,23,77,.5)'; ctx.lineWidth = 1.5; for (var k2 = 1; k2 < 6; k2++) { var a2 = Math.PI + k2 * Math.PI / 6; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(Math.cos(a2) * 22, 8 + Math.sin(a2) * 18); ctx.stroke(); } }
        var pg = ctx.createRadialGradient(-4, -6, 1, 0, -2, 13); pg.addColorStop(0, '#ffffff'); pg.addColorStop(.6, '#fae8ff'); pg.addColorStop(1, '#d8b4fe');
        ctx.shadowColor = '#f0abfc'; ctx.shadowBlur = 16; ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, -2, 11, 0, Math.PI * 2); ctx.fill();
      } else if (o.kind === 'chest') {
        ctx.shadowColor = '#fde047'; ctx.shadowBlur = 18 + Math.sin(t * .008) * 8;
        ctx.fillStyle = '#92400e'; ctx.fillRect(-23, -6, 46, 24); ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.moveTo(-23, -6); ctx.quadraticCurveTo(0, -26, 23, -6); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fbbf24'; ctx.fillRect(-23, -3, 46, 4); ctx.fillRect(-14, -16, 4, 34); ctx.fillRect(10, -16, 4, 34); ctx.fillStyle = '#fde68a'; ctx.fillRect(-4, 2, 8, 9);
      } else {   // jellyfish
        var tg = ctx.createRadialGradient(0, -10, 2, 0, -4, 24); tg.addColorStop(0, 'rgba(250,232,255,.95)'); tg.addColorStop(1, 'rgba(192,132,252,.75)');
        ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 18; ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(0, -4, 22, Math.PI, 0); ctx.quadraticCurveTo(22, 6, 14, 6); ctx.lineTo(-14, 6); ctx.quadraticCurveTo(-22, 6, -22, -4); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(233,213,255,.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (var tt = -2; tt <= 2; tt++) { ctx.beginPath(); ctx.moveTo(tt * 7, 6); for (var s = 1; s <= 4; s++) ctx.lineTo(tt * 7 + Math.sin(t * .008 + s + tt) * 4, 6 + s * 7); ctx.stroke(); }
        ctx.fillStyle = '#581c87'; ctx.beginPath(); ctx.arc(-7, -6, 2.2, 0, Math.PI * 2); ctx.arc(7, -6, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawPlayer(t) {
      var blink = shield > 0 && Math.floor(t / 90) % 2 === 0;
      if (gamePet) {
        var pw = gamePet.offsetWidth || 112, ph = gamePet.offsetHeight || 112;
        var dx = p.x - lastPetX, dy = p.y - lastPetY; lastPetX = p.x; lastPetY = p.y;
        gamePet.style.left = Math.max(0, p.x - pw / 2) + 'px'; gamePet.style.top = Math.max(44, p.y - ph / 2) + 'px'; gamePet.style.zIndex = '2147483450'; gamePet.style.pointerEvents = 'none'; gamePet.style.opacity = blink ? '.4' : '1';
        gamePet.style.setProperty('--game-drift', (flap ? clamp(p.vy / 30, -14, 18) : clamp(dx * .5, -8, 8)) + 'deg');
        if (Math.abs(dx) + Math.abs(dy) > 2 && performance.now() - petActionAt > 1050) petAct(dy > 2 && Math.abs(dy) > Math.abs(dx) ? 'dive_down' : 'free_swim', null, 1050);
        return;
      }
      if (blink) return;
      ctx.save(); ctx.font = '52px Apple Color Emoji, Segoe UI Emoji, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(p.x, p.y); if (flap) ctx.rotate(clamp(p.vy / 900, -.35, .5)); ctx.fillText('🐙', 0, 0); ctx.restore();
    }
    function drawFx(dt) {
      parts.forEach(function (q) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 240 * dt; ctx.globalAlpha = Math.max(0, 1 - q.t / q.life); ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill(); });
      parts = parts.filter(function (q) { return q.t < q.life; });
      ctx.textAlign = 'center'; ctx.font = '900 22px system-ui, -apple-system, sans-serif';
      pops.forEach(function (q) { q.t += dt; ctx.globalAlpha = Math.max(0, 1 - q.t / .9); ctx.fillStyle = q.color; ctx.strokeStyle = 'rgba(2,6,23,.55)'; ctx.lineWidth = 4; var y = q.y - q.t * 60; ctx.strokeText(q.text, q.x, y); ctx.fillText(q.text, q.x, y); });
      pops = pops.filter(function (q) { return q.t < .9; }); ctx.globalAlpha = 1;
    }

    // ---- Flappy Octo
    function addGate() {
      var gap = clamp(H * .38 - elapsed * 1.6, 180, 270), lo = TOP + 40, hi = floorY() - gap - 40;
      things.push({ gate: true, x: W + 30, w: 66, gap: gap, top: lo + Math.random() * Math.max(10, hi - lo), passed: false, pearl: true, hitAt: 0 });
    }
    function stepFlap(dt, now) {
      if (!armed) { p.y = H * .5 + Math.sin(now * .004) * 10; p.vy = 0; return; }   // hover until the first tap; the reef waits too
      var speed = 165 + elapsed * 2.4, lastGate = things[things.length - 1];
      if (!lastGate || lastGate.x < W - clamp(330 - elapsed * 2, 250, 330)) addGate();
      p.vy = Math.min(460, p.vy + 780 * dt); p.y += p.vy * dt;
      if (p.y < TOP + p.r) { p.y = TOP + p.r; p.vy = Math.max(p.vy, 40); }                    // the surface: a soft ceiling
      if (p.y > floorY() - p.r) { p.y = floorY() - p.r; p.vy = -300; ouch(1, '−1'); }          // the reef floor: bounce
      things.forEach(function (o) {
        o.x -= speed * dt; drawThing(o, now);
        if (!o.passed && o.x + o.w < p.x - p.r) { o.passed = true; var g1 = gk ? Math.round(2 * sMul()) : 1; score += g1; reward++; combo++; pop(p.x, p.y - 44, '+' + g1, '#fef08a'); beep('good'); petAct('excited', combo >= 5 ? combo + ' in a row!' : null, 400); }
        var hx = p.x + p.r * .78 > o.x && p.x - p.r * .78 < o.x + o.w, hy = p.y - p.r * .78 < o.top || p.y + p.r * .78 > o.top + o.gap;
        if (hx && hy && ouch(1, '−1')) { o.hitAt = now; p.vy = p.y < o.top + o.gap / 2 ? 140 : -220; }
        if (o.pearl && Math.abs(p.x - (o.x + o.w / 2)) < p.r + 10 && Math.abs(p.y - (o.top + o.gap / 2)) < p.r + 10) { o.pearl = false; score++; reward++; pop(p.x, p.y - 44, '🫧 +1', '#f5d0fe'); burst(o.x + o.w / 2, o.top + o.gap / 2, '#f5d0fe', 10); beep('buy'); }
      });
      things = things.filter(function (o) { return o.x > -o.w - 20; });
    }

    // ---- Octo Dive
    function addDive() {
      var r = Math.random(), jelly = .2 + Math.min(.12, elapsed * .004), kind = r < jelly ? 'jelly' : r < jelly + .09 ? 'chest' : r < jelly + .31 ? 'pearl' : 'coin';
      var y = TOP + 30 + Math.random() * Math.max(100, floorY() - TOP - 80);
      things.push({ x: W + 40, y: y, y0: y, r: kind === 'jelly' ? 24 : kind === 'chest' ? 24 : 20, kind: kind, ph: Math.random() * 6, amp: kind === 'jelly' ? 34 : 10 });
    }
    function stepDive(dt, now) {
      if (now > next) { addDive(); next = now + Math.max(360, 820 - elapsed * 14); }
      p.x += (target.x - p.x) * Math.min(1, dt * 7); p.y += (target.y - p.y) * Math.min(1, dt * 7);
      p.x = clamp(p.x, 60, W * .78); p.y = clamp(p.y, TOP + p.r, floorY() - p.r);
      var speed = 150 + elapsed * 5;
      things.forEach(function (o) {
        o.x -= speed * dt * (o.kind === 'jelly' ? .8 : 1); o.y = o.y0 + Math.sin(now * .0024 + o.ph) * o.amp; drawThing(o, now);
        var dx = p.x - o.x, dy = p.y - o.y; if (o.hit || dx * dx + dy * dy > (p.r + o.r) * (p.r + o.r)) return;
        if (o.kind === 'jelly') { if (ouch(2, '−2')) o.hit = true; return; }
        o.hit = true; combo++;
        var mult = Math.min(3, 1 + Math.floor(combo / 5)), base = o.kind === 'chest' ? 5 : o.kind === 'pearl' ? 3 : 1;
        var got = Math.round(base * mult * sMul()); score += got; reward += o.kind === 'chest' ? 4 : o.kind === 'pearl' ? 2 : 1;
        pop(o.x, o.y - 26, '+' + got + (mult > 1 ? ' ×' + mult : ''), o.kind === 'chest' ? '#fde047' : o.kind === 'pearl' ? '#f5d0fe' : '#fef08a');
        burst(o.x, o.y, o.kind === 'chest' ? '#fde047' : o.kind === 'pearl' ? '#f5d0fe' : '#facc15', o.kind === 'chest' ? 18 : 9);
        beep(o.kind === 'chest' ? 'win' : 'good');
        if (o.kind === 'chest') petAct('excited', 'Treasure!', 300); else if (combo % 5 === 0) petAct('excited', 'Combo ×' + mult + '!', 300); else petAct('hop', null, 500);
      });
      things = things.filter(function (o) { return !o.hit && o.x > -60; });
    }

    function frame(now) {
      if (over) return;
      if (paused) { last = now; raf = requestAnimationFrame(frame); return; }
      if (asking) return;
      var dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; shield = Math.max(0, shield - dt); shake = Math.max(0, shake - dt);
      if (gk && armed) { energy -= (flap ? 5 : 6) * dt; if (energy <= 0) { energy = 0; hudGk(); ask(); return; } }
      ctx.save(); if (shake > 0) ctx.translate((Math.random() - .5) * 12 * shake / .35, (Math.random() - .5) * 12 * shake / .35);
      background(now);
      if (flap) stepFlap(dt, now); else stepDive(dt, now);
      drawFx(dt); ctx.restore(); drawPlayer(now);
      ov.querySelector('[data-score]').textContent = (flap ? '⭐ ' : '🪙 ') + score + (combo >= 5 && !flap ? ' · ×' + Math.min(3, 1 + Math.floor(combo / 5)) : '');
      ov.querySelector('[data-time]').textContent = flap && !armed ? 'Tap to swim' : '⏱ ' + Math.max(0, Math.ceil(DUR - elapsed));
      if (flap && !armed) elapsed = Math.max(0, elapsed - dt);   // the clock waits for the first tap
      if (gk) hudGk();
      if (lbEl && now - sentAt > 1200) { sentAt = now; publish(); }
      if (lbEl && now - lbAt > 500) { lbAt = now; paintLb(); }
      if (elapsed >= DUR) return end(false);
      raf = requestAnimationFrame(frame);
    }
    function hudGk() { var en = ov.querySelector('[data-energy]'); en.textContent = '⚡ ' + Math.ceil(energy) + (streak > 1 ? ' · 🔥' + streak : ''); en.style.color = energy < 25 ? '#fda4af' : ''; }
    function short(a) { a = String(a || '').replace(/\s+/g, ' ').trim(); return a.length > 90 ? a.slice(0, 88) + '…' : a; }
    function norm(v) { return String(v == null ? '' : v).toLowerCase().replace(/[\s\u3000\u00a0.,!?;:'"()\[\]{}，。！？；：“”‘’（）【】]/g, ''); }
    function answerOK(input, expected) { var a = norm(input), b = norm(expected).split(/\n|·|•|\/|;/)[0]; return a.length >= 2 && b.length >= 2 && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0); }
    // energy is out: one card, four answers (Gimkit style); typed when the deck is too small for choices
    function ask() {
      if (over) return; asking = true; cancelAnimationFrame(raf);
      // Octo swims to the corner while the card is up (it would sit on the answers)
      if (gamePet) { gamePet.style.transition = 'left .45s ease, top .45s ease, opacity .2s'; gamePet.style.left = Math.max(0, W - (gamePet.offsetWidth || 112) - 6) + 'px'; gamePet.style.top = Math.max(60, H - (gamePet.offsetHeight || 112) - 6) + 'px'; gamePet.style.opacity = '1'; }
      var q = deck[Math.floor(Math.random() * deck.length)], pool = [];
      deck.forEach(function (d) { if (norm(d.answer) !== norm(q.answer) && pool.indexOf(d.answer) < 0) pool.push(d.answer); });
      var opts = [q.answer]; while (opts.length < 4 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      opts.sort(function () { return Math.random() - 0.5; });
      var mc = opts.length >= 2;
      panel.classList.remove('hide');
      panel.innerHTML = '<div class="octo-mark">⚡</div><h2>Out of energy!</h2><div class="energybar"><i style="width:0%"></i></div><div class="qbox"><h3>Answer to recharge</h3><p>' + esc(q.title) + '</p></div>' +
        (mc ? '<div class="mlv-gkopts">' + opts.map(function (a, i) { return '<button type="button" data-o="' + i + '">' + esc(short(a)) + '</button>'; }).join('') + '</div>'
            : '<input class="answer" data-answer autocomplete="off" placeholder="Type the answer"><div class="row"><button class="mlv-btn" data-submit>Recharge ⚡</button></div>') +
        '<div class="feedback" data-fb>' + (streak ? '🔥 Streak ' + streak + ' — keep it going!' : 'A right answer refills ⚡ and pays 🪙 (more on a streak)') + '</div>';
      var fb = panel.querySelector('[data-fb]');
      function resume() { if (over) return; if (gamePet) gamePet.style.transition = 'opacity .2s'; panel.classList.add('hide'); asking = false; shield = 1; last = performance.now(); raf = requestAnimationFrame(frame); }
      function right() {
        correct++; streak++; var bonus = 8 + streak * 4; score += bonus; reward += 2; energy = 100; hudGk();
        panel.querySelector('.energybar i').style.width = '100%'; fb.textContent = '✓ +' + bonus + ' 🪙 · energy full!'; fb.style.color = '#86efac';
        beep('win'); OCTO.act('excited', streak >= 3 ? streak + ' in a row! 🔥' : 'Recharged! ⚡', 1400); setTimeout(resume, 750);
      }
      function wrong() {
        streak = 0; score = Math.max(0, score - 5); fb.textContent = 'Answer: ' + short(q.answer) + ' — try another card'; fb.style.color = '#fda4af';
        beep('bad'); OCTO.act('thinking', 'Next one!', 1200); setTimeout(function () { if (!over) ask(); }, 1600);
      }
      if (mc) $$(panel, '[data-o]').forEach(function (b) {
        b.onclick = function () {
          if (panel.querySelector('.ok, .no')) return;
          if (opts[+b.getAttribute('data-o')] === q.answer) { b.classList.add('ok'); right(); }
          else { b.classList.add('no'); $$(panel, '[data-o]').forEach(function (x) { if (opts[+x.getAttribute('data-o')] === q.answer) x.classList.add('ok'); }); wrong(); }
        };
      });
      else { var inp = panel.querySelector('[data-answer]'), chk = function () { if (answerOK(inp.value, q.answer)) right(); else wrong(); }; panel.querySelector('[data-submit]').onclick = chk; inp.onkeydown = function (e) { e.stopPropagation(); if (e.key === 'Enter') chk(); }; inp.focus(); }
    }
    // the live leaderboard: everyone in this game, best score in this mode (players/<id>/mini_<mode>)
    function startLb() {
      lbEl = ov.querySelector('.mlv-of-lb'); lbEl.hidden = false;
      lbW = watch(room.code + '/players', function (ps) {
        lbRows = Object.keys(ps || {}).map(function (k) { var q = ps[k] || {}; return { id: k, n: q.name || 'Player', av: q.av, v: +q[field] || 0 }; });
        lbRows.forEach(function (x) { if (x.id === room.pid) prevMine = Math.max(prevMine, x.v); });
        paintLb();
      });
    }
    function publish() {
      var v = Math.max(prevMine, score); if (v === sentV || !room) return; sentV = v;
      var b = {}; b[field] = v; db(room.code + '/players/' + room.pid, 'PATCH', b).catch(function () {});
    }
    function paintLb() {
      if (!lbEl) return;
      var mine = Math.max(prevMine, score), rows = lbRows.filter(function (x) { return x.v > 0 && x.id !== room.pid; });
      rows.push({ id: room.pid, n: room.name || 'You', av: room.av, v: mine });
      rows.sort(function (a, b) { return b.v - a.v; });
      var mi = 0; rows.forEach(function (x, i) { if (x.id === room.pid) mi = i; });
      function row(x, i) { return '<div class="r' + (x.id === room.pid ? ' me' : '') + '"><span class="k">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)) + '</span><i>' + avHtml(x.av) + '</i><span class="n">' + esc(x.n) + (x.id === room.pid ? ' (you)' : '') + '</span><b>' + x.v + '</b></div>'; }
      lbEl.innerHTML = '<h5>🏆 Live · ' + title + (gk ? ' ⚡' : '') + '</h5>' + rows.slice(0, 5).map(row).join('') + (mi >= 5 ? '<div class="sep">⋯</div>' + row(rows[mi], mi) : '');
    }
    function cleanup() { if (lbW) { publish(); lbW.close(); lbW = null; } window.removeEventListener('keydown', key); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); if (gamePet) gamePet.style.opacity = ''; }
    function end(quit) {
      if (over) return; over = true; cancelAnimationFrame(raf); cleanup();
      if (quit) { ov.remove(); OCTO.place('stage'); done(0); return; }
      reward = clamp(gk ? Math.floor(score / 6) + correct * 2 : reward, 1, gk ? 40 : 30); var isBest = score > best0; reefBest(mode + (gk ? 'gk' : ''), score);
      OCTO.place('show');   // Octo glides back from where it swam, below the result
      panel.classList.remove('hide');
      panel.innerHTML = '<div class="octo-mark">🐙</div><h2>' + (isBest ? 'New best!' : flap ? (score >= 10 ? 'Great swim!' : 'Keep swimming!') : (score >= 40 ? 'Treasure hunter!' : 'Dive complete!')) + '</h2><div class="score-big">' + score + '</div>' +
        '<p>' + (gk ? correct + ' right answers · ' : '') + (best0 && !isBest ? 'Best ' + best0 + ' · ' : '') + 'You earned ' + reward + ' 💎 from the reef.</p><div class="row"><button class="mlv-btn" data-collect>Collect +' + reward + ' 💎</button><button class="mlv-btn alt" data-again>Play again</button><button class="mlv-btn alt" data-close>Exit</button></div>';
      OCTO.cheer(isBest || score >= (flap ? 10 : 40));
      panel.querySelector('[data-collect]').onclick = function () { ov.remove(); OCTO.place('stage'); done(reward); };
      panel.querySelector('[data-again]').onclick = function () { ov.remove(); done(reward); octoReefGame(mode, done, game, room); };
      panel.querySelector('[data-close]').onclick = function () { ov.remove(); OCTO.place('stage'); done(0); };
    }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); end(true); return; }
      if (asking) return;
      if (e.key !== ' ' && e.key.indexOf('Arrow') !== 0) return;
      e.preventDefault(); if (!started) start();
      if (flap) { if (e.key === ' ' || e.key === 'ArrowUp') flapUp(); return; }
      var s = 80;
      if (e.key === 'ArrowUp') target.y -= s; else if (e.key === 'ArrowDown') target.y += s; else if (e.key === 'ArrowLeft') target.x -= s; else if (e.key === 'ArrowRight') target.x += s;
      target.x = clamp(target.x, 60, W * .78); target.y = clamp(target.y, TOP + p.r, floorY() - p.r);
    }
    function vis() { paused = document.hidden; }
    ov.querySelector('[data-start]').onclick = function () { start(false); };
    var gkb = ov.querySelector('[data-gk]'); if (gkb) gkb.onclick = function () { start(true); }; ov.querySelector('[data-cancel]').onclick = function () { end(true); }; ov.querySelector('[data-x]').onclick = function () { end(true); };
    cv.addEventListener('pointerdown', function (e) { if (asking) return; if (!started) start(false); if (flap) { flapUp(); OCTO.act('bounce'); } else { target.x = e.clientX; target.y = e.clientY; } });
    cv.addEventListener('pointermove', function (e) { if (!flap && (e.buttons || e.pointerType === 'touch')) { target.x = e.clientX; target.y = e.clientY; } });
    window.addEventListener('keydown', key); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', vis); resize(); OCTO.place('show');
  }
  function octoDive(done, game, ctx) { octoReefGame('dive', done, game, ctx); }
  function octoFlap(done, game, ctx) { octoReefGame('flap', done, game, ctx); }

  (function () {
    var st = document.createElement('style'); st.id = 'mlv-gk-css';
    st.textContent = [
      '.mlv-btn.mlv-gkbtn{background:linear-gradient(135deg,#fde047,#f97316);color:#1c1003}',
      '.mlv-of .hud [data-energy]{min-width:74px}',
      '.mlv-of-lb{position:absolute;right:12px;top:62px;z-index:3;width:min(220px,46vw);padding:8px 10px;border-radius:14px;background:rgba(2,6,23,.6);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#e2e8f0;font:600 12px system-ui,-apple-system,sans-serif;pointer-events:none;box-shadow:0 8px 22px rgba(0,0,0,.35)}',
      '.mlv-of-lb h5{margin:0 0 5px;font-size:12px;color:#fde68a}.mlv-of-lb .r{display:flex;align-items:center;gap:6px;padding:2px 0}.mlv-of-lb .r.me{color:#86efac}',
      '.mlv-of-lb .k{width:22px;text-align:center}.mlv-of-lb .r i{width:22px;height:22px;flex:none;font-style:normal}.mlv-of-lb .r i svg,.mlv-of-lb .r i img{width:100%;height:100%;display:block}',
      '.mlv-of-lb .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mlv-of-lb .r b{font-variant-numeric:tabular-nums}.mlv-of-lb .sep{text-align:center;opacity:.5;line-height:1}',
      '.mlv-gkopts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 8px}',
      '.mlv-gkopts button{min-height:62px;padding:10px 12px;border-radius:14px;border:0;color:#fff;font:800 14px/1.25 system-ui,-apple-system,sans-serif;text-align:left;cursor:pointer;box-shadow:inset 0 -4px 0 rgba(0,0,0,.22);transition:transform .12s,opacity .2s}',
      '.mlv-gkopts button:nth-child(1){background:#2563eb}.mlv-gkopts button:nth-child(2){background:#16a34a}.mlv-gkopts button:nth-child(3){background:#ea580c}.mlv-gkopts button:nth-child(4){background:#9333ea}',
      '.mlv-gkopts button:active{transform:scale(.97)}.mlv-gkopts button.ok{box-shadow:0 0 0 4px #86efac,inset 0 -4px 0 rgba(0,0,0,.22)}.mlv-gkopts button.no{opacity:.4}',
      '@media (max-width:520px){.mlv-gkopts{grid-template-columns:1fr}.mlv-of-lb{top:auto;bottom:12px}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  })();


  // Bubble Pop: bubbles rise, tap them; 💎 = gems, 🌟 = 5, 💣 = −3; Octo cheers combos
  // Gimkit-style energy loop: the real Mini Pet plays until energy reaches zero, then a card must be answered.
  function energyRush(game, done) {
    ensureCss();
    var deck = [];
    if (game && game.board && game.board.columns) game.board.columns.forEach(function (c) {
      (c.cards || []).forEach(function (k) {
        if (k && k.title && (k.desc || k.description)) deck.push({ title: String(k.title), answer: String(k.desc || k.description) });
        (k.stack || []).forEach(function (x) { if (x && x.title && (x.desc || x.description)) deck.push({ title: String(x.title), answer: String(x.desc || x.description) }); });
      });
    });
    var ov = document.createElement('div'); ov.className = 'mlv-of mlv-er';
    ov.innerHTML = '<canvas></canvas><div class="hud"><span data-energy>⚡ 100</span><span data-coins>🪙 0</span><span data-streak>🔥 0</span><button type="button" data-shop>🛒</button><button type="button" data-x>✕</button></div><div class="panel"></div><div class="tiny" data-help style="position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:3">Move Octo to collect energy cells. When energy is empty, answer the card to keep playing.</div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('canvas'), ctx = cv.getContext('2d'), panel = ov.querySelector('.panel'), pet = OCTO.el();
    var W = 0, H = 0, dpr = 1, raf = 0, over = false, phase = 'intro', last = 0, elapsed = 0, next = 0, target = { x: 0, y: 0 };
    var p = { x: 0, y: 0, r: 40 }, things = [], energy = 100, maxEnergy = 100, drain = 7, coins = 0, reward = 0, streak = 0, question = null, lastPetAction = 0;
    function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!target.x) { target.x = W * .27; target.y = H * .5; } if (!p.x) { p.x = target.x; p.y = target.y; } }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function norm(v) { return String(v == null ? '' : v).toLowerCase().replace(/[\s\u3000\u00a0\.,!?;:'"()\[\]{}，。！？；：“”‘’（）【】]/g, ''); }
    function answerOK(input, expected) { var a = norm(input), b = norm(expected).split(/\n|·|•|\/|;/)[0]; return a.length >= 2 && b.length >= 2 && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0); }
    function hud() { ov.querySelector('[data-energy]').textContent = '⚡ ' + Math.ceil(energy) + '/' + maxEnergy; ov.querySelector('[data-coins]').textContent = '🪙 ' + coins; ov.querySelector('[data-streak]').textContent = '🔥 ' + streak; }
    function showIntro() {
      panel.classList.remove('hide'); panel.innerHTML = '<div class="octo-mark">🐙</div><h2>Energy Rush</h2><p>Collect coins and energy with Octo. When energy reaches zero, answer a card from your teacher to recharge and keep your streak.</p><div class="row"><button class="mlv-btn" data-start>Start rush</button><button class="mlv-btn alt" data-cancel>Exit</button></div><div class="tiny">' + (deck.length ? deck.length + ' cards loaded from this game' : 'Join a game first to load its cards') + '</div>';
      var b = panel.querySelector('[data-start]'); b.disabled = !deck.length; b.onclick = start; panel.querySelector('[data-cancel]').onclick = function () { finish(true); };
    }
    function start() { if (!deck.length) return; phase = 'play'; panel.classList.add('hide'); ov.querySelector('[data-help]').hidden = false; last = performance.now(); next = 0; OCTO.act('sprint', 'Energy up! ⚡', 1500); raf = requestAnimationFrame(frame); }
    function spawn() { var r = Math.random(), kind = r < .18 ? 'hazard' : r < .53 ? 'cell' : 'coin'; things.push({ x: W + 32, y: 75 + Math.random() * Math.max(100, H - 190), r: kind === 'hazard' ? 24 : 19, kind: kind, hit: false }); }
    function background(t) {
      var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#12123c'); g.addColorStop(.5, '#123b67'); g.addColorStop(1, '#075985'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = .22; ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; for (var i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i * 160 + t * .02) % (W + 100), 100 + (i % 4) * 120, 34 + (i % 3) * 10, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.28)'; for (var b = 0; b < 18; b++) { var bx = (b * 97 + t * .04) % W, by = (b * 53 + t * .025) % H; ctx.beginPath(); ctx.arc(bx, by, 2 + b % 3, 0, Math.PI * 2); ctx.fill(); }
    }
    function drawThing(o) { ctx.save(); ctx.translate(o.x, o.y); if (o.kind === 'coin') { ctx.fillStyle = '#facc15'; ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#713f12'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('¢', 0, 5); } else if (o.kind === 'cell') { ctx.fillStyle = '#34d399'; ctx.shadowColor = '#6ee7b7'; ctx.shadowBlur = 18; ctx.rotate(Math.PI / 4); ctx.fillRect(-13, -13, 26, 26); ctx.fillStyle = '#ecfdf5'; ctx.fillRect(-4, -10, 8, 20); } else { ctx.fillStyle = '#fb7185'; ctx.shadowColor = '#fda4af'; ctx.shadowBlur = 20; for (var i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(12, -5, 18, 10); } ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    function movePet() { if (!pet) return; var pw = pet.offsetWidth || 152, ph = pet.offsetHeight || 152, dx = p.x - (movePet._x || p.x), dy = p.y - (movePet._y || p.y); movePet._x = p.x; movePet._y = p.y; pet.style.left = Math.max(0, p.x - pw / 2) + 'px'; pet.style.top = Math.max(45, p.y - ph / 2) + 'px'; pet.style.zIndex = '2147483450'; pet.style.pointerEvents = 'none'; pet.style.opacity = '1'; pet.style.setProperty('--game-drift', Math.max(-5, Math.min(5, dx * .035)) + 'deg'); if (Math.abs(dx) + Math.abs(dy) > 2 && performance.now() - lastPetAction > 1100) { lastPetAction = performance.now(); OCTO.act(Math.abs(dy) > Math.abs(dx) && dy > 2 ? 'dive_down' : 'free_swim', null, 850); } }
    function drawPlayer() { movePet(); if (!pet) { ctx.font = '54px Apple Color Emoji, Segoe UI Emoji, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🐙', p.x, p.y); } }
    function collided(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy < (a.r + b.r) * (a.r + b.r); }
    function ask() {
      if (over || !deck.length) return finish(false); phase = 'question'; cancelAnimationFrame(raf); question = deck[Math.floor(Math.random() * deck.length)];
      panel.classList.remove('hide'); panel.innerHTML = '<div class="octo-mark">🐙</div><h2>Energy empty</h2><div class="energybar"><i style="width:0%"></i></div><div class="qbox"><h3>Answer to recharge</h3><p>' + esc(question.title) + '</p></div><input class="answer" data-answer autocomplete="off" placeholder="Type the meaning or answer"><div class="feedback" data-feedback>Correct answers refill your energy and extend your streak.</div><div class="row"><button class="mlv-btn" data-submit>Recharge ⚡</button></div><div class="tiny">Gimkit rule: no answer, no energy, no progress.</div>';
      var input = panel.querySelector('[data-answer]'), submit = panel.querySelector('[data-submit]'), feedback = panel.querySelector('[data-feedback]');
      function check() { if (answerOK(input.value, question.answer)) { coins += 8 + Math.min(8, streak * 2); reward += 2 + Math.floor(streak / 3); streak++; energy = maxEnergy; beep('win'); OCTO.act('excited', 'Recharged! Keep going! ⚡', 1600); panel.classList.add('hide'); phase = 'play'; last = performance.now(); raf = requestAnimationFrame(frame); hud(); } else { streak = 0; feedback.textContent = 'Not yet — try the card again.'; feedback.style.color = '#fda4af'; input.select(); OCTO.act('thinking', 'Think it through…', 1300); beep('bad'); } }
      submit.onclick = check; input.onkeydown = function (e) { if (e.key === 'Enter') check(); }; input.focus();
    }
    function shop() {
      if (over || phase === 'question') return; phase = 'shop'; cancelAnimationFrame(raf); panel.classList.remove('hide');
      var maxCost = 12 + (maxEnergy - 100) / 10 * 8, drainCost = 18 + Math.max(0, 7 - drain) * 5;
      panel.innerHTML = '<div class="octo-mark">🐙</div><h2>Energy Shop</h2><p>Spend coins from this run to make Octo last longer.</p><div class="shoprow"><button data-max ' + (coins < maxCost ? 'disabled' : '') + '>⚡ Max energy +20 · 🪙 ' + maxCost + '</button><button data-drain ' + (coins < drainCost ? 'disabled' : '') + '>🛡 Drain -1 · 🪙 ' + drainCost + '</button></div><div class="row" style="margin-top:16px"><button class="mlv-btn" data-back>Back to run</button></div>';
      panel.querySelector('[data-max]').onclick = function () { if (coins < maxCost) return; coins -= maxCost; maxEnergy += 20; energy = maxEnergy; beep('buy'); shop(); hud(); };
      panel.querySelector('[data-drain]').onclick = function () { if (coins < drainCost) return; coins -= drainCost; drain = Math.max(3, drain - 1); beep('buy'); shop(); hud(); };
      panel.querySelector('[data-back]').onclick = function () { phase = 'play'; panel.classList.add('hide'); last = performance.now(); raf = requestAnimationFrame(frame); };
    }
    function finish(quit) { if (over) return; over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); window.removeEventListener('resize', resize); if (quit) { ov.remove(); OCTO.place('stage'); done(0); return; } panel.classList.remove('hide'); panel.innerHTML = '<div class="octo-mark">🐙</div><h2>Rush complete!</h2><div class="score-big">🪙 ' + coins + '</div><p>' + reward + ' 💎 earned · answer streak ' + streak + '</p><div class="row"><button class="mlv-btn" data-collect>Collect rewards</button><button class="mlv-btn alt" data-close>Exit</button></div>'; OCTO.cheer(true); panel.querySelector('[data-collect]').onclick = function () { ov.remove(); OCTO.place('stage'); done(reward); }; panel.querySelector('[data-close]').onclick = function () { ov.remove(); OCTO.place('stage'); done(0); }; }
    function frame(now) {
      if (over || phase !== 'play') return; var dt = Math.min(.05, (now - last) / 1000); last = now; elapsed += dt; energy -= drain * dt; background(now);
      if (energy <= 0) { energy = 0; hud(); OCTO.act('thinking', 'Energy empty — answer time!', 1600); return ask(); }
      if (now > next) { spawn(); next = now + 620; } p.x += (target.x - p.x) * Math.min(1, dt * 8); p.y += (target.y - p.y) * Math.min(1, dt * 8); p.x = clamp(p.x, 70, W - 70); p.y = clamp(p.y, 70, H - 95);
      things.forEach(function (o) { o.x -= 180 * dt; if (!o.hit && collided(p, o)) { o.hit = true; if (o.kind === 'hazard') { energy = Math.max(0, energy - 20); streak = 0; OCTO.act('confused', 'Watch out!', 900); } else if (o.kind === 'cell') { energy = Math.min(maxEnergy, energy + 20); reward++; beep('good'); OCTO.act('excited', '+energy!', 700); } else { coins += 2; reward++; beep('good'); if (coins % 10 === 0) OCTO.act('excited', 'Coin streak!', 900); else OCTO.act('hop', '+2 coins', 650); } } drawThing(o); }); things = things.filter(function (o) { return !o.hit && o.x > -50; }); drawPlayer(); hud(); if (elapsed > 90) return finish(false); raf = requestAnimationFrame(frame);
    }
    function key(e) { if (e.key === 'Escape') { e.preventDefault(); finish(true); } else if (e.key === ' ' || e.key.indexOf('Arrow') === 0) { e.preventDefault(); if (phase === 'intro') start(); target.y = clamp(target.y + (e.key === 'ArrowDown' ? 85 : -85), 70, H - 95); if (Date.now() - lastPetAction > 500) { lastPetAction = Date.now(); OCTO.act(e.key === 'ArrowDown' ? 'dive_down' : 'sprint'); } } }
    ov.querySelector('[data-x]').onclick = function () { finish(true); }; ov.querySelector('[data-shop]').onclick = shop; window.addEventListener('keydown', key); window.addEventListener('resize', resize); ov.addEventListener('pointerdown', function (e) { if (e.target === cv) { target.x = e.clientX; target.y = e.clientY; if (phase === 'intro') start(); } }); ov.addEventListener('pointermove', function (e) { if (e.target === cv && (e.buttons || e.pointerType === 'touch')) { target.x = e.clientX; target.y = e.clientY; } }); resize(); showIntro(); OCTO.place('show');
  }


  function bubblePop(done) {
    ensureCss();
    var ov = document.createElement('div'); ov.className = 'mlv-bp';
    ov.innerHTML = '<div class="hud"><span data-t>⏱ 30</span><span data-g>💎 0</span><button type="button" data-x>✕</button></div><div class="go">Pop the bubbles! 🫧</div>';
    document.body.appendChild(ov);
    OCTO.place('show'); OCTO.act('wave', 'Pop them all! 🫧', 1600);
    var won = 0, combo = 0, t0 = performance.now(), dur = 30000, last = t0, spawnAt = 0, bubbles = [], over = false, raf = 0;
    function spawn() {
      var r = Math.random(), kind = r < 0.08 ? 'star' : r < 0.2 ? 'bomb' : 'gem', size = 52 + Math.random() * 44;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'b ' + kind;
      b.style.width = b.style.height = size + 'px'; b.textContent = kind === 'star' ? '🌟' : kind === 'bomb' ? '💣' : '💎';
      var o = { el: b, x: Math.random() * (innerWidth - size), y: innerHeight + 10, v: 90 + Math.random() * 120 + (performance.now() - t0) / 300, w: Math.random() * 6, kind: kind, size: size };
      b.onpointerdown = function (e) { e.preventDefault(); popIt(o); };
      ov.appendChild(b); bubbles.push(o);
    }
    function popIt(o) {
      if (o.dead || over) return; o.dead = true;
      var v = o.kind === 'star' ? 5 : o.kind === 'bomb' ? -3 : 1;
      if (v > 0) { combo++; if (combo >= 5 && combo % 5 === 0) { v += 2; OCTO.act('excited', 'Combo ×' + combo + '!', 1000); } else if (Math.random() < 0.3) OCTO.act('hop'); beep('good'); }
      else { combo = 0; beep('bad'); OCTO.act('thinking', 'Oops 💣', 900); }
      won = Math.max(0, won + v);
      var f = document.createElement('i'); f.className = 'fx ' + (v > 0 ? 'good' : 'bad'); f.textContent = (v > 0 ? '+' : '') + v;
      f.style.left = (o.x + o.size / 2) + 'px'; f.style.top = o.y + 'px'; ov.appendChild(f); setTimeout(function () { f.remove(); }, 800);
      o.el.classList.add('pop'); setTimeout(function () { o.el.remove(); }, 220);
      $(ov, '[data-g]').textContent = '💎 ' + won;
    }
    function frame(now) {
      if (over) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var left = dur - (now - t0);
      if (now > spawnAt) { spawn(); spawnAt = now + Math.max(260, 650 - (now - t0) / 60); }
      bubbles.forEach(function (o) {
        if (o.dead) return;
        o.y -= o.v * dt; o.w += dt * 2;
        o.el.style.transform = 'translate(' + (o.x + Math.sin(o.w) * 14) + 'px,' + o.y + 'px)';
        if (o.y < -o.size - 10) { o.dead = true; o.el.remove(); if (o.kind !== 'bomb') combo = 0; }
      });
      bubbles = bubbles.filter(function (o) { return !o.dead; });
      $(ov, '[data-t]').textContent = '⏱ ' + Math.max(0, Math.ceil(left / 1000));
      if (left <= 0) return finish();
      raf = requestAnimationFrame(frame);
    }
    function finish(quit) {
      if (over) return; over = true; cancelAnimationFrame(raf);
      bubbles.forEach(function (o) { o.el.remove(); });
      if (quit) { ov.remove(); OCTO.place('stage'); done(0); return; }
      ov.insertAdjacentHTML('beforeend', '<div class="end"><div class="big">💎 +' + won + '</div><p>' + (won >= 40 ? 'Bubble master!' : won >= 20 ? 'Nice popping!' : 'Good warm-up!') + '</p><button type="button" class="mlv-btn" data-ok>Collect</button></div>');
      OCTO.cheer(won >= 30); OCTO.act(null, '+' + won + ' 💎', 1800);
      $(ov, '[data-ok]').onclick = function () { ov.remove(); OCTO.place('stage'); done(won); };
    }
    $(ov, '[data-x]').onclick = function () { finish(true); };
    setTimeout(function () { var g = $(ov, '.go'); if (g) g.remove(); t0 = last = performance.now(); raf = requestAnimationFrame(frame); }, 900);
  }

  // ------------------------------------------------------------------ 📖 the 3D Cover study room: the game's cards, one by one, any time
  function openCover(code, onClose) {
    ensureCss();
    // in the iOS app the page is a file: — the 3D Cover then comes from the site
    var page = (/^https?:$/.test(location.protocol) ? location.pathname.replace(/[^/]*$/, '') : 'https://minest1.vercel.app/') + 'web31.1.html?learn=' + encodeURIComponent(code);
    var ov = document.createElement('div'); ov.className = 'mlv-cover';
    ov.innerHTML = '<iframe title="3D Cover" src="' + page + '" allow="microphone; autoplay"></iframe><div class="mlv-cover-load">📖 Opening the 3D Cover…</div>';
    document.body.appendChild(ov);
    OCTO.place('corner');
    var fr = $(ov, 'iframe');
    fr.onload = function () { var l = $(ov, '.mlv-cover-load'); if (l) l.remove(); };
    function done() { window.removeEventListener('message', onMsg); ov.remove(); OCTO.place('stage'); OCTO.act('nod', 'Ready to play? 🎮', 1600); if (onClose) onClose(); }
    function onMsg(e) { if (e.source === fr.contentWindow && e.data && e.data.type === 'minest-live:cover-close') done(); }
    window.addEventListener('message', onMsg);
  }

  // ================================================================== STUDENT
  function openJoin(code, standalone) {
    var o = overlay('Minest Live', standalone);
    o.el.classList.add('mlv-kid');   // the students' side: made for children
    setTimeout(function () { OCTO.place('stage'); OCTO.act('wave', 'Hi! Let’s play 🎮', 2200); }, 600);
    var saved = {}; try { saved = JSON.parse(sessionStorage.getItem('minest.live.me') || '{}'); } catch (e) {}
    code = cleanCode(code || '');
    var savedAv = String(saved.av || localAv() || '').split('~')[0];
    var selectedAv = STARTER_MONSTERS.indexOf(savedAv) >= 0 && ownsAv(savedAv) ? savedAv : STARTER_MONSTERS[0];
    o.body.innerHTML = '<section class="mlv-card" style="max-width:440px;margin:6vh auto 0;text-align:center"><div style="font-size:46px">🕹</div><h2>Join the Arcade game</h2><p class="sub">Enter the code on your teacher’s screen.</p>' +
      '<div data-acct class="mlv-acct"></div>' +
      '<input type="text" data-code maxlength="8" placeholder="GAME CODE" style="text-align:center;font-size:24px;font-weight:900;letter-spacing:.15em" value="' + esc(code) + '">' +
      '<input type="text" data-name maxlength="20" placeholder="Your name" style="margin-top:10px;text-align:center;font-size:18px" value="' + esc(saved.name || '') + '">' +
      '<div class="mlv-avatar-label">Choose your buddy · <span data-gemct style="color:#fde68a">💎 ' + gems() + '</span></div><div class="mlv-avatar-picker" data-avatar>' + STARTER_MONSTERS.map(function (id) { var c = cardById(id); var own = ownsAv(id); return '<button type="button" class="mlv-avatar-choice' + (id === selectedAv ? ' on' : '') + (own ? '' : ' lock') + '" data-av="' + id + '" title="' + esc(c.name) + '">' + iconHtml(c, 'mlv-card-icon') + (own ? '' : '<span class="pr">💎 ' + avCost(id) + '</span>') + '</button>'; }).join('') + '</div>' +
      '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-join>Join</button></div><div class="mlv-err" data-err></div></section>';
    var codeIn = $(o.body, '[data-code]'), nameIn = $(o.body, '[data-name]'), err = $(o.body, '[data-err]'), acct = $(o.body, '[data-acct]'), gUser = GAUTH.user();
    function paintAcct() {
      if (!acct || !acct.isConnected) return;
      if (gUser) {
        acct.innerHTML = (gUser.photoURL ? '<img src="' + esc(gUser.photoURL) + '" alt="" referrerpolicy="no-referrer">' : '<i class="mlv-av">🙂</i>') + '<span>Signed in as <b>' + esc(gUser.displayName || 'you') + '</b></span><button type="button" class="mlv-link-btn" data-out>Sign out</button>';
        $(acct, '[data-out]').onclick = function () { GAUTH.signOut().then(function () { gUser = null; paintAcct(); }); };
        if (!nameIn.value.trim() || nameIn.getAttribute('data-auto')) { nameIn.value = String(gUser.displayName || '').split(' ')[0].slice(0, 20); nameIn.setAttribute('data-auto', '1'); }
      } else {
        acct.innerHTML = '<button type="button" class="mlv-gbtn" data-gin><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Sign in with Google</button><div class="mlv-note" style="margin-top:6px">or just type a name below</div>';
        $(acct, '[data-gin]').onclick = function () {
          var b = this; b.disabled = true; err.textContent = '';
          GAUTH.signIn().then(function (r) { if (r && r.user) { gUser = r.user; paintAcct(); } }).catch(function (e) { err.textContent = window.__minestAuthError ? window.__minestAuthError(e) + ' You can still join as a guest.' : 'Google sign-in did not finish. You can still join as a guest.'; }).then(function () { b.disabled = false; });
        };
      }
    }
    paintAcct();
    GAUTH.watch(function (u) { gUser = u || null; paintAcct(); });
    $$(o.body, '[data-av]').forEach(function (btn) { btn.onclick = function () {
      var id = btn.getAttribute('data-av');
      if (!ownsAv(id)) {
        var cost = avCost(id), nm = MNAV.names[id] || 'This buddy';
        if (gems() < cost) { err.textContent = nm + ' unlocks for 💎 ' + cost + ' (you have ' + gems() + '). Earn 💎 in the waiting games below!'; btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 500); return; }
        if (!btn.classList.contains('sure')) { $$(o.body, '[data-av].sure').forEach(function (x) { x.classList.remove('sure'); }); btn.classList.add('sure'); err.textContent = 'Tap ' + nm + ' again to unlock it for 💎 ' + cost + '.'; return; }
        gems(-cost); var L = locker(); L.av.push(id); locker(L); btn.classList.remove('lock', 'sure'); var pr = btn.querySelector('.pr'); if (pr) pr.remove();
        var gc = $(o.body, '[data-gemct]'); if (gc) gc.textContent = '💎 ' + gems(); beep('win'); OCTO.cheer(true); err.textContent = nm + ' unlocked! 🎉';
      } else err.textContent = '';
      selectedAv = id; $$(o.body, '[data-av]').forEach(function (x) { x.classList.toggle('on', x === btn); });
    }; });
    nameIn.addEventListener('input', function () { nameIn.removeAttribute('data-auto'); });
    (code ? nameIn : codeIn).focus();
    codeIn.oninput = function () { codeIn.value = cleanCode(codeIn.value); };
    function go() {
      var c = cleanCode(codeIn.value), name = nameIn.value.trim().slice(0, 20);
      if (!c) { err.textContent = 'Enter the game code.'; return; }
      if (!name) { err.textContent = 'Enter your name.'; nameIn.focus(); return; }
      err.textContent = 'Joining…'; $(o.body, '[data-join]').disabled = true;
      db(c + '/host').then(function (h) {
        if (!h || !h.board) throw new Error('No game with code ' + c + '.');
        if (h.state === 'ended') throw new Error('That game has ended.');
        // signed in: the account is the player (same progress on any device); a guest gets a random id
        var pid = gUser ? 'g' + key(gUser.uid) : (saved.code === c && saved.pid ? saved.pid : uid());
        var who = { name: name, av: withWear(selectedAv), joined: { '.sv': 'timestamp' }, now: 'map', google: !!gUser };
        if (gUser && gUser.photoURL) who.photo = gUser.photoURL;
        return db(c + '/players/' + pid, 'PATCH', who).then(function (r) {
          var me = { code: c, pid: pid, name: name, av: selectedAv, offset: (r.joined || Date.now()) - Date.now() };
          try { sessionStorage.setItem('minest.live.me', JSON.stringify(me)); } catch (e) {}
          play(o, h, me);
        });
      }).catch(function (e) { err.textContent = e.message; $(o.body, '[data-join]').disabled = false; });
    }
    $(o.body, '[data-join]').onclick = go;
    waitPanel(o.body, null, null);
    nameIn.onkeydown = codeIn.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }

  function play(o, host, me) {
    var path = me.code + '/players/' + me.pid, SA = window.StudyArcade;
    var hadNoVoice = window.__mnNoVoice; window.__mnNoVoice = true;   // a student: no read-aloud, no recording
    o.cleanup.push(function () { window.__mnNoVoice = hadNoVoice; });
    var s = { money: 0, streak: 0, best: 0, correct: 0, wrong: 0, u: { mpq: 0, sb: 0, mult: 0, ins: 0 }, bonus: 1, shield: 0, lv: {}, cards: {}, coll: {}, av: me.av || localAv(), packs: 0 };
    try { var keep = JSON.parse(sessionStorage.getItem('minest.live.state.' + path) || 'null'); if (keep && keep.u) s = keep; } catch (e) {}
    // a signed-in player on a new device: pick up where they were from the game's own copy
    if (!keep && /^g/.test(me.pid)) db(path).then(function (p) {
      if (!p || !p.st || s.correct + s.wrong > 0) return;
      try { var st = JSON.parse(p.st); if (st && st.u) { s = st; if (!s.coll) s.coll = {}; if (!s.sc) s.sc = {}; draw(); } } catch (e) {}
    }).catch(function () {});
    if (!s.coll) s.coll = {};
    var screen = 'wait', run = null, floatEl = null, pending = {}, flushT = 0, lastRk = '';
    if (!s.sc) s.sc = {};
    var deckCards = {}; (host.board.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { deckCards[String(k.id)] = 1; (k.stack || []).forEach(function (x) { deckCards[String(x.id)] = 1; }); }); });

    function save(extra) {
      try { sessionStorage.setItem('minest.live.state.' + path, JSON.stringify(s)); } catch (e) {}
      if (flushT) { clearTimeout(flushT); flushT = 0; }
      var body = { st: /^g/.test(me.pid) ? JSON.stringify({ money: s.money, streak: s.streak, best: s.best, correct: s.correct, wrong: s.wrong, u: s.u, bonus: s.bonus, shield: s.shield, lv: s.lv, coll: s.coll, av: s.av, sc: s.sc, combo: s.combo, cards: {} }) : null, sc: s.sc, combo: s.combo || 0, money: Math.floor(s.money), correct: s.correct, wrong: s.wrong, streak: s.streak, best: s.best, lv: s.lv, now: run && !run.done ? run.k : screen === 'shop' ? 'shop' : screen === 'cards' ? 'cards' : screen === 'cover' ? 'cover' : 'map', av: withWear(avatar()), coll: Object.keys(s.coll).length, last: { '.sv': 'timestamp' } };
      Object.keys(pending).forEach(function (k) { body['cards/' + k] = s.cards[k]; }); pending = {};
      if (extra) Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
      return db(path, 'PATCH', body).catch(function () {});
    }
    // a moment the class sees on the teacher's feed
    function shout(t, k) { save({ ev: { at: { '.sv': 'timestamp' }, t: t, k: k || '' } }); }
    function avatar() { return s.av || me.av || localAv() || '🙂'; }
    // answers stream in fast during a level: write at most every 1.2 s
    function saveSoon() { if (flushT) return; flushT = setTimeout(function () { flushT = 0; save(); }, 1200); }

    // learning levels first, in order; once they are passed every game is open to choose
    function learnLv() { return host.levels.filter(function (k) { return levelInfo(k).self; }); }
    function learned() { return learnLv().every(function (k) { return s.lv[k]; }); }
    function unlocked(k) {
      var ls = learnLv(), i = ls.indexOf(k);
      return i >= 0 ? (i === 0 || !!s.lv[ls[i - 1]]) : learned();
    }
    function nextLevel() { return host.levels.filter(function (k) { return !s.lv[k] && unlocked(k); })[0]; }
    function myRank() { var lb = host.lb; return lb && lb.rank && lb.rank[me.pid] ? { r: lb.rank[me.pid], n: lb.n, by: lb.by } : null; }
    function totalScore() { var t = 0; Object.keys(s.sc || {}).forEach(function (k) { t += s.sc[k] || 0; }); return t; }
    function live() { return host.state === 'live'; }

    var endSeen = host.state === 'ended';
    var w = watch(me.code + '/host', function (h) {
      if (!h) return;
      host = h;
      var rk = myRank(), rkKey = rk ? rk.r + '/' + rk.n + '/' + rk.by + JSON.stringify(h.lb.top) : '';
      if (h.state === 'live' && screen === 'wait') { screen = 'map'; draw(); beep('win'); OCTO.act('excited', 'Go go go! 🚀', 2000); }
      else if (h.state === 'live' && rkKey !== lastRk) { lastRk = rkKey; if (screen === 'map' && !run) draw(); updateFloat(); }
      else if (h.state === 'ended' && !endSeen) { endSeen = true; endRun(); screen = 'end'; save(); draw(); OCTO.cheer(true); OCTO.act(null, 'GG! 🏁', 2500); }
    });
    o.cleanup.push(function () { w.close(); endRun(true); });
    var t = setInterval(function () {
      var ms = host.startedAt && host.goal && host.goal.type === 'time' ? host.startedAt + host.goal.min * 60000 - (Date.now() + me.offset) : null;
      $$(document, '[data-left]').forEach(function (el) { el.textContent = ms == null ? '' : '⏱ ' + clock(ms); });
    }, 500);
    o.cleanup.push(function () { clearInterval(t); });

    // ---------------------------------------------------------------- a level = one Study Arcade game
    function startLevel(k) {
      if (!live() || !SA) return;
      var opts = { level: host.pace || 'normal', run: 'short', dir: 'mix', speed: host.pace === 'fast' ? 0.8 : host.pace === 'easy' ? 3 : 1.5 };
      run = { k: k, c: 0, w: 0, earned: 0, bonus: s.bonus, seen: 0 };
      var pk = perksOf(s); if (pk.streak && s.streak < pk.streak) s.streak = pk.streak;   // a card's head start
      s.bonus = 1;   // a bought bonus lasts one level
      var ok = SA.level ? SA.level(host.board, k, opts) : false;
      if (!ok) { run = null; toast('No cards here can be asked this way — level skipped.'); s.lv[k] = 1; save(); draw(); return; }
      o.el.hidden = true;
      showFloat();
      OCTO.place('corner'); OCTO.act('nod', 'You got this!', 1500);
      save();
    }
    function onJudge(e) {
      var d = e.detail || {};
      if (!run || run.done || d.source !== 'arcade' || d.type !== 'judge' || !deckCards[String(d.cardId)]) return;
      var L = levelInfo(run.k), k = key(d.cardId), rec = s.cards[k] || (s.cards[k] = { c: 0, w: 0 }), gain = 0;
      run.seen++;
      if (L.self) {
        // warm-ups are self-judged: a flat pay per card, an honest "again" costs nothing
        gain = UPG.mpq.vals[s.u.mpq] * UPG.mult.vals[s.u.mult] * (d.result === 'mastered' ? 1 : 0.5) * run.bonus * (1 + perksOf(s).cash / 100);
        s.money += gain; run.earned += gain; pop('+' + money(gain), true);
      } else if (d.result === 'mastered') {
        s.streak++; s.best = Math.max(s.best, s.streak); s.correct++; rec.c++; run.c++;
        gain = earnOf(s) * run.bonus; s.money += gain; run.earned += gain; pop('+' + money(gain) + (s.streak > 1 ? '  🔥' + s.streak : ''), true); beep('good');
        if (s.streak && s.streak % 5 === 0) OCTO.act('excited', '🔥 ' + s.streak + ' in a row!', 1600); else OCTO.act('hop');
        pending[k] = 1;
      } else {
        var loss = Math.min(s.money, lossOf(s));
        if (s.shield > 0) s.shield--; else s.streak = 0;
        s.wrong++; rec.w++; run.w++;
        s.money -= loss; run.earned -= loss;
        pop(loss ? '−' + money(loss) : 'Miss', false); beep('bad');
        if (Math.random() < 0.35) OCTO.act('thinking', ['Hmm…', 'Almost!', 'Next one!'][Math.floor(Math.random() * 3)], 1200);
        pending[k] = 1;
      }
      updateFloat(); saveSoon();
    }
    function onDone(e) {
      if (!run || run.done) return;
      var d = e.detail || {}, k = run.k, L = levelInfo(k), r0;
      if (d.mode && d.mode !== k) return;
      var passed = !!d.cleared && (L.self ? run.seen > 0 : run.c + run.w > 0 && run.c / (run.c + run.w) >= 0.6);
      var stars = passed ? (L.self ? 3 : starsOf(run.c, run.w)) : 0, first = passed && !s.lv[k], prize = 0;
      if (passed) {
        s.lv[k] = Math.max(s.lv[k] || 0, stars);
        prize = Math.round(earnOf({ u: s.u, streak: 1, coll: s.coll }) * (first ? 10 : 3) * stars * (1 + perksOf(s).bonus / 100));
        s.money += prize;
      }
      if (passed && first) {
        var allDone = host.levels.every(function (x) { return s.lv[x]; });
        setTimeout(function () { shout(allDone ? 'cleared every level! 🏰' : 'cleared ' + L.name + ' ' + '★★★'.slice(0, stars), allDone ? 'mythic' : 'clear'); }, 300);
      }
      r0 = d.score || 0;
      if (r0 > (s.sc[k] || 0)) s.sc[k] = r0;
      if ((d.combo || 0) > (s.combo || 0)) s.combo = d.combo;
      run.score = r0; run.combo = d.combo || 0;
      var r = run; run.done = true;
      save(host.levels.every(function (x) { return s.lv[x]; }) ? { doneAt: { '.sv': 'timestamp' } } : null);
      setTimeout(function () { if (run === r) result(r, passed, stars, prize, first); }, 1400);   // let the arcade's finale play first
    }
    function onClosed() { if (run) { if (!run.done) save(); endRun(); screen = 'map'; draw(); save(); } }
    window.addEventListener('minest:study-activity', onJudge);
    window.addEventListener('minest:arcade-done', onDone);
    window.addEventListener('minest:arcade-closed', onClosed);
    o.cleanup.push(function () { window.removeEventListener('minest:study-activity', onJudge); window.removeEventListener('minest:arcade-done', onDone); window.removeEventListener('minest:arcade-closed', onClosed); });

    function endRun(silent) {
      var r = run; run = null;
      OCTO.place('stage');
      if (floatEl) { floatEl.remove(); floatEl = null; }
      $$(document, '.mlv-res').forEach(function (x) { x.remove(); });
      if (r && SA && SA.isOpen && SA.isOpen()) SA.close(true);
      if (!silent && o.el) o.el.hidden = false;
    }
    // the money sits in the Arcade's own top bar, next to its score chips (out of the way of the game)
    function showFloat() {
      floatEl = document.createElement('div'); floatEl.className = 'mlv-float';
      var chips = document.querySelector('.arcade .ar-chips');
      if (chips) { floatEl.classList.add('in'); chips.insertBefore(floatEl, chips.firstChild); } else document.body.appendChild(floatEl);
      updateFloat();
    }
    function updateFloat() {
      if (!floatEl || !run) return;
      var L = levelInfo(run.k);
      var rk = myRank();
      floatEl.innerHTML = '<span>' + L.icon + '</span><span class="c">' + money(s.money) + '</span>' + (rk ? '<span class="t">🏅#' + rk.r + '</span>' : '') + '<span class="t">🔥 ' + s.streak + '</span>' + (run.bonus > 1 ? '<span class="t">' + (run.bonus === 5 ? '💥' : '⚡') + '×' + run.bonus + '</span>' : '') + '<span class="t" data-left></span>';
    }
    function confetti(n) {
      var cols = ['#86efac', '#fde047', '#c4b5fd', '#f9a8d4', '#7dd3fc', '#fdba74'];
      for (var i = 0; i < n; i++) {
        var d = document.createElement('i'); d.className = 'mlv-conf';
        d.style.left = (Math.random() * 100) + 'vw'; d.style.background = cols[i % cols.length];
        d.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); d.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
        d.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; d.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(d); (function (x) { setTimeout(function () { x.remove(); }, 3800); })(d);
      }
    }
    function pop(text, good) { var d = document.createElement('div'); d.className = 'mlv-pop ' + (good ? 'good' : 'bad') + (floatEl && floatEl.classList.contains('in') ? ' top' : ''); d.textContent = text; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1000); }
    function toast(text) { var d = document.createElement('div'); d.className = 'mlv-pop good'; d.style.fontSize = '15px'; d.textContent = text; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1800); }

    function result(r, passed, stars, prize, first) {
      if (screen === 'end') return;
      var L = levelInfo(r.k), nx = nextLevel();
      var box = document.createElement('div'); box.className = 'mlv-res';
      box.innerHTML = '<div class="box"><div style="font-size:40px">' + (passed ? L.icon : '💫') + '</div><h2>' + (passed ? (first ? 'Level cleared!' : 'Cleared again!') : 'Not yet!') + '</h2>' +
        '<div class="stars">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.15) + 's">★</i>'; }).join('') + '</div>' +
        '<p>' + esc(L.name) + (L.self ? '' : ' · ' + r.c + ' right · ' + r.w + ' missed') + '<br>⭐ ' + points(r.score) + (r.score && r.score >= (s.sc[r.k] || 0) ? ' · best!' : '') + (r.combo > 1 ? ' · combo ×' + r.combo : '') + '<br>Earned ' + money(r.earned) + (prize ? ' + level bonus ' + money(prize) : '') + '</p>' +
        (passed && L.self && learned() ? '<p style="color:#86efac;font-weight:850">📖 Learning done — every game is open now!</p>' : '') +
        (passed ? '' : '<p style="margin-top:-8px">Get 60% right to clear it.</p>') +
        '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-go>' + (passed ? (nx && levelInfo(nx).self ? 'Next: ' + esc(levelInfo(nx).name) : '🎮 Choose a game') : 'Try again') + '</button><button class="mlv-btn alt" data-map>🛒 Map & shop</button></div></div>';
      document.body.appendChild(box);
      if (passed) { beep('win'); confetti(stars * 30 + 20); OCTO.place('stage'); OCTO.cheer(stars === 3); OCTO.act(null, stars === 3 ? 'Perfect! ★★★' : 'Level cleared!', 2200); }
      else { OCTO.place('stage'); OCTO.act('thinking', 'Try again — you’re close!', 2200); }
      $(box, '[data-go]').onclick = function () { var k = passed ? (nx && levelInfo(nx).self ? nx : null) : r.k; endRun(true); if (k && live()) startLevel(k); else { screen = 'map'; o.el.hidden = false; draw(); save(); } };
      $(box, '[data-map]').onclick = function () { endRun(); screen = 'map'; draw(); save(); };
    }

    // ---------------------------------------------------------------- map, shop, end
    function hud() {
      return '<div class="mlv-card mlv-hud"><span class="mlv-cash"><i class="mlv-av">' + avHtml(withWear(avatar())) + '</i>' + money(s.money) + '</span>' + (myRank() ? '<span class="mlv-pill mlv-rank">🏅 #' + myRank().r + ' / ' + myRank().n + '</span>' : '') + '<span class="mlv-pill">⭐ ' + points(totalScore()) + '</span><span class="mlv-pill">🔥 ' + s.streak + '</span>' +
        (s.bonus > 1 ? '<span class="mlv-pill">' + (s.bonus === 5 ? '💥' : '⚡') + ' ×' + s.bonus + ' next level</span>' : '') + (s.shield ? '<span class="mlv-pill">🧲 ×' + s.shield + '</span>' : '') +
        '<span class="mlv-sp"></span>' + (host.goal.type === 'time' ? '<span class="mlv-pill" data-left>⏱</span>' : host.goal.type === 'money' ? '<span class="mlv-pill">🏁 ' + money(host.goal.target) + '</span>' : '<span class="mlv-pill">🏰 clear all</span>') +
        '<button class="mlv-btn alt" data-cover style="padding:9px 14px" title="Study the cards one by one">📖 3D Cover</button>' +
        '<button class="mlv-btn alt" data-cards style="padding:9px 14px">' + (screen === 'cards' ? '🗺 Map' : '🏅 Badges ' + Object.keys(s.coll).length + '/' + CARDS.length) + '</button>' +
        '<button class="mlv-btn' + (screen === 'shop' ? ' alt' : '') + '" data-shop style="padding:9px 14px">' + (screen === 'shop' ? '🗺 Map' : '🛒 Shop') + '</button></div>';
    }
    function endBonus() {
      var k = 'minest.live.endgems.' + me.code + '.' + me.pid, got = 0;
      try { got = +localStorage.getItem(k) || 0; } catch (e) {}
      if (got) return got;
      var cl = host.levels.filter(function (x) { return s.lv[x]; }).length, st = 0; Object.keys(s.lv).forEach(function (x) { st += s.lv[x]; });
      var rk = myRank(), place = rk ? rk.r : 99;
      got = Math.max(10, Math.min(80, 10 + cl * 4 + st + (place === 1 ? 20 : place === 2 ? 15 : place === 3 ? 10 : 0)));
      gems(got); try { localStorage.setItem(k, String(got)); } catch (e) {}
      return got;
    }
    function draw() {
      if (!current || current.el !== o.el) return;
      if (screen === 'wait') {
        o.body.innerHTML = '<section class="mlv-card" style="max-width:520px;margin:8vh auto 0;text-align:center"><div style="font-size:54px">🕹</div><h2>You’re in, ' + esc(me.name) + '!</h2><p class="sub">' + esc(host.title || '') + ' · ' + host.levels.length + ' Arcade levels. Waiting for your teacher to start…</p>' +
          '<div class="mlv-trail" style="justify-content:center">' + host.levels.map(function (k) { return '<i style="width:40px;height:40px;font-size:21px;border-radius:12px">' + levelInfo(k).icon + '</i>'; }).join('') + '</div></section>';
        var wp = document.createElement('div'); wp.style.cssText = 'max-width:520px;margin:0 auto'; o.body.appendChild(wp);
        var sb = document.createElement('button'); sb.type = 'button'; sb.className = 'mlv-btn mlv-studybtn'; sb.innerHTML = '📖 Study the cards in 3D Cover'; sb.onclick = function () { openCover(me.code); };
        wp.appendChild(sb); waitPanel(wp, null, host, { code: me.code, pid: me.pid, name: me.name, av: withWear(avatar()) });
        return;
      }
      if (screen === 'end') {
        var cl = host.levels.filter(function (k) { return s.lv[k]; }).length, st = 0; Object.keys(s.lv).forEach(function (k) { st += s.lv[k]; });
        o.body.innerHTML = '<section class="mlv-card" style="max-width:520px;margin:8vh auto 0;text-align:center"><div class="mlv-av" style="width:84px;height:84px;font-size:54px;margin:0 auto">' + avHtml(withWear(avatar())) + '</div><h2>Game over</h2><p class="sub">Look at your teacher’s screen for the podium.</p><div class="mlv-endgem">💎 +' + endBonus() + ' for your Locker</div>' +
          '<div class="mlv-stat" style="justify-content:center"><div><small>Place</small><strong>' + (myRank() ? '#' + myRank().r : '—') + '</strong></div><div><small>Coins</small><strong>' + money(s.money) + '</strong></div><div><small>Points</small><strong>' + points(totalScore()) + '</strong></div><div><small>Levels</small><strong>' + cl + '/' + host.levels.length + '</strong></div><div><small>Stars</small><strong>' + st + '★</strong></div><div><small>Right</small><strong>' + pct(s.correct, s.wrong) + '</strong></div><div><small>Cards</small><strong>' + Object.keys(s.coll).length + '</strong></div></div>' +
          '<div class="mlv-row" style="justify-content:center;margin-top:16px"><button class="mlv-btn" data-end-shop>👕 Locker & shop</button><button class="mlv-btn alt" data-end-cards>👾 Monsters & badges</button><button class="mlv-btn alt" data-end-map>🗺 Map</button></div></section>';
        $(o.body, '[data-end-shop]').onclick = function () { screen = 'shop'; draw(); save(); };
        $(o.body, '[data-end-cards]').onclick = function () { screen = 'cards'; draw(); save(); };
        $(o.body, '[data-end-map]').onclick = function () { screen = 'map'; draw(); save(); };
        return;
      }
      if (screen === 'shop') { shop(); return; }
      if (screen === 'cards') { collection(); return; }
      var nx = nextLevel();
      var lb = host.lb, ls = learnLv(), firstGame = host.levels.filter(function (k) { return !levelInfo(k).self; })[0];
      var top5 = lb && lb.top && lb.top.length ? '<div class="mlv-card mlv-top5"><h3><span>🏆 Top ' + lb.top.length + '</span><span class="mlv-note" style="margin:0">' + (RANK[lb.by] ? RANK[lb.by].name : '') + '</span></h3>' + lb.top.map(function (t, i) {
        var mine = myRank() && myRank().r === i + 1;
        return '<div class="row' + (mine ? ' me' : '') + '"><span>' + (['🥇', '🥈', '🥉'][i] || '#' + (i + 1)) + '</span><i class="mlv-av" style="width:30px;height:30px;margin:0">' + avHtml(t.av) + '</i><span>' + esc(t.n) + (mine ? ' (you)' : '') + '</span><b>' + esc(t.v) + '</b></div>';
      }).join('') + (myRank() && myRank().r > lb.top.length ? '<div class="row me"><span>#' + myRank().r + '</span><i class="mlv-av" style="width:30px;height:30px;margin:0">' + avHtml(withWear(avatar())) + '</i><span>' + esc(me.name) + ' (you)</span><b></b></div>' : '') + '</div>' : '';
      o.body.innerHTML = hud() + top5 + '<div class="mlv-map">' + host.levels.map(function (k, i) {
        var L = levelInfo(k), done = s.lv[k], open = unlocked(k);
        var head = (i === 0 && ls.length ? '<h4>📖 Learn first</h4>' : '') + (k === firstGame ? '<h4>' + (learned() ? '🎮 Choose any game' : '🔒 Games open after learning') + '</h4>' : '');
        return head + '<button type="button" class="mlv-lv ' + (done ? 'done' : open ? 'open' : 'lock') + '" data-k="' + k + '"' + (open ? '' : ' aria-disabled="true"') + '>' +
          '<span class="ic">' + (open ? L.icon : '🔒') + '</span><span><b>' + (i + 1) + '. ' + esc(L.name) + (i === host.levels.length - 1 && host.levels.length > 2 ? ' 👑' : '') + '</b><small>' + esc(L.tag) + (done ? ' · replay for more' : '') + '</small></span>' +
          '<span class="st">' + (done ? '<span style="color:#fde047">' + '★★★'.slice(0, done) + '</span><span style="opacity:.25">' + '★★★'.slice(done) + '</span>' + (s.sc[k] ? '<small style="color:#c4b5fd;font-size:11px">⭐ ' + points(s.sc[k]) + '</small>' : '') : (k === nx || (open && !L.self)) ? '▶' : '') + '</span></button>';
      }).join('') + '</div>' + (nx ? '' : '<p class="mlv-note" style="text-align:center;margin-top:16px">🏰 Every level cleared! Replay any level to earn more and push your stars to ★★★.</p>');
      wireHud();
      $$(o.body, '[data-k]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-k'); if (unlocked(k)) startLevel(k); }; });
    }
    function wireHud() {
      var a = $(o.body, '[data-shop]'), b = $(o.body, '[data-cards]'), cv = $(o.body, '[data-cover]');
      if (cv) cv.onclick = function () { var was = screen; screen = 'cover'; save(); openCover(me.code, function () { screen = was; save(); draw(); }); };
      if (a) a.onclick = function () { screen = screen === 'shop' ? 'map' : 'shop'; draw(); save(); };
      if (b) b.onclick = function () { screen = screen === 'cards' ? 'map' : 'cards'; draw(); save(); };
    }
    function packPrice(k) { return Math.round(PACKS[k].price(earnOf({ u: s.u, streak: 1 }))); }
    function packsHtml() {
      var cols = ['#94a3b8', '#38bdf8', '#a855f7', '#f59e0b', '#f43f5e'];
      return '<h3>🎁 Treasure chests</h3><div class="mlv-pk-grid">' + Object.keys(PACKS).map(function (k) {
        var P = PACKS[k], price = packPrice(k), can = s.money >= price;
        return '<div class="mlv-pkbtn" style="background:' + P.bg + '"><canvas class="mlv-tilecv" data-tier="' + k + '"></canvas><b>' + P.name + '</b>' +
          '<div class="odds">' + P.odds.map(function (x, i) { return x ? '<i style="width:' + x + '%;background:' + cols[i] + '"></i>' : ''; }).join('') + '</div>' +
          '<div class="ol">' + P.odds.map(function (x, i) { return x ? RAR[RORDER[i]].name[0] + ' ' + x + '%' : ''; }).filter(Boolean).join(' · ') + '</div>' +
          '<button class="mlv-btn' + (can ? '' : ' alt') + '" data-pack="' + k + '"' + (can ? '' : ' disabled') + '>Open · ' + money(price) + '</button></div>';
      }).join('') + '</div>';
    }
    function miniCard(c, lv, eq) {
      var R = RAR[c.r];
      return '<button type="button" class="mlv-mini' + (lv ? '' : ' no') + (eq ? ' eq' : '') + '" data-card="' + c.id + '" style="--c:' + R.c + ';--g:' + R.g + '"' + (lv ? '' : ' disabled') + '>' +
        '<span class="rb">' + R.name + '</span>' + (lv ? '<span class="lvb">Lv ' + Math.min(5, lv) + '</span>' : '') + iconHtml(c, 'mlv-card-icon') + '<b>' + (lv ? esc(c.name) : '???') + '</b><small>' + (lv ? perkText(c, Math.min(5, lv)) : RAR[c.r].name) + '</small></button>';
    }
    function collection() {
      var pk = perksOf(s), list = [];
      if (pk.cash) list.push('💵 +' + pk.cash + '% money'); if (pk.bonus) list.push('🏆 +' + pk.bonus + '% level bonus'); if (pk.guard) list.push('🛡 +' + pk.guard + '% insurance'); if (pk.streak) list.push('🔥 start at ' + pk.streak);
      o.body.innerHTML = hud() + '<h3>My badges this game · ' + Object.keys(s.coll).length + '/' + CARDS.length + '</h3>' +
        '<div class="mlv-perks">' + (list.length ? list.map(function (x) { return '<span>' + x + '</span>'; }).join('') : '<span style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)">Open chests in the 🛒 Shop — every badge gives you a perk</span>') + '</div>' +
        '<p class="mlv-note" style="margin:-4px 0 12px">Tap a badge to make it your avatar (your teacher sees it). Duplicates level a badge up to Lv 5. <a href="#" data-album style="color:#c4b5fd">All my badges →</a></p>' +
        '<div class="mlv-coll">' + CARDS.slice().sort(function (a, b) { return RORDER.indexOf(b.r) - RORDER.indexOf(a.r); }).map(function (c) { return miniCard(c, s.coll[c.id], avatar() === c.id); }).join('') + '</div>';
      wireHud();
      var al = $(o.body, '[data-album]'); if (al) al.onclick = function (e) { e.preventDefault(); showAlbum(); };
      $$(o.body, '[data-card]').forEach(function (b) { b.onclick = function () { var c = cardById(b.getAttribute('data-card')); if (!c || !s.coll[c.id]) return; s.av = c.id; localAv(c.id); beep('buy'); save(); collection(); }; });
    }
    function openPack(k) {
      var price = packPrice(k); if (s.money < price) return;
      s.money -= price; s.packs = (s.packs || 0) + 1;
      var c = pull(k), R = RAR[c.r], had = s.coll[c.id] || 0;
      s.coll[c.id] = had + 1; albumAdd(c.id);
      if (!s.av) s.av = c.id;
      save();
      if (RORDER.indexOf(c.r) >= 2) shout('found ' + (c.r === 'epic' ? 'an' : 'a') + ' ' + R.name.toUpperCase() + ' badge: ' + c.name + '!', c.r);
      var lvNow = Math.min(5, had + 1);
      showChest(k, c, {
        perk: perkText(c, lvNow), tag: had ? (had + 1 <= 5 ? 'Level up! Lv ' + lvNow : 'Max level ✓') : 'NEW BADGE!',
        onAgain: function () { openPack(k); }, againOff: s.money < packPrice(k), againLabel: 'Open another · ' + money(packPrice(k)),
        onEquip: avatar() !== c.id ? function () { s.av = c.id; localAv(c.id); save(); } : null,
        onDone: function () { draw(); }
      });
    }
    function shop() {
      var e = earnOf({ u: s.u, streak: 1 });
      o.body.innerHTML = hud() + lockerHtml(avatar()) + packsHtml() + '<h3 style="margin-top:20px">Upgrades</h3><div class="mlv-shop">' + Object.keys(UPG).map(function (k) {
        var u = UPG[k], lv = s.u[k], nx = lv + 1 < u.vals.length ? lv + 1 : -1, can = nx > 0 && s.money >= u.cost[nx];
        return '<div class="mlv-up"><div class="t">' + u.icon + ' ' + u.name + '</div><div class="lv">' + u.vals.map(function (_, i) { return '<i class="' + (i <= lv ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
          '<div class="v">Now ' + u.fmt(u.vals[lv]) + (nx > 0 ? ' → ' + u.fmt(u.vals[nx]) : ' · max') + '</div>' +
          (nx > 0 ? '<button class="mlv-btn' + (can ? '' : ' alt') + '" data-up="' + k + '"' + (can ? '' : ' disabled') + '>Buy · ' + money(u.cost[nx]) + '</button>' : '') + '</div>';
      }).join('') + '</div><h3 style="margin-top:18px">Power-ups</h3><div class="mlv-shop">' + Object.keys(POWER).map(function (k) {
        var p = POWER[k], price = Math.round(p.price(e)), owned = (k === 'shield' && s.shield > 0) || (k !== 'shield' && s.bonus > 1), can = s.money >= price && !owned;
        return '<div class="mlv-up"><div class="t">' + p.icon + ' ' + p.name + '</div><div class="v">' + p.desc + '</div><button class="mlv-btn' + (can ? '' : ' alt') + '" data-pw="' + k + '"' + (can ? '' : ' disabled') + '>' + (owned ? 'Ready ✓' : 'Buy · ' + money(price)) + '</button></div>';
      }).join('') + '</div>';
      wireHud();
      wireLocker(o.body, function (id) { if (id) { s.av = id; localAv(id); } save(); }, shop);
      $$(o.body, '[data-pack]').forEach(function (b) { b.onclick = function () { openPack(b.getAttribute('data-pack')); }; });
      $$(o.body, '.mlv-tilecv').forEach(function (cv) { chestScene(cv, cv.getAttribute('data-tier'), true); });
      $$(o.body, '[data-up]').forEach(function (b) {
        b.onclick = function () { var k = b.getAttribute('data-up'), u = UPG[k], nx = s.u[k] + 1; if (s.money < u.cost[nx]) return; s.money -= u.cost[nx]; s.u[k] = nx; beep('buy'); save(); shop(); };
      });
      $$(o.body, '[data-pw]').forEach(function (b) {
        b.onclick = function () { var k = b.getAttribute('data-pw'), price = Math.round(POWER[k].price(earnOf({ u: s.u, streak: 1 }))); if (s.money < price) return; s.money -= price; if (k === 'shield') s.shield = 3; else s.bonus = k === 'mega' ? 5 : 2; beep('buy'); save(); shop(); };
      });
    }
    if (host.state === 'live') screen = 'map';
    else if (host.state === 'ended') screen = 'end';
    if (!SA || !SA.level) o.body.innerHTML = '<section class="mlv-card"><h2>The Arcade did not load</h2><p class="sub">Reload this page.</p></section>';
    else draw();
  }

  window.MinestLive = { openTeacher: openTeacher, openJoin: openJoin, close: close, levels: LEVELS, version: '31.5', badges: CARDS, album: albumMap, showAlbum: showAlbum, openLocker: openLocker, gems: function () { return gems(); } };

  // web31.1.html?play=CODE (or the play page) opens the join screen straight away
  try {
    var qp = new URLSearchParams(location.search), pc = qp.get('play') || qp.get('code');
    if (window.__MINEST_LIVE_STANDALONE || qp.get('play') != null) {
      var start = function () { openJoin(pc || '', !!window.__MINEST_LIVE_STANDALONE); };
      if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
    }
  } catch (e) {}
})();
