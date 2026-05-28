import type { EventCard, EventDecision } from '@/core/models/EventCard';

import {
  NEIGHBORHOOD_PATROL_INSIGHT_BONUS,
  NEIGHBORHOOD_PATROL_RISK_VISIBILITY_BONUS,
} from './hubQuickActionConstants';
import type {
  NeighborhoodPatrolAssignment,
  NeighborhoodPatrolSignal,
} from './hubQuickActionTypes';

export type NeighborhoodPatrolModifier = {
  applies: boolean;
  insightBonus: number;
  riskVisibilityBonus: number;
  line?: string;
  signal?: NeighborhoodPatrolSignal;
};

function normalizeToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase();
}

function neighborhoodsMatch(
  eventNeighborhoodId: string | undefined,
  eventDistrict: string | undefined,
  targetNeighborhoodId: string,
): boolean {
  const target = normalizeToken(targetNeighborhoodId);
  if (!target) return false;
  const eventId = normalizeToken(eventNeighborhoodId);
  if (eventId && eventId === target) return true;
  const district = normalizeToken(eventDistrict);
  if (district && district === target) return true;
  return false;
}

export function resolveNeighborhoodPatrolModifier(params: {
  neighborhoodPatrol?: NeighborhoodPatrolAssignment;
  currentDay: number;
  event: EventCard;
  decision?: EventDecision;
}): NeighborhoodPatrolModifier {
  const none: NeighborhoodPatrolModifier = {
    applies: false,
    insightBonus: 0,
    riskVisibilityBonus: 0,
  };

  const { neighborhoodPatrol, currentDay, event } = params;
  if (!neighborhoodPatrol || neighborhoodPatrol.day !== currentDay) {
    return none;
  }

  const match = neighborhoodsMatch(
    event.neighborhoodId,
    event.district,
    neighborhoodPatrol.targetNeighborhoodId,
  );
  if (!match) {
    return none;
  }

  const neighborhood = neighborhoodPatrol.targetNeighborhoodLabel;
  return {
    applies: true,
    insightBonus: NEIGHBORHOOD_PATROL_INSIGHT_BONUS,
    riskVisibilityBonus: NEIGHBORHOOD_PATROL_RISK_VISIBILITY_BONUS,
    line: `Mahalle turu: ${neighborhood}’de saha sinyali netleşti.`,
    signal: neighborhoodPatrol.revealedSignal,
  };
}
