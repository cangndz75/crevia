import type { ImageSource } from 'expo-image';

import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { getEventHeroImage } from '@/features/events/utils/eventAssets';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import { resolveEventDistrictIdForIdentity } from '@/features/events/utils/eventResultPresentation';

export function resolveEventResultHeroImage(
  snapshot: DecisionResultSnapshot,
  event?: EventCard | null,
): ImageSource {
  if (event) {
    return getEventHeroImage(event.id, event.category, event);
  }

  const districtId = resolveEventDistrictIdForIdentity(event, snapshot);
  if (districtId) {
    return getPilotDistrictHeroImage(districtId as PilotDistrictId);
  }

  return getPilotDistrictHeroImage('central');
}
