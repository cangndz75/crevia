import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import type { SocialDecisionAction } from '../utils/socialUiModel';

type Props = {
  action: SocialDecisionAction;
  onPress?: (id: string) => void;
};

const COLOR_MAP = {
  teal: {
    bg: colors.primary,
    text: colors.textInverse,
    effect: colors.primaryMuted,
    effectText: colors.primary,
  },
  amber: {
    bg: colors.warning,
    text: colors.textInverse,
    effect: colors.warningMuted,
    effectText: colors.warning,
  },
  muted: {
    bg: colors.purpleMuted,
    text: colors.purple,
    effect: colors.surface,
    effectText: colors.textSecondary,
  },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SocialActionButton({ action, onPress }: Props) {
  const palette = COLOR_MAP[action.color];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 16, stiffness: 260 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  return (
    <AnimatedPressable
      style={[styles.button, { backgroundColor: palette.bg }, animStyle]}
      onPress={() => onPress?.(action.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={action.label}>
      <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {action.label}
      </Text>
      <Text
        style={[styles.subtitle, { color: palette.text, opacity: 0.8 }]}
        numberOfLines={1}>
        {action.subtitle}
      </Text>
      <View
        style={[styles.effectChip, { backgroundColor: palette.effect }]}>
        <Text style={[styles.effectText, { color: palette.effectText }]}>
          {action.effectLabel}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 48,
    minWidth: 0,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  effectChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 2,
  },
  effectText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
