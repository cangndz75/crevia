import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildOnboardingContextFromStore,
  selectOnboardingCoachHint,
  selectOnboardingFocusHint,
  selectOnboardingFocusHintByMoment,
} from '@/core/onboarding/onboardingSelectors';
import type { OnboardingMoment, OnboardingScreen } from '@/core/onboarding/onboardingTypes';
import { useGameStore } from '@/store/useGameStore';

export function useOnboardingHint(
  screen: OnboardingScreen,
  focusTargetKey?: string,
  focusMoment?: OnboardingMoment,
) {
  const { coachHint, focusHint, dismiss } = useGameStore(
    useShallow((s) => {
      const ctx = buildOnboardingContextFromStore(
        {
          gameState: s.gameState,
          tutorialState: s.tutorialState,
          dailyPriorityState: s.dailyPriorityState,
          dailyGoalState: s.dailyGoalState,
          lastDecisionResult: s.lastDecisionResult,
          lastDailyReport: s.lastDailyReport,
          decisionHistory: s.decisionHistory,
          onboardingDismissedHintIds: s.onboardingDismissedHintIds,
        },
        screen,
      );
      const focus = focusMoment
        ? selectOnboardingFocusHintByMoment(ctx, focusMoment)
        : selectOnboardingFocusHint(ctx, focusTargetKey);
      return {
        coachHint: selectOnboardingCoachHint(ctx),
        focusHint: focus,
        dismiss: s.dismissOnboardingHint,
      };
    }),
  );

  return useMemo(
    () => ({
      coachHint,
      focusHint,
      dismissHint: dismiss,
    }),
    [coachHint, dismiss, focusHint],
  );
}
