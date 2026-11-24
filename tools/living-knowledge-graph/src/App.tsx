// Minest Living Knowledge · 知识图谱 — an Obsidian-style graph view of the user's own knowledge.
// The canvas fills the frame; around it only what Obsidian has: search, global / local graph, the graph settings
// (filters, groups, display, forces), zoom, and Minest's 全息操作台 overlay. Data comes from Living Knowledge
// (src/data/minestSource.ts); a double click opens the real page there.
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Crosshair, Sun, Moon, Plus, Search, Settings2, Sparkles, FileText, Network, X } from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge, GraphFilterConfig, GraphGroupRule, GraphDisplayConfig, GraphForceConfig, GraphScopeMode } from './types/graph';
import { getInitialLivingKnowledgeData } from './data/livingKnowledgeData';
import { computeActiveGraph, getEdgeEndpointIds, computeTopologicalInsights } from './utils/graphAlgorithms';
import { GraphCanvas, GraphCanvasHandle } from './components/GraphCanvas';
import { GraphControlsPanel } from './components/GraphControlsPanel';
import { KnowledgeReaderModal } from './components/KnowledgeReaderModal';
import { EMBEDDED, MINEST_GROUP_RULES, toGraph, readOwnStore, onHostData, askHost, LKData } from './data/minestSource';

const PREFS = 'minest_lk_graph_prefs_v2';
const DEFAULT_FILTERS: GraphFilterConfig = {
  searchQuery: '', selectedTags: [], selectedTypes: ['page', 'wiki', 'concept', 'decision', 'unresolved'],
  selectedRelationships: ['markdown-link', 'wiki-relation', 'project-decision', 'user-manual', 'ai-extracted'],
  showUnresolved: true, showOrphans: true, showAIInferred: true, onlyVerifiedLinks: false,
};
const DEFAULT_DISPLAY: GraphDisplayConfig = { nodeSizeMultiplier: 1, linkThicknessMultiplier: 1, textFadeThreshold: 0.75, colorOpacity: 0.92, showArrows: false, animatePhysics: true, distinguishAIEgesDashed: true };
const DEFAULT_FORCES: GraphForceConfig = { centerForce: 0.35, repelForce: 190, linkForce: 0.75, linkDistance: 85, collisionRadius: 1.2, damping: 0.45 };

function readPrefs(): any { try { return JSON.parse(localStorage.getItem(PREFS) || 'null'); } catch { return null; } }

function IconButton(p: { title: string; onClick: () => void; active?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" title={p.title} aria-label={p.title} aria-pressed={p.active} onClick={p.onClick}
      className={`og-btn ${p.active ? 'on' : ''} ${p.className || ''}`}>{p.children}</button>
  );
}

export default function App() {
  const saved = useMemo(readPrefs, []);
  const [isDark, setIsDark] = useState<boolean>(saved?.isDark ?? true);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark]);

  // ---- data: the user's Living Knowledge; the example library only while theirs is empty
  const sample = useMemo(() => getInitialLivingKnowledgeData(), []);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [source, setSource] = useState<'loading' | 'mine' | 'sample'>('loading');
  const [localCenterId, setLocalCenterId] = useState<string>('');
  useEffect(() => {
    const apply = (d: LKData | null) => {
      const g = d ? toGraph(d) : { nodes: [], edges: [] };
      const use = g.nodes.length ? g : sample;
      setNodes(use.nodes); setEdges(use.edges); setSource(g.nodes.length ? 'mine' : 'sample');
      setLocalCenterId((c) => (use.nodes.some((n) => n.id === c) ? c : use.nodes[0]?.id || ''));
    };
    const off = onHostData(apply);
    if (!EMBEDDED) {
      readOwnStore().then(apply);
      const vis = () => { if (document.visibilityState === 'visible') readOwnStore().then(apply); };
      document.addEventListener('visibilitychange', vis);
      return () => { off(); document.removeEventListener('visibilitychange', vis); };
    }
    return off;
  }, [sample]);

  // ---- graph settings (Obsidian: filters · groups · display · forces), kept on this device
  const [filters, setFilters] = useState<GraphFilterConfig>(saved?.filters || DEFAULT_FILTERS);
  const [groupRules, setGroupRules] = useState<GraphGroupRule[]>(saved?.groupRules || MINEST_GROUP_RULES);
  const [display, setDisplay] = useState<GraphDisplayConfig>(saved?.display || DEFAULT_DISPLAY);
  const [forces, setForces] = useState<GraphForceConfig>(saved?.forces || DEFAULT_FORCES);
  const [holo, setHolo] = useState<boolean>(saved?.holo ?? false);
  useEffect(() => { document.documentElement.classList.toggle('holo', holo); }, [holo]);
  useEffect(() => {
    try { localStorage.setItem(PREFS, JSON.stringify({ filters: { ...filters, searchQuery: '' }, groupRules, display, forces, holo, isDark })); } catch {}
  }, [filters, groupRules, display, forces, holo, isDark]);

  const [scope, setScope] = useState<GraphScopeMode>('global');
  const [depth, setDepth] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readerNode, setReaderNode] = useState<KnowledgeNode | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const canvas = useRef<GraphCanvasHandle | null>(null);
  const shell = useRef<HTMLDivElement | null>(null);

  const tags = useMemo(() => Array.from(new Set(nodes.flatMap((n) => n.tags))).sort(), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n] as [string, KnowledgeNode])), [nodes]);
  const graph = useMemo(() => computeActiveGraph(nodes, edges, filters, groupRules, scope, localCenterId || null, depth), [nodes, edges, filters, groupRules, scope, localCenterId, depth]);
  const insights = useMemo(() => computeTopologicalInsights(graph.nodes, graph.edges, graph.adjacencyMap, graph.degreeMap), [graph]);
  const selected = selectedId ? byId.get(selectedId) || null : null;

  const open = useCallback((id: string) => {
    const n = byId.get(id); if (!n) return;
    setSelectedId(id);
    if (source === 'mine' && askHost('lk-open', { id, title: n.title, kind: n.type })) return;
    setReaderNode(n);
  }, [byId, source]);
  const toLocal = useCallback((id: string) => { setLocalCenterId(id); setScope('local'); setSelectedId(id); }, []);
  const newPage = () => { if (!askHost('lk-new', { title: '' })) setSettingsOpen(true); };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { shell.current?.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {}); }
    else { document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {}); }
  };
  const resetAll = () => { setFilters(DEFAULT_FILTERS); setGroupRules(MINEST_GROUP_RULES); setDisplay(DEFAULT_DISPLAY); setForces(DEFAULT_FORCES); canvas.current?.resetCamera(); };

  const notes = graph.nodes.filter((n) => n.type !== 'unresolved').length;
  return (
    <div ref={shell} className="og-shell">
      {source === 'sample' && <div className="og-sample">这是示例知识库 —— 你的活知识里还没有知识页。加一些内容后，这里会换成你自己的。</div>}
      <main className="og-stage">
        <GraphCanvas ref={canvas} nodes={graph.nodes} edges={graph.edges} adjacencyMap={graph.adjacencyMap} incidentEdgesMap={graph.incidentEdgesMap}
          degreeMap={graph.degreeMap} centralityMap={insights.centralityMap} structuralGaps={[]} predictedLinks={[]} groupRules={groupRules}
          displayConfig={display} forceConfig={forces} visualMode="obsidian-native" selectedNodeId={selectedId} hoveredNodeId={hoveredId}
          localCenterId={localCenterId || null} scopeMode={scope} isDark={isDark} onSelectNode={setSelectedId} onHoverNode={setHoveredId} onDoubleClickNode={open} />

        {holo && (
          <div className="holo-overlay" aria-hidden="true">
            <div className="holo-grid" /><div className="holo-scan" /><div className="holo-vignette" />
            <span className="holo-corner tl" /><span className="holo-corner tr" /><span className="holo-corner bl" /><span className="holo-corner br" />
            <div className="holo-hud top">MINEST · HOLOGRAPHIC CONSOLE · 全息操作台</div>
            <div className="holo-hud bottom">{graph.nodes.length} NODES · {graph.edges.length} LINKS</div>
          </div>
        )}

        {/* top left: search · global / local */}
        <div className="og-bar og-tl">
          <label className="og-search">
            <Search className="w-3.5 h-3.5" />
            <input type="search" placeholder="搜索笔记…" value={filters.searchQuery} aria-label="搜索笔记"
              onChange={(e) => { const v = e.target.value; setFilters((f) => ({ ...f, searchQuery: v })); }} />
          </label>
          <div className="og-seg" role="group" aria-label="范围">
            <button type="button" className={scope === 'global' ? 'on' : ''} onClick={() => setScope('global')}>全局</button>
            <button type="button" className={scope === 'local' ? 'on' : ''} onClick={() => { if (selectedId) setLocalCenterId(selectedId); setScope('local'); }}>局部</button>
          </div>
          {scope === 'local' && (
            <label className="og-depth" title="局部图的深度">深度
              <select value={depth} onChange={(e) => setDepth(+e.target.value)}>{[1, 2, 3].map((d) => <option key={d} value={d}>{d}</option>)}</select>
            </label>
          )}
        </div>

        {/* top right: holographic console · settings · new page · theme */}
        <div className="og-bar og-tr">
          <IconButton title="全息操作台" active={holo} onClick={() => setHolo((v) => !v)} className="holo-toggle"><Sparkles className="w-4 h-4" /></IconButton>
          {EMBEDDED && source === 'mine' && <IconButton title="新建知识页" onClick={newPage}><Plus className="w-4 h-4" /></IconButton>}
          <IconButton title={isDark ? '浅色' : '深色'} onClick={() => setIsDark((v) => !v)}>{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</IconButton>
          <IconButton title="图谱设置" active={settingsOpen} onClick={() => setSettingsOpen((v) => !v)}><Settings2 className="w-4 h-4" /></IconButton>
        </div>
        {settingsOpen && (
          <div className="og-settings">
            <GraphControlsPanel isOpen onToggleOpen={() => setSettingsOpen(false)} filters={filters} onChangeFilters={setFilters} groupRules={groupRules}
              onChangeGroupRules={setGroupRules} displayConfig={display} onChangeDisplay={setDisplay} forceConfig={forces} onChangeForce={setForces}
              availableTags={tags} onResetAllDefaults={resetAll} onReheatPhysics={() => canvas.current?.reheatSimulation(0.8)} />
          </div>
        )}

        {/* bottom left: what is shown · the selected note */}
        <div className="og-bar og-bl">
          {selected ? (
            <div className="og-chip">
              <span className="og-dot" />
              <b title={selected.title}>{selected.title}</b>
              {selected.type !== 'unresolved' || source === 'mine' ? (
                <button type="button" onClick={() => open(selected.id)}><FileText className="w-3.5 h-3.5" />{selected.type === 'unresolved' ? '新建' : '打开'}</button>
              ) : null}
              <button type="button" onClick={() => toLocal(selected.id)}><Network className="w-3.5 h-3.5" />局部图</button>
              <button type="button" aria-label="取消选择" onClick={() => setSelectedId(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <span className="og-count">{notes} 篇笔记 · {graph.edges.length} 条链接{scope === 'local' && localCenterId && byId.get(localCenterId) ? ' · 局部：' + byId.get(localCenterId)!.title : ''}</span>
          )}
        </div>

        {/* bottom right: zoom */}
        <div className="og-bar og-br">
          <IconButton title="放大" onClick={() => canvas.current?.zoomBy(1.25)}><ZoomIn className="w-4 h-4" /></IconButton>
          <IconButton title="缩小" onClick={() => canvas.current?.zoomBy(0.8)}><ZoomOut className="w-4 h-4" /></IconButton>
          <IconButton title="适合画面" onClick={() => canvas.current?.resetCamera()}><Crosshair className="w-4 h-4" /></IconButton>
          <IconButton title={fullscreen ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>{fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</IconButton>
        </div>
      </main>

      {readerNode && (
        <KnowledgeReaderModal node={readerNode} allNodesMap={byId}
          incidentEdges={graph.edges.filter((e) => { const { sourceId, targetId } = getEdgeEndpointIds(e); return sourceId === readerNode.id || targetId === readerNode.id; })}
          onClose={() => setReaderNode(null)} onNavigateToNode={(id) => { const n = byId.get(id); if (n) { setSelectedId(id); setReaderNode(n); } }}
          onFocusLocalGraph={(id) => { setReaderNode(null); toLocal(id); }} />
      )}
    </div>
  );
}
