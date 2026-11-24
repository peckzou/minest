/* Minest Living Knowledge · M1 — the rules of the data (window.MinestLKModel; also a Node module for the tests).
   Pure functions only: no storage, no network, no AI. lk-store.js keeps the data and calls these before every write.
     ids        stable and readable: page pg_<slug of the title>, relation rl_<hash of from·type·to>, source src_<sha256 of the
                normalized text> (the same text imported twice is the same source), decision dc_<slug>, run run_<time>
     planWrite  the one gate every write goes through: next revision, a version record, and the guards —
                · a source never changes after it is written (the same text again is a no-op; different text is refused)
                · a Confirmed decision is never changed by anything but the user; an agent may only propose
                · a page the user locked is never changed by an agent
                · a write made against an older revision is a conflict, never a silent overwrite
                · a document over 900 KB is refused (Firestore keeps at most 1 MiB per document)
     Markdown   one .md per page / decision / source with YAML front matter and [[wiki links]] (Obsidian can open it,
                nothing depends on Obsidian), an index.md and a log.md, packed in a plain .zip (stored, no compression). */
(function (root, factory) {
  var M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M; else root.MinestLKModel = M;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var MAX_DOC_BYTES = 900000;
  var KINDS = {
    source: { coll: 'lk_sources', prefix: 'src_' },
    page: { coll: 'lk_pages', prefix: 'pg_' },
    relation: { coll: 'lk_relations', prefix: 'rl_' },
    decision: { coll: 'lk_decisions', prefix: 'dc_' },
    run: { coll: 'lk_runs', prefix: 'run_' },
    insight: { coll: 'lk_insights', prefix: 'ins_' },
    meta: { coll: 'lk_meta', prefix: '' }
  };
  var PAGE_TYPES = ['concept', 'person', 'event', 'project', 'topic', 'howto', 'note'];
  var SOURCE_KINDS = ['pdf', 'web', 'note', 'chat', 'card', 'markdown'];
  var RELATION_TYPES = ['related', 'part_of', 'person_event', 'project_decision', 'topic_point', 'supports', 'contradicts', 'derived_from', 'applied_to', 'evolved_from'];
  /* a relation is suggested (found by AI or by the device, waiting for the user), confirmed, or rejected (kept, so it is
     not suggested again). Relations written before this field existed have no status, or 'accepted': both read as confirmed. */
  var RELATION_STATUS = ['suggested', 'confirmed', 'rejected'];
  function relationStatus(r) { return r && (r.status === 'suggested' || r.status === 'rejected') ? r.status : 'confirmed'; }
  var ORIGINS = ['verified', 'ai_inferred', 'user'];
  var DECISION_STATES = ['Proposed', 'Confirmed', 'Superseded', 'Rejected', 'Disputed'];
  /* an insight is what a synthesis of several pages and decisions concluded. It is its own kind of document, apart from the
     pages: it starts as a Draft (written by AI or by the device), and only the user can make it Reviewed or Confirmed, or
     reject it. A point of an insight is "supported" (it cites claims that were given) or a "hypothesis" (it cites nothing). */
  var INSIGHT_STATUS = ['Draft', 'Reviewed', 'Confirmed', 'Rejected'];
  var INSIGHT_MODES = ['synthesize', 'themes', 'compare', 'connections', 'insight'];
  var POINT_KINDS = ['supported', 'hypothesis'];
  var MODULES = ['living-knowledge', 'journal', 'study', 'myworld', 'routine', 'agents', 'decisions'];
  var META_FIELDS = ['rev', 'updatedAt', 'updatedBy', 'createdAt', 'createdBy', 'baseRev'];

  // ------------------------------------------------------------------ small helpers
  function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }
  function content(doc) { var o = {}; Object.keys(doc || {}).forEach(function (k) { if (META_FIELDS.indexOf(k) < 0) o[k] = doc[k]; }); return o; }
  function sameContent(a, b) { return stable(content(a)) === stable(content(b)); }
  function utf8Bytes(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    return Uint8Array.from(Buffer.from(s, 'utf8'));
  }
  function byteSize(v) { return utf8Bytes(JSON.stringify(v)).length; }

  // FNV-1a, two lanes → 16 hex characters (ids only; not for security)
  function hash(s) {
    s = String(s);
    var h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 16777619);
      h2 ^= c; h2 = Math.imul(h2, 2246822519);
    }
    return ('0000000' + (h1 >>> 0).toString(16)).slice(-8) + ('0000000' + (h2 >>> 0).toString(16)).slice(-8);
  }
  function sha256Hex(text) {
    var bytes = utf8Bytes(String(text));
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(require('crypto').createHash('sha256').update(Buffer.from(bytes)).digest('hex'));
  }
  // the text as it is compared: one Unicode form, one kind of line break, no trailing spaces, at most one blank line
  function normalizeText(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFC');
    return s.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // keeps Chinese, Japanese and Korean letters; everything else becomes "-"
  function slug(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFKC');
    return s.toLowerCase().replace(/[^a-z0-9぀-ヿ㐀-鿿가-힯]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }
  function pageId(title) { var s = slug(title); return 'pg_' + (s || hash(title)); }
  function decisionId(title) { var s = slug(title); return 'dc_' + (s || hash(title)); }
  function relationId(from, type, to) { return 'rl_' + hash(from + '|' + type + '|' + to); }
  function sourceId(text) { return sha256Hex(normalizeText(text)).then(function (h) { return 'src_' + h.slice(0, 20); }); }
  // the same nodes synthesised the same way are the same insight, whatever order they were picked in
  function insightId(nodeIds, mode) { return 'ins_' + hash((mode || 'synthesize') + '|' + (nodeIds || []).slice().sort().join('|')); }
  function runId(now) { return 'run_' + (now || Date.now()).toString(36) + hash(Math.random()).slice(0, 4); }

  // [[target]] and [[target|label]] → [{ target, label, id }]
  function parseLinks(md) {
    var out = [], seen = {}, re = /\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]/g, m;
    while ((m = re.exec(String(md || '')))) {
      var t = m[1].trim(); if (!t) continue;
      var id = /^pg_/.test(t) ? t : pageId(t);
      if (seen[id]) continue; seen[id] = 1;
      out.push({ target: t, label: (m[2] || t).trim(), id: id });
    }
    return out;
  }

  // ------------------------------------------------------------------ defaults
  function defaultPermissions() {
    var modules = {};
    MODULES.forEach(function (m) { modules[m] = { read: m === 'living-knowledge', write: m === 'living-knowledge' }; });
    // allowAI: may the text of a source be sent to Minest AI (the model provider configured for Minest) to be organised
    return { id: 'permissions', kind: 'meta', modules: modules, agentAutoApply: false, allowAI: false, maxCallsPerRun: 12, maxTokensPerCall: 3000, shareExternal: false };
  }
  function can(perms, module, action) {
    var p = perms && perms.modules && perms.modules[module];
    return !!(p && p[action === 'write' ? 'write' : 'read']);
  }
  // the rules the maintenance agent will read before every run (editable by the user later; versioned like everything else)
  function defaultSchema() {
    return {
      id: 'schema', kind: 'meta', schemaVersion: SCHEMA_VERSION,
      naming: '页面标题用最常见的名字；别名写进 aliases；一个概念只有一页（同一 slug = 同一页）。',
      categories: ['概念 concept', '人物 person', '事件 event', '项目 project', '主题 topic', '方法 howto', '笔记 note'],
      updateRules: [
        '原始来源（Sources）写入后永不修改。',
        '用户锁定的页面和已确认（Confirmed）的决策，AI 只能提出建议，不能直接改。',
        '每次修改都留下版本；恢复旧版本 = 用旧内容写一个新版本。'
      ],
      citation: '每条关键事实（claim）至少引用一个来源：sourceId + 位置（页码或字符范围）+ 不超过 200 字的原文。',
      confidence: '0–1；没有来源的内容只能是 inference（推断），不能标成 fact。',
      conflicts: '两条说法互相矛盾时都保留，互相标 conflictsWith，交给用户决定；不自动删除任何一条。'
    };
  }

  // ------------------------------------------------------------------ validation
  function enumErr(errs, name, v, list) { if (list.indexOf(v) < 0) errs.push(name + ' 必须是 ' + list.join(' / ')); }
  function validate(kind, doc) {
    var errs = [];
    if (!KINDS[kind]) return ['未知类型 ' + kind];
    if (!isObj(doc)) return ['内容必须是对象'];
    if (!doc.id || typeof doc.id !== 'string') errs.push('缺少 id');
    else if (/[\/]/.test(doc.id) || doc.id.length > 200) errs.push('id 不能含 "/" 且不超过 200 字符');
    else if (KINDS[kind].prefix && doc.id.indexOf(KINDS[kind].prefix) !== 0) errs.push('id 必须以 ' + KINDS[kind].prefix + ' 开头');
    if (kind === 'page') {
      if (!doc.title || !String(doc.title).trim()) errs.push('页面需要标题');
      if (doc.type != null) enumErr(errs, 'type', doc.type, PAGE_TYPES);
      if (doc.markdown != null && typeof doc.markdown !== 'string') errs.push('markdown 必须是文本');
      if (doc.sourceIds != null && !(Array.isArray(doc.sourceIds) && doc.sourceIds.every(function (s) { return typeof s === 'string' && /^src_/.test(s); }))) errs.push('sourceIds 必须是来源 id 列表');
      (doc.claims || []).forEach(function (c, i) {
        if (!c || !c.text) errs.push('claims[' + i + '] 缺少 text');
        else if (c.kind === 'fact' && !(c.sources && c.sources.length)) errs.push('claims[' + i + '] 是 fact 却没有来源');
        if (c && c.origin != null) enumErr(errs, 'claims[' + i + '].origin', c.origin, ORIGINS);
      });
    }
    if (kind === 'source') {
      enumErr(errs, 'kind', doc.kind, SOURCE_KINDS);
      if (typeof doc.text !== 'string') errs.push('来源需要文本 text');
      if (!doc.contentHash) errs.push('来源需要 contentHash');
    }
    if (kind === 'relation') {
      if (!doc.from || !doc.to) errs.push('关系需要 from 和 to');
      enumErr(errs, 'type', doc.type, RELATION_TYPES);
      enumErr(errs, 'origin', doc.origin, ORIGINS);
      if (doc.status != null) enumErr(errs, 'status', doc.status, RELATION_STATUS.concat(['accepted']));
      if (doc.explanation != null && typeof doc.explanation !== 'string') errs.push('explanation 必须是文本');
      if (doc.confidence != null && !(typeof doc.confidence === 'number' && doc.confidence >= 0 && doc.confidence <= 1)) errs.push('confidence 必须在 0 和 1 之间');
    }
    if (kind === 'decision') {
      if (!doc.title || !String(doc.title).trim()) errs.push('决策需要标题');
      enumErr(errs, 'state', doc.state, DECISION_STATES);
    }
    if (kind === 'insight') {
      if (!doc.title || !String(doc.title).trim()) errs.push('洞察需要标题');
      enumErr(errs, 'status', doc.status, INSIGHT_STATUS);
      if (doc.mode != null) enumErr(errs, 'mode', doc.mode, INSIGHT_MODES);
      if (!(Array.isArray(doc.supportingNodeIds) && doc.supportingNodeIds.length && doc.supportingNodeIds.every(function (x) { return typeof x === 'string' && /^(pg_|dc_)/.test(x); }))) errs.push('洞察需要它所依据的知识页或决策');
      (doc.points || []).forEach(function (pt, i) {
        if (!pt || !pt.text) errs.push('points[' + i + '] 缺少 text');
        else if (POINT_KINDS.indexOf(pt.kind) < 0) errs.push('points[' + i + '].kind 必须是 ' + POINT_KINDS.join(' / '));
        else if (pt.kind === 'supported' && !((pt.claimIds || []).length + (pt.nodeIds || []).length)) errs.push('points[' + i + '] 标为有依据却没有引用');
      });
    }
    if (!errs.length && byteSize(doc) > MAX_DOC_BYTES) errs.push('内容超过 900 KB（Firestore 单个文档上限 1 MiB）');
    return errs;
  }

  // ------------------------------------------------------------------ the write gate
  /* current: what is stored now (null if nothing); next: the new content; actor: { type: 'user' | 'agent', id };
     opts: { baseRev (the revision the edit started from), reason, now }.
     → { ok: true, noop: true, doc } · { ok: true, doc, version } · { ok: false, code, error, current } */
  function planWrite(kind, current, next, actor, opts) {
    opts = opts || {};
    actor = actor || { type: 'user', id: 'me' };
    var now = opts.now || Date.now();
    var fail = function (code, error) { return { ok: false, code: code, error: error, current: current || null }; };
    if (actor.type !== 'user' && actor.type !== 'agent') return fail('actor', '未知的操作者');
    var doc = clone(next) || {};
    META_FIELDS.forEach(function (k) { delete doc[k]; });
    doc.kind = doc.kind || kind;
    if (kind === 'decision' && !doc.state) doc.state = 'Proposed';
    var errs = validate(kind, doc);
    if (errs.length) return fail('invalid', errs.join('；'));
    if (current && current.id !== doc.id) return fail('invalid', 'id 不一致');

    var baseRev = opts.baseRev;
    if (current && baseRev != null && baseRev !== current.rev) return fail('conflict', '这份内容在别处已经改到第 ' + current.rev + ' 版（你是从第 ' + baseRev + ' 版改起的）');
    if (!current && baseRev) return fail('conflict', '这份内容已不存在');

    if (kind === 'page') doc.links = parseLinks(doc.markdown).map(function (l) { return l.id; });
    if (kind === 'decision' && current) { doc.confirmedBy = current.confirmedBy; doc.confirmedAt = current.confirmedAt; if (doc.confirmedBy === undefined) delete doc.confirmedBy; if (doc.confirmedAt === undefined) delete doc.confirmedAt; }
    if (current && sameContent(current, doc)) return { ok: true, noop: true, doc: current };

    if (kind === 'source' && current) return fail('source-immutable', '原始来源写入后不能修改');
    if (kind === 'decision') {
      if (current && current.state === 'Confirmed' && actor.type !== 'user') return fail('confirmed-locked', '已确认的决策只能由你修改');
      if (actor.type !== 'user' && doc.state !== 'Proposed') return fail('agent-proposes-only', 'AI 只能提出 Proposed 状态的决策');
      if (doc.state === 'Confirmed' && !(current && current.state === 'Confirmed')) { doc.confirmedBy = actor.id || 'user'; doc.confirmedAt = now; }
      if (doc.state !== 'Confirmed') { delete doc.confirmedBy; delete doc.confirmedAt; }
      else if (current && current.state === 'Confirmed') { doc.confirmedBy = current.confirmedBy; doc.confirmedAt = current.confirmedAt; }
    }
    if (kind === 'relation' && actor.type !== 'user') {
      // AI (and every other module) can only suggest a link, and cannot touch one the user has confirmed or rejected
      if (doc.status !== 'suggested') return fail('agent-suggests-only', 'AI 只能提出待确认的关联');
      if (current && relationStatus(current) !== 'suggested') return fail('relation-decided', '这条关联你已经确认或否决过，AI 不能修改');
    }
    if (kind === 'insight' && actor.type !== 'user') {
      // AI (and the device's own synthesis) only writes drafts. One the user reviewed or confirmed is never written over;
      // a rejected one only when the knowledge it rests on has changed since.
      if (doc.status !== 'Draft') return fail('agent-drafts-only', 'AI 只能写出草稿状态的洞察');
      if (current && (current.status === 'Reviewed' || current.status === 'Confirmed')) return fail('insight-decided', '这条洞察你已经审阅或确认过，AI 不能覆盖');
      if (current && current.status === 'Rejected' && stable(current.seen || {}) === stable(doc.seen || {})) return fail('insight-rejected', '这条洞察你已经否决，它依据的内容没有变化，不再重复生成');
    }
    if (kind === 'page') {
      if (current && current.lockedBy === 'user' && actor.type !== 'user') return fail('page-locked', '这一页被你锁定了，AI 只能提建议');
      if (actor.type !== 'user' && (doc.lockedBy || null) !== ((current && current.lockedBy) || null)) return fail('page-locked', 'AI 不能改锁定状态');
    }

    var by = (actor.type === 'agent' ? 'agent:' : 'user:') + (actor.id || 'me');
    doc.rev = (current ? current.rev : 0) + 1;
    doc.createdAt = current ? current.createdAt : now;
    doc.createdBy = current ? current.createdBy : by;
    doc.updatedAt = now;
    doc.updatedBy = by;
    var version = { id: String(doc.rev), rev: doc.rev, at: now, by: by, reason: String(opts.reason || (current ? '修改' : '新建')).slice(0, 200), snapshot: clone(doc) };
    // where the change came from (an import run, a synthesis, another part of Minest); the previous state is the version before
    if (opts.source) version.source = String(opts.source).slice(0, 120);
    if (byteSize(version) > MAX_DOC_BYTES + 2000) return fail('invalid', '内容超过 900 KB（Firestore 单个文档上限 1 MiB）');
    return { ok: true, doc: doc, version: version };
  }

  // a restore writes the old content as a new revision; nothing in the history is ever rewritten
  function planRestore(kind, current, version, actor, opts) {
    if (!version || !version.snapshot) return { ok: false, code: 'invalid', error: '没有这个版本', current: current };
    var o = Object.assign({}, opts || {}, { baseRev: current ? current.rev : 0, reason: '恢复到第 ' + version.rev + ' 版' });
    return planWrite(kind, current, version.snapshot, actor, o);
  }

  // ------------------------------------------------------------------ Markdown
  function yamlValue(v) {
    if (v == null) return 'null';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'string') return /^[A-Za-z0-9_][A-Za-z0-9_ .:-]*$/.test(v) && !/^(true|false|null|yes|no|on|off|~)$/i.test(v) && !/:\s|\s$/.test(v) ? v : JSON.stringify(v);
    return JSON.stringify(v);
  }
  function frontMatter(o) {
    return '---\n' + Object.keys(o).filter(function (k) { return o[k] !== undefined; }).map(function (k) { return k + ': ' + yamlValue(o[k]); }).join('\n') + '\n---\n';
  }
  function iso(t) { try { return t ? new Date(t).toISOString() : undefined; } catch (e) { return undefined; } }
  function fileName(title, id) {
    var s = String(title || id || 'untitled').replace(/[\\\/:*?"<>|#^\[\]\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    return s || String(id);
  }
  function pageToMarkdown(page, ctx) {
    ctx = ctx || {};
    var titles = ctx.titles || {};
    var srcName = function (id) { var src = (ctx.sources || {})[id]; return (ctx.sourceFiles || {})[id] || (src ? fileName(src.title, src.id) : null); };
    var fm = frontMatter({ id: page.id, title: page.title, type: page.type || 'note', aliases: page.aliases || [], tags: page.tags || [],
      sources: (page.sourceIds || []).length ? page.sourceIds : undefined,
      rev: page.rev, created: iso(page.createdAt), updated: iso(page.updatedAt), locked: page.lockedBy === 'user' ? true : undefined });
    // [[pg_x|label]] → [[File Name|label]] so the links work between the exported files
    var body = String(page.markdown || '').replace(/\[\[([^\[\]|\n]+?)(\|[^\[\]\n]+?)?\]\]/g, function (all, t, label) {
      var id = /^pg_/.test(t.trim()) ? t.trim() : pageId(t);
      return titles[id] ? '[[' + fileName(titles[id], id) + (label || (t.trim() !== titles[id] ? '|' + t.trim() : '')) + ']]' : all;
    });
    var out = fm + '\n# ' + page.title + '\n\n' + body.trim() + '\n';
    if ((page.sourceIds || []).length) out += '\n## 来源 Sources\n\n' + page.sourceIds.map(function (id) { var n = srcName(id); return '- ' + (n ? '[[' + n + ']]' : id); }).join('\n') + '\n';
    var claims = page.claims || [];
    if (claims.length) {
      out += '\n## 关键说法 Claims\n\n';
      claims.forEach(function (c, i) {
        var refs = (c.sources || []).map(function (s, j) { return '[^c' + (i + 1) + '-' + (j + 1) + ']'; }).join('');
        out += '- ' + c.text + ' _(' + (c.kind || 'fact') + (c.origin ? ' · ' + c.origin : '') + (c.confidence != null ? ' · ' + c.confidence : '') + ')_' + refs + '\n';
      });
      out += '\n';
      claims.forEach(function (c, i) {
        (c.sources || []).forEach(function (s, j) {
          var n = srcName(s.sourceId);
          out += '[^c' + (i + 1) + '-' + (j + 1) + ']: ' + (n ? '[[' + n + ']]' : s.sourceId) + (s.span && s.span.page ? ' p.' + s.span.page : '') + (s.quote ? ' — “' + s.quote + '”' : '') + '\n';
        });
      });
    }
    return out;
  }
  function decisionToMarkdown(d) {
    var list = function (a) { return (a || []).filter(Boolean).map(function (x) { return '- ' + (typeof x === 'string' ? x : x.text || ''); }).join('\n') || '-'; };
    return frontMatter({ id: d.id, title: d.title, state: d.state, rev: d.rev, confirmedAt: iso(d.confirmedAt), supersededBy: d.supersededBy, updated: iso(d.updatedAt) }) +
      '\n# ' + d.title + '\n\n**状态 State:** ' + d.state + '\n\n## 需求 Requirement\n\n' + (d.requirement || '-') +
      '\n\n## 选项 Options\n\n' + list(d.options) + '\n\n## 决定 Decision\n\n' + (d.decision || '-') +
      '\n\n## 理由 Reasons\n\n' + list(d.reasons) + '\n\n## 待解决 Open questions\n\n' + list(d.openQuestions) + '\n';
  }
  function insightToMarkdown(n, ctx) {
    var titles = (ctx && ctx.titles) || {};
    var name = function (id) { return titles[id] ? '[[' + titles[id] + ']]' : id; };
    var pts = (n.points || []).map(function (pt) {
      return '- ' + pt.text + ' _(' + (pt.kind === 'supported' ? '有依据' : '假设 · 没有引用') + ')_' + ((pt.nodeIds || []).length ? ' — ' + pt.nodeIds.map(name).join('、') : '');
    }).join('\n');
    var ev = (n.evidence || []).map(function (e) { return '- ' + name(e.nodeId) + '：“' + e.quote + '”'; }).join('\n');
    var list = function (a) { return (a || []).filter(Boolean).map(function (x) { return '- ' + x; }).join('\n') || '-'; };
    return frontMatter({ id: n.id, title: n.title, status: n.status, mode: n.mode, origin: n.origin, engine: n.engine, rev: n.rev, created: iso(n.createdAt), updated: iso(n.updatedAt) }) +
      '\n# ' + n.title + '\n\n**状态 Status:** ' + n.status + ' · ' + (n.status === 'Confirmed' ? '你确认的洞察' : n.status === 'Reviewed' ? '你审阅过的推断' : 'AI / 本机的推断，不是事实') +
      '\n\n## 核心洞察 Core insight\n\n' + (n.insight || '-') + '\n\n## 依据的知识 Supporting knowledge\n\n' + list((n.supportingNodeIds || []).map(name)) +
      '\n\n## 推理 Reasoning\n\n' + (n.reasoning || '-') + '\n\n## 要点 Points\n\n' + (pts || '-') + '\n\n## 出处 Evidence\n\n' + (ev || '-') +
      '\n\n## 知识缺口 Gaps\n\n' + list(n.gaps) + '\n\n## 可以继续研究的问题 Questions\n\n' + list(n.questions) + '\n';
  }
  function sourceToMarkdown(s) {
    return frontMatter({ id: s.id, title: s.title, kind: s.kind, contentHash: s.contentHash, url: s.origin && s.origin.url, file: s.origin && s.origin.fileName, supersedes: s.supersedes, imported: iso(s.createdAt) }) +
      '\n# ' + (s.title || s.id) + '\n\n' + String(s.text || '') + '\n';
  }
  function parseMarkdown(text) {
    text = String(text || '').replace(/\r\n?/g, '\n');
    var meta = {}, body = text, m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
    if (m) {
      body = text.slice(m[0].length);
      m[1].split('\n').forEach(function (line) {
        var i = line.indexOf(':'); if (i <= 0) return;
        var k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
        try { meta[k] = JSON.parse(v); } catch (e) { meta[k] = v; }
      });
    }
    return { meta: meta, body: body };
  }

  // ------------------------------------------------------------------ .zip (stored, UTF-8 names)
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { var c = 0xffffffff; for (var i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(files, when) {
    var d = new Date(when || Date.now());
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = utf8Bytes(f.name), data = typeof f.data === 'string' ? utf8Bytes(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
      c.setUint32(38, 0, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true); e.setUint16(20, 0, true);
    var all = parts.concat(central, [new Uint8Array(e.buffer)]), size = all.reduce(function (n, p) { return n + p.length; }, 0);
    var out = new Uint8Array(size), at = 0;
    all.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  // every page, decision and source as its own file, with an index and a log (newest changes first)
  function exportFiles(data, when) {
    var pages = (data.pages || []).slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    var titles = {}, sources = {}, used = {};
    var unique = function (folder, title, id) { var n = fileName(title, id), k = folder + n.toLowerCase(), i = 2; while (used[k]) { n = fileName(title, id) + ' (' + i++ + ')'; k = folder + n.toLowerCase(); } used[k] = 1; return n; };
    var pageFile = {}, sourceFile = {};
    pages.forEach(function (p) { pageFile[p.id] = unique('pages/', p.title, p.id); titles[p.id] = pageFile[p.id]; });
    (data.sources || []).forEach(function (s) { sources[s.id] = s; sourceFile[s.id] = unique('sources/', s.title, s.id); });
    var files = [];
    pages.forEach(function (p) { files.push({ name: 'pages/' + pageFile[p.id] + '.md', data: pageToMarkdown(p, { titles: titles, sources: sources, sourceFiles: sourceFile }) }); });
    (data.decisions || []).forEach(function (d) { files.push({ name: 'decisions/' + unique('decisions/', d.title, d.id) + '.md', data: decisionToMarkdown(d) }); });
    (data.sources || []).forEach(function (s) { files.push({ name: 'sources/' + sourceFile[s.id] + '.md', data: sourceToMarkdown(s) }); });
    var nodeTitles = {}; Object.keys(titles).forEach(function (id) { nodeTitles[id] = titles[id]; });
    (data.decisions || []).forEach(function (d) { nodeTitles[d.id] = nodeTitles[d.id] || fileName(d.title, d.id); });
    (data.insights || []).forEach(function (n) { files.push({ name: 'insights/' + unique('insights/', n.title, n.id) + '.md', data: insightToMarkdown(n, { titles: nodeTitles }) }); });
    var index = '# Minest Living Knowledge\n\n导出时间 ' + new Date(when || Date.now()).toISOString() + '\n\n## 知识页 Pages (' + pages.length + ')\n\n' +
      (pages.map(function (p) { return '- [[' + pageFile[p.id] + ']] · ' + (p.type || 'note'); }).join('\n') || '-') +
      '\n\n## 决策 Decisions (' + (data.decisions || []).length + ')\n\n' + ((data.decisions || []).map(function (d) { return '- ' + d.title + ' · ' + d.state; }).join('\n') || '-') +
      '\n\n## 来源 Sources (' + (data.sources || []).length + ')\n\n' + ((data.sources || []).map(function (s) { return '- ' + (s.title || s.id) + ' · ' + s.kind; }).join('\n') || '-') + '\n';
    files.push({ name: 'index.md', data: index });
    var log = (data.log || []).slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 500)
      .map(function (v) { return '- ' + iso(v.at) + ' · ' + v.kind + ' · ' + (v.title || v.id) + ' · 第 ' + v.rev + ' 版 · ' + v.by + ' · ' + v.reason; }).join('\n');
    files.push({ name: 'log.md', data: '# 修改记录 Log\n\n' + (log || '-') + '\n' });
    files.push({ name: 'living-knowledge.json', data: JSON.stringify({ format: 'minest.living-knowledge/1', exportedAt: when || Date.now(), pages: data.pages || [], decisions: data.decisions || [], sources: data.sources || [], relations: data.relations || [], insights: data.insights || [] }, null, 1) });
    return files;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION, MAX_DOC_BYTES: MAX_DOC_BYTES, KINDS: KINDS, PAGE_TYPES: PAGE_TYPES, SOURCE_KINDS: SOURCE_KINDS,
    RELATION_TYPES: RELATION_TYPES, RELATION_STATUS: RELATION_STATUS, relationStatus: relationStatus, ORIGINS: ORIGINS, DECISION_STATES: DECISION_STATES, MODULES: MODULES,
    INSIGHT_STATUS: INSIGHT_STATUS, INSIGHT_MODES: INSIGHT_MODES, POINT_KINDS: POINT_KINDS, insightId: insightId, insightToMarkdown: insightToMarkdown,
    clone: clone, stable: stable, sameContent: sameContent, hash: hash, sha256Hex: sha256Hex, normalizeText: normalizeText, slug: slug,
    pageId: pageId, decisionId: decisionId, relationId: relationId, sourceId: sourceId, runId: runId, parseLinks: parseLinks,
    defaultPermissions: defaultPermissions, defaultSchema: defaultSchema, can: can, validate: validate, byteSize: byteSize,
    planWrite: planWrite, planRestore: planRestore,
    pageToMarkdown: pageToMarkdown, decisionToMarkdown: decisionToMarkdown, sourceToMarkdown: sourceToMarkdown, parseMarkdown: parseMarkdown,
    fileName: fileName, crc32: crc32, zip: zip, exportFiles: exportFiles
  };
});
