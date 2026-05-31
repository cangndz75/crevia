import { ensureAtLeastOneAffordableDecision } from '@/core/game/decisionAffordabilityFallback';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import {
  buildCrisisSideEvent,
  pickCrisisEventTemplateKey,
} from '@/core/crisis/crisisEventTemplates';
import { shouldAddCrisisRelatedEvent } from '@/core/crisis/crisisEngine';
import type { CrisisState } from '@/core/crisis/crisisTypes';

import {
  CRISIS_ADJACENT_KEYS,
  DISTRICT_EVENT_KEYS,
  GLOBAL_ANCHOR_KEYS,
  GLOBAL_SIDE_KEYS,
  getContentPackCategory,
  pickContentPackKey,
} from './mainOperationContentPack';
import {
  buildMainCrisisAdjacentEvent,
  buildMainDistrictEvent,
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
import { ensureMainOperationSeasonForGameState } from './mainOperationEngine';
import type { MainOperationEngineInput } from './mainOperationTypes';
import { getActiveMainOperationDistrictIds } from './mainOperationState';

function cloneEventCards(events: EventCard[]): EventCard[] {
  return events.map((event) => ({
    ...event,
    decisions: event.decisions.map((decision) => ({ ...decision })),
  }));
}

function districtEventKeysFor(districtId: MapDistrictId): string[] {
  return DISTRICT_EVENT_KEYS[districtId] ?? [];
}

function pickAnchorTemplateKey(
  day: number,
  _districtId: MapDistrictId,
  usedTemplateKeys: Set<string>,
  usedCategories: Set<string>,
): string {
  return (
    pickContentPackKey(
      [...GLOBAL_ANCHOR_KEYS],
      day,
      usedTemplateKeys,
      usedCategories,
      getContentPackCategory,
    ) ?? GLOBAL_ANCHOR_KEYS[day % GLOBAL_ANCHOR_KEYS.length]!
  );
}

function pickSideTemplateKey(
  day: number,
  districtId: MapDistrictId,
  usedTemplateKeys: Set<string>,
  usedCategories: Set<string>,
): string {
  const picked = pickContentPackKey(
    [...GLOBAL_SIDE_KEYS],
    day + districtId.length,
    usedTemplateKeys,
    usedCategories,
    getContentPackCategory,
  );
  return picked ?? GLOBAL_SIDE_KEYS[day % GLOBAL_SIDE_KEYS.length]!;
}

function registerEvent(
  catalog: EventCard[],
  event: EventCard,
  templateKey: string,
  usedKeys: Set<string>,
  usedTemplateKeys: Set<string>,
  usedCategories: Set<string>,
  sideEventIds: string[],
  isSide: boolean,
): void {
  if (usedKeys.has(event.id)) {
    return;
  }
  const category = event.category.split('/')[0]?.trim().toLowerCase() ?? '';
  usedKeys.add(event.id);
  usedTemplateKeys.add(templateKey);
  if (category) {
    usedCategories.add(category);
  }
  catalog.push(event);
  if (isSide) {
    sideEventIds.push(event.id);
  }
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

  const usedKeys = new Set<string>();
  const usedTemplateKeys = new Set<string>();
  const usedCategories = new Set<string>();
  const sideEventIds: string[] = [];
  const catalog: EventCard[] = [];

  const anchorDistrict = pickMainOperationEventDistrict(season, 'anchor', day);
  const anchorScope = buildMainOperationEventScope(anchorDistrict);
  const anchorKey = pickAnchorTemplateKey(
    day,
    anchorDistrict,
    usedTemplateKeys,
    usedCategories,
  );
  const anchor = buildMainFullAnchorEvent(anchorKey, day, anchorScope);
  registerEvent(
    catalog,
    anchor,
    anchorKey,
    usedKeys,
    usedTemplateKeys,
    usedCategories,
    sideEventIds,
    false,
  );

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
    const sideKey = pickSideTemplateKey(
      day + i,
      sideDistrict,
      usedTemplateKeys,
      usedCategories,
    );
    const side = buildMainFullSideEvent(sideKey, day, sideScope);
    registerEvent(
      catalog,
      side,
      sideKey,
      usedKeys,
      usedTemplateKeys,
      usedCategories,
      sideEventIds,
      true,
    );
  }

  const crisisElevated =
    crisisState &&
    (crisisState.riskLevel === 'elevated' ||
      crisisState.riskLevel === 'critical' ||
      crisisState.activeIncident != null);

  const hasCrisisEvent = catalog.some(
    (e) => e.id.includes('_crisis_') || e.id.startsWith('crisis_d'),
  );

  if (
    crisisElevated &&
    !hasCrisisEvent &&
    catalog.length < density.maxDailyEvents
  ) {
    const crisisDistrict = pickMainOperationEventDistrict(
      season,
      'side',
      day + 3,
    );
    const crisisScope = buildMainOperationEventScope(crisisDistrict);
    const mainOpCrisisKey = pickContentPackKey(
      [...CRISIS_ADJACENT_KEYS],
      day,
      usedTemplateKeys,
      usedCategories,
      getContentPackCategory,
    );
    const crisisEvent = mainOpCrisisKey
      ? buildMainCrisisAdjacentEvent(mainOpCrisisKey, day, crisisScope)
      : buildCrisisSideEvent(
          pickCrisisEventTemplateKey(crisisState.recentSignals, day),
          day,
          crisisScope,
        );

    if (catalog.length >= density.maxDailyEvents) {
      const replaceIdx = catalog.findIndex((e) => e.id.includes('_side_'));
      if (replaceIdx >= 0) {
        const removed = catalog[replaceIdx]!;
        catalog[replaceIdx] = crisisEvent;
        usedKeys.delete(removed.id);
        const sideIdIdx = sideEventIds.indexOf(removed.id);
        if (sideIdIdx >= 0) {
          sideEventIds[sideIdIdx] = crisisEvent.id;
        }
        usedKeys.add(crisisEvent.id);
      }
    } else {
      registerEvent(
        catalog,
        crisisEvent,
        mainOpCrisisKey ?? crisisEvent.id,
        usedKeys,
        usedTemplateKeys,
        usedCategories,
        sideEventIds,
        true,
      );
    }
  } else if (
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
      const replaceIdx = catalog.findIndex((e) => e.id.includes('_side_'));
      if (replaceIdx >= 0) {
        const removed = catalog[replaceIdx]!;
        catalog[replaceIdx] = crisisEvent;
        const sideIdIdx = sideEventIds.indexOf(removed.id);
        if (sideIdIdx >= 0) {
          sideEventIds[sideIdIdx] = crisisEvent.id;
        }
      }
    } else {
      registerEvent(
        catalog,
        crisisEvent,
        crisisKey,
        usedKeys,
        usedTemplateKeys,
        usedCategories,
        sideEventIds,
        true,
      );
    }
  }

  const activeDistricts = getActiveMainOperationDistrictIds(season);
  if (
    catalog.length < density.maxDailyEvents &&
    activeDistricts.length > 0 &&
    day % 3 === 0
  ) {
    const extraDistrict = activeDistricts[day % activeDistricts.length] as MapDistrictId;
    const extraKey = pickContentPackKey(
      districtEventKeysFor(extraDistrict),
      day + 5,
      usedTemplateKeys,
      usedCategories,
      getContentPackCategory,
    );
    if (extraKey) {
      const extraScope = buildMainOperationEventScope(extraDistrict);
      const extra = buildMainDistrictEvent(extraKey, day, extraScope);
      registerEvent(
        catalog,
        extra,
        extraKey,
        usedKeys,
        usedTemplateKeys,
        usedCategories,
        sideEventIds,
        true,
      );
    }
  }

  const anchorEvent = catalog[0]!;

  return {
    day,
    anchorEventId: anchorEvent.id,
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
