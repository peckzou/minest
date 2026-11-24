import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  FileText,
  Layers,
  Lightbulb,
  Volume2,
  VolumeX,
  Hammer,
  RotateCcw,
  Sun,
  Moon,
  Grid,
  Train,
} from 'lucide-react';
import {
  ArtifactInfo,
  BlueprintId,
  BLUEPRINT_SPECS,
  CameraPresetId,
  LightingMode,
  ParkEdition,
  VoxelBrushType,
} from '../types/studio';

interface StudioControlDockProps {
  parkEdition: ParkEdition;
  onSelectParkEdition: (edition: ParkEdition) => void;
  activeCamera: CameraPresetId;
  onSelectCamera: (preset: CameraPresetId) => void;
  activeBlueprint: BlueprintId;
  onSelectBlueprint: (id: BlueprintId) => void;
  lightingMode: LightingMode;
  onSelectLighting: (mode: LightingMode) => void;
  explodedAmount: number;
  onChangeExploded: (val: number) => void;
  draftingTiltDeg: number;
  onChangeDraftingTilt: (deg: number) => void;
  trainSpeedMultiplier: number;
  onToggleTrainPause: () => void;
  onBlowWhistle: () => void;
  voxelBuildEnabled: boolean;
  onToggleVoxelBuild: () => void;
  activeVoxelBrush: VoxelBrushType;
  onSelectVoxelBrush: (brush: VoxelBrushType) => void;
  customVoxelCount: number;
  onClearCustomVoxels: () => void;
  selectedArtifact: ArtifactInfo | null;
  onCloseArtifact: () => void;
  onOpenBlueprintModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDockCollapsed: boolean;
  onToggleDockCollapse: () => void;
  dreamWorksCount: number;
  dreamWorksOpen: boolean;
  onToggleDreamWorks: () => void;
  backHref: string;
}

const CAMERA_NAV_ITEMS: { id: CameraPresetId; label: string }[] = [
  { id: 'overview', label: '工坊全景' },
  { id: 'drafting', label: '复古绘图板' },
  { id: 'model-table', label: '微缩模型台' },
  { id: 'walts-office', label: '沃尔特3H办公室' },
  { id: 'machine-shop', label: '蒸汽机车工坊' },
];

const VOXEL_BRUSHES: { id: VoxelBrushType; label: string; swatch: string }[] = [
  { id: 'castle-pink', label: '城堡粉砖', swatch: '#f4acb7' },
  { id: 'royal-blue', label: '皇室蓝瓦', swatch: '#2563eb' },
  { id: 'gold-spire', label: '鎏金塔尖', swatch: '#f59e0b' },
  { id: 'emerald-tree', label: '松林绿植', swatch: '#16a34a' },
  { id: 'water-moat', label: '护城碧水', swatch: '#0ea5e9' },
  { id: 'red-brick', label: '小镇红砖', swatch: '#dc2626' },
  { id: 'erase', label: '移除体素', swatch: '#475569' },
];

export const StudioControlDock: React.FC<StudioControlDockProps> = ({
  parkEdition,
  onSelectParkEdition,
  activeCamera,
  onSelectCamera,
  activeBlueprint,
  onSelectBlueprint,
  lightingMode,
  onSelectLighting,
  explodedAmount,
  onChangeExploded,
  draftingTiltDeg,
  onChangeDraftingTilt,
  trainSpeedMultiplier,
  onToggleTrainPause,
  onBlowWhistle,
  voxelBuildEnabled,
  onToggleVoxelBuild,
  activeVoxelBrush,
  onSelectVoxelBrush,
  customVoxelCount,
  onClearCustomVoxels,
  selectedArtifact,
  onCloseArtifact,
  onOpenBlueprintModal,
  soundEnabled,
  onToggleSound,
  isDockCollapsed,
  onToggleDockCollapse,
  dreamWorksCount,
  dreamWorksOpen,
  onToggleDreamWorks,
  backHref,
}) => {
  const currentBpSpec = BLUEPRINT_SPECS[activeBlueprint];

  const workshopStations: { id: CameraPresetId; label: string }[] = [
    { id: 'overview', label: '01. 工坊全景' },
    { id: 'drafting', label: '02. 复古绘图板 & 1953画架' },
    {
      id: 'model-table',
      label:
        parkEdition === 'orlando-1971'
          ? '03. 奥兰多 WDW 沙盘 (含地下走廊)'
          : '03. 加州阿纳海姆微缩沙盘',
    },
    {
      id: 'castle-closeup',
      label:
        parkEdition === 'orlando-1971'
          ? '04. 189英尺灰姑娘城堡 & EPCOT球'
          : '04. 77英尺睡美人城堡微距',
    },
    { id: 'walts-office', label: '05. 沃尔特 3H 总裁办公室 & 1+7奥斯卡' },
    { id: 'kem-weber-desk', label: '06. Kem Weber 动画桌 & 多平面塔' },
    { id: 'animatronics-lab', label: '07. 小人计划 & 提基鸟实验台' },
    { id: 'machine-shop', label: '08. 礼利贝尔号蒸汽机车车床' },
    { id: 'blueprint-wall', label: '09. 蓝图档案 & 玛丽布莱尔墙' },
  ];

  const activeEditionBlueprints: { id: BlueprintId; short: string }[] =
    parkEdition === 'orlando-1971'
      ? [
          { id: 'cinderella-castle-189', short: '灰姑娘城堡' },
          { id: 'florida-project-epcot', short: '佛州EPCOT总规' },
          { id: 'spaceship-earth-geodesic', short: '地球飞船球体' },
          { id: 'monorail-contemporary', short: '单轨穿A字酒店' },
        ]
      : [
          { id: 'castle-elevation', short: '睡美人城堡' },
          { id: 'master-plan', short: '加州全园总规' },
          { id: 'locomotive-mark1', short: '蒸汽火车1号' },
          { id: 'moonliner-tomorrowland', short: 'TWA登月火箭' },
        ];

  return (
    <>
      {/* ====================================================================
          TOP BAR CONTRACT: 1-Row, 3-Zone Header (Zero backdrop-filter over WebGL)
          ==================================================================== */}
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-4 md:px-6 py-3.5 border-b border-slate-800/90"
        style={{ backgroundColor: 'rgba(13, 19, 31, 0.94)' }}
      >
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            onSelectCamera('overview');
          }}
          className="text-lg font-bold tracking-tight text-amber-100 whitespace-nowrap truncate min-w-0 font-display"
        >
          {parkEdition === 'orlando-1971'
            ? 'WED Enterprises · The Florida Project (Orlando 1971)'
            : 'WED Enterprises · Anaheim Studio (1954)'}
        </a>

        {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {CAMERA_NAV_ITEMS.map((item) => {
            const isActive = activeCamera === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCamera(item.id);
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-0.5 border-b-2 ${
                  isActive
                    ? 'text-amber-300 border-amber-400 font-semibold'
                    : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={backHref}
            className="px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-600 hover:border-amber-400 rounded-lg whitespace-nowrap"
          >
            ‹ 梦工坊
          </a>
          <button
            type="button"
            onClick={onToggleDreamWorks}
            aria-pressed={dreamWorksOpen}
            className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1.5 border ${
              dreamWorksOpen ? 'bg-amber-400 text-slate-950 border-amber-400' : 'text-amber-200 border-amber-400/60 hover:bg-amber-400/10'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>梦想作品 {dreamWorksCount}</span>
          </button>
          <button
            type="button"
            onClick={onOpenBlueprintModal}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">查阅晒图蓝图档案</span><span className="lg:hidden">蓝图</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (100% Unobstructed Center)
          ==================================================================== */}
      <div
        className="fixed left-1/2 z-30 -translate-x-1/2 transition-transform duration-200 ease-out"
        style={{
          bottom: '16px',
          width: 'min(980px, 95vw)',
          transform: isDockCollapsed
            ? 'translate(-50%, calc(100% - 36px))'
            : 'translate(-50%, 0)',
        }}
      >
        {/* Top Collapse / Expand Tab & Active Station Quick Status */}
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div
            className="px-3.5 py-1.5 rounded-t-lg border border-b-0 border-slate-700/80 text-xs text-slate-300 flex items-center gap-2 font-mono-tabular"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[260px] sm:max-w-[440px]">
              当前图纸: {currentBpSpec.code} · {currentBpSpec.title}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 whitespace-nowrap">
              {parkEdition === 'orlando-1971'
                ? '奥兰多 WDW 沙盘 (拉开爆炸滑杆透视地下 Utilidors 管网)'
                : '加州初代 Disneyland 1955 沙盘'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleDockCollapse}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>展开工坊控制台 (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                <span>隐藏控制栏 (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Panel (Solid High-Contrast Dark Slate Surface — No backdrop-blur stall) */}
        <div
          className="rounded-xl border border-slate-700/90 shadow-2xl p-3.5 space-y-3"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.96)' }}
        >
          {/* Optional Selected 3D Artifact Details Drawer Banner */}
          {selectedArtifact && (
            <div className="p-3 rounded-lg bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
                  <span>{selectedArtifact.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArtifact.year}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArtifact.locationInStudio}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{selectedArtifact.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {selectedArtifact.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedArtifact.relatedBlueprint && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBlueprint(selectedArtifact.relatedBlueprint!);
                      onOpenBlueprintModal();
                    }}
                    className="px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    查看关联蓝图
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseArtifact}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs whitespace-nowrap transition-colors"
                >
                  收起说明
                </button>
              </div>
            </div>
          )}

          {/* Park Diorama Edition Switcher + Quick 8-Station Disney Imagineering Workshop Tour Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-slate-800/90">
            {/* Park Edition Segmented Switch: Orlando WDW (1971) vs Anaheim (1955) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-amber-500/40 shrink-0 mr-1">
              <button
                type="button"
                onClick={() => onSelectParkEdition('orlando-1971')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  parkEdition === 'orlando-1971'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                奥兰多 WDW (1971)
              </button>
              <button
                type="button"
                onClick={() => onSelectParkEdition('anaheim-1955')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  parkEdition === 'anaheim-1955'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                加州阿纳海姆 (1955)
              </button>
            </div>

            <span className="text-[11px] font-mono-tabular text-slate-500 whitespace-nowrap shrink-0">
              |
            </span>

            {workshopStations.map((st) => {
              const active = activeCamera === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectCamera(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/60'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Row 1: Blueprint Switcher + Exploded & Tilt Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Blueprint Selector Segmented Bar (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-tabular">
                <span>
                  {parkEdition === 'orlando-1971'
                    ? '奥兰多佛州计划绘图板蓝图 · FLORIDA PROJECT BLUEPRINTS'
                    : '加州初代乐园绘图板蓝图 · ANAHEIM 1955 BLUEPRINTS'}
                </span>
                <button
                  type="button"
                  onClick={onOpenBlueprintModal}
                  className="text-amber-400 hover:underline"
                >
                  高清放大检视 (全8张档案)
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
                {activeEditionBlueprints.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => onSelectBlueprint(bp.id)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap truncate ${
                      activeBlueprint === bp.id
                        ? 'bg-sky-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bp.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Exploded View & Drafting Board Tilt (6 cols) */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3">
              {/* Exploded Layer Separation Slider */}
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-center">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-tabular mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>
                      {parkEdition === 'orlando-1971'
                        ? '沙盘爆炸 (透视地下走廊)'
                        : '沙盘分层爆炸'}
                    </span>
                  </span>
                  <span className="text-amber-300">{Math.round(explodedAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodedAmount}
                  onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  aria-label="沙盘与绘图工具分层爆炸视图比例"
                />
              </div>

              {/* Vintage Drafting Board Tilt Slider */}
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-center">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-tabular mb-1">
                  <span>复古绘图板倾角</span>
                  <span className="text-amber-300">{draftingTiltDeg}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={35}
                  step={1}
                  value={draftingTiltDeg}
                  onChange={(e) => onChangeDraftingTilt(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  aria-label="复古绘图板桌面倾斜角度"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Voxel Model Table Sculpting Brushes + Studio Lighting & Train Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/90">
            {/* Left: Interactive Voxel Sculpting Mode & Material Swatches */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleVoxelBuild}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border ${
                  voxelBuildEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>{voxelBuildEnabled ? '体素搭建已开启' : '沙盘体素建造'}</span>
              </button>

              {VOXEL_BRUSHES.map((b) => {
                const isSelected = activeVoxelBrush === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelectVoxelBrush(b.id);
                      if (!voxelBuildEnabled) onToggleVoxelBuild();
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border ${
                      isSelected && voxelBuildEnabled
                        ? 'bg-slate-800 text-white border-amber-400'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/20"
                      style={{ backgroundColor: b.swatch }}
                    />
                    <span>{b.label}</span>
                  </button>
                );
              })}

              {customVoxelCount > 0 && (
                <button
                  type="button"
                  onClick={onClearCustomVoxels}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                  title="重置自定义搭建的体素"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置 ({customVoxelCount})</span>
                </button>
              )}
            </div>

            {/* Right: Lighting Mode, Steam Train & Sound Controls */}
            <div className="flex items-center gap-1.5">
              {/* Lighting Presets */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectLighting('studio-day')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                    lightingMode === 'studio-day'
                      ? 'bg-amber-500/25 text-amber-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>暖阳工坊</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLighting('late-night')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                    lightingMode === 'late-night'
                      ? 'bg-indigo-500/30 text-indigo-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>绘图台灯</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLighting('walts-desk-lamp')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                    lightingMode === 'walts-desk-lamp'
                      ? 'bg-amber-600/35 text-amber-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="沃尔特·迪士尼 3H 办公室专属黄铜台灯氛围光"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>3H办公台灯</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLighting('blueprint-xray')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                    lightingMode === 'blueprint-xray'
                      ? 'bg-sky-500/30 text-sky-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>蓝图轴网</span>
                </button>
              </div>

              {/* Steam Train Pause/Run & Whistle */}
              <button
                type="button"
                onClick={onBlowWhistle}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                title="鸣响圣达菲1号蒸汽火车汽笛"
              >
                <Train className="w-3.5 h-3.5" />
                <span>汽笛</span>
              </button>

              <button
                type="button"
                onClick={onToggleTrainPause}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0"
              >
                {trainSpeedMultiplier > 0 ? '列车: 运行' : '列车: 暂停'}
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                aria-label={soundEnabled ? '静音' : '开启工坊音效'}
                title={soundEnabled ? '工坊音效已开启' : '工坊音效已静音'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
