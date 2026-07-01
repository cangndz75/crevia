import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import {
  buildActiveOperationCardActionBundle,
  buildHeroMapActionBundle,
  buildMarkerMapActionBundle,
  type MapDirectActionPresentation,
} from '@/core/mapDirectAction';
import type { MapBubbleMotionCue, MapDistrictMotionCue, MapJournalMotionCue } from '@/core/mapReactionsMotion/mapReactionMotionTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import { getNeighborhoodMapCharacterLine } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { MapActiveOperationActionCard } from '@/features/map/components/MapActiveOperationActionCard';
import type { DistrictMapVisualStateMap } from '@/core/map/mapDistrictVisualState';
import { pickDistrictMapVisualState } from '@/core/map/mapDistrictVisualState';
import { MapDistrictVisualStateStrip } from '@/features/map/components/MapDistrictVisualStateStrip';
import { MapCompactBottomPanel } from '@/features/map/components/MapCompactBottomPanel';
import { MapControlStack } from '@/features/map/components/MapControlStack';
import { MapDirectActionRow } from '@/features/map/components/MapDirectActionRow';
import { MapGameplayMarkerLayer } from '@/features/map/components/MapGameplayMarkerLayer';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import type { MapMotionPresentationResult } from '@/features/map/utils/mapMotionPresentation';
import { handleMapDirectAction } from '@/features/map/utils/mapDirectActionHandler';
import { buildMarkerActionBundleInput } from '@/features/map/utils/mapDirectActionContext';
import {
  buildMapBottomPanelPresentation,
  findMapGameplayMarker,
  mapMarkerCoordinateToPoint,
  type MapGameplayPresentation,
} from '@/features/map/utils/mapGameplayPresentation';
import {
  buildDistrictTraitLabelMap,
  resolveCreviaDistrictIdFromMarker,
} from '@/features/map/utils/mapMarkerFeedbackPresentation';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import {
  applyTacticalMotionToMarkers,
  buildMapTacticalMotionPresentation,
} from '@/features/map/utils/mapTacticalMotionPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
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
  embedded?: boolean;
};

const PANEL_BOTTOM_GAP = mapUi.panelBottomGap;

export function CityMapCard({
  viewMode,
  detailDistrictId,
  gameDay,
  journalMotionCue,
  bubbleMotionCue,
  reactionHighlightDistrictIds,
  reactionMotionCues,
  operationScopeMotionDistrictIds,
  reducedMotionMode = false,
  activeOperationCard = null,
  activeOperationBinding = null,
  mapGameplayPresentation = null,
  operationalResources,
  activeEvents,
  mapMotionPresentation = null,
  districtVisualStateMap = null,
  mapReactionLiteModel = null,
  recentDecisionRecord = null,
  maintenanceBacklogRuntime = null,
  periodGoalShortTitle,
  districtPersonalitySignalLine,
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

  const activeOperationActionBundle = useMemo(() => {
    if (!activeOperationCard || !activeOperationBinding) return null;
    const marker =
      selectedMarker ??
      findMapGameplayMarker(
        mapGameplayPresentation?.markers ?? [],
        mapGameplayPresentation?.defaultSelectedMarkerId ?? null,
        null,
      );
    if (!marker) return null;
    return buildActiveOperationCardActionBundle(
      buildMarkerActionBundleInput({
        marker,
        binding: activeOperationBinding,
        card: activeOperationCard,
        maintenanceRuntime: maintenanceBacklogRuntime,
        personalitySignalLine: districtPersonalitySignalLine,
        periodGoalShortTitle,
        layerToggleAvailable: true,
      }),
    );
  }, [
    activeOperationBinding,
    activeOperationCard,
    districtPersonalitySignalLine,
    maintenanceBacklogRuntime,
    mapGameplayPresentation?.defaultSelectedMarkerId,
    mapGameplayPresentation?.markers,
    periodGoalShortTitle,
    selectedMarker,
  ]);

  const heroActionBundle = useMemo(() => {
    if (!activeOperationCard || !activeOperationBinding) return null;
    const marker =
      selectedMarker ??
      findMapGameplayMarker(
        mapGameplayPresentation?.markers ?? [],
        mapGameplayPresentation?.defaultSelectedMarkerId ?? null,
        null,
      );
    if (!marker) return null;
    const excludeKeys = activeOperationActionBundle?.primaryAction?.dedupeKey
      ? [activeOperationActionBundle.primaryAction.dedupeKey]
      : undefined;
    return buildHeroMapActionBundle({
      ...buildMarkerActionBundleInput({
        marker,
        binding: activeOperationBinding,
        card: activeOperationCard,
        maintenanceRuntime: maintenanceBacklogRuntime,
        personalitySignalLine: districtPersonalitySignalLine,
        periodGoalShortTitle,
        layerToggleAvailable: true,
        excludeDedupeKeys: excludeKeys,
      }),
    });
  }, [
    activeOperationActionBundle?.primaryAction?.dedupeKey,
    activeOperationBinding,
    activeOperationCard,
    districtPersonalitySignalLine,
    maintenanceBacklogRuntime,
    mapGameplayPresentation?.defaultSelectedMarkerId,
    mapGameplayPresentation?.markers,
    periodGoalShortTitle,
    selectedMarker,
  ]);

  const mapActionCallbacks = useMemo(
    () => ({
      onOpenDistrictDetail: (districtId: string) => {
        onDistrictSelect(districtId as MapDistrictId);
      },
      onToggleLayers: onLayersPress,
    }),
    [onDistrictSelect, onLayersPress],
  );

  const handleDirectAction = useCallback(
    (action: MapDirectActionPresentation) => {
      const handled = handleMapDirectAction(action, router, mapActionCallbacks);
      if (!handled && selectedMarker) {
        mapControlsRef.current?.focusOnPoint(
          mapMarkerCoordinateToPoint(selectedMarker.coordinate),
          2,
        );
      }
    },
    [mapActionCallbacks, router, selectedMarker],
  );

  const selectedDistrictOnMap = useMemo(
    () => resolveCreviaDistrictIdFromMarker(selectedMarker),
    [selectedMarker],
  );

  const selectedDistrictVisualState = useMemo(
    () =>
      selectedDistrictOnMap
        ? pickDistrictMapVisualState(districtVisualStateMap, selectedDistrictOnMap)
        : null,
    [districtVisualStateMap, selectedDistrictOnMap],
  );

  const bottomPanel = useMemo(() => {
    if (!selectedMarker) return null;
    const panel = buildMapBottomPanelPresentation(selectedMarker, {
      activeOperationCard,
      activeOperationBinding: activeOperationBinding ?? null,
      activeEventCount: activeEvents?.length ?? 0,
      operationalResources:
        operationalResources ?? createInitialOperationalResourcesState(1),
      activeEvents,
      recentDecisionRecord,
      gameDay,
      navIndex: selectedMarkerIndex,
      navTotal: navigableMarkers.length,
    });
    const excludeKeys = [
      ...(activeOperationActionBundle?.primaryAction?.dedupeKey
        ? [activeOperationActionBundle.primaryAction.dedupeKey]
        : []),
      ...(heroActionBundle?.primaryAction?.dedupeKey
        ? [heroActionBundle.primaryAction.dedupeKey]
        : []),
    ];
    const actionBundle = buildMarkerMapActionBundle(
      buildMarkerActionBundleInput({
        marker: selectedMarker,
        binding: activeOperationBinding ?? null,
        card: activeOperationCard,
        maintenanceRuntime: maintenanceBacklogRuntime,
        personalitySignalLine: districtPersonalitySignalLine,
        periodGoalShortTitle,
        layerToggleAvailable: true,
        excludeDedupeKeys: excludeKeys.length > 0 ? excludeKeys : undefined,
      }),
    );
    const primaryActionLabel =
      actionBundle.primaryAction?.label ?? panel.primaryActionLabel;
    const districtRecoveryLine = selectedDistrictVisualState?.shortLine;
    return {
      ...panel,
      tacticalMicroLine:
        districtRecoveryLine ??
        tacticalMotion.tacticalMicroLine,
      layerHintLine: selectedDistrictVisualState?.chipLabel ?? tacticalMotion.layerHints[0]?.label,
      primaryActionLabel,
      primaryRoute:
        actionBundle.primaryAction?.targetRouteKey?.startsWith('/')
          ? actionBundle.primaryAction.targetRouteKey
          : panel.primaryRoute,
      actionBundle,
    };
  }, [
    activeEvents,
    activeOperationActionBundle?.primaryAction?.dedupeKey,
    activeOperationBinding,
    activeOperationCard,
    districtPersonalitySignalLine,
    gameDay,
    heroActionBundle?.primaryAction?.dedupeKey,
    maintenanceBacklogRuntime,
    navigableMarkers.length,
    operationalResources,
    periodGoalShortTitle,
    recentDecisionRecord,
    selectedMarker,
    selectedMarkerIndex,
    selectedDistrictVisualState,
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

  const highlightDistrictIds = useMemo(() => {
    const ids = new Set<MapDistrictId>([
      ...(reactionHighlightDistrictIds ?? []),
      ...(operationScopeMotionDistrictIds ?? []),
      ...(districtVisualStateMap?.highlightDistrictIds ?? []),
    ]);
    return [...ids];
  }, [
    districtVisualStateMap?.highlightDistrictIds,
    operationScopeMotionDistrictIds,
    reactionHighlightDistrictIds,
  ]);

  const districtTraitLabels = useMemo(
    () => buildDistrictTraitLabelMap(displayMarkers),
    [displayMarkers],
  );

  const activeOpMarkerSelected = useMemo(() => {
    if (!selectedMarker || !activeOperationBinding?.eventId) return false;
    return selectedMarker.eventId === activeOperationBinding.eventId;
  }, [activeOperationBinding?.eventId, selectedMarker]);

  const hideActiveCardPrimaryCta =
    activeOpMarkerSelected && Boolean(bottomPanel?.actionBundle?.primaryAction);

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      focusMarker(markerId);
    },
    [focusMarker],
  );

  const handlePrimaryAction = useCallback(() => {
    if (!selectedMarker) return;
    const primary = bottomPanel?.actionBundle?.primaryAction;
    if (primary) {
      handleDirectAction(primary);
      return;
    }
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
  }, [
    activeOperationBinding?.eventDetailRoute,
    activeOperationCard?.ctaRoute,
    bottomPanel?.actionBundle?.primaryAction,
    handleDirectAction,
    router,
    selectedMarker,
  ]);

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
          <Text style={styles.headerSubtitle} numberOfLines={2}>
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
          districtVisualStateMap={districtVisualStateMap}
          highlightDistrictIds={highlightDistrictIds}
          reducedMotionMode={reducedMotionMode}
          selectedDistrictId={selectedDistrictOnMap}
          districtTraitLabels={districtTraitLabels}
          onDistrictPress={handleDistrictPress}
        />

        {!isDetail ? (
          <MapDistrictVisualStateStrip
            model={districtVisualStateMap}
            topOffset={headerTop + 52}
          />
        ) : null}

        {!isDetail && presentation ? (
          <MapGameplayMarkerLayer
            markers={displayMarkers}
            selectedMarkerId={selectedMarker?.id ?? null}
            reducedMotionMode={reducedMotionMode}
            tacticalMotion={tacticalMotion}
            activeOperationBinding={activeOperationBinding}
            activeOperationCard={activeOperationCard}
            maintenanceBacklogRuntime={maintenanceBacklogRuntime}
            districtPersonalitySignalLine={districtPersonalitySignalLine}
            periodGoalShortTitle={periodGoalShortTitle}
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

        {!isDetail && activeOperationActionBundle && activeOperationCard ? (
          <MapActiveOperationActionCard
            phaseLabel={activeOperationCard.phaseLabel}
            title={activeOperationCard.title}
            bundle={activeOperationActionBundle}
            reducedMotion={reducedMotionMode}
            isMarkerSelectedOnMap={activeOpMarkerSelected}
            hidePrimaryWhenPanelShowsSame={hideActiveCardPrimaryCta}
            onActionPress={handleDirectAction}
          />
        ) : null}

        {!isDetail && !activeOperationActionBundle?.primaryAction && heroActionBundle?.primaryAction ? (
          <View style={[styles.heroActionBar, { top: headerTop + 52 }]}>
            <MapDirectActionRow
              bundle={heroActionBundle}
              compact
              reducedMotion={reducedMotionMode}
              onActionPress={handleDirectAction}
            />
          </View>
        ) : null}

        {!isDetail && bottomPanel ? (
          <MapCompactBottomPanel
            panel={bottomPanel}
            expanded={isPanelExpanded}
            bottomOffset={bottomPanelOffset}
            reducedMotion={reducedMotionMode}
            onToggleExpand={() => setPanelExpanded((value) => !value)}
            onPrimaryPress={handlePrimaryAction}
            onSecondaryPress={onLayersPress}
            onDirectActionPress={handleDirectAction}
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
  heroActionBar: {
    position: 'absolute',
    right: 14,
    left: 14,
    zIndex: 13,
    maxWidth: 360,
    alignSelf: 'flex-end',
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
