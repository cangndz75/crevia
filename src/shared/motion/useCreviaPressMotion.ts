import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { buildMotionAccessibilityModel, MOTION_DURATION } from '@/core/motion';

type UseCreviaPressMotionInput = {
  disabled?: boolean;
  reducedMotion?: boolean;
  pressScale?: number;
};

export function useCreviaPressMotion({
  disabled = false,
  reducedMotion = false,
  pressScale = 0.97,
}: UseCreviaPressMotionInput = {}) {
  const accessibility = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotion,
    motionKind: 'cta_press',
  });
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const useScale = accessibility.allowPressScale && !disabled;

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withTiming(useScale ? pressScale : 1, { duration: MOTION_DURATION.fast });
    opacity.value = withTiming(reducedMotion ? 0.88 : 0.92, { duration: MOTION_DURATION.fast });
  }, [disabled, opacity, pressScale, reducedMotion, scale, useScale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: MOTION_DURATION.fast });
    opacity.value = withTiming(1, { duration: MOTION_DURATION.fast });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}
