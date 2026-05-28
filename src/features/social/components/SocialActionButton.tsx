import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import type { SocialDecisionAction } from '../utils/socialUiModel';

type Props = {
  action: SocialDecisionAction;
  onPress?: (id: string) => void;
};

const COLOR_MAP = {
  teal: {
    gradient: ['#E8F7F5', '#D4F0EC'] as const,
    border: 'rgba(26,143,138,0.22)',
    iconBg: colors.primaryMuted,
    iconColor: colors.primary,
    title: colors.primary,
    arrowBg: colors.primary,
  },
  amber: {
    gradient: ['#FFF8EB', '#FFF0D4'] as const,
    border: 'rgba(232,155,46,0.26)',
    iconBg: colors.warningMuted,
    iconColor: colors.warning,
    title: '#9A6A12',
    arrowBg: colors.warning,
  },
  muted: {
    gradient: ['#F5F0FC', '#EDE6FA'] as const,
    border: 'rgba(123,91,184,0.22)',
    iconBg: colors.purpleMuted,
    iconColor: colors.purple,
    title: colors.purple,
    arrowBg: colors.purple,
  },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SocialActionButton({ action, onPress }: Props) {
  const palette = COLOR_MAP[action.color];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[styles.pressable, animatedStyle]}
      onPress={() => onPress?.(action.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={action.label}>
      <LinearGradient
        colors={[...palette.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.button, shadows.soft, { borderColor: palette.border }]}>
        <View style={[styles.iconBox, { backgroundColor: palette.iconBg }]}>
          <Ionicons name={action.icon} size={20} color={palette.iconColor} />
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.label, { color: palette.title }]} numberOfLines={1}>
            {action.label}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {action.subtitle}
          </Text>
        </View>

        <View style={[styles.arrowCircle, { backgroundColor: palette.arrowBg }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.textInverse} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
