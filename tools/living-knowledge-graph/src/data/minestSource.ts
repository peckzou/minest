// Minest Living Knowledge → this graph. The graph only reads: pages, decisions, insights and relations become nodes and
// edges; nothing is written here. Opening or creating a page, confirming or rejecting a link and starting a synthesis
// are asked of the Living Knowledge page, which writes through its own gate.
//   · inside Living Knowledge (an iframe): the page sends its data with postMessage { type: 'lk-graph-data', data }
//   · opened by itself: the same data read straight from this site's IndexedDB 'minest.lk.v1:<account>'
// Semantic Linking: every relation keeps its type, its status and its reason. A confirmed one is a solid line, a
// suggested one a dashed line; a rejected one is not drawn.
// Time travel: toGraph(d, { at, from }) rebuilds the graph as it was at a moment, only from what was saved — when each
// thing was created, and the versions kept on this device (a decision's state, a link's status, an insight's status).
// Nothing is guessed: a [[link]] is read from the page as it is now, because the text of older versions is not sent.
import { KnowledgeNode, KnowledgeEdge, KnowledgeType, GraphGroupRule, RelationshipType } from '../types/graph';

export interface LKEvent { rev: number; at: number; by?: string; state?: string }
export interface LKHistory { page?: Record<string, LKEvent[]>; decision?: Record<string, LKEvent[]>; relation?: Record<string, LKEvent[]>; insight?: Record<string, LKEvent[]> }
export interface LKData { pages: any[]; decisions: any[]; sources: any[]; relations: any[]; insights?: any[]; history?: LKHistory }
export interface TimeWindow { at: number; from: number }

export const EMBEDDED = typeof window !== 'undefined' && window.parent !== window;

export const MINEST_GROUP_RULES: GraphGroupRule[] = [
  { id: 'g-concept', label: '概念', query: 'group:concept', color: '#8B7CF6', enabled: true },
  { id: 'g-person', label: '人物', query: 'group:person', color: '#F472B6', enabled: true },
  { id: 'g-event', label: '事件', query: 'group:event', color: '#FB923C', enabled: true },
  { id: 'g-project', label: '项目', query: 'group:project', color: '#38BDF8', enabled: true },
  { id: 'g-topic', label: '主题', query: 'group:topic', color: '#22D3EE', enabled: true },
  { id: 'g-howto', label: '方法', query: 'group:howto', color: '#34D399', enabled: true },
  { id: 'g-note', label: '笔记', query: 'group:note', color: '#A3A3F5', enabled: true },
  { id: 'g-decision', label: '决策', query: 'type:decision', color: '#F59E0B', enabled: true },
  { id: 'g-insight', label: '洞察', query: 'type:insight', color: '#FACC15', enabled: true },
  { id: 'g-unresolved', label: '待创建的链接', query: 'type:unresolved', color: '#64748B', enabled: true },
];

// the kinds of relation Living Knowledge keeps, each with its own colour in the graph
export const REL_TYPE_META: Record<string, { label: string; colorDark: string; colorLight: string }> = {
  related: { label: '相关', colorDark: '#94A3B8', colorLight: '#64748B' },
  part_of: { label: '是…的一部分', colorDark: '#38BDF8', colorLight: '#0284C7' },
  supports: { label: '支持', colorDark: '#34D399', colorLight: '#059669' },
  contradicts: { label: '反驳', colorDark: '#F87171', colorLight: '#DC2626' },
  derived_from: { label: '来自', colorDark: '#C084FC', colorLight: '#9333EA' },
  applied_to: { label: '应用于', colorDark: '#FBBF24', colorLight: '#B45309' },
  evolved_from: { label: '演变自', colorDark: '#F472B6', colorLight: '#DB2777' },
  person_event: { label: '人物—事件', colorDark: '#FB923C', colorLight: '#C2410C' },
  project_decision: { label: '项目—决策', colorDark: '#F59E0B', colorLight: '#D97706' },
  topic_point: { label: '主题—要点', colorDark: '#22D3EE', colorLight: '#0891B2' },
};
export const relStatus = (r: any): 'suggested' | 'confirmed' | 'rejected' => (r && (r.status === 'suggested' || r.status === 'rejected') ? r.status : 'confirmed');

const slug = (s: string) => String(s || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9぀-ヿ㐀-鿿가-힯]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const pageId = (t: string) => (/^pg_/.test(t) ? t : 'pg_' + (slug(t) || t));
const iso = (t?: number) => (t ? new Date(t).toISOString().slice(0, 16).replace('T', ' ') : '');
const links = (md: string) => {
  const out: { id: string; title: string }[] = [];
  const re = /\[\[([^\[\]|\n]+?)(?:\|[^\[\]\n]+?)?\]\]/g; let m: RegExpExecArray | null;
  while ((m = re.exec(String(md || '')))) out.push({ id: pageId(m[1].trim()), title: m[1].trim() });
  return out;
};
const words = (s: string) => (String(s || '').match(/[㐀-鿿]|[A-Za-z0-9]+/g) || []).length;

// the last recorded state at or before a moment; undefined when nothing was recorded by then
function stateAt(events: LKEvent[] | undefined, at: number): string | undefined {
  let best: LKEvent | null = null;
  (events || []).forEach((e) => { if (e.at <= at && (!best || e.rev > best.rev)) best = e; });
  return best ? (best as LKEvent).state : undefined;
}
const touched = (events: LKEvent[] | undefined, w: TimeWindow) => (events || []).some((e) => e.rev > 1 && e.at > w.from && e.at <= w.at);

/* Every moment something was saved, oldest first: creations and the versions kept on this device. Saves within
   30 seconds of the first one are one step (an import writes many documents at once). The last step is "now". */
export function timeSteps(d: LKData): number[] {
  const ts: number[] = [];
  const add = (t: any) => { if (typeof t === 'number' && t > 0) ts.push(t); };
  [d.pages, d.decisions, d.relations, d.insights || []].forEach((list) => (list || []).forEach((x: any) => add(x.createdAt)));
  const h = d.history || {};
  [h.page, h.decision, h.relation, h.insight].forEach((m) => Object.keys(m || {}).forEach((id) => (m as any)[id].forEach((e: LKEvent) => add(e.at))));
  ts.sort((a, b) => a - b);
  const steps: number[] = [];
  let began = 0;
  ts.forEach((t) => { if (steps.length && t - began < 30000) steps[steps.length - 1] = t; else { steps.push(t); began = t; } });
  return steps;
}

export function toGraph(d: LKData, w?: TimeWindow | null): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
  const at = w ? w.at : Infinity, h = d.history || {};
  const born = (x: any) => !w || (x.createdAt || 0) <= at;
  const mark = (x: any, events?: LKEvent[]): 'new' | 'changed' | undefined => {
    if (!w) return undefined;
    if ((x.createdAt || 0) > w.from) return 'new';
    return touched(events, w) ? 'changed' : undefined;
  };
  const src: Record<string, any> = {}; (d.sources || []).forEach((s) => { src[s.id] = s; });
  const nodes: KnowledgeNode[] = [], edges: KnowledgeEdge[] = [], have = new Set<string>(), edgeIds = new Set<string>(), titles: Record<string, string> = {};
  const ref = (sid: string, quote?: string) => {
    const s = src[sid];
    return { docId: sid, path: s ? (s.origin && (s.origin.url || s.origin.fileName)) || s.title : sid, section: s ? s.title : undefined,
      snippet: quote || (s ? String(s.text || '').slice(0, 160) : ''), updatedAt: s ? iso(s.createdAt).slice(0, 10) : '' };
  };
  (d.pages || []).filter(born).forEach((p) => {
    have.add(p.id); titles[p.id] = p.title;
    const refs: any[] = []; const seen = new Set<string>();
    (p.claims || []).forEach((c: any) => (c.sources || []).forEach((s: any) => { if (!seen.has(s.sourceId + s.quote)) { seen.add(s.sourceId + s.quote); refs.push(ref(s.sourceId, s.quote)); } }));
    (p.sourceIds || []).forEach((id: string) => { if (!refs.some((r) => r.docId === id)) refs.push(ref(id)); });
    const claims = (p.claims || []).map((c: any) => '- ' + c.text + (c.origin === 'ai_inferred' ? '（AI 推断）' : '')).join('\n');
    const content = '# ' + p.title + '\n\n' + (p.markdown || '') + (claims ? '\n\n## 关键说法\n\n' + claims : '');
    nodes.push({ id: p.id, title: p.title, type: (p.type === 'concept' ? 'concept' : 'page') as KnowledgeType, tags: (p.tags || []).map((t: string) => '#' + String(t).replace(/^#/, '')),
      group: p.type || 'note', size: 5 + Math.min(6, (p.claims || []).length), resolved: true, createdAt: p.createdAt, mark: mark(p, h.page && h.page[p.id]),
      metadata: { summary: String(p.markdown || '').replace(/[#*`>\[\]]/g, '').trim().slice(0, 160), content, author: p.updatedBy || '', updatedAt: iso(p.updatedAt), folder: '知识页',
        wordCount: words(p.markdown), status: (p.claims || []).some((c: any) => c.origin === 'verified') ? 'verified' : 'draft' },
      sourceReferences: refs });
  });
  (d.decisions || []).filter(born).forEach((x) => {
    have.add(x.id); titles[x.id] = x.title;
    const ev = h.decision && h.decision[x.id], state = (w && stateAt(ev, at)) || x.state || 'Proposed';
    const body = [x.requirement, x.decision].concat(x.reasons || [], x.openQuestions || []).filter(Boolean).join('\n');
    nodes.push({ id: x.id, title: x.title, type: 'decision', tags: ['#' + state], group: 'decision', size: state === 'Confirmed' ? 8 : 6, resolved: true,
      createdAt: x.createdAt, mark: mark(x, ev), faded: state === 'Superseded' || state === 'Rejected', stateLabel: state,
      metadata: { summary: String(x.decision || x.requirement || '').slice(0, 160), content: '# ' + x.title + '\n\n**状态：** ' + state + '\n\n' + body, author: x.updatedBy || '',
        updatedAt: iso(x.updatedAt), folder: '决策', wordCount: words(body), status: state === 'Confirmed' ? 'accepted-adr' : 'draft' }, sourceReferences: [] });
  });
  const edge = (from: string, to: string, type: RelationshipType, verified: boolean, quote: string, by: any, sourceDocId: string, extra?: Partial<KnowledgeEdge>) => {
    const id = 'e:' + from + '>' + to + ':' + (extra && extra.relationType ? extra.relationType : type); if (edgeIds.has(id) || from === to) return; edgeIds.add(id);
    edges.push(Object.assign({ id, source: from, target: to, relationshipType: type, weight: verified ? 1 : 0.8, verified,
      evidenceReferences: [{ sourceDocId, quote, confidence: verified ? 1 : 0.8, verified, extractedBy: by }] }, extra || {}) as KnowledgeEdge);
  };
  // an insight is a node of its own, tied to the nodes it was synthesised from; a draft is drawn hollow, a rejected one not at all
  (d.insights || []).filter(born).forEach((n) => {
    const ev = h.insight && h.insight[n.id], status = (w && stateAt(ev, at)) || n.status || 'Draft';
    if (status === 'Rejected') return;
    have.add(n.id); titles[n.id] = n.title;
    const pts = (n.points || []).map((p: any) => '- ' + p.text + (p.kind === 'supported' ? '' : '（假设）')).join('\n');
    nodes.push({ id: n.id, title: n.title, type: 'insight', tags: ['#' + status], group: 'insight', size: status === 'Confirmed' ? 9 : 7, resolved: true, draft: status === 'Draft',
      createdAt: n.createdAt, mark: mark(n, ev), stateLabel: status,
      metadata: { summary: String(n.insight || '').slice(0, 160), content: '# ' + n.title + '\n\n**状态：** ' + status + '（综合得出的推断，不是事实）\n\n' + (n.insight || '') + (pts ? '\n\n## 要点\n\n' + pts : ''),
        author: n.updatedBy || '', updatedAt: iso(n.updatedAt), folder: '洞察', wordCount: words(n.insight), status: status === 'Confirmed' ? 'verified' : 'draft' }, sourceReferences: [] });
  });
  (d.insights || []).forEach((n) => {
    if (!have.has(n.id)) return;
    (n.supportingNodeIds || []).forEach((sid: string) => { if (have.has(sid)) edge(n.id, sid, 'wiki-relation', true, '这条洞察综合自这里', 'wiki-engine', n.id,
      { relationType: 'derived_from', status: 'confirmed', explanation: '“' + n.title + '”是从这里的说法综合出来的。', createdAt: n.createdAt, fixed: true, mark: w && (n.createdAt || 0) > w.from ? 'new' : undefined }); });
    (n.relatedIds || []).forEach((sid: string) => { if (have.has(sid)) edge(n.id, sid, 'user-manual', true, '你把这条洞察连到了这里', 'human-author', n.id,
      { relationType: 'related', status: 'confirmed', explanation: '你在洞察卡里把它们连在了一起。', fixed: true }); });
  });
  const linkFrom = (fromId: string, md: string, type: RelationshipType) => { if (have.has(fromId)) links(md).forEach((l) => {
    if (!have.has(l.id)) {
      // a [[link]] to a page that does not exist yet — or, in time travel, to a page that was written later
      if (w && (d.pages || []).some((p) => p.id === l.id)) return;
      have.add(l.id); titles[l.id] = l.title;
      nodes.push({ id: l.id, title: l.title, type: 'unresolved', tags: [], group: 'unresolved', size: 3, resolved: false,
        metadata: { summary: '还没有这一页 —— 在活知识里点它就能新建', content: '', author: '', updatedAt: '', folder: '待创建', wordCount: 0, status: 'unresolved-stub' }, sourceReferences: [] });
    }
    edge(fromId, l.id, type, true, '[[' + l.title + ']]', 'markdown-parser', fromId, { fixed: true, explanation: '“' + (titles[fromId] || fromId) + '”的正文里写了 [[' + l.title + ']]。' });
  }); };
  (d.pages || []).forEach((p) => linkFrom(p.id, p.markdown, 'markdown-link'));
  (d.decisions || []).forEach((x) => linkFrom(x.id, [x.requirement, x.decision].concat(x.reasons || []).join('\n'), 'project-decision'));
  (d.relations || []).filter(born).forEach((r) => {
    if (!have.has(r.from) || !have.has(r.to)) return;
    const ev = h.relation && h.relation[r.id];
    // the status at that moment: from the versions kept here; without them, from when it was decided
    let st: string = relStatus(r);
    if (w) st = stateAt(ev, at) || (r.decidedAt && at < r.decidedAt ? 'suggested' : st);
    if (st === 'rejected') return;
    const ai = r.origin === 'ai_inferred', first = (r.evidence || [])[0];
    const type: RelationshipType = st === 'suggested' || (ai && !r.explanation) ? 'ai-extracted' : r.type === 'project_decision' ? 'project-decision' : r.origin === 'user' || ai ? 'user-manual' : 'wiki-relation';
    const quotes = (r.evidence || []).filter((e: any) => e && e.quote).slice(0, 4).map((e: any) => ({ nodeId: e.pageId || '', title: e.pageId ? titles[e.pageId] || '' : e.sourceId && src[e.sourceId] ? src[e.sourceId].title || '原文' : '原文', quote: String(e.quote) }));
    const changed = w ? (r.createdAt || 0) > w.from || touched(ev, w) || (!!r.decidedAt && r.decidedAt > w.from && r.decidedAt <= at) : false;
    edge(r.from, r.to, type, st === 'confirmed' && !(ai && !r.explanation), first ? first.quote : r.explanation || r.type, ai ? 'living-knowledge-ai' : 'wiki-engine', first ? first.sourceId || first.pageId || r.id : r.id,
      { relationType: r.type, status: st as 'confirmed' | 'suggested', explanation: r.explanation || '', relationId: r.id, confidence: typeof r.confidence === 'number' ? r.confidence : undefined,
        createdAt: r.createdAt, quotes, engine: r.engine, downgraded: !!r.downgraded, aiFound: ai, mark: changed ? 'new' : undefined, weight: st === 'confirmed' ? 1 : 0.6 });
  });
  return { nodes, edges };
}

// ---------------------------------------------------------------- reading the store by itself (the graph opened on its own)
function idbAll(name: string): Promise<LKData | null> {
  return new Promise((ok) => {
    if (typeof indexedDB === 'undefined') return ok(null);
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
    r.onerror = () => ok(null);
    r.onsuccess = () => {
      const db = r.result, out: LKData = { pages: [], decisions: [], sources: [], relations: [], insights: [], history: { page: {}, decision: {}, relation: {}, insight: {} } };
      try {
        const t = db.transaction('kv', 'readonly'), store = t.objectStore('kv');
        const q = store.openCursor(IDBKeyRange.bound('d|', 'd|￿'));
        q.onsuccess = () => {
          const c = q.result; if (!c) return;
          const k = String(c.key).split('|')[1], v = c.value;
          if (k === 'page') out.pages.push(v); else if (k === 'decision') out.decisions.push(v); else if (k === 'source') out.sources.push(v); else if (k === 'relation') out.relations.push(v);
          else if (k === 'insight') out.insights!.push(v);
          c.continue();
        };
        const qv = store.openCursor(IDBKeyRange.bound('v|', 'v|￿'));
        qv.onsuccess = () => {
          const c = qv.result; if (!c) return;
          const k = String(c.key).split('|')[1], v = c.value, s = v && v.snapshot, m = (out.history as any)[k];
          if (m && s && s.id) (m[s.id] = m[s.id] || []).push({ rev: v.rev, at: v.at, by: v.by, state: k === 'decision' ? s.state : k === 'relation' ? relStatus(s) : k === 'insight' ? s.status : undefined });
          c.continue();
        };
        t.oncomplete = () => { db.close(); ok(out); };
        t.onerror = () => { db.close(); ok(null); };
      } catch (e) { db.close(); ok(null); }
    };
  });
}
export function readOwnStore(): Promise<LKData | null> {
  let ns = 'guest'; try { ns = localStorage.getItem('minest.lk.lastUid') || 'guest'; } catch (e) {}
  return idbAll('minest.lk.v1:' + ns);
}

// ---------------------------------------------------------------- talking to the Living Knowledge page
export function onHostData(fn: (d: LKData) => void): () => void {
  const h = (e: MessageEvent) => { const m = e.data; if (e.source === window.parent && m && m.type === 'lk-graph-data' && m.data) fn(m.data); };
  window.addEventListener('message', h);
  if (EMBEDDED) window.parent.postMessage({ type: 'lk-graph-ready' }, location.origin);
  return () => window.removeEventListener('message', h);
}
export function askHost(type: 'lk-open' | 'lk-new' | 'lk-link-decide' | 'lk-synthesize', payload: Record<string, any>): boolean {
  if (!EMBEDDED) return false;
  window.parent.postMessage(Object.assign({ type }, payload), location.origin);
  return true;
}
