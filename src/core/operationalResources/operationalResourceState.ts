import {
  ALL_PERSONNEL_GROUP_IDS,
  ALL_VEHICLE_GROUP_IDS,
  CONTAINER_NETWORK_DISTRICT_IDS,
  DAY1_INITIAL_CONTAINER_PRESSURES,
  DAY1_INITIAL_PERSONNEL_SCORES,
  DAY1_INITIAL_VEHICLE_SCORES,
  PERSONNEL_GROUP_DEFINITIONS,
  VEHICLE_GROUP_DEFINITIONS,
  buildDefaultContainerNetwork,
  OPERATIONAL_RESOURCE_STATUS_THRESHOLDS,
} from './operationalResourceConstants';
import type {
  DistrictContainerNetworkState,
  OperationalResourceStatus,
  OperationalResourceTrend,
  OperationalResourcesDailySummary,
  OperationalResourcesState,
  PersonnelGroupId,
  PersonnelGroupState,
  VehicleGroupId,
  VehicleGroupState,
} from './operationalResourceTypes';

export function clampResourceScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getOperationalResourceStatus(
  score: number,
): OperationalResourceStatus {
  const s = clampResourceScore(score);
  if (s <= OPERATIONAL_RESOURCE_STATUS_THRESHOLDS.stableMax) return 'stable';
  if (s <= OPERATIONAL_RESOURCE_STATUS_THRESHOLDS.busyMax) return 'busy';
  if (s <= OPERATIONAL_RESOURCE_STATUS_THRESHOLDS.strainedMax) return 'strained';
  return 'critical';
}

function derivePersonnelPressure(group: PersonnelGroupState): number {
  return clampResourceScore(
    group.workloadScore * 0.55 + group.fatigueScore * 0.45,
  );
}

function deriveVehiclePressure(group: VehicleGroupState): number {
  return clampResourceScore(
    group.capacityPressure * 0.4 +
      group.maintenanceRisk * 0.35 +
      group.routePressure * 0.25,
  );
}

function deriveContainerPressure(network: DistrictContainerNetworkState): number {
  return clampResourceScore(
    network.fillPressure * 0.35 +
      network.cleanlinessPressure * 0.25 +
      network.maintenancePressure * 0.2 +
      network.socialPressure * 0.2,
  );
}

function buildPersonnelSummary(group: PersonnelGroupState): string {
  const def = PERSONNEL_GROUP_DEFINITIONS[group.id];
  const pressure = derivePersonnelPressure(group);
  const status = getOperationalResourceStatus(pressure);
  if (status === 'stable') return `${def.label} dengeli.`;
  if (status === 'busy') return `${def.label} yoğun.`;
  if (status === 'strained') return `${def.label} baskı altında.`;
  return `${def.label} kritik eşikte.`;
}

function buildVehicleSummary(group: VehicleGroupState): string {
  const def = VEHICLE_GROUP_DEFINITIONS[group.id];
  const pressure = deriveVehiclePressure(group);
  const status = getOperationalResourceStatus(pressure);
  if (group.id === 'maintenance_vehicle' && status !== 'stable') {
    return `Bakım aracı ${status === 'busy' ? 'yoğun' : 'risk altında'}.`;
  }
  if (status === 'stable') return `${def.label} dengeli.`;
  if (status === 'busy') return `${def.label} yoğun.`;
  if (status === 'strained') return `${def.label} baskı altında.`;
  return `${def.label} kritik eşikte.`;
}

function buildContainerSummary(network: DistrictContainerNetworkState): string {
  const label =
    network.districtId in CONTAINER_NETWORK_DISTRICT_IDS
      ? buildDefaultContainerNetwork(network.districtId).summary.split(' ')[0]
      : network.districtId;
  const pressure = deriveContainerPressure(network);
  const status = getOperationalResourceStatus(pressure);
  if (status === 'stable') return `${label} hattı dengeli.`;
  if (status === 'busy') return `${label} hattı yoğun.`;
  if (status === 'strained') return `${label} hattı baskı altında.`;
  return `${label} hattı kritik eşikte.`;
}

export function normalizePersonnelGroup(
  input: unknown,
  fallbackId: PersonnelGroupId,
): PersonnelGroupState {
  const def = PERSONNEL_GROUP_DEFINITIONS[fallbackId];
  const day1 = DAY1_INITIAL_PERSONNEL_SCORES[fallbackId];
  const raw = input != null && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const workload = clampResourceScore(
    typeof raw.workloadScore === 'number' ? raw.workloadScore : day1.workload,
  );
  const fatigue = clampResourceScore(
    typeof raw.fatigueScore === 'number' ? raw.fatigueScore : day1.fatigue,
  );
  const morale = clampResourceScore(
    typeof raw.moraleScore === 'number' ? raw.moraleScore : day1.morale,
  );
  const group: PersonnelGroupState = {
    id: fallbackId,
    label: typeof raw.label === 'string' ? raw.label : def.label,
    workloadScore: workload,
    fatigueScore: fatigue,
    moraleScore: morale,
    specialtyTags: Array.isArray(raw.specialtyTags)
      ? raw.specialtyTags.filter((t): t is string => typeof t === 'string')
      : [...def.specialtyTags],
    usedToday: raw.usedToday === true,
    lastAssignedDay:
      typeof raw.lastAssignedDay === 'number' ? Math.floor(raw.lastAssignedDay) : undefined,
    trend:
      raw.trend === 'improving' || raw.trend === 'worsening' || raw.trend === 'steady'
        ? raw.trend
        : 'steady',
    status: 'stable',
    summary: typeof raw.summary === 'string' ? raw.summary : def.summary,
  };
  group.status = getOperationalResourceStatus(derivePersonnelPressure(group));
  group.summary = buildPersonnelSummary(group);
  return group;
}

export function normalizeVehicleGroup(
  input: unknown,
  fallbackId: VehicleGroupId,
): VehicleGroupState {
  const def = VEHICLE_GROUP_DEFINITIONS[fallbackId];
  const day1 = DAY1_INITIAL_VEHICLE_SCORES[fallbackId];
  const raw = input != null && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const group: VehicleGroupState = {
    id: fallbackId,
    label: typeof raw.label === 'string' ? raw.label : def.label,
    capacityPressure: clampResourceScore(
      typeof raw.capacityPressure === 'number'
        ? raw.capacityPressure
        : day1.capacity,
    ),
    maintenanceRisk: clampResourceScore(
      typeof raw.maintenanceRisk === 'number'
        ? raw.maintenanceRisk
        : day1.maintenance,
    ),
    routePressure: clampResourceScore(
      typeof raw.routePressure === 'number' ? raw.routePressure : day1.route,
    ),
    specialtyTags: Array.isArray(raw.specialtyTags)
      ? raw.specialtyTags.filter((t): t is string => typeof t === 'string')
      : [...def.specialtyTags],
    usedToday: raw.usedToday === true,
    lastUsedDay:
      typeof raw.lastUsedDay === 'number' ? Math.floor(raw.lastUsedDay) : undefined,
    trend:
      raw.trend === 'improving' || raw.trend === 'worsening' || raw.trend === 'steady'
        ? raw.trend
        : 'steady',
    status: 'stable',
    summary: typeof raw.summary === 'string' ? raw.summary : def.summary,
  };
  group.status = getOperationalResourceStatus(deriveVehiclePressure(group));
  group.summary = buildVehicleSummary(group);
  return group;
}

export function normalizeContainerNetwork(
  input: unknown,
  districtId: string,
): DistrictContainerNetworkState {
  const defaults = buildDefaultContainerNetwork(districtId);
  const raw = input != null && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const network: DistrictContainerNetworkState = {
    districtId,
    fillPressure: clampResourceScore(
      typeof raw.fillPressure === 'number'
        ? raw.fillPressure
        : DAY1_INITIAL_CONTAINER_PRESSURES.fill,
    ),
    cleanlinessPressure: clampResourceScore(
      typeof raw.cleanlinessPressure === 'number'
        ? raw.cleanlinessPressure
        : DAY1_INITIAL_CONTAINER_PRESSURES.cleanliness,
    ),
    maintenancePressure: clampResourceScore(
      typeof raw.maintenancePressure === 'number'
        ? raw.maintenancePressure
        : DAY1_INITIAL_CONTAINER_PRESSURES.maintenance,
    ),
    socialPressure: clampResourceScore(
      typeof raw.socialPressure === 'number'
        ? raw.socialPressure
        : DAY1_INITIAL_CONTAINER_PRESSURES.social,
    ),
    trend:
      raw.trend === 'improving' || raw.trend === 'worsening' || raw.trend === 'steady'
        ? raw.trend
        : 'steady',
    sourceTags: Array.isArray(raw.sourceTags)
      ? raw.sourceTags.filter((t): t is string => typeof t === 'string')
      : [...defaults.sourceTags],
    status: 'stable',
    summary: typeof raw.summary === 'string' ? raw.summary : defaults.summary,
  };
  network.status = getOperationalResourceStatus(deriveContainerPressure(network));
  network.summary = buildContainerSummary(network);
  return network;
}

export function createInitialOperationalResourcesState(
  day = 1,
): OperationalResourcesState {
  const personnelGroups = {} as Record<PersonnelGroupId, PersonnelGroupState>;
  for (const id of ALL_PERSONNEL_GROUP_IDS) {
    personnelGroups[id] = normalizePersonnelGroup(undefined, id);
  }
  const vehicleGroups = {} as Record<VehicleGroupId, VehicleGroupState>;
  for (const id of ALL_VEHICLE_GROUP_IDS) {
    vehicleGroups[id] = normalizeVehicleGroup(undefined, id);
  }
  const containerNetworksByDistrictId: Record<string, DistrictContainerNetworkState> =
    {};
  for (const districtId of CONTAINER_NETWORK_DISTRICT_IDS) {
    containerNetworksByDistrictId[districtId] = normalizeContainerNetwork(
      undefined,
      districtId,
    );
  }
  return {
    personnelGroups,
    vehicleGroups,
    containerNetworksByDistrictId,
    lastRefreshedDay: day,
  };
}

export function normalizeOperationalResourcesState(
  input: unknown,
  day = 1,
): OperationalResourcesState {
  const base = createInitialOperationalResourcesState(day);
  if (input == null || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;

  const personnelRaw =
    raw.personnelGroups != null && typeof raw.personnelGroups === 'object'
      ? (raw.personnelGroups as Record<string, unknown>)
      : {};
  for (const id of ALL_PERSONNEL_GROUP_IDS) {
    base.personnelGroups[id] = normalizePersonnelGroup(personnelRaw[id], id);
  }

  const vehicleRaw =
    raw.vehicleGroups != null && typeof raw.vehicleGroups === 'object'
      ? (raw.vehicleGroups as Record<string, unknown>)
      : {};
  for (const id of ALL_VEHICLE_GROUP_IDS) {
    base.vehicleGroups[id] = normalizeVehicleGroup(vehicleRaw[id], id);
  }

  const containerRaw =
    raw.containerNetworksByDistrictId != null &&
    typeof raw.containerNetworksByDistrictId === 'object'
      ? (raw.containerNetworksByDistrictId as Record<string, unknown>)
      : {};
  for (const districtId of CONTAINER_NETWORK_DISTRICT_IDS) {
    base.containerNetworksByDistrictId[districtId] = normalizeContainerNetwork(
      containerRaw[districtId],
      districtId,
    );
  }

  if (raw.dailySummary != null && typeof raw.dailySummary === 'object') {
    const s = raw.dailySummary as Record<string, unknown>;
    base.dailySummary = {
      day: typeof s.day === 'number' ? Math.floor(s.day) : day,
      personnelLine: typeof s.personnelLine === 'string' ? s.personnelLine : '',
      vehicleLine: typeof s.vehicleLine === 'string' ? s.vehicleLine : '',
      containerLine: typeof s.containerLine === 'string' ? s.containerLine : '',
      warnings: Array.isArray(s.warnings)
        ? s.warnings.filter((w): w is string => typeof w === 'string').slice(0, 4)
        : [],
    };
  }

  base.lastProcessedDay =
    typeof raw.lastProcessedDay === 'number'
      ? Math.floor(raw.lastProcessedDay)
      : undefined;
  base.lastRefreshedDay =
    typeof raw.lastRefreshedDay === 'number'
      ? Math.floor(raw.lastRefreshedDay)
      : day;

  return base;
}

export function refreshOperationalResourcesForDay(
  state: OperationalResourcesState,
  day: number,
): OperationalResourcesState {
  if (state.lastRefreshedDay === day) return state;
  const next = normalizeOperationalResourcesState(state, day);
  for (const id of ALL_PERSONNEL_GROUP_IDS) {
    next.personnelGroups[id] = {
      ...next.personnelGroups[id],
      usedToday: false,
    };
  }
  for (const id of ALL_VEHICLE_GROUP_IDS) {
    next.vehicleGroups[id] = {
      ...next.vehicleGroups[id],
      usedToday: false,
    };
  }
  next.lastRefreshedDay = day;
  return next;
}

export function markOperationalResourcesProcessed(
  state: OperationalResourcesState,
  day: number,
  summary: OperationalResourcesDailySummary,
): OperationalResourcesState {
  return {
    ...state,
    dailySummary: summary,
    lastProcessedDay: day,
  };
}

export function recomputeGroupSummaries(
  state: OperationalResourcesState,
): OperationalResourcesState {
  const personnelGroups = { ...state.personnelGroups };
  for (const id of ALL_PERSONNEL_GROUP_IDS) {
    const g = { ...personnelGroups[id] };
    g.status = getOperationalResourceStatus(derivePersonnelPressure(g));
    g.summary = buildPersonnelSummary(g);
    personnelGroups[id] = g;
  }
  const vehicleGroups = { ...state.vehicleGroups };
  for (const id of ALL_VEHICLE_GROUP_IDS) {
    const g = { ...vehicleGroups[id] };
    g.status = getOperationalResourceStatus(deriveVehiclePressure(g));
    g.summary = buildVehicleSummary(g);
    vehicleGroups[id] = g;
  }
  const containerNetworksByDistrictId = {
    ...state.containerNetworksByDistrictId,
  };
  for (const districtId of Object.keys(containerNetworksByDistrictId)) {
    const n = { ...containerNetworksByDistrictId[districtId]! };
    n.status = getOperationalResourceStatus(deriveContainerPressure(n));
    n.summary = buildContainerSummary(n);
    containerNetworksByDistrictId[districtId] = n;
  }
  return { ...state, personnelGroups, vehicleGroups, containerNetworksByDistrictId };
}

export {
  derivePersonnelPressure,
  deriveVehiclePressure,
  deriveContainerPressure,
  buildPersonnelSummary,
  buildVehicleSummary,
  buildContainerSummary,
};
