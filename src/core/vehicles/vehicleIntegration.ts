import { applyVehicleDecisionEffects } from './vehicleDecisionEffects';
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
}): VehicleState {
  const resolvedDay = Math.max(1, params.day);
  const vehicleState =
    params.vehicleState ?? createInitialVehicleState(resolvedDay);

  return applyVehicleDecisionEffects({
    vehicleState,
    event: params.event,
    decision: params.decision,
    day: resolvedDay,
  }).state;
}
