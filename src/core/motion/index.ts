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
