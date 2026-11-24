import React from 'react';
import { Hammer, Sun, Moon, Home, Box, ArrowLeft, Undo2, Building2 } from 'lucide-react';
import type { CameraPresetId, LightingMode } from '../types/studio';

// The studio's only chrome: a way back, undo, and a row of places to look from — icons, no words. Works are chosen on
// the blueprint board behind the table (dream/worksBoard.ts); the old works button only shows where 梦工坊's engine
// could not load and the panel is still needed.
const VIEWS: { id: CameraPresetId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: '全景', Icon: Home },
  { id: 'model-table', label: '模型车间', Icon: Box },
];   // the other departments are reached by their signs in the room (App.tsx, DEPARTMENTS)

interface Props {
  backHref: string;
  onBuilding: (() => void) | null;
  worksCount: number;
  worksOpen: boolean;
  showWorks: boolean;
  onToggleWorks: () => void;
  onUndo: (() => void) | null;
  activeCamera: CameraPresetId;
  onSelectCamera: (id: CameraPresetId) => void;
  lightingMode: LightingMode;
  onToggleNight: () => void;
}
const glass = { backgroundColor: 'rgba(13, 19, 31, 0.88)' };
const round = 'w-11 h-11 rounded-full border border-slate-700 flex items-center justify-center text-slate-200 hover:border-amber-400 active:scale-95 transition';

export function StudioBar(p: Props) {
  const night = p.lightingMode === 'late-night';
  return (
    <>
      <header className="fixed top-3 left-3 right-3 z-30 flex items-center gap-2 pointer-events-none">
        {p.onBuilding
          ? <button type="button" onClick={p.onBuilding} className={round + ' pointer-events-auto'} style={glass} aria-label="回造梦大楼" title="回造梦大楼"><Building2 className="w-5 h-5" /></button>
          : <a href={p.backHref} className={round + ' pointer-events-auto'} style={glass} aria-label="回梦工坊" title="回梦工坊"><ArrowLeft className="w-5 h-5" /></a>}
        {p.onUndo && <button type="button" onClick={p.onUndo} className={round + ' pointer-events-auto'} style={glass} aria-label="撤销上一步" title="撤销上一步 (⌘Z)"><Undo2 className="w-5 h-5" /></button>}
        <span className="flex-1" />
        {p.showWorks && (
          <button type="button" onClick={p.onToggleWorks} aria-pressed={p.worksOpen} className="pointer-events-auto px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1.5 border text-amber-200 border-amber-400/60" style={glass}>
            <Hammer className="w-3.5 h-3.5" /> 梦想作品 {p.worksCount}
          </button>
        )}
      </header>
      {!p.onBuilding && <nav className="fixed bottom-3 right-3 z-30 flex flex-col items-center gap-1 p-1 rounded-full border border-slate-700" style={glass} aria-label="视角">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" onClick={() => p.onSelectCamera(v.id)} aria-label={v.label} title={v.label} aria-pressed={p.activeCamera === v.id}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${p.activeCamera === v.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}>
            <v.Icon className="w-4 h-4" />
          </button>
        ))}
        <span className="h-px w-5 bg-slate-700 my-0.5" />
        <button type="button" onClick={p.onToggleNight} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-200" aria-label={night ? '换成白天' : '换成夜晚'} title={night ? '白天' : '夜晚'}>
          {night ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>}
    </>
  );
}
