import { ensureAtLeastOneAffordableDecision } from '@/core/game/decisionAffordabilityFallback';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';

import {
  MAX_POST_PILOT_ACTIVE_EVENTS,
  POST_PILOT_ANCHOR_COUNT,
  POST_PILOT_EVENT_FORBIDDEN_WORDS,
  POST_PILOT_FIRST_OPERATION_DAY,
  POST_PILOT_SIDE_COUNT,
} from './postPilotEventConstants';
import {
  buildPostPilotAnchorEvent,
  buildPostPilotSideEvent,
} from './postPilotEventTemplates';
import type {
  EnsurePostPilotDailyEventsInput,
  PostPilotDailyEventSet,
  PostPilotEventGenerationResult,
  PostPilotEventScopeContext,
} from './postPilotEventTypes';
import { derivePostPilotScopeStatuses } from './postPilotOperationEngine';
import type { PostPilotOperationState } from './postPilotOperationTypes';
import { normalizePostPilotOperationState } from './postPilotOperationSeed';

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

export function isPostPilotLightEventLoopEligible(gameState: GameState): boolean {
  if (gameState.pilot.status !== 'completed') {
    return false;
  }
  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );
  return postPilot.phase === 'main_operation_light';
}

export function resolvePostPilotOperationDay(
  gameState: GameState,
  postPilotOperation?: PostPilotOperationState,
): number {
  const postPilot =
    postPilotOperation ??
    normalizePostPilotOperationState(gameState.pilot.postPilotOperation, {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    });

  if (
    typeof postPilot.operationDay === 'number' &&
    Number.isFinite(postPilot.operationDay)
  ) {
    return Math.max(POST_PILOT_FIRST_OPERATION_DAY, Math.round(postPilot.operationDay));
  }

  if (gameState.city.day >= POST_PILOT_FIRST_OPERATION_DAY) {
    return gameState.city.day;
  }

  return POST_PILOT_FIRST_OPERATION_DAY;
}

export function resolvePostPilotEventScope(
  gameState: GameState,
  postPilotOperation: PostPilotOperationState,
): PostPilotEventScopeContext {
  const scopes = derivePostPilotScopeStatuses({
    postPilotOperation,
    pilotStatus: gameState.pilot.status,
    authorityState: gameState.pilot.authorityState,
  });

  if (scopes.istasyon === 'active' || scopes.istasyon === 'agenda') {
    const mapDistrictId: MapDistrictId = 'istasyon';
    return {
      mapDistrictId,
      neighborhoodId: mapDistrictId,
      districtLabel: getMapDistrictLabel(mapDistrictId),
    };
  }

  const pilotDistrictId = gameState.pilot.selectedDistrictId;
  if (pilotDistrictId) {
    const mapDistrictId = mapDistrictFromPilot(pilotDistrictId);
    return {
      mapDistrictId,
      neighborhoodId: mapDistrictId,
      districtLabel: getMapDistrictLabel(mapDistrictId),
    };
  }

  const fallback: MapDistrictId = 'cumhuriyet';
  return {
    mapDistrictId: fallback,
    neighborhoodId: fallback,
    districtLabel: getMapDistrictLabel(fallback),
  };
}

function getBlockedEventIds(gameState: GameState): Set<string> {
  const blocked = new Set<string>();
  for (const id of gameState.pilot.completedEventIds) {
    blocked.add(id);
  }
  for (const solved of gameState.solvedEvents) {
    blocked.add(solved.id);
  }
  return blocked;
}

function filterActiveEvents(
  catalog: EventCard[],
  allEventIds: string[],
  blockedIds: Set<string>,
  budget: number,
): EventCard[] {
  return allEventIds
    .filter((id) => !blockedIds.has(id))
    .map((id) => catalog.find((event) => event.id === id))
    .filter((event): event is EventCard => event != null)
    .slice(0, MAX_POST_PILOT_ACTIVE_EVENTS)
    .map((event) => ensureAtLeastOneAffordableDecision(event, budget));
}

function buildDailySetForDay(
  day: number,
  scope: PostPilotEventScopeContext,
): PostPilotDailyEventSet {
  const anchorIndex = day % 3;
  const sideIndex = day % 4;
  const anchor = buildPostPilotAnchorEvent(anchorIndex, day, scope);
  const side = buildPostPilotSideEvent(sideIndex, day, scope);
  const catalog = cloneEventCards([anchor, side]);

  return {
    day,
    anchorEventId: anchor.id,
    sideEventIds: [side.id],
    allEventIds: catalog.map((event) => event.id),
    catalog,
  };
}

function syncFromExistingSet(
  gameState: GameState,
  postPilotOperation: PostPilotOperationState,
  existing: PostPilotDailyEventSet,
  reason: string,
): PostPilotEventGenerationResult {
  const blockedIds = getBlockedEventIds(gameState);
  const budget = gameState.city.budget;
  const activeEvents = filterActiveEvents(
    existing.catalog,
    existing.allEventIds,
    blockedIds,
    budget,
  );
  const eventPool = cloneEventCards(existing.catalog);
  const anchorStillActive = activeEvents.some(
    (event) => event.id === existing.anchorEventId,
  );
  const featuredEventId = anchorStillActive
    ? existing.anchorEventId
    : activeEvents[0]?.id;

  return {
    events: activeEvents,
    eventPool,
    featuredEventId,
    generated: false,
    reason,
    postPilotOperation: {
      ...postPilotOperation,
      postPilotDailyEventSet: existing,
      operationDay: dayFromSet(existing, postPilotOperation, gameState),
    },
  };
}

function dayFromSet(
  existing: PostPilotDailyEventSet,
  postPilotOperation: PostPilotOperationState,
  gameState: GameState,
): number {
  return (
    postPilotOperation.operationDay ??
    existing.day ??
    resolvePostPilotOperationDay(gameState, postPilotOperation)
  );
}

export function ensurePostPilotDailyEventsForDay(
  input: EnsurePostPilotDailyEventsInput,
): PostPilotEventGenerationResult {
  const { gameState, authorityState, badgeState: _badgeState } = input;
  const postPilotOperation = normalizePostPilotOperationState(
    input.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );

  if (!isPostPilotLightEventLoopEligible(gameState)) {
    return {
      events: [],
      eventPool: [],
      generated: false,
      reason: 'post_pilot_light_inactive',
      postPilotOperation,
    };
  }

  const day =
    input.day ?? resolvePostPilotOperationDay(gameState, postPilotOperation);
  const existing = postPilotOperation.postPilotDailyEventSet;

  if (existing && existing.day === day) {
    return syncFromExistingSet(
      gameState,
      postPilotOperation,
      existing,
      'already_generated_for_day',
    );
  }

  const scope = resolvePostPilotEventScope(gameState, {
    ...postPilotOperation,
    scopes: derivePostPilotScopeStatuses({
      postPilotOperation,
      pilotStatus: gameState.pilot.status,
      authorityState: authorityState ?? gameState.pilot.authorityState,
    }),
  });

  const dailySet = buildDailySetForDay(day, scope);
  const blockedIds = getBlockedEventIds(gameState);
  const activeEvents = filterActiveEvents(
    dailySet.catalog,
    dailySet.allEventIds,
    blockedIds,
    gameState.city.budget,
  );

  if (activeEvents.length > MAX_POST_PILOT_ACTIVE_EVENTS) {
    activeEvents.length = MAX_POST_PILOT_ACTIVE_EVENTS;
  }

  const nextPostPilot: PostPilotOperationState = {
    ...postPilotOperation,
    operationDay: day,
    lastUpdatedDay: day,
    postPilotDailyEventSet: dailySet,
    scopes: derivePostPilotScopeStatuses({
      postPilotOperation,
      pilotStatus: gameState.pilot.status,
      authorityState: authorityState ?? gameState.pilot.authorityState,
    }),
  };

  const featuredEventId =
    activeEvents.find((event) => event.id === dailySet.anchorEventId)?.id ??
    activeEvents[0]?.id;

  return {
    events: activeEvents,
    eventPool: cloneEventCards(dailySet.catalog),
    featuredEventId,
    generated: activeEvents.length > 0 || dailySet.allEventIds.length > 0,
    reason: 'generated_post_pilot_daily_set',
    postPilotOperation: nextPostPilot,
  };
}

export function applyPostPilotEventGenerationToGameState(
  gameState: GameState,
  result: PostPilotEventGenerationResult,
): GameState {
  if (!isPostPilotLightEventLoopEligible(gameState)) {
    return gameState;
  }

  return {
    ...gameState,
    events: cloneEventCards(result.events).slice(0, MAX_POST_PILOT_ACTIVE_EVENTS),
    featuredEventId: result.featuredEventId ?? result.events[0]?.id ?? '',
    pilot: {
      ...gameState.pilot,
      postPilotOperation: result.postPilotOperation,
    },
  };
}

export function countPostPilotCatalogEvents(
  postPilotOperation: PostPilotOperationState | undefined,
): number {
  return postPilotOperation?.postPilotDailyEventSet?.allEventIds.length ?? 0;
}

export function postPilotEventTextContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of POST_PILOT_EVENT_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectPostPilotEventStrings(
  events: EventCard[],
  extra: string[] = [],
): string[] {
  const fromEvents = events.flatMap((event) => [
    event.title,
    event.description,
    event.category,
    event.contextTag,
    event.district,
    ...event.decisions.flatMap((decision) => [
      decision.title,
      decision.description,
    ]),
  ]);
  return [...fromEvents, ...extra].filter(Boolean);
}

/** Günlük set boyut doğrulaması (verify). */
export function assertPostPilotDailySetLimits(set: PostPilotDailyEventSet): boolean {
  const sideCount = set.sideEventIds.length;
  const total = set.allEventIds.length;
  return (
    sideCount <= POST_PILOT_SIDE_COUNT &&
    total <= MAX_POST_PILOT_ACTIVE_EVENTS &&
    set.anchorEventId.length > 0
  );
}
