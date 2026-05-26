import { StyleSheet, Text, View } from 'react-native';

import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { spacing } from '@/ui/theme/spacing';

type OnboardingProgressDotsProps = {
  current: number;
  total: number;
};

export function OnboardingProgressDots({
  current,
  total,
}: OnboardingProgressDotsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <View
              key={step}
              style={[
                styles.dot,
                active && styles.dotActive,
                done && styles.dotDone,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.counter}>
        {current} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4D2E8',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: onboardingTheme.primary,
  },
  dotDone: {
    backgroundColor: onboardingTheme.primary,
    opacity: 0.5,
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
});
