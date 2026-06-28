import { StyleSheet, View } from 'react-native';

import { MapGameplayMarker } from '@/features/map/components/MapGameplayMarker';
import type { MapGameplayMarker as MapGameplayMarkerModel } from '@/features/map/utils/mapGameplayPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapGameplayMarkerLayerProps = {
  markers: MapGameplayMarkerModel[];
  selectedMarkerId: string | null;
  reducedMotionMode?: boolean;
  onMarkerPress?: (markerId: string) => void;
};

function RouteHint({
  from,
  to,
}: {
  from: MapGameplayMarkerModel['coordinate'];
  to: MapGameplayMarkerModel['coordinate'];
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) * 3.6;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.routeLine,
        {
          left: `${from.x}%`,
          top: `${from.y}%`,
          width: `${Math.min(42, Math.max(12, length))}%`,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

export function MapGameplayMarkerLayer({
  markers,
  selectedMarkerId,
  reducedMotionMode = false,
  onMarkerPress,
}: MapGameplayMarkerLayerProps) {
  const hubMarker =
    markers.find((marker) => marker.type === 'district' || marker.type === 'resource') ??
    null;
  const selectedMarker =
    markers.find((marker) => marker.id === selectedMarkerId) ?? null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {selectedMarker && hubMarker && selectedMarker.id !== hubMarker.id ? (
        <RouteHint from={hubMarker.coordinate} to={selectedMarker.coordinate} />
      ) : null}

      {markers.map((marker) => (
        <MapGameplayMarker
          key={marker.id}
          marker={marker}
          selected={marker.id === selectedMarkerId}
          reducedMotionMode={reducedMotionMode}
          onPress={onMarkerPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 11,
  },
  routeLine: {
    position: 'absolute',
    height: 2,
    marginTop: -1,
    backgroundColor: mapUi.tealGlow,
    opacity: 0.55,
    borderRadius: 999,
  },
});
