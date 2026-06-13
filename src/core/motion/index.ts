export {
  MOTION_DELAY,
  MOTION_DENSITY_BY_DAY,
  MOTION_DENSITY_CAPS,
  MOTION_DURATION,
  MOTION_FOUNDATION_DOCS_PATH,
  MOTION_KIND_DURATION,
  MOTION_NO_NEW_DEPENDENCY_NOTE,
} from './motionConstants';

export {
  MOTION_TOKEN_DELAY,
  MOTION_TOKEN_DURATION,
  MOTION_TOKEN_MAX_STAGGER_TOTAL,
  MOTION_TOKEN_PULSE,
  centerCardEnterDelay,
  centerCardEnterStaggerTotal,
  motionTokenDurationsValid,
  motionTokenDuration,
} from './motionTokens';

export {
  centerAvatarAttentionConfig,
  centerCardEnterConfig,
  centerCtaPulseConfig,
  centerCtaPulseIsBounded,
  centerPressScaleValue,
  centerProgressFillConfig,
  centerRewardPulseConfig,
  centerSpeechRevealConfig,
  isGlowPresetDisabled,
  isPulsePresetDisabled,
  operationFindingRevealConfig,
  operationInspectScanConfig,
} from './motionPresets';

export type { CenterAttentionLevel, CenterRevealLevel } from './motionPresets';

export {
  buildMotionAccessibilityModel,
  fetchCreviaReducedMotionPreference,
  useCreviaReducedMotion,
} from './motionAccessibility';

export {
  buildMotionDelay,
  motionDurationForKind,
  motionTranslateYForKind,
  resolveMotionDensity,
  shouldAnimateMotionItem,
} from './motionPresentation';

export type {
  MotionAccessibilityInput,
  MotionAccessibilityModel,
  MotionDelayKey,
  MotionDensity,
  MotionDensityInput,
  MotionDurationKey,
  MotionIntensity,
  MotionKind,
  MotionSurface,
} from './motionTypes';
