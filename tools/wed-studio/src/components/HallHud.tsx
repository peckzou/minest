import React, { useState } from 'react';
import { ArrowUpFromLine, GraduationCap, Star, X } from 'lucide-react';
import type { KnowledgeCard } from '../dream/dreamHost';

// The Passport Hall's few controls: the way back to the studio, how full the passport is, and the quiz.
export interface QuizItem { kind: string; icon: string; name: string; ask: string; options: string[]; right: string; text: string }
interface Props {
  found: number; total: number; stars: number;
  message: string | null;
  card: KnowledgeCard | null;
  onCloseCard: () => void;
  onLeave: () => void;
  getQuiz: () => QuizItem[];
  onStars: (n: number) => void;
}
const glass = { backgroundColor: 'rgba(13, 19, 31, 0.86)' };
const round = 'w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center text-slate-100 hover:border-amber-400 active:scale-95 transition';

export function HallHud(p: Props) {
  const [quiz, setQuiz] = useState<{ items: QuizItem[]; i: number; score: number; picked: string | null } | null>(null);
  const q = quiz && quiz.items[quiz.i];
  const next = () => {
    if (!quiz) return;
    if (quiz.i + 1 >= quiz.items.length) { p.onStars(quiz.score); setQuiz({ ...quiz, i: quiz.items.length, picked: null }); }
    else setQuiz({ ...quiz, i: quiz.i + 1, picked: null });
  };
  return (
    <>
      <button type="button" onClick={p.onLeave} className={`fixed z-40 top-3 left-3 ${round}`} style={glass} aria-label="回到工作室" title="回到工作室"><ArrowUpFromLine className="w-5 h-5" /></button>
      <div className="fixed z-40 top-3 right-3 flex items-center gap-2">
        <div className="h-12 px-4 rounded-full border border-amber-400/60 flex items-center gap-3 text-amber-100 font-semibold" style={glass} aria-label={`护照里有 ${p.found} 张知识卡，共 ${p.total} 张；${p.stars} 颗星`}>
          <span>📔 {p.found}/{p.total}</span><span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-300 text-amber-300" />{p.stars}</span>
        </div>
        <button type="button" disabled={p.found < 3} onClick={() => { const items = p.getQuiz(); if (items.length) setQuiz({ items, i: 0, score: 0, picked: null }); }} className={`${round} !border-amber-400 bg-amber-400 !text-slate-950 disabled:opacity-40`} aria-label={p.found < 3 ? '收集 3 张知识卡后可以挑战问答' : '挑战知识问答'} title={p.found < 3 ? '收集 3 张知识卡后可以挑战问答' : '挑战知识问答'}>
          <GraduationCap className="w-6 h-6" />
        </button>
      </div>
      {p.message && !quiz && <div role="status" aria-live="polite" className="fixed z-40 top-20 left-1/2 -translate-x-1/2 max-w-[calc(100vw-40px)] px-4 py-2 rounded-full border border-amber-400/60 text-amber-100 text-sm font-semibold truncate" style={glass}>{p.message}</div>}
      {p.card && !quiz && (
        <div role="status" aria-live="polite" className="fixed z-40 left-1/2 -translate-x-1/2 bottom-8 w-[min(440px,calc(100vw-28px))] rounded-2xl border border-sky-400/70 p-4 text-slate-100 shadow-2xl" style={{ backgroundColor: 'rgba(13, 19, 31, 0.95)' }}>
          <button type="button" onClick={p.onCloseCard} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white" aria-label="关闭"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3 pr-6"><span className="text-3xl">{p.card.icon}</span><div><div className="font-bold text-amber-200">{p.card.title}</div><div className="text-xs text-sky-200">{p.card.where}</div></div></div>
          <p className="mt-2 text-sm leading-relaxed">{p.card.text}</p>
        </div>
      )}
      {quiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(5, 8, 15, 0.6)' }}>
          <div role="dialog" aria-modal="true" aria-label="知识问答" className="w-[min(460px,100%)] rounded-2xl border border-amber-400/60 p-5 text-center text-slate-100" style={{ backgroundColor: 'rgba(13, 19, 31, 0.97)' }}>
            {q ? (
              <>
                <div className="text-xs text-slate-400">{quiz.i + 1} / {quiz.items.length} · {q.icon} {q.name}</div>
                <h3 className="text-lg font-bold my-3 leading-snug">{q.ask}</h3>
                {q.options.map((a) => {
                  const st = quiz.picked == null ? '' : a === q.right ? ' !border-emerald-400 bg-emerald-400/20 text-emerald-100' : a === quiz.picked ? ' !border-rose-400 bg-rose-400/15 text-rose-100' : '';
                  return <button key={a} type="button" disabled={quiz.picked != null} onClick={() => setQuiz({ ...quiz, picked: a, score: quiz.score + (a === q.right ? 1 : 0) })} className={'block w-full my-2 py-3 rounded-xl border border-slate-600 font-bold' + st}>{a}</button>;
                })}
                {quiz.picked != null && (
                  <>
                    <p className="text-left text-sm leading-relaxed rounded-lg border border-amber-400/40 bg-amber-400/10 p-2.5 my-2">{quiz.picked === q.right ? '✅ ' : '💡 '}{q.text}</p>
                    <button type="button" onClick={next} className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">{quiz.i + 1 >= quiz.items.length ? '🏁' : '➜'}</button>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl">{quiz.score === quiz.items.length ? '🏆' : '🌟'}</div>
                <h3 className="text-lg font-bold my-2">{quiz.score} / {quiz.items.length}</h3>
                <p className="flex items-center justify-center gap-1 text-amber-200 mb-3">{Array.from({ length: quiz.score }).map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-300 text-amber-300" />)}</p>
                <button type="button" onClick={() => setQuiz(null)} className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-bold" aria-label="回到护照馆">📔</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
