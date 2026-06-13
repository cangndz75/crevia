import { Image } from 'expo-image';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { CreviaMapOperationMarker } from '../types/creviaMapTypes';
import { mapPointToAbsoluteOverlayStyle } from '../utils/mapCoordinates';

type Props = {
  marker: CreviaMapOperationMarker;
};

const MARKER_SIZE_BY_KIND: Record<NonNullable<CreviaMapOperationMarker['kind']>, number> = {
  main: 46,
  pulse: 34,
  container: 36,
  personnel: 38,
  vehicle: 40,
  completed: 36,
};

const MARKER_ASSET_BY_KIND: Record<NonNullable<CreviaMapOperationMarker['kind']>, number> = {
  main: require('@/assets/maps/markers/map_marker_operation_live.png'),
  pulse: require('@/assets/maps/markers/map_marker_operation_live.png'),
  container: require('@/assets/maps/markers/map_marker_operation_live.png'),
  personnel: require('@/assets/maps/markers/map_marker_personnel.png'),
  vehicle: require('@/assets/maps/markers/map_marker_vehicle.png'),
  completed: require('@/assets/maps/markers/map_marker_completed.png'),
};

export const MapOperationMarker = memo(function MapOperationMarker({ marker }: Props) {
  const pulse = useSharedValue(0);
  const kind = marker.kind ?? 'main';
  const color = marker.color ?? '#0F8F86';
  const markerSize = MARKER_SIZE_BY_KIND[kind];
  const markerAsset = MARKER_ASSET_BY_KIND[kind];
  const isProminent = kind === 'main' || marker.priority === 'critical';

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300 }), -1, false);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (isProminent ? 0.24 : 0.16) * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * (isProminent ? 1.2 : 0.8) }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        mapPointToAbsoluteOverlayStyle(marker.point),
        {
          width: markerSize,
          height: markerSize,
          transform: [
            { translateX: -markerSize / 2 },
            { translateY: -markerSize / 2 },
          ],
        },
      ]}>
      <Animated.View
        style={[
          styles.pulse,
          pulseStyle,
          {
            backgroundColor: color,
            borderRadius: markerSize,
          },
        ]}
      />
      <Image
        source={markerAsset}
        style={{
          width: markerSize,
          height: markerSize,
        }}
        contentFit="contain"
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  pulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
