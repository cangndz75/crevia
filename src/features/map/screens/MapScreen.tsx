import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
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

import { ActiveOperationCard } from '../components/ActiveOperationCard';
import { CityMapCard } from '../components/CityMapCard';
import { ContainerPanel } from '../components/ContainerPanel';
import { CrewTrackingPanel } from '../components/CrewTrackingPanel';
import { GameDayBanner } from '../components/GameDayBanner';
import { LayerPanel } from '../components/LayerPanel';
import { MapFilterTabs } from '../components/MapFilterTabs';
import { MapGuideModal } from '../components/MapGuideModal';
import { MapPageHeader } from '../components/MapPageHeader';
import { MapSummaryCards } from '../components/MapSummaryCards';
import { PilotAreaSummaryPanel } from '../components/PilotAreaSummaryPanel';
import { RiskPanel } from '../components/RiskPanel';
import { VehiclePanel } from '../components/VehiclePanel';
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
  getDefaultLayers,
  getPilotPreset,
  getRiskDensityLabel,
  getRiskSummary,
  getTasks,
  getVehicles,
} from '../data/mapSelectors';
import { DEFAULT_MAP_DISTRICT_ID, type MapDistrictId } from '../data/mapAssets';
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

  const [selectedFilter, setSelectedFilter] = useState<MapFilterId>('events');
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>(() =>
    getDefaultLayers(pilotAreaId),
  );
  const [isLayerPanelOpen, setLayerPanelOpen] = useState(false);
  const [isGuideOpen, setGuideOpen] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('overview');
  const [detailDistrictId, setDetailDistrictId] =
    useState<MapDistrictId>(DEFAULT_MAP_DISTRICT_ID);

  const handleDistrictSelect = useCallback((districtId: MapDistrictId) => {
    setDetailDistrictId(districtId);
    setMapViewMode('detail');
  }, []);

  const handleBackToOverview = useCallback(() => {
    setMapViewMode('overview');
  }, []);

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
    () =>
      containerState
        ? buildContainerMapPins({ containerState })
        : [],
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
                  label: 'Aktif Olaylar',
                  sublabel: `${preset.shortName} pilot bölgede`,
                },
                {
                  icon: 'speedometer',
                  iconColor: colors.warning,
                  value: `%${preset.riskDensity}`,
                  label: 'Risk Yoğunluğu',
                  sublabel: getRiskDensityLabel(preset.riskDensity),
                },
                {
                  icon: 'people',
                  iconColor: colors.purple,
                  value: preset.activeCrewCount,
                  label: 'Ekip Sahada',
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
    <GameScreenShell screenTitle="Harita" backgroundColor={colors.background}>
      <MapPageHeader
        selectedFilter={selectedFilter}
        pilotAreaId={pilotAreaId}
        onGuidePress={() => setGuideOpen(true)}
      />

      <GameDayBanner gameDay={gameDay} pilotAreaId={pilotAreaId} />

      <MapFilterTabs selected={selectedFilter} onSelect={setSelectedFilter} />

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
        onLayersPress={() => setLayerPanelOpen(true)}
        onDistrictSelect={handleDistrictSelect}
        onBackToOverview={handleBackToOverview}
        onPinPress={(pinId) => {
          const linked = activeEvents.find((e) => e.id === pinId);
          if (linked) {
            // İleride: router.push(`/events/${pinId}`)
          }
        }}
      />

      <Animated.View key={`${selectedFilter}-${pilotAreaId}-${gameDay}`} entering={FadeIn.duration(220)}>
        <View style={{ gap: 16, marginTop: 4 }}>{renderFilterContent()}</View>
      </Animated.View>

      {(gameDay >= 7 || selectedFilter === 'events') && (
        <PilotAreaSummaryPanel pilotAreaId={pilotAreaId} gameDay={gameDay} />
      )}

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
