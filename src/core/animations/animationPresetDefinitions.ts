import {
  ANIMATION_DISTANCE,
  ANIMATION_DURATION,
  ANIMATION_SCALE,
  SELECTED_PULSE_REPEAT_DEFAULT,
} from './animationTokens';
import type { AnimationPresetKey } from './animationTypes';

export type AnimationPresetDefinition = {
  key: AnimationPresetKey;
  durationMs: number;
  minScale?: number;
  maxScale?: number;
  translateY?: number;
  endlessLoop: boolean;
  pulseRepeatCount?: number;
};

export const ANIMATION_PRESET_DEFINITIONS: Record<
  AnimationPresetKey,
  AnimationPresetDefinition
> = {
  pressScale: {
    key: 'pressScale',
    durationMs: ANIMATION_DURATION.fast,
    minScale: ANIMATION_SCALE.press,
    maxScale: 1,
    endlessLoop: false,
  },
  cardEntrance: {
    key: 'cardEntrance',
    durationMs: ANIMATION_DURATION.normal,
    translateY: ANIMATION_DISTANCE.entrance,
    endlessLoop: false,
  },
  softPop: {
    key: 'softPop',
    durationMs: ANIMATION_DURATION.normal,
    minScale: 0.98,
    maxScale: ANIMATION_SCALE.pop,
    endlessLoop: false,
  },
  selectedPulse: {
    key: 'selectedPulse',
    durationMs: ANIMATION_DURATION.slow,
    minScale: 1,
    maxScale: 1.04,
    endlessLoop: false,
    pulseRepeatCount: SELECTED_PULSE_REPEAT_DEFAULT,
  },
  stepTransition: {
    key: 'stepTransition',
    durationMs: ANIMATION_DURATION.normal,
    translateY: ANIMATION_DISTANCE.small,
    endlessLoop: false,
  },
};

export function getAnimationPreset(key: AnimationPresetKey): AnimationPresetDefinition {
  return ANIMATION_PRESET_DEFINITIONS[key];
}
