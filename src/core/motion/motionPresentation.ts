import {
  MOTION_DELAY,
  MOTION_DENSITY_CAPS,
  MOTION_KIND_DURATION,
} from './motionConstants';
import type { MotionDensity, MotionDensityInput, MotionKind, MotionSurface } from './motionTypes';

export function resolveMotionDensity(input: MotionDensityInput = {}): MotionDensity {
  const day = input.day ?? 1;
  if (day <= 1) return 'day1_minimal';
  if (day <= 3) return 'compact';
  if (input.isPostPilot || day >= 8) return 'post_pilot_highlighted';
  return 'standard';
}

export function buildMotionDelay(index = 0, surface: MotionSurface = 'shared'): number {
  const cap = MOTION_DENSITY_CAPS[surface].maxAnimatedItems;
  if (index <= 0) return MOTION_DELAY.none;
  if (index >= cap) return MOTION_DELAY.medium;
  return index * MOTION_DELAY.stagger;
}

export function shouldAnimateMotionItem(
  surface: MotionSurface,
  index = 0,
  density: MotionDensity = 'standard',
): boolean {
  if (density === 'day1_minimal' && surface !== 'onboarding') return false;
  return index < MOTION_DENSITY_CAPS[surface].maxAnimatedItems;
}

export function motionDurationForKind(kind: MotionKind): number {
  return MOTION_KIND_DURATION[kind];
}

export function motionTranslateYForKind(kind: MotionKind, density: MotionDensity): number {
  if (density === 'day1_minimal') return 4;
  if (kind === 'compact_card_enter' || kind === 'line_appear' || kind === 'chip_appear') return 6;
  if (kind === 'result_emphasis') return 8;
  return 10;
}
