import { shouldClearPilotActiveEvents } from '@/core/game/clearActiveEventsForGameState';
import { selectPilotEventsForDay } from '@/core/game/selectPilotEventsForDay';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

export type ResolvePilotEventPoolResult = {
  eventPool: EventCard[];
  /** Selector sonucu eventPool'a yazıldı mı? */
  refreshed: boolean;
};

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

/**
 * Pilot aktifken güncel gün/bölge için eventPool çözümler.
 * Pilot inactive veya selector boş dönerse mevcut havuz korunur.
 */
export function resolvePilotEventPoolForGameState(
  gameState: GameState,
  currentEventPool: EventCard[],
  maxEvents = 1,
): ResolvePilotEventPoolResult {
  if (shouldClearPilotActiveEvents(gameState)) {
    return { eventPool: [], refreshed: true };
  }

  if (gameState.pilot.status !== 'active') {
    return { eventPool: currentEventPool, refreshed: false };
  }

  const selected = selectPilotEventsForDay({ gameState, maxEvents });

  if (selected.length === 0) {
    return { eventPool: currentEventPool, refreshed: false };
  }

  return {
    eventPool: cloneEventCards(selected),
    refreshed: true,
  };
}
