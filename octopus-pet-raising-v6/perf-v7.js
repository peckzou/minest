/* Pet Raising V6 — smoothness patch (43.5).
   Measured on the live page: of 74 CSS animations, three repainted or re-laid-out the page on
   every frame (background-position, margin-top, box-shadow), and ~40 moving elements carried
   CSS filters without their own compositing layer, so iOS re-rasterised the filters as they moved.
   This keeps the same look with compositor-only motion, and draws the 3D octopus at 1.5×
   instead of 2× pixel density (≈44% fewer pixels; invisible on a soft plush character). */
(function () {
  'use strict';
  var css = [
    // whole-screen background drift: was background-position (full repaint each frame)
    '.ocean-backdrop{animation-name:ocean-drift-t!important;will-change:transform;transform-origin:50% 40%}',
    '@keyframes ocean-drift-t{0%{transform:scale(1.04) translate(0,0)}100%{transform:scale(1.04) translate(-1%,.8%)}}',
    // jellyfish bob: was margin-top (layout each frame)
    '@keyframes jelly-drift{0%{translate:0 9px;rotate:-4deg}100%{translate:0 -12px;rotate:5deg}}',
    // feeding spots: was an animated box-shadow (repaint each frame) — keep the pulse, steady glow
    '.ocean-v2-feeding-spot{box-shadow:0 0 10px rgba(255,224,155,.18)}',
    '@keyframes ocean-v2-feeding-pulse{0%,100%{transform:scale(.8);opacity:.75}50%{transform:scale(1.1);opacity:1}}',
    // moving sea life with filters: one compositing layer each, so the filter is drawn once
    '[class*="fish"],[class*="jelly"],[class*="coral"],[class*="seaweed"],[class*="garden"],[class*="branch"],[class*="ray"],' +
      '.sea-turtle,.crab,[class*="ocean-v2-current"],[class*="plankton"],[class*="mist"],[class*="bubble"]{will-change:transform}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'pet-perf-v7'; st.textContent = css;
  // must come after the page's own styles (ocean-living-world-v2.js injects its keyframes late)
  var place = function () { (document.body || document.head || document.documentElement).appendChild(st); };
  place();
  window.addEventListener('load', function () { place(); setTimeout(place, 1500); setTimeout(place, 4000); });

  // 3D octopus at ≤1.5× pixel density (the page asks for up to 2×, also on every resize)
  var MAX_PR = 1.5;
  function patchRenderer() {
    var av = window.__octopusAvatar, r = av && av.renderer;
    if (!r) return false;
    if (r.__minestPrPatched) return true;
    var orig = r.setPixelRatio.bind(r);
    r.setPixelRatio = function (v) { return orig(Math.min(v || 1, MAX_PR)); };
    r.__minestPrPatched = true;
    if (r.getPixelRatio() > MAX_PR) {
      var c = r.domElement;
      r.setPixelRatio(window.devicePixelRatio || 1);
      r.setSize(c.clientWidth || window.innerWidth, c.clientHeight || window.innerHeight, false);
    }
    return true;
  }
  (function wait(n) { if (!patchRenderer() && n < 200) setTimeout(function () { wait(n + 1); }, 100); })(0);
})();
