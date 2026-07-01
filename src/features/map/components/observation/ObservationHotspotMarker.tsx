import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  x: number;
  y: number;
  revealed: boolean;
  scanning: boolean;
  reducedMotion?: boolean;
};

export function ObservationHotspotMarker({
  x,
  y,
  revealed,
  scanning,
  reducedMotion = false,
}: Props) {
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(scanning ? 0.28 : 0.92);

  useEffect(() => {
    opacity.value = withTiming(revealed ? 0.95 : scanning ? 0.28 : 0.2, {
      duration: reducedMotion ? 80 : 260,
    });
  }, [opacity, reducedMotion, revealed, scanning]);

  useEffect(() => {
    if (!scanning && !revealed) return;
    if (reducedMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, reducedMotion, revealed, scanning]);

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
        },
      ]}>
      <Animated.View style={[styles.marker, markerStyle]} />
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
  },
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: mapUi.riskCritical,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: mapUi.riskCritical,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
