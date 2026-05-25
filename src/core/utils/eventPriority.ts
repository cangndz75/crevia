import type { EventCard, EventRiskLevel } from '@/core/models/EventCard';

export const EVENT_SEVERITY: Record<EventRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** 1–5 görünürlük skoru (Gün 1 türetilmiş). */
export function eventVisibility(event: EventCard): number {
  if (event.filterTags?.includes('urgent') || event.filterTags?.includes('crisis')) {
    return 5;
  }
  if (event.riskLevel === 'critical' || event.riskLevel === 'high') return 4;
  if (event.riskLevel === 'medium') return 3;
  return 2;
}

/** 1–5 tekrar riski (Gün 1 türetilmiş). */
export function eventRecurrenceRisk(event: EventCard): number {
  if (event.delayHint) return 4;
  if (event.riskLevel === 'high' || event.riskLevel === 'critical') return 3;
  if (event.urgencyHours <= 4) return 4;
  return 2;
}

export function eventSeverity(event: EventCard): number {
  return EVENT_SEVERITY[event.riskLevel];
}
