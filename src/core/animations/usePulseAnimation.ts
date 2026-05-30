import { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getAnimationPreset } from './animationPresetDefinitions';
import { ANIMATION_DURATION } from './animationTokens';
import type { PulseAnimationOptions } from './animationTypes';

const pulsePreset = getAnimationPreset('selectedPulse');

export type UsePulseAnimationResult = {
  glowOpacity: ReturnType<typeof useSharedValue<number>>;
  glowScale: ReturnType<typeof useSharedValue<number>>;
  /** SVG Circle için animated props */
  glowAnimatedProps: ReturnType<typeof useAnimatedProps<{ opacity: number; r?: number }>>;
  /** Sonsuz ağır döngü kullanılmıyor */
  usesLimitedRepeat: boolean;
};

export function usePulseAnimation(
  selected: boolean,
  options: PulseAnimationOptions = {},
): UsePulseAnimationResult {
  const { reduceMotion = false, repeatCount = pulsePreset.pulseRepeatCount ?? 2 } = options;
  const glowOpacity = useSharedValue(selected ? 0.28 : 0.2);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (!selected || reduceMotion) {
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
      glowOpacity.value = selected ? 0.28 : 0.2;
      glowScale.value = 1;
      return;
    }

    const half = Math.floor(ANIMATION_DURATION.slow / 2);
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.36, { duration: half }),
        withTiming(0.22, { duration: half }),
      ),
      repeatCount,
      false,
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(pulsePreset.maxScale ?? 1.04, { duration: half }),
        withTiming(1, { duration: half }),
      ),
      repeatCount,
      false,
    );
  }, [glowOpacity, glowScale, reduceMotion, repeatCount, selected]);

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  return {
    glowOpacity,
    glowScale,
    glowAnimatedProps,
    usesLimitedRepeat: true,
  };
}
