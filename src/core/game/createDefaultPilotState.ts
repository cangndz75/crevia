import type { PilotGameState } from '@/core/models/PilotGameState';

export function createDefaultPilotState(): PilotGameState {
  return {
    selectedDistrictId: null,
    currentPilotDay: 1,
    status: 'not_started',
    flags: {},
    completedEventIds: [],
    pendingConsequences: [],
  };
}
