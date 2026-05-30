import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { derivePostPilotScopeStatuses } from '@/core/postPilot/postPilotOperationEngine';
import { buildPostPilotScopeStatusLabel } from '@/core/postPilot/postPilotOperationPresentation';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import type {
  PostPilotPhase,
  ScopeActivationStatus,
} from '@/core/postPilot/postPilotOperationTypes';
import {
  buildDistrictMapPanelLines,
  buildDistrictRiskChips,
  resolveDistrictAccentColor,
  resolveDistrictIconKey,
} from '@/core/districts/districtIdentityPresentation';
import type { DistrictRiskChip } from '@/core/districts/districtIdentityTypes';
import { colors } from '@/ui/theme/colors';

import { CITY_DISTRICT_REGIONS } from '../data/cityOverviewGeometry';
import type { MapDistrictId } from '../data/mapDistrictConstants';
import { MAP_DISTRICT_IDS } from '../data/mapDistrictConstants';
import {
  mapDistrictFromPilot,
  pilotAreaFromMapDistrict,
  pilotDistrictFromMapDistrict,
} from '../data/mapDistrictMapping';
import {
  getCrews,
  getDayEvent,
  getPilotPreset,
  getRiskDensityLabel,
} from '../data/mapSelectors';
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
  identityIconKey?: string;
};

export type MapOperationMetric = {
  key: string;
  label: string;
  value: string;
  tone?: 'teal' | 'gold' | 'warn' | 'neutral';
};

export type MapActiveOperationOverlayModel = {
  title: string;
  eventName: string;
  timeLabel: string;
};

export type MapFilterChipModel = {
  dayLabel: string;
  districtLabel: string;
  districtAccentColor: string;
};

export type DistrictRiskSummaryMetric = {
  key: 'social' | 'personnel' | 'operation';
  label: string;
  value: string;
  sublabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  progress: number;
  progressColor: string;
};

export type MapOperationPanelModel = {
  visible: boolean;
  districtId: MapDistrictId;
  districtLabel: string;
  characterLine?: string;
  summaryDescription?: string;
  identityRiskChips?: DistrictRiskChip[];
  riskLabel: string;
  riskTone: 'teal' | 'gold' | 'warn' | 'danger';
  activeEventCount: number;
  activeEventsPillLabel: string;
  /** Post-pilot gündem satırı (saha notundan ayrı). */
  agendaSignalLine?: string;
  sahaNote?: string;
  metrics: MapOperationMetric[];
  riskMetrics: DistrictRiskSummaryMetric[];
  recommendedAction?: string;
  ctaLabel: string;
  isDetailView: boolean;
};

const STATUS_LABELS: Record<MapNeighborhoodStripStatus, string> = {
  active: 'Aktif',
  watching: 'İzleniyor',
  approaching: 'Yaklaşıyor',
  preview: 'Önizleme',
};

function resolveStripRiskStatusLabel(
  districtId: MapDistrictId,
  pilotMapDistrict: MapDistrictId,
): string {
  const areaId = pilotAreaFromMapDistrict(districtId);
  if (!areaId) {
    return districtId === pilotMapDistrict ? 'İzleniyor' : 'Sakin';
  }
  const preset = getPilotPreset(areaId);
  if (preset.riskDensity >= 60) return 'Yüksek Risk';
  if (preset.riskDensity >= 40) return 'Orta Risk';
  return 'Sakin';
}

function averageCrewEfficiency(areaId: PilotAreaId): number {
  const values = getCrews(areaId)
    .map((crew) => crew.efficiency)
    .filter((n) => Number.isFinite(n));
  if (values.length === 0) {
    const preset = getPilotPreset(areaId);
    return Math.min(92, Math.round(58 + preset.riskDensity / 3));
  }
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function riskLevelProgress(value: string): number {
  const normalized = value.toLowerCase();
  if (normalized.includes('yüksek')) return 0.82;
  if (normalized.includes('orta')) return 0.58;
  if (normalized.includes('düşük')) return 0.34;
  return 0.5;
}

export function buildMapFilterChipModel(params: {
  gameDay: number;
  pilotAreaId: PilotAreaId;
}): MapFilterChipModel {
  const preset = getPilotPreset(params.pilotAreaId);
  return {
    dayLabel: `Gün ${params.gameDay}`,
    districtLabel: preset.shortName,
    districtAccentColor: preset.themeColor,
  };
}

export function buildMapActiveOperationOverlayModel(params: {
  pilotAreaId: PilotAreaId;
  gameDay: number;
  activeEvents: EventCard[];
}): MapActiveOperationOverlayModel | null {
  const preset = getPilotPreset(params.pilotAreaId);
  const dayEvent = getDayEvent(params.pilotAreaId, params.gameDay);
  if (params.activeEvents.length === 0 && !dayEvent.activeOperationTitle) {
    return null;
  }
  const primaryEvent = params.activeEvents[0];
  return {
    title: 'Canlı Operasyon',
    eventName: primaryEvent?.title ?? dayEvent.activeOperationTitle,
    timeLabel: '18:30',
  };
}

export function buildDistrictRiskSummaryMetrics(
  focusDistrictId: MapDistrictId,
  fallbackPilotAreaId: PilotAreaId,
): DistrictRiskSummaryMetric[] {
  const areaId = pilotAreaFromMapDistrict(focusDistrictId) ?? fallbackPilotAreaId;
  const preset = getPilotPreset(areaId);
  const efficiency = averageCrewEfficiency(areaId);

  return [
    {
      key: 'social',
      label: 'Sosyal Risk',
      value: preset.socialRisk,
      sublabel: 'Değişken yoğunluk',
      icon: 'people-outline',
      progress: riskLevelProgress(preset.socialRisk),
      progressColor: '#0F8F86',
    },
    {
      key: 'personnel',
      label: 'Personel',
      value: preset.staffTempo,
      sublabel: `Ekip verimliliği %${efficiency}`,
      icon: 'person-outline',
      progress: efficiency / 100,
      progressColor: '#E59A22',
    },
    {
      key: 'operation',
      label: 'Operasyon',
      value: preset.operationDifficulty,
      sublabel:
        preset.operationDifficulty.toLowerCase().includes('yüksek')
          ? 'Operasyon zorluğu yüksek'
          : 'Operasyon temposu dengeli',
      icon: 'flash-outline',
      progress: riskLevelProgress(preset.operationDifficulty),
      progressColor: '#D8A21D',
    },
  ];
}

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

export type MapPostPilotPresentationContext = {
  pilotStatus: 'not_started' | 'active' | 'completed';
  postPilotOperation?: unknown;
  authorityState?: unknown;
};

function resolvePostPilotScopeLabelForDistrict(
  districtId: MapDistrictId,
  postPilotScopes: Record<'istasyon' | 'yesilvadi' | 'main_operation', ScopeActivationStatus>,
): string | null {
  if (districtId === 'istasyon') {
    return buildPostPilotScopeStatusLabel(postPilotScopes.istasyon);
  }
  if (districtId === 'yesilvadi') {
    return buildPostPilotScopeStatusLabel(postPilotScopes.yesilvadi);
  }
  return null;
}

function shouldApplyPostPilotStripLabels(
  phase: PostPilotPhase | undefined,
): boolean {
  return (
    phase === 'preview_seen' ||
    phase === 'main_operation_light' ||
    phase === 'main_operation_full'
  );
}

export function buildMapNeighborhoodStripItems(params: {
  pilotDistrictId: PilotDistrictId;
  focusDistrictId: MapDistrictId;
  gameDay: number;
  postPilot?: MapPostPilotPresentationContext;
}): MapNeighborhoodStripItem[] {
  const pilotMapDistrict = mapDistrictFromPilot(params.pilotDistrictId);

  const postPilotNormalized = params.postPilot
    ? normalizePostPilotOperationState(params.postPilot.postPilotOperation, {
        pilotStatus: params.postPilot.pilotStatus,
        currentPilotDay: params.gameDay,
      })
    : null;

  const postPilotScopes =
    postPilotNormalized && shouldApplyPostPilotStripLabels(postPilotNormalized.phase)
      ? derivePostPilotScopeStatuses({
          postPilotOperation: postPilotNormalized,
          pilotStatus: params.postPilot!.pilotStatus,
          authorityState: params.postPilot!.authorityState,
        })
      : null;

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

    const postPilotLabel =
      postPilotScopes != null
        ? resolvePostPilotScopeLabelForDistrict(districtId, postPilotScopes)
        : null;

    const stripStatusLabel =
      postPilotLabel ??
      (status === 'preview'
        ? STATUS_LABELS.preview
        : resolveStripRiskStatusLabel(districtId, pilotMapDistrict));

    return {
      id: districtId,
      label: getMapDistrictLabel(districtId),
      status,
      statusLabel: stripStatusLabel,
      accentColor:
        status === 'preview'
          ? region.color
          : resolveDistrictAccentColor(districtId),
      identityIconKey:
        status === 'preview' ? undefined : resolveDistrictIconKey(districtId),
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
  postPilotMapContextLine?: string;
}): MapOperationPanelModel {
  const preset = getPilotPreset(params.pilotAreaId);
  const isDetailView = params.viewMode === 'detail';
  const districtLabel = getMapDistrictLabel(params.focusDistrictId);
  const panelLines = buildDistrictMapPanelLines(params.focusDistrictId);
  const characterLine =
    panelLines.length > 0 ? panelLines.join('\n') : undefined;
  const identityRiskChips = buildDistrictRiskChips(params.focusDistrictId, 3);
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

  const focusAreaId =
    pilotAreaFromMapDistrict(params.focusDistrictId) ?? params.pilotAreaId;
  const focusPreset = getPilotPreset(focusAreaId);
  const summaryDescription =
    characterLine?.replace(/\n/g, ' ') ?? focusPreset.character;
  const riskMetrics = buildDistrictRiskSummaryMetrics(
    params.focusDistrictId,
    params.pilotAreaId,
  );

  return {
    visible: true,
    districtId: params.focusDistrictId,
    districtLabel,
    characterLine: characterLine ?? undefined,
    summaryDescription,
    identityRiskChips,
    riskLabel: getRiskDensityLabel(focusPreset.riskDensity),
    riskTone: resolveRiskTone(focusPreset.riskDensity),
    activeEventCount,
    activeEventsPillLabel:
      activeEventCount > 0
        ? `${activeEventCount} aktif olay`
        : 'Gündem sakin',
    agendaSignalLine:
      params.postPilotMapContextLine && activeEventCount > 0
        ? params.postPilotMapContextLine
        : undefined,
    sahaNote:
      params.postPilotMapContextLine && activeEventCount > 0
        ? undefined
        : params.dayEventTitle,
    metrics: metrics.slice(0, 3),
    riskMetrics,
    recommendedAction: focusPreset.recommendedAction
      ? `Önerilen Aksiyon: ${focusPreset.recommendedAction}`
      : undefined,
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
    panel.characterLine ?? '',
    ...(panel.identityRiskChips?.map((chip) => chip.label) ?? []),
    panel.riskLabel,
    panel.agendaSignalLine ?? '',
    panel.sahaNote ?? '',
    ...panel.metrics.map((metric) => `${metric.label} ${metric.value}`),
    panel.ctaLabel,
    panel.summaryDescription ?? '',
    panel.recommendedAction ?? '',
    panel.activeEventsPillLabel,
    ...panel.riskMetrics.map(
      (metric) => `${metric.label} ${metric.value} ${metric.sublabel}`,
    ),
  ].filter(Boolean);
}

export const MAP_UI_LAYOUT_GUARDS = {
  markerLabelNumberOfLines: 1,
  bottomPanelNumberOfLines: 2,
  stripLabelNumberOfLines: 1,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;
