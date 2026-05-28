import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { selectDay1TutorialEventId } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HubGuideCtaProps = {
  label?: string;
  sublabel?: string;
  variant?: 'primary' | 'soft';
};

export function HubGuideCta({
  label = 'İlk olayı incele',
  sublabel,
  variant = 'primary',
}: HubGuideCtaProps) {
  const router = useRouter();
  const day1EventId = useGameStore(selectDay1TutorialEventId);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!day1EventId) return;
    playLightImpactHaptic();
    router.push(`/events/${day1EventId}`);
  };

  if (!day1EventId) return null;

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      style={[
        isPrimary ? styles.primaryBtn : styles.softBtn,
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.btnInner}>
        <View style={[styles.btnIcon, isPrimary && styles.btnIconPrimary]}>
          <Ionicons
            name="flash"
            size={16}
            color={isPrimary ? '#fff' : colors.headerTealDark}
          />
        </View>
        <View style={styles.btnText}>
          <Text style={[styles.label, isPrimary && styles.labelPrimary]}>
            {label}
          </Text>
          {sublabel ? (
            <Text
              style={[styles.sublabel, isPrimary && styles.sublabelPrimary]}
              numberOfLines={1}>
              {sublabel}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={isPrimary ? '#fff' : colors.headerTealDark}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.headerTealDark,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  softBtn: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.2)',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  btnText: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headerTealDark,
  },
  labelPrimary: {
    color: '#fff',
  },
  sublabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sublabelPrimary: {
    color: 'rgba(255,255,255,0.82)',
  },
});
