/* Minest · 哲学模型馆 2.0 — Philosophy Models MK II
   The 46 live models (philosophy/models/, each its own page) and 1.0's list of them (tools/toolkit/phil-models.js) are
   used as they are. 2.0 is the hall around them:
     find       search by name, philosopher, cue or level · filter by branch, ★ starred, not yet explored
     three views  全部 Grid · 时间线 Timeline (by the year of the source text) · 学习路径 Paths (seven questions, in order)
     the player  the model full size with a guide beside it: its levels to tick off, the source, your notes, related
                 models, the next step of the path — and “think about it” back in the five cards
   What you explored, starred and wrote stays on this device (localStorage minest.ws2.models). The models themselves
   keep no state and are not told anything. */
(function () {
  'use strict';
  var M = (window.MinestToolkit && MinestToolkit.philModels) || [];
  var BY = {}; M.forEach(function (m) { BY[m.id] = m; });
  // the year of the text each model is built on (BCE negative); used only to order the timeline
  var YEAR = { plato_cave: -375, plato_forms: -380, plato_soul: -375, aristotle: -350, syllogism: -350, zhuangzi: -300, theseus: 100, wangyangming: 1518, bacon_idols: 1620, descartes: 1641,
    spinoza_substance: 1677, locke: 1689, leibniz: 1714, leibniz_reason: 1714, hume: 1748, kant_transcendental: 1781, kant_categories: 1781, kant_moral: 1785, utilitarian: 1789, hegel: 1807,
    freewill: 1814, mill_liberty: 1859, marx: 1859, peirce: 1878, nietzsche: 1887, frege: 1892, russell_descriptions: 1905, dewey: 1910, husserl: 1913, heidegger: 1927, tarski: 1944,
    sartre: 1946, carnap: 1950, quine_web: 1951, wittgenstein: 1953, goodman_grue: 1955, kuhn: 1962, gettier: 1963, popper: 1963, polanyi: 1966, rawls: 1971, nozick_machine: 1974,
    foucault: 1975, kripke: 1980, habermas: 1981, parfit: 1984 };
  var ERAS = [[-9999, '古代', 'Ancient'], [1400, '近代早期', 'Early modern'], [1800, '十九世纪', '19th century'], [1900, '二十世纪上半叶', 'Early 20th century'], [1950, '当代', 'Contemporary']];
  var BRANCH = [
    ['philosophy.epistemology.causation', 'cause', '因果', 'Causation', '#ff8fab'], ['philosophy.epistemology', 'know', '认识论', 'Knowing', '#9b5de5'], ['philosophy.metaphysics', 'being', '形而上学', 'Being', '#5e9cff'],
    ['philosophy.ethics', 'ethics', '伦理学', 'Ethics', '#1fbf75'], ['philosophy.logic', 'logic', '逻辑与语言', 'Logic & language', '#00c2c2'], ['philosophy.political', 'society', '政治哲学', 'Society', '#f08c3a'],
    ['philosophy.life', 'life', '人生哲学', 'Life', '#ffd166'], ['nature', 'science', '科学方法', 'Science', '#7bdff2'], ['psychology', 'mind', '心灵与学习', 'Mind', '#c8b6ff']
  ];
  function branch(m) { var f = (m.fits || [])[0] || ''; for (var i = 0; i < BRANCH.length; i++) if (f.indexOf(BRANCH[i][0]) === 0) return BRANCH[i]; return ['', 'other', '其他', 'Other', '#cfd6ff']; }
  var PATHS = [
    { id: 'know', zh: '我能知道什么？', en: 'What can I know?', c: '#9b5de5', ids: ['plato_cave', 'descartes', 'locke', 'hume', 'kant_transcendental', 'gettier', 'quine_web'], line: '从洞穴里的影子，到“知识”这个词到底要求什么。' },
    { id: 'do', zh: '我该怎么做？', en: 'What should I do?', c: '#1fbf75', ids: ['plato_soul', 'kant_moral', 'utilitarian', 'nietzsche', 'sartre', 'rawls', 'nozick_machine'], line: '规则、后果、价值从哪来、选择的重量。' },
    { id: 'cause', zh: '什么是原因？', en: 'What is a cause?', c: '#ff8fab', ids: ['aristotle', 'leibniz_reason', 'hume', 'kant_categories', 'freewill'], line: '四种“为什么”，习惯还是必然，以及自由还剩多少。' },
    { id: 'science', zh: '科学怎样前进？', en: 'How does science move?', c: '#7bdff2', ids: ['bacon_idols', 'peirce', 'dewey', 'popper', 'kuhn', 'goodman_grue', 'polanyi'], line: '偏见、猜想、反驳、范式，和说不出来的那部分知识。' },
    { id: 'logic', zh: '语言怎样说出世界？', en: 'How does language reach the world?', c: '#00c2c2', ids: ['syllogism', 'frege', 'russell_descriptions', 'tarski', 'wittgenstein', 'carnap', 'kripke'], line: '从三段论到可能世界：意义、指称、真。' },
    { id: 'self', zh: '我是谁？', en: 'Who am I?', c: '#5e9cff', ids: ['theseus', 'zhuangzi', 'leibniz', 'hegel', 'heidegger', 'parfit'], line: '换掉每块木板的船、梦里的蝴蝶、被承认的自我。' },
    { id: 'together', zh: '我们怎样一起生活？', en: 'How do we live together?', c: '#f08c3a', ids: ['mill_liberty', 'marx', 'foucault', 'habermas', 'rawls'], line: '自由的边界、经济的基础、权力、对话与公平。' }
  ];
  PATHS.forEach(function (p) { p.ids = p.ids.filter(function (id) { return BY[id]; }); });

  var KEY = 'minest.ws2.models';
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  var st = load();
  function rec(id) { return st[id] || (st[id] = {}); }
  // only the model that changed is written over what is stored now: another open tab's notes on other models stay
  function save(id) { var r = st[id]; st = load(); if (r) st[id] = r; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().trim(); }
  function year(id) { var y = YEAR[id]; return y == null ? '' : y < 0 ? '公元前 ' + (-y) : String(y); }
  function topicOf(m) { return m.zh.split(' · ').pop(); }
  var hash = {}; location.hash.slice(1).split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) { try { hash[kv[0]] = decodeURIComponent(kv[1] || ''); } catch (e) {} } });
  var EMBED = window.parent !== window && hash.embed === '1';
  function tell(m) { try { window.parent.postMessage(Object.assign({ type: 'minest-ws2' }, m), '*'); } catch (e) {} }

  var view = 'grid', filter = 'all', query = hash.q || '', cur = null, order = [], pathId = null;
  var listEl = $('#list'), chipsEl = $('#chips'), qEl = $('#q'), player = $('#player'), guideEl = $('#guide'), frame = $('#p-frame');

  // ---------------------------------------------------------------- find
  function matches(m, q) {
    if (!q) return 1;
    var t = norm(m.zh), e = norm(m.en), w = norm(m.who);
    if (t.indexOf(q) >= 0 || e.indexOf(q) >= 0) return 3;
    if (w.indexOf(q) >= 0) return 2.5;
    if ((m.kw || []).some(function (k) { k = norm(k); return k === q || (k.length > 1 && q.indexOf(k) >= 0) || (q.length > 1 && k.indexOf(q) === 0); })) return 2;
    if ((m.levels || []).some(function (l) { return norm(l).indexOf(q) >= 0; }) || norm(m.src).indexOf(q) >= 0) return 1;
    return 0;
  }
  function shown() {
    var q = norm(query);
    return M.map(function (m) { return { m: m, s: matches(m, q) }; }).filter(function (x) {
      if (!x.s) return false; var r = st[x.m.id] || {};
      return filter === 'all' ? true : filter === 'fav' ? !!r.fav : filter === 'new' ? !r.done : filter === 'done' ? !!r.done : branch(x.m)[1] === filter;
    }).sort(function (a, b) { return q ? b.s - a.s : 0; }).map(function (x) { return x.m; });
  }

  // ---------------------------------------------------------------- the hall
  function card(m, extra) {
    var b = branch(m), r = st[m.id] || {}, lv = (r.lv || []).filter(Boolean).length, n = (m.levels || []).length;
    return '<button type="button" class="card' + (r.done ? ' done' : '') + '" data-open="' + m.id + '"' + (extra || '') + ' style="--c:' + b[4] + '">' +
      '<span class="c-top"><span class="tag">' + b[2] + '</span><span class="yr">' + year(m.id) + '</span>' + (r.fav ? '<span class="star" aria-label="已收藏">★</span>' : '') + '</span>' +
      '<b>' + esc(m.zh) + '</b><em>' + esc(m.en) + '</em>' +
      '<span class="lv" aria-label="' + lv + ' / ' + n + ' 关">' + (m.levels || []).map(function (l, i) { return '<i class="' + ((r.lv || [])[i] || r.done ? 'on' : '') + '" title="' + esc(l) + '"></i>'; }).join('') + '</span>' +
      '<span class="c-foot">' + (r.done ? '✓ 已探索' : r.seen ? '看过 · ' + lv + '/' + n : n + ' 关') + (r.note ? ' · 有笔记' : '') + '</span></button>';
  }
  function draw() {
    var doneN = M.filter(function (m) { return (st[m.id] || {}).done; }).length;
    $('#prog-t').textContent = '已探索 ' + doneN + ' / ' + M.length; $('#prog-b').style.width = (M.length ? doneN / M.length * 100 : 0) + '%';
    [].forEach.call(document.querySelectorAll('.views button'), function (b) { var on = b.getAttribute('data-view') === view; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    var counts = {}; M.forEach(function (m) { var k = branch(m)[1]; counts[k] = (counts[k] || 0) + 1; });
    var chips = [['all', '全部', M.length], ['new', '还没探索', M.length - doneN], ['fav', '★ 收藏', M.filter(function (m) { return (st[m.id] || {}).fav; }).length]]
      .concat(BRANCH.filter(function (b) { return counts[b[1]]; }).map(function (b) { return [b[1], b[2], counts[b[1]], b[4]]; }));
    chipsEl.hidden = view === 'paths';
    chipsEl.innerHTML = chips.map(function (c) { return '<button type="button" data-f="' + c[0] + '" class="' + (filter === c[0] ? 'on' : '') + '" aria-pressed="' + (filter === c[0]) + '"' + (c[3] ? ' style="--c:' + c[3] + '"' : '') + '>' + (c[3] ? '<i></i>' : '') + c[1] + '<em>' + c[2] + '</em></button>'; }).join('');
    var list = shown(), html = '';
    if (view === 'paths') {
      order = [];
      html = '<div class="paths">' + PATHS.map(function (p) {
        var d = p.ids.filter(function (id) { return (st[id] || {}).done; }).length, next = p.ids.filter(function (id) { return !(st[id] || {}).done; })[0] || p.ids[0];
        return '<section class="path" style="--c:' + p.c + '"><div class="path-h"><div><h2>' + p.zh + '</h2><small>' + p.en + ' · ' + esc(p.line) + '</small></div>' +
          '<span class="path-p">' + d + ' / ' + p.ids.length + '</span><button type="button" class="pill go" data-open="' + next + '" data-path="' + p.id + '">' + (d ? d === p.ids.length ? '再走一遍' : '继续' : '开始') + ' →</button></div>' +
          '<ol>' + p.ids.map(function (id, i) { var m = BY[id], r = st[id] || {}; return '<li><button type="button" class="step' + (r.done ? ' done' : '') + '" data-open="' + id + '" data-path="' + p.id + '"><span>' + (r.done ? '✓' : i + 1) + '</span><b>' + esc(m.zh) + '</b><em>' + year(id) + '</em></button></li>'; }).join('') + '</ol></section>';
      }).join('') + '</div>';
    } else if (!list.length) {
      order = []; html = '<p class="none">没有找到「' + esc(query) + '」。换个词，或换一个筛选。 · Nothing matches.</p>';
    } else if (view === 'time') {
      list = list.slice().sort(function (a, b) { return (YEAR[a.id] || 0) - (YEAR[b.id] || 0); }); order = list.map(function (m) { return m.id; });
      html = '<div class="time">' + ERAS.map(function (e, i) {
        var hi = ERAS[i + 1] ? ERAS[i + 1][0] : 9999, ms = list.filter(function (m) { var y = YEAR[m.id] || 0; return y >= e[0] && y < hi; });
        return ms.length ? '<section class="era"><h2>' + e[1] + '<small>' + e[2] + ' · ' + ms.length + '</small></h2><div class="grid">' + ms.map(function (m) { return card(m); }).join('') + '</div></section>' : '';
      }).join('') + '</div>';
    } else { order = list.map(function (m) { return m.id; }); html = '<div class="grid">' + list.map(function (m) { return card(m); }).join('') + '</div>'; }
    listEl.innerHTML = html;
  }

  // ---------------------------------------------------------------- the player
  function related(m) {
    return M.filter(function (x) { return x.id !== m.id; }).map(function (x) {
      var s = (x.who === m.who ? 2 : 0); (x.fits || []).forEach(function (f, i) { var j = (m.fits || []).indexOf(f); if (j >= 0) s += (i === 0 && j === 0 ? 2 : 1); });
      return { m: x, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 4).map(function (x) { return x.m; });
  }
  function open(id, path) {
    var m = BY[id]; if (!m) return;
    cur = m; pathId = path && PATHS.filter(function (p) { return p.id === path && p.ids.indexOf(id) >= 0; })[0] ? path : null;
    if (pathId) order = PATHS.filter(function (p) { return p.id === pathId; })[0].ids.slice(); else if (order.indexOf(id) < 0) order = M.map(function (x) { return x.id; });
    var r = rec(id); r.seen = r.seen || Date.now(); save(id);
    $('#app').hidden = true; player.hidden = false;
    $('#p-name').textContent = m.zh; $('#p-sub').textContent = m.en + ' · ' + year(id);
    if (frame.getAttribute('data-id') !== id) { frame.setAttribute('data-id', id); frame.src = '../../philosophy/models/' + m.file; }
    history.replaceState(null, '', '#' + (EMBED ? 'embed=1&' : '') + 'm=' + id + (pathId ? '&path=' + pathId : ''));
    paint();
  }
  function paint() {
    var m = cur; if (!m) return; var r = rec(m.id), b = branch(m), i = order.indexOf(m.id), p = pathId && PATHS.filter(function (x) { return x.id === pathId; })[0];
    $('#p-prev').disabled = i <= 0; $('#p-next').disabled = i < 0 || i >= order.length - 1;
    var fav = $('#p-fav'), done = $('#p-done');
    fav.textContent = r.fav ? '★ 已收藏' : '☆ 收藏'; fav.setAttribute('aria-pressed', String(!!r.fav)); fav.classList.toggle('on', !!r.fav);
    done.textContent = r.done ? '✓ 已探索' : '○ 标记已探索'; done.setAttribute('aria-pressed', String(!!r.done)); done.classList.toggle('on', !!r.done);
    var keep = document.activeElement && document.activeElement.id === 'note';
    if (keep) { paintLevels(); return; }   // typing a note: leave the guide alone
    guideEl.style.setProperty('--c', b[4]);
    guideEl.innerHTML = (p ? '<div class="g-path" style="--c:' + p.c + '"><small>学习路径 · 第 ' + (i + 1) + ' / ' + order.length + ' 站</small><b>' + p.zh + '</b>' + (i < order.length - 1 ? '<button type="button" class="pill" data-open="' + order[i + 1] + '" data-path="' + p.id + '">下一站：' + esc(BY[order[i + 1]].zh) + ' →</button>' : '<span class="fin">这条路走到头了 ✓</span>') + '</div>' : '') +
      '<div class="g-h"><span class="tag">' + b[2] + ' · ' + b[3] + '</span><h2>' + esc(m.zh) + '</h2><small>' + esc(m.who) + ' · ' + year(m.id) + '</small></div>' +
      '<h3>关卡 <em>Levels · 走过一关就勾一关</em></h3><div class="g-lv" id="g-lv"></div>' +
      '<h3>出处 <em>Source</em></h3><p class="src">' + esc(m.src) + '</p>' +
      '<h3>我的笔记 <em>Notes · 只存在这台设备</em></h3><textarea id="note" rows="5" maxlength="4000" placeholder="这个模型让我想到…">' + esc(r.note || '') + '</textarea>' +
      '<h3>带着它去思考 <em>Think with it</em></h3><div class="g-think"><button type="button" class="pill" data-think="compass">思想罗盘：「' + esc(topicOf(m)) + '」在哪里</button><button type="button" class="pill" data-think="models">用思维模型分析它</button><button type="button" class="pill" data-think="graph">看它连向哪里</button></div>' +
      '<h3>相关模型 <em>Related</em></h3><div class="g-rel">' + related(m).map(function (x) { return '<button type="button" data-open="' + x.id + '"><i style="background:' + branch(x)[4] + '"></i><b>' + esc(x.zh) + '</b>' + ((st[x.id] || {}).done ? '<em>✓</em>' : '') + '</button>'; }).join('') + '</div>';
    paintLevels();
  }
  function paintLevels() {
    var el = $('#g-lv'), r = rec(cur.id); if (!el) return;
    el.innerHTML = (cur.levels || []).map(function (l, i) { var on = !!(r.lv || [])[i]; return '<button type="button" role="checkbox" aria-checked="' + on + '" class="' + (on ? 'on' : '') + '" data-lv="' + i + '"><span>' + (on ? '✓' : i + 1) + '</span>' + esc(l) + '</button>'; }).join('');
  }
  function back() { player.hidden = true; $('#app').hidden = false; cur = null; frame.removeAttribute('data-id'); frame.src = 'about:blank'; history.replaceState(null, '', '#' + (EMBED ? 'embed=1' : '')); draw(); }
  function step(d) { var i = order.indexOf(cur.id) + d; if (i >= 0 && i < order.length) open(order[i], pathId); }

  // ---------------------------------------------------------------- wiring
  document.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-open]'))) return open(b.getAttribute('data-open'), b.getAttribute('data-path'));
    if ((b = t.closest('[data-view]'))) { view = b.getAttribute('data-view'); return draw(); }
    if ((b = t.closest('[data-f]'))) { filter = b.getAttribute('data-f'); return draw(); }
    if ((b = t.closest('[data-lv]'))) { var r = rec(cur.id), i = +b.getAttribute('data-lv'); r.lv = r.lv || []; r.lv[i] = !r.lv[i]; if ((cur.levels || []).every(function (_, k) { return r.lv[k]; })) r.done = true; save(cur.id); return paint(); }
    if ((b = t.closest('[data-think]'))) {
      var q = topicOf(cur), c = b.getAttribute('data-think');
      if (EMBED) tell({ action: 'think', input: q, card: c }); else location.href = '../index.html#q=' + encodeURIComponent(q) + '&card=' + c;
    }
  });
  $('#p-back').onclick = back; $('#p-prev').onclick = function () { step(-1); }; $('#p-next').onclick = function () { step(1); };
  $('#p-fav').onclick = function () { var r = rec(cur.id); r.fav = !r.fav; save(cur.id); paint(); };
  $('#p-done').onclick = function () { var r = rec(cur.id); r.done = !r.done; if (!r.done) r.lv = []; save(cur.id); paint(); };
  $('#p-guide').onclick = function () { var off = player.classList.toggle('no-guide'); this.setAttribute('aria-pressed', String(!off)); };
  guideEl.addEventListener('input', function (e) { if (e.target.id === 'note' && cur) { rec(cur.id).note = e.target.value.slice(0, 4000); save(cur.id); } });
  window.addEventListener('storage', function (e) { if (e.key !== KEY) return; st = load(); if (cur) paint(); else draw(); });   // another tab wrote
  qEl.value = query; qEl.addEventListener('input', function () { query = qEl.value; if (view === 'paths') view = 'grid'; draw(); });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName || '');
    if (e.key === 'Escape') { if (typing && e.target === qEl && qEl.value) { qEl.value = query = ''; return draw(); } if (cur) return back(); if (EMBED) tell({ action: 'models-close' }); return; }
    if (typing) return;
    if (e.key === '/' && !cur) { e.preventDefault(); qEl.focus(); }
    else if (cur && e.key === 'ArrowRight') step(1); else if (cur && e.key === 'ArrowLeft') step(-1);
  });
  if (EMBED) { $('#exit').hidden = false; $('#home').hidden = true; $('#exit').onclick = function () { tell({ action: 'models-close' }); }; }
  if (window.matchMedia && matchMedia('(max-width: 820px)').matches) { player.classList.add('no-guide'); $('#p-guide').setAttribute('aria-pressed', 'false'); }
  draw();
  if (hash.m && BY[hash.m]) open(hash.m, hash.path);
  window.MinestModels2 = { open: open, state: function () { return st; }, paths: PATHS, count: M.length };
})();
