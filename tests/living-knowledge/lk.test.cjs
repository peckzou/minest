// Minest Living Knowledge · M1 — the data rules and the store (node tests/living-knowledge/lk.test.cjs)
const assert = require('assert/strict');
const path = require('path');
const zlib = require('zlib');
const M = require(path.join(__dirname, '../../living-knowledge/js/lk-model.js'));
const S = require(path.join(__dirname, '../../living-knowledge/js/lk-store.js'));

let clock = 1795000000000;
const now = () => ++clock;
const agent = { type: 'agent', id: 'evolve' };
const results = [];
async function test(name, fn) { await fn(); results.push(name); }

// read a stored .zip back (only what zip() writes: stored entries)
function unzip(buf) {
  buf = Buffer.from(buf);
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const n = buf.readUInt16LE(end + 10); let at = buf.readUInt32LE(end + 16); const out = {};
  for (let i = 0; i < n; i++) {
    assert.equal(buf.readUInt32LE(at), 0x02014b50);
    const crc = buf.readUInt32LE(at + 16), size = buf.readUInt32LE(at + 20), nl = buf.readUInt16LE(at + 28), off = buf.readUInt32LE(at + 42);
    const name = buf.slice(at + 46, at + 46 + nl).toString('utf8');
    const lnl = buf.readUInt16LE(off + 26), data = buf.slice(off + 30 + lnl, off + 30 + lnl + size);
    assert.equal(zlib.crc32 ? zlib.crc32(data) : M.crc32(data), crc, 'crc of ' + name);
    out[name] = data.toString('utf8'); at += 46 + nl;
  }
  return out;
}

(async () => {
  await test('ids are stable and readable', async () => {
    assert.equal(M.pageId('Spaced Repetition'), 'pg_spaced-repetition');
    assert.equal(M.pageId('间隔 重复'), 'pg_间隔-重复');
    assert.equal(M.relationId('pg_a', 'supports', 'pg_b'), M.relationId('pg_a', 'supports', 'pg_b'));
    assert.notEqual(M.relationId('pg_a', 'supports', 'pg_b'), M.relationId('pg_b', 'supports', 'pg_a'));
    const a = await M.sourceId('Hello  \r\nworld\n\n\n\n'), b = await M.sourceId('Hello\nworld');
    assert.equal(a, b, 'the same text with other line breaks is the same source');
    assert.match(a, /^src_[0-9a-f]{20}$/);
    assert.deepEqual(M.parseLinks('see [[Memory]] and [[pg_x|X]], [[memory]] again').map(l => l.id), ['pg_memory', 'pg_x']);
  });

  await test('write gate: revisions, versions, no-op, conflicts, size', async () => {
    const p1 = M.planWrite('page', null, { id: 'pg_a', title: 'A', markdown: 'x [[B]]' }, null, { now: 1 });
    assert.ok(p1.ok); assert.equal(p1.doc.rev, 1); assert.deepEqual(p1.doc.links, ['pg_b']); assert.equal(p1.version.snapshot.rev, 1);
    const same = M.planWrite('page', p1.doc, { id: 'pg_a', title: 'A', markdown: 'x [[B]]' }, null, { now: 2, baseRev: 1 });
    assert.ok(same.ok && same.noop, 'saving the same content again writes nothing');
    const p2 = M.planWrite('page', p1.doc, { id: 'pg_a', title: 'A', markdown: 'y' }, null, { now: 3, baseRev: 1 });
    assert.equal(p2.doc.rev, 2); assert.equal(p2.doc.createdAt, 1);
    const stale = M.planWrite('page', p2.doc, { id: 'pg_a', title: 'A', markdown: 'z' }, null, { baseRev: 1 });
    assert.equal(stale.code, 'conflict', 'an edit started from an older revision never overwrites');
    const big = M.planWrite('page', null, { id: 'pg_big', title: 'Big', markdown: 'x'.repeat(950000) });
    assert.equal(big.code, 'invalid');
    assert.equal(M.planWrite('page', null, { id: 'bad/id', title: 'x' }).code, 'invalid');
    const fact = M.planWrite('page', null, { id: 'pg_f', title: 'F', claims: [{ text: 'water boils at 100 °C', kind: 'fact' }] });
    assert.equal(fact.code, 'invalid', 'a fact without a source is refused');
  });

  await test('sources never change; decisions; locked pages', async () => {
    const text = 'raw text';
    const src = { id: await M.sourceId(text), title: 'T', kind: 'note', text, contentHash: 'h' };
    const s1 = M.planWrite('source', null, src);
    assert.ok(s1.ok);
    assert.ok(M.planWrite('source', s1.doc, src).noop, 'importing the same source again is a no-op');
    assert.equal(M.planWrite('source', s1.doc, Object.assign({}, src, { text: 'changed' })).code, 'source-immutable');
    assert.equal(M.planWrite('source', s1.doc, Object.assign({}, src, { title: 'renamed' }), { type: 'user', id: 'me' }).code, 'source-immutable');

    const d1 = M.planWrite('decision', null, { id: 'dc_x', title: 'X', state: 'Confirmed', decision: 'do x' }, { type: 'user', id: 'me' }, { now: 5 });
    assert.equal(d1.doc.confirmedBy, 'me'); assert.equal(d1.doc.confirmedAt, 5);
    assert.equal(M.planWrite('decision', d1.doc, Object.assign({}, d1.doc, { decision: 'do y' }), agent).code, 'confirmed-locked');
    assert.equal(M.planWrite('decision', d1.doc, Object.assign({}, d1.doc, { state: 'Superseded' }), agent).code, 'confirmed-locked');
    assert.equal(M.planWrite('decision', null, { id: 'dc_y', title: 'Y', state: 'Confirmed' }, agent).code, 'agent-proposes-only');
    assert.ok(M.planWrite('decision', null, { id: 'dc_y', title: 'Y', state: 'Proposed' }, agent).ok);
    const d2 = M.planWrite('decision', d1.doc, Object.assign({}, d1.doc, { decision: 'do y' }), { type: 'user', id: 'me' }, { now: 9, baseRev: 1 });
    assert.ok(d2.ok); assert.equal(d2.doc.confirmedAt, 5, 'the confirmation time stays when the user edits');
    const sup = M.planWrite('decision', d2.doc, Object.assign({}, d2.doc, { state: 'Superseded', supersededBy: 'dc_z' }), { type: 'user', id: 'me' });
    assert.ok(sup.ok); assert.equal(sup.doc.confirmedAt, undefined);

    const pg = M.planWrite('page', null, { id: 'pg_l', title: 'L', markdown: 'mine', lockedBy: 'user' }).doc;
    assert.equal(M.planWrite('page', pg, Object.assign({}, pg, { markdown: 'ai' }), agent).code, 'page-locked');
    assert.equal(M.planWrite('page', null, { id: 'pg_n', title: 'N', lockedBy: 'user' }, agent).code, 'page-locked');
    assert.ok(M.planWrite('page', null, { id: 'pg_n', title: 'N', markdown: 'ai draft' }, agent).ok, 'an agent may write an unlocked page');
  });

  await test('store: write, read, versions, restore', async () => {
    const st = S.createStore({ now, autoFlush: false });
    await st.put('page', { id: 'pg_m', title: 'Memory', markdown: 'v1' });
    await st.put('page', { id: 'pg_m', title: 'Memory', markdown: 'v2' }, { baseRev: 1 });
    await st.put('page', { id: 'pg_m', title: 'Memory', markdown: 'v3' }, { baseRev: 2 });
    let vs = await st.versions('page', 'pg_m');
    assert.deepEqual(vs.map(v => v.rev), [3, 2, 1]);
    const r = await st.restore('page', 'pg_m', 1);
    assert.ok(r.ok); assert.equal(r.doc.rev, 4); assert.equal(r.doc.markdown, 'v1');
    vs = await st.versions('page', 'pg_m');
    assert.deepEqual(vs.map(v => v.rev), [4, 3, 2, 1], 'nothing in the history is rewritten');
    assert.match(vs[0].reason, /恢复到第 1 版/);
    assert.equal((await st.list('page')).length, 1);
    assert.equal((await st.status()).pending, 4);
  });

  await test('store: offline first, then up in order; a second device sees it', async () => {
    const cloud = S.memoryCloud(); cloud.offline = true;
    const a = S.createStore({ cloud, now, autoFlush: false });
    await a.put('page', { id: 'pg_o', title: 'Offline', markdown: '1' });
    await a.put('page', { id: 'pg_o', title: 'Offline', markdown: '2' }, { baseRev: 1 });
    let s = await a.flush();
    assert.equal(s.pending, 2); assert.match(s.error, /连不上云端/);
    cloud.offline = false;
    s = await a.flush();
    assert.equal(s.pending, 0); assert.equal(s.error, '');
    assert.equal(cloud._docs.get('page|pg_o').rev, 2);
    const b = S.createStore({ cloud, now, autoFlush: false });
    await b.pull();
    assert.equal((await b.get('page', 'pg_o')).markdown, '2');
    assert.deepEqual((await b.versions('page', 'pg_o')).map(v => v.rev), [2, 1], 'the history comes from the cloud');
  });

  await test('store: two devices edit the same page → a conflict, nothing lost', async () => {
    const cloud = S.memoryCloud();
    const a = S.createStore({ cloud, now, autoFlush: false }), b = S.createStore({ cloud, now, autoFlush: false });
    await a.put('page', { id: 'pg_c', title: 'C', markdown: 'base' }); await a.flush(); await b.pull();
    await a.put('page', { id: 'pg_c', title: 'C', markdown: 'from A' }, { baseRev: 1 }); await a.flush();
    await b.put('page', { id: 'pg_c', title: 'C', markdown: 'from B' }, { baseRev: 1 });
    await b.put('page', { id: 'pg_c', title: 'C', markdown: 'from B, again' }, { baseRev: 2 });
    const s = await b.flush();
    assert.equal(s.conflicts, 1); assert.equal(s.pending, 0);
    assert.equal(cloud._docs.get('page|pg_c').markdown, 'from A', 'the cloud was not overwritten');
    assert.equal((await b.get('page', 'pg_c')).markdown, 'from A');
    const [c] = await b.conflicts();
    assert.equal(c.mine.markdown, 'from B, again'); assert.equal(c.theirs.markdown, 'from A');
    assert.equal((await b.put('page', { id: 'pg_c', title: 'C', markdown: 'x' }, { baseRev: 2 })).code, 'conflict', 'no edits until it is resolved');
    const r = await b.resolve('page', 'pg_c', 'mine');
    assert.ok(r.ok); assert.equal(r.doc.rev, 3);
    await b.flush();
    assert.equal(cloud._docs.get('page|pg_c').markdown, 'from B, again');
    assert.deepEqual((await b.versions('page', 'pg_c')).map(v => [v.rev, v.snapshot.markdown]), [[3, 'from B, again'], [2, 'from A'], [1, 'base']]);
    await a.pull(); assert.equal((await a.get('page', 'pg_c')).rev, 3);
  });

  await test('store: permissions per module; modules write as agents', async () => {
    const st = S.createStore({ now, autoFlush: false });
    await st.put('decision', { id: 'dc_k', title: 'Keep', state: 'Confirmed', decision: 'k' });
    const study = st.access('study');
    await assert.rejects(study.list('page'), e => e.code === 'permission-denied');
    const p = await st.permissions(); p.modules.study = { read: true, write: true };
    assert.ok((await st.savePermissions(p)).ok);
    assert.equal((await study.list('decision')).length, 1);
    const r = await study.put('decision', { id: 'dc_k', title: 'Keep', state: 'Confirmed', decision: 'changed' });
    assert.equal(r.code, 'confirmed-locked', 'a module can never change a Confirmed decision');
    const own = await st.access('living-knowledge').put('decision', { id: 'dc_k', title: 'Keep', state: 'Confirmed', decision: 'changed' }, { baseRev: 1 });
    assert.ok(own.ok, 'the user, in Living Knowledge itself, can');
  });

  await test('Markdown export: files, front matter, links, zip', async () => {
    const st = S.createStore({ now, autoFlush: false });
    const text = 'Ebbinghaus measured forgetting.';
    const sid = await M.sourceId(text);
    await st.put('source', { id: sid, title: 'Forgetting curve notes', kind: 'note', text, contentHash: sid.slice(4) });
    await st.put('page', { id: 'pg_spaced-repetition', title: 'Spaced Repetition', type: 'concept', tags: ['learning'], markdown: 'Fights the [[Forgetting Curve]].',
      claims: [{ text: 'Forgetting follows a curve', kind: 'fact', origin: 'verified', confidence: 0.9, sources: [{ sourceId: sid, quote: 'measured forgetting' }] }] });
    await st.put('page', { id: 'pg_forgetting-curve', title: 'Forgetting Curve', markdown: 'See [[Spaced Repetition|SR]].' });
    await st.put('decision', { id: 'dc_review', title: 'Daily review time', state: 'Proposed', options: ['morning', 'evening'], reasons: ['fresh mind'] });
    const files = unzip(await st.exportZip());
    const names = Object.keys(files).sort();
    assert.deepEqual(names, ['decisions/Daily review time.md', 'index.md', 'living-knowledge.json', 'log.md', 'pages/Forgetting Curve.md', 'pages/Spaced Repetition.md', 'sources/Forgetting curve notes.md']);
    const sr = files['pages/Spaced Repetition.md'];
    assert.match(sr, /^---\nid: pg_spaced-repetition\ntitle: Spaced Repetition\ntype: concept\n/);
    assert.match(sr, /\[\[Forgetting Curve\]\]/);
    assert.match(sr, /\[\^c1-1\]: \[\[Forgetting curve notes\]\] — “measured forgetting”/);
    assert.match(files['pages/Forgetting Curve.md'], /\[\[Spaced Repetition\|SR\]\]/);
    const back = M.parseMarkdown(sr);
    assert.equal(back.meta.id, 'pg_spaced-repetition'); assert.deepEqual(back.meta.tags, ['learning']);
    assert.match(files['log.md'], /Spaced Repetition · 第 1 版 · user:me · 新建/);
    assert.equal(JSON.parse(files['living-knowledge.json']).pages.length, 2);
  });

  await test('Firestore adapter: paths, transaction, versions, conflicts', async () => {
    // a small stand-in for the Firestore compat API (collection / doc / get / runTransaction)
    const data = new Map(), writes = [];
    const snap = (p) => ({ exists: data.has(p), data: () => JSON.parse(JSON.stringify(data.get(p))) });
    const ref = (p) => ({ path: p, collection: (c) => col(p + '/' + c), get: () => Promise.resolve(snap(p)) });
    const col = (p) => ({ doc: (id) => ref(p + '/' + id), get: () => Promise.resolve({ forEach: (f) => [...data.keys()].filter(k => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/')).sort().forEach(k => f(snap(k))) }) });
    const db = { collection: (c) => col(c), runTransaction: (fn) => { const t = { get: (r) => Promise.resolve(snap(r.path)), set: (r, v) => { assert.ok(!JSON.stringify(v).includes('undefined')); writes.push(r.path); data.set(r.path, v); } }; return fn(t); } };
    const cloud = S.firestoreCloud(db, 'U1');
    const st = S.createStore({ cloud, now, autoFlush: false });
    await st.put('page', { id: 'pg_f', title: 'F', markdown: 'one' });
    await st.put('decision', { id: 'dc_f', title: 'F', state: 'Proposed' });
    await st.flush();
    assert.deepEqual(writes, ['users/U1/lk_pages/pg_f', 'users/U1/lk_pages/pg_f/versions/00000001', 'users/U1/lk_decisions/dc_f', 'users/U1/lk_decisions/dc_f/versions/00000001']);
    assert.ok(![...data.keys()].some(k => k.includes('focusboard')), 'nothing is written into the boards document');
    const other = S.createStore({ cloud, now, autoFlush: false });
    await other.pull();
    assert.equal((await other.get('page', 'pg_f')).markdown, 'one');
    await other.put('page', { id: 'pg_f', title: 'F', markdown: 'two' }, { baseRev: 1 }); await other.flush();
    await st.put('page', { id: 'pg_f', title: 'F', markdown: 'three' }, { baseRev: 1 });
    const s = await st.flush();
    assert.equal(s.conflicts, 1); assert.equal(data.get('users/U1/lk_pages/pg_f').markdown, 'two');
  });

  results.forEach(n => console.log('PASS: ' + n));
})().catch(e => { console.error(e); process.exitCode = 1; });
