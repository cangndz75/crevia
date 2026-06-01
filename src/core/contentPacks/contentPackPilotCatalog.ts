import { pilotEvents } from '@/core/content/pilotEvents';
import { mergeEventCatalogs } from '@/core/districts/districtEventIntegration';
import type { EventCard } from '@/core/models/EventCard';

import { mapContentPackTemplatesToEventCards } from './contentPackEventAdapter';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from './neighborhoodContainerContentPack';

/** Aşama 1 content pack EventCard dönüşümleri (gün 2–6, Day 1/7 hariç). */
export const CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS: EventCard[] =
  mapContentPackTemplatesToEventCards(NEIGHBORHOOD_CONTAINER_CONTENT_PACK);

/**
 * Pilot kataloğuna content pack ekler. Event cap ve generation algoritması aynı kalır;
 * yalnızca aday havuzu genişler.
 */
export function mergePilotCatalogWithContentSafetyPackStage1(
  base: EventCard[] = pilotEvents,
): EventCard[] {
  return mergeEventCatalogs(base, CONTENT_SAFETY_PACK_STAGE1_EVENT_CARDS);
}
