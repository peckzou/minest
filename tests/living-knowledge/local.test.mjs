// Minest Living Knowledge · the on-device engine, end to end on the Declaration of Independence
// (node tests/living-knowledge/local.test.mjs). No network, no AI, no permission: import → organise → review → page → ask.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '../..');
const require = createRequire(import.meta.url);
const S = require(join(root, 'living-knowledge/js/lk-store.js'));
const IM = require(join(root, 'living-knowledge/js/lk-import.js'));
const A = require(join(root, 'living-knowledge/js/lk-agent.js'));
const L = require(join(root, 'living-knowledge/js/lk-local.js'));
const D = require(join(root, 'living-knowledge/js/lk-demo.js'));

let clock = 1795200000000;
const now = () => ++clock;
const results = [];
async function test(name, fn) { await fn(); results.push(name); }

await test('sentences keep their exact place in the text', () => {
  const ss = L.sentences(D.text);
  assert.ok(ss.length > 20);
  ss.forEach((s) => assert.equal(D.text.slice(s.start, s.end), s.text));
  assert.ok(ss.some((s) => /^That to secure these rights/.test(s.text)), 'the "--" of the original separates sentences');
  assert.equal(L.sentences('Dr. Smith paid 3.5 dollars. He left.').length, 2);
});

await test('extract: concepts, claims that are sentences of the source, relations; the same every time', () => {
  const a = L.extract({ text: D.text, title: D.title, offset: 100 }), b = L.extract({ text: D.text, title: D.title, offset: 100 });
  assert.deepEqual(a, b);
  const titles = a.concepts.map((c) => c.title);
  ['Government', 'People', 'Great Britain', 'United States of America', 'Consent'].forEach((t) => assert.ok(titles.includes(t), t + ' in ' + titles.join(', ')));
  assert.ok(!titles.some((t) => /^(The|We|He|Among)$/.test(t)));
  assert.ok(a.claims.length >= 8);
  a.claims.forEach((c) => {
    assert.equal(D.text.slice(c.evidence.start - 100, c.evidence.end - 100), c.evidence.quote, 'the quote is where it says it is');
    assert.ok(titles.includes(c.page));
    assert.notEqual(c.kind, 'inference');
  });
  assert.equal(a.claims.find((c) => /^We hold these truths/.test(c.text)).kind, 'opinion');
  titles.forEach((t) => assert.ok(a.claims.some((c) => c.page === t), 'every concept has a claim: ' + t));
  assert.ok(a.relations.some((r) => r.type === 'derived_from' && [r.from, r.to].includes('Consent')));
  assert.equal(a.trace.sentences.length, L.sentences(D.text).length);
  assert.ok(a.trace.terms[0].count >= a.trace.terms[1].count);
});

await test('extract: Chinese, an existing page, the same claim, a contradiction', () => {
  const zh = L.extract({ text: '间隔复习是一种学习方法。间隔复习把复习安排在快要忘记的时候，这样记忆会更牢固。艾宾浩斯提出了遗忘曲线。遗忘曲线说明记忆会随着时间减弱；每一次间隔复习都会让遗忘曲线变得平缓。我认为间隔复习应该配合主动回忆一起使用。主动回忆指的是不看答案先自己回想。',
    title: '间隔复习', pages: [{ id: 'pg_spaced', title: 'Spaced repetition', aliases: ['间隔复习'] }],
    claims: [{ id: 'cl_same', page: 'Spaced repetition', text: '间隔复习是一种学习方法。' }, { id: 'cl_not', page: 'Spaced repetition', text: '每一次间隔复习都不会让遗忘曲线变得平缓。' }] });
  const spaced = zh.concepts.find((c) => c.matchPageId === 'pg_spaced');
  assert.equal(spaced.title, 'Spaced repetition');
  assert.ok(zh.concepts.some((c) => c.title === '遗忘曲线'));
  assert.equal(zh.claims.find((c) => c.text === '间隔复习是一种学习方法。').sameAsClaimId, 'cl_same');
  assert.equal(zh.claims.find((c) => /变得平缓/.test(c.text)).contradictsClaimId, 'cl_not');
  assert.equal(zh.claims.find((c) => /我认为/.test(c.text)).kind, 'opinion');
  assert.equal(zh.claims.find((c) => /是一种/.test(c.text)).kind, 'definition');
});

await test('the whole flow with AI not allowed: import → organise → accept → page → draft → ask', async () => {
  const st = S.createStore({ now, autoFlush: false });
  assert.equal((await st.permissions()).allowAI, false);
  const rep = await IM.importAll(st, [{ text: D.text, title: D.title, url: D.url }], { via: 'test' });
  assert.equal(rep.added.length, 1);
  const src = rep.added[0], traces = [];
  const transport = L.transport({ onTrace: (t) => traces.push(t) });
  await assert.rejects(A.ingest(st, { transport, sourceIds: [src.id], now }), (e) => e.code === 'ai-not-allowed');

  const run = await A.ingest(st, { transport, local: true, sourceIds: [src.id], now });
  assert.equal(run.status, 'review'); assert.equal(run.engine, 'local'); assert.equal(traces.length, 1);
  const items = run.proposals.flatMap((g) => g.items);
  assert.ok(items.filter((i) => i.type === 'claim').length >= 8);
  assert.ok(items.filter((i) => i.type === 'relation').length >= 5);
  items.filter((i) => i.type === 'claim').forEach((i) => {
    assert.equal(i.claim.origin, 'verified');
    const s = i.claim.sources[0];
    assert.equal(src.text.slice(s.span.start, s.span.end), s.quote);
  });
  assert.equal((await st.list('page')).length, 0, 'nothing is written before the review');

  const choice = {}; items.forEach((i) => { choice[i.key] = true; });
  const done = await A.apply(st, run.id, choice);
  assert.deepEqual(done.errors, []);
  const pages = await st.list('page');
  assert.equal(done.pages, pages.length);
  const gov = pages.find((p) => p.title === 'Government');
  assert.ok(gov && gov.claims.length && gov.sourceIds.includes(src.id));
  assert.ok((await st.list('relation')).length >= 5);

  // the same source again proposes nothing
  const again = await A.ingest(st, { transport, local: true, sourceIds: [src.id], now });
  assert.equal(again.status, 'empty');

  const draft = await A.compose(st, gov.id, { transport, local: true });
  assert.equal(draft.usedClaimIds.length, gov.claims.length);
  assert.match(draft.markdown, /\[\[/, 'other pages named in the text are linked');
  assert.ok(!draft.markdown.includes('[[Government'));
  assert.equal((await st.get('page', gov.id)).rev, gov.rev, 'a draft is not saved');

  const a = await A.ask(st, 'Where do governments get their powers?', { transport, local: true });
  assert.equal(a.status, 'answered'); assert.equal(a.engine, 'local');
  assert.match(a.points[0].text, /consent of the governed/, 'the closest claim comes first');
  assert.match(a.summary, /Power|Government/);
  assert.ok(a.points.length && a.points.every((p) => p.grounded && (p.claimIds.length || p.pageIds.length)));
  a.points.forEach((p) => p.claimIds.forEach((id) => assert.ok(a.claims[id])));
  assert.notEqual(a.confidence, 'none');
  const none = await A.ask(st, '量子计算机怎么工作', { transport, local: true });
  assert.equal(none.status, 'nothing');
});

console.log('ok — ' + results.length + ' tests\n  · ' + results.join('\n  · '));
