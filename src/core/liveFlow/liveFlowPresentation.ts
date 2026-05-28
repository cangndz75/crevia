import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

import type { EventLifecycleMeta, EventLifecycleTone, LiveFlowEntry, LiveFlowEntryType } from './liveFlowTypes';

export const HUB_TODAY_FLOW_MAX_LINES = 3;

const COMBINED_TEXT_MAX = 120;

const HUB_CATEGORY_PRIORITY: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 10,
};

function truncateText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function mapResultTone(
  tone: DecisionResultSnapshot['resultTone'] | undefined,
): EventLifecycleTone {
  if (tone === 'positive') return 'positive';
  if (tone === 'mixed' || tone === 'negative') return 'warning';
  if (tone === 'neutral') return 'neutral';
  return 'info';
}

export function buildCombinedDecisionResolvedEntry(input: {
  record: DecisionRecord;
  result?: DecisionResultSnapshot | null;
  timestampOrder: number;
}): LiveFlowEntry {
  const { record, result, timestampOrder } = input;
  const matchingResult =
    result && result.eventId === record.eventId && result.day === record.day
      ? result
      : null;
  const summary = matchingResult?.summaryText?.trim();
  const text = summary
    ? truncateText(`Karar uygulandı: ${summary}`, COMBINED_TEXT_MAX)
    : 'Karar uygulandı, olay gün sonu raporuna aktarılacak.';

  return {
    id: `flow-d${record.day}-combined-${record.eventId}`,
    day: record.day,
    timestampOrder,
    type: 'decision_resolved',
    title: 'Olay sonuçlandı',
    text,
    tone: matchingResult ? mapResultTone(matchingResult.resultTone) : 'info',
    relatedEventId: record.eventId,
    relatedNeighborhoodId: record.neighborhoodId,
    iconName: 'checkmark-done-outline',
    mergedFrom: ['decision_applied', 'event_resolved'],
  };
}

function hubCategoryForEntry(entry: LiveFlowEntry): number {
  if (
    entry.type === 'decision_resolved' ||
    entry.type === 'event_resolved' ||
    entry.type === 'decision_applied'
  ) {
    return 1;
  }
  if (entry.type === 'event_created' || entry.type === 'follow_up_created') {
    return 2;
  }
  if (entry.type === 'carry_over_signal' || entry.type === 'butterfly_echo') {
    return 3;
  }
  if (entry.type === 'report_ready') {
    return 4;
  }
  return 5;
}

function entryHubScore(entry: LiveFlowEntry): number {
  return HUB_CATEGORY_PRIORITY[hubCategoryForEntry(entry)] ?? 0;
}

/** Aynı event için decision_applied + event_resolved çiftlerini tek satıra indirger. */
export function collapseDecisionResolvedPairs(entries: LiveFlowEntry[]): LiveFlowEntry[] {
  const standalone: LiveFlowEntry[] = [];
  const byEvent = new Map<
    string,
    {
      applied?: LiveFlowEntry;
      resolved: LiveFlowEntry[];
      other: LiveFlowEntry[];
    }
  >();

  for (const entry of entries) {
    if (!entry.relatedEventId) {
      standalone.push(entry);
      continue;
    }
    const bucket = byEvent.get(entry.relatedEventId) ?? {
      resolved: [],
      other: [],
    };
    if (entry.type === 'decision_applied') {
      bucket.applied = entry;
    } else if (entry.type === 'event_resolved') {
      bucket.resolved.push(entry);
    } else if (entry.type !== 'decision_resolved') {
      bucket.other.push(entry);
    } else {
      bucket.other.push(entry);
    }
    byEvent.set(entry.relatedEventId, bucket);
  }

  const merged: LiveFlowEntry[] = [...standalone];

  for (const [eventId, bucket] of byEvent) {
    const existingCombined = bucket.other.find((e) => e.type === 'decision_resolved');
    if (existingCombined) {
      merged.push(existingCombined, ...bucket.other.filter((e) => e !== existingCombined));
      continue;
    }

    if (bucket.applied && bucket.resolved.length > 0) {
      const applied = bucket.applied;
      const resolved = bucket.resolved.sort(
        (a, b) => b.timestampOrder - a.timestampOrder,
      )[0]!;
      const summary =
        resolved.text.trim() &&
        !resolved.text.includes('bugün sonuçlandı')
          ? resolved.text.trim()
          : null;
      merged.push({
        id: `flow-d${applied.day}-combined-${eventId}`,
        day: applied.day,
        timestampOrder: Math.max(applied.timestampOrder, resolved.timestampOrder),
        type: 'decision_resolved',
        title: 'Olay sonuçlandı',
        text: summary
          ? truncateText(`Karar uygulandı: ${summary}`, COMBINED_TEXT_MAX)
          : applied.text.includes('kararı uygulandı')
            ? 'Karar uygulandı, olay gün sonu raporuna aktarılacak.'
            : truncateText(applied.text, COMBINED_TEXT_MAX),
        tone: resolved.tone,
        relatedEventId: eventId,
        relatedNeighborhoodId:
          applied.relatedNeighborhoodId ?? resolved.relatedNeighborhoodId,
        iconName: 'checkmark-done-outline',
        mergedFrom: ['decision_applied', 'event_resolved'],
      });
      merged.push(...bucket.other);
      continue;
    }

    if (bucket.applied) merged.push(bucket.applied);
    merged.push(...bucket.resolved, ...bucket.other);
  }

  return merged.sort((a, b) => a.timestampOrder - b.timestampOrder);
}

/** Hub’da gösterilecek en fazla 3 satır; aynı eventId tekrar etmez. */
export function selectHubVisibleFlowEntries(entries: LiveFlowEntry[]): LiveFlowEntry[] {
  const collapsed = collapseDecisionResolvedPairs(entries);
  const sorted = [...collapsed].sort((a, b) => {
    const scoreDiff = entryHubScore(b) - entryHubScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return b.timestampOrder - a.timestampOrder;
  });

  const visible: LiveFlowEntry[] = [];
  const seenEventIds = new Set<string>();
  const seenGlobalKeys = new Set<string>();

  for (const entry of sorted) {
    if (entry.relatedEventId) {
      if (seenEventIds.has(entry.relatedEventId)) continue;
      seenEventIds.add(entry.relatedEventId);
    } else {
      const globalKey = `${entry.type}:${entry.text}`;
      if (seenGlobalKeys.has(globalKey)) continue;
      seenGlobalKeys.add(globalKey);
    }
    visible.push(entry);
    if (visible.length >= HUB_TODAY_FLOW_MAX_LINES) break;
  }

  return visible.sort((a, b) => b.timestampOrder - a.timestampOrder);
}

export function countRawSemanticDuplicates(entries: LiveFlowEntry[]): number {
  const byEvent = new Map<string, Set<LiveFlowEntryType>>();
  let count = 0;

  for (const entry of entries) {
    if (!entry.relatedEventId) continue;
    const types = byEvent.get(entry.relatedEventId) ?? new Set();
    if (entry.type === 'decision_applied' && types.has('event_resolved')) {
      count += 1;
    }
    if (entry.type === 'event_resolved' && types.has('decision_applied')) {
      count += 1;
    }
    types.add(entry.type);
    byEvent.set(entry.relatedEventId, types);
  }

  return count;
}

export function countVisibleEventDuplicates(entries: LiveFlowEntry[]): number {
  const seen = new Set<string>();
  let count = 0;
  for (const entry of entries) {
    if (!entry.relatedEventId) continue;
    if (seen.has(entry.relatedEventId)) count += 1;
    seen.add(entry.relatedEventId);
  }
  return count;
}

export function getLifecycleToneColors(tone: EventLifecycleTone): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  switch (tone) {
    case 'positive':
      return {
        bg: '#E8F7EF',
        border: '#B8E4DC',
        text: '#0B6B61',
        dot: '#1A8F7A',
      };
    case 'warning':
      return {
        bg: '#FFF6E8',
        border: '#F5D9A8',
        text: '#8A5A12',
        dot: '#C98A12',
      };
    case 'info':
      return {
        bg: '#EEF4FC',
        border: '#C5D9F0',
        text: '#1D4E89',
        dot: '#3B82C4',
      };
    default:
      return {
        bg: '#F5F3EF',
        border: '#E5E1D8',
        text: '#4A4740',
        dot: '#8A8578',
      };
  }
}

export function getResolvedCardColors(tone: EventLifecycleTone): {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
} {
  if (tone === 'positive') {
    return {
      border: '#B8E4DC',
      bg: '#F4FBF8',
      badgeBg: '#DDF4E8',
      badgeText: '#0B6B61',
    };
  }
  return {
    border: colorsFallback.infoBorder,
    bg: '#F8FAFC',
    badgeBg: '#EEF4FC',
    badgeText: '#1D4E89',
  };
}

const colorsFallback = {
  infoBorder: '#C5D9F0',
};

export function formatHubTodayFlowLines(
  entries: LiveFlowEntry[],
): LiveFlowEntry[] {
  return selectHubVisibleFlowEntries(entries);
}

export function getLifecycleChipStyle(lifecycle: EventLifecycleMeta): {
  label: string;
  tone: EventLifecycleTone;
} {
  return {
    label: lifecycle.label,
    tone: lifecycle.tone,
  };
}
