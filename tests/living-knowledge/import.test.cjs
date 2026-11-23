// Minest Living Knowledge · M2 — imports (node tests/living-knowledge/import.test.cjs)
const assert = require('assert/strict');
const path = require('path');
const M = require(path.join(__dirname, '../../living-knowledge/js/lk-model.js'));
const S = require(path.join(__dirname, '../../living-knowledge/js/lk-store.js'));
const I = require(path.join(__dirname, '../../living-knowledge/js/lk-import.js'));

let clock = 1795100000000;
const now = () => ++clock;
const results = [];
async function test(name, fn) { await fn(); results.push(name); }
const store = () => S.createStore({ now, autoFlush: false });

const HTML = `<!doctype html><html><head><title>Spaced repetition – Wiki</title>
<link rel="canonical" href="https://example.org/wiki/Spaced_repetition"><style>p{color:red}</style><script>alert(1)</script></head>
<body><nav><a href="/">Home</a> · <a href="/x">Menu</a></nav>
<article><h1>Spaced repetition</h1><p>Spaced repetition is an <b>evidence-based</b> learning technique&nbsp;that is usually performed with flashcards.</p>
<h2>History</h2><ul><li>Ebbinghaus, 1885</li><li>Leitner, 1972</li></ul><p>Newly introduced and more difficult flashcards are shown more frequently &amp; older ones less often.</p></article>
<footer>© Example</footer></body></html>`;

(async () => {
  await test('web page → readable text, title and address', async () => {
    const h = I.htmlToText(HTML);
    assert.equal(h.title, 'Spaced repetition – Wiki');
    assert.equal(h.url, 'https://example.org/wiki/Spaced_repetition');
    assert.match(h.text, /^# Spaced repetition\n\nSpaced repetition is an evidence-based learning technique that is usually performed with flashcards\.\n\n## History\n\n- Ebbinghaus, 1885\n- Leitner, 1972\n\nNewly introduced .* & older ones less often\.$/);
    assert.doesNotMatch(h.text, /alert|color:red|Home|Menu|© Example/);
  });

  await test('the same material imported three times is stored once', async () => {
    const st = store();
    const file = { name: 'notes.txt', content: 'Retrieval practice beats rereading.\r\n\r\n\r\nTest yourself.  ' };
    const r1 = await I.importAll(st, [file]);
    const r2 = await I.importAll(st, [file]);
    const r3 = await I.importAll(st, [{ text: 'Retrieval practice beats rereading.\n\nTest yourself.' }]);   // pasted, other line breaks
    assert.equal(r1.added.length, 1); assert.equal(r2.added.length, 0); assert.equal(r3.added.length, 0);
    assert.equal(r2.duplicates.length, 1); assert.equal(r3.duplicates.length, 1);
    assert.equal((await st.list('source')).length, 1);
    assert.equal((await st.list('page')).length, 0, 'importing never makes pages by itself');
    const twice = await I.importAll(st, [{ name: 'a.md', content: '# A\nsame' }, { name: 'b.md', content: '# A\nsame' }]);
    assert.equal(twice.added.length, 1); assert.equal(twice.duplicates.length, 1, 'two copies in one batch are found too');
    const src = r1.added[0];
    assert.equal(src.kind, 'note'); assert.equal(src.title, 'notes'); assert.equal(src.origin.fileName, 'notes.txt');
    assert.equal(src.id, 'src_' + src.contentHash.slice(0, 20));
    assert.equal(src.text, 'Retrieval practice beats rereading.\n\nTest yourself.');
  });

  await test('a changed page at the same address is a new source that names the old one', async () => {
    const st = store();
    const a = await I.importAll(st, [{ name: 'page.html', content: HTML }]);
    const b = await I.importAll(st, [{ name: 'page.html', content: HTML.replace('1972', '1973') }]);
    assert.equal(a.added[0].kind, 'web'); assert.equal(a.added[0].origin.url, 'https://example.org/wiki/Spaced_repetition');
    assert.equal(b.added[0].supersedes, a.added[0].id);
    assert.equal((await st.get('source', a.added[0].id)).rev, 1, 'the old source is untouched');
    const pasted = await I.importAll(st, [{ text: 'Short note about leitner boxes', url: 'https://example.org/wiki/Spaced_repetition#x', title: 'Mine' }]);
    assert.equal(pasted.added[0].supersedes, b.added[0].id, 'same address (without #/?) → follows the newest');
    assert.equal(pasted.added[0].title, 'Mine'); assert.equal(pasted.added[0].kind, 'note');
  });

  await test('Minest cards → sources; the same card twice is one source; an edited card follows the old one', async () => {
    const boards = [{ id: 'b1', title: 'Learning', columns: [{ id: 'l1', title: 'Methods', cards: [
      { id: 'c1', title: 'Leitner box', description: 'Cards move between boxes.', checklists: [{ title: 'Steps', items: [{ text: 'Make cards', done: true }, { text: 'Review box 1 daily' }] }], stack: [{ id: 's1', title: 'Box 1', description: 'every day' }] },
      { id: 'c2', title: '' }]}]}];
    const cards = I.listCards(boards);
    assert.equal(cards.length, 1);
    assert.equal(I.cardText(cards[0].card), '# Leitner box\n\nCards move between boxes.\n\n**Steps**\n- [x] Make cards\n- [ ] Review box 1 daily\n\n- Box 1：every day');
    const st = store();
    const r1 = await I.importAll(st, cards.map(I.cardInput));
    const r2 = await I.importAll(st, I.listCards(boards).map(I.cardInput));
    assert.equal(r1.added.length, 1); assert.equal(r2.duplicates.length, 1);
    assert.deepEqual(r1.added[0].origin.cardRef, { bid: 'b1', listId: 'l1', cardId: 'c1' });
    boards[0].columns[0].cards[0].description = 'Cards move up a box when answered right.';
    const r3 = await I.importAll(st, I.listCards(boards).map(I.cardInput));
    assert.equal(r3.added[0].supersedes, r1.added[0].id);
  });

  await test('export → import gives back the same pages and sources, and never overwrites', async () => {
    const a = store();
    await I.importAll(a, [{ name: 'page.html', content: HTML }]);
    const [src] = await a.list('source');
    await a.put('page', { id: 'pg_spaced-repetition', title: 'Spaced Repetition', type: 'concept', tags: ['learning'], markdown: 'See [[Forgetting Curve]].', sourceIds: [src.id] });
    await a.put('page', { id: 'pg_forgetting-curve', title: 'Forgetting Curve', markdown: 'Memory fades.' });
    const files = M.exportFiles(await a.exportData(), now());
    const sr = files.find(f => f.name === 'pages/Spaced Repetition.md').data;
    assert.match(sr, /\nsources: \["src_/);
    assert.match(sr, /\n## 来源 Sources\n\n- \[\[Spaced repetition – Wiki\]\]\n/);
    const md = files.filter(f => f.name.endsWith('.md')).map(f => ({ name: f.name.split('/').pop(), content: f.data }));

    const b = store();
    const r = await I.importAll(b, md);
    assert.equal(r.added.length, 1, 'the source comes back as itself');
    assert.equal(r.added[0].id, src.id, 'same text → same id');
    assert.equal(r.added[0].origin.url, 'https://example.org/wiki/Spaced_repetition');
    assert.deepEqual(r.pages.map(p => p.status).sort(), ['added', 'added']);
    assert.equal(r.skipped.length, 2, 'index.md and log.md are left out');
    const back = await b.get('page', 'pg_spaced-repetition');
    assert.equal(back.markdown, 'See [[Forgetting Curve]].'); assert.deepEqual(back.sourceIds, [src.id]); assert.deepEqual(back.tags, ['learning']);
    assert.deepEqual(back.links, ['pg_forgetting-curve']);

    await b.put('page', Object.assign({}, back, { markdown: 'Edited here.' }), { baseRev: 1 });
    const again = await I.importAll(b, md);
    assert.equal(again.added.length, 0); assert.equal(again.duplicates.length, 1);
    assert.deepEqual(again.pages.map(p => p.page.id + ':' + p.status).sort(), ['pg_forgetting-curve:unchanged', 'pg_spaced-repetition:kept']);
    assert.equal((await b.get('page', 'pg_spaced-repetition')).markdown, 'Edited here.', 'an existing page is never overwritten by an import');
  });

  await test('limits and empty input', async () => {
    const st = store();
    const r = await I.importAll(st, [{ name: 'empty.txt', content: '   \n ' }, { name: 'big.txt', content: 'x'.repeat(900000) }, { name: 'x.html', content: '<html><body><script>1</script></body></html>' }]);
    assert.equal(r.added.length, 0); assert.equal(r.errors.length, 3);
    assert.match(r.errors[1], /800 KB/);
    const d = I.pageDraftFromSource({ id: 'src_x', kind: 'card', title: 'Leitner box', text: '# Leitner box\n\nCards move.' });
    assert.deepEqual(d, { title: 'Leitner box', type: 'note', markdown: 'Cards move.', sourceIds: ['src_x'] });
    assert.equal(M.planWrite('page', null, { id: 'pg_q', title: 'Q', sourceIds: ['nope'] }).code, 'invalid');
  });

  results.forEach(n => console.log('PASS: ' + n));
})().catch(e => { console.error(e); process.exitCode = 1; });
