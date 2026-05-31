import {
  applyPostPilotEventGenerationToGameState,
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
} from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import type { PostPilotEventGenerationContext } from '@/core/postPilot/postPilotEventTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

export type RefreshPostPilotEventsFromGameStateResult = {
  gameState: GameState;
  eventPool: EventCard[];
  refreshed: boolean;
};

/**
 * Post-pilot hafif operasyon fazında günlük olay havuzunu ve aktif olayları senkronlar.
 */
export function refreshPostPilotEventsFromGameState(
  gameState: GameState,
  currentEventPool: EventCard[] = [],
  mainOperationContext?: PostPilotEventGenerationContext,
): RefreshPostPilotEventsFromGameStateResult {
  if (!isPostPilotLightEventLoopEligible(gameState)) {
    return {
      gameState,
      eventPool: currentEventPool,
      refreshed: false,
    };
  }

  const postPilotOperation = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );

  const generation = ensurePostPilotDailyEventsForDay({
    gameState,
    postPilotOperation,
    authorityState: gameState.pilot.authorityState,
    badgeState: gameState.pilot.badgeState,
    mainOperationContext,
  });

  if (
    !generation.generated &&
    generation.events.length === 0 &&
    generation.eventPool.length === 0
  ) {
    return {
      gameState,
      eventPool: currentEventPool,
      refreshed: false,
    };
  }

  const nextGameState = applyPostPilotEventGenerationToGameState(
    gameState,
    generation,
    { monetization: mainOperationContext?.monetization },
  );

  return {
    gameState: nextGameState,
    eventPool: generation.eventPool,
    refreshed: generation.generated || generation.events.length > 0,
  };
}
