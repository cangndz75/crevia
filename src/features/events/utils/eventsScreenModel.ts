import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard, EventRiskLevel } from '@/core/models/EventCard';
import { deriveRiskFocusLine } from '@/features/events/utils/eventUiHelpers';

export type EventScreenFilterKey =
  | 'all'
  | 'critical'
  | 'urgent'
  | 'opportunity'
  | 'resolved';

export type DaySummaryStat = {
  key: 'critical' | 'urgent' | 'active' | 'resolved';
  label: string;
  count: number;
  icon: string;
};

export type DistrictContext = {
  districtId?: string;
  districtName: string;
  riskLevel: EventRiskLevel;
  activeEventCount: number;
  riskFocusLine: string;
};

export type EventScreenFilterOption = {
  key: EventScreenFilterKey;
  label: string;
  icon: string;
};

const FILTER_OPTIONS: EventScreenFilterOption[] = [
  { key: 'all', label: 'Tümü', icon: 'grid-outline' },
  { key: 'critical', label: 'Kritik', icon: 'shield' },
  { key: 'urgent', label: 'Acil', icon: 'notifications' },
  { key: 'opportunity', label: 'Fırsat', icon: 'star' },
  { key: 'resolved', label: 'Çözüldü', icon: 'checkmark-circle' },
];

export function getEventScreenFilters() {
  return FILTER_OPTIONS;
}

function isCriticalEvent(event: EventCard): boolean {
  return (
    event.riskLevel === 'critical' ||
    event.riskLevel === 'high' ||
    event.filterTags?.includes('crisis') === true
  );
}

function isUrgentEvent(event: EventCard): boolean {
  return (
    event.urgencyHours <= 6 || event.filterTags?.includes('urgent') === true
  );
}

function isOpportunityEvent(event: EventCard): boolean {
  return event.filterTags?.includes('opportunity') === true;
}

export function computeDaySummary(
  activeEvents: EventCard[],
  resolvedToday: DecisionRecord[],
): DaySummaryStat[] {
  const critical = activeEvents.filter(isCriticalEvent).length;
  const urgent = activeEvents.filter(isUrgentEvent).length;

  return [
    {
      key: 'critical',
      label: 'Kritik',
      count: critical,
      icon: 'flame-outline',
    },
    {
      key: 'urgent',
      label: 'Acil',
      count: urgent,
      icon: 'alert-circle-outline',
    },
    {
      key: 'active',
      label: 'Aktif',
      count: activeEvents.length,
      icon: 'flash-outline',
    },
    {
      key: 'resolved',
      label: 'Çözüldü',
      count: resolvedToday.length,
      icon: 'checkmark-circle-outline',
    },
  ];
}

export function pickPriorityEvent(
  events: EventCard[],
  featuredEventId: string | null,
): EventCard | null {
  if (events.length === 0) return null;

  if (featuredEventId) {
    const featured = events.find((e) => e.id === featuredEventId);
    if (featured) return featured;
  }

  const scored = [...events].sort((a, b) => {
    const score = (e: EventCard) => {
      let s = 0;
      if (e.riskLevel === 'critical') s += 100;
      else if (e.riskLevel === 'high') s += 80;
      else if (e.riskLevel === 'medium') s += 40;
      s += Math.max(0, 24 - e.urgencyHours) * 2;
      s += (e.priority ?? 0) * 5;
      return s;
    };
    return score(b) - score(a);
  });

  return scored[0] ?? null;
}

export function buildDistrictContext(
  priorityEvent: EventCard | null,
  activeEvents: EventCard[],
): DistrictContext {
  const source = priorityEvent ?? activeEvents[0];
  if (!source) {
    return {
      districtName: 'Pilot Bölge',
      riskLevel: 'medium',
      activeEventCount: 0,
      riskFocusLine: 'Operasyon normal',
    };
  }

  const sameDistrict = activeEvents.filter(
    (e) => e.district === source.district,
  );

  return {
    districtId: source.neighborhoodId ?? source.districtIds?.[0],
    districtName: source.district,
    riskLevel: source.riskLevel,
    activeEventCount: sameDistrict.length,
    riskFocusLine: deriveRiskFocusLine(source),
  };
}

export function matchesEventScreenFilter(
  event: EventCard,
  filter: EventScreenFilterKey,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'critical') return isCriticalEvent(event);
  if (filter === 'urgent') return isUrgentEvent(event);
  if (filter === 'opportunity') return isOpportunityEvent(event);
  return false;
}

export function filterPendingEvents(
  events: EventCard[],
  priorityId: string | null,
  filter: EventScreenFilterKey,
): EventCard[] {
  const pending = events.filter((e) => e.id !== priorityId);
  if (filter === 'resolved' || filter === 'opportunity') {
    return filter === 'opportunity'
      ? pending.filter(isOpportunityEvent)
      : [];
  }
  if (filter === 'all') return pending;
  return pending.filter((e) => matchesEventScreenFilter(e, filter));
}

export function shouldShowPriorityEvent(
  event: EventCard | null,
  filter: EventScreenFilterKey,
): boolean {
  if (!event) return false;
  if (filter === 'resolved') return false;
  if (filter === 'all') return true;
  return matchesEventScreenFilter(event, filter);
}
