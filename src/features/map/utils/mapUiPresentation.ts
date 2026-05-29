import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { getNeighborhoodMapCharacterLine } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { colors } from '@/ui/theme/colors';

import { CITY_DISTRICT_REGIONS } from '../data/cityOverviewGeometry';
import type { MapDistrictId } from '../data/mapDistrictConstants';
import { MAP_DISTRICT_IDS } from '../data/mapDistrictConstants';
import { mapDistrictFromPilot, pilotDistrictFromMapDistrict } from '../data/mapDistrictMapping';
import { getPilotPreset, getRiskDensityLabel } from '../data/mapSelectors';
import type { MapViewMode, PilotAreaId } from '../types/map';
import { getMapDistrictLabel } from './mapDistrictLabels';
import { buildNeighborhoodContainerMapSignals } from './containerMapAdapter';
import { buildNeighborhoodVehicleBadges } from './vehicleMapAdapter';

export const MAP_UI_BANNED_WORDS = [
  'kilitli',
  'premium',
  'satın al',
  'erişim yok',
  'yetkin yetersiz',
  'paywall',
] as const;

export type MapNeighborhoodStripStatus =
  | 'active'
  | 'watching'
  | 'approaching'
  | 'preview';

export type MapNeighborhoodStripItem = {
  id: MapDistrictId;
  label: string;
  status: MapNeighborhoodStripStatus;
  statusLabel: string;
  accentColor: string;
};

export type MapOperationMetric = {
  key: string;
  label: string;
  value: string;
  tone?: 'teal' | 'gold' | 'warn' | 'neutral';
};

export type MapOperationPanelModel = {
  visible: boolean;
  districtId: MapDistrictId;
  districtLabel: string;
  characterLine?: string;
  riskLabel: string;
  riskTone: 'teal' | 'gold' | 'warn' | 'danger';
  activeEventCount: number;
  sahaNote?: string;
  metrics: MapOperationMetric[];
  ctaLabel: string;
  isDetailView: boolean;
};

const STATUS_LABELS: Record<MapNeighborhoodStripStatus, string> = {
  active: 'Aktif',
  watching: 'İzleniyor',
  approaching: 'Yaklaşıyor',
  preview: 'Önizleme',
};

export function mapUiTextContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return MAP_UI_BANNED_WORDS.filter((word) => haystack.includes(word));
}

export function resolveNeighborhoodStripStatus(
  districtId: MapDistrictId,
  pilotMapDistrict: MapDistrictId,
  focusDistrictId: MapDistrictId,
  gameDay: number,
): MapNeighborhoodStripStatus {
  if (districtId === pilotMapDistrict) {
    return 'active';
  }
  if (districtId === focusDistrictId) {
    return 'watching';
  }
  if ((districtId === 'istasyon' || districtId === 'yesilvadi') && gameDay >= 5) {
    return 'approaching';
  }
  if (!pilotDistrictFromMapDistrict(districtId)) {
    return 'preview';
  }
  return 'watching';
}

export function buildMapNeighborhoodStripItems(params: {
  pilotDistrictId: PilotDistrictId;
  focusDistrictId: MapDistrictId;
  gameDay: number;
}): MapNeighborhoodStripItem[] {
  const pilotMapDistrict = mapDistrictFromPilot(params.pilotDistrictId);

  return MAP_DISTRICT_IDS.map((districtId) => {
    const region =
      CITY_DISTRICT_REGIONS.find((entry) => entry.id === districtId) ??
      CITY_DISTRICT_REGIONS[0]!;
    const status = resolveNeighborhoodStripStatus(
      districtId,
      pilotMapDistrict,
      params.focusDistrictId,
      params.gameDay,
    );

    return {
      id: districtId,
      label: getMapDistrictLabel(districtId),
      status,
      statusLabel: STATUS_LABELS[status],
      accentColor: region.color,
    };
  });
}

function countEventsForDistrict(
  events: EventCard[],
  districtId: MapDistrictId,
): number {
  return events.filter((event) => {
    const neighborhoodId = event.neighborhoodId?.toLowerCase() ?? '';
    return (
      neighborhoodId.includes(districtId) ||
      event.district?.toLowerCase().includes(districtId)
    );
  }).length;
}

function resolveRiskTone(riskDensity: number): MapOperationPanelModel['riskTone'] {
  if (riskDensity >= 70) return 'danger';
  if (riskDensity >= 45) return 'warn';
  if (riskDensity >= 25) return 'gold';
  return 'teal';
}

export function buildMapOperationPanelModel(params: {
  viewMode: MapViewMode;
  focusDistrictId: MapDistrictId;
  pilotAreaId: PilotAreaId;
  pilotDistrictId: PilotDistrictId;
  gameDay: number;
  activeEvents: EventCard[];
  containerState?: ContainerState;
  vehicleState?: VehicleState;
  hideFleetSignals?: boolean;
  dayEventTitle?: string;
}): MapOperationPanelModel {
  const preset = getPilotPreset(params.pilotAreaId);
  const isDetailView = params.viewMode === 'detail';
  const districtLabel = getMapDistrictLabel(params.focusDistrictId);
  const characterLine = getNeighborhoodMapCharacterLine(params.focusDistrictId);
  const activeEventCount = countEventsForDistrict(
    params.activeEvents,
    params.focusDistrictId,
  );

  const containerSignal = params.containerState
    ? buildNeighborhoodContainerMapSignals(params.containerState).find(
        (entry) => entry.neighborhoodId === params.focusDistrictId,
      )
    : undefined;

  const vehicleBadge =
    params.vehicleState && !params.hideFleetSignals
      ? buildNeighborhoodVehicleBadges(params.vehicleState).find(
          (entry) => entry.neighborhoodId === params.focusDistrictId,
        )
      : undefined;

  const metrics: MapOperationMetric[] = [
    {
      key: 'events',
      label: 'Operasyon sinyali',
      value: `${activeEventCount}`,
      tone: activeEventCount > 0 ? 'warn' : 'teal',
    },
    {
      key: 'social',
      label: 'Bölge etkisi',
      value: preset.socialRisk,
      tone: 'neutral',
    },
    {
      key: 'risk',
      label: 'Risk yoğunluğu',
      value: `%${preset.riskDensity}`,
      tone: resolveRiskTone(preset.riskDensity) === 'danger' ? 'warn' : 'gold',
    },
  ];

  if (containerSignal) {
    metrics[1] = {
      key: 'container',
      label: 'Konteyner',
      value: containerSignal.statusLabel,
      tone: containerSignal.severity === 'critical' ? 'warn' : 'teal',
    };
  } else if (vehicleBadge) {
    metrics[1] = {
      key: 'vehicle',
      label: 'Rota',
      value: vehicleBadge.label,
      tone: vehicleBadge.severity === 'critical' ? 'warn' : 'teal',
    };
  }

  return {
    visible: true,
    districtId: params.focusDistrictId,
    districtLabel,
    characterLine: characterLine ?? undefined,
    riskLabel: getRiskDensityLabel(preset.riskDensity),
    riskTone: resolveRiskTone(preset.riskDensity),
    activeEventCount,
    sahaNote: params.dayEventTitle,
    metrics: metrics.slice(0, 3),
    ctaLabel: isDetailView ? 'Şehir Haritasına Dön' : 'Detayı Gör',
    isDetailView,
  };
}

export function collectMapUiPresentationStrings(
  stripItems: MapNeighborhoodStripItem[],
  panel: MapOperationPanelModel,
): string[] {
  return [
    'Operasyon Haritası',
    ...stripItems.map((item) => `${item.label} ${item.statusLabel}`),
    panel.districtLabel,
    panel.riskLabel,
    panel.sahaNote ?? '',
    ...panel.metrics.map((metric) => `${metric.label} ${metric.value}`),
    panel.ctaLabel,
  ].filter(Boolean);
}

export const MAP_UI_LAYOUT_GUARDS = {
  markerLabelNumberOfLines: 1,
  bottomPanelNumberOfLines: 2,
  stripLabelNumberOfLines: 1,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;
