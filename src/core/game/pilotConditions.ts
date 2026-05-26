import type { EventCondition } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { GameState } from '@/core/models/GameState';
import type { PilotGameState } from '@/core/models/PilotGameState';

export type PilotEventSelectionContext = {
  gameState: GameState;
  selectedDistrictId: PilotDistrictId;
  pilot: PilotGameState;
  currentDay: number;
  flags: Record<string, string | number | boolean>;
};

const METRIC_ALIASES: Record<string, keyof GameState['city'] | 'day'> = {
  publicSatisfaction: 'publicSatisfaction',
  budget: 'budget',
  morale: 'morale',
  staffMorale: 'morale',
  riskScore: 'riskScore',
  operationRisk: 'riskScore',
  day: 'day',
};

/**
 * Pilot condition / selector için metrik okuyucu.
 * Bilinmeyen key → undefined.
 */
export function getPilotMetricValue(
  gameState: GameState,
  key: string,
): number | undefined {
  const mapped = METRIC_ALIASES[key];
  if (!mapped) {
    return undefined;
  }

  if (mapped === 'day') {
    return gameState.city.day;
  }

  const raw = gameState.city[mapped];
  return typeof raw === 'number' ? raw : undefined;
}

export function conditionMatches(
  condition: EventCondition,
  context: PilotEventSelectionContext,
): boolean {
  switch (condition.type) {
    case 'metric_gte': {
      const current = getPilotMetricValue(context.gameState, condition.metric);
      if (current === undefined) {
        return false;
      }
      return current >= condition.value;
    }
    case 'metric_lte': {
      const current = getPilotMetricValue(context.gameState, condition.metric);
      if (current === undefined) {
        return false;
      }
      return current <= condition.value;
    }
    case 'flag_equals':
      return context.flags[condition.flag] === condition.value;
    case 'district_equals':
      return context.selectedDistrictId === condition.districtId;
    case 'previous_decision':
      return (
        context.pilot.lastEventId === condition.eventId &&
        context.pilot.lastDecisionId === condition.decisionId
      );
    case 'relationship_gte':
      // CharacterRelationship sistemi henüz yok — güvenli no-op.
      return false;
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

export function conditionsMatch(
  conditions: EventCondition[] | undefined,
  context: PilotEventSelectionContext,
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  return conditions.every((c) => conditionMatches(c, context));
}
