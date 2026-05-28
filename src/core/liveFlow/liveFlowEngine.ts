import { activeDueButterflyHooksForDay } from '@/core/carryOver/carryOverEngine';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import { buildCombinedDecisionResolvedEntry } from './liveFlowPresentation';
import type { LiveFlowBuildInput, LiveFlowEntry } from './liveFlowTypes';

const MAX_INTERNAL_ENTRIES = 8;

function entryKey(entry: LiveFlowEntry): string {
  return `${entry.type}:${entry.relatedEventId ?? ''}:${entry.text}`;
}

function pushEntry(
  entries: LiveFlowEntry[],
  seen: Set<string>,
  entry: Omit<LiveFlowEntry, 'timestampOrder'> & { timestampOrder?: number },
  order: { value: number },
): void {
  const key = entryKey(entry as LiveFlowEntry);
  if (seen.has(key)) return;
  seen.add(key);
  if (!entry.text?.trim()) return;
  entries.push({
    ...entry,
    timestampOrder: entry.timestampOrder ?? order.value++,
  } as LiveFlowEntry);
}

export function buildLiveFlowEntries(input: LiveFlowBuildInput): LiveFlowEntry[] {
  const entries: LiveFlowEntry[] = [];
  const seen = new Set<string>();
  const order = { value: 1 };
  const { currentDay, decisionHistory, isDay1Tutorial } = input;

  if (isDay1Tutorial && currentDay === 1) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-tutorial`,
        day: currentDay,
        type: 'priority_progress',
        title: 'Öğretici gün',
        text: 'İlk operasyon günü — öncelikli olayı incele ve karar ver.',
        tone: 'info',
        iconName: 'school-outline',
      },
      order,
    );
    return entries;
  }

  for (const event of input.activeEvents.slice(0, 2)) {
    const nh = normalizeNeighborhoodId(event.neighborhoodId ?? event.district);
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-created-${event.id}`,
        day: currentDay,
        type: 'event_created',
        title: event.title,
        text: `${event.district} bölgesinde yeni operasyon sinyali: ${event.title}.`,
        tone: 'warning',
        relatedEventId: event.id,
        relatedNeighborhoodId: nh ?? undefined,
        iconName: 'alert-circle-outline',
      },
      order,
    );
  }

  const todayDecisions = decisionHistory.filter((r) => r.day === currentDay);
  const combinedEventIds = new Set<string>();

  for (const record of todayDecisions) {
    const combined = buildCombinedDecisionResolvedEntry({
      record,
      result: input.lastDecisionResult,
      timestampOrder: order.value,
    });
    combinedEventIds.add(record.eventId);
    pushEntry(entries, seen, combined, order);
  }

  const result = input.lastDecisionResult;
  if (
    result &&
    result.day === currentDay &&
    result.summaryText?.trim() &&
    !combinedEventIds.has(result.eventId)
  ) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-result-${result.eventId}`,
        day: currentDay,
        type: 'event_resolved',
        title: result.eventTitle,
        text: result.summaryText.trim(),
        tone:
          result.resultTone === 'positive'
            ? 'positive'
            : result.resultTone === 'negative'
              ? 'warning'
              : 'neutral',
        relatedEventId: result.eventId,
        iconName: 'pulse-outline',
      },
      order,
    );
  }

  if (input.carryOverLine) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-carryover`,
        day: currentDay,
        type: 'carry_over_signal',
        title: 'Dünden kalan',
        text: input.carryOverLine,
        tone: 'neutral',
        iconName: 'time-outline',
      },
      order,
    );
  }

  if (input.butterflyLine) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-butterfly`,
        day: currentDay,
        type: 'butterfly_echo',
        title: 'Karar yankısı',
        text: input.butterflyLine,
        tone: 'info',
        iconName: 'git-branch-outline',
      },
      order,
    );
  }

  if (
    input.lastDailyReportDay != null &&
    input.lastDailyReportDay === currentDay
  ) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-report`,
        day: currentDay,
        type: 'report_ready',
        title: 'Gün sonu raporu',
        text: 'Gün sonu raporu hazır.',
        tone: 'positive',
        iconName: 'document-text-outline',
      },
      order,
    );
  }

  if (entries.length === 0) {
    pushEntry(
      entries,
      seen,
      {
        id: `flow-d${currentDay}-calm`,
        day: currentDay,
        type: 'priority_progress',
        title: 'Operasyon',
        text: 'Bugün sakin başladı. Öncelikli olayları takip et.',
        tone: 'neutral',
        iconName: 'sunny-outline',
      },
      order,
    );
  }

  return entries
    .sort((a, b) => a.timestampOrder - b.timestampOrder)
    .slice(-MAX_INTERNAL_ENTRIES);
}

export function buildButterflyFlowLine(
  hookState: Parameters<typeof activeDueButterflyHooksForDay>[0],
  day: number,
): string | null {
  const hooks = activeDueButterflyHooksForDay(hookState, day);
  const due = hooks.find((h) => h.dueDay === day);
  if (!due) return null;
  return due.reportLine ?? `${due.title} takipte.`;
}
