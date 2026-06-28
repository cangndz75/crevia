import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
} from '@/features/events/utils/eventResultRevealPresentation';
import { buildPostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import {
  ResultAdvisorCommentCard,
  ResultCityReactionCard,
  ResultFinalActions,
  ResultImpactCardGrid,
  ResultOutcomeHero,
  ResultPlanContextStrip,
  ResultRevealItemCard,
} from '@/features/events/components/result/ResultRevealMotionSections';
import {
  selectActiveTutorialStepForScreen,
} from '@/features/tutorial/tutorialSelectors';
import { selectLastDecisionResult, useGameStore } from '@/store/useGameStore';
import { useGameStatus } from '@/store/gameSelectors';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { getTimeGreeting } from '@/core/utils/timeGreeting';
import {
  CreviaAnimatedCard,
  CreviaAnimatedChip,
  useCreviaReducedMotion,
} from '@/shared/motion';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { creviaAssets } from '@/core/assets/creviaAssets';

const municipalImage = creviaAssets.buildings.municipalHall3d;

const palette = {
  background: '#F7F1E6',
  card: '#FFFDF7',
  cardSoft: '#FDF8ED',
  tealDark: '#0E5F5B',
  teal: '#0F8F86',
  tealSoft: '#BDEFE7',
  green: '#4F9653',
  gold: '#D9AA2B',
  goldSoft: '#F2D479',
  textDark: '#183B3A',
  textMuted: '#6C7A78',
  border: 'rgba(20, 70, 66, 0.10)',
  white: '#FFFFFF',
} as const;

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

function PremiumResultHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Image source={municipalImage} style={styles.headerBgImage} contentFit="cover" />
      <View style={styles.headerShade} />
      <Pressable
        onPress={() => router.push('/profile' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Profili aç">
        <HeaderAvatar size={54} level={status.level} showLevelBadge />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerGreeting} numberOfLines={1}>
          {greeting.title}, {status.playerName} {greeting.emoji}
        </Text>
        <View style={styles.headerMetaRow}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.82)" />
          <Text style={styles.headerMeta} numberOfLines={1}>
            {status.currentDay}. Gün · Merkez · Sv.{status.level}
          </Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.headerChipRow}>
          <View style={styles.headerChip}>
            <Ionicons name="ellipse" size={10} color={palette.gold} />
            <Text style={styles.headerChipText} numberOfLines={1}>
              {status.sourceShort}
            </Text>
          </View>
          <View style={styles.headerChip}>
            <Ionicons name="star" size={11} color={palette.gold} />
            <Text style={styles.headerChipText} numberOfLines={1}>
              {status.xp}/{status.xpTarget}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtonRow}>
          <View style={[styles.headerRoundButton, styles.headerRoundActive]}>
            <Ionicons name="bar-chart" size={17} color={palette.tealDark} />
          </View>
          <View style={[styles.headerRoundButton, styles.headerRoundGhost]}>
            <Ionicons name="notifications-outline" size={17} color={palette.white} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function DecisionResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const snapshot = useGameStore(selectLastDecisionResult);
  const lastOperationPlanStrategyId = useGameStore((s) => s.lastOperationPlanStrategyId);
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
      }),
    [
      authorityProgressLine,
      currentDay,
      isDay1LearningEvent,
      isMissing,
      lastOperationPlanStrategyId,
      reducedMotion,
      relatedEvent,
      result,
      resultCarryOver?.summary,
      viewModel.actions.showSecondary,
    ],
  );

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

  const [visibleRevealCount, setVisibleRevealCount] = useState(0);

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
          { paddingBottom: scrollBottomPadding },
        ]}>
        <PremiumResultHeader />

        <Animated.View entering={FadeInUp.duration(260)} style={styles.resultShell}>
          <View style={styles.resultTop}>
            <View style={styles.resultTitleBlock}>
              <Text style={styles.pageTitle} numberOfLines={1}>
                {revealPresentation.title}
              </Text>
              <Text style={styles.taskLine} numberOfLines={1}>
                Görev: {revealPresentation.subtitle || result.eventTitle}
              </Text>
            </View>
            <Text style={styles.completedAt} numberOfLines={1}>
              Tamamlanma: 18:42
            </Text>
          </View>

          <View
            style={styles.revealSection}
            accessibilityLabel={revealPresentation.accessibilityLabel}>
            <ResultOutcomeHero
              outcome={revealPresentation.outcome}
              reducedMotion={reducedMotion}
            />

            {revealPresentation.selectedPlanContext ? (
              <ResultPlanContextStrip
                context={revealPresentation.selectedPlanContext}
                reducedMotion={reducedMotion}
              />
            ) : null}

            {cityReaction ? (
              <ResultCityReactionCard
                reaction={cityReaction}
                socialEcho={resultSocialEcho}
                reducedMotion={reducedMotion}
              />
            ) : null}

            <ResultImpactCardGrid
              cards={revealPresentation.impactCards}
              reducedMotion={reducedMotion}
            />

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
                <ResultFinalActions
                  actions={revealPresentation.finalActions}
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
    backgroundColor: palette.background,
  },
  scroll: {
    paddingBottom: 18,
  },
  header: {
    minHeight: 118,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: palette.tealDark,
    overflow: 'hidden',
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  headerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 54, 51, 0.24)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 10,
    gap: 6,
  },
  headerGreeting: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.white,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.80)',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  headerChipRow: {
    flexDirection: 'row',
    gap: 7,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 76,
    maxWidth: 84,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  headerChipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: palette.white,
  },
  headerButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerRoundButton: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRoundActive: {
    backgroundColor: '#FFF1B8',
  },
  headerRoundGhost: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  resultShell: {
    marginHorizontal: 14,
    marginTop: -8,
    backgroundColor: palette.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 12,
    ...softShadow,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  resultTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: palette.textDark,
  },
  taskLine: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color: palette.tealDark,
  },
  completedAt: {
    paddingTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
    flexShrink: 0,
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
