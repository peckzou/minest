// World Search 2.0 · 知识引擎 2.0 (world-search-2/engine2.js): the lexicon on top of 1.0's compass, confidence, the one search index,
// and that 1.0's own files are still what 2.0 expects to layer on.
// node tests/world-search-2/engine2.test.cjs  → "engine2: ok"
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const R = path.join(__dirname, '..', '..'), txt = p => fs.readFileSync(path.join(R, p), 'utf8'), rd = p => JSON.parse(txt(p));
const C = require(path.join(R, 'tools/compass/compass.js')), E = require(path.join(R, 'world-search-2/engine2.js')), PHIL = require(path.join(R, 'tools/toolkit/phil-models.js'));
const COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
const fws = COLS.flatMap(c => rd('tools/knowledge/frameworks/' + c + '.json').frameworks), ext = rd('tools/compass/frameworks-ext.json');
const fails = []; const check = (ok, msg) => { if (!ok) fails.push(msg); };
const at = (p, place) => !!p && (p === place || p.startsWith(place + '.'));

// ---------------------------------------------------------------- 1 · the lexicon: adds, never removes; twice is once
const tax1 = rd('tools/compass/taxonomy.json'), tax = E.extend(rd('tools/compass/taxonomy.json'));
check(tax.nodes.length === tax1.nodes.length + E.NODES.length, 'new places: ' + tax.nodes.length + ' ≠ ' + tax1.nodes.length + ' + ' + E.NODES.length);
tax1.nodes.forEach(n => { const m = tax.nodes.find(x => x.id === n.id); check(m && n.terms.every(t => m.terms.includes(t)) && m.parent === n.parent && m.name === n.name, 'a 1.0 place changed: ' + n.id); });
E.NODES.forEach(n => check(tax1.nodes.some(x => x.id === n.parent), 'new place ' + n.id + ' hangs on a place 1.0 does not have: ' + n.parent));
Object.keys(E.EXTRA).forEach(id => check(tax1.nodes.some(x => x.id === id), 'extra cues for a place 1.0 does not have: ' + id));
const n1 = tax.nodes.length, t1 = JSON.stringify(tax); E.extend(tax); check(tax.nodes.length === n1 && JSON.stringify(tax) === t1, 'extend() is not idempotent');

// ---------------------------------------------------------------- 2 · 1.0's classifier test set still lands where 1.0 expects it
C.load({ taxonomy: tax, ext, frameworks: fws });
const src = txt('tests/compass/compass.test.cjs'), a = src.indexOf('const SET = ['), b = src.indexOf('\n];', a);
assert(a > 0 && b > a, '1.0 test set not found in tests/compass/compass.test.cjs');
const SET = vm.runInNewContext('(' + src.slice(a + 'const SET = '.length, b + 2) + ')');
let kept = 0;
SET.forEach(([t, ty, place, fw]) => {
  const r = C.classify(t), p = r.primary ? r.primary.id : null, top2 = r.frameworks.slice(0, 2).map(f => f.framework_id), why = [];
  if (r.type.id !== ty) why.push('type ' + r.type.id + ' ≠ ' + ty);
  if (place !== null && !at(p, place)) why.push('place ' + p + ' ≠ ' + place);   // where 1.0 found no place, 2.0 may now find one
  if (fw && top2.indexOf(fw) < 0) why.push('frameworks ' + top2.join(',') + ' lack ' + fw);
  if (why.length) fails.push('1.0 set “' + t + '”: ' + why.join('; ')); else kept++;
});
console.log('1.0 test set under the 2.0 lexicon: ' + kept + '/' + SET.length);

// ---------------------------------------------------------------- 3 · what 2.0 places that 1.0 could not
const NEW = [['量子力学', 'nature.physics'], ['为什么天是蓝的', 'nature.physics'], ['黑洞里面有什么', 'nature.astronomy'], ['质数有无穷多个吗', 'nature.math'], ['人工智能会取代老师吗', 'systems.computing'],
  ['How do habits form?', 'psychology.motivation'], ['我想学会游泳', 'life.health'], ['知识', 'philosophy.epistemology'], ['时间是什么', 'philosophy.metaphysics'], ['What is machine learning?', 'systems.computing'],
  ['罗马帝国为什么衰落', 'society.history'], ['怎么存零花钱', 'life.money'], ['友谊是什么', 'psychology.relationships']];
NEW.forEach(([t, place]) => { const r = E.analyze(C, t); check(r.primary && at(r.primary.id, place), '“' + t + '”: ' + (r.primary ? r.primary.id : null) + ' ≠ ' + place); check(r.confidence > 0 && r.confidence < 100, '“' + t + '”: confidence ' + r.confidence); });
const none = E.analyze(C, '今天是星期一'); check(!none.primary && none.confidence === 0 && none.candidates.length === 0, 'no cues → no place, confidence 0');
const fr = E.analyze(C, '什么是自由？'); check(fr.candidates.length >= 2 && fr.candidates[0].id === fr.primary.id && Math.abs(fr.candidates.reduce((s, c) => s + c.share, 0) - 100) <= 2, 'candidates: primary first, shares add up');
check(E.analyze(C, '量子力学').confidence > E.analyze(C, '为什么天是蓝的').confidence, 'more cues → more confidence');
check(E.analyze(C, '量子力学').candidates[0].isNew === true && fr.candidates[0].isNew === false, 'candidates say which places are 2.0’s');

// ---------------------------------------------------------------- 4 · one search over everything the toolkit knows
const labs = ['tools/compass/micro/kant-causality.json', 'tools/toolkit/labs/locke-room.json', 'tools/toolkit/labs/plato-cave.json', 'tools/toolkit/labs/aristotle-causes.json', 'tools/toolkit/labs/hegel-concept.json'].map(rd);
const ix = E.buildIndex({ phil: PHIL, frameworks: C.frameworks(), templates: rd('tools/toolkit/data/templates.json').templates, models: rd('tools/toolkit/data/models.json').models, labs, nodes: C.nodes() });
const kinds = {}; ix.forEach(x => { kinds[x.kind] = (kinds[x.kind] || 0) + 1; });
check(kinds.phil === PHIL.length && kinds.place === tax.nodes.length && kinds.framework === C.frameworks().length && kinds.lab === 5 && kinds.model > 0 && kinds.template > 0, 'index kinds ' + JSON.stringify(kinds));
const find = (q, o) => E.search(ix, q, Object.assign({ analysis: E.analyze(C, q) }, o || {}));
const has = (hits, kind, id) => hits.some(h => h.kind === kind && h.id === id);
[['自由', 'phil', 'freewill'], ['自由', 'phil', 'mill_liberty'], ['什么是自由？', 'phil', 'freewill'], ['洞穴', 'phil', 'plato_cave'], ['kant', 'phil', 'kant_moral'], ['kant', 'framework', 'kant'], ['柏拉图', 'phil', 'plato_forms'],
  ['因果', 'phil', 'hume'], ['因果', 'model', 'causal-analysis'], ['因果', 'place', 'philosophy.epistemology.causation'], ['nietzche', 'phil', 'nietzsche'], ['platon', 'phil', 'plato_cave'], ['veil of ignorance', 'phil', 'rawls'],
  ['systems', 'model', 'systems-thinking'], ['物理', 'place', 'nature.physics'], ['正义', 'phil', 'rawls']].forEach(([q, kind, id]) => check(has(find(q), kind, id), 'search “' + q + '” lacks ' + kind + ':' + id));
check(find('自由')[0].how === 'title' && find('nietzche')[0].how === 'spelling', 'how a hit matched');
check(find('自由', { scope: 'phil' }).every(h => h.kind === 'phil') && find('自由', { scope: 'phil' }).length > find('自由').filter(h => h.kind === 'phil').length, 'a scope shows only its kind, and more of it');
check(find('').length === 0 && find('   ').length === 0 && find('zzzzqqqq').length === 0, 'nothing to find → nothing');
const fh = find('自由'); check(fh.every((h, i) => !i || fh[i - 1].score >= h.score), 'best first');
check(E.topic('什么是自由？') === '自由' && E.topic('What is justice?') === 'justice' && E.topic('自由') === null, 'topic()');

// ---------------------------------------------------------------- 5 · what 2.0 layers on is still there in 1.0
const omni = txt('tools/toolkit/omni.js'), host = txt('tools/toolkit/host.js'), tk = txt('tools/toolkit/toolkit.js'), built = txt('toolkit.html'), v2 = txt('world-search-2/v2.js');
['mo-root', 'mo-box', 'mo-bar', 'mo-in', 'mo-res', 'mo-cards', 'mo-frame', 'mo-open', 'has-panel'].forEach(c => check(omni.includes(c) && (v2.includes(c) || c === 'mo-bar' || c === 'mo-cards'), 'omni.js / v2.js no longer share .' + c));
check(/PAGE = 'toolkit\.html'/.test(omni) && omni.includes("'#embed=1&panel=1'"), 'omni.js opens toolkit.html next to the page (2.0’s own, in its folder)');
check(omni.includes('window.MinestOmni = {') && omni.includes('openCard:') && omni.includes("'.mn-phil'"), 'omni.js API (open, openCard, Esc leaves .mn-phil alone)');
check(host.includes('adopt:') && host.includes("'tk-' + m.action") && host.includes('window.SpatialHoloLab'), 'host.js adopts the frame and asks SpatialHoloLab for the star map');
check(tk.includes("m.type !== 'minest-toolkit-cmd'") || tk.includes('minest-toolkit-cmd'), 'toolkit.js listens for minest-toolkit-cmd');
check(tk.includes('window.__TK_DATA[u]') && built.includes('window.__TK_DATA = ') && built.includes('"../compass/taxonomy.json"'), 'the built 1.0 page carries its data as window.__TK_DATA (toolkit.html in 2.0 adds the lexicon there)');
check(PHIL.length >= 46 && PHIL.every(m => /^minest_[a-z_]+\.html$/.test(m.file) && fs.existsSync(path.join(R, 'philosophy/models', m.file))), 'every philosophy model page exists');
// 模型馆 2.0: every model has a year, every path step is a model
const mjs = txt('world-search-2/models/models.js'), years = vm.runInNewContext('(' + mjs.slice(mjs.indexOf('var YEAR = ') + 11, mjs.indexOf('};', mjs.indexOf('var YEAR = ')) + 1) + ')');
PHIL.forEach(m => check(typeof years[m.id] === 'number', '模型馆 2.0 has no year for ' + m.id));
(mjs.match(/ids: \[[^\]]+\]/g) || []).forEach(s => s.match(/'([a-z_]+)'/g).forEach(q => check(PHIL.some(m => "'" + m.id + "'" === q), '模型馆 2.0 path step is not a model: ' + q)));
check((mjs.match(/ids: \[/g) || []).length === 7, 'seven learning paths');

if (fails.length) { console.error('engine2: FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('engine2: ok (' + ix.length + ' things indexed, ' + E.NODES.length + ' new places)');
