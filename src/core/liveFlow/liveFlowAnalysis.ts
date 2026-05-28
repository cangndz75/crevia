import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

import {
  buildEventLifecycleContext,
  buildEventLifecycleMeta,
  buildResolvedTodayIdSet,
} from './eventLifecycleEngine';
import { buildLiveFlowEntries } from './liveFlowEngine';
import {
  countRawSemanticDuplicates,
  countVisibleEventDuplicates,
  selectHubVisibleFlowEntries,
} from './liveFlowPresentation';

export type LiveFlowDayMetrics = {
  resolvedTodayCount: number;
  resolvedVisibleInHub: number;
  solvedStillDecidable: number;
  flowEntriesCreated: number;
  /** Eski alan — görünür duplicate sayısı (WARN için). */
  duplicateFlowEntries: number;
  rawDuplicateEntries: number;
  visibleDuplicateEntries: number;
  archivedInActiveList: number;
};

export function analyzeLiveFlowForDay(input: {
  currentDay: number;
  activeEvents: EventCard[];
  decisionHistory: DecisionRecord[];
  solvedEventIds: string[];
  lastDecisionResult?: DecisionResultSnapshot | null;
  carryOverLine?: string | null;
  butterflyLine?: string | null;
  isDay1Tutorial?: boolean;
}): LiveFlowDayMetrics {
  const ctx = buildEventLifecycleContext({
    currentDay: input.currentDay,
    decisionHistory: input.decisionHistory,
    solvedEventIds: input.solvedEventIds,
    lastDecisionResult: input.lastDecisionResult,
  });

  const resolvedToday = buildResolvedTodayIdSet(
    input.decisionHistory,
    input.currentDay,
  );

  let solvedStillDecidable = 0;
  let archivedInActiveList = 0;

  for (const event of input.activeEvents) {
    const meta = buildEventLifecycleMeta(event, ctx, input.decisionHistory);
    if (meta.canDecide && resolvedToday.has(event.id)) {
      solvedStillDecidable += 1;
    }
    if (meta.status === 'archived') {
      archivedInActiveList += 1;
    }
  }

  const rawEntries = buildLiveFlowEntries({
    currentDay: input.currentDay,
    activeEvents: input.activeEvents,
    decisionHistory: input.decisionHistory,
    lastDecisionResult: input.lastDecisionResult,
    carryOverLine: input.carryOverLine,
    butterflyLine: input.butterflyLine,
    isDay1Tutorial: input.isDay1Tutorial,
  });

  const visibleEntries = selectHubVisibleFlowEntries(rawEntries);
  const rawDuplicateEntries = countRawSemanticDuplicates(rawEntries);
  const visibleDuplicateEntries = countVisibleEventDuplicates(visibleEntries);

  const resolvedVisibleInHub =
    input.activeEvents.length === 0 && resolvedToday.size > 0
      ? resolvedToday.size
      : 0;

  return {
    resolvedTodayCount: resolvedToday.size,
    resolvedVisibleInHub,
    solvedStillDecidable,
    flowEntriesCreated: rawEntries.length,
    duplicateFlowEntries: visibleDuplicateEntries,
    rawDuplicateEntries,
    visibleDuplicateEntries,
    archivedInActiveList,
  };
}
