"""My World · generation fixes (step 1 of the 53.811 brief): Arrange → Buildings & rooms sorts a teaching board right
and sets its buildings apart. Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.

- Labels: a thing's labels count by their names (board.labelDefinitions); a bare colour id such as "l-orange" no longer
  reads as the word "orange" (Speaking / Writing went to "Fruit & groceries" → the kitchen).
- Knowledge: language and teaching words — speaking, writing, phonics, pedagogy, scaffolds, rubrics, TEKS / ELPS, EC-6,
  and 学 / 课 / 词 / 拼音 / 阅读 / 写作… — sort a thing (or a list / area named so) into Knowledge & notes.
- Knowledge goes to a school's classroom (the bell-tower school, whose rooms are classroom · reading · games),
  not the house's study.
- New buildings keep 2 blocks of air from other buildings; when there is no such place the island grows first,
  and only then a building may stand closer.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')

def rep(a, b):   # re-runnable: a change that is already in is skipped
    global s
    if b in s or (a not in s and '53.83' in s): return   # already in (a later step may have reworded it)
    assert s.count(a) == 1, (a[:80], s.count(a)); s = s.replace(a, b)
rep1 = rep

rep1("""function words(t) { var s = t.s || {}, cv = s.cover || {}; return [s.title, s.desc, cv.title, (s.labels || []).join(' ')]""",
    """function labName(id) {   // 53.83 · labels by name: a bare colour id ("l-orange") is not a word about the thing
    var b = board(V && V.bid), d = (b && b.labelDefinitions || []).filter(function (x) { return x && String(x.id) === String(id); })[0], n = d && (d.name || d.title);
    return n && !/^#/.test(n) ? String(n) : (/^l-|^label-|^[0-9a-f-]{8,}$/i.test(String(id)) ? '' : String(id)); }
  function words(t) { var s = t.s || {}, cv = s.cover || {}; return [s.title, s.desc, cv.title, (s.labels || []).map(labName).join(' ')]""")

rep1("""  var CAT = {}; CATS.forEach(function (c, i) { CAT[c[0]] = { id: c[0], n: c[1], ic: c[2], k: c[3], re: c[4], lre: c[5], at: i }; });""",
    """  (function () {   // 53.83 · a teacher's board: language and teaching words are knowledge too
    var KN2 = CATS.filter(function (c) { return c[0] === 'knowledge'; })[0], r0 = KN2[4], l0 = KN2[5];
    var R1 = /\\b(speak\\w*|writ(e|es|ing|ten)|listen\\w*|pronunc\\w*|dictation|phonem\\w*|phonolog\\w*|morpholog\\w*|decod\\w*|fluency|comprehension|literacy|pedagog\\w*|scaffold\\w*|instruction\\w*|assess\\w*|rubric\\w*|diagnostic\\w*|syllab\\w*|sentence\\w*|discourse|cohesion|synthesis|retrieval|metacogn\\w*|taxonom\\w*|review\\w*|curricul\\w*|teks|elps|esl|ec-?6|anchor charts?|exit tickets?|running records?|sight words?|context clues?|competenc\\w*)\\b|[学课词]|拼音|汉字|阅读|写作|口语|听力|语法|知识|复习|考试|教学/i;
    var L1 = /english|language|literacy|pedagog|teach|ec-?6|reading|writing|grammar|phonics|review|exam|vocab|foundation|中文|英语|语文|课程|学习|教学/i;
    KN2[4] = { test: function (t) { return r0.test(t) || R1.test(t); } };
    KN2[5] = { test: function (t) { return l0.test(t) || L1.test(t); } };
  })();
  var CAT = {}; CATS.forEach(function (c, i) { CAT[c[0]] = { id: c[0], n: c[1], ic: c[2], k: c[3], re: c[4], lre: c[5], at: i }; });""")

rep1("""  function roomFor(g) { return (V.d.groom || {})[g.id] || ROOM_FOR[g.id] || 'living'; }""",
    """  ROOM_FOR.knowledge = 'classroom'; BLD_FOR_ROOM.classroom = 'school'; BLD_FOR_ROOM.reading = 'school'; CLUSTER.school = ['School', 'school'];   // 53.83 · knowledge goes to school
  function roomFor(g) { return (V.d.groom || {})[g.id] || ROOM_FOR[g.id] || 'living'; }""")

rep1("""var kind = CLUSTER[cl][1]; ensureBld(kind); b = { id: uid(), k: kind, x: 0, y: 0, f: I.rot, s: /^bld:/.test(kind) ? 1.25 : 1, it: [], cluster: cl, roomsInit: 1 };
        var ok = false; for (var t = 0; t < 4 && !ok; t++) { ok = freeSpot(b, 1) || freeSpot(b); if (!ok && !growLand()) break; }""",
    """var kind = CLUSTER[cl][1]; ensureBld(kind); b = { id: uid(), k: kind, x: 0, y: 0, f: I.rot, s: /^bld:/.test(kind) ? 1.25 : 1, it: [], cluster: cl, roomsInit: 1 };
        var ok = false; for (var t = 0; t < 4 && !ok; t++) { ok = freeSpot(b, 2); if (!ok && !growLand()) { ok = freeSpot(b, 1) || freeSpot(b); break; } }   // 53.83 · 2 blocks of air; grow before squeezing""")

# ---- small groups do not get a building of their own; new buildings stand 1 block in from the island's edge ----------
rep("""    var byRoom = {}, order = []; plan.groups.forEach(function (g) { if (!g.on) return; var rk = roomFor(g);""",
    """    var main = plan.groups.filter(function (g) { return g.on; }).sort(function (a, b2) { return b2.refs.length - a.refs.length; })[0];   // 53.83 · a group of 1–2 things joins the main group's room
    function rkOf(g) { var rk = roomFor(g); if (main && g !== main && g.refs.length < 3 && !(V.d.groom || {})[g.id] && !clusterBld(BLD_FOR_ROOM[rk] || 'home')) rk = roomFor(main); return rk; }
    var byRoom = {}, order = []; plan.groups.forEach(function (g) { if (!g.on) return; var rk = rkOf(g);""")
rep("""ok = freeSpot(b, 2); if (!ok && !growLand())""",
    """ok = inEdge(function () { return freeSpot(b, 2); }); if (!ok && !growLand())""")
rep("""  function buildApply(plan) {""",
    """  function inEdge(fn) {   // 53.83 · search 1 block in from the island's edge (a building's picture is wider than its plot)
    var lb = V.lb, ok; if (!lb || lb.x1 - lb.x0 < 8 || lb.y1 - lb.y0 < 8) return fn();
    V.lb = { x0: lb.x0 + 1, y0: lb.y0 + 1, x1: lb.x1 - 1, y1: lb.y1 - 1 }; try { ok = fn(); } finally { V.lb = lb; } return ok; }
  function buildApply(plan) {""")

# ---- cards are things: a card without sub-cards is an item of its Kanban list (column); a card with a stack stays a
#      group of its own. Refs of these items are "<column id>/<card id>". The island stays a read-only projection;
#      only Quick edit (an explicit edit) writes the card back. ------------------------------------------------------------
if '53.83 · cards are things' not in s:
    rep("""  function lists(b) { var out = []; (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id && !isHead(k.id)) out.push({ k: k, col: c }); }); }); return out; }""",
        """  function lists(b) {   // 53.83 · cards are things: plain cards are the items of their Kanban list; a card with sub-cards is a group
    var out = []; (b && b.columns || []).forEach(function (c) { var plain = [];
      (c.cards || []).forEach(function (k) { if (!k || !k.id || isHead(k.id)) return; if (k.stack && k.stack.length) out.push({ k: k, col: c }); else plain.push(k); });
      if (plain.length) out.push({ k: { id: c.id, title: c.title || 'List', stack: plain, native: 1 }, col: c, native: 1 }); });
    return out; }""")
    rep("""  function find(b, card, sid) { var hit = null; (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id === card) (k.stack || []).forEach(function (s) { if (s.id === sid) hit = { k: k, s: s }; }); }); }); return hit; }""",
        """  function find(b, card, sid) { var hit = null; (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id === card) (k.stack || []).forEach(function (s) { if (s.id === sid) hit = { k: k, s: s }; }); if (!hit && c.id === card && k && k.id === sid) hit = { k: { id: c.id, title: c.title }, s: k }; }); }); return hit; }   // 53.83 · a plain card is a thing of its list (column)""")
    rep("""cards: (c.cards || []).map(function (k) { return k && k.id === card ? Object.assign({}, k, { stack: (k.stack || []).map(function (s) { return s.id === sid ? fn(Object.assign({}, s)) : s; }) }) : k; }) }); }) }); });""",
        """cards: (c.cards || []).map(function (k) { if (c.id === card && k && k.id === sid) return fn(Object.assign({}, k)); return k && k.id === card ? Object.assign({}, k, { stack: (k.stack || []).map(function (s) { return s.id === sid ? fn(Object.assign({}, s)) : s; }) }) : k; }) }); }) }); });""")

# ---- Buildings & rooms keeps each Kanban list together: a list is one group, it goes to the room that suits the list
#      (its things vote: the category most of them sort into), several lists may share a room. ----------------------
rep("""        if (mode === 'list') { gid = 'l:' + L.k.id; why = 'its list'; if (!G[gid]) { G[gid] = { id: gid, n: String(L.k.title).replace(/^my\\s+/i, ''), ic: '🗂️', k: suitFor(L.k.title, L.col && L.col.title, V.bid), refs: [], on: true }; order.push(gid); } }""",
    """        if (mode === 'list' || mode === 'build') { gid = 'l:' + L.k.id; why = 'its list'; if (!G[gid]) { var lc = mode === 'build' ? listCat(L, themeKinds) : null;   // 53.83 · a Kanban list stays together; its things vote for its room
            G[gid] = { id: gid, n: (mode === 'build' && (d.gname || {})[gid]) || String(L.k.title).replace(/^my\\s+/i, ''), ic: lc ? CAT[lc].ic : '🗂️', k: (mode === 'build' && (d.gkind || {})[gid]) || (lc && !suit(L.k.title) ? CAT[lc].k : suitFor(L.k.title, L.col && L.col.title, V.bid)), cat: lc, refs: [], on: !(mode === 'build' && (d.goff || {})[gid]) }; order.push(gid); } }""")
rep("""    if (mode !== 'list') {   // a group of one joins where the rest of its list went""",
    """    if (mode === 'build') order.sort(function (a, b2) { return (CAT[G[a].cat] || CAT.other).at - (CAT[G[b2].cat] || CAT.other).at; });   // 53.83 · related lists side by side
    if (mode === 'smart') {   // a group of one joins where the rest of its list went""")
rep("""  function makePlan(mode) {""",
    """  function listCat(L, themeKinds) {   // 53.83 · the category most of a list's things sort into (their own names count most)
    var cnt = {}; (L.k.stack || []).forEach(function (s) { if (!s || !s.id) return; var r = sortOne(L.k.id + '/' + s.id, themeKinds); if (r.cat !== 'other') cnt[r.cat] = (cnt[r.cat] || 0) + (r.why === 'its name' ? 1 : .8); });
    var best = 'other', bs = 0; Object.keys(cnt).forEach(function (k) { if (cnt[k] > bs || (cnt[k] === bs && CAT[k].at < CAT[best].at)) { bs = cnt[k]; best = k; } }); return best; }
  function makePlan(mode) {""")
rep("""  function roomFor(g) { return (V.d.groom || {})[g.id] || ROOM_FOR[g.id] || 'living'; }""",
    """  function roomFor(g) { return (V.d.groom || {})[g.id] || ROOM_FOR[g.id] || ROOM_FOR[g.cat] || 'living'; }""")
rep("""(P.mode === 'list' ? P.groups : CATS.map(""", """(P.mode === 'list' || P.mode === 'build' ? P.groups : CATS.map(""")
rep("""if (P.mode !== 'list') { V.d.cat = V.d.cat || {}; V.d.cat[ref] = to; save(); }""", """if (P.mode === 'smart') { V.d.cat = V.d.cat || {}; V.d.cat[ref] = to; save(); }""")
rep("""(P.mode === 'build' ? 'Sorted by what each thing is, then each group goes into the room it belongs in — the buildings and rooms are made for you. Change a group’s room, or tap a thing to move it.'""",
    """(P.mode === 'build' ? 'Each Kanban list stays together and goes into the room that suits it — the buildings and rooms are made for you. Change a list’s room, or tap a thing to move it.'""")

# ---- a room holds up to 3 lists / ~24 things; more lists of the same kind open "Gallery hall 2", "3"… in the same building
rep("""    var byRoom = {}, order = []; plan.groups.forEach(function (g) { if (!g.on) return; var rk = rkOf(g); if (!byRoom[rk]) { byRoom[rk] = []; order.push(rk); } byRoom[rk].push(g); });
    order.forEach(function (rk) {
      var cl = BLD_FOR_ROOM[rk] || 'home', b = clusterBld(cl);""",
    """    var byRoom = {}, order = []; plan.groups.forEach(function (g) { if (!g.on) return; var rk = rkOf(g); if (!byRoom[rk]) { byRoom[rk] = []; order.push(rk); } byRoom[rk].push(g); });
    if (plan.mode === 'build') { var o2 = [], b2 = {}; order.forEach(function (rk) {   // 53.83 · a room holds up to 3 lists / ~24 things, then a second room of the kind
      var n = 1, cur = null, cnt = 0, lsN = 0; byRoom[rk].forEach(function (g) { if (cur && (lsN >= 3 || cnt + g.refs.length > 24)) { n++; cur = null; } if (!cur) { var key = n > 1 ? rk + '#' + n : rk; cur = b2[key] = []; o2.push(key); cnt = 0; lsN = 0; } cur.push(g); cnt += g.refs.length; lsN++; }); });
      byRoom = b2; order = o2; }
    order.forEach(function (rk) {
      var nth = +(rk.split('#')[1] || 1), rk0 = rk; rk = rk.split('#')[0];
      var cl = BLD_FOR_ROOM[rk] || 'home', b = clusterBld(cl);""")
rep("""        if (!ok) { byRoom[rk].forEach(function (g) { left += g.refs.length; }); return; }""",
    """        if (!ok) { byRoom[rk0].forEach(function (g) { left += g.refs.length; }); return; }""")
rep("""      var room = (b.rooms || []).filter(function (r) { return r.k === rk; })[0];""",
    """      var room = (b.rooms || []).filter(function (r) { return r.k === rk && (r.nth || 1) === nth; })[0];""")
rep("""      if (!room) { var T = ROOMS[rk] || ROOMS.hall; room = { id: 'r' + uid().slice(1), k: rk, n: T[0], fl: upstairs""",
    """      if (!room) { var T = ROOMS[rk] || ROOMS.hall; room = { id: 'r' + uid().slice(1), k: rk, n: T[0] + (nth > 1 ? ' ' + nth : ''), nth: nth > 1 ? nth : undefined, fl: upstairs""")
rep("""      var res = withD(room.d, function () { return placeGroups(byRoom[rk], 'build'); }); pieces += res.made; left += res.left;""",
    """      var res = withD(room.d, function () { return placeGroups(byRoom[rk0], 'build'); }); pieces += res.made; left += res.left;""")

# ---- the list's own name votes too (half a vote per thing), so "… Media Literacy" stays with knowledge
rep("""    var best = 'other', bs = 0; Object.keys(cnt).forEach(function (k) { if (cnt[k] > bs || (cnt[k] === bs && CAT[k].at < CAT[best].at)) { bs = cnt[k]; best = k; } }); return best; }""",
    """    var nm = String(L.k.title || '').replace(/^my\\s+/i, ''), nThings = (L.k.stack || []).length; CATS.forEach(function (c) { if (c[5] && c[5].test(nm)) cnt[c[0]] = (cnt[c[0]] || 0) + Math.max(1, nThings * .5); });   // the list's own name votes too
    var best = 'other', bs = 0; Object.keys(cnt).forEach(function (k) { if (cnt[k] > bs || (cnt[k] === bs && CAT[k].at < CAT[best].at)) { bs = cnt[k]; best = k; } }); return best; }""")

# ---- buildings: one search that keeps 2 blocks from other buildings AND 1 block in from every edge; once all rooms are
#      in (a cottage grows with its rooms) every new building is checked again with its final size and moved if needed
rep("""ok = inEdge(function () { return freeSpot(b, 2); }); if (!ok && !growLand())""",
    """ok = bldSpot(b, 2); if (!ok && !growLand())""")
rep("""        I.pc.push(b); nb.push(bldName(b));""",
    """        I.pc.push(b); nb.push(bldName(b)); nbP.push(b);""")
rep("""    var I = V.d, all = {}, nb = [], nr = 0""",
    """    var I = V.d, nbP = [], all = {}, nb = [], nr = 0""")
rep("""    refreshLand();
    var sum = Object.keys(where)""",
    """    respace(nbP);   // 53.83 · checked again with their final sizes
    refreshLand();
    var sum = Object.keys(where)""")
rep("""  function inEdge(fn) {""",
    """  function bldSpot(p, gap) {   // 53.83 · a place for a building: gap blocks from other buildings, 1 block in from every edge of the island
    var lb = lbox(), f0 = foot(Object.assign({}, p, { x: 0, y: 0 })), hw = (f0.x1 - f0.x0) / 2, hd = (f0.y1 - f0.y0) / 2, m = (lb.x1 - lb.x0 >= 8 && lb.y1 - lb.y0 >= 8) ? 1 : 0, x0 = p.x, y0 = p.y;
    for (var y = lb.y0 + m + hd; y <= lb.y1 - m - hd + 1e-6; y += .5) for (var x = lb.x0 + m + hw; x <= lb.x1 - m - hw + 1e-6; x += .5) { p.x = x; p.y = y; if (roomy(p, gap)) return true; }
    p.x = x0; p.y = y0; return false; }
  function bldOk(p) { var lb = lbox(), f = foot(p), m = (lb.x1 - lb.x0 >= 8 && lb.y1 - lb.y0 >= 8) ? 1 : 0; return roomy(p, 2) && f.x0 >= lb.x0 + m - 1e-6 && f.y0 >= lb.y0 + m - 1e-6 && f.x1 <= lb.x1 - m + 1e-6 && f.y1 <= lb.y1 - m + 1e-6; }
  function respace(list) {   // new buildings, with their rooms in: still apart and inside? else move them (growing the island first)
    list.forEach(function (b) {
      Object.keys(DIMS).forEach(function (k) { if (k.indexOf(b.k + ':') === 0) delete DIMS[k]; });
      if (bldOk(b)) return; var x0 = b.x, y0 = b.y, ok = false;
      for (var t = 0; t < 4 && !ok; t++) { ok = bldSpot(b, 2); if (!ok && !growLand()) break; }
      if (!ok) { b.x = x0; b.y = y0; if (!fits(b)) ok = bldSpot(b, 1) || freeSpot(b); }
    });
  }
  function inEdge(fn) {""")

# ---- list and area names match at the start of a word ("Research" is not "sea", "Start" is not "art") -------------------
rep("""  (function () {   // 53.83 · a teacher's board: language and teaching words are knowledge too
    var KN2 = CATS.filter""",
    """  (function () {   // 53.83 · a teacher's board: language and teaching words are knowledge too
    CATS.forEach(function (c) { if (c[5] instanceof RegExp) c[5] = new RegExp('(?:^|[^a-z\\u00c0-\\u024f])(?:' + c[5].source + ')', c[5].flags); });   // names match at a word's start ("Research" is not "sea")
    var KN2 = CATS.filter""")

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched My World generation')
