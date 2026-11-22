// Thought Compass lab: classifier test set, shared-protocol integrity, micro-interaction state machine, corrections.
// node tests/compass/compass.test.cjs  → "compass: ok"
const fs = require('fs'), path = require('path'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), rd = p => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const C = require(path.join(R, 'tools/compass/compass.js')), M = require(path.join(R, 'tools/compass/micro.js'));
const mem = {}; const store = { get: k => mem[k] ? JSON.parse(mem[k]) : null, set: (k, v) => { if (v == null) delete mem[k]; else mem[k] = JSON.stringify(v); }, keys: p => Object.keys(mem).filter(k => k.startsWith(p)) };
const COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
const fws = COLS.flatMap(c => rd('tools/knowledge/frameworks/' + c + '.json').frameworks);
const tax = rd('tools/compass/taxonomy.json'), ext = rd('tools/compass/frameworks-ext.json'), kant = rd('tools/compass/micro/kant-causality.json');
C.load({ taxonomy: tax, ext, frameworks: fws, store });
let fails = [];

// ---------------------------------------------------------------- 1 · classifier test set
// [input, expected input type, expected primary place (prefix ok), framework expected in the top 2 (or null)]
const SET = [
  ['为什么两个事件先后发生，并不一定意味着存在因果关系？', 'question', 'philosophy.epistemology.causation', 'kant'],
  ['Why does one event happening after another not mean it was caused by it?', 'question', 'philosophy.epistemology.causation', 'causal-inference'],
  ['Ice cream sales and drownings rise together', 'statement', 'nature.method.causal-inference', 'causal-inference'],
  ['冰淇淋销量和溺水人数一起上升', 'statement', 'nature.method.causal-inference', 'causal-inference'],
  ['因果', 'concept', 'philosophy.epistemology.causation', 'causal-inference'],
  ['康德', 'concept', 'philosophy.epistemology', 'kant'],
  ['What is the essence of the universe?', 'question', 'philosophy.metaphysics', null],
  ['宇宙的本质是什么', 'question', 'philosophy.metaphysics', null],
  ['我觉得人应该诚实', 'opinion', 'philosophy.ethics', null],
  ['Is lying always wrong?', 'question', 'philosophy.ethics', null],
  ['我想学会控制自己的情绪', 'goal', 'psychology.emotion', 'stoicism'],
  ['I want to learn to control my emotions', 'goal', 'psychology.emotion', 'stoicism'],
  ['什么是元素周期表', 'question', 'nature.chemistry', 'periodic-table'],
  ['怎么整理我的笔记', 'question', 'life.notes', 'para'],
  ['为什么我总是拖延', 'question', 'life.productivity', 'gtd'],
  ['How do I know my memory is true?', 'question', 'philosophy.epistemology', 'kant'],
  ['如果世界上没有时间会怎样', 'hypothesis', 'philosophy.metaphysics', null],
  ['马斯洛需求层次', 'concept', 'psychology.motivation', 'maslow'],
  ['恐龙化石是怎么形成的？', 'question', 'nature.earth', 'geologic-time'],
  ['我想设计一个更好用的书包', 'goal', 'systems.design', 'design-thinking'],
  ['柏拉图的洞穴比喻', 'concept', 'philosophy', 'plato'],
  ['人生的意义是什么？', 'question', 'philosophy.life', null],
  ['这个城市的交通总是恶性循环', 'statement', 'systems.systems', 'general-systems'],
  ['怎么做决定才不会后悔', 'question', 'systems.decision', 'ooda'],
  ['图书馆的书是怎么分类的？', 'question', 'knowledge.classification', 'dewey'],
  ['spinoza', 'concept', 'philosophy', 'spinoza'],
  ['斯多葛主义教我们只关心能控制的事', 'statement', 'philosophy.life', 'stoicism'],
  ['A happened, so B must be because of A', 'statement', 'philosophy.epistemology.causation', null],
  ['老子说无为', 'concept', 'philosophy.life', 'taoist-life'],
  ['asdfgh', 'concept', null, null]
];
SET.forEach(([t, ty, place, fw]) => {
  const r = C.classify(t), p = r.primary ? r.primary.id : null, top2 = r.frameworks.slice(0, 2).map(f => f.framework_id), why = [];
  if (r.type.id !== ty) why.push('type ' + r.type.id + ' ≠ ' + ty);
  if (place === null ? p !== null : !(p && (p === place || p.startsWith(place + '.')))) why.push('place ' + p + ' ≠ ' + place);
  if (fw && top2.indexOf(fw) < 0) why.push('frameworks ' + top2.join(',') + ' lack ' + fw);
  if (!r.reasons.length) why.push('no reasons');
  if (why.length) fails.push('“' + t + '”: ' + why.join('; '));
});
const ok = SET.length - fails.length;
console.log('classifier: ' + ok + '/' + SET.length);
fails.forEach(f => console.log('  ✗ ' + f));
assert(ok / SET.length >= 0.9, 'classifier accuracy below 90%');
// the core case must be exact
const core = C.classify('为什么两个事件先后发生，并不一定意味着存在因果关系？');
assert.strictEqual(core.primary.id, 'philosophy.epistemology.causation');
assert(core.related.some(x => x.id === 'nature.method.causal-inference'), 'core case lacks the causal-inference link');
assert(core.interactions.some(i => i.interaction_id === 'kant-causality'), 'core case does not offer the Kant interaction');
assert(C.classify('asdfgh').uncertain, 'nonsense must be uncertain');

// ---------------------------------------------------------------- 2 · shared protocol
const MICRO = new Set(['tools/compass/micro', 'tools/toolkit/labs'].flatMap(d => fs.existsSync(path.join(R, d)) ? fs.readdirSync(path.join(R, d)).filter(f => f.endsWith('.json')).map(f => rd(d + '/' + f).interaction_id) : []));
const nodeIds = new Set(tax.nodes.map(n => n.id)), fwIds = new Set(fws.map(f => f.id).concat(Object.keys(ext.frameworks).filter(k => ext.frameworks[k].labOnly)));
tax.nodes.forEach(n => { assert(!n.parent || nodeIds.has(n.parent), 'bad parent ' + n.id); (n.see_also || []).forEach(s => assert(nodeIds.has(s), 'bad see_also ' + s)); });
Object.entries(ext.frameworks).forEach(([id, x]) => {
  assert(fwIds.has(id), 'sidecar names unknown framework ' + id);
  (x.taxonomy_path || []).forEach(p => assert(nodeIds.has(p), id + ': unknown taxonomy node ' + p));
  (x.interaction_ids || []).forEach(i => assert(MICRO.has(i), id + ': unknown interaction ' + i));
});
fws.forEach(f => assert(ext.frameworks[f.id], 'no sidecar entry for ' + f.id));
const schema = rd('tools/compass/schema/minest.micro.schema.json');
schema.required.forEach(k => assert(k in kant, 'kant-causality lacks ' + k));
assert(fwIds.has(kant.framework_id));
assert(fws.find(f => f.id === 'kant').concepts.some(c => c.id === kant.concept_id), 'concept_id not in the kant framework');
const stepIds = kant.steps.map(s => s.id);
stepIds.forEach(s => assert(kant.completion_criteria[s], 'no completion criterion for ' + s));
const actIds = new Set(kant.user_actions.map(a => a.id));
kant.state_transitions.forEach(t => { assert(actIds.has(t.on), 'transition on unknown action ' + t.on); assert(t.from === '*' || stepIds.includes(t.from), 'transition from unknown step ' + t.from); });
kant.feedback_rules.forEach(r => assert(stepIds.includes(r.step)));
assert(/does not prove/.test(kant.disclaimer), 'disclaimer missing');

// ---------------------------------------------------------------- 3 · micro state machine (headless run)
M.register(kant);
const s = M.session(kant, { query_id: 'q1' });
assert.strictEqual(s.dispatch('next'), false, 'Next must be gated before 3 rounds');
s.dispatch('cycle'); s.dispatch('cycle'); s.dispatch('cycle'); assert(s.dispatch('next'));
assert.strictEqual(s.dispatch('press-a'), false, 'actions only work in their step');
s.dispatch('judge', 'yes'); assert.strictEqual(s.state.judge1, 'yes'); s.dispatch('next');
s.dispatch('press-a'); assert.strictEqual(s.feedback()[0].say.indexOf('intervention') > 0, true);
s.dispatch('open-curtain'); s.dispatch('stop-timer'); assert(s.state.stopped); s.dispatch('start-timer'); assert(!s.state.stopped);
assert.strictEqual(s.canNext(), false);
s.dispatch('house-order', ['door', 'roof', 'window']); s.dispatch('ship-wrong'); s.dispatch('ship-ok');
assert.deepStrictEqual(s.state.houseLast, ['door', 'roof', 'window']); assert(s.dispatch('next'));
s.dispatch('judge', 'no'); assert.strictEqual(s.feedback().length, 2, 'changed mind + correct answer'); s.dispatch('next');
assert.strictEqual(s.dispatch('next'), false); s.dispatch('flip'); s.dispatch('flip'); s.dispatch('flip'); s.dispatch('next');
s.dispatch('apply', { a: 'coffee', b: 'score up', checks: ['common-cause'], verdict: 'correlated', note: '' }); s.dispatch('next');
s.dispatch('note', { note: 'n', question: 'q' });
assert(s.dispatch('back') && s.state.step === 'apply' && s.dispatch('next'));
const rec = M.save(store, s);
assert(rec.completed && rec.changedMind && rec.query_id === 'q1' && rec.probes.shipWrong === 1);
assert.strictEqual(store.get('mi:run:' + rec.id).interaction_id, 'kant-causality');
const rel = store.get('rel:' + rec.apply.relation_id);
assert(rel.userJudgment && rel.type === 'related' && rel.a.title === 'coffee');
Object.keys(kant.result_schema).forEach(k => assert(k === 'log' || k in rec || k === 'id', 'result lacks ' + k));

// ---------------------------------------------------------------- 4 · corrections are remembered
const r1 = C.classify('喝咖啡之后我的成绩变好了'), q = C.saveQuery(r1);
C.confirm(q.id, { node: 'nature.method.causal-inference', framework: 'causal-inference' });
assert.strictEqual(C.fixes().length, 1);
const r2 = C.classify('吃早饭之后我的成绩变好了');
assert.strictEqual(r2.primary.id, 'nature.method.causal-inference', 'a correction should steer a similar input');
assert(r2.reasons.some(x => /before$/.test(x)), 'the reason should mention the earlier correction');
const q2 = C.saveQuery(C.classify('吃早饭之后我的成绩变好了')); assert.strictEqual(C.queries().filter(x => x.text === q2.text).length, 1, 'repeat input reuses the record');

// ---------------------------------------------------------------- 5 · the lab never touches the Golden Framework Library
assert(!/fs\.write|localStorage\.setItem\('minest\.knowledge/.test(fs.readFileSync(path.join(R, 'tools/compass/lab.js'), 'utf8')));
console.log('compass: ok');
