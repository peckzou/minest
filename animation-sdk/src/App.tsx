import React, { useMemo, useState } from 'react';
import { AppleAwardMaterials } from './three/AppleAwardMaterials';
import { PerformanceMetrics } from './three/OptimizedBadgeInspectorScene';
import { PerformanceHUD } from './components/PerformanceHUD';
import { AppleWatchActivityView } from './components/AppleWatchActivityView';
import { AppleFitnessRingsView } from './components/AppleFitnessRingsView';
import { HexAssemblyRevealView } from './components/HexAssemblyRevealView';
import { PendingBadgeView } from './components/PendingBadgeView';
import { BadgeWallReturnCeremonyView } from './components/BadgeWallReturnCeremonyView';
import { UnifiedAwardCeremonyFlowView } from './components/UnifiedAwardCeremonyFlowView';
import { MinestSummonCeremonyView } from './components/MinestSummonCeremonyView';
import { BadgeInspectorView } from './components/BadgeInspectorView';
import { OptimizationReportModal } from './components/OptimizationReportModal';
import { GitHubPackageExportModal } from './components/GitHubPackageExportModal';
import {
  Flame,
  Sparkles,
  GitBranch,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  Gift,
  Monitor,
  Award,
  ArrowRight,
  Package,
} from 'lucide-react';

type AnimationTab = 'unified' | 'badgewall' | 'pending' | 'reveal' | 'watchos4' | 'rings' | 'summon' | 'inspector';
const EMBED_TABS: AnimationTab[] = ['rings', 'unified', 'summon', 'pending', 'reveal', 'inspector', 'badgewall', 'watchos4'];
const pageParams = new URLSearchParams(window.location.search);
const isMinestEmbed = pageParams.get('embed') === '1';
const requestedTab = pageParams.get('tab') as AnimationTab;
const initialTab: AnimationTab = EMBED_TABS.includes(requestedTab) ? requestedTab : 'unified';
const ringProgress = (['focus', 'checks', 'goal'] as const).map((key) => {
  const value = Number(pageParams.get(key));
  return Number.isFinite(value) ? Math.max(0, Math.min(200, value)) : 0;
}) as [number, number, number];
const embeddedStrikeDays = Number(pageParams.get('strike'));

export default function App() {
  const [activeTab, setActiveTab] = useState<AnimationTab>(initialTab);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Reuse shared materials across scenes to conserve GPU textures and buffers
  const sharedMaterials = useMemo(() => new AppleAwardMaterials(), []);

  const tabList: {
    id: AnimationTab;
    label: string;
    sublabel: string;
    tag: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'summon', label: 'Minest 勋章召唤', sublabel: '粒子召唤与 3D 入场仪式',
      tag: '召唤仪式', icon: <Sparkles className="w-4 h-4 text-amber-400" />, color: 'from-amber-400 to-cyan-500',
    },
    {
      id: 'inspector', label: '3D 勋章自由检视', sublabel: '旋转、翻面与材质细节检视',
      tag: '6DoF 检视', icon: <Award className="w-4 h-4 text-cyan-400" />, color: 'from-cyan-400 to-blue-500',
    },
    {
      id: 'unified',
      label: 'Apple 勋章 3 合 1 全流程连续仪式 (Unified)',
      sublabel: '待领取金胚 · 6 机械臂破茧装配 · 3D 赏玩与 180° 翻面 · 飞回勋章墙磁吸弹簧归位',
      tag: '⭐ 3 合 1 全流程旗舰',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      color: 'from-amber-400 via-yellow-400 to-amber-500',
    },
    {
      id: 'badgewall',
      label: '徽章墙与磁吸归位 (Return Wall)',
      sublabel: 'Pokémon GO 空间归属感 · 3D 轨迹自转飞回 · Spring 弹性回弹 (Overshoot) 物理震动归位',
      tag: 'Overshoot 弹性归位',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      color: 'from-amber-400 to-yellow-500',
    },
    {
      id: 'pending',
      label: '待领取金勋章 (六边机械造型)',
      sublabel: '六边机械专属造型 · 24K 镜面黄金 · 闪烁星芒 · 点击即触发 6 机械臂装配破茧',
      tag: '六边机械造型 · 闪耀黄金',
      icon: <Gift className="w-4 h-4 text-amber-400" />,
      color: 'from-amber-400 to-yellow-500',
    },
    {
      id: 'reveal',
      label: '六边形机械装配揭秘',
      sublabel: '7 阶段精密破茧机械装配 · 6 机械臂弧线合拢 · 0 掉帧破茧揭秘',
      tag: '3D 机械装配',
      icon: <Zap className="w-4 h-4 text-[#00f0ff]" />,
      color: 'from-[#00f0ff] to-blue-500',
    },
    {
      id: 'watchos4',
      label: 'watchOS 4 & Fitness 最终融合版',
      sublabel: '三环闭合 · 烟花与 2,200+ 铁花齐鸣 · 纯净无表框视口 · 持续 3D 自转 · 点击三环即退出',
      tag: '三环庆祝融合版',
      icon: <Sparkles className="w-4 h-4 text-[#ff1453]" />,
      color: 'from-[#ff1453] via-amber-400 to-[#00f0ff]',
    },
    {
      id: 'rings',
      label: 'Apple Fitness 三环 4.0',
      sublabel: '切向动态运动模糊着色器 · 毫秒级粒子关键帧对齐 · 2,200+ 铁花地面弹跳 · Spring 阻尼回正',
      tag: '三环 4.0 旗舰版',
      icon: <Flame className="w-4 h-4 text-[#ff1453]" />,
      color: 'from-[#ff1453] via-[#a6ff00] to-[#00f0ff]',
    },
  ];

  const currentTabInfo = tabList.find((t) => t.id === activeTab) || tabList[0];

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex flex-col font-sans selection:bg-[#00f0ff]/30">
      {/* Top Navigation Bar */}
      {!isMinestEmbed && <header className="sticky top-0 z-40 bg-[#07090d]/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#fa114f] via-[#a6ff00] to-[#00f0ff] p-[1.5px] shadow-lg shadow-[#00f0ff]/20">
            <div className="w-full h-full bg-[#07090d] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#00f0ff]" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Apple Fitness 三环 &amp; 六边勋章工作室
              </h1>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                120 FPS
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#8e8e93] truncate">
              <GitBranch className="w-3 h-3 text-[#00f0ff] shrink-0" />
              <span className="truncate">peckzou/minest</span>
              <span aria-hidden="true" className="shrink-0">·</span>
              <span className="text-[#00f0ff] font-mono shrink-0">watchOS 4 官方三环庆祝</span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-[#fa114f] via-[#a6ff00] to-[#00f0ff] text-black font-bold text-xs shadow-md shadow-[#00f0ff]/20 transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub 接入包 (SDK)</span>
            <span className="sm:hidden text-[11px]">接入包</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden sm:inline">性能报告 &amp; 补丁代码</span>
            <span className="sm:hidden text-[11px]">报告</span>
          </button>

          <a
            href="https://www.apple.com/newsroom/2017/06/watchos-4-brings-more-intelligence-and-fitness-features-to-apple-watch/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#181e28] hover:bg-[#252f3f] border border-white/10 text-xs font-medium text-[#8e8e93] hover:text-white transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <span className="hidden sm:inline">Apple 官方 Newsroom</span>
            <span className="sm:hidden text-[11px]">Apple</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>}

      {/* Main Content Area */}
      <main className={isMinestEmbed ? 'w-full px-2 py-2' : 'flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6'}>
        {/* Core Modules Switcher Banner */}
        {!isMinestEmbed && <div className="bg-[#121620]/95 border border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 sm:p-3.5 rounded-xl text-left transition-all relative overflow-hidden flex items-center justify-between border ${
                    isActive
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border-white/30 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isActive
                          ? 'bg-gradient-to-br from-[#fa114f]/30 via-[#a6ff00]/20 to-[#00f0ff]/30 border-white/30 text-white'
                          : 'bg-[#181e28] border-white/10 text-[#8e8e93]'
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                          {tab.label}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full inline-block ${
                            isActive
                              ? 'bg-gradient-to-r from-[#fa114f] to-[#00f0ff] text-white'
                              : 'bg-white/10 text-[#8e8e93]'
                          }`}
                        >
                          {tab.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8e8e93] truncate mt-1">
                        {tab.sublabel}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 3-Stage Badge Ceremony Journey Guide Bar */}
          <div className="mt-2.5 pt-2.5 border-t border-white/10 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 bg-gradient-to-r from-amber-500/10 via-cyan-500/5 to-purple-500/10 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                勋章全流程流转体验链路：
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'pending'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md font-bold'
                    : 'bg-black/40 text-amber-200/80 border-amber-400/20 hover:bg-black/60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/30 text-center text-[10px] leading-4 font-mono">1</span>
                <span>待领取金勋章</span>
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

              <button
                onClick={() => setActiveTab('reveal')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'reveal'
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-md font-bold'
                    : 'bg-black/40 text-cyan-200/80 border-cyan-400/20 hover:bg-black/60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/30 text-center text-[10px] leading-4 font-mono">2</span>
                <span>六边机械装配破茧</span>
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

              <button
                onClick={() => setActiveTab('badgewall')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'badgewall'
                    ? 'bg-emerald-400 text-black border-emerald-300 shadow-md font-bold'
                    : 'bg-black/40 text-emerald-200/80 border-emerald-400/20 hover:bg-black/60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/30 text-center text-[10px] leading-4 font-mono">3</span>
                <span>Badge Wall 磁吸归位</span>
              </button>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/5 px-2 flex items-center justify-between text-[11px] text-[#8e8e93]">
            <div className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{currentTabInfo.sublabel}</span>
            </div>
            <span className="hidden sm:inline text-slate-400 font-mono text-[10px]">
              {activeTab === 'badgewall'
                ? 'Pokémon GO 空间归属感 · 3D 轨迹自转飞回 · Spring 弹性回弹 Overshoot + 物理微震'
                : activeTab === 'watchos4'
                ? 'Apple watchOS 4 官方烟花礼炮庆祝 · 环周粒子喷射 · 成就达成通知'
                : activeTab === 'rings'
                ? 'fitness动画 3.0 已存档 · 2200+ 铁花喷发与克制光感自转'
                : activeTab === 'pending'
                ? '24K 金色闪耀主体 · 无背景圆圈 · 点击即刻开启 6 臂机械拼装破茧揭晓'
                : 'Three.js 原生 7 阶段破茧装配 · 0 堆内存分配'}
            </span>
          </div>
        </div>}

        {/* Real-time Performance HUD */}
        {!isMinestEmbed && <PerformanceHUD
          metrics={metrics}
          activeAnimationName={currentTabInfo.label}
        />}

        {/* Active Stage */}
        <div className="transition-all duration-300">
          {activeTab === 'unified' && (
            <UnifiedAwardCeremonyFlowView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
            />
          )}

          {activeTab === 'badgewall' && (
            <BadgeWallReturnCeremonyView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
              onNavigateToReveal={() => setActiveTab('reveal')}
            />
          )}

          {activeTab === 'watchos4' && (
            <AppleWatchActivityView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
            />
          )}

          {activeTab === 'rings' && (
            <AppleFitnessRingsView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
              minestProgress={isMinestEmbed ? ringProgress : undefined}
              strikeDays={isMinestEmbed && Number.isFinite(embeddedStrikeDays) ? Math.max(0, embeddedStrikeDays) : undefined}
              autoCelebrate={isMinestEmbed && pageParams.get('celebrate') === '1'}
              onCelebrationExit={() => {
                if (isMinestEmbed) window.parent.postMessage({ type: 'minest:rings-celebration-exited' }, window.location.origin);
              }}
            />
          )}

          {activeTab === 'summon' && <MinestSummonCeremonyView onMetricsUpdate={setMetrics} />}
          {activeTab === 'inspector' && <BadgeInspectorView onMetricsUpdate={setMetrics} sharedMaterials={sharedMaterials} />}

          {activeTab === 'pending' && (
            <PendingBadgeView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
              onNavigateToReveal={() => setActiveTab('reveal')}
              onNavigateToBadgeWall={() => setActiveTab('badgewall')}
            />
          )}

          {activeTab === 'reveal' && (
            <HexAssemblyRevealView
              onMetricsUpdate={setMetrics}
              sharedMaterials={sharedMaterials}
              onNavigateToBadgeWall={() => setActiveTab('badgewall')}
            />
          )}
        </div>
      </main>

      {/* Footer Info */}
      {!isMinestEmbed && <footer className="border-t border-white/10 bg-[#07090d] px-4 sm:px-8 py-4 sm:py-5 text-xs text-[#8e8e93] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="text-amber-400 font-semibold">Badge Wall 磁吸归位 (Spring Overshoot)</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#ff1453]">watchOS 4 官方三环庆祝</span>
          <span aria-hidden="true">·</span>
          <span>fitness动画 3.0 存档版</span>
          <span aria-hidden="true">·</span>
          <span>待领取状态 3D 勋章</span>
          <span aria-hidden="true">·</span>
          <span>六边形机械装配揭秘</span>
          <span aria-hidden="true">·</span>
          <span>120 FPS 零丢帧</span>
        </div>
        <div className="text-[11px] text-[#636366]">
          针对 GitHub 用户 peckzou 的勋章 2.0 分支渲染优化
        </div>
      </footer>}

      {/* Optimization Report & Diff Modal */}
      {!isMinestEmbed && <OptimizationReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />}

      {/* GitHub Package Export & Integration SDK Modal */}
      {!isMinestEmbed && <GitHubPackageExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />}
    </div>
  );
}
