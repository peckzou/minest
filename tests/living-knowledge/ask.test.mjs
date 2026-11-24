// Minest Living Knowledge · M4 — ask the library and draft a page, with a fake model (node tests/living-knowledge/ask.test.mjs)
// Nothing is sent to any AI provider.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '../..');
const require = createRequire(import.meta.url);
const S = require(join(root, 'living-knowledge/js/lk-store.js'));
const A = require(join(root, 'living-knowledge/js/lk-agent.js'));
const { lkAsk, lkCompose, validateAsk, validateCompose } = await import(join(root, 'api/_minest/living-knowledge.mjs'));

let clock = 1795200000000;
const now = () => ++clock;
const results = [];
async function test(name, fn) { await fn(); results.push(name); }
const reply = (obj) => ({ model: 'fake', usage: { prompt_tokens: 10, completion_tokens: 5 }, choices: [{ message: { content: JSON.stringify(obj) } }] });

async function library() {
  const st = S.createStore({ now, autoFlush: false });
  const c1 = A.claimId('pg_forgetting-curve', 'Ebbinghaus described the forgetting curve in 1885.');
  const c2 = A.claimId('pg_forgetting-curve', 'Reviews do not change the curve.');
  const ok = async (w) => assert.ok((await w).ok);
  await ok(st.put('page', { id: 'pg_forgetting-curve', title: 'Forgetting curve', type: 'concept', aliases: ['遗忘曲线'], tags: [], markdown: 'How memory fades. See [[Spaced repetition]].',
    claims: [{ id: c1, text: 'Ebbinghaus described the forgetting curve in 1885.', kind: 'inference', origin: 'ai_inferred', sources: [] },
      { id: c2, text: 'Reviews do not change the curve.', kind: 'inference', origin: 'ai_inferred', sources: [], conflictsWith: [c1] }] }, { baseRev: 0 }));
  await ok(st.put('page', { id: 'pg_spaced-repetition', title: 'Spaced repetition', type: 'howto', aliases: ['间隔复习'], tags: [], markdown: '间隔复习把复习安排在快要忘记的时候。', claims: [] }, { baseRev: 0 }));
  await ok(st.put('page', { id: 'pg_sourdough', title: 'Sourdough', type: 'note', aliases: [], tags: [], markdown: 'Bread.', claims: [] }, { baseRev: 0 }));
  return { st, c1, c2 };
}

await test('retrieve: finds pages on the device, English words and Chinese pairs; the best hit brings its links', async () => {
  const { st } = await library();
  const pages = await st.list('page');
  const en = A.retrieve(pages, 'Who described the forgetting curve?');
  assert.equal(en[0].id, 'pg_forgetting-curve');
  assert.ok(en.some(p => p.id === 'pg_spaced-repetition'), 'the linked page comes along');
  assert.ok(!en.some(p => p.id === 'pg_sourdough'));
  assert.ok(en[0].claims.some(c => c.disputed));
  const zh = A.retrieve(pages, '间隔复习是什么');
  assert.equal(zh[0].id, 'pg_spaced-repetition');
  assert.deepEqual(A.retrieve(pages, '？？'), []);
});

await test('ask: needs permission; nothing found sends nothing; citations are checked', async () => {
  const { st, c1 } = await library();
  let calls = 0, lastUser = '';
  const model = (messages) => { calls++; lastUser = messages[1].content; return reply({ summary: 'Ebbinghaus, in 1885.', confidence: 'high', gaps: ['a', 'b', 'c', 'd'], followups: ['f'], suggestPage: '',
    points: [{ text: 'Ebbinghaus described it in 1885.', claimIds: [c1, 'cl_made-up'], pageIds: [], decisionIds: ['dc_nope'] },
      { text: 'It is widely taught today.', claimIds: [], pageIds: ['pg_forgetting-curve'], decisionIds: [] }] }); };
  const transport = (op, body) => { assert.equal(op, 'lk-ask'); return lkAsk(JSON.parse(JSON.stringify(body)), model); };
  await assert.rejects(A.ask(st, 'Who described the forgetting curve?', { transport }), e => e.code === 'ai-not-allowed');
  const p = await st.permissions(); p.allowAI = true; await st.savePermissions(p);
  const none = await A.ask(st, 'quantum chromodynamics', { transport });
  assert.equal(none.status, 'nothing'); assert.equal(calls, 0);
  const a = await A.ask(st, 'Who described the forgetting curve?', { transport });
  assert.equal(calls, 1); assert.equal(a.status, 'answered');
  assert.ok(!lastUser.includes('Sourdough'), 'pages that are not about the question are not sent');
  assert.deepEqual(a.points[0].claimIds, [c1]); assert.deepEqual(a.points[0].decisionIds, []);
  assert.ok(a.points[0].grounded); assert.deepEqual(a.points[0].pageIds, ['pg_forgetting-curve']);
  assert.equal(a.points[1].grounded, false, 'a point with no claim is an inference');
  assert.equal(a.confidence, 'medium', 'not "high" when a point is uncited');
  assert.equal(a.gaps.length, 3);
  const md = A.answerMarkdown(a);
  assert.match(md, /\[\[Forgetting curve\]\]/); assert.match(md, /AI 推断/);
});

await test('validateAsk: nothing cited is never more than "low"; injected text cannot add ids', async () => {
  const ctx = { pages: [{ id: 'pg_a', claims: [{ id: 'cl_1' }] }], decisions: [{ id: 'dc_x' }] };
  const v = validateAsk({ summary: 's', confidence: 'high', points: [{ text: 't', claimIds: ['cl_2'], pageIds: ['pg_zzz'], decisionIds: [] }], gaps: [], followups: [], suggestPage: '' }, ctx);
  assert.equal(v.confidence, 'low'); assert.equal(v.grounded, 0); assert.equal(v.dropped.unknownIds, 2);
  const d = validateAsk({ summary: 's', confidence: 'high', points: [{ text: 't', claimIds: [], pageIds: [], decisionIds: ['dc_x'] }] }, ctx);
  assert.equal(d.confidence, 'high'); assert.ok(d.points[0].grounded);
});

await test('compose: a draft only — links are checked, the title line is dropped, locked pages are refused', async () => {
  const { st, c1 } = await library();
  const p = await st.permissions(); p.allowAI = true; await st.savePermissions(p);
  const model = () => reply({ markdown: '# Forgetting curve\n\nMemory fades without review; see [[spaced repetition]] and [[Made up page]] and [[Forgetting curve]].\n\n## History\n- Ebbinghaus, 1885.', usedClaimIds: [c1, 'cl_x'], leftOut: '' });
  const transport = (op, body) => { assert.equal(op, 'lk-compose'); return lkCompose(JSON.parse(JSON.stringify(body)), model); };
  const before = await st.get('page', 'pg_forgetting-curve');
  const d = await A.compose(st, 'pg_forgetting-curve', { transport });
  assert.ok(!/^# /.test(d.markdown)); assert.match(d.markdown, /\[\[Spaced repetition\]\]/);
  assert.ok(!d.markdown.includes('[[Made up page]]')); assert.ok(!d.markdown.includes('[[Forgetting curve]]'));
  assert.deepEqual(d.usedClaimIds, [c1]); assert.equal(d.unusedClaims, 1); assert.equal(d.baseRev, before.rev);
  assert.equal((await st.get('page', 'pg_forgetting-curve')).rev, before.rev, 'nothing is written');
  await assert.rejects(A.compose(st, 'pg_sourdough', { transport }), e => e.code === 'no-claims');
  assert.ok((await st.put('page', Object.assign({}, before, { lockedBy: 'user' }), { baseRev: before.rev })).ok);
  await assert.rejects(A.compose(st, 'pg_forgetting-curve', { transport }), e => e.code === 'locked');
  assert.throws(() => validateCompose({ markdown: 'x', usedClaimIds: [] }, { title: 't', claims: [], pages: [] }), /no text/);
});

console.log('living-knowledge M4: ' + results.length + ' tests passed\n - ' + results.join('\n - '));
