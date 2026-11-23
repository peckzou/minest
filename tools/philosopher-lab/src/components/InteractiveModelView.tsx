import React, { useEffect, useRef, useState } from 'react';
import { PhilosophyModel, StageConfig } from '../types/philosophy';
import { getModelStageEngine, StageEngine } from '../simulators';
import { CanvasEnv } from '../simulators/canvasHelpers';
import { LegacyModelFrame } from './LegacyModelFrame';

interface InteractiveModelViewProps {
  model: PhilosophyModel;
  onBack: () => void;
  onProgressUpdate?: () => void;
}

export const InteractiveModelView: React.FC<InteractiveModelViewProps> = ({
  model,
  onBack,
  onProgressUpdate
}) => {
  // Models #45 (Kripke) and #46 (Goodman) have the user's exact reference HTML files in /assets/aistudio/
  if ((model.id === 45 || model.id === 46) && model.htmlAssetPath) {
    return (
      <LegacyModelFrame
        model={{
          id: model.id,
          slug: model.slug,
          title: model.title,
          batch: 2,
          tags: model.tags,
          levelsSummary: model.levelsSummary,
          source: model.source,
          quoteCount: model.quoteCount,
          htmlAssetPath: model.htmlAssetPath,
          thumbType: model.thumbType
        }}
        onBack={onBack}
      />
    );
  }

  const storageKey = `minest_philosopher_lab_progress_${model.id}`;
  const [activeStageId, setActiveStageId] = useState<number>(model.stages[0]?.id || 1);
  const [quizOpen, setQuizOpen] = useState<boolean>(false);
  const [quotePanelOpen, setQuotePanelOpen] = useState<boolean>(true);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const [litQuotes, setLitQuotes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed.lit || []);
      }
    } catch {
      // ignore storage errors
    }
    return new Set();
  });

  const stage: StageConfig =
    model.stages.find((s) => s.id === activeStageId) || model.stages[0];

  const totalQuotesCount = model.stages.reduce((acc, s) => acc + s.mappings.length, 0);
  const totalLitCount = model.stages.reduce(
    (acc, s) =>
      acc + s.mappings.filter((_, idx) => litQuotes.has(`${s.id}_${idx}`)).length,
    0
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
    }, 2400);
  };

  const hitQuoteRef = useRef<(stageId: number, quoteIdx: number, customToast?: string) => void>(
    () => {}
  );

  hitQuoteRef.current = (stageId: number, quoteIdx: number, customToast?: string) => {
    const key = `${stageId}_${quoteIdx}`;
    setLitQuotes((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem(storageKey, JSON.stringify({ lit: Array.from(next) }));
      } catch {
        // ignore
      }
      if (onProgressUpdate) onProgressUpdate();
      const targetStage = model.stages.find((s) => s.id === stageId) || stage;
      const q = targetStage.mappings[quoteIdx];
      if (customToast) {
        showToast(customToast);
      } else if (q) {
        showToast(`已点亮原文 #${quoteIdx + 1}：「${q[1].slice(0, 30)}…」`);
      }
      setTimeout(() => {
        const cardEl = document.getElementById(`mr_${stageId}_${quoteIdx}`);
        if (cardEl) {
          cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 40);
      return next;
    });
  };

  const isStageDone = (stg: StageConfig) =>
    stg.mappings.every((_, idx) => litQuotes.has(`${stg.id}_${idx}`));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<StageEngine | null>(null);
  const ptRef = useRef<{
    x: number;
    y: number;
    x0: number;
    y0: number;
    down: boolean;
    holdT: number;
  } | null>(null);
  const sizeRef = useRef<{ W: number; H: number }>({ W: 860, H: 420 });

  // Initialize and run 60fps direct-manipulation canvas engine
  useEffect(() => {
    const engine = getModelStageEngine(model.id, stage.id);
    engine.init();
    engineRef.current = engine;
    ptRef.current = null;

    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const T = (now - startTime) / 1000;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      const W = rect.width || 860;
      const H = rect.height || 420;
      sizeRef.current = { W, H };

      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (ptRef.current && ptRef.current.down) {
        ptRef.current.holdT += dt;
      }

      const env: CanvasEnv = {
        ctx,
        W,
        H,
        T,
        dt,
        L: stage.id,
        PT: ptRef.current,
        hit: (lvl, idx, msg) => hitQuoteRef.current(lvl, idx, msg),
        toast: showToast
      };

      engine.tick(env);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [model.id, stage.id]);

  const makeEnv = (): CanvasEnv | null => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    return {
      ctx,
      W: sizeRef.current.W,
      H: sizeRef.current.H,
      T: performance.now() / 1000,
      dt: 0.016,
      L: stage.id,
      PT: ptRef.current,
      hit: (lvl, idx, msg) => hitQuoteRef.current(lvl, idx, msg),
      toast: showToast
    };
  };

  const handleResetStage = () => {
    if (engineRef.current) {
      engineRef.current.init();
      ptRef.current = null;
      showToast('↺ 已重置本关交互现场');
    }
  };

  // Dynamic Application Practice Quiz generated from model's core question & quotes
  const quizOptions = [
    {
      label: `A. 忽视「${model.concept}」的前提条件，仅凭直觉印象作绝对化判断`,
      correct: false,
      feedback: `再想一想：${model.philosopher}在模型中恰恰批判了这种脱离具体结构或条件的直觉独断。`
    },
    {
      label: `B. 依据${model.philosopher}的「${model.concept}」：${stage.mappings[0]?.[1]?.slice(0, 36) || model.coreQuestion}`,
      correct: true,
      feedback: `✓ 完全正确！这正契合了${model.philosopher}在《${stage.mappings[0]?.[3]?.split(' ')[0] || model.concept}》中的核心洞见，同时也需注意其适用边界：${model.boundaryNote}`
    },
    {
      label: `C. 彻底取消该哲学问题，认为一切概念区分毫无实际意义`,
      correct: false,
      feedback: `不对哦：通过刚才在画布上的亲手实验可以看到，不同操作条件会直接改变哲学状态与论证结果。`
    }
  ];

  return (
    <div className="fixed inset-0 bg-[#1a1a1f] flex flex-col overflow-hidden select-none font-sans">
      {/* Top Bar matching Minest #tabs */}
      <div className="h-[48px] bg-[#1f2b38] flex items-center gap-1.5 px-3 z-20 overflow-x-auto shrink-0">
        <button
          onClick={onBack}
          className="bg-[#33475b] hover:bg-[#415a73] text-[#cfe] rounded-[6px] px-2.5 py-1.5 text-[13px] cursor-pointer whitespace-nowrap"
        >
          ← 总目录
        </button>
        <b className="text-white text-[15px] mx-1.5 whitespace-nowrap">
          #{model.id} {model.title}
        </b>
        {model.stages.map((stg) => {
          const active = !quizOpen && stg.id === stage.id;
          const done = isStageDone(stg);
          return (
            <button
              key={stg.id}
              onClick={() => {
                setQuizOpen(false);
                setActiveStageId(stg.id);
              }}
              className={`rounded-[6px] px-2.5 py-1.5 text-[13px] cursor-pointer whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#f3a52b] text-[#222] font-semibold'
                  : 'bg-[#33475b] text-[#cfe] hover:bg-[#3f5870]'
              }`}
            >
              {stg.tabLabel}
              {done && <span className="text-[#7dffb0] ml-1 font-bold">✓</span>}
            </button>
          );
        })}

        <button
          onClick={() => {
            setQuizChoice(null);
            setQuizOpen((v) => !v);
          }}
          className={`rounded-[6px] px-2.5 py-1.5 text-[13px] cursor-pointer whitespace-nowrap transition-colors ${
            quizOpen
              ? 'bg-[#f3a52b] text-[#222] font-semibold'
              : 'bg-[#2e5d4b] text-[#d9fff0] hover:bg-[#38705a]'
          }`}
        >
          应用练习
        </button>

        <span className="text-[#9bb3c9] text-[12px] whitespace-nowrap ml-1 tabular-nums">
          已点亮 {totalLitCount}/{totalQuotesCount} 条原文
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setQuotePanelOpen((v) => !v)}
            className="bg-[#33475b] hover:bg-[#415a73] text-[#cfe] rounded-[6px] px-2.5 py-1.5 text-[12.5px] cursor-pointer whitespace-nowrap"
          >
            {quotePanelOpen ? '收起原文 (全屏画布)' : '展开原文栏'}
          </button>
          <button
            onClick={handleResetStage}
            className="bg-[#4f6b86] hover:bg-[#5f7f9e] text-white rounded-[6px] px-2.5 py-1.5 text-[13px] cursor-pointer whitespace-nowrap"
          >
            ↺ 重置本关
          </button>
        </div>
      </div>

      {/* Full-Viewport Direct-Manipulation Interactive Stage matching Minest #stage */}
      <div className="relative flex-1 bg-[#f5f2ea] overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            const cv = e.currentTarget;
            cv.setPointerCapture(e.pointerId);
            const r = cv.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            ptRef.current = { x, y, x0: x, y0: y, down: true, holdT: 0 };
            const env = makeEnv();
            if (env && engineRef.current?.down) {
              engineRef.current.down(x, y, env);
            }
          }}
          onPointerMove={(e) => {
            if (!ptRef.current || !ptRef.current.down) return;
            const r = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const dx = x - ptRef.current.x;
            const dy = y - ptRef.current.y;
            ptRef.current.x = x;
            ptRef.current.y = y;
            const env = makeEnv();
            if (env && engineRef.current?.move) {
              engineRef.current.move(x, y, dx, dy, env);
            }
          }}
          onPointerUp={() => {
            const env = makeEnv();
            if (env && engineRef.current?.up) {
              engineRef.current.up(env);
            }
            ptRef.current = null;
          }}
          onPointerCancel={() => {
            ptRef.current = null;
          }}
          className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Toast overlay matching Minest #toast */}
        <div
          className={`fixed left-1/2 top-[60px] -translate-x-1/2 bg-black/80 text-white px-4 py-1.5 rounded-[20px] text-[13.5px] pointer-events-none transition-opacity duration-250 z-30 ${
            toastMsg ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {toastMsg}
        </div>

        {/* Application Practice Modal matching Minest #quiz */}
        {quizOpen && (
          <div className="absolute inset-0 bg-[#141c26]/92 text-[#eee] p-5 overflow-y-auto z-25">
            <div className="max-w-[680px] mx-auto bg-[#1f2b38] rounded-[12px] p-5 border border-[#3a526a]">
              <h3 className="m-0 mb-2 text-[#ffd56b] text-[16px] font-bold">
                应用练习 · {model.title}
              </h3>
              <p className="text-[13.5px] text-[#dbe7f3] mb-3 leading-relaxed">
                情境辨析：{model.coreQuestion} 请结合刚才在画布中的亲手交互体验，判断下列哪一项最符合
                <b>{model.philosopher}</b>的核心论证？
              </p>
              <div className="flex flex-col gap-2">
                {quizOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuizChoice(idx)}
                    className={`block w-full text-left border px-3 py-2.5 rounded-[8px] cursor-pointer text-[13.5px] transition-colors ${
                      quizChoice === idx
                        ? opt.correct
                          ? 'bg-[#1e3d2f] border-[#4cd97b] text-white'
                          : 'bg-[#4a2328] border-[#e66] text-white'
                        : 'bg-[#2a3a4c] hover:bg-[#34495e] text-[#eef] border-[#46607a]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {quizChoice !== null && (
                <div className="mt-3 p-3 rounded-[8px] bg-black/25 text-[13px] leading-relaxed text-[#f8f9fa]">
                  {quizOptions[quizChoice].feedback}
                </div>
              )}
              <div className="mt-3 text-right">
                <button
                  onClick={() => setQuizOpen(false)}
                  className="bg-[#33475b] hover:bg-[#415a73] text-white px-3.5 py-1.5 rounded-[6px] text-[13px] cursor-pointer"
                >
                  返回画布实验
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pedagogical Panel matching Minest #side */}
      {quotePanelOpen && (
      <div className="h-[195px] bg-[#f1f1f2] border-t border-[#444] overflow-y-auto text-[13px] leading-[1.45] shrink-0 text-[#111]">
        <div className="bg-[#3a6f99] text-white px-3 py-1.5 text-[13.5px] font-medium sticky top-0 z-10">
          {stage.instructionTitle}
        </div>

        <div className="px-3 py-1 text-[12.5px] text-[#1f2b38] bg-[#fff7e0] border-b border-[#f0d08a]">
          <b>核心问题：</b>
          {model.coreQuestion}
        </div>

        <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
          {stage.mappings.map((row, idx) => {
            const isLit = litQuotes.has(`${stage.id}_${idx}`);
            return (
              <div
                key={idx}
                id={`mr_${stage.id}_${idx}`}
                className={`grid grid-cols-[34%_66%] border rounded-[6px] transition-all duration-300 ${
                  isLit
                    ? 'opacity-100 border-[#3a6f99] bg-white shadow-[0_0_0_2px_rgba(58,111,153,0.18)]'
                    : 'opacity-45 border-[#d5d8de] bg-[#fafafa]'
                }`}
              >
                <div className="p-2 text-[12px] text-[#2c3e50] border-r border-dashed border-[#ccd] flex gap-1.5 items-start">
                  <span
                    className={`shrink-0 w-[18px] h-[18px] rounded-full text-white text-[11px] text-center leading-[18px] ${
                      isLit ? 'bg-[#3a6f99]' : 'bg-[#99a]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{row[0]}</span>
                </div>
                <div className="p-2 text-[12.5px]">
                  <div className="text-[#111]">「{row[1]}」</div>
                  <div className="italic text-[#667] text-[11px] mt-0.5">{row[2]}</div>
                  <div className="text-[11px] text-[#3a6f99] mt-0.5">——{row[3]}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-3 pb-2.5 text-[11.5px] text-[#667]">
          <b>适用边界：</b>
          {model.boundaryNote}
        </div>
      </div>
      )}
    </div>
  );
};
