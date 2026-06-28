import {
  createEmptyMaintenanceBacklogRuntimeState,
  migrateMaintenanceBacklogRuntime,
} from './maintenanceBacklogRuntimeModel';

const SAVE_VERSION_WITH_MAINTENANCE_RUNTIME = 28;
const SAVE_VERSION_WITH_MAINTENANCE_ECONOMY = 29;

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

  const migrated = migrateMaintenanceBacklogRuntime(
    input.rawMaintenanceBacklogRuntime,
    input.currentDay,
  );

  if (input.saveVersion < SAVE_VERSION_WITH_MAINTENANCE_ECONOMY) {
    return {
      ...migrated,
      items: migrated.items.map((item) => ({
        ...item,
        economyStatus: item.economyStatus ?? 'none',
        estimatedCost: item.estimatedCost ?? undefined,
        estimatedDays: item.estimatedDays ?? undefined,
        startedDay: item.startedDay ?? undefined,
        dueDay: item.dueDay ?? undefined,
        paidCost: item.paidCost ?? undefined,
      })),
    };
  }

  return migrated;
}
