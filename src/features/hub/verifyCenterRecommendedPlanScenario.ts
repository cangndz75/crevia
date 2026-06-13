import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterAdvisorSuggestion } from './utils/centerAdvisorPresentation';
import { buildCenterCitySummary } from './utils/centerCitySummaryPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHeaderSummary } from './utils/centerHeaderPresentation';
import {
  buildCenterHomePresentation,
  centerHomeAdvisorAndPlanShareText,
} from './utils/centerHomePresentation';
import {
  buildCenterRecommendedPlan,
  centerRecommendedPlanCoreFieldsValid,
  centerRecommendedPlanCtaSafe,
  centerRecommendedPlanDay1Teaching,
  centerRecommendedPlanEmptySafe,
  centerRecommendedPlanEnumsValid,
  centerRecommendedPlanLockedSafe,
  centerRecommendedPlanNotDuplicateActiveTarget,
  centerRecommendedPlanNotDuplicateAdvisor,
  centerRecommendedPlanNotDuplicateDailyReward,
  centerRecommendedPlanNotDuplicateSignals,
  centerRecommendedPlanSourceIdsUnique,
  centerRecommendedPlanStepsValid,
} from './utils/centerRecommendedPlanPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterRecommendedPlanScenario(): {
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

  const day1Plan = buildCenterRecommendedPlan({
    gameState: day1State,
    day: 1,
    activeTarget: day1Target,
    advisorSuggestion: day1Advisor,
    dailyReward: day1Reward,
    headerSummary: day1Header,
    citySummary: day1Summary,
  });

  assert(checks, centerRecommendedPlanCoreFieldsValid(day1Plan), 'Day 1 core fields valid');
  assert(checks, centerRecommendedPlanEnumsValid(day1Plan), 'Day 1 enums valid');
  assert(checks, centerRecommendedPlanStepsValid(day1Plan), 'Day 1 steps valid');
  assert(checks, centerRecommendedPlanCtaSafe(day1Plan), 'Day 1 CTA safe');
  assert(checks, centerRecommendedPlanDay1Teaching(day1Plan), 'Day 1 teaching fallback');
  assert(checks, centerRecommendedPlanSourceIdsUnique(day1Plan), 'Day 1 unique source ids');
  assert(
    checks,
    centerRecommendedPlanNotDuplicateActiveTarget(day1Plan, day1Target),
    'Day 1 not duplicate active target',
  );
  assert(
    checks,
    centerRecommendedPlanNotDuplicateAdvisor(day1Plan, day1Advisor.recommendation),
    'Day 1 not duplicate advisor',
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };
  const day3Target = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: createInitialOperationSignalsState(3),
  });
  const day3Advisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    operationSignals: createInitialOperationSignalsState(3),
  });

  const journalPlan = buildCenterRecommendedPlan({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    advisorSuggestion: day3Advisor,
    hubCityJournal: {
      title: 'Şehir Günlüğü',
      primaryLine: 'Merkezdeki kararların sosyal nabız üzerindeki etkisi izleniyor.',
      secondaryLine: null,
      visible: true,
    },
  });

  assert(checks, journalPlan.planType === 'city_journal', 'journal source priority', journalPlan.planType);
  assert(checks, centerRecommendedPlanCoreFieldsValid(journalPlan), 'journal core fields');
  assert(checks, centerRecommendedPlanCtaSafe(journalPlan), 'journal CTA safe');

  const emptyPlan = buildCenterRecommendedPlan({
    gameState: day3State,
    day: 3,
    activeTarget: { ...day3Target, status: 'empty' },
    advisorSuggestion: day3Advisor,
  });

  assert(checks, emptyPlan.planType === 'empty', 'empty fallback type', emptyPlan.planType);
  assert(checks, centerRecommendedPlanEmptySafe(emptyPlan), 'empty no fake story/risk');

  const lockedPlan = buildCenterRecommendedPlan({
    gameState: day3State,
    day: 3,
    activeTarget: day3Target,
    cardVisibility: {
      ...buildHubCardVisibilityModel(day3State),
      showDailyPlan: 'compact',
    },
  });

  assert(checks, lockedPlan.planType === 'locked', 'locked compact without journal', lockedPlan.planType);
  assert(checks, centerRecommendedPlanLockedSafe(lockedPlan), 'locked safe text');

  const day3Presentation = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'route_pressure_tomorrow',
      title: 'Rota baskısı',
      mainLine: 'Dün rota baskısı artmıştı. Bugünkü plan yarına taşınmayı azaltabilir.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['operation_signals'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
    hubCityJournal: {
      title: 'Bugünkü Plan',
      primaryLine: 'Gün planı operasyon merkezinde.',
      secondaryLine: null,
      visible: true,
    },
  });

  assert(
    checks,
    centerRecommendedPlanCoreFieldsValid(day3Presentation.recommendedPlan),
    'presentation core fields',
  );
  assert(
    checks,
    !centerHomeAdvisorAndPlanShareText(day3Presentation),
    'presentation advisor/plan dedupe',
  );
  assert(
    checks,
    centerRecommendedPlanNotDuplicateSignals(
      day3Presentation.recommendedPlan,
      day3Presentation.operationSignals.signals.map((signal) => signal.title),
    ),
    'presentation not duplicate signals',
  );
  assert(
    checks,
    centerRecommendedPlanNotDuplicateDailyReward(
      day3Presentation.recommendedPlan,
      day3Presentation.dailyReward.helperText,
    ),
    'presentation not duplicate daily reward',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
