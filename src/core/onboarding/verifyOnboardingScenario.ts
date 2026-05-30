import { createDay1Seed } from '@/core/content/day1Seed';
import { selectAuthorityPermissionPreviewForDecision } from '@/core/authority/authorityPermissionPreview';
import { buildDay1AuthoritySummaryLines } from '@/core/authority/authorityPresentation';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';
import { DAY1_LEARNING_EVENT_IDS } from '@/features/tutorial/tutorialTypes';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { INITIAL_TUTORIAL_STATE } from '@/features/tutorial/tutorialTypes';

import {
  assertNoOnboardingForbiddenWords,
  buildDay1HubGuidanceModel,
  buildFirstEventGuidanceModel,
  buildFirstReportGuidanceModel,
  buildFirstResultGuidanceModel,
  buildPilotBriefingModel,
  buildWorkflowStepHintModel,
  collectOnboardingVisibleStrings,
  ONBOARDING_UI_MAX_BRIEFING_STEPS,
} from './onboardingPresentation';
import {
  countOnboardingHintsForDay,
  selectEligibleOnboardingHints,
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
    briefingStepCount: number;
    forbiddenHitCount: number;
    blockedFlowCount: number;
  };
} {
  const checks: Check[] = [];
  let forbiddenHitCount = 0;
  let blockedFlowCount = 0;

  const briefing = buildPilotBriefingModel();
  assert(checks, briefing.title.length > 0, 'Day 1 pilot briefing model üretir');
  assert(
    checks,
    briefing.steps.length <= ONBOARDING_UI_MAX_BRIEFING_STEPS,
    'Briefing step sayısı max 3',
    String(briefing.steps.length),
  );

  const hubGuidance = buildDay1HubGuidanceModel({ pilotDay: 1, isDay1: true });
  assert(
    checks,
    hubGuidance.showPilotBriefing &&
      hubGuidance.pilotProgressLabel === 'Pilot: 1 / 7',
    'Day 1 Hub guidance crash olmaz',
  );

  const firstEventId = DAY1_LEARNING_EVENT_IDS[0] ?? null;
  const inspectGuidance = buildFirstEventGuidanceModel({
    day: 1,
    eventId: firstEventId,
    isDay1LearningEvent: true,
  });
  assert(
    checks,
    inspectGuidance.showInspectBanner && !!inspectGuidance.inspectHint,
    'Day 1 first event İncele hint üretir',
  );

  const planHint = buildWorkflowStepHintModel({
    step: 'plan',
    day: 1,
    isDay1LearningEvent: true,
  });
  assert(
    checks,
    planHint.visible &&
      /halk|ekip|kaynak/i.test(planHint.text),
    'Planla hint halk/ekip/kaynak dengesini anlatır',
  );

  const assignHint = buildWorkflowStepHintModel({
    step: 'assign',
    day: 1,
    isDay1LearningEvent: true,
  });
  const fieldHint = buildWorkflowStepHintModel({
    step: 'field',
    day: 1,
    isDay1LearningEvent: true,
  });
  assert(
    checks,
    assignHint.compact && fieldHint.compact && assignHint.visible && fieldHint.visible,
    'Yönlendir/Sahada hintleri compact döner',
  );

  const firstResult = buildFirstResultGuidanceModel(true, true);
  const normalResult = buildFirstResultGuidanceModel(false, true);
  assert(
    checks,
    firstResult.visible && !normalResult.visible,
    'First result guidance yalnız Day 1/tutorial akışında',
  );

  const normalInspect = buildWorkflowStepHintModel({
    step: 'inspect',
    day: 3,
    isDay1LearningEvent: false,
  });
  assert(
    checks,
    !normalInspect.visible,
    'Normal day onboarding hintleri gizli',
  );

  const reportGuidance = buildFirstReportGuidanceModel();
  const day1Report = applyDay1TutorialReportCopy(
    {
      ...buildDailyReport({
        day: 1,
        metrics: { publicSatisfaction: 55, staffMorale: 65, budget: 50_000 },
        decisionHistory: [],
        activeEvents: [],
        resolvedEventIds: [],
        snapshots: [],
      }),
      badgeEvaluation: {
        earnedBadgeIds: ['first_step'],
        earnedLines: ['rozet'],
        progressLines: [],
      },
    },
    true,
  );
  assert(
    checks,
    reportGuidance.hideBadgeBlock &&
      day1Report.badgeEvaluation == null &&
      !reportGuidance.summaryLines.some((l) => /rozet|puan/i.test(l)),
    'Day 1 report copy badge/puan spam yapmaz',
  );

  assert(
    checks,
    buildDay1AuthoritySummaryLines().length <= 2,
    'Authority summary max 2 satır korunur',
  );

  const day1Seed = createDay1Seed();
  const sampleEvent = day1Seed.gameState.events[0];
  const permissionPreview = selectAuthorityPermissionPreviewForDecision({
    day: 1,
    event: sampleEvent,
    decision: sampleEvent?.decisions[0],
  });
  assert(
    checks,
    !permissionPreview.visible,
    'Permission preview Day 1 gizli kalır',
  );

  const visibleStrings = collectOnboardingVisibleStrings();
  const tutorialWordHits = visibleStrings.filter((s) =>
    /\b(tutorial|onboarding)\b/i.test(s),
  );
  assert(
    checks,
    tutorialWordHits.length === 0,
    'Görünen metinlerde tutorial/onboarding geçmez',
    tutorialWordHits.join(' | '),
  );

  for (const text of visibleStrings) {
    const hits = assertNoOnboardingForbiddenWords(text);
    if (hits.length > 0) forbiddenHitCount += hits.length;
  }
  assert(
    checks,
    forbiddenHitCount === 0,
    'Yasaklı kelime taraması 0 döner',
    String(forbiddenHitCount),
  );

  const day1Hub = selectEligibleOnboardingHints(
    baseCtx({ screen: 'hub', day: 1 }),
  );
  const day1Count = day1Hub.length;

  const storeVis = selectOnboardingHubVisibilityFromStore({
    gameState: createDay1Seed().gameState,
    tutorialState: { ...INITIAL_TUTORIAL_STATE, activeStepId: 'day1_intro' },
    dailyPriorityState: null,
    dailyGoalState: null,
    lastDecisionResult: null,
    lastDailyReport: null,
    decisionHistory: [],
    onboardingDismissedHintIds: [],
  });
  if (storeVis.showDailyPrioritySelection && storeVis.showTodayFlow) {
    blockedFlowCount += 1;
  }
  assert(checks, blockedFlowCount === 0, 'Hub Day 1 flow not blocked');

  assert(
    checks,
    buildDay1HubGuidanceModel({ isDay1: false }).showPilotBriefing === false,
    'Day 1 state yoksa briefing güvenli fallback',
  );

  assert(
    checks,
    buildWorkflowStepHintModel({ step: 'unknown', day: 1 }).visible === false,
    'Workflow step unknown fallback',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  const lines = checks.map(
    (c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? `: ${c.detail}` : ''}`,
  );

  return {
    ok: failCount === 0,
    failCount,
    warnCount: 0,
    checks: lines,
    metrics: {
      day1HintCount: day1Count,
      day2HintCount: countOnboardingHintsForDay(2),
      briefingStepCount: briefing.steps.length,
      forbiddenHitCount,
      blockedFlowCount,
    },
  };
}
