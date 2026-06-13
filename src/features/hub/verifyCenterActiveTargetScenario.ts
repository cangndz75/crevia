import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  CENTER_ACTIVE_TARGET_MAX_IMPACTS,
  buildCenterActiveTarget,
  centerActiveTargetActionKeyValid,
  centerActiveTargetCompletedCtaValid,
  centerActiveTargetCoreFieldsValid,
  centerActiveTargetCtaSafe,
  centerActiveTargetDay1SingleAction,
  centerActiveTargetEmptyStillRenderable,
  centerActiveTargetImpactCountValid,
  centerActiveTargetNotDuplicateText,
  centerActiveTargetProgressClamped,
  centerActiveTargetRewardSafe,
  centerActiveTargetSourceLabelValid,
  centerActiveTargetStatusValid,
  centerActiveTargetUsesDailyGoalWhenPresent,
} from './utils/centerActiveTargetPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterActiveTargetScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  const day1Target = buildCenterActiveTarget({
    gameState: day1State,
    day: 1,
    operationSignals: createInitialOperationSignalsState(1),
    dailyRewardHelperText: 'İlk hedefi tamamlayarak seriyi başlat.',
  });

  assert(checks, centerActiveTargetCoreFieldsValid(day1Target), 'Day 1 core fields valid');
  assert(checks, centerActiveTargetStatusValid(day1Target), 'Day 1 status valid');
  assert(checks, centerActiveTargetActionKeyValid(day1Target), 'Day 1 action key valid');
  assert(checks, centerActiveTargetDay1SingleAction(day1Target), 'Day 1 single clear action');
  assert(checks, day1Target.title === 'İlk Operasyonu Başlat', 'Day 1 title');
  assert(checks, centerActiveTargetImpactCountValid(day1Target), 'Day 1 impact count valid');
  assert(
    checks,
    day1Target.impactPreview.length <= CENTER_ACTIVE_TARGET_MAX_IMPACTS,
    'Day 1 max impacts',
  );
  assert(checks, centerActiveTargetRewardSafe(day1Target), 'Day 1 reward safe');
  assert(checks, centerActiveTargetCtaSafe(day1Target), 'Day 1 CTA safe');
  assert(
    checks,
    centerActiveTargetNotDuplicateText(
      day1Target,
      'İlk hedefi tamamlayarak seriyi başlat.',
    ),
    'Day 1 not duplicate daily reward helper',
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
  };

  const signalState = createInitialOperationSignalsState(3);
  const strainedSignals = {
    ...signalState,
    vehicles: {
      ...signalState.vehicles,
      status: 'critical' as const,
      score: 88,
      title: 'Ulaşım Baskısı',
      summary: 'Araç hattında gecikme riski yükseldi.',
    },
  };

  const signalTarget = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: strainedSignals,
  });

  assert(checks, signalTarget.sourceLabel === 'Operasyon sinyali', 'signal source priority');
  assert(checks, signalTarget.priority === 'urgent', 'signal urgent priority');
  assert(checks, centerActiveTargetProgressClamped(signalTarget), 'signal progress clamped');

  const emptyTarget = buildCenterActiveTarget({
    gameState: day3State,
    day: 3,
    operationSignals: createInitialOperationSignalsState(3),
  });

  assert(checks, emptyTarget.status === 'empty', 'calm day empty status');
  assert(checks, centerActiveTargetEmptyStillRenderable(emptyTarget), 'empty still renderable');
  assert(checks, Boolean(emptyTarget.cta.route), 'empty CTA has route');

  const completedGoal = {
    id: 'goal-completed',
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

  assert(checks, completedTarget.status === 'completed', 'completed status');
  assert(checks, centerActiveTargetCompletedCtaValid(completedTarget), 'completed CTA valid');
  assert(
    checks,
    centerActiveTargetUsesDailyGoalWhenPresent(completedTarget, completedGoal.id),
    'daily goal source when present',
  );

  const day1Presentation = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(
    checks,
    centerActiveTargetNotDuplicateText(
      day1Presentation.activeTarget,
      day1Presentation.citySummary.primaryInsight?.text,
    ),
    'not duplicate city summary insight',
  );
  assert(
    checks,
    centerActiveTargetNotDuplicateText(
      day1Presentation.activeTarget,
      day1Presentation.advisorSuggestion.recommendation,
    ),
    'not duplicate Ece recommendation',
  );
  assert(checks, centerActiveTargetSourceLabelValid(day1Presentation.activeTarget), 'source label');

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
