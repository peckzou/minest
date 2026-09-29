import React, { useEffect, useMemo, useRef, useState } from 'react';
import { APPLE_LEARNING_AWARDS_CATALOG } from './data/prototypes';
import { BadgeModel, getBadgePrototypeId } from './types/badge';
import { BadgeWall } from './components/BadgeWall';
import { BadgeCanvas } from './components/BadgeCanvas';
import { AppleAwardDetailView } from './components/AppleAwardDetailView';
import { triggerHaptic } from './utils/haptics';
import { spatialAudio } from './utils/spatialAudio';
import { collectReward, loadRewardState, reconcileRewards, REWARD_STORAGE_KEY, RingProgress, STRIKE_MILESTONES } from './rewardEngine';

const CATALOG = APPLE_LEARNING_AWARDS_CATALOG;
const collectionOnly = new URLSearchParams(window.location.search).get('collection') === '1';
const DEFAULT_PROGRESS: RingProgress = {
  date: '', focusMinutes: 0, checkCount: 0, goalPercent: 0,
  targetMinutes: 30, targetChecks: 10, qualifiedDates: [],
};
const safeNumber = (value: unknown, fallback: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;
};
type CeremonyStage = 'pending' | 'assembling' | 'revealed' | 'returning';

export default function ChallengeApp() {
  const [rewards, setRewards] = useState(loadRewardState);
  const [progress, setProgress] = useState<RingProgress>(DEFAULT_PROGRESS);
  const [hasHostProgress, setHasHostProgress] = useState(false);
  const [selectedAward, setSelectedAward] = useState<BadgeModel | null>(null);
  const [ceremonyStage, setCeremonyStage] = useState<CeremonyStage | null>(null);
  const [notice, setNotice] = useState('');
  const [flight, setFlight] = useState<{ from: DOMRect; to: DOMRect; moving: boolean } | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const claimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== 'minest:challenge-progress') return;
      const incoming = event.data.progress || {};
      const next: RingProgress = {
        date: typeof incoming.date === 'string' ? incoming.date : '',
        focusMinutes: safeNumber(incoming.focusMinutes, 0, 1440),
        checkCount: safeNumber(incoming.checkCount, 0, 1000),
        goalPercent: safeNumber(incoming.goalPercent, 0, 200),
        targetMinutes: safeNumber(incoming.targetMinutes, 30, 240),
        targetChecks: safeNumber(incoming.targetChecks, 10, 100),
        qualifiedDates: Array.isArray(incoming.qualifiedDates) ? incoming.qualifiedDates : [],
      };
      setProgress(next);
      setRewards((previous) => reconcileRewards(previous, next));
      setHasHostProgress(true);
    };
    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: 'minest:challenge-ready', collectedCount: rewards.collectedIds.length }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(REWARD_STORAGE_KEY, JSON.stringify(rewards)); } catch { /* private mode */ }
  }, [rewards]);
  useEffect(() => () => { if (claimTimer.current) clearTimeout(claimTimer.current); }, []);

  const collected = useMemo(() => new Set(rewards.collectedIds), [rewards.collectedIds]);
  const awards = useMemo(() => CATALOG.map((badge) => ({
    ...badge,
    state: collected.has(badge.id) ? 'unlocked' as const : 'locked' as const,
    earnedDate: collected.has(badge.id) ? rewards.earnedDates[badge.id] : undefined,
  })), [collected, rewards.earnedDates]);
  const pending = rewards.pending[0];
  const pendingBadge = pending ? CATALOG.find((badge) => badge.id === pending.id) : null;
  const closed = [
    progress.targetMinutes > 0 && progress.focusMinutes >= progress.targetMinutes,
    progress.targetChecks > 0 && progress.checkCount >= progress.targetChecks,
    progress.goalPercent >= 100,
  ];
  const fullClose = closed.every(Boolean);
  const strikeDays = rewards.qualifiedDates.length;
  const nextMilestone = STRIKE_MILESTONES.find((day) => day > strikeDays);

  const beginAssembly = () => {
    if (ceremonyStage !== 'pending') return;
    setCeremonyStage('assembling');
    triggerHaptic('unlock_step');
    claimTimer.current = setTimeout(() => {
      setCeremonyStage('revealed');
      triggerHaptic('unlock_complete');
      spatialAudio.playChime('celestial');
    }, 2450);
  };
  const returnToWall = () => {
    if (!pending || !pendingBadge || ceremonyStage !== 'revealed') return;
    const targetElement = document.querySelector('[data-badge-id="' + pending.id + '"]');
    targetElement?.scrollIntoView({ behavior: 'auto', block: 'center' });
    const source = revealRef.current?.getBoundingClientRect();
    const target = targetElement?.getBoundingClientRect();
    if (source && target) {
      setFlight({ from: source, to: target, moving: false });
      requestAnimationFrame(() => requestAnimationFrame(() => setFlight({ from: source, to: target, moving: true })));
    }
    setCeremonyStage('returning');
    claimTimer.current = setTimeout(() => {
      setRewards((previous) => collectReward(previous, pending.id));
      window.parent?.postMessage({ type: 'minest:challenge-unlocked', badgeId: pending.id }, window.location.origin);
      setFlight(null);
      setCeremonyStage(null);
      triggerHaptic('unlock_complete');
    }, source && target ? 860 : 400);
  };

  return <main className="min-h-screen bg-[#07080c] pb-10 text-white">
    <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-6">
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#20242e] via-[#11141c] to-[#090b10] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8e8e93]">Minest · Awards</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{collectionOnly ? '我的收藏' : '勋章墙'}</h1>
            <p className="mt-1 text-xs text-[#9da1ad]">{collectionOnly ? '仅展示已完成领取仪式的真实勋章。' : '三环全闭合，随机生成一枚待领取勋章。领取后才会点亮对应槽位。'}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[10px] text-white/45">已收藏</p>
            <p className="whitespace-nowrap font-mono text-lg font-bold">{collected.size}<span className="text-sm text-white/35"> / {CATALOG.length}</span></p>
          </div>
        </div>
        {!collectionOnly && <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ['专注', progress.focusMinutes, progress.targetMinutes, closed[0], '#ff375f'],
            ['完成', progress.checkCount, progress.targetChecks, closed[1], '#b0f85a'],
            ['目标', progress.goalPercent, 100, closed[2], '#00dce9'],
          ].map(([label, value, target, done, color]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <span className="text-[10px] text-white/55">{label}</span>
            <p className="mt-1 text-sm font-semibold" style={{ color: String(color) }}>{Math.round(Number(value))} / {target}</p>
            <p className="mt-1 text-[10px] text-white/40">{done ? '闭合 ✓' : '进行中'}</p>
          </div>)}
        </div>}
        {!collectionOnly && <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div><p className="text-[10px] uppercase tracking-widest text-white/40">Strike · 累计达标</p><p className="mt-1 text-sm font-semibold">{strikeDays} 天 <span className="font-normal text-white/40">· 每天任意一环闭合记 1 天，永不归零</span></p></div>
          <span className="text-xs text-[#00dce9]">{nextMilestone ? '下枚 ' + nextMilestone + ' 天' : '十枚已达成'}</span>
        </div>}
        {!collectionOnly && (pending ? <button type="button" onClick={() => { setCeremonyStage('pending'); setNotice(''); triggerHaptic('selection'); }} className="group mt-5 flex w-full items-center gap-4 rounded-[24px] border border-amber-300/40 bg-gradient-to-r from-amber-500/20 via-amber-300/10 to-transparent p-4 text-left shadow-[0_0_35px_rgba(245,158,11,.15)]">
          <span className="reward-pending-hex flex h-16 w-16 shrink-0 items-center justify-center text-2xl text-amber-200">?</span>
          <span className="flex-1"><strong className="block text-sm">待领取神秘勋章</strong><span className="mt-1 block text-xs text-amber-100/55">{pending.kind === 'rings' ? '三环圆满奖励' : 'Strike 里程碑奖励'} · 点击开启解锁仪式</span><span className="mt-1 block text-[10px] text-white/35">还有 {rewards.pending.length} 枚待领取</span></span>
          <span className="text-xl text-amber-200">›</span>
        </button> : <p className="mt-4 text-center text-xs text-white/40">{!hasHostProgress ? '正在读取 Minest 进度…' : fullClose ? '今日三环奖励已生成或领取，明天继续。' : '继续完成今日三环，点亮新的神秘勋章。'}</p>)}
        {notice && <p role="status" className="mt-3 text-xs text-amber-200">{notice}</p>}
      </div>
    </section>
    <BadgeWall awards={awards} challengeMode activeIndex={-1} initialFilter={collectionOnly ? 'unlocked' : 'all'} onSelectAward={setSelectedAward}
      onLockedSelect={() => setNotice(pending ? '先点击上方悬浮的神秘勋章，完成领取仪式。' : '三环全闭合后，这里会随机生成一枚待领取勋章。')} />
    {selectedAward && <AppleAwardDetailView badge={selectedAward} onBack={() => setSelectedAward(null)} onTriggerUnlock={() => {}} />}
    {ceremonyStage && pendingBadge && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl" role="dialog" aria-label="勋章解锁仪式">
      <div className="w-full max-w-sm rounded-[30px] border border-white/15 bg-[#11151d] p-5 text-center shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[.25em] text-amber-300">{ceremonyStage === 'revealed' || ceremonyStage === 'returning' ? 'Award Revealed' : 'Mystery Award'}</p>
        <h2 className="mt-2 text-xl font-bold">{ceremonyStage === 'revealed' || ceremonyStage === 'returning' ? pendingBadge.name : '一枚未知勋章'}</h2>
        {ceremonyStage === 'revealed' || ceremonyStage === 'returning'
          ? <div ref={revealRef} className={ceremonyStage === 'returning' ? 'opacity-0' : ''}><BadgeCanvas prototypeId={getBadgePrototypeId(pendingBadge.badgeStyle)} state="unlocked" badgeTitle={pendingBadge.name} className="mx-auto mt-4 h-64 w-64" /></div>
          : <button type="button" onClick={beginAssembly} disabled={ceremonyStage !== 'pending'} className="relative mx-auto mt-5 flex h-64 w-64 items-center justify-center disabled:cursor-default" aria-label="点击神秘勋章开始装配">
            <span className="reward-ceremony-hex flex h-40 w-40 items-center justify-center text-4xl text-amber-100/65">?</span>
            {ceremonyStage === 'assembling' && Array.from({ length: 6 }, (_, index) => <span key={index} className="reward-assembly-piece" style={{ '--piece-index': index } as React.CSSProperties} />)}
          </button>}
        <p className="mt-3 text-xs text-white/45">{ceremonyStage === 'pending' ? '点击金色六边形开始' : ceremonyStage === 'assembling' ? '六个机械部件依次锁定 · 身份仍保密' : ceremonyStage === 'revealed' ? pendingBadge.rarity : '磁吸归位中…'}</p>
        {ceremonyStage === 'revealed' && <button type="button" onClick={returnToWall} className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-black">磁吸归位 · 点亮勋章墙</button>}
        {ceremonyStage === 'pending' && <button type="button" onClick={() => setCeremonyStage(null)} className="mt-5 text-xs text-white/45">稍后领取</button>}
      </div>
    </div>}
    {flight && pendingBadge && <div className="pointer-events-none fixed z-[90]" style={{
      left: flight.from.left, top: flight.from.top, width: flight.from.width, height: flight.from.height,
      transform: flight.moving ? 'translate(' + (flight.to.left + flight.to.width / 2 - flight.from.left - flight.from.width / 2) + 'px,' + (flight.to.top + flight.to.height / 2 - flight.from.top - flight.from.height / 2) + 'px) scale(' + Math.max(.15, flight.to.width / flight.from.width) + ') rotate(720deg)' : 'none',
      transition: flight.moving ? 'transform 780ms cubic-bezier(.18,.9,.23,1.15)' : 'none',
    }}><BadgeCanvas prototypeId={getBadgePrototypeId(pendingBadge.badgeStyle)} state="unlocked" badgeTitle={pendingBadge.name} className="h-full w-full" /></div>}
  </main>;
}
