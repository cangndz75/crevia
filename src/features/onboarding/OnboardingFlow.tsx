import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { TutorialScenarioScreen } from '@/features/onboarding/screens/TutorialScenarioScreen';
import { ONBOARDING_STEPS } from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type OnboardingFlowProps = {
  onComplete: () => void | Promise<void>;
};

type FlowPhase = 'steps' | 'tutorial';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [phase, setPhase] = useState<FlowPhase>('steps');
  const [stepIndex, setStepIndex] = useState(0);

  const handleNextStep = () => {
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setPhase('tutorial');
  };

  const handleTutorialComplete = async () => {
    await onComplete();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.inner}>
        {phase === 'steps' ? (
          <OnboardingScreen
            stepIndex={stepIndex}
            onNext={handleNextStep}
            onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
          />
        ) : (
          <TutorialScenarioScreen
            onComplete={handleTutorialComplete}
            onBack={() => {
              setPhase('steps');
              setStepIndex(ONBOARDING_STEPS.length - 1);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
