import { applyContainerDecisionEffects } from './containerDecisionEffects';
import { applyContainerDailyUpdate } from './containerEngine';
import type {
  ContainerDailyUpdateContext,
  ContainerDailyUpdateResult,
  ContainerDecisionInput,
  ContainerDecisionResult,
  ContainerState,
} from './containerTypes';

/** Pilot için basit pazar günü heuristiği (Cuma). */
export function isPilotMarketDay(day: number): boolean {
  return day > 0 && day % 7 === 5;
}

export function processContainersEndOfDay(input: {
  containerState: ContainerState;
  day: number;
  isMarketDay?: boolean;
  weatherId?: string;
}): ContainerDailyUpdateResult {
  const day = Math.max(1, input.day);
  const context: ContainerDailyUpdateContext = {
    day,
    isMarketDay: input.isMarketDay ?? isPilotMarketDay(day),
    weatherId: input.weatherId,
  };

  return applyContainerDailyUpdate(input.containerState, context);
}

export function processContainersAfterDecision(
  input: ContainerDecisionInput,
): ContainerDecisionResult {
  return applyContainerDecisionEffects(input);
}
