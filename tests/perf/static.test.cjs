// node tests/perf/static.test.cjs → perf-static: ok
'use strict';
const assert = require('assert'), path = require('path'), cp = require('child_process');
(async () => {
  const { measure } = await import(path.join(__dirname, '..', '..', 'tools', 'perf', 'static.mjs'));
  const m = measure(`<html><head><script src="a.js"></script><script src="b.js" defer></script></head><body><script>
    new MutationObserver(f).observe(document.documentElement, { childList: true, subtree: true });
    new MutationObserver(f).observe(document.body, { attributes: true });
    new MutationObserver(f).observe(el, { childList: true, subtree: true });
    setInterval(function () { a(1, 2); }, 250); setInterval(tick, 4000); setInterval(() => go([1, 2]), 16); setInterval(f, d);
  </script></body></html>`);
  assert.deepStrictEqual([m.docObservers, m.fastTimers, m.blockingHead], [1, 2, 1]);
  cp.execFileSync('node', [path.join(__dirname, '..', '..', 'tools', 'perf', 'static.mjs')], { stdio: 'pipe' });   // today's pages are within budget
  console.log('perf-static: ok');
})().catch(e => { console.error(e); process.exit(1); });
