/* Minest · the Duo's motion (2026-11-26, the user: the pages' opening and closing, and every button's small press, refined;
   tuned the same day against Emil Kowalski's animation rules and Apple's fluid-interface talk, the skills the user chose).
   One language for all of it:
   · a page grows out of the key that opened it (from .9, iOS's sheet curve, 420ms; a card from .95, 360ms) and shrinks
     back into the Dock's ✕ when it closes (a strong ease-out, 200ms, from wherever it is at that moment);
   · nothing overshoots: nothing here was thrown, so nothing bounces; a page opened from the keyboard just appears;
   · a button sinks under the finger by a few pixels (the bigger the button, the less it scales) and comes back in 160ms;
     a quick tap still gets its whole dip; a drag that becomes a scroll lets it go without a click;
   · a page's keys come into the Dock in a wave (gaps from 34ms, shrinking; all in by 180ms); folded, "=" nods once to say the page has keys of its own;
   · a Settings tab or a level of My World slides in (260ms);
   · full screen: the exit key fades up from .9; leaving it, the Dock rises back.
   Curves are cubic-bézier tokens (EZ.silky is the page's own --mn-ease-silky). Every motion is drawn per frame and always
   lands (Web Animations could stay pending in the app's WebView — see system-bar.js), on the individual `scale` /
   `translate` / `opacity` properties, so a page's own transform stays its own. Reduced motion: fades only, shorter.
   Only on the Duo (html.duo) — but a button's press: on every touch phone. */
(function () {
  'use strict';
  if (window.MinestDuoMotion) return;
  var R = document.documentElement;
  function duo() { return R.classList.contains('duo'); }
  var RM = false; try { var mq = matchMedia('(prefers-reduced-motion: reduce)'); RM = mq.matches; mq.addEventListener && mq.addEventListener('change', function () { RM = mq.matches; }); } catch (e) {}

  /* ---------- the engine: per frame, always landing; delay 0 starts in this very frame (before it is painted) ---------- */
  function tween(dur, fn, done, delay) {
    var t0 = 0, over = false, h = { stop: function () { over = true; } };
    function land() { if (over) return; over = true; try { fn(1); } catch (e) {} if (done) try { done(); } catch (e) {} }
    function step() { if (over) return; var k = Math.min(1, (performance.now() - t0) / dur); if (k >= 1) { land(); return; } try { fn(k); } catch (e) {} requestAnimationFrame(step); }
    function go() { if (over) return; t0 = performance.now(); try { fn(0); } catch (e) {} requestAnimationFrame(step); setTimeout(land, dur + 180); }
    if (delay) setTimeout(go, delay); else go();
    return h;
  }
  /* curves as cubic-béziers, like CSS: one set of tokens for every motion here (Emil Kowalski's / Apple's values) */
  function bez(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; } function b(p1, p2) { return 3 * p2 - 6 * p1; } function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x; for (var i = 0; i < 6; i++) { var d = slope(t, x1, x2); if (Math.abs(d) < 1e-6) break; t -= (at(t, x1, x2) - x) / d; }
      if (t < 0 || t > 1) { var lo = 0, hi = 1; t = x; for (var j = 0; j < 24; j++) { var v = at(t, x1, x2); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
      return at(t, y1, y2);
    };
  }
  var EZ = {
    silky: bez(.22, 1, .36, 1),     /* the page's own --mn-ease-silky: a strong ease-out, for anything entering, leaving or answering a press */
    drawer: bez(.32, .72, 0, 1),    /* iOS's sheet curve: a page arriving */
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    inn: function (k) { return k * k * k; },
    expo: function (k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); },
    /* a spring that settles with one small overshoot (8% of the way): for panels */
    soft: function (k) { return k >= 1 ? 1 : 1 - Math.exp(-7.5 * k) * Math.cos(8.2 * k) - .0006 * k; },
    /* a livelier one for small things (a key, a button let go) */
    spring: function (k) { return k >= 1 ? 1 : 1 - Math.exp(-6.5 * k) * Math.cos(10.5 * k); },
    bell: function (k) { return Math.sin(Math.PI * k); }
  };
  function lerp(a, b, k) { return a + (b - a) * k; }
  function haptic(s) { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(s); } catch (e) {} }

  /* a motion owns scale / translate / opacity / transform-origin of an element while it runs, and gives them back */
  var PROPS = ['scale', 'translate', 'opacity', 'transform-origin', 'will-change', 'transition'];
  function hold(el) {
    if (el.__mo) { el.__mo.h && el.__mo.h.stop(); return el.__mo; }
    var s = {}; PROPS.forEach(function (p) { s[p] = [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]; });
    el.__mo = { saved: s, w: {} };
    /* a page with "transition: all" (Arcade…) would ease every frame we draw and lag behind it: not while we move it */
    var tp = getComputedStyle(el).transitionProperty || '';
    if (/\b(all|scale|translate|opacity)\b/.test(tp) && parseFloat(getComputedStyle(el).transitionDuration) > 0) set(el, 'transition', 'none');
    return el.__mo;
  }
  /* give back what was there — unless the page wrote its own value meanwhile (Arcade sets its own opacity): that one stays */
  function release(el) {
    var m = el.__mo; if (!m) return; el.__mo = null;
    PROPS.forEach(function (p) {
      var now = el.style.getPropertyValue(p);
      if (p in m.w && now !== m.w[p]) return;
      var v = m.saved[p]; if (v[0]) el.style.setProperty(p, v[0], v[1]); else el.style.removeProperty(p);
    });
  }
  function set(el, p, v) { el.style.setProperty(p, v, 'important'); if (el.__mo) el.__mo.w[p] = el.style.getPropertyValue(p); }

  /* ---------- where a motion comes from: the last key pressed (in the Dock, or anywhere) ---------- */
  var lastTap = null;   // {x, y, t, dock}
  document.addEventListener('pointerup', function (e) {
    if (!e.isPrimary) return;
    var dk = e.target && e.target.closest && e.target.closest('.mn-bdock');
    var bk = e.target && e.target.closest && e.target.closest('.mn-sk-back,[data-back],[aria-label*="返回"],[aria-label^="Back"]');
    lastTap = { x: e.clientX, y: e.clientY, t: performance.now(), dock: !!dk, back: !!bk };
    watch(900);
  }, true);
  var lastKey = 0;
  document.addEventListener('keydown', function () { lastKey = performance.now(); watch(700); }, true);
  /* opened from the keyboard (a shortcut, Return on a focused key): it appears at once — a key is pressed far too often
     to wait on a motion each time (Emil: never animate keyboard-initiated actions) */
  function byKeyboard() { return performance.now() - lastKey < 500 && !(lastTap && lastTap.t > lastKey); }
  function origin() { return lastTap && performance.now() - lastTap.t < 1200 ? lastTap : null; }
  function originOn(el, pt) { var r = el.getBoundingClientRect(); return (pt.x - r.left).toFixed(0) + 'px ' + (pt.y - r.top).toFixed(0) + 'px'; }

  /* ---------- pages ---------- */
  /* the panel that moves, where a page is a dim backdrop with a card on it */
  var CARD = { settings: '.board-settings-modal', rings: '.minest-activity-modal' };
  var OWN = { search: 1 };   // pages that already animate their own opening (Omni's drop)
  function DP() { return window.MinestDuoPages && MinestDuoPages.current ? MinestDuoPages : null; }
  function cardOf(cur) {
    var s = CARD[cur.id]; if (!s) return null;
    var c = cur.el.matches(s) ? cur.el : cur.box.querySelector(s); return c && c !== cur.box ? c : null;
  }
  function enter(cur) {
    var box = cur.box, card = cardOf(cur), mover = card || box, o = origin();
    if (OWN[cur.id] || box.__exiting) return;
    if (byKeyboard()) { nod(cur.id); return; }
    /* a page that fades itself in (Arcade writes its own opacity, frame by frame): its entrance stays its own */
    if (box.style.opacity !== '' && !box.__mo) { nod(cur.id); return; }
    var cs = getComputedStyle(box), fade = +cs.opacity > .9;   // already fading in by itself: only the movement
    var fromKey = !!(o && !card);   // a full page grows out of the key that opened it
    var m = hold(box), m2 = mover !== box ? hold(mover) : m;
    box.__duoMo = 1;
    set(mover, 'will-change', 'scale, translate, opacity');
    if (fromKey) set(mover, 'transform-origin', originOn(mover, o));
    /* never from nothing: .9 out of the key, .95 for a card, .97 rising softly (Emil: scale .9–.97 + opacity 0);
       no overshoot — nothing was thrown (Apple: bounce only when a gesture carried momentum) */
    var s0 = RM ? 1 : (fromKey ? .9 : card ? .95 : .97), y0 = RM ? 0 : (fromKey ? 0 : card ? 12 : 10);
    var dur = RM ? 180 : (card ? 360 : 420);   // a sheet / modal: inside the 500ms budget
    var fadeDur = RM ? 160 : 200;
    function frame(k) {
      if (fade) set(box, 'opacity', EZ.silky(Math.min(1, k * dur / fadeDur)).toFixed(3));
      if (!RM) { var e = EZ.drawer(k); set(mover, 'scale', lerp(s0, 1, e).toFixed(4)); set(mover, 'translate', '0 ' + lerp(y0, 0, e).toFixed(2) + 'px'); }
    }
    frame(0);
    var h = tween(dur, frame, function () { box.__duoMo = 0; if (mover !== box) release(mover); release(box); });
    m.h = h; if (m2 !== m) m2.h = h;
    haptic('soft');
    nod(cur.id);
  }
  /* closing: the page shrinks toward the key that closes it and fades; then the page's own close runs. go() is called once */
  function exit(id, box, key, go, card) {
    if (!duo() || !box || box.__exiting) { go(); return; }
    if (OWN[id]) { go(); return; }
    if (!card && CARD[id]) { card = box.querySelector(CARD[id]); if (card === box) card = null; }
    box.__exiting = 1; box.__duoMo = 1;
    var mover = card || box, m = hold(box); if (mover !== box) hold(mover);
    var kr = key && key.getBoundingClientRect && key.getBoundingClientRect(), pt = kr && kr.width ? { x: kr.left + kr.width / 2, y: kr.top + kr.height / 2 } : null;
    set(mover, 'will-change', 'scale, translate, opacity');
    if (pt && !card) set(mover, 'transform-origin', originOn(mover, pt));
    /* from where it is now (a page still rising when ✕ is pressed shrinks from there, no jump back to full size);
       a strong ease-out, quicker than the way in */
    var o0 = +getComputedStyle(box).opacity, sc0 = +(mover.style.scale || 1), ty0 = parseFloat((mover.style.translate || '0 0').split(' ')[1]) || 0;
    var s1 = RM ? 1 : (card ? .96 : pt ? .9 : .96), dur = RM ? 140 : 200;
    haptic('light');
    m.h = tween(dur, function (k) {
      var e = EZ.silky(k);
      set(box, 'opacity', lerp(o0, 0, e).toFixed(3));
      if (!RM) { set(mover, 'scale', lerp(sc0, s1, e).toFixed(4)); set(mover, 'translate', '0 ' + lerp(ty0, card ? 8 : 0, e).toFixed(2) + 'px'); }
    }, function () {
      var ok = false; try { go(); ok = true; } catch (e) {}
      /* give the styles back once the page is really gone (a page that fades itself out must not flash back) */
      var t0 = performance.now();
      (function wait() {
        var gone = !box.isConnected, cs = !gone && getComputedStyle(box), r = !gone && box.getBoundingClientRect();
        if (!gone) gone = cs.display === 'none' || cs.visibility === 'hidden' || r.width < 2 || r.height < 2;
        var still = DP() && DP().current(), stuck = still && still.box === box;
        if (gone || (!stuck && performance.now() - t0 > 120)) { box.__seenGone = 1; box.__exiting = 0; box.__duoMo = 0; if (mover !== box) release(mover); release(box); return; }
        if (performance.now() - t0 > 700 || !ok) { back(box, mover); return; }   // it did not close: spring back
        requestAnimationFrame(wait);
      })();
    });
  }
  function back(box, mover) {
    var m = box.__mo || hold(box), o0 = +(box.style.opacity || 0), s0 = +(mover.style.scale || 1);
    m.h = tween(RM ? 140 : 320, function (k) { var e = EZ.silky(k); set(box, 'opacity', lerp(o0, 1, Math.min(1, k * 2)).toFixed(3)); if (!RM) set(mover, 'scale', lerp(s0, 1, e).toFixed(4)); },
      function () { box.__exiting = 0; box.__duoMo = 0; if (mover !== box) release(mover); release(box); });
  }

  /* ---------- inside a page: its content changing (a Settings tab, a level of My World) slides in ---------- */
  var CONTENT = { settings: '.board-settings-modal > .overflow-y-auto', world: '.uv-body', knowledge: '.kh-body' };
  var swapAt = null;   // { page, el, sig }
  function sigOf(c) { return [c, c.firstElementChild, c.lastElementChild, c.childElementCount]; }
  function same(a, b) { for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function swapCheck(cur) {
    var sel = cur && CONTENT[cur.id], c = sel && cur.box.querySelector(sel);
    if (!c) { swapAt = null; return; }
    var sig = sigOf(c);
    if (!swapAt || swapAt.page !== cur.id || swapAt.el !== c) { swapAt = { page: cur.id, el: c, sig: sig }; return; }
    if (same(swapAt.sig, sig)) return;
    swapAt.sig = sig;
    var o = origin(); if (!o || cur.box.__mo) return;   // only a change the person asked for (a tap just now), never a page's own refresh
    swap(c, cur.id === 'settings' ? [0, 8] : o.back ? [-12, 0] : [12, 0]);
  }
  function swap(c, d) {
    var m = hold(c);
    m.h = tween(RM ? 140 : 260, function (k) { var e = EZ.silky(k); set(c, 'opacity', EZ.silky(Math.min(1, k * 1.6)).toFixed(3)); if (!RM) set(c, 'translate', lerp(d[0], 0, e).toFixed(2) + 'px ' + lerp(d[1], 0, e).toFixed(2) + 'px'); }, function () { release(c); });
  }

  /* the watcher: a page that appears gets its entrance in the frame it first shows */
  var last = null, until = 0, ticking = false, seen = [];
  function check() {
    if (!duo()) return;
    var d = DP(); if (!d) return;
    var cur = null; try { cur = d.current(); } catch (e) {}
    var was = last; last = cur ? { id: cur.id, box: cur.box } : null;
    if (cur && (!was || was.id !== cur.id || was.box !== cur.box)) {
      /* a page under another (Settings over My World…) coming back to the top is not opening: only a new one rises */
      if (!cur.box.__seen || cur.box.__seenGone) enter(cur);
      if (!cur.box.__seen) seen.push(cur.box);
      cur.box.__seen = 1; cur.box.__seenGone = 0;
    }
    /* a page kept in the document while closed (My World's .uv): once it is out of sight it will rise again next time */
    seen = seen.filter(function (b) { if (!b.isConnected) return false; if ((!cur || b !== cur.box) && !visible(b)) b.__seenGone = 1; return true; });
    swapCheck(cur);
  }
  function visible(el) { if (!el.isConnected) return false; var cs = getComputedStyle(el), r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 1 && r.height > 1; }
  function watch(ms) {
    until = Math.max(until, performance.now() + ms);
    if (ticking) return; ticking = true;
    (function loop() { check(); if (performance.now() < until) requestAnimationFrame(loop); else ticking = false; })();
  }
  /* anything added to the page (a page appended to body) or a class on <html> changing: look in the next frame */
  try {
    new MutationObserver(function () { watch(320); }).observe(document.body || R, { childList: true });
    new MutationObserver(onRoot).observe(R, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {}

  /* ---------- the Dock ---------- */
  function dock() { return document.querySelector('.mn-bdock'); }
  function shown(el) { return el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 1; }
  /* a page's keys arrive one by one, from the "=" side */
  function keysIn(g) {
    if (!duo() || RM || R.classList.contains('mn-sys-tools-off')) return;
    var ks = [].filter.call(g.querySelectorAll('.mn-bapp'), shown); if (!ks.length) return;
    ks.forEach(function (k, i) {
      var j = ks.length - 1 - i;   // "=" stands last (lowest): the keys nearest it come first
      /* gaps that shrink (34ms, then less), the whole group in by 180ms however many keys: a wave, not a queue (choreograph) */
      var delay = Math.min(180, Math.round(34 * Math.pow(j, .8)));
      hold(k); set(k, 'opacity', '0'); set(k, 'scale', '.9');
      k.__mo.h = tween(240, function (t) { var e = EZ.silky(t); set(k, 'opacity', e.toFixed(3)); set(k, 'scale', lerp(.9, 1, e).toFixed(4)); }, function () { release(k); }, delay);
    });
  }
  /* folded, a page with keys of its own: "=" nods once */
  var nodded = '';
  function nod(id) {
    if (RM || !R.classList.contains('mn-sys-tools-off') || nodded === id) return;
    nodded = id;
    setTimeout(function () {
      var g = document.querySelector('.mn-bdock .duo-pg'); if (!g || !g.children.length) return;
      var eq = document.querySelector('.mn-bdock .mn-sk-tools'); if (!eq || !shown(eq)) return;
      var sv = eq.querySelector('.mn-eq') || eq; hold(sv);
      sv.__mo.h = tween(620, function (k) { var y = -4 * EZ.bell(Math.min(1, k * 2)) + (k > .5 ? 1.4 * Math.sin((k - .5) * Math.PI * 4) * (1 - k) : 0); set(sv, 'translate', '0 ' + y.toFixed(2) + 'px'); }, function () { release(sv); });
    }, 360);
  }
  /* only a new page's keys come in: the same page refreshing them (a tab turned on in Settings) does not replay it */
  var keysPage = '';
  document.addEventListener('minest:duo-keys', function (e) {
    var d = e.detail || {};
    if (!d.page) { nodded = ''; keysPage = ''; return; }
    if (d.page === keysPage) return; keysPage = d.page;
    if (d.group) requestAnimationFrame(function () { keysIn(d.group); });
  });

  /* <html>'s class: full screen in and out; the tools unfolding */
  var wasReading = R.classList.contains('mn-sys-reading');
  function onRoot() {
    watch(320);
    var rd = R.classList.contains('mn-sys-reading');
    if (rd === wasReading) return; wasReading = rd;
    if (!duo()) return;
    if (rd) {
      var x = document.getElementById('mn-sys-exit'); if (!x) return;
      hold(x); set(x, 'opacity', '0'); if (!RM) set(x, 'scale', '.9');
      x.__mo.h = tween(RM ? 160 : 240, function (k) { var e = EZ.silky(k); set(x, 'opacity', e.toFixed(3)); if (!RM) set(x, 'scale', lerp(.9, 1, e).toFixed(4)); }, function () { release(x); }, 120);
    } else {
      var d = dock(); if (!d) return;
      hold(d); set(d, 'opacity', '0'); if (!RM) { set(d, 'scale', '.95'); set(d, 'translate', '0 8px'); }
      d.__mo.h = tween(RM ? 160 : 300, function (k) { var e = EZ.silky(k); set(d, 'opacity', e.toFixed(3)); if (!RM) { set(d, 'scale', lerp(.95, 1, e).toFixed(4)); set(d, 'translate', '0 ' + lerp(8, 0, e).toFixed(2) + 'px'); } }, function () { release(d); });
    }
  }

  /* ---------- a button's press, inside the pages and on the board ---------- */
  var PRESS = 'button,[role=button],[role=tab],[role=menuitem],[role=option],[role=switch],a[href],summary,label[for],.kh-m,.uv-isle,.uv-act,.ar-btn';
  var NOT = '.mn-bdock,#mn-sh,#mn-sys-exit,#mn-sk-toast,.duo-gl,[draggable=true],[aria-roledescription],input,select,textarea,[contenteditable=true],[data-no-press],.mn-no-press';
  function pressable(e) {
    var path = e.composedPath ? e.composedPath() : [e.target];
    for (var i = 0; i < path.length && i < 12; i++) {
      var el = path[i]; if (!el || el.nodeType !== 1) continue;
      if (el.closest && el.closest(NOT)) return null;
      if (el.matches && el.matches(PRESS)) {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return null;
        var r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8 || r.width > innerWidth * .6 || r.height > innerHeight * .45) return null;   // a whole card / a panel: no
        return el;
      }
    }
    return null;
  }
  var pressed = null;
  /* about 5px in from each side: a small key sinks to .95, a wide row only to .985 */
  function depth(el) { var r = el.getBoundingClientRect(), m = Math.max(r.width, r.height); return Math.max(.95, Math.min(.985, 1 - 5 / Math.max(1, m))); }
  function sink(el) {
    var fresh = !el.__mo, m = hold(el); if (fresh) m.o = +getComputedStyle(el).opacity || 1;
    var s0 = +(el.style.scale || 1), s1 = depth(el), o = m.o;
    m.h = tween(RM ? 1 : 120, function (k) { var e = EZ.silky(k); if (!RM) set(el, 'scale', lerp(s0, s1, e).toFixed(4)); set(el, 'opacity', (o * lerp(1, .8, e)).toFixed(3)); });
  }
  function rise(el) {
    var m = el.__mo; if (!m) return; m.h && m.h.stop(); var s0 = +(el.style.scale || 1), o0 = +(el.style.opacity || m.o || 1), o = m.o || 1;
    m.h = tween(RM ? 120 : 160, function (k) { var e = EZ.silky(k); if (!RM) set(el, 'scale', lerp(s0, 1, e).toFixed(4)); set(el, 'opacity', lerp(o0, o, e).toFixed(3)); }, function () { release(el); });
  }
  /* the page already has a press for every <button> (mn-btn-motion-css: ":active { scale: .94 }", the icon's own little
     motion on click): ours is drawn on the same `scale`, so it takes that press over — it shows on a quick tap too (a
     touch's :active barely shows on the phone), and sinks by size, not by a fixed .94. A button whose own press moves it
     some other way (":active { transform: translateY(3px) }", a pixel key; Knowledge's tiles) keeps it alone: we read
     those rules from the style sheets once (again when sheets are added) and stay out of their way */
  var ownCache = new WeakMap();
  function split(sel) { var out = [], d = 0, cur = ''; for (var i = 0; i < sel.length; i++) { var ch = sel[i]; if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }
  function scan(list, out) {
    [].forEach.call(list || [], function (r) {
      try {
        if (r.cssRules && !r.selectorText) { scan(r.cssRules, out); return; }
        if (!r.selectorText || r.selectorText.indexOf(':active') < 0) return;
        var st = r.style, moves = (st.transform && st.transform !== 'none') || (st.translate && st.translate !== 'none');
        if (!moves) return;
        split(r.selectorText).forEach(function (one) {
          var i = one.indexOf(':active'); if (i < 0) return;
          var pre = one.slice(0, i).trim(); if (!pre || /[>+~]$/.test(pre)) return;
          try { document.createDocumentFragment().querySelector(pre); out.push(pre); } catch (e) {}
        });
      } catch (e) {}
    });
  }
  function ownRules(root) {
    var sheets = root.styleSheets || [], n = sheets.length, c = ownCache.get(root);
    if (c && c.n === n) return c.list;
    var list = []; [].forEach.call(sheets, function (sh) { try { scan(sh.cssRules, list); } catch (e) {} });
    ownCache.set(root, { n: n, list: list }); return list;
  }
  function ownPress(el) {
    if (el.__ownPress != null) return el.__ownPress;
    var root = el.getRootNode ? el.getRootNode() : document, rules = ownRules(document).concat(root !== document ? ownRules(root) : []);
    var own = rules.some(function (pre) { try { return !!el.closest(pre); } catch (e) { return false; } });
    el.__ownPress = own; return own;
  }
  /* the press is every touch phone's, not only the Duo's (2026-11-26: the same page, the same WebKit; a regular
     iPhone had only the page's flat ":active { scale: .94 }", which a quick tap barely shows) */
  var TOUCH = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('pointerdown', function (e) {
    if (!(duo() || TOUCH) || !e.isPrimary || e.button > 0) return;
    var el = pressable(e); if (!el || ownPress(el)) return;
    var me = pressed = { el: el, x: e.clientX, y: e.clientY, t: performance.now() };
    sink(el);   // at once: the finger feels it land
  }, true);
  /* let go: a quick tap still gets its whole dip (90ms) before it springs back; a scroll lets go at once */
  function letGo(cancel) {
    var me = pressed; if (!me) return; pressed = null;
    var wait = cancel || RM ? 0 : Math.max(0, 90 - (performance.now() - me.t));
    if (wait) setTimeout(function () { rise(me.el); }, wait); else rise(me.el);
  }
  document.addEventListener('pointermove', function (e) {
    if (!pressed || !e.isPrimary) return;
    if (Math.abs(e.clientX - pressed.x) + Math.abs(e.clientY - pressed.y) > 10) letGo(true);   // a scroll, not a press
  }, true);
  document.addEventListener('pointerup', function () { letGo(false); }, true);
  document.addEventListener('pointercancel', function () { letGo(true); }, true);
  window.addEventListener('blur', function () { letGo(true); });

  window.MinestDuoMotion = { exit: exit, enter: function () { var d = DP(), c = d && d.current(); if (c) enter(c); }, keysIn: keysIn, check: check, tween: tween, EZ: EZ };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { watch(400); }); else watch(400);
})();
