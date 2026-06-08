import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { MotionIntensity, MotionKind, MotionSurface } from '@/core/motion';

import { useCreviaEntranceMotion } from './useCreviaEntranceMotion';

type CreviaMotionViewProps = {
  children: ReactNode;
  motionKind?: MotionKind;
  surface?: MotionSurface;
  index?: number;
  disabled?: boolean;
  reducedMotion?: boolean;
  intensity?: MotionIntensity;
  day?: number;
  style?: StyleProp<ViewStyle>;
};

export function CreviaMotionView({
  children,
  motionKind = 'card_enter',
  surface = 'shared',
  index = 0,
  disabled = false,
  reducedMotion = false,
  intensity = 'standard',
  day,
  style,
}: CreviaMotionViewProps) {
  const { animatedStyle, shouldAnimate } = useCreviaEntranceMotion({
    motionKind,
    surface,
    index,
    disabled,
    reducedMotion,
    intensity,
    day,
  });

  if (!shouldAnimate) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
