import { getNeighborhoodIdentity } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import type { MapDistrictId } from '../data/mapAssets';

export function getMapDistrictLabel(districtId: MapDistrictId): string {
  return getNeighborhoodIdentity(districtId).name;
}
