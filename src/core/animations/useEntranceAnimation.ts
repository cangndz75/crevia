import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { getAnimationPreset } from './animationPresetDefinitions';
import { REANIMATED_EASING } from './animationEasing';
import { ANIMATION_DURATION, ANIMATION_DISTANCE } from './animationTokens';
import type { EntranceAnimationOptions } from './animationTypes';

const entrancePreset = getAnimationPreset('cardEntrance');

export function useEntranceAnimation(options: EntranceAnimationOptions = {}) {
  const { reduceMotion = false, delay = 0 } = options;
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(
    reduceMotion ? 0 : (entrancePreset.translateY ?? ANIMATION_DISTANCE.entrance),
  );

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const timing = (value: number, toValue: number) =>
      withDelay(
        delay,
        withTiming(toValue, {
          duration: entrancePreset.durationMs,
          easing: REANIMATED_EASING.soft,
        }),
      );

    opacity.value = timing(opacity.value, 1);
    translateY.value = timing(translateY.value, 0);
  }, [delay, opacity, reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, reduceMotion };
}
