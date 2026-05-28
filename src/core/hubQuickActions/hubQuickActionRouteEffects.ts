import type { EventCard, EventDecision } from '@/core/models/EventCard';
import {
  VEHICLE_ACTION_CATEGORY_PRIORITY,
  type VehicleDailyMetricDeltas,
} from '@/core/vehicles/vehicleConstants';
import { clampVehicleValue } from '@/core/vehicles/vehicleEngine';
import type {
  VehicleCategory,
  VehicleDecisionAction,
  VehicleDecisionChoiceInput,
  VehicleDecisionEventInput,
} from '@/core/vehicles/vehicleTypes';

import {
  ROUTE_PREPARATION_LOAD_REDUCTION,
  ROUTE_PREPARATION_RISK_REDUCTION,
  ROUTE_PREPARATION_ROUTE_BONUS,
} from './hubQuickActionConstants';
import type {
  RoutePreparationAssignment,
  RoutePreparationFocus,
} from './hubQuickActionTypes';

export type RoutePreparationModifier = {
  applies: boolean;
  loadReduction: number;
  riskReduction: number;
  routeBonus: number;
  line?: string;
  reason?: string;
};

function normalizeToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase();
}

function neighborhoodsMatch(
  eventNeighborhoodId: string | undefined,
  eventDistrict: string | undefined,
  targetNeighborhoodId: string | undefined,
): boolean {
  const target = normalizeToken(targetNeighborhoodId);
  if (!target) return false;
  const eventId = normalizeToken(eventNeighborhoodId);
  if (eventId && eventId === target) return true;
  const district = normalizeToken(eventDistrict);
  if (district && district === target) return true;
  return false;
}

function buildHaystack(
  event?: VehicleDecisionEventInput,
  decision?: VehicleDecisionChoiceInput,
): string {
  const parts = [
    event?.title,
    event?.description,
    event?.category,
    event?.eventType,
    decision?.title,
    decision?.description,
    decision?.decisionStyle,
  ];
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .toLowerCase();
}

function inferFocusFromHaystack(haystack: string): RoutePreparationFocus | null {
  if (
    haystack.includes('bakım') ||
    haystack.includes('bakim') ||
    haystack.includes('arıza') ||
    haystack.includes('ariza') ||
    haystack.includes('tamir')
  ) {
    return 'maintenance_route';
  }
  if (
    haystack.includes('şikayet') ||
    haystack.includes('sikayet') ||
    haystack.includes('müdahale') ||
    haystack.includes('mudahale') ||
    haystack.includes('saha')
  ) {
    return 'response_route';
  }
  if (
    haystack.includes('çöp') ||
    haystack.includes('atık') ||
    haystack.includes('konteyner') ||
    haystack.includes('toplama')
  ) {
    return 'waste_route';
  }
  return null;
}

function inferDecisionRouteFocus(
  action: VehicleDecisionAction,
  haystack: string,
): RoutePreparationFocus | null {
  if (action === 'dispatch_collection' || action === 'prioritize_route') {
    return 'waste_route';
  }
  if (action === 'maintenance' || action === 'permanent_solution') {
    return 'maintenance_route';
  }
  if (action === 'dispatch_response') {
    return 'response_route';
  }
  if (action === 'none') {
    return inferFocusFromHaystack(haystack);
  }
  return inferFocusFromHaystack(haystack) ?? 'general_route';
}

function routeFocusMatches(
  assignmentFocus: RoutePreparationFocus,
  decisionFocus: RoutePreparationFocus | null,
): boolean {
  if (!decisionFocus) return false;
  if (assignmentFocus === decisionFocus) return true;
  if (
    assignmentFocus === 'general_route' &&
    decisionFocus !== 'general_route'
  ) {
    return true;
  }
  return false;
}

function categoryMatches(
  assignment: RoutePreparationAssignment,
  action: VehicleDecisionAction,
): boolean {
  if (!assignment.targetVehicleCategory || action === 'none') {
    return false;
  }
  const preferred = VEHICLE_ACTION_CATEGORY_PRIORITY[action];
  return preferred.includes(assignment.targetVehicleCategory as VehicleCategory);
}

export function resolveRoutePreparationModifier(params: {
  routePreparation?: RoutePreparationAssignment;
  currentDay: number;
  event?: VehicleDecisionEventInput;
  decision: VehicleDecisionChoiceInput;
  decisionAction: VehicleDecisionAction;
  affectedVehicleId?: string | null;
}): RoutePreparationModifier {
  const none: RoutePreparationModifier = {
    applies: false,
    loadReduction: 0,
    riskReduction: 0,
    routeBonus: 0,
  };

  const { routePreparation, currentDay, event, decision, decisionAction, affectedVehicleId } =
    params;
  if (!routePreparation || routePreparation.day !== currentDay) {
    return none;
  }

  const haystack = buildHaystack(event, decision);
  const decisionFocus = inferDecisionRouteFocus(decisionAction, haystack);

  const neighborhoodMatch = neighborhoodsMatch(
    event?.neighborhoodId ?? event?.districtId,
    event?.districtId,
    routePreparation.targetNeighborhoodId,
  );
  const focusMatch = routeFocusMatches(
    routePreparation.routeFocus,
    decisionFocus,
  );
  const categoryMatch = categoryMatches(routePreparation, decisionAction);
  const vehicleMatch =
    affectedVehicleId != null &&
    routePreparation.targetVehicleId != null &&
    affectedVehicleId === routePreparation.targetVehicleId;

  if (!neighborhoodMatch && !focusMatch && !categoryMatch && !vehicleMatch) {
    return none;
  }

  const neighborhood = routePreparation.targetNeighborhoodLabel;
  const vehicleLabel = routePreparation.targetVehicleLabel ?? 'Araç';

  return {
    applies: true,
    loadReduction: ROUTE_PREPARATION_LOAD_REDUCTION,
    riskReduction: ROUTE_PREPARATION_RISK_REDUCTION,
    routeBonus: ROUTE_PREPARATION_ROUTE_BONUS,
    line: `Rota hazırlığı: ${neighborhood} rotası için ${vehicleLabel} hazır.`,
    reason: 'route_preparation',
  };
}

export function applyRoutePreparationToVehicleDeltas(
  deltas: VehicleDailyMetricDeltas,
  modifier: RoutePreparationModifier,
): VehicleDailyMetricDeltas {
  if (!modifier.applies) {
    return deltas;
  }

  const workload =
    deltas.workload > 0
      ? Math.max(0, deltas.workload - modifier.loadReduction)
      : deltas.workload;

  const breakdownRisk =
    deltas.breakdownRisk > 0
      ? Math.max(0, deltas.breakdownRisk - modifier.riskReduction)
      : deltas.breakdownRisk;

  const routeEfficiency =
    modifier.routeBonus > 0
      ? clampVehicleValue(deltas.routeEfficiency + modifier.routeBonus)
      : deltas.routeEfficiency;

  return {
    ...deltas,
    workload,
    breakdownRisk,
    routeEfficiency,
  };
}

/** EventCard + EventDecision ile uyumluluk — personel hattıyla aynı imza. */
export function resolveRoutePreparationModifierForEventDecision(params: {
  routePreparation?: RoutePreparationAssignment;
  currentDay: number;
  event: EventCard;
  decision: EventDecision;
  decisionAction: VehicleDecisionAction;
  affectedVehicleId?: string | null;
}): RoutePreparationModifier {
  const { event, decision } = params;
  return resolveRoutePreparationModifier({
    routePreparation: params.routePreparation,
    currentDay: params.currentDay,
    decisionAction: params.decisionAction,
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      neighborhoodId: event.neighborhoodId,
      districtId: event.district,
      districtIds: event.districtIds,
      eventType: event.eventType,
      tags: event.filterTags,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      style: decision.style,
      decisionStyle: decision.decisionStyle,
      costs: decision.costs,
    },
    affectedVehicleId: params.affectedVehicleId,
  });
}
