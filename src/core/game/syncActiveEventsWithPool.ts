import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

/**
 * eventPool ile gameState.events / featuredEventId senkronlar.
 * eventPool boşsa mevcut gameState değiştirilmez.
 */
export function syncActiveEventsWithPool(
  gameState: GameState,
  eventPool: EventCard[],
): GameState {
  if (eventPool.length === 0) {
    return gameState;
  }

  const activeEvents = cloneEventCards(eventPool);

  return {
    ...gameState,
    events: activeEvents,
    featuredEventId: activeEvents[0]?.id ?? gameState.featuredEventId,
  };
}
