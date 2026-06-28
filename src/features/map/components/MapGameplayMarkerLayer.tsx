import { StyleSheet, View } from 'react-native';

import { MapDistrictReactionHighlight } from '@/features/map/components/MapDistrictReactionHighlight';
import { MapGameplayMarker } from '@/features/map/components/MapGameplayMarker';
import { MapTacticalRouteLayer } from '@/features/map/components/MapTacticalRouteLayer';
import type { MapGameplayMarker as MapGameplayMarkerModel } from '@/features/map/utils/mapGameplayPresentation';
import type { MapTacticalMotionPresentation } from '@/features/map/utils/mapTacticalMotionPresentation';
import { getMarkerTacticalMotion } from '@/features/map/utils/mapTacticalMotionPresentation';

type MapGameplayMarkerLayerProps = {
  markers: MapGameplayMarkerModel[];
  selectedMarkerId: string | null;
  reducedMotionMode?: boolean;
  tacticalMotion?: MapTacticalMotionPresentation | null;
  onMarkerPress?: (markerId: string) => void;
};

export function MapGameplayMarkerLayer({
  markers,
  selectedMarkerId,
  reducedMotionMode = false,
  tacticalMotion = null,
  onMarkerPress,
}: MapGameplayMarkerLayerProps) {
  return (
    <View style={styles.layer} pointerEvents="box-none">
      <MapDistrictReactionHighlight
        highlight={tacticalMotion?.districtHighlight}
        reducedMotionMode={reducedMotionMode}
      />

      <MapTacticalRouteLayer
        route={tacticalMotion?.activeRoute}
        reducedMotionMode={reducedMotionMode}
      />

      {markers.map((marker) => {
        const motion = getMarkerTacticalMotion(tacticalMotion, marker.id);
        return (
          <MapGameplayMarker
            key={marker.id}
            marker={marker}
            selected={marker.id === selectedMarkerId}
            reducedMotionMode={reducedMotionMode}
            tacticalMotion={motion?.motion}
            passive={motion?.passive}
            onPress={onMarkerPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 11,
  },
});
