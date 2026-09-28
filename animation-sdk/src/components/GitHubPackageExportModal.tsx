import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Package,
  Layers,
  Sparkles,
  Zap,
  Volume2,
  Compass,
  FileCode,
  Flame,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface GitHubPackageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPackageExportModal: React.FC<GitHubPackageExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const quickStartCode = `import React from 'react';
import { AppleFitnessRingsView, badgeAudio } from './src';

export default function MyFitnessActivityView() {
  return (
    <div className="w-full h-screen bg-[#07090e]">
      <AppleFitnessRingsView
        onMetricsUpdate={(metrics) => {
          // 实时帧率与 LOD 密度监控 (120 FPS Ready)
          console.log(\`FPS: \${metrics.fps}, LOD: \${metrics.lodTier}\`);
        }}
      />
    </div>
  );
}`;

  const threeSceneUsageCode = `import { OptimizedRings3DScene, badgeAudio } from './src';

// 1. 初始化容器
const container = document.getElementById('rings-container')!;
const scene3d = new OptimizedRings3DScene(container);

// 2. 进度与动效控制
scene3d.updateRingPercentages(100, 100, 100);

// 3. 触发 2,200+ 铁花喷发与赛车刹车片摩擦火花
scene3d.spawnBlacksmithMoltenSparks(2200);
scene3d.emitRacingBrakeSparks(360, 1.2);

// 4. Web Audio 纯代码合成物理低频震动与金属碰撞音效
badgeAudio.playKineticSnapRebound(1.5);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e121a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#fa114f] via-[#a6ff00] to-[#00f0ff] p-[1.5px] shadow-lg shadow-[#00f0ff]/20">
              <div className="w-full h-full bg-[#0e121a] rounded-[14px] flex items-center justify-center">
                <Package className="w-4 h-4 text-[#00f0ff]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Apple Fitness 三环 4.0 & 勋章全流程 GitHub 接入包</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v4.0.0 Production Ready
                </span>
              </div>
              <p className="text-xs text-[#8e8e93]">
                像素级原生还原 · WebGL2 + Three.js + Web Audio API 纯代码零外部音频依赖
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#8e8e93]">
          {/* Pipeline Flow Overview */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Layers className="w-4 h-4 text-[#00f0ff]" />
              <span>全流程流转体验链路 (Full-Lifecycle Award Pipeline)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-[#ff1453]">1. 片头常驻 (Head)</div>
                <div className="text-[10px] text-[#8e8e93]">2D 微光待闭合，12点钟尾端与端头高光珠常驻。</div>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-amber-400">2. 闭合喷发 (Eruption)</div>
                <div className="text-[10px] text-[#8e8e93]">2,200+ 铁花剧烈喷发、流场扰动与刹车火花。</div>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-[#00f0ff]">3. 3D 自转 (Spin)</div>
                <div className="text-[10px] text-[#8e8e93]">立体微倾持续自转，单通道后处理切向模糊。</div>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-purple-400">4. 机械破茧 (Reveal)</div>
                <div className="text-[10px] text-[#8e8e93]">6 机械臂弧线合拢装配，3D 6DoF 自由检视。</div>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="font-bold text-emerald-400">5. 归壁 (Wall Snap)</div>
                <div className="text-[10px] text-[#8e8e93]">自转抛物线飞回勋章墙，Spring 弹性回弹磁吸。</div>
              </div>
            </div>
          </div>

          {/* Code Snippets */}
          <div className="space-y-4">
            {/* React Quick Start */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>React / Next.js 组件极速接入</span>
                </div>
                <button
                  onClick={() => handleCopy(quickStartCode, 'react')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedKey === 'react' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-black/60 border border-white/10 rounded-2xl p-3.5 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                {quickStartCode}
              </pre>
            </div>

            {/* Three.js Engine Direct Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Cpu className="w-4 h-4 text-[#00f0ff]" />
                  <span>Three.js 底层引擎直接调用</span>
                </div>
                <button
                  onClick={() => handleCopy(threeSceneUsageCode, 'three')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedKey === 'three' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-black/60 border border-white/10 rounded-2xl p-3.5 font-mono text-[11px] text-[#00f0ff] overflow-x-auto leading-relaxed">
                {threeSceneUsageCode}
              </pre>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Flame className="w-4 h-4 text-[#fa114f]" />
                <span>2,200+ 铁花 &amp; 刹车火花</span>
              </div>
              <p className="text-[11px] text-[#8e8e93]">
                全 GPU InstancedMesh，支持真实重力下落、地面弹跳、气动拉伸与赛车刹车片摩擦喷涌。
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>流场风洞 &amp; 重力回正</span>
              </div>
              <p className="text-[11px] text-[#8e8e93]">
                环体自转带动周围空气形成切向涡流风洞；鼠标拖拽松手后基于阻尼弹簧重力惯性平滑减速回正。
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>低频震动声学合成</span>
              </div>
              <p className="text-[11px] text-[#8e8e93]">
                Web Audio 纯代码合成 45Hz~72Hz 超低频体感震动与钛合金敲击，碰撞力度自适应多段硬件触感。
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>已生成完整的 src/index.ts 统一包导出与 README.md 文档</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#fa114f] via-[#a6ff00] to-[#00f0ff] text-black font-bold text-xs shadow-lg shadow-[#00f0ff]/20 active:scale-95 transition-all"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
