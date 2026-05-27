import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';

import type { PilotAreaId } from '../types/map';

/** Store / onboarding district id → harita pilot bölge id */
export const DISTRICT_TO_PILOT_AREA: Record<PilotDistrictId, PilotAreaId> = {
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  industrial_market: 'sanayiPazar',
};

export const PILOT_AREA_TO_DISTRICT: Record<PilotAreaId, PilotDistrictId> = {
  merkez: 'central',
  cumhuriyet: 'cumhuriyet',
  sanayiPazar: 'industrial_market',
};

export function pilotAreaFromDistrict(
  districtId: PilotDistrictId | null | undefined,
): PilotAreaId {
  if (!districtId) return DISTRICT_TO_PILOT_AREA[DEFAULT_PILOT_DISTRICT_ID];
  return DISTRICT_TO_PILOT_AREA[districtId] ?? 'merkez';
}

export function districtFromPilotArea(areaId: PilotAreaId): PilotDistrictId {
  return PILOT_AREA_TO_DISTRICT[areaId];
}
