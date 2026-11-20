/* Minest · 3D 词卡 · 学生页 (vocab3d.html?code=CODE, /vocab) — only the words the teacher assigned, as 3D dynamic
   cards (the 3D Cover modes, card styles, the exploded learning card). No Dock, no system keys, no way into the rest
   of Minest (2026-11-20, the user). The student marks each word 我会了 / 再看看; progress goes to the teacher:
   /minest-live/{CODE}/players/{pid} = { name, seen, known, total, at, k: { cardKey: 1 seen | 2 known } }. */
(function () {
  'use strict';
  var DB = 'https://minest-33761-default-rtdb.firebaseio.com/minest-live/';
  var qs = new URLSearchParams(location.search), PREVIEW = qs.has('preview');
  var VIEW = window.__V3_VIEW || 'cards';   // the page: 'cards' (vocab3d.html), 'dyn' (vocab-drive.html: the Dynamic presentations), 'type' (vocab-type.html)
  function db(path, method, body) {
    return fetch(DB + path + '.json', { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('网络错误（' + r.status + '）'); return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }   // digits now; older letter codes still open
  function key(id) { return String(id).replace(/[.#$\[\]\/]/g, '_').slice(0, 120); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------------- the board the 3D cards read (a stand-in for Minest's own board) ---------------- */
  var B = { id: 'vocab3d', title: '', columns: [] }, CARDS = [];
  function raw(c, col) {   // the fields the exploded card reads
    var o = { id: c.id, title: c.title, titleZh: c.titleZh || '', meaning: c.meaning || '', pron: c.pron || '', definitions: { en: c.defEn || '', zh: c.defZh || '' },
      examples: (c.examples || []).map(function (t) { return { text: t }; }), relatedWords: c.related || [], etymology: c.ety || '', hint: c.hint || '', img: c.img || '' };
    o.columnTitle = col.title; o.columnColor = col.color || ''; return o;
  }
  window.MinestAI = { board: function () { return B; }, boards: function () { return [B]; } };
  window.MinestImageViews = {
    cards: function (b) { var out = []; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { out.push(k); }); }); return out; },
    image: function (c) { return { thumb: (c && c.img) || '', full: (c && c.img) || '' }; },
    select: function () {}
  };
  window.__mnNoVoice = false;

  /* ---------------- join: the code, then a name ---------------- */
  var code = clean(qs.get('code') || qs.get('c') || ''), host = null, me = null, pid = null;
  var J = $('#v3-join');
  function joinView(step, err) {
    J.hidden = false;
    if (step === 'code') {
      J.innerHTML = '<div class="v3j-card"><div class="v3j-logo">◈</div><h1>3D 词卡</h1><p>输入老师给你的课堂码</p>' +
        '<input class="v3j-code" maxlength="8" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="课堂码" value="' + esc(code) + '">' +
        '<button type="button" class="v3j-go">进入</button><p class="v3j-err">' + esc(err || '') + '</p></div>';
      var inp = $('.v3j-code', J), go = function () { var c = clean(inp.value); if (c.length < 4) { $('.v3j-err', J).textContent = '课堂码不完整。'; return; } code = c; load(); };
      $('.v3j-go', J).onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; setTimeout(function () { inp.focus(); }, 50);
    } else if (step === 'name') {
      var saved = ls('minest.vocab3d.name') || '';
      J.innerHTML = '<div class="v3j-card"><div class="v3j-logo">◈</div><h1>' + esc(host.title) + '</h1><p>' + (host.words || 0) + ' 个词 · 写上你的名字，老师能看到你的进度</p>' +
        '<input class="v3j-name" maxlength="24" autocomplete="off" placeholder="你的名字" value="' + esc(saved) + '">' +
        '<button type="button" class="v3j-go">开始学习</button><p class="v3j-err">' + esc(err || '') + '</p></div>';
      var ni = $('.v3j-name', J), go2 = function () { var n = ni.value.trim().slice(0, 24); if (!n) { $('.v3j-err', J).textContent = '先写上名字。'; return; } ls('minest.vocab3d.name', n); start(n); };
      $('.v3j-go', J).onclick = go2; ni.onkeydown = function (e) { if (e.key === 'Enter') go2(); }; setTimeout(function () { ni.focus(); }, 50);
    } else {
      J.innerHTML = '<div class="v3j-card"><div class="v3j-logo spin">◈</div><p>' + esc(step) + '</p></div>';
    }
  }
  function load() {
    joinView('正在打开…');
    db(code + '/host').then(function (h) {
      if (!h || h.kind !== 'vocab3d' || !h.board) { joinView('code', '找不到这个课堂码，请检查一下。'); return; }
      host = h; pid = ls('minest.vocab3d.pid.' + code);
      if (PREVIEW) { start('老师预览'); return; }
      /* from the one student entry (/iphone?play): the code and the name were given there */
      var hand = null; try { hand = JSON.parse(sessionStorage.getItem('minest.vocab3d.join') || 'null'); } catch (e) {}
      if (hand && hand.code === code && hand.name && Date.now() - (hand.at || 0) < 6e5) { try { sessionStorage.removeItem('minest.vocab3d.join'); } catch (e) {} ls('minest.vocab3d.name', hand.name); start(hand.name); return; }
      var n = ls('minest.vocab3d.name'); if (pid && n) start(n); else joinView('name');
    }).catch(function (e) { joinView('code', '打不开：' + e.message); });
  }

  /* ---------------- study ---------------- */
  var K = {}, synced = '', syncT = 0, EXTRA = null;
  function counts() { var s = 0, k = 0; CARDS.forEach(function (c) { var v = K[key(c.id)]; if (v) s++; if (v === 2) k++; }); return { seen: s, known: k }; }
  function save() {
    ls('minest.vocab3d.k.' + code, JSON.stringify(K)); paintPill();
    if (PREVIEW || !pid || host.state === 'ended') return;
    clearTimeout(syncT); syncT = setTimeout(function () {
      var c = counts(), body = { name: me, seen: c.seen, known: c.known, total: CARDS.length, at: Date.now(), k: K }, s = JSON.stringify([c, K, EXTRA]);
      if (EXTRA) body.type = EXTRA;
      if (s === synced) return;
      db(code + '/players/' + pid, 'PATCH', body).then(function () { synced = s; }).catch(function () {});
    }, 900);
  }
  function start(name) {
    me = name; J.hidden = true; J.innerHTML = '';
    if (!pid && !PREVIEW) { pid = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); ls('minest.vocab3d.pid.' + code, pid); }
    try { K = JSON.parse(ls('minest.vocab3d.k.' + code) || '{}') || {}; } catch (e) { K = {}; }
    B.title = host.title; B.columns = (host.board.columns || []).map(function (col) { return { id: col.id, title: col.title, color: col.color, cards: (col.cards || []).map(function (c) { return raw(c, col); }) }; });
    CARDS = []; B.columns.forEach(function (c) { CARDS = CARDS.concat(c.cards); });
    $('#v3-ttl').textContent = host.title;
    if (host.state === 'ended') banner('老师已经结束了这个作业：还可以看，进度不再记录。');
    // (a teacher's preview says so in the Solo bar: no banner over the cards)
    save();   // the teacher sees the student as soon as they are in (on the level map too)
    route();
  }

  /* ---------------- the game modes: the teacher switches them on and off; the level map lights the ones that are on ---------------- */
  /* every game mode: 3D 词卡, the eleven Dynamic presentations (one page: vocab-drive.html), 3D Type */
  var MODE = [['cards', '🧊', '3D 词卡', '九种 3D 动态卡片，展开每个词'],
    ['drive', '🚗', 'Knowledge Drive', '坐车沿路看词，每个词表一条路'], ['train', '🚆', 'Knowledge Train', '坐在车窗边，每个词表一条铁路'],
    ['metro', '🚇', 'Knowledge Metro', '每个词表一条地铁线，每个词一站'], ['tower', '🏙', 'Knowledge Skyscraper', '坐电梯逛玻璃大楼，每层一组词'],
    ['roadtrip', '🛣', 'Road Trip', '沿着有名的公路自驾看词'], ['rack', '🎠', 'Rotating Rack', '旋转展架：转一转，挑一个拿出来'],
    ['library', '📚', 'Library Corridor', '走进图书馆长廊，从书架上抽书'], ['museum', '🏛', 'Museum Walkthrough', '逛博物馆：画、雕塑、展柜'],
    ['city', '🌆', 'Knowledge City', '逛街：每个词表一家店'], ['galaxy', '🌌', 'Knowledge Galaxy', '开飞船，降落在每个星球'],
    ['balloon', '🎈', 'Knowledge Balloon', '坐热气球飘过每个词'], ['type', '⌨️', '3D Type', '拼音打字：跟打 + 四关闯关']];
  var PAGE = {}; MODE.forEach(function (x) { PAGE[x[0]] = x[0] === 'cards' ? 'vocab3d.html' : x[0] === 'type' ? 'vocab-type.html' : 'vocab-drive.html'; });
  var HERE = VIEW === 'cards' ? 'vocab3d.html' : VIEW === 'type' ? 'vocab-type.html' : 'vocab-drive.html', CUR = null;
  function modes() { var m = host.modes; if (!m) { m = {}; m[host.view === 'drive' || host.view === 'type' ? host.view : 'cards'] = true; } return MODE.filter(function (x) { return m[x[0]]; }).map(function (x) { return x[0]; }); }
  function url(m, hub) { return PAGE[m || 'cards'] + '?code=' + encodeURIComponent(code) + (m ? '&m=' + m : '') + (hub ? '&hub=1' : '') + (PREVIEW ? '&preview=1' : ''); }
  var inMode = false;
  function route() {
    var on = modes(), want = qs.get('m');
    if (!qs.has('hub') && want && on.indexOf(want) >= 0) return go(want);
    if (!qs.has('hub') && on.length === 1) return go(on[0]);
    hub();
  }
  function go(m) {
    if (PAGE[m] !== HERE) { location.replace(url(m)); return; }
    CUR = m;
    var H = $('#v3-hub'); if (H) H.hidden = true;
    inMode = true; document.body.classList.add('v3-on');
    if (modes().length > 1) homeKey();
    begin(m);
  }
  function homeKey() {
    if ($('#v3-home')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'v3-home'; b.innerHTML = '<i>★</i>关卡'; b.title = '回到关卡地图';
    b.onclick = function () { location.href = url(null, true); };
    document.body.appendChild(b);
  }
  function stars() { try { var t = JSON.parse(ls('minest.vocab3d.type.' + code) || '{}'); var n = 0; Object.keys(t.lv || {}).forEach(function (k) { n += t.lv[k] || 0; }); return n; } catch (e) { return 0; } }
  function hub() {
    inMode = false;
    var H = $('#v3-hub'); if (!H) { H = document.createElement('div'); H.id = 'v3-hub'; document.body.appendChild(H); }
    H.hidden = false; document.body.classList.remove('v3-on');
    var on = modes(), c = counts(), N = CARDS.length || 1;
    var prog = {}, pct = {};
    MODE.forEach(function (x) { prog[x[0]] = '看过 ' + c.seen + ' / ' + CARDS.length; pct[x[0]] = c.seen / N; });
    prog.cards = '会了 ' + c.known + ' / ' + CARDS.length; pct.cards = c.known / N; prog.type = '★ ' + stars() + ' / 12'; pct.type = stars() / 12;
    H.innerHTML = '<div class="hb-in"><div class="hb-top"><b>' + esc(host.title) + '</b><span>' + esc(me) + '</span></div><h1>选一个关卡</h1>' +
      '<div class="hb-modes">' + MODE.map(function (x, i) {
        var open = on.indexOf(x[0]) >= 0;
        return '<button type="button" class="hb-m m' + i + (open ? '' : ' off') + '" data-m="' + x[0] + '"' + (open ? '' : ' disabled') + '><span class="ic">' + x[1] + '</span><b>' + x[2] + '</b><small>' + x[3] + '</small>' +
          (open ? '<span class="pg"><i style="width:' + Math.round(pct[x[0]] * 100) + '%"></i></span><em>' + prog[x[0]] + '</em>' : '<em class="lk">🔒 老师还没开放</em>') + '</button>';
      }).join('') + '</div>' + (host.state === 'ended' ? '<p class="hb-note">老师已经结束了这个作业：还可以玩，进度不再记录。</p>' : '') + '' + '</div>';
    [].forEach.call(H.querySelectorAll('[data-m]'), function (b) { b.onclick = function () { if (!b.disabled) go(b.getAttribute('data-m')); }; });
  }
  /* the teacher's switches, heard every few seconds: the level map follows; a mode switched off sends you back to it */
  setInterval(function () {
    if (!host || document.hidden) return;
    db(code + '/host/modes').then(function (m) {
      if (!m) return; var before = JSON.stringify(host.modes || null); host.modes = m;
      if (JSON.stringify(m) === before) return;
      if (inMode && CUR && !m[CUR]) { banner('老师关闭了这个模式，回到关卡地图…'); setTimeout(function () { location.href = url(null, true); }, 1800); return; }
      if (!inMode && $('#v3-hub') && !$('#v3-hub').hidden) hub();
      if (inMode && modes().length > 1) homeKey();
    }).catch(function () {});
  }, 6000);

  function begin(m) {
    document.title = host.title + ' · ' + (MODE.filter(function (x) { return x[0] === m; })[0] || ['', '', '3D 词卡'])[2];
    if (VIEW === 'dyn') { dyn(m); paintPill(); save(); return; }
    if (VIEW === 'type') {
      if (window.V3Type) window.V3Type.start({ cards: CARDS, code: code, mark: function (c, v) { var k0 = key(c.id); if ((K[k0] || 0) < v) { K[k0] = v; save(); } }, extra: function (o) { EXTRA = o; synced = ''; save(); } });
      paintPill(); save(); return;
    }
    try { if (!window.MinestCoverModes.get() || window.MinestCoverModes.get() === 'flow') window.MinestCoverModes.set('wall'); } catch (e) {}
    try { window.dispatchEvent(new Event('minest:image-assets')); } catch (e) {}
    wrapExplode(); paintPill(); save();
  }

  /* ---------------- Knowledge Drive: the words as billboards along a road (each list a road) ---------------- */
  function driveBoard() {   // the drive reads cards in Minest's shape: title, titleZh, back, a cover picture
    return { id: 'vocab3d', title: B.title, columns: B.columns.map(function (col) {
      return { id: col.id, title: col.title, color: col.color, cards: col.cards.map(function (c) {
        var back = [c.pron, c.meaning || c.definitions.en, c.definitions.zh].filter(Boolean).join('\n');
        var o = { id: c.id, title: c.title, titleZh: c.titleZh || '', back: back, notes: c.examples.length ? c.examples.map(function (e) { return e.text; }).join('\n') : '' };
        if (c.img) o.cover = { type: 'image', value: c.img };
        return o;
      }) };
    }) };
  }
  var DB2 = null, DYN = { drive: 'MinestDrive', roadtrip: 'MinestDrive', train: 'MinestTrain', metro: 'MinestMetro', tower: 'MinestTower', rack: 'MinestRack', library: 'MinestLibrary', museum: 'MinestMuseum', city: 'MinestCity', galaxy: 'MinestGalaxy', balloon: 'MinestBalloon' };
  function dyn(m) {
    var end = $('#v3-end'); end.hidden = true;
    var api = window[DYN[m] || 'MinestDrive'];
    if (!api || !window.THREE) { banner('这台设备打不开这个 3D 呈现（WebGL 不可用）。'); return; }
    DB2 = DB2 || driveBoard();
    var P = { boards: function () { return [DB2]; }, openCard: null };
    var o = { source: { type: 'board', bid: DB2.id }, provider: P, fresh: false, onExit: function () { end.hidden = false; } };
    if (m === 'roadtrip') o.style = 'ca1';
    try { api.open(o); } catch (e) { banner('打不开：' + (e.message || e)); }
  }
  $('#v3-end [data-again]') && ($('#v3-end [data-again]').onclick = function () { dyn(CUR || 'drive'); });
  function driveFocus() { if (CUR !== 'drive' && CUR !== 'roadtrip') return null; try { var d = window.MinestDrive && MinestDrive.current(); var f = d && d.state && d.state().focus; return f || null; } catch (e) { return null; } }
  function banner(t) { var b = $('#v3-banner'); b.textContent = t; b.hidden = false; }

  /* the word in view: the exploded card open on it; "我会了" / "再看看" */
  var cur = null;
  function cardOf(it) { var id = it && (it.id || (it.raw && it.raw.id)); for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i]; return null; }
  function wrapExplode() {
    var X = window.MinestExplode; if (!X || X.__v3) return; X.__v3 = 1;
    var open = X.open; X.open = function (it) { var c = cardOf(it); if (c) { cur = c; if (!K[key(c.id)]) { K[key(c.id)] = 1; save(); } } var r = open.apply(this, arguments); paintMark(); return r; };
  }
  function byTitle() { var t = $('#xl .xl-title'); if (!t) return null; var s = t.textContent.replace(/^Exploded Learning Card · /, ''); for (var i = 0; i < CARDS.length; i++) if (CARDS[i].title === s) return CARDS[i]; return null; }
  function paintMark() {
    var m = $('#v3-mark'), open;
    if (VIEW === 'type') { m.hidden = true; document.body.classList.toggle('vt-playing', !!(document.getElementById('vt-play') && !document.getElementById('vt-play').hidden)); return; }
    if (VIEW === 'dyn') {   // the drive: the billboard in focus is the word in view
      var t = driveFocus(); open = !!t;
      if (t) { var c0 = CARDS.filter(function (x) { return x.title === t; })[0]; if (c0 && c0 !== cur) { cur = c0; if (!K[key(c0.id)]) { K[key(c0.id)] = 1; save(); } } }
      m.hidden = !open || !cur; document.body.classList.toggle('v3-xl', open);
      if (!m.hidden) { var v0 = K[key(cur.id)]; $('[data-known]', m).classList.toggle('on', v0 === 2); $('[data-again]', m).classList.toggle('on', v0 === 1); }
      return;
    }
    open = !!document.getElementById('xl');
    if (open) { var c = byTitle(); if (c && c !== cur) { cur = c; if (!K[key(c.id)]) { K[key(c.id)] = 1; save(); } } }
    m.hidden = !open || !cur; document.body.classList.toggle('v3-xl', open);
    if (!m.hidden) { var v = K[key(cur.id)]; $('[data-known]', m).classList.toggle('on', v === 2); $('[data-again]', m).classList.toggle('on', v === 1); }
  }
  setInterval(paintMark, 350);
  function mark(v) { if (!cur) return; K[key(cur.id)] = v; save(); paintMark(); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
  $('#v3-mark [data-known]').onclick = function () { mark(2); };
  $('#v3-mark [data-again]').onclick = function () { mark(1); };

  /* the progress pill; a tap lists the words (a tap on one opens it) */
  function paintPill() {
    var c = counts(), n = CARDS.length || 1;
    $('#v3-n').textContent = c.known + ' / ' + CARDS.length;
    $('#v3-ring').style.setProperty('--p', (c.known / n * 100).toFixed(1));
    $('#v3-seen').textContent = '看过 ' + c.seen;
  }
  $('#v3-pill').onclick = function () {
    var s = $('#v3-sheet'); if (!s.hidden) { s.hidden = true; return; }
    s.innerHTML = '<div class="v3s-hd"><b>' + esc(host.title) + '</b><span>' + esc(me) + '</span><button type="button" data-x aria-label="关闭">✕</button></div><div class="v3s-tabs"><button data-f="all" class="on">全部</button><button data-f="again">再看看</button><button data-f="new">没看过</button><button data-f="known">会了</button></div><div class="v3s-list"></div>';
    var f = 'all';
    function list() {
      $('.v3s-list', s).innerHTML = CARDS.filter(function (c) { var v = K[key(c.id)]; return f === 'all' || (f === 'known' && v === 2) || (f === 'again' && v === 1) || (f === 'new' && !v); }).map(function (c) {
        var v = K[key(c.id)]; return '<button data-id="' + esc(c.id) + '"><i class="' + (v === 2 ? 'k' : v === 1 ? 'a' : '') + '"></i><b>' + esc(c.title) + '</b><small>' + esc(c.titleZh || c.meaning || '') + '</small></button>';
      }).join('') || '<p class="v3s-none">这里没有词。</p>';
      [].forEach.call(s.querySelectorAll('.v3s-list [data-id]'), function (b) { if (VIEW !== 'cards') { b.disabled = true; return; } b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; s.hidden = true; openWord(c); }; });
    }
    [].forEach.call(s.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { f = b.getAttribute('data-f'); [].forEach.call(s.querySelectorAll('[data-f]'), function (x) { x.classList.toggle('on', x === b); }); list(); }; });
    $('[data-x]', s).onclick = function () { s.hidden = true; };
    list(); s.hidden = false;
  };
  function openWord(c) {
    var slot = document.querySelector('.sf-slot[data-sf-view="coverflow"]'); if (!c || !slot || !window.MinestExplode) return;
    var it = { raw: c, id: c.id, title: c.title, sub: c.columnTitle, src: c.img || '', desc: c.meaning || '', color: c.columnColor || '' };
    window.MinestExplode.open(it, CARDS.map(function (x) { return { raw: x, id: x.id, title: x.title, sub: x.columnTitle, src: x.img || '', desc: x.meaning || '' }; }), { container: slot });
  }

  /* students stay here: no links out, no right-click menu into the rest of the site */
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }, true);
  if (code) load(); else joinView('code');
})();
