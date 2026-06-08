import {
  VEHICLE_MAINTENANCE_FLEET_GROUP_IDS,
  VEHICLE_MAINTENANCE_PLAYER_LABELS,
  VEHICLE_MAINTENANCE_V1_VERSION,
} from './vehicleMaintenanceRuntimeConstants';
import type {
  VehicleFleetGroupId,
  VehicleFleetGroupStateV1,
  VehicleMaintenanceStateV1,
} from './vehicleMaintenanceRuntimeTypes';

function defaultFleetGroup(groupId: VehicleFleetGroupId, day: number): VehicleFleetGroupStateV1 {
  return {
    groupId,
    label: VEHICLE_MAINTENANCE_PLAYER_LABELS[groupId],
    conditionBand: 'stable',
    fatigueBand: 'low',
    availabilityBand: 'ready',
    consecutiveUseDays: 0,
    maintenanceNeedScore: 0,
    routePressureScore: 0,
    assignmentPressureScore: 0,
    districtPressureIds: [],
    relatedArchiveEntryIds: [],
    playerVisibleLine: `${VEHICLE_MAINTENANCE_PLAYER_LABELS[groupId]} dengede.`,
    duplicateKey: `fleet_group:${groupId}:d${day}`,
  };
}

export function createInitialVehicleMaintenanceState(day: number): VehicleMaintenanceStateV1 {
  const fleetGroups = Object.fromEntries(
    VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.map((id) => [id, defaultFleetGroup(id, day)]),
  ) as Record<VehicleFleetGroupId, VehicleFleetGroupStateV1>;

  return {
    version: VEHICLE_MAINTENANCE_V1_VERSION,
    createdAtDay: day,
    updatedAtDay: day,
    fleetGroups,
    maintenanceWindows: [],
    fatigueSummary: {
      overallBand: 'low',
      consecutiveHeavyDays: 0,
    },
    routePressureSummary: {
      routePressureScore: 0,
    },
    assignmentImpactSummary: {
      pressureDelta: 0,
    },
    cityArchiveLinkSummary: {
      recentEntryKinds: [],
      linkedEntryIds: [],
      duplicateGuardActive: true,
    },
    migrationMeta: {
      targetSaveVersion: 25,
      derivedFromArchive: false,
      idempotent: true,
    },
    sourceSignals: [],
  };
}

function isFleetGroupId(value: string): value is VehicleFleetGroupId {
  return (VEHICLE_MAINTENANCE_FLEET_GROUP_IDS as readonly string[]).includes(value);
}

export function normalizeVehicleMaintenanceState(
  raw: unknown,
  currentDay: number,
): VehicleMaintenanceStateV1 {
  if (!raw || typeof raw !== 'object') {
    return createInitialVehicleMaintenanceState(currentDay);
  }

  const record = raw as Partial<VehicleMaintenanceStateV1>;
  const base = createInitialVehicleMaintenanceState(currentDay);
  const fleetGroups = { ...base.fleetGroups };

  if (record.fleetGroups && typeof record.fleetGroups === 'object') {
    for (const [key, value] of Object.entries(record.fleetGroups)) {
      if (!isFleetGroupId(key) || !value || typeof value !== 'object') continue;
      const group = value as VehicleFleetGroupStateV1;
      fleetGroups[key] = {
        ...defaultFleetGroup(key, currentDay),
        ...group,
        groupId: key,
        label: group.label || VEHICLE_MAINTENANCE_PLAYER_LABELS[key],
        maintenanceNeedScore: Math.max(
          0,
          Math.min(100, Number(group.maintenanceNeedScore) || 0),
        ),
        duplicateKey: group.duplicateKey || `fleet_group:${key}:d${currentDay}`,
      };
    }
  }

  const windows = Array.isArray(record.maintenanceWindows)
    ? record.maintenanceWindows.filter(
        (w) => w && typeof w === 'object' && typeof w.id === 'string',
      )
    : [];

  return {
    ...base,
    ...record,
    version: VEHICLE_MAINTENANCE_V1_VERSION,
    createdAtDay: Number(record.createdAtDay) || currentDay,
    updatedAtDay: Number(record.updatedAtDay) || currentDay,
    fleetGroups,
    maintenanceWindows: windows,
    fatigueSummary: {
      ...base.fatigueSummary,
      ...(record.fatigueSummary ?? {}),
    },
    routePressureSummary: {
      ...base.routePressureSummary,
      ...(record.routePressureSummary ?? {}),
    },
    assignmentImpactSummary: {
      ...base.assignmentImpactSummary,
      ...(record.assignmentImpactSummary ?? {}),
    },
    cityArchiveLinkSummary: {
      ...base.cityArchiveLinkSummary,
      ...(record.cityArchiveLinkSummary ?? {}),
    },
    migrationMeta: {
      ...base.migrationMeta,
      ...(record.migrationMeta ?? {}),
    },
    sourceSignals: Array.isArray(record.sourceSignals)
      ? record.sourceSignals.map(String)
      : [],
  };
}

export function pruneVehicleMaintenanceWindows(
  state: VehicleMaintenanceStateV1,
  currentDay: number,
): VehicleMaintenanceStateV1 {
  const keepDays = 14;
  const maintenanceWindows = state.maintenanceWindows.filter(
    (w) => w.day >= currentDay - keepDays,
  );
  return maintenanceWindows.length === state.maintenanceWindows.length
    ? state
    : { ...state, maintenanceWindows };
}
