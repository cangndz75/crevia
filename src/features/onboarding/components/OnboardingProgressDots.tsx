import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type OnboardingProgressDotsProps = {
  current: number;
  total: number;
  phaseLabel?: string;
};

export function OnboardingProgressDots({
  current,
  total,
  phaseLabel,
}: OnboardingProgressDotsProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.wrap}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <View key={step} style={styles.stepWrap}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  done && styles.dotDone,
                ]}>
                <Text
                  style={[
                    styles.dotText,
                    done && !active && styles.dotTextDone,
                    active && styles.dotTextOnPrimary,
                  ]}>
                  {step}
                </Text>
              </View>
              {i < total - 1 ? (
                <View
                  style={[
                    styles.connector,
                    step < current && styles.connectorDone,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>✦</Text>
        <Text style={styles.badgeText}>
          {current} / {total}
        </Text>
      </View>

      {phaseLabel ? (
        <Text style={styles.phaseLabel}>{phaseLabel}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  dotText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dotTextDone: {
    color: colors.primary,
  },
  dotTextOnPrimary: {
    color: colors.textInverse,
  },
  connector: {
    width: 28,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  connectorDone: {
    backgroundColor: colors.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
  },
  badgeIcon: {
    fontSize: 12,
    color: colors.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
});
