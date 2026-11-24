import React, { useRef } from 'react';
import { ArrowUpFromLine, Sailboat, Footprints, Sparkles, X } from 'lucide-react';
import type { KnowledgeCard } from '../dream/dreamHost';

// Inside the world: no panels, only a way out (rise back to the studio), a go button, fireworks, a joystick for
// touch screens, and the knowledge card of whatever the guest tapped.
interface Props {
  riding: boolean;
  message: string | null;
  card: KnowledgeCard | null;
  onCloseCard: () => void;
  onLeave: () => void;
  onGo: () => void;
  onFireworks: () => void;
  onJoy: (x: number, y: number) => void;
}
const glass = { backgroundColor: 'rgba(13, 19, 31, 0.82)' };
const round = 'w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center text-slate-100 hover:border-amber-400 active:scale-95 transition';

export function GuestHud(p: Props) {
  const pad = useRef<HTMLDivElement>(null), knob = useRef<HTMLDivElement>(null), id = useRef<number | null>(null);
  const move = (e: React.PointerEvent) => {
    if (id.current !== e.pointerId || !pad.current || !knob.current) return;
    const r = pad.current.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy), k = d > R ? R / d : 1; dx *= k; dy *= k;
    knob.current.style.transform = `translate(${dx}px,${dy}px)`;
    p.onJoy(dx / R, -dy / R);
  };
  const end = (e: React.PointerEvent) => {
    if (id.current !== e.pointerId) return;
    id.current = null; if (knob.current) knob.current.style.transform = ''; p.onJoy(0, 0);
  };
  return (
    <>
      <button type="button" onClick={p.onLeave} className={`fixed z-40 top-3 left-3 ${round}`} style={glass} aria-label="回到工作室" title="回到工作室">
        <ArrowUpFromLine className="w-5 h-5" />
      </button>
      {p.message && (
        <div role="status" aria-live="polite" className="fixed z-40 top-4 left-1/2 -translate-x-1/2 max-w-[calc(100vw-140px)] px-4 py-2 rounded-full border border-amber-400/60 text-amber-100 text-sm font-semibold truncate" style={glass}>
          {p.message}
        </div>
      )}
      <div
        ref={pad}
        className="fixed z-40 left-4 bottom-5 w-28 h-28 rounded-full border border-slate-500/70 touch-none"
        style={{ backgroundColor: 'rgba(13, 19, 31, 0.45)' }}
        aria-label="移动摇杆"
        onPointerDown={(e) => { id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      >
        <div ref={knob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-amber-400/80" />
      </div>
      <div className="fixed z-40 right-4 bottom-5 flex gap-3">
        <button type="button" onClick={p.onFireworks} className={round} style={glass} aria-label="放烟花" title="放烟花">
          <Sparkles className="w-5 h-5" />
        </button>
        <button type="button" onClick={p.onGo} className={`${round} !w-14 !h-14 !border-amber-400 bg-amber-400 !text-slate-950`} aria-label={p.riding ? '开船' : '沿路线走'} title={p.riding ? '开船' : '沿路线走'}>
          {p.riding ? <Sailboat className="w-6 h-6" /> : <Footprints className="w-6 h-6" />}
        </button>
      </div>
      {p.card && (
        <div role="status" aria-live="polite" className="fixed z-40 left-1/2 -translate-x-1/2 bottom-24 w-[min(440px,calc(100vw-28px))] rounded-2xl border border-sky-400/70 p-4 text-slate-100 shadow-2xl" style={{ backgroundColor: 'rgba(13, 19, 31, 0.95)' }}>
          <button type="button" onClick={p.onCloseCard} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white" aria-label="关闭"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3 pr-6">
            <span className="text-3xl">{p.card.icon}</span>
            <div><div className="font-bold text-amber-200">{p.card.title}</div><div className="text-xs text-sky-200">{p.card.where}</div></div>
          </div>
          <p className="my-2 text-sm leading-relaxed">{p.card.text}</p>
          <div className="flex justify-between text-xs text-slate-400">
            <span className="text-emerald-300 font-semibold">{p.card.isNew ? '新印章！已盖进护照' : '已在护照里'}</span>
            <span>这个世界 {p.card.found} / {p.card.total}</span>
          </div>
        </div>
      )}
    </>
  );
}
