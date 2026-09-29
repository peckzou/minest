import React, { useEffect, useRef, useState } from 'react';
import { BADGE_CATALOG, BadgeCatalogItem } from '../three/BadgeGeometries';
import { OptimizedBadgeInspectorScene, PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { RotateCw, Sparkles, ZoomIn, ZoomOut, Compass, ShieldCheck, Flame, Sliders, Sun, Eye } from 'lucide-react';
import { AwardLightingEnvironment } from '../three/AppleAwardMaterials';

interface BadgeInspectorViewProps {
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
  sharedMaterials: AppleAwardMaterials;
}

export const BadgeInspectorView: React.FC<BadgeInspectorViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OptimizedBadgeInspectorScene | null>(null);

  const [selectedBadge, setSelectedBadge] = useState<BadgeCatalogItem>(BADGE_CATALOG[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [inertiaEnabled, setInertiaEnabled] = useState(true);
  const [idleFloatEnabled, setIdleFloatEnabled] = useState(true);
  const [springSpeed, setSpringSpeed] = useState(14);
  const [friction, setFriction] = useState(3.8);

  // Dynamic Fresnel & Studio Environment State
  const [fresnelIntensity, setFresnelIntensity] = useState(sharedMaterials.fresnelIntensity || 1.0);
  const [fresnelPower, setFresnelPower] = useState(sharedMaterials.fresnelPower || 3.2);
  const [lightingEnv, setLightingEnv] = useState<AwardLightingEnvironment>(sharedMaterials.currentEnvironment || 'studio');

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OptimizedBadgeInspectorScene(containerRef.current, sharedMaterials);
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.loadBadge(selectedBadge);
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials]);

  // Handle badge switch
  const handleSelectBadge = (badge: BadgeCatalogItem) => {
    setSelectedBadge(badge);
    setIsFlipped(false);
    if (sceneRef.current) {
      sceneRef.current.loadBadge(badge);
    }
  };

  // Handle flip
  const handleToggleFlip = () => {
    if (sceneRef.current) {
      sceneRef.current.toggleFlip();
      setIsFlipped((prev) => !prev);
    }
  };

  // Handle reset
  const handleResetOrientation = () => {
    if (sceneRef.current) {
      sceneRef.current.resetOrientation();
      setIsFlipped(false);
    }
  };

  // Update physics settings
  const handleInertiaToggle = (enabled: boolean) => {
    setInertiaEnabled(enabled);
    if (sceneRef.current) {
      sceneRef.current.enableInertia = enabled;
    }
  };

  const handleIdleFloatToggle = (enabled: boolean) => {
    setIdleFloatEnabled(enabled);
    if (sceneRef.current) {
      sceneRef.current.enableIdleFloat = enabled;
    }
  };

  const handleSpringChange = (val: number) => {
    setSpringSpeed(val);
    if (sceneRef.current) {
      sceneRef.current.springSpeed = val;
    }
  };

  const handleFrictionChange = (val: number) => {
    setFriction(val);
    if (sceneRef.current) {
      sceneRef.current.inertiaFriction = val;
    }
  };

  const handleFresnelIntensityChange = (val: number) => {
    setFresnelIntensity(val);
    sharedMaterials.setGlobalFresnelIntensity(val);
    sceneRef.current?.wakeUp();
  };

  const handleFresnelPowerChange = (val: number) => {
    setFresnelPower(val);
    sharedMaterials.setGlobalFresnelPower(val);
    sceneRef.current?.wakeUp();
  };

  const handleLightingEnvChange = (env: AwardLightingEnvironment) => {
    setLightingEnv(env);
    sharedMaterials.setLightingEnvironment(env);
    sceneRef.current?.wakeUp();
  };

  const handleZoom = (delta: number) => {
    if (sceneRef.current) {
      sceneRef.current.setZoom(sceneRef.current.zoomLevel + delta);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 3D Viewport Column */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Main 3D Canvas Box */}
        <div className="relative w-full h-[460px] sm:h-[540px] rounded-3xl bg-gradient-to-b from-[#0c1017] via-[#080b10] to-[#040608] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Three.js Canvas Container */}
          <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
          />

          {/* Top Status Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-[#121620]/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span className="text-xs font-medium text-white tracking-wide">
                {isFlipped ? '反面 · 证书编号与激光铭文' : '正面 · 景泰蓝微浮雕与 24K 镜面倒角'}
              </span>
            </div>

            {/* Zoom / Reset Tool Buttons */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={() => handleZoom(-0.5)}
                className="w-8 h-8 rounded-full bg-[#181e28]/90 hover:bg-[#252f3f] border border-white/10 text-white flex items-center justify-center transition-all active:scale-95 text-xs font-bold"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(0.5)}
                className="w-8 h-8 rounded-full bg-[#181e28]/90 hover:bg-[#252f3f] border border-white/10 text-white flex items-center justify-center transition-all active:scale-95 text-xs font-bold"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetOrientation}
                className="w-8 h-8 rounded-full bg-[#181e28]/90 hover:bg-[#252f3f] border border-white/10 text-white flex items-center justify-center transition-all active:scale-95"
                title="归位朝向"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Floating Action Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* 180° Flip Button */}
              <button
                onClick={handleToggleFlip}
                className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs shadow-lg hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? '翻转至正面' : '翻转 180° 查看背部铭文'}</span>
              </button>
            </div>

            <div className="text-[11px] text-[#8e8e93] bg-[#121620]/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full pointer-events-auto flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00f0ff]" />
              <span>支持手指滑动甩动、惯性滑行、滚轮缩放</span>
            </div>
          </div>
        </div>

        {/* Badge Catalog Selector */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8e8e93] mb-3 flex items-center justify-between">
            <span>选择勋章样张 (Apple Fitness / Knowledge 典藏版)</span>
            <span>{BADGE_CATALOG.length} 款定制款</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BADGE_CATALOG.map((badge) => {
              const isSelected = selectedBadge.id === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => handleSelectBadge(badge)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white/10 border-[#00f0ff] shadow-sm'
                      : 'bg-[#181e28]/50 border-white/5 hover:bg-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: `#${badge.primaryColor.toString(16).padStart(6, '0')}`,
                      }}
                    />
                    <span className="text-[10px] text-[#8e8e93] truncate">{badge.bezel}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{badge.name}</div>
                  <div className="text-[10px] text-[#8e8e93] mt-0.5 truncate">{badge.badgeStyle}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control & Technical Specs Column */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Active Badge Info Card */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#8e8e93] mb-2">
            <span className="uppercase tracking-wider font-semibold text-[#00f0ff]">
              {selectedBadge.category}
            </span>
            <span>{selectedBadge.earnedDate}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            {selectedBadge.name}
          </h2>
          <p className="text-xs text-[#b0b8c4] leading-relaxed mb-4">
            {selectedBadge.longDescription}
          </p>

          <div className="bg-[#181e28] rounded-xl p-3 border border-white/5 text-xs">
            <div className="text-[11px] uppercase tracking-wider text-[#8e8e93] mb-1 font-semibold">
              成就指标与典藏记录
            </div>
            <div className="text-white font-medium">{selectedBadge.stats}</div>
          </div>
        </div>

        {/* Physics & Smoothness Tuning Panel */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ffd60a]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                交互平滑度与物理引擎调校
              </h3>
            </div>
            <span className="text-[11px] text-[#8e8e93]">Euler / Verlet 积分</span>
          </div>

          {/* Inertia Switch */}
          <div className="flex items-center justify-between p-3 bg-[#181e28] rounded-xl border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">甩动手势惯性滑行 (Kinetic Inertia)</div>
              <div className="text-[11px] text-[#8e8e93]">
                优化前：手势抬起即瞬间定死；优化后：平滑带阻尼甩脱滑行
              </div>
            </div>
            <button
              onClick={() => handleInertiaToggle(!inertiaEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                inertiaEnabled ? 'bg-[#00f0ff]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                  inertiaEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Idle Floating Switch */}
          <div className="flex items-center justify-between p-3 bg-[#181e28] rounded-xl border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">无操作悬浮呼吸 (Idle Floating)</div>
              <div className="text-[11px] text-[#8e8e93]">
                8 字形 Lissajous 仿生微幅漂浮与边缘高光扫掠
              </div>
            </div>
            <button
              onClick={() => handleIdleFloatToggle(!idleFloatEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                idleFloatEnabled ? 'bg-[#00f0ff]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                  idleFloatEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Spring Responsiveness Slider */}
          <div className="p-3 bg-[#181e28] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-medium">弹簧跟随响应速度 (Spring Speed)</span>
              <span className="font-mono text-[#00f0ff]">{springSpeed}</span>
            </div>
            <input
              type="range"
              min="6"
              max="24"
              step="1"
              value={springSpeed}
              onChange={(e) => handleSpringChange(Number(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8e8e93]">
              <span>柔和缓动 (6)</span>
              <span>Apple 标准 (14)</span>
              <span>极速紧贴 (24)</span>
            </div>
          </div>

          {/* Friction Slider */}
          <div className="p-3 bg-[#181e28] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-medium">惯性摩擦阻尼 (Friction Decay)</span>
              <span className="font-mono text-[#ffd60a]">{friction.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.2"
              value={friction}
              onChange={(e) => handleFrictionChange(Number(e.target.value))}
              className="w-full accent-[#ffd60a] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8e8e93]">
              <span>长距离滑行 (1.0)</span>
              <span>自然阻尼 (3.8)</span>
              <span>快速停止 (8.0)</span>
            </div>
          </div>

          {/* Dynamic Fresnel Reflection & Lighting Environment Card */}
          <div className="p-3.5 bg-gradient-to-b from-[#181e28] to-[#121620] rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">动态菲涅尔反射 (Fresnel Luster)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {fresnelIntensity.toFixed(1)}x / Power {fresnelPower.toFixed(1)}
              </span>
            </div>

            {/* Lighting Environments */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#8e8e93] flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>全景光照与边缘反射色调</span>
              </span>
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {[
                  { id: 'studio', label: '影棚', color: 'bg-slate-700' },
                  { id: 'warm_gold', label: '24K金', color: 'bg-amber-600' },
                  { id: 'outdoor', label: '户外', color: 'bg-sky-600' },
                  { id: 'sunset', label: '晚霞', color: 'bg-rose-600' },
                  { id: 'cyberpunk', label: '赛博', color: 'bg-cyan-600' },
                ].map((env) => (
                  <button
                    key={env.id}
                    onClick={() => handleLightingEnvChange(env.id as AwardLightingEnvironment)}
                    className={`py-1.5 px-1 rounded-lg text-center text-[10px] font-bold border transition-all active:scale-95 ${
                      lightingEnv === env.id
                        ? 'bg-white/20 text-white border-white shadow-sm'
                        : 'bg-black/30 border-white/5 text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    {env.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fresnel Intensity Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8e8e93]">掠射角金属润泽度 (Fresnel Intensity)</span>
                <span className="font-mono text-emerald-400 font-bold">{fresnelIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.1"
                value={fresnelIntensity}
                onChange={(e) => handleFresnelIntensityChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
            </div>

            {/* Fresnel Power Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8e8e93]">边缘锐度 (Rim Sharpness / Power)</span>
                <span className="font-mono text-cyan-400 font-bold">{fresnelPower.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="6.0"
                step="0.2"
                value={fresnelPower}
                onChange={(e) => handleFresnelPowerChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Technical Highlight Card */}
        <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>动画 1 核心性能改善点 (Zero-Allocation Math Pipeline)</span>
          </div>
          <ul className="text-xs text-[#8e8e93] space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>消除了堆内存分配：</strong>原版在每次 pointermove 生成 new THREE.Quaternion()，现改为模块级复用全局 scratch 变量，GC 开销从每秒 120KB 降为 0B。
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>帧率自适应插值：</strong>使用 1 - exp(-speed * dt) 替代硬编码 0.16 常数，在 120Hz ProMotion 屏幕与 60Hz 屏幕上物理手感完全一致。
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>智能休眠管线：</strong>勋章在静止 3 秒后自动暂停高频渲染，极大节省移动设备发热与能耗。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
