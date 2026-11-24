/* Minest Living Knowledge · Temporal Memory (window.MinestLKTime; also a Node module for the tests).
   Reads the history that is already kept — every write leaves a version { rev, at, by, reason, source, snapshot } — and
   turns it into what a person can follow. Pure functions: nothing is stored, nothing is sent, no AI. Nothing here can
   add to the history; what was never recorded is not shown.
     docText()   one version as plain lines (what a comparison is made of)
     diff()      two versions, line by line: kept, added, removed
     timeline()  the versions of one thing, newest first, each with what changed since the one before
     chain()     a decision and the ones it replaced or was replaced by (supersededBy), oldest first, and which one
                 is in force now: the end of the chain, when it is Confirmed
     stateAt()   what a thing looked like at a moment: its last version at or before that time */
(function (root, factory) {
  var node = typeof module === 'object' && module.exports;
  var M = node ? require('./lk-model.js') : root.MinestLKModel;
  var T = factory(M);
  if (node) module.exports = T; else root.MinestLKTime = T;
})(typeof window !== 'undefined' ? window : this, function (M) {
  'use strict';

  var MAX_CELLS = 4000000;
  function list(a) { return (a || []).filter(Boolean).map(function (x) { return '- ' + (typeof x === 'string' ? x : x.text || ''); }); }

  function docText(kind, snap) {
    snap = snap || {};
    var out = [];
    if (kind === 'page') {
      out.push('标题：' + (snap.title || ''), '类型：' + (snap.type || 'note'));
      if ((snap.aliases || []).length) out.push('别名：' + snap.aliases.join('、'));
      if ((snap.tags || []).length) out.push('标签：' + snap.tags.join('、'));
      if (snap.lockedBy === 'user') out.push('已锁定');
      out.push('');
      out = out.concat(String(snap.markdown || '').replace(/\r\n?/g, '\n').split('\n'));
      if ((snap.claims || []).length) { out.push('', '关键说法：'); snap.claims.forEach(function (c) { out.push('- ' + c.text + (c.origin === 'ai_inferred' ? '（AI 推断）' : '')); }); }
    } else if (kind === 'decision') {
      out.push('标题：' + (snap.title || ''), '状态：' + (snap.state || ''));
      if (snap.supersededBy) out.push('被取代：' + snap.supersededBy);
      out.push('', '需求：'); out = out.concat(String(snap.requirement || '—').split('\n'));
      out.push('', '选项：'); out = out.concat(list(snap.options));
      out.push('', '决定：'); out = out.concat(String(snap.decision || '—').split('\n'));
      out.push('', '理由：'); out = out.concat(list(snap.reasons));
      out.push('', '还没解决的问题：'); out = out.concat(list(snap.openQuestions));
    } else if (kind === 'insight') {
      out.push('标题：' + (snap.title || ''), '状态：' + (snap.status || ''), '', '核心洞察：');
      out = out.concat(String(snap.insight || '—').split('\n'));
      out.push('', '推理：'); out = out.concat(String(snap.reasoning || '—').split('\n'));
      out.push('', '要点：'); (snap.points || []).forEach(function (p) { out.push('- ' + p.text + (p.kind === 'supported' ? '' : '（假设）')); });
      out.push('', '依据：' + (snap.supportingNodeIds || []).join('、'));
    } else if (kind === 'relation') {
      out.push(snap.from + ' —' + snap.type + '→ ' + snap.to, '状态：' + M.relationStatus(snap));
      if (snap.explanation) out.push('理由：' + snap.explanation);
    } else out = JSON.stringify(M.clone(snap) || {}, null, 1).split('\n');
    return out;
  }

  /* a, b: arrays of lines → [{ op: ' ' | '+' | '-', text }] (LCS). Very large texts are compared as a whole block. */
  function diff(a, b) {
    a = a || []; b = b || [];
    var n = a.length, m = b.length, out = [], i, j;
    var pre = 0; while (pre < n && pre < m && a[pre] === b[pre]) pre++;
    var suf = 0; while (suf < n - pre && suf < m - pre && a[n - 1 - suf] === b[m - 1 - suf]) suf++;
    var A = a.slice(pre, n - suf), B = b.slice(pre, m - suf);
    for (i = 0; i < pre; i++) out.push({ op: ' ', text: a[i] });
    if (A.length * B.length > MAX_CELLS) {
      A.forEach(function (t) { out.push({ op: '-', text: t }); }); B.forEach(function (t) { out.push({ op: '+', text: t }); });
    } else {
      var w = B.length + 1, dp = new Uint32Array((A.length + 1) * w);
      for (i = A.length - 1; i >= 0; i--) for (j = B.length - 1; j >= 0; j--) dp[i * w + j] = A[i] === B[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
      i = 0; j = 0;
      while (i < A.length && j < B.length) {
        if (A[i] === B[j]) { out.push({ op: ' ', text: A[i] }); i++; j++; }
        else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) out.push({ op: '-', text: A[i++] });
        else out.push({ op: '+', text: B[j++] });
      }
      while (i < A.length) out.push({ op: '-', text: A[i++] });
      while (j < B.length) out.push({ op: '+', text: B[j++] });
    }
    for (i = n - suf; i < n; i++) out.push({ op: ' ', text: a[i] });
    return out;
  }
  function diffDocs(kind, older, newer) { return diff(docText(kind, older), docText(kind, newer)); }
  function count(d) { var add = 0, del = 0; d.forEach(function (x) { if (x.op === '+') add++; else if (x.op === '-') del++; }); return { added: add, removed: del }; }

  // what changed between two versions of one thing, in a few words
  function changes(kind, prev, cur) {
    var out = [];
    if (!prev) return ['新建'];
    var field = kind === 'decision' ? 'state' : kind === 'insight' ? 'status' : null;
    var a = kind === 'relation' ? M.relationStatus(prev) : field ? prev[field] : null, b = kind === 'relation' ? M.relationStatus(cur) : field ? cur[field] : null;
    if (a !== b) out.push({ state: true, from: a, to: b });
    if (prev.title !== cur.title) out.push('标题：' + prev.title + ' → ' + cur.title);
    if (kind === 'decision' && (prev.supersededBy || '') !== (cur.supersededBy || '')) out.push(cur.supersededBy ? '被取代：' + cur.supersededBy : '不再标为被取代');
    if (kind === 'page') {
      if ((prev.lockedBy || '') !== (cur.lockedBy || '')) out.push(cur.lockedBy === 'user' ? '锁定' : '解除锁定');
      var pc = {}, added = 0, kept = 0;
      (prev.claims || []).forEach(function (c) { pc[c.id || c.text] = 1; });
      (cur.claims || []).forEach(function (c) { if (pc[c.id || c.text]) kept++; else added++; });
      var gone = (prev.claims || []).length - kept;
      if (added || gone) out.push('说法 ' + (added ? '+' + added : '') + (added && gone ? ' ' : '') + (gone ? '−' + gone : ''));
    }
    return out;
  }

  /* versions (any order) → newest first: { rev, at, by, reason, source, changes, added, removed, snapshot } */
  function timeline(kind, versions) {
    var vs = (versions || []).filter(function (v) { return v && v.snapshot; }).slice().sort(function (a, b) { return a.rev - b.rev; });
    return vs.map(function (v, i) {
      var prev = i ? vs[i - 1].snapshot : null, c = prev ? count(diffDocs(kind, prev, v.snapshot)) : { added: 0, removed: 0 };
      return { rev: v.rev, at: v.at, by: v.by, reason: v.reason, source: v.source || '', changes: changes(kind, prev, v.snapshot), added: c.added, removed: c.removed,
        prevRev: i ? vs[i - 1].rev : null, snapshot: v.snapshot };
    }).reverse();
  }

  function stateAt(versions, t) {
    var best = null;
    (versions || []).forEach(function (v) { if (v && v.at <= t && (!best || v.rev > best.rev)) best = v; });
    return best ? best.snapshot || best : null;
  }

  /* decisions: all of them; id: the one being looked at.
     supersededBy is a decision id (older records hold a title: matched by title, then by the id that title would have).
     → { items: [{ decision, self, current }], currentId, broken: text of a supersededBy that names nothing here } */
  function chain(decisions, id) {
    var byId = {}, byTitle = {};
    (decisions || []).forEach(function (d) { byId[d.id] = d; byTitle[String(d.title || '').trim().toLowerCase()] = d; });
    var next = function (d) {
      var s = String((d && d.supersededBy) || '').trim();
      if (!s) return null;
      var hit = byId[s] || byTitle[s.toLowerCase()] || byId[M.decisionId(s)];
      return hit && hit.id !== d.id ? hit : null;
    };
    var self = byId[id];
    if (!self) return { items: [], currentId: null, broken: '' };
    var before = {};                                                    // every decision → the ones it replaced
    (decisions || []).forEach(function (d) { var n = next(d); if (n) (before[n.id] = before[n.id] || []).push(d); });
    var seen = {}, older = [], queue = [self];
    seen[self.id] = 1;
    while (queue.length) {
      var x = queue.shift();
      (before[x.id] || []).forEach(function (p) { if (!seen[p.id]) { seen[p.id] = 1; older.push(p); queue.push(p); } });
    }
    older.sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0) || (a.id < b.id ? -1 : 1); });
    var newer = [], cur = self, n;
    while ((n = next(cur)) && !seen[n.id]) { seen[n.id] = 1; newer.push(n); cur = n; }
    var last = newer.length ? newer[newer.length - 1] : self;
    var currentId = last.state === 'Confirmed' && !next(last) ? last.id : null;
    var broken = self.supersededBy && !next(self) ? String(self.supersededBy) : '';
    return { items: older.concat([self], newer).map(function (d) { return { decision: d, self: d.id === id, current: d.id === currentId }; }), currentId: currentId, broken: broken };
  }

  return { docText: docText, diff: diff, diffDocs: diffDocs, count: count, changes: changes, timeline: timeline, stateAt: stateAt, chain: chain };
});
