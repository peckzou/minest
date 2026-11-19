/* Minest Duo 70 — added by tools/duo-70/build.py. Everything here is additive: it listens to the app's own events
   and marks its own attributes; no app state is written. */
(function () {
  'use strict';
  if (window.MinestV70) return;
  var R = document.documentElement;
  R.classList.add('mn70');
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ------------------------------------------------------------------ 1. board | 3D Cover, both ways
     The board already turns the Cover (minest:cf-goto). Here the Cover turns the board: the card in front of the
     Cover is marked on the board, and scrolled into view when it is out of sight. */
  var CUR = 'data-mn70-cur';
  var curEl = null, syncT = null, boardTouchAt = 0, ownScroll = null;

  function split() { return R.classList.contains('duo-cover'); }
  function boardPane() { return document.querySelector('.sf-slot[data-sf-view="board"]'); }
  function q(id) { return String(id).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  function shown(el) { var r = el.getBoundingClientRect(); return r.width > 40 && r.height > 8; }

  /* the top card of the stack a card sits in (the card itself when it is not in a stack) */
  function stackTop(board, id) {
    var cols = (board && board.columns) || [];
    function has(list) { return (list || []).some(function (c) { return String(c.id) === String(id) || has(c.stack); }); }
    for (var i = 0; i < cols.length; i++) {
      var cards = cols[i].cards || [];
      for (var j = 0; j < cards.length; j++) {
        if (String(cards[j].id) === String(id)) return String(id);
        if (has(cards[j].stack)) return String(cards[j].id);
      }
    }
    return null;
  }
  /* the board's element for a card: its own row, else (a card inside a closed stack) the stack's top card */
  function boardCard(id) {
    var pane = boardPane(); if (!pane || id == null) return null;
    var own = pane.querySelectorAll('article[data-card-id="' + q(id) + '"]');
    for (var i = 0; i < own.length; i++) if (shown(own[i])) return own[i];
    var top = null;
    try { top = stackTop(window.MinestAI.board(), id); } catch (e) {}
    if (top == null || top === String(id)) return null;
    var a = pane.querySelectorAll('article[data-card-id="' + q(top) + '"]');
    for (var k = 0; k < a.length; k++) if (shown(a[k])) return a[k];
    return null;
  }
  function scroller(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (p.scrollHeight > p.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
    }
    return null;
  }
  function mark(el) {
    if (curEl === el) return false;
    if (curEl) curEl.removeAttribute(CUR);
    curEl = el;
    if (el) el.setAttribute(CUR, '');
    return true;
  }
  /* bring the card into the list's view; the board's own "top card turns the Cover" stays quiet until the scroll rests */
  function reveal(el) {
    var sc = scroller(el); if (!sc) return;
    var a = el.getBoundingClientRect(), b = sc.getBoundingClientRect(), pad = 14;
    if (a.top >= b.top + pad - 1 && a.bottom <= b.bottom - pad + 1) return;
    var to = sc.scrollTop + (a.top - b.top) - Math.max(pad, (b.height - a.height) * 0.3);
    to = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, Math.round(to)));
    if (Math.abs(to - sc.scrollTop) < 2) return;
    ownScroll = sc; window.__mn70Quiet = Date.now() + 900;
    try { sc.scrollTo({ top: to, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { sc.scrollTop = to; }
  }
  document.addEventListener('scroll', function (e) {
    if (ownScroll && e.target === ownScroll) { if (window.__mn70Quiet > Date.now()) window.__mn70Quiet = Date.now() + 420; else ownScroll = null; }
  }, true);
  /* a finger (or wheel) on the board: the board leads, so it is marked but never scrolled under the finger */
  function touched(e) { if (e.target && e.target.closest && e.target.closest('.sf-slot[data-sf-view="board"]')) { boardTouchAt = Date.now(); ownScroll = null; window.__mn70Quiet = 0; } }
  ['touchstart', 'touchmove', 'wheel', 'pointerdown'].forEach(function (n) { document.addEventListener(n, touched, { passive: true, capture: true }); });

  function sync() {
    syncT = null;
    if (!split()) { mark(null); return; }
    var id = null;
    try { id = window.MinestImageViews.state(window.MinestAI.board().id).selected; } catch (e) {}
    var el = boardCard(id);
    var moved = mark(el);
    if (el && moved && Date.now() - boardTouchAt > 700) reveal(el);
  }
  function queue(ms) { clearTimeout(syncT); syncT = setTimeout(sync, ms == null ? 120 : ms); }
  window.addEventListener('minest:image-selection', function () { if (split()) queue(); });
  window.addEventListener('minest:cf-list', function () { if (split()) queue(260); });
  /* the split opens or closes; a stack opens or closes (its rows appear) */
  new MutationObserver(function () { if (split()) queue(520); else if (curEl) mark(null); }).observe(R, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', function (e) { if (split() && e.target.closest && e.target.closest('.sf-slot[data-sf-view="board"]')) queue(380); }, true);

  /* ------------------------------------------------------------------ 2. motion: things arrive once, then stay still */
  function once(cls, ms) { R.classList.add(cls); setTimeout(function () { R.classList.remove(cls); }, ms); }
  /* a board comes in list by list: on launch and each time another board is opened */
  var boardId = null;
  function boardEnter() {
    var id = null;
    try { id = window.MinestAI.board().id; } catch (e) {}
    if (id == null || id === boardId) return;
    var first = boardId === null; boardId = id;
    if (!reduce && !split() && (first || !document.hidden)) once('mn70-enter', 900);
    /* another board while the split is open: the Cover still held the last board's list and stayed empty until the
       board was scrolled. The Duo script sends the visible list on a scroll, so it is told there was one; then the
       mark is placed (a board's first Cover card raises no event the mark could follow). */
    if (split() && !first) {
      window.__mn70Quiet = Date.now() + 600;
      document.dispatchEvent(new Event('scroll'));
      queue(900);
    }
  }
  /* the split opens: both panes arrive together */
  var wasSplit = split();
  new MutationObserver(function () {
    var s = split();
    if (s && !wasSplit && !reduce) once('mn70-split-in', 700);
    if (s !== wasSplit) splitAt = Date.now();
    wasSplit = s;
  }).observe(R, { attributes: true, attributeFilter: ['class'] });
  /* another view (board, 3D Cover) fades up instead of snapping in; not when the split opens or closes */
  var viewName = null, splitAt = 0;
  function viewEnter() {
    var el = split() ? null : document.querySelector('#root main > .sf-slot[data-sf-view]');
    var v = el && el.getAttribute('data-sf-view');
    if (!v || v === viewName) return;
    if (viewName && !reduce && !document.hidden && Date.now() - splitAt > 900) once('mn70-view-in', 1000);
    viewName = v;
  }

  /* outer screen: the Mini Pet's default spot is on top of the Glance's "start studying" button. While the Glance
     is showing, a pet that was never dragged rests in the free corner below the cards, and goes back after. */
  function glance() {
    var g = R.classList.contains('duo-outer') && document.querySelector('body > .duo-gl');
    return !!g && !g.hidden;
  }
  function petPark() {
    var pet = document.getElementById('minest-mini-pet-p0');
    if (!pet || window.__miniPetHost) return;
    var dragged = false;
    try { dragged = !!localStorage.getItem('minest.miniPetP0.position'); } catch (e) {}
    var parked = pet.hasAttribute('data-mn70-park');
    if (dragged) { if (parked) pet.removeAttribute('data-mn70-park'); return; }
    if (glance()) {
      pet.setAttribute('data-mn70-park', '');
      pet.style.left = Math.max(0, window.innerWidth - pet.offsetWidth + 10) + 'px';
      pet.style.top = Math.max(0, window.innerHeight - pet.offsetHeight - 4) + 'px';
    } else if (parked) {
      pet.removeAttribute('data-mn70-park');
      pet.style.left = '14px'; pet.style.top = '88px';
    }
  }
  function petSoon() { setTimeout(petPark, 60); setTimeout(petPark, 700); }
  window.addEventListener('resize', petSoon);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.duo-gl, .duo-back')) petSoon(); }, true);
  new MutationObserver(petSoon).observe(R, { attributes: true, attributeFilter: ['class'] });
  setTimeout(petPark, 1500); setTimeout(petPark, 4000);

  /* ------------------------------------------------------------------ 3. speed */
  /* periodic housekeeping (the Sync Center's 4-second scan of all boards) runs between gestures, not during one:
     it waits while a finger is down or the screen moved in the last 1.2 s, for at most 8 s */
  var inputAt = 0, fingers = 0;
  function input() { inputAt = Date.now(); }
  ['touchmove', 'wheel', 'scroll', 'pointermove', 'keydown'].forEach(function (n) { document.addEventListener(n, input, { passive: true, capture: true }); });
  document.addEventListener('touchstart', function (e) { fingers = e.touches.length; input(); }, { passive: true, capture: true });
  ['touchend', 'touchcancel'].forEach(function (n) { document.addEventListener(n, function (e) { fingers = e.touches.length; input(); }, { passive: true, capture: true }); });
  function idle(fn, since) {
    since = since || Date.now();
    var busy = fingers > 0 || Date.now() - inputAt < 1200;
    if (busy && Date.now() - since < 8000) { setTimeout(function () { idle(fn, since); }, 400); return; }
    if (window.requestIdleCallback && !busy) requestIdleCallback(function () { fn(); }, { timeout: 1500 }); else fn();
  }
  window.__mn70Idle = function (fn) {
    if (fn.__mn70Waiting) return;   /* one pending run per job */
    fn.__mn70Waiting = true;
    idle(function () { fn.__mn70Waiting = false; fn(); }, 0);
  };

  /* in the background (another app, the screen off) no CSS animation runs */
  function vis() { R.classList.toggle('mn70-hidden', document.hidden); }
  document.addEventListener('visibilitychange', vis); vis();
  /* pictures decode off the main thread, so a list of photo cards scrolls without a hitch */
  function lazy(root) {
    var im = root.querySelectorAll ? root.querySelectorAll('img:not([decoding])') : [];
    for (var i = 0; i < im.length; i++) im[i].decoding = 'async';
  }
  var lazyQ = false;
  new MutationObserver(function () {
    viewEnter();
    if (lazyQ) return; lazyQ = true;
    setTimeout(function () {
      lazyQ = false; lazy(document); boardEnter();
      if (curEl && !curEl.isConnected && split()) queue(0);   /* the marked row was re-rendered */
    }, 300);
  }).observe(document.body, { childList: true, subtree: true });
  lazy(document); boardEnter(); viewEnter();

  window.MinestV70 = {
    version: '70.0',
    /* tests */ _stackTop: stackTop, _idle: idle, _boardCard: boardCard, _sync: sync, current: function () { return curEl; }
  };
})();
