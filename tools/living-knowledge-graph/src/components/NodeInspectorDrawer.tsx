import React from 'react';
import {
  X,
  BookOpen,
  Network,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  FileText,
  Link2,
} from 'lucide-react';
import {
  KnowledgeNode,
  KnowledgeEdge,
  GraphGroupRule,
} from '../types/graph';
import {
  KNOWLEDGE_TYPE_META,
  RELATIONSHIP_META,
} from '../data/livingKnowledgeData';
import {
  getEdgeEndpointIds,
  resolveNodeColor,
} from '../utils/graphAlgorithms';

interface NodeInspectorDrawerProps {
  node: KnowledgeNode | null;
  allNodesMap: Map<string, KnowledgeNode>;
  incidentEdges: KnowledgeEdge[];
  groupRules: GraphGroupRule[];
  isDark: boolean;
  scopeMode: 'global' | 'local';
  onClose: () => void;
  onSelectNeighbor: (nodeId: string) => void;
  onOpenFullDocument: (node: KnowledgeNode) => void;
  onOpenInLocalGraph: (nodeId: string) => void;
  onVerifyAIEdge: (edgeId: string) => void;
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  node,
  allNodesMap,
  incidentEdges,
  groupRules,
  isDark,
  scopeMode,
  onClose,
  onSelectNeighbor,
  onOpenFullDocument,
  onOpenInLocalGraph,
  onVerifyAIEdge,
}) => {
  if (!node) return null;

  const nodeColor = resolveNodeColor(node, groupRules, isDark);
  const typeMeta = KNOWLEDGE_TYPE_META[node.type];

  const verifiedConnections = incidentEdges.filter((e) => e.verified);
  const aiInferredConnections = incidentEdges.filter((e) => !e.verified);

  return (
    <aside className="w-84 sm:w-92 max-h-[calc(100vh-7.5rem)] flex flex-col rounded-xl bg-white/95 dark:bg-[#1E2028]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden text-slate-800 dark:text-[#E4E5EA]">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#8B8E9B]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: nodeColor }}
            />
            <span>{typeMeta.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{node.metadata.folder}</span>
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
            {node.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          title="关闭知识预览"
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 dark:bg-[#141519]/60 border-b border-slate-200 dark:border-white/8 shrink-0">
        <button
          onClick={() => onOpenFullDocument(node)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B7CF6] hover:bg-[#7C6CE6] text-white text-xs font-medium transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>打开知识页面</span>
        </button>
        <button
          onClick={() => onOpenInLocalGraph(node.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/70 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-[#E4E5EA] text-xs font-medium transition-colors whitespace-nowrap"
        >
          <Network className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>{scopeMode === 'local' ? '设为局部中心' : 'Local Graph'}</span>
        </button>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-4 text-xs">
        {/* Metadata Row (Unboxed clean metadata per design guidelines) */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#8B8E9B]">
          <span>作者: {node.metadata.author}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{node.metadata.wordCount} 字</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">更新于 {node.metadata.updatedAt}</span>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-tabular text-[#8B7CF6] dark:text-[#A78BFA]">
            {node.tags.map((t, idx) => (
              <React.Fragment key={t}>
                <span>{t}</span>
                {idx < node.tags.length - 1 && (
                  <span className="text-slate-300 dark:text-white/20" aria-hidden="true">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Knowledge Summary */}
        <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-[#141519] border border-slate-200/60 dark:border-white/5 leading-relaxed text-slate-700 dark:text-[#D4D6DF]">
          {node.metadata.summary}
        </div>

        {/* Source References */}
        {node.sourceReferences.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-[#8B8E9B] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Living Knowledge 源文件溯源 ({node.sourceReferences.length})</span>
            </div>
            <div className="space-y-1.5">
              {node.sourceReferences.map((ref) => (
                <div
                  key={ref.docId}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/6"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-500 dark:text-[#8B8E9B]">
                    <span className="truncate">{ref.path}</span>
                    <span className="shrink-0 ml-2">{ref.docId}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-[#A0A3B1] italic">
                    “{ref.snippet}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. Verified Real Citations & Bidirectional Links */}
        <div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-[#E4E5EA] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>真实引用关系 (Verified Links)</span>
            </span>
            <span className="font-mono-tabular text-slate-500 dark:text-[#8B8E9B]">
              {verifiedConnections.length} 条
            </span>
          </div>

          {verifiedConnections.length === 0 ? (
            <div className="text-[11px] text-slate-400 dark:text-[#8B8E9B] py-2">
              暂无已验证的直接引用连接。
            </div>
          ) : (
            <div className="space-y-1.5">
              {verifiedConnections.map((edge) => {
                const { sourceId, targetId } = getEdgeEndpointIds(edge);
                const neighborId = sourceId === node.id ? targetId : sourceId;
                const neighbor = allNodesMap.get(neighborId);
                if (!neighbor) return null;
                const relMeta = RELATIONSHIP_META[edge.relationshipType];
                const evidence = edge.evidenceReferences[0];

                return (
                  <div
                    key={edge.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141519]/90 border border-slate-200/70 dark:border-white/6 hover:border-[#8B7CF6]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectNeighbor(neighbor.id)}
                        className="text-left font-medium text-slate-900 dark:text-white hover:text-[#8B7CF6] dark:hover:text-[#A78BFA] flex items-center gap-1 truncate"
                      >
                        <Link2 className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{neighbor.title}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
                      </button>
                      <span className="text-[10px] text-slate-500 dark:text-[#8B8E9B] whitespace-nowrap shrink-0">
                        {relMeta.badge}
                      </span>
                    </div>
                    {evidence && (
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-[#8B8E9B] leading-snug">
                        {evidence.quote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. AI Inferred Semantic Concept Relationships (Clearly separated!) */}
        <div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-[#E4E5EA] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI 语义推断关系 (AI Inferred · 虚线)</span>
            </span>
            <span className="font-mono-tabular text-slate-500 dark:text-[#8B8E9B]">
              {aiInferredConnections.length} 条
            </span>
          </div>

          {aiInferredConnections.length === 0 ? (
            <div className="text-[11px] text-slate-400 dark:text-[#8B8E9B] py-1">
              当前节点无未确认的 AI 语义推断边。
            </div>
          ) : (
            <div className="space-y-1.5">
              {aiInferredConnections.map((edge) => {
                const { sourceId, targetId } = getEdgeEndpointIds(edge);
                const neighborId = sourceId === node.id ? targetId : sourceId;
                const neighbor = allNodesMap.get(neighborId);
                if (!neighbor) return null;
                const evidence = edge.evidenceReferences[0];

                return (
                  <div
                    key={edge.id}
                    className="p-2.5 rounded-lg bg-emerald-500/[0.05] border border-dashed border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectNeighbor(neighbor.id)}
                        className="text-left font-medium text-slate-900 dark:text-white hover:text-emerald-400 flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{neighbor.title}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
                      </button>
                      {evidence && (
                        <span className="text-[10px] font-mono-tabular text-emerald-600 dark:text-emerald-400 shrink-0">
                          置信度 {Math.round(evidence.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    {evidence && (
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-[#A0A3B1] leading-snug">
                        {evidence.quote}
                      </p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onVerifyAIEdge(edge.id)}
                        className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium transition-colors"
                      >
                        人工确认转为真实连接
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
