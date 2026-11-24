// Minest Living Knowledge → this graph. The graph only reads: pages, decisions, sources and relations become nodes and
// edges; nothing is written back here (opening or creating a page is asked of the Living Knowledge page).
//   · inside Living Knowledge (an iframe): the page sends its data with postMessage { type: 'lk-graph-data', data }
//   · opened by itself: the same data read straight from this site's IndexedDB 'minest.lk.v1:<account>'
import { KnowledgeNode, KnowledgeEdge, KnowledgeType, GraphGroupRule, RelationshipType } from '../types/graph';

export interface LKData { pages: any[]; decisions: any[]; sources: any[]; relations: any[] }

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
  { id: 'g-unresolved', label: '待创建的链接', query: 'type:unresolved', color: '#64748B', enabled: true },
];

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

export function toGraph(d: LKData): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
  const src: Record<string, any> = {}; (d.sources || []).forEach((s) => { src[s.id] = s; });
  const nodes: KnowledgeNode[] = [], edges: KnowledgeEdge[] = [], have = new Set<string>(), edgeIds = new Set<string>();
  const ref = (sid: string, quote?: string) => {
    const s = src[sid];
    return { docId: sid, path: s ? (s.origin && (s.origin.url || s.origin.fileName)) || s.title : sid, section: s ? s.title : undefined,
      snippet: quote || (s ? String(s.text || '').slice(0, 160) : ''), updatedAt: s ? iso(s.createdAt).slice(0, 10) : '' };
  };
  (d.pages || []).forEach((p) => {
    have.add(p.id);
    const refs: any[] = []; const seen = new Set<string>();
    (p.claims || []).forEach((c: any) => (c.sources || []).forEach((s: any) => { if (!seen.has(s.sourceId + s.quote)) { seen.add(s.sourceId + s.quote); refs.push(ref(s.sourceId, s.quote)); } }));
    (p.sourceIds || []).forEach((id: string) => { if (!refs.some((r) => r.docId === id)) refs.push(ref(id)); });
    const claims = (p.claims || []).map((c: any) => '- ' + c.text + (c.origin === 'ai_inferred' ? '（AI 推断）' : '')).join('\n');
    const content = '# ' + p.title + '\n\n' + (p.markdown || '') + (claims ? '\n\n## 关键说法\n\n' + claims : '');
    nodes.push({ id: p.id, title: p.title, type: (p.type === 'concept' ? 'concept' : 'page') as KnowledgeType, tags: (p.tags || []).map((t: string) => '#' + String(t).replace(/^#/, '')),
      group: p.type || 'note', size: 5 + Math.min(6, (p.claims || []).length), resolved: true,
      metadata: { summary: String(p.markdown || '').replace(/[#*`>\[\]]/g, '').trim().slice(0, 160), content, author: p.updatedBy || '', updatedAt: iso(p.updatedAt), folder: '知识页',
        wordCount: words(p.markdown), status: (p.claims || []).some((c: any) => c.origin === 'verified') ? 'verified' : 'draft' },
      sourceReferences: refs });
  });
  (d.decisions || []).forEach((x) => {
    have.add(x.id);
    const body = [x.requirement, x.decision].concat(x.reasons || [], x.openQuestions || []).filter(Boolean).join('\n');
    nodes.push({ id: x.id, title: x.title, type: 'decision', tags: ['#' + (x.state || 'Proposed')], group: 'decision', size: x.state === 'Confirmed' ? 8 : 6, resolved: true,
      metadata: { summary: String(x.decision || x.requirement || '').slice(0, 160), content: '# ' + x.title + '\n\n**状态：** ' + x.state + '\n\n' + body, author: x.updatedBy || '',
        updatedAt: iso(x.updatedAt), folder: '决策', wordCount: words(body), status: x.state === 'Confirmed' ? 'accepted-adr' : 'draft' }, sourceReferences: [] });
  });
  const edge = (from: string, to: string, type: RelationshipType, verified: boolean, quote: string, by: any, sourceDocId: string) => {
    const id = 'e:' + from + '>' + to + ':' + type; if (edgeIds.has(id) || from === to) return; edgeIds.add(id);
    edges.push({ id, source: from, target: to, relationshipType: type, weight: verified ? 1 : 0.8, verified,
      evidenceReferences: [{ sourceDocId, quote, confidence: verified ? 1 : 0.8, verified, extractedBy: by }] });
  };
  const linkFrom = (fromId: string, md: string, type: RelationshipType) => links(md).forEach((l) => {
    if (!have.has(l.id)) {      // a [[link]] to a page that does not exist yet
      have.add(l.id);
      nodes.push({ id: l.id, title: l.title, type: 'unresolved', tags: [], group: 'unresolved', size: 3, resolved: false,
        metadata: { summary: '还没有这一页 —— 在活知识里点它就能新建', content: '', author: '', updatedAt: '', folder: '待创建', wordCount: 0, status: 'unresolved-stub' }, sourceReferences: [] });
    }
    edge(fromId, l.id, type, true, '[[' + l.title + ']]', 'markdown-parser', fromId);
  });
  (d.pages || []).forEach((p) => linkFrom(p.id, p.markdown, 'markdown-link'));
  (d.decisions || []).forEach((x) => linkFrom(x.id, [x.requirement, x.decision].concat(x.reasons || []).join('\n'), 'project-decision'));
  (d.relations || []).forEach((r) => {
    if (!have.has(r.from) || !have.has(r.to)) return;
    const ai = r.origin === 'ai_inferred', ev = (r.evidence || [])[0];
    const type: RelationshipType = ai ? 'ai-extracted' : r.type === 'project_decision' ? 'project-decision' : r.origin === 'user' ? 'user-manual' : 'wiki-relation';
    edge(r.from, r.to, type, !ai, ev ? ev.quote : r.type, ai ? 'living-knowledge-ai' : 'wiki-engine', ev ? ev.sourceId : r.id);
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
      const db = r.result, out: LKData = { pages: [], decisions: [], sources: [], relations: [] };
      try {
        const t = db.transaction('kv', 'readonly'), q = t.objectStore('kv').openCursor(IDBKeyRange.bound('d|', 'd|￿'));
        q.onsuccess = () => {
          const c = q.result; if (!c) return;
          const k = String(c.key).split('|')[1], v = c.value;
          if (k === 'page') out.pages.push(v); else if (k === 'decision') out.decisions.push(v); else if (k === 'source') out.sources.push(v); else if (k === 'relation') out.relations.push(v);
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
export function askHost(type: 'lk-open' | 'lk-new', payload: Record<string, any>): boolean {
  if (!EMBEDDED) return false;
  window.parent.postMessage(Object.assign({ type }, payload), location.origin);
  return true;
}
