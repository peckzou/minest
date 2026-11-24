import React, { useRef } from 'react';
import { LayoutGrid, DoorOpen } from 'lucide-react';

// Outside and inside the Minest Imagineer Building: a joystick to walk (touch screens; the keyboard walks too), and
// one button between the two ways of seeing it — walking through it, or the doll's-house view of all eight rooms.
interface Props { view: 'walk' | 'doll'; hideView?: boolean; message: string | null; onView: (v: 'walk' | 'doll') => void; onJoy: (x: number, y: number) => void }
const glass = { backgroundColor: 'rgba(13, 19, 31, 0.86)' };

export function BuildingHud(p: Props) {
  const pad = useRef<HTMLDivElement>(null), knob = useRef<HTMLDivElement>(null), id = useRef<number | null>(null);
  const move = (e: React.PointerEvent) => {
    if (id.current !== e.pointerId || !pad.current || !knob.current) return;
    const r = pad.current.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy), k = d > R ? R / d : 1; dx *= k; dy *= k;
    knob.current.style.transform = `translate(${dx}px,${dy}px)`; p.onJoy(dx / R, -dy / R);
  };
  const end = (e: React.PointerEvent) => { if (id.current !== e.pointerId) return; id.current = null; if (knob.current) knob.current.style.transform = ''; p.onJoy(0, 0); };
  const walk = p.view === 'walk';
  return (
    <>
      {!p.hideView && <button type="button" onClick={() => p.onView(walk ? 'doll' : 'walk')} className="fixed z-40 top-3 right-3 w-12 h-12 rounded-full border border-amber-400/70 flex items-center justify-center text-amber-100 hover:bg-amber-400/15 active:scale-95 transition" style={glass} aria-label={walk ? '看整栋大楼' : '走进大楼'} title={walk ? '看整栋大楼' : '走进大楼'}>
        {walk ? <LayoutGrid className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
      </button>}
      {walk && (
        <div ref={pad} className="fixed z-40 left-4 bottom-5 w-28 h-28 rounded-full border border-slate-500/70 touch-none" style={{ backgroundColor: 'rgba(13, 19, 31, 0.45)' }} aria-label="移动摇杆"
          onPointerDown={(e) => { id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <div ref={knob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-amber-400/80" />
        </div>
      )}
      {p.message && <div role="status" aria-live="polite" className="fixed z-40 bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100vw-290px)] px-5 py-2.5 rounded-full border border-amber-400/70 text-amber-100 font-semibold truncate" style={glass}>{p.message}</div>}
    </>
  );
}
