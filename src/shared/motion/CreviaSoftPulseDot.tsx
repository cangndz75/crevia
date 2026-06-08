import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { buildMotionAccessibilityModel, MOTION_DURATION } from '@/core/motion';

type CreviaSoftPulseDotProps = {
  active?: boolean;
  reducedMotion?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function CreviaSoftPulseDot({
  active = true,
  reducedMotion = false,
  color = '#0F8F86',
  style,
}: CreviaSoftPulseDotProps) {
  const accessibility = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotion,
    motionKind: 'soft_pulse',
  });
  const opacity = useSharedValue(active ? 0.9 : 0.5);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || !accessibility.allowPulseMotion) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = active ? 0.9 : 0.5;
      scale.value = 1;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: MOTION_DURATION.slow }),
        withTiming(0.9, { duration: MOTION_DURATION.slow }),
      ),
      2,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: MOTION_DURATION.slow }),
        withTiming(1, { duration: MOTION_DURATION.slow }),
      ),
      2,
      true,
    );
  }, [accessibility.allowPulseMotion, active, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dot, { backgroundColor: color }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
