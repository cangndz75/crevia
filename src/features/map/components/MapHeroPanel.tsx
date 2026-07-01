import { StyleSheet, View } from 'react-native';

import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import type { DistrictMapVisualStateMap } from '@/core/map/mapDistrictVisualState';
import { CityMapCard } from '@/features/map/components/CityMapCard';
import type { MapGameplayPresentation } from '@/features/map/utils/mapGameplayPresentation';
import type { MapMotionPresentationResult } from '@/features/map/utils/mapMotionPresentation';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';

import { type MapDistrictId } from '../data/mapAssets';
import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';
import type { ActiveLayers, MapFilterId, MapViewMode, PilotAreaId } from '../types/map';

type Props = {
  viewMode: MapViewMode;
  detailDistrictId: MapDistrictId;
  pilotAreaId: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  gameDay: number;
  activeLayers: ActiveLayers;
  activeEvents: EventCard[];
  containerState?: ContainerState;
  vehicleState?: VehicleState;
  hideContainerSignals?: boolean;
  hideVehicleSignals?: boolean;
  selectedPinId?: string | null;
  crisisHighlightDistrictIds?: MapDistrictId[];
  resourceHighlightDistrictIds?: MapDistrictId[];
  reactionHighlightDistrictIds?: MapDistrictId[];
  reactionMotionCues?: import('@/core/mapReactionsMotion/mapReactionMotionTypes').MapDistrictMotionCue[];
  operationScopeMotionDistrictIds?: MapDistrictId[];
  journalMotionCue?: import('@/core/mapReactionsMotion/mapReactionMotionTypes').MapJournalMotionCue;
  bubbleMotionCue?: import('@/core/mapReactionsMotion/mapReactionMotionTypes').MapBubbleMotionCue;
  reducedMotionMode?: boolean;
  mapPresenceViewModel?: MapPresenceViewModel | null;
  activeOperationOverlay?: MapActiveOperationOverlayModel | null;
  activeOperationCard?: ActiveOperationMapCardModel | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  mapGameplayPresentation?: MapGameplayPresentation | null;
  operationalResources?: OperationalResourcesState;
  mapMotionPresentation?: MapMotionPresentationResult | null;
  districtVisualStateMap?: DistrictMapVisualStateMap | null;
  mapReactionLiteModel?: MapReactionLiteModel | null;
  recentDecisionRecord?: DecisionRecord | null;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
  periodGoalShortTitle?: string;
  districtPersonalitySignalLine?: string;
  onLayersPress: () => void;
  onDistrictSelect: (districtId: MapDistrictId) => void;
  onBackToOverview: () => void;
  onPinPress?: (pinId: string) => void;
};

export function MapHeroPanel(props: Props) {
  return (
    <View style={styles.wrap}>
      <CityMapCard {...props} embedded />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});
