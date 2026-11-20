/* Minest · 3D 词卡 · 学生页 (vocab3d.html?code=CODE, /vocab) — only the words the teacher assigned, as 3D dynamic
   cards (the 3D Cover modes, card styles, the exploded learning card). No Dock, no system keys, no way into the rest
   of Minest (2026-11-20, the user). The student marks each word 我会了 / 再看看; progress goes to the teacher:
   /minest-live/{CODE}/players/{pid} = { name, seen, known, total, at, k: { cardKey: 1 seen | 2 known } }. */
(function () {
  'use strict';
  var DB = 'https://minest-33761-default-rtdb.firebaseio.com/minest-live/';
  var qs = new URLSearchParams(location.search), PREVIEW = qs.has('preview');
  var VIEW = window.__V3_VIEW || 'cards';   // 'cards' (vocab3d.html) or 'drive' (vocab-drive.html): how the teacher chose to present the words
  function db(path, method, body) {
    return fetch(DB + path + '.json', { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('网络错误（' + r.status + '）'); return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
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
        '<input class="v3j-code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="V·····" value="' + esc(code) + '">' +
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
      var want = h.view === 'drive' || h.view === 'type' ? h.view : 'cards';
      if (want !== VIEW) { location.replace({ drive: 'vocab-drive.html', type: 'vocab-type.html', cards: 'vocab3d.html' }[want] + location.search); return; }
      host = h; pid = ls('minest.vocab3d.pid.' + code);
      if (PREVIEW) { start('老师预览'); return; }
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
    document.title = host.title + (VIEW === 'drive' ? ' · Knowledge Drive' : VIEW === 'type' ? ' · 3D Type' : ' · 3D 词卡');
    $('#v3-ttl').textContent = host.title;
    if (host.state === 'ended') banner('老师已经结束了这个作业：还可以看，进度不再记录。');
    if (PREVIEW) banner('老师预览：这里的标记不会记进学生进度。');
    document.body.classList.add('v3-on');
    if (VIEW === 'drive') { drive(); paintPill(); save(); return; }
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
  var DB2 = null;
  function drive() {
    var end = $('#v3-end'); end.hidden = true;
    if (!window.MinestDrive || !window.THREE) { banner('这台设备打不开 3D 驾驶（WebGL 不可用）。'); return; }
    DB2 = DB2 || driveBoard();
    var P = { boards: function () { return [DB2]; }, openCard: null };
    try {
      window.MinestDrive.open({ source: { type: 'board', bid: DB2.id }, provider: P, fresh: false, onExit: function () { end.hidden = false; } });
    } catch (e) { banner('打不开 3D 驾驶：' + (e.message || e)); }
  }
  $('#v3-end [data-again]') && ($('#v3-end [data-again]').onclick = function () { drive(); });
  function driveFocus() { try { var d = window.MinestDrive && MinestDrive.current(); var f = d && d.state && d.state().focus; return f || null; } catch (e) { return null; } }
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
    if (VIEW === 'drive') {   // the billboard in focus is the word in view
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
