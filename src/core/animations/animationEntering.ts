import { FadeIn, FadeInUp } from 'react-native-reanimated';

import { getAnimationPreset } from './animationPresetDefinitions';
import { REANIMATED_EASING } from './animationEasing';
import { ANIMATION_DISTANCE, ANIMATION_DURATION } from './animationTokens';

/** Kart girişi — opacity 0→1, translateY 8→0 */
export function cardEntranceEntering(delay = 0) {
  const preset = getAnimationPreset('cardEntrance');
  return FadeInUp.duration(preset.durationMs)
    .delay(delay)
    .easing(REANIMATED_EASING.soft)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: preset.translateY ?? ANIMATION_DISTANCE.entrance }],
    });
}

/** Workflow faz geçişi — hafif fade + küçük slide */
export function stepTransitionEntering(delay = 0) {
  const preset = getAnimationPreset('stepTransition');
  return FadeIn.duration(preset.durationMs)
    .delay(delay)
    .easing(REANIMATED_EASING.standard)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: preset.translateY ?? ANIMATION_DISTANCE.small }],
    });
}
