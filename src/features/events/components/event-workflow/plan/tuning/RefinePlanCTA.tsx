import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanTuningPresentation } from '@/features/events/utils/eventPlanTuningPresentation';
import { useCreviaPressMotion } from '@/shared/motion';

type RefinePlanCTAProps = {
  cta: EventPlanTuningPresentation['refineCta'];
  reducedMotion?: boolean;
  onPress: () => void;
};

export function RefinePlanCTA({ cta, reducedMotion = false, onPress }: RefinePlanCTAProps) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 12);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useCreviaPressMotion({
    reducedMotion,
    pressScale: 0.98,
  });

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(300, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(300, withTiming(0, { duration: 220 }));
  }, [opacity, reducedMotion, translateY]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = () => {
    playLightImpactHaptic();
    onPress();
  };

  return (
    <Animated.View style={[styles.wrap, enterStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={cta.accessibilityLabel}>
        <Animated.View style={[styles.button, pressStyle]}>
          <Text style={styles.label}>{cta.label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
    marginTop: 4,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: eventDetail.tealDark,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
