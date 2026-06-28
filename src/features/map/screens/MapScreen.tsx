import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

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
import {
  buildActiveOperationMapBinding,
  buildPolishedActiveOperationMapCard,
} from '@/core/activeOperationMapBinding';
import { buildDistrictPersonalityProfile } from '@/core/districtPersonality';
import { buildDistrictPersonalityMapContext } from '@/core/districtPersonality/districtPersonalityPresentation';
import { selectActiveMaintenanceRuntimeItems } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { deriveActivePeriodGoal, buildPeriodGoalPresentation } from '@/core/periodGoals/periodGoalModel';
import type { PeriodGoalContextInput } from '@/core/periodGoals/periodGoalTypes';
import { buildEventGameplayVarietyProfile } from '@/core/eventVariety/eventGameplayVarietyModel';
import { buildMapGameplayBindings } from '@/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildMapGameplayRuntimeFeedback } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackModel';
import { buildMapDistrictIntelligenceModel } from '@/core/map/mapDistrictIntelligencePresentation';
import {
  buildDistrictReportCardFullModel,
  buildDistrictReportCardMapPresentation,
} from '@/core/districtReportCard';
import {
  buildOperationalResourcePresenceLiteInputFromEngine,
  buildOperationalResourcePresenceLiteModel,
} from '@/core/operationalResourcePresence';
import {
  buildMapReactionLiteModel,
  buildMapReactionHighlightDistrictIds,
  buildMapReactionLiteInputFromMapContext,
} from '@/core/mapReactions';
import {
  buildMapReactionMotionIntegrationModel,
  shouldShowMapReactionMotion,
  useReduceMotionPreference,
} from '@/core/mapReactionsMotion';
import { buildRewardComebackMapPresentation } from '@/core/rewardComeback';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation';
import { buildMapBeforeAfterSummary, buildMapPresenceViewModel } from '@/core/mapPresence';
import {
  buildMainOperationFeelFromStore,
  buildMainOperationFeelMapHint,
} from '@/core/mainOperationFeel';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { buildPostPilotMapContextLineForGameState } from '@/core/postPilot/postPilotOperationUxPresentation';
import { buildReportTomorrowPreview } from '@/core/reports/reportTomorrowPreviewPresentation';
import { buildMemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import { buildMapGameplayPresentation } from '@/features/map/utils/mapGameplayPresentation';
import { buildMapCrisisPresentationBundle } from '@/features/map/utils/mapCrisisPresentation';
import { buildMapMotionPresentation } from '@/features/map/utils/mapMotionPresentation';
import {
  buildMapResourcePresentationBundle,
  buildMapResourceEngineInputFromStore,
  isMapDistrictId,
} from '@/features/map/utils/mapResourcePresentation';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import {
  selectActiveEvents,
  selectContainerState,
  selectCurrentPilotDay,
  selectDecisionHistory,
  selectPilotState,
  selectPostPilotOperation,
  selectSelectedPilotDistrictId,
  selectVehicleStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { mapUi } from '@/features/map/utils/mapUiTokens';

import { LayerPanel } from '../components/LayerPanel';
import { MapGuideModal } from '../components/MapGuideModal';
import { MapHeroPanel } from '../components/MapHeroPanel';
import {
  DEFAULT_MAP_DISTRICT_ID,
  MAP_DISTRICT_IDS,
  type MapDistrictId,
} from '../data/mapAssets';
import { mapDistrictFromPilot } from '../data/mapDistrictMapping';
import { pilotAreaFromDistrict } from '../data/pilotAreaMapping';
import { prefetchMapCriticalImages } from '../data/mapCriticalAssets';
import { getDefaultLayers } from '../data/mapSelectors';
import {
  buildMapActiveOperationOverlayModel,
  shouldShowMapCrisisChrome,
} from '../utils/mapUiPresentation';
import type {
  ActiveLayers,
  LayerId,
  MapFilterId,
  MapViewMode,
  PilotAreaId,
} from '../types/map';

export function MapScreen() {
  const reducedMotionMode = useReduceMotionPreference();
  const selectedDistrictId: PilotDistrictId =
    useGameStore(selectSelectedPilotDistrictId) ?? DEFAULT_PILOT_DISTRICT_ID;
  const gameDay = useGameStore(selectCurrentPilotDay) ?? 1;
  const activeEvents = useGameStore(selectActiveEvents);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const containerState = useGameStore(selectContainerState);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const hideMapFleetSignals = useGameStore(selectIsDay1TutorialActive);

  const pilotAreaId: PilotAreaId = pilotAreaFromDistrict(selectedDistrictId);
  const [selectedFilter] = useState<MapFilterId>('events');
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

  useFocusEffect(
    useCallback(() => {
      void prefetchMapCriticalImages();
    }, []),
  );

  useEffect(() => {
    setActiveLayers(getDefaultLayers(pilotAreaId));
  }, [pilotAreaId]);

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
  const maintenanceBacklogRuntime = useGameStore((s) => s.maintenanceBacklogRuntime);
  const cityArchive = useGameStore((s) => s.cityArchive);
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

  const activeOperationMapContext = useMemo(() => {
    if (mapViewMode !== 'overview') return null;
    const assignment = primaryMapEvent
      ? getEventAssignment(assignments, primaryMapEvent.id)
      : undefined;
    const districtProfile = buildDistrictPersonalityProfile({
      districtId: primaryMapEvent?.neighborhoodId ?? focusDistrictId,
      districtName: primaryMapEvent?.district,
      day: gameDay,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      operationSignals,
      resourceSignals: operationalResources,
      activeTaskRouteSignals: activeTaskRoutePreview,
    });
    const eventGameplayProfile = primaryMapEvent
      ? buildEventGameplayVarietyProfile(primaryMapEvent, {
          day: gameDay,
          isDay1LearningEvent: gameDay <= 1,
        })
      : null;
    const mapGameplayBindings = buildMapGameplayBindings({
      day: gameDay,
      authorityRankId: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      activeEventIds: primaryMapEvent ? [primaryMapEvent.id] : [],
      activeOperationContext: primaryMapEvent,
      operationSignals,
      resourceSignals: operationalResources,
      activeTaskRouteSignals: activeTaskRoutePreview,
    });
    const trackerBinding =
      mapGameplayBindings.find((binding) => binding.role === 'operation_tracker') ?? null;

    const activeOperationBinding = buildActiveOperationMapBinding({
      day: gameDay,
      activeEvent: primaryMapEvent,
      assignment,
      activeTaskRoute: activeTaskRoutePreview,
      districtPersonality: districtProfile,
      eventGameplayProfile,
      mapGameplayBinding: trackerBinding,
      operationSignals,
      resourceSignals: operationalResources,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      eventDetailRoute: primaryMapEvent ? `/events/${primaryMapEvent.id}` : undefined,
    });

    return {
      binding: activeOperationBinding,
      mapGameplayBindings,
    };
  }, [
    activeTaskRoutePreview,
    assignments,
    authorityState,
    focusDistrictId,
    gameDay,
    mapViewMode,
    operationalResources,
    operationSignals,
    primaryMapEvent,
  ]);

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

  const postPilotMemoryFollowUpContext = useMemo(() => {
    if (!showPostPilotMapChrome || gameDay < 8) return null;
    return buildMemoryFollowUpPresentationContext({
      day: gameDay,
      gameState: gameStateForMap,
      operationSignals,
    });
  }, [gameDay, gameStateForMap, operationSignals, showPostPilotMapChrome]);

  const mapGameplayRuntimeFeedback = useMemo(() => {
    if (!activeOperationMapContext || !postPilotMemoryFollowUpContext) return null;
    return buildMapGameplayRuntimeFeedback({
      day: gameDay,
      gameState: gameStateForMap,
      snapshot: postPilotMemoryFollowUpContext.dailyCapacityRuntimeSnapshot,
      mapGameplayBindings: activeOperationMapContext.mapGameplayBindings,
      activeOperationBinding: activeOperationMapContext.binding,
      deferredEventIds: postPilotOperation?.postPilotDailyEventSet?.deferredEventIds,
      explicitActiveEventId: primaryMapEvent?.id,
      authorityEffectSnapshot:
        postPilotMemoryFollowUpContext.dailyCapacityRuntimeSnapshot?.authorityEffectSnapshot,
    });
  }, [
    activeOperationMapContext,
    gameDay,
    gameStateForMap,
    postPilotMemoryFollowUpContext,
    postPilotOperation?.postPilotDailyEventSet?.deferredEventIds,
    primaryMapEvent?.id,
  ]);

  const activeOperationMapCard = useMemo(() => {
    const binding = activeOperationMapContext?.binding;
    if (!binding) return null;
    return buildPolishedActiveOperationMapCard({
      day: gameDay,
      binding,
      runtimeFeedback: mapGameplayRuntimeFeedback ?? undefined,
      authorityEffectSnapshot:
        postPilotMemoryFollowUpContext?.dailyCapacityRuntimeSnapshot?.authorityEffectSnapshot,
      deferredEventIds: postPilotOperation?.postPilotDailyEventSet?.deferredEventIds,
      explicitEventId: primaryMapEvent?.id,
      mitigationLine:
        postPilotMemoryFollowUpContext?.dailyCapacityRuntimeSnapshot?.portfolioDeferRisk
          .primaryBinding?.mitigationLine,
    });
  }, [
    activeOperationMapContext?.binding,
    gameDay,
    mapGameplayRuntimeFeedback,
    postPilotMemoryFollowUpContext?.dailyCapacityRuntimeSnapshot,
    postPilotOperation?.postPilotDailyEventSet?.deferredEventIds,
    primaryMapEvent?.id,
  ]);

  const mapGameplayPresentation = useMemo(
    () =>
      buildMapGameplayPresentation({
        activeEvents,
        activeOperationCard: activeOperationMapCard,
        activeOperationBinding: activeOperationMapContext?.binding ?? null,
        gameDay,
        operationalResources,
        decisionHistory,
      }),
    [
      activeEvents,
      activeOperationMapCard,
      activeOperationMapContext?.binding,
      decisionHistory,
      gameDay,
      operationalResources,
    ],
  );

  const mapDirectActionExtras = useMemo(() => {
    if (gameDay < 8) {
      return {
        periodGoalShortTitle: undefined as string | undefined,
        districtPersonalitySignalLine: undefined as string | undefined,
      };
    }
    const maintenanceActive = selectActiveMaintenanceRuntimeItems(maintenanceBacklogRuntime);
    const periodGoalContext: PeriodGoalContextInput = {
      day: gameDay,
      maintenanceActiveCount: maintenanceActive.length,
      maintenanceCriticalCount: maintenanceActive.filter((item) => item.severity === 'critical')
        .length,
      maintenanceStrainedCount: maintenanceActive.filter((item) => item.severity === 'strained')
        .length,
    };
    const periodGoal = buildPeriodGoalPresentation(
      deriveActivePeriodGoal(periodGoalContext),
      periodGoalContext,
    );
    const districtProfile = buildDistrictPersonalityProfile({
      districtId: primaryMapEvent?.neighborhoodId ?? focusDistrictId,
      districtName: primaryMapEvent?.district,
      day: gameDay,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      operationSignals,
      resourceSignals: operationalResources,
      activeTaskRouteSignals: activeTaskRoutePreview,
    });
    const districtMapContext = buildDistrictPersonalityMapContext(districtProfile);
    return {
      periodGoalShortTitle: periodGoal.shortTitle,
      districtPersonalitySignalLine: districtMapContext.mapSignalLine,
    };
  }, [
    activeTaskRoutePreview,
    authorityState?.unlockedPermissionIds,
    focusDistrictId,
    gameDay,
    maintenanceBacklogRuntime,
    operationSignals,
    operationalResources,
    primaryMapEvent?.district,
    primaryMapEvent?.neighborhoodId,
  ]);

  const mapMotionPresentation = useMemo(() => {
    return buildMapMotionPresentation({
      day: gameDay,
      reducedMotion: reducedMotionMode,
      focusDistrictId,
      activeOperationBinding: activeOperationMapContext?.binding,
      mapGameplayBindings:
        mapGameplayRuntimeFeedback?.enrichedBindings ??
        activeOperationMapContext?.mapGameplayBindings,
      mapGameplayRuntimeFeedback,
      day8StrategicContent: postPilotMemoryFollowUpContext?.day8StrategicContent,
      districtNeglectRecovery: postPilotMemoryFollowUpContext?.districtNeglectRecovery,
      positiveComeback: postPilotMemoryFollowUpContext?.positiveComeback,
      cityMemoryVisibility: postPilotMemoryFollowUpContext?.cityMemoryVisibility,
      activeTaskRoute: activeTaskRoutePreview,
      mapPresenceViewModel,
    });
  }, [
    activeOperationMapContext,
    activeTaskRoutePreview,
    focusDistrictId,
    gameDay,
    mapGameplayRuntimeFeedback,
    mapPresenceViewModel,
    postPilotMemoryFollowUpContext,
    reducedMotionMode,
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
    const model = buildDistrictReportCardFullModel({
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
      cityArchive,
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
    cityArchive,
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
        cityArchive,
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
        recentDecisionRecord: decisionHistory.at(-1) ?? null,
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
    decisionHistory,
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

  const rewardComebackMapPresentation = useMemo(() => {
    if (gameDay <= 2) return null;
    return buildRewardComebackMapPresentation({
      day: gameDay,
      surface: 'map',
      isPostPilot: showPostPilotMapChrome,
      priorityDistrictId: focusDistrictId,
      mapReactionKind: mapReactionLiteModel?.selectedDistrictReaction?.kind,
      districtReportCard: mapDistrictReportCardBundle.model ?? undefined,
      contentPackMeta: resolveContentPackMetaForWiring({
        event: districtFocusedEvent,
        eventId: districtFocusedEvent?.id,
        districtId: focusDistrictId,
        day: gameDay,
        eventPool,
        postPilotCatalog,
      }),
      existingLines: [
        mapDistrictReportCard?.primaryLine ?? '',
        mapDistrictReportCard?.recentEffectLine ?? '',
        operationalResourcePresenceModel?.mapPresenceLine ?? '',
      ].filter(Boolean),
    });
  }, [
    districtFocusedEvent,
    eventPool,
    focusDistrictId,
    gameDay,
    mapDistrictReportCard?.primaryLine,
    mapDistrictReportCard?.recentEffectLine,
    mapDistrictReportCardBundle.model,
    mapReactionLiteModel?.selectedDistrictReaction?.kind,
    operationalResourcePresenceModel?.mapPresenceLine,
    postPilotCatalog,
    showPostPilotMapChrome,
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

  const mapReactionMotionModel = useMemo(() => {
    if (!showPostPilotMapChrome || gameDay <= 1) return null;
    const guard = [
      ...(mapDistrictIntelligence?.visibleLines.map((line) => line.text) ?? []),
      mapDistrictReportCard?.primaryLine ?? '',
      mapDistrictReportCard?.recentEffectLine ?? '',
      operationalResourcePresenceModel?.mapPresenceLine ?? '',
      mainOperationScopeHintLine ?? '',
      rewardComebackMapPresentation?.mapLine ?? '',
      ...mapResourcePresentation.panelLines.map((line) => line.summary),
    ].filter(Boolean);
    return buildMapReactionMotionIntegrationModel({
      reactionModel: mapReactionLiteModel,
      selectedDistrictId: focusDistrictId,
      accessMode: deriveMainOperationAccessMode(gameStateForMap, monetization),
      reducedMotionMode,
      existingTextLines: guard,
    });
  }, [
    focusDistrictId,
    gameDay,
    gameStateForMap,
    mainOperationScopeHintLine,
    mapDistrictIntelligence?.visibleLines,
    mapDistrictReportCard?.primaryLine,
    mapDistrictReportCard?.recentEffectLine,
    mapReactionLiteModel,
    mapResourcePresentation.panelLines,
    monetization,
    operationalResourcePresenceModel?.mapPresenceLine,
    reducedMotionMode,
    rewardComebackMapPresentation?.mapLine,
    showPostPilotMapChrome,
  ]);

  const handleToggleLayer = useCallback((id: LayerId) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <GameScreenShell
      scrollable={false}
      headerVariant="none"
      backgroundColor={mapUi.canvas}
      reserveTabBarInset={false}
      contentStyle={styles.content}>
      <View style={styles.stack}>
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
          reactionMotionCues={
            shouldShowMapReactionMotion(mapReactionMotionModel)
              ? mapReactionMotionModel!.globalMotionCues
              : undefined
          }
          operationScopeMotionDistrictIds={
            mapReactionMotionModel?.operationScopeCue?.districtIds
          }
          journalMotionCue={mapReactionMotionModel?.journalCue}
          bubbleMotionCue={mapReactionMotionModel?.bubbleCue}
          reducedMotionMode={reducedMotionMode}
          mapPresenceViewModel={mapPresenceViewModel}
          activeOperationOverlay={activeOperationOverlay}
          activeOperationCard={activeOperationMapCard}
          activeOperationBinding={activeOperationMapContext?.binding ?? null}
          mapGameplayPresentation={mapGameplayPresentation}
          operationalResources={operationalResources}
          mapMotionPresentation={mapMotionPresentation}
          mapReactionLiteModel={mapReactionLiteModel}
          recentDecisionRecord={decisionHistory.at(-1) ?? null}
          maintenanceBacklogRuntime={maintenanceBacklogRuntime}
          periodGoalShortTitle={mapDirectActionExtras.periodGoalShortTitle}
          districtPersonalitySignalLine={mapDirectActionExtras.districtPersonalitySignalLine}
          onLayersPress={() => setLayerPanelOpen(true)}
          onDistrictSelect={handleDistrictSelect}
          onBackToOverview={handleBackToOverview}
          onPinPress={(pinId) => {
            setSelectedPinId((current) => (current === pinId ? null : pinId));
          }}
        />
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
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 0,
  },
  stack: {
    flex: 1,
    gap: 0,
    minWidth: 0,
  },
});
