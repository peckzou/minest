/* Minest · Spatial Home — EC–6 Study Studio · the smart bulletin board (V1.0, Phase 1).
   "The Room Is the Interface. The Bulletin Board Is the Daily Learning Hub."

   Nothing here is a copy of Minest's data. Every piece on the board REFERENCES what already exists:
   · Daily 5 Anchor Charts  → cards of the EC–6 Anchor Charts board (MinestAI.boards()), one per subject per day.
                              Tap = MinestAI.openCard(id) (the card itself, not the Kanban home).
                              ✓ 掌握 = the card's own star rating set to 5 (MinestAI.rateCard, the same 1–5 stars the card
                              editor uses) + a history row here; ↶ puts the previous rating back. Nothing is deleted.
   · Today's Big Three      → real cards in the Kanban list you choose (auto: a list called To-do / Today / 今日 / 待办).
                              Typing writes the card title (MinestAI.patchCard), ☐ writes card.complete, a new task is a
                              new card at the top of that list with date = today (MinestAI.updateBoard). Each day keeps its
                              own three; earlier days stay in the list and in the record.
   · Today's Words          → a Kanban word list (the one CarPlay / GPT Study used last, or the one you choose). Swipe ←
                              = Known: `learned` in the GPT Study record (minest.gptstudy.v1), the same mark as
                              "✓ Mark Learned" on CarPlay. Swipe → = only the order changes (the next word comes up);
                              no mark is written. The word you stopped on is kept.
   · Countdown              → the exam date you set (default 2027-02-28), kept here.
   Kept here (this device, 'minest.ec6board.v1'): sources, the exam, today's picks, the mastery history, the Big Three
   card ids per date, the word order and position, the layout.
   The board shows itself two ways from the same layout: a flat board to work on (DOM, front-on, text in real inputs)
   and a live picture of it on the 3D cork (canvas texture). Text is never edited on the tilted 3D surface. */
(function (root) {
  'use strict';
  var THREE = root.THREE, KEY = 'minest.ec6board.v1', GKEY = 'minest.gptstudy.v1';

  /* ================================================================ helpers */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayNum(s) { var p = String(s).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(s) { return String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_`>|~]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var DEF = {
    v: 1, exam: { name: 'TExES Core Subjects EC–6', date: '2027-02-28' },
    src: { charts: null, todo: null, words: null },       // board id · {b, c} · list key 'b:<board>:<list>'
    picks: {}, skip: {}, mastered: [], opened: {},        // picks[date][subject] = cardId · skip[date][subject] = [ids]
    big3: {}, words: {}, layout: null, pins: []
  };
  function load() {
    var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    d = d && d.v === 1 ? d : JSON.parse(JSON.stringify(DEF));
    for (var k in DEF) if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(DEF[k]));
    return d;
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  /* keep a few weeks of day-keyed records (history of mastery is kept whole) */
  (function trim() {
    var keep = dayNum(today()) - 60;
    ['picks', 'skip', 'opened'].forEach(function (k) { Object.keys(S[k]).forEach(function (d) { if (dayNum(d) < keep) delete S[k][d]; }); });
  })();

  /* ================================================================ the Minest side (this page, or the standalone page's frame) */
  var HW = function () { var B = root.SpatialBridge; return B && B.hostWindow ? B.hostWindow() : root; };
  function AI() { var w = HW(); return w && w.MinestAI && w.MinestAI.boards ? w.MinestAI : null; }
  function boards() { var a = AI(); try { return a ? (a.boards() || []) : []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function findCard(id) {
    var out = null;
    boards().some(function (b) { return (b.columns || []).some(function (c) { return (c.cards || []).some(function (k) { if (k.id === id) { out = { b: b, c: c, k: k }; return true; } return false; }); }); });
    return out;
  }

  /* ---------------------------------------------------------------- subjects */
  var SUBJECTS = [
    { id: 'ela', name: 'Language Arts', zh: '语言艺术', glyph: '📚', ink: '#2f6fd6', re: /language\s*arts|\bela\b|英语语言|reading|writing/i },
    { id: 'math', name: 'Math', zh: '数学', glyph: '🔢', ink: '#d9463e', re: /math/i },
    { id: 'sci', name: 'Science', zh: '科学', glyph: '🔬', ink: '#2f9a5a', re: /science|科学/i },
    { id: 'ss', name: 'Social Studies', zh: '社会', glyph: '🗺️', ink: '#b8862b', re: /social\s*studies|社会|history|geograph/i },
    { id: 'other', name: 'Other', zh: '艺术 · 音乐 · 健康 · 体育', glyph: '🎨', ink: '#8a5ad0', re: null }
  ];
  function subjectOf(col) { for (var i = 0; i < 4; i++) if (SUBJECTS[i].re.test(col.title || '')) return SUBJECTS[i].id; return 'other'; }
  function chartsScore(b) {
    var hit = {}; (b.columns || []).forEach(function (c) { var s = subjectOf(c); if (s !== 'other') hit[s] = 1; });
    return Object.keys(hit).length * 10 + (/anchor|ec\s*[-–]?\s*6/i.test(b.title || '') ? 5 : 0);
  }
  function chartsBoard() {
    if (S.src.charts) { var b = boardById(S.src.charts); if (b) return b; }
    var best = null, sc = 0; boards().forEach(function (b) { var v = chartsScore(b); if (v > sc) { sc = v; best = b; } });
    return sc >= 30 ? best : null;
  }
  function crossed(id) { return S.mastered.some(function (m) { return m.id === id && !m.undone; }); }
  function candidates(sub, b) {
    var day = today(), list = [];
    (b.columns || []).forEach(function (c) { if (subjectOf(c) !== sub) return; (c.cards || []).forEach(function (k) { list.push({ k: k, c: c }); }); });
    var skip = (S.skip[day] && S.skip[day][sub]) || [];
    return list.filter(function (x) { return !crossed(x.k.id) && (x.k.mastery || 1) < 5 && skip.indexOf(x.k.id) < 0; })
      .sort(function (a, z) {
        return ((a.k.mastery || 1) - (z.k.mastery || 1)) || ((a.k.lastReviewed || 0) - (z.k.lastReviewed || 0)) || (hash(day + a.k.id) - hash(day + z.k.id));
      });
  }
  /* today's chart for a subject: kept for the day once chosen */
  function pick(sub) {
    var b = chartsBoard(); if (!b) return null;
    var day = today(), P = S.picks[day] || (S.picks[day] = {}), id = P[sub], hit = id ? findCard(id) : null;
    if (hit && hit.b.id === b.id) return hit;
    var c = candidates(sub, b)[0]; if (!c) return null;
    P[sub] = c.k.id; save();
    return findCard(c.k.id);
  }
  function replace(sub) {
    var day = today(), P = S.picks[day] || (S.picks[day] = {}), K = S.skip[day] || (S.skip[day] = {});
    if (P[sub]) (K[sub] = K[sub] || []).push(P[sub]);
    delete P[sub]; save();
    return pick(sub);
  }
  function master(id) {
    var a = AI(), h = findCard(id); if (!a || !h) return false;
    S.mastered.push({ id: id, at: Date.now(), day: today(), prev: h.k.mastery || 1, title: h.k.title || '' }); save();
    a.rateCard(id, 5); return true;
  }
  function unmaster(id) {
    var a = AI(), m = null; for (var i = S.mastered.length - 1; i >= 0; i--) if (S.mastered[i].id === id && !S.mastered[i].undone) { m = S.mastered[i]; break; }
    if (!a || !m) return false;
    m.undone = Date.now(); save(); a.patchCard(id, { mastery: m.prev }); return true;
  }
  function opened(id) { var d = today(); (S.opened[d] = S.opened[d] || {})[id] = Date.now(); save(); }

  /* ---------------------------------------------------------------- Big Three */
  var TODO_RE = /to\s*-?\s*do|today|daily|big\s*three|今日|今天|待办|每日/i;
  function todoList() {
    if (S.src.todo) { var b = boardById(S.src.todo.b), c = b && (b.columns || []).filter(function (x) { return x.id === S.src.todo.c; })[0]; if (c) return { b: b, c: c }; }
    var out = null; boards().some(function (b) { return (b.columns || []).some(function (c) { if (TODO_RE.test(c.title || '')) { out = { b: b, c: c }; return true; } return false; }); });
    return out;
  }
  function big3() {
    var d = today(), ids = S.big3[d] || [null, null, null], L = todoList();
    return ids.map(function (id) { var h = id ? findCard(id) : null; return h ? h.k : null; }).concat([null, null, null]).slice(0, 3).map(function (k, i) { return { slot: i, card: k, list: L }; });
  }
  function setTask(slot, text) {
    text = String(text || '').trim(); var a = AI(), d = today(), ids = S.big3[d] || (S.big3[d] = [null, null, null]);
    var h = ids[slot] ? findCard(ids[slot]) : null;
    if (h) { if (!text) return; if (text !== h.k.title) a.patchCard(h.k.id, { title: text }); return; }
    if (!text) return;
    var L = todoList(); if (!a || !L) return 'nolist';
    var card = { id: 'ec6-' + d + '-' + uid(), title: text, desc: '', labels: [], complete: false, mastery: 1, createdAt: Date.now(), date: d, checklistItems: [], background: '#fbfaf7' };
    a.updateBoard(L.b.id, function (b) { return Object.assign({}, b, { columns: (b.columns || []).map(function (c) { return c.id === L.c.id ? Object.assign({}, c, { cards: [card].concat(c.cards || []) }) : c; }) }); });
    ids[slot] = card.id; save();
  }
  function toggleTask(slot) { var a = AI(), id = (S.big3[today()] || [])[slot], h = id ? findCard(id) : null; if (a && h) a.patchCard(id, { complete: !h.k.complete }); }
  function unlinkTask(slot) { var ids = S.big3[today()]; if (ids) { ids[slot] = null; save(); } }   // off today's three; the card stays in Kanban

  /* ---------------------------------------------------------------- Today's Words */
  function gs() { try { var d = JSON.parse(localStorage.getItem(GKEY) || 'null'); return d && d.lists ? d : null; } catch (e) { return null; } }
  function listByKey(key) {
    var m = /^b:(.+?):(.+)$/.exec(key || ''); if (!m) return null;
    var b = boardById(m[1]); if (!b) return null; var c = (b.columns || []).filter(function (x) { return x.id === m[2]; })[0];
    return c ? { b: b, c: c, key: key } : null;
  }
  function wordsList() {
    if (S.src.words) { var x = listByKey(S.src.words); if (x) return x; }
    var g = gs(), best = null, last = -1;                              // the list CarPlay / GPT Study used last
    if (g) Object.keys(g.lists).forEach(function (k) { var L = g.lists[k]; if ((L.last || 0) > last && listByKey(k)) { last = L.last || 0; best = k; } });
    if (best) return listByKey(best);
    var v = null;                                                       // never used on CarPlay yet: a vocabulary list
    boards().some(function (b) { if (!/vocab|word|词汇|单词/i.test(b.title || '')) return false; return (b.columns || []).some(function (c) { if ((c.cards || []).length) { v = 'b:' + b.id + ':' + c.id; return true; } return false; }); });
    return v ? listByKey(v) : null;
  }
  function wordState() {
    var L = wordsList(); if (!L) return null;
    var g = gs(), rec = g && g.lists[L.key], cards = (L.c.cards || []).filter(function (k) { return k && k.title; });
    var learned = function (id) { return !!(rec && rec.cards && rec.cards[id] && rec.cards[id].learned); };
    var W = S.words[L.key] || (S.words[L.key] = { order: [], cur: null, known: {} });
    var ids = cards.map(function (k) { return k.id; });
    W.order = W.order.filter(function (id) { return ids.indexOf(id) >= 0; });
    ids.forEach(function (id) { if (W.order.indexOf(id) < 0) W.order.push(id); });                  // new words go to the end
    var open = W.order.filter(function (id) { return !learned(id); });
    if (!W.cur || open.indexOf(W.cur) < 0) W.cur = open[0] || null;
    var byId = {}; cards.forEach(function (k) { byId[k.id] = k; });
    var knownToday = Object.keys(W.known || {}).filter(function (id) { return W.known[id] === today(); }).length;
    return { L: L, card: W.cur ? byId[W.cur] : null, left: open.length, total: cards.length, knownToday: knownToday, W: W, open: open };
  }
  function wordKnown() {
    var st = wordState(); if (!st || !st.card) return;
    var g = gs() || { version: 1, lists: {} }, L = g.lists[st.L.key];
    if (!L) L = g.lists[st.L.key] = { name: st.L.c.title || '', round: 1, rounds: [{ n: 1, start: Date.now(), passed: {} }], cards: {}, current: null, last: 0, history: [], nativeSeq: 0, mode: 'continue' };
    var c = L.cards[st.card.id] || (L.cards[st.card.id] = {});
    c.learned = 1; c.learnedAt = Date.now();
    L.history = L.history || []; L.history.push({ at: Date.now(), ev: 'learned', id: st.card.id, round: L.round, via: 'ec6-board' }); if (L.history.length > 400) L.history.splice(0, L.history.length - 400);
    try { localStorage.setItem(GKEY, JSON.stringify(g)); root.dispatchEvent(new Event('minest:cloud-dirty')); } catch (e) {}
    st.W.known = st.W.known || {}; st.W.known[st.card.id] = today();
    var i = st.open.indexOf(st.card.id); st.W.cur = st.open[i + 1] || st.open[0] || null; if (st.W.cur === st.card.id) st.W.cur = null;
    save();
  }
  function wordLater() {                                                  // order only: this word goes to the back
    var st = wordState(); if (!st || !st.card || st.open.length < 2) return;
    var W = st.W, id = st.card.id, i = st.open.indexOf(id), next = st.open[(i + 1) % st.open.length];
    W.order.splice(W.order.indexOf(id), 1); W.order.push(id); W.cur = next; save();
  }

  /* ---------------------------------------------------------------- countdown */
  function daysLeft() { return dayNum(S.exam.date) - dayNum(today()); }

  /* ================================================================ the layout (shared by the flat board and the 3D picture) */
  /* units: % of the cork area (x, y, w, h); z order = array order */
  function defaultLayout() {
    var L = [{ id: 'title', x: 2.5, y: 3, w: 40, h: 11 }, { id: 'progress', x: 44, y: 4, w: 30, h: 9 }, { id: 'countdown', x: 77, y: 3, w: 20.5, h: 22 }];
    SUBJECTS.forEach(function (s, i) { L.push({ id: 'chart:' + s.id, x: 2.5 + i * 15, y: 28, w: 14, h: 36 }); });
    L.push({ id: 'big3', x: 2.5, y: 67, w: 44, h: 30 });
    L.push({ id: 'words', x: 77.5, y: 28, w: 20, h: 36 });
    L.push({ id: 'note', x: 49, y: 69, w: 26, h: 26, hidden: true });
    return L;
  }
  function layout() {
    if (!S.layout) S.layout = defaultLayout();
    defaultLayout().forEach(function (d) { if (!S.layout.some(function (x) { return x.id === d.id; })) S.layout.push(d); });
    return S.layout;
  }

  /* ================================================================ the flat board (DOM) */
  var CSS = [
    '#sh-ec6{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));background:rgba(32,24,16,.38);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .28s;font:13px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC",sans-serif;color:#2b2218}',
    '#sh-ec6.e6-on{opacity:1}',
    '#sh-ec6.e6-scroll{overflow:auto;align-items:flex-start;justify-content:flex-start}',
    '#sh-ec6 .e6-fit{flex:none;position:relative}',
    '#sh-ec6 .e6-frame{position:absolute;left:0;top:0;width:1100px;height:680px;transform-origin:0 0;padding:14px;box-sizing:border-box;border-radius:10px;background:linear-gradient(135deg,#7a4f2e,#5a3820 60%,#6b4428);box-shadow:0 24px 60px rgba(0,0,0,.45),inset 0 0 0 2px #8f633c,inset 0 0 0 5px #4a2e1a}',
    '#sh-ec6 .e6-cork{position:relative;width:100%;height:100%;border-radius:4px;overflow:hidden;background-color:#c9a273;background-image:radial-gradient(rgba(90,60,30,.22) 1px,transparent 1.4px),radial-gradient(rgba(255,240,210,.25) 1px,transparent 1.5px);background-size:7px 7px,11px 11px;background-position:0 0,3px 5px;box-shadow:inset 0 2px 10px rgba(0,0,0,.35)}',
    '#sh-ec6 .e6-bar{position:absolute;z-index:5;right:16px;top:-2px;transform:translateY(-100%);display:flex;gap:6px}',
    '#sh-ec6 .e6-bar button,#sh-ec6 .e6-tool{border:0;border-radius:10px;padding:6px 11px;font:600 12px/1.2 inherit;font-family:inherit;background:#f6ecd8;color:#3a2a1a;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2)}',
    '#sh-ec6 .e6-bar button.e6-on{background:#2f6fd6;color:#fff}',
    '#sh-ec6 .e6-pc{position:absolute;box-sizing:border-box;touch-action:manipulation}',
    '#sh-ec6.e6-edit .e6-pc{outline:2px dashed rgba(47,111,214,.75);outline-offset:2px;cursor:grab;touch-action:none}',
    '#sh-ec6.e6-edit .e6-pc *{pointer-events:none}',
    '#sh-ec6.e6-edit .e6-pc .e6-rz,#sh-ec6.e6-edit .e6-pc .e6-x,#sh-ec6.e6-edit .e6-pc .e6-rot,#sh-ec6.e6-edit .e6-pc .e6-crop{pointer-events:auto}',
    '#sh-ec6 .e6-rz,#sh-ec6 .e6-x{display:none}',
    '#sh-ec6.e6-edit .e6-rz{display:block;position:absolute;right:-8px;bottom:-8px;width:18px;height:18px;border-radius:50%;background:#2f6fd6;border:2px solid #fff;cursor:nwse-resize;z-index:3}',
    '#sh-ec6.e6-edit .e6-x{display:block;position:absolute;right:-8px;top:-8px;width:20px;height:20px;border-radius:50%;background:#d9463e;color:#fff;border:2px solid #fff;font:700 11px/16px inherit;text-align:center;cursor:pointer;z-index:3}',
    '#sh-ec6 .e6-pin{position:absolute;left:50%;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;box-shadow:0 2px 3px rgba(0,0,0,.35),inset -2px -2px 0 rgba(0,0,0,.18);z-index:2}',
    '#sh-ec6 .e6-paper{position:absolute;inset:0;border-radius:3px;background:#fbf6ea;box-shadow:0 3px 8px rgba(40,25,10,.35);overflow:hidden;display:flex;flex-direction:column}',
    /* title */
    '#sh-ec6 .e6-ttl{position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:0 14px;border-radius:4px;background:linear-gradient(180deg,#1d2b4f,#24386a);color:#f6ecd8;box-shadow:0 3px 8px rgba(0,0,0,.35)}',
    '#sh-ec6 .e6-ttl b{font:800 26px/1 Georgia,"Times New Roman",serif;letter-spacing:.04em}',
    '#sh-ec6 .e6-ttl span{font-size:13px;opacity:.75}',
    /* progress */
    '#sh-ec6 .e6-prog{position:absolute;inset:0;display:flex;gap:6px;align-items:stretch}',
    '#sh-ec6 .e6-prog div{flex:1;background:#fbf6ea;border-radius:3px;box-shadow:0 2px 6px rgba(40,25,10,.3);padding:4px 6px;display:flex;flex-direction:column;justify-content:center}',
    '#sh-ec6 .e6-prog small{font-size:10px;opacity:.65;white-space:nowrap}',
    '#sh-ec6 .e6-prog b{font-size:17px}',
    /* countdown */
    '#sh-ec6 .e6-cal{position:absolute;inset:0;border-radius:4px;overflow:hidden;background:#fffaf0;box-shadow:0 4px 10px rgba(40,25,10,.4);display:flex;flex-direction:column;text-align:center;cursor:pointer}',
    '#sh-ec6 .e6-cal .e6-top{background:#c0392b;color:#fff;font:700 10px/1.4 inherit;padding:3px 4px;letter-spacing:.05em;text-transform:uppercase}',
    '#sh-ec6 .e6-cal .e6-n{font:800 48px/1 Georgia,serif;color:#1d2b4f;margin-top:auto}',
    '#sh-ec6 .e6-cal .e6-u{font-size:11px;opacity:.7}',
    '#sh-ec6 .e6-cal .e6-d{font-size:11px;margin:auto 0 5px;opacity:.85}',
    '#sh-ec6 .e6-cal input{font:inherit;font-size:12px;margin:2px auto 6px;width:90%}',
    /* charts */
    '#sh-ec6 .e6-chart .e6-band{height:5px;flex:none}',
    '#sh-ec6 .e6-chart .e6-sub{display:flex;justify-content:space-between;align-items:center;padding:5px 7px 2px;font:700 10px/1.1 inherit;text-transform:uppercase;letter-spacing:.04em}',
    '#sh-ec6 .e6-chart .e6-art{flex:1 1 30%;min-height:0;margin:2px 7px;border-radius:3px;background:#efe6d3 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:38px}',
    '#sh-ec6 .e6-chart h5{margin:3px 7px 2px;font:700 14px/1.2 Georgia,serif;cursor:pointer}',
    '#sh-ec6 .e6-chart p{margin:0 7px;font-size:11px;opacity:.75;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}',
    '#sh-ec6 .e6-chart .e6-acts{display:flex;gap:4px;padding:4px 6px 6px;margin-top:auto}',
    '#sh-ec6 .e6-chart .e6-acts button{flex:1;border:1px solid rgba(43,34,24,.15);background:#fff;border-radius:7px;font:600 10px/1.2 inherit;padding:4px 2px;cursor:pointer;color:#2b2218}',
    '#sh-ec6 .e6-chart .e6-st{font-size:9px;font-weight:600;opacity:.75;text-transform:none;letter-spacing:0}',
    '#sh-ec6 .e6-chart.e6-done h5,#sh-ec6 .e6-chart.e6-done p{text-decoration:line-through;text-decoration-thickness:2px;opacity:.55}',
    '#sh-ec6 .e6-chart.e6-empty .e6-paper{align-items:center;justify-content:center;text-align:center;padding:8px;font-size:11px;opacity:.85}',
    /* big three */
    '#sh-ec6 .e6-b3 .e6-paper{background:#fff8c9;background-image:repeating-linear-gradient(180deg,transparent 0 27px,rgba(47,111,214,.14) 27px 28px);padding:6px 10px 6px 12px}',
    '#sh-ec6 .e6-b3 h4{margin:0 0 4px;font:800 16px/1.2 Georgia,serif;display:flex;justify-content:space-between;align-items:baseline}',
    '#sh-ec6 .e6-b3 h4 small{font:500 10px/1 inherit;opacity:.6;font-family:-apple-system,sans-serif}',
    '#sh-ec6 .e6-b3 .e6-row{display:flex;align-items:center;gap:8px;min-height:0;flex:1}',
    '#sh-ec6 .e6-b3 .e6-row input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:#2f9a5a;cursor:pointer}',
    '#sh-ec6 .e6-b3 .e6-row input[type=text]{flex:1;min-width:0;border:0;background:transparent;font:500 15px/1.3 "Bradley Hand","Segoe Print","Kaiti SC",cursive;color:#1d2b4f;padding:2px 0;outline:none;border-bottom:1px dashed transparent}',
    '#sh-ec6 .e6-b3 .e6-row input[type=text]:focus{border-bottom-color:rgba(47,111,214,.6)}',
    '#sh-ec6 .e6-b3 .e6-row.e6-done input[type=text]{text-decoration:line-through;text-decoration-thickness:2px;opacity:.55}',
    '#sh-ec6 .e6-b3 .e6-row .e6-n{font:800 13px/1 Georgia,serif;color:#c0392b;width:12px}',
    '#sh-ec6 .e6-b3 .e6-row .e6-un{border:0;background:none;opacity:.35;cursor:pointer;font-size:12px;padding:0 2px}',
    '#sh-ec6 .e6-b3 .e6-src,#sh-ec6 .e6-words .e6-src{font-size:10px;opacity:.6;margin-top:2px;cursor:pointer;text-decoration:underline dotted}',
    /* words */
    '#sh-ec6 .e6-words .e6-stack{position:absolute;inset:0}',
    '#sh-ec6 .e6-words .e6-back{position:absolute;inset:0;border-radius:6px;background:#f3ead6;box-shadow:0 2px 5px rgba(40,25,10,.3)}',
    '#sh-ec6 .e6-words .e6-card{position:absolute;inset:0;border-radius:6px;background:#fffdf7;box-shadow:0 4px 10px rgba(40,25,10,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8px;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;transition:transform .28s,opacity .28s}',
    '#sh-ec6 .e6-words .e6-card .e6-k{font:600 10px/1 inherit;text-transform:uppercase;letter-spacing:.06em;opacity:.55;position:absolute;top:8px;left:0;right:0}',
    '#sh-ec6 .e6-words .e6-card .e6-w{font:800 28px/1.15 Georgia,serif;color:#1d2b4f;word-break:break-word}',
    '#sh-ec6 .e6-words .e6-card .e6-m{font-size:11px;opacity:.7;margin-top:4px}',
    '#sh-ec6 .e6-words .e6-card .e6-hint{position:absolute;bottom:7px;left:6px;right:6px;display:flex;justify-content:space-between;font-size:9px;opacity:.55}',
    '#sh-ec6 .e6-words .e6-card .e6-cnt{position:absolute;top:22px;font-size:9px;opacity:.5}',
    /* note */
    '#sh-ec6 .e6-note .e6-paper{background:#dff0ff;padding:8px}',
    '#sh-ec6 .e6-note textarea{flex:1;border:0;background:transparent;resize:none;font:500 13px/1.35 "Bradley Hand","Kaiti SC",cursive;color:#1d2b4f;outline:none}',
    /* sheets */
    '#sh-ec6 .e6-sheet{position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);width:min(380px,92%);max-height:80%;overflow:auto;background:#fbf7ee;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.4);padding:14px}',
    '#sh-ec6 .e6-sheet h4{margin:0 0 8px;font-size:15px}',
    '#sh-ec6 .e6-sheet input[type=search]{width:100%;box-sizing:border-box;padding:8px;border-radius:9px;border:1px solid rgba(0,0,0,.15);font:inherit;margin-bottom:8px}',
    '#sh-ec6 .e6-sheet ul{list-style:none;margin:0;padding:0}',
    '#sh-ec6 .e6-sheet li button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(0,0,0,.07);background:none;padding:8px 4px;font:inherit;cursor:pointer;color:inherit}',
    '#sh-ec6 .e6-sheet li small{opacity:.6;margin-left:6px}',
    '#sh-ec6 .e6-sheet .e6-end{margin-top:8px;width:100%}',
    /* craft: selection, rotation, crop, guides, tools, fixings, papers, decorations */
    '#sh-ec6 .e6-in{position:absolute;inset:0}',
    '#sh-ec6.e6-edit .e6-pc.e6-sel{outline:2px solid #2f6fd6;outline-offset:3px;z-index:50}',
    '#sh-ec6 .e6-rot,#sh-ec6 .e6-crop{display:none}',
    '#sh-ec6.e6-edit .e6-sel .e6-rot{display:block;position:absolute;left:50%;top:-34px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#fff;border:2px solid #2f6fd6;cursor:grab;z-index:6;pointer-events:auto}',
    '#sh-ec6.e6-edit .e6-sel .e6-rot::after{content:"";position:absolute;left:8px;top:18px;width:2px;height:14px;background:#2f6fd6}',
    '#sh-ec6.e6-cropping .e6-sel .e6-crop{display:block;position:absolute;background:#f2c13d;border:2px solid #fff;z-index:6;border-radius:4px;pointer-events:auto;box-shadow:0 1px 4px rgba(0,0,0,.35)}',
    '#sh-ec6 .e6-crop[data-c=t]{left:50%;top:var(--ct);width:34px;height:12px;margin:-6px 0 0 -17px;cursor:ns-resize}',
    '#sh-ec6 .e6-crop[data-c=b]{left:50%;bottom:var(--cb);width:34px;height:12px;margin:0 0 -6px -17px;cursor:ns-resize}',
    '#sh-ec6 .e6-crop[data-c=l]{top:50%;left:var(--cl);width:12px;height:34px;margin:-17px 0 0 -6px;cursor:ew-resize}',
    '#sh-ec6 .e6-crop[data-c=r]{top:50%;right:var(--cr);width:12px;height:34px;margin:-17px -6px 0 0;cursor:ew-resize}',
    '#sh-ec6 .e6-guide{position:absolute;background:#e2569a;z-index:80;pointer-events:none}',
    '#sh-ec6 .e6-tools{position:absolute;z-index:90;display:flex;gap:3px;padding:4px;background:#1d2b4f;border-radius:10px;box-shadow:0 6px 16px rgba(0,0,0,.35);transform:translateY(-100%);white-space:nowrap}',
    '#sh-ec6 .e6-tools button{border:0;background:#2b3c66;color:#fff;border-radius:7px;font:600 11px/1 -apple-system,"PingFang SC",sans-serif;padding:6px 7px;cursor:pointer}',
    '#sh-ec6 .e6-tools button.e6-on{background:#f2c13d;color:#1d2b4f}',
    '#sh-ec6 .e6-tapeA,#sh-ec6 .e6-tapeB{position:absolute;top:-8px;width:46px;height:17px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.25) 0 4px,transparent 4px 8px),var(--tape,rgba(242,193,61,.72));z-index:4;box-shadow:0 1px 2px rgba(0,0,0,.15)}',
    '#sh-ec6 .e6-tapeA{left:-12px;transform:rotate(-32deg)}#sh-ec6 .e6-tapeB{right:-12px;transform:rotate(32deg)}',
    '#sh-ec6 .e6-clip{position:absolute;top:-12px;left:16%;width:12px;height:32px;border:3px solid #a7b0ba;border-radius:7px;z-index:4;box-shadow:1px 1px 2px rgba(0,0,0,.25)}',
    '#sh-ec6 .e6-pp-white .e6-paper{background:#fffdf8}#sh-ec6 .e6-pp-kraft .e6-paper{background:#d8bd8f}#sh-ec6 .e6-pp-yellow .e6-paper{background:#fff2a0}#sh-ec6 .e6-pp-blue .e6-paper{background:#dcecfb}',
    '#sh-ec6 .e6-pp-grid .e6-paper{background:#fffdf8;background-image:linear-gradient(rgba(47,111,214,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(47,111,214,.14) 1px,transparent 1px);background-size:14px 14px}',
    '#sh-ec6 .e6-dtape{position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px),var(--c);opacity:.86;box-shadow:0 1px 3px rgba(0,0,0,.2)}',
    '#sh-ec6 .e6-dsticker{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:var(--fs,40px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}',
    '#sh-ec6 .e6-dtag{position:absolute;inset:0;background:#d8bd8f;border-radius:4px 14px 14px 4px;box-shadow:0 2px 5px rgba(0,0,0,.3);display:flex;align-items:center;padding:0 8px 0 18px}',
    '#sh-ec6 .e6-dtag::before{content:"";position:absolute;left:6px;top:50%;width:7px;height:7px;margin-top:-4px;border-radius:50%;background:#6b4428}',
    '#sh-ec6 .e6-dtag input{width:100%;border:0;background:transparent;font:600 13px/1.2 "Bradley Hand","Kaiti SC",cursive;color:#2b2218;outline:none}',
    '#sh-ec6 .e6-darrow{position:absolute;inset:0}',
    '#sh-ec6 .e6-toast{position:absolute;z-index:40;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(29,43,79,.9);color:#fff;padding:7px 14px;border-radius:999px;font-size:12px;white-space:nowrap}',
  ].join('\n');

  var el = null, closeFn = null, editMode = false, liveTimer = 0, ctx = null, sel = null, cropMode = false, UNDO = [];
  function paperName(p) { return { auto: '原样', white: '白纸', kraft: '牛皮纸', yellow: '便利贴', blue: '淡蓝', grid: '方格' }[p || 'auto']; }
  function fixName(it) { return { auto: '图钉', red: '红钉', blue: '蓝钉', gold: '金钉', green: '绿钉', tape: '胶带', clip: '回形针', none: '不固定' }[it.pin || 'auto']; }
  function cycle(list, v) { return list[(list.indexOf(v || list[0]) + 1) % list.length]; }
  function snap() { UNDO.push(JSON.stringify({ layout: S.layout, theme: S.theme || null })); if (UNDO.length > 40) UNDO.shift(); }
  function undo() { var u = UNDO.pop(); if (!u) return false; u = JSON.parse(u); S.layout = u.layout; S.theme = u.theme; save(); return true; }
  function byId(id) { return layout().filter(function (x) { return x.id === id; })[0] || null; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function tidy() {
    var G = 2, M = 2.5, items = layout().filter(function (it) { return !it.hidden && it.id.indexOf('deco:') !== 0; })
      .sort(function (a, b) { return (Math.floor(a.y / 12) - Math.floor(b.y / 12)) || (a.x - b.x); });     // read the board in bands, left to right
    var x = M, y = M, rowH = 0;
    items.forEach(function (it) {
      if (x + it.w > 100 - M + 0.01 && x > M) { x = M; y += rowH + G; rowH = 0; }
      it.x = x; it.y = Math.min(y, 100 - it.h); it.rot = 0; x += it.w + G; rowH = Math.max(rowH, it.h);
    });
  }
  function natural() {
    var fx = ['auto', 'auto', 'red', 'blue', 'gold', 'tape', 'clip'];
    layout().forEach(function (it) {
      if (it.hidden) return;
      if (it.id.indexOf('deco:') === 0) { it.rot = it.id.indexOf('deco:tape') === 0 ? rnd(-18, 18) : rnd(-10, 10); return; }
      it.rot = it.id === 'title' ? +(rnd(-0.8, 0.8)).toFixed(1) : +(rnd(-2.6, 2.6)).toFixed(1);
      if (it.id !== 'title' && it.id !== 'progress') it.pin = fx[Math.floor(Math.random() * fx.length)];
    });
  }
  var THEMES = [
    { id: 'classic', name: '经典软木', paper: 'auto', pin: 'auto', rot: 0 },
    { id: 'journal', name: '手账风', paper: ['kraft', 'yellow', 'white', 'grid'], pin: ['tape', 'tape', 'clip', 'red'], rot: 2.2 },
    { id: 'minimal', name: '极简', paper: 'white', pin: 'none', rot: 0 }
  ];
  function theme() {
    var i = (THEMES.map(function (t) { return t.id; }).indexOf(S.theme || 'classic') + 1) % THEMES.length, T = THEMES[i]; S.theme = T.id;
    layout().forEach(function (it, k) {
      if (it.hidden || it.id.indexOf('deco:') === 0 || it.id === 'title') return;
      it.paper = Array.isArray(T.paper) ? T.paper[k % T.paper.length] : T.paper;
      if (it.id !== 'progress') it.pin = Array.isArray(T.pin) ? T.pin[(k * 3) % T.pin.length] : T.pin;
      it.rot = T.rot ? +(rnd(-T.rot, T.rot)).toFixed(1) : 0;
    });
    return T.name;
  }
  function addDeco(kind, extra) {
    var n = layout().filter(function (x) { return x.id.indexOf('deco:') === 0; }).length;                 // each new one a little apart
    var id = 'deco:' + kind + ':' + uid(), it = { id: id, x: 40 + (n % 5) * 4, y: 34 + (n % 4) * 6, w: 12, h: 5, rot: 0 };
    if (kind === 'tape') { it.w = 11; it.h = 4.5; it.rot = +(rnd(-20, 20)).toFixed(1); it.color = extra || 'sun'; }
    if (kind === 'sticker') { it.w = 6; it.h = 9; it.text = extra || '⭐'; it.rot = +(rnd(-12, 12)).toFixed(1); }
    if (kind === 'tag') { it.w = 14; it.h = 6; it.text = ''; it.rot = +(rnd(-6, 6)).toFixed(1); }
    if (kind === 'arrow') { it.w = 12; it.h = 7; it.rot = +(rnd(-15, 15)).toFixed(1); }
    layout().push(it); sel = id; return it;
  }
  var STICKERS = ['⭐', '💡', '✅', '❤️', '🍎', '🎯', '🌱', '📌', '🔥', '🌈'];
  function ensureCss() { if (document.getElementById('sh-ec6-css')) return; var st = document.createElement('style'); st.id = 'sh-ec6-css'; st.textContent = CSS; document.head.appendChild(st); }
  function tip(s) { if (!el) return; var t = el.querySelector('.e6-toast'); if (!t) { t = document.createElement('div'); t.className = 'e6-toast'; el.appendChild(t); } t.textContent = s; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 2600); }

  function coverOf(k) { var c = k && k.cover; if (!c) return null; if (typeof c === 'string') return /^(https?:|data:)/.test(c) ? { img: c } : null; if (c.type === 'image' && c.value) return { img: c.value }; if (c.type === 'color' && c.value) return { color: c.value }; return null; }
  function chartHTML(subId) {
    var sub = SUBJECTS.filter(function (s) { return s.id === subId; })[0], h = pick(subId), b = chartsBoard();
    if (!b) return '<div class="e6-paper"><b>' + sub.glyph + ' ' + sub.name + '</b><br>没有找到 EC–6 Anchor Charts 看板<br><span class="e6-src" data-a="src-charts">选择看板</span></div>';
    if (!h) return '<div class="e6-paper"><b>' + sub.glyph + ' ' + sub.name + '</b><br>这一科的海报都掌握了 🎉</div>';
    var k = h.k, done = crossed(k.id), cv = coverOf(k), m = k.mastery || 1, op = S.opened[today()] && S.opened[today()][k.id];
    var stat = done ? '已掌握' : (op ? '今天看过' : (m > 1 ? '★' + m : '待学习'));
    var art = cv && cv.img ? ' style="background-image:url(&quot;' + esc(cv.img) + '&quot;)"' : (cv && cv.color ? ' style="background:' + esc(cv.color) + '"' : '');
    return '<div class="e6-paper"><div class="e6-band" style="background:' + sub.ink + '"></div>' +
      '<div class="e6-sub" style="color:' + sub.ink + '"><span>' + sub.glyph + ' ' + esc(sub.name) + '</span><span class="e6-st">' + stat + '</span></div>' +
      '<div class="e6-art"' + art + '>' + (cv && cv.img ? '' : sub.glyph) + '</div>' +
      '<h5 data-a="open" data-id="' + esc(k.id) + '">' + esc(k.title || '') + '</h5>' +
      '<p>' + esc(clip(k.meaning || k.titleZh || k.desc || '', 110)) + '</p>' +
      '<div class="e6-acts"><button type="button" data-a="swap" data-s="' + subId + '" title="换一张">↻ 换</button>' +
      (done ? '<button type="button" data-a="unmaster" data-id="' + esc(k.id) + '" title="撤销">↶ 撤销</button>' : '<button type="button" data-a="master" data-id="' + esc(k.id) + '" title="已经掌握，划掉">✓ 掌握</button>') +
      '</div></div>';
  }
  function pinHTML(cardId) {
    var h = findCard(cardId); if (!h) return '<div class="e6-paper"><br>这张卡片已不在看板上</div>';
    var k = h.k, sub = SUBJECTS.filter(function (s) { return s.id === subjectOf(h.c); })[0] || SUBJECTS[4], cv = coverOf(k), done = crossed(k.id);
    var art = cv && cv.img ? ' style="background-image:url(&quot;' + esc(cv.img) + '&quot;)"' : '';
    return '<div class="e6-paper"><div class="e6-band" style="background:' + sub.ink + '"></div><div class="e6-sub" style="color:' + sub.ink + '"><span>📌 ' + esc(sub.name) + '</span><span class="e6-st">' + (done ? '已掌握' : '收藏') + '</span></div>' +
      '<div class="e6-art"' + art + '>' + (cv && cv.img ? '' : sub.glyph) + '</div><h5 data-a="open" data-id="' + esc(k.id) + '">' + esc(k.title || '') + '</h5><p>' + esc(clip(k.meaning || k.desc || '', 90)) + '</p></div>';
  }
  function big3HTML() {
    var L = todoList(), rows = big3();
    return '<div class="e6-paper"><h4>Today\'s Big Three <small>' + today() + '</small></h4>' +
      rows.map(function (r) {
        var k = r.card;
        return '<div class="e6-row' + (k && k.complete ? ' e6-done' : '') + '"><span class="e6-n">' + (r.slot + 1) + '</span>' +
          '<input type="checkbox" data-a="tick" data-slot="' + r.slot + '"' + (k && k.complete ? ' checked' : '') + (k ? '' : ' disabled') + ' aria-label="完成">' +
          '<input type="text" data-a="task" data-slot="' + r.slot + '" value="' + esc(k ? k.title : '') + '" placeholder="' + (L ? '写下今天第 ' + (r.slot + 1) + ' 件重要的事' : '先选择 Kanban 里的每日清单') + '"' + (L ? '' : ' disabled') + '>' +
          (k ? '<button type="button" class="e6-un" data-a="unlink" data-slot="' + r.slot + '" title="移出今天（卡片仍在 Kanban）">✕</button>' : '') + '</div>';
      }).join('') +
      '<div class="e6-src" data-a="src-todo">' + (L ? '同步到 ' + esc(L.b.title || '') + ' › ' + esc(L.c.title || '') : '选择每日清单') + '</div></div>';
  }
  function wordsHTML() {
    var st = wordState();
    if (!st) return '<div class="e6-stack"><div class="e6-card"><div class="e6-w" style="font-size:14px">Today\'s Words</div><div class="e6-m">还没有选单词清单</div><div class="e6-src" data-a="src-words">选择 Word List</div></div></div>';
    if (!st.card) return '<div class="e6-stack"><div class="e6-card"><span class="e6-k">Today\'s Words</span><div class="e6-w">🎉</div><div class="e6-m">这份清单都认识了（' + st.total + '）</div><div class="e6-src" data-a="src-words">换一份清单</div></div></div>';
    var k = st.card;
    return '<div class="e6-stack">' + (st.left > 2 ? '<div class="e6-back" style="transform:translate(6px,6px) rotate(2deg)"></div>' : '') + (st.left > 1 ? '<div class="e6-back" style="transform:translate(3px,3px) rotate(1deg)"></div>' : '') +
      '<div class="e6-card" data-a="word" data-id="' + esc(k.id) + '"><span class="e6-k">Today\'s Words</span><span class="e6-cnt">还剩 ' + st.left + ' · 今天认识 ' + st.knownToday + '</span>' +
      '<div class="e6-w">' + esc(k.title) + '</div>' + (k.titleZh || k.meaning ? '<div class="e6-m">' + esc(clip(k.titleZh || k.meaning, 40)) + '</div>' : '') +
      '<div class="e6-hint"><span>← 认识</span><span>点开详情</span><span>换顺序 →</span></div></div></div>';
  }
  function countdownHTML() {
    var n = daysLeft(), d = S.exam.date.split('-');
    return '<div class="e6-cal" data-a="cal"><div class="e6-top">EC–6 Exam</div><div class="e6-n">' + (n >= 0 ? n : 0) + '</div><div class="e6-u">' + (n > 0 ? 'days to go' : (n === 0 ? 'today!' : 'done')) + '</div><div class="e6-d">' + esc(d[1] + '/' + d[2] + '/' + d[0]) + '</div></div>';
  }
  function progressHTML() {
    var r = big3(), done = r.filter(function (x) { return x.card && x.card.complete; }).length, have = r.filter(function (x) { return x.card; }).length;
    var day = today(), charts = 0; SUBJECTS.forEach(function (s) { var id = S.picks[day] && S.picks[day][s.id]; if (id && (crossed(id) || (S.opened[day] && S.opened[day][id]))) charts++; });
    var st = wordState();
    return '<div class="e6-prog"><div><small>Big Three</small><b>' + done + ' / ' + (have || 3) + '</b></div><div><small>Anchor Charts</small><b>' + charts + ' / 5</b></div><div><small>Words</small><b>+' + (st ? st.knownToday : 0) + '</b></div></div>';
  }
  var PINS = { red: '#c0392b', blue: '#2f6fd6', gold: '#f2c13d', green: '#2f9a5a' };
  var PAPERS = ['auto', 'white', 'kraft', 'yellow', 'blue', 'grid'], FIXES = ['auto', 'red', 'blue', 'gold', 'green', 'tape', 'clip', 'none'];
  var TAPES = { sun: 'rgba(242,193,61,.75)', sea: 'rgba(99,170,230,.72)', rose: 'rgba(240,140,187,.72)', mint: 'rgba(127,200,160,.72)' };
  function decoHTML(it) {
    var p = it.id.split(':'), kind = p[1];
    if (kind === 'tape') return '<div class="e6-dtape" style="--c:' + (TAPES[it.color] || TAPES.sun) + '"></div>';
    if (kind === 'sticker') return '<div class="e6-dsticker" style="--fs:' + Math.round(Math.min(it.w * 11, it.h * 6.8) * 0.9) + 'px">' + esc(it.text || '⭐') + '</div>';
    if (kind === 'tag') return '<div class="e6-dtag"><input type="text" data-a="tag" data-p="' + esc(it.id) + '" value="' + esc(it.text || '') + '" placeholder="写点什么…"></div>';
    if (kind === 'arrow') return '<svg class="e6-darrow" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M4 30 C 30 6, 60 6, 88 20" fill="none" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/><path d="M76 10 L 90 20 L 74 28" fill="none" stroke="#c0392b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '';
  }
  function fixHTML(it, def) {
    var f = it.pin && it.pin !== 'auto' ? it.pin : null;
    if (f === 'none') return '';
    if (f === 'tape') return '<i class="e6-tapeA"></i><i class="e6-tapeB"></i>';
    if (f === 'clip') return '<i class="e6-clip"></i>';
    var c = f ? PINS[f] : def; return c ? '<i class="e6-pin" style="background:' + c + '"></i>' : '';
  }
  function pieceHTML(it) {
    var id = it.id, inner = '', pinC = null;
    if (id === 'title') inner = '<div class="e6-ttl"><b>EC–6 Exam</b><span>Study Studio · ' + today() + '</span></div>';
    else if (id === 'progress') inner = progressHTML();
    else if (id === 'countdown') inner = countdownHTML();
    else if (id === 'big3') { inner = big3HTML(); pinC = '#c0392b'; }
    else if (id === 'words') inner = wordsHTML();
    else if (id === 'note') { inner = '<div class="e6-paper"><textarea data-a="note" placeholder="便签…">' + esc(S.note || '') + '</textarea></div>'; pinC = '#2f6fd6'; }
    else if (id.indexOf('chart:') === 0) { inner = chartHTML(id.slice(6)); pinC = (SUBJECTS.filter(function (s) { return 'chart:' + s.id === id; })[0] || {}).ink; }
    else if (id.indexOf('pin:') === 0) { inner = pinHTML(id.slice(4)); pinC = '#f2c13d'; }
    else if (id.indexOf('deco:') === 0) inner = decoHTML(it);
    var cls = id.indexOf('chart:') === 0 || id.indexOf('pin:') === 0 ? 'chart' : (id === 'big3' ? 'b3' : (id.indexOf('deco:') === 0 ? 'deco' : id));
    if (it.paper && it.paper !== 'auto') cls += ' pp-' + it.paper;
    if (sel === id) cls += ' sel';
    if (id.indexOf('chart:') === 0) { var h = pick(id.slice(6)); if (h && crossed(h.k.id)) cls += ' done'; if (!h) cls += ' empty'; }
    cls = ('pc ' + cls).split(' ').map(function (c) { return 'e6-' + c; }).join(' ');
    var c = it.crop || [0, 0, 0, 0], clip = (c[0] || c[1] || c[2] || c[3]) ? 'clip-path:inset(' + c[0] + '% ' + c[1] + '% ' + c[2] + '% ' + c[3] + '% round 3px);' : '';
    var vars = '--ct:' + c[0] + '%;--cr:' + c[1] + '%;--cb:' + c[2] + '%;--cl:' + c[3] + '%;';
    return '<div class="' + cls + '" data-p="' + esc(id) + '" style="left:' + it.x + '%;top:' + it.y + '%;width:' + it.w + '%;height:' + it.h + '%;transform:rotate(' + (it.rot || 0) + 'deg);' + vars + '">' +
      '<div class="e6-in" style="' + clip + '">' + inner + '</div>' + fixHTML(it, pinC) +
      '<i class="e6-rot" data-rot="1" title="拖动旋转"></i><i class="e6-crop" data-c="t"></i><i class="e6-crop" data-c="r"></i><i class="e6-crop" data-c="b"></i><i class="e6-crop" data-c="l"></i>' +
      '<i class="e6-rz" data-rz="1"></i>' + (/^(title)$/.test(id) ? '' : '<i class="e6-x" data-hide="1" title="从布告栏拿下">✕</i>') + '</div>';
  }

  function render() {
    if (!el) return;
    var cork = el.querySelector('.e6-cork'), f = document.activeElement, keepId = f && f.dataset && f.dataset.a === 'task' ? f.dataset.slot : null, caret = keepId != null ? f.selectionStart : 0;
    cork.innerHTML = layout().filter(function (it) { return !it.hidden; }).map(pieceHTML).join('');
    el.classList.toggle('e6-edit', editMode);
    el.querySelector('[data-b="edit"]').classList.toggle('e6-on', editMode);
    el.querySelector('[data-b="edit"]').textContent = editMode ? '✓ 完成排版' : '✥ 排版';
    ['add', 'reset', 'deco', 'tidy', 'natural', 'theme', 'undo'].forEach(function (b) { var x = el.querySelector('[data-b="' + b + '"]'); if (x) x.hidden = !editMode; });
    var ub = el.querySelector('[data-b="undo"]'); if (ub) ub.disabled = !UNDO.length;
    if (!editMode) { sel = null; cropMode = false; }
    el.classList.toggle('e6-cropping', editMode && cropMode && !!sel);
    var it = sel && layout().filter(function (x) { return x.id === sel && !x.hidden; })[0];
    if (editMode && it) {
      var tb = document.createElement('div'); tb.className = 'e6-tools'; tb.style.left = clamp(it.x, 0, 62) + '%'; tb.style.top = Math.max(6, it.y - 6.5) + '%';
      var deco = it.id.indexOf('deco:') === 0;
      tb.innerHTML = '<button data-tool="rotL" title="左转 3°">↺</button><button data-tool="rotR" title="右转 3°">↻</button><button data-tool="straight" title="摆正">⟂</button>' +
        (deco ? '' : '<button data-tool="crop" class="' + (cropMode ? 'e6-on' : '') + '" title="拖动黄色手柄裁剪">✂ 裁剪</button><button data-tool="uncrop" title="取消裁剪">⤢</button><button data-tool="paper" title="换纸张">纸 · ' + paperName(it.paper) + '</button>') +
        '<button data-tool="fix" title="换固定方式">' + fixName(it) + '</button>' + (it.id.indexOf('deco:tape') === 0 ? '<button data-tool="tapecolor">换色</button>' : '') +
        (it.id.indexOf('deco:sticker') === 0 ? '<button data-tool="sticker">换贴纸</button>' : '') +
        '<button data-tool="front" title="放到最上面">置顶</button><button data-tool="back" title="放到最下面">置底</button><button data-tool="dup" title="复制一份">复制</button><button data-tool="del" title="从布告栏拿下">拿下</button>';
      cork.appendChild(tb);
    }
    if (keepId != null) { var nf = cork.querySelector('[data-a="task"][data-slot="' + keepId + '"]'); if (nf) { nf.focus(); try { nf.setSelectionRange(caret, caret); } catch (e) {} } }
    paint();
  }

  /* ---------------------------------------------------------------- sheets: pick a source, pin a chart */
  function sheet(title, items, onPick, search) {
    var sh = document.createElement('div'); sh.className = 'e6-sheet';
    sh.innerHTML = '<h4>' + esc(title) + '</h4>' + (search ? '<input type="search" placeholder="搜索…">' : '') + '<ul></ul><button type="button" class="e6-tool e6-end">取消</button>';
    var ul = sh.querySelector('ul');
    function fill(q) {
      q = (q || '').toLowerCase();
      ul.innerHTML = items.filter(function (it) { return !q || (it.label + ' ' + (it.sub || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 200)
        .map(function (it, i) { return '<li><button type="button" data-i="' + items.indexOf(it) + '">' + esc(it.label) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</button></li>'; }).join('') || '<li style="padding:8px;opacity:.6">没有可选的</li>';
    }
    fill('');
    if (search) sh.querySelector('input').addEventListener('input', function () { fill(this.value); });
    sh.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('e6-end')) { sh.remove(); return; }
      var it = items[+b.dataset.i]; sh.remove(); if (it) onPick(it);
    });
    el.appendChild(sh);
  }
  function allLists() { var out = []; boards().forEach(function (b) { (b.columns || []).forEach(function (c) { out.push({ label: c.title || '(未命名)', sub: (b.title || '') + ' · ' + (c.cards || []).length + ' 张', b: b.id, c: c.id }); }); }); return out; }
  function action(a, t) {
    if (a === 'src-charts') sheet('EC–6 Anchor Charts 看板', boards().map(function (b) { return { label: b.title || '(未命名)', sub: (b.columns || []).length + ' 列', b: b.id }; }), function (it) { S.src.charts = it.b; delete S.picks[today()]; save(); render(); });
    else if (a === 'src-todo') sheet('Today\'s Big Three 同步到哪个清单？', allLists(), function (it) { S.src.todo = { b: it.b, c: it.c }; save(); render(); tip('Big Three 会写进 ' + it.label); }, true);
    else if (a === 'src-words') sheet('Today\'s Words 用哪份 Word List？', allLists(), function (it) { S.src.words = 'b:' + it.b + ':' + it.c; save(); render(); }, true);
  }
  function addPin() {
    var b = chartsBoard(), items = [];
    (b ? [b] : boards()).forEach(function (bd) { (bd.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { items.push({ label: k.title || '', sub: c.title || '', id: k.id }); }); }); });
    sheet('贴一张 Anchor Chart', items, function (it) {
      var id = 'pin:' + it.id; if (layout().some(function (x) { return x.id === id; })) { tip('已经在布告栏上'); return; }
      layout().push({ id: id, x: 40, y: 30, w: 14, h: 34 }); save(); render(); tip('已贴上 · 可以拖到合适的位置');
    }, true);
  }

  function decoSheet() {
    var items = [{ label: '🟨 和纸胶带 · 暖黄', k: 'tape', v: 'sun' }, { label: '🟦 和纸胶带 · 海蓝', k: 'tape', v: 'sea' }, { label: '🟪 和纸胶带 · 玫瑰', k: 'tape', v: 'rose' }, { label: '🟩 和纸胶带 · 薄荷', k: 'tape', v: 'mint' },
      { label: '🏷 手写标签', k: 'tag' }, { label: '➰ 手绘箭头', k: 'arrow' }].concat(STICKERS.map(function (s) { return { label: s + ' 贴纸', k: 'sticker', v: s }; }));
    sheet('＋ 装饰', items, function (it) { snap(); addDeco(it.k, it.v); save(); render(); tip('已贴上 · 拖到想要的位置'); });
  }

  /* ---------------------------------------------------------------- interaction */
  function bind() {
    var cork = el.querySelector('.e6-cork'), drag = null, swipe = null;
    el.querySelector('.e6-bar').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var w = b.dataset.b;
      if (w === 'close') close(null);
      else if (w === 'edit') { editMode = !editMode; render(); if (!editMode) { save(); tip('布局已保存'); } }
      else if (w === 'add') { snap(); addPin(); }
      else if (w === 'reset') { snap(); S.layout = defaultLayout(); S.theme = null; sel = null; save(); render(); tip('已恢复默认五学科布局（可撤销）'); }
      else if (w === 'undo') { if (undo()) { render(); tip('已撤销'); } }
      else if (w === 'tidy') { snap(); tidy(); save(); render(); tip('已排整齐（可撤销）'); }
      else if (w === 'natural') { snap(); natural(); save(); render(); tip('随手贴好了 · 再点一次换个样子'); }
      else if (w === 'theme') { snap(); var nm = theme(); save(); render(); tip('风格：' + nm); }
      else if (w === 'deco') decoSheet();
      else if (w === 'kanban') close({ feature: 'kanban', after: function () {} });
    });
    el.addEventListener('click', function (e) { if (e.target === el) close(null); });
    cork.addEventListener('click', function (e) {
      if (editMode) {
        var tool = e.target.closest('[data-tool]');
        if (tool && sel) { tools(tool.dataset.tool); return; }
        var hx = e.target.closest('[data-hide]'); if (hx) { takeDown(hx.closest('.e6-pc').dataset.p); return; }
        return;
      }
      var t = e.target.closest('[data-a]'); if (!t) return; var a = t.dataset.a;
      if (a === 'open') { opened(t.dataset.id); var id = t.dataset.id; close({ feature: 'kanban', after: function (w) { setTimeout(function () { try { w.MinestAI.openCard(id); } catch (er) {} }, 120); } }); }
      else if (a === 'swap') { var h = replace(t.dataset.s); render(); tip(h ? '换成：' + (h.k.title || '') : '这一科没有别的可选了'); }
      else if (a === 'master') { if (master(t.dataset.id)) { render(); tip('已划掉 · 记为已掌握（卡片星级设为 5，原卡片保留）'); } }
      else if (a === 'unmaster') { if (unmaster(t.dataset.id)) { render(); tip('已撤销，星级恢复'); } }
      else if (a === 'unlink') { unlinkTask(+t.dataset.slot); render(); }
      else if (a === 'cal') editDate(t);
      else if (/^src-/.test(a)) action(a, t);
    });
    cork.addEventListener('change', function (e) {
      var t = e.target; if (editMode) return;
      if (t.dataset.a === 'tick') { toggleTask(+t.dataset.slot); setTimeout(render, 80); }
    });
    cork.addEventListener('keydown', function (e) { var t = e.target; if (t.dataset.a === 'task' && e.key === 'Enter') { e.preventDefault(); commitTask(t); t.blur(); } e.stopPropagation(); });
    cork.addEventListener('focusout', function (e) { var t = e.target; if (t.dataset.a === 'task') commitTask(t); if (t.dataset.a === 'note') { S.note = t.value; save(); } if (t.dataset.a === 'tag') { var g = byId(t.dataset.p); if (g) { g.text = t.value; save(); paint(); } } });
    function commitTask(t) { var r = setTask(+t.dataset.slot, t.value); if (r === 'nolist') { tip('先选择 Kanban 里的每日清单'); action('src-todo'); } setTimeout(function () { if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.a === 'task') return; render(); }, 120); }

    /* drag / resize (layout mode) and swipe (the word card) — one pointer path, decided at pointerdown */
    cork.addEventListener('pointerdown', function (e) {
      if (editMode && e.target.closest('.e6-tools')) return;
      var pc = e.target.closest('.e6-pc');
      if (editMode && !pc) { if (sel) { sel = null; cropMode = false; render(); } return; }
      if (!pc) return;
      if (editMode) {
        if (e.target.closest('[data-hide]')) return;
        var it = byId(pc.dataset.p), r = cork.getBoundingClientRect(), pr = pc.getBoundingClientRect();
        var how = e.target.closest('[data-rot]') ? 'rot' : (e.target.closest('[data-c]') ? 'crop' : (e.target.closest('[data-rz]') ? 'rz' : 'move'));
        if (sel !== it.id) { sel = it.id; how = 'move'; cropMode = false; }
        drag = { it: it, pc: pc, how: how, side: how === 'crop' ? e.target.closest('[data-c]').dataset.c : null, sx: e.clientX, sy: e.clientY, x: it.x, y: it.y, w: it.w, h: it.h, W: r.width, H: r.height,
          cx: pr.left + pr.width / 2, cy: pr.top + pr.height / 2, rot0: it.rot || 0, crop0: (it.crop || [0, 0, 0, 0]).slice(), moved: false };
        drag.a0 = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
        [].forEach.call(cork.querySelectorAll('.e6-sel'), function (x) { if (x !== pc) x.classList.remove('e6-sel'); }); pc.classList.add('e6-sel');
        try { cork.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); return;
      }
      var card = e.target.closest('[data-a="word"]');
      if (card) { swipe = { card: card, sx: e.clientX, sy: e.clientY, dx: 0 }; try { card.setPointerCapture(e.pointerId); } catch (er) {} }
    });
    cork.addEventListener('pointermove', function (e) {
      if (drag) {
        var dx = (e.clientX - drag.sx) / drag.W * 100, dy = (e.clientY - drag.sy) / drag.H * 100, it = drag.it;
        if (!drag.moved) { if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 4) return; drag.moved = true; snap(); var tb = el.querySelector('.e6-tools'); if (tb) tb.remove(); }
        if (drag.how === 'rz') { it.w = clamp(drag.w + dx, 3, 100 - it.x); it.h = clamp(drag.h + dy, 3, 100 - it.y); }
        else if (drag.how === 'rot') {
          var a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx), deg = drag.rot0 + (a - drag.a0) * 180 / Math.PI;
          deg = ((deg + 540) % 360) - 180; [0, 90, -90, 180, -180].forEach(function (q) { if (Math.abs(deg - q) < 2.5) deg = q; });
          it.rot = +deg.toFixed(1); drag.pc.style.transform = 'rotate(' + it.rot + 'deg)'; return;
        }
        else if (drag.how === 'crop') {
          var c = drag.crop0.slice(), px = dx / drag.w * 100, py = dy / drag.h * 100;
          if (drag.side === 't') c[0] = clamp(drag.crop0[0] + py, 0, 90 - c[2]); if (drag.side === 'b') c[2] = clamp(drag.crop0[2] - py, 0, 90 - c[0]);
          if (drag.side === 'l') c[3] = clamp(drag.crop0[3] + px, 0, 90 - c[1]); if (drag.side === 'r') c[1] = clamp(drag.crop0[1] - px, 0, 90 - c[3]);
          it.crop = c.map(function (v) { return +v.toFixed(1); }); var inn = drag.pc.querySelector('.e6-in');
          inn.style.clipPath = 'inset(' + it.crop[0] + '% ' + it.crop[1] + '% ' + it.crop[2] + '% ' + it.crop[3] + '% round 3px)';
          ['t', 'r', 'b', 'l'].forEach(function (k, i) { drag.pc.style.setProperty('--c' + k, it.crop[i] + '%'); }); return;
        }
        else {
          var nx = clamp(drag.x + dx, 0, 100 - it.w), ny = clamp(drag.y + dy, 0, 100 - it.h), gx = null, gy = null, bx = 0.9, by = 0.9;
          layout().forEach(function (o) {
            if (o === it || o.hidden) return;
            [o.x, o.x + o.w, o.x + o.w / 2].forEach(function (v, qi) { [nx, nx + it.w, nx + it.w / 2].forEach(function (m, mi) { if ((qi === 2) !== (mi === 2)) return; var d = v - m; if (Math.abs(d) < bx) { bx = Math.abs(d); gx = { v: v, d: d }; } }); });
            [o.y, o.y + o.h, o.y + o.h / 2].forEach(function (v, qi) { [ny, ny + it.h, ny + it.h / 2].forEach(function (m, mi) { if ((qi === 2) !== (mi === 2)) return; var d = v - m; if (Math.abs(d) < by) { by = Math.abs(d); gy = { v: v, d: d }; } }); });
          });
          if (gx) nx += gx.d; else nx = Math.round(nx * 2) / 2; if (gy) ny += gy.d; else ny = Math.round(ny * 2) / 2;
          it.x = clamp(nx, 0, 100 - it.w); it.y = clamp(ny, 0, 100 - it.h);
          guides(gx && gx.v, gy && gy.v);
        }
        drag.pc.style.left = it.x + '%'; drag.pc.style.top = it.y + '%'; drag.pc.style.width = it.w + '%'; drag.pc.style.height = it.h + '%';
        return;
      }
      if (swipe) { swipe.dx = e.clientX - swipe.sx; swipe.card.style.transition = 'none'; swipe.card.style.transform = 'translateX(' + swipe.dx + 'px) rotate(' + (swipe.dx / 25) + 'deg)'; }
    });
    function up(e) {
      if (drag) { var was = drag.moved; drag = null; guides(null, null); if (was) save(); render(); return; }
      if (!swipe) return;
      var s = swipe; swipe = null; s.card.style.transition = '';
      if (e.type === 'pointercancel') { s.card.style.transform = ''; return; }
      if (s.dx < -70) { s.card.style.transform = 'translateX(-140%) rotate(-12deg)'; s.card.style.opacity = '0'; setTimeout(function () { wordKnown(); render(); tip('Known ✓ 已记为认识'); }, 220); }
      else if (s.dx > 70) { s.card.style.transform = 'translateX(140%) rotate(12deg)'; s.card.style.opacity = '0'; setTimeout(function () { wordLater(); render(); }, 220); }
      else if (Math.abs(s.dx) < 6) { s.card.style.transform = ''; var id = s.card.dataset.id; close({ feature: 'kanban', after: function (w) { setTimeout(function () { try { w.MinestAI.openCard(id); } catch (er) {} }, 120); } }); }
      else s.card.style.transform = '';
    }
    cork.addEventListener('pointerup', up); cork.addEventListener('pointercancel', up);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !/INPUT|TEXTAREA/.test(e.target.tagName)) close(null);
      else if (!/INPUT|TEXTAREA/.test(e.target.tagName) && !editMode) { if (e.key === 'ArrowLeft') { wordKnown(); render(); } else if (e.key === 'ArrowRight') { wordLater(); render(); } }
      e.stopPropagation();
    });
  }
  function guides(vx, vy) {
    if (!el) return; var cork = el.querySelector('.e6-cork');
    [].forEach.call(cork.querySelectorAll('.e6-guide'), function (g) { g.remove(); });
    if (vx != null) { var a = document.createElement('i'); a.className = 'e6-guide'; a.style.cssText = 'left:' + vx + '%;top:0;bottom:0;width:1px'; cork.appendChild(a); }
    if (vy != null) { var b = document.createElement('i'); b.className = 'e6-guide'; b.style.cssText = 'top:' + vy + '%;left:0;right:0;height:1px'; cork.appendChild(b); }
  }
  function takeDown(pid) {
    var it = byId(pid); if (!it) return; snap();
    if (pid.indexOf('pin:') === 0 || pid.indexOf('deco:') === 0) S.layout = layout().filter(function (x) { return x.id !== pid; }); else it.hidden = true;
    if (sel === pid) sel = null; save(); render(); tip('已拿下 · ↶ 撤销 或「恢复默认」可以放回');
  }
  function tools(t) {
    var it = byId(sel); if (!it) return;
    if (t === 'crop') { cropMode = !cropMode; render(); if (cropMode) tip('拖动四边的黄色手柄裁剪'); return; }
    if (t === 'del') { takeDown(sel); return; }
    snap();
    if (t === 'rotL') it.rot = +((it.rot || 0) - 3).toFixed(1);
    else if (t === 'rotR') it.rot = +((it.rot || 0) + 3).toFixed(1);
    else if (t === 'straight') it.rot = 0;
    else if (t === 'uncrop') { it.crop = [0, 0, 0, 0]; cropMode = false; }
    else if (t === 'paper') it.paper = cycle(PAPERS, it.paper);
    else if (t === 'fix') it.pin = cycle(FIXES, it.pin);
    else if (t === 'tapecolor') it.color = cycle(Object.keys(TAPES), it.color);
    else if (t === 'sticker') it.text = cycle(STICKERS, it.text);
    else if (t === 'front') { var L = layout(); L.splice(L.indexOf(it), 1); L.push(it); }
    else if (t === 'back') { var L2 = layout(); L2.splice(L2.indexOf(it), 1); L2.unshift(it); }
    else if (t === 'dup') {
      if (it.id.indexOf('deco:') !== 0) { tip('布告栏上的内容只贴一份；装饰可以复制'); UNDO.pop(); return; }
      var c = JSON.parse(JSON.stringify(it)); c.id = it.id.replace(/:[^:]+$/, ':' + uid()); c.x = Math.min(100 - c.w, c.x + 3); c.y = Math.min(100 - c.h, c.y + 3); layout().push(c); sel = c.id;
    }
    save(); render();
  }
  function editDate(t) {
    if (t.querySelector('input')) return;
    var inp = document.createElement('input'); inp.type = 'date'; inp.value = S.exam.date; t.appendChild(inp); inp.focus();
    try { inp.showPicker && inp.showPicker(); } catch (e) {}
    inp.addEventListener('click', function (e) { e.stopPropagation(); });
    inp.addEventListener('change', function () { if (/^\d{4}-\d\d-\d\d$/.test(inp.value)) { S.exam.date = inp.value; save(); tip('考试日期：' + inp.value); } render(); });
    inp.addEventListener('blur', function () { setTimeout(render, 150); });
  }

  /* ---------------------------------------------------------------- open / close (the room's panel contract) */
  function open(c) {
    ctx = c || {}; ensureCss(); editMode = false;
    return new Promise(function (resolve) {
      el = document.createElement('div'); el.id = 'sh-ec6'; el.tabIndex = -1;
      el.innerHTML = '<div class="e6-fit"><div class="e6-frame"><div class="e6-bar"><button type="button" data-b="undo" hidden title="撤销上一步">↶ 撤销</button><button type="button" data-b="add" hidden>＋ 贴一张</button><button type="button" data-b="deco" hidden>＋ 装饰</button><button type="button" data-b="tidy" hidden title="排成整齐的行">✨ 自动整理</button><button type="button" data-b="natural" hidden title="像真实布告栏那样随手贴">🍃 随手贴</button><button type="button" data-b="theme" hidden title="换整体风格">🎨 风格</button><button type="button" data-b="reset" hidden>恢复默认</button><button type="button" data-b="edit">✥ 排版</button><button type="button" data-b="kanban">Kanban</button><button type="button" data-b="close">回到房间</button></div><div class="e6-cork"></div></div></div>';
      (ctx.container || document.body).appendChild(el);
      closeFn = resolve; bind(); fit(); root.addEventListener('resize', fit);
      var go = function () { render(); requestAnimationFrame(function () { el && el.classList.add('e6-on'); try { el.focus(); } catch (e) {} }); };
      if (ctx.host) { el.querySelector('.e6-cork').innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#3a2a1a;font-weight:600">正在读取 Minest…</div>'; el.classList.add('e6-on'); ctx.host().then(function (w) { if (w) HW = function () { return w; }; go(); }); }
      else go();
      clearInterval(liveTimer); var day = today();
      liveTimer = setInterval(function () { if (today() !== day) { day = today(); render(); } }, 30000);       // midnight: a new day, a new count
    });
  }
  /* the board is drawn at 1100 × 680 and scaled to the screen; below 0.6 it keeps that size and scrolls */
  function fit() {
    if (!el) return;
    var aw = el.clientWidth - 24, ah = el.clientHeight - 24, s = Math.min(aw / 1100, (ah - 36) / 680), small = s < 0.6;
    s = Math.max(s, 0.6);
    var fr = el.querySelector('.e6-frame'), f = el.querySelector('.e6-fit');
    fr.style.transform = 'scale(' + s + ')'; f.style.width = Math.round(1100 * s) + 'px'; f.style.height = Math.round(680 * s) + 'px';
    f.style.marginTop = Math.round(36 * s) + 'px'; el.classList.toggle('e6-scroll', small);
  }
  function close(result) {
    if (!el) return; clearInterval(liveTimer); root.removeEventListener('resize', fit);
    var a = document.activeElement; if (a && a.dataset && a.dataset.a === 'task') a.blur();
    var e0 = el; el = null; e0.classList.remove('e6-on'); setTimeout(function () { e0.remove(); }, 280);
    save(); paint(); var f = closeFn; closeFn = null; if (f) f(result || null);
  }

  /* ================================================================ the 3D picture (canvas texture on the cork) */
  var CW = 1536, CH = 1024, canvas = null, tex = null, plane = null;
  function wrap(g, text, x, y, w, lh, maxLines) {
    var words = String(text || '').split(/(\s+)/), line = '', n = 0, out = [];
    if (/[㐀-鿿]/.test(text)) words = String(text).split('');
    for (var i = 0; i < words.length; i++) { var t = line + words[i]; if (g.measureText(t).width > w && line) { out.push(line); line = words[i].replace(/^\s+/, ''); } else line = t; }
    out.push(line);
    out.slice(0, maxLines).forEach(function (l, i) { if (i === maxLines - 1 && out.length > maxLines) l = l.replace(/.{0,2}$/, '…'); g.fillText(l.trim(), x, y + i * lh); n++; });
    return n;
  }
  var CUR = null, PAPERC = { white: '#fffdf8', kraft: '#d8bd8f', yellow: '#fff2a0', blue: '#dcecfb', grid: '#fffdf8' };
  function paper(g, x, y, w, h, col, pin) {
    if (CUR && CUR.paper && PAPERC[CUR.paper]) col = PAPERC[CUR.paper];
    if (CUR && CUR.pin && CUR.pin !== 'auto') pin = null;              // the chosen fixing is drawn after the piece
    g.save(); g.shadowColor = 'rgba(40,25,10,.45)'; g.shadowBlur = 12; g.shadowOffsetY = 5; g.fillStyle = col || '#fbf6ea'; g.fillRect(x, y, w, h); g.restore();
    if (pin) { g.fillStyle = pin; g.beginPath(); g.arc(x + w / 2, y + 4, 9, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x + w / 2 - 3, y + 1, 3, 0, 6.3); g.fill(); }
  }
  function paint() {
    if (!canvas) return;
    var g = canvas.getContext('2d'), r = SpatialVoxel.rng(7);
    g.fillStyle = '#c69d6c'; g.fillRect(0, 0, CW, CH);
    for (var i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,60,30,.18)' : 'rgba(255,238,205,.2)'; g.fillRect((r() * CW) | 0, (r() * CH) | 0, 4, 4); }
    var serif = 'Georgia, "Times New Roman", serif', sans = '-apple-system, "PingFang SC", sans-serif';
    layout().filter(function (it) { return !it.hidden; }).forEach(function (it) {
      var x = it.x / 100 * CW, y = it.y / 100 * CH, w = it.w / 100 * CW, h = it.h / 100 * CH, id = it.id;
      CUR = it; g.save();
      /* the piece as it hangs: turned about its centre, cropped */
      if (it.rot) { g.translate(x + w / 2, y + h / 2); g.rotate(it.rot * Math.PI / 180); g.translate(-(x + w / 2), -(y + h / 2)); }
      var cr = it.crop; if (cr && (cr[0] || cr[1] || cr[2] || cr[3])) { g.beginPath(); g.rect(x + w * cr[3] / 100, y + h * cr[0] / 100, w * (1 - (cr[1] + cr[3]) / 100), h * (1 - (cr[0] + cr[2]) / 100)); g.clip(); }
      try {
        if (id.indexOf('deco:') === 0) paintDeco(g, it, x, y, w, h);
        else if (id === 'title') { g.fillStyle = '#1d2b4f'; g.fillRect(x, y, w, h); g.fillStyle = '#f6ecd8'; g.font = '800 ' + Math.round(h * 0.45) + 'px ' + serif; g.textBaseline = 'middle'; g.fillText('EC–6 Exam', x + 22, y + h / 2); g.textBaseline = 'alphabetic'; g.font = '500 ' + Math.round(h * 0.2) + 'px ' + sans; g.globalAlpha = .75; g.fillText('Study Studio', x + w * 0.62, y + h * 0.6); g.globalAlpha = 1; }
        else if (id === 'countdown') {
          paper(g, x, y, w, h, '#fffaf0'); g.fillStyle = '#c0392b'; g.fillRect(x, y, w, h * 0.18); g.fillStyle = '#fff'; g.font = '700 ' + Math.round(h * 0.1) + 'px ' + sans; g.textAlign = 'center'; g.fillText('EC–6 EXAM', x + w / 2, y + h * 0.13);
          var n = Math.max(0, daysLeft()); g.fillStyle = '#1d2b4f'; g.font = '800 ' + Math.round(h * 0.42) + 'px ' + serif; g.fillText(String(n), x + w / 2, y + h * 0.66);
          g.font = '500 ' + Math.round(h * 0.09) + 'px ' + sans; g.fillStyle = '#5a4a3a'; g.fillText('days · ' + S.exam.date, x + w / 2, y + h * 0.88); g.textAlign = 'left';
        }
        else if (id === 'progress') {
          var rr = big3(), dn = rr.filter(function (q) { return q.card && q.card.complete; }).length, hv = rr.filter(function (q) { return q.card; }).length;
          var labels = [['BIG THREE', dn + '/' + (hv || 3)], ['CHARTS', chartsDone() + '/5'], ['WORDS', '+' + ((wordState() || {}).knownToday || 0)]];
          labels.forEach(function (lb, j) { var bx = x + j * (w / 3) + 4, bw = w / 3 - 8; paper(g, bx, y, bw, h); g.fillStyle = '#7a6a58'; g.font = '600 ' + Math.round(h * 0.2) + 'px ' + sans; g.fillText(lb[0], bx + 10, y + h * 0.36); g.fillStyle = '#2b2218'; g.font = '800 ' + Math.round(h * 0.36) + 'px ' + sans; g.fillText(lb[1], bx + 10, y + h * 0.8); });
        }
        else if (id.indexOf('chart:') === 0 || id.indexOf('pin:') === 0) {
          var sub, hk;
          if (id.indexOf('chart:') === 0) { sub = SUBJECTS.filter(function (s) { return 'chart:' + s.id === id; })[0]; hk = pick(sub.id); }
          else { hk = findCard(id.slice(4)); sub = hk ? (SUBJECTS.filter(function (s) { return s.id === subjectOf(hk.c); })[0] || SUBJECTS[4]) : SUBJECTS[4]; }
          paper(g, x, y, w, h, '#fbf6ea', sub.ink); g.fillStyle = sub.ink; g.fillRect(x, y, w, 8);
          g.font = '700 ' + Math.round(w * 0.075) + 'px ' + sans; g.fillText(sub.name.toUpperCase(), x + 10, y + 34);
          g.fillStyle = '#efe6d3'; g.fillRect(x + 10, y + 46, w - 20, h * 0.3);
          g.font = Math.round(h * 0.15) + 'px ' + sans; g.textAlign = 'center'; g.fillText(sub.glyph, x + w / 2, y + 46 + h * 0.22); g.textAlign = 'left';
          if (hk) {
            var done = crossed(hk.k.id); g.fillStyle = '#2b2218'; g.font = '700 ' + Math.round(w * 0.085) + 'px ' + serif;
            var ty = y + 60 + h * 0.3 + w * 0.08, nl = wrap(g, hk.k.title || '', x + 10, ty, w - 20, w * 0.1, 3);
            g.fillStyle = '#6a5a48'; g.font = '400 ' + Math.round(w * 0.06) + 'px ' + sans; wrap(g, clip(hk.k.meaning || hk.k.desc || '', 90), x + 10, ty + nl * w * 0.1 + 8, w - 20, w * 0.075, 3);
            if (done) { g.strokeStyle = '#c0392b'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 8, ty - w * 0.03); g.lineTo(x + w - 8, ty + w * 0.05); g.stroke(); }
          } else { g.fillStyle = '#6a5a48'; g.font = '500 ' + Math.round(w * 0.065) + 'px ' + sans; wrap(g, chartsBoard() ? '都掌握了' : '未找到 Anchor Charts', x + 10, y + h * 0.55, w - 20, w * 0.08, 2); }
        }
        else if (id === 'big3') {
          paper(g, x, y, w, h, '#fff8c9', '#c0392b'); g.strokeStyle = 'rgba(47,111,214,.18)'; g.lineWidth = 2;
          for (var ly = y + h * 0.3; ly < y + h - 6; ly += h * 0.22) { g.beginPath(); g.moveTo(x + 8, ly + 6); g.lineTo(x + w - 8, ly + 6); g.stroke(); }
          g.fillStyle = '#2b2218'; g.font = '800 ' + Math.round(h * 0.13) + 'px ' + serif; g.fillText("Today's Big Three", x + 16, y + h * 0.18);
          big3().forEach(function (q, j) {
            var by = y + h * (0.38 + j * 0.22); g.strokeStyle = '#2b2218'; g.lineWidth = 3; g.strokeRect(x + 18, by - h * 0.09, h * 0.1, h * 0.1);
            if (q.card && q.card.complete) { g.strokeStyle = '#2f9a5a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 20, by - h * 0.04); g.lineTo(x + 18 + h * 0.04, by); g.lineTo(x + 18 + h * 0.12, by - h * 0.12); g.stroke(); }
            g.fillStyle = q.card ? '#1d2b4f' : 'rgba(29,43,79,.35)'; g.font = '500 ' + Math.round(h * 0.11) + 'px "Bradley Hand","Kaiti SC",cursive';
            var tx = x + 30 + h * 0.12, txt = q.card ? q.card.title : '— ' + (j + 1) + ' —'; wrap(g, txt, tx, by, w - (tx - x) - 14, h * 0.12, 1);
            if (q.card && q.card.complete) { var tw = Math.min(g.measureText(txt).width, w - (tx - x) - 14); g.strokeStyle = '#1d2b4f'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, by - h * 0.035); g.lineTo(tx + tw, by - h * 0.035); g.stroke(); }
          });
        }
        else if (id === 'words') {
          var st = wordState(); paper(g, x + 10, y + 10, w, h, '#f3ead6'); paper(g, x + 5, y + 5, w, h, '#f7efdd'); paper(g, x, y, w, h, '#fffdf7');
          g.textAlign = 'center'; g.fillStyle = '#8a7a68'; g.font = '600 ' + Math.round(w * 0.055) + 'px ' + sans; g.fillText("TODAY'S WORDS", x + w / 2, y + h * 0.12);
          g.fillStyle = '#1d2b4f'; g.font = '800 ' + Math.round(w * 0.12) + 'px ' + serif;
          wrap(g, st && st.card ? st.card.title : (st ? '🎉' : 'Word List'), x + w / 2, y + h * 0.5, w - 24, w * 0.13, 2);
          if (st) { g.fillStyle = '#8a7a68'; g.font = '500 ' + Math.round(w * 0.05) + 'px ' + sans; g.fillText(st.left + ' left', x + w / 2, y + h * 0.9); }
          g.textAlign = 'left';
        }
        else if (id === 'note') { paper(g, x, y, w, h, '#dff0ff', '#2f6fd6'); g.fillStyle = '#1d2b4f'; g.font = '500 ' + Math.round(h * 0.09) + 'px "Bradley Hand",cursive'; wrap(g, S.note || '', x + 14, y + h * 0.2, w - 28, h * 0.11, 6); }
      } catch (e) {}
      g.restore(); g.save();
      if (it.rot) { g.translate(x + w / 2, y + h / 2); g.rotate(it.rot * Math.PI / 180); g.translate(-(x + w / 2), -(y + h / 2)); }
      try { if (id.indexOf('deco:') !== 0) paintFix(g, it, x, y, w, h); } catch (e2) {}
      g.restore(); CUR = null;
    });
    if (tex) tex.needsUpdate = true;
  }
  function paintFix(g, it, x, y, w, h) {
    var f = it.pin; if (!f || f === 'auto' || f === 'none') return;
    if (f === 'tape') { g.fillStyle = 'rgba(242,193,61,.72)'; [[x - 6, -0.55], [x + w - 40, 0.55]].forEach(function (q) { g.save(); g.translate(q[0] + 23, y + 2); g.rotate(q[1]); g.fillRect(-26, -9, 52, 18); g.restore(); }); return; }
    if (f === 'clip') { g.strokeStyle = '#a7b0ba'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + w * 0.16, y + 26); g.lineTo(x + w * 0.16, y - 12); g.arc(x + w * 0.16 + 7, y - 12, 7, Math.PI, 0); g.lineTo(x + w * 0.16 + 14, y + 18); g.stroke(); return; }
    var c = PINS[f]; if (!c) return; g.fillStyle = c; g.beginPath(); g.arc(x + w / 2, y + 4, 9, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x + w / 2 - 3, y + 1, 3, 0, 6.3); g.fill();
  }
  function paintDeco(g, it, x, y, w, h) {
    var kind = it.id.split(':')[1];
    if (kind === 'tape') { g.fillStyle = TAPES[it.color] || TAPES.sun; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; for (var i = 0; i < w; i += 14) g.fillRect(x + i, y, 6, h); }
    else if (kind === 'sticker') { g.font = Math.round(Math.min(w, h) * 0.85) + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.text || '⭐', x + w / 2, y + h / 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
    else if (kind === 'tag') { g.fillStyle = '#d8bd8f'; g.fillRect(x, y, w, h); g.fillStyle = '#6b4428'; g.beginPath(); g.arc(x + 12, y + h / 2, 5, 0, 6.3); g.fill(); g.fillStyle = '#2b2218'; g.font = '600 ' + Math.round(h * 0.42) + 'px "Bradley Hand","Kaiti SC",cursive'; g.textBaseline = 'middle'; g.fillText(it.text || '', x + 24, y + h / 2); g.textBaseline = 'alphabetic'; }
    else if (kind === 'arrow') { g.strokeStyle = '#c0392b'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * 0.04, y + h * 0.75); g.bezierCurveTo(x + w * 0.3, y + h * 0.15, x + w * 0.6, y + h * 0.15, x + w * 0.88, y + h * 0.5); g.stroke();
      g.beginPath(); g.moveTo(x + w * 0.76, y + h * 0.25); g.lineTo(x + w * 0.9, y + h * 0.5); g.lineTo(x + w * 0.74, y + h * 0.7); g.stroke(); }
  }
  function chartsDone() { var day = today(), n = 0; SUBJECTS.forEach(function (s) { var id = S.picks[day] && S.picks[day][s.id]; if (id && (crossed(id) || (S.opened[day] && S.opened[day][id]))) n++; }); return n; }

  /* the room's bulletin board object becomes the EC–6 board: bigger, the live picture on its cork, a panel instead of a feature */
  function attach(o, hostGetter) {
    if (hostGetter) HW = hostGetter;
    if (!canvas) { canvas = document.createElement('canvas'); canvas.width = CW; canvas.height = CH; }
    tex = new THREE.CanvasTexture(canvas); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 1.02), new THREE.MeshLambertMaterial({ map: tex }));
    /* the old placeholder cards and header bars would show through: only the frame + cork (the widest mesh) and the hit box stay */
    var frameMesh = null, wmax = 0;
    o.group.children.forEach(function (c) { if (!c.isMesh || c === o.hit || !c.geometry) return; c.geometry.computeBoundingBox(); var bb = c.geometry.boundingBox, w = bb.max.x - bb.min.x; if (w > wmax) { wmax = w; frameMesh = c; } });
    o.group.children.forEach(function (c) { if (c.isMesh && c !== o.hit && c !== frameMesh) c.visible = false; });
    plane.position.set(0, 0, 0.05); plane.receiveShadow = true; o.group.add(plane);
    o.group.scale.setScalar(1.3);
    o.name = 'EC–6 布告栏'; o.en = 'EC–6 bulletin board'; o.feature = 'ec6board';
    o.label = [0, 0.7, 0.05];
    o.panel = open;
    /* the close-up: straight in front of the board, ~1.9 m away, so the whole board fills the view */
    o.baseScale = 1.3;                                       // the room's hover easing keeps this size
    o.set = function () {};
    o.afterBuild = (function (prev) { return function () {
      if (prev) prev();
      var c = new THREE.Vector3(), nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(o.group.getWorldQuaternion(new THREE.Quaternion()));
      o.group.getWorldPosition(c);
      o.focus = { pos: [c.x + nrm.x * 2.6, c.y + 0.02, c.z + nrm.z * 2.6], look: [c.x, c.y, c.z] };
      o.labelAt = new THREE.Vector3(o.label[0], o.label[1], o.label[2]).applyMatrix4(o.group.matrixWorld);
    }; })(o.afterBuild);
    paint();
    return o;
  }
  /* repaint the 3D picture now and then (Kanban edits made elsewhere show up on the cork) */
  setInterval(function () { if (canvas && !el && !document.hidden) paint(); }, 20000);
  root.addEventListener('spatialhome:host', function () { setTimeout(paint, 200); });

  root.SpatialEC6 = {
    attach: attach, open: open, paint: paint, version: '1.0',
    _: { S: function () { return S; }, pick: pick, big3: big3, wordState: wordState, wordKnown: wordKnown, wordLater: wordLater, todoList: todoList, chartsBoard: chartsBoard, daysLeft: daysLeft, setHost: function (f) { HW = f; } }
  };
})(window);
