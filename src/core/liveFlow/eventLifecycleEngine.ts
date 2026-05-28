import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

import type {
  EventLifecycleContext,
  EventLifecycleMeta,
  EventLifecycleStatus,
  EventLifecycleTone,
} from './liveFlowTypes';

export function buildResolvedTodayIdSet(
  decisionHistory: DecisionRecord[],
  currentDay: number,
): Set<string> {
  const ids = new Set<string>();
  for (const record of decisionHistory) {
    if (record.day === currentDay) {
      ids.add(record.eventId);
    }
  }
  return ids;
}

export function buildResolvedAllIdSet(
  decisionHistory: DecisionRecord[],
  solvedEventIds: string[],
): Set<string> {
  const ids = new Set<string>(solvedEventIds);
  for (const record of decisionHistory) {
    ids.add(record.eventId);
  }
  return ids;
}

export function getDecisionRecordForEvent(
  eventId: string,
  decisionHistory: DecisionRecord[],
): DecisionRecord | undefined {
  return [...decisionHistory].reverse().find((r) => r.eventId === eventId);
}

export function isEventResolvedToday(
  eventId: string,
  currentDay: number,
  decisionHistory: DecisionRecord[],
): boolean {
  return decisionHistory.some(
    (r) => r.eventId === eventId && r.day === currentDay,
  );
}

export function isEventArchived(
  eventId: string,
  currentDay: number,
  decisionHistory: DecisionRecord[],
): boolean {
  const record = getDecisionRecordForEvent(eventId, decisionHistory);
  if (!record) return false;
  return record.day < currentDay;
}

export function isEventFollowUp(event: EventCard): boolean {
  return Boolean(event.butterflyMeta?.hookId);
}

export function isEventWatchingSignal(event: EventCard): boolean {
  return Boolean(event.carryOverMeta?.signalId) && !event.butterflyMeta;
}

export function buildEventLifecycleContext(input: {
  currentDay: number;
  decisionHistory: DecisionRecord[];
  solvedEventIds: string[];
  lastDecisionResult?: DecisionResultSnapshot | null;
  isDay1Tutorial?: boolean;
}): EventLifecycleContext {
  return {
    currentDay: input.currentDay,
    resolvedTodayIds: buildResolvedTodayIdSet(
      input.decisionHistory,
      input.currentDay,
    ),
    resolvedAllIds: buildResolvedAllIdSet(
      input.decisionHistory,
      input.solvedEventIds,
    ),
    decisionRecordsToday: input.decisionHistory.filter(
      (r) => r.day === input.currentDay,
    ),
    lastDecisionResult: input.lastDecisionResult,
    isDay1Tutorial: input.isDay1Tutorial,
  };
}

export function getEventLifecycleStatus(
  event: EventCard,
  ctx: EventLifecycleContext,
  decisionHistory: DecisionRecord[],
): EventLifecycleStatus {
  return getEventLifecycleStatusForEvent(event, ctx, decisionHistory);
}

export function getEventLifecycleStatusForEvent(
  event: EventCard,
  ctx: EventLifecycleContext,
  decisionHistory: DecisionRecord[],
): EventLifecycleStatus {
  if (ctx.resolvedTodayIds.has(event.id)) {
    return 'resolved_today';
  }

  const record = getDecisionRecordForEvent(event.id, decisionHistory);
  if (record && record.day < ctx.currentDay) {
    return 'archived';
  }

  if (ctx.resolvedAllIds.has(event.id) && record && record.day < ctx.currentDay) {
    return 'archived';
  }

  if (isEventFollowUp(event) && !ctx.resolvedTodayIds.has(event.id)) {
    return 'follow_up';
  }

  if (isEventWatchingSignal(event) && !ctx.resolvedTodayIds.has(event.id)) {
    return 'watching';
  }

  return 'active';
}

function resolveSummaryText(
  event: EventCard,
  ctx: EventLifecycleContext,
  record?: DecisionRecord,
): string | undefined {
  if (
    ctx.lastDecisionResult?.eventId === event.id &&
    ctx.lastDecisionResult.summaryText
  ) {
    return ctx.lastDecisionResult.summaryText;
  }
  if (record) {
    return `${record.decisionLabel} kararı uygulandı. Etki gün sonu raporuna yansıyacak.`;
  }
  return 'Olay bugün çözüldü. Etkisi gün sonu raporuna yansıyacak.';
}

export function buildEventLifecycleMeta(
  event: EventCard,
  ctx: EventLifecycleContext,
  decisionHistory: DecisionRecord[],
): EventLifecycleMeta {
  const status = getEventLifecycleStatusForEvent(event, ctx, decisionHistory);
  const record = getDecisionRecordForEvent(event.id, decisionHistory);

  switch (status) {
    case 'resolved_today': {
      const hasReport =
        ctx.lastDecisionResult?.eventId === event.id ||
        Boolean(record);
      return {
        status,
        label: 'Sonuçlandı',
        tone: 'positive',
        canOpen: true,
        canDecide: false,
        ctaLabel: hasReport ? 'Sonucu Gör' : 'Raporu Bekliyor',
        summaryText: resolveSummaryText(event, ctx, record),
      };
    }
    case 'follow_up':
      return {
        status,
        label: event.butterflyMeta?.label ?? 'Karar Yankısı',
        tone: 'info',
        canOpen: true,
        canDecide: !ctx.resolvedTodayIds.has(event.id),
        ctaLabel: ctx.resolvedTodayIds.has(event.id) ? undefined : 'Karar Ver',
        summaryText: event.description,
      };
    case 'watching':
      return {
        status,
        label: 'Takipte',
        tone: 'neutral',
        canOpen: true,
        canDecide: false,
        ctaLabel: 'Takipte',
        summaryText: event.carryOverMeta?.label ?? event.contextTag,
      };
    case 'archived':
      return {
        status,
        label: 'Arşivlendi',
        tone: 'neutral',
        canOpen: false,
        canDecide: false,
        summaryText: 'Bu olay önceki günden arşivlendi.',
      };
    case 'expired':
      return {
        status,
        label: 'Kaçtı',
        tone: 'warning',
        canOpen: false,
        canDecide: false,
      };
    case 'active':
    default:
      return {
        status: 'active',
        label: 'Aktif',
        tone: 'warning',
        canOpen: true,
        canDecide: true,
        ctaLabel: 'Karar Ver',
      };
  }
}

export function resolveEventCardById(
  eventId: string,
  activeEvents: EventCard[],
  eventPool: EventCard[],
): EventCard | undefined {
  return (
    activeEvents.find((e) => e.id === eventId) ??
    eventPool.find((e) => e.id === eventId)
  );
}

export function selectHubPrimaryEvent(input: {
  activeEvents: EventCard[];
  eventPool: EventCard[];
  featuredEventId?: string | null;
  ctx: EventLifecycleContext;
  decisionHistory: DecisionRecord[];
}): { event: EventCard; lifecycle: EventLifecycleMeta } | null {
  const { activeEvents, eventPool, featuredEventId, ctx, decisionHistory } =
    input;

  const unresolved = activeEvents.filter(
    (e) =>
      getEventLifecycleStatusForEvent(e, ctx, decisionHistory) === 'active' ||
      getEventLifecycleStatusForEvent(e, ctx, decisionHistory) === 'follow_up',
  );

  const featuredUnresolved = featuredEventId
    ? unresolved.find((e) => e.id === featuredEventId)
    : undefined;
  if (featuredUnresolved) {
    return {
      event: featuredUnresolved,
      lifecycle: buildEventLifecycleMeta(
        featuredUnresolved,
        ctx,
        decisionHistory,
      ),
    };
  }

  if (unresolved.length > 0) {
    const top = unresolved[0]!;
    return {
      event: top,
      lifecycle: buildEventLifecycleMeta(top, ctx, decisionHistory),
    };
  }

  const todayRecords = [...ctx.decisionRecordsToday].reverse();
  for (const record of todayRecords) {
    const card = resolveEventCardById(record.eventId, activeEvents, eventPool);
    if (!card) continue;
    const lifecycle = buildEventLifecycleMeta(card, ctx, decisionHistory);
    if (lifecycle.status === 'resolved_today') {
      return { event: card, lifecycle };
    }
  }

  const followUp = activeEvents.find(
    (e) => getEventLifecycleStatusForEvent(e, ctx, decisionHistory) === 'follow_up',
  );
  if (followUp) {
    return {
      event: followUp,
      lifecycle: buildEventLifecycleMeta(followUp, ctx, decisionHistory),
    };
  }

  return null;
}
