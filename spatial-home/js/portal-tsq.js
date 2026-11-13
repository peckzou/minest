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

  root.SpatialTSQ = { open: open, close: function () { finish(null); }, isOpen: function () { return !!el; }, snapshot: snapshot, version: '1.0' };
})(window);
