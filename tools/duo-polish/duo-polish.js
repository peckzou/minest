/* Minest · Duo polish (2026-11-26): page-by-page UI and motion fixes on the Duo (html.duo), following the motion / UI skills
   in .claude/skills. Most of it is CSS (duo-polish.css); this file does only what CSS cannot measure.
   window.MinestDuoPolish = { pass } */
(function () {
  'use strict';
  if (window.MinestDuoPolish) return;
  var R = document.documentElement;

  /* ── Hermes 3000 on the outer screen ──
     the Dock stands up in the bottom-right corner and the machine's right column of keys was under it. The machine keeps
     its own width when its frame narrows (both ends of the keyboard get cut), so the frame keeps the screen's size for
     the layout and is scaled down whole to end left of the Dock: k = (width − Dock's column) / width. Taps follow the
     transform. Off (back to the frame as it was) with the Dock along the bottom (duo-polish.css handles that), in reading
     mode, or off the Duo. */
  function hermes() {
    var f = document.querySelector('.mn-hermes > iframe'); if (!f) return;
    var d = document.querySelector('.mn-bdock');
    var on = R.classList.contains('duo') && R.classList.contains('mn-sysbar') && !R.classList.contains('mn-dock-h') && !R.classList.contains('mn-sys-reading') && d;
    var k = 1;
    if (on) {
      var r = d.getBoundingClientRect(), cs = getComputedStyle(d);
      if (r.width > 0 && r.height > r.width && cs.display !== 'none' && cs.visibility !== 'hidden' && r.left > innerWidth / 2) k = Math.max(.6, (r.left - 4) / innerWidth);
    }
    var want = k < .999 ? k.toFixed(4) : '';
    if (f.__dpK === want) return; f.__dpK = want;
    if (!want) { ['width', 'height', 'transform', 'transform-origin'].forEach(function (p) { f.style.removeProperty(p); }); return; }
    f.style.setProperty('width', innerWidth + 'px', 'important');
    f.style.setProperty('height', (innerHeight / k).toFixed(1) + 'px', 'important');
    f.style.setProperty('transform-origin', '0 0', 'important');
    f.style.setProperty('transform', 'scale(' + want + ')', 'important');
  }

  var queued = false;
  function pass() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; try { hermes(); } catch (e) {} }); }
  window.MinestDuoPolish = { pass: pass };
  addEventListener('resize', function () { var f = document.querySelector('.mn-hermes > iframe'); if (f) f.__dpK = null; pass(); });
  try {
    new MutationObserver(pass).observe(R, { attributes: true, attributeFilter: ['class'] });
    var hook = function () { if (document.body) new MutationObserver(pass).observe(document.body, { childList: true }); pass(); };
    if (document.body) hook(); else document.addEventListener('DOMContentLoaded', hook);
  } catch (e) {}
})();
