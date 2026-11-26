/* Minest · Duo polish (2026-11-26): page-by-page UI and motion fixes on the Duo (html.duo), following the motion / UI skills
   in .claude/skills. CSS in duo-polish.css; this file only does what CSS cannot measure. window.MinestDuoPolish = { pass } */
(function () {
  'use strict';
  if (window.MinestDuoPolish) return;
  var R = document.documentElement;
  function duo() { return R.classList.contains('duo'); }

  /* ── Spatial Home: the credit line keeps clear of the system Dock ──
     beside the Dock when the gap to the right edge holds at least 140px of text, otherwise just above the Dock */
  function credit() {
    var c = document.getElementById('sh-credit');
    if (!c) return;
    var d = document.querySelector('.mn-bdock');
    if (!duo() || !c.textContent.trim() || !d) { c.classList.remove('dp-moved'); return; }
    var dr = d.getBoundingClientRect(), cs = getComputedStyle(d);
    if (dr.width < 2 || cs.display === 'none' || cs.visibility === 'hidden' || dr.bottom < innerHeight - 140) { c.classList.remove('dp-moved'); return; }
    var free = innerWidth - dr.right - 18, left = dr.left - 18;
    c.style.removeProperty('--dp-credit-r');
    if (free >= 140) {
      c.style.setProperty('--dp-credit-w', Math.round(free) + 'px');
      c.style.setProperty('--dp-credit-b', 'calc(4px + env(safe-area-inset-bottom))');
    } else if (left >= 140 && innerWidth - dr.right < 60) {   // the outer screen: the Dock stands up along the right edge
      c.style.setProperty('--dp-credit-w', Math.round(left - 10) + 'px');
      c.style.setProperty('--dp-credit-r', Math.round(innerWidth - dr.left + 8) + 'px');
      c.style.setProperty('--dp-credit-b', 'calc(4px + env(safe-area-inset-bottom))');
    } else {
      c.style.setProperty('--dp-credit-w', '60vw');
      c.style.setProperty('--dp-credit-b', Math.round(innerHeight - dr.top + 6) + 'px');
    }
    c.classList.add('dp-moved');
  }

  var queued = false;
  function pass() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; try { credit(); } catch (e) {} });
  }
  window.MinestDuoPolish = { pass: pass };
  addEventListener('resize', pass);
  addEventListener('orientationchange', pass);
  /* the Dock changes size as pages hand it their keys; the room fills the credit in when it loads */
  try {
    new MutationObserver(pass).observe(R, { attributes: true, attributeFilter: ['class', 'data-mn-ctx', 'data-mn-bd'] });
    var ro = window.ResizeObserver ? new ResizeObserver(pass) : null;
    var hook = function () {
      var d = document.querySelector('.mn-bdock'); if (ro && d && !d.__dpRO) { d.__dpRO = 1; ro.observe(d); }
      var c = document.getElementById('sh-credit'); if (c && !c.__dpMO) { c.__dpMO = 1; new MutationObserver(pass).observe(c, { childList: true, characterData: true, subtree: true }); }
      pass();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
    setTimeout(hook, 1500); setTimeout(hook, 5000);
    document.addEventListener('click', function () { setTimeout(hook, 400); }, true);
  } catch (e) {}
})();
