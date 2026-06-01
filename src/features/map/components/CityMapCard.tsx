import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { MapActiveOperationOverlay } from '@/features/map/components/MapActiveOperationOverlay';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

import { type MapDistrictId } from '../data/mapAssets';
import {
  mapDistrictFromPilot,
  pilotAreaFromMapDistrict,
} from '../data/mapDistrictMapping';
import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';

import type { ActiveLayers, MapFilterId, MapViewMode, PilotAreaId } from '../types/map';
import { getNeighborhoodMapCharacterLine } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { getMapDistrictLabel } from '../utils/mapDistrictLabels';
import { CityOverviewMap } from './CityOverviewMap';
import { DistrictDetailMap } from './DistrictDetailMap';
import { MapLegend } from './MapLegend';
import type { ZoomableMapControls } from './ZoomableMapCanvas';

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
  /** Shell içinde tam genişlik — yatay margin kaldırılır */
  embedded?: boolean;
};

const MAP_HEIGHT = Math.min(
  390,
  Math.max(360, Math.round(Dimensions.get('window').height * 0.42)),
);

export function CityMapCard({
  viewMode,
  detailDistrictId,
  pilotAreaId,
  selectedDistrictId,
  selectedFilter,
  gameDay,
  activeLayers,
  activeEvents,
  containerState,
  vehicleState,
  hideContainerSignals = false,
  hideVehicleSignals = false,
  selectedPinId = null,
  crisisHighlightDistrictIds,
  resourceHighlightDistrictIds,
  mapPresenceViewModel = null,
  activeOperationOverlay = null,
  onLayersPress,
  onDistrictSelect,
  onBackToOverview,
  onPinPress,
  embedded = false,
}: Props) {
  const mapControlsRef = useRef<ZoomableMapControls>(null);
  const isDetail = viewMode === 'detail';
  const detailLabel = getMapDistrictLabel(detailDistrictId);
  const detailCharacterLine = getNeighborhoodMapCharacterLine(detailDistrictId);
  const detailPilotArea = pilotAreaFromMapDistrict(detailDistrictId);

  const handleDistrictPress = useCallback(
    (districtId: MapDistrictId) => {
      onDistrictSelect(districtId);
    },
    [onDistrictSelect],
  );

  return (
    <View style={[styles.card, embedded && styles.cardEmbedded, shadows.card]}>
      <View style={styles.mapArea}>
        {isDetail ? (
          <DistrictDetailMap
            mapRef={mapControlsRef}
            districtId={detailDistrictId}
            districtLabel={detailLabel}
            pilotAreaId={detailPilotArea}
            selectedDistrictId={selectedDistrictId}
            selectedFilter={selectedFilter}
            activeLayers={activeLayers}
            gameDay={gameDay}
            events={activeEvents}
            containerState={containerState}
            vehicleState={vehicleState}
            hideVehicleSignals={hideVehicleSignals}
            selectedPinId={selectedPinId}
            mapPresenceViewModel={mapPresenceViewModel}
            onPinPress={onPinPress}
          />
        ) : (
          <CityOverviewMap
            mapRef={mapControlsRef}
            selectedDistrictId={selectedDistrictId}
            highlightedDistrictId={mapDistrictFromPilot(selectedDistrictId)}
            pilotAreaId={pilotAreaId}
            selectedFilter={selectedFilter}
            activeLayers={activeLayers}
            gameDay={gameDay}
            events={activeEvents}
            containerState={containerState}
            vehicleState={vehicleState}
            hideContainerSignals={hideContainerSignals}
            hideVehicleSignals={hideVehicleSignals}
            selectedPinId={selectedPinId}
            crisisHighlightDistrictIds={crisisHighlightDistrictIds}
            resourceHighlightDistrictIds={resourceHighlightDistrictIds}
            mapPresenceViewModel={mapPresenceViewModel}
            onDistrictPress={handleDistrictPress}
            onPinPress={onPinPress}
          />
        )}

        {isDetail ? (
          <Pressable
            onPress={onBackToOverview}
            style={styles.detailBackChip}
            accessibilityLabel="Şehir haritasına dön">
            <Ionicons name="chevron-back" size={16} color={mapUi.teal} />
            <View style={styles.detailBackCopy}>
              <Text style={styles.detailBackTitle} numberOfLines={1}>
                {detailLabel}
              </Text>
              {detailCharacterLine ? (
                <Text style={styles.detailBackSub} numberOfLines={1}>
                  {detailCharacterLine}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ) : activeOperationOverlay ? (
          <MapActiveOperationOverlay model={activeOperationOverlay} />
        ) : null}

        <Pressable style={styles.layersBtn} onPress={onLayersPress}>
          <Ionicons name="layers-outline" size={20} color={mapUi.textDark} />
        </Pressable>

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomIn()}
            accessibilityLabel="Yakınlaştır">
            <Ionicons name="add" size={24} color={mapUi.textDark} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomOut()}
            accessibilityLabel="Uzaklaştır">
            <Ionicons name="remove" size={24} color={mapUi.textDark} />
          </Pressable>
          <Pressable
            style={[styles.zoomBtn, styles.zoomBtnAccent]}
            onPress={() => mapControlsRef.current?.reset()}
            accessibilityLabel="Haritayı sığdır">
            <Ionicons name="locate" size={22} color={mapUi.gold} />
          </Pressable>
        </View>

        <MapLegend filter={selectedFilter} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: mapUi.screenPadding,
    borderRadius: mapUi.mapCardRadius,
    backgroundColor: mapUi.mapBackdrop,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
  },
  cardEmbedded: {
    marginHorizontal: 0,
  },
  mapArea: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: mapUi.mapBackdrop,
  },
  detailBackChip: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 12,
    ...shadows.soft,
  },
  detailBackCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  detailBackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  detailBackSub: {
    fontSize: 11,
    fontWeight: '600',
    color: mapUi.textSecondary,
  },
  zoomControls: {
    position: 'absolute',
    left: 18,
    top: '36%',
    gap: 12,
    zIndex: 10,
  },
  zoomBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.soft,
  },
  zoomBtnAccent: {
    borderColor: mapUi.goldBorder,
  },
  layersBtn: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.soft,
  },
});
