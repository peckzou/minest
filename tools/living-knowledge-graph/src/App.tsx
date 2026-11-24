// Minest Living Knowledge · 知识图谱 — an Obsidian-style graph view of the user's own knowledge.
// The canvas fills the frame; around it only what Obsidian has: search, global / local graph, the graph settings
// (filters, groups, display, forces), zoom, and Minest's 全息操作台 overlay. Data comes from Living Knowledge
// (src/data/minestSource.ts); a double click opens the real page there.
// On top of that, the three engines of Living Knowledge meet here:
//   · Semantic Linking — a relation has the colour of its kind; confirmed is solid, suggested is dashed; a click on a
//     line shows why the two are linked, and a suggestion can be confirmed or rejected from there
//   · Knowledge Synthesis — several nodes can be picked (Shift / ⌘ click, or 多选) and synthesised into an Insight Card;
//     an insight is a diamond tied to the nodes it rests on
//   · Temporal Memory — the time slider shows the graph as it was at each moment something was saved
// The graph writes nothing: every change is asked of the Living Knowledge page.
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Crosshair, Sun, Moon, Plus, Search, Settings2, Sparkles, FileText, Network, X, History, Play, Pause, ListChecks, Lightbulb, Palette, Check, Ban } from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge, GraphFilterConfig, GraphGroupRule, GraphDisplayConfig, GraphForceConfig, GraphScopeMode } from './types/graph';
import { getInitialLivingKnowledgeData, RELATIONSHIP_META } from './data/livingKnowledgeData';
import { computeActiveGraph, getEdgeEndpointIds, computeTopologicalInsights } from './utils/graphAlgorithms';
import { GraphCanvas, GraphCanvasHandle } from './components/GraphCanvas';
import { GraphControlsPanel } from './components/GraphControlsPanel';
import { KnowledgeReaderModal } from './components/KnowledgeReaderModal';
import { EMBEDDED, MINEST_GROUP_RULES, REL_TYPE_META, toGraph, timeSteps, readOwnStore, onHostData, askHost, LKData } from './data/minestSource';

const PREFS = 'minest_lk_graph_prefs_v2';
const DEFAULT_FILTERS: GraphFilterConfig = {
  searchQuery: '', selectedTags: [], selectedTypes: ['page', 'wiki', 'concept', 'decision', 'insight', 'unresolved'],
  selectedRelationships: ['markdown-link', 'wiki-relation', 'project-decision', 'user-manual', 'ai-extracted'],
  showUnresolved: true, showOrphans: true, showAIInferred: true, onlyVerifiedLinks: false,
};
const DEFAULT_DISPLAY: GraphDisplayConfig = { nodeSizeMultiplier: 1, linkThicknessMultiplier: 1, textFadeThreshold: 0.75, colorOpacity: 0.92, showArrows: false, animatePhysics: true, distinguishAIEgesDashed: true };
const DEFAULT_FORCES: GraphForceConfig = { centerForce: 0.35, repelForce: 190, linkForce: 0.75, linkDistance: 85, collisionRadius: 1.2, damping: 0.45 };
const SYNTH_MODES: Array<[string, string]> = [['synthesize', '综合所选'], ['themes', '找共同主题'], ['compare', '比较'], ['connections', '发现关联'], ['insight', '生成洞察']];
const MAX_PICK = 8;

// settings saved before insights existed: the new node type and its colour are added once
function readPrefs(): any {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) || 'null');
    if (p && !p.insights) {
      if (p.filters && Array.isArray(p.filters.selectedTypes) && !p.filters.selectedTypes.includes('insight')) p.filters.selectedTypes.push('insight');
      if (Array.isArray(p.groupRules) && !p.groupRules.some((r: GraphGroupRule) => r.id === 'g-insight')) p.groupRules.push(MINEST_GROUP_RULES.find((r) => r.id === 'g-insight'));
    }
    return p;
  } catch { return null; }
}
const stamp = (t: number) => { const d = new Date(t); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

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
  const [lk, setLk] = useState<LKData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [localCenterId, setLocalCenterId] = useState<string>('');
  useEffect(() => {
    const apply = (d: LKData | null) => { setLk(d); setLoaded(true); };
    const off = onHostData(apply);
    if (!EMBEDDED) {
      readOwnStore().then(apply);
      const vis = () => { if (document.visibilityState === 'visible') readOwnStore().then(apply); };
      document.addEventListener('visibilitychange', vis);
      return () => { off(); document.removeEventListener('visibilitychange', vis); };
    }
    return off;
  }, []);

  // ---- time travel: one step for every moment something was saved; the last step is now
  const steps = useMemo(() => (lk ? timeSteps(lk) : []), [lk]);
  const [timeOn, setTimeOn] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = Math.max(0, steps.length - 1);
  const atStep = Math.min(step, last);
  const traveling = timeOn && steps.length > 1 && atStep < last;
  useEffect(() => {
    if (!playing) return;
    if (atStep >= last) { setPlaying(false); return; }
    const t = window.setTimeout(() => setStep(atStep + 1), 1100);
    return () => window.clearTimeout(t);
  }, [playing, atStep, last]);

  const mine = useMemo(() => (lk ? toGraph(lk, timeOn && steps.length > 1 ? { at: steps[atStep], from: atStep ? steps[atStep - 1] : 0 } : null) : { nodes: [], edges: [] }), [lk, timeOn, steps, atStep]);
  const hasMine = !!lk && (lk.pages.length + lk.decisions.length + (lk.insights || []).length) > 0;
  const source: 'loading' | 'mine' | 'sample' = !loaded ? 'loading' : hasMine ? 'mine' : 'sample';
  const nodes: KnowledgeNode[] = source === 'mine' ? mine.nodes : source === 'sample' ? sample.nodes : [];
  const edges: KnowledgeEdge[] = source === 'mine' ? mine.edges : source === 'sample' ? sample.edges : [];
  useEffect(() => { setLocalCenterId((c) => (nodes.some((n) => n.id === c) ? c : nodes[0]?.id || '')); }, [nodes]);

  // ---- graph settings (Obsidian: filters · groups · display · forces), kept on this device
  const [filters, setFilters] = useState<GraphFilterConfig>(saved?.filters || DEFAULT_FILTERS);
  const [groupRules, setGroupRules] = useState<GraphGroupRule[]>(saved?.groupRules || MINEST_GROUP_RULES);
  const [display, setDisplay] = useState<GraphDisplayConfig>(saved?.display || DEFAULT_DISPLAY);
  const [forces, setForces] = useState<GraphForceConfig>(saved?.forces || DEFAULT_FORCES);
  const [holo, setHolo] = useState<boolean>(saved?.holo ?? false);
  useEffect(() => { document.documentElement.classList.toggle('holo', holo); }, [holo]);
  useEffect(() => {
    try { localStorage.setItem(PREFS, JSON.stringify({ filters: { ...filters, searchQuery: '' }, groupRules, display, forces, holo, isDark, insights: true })); } catch {}
  }, [filters, groupRules, display, forces, holo, isDark]);

  const [scope, setScope] = useState<GraphScopeMode>('global');
  const [depth, setDepth] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [readerNode, setReaderNode] = useState<KnowledgeNode | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [synthMode, setSynthMode] = useState('synthesize');
  const [notice, setNotice] = useState('');
  const canvas = useRef<GraphCanvasHandle | null>(null);
  const shell = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!notice) return; const t = window.setTimeout(() => setNotice(''), 3200); return () => window.clearTimeout(t); }, [notice]);

  const tags = useMemo(() => Array.from(new Set(nodes.flatMap((n) => n.tags))).sort(), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n] as [string, KnowledgeNode])), [nodes]);
  const graph = useMemo(() => computeActiveGraph(nodes, edges, filters, groupRules, scope, localCenterId || null, depth), [nodes, edges, filters, groupRules, scope, localCenterId, depth]);
  const insights = useMemo(() => computeTopologicalInsights(graph.nodes, graph.edges, graph.adjacencyMap, graph.degreeMap), [graph]);
  const selected = selectedId ? byId.get(selectedId) || null : null;
  const selectedEdge = useMemo(() => (selectedEdgeId ? graph.edges.find((e) => e.id === selectedEdgeId) || null : null), [selectedEdgeId, graph.edges]);
  const pickedSet = useMemo(() => new Set(picked.filter((id) => byId.has(id))), [picked, byId]);

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

  // only pages and decisions can be synthesised; an insight or a link that is not written yet cannot
  const togglePick = useCallback((id: string) => {
    const n = byId.get(id);
    if (!n || n.type === 'insight' || n.type === 'unresolved') { setNotice('只有知识页和决策可以用来综合'); return; }
    setSelectedEdgeId(null);
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= MAX_PICK) { setNotice('一次最多综合 ' + MAX_PICK + ' 项'); return p; }
      return p.concat(id);
    });
  }, [byId]);
  const canAsk = EMBEDDED && source === 'mine';
  const synthesize = () => {
    const ids = Array.from(pickedSet);
    if (ids.length < 2) { setNotice('至少选 2 项'); return; }
    if (askHost('lk-synthesize', { ids, mode: synthMode })) { setPicked([]); setMultiMode(false); }
  };
  const decide = (to: 'confirmed' | 'rejected') => {
    if (!selectedEdge || !selectedEdge.relationId) return;
    askHost('lk-link-decide', { id: selectedEdge.relationId, to });
    if (to === 'rejected') setSelectedEdgeId(null);
  };

  const edgeEnds = selectedEdge ? getEdgeEndpointIds(selectedEdge) : null;
  const edgeMeta = selectedEdge ? (selectedEdge.relationType ? REL_TYPE_META[selectedEdge.relationType] : undefined) : undefined;
  const marks = useMemo(() => {
    const m = { added: 0, changed: 0, links: 0 };
    nodes.forEach((n) => { if (n.mark === 'new') m.added++; else if (n.mark === 'changed') m.changed++; });
    edges.forEach((e) => { if (e.mark === 'new') m.links++; });
    return m;
  }, [nodes, edges]);
  const relTypesShown = useMemo(() => Array.from(new Set(graph.edges.map((e) => e.relationType).filter(Boolean) as string[])), [graph.edges]);
  const suggested = graph.edges.filter((e) => e.status === 'suggested').length;

  const notes = graph.nodes.filter((n) => n.type !== 'unresolved').length;
  return (
    <div ref={shell} className="og-shell">
      {source === 'sample' && <div className="og-sample">这是示例知识库 —— 你的活知识里还没有知识页。加一些内容后，这里会换成你自己的。</div>}
      <main className="og-stage">
        <GraphCanvas ref={canvas} nodes={graph.nodes} edges={graph.edges} adjacencyMap={graph.adjacencyMap} incidentEdgesMap={graph.incidentEdgesMap}
          degreeMap={graph.degreeMap} centralityMap={insights.centralityMap} structuralGaps={[]} predictedLinks={[]} groupRules={groupRules}
          displayConfig={display} forceConfig={forces} visualMode="obsidian-native" selectedNodeId={selectedId} hoveredNodeId={hoveredId}
          localCenterId={localCenterId || null} scopeMode={scope} isDark={isDark} onSelectNode={setSelectedId} onHoverNode={setHoveredId} onDoubleClickNode={open}
          selectedEdgeId={selectedEdgeId} multiSelectedIds={pickedSet} multiMode={multiMode} onSelectEdge={setSelectedEdgeId} onToggleMulti={togglePick} />

        {holo && (
          <div className="holo-overlay" aria-hidden="true">
            <div className="holo-grid" /><div className="holo-scan" /><div className="holo-vignette" />
            <span className="holo-corner tl" /><span className="holo-corner tr" /><span className="holo-corner bl" /><span className="holo-corner br" />
            <div className="holo-hud top">MINEST · HOLOGRAPHIC CONSOLE · 全息操作台</div>
            <div className="holo-hud bottom">{graph.nodes.length} NODES · {graph.edges.length} LINKS</div>
          </div>
        )}

        {/* top left: search · global / local · pick several · time */}
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
          {source === 'mine' && (
            <>
              <IconButton title={multiMode ? '退出多选' : '多选节点来综合（也可以按住 Shift 点击）'} active={multiMode} onClick={() => setMultiMode((v) => !v)}><ListChecks className="w-4 h-4" /></IconButton>
              <IconButton title={timeOn ? '回到现在' : '时间旅行：看知识网络以前的样子'} active={timeOn} onClick={() => { setTimeOn((v) => !v); setStep(last); setPlaying(false); }}><History className="w-4 h-4" /></IconButton>
            </>
          )}
        </div>

        {/* top right: legend · holographic console · settings · new page · theme */}
        <div className="og-bar og-tr">
          <IconButton title="图例：线的颜色和样式" active={legendOpen} onClick={() => setLegendOpen((v) => !v)}><Palette className="w-4 h-4" /></IconButton>
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
        {legendOpen && !settingsOpen && (
          <div className="og-panel og-legend" role="region" aria-label="图例">
            <b>线</b>
            <span><i className="ln" />实线：已确认的关系</span>
            <span><i className="ln dash" />虚线：建议的关系，等你确认{suggested ? `（${suggested} 条）` : ''}</span>
            <span><i className="ln" style={{ borderColor: isDark ? RELATIONSHIP_META['markdown-link'].colorDark : RELATIONSHIP_META['markdown-link'].colorLight }} />正文里的 [[链接]]</span>
            {(relTypesShown.length ? relTypesShown : Object.keys(REL_TYPE_META).slice(0, 7)).map((t) => REL_TYPE_META[t] && (
              <span key={t}><i className="ln" style={{ borderColor: isDark ? REL_TYPE_META[t].colorDark : REL_TYPE_META[t].colorLight }} />{REL_TYPE_META[t].label}</span>
            ))}
            <b>节点</b>
            <span><i className="nd" />圆：知识页、决策</span>
            <span><i className="nd dia" />菱形：洞察（空心是草稿）</span>
            <span><i className="nd sq" />方框：选来综合的</span>
            <span><i className="nd ring new" />绿圈：这一步新增</span>
            <span><i className="nd ring chg" />黄色虚圈：这一步改过</span>
            <small>点一条线看关联理由。</small>
          </div>
        )}

        {/* why two notes are linked */}
        {selectedEdge && edgeEnds && (
          <div className="og-panel og-edge" role="region" aria-label="关联理由">
            <div className="og-edge-h">
              <button type="button" className="lnk" onClick={() => open(edgeEnds.sourceId)}>{byId.get(edgeEnds.sourceId)?.title || edgeEnds.sourceId}</button>
              <span className="rel" style={edgeMeta ? { color: isDark ? edgeMeta.colorDark : edgeMeta.colorLight } : undefined}>
                {edgeMeta ? edgeMeta.label : RELATIONSHIP_META[selectedEdge.relationshipType].badge} →
              </span>
              <button type="button" className="lnk" onClick={() => open(edgeEnds.targetId)}>{byId.get(edgeEnds.targetId)?.title || edgeEnds.targetId}</button>
              <button type="button" className="x" aria-label="关闭" onClick={() => setSelectedEdgeId(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="og-edge-s">
              {selectedEdge.status === 'suggested'
                ? <span className="tag sug">待确认 · {selectedEdge.engine === 'local' ? '本机发现' : 'AI 推断'}</span>
                : selectedEdge.fixed ? <span className="tag">写在内容里</span>
                : <span className="tag ok">{selectedEdge.aiFound ? '你确认的' : '已确认'}</span>}
              {typeof selectedEdge.confidence === 'number' && <span className="dim">把握 {Math.round(selectedEdge.confidence * 100)}%</span>}
              {selectedEdge.createdAt ? <span className="dim">{stamp(selectedEdge.createdAt)}</span> : null}
            </div>
            <p>{selectedEdge.explanation || ((selectedEdge.quotes || []).length ? '这条关系是整理来源时记下的，出处在下面。' : selectedEdge.evidenceReferences[0]?.quote || '这条关系没有记下理由。')}</p>
            {selectedEdge.downgraded && <p className="dim">页面里没有说明是哪一种关系，所以只标为“相关”。</p>}
            {(selectedEdge.quotes || []).map((q, i) => (
              <button type="button" key={i} className="quote" disabled={!q.nodeId || !byId.has(q.nodeId)} onClick={() => q.nodeId && open(q.nodeId)}>{q.title ? q.title + '：' : ''}“{q.quote}”</button>
            ))}
            {selectedEdge.status === 'suggested' && !(selectedEdge.quotes || []).length && <p className="dim">没有可以逐字核对的出处，需要你自己判断。</p>}
            {selectedEdge.relationId && canAsk && !traveling && (
              <div className="og-edge-a">
                {selectedEdge.status === 'suggested'
                  ? <><button type="button" onClick={() => decide('rejected')}><Ban className="w-3.5 h-3.5" />否决</button><button type="button" className="pri" onClick={() => decide('confirmed')}><Check className="w-3.5 h-3.5" />确认</button></>
                  : <button type="button" onClick={() => decide('rejected')}><Ban className="w-3.5 h-3.5" />改为否决</button>}
              </div>
            )}
            {selectedEdge.relationId && traveling && <p className="dim">这是当时的状态。回到现在才能确认或否决。</p>}
          </div>
        )}

        {/* time travel */}
        {timeOn && source === 'mine' && (
          <div className="og-panel og-time" role="region" aria-label="时间旅行">
            {steps.length > 1 ? (
              <>
                <button type="button" className="play" aria-label={playing ? '暂停' : '从这里播放'} onClick={() => { if (!playing && atStep >= last) setStep(0); setPlaying((v) => !v); }}>
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <input type="range" min={0} max={last} step={1} value={atStep} aria-label="时间" aria-valuetext={atStep >= last ? '现在' : stamp(steps[atStep])}
                  onChange={(e) => { setPlaying(false); setStep(+e.target.value); }} />
                <div className="og-time-t">
                  <b>{atStep >= last ? '现在' : stamp(steps[atStep])}</b>
                  <span>
                    第 {atStep + 1} / {steps.length} 步 · {nodes.filter((n) => n.type !== 'unresolved').length} 个节点
                    {marks.added ? ` · 新增 ${marks.added}` : ''}{marks.changed ? ` · 修改 ${marks.changed}` : ''}{marks.links ? ` · ${marks.links} 条关系有变化` : ''}
                  </span>
                </div>
              </>
            ) : <span className="dim">还只有一个时间点。以后每次保存都会多一步。</span>}
            <small>按保存下来的记录重建：每样东西出现的时间，以及这台设备上留着的版本。正文里的 [[链接]] 按现在的正文画。</small>
          </div>
        )}

        {/* bottom left: what is shown · the picked notes · the selected note */}
        <div className="og-bar og-bl">
          {pickedSet.size > 0 || multiMode ? (
            <div className="og-chip og-multi">
              <Lightbulb className="w-3.5 h-3.5" />
              <b>已选 {pickedSet.size} 项</b>
              {pickedSet.size === 0 ? <span className="dim">点节点把它加进来</span> : (
                <>
                  <select value={synthMode} onChange={(e) => setSynthMode(e.target.value)} aria-label="综合的方式">{SYNTH_MODES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  {canAsk ? <button type="button" className="pri" disabled={pickedSet.size < 2 || traveling} onClick={synthesize}>综合</button> : <span className="dim">在活知识里打开图谱才能综合</span>}
                </>
              )}
              <button type="button" aria-label="清除所选" onClick={() => { setPicked([]); setMultiMode(false); }}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : selected ? (
            <div className="og-chip">
              <span className="og-dot" />
              <b title={selected.title}>{selected.title}</b>
              {selected.stateLabel ? <span className="dim">{selected.stateLabel}</span> : null}
              {selected.type !== 'unresolved' || source === 'mine' ? (
                <button type="button" onClick={() => open(selected.id)}><FileText className="w-3.5 h-3.5" />{selected.type === 'unresolved' ? '新建' : '打开'}</button>
              ) : null}
              <button type="button" onClick={() => toLocal(selected.id)}><Network className="w-3.5 h-3.5" />局部图</button>
              <button type="button" aria-label="取消选择" onClick={() => setSelectedId(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <span className="og-count">{notes} 篇笔记 · {graph.edges.length} 条链接{suggested ? ` · ${suggested} 条待确认` : ''}{scope === 'local' && localCenterId && byId.get(localCenterId) ? ' · 局部：' + byId.get(localCenterId)!.title : ''}</span>
          )}
        </div>
        {notice && <div className="og-notice" role="status">{notice}</div>}

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
