/* Pet Raising — Mini Pet sync (44.5)
   Octo in Pet Raising is the original; the Mini Pet on the board mirrors it:
   - appearance: the cosmetics state (skin, accessories) is sent on start and on every change
     (inside the app the two pages keep separate storage, so they drifted apart);
   - motion: what Octo does (gestures, spins, swimming, going home to sleep, care activities) is sent
     as it happens, so the Mini Pet does the same; the house state also tells it whether Octo is
     asleep, which the Mini Pet keeps showing after Pet Raising is closed. */
(function () {
  'use strict';
  if (window.__octoSync) return;
  window.__octoSync = true;
  if (!(window.parent && window.parent !== window)) return;
  function post(o) { try { window.parent.postMessage(Object.assign({ type: 'minest-pet-sync' }, o), '*'); } catch (e) {} }

  // appearance
  var lastLook = '';
  function sendLook() {
    var K = window.MinestCosmetics; if (!(K && K.getState)) return;
    var st = K.getState(), j = JSON.stringify(st);
    if (j === lastLook) return;          // only real changes (same-origin pages echo each other's saves)
    lastLook = j; post({ cosmetics: st });
  }
  (function waitK(n) {
    var K = window.MinestCosmetics;
    if (K && K.onChange) { sendLook(); K.onChange(sendLook); return; }
    if (n < 200) setTimeout(function () { waitK(n + 1); }, 100);
  })(0);

  // motion: wrap the avatar's motion entry points (after motion-v4 has wrapped them) and the spins
  var last = { id: '', t: 0 };
  function motion(id) {
    if (!id) return;
    var now = Date.now();
    if (id === last.id && now - last.t < 800) return;
    last = { id: id, t: now };
    post({ motion: String(id) });
  }
  (function waitA(n) {
    var av = window.__octopusAvatar, mo = window.__motionV4;
    if (!(av && av.importedModel && mo)) { if (n < 400) setTimeout(function () { waitA(n + 1); }, 150); return; }
    ['playReferenceMotion', 'playAction', 'playAnimation'].forEach(function (fn) {
      var orig = av[fn];
      if (typeof orig !== 'function' || orig.__sync) return;
      av[fn] = function (id) { var r = orig.apply(this, arguments); if (r !== false) motion(id); return r; };
      av[fn].__sync = true;
    });
    if (mo.spin && !mo.spin.__sync) {
      var sp = mo.spin;
      mo.spin = function (kind) { var r = sp.apply(this, arguments); if (r !== false) post({ spin: String(kind || 'pirouette') }); return r; };
      mo.spin.__sync = true;
    }
    post({ hello: true });
  })(0);

  // the badge Octo holds (e.g. one found in the treasure chest) → the Mini Pet holds the same one
  window.addEventListener('minest-latest-badge', function (e) { if (e.detail && e.detail.id) post({ latestBadge: e.detail }); });

  // house (asleep or not) and care activities
  var house = '', care = '';
  setInterval(function () {
    var H = window.__octoHouse, C = window.__octoCare;
    var h = H && H.state || 'roam', c = C && C.mode || '';
    if (h !== house) { house = h; post({ house: h }); }
    if (c !== care) { care = c; post({ care: c }); }
  }, 400);
})();
