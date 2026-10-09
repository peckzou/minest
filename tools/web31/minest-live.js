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
   Student page: web31.play.html?code=CODE (/play) — this file plus the Study Arcade, nothing else.
   Data: Firebase Realtime Database /minest-live/{CODE}: host (board snapshot, levels, pace, goal, state) and
   players/{pid}. Streams with EventSource, falls back to polling. */
(function () {
  'use strict';
  if (window.MinestLive) return;

  var DB = 'https://minest-33761-default-rtdb.firebaseio.com/minest-live/';
  var API = /vercel\.app$/.test(location.hostname) ? '' : 'https://minest-app.vercel.app';
  var PLAY_PAGE = 'web31.play.html';

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
    return (neg ? '−$' : '$') + s.replace('.0', '');
  }
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
    mpq: { name: 'Money per Question', icon: '💵', vals: [1, 5, 50, 100, 500, 2000, 5000, 10000, 250000, 1000000], cost: [0, 10, 100, 1000, 10000, 75000, 300000, 1000000, 10000000, 100000000], fmt: function (v) { return money(v); } },
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
  var PERK = { cash: 'money on right answers', bonus: 'level bonus', guard: 'insurance', streak: 'start streak' };
  // the badges are the user's 3D badge library, as its pre-rendered images (badge-index/thumbs, transparent)
  var BADGE_BASE = (/vercel\.app$/.test(location.hostname) ? '' : 'https://minest-app.vercel.app') + '/badge-index/thumbs/';
  var CARDS = [
    ['strike-3', '3-Day Strike', 'common', 'cash'], ['strike-7', '7-Day Strike', 'common', 'guard'], ['perfect-week', 'Perfect Week', 'common', 'bonus'],
    ['minion-stuart', 'Stuart', 'common', 'streak'], ['pikachu', 'Pikachu', 'common', 'cash'],
    ['strike-14', '14-Day Emerald Strike', 'rare', 'bonus'], ['strike-30', '30-Day Strike', 'rare', 'cash'], ['strike-40', '40-Day Strike', 'rare', 'guard'],
    ['lucy-axolotl', 'Lucy the Axolotl', 'rare', 'streak'], ['archimedes-owl', 'Archimedes Owl', 'rare', 'bonus'],
    ['strike-50', '50-Day Strike', 'epic', 'cash'], ['strike-60', '60-Day Strike', 'epic', 'guard'], ['octopus-polymath', 'Octopus Polymath', 'epic', 'bonus'], ['sith-lightsaber', 'Lightsaber', 'epic', 'streak'],
    ['strike-80', '80-Day Strike', 'legendary', 'guard'], ['ender-dragon', 'Ender Dragon', 'legendary', 'cash'], ['study-streak-365', '365-Day Study Streak', 'legendary', 'streak'],
    ['strike-90', '90-Day Strike', 'mythic', 'bonus'], ['strike-100', '100-Day Strike', 'mythic', 'cash']
  ].map(function (a) {
    var m = /^strike-(\d+)$/.exec(a[0]);
    return { id: a[0], name: a[1], r: a[2], perk: a[3], img: BADGE_BASE + (m ? 'hd/strike-' + m[1] + '-days.webp' : a[0] + '.webp') };
  });
  // an avatar: a badge id → its image, anything else (an emoji) as text
  function avHtml(v) { var c = CARDS.filter(function (x) { return x.id === v; })[0]; return c ? '<img class="mlv-avi" src="' + c.img + '" alt="">' : esc(v || '🙂'); }
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
    ov.innerHTML = '<div class="mlv-chestbox"><canvas></canvas><div class="mlv-rise" style="--g:' + Rr.g + '"><div class="rays"></div><img alt="" src="' + c.img + '"></div></div>' +
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
          '<img src="' + c.img + '" alt="" loading="lazy"><b>' + (n ? esc(c.name) : '???') + '</b></button>';
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
    money: { name: '💰 Money', cmp: function (a, b) { return b.m - a.m || b.cleared - a.cleared || b.c - a.c; }, show: function (p) { return money(p.m); } },
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
    '.mlv-acct:has(img),.mlv-acct:has(.mlv-link-btn){flex-direction:row;justify-content:center;gap:10px;font-size:14px}',
    '.mlv-gbtn{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:12px;padding:11px 18px;background:#fff;color:#1f1f1f;font-weight:750;font-size:15px;box-shadow:0 6px 18px rgba(0,0,0,.25)}.mlv-gbtn:disabled{opacity:.6}',
    '.mlv-link-btn{border:0;background:none;color:#c4b5fd;text-decoration:underline;font-size:13px}.mlv-lb .gv{color:#93c5fd;font-weight:900;font-size:10px}',
    '.mlv-wait{max-width:520px;margin:14px auto 0}.mlv-waitg{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}',
    '.mlv-waitg button{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(160deg,rgba(139,92,246,.28),rgba(34,197,94,.12));color:#fff;border-radius:16px;padding:14px 8px}',
    '.mlv-waitg button .i{font-size:34px;animation:mlvBob 2.4s ease-in-out infinite}.mlv-waitg button b{font-size:14px}.mlv-waitg button small{font-size:11px;color:#c7cdf5}',
    '.mlv-waitg button.dim{opacity:.6}.mlv-waitg button.shake{animation:mlvShake .5s linear}.mlv-gems{text-align:center;margin-top:10px;font-size:15px}.mlv-gems b{color:#7dd3fc;font-size:18px}',
    '@media(max-width:420px){.mlv-waitg{grid-template-columns:1fr 1fr}}',
    '.mlv-bp{position:fixed;inset:0;z-index:2147483380;background:radial-gradient(900px 600px at 50% 120%,rgba(14,165,233,.45),transparent 60%),linear-gradient(180deg,#0b1030,#081a2f);overflow:hidden;touch-action:none;font-family:Inter,system-ui,sans-serif;color:#fff}',
    '.mlv-bp .hud{position:absolute;top:calc(12px + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:center;gap:12px;z-index:3;font-weight:900;font-size:20px}',
    '.mlv-bp .hud span{background:rgba(0,0,0,.35);border-radius:999px;padding:7px 16px}.mlv-bp .hud button{position:absolute;right:14px;top:0;border:0;border-radius:50%;width:40px;height:40px;background:rgba(255,255,255,.12);color:#fff;font-size:16px}',
    '.mlv-bp .go{position:absolute;inset:0;display:grid;place-items:center;font-size:34px;font-weight:950;animation:mlvPop .4s ease}',
    '.mlv-bp .b{position:absolute;left:0;top:0;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.75),rgba(255,255,255,.12) 32%,rgba(125,211,252,.18) 60%,rgba(125,211,252,.35));box-shadow:inset 0 0 18px rgba(255,255,255,.35),0 6px 20px rgba(0,0,0,.25);font-size:26px;display:grid;place-items:center;cursor:pointer;padding:0;transition:opacity .2s}',
    '.mlv-bp .b.star{border-color:#fde047;box-shadow:inset 0 0 18px rgba(253,224,71,.5),0 0 22px rgba(253,224,71,.5)}.mlv-bp .b.bomb{border-color:#fb7185;background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.6),rgba(251,113,133,.25) 40%,rgba(127,29,29,.45))}',
    '.mlv-bp .b.pop{opacity:0;scale:1.6}.mlv-bp .fx{position:absolute;font-style:normal;font-weight:950;font-size:24px;pointer-events:none;animation:mlvUp .8s ease-out forwards;transform:translateX(-50%)}.mlv-bp .fx.good{color:#7dd3fc}.mlv-bp .fx.bad{color:#fda4af}',
    '.mlv-bp .end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(3,6,20,.6);animation:mlvPop .35s ease}.mlv-bp .end .big{font-size:56px;font-weight:950}.mlv-bp .end p{color:#c7cdf5;margin:0 0 12px}',
    '.mlv-bp .mlv-btn{border:0;border-radius:13px;padding:12px 22px;font:850 16px Inter,system-ui,sans-serif;cursor:pointer}',
    '.mlv-av img.mlv-avi,.mlv-av .mlv-avi{width:100%;height:100%;object-fit:contain;display:block}.mlv-av{overflow:hidden}',
    '.mlv-tilecv{display:block;width:120px;height:78px;margin:0 auto}.mlv-tilecv.sm{width:64px;height:44px}',
    '.mlv-mini img{width:70%;aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))}.mlv-mini.no img{filter:brightness(0);opacity:.28}',
    '.mlv-chestbox{position:relative;width:min(340px,86vw);height:min(340px,86vw);cursor:pointer}.mlv-chestbox canvas{width:100%;height:100%;display:block}',
    '.mlv-rise{position:absolute;left:50%;top:58%;width:56%;aspect-ratio:1;transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none}',
    '.mlv-rise.go{animation:mlvRise 1.1s cubic-bezier(.2,.9,.3,1.2) forwards}',
    '@keyframes mlvRise{0%{opacity:0;transform:translate(-50%,-30%) scale(.2)}35%{opacity:1}70%{transform:translate(-50%,-112%) scale(1.15)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}',
    '.mlv-rise img{position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 26px var(--g)) drop-shadow(0 12px 22px rgba(0,0,0,.5))}',
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
        '<div class="mlv-row"><button class="mlv-btn" data-host' + (ok ? '' : ' disabled') + '>Create game</button></div><div class="mlv-err" data-err></div></section>' +
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
                '<span class="sx">' + cell('money', money(p.m), 'Money') + cell('score', p.sc.toLocaleString(), 'Arcade score (best run per level)') + cell('stars', p.stars + '★', 'Stars') + cell('acc', p.acc < 0 ? '—' : Math.round(p.acc * 100) + '%', 'Right answers') + '</span></div>';
            }).join('') + '</div><div class="mlv-lbk"><span>💰 money</span><span>⭐ arcade score</span><span>★ stars</span><span>🎯 right</span>' + (r.some(function (p) { return p.coll; }) ? '' : '') + '</div></section>' +
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
          '<div class="mlv-grid"><section class="mlv-card"><h3>Students</h3><table class="mlv-table"><tr><th>#</th><th>Name</th><th>Money</th><th>Score</th><th>Levels</th><th>Stars</th><th>Right</th><th>Best 🔥</th><th>Cards</th></tr>' +
          r.map(function (p, i) { return '<tr><td>' + (i + 1) + '</td><td><i class="mlv-av" style="width:22px;height:22px">' + avHtml(p.av) + '</i>' + esc(p.name) + '</td><td>' + money(p.m) + '</td><td>' + p.sc.toLocaleString() + '</td><td>' + p.cleared + '/' + game.levels.length + '</td><td>' + p.stars + '★</td><td>' + pct(p.c, p.w) + '</td><td>' + p.best + '</td><td>' + p.coll + '</td></tr>'; }).join('') + '</table></section>' +
          '<section class="mlv-card"><h3>Cards to reteach</h3><table class="mlv-table"><tr><th>Card</th><th>Right</th></tr>' +
          hard.slice(0, 15).map(function (s) { return '<tr><td>' + esc(cut(s.t, 60)) + '</td><td>' + pct(s.c, s.w) + ' (' + (s.c + s.w) + ')</td></tr>'; }).join('') + '</table>' +
          (hard.length ? '' : '<p class="sub">No answers yet.</p>') + '</section></div>' +
          '<div class="mlv-row"><button class="mlv-btn" data-again>Play again</button><button class="mlv-btn alt" data-csv>Download results (CSV)</button><button class="mlv-btn alt" data-done>Done</button></div>';
        // the results leave with the teacher (CSV first if they are needed): the game's data is removed
        $(o.body, '[data-again]').onclick = function () { hosting(null); db(code, 'DELETE').catch(function () {}); close(); openTeacher(); };
        $(o.body, '[data-done]').onclick = function () { hosting(null); db(code, 'DELETE').catch(function () {}); close(); };
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
      if (window.firebase && firebase.auth) return Promise.resolve();
      if (GAUTH._p) return GAUTH._p;
      var load = function (src) { return new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); };
      GAUTH._p = load('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js').then(function () { return load('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'); });
      return GAUTH._p;
    },
    app: function () {
      var cfg = window.__FIREBASE_CONFIG__; if (!cfg || !window.firebase) return null;
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      return firebase.auth();
    },
    user: function () { try { var a = window.firebase && firebase.apps && firebase.apps.length && firebase.auth(); return a ? a.currentUser : null; } catch (e) { return null; } },
    watch: function (fn) { GAUTH.sdk().then(function () { var a = GAUTH.app(); if (a) a.onAuthStateChanged(fn); }).catch(function () {}); },
    signIn: function () {
      return GAUTH.sdk().then(function () {
        var a = GAUTH.app(); if (!a) throw new Error('Sign-in is not set up on this page');
        var pr = new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
        return a.signInWithPopup(pr).catch(function (e) {
          if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return a.signInWithRedirect(pr);
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
  function waitPanel(host, onChange) {
    var box = document.createElement('section'); box.className = 'mlv-card mlv-wait';
    function paint() {
      var g = gems();
      box.innerHTML = '<h3>While you wait</h3><div class="mlv-waitg">' +
        '<button type="button" data-bubble><span class="i">🫧</span><b>Bubble Pop</b><small>30 s · pop 💎 for gems</small></button>' +
        '<button type="button" data-chest' + (g >= CHEST_GEMS ? '' : ' class="dim"') + '><canvas class="mlv-tilecv sm" data-tier="wood"></canvas><b>Open a chest</b><small>' + CHEST_GEMS + ' 💎 · win a badge</small></button>' +
        '<button type="button" data-album><span class="i">🏅</span><b>My badges</b><small>' + Object.keys(albumMap()).length + '/' + CARDS.length + ' collected</small></button></div>' +
        '<div class="mlv-gems">💎 <b>' + g + '</b> gems</div>';
      $(box, '[data-bubble]').onclick = function () { bubblePop(function (won) { gems(won); paint(); if (onChange) onChange(); }); };
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
  // Bubble Pop: bubbles rise, tap them; 💎 = gems, 🌟 = 5, 💣 = −3; Octo cheers combos
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
    var page = location.pathname.replace(/[^/]*$/, '') + 'web31.0.html?learn=' + encodeURIComponent(code);
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
    setTimeout(function () { OCTO.place('stage'); OCTO.act('wave', 'Hi! Let’s play 🎮', 2200); }, 600);
    var saved = {}; try { saved = JSON.parse(sessionStorage.getItem('minest.live.me') || '{}'); } catch (e) {}
    code = cleanCode(code || '');
    o.body.innerHTML = '<section class="mlv-card" style="max-width:440px;margin:6vh auto 0;text-align:center"><div style="font-size:46px">🕹</div><h2>Join the Arcade game</h2><p class="sub">Enter the code on your teacher’s screen.</p>' +
      '<div data-acct class="mlv-acct"></div>' +
      '<input type="text" data-code maxlength="8" placeholder="GAME CODE" style="text-align:center;font-size:24px;font-weight:900;letter-spacing:.15em" value="' + esc(code) + '">' +
      '<input type="text" data-name maxlength="20" placeholder="Your name" style="margin-top:10px;text-align:center;font-size:18px" value="' + esc(saved.name || '') + '">' +
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
          GAUTH.signIn().then(function (r) { if (r && r.user) { gUser = r.user; paintAcct(); } }).catch(function (e) { err.textContent = 'Google sign-in did not finish' + (e && e.code ? ' (' + e.code.replace('auth/', '') + ')' : ''); }).then(function () { b.disabled = false; });
        };
      }
    }
    paintAcct();
    GAUTH.watch(function (u) { gUser = u || null; paintAcct(); });
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
        var who = { name: name, joined: { '.sv': 'timestamp' }, now: 'map', google: !!gUser };
        if (gUser && gUser.photoURL) who.photo = gUser.photoURL;
        return db(c + '/players/' + pid, 'PATCH', who).then(function (r) {
          var me = { code: c, pid: pid, name: name, offset: (r.joined || Date.now()) - Date.now() };
          try { sessionStorage.setItem('minest.live.me', JSON.stringify(me)); } catch (e) {}
          play(o, h, me);
        });
      }).catch(function (e) { err.textContent = e.message; $(o.body, '[data-join]').disabled = false; });
    }
    $(o.body, '[data-join]').onclick = go;
    waitPanel(o.body);
    nameIn.onkeydown = codeIn.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }

  function play(o, host, me) {
    var path = me.code + '/players/' + me.pid, SA = window.StudyArcade;
    var s = { money: 0, streak: 0, best: 0, correct: 0, wrong: 0, u: { mpq: 0, sb: 0, mult: 0, ins: 0 }, bonus: 1, shield: 0, lv: {}, cards: {}, coll: {}, av: '', packs: 0 };
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
      var body = { st: /^g/.test(me.pid) ? JSON.stringify({ money: s.money, streak: s.streak, best: s.best, correct: s.correct, wrong: s.wrong, u: s.u, bonus: s.bonus, shield: s.shield, lv: s.lv, coll: s.coll, av: s.av, sc: s.sc, combo: s.combo, cards: {} }) : null, sc: s.sc, combo: s.combo || 0, money: Math.floor(s.money), correct: s.correct, wrong: s.wrong, streak: s.streak, best: s.best, lv: s.lv, now: run && !run.done ? run.k : screen === 'shop' ? 'shop' : screen === 'cards' ? 'cards' : screen === 'cover' ? 'cover' : 'map', av: avatar(), coll: Object.keys(s.coll).length, last: { '.sv': 'timestamp' } };
      Object.keys(pending).forEach(function (k) { body['cards/' + k] = s.cards[k]; }); pending = {};
      if (extra) Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
      return db(path, 'PATCH', body).catch(function () {});
    }
    // a moment the class sees on the teacher's feed
    function shout(t, k) { save({ ev: { at: { '.sv': 'timestamp' }, t: t, k: k || '' } }); }
    function avatar() { return s.av || localAv() || '🙂'; }
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

    var w = watch(me.code + '/host', function (h) {
      if (!h) return;
      host = h;
      var rk = myRank(), rkKey = rk ? rk.r + '/' + rk.n + '/' + rk.by + JSON.stringify(h.lb.top) : '';
      if (h.state === 'live' && screen === 'wait') { screen = 'map'; draw(); beep('win'); OCTO.act('excited', 'Go go go! 🚀', 2000); }
      else if (h.state === 'live' && rkKey !== lastRk) { lastRk = rkKey; if (screen === 'map' && !run) draw(); updateFloat(); }
      else if (h.state === 'ended' && screen !== 'end') { endRun(); screen = 'end'; save(); draw(); OCTO.cheer(true); OCTO.act(null, 'GG! 🏁', 2500); }
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
        '<p>' + esc(L.name) + (L.self ? '' : ' · ' + r.c + ' right · ' + r.w + ' missed') + '<br>⭐ ' + (r.score || 0).toLocaleString() + ' pts' + (r.score && r.score >= (s.sc[r.k] || 0) ? ' · best!' : '') + (r.combo > 1 ? ' · combo ×' + r.combo : '') + '<br>Earned ' + money(r.earned) + (prize ? ' + level bonus ' + money(prize) : '') + '</p>' +
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
      return '<div class="mlv-card mlv-hud"><span class="mlv-cash"><i class="mlv-av">' + avHtml(avatar()) + '</i>' + money(s.money) + '</span>' + (myRank() ? '<span class="mlv-pill mlv-rank">🏅 #' + myRank().r + ' / ' + myRank().n + '</span>' : '') + '<span class="mlv-pill">⭐ ' + totalScore().toLocaleString() + '</span><span class="mlv-pill">🔥 ' + s.streak + '</span>' +
        (s.bonus > 1 ? '<span class="mlv-pill">' + (s.bonus === 5 ? '💥' : '⚡') + ' ×' + s.bonus + ' next level</span>' : '') + (s.shield ? '<span class="mlv-pill">🧲 ×' + s.shield + '</span>' : '') +
        '<span class="mlv-sp"></span>' + (host.goal.type === 'time' ? '<span class="mlv-pill" data-left>⏱</span>' : host.goal.type === 'money' ? '<span class="mlv-pill">🏁 ' + money(host.goal.target) + '</span>' : '<span class="mlv-pill">🏰 clear all</span>') +
        '<button class="mlv-btn alt" data-cover style="padding:9px 14px" title="Study the cards one by one">📖 3D Cover</button>' +
        '<button class="mlv-btn alt" data-cards style="padding:9px 14px">' + (screen === 'cards' ? '🗺 Map' : '🏅 Badges ' + Object.keys(s.coll).length + '/' + CARDS.length) + '</button>' +
        '<button class="mlv-btn' + (screen === 'shop' ? ' alt' : '') + '" data-shop style="padding:9px 14px">' + (screen === 'shop' ? '🗺 Map' : '🛒 Shop') + '</button></div>';
    }
    function draw() {
      if (!current || current.el !== o.el) return;
      if (screen === 'wait') {
        o.body.innerHTML = '<section class="mlv-card" style="max-width:520px;margin:8vh auto 0;text-align:center"><div style="font-size:54px">🕹</div><h2>You’re in, ' + esc(me.name) + '!</h2><p class="sub">' + esc(host.title || '') + ' · ' + host.levels.length + ' Arcade levels. Waiting for your teacher to start…</p>' +
          '<div class="mlv-trail" style="justify-content:center">' + host.levels.map(function (k) { return '<i style="width:40px;height:40px;font-size:21px;border-radius:12px">' + levelInfo(k).icon + '</i>'; }).join('') + '</div></section>';
        var wp = document.createElement('div'); wp.style.cssText = 'max-width:520px;margin:0 auto'; o.body.appendChild(wp);
        var sb = document.createElement('button'); sb.type = 'button'; sb.className = 'mlv-btn mlv-studybtn'; sb.innerHTML = '📖 Study the cards in 3D Cover'; sb.onclick = function () { openCover(me.code); };
        wp.appendChild(sb); waitPanel(wp);
        return;
      }
      if (screen === 'end') {
        var cl = host.levels.filter(function (k) { return s.lv[k]; }).length, st = 0; Object.keys(s.lv).forEach(function (k) { st += s.lv[k]; });
        o.body.innerHTML = '<section class="mlv-card" style="max-width:520px;margin:8vh auto 0;text-align:center"><div class="mlv-av" style="width:84px;height:84px;font-size:54px;margin:0 auto">' + avHtml(avatar()) + '</div><h2>Game over</h2><p class="sub">Look at your teacher’s screen for the podium.</p>' +
          '<div class="mlv-stat" style="justify-content:center"><div><small>Place</small><strong>' + (myRank() ? '#' + myRank().r : '—') + '</strong></div><div><small>Money</small><strong>' + money(s.money) + '</strong></div><div><small>Score</small><strong>' + totalScore().toLocaleString() + '</strong></div><div><small>Levels</small><strong>' + cl + '/' + host.levels.length + '</strong></div><div><small>Stars</small><strong>' + st + '★</strong></div><div><small>Right</small><strong>' + pct(s.correct, s.wrong) + '</strong></div><div><small>Cards</small><strong>' + Object.keys(s.coll).length + '</strong></div></div></section>';
        return;
      }
      if (screen === 'shop') { shop(); return; }
      if (screen === 'cards') { collection(); return; }
      var nx = nextLevel();
      var lb = host.lb, ls = learnLv(), firstGame = host.levels.filter(function (k) { return !levelInfo(k).self; })[0];
      var top5 = lb && lb.top && lb.top.length ? '<div class="mlv-card mlv-top5"><h3><span>🏆 Top ' + lb.top.length + '</span><span class="mlv-note" style="margin:0">' + (RANK[lb.by] ? RANK[lb.by].name : '') + '</span></h3>' + lb.top.map(function (t, i) {
        var mine = myRank() && myRank().r === i + 1;
        return '<div class="row' + (mine ? ' me' : '') + '"><span>' + (['🥇', '🥈', '🥉'][i] || '#' + (i + 1)) + '</span><i class="mlv-av" style="width:30px;height:30px;margin:0">' + avHtml(t.av) + '</i><span>' + esc(t.n) + (mine ? ' (you)' : '') + '</span><b>' + esc(t.v) + '</b></div>';
      }).join('') + (myRank() && myRank().r > lb.top.length ? '<div class="row me"><span>#' + myRank().r + '</span><i class="mlv-av" style="width:30px;height:30px;margin:0">' + avHtml(avatar()) + '</i><span>' + esc(me.name) + ' (you)</span><b></b></div>' : '') + '</div>' : '';
      o.body.innerHTML = hud() + top5 + '<div class="mlv-map">' + host.levels.map(function (k, i) {
        var L = levelInfo(k), done = s.lv[k], open = unlocked(k);
        var head = (i === 0 && ls.length ? '<h4>📖 Learn first</h4>' : '') + (k === firstGame ? '<h4>' + (learned() ? '🎮 Choose any game' : '🔒 Games open after learning') + '</h4>' : '');
        return head + '<button type="button" class="mlv-lv ' + (done ? 'done' : open ? 'open' : 'lock') + '" data-k="' + k + '"' + (open ? '' : ' aria-disabled="true"') + '>' +
          '<span class="ic">' + (open ? L.icon : '🔒') + '</span><span><b>' + (i + 1) + '. ' + esc(L.name) + (i === host.levels.length - 1 && host.levels.length > 2 ? ' 👑' : '') + '</b><small>' + esc(L.tag) + (done ? ' · replay for more' : '') + '</small></span>' +
          '<span class="st">' + (done ? '<span style="color:#fde047">' + '★★★'.slice(0, done) + '</span><span style="opacity:.25">' + '★★★'.slice(done) + '</span>' + (s.sc[k] ? '<small style="color:#c4b5fd;font-size:11px">⭐ ' + s.sc[k].toLocaleString() + '</small>' : '') : (k === nx || (open && !L.self)) ? '▶' : '') + '</span></button>';
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
        '<span class="rb">' + R.name + '</span>' + (lv ? '<span class="lvb">Lv ' + Math.min(5, lv) + '</span>' : '') + '<img src="' + c.img + '" alt="" loading="lazy"><b>' + (lv ? esc(c.name) : '???') + '</b><small>' + (lv ? perkText(c, Math.min(5, lv)) : RAR[c.r].name) + '</small></button>';
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
      o.body.innerHTML = hud() + packsHtml() + '<h3 style="margin-top:20px">Upgrades</h3><div class="mlv-shop">' + Object.keys(UPG).map(function (k) {
        var u = UPG[k], lv = s.u[k], nx = lv + 1 < u.vals.length ? lv + 1 : -1, can = nx > 0 && s.money >= u.cost[nx];
        return '<div class="mlv-up"><div class="t">' + u.icon + ' ' + u.name + '</div><div class="lv">' + u.vals.map(function (_, i) { return '<i class="' + (i <= lv ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
          '<div class="v">Now ' + u.fmt(u.vals[lv]) + (nx > 0 ? ' → ' + u.fmt(u.vals[nx]) : ' · max') + '</div>' +
          (nx > 0 ? '<button class="mlv-btn' + (can ? '' : ' alt') + '" data-up="' + k + '"' + (can ? '' : ' disabled') + '>Buy · ' + money(u.cost[nx]) + '</button>' : '') + '</div>';
      }).join('') + '</div><h3 style="margin-top:18px">Power-ups</h3><div class="mlv-shop">' + Object.keys(POWER).map(function (k) {
        var p = POWER[k], price = Math.round(p.price(e)), owned = (k === 'shield' && s.shield > 0) || (k !== 'shield' && s.bonus > 1), can = s.money >= price && !owned;
        return '<div class="mlv-up"><div class="t">' + p.icon + ' ' + p.name + '</div><div class="v">' + p.desc + '</div><button class="mlv-btn' + (can ? '' : ' alt') + '" data-pw="' + k + '"' + (can ? '' : ' disabled') + '>' + (owned ? 'Ready ✓' : 'Buy · ' + money(price)) + '</button></div>';
      }).join('') + '</div>';
      wireHud();
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

  window.MinestLive = { openTeacher: openTeacher, openJoin: openJoin, close: close, levels: LEVELS, version: '31.3', badges: CARDS, album: albumMap, showAlbum: showAlbum };

  // web31.0.html?play=CODE (or the play page) opens the join screen straight away
  try {
    var qp = new URLSearchParams(location.search), pc = qp.get('play') || qp.get('code');
    if (window.__MINEST_LIVE_STANDALONE || qp.get('play') != null) {
      var start = function () { openJoin(pc || '', !!window.__MINEST_LIVE_STANDALONE); };
      if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
    }
  } catch (e) {}
})();
