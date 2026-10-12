/* Minest Knowledge · swipe from the left edge to go back (window.MinestEdgeBack)
   My World and the pages opened from it (Add, Discover, the world builder, starter pages, pickers, skills,
   List of Mine) are layered: a swipe in from the left edge follows the finger and goes back one level — the page's
   own ‹ Back — and only on its first page closes it. A short or slow pull springs back. */
(function () {
  if (window.MinestEdgeBack) return;
  var LAYERS = ['.fw', '.mw', '.dv', '.wc', '.bd', '.st', '.pk', '.sk', '.lw'];
  var EDGE = 26, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function topLayer(t) {
    for (var i = 0; i < LAYERS.length; i++) { var el = t && t.closest && t.closest(LAYERS[i]); if (el && el.parentNode === document.body) return el; }
    return null;
  }
  // the page's own way back: its ‹ Back button, else its ✕
  function backOf(el) {
    var hd = el.firstElementChild, b = (hd && hd.querySelector('[data-back]')) || el.querySelector(':scope > * [data-back]');
    if (b && b.offsetParent !== null) return { b: b, close: false };
    var x = (hd && hd.querySelector('[data-x]')) || el.querySelector('[data-x]');
    return x ? { b: x, close: true } : null;
  }
  var g = null;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { g = null; return; }
    var t = e.touches[0], el = t.clientX <= EDGE ? topLayer(e.target) : null;
    if (!el || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { g = null; return; }
    g = { el: el, x0: t.clientX, y0: t.clientY, t0: Date.now(), on: false, dx: 0 };
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!g) return;
    var t = e.touches[0], dx = t.clientX - g.x0, dy = t.clientY - g.y0;
    if (!g.on) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > dx) { g = null; return; }   // a scroll, not a swipe
      if (dx < 10) return;
      g.on = true; g.el.style.transition = 'none'; g.el.style.willChange = 'transform';
    }
    if (e.cancelable) e.preventDefault();
    g.dx = Math.max(0, dx);
    g.el.style.transform = 'translateX(' + g.dx + 'px)';
    g.el.style.boxShadow = '-14px 0 40px rgba(0,0,0,' + Math.max(0, .35 - g.dx / 1600).toFixed(3) + ')';
  }, { capture: true, passive: false });
  function end() {
    if (!g) return; var s = g; g = null; if (!s.on) return;
    var w = window.innerWidth, v = s.dx / Math.max(1, Date.now() - s.t0), go = s.dx > w * .32 || (s.dx > 50 && v > .45);
    var bk = go && backOf(s.el);
    var ease = 'transform ' + (reduce ? 0 : 220) + 'ms cubic-bezier(.2,.85,.25,1)';
    s.el.style.transition = ease;
    if (!bk) { s.el.style.transform = ''; setTimeout(function () { s.el.style.transition = ''; s.el.style.boxShadow = ''; s.el.style.willChange = ''; }, 240); return; }
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {}
    s.el.style.transform = 'translateX(' + w + 'px)';
    setTimeout(function () {
      if (bk.close) { s.el.style.opacity = '0'; bk.b.click(); return; }   // its first page: close it (it is already out of view)
      bk.b.click();   // one level back, then the page slides in again from the left
      s.el.style.transition = 'none'; s.el.style.transform = 'translateX(-28%)'; s.el.style.opacity = '.4';
      void s.el.offsetWidth;
      s.el.style.transition = reduce ? '' : 'transform 260ms cubic-bezier(.2,.85,.25,1),opacity 200ms ease';
      s.el.style.transform = ''; s.el.style.opacity = ''; s.el.style.boxShadow = '';
      setTimeout(function () { s.el.style.transition = ''; s.el.style.willChange = ''; }, 280);
    }, reduce ? 0 : 200);
  }
  document.addEventListener('touchend', end, { capture: true, passive: true });
  document.addEventListener('touchcancel', function () { if (g && g.on) { g.dx = 0; end(); } else g = null; }, { capture: true, passive: true });
  window.MinestEdgeBack = { layers: LAYERS };
})();
