/* Minest · 2.0 bridge — the 2.0 page's side (cards-2/, dynamic-2/, ec6-board-2/).
   When Minest opens a 2.0 page in its own frame (tools/v2-routes/v2-routes.js), the page asks Minest for its data instead
   of reading this site's storage, and hands its changes back. That works on the web and in the app alike: in the app
   Minest runs from the app's own files and the 2.0 page from the web site, so they share no storage at all.
     MinestV2Bridge.embedded           true inside Minest's frame
     MinestV2Bridge.hello()            Promise → { boards, active, ls: { key: value } } from Minest, or null (not inside Minest)
     MinestV2Bridge.send(op, data)     a change for Minest: patchCard {id, patch} · rateCard {id, m} · setBoard {board} · ls {key, value}
     MinestV2Bridge.close(o)           Minest closes the page ({ openCard: id } opens that card after)
   Opened on its own, nothing here does anything. */
(function () {
  'use strict';
  if (window.MinestV2Bridge) return;
  var P = window.parent, framed = !!P && P !== window, seq = 0, wait = {}, helloP = null, live = false;
  function post(m) { try { P.postMessage(Object.assign({ type: 'minest-v2' }, m), '*'); } catch (e) {} }   // Minest in the app is a file: page (origin "null")
  window.addEventListener('message', function (e) {
    var m = e.data; if (e.source !== P || !m || m.type !== 'minest-v2' || !m.re) return;
    var f = wait[m.re]; if (f) { delete wait[m.re]; f(m.data); }
  });
  function ask(op, data, ms) {
    return new Promise(function (res) {
      if (!framed) { res(null); return; }
      var id = 'q' + (++seq); wait[id] = res; post({ op: op, id: id, data: data });
      setTimeout(function () { if (wait[id]) { delete wait[id]; res(null); } }, ms || 3000);
    });
  }
  var B = window.MinestV2Bridge = {
    embedded: framed,
    hello: function () {
      return helloP || (helloP = ask('hello', { page: location.pathname }, 4000).then(function (r) { live = !!r; B.embedded = live; return r; }));
    },
    send: function (op, data) { if (live) post({ op: op, data: data }); },
    close: function (o) { if (live) post({ op: 'close', data: o || {} }); return live; },
    live: function () { return live; }
  };
})();
