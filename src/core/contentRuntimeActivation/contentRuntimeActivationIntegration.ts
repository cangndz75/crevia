import {
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  CONTAINER_ENVIRONMENT_PACK_ONE_ID,
  DISTRICT_PACK_ONE_FAMILIES,
  DISTRICT_PACK_ONE_ID,
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_ID,
} from '@/core/contentProduction/contentPacks';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';

import {
  CONTENT_RUNTIME_ACTIVATION_FIRST_DAY,
  CONTENT_RUNTIME_ACTIVATION_LITE_PACK_IDS,
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
  CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY,
  CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICTS,
} from './contentRuntimeActivationConstants';
import {
  mapContentRuntimeActivationCandidatesToEventCards,
} from './contentRuntimeActivationMapper';
import { buildContentRuntimeActivationPresentationHint } from './contentRuntimeActivationPresentation';
import {
  buildContentRuntimeActivationModel,
  resolveContentRuntimeActivationPhase,
} from './contentRuntimeActivationModel';
import {
  buildContentRuntimeActivationFamilyPool,
  rankContentRuntimeActivationCandidates,
  selectContentRuntimeActivationCandidates,
} from './contentRuntimeActivationSelector';
import type {
  ContentRuntimeActivationInput,
  ContentRuntimeActivationSelectionResult,
} from './contentRuntimeActivationTypes';

export function buildContentRuntimeActivationSelection(
  input: ContentRuntimeActivationInput,
): ContentRuntimeActivationSelectionResult {
  const phase = resolveContentRuntimeActivationPhase(input);
  const model = buildContentRuntimeActivationModel(input, phase);
  const maxCandidates =
    phase === 'main_operation_full'
      ? CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL
      : CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT;

  if (!model.isEligible || model.activationMode === 'off') {
    return { model, candidates: [], eventCards: [] };
  }

  const pool = buildContentRuntimeActivationFamilyPool(input);
  const ranked = rankContentRuntimeActivationCandidates(pool, input, model);
  const candidates = selectContentRuntimeActivationCandidates(
    ranked,
    input,
    model,
    maxCandidates,
  );
  const eventCards = mapContentRuntimeActivationCandidatesToEventCards(
    candidates,
    input.day,
  );

  const presentationHint = buildContentRuntimeActivationPresentationHint(
    model,
    candidates,
  );

  return {
    model: {
      ...model,
      selectedPackIds: [...new Set(candidates.map((c) => c.packId))],
      selectedFamilyIds: candidates.map((c) => c.familyId),
      selectedVariantIds: candidates.map(
        (c) => `${c.familyId}_${c.selectedVariantKind}`,
      ),
      sourceSignals: presentationHint
        ? [...model.sourceSignals, 'content_pack_activation']
        : model.sourceSignals,
      presentationHint,
    },
    candidates,
    eventCards,
  };
}

export function augmentPostPilotDailySetWithContentActivation(
  dailySet: PostPilotDailyEventSet,
  input: ContentRuntimeActivationInput,
): { dailySet: PostPilotDailyEventSet; selection: ContentRuntimeActivationSelectionResult } {
  const selection = buildContentRuntimeActivationSelection(input);
  if (selection.eventCards.length === 0) {
    return { dailySet, selection };
  }

  const catalog = dailySet.catalog.filter(
    (event) => !selection.eventCards.some((packEvent) => packEvent.id === event.id),
  );
  const sideIds = [...dailySet.sideEventIds];

  for (let i = 0; i < selection.eventCards.length; i += 1) {
    const packEvent = selection.eventCards[i];
    catalog.push(packEvent);
    if (i < sideIds.length) {
      sideIds[i] = packEvent.id;
    } else {
      sideIds.push(packEvent.id);
    }
  }

  const nextSet: PostPilotDailyEventSet = {
    ...dailySet,
    catalog,
    sideEventIds: sideIds,
    allEventIds: [dailySet.anchorEventId, ...sideIds],
  };

  return { dailySet: nextSet, selection };
}

export function isContentRuntimeActivationEligibleDay(day: number): boolean {
  return day >= CONTENT_RUNTIME_ACTIVATION_FIRST_DAY;
}

export function countLitePackFamilies(): number {
  return (
    DISTRICT_PACK_ONE_FAMILIES.length +
    VEHICLE_ROUTE_PACK_ONE_FAMILIES.length +
    CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.length
  );
}

export function listLitePackIds(): readonly string[] {
  return CONTENT_RUNTIME_ACTIVATION_LITE_PACK_IDS;
}

export function isPilotDayProtected(day: number): boolean {
  return day >= 1 && day <= CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY;
}

export const CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICT_LIST =
  CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICTS;

export {
  DISTRICT_PACK_ONE_ID,
  VEHICLE_ROUTE_PACK_ONE_ID,
  CONTAINER_ENVIRONMENT_PACK_ONE_ID,
};
