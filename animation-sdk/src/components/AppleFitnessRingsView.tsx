import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Compass,
  FlameKindling,
  SlidersHorizontal,
  Award,
  ChevronRight,
  Bookmark,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  MousePointerClick,
  RotateCw,
  Cpu,
} from 'lucide-react';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import {
  OptimizedRings3DScene,
  Rings3DSpinSpeed,
  RingsLODMode,
  RingsPerformanceMetrics,
} from '../three/OptimizedRings3DScene';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';

export interface RingConfig {
  id: 'move' | 'exercise' | 'stand';
  label: string;
  labelZh: string;
  current: number;
  goal: number;
  unit: string;
  gradientStart: string;
  gradientEnd: string;
  trackColor: string;
  glowColor: string;
  radius: number;
  width: number;
}

export type FitnessCelebrationStage =
  | 'head'      // 片头常驻态：2D 原生微光三环，就绪待触发
  | 'closing'   // 阶段1：三环加速平滑闭合
  | 'erupting'  // 阶段2：2,200+ 铁花喷发暴烈展示
  | 'spinning'  // 阶段3：3D 空间立体自转与离心火花
  | 'tail';     // 片尾常驻态：3D 浮雕制动回正 + 官方全闭合结算荣誉卡片常驻

// Initial standby state: Native 2D presentation at 85%, 90%, 75%
const DEFAULT_RINGS: RingConfig[] = [
  {
    id: 'move',
    label: 'Move',
    labelZh: '活动',
    current: 510,
    goal: 600,
    unit: 'CAL',
    gradientStart: '#ff1453',
    gradientEnd: '#ff375f',
    trackColor: 'rgba(255, 20, 83, 0.28)',
    glowColor: 'rgba(255, 55, 95, 0.55)',
    radius: 340,
    width: 58,
  },
  {
    id: 'exercise',
    label: 'Exercise',
    labelZh: '锻炼',
    current: 27,
    goal: 30,
    unit: 'MIN',
    gradientStart: '#a6ff00',
    gradientEnd: '#30d158',
    trackColor: 'rgba(48, 209, 88, 0.28)',
    glowColor: 'rgba(48, 209, 88, 0.55)',
    radius: 268,
    width: 58,
  },
  {
    id: 'stand',
    label: 'Stand',
    labelZh: '站立',
    current: 9,
    goal: 12,
    unit: 'HRS',
    gradientStart: '#00f0ff',
    gradientEnd: '#0a84ff',
    trackColor: 'rgba(0, 240, 255, 0.28)',
    glowColor: 'rgba(10, 132, 255, 0.55)',
    radius: 196,
    width: 58,
  },
];

interface AppleFitnessRingsViewProps {
  onMetricsUpdate?: (metrics: RingsPerformanceMetrics) => void;
  sharedMaterials?: AppleAwardMaterials;
  minestProgress?: [number, number, number];
}

export const AppleFitnessRingsView: React.FC<AppleFitnessRingsViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
  minestProgress,
}) => {
  // DOM Viewport Ref
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const scene3DRef = useRef<OptimizedRings3DScene | null>(null);

  // Core Stage: 片头 (head) -> 闭合 (closing) -> 喷发 (erupting) -> 持续自转 (spinning)
  const [celebrationStage, setCelebrationStage] = useState<FitnessCelebrationStage>('head');
  const handleRingExitRef = useRef<() => void>(() => {});
  const closureFrameRef = useRef<number | null>(null);
  const hasAutoStartedRef = useRef(false);
  const isExitingRef = useRef(false);
  const initialPct = useMemo<[number, number, number]>(() => minestProgress || [85, 90, 75], []);

  // Ring Data State (Initially in 2D Native presentation: 85%, 90%, 75%)
  const [rings, setRings] = useState<RingConfig[]>(() => minestProgress
    ? DEFAULT_RINGS.map((ring, index) => ({
        ...ring,
        label: ['Focus', 'Checks', 'Goal'][index],
        labelZh: ['专注', '完成', '目标'][index],
        current: minestProgress[index],
        goal: 100,
        unit: '%',
      }))
    : DEFAULT_RINGS);
  const [displayPct, setDisplayPct] = useState<[number, number, number]>(initialPct);
  const [isClosingAnim, setIsClosingAnim] = useState(false);

  // Check if all 3 rings are fully closed (>=100%)
  const areAllClosed = displayPct.every((p) => p >= 100);

  // 3D Spatial Self-Rotation States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState<Rings3DSpinSpeed>('turbo');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [motionBlurEnabled, setMotionBlurEnabled] = useState(true);
  const [motionBlurIntensity, setMotionBlurIntensity] = useState(1.0);
  const [radialBlurEnabled, setRadialBlurEnabled] = useState(true);
  const [radialBlurIntensity, setRadialBlurIntensity] = useState(1.0);
  const [envMapIntensity, setEnvMapIntensity] = useState(1.4);
  const [metalness, setMetalness] = useState(0.88);
  const [lodMode, setLodMode] = useState<RingsLODMode>('auto');
  const [flowFieldEnabled, setFlowFieldEnabled] = useState(true);
  const [flowFieldIntensity, setFlowFieldIntensity] = useState(1.0);
  const [brakeSparksEnabled, setBrakeSparksEnabled] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<RingsPerformanceMetrics | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Audio closure trackers
  const hasTriggeredClosureSoundRef = useRef<[boolean, boolean, boolean]>([false, false, false]);
  const stageTimersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllStageTimers = () => {
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
  };

  // Target percentages from user inputs
  const targetPct = useMemo(() => rings.map((r) =>
    Math.round((r.current / r.goal) * 100)
  ) as [number, number, number], [rings]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Initialize Three.js Scene with Controlled Bloom & Blacksmith Sparks
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!threeContainerRef.current) return;

    const scene3d = new OptimizedRings3DScene(threeContainerRef.current, sharedMaterials);
    scene3d.onMetricsUpdate = (m: RingsPerformanceMetrics) => {
      setLiveMetrics(m);
      onMetricsUpdate?.(m);
    };
    scene3d.isSpinning = isSpinning;
    scene3d.spinSpeed = spinSpeed;
    scene3d.motionBlurEnabled = motionBlurEnabled;
    scene3d.motionBlurIntensity = motionBlurIntensity;
    scene3d.radialBlurEnabled = radialBlurEnabled;
    scene3d.radialBlurIntensity = radialBlurIntensity;
    scene3d.envMapIntensity = envMapIntensity;
    scene3d.metalness = metalness;
    scene3d.lodMode = lodMode;
    scene3d.soundEnabled = soundEnabled;
    scene3d.flowFieldEnabled = flowFieldEnabled;
    scene3d.flowFieldIntensity = flowFieldIntensity;
    scene3d.brakeSparksEnabled = brakeSparksEnabled;
    scene3d.onTapRing = () => handleRingExitRef.current();
    scene3d.updateRingPercentages(displayPct[0], displayPct[1], displayPct[2], true);

    scene3DRef.current = scene3d;

    return () => {
      scene3d.destroy();
      scene3DRef.current = null;
      clearAllStageTimers();
      if (closureFrameRef.current !== null) cancelAnimationFrame(closureFrameRef.current);
    };
  }, [sharedMaterials]);

  // Sync spin speed & motion blur & HDRi reflection & LOD & Sound & Flow Field to scene
  useEffect(() => {
    if (!scene3DRef.current) return;
    scene3DRef.current.spinSpeed = spinSpeed;
    scene3DRef.current.isSpinning = isSpinning;
    scene3DRef.current.motionBlurEnabled = motionBlurEnabled;
    scene3DRef.current.motionBlurIntensity = motionBlurIntensity;
    scene3DRef.current.radialBlurEnabled = radialBlurEnabled;
    scene3DRef.current.radialBlurIntensity = radialBlurIntensity;
    scene3DRef.current.envMapIntensity = envMapIntensity;
    scene3DRef.current.metalness = metalness;
    scene3DRef.current.lodMode = lodMode;
    scene3DRef.current.soundEnabled = soundEnabled;
    scene3DRef.current.flowFieldEnabled = flowFieldEnabled;
    scene3DRef.current.flowFieldIntensity = flowFieldIntensity;
    scene3DRef.current.brakeSparksEnabled = brakeSparksEnabled;
  }, [isSpinning, spinSpeed, motionBlurEnabled, motionBlurIntensity, radialBlurEnabled, radialBlurIntensity, envMapIntensity, metalness, lodMode, soundEnabled, flowFieldEnabled, flowFieldIntensity, brakeSparksEnabled]);

  // Sync ring percentages live to scene
  useEffect(() => {
    if (scene3DRef.current) {
      scene3DRef.current.updateRingPercentages(displayPct[0], displayPct[1], displayPct[2], true);
    }
  }, [displayPct, isClosingAnim]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Trigger Blacksmith Molten Iron Sparks Eruption ("打铁花")
  // ─────────────────────────────────────────────────────────────────────────
  const triggerInstancedSparks = useCallback(
    (count: number = 2200) => {
      if (soundEnabled) {
        badgeAudio.playSparksEruption();
        badgeAudio.playBurst();
      }
      triggerHaptic('success');

      if (scene3DRef.current) {
        scene3DRef.current.spawnBlacksmithMoltenSparks(count);
      }
    },
    [soundEnabled]
  );

  const prevClosedRingsRef = useRef<[boolean, boolean, boolean]>([false, false, false]);
  const prevAllClosedRef = useRef<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 1.5 Reactive 3-Ring Closure Status Detection & Instant Fireworks Eruption
  // 检测三环闭合状态：满足条件即刻调用烟花粒子发射函数，并施加闭合瞬间环体高亮效果
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const isClosed0 = displayPct[0] >= 100;
    const isClosed1 = displayPct[1] >= 100;
    const isClosed2 = displayPct[2] >= 100;
    const isAllClosedNow = isClosed0 && isClosed1 && isClosed2;

    // Detect individual ring closure moments & trigger ring highlight glow + tip sparks
    if (isClosed0 && !prevClosedRingsRef.current[0]) {
      scene3DRef.current?.triggerRingHighlightGlow(0);
      scene3DRef.current?.spawnRingTipSparks(0, 280);
      if (soundEnabled) badgeAudio.playRingCloseSound(0);
      triggerHaptic('impact');
    }
    if (isClosed1 && !prevClosedRingsRef.current[1]) {
      scene3DRef.current?.triggerRingHighlightGlow(1);
      scene3DRef.current?.spawnRingTipSparks(1, 280);
      if (soundEnabled) badgeAudio.playRingCloseSound(1);
      triggerHaptic('impact');
    }
    if (isClosed2 && !prevClosedRingsRef.current[2]) {
      scene3DRef.current?.triggerRingHighlightGlow(2);
      scene3DRef.current?.spawnRingTipSparks(2, 280);
      if (soundEnabled) badgeAudio.playRingCloseSound(2);
      triggerHaptic('impact');
    }

    // Master 3-Ring Full Closure Condition Met!
    if (isAllClosedNow && !prevAllClosedRef.current) {
      // 1. Immediately invoke firework particle emission
      triggerInstancedSparks(2400);

      // 2. Trigger ring body highlight glow effect on all 3 rings
      scene3DRef.current?.triggerRingHighlightGlow(-1);

      // 3. Play master audio flourish & success haptic feedback
      if (soundEnabled) {
        badgeAudio.playAllRingsMasterFlourish();
        badgeAudio.playBurst();
      }
      triggerHaptic('success');
    }

    prevClosedRingsRef.current = [isClosed0, isClosed1, isClosed2];
    prevAllClosedRef.current = isAllClosedNow;
  }, [displayPct, soundEnabled, triggerInstancedSparks]);

  // Trigger Racing Carbon-Ceramic Brake Sparks ("赛车刹车铁火花")
  const triggerRacingBrakeSparks = useCallback(
    (count: number = 320, intensity: number = 1.0) => {
      if (scene3DRef.current) {
        scene3DRef.current.emitRacingBrakeSparks(count, intensity);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Staged Closure Celebration:
  //    片头 -> 一次闭合 -> 持续喷花与自转，直到用户点击三环主体减速退出。
  // ─────────────────────────────────────────────────────────────────────────
  const triggerFullClosureCelebration = useCallback(() => {
    clearAllStageTimers();
    if (closureFrameRef.current !== null) cancelAnimationFrame(closureFrameRef.current);
    hasAutoStartedRef.current = true;
    isExitingRef.current = false;
    setIsSpinning(false);
    setIsClosingAnim(true);
    setCelebrationStage('closing');
    hasTriggeredClosureSoundRef.current = [false, false, false];
    setDisplayPct([0, 0, 0]);

    if (scene3DRef.current) {
      scene3DRef.current.resetTo2DFlat();
    }

    const startTime = performance.now();
    const duration = 1200; // ms

    const animateClosure = (now: number) => {
      if (isExitingRef.current) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Staggered ring growth in flat 2D
      const p0 = Math.min(1, Math.max(0, elapsed / 1000));
      const p1 = Math.min(1, Math.max(0, (elapsed - 120) / 1000));
      const p2 = Math.min(1, Math.max(0, (elapsed - 240) / 1000));

      const ease0 = 1 - Math.pow(1 - p0, 3.0);
      const ease1 = 1 - Math.pow(1 - p1, 3.0);
      const ease2 = 1 - Math.pow(1 - p2, 3.0);

      const target0 = Math.max(100, targetPct[0]);
      const target1 = Math.max(100, targetPct[1]);
      const target2 = Math.max(100, targetPct[2]);

      const cur0 = Math.round(target0 * ease0);
      const cur1 = Math.round(target1 * ease1);
      const cur2 = Math.round(target2 * ease2);

      setDisplayPct([cur0, cur1, cur2]);

      // Frame-exact sound & localized particle burst per ring closure keyframe
      if (cur0 >= 100 && !hasTriggeredClosureSoundRef.current[0]) {
        hasTriggeredClosureSoundRef.current[0] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(0);
        triggerHaptic('impact');
        scene3DRef.current?.spawnRingTipSparks(0, 240);
      }
      if (cur1 >= 100 && !hasTriggeredClosureSoundRef.current[1]) {
        hasTriggeredClosureSoundRef.current[1] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(1);
        triggerHaptic('impact');
        scene3DRef.current?.spawnRingTipSparks(1, 240);
      }
      if (cur2 >= 100 && !hasTriggeredClosureSoundRef.current[2]) {
        hasTriggeredClosureSoundRef.current[2] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(2);
        triggerHaptic('impact');
        scene3DRef.current?.spawnRingTipSparks(2, 240);
      }

      if (progress < 1) {
        closureFrameRef.current = requestAnimationFrame(animateClosure);
      } else {
        closureFrameRef.current = null;
        setIsClosingAnim(false);

        // ─────────────────────────────────────────────────────────────────
        // 同步触发 3D 高速自转与 360° 持续烟花喷发 (零延迟)
        // ─────────────────────────────────────────────────────────────────
        setCelebrationStage('spinning');
        setIsSpinning(true);
        if (scene3DRef.current) {
          scene3DRef.current.triggerStagedClosureCelebration();
        }
      }
    };

    closureFrameRef.current = requestAnimationFrame(animateClosure);
  }, [targetPct, soundEnabled]);

  // Auto-trigger 3-ring completion fireworks celebration automatically on mount without clicking any switch!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasAutoStartedRef.current) triggerFullClosureCelebration();
    }, 300);
    return () => clearTimeout(timer);
  }, [triggerFullClosureCelebration]);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Quick Jump: 片头常驻 (Head) 与 片尾持续自转 (Continuous Spin)
  // ─────────────────────────────────────────────────────────────────────────
  const jumpToHeadStandby = useCallback(() => {
    clearAllStageTimers();
    if (closureFrameRef.current !== null) cancelAnimationFrame(closureFrameRef.current);
    closureFrameRef.current = null;
    isExitingRef.current = true;
    setIsClosingAnim(false);
    setIsSpinning(false);
    setCelebrationStage('head');
    setDisplayPct(initialPct);
    if (scene3DRef.current) {
      scene3DRef.current.resetToHeadState();
      scene3DRef.current.updateRingPercentages(initialPct[0], initialPct[1], initialPct[2], true);
    }
    triggerHaptic('selection');
  }, [initialPct]);

  // 片尾改为持续 3D 空间立体自转，全闭合绚丽旋转
  const jumpToTailContinuousSpin = useCallback(() => {
    clearAllStageTimers();
    if (closureFrameRef.current !== null) cancelAnimationFrame(closureFrameRef.current);
    closureFrameRef.current = null;
    isExitingRef.current = false;
    setIsClosingAnim(false);
    setIsSpinning(true);
    setCelebrationStage('spinning');
    setDisplayPct([100, 100, 100]);
    if (scene3DRef.current) {
      scene3DRef.current.updateRingPercentages(100, 100, 100, true);
      scene3DRef.current.triggerStagedClosureCelebration();
    }
    triggerHaptic('success');
  }, []);

  // 点击三环就退出自转态，平滑减速降速归零至静止状态
  const handleRingExit = useCallback(() => {
    if (isExitingRef.current) return;
    if (celebrationStage === 'spinning' || isSpinning || celebrationStage === 'erupting') {
      isExitingRef.current = true;
      setIsSpinning(false);
      if (scene3DRef.current) {
        scene3DRef.current.startSmoothDecelerationExit(() => {
          setCelebrationStage('tail');
          isExitingRef.current = false;
        });
      } else {
        jumpToHeadStandby();
      }
    }
  }, [celebrationStage, isSpinning, jumpToHeadStandby]);
  handleRingExitRef.current = handleRingExit;

  // Handle single ring slider change
  const handleRingValueChange = (index: number, val: number) => {
    const updated = [...rings];
    updated[index].current = Math.max(0, val);
    setRings(updated);

    const newPct = [...displayPct] as [number, number, number];
    newPct[index] = Math.round((val / updated[index].goal) * 100);
    setDisplayPct(newPct);

    // If newly reached 100% full closure, trigger staged celebration
    if (newPct.every((p) => p >= 100) && !areAllClosed) {
      triggerFullClosureCelebration();
    }
  };

  // Quick preset percentages
  const applyPreset = (pcts: [number, number, number]) => {
    const updated = [...rings];
    pcts.forEach((p, i) => {
      updated[i].current = Math.round((p / 100) * updated[i].goal);
    });
    setRings(updated);
    setDisplayPct(pcts);

    if (pcts.every((p) => p >= 100)) {
      triggerFullClosureCelebration();
    } else {
      jumpToHeadStandby();
    }
  };

  // Copy code for GitHub integration
  const handleCopyCode = () => {
    const code = `// =========================================================================
// Apple Fitness 3.0: 片头/片尾常驻 · 克制辉光 · 2,200+ 铁花喷发与 3D 自转
// 特性：端头与尾端常驻、全闭合分步喷发展示、片尾官方成就卡片常驻
// =========================================================================
import { OptimizedRings3DScene } from './three/OptimizedRings3DScene';

const scene = new OptimizedRings3DScene(container);
// 1. 片头常驻态 (Head Standby):
scene.resetToHeadState();
// 2. 引爆闭合庆典 (Closing -> 2200+ Sparks -> 3D Spin):
scene.triggerStagedClosureCelebration();
// 3. 片尾常驻态 (Tail Settle & Achievement Summary):
scene.settleToRestingTailState();`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className={'flex flex-col gap-4 max-w-6xl mx-auto w-full relative' + (minestProgress ? ' minest-rings-embed' : '')}>
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. 顶部常驻导航与状态栏 (Head Persistent Header / "头常驻")          */}
      {/* 无论如何滚动，头部的三环指标、流程进度与快捷入口永远常驻吸顶         */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-14 sm:top-16 z-30 bg-[#0c1017]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 transition-all">
        {/* Left: Brand & Stage Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff1453] via-[#ffd60a] to-[#00f0ff] p-[1.5px] shrink-0 shadow-lg shadow-[#ffd60a]/20">
            <div className="w-full h-full bg-[#07090d] rounded-[10px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Apple Fitness 4.0</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  v4.0 旗舰版
                </span>
              </h2>
              {/* Stage Pill Indicator */}
              <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    celebrationStage === 'head'
                      ? 'bg-emerald-400'
                      : celebrationStage === 'closing'
                      ? 'bg-amber-400 animate-pulse'
                      : celebrationStage === 'erupting'
                      ? 'bg-orange-500 animate-ping'
                      : celebrationStage === 'spinning'
                      ? 'bg-[#00f0ff] animate-spin'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                  }`}
                />
                <span className="text-slate-200 font-bold">
                  {celebrationStage === 'head' && '📌 片头常驻态 (Standby)'}
                  {celebrationStage === 'closing' && '⚡ 阶段1: 三环闭合中'}
                  {celebrationStage === 'erupting' && '💥 阶段2: 2,200+ 铁花喷发'}
                  {celebrationStage === 'spinning' && '🌀 阶段3: 3D涡轮自转'}
                  {celebrationStage === 'tail' && '🏆 片尾常驻态 (Achievement)'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#8e8e93] truncate hidden sm:block">
              切向动态运动模糊着色器 · 毫秒级粒子与闭合关键帧对齐 · 2,200+ 铁花地面弹跳 · Spring 阻尼回正
            </p>
          </div>
        </div>

        {/* Center: Live 3-Ring Mini Indicators */}
        <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1 text-[#ff375f]">
            <span className="w-2 h-2 rounded-full bg-[#ff375f]" />
            <span className="font-bold">{displayPct[0]}%</span>
            <span className="text-[10px] text-[#8e8e93]">活动</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1 text-[#30d158]">
            <span className="w-2 h-2 rounded-full bg-[#30d158]" />
            <span className="font-bold">{displayPct[1]}%</span>
            <span className="text-[10px] text-[#8e8e93]">锻炼</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1 text-[#00f0ff]">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
            <span className="font-bold">{displayPct[2]}%</span>
            <span className="text-[10px] text-[#8e8e93]">站立</span>
          </div>
        </div>

        {/* Right: Quick Head/Tail Switcher & Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {liveMetrics?.lodTier && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">{liveMetrics.lodTier}</span>
              <span className="text-[10px] text-purple-400/80 font-mono">({liveMetrics.lodDensityPct}%)</span>
            </div>
          )}

          <button
            onClick={jumpToHeadStandby}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border ${
              celebrationStage === 'head'
                ? 'bg-white/15 border-white/30 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-[#8e8e93] hover:text-white'
            }`}
            title="跳转到片头常驻态"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">片头态</span>
          </button>

          <button
            onClick={jumpToTailContinuousSpin}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border ${
              celebrationStage === 'spinning'
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-[#8e8e93] hover:text-white'
            }`}
            title="跳转到片尾持续自转态"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">持续自转</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-all active:scale-95 ${
              soundEnabled
                ? 'bg-[#00f0ff]/15 border-[#00f0ff]/30 text-[#00f0ff]'
                : 'bg-white/5 border-white/10 text-[#8e8e93]'
            }`}
            title={soundEnabled ? '音效开启' : '音效静音'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Main Grid: 3D Viewport on Left, Parameters & Sliders on Right         */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* 3D Visual Viewport Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Stage Canvas Box */}
          <div className="relative w-full h-[480px] sm:h-[540px] rounded-3xl bg-gradient-to-b from-[#0c1017] via-[#080b10] to-[#040608] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6 select-none">
            {/* Top Stage Overlay Header */}
            <div className="w-full flex items-center justify-between z-20">
              <div className="bg-[#121620]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    celebrationStage === 'spinning'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-[#00f0ff]'
                  }`}
                />
                <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>Apple Fitness 4.0 旗舰三环</span>
                  {celebrationStage === 'spinning' ? (
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      持续自转中 · 点击三环即退出
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      端头 &amp; 尾端常驻
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Interactive Three.js Viewport: 点击ring即可退出自转 */}
            <div
              className="relative w-full flex-1 flex items-center justify-center my-auto overflow-hidden"
            >
              <div
                ref={threeContainerRef}
                className={`w-full h-full touch-none select-none ${
                  celebrationStage === 'spinning'
                    ? 'cursor-pointer active:cursor-grabbing'
                    : 'cursor-default'
                }`}
              />

              {/* Center Counter Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center animate-in fade-in duration-300">
                <div className="text-[10px] uppercase tracking-widest text-[#8e8e93] font-semibold">
                  ACTIVITY RINGS
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                  {displayPct[0]}%
                </div>
                <div className="text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1 justify-center mt-0.5">
                  {celebrationStage === 'head' && <span>🟢 片头待闭合 · 2D 原生质感态</span>}
                  {celebrationStage === 'closing' && <span>⚡ 三环闭合中...</span>}
                  {celebrationStage === 'erupting' && <span>💥 2,200+ 铁花高速喷发!</span>}
                  {celebrationStage === 'spinning' && <span>🔥 3D 空间持续自转 · 点击三环退出</span>}
                </div>
              </div>

              {/* Floating Prompt When Spinning: 点击三环退出 */}
              {celebrationStage === 'spinning' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRingExit();
                  }}
                  className="absolute bottom-5 z-30 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl hover:bg-amber-500/25 transition-all hover:scale-105 active:scale-95 animate-bounce"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">点击三环退出自转</span>
                </button>
              )}

              {/* Dynamic Status Tooltip Pill */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#121620]/80 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-[10px] text-[#8e8e93] pointer-events-none flex items-center gap-1.5 whitespace-nowrap z-20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>
                  {celebrationStage === 'head' && '片头常驻：三环端头与尾端锚定 · 支持触控拉动与参数调节'}
                  {celebrationStage === 'closing' && '闭合进行中：三环平滑拉伸闭合'}
                  {celebrationStage === 'erupting' && '第一波：2,200+ 铁花正向暴烈喷发'}
                  {celebrationStage === 'spinning' && '第二波：3D 离心自转飞甩火花 · 点击三环退出'}
                </span>
              </div>
            </div>
          </div>

          {/* 3D Spin Speed & Forged Sparks Specs Card */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#ffd60a]" />
                <span className="text-xs font-bold text-white">3D 高速自转转速调节</span>
                <span className="text-[10px] text-slate-400">
                  (像六边形装配那样自转 · 离心甩出铁花)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#ffd60a]">
                {spinSpeed === 'normal'
                  ? '1.0x 优雅自转'
                  : spinSpeed === 'turbo'
                  ? '2.5x 极速涡轮自转'
                  : '4.5x 超光速狂暴自转'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'normal', label: '1.0x 优雅自转', desc: '克制微光 · 90°/s' },
                  { id: 'turbo', label: '2.5x 极速涡轮', desc: '铁花离心飞甩 · 200°/s' },
                  { id: 'hyper', label: '4.5x 超光速', desc: '狂暴流光破茧 · 390°/s' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpinSpeed(s.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    spinSpeed === s.id
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-lg text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#8e8e93]'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{s.label}</span>
                    {spinSpeed === s.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Control & Parameters Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Ring Goals & Progress Sliders */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#fa114f]" />
                <h2 className="text-sm font-bold text-white tracking-wide">三环独立数值控制</h2>
              </div>
              <span className="text-[11px] font-mono text-[#8e8e93]">
                {celebrationStage === 'tail' ? '🏆 片尾常驻态' : celebrationStage === 'head' ? '📌 片头常驻态' : '⚡ 庆典进行中'}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {rings.map((ring, idx) => {
                const pct = displayPct[idx];
                const isOver100 = pct >= 100;
                return (
                  <div
                    key={ring.id}
                    className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ring.gradientEnd }}
                        />
                        <span className="text-xs font-bold text-white">
                          {ring.labelZh} ({ring.label})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-white font-bold">{ring.current}</span>
                        <span className="text-[#8e8e93]">/ {ring.goal}</span>
                        <span className="text-[10px] text-[#8e8e93]">{ring.unit}</span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                            isOver100
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min="0"
                      max={Math.round(ring.goal * 2)}
                      step="1"
                      value={ring.current}
                      onChange={(e) => handleRingValueChange(idx, Number(e.target.value))}
                      className="w-full accent-[#00f0ff] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-semibold text-[#8e8e93]">快捷进度预设</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => applyPreset([100, 100, 100])}
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-all active:scale-95"
                >
                  100% 满环
                </button>
                <button
                  onClick={() => applyPreset([150, 150, 125])}
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00f0ff] text-[11px] font-bold transition-all active:scale-95"
                >
                  150% 超越
                </button>
                <button
                  onClick={() => applyPreset([75, 80, 60])}
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8e8e93] hover:text-white text-[11px] font-bold transition-all active:scale-95"
                >
                  75% 冲刺
                </button>
                <button
                  onClick={() => jumpToHeadStandby()}
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-rose-400 text-[11px] font-bold transition-all active:scale-95"
                >
                  重置片头
                </button>
              </div>
            </div>
          </div>

          {/* Velocity-Based Tangential Motion Blur Control */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-bold text-white">
                  切向动态运动模糊 (Velocity Motion Blur)
                </span>
              </div>
              <button
                onClick={() => setMotionBlurEnabled(!motionBlurEnabled)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 ${
                  motionBlurEnabled
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40 shadow-sm'
                    : 'bg-white/5 text-[#8e8e93] border-white/10'
                }`}
              >
                {motionBlurEnabled ? '着色器已开启' : '已关闭'}
              </button>
            </div>

            <p className="text-[11px] text-[#8e8e93] leading-relaxed">
              基于瞬时切向速度方程 <span className="font-mono text-amber-300">v_tan = ω · r</span> 实时计算圆形拖影向量，在高速 3D 自转时产生自然流体残影。
            </p>

            {/* Motion blur intensity presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#8e8e93]">切向强度:</span>
              {[
                { val: 0.5, label: '柔和 (0.5x)' },
                { val: 1.0, label: '标准 (1.0x)' },
                { val: 1.8, label: '流体增强 (1.8x)' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    setMotionBlurIntensity(item.val);
                    setMotionBlurEnabled(true);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                    motionBlurEnabled && motionBlurIntensity === item.val
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                      : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Centrifugal Radial Physical Deformation & Chromatic Dispersion Blur */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  离心径向形变着色器 (Centrifugal Radial Blur)
                </span>
              </div>
              <button
                onClick={() => setRadialBlurEnabled(!radialBlurEnabled)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 ${
                  radialBlurEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-white/5 text-[#8e8e93] border-white/10'
                }`}
              >
                {radialBlurEnabled ? '着色器已开启' : '已关闭'}
              </button>
            </div>

            <p className="text-[11px] text-[#8e8e93] leading-relaxed">
              根据离心加速度 <span className="font-mono text-emerald-300">a = ω² · r</span> 计算由内向外的物理径向光线拉伸与三通道色散分离，呈现更逼真的高速旋转光学形变。
            </p>

            {/* Radial blur presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#8e8e93]">径向形变:</span>
              {[
                { val: 0.5, label: '微幅 (0.5x)' },
                { val: 1.0, label: '物理标准 (1.0x)' },
                { val: 1.6, label: '极速拉伸 (1.6x)' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    setRadialBlurIntensity(item.val);
                    setRadialBlurEnabled(true);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                    radialBlurEnabled && radialBlurIntensity === item.val
                      ? 'bg-emerald-400 text-black border-emerald-300 shadow-md'
                      : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* HDRi Real-Time Metallic Environment Reflection Control */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ffd60a]" />
                <span className="text-xs font-bold text-white">
                  HDRi 环境实时反射与金属光泽 (PBR Metalness)
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                PBR MeshPhysical
              </span>
            </div>

            <p className="text-[11px] text-[#8e8e93] leading-relaxed">
              基于 360° 影棚 HDRi 贴图与圆管倒角法线贴图（Normal Map），在 3D 自转过程中产生自然流动的镜面高光与金属倒影。
            </p>

            {/* HDRi reflection presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#8e8e93]">反射强度:</span>
              {[
                { val: 0.6, label: '柔和磨砂 (0.6x)' },
                { val: 1.4, label: '标准影棚 (1.4x)' },
                { val: 2.2, label: '高光镜面 (2.2x)' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setEnvMapIntensity(item.val)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                    envMapIntensity === item.val
                      ? 'bg-[#ffd60a] text-black border-amber-300 shadow-md'
                      : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Metalness presets */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] font-mono text-[#8e8e93]">合金质感:</span>
              {[
                { val: 0.45, label: '半哑光钛金' },
                { val: 0.88, label: 'Apple 原生合金' },
                { val: 0.98, label: '液态金属' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setMetalness(item.val)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
                    metalness === item.val
                      ? 'bg-gradient-to-r from-sky-400 to-indigo-400 text-black border-sky-300 shadow-md'
                      : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blacksmith Sparks Dynamic LOD & Adaptive Distance Density Control */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">
                  铁花粒子 LOD 分级与视距自适应密度
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {liveMetrics?.lodTier || 'LOD 0 (极致)'}
                </span>
                {liveMetrics?.maxSparksBudget && (
                  <span className="text-[10px] font-mono text-[#8e8e93] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                    预算: {liveMetrics.maxSparksBudget}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#8e8e93] leading-relaxed">
              依据视口像素覆盖面积与三维摄像机视距 <span className="font-mono text-purple-300">Coverage = (Area/RefArea) · (5.8/Z)²</span> 动态计算粒子存活密度，远视距下智能精简顶点，杜绝超像素 Overdraw 与掉帧。
            </p>

            {/* LOD Mode Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
              {[
                { id: 'auto', label: '智能视距自适应', desc: 'Auto' },
                { id: 'lod0', label: 'LOD 0 · 极致宏观', desc: '2,200 粒子 (100%)' },
                { id: 'lod1', label: 'LOD 1 · 均衡标准', desc: '1,500 粒子 (68%)' },
                { id: 'lod2', label: 'LOD 2 · 节能远距', desc: '880 粒子 (40%)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLodMode(item.id as RingsLODMode)}
                  className={`py-2 px-2 rounded-xl text-left border transition-all active:scale-95 flex flex-col justify-between gap-1 ${
                    lodMode === item.id
                      ? 'bg-purple-600/30 text-white border-purple-400 shadow-md shadow-purple-500/20'
                      : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-bold truncate">{item.label}</span>
                  <span className="text-[9px] font-mono text-purple-300/80">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Racing Brake Sparks & Aerodynamic Flow Field Control */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlameKindling className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white">
                  赛车刹车铁火花 &amp; 空气流场扰动
                </span>
              </div>
              <button
                onClick={() => triggerRacingBrakeSparks(360, 1.2)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>喷射刹车火花</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8e8e93] leading-relaxed">
              模拟赛车碳陶刹车片急刹时的摩擦白热火花流（超高初速、切向流线拉伸、多级热衰变），配合环体三维自转产生的空气涡流场（Aerodynamic Vortex Wake）有机横向偏移落点。
            </p>

            <div className="space-y-3 pt-1">
              {/* Flow Field Controls */}
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">空气流场涡流风洞</span>
                  </div>
                  <button
                    onClick={() => setFlowFieldEnabled(!flowFieldEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                      flowFieldEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 text-[#8e8e93] border-white/10'
                    }`}
                  >
                    {flowFieldEnabled ? '流场开启' : '流场关闭'}
                  </button>
                </div>

                {flowFieldEnabled && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#8e8e93]">
                      <span>涡流风阻横向偏转强度</span>
                      <span className="text-cyan-300 font-bold">{flowFieldIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2.0}
                      step={0.1}
                      value={flowFieldIntensity}
                      onChange={(e) => setFlowFieldIntensity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Brake Sparks Trigger Quick Options */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#8e8e93]">急刹火花:</span>
                {[
                  { label: '轻度擦边', count: 180, intensity: 0.8 },
                  { label: '极限急刹', count: 360, intensity: 1.2 },
                  { label: '暴烈热熔', count: 650, intensity: 1.6 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => triggerRacingBrakeSparks(preset.count, preset.intensity)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border border-white/5 bg-black/30 text-[#8e8e93] hover:text-orange-300 hover:border-orange-500/30 transition-all active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Highlights & GPU Specs */}
          <div className="bg-[#121620]/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ffd60a]" />
                <span className="text-xs font-bold text-white">
                  头和尾常驻 &amp; 克制辉光系统
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] text-white font-medium transition-all active:scale-95 flex items-center gap-1"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#00f0ff]" />
                    <span>复制代码</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#8e8e93]">
              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <Bookmark className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">片头常驻态 (Head Standby)：</span>
                  三环处于 2D 原生微光待闭合状态，12点钟起始尾端与运动端头高光珠永久常驻锚定，吸顶状态栏实时监控。
                </div>
              </div>

              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <RotateCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">片尾持续自转态 (Continuous Spin)：</span>
                  闭合喷发后进入 3D 空间立体持续自转，去掉静止卡片，展现优雅流光与离心火花；任意点击三环即可平滑退出。
                </div>
              </div>

              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">重力惯性与力度自适应低频震动合成：</span>
                  鼠标拖拽松开后基于阻尼弹簧方程回正，归零瞬间根据碰撞力度动态调整钛金敲击泛音与 45Hz~72Hz 低频震动冲击波（Sub-Bass Acoustic Rumble），结合硬件级多段震动，带来极具分量的机械物理触感。
                </div>
              </div>

              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">统一单通道后处理管线 (Fused Pass Pipeline)：</span>
                  切向拖影、离心径向拉伸与色散分离已全部合并入单个 Fused PostProcessing 着色器，彻底消除多重 Framebuffer Ping-Pong 切换与显存带宽开销，低端设备帧率稳固 60/120 FPS。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. 底部常驻悬浮控制栏 (Tail Persistent Footer Dock / "尾常驻")         */}
      {/* 无论页面如何滚动，核心引爆、自转控制、转速切换与片头片尾永远常驻触手可及 */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <footer className="sticky bottom-3 z-30 w-full bg-[#121620]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 transition-all">
        {/* Left: Primary Celebration Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={triggerFullClosureCelebration}
            disabled={isClosingAnim}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fa114f] via-[#ffd60a] to-[#00f0ff] hover:opacity-95 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>
              {isClosingAnim ? '正在闭合三环…' : '🚀 一键全闭合全流程庆典'}
            </span>
          </button>

          {/* Quick Head/Tail Toggle Pills */}
          <div className="flex items-center gap-1 bg-[#090c12] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={jumpToHeadStandby}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                celebrationStage === 'head'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <Bookmark className="w-3 h-3 text-emerald-400" />
              <span>片头常驻</span>
            </button>
            <button
              onClick={jumpToTailContinuousSpin}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                celebrationStage === 'spinning'
                  ? 'bg-amber-400 text-black shadow-sm font-extrabold'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>片尾持续自转</span>
            </button>
          </div>
        </div>

        {/* Right: Spin Speed & Manual Spark Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (celebrationStage === 'head') {
                jumpToTailContinuousSpin();
              } else {
                setIsSpinning(!isSpinning);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
              isSpinning
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
            }`}
          >
            {isSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSpinning ? '暂停自转' : '开启 3D 自转'}</span>
          </button>

          <button
            onClick={() => triggerInstancedSparks(2200)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-1"
            title="手动喷发 2,200+ 熔铁铁花"
          >
            <FlameKindling className="w-3.5 h-3.5" />
            <span>爆发铁花</span>
          </button>

          <button
            onClick={jumpToHeadStandby}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[#8e8e93] hover:text-white text-xs transition-all active:scale-95"
            title="重置回片头 2D 原生态"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
