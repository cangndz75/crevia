import { createDay1Seed } from '@/core/content/day1Seed';
import {
  createDailyGoalsForDay,
  ensureDailyGoalsForDay,
  evaluateDailyGoals,
  evaluateSingleGoal,
} from '@/core/dailyGoals/dailyGoalEngine';
import { buildDailyGoalReportLines } from '@/core/dailyGoals/dailyGoalPresentation';
import { INITIAL_DAILY_GOAL_RUNTIME } from '@/core/dailyGoals/dailyGoalIntegration';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import type { DailyGoal } from '@/core/dailyGoals/dailyGoalTypes';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

export type VerifyDailyGoalsOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], label: string, condition: boolean): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}`);
}

export function verifyDailyGoalsScenario(): VerifyDailyGoalsOutcome {
  const checks: string[] = [];
  const bundle = createDay1Seed();
  const day = bundle.gameState.city.day;

  const baseInput = {
    day,
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    containerState: createInitialContainerState(day),
    vehicleState: createInitialVehicleState(day),
    personnelState: createInitialPersonnelState(),
    socialPulseState: createInitialSocialPulseState(day),
    isDay1Tutorial: true,
  };

  const day1 = createDailyGoalsForDay(baseInput);
  assert(checks, 'Day 1 üç hedef üretir', day1.goals.length === 3);
  assert(
    checks,
    'Day 1 ana hedef ilk olay',
    day1.goals.some((g) => g.priority === 'primary' && g.kind === 'resolve_main_event'),
  );

  const again = ensureDailyGoalsForDay(baseInput, day1);
  assert(checks, 'aynı gün duplicate üretmez', again.goals.length === day1.goals.length);

  const day2 = createDailyGoalsForDay({ ...baseInput, day: 2, isDay1Tutorial: false });
  assert(checks, 'gün değişince yeni set', day2.day === 2 && day2.goals[0]?.id !== day1.goals[0]?.id);

  const aboveGoal: DailyGoal = {
    ...day1.goals[1]!,
    kind: 'keep_metric_above',
    metricKey: 'publicSatisfaction',
    targetValue: 50,
    startValue: 55,
  };
  const aboveResult = evaluateSingleGoal(aboveGoal, {
    ...baseInput,
    decisionHistory: [],
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    trigger: 'after_decision',
    gameState: {
      ...bundle.gameState,
      city: { ...bundle.gameState.city, publicSatisfaction: 58 },
    },
  });
  assert(checks, 'keep_metric_above tamamlanır', aboveResult.isCompleted);

  const belowGoal: DailyGoal = {
    ...day2.goals[0]!,
    kind: 'keep_metric_below',
    metricKey: 'operationRisk',
    targetValue: 35,
    startValue: 40,
  };
  const belowRisk = evaluateSingleGoal(belowGoal, {
    ...baseInput,
    day: 2,
    decisionHistory: [],
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    trigger: 'end_of_day',
    gameState: {
      ...bundle.gameState,
      city: { ...bundle.gameState.city, riskScore: 50 },
    },
  });
  assert(checks, 'keep_metric_below risk fail', belowRisk.isFailed);

  const mainEvent = day2.goals.find((g) => g.kind === 'resolve_main_event');
  if (mainEvent?.relatedEventId) {
    const solved = evaluateSingleGoal(
      { ...mainEvent, relatedEventId: 'ev_test' },
      {
        ...baseInput,
        day: 2,
        decisionHistory: [],
        dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
        trigger: 'after_decision',
        gameState: {
          ...bundle.gameState,
          solvedEvents: [{ id: 'ev_test', title: 'T', xpEarned: 10 }],
        },
      },
    );
    assert(checks, 'resolve_main_event solved', solved.isCompleted);
  }

  const countGoal: DailyGoal = {
    id: 'g_count',
    day: 2,
    priority: 'secondary',
    kind: 'resolve_event_count',
    title: '2 olay',
    description: '',
    shortLabel: '2 olay',
    targetValue: 2,
    progressPercent: 0,
    status: 'active',
    isCompleted: false,
    isFailed: false,
    createdAt: Date.now(),
  };
  const countEval = evaluateSingleGoal(countGoal, {
    ...baseInput,
    day: 2,
    decisionHistory: [
      { id: '1', day: 2 } as never,
      { id: '2', day: 2 } as never,
    ],
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    trigger: 'after_decision',
  });
  assert(checks, 'resolve_event_count progress', countEval.isCompleted);

  const completedGoal: DailyGoal = {
    ...countGoal,
    isCompleted: true,
    status: 'completed',
    completedAt: Date.now(),
  };
  const reEval = evaluateSingleGoal(completedGoal, {
    ...baseInput,
    day: 2,
    decisionHistory: [],
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    trigger: 'end_of_day',
    gameState: {
      ...bundle.gameState,
      city: { ...bundle.gameState.city, riskScore: 99 },
    },
  });
  assert(checks, 'completed hedef failed olmaz', !reEval.isFailed);

  const finalState = evaluateDailyGoals(day2, {
    ...baseInput,
    day: 2,
    isDay1Tutorial: false,
    decisionHistory: [],
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    trigger: 'end_of_day',
  });
  assert(checks, 'end_of_day final evaluation', finalState.goals.length > 0);

  assert(
    checks,
    'eksik subsystem crash etmez',
    createDailyGoalsForDay({
      day: 3,
      gameState: bundle.gameState,
      neighborhoods: [],
      containerState: createInitialContainerState(3),
      vehicleState: createInitialVehicleState(3),
      personnelState: createInitialPersonnelState(),
      socialPulseState: createInitialSocialPulseState(3),
    }).goals.length === 3,
  );

  const legacySave = {
    saveVersion: 6,
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: [],
    snapshots: [],
    currentDailyGoal: {
      id: 'legacy',
      day: 1,
      priority: 'primary',
      kind: 'resolve_main_event',
      title: 'Legacy',
      description: '',
      shortLabel: 'L',
      targetValue: 1,
      progressPercent: 0,
      status: 'active',
      isCompleted: false,
      isFailed: false,
      createdAt: Date.now(),
    },
    dailyGoalsByDay: {},
    dailyGoalRuntime: INITIAL_DAILY_GOAL_RUNTIME,
    economyState: {
      currentSource: bundle.gameState.city.budget,
      startingSource: bundle.gameState.city.budget,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
    },
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(1),
    vehicleState: createInitialVehicleState(1),
    socialPulseState: createInitialSocialPulseState(1),
    tutorialState: {
      day1Completed: false,
      activeStepId: null,
      completedStepIds: [],
      skipped: false,
    },
    bestPilotScores: [],
  };

  const normalized = normalizePersistedSave(legacySave);
  assert(checks, 'v6 save dailyGoalState fallback', normalized?.dailyGoalState != null);
  assert(checks, 'SAVE_VERSION güncel', SAVE_VERSION === 24);

  assert(
    checks,
    'report lines boş state',
    buildDailyGoalReportLines(null).length === 0,
  );

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
