import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { OnboardingHint } from '@/core/onboarding/onboardingTypes';
import { mobileSafeLine } from '@/core/onboarding/onboardingPresentation';
import { selectDay1TutorialEventId } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { OnboardingStepPill } from './OnboardingStepPill';

type OnboardingCoachBubbleProps = {
  hint: OnboardingHint;
  onDismiss: () => void;
  bottomOffset?: number;
};

export function OnboardingCoachBubble({
  hint,
  onDismiss,
  bottomOffset = 0,
}: OnboardingCoachBubbleProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const day1EventId = useGameStore(selectDay1TutorialEventId);

  const handleDismiss = () => {
    playLightImpactHaptic();
    onDismiss();
  };

  const handleCta = () => {
    playLightImpactHaptic();
    onDismiss();
    if (hint.targetKey === 'critical_event_card' && day1EventId) {
      router.push(`/events/${day1EventId}`);
    }
  };

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
          <Ionicons
            name="compass-outline"
            size={20}
            color={colors.headerTealDark}
          />
          <View style={styles.headerText}>
            {hint.stepPill ? (
              <OnboardingStepPill
                label={hint.stepPill}
                tone={hint.stepPill === 'Yeni' ? 'new' : 'info'}
              />
            ) : null}
            <Text
              style={[styles.title, compact && styles.titleCompact]}
              numberOfLines={2}>
              {hint.title}
            </Text>
          </View>
          {hint.dismissible ? (
            <Pressable
              onPress={handleDismiss}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="İpucunu kapat">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.body, compact && styles.bodyCompact]}>
          {mobileSafeLine(hint.text, 160)}
        </Text>
        {hint.ctaText ? (
          <Pressable
            onPress={handleCta}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryPressed,
            ]}
            accessibilityRole="button">
            <Text style={styles.primaryLabel}>{hint.ctaText}</Text>
          </Pressable>
        ) : null}
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
    zIndex: 45,
  },
  card: {
    backgroundColor: '#F7F3E8',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#C5E0DC',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    maxWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.headerTealDark,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 16,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  bodyCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#0F4A47',
    borderRadius: radius.full,
    paddingVertical: 12,
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
