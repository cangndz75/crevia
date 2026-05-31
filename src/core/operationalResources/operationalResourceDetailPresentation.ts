import { resolveFirstTenMinutesDay } from '@/core/onboarding/firstTenMinutesPresentation';

import {
  CONTAINER_NETWORK_DISTRICT_IDS,
  CONTAINER_NETWORK_DISTRICT_LABELS,
  OPERATIONAL_RESOURCE_DETAIL_COPY,
  OPERATIONAL_RESOURCE_HUB_COPY,
  OPERATIONAL_RESOURCE_STATUS_LABELS,
  PERSONNEL_GROUP_DEFINITIONS,
  VEHICLE_GROUP_DEFINITIONS,
} from './operationalResourceConstants';
import { getOperationalResourceStatus } from './operationalResourceState';
import type {
  OperationalContainerNetworkDetailRow,
  OperationalPersonnelDetailRow,
  OperationalResourceDetailSheetModel,
  OperationalResourceDetailTabId,
  OperationalResourceEngineInput,
  OperationalResourcePresentationTone,
  OperationalResourcesState,
  OperationalVehicleDetailRow,
  PersonnelGroupId,
  PersonnelGroupState,
  VehicleGroupId,
  VehicleGroupState,
  DistrictContainerNetworkState,
} from './operationalResourceTypes';

const PERSONNEL_ICON_KEYS: Record<PersonnelGroupId, string> = {
  field_team: 'walk',
  technical_team: 'construct',
  public_relations_team: 'megaphone',
};

const VEHICLE_ICON_KEYS: Record<VehicleGroupId, string> = {
  standard_truck: 'bus',
  maintenance_vehicle: 'build',
  route_support_vehicle: 'navigate',
};

const CONTAINER_ICON_KEYS: Record<string, string> = {
  merkez: 'city',
  cumhuriyet: 'home',
  sanayi: 'factory',
  istasyon: 'route',
  yesilvadi: 'leaf',
};

const PERSONNEL_TAB_ORDER: PersonnelGroupId[] = [
  'field_team',
  'technical_team',
  'public_relations_team',
];

const VEHICLE_TAB_ORDER: VehicleGroupId[] = [
  'standard_truck',
  'maintenance_vehicle',
  'route_support_vehicle',
];

function toneFromStatus(
  status: PersonnelGroupState['status'],
): OperationalResourcePresentationTone {
  if (status === 'stable') return 'positive';
  if (status === 'busy') return 'neutral';
  if (status === 'strained') return 'warning';
  return 'critical';
}

function statusRank(status: PersonnelGroupState['status']): number {
  if (status === 'critical') return 4;
  if (status === 'strained') return 3;
  if (status === 'busy') return 2;
  if (status === 'stable') return 1;
  return 0;
}

export function getResourceToneFromStatus(
  status: PersonnelGroupState['status'],
): OperationalResourcePresentationTone {
  return toneFromStatus(status);
}

export function getResourceStatusLabel(status: PersonnelGroupState['status']): string {
  return OPERATIONAL_RESOURCE_STATUS_LABELS[status];
}

function metricChip(score: number, prefix: string): string {
  const status = getOperationalResourceStatus(score);
  return `${prefix}: ${OPERATIONAL_RESOURCE_STATUS_LABELS[status]}`;
}

export function buildOperationalResourceRecommendationLine(params: {
  status: PersonnelGroupState['status'];
  domain: 'personnel' | 'vehicles' | 'containers';
  label: string;
}): string {
  const { status, domain, label } = params;
  if (status === 'stable') {
    return `${label} mevcut plan ve atama ile dengeli görünüyor.`;
  }
  if (status === 'busy') {
    return `${label} bugünkü kullanımda; yoğunluk artarsa yarına taşınabilir.`;
  }
  if (status === 'strained') {
    if (domain === 'personnel') {
      return 'Yarın yorgunluk veya baskı taşınabilir; atama maliyetini izle.';
    }
    if (domain === 'vehicles') {
      return 'Bakım baskısı artarsa rota desteği daha güvenli olabilir.';
    }
    return 'Düşük kaynak seçimi tekrar riskini artırabilir.';
  }
  return 'Önerilen atama ve günlük planı gözden geçir.';
}

function buildPersonnelUsageLine(group: PersonnelGroupState): string {
  return group.usedToday
    ? 'Bugünkü kullanım: Aktif'
    : 'Bugünkü kullanım: Düşük';
}

function buildVehicleUsageLine(group: VehicleGroupState): string {
  return group.usedToday
    ? 'Bugünkü kullanım: Sahada'
    : 'Bugünkü kullanım: Beklemede';
}

export function buildPersonnelDetailRows(
  operationalResources: OperationalResourcesState,
): OperationalPersonnelDetailRow[] {
  return PERSONNEL_TAB_ORDER.map((id) => {
    const group = operationalResources.personnelGroups[id];
    const def = PERSONNEL_GROUP_DEFINITIONS[id];
    return {
      id,
      label: group.label || def.label,
      statusLabel: getResourceStatusLabel(group.status),
      tone: toneFromStatus(group.status),
      workloadLabel: metricChip(group.workloadScore, 'İş yükü'),
      fatigueLabel: metricChip(group.fatigueScore, 'Yorgunluk'),
      moraleLabel: metricChip(group.moraleScore, 'Moral'),
      summary: group.summary || def.summary,
      usageLine: buildPersonnelUsageLine(group),
      recommendationLine: buildOperationalResourceRecommendationLine({
        status: group.status,
        domain: 'personnel',
        label: group.label || def.label,
      }),
      iconKey: PERSONNEL_ICON_KEYS[id],
    };
  });
}

export function buildVehicleDetailRows(
  operationalResources: OperationalResourcesState,
): OperationalVehicleDetailRow[] {
  return VEHICLE_TAB_ORDER.map((id) => {
    const group = operationalResources.vehicleGroups[id];
    const def = VEHICLE_GROUP_DEFINITIONS[id];
    return {
      id,
      label: group.label || def.label,
      statusLabel: getResourceStatusLabel(group.status),
      tone: toneFromStatus(group.status),
      capacityLabel: metricChip(group.capacityPressure, 'Kapasite'),
      maintenanceLabel: metricChip(group.maintenanceRisk, 'Bakım'),
      routeLabel: metricChip(group.routePressure, 'Rota'),
      summary: group.summary || def.summary,
      usageLine: buildVehicleUsageLine(group),
      recommendationLine: buildOperationalResourceRecommendationLine({
        status: group.status,
        domain: 'vehicles',
        label: group.label || def.label,
      }),
      iconKey: VEHICLE_ICON_KEYS[id],
    };
  });
}

export function buildContainerNetworkDetailRows(
  operationalResources: OperationalResourcesState,
): OperationalContainerNetworkDetailRow[] {
  return CONTAINER_NETWORK_DISTRICT_IDS.map((districtId) => {
    const network =
      operationalResources.containerNetworksByDistrictId[districtId] ??
      operationalResources.containerNetworksByDistrictId.merkez!;
    const label = CONTAINER_NETWORK_DISTRICT_LABELS[districtId] ?? districtId;
    return {
      districtId,
      label,
      statusLabel: getResourceStatusLabel(network.status),
      tone: toneFromStatus(network.status),
      fillLabel: metricChip(network.fillPressure, 'Doluluk'),
      cleanlinessLabel: metricChip(network.cleanlinessPressure, 'Temizlik'),
      maintenanceLabel: metricChip(network.maintenancePressure, 'Bakım'),
      socialLabel: metricChip(network.socialPressure, 'Sosyal'),
      summary: network.summary,
      recommendationLine: buildOperationalResourceRecommendationLine({
        status: network.status,
        domain: 'containers',
        label,
      }),
      iconKey: CONTAINER_ICON_KEYS[districtId] ?? 'factory',
    };
  });
}

function tabSummaryForPersonnel(state: OperationalResourcesState): {
  summary: string;
  tone: OperationalResourcePresentationTone;
} {
  const strained = Object.values(state.personnelGroups).filter(
    (g) => g.status === 'strained' || g.status === 'critical',
  ).length;
  if (strained > 0) {
    return { summary: `${strained} ekip baskı altında`, tone: 'warning' };
  }
  const busy = Object.values(state.personnelGroups).filter((g) => g.status === 'busy').length;
  if (busy > 0) {
    return { summary: `${busy} ekip yoğun`, tone: 'neutral' };
  }
  return { summary: 'Ekip dengesi normal', tone: 'positive' };
}

function tabSummaryForVehicles(state: OperationalResourcesState): {
  summary: string;
  tone: OperationalResourcePresentationTone;
} {
  const maintenance = state.vehicleGroups.maintenance_vehicle;
  if (maintenance.status === 'critical' || maintenance.status === 'strained') {
    return { summary: 'Bakım aracı izlenmeli', tone: 'warning' };
  }
  return { summary: 'Filo dengesi normal', tone: 'positive' };
}

function tabSummaryForContainers(state: OperationalResourcesState): {
  summary: string;
  tone: OperationalResourcePresentationTone;
} {
  const pressed = Object.values(state.containerNetworksByDistrictId).filter(
    (n) => n.status === 'strained' || n.status === 'critical',
  ).length;
  if (pressed > 0) {
    return { summary: `${pressed} hat baskı altında`, tone: 'warning' };
  }
  return { summary: 'Konteyner ağı dengeli', tone: 'positive' };
}

function resolveDefaultDetailTab(
  state: OperationalResourcesState,
): OperationalResourceDetailTabId {
  let best: OperationalResourceDetailTabId = 'personnel';
  let bestRank = -1;

  for (const id of PERSONNEL_TAB_ORDER) {
    const rank = statusRank(state.personnelGroups[id].status);
    if (rank > bestRank) {
      bestRank = rank;
      best = 'personnel';
    }
  }
  for (const id of VEHICLE_TAB_ORDER) {
    const rank = statusRank(state.vehicleGroups[id].status);
    if (rank > bestRank) {
      bestRank = rank;
      best = 'vehicles';
    }
  }
  for (const districtId of CONTAINER_NETWORK_DISTRICT_IDS) {
    const network = state.containerNetworksByDistrictId[districtId];
    if (!network) continue;
    const rank = statusRank(network.status);
    if (rank > bestRank) {
      bestRank = rank;
      best = 'containers';
    }
  }
  return best;
}

export function buildOperationalResourceDetailSheetModel(
  input: OperationalResourceEngineInput,
): OperationalResourceDetailSheetModel | null {
  if (resolveFirstTenMinutesDay(input.gameState) <= 1) {
    return null;
  }

  const state = input.operationalResources;
  const personnelSummary = tabSummaryForPersonnel(state);
  const vehicleSummary = tabSummaryForVehicles(state);
  const containerSummary = tabSummaryForContainers(state);

  return {
    title: OPERATIONAL_RESOURCE_HUB_COPY.title,
    subtitle: OPERATIONAL_RESOURCE_HUB_COPY.subtitle,
    defaultTabId: resolveDefaultDetailTab(state),
    tabs: [
      {
        id: 'personnel',
        label: OPERATIONAL_RESOURCE_DETAIL_COPY.tabPersonnel,
        summary: personnelSummary.summary,
        tone: personnelSummary.tone,
      },
      {
        id: 'vehicles',
        label: OPERATIONAL_RESOURCE_DETAIL_COPY.tabVehicles,
        summary: vehicleSummary.summary,
        tone: vehicleSummary.tone,
      },
      {
        id: 'containers',
        label: OPERATIONAL_RESOURCE_DETAIL_COPY.tabContainers,
        summary: containerSummary.summary,
        tone: containerSummary.tone,
      },
    ],
    personnelRows: buildPersonnelDetailRows(state),
    vehicleRows: buildVehicleDetailRows(state),
    containerRows: buildContainerNetworkDetailRows(state),
    footerNote: OPERATIONAL_RESOURCE_DETAIL_COPY.footerNote,
  };
}

export function canShowOperationalResourceDetailCta(
  input: OperationalResourceEngineInput,
): boolean {
  return buildOperationalResourceDetailSheetModel(input) != null;
}
