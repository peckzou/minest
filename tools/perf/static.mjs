#!/usr/bin/env node
// Minest static perf budget: no browser, a second or two.  node tools/perf/static.mjs [--update]
// Counts in each page what tends to make Minest slow to open or janky at rest, and fails when a change adds more
// than tools/perf/budget.json allows. --update writes today's counts as the new baseline (after a deliberate change).
//   bytes          the page file (every module is inlined, so this is what a phone downloads and parses first)
//   docObservers   MutationObservers on the whole document with subtree:true (each one wakes on every DOM change)
//   fastTimers     setInterval with a delay under 1 s (each keeps the page busy while it sits idle)
//   blockingHead   <script src> in <head> without async/defer (the page can't render until each one arrives)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BUDGET = path.join(HERE, 'budget.json');
const budget = JSON.parse(fs.readFileSync(BUDGET, 'utf8'));

export function measure(html) {
  const docObservers = (html.match(/\.observe\(\s*(?:document(?:\.documentElement|\.body)?|document\.querySelector\(['"](?:html|body)['"]\))\s*,\s*\{[^}]{0,200}?subtree\s*:\s*(?:true|!0)/g) || []).length;
  let fastTimers = 0;
  for (const m of html.matchAll(/setInterval\(/g)) {
    // find the delay: the last top-level argument of the call
    let i = m.index + 12, depth = 1, lastComma = -1;
    for (let n = 0; i < html.length && depth && n < 4000; i++, n++) {
      const c = html[i];
      if (c === '(' || c === '[' || c === '{') depth++; else if (c === ')' || c === ']' || c === '}') depth--; else if (c === ',' && depth === 1) lastComma = i;
    }
    if (lastComma < 0) continue;
    const d = html.slice(lastComma + 1, i - 1).trim();
    if (/^\d+(\.\d+)?$/.test(d) && +d < 1000) fastTimers++;
  }
  const head = html.slice(0, Math.max(0, html.search(/<\/head>/i)));
  const blockingHead = (head.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || []).filter(t => !/\b(async|defer)\b|type=["']module["']/i.test(t)).length;
  return { bytes: Buffer.byteLength(html), docObservers, fastTimers, blockingHead };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const update = process.argv.includes('--update'), fails = [], rows = [];
  for (const [file, base] of Object.entries(budget.static.pages)) {
    const now = measure(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    rows.push({ file, ...now });
    if (update) { budget.static.pages[file] = now; continue; }
    if (now.bytes > base.bytes * (1 + budget.static.bytesGrowth)) fails.push(`${file}: ${(now.bytes / 1048576).toFixed(2)} MB, more than ${Math.round(budget.static.bytesGrowth * 100)}% over ${(base.bytes / 1048576).toFixed(2)} MB`);
    for (const k of ['docObservers', 'fastTimers', 'blockingHead']) if (now[k] > base[k]) fails.push(`${file}: ${k} ${base[k]} → ${now[k]}`);
  }
  console.log('| page | MB | docObservers | fastTimers | blockingHead |\n|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.file} | ${(r.bytes / 1048576).toFixed(2)} | ${r.docObservers} | ${r.fastTimers} | ${r.blockingHead} |`);
  if (update) { fs.writeFileSync(BUDGET, JSON.stringify(budget, null, 2) + '\n'); console.log('\nbaseline updated'); }
  else if (fails.length) { console.log('\nOver budget (if a change is deliberate, run with --update and say why in the PR):\n- ' + fails.join('\n- ')); process.exit(1); }
  else console.log('\nAll pages within the static budget.');
}
