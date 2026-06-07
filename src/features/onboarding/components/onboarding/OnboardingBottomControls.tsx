import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryGameButton } from '@/features/onboarding/components/onboarding/PrimaryGameButton';
import { ProgressDots } from '@/features/onboarding/components/onboarding/ProgressDots';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type OnboardingBottomControlsProps = {
  activeIndex: number;
  total: number;
  primaryLabel: string;
  onPrimaryPress: () => void;
  onBackPress: () => void;
  showBack: boolean;
  isFinal: boolean;
  disabled?: boolean;
  ctaHeight: number;
  compact?: boolean;
};

export function OnboardingBottomControls({
  activeIndex,
  total,
  primaryLabel,
  onPrimaryPress,
  onBackPress,
  showBack,
  isFinal,
  disabled = false,
  ctaHeight,
  compact = false,
}: OnboardingBottomControlsProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <PrimaryGameButton
        title={primaryLabel}
        variant={isFinal ? 'continueGame' : 'default'}
        icon={isFinal ? 'play' : undefined}
        onPress={onPrimaryPress}
        disabled={disabled}
        height={ctaHeight}
      />
      {showBack ? (
        <Pressable
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          style={({ pressed }) => [
            styles.backBtn,
            compact && styles.backBtnCompact,
            pressed && styles.pressed,
          ]}>
          <Ionicons name="chevron-back" size={compact ? 14 : 15} color={onboardingTokens.textMuted} />
          <Text style={[styles.backText, compact && styles.backTextCompact]} numberOfLines={1}>
            Geri
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.backSpacer, compact && styles.backSpacerCompact]} />
      )}
      <ProgressDots compact={compact} current={activeIndex + 1} total={total} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  wrapCompact: {
    gap: 2,
  },
  backBtn: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  backBtnCompact: {
    minHeight: 28,
  },
  backText: {
    fontSize: 15,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  backTextCompact: {
    fontSize: 14,
  },
  backSpacer: {
    height: 34,
  },
  backSpacerCompact: {
    height: 28,
  },
  pressed: {
    opacity: 0.74,
  },
});
