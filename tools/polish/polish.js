/* Minest polish · board (tools/polish/patch_board_polish.py) */
(function () {
  'use strict';
  if (window.__mnPolishBoard) return; window.__mnPolishBoard = 1;
  var R = document.documentElement;
  /* --mn-dock-clear: how far a bottom bar must stay above the floating Dock (0 when the Dock is on a side or hidden) */
  var q = 0;
  function dockClear() {
    q = 0;
    var d = document.querySelector('.mn-bdock'), v = 0;
    if (d) {
      var r = d.getBoundingClientRect(), cs = getComputedStyle(d);
      if (r.width > r.height && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > innerHeight - 40) v = Math.max(0, Math.round(innerHeight - r.top + 8));
    }
    var s = v + 'px'; if (R.style.getPropertyValue('--mn-dock-clear') !== s) R.style.setProperty('--mn-dock-clear', s);
  }
  function soon() { if (!q) q = requestAnimationFrame(dockClear); }
  addEventListener('resize', soon, { passive: true });
  new (MutationObserver.Native || MutationObserver)(function () { soon(); slimPet(); }).observe(R, { attributes: true, attributeFilter: ['class'] });
  /* mini pet: a hit area the size of the octopus; the rest of its square lets taps through */
  function slimPet() {
    var p = document.getElementById('minest-mini-pet-p0');
    if (!p) return false;
    if (window.__miniPetHost || p.__mnSlim) return true;
    p.__mnSlim = 1;
    var h = document.createElement('i'); h.className = 'mn-pet-hit'; h.setAttribute('aria-hidden', 'true');
    p.appendChild(h); p.classList.add('mn-pet-slim');
    function inert() { p.classList.toggle('mn-pet-inert', p.style.pointerEvents === 'none'); }
    new (MutationObserver.Native || MutationObserver)(inert).observe(p, { attributes: true, attributeFilter: ['style'] });
    inert();
    return true;
  }
  var tries = 0;
  (function wait() { if (slimPet() || ++tries > 90) return; setTimeout(wait, 1000); })();
  function boot() { soon(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
