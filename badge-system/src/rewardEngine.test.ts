import test from 'node:test';
import assert from 'node:assert/strict';
import { collectReward, emptyRewardState, reconcileRewards, RingProgress } from './rewardEngine';

const progress = (date: string, focus = 0, checks = 0, goal = 0, qualifiedDates: string[] = []): RingProgress => ({
  date, focusMinutes: focus, checkCount: checks, goalPercent: goal,
  targetMinutes: 30, targetChecks: 10, qualifiedDates,
});

test('one closed ring counts once per calendar day and never resets', () => {
  const day1 = reconcileRewards(emptyRewardState(), progress('2026-09-28', 30));
  assert.deepEqual(day1.qualifiedDates, ['2026-09-28']);
  const sameDay = reconcileRewards(day1, progress('2026-09-28', 40, 10));
  assert.equal(sameDay.qualifiedDates.length, 1);
  const skippedDay = reconcileRewards(sameDay, progress('2026-09-30', 30));
  assert.equal(skippedDay.qualifiedDates.length, 2);
});

test('three closed rings create exactly one pending random award, not an unlocked badge', () => {
  const first = reconcileRewards(emptyRewardState(), progress('2026-09-28', 30, 10, 100), () => 0);
  assert.equal(first.pending.length, 1);
  assert.equal(first.pending[0].kind, 'rings');
  assert.equal(first.collectedIds.length, 0);
  assert.equal(reconcileRewards(first, progress('2026-09-28', 60, 20, 100)).pending.length, 1);
  const collected = collectReward(first, first.pending[0].id);
  assert.equal(collected.pending.length, 0);
  assert.deepEqual(collected.collectedIds, [first.pending[0].id]);
  assert.equal(reconcileRewards(collected, progress('2026-09-28', 60, 20, 100)).pending.length, 0);
});

test('strike milestones use total unique days and do not repeat', () => {
  const threeDays = ['2026-09-28', '2026-09-29', '2026-09-30'];
  const first = reconcileRewards(emptyRewardState(), progress('2026-09-30', 0, 0, 0, threeDays));
  assert.deepEqual(first.pending.map((reward) => reward.id), ['strike-3-days']);
  const again = reconcileRewards(first, progress('2026-09-30', 0, 0, 0, threeDays));
  assert.equal(again.pending.length, 1);
  const sevenDays = Array.from({ length: 7 }, (_, index) => '2026-10-' + String(index + 1).padStart(2, '0'));
  const seven = reconcileRewards(again, progress('2026-10-07', 0, 0, 0, [...threeDays, ...sevenDays]));
  assert.deepEqual(seven.pending.map((reward) => reward.id), ['strike-3-days', 'strike-7-days']);
});
