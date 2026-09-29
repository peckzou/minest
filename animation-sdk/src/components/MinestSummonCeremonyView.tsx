import React, { useEffect, useRef, useState } from 'react';
import { MinestSummonScene } from '../three/MinestSummonScene';
import { MINEST_8_PHASES, MinestPhaseInfo } from '../three/MinestSummonTimelineEngine';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Layers,
  Clock,
  Compass,
  Crown,
} from 'lucide-react';

interface MinestSummonCeremonyViewProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const MinestSummonCeremonyView: React.FC<MinestSummonCeremonyViewProps> = ({
  onMetricsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MinestSummonScene | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new MinestSummonScene(containerRef.current);
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.onPhaseChange = (phaseIdx, timeMs) => {
      setCurrentPhaseIndex(phaseIdx);
      setCurrentTimeMs(timeMs);
    };
    scene.onComplete = () => {
      setIsCompleted(true);
      setIsPlaying(false);
    };

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [onMetricsUpdate]);

  useEffect(() => {
    let animId: number;
    const sync = () => {
      if (sceneRef.current && sceneRef.current.timeline) {
        setCurrentTimeMs(sceneRef.current.timeline.currentTimeMs);
        setIsPlaying(sceneRef.current.timeline.isPlaying);
      }
      animId = requestAnimationFrame(sync);
    };
    animId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleStartSummon = () => {
    if (!sceneRef.current) return;
    setIsCompleted(false);
    sceneRef.current.timeline.restart();
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (!sceneRef.current) return;
    if (sceneRef.current.timeline.isPlaying) {
      sceneRef.current.timeline.pause();
      setIsPlaying(false);
    } else {
      sceneRef.current.timeline.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!sceneRef.current) return;
    setIsCompleted(false);
    sceneRef.current.timeline.restart();
    setIsPlaying(true);
  };

  const handleScrub = (timeMs: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.timeline.seekTime(timeMs);
    setCurrentTimeMs(timeMs);
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (sceneRef.current) {
      sceneRef.current.timeline.playbackSpeed = speed;
    }
  };

  const handleJumpToPhase = (phase: MinestPhaseInfo) => {
    if (!sceneRef.current) return;
    sceneRef.current.timeline.seekTime(phase.timeRange[0] + 10);
    setCurrentPhaseIndex(phase.phaseIndex);
  };

  const handleResetOrientation = () => {
    if (sceneRef.current) {
      sceneRef.current.resetOrientation();
    }
  };

  const activePhase =
    MINEST_8_PHASES.find((p) => p.phaseIndex === currentPhaseIndex) || MINEST_8_PHASES[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 3D Visual Stage Column */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        {/* Main 3D Canvas Box - Responsive height for mobile viewport */}
        <div className="relative w-full h-[360px] sm:h-[480px] rounded-3xl bg-gradient-to-b from-[#0a1220] via-[#060b14] to-[#03060a] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
          />

          {/* Top Status Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="bg-[#0b1626]/90 backdrop-blur-md border border-[#00f0ff]/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                {activePhase.nameZh} · {activePhase.nameEn}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={handleResetOrientation}
                className="w-7 h-7 rounded-full bg-[#111d2e]/90 hover:bg-[#1a2d47] border border-white/10 text-white flex items-center justify-center transition-all active:scale-95"
                title="复位观察角度"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              <div className="bg-[#0b1626]/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-mono text-[#00f0ff]">
                {(currentTimeMs / 1000).toFixed(2)}s / 6.40s
              </div>
            </div>
          </div>

          {/* Bottom Floating Ceremony Bar */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
            {isCompleted && (
              <div className="mx-auto bg-gradient-to-r from-blue-600/40 via-amber-500/40 to-purple-600/40 border border-amber-400/50 backdrop-blur-md px-3.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-amber-200 pointer-events-auto animate-bounce shadow-xl">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>✨ 召唤礼毕！稀有 3D 皇冠勋章已收入个人 Badge Wall</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  onClick={handleStartSummon}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0075ff] via-[#00f0ff] to-[#ffd60a] text-black font-extrabold text-[11px] sm:text-xs shadow-xl transition-all active:scale-95 flex items-center gap-1 hover:brightness-110"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPlaying ? '重播召唤' : '启动召唤动画'}</span>
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                  title={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                  title="回到初始形态"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-0.5 bg-[#0b1626]/80 backdrop-blur-md border border-white/10 p-0.5 rounded-full pointer-events-auto">
                {[0.5, 1.0, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetSpeed(s)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-all ${
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

        {/* 8-Phase Scrubbing Timeline Slider */}
        <div className="bg-[#0b1626]/90 border border-white/10 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="font-bold text-white text-[11px] sm:text-xs">8 阶段逐帧时间轴精准把控</span>
            </div>
            <span className="font-mono text-[#00f0ff] text-[11px]">
              {Math.round(currentTimeMs)} ms / 6400 ms
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="6400"
            step="10"
            value={currentTimeMs}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="w-full accent-[#00f0ff] cursor-pointer h-1.5 bg-[#122238] rounded-lg appearance-none"
          />

          {/* 8 Phase Jump Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-0.5">
            {MINEST_8_PHASES.map((p) => {
              const isCurrent = p.phaseIndex === currentPhaseIndex;
              return (
                <button
                  key={p.phaseIndex}
                  onClick={() => handleJumpToPhase(p)}
                  className={`py-1 px-1 rounded-lg text-center transition-all border ${
                    isCurrent
                      ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white font-bold'
                      : 'bg-[#122238]/50 border-white/5 text-[#8e8e93] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono">P{p.phaseIndex}</div>
                  <div className="text-[9px] truncate">{p.nameZh.slice(2)}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Storyboard Architecture & Stage Inspector Column */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        {/* Active Phase Card */}
        <div className="bg-[#0b1626]/90 border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#8e8e93] mb-1.5">
            <span className="text-[#00f0ff] font-bold tracking-wider uppercase flex items-center gap-1 text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>设计草图阶段对应</span>
            </span>
            <span className="font-mono text-[11px]">
              {activePhase.timeRange[0]}ms ~ {activePhase.timeRange[1]}ms
            </span>
          </div>

          <h3 className="text-base font-extrabold text-white mb-1.5">
            {activePhase.nameZh} · {activePhase.nameEn}
          </h3>

          <p className="text-xs text-[#b8c6d8] leading-relaxed mb-3">
            {activePhase.summary}
          </p>

          {/* 8 Phases List Navigator */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {MINEST_8_PHASES.map((phase) => {
              const isActive = phase.phaseIndex === currentPhaseIndex;
              return (
                <div
                  key={phase.phaseIndex}
                  onClick={() => handleJumpToPhase(phase)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#0075ff]/20 border border-[#00f0ff]/60 text-white font-semibold shadow-sm'
                      : 'bg-[#122238]/40 hover:bg-[#122238] text-[#8e8e93]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#00f0ff] animate-ping' : 'bg-[#405470]'
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

        {/* Visual Design Elements Decomposition Card */}
        <div className="bg-[#0b1626]/90 border border-white/10 rounded-2xl p-3.5">
          <div className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#ffd60a]" />
            <span>核心元素拆解 (严格按照 4530E4C3 图纸实现)</span>
          </div>
          <div className="space-y-1.5 text-xs text-[#8e8e93]">
            <div className="p-2 rounded-xl bg-[#122238]/60 border border-white/5">
              <span className="text-white font-semibold">1. 六边形胚体：</span>
              <span className="text-[11px] ml-1">高透冰蓝水晶材质 (Transmission 0.75 + Octahedron 光核)。</span>
            </div>
            <div className="p-2 rounded-xl bg-[#122238]/60 border border-white/5">
              <span className="text-white font-semibold">2. 外围组件 x6：</span>
              <span className="text-[11px] ml-1">24K 金色装甲边框 + 镶嵌蔚蓝宝石晶体，带铆钉对齐锁扣。</span>
            </div>
            <div className="p-2 rounded-xl bg-[#122238]/60 border border-white/5">
              <span className="text-white font-semibold">3. 3D 黄金皇冠勋章 &amp; 收入 Badge Wall：</span>
              <span className="text-[11px] ml-1">真身 3D 皇冠带 3 颗蓝宝石与八角星芒，最后收纳至专属卡牌。</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
