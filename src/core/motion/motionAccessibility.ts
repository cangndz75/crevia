import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import type { MotionAccessibilityInput, MotionAccessibilityModel } from './motionTypes';

export function buildMotionAccessibilityModel(
  input: MotionAccessibilityInput = {},
): MotionAccessibilityModel {
  const reduceMotionEnabled = Boolean(input.reduceMotionEnabled);
  const isNone = input.intensity === 'none' || input.motionKind === 'reduced_static';

  if (reduceMotionEnabled || isNone) {
    return {
      reduceMotionEnabled,
      allowEntranceMotion: false,
      allowPressScale: false,
      allowPulseMotion: false,
      allowGlowMotion: false,
      allowStagger: false,
      fallbackToStatic: true,
      accessibilityLabelSuffix: reduceMotionEnabled ? 'Animasyon azaltildi.' : '',
    };
  }

  return {
    reduceMotionEnabled,
    allowEntranceMotion: true,
    allowPressScale: true,
    allowPulseMotion: input.motionKind === 'soft_pulse',
    allowGlowMotion: input.motionKind === 'glow_soft',
    allowStagger: true,
    fallbackToStatic: false,
    accessibilityLabelSuffix: '',
  };
}

export async function fetchCreviaReducedMotionPreference(): Promise<boolean> {
  try {
    if (typeof AccessibilityInfo?.isReduceMotionEnabled !== 'function') return false;
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

export function useCreviaReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web') {
      setReduceMotion(false);
    }

    void fetchCreviaReducedMotionPreference().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setReduceMotion(enabled);
      },
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}
