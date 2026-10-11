/* Minest Knowledge · My World — Quick Capture & Smart Organize (window.MinestCapture)
   Add → Understand → Suggest → Confirm → Organize → Find Again.
   - Anything goes in first (text, a link, a photo, or a pasted batch); the user never has to pick a list up front.
   - Suggestions come from local rules (topic words, list names, item type), local similarity (what each list already
     holds) and what the user corrected before; AI is an optional extra (Ask AI), never needed.
   - One item, many relationships: the item is one knowledge item 'ki:cap:<id>'; each list it belongs to gets one
     stacked card that points to it ('pk:<stacked card>') — the same links the Visual Quick Add uses. Items ↔ lists
     form a graph (graph()), ready for a future map / ring view.
   - Nothing disappears: with no list chosen it goes to My Inbox; every add / change is logged ('wl:<id>': Recently
     Added / Recently Organized), lists that grew show +N or NEW ('wn:<card>') until looked at, and every batch can be undone.
   - New lists are only made when the user says yes (a suggestion is just a suggestion). */
(function () {
  if (window.MinestCapture) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function ago(t) { var s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; }

  // ================================================================== words
  var STOP = ' a an the and or but if of to in on at for with from by about into over after before this that these those it its is are was were be been am i me my we our you your he she they them his her their what which who how why when where can could would should will just so very really also some any more most not no do does did have has had get got make made let lot lots there here than then as up out new one two all ';
  function stem(w) { w = w.toLowerCase(); if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y'; if (w.length > 6 && /ing$/.test(w)) return w.slice(0, -3); if (w.length > 5 && /oes$/.test(w)) return w.slice(0, -2); if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2); if (w.length > 4 && /(ch|sh|x|z|ss)es$/.test(w)) return w.slice(0, -2); if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1); return w; }
  function words(s) { return (String(s || '').toLowerCase().match(/[a-z0-9一-鿿][a-z0-9'一-鿿-]*/g) || []).map(function (w) { return w.replace(/'s$/, '').replace(/'/g, ''); }).filter(function (w) { return w.length > 1 && STOP.indexOf(' ' + w + ' ') < 0; }); }
  function stems(s) { var o = {}; words(s).forEach(function (w) { o[stem(w)] = 1; }); return o; }

  // ---------------------------------------------------------------- topics (local rules — content topics only, never personal traits)
  var TOPICS = [
    ['Gardening', 'garden gardening grow growing seed seedling soil compost backyard tomato vegetable herb harvest planting greenhouse'],
    ['Plants', 'plant plants flower tree tomato herb leaf seed succulent cactus rose orchid'],
    ['Home', 'home house room backyard kitchen furniture apartment decor renovation garage bedroom'],
    ['Cooking', 'cook cooking recipe bake baking dinner meal food kitchen soup bread dessert'],
    ['Photography', 'photo photography camera lens shoot portrait landscape shot film exposure'],
    ['Travel', 'travel trip flight hotel visit vacation journey tour itinerary passport abroad'],
    ['Books', 'book novel read reading author chapter library paperback kindle'],
    ['Movies', 'movie film cinema watch director trailer netflix documentary'],
    ['Music', 'music song album band artist concert piano guitar sing singer playlist'],
    ['AI', 'ai chatgpt gpt llm neural prompt claude openai gemini copilot'],
    ['Coding', 'code coding programming javascript python app software developer github api bug'],
    ['Education', 'education teach teaching teacher school classroom student lesson curriculum ec-6 k-12 pedagogy'],
    ['Learning', 'learn learning study course practice tutorial lecture'],
    ['Skills', 'skill learn how-to practice master technique'],
    ['Health', 'health exercise workout fitness run running sleep diet doctor nutrition'],
    ['Family', 'family kid son daughter parent mom dad baby grandma grandpa sibling'],
    ['History', 'history historical ancient war century revolution empire medieval civilization'],
    ['Science', 'science physics chemistry biology experiment lab scientist research'],
    ['Space', 'space planet star moon astronomy telescope nasa galaxy orbit rocket'],
    ['Nature', 'nature forest mountain river ocean wildlife hike hiking lake beach outdoor'],
    ['Animals', 'animal dog cat bird pet wildlife puppy kitten horse'],
    ['Art', 'art drawing painting paint sketch museum artist gallery watercolor'],
    ['Design', 'design ui ux typography layout logo interface'],
    ['Business', 'business startup marketing sale company customer product entrepreneur'],
    ['Money', 'money budget saving invest finance price cost bank'],
    ['Sports', 'sport soccer basketball football tennis swim swimming baseball team match'],
    ['Games', 'game gaming video chess puzzle board-game nintendo minecraft'],
    ['Writing', 'write writing story essay journal poem poetry blog draft'],
    ['Languages', 'language spanish chinese french english vocabulary grammar pronunciation'],
    ['Math', 'math mathematics algebra geometry fraction equation number'],
    ['Technology', 'tech technology device phone computer laptop gadget iphone ipad'],
    ['Friends', 'friend friendship'],
    ['Work', 'work job career office meeting project colleague'],
    ['Wellbeing', 'mindfulness meditation calm stress mood gratitude happy relax'],
    ['Ideas', 'idea ideas concept brainstorm what-if'],
    ['Plans', 'plan plans goal goals want hope dream someday next spring summer fall winter weekend tomorrow'],
    ['Skills', 'learn how']
  ].map(function (t) { var o = {}; t[1].split(' ').forEach(function (w) { o[stem(w)] = 1; }); o[stem(t[0])] = 1; return { name: t[0], words: o }; });
  var GENERAL = ['Plans', 'Ideas', 'Learning', 'Skills'];   // too general to become a list by themselves
  var WEAK = {}; 'learn plan idea thing list favorite resource project dream goal skill new place tool want hope wish own'.split(' ').forEach(function (w) { WEAK[stem(w)] = 1; });   // too common to mean much in a list's name
  function topicsOf(st) {
    var out = {};
    TOPICS.forEach(function (t) { var n = 0; Object.keys(t.words).forEach(function (w) { if (st[w]) n++; }); if (n) out[t.name] = (out[t.name] || 0) + n; });
    return out;
  }

  // ================================================================== where things can go (the lists of the user's worlds)
  function worldIds() { var ks = KN() ? KN().keys('lom:world:') : []; return ks.map(function (k) { return k.slice(10); }).filter(function (id) { return boardById(id); }); }
  function candidates() {
    var out = [];
    worldIds().forEach(function (bid) {
      var b = boardById(bid);
      (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
        if (!c || !c.id || KN().isHeading(c.id) || KN().get('sk:' + c.id)) return;
        var have = {}; (c.stack || []).slice(-60).forEach(function (s) { Object.keys(stems(s.title + ' ' + (s.desc || '').slice(0, 120))).forEach(function (w) { have[w] = (have[w] || 0) + 1; }); });
        out.push({ bid: bid, board: b.title, id: c.id, title: c.title, area: col.title, color: col.color, st: stems(String(c.title).replace(/^my\s+/i, '')), have: have, n: (c.stack || []).length });
      }); });
    });
    return out;
  }
  function learned() { return (KN() && KN().get('wm:learn')) || {}; }
  function learn(st, cardId, d) {
    var L = Object.assign({}, learned()), ws = Object.keys(st).slice(0, 12);
    ws.forEach(function (w) { var e = Object.assign({}, L[w] || {}); e[cardId] = Math.max(-3, Math.min(3, (e[cardId] || 0) + d)); if (!e[cardId]) delete e[cardId]; L[w] = e; });
    var keys = Object.keys(L); if (keys.length > 600) keys.slice(0, keys.length - 600).forEach(function (k) { delete L[k]; });
    KN().set('wm:learn', L, true);
  }
  // the item's words → a score for each list
  function suggest(item, cands) {
    var st = stems(item.title + ' ' + (item.text || '') + ' ' + (item.link ? linkWords(item.link) : '')), tp = topicsOf(st), L = learned();
    var said = item.title + ' ' + (item.text || '');
    var toLearn = /\b(how to|learn(ing)? (to|how)|want to learn|practi[cs]e)\b/i.test(said), toPlan = /\b(want to|wanna|plan(ning)? to|hope to|someday|next (week|month|year|spring|summer|fall|winter|weekend)|this (spring|summer|fall|winter|weekend))\b/i.test(said);
    var scored = cands.map(function (c) {
      var tw = Object.keys(c.st), s = 0, why = [];
      if (!tw.length) return { c: c, s: 0 };
      var hit = tw.reduce(function (a, w) { return a + (st[w] ? (WEAK[w] ? .25 : 1) : 0); }, 0);
      if (hit) { s += 4 * hit / Math.sqrt(tw.length); why.push('name'); }
      TOPICS.forEach(function (t) { if (!tp[t.name]) return; var m = tw.filter(function (w) { return t.words[w]; }).length; if (m) { var same = tw.indexOf(stem(t.name)) >= 0; s += Math.min(3, (same ? 2.5 : 1.2) * tp[t.name]) * (GENERAL.indexOf(t.name) >= 0 ? .4 : 1) * m / tw.length; why.push(t.name); } });
      var sim = 0; Object.keys(st).forEach(function (w) { if (c.have[w]) sim += Math.min(2, c.have[w]); }); if (sim) { s += Math.min(2.5, sim * .4); why.push('similar'); }
      Object.keys(st).forEach(function (w) { if (L[w] && L[w][c.id]) s += L[w][c.id] * .6; });
      if (toLearn && /\bskills?\b/i.test(c.title)) { s += 1.6; why.push('learn'); }
      if (toPlan && /\b(goals?|plans?|dreams?|wish(es|list)?|bucket)\b/i.test(c.title)) { s += 1.3; why.push('plan'); }
      if (item.type === 'link' && /\b(article|link|bookmark|reading|resource|newsletter)/i.test(c.title)) s += 1;
      if (item.type === 'image' && /\b(photo|picture|image|art)/i.test(c.title)) s += 1;
      if (/inbox/i.test(c.title)) s = 0;
      return { c: c, s: s, why: why };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
    var top = scored.filter(function (x) { return x.s >= 2.4; }).slice(0, 4), rel = scored.filter(function (x) { return x.s >= 1 && top.indexOf(x) < 0; }).slice(0, 4);
    // topics that no list covers yet → a new list of the user's own (only if they say yes)
    var topC = top.map(function (x) { return x.c; });
    var fresh = Object.keys(tp).filter(function (n) { var T = TOPICS.filter(function (t) { return t.name === n; })[0];
        return GENERAL.indexOf(n) < 0 && !cands.some(function (c) { return c.st[stem(n)]; }) && !topC.some(function (c) { return Object.keys(c.st).some(function (w) { return T.words[w]; }); }) && (tp[n] >= 2 || !topC.length); })
      .sort(function (a, b) { return tp[b] - tp[a]; }).slice(0, 2);
    return { _scored: scored.slice(0, 8).map(function (x) { return x.c.title + ' ' + x.s.toFixed(2) + ' ' + x.why.join('/'); }), top: top.map(function (x) { return x.c; }), rel: rel.map(function (x) { return x.c; }), fresh: fresh, topics: tp, st: st };
  }
  function linkWords(u) { try { var x = new URL(u), q = []; x.searchParams.forEach(function (v) { if (/[a-z]{3,}[-_+ ][a-z]{2,}/i.test(v)) q.push(v); }); return x.hostname.replace(/^(www|m)\./, '').split('.').slice(0, -1).join(' ') + ' · ' + (decodeURIComponent(x.pathname) + ' ' + q.join(' ')).replace(/[\/_\-.+]+/g, ' ').replace(/\b(watch|index|html?|php|amp|www)\b/gi, ' ').replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } }

  // ================================================================== items
  var URL_RE = /^(https?:\/\/|www\.)\S+$/i;
  function makeItem(raw, src) {
    var t = String(raw || '').trim(); if (!t) return null;
    var it = { id: rid(), text: t, src: src || 'typed', at: Date.now(), type: 'text' };
    var link = (t.match(/(https?:\/\/\S+|www\.\S+)/i) || [])[0];
    if (link) { it.link = /^www\./i.test(link) ? 'https://' + link : link.replace(/[).,]+$/, ''); if (URL_RE.test(t)) it.type = 'link'; }
    var rest = t.replace(link || '\u0000', '').trim();
    if (it.type === 'link' || !rest) { var lw = linkWords(it.link || ''); it.title = (lw ? lw.replace(/\s+/g, ' ').replace(/ · $/, '').trim().replace(/^./, function (c) { return c.toUpperCase(); }) : it.link || t).slice(0, 90); it.type = 'link'; }
    else { var first = (rest.split(/\n/)[0].match(/^.*?[.!?。！？](?=\s|$)/) || [rest.split(/\n/)[0]])[0]; it.title = first.length > 90 ? first.slice(0, 87).replace(/\s+\S*$/, '') + '…' : first; }
    return it;
  }
  // a pasted batch: one item per line (or per paragraph when the text has blank lines)
  function splitBatch(text) {
    var t = String(text || '').replace(/\r/g, '').trim(); if (!t) return [];
    var parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
    return parts.map(function (p) { return p.replace(/^\s*([-*•·]|\d+[.)])\s+/, '').trim(); }).filter(function (p) { return p.length > 1; }).slice(0, 300);
  }

  // ================================================================== organize = write relationships (one update per board)
  function locate(b, cardId) { var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id === cardId) hit = { col: col, card: c }; }); }); return hit; }
  function written(before) { var t0 = Date.now(); return new Promise(function (done) { (function wait() { if (A().boards() !== before || Date.now() - t0 > 900) done(); else requestAnimationFrame(wait); })(); }); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9一-鿿]+/g, ''); }
  // plan: [{item, to:[cardId...], newLists:[topic...]}] ; target world for new lists / the inbox: wbid
  function organize(plan, wbid, src, kind) {
    var byBoard = {}, log = { id: rid(), at: Date.now(), src: src || 'typed', kind: kind || 'add', items: [], lists: {}, created: [], stacks: [] }, side = {}, news = {};
    function B(bid) { if (!byBoard[bid]) { var b0 = boardById(bid); if (!b0) return null; byBoard[bid] = { b0: b0, b: JSON.parse(JSON.stringify(b0)) }; } return byBoard[bid].b; }
    function ensureList(bid, colId, colTitle, cardId, title) {
      var b = B(bid); if (!b) return null; var L = locate(b, cardId); if (L) return L.card;
      var col = (b.columns || []).filter(function (c) { return c.id === colId; })[0];
      if (!col) { col = { id: colId, title: colTitle, color: '#5e5ce6', cards: [] }; b.columns = (b.columns || []).concat([col]); }
      var c = { id: cardId, title: title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] };
      col.cards = (col.cards || []).concat([c]); log.created.push({ bid: bid, id: cardId }); news[cardId] = { isNew: true };
      return c;
    }
    var bidOf = {}; candidates().forEach(function (c) { bidOf[c.id] = c.bid; });
    plan.forEach(function (p) {
      var it = p.item, key = p.key || 'ki:cap:' + it.id, to = (p.to || []).slice();
      (p.newLists || []).forEach(function (n) { var cid = wbid + '-l-mine-' + slug(n); ensureList(wbid, wbid + '-d-mine', 'My Own Lists', cid, 'My ' + n); bidOf[cid] = wbid; if (to.indexOf(cid) < 0) to.push(cid); });
      if (!to.length) { var ib = wbid + '-l-mine-inbox'; ensureList(wbid, wbid + '-d-mine', 'My Own Lists', ib, 'My Inbox'); bidOf[ib] = wbid; to.push(ib); }
      var rec = Object.assign({}, KN().get(key) || {}, { title: it.title, text: it.text || '', link: it.link || '', type: it.type || 'text', src: it.src || src, cat: 'cap', at: it.at || Date.now() });
      if (it.img) rec.img = it.img;
      var went = [];
      to.forEach(function (cid) {
        var bid = bidOf[cid] || wbid, b = B(bid); if (!b) return; var L = locate(b, cid); if (!L) return;
        var h = (L.card.stack || []).some(function (s) { return KN().get('pk:' + s.id) === key || (norm(s.title) === norm(it.title) && norm(s.desc || '') === norm(descOf(it))); });
        if (h) return;   // already there: one relationship per list
        var sid = cid + '~cap-' + slug(it.id);
        var s = { id: sid, title: it.title, desc: descOf(it), labels: [], complete: false, mastery: 1 };
        if (rec.img) s.cover = { type: 'image', value: rec.img, url: rec.img, title: '', size: 'banner' };
        L.card.stack = (L.card.stack || []).concat([s]); L.card.hasStack = true;
        side['pk:' + sid] = key; went.push(cid); log.stacks.push({ bid: bid, card: cid, id: sid });
        log.lists[cid] = (log.lists[cid] || 0) + 1;
        var w = news[cid] || (news[cid] = {}); w.n = (w.n || 0) + 1;
      });
      side[key] = rec;
      log.items.push({ key: key, title: it.title, to: went });
    });
    if (!log.stacks.length && !log.created.length) return Promise.resolve(log);
    var before = A().boards();
    Object.keys(byBoard).forEach(function (bid) { var x = byBoard[bid]; A().updateBoard(bid, function () { return x.b; }); });
    // +N / NEW until looked at
    Object.keys(news).forEach(function (cid) { var o = Object.assign({ n: 0, since: Date.now() }, KN().get('wn:' + cid) || {}); o.n += news[cid].n || 0; if (news[cid].isNew) o.isNew = true; side['wn:' + cid] = o; });
    side['wl:' + log.id] = slim(log);
    KN().setMany(side); prune();
    return written(before).then(function () { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: wbid } })); } catch (e) {} return log; });
  }
  function descOf(it) { var d = it.text && it.text !== it.title ? it.text : ''; if (it.link && d.indexOf(it.link) < 0) d = (d ? d + '\n' : '') + it.link; return d; }
  function slim(log) { return { id: log.id, at: log.at, src: log.src, kind: log.kind, items: log.items.slice(0, 300), lists: log.lists, created: log.created, stacks: log.stacks.slice(0, 900), note: log.note || '' }; }
  function logs() { return (KN() ? KN().keys('wl:') : []).map(function (k) { return KN().get(k); }).filter(Boolean).sort(function (a, b) { return b.at - a.at; }); }
  function prune() { var ls = logs(); if (ls.length > 40) { var m = {}; ls.slice(40).forEach(function (l) { m['wl:' + l.id] = null; }); KN().setMany(m); } }
  function recordOrganized(note, lists, items) { var l = { id: rid(), at: Date.now(), src: 'you', kind: 'organize', items: items || [], lists: lists || {}, created: [], stacks: [], note: note }; KN().set('wl:' + l.id, l, true); prune(); }

  // remove relationships (stacked cards) — never the item itself while another list still holds it
  function unlink(stacks, why) {
    var by = {}; stacks.forEach(function (s) { (by[s.bid] = by[s.bid] || []).push(s); });
    var before = A().boards(), side = {}, keys = {};
    Object.keys(by).forEach(function (bid) {
      var b0 = boardById(bid); if (!b0) return; var b = JSON.parse(JSON.stringify(b0)), ids = {}; by[bid].forEach(function (s) { ids[s.id] = 1; keys[KN().get('pk:' + s.id)] = 1; side['pk:' + s.id] = null; });
      (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c.stack && c.stack.some(function (s) { return ids[s.id]; })) { c.stack = c.stack.filter(function (s) { return !ids[s.id]; }); c.hasStack = c.stack.length > 0; } }); });
      A().updateBoard(bid, function () { return b; });
    });
    // a list that lost an arrival before it was looked at shows one less
    stacks.forEach(function (st) { var w = KN().get('wn:' + st.card); if (w && w.n) side['wn:' + st.card] = w.n > 1 || w.isNew ? Object.assign({}, w, { n: w.n - 1 }) : null; });
    KN().setMany(side);
    // an item no list holds any more is forgotten too (it was only ever in My World through these links)
    var still = {}; KN().keys('pk:').forEach(function (k) { var v = KN().get(k); if (v) still[v] = 1; });
    var m = {}; Object.keys(keys).forEach(function (k) { if (k && k !== 'null' && !still[k] && /^ki:cap:/.test(k)) m[k] = null; }); if (Object.keys(m).length) KN().setMany(m);
    return written(before);
  }
  function undoLog(id) {
    var l = KN().get('wl:' + id); if (!l || l.undone) return Promise.resolve(false);
    var stacks = (l.stacks || []).filter(function (s) { return KN().get('pk:' + s.id); });
    return unlink(stacks).then(function () {
      // lists made by this add go too, but only while still empty
      var by = {}; (l.created || []).forEach(function (c) { (by[c.bid] = by[c.bid] || []).push(c.id); });
      var before = A().boards(), any = false;
      Object.keys(by).forEach(function (bid) {
        var b0 = boardById(bid); if (!b0) return; var b = JSON.parse(JSON.stringify(b0));
        (b.columns || []).forEach(function (col) { col.cards = (col.cards || []).filter(function (c) { var drop = by[bid].indexOf(c.id) >= 0 && !(c.stack || []).length; if (drop) any = true; return !drop; }); });
        b.columns = (b.columns || []).filter(function (col) { return !(/-d-mine$/.test(col.id) && !(col.cards || []).length); });
        A().updateBoard(bid, function () { return b; });
      });
      var m = {};   // (unlink already took the +N back)
      (l.created || []).forEach(function (c) { m['wn:' + c.id] = null; });
      m['wl:' + id] = Object.assign({}, l, { undone: Date.now() });
      KN().setMany(m);
      return any ? written(before).then(function () { return true; }) : true;
    });
  }
  // the graph: items ↔ lists (for a future My World Map / Ring)
  function graph() {
    var nodes = {}, edges = [];
    boards().forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (s) {
      var k = KN().get('pk:' + s.id); if (!k) return;
      if (!nodes[k]) { var r = KN().get(k) || {}; nodes[k] = { id: k, kind: 'item', title: r.title || s.title }; }
      if (!nodes[c.id]) nodes[c.id] = { id: c.id, kind: 'list', title: c.title, area: col.title, board: b.id };
      edges.push({ from: k, to: c.id, via: s.id });
    }); }); }); });
    return { nodes: Object.keys(nodes).map(function (k) { return nodes[k]; }), edges: edges };
  }
  function placesOf(key) { var g = []; boards().forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (s) { if (KN().get('pk:' + s.id) === key) g.push({ bid: b.id, card: c.id, title: c.title, id: s.id }); }); }); }); }); return g; }
  function seen(cardId) { if (KN() && KN().get('wn:' + cardId)) KN().set('wn:' + cardId, null, true); }
  window.addEventListener('minest:card-open', function (e) { var d = e && e.detail; if (d && d.cardId) seen(d.cardId); });

  // ---------------------------------------------------------------- optional AI (only when asked, only if the service answers)
  function askAI(item, cands) {
    var url = 'https://minest-app.vercel.app/api/minest/ai-chat'; try { url = localStorage.getItem('minest_ai_chat_endpoint') || url; } catch (e) {}
    var names = cands.slice(0, 160).map(function (c) { return c.title; });
    var prompt = 'Sort one note into a personal list collection. Reply with JSON only: {"lists":[existing list names, best first, max 4],"newList":"a short new topic name or empty","topics":[up to 4 topics]}.\nExisting lists: ' + JSON.stringify(names) + '\nNote: ' + JSON.stringify((item.text || item.title).slice(0, 1500));
    var headers = typeof minestAIHeaders === 'function' ? minestAIHeaders() : { 'Content-Type': 'application/json' };
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify({ prompt: prompt, model: 'chatgpt', attachments: [], history: [], mode: 'conversation' }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (p) { if (!r.ok || p.error) throw new Error(p.error || 'AI is not available (' + r.status + ')'); return p.reply || p.message || p.text || ''; }); })
      .then(function (txt) { var m = String(txt).match(/\{[\s\S]*\}/); if (!m) throw new Error('The AI answer could not be read.'); var j = JSON.parse(m[0]); return { lists: (j.lists || []).map(function (n) { return cands.filter(function (c) { return norm(c.title) === norm(n); })[0]; }).filter(Boolean), newList: String(j.newList || '').replace(/^my\s+/i, '').trim(), topics: j.topics || [] }; });
  }

  // ================================================================== UI
  var I = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), photo: I('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-8 8"/>'),
    import: I('<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>'), plus: I('<path d="M12 5v14M5 12h14"/>'), undo: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), spark: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    link: I('<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>'), text: I('<path d="M5 6h14M5 12h14M5 18h9"/>'), chev: I('<path d="m9 6 6 6-6 6"/>') };
  var CSS = [
    '.wc{position:fixed;inset:0;z-index:2147482005;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(20,24,36,.93),rgba(8,10,18,.97));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.wc-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 6px}',
    '.wc-head h2{flex:1;min-width:0;margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wc-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.25)}',
    '.wc-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.wc-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(8,10,18,0),rgba(8,10,18,.97) 22px);display:flex;gap:10px}',
    '.wc-go{flex:1;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(10,122,255,.35)}',
    '.wc-go:disabled{opacity:.4;box-shadow:none}.wc-go.sec{flex:0 0 auto;padding:0 18px;background:rgba(255,255,255,.1);box-shadow:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}',
    '.wc-h{margin:18px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55;display:flex;align-items:center;gap:8px}.wc-h button{margin-left:auto;text-transform:none;letter-spacing:0}',
    '.wc-sub{margin:0 2px 12px;font-size:13.5px;opacity:.62}',
    '.wc-cap{border-radius:22px;padding:12px;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}',
    '.wc-cap textarea{width:100%;min-height:84px;max-height:40vh;box-sizing:border-box;resize:none;border:0;outline:none;background:none;color:inherit;font:16px/1.4 inherit}',
    '.wc-cap textarea::placeholder{color:rgba(255,255,255,.45)}',
    '.wc-tools{display:flex;align-items:center;gap:6px;margin-top:6px}',
    '.wc-tool{height:34px;padding:0 11px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:5px}',
    '.wc-tool svg{width:16px;height:16px}.wc-tool.pri{margin-left:auto;background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.3);color:#fff}.wc-tool:disabled{opacity:.4}',
    '.wc-thumb{display:flex;align-items:center;gap:8px;margin-top:8px}.wc-thumb img{width:56px;height:56px;object-fit:cover;border-radius:10px}',
    '.wc-where{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:2px 0 10px}.wc-where::-webkit-scrollbar{display:none}',
    '.wc-chip{flex:none;min-height:34px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:600 13.5px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-align:left}',
    '.wc-chip.on{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.4);color:#fff}',
    '.wc-chip.new{border-style:dashed}.wc-chip.new.on{background:linear-gradient(180deg,#34c759,#1f9d43);border-style:solid}',
    '.wc-chip small{opacity:.65;font-weight:500}',
    '.wc-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.wc-item{padding:12px 14px;border-radius:18px;margin-bottom:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}',
    '.wc-item b{display:block;font-size:15px;line-height:1.3}.wc-item .tx{font-size:13px;opacity:.6;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line}',
    '.wc-item .wc-chips{margin-top:9px;gap:6px}.wc-item .wc-chip{min-height:30px;padding:4px 10px;font-size:12.5px}',
    '.wc-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 12px;margin-bottom:6px;border-radius:16px;cursor:pointer;color:inherit;font:inherit;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}',
    '.wc-row div{flex:1;min-width:0}.wc-row b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wc-row small{display:block;font-size:12px;opacity:.58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wc-row .cv{opacity:.4;flex:none}',
    '.wc-n{flex:none;min-width:22px;height:22px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;font:700 12px -apple-system,system-ui,sans-serif;background:#0a84ff;color:#fff}.wc-n.new{background:#30d158}',
    '.wc-dot{width:8px;height:8px;border-radius:50%;background:var(--c,#5e5ce6);flex:none}',
    '.wc-big{text-align:center;padding:18px 0 8px}.wc-big b{display:block;font-size:44px;font-weight:800;letter-spacing:-1px}.wc-big span{opacity:.65}',
    '.wc-theme{padding:12px 14px;border-radius:18px;margin-bottom:8px;background:linear-gradient(180deg,rgba(48,209,88,.16),rgba(48,209,88,.06));border:1px solid rgba(48,209,88,.35);display:flex;align-items:center;gap:10px}',
    '.wc-theme div{flex:1;min-width:0;font-size:14px}.wc-theme b{font-weight:700}',
    '.wc-sw{flex:none;width:46px;height:28px;border-radius:999px;border:0;padding:0;cursor:pointer;background:rgba(255,255,255,.2);position:relative;transition:background .2s}.wc-sw:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 6px rgba(0,0,0,.3)}.wc-sw.on{background:#30d158}.wc-sw.on:after{transform:translateX(18px)}',
    '.wc-empty{padding:16px;text-align:center;opacity:.55;font-size:14px}',
    '.wc-ai{margin-top:12px}',
    'html.kn-light .wc{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.93),rgba(232,236,243,.97))}',
    'html.kn-light .wc-b,html.kn-light .wc-cap,html.kn-light .wc-tool,html.kn-light .wc-chip,html.kn-light .wc-item,html.kn-light .wc-row{background:rgba(255,255,255,.82);border-color:rgba(0,0,0,.08);box-shadow:inset 0 1px 0 #fff,0 6px 18px rgba(30,40,60,.06)}',
    'html.kn-light .wc-cap textarea::placeholder{color:rgba(0,0,0,.38)}',
    'html.kn-light .wc-chip.on,html.kn-light .wc-tool.pri{color:#fff;background:linear-gradient(180deg,#3d9bff,#0a7aff)}html.kn-light .wc-chip.new.on{background:linear-gradient(180deg,#34c759,#1f9d43)}',
    'html.kn-light .wc-foot{background:linear-gradient(180deg,rgba(236,239,245,0),rgba(236,239,245,.97) 22px)}html.kn-light .wc-go.sec{background:rgba(0,0,0,.06);color:#1d1f23}'
  ].join('\n');
  function css() { if (document.getElementById('wc-css')) return; var s = document.createElement('style'); s.id = 'wc-css'; s.textContent = CSS; document.head.appendChild(s); }

  var ui = { open: false };
  function shell() {
    if (ui.open) return;
    css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'wc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'My World');
    el.innerHTML = '<div class="wc-head"></div><div class="wc-body"></div><div class="wc-foot" hidden></div><input type="file" accept="image/*" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.wc-head'); ui.body = el.querySelector('.wc-body'); ui.foot = el.querySelector('.wc-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate) el.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('input', function (e) { if (e.target.matches('[data-cap]')) { ui.draft = e.target.value; syncCap(); } if (e.target.matches('[data-batch]')) { ui.batchText = e.target.value; var n = splitBatch(ui.batchText).length; var g = ui.foot.querySelector('[data-review]'); if (g) { g.disabled = !n; g.textContent = n ? 'Review ' + n + ' item' + (n === 1 ? '' : 's') : 'Review'; } } if (e.target.matches('[data-find]')) { ui.q = e.target.value; drawPick(); } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target.matches('[data-cap]')) { e.preventDefault(); goOrganize(); } });
    ui.file.addEventListener('change', function () { var f = ui.file.files && ui.file.files[0]; ui.file.value = ''; if (!f) return; shrink(f, 720, function (d) { if (!d) return toast('This picture could not be read.'); ui.img = d; home(true); }); });
  }
  function close() {
    if (!ui.open) return;
    var el = ui.el; ui.open = false; ui.el = null;
    if (!document.querySelector('.lw,.sk,.wk,.pk')) document.documentElement.classList.remove('kn-open');
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0, translate: '0 18px' }], { duration: 200, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function head(title, back) { ui.head.innerHTML = (back ? '<button type="button" class="wc-b" data-back="' + esc(back) + '" aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="wc-b" data-x aria-label="Close">' + ICON.x + '</button>'; ui.foot.hidden = true; ui.foot.innerHTML = ''; }
  function shrink(f, max, cb) {
    var rd = new FileReader();
    rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k)); try { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); cb(c.toDataURL('image/jpeg', .78)); } catch (e) { cb(null); } }; im.onerror = function () { cb(null); }; im.src = rd.result; };
    rd.onerror = function () { cb(null); }; rd.readAsDataURL(f);
  }
  function wbidNow() { var ws = worldIds(); if (ui.wbid && ws.indexOf(ui.wbid) >= 0) return ui.wbid; var a = A().board && A().board(); ui.wbid = a && ws.indexOf(a.id) >= 0 ? a.id : ws[0] || null; return ui.wbid; }
  function listTitle(cid) { var hit = null; boards().forEach(function (b) { var L = locate(b, cid); if (L) hit = { title: L.card.title, bid: b.id, board: b.title, color: L.col.color, area: L.col.title }; }); return hit; }

  // ---------------------------------------------------------------- My World (home): capture + what's new + recent
  function home(keep) {
    shell(); ui.view = 'home'; head('My World', null);
    var ws = worldIds();
    if (!ws.length || !wbidNow()) {
      ui.body.innerHTML = '<p class="wc-sub" style="margin-top:20px">My World needs a world to grow in. Pick a template to start — you can change everything later.</p><button type="button" class="wc-go" style="width:100%" data-choose>Choose Your World</button>';
      return;
    }
    var wbid = wbidNow();
    var newsHtml = whatsNew(), rec = logs().filter(function (l) { return !l.undone; });
    ui.body.innerHTML = (ws.length > 1 ? '<div class="wc-where">' + ws.map(function (id) { var b = boardById(id); return '<button type="button" class="wc-chip' + (id === wbid ? ' on' : '') + '" data-world="' + esc(id) + '">' + esc(b.title) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="wc-cap"><textarea data-cap placeholder="Add to My World — a thought, a book, a link, an idea…">' + esc(keep ? ui.draft || '' : '') + '</textarea>' +
      (ui.img && keep ? '<div class="wc-thumb"><img alt="" src="' + esc(ui.img) + '"><button type="button" class="wc-tool" data-noimg>Remove photo</button></div>' : '') +
      '<div class="wc-tools"><button type="button" class="wc-tool" data-photo>' + ICON.photo + 'Photo</button><button type="button" class="wc-tool" data-import>' + ICON.import + 'Import</button><button type="button" class="wc-tool pri" data-next disabled>Organize ' + ICON.chev + '</button></div></div>' +
      (newsHtml ? '<div class="wc-h">New in My World<button type="button" class="wc-tool" data-clearnew>Mark all seen</button></div>' + newsHtml : '') +
      '<div class="wc-h">Recently Added</div>' + recentHtml(rec.filter(function (l) { return l.kind !== 'organize'; }).slice(0, 8)) +
      (rec.some(function (l) { return l.kind === 'organize'; }) ? '<div class="wc-h">Recently Organized</div>' + recentHtml(rec.filter(function (l) { return l.kind === 'organize'; }).slice(0, 6)) : '');
    if (!keep) { ui.draft = ''; ui.img = null; }
    syncCap();
  }
  function syncCap() { var b = ui.body.querySelector('[data-next]'); if (b) b.disabled = !((ui.draft || '').trim() || ui.img); }
  function whatsNew() {
    var rows = (KN() ? KN().keys('wn:') : []).map(function (k) { var w = KN().get(k), L = w && listTitle(k.slice(3)); return L ? { id: k.slice(3), w: w, L: L } : null; }).filter(Boolean)
      .sort(function (a, b) { return (b.w.since || 0) - (a.w.since || 0); });
    return rows.map(function (r) { return '<button type="button" class="wc-row" data-list="' + esc(r.id) + '" style="--c:' + esc(r.L.color || '#5e5ce6') + '"><span class="wc-dot"></span><div><b>' + esc(r.L.title) + '</b><small>' + esc(r.L.area + ' · ' + r.L.board) + '</small></div>' + (r.w.isNew ? '<span class="wc-n new">NEW</span>' : '') + (r.w.n ? '<span class="wc-n">+' + r.w.n + '</span>' : '') + '</button>'; }).join('');
  }
  var SRC_T = { typed: 'Typed', paste: 'Pasted', import: 'Imported', photo: 'Photo', you: 'You', ai: 'AI suggestion', discover: 'Discover' };
  function recentHtml(ls) {
    if (!ls.length) return '<div class="wc-empty">Nothing yet — add anything above.</div>';
    return ls.map(function (l) {
      var n = (l.items || []).length, lists = Object.keys(l.lists || {}).map(function (c) { var t = listTitle(c); return t ? t.title : null; }).filter(Boolean);
      var title = l.kind === 'organize' ? l.note : n === 1 ? l.items[0].title : n + ' items';
      return '<button type="button" class="wc-row" data-log="' + esc(l.id) + '"><div><b>' + esc(title) + '</b><small>' + esc(ago(l.at) + ' · ' + (SRC_T[l.src] || l.src) + (lists.length ? ' → ' + lists.slice(0, 3).join(', ') + (lists.length > 3 ? ' +' + (lists.length - 3) : '') : '')) + '</small></div><span class="cv">' + ICON.chev + '</span></button>';
    }).join('');
  }

  // ---------------------------------------------------------------- Where should this go? (one item)
  function goOrganize() {
    var it = makeItem(ui.draft || '', ui.img ? 'photo' : 'typed');
    if (!it && ui.img) it = { id: rid(), title: 'Photo · ' + new Date().toLocaleDateString(), text: '', src: 'photo', at: Date.now(), type: 'image' };
    if (!it) return;
    if (ui.img) { it.img = ui.img; if (it.type === 'text') it.type = 'image'; }
    var cands = candidates(), sg = suggest(it, cands);
    ui.one = { item: it, cands: cands, sg: sg, on: {}, fresh: {}, extra: [] };
    sg.top.forEach(function (c) { ui.one.on[c.id] = 1; });
    drawOne();
  }
  function drawOne() {
    var o = ui.one, it = o.item; ui.view = 'one'; head('Where should this go?', 'home');
    var chip = function (c, cls) { return '<button type="button" class="wc-chip' + (o.on[c.id] ? ' on' : '') + '" data-on="' + esc(c.id) + '">' + (o.on[c.id] ? '✓ ' : '') + esc(c.title) + (cls ? '' : '') + '</button>'; };
    var extra = o.extra.filter(function (c) { return o.sg.top.indexOf(c) < 0 && o.sg.rel.indexOf(c) < 0; });
    ui.body.innerHTML = '<div class="wc-item">' + (it.img ? '<img alt="" src="' + esc(it.img) + '" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:8px">' : '') + '<b>' + esc(it.title) + '</b>' + (it.text && it.text !== it.title ? '<div class="tx">' + esc(it.text) + '</div>' : '') + '</div>' +
      '<div class="wc-h">Suggested</div>' + (o.sg.top.length ? '<div class="wc-chips">' + o.sg.top.map(function (c) { return chip(c); }).join('') + '</div>' : '<div class="wc-sub">No clear match yet' + (o.sg.fresh.length ? ' — maybe a new list?' : ' — it can wait in My Inbox, or pick a list below.') + '</div>') +
      (o.sg.rel.length || extra.length ? '<div class="wc-h">Also related</div><div class="wc-chips">' + o.sg.rel.concat(extra).map(function (c) { return chip(c); }).join('') + '</div>' : '') +
      (o.sg.fresh.length || o.ownNew ? '<div class="wc-h">New list</div><div class="wc-chips">' + o.sg.fresh.concat(o.ownNew ? [o.ownNew] : []).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (n) { return '<button type="button" class="wc-chip new' + (o.fresh[n] ? ' on' : '') + '" data-fresh="' + esc(n) + '">' + (o.fresh[n] ? '✓ ' : '＋ ') + 'Create My ' + esc(n) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="wc-h">More</div><div class="wc-chips"><button type="button" class="wc-chip" data-pick>' + ICON.plus + 'Another list…</button><button type="button" class="wc-chip" data-ownnew>' + ICON.plus + 'New list…</button>' +
      (canAI() ? '<button type="button" class="wc-chip" data-ai>' + ICON.spark + 'Ask AI</button>' : '') + '</div><div class="wc-ai"></div>';
    var n = Object.keys(o.on).length + Object.keys(o.fresh).filter(function (k) { return o.fresh[k]; }).length;
    ui.foot.hidden = false;
    ui.foot.innerHTML = '<button type="button" class="wc-go" data-save>' + (n ? 'Add to ' + n + ' list' + (n === 1 ? '' : 's') : 'Keep in My Inbox') + '</button>';
  }
  function canAI() { return typeof fetch === 'function'; }
  function saveOne() {
    var o = ui.one, to = Object.keys(o.on), fresh = Object.keys(o.fresh).filter(function (k) { return o.fresh[k]; });
    // learn from what the user changed: a dropped suggestion counts against it, a list they added counts for it
    o.sg.top.forEach(function (c) { if (!o.on[c.id]) learn(o.sg.st, c.id, -1); });
    to.forEach(function (id) { if (!o.sg.top.some(function (c) { return c.id === id; })) learn(o.sg.st, id, 1); });
    var btn = ui.foot.querySelector('[data-save]'); if (btn) btn.disabled = true;
    organize([{ item: o.item, to: to, newLists: fresh }], wbidNow(), o.item.src).then(function (log) { ui.draft = ''; ui.img = null; result(log, 'home'); }).catch(function (e) { toast('✗ ' + e.message); if (btn) btn.disabled = false; });
  }
  // another list: search every list of the user's worlds
  function pickList(back, onPick) {
    ui.view = 'pick'; ui.q = ''; ui.pickBack = back; ui.onPick = onPick; head('Choose a list', back);
    ui.body.innerHTML = '<label class="wc-cap" style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:10px"><input data-find placeholder="Search your lists" autocomplete="off" style="flex:1;border:0;background:none;color:inherit;font:inherit;outline:none"></label><div data-plist></div>';
    drawPick(); setTimeout(function () { var f = ui.body.querySelector('[data-find]'); if (f) f.focus(); }, 80);
  }
  function drawPick() {
    var box = ui.body.querySelector('[data-plist]'); if (!box) return; var q = norm(ui.q || '');
    var cs = candidates().filter(function (c) { return !q || norm(c.title + c.area).indexOf(q) >= 0; }).slice(0, 120);
    box.innerHTML = cs.map(function (c) { return '<button type="button" class="wc-row" data-pickc="' + esc(c.id) + '" style="--c:' + esc(c.color || '#5e5ce6') + '"><span class="wc-dot"></span><div><b>' + esc(c.title) + '</b><small>' + esc(c.area + ' · ' + c.board) + '</small></div></button>'; }).join('') || '<div class="wc-empty">No list matches.</div>';
  }

  // ---------------------------------------------------------------- Import (text) → review → result
  function importView() {
    ui.view = 'import'; head('Import', 'home');
    ui.body.innerHTML = '<p class="wc-sub">Paste notes, saved posts, a reading list or links — one per line (or separated by blank lines). Nothing is sent anywhere.</p><div class="wc-cap"><textarea data-batch style="min-height:46vh" placeholder="Paste here…">' + esc(ui.batchText || '') + '</textarea></div>' +
      '<div class="wc-tools" style="margin-top:10px"><button type="button" class="wc-tool" data-txtfile>' + ICON.text + 'Open a .txt / .md file</button></div><input type="file" accept=".txt,.md,.csv,text/plain,text/markdown" hidden data-tf>';
    var n = splitBatch(ui.batchText).length;
    ui.foot.hidden = false; ui.foot.innerHTML = '<button type="button" class="wc-go" data-review' + (n ? '' : ' disabled') + '>' + (n ? 'Review ' + n + ' item' + (n === 1 ? '' : 's') : 'Review') + '</button>';
    var tf = ui.body.querySelector('[data-tf]');
    tf.addEventListener('change', function () { var f = tf.files && tf.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { ui.batchText = String(rd.result || ''); importView(); }; rd.readAsText(f); });
  }
  function review() {
    var parts = splitBatch(ui.batchText); if (!parts.length) return;
    var cands = candidates(), rows = parts.map(function (p) { var it = makeItem(p, 'import'); var sg = suggest(it, cands); var on = {}; sg.top.slice(0, 3).forEach(function (c) { on[c.id] = 1; }); return { item: it, sg: sg, on: on }; });
    // recurring themes in the batch: topics many items share
    var count = {}; rows.forEach(function (r) { Object.keys(r.sg.topics).forEach(function (t) { count[t] = (count[t] || 0) + 1; }); });
    var themes = Object.keys(count).filter(function (t) { return count[t] >= 3 && GENERAL.indexOf(t) < 0; }).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 5);
    var have = {}; cands.forEach(function (c) { have[stem(c.title.replace(/^my\s+/i, ''))] = c; });
    ui.batch = { rows: rows, cands: cands, themes: themes.map(function (t) { return { name: t, n: count[t], list: have[stem(t)] || null, make: false }; }) };
    drawReview();
  }
  function drawReview() {
    var B = ui.batch; ui.view = 'review'; head('Review ' + B.rows.length + ' items', 'import');
    var th = B.themes.filter(function (t) { return !t.list; });
    ui.body.innerHTML = (th.length ? '<div class="wc-h">Recurring themes</div>' + th.map(function (t) { return '<div class="wc-theme"><div>You have <b>' + t.n + ' items</b> related to <b>' + esc(t.name) + '</b>. Create <b>My ' + esc(t.name) + '</b>?</div><button type="button" class="wc-sw' + (t.make ? ' on' : '') + '" data-theme="' + esc(t.name) + '" aria-label="Create My ' + esc(t.name) + '"></button></div>'; }).join('') : '') +
      '<div class="wc-h">Items</div>' + B.rows.map(function (r, i) {
        var opts = r.sg.top.concat(r.sg.rel).slice(0, 5), mk = th.filter(function (t) { return t.make && r.sg.topics[t.name]; });
        return '<div class="wc-item"><b>' + esc(r.item.title) + '</b><div class="wc-chips">' + opts.map(function (c) { return '<button type="button" class="wc-chip' + (r.on[c.id] ? ' on' : '') + '" data-ron="' + i + ':' + esc(c.id) + '">' + (r.on[c.id] ? '✓ ' : '') + esc(c.title) + '</button>'; }).join('') +
          mk.map(function (t) { return '<span class="wc-chip new on">✓ My ' + esc(t.name) + '</span>'; }).join('') +
          (!opts.length && !mk.length ? '<span class="wc-chip" style="opacity:.6;cursor:default">→ My Inbox</span>' : '') + '<button type="button" class="wc-chip" data-rpick="' + i + '">' + ICON.plus + '</button></div></div>';
      }).join('');
    ui.foot.hidden = false; ui.foot.innerHTML = '<button type="button" class="wc-go" data-doimport>Import ' + B.rows.length + ' item' + (B.rows.length === 1 ? '' : 's') + '</button>';
  }
  function doImport() {
    var B = ui.batch, mk = B.themes.filter(function (t) { return t.make && !t.list; });
    var plan = B.rows.map(function (r) { return { item: r.item, to: Object.keys(r.on), newLists: mk.filter(function (t) { return r.sg.topics[t.name]; }).map(function (t) { return t.name; }) }; });
    B.rows.forEach(function (r) { r.sg.top.slice(0, 3).forEach(function (c) { if (!r.on[c.id]) learn(r.sg.st, c.id, -.5); }); });
    var btn = ui.foot.querySelector('[data-doimport]'); if (btn) btn.disabled = true;
    organize(plan, wbidNow(), 'import').then(function (log) { ui.batchText = ''; result(log, 'home'); }).catch(function (e) { toast('✗ ' + e.message); if (btn) btn.disabled = false; });
  }
  // Added to My World — where everything went
  function result(log, back) {
    ui.view = 'result'; ui.log = log; head('Added to My World', back);
    var lists = Object.keys(log.lists || {}).map(function (c) { return { id: c, n: log.lists[c], L: listTitle(c) }; }).filter(function (x) { return x.L; }).sort(function (a, b) { return b.n - a.n; });
    var created = {}; (log.created || []).forEach(function (c) { created[c.id] = 1; });
    var n = (log.items || []).length;
    ui.body.innerHTML = '<div class="wc-big"><b>' + n + '</b><span>item' + (n === 1 ? '' : 's') + ' ' + (log.src === 'import' ? 'imported' : 'added') + (log.undone ? ' · undone' : '') + '</span></div>' +
      '<div class="wc-h">Added to</div>' + (lists.map(function (x) { return '<button type="button" class="wc-row" data-list="' + esc(x.id) + '" data-fromlog="' + esc(log.id) + '" style="--c:' + esc(x.L.color || '#5e5ce6') + '"><span class="wc-dot"></span><div><b>' + esc(x.L.title) + '</b><small>' + esc(x.L.area + ' · ' + x.L.board) + '</small></div>' + (created[x.id] ? '<span class="wc-n new">NEW</span>' : '') + '<span class="wc-n">' + x.n + '</span></button>'; }).join('') || '<div class="wc-empty">Nothing new — everything was already there.</div>') +
      '<div class="wc-h">Items</div>' + (log.items || []).slice(0, 60).map(function (it) { return '<button type="button" class="wc-row" data-item="' + esc(it.key) + '"><div><b>' + esc(it.title) + '</b><small>→ ' + esc((it.to || []).map(function (c) { var t = listTitle(c); return t ? t.title : '—'; }).join(', ') || 'already there') + '</small></div><span class="cv">' + ICON.chev + '</span></button>'; }).join('');
    ui.foot.hidden = false; ui.foot.innerHTML = (log.undone ? '' : '<button type="button" class="wc-go sec" data-undo="' + esc(log.id) + '">' + ICON.undo + ' Undo</button>') + '<button type="button" class="wc-go" data-done>Done</button>';
  }
  // a list's recent arrivals (+N): what came in, from which add
  function listView(cid, fromLog) {
    var L = listTitle(cid); if (!L) return home();
    ui.view = 'list'; head(L.title, fromLog ? 'log:' + fromLog : 'home');
    var b = boardById(L.bid), C = locate(b, cid).card, keys = {};
    if (fromLog) { var l = KN().get('wl:' + fromLog); (l && l.stacks || []).forEach(function (s) { if (s.card === cid) keys[s.id] = 1; }); }
    var w = KN().get('wn:' + cid), since = w && w.since || 0;
    var st = (C.stack || []).filter(function (s) { return fromLog ? keys[s.id] : true; }).slice().reverse();
    ui.body.innerHTML = '<p class="wc-sub">' + esc(L.area + ' · ' + L.board) + ' · ' + (C.stack || []).length + ' in this list</p>' +
      st.slice(0, 80).map(function (s) { var k = KN().get('pk:' + s.id), r = k && KN().get(k), fresh = r && r.at >= since && w; return '<button type="button" class="wc-row" ' + (k ? 'data-item="' + esc(k) + '"' : 'data-open="' + esc(cid) + '"') + '><div><b>' + esc(s.title) + '</b><small>' + esc(r ? ago(r.at) + ' · ' + (SRC_T[r.src] || r.src || '') : (s.desc || '').slice(0, 80)) + '</small></div>' + (fresh ? '<span class="wc-n">new</span>' : '') + '</button>'; }).join('') +
      '';
    ui.foot.hidden = false; ui.foot.innerHTML = (window.MinestDiscover && (C.stack || []).length >= 2 ? '<button type="button" class="wc-go sec" data-discover="' + esc(L.bid + '|' + cid) + '">Discover</button>' : '') + '<button type="button" class="wc-go" data-open="' + esc(cid) + '">Open on the board</button>';
    seen(cid);
  }
  // an item: where it is (its relationships) — remove one, add another, move, mark a suggestion wrong
  function itemView(key, back) {
    var r = KN().get(key); if (!r) { toast('This item is not in My World any more.'); return home(); }
    ui.view = 'item'; ui.itemKey = key; ui.itemBack = back; head('Item', back);
    var pl = placesOf(key);
    ui.body.innerHTML = '<div class="wc-item">' + (r.img ? '<img alt="" src="' + esc(r.img) + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:8px">' : '') + '<b>' + esc(r.title) + '</b>' + (r.text && r.text !== r.title ? '<div class="tx" style="-webkit-line-clamp:8">' + esc(r.text) + '</div>' : '') + (r.link ? '<div class="tx"><a href="' + esc(r.link) + '" target="_blank" rel="noopener" style="color:#64d2ff">' + esc(r.link) + '</a></div>' : '') +
      '<div class="tx">' + esc(ago(r.at) + ' · ' + (SRC_T[r.src] || r.src || '')) + '</div></div>' +
      '<div class="wc-h">In ' + pl.length + ' list' + (pl.length === 1 ? '' : 's') + '</div>' + pl.map(function (p) { var L = listTitle(p.card); return '<div class="wc-row" style="cursor:default;--c:' + esc(L && L.color || '#5e5ce6') + '"><span class="wc-dot"></span><div><b>' + esc(p.title) + '</b><small>' + esc(L ? L.area + ' · ' + L.board : '') + '</small></div><button type="button" class="wc-tool" data-move="' + esc(p.id) + '">Move</button><button type="button" class="wc-tool" data-wrong="' + esc(p.id) + '" title="Remove from this list — and suggest it less">✕</button></div>'; }).join('') +
      '<div class="wc-chips" style="margin-top:10px"><button type="button" class="wc-chip" data-addto>' + ICON.plus + 'Add to another list</button>' + (window.MinestPhilo ? '<button type="button" class="wc-chip" data-cxconnect>' + ICON.link + 'Connect to…</button>' : '') + '</div>' +
      (pl.length === 1 ? '<p class="wc-sub" style="margin-top:12px">Removing it from its last list takes it out of My World.</p>' : '');
  }
  function placeOf(sid) { var hit = null; boards().forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (s) { if (s.id === sid) hit = { bid: b.id, card: c.id, title: c.title, id: s.id }; }); }); }); }); return hit; }
  function addRelation(key, cid, note) {
    var r = KN().get(key); if (!r) return Promise.resolve();
    var it = { id: key.replace(/^ki:cap:/, ''), title: r.title, text: r.text, link: r.link, img: r.img, type: r.type, src: r.src, at: r.at };
    var L = listTitle(cid);
    return organize([{ item: it, key: key, to: [cid] }], (L && L.bid) || wbidNow(), 'you', 'organize').then(function (log) {
      KN().set('wl:' + log.id, Object.assign(slim(log), { note: note || r.title + ' → ' + (L ? L.title : '') }), true);
    });
  }

  // ================================================================== clicks
  function onClick(e) {
    var t = e.target, g;
    if (t.closest('[data-x]')) return close();
    if ((g = t.closest('[data-back]'))) { var bk = g.getAttribute('data-back'); if (bk === 'home') return home(ui.view === 'one' || ui.view === 'import'); if (bk === 'import') return importView(); if (bk === 'one') return drawOne(); if (bk === 'review') return drawReview(); if (/^log:/.test(bk)) { var l0 = KN().get('wl:' + bk.slice(4)); return l0 ? result(l0, 'home') : home(); } if (/^item:/.test(bk)) return itemView(bk.slice(5), ui.itemBack0 || 'home'); return home(); }
    if (t.closest('[data-choose]')) { close(); if (window.MinestWorld) setTimeout(function () { MinestWorld.open(); }, 200); return; }
    if ((g = t.closest('[data-world]'))) { ui.wbid = g.getAttribute('data-world'); return home(true); }
    if (t.closest('[data-photo]')) return ui.file.click();
    if (t.closest('[data-noimg]')) { ui.img = null; return home(true); }
    if (t.closest('[data-import]')) return importView();
    if (t.closest('[data-txtfile]')) { var tf = ui.body.querySelector('[data-tf]'); if (tf) tf.click(); return; }
    if (t.closest('[data-next]')) return goOrganize();
    if (t.closest('[data-clearnew]')) { var m = {}; KN().keys('wn:').forEach(function (k) { m[k] = null; }); KN().setMany(m); return home(true); }
    // one item
    if ((g = t.closest('[data-on]'))) { var id = g.getAttribute('data-on'); if (ui.one.on[id]) delete ui.one.on[id]; else ui.one.on[id] = 1; return keep(drawOne); }
    if ((g = t.closest('[data-fresh]'))) { var n = g.getAttribute('data-fresh'); ui.one.fresh[n] = !ui.one.fresh[n]; return keep(drawOne); }
    if (t.closest('[data-ownnew]')) { if (!window.MinestKEdit) return; MinestKEdit.sheet({ title: 'New list', text: 'A list of your own, in “My Own Lists”.', fields: [{ key: 'name', label: 'My …', placeholder: 'e.g. Gardening' }], ok: 'Create' }).then(function (v) { var nm = v && String(v.name || '').replace(/^my\s+/i, '').trim(); if (!nm) return; nm = nm.replace(/^./, function (c) { return c.toUpperCase(); }); ui.one.ownNew = nm; ui.one.fresh[nm] = true; drawOne(); }); return; }
    if (t.closest('[data-pick]')) return pickList('one', function (cid) { var c = candidates().filter(function (x) { return x.id === cid; })[0]; if (c) { ui.one.on[cid] = 1; if (ui.one.extra.indexOf(c) < 0 && !ui.one.sg.top.concat(ui.one.sg.rel).some(function (x) { return x.id === cid; })) ui.one.extra.push(c); } drawOne(); });
    if ((g = t.closest('[data-pickc]'))) { var cb = ui.onPick; if (cb) cb(g.getAttribute('data-pickc')); return; }
    if (t.closest('[data-ai]')) {
      var box = ui.body.querySelector('.wc-ai'); if (box) box.innerHTML = '<div class="wc-sub">Asking AI…</div>';
      askAI(ui.one.item, ui.one.cands).then(function (r) {
        r.lists.forEach(function (c) { ui.one.on[c.id] = 1; if (!ui.one.sg.top.concat(ui.one.sg.rel, ui.one.extra).some(function (x) { return x.id === c.id; })) ui.one.extra.push(c); });
        if (r.newList && !ui.one.cands.some(function (c) { return norm(c.title) === norm('My ' + r.newList); })) { ui.one.ownNew = r.newList; }
        drawOne(); var b2 = ui.body.querySelector('.wc-ai'); if (b2) b2.innerHTML = '<div class="wc-sub">AI suggested: ' + esc(r.lists.map(function (c) { return c.title; }).concat(r.newList ? ['new: My ' + r.newList] : []).join(', ') || 'nothing new') + '. You decide what stays.</div>';
      }).catch(function (er) { var b3 = ui.body.querySelector('.wc-ai'); if (b3) b3.innerHTML = '<div class="wc-sub">' + esc(/fetch|network|load failed/i.test(er.message) ? 'AI isn’t reachable right now — the suggestions above work without it.' : /token|授权|401|403|sign/i.test(er.message) ? 'AI isn’t set up on this device — the suggestions above work without it.' : er.message) + '</div>'; });
      return;
    }
    if (t.closest('[data-save]')) return saveOne();
    // import
    if (t.closest('[data-review]')) return review();
    if ((g = t.closest('[data-theme]'))) { var th = ui.batch.themes.filter(function (x) { return x.name === g.getAttribute('data-theme'); })[0]; if (th) th.make = !th.make; return keep(drawReview); }
    if ((g = t.closest('[data-ron]'))) { var p = g.getAttribute('data-ron').split(':'), row = ui.batch.rows[+p[0]], cid = p.slice(1).join(':'); if (row.on[cid]) delete row.on[cid]; else row.on[cid] = 1; return keep(drawReview); }
    if ((g = t.closest('[data-rpick]'))) { var ri = +g.getAttribute('data-rpick'), y = ui.body.scrollTop; return pickList('review', function (cid) { var c = ui.batch.cands.filter(function (x) { return x.id === cid; })[0], r = ui.batch.rows[ri]; if (c) { r.on[cid] = 1; if (!r.sg.top.concat(r.sg.rel).some(function (x) { return x.id === cid; })) r.sg.rel.unshift(c); } drawReview(); ui.body.scrollTop = y; }); }
    if (t.closest('[data-doimport]')) return doImport();
    // result / recent / lists / items
    if ((g = t.closest('[data-undo]'))) { var lid = g.getAttribute('data-undo'); g.disabled = true; return undoLog(lid).then(function () { toast('↺ Undone — nothing else changed'); home(); }); }
    if (t.closest('[data-done]')) return home();
    if (t.closest('[data-cxconnect]')) { var ck = ui.itemKey; close(); setTimeout(function () { MinestPhilo.connect({ key: ck }); }, 200); return; }
    if ((g = t.closest('[data-discover]'))) { var dp = g.getAttribute('data-discover').split('|'); close(); setTimeout(function () { MinestDiscover.open({ bid: dp[0], cardId: dp.slice(1).join('|') }); }, 200); return; }
    if ((g = t.closest('[data-log]'))) { var lg = KN().get('wl:' + g.getAttribute('data-log')); if (lg) result(lg, 'home'); return; }
    if ((g = t.closest('[data-list]'))) return listView(g.getAttribute('data-list'), g.getAttribute('data-fromlog'));
    if ((g = t.closest('[data-item]'))) { var back = ui.view === 'list' ? 'home' : ui.view === 'result' ? 'log:' + ui.log.id : 'home'; return itemView(g.getAttribute('data-item'), back); }
    if ((g = t.closest('[data-open]'))) { var oc = g.getAttribute('data-open'), L = listTitle(oc); if (!L) return; close(); setTimeout(function () { try { if (A().selectBoard) A().selectBoard(L.bid); var col = null; boards().forEach(function (b) { var X = b.id === L.bid && locate(b, oc); if (X) col = X.col.id; }); if (window.MinestContents && MinestContents.goTo) MinestContents.goTo({ b: L.bid, l: col, c: oc }, { label: 'My World', open: function () { home(); } }); } catch (x) {} }, 220); return; }
    if ((g = t.closest('[data-wrong]'))) {
      var pl = placeOf(g.getAttribute('data-wrong')); if (!pl) return; var key = ui.itemKey, r = KN().get(key);
      learn(stems((r && r.title) + ' ' + (r && r.text || '')), pl.card, -1.5);
      return unlink([pl]).then(function () { var ll = {}; ll[pl.card] = 0; recordOrganized((r ? r.title : 'Item') + ' ✕ ' + pl.title, ll, [{ key: key, title: r ? r.title : '', to: [] }]); toast('Removed from ' + pl.title); if (KN().get(key)) itemView(key, ui.itemBack); else home(); });
    }
    if ((g = t.closest('[data-move]'))) {
      var from = placeOf(g.getAttribute('data-move')), k2 = ui.itemKey, b0 = ui.itemBack; if (!from) return; ui.itemBack0 = b0;
      return pickList('item:' + k2, function (cid) { if (cid === from.card) return itemView(k2, b0); var r2 = KN().get(k2), L2 = listTitle(cid); addRelation(k2, cid, (r2 ? r2.title : '') + ': ' + from.title + ' → ' + (L2 ? L2.title : '')).then(function () { return unlink([from]); }).then(function () { toast('Moved'); itemView(k2, b0); }); });
    }
    if (t.closest('[data-addto]')) { var k3 = ui.itemKey, b1 = ui.itemBack; ui.itemBack0 = b1; return pickList('item:' + k3, function (cid) { learn(stems((KN().get(k3) || {}).title || ''), cid, 1); addRelation(k3, cid).then(function () { toast('Added'); itemView(k3, b1); }); }); }
  }
  function keep(fn) { var y = ui.body.scrollTop; fn(); ui.body.scrollTop = y; }

  function open(o) { o = o || {}; shell(); if (o.wbid) ui.wbid = o.wbid; if (o.text) { ui.draft = o.text; home(true); return; } if (o.import) { home(); return importView(); } home(); }
  window.MinestCapture = { open: open, close: close, isOpen: function () { return ui.open; },
    suggest: function (text) { return suggest(makeItem(text, 'typed'), candidates()); }, organize: organize, undo: undoLog, graph: graph, logs: logs, splitBatch: splitBatch, makeItem: makeItem, newCount: function (bid) { var n = 0; (KN() ? KN().keys('wn:') : []).forEach(function (k) { var L = listTitle(k.slice(3)); if (L && (!bid || L.bid === bid)) { var w = KN().get(k); n += (w.n || 0) + (w.isNew && !w.n ? 1 : 0); } }); return n; } };
})();
