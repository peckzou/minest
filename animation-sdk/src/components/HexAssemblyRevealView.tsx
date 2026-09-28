import React, { useEffect, useRef, useState } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  OptimizedHexRevealScene,
  REVEAL_PHASES,
  RevealPhaseInfo,
} from '../three/OptimizedHexRevealScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  Layers,
  Award,
  ArrowRight,
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
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OptimizedHexRevealScene(containerRef.current, sharedMaterials);
    scene.playbackSpeed = 0.5;
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
  }, [sharedMaterials]);

  // Synchronize timeline scrubber in UI
  useEffect(() => {
    let animId: number;
    const sync = () => {
      if (sceneRef.current) {
        setCurrentTimeMs(sceneRef.current.currentTimeMs);
        setIsPlaying(sceneRef.current.isPlaying);
      }
      animId = requestAnimationFrame(sync);
    };
    animId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleStartReveal = () => {
    if (!sceneRef.current) return;
    setIsCompleted(false);
    sceneRef.current.restart();
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (!sceneRef.current) return;
    if (sceneRef.current.isPlaying) {
      sceneRef.current.pause();
      setIsPlaying(false);
    } else {
      sceneRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!sceneRef.current) return;
    setIsCompleted(false);
    sceneRef.current.restart();
    setIsPlaying(true);
  };

  const handleScrub = (timeMs: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.seekTime(timeMs);
    setCurrentTimeMs(timeMs);
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (sceneRef.current) {
      sceneRef.current.playbackSpeed = speed;
    }
  };

  const handleJumpToPhase = (phase: RevealPhaseInfo) => {
    if (!sceneRef.current) return;
    sceneRef.current.seekTime(phase.timeRange[0] + 10);
    setCurrentPhaseIndex(phase.phaseIndex);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 3D Viewport Column */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Main 3D Canvas Box */}
        <div className="relative w-full h-[460px] sm:h-[540px] rounded-3xl bg-gradient-to-b from-[#0c1017] via-[#080b10] to-[#040608] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
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

          {/* Bottom Floating Action Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 pointer-events-none">
            {/* Celebration Banner when completed */}
            {isCompleted && (
              <div className="mx-auto bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 text-xs font-semibold text-amber-200 pointer-events-auto shadow-lg animate-bounce flex-wrap justify-center">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>🎉 勋章解构破茧化形完成！已解锁入库</span>
                </div>
                {onNavigateToBadgeWall && (
                  <button
                    onClick={onNavigateToBadgeWall}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-[11px] hover:brightness-105 active:scale-95 flex items-center gap-1 shadow-md transition-all"
                  >
                    <span>收入 Badge Wall (Pokémon GO 归位)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={handleStartReveal}
                  className="px-4 py-2 rounded-full bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPlaying ? '重播仪式' : '启动六边形解锁仪式'}</span>
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                  title={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                  title="重置至起始点"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-[#121620]/80 backdrop-blur-md border border-white/10 p-1 rounded-full pointer-events-auto">
                {[0.5, 1.0, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetSpeed(s)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all ${
                      playbackSpeed === s
                        ? 'bg-[#00f0ff] text-black font-bold shadow-sm'
                        : 'text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Timeline Scrubber */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="font-semibold text-white">动画时间轴精确逐帧拖拽 (Timeline Scrubber)</span>
            </div>
            <span className="font-mono text-[#00f0ff]">
              {Math.round(currentTimeMs)} ms / 3640 ms
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0"
              max="3640"
              step="10"
              value={currentTimeMs}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer h-2 bg-[#181e28] rounded-lg appearance-none"
            />
          </div>

          {/* Phase Markers along Timeline */}
          <div className="grid grid-cols-6 gap-1 pt-1">
            {REVEAL_PHASES.map((p) => {
              const isCurrent = p.phaseIndex === currentPhaseIndex;
              return (
                <button
                  key={p.phaseIndex}
                  onClick={() => handleJumpToPhase(p)}
                  className={`py-1 px-1.5 rounded-lg text-center transition-all border ${
                    isCurrent
                      ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-white font-semibold'
                      : 'bg-[#181e28]/40 border-white/5 text-[#8e8e93] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="text-[10px] uppercase truncate">P{p.phaseIndex}</div>
                  <div className="text-[9px] truncate text-[#8e8e93]">{p.name}</div>
                </button>
              );
            })}
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
                  onClick={() => handleJumpToPhase(phase)}
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
