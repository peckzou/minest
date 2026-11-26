/* Minest perf probe (tools/perf). Injected before any page script runs; read back window.__mnPerf.
   It measures, in the page's own clock:
     dcl / load       DOMContentLoaded and load, ms after navigation start
     dock             first moment after load with the board's Dock on screen and no start screen over it
     idle.*           a quiet window (no input) once the page has settled:
                        mutations   DOM mutation records in the window (a page at rest should barely change)
                        frames      animation frames painted, jank = frames that took > 50 ms, maxGap = the longest
                        busy        ms the main thread was blocked (> 50 ms gaps between 10 ms timer ticks)
   window.__mnPerfIdle(ms) starts the quiet window and resolves with the result. */
(function () {
  if (window.__mnPerf) return;
  var P = window.__mnPerf = { v: 1 };
  function now() { return Math.round(performance.now()); }
  document.addEventListener('DOMContentLoaded', function () { P.dcl = now(); }, { once: true });
  window.addEventListener('load', function () { P.load = now(); }, { once: true });
  (function dock() {
    var d = document.querySelector('.mn-bdock, #mn-sysbar, .mn-sysbar');
    if (P.load && d && d.getBoundingClientRect().height > 0 && !document.documentElement.classList.contains('mn-start-active')) { P.dock = now(); return; }   // after load: the start screen goes up during it
    if (now() < 120000) setTimeout(dock, 50);
  })();
  window.__mnPerfIdle = function (ms) {
    ms = ms || 10000;
    return new Promise(function (resolve) {
      var muts = 0, frames = 0, jank = 0, maxGap = 0, busy = 0, last = performance.now(), lastT = last, t0 = last, done = false;
      var mo = new MutationObserver(function (rs) { muts += rs.length; });
      mo.observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
      function raf(t) { if (done) return; frames++; var g = t - last; if (frames > 1) { if (g > 50) jank++; if (g > maxGap) maxGap = g; } last = t; requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      var tick = setInterval(function () { var t = performance.now(), g = t - lastT; if (g > 60) busy += g - 10; lastT = t; }, 10);
      setTimeout(function () {
        done = true; clearInterval(tick);
        setTimeout(function () {   // records batched to the next frame arrive late; take them
          mo.disconnect();
          P.idle = { ms: Math.round(performance.now() - t0), mutations: muts, frames: frames, jank: jank, maxGap: Math.round(maxGap), busy: Math.round(busy) };
          resolve(P.idle);
        }, 100);
      }, ms);
    });
  };
})();
