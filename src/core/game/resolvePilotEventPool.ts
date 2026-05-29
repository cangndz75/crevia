import { shouldClearPilotActiveEvents } from '@/core/game/clearActiveEventsForGameState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import {
  applyPostPilotEventGenerationToGameState,
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
} from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

export type ResolvePilotEventPoolResult = {
  eventPool: EventCard[];
  /** Selector sonucu eventPool'a yazıldı mı? */
  refreshed: boolean;
};

/**
 * Pilot aktifken güncel gün/bölge için eventPool çözümler.
 * Günlük çoklu set mantığı ensureDailyEventsForDay üzerinden çalışır.
 */
export function resolvePilotEventPoolForGameState(
  gameState: GameState,
  currentEventPool: EventCard[],
  _maxEvents = 1,
): ResolvePilotEventPoolResult {
  if (shouldClearPilotActiveEvents(gameState)) {
    return { eventPool: [], refreshed: true };
  }

  if (gameState.pilot.status !== 'active') {
    if (isPostPilotLightEventLoopEligible(gameState)) {
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
      });
      if (generation.eventPool.length === 0 && generation.events.length === 0) {
        return { eventPool: currentEventPool, refreshed: false };
      }
      applyPostPilotEventGenerationToGameState(gameState, generation);
      return {
        eventPool: generation.eventPool,
        refreshed: generation.generated,
      };
    }
    return { eventPool: currentEventPool, refreshed: false };
  }

  const ensured = ensureDailyEventsForDay(gameState, currentEventPool);

  if (!ensured.ensured || ensured.eventPool.length === 0) {
    return { eventPool: currentEventPool, refreshed: false };
  }

  return {
    eventPool: ensured.eventPool,
    refreshed: true,
  };
}
