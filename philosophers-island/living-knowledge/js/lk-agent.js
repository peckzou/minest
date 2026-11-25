/* Minest Living Knowledge · M3 — the ingest agent (window.MinestLKAgent; also a Node module for the tests).
   Source → pieces → /api/minest/lk-extract (one call per piece, within the budget) → a proposal the user reviews.
   Nothing reaches a page until the user accepts it; what is accepted is written as the user, with a version.
     · runs only when the user has allowed AI (permissions.allowAI) and only on the sources the user chose
     · a budget: at most maxCallsPerRun pieces per run; a run can be stopped at any time and keeps what it has
     · every claim keeps where it came from (source id, character range, the exact quote — checked by the server)
     · the same source again proposes nothing new: claims already there (same words, or the server says "same as")
       only gain the source as support, and not even that when it is already listed
     · a claim that contradicts one already on the page is proposed with the conflict marked; both are kept
     · AI inferences are kept apart (origin ai_inferred, no source); quoted facts are origin verified once the user accepts
   The run (lk_runs/<id>) keeps scope, budget, use, the proposal and what was accepted or rejected. */
(function (root, factory) {
  var node = typeof module === 'object' && module.exports;
  var M = node ? require('./lk-model.js') : root.MinestLKModel;
  var A = factory(M);
  if (node) module.exports = A; else root.MinestLKAgent = A;
})(typeof window !== 'undefined' ? window : this, function (M) {
  'use strict';

  var PIECE = 6000, OVERLAP = 300, MAX_PROPOSAL_BYTES = 700000;

  // pieces of about 6 000 characters, cut at a paragraph or sentence end, overlapping a little so no sentence is lost
  function chunk(text, size, overlap) {
    text = String(text || ''); size = size || PIECE; overlap = overlap == null ? OVERLAP : overlap;
    var out = [], start = 0;
    while (start < text.length) {
      var end = Math.min(text.length, start + size);
      if (end < text.length) {
        var win = text.slice(start + Math.floor(size * 0.6), end), cut = -1, m, re = /\n\n|\n|[。！？.!?](\s|$)/g;
        while ((m = re.exec(win))) cut = m.index + m[0].length;
        if (cut > 0) end = start + Math.floor(size * 0.6) + cut;
      }
      out.push({ index: out.length, start: start, end: end, text: text.slice(start, end) });
      if (end >= text.length) break;
      start = Math.max(end - overlap, start + 1);
    }
    return out;
  }
  function estimate(sources, perms) {
    var calls = 0, chars = 0;
    (sources || []).forEach(function (s) { var c = chunk(s.text); calls += c.length; chars += String(s.text || '').length; });
    var max = (perms && perms.maxCallsPerRun) || 12;
    // a rough guide: ~1 token per 1.5 characters for mixed Chinese / English, plus the lists and the answer
    return { calls: calls, allowed: Math.min(calls, max), over: calls > max, chars: chars, approxTokens: Math.round(chars / 1.5 + Math.min(calls, max) * 2500) };
  }

  function normClaim(s) { return String(s || '').normalize ? String(s).normalize('NFKC').toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim() : String(s).toLowerCase(); }
  function claimId(pageId, text) { return 'cl_' + M.hash(pageId + '|' + normClaim(text)); }
  function grams(s) { s = normClaim(s).replace(/\s+/g, ''); var g = {}; for (var i = 0; i < s.length - 1; i++) g[s.slice(i, i + 2)] = 1; return g; }
  function similar(a, b) {
    var x = grams(a), y = grams(b), inter = 0, n = 0;
    Object.keys(x).forEach(function (k) { n++; if (y[k]) inter++; });
    Object.keys(y).forEach(function (k) { if (!x[k]) n++; });
    return n ? inter / n : 0;
  }
  function slugKey(s) { return M.slug(s); }

  // ---------------------------------------------------------------- calling the server
  function httpTransport(o) {
    o = o || {};
    return function (op, body, signal) {
      return Promise.resolve(o.headers ? o.headers() : {}).then(function (h) {
        return fetch(o.base + op, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(body), signal: signal });
      }).then(function (r) {
        return r.text().then(function (t) {
          var data; try { data = JSON.parse(t); } catch (e) { throw new Error('Minest AI 没有正常回应（' + r.status + '）'); }
          if (!r.ok || data.error) throw Object.assign(new Error(data.error || ('Minest AI 出错（' + r.status + '）')), { status: r.status });
          return data;
        });
      });
    };
  }

  // ---------------------------------------------------------------- the run
  /* opts: { transport(op, body, signal) → Promise, sourceIds, signal, onProgress({ done, total, calls }), now }
     → the saved run (status 'review' | 'empty' | 'stopped' | 'failed') */
  function ingest(store, opts) {
    opts = opts || {};
    var now = opts.now || function () { return Date.now(); };
    var run = null;
    return store.permissions().then(function (perms) {
      if (!perms.allowAI) throw Object.assign(new Error('还没有允许把来源文字发给 Minest AI（在“权限”里打开）'), { code: 'ai-not-allowed' });
      return Promise.all((opts.sourceIds || []).map(function (id) { return store.get('source', id); })).then(function (sources) {
        sources = sources.filter(Boolean);
        if (!sources.length) throw Object.assign(new Error('没有选中的来源'), { code: 'invalid' });
        var maxCalls = Math.max(1, perms.maxCallsPerRun || 12);
        var jobs = [];
        sources.forEach(function (s) { chunk(s.text).forEach(function (c) { jobs.push({ source: s, piece: c }); }); });
        run = { id: M.runId(now()), kind: 'run', mode: 'ingest', status: 'running', scope: { sourceIds: sources.map(function (s) { return s.id; }) },
          budget: { maxCalls: maxCalls, maxTokensPerCall: perms.maxTokensPerCall || 3000 }, used: { calls: 0, input: 0, output: 0 },
          pieces: jobs.length, startedAt: now(), proposals: [], errors: [] };
        return Promise.all([store.list('page')]).then(function (r) {
          var pages = r[0];
          var known = pages.map(function (p) { return { id: p.id, title: p.title, aliases: p.aliases || [] }; });
          var claims = []; pages.forEach(function (p) { (p.claims || []).forEach(function (c) { claims.push({ id: c.id, page: p.title, text: c.text }); }); });
          var results = [], i = 0;
          function next() {
            if (i >= jobs.length) return Promise.resolve();
            if (opts.signal && opts.signal.aborted) { run.stopped = true; return Promise.resolve(); }
            if (run.used.calls >= maxCalls) { run.limited = true; return Promise.resolve(); }
            var j = jobs[i++];
            run.used.calls++;
            if (opts.onProgress) opts.onProgress({ done: i - 1, total: Math.min(jobs.length, maxCalls), calls: run.used.calls });
            return opts.transport('lk-extract', { text: j.piece.text, offset: j.piece.start, title: j.source.title, pages: known.slice(0, 300), claims: claims.slice(-200), maxTokens: run.budget.maxTokensPerCall }, opts.signal)
              .then(function (res) {
                if (res.usage) { run.used.input += res.usage.input || 0; run.used.output += res.usage.output || 0; }
                results.push({ sourceId: j.source.id, res: res });
                // what this piece found is known to the next one (same concept → same page)
                (res.concepts || []).forEach(function (c) { if (!c.matchPageId && !known.some(function (k) { return slugKey(k.title) === slugKey(c.title); })) known.push({ id: M.pageId(c.title), title: c.title, aliases: c.aliases || [] }); });
                return next();
              }, function (e) {
                if (e && e.name === 'AbortError') { run.stopped = true; return; }
                run.errors.push('第 ' + i + ' 段：' + (e && e.message || e));
                if (e && (e.status === 401 || e.status === 403 || e.status === 503)) { run.status = 'failed'; return; }
                return next();
              });
          }
          return next().then(function () { return propose(store, results, pages); });
        });
      });
    }).then(function (proposals) {
      run.proposals = proposals;
      run.done = run.used.calls - run.errors.length;
      if (run.status !== 'failed') run.status = proposals.length ? 'review' : (run.errors.length && run.done <= 0 ? 'failed' : 'empty');
      else if (proposals.length) run.status = 'review';
      run.endedAt = now();
      trimRun(run);
      return store.put('run', run, { actor: { type: 'agent', id: 'ingest' }, baseRev: 0, reason: '整理来源' }).then(function (w) { return w.ok ? w.doc : run; });
    });
  }
  function trimRun(run) {
    while (M.byteSize(run) > MAX_PROPOSAL_BYTES && run.proposals.length) {
      var last = run.proposals[run.proposals.length - 1];
      if (last.items.length > 1) last.items.pop(); else run.proposals.pop();
      run.truncated = true;
    }
  }

  /* the pieces' answers → one proposal per page: { pageId, title, isNew, type, aliases, summary, items: [item] }
     item: { key, type: 'claim' | 'support' | 'relation', status: 'pending', … } */
  function propose(store, results, pages) {
    var byId = {}, bySlug = {};
    pages.forEach(function (p) { byId[p.id] = p; bySlug[slugKey(p.title)] = p; (p.aliases || []).forEach(function (a) { bySlug[slugKey(a)] = bySlug[slugKey(a)] || p; }); });
    var claimById = {}; pages.forEach(function (p) { (p.claims || []).forEach(function (c) { claimById[c.id] = { claim: c, page: p }; }); });
    var groups = {}, order = [];
    function group(title, pageId, concept) {
      var p = (pageId && byId[pageId]) || bySlug[slugKey(title)];
      var id = p ? p.id : M.pageId(title);
      if (!groups[id]) {
        groups[id] = { pageId: id, title: p ? p.title : title, isNew: !p, type: (concept && concept.type) || (p && p.type) || 'concept', aliases: [], summary: '', items: [], seen: {} };
        order.push(id);
      }
      var g = groups[id];
      if (concept && g.isNew) {
        if (!g.summary && concept.summary) g.summary = concept.summary;
        (concept.aliases || []).forEach(function (a) { if (a && g.aliases.indexOf(a) < 0 && slugKey(a) !== slugKey(g.title)) g.aliases.push(a); });
      }
      return g;
    }
    function existingSame(page, text) {
      return (page && page.claims || []).filter(function (c) { return c.id === claimId(page.id, text) || similar(c.text, text) >= 0.85; })[0] || null;
    }
    return store.list('relation').then(function (rels) {
      var relById = {}; rels.forEach(function (r) { relById[r.id] = r; });
      results.forEach(function (r) {
        (r.res.concepts || []).forEach(function (c) { group(c.title, c.matchPageId, c); });
        (r.res.claims || []).forEach(function (c) {
          var g = group(c.page, c.pageId), page = byId[g.pageId];
          var src = c.evidence ? { sourceId: r.sourceId, span: { start: c.evidence.start, end: c.evidence.end }, quote: c.evidence.quote } : null;
          var hit = (c.sameAsClaimId && claimById[c.sameAsClaimId] && claimById[c.sameAsClaimId].page.id === g.pageId) ? claimById[c.sameAsClaimId].claim : existingSame(page, c.text);
          if (hit) {
            // already on the page: at most a new source for it
            if (!src || (hit.sources || []).some(function (s) { return s.sourceId === src.sourceId; })) return;
            var k1 = 'support|' + hit.id + '|' + src.sourceId;
            if (g.seen[k1]) return; g.seen[k1] = 1;
            g.items.push({ key: k1, type: 'support', claimId: hit.id, claimText: hit.text, source: src, status: 'pending' });
            return;
          }
          var id = claimId(g.pageId, c.text);
          var dup = g.items.filter(function (x) { return x.type === 'claim' && (x.claim.id === id || similar(x.claim.text, c.text) >= 0.85); })[0];
          if (dup) { if (src && !dup.claim.sources.some(function (s) { return s.sourceId === src.sourceId && s.span.start === src.span.start; })) dup.claim.sources.push(src); return; }
          var claim = { id: id, text: c.text, kind: c.kind, confidence: c.confidence, sources: src ? [src] : [], origin: src ? 'verified' : 'ai_inferred' };
          var item = { key: 'claim|' + id, type: 'claim', claim: claim, status: 'pending' };
          if (c.contradictsClaimId && claimById[c.contradictsClaimId]) {
            var other = claimById[c.contradictsClaimId];
            item.conflict = { claimId: other.claim.id, pageId: other.page.id, pageTitle: other.page.title, text: other.claim.text, why: c.why || '' };
          }
          g.items.push(item);
        });
        (r.res.relations || []).forEach(function (x) {
          var a = group(x.from, x.fromPageId), b = group(x.to, x.toPageId);
          var id = M.relationId(a.pageId, x.type, b.pageId), ev = x.evidence ? { sourceId: r.sourceId, span: { start: x.evidence.start, end: x.evidence.end }, quote: x.evidence.quote } : null;
          var old = relById[id];
          if (old && (!ev || (old.evidence || []).some(function (e) { return e.sourceId === ev.sourceId; }))) return;
          var k = 'relation|' + id;
          if (a.seen[k]) return; a.seen[k] = 1;
          a.items.push({ key: k, type: 'relation', relation: { id: id, from: a.pageId, fromTitle: a.title, to: b.pageId, toTitle: b.title, type: x.type, evidence: ev ? [ev] : [], origin: ev ? 'verified' : 'ai_inferred', exists: !!old }, status: 'pending' });
        });
      });
      // a new page with only a summary is proposed as a page; anything with nothing to add is left out
      return order.map(function (id) {
        var g = groups[id]; delete g.seen;
        if (!g.items.length && g.isNew && g.summary) g.items.push({ key: 'page|' + g.pageId, type: 'page', status: 'pending' });
        return g;
      }).filter(function (g) { return g.items.length; });
    });
  }

  // ---------------------------------------------------------------- the user's decision
  /* choice: { key: true (accept) | false (reject) }; keys left out stay pending. Accepted items are written as the user. */
  function apply(store, runId, choice) {
    return store.get('run', runId).then(function (run) {
      if (!run) throw new Error('没有这次整理');
      var report = { pages: 0, claims: 0, supports: 0, relations: 0, rejected: 0, errors: [] };
      var reason = '审核通过：AI 整理（' + run.id + '）';
      return run.proposals.reduce(function (p, g) {
        return p.then(function () {
          var take = g.items.filter(function (it) { return it.status === 'pending' && choice[it.key] === true; });
          g.items.forEach(function (it) { if (it.status === 'pending' && choice[it.key] === false) { it.status = 'rejected'; report.rejected++; } });
          if (!take.length) return;
          return store.get('page', g.pageId).then(function (cur) {
            var pageItems = take.filter(function (it) { return it.type !== 'relation'; });
            var write = Promise.resolve(cur);
            if (pageItems.length || (!cur && take.length)) {
              var doc = cur ? M.clone(cur) : { id: g.pageId, title: g.title, type: g.type || 'concept', aliases: g.aliases || [], tags: [], markdown: g.summary || '', claims: [], sourceIds: [] };
              doc.claims = doc.claims || []; doc.sourceIds = doc.sourceIds || [];
              var addSource = function (sid) { if (sid && doc.sourceIds.indexOf(sid) < 0) doc.sourceIds.push(sid); };
              pageItems.forEach(function (it) {
                if (it.type === 'claim') {
                  if (doc.claims.some(function (c) { return c.id === it.claim.id; })) return;
                  var c = M.clone(it.claim); c.addedBy = 'agent:ingest'; c.reviewedAt = Date.now();
                  if (it.conflict) {
                    c.conflictsWith = [it.conflict.claimId];
                    var other = doc.claims.filter(function (x) { return x.id === it.conflict.claimId; })[0];
                    if (other) other.conflictsWith = (other.conflictsWith || []).concat(other.conflictsWith && other.conflictsWith.indexOf(c.id) >= 0 ? [] : [c.id]);
                  }
                  doc.claims.push(c); report.claims++;
                  c.sources.forEach(function (s) { addSource(s.sourceId); });
                } else if (it.type === 'support') {
                  var t = doc.claims.filter(function (x) { return x.id === it.claimId; })[0];
                  if (t && !(t.sources || []).some(function (s) { return s.sourceId === it.source.sourceId; })) { t.sources = (t.sources || []).concat([it.source]); report.supports++; addSource(it.source.sourceId); }
                }
              });
              if (!doc.sourceIds.length) delete doc.sourceIds;
              write = store.put('page', doc, { baseRev: cur ? cur.rev : 0, reason: reason }).then(function (w) {
                if (!w.ok) { report.errors.push(g.title + '：' + w.error); return null; }
                if (!cur) report.pages++;
                pageItems.forEach(function (it) { it.status = 'accepted'; });
                return w.doc;
              });
            }
            return write.then(function () {
              return take.filter(function (it) { return it.type === 'relation'; }).reduce(function (q, it) {
                return q.then(function () {
                  return store.get('relation', it.relation.id).then(function (old) {
                    var r = it.relation, doc = old ? M.clone(old) : { id: r.id, from: r.from, to: r.to, type: r.type, origin: r.origin, evidence: [], status: 'accepted' };
                    (r.evidence || []).forEach(function (e) { if (!doc.evidence.some(function (x) { return x.sourceId === e.sourceId; })) doc.evidence.push(e); });
                    if (doc.evidence.length && doc.origin === 'ai_inferred') doc.origin = 'verified';
                    return store.put('relation', doc, { baseRev: old ? old.rev : 0, reason: reason }).then(function (w) {
                      if (w.ok) { it.status = 'accepted'; report.relations++; } else report.errors.push(r.fromTitle + ' → ' + r.toTitle + '：' + w.error);
                    });
                  });
                });
              }, Promise.resolve());
            });
          });
        });
      }, Promise.resolve()).then(function () {
        var left = 0; run.proposals.forEach(function (g) { g.items.forEach(function (it) { if (it.status === 'pending') left++; }); });
        if (!left) run.status = 'done';
        run.reviewedAt = Date.now();
        return store.put('run', run, { baseRev: run.rev, reason: '审核' }).then(function () { report.left = left; return report; });
      });
    });
  }

  function pendingCount(runs) {
    var n = 0; (runs || []).forEach(function (r) { (r.proposals || []).forEach(function (g) { g.items.forEach(function (it) { if (it.status === 'pending') n++; }); }); });
    return n;
  }

  return { chunk: chunk, estimate: estimate, claimId: claimId, similar: similar, httpTransport: httpTransport, ingest: ingest, propose: propose, apply: apply, pendingCount: pendingCount };
});
