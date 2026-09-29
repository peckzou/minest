import React, { useEffect, useRef, useState } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  UnifiedAwardCeremonyFlowScene,
  UnifiedCeremonyStage,
} from '../three/UnifiedAwardCeremonyFlowScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Sparkles,
  Award,
  Compass,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface UnifiedAwardCeremonyFlowViewProps {
  onMetricsUpdate?: (m: PerformanceMetrics) => void;
  sharedMaterials: AppleAwardMaterials;
}

export const UnifiedAwardCeremonyFlowView: React.FC<UnifiedAwardCeremonyFlowViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<UnifiedAwardCeremonyFlowScene | null>(null);

  const [currentStage, setCurrentStage] = useState<UnifiedCeremonyStage>('pending');
  const [selectedBadge, setSelectedBadge] = useState<BadgeCatalogItem>(BADGE_CATALOG[0]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  // Initialize Unified 3D Ceremony Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new UnifiedAwardCeremonyFlowScene(containerRef.current, sharedMaterials);
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.playbackSpeed = 1.0;
    scene.soundEnabled = true;

    scene.onStageChange = (stage, badge) => {
      setCurrentStage(stage);
      if (badge) setSelectedBadge(badge);
    };

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials, onMetricsUpdate]);

  // Actions
  const handleNextStep = () => {
    if (sceneRef.current) {
      sceneRef.current.advanceNextStep();
    }
  };

  const handleToggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sceneRef.current) {
      sceneRef.current.toggleFlip();
    }
  };

  const handleSelectBadge = (badge: BadgeCatalogItem, slotIdx: number) => {
    setSelectedBadge(badge);
    setSelectedSlotIndex(slotIdx);
    if (sceneRef.current) {
      sceneRef.current.loadAwardBadge(badge, slotIdx);
    }
  };

  const isAssemblyStage =
    currentStage === 'brackets_lock' ||
    currentStage === 'laser_charge' ||
    currentStage === 'breakout_burst';

  const isReturnStage =
    currentStage === 'flying_back' ||
    currentStage === 'magnetic_snap' ||
    currentStage === 'collected';

  return (
    <div className={`flex flex-col gap-4 max-w-6xl mx-auto w-full select-none ${new URLSearchParams(window.location.search).get('embed') === '1' ? 'minest-unified-embed' : ''}`}>
      {/* Top Header & Stage Stepper */}
      <header className="bg-[#121620]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Apple 勋章全流程无缝仪式 (Unified Award Ceremony)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
                  点 Badge / 下一步 交互控制
                </span>
              </div>
              <p className="text-xs text-[#8e8e93] mt-0.5">
                待领取金胚 $\to$ 3合1 健身环与 6 臂破茧装配 $\to$ 3D 赏玩与 180° 翻面 $\to$ 飞回勋章墙磁吸归位
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Step Continuous Progress Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
          {[
            { id: 'pending', title: '1. 待领取金胚', sub: '24K 金胚悬浮星芒' },
            { id: 'reveal', title: '2. 3合1破茧装配', sub: '健身三环拼装 · 极速爆燃' },
            { id: 'inspect', title: '3. 3D 赏玩与翻面', sub: '背面镌刻 · 激光纹理' },
            { id: 'wall', title: '4. 磁吸弹簧归位', sub: '抛物线入槽 · Spring 震颤' },
          ].map((st, idx) => {
            const isActive =
              (idx === 0 && currentStage === 'pending') ||
              (idx === 1 && isAssemblyStage) ||
              (idx === 2 && currentStage === 'inspect') ||
              (idx === 3 && isReturnStage);

            return (
              <div
                key={st.id}
                className={`p-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-400/15 border-amber-400/60 shadow-lg shadow-amber-400/10'
                    : 'bg-white/5 border-white/5 text-[#8e8e93]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-white/20'}`} />
                  <span className={`text-xs font-bold ${isActive ? 'text-amber-300' : 'text-white/80'}`}>{st.title}</span>
                </div>
                <div className="text-[10px] text-[#8e8e93] mt-0.5 truncate">{st.sub}</div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main 3D Stage */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[500px] sm:min-h-[580px] bg-[#07090d] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none group">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Action Overlay: Primary "下一步" & Contextual Action Bar */}
        <div className="absolute bottom-6 inset-x-0 mx-auto w-fit max-w-[92%] z-20 flex items-center gap-3">
          {/* Stage 1: Pending */}
          {currentStage === 'pending' && (
            <button
              onClick={handleNextStep}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-sm shadow-2xl shadow-amber-400/35 border border-amber-300 transition-all flex items-center gap-2.5 animate-bounce"
            >
              <Sparkles className="w-5 h-5 text-black animate-spin" />
              <span>轻触 Badge 或点击「下一步」开启 3合1 装配揭晓</span>
              <ChevronRight className="w-5 h-5 text-black font-bold" />
            </button>
          )}

          {/* Stage 2: Assembly / Bursting */}
          {isAssemblyStage && (
            <div className="px-6 py-3.5 rounded-full bg-black/85 text-white font-extrabold text-sm shadow-2xl border border-amber-400/60 backdrop-blur-xl flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <span>装配与揭晓进行中…</span>
            </div>
          )}

          {/* Stage 3: Inspect */}
          {currentStage === 'inspect' && (
            <div className="flex items-center gap-2.5 bg-black/85 border border-white/20 p-2 rounded-2xl backdrop-blur-xl shadow-2xl">
              <button
                onClick={handleToggleFlip}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>180° 翻面检视背面</span>
              </button>

              <button
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2"
              >
                <span>下一步 (收回勋章墙 · 磁吸归位)</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          )}

          {/* Stage 4: Wall Return & Collected */}
          {(currentStage === 'flying_back' || currentStage === 'magnetic_snap') && (
            <div className="px-6 py-3.5 rounded-full bg-black/85 text-white font-bold text-sm border border-white/20 backdrop-blur-xl">勋章正在归位…</div>
          )}
          {currentStage === 'collected' && (
            <button
              onClick={handleNextStep}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-sm shadow-2xl shadow-emerald-500/25 transition-all flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-black" />
              <span>归位完成 · 再次体验</span>
              <RotateCcw className="w-4 h-4 text-black" />
            </button>
          )}
        </div>
      </div>

      {/* Select Which Badge to Run Ceremony */}
      <div className="bg-[#121620]/80 border border-white/10 rounded-2xl p-3 sm:p-4 minest-unified-selector">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            切换展示的 Apple 官方成就勋章：
          </span>
          <span className="text-[11px] text-[#8e8e93]">
            当前选择：<strong className="text-amber-400">{selectedBadge.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {BADGE_CATALOG.map((b, idx) => {
            const isSel = selectedBadge.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBadge(b, idx)}
                className={`p-2.5 rounded-xl text-left border transition-all active:scale-95 flex flex-col justify-between ${
                  isSel
                    ? 'bg-amber-400/15 border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'bg-white/5 border-white/5 hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `#${b.primaryColor.toString(16).padStart(6, '0')}33`,
                      border: `1.5px solid #${b.secondaryColor.toString(16).padStart(6, '0')}`,
                    }}
                  >
                    <Award className="w-4 h-4" style={{ color: `#${b.secondaryColor.toString(16).padStart(6, '0')}` }} />
                  </div>
                  <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    槽位 #{idx + 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">{b.name}</div>
                <div className="text-[10px] text-[#8e8e93] truncate mt-0.5">{b.category}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
