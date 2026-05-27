import type { DecisionAppliedCosts, DecisionAppliedEffects } from '@/core/models/DecisionRecord';
import type { EventCard, EventRiskLevel } from '@/core/models/EventCard';
import { buildDecisionXpResultFromApplied } from '@/core/xp/buildDecisionXpResult';
import type { EventDecision } from '@/core/models/EventCard';
import type { PlayerProgress } from '@/core/xp/types';

import {
  createDailyGoalForDay,
  processDailyGoalEvent,
  type ProcessDailyGoalResult,
} from '@/core/dailyGoals/dailyGoalEngine';
import type { DailyGoal, DailyGoalProgressEvent } from '@/core/dailyGoals/types';

export type DailyGoalRuntime = {
  staffFatiguePeak: number;
  budgetExceededToday: boolean;
};

export const INITIAL_DAILY_GOAL_RUNTIME: DailyGoalRuntime = {
  staffFatiguePeak: 0,
  budgetExceededToday: false,
};

export function ensureDailyGoalForDay(
  day: number,
  currentGoal: DailyGoal | null | undefined,
): DailyGoal {
  const safeDay = Math.max(1, Math.floor(day));
  if (currentGoal?.day === safeDay) {
    return currentGoal;
  }
  return createDailyGoalForDay(safeDay);
}

export function buildDecisionProgressEvent(
  event: EventCard,
  appliedEffects: DecisionAppliedEffects,
  appliedCosts: DecisionAppliedCosts | undefined,
  decision: EventDecision,
): DailyGoalProgressEvent {
  const decisionResult = buildDecisionXpResultFromApplied(
    appliedEffects,
    appliedCosts,
    decision,
  );

  return {
    type: 'decision_applied',
    decisionResult: {
      satisfactionDelta: decisionResult.satisfactionDelta,
      riskDelta: decisionResult.riskDelta,
      budgetSpent: decisionResult.budgetSpent,
      expectedBudget: decisionResult.expectedBudget,
    },
    event: {
      severity: event.riskLevel,
      riskLevel: event.riskLevel as EventRiskLevel,
    },
  };
}

export function updateDailyGoalRuntime(
  runtime: DailyGoalRuntime,
  appliedEffects: DecisionAppliedEffects,
  appliedCosts: DecisionAppliedCosts | undefined,
  decision: EventDecision,
): DailyGoalRuntime {
  const xpResult = buildDecisionXpResultFromApplied(
    appliedEffects,
    appliedCosts,
    decision,
  );

  const staffFatigueDelta = xpResult.staffFatigueDelta ?? 0;
  const budgetSpent = xpResult.budgetSpent ?? 0;
  const expectedBudget = xpResult.expectedBudget ?? 0;
  const budgetExceeded =
    expectedBudget > 0
      ? budgetSpent > expectedBudget
      : budgetSpent > 0 && (appliedEffects.budget ?? 0) < 0;

  return {
    staffFatiguePeak: Math.max(runtime.staffFatiguePeak, staffFatigueDelta),
    budgetExceededToday: runtime.budgetExceededToday || budgetExceeded,
  };
}

export function processDecisionDailyGoal(params: {
  day: number;
  goal: DailyGoal | null | undefined;
  playerProgress: PlayerProgress;
  event: EventCard;
  decision: EventDecision;
  appliedEffects: DecisionAppliedEffects;
  appliedCosts?: DecisionAppliedCosts;
  runtime: DailyGoalRuntime;
}): {
  goal: DailyGoal;
  playerProgress: PlayerProgress;
  runtime: DailyGoalRuntime;
  processResult: ProcessDailyGoalResult;
} {
  const goal = ensureDailyGoalForDay(params.day, params.goal);
  const runtime = updateDailyGoalRuntime(
    params.runtime,
    params.appliedEffects,
    params.appliedCosts,
    params.decision,
  );

  const progressEvent = buildDecisionProgressEvent(
    params.event,
    params.appliedEffects,
    params.appliedCosts,
    params.decision,
  );

  const processResult = processDailyGoalEvent({
    goal,
    playerProgress: params.playerProgress,
    event: progressEvent,
  });

  return {
    goal: processResult.goal,
    playerProgress: processResult.playerProgress,
    runtime,
    processResult,
  };
}

export function processDayEndDailyGoal(params: {
  day: number;
  goal: DailyGoal | null | undefined;
  playerProgress: PlayerProgress;
  runtime: DailyGoalRuntime;
}): ProcessDailyGoalResult {
  const goal = ensureDailyGoalForDay(params.day, params.goal);

  return processDailyGoalEvent({
    goal,
    playerProgress: params.playerProgress,
    event: {
      type: 'day_ended',
      daySummary: {
        maxStaffFatigue: params.runtime.staffFatiguePeak,
        budgetExceeded: params.runtime.budgetExceededToday,
      },
    },
  });
}

export function processQuickActionDailyGoal(params: {
  day: number;
  goal: DailyGoal | null | undefined;
  playerProgress: PlayerProgress;
  quickActionId: string;
}): ProcessDailyGoalResult {
  const goal = ensureDailyGoalForDay(params.day, params.goal);

  return processDailyGoalEvent({
    goal,
    playerProgress: params.playerProgress,
    event: {
      type: 'quick_action_used',
      quickActionId: params.quickActionId,
    },
  });
}
