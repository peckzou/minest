/* Minest polish · My World + Spatial Home (tools/polish/patch_myworld_home.py)
   My World: a mini pet that was never dragged rests on an island (Philosophers' Island on a phone) and takes its taps.
   While My World is open it moves to the free spot that covers the fewest islands and keys, and goes back after. */
(function () {
  'use strict';
  if (window.__mnPolishMW) return; window.__mnPolishMW = 1;
  var MO = MutationObserver.Native || MutationObserver;
  var HIT = { l: .2, t: .12, r: .2, b: .26 };   // the octopus inside its square (same as polish.css .mn-pet-hit)
  function dragged() { try { return !!localStorage.getItem('minest.miniPetP0.position'); } catch (e) { return true; } }
  function targets(uv) {
    var out = [], els = uv.querySelectorAll('button, a[href], [role=button], input, select');
    for (var i = 0; i < els.length; i++) { var r = els[i].getBoundingClientRect(); if (r.width > 4 && r.height > 4) out.push(r); }
    var d = document.querySelector('.mn-bdock'); if (d) out.push(d.getBoundingClientRect());
    return out;
  }
  function cost(x, y, w, h, rs) {
    var L = x + w * HIT.l, T = y + h * HIT.t, R = x + w * (1 - HIT.r), B = y + h * (1 - HIT.b), s = 0;
    if (L < 0 || T < 0 || R > innerWidth || B > innerHeight) return 1e9;
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i], ox = Math.min(R, r.right) - Math.max(L, r.left), oy = Math.min(B, r.bottom) - Math.max(T, r.top);
      if (ox > 0 && oy > 0) s += ox * oy;
    }
    return s;
  }
  function park() {
    var pet = document.getElementById('minest-mini-pet-p0');
    if (!pet || window.__miniPetHost) return;
    var uv = document.querySelector('body > .uv'), mine = pet.hasAttribute('data-mn-park');
    if (!uv || dragged() || pet.hasAttribute('data-mn70-park')) {
      if (mine) { pet.removeAttribute('data-mn-park'); if (!dragged()) { pet.style.left = '14px'; pet.style.top = '88px'; } }
      return;
    }
    var w = pet.offsetWidth || 152, h = pet.offsetHeight || 152, rs = targets(uv), W = innerWidth, H = innerHeight;
    var spots = [[14, 88], [W - w - 6, 88], [-24, H * .5 - h / 2], [W - w + 24, H * .5 - h / 2], [-24, H - h - 70], [W - w + 24, H - h - 70], [-24, 120], [W - w + 24, 120]];
    var best = null, bc = 1e9, here = cost(pet.offsetLeft, pet.offsetTop, w, h, rs);
    for (var i = 0; i < spots.length; i++) { var c = cost(spots[i][0], spots[i][1], w, h, rs); if (c < bc - 1) { bc = c; best = spots[i]; } }
    if (!best || bc >= here) return;
    pet.setAttribute('data-mn-park', '');
    pet.style.left = Math.round(best[0]) + 'px'; pet.style.top = Math.round(best[1]) + 'px';
  }
  var tm = [];
  function soon() { tm.forEach(clearTimeout); tm = [450, 1400, 3500].map(function (ms) { return setTimeout(park, ms); }); }   // the islands come in over a few seconds
  function boot() { new MO(soon).observe(document.body, { childList: true }); addEventListener('resize', soon, { passive: true }); soon(); }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
