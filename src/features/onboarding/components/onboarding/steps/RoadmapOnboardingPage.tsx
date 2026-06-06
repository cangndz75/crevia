import { StyleSheet, View } from 'react-native';

import { OutcomeResultCard } from '@/features/onboarding/components/onboarding/OutcomeResultCard';
import { TimelineStepper } from '@/features/onboarding/components/onboarding/TimelineStepper';

export function RoadmapOnboardingPage() {
  return (
    <View style={styles.wrap}>
      <TimelineStepper />
      <OutcomeResultCard />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 16,
    paddingBottom: 12,
  },
});
