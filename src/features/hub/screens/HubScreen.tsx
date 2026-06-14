import { useEffect, useMemo } from 'react';

import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  getAnalyticsAccessModeFromGameState,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import {
  breadcrumbContentPackEventShown,
  breadcrumbHubScreenOpened,
  breadcrumbMainOperationFeelShown,
} from '@/core/crashPerformance/crashBreadcrumbs';
import { startScreenTiming } from '@/core/crashPerformance/performanceLite';
import {
  buildCityJournalHubPresentation,
  buildCityJournalLiteModel,
} from '@/core/cityJournal';
import {
  buildCityEchoBinding,
  buildCityEchoHubLine,
} from '@/core/cityEchoBinding';
import {
  buildDecisionImpactExplanationForHub,
  buildDecisionImpactHubEcho,
} from '@/core/decisionImpactExplanation';
import {
  buildContentRuntimeActivationSelection,
  resolveContentPackMetaForWiring,
} from '@/core/contentRuntimeActivation';
import { resolveEventCardById } from '@/core/liveFlow/eventLifecycleEngine';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import {
  buildDistrictReportCardFullModel,
  buildDistrictReportCardSummaryForHub,
} from '@/core/districtReportCard';
import { buildHubArchiveContinuityModel } from '@/core/cityArchive/cityArchiveSurfaceWiring';
import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import { buildDistrictOperationUnlockBindingCompactSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import { selectTeamSpecializationSurfaceLines } from '@/core/teamSpecialization/teamSpecializationSelectors';
import { selectVehicleMaintenanceSurfaceLines } from '@/core/vehicleMaintenance/vehicleMaintenanceSelectors';
import { buildHubBadgeShowcaseSummary } from '@/features/hub/utils/hubBadgeShowcaseModel';
import { buildPersistentStoryChainHubLine } from '@/core/storyChains/storyChainPersistentPresentation';
import {
  buildMainOperationFeelEceLine,
  buildMainOperationFeelFromStore,
  buildMainOperationFeelHubPresentation,
} from '@/core/mainOperationFeel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import {
  buildHubCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver/carryOverMemoryPresentation';
import { buildTomorrowRiskPresentation } from '@/core/tomorrowRisk';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { HubDevTools } from '@/features/hub/components/HubDevTools';
import { HubReferenceHome } from '@/features/hub/components/HubReferenceHome';
import { buildHubScreenLayoutModel } from '@/features/hub/utils/hubScreenPresentation';
import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import {
  selectActiveTutorialStepForScreen,
  selectIsDay1TutorialActive,
} from '@/features/tutorial/tutorialSelectors';
import {
  selectDecisionHistory,
  useGameStore,
} from '@/store/useGameStore';
import { useGameStatus } from '@/store/gameSelectors';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { gameUi } from '@/ui/theme/gameUiTokens';

/**
 * Merkez ekranı — referans görseldeki premium mobil home kompozisyonu.
 * Scope: presentation/UI only. Core gameplay, persist ve navigation route yapısı değişmez.
 */
export function HubScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const dailyGoalState = useGameStore((s) => s.dailyGoalState);
  const hubQuickActionState = useGameStore((s) => s.hubQuickActionState);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const eventPool = useGameStore((s) => s.eventPool);
  const socialPulseState = useGameStore((s) => s.socialPulseState);
  const cityArchive = useGameStore((s) => s.cityArchive);
  const vehicleMaintenance = useGameStore((s) => s.vehicleMaintenance);
  const teamSpecialization = useGameStore((s) => s.teamSpecialization);
  const tutorialActive = useGameStore(selectIsDay1TutorialActive);
  const hubTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'hub'),
  );
  useTutorialHighlight('hub', 'hub_metrics');

  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const postPilotOperation = useGameStore((s) => s.gameState.pilot.postPilotOperation);

  const hubCardVisibility = buildHubCardVisibilityModel(gameState, monetization);
  const gameStatus = useGameStatus();
  const hubDay = gameState.city.day;
  const hubLayoutModel = useMemo(
    () =>
      buildHubScreenLayoutModel({
        gameState,
        tutorialActive,
        isDay1Layout: hubDay <= 1,
        activeEventCount: gameState.events.length,
        postPilotOperation: gameState.pilot.postPilotOperation,
      }),
    [gameState, hubDay, tutorialActive],
  );

  const hubCarryOverMemory = useMemo(
    () => buildHubCarryOverMemory({ day: hubDay }),
    [hubDay],
  );

  const showHubCarryOver =
    hubCarryOverMemory?.visible === true &&
    shouldShowCarryOverMemory(hubDay, 'hub', { day: hubDay });

  const hubPackWiringContext = useMemo(() => {
    const lastDecision = decisionHistory.filter((record) => record.day === hubDay - 1).at(-1);
    const postPilotCatalog =
      gameState.pilot.postPilotOperation?.postPilotDailyEventSet?.catalog ?? [];
    if (!lastDecision?.eventId) {
      return { event: undefined, contentPackMeta: undefined, postPilotCatalog };
    }
    const event = resolveEventCardById(lastDecision.eventId, gameState.events, eventPool);
    const contentPackMeta = resolveContentPackMetaForWiring({
      event,
      eventId: lastDecision.eventId,
      districtId: lastDecision.neighborhoodId,
      day: hubDay,
      eventPool,
      postPilotCatalog,
    });
    return { event, contentPackMeta, postPilotCatalog };
  }, [decisionHistory, eventPool, gameState.events, gameState.pilot.postPilotOperation, hubDay]);

  const hubImpactExplanationLine = useMemo(
    () =>
      buildDecisionImpactHubEcho(
        buildDecisionImpactExplanationForHub({
          day: hubDay,
          recentDecisions: decisionHistory,
          event: hubPackWiringContext.event,
          operationSignals,
          resourceFatigue: operationalResources,
          carryOverSummary: hubCarryOverMemory?.summary,
          eventPool,
          postPilotCatalog: hubPackWiringContext.postPilotCatalog,
        }),
      ),
    [
      decisionHistory,
      hubCarryOverMemory?.summary,
      hubDay,
      hubPackWiringContext.event,
      operationSignals,
      operationalResources,
    ],
  );

  const tomorrowRiskPresentation = useMemo(
    () =>
      buildTomorrowRiskPresentation({
        day: hubDay,
        carryOver: hubCarryOverMemory ?? undefined,
        operationSignals,
        resourceFatigue: operationalResources,
        socialPulse: {
          globalPulseScore: socialPulseState.globalPulseScore,
        },
        postPilotOperation: gameState.pilot.postPilotOperation ?? undefined,
        contentPackMeta: hubPackWiringContext.contentPackMeta,
        event: hubPackWiringContext.event,
        eventId: decisionHistory.filter((record) => record.day === hubDay - 1).at(-1)?.eventId,
        eventPool,
        postPilotCatalog: hubPackWiringContext.postPilotCatalog,
        existingLines: [
          showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
          showHubCarryOver ? hubCarryOverMemory?.detail ?? '' : '',
          hubImpactExplanationLine ?? '',
        ].filter(Boolean),
      }),
    [
      gameState.pilot.postPilotOperation,
      hubCarryOverMemory,
      hubDay,
      hubImpactExplanationLine,
      hubPackWiringContext.contentPackMeta,
      hubPackWiringContext.event,
      hubPackWiringContext.postPilotCatalog,
      decisionHistory,
      eventPool,
      operationSignals,
      operationalResources,
      showHubCarryOver,
      socialPulseState.globalPulseScore,
    ],
  );

  const cityEchoHubLine = useMemo(
    () =>
      buildCityEchoHubLine(
        buildCityEchoBinding({
          day: hubDay,
          decisionImpact: buildDecisionImpactExplanationForHub({
            day: hubDay,
            recentDecisions: decisionHistory,
            event: hubPackWiringContext.event,
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: hubCarryOverMemory?.summary,
            eventPool,
            postPilotCatalog: hubPackWiringContext.postPilotCatalog,
          }),
          tomorrowRisk: tomorrowRiskPresentation.hub,
          carryOverSummary: hubCarryOverMemory?.summary,
          event: hubPackWiringContext.event,
          contentPackMeta: hubPackWiringContext.contentPackMeta,
          eventPool,
          postPilotCatalog: hubPackWiringContext.postPilotCatalog,
          operationSignals,
          socialPulse: {
            globalPulseScore: socialPulseState.globalPulseScore,
          },
          postPilotPhase: gameState.pilot.postPilotOperation?.phase,
          existingLines: [
            hubCarryOverMemory?.summary ?? '',
            tomorrowRiskPresentation.hub?.mainLine ?? '',
            hubImpactExplanationLine ?? '',
          ].filter(Boolean),
        }),
      ),
    [
      decisionHistory,
      gameState.pilot.postPilotOperation?.phase,
      hubCarryOverMemory?.summary,
      hubDay,
      hubImpactExplanationLine,
      hubPackWiringContext.contentPackMeta,
      hubPackWiringContext.event,
      operationSignals,
      operationalResources,
      socialPulseState.globalPulseScore,
      tomorrowRiskPresentation.hub,
    ],
  );

  const contentPackActivation = useMemo(
    () =>
      buildContentRuntimeActivationSelection({
        day: hubDay,
        postPilotPhase: gameState.pilot.postPilotOperation?.phase,
        accessMode: deriveMainOperationAccessMode(gameState, monetization),
        operationSignals,
        focusDistrictId: operationSignals.priorityDistrictId,
        stableSeed: `${hubDay}|hub`,
      }),
    [gameState, hubDay, monetization, operationSignals],
  );

  const mainOperationFeel = useMemo(
    () =>
      buildMainOperationFeelFromStore({
        gameState,
        monetization,
        mainOperationSeason,
        operationSignals,
        postPilotOperation: postPilotOperation ?? undefined,
        tomorrowRisk: tomorrowRiskPresentation.hub,
        contentPackPresentationHint: contentPackActivation.model.presentationHint,
        cityEchoBinding: buildCityEchoBinding({
          day: hubDay,
          decisionImpact: buildDecisionImpactExplanationForHub({
            day: hubDay,
            recentDecisions: decisionHistory,
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: hubCarryOverMemory?.summary,
            event: hubPackWiringContext.event,
            eventPool,
            postPilotCatalog: hubPackWiringContext.postPilotCatalog,
          }),
          tomorrowRisk: tomorrowRiskPresentation.hub,
          carryOverSummary: hubCarryOverMemory?.summary,
          event: hubPackWiringContext.event,
          contentPackMeta: hubPackWiringContext.contentPackMeta,
          eventPool,
          postPilotCatalog: hubPackWiringContext.postPilotCatalog,
          operationSignals,
          socialPulse: {
            globalPulseScore: socialPulseState.globalPulseScore,
          },
          postPilotPhase: gameState.pilot.postPilotOperation?.phase,
          existingLines: [
            hubCarryOverMemory?.summary ?? '',
            tomorrowRiskPresentation.hub?.mainLine ?? '',
          ].filter(Boolean),
        }),
        existingLines: [
          showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
          tomorrowRiskPresentation.hub?.mainLine ?? '',
          cityEchoHubLine ?? '',
        ].filter(Boolean),
      }),
    [
      cityEchoHubLine,
      decisionHistory,
      gameState,
      hubCarryOverMemory?.summary,
      hubDay,
      mainOperationSeason,
      monetization,
      operationSignals,
      operationalResources,
      postPilotOperation,
      showHubCarryOver,
      socialPulseState.globalPulseScore,
      tomorrowRiskPresentation.hub,
      contentPackActivation.model.presentationHint,
    ],
  );

  const mainOperationFeelPresentation = useMemo(
    () => buildMainOperationFeelHubPresentation(mainOperationFeel),
    [mainOperationFeel],
  );

  const hubEceContextLine = useMemo(
    () =>
      buildMainOperationFeelEceLine(mainOperationFeel, [
        cityEchoHubLine ?? '',
        hubImpactExplanationLine ?? '',
        tomorrowRiskPresentation.hub?.mainLine ?? '',
      ].filter(Boolean)),
    [
      cityEchoHubLine,
      hubImpactExplanationLine,
      mainOperationFeel,
      tomorrowRiskPresentation.hub?.mainLine,
    ],
  );

  const hubCityJournalPresentation = useMemo(() => {
    const journalExistingLines = [
      showHubCarryOver ? hubCarryOverMemory?.summary ?? '' : '',
      showHubCarryOver ? hubCarryOverMemory?.detail ?? '' : '',
      hubImpactExplanationLine ?? '',
      tomorrowRiskPresentation.hub?.mainLine ?? '',
      cityEchoHubLine ?? '',
      mainOperationFeel?.scopeLine ?? '',
      mainOperationFeel?.reportLine ?? '',
    ].filter(Boolean);

    const model = buildCityJournalLiteModel({
      currentDay: hubDay,
      isPostPilot: hubDay >= 8,
      accessMode: deriveMainOperationAccessMode(gameState, monetization),
      postPilotPhase: gameState.pilot.postPilotOperation?.phase ?? null,
      carryOverMemory: hubCarryOverMemory ?? undefined,
      decisionImpact: buildDecisionImpactExplanationForHub({
        day: hubDay,
        recentDecisions: decisionHistory,
        event: hubPackWiringContext.event,
        operationSignals,
        resourceFatigue: operationalResources,
        carryOverSummary: hubCarryOverMemory?.summary,
        eventPool,
        postPilotCatalog: hubPackWiringContext.postPilotCatalog,
      }),
      tomorrowRisk: tomorrowRiskPresentation.hub ?? undefined,
      mainOperationFeel,
      contentPackMeta: hubPackWiringContext.contentPackMeta,
      operationSignals,
      resourceFatigue: operationalResources,
      socialPulse: {
        globalPulseScore: socialPulseState.globalPulseScore,
      },
      existingLines: journalExistingLines,
      cityArchive,
    });

    return buildCityJournalHubPresentation(model, journalExistingLines);
  }, [
    cityArchive,
    cityEchoHubLine,
    decisionHistory,
    gameState,
    hubCarryOverMemory,
    hubDay,
    hubImpactExplanationLine,
    hubPackWiringContext.contentPackMeta,
    hubPackWiringContext.event,
    mainOperationFeel,
    monetization,
    operationalResources,
    operationSignals,
    showHubCarryOver,
    socialPulseState.globalPulseScore,
    tomorrowRiskPresentation.hub,
  ]);

  const hubDistrictReportLine = useMemo(() => {
    const focusDistrictId =
      operationSignals.priorityDistrictId ??
      decisionHistory.filter((r) => r.day === hubDay - 1).at(-1)?.neighborhoodId;
    if (!focusDistrictId || hubDay <= 1) return null;

    const existingLines = [
      mainOperationFeelPresentation.scopeLine ?? mainOperationFeelPresentation.detailLine ?? '',
      tomorrowRiskPresentation.hub?.mainLine ?? '',
      cityEchoHubLine ?? '',
      hubCityJournalPresentation?.primaryLine ?? '',
    ].filter(Boolean);

    const model = buildDistrictReportCardFullModel({
      districtId: focusDistrictId,
      day: hubDay,
      isPostPilot: hubDay >= POST_PILOT_FIRST_OPERATION_DAY,
      postPilotPhase: gameState.pilot.postPilotOperation?.phase ?? null,
      operationSignals,
      resourceFatigue: operationalResources,
      contentPackMeta: hubPackWiringContext.contentPackMeta,
      cityArchive,
      advisorRelationshipLine: undefined,
      existingLines,
    });

    return buildDistrictReportCardSummaryForHub(model, existingLines);
  }, [
    cityArchive,
    cityEchoHubLine,
    decisionHistory,
    gameState.pilot.postPilotOperation?.phase,
    hubCityJournalPresentation?.primaryLine,
    hubDay,
    hubPackWiringContext.contentPackMeta,
    mainOperationFeelPresentation.scopeLine,
    mainOperationFeelPresentation.detailLine,
    operationSignals,
    operationalResources,
    tomorrowRiskPresentation.hub?.mainLine,
  ]);

  const hubStoryChainLine = useMemo(() => {
    if (hubDay <= 1) return null;
    const existingLines = [
      hubCityJournalPresentation?.primaryLine ?? '',
      tomorrowRiskPresentation.hub?.mainLine ?? '',
      cityEchoHubLine ?? '',
    ].filter(Boolean);
    const storyCandidate = buildPersistentStoryChainHubLine(cityArchive, hubDay, existingLines);
    const continuity = buildHubArchiveContinuityModel({
      day: hubDay,
      cityArchive,
      storyChainLine: storyCandidate,
      districtReportLine: hubDistrictReportLine,
      cityJournalLine: hubCityJournalPresentation?.primaryLine ?? null,
      existingLines,
    });
    if (continuity.continuityKind === 'story') return continuity.continuityLine ?? null;
    if (continuity.continuityKind === 'reward' || continuity.continuityKind === 'city_memory') {
      return continuity.continuityLine ?? null;
    }
    return null;
  }, [
    cityArchive,
    cityEchoHubLine,
    hubCityJournalPresentation?.primaryLine,
    hubDay,
    hubDistrictReportLine,
    tomorrowRiskPresentation.hub?.mainLine,
  ]);

  const { hubVehicleMaintenanceLine, hubTeamSpecializationLine } = useMemo(() => {
    const baseExistingLines = [
      hubStoryChainLine ?? '',
      hubCityJournalPresentation?.primaryLine ?? '',
      tomorrowRiskPresentation.hub?.mainLine ?? '',
      cityEchoHubLine ?? '',
    ].filter(Boolean);
    const rawVehicleLine = selectVehicleMaintenanceSurfaceLines(vehicleMaintenance, {
      day: hubDay,
      existingHubLines: baseExistingLines,
    }).hubLine;
    const existingLines = [...baseExistingLines, rawVehicleLine ?? ''].filter(Boolean);
    const pilotDay = gameState.pilot.currentPilotDay;
    const authorityState = gameState.pilot.authorityState;
    const hubDistrictExpansion = buildDistrictOperationUnlockBindingCompactSummary({
      currentDay: hubDay,
      pilotDay,
      authorityState,
      mainOperationSeason,
    });
    const hubAuthorityPermissionPreview = buildAuthorityPermissionPreviewCompactSummary({
      authorityState,
      day: pilotDay,
    });
    const showHubDistrictExpansion = hubDistrictExpansion.visible;
    const showHubAuthorityPreview =
      !showHubDistrictExpansion &&
      hubAuthorityPermissionPreview.visible &&
      Boolean(hubAuthorityPermissionPreview.nextPermissionLine);
    const hubBadgeShowcase = buildHubBadgeShowcaseSummary(gameState.pilot.badgeState, pilotDay);
    const showHubBadgeShowcase =
      hubBadgeShowcase.visible &&
      Number(showHubDistrictExpansion) + Number(showHubAuthorityPreview) < 2;
    const surfaces = selectTeamSpecializationSurfaceLines(teamSpecialization, {
      day: hubDay,
      existingHubLines: existingLines,
      hubDensityContext: {
        existingInsightLineCount: existingLines.length,
        hasActiveOperationInsight: Boolean(
          hubStoryChainLine || tomorrowRiskPresentation.hub?.mainLine || cityEchoHubLine,
        ),
        hasAuthorityPreview: showHubAuthorityPreview,
        hasBadgeShowcase: showHubBadgeShowcase,
        hasDistrictExpansion: showHubDistrictExpansion,
      },
      vehicleMaintenanceLine: rawVehicleLine ?? undefined,
      vehicleMaintenanceStrainActive: Boolean(
        rawVehicleLine &&
          (rawVehicleLine.toLocaleLowerCase('tr-TR').includes('yorgunluk') ||
            rawVehicleLine.toLocaleLowerCase('tr-TR').includes('bakım')),
      ),
    });
    if (surfaces.suppressVehicleMaintenanceLine && surfaces.mergedStrainLine) {
      return {
        hubVehicleMaintenanceLine: undefined,
        hubTeamSpecializationLine: surfaces.mergedStrainLine,
      };
    }
    return {
      hubVehicleMaintenanceLine: rawVehicleLine,
      hubTeamSpecializationLine: surfaces.hubLine,
    };
  }, [
    cityEchoHubLine,
    gameState.pilot.authorityState,
    gameState.pilot.badgeState,
    gameState.pilot.currentPilotDay,
    hubCityJournalPresentation?.primaryLine,
    hubDay,
    hubStoryChainLine,
    mainOperationSeason,
    teamSpecialization,
    tomorrowRiskPresentation.hub?.mainLine,
    vehicleMaintenance,
  ]);

  const hubDistrictReportContinuityLine = useMemo(() => {
    if (hubDay <= 1) return null;
    const existingLines = [
      hubCityJournalPresentation?.primaryLine ?? '',
      tomorrowRiskPresentation.hub?.mainLine ?? '',
      cityEchoHubLine ?? '',
    ].filter(Boolean);
    const continuity = buildHubArchiveContinuityModel({
      day: hubDay,
      cityArchive,
      districtReportLine: hubDistrictReportLine,
      cityJournalLine: hubCityJournalPresentation?.primaryLine ?? null,
      existingLines,
    });
    return continuity.continuityKind === 'district' ? continuity.continuityLine ?? null : null;
  }, [
    cityArchive,
    cityEchoHubLine,
    hubCityJournalPresentation?.primaryLine,
    hubDay,
    hubDistrictReportLine,
    tomorrowRiskPresentation.hub?.mainLine,
  ]);

  useEffect(() => {
    startScreenTiming('HubScreen', { day: hubDay, surface: 'hub' });
    breadcrumbHubScreenOpened({
      day: hubDay,
      phase: getAnalyticsAccessModeFromGameState(gameState, monetization),
    });

    if (mainOperationFeel && hubDay >= 8) {
      breadcrumbMainOperationFeelShown({ day: hubDay });
    }

    if (hubPackWiringContext.contentPackMeta?.packId) {
      breadcrumbContentPackEventShown({
        day: hubDay,
        packId: hubPackWiringContext.contentPackMeta.packId,
        familyId: hubPackWiringContext.contentPackMeta.familyId,
        eventId: hubPackWiringContext.event?.id,
      });
    }

    const base = buildCommonAnalyticsBase(gameState, 'hub', monetization);
    trackOncePerRuntime(`day_started:${hubDay}`, 'day_started', base);

    if (hubCardVisibility.showFirstDayGuide) {
      trackOncePerRuntime(`first_guide_seen:${hubDay}`, 'first_guide_seen', base, {
        isTutorial: true,
      });
    }

    if (hubCardVisibility.showDailyPlan !== 'hidden') {
      trackOncePerRuntime(`daily_plan_seen:${hubDay}`, 'daily_plan_seen', base);
    }

    if (hubCardVisibility.showOperationalResources) {
      trackOncePerRuntime(
        `operational_resources_card_seen:${hubDay}`,
        'operational_resources_card_seen',
        base,
        buildResourceAnalyticsPayload(operationalResources),
      );
    }

    if (hubCardVisibility.showMainOperationSeason) {
      trackOncePerRuntime(`season_goal_card_seen:${hubDay}`, 'season_goal_card_seen', base);
    }

    if (hubCardVisibility.showCrisis) {
      trackOncePerRuntime(
        `crisis_desk_seen:${hubDay}`,
        'crisis_desk_seen',
        base,
        buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
      );
    }
  }, [
    crisisState,
    gameState,
    hubCardVisibility.showCrisis,
    hubCardVisibility.showDailyPlan,
    hubCardVisibility.showFirstDayGuide,
    hubCardVisibility.showMainOperationSeason,
    hubCardVisibility.showOperationalResources,
    hubDay,
    hubPackWiringContext.contentPackMeta,
    hubPackWiringContext.event?.id,
    mainOperationFeel,
    monetization,
    operationalResources,
  ]);

  const { coachHint, dismissHint } = useOnboardingHint('hub');
  void hubLayoutModel;

  const centerHomePresentation = useMemo(
    () =>
      buildCenterHomePresentation({
        gameState,
        monetization,
        dailyGoalState,
        hubQuickActionState,
        operationSignals,
        socialPulseState,
        mainOperationFeelPresentation,
        hubEceContextLine,
        hubTomorrowRisk: tomorrowRiskPresentation.hub,
        hubImpactExplanationLine: cityEchoHubLine ?? hubImpactExplanationLine,
        hubCityJournal: hubCityJournalPresentation,
        hubDistrictReportLine: hubDistrictReportContinuityLine,
        hubStoryChainLine,
        hubVehicleMaintenanceLine,
        hubTeamSpecializationLine,
        cardVisibility: hubCardVisibility,
        economySource: gameStatus.source,
        budgetDeltaLabel: gameStatus.budgetDeltaLabel,
        playerLevel: gameStatus.level,
        selectedDistrictName: gameStatus.selectedDistrictName,
      }),
    [
      cityEchoHubLine,
      gameState,
      gameStatus.budgetDeltaLabel,
      gameStatus.level,
      gameStatus.selectedDistrictName,
      gameStatus.source,
      hubCardVisibility,
      hubCityJournalPresentation,
      hubDistrictReportContinuityLine,
      hubEceContextLine,
      hubImpactExplanationLine,
      hubQuickActionState,
      hubStoryChainLine,
      hubTeamSpecializationLine,
      hubVehicleMaintenanceLine,
      dailyGoalState,
      mainOperationFeelPresentation,
      monetization,
      operationSignals,
      socialPulseState,
      tomorrowRiskPresentation.hub,
    ],
  );

  return (
    <GameScreenShell
      scrollable={false}
      reserveTabBarInset={false}
      headerVariant="none"
      backgroundColor={gameUi.colors.backgroundCream}
      contentStyle={{ flex: 1, paddingHorizontal: 0, paddingTop: 0, gap: 0 }}>
      <HubReferenceHome
        presentation={centerHomePresentation}
        scrollFooter={
          __DEV__ && !hubCardVisibility.suppressDevTools ? <HubDevTools /> : undefined
        }
      />
      <TutorialCoachOverlay screen="hub" />
      {coachHint && !hubTutorialStep && tutorialActive ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
        />
      ) : null}
    </GameScreenShell>
  );
}
