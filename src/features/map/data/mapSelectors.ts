import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import type {
  ActiveLayers,
  ActiveOperation,
  Container,
  ContainerSummary,
  Crew,
  LayerId,
  MapFilter,
  MapFilterId,
  MapPin,
  MapRegion,
  PilotAreaId,
  PilotAreaPreset,
  PilotDayEvent,
  RiskSummary,
  TaskItem,
  Vehicle,
} from '../types/map';
import { pilotAreaFromDistrict } from './pilotAreaMapping';
import { pilotAreaPresets } from './pilotAreaPresets';

export const mapFilters: MapFilter[] = [
  { id: 'events', label: 'Olaylar', icon: 'alert-circle', activeColor: colors.primary },
  { id: 'risk', label: 'Risk', icon: 'warning', activeColor: colors.warning },
  { id: 'crews', label: 'Ekipler', icon: 'people', activeColor: colors.purple },
  { id: 'vehicles', label: 'Araçlar', icon: 'car', activeColor: colors.secondary },
  { id: 'containers', label: 'Konteyner', icon: 'trash', activeColor: colors.primary },
];

export const mapRegions: MapRegion[] = [
  {
    id: 'central',
    displayName: 'Merkez Pilot Bölge',
    population: 12450,
    color: colors.primary,
    x: 0.3,
    y: 0.25,
    width: 0.4,
    height: 0.35,
  },
  {
    id: 'cumhuriyet',
    displayName: 'Cumhuriyet Mahallesi',
    population: 9870,
    color: colors.purple,
    x: 0.05,
    y: 0.55,
    width: 0.38,
    height: 0.35,
  },
  {
    id: 'industrial_market',
    displayName: 'Sanayi & Pazar Bölgesi',
    population: 6780,
    color: colors.hubGold,
    x: 0.55,
    y: 0.52,
    width: 0.4,
    height: 0.38,
  },
];

export function getPilotPreset(areaId: PilotAreaId): PilotAreaPreset {
  return pilotAreaPresets[areaId];
}

export function getPilotPresetFromDistrict(
  districtId: PilotDistrictId,
): PilotAreaPreset {
  return pilotAreaPresets[pilotAreaFromDistrict(districtId)];
}

export function getFilterDescription(
  areaId: PilotAreaId,
  filter: MapFilterId,
): string {
  return pilotAreaPresets[areaId].filterDescriptions[filter];
}

export function getDefaultLayers(areaId: PilotAreaId): ActiveLayers {
  const defaults: Record<PilotAreaId, ActiveLayers> = {
    merkez: {
      risk: true,
      routes: true,
      complaints: true,
      greenAreas: false,
      lighting: false,
      waste: false,
    },
    cumhuriyet: {
      risk: true,
      routes: false,
      complaints: true,
      greenAreas: true,
      lighting: false,
      waste: false,
    },
    sanayiPazar: {
      risk: true,
      routes: true,
      complaints: false,
      greenAreas: false,
      lighting: false,
      waste: true,
    },
  };
  return defaults[areaId];
}

export function getDayEvent(
  areaId: PilotAreaId,
  gameDay: number,
): PilotDayEvent {
  const preset = pilotAreaPresets[areaId];
  const day = Math.min(Math.max(1, gameDay), 7);
  return preset.dayEvents[day] ?? preset.dayEvents[1];
}

function applyPinMultiplier(pins: MapPin[], multiplier: number): MapPin[] {
  if (multiplier >= 1) return pins;
  const count = Math.max(1, Math.round(pins.length * multiplier));
  return pins.slice(0, count);
}

export function getPinsForFilter(
  areaId: PilotAreaId,
  filter: MapFilterId,
  gameDay: number,
  selectedDistrictId: PilotDistrictId,
): MapPin[] {
  const preset = pilotAreaPresets[areaId];
  const dayEvent = getDayEvent(areaId, gameDay);
  const pins = preset.pinsByFilter[filter].filter(
    (p) => p.regionId === selectedDistrictId,
  );
  return applyPinMultiplier(pins, dayEvent.pinMultiplier);
}

export function getActiveOperation(
  areaId: PilotAreaId,
  gameDay: number,
): ActiveOperation {
  const preset = pilotAreaPresets[areaId];
  const dayEvent = getDayEvent(areaId, gameDay);
  return {
    id: 'op-active',
    name: dayEvent.activeOperationTitle,
    district: preset.shortName,
    startTime: '18:30',
    crewCount: preset.activeCrewCount,
    vehicleCount: preset.activeVehicleCount,
    recommendedAction: preset.recommendedAction,
  };
}

export function getCrews(areaId: PilotAreaId): Crew[] {
  return pilotAreaPresets[areaId].crews;
}

export function getTasks(areaId: PilotAreaId): TaskItem[] {
  return pilotAreaPresets[areaId].tasks;
}

export function getVehicles(areaId: PilotAreaId): Vehicle[] {
  return pilotAreaPresets[areaId].vehicles;
}

export function getContainers(areaId: PilotAreaId): Container[] {
  return pilotAreaPresets[areaId].containers;
}

export function getContainerSummary(areaId: PilotAreaId): ContainerSummary {
  return pilotAreaPresets[areaId].containerSummary;
}

export function getRiskSummary(areaId: PilotAreaId): RiskSummary {
  return pilotAreaPresets[areaId].riskSummary;
}

export const layerConfigs: {
  id: LayerId;
  label: string;
  subtitle: string;
}[] = [
  { id: 'risk', label: 'Risk Haritası', subtitle: 'Orta - Yüksek' },
  { id: 'routes', label: 'Rota ve Ulaşım', subtitle: 'Ekip rotaları' },
  { id: 'complaints', label: 'Şikayet Noktaları', subtitle: 'Son 30 gün' },
  { id: 'greenAreas', label: 'Yeşil Alanlar', subtitle: 'Park & Bahçe' },
  { id: 'lighting', label: 'Aydınlatma', subtitle: 'Gece riskleri' },
  { id: 'waste', label: 'Atık Noktaları', subtitle: 'Konteyner ve toplama' },
];

export function getRiskDensityLabel(density: number): string {
  if (density >= 60) return 'Yüksek Risk';
  if (density >= 40) return 'Orta Risk';
  return 'Düşük Risk';
}
