import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import {
  generateDailyEventSet,
  resolveEventCardsFromDailySet,
} from '@/core/game/generateDailyEventSet';
import { shouldClearPilotActiveEvents } from '@/core/game/clearActiveEventsForGameState';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { GameState } from '@/core/models/GameState';

export type EnsureDailyEventsForDayOptions = {
  containerState?: ContainerState | null;
};

export type EnsureDailyEventsForDayResult = {
  gameState: GameState;
  eventPool: EventCard[];
  /** Yeni set üretildi veya mevcut setten senkronlandı. */
  ensured: boolean;
  dailyEventSet: DailyEventSet | null;
};

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

function getSolvedEventIds(gameState: GameState): Set<string> {
  return new Set(gameState.solvedEvents.map((e) => e.id));
}

function applyDailySetToGameState(
  gameState: GameState,
  dailyEventSet: DailyEventSet,
  catalog: EventCard[],
): { gameState: GameState; eventPool: EventCard[] } {
  const solvedIds = getSolvedEventIds(gameState);
  const activeEvents = resolveEventCardsFromDailySet(
    dailyEventSet,
    catalog,
    solvedIds,
  );
  const mergedCatalog = mergeEventCatalogs(
    catalog,
    dailyEventSet.supplementalEvents ?? [],
  );
  const allCards = dailyEventSet.allEventIds
    .map((id) => mergedCatalog.find((e) => e.id === id))
    .filter((e): e is EventCard => e != null);

  const anchorStillActive = activeEvents.some(
    (e) => e.id === dailyEventSet.anchorEventId,
  );
  const featuredEventId = anchorStillActive
    ? dailyEventSet.anchorEventId
    : (activeEvents[0]?.id ?? '');

  return {
    gameState: {
      ...gameState,
      events: activeEvents,
      featuredEventId,
      pilot: {
        ...gameState.pilot,
        dailyEventSet,
      },
    },
    eventPool: cloneEventCards(allCards),
  };
}

function resolvePilotDay(gameState: GameState): number {
  return gameState.pilot.currentPilotDay ?? gameState.city.day;
}

/**
 * Seçili bölge ve gün için günlük event setini garanti eder.
 * Aynı gün + bölge için mevcut set korunur (restart deterministik).
 */
export function ensureDailyEventsForDay(
  gameState: GameState,
  currentEventPool: EventCard[] = [],
  catalog: EventCard[] = pilotEvents,
  options?: EnsureDailyEventsForDayOptions,
): EnsureDailyEventsForDayResult {
  if (shouldClearPilotActiveEvents(gameState)) {
    return {
      gameState,
      eventPool: [],
      ensured: false,
      dailyEventSet: null,
    };
  }

  const { pilot } = gameState;
  if (pilot.status !== 'active' || !pilot.selectedDistrictId) {
    return {
      gameState,
      eventPool: currentEventPool,
      ensured: false,
      dailyEventSet: pilot.dailyEventSet ?? null,
    };
  }

  const day = resolvePilotDay(gameState);
  const districtId = pilot.selectedDistrictId;
  const existing = pilot.dailyEventSet;

  if (
    existing &&
    existing.day === day &&
    existing.districtId === districtId
  ) {
    const synced = applyDailySetToGameState(gameState, existing, catalog);
    return {
      ...synced,
      ensured: true,
      dailyEventSet: existing,
    };
  }

  const dailyEventSet = generateDailyEventSet({
    gameState,
    day,
    districtId,
    events: catalog,
    containerState: options?.containerState ?? null,
  });

  dailyEventSet.generatedAt = new Date().toISOString();

  const applied = applyDailySetToGameState(gameState, dailyEventSet, catalog);

  return {
    ...applied,
    ensured: true,
    dailyEventSet,
  };
}
