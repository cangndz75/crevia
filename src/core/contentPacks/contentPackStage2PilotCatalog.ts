import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import type { EventCard } from '@/core/models/EventCard';

import { mapContentPackTemplatesToEventCards } from './contentPackEventAdapter';
import {
  CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS,
  mergePilotCatalogWithContentSafetyPackStage1,
} from './contentPackPilotCatalog';
import { OPERATION_DIVERSITY_CONTENT_PACK } from './operationDiversityContentPack';

/** Aşama 2 content pack EventCard dönüşümleri. */
export const CONTENT_SAFETY_PACK_STAGE2_EVENT_CARDS: EventCard[] =
  mapContentPackTemplatesToEventCards(OPERATION_DIVERSITY_CONTENT_PACK);

export function mergePilotCatalogWithContentSafetyPackStage2(
  base: EventCard[] = mergePilotCatalogWithContentSafetyPackStage1(),
): EventCard[] {
  return mergeEventCatalogs(base, CONTENT_SAFETY_PACK_STAGE2_EVENT_CARDS);
}

/** Stage 1 + Stage 2 birleşik pilot katalog. */
export function mergePilotCatalogWithContentSafetyPacks(
  base: EventCard[] = pilotEvents,
): EventCard[] {
  return mergeEventCatalogs(
    base,
    [...CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS, ...CONTENT_SAFETY_PACK_STAGE2_EVENT_CARDS],
  );
}
