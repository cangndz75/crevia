import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { isPostPilotLightEventLoopEligible } from '@/core/postPilot';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
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

import { ActiveOperationCard } from '../components/ActiveOperationCard';
import { CityMapCard } from '../components/CityMapCard';
import { ContainerPanel } from '../components/ContainerPanel';
import { CrewTrackingPanel } from '../components/CrewTrackingPanel';
import { LayerPanel } from '../components/LayerPanel';
import { MapFilterTabs } from '../components/MapFilterTabs';
import { MapGuideModal } from '../components/MapGuideModal';
import { MapNeighborhoodStrip } from '../components/MapNeighborhoodStrip';
import { MapOperationBottomPanel } from '../components/MapOperationBottomPanel';
import { MapOperationHeader } from '../components/MapOperationHeader';
import { MapSummaryCards } from '../components/MapSummaryCards';
import { PilotAreaSummaryPanel } from '../components/PilotAreaSummaryPanel';
import { RiskPanel } from '../components/RiskPanel';
import { VehiclePanel } from '../components/VehiclePanel';
import { DEFAULT_MAP_DISTRICT_ID, type MapDistrictId } from '../data/mapAssets';
import { mapDistrictFromPilot } from '../data/mapDistrictMapping';
import { pilotAreaFromDistrict } from '../data/pilotAreaMapping';
import {
  buildContainerMapPins,
  buildContainerPanelItems,
  buildContainerSummaryFromPins,
} from '../utils/containerMapAdapter';
import {
  getActiveOperation,
  getContainerSummary,
  getContainers,
  getCrews,
  getDayEvent,
  getDefaultLayers,
  getPilotPreset,
  getRiskDensityLabel,
  getRiskSummary,
  getTasks,
  getVehicles,
} from '../data/mapSelectors';
import {
  buildMapNeighborhoodStripItems,
  buildMapOperationPanelModel,
} from '../utils/mapUiPresentation';
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

  const pilotAreaId: PilotAreaId = pilotAreaFromDistrict(selectedDistrictId);
  const preset = useMemo(() => getPilotPreset(pilotAreaId), [pilotAreaId]);
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

  const handleBottomPanelCta = useCallback(() => {
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
  const tasks = useMemo(() => getTasks(pilotAreaId), [pilotAreaId]);
  const vehicles = useMemo(() => getVehicles(pilotAreaId), [pilotAreaId]);
  const containers = useMemo(() => getContainers(pilotAreaId), [pilotAreaId]);
  const containerSummary = useMemo(
    () => getContainerSummary(pilotAreaId),
    [pilotAreaId],
  );

  const liveContainerPins = useMemo(
    () => (containerState ? buildContainerMapPins({ containerState }) : []),
    [containerState],
  );

  const liveContainerPanelItems = useMemo(
    () => buildContainerPanelItems(liveContainerPins),
    [liveContainerPins],
  );

  const liveContainerSummary = useMemo(
    () =>
      liveContainerPins.length > 0
        ? buildContainerSummaryFromPins(liveContainerPins)
        : null,
    [liveContainerPins],
  );

  const riskSummary = useMemo(() => getRiskSummary(pilotAreaId), [pilotAreaId]);
  const activeOperation = useMemo(
    () => getActiveOperation(pilotAreaId, gameDay),
    [pilotAreaId, gameDay],
  );

  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const postPilotOperation = useGameStore((s) => s.gameState.pilot.postPilotOperation);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);

  const neighborhoodStripItems = useMemo(
    () =>
      buildMapNeighborhoodStripItems({
        pilotDistrictId: selectedDistrictId,
        focusDistrictId,
        gameDay,
        postPilot: {
          pilotStatus,
          postPilotOperation,
          authorityState,
        },
      }),
    [
      authorityState,
      focusDistrictId,
      gameDay,
      pilotStatus,
      postPilotOperation,
      selectedDistrictId,
    ],
  );

  const postPilotFieldSignal = useMemo(() => {
    const gameState = useGameStore.getState().gameState;
    if (!isPostPilotLightEventLoopEligible(gameState)) {
      return undefined;
    }
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
    return 'Gündem olayı · Aktif saha sinyali';
  }, [activeEvents, focusDistrictId]);

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
        postPilotFieldSignal,
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
      postPilotFieldSignal,
      selectedDistrictId,
      vehicleState,
    ],
  );

  const handleToggleLayer = useCallback((id: LayerId) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderFilterContent = () => {
    switch (selectedFilter) {
      case 'events':
        return (
          <>
            <MapSummaryCards
              cards={[
                {
                  icon: 'alert-circle',
                  iconColor: colors.danger,
                  value: preset.activeEventCount,
                  label: 'Operasyon sinyali',
                  sublabel: `${preset.shortName} pilot bölgede`,
                },
                {
                  icon: 'speedometer',
                  iconColor: colors.warning,
                  value: `%${preset.riskDensity}`,
                  label: 'Risk yoğunluğu',
                  sublabel: getRiskDensityLabel(preset.riskDensity),
                },
                {
                  icon: 'people',
                  iconColor: colors.purple,
                  value: preset.activeCrewCount,
                  label: 'Ekip sahad',
                  sublabel: 'Pilot bölgen',
                },
              ]}
            />
            <ActiveOperationCard operation={activeOperation} />
          </>
        );
      case 'risk':
        return <RiskPanel riskSummary={riskSummary} />;
      case 'crews':
        return (
          <CrewTrackingPanel
            crews={crews}
            tasks={tasks}
            routeInfo={preset.routeInfo}
          />
        );
      case 'vehicles':
        return (
          <VehiclePanel
            vehicles={vehicles}
            vehiclePlanningUnlocked={pilotAreaId === 'sanayiPazar' && gameDay >= 3}
          />
        );
      case 'containers':
        return (
          <ContainerPanel
            summary={liveContainerSummary ?? containerSummary}
            containers={containers}
            liveItems={
              liveContainerPanelItems.length > 0
                ? liveContainerPanelItems
                : undefined
            }
            emphasizeRouteCta={pilotAreaId === 'sanayiPazar'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GameScreenShell
      screenTitle="Operasyon Haritası"
      backgroundColor={colors.background}>
      <View style={styles.stack}>
        <MapOperationHeader
          gameDay={gameDay}
          pilotAreaId={pilotAreaId}
          onGuidePress={() => setGuideOpen(true)}
        />

        <CityMapCard
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
          onLayersPress={() => setLayerPanelOpen(true)}
          onDistrictSelect={handleDistrictSelect}
          onBackToOverview={handleBackToOverview}
          onPinPress={(pinId) => {
            setSelectedPinId((current) => (current === pinId ? null : pinId));
            const linked = activeEvents.find((event) => event.id === pinId);
            if (linked) {
              // İleride: router.push(`/events/${pinId}`)
            }
          }}
        />

        <MapNeighborhoodStrip
          items={neighborhoodStripItems}
          selectedId={focusDistrictId}
          onSelect={handleDistrictSelect}
        />

        <MapOperationBottomPanel
          model={operationPanel}
          onPressCta={handleBottomPanelCta}
        />

        <MapFilterTabs selected={selectedFilter} onSelect={setSelectedFilter} />

        <Animated.View
          key={`${selectedFilter}-${pilotAreaId}-${gameDay}`}
          entering={FadeIn.duration(220)}
          style={styles.filterContent}>
          {renderFilterContent()}
        </Animated.View>

        {(gameDay >= 7 || selectedFilter === 'events') && (
          <PilotAreaSummaryPanel pilotAreaId={pilotAreaId} gameDay={gameDay} />
        )}
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
  stack: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterContent: {
    gap: spacing.sm,
    marginTop: 2,
  },
});
