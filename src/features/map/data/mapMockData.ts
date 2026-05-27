/**
 * @deprecated Import from mapSelectors / pilotAreaPresets instead.
 * Re-exported for backward compatibility within the map feature.
 */
export {
  getActiveOperation,
  getContainerSummary,
  getContainers,
  getCrews,
  getDayEvent,
  getDefaultLayers,
  getFilterDescription,
  getPinsForFilter,
  getPilotPreset,
  getPilotPresetFromDistrict,
  getRiskDensityLabel,
  getRiskSummary,
  getTasks,
  getVehicles,
  layerConfigs,
  mapFilters,
  mapRegions,
} from './mapSelectors';

export { pilotAreaPresets } from './pilotAreaPresets';
export { pilotAreaFromDistrict, districtFromPilotArea } from './pilotAreaMapping';
