import React from 'react';
import { Hammer, Sun, Moon } from 'lucide-react';
import type { CameraPresetId, LightingMode } from '../types/studio';

// The WED workshop's only chrome: a slim top bar (back to 梦工坊 · name · 梦想作品) and a row of views at the bottom.
// Everything else the Studio pack had (control dock, blueprint archive, artifact cards, voxel brushes) is gone on purpose.
const VIEWS: { id: CameraPresetId; label: string }[] = [
  { id: 'overview', label: '全景' },
  { id: 'model-table', label: '沙盘' },
  { id: 'drafting', label: '绘图板' },
  { id: 'blueprint-wall', label: '蓝图墙' },
  { id: 'walts-office', label: '沃尔特办公室' },
];

interface Props {
  backHref: string;
  worksCount: number;
  worksOpen: boolean;
  onToggleWorks: () => void;
  activeCamera: CameraPresetId;
  onSelectCamera: (id: CameraPresetId) => void;
  lightingMode: LightingMode;
  onToggleNight: () => void;
}

const glass = { backgroundColor: 'rgba(13, 19, 31, 0.88)' };

export function StudioBar(p: Props) {
  const night = p.lightingMode === 'late-night';
  return (
    <>
      <header className="fixed top-3 left-3 right-3 z-30 flex items-center gap-2">
        <a href={p.backHref} className="px-3 py-2 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 hover:border-amber-400 whitespace-nowrap" style={glass}>
          ‹ 梦工坊
        </a>
        <div className="px-3 py-2 rounded-lg border border-slate-700 text-sm font-bold text-amber-100 font-display truncate min-w-0" style={glass}>
          WED 工作坊
        </div>
        <span className="flex-1" />
        <button
          type="button"
          onClick={p.onToggleWorks}
          aria-pressed={p.worksOpen}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1.5 border ${
            p.worksOpen ? 'bg-amber-400 text-slate-950 border-amber-400' : 'text-amber-200 border-amber-400/60 hover:bg-amber-400/10'
          }`}
          style={p.worksOpen ? undefined : glass}
        >
          <Hammer className="w-3.5 h-3.5" /> 梦想作品 {p.worksCount}
        </button>
      </header>

      <nav
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-full border border-slate-700 max-w-[calc(100vw-24px)] overflow-x-auto"
        style={glass}
        aria-label="视角"
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => p.onSelectCamera(v.id)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
              p.activeCamera === v.id ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
        <span className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
        <button type="button" onClick={p.onToggleNight} className="p-1.5 rounded-full text-slate-300 hover:text-amber-200 shrink-0" aria-label={night ? '换成白天' : '换成夜晚'} title={night ? '白天' : '夜晚'}>
          {night ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>
    </>
  );
}
