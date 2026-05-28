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
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { GameState } from '@/core/models/GameState';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import {
  appendPilotEventContentMemory,
  enrichDailyEventSetWithEventContent,
} from '@/core/events/eventVariationEngine';

export type EnsureDailyEventsForDayOptions = {
  containerState?: ContainerState | null;
  vehicleState?: VehicleState | null;
  dailyPriorityKey?: DailyPriorityKey;
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
  dailyPriorityKey?: DailyPriorityKey,
): { gameState: GameState; eventPool: EventCard[] } {
  const solvedIds = getSolvedEventIds(gameState);
  const mergedCatalog = mergeEventCatalogs(
    catalog,
    dailyEventSet.supplementalEvents ?? [],
  );
  const workingCatalog = cloneEventCards(mergedCatalog);
  const needsEnrich = dailyEventSet.allEventIds.some((id) => {
    const card = workingCatalog.find((e) => e.id === id);
    return card != null && !card.contentProfileId && dailyEventSet.day > 1;
  });
  if (needsEnrich) {
    enrichDailyEventSetWithEventContent({
      dailyEventSet,
      catalog: workingCatalog,
      gameState,
      day: dailyEventSet.day,
      districtId: dailyEventSet.districtId,
      dailyPriorityKey,
    });
  }
  const activeEvents = resolveEventCardsFromDailySet(
    dailyEventSet,
    workingCatalog,
    solvedIds,
  );
  const allCards = dailyEventSet.allEventIds
    .map((id) => workingCatalog.find((e) => e.id === id))
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
    const synced = applyDailySetToGameState(
      gameState,
      existing,
      catalog,
      options?.dailyPriorityKey,
    );
    return {
      ...synced,
      ensured: true,
      dailyEventSet: existing,
    };
  }

  const mergedCatalog = mergeEventCatalogs(catalog, currentEventPool);

  const dailyEventSet = generateDailyEventSet({
    gameState,
    day,
    districtId,
    events: mergedCatalog,
    containerState: options?.containerState ?? null,
    vehicleState: options?.vehicleState ?? null,
    dailyPriorityKey: options?.dailyPriorityKey,
  });

  dailyEventSet.generatedAt = new Date().toISOString();

  const applied = applyDailySetToGameState(
    gameState,
    dailyEventSet,
    mergedCatalog,
    options?.dailyPriorityKey,
  );

  const gameStateWithMemory = {
    ...applied.gameState,
    pilot: appendPilotEventContentMemory(
      applied.gameState.pilot,
      mergedCatalog,
      dailyEventSet,
    ),
  };

  return {
    ...applied,
    gameState: gameStateWithMemory,
    eventPool: mergeEventCatalogs(mergedCatalog, applied.eventPool),
    ensured: true,
    dailyEventSet,
  };
}
