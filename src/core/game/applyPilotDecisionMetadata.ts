import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

export type ApplyPilotDecisionMetadataParams = {
  gameState: GameState;
  event: EventCard;
  decision: EventDecision;
};

/**
 * Karar sonrası pilot metadata (flags, completed events, last decision).
 * Metrik/XP etkileri applyDecision tarafından uygulanır; xpReward burada işlenmez.
 */
export function applyPilotDecisionMetadata(
  params: ApplyPilotDecisionMetadataParams,
): GameState {
  const { gameState, event, decision } = params;

  if (!gameState.pilot || gameState.pilot.status !== 'active') {
    return gameState;
  }

  const pilot = gameState.pilot;

  const completedEventIds = pilot.completedEventIds.includes(event.id)
    ? pilot.completedEventIds
    : [...pilot.completedEventIds, event.id];

  const flags = decision.setFlags
    ? { ...pilot.flags, ...decision.setFlags }
    : pilot.flags;

  return {
    ...gameState,
    pilot: {
      ...pilot,
      lastEventId: event.id,
      lastDecisionId: decision.id,
      completedEventIds,
      flags,
    },
  };
}
