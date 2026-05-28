import type { DecisionAppliedCosts, DecisionAppliedEffects } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { buildDecisionXpResultFromApplied } from '@/core/xp/buildDecisionXpResult';
import type { EventDecision } from '@/core/models/EventCard';
import type { PlayerProgress } from '@/core/xp/types';

import {
  claimAllCompletedGoalXp,
  createDailyGoalsForDay,
  ensureDailyGoalsForDay,
  evaluateDailyGoals,
  type CreateDailyGoalsInput,
  type DailyGoalClaimResult,
  type DailyGoalEvaluationInput,
} from '@/core/dailyGoals/dailyGoalEngine';
import type {
  DailyGoalEvaluationTrigger,
  DailyGoalState,
} from '@/core/dailyGoals/dailyGoalTypes';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';

export type DailyGoalRuntime = {
  staffFatiguePeak: number;
  budgetExceededToday: boolean;
  primaryCompletedHint?: boolean;
};

export const INITIAL_DAILY_GOAL_RUNTIME: DailyGoalRuntime = {
  staffFatiguePeak: 0,
  budgetExceededToday: false,
  primaryCompletedHint: false,
};

export type DailyGoalStoreSlice = {
  day: number;
  gameState: GameState;
  neighborhoods: Neighborhood[];
  containerState: ContainerState;
  vehicleState: VehicleState;
  personnelState: PersonnelState;
  socialPulseState: SocialPulseState;
  decisionHistory: DecisionRecord[];
  dailyGoalRuntime: DailyGoalRuntime;
  isDay1Tutorial?: boolean;
  lastClosedDay?: number | null;
  dailyPriorityKey?: DailyPriorityKey;
};

function toCreateInput(slice: DailyGoalStoreSlice): CreateDailyGoalsInput {
  return {
    day: slice.day,
    gameState: slice.gameState,
    neighborhoods: slice.neighborhoods,
    containerState: slice.containerState,
    vehicleState: slice.vehicleState,
    personnelState: slice.personnelState,
    socialPulseState: slice.socialPulseState,
    isDay1Tutorial: slice.isDay1Tutorial,
    dailyPriorityKey: slice.dailyPriorityKey,
  };
}

function toEvaluationInput(
  slice: DailyGoalStoreSlice,
  trigger: DailyGoalEvaluationTrigger,
): DailyGoalEvaluationInput {
  return {
    ...toCreateInput(slice),
    decisionHistory: slice.decisionHistory,
    dailyGoalRuntime: slice.dailyGoalRuntime,
    trigger,
    lastClosedDay: slice.lastClosedDay,
  };
}

export function ensureDailyGoalStateForStore(
  slice: DailyGoalStoreSlice,
  existing: DailyGoalState | null | undefined,
): DailyGoalState {
  return ensureDailyGoalsForDay(toCreateInput(slice), existing);
}

export function evaluateDailyGoalsForStore(
  state: DailyGoalState,
  slice: DailyGoalStoreSlice,
  trigger: DailyGoalEvaluationTrigger,
): DailyGoalState {
  return evaluateDailyGoals(state, toEvaluationInput(slice, trigger));
}

export function runDailyGoalPipeline(params: {
  slice: DailyGoalStoreSlice;
  dailyGoalState: DailyGoalState | null | undefined;
  trigger: DailyGoalEvaluationTrigger;
  playerProgress: PlayerProgress;
  claimXp?: boolean;
}): {
  dailyGoalState: DailyGoalState;
  playerProgress: PlayerProgress;
  dailyGoalClaim: DailyGoalClaimResult | null;
  dailyGoalsByDay: Record<number, DailyGoalState>;
} {
  let state = ensureDailyGoalStateForStore(params.slice, params.dailyGoalState);
  state = evaluateDailyGoalsForStore(state, params.slice, params.trigger);

  let playerProgress = params.playerProgress;
  let dailyGoalClaim: DailyGoalClaimResult | null = null;

  if (params.claimXp !== false) {
    const claimResult = claimAllCompletedGoalXp(state.goals, playerProgress);
    state = { ...state, goals: claimResult.goals };
    playerProgress = claimResult.playerProgress;
    dailyGoalClaim = claimResult.claims[0] ?? null;
  }

  const dailyGoalsByDay = {
    ...(params.slice.day ? {} : {}),
    [state.day]: state,
  };

  return {
    dailyGoalState: state,
    playerProgress,
    dailyGoalClaim,
    dailyGoalsByDay: { [state.day]: state },
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
    primaryCompletedHint: runtime.primaryCompletedHint,
  };
}

/** @deprecated Eski API — store applyDecision için. */
export function processDecisionDailyGoal(params: {
  day: number;
  goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal | null | undefined;
  playerProgress: PlayerProgress;
  event: EventCard;
  decision: EventDecision;
  appliedEffects: DecisionAppliedEffects;
  appliedCosts?: DecisionAppliedCosts;
  runtime: DailyGoalRuntime;
  storeSlice: DailyGoalStoreSlice;
  dailyGoalState: DailyGoalState | null | undefined;
}): {
  goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal;
  playerProgress: PlayerProgress;
  runtime: DailyGoalRuntime;
  processResult: { goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal; playerProgress: PlayerProgress; claim: DailyGoalClaimResult | null };
  dailyGoalState: DailyGoalState;
} {
  const runtime = updateDailyGoalRuntime(
    params.runtime,
    params.appliedEffects,
    params.appliedCosts,
    params.decision,
  );

  const pipeline = runDailyGoalPipeline({
    slice: { ...params.storeSlice, day: params.day, dailyGoalRuntime: runtime },
    dailyGoalState: params.dailyGoalState,
    trigger: 'after_decision',
    playerProgress: params.playerProgress,
  });

  const primary =
    pipeline.dailyGoalState.goals.find((g) => g.priority === 'primary') ??
    pipeline.dailyGoalState.goals[0]!;

  return {
    goal: primary,
    playerProgress: pipeline.playerProgress,
    runtime,
    processResult: {
      goal: primary,
      playerProgress: pipeline.playerProgress,
      claim: pipeline.dailyGoalClaim,
    },
    dailyGoalState: pipeline.dailyGoalState,
  };
}

export function processDayEndDailyGoal(params: {
  slice: DailyGoalStoreSlice;
  dailyGoalState: DailyGoalState | null | undefined;
  playerProgress: PlayerProgress;
}): {
  dailyGoalState: DailyGoalState;
  playerProgress: PlayerProgress;
  claim: DailyGoalClaimResult | null;
  goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal;
} {
  const pipeline = runDailyGoalPipeline({
    slice: params.slice,
    dailyGoalState: params.dailyGoalState,
    trigger: 'end_of_day',
    playerProgress: params.playerProgress,
  });

  const primary =
    pipeline.dailyGoalState.goals.find((g) => g.priority === 'primary') ??
    pipeline.dailyGoalState.goals[0]!;

  return {
    dailyGoalState: pipeline.dailyGoalState,
    playerProgress: pipeline.playerProgress,
    claim: pipeline.dailyGoalClaim,
    goal: primary,
  };
}

export function processQuickActionDailyGoal(params: {
  slice: DailyGoalStoreSlice;
  dailyGoalState: DailyGoalState | null | undefined;
  playerProgress: PlayerProgress;
  trigger?: 'after_decision' | 'after_social_quick_action';
}): {
  dailyGoalState: DailyGoalState;
  playerProgress: PlayerProgress;
  claim: DailyGoalClaimResult | null;
  goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal;
} {
  const pipeline = runDailyGoalPipeline({
    slice: params.slice,
    dailyGoalState: params.dailyGoalState,
    trigger: params.trigger ?? 'after_social_quick_action',
    playerProgress: params.playerProgress,
  });

  const primary =
    pipeline.dailyGoalState.goals.find((g) => g.priority === 'primary') ??
    pipeline.dailyGoalState.goals[0]!;

  return {
    dailyGoalState: pipeline.dailyGoalState,
    playerProgress: pipeline.playerProgress,
    claim: pipeline.dailyGoalClaim,
    goal: primary,
  };
}

export { createDailyGoalsForDay, createDailyGoalForDay } from '@/core/dailyGoals/dailyGoalEngine';
