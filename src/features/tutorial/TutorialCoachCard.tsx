import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { TutorialStep } from './tutorialTypes';

type TutorialCoachCardProps = {
  step: TutorialStep;
  onPrimary: () => void;
  onSkip?: () => void;
  /** Sticky CTA vb. için coach kartını yukarı iter */
  bottomOffset?: number;
};

export function TutorialCoachCard({
  step,
  onPrimary,
  onSkip,
  bottomOffset = 0,
}: TutorialCoachCardProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View
      style={[
        styles.wrap,
        shadows.card,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          marginBottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {step.title}
          </Text>
          {onSkip ? (
            <Pressable
              onPress={onSkip}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tutorialı atla">
              <Text style={styles.skip}>Atla</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.body, compact && styles.bodyCompact]}>{step.body}</Text>
        <Pressable
          onPress={onPrimary}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}
          accessibilityRole="button">
          <Text style={styles.primaryLabel}>{step.primaryActionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    zIndex: 50,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    maxWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 16,
  },
  skip: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.75,
    paddingTop: 2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  bodyCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  primaryBtn: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryPressed: {
    opacity: 0.9,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
