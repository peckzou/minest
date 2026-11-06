/* 74 · Octo in the waiting games on the student side: student mode pins the Mini Pet to the bottom-left corner
   (!important, under everything) so it never covers a button — which also kept Octo out of Octo Dive, Flappy Octo and
   Energy Rush, where Octo IS the player. While one of those games (.mlv-of) is open, the pin gives way to where the
   game puts Octo; when it closes, the pin is back. */
(function () {
  'use strict';
  if (window.__mlvOctoFree) return; window.__mlvOctoFree = 1;
  var H = document.documentElement, on = false, petObs = null;
  function pet() { return document.getElementById('minest-mini-pet-p0'); }
  function copy() {
    var el = pet(); if (!el || !on) return;
    var x = el.style.left, y = el.style.top;
    if (x && el.style.getPropertyValue('--mlv-px') !== x) el.style.setProperty('--mlv-px', x);
    if (y && el.style.getPropertyValue('--mlv-py') !== y) el.style.setProperty('--mlv-py', y);
  }
  function check() {
    var now = !!document.querySelector('.mlv-of');
    if (now === on) return; on = now; H.classList.toggle('mlv-octo-free', on);
    var el = pet();
    if (on && el) {
      var r = el.getBoundingClientRect(); if (!el.style.left) el.style.left = r.left + 'px'; if (!el.style.top) el.style.top = r.top + 'px'; copy();
      if (petObs) petObs.disconnect(); petObs = new MutationObserver(copy); petObs.observe(el, { attributes: true, attributeFilter: ['style'] });
    } else if (petObs) { petObs.disconnect(); petObs = null; if (el) { el.style.removeProperty('--mlv-px'); el.style.removeProperty('--mlv-py'); } }
  }
  var st = document.createElement('style'); st.id = 'mlv-octo-free-css';
  st.textContent = 'html.student-mode.mlv-octo-free #minest-mini-pet-p0, html.mlv-octo-free body.student-mode #minest-mini-pet-p0 { left: var(--mlv-px, 14px) !important; top: var(--mlv-py, auto) !important; right: auto !important; bottom: auto !important; z-index: 2147483450 !important; transform: rotate(var(--game-drift, 0deg)) !important; }';
  st.textContent += ' .mlv-chips .mlv-chip-sep { flex-basis: 100%; font-size: 12px; font-weight: 800; color: #c7cdf5; margin: 8px 0 2px; }';   /* the teacher's Levels: the teaching games' heading */
  (document.head || document.documentElement).appendChild(st);
  new MutationObserver(check).observe(document.body || document.documentElement, { childList: true });
  check();
})();
