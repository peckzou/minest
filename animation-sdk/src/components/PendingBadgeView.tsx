import React, { useEffect, useRef, useState } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import {
  OptimizedHexRevealScene,
} from '../three/OptimizedHexRevealScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import {
  Sparkles,
  CheckCircle2,
  Gift,
  ArrowRight,
  Award,
  ChevronRight,
  RotateCcw,
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
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const mats = sharedMaterials || new AppleAwardMaterials();
    const scene = new OptimizedHexRevealScene(containerRef.current, mats);
    scene.playbackSpeed = 1.0;
    scene.onMetricsUpdate = onMetricsUpdate;

    scene.onRevealComplete = () => {
      setIsCompleted(true);
    };

    scene.onPendingStateChange = (pending) => {
      setIsPending(pending);
      if (pending) {
        setIsCompleted(false);
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

  // Actions
  const handleNextStep = () => {
    if (sceneRef.current) {
      sceneRef.current.advanceNextStep();
    }
  };

  const handleResetToPending = () => {
    if (sceneRef.current) {
      sceneRef.current.resetToPending();
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full select-none">
      {/* Top Header */}
      <header className="bg-[#121620]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gift className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                待领取 24K 金勋章 (Hexagonal Mechanical Pending Badge)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
                点 Badge / 下一步 触发
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              六边机械造型 · 24K 镜面金胚 · 闪耀星芒 · 轻触 Badge 或点击「下一步」触发 3合1 健身环拼装
            </p>
          </div>
        </div>

        <button
          onClick={handleResetToPending}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>重置为金胚</span>
        </button>
      </header>

      {/* Main 3D Canvas Stage */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[480px] sm:min-h-[560px] bg-[#07090d] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none group">
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          title="轻触 3D 金勋章或点击「下一步」触发拼装揭晓"
        />

        {/* Floating Action Overlay: Primary "下一步" Button */}
        <div className="absolute bottom-6 inset-x-0 mx-auto w-fit max-w-[92%] z-20 flex items-center gap-3">
          {isPending && (
            <button
              onClick={handleNextStep}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-sm shadow-2xl shadow-amber-400/35 border border-amber-300 transition-all flex items-center gap-2.5 animate-bounce"
            >
              <Sparkles className="w-5 h-5 text-black animate-spin" />
              <span>轻触 Badge 或点击「下一步」开启 3合1 拼装揭晓</span>
              <ChevronRight className="w-5 h-5 text-black font-bold" />
            </button>
          )}

          {!isPending && !isCompleted && (
            <button
              onClick={handleNextStep}
              className="px-6 py-3.5 rounded-full bg-black/85 hover:bg-black/95 active:scale-95 text-white font-extrabold text-sm shadow-2xl border border-amber-400/60 backdrop-blur-xl transition-all flex items-center gap-2.5"
            >
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <span>3合1 拼装揭晓中... 点击「下一步」跳过揭晓</span>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2.5 bg-black/85 border border-emerald-500/40 p-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex-wrap justify-center">
              <div className="flex items-center gap-2 px-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">破茧揭晓完成</span>
              </div>

              {onNavigateToBadgeWall && (
                <button
                  onClick={onNavigateToBadgeWall}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>前往 Badge Wall (磁吸归位)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}

              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>重置金勋章</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badge Catalog Switcher */}
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
    </div>
  );
};
