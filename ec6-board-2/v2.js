/* Minest · EC–6 布告栏 2.0 — Study Studio MK II
   1.0's board is loaded unchanged (../spatial-home/js/board-ec6.js): the data, the daily picks, the craft tools and the
   Kanban links are all its code. This file only adds to it while it runs:
     the rail     the board's tools as one rail beside the board (never on top of it): view tools, and the craft tools in 排版
     the board    progress rings · weeks to the exam · this week's study days and streak · 认识 / 稍后 keys on the word card
     new tools    聚光 (one card enlarged to read) · 换一批 · 便签 · 专注计时 · 背景 · 打印
   It talks to 1.0 the way a hand would: it presses 1.0's own (hidden) buttons and reads the board 1.0 draws. */
(function () {
  'use strict';
  var E = window.SpatialEC6, doc = document; if (!E || !E._) return;
  var boardEl = doc.getElementById('board'), rail = doc.getElementById('rail'), hostFrame = doc.getElementById('host');
  var UI_KEY = 'minest.ec6board2.ui', ui = { surface: 'cork', pomo: {}, timer: null };
  try { var saved = JSON.parse(localStorage.getItem(UI_KEY) || 'null'); if (saved) for (var k in ui) if (saved[k] !== undefined) ui[k] = saved[k]; } catch (e) {}
  function saveUi() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) {} }
  function S() { return E._.S(); }
  function saveS() { try { localStorage.setItem('minest.ec6board.v1', JSON.stringify(S())); } catch (e) {} }   // the page sends this key to 2.0's own
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dayStr(new Date()); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  var el = null, cork = null, obs = null, clsObs = null, leaving = false, entered = false;
  var spot = null, picking = false, sample = false, hostWin = null;

  /* ───────────────────────── Minest itself: the app in a frame (your boards), or the sample board ───────────────────────── */
  function appUrl() {
    var u = '../index.html';
    try { var q = new URLSearchParams(location.search).get('app'); if (q && new URL(q, location.href).origin === location.origin) u = q; } catch (e) {}
    return u;
  }
  function sampleWin() {
    var n = 0, card = function (t, zh, d) { return { id: 's-' + (++n), title: t, titleZh: zh || '', desc: d || '', meaning: d || '', mastery: 1, complete: false }; };
    var col = function (t, cards) { return { id: 's-col-' + (++n), title: t, cards: cards }; };
    var B = [
      { id: 's-ec6', title: 'EC–6 Anchor Charts · 示例', columns: [
        col('Language Arts', [card('Parts of Speech', '词性', 'Nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions and interjections — the eight jobs a word can do.'), card('Story Elements', '故事要素', 'Characters, setting, problem, events and solution.'), card('Main Idea & Details', '主旨与细节', 'The main idea is the table top; the details are the legs that hold it up.')]),
        col('Math', [card('Properties of Operations', '运算律', 'Commutative, associative and distributive properties, each with a worked example.'), card('Place Value', '位值', 'Each place is ten times the place to its right.'), card('Fractions on a Number Line', '数轴上的分数', 'Equal parts between 0 and 1.')]),
        col('Science', [card('Forms of Energy & Energy Transformations', '能量形式与转化', 'MELTS: mechanical, electrical, light, thermal, sound — and how one becomes another.'), card('The Water Cycle', '水循环', 'Evaporation, condensation, precipitation, collection.'), card('States of Matter', '物质的状态', 'Solid, liquid, gas: how the particles move.')]),
        col('Social Studies', [card('Rights vs. Responsibilities', '权利与责任', 'What citizens are free to do, and what they owe each other: voting, jury duty, taxes.'), card('Three Branches of Government', '三权分立', 'Legislative makes laws, executive carries them out, judicial interprets them.'), card('Map Skills', '地图技能', 'Compass rose, scale, legend, latitude and longitude.')]),
        col('Fine Arts · Health · PE', [card('Warm vs. Cool Colors', '暖色与冷色', 'Reds, oranges and yellows feel warm and lively; blues, greens and purples feel calm.'), card('Elements of Music', '音乐要素', 'Rhythm, melody, harmony, tempo, dynamics.'), card('Food Groups', '食物分类', 'Fruits, vegetables, grains, protein, dairy.')])
      ] },
      { id: 's-day', title: 'My Day · 示例', columns: [col('To Do', []), col('Done', [])] },
      { id: 's-vocab', title: 'Vocabulary · 示例', columns: [col('Academic Words', [card('photosynthesis', '光合作用'), card('inference', '推断'), card('denominator', '分母'), card('constitution', '宪法'), card('habitat', '栖息地'), card('perimeter', '周长'), card('synonym', '同义词'), card('erosion', '侵蚀')])] }
    ];
    function find(id) { var out = null; B.some(function (b) { return b.columns.some(function (c) { return c.cards.some(function (x) { if (x.id === id) { out = x; return true; } return false; }); }); }); return out; }
    return { MinestAI: {
      boards: function () { return B; },
      patchCard: function (id, p) { var x = find(id); if (x) Object.assign(x, p); },
      rateCard: function (id, m) { var x = find(id); if (x) x.mastery = m; },
      updateBoard: function (id, fn) { B = B.map(function (b) { return b.id === id ? fn(b) : b; }); },
      openCard: function (id) { var x = find(id); if (x) cardSheet(x); return !!x; }
    } };
  }
  var hostP = new Promise(function (res) {
    function useSample() { sample = true; doc.getElementById('sample').hidden = false; hostFrame.remove(); hostWin = sampleWin(); res(hostWin); }
    if (window.EC6V2_DEMO) { useSample(); return; }
    hostFrame.src = appUrl();
    var t0 = Date.now(), iv = setInterval(function () {
      var w = null, ok = false;
      try { w = hostFrame.contentWindow; ok = !!(w && w.document && w.document.readyState === 'complete' && w.document.getElementById('root') && w.MinestAI && w.MinestAI.boards); } catch (e) {}
      if (ok) { clearInterval(iv); hostWin = w; res(w); }
      else if (Date.now() - t0 > 45000) { clearInterval(iv); useSample(); }
    }, 250);
  });
  /* a card of the sample board, opened */
  function cardSheet(x) {
    var old = doc.getElementById('v2card'); if (old) old.remove();
    var d = doc.createElement('div'); d.id = 'v2card';
    d.innerHTML = '<div class="v2-cardin"><small>示例卡片</small><h3>' + esc(x.title) + '</h3>' + (x.titleZh ? '<h4>' + esc(x.titleZh) + '</h4>' : '') + '<p>' + esc(x.desc || '在 Minest 里，这里打开的是 Kanban 上的这张卡片。') + '</p><button type="button">回到布告栏</button></div>';
    d.addEventListener('click', function (e) { if (e.target === d || e.target.tagName === 'BUTTON') d.remove(); });
    doc.body.appendChild(d);
  }

  /* ───────────────────────── 1.0's panel: opened, watched, opened again ───────────────────────── */
  function bar(name) { var b = el && el.querySelector('.e6-bar [data-b="' + name + '"]'); if (b) b.click(); return !!b; }
  function toast(s) {
    if (!el) return; var t = el.querySelector('.e6-toast');
    if (!t) { t = doc.createElement('div'); t.className = 'e6-toast'; el.appendChild(t); }
    t.textContent = s; t.hidden = !s; clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  /* 1.0 draws the board again whenever 排版 is switched; twice leaves the mode as it was */
  function redraw(msg) { bar('edit'); bar('edit'); toast(msg || ''); }
  function key(k) { if (el) el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }

  function openBoard() {
    leaving = false; spot = null; picking = false; closePop();
    var p = E.open({ container: boardEl, host: function () { return hostP; } });
    el = boardEl.lastElementChild; cork = el.querySelector('.e6-cork');
    obs = new MutationObserver(decorate); obs.observe(cork, { childList: true });
    clsObs = new MutationObserver(syncRail); clsObs.observe(el, { attributes: true, attributeFilter: ['class'] });
    /* on this page the board is the page: a tap on the wall or Esc does not put it away */
    el.addEventListener('click', function (e) { if (e.target === el) e.stopImmediatePropagation(); }, true);
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      e.stopImmediatePropagation(); if (spot || picking) clearSpot(); closePop();
    }, true);
    cork.addEventListener('pointerdown', function (e) { if (picking) e.stopPropagation(); }, true);
    cork.addEventListener('click', corkClick, true);
    decorate(); syncRail();
    p.then(closed);
  }
  function closed(res) {
    if (obs) obs.disconnect(); if (clsObs) clsObs.disconnect(); el = null; cork = null;
    if (leaving) { leave(); return; }
    if (res && res.feature === 'kanban') {
      if (sample) {
        openBoard(); try { res.after && res.after(hostWin); } catch (e) {}
        setTimeout(function () { if (!doc.getElementById('v2card')) toast('示例内容里没有 Kanban · 连上 Minest 后可用'); }, 260);
      } else showApp(res.after);
    } else openBoard();
  }
  function leave() {
    var same = false; try { same = !!doc.referrer && new URL(doc.referrer).origin === location.origin; } catch (e) {}
    if (same && history.length > 1) history.back(); else location.href = '../';
  }
  /* the Kanban (a card, or the whole board) is Minest itself, brought to the front; one key comes back */
  function showApp(after) {
    doc.body.classList.add('v2-app'); doc.getElementById('toBoard').hidden = false;
    try { after && after(hostWin); } catch (e) {}
    try { hostFrame.focus(); } catch (e) {}
  }
  doc.getElementById('toBoard').addEventListener('click', function () {
    doc.body.classList.remove('v2-app'); this.hidden = true; entered = true; openBoard();
  });

  /* ───────────────────────── the board, added to after every time 1.0 draws it ───────────────────────── */
  function activeDays() {
    var s = S(), on = {};
    Object.keys(s.opened || {}).forEach(function (d) { if (Object.keys(s.opened[d] || {}).length) on[d] = 1; });
    (s.mastered || []).forEach(function (m) { if (m.day && !m.undone) on[m.day] = 1; });
    Object.keys(s.words || {}).forEach(function (k) { var kn = (s.words[k] || {}).known || {}; Object.keys(kn).forEach(function (id) { on[kn[id]] = 1; }); });
    Object.keys(ui.pomo || {}).forEach(function (d) { if (ui.pomo[d] > 0) on[d] = 1; });
    return on;
  }
  function ring(r, color) {
    var C = 2 * Math.PI * 15; r = Math.max(0, Math.min(1, r));
    return '<svg class="v2-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(44,42,39,.12)" stroke-width="3"/>' +
      '<circle cx="18" cy="18" r="15" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - r)).toFixed(2) + '" transform="rotate(-90 18 18)"/></svg>';
  }
  function decorate() {
    if (!el || !cork) return;
    obs.disconnect();
    try {
      var pcs = cork.querySelectorAll('.e6-pc');
      if (pcs.length) {
        if (!entered) {
          entered = true;
          if (!reduced()) { el.classList.add('v2-enter'); [].forEach.call(pcs, function (p, i) { p.style.setProperty('--i', i); }); setTimeout(function () { if (el) el.classList.remove('v2-enter'); }, 1500); }
        }
        decoProgress(); decoCountdown(); decoTitle(); decoWords(); decoCharts(); decoStrip(); applySpot(false);
      }
    } catch (e) {}
    obs.observe(cork, { childList: true });
    syncRail();
  }
  function decoProgress() {
    var cols = ['#b5562b', '#2f6fd6', '#2f9a5a'];
    [].forEach.call(cork.querySelectorAll('.e6-prog > div'), function (d, i) {
      var b = d.querySelector('b'); if (!b || d.querySelector('.v2-rw')) return;
      var t = b.textContent, m = /(\d+)\s*\/\s*(\d+)/.exec(t), r = m ? (+m[2] ? +m[1] / +m[2] : 0) : Math.min(1, (parseInt(t.replace('+', ''), 10) || 0) / 10);
      var w = doc.createElement('span'); w.className = 'v2-rw' + (r >= 1 ? ' v2-full' : ''); w.innerHTML = ring(r, cols[i % 3]);
      b.textContent = t.replace(/\s+/g, ''); d.insertBefore(w, d.firstChild); w.appendChild(b);
    });
  }
  function decoCountdown() {
    var cal = cork.querySelector('.e6-cal'); if (!cal || cal.querySelector('.v2-wk')) return;
    var n = E._.daysLeft(), u = cal.querySelector('.e6-u');
    cal.classList.toggle('v2-soon', n <= 30 && n > 7); cal.classList.toggle('v2-now', n <= 7 && n >= 0);
    if (u && n >= 14) { var w = doc.createElement('div'); w.className = 'v2-wk'; w.textContent = '≈ ' + Math.round(n / 7) + ' weeks'; u.parentNode.insertBefore(w, u.nextSibling); }
  }
  function decoTitle() {
    var t = cork.querySelector('.e6-ttl'); if (!t || t.querySelector('.v2-week')) return;
    var on = activeDays(), now = new Date(), html = '', L = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], i, d;
    for (i = 6; i >= 0; i--) { d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); html += '<i class="' + (on[dayStr(d)] ? 'on' : '') + (i === 0 ? ' now' : '') + '">' + L[d.getDay()] + '</i>'; }
    var streak = 0; for (i = on[today()] ? 0 : 1; i < 400; i++) { d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); if (on[dayStr(d)]) streak++; else break; }
    var p = ui.pomo[today()] || 0;
    var w = doc.createElement('div'); w.className = 'v2-week';
    w.innerHTML = '<div class="v2-days">' + html + '</div><small>' + (streak > 0 ? '连续 ' + streak + ' 天' : '这一周') + (p ? ' · 专注 ' + p + ' 次' : '') + '</small>';
    t.appendChild(w);
  }
  /* a chart's description ends on a whole line, never through the middle of one */
  function decoCharts() {
    [].forEach.call(cork.querySelectorAll('.e6-chart p'), function (p) {
      if (p.scrollHeight <= p.clientHeight + 1) return;
      var lh = parseFloat(getComputedStyle(p).lineHeight) || 15, n = Math.floor((p.clientHeight + 1) / lh);
      if (n < 1) p.style.display = 'none'; else p.style.webkitLineClamp = n;
    });
  }
  /* the selected piece's tool strip stays whole inside the board */
  function decoStrip() {
    var tb = cork.querySelector('.e6-tools'); if (!tb) return;
    var over = tb.offsetLeft + tb.offsetWidth - cork.clientWidth + 6; if (over > 0) tb.style.left = Math.max(6, tb.offsetLeft - over) + 'px';
    if (tb.offsetTop - tb.offsetHeight < 4) tb.style.top = (tb.offsetHeight + 6) + 'px';
  }
  function decoWords() {
    var st = cork.querySelector('.e6-words .e6-stack'); if (!st || !st.querySelector('[data-a="word"]') || st.querySelector('.v2-wb')) return;
    var w = doc.createElement('div'); w.className = 'v2-wb';
    w.innerHTML = '<button type="button" data-v2="known" title="认识（←）">✓ 认识</button><button type="button" data-v2="later" title="放到后面（→）">稍后 ↷</button>';
    st.appendChild(w);
    /* a long word is set smaller, never broken in the middle */
    var word = st.querySelector('.e6-w'), longest = word ? Math.max.apply(null, word.textContent.split(/\s+/).map(function (x) { return x.length; })) : 0;
    if (longest > 9) word.style.fontSize = Math.max(15, Math.round(28 * 9.5 / longest)) + 'px';
  }

  /* 聚光: one card comes to the middle, enlarged, and still works as on the board */
  function item(id) { return ((S().layout) || []).filter(function (x) { return x.id === id; })[0] || null; }
  function applySpot(animate) {
    if (!spot || !cork) { if (el) el.classList.remove('v2-spotting'); return; }
    var pc = null; [].forEach.call(cork.querySelectorAll('.e6-pc'), function (p) { if (p.dataset.p === spot) pc = p; });
    var it = item(spot); if (!pc || !it || (el && el.classList.contains('e6-edit'))) { spot = null; el.classList.remove('v2-spotting'); return; }
    var W = cork.clientWidth, H = cork.clientHeight, kx = Math.max(1.05, Math.min(90 / it.h, 82 / it.w, 2.6));
    var tx = W / 2 - (it.x + it.w / 2) / 100 * W, ty = H / 2 - (it.y + it.h / 2) / 100 * H;
    var dim = doc.createElement('div'); dim.className = 'v2-dim'; cork.appendChild(dim);
    pc.classList.add('v2-spot'); el.classList.add('v2-spotting');
    var to = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + kx.toFixed(3) + ')';
    if (animate && !reduced()) { pc.style.transition = 'transform .34s cubic-bezier(.2,.8,.2,1)'; requestAnimationFrame(function () { pc.style.transform = to; }); }
    else pc.style.transform = to;
  }
  function clearSpot() {
    var had = spot; spot = null; picking = false;
    if (!el) return; el.classList.remove('v2-picking', 'v2-spotting');
    if (had) redraw(''); else syncRail();
  }
  function corkClick(e) {
    var v = e.target.closest && e.target.closest('[data-v2]');
    if (v) {
      e.stopPropagation();
      var card = cork.querySelector('.e6-words [data-a="word"]'), left = v.dataset.v2 === 'known';
      if (card && !reduced()) { card.style.transform = 'translateX(' + (left ? '-' : '') + '140%) rotate(' + (left ? '-' : '') + '12deg)'; card.style.opacity = '0'; }
      setTimeout(function () { key(left ? 'ArrowLeft' : 'ArrowRight'); if (left) toast('Known ✓ 已记为认识'); }, reduced() ? 0 : 220);
      return;
    }
    if (picking) {
      e.stopPropagation(); e.preventDefault(); picking = false; el.classList.remove('v2-picking');
      var pc = e.target.closest('.e6-pc');
      if (pc && !/^deco:/.test(pc.dataset.p)) { spot = pc.dataset.p; applySpot(true); }
      syncRail(); return;
    }
    if (spot && e.target.classList.contains('v2-dim')) { e.stopPropagation(); clearSpot(); }
  }

  /* ───────────────────────── the rail ───────────────────────── */
  function ic(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var IC = {
    back: '<path d="M6 6l12 12M18 6 6 18"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    edit: '<path d="M12 3v18M3 12h18M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5"/>',
    spot: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3M11 8.5v5M8.5 11h5"/>',
    shuffle: '<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c1.7 0 2.9-1.2 3.9-2.8M20 7h-3c-1.7 0-2.9 1.2-3.9 2.8M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>',
    note: '<path d="M5 4h14v11l-5 5H5zM14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.3 1.6M9.5 3.5h5"/>',
    surface: '<path d="M12 3.5 21 8l-9 4.5L3 8zM3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
    print: '<path d="M7 8V4h10v4M7 17H4v-7.5h16V17h-3M7 14h10v6H7z"/>',
    kanban: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M9.5 4v16M14.5 4v10.5"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.9M12 17h.01"/>',
    done: '<path d="M5 12.5 9.5 17 19 7.5"/>',
    undo: '<path d="M9 6 4 11l5 5M4 11h9.5a5 5 0 0 1 0 10H11"/>',
    add: '<rect x="4" y="6" width="11" height="14" rx="1.5"/><path d="M19 3v6M16 6h6"/>',
    deco: '<path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>',
    tidy: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    natural: '<rect x="4" y="4.5" width="8" height="10" rx="1" transform="rotate(-10 8 9.5)"/><rect x="12" y="9.5" width="8" height="10" rx="1" transform="rotate(8 16 14.5)"/>',
    theme: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.8 2-1.8 0-1.4 1-2.2 2.4-2.2H18a2.5 2.5 0 0 0 2.5-2.5c0-5.8-3.8-10.5-8.5-10.5z"/><circle cx="8" cy="11" r=".9"/><circle cx="11" cy="7.5" r=".9"/><circle cx="15.5" cy="8.5" r=".9"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5V9H9"/>'
  };
  function rb(id, label, title) { return '<button type="button" data-r="' + id + '" title="' + title + '" aria-label="' + title + '">' + ic(IC[id]) + '<span>' + label + '</span></button>'; }
  rail.innerHTML =
    '<div class="v2-set v2-view">' +
      '<div class="v2-grp">' + rb('back', '返回', '离开布告栏') + rb('full', '全屏', '全屏 · 只看布告栏') + '</div>' +
      '<div class="v2-grp">' + rb('edit', '排版', '排版：移动、缩放、旋转、裁剪、换纸张和图钉') + rb('spot', '聚光', '聚光：点一张卡片，放大到中间阅读') + rb('shuffle', '换一批', '今天的五张 Anchor Chart 换一批') + rb('note', '便签', '贴上 / 收起便签') + rb('timer', '专注', '专注计时') + '</div>' +
      '<div class="v2-grp">' + rb('surface', '背景', '换布告栏的背景') + rb('print', '打印', '打印今天的布告栏') + rb('kanban', 'Kanban', '打开 Kanban') + rb('help', '帮助', '怎么用') + '</div>' +
    '</div>' +
    '<div class="v2-set v2-craft">' +
      '<div class="v2-grp">' + rb('done', '完成', '完成排版 · 保存布局') + rb('undo', '撤销', '撤销上一步') + '</div>' +
      '<div class="v2-grp">' + rb('add', '贴一张', '贴一张 Anchor Chart') + rb('deco', '装饰', '胶带、贴纸、标签、箭头') + '</div>' +
      '<div class="v2-grp">' + rb('tidy', '整理', '自动整理：排成整齐的行') + rb('natural', '随手贴', '像真实布告栏那样随手贴') + rb('theme', '风格', '换整体风格：经典 / 手账 / 极简') + rb('reset', '默认', '恢复默认布局') + '</div>' +
    '</div><b class="v2-mk">2.0</b>';
  function rbtn(id) { return rail.querySelector('[data-r="' + id + '"]'); }
  function syncRail() {
    var editing = !!(el && el.classList.contains('e6-edit'));
    rail.dataset.mode = editing ? 'craft' : 'view';
    if (editing && (spot || picking)) { spot = null; picking = false; el.classList.remove('v2-picking', 'v2-spotting'); }
    rbtn('spot').classList.toggle('on', !!(spot || picking));
    var n = el ? item('note') : null; rbtn('note').classList.toggle('on', !!(n && !n.hidden));
    var ub = el && el.querySelector('.e6-bar [data-b="undo"]'); rbtn('undo').disabled = !!(ub && ub.disabled);
    rbtn('full').classList.toggle('on', doc.body.classList.contains('v2-zen'));
  }
  rail.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]'); if (!b || !el) return; var r = b.dataset.r;
    if (r !== 'timer' && r !== 'surface' && r !== 'help') closePop();
    if (r === 'back') { leaving = true; if (!bar('close')) leave(); }
    else if (r === 'full') zen(!doc.body.classList.contains('v2-zen'));
    else if (r === 'edit' || r === 'done') bar('edit');
    else if (r === 'undo' || r === 'add' || r === 'deco' || r === 'tidy' || r === 'natural' || r === 'theme' || r === 'reset' || r === 'kanban') bar(r);
    else if (r === 'spot') { if (spot || picking) clearSpot(); else { picking = true; el.classList.add('v2-picking'); toast('点一张卡片，放大到中间'); syncRail(); } }
    else if (r === 'shuffle') {
      var n = 0; ['ela', 'math', 'sci', 'ss', 'other'].forEach(function (s) { var x = cork.querySelector('[data-a="swap"][data-s="' + s + '"]'); if (x) { x.click(); n++; } });
      toast(n ? '今天的 Anchor Chart 换了一批' : '现在没有可换的 Anchor Chart');
    }
    else if (r === 'note') {
      var L = S().layout || [], it = item('note'); if (!it) return;
      it.hidden = !it.hidden; if (!it.hidden) { L.splice(L.indexOf(it), 1); L.push(it); }
      saveS(); redraw(it.hidden ? '便签收起来了（内容还在）' : '便签贴上了 · 写点什么');
    }
    else if (r === 'timer') timerPop(b);
    else if (r === 'surface') surfacePop(b);
    else if (r === 'print') { closePop(); window.print(); }
    else if (r === 'help') helpPop(b);
  });

  /* a small menu beside a rail key */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(btn, html, onPick) {
    var same = pop && pop._for === btn; closePop(); if (same) return;
    pop = doc.createElement('div'); pop.className = 'v2-pop'; pop._for = btn; pop.innerHTML = html; doc.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), bottomRail = rail.getBoundingClientRect().width > rail.getBoundingClientRect().height;
    if (bottomRail) { pop.style.bottom = (innerHeight - r.top + 10) + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left + r.width / 2 - pop.offsetWidth / 2)) + 'px'; }
    else { pop.style.right = (innerWidth - r.left + 10) + 'px'; pop.style.top = Math.max(8, Math.min(innerHeight - pop.offsetHeight - 8, r.top + r.height / 2 - pop.offsetHeight / 2)) + 'px'; }
    pop.addEventListener('click', function (e) { var x = e.target.closest('[data-v]'); if (x && onPick) onPick(x.dataset.v); });
  }
  doc.addEventListener('pointerdown', function (e) { if (pop && !pop.contains(e.target) && !rail.contains(e.target)) closePop(); }, true);

  var SURF = [['cork', '软木'], ['felt', '毛毡'], ['slate', '黑板'], ['linen', '亚麻']];
  function setSurface(s) { ui.surface = s; doc.body.dataset.surface = s; saveUi(); }
  function surfacePop(btn) {
    openPop(btn, '<h5>背景</h5><div class="v2-sw">' + SURF.map(function (s) { return '<button type="button" data-v="' + s[0] + '" class="' + (ui.surface === s[0] ? 'on' : '') + '"><i data-s="' + s[0] + '"></i>' + s[1] + '</button>'; }).join('') + '</div>',
      function (v) { setSurface(v); [].forEach.call(pop.querySelectorAll('[data-v]'), function (x) { x.classList.toggle('on', x.dataset.v === v); }); });
  }
  function helpPop(btn) {
    openPop(btn, '<h5>布告栏 2.0</h5><ul class="v2-help">' +
      '<li><b>卡片标题</b> 打开 Kanban 里的这张卡片</li><li><b>↻ 换 / ✓ 掌握</b> 换一张、划掉已掌握的</li>' +
      '<li><b>单词卡</b> 左滑认识 · 右滑稍后 · 轻点看详情</li><li><b>聚光</b> 点一张卡片放大阅读，点暗处放回</li>' +
      '<li><b>排版</b> 拖动、缩放、旋转、裁剪，换纸张和图钉</li><li><b>专注</b> 计时结束会响一声，记在本周</li>' +
      '<li>这里的布局和 1.0 的布告栏各存各的</li></ul>');
  }

  /* 专注计时 */
  function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function timerPop(btn) {
    var run = !!ui.timer;
    openPop(btn, '<h5>专注计时' + (ui.pomo[today()] ? ' · 今天 ' + ui.pomo[today()] + ' 次' : '') + '</h5><div class="v2-list">' +
      '<button type="button" data-v="25">专注 25 分钟</button><button type="button" data-v="15">专注 15 分钟</button><button type="button" data-v="b5">休息 5 分钟</button>' +
      (run ? '<button type="button" data-v="stop" class="v2-warn">停止计时</button>' : '') + '</div>',
      function (v) {
        if (v === 'stop') { ui.timer = null; toast('计时停止了'); }
        else { var rest = v.charAt(0) === 'b', min = parseInt(v.replace('b', ''), 10); ui.timer = { end: Date.now() + min * 60000, total: min * 60000, rest: rest }; toast((rest ? '休息 ' : '专注 ') + min + ' 分钟，开始'); }
        saveUi(); closePop(); tick();
      });
  }
  function chime() {
    try {
      var A = window.AudioContext || window.webkitAudioContext, a = new A(), t = a.currentTime;
      [660, 880, 1320].forEach(function (f, i) { var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.18); g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.5); o.connect(g); g.connect(a.destination); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.55); });
      setTimeout(function () { try { a.close(); } catch (e) {} }, 1500);
    } catch (e) {}
  }
  function tick() {
    var b = rbtn('timer'), lab = b.querySelector('span'), T = ui.timer;
    if (!T) { b.classList.remove('on', 'rest'); b.style.removeProperty('--p'); lab.textContent = '专注'; return; }
    var left = T.end - Date.now();
    if (left <= 0) {
      ui.timer = null; if (!T.rest) ui.pomo[today()] = (ui.pomo[today()] || 0) + 1;
      Object.keys(ui.pomo).sort().slice(0, -60).forEach(function (d) { delete ui.pomo[d]; });
      saveUi(); chime(); tick();
      if (el) { var w = cork.querySelector('.v2-week'); if (w) w.remove(); decorate(); toast(T.rest ? '休息结束，回来继续' : '专注完成 · 记在本周了，休息一下'); }
      return;
    }
    b.classList.add('on'); b.classList.toggle('rest', !!T.rest); b.style.setProperty('--p', (1 - left / T.total).toFixed(4)); lab.textContent = fmt(left);
  }
  setInterval(tick, 500);

  /* 全屏: the rail steps aside, the board takes the whole screen */
  function refit() { window.dispatchEvent(new Event('resize')); }
  function zen(on) {
    doc.body.classList.toggle('v2-zen', on); doc.getElementById('unzen').hidden = !on; closePop();
    try {
      if (on) { var p = doc.documentElement.requestFullscreen && doc.documentElement.requestFullscreen(); if (p && p.catch) p.catch(function () {}); }
      else if (doc.fullscreenElement && doc.exitFullscreen) doc.exitFullscreen();
    } catch (e) {}
    refit(); setTimeout(refit, 400); syncRail();
  }
  doc.getElementById('unzen').addEventListener('click', function () { zen(false); });
  doc.addEventListener('fullscreenchange', function () { if (!doc.fullscreenElement && doc.body.classList.contains('v2-zen')) zen(false); else setTimeout(refit, 60); });

  /* ───────────────────────── start ───────────────────────── */
  setSurface(SURF.some(function (s) { return s[0] === ui.surface; }) ? ui.surface : 'cork');
  /* 2.0's first board uses the space 1.0 leaves empty: the note goes up, when nothing is in its place */
  if (window.EC6V2_FRESH) hostP.then(function () {
    setTimeout(function () {
      var n = el && item('note'); if (!n || !n.hidden) return;
      var hit = (S().layout || []).some(function (o) { return o !== n && !o.hidden && o.x < n.x + n.w && o.x + o.w > n.x && o.y < n.y + n.h && o.y + o.h > n.y; });
      if (!hit) { n.hidden = false; n.rot = -1.5; saveS(); redraw(''); }
    }, 60);
  });
  openBoard(); tick();
  window.EC6Board2 = { version: '2.0', ui: function () { return ui; }, isSample: function () { return sample; } };
})();
