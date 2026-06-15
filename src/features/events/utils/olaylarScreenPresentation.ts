import type { ImageSourcePropType } from 'react-native';

import { eventImages } from '@/core/assets/eventScreenAssets';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import { formatUrgencyLabel, getRiskLevelLabel } from '@/core/content/mockGameData';
import { getEventHeroImage } from '@/features/events/utils/eventAssets';
import {
  buildPremiumPreviewChips,
  deriveAffectedPopulation,
} from '@/features/events/utils/eventUiHelpers';
import type {
  OlaylarEventStats,
  OlaylarFilterKey,
  OlaylarPriorityEventView,
  OlaylarResolvedEventView,
} from '@/features/events/types/olaylarScreenTypes';
import {
  computeDaySummary,
  filterPendingEvents,
  pickPriorityEvent,
  shouldShowPriorityEvent,
  type EventScreenFilterKey,
} from '@/features/events/utils/eventsScreenModel';

const MOCK_RESOLVED: OlaylarResolvedEventView[] = [
  {
    id: 'mock-resolved-1',
    title: 'Parklarda Güvenlik Sorunu',
    location: 'Atatürk Mahallesi',
    resolvedAgo: '12 saat önce çözüldü',
    riskLabel: 'Düşük Risk',
    image: eventImages.resolvedParkSecurity,
  },
  {
    id: 'mock-resolved-2',
    title: 'Su Borusu Sızıntısı',
    location: 'İnönü Caddesi',
    resolvedAgo: '1 gün önce çözüldü',
    riskLabel: 'Düşük Risk',
    image: eventImages.resolvedWaterLeak,
  },
];

export function toOlaylarFilterKey(key: OlaylarFilterKey): EventScreenFilterKey {
  if (key === 'active') return 'all';
  return key;
}

export function buildOlaylarStats(
  activeEvents: EventCard[],
  decisionHistory: DecisionRecord[],
): OlaylarEventStats {
  const summary = computeDaySummary(activeEvents, decisionHistory);
  return {
    critical: summary.find((s) => s.key === 'critical')?.count ?? 0,
    urgent: summary.find((s) => s.key === 'urgent')?.count ?? 0,
    active: summary.find((s) => s.key === 'active')?.count ?? 0,
    resolved: summary.find((s) => s.key === 'resolved')?.count ?? 0,
  };
}

function findRiskDelta(event: EventCard): string {
  const chips = buildPremiumPreviewChips(event.previewEffects, 3, event);
  const risk = chips.find((c) => c.tone === 'risk' || c.label.toLowerCase().includes('risk'));
  if (risk) return risk.friendlyLabel;
  if (event.riskLevel === 'high' || event.riskLevel === 'critical') return '+10 Risk';
  return '+6 Risk';
}

function findXpDelta(event: EventCard): string {
  const chips = buildPremiumPreviewChips(event.previewEffects, 3, event);
  const xp = chips.find((c) => c.tone === 'xp' || c.label.toLowerCase().includes('deneyim'));
  if (xp) return xp.friendlyLabel;
  return '+14 Deneyim';
}

export function buildPriorityEventView(
  event: EventCard | null,
): OlaylarPriorityEventView | null {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    district: event.district,
    description: event.description,
    timeLeft: formatUrgencyLabel(event.urgencyHours),
    affected: deriveAffectedPopulation(event),
    riskLabel: getRiskLevelLabel(event.riskLevel),
    riskDelta: findRiskDelta(event),
    xpDelta: findXpDelta(event),
    image: getEventHeroImage(event.id, event.category, event) as ImageSourcePropType,
  };
}

function resolvedImageForRecord(record: DecisionRecord, index: number): ImageSourcePropType {
  const haystack = `${record.eventTitle} ${record.eventId ?? ''}`.toLowerCase();
  if (haystack.includes('park') || haystack.includes('güvenlik') || haystack.includes('guvenlik')) {
    return eventImages.resolvedParkSecurity;
  }
  if (haystack.includes('su') || haystack.includes('sız') || haystack.includes('siz')) {
    return eventImages.resolvedWaterLeak;
  }
  if (haystack.includes('sokak') || haystack.includes('aydın') || haystack.includes('aydin')) {
    return eventImages.resolvedStreetLight;
  }
  return index === 0 ? eventImages.resolvedParkSecurity : eventImages.resolvedWaterLeak;
}

function formatResolvedAgo(record: DecisionRecord, index: number): string {
  if (record.createdAt) {
    const created = new Date(record.createdAt).getTime();
    const hours = Math.max(1, Math.round((Date.now() - created) / 3_600_000));
    if (hours < 24) return `${hours} saat önce çözüldü`;
    const days = Math.max(1, Math.round(hours / 24));
    return `${days} gün önce çözüldü`;
  }
  return index === 0 ? '12 saat önce çözüldü' : '1 gün önce çözüldü';
}

export function buildResolvedEventViews(
  records: DecisionRecord[],
  useMockWhenEmpty = true,
): OlaylarResolvedEventView[] {
  if (records.length === 0 && useMockWhenEmpty) {
    return MOCK_RESOLVED;
  }
  return [...records]
    .reverse()
    .slice(0, 2)
    .map((record, index) => ({
      id: record.id,
      title: record.eventTitle,
      location: record.neighborhoodName ?? record.neighborhoodId ?? 'Pilot Bölge',
      resolvedAgo: formatResolvedAgo(record, index),
      riskLabel: 'Düşük Risk',
      image: resolvedImageForRecord(record, index),
    }));
}

export function getMapHeroSource(): number {
  return eventImages.cityMapHero;
}

export function resolveOlaylarPriority(
  activeEvents: EventCard[],
  featuredEventId: string | null,
  filter: OlaylarFilterKey,
) {
  const priorityEvent = pickPriorityEvent(activeEvents, featuredEventId);
  const mappedFilter = toOlaylarFilterKey(filter);
  const showPriority =
    shouldShowPriorityEvent(priorityEvent, mappedFilter) && priorityEvent != null;
  const pendingEvents = filterPendingEvents(
    activeEvents,
    priorityEvent?.id ?? null,
    mappedFilter,
  );
  return { priorityEvent, showPriority, pendingEvents };
}
