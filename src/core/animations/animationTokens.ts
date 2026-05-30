import type {
  AnimationDistanceKey,
  AnimationDurationKey,
  AnimationEasingKey,
  AnimationScaleKey,
} from './animationTypes';

export const ANIMATION_DURATION: Record<AnimationDurationKey, number> = {
  fast: 120,
  normal: 180,
  slow: 260,
} as const;

export const ANIMATION_SCALE: Record<AnimationScaleKey, number> = {
  press: 0.97,
  pop: 1.02,
  subtle: 0.99,
} as const;

export const ANIMATION_DISTANCE: Record<AnimationDistanceKey, number> = {
  small: 6,
  medium: 12,
  entrance: 8,
} as const;

/** Verify/script-safe easing curves (reanimated Easing ile ayrı eşlenir). */
export const ANIMATION_EASING: Record<AnimationEasingKey, (t: number) => number> = {
  standard: (t) => 1 - (1 - t) ** 3,
  soft: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  springLike: (t) => {
    const c1 = 1.2;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
} as const;

export const MAX_ANIMATION_DURATION_MS = 300;

export const SELECTED_PULSE_REPEAT_DEFAULT = 2;
