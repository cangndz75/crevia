import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import { resolveFirstTenMinutesDay } from '@/core/onboarding/firstTenMinutesPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  derivePersonnelPressure,
  deriveVehiclePressure,
  getOperationalResourceStatus,
} from './operationalResourceState';
import {
  canShowOperationalResourceDetailCta,
} from './operationalResourceDetailPresentation';
import {
  CONTAINER_NETWORK_DISTRICT_LABELS,
  OPERATIONAL_RESOURCE_HUB_COPY,
  OPERATIONAL_RESOURCE_HUB_MAX_ROWS,
  OPERATIONAL_RESOURCE_REPORT_COPY,
  OPERATIONAL_RESOURCE_REPORT_MAX_LINES,
  OPERATIONAL_RESOURCE_STATUS_LABELS,
  PERSONNEL_GROUP_DEFINITIONS,
  VEHICLE_GROUP_DEFINITIONS,
} from './operationalResourceConstants';
import {
  buildOperationalResourceEngineInputFromStore,
  getDistrictContainerNetworkSummary,
  getRecommendedResourceForEvent,
} from './operationalResourceEngine';
import type {
  OperationalResourceEngineInput,
  OperationalResourcesState,
  PersonnelGroupId,
  VehicleGroupId,
} from './operationalResourceTypes';

export type OperationalResourceHubRow = {
  key: string;
  label: string;
  value: string;
  tone: 'neutral' | 'positive' | 'warning' | 'critical';
};

export type OperationalResourceHubModel = {
  visible: boolean;
  compact: boolean;
  title: string;
  subtitle: string;
  rows: OperationalResourceHubRow[];
  showDetailCta: boolean;
  detailCtaLabel: string;
};

export type OperationalResourceReportModel = {
  visible: boolean;
  compact: boolean;
  title: string;
  lines: string[];
  educationalLine?: string;
};

export type AssignmentResourceFitModel = {
  visible: boolean;
  line?: string;
  tone: 'neutral' | 'positive' | 'warning';
  compatibilityBonus: number;
};

function resolveVisibilityMode(gameState: GameState): 'hidden' | 'compact' | 'normal' {
  const day = resolveFirstTenMinutesDay(gameState);
  if (day <= 1) return 'hidden';
  if (day <= 2) return 'compact';
  return 'normal';
}

function toneFromStatus(
  status: ReturnType<typeof getOperationalResourceStatus>,
): OperationalResourceHubRow['tone'] {
  if (status === 'stable') return 'positive';
  if (status === 'busy') return 'neutral';
  if (status === 'strained') return 'warning';
  return 'critical';
}

function pickBusiestPersonnelLine(state: OperationalResourcesState): OperationalResourceHubRow {
  let bestId: PersonnelGroupId = 'field_team';
  let bestScore = -1;
  for (const id of Object.keys(state.personnelGroups) as PersonnelGroupId[]) {
    const g = state.personnelGroups[id];
    const score = derivePersonnelPressure(g);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  const g = state.personnelGroups[bestId];
  const label = PERSONNEL_GROUP_DEFINITIONS[bestId].label;
  return {
    key: 'personnel',
    label: OPERATIONAL_RESOURCE_HUB_COPY.personnelPrefix,
    value: `${label}: ${OPERATIONAL_RESOURCE_STATUS_LABELS[g.status].toLowerCase()}`,
    tone: toneFromStatus(g.status),
  };
}

function pickBusiestVehicleLine(state: OperationalResourcesState): OperationalResourceHubRow {
  let bestId: VehicleGroupId = 'standard_truck';
  let bestScore = -1;
  for (const id of Object.keys(state.vehicleGroups) as VehicleGroupId[]) {
    const g = state.vehicleGroups[id];
    const score = deriveVehiclePressure(g);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  const g = state.vehicleGroups[bestId];
  const label = VEHICLE_GROUP_DEFINITIONS[bestId].label;
  return {
    key: 'vehicles',
    label: OPERATIONAL_RESOURCE_HUB_COPY.vehiclePrefix,
    value: `${label}: ${OPERATIONAL_RESOURCE_STATUS_LABELS[g.status].toLowerCase()}`,
    tone: toneFromStatus(g.status),
  };
}

function pickContainerLine(state: OperationalResourcesState): OperationalResourceHubRow {
  let bestId = 'merkez';
  let bestScore = -1;
  for (const [districtId, network] of Object.entries(state.containerNetworksByDistrictId)) {
    const score =
      network.fillPressure +
      network.cleanlinessPressure +
      network.maintenancePressure +
      network.socialPressure;
    if (score > bestScore) {
      bestScore = score;
      bestId = districtId;
    }
  }
  const network = state.containerNetworksByDistrictId[bestId]!;
  const label = CONTAINER_NETWORK_DISTRICT_LABELS[bestId] ?? bestId;
  return {
    key: 'containers',
    label: OPERATIONAL_RESOURCE_HUB_COPY.containerPrefix,
    value: `${label}: ${OPERATIONAL_RESOURCE_STATUS_LABELS[network.status].toLowerCase()}`,
    tone: toneFromStatus(network.status),
  };
}

export function buildOperationalResourceHubModel(
  input: OperationalResourceEngineInput,
): OperationalResourceHubModel {
  const mode = resolveVisibilityMode(input.gameState);
  const full =
    input.monetization != null &&
    isFullMainOperationAccess(input.gameState, input.monetization);
  const state = input.operationalResources;

  if (mode === 'hidden') {
    return {
      visible: false,
      compact: true,
      title: OPERATIONAL_RESOURCE_HUB_COPY.title,
      subtitle: OPERATIONAL_RESOURCE_HUB_COPY.subtitle,
      rows: [],
      showDetailCta: false,
      detailCtaLabel: OPERATIONAL_RESOURCE_HUB_COPY.detailCta,
    };
  }

  const rows = [
    pickBusiestPersonnelLine(state),
    pickBusiestVehicleLine(state),
    pickContainerLine(state),
  ].slice(0, OPERATIONAL_RESOURCE_HUB_MAX_ROWS);

  const showDetailCta = canShowOperationalResourceDetailCta(input);

  return {
    visible: true,
    compact: mode === 'compact' && !full,
    title: OPERATIONAL_RESOURCE_HUB_COPY.title,
    subtitle: OPERATIONAL_RESOURCE_HUB_COPY.subtitle,
    rows,
    showDetailCta,
    detailCtaLabel: OPERATIONAL_RESOURCE_HUB_COPY.detailCta,
  };
}

function isAllOperationalResourcesStable(state: OperationalResourcesState): boolean {
  const personnelOk = Object.values(state.personnelGroups).every(
    (g) => g.status === 'stable',
  );
  const vehiclesOk = Object.values(state.vehicleGroups).every((g) => g.status === 'stable');
  const containersOk = Object.values(state.containerNetworksByDistrictId).every(
    (n) => n.status === 'stable',
  );
  return personnelOk && vehiclesOk && containersOk;
}

export function buildOperationalResourceReportModel(
  input: OperationalResourceEngineInput,
  reportDay: number,
): OperationalResourceReportModel {
  const mode = resolveVisibilityMode(input.gameState);
  const day = resolveFirstTenMinutesDay(input.gameState);

  if (mode === 'hidden' || reportDay <= 1) {
    return {
      visible: day <= 1,
      compact: true,
      title: OPERATIONAL_RESOURCE_REPORT_COPY.title,
      lines: [],
      educationalLine: OPERATIONAL_RESOURCE_REPORT_COPY.day1Educational,
    };
  }

  const state = input.operationalResources;
  if (isAllOperationalResourcesStable(state)) {
    return {
      visible: true,
      compact: mode === 'compact',
      title: OPERATIONAL_RESOURCE_REPORT_COPY.title,
      lines: ['Saha kaynakları dengeli kaldı.'],
    };
  }

  const summary = state.dailySummary;
  const lines = summary
    ? [summary.personnelLine, summary.vehicleLine, summary.containerLine, ...summary.warnings]
        .filter((l) => l.length > 0)
        .slice(0, OPERATIONAL_RESOURCE_REPORT_MAX_LINES)
    : [];

  return {
    visible: lines.length > 0,
    compact: mode === 'compact',
    title: OPERATIONAL_RESOURCE_REPORT_COPY.title,
    lines,
  };
}

export function buildAssignmentResourceFitLine(
  gameState: GameState,
  event: EventCard,
  assignment: EventAssignmentState,
  operationalResources: OperationalResourcesState,
): AssignmentResourceFitModel {
  if (resolveFirstTenMinutesDay(gameState) <= 1) {
    return { visible: false, tone: 'neutral', compatibilityBonus: 0 };
  }

  const recommended = getRecommendedResourceForEvent(gameState, event);
  let line: string | undefined;
  let tone: AssignmentResourceFitModel['tone'] = 'neutral';
  let bonus = 0;

  const personnelId = mapAssignmentPersonnel(assignment.personnelType);
  if (personnelId) {
    const group = operationalResources.personnelGroups[personnelId];
    if (group.status === 'stable' || group.status === 'busy') {
      bonus += 3;
      if (recommended.personnelGroupId === personnelId) {
        tone = 'positive';
      }
    }
    if (group.status === 'critical' || group.status === 'strained') {
      bonus -= group.status === 'critical' ? 4 : 2;
      tone = 'warning';
      if (personnelId === 'technical_team') {
        line =
          'Teknik ekip baskı altında; kalıcı çözüm daha maliyetli olabilir.';
      } else {
        line = `${group.label} baskı altında; atama maliyeti artabilir.`;
      }
    }
  }

  const vehicleId = mapAssignmentVehicle(assignment.vehicleType);
  if (vehicleId && !line) {
    const group = operationalResources.vehicleGroups[vehicleId];
    if (group.status === 'critical') {
      bonus -= 4;
      tone = 'warning';
      line = 'Bakım aracı risk altında; rota desteği daha güvenli olabilir.';
    }
  }

  const districtId = event.neighborhoodId;
  if (districtId && !line) {
    const network = operationalResources.containerNetworksByDistrictId[districtId];
    if (network && (network.status === 'strained' || network.status === 'critical')) {
      tone = 'warning';
      line = 'Bu mahallede konteyner ağı baskı altında.';
      bonus -= 2;
    }
  }

  if (!line && recommended.personnelGroupId) {
    line = recommended.reason;
    tone = 'neutral';
  }

  return {
    visible: Boolean(line),
    line,
    tone,
    compatibilityBonus: Math.max(-4, Math.min(3, bonus)),
  };
}

function mapAssignmentPersonnel(
  type: EventAssignmentState['personnelType'],
): PersonnelGroupId | null {
  switch (type) {
    case 'field_response_team':
    case 'inspection_team':
      return 'field_team';
    case 'technical_team':
      return 'technical_team';
    case 'public_relations_team':
      return 'public_relations_team';
    default:
      return null;
  }
}

function mapAssignmentVehicle(
  type: EventAssignmentState['vehicleType'],
): VehicleGroupId | null {
  switch (type) {
    case 'standard_truck':
    case 'high_capacity_vehicle':
      return 'standard_truck';
    case 'maintenance_vehicle':
      return 'maintenance_vehicle';
    case 'route_support_vehicle':
    case 'compact_service_vehicle':
      return 'route_support_vehicle';
    default:
      return null;
  }
}

export function buildOperationalResourceAdvisorLine(
  input: OperationalResourceEngineInput,
  advisorLevel: number,
): string | undefined {
  if (resolveFirstTenMinutesDay(input.gameState) <= 1) return undefined;

  const state = input.operationalResources;
  const technical = state.personnelGroups.technical_team;
  const maintenance = state.vehicleGroups.maintenance_vehicle;
  const container = pickContainerLine(state);

  if (advisorLevel <= 1) {
    if (technical.status === 'strained' || technical.status === 'critical') {
      return 'Teknik ekip yoğun. Bugün kalıcı çözüm seçersen yarın yorgunluk artabilir.';
    }
    return undefined;
  }
  if (advisorLevel === 2) {
    if (maintenance.status === 'stable' || maintenance.status === 'busy') {
      return 'Bakım aracı dengeli olduğu için önleyici bakım hamlesi güvenli görünüyor.';
    }
    if (technical.status === 'strained' || technical.status === 'critical') {
      return 'Teknik ekip yoğun. Bugün kalıcı çözüm seçersen yarın yorgunluk artabilir.';
    }
    return undefined;
  }
  if (container.tone === 'warning' || container.tone === 'critical') {
    const districtLabel = container.value.split(':')[0] ?? 'Mahalle';
    return `${districtLabel} konteyner ağı baskı altında; düşük kaynak seçimi tekrar riskini artırabilir.`;
  }
  return undefined;
}

export function buildDailyPlanResourceHintLine(
  input: OperationalResourceEngineInput,
): string | undefined {
  if (resolveFirstTenMinutesDay(input.gameState) <= 1) return undefined;
  if (resolveFirstTenMinutesDay(input.gameState) === 2) {
    const field = input.operationalResources.personnelGroups.field_team;
    return `Saha ekibi ${OPERATIONAL_RESOURCE_STATUS_LABELS[field.status].toLowerCase()}.`;
  }
  const state = input.operationalResources;
  const field = state.personnelGroups.field_team;
  const maintenance = state.vehicleGroups.maintenance_vehicle;
  if (maintenance.status === 'strained' || maintenance.status === 'critical') {
    return 'Bakım aracı riskini düşürür; rota planını gözden geçir.';
  }
  if (field.status === 'strained' || field.status === 'critical') {
    return 'Saha ekibi yorgunluğu artabilir; hafif plan tercih edilebilir.';
  }
  return `Saha ekibi ${OPERATIONAL_RESOURCE_STATUS_LABELS[field.status].toLowerCase()}, bakım aracı ${OPERATIONAL_RESOURCE_STATUS_LABELS[maintenance.status].toLowerCase()}.`;
}

export {
  buildOperationalResourceDetailSheetModel,
  buildPersonnelDetailRows,
  buildVehicleDetailRows,
  buildContainerNetworkDetailRows,
  canShowOperationalResourceDetailCta,
  getResourceToneFromStatus,
  getResourceStatusLabel,
  buildOperationalResourceRecommendationLine,
} from './operationalResourceDetailPresentation';

export {
  buildOperationalResourceEngineInputFromStore,
  getDistrictContainerNetworkSummary,
};
