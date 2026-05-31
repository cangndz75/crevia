import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ReportHeaderModel } from '@/features/reports/presentation/reportScreenPresentation';
import type { GameStatusSnapshot } from '@/store/gameSelectors';

import { CREVIA_MAP_PILOT_MINI_ASSETS } from '@/core/assets/creviaAssets';

import type { DistrictRiskSummaryMetric } from '../utils/mapUiPresentation';
import { getDayEvent, getPilotPreset } from '../data/mapSelectors';
import type { ActiveOperation, MapFilterId, PilotAreaId } from '../types/map';

export type MapScreenHeaderModel = ReportHeaderModel;

export type MapFilterChipItem = {
  id: string;
  label: string;
  filterId?: MapFilterId;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant: 'filled' | 'outline';
  showChevron?: boolean;
};

export type MapHeroModel = {
  selectedDistrictName: string;
  selectedDistrictLabel: string;
  riskLabel: string;
  activeEventCount: number;
};

export type MapOperationSignalModel = {
  eyebrow: string;
  title: string;
  districtLabel: string;
  startsAtLabel: string;
  teamLabel: string;
  vehicleLabel: string;
  description: string;
  actionLabel: string;
  ctaLabel: string;
  crewInitials: string[];
  extraCrewCount: number;
};

export type MapPilotDistrictMetric = {
  id: string;
  label: string;
  value: string;
  tone: 'teal' | 'gold' | 'red' | 'purple';
  progress: number;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export type MapPilotDistrictStatusModel = {
  title: string;
  subtitle: string;
  metrics: MapPilotDistrictMetric[];
  suggestionLabel: string;
  miniMapAsset: number;
};

function metricToneFromValue(value: string): MapPilotDistrictMetric['tone'] {
  const normalized = value.toLowerCase();
  if (normalized.includes('yüksek')) return 'red';
  if (normalized.includes('orta')) return 'gold';
  return 'teal';
}

function metricIconFromKey(
  key: DistrictRiskSummaryMetric['key'],
): ComponentProps<typeof Ionicons>['name'] {
  if (key === 'social') return 'people-outline';
  if (key === 'personnel') return 'person-outline';
  return 'flash-outline';
}

const MINI_MAP_ASSETS: Record<PilotAreaId, number> = CREVIA_MAP_PILOT_MINI_ASSETS;

export function buildMapScreenHeaderModel(
  status: GameStatusSnapshot,
  gameDay: number,
): MapScreenHeaderModel {
  const districtShort =
    status.selectedDistrictName.split(' ')[0] ?? status.selectedDistrictName;
  return {
    title: 'Harita',
    level: status.level,
    levelLabel: `Seviye ${status.level}`,
    metaLine: `${gameDay}. Gün • ${districtShort}`,
    resourceValue: status.sourceShort,
    resourceLabel: 'Kaynak',
    xpCurrent: status.xp,
    xpTarget: status.xpTarget,
    xpProgress: status.xpProgress,
  };
}

export function buildMapFilterChipItems(params: {
  gameDay: number;
  districtLabel: string;
  selectedFilter: MapFilterId;
}): MapFilterChipItem[] {
  return [
    {
      id: 'day',
      label: `Gün ${params.gameDay}`,
      icon: 'calendar-outline',
      variant: 'filled',
    },
    {
      id: 'district',
      label: params.districtLabel,
      icon: 'business-outline',
      variant: 'outline',
      showChevron: true,
    },
    {
      id: 'risk',
      label: 'Risk',
      filterId: 'risk',
      icon: 'warning-outline',
      variant: params.selectedFilter === 'risk' ? 'filled' : 'outline',
      showChevron: true,
    },
    {
      id: 'crews',
      label: 'Ekipler',
      filterId: 'crews',
      icon: 'people-outline',
      variant: params.selectedFilter === 'crews' ? 'filled' : 'outline',
    },
  ];
}

export function buildMapHeroModel(params: {
  pilotAreaId: PilotAreaId;
  focusDistrictName: string;
  activeEventCount: number;
}): MapHeroModel {
  const preset = getPilotPreset(params.pilotAreaId);
  const riskDensity = preset.riskDensity;
  const riskLabel =
    riskDensity >= 60 ? 'Yüksek Risk' : riskDensity >= 40 ? 'Orta Risk' : 'Düşük Risk';

  return {
    selectedDistrictName: params.focusDistrictName,
    selectedDistrictLabel: preset.shortName,
    riskLabel,
    activeEventCount: params.activeEventCount,
  };
}

export function buildMapOperationSignalModel(params: {
  operation: ActiveOperation;
  pilotAreaId: PilotAreaId;
  gameDay: number;
  crewNames?: string[];
}): MapOperationSignalModel {
  const dayEvent = getDayEvent(params.pilotAreaId, params.gameDay);
  const crewInitials = (params.crewNames ?? [])
    .slice(0, 3)
    .map((name) => name.trim().charAt(0).toUpperCase())
    .filter(Boolean);
  const totalCrew = params.operation.crewCount;
  const extraCrewCount = Math.max(0, totalCrew - crewInitials.length);

  return {
    eyebrow: 'Operasyon sinyali',
    title: params.operation.name,
    districtLabel: params.operation.district,
    startsAtLabel: `Başlangıç: ${params.operation.startTime}`,
    teamLabel: `Ekip: ${params.operation.crewCount}`,
    vehicleLabel: `Araç: ${params.operation.vehicleCount}`,
    description: dayEvent.mainEventDescription,
    actionLabel: params.operation.recommendedAction ?? 'Rota ve araç planını güncelle',
    ctaLabel: 'Takip Et',
    crewInitials,
    extraCrewCount,
  };
}

export function buildMapPilotDistrictStatusModel(params: {
  pilotAreaId: PilotAreaId;
  gameDay: number;
  riskMetrics: DistrictRiskSummaryMetric[];
}): MapPilotDistrictStatusModel {
  const preset = getPilotPreset(params.pilotAreaId);

  return {
    title: 'Pilot bölge durumu',
    subtitle: `${preset.name} • Gün ${params.gameDay}/7`,
    metrics: params.riskMetrics.map((metric) => ({
      id: metric.key,
      label: metric.label,
      value: metric.value,
      tone: metricToneFromValue(metric.value),
      progress: metric.progress,
      icon: metricIconFromKey(metric.key),
    })),
    suggestionLabel: preset.recommendedAction,
    miniMapAsset: MINI_MAP_ASSETS[params.pilotAreaId],
  };
}
