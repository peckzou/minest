/* Pet Raising → Aquarium: native hinge entry, independent of board split navigation. */
(function () {
  'use strict';
  if (window.MinestPetAquarium) return;
  var timer = 0, pending = false, active = null, blocked = false;
  var overlayID = 'minest-pet-raising-overlay';
  function pet() { return document.getElementById(overlayID); }
  function folded(h) {
    return h && h.status === 'partial' && Number.isFinite(h.angle) && h.angle >= 0.9 && h.angle <= 3.04;
  }
  function open(automatic) {
    if (pending || active || !pet() || document.hidden) return;
    var aquarium = window.MinestAquarium;
    if (!aquarium || !window.THREE) {
      // Keep Pet Raising visible if its parent's 3D scripts are still loading.
      if (!automatic) window.dispatchEvent(new CustomEvent('minest:aquarium-unavailable'));
      return;
    }
    pending = true;
    try {
      aquarium.open();
      if (!aquarium.isOpen()) return;
      active = { automatic: !!automatic };
      // Reuse the existing transition: release Pet Raising's WebGL iframe.
      // Its care/outfit data stays in the existing shared stores.
      var overlay = pet(); if (overlay) overlay.remove();
      document.documentElement.classList.remove('pet-raising-open');
    } catch (error) {
      try { aquarium.close(); } catch (_) {}
      console.warn('[Pet Aquarium] Could not open:', error && error.message);
    } finally { pending = false; }
  }
  function consider() {
    clearTimeout(timer);
    if (!blocked && !active && pet() && !document.hidden && folded(window.__minestHinge)) {
      timer = setTimeout(function () {
        if (!blocked && pet() && folded(window.__minestHinge)) open(true);
      }, 450);
    }
  }
  addEventListener('minest:hinge', function (event) {
    var h = event.detail;
    if (h && h.status === 'open') {
      blocked = false;
      clearTimeout(timer);
      if (active && active.automatic) window.MinestAquarium.close();
    } else { consider(); }
  });
  addEventListener('minest:aquarium-closed', function () {
    if (!active) return;
    active = null; blocked = folded(window.__minestHinge); clearTimeout(timer);
    if (window.MinestPetRaising) window.MinestPetRaising.open();
  });
  // Opening Pet Raising while already partially folded also works.
  var observer = new MutationObserver(consider);
  function watch() {
    observer.observe(document.body, { childList: true });
    consider();
  }
  if (document.body) watch(); else addEventListener('DOMContentLoaded', watch, { once: true });
  document.addEventListener('visibilitychange', consider);
  window.MinestPetAquarium = { open: function () { open(false); }, version: '53.85.1' };
})();
