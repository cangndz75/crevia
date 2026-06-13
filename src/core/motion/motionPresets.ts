import { buildMotionAccessibilityModel } from './motionAccessibility';
import {
  OPERATION_MOTION_FINDING_REVEAL_MS,
  OPERATION_MOTION_FINDING_STAGGER_MS,
  OPERATION_MOTION_SCAN_MS,
} from './operationMotionTokens';
import {
  MOTION_TOKEN_DELAY,
  MOTION_TOKEN_DURATION,
  MOTION_TOKEN_OPACITY,
  MOTION_TOKEN_PULSE,
  MOTION_TOKEN_SCALE,
  MOTION_TOKEN_TRANSLATE,
  centerCardEnterDelay,
  motionTokenDuration,
} from './motionTokens';

export type CenterRevealLevel = 'none' | 'soft' | 'strong';
export type CenterAttentionLevel = 'none' | 'soft' | 'medium' | 'strong';

export function isPulsePresetDisabled(reducedMotion: boolean): boolean {
  if (reducedMotion) return true;
  const model = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotion,
    motionKind: 'soft_pulse',
  });
  return !model.allowPulseMotion;
}

export function isGlowPresetDisabled(reducedMotion: boolean): boolean {
  if (reducedMotion) return true;
  const model = buildMotionAccessibilityModel({
    reduceMotionEnabled: reducedMotion,
    motionKind: 'glow_soft',
  });
  return !model.allowGlowMotion;
}

export function centerPressScaleValue(reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  return MOTION_TOKEN_SCALE.press;
}

export function centerCardEnterConfig(index: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      duration: MOTION_TOKEN_DURATION.instant,
      delay: 0,
      translateY: 0,
      opacityFrom: MOTION_TOKEN_OPACITY.visible,
      enabled: false,
    };
  }

  return {
    duration: motionTokenDuration('reveal'),
    delay: centerCardEnterDelay(index),
    translateY: MOTION_TOKEN_TRANSLATE.cardEnterY,
    opacityFrom: MOTION_TOKEN_OPACITY.hidden,
    enabled: true,
  };
}

export function centerCtaPulseConfig(reducedMotion: boolean) {
  return {
    enabled: !isPulsePresetDisabled(reducedMotion),
    scaleTo: MOTION_TOKEN_SCALE.ctaPulse,
    duration: MOTION_TOKEN_DURATION.fast,
    repeatCount: MOTION_TOKEN_PULSE.softRepeatCount,
    maxLoopMs: MOTION_TOKEN_PULSE.maxLoopMs,
  };
}

export function centerRewardPulseConfig(reducedMotion: boolean, ctaEnabled: boolean) {
  return {
    enabled: !isPulsePresetDisabled(reducedMotion) && ctaEnabled,
    duration: MOTION_TOKEN_DURATION.normal,
    repeatCount: MOTION_TOKEN_PULSE.softRepeatCount,
  };
}

export function centerSpeechRevealConfig(reducedMotion: boolean, shouldReveal: boolean) {
  if (!shouldReveal || reducedMotion) {
    return { enabled: false, duration: MOTION_TOKEN_DURATION.instant };
  }
  return {
    enabled: true,
    duration: MOTION_TOKEN_DURATION.normal,
    delay: MOTION_TOKEN_DURATION.fast,
  };
}

export function centerAvatarAttentionConfig(
  level: CenterAttentionLevel,
  reducedMotion: boolean,
) {
  if (reducedMotion || level === 'none') {
    return { enabled: false, repeatCount: 0, scaleTo: 1 };
  }
  return {
    enabled: true,
    repeatCount: level === 'strong' ? MOTION_TOKEN_PULSE.softRepeatCount : 1,
    scaleTo: level === 'medium' || level === 'strong' ? MOTION_TOKEN_SCALE.cardActive : 1.01,
    duration: MOTION_TOKEN_DURATION.fast,
  };
}

export function centerProgressFillConfig(reducedMotion: boolean, highlight: boolean) {
  if (!highlight || reducedMotion) {
    return { enabled: false, duration: MOTION_TOKEN_DURATION.instant };
  }
  return {
    enabled: true,
    duration: MOTION_TOKEN_DURATION.progress,
  };
}

export function centerRevealLevelIntensity(level: CenterRevealLevel): number {
  switch (level) {
    case 'strong':
      return MOTION_TOKEN_SCALE.ctaPulse;
    case 'soft':
      return MOTION_TOKEN_SCALE.cardActive;
    default:
      return 1;
  }
}

/** CTA pulse sonsuz loop değil; sınırlı tekrar. */
export function centerCtaPulseIsBounded(): boolean {
  return MOTION_TOKEN_PULSE.softRepeatCount > 0 && MOTION_TOKEN_PULSE.softRepeatCount < 10;
}

/** Operasyon İncele fazı scan süresi: 600–900ms bandı (token scan = 700ms). */
export function operationInspectScanConfig(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      enabled: false,
      durationMs: 0,
      revealLevel: 'none' as CenterRevealLevel,
    };
  }
  return {
    enabled: true,
    durationMs: OPERATION_MOTION_SCAN_MS,
    revealLevel: 'soft' as CenterRevealLevel,
  };
}

/** Bulgu kartı reveal: 160ms, stagger 45ms. */
export function operationFindingRevealConfig(reducedMotion: boolean, index: number) {
  if (reducedMotion) {
    return { enabled: false, durationMs: 0, delayMs: 0 };
  }
  return {
    enabled: true,
    durationMs: OPERATION_MOTION_FINDING_REVEAL_MS,
    delayMs: index * OPERATION_MOTION_FINDING_STAGGER_MS,
  };
}
