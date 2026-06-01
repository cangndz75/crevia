import { StyleSheet, View } from 'react-native';

import { CityMapCard } from '@/features/map/components/CityMapCard';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

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
  mapPresenceViewModel?: MapPresenceViewModel | null;
  activeOperationOverlay?: MapActiveOperationOverlayModel | null;
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
    minWidth: 0,
  },
});
