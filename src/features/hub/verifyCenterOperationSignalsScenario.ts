import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from './utils/centerAdvisorPresentation';
import { buildCenterCitySummary } from './utils/centerCitySummaryPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHeaderSummary } from './utils/centerHeaderPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import {
  buildCenterOperationSignals,
  centerOperationSignalsCoreFieldsValid,
  centerOperationSignalsDay1Safe,
  centerOperationSignalsEmptySafe,
  centerOperationSignalsLinkedTarget,
  centerOperationSignalsMaxItems,
  centerOperationSignalsNotDuplicateAdvisor,
  centerOperationSignalsNotDuplicateFocus,
  centerOperationSignalsNotDuplicateTitle,
  centerOperationSignalsUniqueSourceIds,
} from './utils/centerOperationSignalsPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterOperationSignalsScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;
  const day1Reward = buildCenterDailyReward({ gameState: day1State, day: 1 });
  const day1Target = buildCenterActiveTarget({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
    dailyRewardHelperText: day1Reward.helperText,
  });
  const day1Header = buildCenterHeaderSummary({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
  });
  const day1Summary = buildCenterCitySummary({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
    activeTargetTitle: day1Target.title,
  });
  const day1Advisor = buildCenterAdvisorSuggestion({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    dailyReward: day1Reward,
    citySummary: day1Summary,
    operationSignals: createInitialOperationSignalsState(1),
  });

  const day1Signals = buildCenterOperationSignals({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    advisorSuggestion: day1Advisor,
    citySummary: day1Summary,
    dailyReward: day1Reward,
    headerSummary: day1Header,
    operationSignals: createInitialOperationSignalsState(1),
  });

  assert(checks, centerOperationSignalsCoreFieldsValid(day1Signals), 'Day 1 core fields valid');
  assert(checks, centerOperationSignalsDay1Safe(day1Signals), 'Day 1 safe teaser');
  assert(checks, centerOperationSignalsMaxItems(day1Signals), 'Day 1 max items');

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3SignalsState = createInitialOperationSignalsState(3);
  const day3Reward = buildCenterDailyReward({ gameState: day3State, day: 3 });
  const day3Target = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: day3SignalsState,
    dailyRewardHelperText: day3Reward.helperText,
  });
  const day3Header = buildCenterHeaderSummary({
    gameState: day3State,
    day: 3,
    operationSignals: day3SignalsState,
  });
  const day3Summary = buildCenterCitySummary({
    gameState: day3State,
    day: 3,
    operationSignals: day3SignalsState,
    activeTargetTitle: day3Target.title,
  });
  const day3Advisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    dailyReward: day3Reward,
    citySummary: day3Summary,
    operationSignals: day3SignalsState,
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
  });

  const day3Signals = buildCenterOperationSignals({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    citySummary: day3Summary,
    dailyReward: day3Reward,
    headerSummary: day3Header,
    operationSignals: day3SignalsState,
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'generic_city_preparation',
      title: 'Yükselen Talep',
      mainLine: 'Mahallede hizmet talebi artıyor.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
  });

  assert(checks, centerOperationSignalsCoreFieldsValid(day3Signals), 'Day 3 core fields valid');
  assert(checks, centerOperationSignalsMaxItems(day3Signals), 'Day 3 max items');
  assert(checks, centerOperationSignalsUniqueSourceIds(day3Signals), 'Day 3 unique source ids');
  assert(
    checks,
    centerOperationSignalsNotDuplicateTitle(day3Signals, day3Target.title),
    'Day 3 not duplicate active target title',
  );
  assert(
    checks,
    centerOperationSignalsNotDuplicateFocus(day3Signals),
    'Day 3 not duplicate focus domain title',
  );
  assert(
    checks,
    centerOperationSignalsNotDuplicateAdvisor(day3Signals, day3Advisor.recommendation),
    'Day 3 not duplicate Ece recommendation',
  );
  assert(
    checks,
    centerOperationSignalsLinkedTarget(day3Signals, day3Target.domain),
    'Day 3 active target link safe',
  );

  const day3Presentation = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: day3SignalsState,
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'generic_city_preparation',
      title: 'Yükselen Talep',
      mainLine: 'Mahallede hizmet talebi artıyor.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
  });

  assert(
    checks,
    day3Presentation.operationSignals.signals.length <= 3,
    'presentation max 3 signals',
    `count=${day3Presentation.operationSignals.signals.length}`,
  );

  const emptySignals = buildCenterOperationSignals({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    citySummary: day3Summary,
    dailyReward: day3Reward,
    headerSummary: day3Header,
    operationSignals: null,
  });

  assert(checks, centerOperationSignalsEmptySafe(emptySignals), 'empty state safe');
  assert(checks, centerOperationSignalsMaxItems(emptySignals), 'empty max items');

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
