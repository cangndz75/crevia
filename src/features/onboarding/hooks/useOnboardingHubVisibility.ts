import { useShallow } from 'zustand/react/shallow';

import {
  selectOnboardingHubVisibilityFromStore,
  type OnboardingStoreSlice,
} from '@/core/onboarding/onboardingSelectors';
import type { OnboardingHubVisibility } from '@/core/onboarding/onboardingTypes';
import { useGameStore } from '@/store/useGameStore';

function pickOnboardingStoreSlice(s: OnboardingStoreSlice): OnboardingStoreSlice {
  return {
    gameState: s.gameState,
    tutorialState: s.tutorialState,
    dailyPriorityState: s.dailyPriorityState,
    dailyGoalState: s.dailyGoalState,
    lastDecisionResult: s.lastDecisionResult,
    lastDailyReport: s.lastDailyReport,
    decisionHistory: s.decisionHistory,
    onboardingDismissedHintIds: s.onboardingDismissedHintIds,
  };
}

/** Hub görünürlük bayrakları — useShallow ile stabil snapshot (React 19). */
export function useOnboardingHubVisibility(): OnboardingHubVisibility {
  return useGameStore(
    useShallow((s) =>
      selectOnboardingHubVisibilityFromStore(pickOnboardingStoreSlice(s)),
    ),
  );
}
