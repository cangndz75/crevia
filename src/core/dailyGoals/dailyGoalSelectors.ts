import type { DailyGoal, DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';

export function selectPrimaryDailyGoal(
  state: DailyGoalState | null | undefined,
): DailyGoal | null {
  if (!state?.goals?.length) return null;
  return state.goals.find((g) => g.priority === 'primary') ?? state.goals[0] ?? null;
}

export function selectSecondaryDailyGoals(
  state: DailyGoalState | null | undefined,
): DailyGoal[] {
  if (!state?.goals?.length) return [];
  return state.goals.filter((g) => g.priority === 'secondary');
}

export function selectDailyGoalsForHub(
  state: DailyGoalState | null | undefined,
): DailyGoal[] {
  if (!state?.goals?.length) return [];
  return state.goals.slice(0, 3);
}

export function hasDailyGoalAtRisk(state: DailyGoalState | null | undefined): boolean {
  return state?.goals.some((g) => g.status === 'at_risk') ?? false;
}

export function countCompletedDailyGoals(
  state: DailyGoalState | null | undefined,
): number {
  return state?.goals.filter((g) => g.isCompleted).length ?? 0;
}
