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
import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapGameplayMarkerProps = {
  marker: MapGameplayMarkerModel;
  selected?: boolean;
  reducedMotionMode?: boolean;
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

export const MapGameplayMarker = memo(function MapGameplayMarker({
  marker,
  selected = false,
  reducedMotionMode = false,
  onPress,
}: MapGameplayMarkerProps) {
  const pulse = useSharedValue(0);
  const style = MARKER_STYLE[marker.type];
  const shouldPulse = marker.pulse === true && !reducedMotionMode;

  useEffect(() => {
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
    return () => cancelAnimation(pulse);
  }, [pulse, shouldPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.1 }],
  }));

  const size = selected ? 42 : marker.type === 'active_event' ? 38 : 34;

  return (
    <Pressable
      onPress={() => onPress?.(marker.id)}
      style={[
        styles.wrap,
        {
          left: `${marker.coordinate.x}%`,
          top: `${marker.coordinate.y}%`,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={marker.title}
      hitSlop={8}>
      {shouldPulse ? (
        <Animated.View
          style={[
            styles.pulseRing,
            { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 },
            pulseStyle,
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
            borderColor: selected ? mapUi.gold : 'rgba(255,255,255,0.9)',
            borderWidth: selected ? 3 : 2,
          },
          selected && styles.selectedGlow,
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
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
