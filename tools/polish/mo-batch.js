/* Minest polish · MutationObserver batching (tools/polish/mo-batch.js) — first script in <head>.
   About sixty of the app's layers each watch the whole document (subtree of <body> / <html>) and re-scan it on every
   change. While the page loads, and on every tap that changes the DOM, each change woke all of them at once, and
   what they changed woke them again: the main thread was busy for seconds and frames were dropped.
   Here an observer of the whole document gets its records once per frame (before that frame is painted, or within
   100 ms when no frames are drawn), all records of that frame together. Observers of a single element are not
   touched: they still run at once. disconnect() and takeRecords() keep their meaning. */
(function () {
  'use strict';
  var MO = window.MutationObserver;
  if (!MO || MO.__mnBatched) return;
  var pending = [], scheduled = 0;
  function flush() {
    if (!scheduled) return;
    scheduled = 0;
    var list = pending; pending = [];
    for (var i = 0; i < list.length; i++) {
      var w = list[i]; w.waiting = false;
      var recs = w.q; w.q = [];
      if (!recs.length || !w.on) continue;
      try { w.cb.call(w.self, recs, w.self); } catch (e) { setTimeout(function () { throw e; }); }
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = 1;
    requestAnimationFrame(flush);
    setTimeout(flush, 100);
  }
  function whole(t) { return t === document || t === document.documentElement || t === document.body; }
  function Batched(cb) {
    if (!new.target) throw new TypeError("Failed to construct 'MutationObserver': Please use the 'new' operator.");
    var self = this, w = { cb: cb, q: [], self: self, on: false, batch: false, waiting: false };
    this.__w = w;
    this.__mo = new MO(function (recs) {
      if (!w.batch) { cb.call(self, recs, self); return; }
      for (var i = 0; i < recs.length; i++) w.q.push(recs[i]);
      if (!w.waiting) { w.waiting = true; pending.push(w); }
      schedule();
    });
  }
  Batched.prototype.observe = function (target, opts) {
    var w = this.__w;
    w.on = true;
    if (opts && opts.subtree && whole(target)) w.batch = true;
    return this.__mo.observe(target, opts);
  };
  Batched.prototype.disconnect = function () { var w = this.__w; w.on = false; w.batch = false; w.q = []; return this.__mo.disconnect(); };
  Batched.prototype.takeRecords = function () { var w = this.__w, r = w.q.concat(this.__mo.takeRecords()); w.q = []; return r; };
  Batched.__mnBatched = true;
  Batched.Native = MO;
  try { Object.defineProperty(Batched, Symbol.hasInstance, { value: function (o) { return o instanceof MO || (!!o && !!o.__w && !!o.__mo); } }); } catch (e) {}
  window.MutationObserver = Batched;
  if (window.WebKitMutationObserver) window.WebKitMutationObserver = Batched;
})();
