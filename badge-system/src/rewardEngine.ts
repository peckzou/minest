import { APPLE_LEARNING_AWARDS_CATALOG } from './data/prototypes';

export const REWARD_STORAGE_KEY = 'minest_reward_system_v2';
export const QUALIFIED_DAYS_KEY = 'minest_qualified_ring_days_v1';
export const STRIKE_MILESTONES = [3, 7, 14, 30, 40, 50, 60, 80, 90, 100] as const;

export type RingProgress = {
  date: string;
  focusMinutes: number;
  checkCount: number;
  goalPercent: number;
  targetMinutes: number;
  targetChecks: number;
  qualifiedDates: string[];
};
export type PendingReward = { id: string; kind: 'rings' | 'strike'; date: string };
export type RewardState = {
  qualifiedDates: string[];
  rewardedThreeRingDates: string[];
  pending: PendingReward[];
  collectedIds: string[];
  earnedDates: Record<string, string>;
};

const catalogIds = new Set(APPLE_LEARNING_AWARDS_CATALOG.map((badge) => badge.id));
const randomPool = APPLE_LEARNING_AWARDS_CATALOG.filter((badge) => !badge.id.startsWith('strike-'));
const validDate = (date: unknown): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
const dates = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter(validDate))].sort() : [];

export function emptyRewardState(): RewardState {
  return { qualifiedDates: [], rewardedThreeRingDates: [], pending: [], collectedIds: [], earnedDates: {} };
}

export function loadRewardState(): RewardState {
  try {
    const raw = JSON.parse(localStorage.getItem(REWARD_STORAGE_KEY) || 'null');
    let storedQualifiedDates: string[] = [];
    try { storedQualifiedDates = dates(JSON.parse(localStorage.getItem(QUALIFIED_DAYS_KEY) || '[]')); } catch { /* keep reward ledger */ }
    const validCollected = (ids: unknown, qualifiedCount: number) => Array.isArray(ids)
      ? [...new Set<string>(ids.filter((id: string) => {
        if (!catalogIds.has(id)) return false;
        const strike = /^strike-(\d+)-days$/.exec(id);
        return !strike || qualifiedCount >= Number(strike[1]);
      }))] : [];
    if (raw) {
      const qualifiedDates = dates([...dates(raw.qualifiedDates), ...storedQualifiedDates]);
      return {
        qualifiedDates,
        rewardedThreeRingDates: dates(raw.rewardedThreeRingDates),
        pending: Array.isArray(raw.pending) ? raw.pending.filter((item: PendingReward) =>
          item && catalogIds.has(item.id) && (item.kind === 'rings' || item.kind === 'strike') && validDate(item.date)) : [],
        collectedIds: validCollected(raw.collectedIds, qualifiedDates.length),
        earnedDates: raw.earnedDates && typeof raw.earnedDates === 'object' ? raw.earnedDates : {},
      };
    }
    // Preserve rewards earned in the first Badge Wall implementation.
    const previous = JSON.parse(localStorage.getItem('minest_challenge_wall_v1') || 'null');
    if (Array.isArray(previous?.unlockedIds)) return {
      ...emptyRewardState(),
      qualifiedDates: storedQualifiedDates,
      collectedIds: validCollected(previous.unlockedIds, storedQualifiedDates.length),
      earnedDates: previous.earnedDates || {},
    };
  } catch { /* malformed or unavailable storage */ }
  return emptyRewardState();
}

export function reconcileRewards(previous: RewardState, progress: RingProgress, random = Math.random): RewardState {
  if (!validDate(progress.date)) return previous;
  const focusClosed = progress.targetMinutes > 0 && progress.focusMinutes >= progress.targetMinutes;
  const checksClosed = progress.targetChecks > 0 && progress.checkCount >= progress.targetChecks;
  const goalClosed = progress.goalPercent >= 100;
  const qualifiedDates = dates([...previous.qualifiedDates, ...progress.qualifiedDates,
    ...(focusClosed || checksClosed || goalClosed ? [progress.date] : [])]);
  const pending = [...previous.pending];
  const rewardedThreeRingDates = [...previous.rewardedThreeRingDates];
  const reserved = new Set([...previous.collectedIds, ...pending.map((item) => item.id)]);

  if (focusClosed && checksClosed && goalClosed && !rewardedThreeRingDates.includes(progress.date)) {
    const available = randomPool.filter((badge) => !reserved.has(badge.id));
    if (available.length) {
      const choice = available[Math.min(available.length - 1, Math.max(0, Math.floor(random() * available.length)))];
      pending.push({ id: choice.id, kind: 'rings', date: progress.date });
      reserved.add(choice.id);
    }
    // A full close grants at most one random reward per local calendar day.
    rewardedThreeRingDates.push(progress.date);
  }

  for (const milestone of STRIKE_MILESTONES) {
    const id = `strike-${milestone}-days`;
    if (qualifiedDates.length >= milestone && catalogIds.has(id) && !reserved.has(id)) {
      pending.push({ id, kind: 'strike', date: progress.date });
      reserved.add(id);
    }
  }
  if (qualifiedDates.length === previous.qualifiedDates.length &&
    rewardedThreeRingDates.length === previous.rewardedThreeRingDates.length &&
    pending.length === previous.pending.length) return previous;
  return { ...previous, qualifiedDates, rewardedThreeRingDates, pending };
}

export function collectReward(previous: RewardState, id: string): RewardState {
  const reward = previous.pending.find((item) => item.id === id);
  if (!reward || previous.collectedIds.includes(id)) return previous;
  return {
    ...previous,
    pending: previous.pending.filter((item) => item.id !== id),
    collectedIds: [...previous.collectedIds, id],
    earnedDates: { ...previous.earnedDates, [id]: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() },
  };
}
