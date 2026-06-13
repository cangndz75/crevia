import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  CENTER_HOME_MODULE_ORDER,
  buildCenterHomePresentation,
  centerHomeAdvisorAndPlanShareText,
} from './utils/centerHomePresentation';
import {
  CENTER_DAY_ONE_MAX_CONTINUATION_CARDS,
  CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS,
  CENTER_DAY_ONE_MAX_QUICK_ACTIONS,
  auditCenterHomePresentation,
  centerCompletedTargetGuidesNext,
  centerDayOnePolicyValid,
  centerLowDataPresentationSafe,
  centerPresentationAccessibilityValid,
  centerPresentationNoCriticalDuplicates,
  centerPresentationNoUnsafeText,
  centerPresentationRouteSafetyValid,
  centerVisibilityFlagsConsistent,
  isSafeCenterDisplayText,
} from './utils/centerStatePolicy';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterEmptyLockedStatesScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  const day1 = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(checks, centerDayOnePolicyValid(day1), 'Day 1 policy valid');
  assert(checks, centerPresentationNoUnsafeText(day1), 'Day 1 no unsafe text');
  assert(checks, centerPresentationRouteSafetyValid(day1), 'Day 1 route safety');
  assert(checks, centerPresentationAccessibilityValid(day1), 'Day 1 accessibility');
  assert(checks, centerVisibilityFlagsConsistent(day1), 'Day 1 visibility flags');
  assert(checks, !centerHomeAdvisorAndPlanShareText(day1), 'Day 1 advisor/plan dedupe');
  assert(
    checks,
    day1.operationFocus.items.length <= CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS,
    'Day 1 operation focus max items',
    `count=${day1.operationFocus.items.length}`,
  );
  assert(
    checks,
    day1.continuationCards.cards.length <= CENTER_DAY_ONE_MAX_CONTINUATION_CARDS,
    'Day 1 continuation max cards',
    `count=${day1.continuationCards.cards.length}`,
  );
  assert(
    checks,
    day1.quickActions.items.length <= CENTER_DAY_ONE_MAX_QUICK_ACTIONS,
    'Day 1 quick actions max',
    `count=${day1.quickActions.items.length}`,
  );
  assert(
    checks,
    !['city_journal', 'story_chain', 'carry_over', 'tomorrow_risk'].includes(
      day1.recommendedPlan.planType,
    ),
    'Day 1 no fake journal/story plan',
    day1.recommendedPlan.planType,
  );
  assert(
    checks,
    day1.operationSignals.signals.length <= 1,
    'Day 1 operation signals compact',
    `count=${day1.operationSignals.signals.length}`,
  );
  assert(
    checks,
    day1.quickActions.items.filter((item) => item.enabled).length === 1,
    'Day 1 single enabled quick action',
    `enabled=${day1.quickActions.items.filter((item) => item.enabled).length}`,
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
    player: { ...day1State.player, streakDays: 2 },
  };

  const lowData = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: undefined,
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  assert(checks, centerLowDataPresentationSafe(lowData), 'low data city summary safe');
  assert(checks, centerPresentationNoUnsafeText(lowData), 'low data no unsafe text');
  assert(checks, centerPresentationRouteSafetyValid(lowData), 'low data route safety');
  assert(
    checks,
    lowData.citySummary.metrics.every((metric) => isSafeCenterDisplayText(metric.valueText)),
    'low data metric values safe',
  );

  const calmDay = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
  });

  assert(
    checks,
    calmDay.continuationCards.cards.length === 0
      ? calmDay.visibilityFlags.continuationCards === 'hidden'
      : true,
    'empty continuation hidden',
    `visibility=${calmDay.visibilityFlags.continuationCards}`,
  );
  assert(
    checks,
    calmDay.operationSignals.signals.length <= 3,
    'calm day signals bounded',
    `count=${calmDay.operationSignals.signals.length}`,
  );

  const completedPresentation: typeof calmDay = {
    ...calmDay,
    activeTarget: {
      ...calmDay.activeTarget,
      status: 'completed',
      cta: {
        label: 'Sonucu Gör',
        route: '/reports',
        actionKey: 'view_result',
        enabled: true,
      },
    },
    dailyReward: {
      ...calmDay.dailyReward,
      claimState: 'claimed',
      ctaEnabled: false,
      claimedToday: true,
    },
  };

  assert(
    checks,
    centerCompletedTargetGuidesNext(completedPresentation),
    'completed target guides next',
  );
  assert(
    checks,
    !completedPresentation.dailyReward.ctaEnabled,
    'claimed daily reward no claim CTA',
  );

  const richDay = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
    hubStoryChainLine: 'Mahalle hafızası devam ediyor.',
    hubEceContextLine: 'Ece: önce ulaşım hattını güçlendir.',
  });

  assert(checks, centerPresentationNoCriticalDuplicates(richDay), 'rich day no critical duplicates');
  assert(checks, centerPresentationRouteSafetyValid(richDay), 'rich day route safety');
  assert(
    checks,
    richDay.moduleOrder.join('|') === CENTER_HOME_MODULE_ORDER.join('|'),
    'module order preserved',
  );

  const audit = auditCenterHomePresentation(richDay);
  assert(checks, audit.ok, 'rich day audit', audit.issues.join(', '));

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
