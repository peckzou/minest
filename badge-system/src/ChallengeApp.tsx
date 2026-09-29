import React, { useEffect, useMemo, useState } from 'react';
import { APPLE_LEARNING_AWARDS_CATALOG } from './data/prototypes';
import { BadgeModel, getBadgePrototypeId } from './types/badge';
import { BadgeWall } from './components/BadgeWall';
import { BadgeCanvas } from './components/BadgeCanvas';
import { AppleAwardDetailView } from './components/AppleAwardDetailView';
import { triggerHaptic } from './utils/haptics';
import { spatialAudio } from './utils/spatialAudio';

type ChallengeProgress = {
  focusMinutes: number;
  checkCount: number;
  goalPercent: number;
  targetMinutes: number;
  targetChecks: number;
};

type StageGoal = { label: string; current: number; target: number; unit: string };
type SavedChallenge = { unlockedIds: string[]; earnedDates: Record<string, string> };

const STORAGE_KEY = 'minest_challenge_wall_v1';
const CATALOG = APPLE_LEARNING_AWARDS_CATALOG;
const DEFAULT_PROGRESS: ChallengeProgress = {
  focusMinutes: 0, checkCount: 0, goalPercent: 0, targetMinutes: 30, targetChecks: 10,
};

function safeNumber(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : fallback;
}

export function goalForStage(index: number, progress: ChallengeProgress): StageGoal {
  const tier = Math.floor(index / 3);
  if (index % 3 === 0) return {
    label: '今日专注', current: progress.focusMinutes,
    target: Math.min(240, Math.max(5, progress.targetMinutes) + tier * 5), unit: '分钟',
  };
  if (index % 3 === 1) return {
    label: '今日完成', current: progress.checkCount,
    target: Math.min(100, Math.max(1, progress.targetChecks) + tier * 2), unit: '项',
  };
  return { label: '看板目标', current: progress.goalPercent, target: 100, unit: '%' };
}

function loadChallengeState(): SavedChallenge {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const ids = Array.isArray(saved?.unlockedIds) ? saved.unlockedIds : [];
    const valid: string[] = [];
    for (let i = 0; i < Math.min(ids.length, CATALOG.length); i++) {
      if (ids[i] !== CATALOG[i].id) break;
      valid.push(ids[i]);
    }
    const earnedDates = saved?.earnedDates && typeof saved.earnedDates === 'object' ? saved.earnedDates : {};
    return { unlockedIds: valid, earnedDates };
  } catch { return { unlockedIds: [], earnedDates: {} }; }
}

export default function ChallengeApp() {
  const [challengeState, setChallengeState] = useState<SavedChallenge>(loadChallengeState);
  const unlockedIds = challengeState.unlockedIds;
  const [progress, setProgress] = useState<ChallengeProgress>(DEFAULT_PROGRESS);
  const [hasHostProgress, setHasHostProgress] = useState(false);
  const [selectedAward, setSelectedAward] = useState<BadgeModel | null>(null);
  const [recentUnlock, setRecentUnlock] = useState<BadgeModel | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== 'minest:challenge-progress') return;
      const incoming = event.data.progress || {};
      setProgress({
        focusMinutes: safeNumber(incoming.focusMinutes, 0, 1440),
        checkCount: safeNumber(incoming.checkCount, 0, 1000),
        goalPercent: safeNumber(incoming.goalPercent, 0, 200),
        targetMinutes: safeNumber(incoming.targetMinutes, 30, 240),
        targetChecks: safeNumber(incoming.targetChecks, 10, 100),
      });
      setHasHostProgress(true);
    };
    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: 'minest:challenge-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(challengeState)); } catch { /* private mode */ }
  }, [challengeState]);

  const awards = useMemo(() => CATALOG.map((badge, index) => ({
    ...badge,
    state: index < unlockedIds.length ? 'unlocked' as const : 'locked' as const,
    earnedDate: index < unlockedIds.length ? challengeState.earnedDates[badge.id] : undefined,
  })), [challengeState]);
  const stageIndex = unlockedIds.length;
  const nextGoal = stageIndex < CATALOG.length ? goalForStage(stageIndex, progress) : null;
  const canClaim = hasHostProgress && nextGoal !== null && nextGoal.current >= nextGoal.target;
  const progressPercent = nextGoal ? Math.min(100, Math.round(nextGoal.current / nextGoal.target * 100)) : 100;

  const claimNext = () => {
    if (!canClaim || stageIndex >= CATALOG.length) return;
    const badge = { ...awards[stageIndex], state: 'unlocked' as const,
      earnedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() };
    setChallengeState((previous) => ({
      unlockedIds: [...previous.unlockedIds, badge.id],
      earnedDates: { ...previous.earnedDates, [badge.id]: badge.earnedDate || '' },
    }));
    setRecentUnlock(badge);
    setNotice('');
    triggerHaptic('unlock_complete');
    spatialAudio.playChime('celestial');
    window.parent?.postMessage({ type: 'minest:challenge-unlocked', badgeId: badge.id, stage: stageIndex + 1 }, window.location.origin);
  };

  const onLockedSelect = (slotNumber: number) => {
    if (slotNumber > CATALOG.length) setNotice('新勋章即将推出，这些槽位暂不计入通关。');
    else if (slotNumber !== stageIndex + 1) setNotice(`请先完成第 ${String(stageIndex + 1).padStart(3, '0')} 关。`);
    else setNotice('完成上方目标后，即可点亮这枚神秘勋章。');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#07080c] text-white pb-10">
      <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#20242e] via-[#11141c] to-[#090b10] p-5 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#00f0ff]/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8e8e93]">Minest · Challenge</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">勋章通关</h1>
              <p className="mt-1 text-xs text-[#9da1ad]">每次只挑战下一枚；达成真实目标后，由你亲手点亮。目标可在 Summary 中调整。</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
              <p className="text-[10px] text-white/45">已点亮</p>
              <p className="whitespace-nowrap font-mono text-lg font-bold">{stageIndex}<span className="text-sm text-white/35"> / {CATALOG.length}</span></p>
            </div>
          </div>

          {nextGoal ? <div className="relative mt-5 rounded-[22px] border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00d7e8]">第 {String(stageIndex + 1).padStart(3, '0')} 关 · 神秘勋章</p>
                <p className="mt-1 text-base font-semibold">{nextGoal.label}达到 {nextGoal.target}{nextGoal.unit}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-white/65">{Math.round(nextGoal.current)} / {nextGoal.target}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#00a6d6] to-[#9effc6] transition-[width] duration-500" style={{ width: `${progressPercent}%` }} /></div>
            <button type="button" onClick={claimNext} disabled={!canClaim}
              className="mt-4 w-full rounded-2xl bg-white py-3 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 active:scale-[0.99]">
              {canClaim ? '点亮这枚勋章' : hasHostProgress ? `还差 ${Math.max(0, Math.ceil(nextGoal.target - nextGoal.current))}${nextGoal.unit}` : '正在读取 Minest 进度…'}
            </button>
          </div> : <p className="relative mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">当前所有勋章已点亮。新槽位会随徽章库更新开放。</p>}
          {notice && <p role="status" className="relative mt-3 text-xs text-amber-200">{notice}</p>}
        </div>
      </section>

      <BadgeWall awards={awards} challengeMode activeIndex={stageIndex} onSelectAward={setSelectedAward} onLockedSelect={onLockedSelect} />

      {selectedAward && <AppleAwardDetailView badge={selectedAward} onBack={() => setSelectedAward(null)} onTriggerUnlock={() => {}} />}
      {recentUnlock && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-5 backdrop-blur-2xl" role="dialog" aria-label="勋章已点亮">
        <div className="w-full max-w-sm rounded-[30px] border border-white/15 bg-[#16191f] p-5 text-center shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#00e5ff]">Stage Cleared</p>
          <h2 className="mt-2 text-xl font-bold">勋章已点亮</h2>
          <BadgeCanvas prototypeId={getBadgePrototypeId(recentUnlock.badgeStyle)} state="unlocked" badgeTitle={recentUnlock.name} earnedDate={recentUnlock.earnedDate} className="mx-auto mt-4 h-64 w-64" />
          <p className="mt-3 text-sm font-semibold">{recentUnlock.name}</p>
          <p className="mt-1 text-xs text-white/45">{recentUnlock.rarity || 'Common'}</p>
          <button type="button" onClick={() => setRecentUnlock(null)} className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-black">返回勋章墙</button>
        </div>
      </div>}
    </main>
  );
}
