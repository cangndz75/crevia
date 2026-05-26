import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { spacing } from '@/ui/theme/spacing';
import { colors } from '@/ui/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type OnboardingPrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function OnboardingPrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
}: OnboardingPrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[styles.btn, disabled && styles.btnDisabled, animStyle, style]}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.arrowCircle}>
        <Ionicons name="arrow-forward" size={18} color={onboardingTheme.primary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: onboardingTheme.primary,
    borderRadius: 999,
    paddingVertical: 16,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    shadowColor: onboardingTheme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
