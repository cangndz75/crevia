import { StyleSheet, View } from 'react-native';

import { OutcomeResultCard } from '@/features/onboarding/components/onboarding/OutcomeResultCard';
import { SummaryMiniCards } from '@/features/onboarding/components/onboarding/SummaryMiniCards';
import { TimelineStepper } from '@/features/onboarding/components/onboarding/TimelineStepper';
import { spacing } from '@/ui/theme/spacing';

export function RoadmapOnboardingPage() {
  return (
    <View style={styles.wrap}>
      <TimelineStepper />
      <OutcomeResultCard />
      <SummaryMiniCards />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
});
