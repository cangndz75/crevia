import { buildCarryOverHubLines } from '@/core/carryOver/carryOverPresentation';
import { selectCarryOverSignalsForDay } from '@/core/carryOver/carryOverSelectors';
import type { GameState } from '@/core/models/GameState';
import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { DailyPriorityByDay } from '@/core/dailyPriority/dailyPriorityTypes';

import {
  buildEventLifecycleContext,
  buildResolvedTodayIdSet,
  getEventLifecycleStatusForEvent,
  selectHubPrimaryEvent,
} from './eventLifecycleEngine';
import { buildButterflyFlowLine, buildLiveFlowEntries } from './liveFlowEngine';
import { formatHubTodayFlowLines } from './liveFlowPresentation';
import type { EventLifecycleContext, LiveFlowEntry } from './liveFlowTypes';

export type LiveFlowStoreSlice = {
  gameState: GameState;
  eventPool: EventCard[];
  decisionHistory: DecisionRecord[];
  lastDecisionResult: DecisionResultSnapshot | null;
  lastDailyReport: DailyReport | null;
  dailyPriorityByDay: DailyPriorityByDay;
  dailyGoalsByDay: Record<number, DailyGoalState>;
  isDay1Tutorial?: boolean;
};

export type LiveFlowStoreSliceInput = LiveFlowStoreSlice;

export function buildLifecycleContextFromStore(
  slice: LiveFlowStoreSlice,
): EventLifecycleContext {
  return buildEventLifecycleContext({
    currentDay: slice.gameState.city.day,
    decisionHistory: slice.decisionHistory,
    solvedEventIds: slice.gameState.solvedEvents.map((e) => e.id),
    lastDecisionResult: slice.lastDecisionResult ?? undefined,
    isDay1Tutorial: slice.isDay1Tutorial,
  });
}

export function selectLiveFlowEntries(slice: LiveFlowStoreSlice): LiveFlowEntry[] {
  const currentDay = slice.gameState.city.day;
  const carryLines = buildCarryOverHubLines(
    selectCarryOverSignalsForDay({
      gameState: slice.gameState,
      dailyPriorityByDay: slice.dailyPriorityByDay,
      dailyGoalsByDay: slice.dailyGoalsByDay,
      lastDailyReport: slice.lastDailyReport,
    }),
  );

  return buildLiveFlowEntries({
    currentDay,
    activeEvents: slice.gameState.events,
    decisionHistory: slice.decisionHistory,
    lastDecisionResult: slice.lastDecisionResult ?? undefined,
    lastDailyReportDay: slice.lastDailyReport?.day ?? null,
    carryOverLine: carryLines[0]?.text ?? null,
    butterflyLine: buildButterflyFlowLine(
      slice.gameState.pilot.butterflyHookState,
      currentDay,
    ),
    isDay1Tutorial: slice.isDay1Tutorial,
  });
}

export function selectHubTodayFlowLines(slice: LiveFlowStoreSlice): LiveFlowEntry[] {
  if (slice.isDay1Tutorial && slice.gameState.city.day === 1) {
    return formatHubTodayFlowLines(selectLiveFlowEntries(slice));
  }
  return formatHubTodayFlowLines(selectLiveFlowEntries(slice));
}

export function selectHubPrimaryEventPresentation(slice: LiveFlowStoreSlice) {
  const ctx = buildLifecycleContextFromStore(slice);
  return selectHubPrimaryEvent({
    activeEvents: slice.gameState.events,
    eventPool: slice.eventPool,
    featuredEventId: slice.gameState.featuredEventId,
    ctx,
    decisionHistory: slice.decisionHistory,
  });
}

export function selectResolvedTodayCount(slice: LiveFlowStoreSlice): number {
  return buildResolvedTodayIdSet(slice.decisionHistory, slice.gameState.city.day)
    .size;
}

export function selectHubVisibleEventCount(slice: LiveFlowStoreSlice): number {
  const active = slice.gameState.events.length;
  const resolvedToday = selectResolvedTodayCount(slice);
  return active + (resolvedToday > 0 && active === 0 ? 1 : 0);
}

export function selectIsEventDecidable(
  eventId: string,
  slice: LiveFlowStoreSlice,
): boolean {
  const event =
    slice.gameState.events.find((e) => e.id === eventId) ??
    slice.eventPool.find((e) => e.id === eventId);
  if (!event) return false;
  const ctx = buildLifecycleContextFromStore(slice);
  const status = getEventLifecycleStatusForEvent(
    event,
    ctx,
    slice.decisionHistory,
  );
  return status === 'active' || status === 'follow_up';
}

export function buildLiveFlowStoreSliceFromGameStore(
  s: LiveFlowStoreSlice,
): LiveFlowStoreSlice {
  return s;
}
