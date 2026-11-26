// node tools/santorini-69/tests/test_machines_unit.mjs — the pure part of ui/world-machines.js
import { createRequire } from 'module';
import assert from 'assert';
const P = createRequire(import.meta.url)('../../../ui/world-machines.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const Q = Math.PI / 2, near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

t('the eleven machines of the brief are listed, and all of them are ready', () => {
  assert.deepEqual(P.CATALOG.map((m) => m.no).sort(), ['03', '09', '10', '11', '12', '13', '14', '19', '20', '78', '79']);
  assert.ok(P.CATALOG.every((m) => m.ready));
  assert.equal(new Set(P.CATALOG.map((m) => m.id)).size, 11);
});

/* ---------------------------------------------------------------- shared physics */
t('let go while turning: it coasts the way it was going, slows, and settles exactly on a stop', () => {
  for (const step of [Q, 1]) for (const w0 of [7, -7, 2.5, -0.8, 0.2].map((w) => w * step / Q)) {
    const s = { a: 0.37 * step, w: w0, target: null }; let steps = 0; const a0 = s.a;
    while (P.spin(s, 1 / 60, step) && steps++ < 3000);
    assert.ok(steps < 3000, 'settles'); assert.equal(s.w, 0); assert.ok(near(s.a / step, Math.round(s.a / step), 1e-9), 'on a stop');
    if (Math.abs(w0) > 2 * step / Q) assert.equal(Math.sign(s.a - a0), Math.sign(w0), 'coasted the right way');
  }
  const fast = { a: 0, w: 8, target: null }, slow = { a: 0, w: 3, target: null };
  while (P.spin(fast, 1 / 60)); while (P.spin(slow, 1 / 60)); assert.ok(fast.a > slow.a, 'a harder flick turns it further');
});
t('the motor arrives exactly, never overshoots, and keeps a steady top speed', () => {
  for (const [a, tg] of [[0, 5], [3.2, -2], [7, 7.3]]) {
    const s = { a, w: 0, target: tg }; let top = 0, over = false, steps = 0;
    while (P.drive(s, 1 / 60, 1.8) && steps++ < 2000) { top = Math.max(top, Math.abs(s.w)); if ((tg - a) * (tg - s.a) < -1e-9) over = true; }
    assert.equal(s.a, tg); assert.ok(!over, 'no overshoot'); assert.ok(top <= 1.8 + 1e-9);
  }
});
t('the short way round a ring', () => {
  assert.equal(P.shortWay(0, 7, 8), -1); assert.equal(P.shortWay(0, 3, 8), 3); assert.equal(P.shortWay(15.2, 1, 8), 17);
  for (let f = 0; f < 8; f++) for (let to = 0; to < 8; to++) { const r = P.shortWay(f, to, 8); assert.ok(Math.abs(r - f) <= 4); assert.equal(P.mod(r, 8), to); }
});

/* ---------------------------------------------------------------- 03 carousel */
t('03 · 32 pockets, each its own place, dealt round the four faces', () => {
  const seen = new Set(), per = [0, 0, 0, 0];
  for (let s = 0; s < P.CAR.cap; s++) { const p = P.pocket(s); seen.add([p.face, p.tier, p.col].join()); per[p.face]++; }
  assert.equal(seen.size, 32); assert.deepEqual(per, [8, 8, 8, 8]);
  assert.deepEqual([0, 1, 2, 3].map((s) => P.pocket(s).face), [0, 1, 2, 3], 'four cards dress four faces');
  for (let f = 0; f < 4; f++) { assert.equal(P.faceAt(P.angleFor(f)), f); assert.equal(P.faceAt(P.angleFor(f) - 6 * Math.PI + 0.2), f); }
});

/* ---------------------------------------------------------------- 10 rolodex */
t('10 · each card goes over the top in its turn, springs a little past, and lands', () => {
  assert.equal(P.rolAngle(0), P.ROL.read); assert.equal(P.rolAngle(-1), P.ROL.lie);
  assert.ok(P.rolAngle(3) > P.rolAngle(1) && P.rolAngle(1) > P.rolAngle(0), 'the ones behind stand further back');
  assert.ok(P.rolAngle(-3) < P.rolAngle(-1), 'the ones passed lie further forward');
  let min = 999; for (let r = 0; r >= -1; r -= 0.01) min = Math.min(min, P.rolAngle(r));
  assert.ok(min < P.ROL.lie - 1, 'the spring past the landing'); assert.ok(min > P.ROL.lie - 12, 'a little, not a lot');
  for (let r = -6; r < 6; r += 0.05) assert.ok(Math.abs(P.rolAngle(r + 0.001) - P.rolAngle(r)) < 1, 'no jumps at ' + r.toFixed(2));
  for (let r = -30; r < 30; r += 0.5) { const x = P.rolAngle(r); assert.ok(x > P.ROL.flat - 13 && x <= P.ROL.back + 1e-9, 'never round under the hub: ' + r + ' → ' + x.toFixed(1)); }
  assert.ok(P.rolAngle(23) - P.rolAngle(22) < P.rolAngle(1) - P.rolAngle(0), 'deep in the stack the cards are pressed tighter');
  for (let a = 0; a < 6; a += 0.25) { const shown = [0, 1, 2, 3, 4, 5, 6].map((i) => P.rolAngle(i - a)); for (let i = 1; i < shown.length; i++) assert.ok(shown[i] >= shown[i - 1] - 9, 'no card passes through the next'); }
});

/* ---------------------------------------------------------------- 12 flip carousel */
t('12 · a ring of at least 10 places; the standing card falls under its weight, bounces once, then hangs', () => {
  assert.equal(P.flipRing(3), 10); assert.equal(P.flipRing(17), 17); assert.equal(P.flipRing(99), 30);
  assert.equal(P.flipFall(0), 90); assert.equal(P.flipFall(1), -90);
  const xs = Array.from({ length: 101 }, (_, i) => P.flipFall(i / 100));
  assert.ok(xs.slice(0, 50).every((x, i) => i === 0 || x <= xs[i - 1] + 1e-9), 'pushed slowly to the catch');
  assert.ok(xs[40] > 75, 'still standing just before the catch lets go'); assert.ok(xs[80] < 0, 'then it really falls');
  let bounce = false; for (let i = 82; i < 100; i++) if (xs[i + 1] > xs[i] + 1e-9) bounce = true; assert.ok(bounce, 'a bounce at the bottom');
  const fall1 = xs[60] - xs[70], fall2 = xs[70] - xs[80]; assert.ok(fall2 > fall1, 'it speeds up as it falls');
});
t('12 · every card has one place; the one that fell last hangs in front of all the others; nothing jumps', () => {
  const n = 12;
  for (const a of [0, 0.3, 4.75, 11.99]) {
    const st = Array.from({ length: n }, (_, i) => P.flipPose(i, a, n));
    assert.equal(st.filter((p) => p.state === 'falling').length + st.filter((p) => p.state === 'front').length <= 1, true, 'at most one card on the move (or exactly in front)');
    const hang = st.map((p, i) => ({ p, v: P.mod(a - i, n) })).filter((x) => x.p.state === 'hanging').sort((x, y) => x.v - y.v);
    const low = (p) => p.z + Math.cos(p.phi * Math.PI / 180) * P.FLP.ch;   // where the lower edge hangs
    for (let k = 1; k < hang.length; k++) { assert.ok(hang[k].p.z <= hang[k - 1].p.z + 1e-12, 'the newer is hinged in front'); assert.ok(low(hang[k].p) < low(hang[k - 1].p), 'the newer hangs in front'); }
    const stand = st.filter((p) => p.state === 'standing'); assert.ok(stand.every((p) => p.z < P.FLP.zf), 'standing cards are behind the front one');
    const zs = st.filter((p) => p.state === 'standing' || p.state === 'front').map((p) => p.z).sort(); for (let k = 1; k < zs.length; k++) assert.ok(zs[k] - zs[k - 1] >= P.FLP.ct, 'standing cards do not go through each other');
  }
  const rad = (d) => d * Math.PI / 180;
  for (let i = 0; i < n; i++) for (let a = 0; a < n; a += 0.02) {
    const p = P.flipPose(i, a, n), q = P.flipPose(i, a + 0.02, n);
    assert.ok(Math.hypot(Math.cos(rad(p.phi)) - Math.cos(rad(q.phi)), Math.sin(rad(p.phi)) - Math.sin(rad(q.phi))) < 0.5 && Math.abs(p.z - q.z) < 0.01, 'card ' + i + ' jumps at ' + a.toFixed(2));
  }
  assert.equal(P.flipPose(5, 5, n).state, 'front'); assert.equal(P.flipPose(4, 5, n).state, 'hanging'); assert.equal(P.flipPose(4, 4.6, n).state, 'falling');
  assert.equal(P.flipPose(6, 5, n).state, 'standing');
});

/* ---------------------------------------------------------------- 20 paternoster */
t('20 · the chain is one closed loop, and it is continuous', () => {
  const p0 = P.patPath(0), pL = P.patPath(P.PAT.L - 1e-9); assert.ok(near(p0.y, pL.y, 1e-6) && near(p0.z, pL.z, 1e-6), 'closed');
  for (let s = 0; s < P.PAT.L; s += 0.01) { const a = P.patPath(s), b = P.patPath(s + 0.01); assert.ok(Math.hypot(a.y - b.y, a.z - b.z) <= 0.0101, 'no jump at ' + s.toFixed(2)); }
  const runs = new Set(); for (let s = 0; s < P.PAT.L; s += 0.05) runs.add(P.patPath(s).run); assert.deepEqual([...runs], ['front', 'top', 'back', 'bottom']);
});
t('20 · eight trays: never two in one place, tray t stops at the window at position t, all of them level', () => {
  for (const a of [0, 0.5, 3.25, 7.9]) {
    const ps = Array.from({ length: 8 }, (_, t) => P.patTray(t, a));
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) assert.ok(Math.hypot(ps[i].y - ps[j].y, ps[i].z - ps[j].z) > 0.3, 'trays ' + i + ',' + j + ' apart at ' + a);
  }
  const win = P.patPath(P.PAT.win); for (let t2 = 0; t2 < 8; t2++) { const p = P.patTray(t2, t2); assert.ok(near(p.y, win.y) && near(p.z, win.z)); assert.equal(p.run, 'front'); }
});
t('20 · 24 places: 3 to a tray, each its own; every tray knows its number and its load', () => {
  const seen = new Set(); for (let s = 0; s < P.PAT.cap; s++) { const q = P.patSlot(s); seen.add(q.tray + ':' + q.k); assert.ok(q.tray < 8 && q.k < 3); } assert.equal(seen.size, 24);
  assert.deepEqual(P.patLoad(7).map((x) => x.items), [3, 3, 1, 0, 0, 0, 0, 0]); assert.deepEqual(P.patLoad(7).map((x) => x.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(P.patLoad(24).reduce((a, x) => a + x.items, 0), 24); assert.equal(P.patLoad(40).reduce((a, x) => a + x.items, 0), 24);
});

/* ---------------------------------------------------------------- order and the record */
t('order: the list\'s own, A–Z, or yours — a list that changed is followed, nothing is lost or doubled', () => {
  const cards = ['b', 'a', 'c', 'd'].map((x) => ({ ref: 'L/' + x, title: x }));
  assert.deepEqual(P.orderRefs(cards, { order: 'list' }), ['L/b', 'L/a', 'L/c', 'L/d']);
  assert.deepEqual(P.orderRefs(cards, { order: 'title' }), ['L/a', 'L/b', 'L/c', 'L/d']);
  assert.deepEqual(P.orderRefs(cards, { order: 'custom', it: ['L/d', 'L/gone', 'L/a', 'L/d'] }), ['L/d', 'L/a', 'L/b', 'L/c']);
  assert.deepEqual(P.swapped(['x', 'y', 'z'], 0, 2), ['z', 'y', 'x']); assert.equal(P.pages(33, 32), 2); assert.equal(P.pages(0, 32), 1);
  assert.deepEqual(cards.map((c) => c.ref), ['L/b', 'L/a', 'L/c', 'L/d'], 'the list itself is untouched');
});
t('the record keeps choices only; a 1.0 carousel record still reads', () => {
  const m = P.cleanMx({ type: 'paternoster', list: 7, order: 'custom', it: ['a', 2], pos: 5.4, page: -3, auto: 1, angle: 1.234, speed: 9, evil: () => 1 });
  assert.deepEqual(m, { v: 2, type: 'paternoster', list: '7', order: 'custom', pos: 5, page: 0, auto: true, it: ['a', '2'] });
  const old = P.cleanMx({ v: 1, type: 'carousel', list: 'L', face: 3, order: 'list', page: 0, auto: false }); assert.equal(old.pos, 3, '1.0 kept the face as "face"');
  assert.equal(P.cleanMx({ type: 'carousel', pos: -1 }).pos, 3);
  assert.equal(P.cleanMx({ type: 'hologram' }).unknown, 'hologram'); assert.equal(P.cleanMx({ type: 'hologram' }).type, 'carousel', 'an unknown machine shows as the first one, its name kept');
  const c = P.cleanMx({ type: 'sorter', cfg: { rule: 'label', man: { 'L/a': 2, 'L/b': 'x', bad: {} }, dr: [1, 2, NaN, 'q'], f: () => 1, deep: { a: { b: 1 } } } }).cfg;
  assert.deepEqual(c, { rule: 'label', man: { 'L/a': 2, 'L/b': 'x' }, dr: [1, 2, 'q'], deep: {} }, 'cfg keeps plain values only');
  assert.equal(P.cleanMx({ order: 'list', it: ['a'] }).it, undefined); assert.equal(P.initial('apple'), 'A'); assert.equal(P.initial('发现'), '发');
});

/* ---------------------------------------------------------------- phase 3 */
t('14 · gondola i is at the bottom when a = i; all of them round the wheel, evenly', () => {
  for (const n of [6, 9, 12]) for (let i = 0; i < n; i++) { const t2 = P.ferAngle(i, i, n); assert.ok(near(Math.cos(t2), 0) && near(Math.sin(t2), -1)); }
  const n = 8, a = 2.3, ang = Array.from({ length: n }, (_, i) => P.ferAngle(i, a, n)); for (let i = 1; i < n; i++) assert.ok(near(ang[i] - ang[i - 1], 2 * Math.PI / n));
  assert.equal(P.ferRing(2), 6); assert.equal(P.ferRing(40), 12);
});
t('19 · records stand evenly from one end of the crate to the other', () => {
  assert.ok(near(P.jbxX(0, 24), P.JBX.x0) && near(P.jbxX(23, 24), P.JBX.x1));
  const xs = Array.from({ length: 24 }, (_, s) => P.jbxX(s, 24)); for (let s = 1; s < 24; s++) assert.ok(xs[s] - xs[s - 1] > P.JBX.ct * 2, 'no two records in one place');
});
t('11 · one bin a group; too many groups share bins in order; every item in exactly one bin', () => {
  const mk = (ts) => ts.map((x, i) => ({ ref: 'L/' + i, title: x, list: i % 2 ? 'Odd' : 'Even', labels: i % 3 ? ['l-green'] : [], mastery: i % 5, done: i === 7 }));
  const cards = mk('apple ant bee cat dog eel fox goat hen ibis jay kiwi lynx mole newt owl pig quail ram seal tiger urchin vole wolf yak zebra'.split(' '));
  for (const rule of ['initial', 'list', 'label', 'study', 'custom']) {
    const s = P.sortBins(cards, rule); assert.ok(s.bins.length >= 1 && s.bins.length <= 6, rule);
    const all = s.bins.flatMap((b) => b.refs); assert.equal(all.length, cards.length); assert.equal(new Set(all).size, cards.length, rule + ': no item lost or doubled');
    cards.forEach((c) => assert.ok(s.bins[s.binOf[c.ref]].refs.includes(c.ref)));
  }
  const ini = P.sortBins(cards, 'initial'); assert.equal(ini.bins.length, 6); assert.equal(ini.bins[0].label.split('–')[0], 'A'); assert.equal(ini.bins[5].label.split('–').pop(), 'Z');
  assert.deepEqual(P.sortBins(cards, 'list').bins.map((b) => b.label), ['Even', 'Odd']);
  assert.deepEqual(P.sortBins(cards, 'label').bins.map((b) => b.label).sort(), ['无标签', '绿'].sort());
  assert.ok(P.sortBins(cards, 'study').bins.every((b) => !/^\d /.test(b.label)), 'labels without their sort prefix');
  const moved = P.sortBins(cards, 'initial', { 'L/0': 5 }); assert.equal(moved.binOf['L/0'], 5, 'the user\'s own move wins');
  assert.equal(moved.bins.flatMap((b) => b.refs).length, cards.length);
  const cu = P.sortBins(cards, 'custom', { 'L/3': 2, 'L/4': 9 }); assert.equal(cu.binOf['L/3'], 2); assert.equal(cu.binOf['L/4'], 5); assert.equal(cu.binOf['L/5'], 0);
  const ord = P.sortedOrder(ini); assert.equal(ord.length, cards.length); assert.equal(new Set(ord).size, cards.length);
  for (const b of ini.bins) for (let k = 1; k < b.refs.length; k++) assert.ok(+b.refs[k].slice(2) > +b.refs[k - 1].slice(2), 'in a bin they keep the order they came');
  assert.equal(P.hasStudy([{ mastery: 0 }]), false); assert.equal(P.hasStudy([{ done: true }]), true);
});
t('11 · an item goes waiting → onto the belt → along it → pushed → into the bin, in that order', () => {
  const seq = []; for (let a = 0; a <= 5; a += 0.01) seq.push(P.srtStage(2, a));
  for (let k = 1; k < seq.length; k++) assert.ok(seq[k] >= seq[k - 1]); assert.deepEqual([...new Set(seq)], [0, 1, 2, 3, 4, 5]);
  assert.equal(P.srtStage(3, 2.5), 0, 'the next one still waits while one is on its way');
});
t('09 · a module turns flap by flap round its drum, never jumps; other characters have their own run', () => {
  assert.deepEqual(P.flapSeq('A', 'A'), []); assert.deepEqual(P.flapSeq('A', 'D'), ['B', 'C', 'D']);
  const back = P.flapSeq('D', 'A'); assert.equal(back[back.length - 1], 'A'); assert.equal(back.length, P.DRUM.length - 3, 'it can only go forward, all the way round');
  const zh = P.flapSeq(' ', '发', 5); assert.equal(zh.length, 5); assert.equal(zh[4], '发'); assert.equal(P.flapSeq('发', 'B').pop(), 'B');
  assert.deepEqual(P.sfLine('ab c', 6), ['A', 'B', ' ', 'C', ' ', ' ']);
  const long = P.sfLine('Phonemic Awareness', 8); assert.equal(long.length, 8); assert.equal(long[7], '…', 'too long: it says so, it does not just stop');
  assert.deepEqual(P.sfLine('发现世界', 5), ['发', '现', '世', '界', ' ']);
});
t('13 · the ring: A–Z for a Latin list, else the list\'s own characters; words are spelled exactly, long ones part by part', () => {
  const lat = P.drumRing(['Hello World', 'Abc']); assert.equal(lat.join(''), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ·'); assert.ok(P.drumRing(['Tier 2']).includes('2'));
  const zh = P.drumRing(['发现世界', '世界地图']); assert.equal(zh[0], ' '); assert.equal(zh[1], '世'); assert.ok(zh.includes('发') && zh.includes('图')); assert.ok(zh.length <= P.WDR.maxRing);
  const w = P.drumWord('cat', lat, 8, 0); assert.equal(w.faces.length, 8); assert.equal(P.drumRead(w.faces, lat), 'CAT'); assert.equal(w.chunks, 1);
  const lw = P.drumWord('Phonemic Awareness', lat, 8, 0); assert.equal(lw.chunks, 3); assert.equal(P.drumRead(lw.faces, lat), 'PHONEMIC');
  assert.equal(P.drumRead(P.drumWord('Phonemic Awareness', lat, 8, 1).faces, lat), 'AWARENES'); assert.equal(P.drumRead(P.drumWord('Phonemic Awareness', lat, 8, 2).faces, lat), 'S');
  assert.equal(P.drumRead(P.drumWord('x(y)', lat, 8, 0).faces, lat), 'X·Y·', 'a character not on the ring shows as ·, never something else');
  assert.equal(P.forward(5, 2, 27), 29); assert.ok(P.forward(5, 2, 27) >= 5, 'forward only'); assert.equal(P.forward(25, 2, 27), 29); assert.equal(P.mod(P.forward(25, 2, 27), 27), 2);
});

/* ---------------------------------------------------------------- phase 4 */
const boxes = (L, items) => L.pos.map((p, i) => ({ x0: p.x - items[i].w * L.k / 2, x1: p.x + items[i].w * L.k / 2, y0: p.y - P.RTY.h * L.k / 2, y1: p.y + P.RTY.h * L.k / 2 }));
const overlap = (a, b) => a.x0 < b.x1 - 1e-9 && b.x0 < a.x1 - 1e-9 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;
t('78 · every word has a place in every composition; flat ones fit the stage and no two words cover each other', () => {
  for (const n of [1, 5, 16, 24]) for (const ng of [1, 3, 6, 8]) {
    const items = Array.from({ length: n }, (_, i) => ({ w: 0.2 + ((i * 37) % 7) * 0.12, g: i % ng }));
    for (const mode of ['cloud', 'groups', 'ring', 'line']) {
      const L = P.rtLayout(mode, items, ng); assert.equal(L.pos.length, n, mode);
      L.pos.forEach((p) => { assert.ok([p.x, p.y, p.z].every(Number.isFinite), mode); assert.ok(p.y > 0.25 && p.y < 2.1, mode + ' height ' + p.y); assert.ok(Math.abs(p.x) < 1.25 && Math.abs(p.z) < 1, mode + ' width'); });
      if (mode !== 'ring') {   // the ring is round in depth; every other composition is read flat
        const b = boxes(L, items); b.forEach((q) => assert.ok(q.x0 >= -P.RTY.W / 2 - 1e-6 && q.x1 <= P.RTY.W / 2 + 1e-6, mode + ' inside the stage'));
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) assert.ok(!overlap(b[i], b[j]), mode + ' words ' + i + ',' + j + ' overlap (n=' + n + ', groups=' + ng + ')');
        assert.ok(L.k >= 0.45, 'still readable: scale ' + L.k + ' (n=' + n + ', groups=' + ng + ', ' + mode + ')');
      }
    }
    const G = P.rtLayout('groups', items, ng); assert.equal(G.labels.length, new Set(items.map((it) => it.g)).size, 'one label per group that has words');
    G.labels.forEach((lb) => { items.forEach((it, i) => { if (it.g !== lb.g) return; const p = G.pos[i]; assert.ok(p.y < lb.y && p.y > lb.y - 9 * (P.RTY.h + P.RTY.gap) * G.k, 'a group\'s words are under its own label'); }); });
  }
  assert.deepEqual(P.rtLayout('cloud', [], 1).pos, []);
});
t('78 · grouping rules, including word length', () => {
  const cards = ['go', 'apple tree', 'a very long phrase of words', 'b'].map((x, i) => ({ ref: 'L/' + i, title: x }));
  const s = P.sortBins(cards, 'length'); assert.deepEqual(s.bins.map((b) => b.label), ['短', '中', '长']); assert.equal(s.binOf['L/2'], 2);
});
t('79 · a list is told as a story only when it reads like one', () => {
  assert.ok(P.comicNarrative(['1. Plan', '2. Build', '3. Test'])); assert.ok(P.comicNarrative(['Step one', 'Step two', 'Step three']));
  assert.ok(P.comicNarrative(['第一章 出发', '第二章 相遇', '第三章 回家'])); assert.ok(P.comicNarrative(['1066 Hastings', '1215 Magna Carta', '1492 Columbus']));
  assert.ok(!P.comicNarrative(['Apple', 'Banana', 'Cherry'])); assert.ok(!P.comicNarrative(['Phonemic Awareness', 'Syntax & Grammar Scaffolds', 'Tier 2 Words']));
  assert.ok(!P.comicNarrative(['1. only one'])); assert.ok(!P.comicNarrative(['1. a', 'b', 'c']), 'one marked item is not a story');
});
t('79 · panels hang apart: no two cover each other, all on the stage', () => {
  for (let n = 1; n <= P.CMX.cap; n++) {
    const L = P.comicLayout(n); assert.equal(L.length, n);
    for (let i = 0; i < n; i++) { const a = L[i]; assert.ok(Math.abs(a.x) + P.CMX.w / 2 < 1.5 && a.y - P.CMX.h / 2 > 0.1 && a.y + P.CMX.h / 2 < 2.0, 'on the stage'); for (let j = i + 1; j < n; j++) { const b = L[j]; assert.ok(Math.abs(a.x - b.x) >= P.CMX.w || Math.abs(a.y - b.y) >= P.CMX.h, 'panels ' + i + ',' + j); } }
    for (let i = 1; i < n; i++) { const a = L[i - 1], b = L[i]; assert.ok(b.y < a.y - 1e-9 || (Math.abs(b.y - a.y) < 1e-9 && b.x > a.x), 'read left to right, top to bottom'); }
  }
});

t('every machine has everything the operating view calls (read from the source)', () => {
  const src = createRequire(import.meta.url)('fs').readFileSync(new URL('../../../ui/world-machines.js', import.meta.url), 'utf8');
  const need = ['size', 'cap', 'step', 'build', 'apply', 'aOf', 'posOf', 'target', 'front', 'where', 'cam', 'hint'], seen = [];
  for (const m of src.matchAll(/\n  DRV\.(\w+) = \{/g)) {
    let i = m.index + m[0].length, depth = 1; while (depth) { const ch = src[i++]; depth += (ch === '{') - (ch === '}'); }
    const body = src.slice(m.index + m[0].length, i); seen.push(m[1]);
    for (const k of need) assert.ok(new RegExp('(^|[\\s,{])' + k + '\\s*:').test(body), m[1] + ' has no ' + k);
  }
  assert.deepEqual(seen.sort(), P.CATALOG.map((c) => c.id).sort(), 'a driver for every machine in the catalogue');
});
console.log(n + ' passed');
