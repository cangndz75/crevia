import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import type { MapDistrictId } from './mapAssets';
import type { PilotAreaId } from '../types/map';
import { pilotAreaFromDistrict } from './pilotAreaMapping';

export const MAP_DISTRICT_TO_PILOT: Partial<Record<MapDistrictId, PilotDistrictId>> = {
  merkez: 'central',
  cumhuriyet: 'cumhuriyet',
  sanayi: 'industrial_market',
};

export const PILOT_TO_MAP_DISTRICT: Partial<Record<PilotDistrictId, MapDistrictId>> = {
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  industrial_market: 'sanayi',
};

export function pilotDistrictFromMapDistrict(
  districtId: MapDistrictId,
): PilotDistrictId | null {
  return MAP_DISTRICT_TO_PILOT[districtId] ?? null;
}

export function mapDistrictFromPilot(
  districtId: PilotDistrictId | null | undefined,
): MapDistrictId {
  if (!districtId) return 'cumhuriyet';
  return PILOT_TO_MAP_DISTRICT[districtId] ?? 'cumhuriyet';
}

export function pilotAreaFromMapDistrict(
  districtId: MapDistrictId,
): PilotAreaId | null {
  const pilot = pilotDistrictFromMapDistrict(districtId);
  if (!pilot) return null;
  return pilotAreaFromDistrict(pilot);
}
