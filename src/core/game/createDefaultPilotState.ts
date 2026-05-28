import { createDefaultButterflyHookState } from '@/core/events/butterflyHookEngine';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import type { PilotGameState } from '@/core/models/PilotGameState';

export function createDefaultPilotState(): PilotGameState {
  return {
    selectedDistrictId: null,
    currentPilotDay: 1,
    status: 'not_started',
    flags: {},
    completedEventIds: [],
    pendingConsequences: [],
    run: null,
    butterflyHookState: createDefaultButterflyHookState(),
    authorityState: createInitialAuthorityState(1),
    badgeState: createInitialBadgeState(1),
  };
}
