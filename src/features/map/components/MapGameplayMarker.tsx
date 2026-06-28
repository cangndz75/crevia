import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type {
  MapGameplayMarker as MapGameplayMarkerModel,
  MapGameplayMarkerType,
} from '@/features/map/utils/mapGameplayPresentation';
import type { MapTacticalMarkerMotionKind } from '@/features/map/utils/mapTacticalMotionPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapGameplayMarkerProps = {
  marker: MapGameplayMarkerModel;
  selected?: boolean;
  reducedMotionMode?: boolean;
  tacticalMotion?: MapTacticalMarkerMotionKind;
  passive?: boolean;
  onPress?: (markerId: string) => void;
};

const MARKER_STYLE: Record<
  MapGameplayMarkerType,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  active_event: { color: '#EF4444', bg: 'rgba(239,68,68,0.18)', icon: 'alert-circle' },
  urgent_signal: { color: '#F59E0B', bg: 'rgba(245,158,11,0.18)', icon: 'notifications' },
  resolved: { color: '#22C55E', bg: 'rgba(34,197,94,0.16)', icon: 'checkmark-circle' },
  opportunity: { color: '#14B8A6', bg: 'rgba(20,184,166,0.16)', icon: 'sparkles' },
  resource: { color: mapUi.gold, bg: 'rgba(216,167,46,0.16)', icon: 'layers' },
  district: { color: mapUi.teal, bg: 'rgba(20,184,166,0.14)', icon: 'business' },
  operation: { color: mapUi.teal, bg: 'rgba(20,184,166,0.14)', icon: 'radio' },
};

function pulseRingColor(
  motion: MapTacticalMarkerMotionKind | undefined,
  markerType: MapGameplayMarkerType,
): string {
  if (motion === 'riskPulse') return 'rgba(245, 158, 11, 0.38)';
  if (motion === 'softPulse') return 'rgba(20, 184, 166, 0.32)';
  if (markerType === 'active_event') return 'rgba(239, 68, 68, 0.35)';
  return 'rgba(20, 184, 166, 0.28)';
}

export const MapGameplayMarker = memo(function MapGameplayMarker({
  marker,
  selected = false,
  reducedMotionMode = false,
  tacticalMotion = 'none',
  passive = false,
  onPress,
}: MapGameplayMarkerProps) {
  const pulse = useSharedValue(0);
  const style = MARKER_STYLE[marker.type];
  const motion = selected ? 'selected' : tacticalMotion;
  const shouldPulse =
    !reducedMotionMode &&
    marker.status !== 'resolved' &&
    marker.type !== 'resolved' &&
    (motion === 'softPulse' || motion === 'riskPulse' || (marker.pulse === true && motion === 'none'));

  useEffect(() => {
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    const duration = motion === 'riskPulse' ? 1200 : 1400;
    pulse.value = withRepeat(withTiming(1, { duration }), -1, false);
    return () => cancelAnimation(pulse);
  }, [motion, pulse, shouldPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (motion === 'riskPulse' ? 0.34 : 0.28) * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * (motion === 'riskPulse' ? 1.2 : 1.05) }],
  }));

  const size = selected ? 42 : marker.type === 'active_event' ? 38 : 34;
  const showCompletedEcho = motion === 'completedEcho';
  const showSelectedRing = selected || motion === 'selected';

  return (
    <Pressable
      onPress={() => onPress?.(marker.id)}
      style={[
        styles.wrap,
        {
          left: `${marker.coordinate.x}%`,
          top: `${marker.coordinate.y}%`,
          opacity: passive ? 0.42 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={marker.title}
      hitSlop={8}>
      {shouldPulse ? (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 24,
              height: size + 24,
              borderRadius: (size + 24) / 2,
              borderColor: pulseRingColor(motion, marker.type),
            },
            pulseStyle,
          ]}
        />
      ) : null}

      {showCompletedEcho ? (
        <View
          style={[
            styles.completedEcho,
            {
              width: size + 14,
              height: size + 14,
              borderRadius: (size + 14) / 2,
            },
          ]}
        />
      ) : null}

      {showSelectedRing && reducedMotionMode ? (
        <View
          style={[
            styles.staticSelectedRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: style.color,
            borderColor: showSelectedRing ? mapUi.gold : 'rgba(255,255,255,0.9)',
            borderWidth: showSelectedRing ? 3 : 2,
          },
          showSelectedRing && styles.selectedGlow,
        ]}>
        <Ionicons
          name={style.icon}
          size={selected ? 18 : marker.type === 'active_event' ? 16 : 14}
          color="#FFFFFF"
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -19,
    marginTop: -19,
    zIndex: 12,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  completedEcho: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  staticSelectedRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: mapUi.gold,
    opacity: 0.55,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
    ...mapUi.controlShadow,
  },
  selectedGlow: {
    shadowColor: mapUi.gold,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
