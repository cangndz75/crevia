import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildOnboardingContextFromStore,
  selectOnboardingCoachHint,
  selectOnboardingFocusHint,
  selectOnboardingFocusHintByMoment,
} from '@/core/onboarding/onboardingSelectors';
import { ONBOARDING_HINTS } from '@/core/onboarding/onboardingPresentation';
import type {
  OnboardingHint,
  OnboardingMoment,
  OnboardingScreen,
} from '@/core/onboarding/onboardingTypes';
import { useGameStore } from '@/store/useGameStore';

function resolveHintById(id: string | null): OnboardingHint | null {
  if (!id) return null;
  const found = ONBOARDING_HINTS.find((h) => h.id === id);
  return found ? { ...found } : null;
}

export function useOnboardingHint(
  screen: OnboardingScreen,
  focusTargetKey?: string,
  focusMoment?: OnboardingMoment,
) {
  const { coachHintId, focusHintId, dismiss } = useGameStore(
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
        coachHintId: selectOnboardingCoachHint(ctx)?.id ?? null,
        focusHintId: focus?.id ?? null,
        dismiss: s.dismissOnboardingHint,
      };
    }),
  );

  return useMemo(
    () => ({
      coachHint: resolveHintById(coachHintId),
      focusHint: resolveHintById(focusHintId),
      dismissHint: dismiss,
    }),
    [coachHintId, dismiss, focusHintId],
  );
}
