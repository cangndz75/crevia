import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { DailyPriorityByDay } from '@/core/dailyPriority/dailyPriorityTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import { buildCarryOverSignalsForDay } from './carryOverEngine';
import type { CarryOverEvaluationInput, CarryOverSignal } from './carryOverTypes';

export type CarryOverStoreSlice = {
  gameState: {
    city: { day: number };
    pilot?: { butterflyHookState?: ButterflyHookState };
  };
  dailyPriorityByDay: DailyPriorityByDay;
  dailyGoalsByDay: Record<number, DailyGoalState>;
  lastDailyReport: DailyReport | null;
};

export function buildCarryOverEvaluationInput(
  slice: CarryOverStoreSlice,
  options?: {
    butterflyHookState?: ButterflyHookState;
    focalNeighborhoodId?: string;
    day?: number;
  },
): CarryOverEvaluationInput {
  const day = options?.day ?? slice.gameState.city.day;
  const previousDay = Math.max(1, day - 1);

  return {
    day,
    previousDay,
    dailyPriorityByDay: slice.dailyPriorityByDay,
    dailyGoalsByDay: slice.dailyGoalsByDay,
    dailyReportsByDay: slice.lastDailyReport
      ? { [slice.lastDailyReport.day]: slice.lastDailyReport }
      : undefined,
    butterflyHookState: options?.butterflyHookState,
    focalNeighborhoodId: options?.focalNeighborhoodId,
  };
}

export function selectCarryOverSignalsForDay(
  slice: CarryOverStoreSlice,
  butterflyHookState?: ButterflyHookState,
): CarryOverSignal[] {
  const day = slice.gameState.city.day;
  if (day <= 1) return [];

  const focal =
    normalizeNeighborhoodId(
      slice.dailyPriorityByDay[day - 1]?.impactLog?.[0]?.relatedNeighborhoodId,
    ) ?? undefined;

  const input = buildCarryOverEvaluationInput(slice, {
    butterflyHookState:
      butterflyHookState ?? slice.gameState.pilot?.butterflyHookState,
    focalNeighborhoodId: focal ?? undefined,
    day,
  });

  return buildCarryOverSignalsForDay(input);
}
