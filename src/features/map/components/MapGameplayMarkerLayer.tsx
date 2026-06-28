import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapDistrictReactionHighlight } from '@/features/map/components/MapDistrictReactionHighlight';
import { MapGameplayMarker } from '@/features/map/components/MapGameplayMarker';
import { MapTacticalRouteLayer } from '@/features/map/components/MapTacticalRouteLayer';
import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type { MapGameplayMarker as MapGameplayMarkerModel } from '@/features/map/utils/mapGameplayPresentation';
import {
  buildMapMarkerFeedbackBatch,
  buildMarkerActionBundleInputForFeedback,
} from '@/features/map/utils/mapMarkerFeedbackPresentation';
import type { MapTacticalMotionPresentation } from '@/features/map/utils/mapTacticalMotionPresentation';
import { getMarkerTacticalMotion } from '@/features/map/utils/mapTacticalMotionPresentation';

type MapGameplayMarkerLayerProps = {
  markers: MapGameplayMarkerModel[];
  selectedMarkerId: string | null;
  reducedMotionMode?: boolean;
  tacticalMotion?: MapTacticalMotionPresentation | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  activeOperationCard?: ActiveOperationMapCardModel | null;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
  districtPersonalitySignalLine?: string;
  periodGoalShortTitle?: string;
  onMarkerPress?: (markerId: string) => void;
};

export function MapGameplayMarkerLayer({
  markers,
  selectedMarkerId,
  reducedMotionMode = false,
  tacticalMotion = null,
  activeOperationBinding = null,
  activeOperationCard = null,
  maintenanceBacklogRuntime = null,
  districtPersonalitySignalLine,
  periodGoalShortTitle,
  onMarkerPress,
}: MapGameplayMarkerLayerProps) {
  const feedbackByMarkerId = useMemo(
    () =>
      buildMapMarkerFeedbackBatch({
        markers,
        selectedMarkerId,
        activeOperationBinding,
        tacticalMotions: tacticalMotion?.markerMotions,
        reducedMotion: reducedMotionMode,
        actionBundleInputForMarker: (marker) =>
          buildMarkerActionBundleInputForFeedback(marker, {
            binding: activeOperationBinding,
            card: activeOperationCard,
            maintenanceRuntime: maintenanceBacklogRuntime,
            personalitySignalLine: districtPersonalitySignalLine,
            periodGoalShortTitle,
          }),
      }),
    [
      activeOperationBinding,
      activeOperationCard,
      districtPersonalitySignalLine,
      maintenanceBacklogRuntime,
      markers,
      periodGoalShortTitle,
      reducedMotionMode,
      selectedMarkerId,
      tacticalMotion?.markerMotions,
    ],
  );

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
        const feedback = feedbackByMarkerId.get(marker.id);
        if (!feedback) return null;
        return (
          <MapGameplayMarker
            key={marker.id}
            marker={marker}
            feedback={feedback}
            reducedMotionMode={reducedMotionMode}
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
