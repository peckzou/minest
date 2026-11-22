/* Minest · World Search 2.0 — its own shelf in localStorage.
   2.0 knows places 1.0 does not (engine2.js), so what it saves must not land in 1.0's records: every 1.0 toolkit key is
   read and written under a 2.0 name here, in this frame only. The first time, 1.0's records are copied over (read only),
   so 2.0 starts with what you already made; after that the two go their own ways. 2.0 opens in Chinese. */
(function () {
  'use strict';
  if (window.__ws2Store) return; window.__ws2Store = true;
  var A = 'minest.lab.kw.', B = 'minest.ws2.kw.', ONE = { 'minest.toolkit.meta': 'minest.ws2.meta', 'minest.toolkit.lang': 'minest.ws2.lang', 'minest.toolkit.cloud': 'minest.ws2.cloud' };
  var P = Storage.prototype, g = P.getItem, s = P.setItem, rm = P.removeItem, key = P.key;
  function to(k) { k = String(k); return k.indexOf(A) === 0 ? B + k.slice(A.length) : ONE[k] || k; }
  try {
    if (!g.call(localStorage, 'minest.ws2.seeded')) {
      var copy = [];
      for (var i = 0; i < localStorage.length; i++) { var k = key.call(localStorage, i); if (k && (k.indexOf(A) === 0 || k === 'minest.toolkit.meta')) copy.push(k); }
      copy.forEach(function (k) { if (g.call(localStorage, to(k)) == null) s.call(localStorage, to(k), g.call(localStorage, k)); });
      if (g.call(localStorage, 'minest.ws2.lang') == null) s.call(localStorage, 'minest.ws2.lang', 'zh');
      s.call(localStorage, 'minest.ws2.seeded', '1');
    }
  } catch (e) {}
  P.getItem = function (k) { return g.call(this, to(k)); };
  P.setItem = function (k, v) { return s.call(this, to(k), v); };
  P.removeItem = function (k) { return rm.call(this, to(k)); };
  P.key = function (i) {   // 2.0's records answer to their 1.0 names; 1.0's own are out of sight
    var k = key.call(this, i); if (k == null) return k;
    if (k.indexOf(B) === 0) return A + k.slice(B.length);
    if (k.indexOf(A) === 0) return '\u0000' + k;
    return k;
  };
})();
