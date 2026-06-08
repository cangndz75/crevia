import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';

import { deriveInitialFleetScoresFromSignals } from './vehicleMaintenanceEngine';
import {
  createInitialVehicleMaintenanceState,
  normalizeVehicleMaintenanceState,
} from './vehicleMaintenanceState';
import { VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION } from './vehicleMaintenanceRuntimeConstants';
import type { VehicleMaintenanceDayCloseInput, VehicleMaintenanceStateV1 } from './vehicleMaintenanceRuntimeTypes';

export type VehicleMaintenancePersistLoadInput = {
  rawVehicleMaintenance?: unknown;
  saveVersion: number;
  currentDay: number;
  operationSignals?: VehicleMaintenanceDayCloseInput['operationSignals'];
  cityArchive?: CityArchiveV1State | null;
};

export function migrateVehicleMaintenanceFromSaveV24(
  input: VehicleMaintenancePersistLoadInput,
): VehicleMaintenanceStateV1 {
  const warnings: string[] = [];
  let state = input.rawVehicleMaintenance
    ? normalizeVehicleMaintenanceState(input.rawVehicleMaintenance, input.currentDay)
    : createInitialVehicleMaintenanceState(input.currentDay);

  if (
    state.migrationMeta.migratedFromVersion === VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION &&
    state.migrationMeta.idempotent
  ) {
    return state;
  }

  if (input.currentDay <= 7) {
    return {
      ...createInitialVehicleMaintenanceState(input.currentDay),
      migrationMeta: {
        targetSaveVersion: 25,
        migratedFromVersion: VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION,
        derivedFromArchive: false,
        idempotent: true,
        warnings,
      },
    };
  }

  const recentKinds =
    input.cityArchive?.entries?.slice(-12).map((e) => e.kind) ?? [];
  const derived = deriveInitialFleetScoresFromSignals({
    day: input.currentDay,
    operationSignals: input.operationSignals,
    cityArchiveRecentKinds: recentKinds,
    routeBalanced: recentKinds.includes('route_balanced'),
    resourceRecovery: recentKinds.includes('resource_recovery'),
    comebackCompleted: recentKinds.includes('comeback_completed'),
    resourcePressure: recentKinds.includes('resource_pressure'),
    vehicleRoutePressure:
      input.operationSignals?.vehicles?.status === 'watch' ||
      input.operationSignals?.vehicles?.status === 'strained' ||
      input.operationSignals?.vehicles?.status === 'critical',
  });

  state = {
    ...derived,
    migrationMeta: {
      targetSaveVersion: 25,
      migratedFromVersion: VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION,
      derivedFromArchive: recentKinds.length > 0,
      idempotent: true,
      warnings,
    },
  };

  return state;
}

export function resolveVehicleMaintenanceOnPersistLoad(
  input: VehicleMaintenancePersistLoadInput,
): VehicleMaintenanceStateV1 {
  if (input.saveVersion >= 25 && input.rawVehicleMaintenance != null) {
    return normalizeVehicleMaintenanceState(
      input.rawVehicleMaintenance,
      input.currentDay,
    );
  }

  if (
    input.saveVersion === VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION ||
    input.rawVehicleMaintenance == null
  ) {
    return migrateVehicleMaintenanceFromSaveV24(input);
  }

  try {
    return normalizeVehicleMaintenanceState(
      input.rawVehicleMaintenance,
      input.currentDay,
    );
  } catch {
    return migrateVehicleMaintenanceFromSaveV24({
      ...input,
      rawVehicleMaintenance: undefined,
    });
  }
}
