import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Sun,
  Moon,
  Plus,
  ArrowLeft,
  Layers,
  CheckCircle2,
  Sparkles,
  Zap,
  Link2,
  Grid,
} from 'lucide-react';
import {
  KnowledgeNode,
  KnowledgeEdge,
  GraphFilterConfig,
  GraphGroupRule,
  GraphDisplayConfig,
  GraphForceConfig,
  GraphScopeMode,
  DatasetScaleMode,
  RelationshipType,
  GraphVisualModeId,
  GraphVisualPreset,
  StructuralGapBridge,
} from './types/graph';
import {
  DEFAULT_GROUP_RULES,
  getInitialLivingKnowledgeData,
  generateScaledKnowledgeDataset,
} from './data/livingKnowledgeData';
import {
  TOP_10_VISUAL_MODES,
  VISUAL_MODE_MAP,
} from './data/visualModePresets';
import {
  computeActiveGraph,
  getEdgeEndpointIds,
  computeTopologicalInsights,
} from './utils/graphAlgorithms';
import { GraphCanvas, GraphCanvasHandle } from './components/GraphCanvas';
import { GraphControlsPanel } from './components/GraphControlsPanel';
import { NodeInspectorDrawer } from './components/NodeInspectorDrawer';
import { KnowledgeReaderModal } from './components/KnowledgeReaderModal';
import { LiveKnowledgeEditorModal } from './components/LiveKnowledgeEditorModal';
import { VisualModeGallery } from './components/VisualModeGallery';
import { EMBEDDED, MINEST_GROUP_RULES, toGraph, readOwnStore, onHostData, askHost, LKData } from './data/minestSource';

const STORAGE_KEY_PREFS = 'minest_lk_graph_prefs_v1';

const DEFAULT_FILTERS: GraphFilterConfig = {
  searchQuery: '',
  selectedTags: [],
  selectedTypes: ['page', 'wiki', 'concept', 'decision', 'unresolved'],
  selectedRelationships: [
    'markdown-link',
    'wiki-relation',
    'project-decision',
    'user-manual',
    'ai-extracted',
  ],
  showUnresolved: true,
  showOrphans: true,
  showAIInferred: true,
  onlyVerifiedLinks: false,
};

const DEFAULT_DISPLAY: GraphDisplayConfig = {
  nodeSizeMultiplier: 1.0,
  linkThicknessMultiplier: 1.0,
  textFadeThreshold: 0.75,
  colorOpacity: 0.92,
  showArrows: false,
  animatePhysics: true,
  distinguishAIEgesDashed: true,
};

const DEFAULT_FORCES: GraphForceConfig = {
  centerForce: 0.35,
  repelForce: 190,
  linkForce: 0.75,
  linkDistance: 85,
  collisionRadius: 1.2,
  damping: 0.45,
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const initialBaseData = useMemo(() => getInitialLivingKnowledgeData(), []);
  const [customBaseNodes, setCustomBaseNodes] = useState<KnowledgeNode[]>([]);
  const [customBaseEdges, setCustomBaseEdges] = useState<KnowledgeEdge[]>([]);
  // 'mine' = this account's Living Knowledge; 'sample' = the example library (shown only while yours is empty)
  const [dataSource, setDataSource] = useState<'loading' | 'mine' | 'sample'>('loading');
  useEffect(() => {
    const apply = (d: LKData | null) => {
      const g = d ? toGraph(d) : { nodes: [], edges: [] };
      if (g.nodes.length) { setCustomBaseNodes(g.nodes); setCustomBaseEdges(g.edges); setDataSource('mine'); setLocalCenterId((c) => (g.nodes.some((n) => n.id === c) ? c : g.nodes[0].id)); }
      else { setCustomBaseNodes(initialBaseData.nodes); setCustomBaseEdges(initialBaseData.edges); setDataSource('sample'); }
    };
    const off = onHostData(apply);
    if (!EMBEDDED) {
      readOwnStore().then(apply);
      const vis = () => { if (document.visibilityState === 'visible') readOwnStore().then(apply); };
      document.addEventListener('visibilitychange', vis);
      return () => { off(); document.removeEventListener('visibilitychange', vis); };
    }
    return off;
  }, [initialBaseData]);
  // 全息操作台: the holographic console laid over the canvas (kept on this device)
  const [holo, setHolo] = useState<boolean>(() => { try { return localStorage.getItem('minest_lk_graph_holo') === '1'; } catch { return false; } });
  useEffect(() => {
    document.documentElement.classList.toggle('holo', holo);
    try { localStorage.setItem('minest_lk_graph_holo', holo ? '1' : '0'); } catch {}
  }, [holo]);
  const [scaleMode, setScaleMode] = useState<DatasetScaleMode>('standard');

  const { allNodes, allEdges } = useMemo(() => {
    if (scaleMode === 'standard') {
      return { allNodes: customBaseNodes, allEdges: customBaseEdges };
    }
    const targetCount =
      scaleMode === '500' ? 500 : scaleMode === '1000' ? 1000 : 5000;
    const scaled = generateScaledKnowledgeDataset(
      targetCount,
      customBaseNodes,
      customBaseEdges
    );
    return { allNodes: scaled.nodes, allEdges: scaled.edges };
  }, [scaleMode, customBaseNodes, customBaseEdges]);

  const loadSavedPrefs = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const savedPrefs = useMemo(() => loadSavedPrefs(), []);

  const [visualMode, setVisualMode] = useState<GraphVisualModeId>(
    savedPrefs?.visualMode || 'obsidian-native'
  );
  const [filters, setFilters] = useState<GraphFilterConfig>(
    savedPrefs?.filters || DEFAULT_FILTERS
  );
  const [groupRules, setGroupRules] = useState<GraphGroupRule[]>(
    savedPrefs?.groupRules || MINEST_GROUP_RULES
  );
  const [displayConfig, setDisplayConfig] = useState<GraphDisplayConfig>(
    savedPrefs?.displayConfig || DEFAULT_DISPLAY
  );
  const [forceConfig, setForceConfig] = useState<GraphForceConfig>(
    savedPrefs?.forceConfig || DEFAULT_FORCES
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFS,
        JSON.stringify({
          visualMode,
          filters,
          groupRules,
          displayConfig,
          forceConfig,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [visualMode, filters, groupRules, displayConfig, forceConfig]);

  const [scopeMode, setScopeMode] = useState<GraphScopeMode>('global');
  const [localCenterId, setLocalCenterId] = useState<string>('lk-engine-overview');
  const [localDepth, setLocalDepth] = useState<number>(1);
  const [localHistoryStack, setLocalHistoryStack] = useState<string[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);
  const [modeGalleryOpen, setModeGalleryOpen] = useState<boolean>(false);
  const [readerNode, setReaderNode] = useState<KnowledgeNode | null>(null);
  const [liveEditorOpen, setLiveEditorOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const graphCanvasRef = useRef<GraphCanvasHandle | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement | null>(null);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const n of customBaseNodes) {
      for (const t of n.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [customBaseNodes]);

  const activeGraph = useMemo(() => {
    return computeActiveGraph(
      allNodes,
      allEdges,
      filters,
      groupRules,
      scopeMode,
      localCenterId,
      localDepth
    );
  }, [
    allNodes,
    allEdges,
    filters,
    groupRules,
    scopeMode,
    localCenterId,
    localDepth,
  ]);

  // Compute InfraNodus Centrality, Structural Gaps & Graph Analysis Link Predictions
  const topologicalInsights = useMemo(() => {
    return computeTopologicalInsights(
      activeGraph.nodes,
      activeGraph.edges,
      activeGraph.adjacencyMap,
      activeGraph.degreeMap
    );
  }, [
    activeGraph.nodes,
    activeGraph.edges,
    activeGraph.adjacencyMap,
    activeGraph.degreeMap,
  ]);

  const allNodesMap = useMemo(() => {
    const map = new Map<string, KnowledgeNode>();
    for (const n of allNodes) map.set(n.id, n);
    return map;
  }, [allNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return allNodesMap.get(selectedNodeId) || null;
  }, [selectedNodeId, allNodesMap]);

  const selectedNodeIncidentEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return activeGraph.edges.filter((e) => {
      const { sourceId, targetId } = getEdgeEndpointIds(e);
      return sourceId === selectedNodeId || targetId === selectedNodeId;
    });
  }, [selectedNodeId, activeGraph.edges]);

  // Apply a visual mode preset and smoothly re-layout the graph
  const handleSelectVisualMode = useCallback((preset: GraphVisualPreset) => {
    setVisualMode(preset.id);
    if (preset.recommendedForces) {
      setForceConfig((prev) => ({
        ...prev,
        ...preset.recommendedForces,
      }));
    }
    if (preset.recommendedDisplay) {
      setDisplayConfig((prev) => ({
        ...prev,
        ...preset.recommendedDisplay,
      }));
    }
    setTimeout(() => {
      graphCanvasRef.current?.reheatSimulation(0.65);
    }, 40);
  }, []);

  // Bridge an InfraNodus Structural Gap by creating a verified user-manual link between two disconnected communities
  const handleBridgeStructuralGap = useCallback(
    (gap: StructuralGapBridge) => {
      const bridgeEdge: KnowledgeEdge = {
        id: `e-gap-bridge-${Date.now()}`,
        source: gap.nodeA.id,
        target: gap.nodeB.id,
        relationshipType: 'user-manual',
        weight: 1.0,
        verified: true,
        evidenceReferences: [
          {
            sourceDocId: `GAP-BRIDGE-${Date.now().toString().slice(-4)}`,
            quote: `InfraNodus 结构洞跨群落桥接：连接「${gap.nodeA.title}」与「${gap.nodeB.title}」，打通 ${gap.clusterA} 与 ${gap.clusterB} 之间的知识盲区。`,
            confidence: 1.0,
            verified: true,
            extractedBy: 'human-author',
          },
        ],
      };
      setCustomBaseEdges((prev) => [...prev, bridgeEdge]);
      setSelectedNodeId(gap.nodeA.id);
      graphCanvasRef.current?.reheatSimulation(0.45);
    },
    []
  );

  const handleSwitchToLocalCenter = useCallback(
    (nextCenterId: string) => {
      if (scopeMode === 'local' && localCenterId && localCenterId !== nextCenterId) {
        setLocalHistoryStack((prev) => [...prev, localCenterId]);
      }
      setLocalCenterId(nextCenterId);
      setScopeMode('local');
      setSelectedNodeId(nextCenterId);
    },
    [scopeMode, localCenterId]
  );

  const handlePopLocalHistory = () => {
    if (localHistoryStack.length === 0) return;
    const prevCenter = localHistoryStack[localHistoryStack.length - 1];
    setLocalHistoryStack((prev) => prev.slice(0, -1));
    setLocalCenterId(prevCenter);
    setSelectedNodeId(prevCenter);
  };

  const handleSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleDoubleClickNode = useCallback(
    (nodeId: string) => {
      const target = allNodesMap.get(nodeId);
      if (target) {
        setSelectedNodeId(nodeId);
        // inside Living Knowledge: a double click opens the real page (or starts it, for a link not written yet)
        if (dataSource === 'mine' && askHost('lk-open', { id: nodeId, title: target.title, kind: target.type })) return;
        setReaderNode(target);
      }
    },
    [allNodesMap, dataSource]
  );

  const handleVerifyAIEdge = (edgeId: string) => {
    setCustomBaseEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              verified: true,
              relationshipType: 'user-manual',
              evidenceReferences: e.evidenceReferences.map((ev) => ({
                ...ev,
                verified: true,
                confidence: 1.0,
              })),
            }
          : e
      )
    );
  };

  const handleAddLiveKnowledgeNode = (
    newNode: KnowledgeNode,
    linkedTargetId: string,
    relationshipType: RelationshipType,
    evidenceQuote: string
  ) => {
    // in Living Knowledge a new node is a real page: Living Knowledge makes it (with its version and checks)
    if (dataSource === 'mine' && askHost('lk-new', { title: newNode.title, linkTo: linkedTargetId })) { setLiveEditorOpen(false); return; }
    const isVerified = relationshipType !== 'ai-extracted';
    const newEdge: KnowledgeEdge = {
      id: `e-live-${Date.now()}`,
      source: newNode.id,
      target: linkedTargetId,
      relationshipType,
      weight: 0.95,
      verified: isVerified,
      evidenceReferences: [
        {
          sourceDocId: newNode.sourceReferences[0]?.docId || 'DOC-LIVE',
          quote: evidenceQuote,
          confidence: isVerified ? 1.0 : 0.88,
          verified: isVerified,
          extractedBy: isVerified ? 'human-author' : 'living-knowledge-ai',
        },
      ],
    };

    setScaleMode('standard');
    setCustomBaseNodes((prev) => [...prev, newNode]);
    setCustomBaseEdges((prev) => [...prev, newEdge]);
    setSelectedNodeId(newNode.id);
    setTimeout(() => {
      graphCanvasRef.current?.focusNode(newNode.id, 1.35);
    }, 120);
  };

  const handleResetAllDefaults = () => {
    setVisualMode('obsidian-native');
    setFilters(DEFAULT_FILTERS);
    setGroupRules(DEFAULT_GROUP_RULES);
    setDisplayConfig(DEFAULT_DISPLAY);
    setForceConfig(DEFAULT_FORCES);
    graphCanvasRef.current?.resetCamera();
  };

  const handleToggleFullscreen = () => {
    const el = workspaceContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleChangeScaleMode = (nextScale: DatasetScaleMode) => {
    setScaleMode(nextScale);
    if (nextScale === '5000') {
      setForceConfig((prev) => ({
        ...prev,
        repelForce: 110,
        linkDistance: 45,
        centerForce: 0.55,
      }));
    } else if (nextScale === '1000' || nextScale === '500') {
      setForceConfig((prev) => ({
        ...prev,
        repelForce: 145,
        linkDistance: 62,
        centerForce: 0.42,
      }));
    } else {
      setForceConfig(DEFAULT_FORCES);
    }
    setTimeout(() => {
      graphCanvasRef.current?.resetCamera();
    }, 180);
  };

  const activePreset = VISUAL_MODE_MAP[visualMode];
  const verifiedEdgeCount = useMemo(
    () => activeGraph.edges.filter((e) => e.verified).length,
    [activeGraph.edges]
  );
  const aiInferredEdgeCount = activeGraph.edges.length - verifiedEdgeCount;

  return (
    <div
      ref={workspaceContainerRef}
      className="h-screen w-screen flex flex-col bg-[#F8FAFC] dark:bg-[#141519] text-slate-900 dark:text-[#E4E5EA] overflow-hidden"
    >
      {/* Top Bar Contract: Zone 1 (1-line Brand Wordmark) — Zone 2 (5 Concise Nav Links) — Zone 3 (1 Primary Action) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 bg-white/90 dark:bg-[#181920]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/8 shrink-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#graph-canvas"
          onClick={(e) => {
            e.preventDefault();
            graphCanvasRef.current?.resetCamera();
          }}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          {EMBEDDED ? '知识图谱 · 浏览画布' : 'Minest Knowledge Graph'}
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-[#8B8E9B]">
          <a
            href="#global-graph"
            onClick={(e) => {
              e.preventDefault();
              setScopeMode('global');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              scopeMode === 'global'
                ? 'text-slate-900 dark:text-white underline underline-offset-4 decoration-[#8B7CF6] decoration-2'
                : ''
            }`}
          >
            Global Graph
          </a>
          <a
            href="#local-graph"
            onClick={(e) => {
              e.preventDefault();
              if (!localCenterId) {
                setLocalCenterId(selectedNodeId || localCenterId);
              } else if (selectedNodeId) {
                setLocalCenterId(selectedNodeId);
              }
              setScopeMode('local');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              scopeMode === 'local'
                ? 'text-slate-900 dark:text-white underline underline-offset-4 decoration-[#8B7CF6] decoration-2'
                : ''
            }`}
          >
            Local Graph
          </a>
          <a
            href="#visual-modes"
            onClick={(e) => {
              e.preventDefault();
              setModeGalleryOpen(true);
            }}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Top 10 视觉模式
          </a>
          <a
            href="#controls"
            onClick={(e) => {
              e.preventDefault();
              setControlsOpen((prev) => !prev);
            }}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Graph Controls
          </a>
          <a
            href="#reset-view"
            onClick={(e) => {
              e.preventDefault();
              graphCanvasRef.current?.resetCamera();
            }}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            重置视角
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLiveEditorOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#8B7CF6] hover:bg-[#7C6CE6] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增知识节点</span>
          </button>
        </div>
      </header>

      {dataSource === 'sample' && (
        <div className="lk-sample-note">现在显示的是示例知识库 —— 你的活知识里还没有知识页。去“知识页”或“来源”加一些内容，这里就会换成你自己的。</div>
      )}
      {/* Main Graph Viewport Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {holo && (
          <div className="holo-overlay" aria-hidden="true">
            <div className="holo-grid" /><div className="holo-scan" /><div className="holo-vignette" />
            <span className="holo-corner tl" /><span className="holo-corner tr" /><span className="holo-corner bl" /><span className="holo-corner br" />
            <div className="holo-hud top">MINEST · HOLOGRAPHIC CONSOLE · 全息操作台</div>
            <div className="holo-hud bottom">{activeGraph.nodes.length} NODES · {activeGraph.edges.length} LINKS · {dataSource === 'mine' ? 'LIVING KNOWLEDGE' : 'SAMPLE'}</div>
          </div>
        )}
        {/* 2D Force-Directed Canvas with Top 10 Visual Engines */}
        <GraphCanvas
          ref={graphCanvasRef}
          nodes={activeGraph.nodes}
          edges={activeGraph.edges}
          adjacencyMap={activeGraph.adjacencyMap}
          incidentEdgesMap={activeGraph.incidentEdgesMap}
          degreeMap={activeGraph.degreeMap}
          centralityMap={topologicalInsights.centralityMap}
          structuralGaps={topologicalInsights.structuralGaps}
          predictedLinks={topologicalInsights.predictedLinks}
          groupRules={groupRules}
          displayConfig={displayConfig}
          forceConfig={forceConfig}
          visualMode={visualMode}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          localCenterId={localCenterId}
          scopeMode={scopeMode}
          isDark={isDark}
          onSelectNode={handleSelectNode}
          onHoverNode={setHoveredNodeId}
          onDoubleClickNode={handleDoubleClickNode}
        />

        {/* Workspace Top Floating Bars */}
        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none z-20">
          {/* Row 1: Graph Controls Toggle + Global/Local Switcher + Scale Benchmark + Theme */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 pointer-events-auto">
              {!controlsOpen && (
                <GraphControlsPanel
                  isOpen={false}
                  onToggleOpen={() => setControlsOpen(true)}
                  filters={filters}
                  onChangeFilters={setFilters}
                  groupRules={groupRules}
                  onChangeGroupRules={setGroupRules}
                  displayConfig={displayConfig}
                  onChangeDisplay={setDisplayConfig}
                  forceConfig={forceConfig}
                  onChangeForce={setForceConfig}
                  availableTags={availableTags}
                  onResetAllDefaults={handleResetAllDefaults}
                  onReheatPhysics={() => graphCanvasRef.current?.reheatSimulation(0.5)}
                />
              )}

              {/* Global / Local Segmented Control */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
                <button
                  onClick={() => setScopeMode('global')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    scopeMode === 'global'
                      ? 'bg-[#8B7CF6] text-white'
                      : 'text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Global Graph
                </button>
                <button
                  onClick={() => {
                    if (selectedNodeId) setLocalCenterId(selectedNodeId);
                    setScopeMode('local');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    scopeMode === 'local'
                      ? 'bg-[#8B7CF6] text-white'
                      : 'text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Local Graph
                </button>
              </div>

              {/* Local Graph Depth & Back Navigation Controls */}
              {scopeMode === 'local' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm text-xs">
                  <Layers className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="text-slate-500 dark:text-[#8B8E9B] whitespace-nowrap">
                    深度:
                  </span>
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setLocalDepth(d)}
                      className={`px-2 py-0.5 rounded font-mono-tabular text-xs transition-colors whitespace-nowrap ${
                        localDepth === d
                          ? 'bg-[#38BDF8]/20 text-[#0284C7] dark:text-[#38BDF8] font-semibold'
                          : 'text-slate-500 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {d} 层
                    </button>
                  ))}

                  {localHistoryStack.length > 0 && (
                    <button
                      onClick={handlePopLocalHistory}
                      title="返回上一中心节点"
                      className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-200 dark:border-white/10 text-[#8B7CF6] hover:underline whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>返回</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Cluster: Scale Benchmark + Theme */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm text-xs">
                <span className="px-2 text-[11px] text-slate-500 dark:text-[#8B8E9B] whitespace-nowrap">
                  规模测试:
                </span>
                {(
                  [
                    { id: 'standard', label: '真实库' },
                    { id: '500', label: '500' },
                    { id: '1000', label: '1,000' },
                    { id: '5000', label: '5,000' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChangeScaleMode(item.id)}
                    className={`px-2 py-1 rounded text-[11px] font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                      scaleMode === item.id
                        ? 'bg-[#8B7CF6]/20 text-[#8B7CF6] dark:text-[#C4B5FD] font-semibold'
                        : 'text-slate-500 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setHolo((v) => !v)}
                aria-pressed={holo}
                title="叠加全息操作台效果"
                className={`holo-toggle flex items-center gap-1.5 px-2.5 py-2 rounded-lg backdrop-blur-md border text-xs font-semibold transition-colors ${holo ? 'bg-cyan-400/20 border-cyan-300/60 text-cyan-200' : 'bg-white/90 dark:bg-[#1E2028]/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#E4E5EA]'}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>全息操作台</span>
              </button>
              <button
                onClick={() => setIsDark((prev) => !prev)}
                title={isDark ? '切换为 Minest 浅色主题' : '切换为 Obsidian 深色主题'}
                className="p-2 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#E4E5EA] hover:border-[#8B7CF6] transition-colors shadow-sm"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Row 2: Instant Top 10 Visual Modes Dock (1-Click Switching for InfraNodus, Juggl, Extended, ExcaliBrain, etc.) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/92 dark:bg-[#1E2028]/92 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-md pointer-events-auto overflow-x-auto panel-scroll">
            <button
              onClick={() => setModeGalleryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8B7CF6]/15 hover:bg-[#8B7CF6]/25 text-[#8B7CF6] dark:text-[#C4B5FD] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Top 10 插件图鉴</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

            {TOP_10_VISUAL_MODES.map((preset) => {
              const active = visualMode === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectVisualMode(preset)}
                  title={`${preset.name} — ${preset.tagline}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-[#A0A3B1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <span className="font-mono-tabular text-[11px] opacity-75">
                    #{preset.rank}
                  </span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Collapsible Graph Controls Drawer */}
        {controlsOpen && (
          <div className="absolute top-26 left-3 z-20">
            <GraphControlsPanel
              isOpen={true}
              onToggleOpen={() => setControlsOpen(false)}
              filters={filters}
              onChangeFilters={setFilters}
              groupRules={groupRules}
              onChangeGroupRules={setGroupRules}
              displayConfig={displayConfig}
              onChangeDisplay={setDisplayConfig}
              forceConfig={forceConfig}
              onChangeForce={setForceConfig}
              availableTags={availableTags}
              onResetAllDefaults={handleResetAllDefaults}
              onReheatPhysics={() => graphCanvasRef.current?.reheatSimulation(0.5)}
            />
          </div>
        )}

        {/* Active Visual Mode Banner & InfraNodus Structural Gap Quick Bridge Card (Bottom-Left above status bar) */}
        <div className="absolute bottom-14 left-3 z-10 max-w-md pointer-events-auto">
          <div className="p-3 rounded-xl bg-white/92 dark:bg-[#1E2028]/92 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg text-xs space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePreset.accentColor }}
                />
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  #{activePreset.rank} {activePreset.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#8B8E9B] truncate">
                  · {activePreset.tagline}
                </span>
              </div>
              <button
                onClick={() => setModeGalleryOpen(true)}
                className="text-[11px] font-medium text-[#8B7CF6] hover:underline whitespace-nowrap shrink-0"
              >
                详情
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-[#A0A3B1] leading-snug">
              {activePreset.description}
            </p>

            {/* When InfraNodus mode is active, display live Structural Gap quick bridge action */}
            {visualMode === 'infranodus' &&
              topologicalInsights.structuralGaps.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 truncate">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      盲区 #1: {topologicalInsights.structuralGaps[0].nodeA.title} ↔{' '}
                      {topologicalInsights.structuralGaps[0].nodeB.title}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleBridgeStructuralGap(topologicalInsights.structuralGaps[0])
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>一键弥合盲区</span>
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* Right Floating Node Inspector & Preview Drawer */}
        {selectedNode && (
          <div className="absolute top-26 right-3 z-20">
            <NodeInspectorDrawer
              node={selectedNode}
              allNodesMap={allNodesMap}
              incidentEdges={selectedNodeIncidentEdges}
              groupRules={groupRules}
              isDark={isDark}
              scopeMode={scopeMode}
              onClose={() => setSelectedNodeId(null)}
              onSelectNeighbor={(neighborId) => {
                if (scopeMode === 'local') {
                  handleSwitchToLocalCenter(neighborId);
                } else {
                  setSelectedNodeId(neighborId);
                  graphCanvasRef.current?.focusNode(neighborId, 1.35);
                }
              }}
              onOpenFullDocument={(node) => setReaderNode(node)}
              onOpenInLocalGraph={(nodeId) => handleSwitchToLocalCenter(nodeId)}
              onVerifyAIEdge={handleVerifyAIEdge}
            />
          </div>
        )}

        {/* Bottom-Left Legend & Graph Statistics Bar */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-auto flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm text-xs text-slate-600 dark:text-[#8B8E9B]">
          <span className="font-mono-tabular font-medium text-slate-900 dark:text-[#E4E5EA]">
            {activeGraph.nodes.length} 节点
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 font-mono-tabular">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{verifiedEdgeCount} 真实引用</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 font-mono-tabular">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{aiInferredEdgeCount} AI 推断 (虚线)</span>
          </span>
          {visualMode === 'infranodus' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-amber-500 font-medium">
                {topologicalInsights.structuralGaps.length} 结构洞盲区
              </span>
            </>
          )}
        </div>

        {/* Bottom-Right Viewport Camera Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 p-1 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
          <button
            onClick={() => graphCanvasRef.current?.zoomBy(1.25)}
            title="放大视口 (Zoom In)"
            className="p-2 rounded-md text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => graphCanvasRef.current?.zoomBy(0.8)}
            title="缩小视口 (Zoom Out)"
            className="p-2 rounded-md text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => graphCanvasRef.current?.resetCamera()}
            title="重置视角居中 (Reset Camera)"
            className="p-2 rounded-md text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            title="全屏模式 (Fullscreen)"
            className="p-2 rounded-md text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </main>

      {/* Top 10 Visual Mode Gallery & InfraNodus Structural Gap Modal */}
      <VisualModeGallery
        isOpen={modeGalleryOpen}
        activeMode={visualMode}
        structuralGaps={topologicalInsights.structuralGaps}
        onSelectMode={(preset) => {
          handleSelectVisualMode(preset);
        }}
        onClose={() => setModeGalleryOpen(false)}
        onBridgeStructuralGap={handleBridgeStructuralGap}
        onFocusNode={(nodeId) => {
          setSelectedNodeId(nodeId);
          graphCanvasRef.current?.focusNode(nodeId, 1.4);
        }}
      />

      {/* Full Knowledge Page Reader Modal */}
      <KnowledgeReaderModal
        node={readerNode}
        allNodesMap={allNodesMap}
        incidentEdges={
          readerNode
            ? allEdges.filter((e) => {
                const { sourceId, targetId } = getEdgeEndpointIds(e);
                return sourceId === readerNode.id || targetId === readerNode.id;
              })
            : []
        }
        onClose={() => setReaderNode(null)}
        onNavigateToNode={(targetId) => {
          const next = allNodesMap.get(targetId);
          if (next) {
            setReaderNode(next);
            setSelectedNodeId(targetId);
            graphCanvasRef.current?.focusNode(targetId, 1.4);
          }
        }}
        onFocusLocalGraph={(targetId) => {
          handleSwitchToLocalCenter(targetId);
        }}
      />

      {/* Live Knowledge Node & Verified Edge Creator Modal */}
      <LiveKnowledgeEditorModal
        isOpen={liveEditorOpen}
        existingNodes={customBaseNodes}
        onClose={() => setLiveEditorOpen(false)}
        onAddKnowledgeNode={handleAddLiveKnowledgeNode}
      />
    </div>
  );
}
