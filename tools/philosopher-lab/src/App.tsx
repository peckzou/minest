import React, { useMemo, useState } from 'react';
import { CATEGORY_GROUPS, LEGACY_MODELS, NEW_PHILOSOPHY_MODELS } from './data';
import { LegacyModel, PhilosophyModel } from './types/philosophy';
import { ThumbCanvas } from './components/ThumbCanvas';
import { InteractiveModelView } from './components/InteractiveModelView';
import { LegacyModelFrame } from './components/LegacyModelFrame';

export default function App() {
  const [selectedFilter, setSelectedFilter] = useState<string>(() => document.getElementById('root')?.dataset.filter || 'new_87_136');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNewModel, setActiveNewModel] = useState<PhilosophyModel | null>(() => { const id = Number(document.getElementById('root')?.dataset.model || new URLSearchParams(location.search).get('model')); return NEW_PHILOSOPHY_MODELS.find((m) => m.id === id) || null; });
  const [activeLegacyModel, setActiveLegacyModel] = useState<LegacyModel | null>(null);
  const [progressTick, setProgressTick] = useState<number>(0);

  const litCountsByModel = useMemo(() => {
    const map: Record<number, number> = {};
    NEW_PHILOSOPHY_MODELS.forEach((m) => {
      try {
        const raw = localStorage.getItem(`minest_philosopher_lab_progress_${m.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          map[m.id] = Array.isArray(parsed.lit) ? parsed.lit.length : 0;
        }
      } catch {
        // ignore
      }
    });
    return map;
  }, [progressTick, activeNewModel]);

  const filteredNewModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = NEW_PHILOSOPHY_MODELS.filter((m) => {
      if (selectedFilter === '前序模型（1–44）') return false;
      if (selectedFilter === 'new_87_136') {
        if (m.id < 87 || m.id > 136) return false;
      } else if (selectedFilter === 'new_45_86') {
        if (m.id < 45 || m.id > 86) return false;
      } else if (selectedFilter === 'top10_priority') {
        if (!m.priorityRank) return false;
      } else if (selectedFilter !== 'all_136' && m.categoryGroup !== selectedFilter) {
        return false;
      }
      if (!q) return true;
      return (
        String(m.id).includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.philosopher.toLowerCase().includes(q) ||
        m.concept.toLowerCase().includes(q) ||
        m.playSummary.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    if (selectedFilter === 'top10_priority') {
      return [...list].sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99));
    }
    return list;
  }, [selectedFilter, searchQuery]);

  const filteredLegacyModels = useMemo(() => {
    if (selectedFilter !== 'all_136' && selectedFilter !== '前序模型（1–44）') {
      return [];
    }
    const q = searchQuery.trim().toLowerCase();
    return LEGACY_MODELS.filter((m) => {
      if (!q) return true;
      return (
        String(m.id).includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.levelsSummary.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [selectedFilter, searchQuery]);

  if (activeNewModel) {
    return (
      <InteractiveModelView
        model={activeNewModel}
        onBack={() => setActiveNewModel(null)}
        onProgressUpdate={() => setProgressTick((n) => n + 1)}
      />
    );
  }

  if (activeLegacyModel) {
    return (
      <LegacyModelFrame
        model={activeLegacyModel}
        onBack={() => setActiveLegacyModel(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141a22] text-[#e8edf3] flex flex-col">
      {/* Header matching Minest index.html */}
      <header className="px-6 md:px-8 pt-7 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[26px] font-bold tracking-[2px] text-white">
            Minest · 思想家与哲学交互模型库（1–136）
          </h1>
          <p className="mt-1.5 text-[#9fb0c3] text-[14px]">
            共 136 个实时交互模型 · 新增 87–136 思想家交互模型库 Top 50（经济学、社会学、心理学、政治传播与复杂系统） · 全画布直接操作与原文验证
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索编号(1-136)、思想家或模型…"
            className="bg-[#1d2733] text-[#e8edf3] placeholder-[#7f93a8] border border-[#33475b] focus:border-[#f3a52b] focus:outline-none rounded-[8px] px-3.5 py-1.5 text-[13px] w-full md:w-[270px]"
          />
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap px-6 md:px-8 py-3">
        {CATEGORY_GROUPS.map((grp) => {
          const active = selectedFilter === grp.key;
          return (
            <button
              key={grp.key}
              onClick={() => setSelectedFilter(grp.key)}
              className={`rounded-[16px] px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${
                active
                  ? 'bg-[#f3a52b] text-[#222] border-[#f3a52b] font-semibold'
                  : 'bg-[#22303f] text-[#cfe] border-[#33475b] hover:border-[#f3a52b]/60'
              }`}
            >
              {grp.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 md:px-8 pt-2 pb-10 flex-1">
        {filteredNewModels.map((m) => {
          const totalQuotes = m.stages.reduce((acc, s) => acc + s.mappings.length, 0);
          const litCount = litCountsByModel[m.id] || 0;
          return (
            <div
              key={m.id}
              onClick={() => setActiveNewModel(m)}
              className="group flex flex-col bg-[#1b2430] border border-[#2a3848] hover:border-[#f3a52b] rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
            >
              <ThumbCanvas thumbType={m.thumbType} modelId={m.id} />
              <div className="p-3.5 flex-1 flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline gap-2">
                  <b className="text-[15.5px] font-semibold text-white group-hover:text-[#f3a52b] transition-colors">
                    <span className="font-mono text-[#7f93a8] mr-1 tabular-nums">#{m.id}</span>
                    {m.title}
                  </b>
                  {m.priorityRank && (
                    <span className="text-[11px] font-semibold text-[#f3a52b] whitespace-nowrap tabular-nums">
                      ★ Top {m.priorityRank}
                    </span>
                  )}
                </div>

                <div className="text-[12.5px] text-[#b9c8d8] leading-[1.45] line-clamp-2">
                  {m.playSummary}
                </div>

                <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#8da2b8] mt-auto pt-2 border-t border-[#263445] tabular-nums">
                  <span>
                    原文 <b className="text-[#7dffb0] font-semibold">{totalQuotes}</b>
                    {litCount > 0 && (
                      <span className="ml-1 text-[#f3a52b]">
                        · 已亮 {litCount}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{m.tags.slice(0, 3).join(' · ')}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLegacyModels.map((m) => (
          <div
            key={`legacy_${m.id}`}
            onClick={() => setActiveLegacyModel(m)}
            className="group flex flex-col bg-[#1d2733] border border-[#2c3b4c] hover:border-[#f3a52b] rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <ThumbCanvas thumbType={m.thumbType} modelId={m.id} />
            <div className="p-3.5 flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <b className="text-[16.5px] text-white group-hover:text-[#f3a52b] transition-colors">
                  #{m.id} {m.title}
                </b>
                <span className="text-[11px] text-[#9fb0c3] border border-[#33475b] rounded-[8px] px-2 py-0.5 whitespace-nowrap">
                  第 {m.batch} 批
                </span>
              </div>
              <div className="text-[12.5px] text-[#c6d2df] leading-[1.6]">
                {m.levelsSummary}
              </div>
              <div className="flex gap-2.5 text-[11.5px] text-[#9fb0c3]">
                {m.quoteCount > 0 && (
                  <span>
                    原文 <b className="text-[#7dffb0] font-semibold">{m.quoteCount}</b> 条
                  </span>
                )}
                <span>{m.tags.join(' · ')}</span>
              </div>
              <div className="text-[11.5px] text-[#7f93a8] mt-auto pt-1">
                {m.source}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="px-6 md:px-8 pb-8 text-[#6f8297] text-[12px] leading-[1.7]">
        Boost 统一开发标准：实际可操作 · 理论准确（含核心问题、中英权威引文与适用边界） · 实时反馈 · 教学闭环 · 保留稳定编号 model_id（1–136）。<br />
        声明：心理学发展与依恋等模型仅用于理论教学，不用于对真实个人作心理诊断；具体模拟结果依赖各理论的假设条件。
      </footer>
    </div>
  );
}
