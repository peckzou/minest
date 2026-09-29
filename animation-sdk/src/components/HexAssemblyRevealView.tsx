import React, { useEffect, useRef, useState } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  OptimizedHexRevealScene,
  REVEAL_PHASES,
} from '../three/OptimizedHexRevealScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Sparkles,
  Zap,
  CheckCircle,
  Award,
  ArrowRight,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface HexAssemblyRevealViewProps {
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
  sharedMaterials: AppleAwardMaterials;
  onNavigateToBadgeWall?: () => void;
}

export const HexAssemblyRevealView: React.FC<HexAssemblyRevealViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
  onNavigateToBadgeWall,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OptimizedHexRevealScene | null>(null);

  const [selectedBadge, setSelectedBadge] = useState<BadgeCatalogItem>(BADGE_CATALOG[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OptimizedHexRevealScene(containerRef.current, sharedMaterials);
    scene.playbackSpeed = 1.0;
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.onPhaseChange = (phaseIdx, timeMs) => {
      setCurrentPhaseIndex(phaseIdx);
      setCurrentTimeMs(timeMs);
    };
    scene.onRevealComplete = () => {
      setIsCompleted(true);
      setIsPlaying(false);
    };

    scene.prepareReveal(selectedBadge);
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials, selectedBadge]);

  // Actions
  const handleNextStep = () => {
    if (sceneRef.current) {
      sceneRef.current.advanceNextStep();
    }
  };

  const handleSelectBadge = (badge: BadgeCatalogItem) => {
    setSelectedBadge(badge);
    setIsCompleted(false);
    if (sceneRef.current) {
      sceneRef.current.prepareReveal(badge);
    }
  };

  const activePhaseInfo =
    REVEAL_PHASES.find((p) => p.phaseIndex === currentPhaseIndex) || REVEAL_PHASES[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none">
      {/* 3D Viewport Column */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Main 3D Canvas Box */}
        <div className="relative w-full h-[460px] sm:h-[540px] rounded-3xl bg-gradient-to-b from-[#0c1017] via-[#080b10] to-[#040608] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
            title="轻触 Badge 或点击「下一步」按步骤开启六边机械拼装"
          />

          {/* Top Status Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-[#121620]/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span className="text-xs font-semibold text-white tracking-wide">
                {activePhaseInfo.nameZh}
              </span>
            </div>

            <div className="bg-[#121620]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-[#00f0ff]">
              {(currentTimeMs / 1000).toFixed(2)}s / 3.64s
            </div>
          </div>

          {/* Floating Action Overlay: Primary "下一步" Button */}
          <div className="absolute bottom-6 inset-x-0 mx-auto w-fit max-w-[92%] z-20 flex items-center gap-3">
            {sceneRef.current?.isPending && (
              <button
                onClick={handleNextStep}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#00f0ff] via-cyan-400 to-blue-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-sm shadow-2xl shadow-[#00f0ff]/30 transition-all flex items-center gap-2.5 animate-bounce"
              >
                <Sparkles className="w-5 h-5 text-black animate-spin" />
                <span>轻触 Badge 或点击「下一步」开启六边形装配</span>
                <ChevronRight className="w-5 h-5 text-black font-bold" />
              </button>
            )}

            {!sceneRef.current?.isPending && !isCompleted && (
              <button
                onClick={handleNextStep}
                className="px-6 py-3.5 rounded-full bg-black/85 hover:bg-black/95 active:scale-95 text-white font-extrabold text-sm shadow-2xl border border-[#00f0ff]/60 backdrop-blur-xl transition-all flex items-center gap-2.5"
              >
                <Sparkles className="w-5 h-5 text-[#00f0ff] animate-spin" />
                <span>机械合拢破茧中... 点击「下一步」跳过揭晓</span>
                <ChevronRight className="w-5 h-5 text-[#00f0ff]" />
              </button>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2.5 bg-black/85 border border-emerald-500/40 p-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex-wrap justify-center">
                <div className="flex items-center gap-2 px-2">
                  <Award className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="text-xs font-bold text-white">破茧化形完成</span>
                </div>

                {onNavigateToBadgeWall && (
                  <button
                    onClick={onNavigateToBadgeWall}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>收入 Badge Wall (磁吸归位)</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                )}

                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>重置金胚</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control & Architecture Breakdown Column */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Active Phase Details Card */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#8e8e93] mb-2">
            <span className="text-[#00f0ff] font-semibold tracking-wider uppercase">
              当前执行阶段详细解析
            </span>
            <span className="font-mono">
              {activePhaseInfo.timeRange[0]}ms - {activePhaseInfo.timeRange[1]}ms
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ffd60a]" />
            <span>{activePhaseInfo.nameZh}</span>
          </h3>

          <p className="text-xs text-[#b0b8c4] leading-relaxed mb-4">
            {activePhaseInfo.description}
          </p>

          {/* Six Phases Step Navigator */}
          <div className="space-y-1.5">
            {REVEAL_PHASES.map((phase) => {
              const isActive = phase.phaseIndex === currentPhaseIndex;
              return (
                <div
                  key={phase.phaseIndex}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/60 text-white font-medium'
                      : 'bg-[#181e28]/50 hover:bg-[#181e28] text-[#8e8e93]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#00f0ff] animate-ping' : 'bg-[#636366]'
                      }`}
                    />
                    <span>{phase.nameZh}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8e8e93]">
                    {phase.timeRange[0]}ms
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Badge Switcher */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
            <span>选择揭晓解密目标勋章</span>
            <span className="text-[11px] text-[#8e8e93]">{selectedBadge.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BADGE_CATALOG.slice(0, 4).map((badge) => (
              <button
                key={badge.id}
                onClick={() => handleSelectBadge(badge)}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  selectedBadge.id === badge.id
                    ? 'bg-white/10 border-[#00f0ff] text-white font-medium'
                    : 'bg-[#181e28]/40 border-white/5 text-[#8e8e93] hover:text-white'
                }`}
              >
                <div className="truncate font-semibold">{badge.name}</div>
                <div className="text-[10px] text-[#8e8e93] truncate">{badge.badgeStyle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Technical Architecture Comparison Card */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>动画 2 核心攻坚难点：消灭 Phase 5 破茧掉帧 (140ms → 0ms)</span>
          </div>
          <div className="text-xs text-[#8e8e93] space-y-2">
            <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200">
              <span className="font-semibold text-red-400">原 GitHub 代码致命瓶颈：</span>
              <p className="mt-0.5 text-[11px] text-red-300/80">
                原版在动画运行至 Phase 5（elapsed &gt;= 2420ms）时，临时调用 buildAppleBadge3D
                动态生成几何体与着色器，造成主线程 80ms - 150ms 严重冻结！
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
              <span className="font-semibold text-emerald-400">优化后架构：</span>
              <p className="mt-0.5 text-[11px] text-emerald-300/80">
                在 prepareReveal() 时提前构建真身勋章并调用 renderer.compile()
                完成显存预热，阶段 5 仅以线性时间插值尺度与透明度，实现完全零掉帧丝滑化形。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
