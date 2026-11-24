import React from 'react';
import {
  Sparkles,
  X,
  Check,
  Zap,
  Link2,
  Compass,
  Orbit,
} from 'lucide-react';
import {
  GraphVisualModeId,
  GraphVisualPreset,
  StructuralGapBridge,
} from '../types/graph';
import { TOP_10_VISUAL_MODES } from '../data/visualModePresets';

interface VisualModeGalleryProps {
  isOpen: boolean;
  activeMode: GraphVisualModeId;
  structuralGaps: StructuralGapBridge[];
  onSelectMode: (preset: GraphVisualPreset) => void;
  onClose: () => void;
  onBridgeStructuralGap: (gap: StructuralGapBridge) => void;
  onFocusNode: (nodeId: string) => void;
}

export const VisualModeGallery: React.FC<VisualModeGalleryProps> = ({
  isOpen,
  activeMode,
  structuralGaps,
  onSelectMode,
  onClose,
  onBridgeStructuralGap,
  onFocusNode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#181A22] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-slate-800 dark:text-[#E4E5EA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#141519]/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B7CF6]" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Obsidian 生态 Top 10 炫酷知识图谱视觉模式 (Visual Engines)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8B8E9B] mt-0.5">
              切换任意插件视觉引擎将实时重构物理力场、节点几何造型、拓扑能量云与关系流向（无需刷新知识库）
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable 10 Modes Grid + InfraNodus Structural Gap Live Insights */}
        <div className="flex-1 overflow-y-auto panel-scroll p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {TOP_10_VISUAL_MODES.map((preset) => {
              const isSelected = preset.id === activeMode;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectMode(preset);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#8B7CF6]/10 dark:bg-[#8B7CF6]/15 border-[#8B7CF6] shadow-md'
                      : 'bg-slate-50/70 dark:bg-[#141519]/80 border-slate-200/80 dark:border-white/8 hover:border-slate-400 dark:hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono-tabular font-bold text-white shrink-0"
                          style={{ backgroundColor: preset.accentColor }}
                        >
                          {preset.rank}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {preset.name}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8B7CF6] dark:text-[#C4B5FD] shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          <span>当前启用</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-[#8B8E9B] shrink-0">
                          点击切换
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-[11px] font-mono-tabular text-slate-500 dark:text-[#8B8E9B]">
                      源自: {preset.pluginSource} · {preset.tagline}
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-[#C2C5D0] leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Unboxed clean feature list with dot separators */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/6 flex flex-wrap items-center gap-1.5 text-[11px] font-medium"
                    style={{ color: preset.accentColor }}
                  >
                    {preset.features.map((feat, idx) => (
                      <React.Fragment key={feat}>
                        <span>{feat}</span>
                        {idx < preset.features.length - 1 && (
                          <span className="text-slate-300 dark:text-white/20" aria-hidden="true">
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* InfraNodus Structural Gaps Live Action Panel */}
          {structuralGaps.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/[0.07] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    InfraNodus 结构洞盲区洞察 (Structural Gaps & Blindspots)
                  </h3>
                </div>
                <span className="text-[11px] font-mono-tabular text-amber-600 dark:text-amber-400">
                  已检测到 {structuralGaps.length} 处跨社群高价值结构洞
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {structuralGaps.map((gap, idx) => (
                  <div
                    key={gap.id}
                    className="p-3 rounded-lg bg-white/90 dark:bg-[#141519]/90 border border-amber-500/25 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono-tabular font-semibold text-amber-600 dark:text-amber-400">
                          ⚡ 结构洞 #{idx + 1} · 盲区指数 {gap.gapScore}
                        </span>
                        <span className="text-slate-400 font-mono-tabular">
                          {gap.clusterA} ↔ {gap.clusterB}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                        {gap.nodeA.title} ↔ {gap.nodeB.title}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-[#A0A3B1] leading-snug">
                        {gap.rationale}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onFocusNode(gap.nodeA.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 text-[11px] text-slate-700 dark:text-[#E4E5EA] transition-colors"
                      >
                        定位节点
                      </button>
                      <button
                        onClick={() => onBridgeStructuralGap(gap)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-medium transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>建立跨群落知识桥接</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#141519]/80 text-xs text-slate-500 dark:text-[#8B8E9B]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>ExcaliBrain 模式下单击任意节点可将其设为四象限罗盘锚点</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Orbit className="w-3.5 h-3.5 text-sky-400" />
              <span>InfraNodus 模式下自动高亮跨社群结构洞脉冲桥</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#8B7CF6] hover:bg-[#7C6CE6] text-white font-medium transition-colors"
          >
            完成并查看画布
          </button>
        </div>
      </div>
    </div>
  );
};
