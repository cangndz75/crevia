import type { RoutePreparationAssignment } from '@/core/hubQuickActions/hubQuickActionTypes';
import { resolveRoutePreparationModifier } from '@/core/hubQuickActions/hubQuickActionRouteEffects';

import {
  applyVehicleDecisionEffects,
  inferVehicleDecisionAction,
  selectBestVehicleForAction,
} from './vehicleDecisionEffects';
import { processVehiclesEndOfDay } from './vehicleEngine';
import { createInitialVehicleState } from './vehicleSeed';
import type {
  VehicleDecisionChoiceInput,
  VehicleDecisionEventInput,
  VehicleState,
} from './vehicleTypes';

export function processVehiclesEndOfDayForStore(
  vehicleState: VehicleState | null | undefined,
  day: number,
): VehicleState {
  const resolvedDay = Math.max(1, day);
  const state = vehicleState ?? createInitialVehicleState(resolvedDay);
  return processVehiclesEndOfDay(state, resolvedDay);
}

export function processVehiclesAfterDecisionForStore(params: {
  vehicleState?: VehicleState | null;
  event?: VehicleDecisionEventInput;
  decision: VehicleDecisionChoiceInput;
  day: number;
  routePreparation?: RoutePreparationAssignment;
}): VehicleState {
  const resolvedDay = Math.max(1, params.day);
  const vehicleState =
    params.vehicleState ?? createInitialVehicleState(resolvedDay);

  const action = inferVehicleDecisionAction(params.event, params.decision);
  const selectedVehicle =
    action === 'none'
      ? null
      : selectBestVehicleForAction(vehicleState, action);

  const routeModifier = resolveRoutePreparationModifier({
    routePreparation: params.routePreparation,
    currentDay: resolvedDay,
    event: params.event,
    decision: params.decision,
    decisionAction: action,
    affectedVehicleId: selectedVehicle?.id ?? null,
  });

  return applyVehicleDecisionEffects(
    {
      vehicleState,
      event: params.event,
      decision: params.decision,
      day: resolvedDay,
    },
    routeModifier,
  ).state;
}
