import {
  VEHICLE_CATEGORY_LABELS,
  VEHICLE_DECISION_UNAVAILABLE_TEXT,
  VEHICLE_PREVIEW_RISK_THRESHOLDS,
  VEHICLE_PREVIEW_SHOW_THRESHOLDS,
  type VehicleDailyMetricDeltas,
} from './vehicleConstants';
import type { RoutePreparationAssignment } from '@/core/hubQuickActions/hubQuickActionTypes';
import {
  applyRoutePreparationToVehicleDeltas,
  resolveRoutePreparationModifier,
} from '@/core/hubQuickActions/hubQuickActionRouteEffects';

import {
  getVehicleDecisionDeltasForAction,
  inferVehicleDecisionAction,
  selectBestVehicleForAction,
} from './vehicleDecisionEffects';
import { clampVehicleValue } from './vehicleEngine';
import type {
  VehicleDecisionAction,
  VehicleDecisionChoiceInput,
  VehicleDecisionEventInput,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

export type VehicleImpactRiskLevel = 'low' | 'medium' | 'high';

export type VehicleImpactPreview = {
  available: boolean;
  action: VehicleDecisionAction;
  vehicleId?: string | null;
  vehicleName?: string | null;
  vehicleCategoryLabel?: string | null;
  workloadDelta: number;
  fuelDelta: number;
  conditionDelta: number;
  maintenanceDelta: number;
  breakdownRiskDelta: number;
  riskLevel: VehicleImpactRiskLevel;
  shortText: string;
  riskText?: string | null;
  unavailableText?: string | null;
  shouldShow: boolean;
  routePreparationLine?: string | null;
};

export type SelectVehicleImpactPreviewParams = {
  vehicleState: VehicleState;
  event?: VehicleDecisionEventInput;
  decision: VehicleDecisionChoiceInput;
  day: number;
  routePreparation?: RoutePreparationAssignment;
};

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

function resolveUnavailableText(action: VehicleDecisionAction): string {
  if (action === 'none') {
    return VEHICLE_DECISION_UNAVAILABLE_TEXT.default;
  }
  return (
    VEHICLE_DECISION_UNAVAILABLE_TEXT[action] ??
    VEHICLE_DECISION_UNAVAILABLE_TEXT.default
  );
}

function projectVehicleMetrics(
  vehicle: VehicleUnit,
  deltas: VehicleDailyMetricDeltas,
) {
  return {
    workload: clampVehicleValue(vehicle.workload + deltas.workload),
    fuelOrCharge: clampVehicleValue(vehicle.fuelOrCharge + deltas.fuelOrCharge),
    condition: clampVehicleValue(vehicle.condition + deltas.condition),
    maintenanceNeed: clampVehicleValue(
      vehicle.maintenanceNeed + deltas.maintenanceNeed,
    ),
    breakdownRisk: clampVehicleValue(vehicle.breakdownRisk + deltas.breakdownRisk),
    routeEfficiency: clampVehicleValue(
      vehicle.routeEfficiency + deltas.routeEfficiency,
    ),
  };
}

function resolveVehiclePreviewRiskLevel(
  vehicle: VehicleUnit,
  projected: ReturnType<typeof projectVehicleMetrics>,
  deltas: VehicleDailyMetricDeltas,
): VehicleImpactRiskLevel {
  const high = VEHICLE_PREVIEW_RISK_THRESHOLDS.high;
  if (
    vehicle.breakdownRisk >= high.currentBreakdownRisk ||
    vehicle.maintenanceNeed >= high.currentMaintenanceNeed ||
    vehicle.condition <= high.currentCondition ||
    projected.breakdownRisk >= high.projectedBreakdownRisk ||
    projected.maintenanceNeed >= high.projectedMaintenanceNeed
  ) {
    return 'high';
  }

  const medium = VEHICLE_PREVIEW_RISK_THRESHOLDS.medium;
  if (
    projected.workload >= medium.projectedWorkload ||
    projected.fuelOrCharge <= medium.projectedFuel ||
    projected.condition <= medium.projectedCondition ||
    deltas.maintenanceNeed >= medium.maintenanceDelta
  ) {
    return 'medium';
  }

  return 'low';
}

function buildRiskText(riskLevel: VehicleImpactRiskLevel): string | null {
  if (riskLevel === 'high') {
    return 'Bu karar seçilen aracı kritik eşiğe yaklaştırabilir.';
  }
  if (riskLevel === 'medium') {
    return 'Araç yükü artar, bakım planı gerekebilir.';
  }
  return null;
}

function buildAvailableShortText(
  vehicleName: string,
  deltas: VehicleDailyMetricDeltas,
): string {
  return `Araç: ${vehicleName} · Yük ${formatSignedDelta(deltas.workload)} · Yakıt ${formatSignedDelta(deltas.fuelOrCharge)} · Risk ${formatSignedDelta(deltas.breakdownRisk)}`;
}

function resolveShouldShow(input: {
  action: VehicleDecisionAction;
  available: boolean;
  riskLevel: VehicleImpactRiskLevel;
  deltas: VehicleDailyMetricDeltas;
}): boolean {
  if (input.action === 'none') {
    return false;
  }

  if (!input.available) {
    return true;
  }

  if (input.action === 'monitor') {
    return true;
  }

  if (input.riskLevel === 'medium' || input.riskLevel === 'high') {
    return true;
  }

  const thresholds = VEHICLE_PREVIEW_SHOW_THRESHOLDS;
  return (
    input.deltas.workload >= thresholds.workloadDelta ||
    input.deltas.fuelOrCharge <= thresholds.fuelDelta ||
    input.deltas.maintenanceNeed >= thresholds.maintenanceDelta
  );
}

function buildNonePreview(): VehicleImpactPreview {
  return {
    available: true,
    action: 'none',
    workloadDelta: 0,
    fuelDelta: 0,
    conditionDelta: 0,
    maintenanceDelta: 0,
    breakdownRiskDelta: 0,
    riskLevel: 'low',
    shortText: 'Araç etkisi düşük',
    riskText: null,
    unavailableText: null,
    shouldShow: false,
  };
}

/** Karar öncesi tahmini araç etkisi — state mutate etmez. */
export function selectVehicleImpactPreviewForDecision(
  params: SelectVehicleImpactPreviewParams,
): VehicleImpactPreview {
  const { vehicleState, event, decision, day, routePreparation } = params;
  const action = inferVehicleDecisionAction(event, decision);

  if (action === 'none') {
    return buildNonePreview();
  }

  const vehicle = selectBestVehicleForAction(vehicleState, action);
  if (!vehicle) {
    const unavailableText = resolveUnavailableText(action);
    return {
      available: false,
      action,
      workloadDelta: 0,
      fuelDelta: 0,
      conditionDelta: 0,
      maintenanceDelta: 0,
      breakdownRiskDelta: 0,
      riskLevel: 'high',
      shortText: unavailableText,
      riskText: null,
      unavailableText,
      shouldShow: true,
    };
  }

  const routeModifier = resolveRoutePreparationModifier({
    routePreparation,
    currentDay: day,
    event,
    decision,
    decisionAction: action,
    affectedVehicleId: vehicle.id,
  });

  const baseDeltas = getVehicleDecisionDeltasForAction(action, decision);
  const deltas = applyRoutePreparationToVehicleDeltas(baseDeltas, routeModifier);
  const projected = projectVehicleMetrics(vehicle, deltas);
  const riskLevel = resolveVehiclePreviewRiskLevel(vehicle, projected, deltas);
  const available = true;
  const shouldShow = resolveShouldShow({
    action,
    available,
    riskLevel,
    deltas,
  });

  return {
    available,
    action,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleCategoryLabel: VEHICLE_CATEGORY_LABELS[vehicle.category],
    workloadDelta: deltas.workload,
    fuelDelta: deltas.fuelOrCharge,
    conditionDelta: deltas.condition,
    maintenanceDelta: deltas.maintenanceNeed,
    breakdownRiskDelta: deltas.breakdownRisk,
    riskLevel,
    shortText: buildAvailableShortText(vehicle.name, deltas),
    riskText: buildRiskText(riskLevel),
    unavailableText: null,
    shouldShow,
    routePreparationLine: routeModifier.line ?? null,
  };
}
