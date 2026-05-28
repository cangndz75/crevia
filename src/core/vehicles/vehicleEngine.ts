import {
  VEHICLE_BREAKDOWN_LIMITS,
  VEHICLE_DAILY_STATUS_DELTAS,
  VEHICLE_DAY_MODIFIER_LIMITS,
  VEHICLE_METRIC_MAX,
  VEHICLE_METRIC_MIN,
  VEHICLE_RECOVERY_LIMITS,
  type VehicleDailyMetricDeltas,
} from './vehicleConstants';
import { recomputeVehicleAggregates } from './vehicleSeed';
import type {
  VehicleDayModifiers,
  VehicleOperationalStatus,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

export type RecomputeVehicleAfterDayParams = {
  dayModifiers: VehicleDayModifiers;
};

export function clampVehicleValue(value: number): number {
  if (!Number.isFinite(value)) {
    return VEHICLE_METRIC_MIN;
  }
  return Math.round(
    Math.min(VEHICLE_METRIC_MAX, Math.max(VEHICLE_METRIC_MIN, value)),
  );
}

function clampDayModifierFactor(pressure: number): number {
  const normalized = clampVehicleValue(pressure) / VEHICLE_METRIC_MAX;
  const factor =
    VEHICLE_DAY_MODIFIER_LIMITS.neutral +
    normalized * VEHICLE_DAY_MODIFIER_LIMITS.span;
  return Math.min(
    VEHICLE_DAY_MODIFIER_LIMITS.max,
    Math.max(VEHICLE_DAY_MODIFIER_LIMITS.min, factor),
  );
}

function applyMetricDelta(current: number, delta: number): number {
  return clampVehicleValue(current + delta);
}

function scaleDelta(delta: number, factor: number): number {
  if (delta === 0) {
    return 0;
  }
  return Math.round(delta * factor);
}

function applyDayModifiersToDeltas(
  deltas: VehicleDailyMetricDeltas,
  status: VehicleOperationalStatus,
  dayModifiers: VehicleDayModifiers,
): VehicleDailyMetricDeltas {
  const routeFactor = clampDayModifierFactor(dayModifiers.routePressure);
  const maintenanceFactor = clampDayModifierFactor(
    dayModifiers.maintenancePressure,
  );
  const fuelFactor = clampDayModifierFactor(dayModifiers.fuelPressure);

  const result = { ...deltas };

  if (status === 'available' || status === 'assigned') {
    if (deltas.workload !== 0) {
      result.workload = scaleDelta(deltas.workload, routeFactor);
    }
    if (deltas.routeEfficiency !== 0) {
      result.routeEfficiency = scaleDelta(deltas.routeEfficiency, routeFactor);
    }
  }

  if (deltas.maintenanceNeed > 0) {
    result.maintenanceNeed = scaleDelta(deltas.maintenanceNeed, maintenanceFactor);
  }
  if (deltas.breakdownRisk > 0) {
    result.breakdownRisk = scaleDelta(deltas.breakdownRisk, maintenanceFactor);
  }

  if (deltas.fuelOrCharge < 0) {
    result.fuelOrCharge = scaleDelta(deltas.fuelOrCharge, fuelFactor);
  }

  return result;
}

export function deriveVehicleOperationalStatus(
  vehicle: VehicleUnit,
  previousStatus: VehicleOperationalStatus,
): VehicleOperationalStatus {
  if (previousStatus === 'broken') {
    return 'broken';
  }

  if (
    vehicle.condition <= VEHICLE_BREAKDOWN_LIMITS.conditionMax ||
    vehicle.breakdownRisk >= VEHICLE_BREAKDOWN_LIMITS.breakdownRiskMin
  ) {
    return 'broken';
  }

  if (previousStatus === 'assigned') {
    return 'available';
  }

  if (previousStatus === 'resting') {
    return 'available';
  }

  if (previousStatus === 'maintenance') {
    if (
      vehicle.maintenanceNeed <= VEHICLE_RECOVERY_LIMITS.maintenanceNeedMax &&
      vehicle.condition >= VEHICLE_RECOVERY_LIMITS.conditionMin
    ) {
      return 'available';
    }
    return 'maintenance';
  }

  return 'available';
}

export function recomputeVehicleAfterDay(
  vehicle: VehicleUnit,
  params: RecomputeVehicleAfterDayParams,
): VehicleUnit {
  const previousStatus = vehicle.operationalStatus;
  const baseDeltas = VEHICLE_DAILY_STATUS_DELTAS[previousStatus];
  const deltas = applyDayModifiersToDeltas(
    baseDeltas,
    previousStatus,
    params.dayModifiers,
  );

  const updated: VehicleUnit = {
    ...vehicle,
    workload: applyMetricDelta(vehicle.workload, deltas.workload),
    fuelOrCharge: applyMetricDelta(vehicle.fuelOrCharge, deltas.fuelOrCharge),
    condition: applyMetricDelta(vehicle.condition, deltas.condition),
    maintenanceNeed: applyMetricDelta(
      vehicle.maintenanceNeed,
      deltas.maintenanceNeed,
    ),
    routeEfficiency: applyMetricDelta(
      vehicle.routeEfficiency,
      deltas.routeEfficiency,
    ),
    breakdownRisk: applyMetricDelta(vehicle.breakdownRisk, deltas.breakdownRisk),
    operationalStatus: previousStatus,
  };

  return {
    ...updated,
    operationalStatus: deriveVehicleOperationalStatus(updated, previousStatus),
  };
}

export function processVehiclesEndOfDay(
  vehicleState: VehicleState,
  day: number,
): VehicleState {
  const resolvedDay = Math.max(1, day);

  if (vehicleState.lastProcessedDay >= resolvedDay) {
    return vehicleState;
  }

  const params: RecomputeVehicleAfterDayParams = {
    dayModifiers: vehicleState.dayModifiers,
  };

  const units = vehicleState.units.map((unit) =>
    recomputeVehicleAfterDay(unit, params),
  );

  return {
    ...vehicleState,
    units,
    aggregates: recomputeVehicleAggregates(units),
    lastProcessedDay: resolvedDay,
  };
}
