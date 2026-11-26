#!/usr/bin/env node
// Minest open-speed and jank check.  node tools/perf/run.mjs [--base http://127.0.0.1:3005] [--pages iphone.html,...] [--json out.json]
// Opens each page in WebKit (Safari's engine) at its own screen size, closes the start screen, lets the page settle,
// then watches 10 s with no input (tools/perf/probe.js). Fails when a number goes over tools/perf/budget.json.
// Needs: npm i -D playwright && npx playwright install --with-deps webkit   (CI does this; see .github/workflows/perf.yml)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const budget = JSON.parse(fs.readFileSync(path.join(HERE, 'budget.json'), 'utf8'));
const want = (arg('pages', '') || '').split(',').filter(Boolean);
const pages = budget.runtime.pages.filter(p => !want.length || want.includes(p.page));
const SETTLE = +arg('settle', budget.runtime.settleMs), IDLE = +arg('idle', budget.runtime.idleMs), RUNS = +arg('runs', budget.runtime.runs);

// a tiny static server, unless --base points at one
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
  const s = http.createServer((q, r) => {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, path.normalize(p));
    if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
    fs.stat(f, (e, st) => { if (e || !st.isFile()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'content-length': st.size }); fs.createReadStream(f).pipe(r); });
  });
  return new Promise(res => s.listen(0, '127.0.0.1', () => res({ s, base: 'http://127.0.0.1:' + s.address().port })));
}

const { webkit, devices } = await import('playwright');
const srv = arg('base') ? null : await serve();
const base = arg('base') || srv.base;
const probe = fs.readFileSync(path.join(HERE, 'probe.js'), 'utf8');
const browser = await webkit.launch();
const rows = [], fails = [];
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

for (const p of pages) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext(p.device ? { ...devices[p.device] } : { viewport: p.viewport, deviceScaleFactor: 1 });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());   // only the page itself: no network noise, no live services
    await ctx.addInitScript(probe);
    const pg = await ctx.newPage(); const errors = [];
    pg.on('pageerror', e => errors.push(String(e.message || e).slice(0, 160)));
    await pg.goto(base + '/' + p.page + (p.query || ''), { waitUntil: 'load', timeout: 120000 });
    // close the start screen the way a person would (the ✕ on the Dock); Duo has none
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      const st = await pg.evaluate(() => { const c = document.querySelector('.mn-bdock .mn-sk-close'); const on = document.documentElement.classList.contains('mn-start-active'); if (on && c) c.click(); return { on, dock: !!window.__mnPerf.dock }; });
      if (!st.on && st.dock) break; await pg.waitForTimeout(300);
    }
    await pg.waitForTimeout(SETTLE);
    const idle = await pg.evaluate(ms => window.__mnPerfIdle(ms), IDLE);
    const m = await pg.evaluate(() => window.__mnPerf);
    runs.push({ dcl: m.dcl, load: m.load, dock: m.dock, ...idle, errors: errors.length });
    await ctx.close();
  }
  const row = { page: p.page, size: p.device || (p.viewport.width + 'x' + p.viewport.height) };
  for (const k of ['dcl', 'load', 'dock', 'mutations', 'jank', 'maxGap', 'busy', 'frames', 'errors']) row[k] = median(runs.map(r => r[k]));
  rows.push(row);
  const lim = { ...budget.runtime.limits, ...(p.limits || {}) };
  for (const k of Object.keys(lim)) if (row[k] == null ? k === 'dock' : row[k] > lim[k]) fails.push(`${p.page}: ${k} ${row[k]} > ${lim[k]}`);
}
await browser.close(); if (srv) srv.s.close();

const cols = ['page', 'size', 'dcl', 'load', 'dock', 'mutations', 'jank', 'maxGap', 'busy', 'frames', 'errors'];
console.log('| ' + cols.join(' | ') + ' |\n|' + cols.map(() => '---').join('|') + '|');
for (const r of rows) console.log('| ' + cols.map(c => r[c] ?? '–').join(' | ') + ' |');
console.log(`\n(medians of ${RUNS} runs; times in ms after navigation; idle window ${IDLE} ms after ${SETTLE} ms to settle)`);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify({ rows, fails }, null, 2));
if (fails.length) { console.log('\nOver budget:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('\nAll pages within budget.');
