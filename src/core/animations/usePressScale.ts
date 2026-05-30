import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { resolvePressScaleNoOp } from './animationPresentation';
import { getAnimationPreset } from './animationPresetDefinitions';
import { ANIMATION_DURATION, ANIMATION_SCALE } from './animationTokens';
import type { AnimationHookOptions } from './animationTypes';

const pressPreset = getAnimationPreset('pressScale');

export type UsePressScaleOptions = AnimationHookOptions & {
  disabled?: boolean;
};

export type UsePressScaleResult = {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  onPressIn: () => void;
  onPressOut: () => void;
  /** reduceMotion veya disabled iken true */
  isNoOp: boolean;
};

export { resolvePressScaleNoOp } from './animationPresentation';

export function usePressScale(options: UsePressScaleOptions = {}): UsePressScaleResult {
  const { disabled = false, reduceMotion = false } = options;
  const isNoOp = resolvePressScaleNoOp(disabled, reduceMotion);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.55 : 1,
  }));

  const onPressIn = useCallback(() => {
    if (isNoOp) return;
    scale.value = withTiming(ANIMATION_SCALE.press, {
      duration: pressPreset.durationMs,
    });
  }, [isNoOp, scale]);

  const onPressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withTiming(1, { duration: ANIMATION_DURATION.fast });
  }, [disabled, scale]);

  return { animatedStyle, onPressIn, onPressOut, isNoOp };
}
