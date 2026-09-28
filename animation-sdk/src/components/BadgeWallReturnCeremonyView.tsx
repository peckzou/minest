import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  OptimizedBadgeWallReturnScene,
  BadgeWallSpatialState,
} from '../three/OptimizedBadgeWallReturnScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  SpringPhysicsTelemetry,
} from '../utils/springPhysicsIntegrator';
import {
  Award,
  RotateCcw,
  Sparkles,
  Zap,
  MousePointerClick,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Layers,
  Flame,
  Volume2,
  VolumeX,
  Smartphone,
  Activity,
  Gauge,
} from 'lucide-react';
import { badgeAudio, triggerSpringOvershootHaptic } from '../utils/hapticsAndAudio';

interface BadgeWallReturnCeremonyViewProps {
  onMetricsUpdate?: (m: PerformanceMetrics) => void;
  sharedMaterials: AppleAwardMaterials;
  onNavigateToReveal?: () => void;
}

export const BadgeWallReturnCeremonyView: React.FC<BadgeWallReturnCeremonyViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
  onNavigateToReveal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OptimizedBadgeWallReturnScene | null>(null);

  const [spatialState, setSpatialState] = useState<BadgeWallSpatialState>('wall');
  const [activeBadge, setActiveBadge] = useState<BadgeCatalogItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [elasticity, setElasticity] = useState(1.0);
  const [vibration, setVibration] = useState(1.0);
  const [hapticActive, setHapticActive] = useState(false);
  const [telemetry, setTelemetry] = useState<SpringPhysicsTelemetry | null>(null);

  // Initialize Unified 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OptimizedBadgeWallReturnScene(containerRef.current, sharedMaterials);
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.playbackSpeed = playbackSpeed;
    scene.overshootElasticity = elasticity;
    scene.vibrationIntensity = vibration;

    scene.onStateChange = (state, badge) => {
      setSpatialState(state);
      if (badge) setActiveBadge(badge);

      if (state === 'magnetic_snap') {
        setHapticActive(true);
        setTimeout(() => setHapticActive(false), 350);
      }
    };

    scene.onPhysicsTelemetry = (data) => {
      setTelemetry({ ...data });
      if (data.hapticImpulseActive) {
        setHapticActive(true);
      } else {
        setHapticActive(false);
      }
    };

    scene.onSelectBadge = (badge) => {
      setActiveBadge(badge);
    };

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials, onMetricsUpdate]);

  // Sync physics tuning values to active scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.playbackSpeed = playbackSpeed;
      sceneRef.current.overshootElasticity = elasticity;
      sceneRef.current.vibrationIntensity = vibration;
    }
  }, [playbackSpeed, elasticity, vibration]);

  // Click slot directly
  const handleSelectSlot = (slotIdx: number) => {
    if (sceneRef.current) {
      sceneRef.current.triggerFlyOut(slotIdx);
    }
  };

  // Close / Return to Badge Wall (The Pokémon GO style sequence!)
  const handleReturnToWall = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.triggerReturnToWall();
    }
  }, []);

  // Flip 180° in inspect mode
  const handleToggleFlip = () => {
    if (sceneRef.current) {
      sceneRef.current.toggleFlip();
    }
  };

  // Test Direct Return from Mechanical Assembly
  const handleTestMechanicalReturn = (badge: BadgeCatalogItem) => {
    if (sceneRef.current) {
      sceneRef.current.stageFromMechanicalReveal(badge);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Banner & Control Deck                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="bg-[#121620]/95 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Mode Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 p-[1.5px] shrink-0 shadow-lg shadow-amber-400/25">
            <div className="w-full h-full bg-[#07090d] rounded-[10px] flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Apple Fitness 徽章陈列室 (Badge Wall &amp; Return System)
              </h2>
              {/* Dynamic State Pill */}
              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm">
                {spatialState === 'wall' && '🏛️ 徽章墙全景浏览态'}
                {spatialState === 'flying_out' && '🚀 向前飞出放大中…'}
                {spatialState === 'inspect' && '🔍 3D 中央特写赏玩中'}
                {spatialState === 'pull_back' && '🧲 开始回收：拉伸预备'}
                {spatialState === 'flying_back' && '🌀 飞回 Badge Wall 轨迹中'}
                {spatialState === 'magnetic_snap' && '⚡ 磁吸精准吸附 SNAP!'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e8e93] truncate mt-0.5">
              类似 Pokémon GO 空间归属感：点击飞出至眼前 · 关闭沿 3D 轨迹自转飞回 · 精准磁吸吸附入槽
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {spatialState === 'inspect' ? (
            <button
              onClick={handleReturnToWall}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-95 text-black font-extrabold text-xs shadow-lg shadow-amber-400/30 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>收回徽章墙 (Return to Wall)</span>
            </button>
          ) : (
            <button
              onClick={() => handleSelectSlot(0)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
              <span>点击飞出首款勋章</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerSpringOvershootHaptic(elasticity);
              setHapticActive(true);
              setTimeout(() => setHapticActive(false), 300);
            }}
            className={`p-2 rounded-full border transition-all active:scale-95 ${
              hapticActive
                ? 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/40 animate-pulse'
                : 'bg-[#181e28] hover:bg-[#252f3f] border-white/10 text-amber-400'
            }`}
            title="测试磁吸 Spring Overshoot 触觉振动 (navigator.vibrate)"
          >
            <Smartphone className="w-4 h-4" />
          </button>

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
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Main 3D Canvas Stage (Continuous Spatial World)                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[480px] sm:min-h-[580px] bg-[#07090e] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none group">
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className={`w-full h-full ${
            spatialState === 'inspect' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        />

        {/* ── State Prompt: Wall Mode ── */}
        {spatialState === 'wall' && (
          <div className="absolute bottom-6 inset-x-0 mx-auto w-fit max-w-[90%] px-5 py-2.5 rounded-full bg-black/80 hover:bg-black/90 active:scale-95 border border-amber-400/40 backdrop-blur-xl shadow-2xl shadow-amber-400/20 cursor-pointer transition-all flex items-center gap-2.5 text-center select-none animate-bounce">
            <MousePointerClick className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              轻触墙面任意勋章 · 飞至眼前 3D 赏玩 · 关闭即享磁吸归位
            </span>
          </div>
        )}

        {/* ── State Floating Card: Inspect Mode ── */}
        {spatialState === 'inspect' && activeBadge && (
          <div className="absolute top-6 left-6 max-w-[320px] bg-[#0c1017]/90 backdrop-blur-2xl border border-amber-400/30 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200 z-30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {activeBadge.category}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">{activeBadge.name}</h3>
                <p className="text-[11px] text-[#8e8e93] leading-relaxed mt-1">
                  {activeBadge.description}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: `#${activeBadge.primaryColor.toString(16).padStart(6, '0')}33`,
                  border: `1.5px solid #${activeBadge.secondaryColor.toString(16).padStart(6, '0')}`,
                }}
              >
                <Award
                  className="w-4 h-4"
                  style={{ color: `#${activeBadge.secondaryColor.toString(16).padStart(6, '0')}` }}
                />
              </div>
            </div>

            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {activeBadge.stats}
            </div>

            {/* Inspect Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleReturnToWall}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 active:scale-95 text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 fill-black" />
                <span>收回徽章墙</span>
              </button>
              <button
                onClick={handleToggleFlip}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-bold text-xs transition-all flex items-center gap-1"
                title="翻转至背面检视镌刻"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>180°翻面</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Magnetic Snap Flash Floating Pill ── */}
        {(spatialState === 'flying_back' || spatialState === 'magnetic_snap') && (
          <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/85 border border-amber-400/50 backdrop-blur-xl shadow-2xl flex items-center gap-2 animate-in fade-in duration-150 z-30">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-amber-300">
              {spatialState === 'flying_back'
                ? '3D 轨迹自转飞回原位…'
                : '⚡ 磁吸精准归位 + Spring 弹性回弹 (Overshoot) 物理震动！'}
            </span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Spring Overshoot Physics & Trajectory Tuning Bar                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>基于 rAF 的物理积分器 (Mass-Spring-Damper ODE &amp; 毫秒级触觉同步)</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Zero-Latency Sync
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93] mt-0.5">
                质量 m: 0.85kg · 刚度 k: 380 N/m · 阻尼 c: 24 N·s/m · 在极值反折点与零交叉点对齐触觉脉冲
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Playback speed selector */}
            <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-mono text-[#8e8e93] px-1.5">速度:</span>
              {[1.0, 0.5, 0.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-[#8e8e93] hover:text-white'
                  }`}
                  title={spd === 0.25 ? '0.25x 极慢速观察 Spring Overshoot 轨迹' : `${spd}x 速率`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Elasticity Preset */}
            <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-mono text-[#8e8e93] px-1.5">弹性:</span>
              {[
                { val: 0.6, label: '轻微' },
                { val: 1.0, label: '标准' },
                { val: 1.6, label: '增强微震' },
              ].map((el) => (
                <button
                  key={el.val}
                  onClick={() => setElasticity(el.val)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    elasticity === el.val
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Physics Telemetry Meters */}
        {telemetry && spatialState === 'magnetic_snap' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono animate-in fade-in duration-150">
            <div className="bg-[#0a0d14] p-2 rounded-xl border border-white/5">
              <div className="text-[#8e8e93] text-[10px]">位移 Displacement (x)</div>
              <div className="text-amber-400 font-bold text-xs mt-0.5">
                {(telemetry.displacement >= 0 ? '+' : '') + telemetry.displacement.toFixed(4)}
              </div>
            </div>
            <div className="bg-[#0a0d14] p-2 rounded-xl border border-white/5">
              <div className="text-[#8e8e93] text-[10px]">速度 Velocity (v)</div>
              <div className="text-cyan-400 font-bold text-xs mt-0.5">
                {telemetry.velocity.toFixed(3)} u/s
              </div>
            </div>
            <div className="bg-[#0a0d14] p-2 rounded-xl border border-white/5">
              <div className="text-[#8e8e93] text-[10px]">加速度 Accel (a)</div>
              <div className="text-purple-400 font-bold text-xs mt-0.5">
                {telemetry.acceleration.toFixed(1)} u/s²
              </div>
            </div>
            <div className="bg-[#0a0d14] p-2 rounded-xl border border-white/5">
              <div className="text-[#8e8e93] text-[10px]">总机械能 Total Energy</div>
              <div className="text-emerald-400 font-bold text-xs mt-0.5">
                {telemetry.totalEnergy.toFixed(3)} J
              </div>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              telemetry.hapticImpulseActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold animate-pulse'
                : 'bg-[#0a0d14] border-white/5 text-[#8e8e93]'
            }`}>
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <div className="truncate">
                {telemetry.hapticImpulseActive ? '⚡ 触觉脉冲同步激发' : '触觉待命'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Badge Quick Strip: Test Flying Any Badge                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#121620]/80 border border-white/10 rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            收藏室全部 5 款 Apple 3D 成就勋章（点击快速唤出或模拟机械揭秘收回）：
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {BADGE_CATALOG.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => handleSelectSlot(idx)}
              className="p-2.5 rounded-xl text-left bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 hover:border-amber-400/40 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `#${b.primaryColor.toString(16).padStart(6, '0')}33`,
                    border: `1.5px solid #${b.secondaryColor.toString(16).padStart(6, '0')}`,
                  }}
                >
                  <Award
                    className="w-4 h-4"
                    style={{ color: `#${b.secondaryColor.toString(16).padStart(6, '0')}` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  槽位 #{idx + 1}
                </span>
              </div>
              <div className="text-xs font-bold text-white truncate">{b.name}</div>
              <div className="text-[10px] text-[#8e8e93] truncate mt-0.5">{b.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5-Step Pokémon GO Style Spatial Transition Explanation Cards         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white">1. 开始回收 (Tilt &amp; Pull-back)</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              点击关闭后，中央勋章先向后轻微倾斜（Tilt Back）与拉回，如同受到远方专属槽位的引力牵引。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white">2. 3D 轨迹自转飞回 (Near to Far)</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              沿 3D 空间抛物线平滑缩小，伴随快速而清晰的 3D 自转与镜面高光流转；同时徽章墙同步从景深中恢复清晰。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/60 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-white">3. 精准磁吸归位 (SNAP! Micro-bounce)</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              最后 10% 距离加速磁吸嵌回专属槽位，微弹恢复（Tiny Settle），伴随清脆金属机械锁闭声与触觉震动反馈。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
