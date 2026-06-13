/**
 * Merkez / operasyon fazları için motion token'ları.
 * Global MOTION_DURATION ile çakışmaması için ayrı isimlendirme kullanılır.
 */

export const MOTION_TOKEN_DURATION = {
  instant: 0,
  press: 90,
  fast: 160,
  normal: 220,
  reveal: 420,
  scan: 700,
  progress: 650,
  celebration: 1100,
} as const;

export const MOTION_TOKEN_DELAY = {
  none: 0,
  staggerSmall: 45,
  staggerMedium: 75,
  staggerLarge: 110,
} as const;

export const MOTION_TOKEN_SCALE = {
  press: 0.975,
  cardActive: 1.015,
  ctaPulse: 1.025,
} as const;

export const MOTION_TOKEN_OPACITY = {
  hidden: 0,
  dimmed: 0.62,
  visible: 1,
} as const;

export const MOTION_TOKEN_TRANSLATE = {
  cardEnterY: 10,
  subtleLiftY: -2,
} as const;

export const MOTION_TOKEN_PULSE = {
  softRepeatCount: 2,
  maxLoopMs: 2200,
} as const;

export const MOTION_TOKEN_MAX_DURATION = 500;
export const MOTION_TOKEN_MAX_STAGGER_TOTAL = 280;

export type MotionTokenDurationKey = keyof typeof MOTION_TOKEN_DURATION;
export type MotionTokenDelayKey = keyof typeof MOTION_TOKEN_DELAY;

export function motionTokenDuration(key: MotionTokenDurationKey): number {
  return MOTION_TOKEN_DURATION[key];
}

export function centerCardEnterDelay(index: number): number {
  if (index <= 0) return MOTION_TOKEN_DELAY.none;
  if (index === 1) return MOTION_TOKEN_DELAY.staggerSmall;
  if (index === 2) return MOTION_TOKEN_DELAY.staggerMedium;
  return MOTION_TOKEN_DELAY.staggerLarge;
}

export function centerCardEnterStaggerTotal(moduleCount: number): number {
  let total = 0;
  for (let index = 1; index < moduleCount; index += 1) {
    total += centerCardEnterDelay(index);
  }
  return total;
}

export function motionTokenDurationsValid(): boolean {
  return Object.values(MOTION_TOKEN_DURATION).every(
    (value) => value >= 0 && value <= MOTION_TOKEN_MAX_DURATION + 700,
  );
}
