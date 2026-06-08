import { appendCityArchiveEntries } from '@/core/cityArchive/cityArchiveEngine';
import { makeCityArchiveDuplicateKey } from '@/core/cityArchive/cityArchiveEngine';
import type { CityArchiveEntry, CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';

import {
  normalizeVehicleMaintenanceStateFromInput,
  updateVehicleMaintenanceForDay,
} from './vehicleMaintenanceEngine';
import { selectVehicleMaintenanceSurfaceLines } from './vehicleMaintenanceSelectors';
import { VEHICLE_MAINTENANCE_MAX_ARCHIVE_ENTRIES_PER_DAY } from './vehicleMaintenanceRuntimeConstants';
import type {
  VehicleMaintenanceDayCloseInput,
  VehicleMaintenanceStateV1,
} from './vehicleMaintenanceRuntimeTypes';

const MAINTENANCE_ARCHIVE_SUPPRESS_KINDS = new Set([
  'story_chain_step',
  'comeback_completed',
  'reward_positive',
]);

export function buildVehicleMaintenanceArchiveEntry(
  state: VehicleMaintenanceStateV1,
  input: VehicleMaintenanceDayCloseInput,
): CityArchiveEntry | null {
  if (input.day < 8) return null;

  const surfaces = selectVehicleMaintenanceSurfaceLines(state, input);
  const groupId = state.fatigueSummary.highestPressureGroupId ?? 'route_support';
  const line = surfaces.reportLine ?? surfaces.hubLine;
  if (!line) return null;

  const recentKinds = input.cityArchiveRecentKinds ?? [];
  if (recentKinds.some((k) => MAINTENANCE_ARCHIVE_SUPPRESS_KINDS.has(k))) {
    return null;
  }

  const maintenanceCountToday = recentKinds.filter((k) =>
    k.startsWith('vehicle_maintenance'),
  ).length;
  if (maintenanceCountToday >= VEHICLE_MAINTENANCE_MAX_ARCHIVE_ENTRIES_PER_DAY) {
    return null;
  }

  const isRecovery = line.includes('rahatlattı') || line.includes('toparlandı');
  const kind = isRecovery
    ? 'fleet_recovered'
    : state.maintenanceWindows.some((w) => w.day === input.day && w.status === 'suggested')
      ? 'vehicle_maintenance_suggested'
      : 'vehicle_fatigue_warning';

  const duplicateKey = makeCityArchiveDuplicateKey({
    day: input.day,
    kind,
    districtId: input.districtId,
    sourceKind: 'vehicleMaintenance',
  });

  return {
    id: `vma_${kind}_d${input.day}_${groupId}`,
    day: input.day,
    kind,
    districtId: input.districtId,
    sourceKind: 'vehicleMaintenance',
    title: isRecovery ? 'Filo toparlandı' : 'Araç bakım izi',
    shortLine: line.replace(/^Araç bakım izi:\s*/i, '').slice(0, 120),
    reportLine: line,
    mapLine: surfaces.mapHint,
    isPlayerVisible: true,
    priority: 'medium',
    duplicateKey,
    createdFrom: 'vehicleMaintenance',
    createdAtDay: input.day,
  };
}

export function appendVehicleMaintenanceDayCloseArchive(
  archive: CityArchiveV1State,
  state: VehicleMaintenanceStateV1,
  input: VehicleMaintenanceDayCloseInput,
): CityArchiveV1State {
  const entry = buildVehicleMaintenanceArchiveEntry(state, input);
  if (!entry) return archive;
  return appendCityArchiveEntries(archive, [entry], {
    day: input.day,
    skipDuplicate: true,
  });
}

export function applyVehicleMaintenanceOnDayClose(
  state: VehicleMaintenanceStateV1 | null | undefined,
  input: VehicleMaintenanceDayCloseInput,
): VehicleMaintenanceStateV1 {
  return normalizeVehicleMaintenanceStateFromInput(state, input);
}

export function buildVehicleMaintenanceDayCloseBundle(
  vehicleMaintenance: VehicleMaintenanceStateV1 | null | undefined,
  input: VehicleMaintenanceDayCloseInput,
): {
  vehicleMaintenance: VehicleMaintenanceStateV1;
  surfaces: ReturnType<typeof selectVehicleMaintenanceSurfaceLines>;
} {
  const next = updateVehicleMaintenanceForDay(
    vehicleMaintenance ?? normalizeVehicleMaintenanceStateFromInput(undefined, input),
    input,
  );
  const surfaces = selectVehicleMaintenanceSurfaceLines(next, input);
  return { vehicleMaintenance: next, surfaces };
}
