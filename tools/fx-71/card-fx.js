/* Minest · board Card FX 71 — holo · float · wave (tools/fx-71).
   The board's card-mode switch writes the mode to <html data-cfx="…"> and fires `minest:cardfx`;
   this block gives every board card a foil layer and drives the three looks:
     holo  — a holographic foil on every card; the card under the pointer tilts toward it
     float — the cards hover, each on its own slow beat
     wave  — a wave of lift and light runs across the lists; tap a card to send one out from it
   The look itself is in the stylesheet beside this file. */
(function () {
  'use strict';
  if (window.MinestCardFX) return;
  var root = document.documentElement, MODES = ['holo', 'float', 'wave'];
  var SEL = '.fb-board-stage article.kanban-card[data-card-id], .board-swimlane-scroll article.kanban-card[data-card-id]';
  var mode = 'none', timer = 0, hot = null, raf = 0, pend = null;
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function cardOf(t) { return t && t.closest ? t.closest('article.kanban-card[data-card-id]') : null; }
  function inBoard(el) { return !!(el && el.closest('.fb-board-stage, .board-swimlane-scroll')); }

  function sync() {
    var els = document.querySelectorAll(SEL), cols = [], count = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i], f = el.__cfxFoil;
      if (!f || f.parentNode !== el) {
        f = document.createElement('i');
        f.className = 'cfx-foil';
        f.setAttribute('aria-hidden', 'true');
        el.appendChild(f);
        el.__cfxFoil = f;
      }
      if (el.__cfxMode === mode) {
        if (mode === 'wave') { var c0 = el.closest('.kanban-cards-scroll') || el.parentNode, k0 = cols.indexOf(c0); if (k0 < 0) { k0 = cols.push(c0) - 1; count[k0] = 0; } count[k0]++; }
        continue;
      }
      el.__cfxMode = mode;
      var h = hash(el.getAttribute('data-card-id') || String(i));
      if (mode === 'float') {
        el.style.setProperty('--cfx-dur', (3.4 + (h % 7) * 0.28).toFixed(2) + 's');
        el.style.setProperty('--cfx-dl', (-((h >>> 4) % 4000) / 1000).toFixed(2) + 's');
        el.style.setProperty('--cfx-r', (((h >>> 9) % 2 ? 1 : -1) * (0.2 + ((h >>> 11) % 5) * 0.07)).toFixed(2) + 'deg');
      } else if (mode === 'wave') {
        // the wave runs list by list, top to bottom: the delay comes from the card's place on the board
        var col = el.closest('.kanban-cards-scroll') || el.parentNode, k = cols.indexOf(col);
        if (k < 0) { k = cols.push(col) - 1; count[k] = 0; }
        el.style.setProperty('--cfx-wd', ((k * 0.24 + count[k] * 0.085) % 4.4).toFixed(2) + 's');
        count[k]++;
      } else if (mode === 'holo') {
        el.style.setProperty('--cfx-dl', (-((h >>> 4) % 7000) / 1000).toFixed(2) + 's');
      }
    }
  }
  function clear() {
    var fs = document.querySelectorAll('.cfx-foil');
    for (var i = 0; i < fs.length; i++) {
      var el = fs[i].parentNode;
      if (el) { el.__cfxFoil = null; el.__cfxMode = null; el.classList.remove('cfx-hot'); ['--cfx-dur', '--cfx-dl', '--cfx-r', '--cfx-wd', '--cfx-rx', '--cfx-ry', '--cfx-mx', '--cfx-my'].forEach(function (p) { el.style.removeProperty(p); }); el.removeChild(fs[i]); }
    }
    hot = null;
  }
  function cool() { if (hot) { hot.classList.remove('cfx-hot'); hot = null; } }

  function set(m) {
    m = MODES.indexOf(m) >= 0 ? m : 'none';
    if (m === mode) return;
    mode = m;
    cool();
    clearInterval(timer); timer = 0;
    if (m === 'none') { clear(); return; }
    sync();
    timer = setInterval(sync, 700);
  }
  function read() { set(root.getAttribute('data-cfx') || 'none'); }

  // holo: the card under the pointer tilts toward it and its glare follows
  function tilt() {
    raf = 0;
    var e = pend; pend = null;
    if (!e || mode !== 'holo') return;
    var el = cardOf(e.t);
    if (!el || !inBoard(el)) { cool(); return; }
    if (el !== hot) { cool(); hot = el; el.classList.add('cfx-hot'); }
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var u = Math.min(1, Math.max(0, (e.x - r.left) / r.width)), v = Math.min(1, Math.max(0, (e.y - r.top) / r.height));
    // (a wide, short card needs less turn about its long axis to read the same)
    var kx = calm ? 0 : Math.min(9, 520 / r.width * 4), ky = calm ? 0 : 7;
    el.style.setProperty('--cfx-ry', ((u - 0.5) * 2 * kx).toFixed(2) + 'deg');
    el.style.setProperty('--cfx-rx', ((0.5 - v) * 2 * ky).toFixed(2) + 'deg');
    el.style.setProperty('--cfx-mx', (u * 100).toFixed(1) + '%');
    el.style.setProperty('--cfx-my', (v * 100).toFixed(1) + '%');
  }
  var onMove = function (e) {
    if (mode !== 'holo') return;
    pend = { t: e.target, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(tilt);
  };
  document.addEventListener('pointermove', onMove, { passive: true, capture: true });
  document.addEventListener('pointerdown', onMove, { passive: true, capture: true });
  ['pointerup', 'pointercancel'].forEach(function (n) {
    document.addEventListener(n, function (e) { if (mode === 'holo' && e.pointerType !== 'mouse') cool(); }, { passive: true, capture: true });
  });
  document.addEventListener('pointerleave', cool, true);

  // wave: a tap on a card sends a ring of lift out from it
  document.addEventListener('click', function (e) {
    if (mode !== 'wave' || calm) return;
    var from = cardOf(e.target);
    if (!from || !inBoard(from) || !from.animate) return;
    var fr = from.getBoundingClientRect(), fx = fr.left + fr.width / 2, fy = fr.top + fr.height / 2;
    var els = document.querySelectorAll(SEL), vh = window.innerHeight, vw = window.innerWidth;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      var d = Math.hypot(r.left + r.width / 2 - fx, r.top + r.height / 2 - fy), k = Math.max(0.25, 1 - d / 900);
      try {
        els[i].animate([
          { translate: '0 0', scale: '1' },
          { translate: '0 ' + (-8 * k).toFixed(1) + 'px', scale: (1 + 0.05 * k).toFixed(3), offset: 0.35 },
          { translate: '0 0', scale: '1' }
        ], { duration: 560, delay: d * 0.9, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } catch (err) {}
    }
  }, true);

  window.addEventListener('minest:cardfx', read);
  window.MinestCardFX = { set: set, sync: sync, get mode() { return mode; }, modes: MODES.slice() };
  read();
})();
