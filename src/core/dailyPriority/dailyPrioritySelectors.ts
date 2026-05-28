import type { DailyPriorityState } from './dailyPriorityTypes';

export function isDailyPrioritySelectionRequired(
  state: DailyPriorityState | null | undefined,
  day: number,
  isDay1Tutorial: boolean,
): boolean {
  if (isDay1Tutorial || day <= 1) {
    return false;
  }
  return !state?.selectedKey || state.status === 'not_selected';
}

export function isDailyPriorityActive(
  state: DailyPriorityState | null | undefined,
): boolean {
  return state?.status === 'active' && !!state.selectedKey;
}
