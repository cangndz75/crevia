import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { buildPostPilotMapContextLineForGameState } from '@/core/postPilot/postPilotOperationUxPresentation';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { useGameStatus } from '@/store/gameSelectors';
import {
  selectActiveEvents,
  selectContainerState,
  selectCurrentPilotDay,
  selectSelectedPilotDistrictId,
  selectVehicleStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

import { LayerPanel } from '../components/LayerPanel';
import { MapFilterChips } from '../components/MapFilterChips';
import { MapGuideModal } from '../components/MapGuideModal';
import { MapHeroPanel } from '../components/MapHeroPanel';
import { MapOperationSignalCard } from '../components/MapOperationSignalCard';
import { MapPilotDistrictStatusCard } from '../components/MapPilotDistrictStatusCard';
import { MapScreenHeader } from '../components/MapScreenHeader';
import { MapScreenTitleRow } from '../components/MapScreenTitleRow';
import { DEFAULT_MAP_DISTRICT_ID, type MapDistrictId } from '../data/mapAssets';
import { mapDistrictFromPilot } from '../data/mapDistrictMapping';
import { pilotAreaFromDistrict } from '../data/pilotAreaMapping';
import {
  getActiveOperation,
  getCrews,
  getDayEvent,
  getDefaultLayers,
} from '../data/mapSelectors';
import {
  buildMapFilterChipModel,
  buildMapActiveOperationOverlayModel,
  buildMapOperationPanelModel,
} from '../utils/mapUiPresentation';
import {
  buildMapFilterChipItems,
  buildMapOperationSignalModel,
  buildMapPilotDistrictStatusModel,
  buildMapScreenHeaderModel,
} from '../presentation/mapScreenPresentation';
import type {
  ActiveLayers,
  LayerId,
  MapFilterId,
  MapViewMode,
  PilotAreaId,
} from '../types/map';

export function MapScreen() {
  const selectedDistrictId: PilotDistrictId =
    useGameStore(selectSelectedPilotDistrictId) ?? DEFAULT_PILOT_DISTRICT_ID;
  const gameDay = useGameStore(selectCurrentPilotDay) ?? 1;
  const activeEvents = useGameStore(selectActiveEvents);
  const containerState = useGameStore(selectContainerState);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const hideMapFleetSignals = useGameStore(selectIsDay1TutorialActive);
  const gameStatus = useGameStatus();

  const pilotAreaId: PilotAreaId = pilotAreaFromDistrict(selectedDistrictId);
  const dayEvent = useMemo(
    () => getDayEvent(pilotAreaId, gameDay),
    [pilotAreaId, gameDay],
  );

  const [selectedFilter, setSelectedFilter] = useState<MapFilterId>('events');
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>(() =>
    getDefaultLayers(pilotAreaId),
  );
  const [isLayerPanelOpen, setLayerPanelOpen] = useState(false);
  const [isGuideOpen, setGuideOpen] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('overview');
  const [detailDistrictId, setDetailDistrictId] =
    useState<MapDistrictId>(DEFAULT_MAP_DISTRICT_ID);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const pilotMapDistrict = mapDistrictFromPilot(selectedDistrictId);
  const focusDistrictId =
    mapViewMode === 'detail' ? detailDistrictId : pilotMapDistrict;

  const handleDistrictSelect = useCallback((districtId: MapDistrictId) => {
    setDetailDistrictId(districtId);
    setMapViewMode('detail');
    setSelectedPinId(null);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setMapViewMode('overview');
    setSelectedPinId(null);
  }, []);

  const handleFocusDistrict = useCallback(() => {
    if (mapViewMode === 'detail') {
      handleBackToOverview();
      return;
    }
    handleDistrictSelect(focusDistrictId);
  }, [focusDistrictId, handleBackToOverview, handleDistrictSelect, mapViewMode]);

  useEffect(() => {
    setActiveLayers(getDefaultLayers(pilotAreaId));
  }, [pilotAreaId]);

  const crews = useMemo(() => getCrews(pilotAreaId), [pilotAreaId]);
  const activeOperation = useMemo(
    () => getActiveOperation(pilotAreaId, gameDay),
    [pilotAreaId, gameDay],
  );

  const filterChips = useMemo(
    () => buildMapFilterChipModel({ gameDay, pilotAreaId }),
    [gameDay, pilotAreaId],
  );

  const headerModel = useMemo(
    () => buildMapScreenHeaderModel(gameStatus, gameDay),
    [gameStatus, gameDay],
  );

  const chipItems = useMemo(
    () =>
      buildMapFilterChipItems({
        gameDay,
        districtLabel: filterChips.districtLabel,
        selectedFilter,
      }),
    [filterChips.districtLabel, gameDay, selectedFilter],
  );

  const activeOperationOverlay = useMemo(
    () =>
      mapViewMode === 'overview'
        ? buildMapActiveOperationOverlayModel({
            pilotAreaId,
            gameDay,
            activeEvents,
          })
        : null,
    [activeEvents, gameDay, mapViewMode, pilotAreaId],
  );

  const gameStateForMap = useGameStore((s) => s.gameState);

  const postPilotMapContextLine = useMemo(() => {
    const districtEvents = activeEvents.filter((event) => {
      const neighborhoodId = event.neighborhoodId?.toLowerCase() ?? '';
      return (
        neighborhoodId.includes(focusDistrictId) ||
        event.district?.toLowerCase().includes(focusDistrictId)
      );
    });
    if (districtEvents.length === 0) {
      return undefined;
    }
    return buildPostPilotMapContextLineForGameState(gameStateForMap, districtEvents);
  }, [activeEvents, focusDistrictId, gameStateForMap]);

  const operationPanel = useMemo(
    () =>
      buildMapOperationPanelModel({
        viewMode: mapViewMode,
        focusDistrictId,
        pilotAreaId,
        pilotDistrictId: selectedDistrictId,
        gameDay,
        activeEvents,
        containerState,
        vehicleState,
        hideFleetSignals: hideMapFleetSignals,
        dayEventTitle: dayEvent.mainEventTitle,
        postPilotMapContextLine: postPilotMapContextLine ?? undefined,
      }),
    [
      activeEvents,
      containerState,
      dayEvent.mainEventTitle,
      focusDistrictId,
      gameDay,
      hideMapFleetSignals,
      mapViewMode,
      pilotAreaId,
      postPilotMapContextLine,
      selectedDistrictId,
      vehicleState,
    ],
  );

  const operationSignalModel = useMemo(
    () =>
      buildMapOperationSignalModel({
        operation: activeOperation,
        pilotAreaId,
        gameDay,
        crewNames: crews.map((crew) => crew.name),
      }),
    [activeOperation, crews, gameDay, pilotAreaId],
  );

  const pilotStatusModel = useMemo(
    () =>
      buildMapPilotDistrictStatusModel({
        pilotAreaId,
        gameDay,
        riskMetrics: operationPanel.riskMetrics,
      }),
    [gameDay, operationPanel.riskMetrics, pilotAreaId],
  );

  const handleToggleLayer = useCallback((id: LayerId) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleFilterChipSelect = useCallback((filterId: MapFilterId) => {
    setSelectedFilter((current) => (current === filterId ? 'events' : filterId));
  }, []);

  return (
    <GameScreenShell
      headerVariant="none"
      backgroundColor={colors.hubCream}
      contentStyle={styles.content}>
      <View style={styles.stack}>
        <MapScreenHeader model={headerModel} />

        <MapScreenTitleRow onInfoPress={() => setGuideOpen(true)} />

        <MapFilterChips chips={chipItems} onSelectFilter={handleFilterChipSelect} />

        <MapHeroPanel
          viewMode={mapViewMode}
          detailDistrictId={detailDistrictId}
          pilotAreaId={pilotAreaId}
          selectedDistrictId={selectedDistrictId}
          selectedFilter={selectedFilter}
          gameDay={gameDay}
          activeLayers={activeLayers}
          activeEvents={activeEvents}
          containerState={containerState}
          vehicleState={vehicleState}
          hideContainerSignals={hideMapFleetSignals}
          hideVehicleSignals={hideMapFleetSignals}
          selectedPinId={selectedPinId}
          activeOperationOverlay={activeOperationOverlay}
          onLayersPress={() => setLayerPanelOpen(true)}
          onDistrictSelect={handleDistrictSelect}
          onBackToOverview={handleBackToOverview}
          onPinPress={(pinId) => {
            setSelectedPinId((current) => (current === pinId ? null : pinId));
          }}
        />

        <Animated.View entering={FadeIn.duration(220)} style={styles.lowerCards}>
          <MapOperationSignalCard
            model={operationSignalModel}
            onActionPress={handleFocusDistrict}
            onTrack={handleFocusDistrict}
          />

          <MapPilotDistrictStatusCard
            model={pilotStatusModel}
            onSuggestionPress={handleFocusDistrict}
            onMiniMapPress={handleFocusDistrict}
          />
        </Animated.View>
      </View>

      <LayerPanel
        visible={isLayerPanelOpen}
        layers={activeLayers}
        onToggle={handleToggleLayer}
        onClose={() => setLayerPanelOpen(false)}
      />

      <MapGuideModal visible={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stack: {
    gap: 12,
    minWidth: 0,
  },
  lowerCards: {
    gap: 12,
    minWidth: 0,
  },
});
