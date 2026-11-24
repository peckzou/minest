/* Minest Living Knowledge · Semantic Linking (window.MinestLKLink; also a Node module for the tests).
   Finds links between pages that are not linked yet, and keeps what the user decided about each one.
     1 candidates()  on the device, nothing is sent: pairs of pages that mention each other by name, share rare words,
                     sources or link targets. Ranked; at most PER_NODE open suggestions per page.
     2 suggest()     the candidates are judged — by Minest AI (/api/minest/lk-link, within the user's budget, only when
                     AI is allowed) or by the device (opts.local: only what can be shown word for word). Each link that
                     comes back is saved as a relation with status "suggested", its reason and its evidence.
     3 decide()      the user confirms or rejects. Both are kept: a rejected link is never written over by AI
                     (lk-model.js refuses), and its pair is not judged again while the two pages stay as they were.
   A pair judged "no link" is remembered too (lk_meta/link-memo), so it is not sent again until one of its pages changes. */
(function (root, factory) {
  var node = typeof module === 'object' && module.exports;
  var M = node ? require('./lk-model.js') : root.MinestLKModel;
  var A = node ? require('./lk-agent.js') : root.MinestLKAgent;
  var K = factory(M, A);
  if (node) module.exports = K; else root.MinestLKLink = K;
})(typeof window !== 'undefined' ? window : this, function (M, A) {
  'use strict';

  var PER_NODE = 5, BATCH = 12, MAX_PAIRS = 60, MIN_SCORE = 1, MEMO_ID = 'link-memo', MEMO_MAX = 3000;
  var SYMMETRIC = { related: 1, contradicts: 1 };

  function norm(s) { s = String(s || ''); return (s.normalize ? s.normalize('NFKC') : s).toLowerCase(); }
  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function flat(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function isWordy(name) { return /^[\x00-\x7f]+$/.test(name); }

  // where a name appears in a text: whole words for Latin names, anywhere for Chinese / Japanese / Korean ones
  function findName(text, name) {
    if (!isWordy(name)) return text.indexOf(name);
    var m = new RegExp('(^|[^a-z0-9])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').exec(text);
    return m ? m.index + m[1].length : -1;
  }
  function names(p) {
    return [p.title].concat(p.aliases || []).map(norm).map(function (n) { return n.trim(); })
      .filter(function (n) { return n.length >= (isWordy(n) ? 3 : 2); });
  }
  // the first place page `from` names page `to`: in a claim (the whole claim is the quote) or in the text (the sentence)
  function mention(from, to) {
    var ns = names(to), cs = from.claims || [];
    for (var i = 0; i < cs.length; i++) {
      for (var j = 0; j < ns.length; j++) if (findName(norm(cs[i].text), ns[j]) >= 0) return { name: ns[j], claimId: cs[i].id, quote: short(flat(cs[i].text), 300) };
    }
    var raw = flat(from.markdown), text = norm(raw);
    if (text.length !== raw.length) return null;                               // normalising changed the length: positions would be wrong
    for (var k = 0; k < ns.length; k++) {
      var at = findName(text, ns[k]);
      if (at < 0) continue;
      // the sentence around it; a very long sentence is cut at a word, and the cut is shown
      var s0 = Math.max(text.lastIndexOf('。', at), text.lastIndexOf('. ', at), text.lastIndexOf('！', at), text.lastIndexOf('？', at)) + 1;
      var ends = ['。', '. ', '！', '？'].map(function (e) { return text.indexOf(e, at); }).filter(function (x) { return x >= 0; });
      var e0 = ends.length ? Math.min.apply(null, ends) + 1 : text.length, pre = '', post = '';
      if (at - s0 > 140) { var sp = text.indexOf(' ', at - 140); s0 = sp >= 0 && sp < at ? sp + 1 : at - 140; pre = '…'; }
      if (e0 - at > 160) { var ep = text.lastIndexOf(' ', at + 160); e0 = ep > at + ns[k].length ? ep : at + 160; post = '…'; }
      return { name: ns[k], claimId: '', quote: pre + raw.slice(s0, e0).trim() + post };
    }
    return null;
  }

  /* pages, relations, opts: { perNode, max, minScore, memo: { pairKey: [revA, revB] } }
     → [{ key, a, b, score, reasons: [{ kind: 'mention', from, to, name, claimId, quote } | { kind: 'terms', terms } |
                                      { kind: 'sources', n } | { kind: 'links', n }] }], best first */
  function candidates(pages, relations, opts) {
    opts = opts || {};
    var perNode = opts.perNode || PER_NODE, max = opts.max || MAX_PAIRS, minScore = opts.minScore == null ? MIN_SCORE : opts.minScore;
    pages = (pages || []).filter(function (p) { return p && p.id; });
    var byId = {}, N = pages.length;
    pages.forEach(function (p) { byId[p.id] = p; });
    if (N < 2) return [];

    // pairs that are settled: linked or suggested already, rejected (until both pages have changed), judged "no link" (until one has)
    var blocked = {}, open = {};
    (relations || []).forEach(function (r) {
      var a = byId[r.from], b = byId[r.to];
      if (!a || !b) return;
      var st = M.relationStatus(r), key = pairKey(r.from, r.to);
      if (st === 'suggested') { open[r.from] = (open[r.from] || 0) + 1; open[r.to] = (open[r.to] || 0) + 1; }
      if (st !== 'rejected' || !r.seen || r.seen.from === a.rev || r.seen.to === b.rev) blocked[key] = 1;
    });
    Object.keys(opts.memo || {}).forEach(function (key) {
      var ids = key.split('|'), a = byId[ids[0]], b = byId[ids[1]], revs = opts.memo[key] || [];
      if (a && b && revs[0] === a.rev && revs[1] === b.rev) blocked[key] = 1;
    });
    pages.forEach(function (p) { (p.links || []).forEach(function (id) { if (byId[id]) blocked[pairKey(p.id, id)] = 1; }); });

    // rare words: an inverted index, so only pairs that share something are looked at
    var terms = pages.map(function (p) {
      return A.terms([p.title].concat(p.aliases || [], p.tags || [], (p.claims || []).map(function (c) { return c.text; }), [String(p.markdown || '').slice(0, 4000)]).join(' '));
    });
    var index = {};
    terms.forEach(function (ts, i) { ts.forEach(function (t) { (index[t] = index[t] || []).push(i); }); });
    var rare = Math.max(3, Math.ceil(N * 0.25)), idf = {}, weight = pages.map(function () { return 0; });
    Object.keys(index).forEach(function (t) {
      var df = index[t].length;
      idf[t] = Math.log(1 + N / df);
      if (df <= rare) index[t].forEach(function (i) { weight[i] += idf[t]; });
    });
    var found = {};
    var pair = function (i, j) { var key = pairKey(pages[i].id, pages[j].id); return found[key] || (found[key] = { i: Math.min(i, j), j: Math.max(i, j), key: key, shared: [], w: 0 }); };
    Object.keys(index).forEach(function (t) {
      var list = index[t];
      if (list.length < 2 || list.length > rare) return;
      for (var x = 0; x < list.length; x++) for (var y = x + 1; y < list.length; y++) { var c = pair(list[x], list[y]); c.shared.push(t); c.w += idf[t]; }
    });
    // a name can be a common word here (the page about "学习" in a library all about 学习): look for mentions in every pair
    var nameIdx = {};
    pages.forEach(function (p, i) { names(p).forEach(function (n) { (nameIdx[n] = nameIdx[n] || []).push(i); }); });
    pages.forEach(function (p, i) {
      var text = norm(flat(p.markdown) + ' ' + (p.claims || []).map(function (c) { return c.text; }).join(' '));
      Object.keys(nameIdx).forEach(function (n) { if (findName(text, n) >= 0) nameIdx[n].forEach(function (j) { if (j !== i) pair(i, j); }); });
    });
    var bySource = {};
    pages.forEach(function (p, i) { (p.sourceIds || []).forEach(function (s) { (bySource[s] = bySource[s] || []).push(i); }); });
    Object.keys(bySource).forEach(function (s) { var l = bySource[s]; if (l.length > 12) return; for (var x = 0; x < l.length; x++) for (var y = x + 1; y < l.length; y++) pair(l[x], l[y]); });

    var out = [];
    Object.keys(found).forEach(function (key) {
      if (blocked[key]) return;
      var c = found[key], a = pages[c.i], b = pages[c.j], reasons = [], score = 0;
      var ab = mention(a, b), ba = mention(b, a);
      if (ab) { score += 3; reasons.push({ kind: 'mention', from: a.id, to: b.id, name: ab.name, claimId: ab.claimId, quote: ab.quote }); }
      if (ba) { score += 3; reasons.push({ kind: 'mention', from: b.id, to: a.id, name: ba.name, claimId: ba.claimId, quote: ba.quote }); }
      if (c.shared.length >= 3 && weight[c.i] && weight[c.j]) {
        score += 6 * c.w / Math.sqrt(weight[c.i] * weight[c.j]);
        reasons.push({ kind: 'terms', terms: c.shared.slice().sort(function (x, y) { return idf[y] - idf[x] || y.length - x.length || (x < y ? -1 : 1); }).slice(0, 6) });
      }
      var src = (a.sourceIds || []).filter(function (s) { return (b.sourceIds || []).indexOf(s) >= 0; }).length;
      if (src) { score += 0.75 * Math.min(2, src); reasons.push({ kind: 'sources', n: src }); }
      var both = (a.links || []).filter(function (id) { return id !== b.id && (b.links || []).indexOf(id) >= 0 && byId[id]; }).length;
      if (both) { score += 0.75 * Math.min(2, both); reasons.push({ kind: 'links', n: both }); }
      if (score >= minScore) out.push({ key: key, a: a.id, b: b.id, score: Math.round(score * 100) / 100, reasons: reasons });
    });
    out.sort(function (x, y) { return y.score - x.score || (x.key < y.key ? -1 : 1); });
    // no page gets more than perNode open suggestions, counting the ones still waiting
    var count = {}, kept = [];
    Object.keys(open).forEach(function (id) { count[id] = open[id]; });
    out.forEach(function (c) {
      if (kept.length >= max || (count[c.a] || 0) >= perNode || (count[c.b] || 0) >= perNode) return;
      count[c.a] = (count[c.a] || 0) + 1; count[c.b] = (count[c.b] || 0) + 1; kept.push(c);
    });
    return kept;
  }

  // what is sent about one page of a pair: title, the start of its text, and the claims closest to the other page
  function material(p, other, cand) {
    var ts = A.terms([other.title].concat(other.aliases || []).join(' ') + ' ' + (other.claims || []).map(function (c) { return c.text; }).join(' '));
    var said = cand.reasons.filter(function (r) { return r.kind === 'mention' && r.from === p.id; })[0];
    var claims = (p.claims || []).map(function (c, i) {
      var t = norm(c.text), n = 0; ts.forEach(function (x) { if (t.indexOf(x) >= 0) n++; });
      return { c: c, s: n + (said && said.claimId === c.id ? 1000 : 0), i: i };
    }).sort(function (x, y) { return y.s - x.s || x.i - y.i; }).slice(0, 6).map(function (x) { return { id: x.c.id, text: flat(x.c.text).slice(0, 300) }; });
    var summary = flat(p.markdown).slice(0, 400);
    if (said && !said.claimId && summary.indexOf(said.quote.replace(/^…|…$/g, '')) < 0) summary = (summary + ' … ' + said.quote).slice(0, 700);
    return { id: p.id, title: p.title, type: p.type || 'note', summary: summary, claims: claims };
  }

  /* the device's own judge (no AI, nothing sent): it only suggests what it can show —
     one page naming the other (with the sentence), or a strong overlap of rare words (said as such). Always "related". */
  function localJudge(body) {
    var links = [], none = [];
    (body.pairs || []).forEach(function (p) {
      var hint = p.hint || { reasons: [], score: 0 }, said = hint.reasons.filter(function (r) { return r.kind === 'mention'; });
      var words = hint.reasons.filter(function (r) { return r.kind === 'terms'; })[0];
      if (said.length) {
        var from = said[0].from === p.a.id ? p.a : p.b, to = from === p.a ? p.b : p.a;
        links.push({ key: p.key, from: from.id, to: to.id, type: 'related', grounded: true, downgraded: false, confidence: said.length > 1 ? 0.7 : 0.6,
          explanation: '“' + from.title + '”里提到了“' + to.title + '”' + (said.length > 1 ? '，“' + to.title + '”里也提到了“' + from.title + '”' : '') + '。',
          evidence: said.map(function (r) { return { pageId: r.from, claimId: r.claimId || '', quote: r.quote }; }) });
      } else if (words && hint.score >= 2.5) {
        links.push({ key: p.key, from: p.a.id, to: p.b.id, type: 'related', grounded: false, downgraded: false, confidence: 0.35, evidence: [],
          explanation: '两页都谈到：' + words.terms.join('、') + '。这是按字面比较出来的，没有理解含义。' });
      } else none.push(p.key);
    });
    return { links: links, none: none, model: 'local', usage: null };
  }

  /* opts: { transport(op, body, signal) → Promise, local, signal, onProgress({ done, total }), now, max }
     → { status: 'review' | 'empty' | 'stopped' | 'failed', engine, candidates, judged, calls, suggested: [relation], none, errors, used } */
  function suggest(store, opts) {
    opts = opts || {};
    var now = opts.now || function () { return Date.now(); };
    var rep = { status: 'empty', engine: opts.local ? 'local' : 'cloud', candidates: 0, judged: 0, calls: 0, suggested: [], none: 0, errors: [], used: { input: 0, output: 0 } };
    return store.permissions().then(function (perms) {
      if (!perms.allowAI && !opts.local) throw Object.assign(new Error('还没有允许把知识库内容发给 Minest AI（在“权限”里打开）'), { code: 'ai-not-allowed' });
      return Promise.all([store.list('page'), store.list('relation'), store.get('meta', MEMO_ID)]).then(function (r) {
        var pages = r[0], rels = r[1], memoDoc = r[2], memo = M.clone((memoDoc && memoDoc.pairs) || {}), memoChanged = false;
        var byId = {}, relIds = {};
        pages.forEach(function (p) { byId[p.id] = p; });
        rels.forEach(function (x) { relIds[x.id] = 1; });
        var maxCalls = opts.local ? Infinity : Math.max(1, perms.maxCallsPerRun || 12);
        var cands = candidates(pages, rels, { memo: memo, max: Math.min(opts.max || MAX_PAIRS, maxCalls * BATCH) });
        rep.candidates = cands.length;
        var batches = [];
        for (var i = 0; i < cands.length; i += BATCH) batches.push(cands.slice(i, i + BATCH));
        var send = opts.local ? function (op, body) { return Promise.resolve(localJudge(body)); } : opts.transport;
        var remember = function (c) { memo[c.key] = [byId[c.key.split('|')[0]].rev, byId[c.key.split('|')[1]].rev]; memoChanged = true; };
        var n = 0;
        function next() {
          if (n >= batches.length) return Promise.resolve();
          if (opts.signal && opts.signal.aborted) { rep.stopped = true; return Promise.resolve(); }
          var batch = batches[n++], byKey = {};
          var pairs = batch.map(function (c, k) {
            var key = 'p' + ((n - 1) * BATCH + k + 1); byKey[key] = c;
            return { key: key, a: material(byId[c.a], byId[c.b], c), b: material(byId[c.b], byId[c.a], c), hint: opts.local ? { reasons: c.reasons, score: c.score } : undefined };
          });
          rep.calls++;
          if (opts.onProgress) opts.onProgress({ done: (n - 1) * BATCH, total: cands.length });
          return send('lk-link', { pairs: pairs, maxTokens: perms.maxTokensPerCall || 3000 }, opts.signal).then(function (res) {
            if (res.usage) { rep.used.input += res.usage.input || 0; rep.used.output += res.usage.output || 0; }
            rep.judged += batch.length;
            var linked = {};
            return (res.links || []).reduce(function (q, l) {
              return q.then(function () {
                var c = byKey[l.key];
                if (!c || linked[l.key] || M.RELATION_TYPES.indexOf(l.type) < 0 || !String(l.explanation || '').trim()) return;
                if (!((l.from === c.a && l.to === c.b) || (l.from === c.b && l.to === c.a))) return;      // only about the pair that was sent
                var from = l.from, to = l.to;
                if (SYMMETRIC[l.type] && to < from) { from = l.to; to = l.from; }                          // one id whichever way it was said
                var id = M.relationId(from, l.type, to);
                if (relIds[id] || (SYMMETRIC[l.type] && relIds[M.relationId(to, l.type, from)])) return;   // already known (a rejected one stays rejected)
                var doc = { id: id, from: from, to: to, type: l.type, origin: 'ai_inferred', status: 'suggested', engine: rep.engine,
                  explanation: String(l.explanation).slice(0, 400), confidence: Math.max(0, Math.min(1, Number(l.confidence) || 0)),
                  evidence: (l.evidence || []).filter(function (e) { return e && byId[e.pageId] && e.quote; }).slice(0, 4).map(function (e) { return { pageId: e.pageId, claimId: e.claimId || '', quote: String(e.quote).slice(0, 300) }; }),
                  seen: { from: byId[from].rev, to: byId[to].rev } };
                if (l.downgraded) doc.downgraded = true;
                return store.put('relation', doc, { actor: { type: 'agent', id: 'link' }, baseRev: 0, reason: opts.local ? '本机发现关联' : 'AI 发现关联' }).then(function (w) {
                  if (w.ok) { linked[l.key] = 1; relIds[id] = 1; rep.suggested.push(w.doc); } else rep.errors.push(byId[from].title + ' → ' + byId[to].title + '：' + w.error);
                });
              });
            }, Promise.resolve()).then(function () {
              batch.forEach(function (c, k) { if (!linked['p' + ((n - 1) * BATCH + k + 1)]) { rep.none++; remember(c); } });
              return next();
            });
          }, function (e) {
            if (e && e.name === 'AbortError') { rep.stopped = true; return; }
            rep.errors.push('第 ' + n + ' 批：' + (e && e.message || e));
            if (e && (e.status === 401 || e.status === 403 || e.status === 503)) { rep.failed = true; return; }
            return next();
          });
        }
        return next().then(function () {
          if (!memoChanged) return;
          var keys = Object.keys(memo), keep = {};
          keys.slice(Math.max(0, keys.length - MEMO_MAX)).forEach(function (k) { keep[k] = memo[k]; });
          return store.put('meta', { id: MEMO_ID, kind: 'meta', pairs: keep }, { baseRev: memoDoc ? memoDoc.rev : 0, reason: '记下判断过的页面对', now: now() });
        });
      });
    }).then(function () {
      rep.status = rep.suggested.length ? 'review' : rep.stopped ? 'stopped' : (rep.failed || (rep.errors.length && !rep.judged)) ? 'failed' : 'empty';
      return rep;
    });
  }

  /* the user's decision: to = 'confirmed' | 'rejected' | 'suggested' (take a decision back). Written as the user, with a version. */
  function decide(store, id, to) {
    if (M.RELATION_STATUS.indexOf(to) < 0) return Promise.reject(new Error('未知的状态'));
    return store.get('relation', id).then(function (cur) {
      if (!cur) throw new Error('没有这条关联');
      return Promise.all([store.get('page', cur.from), store.get('page', cur.to)]).then(function (p) {
        var doc = M.clone(cur);
        doc.status = to;
        if (to === 'suggested') { delete doc.decidedAt; } else doc.decidedAt = Date.now();
        // what the two pages looked like when it was rejected: the pair is left alone until both have changed
        if (to === 'rejected' && p[0] && p[1]) doc.seen = { from: p[0].rev, to: p[1].rev };
        return store.put('relation', doc, { baseRev: cur.rev, reason: to === 'confirmed' ? '确认关联' : to === 'rejected' ? '否决关联' : '恢复为待确认' });
      });
    });
  }

  function pendingCount(relations) { return (relations || []).filter(function (r) { return M.relationStatus(r) === 'suggested'; }).length; }

  return { PER_NODE: PER_NODE, BATCH: BATCH, candidates: candidates, material: material, localJudge: localJudge, suggest: suggest, decide: decide, pendingCount: pendingCount, pairKey: pairKey };
});
