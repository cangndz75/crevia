import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreviaOnboardingScreen } from '@/features/onboarding/screens/CreviaOnboardingScreen';
import type { OnboardingFinishPayload } from '@/features/onboarding/screens/CreviaOnboardingScreen';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type OnboardingFlowProps = {
  onComplete: (payload: OnboardingFinishPayload) => void | Promise<void>;
};

/** 7 adımlı premium onboarding — tamamlanınca `onComplete` çağrılır. */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.inner}>
        <CreviaOnboardingScreen onFinish={onComplete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: onboardingTokens.background,
  },
  inner: {
    flex: 1,
  },
});
