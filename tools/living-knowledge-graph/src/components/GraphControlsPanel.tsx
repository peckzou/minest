import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  GraphFilterConfig,
  GraphGroupRule,
  GraphDisplayConfig,
  GraphForceConfig,
  KnowledgeType,
  RelationshipType,
} from '../types/graph';
import {
  KNOWLEDGE_TYPE_META,
  RELATIONSHIP_META,
} from '../data/livingKnowledgeData';

interface GraphControlsPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  filters: GraphFilterConfig;
  onChangeFilters: (updater: (prev: GraphFilterConfig) => GraphFilterConfig) => void;
  groupRules: GraphGroupRule[];
  onChangeGroupRules: (updater: (prev: GraphGroupRule[]) => GraphGroupRule[]) => void;
  displayConfig: GraphDisplayConfig;
  onChangeDisplay: (updater: (prev: GraphDisplayConfig) => GraphDisplayConfig) => void;
  forceConfig: GraphForceConfig;
  onChangeForce: (updater: (prev: GraphForceConfig) => GraphForceConfig) => void;
  availableTags: string[];
  onResetAllDefaults: () => void;
  onReheatPhysics: () => void;
}

const PRESET_COLORS = [
  '#8B7CF6',
  '#38BDF8',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#F43F5E',
  '#A855F7',
  '#14B8A6',
];

export const GraphControlsPanel: React.FC<GraphControlsPanelProps> = ({
  isOpen,
  onToggleOpen,
  filters,
  onChangeFilters,
  groupRules,
  onChangeGroupRules,
  displayConfig,
  onChangeDisplay,
  forceConfig,
  onChangeForce,
  availableTags,
  onResetAllDefaults,
  onReheatPhysics,
}) => {
  const [openSections, setOpenSections] = useState<{
    filters: boolean;
    groups: boolean;
    display: boolean;
    forces: boolean;
  }>({
    filters: true,
    groups: true,
    display: false,
    forces: true,
  });

  const [newRuleQuery, setNewRuleQuery] = useState('');
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [newRuleColor, setNewRuleColor] = useState('#38BDF8');

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleType = (type: KnowledgeType) => {
    onChangeFilters((prev) => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter((t) => t !== type)
          : [...prev.selectedTypes, type],
      };
    });
  };

  const handleToggleRelationship = (rel: RelationshipType) => {
    onChangeFilters((prev) => {
      const exists = prev.selectedRelationships.includes(rel);
      return {
        ...prev,
        selectedRelationships: exists
          ? prev.selectedRelationships.filter((r) => r !== rel)
          : [...prev.selectedRelationships, rel],
      };
    });
  };

  const handleToggleTag = (tag: string) => {
    onChangeFilters((prev) => {
      const exists = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: exists
          ? prev.selectedTags.filter((t) => t !== tag)
          : [...prev.selectedTags, tag],
      };
    });
  };

  const handleAddGroupRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleQuery.trim()) return;
    const rule: GraphGroupRule = {
      id: `grp-custom-${Date.now()}`,
      label: newRuleLabel.trim() || newRuleQuery.trim(),
      query: newRuleQuery.trim(),
      color: newRuleColor,
      enabled: true,
    };
    onChangeGroupRules((prev) => [...prev, rule]);
    setNewRuleQuery('');
    setNewRuleLabel('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        title="展开图谱控制面板 (Graph Controls)"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-[#1E2028]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#E4E5EA] hover:border-[#8B7CF6] transition-colors shadow-sm text-xs font-medium whitespace-nowrap shrink-0"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B7CF6]" />
        <span>图谱控制</span>
      </button>
    );
  }

  return (
    <aside className="w-76 sm:w-80 max-h-[calc(100vh-7.5rem)] flex flex-col rounded-xl bg-white/95 dark:bg-[#1E2028]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden text-slate-800 dark:text-[#E4E5EA]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B7CF6]" />
          <span className="text-xs font-semibold tracking-wide">Graph Controls</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onResetAllDefaults}
            title="重置所有参数为 Obsidian 默认值"
            className="p-1.5 rounded-md text-slate-500 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleOpen}
            title="折叠控制面板"
            className="p-1.5 rounded-md text-slate-500 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accordion Scroll Body */}
      <div className="flex-1 overflow-y-auto panel-scroll divide-y divide-slate-200 dark:divide-white/8 text-xs">
        {/* 1. FILTERS SECTION */}
        <div>
          <button
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 font-semibold text-slate-700 dark:text-[#E4E5EA] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>Filters (检索与过滤)</span>
            {openSections.filters ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSections.filters && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    onChangeFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                  }
                  placeholder="搜索页面标题、#标签、摘要..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-[#E4E5EA] placeholder:text-slate-400 dark:placeholder:text-[#8B8E9B] focus:outline-none focus:border-[#8B7CF6]"
                />
                {filters.searchQuery && (
                  <button
                    onClick={() =>
                      onChangeFilters((prev) => ({ ...prev, searchQuery: '' }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Toggles for Unresolved Links, Orphans, and AI-Inferred edges */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    未解析链接 (Unresolved Links)
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.showUnresolved}
                    onChange={(e) =>
                      onChangeFilters((prev) => ({
                        ...prev,
                        showUnresolved: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    孤立节点 (Orphan Nodes)
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.showOrphans}
                    onChange={(e) =>
                      onChangeFilters((prev) => ({
                        ...prev,
                        showOrphans: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    显示 AI 语义推断关系 (虚线)
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.showAIInferred}
                    onChange={(e) =>
                      onChangeFilters((prev) => ({
                        ...prev,
                        showAIInferred: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    仅显示已验证真实引用
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.onlyVerifiedLinks}
                    onChange={(e) =>
                      onChangeFilters((prev) => ({
                        ...prev,
                        onlyVerifiedLinks: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Knowledge Types Filter */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-[#8B8E9B] mb-1.5">
                  知识节点类型 (Knowledge Types)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(KNOWLEDGE_TYPE_META) as KnowledgeType[]).map((type) => {
                    const active = filters.selectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleToggleType(type)}
                        className={`px-2 py-1 rounded text-left text-[11px] transition-colors truncate ${
                          active
                            ? 'bg-[#8B7CF6]/15 text-[#8B7CF6] dark:text-[#C4B5FD] border border-[#8B7CF6]/40 font-medium'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#8B8E9B] border border-transparent'
                        }`}
                      >
                        {KNOWLEDGE_TYPE_META[type].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Relationship Types Filter */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-[#8B8E9B] mb-1.5">
                  关系连接类型 (区分真实引用与 AI 推断)
                </div>
                <div className="space-y-1">
                  {(Object.keys(RELATIONSHIP_META) as RelationshipType[]).map((rel) => {
                    const meta = RELATIONSHIP_META[rel];
                    const active = filters.selectedRelationships.includes(rel);
                    return (
                      <button
                        key={rel}
                        onClick={() => handleToggleRelationship(rel)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                          active
                            ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-[#E4E5EA]'
                            : 'text-slate-400 dark:text-[#8B8E9B]/50 hover:bg-slate-50 dark:hover:bg-white/4'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-3 h-0.5 shrink-0"
                            style={{
                              backgroundColor: meta.colorDark,
                              borderBottom: meta.dashed
                                ? `1.5px dashed ${meta.colorDark}`
                                : 'none',
                            }}
                          />
                          <span className="truncate">{meta.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-[#8B8E9B] shrink-0 ml-1">
                          {meta.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag Filter Buttons */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8B8E9B]">
                    按标签筛选 (Tags)
                  </span>
                  {filters.selectedTags.length > 0 && (
                    <button
                      onClick={() =>
                        onChangeFilters((prev) => ({ ...prev, selectedTags: [] }))
                      }
                      className="text-[10px] text-[#8B7CF6] hover:underline"
                    >
                      清除 ({filters.selectedTags.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto panel-scroll">
                  {availableTags.map((tag) => {
                    const active = filters.selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono-tabular transition-colors ${
                          active
                            ? 'bg-[#8B7CF6] text-white'
                            : 'bg-slate-100 dark:bg-[#141519] text-slate-600 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. GROUPS SECTION */}
        <div>
          <button
            onClick={() => toggleSection('groups')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 font-semibold text-slate-700 dark:text-[#E4E5EA] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>Groups (主题分组着色)</span>
            {openSections.groups ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSections.groups && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5">
              <div className="space-y-1.5">
                {groupRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#141519] border border-slate-200/70 dark:border-white/5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="color"
                        value={rule.color}
                        onChange={(e) =>
                          onChangeGroupRules((prev) =>
                            prev.map((r) =>
                              r.id === rule.id ? { ...r, color: e.target.value } : r
                            )
                          )
                        }
                        title="修改分组颜色"
                        className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium truncate">
                          {rule.label}
                        </div>
                        <div className="text-[10px] font-mono-tabular text-slate-500 dark:text-[#8B8E9B] truncate">
                          {rule.query}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          onChangeGroupRules((prev) =>
                            prev.map((r) =>
                              r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                            )
                          )
                        }
                        title={rule.enabled ? '隐藏该分组' : '显示该分组'}
                        className="p-1 text-slate-500 dark:text-[#8B8E9B] hover:text-slate-900 dark:hover:text-white"
                      >
                        {rule.enabled ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </button>
                      {rule.id.startsWith('grp-custom-') && (
                        <button
                          onClick={() =>
                            onChangeGroupRules((prev) =>
                              prev.filter((r) => r.id !== rule.id)
                            )
                          }
                          title="删除规则"
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Group Rule Form */}
              <form onSubmit={handleAddGroupRule} className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-500 dark:text-[#8B8E9B]">
                  新增分组着色规则 (如 <code className="font-mono-tabular">tag:#ai</code> 或{' '}
                  <code className="font-mono-tabular">type:wiki</code>)
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newRuleQuery}
                    onChange={(e) => setNewRuleQuery(e.target.value)}
                    placeholder="查询语法，如 tag:#physics"
                    className="flex-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-[11px] focus:outline-none focus:border-[#8B7CF6]"
                  />
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.slice(0, 4).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewRuleColor(c)}
                        className={`w-3.5 h-3.5 rounded-full ${
                          newRuleColor === c ? 'ring-2 ring-offset-1 ring-[#8B7CF6]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-2 py-1 rounded bg-[#8B7CF6] text-white hover:bg-[#7C6CE6] transition-colors flex items-center gap-1 text-[11px] font-medium shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 3. DISPLAY SECTION */}
        <div>
          <button
            onClick={() => toggleSection('display')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 font-semibold text-slate-700 dark:text-[#E4E5EA] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>Display (视觉外观)</span>
            {openSections.display ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSections.display && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    节点大小 (Node Size)
                  </span>
                  <span className="font-mono-tabular">
                    {displayConfig.nodeSizeMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.2}
                  step={0.05}
                  value={displayConfig.nodeSizeMultiplier}
                  onChange={(e) =>
                    onChangeDisplay((prev) => ({
                      ...prev,
                      nodeSizeMultiplier: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    连线粗细 (Link Thickness)
                  </span>
                  <span className="font-mono-tabular">
                    {displayConfig.linkThicknessMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.8}
                  step={0.1}
                  value={displayConfig.linkThicknessMultiplier}
                  onChange={(e) =>
                    onChangeDisplay((prev) => ({
                      ...prev,
                      linkThicknessMultiplier: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    文字渐显阈值 (Text Fade Threshold)
                  </span>
                  <span className="font-mono-tabular">
                    {displayConfig.textFadeThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={2.0}
                  step={0.05}
                  value={displayConfig.textFadeThreshold}
                  onChange={(e) =>
                    onChangeDisplay((prev) => ({
                      ...prev,
                      textFadeThreshold: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    色彩不透明度 (Color Opacity)
                  </span>
                  <span className="font-mono-tabular">
                    {Math.round(displayConfig.colorOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  value={displayConfig.colorOpacity}
                  onChange={(e) =>
                    onChangeDisplay((prev) => ({
                      ...prev,
                      colorOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    显示有向箭头 (Arrows)
                  </span>
                  <input
                    type="checkbox"
                    checked={displayConfig.showArrows}
                    onChange={(e) =>
                      onChangeDisplay((prev) => ({
                        ...prev,
                        showArrows: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    物理模拟动画 (Animation)
                  </span>
                  <input
                    type="checkbox"
                    checked={displayConfig.animatePhysics}
                    onChange={(e) =>
                      onChangeDisplay((prev) => ({
                        ...prev,
                        animatePhysics: e.target.checked,
                      }))
                    }
                    className="accent-[#8B7CF6] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 4. FORCES SECTION */}
        <div>
          <button
            onClick={() => toggleSection('forces')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 font-semibold text-slate-700 dark:text-[#E4E5EA] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>Forces (力导向物理参数)</span>
            {openSections.forces ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSections.forces && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    Center Force (中心吸引力)
                  </span>
                  <span className="font-mono-tabular">
                    {forceConfig.centerForce.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.0}
                  step={0.05}
                  value={forceConfig.centerForce}
                  onChange={(e) =>
                    onChangeForce((prev) => ({
                      ...prev,
                      centerForce: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    Repel Force (节点排斥力)
                  </span>
                  <span className="font-mono-tabular">{forceConfig.repelForce}</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={520}
                  step={10}
                  value={forceConfig.repelForce}
                  onChange={(e) =>
                    onChangeForce((prev) => ({
                      ...prev,
                      repelForce: parseInt(e.target.value, 10),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    Link Force (连接约束强度)
                  </span>
                  <span className="font-mono-tabular">
                    {forceConfig.linkForce.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={forceConfig.linkForce}
                  onChange={(e) =>
                    onChangeForce((prev) => ({
                      ...prev,
                      linkForce: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    Link Distance (连接基准距离)
                  </span>
                  <span className="font-mono-tabular">{forceConfig.linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={220}
                  step={5}
                  value={forceConfig.linkDistance}
                  onChange={(e) =>
                    onChangeForce((prev) => ({
                      ...prev,
                      linkDistance: parseInt(e.target.value, 10),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-[#8B8E9B]">
                    Collision & Damping (防碰撞与阻尼)
                  </span>
                  <span className="font-mono-tabular">
                    {forceConfig.damping.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={0.8}
                  step={0.05}
                  value={forceConfig.damping}
                  onChange={(e) =>
                    onChangeForce((prev) => ({
                      ...prev,
                      damping: parseFloat(e.target.value),
                    }))
                  }
                  className="graph-slider bg-slate-200 dark:bg-white/10"
                />
              </div>

              <button
                onClick={() => onReheatPhysics()}
                className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-white/6 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-[#E4E5EA] font-medium transition-colors text-[11px]"
              >
                重新激活物理布局收敛
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
