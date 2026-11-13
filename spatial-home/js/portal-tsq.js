/* Minest · Spatial Home — the Times Square portal (Portal World, V1).
   The portal in the room opens times-square/index.html full screen. That world shows the SAME content as the EC–6
   bulletin board — nothing is copied or invented here; this file only reads what the board and the backpack already read:
   · Today's Daily Anchor Charts  SpatialEC6._.pick(subject)   (the board's own pick of the day, per subject)
   · Today's Big Three           SpatialEC6._.big3()
   · Today's Words               SpatialEC6._.wordState()
   · progress / countdown        the board's own record + SpatialEC6._.daysLeft()
   · works                       MinestBackpack.works()  (Type Workshop words)
   and posts it to the world as one snapshot ({tsq:1, op:'content', data}). The world asks with {tsq:1, op:'ready'}.
   A theme building's door posts {tsq:1, op:'enter', target:'chart'|'words'|'works', sub}; the portal closes and the room
   opens the real thing (the Anchor Chart card itself, the word study, 3D Type). {op:'close'} goes back to the room. */
(function (root) {
  'use strict';
  var WEB = 'https://minest-app.vercel.app/times-square/index.html';
  var SUB = [
    { id: 'ela', name: 'Language Arts', zh: '语言艺术', glyph: '📚', ink: '#2f6fd6' }, { id: 'math', name: 'Math', zh: '数学', glyph: '🔢', ink: '#d9463e' },
    { id: 'sci', name: 'Science', zh: '科学', glyph: '🔬', ink: '#2f9a5a' }, { id: 'ss', name: 'Social Studies', zh: '社会', glyph: '🗺️', ink: '#b8862b' },
    { id: 'other', name: 'Other', zh: '艺术 · 音乐 · 健康 · 体育', glyph: '🎨', ink: '#8a5ad0' }];
  function plain(s) { return String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_`>|~]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /** the world's content: today's board, read the way the board reads it */
  function snapshot() {
    var E = root.SpatialEC6 && root.SpatialEC6._, d = today(), out = { date: d, exam: null, charts: [], big3: [], words: null, progress: null, works: [], custom: [], demo: false };
    if (E) {
      try { var S = E.S(), left = E.daysLeft(); out.exam = { name: S.exam && S.exam.name || '', date: S.exam && S.exam.date || '', daysLeft: left }; } catch (e) {}
      var chartsSeen = 0;
      SUB.forEach(function (s) {
        try {
          var h = E.pick(s.id); if (!h || !h.k) return; var k = h.k, S = E.S();
          var mastered = (S.mastered || []).some(function (m) { return m.id === k.id && !m.undone; });
          if (mastered || (S.opened && S.opened[d] && S.opened[d][k.id])) chartsSeen++;
          out.charts.push({ sub: s.id, name: s.name, zh: s.zh, glyph: s.glyph, ink: s.ink, title: clip(k.title, 80), text: clip(k.meaning || k.titleZh || k.desc || '', 160), mastered: mastered, id: k.id });
        } catch (e) {}
      });
      try { out.big3 = E.big3().filter(function (r) { return r.card; }).map(function (r) { return { title: clip(r.card.title, 60), done: !!r.card.complete }; }); } catch (e) {}
      try {
        var w = E.wordState();
        if (w) { var byId = {}; (w.L.c.cards || []).forEach(function (k) { byId[k.id] = k; });
          var i = w.open.indexOf(w.W.cur), next = w.open.slice(i + 1, i + 9).map(function (id) { return byId[id] && clip(byId[id].title, 40); }).filter(Boolean);
          out.words = { list: clip(w.L.c.title || w.L.b && w.L.b.title || '', 40), cur: w.card ? clip(w.card.title, 40) : '', next: next, left: w.left, total: w.total, knownToday: w.knownToday }; }
      } catch (e) {}
      out.progress = { big3Done: out.big3.filter(function (b) { return b.done; }).length, big3Have: out.big3.length, charts: chartsSeen, chartsOf: SUB.length, wordsToday: out.words ? out.words.knownToday : 0 };
    }
    try { var BP = root.MinestBackpack; if (BP && BP.works) out.works = BP.works().slice(-24).reverse().map(function (it) { return { title: clip(it.word, 40), kind: it.mode || 'neon' }; }); } catch (e) {}
    return out;
  }

  function src() {
    if (/^https?:$/.test(location.protocol)) return /\/spatial-home\//.test(location.pathname) ? '../times-square/index.html' : 'times-square/index.html';
    return WEB;                                         // the app's local pages: the world comes from the web, like Typing Worlds
  }

  var el = null, frame = null, done = null;
  function post(msg) { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} }
  function finish(r) {
    if (!el) return; root.removeEventListener('message', onMsg);
    var e0 = el; el = null; frame = null; e0.style.opacity = '0'; setTimeout(function () { e0.remove(); }, 320);
    var f = done; done = null; if (f) f(r || null);
  }
  function onMsg(e) {
    var m = e.data; if (!el || !m || m.tsq !== 1 || !frame || e.source !== frame.contentWindow) return;
    if (m.op === 'ready') post({ tsq: 1, op: 'content', data: snapshot() });
    else if (m.op === 'close') finish(null);
    else if (m.op === 'enter') {
      if (m.target === 'chart') {
        var E = root.SpatialEC6 && root.SpatialEC6._, h = null; try { h = E && E.pick(m.sub); } catch (er) {}
        var id = h && h.k && h.k.id;
        finish({ feature: 'kanban', after: id ? function (w) { setTimeout(function () { try { w.MinestAI.openCard(id); } catch (er) {} }, 120); } : null });
      } else if (m.target === 'words') finish({ feature: 'carplay' });
      else if (m.target === 'works') finish({ feature: 'type3d' });
    }
  }
  /** open the world; cb(result) with null (back to the room) or { feature, after } (open that in Minest) */
  function open(cb) {
    if (el) return; done = cb;
    el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#05060a;opacity:0;transition:opacity .3s';
    frame = document.createElement('iframe'); frame.title = '时代广场 · Times Square';
    frame.setAttribute('allow', 'fullscreen; autoplay');
    frame.style.cssText = 'border:0;width:100%;height:100%;display:block';
    frame.src = src(); el.appendChild(frame); document.body.appendChild(el);
    root.addEventListener('message', onMsg);
    requestAnimationFrame(function () { if (el) el.style.opacity = '1'; });
  }
  /* the board's content changes while the world is open (a Kanban edit elsewhere): send it again now and then */
  setInterval(function () { if (el && frame && !document.hidden) post({ tsq: 1, op: 'content', data: snapshot() }); }, 30000);

  /* the archway is a portal to more than one place: Times Square, and every walk-in interior of My World (the King's
     Hall, the manor, the castle treasury, the library, Neuschwanstein…, from my-world-interiors/entry.js) */
  function interiorsBase() { return /^https?:$/.test(location.protocol) ? (/\/spatial-home\//.test(location.pathname) ? '../my-world-interiors/' : 'my-world-interiors/') : 'https://minest-app.vercel.app/my-world-interiors/'; }
  function loadInteriors(cb) {
    if (root.MinestInteriors) return cb(root.MinestInteriors);
    var s = document.createElement('script'); s.src = interiorsBase() + 'entry.js?v=20261113'; s.onload = function () { cb(root.MinestInteriors || null); }; s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  }
  function choose(cb, container) {
    loadInteriors(function (I) {
      var list = [{ id: 'tsq', name: '时代广场 · Times Square', note: '真实尺度街道 · 大屏显示你的学习内容' }];
      if (I && I.kinds) I.kinds.forEach(function (k) { list.push({ id: k[0], name: String(k[2]).replace(/^一键进入/, ''), note: k[3] || '' }); });
      var box = document.createElement('div'); box.className = 'sh-portalpick';
      box.innerHTML = '<style>.sh-portalpick{position:absolute;z-index:9;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(420px,calc(100% - 24px));max-height:70vh;overflow:auto;padding:12px;background:rgba(198,198,198,.95);border:2px solid #111;box-shadow:inset 2px 2px 0 #fff,inset -2px -2px 0 #555;font:13px/1.35 ui-monospace,Menlo,"PingFang SC",monospace;color:#2a2a2a}' +
        '.sh-portalpick h4{margin:0 0 8px;color:#3f3f3f}.sh-portalpick button{display:block;width:100%;text-align:left;margin:0 0 6px;padding:9px 10px;border:2px solid #111;background:#8b8b8b;color:#fff;text-shadow:1px 1px 0 #3f3f3f;font:inherit;cursor:pointer;box-shadow:inset 2px 2px 0 rgba(255,255,255,.4),inset -2px -2px 0 rgba(0,0,0,.4)}' +
        '.sh-portalpick button small{display:block;opacity:.85;font-size:11px}.sh-portalpick button.first{background:#4f8f3a}.sh-portalpick button.x{text-align:center;background:rgba(0,0,0,.08);color:#3f3f3f;text-shadow:none;box-shadow:none}<\/style>' +
        '<h4>传送门 · 去哪里？</h4>' + list.map(function (d, i) { return '<button type="button" data-id="' + d.id + '"' + (i ? '' : ' class="first"') + '>' + d.name + (d.note ? '<small>' + d.note + '</small>' : '') + '</button>'; }).join('') +
        '<button type="button" class="x" data-id="">回到房间</button>';
      (container || document.body).appendChild(box);
      ['pointerdown', 'touchstart', 'wheel'].forEach(function (t) { box.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); box.remove(); var id = b.getAttribute('data-id');
        if (!id) return cb(null);
        if (id === 'tsq') return open(cb);
        try { I.open(id); } catch (er) {} cb(null);
      });
    });
  }
  root.SpatialTSQ = { open: open, choose: choose, close: function () { finish(null); }, isOpen: function () { return !!el; }, snapshot: snapshot, version: '1.0' };
})(window);
