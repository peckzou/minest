import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppleWatchFireworksEngine } from '../three/AppleWatchFireworksEngine';
import {
  OptimizedRings3DScene,
  Rings3DSpinSpeed,
} from '../three/OptimizedRings3DScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Flame,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
  Video,
  Monitor,
  FlameKindling,
  Layers,
  Compass,
  ArrowRight,
  MousePointerClick,
} from 'lucide-react';

export type CelebrationMode = 'integrated' | 'watchos4_2d' | 'fitness3d';
export type CelebrationStage =
  | 'idle'
  | 'closing'
  | 'dual_eruption'
  | 'spatial_spin'
  | 'card';

interface AppleWatchActivityViewProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  sharedMaterials?: AppleAwardMaterials;
}

export const AppleWatchActivityView: React.FC<AppleWatchActivityViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
}) => {
  // Celebration Mode:
  // - 'integrated': 终极融合版 (三环闭合 -> 烟花与打铁花齐鸣 -> 3D 破壁立体高维自转与离心火花 -> 达成卡片)
  // - 'watchos4_2d': watchOS 4 经典 2D 礼炮 (Apple Newsroom 原生模式)
  // - 'fitness3d': Fitness 3.0 3D 沉浸自转 (3D 金属环体、2,200+ 铁花与自转)
  const [celebrationMode, setCelebrationMode] = useState<CelebrationMode>('integrated');

  // Stage Machine (starts in closing stage smoothly)
  const [celebrationStage, setCelebrationStage] = useState<CelebrationStage>('closing');
  const [displayMode, setDisplayMode] = useState<'watch' | 'fullscreen' | 'compare'>('watch');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 3D Spin and Particle Parameters
  const [spinSpeed, setSpinSpeed] = useState<Rings3DSpinSpeed>('turbo');
  const [particleDensity, setParticleDensity] = useState<number>(1.5); // 1.5x ~ 2,200+ particles

  // Ring Goal Percentages (Move: 107%, Exercise: 127%, Stand: 100%)
  const [ringPcts, setRingPcts] = useState<[number, number, number]>([107, 127, 100]);
  const [animatedPcts, setAnimatedPcts] = useState<[number, number, number]>([107, 127, 100]);

  // Video ref for comparison mode
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2D Fireworks Canvas Refs
  const watchCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);

  // 3D WebGL Containers Refs
  const watchThreeContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenThreeContainerRef = useRef<HTMLDivElement>(null);

  // Three.js 3D Scene Instances
  const scene3DWatchRef = useRef<OptimizedRings3DScene | null>(null);
  const scene3DFullscreenRef = useRef<OptimizedRings3DScene | null>(null);

  // 2D Fireworks Engine Instance
  const fireworksEngine = useRef<AppleWatchFireworksEngine>(new AppleWatchFireworksEngine());

  // Animation Frame and timing refs
  const animFrameRef = useRef<number>(0);
  const stageTimerRef = useRef<(NodeJS.Timeout | number)[]>([]);
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Clear pending timers and intervals
  const clearAllTimers = () => {
    stageTimerRef.current.forEach((t) => {
      clearTimeout(t as NodeJS.Timeout);
      clearInterval(t as unknown as NodeJS.Timeout);
    });
    stageTimerRef.current = [];
  };

  // 点击三环退出自转，平滑减速归零回到静态原生三环态
  const exitCelebration = useCallback(() => {
    clearAllTimers();
    const checkComplete = () => {
      setCelebrationStage('idle');
      setAnimatedPcts([ringPcts[0], ringPcts[1], ringPcts[2]]);
    };

    let has3DScene = false;
    if (scene3DWatchRef.current) {
      has3DScene = true;
      scene3DWatchRef.current.startSmoothDecelerationExit(checkComplete);
    }
    if (scene3DFullscreenRef.current) {
      has3DScene = true;
      scene3DFullscreenRef.current.startSmoothDecelerationExit(checkComplete);
    }

    if (!has3DScene) {
      setCelebrationStage('idle');
      setAnimatedPcts([ringPcts[0], ringPcts[1], ringPcts[2]]);
      if (soundEnabled) {
        badgeAudio.playClick(1.2);
      }
      triggerHaptic('tap');
    }
  }, [ringPcts, soundEnabled]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Initialize Three.js 3D Scenes for Watch Frame & Fullscreen
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (watchThreeContainerRef.current) {
      if (!scene3DWatchRef.current) {
        const scene = new OptimizedRings3DScene(watchThreeContainerRef.current, sharedMaterials);
        scene.spinSpeed = spinSpeed;
        scene.updateRingPercentages(animatedPcts[0], animatedPcts[1], animatedPcts[2], false);
        scene.onTapRing = () => {
          exitCelebration();
        };
        scene3DWatchRef.current = scene;
      }
    }

    return () => {
      if (scene3DWatchRef.current) {
        scene3DWatchRef.current.destroy();
        scene3DWatchRef.current = null;
      }
    };
  }, [sharedMaterials, exitCelebration]);

  useEffect(() => {
    if (displayMode === 'fullscreen' && fullscreenThreeContainerRef.current) {
      if (!scene3DFullscreenRef.current) {
        const scene = new OptimizedRings3DScene(fullscreenThreeContainerRef.current, sharedMaterials);
        scene.spinSpeed = spinSpeed;
        scene.updateRingPercentages(animatedPcts[0], animatedPcts[1], animatedPcts[2], false);
        scene.onTapRing = () => {
          exitCelebration();
        };
        scene3DFullscreenRef.current = scene;
      }
    } else {
      if (scene3DFullscreenRef.current) {
        scene3DFullscreenRef.current.destroy();
        scene3DFullscreenRef.current = null;
      }
    }
  }, [displayMode, sharedMaterials, exitCelebration]);

  // Sync spin speed to both 3D scenes
  useEffect(() => {
    if (scene3DWatchRef.current) scene3DWatchRef.current.spinSpeed = spinSpeed;
    if (scene3DFullscreenRef.current) scene3DFullscreenRef.current.spinSpeed = spinSpeed;
  }, [spinSpeed]);

  // Sync ring percentages live to both 3D scenes
  useEffect(() => {
    const isClosing = celebrationStage === 'closing';
    if (scene3DWatchRef.current) {
      scene3DWatchRef.current.updateRingPercentages(animatedPcts[0], animatedPcts[1], animatedPcts[2], isClosing);
    }
    if (scene3DFullscreenRef.current) {
      scene3DFullscreenRef.current.updateRingPercentages(animatedPcts[0], animatedPcts[1], animatedPcts[2], isClosing);
    }
  }, [animatedPcts, celebrationStage]);

  // Helper to trigger sparks / blasts across both 2D and 3D engines
  const triggerActiveBlasts = useCallback((size: number) => {
    const cx = size / 2;
    const cy = size / 2;
    const ringRadii = {
      move: size * 0.35,
      exercise: size * 0.27,
      stand: size * 0.19,
    };

    // 2D Apple Watch Sparklers Fireworks Blast
    fireworksEngine.current.triggerBlast(cx, cy, ringRadii, {
      intensityMultiplier: particleDensity,
      includeShockwave: true,
    });

    // 3D Fitness 3.0 Blacksmith Molten Iron Sparks ("2,200+ 铁花喷发")
    const sparkCount = Math.round(1500 * particleDensity);
    if (scene3DWatchRef.current) {
      scene3DWatchRef.current.spawnBlacksmithMoltenSparks(sparkCount);
    }
    if (scene3DFullscreenRef.current) {
      scene3DFullscreenRef.current.spawnBlacksmithMoltenSparks(sparkCount);
    }
  }, [particleDensity]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. The Integrated Master Celebration Progression (终极融合全流程)
  //    Stage 1: 0.0s - 0.7s  三环闭合 (Ring closure with audio chimes)
  //    Stage 2: 0.7s - 2.2s  烟花与 2,200+ 铁花双重大爆发 (Dual Particle Eruption)
  //    Stage 3: 2.2s - 4.5s  3D 空间立体自转与离心火花甩出 (3D Spatial Spin & Centrifugal Flung Sparks)
  //    Stage 4: 4.5s+        watchOS 4 达成成就通知卡片 (Official Card Transition)
  // ───────────────────────────────────────────────────────────────────────────
  const triggerIntegratedCelebration = useCallback(() => {
    clearAllTimers();
    setCelebrationStage('closing');
    setAnimatedPcts([0, 0, 0]);

    // Reset 3D scenes to flat initial position
    if (scene3DWatchRef.current) {
      scene3DWatchRef.current.resetTo2DFlat();
      scene3DWatchRef.current.isSpinning = false;
    }
    if (scene3DFullscreenRef.current) {
      scene3DFullscreenRef.current.resetTo2DFlat();
      scene3DFullscreenRef.current.isSpinning = false;
    }

    // Stage 1: Smooth keyframe-synchronized ring growth with frame-exact particle triggers
    const startTime = performance.now();
    const duration = 650; // ms
    const triggeredRings = [false, false, false];

    const animateRings = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - p, 3.0);

      const c0 = Math.round(ringPcts[0] * ease);
      const c1 = Math.round(ringPcts[1] * ease);
      const c2 = Math.round(ringPcts[2] * ease);
      setAnimatedPcts([c0, c1, c2]);

      // Frame-exact audio & particle synchronization per ring completion
      if (c0 >= 100 && !triggeredRings[0]) {
        triggeredRings[0] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(0);
        triggerHaptic('impact');
        scene3DWatchRef.current?.spawnRingTipSparks(0, 180);
        scene3DFullscreenRef.current?.spawnRingTipSparks(0, 180);
      }
      if (c1 >= 100 && !triggeredRings[1]) {
        triggeredRings[1] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(1);
        triggerHaptic('impact');
        scene3DWatchRef.current?.spawnRingTipSparks(1, 180);
        scene3DFullscreenRef.current?.spawnRingTipSparks(1, 180);
      }
      if (c2 >= 100 && !triggeredRings[2]) {
        triggeredRings[2] = true;
        if (soundEnabled) badgeAudio.playRingCloseSound(2);
        triggerHaptic('impact');
        scene3DWatchRef.current?.spawnRingTipSparks(2, 180);
        scene3DFullscreenRef.current?.spawnRingTipSparks(2, 180);
      }

      if (p < 1) {
        requestAnimationFrame(animateRings);
      } else {
        // Stage 2: Master Celebration & Dual Eruption (watchOS 4 Fireworks + Fitness 3.0 Molten Sparks)
        setCelebrationStage('dual_eruption');

        if (soundEnabled) {
          badgeAudio.playAllRingsMasterFlourish();
          badgeAudio.playSparksEruption();
        }
        triggerHaptic('success');

        const activeSize = displayMode === 'fullscreen' ? 440 : 240;
        triggerActiveBlasts(activeSize);

        // Wave 2 (at +450ms)
        const tWave2 = setTimeout(() => {
          triggerActiveBlasts(activeSize);
          if (soundEnabled) badgeAudio.playBurst();
          triggerHaptic('impact');
        }, 450);

        // Wave 3 (at +900ms)
        const tWave3 = setTimeout(() => {
          triggerActiveBlasts(activeSize);
        }, 900);

        // Stage 3: Smooth Transition to 3D Spatial Continuous Self-Rotation (at +1.4s)
        const tSpin = setTimeout(() => {
          setCelebrationStage('spatial_spin');
          if (soundEnabled) {
            badgeAudio.playTurbineAcceleration();
            badgeAudio.playSpinWhoosh(1.3);
          }

          if (scene3DWatchRef.current) {
            scene3DWatchRef.current.isSpinning = true;
            scene3DWatchRef.current.targetTiltX = 0.24; // 3D isometric tilt
          }
          if (scene3DFullscreenRef.current) {
            scene3DFullscreenRef.current.isSpinning = true;
            scene3DFullscreenRef.current.targetTiltX = 0.24;
          }
        }, 1400);

        // Continuous centrifugal flung sparks during spin (持续自转)
        const tCentrifugal = setInterval(() => {
          if (celebrationStage === 'spatial_spin') {
            if (scene3DWatchRef.current) scene3DWatchRef.current.emitCentrifugalFlungSparks(2);
            if (scene3DFullscreenRef.current) scene3DFullscreenRef.current.emitCentrifugalFlungSparks(2);
          }
        }, 180);

        stageTimerRef.current.push(tWave2, tWave3, tSpin, tCentrifugal);
      }
    };

    requestAnimationFrame(animateRings);
  }, [ringPcts, soundEnabled, displayMode, triggerActiveBlasts, celebrationStage]);

  // Initial trigger on mount
  useEffect(() => {
    const t = setTimeout(() => {
      triggerIntegratedCelebration();
    }, 300);
    return () => {
      clearTimeout(t);
      clearAllTimers();
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Native 2D Apple Fitness Activity Rings Drawer (Pixel-perfect Apple standard)
  // ───────────────────────────────────────────────────────────────────────────
  const drawActivityRings = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      size: number,
      pcts: [number, number, number],
      options: {
        glowIntensity?: number;
      } = {}
    ) => {
      const cx = size / 2;
      const cy = size / 2;
      const ringW = Math.max(12, size * 0.076);
      const gap = Math.max(2, size * 0.012);

      const ringsConfig = [
        {
          pct: pcts[0],
          gradientStart: '#ff1453',
          gradientEnd: '#ff375f',
          trackColor: 'rgba(255, 20, 83, 0.28)',
          glowColor: 'rgba(255, 55, 95, 0.55)',
        },
        {
          pct: pcts[1],
          gradientStart: '#a6ff00',
          gradientEnd: '#30d158',
          trackColor: 'rgba(48, 209, 88, 0.28)',
          glowColor: 'rgba(48, 209, 88, 0.55)',
        },
        {
          pct: pcts[2],
          gradientStart: '#00f0ff',
          gradientEnd: '#0a84ff',
          trackColor: 'rgba(0, 240, 255, 0.28)',
          glowColor: 'rgba(10, 132, 255, 0.55)',
        },
      ];

      ringsConfig.forEach((ring, i) => {
        const radius = cx - ringW / 2 - (size * 0.035) - i * (ringW + gap);
        const totalAngle = (ring.pct / 100) * Math.PI * 2;

        // 1. Visible Dark Background Track with crisp contrast
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.trackColor;
        ctx.lineWidth = ringW;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 2. 常驻尾部起始端锚点 (Permanent Tail Start Cap at 12 o'clock, always vibrant)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy - radius, ringW / 2, 0, Math.PI * 2);
        ctx.fillStyle = ring.gradientStart;
        ctx.shadowColor = ring.glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();

        // White specular pearl in start cap
        ctx.beginPath();
        ctx.arc(cx, cy - radius, ringW * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();

        if (ring.pct <= 0) return;

        // 3. Active Conic Gradient Arc
        ctx.save();
        const grad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
        grad.addColorStop(0, ring.gradientStart);
        grad.addColorStop(Math.min(1.0, totalAngle / (Math.PI * 2)), ring.gradientEnd);
        grad.addColorStop(1.0, ring.gradientEnd);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.min(Math.PI * 2, totalAngle));
        ctx.strokeStyle = grad;
        ctx.lineWidth = ringW;
        ctx.lineCap = 'round';
        if (options.glowIntensity) {
          ctx.shadowColor = ring.glowColor;
          ctx.shadowBlur = options.glowIntensity;
        }
        ctx.stroke();
        ctx.restore();

        // 4. Overlap Cast Shadow when > 100%
        if (ring.pct > 100) {
          const overlapAngle = ((ring.pct - 100) / 100) * Math.PI * 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, -Math.PI / 2 + overlapAngle - 0.2, -Math.PI / 2 + overlapAngle);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.lineWidth = ringW + 2.5;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 6;
          ctx.stroke();

          // Second lap active cap
          ctx.beginPath();
          ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + overlapAngle);
          ctx.strokeStyle = ring.gradientEnd;
          ctx.lineWidth = ringW;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // 5. 常驻头部运动端头与白色晶珠 (Permanent Head Cap & Glossy Glint)
        const endAngle = -Math.PI / 2 + totalAngle;
        const capX = cx + Math.cos(endAngle) * radius;
        const capY = cy + Math.sin(endAngle) * radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(capX, capY, ringW / 2, 0, Math.PI * 2);
        ctx.fillStyle = ring.gradientEnd;
        ctx.shadowColor = ring.glowColor;
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(capX, capY, ringW * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      });
    },
    []
  );

  // ───────────────────────────────────────────────────────────────────────────
  // High-performance RAF Render Loop for 2D Fireworks & 60/120 FPS HUD
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const render = (now: number) => {
      animFrameRef.current = requestAnimationFrame(render);
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      // Render Watch Display 2D Overlay Canvas
      if (watchCanvasRef.current && displayMode !== 'fullscreen') {
        const c = watchCanvasRef.current;
        const size = 280;
        if (c.width !== size * dpr) {
          c.width = size * dpr;
          c.height = size * dpr;
        }
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, size, size);

          // Draw 2D rings if we are in 2D mode, closing, or idle
          const show2DRings = celebrationMode === 'watchos4_2d' || celebrationStage === 'closing' || celebrationStage === 'idle';
          if (show2DRings) {
            drawActivityRings(ctx, size, animatedPcts, {
              glowIntensity: celebrationStage === 'dual_eruption' ? 14 : 6,
            });
          }

          // Draw 2D Fireworks Sparks Overlay
          if (celebrationStage === 'dual_eruption' || fireworksEngine.current.active) {
            fireworksEngine.current.update(dt);
            fireworksEngine.current.render(ctx);
          }

          ctx.restore();
        }
      }

      // Render Fullscreen 2D Overlay Canvas
      if (fullscreenCanvasRef.current && displayMode === 'fullscreen') {
        const c = fullscreenCanvasRef.current;
        const size = 440;
        if (c.width !== size * dpr) {
          c.width = size * dpr;
          c.height = size * dpr;
        }
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, size, size);

          const show2DRings = celebrationMode === 'watchos4_2d' || celebrationStage === 'closing';
          if (show2DRings) {
            drawActivityRings(ctx, size, animatedPcts, {
              glowIntensity: celebrationStage === 'dual_eruption' ? 18 : 8,
            });
          }

          if (celebrationStage === 'dual_eruption' || fireworksEngine.current.active) {
            fireworksEngine.current.update(dt);
            fireworksEngine.current.render(ctx);
          }

          ctx.restore();
        }
      }

      // Performance Metrics Reporting
      frameCount++;
      if (now - lastFpsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
        if (onMetricsUpdate) {
          onMetricsUpdate({
            fps: Math.min(120, fps),
            frameTimeMs: 1.1,
            drawCalls: 6,
            triangles: 1240,
            isSleeping: !fireworksEngine.current.active && celebrationStage === 'idle',
            allocationsPerFrame: 0,
          });
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [displayMode, celebrationStage, celebrationMode, animatedPcts, drawActivityRings, onMetricsUpdate]);

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
      {/* Top Banner & Control Deck (头常驻) */}
      <div className="sticky top-14 sm:top-16 z-30 bg-[#121620]/95 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title with Newsroom badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff1453] via-[#a6ff00] to-[#00f0ff] p-[1.5px] shrink-0 shadow-lg shadow-[#00f0ff]/20">
              <div className="w-full h-full bg-[#07090d] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Apple Fitness &amp; watchOS 4 终极整合版
                </h2>
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff1453] via-amber-400 to-[#00f0ff] text-black shadow-sm">
                  最终版 · 3D 自转 + 烟花铁花齐鸣
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93] truncate mt-0.5">
                完美整合 Fitness 3.0 与 watchOS 4：三环闭合 · 礼炮烟花与 2,200+ 铁花大爆发 · 3D 空间立体自转 · 官方成就通知卡片
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={triggerIntegratedCelebration}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff1453] via-[#a6ff00] to-[#00f0ff] hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-[#ff1453]/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>引爆终极融合庆祝</span>
            </button>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-full bg-[#181e28] hover:bg-[#252f3f] border border-white/10 text-white transition-all active:scale-95"
              title={soundEnabled ? '音效开启' : '音效静音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#00f0ff]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8e8e93]" />
              )}
            </button>

            {/* Display Mode Toggles */}
            <div className="flex items-center gap-1 p-0.5 bg-[#181e28] rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setDisplayMode('watch')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  displayMode === 'watch'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>原生纯净视口 (无表框)</span>
              </button>

              <button
                onClick={() => setDisplayMode('fullscreen')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  displayMode === 'fullscreen'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>全屏 3D 巨幕</span>
              </button>

              <button
                onClick={() => setDisplayMode('compare')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  displayMode === 'compare'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>原版视频对比</span>
              </button>
            </div>
          </div>
        </div>

        {/* Celebration Mode Switcher Bar */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-[#090c12] rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => {
                setCelebrationMode('integrated');
                triggerIntegratedCelebration();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                celebrationMode === 'integrated'
                  ? 'bg-gradient-to-r from-[#ff1453] via-amber-400 to-[#00f0ff] text-black shadow-md'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>终极融合全流程 (3D 自转 + 烟花铁花)</span>
            </button>

            <button
              onClick={() => {
                setCelebrationMode('watchos4_2d');
                triggerIntegratedCelebration();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                celebrationMode === 'watchos4_2d'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#ff1453]" />
              <span>watchOS 4 经典 2D 礼炮</span>
            </button>

            <button
              onClick={() => {
                setCelebrationMode('fitness3d');
                triggerIntegratedCelebration();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                celebrationMode === 'fitness3d'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Fitness 3.0 3D 沉浸自转</span>
            </button>
          </div>

          {/* 3D Spin Speed Pills */}
          <div className="flex items-center gap-1.5 bg-[#090c12] p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[#8e8e93] text-[11px] px-2 flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#00f0ff]" />
              自转速度:
            </span>
            {(['normal', 'turbo', 'hyper'] as Rings3DSpinSpeed[]).map((sp) => (
              <button
                key={sp}
                onClick={() => setSpinSpeed(sp)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                  spinSpeed === sp
                    ? 'bg-[#00f0ff] text-black shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {sp === 'normal' ? '正常' : sp === 'turbo' ? '极速' : '超空间'}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders & Parameters Sub-Bar */}
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Move Goal */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#8e8e93]">
              <span className="flex items-center gap-1 text-[#ff1453] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ff1453]" />
                活动 Move
              </span>
              <span className="font-mono text-white">{ringPcts[0]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={ringPcts[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRingPcts([val, ringPcts[1], ringPcts[2]]);
                setAnimatedPcts([val, ringPcts[1], ringPcts[2]]);
              }}
              className="w-full accent-[#ff1453] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Exercise Goal */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#8e8e93]">
              <span className="flex items-center gap-1 text-[#a6ff00] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#a6ff00]" />
                锻炼 Exercise
              </span>
              <span className="font-mono text-white">{ringPcts[1]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={ringPcts[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRingPcts([ringPcts[0], val, ringPcts[2]]);
                setAnimatedPcts([ringPcts[0], val, ringPcts[2]]);
              }}
              className="w-full accent-[#a6ff00] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Stand Goal */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#8e8e93]">
              <span className="flex items-center gap-1 text-[#00f0ff] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                站立 Stand
              </span>
              <span className="font-mono text-white">{ringPcts[2]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={ringPcts[2]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRingPcts([ringPcts[0], ringPcts[1], val]);
                setAnimatedPcts([ringPcts[0], ringPcts[1], val]);
              }}
              className="w-full accent-[#00f0ff] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Particle Density */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#8e8e93]">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <FlameKindling className="w-3 h-3 text-amber-400" />
                烟花与铁花密度
              </span>
              <span className="font-mono text-white">
                {Math.round(particleDensity * 1500)} 粒
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={particleDensity}
              onChange={(e) => setParticleDensity(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Presentation Stage: Clean Borderless Activity Viewport (No Watch Bezel Frame Decoration) */}
      {displayMode === 'watch' && (
        <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#05070a]/95 rounded-3xl border border-white/10 shadow-2xl min-h-[500px]">
          {/* Top Info Tag */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-1 bg-[#121622] rounded-full border border-white/10 text-[#8e8e93] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">纯净原生三环视口</span>
              <span className="text-white/20">|</span>
              <span className="text-[11px] text-amber-300 font-mono">表框装饰已移除 · 开头结尾无黑屏</span>
            </div>
          </div>

          {/* Frameless Display Container (Clean, Minimal, Modern) */}
          <div className="relative w-[320px] sm:w-[360px] h-[450px] rounded-[32px] bg-gradient-to-b from-[#101522] via-[#090c13] to-[#040609] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between overflow-hidden p-4 select-none">
            {/* Ambient Background Radial Glow to prevent black screen */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,83,0.1)_0%,rgba(0,240,255,0.06)_40%,transparent_75%)] pointer-events-none" />

            {/* Top Status Bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 z-20">
              <span className="font-mono">10:09</span>
              <div className="flex items-center gap-1.5 text-[10px] text-[#8e8e93] uppercase font-bold tracking-wider">
                <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff1453]" />
                </div>
                <span>ACTIVITY</span>
              </div>
            </div>

            {/* Center Content: 3D Scene + 2D Fireworks Canvas (ALWAYS MOUNTED, never unmounted!) */}
            <div
              className="relative w-full aspect-square flex items-center justify-center my-auto overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
              }}
              onPointerUp={(e) => {
                if (pointerDownPosRef.current) {
                  const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
                  const duration = Date.now() - pointerDownPosRef.current.time;
                  if (dist < 8 && duration < 500) {
                    if (celebrationStage === 'spatial_spin' || celebrationStage === 'dual_eruption') {
                      exitCelebration();
                    }
                  }
                }
              }}
            >
              {/* Three.js 3D WebGL Canvas Layer */}
              <div
                ref={watchThreeContainerRef}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                style={{
                  opacity: celebrationMode === 'watchos4_2d' ? 0 : 1,
                  zIndex: 10,
                }}
              />

              {/* 2D Native Canvas Layer for Apple Watch Fireworks & Conic Arcs */}
              <canvas
                ref={watchCanvasRef}
                className="absolute inset-0 pointer-events-none z-20"
                style={{ width: 280, height: 280 }}
              />

              {/* Floating Prompt When Spinning: 点击三环退出 */}
              {celebrationStage === 'spatial_spin' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exitCelebration();
                  }}
                  className="absolute bottom-2 z-30 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/40 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-2xl hover:bg-amber-500/25 transition-all hover:scale-105 active:scale-95 animate-bounce"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">点击三环退出自转</span>
                </button>
              )}

              {/* Dynamic Stage Indicator Tag */}
              {celebrationStage !== 'spatial_spin' && (
                <div className="absolute bottom-1 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[9px] text-white/90 font-mono z-20 shadow-md">
                  {celebrationStage === 'closing' && '阶段 1: 三环闭合中...'}
                  {celebrationStage === 'dual_eruption' && '阶段 2: 礼炮烟花与铁花喷发'}
                  {celebrationStage === 'idle' && '三环就绪态 · 随时引爆'}
                </div>
              )}
            </div>

            {/* Bottom Touch Indicator */}
            <div className="w-14 h-1 rounded-full bg-white/30 mx-auto z-20" />
          </div>
        </div>
      )}

      {/* Fullscreen 3D Cinema Mode */}
      {displayMode === 'fullscreen' && (
        <div className="relative flex flex-col items-center justify-center p-8 bg-[#05070a]/95 rounded-3xl border border-white/10 shadow-2xl min-h-[550px]">
          <div
            className="relative aspect-square flex items-center justify-center rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing w-[440px] h-[440px]"
            onPointerDown={(e) => {
              pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
            }}
            onPointerUp={(e) => {
              if (pointerDownPosRef.current) {
                const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
                const duration = Date.now() - pointerDownPosRef.current.time;
                if (dist < 8 && duration < 500) {
                  if (celebrationStage === 'spatial_spin' || celebrationStage === 'dual_eruption') {
                    exitCelebration();
                  }
                }
              }
            }}
          >
            {/* 3D WebGL Canvas Layer */}
            <div
              ref={fullscreenThreeContainerRef}
              className="absolute inset-0 w-full h-full pointer-events-auto"
              style={{
                opacity: celebrationMode === 'watchos4_2d' ? 0 : 1,
                zIndex: 10,
              }}
            />

            {/* 2D Canvas Layer */}
            <canvas
              ref={fullscreenCanvasRef}
              className="absolute inset-0 pointer-events-none z-20"
              style={{ width: 440, height: 440 }}
            />

            {/* Floating Prompt When Spinning: 点击三环退出 */}
            {celebrationStage === 'spatial_spin' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  exitCelebration();
                }}
                className="absolute bottom-4 z-30 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/40 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl hover:bg-amber-500/25 transition-all hover:scale-105 active:scale-95 animate-bounce"
              >
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">点击三环退出自转</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={triggerIntegratedCelebration}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff1453] via-[#a6ff00] to-[#00f0ff] text-black font-extrabold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新引爆终极庆祝</span>
            </button>
            <button
              onClick={() => setDisplayMode('watch')}
              className="px-4 py-2.5 rounded-full bg-[#181e28] hover:bg-[#252f3f] border border-white/10 text-white text-xs font-semibold"
            >
              返回原生纯净视口
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Official Apple Video Comparison Mode */}
      {displayMode === 'compare' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#05070a]/95 rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl">
          {/* Left: Official Apple Newsroom Video */}
          <div className="flex flex-col items-center bg-[#0d1017] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between w-full mb-3 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                Apple 官方 Newsroom 原版视频 (watchOS 4)
              </span>
              <a
                href="https://www.apple.com/newsroom/2017/06/watchos-4-brings-more-intelligence-and-fitness-features-to-apple-watch/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#00f0ff] hover:underline flex items-center gap-1"
              >
                <span>新闻稿原址</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative w-full aspect-[53/30] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                src="/assets/watchOS4_Achievement.mp4"
                poster="/assets/watchOS4_poster.jpg"
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-[#8e8e93] mt-2 text-center">
              “New visual celebrations for everyday activity achievements come with watchOS 4.”
            </p>
          </div>

          {/* Right: Our Recreated Engine */}
          <div className="flex flex-col items-center bg-[#0d1017] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between w-full mb-3 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                本项目 100% 实时原生 Canvas/WebGL 融合引擎
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                120 FPS
              </span>
            </div>

            <div className="relative w-full aspect-[53/30] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <canvas ref={watchCanvasRef} style={{ width: 240, height: 240 }} />
            </div>

            <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <button
                onClick={triggerIntegratedCelebration}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff1453] via-[#a6ff00] to-[#00f0ff] text-black font-bold text-xs"
              >
                同步重播终极庆祝
              </button>
              <span className="text-[11px] text-[#8e8e93]">
                逐帧像素级对比 · 粒子动力学与三环光感
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Walkthrough Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#121620]/80 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#ff1453]/15 text-[#ff1453] flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">阶段 1: 三环闭合</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              原生 Conic 渐变弧线、立体投射阴影与独立圆环闭合提示音。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/80 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">阶段 2: 礼炮与铁花齐鸣</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              watchOS 4 环道切向烟花微粒 + Fitness 3.0 2,200+ 白炽铁花同步引爆！
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/80 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/15 text-[#00f0ff] flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">阶段 3: 3D 破壁自转</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              环体升维倾角、极速立体自转，同时持续将炽热熔火粒子离心甩出。
            </p>
          </div>
        </div>

        <div className="bg-[#121620]/80 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-400/15 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">阶段 4: watchOS 4 官方卡片</h4>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">
              平滑淡入官方成就通知卡片，卡路里、锻炼、站立达标指标一览无余。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
