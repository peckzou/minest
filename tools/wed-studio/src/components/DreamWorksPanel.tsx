import React from 'react';
import { X, Hammer, Castle, Pencil, Play, Plus } from 'lucide-react';
import type { DreamWork } from '../minest/dreamWorks';

// 梦想作品 · the Imagineer 4.0 works, as a side panel of the WED studio.
// Pick one → 上沙盘制作 (voxels grow on the model table) → 放进迪士尼乐园, or back to 梦工坊 to edit or play it.
interface Props {
  open: boolean;
  works: DreamWork[];
  activeId: string | null;
  building: number; // 0..1 while the making-of runs, -1 when idle
  onClose: () => void;
  onBuild: (w: DreamWork) => void;
  onSkip: () => void;
  onPlace: (w: DreamWork) => void;
  onEdit: (w: DreamWork) => void;
  onPlay: (w: DreamWork) => void;
  onNew: () => void;
  onClear: () => void;
}

const when = (t?: number) => (t ? new Date(t).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '');

export function DreamWorksPanel(p: Props) {
  if (!p.open) return null;
  const active = p.works.find((w) => w.id === p.activeId) || null;
  return (
    <aside
      className="fixed z-40 top-[64px] right-3 w-[min(340px,calc(100vw-24px))] max-h-[calc(100vh-190px)] flex flex-col rounded-xl border border-amber-400/40 text-slate-200 shadow-2xl"
      style={{ backgroundColor: 'rgba(13, 19, 31, 0.96)' }}
      aria-label="梦想作品"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/70">
        <div>
          <div className="text-sm font-bold text-amber-200 font-display">梦想作品 · Imagineer 4.0</div>
          <div className="text-[11px] text-slate-400">把梦工坊里造的世界搬上沙盘，再放进迪士尼乐园</div>
        </div>
        <button type="button" onClick={p.onClose} className="p-1.5 rounded-md hover:bg-slate-800" aria-label="关闭">
          <X className="w-4 h-4" />
        </button>
      </div>

      {active && (
        <div className="px-4 py-3 border-b border-slate-700/70 bg-amber-400/5">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-amber-300">沙盘上：</span>
            <button type="button" onClick={p.onClear} className="text-slate-400 hover:text-amber-300">收起，换回乐园沙盘</button>
          </div>
          <div className="text-sm font-semibold truncate">{active.title || '未命名的梦'}</div>
          {p.building >= 0 ? (
            <div className="mt-2">
              <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 transition-[width] duration-100" style={{ width: Math.round(p.building * 100) + '%' }} />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400">
                <span>工匠正在搭体素… {Math.round(p.building * 100)}%</span>
                <button type="button" onClick={p.onSkip} className="text-amber-300 hover:underline">直接完成</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
              <button type="button" onClick={() => p.onPlace(active)} className="col-span-3 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg">
                <Castle className="w-3.5 h-3.5" /> 放进迪士尼乐园
              </button>
              <button type="button" onClick={() => p.onEdit(active)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] rounded-md border border-slate-600 hover:border-amber-400">
                <Pencil className="w-3 h-3" /> 回梦工坊改
              </button>
              <button type="button" onClick={() => p.onPlay(active)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] rounded-md border border-slate-600 hover:border-amber-400">
                <Play className="w-3 h-3" /> 进去玩
              </button>
              <button type="button" onClick={() => p.onBuild(active)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] rounded-md border border-slate-600 hover:border-amber-400">
                <Hammer className="w-3 h-3" /> 重新搭
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-y-auto px-2 py-2 flex-1">
        {p.works.length === 0 && (
          <p className="px-2 py-4 text-xs text-slate-400 leading-relaxed">
            还没有梦想作品。先去梦工坊用一句话造一个梦，回来就能把它搬上沙盘。
          </p>
        )}
        {p.works.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => p.onBuild(w)}
            disabled={p.building >= 0}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-3 transition-colors disabled:opacity-50 ${
              w.id === p.activeId ? 'bg-amber-400/15 border border-amber-400/50' : 'border border-transparent hover:bg-slate-800/80'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm truncate">{w.title || '未命名的梦'}</span>
              <span className="block text-[11px] text-slate-400">
                {(w.objects || []).length} 个模型 · {when(w.updated || w.created)}{w.shelf ? ' · 已在背包' : ''}
              </span>
            </span>
            <span className="text-[11px] text-amber-300 shrink-0">上沙盘</span>
          </button>
        ))}
      </div>

      <div className="px-3 py-2.5 border-t border-slate-700/70">
        <button type="button" onClick={p.onNew} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-dashed border-slate-600 hover:border-amber-400 text-slate-300">
          <Plus className="w-3.5 h-3.5" /> 去梦工坊造一个新梦
        </button>
      </div>
    </aside>
  );
}
