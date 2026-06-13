import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  buildCenterAdvisorSuggestion,
  centerAdvisorActionAlignedWithTarget,
  centerAdvisorActionKeyValid,
  centerAdvisorCompletedTone,
  centerAdvisorCoreFieldsValid,
  centerAdvisorDay1Teaching,
  centerAdvisorConfidenceValid,
  centerAdvisorDedupeText,
  centerAdvisorNoFakeCrisis,
  centerAdvisorNotDuplicateText,
  centerAdvisorPriorityValid,
  centerAdvisorSecondaryActionSafe,
  centerAdvisorSourceIdsUnique,
  centerAdvisorToneValid,
  centerAdvisorUrgentTone,
} from './utils/centerAdvisorPresentation';
import { buildCenterActiveTarget } from './utils/centerActiveTargetPresentation';
import { buildCenterCitySummary } from './utils/centerCitySummaryPresentation';
import { buildCenterDailyReward } from './utils/centerDailyRewardPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterAdvisorScenario(): {
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
    dailyRewardHelperText: day1Reward.helperText,
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

  assert(checks, centerAdvisorCoreFieldsValid(day1Advisor), 'Day 1 core fields valid');
  assert(checks, centerAdvisorToneValid(day1Advisor), 'Day 1 tone valid');
  assert(checks, centerAdvisorPriorityValid(day1Advisor), 'Day 1 priority valid');
  assert(checks, centerAdvisorConfidenceValid(day1Advisor), 'Day 1 confidence valid');
  assert(checks, centerAdvisorActionKeyValid(day1Advisor), 'Day 1 action key valid');
  assert(checks, centerAdvisorDay1Teaching(day1Advisor), 'Day 1 teaching tone and action');
  assert(checks, centerAdvisorSourceIdsUnique(day1Advisor), 'Day 1 source ids unique');
  assert(
    checks,
    centerAdvisorNotDuplicateText(day1Advisor, day1Target.title),
    'Day 1 not duplicate active target title',
  );
  assert(
    checks,
    centerAdvisorNotDuplicateText(day1Advisor, day1Reward.helperText),
    'Day 1 not duplicate daily reward helper',
  );
  assert(
    checks,
    centerAdvisorActionAlignedWithTarget(day1Advisor, day1Target),
    'Day 1 action aligned with target',
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
  };
  const signalState = createInitialOperationSignalsState(3);
  const urgentSignals = {
    ...signalState,
    vehicles: {
      ...signalState.vehicles,
      status: 'critical' as const,
      score: 90,
      title: 'Ulaşım Baskısı',
      summary: 'Sanayi tarafında baskı artıyor.',
    },
  };
  const urgentTarget = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: urgentSignals,
  });
  const urgentAdvisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: urgentTarget,
    operationSignals: urgentSignals,
    citySummary: buildCenterCitySummary({
      gameState: day3State,
      day: 3,
      operationSignals: urgentSignals,
      activeTargetTitle: urgentTarget.title,
    }),
  });

  assert(checks, centerAdvisorUrgentTone(urgentAdvisor), 'urgent signal tone');
  assert(checks, centerAdvisorNoFakeCrisis(urgentAdvisor), 'urgent has real source');
  assert(
    checks,
    centerAdvisorNotDuplicateText(urgentAdvisor, urgentTarget.title),
    'urgent not duplicate target title',
  );

  const completedGoal = {
    id: 'goal-done',
    day: 3,
    priority: 'primary' as const,
    kind: 'resolve_main_event' as const,
    title: 'Ana Olayı Çöz',
    description: 'Bugünkü ana olayı tamamlayarak şehir dengesini koru.',
    shortLabel: 'Ana olay',
    progressPercent: 100,
    status: 'completed' as const,
    isCompleted: true,
    isFailed: false,
    rewardXp: 80,
    createdAt: Date.now(),
  };
  const completedTarget = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    dailyGoalState: {
      day: 3,
      goals: [completedGoal],
      lastEvaluatedAt: Date.now(),
    },
  });
  const completedAdvisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: completedTarget,
  });

  assert(checks, centerAdvisorCompletedTone(completedAdvisor), 'completed celebration tone');
  assert(checks, completedAdvisor.action?.actionKey === 'view_report', 'completed report action');

  const emptyTarget = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: createInitialOperationSignalsState(3),
  });
  const emptyAdvisor = buildCenterAdvisorSuggestion({
    gameState: day3State,
    day: 3,
    activeTarget: emptyTarget,
    operationSignals: createInitialOperationSignalsState(3),
  });

  assert(checks, emptyAdvisor.tone === 'calm', 'empty calm tone');
  assert(checks, centerAdvisorSecondaryActionSafe(emptyAdvisor), 'empty secondary safe');

  const presentation = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    centerAdvisorNotDuplicateText(
      presentation.advisorSuggestion,
      presentation.citySummary.primaryInsight?.text,
    ),
    'presentation not duplicate city insight',
  );
  assert(
    checks,
    centerAdvisorNotDuplicateText(
      presentation.advisorSuggestion,
      presentation.activeTarget.title,
    ),
    'presentation not duplicate active target title',
  );
  assert(checks, Boolean(centerAdvisorDedupeText(presentation.advisorSuggestion).trim()), 'dedupe text');

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
