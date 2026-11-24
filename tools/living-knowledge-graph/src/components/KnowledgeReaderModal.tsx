import React from 'react';
import {
  X,
  FileText,
  Network,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import {
  KnowledgeNode,
  KnowledgeEdge,
} from '../types/graph';
import {
  KNOWLEDGE_TYPE_META,
  RELATIONSHIP_META,
} from '../data/livingKnowledgeData';
import { getEdgeEndpointIds } from '../utils/graphAlgorithms';

interface KnowledgeReaderModalProps {
  node: KnowledgeNode | null;
  allNodesMap: Map<string, KnowledgeNode>;
  incidentEdges: KnowledgeEdge[];
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
  onFocusLocalGraph: (nodeId: string) => void;
}

export const KnowledgeReaderModal: React.FC<KnowledgeReaderModalProps> = ({
  node,
  allNodesMap,
  incidentEdges,
  onClose,
  onNavigateToNode,
  onFocusLocalGraph,
}) => {
  if (!node) return null;

  const typeMeta = KNOWLEDGE_TYPE_META[node.type];

  // Parse inline [[Wiki Links]] inside content so clicking them navigates directly to that node
  const renderFormattedContent = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1
            key={idx}
            className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-3"
          >
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2
            key={idx}
            className="text-base font-semibold text-slate-800 dark:text-[#E4E5EA] mt-5 mb-2"
          >
            {line.slice(3)}
          </h2>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2.5" />;
      }

      // Match [[Target]] tokens
      const parts = line.split(/(\[\[[^\]]+\]\])/g);
      return (
        <p
          key={idx}
          className="text-sm leading-relaxed text-slate-700 dark:text-[#D4D6DF] mb-2"
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith('[[') && part.endsWith(']]')) {
              const linkTitle = part.slice(2, -2).split('|')[0].split('#')[0].trim();
              const matchedNode = Array.from(allNodesMap.values()).find(
                (n) =>
                  n.title.toLowerCase() === linkTitle.toLowerCase() ||
                  n.id.toLowerCase() === linkTitle.toLowerCase()
              );

              if (matchedNode) {
                return (
                  <button
                    key={pIdx}
                    onClick={() => onNavigateToNode(matchedNode.id)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-[#8B7CF6]/15 hover:bg-[#8B7CF6]/25 text-[#8B7CF6] dark:text-[#C4B5FD] font-medium transition-colors text-xs"
                  >
                    <span>[[{linkTitle}]]</span>
                  </button>
                );
              }

              return (
                <span
                  key={pIdx}
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/70 dark:bg-white/8 text-slate-600 dark:text-[#A0A3B1] font-mono-tabular text-xs"
                >
                  {part}
                </span>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-2xl bg-white dark:bg-[#1A1C23] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-slate-800 dark:text-[#E4E5EA]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#141519]/60">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8B8E9B]">
            <FolderOpen className="w-3.5 h-3.5 text-[#8B7CF6]" />
            <span className="font-mono-tabular">{node.metadata.folder}</span>
            <span aria-hidden="true">/</span>
            <span>{typeMeta.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{node.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFocusLocalGraph(node.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B7CF6]/15 hover:bg-[#8B7CF6]/25 text-[#8B7CF6] dark:text-[#C4B5FD] text-xs font-medium transition-colors"
            >
              <Network className="w-3.5 h-3.5" />
              <span>以此节点展开 Local Graph</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto panel-scroll px-6 py-5 space-y-6">
          {/* Metadata Subheader */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#8B8E9B] pb-3 border-b border-slate-200 dark:border-white/8">
            <span>维护者: {node.metadata.author}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">最后更新: {node.metadata.updatedAt}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{node.metadata.wordCount} 字</span>
            {node.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#8B7CF6] dark:text-[#A78BFA]">
                  {node.tags.join(' ')}
                </span>
              </>
            )}
          </div>

          {/* Markdown Body with clickable [[Wiki Links]] */}
          <article className="space-y-1">
            {renderFormattedContent(node.metadata.content)}
          </article>

          {/* Backlinks & Knowledge Graph Evidence Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-[#8B8E9B] mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#8B7CF6]" />
              <span>双向链接与关系证据 ({incidentEdges.length} 条关联)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {incidentEdges.map((edge) => {
                const { sourceId, targetId } = getEdgeEndpointIds(edge);
                const otherId = sourceId === node.id ? targetId : sourceId;
                const otherNode = allNodesMap.get(otherId);
                if (!otherNode) return null;
                const relMeta = RELATIONSHIP_META[edge.relationshipType];
                const ev = edge.evidenceReferences[0];

                return (
                  <button
                    key={edge.id}
                    onClick={() => onNavigateToNode(otherNode.id)}
                    className="text-left p-3 rounded-xl bg-slate-50 dark:bg-[#141519] border border-slate-200/80 dark:border-white/8 hover:border-[#8B7CF6] transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#8B7CF6] truncate flex items-center gap-1">
                        {edge.verified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">{otherNode.title}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-[#8B8E9B]">
                      {relMeta.label} ({relMeta.badge})
                    </div>
                    {ev && (
                      <div className="mt-1 text-[11px] text-slate-600 dark:text-[#A0A3B1] line-clamp-2">
                        {ev.quote}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
