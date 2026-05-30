import { Easing } from 'react-native-reanimated';

import type { AnimationEasingKey } from './animationTypes';

export const REANIMATED_EASING: Record<AnimationEasingKey, (t: number) => number> = {
  standard: Easing.out(Easing.cubic),
  soft: Easing.inOut(Easing.quad),
  springLike: Easing.out(Easing.back(1.2)),
};
