import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { OnboardingProgressDots } from '@/features/onboarding/components/OnboardingProgressDots';
import { OnboardingPrimaryButton } from '@/features/onboarding/components/OnboardingPrimaryButton';
import { OnboardingStepCard } from '@/features/onboarding/components/OnboardingStepCard';
import { ONBOARDING_STEPS } from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type OnboardingScreenProps = {
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
};

export function OnboardingScreen({
  stepIndex,
  onNext,
  onBack,
}: OnboardingScreenProps) {
  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const total = ONBOARDING_STEPS.length;

  return (
    <View style={styles.root}>
      <OnboardingProgressDots current={stepIndex + 1} total={total} />

      <Animated.ScrollView
        key={step.id}
        entering={FadeIn.duration(280)}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <OnboardingStepCard step={step} />
      </Animated.ScrollView>

      <View style={styles.footer}>
        <OnboardingPrimaryButton
          title={isLast ? 'Brifinge Geç' : 'Devam'}
          onPress={onNext}
        />
        {stepIndex > 0 ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backLink, pressed && styles.backPressed]}
            accessibilityRole="button">
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backPressed: {
    opacity: 0.6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  backSpacer: {
    height: 36,
  },
});
