import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildEventResultAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { buildAdvisorRelationshipResultPresentation } from '@/core/advisorRelationship';
import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildDecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import { buildRewardComebackResultPresentation } from '@/core/rewardComeback';
import { getEventAssignment } from '@/core/assignments/assignmentState';
import {
  buildResultCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver';
import {
  buildEventDomainResultFocus,
  shouldShowEventDomainFocus,
} from '@/core/events/eventDomainPresentation';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { buildMapBeforeAfterSummary } from '@/core/mapPresence';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { buildPostDecisionSocialEchoPresentation } from '@/core/socialEcho';
import { EventCarryOverHintCard } from '@/features/events/components/EventCarryOverHintCard';
import { EventDomainFocusStrip } from '@/features/events/components/EventDomainFocusStrip';
import { EventMapImpactSummaryCard } from '@/features/events/components/EventMapImpactSummaryCard';
import { EventResultImpactExplanationCard } from '@/features/events/components/EventResultImpactExplanationCard';
import { EventResultSystemsEchoStrip } from '@/features/events/components/result/EventResultSystemsEchoStrip';
import {
  buildResourceFatiguePanelLine,
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import {
  getAnalyticsAccessModeFromGameState,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { breadcrumbDecisionResultOpened } from '@/core/crashPerformance/crashBreadcrumbs';
import { startScreenTiming } from '@/core/crashPerformance/performanceLite';
import type { EventCard, SolvedEvent } from '@/core/models/EventCard';
import type {
  DecisionMetricChange,
  DecisionResultSnapshot,
} from '@/features/events/types/decisionResultTypes';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { buildEventResultViewModel } from '@/features/events/utils/eventResultPresentation';
import {
  buildEventResultRevealPresentation,
  type EventResultAction,
  type EventResultSecondaryAction,
} from '@/features/events/utils/eventResultRevealPresentation';
import { buildPostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import {
  ResultAdvisorCommentCard,
  ResultCityImpactGrid,
  ResultDistrictReactionCard,
  ResultFinalActions,
  ResultOutcomeHero,
  ResultPhaseHeader,
  ResultPhaseHeading,
  ResultReportBridgeCard,
  ResultResourceCostCard,
  ResultRevealItemCard,
  ResultSecondaryActionsRow,
  ResultSelectedPlanOutcomeCard,
} from '@/features/events/components/result/ResultRevealMotionSections';
import { OperationPhaseBridgeCard } from '@/features/events/components/event-workflow/OperationPhaseBridgeCard';
import { OperationPhaseProgressRail } from '@/features/events/components/event-workflow/OperationPhaseProgressRail';
import { selectLastDecisionResult, useGameStore } from '@/store/useGameStore';
import { useGameStatus } from '@/store/gameSelectors';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { buildMaintenanceActionResultPresentation } from '@/core/maintenanceBacklog';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  CreviaAnimatedCard,
  CreviaAnimatedChip,
  useCreviaReducedMotion,
} from '@/shared/motion';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import {
  selectActiveTutorialStepForScreen,
} from '@/features/tutorial/tutorialSelectors';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

function resolveEventForResult(
  snapshot: DecisionResultSnapshot,
  events: EventCard[],
  solvedEvents: SolvedEvent[],
  eventPool: EventCard[] = [],
): EventCard | null {
  if (!snapshot.eventId) return null;
  const active = events.find((event) => event.id === snapshot.eventId);
  if (active) return active;
  const pooled = eventPool.find((event) => event.id === snapshot.eventId);
  if (pooled) return pooled;
  const solved = solvedEvents.find((event) => event.id === snapshot.eventId);
  if (!solved) return null;

  return {
    id: solved.id,
    title: solved.title,
    category: snapshot.eventType ?? 'operations',
    riskLevel: 'medium',
    district: snapshot.neighborhoodName ?? 'Merkez',
    neighborhoodId: snapshot.neighborhoodId,
    description: snapshot.summaryText,
    contextTag: '',
    urgencyHours: 4,
    day: snapshot.day,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
  };
}

export function DecisionResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const gameStatus = useGameStatus();
  const snapshot = useGameStore(selectLastDecisionResult);
  const lastOperationPlanStrategyId = useGameStore((s) => s.lastOperationPlanStrategyId);
  const maintenanceBacklogRuntime = useGameStore((s) => s.maintenanceBacklogRuntime);
  const applyMaintenanceAction = useGameStore((s) => s.applyMaintenanceAction);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const activeEvents = gameState.events;
  const solvedEvents = gameState.solvedEvents;
  const eventPool = useGameStore((s) => s.eventPool);
  const currentDay = gameState.city.day;
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const crisisState = useGameStore((s) => s.crisisState);
  const assignments = useGameStore((s) => s.assignments);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const reducedMotion = useCreviaReducedMotion();

  const result = snapshot ?? createEmptyDecisionResultFallback();
  const isMissing = snapshot == null;

  const relatedEvent = useMemo(
    () => resolveEventForResult(result, activeEvents, solvedEvents, eventPool),
    [activeEvents, eventPool, result, solvedEvents],
  );

  useEffect(() => {
    if (isMissing || !result.eventId) return;
    startScreenTiming('DecisionResultScreen', { day: currentDay, surface: 'result' });
    breadcrumbDecisionResultOpened({
      day: currentDay,
      eventId: result.eventId,
      phase: getAnalyticsAccessModeFromGameState(gameState, monetization),
    });
    trackOncePerRuntime(
      `event_completed:${result.eventId}`,
      'event_completed',
      buildEventResultAnalyticsPayload(
        relatedEvent,
        result.resultTone,
        gameState,
        monetization,
      ),
    );
  }, [gameState, isMissing, monetization, relatedEvent, result.eventId, result.resultTone]);

  const viewModel = useMemo(
    () =>
      buildEventResultViewModel(result, {
        event: relatedEvent,
        isFallback: isMissing,
      }),
    [isMissing, relatedEvent, result],
  );

  const domainResultFocus = useMemo(() => {
    if (!relatedEvent) return null;
    const satisfactionDelta = result.metricChanges.find((m) =>
      m.label.toLowerCase().includes('memnun'),
    )?.delta;
    const riskDelta = result.metricChanges.find((m) =>
      m.label.toLowerCase().includes('risk'),
    )?.delta;
    return buildEventDomainResultFocus(
      relatedEvent,
      {
        publicSatisfactionDelta: satisfactionDelta,
        riskDelta: riskDelta,
        successLabel: result.summaryTitle,
        tone: result.resultTone,
      },
      result.day ?? currentDay,
    );
  }, [currentDay, relatedEvent, result]);

  const showDomainResult =
    domainResultFocus &&
    shouldShowEventDomainFocus(
      result.day ?? currentDay,
      'result',
      domainResultFocus.model.focus,
    );

  const resultCarryOver = useMemo(() => {
    return buildResultCarryOverMemory({
      day: result.day ?? currentDay,
      currentEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
        neighborhoodName: result.neighborhoodName,
        eventId: result.eventId,
      },
      suppressEchoDuplicate: Boolean(showDomainResult && domainResultFocus?.echoLine),
    });
  }, [
    currentDay,
    domainResultFocus?.echoLine,
    relatedEvent,
    result,
    showDomainResult,
  ]);

  const showResultCarryOver =
    resultCarryOver?.visible &&
    shouldShowCarryOverMemory(result.day ?? currentDay, 'result', {
      day: result.day ?? currentDay,
      currentEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
      },
      suppressEchoDuplicate: Boolean(showDomainResult && domainResultFocus?.echoLine),
    });

  const impactExplanation = useMemo(
    () =>
      buildDecisionImpactExplanation({
        snapshot: result,
        event: relatedEvent,
        day: result.day ?? currentDay,
        operationSignals,
        resourceFatigue: operationalResources,
        carryOverSummary: resultCarryOver?.summary,
        eventPool,
      }),
    [
      currentDay,
      eventPool,
      operationalResources,
      operationSignals,
      relatedEvent,
      result,
      resultCarryOver?.summary,
    ],
  );

  const advisorRelationshipResult = useMemo(() => {
    const day = result.day ?? currentDay;
    if (day <= 1) return null;
    const existingLines = [
      impactExplanation?.mainLine ?? '',
      resultCarryOver?.summary ?? '',
      domainResultFocus?.echoLine ?? '',
      result.summaryText ?? '',
      viewModel.fieldNote,
    ].filter(Boolean);
    return buildAdvisorRelationshipResultPresentation({
      day,
      surface: 'result',
      snapshot: result,
      decisionImpact: impactExplanation,
      operationSignals,
      resourceFatigue:
        operationSignals.vehicles?.status === 'strained' ||
        operationSignals.vehicles?.status === 'critical'
          ? { domain: 'vehicle', state: operationSignals.vehicles.status }
          : null,
      existingLines,
    });
  }, [
    currentDay,
    domainResultFocus?.echoLine,
    impactExplanation,
    operationalResources,
    operationSignals,
    result,
    resultCarryOver?.summary,
    viewModel.fieldNote,
  ]);

  const rewardComebackResult = useMemo(() => {
    const day = result.day ?? currentDay;
    if (day <= 1) return null;
    const packMeta = resolveContentPackMetaForWiring({
      event: relatedEvent ?? undefined,
      eventId: result.eventId,
      districtId: result.neighborhoodId,
      day,
      eventPool,
    });
    const existingLines = [
      impactExplanation?.mainLine ?? '',
      advisorRelationshipResult?.resultLine ?? '',
      resultCarryOver?.summary ?? '',
      domainResultFocus?.echoLine ?? '',
      result.summaryText ?? '',
    ].filter(Boolean);
    return buildRewardComebackResultPresentation({
      day,
      surface: 'result',
      snapshot: result,
      eventId: result.eventId,
      decisionImpact: impactExplanation,
      advisorRelationship: advisorRelationshipResult?.model,
      carryOverMemory: resultCarryOver ?? null,
      contentPackMeta: packMeta,
      operationSignals,
      existingLines,
    });
  }, [
    advisorRelationshipResult?.model,
    advisorRelationshipResult?.resultLine,
    currentDay,
    domainResultFocus?.echoLine,
    eventPool,
    impactExplanation,
    operationSignals,
    relatedEvent,
    result,
    resultCarryOver,
  ]);

  const mapBeforeAfterSummary = useMemo(() => {
    if (isMissing) return null;
    const day = result.day ?? currentDay;
    const existingLines: string[] = [];
    if (domainResultFocus?.echoLine) existingLines.push(domainResultFocus.echoLine);
    if (resultCarryOver?.summary) existingLines.push(resultCarryOver.summary);
    if (result.summaryText) existingLines.push(result.summaryText);

    return buildMapBeforeAfterSummary({
      day,
      surface: 'result',
      activeEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
        neighborhoodName: result.neighborhoodName,
        eventId: result.eventId,
      },
      eventDomainFocus: domainResultFocus?.model
        ? {
            focus: domainResultFocus.model.focus,
            reportEchoLine: domainResultFocus.echoLine ?? undefined,
            summary: domainResultFocus.model.summary,
          }
        : null,
      carryOverMemory: resultCarryOver
        ? {
            domain: resultCarryOver.domain,
            summary: resultCarryOver.summary,
            resolved: resultCarryOver.direction === 'positive_memory',
          }
        : null,
    });
  }, [
    currentDay,
    domainResultFocus?.echoLine,
    domainResultFocus?.model,
    isMissing,
    relatedEvent,
    result,
    resultCarryOver,
  ]);

  const showMapBeforeAfter =
    (result.day ?? currentDay) > 1 &&
    mapBeforeAfterSummary?.impact?.visible === true;

  const resultFatigueState = useMemo(() => {
    if (!relatedEvent || isMissing) return null;
    const domain = inferResourceDomainFromEventFocus(domainResultFocus?.model.focus);
    const primary = buildResourceFatigueVisualSummary({
      day: result.day ?? currentDay,
      surface: 'result',
      domain,
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        overall: { status: operationSignals.overall.status },
      },
      activeEvent: relatedEvent,
      eventDomainFocus: domainResultFocus?.model,
    }).primaryState;
    if (!primary) return null;
    const line = buildResourceFatiguePanelLine(primary);
    if (resultCarryOver?.summary && resultCarryOver.summary.length > 12) {
      if (line.toLowerCase().includes(resultCarryOver.summary.slice(0, 18).toLowerCase())) {
        return null;
      }
    }
    return primary;
  }, [
    currentDay,
    domainResultFocus?.model,
    isMissing,
    operationalResources,
    operationSignals,
    relatedEvent,
    result.day,
    resultCarryOver?.summary,
  ]);

  const resultSystemsEcho = useMemo(() => {
    if (isMissing) return null;
    const day = result.day ?? currentDay;
    const existingEchoLines: string[] = [];
    if (domainResultFocus?.echoLine) existingEchoLines.push(domainResultFocus.echoLine);
    if (resultCarryOver?.summary) existingEchoLines.push(resultCarryOver.summary);
    if (mapBeforeAfterSummary?.impact?.summary) {
      existingEchoLines.push(mapBeforeAfterSummary.impact.summary);
    }

    const assignment = result.eventId
      ? getEventAssignment(assignments, result.eventId)
      : undefined;

    return buildEventResultSystemsEchoModel({
      snapshot: result,
      event: relatedEvent ?? undefined,
      day,
      districtId: result.neighborhoodId ?? relatedEvent?.neighborhoodId,
      operationSignals,
      resourceFatigue: operationalResources,
      crisisState,
      rankKey: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      isPostPilot: day >= POST_PILOT_FIRST_OPERATION_DAY,
      isPilotCompleted: pilotStatus === 'completed',
      existingEchoLines,
      carryOverSummary: resultCarryOver?.summary,
      mapImpactSummary: mapBeforeAfterSummary?.impact?.summary,
      activeTaskRouteContext: {
        day,
        activeEvent: relatedEvent ?? undefined,
        assignment,
        operationSignals,
        operationalResources,
        crisisState,
        isResultPhase: true,
        eventPhase: 'result',
        rankKey: authorityState?.formalRankId,
        unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      },
    });
  }, [
    assignments,
    authorityState?.formalRankId,
    authorityState?.unlockedPermissionIds,
    crisisState,
    currentDay,
    domainResultFocus?.echoLine,
    isMissing,
    mapBeforeAfterSummary?.impact?.summary,
    operationalResources,
    operationSignals,
    pilotStatus,
    relatedEvent,
    result,
    resultCarryOver?.summary,
  ]);
  const resultSystemsAnalyticsContext = useMemo(
    () => {
      const day = result.day ?? currentDay;
      return {
        day,
        rankId: authorityState?.formalRankId,
        isPostPilot: day >= POST_PILOT_FIRST_OPERATION_DAY,
        source: 'decision_result_systems_echo',
      };
    },
    [authorityState?.formalRankId, currentDay, result.day],
  );

  const isDay1LearningEvent = (result.day ?? currentDay) <= 1;

  const authorityProgressLine = useMemo(() => {
    const highlight = result.highlightLines.find((line) =>
      /yetki|rozet|seviye/i.test(line),
    );
    return highlight ?? null;
  }, [result.highlightLines]);

  const cityReaction = useMemo(
    () => buildPostDecisionCityReactionPresentation(isMissing ? null : result),
    [isMissing, result],
  );

  const resultSocialEcho = useMemo(
    () =>
      buildPostDecisionSocialEchoPresentation({
        cityReaction,
        surface: 'result',
        day: result.day ?? currentDay,
        excludeMessages: [cityReaction?.shortSummary ?? ''],
      }),
    [cityReaction, currentDay, result.day],
  );

  const revealPresentation = useMemo(
    () =>
      buildEventResultRevealPresentation({
        snapshot: result,
        event: relatedEvent,
        isFallback: isMissing,
        isDay1LearningEvent,
        day: result.day ?? currentDay,
        selectedPlanStrategyId: lastOperationPlanStrategyId,
        carryOverSummary: resultCarryOver?.summary ?? null,
        authorityProgressLine,
        showNextDayAction: viewModel.actions.showSecondary,
        reducedMotion,
        cityReaction,
        socialEcho: resultSocialEcho,
        maintenanceBacklogRuntime,
      }),
    [
      authorityProgressLine,
      cityReaction,
      currentDay,
      isDay1LearningEvent,
      isMissing,
      lastOperationPlanStrategyId,
      maintenanceBacklogRuntime,
      reducedMotion,
      relatedEvent,
      result,
      resultCarryOver?.summary,
      resultSocialEcho,
      viewModel.actions.showSecondary,
    ],
  );

  const [visibleRevealCount, setVisibleRevealCount] = useState(0);
  const [maintenanceActionFeedback, setMaintenanceActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const itemCount = revealPresentation.revealItems.length;
    if (reducedMotion) {
      setVisibleRevealCount(itemCount);
      return;
    }

    setVisibleRevealCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stagger = revealPresentation.revealStaggerMs;

    for (let index = 0; index < itemCount; index += 1) {
      const timer = setTimeout(() => {
        setVisibleRevealCount(index + 1);
      }, stagger * (index + 1));
      timers.push(timer);
    }

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [
    reducedMotion,
    revealPresentation.revealItems.length,
    revealPresentation.revealStaggerMs,
  ]);

  const goHub = useCallback(() => {
    playLightImpactHaptic();
    router.replace('/');
  }, [router]);

  const goReports = useCallback(() => {
    playLightImpactHaptic();
    router.push('/reports' as Href);
  }, [router]);

  const handleResultAction = useCallback(
    (action: EventResultAction) => {
      if (!action.enabled) return;
      switch (action.id) {
        case 'back_to_hub':
          goHub();
          break;
        case 'open_report':
          goReports();
          break;
        case 'view_authority':
          router.push('/profile' as Href);
          break;
        default:
          break;
      }
    },
    [goHub, goReports, router],
  );

  const handleSecondaryAction = useCallback(
    (action: EventResultSecondaryAction) => {
      if (!action.enabled) return;
      playLightImpactHaptic();
      switch (action.id) {
        case 'view_map':
          router.push('/map' as Href);
          break;
        case 'view_recent_impact':
          router.replace('/' as Href);
          break;
        case 'open_note':
          break;
        default:
          break;
      }
    },
    [router],
  );

  const handleMaintenanceAction = useCallback(() => {
    const action = revealPresentation.resourceCost.maintenanceAction;
    if (!action?.enabled) return;
    const applied = applyMaintenanceAction(action.itemId, action.actionKind);
    if (!applied) return;
    const updatedRuntime = useGameStore.getState().maintenanceBacklogRuntime;
    const item = updatedRuntime.items.find((entry) => entry.id === action.itemId);
    if (!item) return;
    const result = buildMaintenanceActionResultPresentation(item, action.actionKind);
    setMaintenanceActionFeedback(result.description);
  }, [applyMaintenanceAction, revealPresentation.resourceCost.maintenanceAction]);

  const legacyTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'decision_result'),
  );
  const { coachHint, dismissHint } = useOnboardingHint('decision_result');
  const scrollBottomPadding = tabBarHeight + Math.max(insets.bottom, 8) + 18;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 4, paddingBottom: scrollBottomPadding },
        ]}>
        <ResultPhaseHeader
          title={revealPresentation.phaseTransition.shell.title}
          subtitle={revealPresentation.phaseTransition.shell.subtitle}
          sourceShort={gameStatus.sourceShort}
          xpLabel={`${gameStatus.xp}/${gameStatus.xpTarget}`}
        />

        <OperationPhaseProgressRail
          progress={revealPresentation.phaseTransition.progress}
          reducedMotion={reducedMotion}
        />

        <Animated.View entering={FadeInUp.duration(260)} style={styles.resultShell}>
          <ResultPhaseHeading
            heading={revealPresentation.phaseHeading}
            description={revealPresentation.phaseDescription}
          />

          {revealPresentation.phaseTransition.bridge ? (
            <OperationPhaseBridgeCard
              bridge={revealPresentation.phaseTransition.bridge}
              reducedMotion={reducedMotion}
              index={1}
            />
          ) : null}

          <View
            style={styles.revealSection}
            accessibilityLabel={revealPresentation.accessibilityLabel}>
            <ResultOutcomeHero
              outcome={revealPresentation.outcome}
              reducedMotion={reducedMotion}
            />

            <ResultCityImpactGrid
              section={revealPresentation.cityImpact}
              reducedMotion={reducedMotion}
            />

            {revealPresentation.districtReaction ? (
              <ResultDistrictReactionCard
                reaction={revealPresentation.districtReaction}
                reducedMotion={reducedMotion}
              />
            ) : null}

            <ResultResourceCostCard
              section={revealPresentation.resourceCost}
              reducedMotion={reducedMotion}
              onMaintenanceAction={handleMaintenanceAction}
              maintenanceActionFeedback={maintenanceActionFeedback}
            />

            {revealPresentation.selectedPlanOutcome ? (
              <ResultSelectedPlanOutcomeCard
                outcome={revealPresentation.selectedPlanOutcome}
                reducedMotion={reducedMotion}
              />
            ) : null}

            <View style={styles.revealList}>
              {revealPresentation.revealItems
                .slice(0, visibleRevealCount)
                .map((item, index) => (
                  <ResultRevealItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    reducedMotion={reducedMotion}
                  />
                ))}
            </View>

            {visibleRevealCount >= revealPresentation.revealItems.length ? (
              <>
                <ResultAdvisorCommentCard
                  comment={revealPresentation.advisorComment}
                  reducedMotion={reducedMotion}
                />
                <ResultReportBridgeCard
                  bridge={revealPresentation.reportBridge}
                  reducedMotion={reducedMotion}
                />
                <ResultSecondaryActionsRow
                  actions={revealPresentation.secondaryActions}
                  onAction={handleSecondaryAction}
                  reducedMotion={reducedMotion}
                />
                <ResultFinalActions
                  primary={revealPresentation.primaryCta}
                  secondary={revealPresentation.finalActions.slice(1)}
                  onAction={handleResultAction}
                  reducedMotion={reducedMotion}
                />
              </>
            ) : null}
          </View>

          <CreviaAnimatedCard
            surface="decision_result"
            index={1}
            day={result.day ?? currentDay}
            reducedMotion={reducedMotion}
            motionKind="card_enter">
            <EventResultImpactExplanationCard explanation={impactExplanation} compact />
          </CreviaAnimatedCard>

          {showDomainResult ? (
            <EventDomainFocusStrip
              model={{
                ...domainResultFocus.model,
                summary: domainResultFocus.echoLine ?? domainResultFocus.model.summary,
              }}
              surface="result"
              compact
            />
          ) : null}

          {showResultCarryOver && !showDomainResult ? (
            <EventCarryOverHintCard memory={resultCarryOver} compact />
          ) : null}

          {resultFatigueState ? (
            <View style={styles.fatigueChipRow}>
              <ResourceFatigueStateChip model={resultFatigueState} />
            </View>
          ) : null}

          {resultSystemsEcho?.visible ? (
            <EventResultSystemsEchoStrip
              model={resultSystemsEcho}
              analyticsContext={resultSystemsAnalyticsContext}
            />
          ) : null}

          {showMapBeforeAfter && mapBeforeAfterSummary?.impact ? (
            <EventMapImpactSummaryCard
              impact={mapBeforeAfterSummary.impact}
              compact={(result.day ?? currentDay) <= 2}
            />
          ) : null}

          {rewardComebackResult?.visible && rewardComebackResult.resultLine ? (
            <CreviaAnimatedChip
              surface="decision_result"
              index={2}
              reducedMotion={reducedMotion}
              style={styles.rewardComebackChip}
              tone="success">
              <Text style={styles.rewardComebackChipLabel} numberOfLines={1}>
                {rewardComebackResult.label ?? 'Olumlu iz'}
              </Text>
              <Text
                style={styles.rewardComebackChipBody}
                numberOfLines={2}
                ellipsizeMode="tail">
                {rewardComebackResult.resultLine}
              </Text>
            </CreviaAnimatedChip>
          ) : null}
        </Animated.View>
      </ScrollView>

      <TutorialCoachOverlay
        screen="decision_result"
        bottomOffset={tabBarHeight + 16}
      />
      {coachHint && !legacyTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
          bottomOffset={tabBarHeight + 16}
        />
      ) : null}
    </View>
  );
}

const softShadow = {
  shadowColor: '#253A37',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  resultShell: {
    backgroundColor: eventDetail.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 14,
    gap: 12,
    ...softShadow,
  },
  revealSection: {
    gap: 12,
    minWidth: 0,
  },
  revealList: {
    gap: 8,
    minWidth: 0,
  },
  rewardComebackChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 107, 94, 0.18)',
    backgroundColor: '#F4FBF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    minWidth: 0,
    flexShrink: 1,
  },
  rewardComebackChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F6B5E',
    flexShrink: 1,
  },
  rewardComebackChipBody: {
    fontSize: 12,
    lineHeight: 17,
    color: '#2A5C56',
    flexShrink: 1,
  },
  fatigueChipRow: {
    minWidth: 0,
    flexShrink: 1,
  },
});
