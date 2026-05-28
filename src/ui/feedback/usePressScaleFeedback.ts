import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PRESS_SCALE_ACTIVE } from '@/core/feedback/pressFeedbackHelpers';

const PRESS_DURATION_MS = 110;

export function usePressScaleFeedback(disabled = false) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.55 : scale.value < 1 ? 0.92 : 1,
  }));

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withTiming(PRESS_SCALE_ACTIVE, { duration: PRESS_DURATION_MS });
  }, [disabled, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: PRESS_DURATION_MS });
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
