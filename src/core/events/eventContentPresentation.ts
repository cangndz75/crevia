import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import { getDailyPriorityChoice } from '@/core/dailyPriority/dailyPriorityPresentation';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

import { getProfileForEventCard, mapEventToContentCategory } from './eventVariationEngine';
import type { EventContentDecisionBlueprint, EventPriorityRelation } from './eventContentTypes';

const RELATION_LABELS: Record<EventPriorityRelation, string> = {
  supports: 'Önceliği destekler',
  risks: 'Önceliği riske atar',
  indirect: 'Dolaylı katkı',
  resource_pressure: 'Kaynak baskısı',
  social_relief: 'Sosyal rahatlama',
  operational_gain: 'Operasyonel kazanım',
};

const CATEGORY_LABELS: Record<string, string> = {
  waste_container: 'Atık / konteyner',
  social_pressure: 'Sosyal baskı',
  vehicle_route: 'Rota / filo',
  personnel_morale: 'Personel',
  opportunity: 'Fırsat',
  permanent_solution: 'Kalıcı çözüm',
  citizen_complaint: 'Vatandaş şikayeti',
  maintenance: 'Bakım',
  market_vendor: 'Pazar / esnaf',
  noise: 'Gürültü',
  sidewalk_occupation: 'Kaldırım',
  butterfly: 'Kelebek etki',
};

export function getEventPriorityRelation(
  decision: EventDecision,
  dailyPriorityKey?: DailyPriorityKey,
  blueprint?: EventContentDecisionBlueprint,
): EventPriorityRelation {
  if (!dailyPriorityKey) {
    return 'indirect';
  }
  if (blueprint?.recommendedForPriority?.includes(dailyPriorityKey)) {
    if (
      dailyPriorityKey === 'resource_protection' &&
      (blueprint.intent === 'dispatch_team' || blueprint.intent === 'invest')
    ) {
      return 'resource_pressure';
    }
    if (dailyPriorityKey === 'public_relief' && blueprint.intent === 'communicate') {
      return 'social_relief';
    }
    if (dailyPriorityKey === 'operation_stability' && blueprint.intent === 'reroute') {
      return 'operational_gain';
    }
    return 'supports';
  }
  if (blueprint?.discouragedForPriority?.includes(dailyPriorityKey)) {
    return 'risks';
  }
  if (decision.contentStrategyLabel === 'Kaynak korur') {
    return dailyPriorityKey === 'resource_protection' ? 'supports' : 'indirect';
  }
  return 'indirect';
}

export function buildEventPriorityChip(
  relation: EventPriorityRelation,
): string {
  return RELATION_LABELS[relation];
}

export function buildDecisionPriorityHint(
  decision: EventDecision,
  dailyPriorityKey?: DailyPriorityKey,
): string | null {
  if (decision.contentPriorityHint) {
    return decision.contentPriorityHint;
  }
  if (!dailyPriorityKey) {
    return null;
  }
  const relation = getEventPriorityRelation(decision, dailyPriorityKey);
  if (relation === 'indirect') {
    return null;
  }
  return buildEventPriorityChip(relation);
}

export function buildEventCategoryChip(event: EventCard): string {
  const category = event.contentCategory ?? mapEventToContentCategory(event);
  return CATEGORY_LABELS[category] ?? 'Operasyon';
}

export function buildEventHeaderChips(
  event: EventCard,
  neighborhoodTagline?: string,
  dailyPriorityKey?: DailyPriorityKey,
): string[] {
  const chips: string[] = [];
  if (neighborhoodTagline) {
    chips.push(neighborhoodTagline);
  }
  chips.push(buildEventCategoryChip(event));
  if (dailyPriorityKey) {
    const choice = getDailyPriorityChoice(dailyPriorityKey);
    chips.push(choice.shortTitle);
  }
  return chips;
}

export function getDecisionStrategyLabel(decision: EventDecision): string | null {
  return decision.contentStrategyLabel ?? null;
}

export function getDecisionShortTradeoff(decision: EventDecision): string | null {
  return decision.contentShortTradeoff ?? null;
}

export function getEventCardPriorityRelation(
  event: EventCard,
  dailyPriorityKey?: DailyPriorityKey,
): EventPriorityRelation {
  if (!dailyPriorityKey) {
    return 'indirect';
  }
  const profile = getProfileForEventCard(event);
  if (profile?.preferredPriorityKeys?.includes(dailyPriorityKey)) {
    return 'supports';
  }
  const firstDecision = event.decisions[0];
  if (firstDecision) {
    return getEventPriorityRelation(firstDecision, dailyPriorityKey);
  }
  return 'indirect';
}

export function buildEventCardPriorityChip(
  event: EventCard,
  dailyPriorityKey?: DailyPriorityKey,
): string | null {
  const relation = getEventCardPriorityRelation(event, dailyPriorityKey);
  if (relation === 'indirect') {
    return null;
  }
  return buildEventPriorityChip(relation);
}
