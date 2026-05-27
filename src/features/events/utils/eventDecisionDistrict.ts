import { mapPilotDistrictToDistrictType } from '@/core/districts/pilotDistrictBridge';
import { getDistrictProfile } from '@/core/districts/districtProfiles';
import type { DistrictProfile, DistrictType } from '@/core/districts/types';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { resolveXpDistrictType } from '@/core/xp/districtBonus';
import type { XpDistrictType } from '@/core/xp/types';

const DISTRICT_TYPES: DistrictType[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'pazar',
  'yesilpark',
  'istasyon',
];

function isDistrictType(value: string | undefined): value is DistrictType {
  return value != null && DISTRICT_TYPES.includes(value as DistrictType);
}

export function resolveDistrictTypeForEvent(
  event: EventCard,
  selectedPilotDistrictId?: PilotDistrictId | null,
): DistrictType | undefined {
  if (isDistrictType(event.xpDistrictType)) {
    return event.xpDistrictType;
  }

  const pilotId =
    (event.districtIds?.[0] as PilotDistrictId | undefined) ??
    selectedPilotDistrictId ??
    undefined;
  if (pilotId) {
    return mapPilotDistrictToDistrictType(pilotId);
  }

  const fromDistrictLabel = resolveXpDistrictType(event.district);
  if (fromDistrictLabel && isDistrictType(fromDistrictLabel)) {
    return fromDistrictLabel;
  }

  return undefined;
}

export function getDistrictProfileForEvent(
  event: EventCard,
  selectedPilotDistrictId?: PilotDistrictId | null,
): DistrictProfile | undefined {
  const districtType = resolveDistrictTypeForEvent(event, selectedPilotDistrictId);
  if (!districtType) {
    return undefined;
  }
  return getDistrictProfile(districtType);
}

export function getDistrictTypeDisplayName(
  districtType: DistrictType | XpDistrictType,
): string {
  return getDistrictProfile(districtType as DistrictType).name;
}
