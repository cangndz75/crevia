import { createInitialVehicleState } from './vehicleSeed';
import type {
  VehicleCategory,
  VehicleRootState,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

export { recomputeVehicleAggregates, isVehicleUnitCritical } from './vehicleSeed';

export function selectVehicleState(rootState: VehicleRootState): VehicleState {
  return rootState.vehicleState ?? createInitialVehicleState(1);
}

export function selectVehicleUnits(vehicleState: VehicleState): VehicleUnit[] {
  return vehicleState.units;
}

export function selectVehicleAggregates(vehicleState: VehicleState) {
  return vehicleState.aggregates;
}

export function selectAvailableVehicles(
  vehicleState: VehicleState,
): VehicleUnit[] {
  return vehicleState.units.filter(
    (unit) => unit.operationalStatus === 'available',
  );
}

export function selectVehiclesByCategory(
  vehicleState: VehicleState,
  category: VehicleCategory,
): VehicleUnit[] {
  return vehicleState.units.filter((unit) => unit.category === category);
}

export function selectVehicleById(
  vehicleState: VehicleState,
  vehicleId: string,
): VehicleUnit | null {
  return vehicleState.units.find((unit) => unit.id === vehicleId) ?? null;
}

export function selectCriticalVehicles(
  vehicleState: VehicleState,
): VehicleUnit[] {
  const { criticalCount } = vehicleState.aggregates;
  if (criticalCount === 0) {
    return [];
  }

  return vehicleState.units.filter(
    (unit) =>
      unit.condition <= 35 ||
      unit.breakdownRisk >= 70 ||
      unit.maintenanceNeed >= 75,
  );
}

export function scoreVehicleForAssignment(unit: VehicleUnit): number {
  return (
    unit.condition +
    unit.fuelOrCharge +
    unit.routeEfficiency -
    unit.workload -
    unit.maintenanceNeed -
    unit.breakdownRisk
  );
}

export function selectBestVehicleForCategory(
  vehicleState: VehicleState,
  category: VehicleCategory,
): VehicleUnit | null {
  const candidates = selectVehiclesByCategory(vehicleState, category).filter(
    (unit) => unit.operationalStatus === 'available',
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort(
    (a, b) => scoreVehicleForAssignment(b) - scoreVehicleForAssignment(a),
  )[0] ?? null;
}
