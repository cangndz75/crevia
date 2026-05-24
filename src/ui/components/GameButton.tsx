import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { typography } from '@/ui/theme/typography';
import { spacing } from '@/ui/theme/spacing';

type GameButtonVariant = 'primary' | 'secondary' | 'ghost';

type GameButtonProps = {
  title: string;
  onPress: () => void;
  variant?: GameButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
};

export function GameButton({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: GameButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && variant === 'primary' && styles.primaryDisabled,
        disabled && variant !== 'primary' && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          styles[`${variant}Label` as const],
          disabled && styles.disabledLabel,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  primaryDisabled: {
    opacity: 1,
    backgroundColor: '#C8C8CC',
  },
  label: {
    ...typography.subtitle,
    fontSize: 15,
  },
  primaryLabel: {
    color: colors.textInverse,
  },
  secondaryLabel: {
    color: colors.secondary,
  },
  ghostLabel: {
    color: colors.textPrimary,
  },
  disabledLabel: {
    color: colors.textInverse,
  },
});
