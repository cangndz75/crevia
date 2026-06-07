import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  getAnalyticsAccessModeFromGameState,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { breadcrumbMapScreenOpened } from '@/core/crashPerformance/crashBreadcrumbs';
import { startScreenTiming } from '@/core/crashPerformance/performanceLite';
import { getEventAssignment } from '@/core/assignments/assignmentState';
import {
  buildActiveTaskRouteForEvent,
  shouldSuppressMapOperationHintForActiveRoute,
} from '@/core/activeTaskRoutes/activeTaskRouteUiPresentation';
import type { CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import { buildMapDistrictIntelligenceModel } from '@/core/map/mapDistrictIntelligencePresentation';
import {
  buildDistrictReportCardLiteModel,
  buildDistrictReportCardMapPresentation,
} from '@/core/districtReportCard';
import {
  buildOperationalResourcePresenceLiteInputFromEngine,
  buildOperationalResourcePresenceLiteModel,
} from '@/core/operationalResourcePresence';
import {
  buildMapReactionLiteModel,
  buildMapReactionPanelPresentation,
  buildMapReactionHighlightDistrictIds,
  buildMapReactionLiteInputFromMapContext,
} from '@/core/mapReactions';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation';
import { buildMapBeforeAfterSummary, buildMapPresenceViewModel } from '@/core/mapPresence';
import { buildMainOperationMapScopeBadges } from '@/core/mainOperation/mainOperationPresentation';
import {
  buildMainOperationFeelFromStore,
  buildMainOperationFeelMapHint,
} from '@/core/mainOperationFeel';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { buildPostPilotMapContextLineForGameState } from '@/core/postPilot/postPilotOperationUxPresentation';
import { buildReportTomorrowPreview } from '@/core/reports/reportTomorrowPreviewPresentation';
import { MapNeighborhoodStrip } from '@/features/map/components/MapNeighborhoodStrip';
import { MapDistrictReportCard } from '@/features/map/components/MapDistrictReportCard';
import { MapOperationBottomPanel } from '@/features/map/components/MapOperationBottomPanel';
import { buildMapCrisisPresentationBundle } from '@/features/map/utils/mapCrisisPresentation';
import {
  buildMapResourcePresentationBundle,
  buildMapResourceEngineInputFromStore,
  mergeMapPanelCrisisAndResourceLines,
  isMapDistrictId,
} from '@/features/map/utils/mapResourcePresentation';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { useGameStatus } from '@/store/gameSelectors';
import {
  selectActiveEvents,
  selectContainerState,
  selectCurrentPilotDay,
  selectPilotState,
  selectPostPilotOperation,
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
import {
  DEFAULT_MAP_DISTRICT_ID,
  MAP_DISTRICT_IDS,
  type MapDistrictId,
} from '../data/mapAssets';
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
  buildMapNeighborhoodStripItems,
  buildMapOperationPanelModel,
  shouldShowMapCrisisChrome,
} from '../utils/mapUiPresentation';
import {
  buildMapFilterChipItems,
  buildMapOperationSignalModel,
  buildMapPilotDistrictStatusModel,
  buildMapScreenHeaderModel,
} from '../presentation/mapScreenPresentation';
import { applyMapReactionStripOverlay } from '../utils/mapReactionMapIntegration';
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
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const postPilotOperation = useGameStore(selectPostPilotOperation);
  const authorityState = useGameStore(selectPilotState).authorityState;
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const eventPool = useGameStore((s) => s.eventPool);
  const postPilotCatalog =
    postPilotOperation?.postPilotDailyEventSet?.catalog ?? [];
  const pilotCompleted = gameStateForMap.pilot.status === 'completed';
  const showPostPilotMapChrome = shouldShowMapCrisisChrome(gameDay, pilotCompleted);

  const mapCrisisPresentation = useMemo(
    () =>
      buildMapCrisisPresentationBundle({
        gameState: gameStateForMap,
        monetization,
        crisisState,
        mainOperationSeason,
        operationSignals,
      }),
    [
      crisisState,
      gameStateForMap,
      mainOperationSeason,
      monetization,
      operationSignals,
    ],
  );

  const mainOperationScopeBadges = useMemo(
    () =>
      showPostPilotMapChrome
        ? buildMainOperationMapScopeBadges(
            gameStateForMap,
            monetization,
            mainOperationSeason,
          )
        : [],
    [
      gameStateForMap,
      mainOperationSeason,
      monetization,
      showPostPilotMapChrome,
    ],
  );

  const mapResourceInput = useMemo(
    () =>
      buildMapResourceEngineInputFromStore({
        gameState: gameStateForMap,
        monetization,
        operationSignals,
        dailyOperationsPlan,
        assignments,
        microDecisionState,
        crisisActionState,
        operationalResources,
      }),
    [
      assignments,
      crisisActionState,
      dailyOperationsPlan,
      gameStateForMap,
      microDecisionState,
      monetization,
      operationSignals,
      operationalResources,
    ],
  );

  const mapResourcePresentation = useMemo(
    () => buildMapResourcePresentationBundle(mapResourceInput),
    [mapResourceInput],
  );

  useEffect(() => {
    startScreenTiming('MapScreen', { day: gameDay, surface: 'map' });
    breadcrumbMapScreenOpened({
      day: gameDay,
      phase: getAnalyticsAccessModeFromGameState(gameStateForMap, monetization),
    });
    const base = buildCommonAnalyticsBase(gameStateForMap, 'map', monetization);
    trackOncePerRuntime(`map_opened:${gameDay}`, 'map_opened', base);

    if (showPostPilotMapChrome && mapResourcePresentation.visible) {
      trackOncePerRuntime(
        `map_resource_overlay_seen:${gameDay}`,
        'map_resource_overlay_seen',
        base,
        buildResourceAnalyticsPayload(operationalResources),
      );
    }

    if (showPostPilotMapChrome && mapCrisisPresentation.visible) {
      trackOncePerRuntime(
        `map_crisis_overlay_seen:${gameDay}`,
        'map_crisis_overlay_seen',
        base,
        buildCrisisAnalyticsPayload(crisisState, gameStateForMap, monetization),
      );
    }
  }, [
    crisisState,
    gameDay,
    gameStateForMap,
    mapCrisisPresentation.visible,
    mapResourcePresentation.visible,
    monetization,
    operationalResources,
    showPostPilotMapChrome,
  ]);

  const crisisHighlightDistrictIds = useMemo(() => {
    if (!showPostPilotMapChrome || !mapCrisisPresentation.visible) {
      return undefined;
    }
    const allowed = new Set<string>(MAP_DISTRICT_IDS);
    return mapCrisisPresentation.crisisDistrictIds.filter((id): id is MapDistrictId =>
      allowed.has(id),
    );
  }, [mapCrisisPresentation, showPostPilotMapChrome]);

  const resourceHighlightDistrictIds = useMemo(() => {
    if (!showPostPilotMapChrome || !mapResourcePresentation.visible) {
      return undefined;
    }
    const crisisSet = new Set(crisisHighlightDistrictIds ?? []);
    const ids = mapResourcePresentation.highlightedDistrictIds.filter(
      (id): id is MapDistrictId => isMapDistrictId(id) && !crisisSet.has(id),
    );
    return ids.length > 0 ? ids : undefined;
  }, [
    crisisHighlightDistrictIds,
    mapResourcePresentation.highlightedDistrictIds,
    mapResourcePresentation.visible,
    showPostPilotMapChrome,
  ]);

  const primaryMapEvent = activeEvents[0];

  const activeTaskRoutePreview = useMemo((): CreviaActiveTaskRouteUiModel | null => {
    if (!primaryMapEvent) return null;
    const assignment = getEventAssignment(assignments, primaryMapEvent.id);
    const model = buildActiveTaskRouteForEvent({
      day: gameDay,
      activeEvent: primaryMapEvent,
      assignment,
      operationSignals,
      operationalResources,
      crisisState,
      isMapSurface: true,
      isPostPilot: showPostPilotMapChrome,
      rankKey: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
    });
    return model.visible ? model : null;
  }, [
    assignments,
    authorityState,
    crisisState,
    gameDay,
    operationalResources,
    operationSignals,
    primaryMapEvent,
    showPostPilotMapChrome,
  ]);

  const neighborhoodStripItems = useMemo(
    () => {
      const items = buildMapNeighborhoodStripItems({
        pilotDistrictId: selectedDistrictId,
        focusDistrictId,
        gameDay,
        postPilot:
          gameDay >= POST_PILOT_FIRST_OPERATION_DAY
            ? {
                pilotStatus: gameStateForMap.pilot.status,
                postPilotOperation,
                authorityState,
              }
            : undefined,
        mainOperationScopeBadges,
        crisisDistrictBadges: mapCrisisPresentation.districtBadges,
        crisisAccessMode: crisisState.accessMode,
        resourceDistrictBadges: mapResourcePresentation.districtBadges,
      });

      if (!showPostPilotMapChrome || gameDay <= 1) {
        return items;
      }

      const selectedIntelligence = buildMapDistrictIntelligenceModel({
        selectedDistrictId: focusDistrictId,
        day: gameDay,
        isPostPilot: showPostPilotMapChrome,
        isPilotCompleted: pilotCompleted,
        crisisState,
        operationSignals,
        resourceFatigue: operationalResources,
        crisisOverlayVisible: mapCrisisPresentation.visible,
        rankKey: authorityState?.formalRankId,
        unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      });
      const accentChip = selectedIntelligence.stripChips[0]?.label;

      return items.map((item) => {
        const accentLabel =
          activeTaskRoutePreview?.visible && item.id === focusDistrictId
            ? 'Rota aktif'
            : accentChip;
        return item.id === focusDistrictId && accentLabel
          ? { ...item, intelligenceAccentLabel: accentLabel }
          : item;
      });
    },
    [
      authorityState,
      crisisState,
      crisisState.accessMode,
      focusDistrictId,
      gameDay,
      gameStateForMap.pilot.status,
      mainOperationScopeBadges,
      mapCrisisPresentation.districtBadges,
      mapCrisisPresentation.visible,
      mapResourcePresentation.districtBadges,
      operationalResources,
      operationSignals,
      pilotCompleted,
      postPilotOperation,
      activeTaskRoutePreview?.visible,
      selectedDistrictId,
      showPostPilotMapChrome,
    ],
  );

  const mapDistrictIntelligence = useMemo(() => {
    const base = buildMapDistrictIntelligenceModel({
      selectedDistrictId: focusDistrictId,
      day: gameDay,
      isPostPilot: showPostPilotMapChrome,
      isPilotCompleted: pilotCompleted,
      crisisState,
      operationSignals,
      resourceFatigue: operationalResources,
      recentEvents: activeEvents,
      rankKey: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      crisisOverlayVisible: mapCrisisPresentation.visible,
      activeMapLayerId: activeTaskRoutePreview?.visible ? 'active_task_route' : undefined,
      activeEvent: primaryMapEvent,
    });

    const suppressOperation = shouldSuppressMapOperationHintForActiveRoute({
      day: gameDay,
      activeEvent: primaryMapEvent,
      assignment: primaryMapEvent
        ? getEventAssignment(assignments, primaryMapEvent.id)
        : undefined,
      isMapSurface: true,
      isPostPilot: showPostPilotMapChrome,
    });

    if (!suppressOperation) return base;

    const visibleLines = base.visibleLines.filter((line) => line.kind !== 'operation');
    return {
      ...base,
      visibleLines,
      operationLine: undefined,
      visible: visibleLines.length > 0,
    };
  }, [
    activeEvents,
    activeTaskRoutePreview?.visible,
    assignments,
    authorityState,
    crisisState,
    focusDistrictId,
    gameDay,
    mapCrisisPresentation.visible,
    operationalResources,
    operationSignals,
    pilotCompleted,
    primaryMapEvent,
    showPostPilotMapChrome,
  ]);

  const districtFocusedEvent = useMemo(
    () =>
      activeEvents.find(
        (event) =>
          event.neighborhoodId === focusDistrictId ||
          event.district?.toLocaleLowerCase('tr-TR').includes(focusDistrictId),
      ) ?? primaryMapEvent,
    [activeEvents, focusDistrictId, primaryMapEvent],
  );

  const newSystemsAnalyticsContext = useMemo(
    () => ({
      day: gameDay,
      rankId: authorityState?.formalRankId,
      isPostPilot: showPostPilotMapChrome,
      source: 'map_operation_bottom_panel',
    }),
    [authorityState?.formalRankId, gameDay, showPostPilotMapChrome],
  );

  const mapBeforeAfterSummary = useMemo(() => {
    if (gameDay <= 1) return null;
    return buildMapBeforeAfterSummary({
      day: gameDay,
      surface: 'map_panel',
      activeEvent: primaryMapEvent,
      eventDomainFocus: primaryMapEvent
        ? buildEventDomainFocusModel({
            event: primaryMapEvent,
            day: gameDay,
            surface: 'inspect',
          })
        : null,
      crisisState:
        crisisState.accessMode === 'active' || Boolean(crisisState.activeIncident)
          ? { active: true }
          : null,
      operationSignals: { dominantDomain: operationSignals.dailyFocus },
      hasRealPostPilotData:
        gameDay > 7 &&
        (activeEvents.length > 0 ||
          postPilotOperation?.phase === 'main_operation_light' ||
          postPilotOperation?.phase === 'main_operation_full'),
    });
  }, [
    activeEvents.length,
    crisisState.accessMode,
    crisisState.activeIncident,
    gameDay,
    operationSignals.dailyFocus,
    postPilotOperation?.phase,
    primaryMapEvent,
  ]);

  const mapPresenceViewModel = useMemo(() => {
    const tomorrowPreview = buildReportTomorrowPreview({
      day: gameDay,
      lastEventResult: primaryMapEvent
        ? {
            eventId: primaryMapEvent.id,
            summaryTitle: primaryMapEvent.title,
          }
        : undefined,
      operationSignals,
    });

    return buildMapPresenceViewModel({
      day: gameDay,
      surface: mapViewMode === 'detail' ? 'district_detail' : 'overview',
      selectedDistrictId: focusDistrictId,
      activeEvent: primaryMapEvent,
      eventDomainFocus: primaryMapEvent
        ? buildEventDomainFocusModel({
            event: primaryMapEvent,
            day: gameDay,
            surface: 'inspect',
          })
        : null,
      reportTomorrowPreview: tomorrowPreview
        ? {
            domain: tomorrowPreview.domain,
            visible: tomorrowPreview.visibility !== 'hidden',
          }
        : null,
      operationSignals: {
        dominantDomain: operationSignals.dailyFocus,
        pressureLevel: operationSignals.overall?.status,
      },
      operationalResources,
      assignmentState: {
        activeDistrictId: operationSignals.priorityDistrictId,
      },
      crisisState,
      postPilotOperation: postPilotOperation
        ? {
            active:
              postPilotOperation.phase === 'main_operation_light' ||
              postPilotOperation.phase === 'main_operation_full',
          }
        : null,
      hasRealPostPilotData:
        gameDay > 7 &&
        (activeEvents.length > 0 ||
          postPilotOperation?.phase === 'main_operation_light' ||
          postPilotOperation?.phase === 'main_operation_full'),
      mapBeforeAfterSummary: mapBeforeAfterSummary ?? undefined,
    });
  }, [
    activeEvents.length,
    assignments,
    crisisState,
    mapBeforeAfterSummary,
    focusDistrictId,
    gameDay,
    mapViewMode,
    operationalResources,
    operationSignals,
    postPilotOperation,
    primaryMapEvent,
  ]);

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

  const mainOperationScopeHintLine = useMemo(() => {
    if (!showPostPilotMapChrome || gameDay < POST_PILOT_FIRST_OPERATION_DAY) {
      return undefined;
    }
    const feelModel = buildMainOperationFeelFromStore({
      gameState: gameStateForMap,
      monetization,
      mainOperationSeason,
      operationSignals,
      postPilotOperation: postPilotOperation ?? undefined,
    });
    return buildMainOperationFeelMapHint(feelModel, [postPilotMapContextLine ?? ''].filter(Boolean))
      .hintLine;
  }, [
    gameDay,
    gameStateForMap,
    mainOperationSeason,
    monetization,
    operationSignals,
    postPilotMapContextLine,
    postPilotOperation,
    showPostPilotMapChrome,
  ]);

  const mapDistrictReportCardBundle = useMemo(() => {
    const intelligenceLines = mapDistrictIntelligence?.visibleLines.map((line) => line.text) ?? [];
    const model = buildDistrictReportCardLiteModel({
      districtId: focusDistrictId,
      day: gameDay,
      isPostPilot: showPostPilotMapChrome,
      isPilotCompleted: pilotCompleted,
      postPilotPhase: postPilotOperation?.phase,
      accessMode: deriveMainOperationAccessMode(gameStateForMap, monetization),
      crisisState,
      operationSignals,
      resourceFatigue: operationalResources,
      activeEvent: districtFocusedEvent,
      recentEvents: activeEvents,
      contentPackMeta: resolveContentPackMetaForWiring({
        event: districtFocusedEvent,
        eventId: districtFocusedEvent?.id,
        districtId: focusDistrictId,
        day: gameDay,
        eventPool,
        postPilotCatalog,
      }),
      mapIntelligenceLines: intelligenceLines,
      mainOperationScopeHintLine: mainOperationScopeHintLine ?? undefined,
      existingLines: [
        ...intelligenceLines,
        mainOperationScopeHintLine ?? '',
        postPilotMapContextLine ?? '',
      ].filter(Boolean),
    });
    const presentation = buildDistrictReportCardMapPresentation(model, [
      ...intelligenceLines,
      mainOperationScopeHintLine ?? '',
    ]);
    return { model, presentation };
  }, [
    activeEvents,
    crisisState,
    districtFocusedEvent,
    focusDistrictId,
    gameDay,
    gameStateForMap,
    mainOperationScopeHintLine,
    mapDistrictIntelligence?.visibleLines,
    monetization,
    operationalResources,
    operationSignals,
    pilotCompleted,
    postPilotMapContextLine,
    postPilotOperation?.phase,
    showPostPilotMapChrome,
  ]);

  const mapDistrictReportCard = mapDistrictReportCardBundle.presentation;

  const operationalResourcePresenceModel = useMemo(() => {
    if (gameDay <= 1) return null;
    const input = buildOperationalResourcePresenceLiteInputFromEngine({
      day: gameDay,
      isPostPilot: showPostPilotMapChrome,
      accessMode: deriveMainOperationAccessMode(gameStateForMap, monetization),
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        priorityDistrictId: operationSignals.priorityDistrictId,
        containers: operationSignals.containers,
        vehicles: operationSignals.vehicles,
        personnel: operationSignals.personnel,
        districts: operationSignals.districts,
        overall: operationSignals.overall,
      },
      focusDistrictId,
    });
    return buildOperationalResourcePresenceLiteModel(input);
  }, [
    focusDistrictId,
    gameDay,
    gameStateForMap,
    monetization,
    operationalResources,
    operationSignals,
    showPostPilotMapChrome,
  ]);

  const mapReactionLiteModel = useMemo(() => {
    const intelligenceLines =
      mapDistrictIntelligence?.visibleLines.map((line) => line.text) ?? [];
    const resourceOverlayLines = mapResourcePresentation.panelLines.map(
      (line) => line.summary,
    );
    const reportCardLines = [
      mapDistrictReportCard?.primaryLine ?? '',
      mapDistrictReportCard?.recentEffectLine ?? '',
    ].filter(Boolean);

    return buildMapReactionLiteModel(
      buildMapReactionLiteInputFromMapContext({
        day: gameDay,
        selectedDistrictId: focusDistrictId,
        isPostPilot: showPostPilotMapChrome,
        accessMode: deriveMainOperationAccessMode(gameStateForMap, monetization),
        operationSignals: {
          dailyFocus: operationSignals.dailyFocus,
          priorityDistrictId: operationSignals.priorityDistrictId,
          containers: operationSignals.containers,
          vehicles: operationSignals.vehicles,
          personnel: operationSignals.personnel,
          districts: operationSignals.districts,
          overall: operationSignals.overall,
        },
        resourceFatigue: operationalResources,
        operationalResources,
        districtReportCard: mapDistrictReportCardBundle.model,
        operationalResourcePresence: operationalResourcePresenceModel ?? undefined,
        contentPackMeta: resolveContentPackMetaForWiring({
          event: districtFocusedEvent,
          eventId: districtFocusedEvent?.id,
          districtId: focusDistrictId,
          day: gameDay,
          eventPool,
          postPilotCatalog,
        }),
        mainOperationScopeHintLine: mainOperationScopeHintLine ?? undefined,
        activeRouteVisible: activeTaskRoutePreview?.visible,
        activeRouteDistrictId: focusDistrictId,
        mapIntelligenceLines: intelligenceLines,
        districtReportCardLines: reportCardLines,
        resourceOverlayLines,
        resourcePresenceMapLine: operationalResourcePresenceModel?.mapPresenceLine,
        mainOperationFeelMapHint: mainOperationScopeHintLine ?? undefined,
      }),
    );
  }, [
    activeTaskRoutePreview?.visible,
    districtFocusedEvent,
    focusDistrictId,
    gameDay,
    gameStateForMap,
    mainOperationScopeHintLine,
    mapDistrictIntelligence?.visibleLines,
    mapDistrictReportCard,
    mapDistrictReportCardBundle.model,
    mapResourcePresentation.panelLines,
    monetization,
    operationalResourcePresenceModel,
    operationalResources,
    operationSignals,
    showPostPilotMapChrome,
  ]);

  const mapReactionPanel = useMemo(() => {
    const guard = [
      ...(mapDistrictIntelligence?.visibleLines.map((line) => line.text) ?? []),
      mapDistrictReportCard?.primaryLine ?? '',
      mapDistrictReportCard?.recentEffectLine ?? '',
      operationalResourcePresenceModel?.mapPresenceLine ?? '',
      mainOperationScopeHintLine ?? '',
      ...mapResourcePresentation.panelLines.map((line) => line.summary),
    ].filter(Boolean);
    return buildMapReactionPanelPresentation(mapReactionLiteModel, guard);
  }, [
    mainOperationScopeHintLine,
    mapDistrictIntelligence?.visibleLines,
    mapDistrictReportCard?.primaryLine,
    mapDistrictReportCard?.recentEffectLine,
    mapReactionLiteModel,
    mapResourcePresentation.panelLines,
    operationalResourcePresenceModel?.mapPresenceLine,
  ]);

  const reactionHighlightDistrictIds = useMemo(() => {
    if (!showPostPilotMapChrome || gameDay <= 1) return undefined;
    const crisisSet = new Set(crisisHighlightDistrictIds ?? []);
    const resourceSet = new Set(resourceHighlightDistrictIds ?? []);
    const ids = buildMapReactionHighlightDistrictIds(mapReactionLiteModel).filter(
      (id) => !crisisSet.has(id) && !resourceSet.has(id),
    );
    return ids.length > 0 ? ids : undefined;
  }, [
    crisisHighlightDistrictIds,
    gameDay,
    mapReactionLiteModel,
    resourceHighlightDistrictIds,
    showPostPilotMapChrome,
  ]);

  const neighborhoodStripItemsWithReactions = useMemo(
    () =>
      applyMapReactionStripOverlay(
        neighborhoodStripItems,
        mapReactionLiteModel,
        focusDistrictId,
      ),
    [focusDistrictId, mapReactionLiteModel, neighborhoodStripItems],
  );

  const operationPanel = useMemo(() => {
    const merged = mergeMapPanelCrisisAndResourceLines({
      crisisLines: mapCrisisPresentation.visible
        ? mapCrisisPresentation.panelLines
        : undefined,
      resourceLines: mapResourcePresentation.visible
        ? mapResourcePresentation.panelLines
        : undefined,
      maxTotal: 2,
    });
    const panelSlotsUsed =
      (merged.crisisLines?.length ?? 0) + (merged.resourceLines?.length ?? 0);
    const presenceLines =
      gameDay > 1 &&
      mapPresenceViewModel.visible &&
      panelSlotsUsed < 2
        ? mapPresenceViewModel.panelLines.slice(0, 2 - panelSlotsUsed)
        : undefined;
    return buildMapOperationPanelModel({
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
      mainOperationScopeHintLine: mainOperationScopeHintLine ?? undefined,
      crisisLines: merged.crisisLines,
      resourceLines: merged.resourceLines,
      presenceLines,
      mapReactionHintLine: mapReactionPanel.visible ? mapReactionPanel.hintLine : undefined,
      mapReactionHintTone: mapReactionPanel.hintTone,
    });
  }, [
    activeEvents,
    containerState,
    dayEvent.mainEventTitle,
    focusDistrictId,
    gameDay,
    hideMapFleetSignals,
    mapCrisisPresentation.panelLines,
    mapCrisisPresentation.visible,
    mapPresenceViewModel.panelLines,
    mapPresenceViewModel.visible,
    mapReactionPanel.hintLine,
    mapReactionPanel.hintTone,
    mapReactionPanel.visible,
    mapResourcePresentation.panelLines,
    mapResourcePresentation.visible,
    mapViewMode,
    mainOperationScopeHintLine,
    pilotAreaId,
    postPilotMapContextLine,
    selectedDistrictId,
    vehicleState,
  ]);

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

        {showPostPilotMapChrome ? (
          <MapNeighborhoodStrip
            items={neighborhoodStripItemsWithReactions}
            selectedId={focusDistrictId}
            onSelect={handleDistrictSelect}
          />
        ) : null}

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
          crisisHighlightDistrictIds={crisisHighlightDistrictIds}
          resourceHighlightDistrictIds={resourceHighlightDistrictIds}
          reactionHighlightDistrictIds={reactionHighlightDistrictIds}
          mapPresenceViewModel={mapPresenceViewModel}
          activeOperationOverlay={activeOperationOverlay}
          onLayersPress={() => setLayerPanelOpen(true)}
          onDistrictSelect={handleDistrictSelect}
          onBackToOverview={handleBackToOverview}
          onPinPress={(pinId) => {
            setSelectedPinId((current) => (current === pinId ? null : pinId));
          }}
        />

        <Animated.View entering={FadeIn.duration(220)} style={styles.lowerCards}>
          {showPostPilotMapChrome ? (
            <MapOperationBottomPanel
              model={operationPanel}
              districtIntelligence={mapDistrictIntelligence}
              districtReportCard={mapDistrictReportCard}
              activeTaskRoutePreview={activeTaskRoutePreview}
              mapBeforeAfterImpact={
                gameDay > 1 &&
                !mapCrisisPresentation.visible &&
                mapBeforeAfterSummary?.impact?.visible
                  ? mapBeforeAfterSummary.impact
                  : null
              }
              analyticsContext={newSystemsAnalyticsContext}
              onPressCta={handleFocusDistrict}
              onPressRecommended={handleFocusDistrict}
            />
          ) : null}

          <MapOperationSignalCard
            model={operationSignalModel}
            onActionPress={handleFocusDistrict}
            onTrack={handleFocusDistrict}
          />

          {!showPostPilotMapChrome && mapViewMode === 'detail' && mapDistrictReportCard ? (
            <MapDistrictReportCard presentation={mapDistrictReportCard} />
          ) : null}

          {!showPostPilotMapChrome ? (
            <MapPilotDistrictStatusCard
              model={pilotStatusModel}
              onSuggestionPress={handleFocusDistrict}
              onMiniMapPress={handleFocusDistrict}
            />
          ) : null}
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
