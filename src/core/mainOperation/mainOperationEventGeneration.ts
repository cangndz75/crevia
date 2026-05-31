import { ensureAtLeastOneAffordableDecision } from '@/core/game/decisionAffordabilityFallback';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import {
  buildPostPilotAnchorEvent,
  buildPostPilotSideEvent,
} from '@/core/postPilot/postPilotEventTemplates';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';

import {
  buildMainFullAnchorEvent,
  buildMainFullSideEvent,
} from './mainOperationEventTemplates';
import {
  buildMainOperationEngineInput,
  buildMainOperationEventScope,
  buildMainOperationDailyContext,
  getMainOperationEventDensity,
  pickMainOperationEventDistrict,
  shouldUseFullMainOperationEvents,
} from './mainOperationEngine';
import {
  buildCrisisSideEvent,
  pickCrisisEventTemplateKey,
} from '@/core/crisis/crisisEventTemplates';
import { shouldAddCrisisRelatedEvent } from '@/core/crisis/crisisEngine';
import type { CrisisState } from '@/core/crisis/crisisTypes';

import type { MainOperationSeasonState } from './mainOperationTypes';
import { ensureMainOperationSeasonForGameState } from './mainOperationEngine';
import type { MainOperationEngineInput } from './mainOperationTypes';

const ANCHOR_KEYS = [
  'district_pressure',
  'route_capacity',
  'container_balance',
] as const;

const SIDE_KEYS = [
  'social_coordination',
  'assignment_review',
  'vehicle_strain',
] as const;

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

export function buildFullMainOperationDailySet(
  day: number,
  input: MainOperationEngineInput,
  crisisState?: CrisisState,
): PostPilotDailyEventSet {
  const season = ensureMainOperationSeasonForGameState(input);
  const density = getMainOperationEventDensity(
    input.gameState,
    input.monetization,
  );

  const anchorDistrict = pickMainOperationEventDistrict(season, 'anchor', day);
  const anchorScope = buildMainOperationEventScope(anchorDistrict);
  const anchorKey = ANCHOR_KEYS[day % ANCHOR_KEYS.length]!;
  const anchor = buildMainFullAnchorEvent(anchorKey, day, anchorScope);

  const catalog: EventCard[] = [anchor];
  const sideEventIds: string[] = [];

  const sideCount = Math.min(
    density.side,
    density.maxDailyEvents - density.anchor,
  );

  for (let i = 0; i < sideCount; i += 1) {
    const sideDistrict = pickMainOperationEventDistrict(
      season,
      'side',
      day + i,
    );
    const sideScope = buildMainOperationEventScope(sideDistrict);
    const sideKey = SIDE_KEYS[(day + i) % SIDE_KEYS.length]!;
    const side = buildMainFullSideEvent(sideKey, day, sideScope);
    catalog.push(side);
    sideEventIds.push(side.id);
  }

  const hasCrisisEvent = catalog.some((e) => e.id.startsWith('crisis_d'));
  if (
    crisisState &&
    shouldAddCrisisRelatedEvent(crisisState) &&
    !hasCrisisEvent &&
    catalog.length < density.maxDailyEvents
  ) {
    const crisisKey = pickCrisisEventTemplateKey(
      crisisState.recentSignals,
      day,
    );
    const crisisDistrict = pickMainOperationEventDistrict(
      season,
      'side',
      day + 2,
    );
    const crisisScope = buildMainOperationEventScope(crisisDistrict);
    const crisisEvent = buildCrisisSideEvent(crisisKey, day, crisisScope);
    if (catalog.length >= density.maxDailyEvents) {
      const replaceIdx = catalog.findIndex((e) =>
        e.id.includes('_side_'),
      );
      if (replaceIdx >= 0) {
        const removed = catalog[replaceIdx]!;
        catalog[replaceIdx] = crisisEvent;
        const sideIdIdx = sideEventIds.indexOf(removed.id);
        if (sideIdIdx >= 0) {
          sideEventIds[sideIdIdx] = crisisEvent.id;
        } else {
          sideEventIds.push(crisisEvent.id);
        }
      }
    } else {
      catalog.push(crisisEvent);
      sideEventIds.push(crisisEvent.id);
    }
  }

  return {
    day,
    anchorEventId: anchor.id,
    sideEventIds,
    allEventIds: catalog.map((e) => e.id),
    catalog: cloneEventCards(catalog),
  };
}

export function filterMainOperationActiveEvents(
  catalog: EventCard[],
  allEventIds: string[],
  blockedIds: Set<string>,
  budget: number,
  maxEvents: number,
): EventCard[] {
  return allEventIds
    .filter((id) => !blockedIds.has(id))
    .map((id) => catalog.find((event) => event.id === id))
    .filter((event): event is EventCard => event != null)
    .slice(0, maxEvents)
    .map((event) => ensureAtLeastOneAffordableDecision(event, budget));
}

export function resolveFullMainOperationMaxEvents(
  gameState: GameState,
  monetization: MonetizationState,
): number {
  return getMainOperationEventDensity(gameState, monetization).maxDailyEvents;
}

export { buildMainOperationDailyContext, shouldUseFullMainOperationEvents };
