import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  buildMotionAccessibilityModel,
  buildMotionDelay,
  motionDurationForKind,
  motionTranslateYForKind,
  resolveMotionDensity,
  shouldAnimateMotionItem,
  type MotionIntensity,
  type MotionKind,
  type MotionSurface,
} from '@/core/motion';

type UseCreviaEntranceMotionInput = {
  motionKind?: MotionKind;
  surface?: MotionSurface;
  index?: number;
  disabled?: boolean;
  reducedMotion?: boolean;
  intensity?: MotionIntensity;
  day?: number;
};

export function useCreviaEntranceMotion({
  motionKind = 'card_enter',
  surface = 'shared',
  index = 0,
  disabled = false,
  reducedMotion = false,
  intensity = 'standard',
  day,
}: UseCreviaEntranceMotionInput = {}): { animatedStyle: StyleProp<ViewStyle>; shouldAnimate: boolean } {
  const density = resolveMotionDensity({ day, surface });
  const accessibility = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotion,
    motionKind,
    intensity,
  });
  const shouldAnimate =
    !disabled &&
    accessibility.allowEntranceMotion &&
    shouldAnimateMotionItem(surface, index, density);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const translateY = useSharedValue(
    shouldAnimate ? motionTranslateYForKind(motionKind, density) : 0,
  );
  const scale = useSharedValue(shouldAnimate && motionKind === 'chip_appear' ? 0.98 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    const delay = accessibility.allowStagger ? buildMotionDelay(index, surface) : 0;
    const duration = motionDurationForKind(motionKind);
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withTiming(0, { duration }));
    scale.value = withDelay(delay, withTiming(1, { duration }));
  }, [
    accessibility.allowStagger,
    index,
    motionKind,
    opacity,
    scale,
    shouldAnimate,
    surface,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return { animatedStyle, shouldAnimate };
}
