/* Minest · My World 搜索 2.0 — World Search MK II (window.MinestWorldSearch2)
   1.0's search bar (../tools/toolkit/omni.js) and host (../tools/toolkit/host.js) are loaded unchanged. This file only
   adds to the bar while it is open:
     results    your worlds, lists and things — and now everything the knowledge engine knows that matches: philosophy
                models, frameworks, thinking models, experiments, compass places (by name, cue, author, close spelling
                or field), in groups, with the match marked · scope chips (Tab) · recent searches · things to try
     engine     what 知识引擎 2.0 makes of the text: its kind, its place, a confidence and the other candidates
     cards      each of the five says a little more (confidence, frameworks, how many philosophy models fit) · ⌥1–5
     models     a philosophy model opens in 模型馆 2.0 (models/), full screen over the search
   The toolkit frame is 2.0's own (toolkit.html in this folder): 1.0's toolkit with engine2.js in front of it. */
(function () {
  'use strict';
  if (window.MinestWorldSearch2 || !window.MinestOmni) return;
  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : ''; })();
  var KIND = {
    w: { zh: '世界', en: 'World', c: '#ffe28a' }, l: { zh: '列表', en: 'List', c: '#ffd2a8' }, c: { zh: '卡片', en: 'Card', c: '#e8eaff' },
    phil: { zh: '哲学模型', en: 'Philosophy model', c: '#f08c3a' }, framework: { zh: '知识框架', en: 'Framework', c: '#5e9cff', card: 'framework' },
    template: { zh: '框架模板', en: 'Template', c: '#8ab6ff', card: 'framework' }, model: { zh: '思维模型', en: 'Thinking model', c: '#1f9d55', card: 'models' },
    lab: { zh: '思维实验', en: 'Experiment', c: '#ffb066', card: 'lab' }, place: { zh: '罗盘位置', en: 'Place', c: '#9b5de5', card: 'compass' }
  };
  var SCOPES = [['all', '全部', 'All'], ['world', '我的世界', 'Worlds'], ['phil', '哲学模型', 'Models'], ['framework', '知识框架', 'Frameworks'], ['model', '思维模型', 'Thinking'], ['lab', '思维实验', 'Labs'], ['place', '罗盘位置', 'Places']];
  var TRY = ['什么是自由？', '因果', '为什么天是蓝的', '人工智能会取代老师吗', '柏拉图', 'How do habits form?'];
  var HOW = { title: '', cue: '线索 cue', text: '内容 text', spelling: '相近拼写 close spelling', field: '同一领域 same field' };
  var CARD_IDS = ['compass', 'framework', 'models', 'lab', 'graph'];
  var RECENT = 'minest.ws2.recent';
  var root, box, input, cardsEl, scopesEl, engEl, resEl, footEl, toastEl, scope = 'all', rows = [], sel = 0, seq = 0, last = null, retryT = 0, tries = 0, typeT = 0, stats = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mark(s, q) {   // the matching part of a title, marked
    s = String(s == null ? '' : s); var i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
    return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }
  function topic(q) { var m = q.replace(/[?？。.!！]+$/, '').match(/^(?:什么是|何为|何谓)(.+)$/) || q.match(/^(.+?)(?:是什么|是什么意思)[?？]?$/) || q.match(/^what\s+(?:is|are)\s+(?:a |an |the )?(.+?)\??$/i); return m ? m[1].trim() : q; }
  function recent() { try { var a = JSON.parse(localStorage.getItem(RECENT) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }).slice(0, 6) : []; } catch (e) { return []; } }
  function remember(q) { q = String(q || '').trim(); if (!q) return; try { var a = recent().filter(function (x) { return x !== q; }); a.unshift(q.slice(0, 80)); localStorage.setItem(RECENT, JSON.stringify(a.slice(0, 6))); } catch (e) {} }
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2600); }
  function isSample() { return !!(window.MinestWorld && MinestWorld.sample); }
  function worlds() { try { return (window.MinestWorld && MinestWorld.worlds ? MinestWorld.worlds() : []).map(function (x) { return x.b || x; }); } catch (e) { return []; } }
  function inApp() { return !!(window.MinestMyWorld || window.MinestAI); }

  // ---------------------------------------------------------------- the frame (omni.js made it; 2.0 asks it more)
  function frame() { return root && root.querySelector('.mo-frame'); }
  function send(m) { var f = frame(); if (!f || !f.contentWindow) return false; try { f.contentWindow.postMessage(Object.assign({ type: 'minest-toolkit-cmd' }, m), '*'); return true; } catch (e) { return false; } }
  function ask() {
    var q = input.value.trim(); seq++; tries = 0; clearTimeout(retryT);
    if (!last || last.q !== q || last.scope !== scope) last = null;
    (function go(id) {
      send({ cmd: 'search2', input: q, scope: scope === 'world' ? 'all' : scope, id: id });
      retryT = setTimeout(function () { if (id === seq && !(last && last.id === id) && ++tries < 40) go(id); }, 400);   // the frame may still be loading
    })(seq);
    render();
  }
  window.addEventListener('message', function (e) {
    var m = e.data, f = frame(); if (!m || m.type !== 'minest-ws2') return;
    var of = overEl && overEl.querySelector('iframe');
    if (of && e.source === of.contentWindow && e.origin === location.origin) {   // 模型馆 2.0, on top
      if (m.action === 'models-close') return closeOver();
      if (m.action === 'think') { closeOver(); return MinestOmni.openCard(CARD_IDS.indexOf(m.card) >= 0 ? m.card : 'compass', String(m.input || '').slice(0, 200)); }
      return;
    }
    if (!f || e.source !== f.contentWindow) return;
    if (m.action === 'phil') return openModel(m.id);
    if (m.action === 'island') return over(BASE + '../philosophers-island/philosophers.html', '哲学家小岛 · Philosophers’ Island', true);
    if (m.action === 'results' && m.id === seq) { m.scope = scope; last = m; stats = { size: m.size, phil: m.phil }; render(); }
  });

  // ---------------------------------------------------------------- full screen over the search: 模型馆 2.0, the island, the star map
  var overEl = null;
  function over(url, title, bar) {
    closeOver(true);
    var o = overEl = document.createElement('div'); o.className = 'mn-phil ws2-over' + (bar ? ' bar' : '');   // .mn-phil: 1.0's bar leaves Esc to what is on top
    o.innerHTML = (bar ? '<div class="ws2-over-top"><button type="button">✕ 返回搜索</button><b></b></div>' : '') + '<iframe allow="fullscreen"></iframe>';
    if (bar) { o.querySelector('b').textContent = title; o.querySelector('button').onclick = function () { closeOver(); }; }
    var f = o.querySelector('iframe'); f.title = title; f.src = url;
    f.addEventListener('load', function () { try { f.contentWindow.focus(); } catch (e) {} });   // keys go to what is on top
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { o.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('on'); });
  }
  function closeOver(now) { if (!overEl) return; var o = overEl; overEl = null; o.classList.remove('on'); setTimeout(function () { o.remove(); }, now ? 0 : 240); if (!now && input && MinestOmni.isOpen()) setTimeout(function () { input.focus(); }, 60); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overEl) { e.preventDefault(); e.stopPropagation(); closeOver(); } }, true);
  function openModel(id, q) { over(BASE + 'models/index.html#embed=1' + (id ? '&m=' + encodeURIComponent(id) : '') + (q ? '&q=' + encodeURIComponent(q) : ''), '哲学模型馆 2.0'); }
  // 1.0's Knowledge Graph asks its host for Holo Lab's 知识星图: here that is the star map page (2.0 once it is deployed)
  function holo(w) {
    var tail = 'index.html' + (w && w.topic ? '#wiki=' + encodeURIComponent(w.topic) + (w.lang ? '&lang=' + w.lang : '') : ''), t = '知识星图 · Knowledge Constellation';
    fetch(BASE + '../holo-lab-2/index.html', { method: 'HEAD' }).then(function (r) { over(BASE + (r.ok ? '../holo-lab-2/' : '../holo-lab/') + tail, t, true); }).catch(function () { over(BASE + '../holo-lab/' + tail, t, true); });
  }
  if (!window.SpatialHoloLab) window.SpatialHoloLab = { ws2: true, open: function (done, o) { holo(o && o.wiki); } };

  // ---------------------------------------------------------------- build (once, on top of 1.0's bar)
  function enhance() {
    root = document.querySelector('.mo-root'); if (!root || root.classList.contains('ws2')) return !!root;
    root.classList.add('ws2'); box = root.querySelector('.mo-box'); input = root.querySelector('.mo-in'); cardsEl = root.querySelector('.mo-cards');
    var bar = root.querySelector('.mo-bar'), kbd = bar.querySelector('kbd'), old = root.querySelector('.mo-res');
    var ver = document.createElement('span'); ver.className = 'ws2-ver'; ver.textContent = '2.0'; ver.title = 'My World 搜索 2.0 · 知识引擎 2.0'; bar.insertBefore(ver, kbd);
    input.placeholder = '搜索世界、知识与哲学模型 · Search worlds, knowledge, models'; input.setAttribute('aria-controls', 'ws2-res');
    scopesEl = document.createElement('div'); scopesEl.className = 'ws2-scopes'; scopesEl.setAttribute('role', 'tablist'); scopesEl.setAttribute('aria-label', '搜索范围 Scope');
    scopesEl.innerHTML = SCOPES.map(function (s) { return '<button type="button" role="tab" data-scope="' + s[0] + '"><b>' + s[1] + '</b><em>' + s[2] + '</em></button>'; }).join('');
    engEl = document.createElement('div'); engEl.className = 'ws2-engine'; engEl.setAttribute('aria-live', 'polite');
    resEl = document.createElement('div'); resEl.className = 'ws2-res'; resEl.id = 'ws2-res'; resEl.setAttribute('role', 'listbox');
    box.insertBefore(scopesEl, old); box.insertBefore(engEl, old); box.insertBefore(resEl, old);
    footEl = document.createElement('div'); footEl.className = 'ws2-foot'; box.appendChild(footEl);
    toastEl = document.createElement('div'); toastEl.className = 'ws2-toast'; root.appendChild(toastEl);
    [].forEach.call(cardsEl.children, function (b, i) { var x = document.createElement('span'); x.className = 'ws2-x'; b.appendChild(x); var n = document.createElement('kbd'); n.className = 'ws2-n'; n.textContent = '⌥' + (i + 1); b.appendChild(n); });

    input.addEventListener('input', function () { clearTimeout(typeT); typeT = setTimeout(ask, 70); render(); });
    scopesEl.addEventListener('click', function (e) { var b = e.target.closest('[data-scope]'); if (b) { setScope(b.getAttribute('data-scope')); input.focus(); } });
    resEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-try]'); if (t) return fill(t.getAttribute('data-try'));
      var b = e.target.closest('[data-row]'); if (b) act(rows[+b.getAttribute('data-row')]);
    });
    resEl.addEventListener('pointermove', function (e) { var b = e.target.closest('[data-row]'); if (b && +b.getAttribute('data-row') !== sel) { sel = +b.getAttribute('data-row'); paintSel(); } });
    // keys come here before 1.0's own handlers on the input
    root.addEventListener('keydown', function (e) {
      if (overEl) return;
      if (e.altKey && /^Digit[1-5]$/.test(e.code)) { e.preventDefault(); e.stopPropagation(); var q = input.value.trim(); remember(q); return MinestOmni.openCard(CARD_IDS[+e.code.slice(5) - 1], q); }
      if (root.classList.contains('has-panel') || e.target !== input) return;   // a tool is open: Enter is 1.0's (it re-runs the tool)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); if (rows.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length; paintSel(true); } }
      else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); act(rows[sel]); }
      else if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); var i = SCOPES.map(function (s) { return s[0]; }).indexOf(scope); setScope(SCOPES[(i + (e.shiftKey ? -1 : 1) + SCOPES.length) % SCOPES.length][0]); }
    }, true);
    return true;
  }
  function setScope(s) { scope = s; ask(); }
  function fill(t) { input.value = t; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }

  // ---------------------------------------------------------------- results
  function worldHits(q, max) {
    var ql = q.toLowerCase(), out = [], K = window.MinestKnowledge;
    worlds().forEach(function (b) {
      if ((b.title || '').toLowerCase().indexOf(ql) >= 0) out.push({ k: 'w', t: b.title, s: '世界 World', b: b });
      (b.columns || []).forEach(function (c) {
        if ((c.title || '').toLowerCase().indexOf(ql) >= 0) out.push({ k: 'l', t: c.title, s: b.title + ' · 列表 List', b: b, c: c });
        (c.cards || []).forEach(function (k) { if (!k || !k.title || (K && K.isHeading && K.isHeading(k.id))) return; if (k.title.toLowerCase().indexOf(ql) >= 0) out.push({ k: 'c', t: k.title, s: b.title + ' › ' + (c.title || ''), b: b, c: c, card: k }); });
      });
    });
    return out.slice(0, max);
  }
  function render() {
    if (!resEl) return;
    var q = input.value.trim(), groups = [], pending = !!q && !(last && last.q === q), t = topic(q);
    rows = [];
    function group(title, list, note) { if (list.length) { groups.push({ title: title, note: note || '', from: rows.length, n: list.length }); rows = rows.concat(list); } }
    if (!q) {
      group('最近 · Recent', recent().map(function (x) { return { k: 'recent', t: x, s: '' }; }));
      if (scope === 'all' || scope === 'world') group('我的世界 · My worlds', worlds().slice(0, 4).map(function (b) { return { k: 'w', t: b.title, s: (b.columns || []).length + ' 个列表', b: b }; }), isSample() ? '示例 Sample' : '');
      group('去处 · Go to', [{ k: 'gallery', t: '哲学模型馆 2.0', s: (stats ? stats.phil : 46) + ' 个可以动手的哲学模型 · 时间线 · 学习路径 · 笔记' }, { k: 'home', t: inApp() ? '打开 My World' : '打开 Minest', s: inApp() ? 'All my worlds' : '原版 · the app' }]);
    } else {
      if (scope === 'all' || scope === 'world') group('我的世界 · My worlds', worldHits(q, scope === 'world' ? 14 : 4), isSample() ? '示例 Sample' : '');
      if (scope !== 'world' && last && last.q === q && last.hits) {
        var by = {}, order = [];
        last.hits.forEach(function (h) { if (!by[h.kind]) { by[h.kind] = []; order.push(h.kind); } by[h.kind].push({ k: h.kind, t: h.title, s: [h.en && h.en !== h.title ? h.en : '', h.sub, HOW[h.how] || ''].filter(Boolean).join(' · '), h: h, isNew: h.isNew }); });
        order.forEach(function (k) { group(KIND[k].zh + ' · ' + KIND[k].en, by[k]); });
      }
      if (scope === 'all') group('动作 · Actions', [{ k: 'think', t: '用五张卡片思考「' + q + '」', s: '思想罗盘 → 框架 → 模型 → 实验 → 图谱' }, { k: 'build', t: '✦ 搭建世界「' + q + '」', s: 'Build a world about it' }]);
    }
    if (sel >= rows.length) sel = 0;
    var html = '';
    if (!q) html += '<div class="ws2-try"><span>试试 Try</span>' + TRY.map(function (x) { return '<button type="button" data-try="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
    groups.forEach(function (g) {
      html += '<div class="ws2-g"><span>' + esc(g.title) + '</span>' + (g.note ? '<em>' + esc(g.note) + '</em>' : '') + '<i>' + g.n + '</i></div>';
      for (var i = g.from; i < g.from + g.n; i++) { var r = rows[i], kd = KIND[r.k];
        html += '<button type="button" role="option" class="ws2-r k-' + r.k + '" data-row="' + i + '" id="ws2-r' + i + '" style="--k:' + (kd ? kd.c : r.k === 'build' ? '#ffe28a' : '#cfd6ff') + '"><span class="dot"></span><b>' + mark(r.t, r.t.toLowerCase().indexOf(q.toLowerCase()) >= 0 ? q : t) + '</b>' +
          (r.isNew ? '<u>2.0 新</u>' : '') + '<small>' + esc(r.s) + '</small>' + (kd ? '<kbd>' + kd.zh + '</kbd>' : '') + '</button>'; }
    });
    if (pending && scope !== 'world') html += '<div class="ws2-wait"><i></i>知识引擎在找… searching what it knows</div>';
    else if (q && !rows.length) html += '<div class="ws2-none">这个范围里没有找到「' + esc(q) + '」 · 换个说法，或按 Tab 换范围</div>';
    resEl.innerHTML = html; paintSel();
    [].forEach.call(scopesEl.children, function (b) { var on = b.getAttribute('data-scope') === scope; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    engine(q, pending); extras(q); foot();
  }
  function paintSel(scroll) {
    [].forEach.call(resEl.querySelectorAll('[data-row]'), function (b) { var on = +b.getAttribute('data-row') === sel; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); if (on && scroll) b.scrollIntoView({ block: 'nearest' }); });
    if (rows.length) input.setAttribute('aria-activedescendant', 'ws2-r' + sel); else input.removeAttribute('aria-activedescendant');
  }
  function engine(q, pending) {
    var a = last && last.q === q && last.analysis;
    if (!q) { engEl.innerHTML = ''; return; }
    if (!a) { engEl.innerHTML = pending ? '<span class="tag">知识引擎 2.0</span><span class="dim">…</span>' : ''; return; }
    engEl.innerHTML = '<span class="tag">知识引擎 2.0</span><span class="type">' + esc(a.type) + '</span>' + (a.place ?
      '<span class="place">' + esc(a.place) + '</span><span class="meter" role="img" aria-label="置信度 ' + a.confidence + '%"><i style="width:' + a.confidence + '%"></i></span><b>' + a.confidence + '%</b>' +
      (a.uncertain ? '<span class="dim">不太确定 · 可在罗盘里改</span>' : '') +
      a.candidates.slice(1).map(function (c) { return '<span class="cand' + (c.isNew ? ' new' : '') + '">' + esc(c.zh) + ' ' + c.share + '%</span>'; }).join('') :
      '<span class="dim">没有找到明确的位置 · 打开思想罗盘自己选一个</span>');
  }
  function extras(q) {   // one more line on each of the five cards
    var d = last && last.q === q ? last : null, a = d && d.analysis, c = d && d.cards, x = {};
    if (a && c) {
      x.compass = a.place ? '置信度 ' + a.confidence + '%' + (a.uncertain ? ' · 不确定' : '') : '';
      x.framework = c.frameworks.length ? c.frameworks.slice(0, 2).join(' · ') : '';
      x.models = c.models[1] ? '还可以：' + c.models[1] : '';
      x.lab = c.philCount ? c.philCount + ' 个哲学模型 · ' + c.phil[0].zh.split(' · ').pop() : '';
      x.graph = c.saved ? '已保存 · ' + c.concepts + ' 个概念' : a.candidates.length > 1 ? '相邻：' + a.candidates.slice(1).map(function (k) { return k.zh; }).join('、') : '';
    } else if (!q && stats) x.lab = stats.phil + ' 个哲学模型';
    [].forEach.call(cardsEl.children, function (b) { var el = b.querySelector('.ws2-x'), t = x[b.getAttribute('data-card')] || ''; if (el && el.textContent !== t) { el.textContent = t; el.classList.toggle('in', !!t); } });
  }
  function foot() {
    footEl.innerHTML = '<span><kbd>↑↓</kbd>选择</span><span><kbd>↵</kbd>打开</span><span><kbd>Tab</kbd>范围</span><span><kbd>⌥1–5</kbd>五张卡片</span><span><kbd>esc</kbd>关闭</span>' +
      '<em>知识引擎 2.0' + (stats ? ' · 认识 ' + stats.size + ' 项' : '') + '</em>';
  }

  // ---------------------------------------------------------------- a row is chosen
  function act(r) {
    if (!r) return; var q = input.value.trim();
    if (r.k === 'recent') return fill(r.t);
    if (q) remember(q);
    if (r.k === 'gallery') return openModel(null);
    if (r.k === 'phil') return openModel(r.h.id);
    if (r.k === 'think') return MinestOmni.openCard('compass', q);
    if (KIND[r.k] && KIND[r.k].card) {   // into the card that holds it, on the thought in the bar
      var card = KIND[r.k].card;
      if (r.k === 'model' || r.k === 'lab') send({ cmd: 'open2', card: card, input: q, model: r.k === 'model' ? r.h.id : null, lab: r.k === 'lab' ? r.h.id : null });   // first: 1.0's open follows
      return MinestOmni.openCard(card, q);
    }
    if (!inApp()) {   // this page on its own: there is no app behind the bar
      if (r.k === 'home') { window.open(BASE + '../iphone.html', '_blank'); return; }
      if (r.k === 'build') return toast('在 Minest 里，这一步会为「' + q + '」搭建一个新世界 · Opens the world builder in the app');
      fill(r.t); return toast((isSample() ? '示例内容 · ' : '') + '在 Minest 里会直接打开它 — 这里先用它来思考');
    }
    MinestOmni.close();
    setTimeout(function () {
      try {
        if (r.k === 'build') { if (window.MinestNewWorld) MinestNewWorld.open('gen', q); else if (window.MinestMyWorld) MinestMyWorld.gallery(); }
        else if (r.k === 'home') { if (window.MinestMyWorld) MinestMyWorld.open(); }
        else if (r.k === 'w') { if (window.MinestMyWorld && MinestMyWorld.world) MinestMyWorld.world(r.b.id); else if (window.MinestAI) MinestAI.selectBoard(r.b.id); }
        else if (r.k === 'l') { if (window.MinestAI && MinestAI.showList) MinestAI.showList(r.b.id, r.c.id); }
        else if (r.k === 'c') { if (window.MinestAI && MinestAI.openCardIn) MinestAI.openCardIn(r.b.id, r.c.id, r.card.id); }
      } catch (e) {}
    }, 220);
  }

  // ---------------------------------------------------------------- 1.0 opens its bar → 2.0 dresses it
  function onOpen() { if (!enhance()) return; sel = 0; ask(); }
  new MutationObserver(function () { if (document.documentElement.classList.contains('mo-open')) onOpen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (MinestOmni.isOpen()) onOpen();

  window.MinestWorldSearch2 = { version: '2.0', open: function (q, card) { if (card) MinestOmni.openCard(card, q || ''); else MinestOmni.open(q != null ? { input: q } : {}); }, models: openModel, scope: setScope, state: function () { return { scope: scope, rows: rows.map(function (r) { return { k: r.k, t: r.t }; }), last: last, sel: sel }; } };
})();
