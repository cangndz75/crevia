import type {
  MaintenanceBacklogDayCloseInput,
  MaintenanceBacklogRuntimeState,
} from './maintenanceBacklogRuntimeTypes';
import { updateMaintenanceBacklogForDay } from './maintenanceBacklogRuntimeModel';

export function buildMaintenanceBacklogDayCloseInput(input: {
  day: number;
  staffMorale?: number;
  budget?: number;
  publicSatisfaction?: number;
  warningsCount?: number;
  operationSignals?: MaintenanceBacklogDayCloseInput['operationSignals'];
  relatedEventId?: string;
  districtId?: string;
  districtName?: string;
}): MaintenanceBacklogDayCloseInput {
  return {
    day: input.day,
    staffMorale: input.staffMorale,
    budget: input.budget,
    publicSatisfaction: input.publicSatisfaction,
    warningsCount: input.warningsCount,
    operationSignals: input.operationSignals,
    relatedEventId: input.relatedEventId,
    districtId: input.districtId,
    districtName: input.districtName,
  };
}

export function buildMaintenanceBacklogDayCloseBundle(
  state: MaintenanceBacklogRuntimeState,
  input: MaintenanceBacklogDayCloseInput,
): { maintenanceBacklogRuntime: MaintenanceBacklogRuntimeState } {
  return {
    maintenanceBacklogRuntime: updateMaintenanceBacklogForDay(state, input),
  };
}
