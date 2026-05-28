import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { type MapDistrictId } from '../data/mapAssets';
import {
  mapDistrictFromPilot,
  pilotAreaFromMapDistrict,
} from '../data/mapDistrictMapping';
import { getPilotPreset } from '../data/mapSelectors';
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
  onLayersPress: () => void;
  onDistrictSelect: (districtId: MapDistrictId) => void;
  onBackToOverview: () => void;
  onPinPress?: (pinId: string) => void;
};

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
  onLayersPress,
  onDistrictSelect,
  onBackToOverview,
  onPinPress,
}: Props) {
  const preset = getPilotPreset(pilotAreaId);
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

  const focusLabel = isDetail
    ? `${detailLabel} — detay harita`
    : preset.mapFocusLabel;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.focusBadge}>
        {isDetail ? (
          <Pressable
            onPress={onBackToOverview}
            style={styles.backBtn}
            accessibilityLabel="Şehir haritasına dön"
          >
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
            <Text style={styles.backBtnText}>Şehir</Text>
          </Pressable>
        ) : (
          <Ionicons name="locate" size={12} color={preset.themeColor} />
        )}
        <View style={styles.focusTextCol}>
          <Text
            style={[
              styles.focusBadgeText,
              { color: isDetail ? colors.textPrimary : preset.themeColor },
            ]}
          >
            {focusLabel}
          </Text>
          {isDetail && detailCharacterLine ? (
            <Text style={styles.characterLine} numberOfLines={1}>
              {detailCharacterLine}
            </Text>
          ) : null}
        </View>
        {activeEvents.length > 0 && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>
              {activeEvents.length} aktif olay
            </Text>
          </View>
        )}
      </View>

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
            onDistrictPress={handleDistrictPress}
            onPinPress={onPinPress}
          />
        )}

        <MapLegend filter={selectedFilter} />

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomIn()}
            accessibilityLabel="Yakınlaştır"
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomOut()}
            accessibilityLabel="Uzaklaştır"
          >
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.reset()}
            accessibilityLabel="Haritayı sığdır"
          >
            <Ionicons name="locate" size={16} color={preset.themeColor} />
          </Pressable>
        </View>

        <Pressable style={styles.layersBtn} onPress={onLayersPress}>
          <Ionicons name="layers" size={16} color={colors.textPrimary} />
          <Text style={styles.layersBtnText}>Katmanlar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 4,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  focusTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  focusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  characterLine: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  mapArea: {
    height: 300,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8E4DA',
  },
  zoomControls: {
    position: 'absolute',
    left: 12,
    top: 12,
    gap: 6,
    zIndex: 10,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  layersBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    zIndex: 10,
    ...shadows.soft,
  },
  layersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
