import React, { useEffect, useRef, useState } from 'react';
import { X, Compass, Layers, FileText, Eye } from 'lucide-react';
import {
  BlueprintId,
  BLUEPRINT_SPECS,
  CameraPresetId,
} from '../types/studio';
import { renderBlueprintToCanvas } from '../three/proceduralTextures';
import { soundEngine } from '../utils/soundEffects';

interface BlueprintInspectorModalProps {
  isOpen: boolean;
  activeBlueprint: BlueprintId;
  onSelectBlueprint: (id: BlueprintId) => void;
  onJumpToCamera: (preset: CameraPresetId) => void;
  onClose: () => void;
}

export const BlueprintInspectorModal: React.FC<BlueprintInspectorModalProps> = ({
  isOpen,
  activeBlueprint,
  onSelectBlueprint,
  onJumpToCamera,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paperVariant, setPaperVariant] = useState<'cyanotype' | 'vellum'>('cyanotype');

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderBlueprintToCanvas(canvasRef.current, activeBlueprint, paperVariant);
  }, [isOpen, activeBlueprint, paperVariant]);

  if (!isOpen) return null;

  const spec = BLUEPRINT_SPECS[activeBlueprint];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(8, 13, 23, 0.88)' }}
      role="dialog"
      aria-modal="true"
      aria-label="WED Enterprises Blueprint Archival Viewer"
    >
      <div
        className="w-full max-w-6xl rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: '#111827' }}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono-tabular">
              <span>WED ENTERPRISES ARCHIVE</span>
              <span aria-hidden="true">·</span>
              <span>{spec.code}</span>
              <span aria-hidden="true">·</span>
              <span>{spec.date}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-0.5">{spec.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Cyanotype vs Vellum Paper Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlueprintSwitch();
                  setPaperVariant('cyanotype');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paperVariant === 'cyanotype'
                    ? 'bg-sky-900/90 text-sky-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                普鲁士晒图蓝图 (Cyanotype)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlueprintSwitch();
                  setPaperVariant('vellum');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paperVariant === 'vellum'
                    ? 'bg-amber-900/80 text-amber-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                复古硫酸手绘原稿 (Vellum)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
              aria-label="关闭图纸检视"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Split: High-Res Blueprint Canvas + Engineering Spec Sheet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left 8 cols: High-Resolution Architectural Blueprint Render */}
          <div className="lg:col-span-8 p-5 bg-slate-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Blueprint Selector Strip */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {(Object.keys(BLUEPRINT_SPECS) as BlueprintId[]).map((bpId) => {
                const item = BLUEPRINT_SPECS[bpId];
                const active = bpId === activeBlueprint;
                return (
                  <button
                    key={bpId}
                    type="button"
                    onClick={() => {
                      soundEngine.playBlueprintSwitch();
                      onSelectBlueprint(bpId);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                      active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.code} · {item.title.slice(0, 10)}
                  </button>
                );
              })}
            </div>

            {/* Interactive High-Res Blueprint Sheet Canvas */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 shadow-inner bg-slate-900 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={1280}
                height={880}
                className="w-full h-auto max-h-[54vh] object-contain"
              />
            </div>

            {/* Bottom Caption Metadata (Zero-Pill Unboxed Text) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-400 font-mono-tabular">
              <div>
                <span>主创幻想工程师: {spec.architect}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>比例尺: {spec.scale}</span>
              </div>
              <div>
                <span>沙盘对应体素构件: {spec.voxelCount.toLocaleString()} Voxels</span>
              </div>
            </div>
          </div>

          {/* Right 4 cols: Imagineer Technical Notes & Quick 3D Camera Sync */}
          <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-slate-900/90">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono-tabular text-slate-400">
                  <span>01. 工程参数</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>SPECIFICATIONS</span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mt-1">{spec.subtitle}</h3>

                <dl className="mt-4 space-y-3 text-xs border-t border-slate-800 pt-3">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">沙盘重点分区</dt>
                    <dd className="text-slate-200 font-medium text-right">{spec.zoneHighlight}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">工程控制尺寸</dt>
                    <dd className="text-amber-300 font-mono-tabular text-right">{spec.dimensions}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">体素化精度</dt>
                    <dd className="text-slate-200 font-mono-tabular text-right">1 Voxel = 2.0 ft (1:48)</dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-400 mb-3">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>02. 幻想工程师手记 · DESIGN NOTES</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  {spec.notes.map((note, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <span className="font-mono-tabular text-amber-400/90 shrink-0">0{idx + 1}.</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct 3D Scene Camera Jump Actions */}
            <div className="border-t border-slate-800 pt-5 mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onJumpToCamera('drafting');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Compass className="w-4 h-4" />
                <span>在 3D 复古绘图板上检视此图纸</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onJumpToCamera(activeBlueprint === 'castle-elevation' ? 'castle-closeup' : 'model-table');
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span>定位至 3D 沙盘模型台对应建筑</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
