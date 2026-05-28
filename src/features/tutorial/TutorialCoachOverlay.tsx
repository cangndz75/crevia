import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  selectActiveTutorialStepForScreen,
  selectDay1TutorialEventId,
  selectTutorialHighlightTarget,
} from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';

import { TutorialCoachCard } from './TutorialCoachCard';
import type { TutorialScreen } from './tutorialTypes';

type TutorialCoachOverlayProps = {
  screen: TutorialScreen;
  bottomOffset?: number;
};

export function TutorialCoachOverlay({
  screen,
  bottomOffset = 0,
}: TutorialCoachOverlayProps) {
  const router = useRouter();
  const step = useGameStore((s) => selectActiveTutorialStepForScreen(s, screen));
  const highlightTarget = useGameStore((s) =>
    selectTutorialHighlightTarget(s, screen),
  );
  const day1EventId = useGameStore(selectDay1TutorialEventId);
  const advanceTutorial = useGameStore((s) => s.advanceTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);

  const handlePrimary = useCallback(() => {
    if (!step) return;

    if (step.navigateToDay1Event && day1EventId) {
      advanceTutorial();
      router.push(`/events/${day1EventId}`);
      return;
    }

    if (step.id === 'daily_report') {
      advanceTutorial();
      router.replace('/');
      return;
    }

    if (step.screen === 'decision_result') {
      advanceTutorial();
      router.replace('/');
      return;
    }

    advanceTutorial();
  }, [advanceTutorial, day1EventId, router, step]);

  if (!step) {
    return highlightTarget ? null : null;
  }

  const blocking = step.blocking === true;

  return (
    <>
      {blocking ? (
        <Pressable
          style={styles.blocker}
          onPress={() => {}}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      <TutorialCoachCard
        step={step}
        onPrimary={handlePrimary}
        onSkip={skipTutorial}
        bottomOffset={bottomOffset}
      />
    </>
  );
}

/** Hedef vurgusu için dışarıdan okunabilir */
export function useTutorialHighlight(
  screen: TutorialScreen,
  targetKey: import('./tutorialTypes').TutorialTargetKey,
): boolean {
  const highlight = useGameStore((s) => selectTutorialHighlightTarget(s, screen));
  return highlight === targetKey;
}

const styles = StyleSheet.create({
  blocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
    zIndex: 40,
  },
});
