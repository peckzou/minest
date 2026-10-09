// Learning Path 2.0 engine tests. The engine is read from the iPhone page itself (the code that ships):
//   node tools/learning-path/engine.test.mjs [iPhoneX.Y.html]
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const page = process.argv[2] || fs.readdirSync(repo).filter(f => /^iPhone\d+\.\d+\.html$/.test(f))
  .sort((a, b) => { const v = f => f.match(/(\d+)\.(\d+)/).slice(1).map(Number); const [a1, a2] = v(a), [b1, b2] = v(b); return a1 - b1 || a2 - b2; }).pop();
const html = fs.readFileSync(path.join(repo, page), 'utf8');
const at = html.indexOf('/* 44.7 Learning Path 2.0 · Engine');
if (at < 0) { console.error(page + ' has no Learning Path 2.0 engine'); process.exit(1); }
const code = html.slice(at, html.indexOf('</script>', at));
const sandbox = { module: { exports: {} } };
new Function('module', code)(sandbox.module);
const E = sandbox.module.exports;
console.log('engine from ' + page);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('✗ ' + m); } else console.log('✓ ' + m); };
const today = '2026-10-09', now = new Date(2026, 9, 9, 12).getTime();
const wordOf = t => (String(t).match(/[A-Za-z][A-Za-z' -]*[A-Za-z]|[A-Za-z]/) || [''])[0];
const hasWord = c => !!wordOf(c.title);

// cards: new, due review (recall stable), weak pron, mastered not due, 1.0 record
const mk = (id, extra) => Object.assign({ id, title: id + ' word', desc: 'the meaning of ' + id, mastery: 1 }, extra || {});
const sk = (lv, due, extra) => Object.assign({ lv, s: 3, due, reps: 2, lapses: 0, rtMs: 0, last: now - 3 * 864e5 }, extra || {});
const v2 = skills => ({ v: 2, studied: { count: 2, first: 1, last: 2 }, skills, history: [] });
const cNew = mk('apple');
const cDue = mk('bread', { learn: v2({ recall: sk(3, '2026-10-08'), meaning: sk(3, '2026-11-01'), pron: sk(3, '2026-11-01') }) });
const cWeakPron = mk('chair', { learn: v2({ recall: sk(3, '2026-11-01'), meaning: sk(3, '2026-11-01'), pron: sk(1, '2026-11-01') }) });
const cDone = mk('daisy', { learn: v2({ recall: sk(4, '2026-11-01'), meaning: sk(4, '2026-11-01'), pron: sk(4, '2026-11-01') }) });
const cV1 = mk('eagle', { mastery: 2, lastReviewed: now - 5 * 864e5, learn: { seen: 2, interval: 2, nextReview: '2026-10-07', history: [{ at: 1, g: 'again' }] } });
const o = { today, hasWord: true };

// --- Adaptive routing
ok(JSON.stringify(E.route(cNew, 'vocab', o).acts) === '["flash","quick"]', 'new card → Flash → Quick');
ok(JSON.stringify(E.route(cDue, 'vocab', o).acts) === '["quick"]', 'due review, recall stable → Quick only');
ok(JSON.stringify(E.route(cWeakPron, 'vocab', o).acts) === '["shadow"]', 'weak pronunciation → straight to Read Aloud');
ok(E.route(cDone, 'vocab', o).acts.length === 0, 'mastered and not due → not today');
ok(E.route(cWeakPron, 'vocab', { today, hasWord: false }).acts.length === 0, 'no English word → pronunciation not required');
const r1 = E.route(cV1, 'vocab', o);
ok(r1.acts.indexOf('quick') >= 0 && r1.acts.indexOf('shadow') >= 0, '1.0 record migrates: due recall + unmeasured skills → ' + r1.acts.join(','));
ok(JSON.stringify(E.route(cDue, 'vocab', { today, hasWord: true, avail: { flash: 1, quick: 1, shadow: 1, voiceQuiz: 1 } }).acts) === '["quick"]', 'with voice quiz available routing still fine');
const cMeaningDue = mk('fable', { learn: v2({ recall: sk(3, '2026-11-01'), meaning: sk(3, '2026-10-01'), pron: sk(3, '2026-11-01') }) });
ok(JSON.stringify(E.route(cMeaningDue, 'vocab', o).acts) === '["quick"]', 'meaning due, no voice quiz yet → Quick stands in');
ok(JSON.stringify(E.route(cMeaningDue, 'vocab', { today, hasWord: true, avail: { flash: 1, quick: 1, shadow: 1, voiceQuiz: 1 } }).acts) === '["voiceQuiz"]', 'meaning due + voice quiz → Voice Quiz');
ok(JSON.stringify(E.route(cNew, 'phonics', o).acts) === '["flash","shadow"]', 'phonics config: new → Flash → Read Aloud');
ok(JSON.stringify(E.route(mk('gamma', { date: '2026-10-09', learn: cDone.learn }), 'vocab', o).acts) === '["quick"]', 'board due date brings a mastered card in');

// --- Planning under a time budget
const many = [];
for (let i = 0; i < 200; i++) many.push(mk('new' + i));
for (let i = 0; i < 30; i++) many.push(mk('due' + i, { learn: v2({ recall: sk(3, '2026-10-0' + (1 + i % 8)), meaning: sk(3, '2026-11-01'), pron: sk(3, '2026-11-01') }) }));
for (let i = 0; i < 6; i++) many.push(mk('pron' + i, { learn: v2({ recall: sk(3, '2026-11-01'), meaning: sk(3, '2026-11-01'), pron: sk(1, '2026-11-01') }) }));
const pin = { cards: many, pathOf: () => 'vocab', hasWord, today };
for (const m of [5, 15, 30]) {
  const p = E.plan(Object.assign({ intent: 'auto', minutes: m }, pin));
  const ratio = p.estSec / (m * 60);
  const reviewsAll = m === 5 && p.picked.length === 36;
  ok((ratio > 0.8 || reviewsAll) && ratio <= 0.91, m + ' min plan uses ' + Math.round(ratio * 100) + '% of the time (' + p.picked.length + ' cards, stages ' + p.stages.map(s => s.act + ':' + s.ids.length).join(' ') + ')');
}
const p5 = E.plan(Object.assign({ intent: 'auto', minutes: 5 }, pin));
ok(p5.picked.every(x => x.why !== 'new'), '5 min: only the most important reviews, no new cards');
ok(p5.picked[0].id === 'pron0' || p5.picked.some(x => x.id.startsWith('due')), '5 min: weak / overdue first');
const pr = E.plan(Object.assign({ intent: 'review', minutes: 30 }, pin));
ok(pr.picked.every(x => x.why !== 'new'), 'review intent: no new cards');
const pn = E.plan(Object.assign({ intent: 'new', minutes: 15 }, pin));
const costOf = x => x.acts.reduce((t, a) => t + E.ACTS[a].cost, 0);
const newShare = pn.picked.filter(x => x.why === 'new').reduce((t, x) => t + costOf(x), 0) / pn.picked.reduce((t, x) => t + costOf(x), 0);
ok(newShare >= 0.65 && newShare < 1, 'new intent: ~70% of the time on new cards, the rest due (' + Math.round(newShare * 100) + '%)');
const pread = E.plan(Object.assign({ intent: 'read', minutes: 15 }, pin));
ok(pread.stages.length === 1 && pread.stages[0].act === 'shadow', 'read intent: Read Aloud only');
const order = E.plan(Object.assign({ intent: 'auto', minutes: 30 }, pin)).stages.map(s => s.act).join(',');
ok(order === 'flash,quick,shadow', 'stages batched in order: ' + order);
ok(E.plan({ cards: [cDone], pathOf: () => 'vocab', hasWord, today, minutes: 15 }).picked.length === 0, 'nothing due → empty plan');

// --- Grading + spaced review
const med = 2000;
ok(E.grade({ skill: 'recall', correct: true, rt: 900, rtMedian: med }) === 'easy', 'fast + correct → easy');
ok(E.grade({ skill: 'recall', correct: true, rt: 4000, rtMedian: med }) === 'hard', 'slow + correct → hard');
ok(E.grade({ skill: 'recall', correct: true, unsure: true }) === 'hard', 'unsure → hard');
ok(E.grade({ skill: 'recall', correct: false }) === 'again', 'wrong → again');
ok(E.grade({ skill: 'pron', score: 72 }) === 'again' && E.grade({ skill: 'pron', score: 86 }) === 'hard' && E.grade({ skill: 'pron', score: 93 }) === 'good' && E.grade({ skill: 'pron', score: 97 }) === 'easy', 'pronunciation bands');
const base = { lv: 3, s: 4, due: today, reps: 3, lapses: 0 };
const fast = E.update(base, 'easy', now, today), slow = E.update(base, 'hard', now, today), norm = E.update(base, 'good', now, today);
ok(fast.s > norm.s && norm.s > slow.s, 'same answer: fast → longer interval than slow (' + slow.s + ' < ' + norm.s + ' < ' + fast.s + ' days)');
const again = E.update(base, 'again', now, today);
ok(E.update(Object.assign({}, base, { s: 30, lv: 4 }), 'again', now, today).due === '2026-10-10', 'forgotten after a long interval → still tomorrow');
ok(again.due === '2026-10-10' && again.lapses === 1 && again.lv === 2, 'again → tomorrow, lapse counted, level down');
const lapsy = E.update(Object.assign({}, base, { lapses: 3 }), 'good', now, today);
ok(lapsy.s < norm.s, '≥ 3 lapses → shorter interval (' + lapsy.s + ' < ' + norm.s + ')');
let r = null; for (let i = 0; i < 4; i++) r = E.update(r, 'easy', now, today);
ok(r.lv === 5, 'easy several times over weeks → solid (Lv 5), s=' + r.s);
ok(E.update(null, 'good', now, today).due === '2026-10-11', 'new card, good → 2 days');

// --- Mastery = weakest required skill
let c = mk('hello');
c = Object.assign({}, c, { learn: E.apply(c, { studied: true }, now, today) });
ok(E.mastery(c, 'vocab', true) === 1, 'just seen → mastery 1');
c = Object.assign({}, c, { learn: E.apply(c, { skill: 'pron', score: 98, act: 'shadow' }, now, today) });
c = Object.assign({}, c, { learn: E.apply(c, { skill: 'pron', score: 98, act: 'shadow' }, now, today) });
ok(E.norm(c).skills.pron.lv >= 4 && E.mastery(c, 'vocab', true) <= 2, 'great pronunciation alone is not mastery (pron Lv ' + E.norm(c).skills.pron.lv + ', card ' + E.mastery(c, 'vocab', true) + ')');
ok(E.mastery(cDone, 'vocab', true) === 4, 'all skills Lv 4 → mastery 4');
ok(E.nextDue(cDue, 'vocab', true) === '2026-10-08', 'next due = earliest required skill');

// --- 1.0 migration
const m = E.norm(cV1);
ok(m.skills.recall && m.skills.recall.due === '2026-10-07' && m.skills.recall.lapses === 1, '1.0 interval/nextReview/again → recall skill');
ok(E.norm(mk('pp', { pron: { latest: 91, best: 93, attempts: 2 } })).skills.pron.lv === 4, '1.0 pron.best → pron skill');

// --- path detection
ok(E.detectPath([{ title: 'apple (苹果)' }, { title: 'bread' }, { title: 'chair' }], wordOf) === 'vocab', 'word list → vocab');
ok(E.detectPath([{ title: 'Photosynthesis converts light energy' }, { title: '光合作用的过程' }, { title: 'The water cycle has 4 stages' }], wordOf) === 'concept', 'concept list → concept');
// --- manual override (stars set by hand)
const ovCard = mk('ovr', { learn: Object.assign({}, cDone.learn, { override: { m: 2, at: now + 1000 } }) });
ok(E.mastery(ovCard, 'vocab', true) === 2, 'stars set by hand win over the skills');
ok(E.route(ovCard, 'vocab', o).acts.length > 0, 'set back to 2 by hand → studied again');
const ovHigh = mk('ovh', { learn: Object.assign({}, cWeakPron.learn, { override: { m: 5, at: now + 1000 } }) });
ok(E.route(ovHigh, 'vocab', o).acts.length === 0, 'set to 5 by hand → skipped');
const afterAnswer = Object.assign({}, ovCard, { learn: E.apply(ovCard, { skill: 'recall', correct: true }, now + 5000, today) });
ok(!E.overrideOf(afterAnswer.learn) && E.mastery(afterAnswer, 'vocab', true) === 4, 'the next real answer replaces it');
ok(E.mastery(mk('ov1', { mastery: 3, learn: { override: { m: 3, at: 5 } } }), 'vocab', true) === 3 && !E.isNew(mk('ov1', { learn: { override: { m: 3, at: 5 } } })), 'override on an unstudied card');
// --- Phase C: cards without a back, voice-only intent
const noBack = { id: 'nb', title: 'xylophone', mastery: 1, learn: v2({ recall: sk(3, '2026-11-01'), pron: sk(3, '2026-11-01') }) };
ok(E.route(noBack, 'vocab', o).acts.length === 0 && E.requiredSkills('vocab', true, E.hasBack(noBack)).indexOf('meaning') < 0, 'no back → meaning not required');
ok(E.hasBack({ title: 'apple (苹果)' }) && E.hasBack({ title: 'apple', desc: 'a fruit' }) && !E.hasBack({ title: 'apple' }), 'back detection');
const vq = E.plan(Object.assign({ intent: 'voice', minutes: 15, avail: { flash: 1, quick: 1, shadow: 1, voiceQuiz: 1 } }, pin));
ok(vq.stages.length === 1 && vq.stages[0].act === 'voiceQuiz' && vq.picked.length > 10, 'voice intent: one voice-quiz stage (' + vq.picked.length + ' cards)');
ok(E.plan(Object.assign({ intent: 'voice', minutes: 15 }, pin)).picked.length === 0, 'voice intent without a voice quiz → nothing');
ok(JSON.stringify(E.route(cMeaningDue, 'vocab', { today, hasWord: true, avail: { flash: 1, quick: 1, shadow: 1, voiceQuiz: 1 } }).acts) === '["voiceQuiz"]', 'meaning due + back → voice quiz');
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
