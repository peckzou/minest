/* Minest Knowledge · list ⋯ menu extras (MinestListMenu)
   - Random Labels: one tap gives every card in a list one of the board's labels (spread evenly, shuffled).
     Two ways: every card (cards inside a stack too) or only the first card of each stack (plus single cards).
     The toast carries Undo, which puts each card's own labels back.
   - Wallet View moves from the list header into the ⋯ menu (the header button stays, hidden, and is what runs it).
   - The pinned Contents list (contents.js) uses the same menu rows through MinestListMenu.menu(). */
(function () {
  if (window.MinestListMenu) return;
  var CSS = [
    '.kanban-column-header .col-wallet-trigger-btn{display:none!important}',
    '.mn-lm-pop{position:fixed;z-index:9000;width:268px;max-height:70vh;overflow-y:auto}',
    '.mn-lm-dim{position:fixed;inset:0;z-index:8999}',
    '.mn-lm-tg{display:flex;align-items:flex-start;gap:10px;padding:9px 14px;font-size:15px;font-weight:500;border-radius:14px}.mn-lm-tg .ic{width:18px;text-align:center;flex:none}',
    '.mn-lm-tg .tx{display:flex;flex-direction:column;gap:7px;min-width:0}.mn-lm-chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.mn-lm-chips button{height:28px;padding:0 11px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.mn-lm-chips button.on{background:#30b45a;border-color:transparent;color:#fff}.mn-lm-chips button.on:after{content:" ✓"}',
    '.theme-white .mn-lm-chips button{border-color:rgba(0,0,0,.14);background:rgba(0,0,0,.03)}',
    '.mn-lm-row.mn-lm-head{opacity:1}.mn-lm-row .mn-lm-sub{white-space:nowrap}',
    'html.mn-lm-ghost .kanban-column-wrapper .column-menu-popover{visibility:hidden!important;pointer-events:none!important}',
    '.mn-lm-row .mn-lm-sub{margin-left:auto;font-size:11px;opacity:.55}'
  ].join('\n');
  function css() { if (document.getElementById('mn-lm-css')) return; var s = document.createElement('style'); s.id = 'mn-lm-css'; s.textContent = CSS; document.head.appendChild(s); }
  function toast(msg, o) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(msg, o); } catch (e) {} alert(msg); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function board() { try { return window.MinestAI && MinestAI.board && MinestAI.board(); } catch (e) { return null; } }

  // ---------------------------------------------------------------- Random Labels · Random Color Covers (on / off)
  // One tap turns it on for the list (✓ in the menu); the next tap turns it off and puts every card back as it was —
  // except a card changed by hand since (its own choice stays). Modes: every card (stacked cards too) or stack tops.
  // State per list, synced: 'lm:rand:<board>:<lists>:<labels|covers>' = { mode, set: {card: value}, prev: {card: value} }.
  var KN = function () { return window.MinestKnowledge; };
  function shuffled(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var SWATCH = [['#4bce97', 'stripes'], ['#f5cd47', 'arch'], ['#fea362', 'bars'], ['#f87168', 'dots'], ['#9f8fef', 'zigzag'], ['#579dff', 'ladder'], ['#6cc3e0', 'slash'], ['#94c748', 'brackets'], ['#e774bb', 'column-dots'], ['#8590a2', 'dashed']];
  var KIND = {
    labels: { name: 'Random labels', get: function (x) { return Array.isArray(x.labels) ? x.labels.slice() : []; }, put: function (x, v) { return Object.assign({}, x, { labels: v || [] }); },
      ok: function () { return true; }, pool: function (b) { return (b.labelDefinitions || []).filter(function (d) { return d && d.id; }).map(function (d) { return [d.id]; }); },
      none: 'This board has no labels yet — add one in a card first.' },
    covers: { name: 'Random color covers', get: function (x) { return x.cover || null; }, put: function (x, v) { var n = Object.assign({}, x); if (v) n.cover = v; else delete n.cover; return n; },
      ok: function (x) { return !x.cover || x.cover.type === 'color'; }, pool: function () { return SWATCH.map(function (w) { return { type: 'color', value: w[0], pattern: w[1], size: 'banner' }; }); },
      none: 'No colours to use.' }
  };
  function same(a, b) { return JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b); }
  function stKey(b, colIds, kind) { return 'lm:rand:' + b.id + ':' + colIds.join(',') + ':' + kind; }
  function state(colIds, kind) { var b = board(); return b && KN() ? KN().get(stKey(b, colIds, kind)) : null; }
  function each(b, colIds, fn) { (b.columns || []).forEach(function (c) { if (colIds.indexOf(c.id) < 0) return; (c.cards || []).forEach(function (k) { fn(k, false); (k.stack || []).forEach(function (s) { if (s && s.id) fn(s, true); }); }); }); }
  // toggle(kind, [listId], mode): on (or switch mode) / off
  function toggle(kind, colIds, mode) {
    var b = board(), K = KIND[kind]; if (!b || !window.MinestAI.updateBoard || !K) return;
    var key = stKey(b, colIds, kind), st = KN().get(key), plan = {}, back = 0;
    // 1 · off: what we set and nobody changed since goes back
    if (st) each(b, colIds, function (x) { if (st.set && st.set.hasOwnProperty(x.id) && same(K.get(x), st.set[x.id])) { plan[x.id] = st.prev[x.id]; back++; } });
    var turnOn = !st || st.mode !== mode, next = null, n = 0, kept = 0;
    if (turnOn) {
      var pool0 = K.pool(b); if (!pool0.length) { if (!st) return toast(K.none); }
      else {
        next = { mode: mode, set: {}, prev: {} }; var bag = [];
        each(b, colIds, function (x, stacked) {
          if (stacked && mode !== 'all') return;
          var cur = plan.hasOwnProperty(x.id) ? plan[x.id] : K.get(x), probe = K.put(x, cur);
          if (!K.ok(probe)) { kept++; return; }
          if (!bag.length) bag = shuffled(pool0); var v = bag.pop();
          if (kind === 'covers' && cur && cur.size) v = Object.assign({}, v, { size: cur.size });
          next.prev[x.id] = cur; next.set[x.id] = v; plan[x.id] = v; n++;
        });
        if (!n) next = null;
      }
    }
    if (!Object.keys(plan).length && !next) return toast(kept ? 'Every card here has a photo cover — those stay.' : 'No cards here yet.');
    function fix(x) { return x && plan.hasOwnProperty(x.id) ? K.put(x, plan[x.id]) : x; }
    window.MinestAI.updateBoard(b.id, function (bd) {
      return Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) {
        if (colIds.indexOf(c.id) < 0) return c;
        return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { var m = fix(k); if (Array.isArray(k.stack)) m = Object.assign({}, m, { stack: k.stack.map(fix) }); return m; }) });
      }) });
    });
    KN().set(key, next, true);
    toast(next ? '✓ ' + K.name + ' on · ' + n + ' card' + (n === 1 ? '' : 's') + (kept ? ' · ' + kept + ' photo cover' + (kept === 1 ? '' : 's') + ' kept' : '') + ' — tap again to turn off'
      : K.name + ' off — ' + back + ' card' + (back === 1 ? '' : 's') + ' put back');
  }
  function randomLabels(colIds, mode) { return toggle('labels', colIds, mode); }
  function randomCovers(colIds, mode) { return toggle('covers', colIds, mode); }

  // ---------------------------------------------------------------- menu rows (the board's own ⋯ menu look)
  var ROW = 'w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl hover:bg-emerald-500/20 hover:text-emerald-400 text-left transition-colors mn-lm-row';
  var SEP = '<div class="h-[1px] my-1 bg-white/10"></div>';
  var CHK = '<span style="margin-left:8px;color:#34d399;font-weight:700">✓</span>';
  function rowHtml(icon, label, act, sub, on) { return '<button type="button" class="' + ROW + '" data-mn-lm="' + act + '"' + (on != null ? ' aria-pressed="' + !!on + '"' : '') + '><span class="w-3.5 text-center">' + icon + '</span><span>' + esc(label) + '</span>' + (sub ? '<span class="mn-lm-sub">' + esc(sub) + '</span>' : '') + (on ? CHK : '') + '</button>'; }
  // one row per random tool, its two ways as chips under the name: tap = on (green), tap again = off
  function chipsRow(icon, label, code, st) {
    return '<div class="mn-lm-tg" data-kind="' + code + '"><span class="ic">' + icon + '</span><div class="tx"><span>' + esc(label) + '</span><span class="mn-lm-chips">' +
      '<button type="button" data-mn-lm="' + code + '-all"' + (st && st.mode === 'all' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>All cards</button>' +
      '<button type="button" data-mn-lm="' + code + '-top"' + (st && st.mode === 'top' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>Stack tops</button></span></div></div>';
  }
  function labelRows(colId) { return chipsRow('🎲', 'Random Labels', 'rl', state([colId], 'labels')) + chipsRow('🎨', 'Random Color Covers', 'rc', state([colId], 'covers')); }

  // the board's own list menu: Wallet View + Random Labels after "Hide / Show Labels"
  function enhance(pop) {
    if (pop.__mnLm || pop.classList.contains('mn-lm-pop')) return;
    var wrap = pop.closest('.kanban-column-wrapper'); if (!wrap) return;
    pop.__mnLm = true;
    var colId = wrap.getAttribute('data-col-id');
    var anchor = Array.prototype.filter.call(pop.querySelectorAll('button'), function (x) { return /(Hide|Show) Labels/.test(x.textContent); })[0];
    var box = document.createElement('div'); box.className = 'mn-lm-box';
    box.innerHTML = (wrap.querySelector('.col-wallet-trigger-btn') ? rowHtml('💳', 'Wallet View', 'wallet') : '') + labelRows(colId);
    if (anchor && anchor.parentNode === pop) pop.insertBefore(box, anchor.nextSibling);
    else if (anchor) anchor.parentNode.insertBefore(box, anchor.nextSibling);
    else pop.insertBefore(box, pop.firstChild);
    box.addEventListener('click', function (e) {
      var r = e.target.closest('[data-mn-lm]'); if (!r) return;
      e.stopPropagation();
      var act = r.getAttribute('data-mn-lm'), btn = wrap.querySelector('.column-menu-btn');
      if (btn) btn.click();   // close the menu first
      setTimeout(function () {
        if (act === 'wallet') { var w = wrap.querySelector('.col-wallet-trigger-btn'); if (w) w.click(); }
        else if (/^rc-/.test(act)) randomCovers([colId], act === 'rc-all' ? 'all' : 'top');
        else randomLabels([colId], act === 'rl-all' ? 'all' : 'top');
      }, 40);
    });
  }
  function watch() {
    if (!document.body) return setTimeout(watch, 200);
    css();
    new MutationObserver(function () {
      var ps = document.querySelectorAll('.column-menu-popover:not(.mn-sheet-ghost)');
      for (var i = 0; i < ps.length; i++) enhance(ps[i]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  watch();

  // a free-standing ⋯ menu in the board's look, by a button: items = [[icon, label, fn, sub?, checked?] | '-']
  var cur = null;
  function closeMenu() { if (cur) { var c = cur; cur = null; c.pop.remove(); c.dim.remove(); if (c.onClose) c.onClose(); } }
  function menu(btn, items, opts) {
    css(); closeMenu();
    var white = !!document.querySelector('.theme-white');
    var dim = document.createElement('div'); dim.className = 'mn-lm-dim';
    var pop = document.createElement('div');
    pop.className = 'column-menu-popover mn-lm-pop rounded-2xl p-2.5 shadow-2xl border backdrop-blur-2xl animate-fadeIn ' + (white ? 'bg-white border-black/10 text-slate-800' : 'bg-[#1a2430] border-white/20 text-white') + ' mn-sheet';
    pop.innerHTML = items.map(function (it, i) {
      if (it === '-') return SEP;
      if (it[2] === null) return '<div style="padding:6px 12px 4px;font-size:12px;font-weight:650;opacity:.6">' + esc(it[1]) + '</div>';
      if (it[6]) return '<div class="mn-lm-tg"><span class="ic">' + (it[0] || '') + '</span><div class="tx"><span>' + esc(it[1]) + '</span><span class="mn-lm-chips">' + it[6].map(function (c, j) { return '<button type="button" data-ci="' + i + '-' + j + '"' + (c.on ? ' class="on"' : '') + '>' + esc(c.t) + '</button>'; }).join('') + '</span></div></div>';
      return '<button type="button" class="' + ROW + '" data-i="' + i + '"><span class="w-3.5 text-center">' + (it[0] || '') + '</span><span>' + esc(it[1]) + '</span>' +
        (it[3] ? '<span class="mn-lm-sub">' + esc(it[3]) + '</span>' : '') + (it[4] ? '<span style="margin-left:auto;color:#34d399">✓</span>' : '') + '</button>';
    }).join('');
    document.body.appendChild(dim); document.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), w = 268, vw = window.innerWidth, vh = window.innerHeight;
    pop.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + 'px';
    var top = r.bottom + 6, h = pop.offsetHeight;
    if (top + h > vh - 8) top = Math.max(8, vh - 8 - h);
    pop.style.top = top + 'px';
    cur = { pop: pop, dim: dim, onClose: opts && opts.onClose };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) { dim.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); pop.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    dim.addEventListener('click', function (e) { e.stopPropagation(); closeMenu(); });
    pop.addEventListener('click', function (e) {
      e.stopPropagation();
      var ci = e.target.closest('[data-ci]');
      if (ci) { var q = ci.getAttribute('data-ci').split('-'), ch = items[+q[0]][6][+q[1]]; closeMenu(); if (ch && ch.fn) ch.fn(); return; }
      var b = e.target.closest('[data-i]'); if (!b) return;
      var it = items[+b.getAttribute('data-i')];
      if (it && it[5] === 'keep') { if (cur) cur.onClose = null; }   // the item takes over (it closes what it opened itself)
      closeMenu(); if (it && it[2]) it[2]();
    });
    return pop;
  }

  // a list's own full ⋯ menu, shown by another button (Contents): the board opens the real menu out of sight, every row
  // here presses the real row — so it is the same menu, the same actions, on that list only
  function realPop(wrap) { return wrap.querySelector('.column-menu-popover:not(.mn-sheet-ghost):not(.mn-lm-pop)'); }   // not the closing animation's copy
  function proxy(anchor, colId, top, title, bottom, onTitle) {
    var wrap = document.querySelector('.kanban-column-wrapper[data-col-id="' + (window.CSS && CSS.escape ? CSS.escape(colId) : colId) + '"]'), btn = wrap && wrap.querySelector('.column-menu-btn');
    if (!btn) return menu(anchor, (top || []).concat(['-', ['', 'That list is not on the board view right now.', null]]));
    var root = document.documentElement; root.classList.add('mn-lm-ghost');
    if (!realPop(wrap)) btn.click();
    var tries = 0;
    (function ready() {
      var pop = realPop(wrap);
      if ((!pop || !pop.__mnLm) && tries++ < 20) return setTimeout(ready, 30);
      if (!pop) { root.classList.remove('mn-lm-ghost'); return menu(anchor, top || []); }
      function shut() { var p = realPop(wrap); if (p) btn.click(); setTimeout(function () { root.classList.remove('mn-lm-ghost'); }, 60); }
      var rows = [], seen = 0, bs = [];
      Array.prototype.forEach.call(pop.querySelectorAll('button, [class*="uppercase"], .mn-lm-tg'), function (el) {
        if (el.classList.contains('mn-lm-tg')) {
          var kind = el.getAttribute('data-kind') === 'rc' ? 'covers' : 'labels', st0 = state([colId], kind), go = function (mode) { return function () { toggle(kind, [colId], mode); }; };
          rows.push([el.querySelector('.ic').textContent, el.querySelector('.tx > span').textContent, undefined, '', false, 'keep', [{ t: 'All cards', on: !!(st0 && st0.mode === 'all'), fn: go('all') }, { t: 'Stack tops', on: !!(st0 && st0.mode === 'top'), fn: go('top') }]]);
          return;
        }
        if (el.closest('.mn-lm-chips')) return;
        if (el.tagName !== 'BUTTON') { var h = el.textContent.trim(); if (h && h.length < 40 && !el.querySelector('button')) rows.push(['', h, null]); return; }
        var tx = el.textContent.replace(/\s+/g, ' ').trim(); if (!tx) return;
        var idx = bs.length; bs.push(el);
        var sub = el.querySelector('.mn-lm-sub'), on = el.getAttribute('aria-pressed') === 'true' || !!el.querySelector('.lucide-check');
        var label = sub ? tx.replace(sub.textContent, '').replace('✓', '').trim() : tx.replace('✓', '').trim();
        var em = label.match(/^((?:\p{Extended_Pictographic}|[✨↑⏱])\uFE0F?)\s*/u), icon = em ? em[1] : '';
        if (em) label = label.slice(em[0].length);
        var svg = !icon && el.querySelector('svg:not(.lucide-check)'); if (svg && !svg.closest('.mn-lm-sub')) icon = '<span style="display:inline-flex;width:15px;height:15px">' + svg.outerHTML.replace(/class="[^"]*"/, 'width="15" height="15"') + '</span>';
        rows.push([icon, label, function () { press(idx); }, sub ? sub.textContent : '', on, 'keep']);
      });
      function press(i) {
        var p = realPop(wrap), all = p ? Array.prototype.filter.call(p.querySelectorAll('button'), function (x) { return x.textContent.replace(/\s+/g, ' ').trim(); }) : [], b = all[i];
        if (!b) return shut();
        var before = p.textContent, label = b.textContent;
        if (/Add Card|Quick Add/i.test(label)) { try { wrap.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' }); } catch (e) {} }
        b.click();
        setTimeout(function () {
          var p2 = realPop(wrap);
          if (!p2) return root.classList.remove('mn-lm-ghost');
          if (p2.textContent !== before && !/Show Card Count|Expand|Collapse|Hide|Reveal|Sort|Order|Labels|Covers/i.test(label)) {   // it opened more choices: bring the list and its menu into view
            try { wrap.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' }); } catch (e) {} root.classList.remove('mn-lm-ghost'); return;
          }
          shut();
        }, 320);
      }
      var head = onTitle ? [['📋', title || 'List', function () { shut(); onTitle(); }, 'change ›']] : [['', title || 'List options', null]];
      menu(anchor, (top || []).concat(top && top.length ? ['-'] : []).concat(head).concat(rows).concat(bottom && bottom.length ? ['-'].concat(bottom) : []), { onClose: shut });
    })();
  }

  window.MinestListMenu = { randomLabels: randomLabels, randomCovers: randomCovers, menu: menu, proxy: proxy, close: closeMenu, state: state, _enhance: enhance };
})();
