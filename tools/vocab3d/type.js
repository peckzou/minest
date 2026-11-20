/* Minest · 3D Type for students (vocab-type.html) — pinyin typing over the assigned words, in a real 3D Type world.
   跟打: the words one after another, pinyin with tones shown; speed (字/分) and accuracy.
   闯关: four levels — 1 看拼音 · 2 首字母 · 3 只看汉字 · 4 听写 (the word read aloud, the meaning shown); stars by
   accuracy, a level opens when the one before has a star.
   Every right key is typed into the 3D world (the type3d page in an iframe: same site, its own HUD, links and world
   strip hidden — nothing leads out); a wrong key is not typed, it shakes. ü is v, as in a pinyin keyboard.
   A word typed through: seen; typed with no mistake: known (student.js keeps and syncs that). Level stars and the
   best speed go to the teacher too. window.V3Type = { start(o) } — o from student.js. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var CJK = /[㐀-鿿]/;
  var WORLDS = [['index.html', '立体打印', 'Filament'], ['neon.html', '霓虹', 'Neon'], ['saber.html', '光剑', 'Saber'], ['firework.html', '烟花', 'Firework'],
    ['quill.html', '羽毛笔', 'Quill'], ['topiary.html', '园艺', 'Topiary'], ['book.html', '魔法书', 'Book']];
  var LEVELS = [
    { n: 1, name: '看拼音', sub: '拼音和声调都在眼前' },
    { n: 2, name: '首字母', sub: '只提示每个音节的第一个字母' },
    { n: 3, name: '只看汉字', sub: '拼音藏起来，打出来才看到' },
    { n: 4, name: '听写', sub: '听读音、看意思，汉字也藏起来' }
  ];

  /* ---------------- the words as keys ---------------- */
  function keyOf(ch) { ch = ch.toLowerCase(); if (/[üǖǘǚǜ]/.test(ch)) return 'v'; var b = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); return /^[a-z]$/.test(b) ? b : ''; }
  function target(c) {
    var hz = c.title, py = String(c.pron || '').normalize('NFC').trim(), cn = CJK.test(hz);
    var src = cn ? py : hz;   // a Chinese word: its pinyin; any other word: the word itself
    var syl = src.split(/[\s'’\-·]+/).filter(Boolean).map(function (s) {
      var shown = [], keys = '';
      Array.from(s).forEach(function (ch) { var k = keyOf(ch); if (k) { shown.push(ch); keys += k; } });
      return { shown: shown, keys: keys };
    }).filter(function (s) { return s.keys; });
    var keys = syl.map(function (s) { return s.keys; }).join('');
    return { card: c, hz: hz, cn: cn, py: py, syl: syl, keys: keys, mean: c.meaning || (c.definitions && c.definitions.en) || '' };
  }

  /* ---------------- the 3D world ---------------- */
  var fr = null, worldAt = 0;
  function world(i) {
    worldAt = (i + WORLDS.length) % WORLDS.length; ls('minest.vocab3d.world', String(worldAt));
    var w = WORLDS[worldAt]; $('#vt-world').innerHTML = '<i>◐</i>' + esc(w[1]);
    if (fr) fr.remove();
    fr = document.createElement('iframe'); fr.id = 'vt-frame'; fr.title = '3D Type'; fr.setAttribute('tabindex', '-1'); fr.src = 'type3d/' + w[0];
    fr.onload = function () {
      try {
        var d = fr.contentDocument, s = d.createElement('style');
        s.textContent = '.hud,#t3ds,#t3dw,a,#hint,#err,#title,#jobs,#line{display:none!important}';   // the world's own HUD, links and world strip: nothing leads out
        d.head.appendChild(s);
        new MutationObserver(function () { [].forEach.call(d.querySelectorAll('#t3ds,#t3dw'), function (n) { n.remove(); }); }).observe(d.body, { childList: true });
      } catch (e) {}
    };
    $('#vt-stage').appendChild(fr);
  }
  function send(key) {   // into the world: its own keyboard handler draws the letter (or starts a new line)
    try { fr.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true })); } catch (e) {}
  }

  /* ---------------- reading aloud ---------------- */
  function say(t, cn) { try { var u = new SpeechSynthesisUtterance(String(t)); u.lang = cn ? 'zh-CN' : 'en-US'; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }

  /* ---------------- a run: 跟打 or one level ---------------- */
  var O = null, ALL = [], run = null, KEYSTATE = {};
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function begin(kind, lv) {
    var list = kind === 'follow' ? ALL.slice() : shuffle(ALL).slice(0, Math.min(10, ALL.length));
    run = { kind: kind, lv: lv || 0, list: list, i: 0, pos: 0, ok: 0, bad: 0, wordBad: 0, slip: 0, t0: 0, t: 0, done: 0, chars: 0 };
    $('#vt-levels').hidden = true; $('#vt-result').hidden = true; $('#vt-play').hidden = false;
    $('#vt-mode').textContent = kind === 'follow' ? '跟打' : '第 ' + lv + ' 关 · ' + LEVELS[lv - 1].name;
    send('Enter'); paint(); focusKb();
    if (lv === 4) setTimeout(function () { sayCur(); }, 350);
  }
  function cur() { return run && run.list[run.i]; }
  function sayCur() { var w = cur(); if (w) say(w.hz, w.cn); }
  function press(k) {
    if (!run || $('#vt-play').hidden) return;
    var w = cur(); if (!w) return;
    k = (k || '').toLowerCase(); if (k === 'ü') k = 'v'; if (!/^[a-z]$/.test(k)) return;
    if (!run.t0) run.t0 = performance.now();
    var want = w.keys.charAt(run.pos);
    if (k === want) {
      run.ok++; run.pos++; run.slip = 0; send(k); keyFx(k, 'ok');
      if (run.pos >= w.keys.length) wordDone(w);
    } else {
      run.bad++; run.wordBad++; run.slip++; keyFx(k, 'bad'); shake();
      if (run.slip >= 3 && run.lv >= 2) { run.slip = 0; hintFx(); }   // stuck: the next letter shows for a moment
    }
    paint();
  }
  function wordDone(w) {
    run.done++; run.chars += w.cn ? Array.from(w.hz).filter(function (c) { return CJK.test(c); }).length : 1;
    O.mark(w.card, run.wordBad ? 1 : 2);
    var card = $('#vt-word'); card.classList.remove('win'); void card.offsetWidth; card.classList.add('win');
    if (w.cn && run.lv !== 4) say(w.hz, true);
    setTimeout(function () {
      send('Enter'); run.i++; run.pos = 0; run.wordBad = 0;
      if (run.i >= run.list.length) return finish();
      paint(); if (run.lv === 4) sayCur();
    }, run.lv === 4 ? 700 : 420);
  }
  function rate() { var ms = (run.t || (performance.now() - run.t0)) || 1; return Math.round(run.chars / (ms / 60000)); }
  function acc() { return run.ok + run.bad ? Math.round(run.ok / (run.ok + run.bad) * 100) : 100; }
  function finish() {
    run.t = performance.now() - (run.t0 || performance.now());
    var a = acc(), cpm = rate(), stars = a >= 95 ? 3 : a >= 85 ? 2 : a >= 70 ? 1 : 0, S = state();
    if (run.kind === 'level') { S.lv[run.lv] = Math.max(S.lv[run.lv] || 0, stars); }
    if (!S.best || cpm > S.best.cpm) S.best = { cpm: cpm, acc: a };
    S.runs = (S.runs || 0) + 1; saveState(S);
    var R = $('#vt-result'), next = run.kind === 'level' && stars && run.lv < 4;
    R.innerHTML = '<div class="vt-rc"><div class="vt-stars">' + (run.kind === 'level' ? [1, 2, 3].map(function (i) { return '<i class="' + (i <= stars ? 'on' : '') + '">★</i>'; }).join('') : '⌨︎') + '</div>' +
      '<h2>' + (run.kind === 'follow' ? '跟打完成' : stars ? '第 ' + run.lv + ' 关 通过' : '再试一次') + '</h2>' +
      '<div class="vt-nums"><span><b>' + cpm + '</b>' + (ALL[0] && ALL[0].cn ? '字/分' : '词/分') + '</span><span><b>' + a + '%</b>正确率</span><span><b>' + Math.round(run.t / 1000) + 's</b>用时</span></div>' +
      (run.kind === 'level' && !stars ? '<p>正确率到 70% 就能拿到一颗星。</p>' : '') +
      '<div class="vt-row">' + (next ? '<button class="vt-b pri" data-next>下一关</button>' : '') + '<button class="vt-b' + (next ? '' : ' pri') + '" data-again>再来一次</button><button class="vt-b" data-home>' + (run.kind === 'level' ? '关卡' : '回到开始') + '</button></div></div>';
    $('#vt-play').hidden = true; R.hidden = false;
    var lv = run.lv, kind = run.kind;
    var nb = $('[data-next]', R); if (nb) nb.onclick = function () { begin('level', lv + 1); };
    $('[data-again]', R).onclick = function () { begin(kind, lv); };
    $('[data-home]', R).onclick = function () { if (kind === 'level') levels(); else home(); };
    run = null;
  }

  /* ---------------- the look of a run ---------------- */
  function paint() {
    var w = cur(); if (!w) return;
    var lv = run.lv, hideHz = lv === 4, at = 0;
    var py = w.syl.map(function (s) {   // each letter: typed, the next one, or still to come (hidden from level 2 on)
      var h = '<span class="syl">' + s.shown.map(function (ch, j) {
        var idx = at + j, typed = idx < run.pos, isNext = idx === run.pos;
        var show = typed || lv <= 1 || (lv === 2 && j === 0) || (isNext && run.peek);
        return '<i class="' + (typed ? 't' : isNext ? 'n' : '') + '">' + (show ? esc(ch) : '·') + '</i>';
      }).join('') + '</span>';
      at += s.keys.length; return h;
    }).join('');
    var done = run.pos >= w.keys.length;
    $('#vt-word').innerHTML = (w.cn ? '<div class="hz">' + (hideHz && !done ? '<button class="vt-say" data-say aria-label="再听一遍">🔊</button>' : esc(w.hz)) + '</div>' : '') +
      '<div class="py">' + py + '</div>' + ((lv === 4 || !w.cn) && w.mean ? '<div class="mean">' + esc(w.mean) + '</div>' : '') +
      (!hideHz && w.cn ? '<button class="vt-say sm" data-say aria-label="读一遍">🔊</button>' : '');
    [].forEach.call(document.querySelectorAll('#vt-word [data-say]'), function (b) { b.onclick = function (e) { e.stopPropagation(); sayCur(); }; });
    // what comes next (跟打 shows the line ahead)
    $('#vt-next').innerHTML = run.kind === 'follow' ? run.list.slice(run.i + 1, run.i + 6).map(function (x) { return '<span>' + esc(x.cn ? x.hz : x.hz) + '</span>'; }).join('') : '';
    var wr = $('#vt-word').getBoundingClientRect(); $('#vt-next').style.top = Math.round(wr.bottom + 10) + 'px';   // the words ahead, under the card (top left)
    $('#vt-count').textContent = (run.i + 1) + ' / ' + run.list.length;
    $('#vt-acc').textContent = acc() + '%';
    $('#vt-cpm').textContent = run.t0 ? rate() : '—';
    $('#vt-bar').style.width = (run.i / run.list.length * 100).toFixed(1) + '%';
    var nk = w.keys.charAt(run.pos);
    [].forEach.call(document.querySelectorAll('#vt-kb [data-k]'), function (b) { b.classList.toggle('next', run.lv <= 1 || run.kind === 'follow' ? b.getAttribute('data-k') === nk : false); });
  }
  function shake() { var c = $('#vt-word'); c.classList.remove('bad'); void c.offsetWidth; c.classList.add('bad'); try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {} }
  function hintFx() { run.peek = true; paint(); setTimeout(function () { if (run) { run.peek = false; paint(); } }, 900); }
  function keyFx(k, cls) { var b = $('#vt-kb [data-k="' + k + '"]'); if (!b) return; b.classList.remove('ok', 'bad'); void b.offsetWidth; b.classList.add(cls); }

  /* ---------------- the keyboard: on screen (no Chinese IME in the way) and the real one ---------------- */
  function keyboard() {
    var rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    $('#vt-kb').innerHTML = rows.map(function (r) { return '<div class="r">' + r.split('').map(function (k) { return '<button type="button" data-k="' + k + '">' + (k === 'v' ? 'v<small>ü</small>' : k) + '</button>'; }).join('') + '</div>'; }).join('');
    $('#vt-kb').addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; e.preventDefault(); press(b.getAttribute('data-k')); });
  }
  /* students type on Chromebooks: the on-screen keyboard stays hidden; a finger on the screen brings it, a real key
     sends it away again (2026-11-20, the user) */
  function softKb(on) { document.body.classList.toggle('vt-soft', !!on); }
  document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') softKb(true); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /input|textarea/i.test(e.target.tagName) && e.target.id !== 'vt-in') return;
    if (e.isTrusted) softKb(false);
    if (e.key && e.key.length === 1) { e.preventDefault(); press(e.key); }
  }, true);
  function focusKb() {}

  /* ---------------- screens ---------------- */
  function state() { try { var s = JSON.parse(ls('minest.vocab3d.type.' + O.code) || '{}') || {}; s.lv = s.lv || {}; return s; } catch (e) { return { lv: {} }; } }
  function saveState(S) { ls('minest.vocab3d.type.' + O.code, JSON.stringify(S)); O.extra({ lv: S.lv, best: S.best || null, runs: S.runs || 0 }); }
  function home() {
    run = null; $('#vt-play').hidden = true; $('#vt-result').hidden = true; $('#vt-levels').hidden = false;
    var S = state(), L = $('#vt-levels');
    L.innerHTML = '<div class="vt-home"><h2>拼音打字</h2><p>' + ALL.length + ' 个词 · 打对的字母会在 3D 世界里长出来</p>' +
      '<button class="vt-mode" data-follow><b>⌨︎ 跟打</b><small>按顺序把每个词打一遍，看速度和正确率' + (S.best ? ' · 最好 ' + S.best.cpm + ' 字/分' : '') + '</small></button>' +
      '<div class="vt-lvs">' + LEVELS.map(function (lv, i) {
        var st = S.lv[lv.n] || 0, open = i === 0 || (S.lv[i] || 0) > 0;
        return '<button class="vt-lv' + (open ? '' : ' lock') + '" data-lv="' + lv.n + '"' + (open ? '' : ' disabled') + '><span class="n">' + lv.n + '</span><b>' + lv.name + '</b><small>' + lv.sub + '</small><span class="st">' + (open ? [1, 2, 3].map(function (k) { return '<i class="' + (k <= st ? 'on' : '') + '">★</i>'; }).join('') : '🔒') + '</span></button>';
      }).join('') + '</div></div>';
    $('[data-follow]', L).onclick = function () { begin('follow', 0); };
    [].forEach.call(L.querySelectorAll('[data-lv]'), function (b) { b.onclick = function () { if (!b.disabled) begin('level', +b.getAttribute('data-lv')); }; });
  }
  function levels() { home(); }
  $('#vt-quit').onclick = function () { home(); };
  $('#vt-world').onclick = function () { world(worldAt + 1); };

  window.V3Type = {
    start: function (o) {
      O = o; ALL = o.cards.map(target).filter(function (w) { return w.keys; });
      document.body.classList.add('vt-on');
      if (!ALL.length) { $('#vt-levels').hidden = false; $('#vt-levels').innerHTML = '<div class="vt-home"><h2>这个词表没有可以打的拼音</h2><p>请老师给词加上拼音。</p></div>'; return; }
      keyboard(); world(+(ls('minest.vocab3d.world') || 0) || 0); home();
    }
  };
})();
