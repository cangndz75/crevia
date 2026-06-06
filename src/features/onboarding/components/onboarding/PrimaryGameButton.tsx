import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  onboardingLayout,
  onboardingRadii,
  onboardingTokens,
} from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PrimaryGameButtonVariant = 'default' | 'start' | 'continueGame';

type PrimaryGameButtonProps = {
  title: string;
  variant?: PrimaryGameButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  height?: number;
};

export function PrimaryGameButton({
  title,
  variant = 'default',
  onPress,
  disabled = false,
  icon,
  style,
  height,
}: PrimaryGameButtonProps) {
  const scale = useSharedValue(1);
  const breathe = useSharedValue(1);

  const isContinue = variant === 'continueGame';

  useEffect(() => {
    if (!isContinue) return;
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [isContinue, breathe]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (isContinue ? breathe.value : 1) }],
  }));

  const leftIcon =
    icon ?? (isContinue ? 'play' : variant === 'start' ? 'rocket-outline' : undefined);
  const arrowSize = isContinue ? 22 : 18;
  const circleSize = isContinue ? 46 : 40;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      style={[styles.outer, isContinue && styles.outerGlow, pressStyle, style]}>
      <LinearGradient
        colors={
          isContinue
            ? [onboardingTokens.primary, onboardingTokens.primaryDark, '#4A42D4']
            : [onboardingTokens.primary, onboardingTokens.lavender]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, height ? { minHeight: height } : null, disabled && styles.btnDisabled]}>
        <View style={styles.left}>
          {leftIcon ? (
            <Ionicons name={leftIcon} size={18} color="#FFFFFF" style={styles.sparkle} />
          ) : null}
          <Text
            style={[styles.label, isContinue && styles.labelContinue]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        <View style={[styles.arrowCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
          <Ionicons name="arrow-forward" size={arrowSize} color={onboardingTokens.primary} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: onboardingRadii.button,
    shadowColor: onboardingTokens.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 7,
  },
  outerGlow: {
    shadowOpacity: 0.65,
    shadowRadius: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: onboardingLayout.buttonHeight,
    borderRadius: onboardingRadii.button,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sparkle: {
    opacity: 0.95,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.15,
    flexShrink: 1,
    minWidth: 0,
  },
  labelContinue: {
    fontSize: 17,
    fontWeight: '800',
  },
  arrowCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
