import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import { CITY_DISTRICT_REGIONS } from '../data/cityOverviewGeometry';
import { mapDistrictFromPilot, pilotDistrictFromMapDistrict } from '../data/mapDistrictMapping';
import type { MapDistrictId } from '../data/mapAssets';
import type {
  ActiveLayers,
  MapFilterId,
  MapPin,
  PilotAreaId,
} from '../types/map';
import { buildMapPins, shouldShowHeatmap, shouldShowRoutes } from './mapFromEvents';

export { shouldShowHeatmap, shouldShowRoutes };

export type CityOverviewPinsInput = {
  pilotAreaId: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  activeLayers: ActiveLayers;
  gameDay: number;
  activeEvents: EventCard[];
};

/** Pilot bölge pinlerini şehir haritası mahalle merkezlerine taşır */
export function buildCityOverviewPins(input: CityOverviewPinsInput): MapPin[] {
  const pilotPins = buildMapPins(input);
  const activeDistrict = mapDistrictFromPilot(input.selectedDistrictId);

  return pilotPins.map((pin) => {
    const districtId: MapDistrictId =
      pin.mapDistrictId ??
      (pin.regionId ? mapDistrictFromPilot(pin.regionId) : activeDistrict);

    const region = CITY_DISTRICT_REGIONS.find((r) => r.id === districtId);
    if (!region) return { ...pin, mapDistrictId: districtId };

    return {
      ...pin,
      x: region.label.x,
      y: region.label.y,
      mapDistrictId: districtId,
      regionId: pilotDistrictFromMapDistrict(districtId) ?? pin.regionId,
    };
  });
}
