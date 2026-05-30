import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getAnimationPreset } from './animationPresetDefinitions';
import { ANIMATION_DURATION, ANIMATION_SCALE } from './animationTokens';
import type { AnimationHookOptions } from './animationTypes';

const softPopPreset = getAnimationPreset('softPop');

export function useSoftPopAnimation(
  active: boolean,
  options: AnimationHookOptions = {},
) {
  const { reduceMotion = false } = options;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || reduceMotion) {
      scale.value = 1;
      return;
    }

    scale.value = withSequence(
      withTiming(softPopPreset.minScale ?? 0.98, {
        duration: ANIMATION_DURATION.fast,
      }),
      withTiming(softPopPreset.maxScale ?? ANIMATION_SCALE.pop, {
        duration: softPopPreset.durationMs,
      }),
      withTiming(1, { duration: ANIMATION_DURATION.fast }),
    );
  }, [active, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle };
}
