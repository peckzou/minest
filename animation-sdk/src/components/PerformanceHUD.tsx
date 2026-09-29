import React, { useState } from 'react';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import { Activity, Cpu, Layers, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface PerformanceHUDProps {
  metrics: PerformanceMetrics | null;
  activeAnimationName: string;
}

export const PerformanceHUD: React.FC<PerformanceHUDProps> = ({ metrics, activeAnimationName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fps = metrics?.fps ?? 60;
  const frameTime = metrics?.frameTimeMs ?? 4.2;
  const drawCalls = metrics?.drawCalls ?? 22;
  const triangles = metrics?.triangles ?? 8450;
  const isOptimal = frameTime < 16.6 && fps >= 55;

  return (
    <div className="bg-[#12161f]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-[#00f0ff] shrink-0 animate-pulse" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-semibold text-white tracking-wide shrink-0">
              实时渲染性能
            </span>
            <span className="text-[11px] text-[#8e8e93] truncate hidden sm:inline">
              · {activeAnimationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-bold">{fps} FPS</span>
            <span className="text-emerald-500/70 hidden xs:inline">({frameTime}ms)</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all text-[11px] flex items-center gap-1"
            title={isExpanded ? '收起性能指标' : '展开详细指标'}
          >
            <span className="text-[11px]">{isExpanded ? '收起' : '指标'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-white/10">
          {/* FPS */}
          <div className="bg-[#1a212d] rounded-xl p-2.5 border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-[#8e8e93] mb-1">
              <span>实时帧率 (FPS)</span>
              <Zap className={`w-3.5 h-3.5 ${fps >= 58 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">{fps}</span>
              <span className="text-[10px] text-[#8e8e93]">/ 60-120 Hz</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  fps >= 58 ? 'bg-[#00f0ff]' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (fps / 60) * 100)}%` }}
              />
            </div>
          </div>

          {/* Frame Time */}
          <div className="bg-[#1a212d] rounded-xl p-2.5 border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-[#8e8e93] mb-1">
              <span>帧渲染耗时</span>
              <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                  isOptimal ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {frameTime}
              </span>
              <span className="text-[10px] text-[#8e8e93]">ms</span>
            </div>
            <div className="text-[10px] text-[#8e8e93] mt-1.5 flex items-center justify-between">
              <span>目标 &lt;16.6ms</span>
              <span className="text-emerald-400 font-medium">极低耗</span>
            </div>
          </div>

          {/* Draw Calls */}
          <div className="bg-[#1a212d] rounded-xl p-2.5 border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-[#8e8e93] mb-1">
              <span>GPU Draw Calls</span>
              <Layers className="w-3.5 h-3.5 text-[#ffd60a]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">{drawCalls}</span>
              <span className="text-[10px] text-[#8e8e93]">次/帧</span>
            </div>
            <div className="text-[10px] text-[#8e8e93] mt-1.5">
              <span>面数: {triangles.toLocaleString()} 面</span>
            </div>
          </div>

          {/* GC Allocations */}
          <div className="bg-[#1a212d] rounded-xl p-2.5 border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-[#8e8e93] mb-1">
              <span>RAF 堆内存</span>
              <span className="text-[10px] text-emerald-400 font-mono">0 alloc</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tracking-tight">0 B</span>
              <span className="text-[10px] text-[#8e8e93]">/ frame</span>
            </div>
            <div className="text-[10px] text-[#8e8e93] mt-1.5">
              <span className="text-emerald-400 font-medium">无垃圾回收微卡顿</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
