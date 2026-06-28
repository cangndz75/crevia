import {
  createEmptyMaintenanceBacklogRuntimeState,
  migrateMaintenanceBacklogRuntime,
} from './maintenanceBacklogRuntimeModel';

const SAVE_VERSION_WITH_MAINTENANCE_RUNTIME = 28;

export function resolveMaintenanceBacklogRuntimeOnPersistLoad(input: {
  rawMaintenanceBacklogRuntime: unknown;
  saveVersion: number;
  currentDay: number;
}): ReturnType<typeof createEmptyMaintenanceBacklogRuntimeState> {
  if (
    input.saveVersion < SAVE_VERSION_WITH_MAINTENANCE_RUNTIME ||
    input.rawMaintenanceBacklogRuntime == null
  ) {
    return createEmptyMaintenanceBacklogRuntimeState();
  }

  return migrateMaintenanceBacklogRuntime(
    input.rawMaintenanceBacklogRuntime,
    input.currentDay,
  );
}
