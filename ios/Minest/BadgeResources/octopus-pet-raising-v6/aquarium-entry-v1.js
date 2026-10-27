/* Pet Raising — 🐠 Duo Aquarium entry (V1). A button beside Pet Raising's own controls asks the Minest page around
   it to open the 3D aquarium (tools/live-perf/aquarium.js), where Octo lives in a tank that spans an iPhone Duo's two
   screens when the phone stands folded. Outside Minest (Pet Raising on its own) the button stays away. */
(function () {
  'use strict';
  if (window.__octoAquariumEntry || window.parent === window) return;
  window.__octoAquariumEntry = true;
  var tries = 0;
  (function mount() {
    var bar = document.querySelector('.utility-toggle-bar');
    if (!bar) { if (tries++ < 80) setTimeout(mount, 150); return; }
    if (bar.querySelector('[data-octo-aquarium]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-octo-aquarium', ''); b.title = 'Duo Aquarium'; b.setAttribute('aria-label', 'Duo Aquarium');
    b.textContent = '🐠'; b.style.cssText = 'font-size:20px;line-height:1;background:transparent;border:0;padding:6px 8px;cursor:pointer';
    b.addEventListener('click', function () { try { window.parent.postMessage({ type: 'minest-pet', action: 'aquarium' }, '*'); } catch (e) {} });
    bar.appendChild(b);
  })();
})();
