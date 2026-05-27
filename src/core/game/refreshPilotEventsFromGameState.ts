import {
  clearActiveEventsForGameState,
  shouldClearPilotActiveEvents,
} from '@/core/game/clearActiveEventsForGameState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

export type RefreshPilotEventsFromGameStateResult = {
  gameState: GameState;
  eventPool: EventCard[];
  refreshed: boolean;
};

/**
 * Pilot aktif gün/bölge için eventPool + active events senkronlar.
 * Selector boş dönerse mevcut değerler korunur.
 * Final tamamlanabilir veya pilot completed ise havuz ve aktif olaylar temizlenir.
 */
export function refreshPilotEventsFromGameState(
  gameState: GameState,
  currentEventPool: EventCard[],
): RefreshPilotEventsFromGameStateResult {
  if (shouldClearPilotActiveEvents(gameState)) {
    return {
      gameState: clearActiveEventsForGameState(gameState),
      eventPool: [],
      refreshed: true,
    };
  }

  const ensured = ensureDailyEventsForDay(gameState, currentEventPool);

  if (!ensured.ensured) {
    return {
      gameState,
      eventPool: currentEventPool,
      refreshed: false,
    };
  }

  return {
    gameState: ensured.gameState,
    eventPool: ensured.eventPool,
    refreshed: true,
  };
}
