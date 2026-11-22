// Cognitive Toolkit: shared store, data integrity, framework ↔ store sync, model loops, the Locked Room, export/import.
// node tests/toolkit/toolkit.test.cjs → "toolkit: ok"
const fs = require('fs'), path = require('path'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), rd = p => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
function backend() { const m = {}; return { get: k => m[k] ? JSON.parse(m[k]) : null, set: (k, v) => { if (v == null) delete m[k]; else m[k] = JSON.stringify(v); }, keys: p => Object.keys(m).filter(k => k.startsWith(p)), _m: m }; }
const KS = require(path.join(R, 'tools/toolkit/store.js'));
const C = require(path.join(R, 'tools/compass/compass.js'));
const M = require(path.join(R, 'tools/compass/micro.js'));
const COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
const fws = COLS.flatMap(c => rd('tools/knowledge/frameworks/' + c + '.json').frameworks);
const tax = rd('tools/compass/taxonomy.json'), ext = rd('tools/compass/frameworks-ext.json');
const T = rd('tools/toolkit/data/templates.json').templates, S = rd('tools/toolkit/data/seeds.json').seeds, MD = rd('tools/toolkit/data/models.json');
const locke = rd('tools/toolkit/labs/locke-room.json'), kant = rd('tools/compass/micro/kant-causality.json');
const LABS = [kant].concat(fs.readdirSync(path.join(R, 'tools/toolkit/labs')).filter(f => f.endsWith('.json')).map(f => rd('tools/toolkit/labs/' + f)));

// ---------------------------------------------------------------- 1 · store
let b = backend(), ks = KS.create(b), events = [];
ks.on(e => events.push(e.kind));
const ko = ks.createObject('What is freedom?', { topic: { en: 'Freedom', zh: '自由' }, topicProvenance: 'library' });
assert(ko.root_concept && ko.concept_ids.includes(ko.root_concept));
assert.strictEqual(ks.concept('自由'), ko.root_concept, 'Chinese label finds the same concept');
assert.strictEqual(ks.concept('  freedom '), ko.root_concept, 'labels match case- and space-insensitively');
const a = ks.concept('Autonomy'), k1 = ks.concept('Immanuel Kant', { kind: 'philosopher' });
assert.strictEqual(ks.concept('autonomy'), a, 'no duplicate concept');
const r1 = ks.relate('cc:' + k1, 'cc:' + a, 'influences', { ko: ko.id });
const r2 = ks.relate('cc:' + k1, 'cc:' + a, 'influences', { ko: ko.id, note: 'again' });
assert.strictEqual(r1.id, r2.id, 'same relation is updated, not duplicated');
const r3 = ks.relate('cc:' + ko.root_concept, 'cc:' + a, 'contains', { ko: ko.id });
assert(r3.type === 'belongs-to' && r3.from === 'cc:' + a, '“contains” is stored as the inverse of belongs-to');
assert.throws(() => ks.relate('cc:' + a, 'cc:' + k1, 'kind-of-related'), /Unknown relation/);
assert.strictEqual(ks.REL.length, 8);
assert(events.includes('kr') && events.includes('cc'), 'writes emit change events');

// ---------------------------------------------------------------- 2 · data integrity
const relIds = new Set(ks.REL.map(r => r.id));
const tplIds = new Set(T.map(t => t.id));
T.forEach(t => { assert(t.scope && t.caution, t.id + ' needs scope + caution'); t.sections.forEach(s => { assert(s.kind === 'text' || relIds.has(s.rel), t.id + '/' + s.key + ' rel'); assert(['item-root', 'root-item'].includes(s.dir)); }); });
['concept-analysis', 'problem-analysis', 'aristotle-four-causes', 'socratic-definition', 'kant-epistemic', 'hegel-development', 'systems'].forEach(id => assert(tplIds.has(id), 'template ' + id));
assert(/thesis–antithesis–synthesis/.test(T.find(t => t.id === 'hegel-development').caution), 'Hegel template warns against the triad');
assert(/not four modern physical forces/.test(T.find(t => t.id === 'aristotle-four-causes').caution));
S.forEach(sd => {
  assert(tplIds.has(sd.template));
  const t = T.find(x => x.id === sd.template), keys = new Set(t.sections.map(s => s.key));
  Object.keys(sd.fill).forEach(k => assert(keys.has(k), sd.id + ' fills unknown section ' + k));
  const labels = new Set(Object.values(sd.fill).flat().map(f => typeof f === 'string' ? f : f.en));
  (sd.relations || []).forEach(r => { assert(labels.has(r[0]) && labels.has(r[2]), sd.id + ' relation ' + r.join(' ')); assert(relIds.has(r[1])); });
  assert.strictEqual(sd.review, 'pending');
});
const INPUTS = new Set(['text', 'list', 'multi', 'choice', 'links', 'matrix', 'cases']), angles = new Set(MD.angles.map(x => x.id));
MD.models.forEach(m => {
  assert(m.principle && m.limits && m.steps.length && angles.has(m.angle), m.id);
  const ids = new Set(m.steps.map(s => s.id));
  m.steps.forEach(s => { assert(INPUTS.has(s.input), m.id + '/' + s.id); if (s.from) assert(ids.has(s.from)); if (typeof s.rows === 'string') assert(ids.has(s.rows)); });
  m.result.forEach(r => assert(ids.has(r.from), m.id + ' result ' + r.from));
});
const schema = rd('tools/compass/schema/minest.micro.schema.json');
assert.deepStrictEqual(LABS.map(d => d.interaction_id).sort(), ['aristotle-causes', 'hegel-concept', 'kant-causality', 'locke-room', 'plato-cave']);
LABS.forEach(d => {
  schema.required.forEach(k => assert(k in d, d.interaction_id + ' lacks ' + k));
  assert(['pending', 'reviewed'].includes(d.content_review_status), d.interaction_id + ' review status');
  d.content.layers.forEach(l => assert(['summary', 'interpretation', 'open-question'].includes(l.kind), d.interaction_id + '/' + l.id + ' content kind'));
  assert(/not|doesn’t|reading aid/.test(d.disclaimer), d.interaction_id + ' disclaimer');
  const st = d.steps.map(s => s.id), acts = new Set(d.user_actions.map(a => a.id));
  d.state_transitions.forEach(t => { assert(acts.has(t.on), d.interaction_id + ': transition on unknown action ' + t.on); assert(t.from === '*' || st.includes(t.from)); });
  st.forEach(s => assert(d.completion_criteria[s], d.interaction_id + ': no criterion for ' + s));
});
Object.values(ext.frameworks).forEach(x => (x.interaction_ids || []).forEach(i => assert(LABS.some(d => d.interaction_id === i), 'unknown interaction ' + i)));
assert(/thesis–antithesis–synthesis/.test(LABS.find(d => d.interaction_id === 'hegel-concept').content.layers.map(l => l.body).join(' ')), 'Hegel lab explains the triad misreading');
assert(LABS.find(d => d.interaction_id === 'aristotle-causes').content.objects.statue.cards.filter(c => c.slot === 'none').length === 2, 'two distractor cards');
// every data string the toolkit shows has a Chinese translation
const ZH = rd('tools/toolkit/i18n/zh.json').strings;
const need = [];
T.forEach(t => { need.push(t.title, t.scope, t.caution); t.sections.forEach(x => need.push(x.label)); });
MD.models.forEach(m => { need.push(m.title, m.principle, m.limits); m.steps.forEach(x => { need.push(x.title, x.prompt); (x.options || []).forEach(o => need.push(o[1])); }); (m.rules || []).forEach(r => need.push(r.say)); });
LABS.forEach(d => { need.push(d.title, d.subtitle, d.learning_objective, d.disclaimer); d.steps.forEach(x => { need.push(x.title, x.prompt); (x.options || []).forEach(o => need.push(o[1])); }); d.feedback_rules.forEach(r => need.push(r.say)); d.content.layers.forEach(l => need.push(l.title, l.body)); });
const missing = need.filter(x => x && !ZH[x]);
assert.strictEqual(missing.length, 0, 'untranslated: ' + missing.slice(0, 5).join(' | '));

// ---------------------------------------------------------------- 3 · classification for the test case
C.load({ taxonomy: tax, ext, frameworks: fws, store: backend() });
['什么是自由？', 'What is freedom?'].forEach(q => {
  const r = C.classify(q);
  assert.strictEqual(r.primary.id, 'philosophy.political', q);
  assert(r.related.some(x => x.id === 'philosophy.ethics') && r.related.some(x => x.id === 'philosophy.metaphysics.free-will'), q + ' related');
  assert(r.interactions.some(i => i.interaction_id === 'locke-room'), q + ' offers the Locked Room');
});

// ---------------------------------------------------------------- 4 · framework ↔ store sync (the Framework Card's own functions)
global.window = { MinestToolkit: { register() {}, icon: () => '', esc: s => s, ks, data: { templates: T, seeds: S }, silently: f => f(), rootLabel: k => ks.label(k.root_concept) } };
require(path.join(R, 'tools/toolkit/cards/framework.js'));
const F = global.window.MinestToolkit.frameworkOps;
ks.updateObject(ko.id, { seed: 'freedom' });
const fi = F.build(ks.object(ko.id), T.find(t => t.id === 'concept-analysis'), true);
const root = F.rootOf(fi), types = fi.nodes.find(n => n.key === 'types');
assert.strictEqual(root.concept_id, ks.object(ko.id).root_concept, 'root keeps the topic concept');
const neg = ks.findConcept('Negative liberty');
assert(neg && neg.labels.zh === '消极自由' && neg.provenance === 'library' && neg.review === 'pending');
assert(ks.relations({ node: 'cc:' + neg.id }).some(r => r.type === 'belongs-to' && r.to === 'cc:' + root.concept_id), 'type item belongs to the topic');
const berlin = ks.findConcept('Isaiah Berlin');
assert.strictEqual(berlin.kind, 'philosopher');
assert(ks.relations({ node: 'cc:' + berlin.id }).some(r => r.type === 'influences' && r.to === 'cc:' + neg.id && r.provenance === 'library'), 'seed relation');
// the user adds "Autonomy" under Kinds → the existing Autonomy concept, related to the topic, visible to every card
const n = { id: 'nA', role: 'item', label: 'Autonomy', parent: types.id, order: 9, provenance: 'user' };
fi.nodes.push(n); F.sync(fi, n); ks.saveFramework(fi);
assert.strictEqual(n.concept_id, a, 'reuses the existing Autonomy concept');
// the same link already existed (made in step 1), so the framework reuses it instead of adding a second one
const ar = ks.relations({ node: 'cc:' + a }).filter(r => r.type === 'belongs-to' && r.to === 'cc:' + root.concept_id);
assert(ar.length === 1 && ar[0].provenance === 'user' && ar[0].source_ref === null);
assert(ks.object(ko.id).concept_ids.includes(a));
// move it under "Negative liberty" → it now belongs to that concept
n.parent = fi.nodes.find(x => x.label === 'Negative liberty').id; F.sync(fi, n);
assert(ks.relations({ source: 'fwi:' + fi.id + ':nA' }).every(r => r.to === 'cc:' + neg.id));
// a cross-reference
n.refs = [k1]; F.sync(fi, n);
assert(ks.relations({ source: 'fwi:' + fi.id + ':nA:ref' }).length === 1);
// "objections" refute the topic; "applications" are applied BY the topic (root-item)
const app = ks.findConcept('Freedom of speech');
assert(ks.relations({ node: 'cc:' + app.id }).some(r => r.type === 'applies-to' && r.from === 'cc:' + root.concept_id));
// removing the framework removes only its links
const before = ks.relations({ ko: ko.id }).filter(r => r.source_ref === null || !String(r.source_ref).startsWith('fwi:')).length;
ks.removeFramework(fi.id);
assert.strictEqual(ks.relations({ source: 'fwi:' + fi.id }).length, 0);
assert.strictEqual(ks.relations({ ko: ko.id }).length, before, 'links made elsewhere stay');

// ---------------------------------------------------------------- 5 · model loops
global.window.MinestToolkit.register = () => {}; global.window.MinestToolkit.data.models = MD.models; global.window.MinestToolkit.C = C;
require(path.join(R, 'tools/toolkit/cards/models.js'));
const loops = global.window.MinestToolkit.modelLoops([{ from: 'A', to: 'B', sign: '+' }, { from: 'B', to: 'A', sign: '-' }, { from: 'B', to: 'C', sign: '+' }, { from: 'C', to: 'B', sign: '+' }, { from: 'A', to: 'C', sign: '+' }]);
const kinds = loops.map(l => l.path.join('>') + ':' + l.kind).sort();
assert(kinds.includes('A>B>A:balancing') && kinds.includes('B>C>B:reinforcing'), kinds.join(' '));
assert.strictEqual(loops.length, 2 + 1 /* A>C>B>A: + + − → balancing */);

// ---------------------------------------------------------------- 6 · the Locked Room (headless)
M.register(locke);
const s = M.session(locke, {});
assert.strictEqual(s.dispatch('next'), false);
s.dispatch('seen'); s.dispatch('next'); s.dispatch('judge', 'yes'); s.dispatch('next');
s.dispatch('toggle-wish', 'leave'); assert(s.feedback().some(f => /can’t/.test(f.say)));
s.dispatch('record', ['locked/stay', 'locked/leave']); assert.strictEqual(s.canNext(), false);
s.dispatch('toggle-lock', false); s.dispatch('record', ['locked/stay', 'locked/leave', 'open/leave']); assert(s.canNext());
s.dispatch('next'); s.dispatch('judge', 'no'); assert.strictEqual(s.feedback().length, 2);
s.dispatch('next'); s.dispatch('flip'); s.dispatch('flip'); s.dispatch('flip'); s.dispatch('next');
s.dispatch('apply', { situation: 'school', voluntary: 'yes', couldOtherwise: 'no', kind: 'Voluntary, but not free to do otherwise' }); s.dispatch('next');
s.dispatch('note', { note: 'n', question: 'q' });
const rec = M.save(b, s);
assert(rec.completed && rec.changedMind && rec.probes.tried.length === 3 && rec.probes.locked === false);
ks.linkLabRun(ko.id, rec);
assert(ks.labRunsOf(ko.id).length === 1);
assert(/does not settle/.test(locke.disclaimer));

// ---------------------------------------------------------------- 7 · export / import (into a fresh store: concepts merge, ids remap)
ks.addNote(ko.id, 'My note', { about: 'cc:' + ko.root_concept });
const fi2 = F.build(ks.object(ko.id), T.find(t => t.id === 'socratic-definition'), false);
const data = ks.exportObject(ko.id);
assert.strictEqual(data.format, 'minest.knowledge-object/1');
const b2 = backend(), ks2 = KS.create(b2);
ks2.concept('Autonomy');   // already there → must merge, not duplicate
const ko2 = ks2.importObject(data);
assert.strictEqual(b2.keys('cc:').map(k => b2.get(k)).filter(c => c.labels.en === 'Autonomy').length, 1, 'import merges concepts by name');
assert.strictEqual(ks2.relations({ ko: ko2.id }).length, data.relations.length);
assert.strictEqual(ks2.frameworksOf(ko2.id).length, 1);
assert(ks2.relations({ ko: ko2.id }).every(r => !String(r.from + r.to).includes(ko.id)), 'object ids remapped');
assert(ks2.object(ko2.id).notes.length === 1 && ks2.labRunsOf(ko2.id).length === 1);
console.log('toolkit: ok');

// ---------------------------------------------------------------- 8 · the knowledge nebula (tree + layout, view-only)
{
  const NB = require(path.join(R, 'tools/toolkit/nebula.js'));
  const b3 = backend(), k3 = KS.create(b3);
  C.load({ taxonomy: tax, ext, frameworks: fws, store: backend() });
  const mk = (q, place, concepts) => { const o = k3.createObject(q, { topic: concepts[0] }); concepts.slice(1).forEach(c => k3.addToObject(o.id, k3.concept(c))); k3.updateObject(o.id, { placement: { suggested: { primary: place }, confirmed: null } }); return o; };
  mk('What is freedom?', 'philosophy.political', ['Freedom', 'Autonomy', 'Negative liberty']);
  mk('Why do habits stick?', 'psychology.learning', ['Habit']);
  const unplaced = k3.createObject('asdf', {});
  const before = JSON.stringify(b3._m);
  const T = NB.layout(NB.tree(k3, C));
  assert.strictEqual(JSON.stringify(b3._m), before, 'building the nebula writes nothing');
  const at = d => Object.values(T.by).filter(n => n.depth === d);
  assert.deepStrictEqual(at(1).map(n => n.domain).sort(), ['philosophy', 'psychology', 'unplaced']);
  assert(at(2).some(n => n.place === 'philosophy.political') && at(2).some(n => n.label === 'Unplaced thoughts'));
  assert.strictEqual(at(3).length, 3);
  const fr = at(3).find(n => n.label === 'What is freedom?');
  assert.deepStrictEqual(fr.children.map(c => c.label).sort(), ['Autonomy', 'Freedom', 'Negative liberty']);
  assert(fr.children.find(c => c.label === 'Freedom').topic, 'the topic concept is marked');
  Object.values(T.by).forEach(n => { assert(n.home && n.home.every(Number.isFinite), n.id + ' has a place'); if (n.parent && n.depth > 1) assert(Math.hypot(n.home[0] - n.parent.home[0], n.home[1] - n.parent.home[1], n.home[2] - n.parent.home[2]) > 30, n.id + ' sits away from its parent'); });
  assert(unplaced);
  // time: every node knows when it came into being; a cluster exists from its first thought
  Object.values(T.by).forEach(n => assert(typeof n.t === 'number', n.id + ' has a time'));
  at(1).forEach(d => assert.strictEqual(d.t, Math.min(...d.children.map(c => c.t)), d.id + ' time = its first child'));
  at(4).forEach(c => assert(c.t >= c.parent.t, c.id + ' not before its thought'));
}
console.log('nebula: ok');

// ---------------------------------------------------------------- 知识图谱 ◉ 全息概览: Wikipedia → bubble map (data rules)
{
  const WM = require(path.join(R, 'tools/toolkit/wiki-map.js'));
  assert.strictEqual(WM.cleanQuery('什么是自由？'), '自由');
  assert.strictEqual(WM.cleanQuery('自由是什么?'), '自由');
  assert.strictEqual(WM.cleanQuery('What is the freedom?'), 'freedom');
  assert.strictEqual(WM.cleanQuery('Liberty'), 'Liberty');
  assert(WM.isZh('自由') && !WM.isZh('Liberty'));
  assert.strictEqual(WM.sentences('第一句。第二句。第三句。', 2), '第一句。第二句。');
  assert.strictEqual(WM.sentences('One. Two[3]. Three.', 2), 'One. Two.', 'citation marks are dropped');
  assert(WM.sentences('一'.repeat(300), 1, 50).length === 50 && WM.sentences('一'.repeat(300), 1, 50).endsWith('…'));
  ['参见', '参考文献', 'See also', 'References', 'External links'].forEach(s => assert(WM.SKIP.test(s), s + ' is not a part of the concept'));
  ['定义', '历史', 'Philosophy'].forEach(s => assert(!WM.SKIP.test(s), s + ' is a part'));
  assert.strictEqual(WM.url('zh', '法国 大革命', '历史'), 'https://zh.wikipedia.org/wiki/%E6%B3%95%E5%9B%BD_%E5%A4%A7%E9%9D%A9%E5%91%BD#%E5%8E%86%E5%8F%B2');
}
console.log('wiki map: ok');
