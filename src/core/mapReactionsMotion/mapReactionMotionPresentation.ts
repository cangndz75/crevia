import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import {
  collectMapReactionMotionAccessibilityLabels,
  motionCueRingRadius,
  motionCueStrokeColor,
  resolveReduceMotionPreferenceSync,
} from './mapReactionMotionHelpers';

export {
  buildMapReactionMotionIntegrationModel,
  collectMapReactionMotionAccessibilityLabels,
  motionCueRingRadius,
  motionCueStrokeColor,
  resolveReduceMotionPreferenceSync,
} from './mapReactionMotionHelpers';

export async function fetchReduceMotionPreference(): Promise<boolean> {
  try {
    if (typeof AccessibilityInfo?.isReduceMotionEnabled !== 'function') {
      return resolveReduceMotionPreferenceSync();
    }
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return resolveReduceMotionPreferenceSync();
  }
}

export function useReduceMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (Platform.OS !== 'web') {
      return false;
    }
    return resolveReduceMotionPreferenceSync();
  });

  useEffect(() => {
    let mounted = true;
    void fetchReduceMotionPreference().then((value) => {
      if (mounted) setReduceMotion(value);
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
