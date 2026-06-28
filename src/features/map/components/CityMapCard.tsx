import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { MapBubbleMotionCue, MapDistrictMotionCue, MapJournalMotionCue } from '@/core/mapReactionsMotion/mapReactionMotionTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import { getNeighborhoodMapCharacterLine } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { MapCompactBottomPanel } from '@/features/map/components/MapCompactBottomPanel';
import { MapControlStack } from '@/features/map/components/MapControlStack';
import { MapGameplayMarkerLayer } from '@/features/map/components/MapGameplayMarkerLayer';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import type { MapMotionPresentationResult } from '@/features/map/utils/mapMotionPresentation';
import {
  buildMapBottomPanelPresentation,
  findMapGameplayMarker,
  mapMarkerCoordinateToPoint,
  type MapGameplayPresentation,
} from '@/features/map/utils/mapGameplayPresentation';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import {
  applyTacticalMotionToMarkers,
  buildMapTacticalMotionPresentation,
} from '@/features/map/utils/mapTacticalMotionPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

import { type MapDistrictId } from '../data/mapAssets';
import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';
import type { ActiveLayers, MapFilterId, MapViewMode, PilotAreaId } from '../types/map';
import { getMapDistrictLabel } from '../utils/mapDistrictLabels';
import { CreviaBaseMap, type CreviaBaseMapControls } from './CreviaBaseMap';
import { MapReactionMotionHints } from './MapReactionMotionHints';

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
  reactionMotionCues?: MapDistrictMotionCue[];
  operationScopeMotionDistrictIds?: MapDistrictId[];
  journalMotionCue?: MapJournalMotionCue;
  bubbleMotionCue?: MapBubbleMotionCue;
  reducedMotionMode?: boolean;
  mapPresenceViewModel?: MapPresenceViewModel | null;
  activeOperationOverlay?: MapActiveOperationOverlayModel | null;
  activeOperationCard?: ActiveOperationMapCardModel | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  mapGameplayPresentation?: MapGameplayPresentation | null;
  operationalResources?: OperationalResourcesState;
  mapMotionPresentation?: MapMotionPresentationResult | null;
  mapReactionLiteModel?: MapReactionLiteModel | null;
  recentDecisionRecord?: DecisionRecord | null;
  onLayersPress: () => void;
  onDistrictSelect: (districtId: MapDistrictId) => void;
  onBackToOverview: () => void;
  onPinPress?: (pinId: string) => void;
  embedded?: boolean;
};

const PANEL_BOTTOM_GAP = mapUi.panelBottomGap;

export function CityMapCard({
  viewMode,
  detailDistrictId,
  gameDay,
  journalMotionCue,
  bubbleMotionCue,
  reducedMotionMode = false,
  activeOperationCard = null,
  activeOperationBinding = null,
  mapGameplayPresentation = null,
  operationalResources,
  activeEvents,
  mapMotionPresentation = null,
  mapReactionLiteModel = null,
  recentDecisionRecord = null,
  onLayersPress,
  onDistrictSelect,
  onBackToOverview,
  embedded = false,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const mapControlsRef = useRef<CreviaBaseMapControls>(null);
  const isDetail = viewMode === 'detail';
  const detailLabel = getMapDistrictLabel(detailDistrictId);
  const detailCharacterLine = getNeighborhoodMapCharacterLine(detailDistrictId);
  const headerTop = Math.max(8, insets.top + 2);
  const bottomPanelOffset = tabBarHeight + Math.max(insets.bottom, 8) + PANEL_BOTTOM_GAP;

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
    mapGameplayPresentation?.defaultSelectedMarkerId ?? null,
  );
  const [isPanelExpanded, setPanelExpanded] = useState(false);

  useEffect(() => {
    setSelectedMarkerId(mapGameplayPresentation?.defaultSelectedMarkerId ?? null);
  }, [mapGameplayPresentation?.defaultSelectedMarkerId]);

  const selectedMarker = useMemo(
    () =>
      findMapGameplayMarker(
        mapGameplayPresentation?.markers ?? [],
        selectedMarkerId,
        mapGameplayPresentation?.defaultSelectedMarkerId ?? null,
      ),
    [
      mapGameplayPresentation?.defaultSelectedMarkerId,
      mapGameplayPresentation?.markers,
      selectedMarkerId,
    ],
  );

  const navigableMarkers = useMemo(
    () => mapGameplayPresentation?.markers ?? [],
    [mapGameplayPresentation?.markers],
  );

  const selectedMarkerIndex = useMemo(() => {
    if (!selectedMarkerId || navigableMarkers.length === 0) return 0;
    const index = navigableMarkers.findIndex((marker) => marker.id === selectedMarkerId);
    return index >= 0 ? index : 0;
  }, [navigableMarkers, selectedMarkerId]);

  const tacticalMotion = useMemo(
    () =>
      buildMapTacticalMotionPresentation({
        day: gameDay,
        reducedMotion: reducedMotionMode,
        markers: mapGameplayPresentation?.markers ?? [],
        layers: mapGameplayPresentation?.layers,
        selectedMarkerId: selectedMarker?.id ?? null,
        activeOperationBinding: activeOperationBinding ?? null,
        mapReactionLiteModel,
        recentDecisionRecord,
      }),
    [
      activeOperationBinding,
      gameDay,
      mapGameplayPresentation?.layers,
      mapGameplayPresentation?.markers,
      mapReactionLiteModel,
      recentDecisionRecord,
      reducedMotionMode,
      selectedMarker?.id,
    ],
  );

  const displayMarkers = useMemo(
    () => applyTacticalMotionToMarkers(mapGameplayPresentation?.markers ?? [], tacticalMotion),
    [mapGameplayPresentation?.markers, tacticalMotion],
  );

  const bottomPanel = useMemo(() => {
    if (!selectedMarker) return null;
    const panel = buildMapBottomPanelPresentation(selectedMarker, {
      activeOperationCard,
      activeOperationBinding: activeOperationBinding ?? null,
      activeEventCount: activeEvents.length,
      operationalResources:
        operationalResources ?? createInitialOperationalResourcesState(1),
      activeEvents,
      recentDecisionRecord,
      gameDay,
      navIndex: selectedMarkerIndex,
      navTotal: navigableMarkers.length,
    });
    return {
      ...panel,
      tacticalMicroLine: tacticalMotion.tacticalMicroLine,
      layerHintLine: tacticalMotion.layerHints[0]?.label,
    };
  }, [
    activeEvents,
    activeOperationBinding,
    activeOperationCard,
    gameDay,
    navigableMarkers.length,
    operationalResources,
    recentDecisionRecord,
    selectedMarker,
    selectedMarkerIndex,
    tacticalMotion.layerHints,
    tacticalMotion.tacticalMicroLine,
  ]);

  const focusMarker = useCallback((markerId: string) => {
    const marker = navigableMarkers.find((item) => item.id === markerId);
    if (!marker) return;
    setSelectedMarkerId(markerId);
    setPanelExpanded(false);
    mapControlsRef.current?.focusOnPoint(
      mapMarkerCoordinateToPoint(marker.coordinate),
      2,
    );
  }, [navigableMarkers]);

  const handlePreviousMarker = useCallback(() => {
    if (navigableMarkers.length <= 1) return;
    const nextIndex =
      (selectedMarkerIndex - 1 + navigableMarkers.length) % navigableMarkers.length;
    focusMarker(navigableMarkers[nextIndex]!.id);
  }, [focusMarker, navigableMarkers, selectedMarkerIndex]);

  const handleNextMarker = useCallback(() => {
    if (navigableMarkers.length <= 1) return;
    const nextIndex = (selectedMarkerIndex + 1) % navigableMarkers.length;
    focusMarker(navigableMarkers[nextIndex]!.id);
  }, [focusMarker, navigableMarkers, selectedMarkerIndex]);

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      focusMarker(markerId);
    },
    [focusMarker],
  );

  const handlePrimaryAction = useCallback(() => {
    if (!selectedMarker) return;
    const route =
      selectedMarker.eventDetailRoute ??
      activeOperationBinding?.eventDetailRoute ??
      activeOperationCard?.ctaRoute;
    if (route) {
      router.push(route as never);
      return;
    }
    mapControlsRef.current?.focusOnPoint(
      mapMarkerCoordinateToPoint(selectedMarker.coordinate),
      2,
    );
  }, [activeOperationBinding?.eventDetailRoute, activeOperationCard?.ctaRoute, router, selectedMarker]);

  const handleDistrictPress = useCallback(
    (districtId: MapDistrictId) => {
      onDistrictSelect(districtId);
    },
    [onDistrictSelect],
  );

  const presentation = mapGameplayPresentation;

  return (
    <View style={[styles.card, embedded && styles.cardEmbedded]}>
      <View style={[styles.header, { top: headerTop }]} pointerEvents="box-none">
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {presentation?.title ?? 'Şehir Haritası'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {presentation?.subtitle ?? 'Canlı taktik görünüm'}
          </Text>
        </View>
        <Pressable
          style={styles.headerCircle}
          onPress={onLayersPress}
          accessibilityLabel="Harita katmanları">
          <Ionicons name="layers-outline" size={18} color={mapUi.gold} />
        </Pressable>
      </View>

      <View style={styles.mapArea}>
        <CreviaBaseMap
          ref={mapControlsRef}
          mode="fullscreen"
          contentFit="cover"
          districtMotionMarkers={mapMotionPresentation?.markers}
          reducedMotionMode={reducedMotionMode}
          onDistrictPress={handleDistrictPress}
        />

        {!isDetail && presentation ? (
          <MapGameplayMarkerLayer
            markers={displayMarkers}
            selectedMarkerId={selectedMarker?.id ?? null}
            reducedMotionMode={reducedMotionMode}
            tacticalMotion={tacticalMotion}
            onMarkerPress={handleMarkerPress}
          />
        ) : null}

        {!isDetail ? (
          <MapReactionMotionHints
            journalCue={journalMotionCue}
            bubbleCue={bubbleMotionCue}
            reducedMotionMode={reducedMotionMode}
            bottomOffset={bottomPanelOffset + (isPanelExpanded ? 136 : 104)}
          />
        ) : null}

        {isDetail ? (
          <Pressable
            onPress={onBackToOverview}
            style={[styles.detailBackChip, { top: headerTop + 56 }]}
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
        ) : null}

        <MapControlStack
          onZoomIn={() => mapControlsRef.current?.zoomIn()}
          onZoomOut={() => mapControlsRef.current?.zoomOut()}
          onLocate={() => mapControlsRef.current?.reset()}
          onLayersPress={onLayersPress}
        />

        {!isDetail && bottomPanel ? (
          <MapCompactBottomPanel
            panel={bottomPanel}
            expanded={isPanelExpanded}
            bottomOffset={bottomPanelOffset}
            reducedMotion={reducedMotionMode}
            onToggleExpand={() => setPanelExpanded((value) => !value)}
            onPrimaryPress={handlePrimaryAction}
            onSecondaryPress={onLayersPress}
            onPrevious={handlePreviousMarker}
            onNext={handleNextMarker}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: mapUi.screenPadding,
    borderRadius: mapUi.mapCardRadius,
    backgroundColor: mapUi.canvas,
    overflow: 'hidden',
  },
  cardEmbedded: {
    marginHorizontal: 0,
  },
  header: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 22, 20, 0.72)',
    borderWidth: 1,
    borderColor: mapUi.border,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: mapUi.textLight,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: mapUi.textMuted,
  },
  headerCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: mapUi.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
    ...mapUi.controlShadow,
  },
  mapArea: {
    flex: 1,
    minHeight: 640,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: mapUi.mapBackdrop,
  },
  detailBackChip: {
    position: 'absolute',
    left: 14,
    right: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: mapUi.glass,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 18,
    borderWidth: 1,
    borderColor: mapUi.border,
  },
  detailBackCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  detailBackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: mapUi.textLight,
  },
  detailBackSub: {
    fontSize: 11,
    fontWeight: '600',
    color: mapUi.textMuted,
  },
});
