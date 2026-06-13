import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  buildCenterDailyReward,
  centerDailyRewardClaimStateValid,
  centerDailyRewardDayIndexesUnique,
  centerDailyRewardDayStatesConsistent,
  centerDailyRewardDaysCountValid,
  centerDailyRewardNoFakeClaimEnabled,
  centerDailyRewardSingleTodayState,
  centerDailyRewardTextsValid,
} from './utils/centerDailyRewardPresentation';
import {
  CENTER_HEADER_MAX_RESOURCE_CHIPS,
  centerHeaderChipCountWithinLimit,
} from './utils/centerHeaderPresentation';
import {
  CENTER_CITY_SUMMARY_MAX_METRICS,
  centerCitySummaryMetricIdsAreUnique,
} from './utils/centerCitySummaryPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterDailyRewardScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  const day1Reward = buildCenterDailyReward({
    gameState: day1State,
    day: 1,
  });

  assert(checks, Boolean(day1Reward.title.trim()), 'Day 1 reward has title');
  assert(checks, Boolean(day1Reward.today.label.trim()), 'Day 1 reward has today');
  assert(checks, day1Reward.title === 'Günlük Seri', 'Day 1 title is intro copy');
  assert(checks, day1Reward.streakLabel === 'Gün 1', 'Day 1 streak label compact');
  assert(checks, day1Reward.claimState === 'locked', 'Day 1 claim locked teaser');
  assert(checks, centerDailyRewardDaysCountValid(day1Reward), 'Day 1 days count valid');
  assert(checks, centerDailyRewardDayIndexesUnique(day1Reward), 'Day 1 day indexes unique');
  assert(checks, centerDailyRewardSingleTodayState(day1Reward), 'Day 1 single today state');
  assert(checks, centerDailyRewardDayStatesConsistent(day1Reward), 'Day 1 day states consistent');
  assert(checks, centerDailyRewardClaimStateValid(day1Reward), 'Day 1 claim state enum valid');
  assert(checks, centerDailyRewardTextsValid(day1Reward), 'Day 1 reward texts valid');
  assert(checks, centerDailyRewardNoFakeClaimEnabled(day1Reward), 'Day 1 no fake claim');

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };

  const day3Reward = buildCenterDailyReward({
    gameState: day3State,
    day: 3,
  });

  assert(checks, day3Reward.today.state === 'today', 'Day 3 highlights today slot');
  assert(checks, day3Reward.claimState === 'available', 'Day 3 claim available');
  assert(checks, day3Reward.days.some((day) => day.state === 'done'), 'Day 3 has done days');
  assert(checks, centerDailyRewardSingleTodayState(day3Reward), 'Day 3 single today state');
  assert(
    checks,
    !day3Reward.title.toLowerCase().includes('seri 3. gün'),
    'Day 3 avoids header streak duplicate',
  );

  const claimedReward = buildCenterDailyReward({
    gameState: {
      ...day3State,
      player: { ...day3State.player, streakDays: 3 },
    },
    day: 3,
  });

  assert(checks, claimedReward.claimState === 'claimed', 'claimed state when streak caught up');
  assert(checks, !claimedReward.ctaLabel, 'claimed hides CTA');
  assert(
    checks,
    claimedReward.helperText === 'Bugünün ödülü alındı.',
    'claimed helper text',
  );

  const bigReward = claimedReward.nextBigReward;
  assert(checks, Boolean(bigReward?.label.trim()), 'next big reward has label');
  assert(checks, claimedReward.days.some((day) => day.isBigReward), 'route includes big reward day');

  const day1Presentation = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    centerHeaderChipCountWithinLimit(day1Presentation.headerSummary) &&
      day1Presentation.headerSummary.resourceChips.length <= CENTER_HEADER_MAX_RESOURCE_CHIPS,
    'Day 1 header intact',
  );
  assert(
    checks,
    day1Presentation.citySummary.metrics.length === CENTER_CITY_SUMMARY_MAX_METRICS,
    'Day 1 city summary intact',
  );
  assert(
    checks,
    centerCitySummaryMetricIdsAreUnique(day1Presentation.citySummary),
    'Day 1 city summary metrics unique',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
