/* Minest load trace (tools/perf/run.mjs --trace). Injected before any page script runs; read back window.__mnTrace.
   It answers "what does the load event wait on":
     long      callbacks (timers, frames, observers, events) that ran over 40 ms, with when and which function
     gaps      stretches over 100 ms where a 10 ms timer could not run (main thread blocked, by anything)
     pending   at DOMContentLoaded and every 2 s until load: images not yet complete, iframes, fonts still loading */
(function () {
  if (window.__mnTrace) return;
  var T = window.__mnTrace = { long: [], gaps: [], pending: [], rs: [] };
  function now() { return Math.round(performance.now()); }
  function key(fn, kind) { var s = ''; try { s = (fn && fn.name || '') + '|' + String(fn).replace(/\s+/g, ' ').slice(0, 100); } catch (e) {} return kind + ' ' + s; }
  function wrap(fn, kind) {
    if (typeof fn !== 'function') return fn;
    return function () { var t = performance.now(); try { return fn.apply(this, arguments); } finally { var d = performance.now() - t; if (d > 40 && t < 60000 && T.long.length < 400) T.long.push([Math.round(t), Math.round(d), key(fn, kind)]); } };
  }
  var rAF = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = function (cb) { return rAF(wrap(cb, 'raf')); };
  var sT = window.setTimeout; window.setTimeout = function (cb, ms) { var a = [].slice.call(arguments); a[0] = wrap(cb, 'timeout' + (ms | 0)); return sT.apply(window, a); };
  var sI = window.setInterval; window.setInterval = function (cb, ms) { var a = [].slice.call(arguments); a[0] = wrap(cb, 'interval' + (ms | 0)); return sI.apply(window, a); };
  var MO = window.MutationObserver; window.MutationObserver = function (cb) { return new MO(wrap(cb, 'mutobs')); }; window.MutationObserver.prototype = MO.prototype;
  var aEL = EventTarget.prototype.addEventListener, rEL = EventTarget.prototype.removeEventListener, map = new WeakMap();
  EventTarget.prototype.addEventListener = function (type, fn, o) { if (typeof fn === 'function') { var w = map.get(fn); if (!w) { w = wrap(fn, 'ev:' + type); map.set(fn, w); } return aEL.call(this, type, w, o); } return aEL.call(this, type, fn, o); };
  EventTarget.prototype.removeEventListener = function (type, fn, o) { return rEL.call(this, type, (fn && map.get(fn)) || fn, o); };
  var last = performance.now();
  (function tick() { var t = performance.now(); if (t - last > 100 && T.gaps.length < 200) T.gaps.push([Math.round(last), Math.round(t - last), document.readyState]); last = t; if (t < 60000) sT(tick, 10); })();
  function pend(tag) {
    var imgs = [].slice.call(document.images || []).filter(function (i) { return !i.complete; }).map(function (i) { return (i.currentSrc || i.src || '').replace(location.origin, '').slice(0, 80); });
    var ifr = [].slice.call(document.querySelectorAll('iframe')).map(function (f) { return (f.getAttribute('src') || '(no src)').slice(0, 80); });
    T.pending.push({ at: now(), tag: tag, imgs: imgs.length, img: imgs.slice(0, 5), iframes: ifr, fonts: document.fonts ? document.fonts.status : '' });
  }
  document.addEventListener('readystatechange', function () { T.rs.push(document.readyState + '@' + now()); });
  document.addEventListener('DOMContentLoaded', function () {
    pend('dcl');
    (function again() { if (document.readyState === 'complete') return; sT(function () { if (document.readyState !== 'complete') { pend('+2s'); again(); } }, 2000); })();
  }, { once: true });
})();
