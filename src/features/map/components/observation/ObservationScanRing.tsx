import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  centerX: number;
  centerY: number;
  active: boolean;
  reducedMotion?: boolean;
};

export function ObservationScanRing({
  centerX,
  centerY,
  active,
  reducedMotion = false,
}: Props) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    if (!active || reducedMotion) {
      scale.value = 1;
      opacity.value = reducedMotion && active ? 0.35 : 0;
      return;
    }
    scale.value = 0.8;
    opacity.value = 0.8;
    scale.value = withRepeat(
      withTiming(1.8, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [active, opacity, reducedMotion, scale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          left: `${centerX * 100}%`,
          top: `${centerY * 100}%`,
        },
      ]}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -1,
    marginTop: -1,
  },
  ring: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: mapUi.tealGlow,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  core: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: mapUi.teal,
    borderWidth: 2,
    borderColor: mapUi.gold,
  },
});
