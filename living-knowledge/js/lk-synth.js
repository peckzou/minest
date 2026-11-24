/* Minest Living Knowledge · Knowledge Synthesis (window.MinestLKSynth; also a Node module for the tests).
   The user picks 2 to 8 pages or decisions and asks for one of five things; what comes back is an Insight Card,
   kept as its own kind of document (lk_insights), never inside a page:
     synthesize()  only the title, the start of the text and the accepted claims of the picked nodes are used. Judged by
                   Minest AI (/api/minest/lk-synthesize, only when AI is allowed) or by the device (opts.local: it only
                   lines up claims that share words and says so; it draws no conclusion of its own).
                   Every point either cites claims that were sent ("supported") or cites nothing ("hypothesis").
                   The result is written as a Draft, as an agent. lk-model.js refuses to write over an insight the user
                   reviewed or confirmed, and over a rejected one while the nodes it rests on are unchanged.
     setStatus()   the user: Reviewed, Confirmed, Rejected, or back to Draft. Written as the user, with a version.
     update()      the user edits the card (title, core insight, reasoning, related nodes).
   The same nodes asked the same way are the same insight (M.insightId), so a rejected one is recognised. */
(function (root, factory) {
  var node = typeof module === 'object' && module.exports;
  var M = node ? require('./lk-model.js') : root.MinestLKModel;
  var A = node ? require('./lk-agent.js') : root.MinestLKAgent;
  var Y = factory(M, A);
  if (node) module.exports = Y; else root.MinestLKSynth = Y;
})(typeof window !== 'undefined' ? window : this, function (M, A) {
  'use strict';

  var MIN_NODES = 2, MAX_NODES = 8, MAX_CLAIMS = 14, MAX_POINTS = 8;
  var MODES = {
    synthesize: { name: '综合所选', en: 'Synthesize Selected Nodes' },
    themes: { name: '找共同主题', en: 'Find Common Themes' },
    compare: { name: '比较', en: 'Compare Knowledge' },
    connections: { name: '发现关联', en: 'Discover Connections' },
    insight: { name: '生成洞察', en: 'Generate Insight' }
  };

  function flat(s) { return String(s || '').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { s = flat(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function kindOf(id) { return /^dc_/.test(id) ? 'decision' : /^pg_/.test(id) ? 'page' : null; }
  function sentences(text) { return flat(text).split(/(?<=[。！？!?]|\.\s)/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 8; }); }

  /* what is used (and, with Minest AI, sent) about one node. A page: its accepted claims; a page with no claims yet: the
     first sentences of its text, each given an id so it can be cited the same way. A decision: what was decided and why. */
  function material(doc) {
    var kind = kindOf(doc.id);
    if (kind === 'decision') {
      var parts = [];
      if (doc.decision) parts.push({ id: 's_' + M.hash(doc.id + '|d'), text: clip('决定：' + doc.decision, 300), kind: 'decision' });
      (doc.reasons || []).slice(0, 6).forEach(function (r, i) { parts.push({ id: 's_' + M.hash(doc.id + '|r' + i), text: clip('理由：' + (typeof r === 'string' ? r : r.text), 300), kind: 'reason' }); });
      if (!parts.length && doc.requirement) parts.push({ id: 's_' + M.hash(doc.id + '|q'), text: clip('需求：' + doc.requirement, 300), kind: 'requirement' });
      return { id: doc.id, kind: 'decision', title: doc.title, state: doc.state, summary: clip(doc.requirement, 400), claims: parts };
    }
    var claims = (doc.claims || []).slice(0, MAX_CLAIMS).map(function (c) { return { id: c.id, text: clip(c.text, 300), kind: c.kind || 'fact', inferred: c.origin === 'ai_inferred' }; }).filter(function (c) { return c.id && c.text; });
    if (!claims.length) claims = sentences(doc.markdown).slice(0, 8).map(function (s, i) { return { id: 's_' + M.hash(doc.id + '|' + i + '|' + s), text: clip(s, 300), kind: 'text' }; });
    return { id: doc.id, kind: 'page', title: doc.title, type: doc.type || 'note', summary: clip(doc.markdown, 400), claims: claims };
  }

  /* the device's own synthesis (no AI, nothing sent). It can only compare words, so it only reports what it can show:
     claims of different nodes that share words, and one node naming another. It says plainly that it concluded nothing. */
  function localSynth(body) {
    var nodes = body.nodes || [], mode = body.mode || 'synthesize';
    var items = [];
    nodes.forEach(function (n, ni) { n.claims.forEach(function (c) { items.push({ ni: ni, node: n, c: c, t: A.terms(c.text) }); }); });
    var pairs = [];
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
      if (items[i].ni === items[j].ni) continue;
      var a = items[i].t, b = items[j].t; if (a.length < 3 || b.length < 3) continue;
      var set = {}, shared = []; a.forEach(function (x) { set[x] = 1; }); b.forEach(function (x) { if (set[x]) shared.push(x); });
      var score = shared.length / Math.sqrt(a.length * b.length);
      if (shared.length >= 3 && score >= 0.22) pairs.push({ x: items[i], y: items[j], shared: shared, score: score });
    }
    pairs.sort(function (p, q) { return q.score - p.score; });
    var points = [], used = {}, touched = {};
    pairs.forEach(function (p) {
      if (points.length >= 5 || used[p.x.c.id] || used[p.y.c.id]) return;
      used[p.x.c.id] = used[p.y.c.id] = 1; touched[p.x.node.id] = touched[p.y.node.id] = 1;
      var words = p.shared.slice().sort(function (m, n) { return n.length - m.length; }).slice(0, 4);
      points.push({ text: '“' + p.x.node.title + '”和“' + p.y.node.title + '”各有一条说法用到了相同的词（' + words.join('、') + '）。', claimIds: [p.x.c.id, p.y.c.id], nodeIds: [p.x.node.id, p.y.node.id] });
    });
    nodes.forEach(function (n) {
      nodes.forEach(function (o) {
        if (o === n || points.length >= MAX_POINTS) return;
        var name = flat(o.title).toLowerCase(); if (name.length < 2) return;
        var hit = n.claims.filter(function (c) { return !used[c.id] && flat(c.text).toLowerCase().indexOf(name) >= 0; })[0];
        if (!hit) return;
        used[hit.id] = 1; touched[n.id] = touched[o.id] = 1;
        points.push({ text: '“' + n.title + '”里提到了“' + o.title + '”。', claimIds: [hit.id], nodeIds: [n.id, o.id] });
      });
    });
    if (mode === 'compare') nodes.forEach(function (n) {
      if (points.length >= MAX_POINTS) return;
      var own = n.claims.filter(function (c) { return !used[c.id]; })[0];
      if (own) { used[own.id] = 1; points.push({ text: '只在“' + n.title + '”里出现、其他几项没有对应说法的一条。', claimIds: [own.id], nodeIds: [n.id] }); }
    });
    var alone = nodes.filter(function (n) { return !touched[n.id]; }).map(function (n) { return '“' + n.title + '”和其他几项没有字面上重合的说法'; });
    var empty = nodes.filter(function (n) { return !n.claims.length; }).map(function (n) { return '“' + n.title + '”还没有可以比较的说法'; });
    var titles = nodes.map(function (n) { return n.title; });
    return {
      title: clip(titles.slice(0, 3).join(' × ') + (titles.length > 3 ? ' 等 ' + titles.length + ' 项' : ''), 120),
      insight: points.length ? '在所选的 ' + nodes.length + ' 项里，找到 ' + points.length + ' 处可以逐字指出的呼应（见下面的要点）。这是按字面比较出来的：本机没有理解含义，也没有得出新的结论。'
        : '所选的 ' + nodes.length + ' 项之间，没有找到字面上重合的说法。本机只能比较用词；含义上的联系需要你自己判断，或者改用 Minest AI。',
      reasoning: '方法：把每条说法拆成词（中文按相邻两个字），在不同的页面之间找用词重合最多的说法，再找一页里直接写到另一页名字的地方。没有改写、归纳或推断。',
      points: points, themes: [], gaps: alone.concat(empty).slice(0, 4), questions: [], model: 'local', usage: null
    };
  }

  /* what came back (from the server, already checked there, or from the device) → the insight document.
     Checked again here: a citation can only be something that was used. */
  function build(id, mode, sent, seen, res, engine) {
    var claimNode = {}, claimText = {}, nodeIds = {};
    sent.forEach(function (n) { nodeIds[n.id] = n.kind; n.claims.forEach(function (c) { claimNode[c.id] = n.id; claimText[c.id] = c.text; }); });
    var evidence = [], seenEv = {};
    var points = (res.points || []).slice(0, MAX_POINTS).map(function (p) {
      var cids = (p.claimIds || []).filter(function (c) { return claimNode[c]; }).slice(0, 8);
      var nids = (p.nodeIds || []).filter(function (n) { return nodeIds[n]; });
      cids.forEach(function (c) { if (nids.indexOf(claimNode[c]) < 0) nids.push(claimNode[c]); if (!seenEv[c]) { seenEv[c] = 1; evidence.push({ nodeId: claimNode[c], claimId: c, quote: claimText[c] }); } });
      return { text: clip(p.text, 700), kind: cids.length ? 'supported' : 'hypothesis', claimIds: cids, nodeIds: nids.slice(0, MAX_NODES) };
    }).filter(function (p) { return p.text; });
    var short = function (a, n) { return (a || []).map(function (s) { return clip(s, 200); }).filter(Boolean).slice(0, n); };
    return { id: id, kind: 'insight', title: clip(res.title, 120) || sent.map(function (n) { return n.title; }).join(' × ').slice(0, 120), insight: clip(res.insight, 1200), reasoning: clip(res.reasoning, 1200),
      mode: mode, status: 'Draft', origin: 'ai_inferred', engine: engine, supportingNodeIds: sent.map(function (n) { return n.id; }), seen: seen,
      points: points, evidence: evidence.slice(0, 24), themes: short(res.themes, 6), gaps: short(res.gaps, 4), questions: short(res.questions, 4), relatedIds: [] };
  }

  /* opts: { transport(op, body, signal) → Promise, local, signal }
     → { doc, engine, usage, supported, hypotheses }; rejects with code 'ai-not-allowed' | 'too-few' | 'too-many' |
       'rejected-unchanged' | 'decided' (the error carries .id of the existing insight) */
  function synthesize(store, nodeIds, mode, opts) {
    opts = opts || {};
    mode = MODES[mode] ? mode : 'synthesize';
    var ids = []; (nodeIds || []).forEach(function (x) { if (kindOf(x) && ids.indexOf(x) < 0) ids.push(x); });
    var err = function (code, msg, extra) { return Promise.reject(Object.assign(new Error(msg), { code: code }, extra || {})); };
    if (ids.length < MIN_NODES) return err('too-few', '至少选 ' + MIN_NODES + ' 项才能综合');
    if (ids.length > MAX_NODES) return err('too-many', '一次最多综合 ' + MAX_NODES + ' 项');
    var engine = opts.local ? 'local' : 'cloud', id = M.insightId(ids, mode);
    return store.permissions().then(function (perms) {
      if (!perms.allowAI && !opts.local) throw Object.assign(new Error('还没有允许把知识库内容发给 Minest AI（在“权限”里打开）'), { code: 'ai-not-allowed' });
      return Promise.all([Promise.all(ids.map(function (x) { return store.get(kindOf(x), x); })), store.get('insight', id)]).then(function (r) {
        var docs = r[0].filter(Boolean), cur = r[1];
        if (docs.length < MIN_NODES) throw Object.assign(new Error('所选的内容有的已经不在这台设备上'), { code: 'too-few' });
        var seen = {}; docs.forEach(function (d) { seen[d.id] = d.rev; });
        if (cur && (cur.status === 'Reviewed' || cur.status === 'Confirmed')) throw Object.assign(new Error('这一组内容已经有一条你' + (cur.status === 'Confirmed' ? '确认' : '审阅') + '过的洞察，不会被覆盖'), { code: 'decided', id: id });
        if (cur && cur.status === 'Rejected' && M.stable(cur.seen || {}) === M.stable(seen)) throw Object.assign(new Error('这一组内容综合出的洞察你已经否决过，内容没有变化，所以不再重复生成'), { code: 'rejected-unchanged', id: id });
        var sent = docs.map(material);
        var body = { mode: mode, nodes: sent, maxTokens: perms.maxTokensPerCall || 3000 };
        return Promise.resolve(opts.local ? localSynth(body) : opts.transport('lk-synthesize', body, opts.signal)).then(function (res) {
          var doc = build(id, mode, sent, seen, res, engine);
          return store.put('insight', doc, { actor: { type: 'agent', id: 'synth' }, baseRev: cur ? cur.rev : 0, reason: (opts.local ? '本机综合' : 'AI 综合') + '：' + MODES[mode].name, source: 'synthesis:' + engine }).then(function (w) {
            if (!w.ok) throw Object.assign(new Error(w.error), { code: w.code, id: id });
            return { doc: w.doc, engine: engine, usage: res.usage || null,
              supported: doc.points.filter(function (p) { return p.kind === 'supported'; }).length, hypotheses: doc.points.filter(function (p) { return p.kind !== 'supported'; }).length };
          });
        });
      });
    });
  }

  var REASONS = { Draft: '改回草稿', Reviewed: '标为已审阅', Confirmed: '确认洞察', Rejected: '否决洞察' };
  function setStatus(store, id, status) {
    if (M.INSIGHT_STATUS.indexOf(status) < 0) return Promise.reject(new Error('未知的状态'));
    return store.get('insight', id).then(function (cur) {
      if (!cur) throw new Error('没有这条洞察');
      var doc = M.clone(cur); doc.status = status;
      if (status === 'Draft') delete doc.decidedAt; else doc.decidedAt = Date.now();
      return store.put('insight', doc, { baseRev: cur.rev, reason: REASONS[status] });
    });
  }
  // fields: { title, insight, reasoning, relatedIds } — what the user changed on the card
  function update(store, id, fields, baseRev) {
    return store.get('insight', id).then(function (cur) {
      if (!cur) throw new Error('没有这条洞察');
      var doc = M.clone(cur);
      ['title', 'insight', 'reasoning'].forEach(function (k) { if (fields[k] != null) doc[k] = String(fields[k]).trim(); });
      if (fields.relatedIds) doc.relatedIds = fields.relatedIds.filter(function (x, i, a) { return kindOf(x) && a.indexOf(x) === i && doc.supportingNodeIds.indexOf(x) < 0; }).slice(0, 12);
      doc.edited = true;
      return store.put('insight', doc, { baseRev: baseRev == null ? cur.rev : baseRev, reason: '编辑洞察' });
    });
  }
  function draftCount(insights) { return (insights || []).filter(function (n) { return n.status === 'Draft'; }).length; }

  return { MIN_NODES: MIN_NODES, MAX_NODES: MAX_NODES, MODES: MODES, material: material, localSynth: localSynth, build: build, synthesize: synthesize, setStatus: setStatus, update: update, draftCount: draftCount, kindOf: kindOf };
});
