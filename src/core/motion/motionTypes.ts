export type MotionDurationKey =
  | 'instant'
  | 'fast'
  | 'base'
  | 'medium'
  | 'slow'
  | 'emphasis';

export type MotionDelayKey = 'none' | 'short' | 'stagger' | 'medium';

export type MotionIntensity = 'none' | 'subtle' | 'standard' | 'highlighted';

export type MotionKind =
  | 'screen_enter'
  | 'card_enter'
  | 'compact_card_enter'
  | 'line_appear'
  | 'chip_appear'
  | 'cta_press'
  | 'selection_press'
  | 'result_emphasis'
  | 'report_section_enter'
  | 'onboarding_step_transition'
  | 'soft_pulse'
  | 'glow_soft'
  | 'reduced_static';

export type MotionSurface =
  | 'onboarding'
  | 'hub'
  | 'decision_result'
  | 'report'
  | 'map'
  | 'social'
  | 'profile'
  | 'shared';

export type MotionDensity =
  | 'day1_minimal'
  | 'compact'
  | 'standard'
  | 'post_pilot_highlighted';

export type MotionAccessibilityInput = {
  reduceMotionEnabled?: boolean | null;
  motionKind?: MotionKind;
  intensity?: MotionIntensity;
};

export type MotionAccessibilityModel = {
  reduceMotionEnabled: boolean;
  allowEntranceMotion: boolean;
  allowPressScale: boolean;
  allowPulseMotion: boolean;
  allowGlowMotion: boolean;
  allowStagger: boolean;
  fallbackToStatic: boolean;
  accessibilityLabelSuffix: string;
};

export type MotionDensityInput = {
  day?: number;
  surface?: MotionSurface;
  isPostPilot?: boolean;
};
