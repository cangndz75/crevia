import { buildHubQuickActionCards } from './hubQuickActionPresentation';
import { normalizePersistedHubQuickActionState } from './hubQuickActionSeed';
import type {
  HubQuickActionCardModel,
  HubQuickActionState,
} from './hubQuickActionTypes';

export type HubQuickActionSelectorInput = {
  hubQuickActionState: HubQuickActionState;
  currentDay: number;
  day1Disabled?: boolean;
};

export function selectHubQuickActionStateForDay(
  state: HubQuickActionState,
  currentDay: number,
): HubQuickActionState {
  return normalizePersistedHubQuickActionState(state, currentDay);
}

export function selectHubQuickActionCards(
  input: HubQuickActionSelectorInput,
): HubQuickActionCardModel[] {
  const normalized = selectHubQuickActionStateForDay(
    input.hubQuickActionState,
    input.currentDay,
  );
  const day1Disabled =
    input.day1Disabled ?? input.currentDay <= 1;
  return buildHubQuickActionCards(normalized, { day1Disabled });
}
