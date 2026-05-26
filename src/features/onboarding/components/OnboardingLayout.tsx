import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { OnboardingLogo } from '@/features/onboarding/components/OnboardingLogo';
import { OnboardingPrimaryButton } from '@/features/onboarding/components/OnboardingPrimaryButton';
import { OnboardingProgressDots } from '@/features/onboarding/components/OnboardingProgressDots';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { spacing } from '@/ui/theme/spacing';

type OnboardingLayoutProps = {
  stepIndex: number;
  totalSteps: number;
  title: string;
  body: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  headerExtra?: ReactNode;
};

export function OnboardingLayout({
  stepIndex,
  totalSteps,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  onBack,
  onSkip,
  skipLabel = 'Geç',
  headerExtra,
}: OnboardingLayoutProps) {
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <OnboardingLogo />
        {headerExtra}
        <Animated.View
          key={`step-${stepIndex}`}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(180)}
          style={styles.stepContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {children}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingPrimaryButton
          title={primaryLabel}
          onPress={onPrimary}
          disabled={primaryDisabled}
        />
        {onBack ? (
          <Pressable onPress={onBack} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Geri</Text>
          </Pressable>
        ) : onSkip ? (
          <Pressable onPress={onSkip} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>{skipLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.secondarySpacer} />
        )}
        <OnboardingProgressDots current={stepIndex + 1} total={totalSteps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: onboardingTheme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  stepContent: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: onboardingTheme.navy,
    textAlign: 'center',
    letterSpacing: -0.4,
    paddingHorizontal: spacing.md,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: onboardingTheme.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    fontWeight: '500',
  },
  footer: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: onboardingTheme.textMuted,
  },
  secondarySpacer: {
    height: 36,
  },
});
