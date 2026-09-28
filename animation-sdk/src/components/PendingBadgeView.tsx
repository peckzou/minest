import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  OptimizedHexRevealScene,
  REVEAL_PHASES,
  RevealPhaseInfo,
} from '../three/OptimizedHexRevealScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Gift,
  Zap,
  ArrowRight,
  Layers,
  Award,
  FastForward,
  Flame,
} from 'lucide-react';

interface PendingBadgeViewProps {
  onMetricsUpdate?: (m: PerformanceMetrics) => void;
  sharedMaterials?: AppleAwardMaterials;
  onNavigateToReveal?: () => void;
  onNavigateToBadgeWall?: () => void;
}

export const PendingBadgeView: React.FC<PendingBadgeViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
  onNavigateToBadgeWall,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OptimizedHexRevealScene | null>(null);

  // States
  const [isPending, setIsPending] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeCatalogItem>(BADGE_CATALOG[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize Unified 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const mats = sharedMaterials || new AppleAwardMaterials();
    const scene = new OptimizedHexRevealScene(containerRef.current, mats);
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

    scene.onPendingStateChange = (pending) => {
      setIsPending(pending);
      if (pending) {
        setIsCompleted(false);
        setIsPlaying(false);
        setCurrentTimeMs(0);
        setCurrentPhaseIndex(1);
      }
    };

    scene.prepareReveal(selectedBadge);
    scene.resetToPending();
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials, selectedBadge]);

  // Synchronize timeline scrubber in UI
  useEffect(() => {
    let animId: number;
    const sync = () => {
      if (sceneRef.current) {
        if (!sceneRef.current.isPending) {
          setCurrentTimeMs(sceneRef.current.currentTimeMs);
          setIsPlaying(sceneRef.current.isPlaying);
        }
      }
      animId = requestAnimationFrame(sync);
    };
    animId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Trigger Instant Reveal when user clicks the golden badge or button
  const handleTriggerReveal = useCallback(() => {
    if (!sceneRef.current) return;
    if (soundEnabled) {
      badgeAudio.playBracketSnap(0);
    }
    triggerHaptic('impact');

    setIsPending(false);
    setIsCompleted(false);
    sceneRef.current.triggerReveal();
  }, [soundEnabled]);

  // Reset back to Pending Golden Badge
  const handleResetToPending = useCallback(() => {
    if (!sceneRef.current) return;
    if (soundEnabled) {
      badgeAudio.playClick(0.9);
    }
    triggerHaptic('tap');

    setIsPending(true);
    setIsCompleted(false);
    setIsPlaying(false);
    setCurrentTimeMs(0);
    setCurrentPhaseIndex(1);
    sceneRef.current.resetToPending();
  }, [soundEnabled]);

  const handleTogglePlay = useCallback(() => {
    if (!sceneRef.current) return;
    if (sceneRef.current.isPlaying) {
      sceneRef.current.pause();
      setIsPlaying(false);
    } else {
      sceneRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handleSeek = (time: number) => {
    if (!sceneRef.current) return;
    setIsPending(false);
    sceneRef.current.seekTime(time);
    setCurrentTimeMs(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (sceneRef.current) {
      sceneRef.current.playbackSpeed = speed;
    }
  };

  const currentPhaseInfo = REVEAL_PHASES.find((p) => p.phaseIndex === currentPhaseIndex) || REVEAL_PHASES[0];

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
      {/* Top Banner & Control Deck */}
      <div className="bg-[#121620]/95 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title with Gold Tag */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 p-[1.5px] shrink-0 shadow-lg shadow-amber-400/25">
              <div className="w-full h-full bg-[#07090d] rounded-[10px] flex items-center justify-center">
                <Gift className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {isPending ? '待领取 3D 黄金勋章 (Pending State)' : '六边形机械装配破茧揭秘 (Reveal Ceremony)'}
                </h2>
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm">
                  {isPending ? '✨ 24K 金色闪耀 · 点击即刻揭秘' : '机械破茧装配中'}
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93] truncate mt-0.5">
                {isPending
                  ? '六边机械装配专属造型 · 24K 镜面黄金与闪烁星芒 · 6 卡槽导轨与中央锁闭核心 · 点击勋章立即触发机械拼装'
                  : currentPhaseInfo.nameZh}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isPending ? (
              <button
                onClick={handleTriggerReveal}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-95 text-black font-extrabold text-xs shadow-lg shadow-amber-400/30 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>立即领取并开启机械装配</span>
              </button>
            ) : (
              <button
                onClick={handleResetToPending}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>返回待领取金勋章</span>
              </button>
            )}

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-full bg-[#181e28] hover:bg-[#252f3f] border border-white/10 text-white transition-all active:scale-95"
              title={soundEnabled ? '音效开启' : '音效静音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8e8e93]" />
              )}
            </button>
          </div>
        </div>

        {/* Phase / Timeline Progress Sub-Bar (Visible during or after reveal) */}
        {!isPending && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#8e8e93]">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {currentPhaseInfo.nameZh}
              </span>
              <span className="font-mono text-[11px]">
                {(currentTimeMs / 1000).toFixed(2)}s / 3.64s
              </span>
            </div>

            {/* Scrub Slider */}
            <input
              type="range"
              min="0"
              max={3640}
              value={currentTimeMs}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />

            {/* Playback Controls & Speed Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? '暂停' : '播放'}</span>
                </button>
                <button
                  onClick={handleTriggerReveal}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重播揭秘</span>
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 bg-[#181e28] p-0.5 rounded-lg border border-white/10">
                {([0.5, 1.0, 2.0] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      playbackSpeed === spd
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 3D Canvas Stage (Clean: strictly NO background circles) */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[480px] sm:min-h-[560px] bg-[#07090d] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none group">
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          title={isPending ? '轻触金勋章 立即开启机械装配揭晓' : '可按住拖拽 360° 检视'}
        />

        {/* Pending State Glowing Callout Overlay */}
        {isPending && (
          <div
            onClick={handleTriggerReveal}
            className="absolute bottom-6 inset-x-0 mx-auto w-fit max-w-[90%] px-5 py-2.5 rounded-full bg-black/75 hover:bg-black/90 active:scale-95 border border-amber-400/40 backdrop-blur-xl shadow-2xl shadow-amber-400/20 cursor-pointer transition-all flex items-center gap-2.5 text-center select-none animate-bounce"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              轻触 24K 金勋章 · 立即开启 6 臂机械拼装与破茧揭晓
            </span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>
        )}

        {/* Real Badge Completed Congratulations Overlay */}
        {isCompleted && (
          <div className="absolute top-6 left-6 max-w-[90%] px-4 py-2.5 rounded-2xl bg-black/85 border border-emerald-500/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300 flex-wrap">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">勋章揭晓破茧完成 · 已归入陈列室</h4>
                <p className="text-[10px] text-[#8e8e93]">360° 检视背面金叶雕花，或一键前往陈列室体验磁吸归位</p>
              </div>
            </div>
            {onNavigateToBadgeWall && (
              <button
                onClick={onNavigateToBadgeWall}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-[11px] hover:brightness-105 active:scale-95 flex items-center gap-1 shadow-md transition-all shrink-0"
              >
                <span>前往 Badge Wall (磁吸归位)</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Badge Catalog Switcher (Select award to reveal) */}
      <div className="bg-[#121620]/80 border border-white/10 rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            预置揭晓的 Apple 官方成就勋章款式：
          </span>
          <span className="text-[11px] text-[#8e8e93]">
            已选择：<strong className="text-amber-400">{selectedBadge.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {BADGE_CATALOG.map((b) => {
            const isSel = selectedBadge.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBadge(b);
                  handleResetToPending();
                }}
                className={`p-2 rounded-xl text-left transition-all border ${
                  isSel
                    ? 'bg-amber-400/15 border-amber-400/50 shadow-md text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-[#8e8e93] hover:text-white'
                }`}
              >
                <div
                  className="w-full aspect-square rounded-lg mb-1.5 flex items-center justify-center font-bold text-sm shadow-inner"
                  style={{
                    backgroundColor: `#${b.primaryColor.toString(16).padStart(6, '0')}33`,
                    border: `1.5px solid #${b.secondaryColor.toString(16).padStart(6, '0')}`,
                  }}
                >
                  <Award
                    className="w-5 h-5"
                    style={{ color: `#${b.secondaryColor.toString(16).padStart(6, '0')}` }}
                  />
                </div>
                <div className="text-[11px] font-bold truncate">{b.name}</div>
                <div className="text-[9px] text-[#636366] truncate">{b.category}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Description Footnote Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white">纯粹主体 · 零背景圆圈</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              去除了背景圆盘网格与槽位光环，仅保留悬浮的 24K 金色外凸六边形金属主体，聚焦材质与高光。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white">金色高光与闪耀星芒</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              镜面倒角反射金光，6 个倒角顶点配置四芒星钻闪星斑，悬浮微摆时高光与星芒如珠宝般流动闪烁。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white">点击即刻无缝触发六边机械装配</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              点击金勋章无缝推进 6 臂机械卡槽飞入拼装、锁闭脉冲、超高速自转与黄金爆炸破茧揭晓，一气呵成。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
