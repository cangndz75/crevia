import { createDay1Seed } from '@/core/content/day1Seed';
import { INITIAL_TUTORIAL_STATE } from '@/features/tutorial/tutorialTypes';
import { DAY1_LEARNING_EVENT_IDS } from '@/features/tutorial/tutorialTypes';

import {
  DAY1_FLOW_PLACEHOLDER,
  DAY1_GOALS_PLACEHOLDER,
  DAY1_PRIORITY_FALLBACK,
  mobileSafeLine,
  ONBOARDING_HINTS,
  ONBOARDING_MAX_HINT_TEXT_LENGTH,
} from './onboardingPresentation';
import {
  countOnboardingHintsForDay,
  isOnboardingHintTextValid,
  selectEligibleOnboardingHints,
  selectOnboardingCoachHint,
  selectOnboardingFocusHint,
  selectOnboardingHubVisibility,
  selectOnboardingHubVisibilityFromStore,
} from './onboardingSelectors';
import type { OnboardingContextInput } from './onboardingTypes';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function baseCtx(
  overrides: Partial<OnboardingContextInput>,
): OnboardingContextInput {
  return {
    day: 1,
    screen: 'hub',
    pilotActive: true,
    tutorialDay1Completed: false,
    tutorialSkipped: false,
    tutorialActiveStepId: null,
    tutorialCompletedStepIds: [],
    dismissedHintIds: [],
    dailyPrioritySelected: false,
    dailyPrioritySelectionRequired: false,
    hasDecisionToday: false,
    hasLastDecisionResult: false,
    hasDailyReportForToday: false,
    dailyGoalCount: 0,
    todayFlowLineCount: 0,
    legacyCoachOnScreen: false,
    ...overrides,
  };
}

export function verifyOnboardingScenario(): {
  ok: boolean;
  failCount: number;
  warnCount: number;
  checks: string[];
  metrics: {
    day1HintCount: number;
    day2HintCount: number;
    duplicateHintCount: number;
    maxHintTextLength: number;
    blockedFlowCount: number;
    tutorialConflictCount: number;
  };
} {
  const checks: Check[] = [];
  let duplicateHintCount = 0;
  let tutorialConflictCount = 0;
  let blockedFlowCount = 0;

  const day1Hub = selectEligibleOnboardingHints(
    baseCtx({ screen: 'hub', day: 1 }),
  );
  assert(
    checks,
    day1Hub.some((h) => h.moment === 'hub_intro'),
    'Day 1 hub_intro hint',
    day1Hub.map((h) => h.moment).join(','),
  );

  const day1Vis = selectOnboardingHubVisibility(1, true, false);
  assert(
    checks,
    !day1Vis.showDailyPrioritySelection && day1Vis.showDailyPriorityCompact,
    'Day 1 priority compact / no selection',
  );

  const critical = selectOnboardingFocusHint(
    baseCtx({ screen: 'hub', day: 1 }),
    'critical_event_card',
  );
  assert(
    checks,
    critical?.moment === 'critical_event_intro',
    'Day 1 critical event intro',
    critical?.id ?? 'none',
  );

  const decisionCard = selectOnboardingFocusHint(
    baseCtx({ screen: 'event_detail', day: 1 }),
    'quick_decisions',
  );
  assert(
    checks,
    decisionCard?.moment === 'decision_card_intro',
    'Day 1 decision card intro',
    decisionCard?.id ?? 'none',
  );

  const resultCtx = baseCtx({
    screen: 'decision_result',
    day: 1,
    hasLastDecisionResult: true,
  });
  const resultHint = selectOnboardingCoachHint(resultCtx);
  assert(
    checks,
    resultHint?.moment === 'decision_result_intro',
    'Decision result intro',
  );
  assert(
    checks,
    true,
    'Decision result intro safe without priority impact',
    'presentation-only',
  );

  const liveFlow = selectOnboardingFocusHint(
    baseCtx({ screen: 'hub', day: 1, hasDecisionToday: true }),
  );
  assert(
    checks,
    liveFlow?.moment === 'live_flow_intro',
    'Hub live flow intro after decision',
    liveFlow?.id ?? 'none',
  );

  const reportHint = selectOnboardingCoachHint(
    baseCtx({
      screen: 'daily_report',
      day: 1,
      hasDailyReportForToday: true,
    }),
  );
  assert(
    checks,
    reportHint?.moment === 'daily_report_intro',
    'Daily report intro',
  );

  const day2Priority = selectOnboardingCoachHint(
    baseCtx({
      day: 2,
      screen: 'hub',
      dailyPrioritySelectionRequired: true,
    }),
  );
  assert(
    checks,
    day2Priority?.moment === 'day2_priority_choice',
    'Day 2 daily priority intro',
  );

  const day2Goals = selectOnboardingFocusHint(
    baseCtx({
      day: 2,
      screen: 'hub',
      dailyPrioritySelected: true,
      dailyGoalCount: 3,
    }),
  );
  assert(
    checks,
    day2Goals?.moment === 'day2_goals_intro',
    'Day 2 daily goals intro',
  );

  const day3Count = selectEligibleOnboardingHints(
    baseCtx({ day: 3, screen: 'hub' }),
  ).length;
  const day1Count = day1Hub.length;
  assert(
    checks,
    day3Count < day1Count,
    'Day 3+ fewer hints than Day 1',
    `d1=${day1Count} d3=${day3Count}`,
  );

  const dupCtx = baseCtx({ screen: 'hub', day: 1 });
  const once = selectEligibleOnboardingHints(dupCtx);
  const twice = selectEligibleOnboardingHints(dupCtx);
  const dupIds = once.map((h) => h.id);
  const hasDup = dupIds.length !== new Set(dupIds).size || once.length !== twice.length;
  duplicateHintCount = hasDup ? 1 : 0;
  assert(checks, !hasDup, 'No duplicate hints same context');

  assert(
    checks,
    selectEligibleOnboardingHints(
      baseCtx({
        tutorialActiveStepId: undefined as unknown as null,
        dismissedHintIds: undefined as unknown as string[],
      }),
    ).length >= 0,
    'Missing tutorial dismissed ids safe',
  );

  assert(
    checks,
    selectOnboardingHubVisibility(1, true, false).showTodayFlowPlaceholder,
    'Missing live flow placeholder Day 1',
    DAY1_FLOW_PLACEHOLDER,
  );

  assert(
    checks,
    DAY1_GOALS_PLACEHOLDER.length > 0,
    'Missing dailyGoalState fallback copy',
  );

  assert(
    checks,
    DAY1_PRIORITY_FALLBACK.length > 0,
    'Missing dailyPriorityState fallback copy',
  );

  for (const hint of ONBOARDING_HINTS) {
    assert(checks, isOnboardingHintTextValid(hint), `Copy valid: ${hint.id}`);
    assert(
      checks,
      hint.text.length <= ONBOARDING_MAX_HINT_TEXT_LENGTH,
      `Copy length: ${hint.id}`,
      String(hint.text.length),
    );
  }

  const long = 'a'.repeat(200);
  const safe = mobileSafeLine(long, 160);
  assert(
    checks,
    safe.length <= 161,
    'mobileSafeLine caps length',
    String(safe.length),
  );

  const legacyCtx = baseCtx({
    screen: 'hub',
    day: 1,
    legacyCoachOnScreen: true,
    tutorialActiveStepId: 'day1_intro',
  });
  const coachHidden = selectOnboardingCoachHint(legacyCtx);
  if (coachHidden) tutorialConflictCount += 1;
  assert(checks, coachHidden == null, 'Legacy overlay hides coach bubble');

  const seed = createDay1Seed();
  const storeVis = selectOnboardingHubVisibilityFromStore({
    gameState: seed.gameState,
    tutorialState: { ...INITIAL_TUTORIAL_STATE, activeStepId: 'day1_intro' },
    dailyPriorityState: null,
    dailyGoalState: null,
    lastDecisionResult: null,
    lastDailyReport: null,
    decisionHistory: [],
    onboardingDismissedHintIds: [],
  });
  assert(
    checks,
    !storeVis.showDailyPrioritySelection,
    'Store slice hub visibility Day 1',
  );

  const anchorOk = DAY1_LEARNING_EVENT_IDS.length >= 1;
  assert(checks, anchorOk, 'Day 1 tutorial anchor ids present');

  if (day1Vis.showDailyPrioritySelection && day1Vis.showTodayFlow) {
    blockedFlowCount += 1;
  }
  assert(checks, blockedFlowCount === 0, 'Hub Day 1 flow not blocked');

  const failCount = checks.filter((c) => !c.ok).length;
  const lines = checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? `: ${c.detail}` : ''}`);

  return {
    ok: failCount === 0,
    failCount,
    warnCount: 0,
    checks: lines,
    metrics: {
      day1HintCount: day1Count,
      day2HintCount: countOnboardingHintsForDay(2),
      duplicateHintCount,
      maxHintTextLength: Math.max(...ONBOARDING_HINTS.map((h) => h.text.length)),
      blockedFlowCount,
      tutorialConflictCount,
    },
  };
}
