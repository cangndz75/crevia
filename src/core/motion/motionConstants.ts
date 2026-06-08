import type {
  MotionDelayKey,
  MotionDensity,
  MotionDurationKey,
  MotionKind,
  MotionSurface,
} from './motionTypes';

export const MOTION_DURATION: Record<MotionDurationKey, number> = {
  instant: 0,
  fast: 120,
  base: 180,
  medium: 260,
  slow: 360,
  emphasis: 480,
};

export const MOTION_DELAY: Record<MotionDelayKey, number> = {
  none: 0,
  short: 40,
  stagger: 60,
  medium: 100,
};

export const MOTION_DENSITY_CAPS: Record<
  MotionSurface,
  { maxAnimatedItems: number; maxEmphasisItems: number }
> = {
  onboarding: { maxAnimatedItems: 1, maxEmphasisItems: 1 },
  hub: { maxAnimatedItems: 3, maxEmphasisItems: 1 },
  decision_result: { maxAnimatedItems: 4, maxEmphasisItems: 2 },
  report: { maxAnimatedItems: 3, maxEmphasisItems: 1 },
  map: { maxAnimatedItems: 0, maxEmphasisItems: 0 },
  social: { maxAnimatedItems: 2, maxEmphasisItems: 0 },
  profile: { maxAnimatedItems: 1, maxEmphasisItems: 0 },
  shared: { maxAnimatedItems: 2, maxEmphasisItems: 1 },
};

export const MOTION_KIND_DURATION: Record<MotionKind, number> = {
  screen_enter: MOTION_DURATION.medium,
  card_enter: MOTION_DURATION.medium,
  compact_card_enter: MOTION_DURATION.base,
  line_appear: MOTION_DURATION.fast,
  chip_appear: MOTION_DURATION.base,
  cta_press: MOTION_DURATION.fast,
  selection_press: MOTION_DURATION.fast,
  result_emphasis: MOTION_DURATION.slow,
  report_section_enter: MOTION_DURATION.medium,
  onboarding_step_transition: MOTION_DURATION.medium,
  soft_pulse: MOTION_DURATION.slow,
  glow_soft: MOTION_DURATION.emphasis,
  reduced_static: MOTION_DURATION.instant,
};

export const MOTION_DENSITY_BY_DAY: Record<MotionDensity, string> = {
  day1_minimal: 'Day 1: onboarding transition and CTA press only.',
  compact: 'Day 2-3: compact card and chip appearance only.',
  standard: 'Day 4-7: standard card, line and result motion.',
  post_pilot_highlighted: 'Day 8+: one highlighted main-operation entrance, then standard motion.',
};

export const MOTION_FOUNDATION_DOCS_PATH =
  'docs/crevia-motion-foundation-global-micro-animation.md';

export const MOTION_NO_NEW_DEPENDENCY_NOTE =
  'Uses existing react-native-reanimated dependency; no new dependency.';
