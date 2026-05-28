import type { RoutePreparationModifier } from '@/core/hubQuickActions/hubQuickActionRouteEffects';
import { applyRoutePreparationToVehicleDeltas } from '@/core/hubQuickActions/hubQuickActionRouteEffects';

import {
  VEHICLE_ACTION_CATEGORY_PRIORITY,
  VEHICLE_DECISION_ACTION_DELTAS,
  VEHICLE_DECISION_INTENSITY_KEYWORDS,
  VEHICLE_DECISION_INTENSITY_LIMITS,
  VEHICLE_DECISION_KEYWORDS,
  VEHICLE_EVENT_RELEVANCE_KEYWORDS,
  VEHICLE_NEIGHBORHOOD_IDS,
  type VehicleDailyMetricDeltas,
} from './vehicleConstants';
import { clampVehicleValue } from './vehicleEngine';
import { recomputeVehicleAggregates } from './vehicleSeed';
import { selectBestVehicleForCategory } from './vehicleSelectors';
import type {
  VehicleCategory,
  VehicleDecisionAction,
  VehicleDecisionChoiceInput,
  VehicleDecisionEventInput,
  VehicleDecisionInput,
  VehicleDecisionResult,
  VehicleNeighborhoodId,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

const ACTION_PRIORITY: Exclude<VehicleDecisionAction, 'none'>[] = [
  'maintenance',
  'permanent_solution',
  'add_capacity',
  'dispatch_collection',
  'prioritize_route',
  'dispatch_response',
  'monitor',
];

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeText(...parts: Array<unknown>): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (typeof part === 'number' && Number.isFinite(part)) {
        return String(part);
      }
      return '';
    })
    .filter((part) => part.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function buildEventHaystack(event?: VehicleDecisionEventInput): string {
  if (!event) {
    return '';
  }
  return normalizeText(
    event.id,
    event.type,
    event.eventType,
    event.title,
    event.description,
    event.category,
    event.neighborhoodId,
    event.districtId,
    ...(event.districtIds ?? []),
    ...(event.tags ?? []),
  );
}

function buildDecisionHaystack(decision: VehicleDecisionChoiceInput): string {
  return normalizeText(
    decision.id,
    decision.title,
    decision.label,
    decision.description,
    decision.body,
    decision.intent,
    decision.type,
    decision.action,
    decision.decisionStyle,
    decision.style,
    decision.category,
    decision.riskLevel,
    decision.intensity,
    ...(decision.tags ?? []),
  );
}

function buildCombinedHaystack(
  event: VehicleDecisionEventInput | undefined,
  decision: VehicleDecisionChoiceInput,
): string {
  return `${buildEventHaystack(event)} ${buildDecisionHaystack(decision)}`.trim();
}

export function isVehicleRelevantEvent(
  event?: VehicleDecisionEventInput,
): boolean {
  const haystack = buildEventHaystack(event);
  if (!haystack) {
    return false;
  }
  return includesAny(haystack, VEHICLE_EVENT_RELEVANCE_KEYWORDS);
}

function isVehicleRelevantDecision(decision: VehicleDecisionChoiceInput): boolean {
  const haystack = buildDecisionHaystack(decision);
  return includesAny(haystack, [
    ...VEHICLE_DECISION_KEYWORDS.dispatch_collection,
    ...VEHICLE_DECISION_KEYWORDS.prioritize_route,
    ...VEHICLE_DECISION_KEYWORDS.dispatch_response,
    ...VEHICLE_DECISION_KEYWORDS.maintenance,
    ...VEHICLE_DECISION_KEYWORDS.add_capacity,
    ...VEHICLE_DECISION_KEYWORDS.monitor,
    ...VEHICLE_DECISION_KEYWORDS.permanent_solution,
  ]);
}

function classifyFromKeywords(haystack: string): VehicleDecisionAction | null {
  for (const action of ACTION_PRIORITY) {
    if (includesAny(haystack, VEHICLE_DECISION_KEYWORDS[action])) {
      return action;
    }
  }

  if (includesAny(haystack, VEHICLE_DECISION_KEYWORDS.none)) {
    if (
      includesAny(haystack, ['sahada takip', 'denetim ekibi', 'saha kontrolü', 'saha kontrolu'])
    ) {
      return 'monitor';
    }
    return 'none';
  }

  return null;
}

export function inferVehicleDecisionAction(
  event: VehicleDecisionEventInput | undefined,
  decision: VehicleDecisionChoiceInput,
): VehicleDecisionAction {
  const haystack = buildCombinedHaystack(event, decision);
  const fromKeywords = classifyFromKeywords(haystack);
  if (fromKeywords) {
    if (
      fromKeywords !== 'none' &&
      !isVehicleRelevantEvent(event) &&
      !isVehicleRelevantDecision(decision)
    ) {
      return 'none';
    }
    return fromKeywords;
  }

  if (!isVehicleRelevantEvent(event) && !isVehicleRelevantDecision(decision)) {
    return 'none';
  }

  return 'none';
}

export function getPreferredVehicleCategoriesForAction(
  action: VehicleDecisionAction,
): VehicleCategory[] {
  return [...VEHICLE_ACTION_CATEGORY_PRIORITY[action]];
}

export function selectBestVehicleForAction(
  vehicleState: VehicleState,
  action: VehicleDecisionAction,
): VehicleUnit | null {
  if (action === 'none') {
    return null;
  }

  for (const category of getPreferredVehicleCategoriesForAction(action)) {
    const best = selectBestVehicleForCategory(vehicleState, category);
    if (best) {
      return best;
    }
  }

  return null;
}

function normalizeVehicleNeighborhoodId(
  value: string | undefined,
): VehicleNeighborhoodId | null {
  if (
    value &&
    VEHICLE_NEIGHBORHOOD_IDS.includes(value as VehicleNeighborhoodId)
  ) {
    return value as VehicleNeighborhoodId;
  }
  return null;
}

function resolveTargetNeighborhoodId(
  event: VehicleDecisionEventInput | undefined,
  decision: VehicleDecisionChoiceInput,
  vehicle: VehicleUnit,
): VehicleNeighborhoodId {
  return (
    normalizeVehicleNeighborhoodId(
      stringField(event?.neighborhoodId) ??
        stringField(event?.districtId) ??
        event?.districtIds?.find(
          (id) => normalizeVehicleNeighborhoodId(id) != null,
        ) ??
        stringField(decision.neighborhoodId),
    ) ?? vehicle.currentNeighborhoodId
  );
}

function applyMetricDelta(current: number, delta: number): number {
  return clampVehicleValue(current + delta);
}

function scaleDeltas(
  deltas: VehicleDailyMetricDeltas,
  intensity: number,
): VehicleDailyMetricDeltas {
  const bounded = Math.min(
    VEHICLE_DECISION_INTENSITY_LIMITS.max,
    Math.max(VEHICLE_DECISION_INTENSITY_LIMITS.min, intensity),
  );

  return {
    workload: Math.round(deltas.workload * bounded),
    fuelOrCharge: Math.round(deltas.fuelOrCharge * bounded),
    condition: Math.round(deltas.condition * bounded),
    maintenanceNeed: Math.round(deltas.maintenanceNeed * bounded),
    routeEfficiency: Math.round(deltas.routeEfficiency * bounded),
    breakdownRisk: Math.round(deltas.breakdownRisk * bounded),
  };
}

export function resolveVehicleDecisionIntensity(
  decision: VehicleDecisionChoiceInput,
): number {
  const haystack = buildDecisionHaystack(decision);

  if (includesAny(haystack, VEHICLE_DECISION_INTENSITY_KEYWORDS.heavy)) {
    return VEHICLE_DECISION_INTENSITY_LIMITS.heavy;
  }

  if (
    includesAny(haystack, VEHICLE_DECISION_INTENSITY_KEYWORDS.urgent) ||
    (typeof decision.costs?.staffHours === 'number' &&
      decision.costs.staffHours >= 8) ||
    (typeof decision.costs?.vehicleUsage === 'number' &&
      decision.costs.vehicleUsage >= 2)
  ) {
    return VEHICLE_DECISION_INTENSITY_LIMITS.urgent;
  }

  if (includesAny(haystack, VEHICLE_DECISION_INTENSITY_KEYWORDS.low)) {
    return VEHICLE_DECISION_INTENSITY_LIMITS.low;
  }

  if (typeof decision.intensity === 'number' && Number.isFinite(decision.intensity)) {
    if (decision.intensity <= 0.5) {
      return VEHICLE_DECISION_INTENSITY_LIMITS.low;
    }
    if (decision.intensity >= 1.5) {
      return VEHICLE_DECISION_INTENSITY_LIMITS.heavy;
    }
    if (decision.intensity >= 1.1) {
      return VEHICLE_DECISION_INTENSITY_LIMITS.urgent;
    }
  }

  return VEHICLE_DECISION_INTENSITY_LIMITS.normal;
}

export function getVehicleDecisionDeltasForAction(
  action: Exclude<VehicleDecisionAction, 'none'>,
  decision: VehicleDecisionChoiceInput,
): VehicleDailyMetricDeltas {
  return scaleDeltas(
    VEHICLE_DECISION_ACTION_DELTAS[action],
    resolveVehicleDecisionIntensity(decision),
  );
}

export function applyVehicleDecisionEffect(
  vehicle: VehicleUnit,
  action: Exclude<VehicleDecisionAction, 'none'>,
  event: VehicleDecisionEventInput | undefined,
  decision: VehicleDecisionChoiceInput,
  day: number,
  routeModifier?: RoutePreparationModifier,
): VehicleUnit {
  const baseDeltas = getVehicleDecisionDeltasForAction(action, decision);
  const deltas = applyRoutePreparationToVehicleDeltas(baseDeltas, routeModifier ?? {
    applies: false,
    loadReduction: 0,
    riskReduction: 0,
    routeBonus: 0,
  });
  const eventId = stringField(event?.id) ?? `decision-${decision.id}`;

  return {
    ...vehicle,
    operationalStatus: 'assigned',
    assignedEventId: eventId,
    lastAssignedDay: day,
    currentNeighborhoodId: resolveTargetNeighborhoodId(event, decision, vehicle),
    workload: applyMetricDelta(vehicle.workload, deltas.workload),
    fuelOrCharge: applyMetricDelta(vehicle.fuelOrCharge, deltas.fuelOrCharge),
    condition: applyMetricDelta(vehicle.condition, deltas.condition),
    routeEfficiency: applyMetricDelta(
      vehicle.routeEfficiency,
      deltas.routeEfficiency,
    ),
    maintenanceNeed: applyMetricDelta(
      vehicle.maintenanceNeed,
      deltas.maintenanceNeed,
    ),
    breakdownRisk: applyMetricDelta(vehicle.breakdownRisk, deltas.breakdownRisk),
  };
}

export function applyVehicleDecisionEffects(
  input: VehicleDecisionInput,
  routeModifier?: RoutePreparationModifier,
): VehicleDecisionResult {
  const action = inferVehicleDecisionAction(input.event, input.decision);

  if (action === 'none') {
    return {
      state: input.vehicleState,
      action,
      affectedVehicleId: null,
    };
  }

  const vehicle = selectBestVehicleForAction(input.vehicleState, action);
  if (!vehicle) {
    return {
      state: input.vehicleState,
      action,
      affectedVehicleId: null,
    };
  }

  const updatedUnit = applyVehicleDecisionEffect(
    vehicle,
    action,
    input.event,
    input.decision,
    input.day,
    routeModifier,
  );

  const units = input.vehicleState.units.map((unit) =>
    unit.id === vehicle.id ? updatedUnit : unit,
  );

  return {
    state: {
      ...input.vehicleState,
      units,
      aggregates: recomputeVehicleAggregates(units),
    },
    action,
    affectedVehicleId: vehicle.id,
  };
}
