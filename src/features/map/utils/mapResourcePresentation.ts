import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import { resolveFirstTenMinutesDay } from '@/core/onboarding/firstTenMinutesPresentation';
import {
  buildPersonnelDetailRows,
  buildVehicleDetailRows,
} from '@/core/operationalResources/operationalResourceDetailPresentation';
import { buildOperationalResourceEngineInputFromStore } from '@/core/operationalResources/operationalResourceEngine';
import type { OperationalResourceEngineInput } from '@/core/operationalResources/operationalResourceTypes';
import { CONTAINER_NETWORK_DISTRICT_LABELS } from '@/core/operationalResources/operationalResourceConstants';
import {
  buildOperationalResourcePresenceLiteInputFromEngine,
  buildOperationalResourcePresenceLiteModel,
  buildOperationalResourcePresenceMapLine,
} from '@/core/operationalResourcePresence';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { CrisisActionState } from '@/core/crisisActions/crisisActionTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';

import type { MapDistrictId } from '../data/mapDistrictConstants';
import type { MapCrisisPanelLine } from './mapUiPresentation';

export type MapResourcePanelLine = {
  id: string;
  title: string;
  summary: string;
  tone: 'neutral' | 'warning' | 'critical' | 'positive';
  iconKey: string;
  relatedDistrictIds: string[];
};

export type MapResourceDistrictBadge = {
  districtId: string;
  label: string;
  tone: 'neutral' | 'warning' | 'critical' | 'positive';
  iconKey: string;
};

export type MapResourcePresentation = {
  visible: boolean;
  panelLines: MapResourcePanelLine[];
  districtBadges: Record<string, MapResourceDistrictBadge>;
  highlightedDistrictIds: string[];
};

function hasResourcePressure(state: OperationalResourcesState): boolean {
  const personnel = Object.values(state.personnelGroups).some(
    (g) => g.status === 'busy' || g.status === 'strained' || g.status === 'critical',
  );
  const vehicles = Object.values(state.vehicleGroups).some(
    (g) => g.status === 'busy' || g.status === 'strained' || g.status === 'critical',
  );
  const containers = Object.values(state.containerNetworksByDistrictId).some(
    (n) => n.status === 'busy' || n.status === 'strained' || n.status === 'critical',
  );
  return personnel || vehicles || containers;
}

function isAllResourcesStable(state: OperationalResourcesState): boolean {
  const personnel = Object.values(state.personnelGroups).every((g) => g.status === 'stable');
  const vehicles = Object.values(state.vehicleGroups).every((g) => g.status === 'stable');
  const containers = Object.values(state.containerNetworksByDistrictId).every(
    (n) => n.status === 'stable',
  );
  return personnel && vehicles && containers;
}

export function shouldShowMapResourceOverlay(input: OperationalResourceEngineInput): boolean {
  const day = resolveFirstTenMinutesDay(input.gameState);
  if (day <= 2) return false;
  if (isAllResourcesStable(input.operationalResources)) return false;
  return hasResourcePressure(input.operationalResources);
}

function resolveMapResourceLineCap(input: OperationalResourceEngineInput): number {
  const day = resolveFirstTenMinutesDay(input.gameState);
  if (day <= 2) return 0;
  const full =
    input.monetization != null &&
    isFullMainOperationAccess(input.gameState, input.monetization);
  if (!full) return 1;
  return 2;
}

export function getMostPressedContainerDistrict(
  state: OperationalResourcesState,
): string | undefined {
  let bestId: string | undefined;
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
  return bestId;
}

export function getMostPressedPersonnelLine(
  input: OperationalResourceEngineInput,
): MapResourcePanelLine | undefined {
  const rows = buildPersonnelDetailRows(input.operationalResources);
  const filtered = rows.filter((r) => r.tone === 'warning' || r.tone === 'critical');
  if (filtered.length === 0) return undefined;
  const rank = (tone: typeof filtered[0]['tone']) => (tone === 'critical' ? 2 : 1);
  filtered.sort((a, b) => rank(b.tone) - rank(a.tone));
  const row = filtered[0]!;
  return {
    id: `personnel-${row.id}`,
    title: 'Ekip durumu',
    summary: `${row.label} yoğun kullanıldı.`,
    tone: row.tone === 'critical' ? 'critical' : 'warning',
    iconKey: row.iconKey,
    relatedDistrictIds: [],
  };
}

export function getMostPressedVehicleLine(
  input: OperationalResourceEngineInput,
): MapResourcePanelLine | undefined {
  const rows = buildVehicleDetailRows(input.operationalResources);
  const row = rows.find((r) => r.id === 'maintenance_vehicle') ?? rows[0];
  if (!row || (row.tone !== 'warning' && row.tone !== 'critical')) {
    const alt = rows.find((r) => r.tone === 'warning' || r.tone === 'critical');
    if (!alt) return undefined;
    return {
      id: `vehicle-${alt.id}`,
      title: 'Filo dengesi',
      summary:
        alt.id === 'maintenance_vehicle'
          ? 'Bakım aracı izlemeye yakın.'
          : `${alt.label} baskı altında.`,
      tone: alt.tone === 'critical' ? 'critical' : 'warning',
      iconKey: alt.iconKey,
      relatedDistrictIds: [],
    };
  }
  return {
    id: `vehicle-${row.id}`,
    title: 'Filo dengesi',
    summary:
      row.id === 'maintenance_vehicle'
        ? 'Bakım aracı izlemeye yakın.'
        : `${row.label} baskı altında.`,
    tone: row.tone === 'critical' ? 'critical' : 'warning',
    iconKey: row.iconKey,
    relatedDistrictIds: [],
  };
}

function buildContainerPanelLine(
  input: OperationalResourceEngineInput,
): MapResourcePanelLine | undefined {
  const districtId = getMostPressedContainerDistrict(input.operationalResources);
  if (!districtId) return undefined;
  const network = input.operationalResources.containerNetworksByDistrictId[districtId];
  if (!network || (network.status !== 'strained' && network.status !== 'critical')) {
    return undefined;
  }
  const label = CONTAINER_NETWORK_DISTRICT_LABELS[districtId] ?? districtId;
  return {
    id: `container-${districtId}`,
    title: 'Konteyner ağı',
    summary: `${label} hattı baskı altında.`,
    tone: network.status === 'critical' ? 'critical' : 'warning',
    iconKey: 'factory',
    relatedDistrictIds: [districtId],
  };
}

export function buildMapResourcePresencePanelLine(
  input: OperationalResourceEngineInput,
  existingLines: string[] = [],
): MapResourcePanelLine | undefined {
  const day = resolveFirstTenMinutesDay(input.gameState);
  const presenceInput = buildOperationalResourcePresenceLiteInputFromEngine({
    day,
    isPostPilot: day > 7,
    accessMode:
      input.monetization != null && isFullMainOperationAccess(input.gameState, input.monetization)
        ? 'full'
        : 'limited',
    operationalResources: input.operationalResources,
    operationSignals: {
      dailyFocus: input.operationSignals.dailyFocus,
      priorityDistrictId: input.operationSignals.priorityDistrictId,
      containers: input.operationSignals.containers,
      vehicles: input.operationSignals.vehicles,
      personnel: input.operationSignals.personnel,
      districts: input.operationSignals.districts,
      overall: input.operationSignals.overall,
    },
    focusDistrictId: input.operationSignals.priorityDistrictId,
    mapResourceOverlayLine: existingLines[0],
  });
  const presenceModel = buildOperationalResourcePresenceLiteModel(presenceInput);
  const line = buildOperationalResourcePresenceMapLine(presenceModel, existingLines);
  if (!line) return undefined;

  const districtId = input.operationSignals.priorityDistrictId;
  return {
    id: 'resource-presence-lite',
    title: 'Saha kapasitesi',
    summary: line,
    tone: 'warning',
    iconKey: 'navigate',
    relatedDistrictIds: districtId ? [districtId] : [],
  };
}

export function buildResourcePanelLines(
  input: OperationalResourceEngineInput,
): MapResourcePanelLine[] {
  if (!shouldShowMapResourceOverlay(input)) return [];
  const cap = resolveMapResourceLineCap(input);
  if (cap <= 0) return [];

  const candidates: MapResourcePanelLine[] = [];
  const presenceLine = buildMapResourcePresencePanelLine(input);
  const containerLine = buildContainerPanelLine(input);
  const vehicleLine = getMostPressedVehicleLine(input);
  const personnelLine = getMostPressedPersonnelLine(input);
  if (presenceLine) candidates.push(presenceLine);
  if (containerLine) candidates.push(containerLine);
  if (vehicleLine) candidates.push(vehicleLine);
  if (personnelLine) candidates.push(personnelLine);

  return candidates.slice(0, cap);
}

function containerBadgeLabel(
  network: OperationalResourcesState['containerNetworksByDistrictId'][string],
): string {
  const scores = [
    { label: 'Konteyner baskısı', value: network.fillPressure },
    { label: 'Temizlik baskısı', value: network.cleanlinessPressure },
    { label: 'Bakım baskısı', value: network.maintenancePressure },
    { label: 'Sosyal/konteyner', value: network.socialPressure },
  ];
  scores.sort((a, b) => b.value - a.value);
  return scores[0]!.label;
}

export function buildResourceDistrictBadges(
  input: OperationalResourceEngineInput,
): Record<string, MapResourceDistrictBadge> {
  if (!shouldShowMapResourceOverlay(input)) return {};

  const badges: Record<string, MapResourceDistrictBadge> = {};
  const maintenance = input.operationalResources.vehicleGroups.maintenance_vehicle;
  const routeSupport = input.operationalResources.vehicleGroups.route_support_vehicle;

  for (const [districtId, network] of Object.entries(
    input.operationalResources.containerNetworksByDistrictId,
  )) {
    if (network.status !== 'strained' && network.status !== 'critical') continue;
    badges[districtId] = {
      districtId,
      label: containerBadgeLabel(network),
      tone: network.status === 'critical' ? 'critical' : 'warning',
      iconKey: 'factory',
    };
  }

  if (
    routeSupport.status === 'strained' ||
    routeSupport.status === 'critical'
  ) {
    badges.istasyon = {
      districtId: 'istasyon',
      label: 'Rota desteği',
      tone: routeSupport.status === 'critical' ? 'critical' : 'warning',
      iconKey: 'route',
    };
  }

  if (
    maintenance.status === 'strained' ||
    maintenance.status === 'critical'
  ) {
    const target = getMostPressedContainerDistrict(input.operationalResources) ?? 'sanayi';
    if (!badges[target]) {
      badges[target] = {
        districtId: target,
        label: 'Araç ihtiyacı',
        tone: maintenance.status === 'critical' ? 'critical' : 'warning',
        iconKey: 'build',
      };
    }
  }

  const technical = input.operationalResources.personnelGroups.technical_team;
  if (technical.status === 'strained' || technical.status === 'critical') {
    const district = getMostPressedContainerDistrict(input.operationalResources);
    if (district && !badges[district]) {
      badges[district] = {
        districtId: district,
        label: 'Ekip yoğun',
        tone: technical.status === 'critical' ? 'critical' : 'warning',
        iconKey: 'construct',
      };
    }
  }

  return badges;
}

export function buildMapResourcePresentationBundle(
  input: OperationalResourceEngineInput,
): MapResourcePresentation {
  const panelLines = buildResourcePanelLines(input);
  const districtBadges = buildResourceDistrictBadges(input);
  const highlightedDistrictIds = [
    ...new Set([
      ...panelLines.flatMap((l) => l.relatedDistrictIds),
      ...Object.keys(districtBadges),
    ]),
  ];

  return {
    visible: shouldShowMapResourceOverlay(input) && panelLines.length > 0,
    panelLines,
    districtBadges,
    highlightedDistrictIds,
  };
}

export function mergeMapPanelCrisisAndResourceLines(params: {
  crisisLines?: MapCrisisPanelLine[];
  resourceLines?: MapResourcePanelLine[];
  maxTotal?: number;
}): {
  crisisLines?: MapCrisisPanelLine[];
  resourceLines?: MapCrisisPanelLine[];
} {
  const maxTotal = params.maxTotal ?? 2;
  const crisis = params.crisisLines?.slice(0, maxTotal) ?? [];
  const remaining = Math.max(0, maxTotal - crisis.length);
  const resource =
    params.resourceLines
      ?.slice(0, remaining)
      .map(mapResourcePanelLineToCrisisShape) ?? [];
  return {
    crisisLines: crisis.length > 0 ? crisis : undefined,
    resourceLines: resource.length > 0 ? resource : undefined,
  };
}

export function buildMapResourceEngineInputFromStore(params: {
  gameState: GameState;
  monetization?: MonetizationState;
  operationSignals: OperationSignalsState;
  dailyOperationsPlan: DailyOperationsPlanState;
  assignments: AssignmentsState;
  microDecisionState: MicroDecisionState;
  crisisActionState: CrisisActionState;
  operationalResources: OperationalResourcesState;
}): OperationalResourceEngineInput {
  return buildOperationalResourceEngineInputFromStore(params);
}

export function mapResourcePanelLineToCrisisShape(
  line: MapResourcePanelLine,
): MapCrisisPanelLine {
  return {
    id: line.id,
    title: line.title,
    summary: line.summary,
    tone: line.tone === 'positive' ? 'neutral' : line.tone,
    iconKey: line.iconKey,
    affectedDistrictIds: line.relatedDistrictIds,
  };
}

export function isMapDistrictId(id: string): id is MapDistrictId {
  return (
    id === 'merkez' ||
    id === 'cumhuriyet' ||
    id === 'sanayi' ||
    id === 'istasyon' ||
    id === 'yesilvadi'
  );
}
