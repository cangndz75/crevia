import { inferCarryOverDomainFromText } from '@/core/carryOver/carryOverMemorySelectors';
import {
  buildContainerPressureVisual,
  buildPersonnelFatigueVisual,
  buildResourceFatigueMapMarkerStatus,
  buildRouteLoadVisual,
  buildVehicleFatigueVisual,
} from '@/core/resources/resourceFatigueVisualPresentation';
import type { ResourceFatigueVisualInput } from '@/core/resources/resourceFatigueVisualTypes';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';
import { MAP_DISTRICT_IDS } from '@/features/map/data/mapDistrictConstants';

import { applyMapBeforeAfterToPresenceViewModel } from './mapBeforeAfterPresentation';
import {
  getMapPresenceAnchorsForDistrict,
  resolveAnchorToCityPosition,
  resolveAnchorToDistrictPosition,
  selectMapPresenceAnchors,
} from './mapPresenceAnchors';
import type {
  MapContainerPresenceMarker,
  MapPresenceDomain,
  MapPresenceInput,
  MapPresenceIntensity,
  MapPresenceMarkerStatus,
  MapPresenceSurface,
  MapPresenceViewModel,
  MapRoutePresenceHint,
  MapTeamPresenceMarker,
  MapVehiclePresenceMarker,
} from './mapPresenceTypes';
import { MAP_PRESENCE_DOMAINS } from './mapPresenceTypes';

const OVERVIEW_CAPS = {
  container: 4,
  vehicle: 2,
  team: 2,
  route: 1,
  total: 7,
} as const;

const DETAIL_CAPS = {
  container: 5,
  vehicle: 3,
  team: 3,
  route: 1,
  total: 9,
} as const;

function normalizeDistrictId(value: string | undefined | null): MapDistrictId | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();
  return MAP_DISTRICT_IDS.find((id) => id === key || key.includes(id));
}

function inferDomainFromText(text: string): MapPresenceDomain {
  const domain = inferCarryOverDomainFromText(text);
  if (domain === 'vehicle_route' || domain === 'container' || domain === 'personnel') {
    return domain;
  }
  if (domain === 'social') return 'social';
  if (domain === 'crisis_adjacent') return 'crisis_adjacent';
  if (domain === 'district_balance') return 'district_balance';
  return 'generic_operation';
}

export function inferMapPresenceDomain(input: MapPresenceInput): MapPresenceDomain {
  const focus = input.eventDomainFocus?.focus ?? input.eventDomainFocus?.domain;
  if (focus === 'container') return 'container';
  if (focus === 'vehicle_route' || focus === 'vehicle') return 'vehicle_route';
  if (focus === 'personnel') return 'personnel';
  if (focus === 'social') return 'social';
  if (focus === 'crisis_adjacent' || focus === 'crisis') return 'crisis_adjacent';
  if (focus === 'district_balance') return 'district_balance';

  if (input.carryOverMemory?.domain) {
    const d = input.carryOverMemory.domain as MapPresenceDomain;
    if (d === 'vehicle_route' || d === 'container' || d === 'personnel') return d;
    if (d === 'social' || d === 'crisis_adjacent' || d === 'district_balance') return d;
  }

  if (input.reportTomorrowPreview?.domain && input.reportTomorrowPreview.visible !== false) {
    const d = input.reportTomorrowPreview.domain as MapPresenceDomain;
    if (MAP_PRESENCE_DOMAINS.includes(d)) return d;
  }

  const category = input.activeEvent?.contentCategory?.toLowerCase() ?? '';
  const title = input.activeEvent?.title?.toLowerCase() ?? '';
  const blob = `${category} ${title}`;
  if (category.includes('container') || blob.includes('konteyner')) return 'container';
  if (
    category.includes('vehicle') ||
    category.includes('route') ||
    blob.includes('araç') ||
    blob.includes('rota')
  ) {
    return 'vehicle_route';
  }
  if (category.includes('personnel') || blob.includes('ekip')) return 'personnel';
  if (category.includes('social') || blob.includes('sosyal')) return 'social';
  if (category.includes('crisis') || blob.includes('risk')) return 'crisis_adjacent';

  if (input.operationSignals?.dominantDomain) {
    return inferDomainFromText(input.operationSignals.dominantDomain);
  }

  return 'generic_operation';
}

export function shouldShowMapPresenceLayer(day: number, input: MapPresenceInput): boolean {
  if (day <= 1) {
    return (
      !!input.hasRealPostPilotData &&
      day > 7 &&
      inferMapPresenceDomain(input) !== 'generic_operation'
    );
  }
  if (day > 7 && !input.hasRealPostPilotData && !input.postPilotOperation?.active) {
    const domain = inferMapPresenceDomain(input);
    return domain !== 'generic_operation' && !!input.activeEvent;
  }
  return day >= 2;
}

export function shouldShowContainerPresence(day: number, domain: MapPresenceDomain): boolean {
  if (day < 2) return false;
  return (
    domain === 'container' ||
    domain === 'vehicle_route' ||
    domain === 'district_balance' ||
    (day >= 2 && domain === 'generic_operation' && day <= 3)
  );
}

export function shouldShowVehiclePresence(day: number, domain: MapPresenceDomain): boolean {
  if (day < 3) return false;
  return domain === 'vehicle_route' || domain === 'container' || domain === 'personnel';
}

export function shouldShowTeamPresence(day: number, domain: MapPresenceDomain): boolean {
  if (day < 3) return false;
  return domain === 'personnel' || domain === 'social' || domain === 'vehicle_route';
}

export function shouldShowRouteHint(day: number, domain: MapPresenceDomain): boolean {
  if (day < 3) return false;
  return domain === 'vehicle_route';
}

function resolveTargetDistrict(input: MapPresenceInput): MapDistrictId {
  return (
    input.selectedDistrictId ??
    normalizeDistrictId(input.activeEvent?.neighborhoodId) ??
    normalizeDistrictId(input.carryOverMemory?.districtId) ??
    normalizeDistrictId(input.assignmentState?.activeDistrictId) ??
    'cumhuriyet'
  );
}

function resolveCoords(
  districtId: MapDistrictId,
  anchorId: string,
  surface: MapPresenceSurface,
): { x: number; y: number } | null {
  const anchor = getMapPresenceAnchorsForDistrict(districtId).find((a) => a.id === anchorId);
  if (!anchor) return null;
  return surface === 'district_detail'
    ? resolveAnchorToDistrictPosition(anchor)
    : resolveAnchorToCityPosition(districtId, anchor);
}

function pickAnchor(
  districtId: MapDistrictId,
  domain: MapPresenceDomain,
  kind: 'container' | 'vehicle_access' | 'team_station' | 'social_hotspot' | 'crisis_point' | 'district_center',
): string | undefined {
  const anchors = selectMapPresenceAnchors(districtId, domain)
    .filter((a) => a.kind === kind)
    .sort((a, b) => b.priority - a.priority);
  return anchors[0]?.id;
}

function mapPresenceToFatigueInput(input: MapPresenceInput): ResourceFatigueVisualInput {
  return {
    day: input.day,
    surface: 'map',
    operationalResources: input.operationalResources,
    operationSignals: input.operationSignals
      ? {
          dailyFocus: input.operationSignals.dominantDomain,
          overall: { status: input.operationSignals.pressureLevel },
        }
      : null,
    carryOverMemory: input.carryOverMemory,
    activeEvent: input.activeEvent,
    eventDomainFocus: input.eventDomainFocus,
    reportTomorrowPreview: input.reportTomorrowPreview,
    assignmentState: input.assignmentState
      ? { dominantDomain: input.assignmentState.activeDistrictId }
      : null,
    postPilotOperation: input.postPilotOperation,
    hasRealPostPilotData: input.hasRealPostPilotData,
  };
}

function resolveContainerMarkerStatus(
  input: MapPresenceInput,
  districtId: MapDistrictId,
  useEventPriority: boolean,
): MapPresenceMarkerStatus {
  if (useEventPriority) {
    const eventStatus = eventContainerStatus(input);
    if (eventStatus === 'carry_over' || eventStatus === 'resolved' || eventStatus === 'in_progress') {
      return eventStatus;
    }
  }
  const fatigue = buildResourceFatigueMapMarkerStatus(
    buildContainerPressureVisual(mapPresenceToFatigueInput(input)),
  );
  if (fatigue) return fatigue;
  return resourceContainerStatus(input, districtId);
}

function resourceContainerStatus(
  input: MapPresenceInput,
  districtId: MapDistrictId,
): MapPresenceMarkerStatus {
  const network = input.operationalResources?.districtNetworks?.[districtId];
  if (!network) return 'pressure';
  if (network.status === 'critical') return 'critical';
  if ((network.fillPressure ?? 0) >= 70) return 'pressure';
  return 'normal';
}

function resourceVehicleStatus(input: MapPresenceInput): MapPresenceMarkerStatus {
  const fatigue = buildResourceFatigueMapMarkerStatus(
    buildVehicleFatigueVisual(mapPresenceToFatigueInput(input)),
  );
  if (fatigue) return fatigue;
  const truck = input.operationalResources?.vehicleGroups?.standard_truck;
  if (!truck) return 'en_route';
  if ((truck.maintenanceRisk ?? 0) >= 65) return 'maintenance_risk';
  if (truck.status === 'strained' || truck.status === 'critical') return 'tired';
  if (truck.status === 'busy') return 'working';
  return 'en_route';
}

function resourceTeamStatus(input: MapPresenceInput): MapPresenceMarkerStatus {
  const fatigue = buildResourceFatigueMapMarkerStatus(
    buildPersonnelFatigueVisual(mapPresenceToFatigueInput(input)),
  );
  if (fatigue) return fatigue;
  const team = input.operationalResources?.personnelGroups?.field_team;
  if (!team) return 'assigned';
  if ((team.fatigueScore ?? 0) >= 65 || team.status === 'strained') return 'tired';
  if (team.status === 'busy') return 'working';
  return 'assigned';
}

function resourceRouteHintStatus(input: MapPresenceInput): MapRoutePresenceHint['status'] {
  const routeVisual = buildRouteLoadVisual(mapPresenceToFatigueInput(input));
  if (!routeVisual) return 'preview';
  switch (routeVisual.state) {
    case 'strained':
    case 'tired':
    case 'critical':
      return 'delayed';
    case 'busy':
      return 'active';
    case 'maintenance_risk':
      return 'overloaded';
    default:
      return 'balanced';
  }
}

function eventContainerStatus(input: MapPresenceInput): MapPresenceMarkerStatus {
  if (input.carryOverMemory?.domain === 'container') return 'carry_over';
  if (input.activeEvent?.resolved) return 'resolved';
  if (input.activeEvent?.inProgress) return 'in_progress';
  return 'pressure';
}

export function buildContainerPresenceMarkers(
  input: MapPresenceInput,
): MapContainerPresenceMarker[] {
  const day = input.day;
  const domain = inferMapPresenceDomain(input);
  if (!shouldShowContainerPresence(day, domain)) return [];

  const districtId = resolveTargetDistrict(input);
  const surface = input.surface ?? 'overview';
  const anchors = selectMapPresenceAnchors(districtId, domain).filter((a) => a.kind === 'container');
  const maxCount = day === 2 ? 2 : surface === 'district_detail' ? DETAIL_CAPS.container : OVERVIEW_CAPS.container;
  const primaryStatus = resolveContainerMarkerStatus(input, districtId, true);
  const intensity: MapPresenceIntensity =
    primaryStatus === 'critical'
      ? 'high'
      : primaryStatus === 'pressure' || primaryStatus === 'carry_over'
        ? 'medium'
        : 'low';

  return anchors.slice(0, maxCount).flatMap((anchor, index) => {
    const coords = resolveCoords(districtId, anchor.id, surface);
    if (!coords) return [];
    const status =
      index === 0
        ? primaryStatus
        : resolveContainerMarkerStatus(input, districtId, false);
    return [
      {
        id: `presence-container-${districtId}-${index}`,
        districtId,
        anchorId: anchor.id,
        label: anchor.label,
        status,
        intensity,
        linkedEventId: input.activeEvent?.id,
        pulse:
          index === 0 &&
          (status === 'pressure' ||
            status === 'carry_over' ||
            status === 'critical' ||
            status === 'in_progress'),
        visible: true,
        x: coords.x,
        y: coords.y,
      },
    ];
  });
}

export function buildVehiclePresenceMarkers(input: MapPresenceInput): MapVehiclePresenceMarker[] {
  const day = input.day;
  const domain = inferMapPresenceDomain(input);
  if (!shouldShowVehiclePresence(day, domain)) return [];

  const districtId = resolveTargetDistrict(input);
  const surface = input.surface ?? 'overview';
  const anchorId = pickAnchor(districtId, domain, 'vehicle_access');
  if (!anchorId) return [];

  const coords = resolveCoords(districtId, anchorId, surface);
  if (!coords) return [];

  const status = resourceVehicleStatus(input);
  const intensity: MapPresenceIntensity =
    status === 'maintenance_risk' || status === 'tired' ? 'medium' : 'low';

  return [
    {
      id: `presence-vehicle-${districtId}`,
      districtId,
      anchorId,
      vehicleGroupId: 'standard_truck',
      label: 'Araç hattı',
      status,
      intensity,
      linkedEventId: input.activeEvent?.id,
      routeHintId: `route-${districtId}`,
      visible: true,
      x: coords.x,
      y: coords.y,
    },
  ];
}

export function buildTeamPresenceMarkers(input: MapPresenceInput): MapTeamPresenceMarker[] {
  const day = input.day;
  const domain = inferMapPresenceDomain(input);
  if (!shouldShowTeamPresence(day, domain)) return [];

  const districtId = resolveTargetDistrict(input);
  const surface = input.surface ?? 'overview';
  const kind = domain === 'social' ? 'social_hotspot' : 'team_station';
  const anchorId = pickAnchor(districtId, domain, kind === 'social_hotspot' ? 'social_hotspot' : 'team_station');
  if (!anchorId) return [];

  const coords = resolveCoords(districtId, anchorId, surface);
  if (!coords) return [];

  const status =
    domain === 'social' ? 'social_watch' : resourceTeamStatus(input);
  const intensity: MapPresenceIntensity = status === 'tired' ? 'medium' : 'low';

  return [
    {
      id: `presence-team-${districtId}`,
      districtId,
      anchorId,
      teamGroupId: 'field_team',
      label: domain === 'social' ? 'Sosyal görünürlük' : 'Saha ekibi',
      status,
      intensity,
      linkedEventId: input.activeEvent?.id,
      visible: true,
      x: coords.x,
      y: coords.y,
    },
  ];
}

export function buildRoutePresenceHints(input: MapPresenceInput): MapRoutePresenceHint[] {
  const day = input.day;
  const domain = inferMapPresenceDomain(input);
  if (!shouldShowRouteHint(day, domain)) return [];

  const districtId = resolveTargetDistrict(input);
  const surface = input.surface ?? 'overview';
  const toAnchorId = pickAnchor(districtId, domain, 'vehicle_access');
  const fromAnchorId = pickAnchor(districtId, domain, 'container');
  if (!toAnchorId) return [];

  const toCoords = resolveCoords(districtId, toAnchorId, surface);
  if (!toCoords) return [];

  const fromCoords = fromAnchorId
    ? resolveCoords(districtId, fromAnchorId, surface)
    : undefined;

  const status = resourceRouteHintStatus(input);

  return [
    {
      id: `presence-route-${districtId}`,
      fromAnchorId,
      toAnchorId,
      districtId,
      status,
      intensity: status === 'delayed' ? 'medium' : 'low',
      linkedEventId: input.activeEvent?.id,
      visible: true,
      fromX: fromCoords?.x,
      fromY: fromCoords?.y,
      toX: toCoords.x,
      toY: toCoords.y,
    },
  ];
}

function buildCrisisAdjacentMarkers(input: MapPresenceInput): {
  containers: MapContainerPresenceMarker[];
  teams: MapTeamPresenceMarker[];
} {
  if (input.day < 6) return { containers: [], teams: [] };
  const domain = inferMapPresenceDomain(input);
  if (domain !== 'crisis_adjacent' && input.day !== 6) return { containers: [], teams: [] };

  const districtId = resolveTargetDistrict(input);
  const surface = input.surface ?? 'overview';
  const anchorId = pickAnchor(districtId, 'crisis_adjacent', 'crisis_point');
  if (!anchorId) return { containers: [], teams: [] };

  const coords = resolveCoords(districtId, anchorId, surface);
  if (!coords) return { containers: [], teams: [] };

  return {
    containers: [
      {
        id: `presence-risk-${districtId}`,
        districtId,
        anchorId,
        label: 'Risk sinyali',
        status: 'risk_watch',
        intensity: 'medium',
        pulse: false,
        visible: true,
        x: coords.x,
        y: coords.y,
      },
    ],
    teams: [],
  };
}

function applyMarkerCaps(
  model: MapPresenceViewModel,
  surface: MapPresenceSurface,
): MapPresenceViewModel {
  const caps = surface === 'district_detail' ? DETAIL_CAPS : OVERVIEW_CAPS;
  const day = model.day;

  let containers = model.containerMarkers.filter((m) => m.visible);
  let vehicles = model.vehicleMarkers.filter((m) => m.visible);
  let teams = model.teamMarkers.filter((m) => m.visible);
  let routes = model.routeHints.filter((m) => m.visible);

  if (day === 2) containers = containers.slice(0, 2);
  if (day === 7) {
    containers = containers.slice(0, 2);
    vehicles = vehicles.slice(0, 1);
    teams = teams.slice(0, 1);
  }
  if (day > 7 && !model.debugReason?.includes('post_pilot_active')) {
    const total =
      containers.length + vehicles.length + teams.length + routes.length;
    if (total === 0) {
      return { ...model, visible: false, containerMarkers: [], vehicleMarkers: [], teamMarkers: [], routeHints: [] };
    }
    containers = containers.slice(0, 2);
    vehicles = vehicles.slice(0, 1);
    teams = teams.slice(0, 1);
  }

  containers = containers.slice(0, caps.container);
  vehicles = vehicles.slice(0, caps.vehicle);
  teams = teams.slice(0, caps.team);
  routes = routes.slice(0, caps.route);

  const total = containers.length + vehicles.length + teams.length + routes.length;
  if (total > caps.total) {
    const overflow = total - caps.total;
    if (overflow > 0) containers = containers.slice(0, Math.max(0, containers.length - overflow));
  }

  return {
    ...model,
    containerMarkers: containers,
    vehicleMarkers: vehicles,
    teamMarkers: teams,
    routeHints: routes,
  };
}

export function suppressMapPresenceForCrisisPriority(
  input: MapPresenceInput,
  viewModel: MapPresenceViewModel,
): MapPresenceViewModel {
  const crisisActive =
    input.crisisState?.active === true ||
    input.crisisState?.phase === 'active' ||
    input.crisisState?.accessMode === 'crisis';

  if (!crisisActive) return viewModel;

  const mute = <T extends { visible: boolean; intensity: MapPresenceIntensity }>(markers: T[]): T[] =>
    markers.map((m) => ({
      ...m,
      visible: m.visible,
      intensity: 'low' as MapPresenceIntensity,
    }));

  return {
    ...viewModel,
    containerMarkers: mute(viewModel.containerMarkers).slice(0, 2),
    vehicleMarkers: mute(viewModel.vehicleMarkers).slice(0, 1),
    teamMarkers: mute(viewModel.teamMarkers).slice(0, 1),
    routeHints: viewModel.routeHints.slice(0, 1),
    panelLines: viewModel.panelLines.slice(0, 1),
    debugReason: `${viewModel.debugReason ?? ''} crisis_priority`.trim(),
  };
}

export function buildMapPresencePanelLines(viewModel: MapPresenceViewModel): string[] {
  if (!viewModel.visible || viewModel.day <= 1) return [];

  const district = viewModel.selectedDistrictId ?? 'mahalle';
  const label =
    district === 'cumhuriyet'
      ? 'Cumhuriyet'
      : district === 'merkez'
        ? 'Merkez'
        : district === 'sanayi'
          ? 'Sanayi'
          : district === 'istasyon'
            ? 'İstasyon'
            : district === 'yesilvadi'
              ? 'Yeşilvadi'
              : district;

  switch (viewModel.domain) {
    case 'container':
      return [`${label}’te konteyner baskısı izleniyor`];
    case 'vehicle_route':
      return ['Standart araç hattı yorgun görünüyor'];
    case 'personnel':
      return [`Saha ekibi ${label} mahallesinde konumlandı`];
    case 'social':
      return ['Sosyal görünürlük noktası takipte'];
    case 'crisis_adjacent':
      return ['Risk sinyali izleniyor'];
    case 'district_balance':
      return [`${label} dengesi izleniyor`];
    default:
      if (viewModel.containerMarkers.length > 0) {
        return [`${label} saha sinyali izleniyor`];
      }
      return [];
  }
}

export function buildMapPresenceViewModel(input: MapPresenceInput): MapPresenceViewModel {
  const surface = input.surface ?? 'overview';
  const domain = inferMapPresenceDomain(input);
  const selectedDistrictId = resolveTargetDistrict(input);
  const visible = shouldShowMapPresenceLayer(input.day, input);

  const crisisExtras = buildCrisisAdjacentMarkers(input);

  let model: MapPresenceViewModel = {
    day: input.day,
    visible,
    domain,
    selectedDistrictId,
    containerMarkers: [...buildContainerPresenceMarkers(input), ...crisisExtras.containers],
    vehicleMarkers: buildVehiclePresenceMarkers(input),
    teamMarkers: [...buildTeamPresenceMarkers(input), ...crisisExtras.teams],
    routeHints: buildRoutePresenceHints(input),
    panelLines: [],
    debugReason: visible ? `domain:${domain}` : 'hidden',
  };

  if (input.day === 1) {
    model = {
      ...model,
      visible: false,
      containerMarkers: [],
      vehicleMarkers: [],
      teamMarkers: [],
      routeHints: [],
      panelLines: [],
      debugReason: 'day1_minimal',
    };
  }

  if (input.day === 7) {
    model.debugReason = `${model.debugReason} day7_compact`.trim();
  }

  if (input.postPilotOperation?.active || input.hasRealPostPilotData) {
    model.debugReason = `${model.debugReason} post_pilot_active`.trim();
  }

  model = applyMarkerCaps(model, surface);
  model = suppressMapPresenceForCrisisPriority(input, model);
  model.panelLines = buildMapPresencePanelLines(model).slice(0, 2);

  if (!model.visible) {
    model.containerMarkers = model.containerMarkers.map((m) => ({ ...m, visible: false }));
    model.vehicleMarkers = model.vehicleMarkers.map((m) => ({ ...m, visible: false }));
    model.teamMarkers = model.teamMarkers.map((m) => ({ ...m, visible: false }));
    model.routeHints = model.routeHints.map((m) => ({ ...m, visible: false }));
  }

  if (input.mapBeforeAfterSummary) {
    model = applyMapBeforeAfterToPresenceViewModel(model, input.mapBeforeAfterSummary);
  }

  return model;
}
