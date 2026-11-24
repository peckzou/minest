import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2, Volume2, MessageCircle, Hand, BookOpen, Type } from 'lucide-react';
import type { Picked } from '../dream/dreamHost';

// The note card of the thing in the hand: its name, what it says, how it answers a tap, and its knowledge card —
// the few things that need typing. Turning, growing and putting away are icons; everything else is done by hand
// on the table.
interface Props {
  thing: Picked;
  focus?: 'voice' | 'tap' | null;
  onBegin: () => void;
  onField: (f: 'name' | 'voice' | 'tap' | 'text' | 'fact' | 'color', v: string) => void;
  onAct: (a: 'left' | 'right' | 'bigger' | 'smaller' | 'remove' | 'listen') => void;
}
const icon = 'w-9 h-9 rounded-full border border-slate-600 flex items-center justify-center text-slate-100 hover:border-amber-400 active:scale-95 transition';
const field = 'w-full rounded-lg bg-slate-950/70 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 outline-none resize-none select-text';

export function ThingCard({ thing, focus, onBegin, onField, onAct }: Props) {
  const voiceRef = useRef<HTMLTextAreaElement>(null), tapRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const el = focus === 'voice' ? voiceRef.current : focus === 'tap' ? tapRef.current : null; if (el) { el.focus(); el.select(); } }, [thing.id, focus]);
  const [v, setV] = useState(thing);
  useEffect(() => setV(thing), [thing.id]);   // typing keeps its own copy; a different thing brings a new one
  const bind = (f: 'name' | 'voice' | 'tap' | 'text' | 'fact') => ({
    value: (v[f] as string) || '',
    onFocus: onBegin,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV({ ...v, [f]: e.target.value }); onField(f, e.target.value); },
  });
  const row = (I: React.ComponentType<{ className?: string }>, label: string, el: React.ReactNode) => (
    <label className="flex items-start gap-2" aria-label={label} title={label}>
      <I className="w-4 h-4 mt-2 shrink-0 text-amber-300" />{el}
    </label>
  );
  return (
    <aside className="fixed z-30 top-16 left-3 w-[min(300px,calc(100vw-24px))] max-h-[calc(100vh-250px)] overflow-y-auto rounded-2xl border border-amber-400/50 p-3 flex flex-col gap-2 shadow-2xl" style={{ backgroundColor: 'rgba(13, 19, 31, 0.94)' }} aria-label="手里的东西">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{thing.icon}</span>
        <input className={field + ' font-semibold'} maxLength={30} aria-label="名字" {...bind('name')} />
      </div>
      {v.voice !== null && row(MessageCircle, '观众走近时它说什么',  <textarea ref={voiceRef} rows={2} className={field} maxLength={300} placeholder="走近时，它说…" {...bind('voice')} />)}
      {v.tap !== null && row(Hand, '点它的时候它回答什么', <input ref={tapRef} className={field} maxLength={120} placeholder="点一点它，它回答…" {...bind('tap')} />)}
      {v.text !== null && row(Type, '上面写的字', <textarea rows={2} className={field} maxLength={60} placeholder="上面写的字" {...bind('text')} />)}
      {thing.builtin && (
        <div className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-xs leading-relaxed text-slate-200">
          <div className="text-sky-200 font-semibold mb-0.5">{thing.builtin.where}</div>{thing.builtin.text}
        </div>
      )}
      {row(BookOpen, '你自己写的知识卡', <textarea rows={2} className={field} maxLength={300} placeholder={thing.builtin ? '换成你自己写的知识卡…' : '给它写一张知识卡…'} {...bind('fact')} />)}
      <div className="flex items-center gap-1.5 pt-1">
        <button type="button" className={icon} onClick={() => onAct('left')} aria-label="向左转" title="向左转"><RotateCcw className="w-4 h-4" /></button>
        <button type="button" className={icon} onClick={() => onAct('right')} aria-label="向右转" title="向右转"><RotateCw className="w-4 h-4" /></button>
        <button type="button" className={icon} onClick={() => onAct('bigger')} aria-label="变大" title="变大"><ZoomIn className="w-4 h-4" /></button>
        <button type="button" className={icon} onClick={() => onAct('smaller')} aria-label="变小" title="变小"><ZoomOut className="w-4 h-4" /></button>
        {thing.color && <input type="color" value={v.color || thing.color} onFocus={onBegin} onChange={(e) => { setV({ ...v, color: e.target.value }); onField('color', e.target.value); }} className="w-9 h-9 rounded-full border border-slate-600 bg-transparent p-0.5" aria-label="颜色" title="颜色" />}
        {(v.voice !== null || v.tap !== null) && <button type="button" className={icon} onClick={() => onAct('listen')} aria-label="听一听" title="听一听"><Volume2 className="w-4 h-4" /></button>}
        <span className="flex-1" />
        <button type="button" className={icon + ' !border-rose-400/60 !text-rose-200'} onClick={() => onAct('remove')} aria-label="收起来" title="收起来"><Trash2 className="w-4 h-4" /></button>
      </div>
    </aside>
  );
}
