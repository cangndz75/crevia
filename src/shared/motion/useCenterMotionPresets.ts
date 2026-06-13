import { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { CenterAttentionLevel } from '@/core/motion/motionPresets';
import {
  centerAvatarAttentionConfig,
  centerCtaPulseConfig,
  centerProgressFillConfig,
  centerRewardPulseConfig,
  centerSpeechRevealConfig,
} from '@/core/motion/motionPresets';
import { MOTION_TOKEN_OPACITY } from '@/core/motion/motionTokens';

export function useCenterCtaPulse(active: boolean, reducedMotion: boolean) {
  const config = centerCtaPulseConfig(reducedMotion);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || !config.enabled) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(config.scaleTo, { duration: config.duration }),
        withTiming(1, { duration: config.duration }),
      ),
      config.repeatCount,
      true,
    );
  }, [active, config.duration, config.enabled, config.repeatCount, config.scaleTo, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

export function useCenterRewardPulse(
  active: boolean,
  reducedMotion: boolean,
  ctaEnabled: boolean,
) {
  const config = centerRewardPulseConfig(reducedMotion, ctaEnabled);
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    if (!active || !config.enabled) {
      cancelAnimation(borderOpacity);
      borderOpacity.value = 1;
      return;
    }

    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: config.duration }),
        withTiming(1, { duration: config.duration }),
      ),
      config.repeatCount,
      true,
    );
  }, [active, borderOpacity, config.duration, config.enabled, config.repeatCount]);

  return useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));
}

export function useCenterSpeechReveal(shouldReveal: boolean, reducedMotion: boolean) {
  const config = centerSpeechRevealConfig(reducedMotion, shouldReveal);
  const opacity = useSharedValue(
    config.enabled ? MOTION_TOKEN_OPACITY.hidden : MOTION_TOKEN_OPACITY.visible,
  );
  const translateY = useSharedValue(config.enabled ? 4 : 0);

  useEffect(() => {
    if (!config.enabled) {
      opacity.value = MOTION_TOKEN_OPACITY.visible;
      translateY.value = 0;
      return;
    }

    opacity.value = withDelay(
      config.delay ?? 0,
      withTiming(MOTION_TOKEN_OPACITY.visible, { duration: config.duration }),
    );
    translateY.value = withDelay(
      config.delay ?? 0,
      withTiming(0, { duration: config.duration }),
    );
  }, [config.delay, config.duration, config.enabled, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

export function useCenterAvatarAttention(
  level: CenterAttentionLevel,
  reducedMotion: boolean,
  compact: boolean,
) {
  const config = centerAvatarAttentionConfig(compact ? 'none' : level, reducedMotion);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!config.enabled) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(config.scaleTo, { duration: config.duration }),
        withTiming(1, { duration: config.duration }),
      ),
      config.repeatCount,
      true,
    );
  }, [config.duration, config.enabled, config.repeatCount, config.scaleTo, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

export function useCenterProgressHighlight(
  highlight: boolean,
  reducedMotion: boolean,
) {
  const config = centerProgressFillConfig(reducedMotion, highlight);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!config.enabled) {
      cancelAnimation(opacity);
      opacity.value = 1;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: config.duration }),
        withTiming(1, { duration: config.duration }),
      ),
      2,
      true,
    );
  }, [config.duration, config.enabled, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}
