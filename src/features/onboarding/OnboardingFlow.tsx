import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { spacing } from '@/ui/theme/spacing';

type OnboardingFlowProps = {
  onComplete: (districtId: PilotDistrictId) => void | Promise<void>;
};

/** 4 adımlı premium onboarding — tamamlanınca `onComplete` çağrılır. */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.inner}>
        <OnboardingScreen onComplete={onComplete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: onboardingTheme.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
