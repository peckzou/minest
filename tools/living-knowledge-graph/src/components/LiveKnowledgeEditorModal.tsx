import React, { useState } from 'react';
import { X, Plus, Link2 } from 'lucide-react';
import {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeType,
  RelationshipType,
} from '../types/graph';
import {
  KNOWLEDGE_TYPE_META,
  RELATIONSHIP_META,
} from '../data/livingKnowledgeData';

interface LiveKnowledgeEditorModalProps {
  isOpen: boolean;
  existingNodes: KnowledgeNode[];
  onClose: () => void;
  onAddKnowledgeNode: (
    newNode: KnowledgeNode,
    linkedTargetId: string,
    relationshipType: RelationshipType,
    evidenceQuote: string
  ) => void;
}

export const LiveKnowledgeEditorModal: React.FC<LiveKnowledgeEditorModalProps> = ({
  isOpen,
  existingNodes,
  onClose,
  onAddKnowledgeNode,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<KnowledgeType>('page');
  const [group, setGroup] = useState('core-engine');
  const [tagsInput, setTagsInput] = useState('#living-knowledge, #architecture');
  const [summary, setSummary] = useState('');
  const [linkedTargetId, setLinkedTargetId] = useState(
    existingNodes[0]?.id || 'lk-engine-overview'
  );
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>('markdown-link');
  const [evidenceQuote, setEvidenceQuote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const targetNode = existingNodes.find((n) => n.id === linkedTargetId);
    const id = `lk-live-${Date.now()}`;
    const isResolved = type !== 'unresolved';

    const newNode: KnowledgeNode = {
      id,
      title: title.trim(),
      type,
      tags: tags.length > 0 ? tags : ['#living-knowledge'],
      group: type === 'decision' ? 'adr-decisions' : type === 'unresolved' ? 'unresolved' : group,
      size: 6,
      resolved: isResolved,
      metadata: {
        summary:
          summary.trim() ||
          `实时新增的 Living Knowledge 知识页面，关联至 [[${targetNode?.title || linkedTargetId}]]。`,
        content: `# ${title.trim()}\n\n${
          summary.trim() || '由用户在 Minest Living Knowledge 中实时创建。'
        }\n\n## 关联知识引用\n- 关联节点：[[${
          targetNode?.title || linkedTargetId
        }]]\n- 引用证据：${
          evidenceQuote.trim() || `在文档中显式建立了与 [[${targetNode?.title}]] 的知识连接。`
        }`,
        author: 'Minest Author',
        updatedAt: '刚刚 (实时热更新)',
        folder: `live/${group}`,
        wordCount: 320,
        status: isResolved ? 'verified' : 'unresolved-stub',
      },
      sourceReferences: [
        {
          docId: `DOC-LIVE-${Date.now().toString().slice(-4)}`,
          path: `/docs/live/${id}.md`,
          snippet:
            evidenceQuote.trim() ||
            `Live knowledge link to [[${targetNode?.title || linkedTargetId}]].`,
          updatedAt: '2026-11-23',
        },
      ],
    };

    onAddKnowledgeNode(
      newNode,
      linkedTargetId,
      relationshipType,
      evidenceQuote.trim() ||
        `文档实时引用：[[${targetNode?.title || linkedTargetId}]]`
    );
    setTitle('');
    setSummary('');
    setEvidenceQuote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E2028] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-slate-800 dark:text-[#E4E5EA]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#8B7CF6]" />
            <h2 className="text-sm font-semibold">
              新增 Living Knowledge 知识节点与真实连接
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-[#D4D6DF] mb-1">
              知识页面标题 (Node Title) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Incremental Graph-RAG 缓存失效策略"
              className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-[#D4D6DF] mb-1">
                知识类型 (Type)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KnowledgeType)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
              >
                {(Object.keys(KNOWLEDGE_TYPE_META) as KnowledgeType[]).map((k) => (
                  <option key={k} value={k}>
                    {KNOWLEDGE_TYPE_META[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-[#D4D6DF] mb-1">
                所属主题群组 (Group)
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
              >
                <option value="core-engine">Living Knowledge 核心引擎</option>
                <option value="graph-engine">Graph View 物理与渲染</option>
                <option value="adr-decisions">项目架构决策 (ADR)</option>
                <option value="ai-semantics">AI 概念提取与语义索引</option>
                <option value="product-spec">产品规范与知识工作流</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-[#D4D6DF] mb-1">
              标签 (Tags，逗号分隔)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-[#D4D6DF] mb-1">
              知识摘要 (Summary)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="简要描述该页面的核心知识内容..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-[#E4E5EA]">
              <Link2 className="w-3.5 h-3.5 text-[#8B7CF6]" />
              <span>建立关联边与证据溯源 (热更新注入当前物理图谱)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#8B8E9B] mb-1">
                  连接目标节点
                </label>
                <select
                  value={linkedTargetId}
                  onChange={(e) => setLinkedTargetId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
                >
                  {existingNodes.slice(0, 40).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#8B8E9B] mb-1">
                  关系类型 (区分真实引用 / AI 推断)
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) =>
                    setRelationshipType(e.target.value as RelationshipType)
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
                >
                  {(Object.keys(RELATIONSHIP_META) as RelationshipType[]).map(
                    (rel) => (
                      <option key={rel} value={rel}>
                        {RELATIONSHIP_META[rel].label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-[#8B8E9B] mb-1">
                引用原文证据 (Evidence Quote)
              </label>
              <input
                type="text"
                value={evidenceQuote}
                onChange={(e) => setEvidenceQuote(e.target.value)}
                placeholder="例如：在 §2.1 中通过 [[双向链接]] 引用了该架构规范"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#8B7CF6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 text-slate-700 dark:text-[#E4E5EA] font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#8B7CF6] hover:bg-[#7C6CE6] text-white font-medium transition-colors"
            >
              增量注入图谱
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
