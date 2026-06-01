import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildEventResultAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackOncePerRuntime } from '@/core/analytics/analyticsRuntime';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import { PostPilotEventContextChip } from '@/features/events/components/PostPilotEventContextChip';
import { DecisionResultHeader } from '@/features/events/components/DecisionResultHeader';
import { EventResultFieldNoteCard } from '@/features/events/components/EventResultFieldNoteCard';
import { EventResultHeroCard } from '@/features/events/components/EventResultHeroCard';
import { EventResultImpactMetricsRow } from '@/features/events/components/EventResultImpactMetricsRow';
import {
  EventResultActionRows,
  EventResultInfoCard,
  EventResultProgressStrips,
} from '@/features/events/components/EventResultMetaFeedbackStrip';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { buildEventResultViewModel } from '@/features/events/utils/eventResultPresentation';
import { resolveEventResultHeroImage } from '@/features/events/utils/eventResultUiPresentation';
import {
  selectLastDailyReport,
  selectLastDecisionResult,
  useGameStore,
} from '@/store/useGameStore';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import { selectActiveTutorialStepForScreen } from '@/features/tutorial/tutorialSelectors';
import type { EventCard, SolvedEvent } from '@/core/models/EventCard';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import {
  buildResultCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver';
import {
  buildEventDomainResultFocus,
  shouldShowEventDomainFocus,
} from '@/core/events/eventDomainPresentation';
import {
  buildResourceFatiguePanelLine,
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import { buildFirstResultGuidanceModel } from '@/core/onboarding/onboardingPresentation';
import { EventCarryOverHintCard } from '@/features/events/components/EventCarryOverHintCard';
import { EventMapImpactSummaryCard } from '@/features/events/components/EventMapImpactSummaryCard';
import { buildMapBeforeAfterSummary } from '@/core/mapPresence';
import { EventDomainFocusStrip } from '@/features/events/components/EventDomainFocusStrip';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

function resolveEventForResult(
  snapshot: DecisionResultSnapshot,
  events: EventCard[],
  solvedEvents: SolvedEvent[],
): EventCard | null {
  if (!snapshot.eventId) {
    return null;
  }

  const active = events.find((event) => event.id === snapshot.eventId);
  if (active) {
    return active;
  }

  const solved = solvedEvents.find((event) => event.id === snapshot.eventId);
  if (!solved) {
    return null;
  }

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
  const snapshot = useGameStore(selectLastDecisionResult);
  const lastDailyReport = useGameStore(selectLastDailyReport);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const currentDay = gameState.city.day;
  const activeEvents = gameState.events;
  const solvedEvents = gameState.solvedEvents;
  const dailyGoalState = useGameStore((s) => s.dailyGoalState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const operationSignals = useGameStore((s) => s.operationSignals);

  const result = snapshot ?? createEmptyDecisionResultFallback();
  const isMissing = snapshot == null;

  const relatedEvent = useMemo(
    () => resolveEventForResult(result, activeEvents, solvedEvents),
    [activeEvents, result, solvedEvents],
  );

  useEffect(() => {
    if (isMissing || !result.eventId) return;
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

  const preferEndDay =
    !isMissing &&
    lastDailyReport != null &&
    lastDailyReport.day === currentDay &&
    activeEvents.length === 0;

  const dailyGoalProgress = useMemo(() => {
    const primary = selectPrimaryDailyGoal(dailyGoalState);
    if (!primary) {
      return null;
    }
    const total = dailyGoalState?.goals.length ?? 1;
    const current = dailyGoalState?.goals.filter((g) => g.isCompleted).length ?? 0;
    return { current: Math.max(current, primary.isCompleted ? 1 : 0), total: Math.max(total, 1) };
  }, [dailyGoalState]);

  const viewModel = useMemo(
    () =>
      buildEventResultViewModel(result, {
        event: relatedEvent,
        preferEndDayCta: preferEndDay,
        isFallback: isMissing,
        dailyGoalProgress,
      }),
    [dailyGoalProgress, isMissing, preferEndDay, relatedEvent, result],
  );

  const heroModel = useMemo(
    () => ({
      ...viewModel.hero,
      imageSource: resolveEventResultHeroImage(result, relatedEvent),
    }),
    [relatedEvent, result, viewModel.hero],
  );

  const goHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const goReports = useCallback(() => {
    router.push('/reports' as Href);
  }, [router]);

  const handlePrimaryCta = useCallback(() => {
    if (preferEndDay) {
      goReports();
      return;
    }
    goHub();
  }, [goHub, goReports, preferEndDay]);

  const legacyTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'decision_result'),
  );
  const { coachHint, dismissHint } = useOnboardingHint('decision_result');
  const isDay1Flow = useGameStore(selectIsDay1TutorialEligible);
  const isFirstTutorialResult =
    !!result.eventId && isDay1LearningEventId(result.eventId);
  const resultGuidance = buildFirstResultGuidanceModel(
    isDay1Flow,
    isFirstTutorialResult,
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

  const scrollBottomPadding = tabBarHeight + Math.max(insets.bottom, 8) + spacing.md;

  return (
    <View style={styles.root}>
      <DecisionResultHeader
        day={result.day}
        neighborhoodName={result.neighborhoodName}
        eventType={result.eventType}
        onClose={goHub}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: scrollBottomPadding },
        ]}>
        {isMissing ? (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>{result.summaryTitle}</Text>
            <Text style={styles.missingBody} numberOfLines={2}>
              {result.summaryText}
            </Text>
          </View>
        ) : (
          <>
            {viewModel.showPostPilotContext && relatedEvent ? (
              <Animated.View entering={FadeIn.duration(220)} style={styles.postPilotChip}>
                <PostPilotEventContextChip event={relatedEvent} />
              </Animated.View>
            ) : null}

            {resultGuidance.visible ? (
              <View style={styles.resultGuidance}>
                <OnboardingPhaseHint text={resultGuidance.line} />
              </View>
            ) : null}

            <Animated.View entering={FadeInUp.duration(300).springify().damping(22)}>
              <EventResultHeroCard model={heroModel} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).duration(280)}>
              <EventResultImpactMetricsRow rows={viewModel.impactRows} />
            </Animated.View>

            {showDomainResult ? (
              <Animated.View entering={FadeInUp.delay(100).duration(260)} style={styles.domainResult}>
                <EventDomainFocusStrip
                  model={{
                    ...domainResultFocus.model,
                    summary: domainResultFocus.echoLine ?? domainResultFocus.model.summary,
                  }}
                  surface="result"
                  compact
                />
              </Animated.View>
            ) : null}

            {showResultCarryOver && !showDomainResult ? (
              <Animated.View entering={FadeInUp.delay(110).duration(260)} style={styles.domainResult}>
                <EventCarryOverHintCard memory={resultCarryOver} compact />
              </Animated.View>
            ) : null}

            {resultFatigueState ? (
              <Animated.View entering={FadeInUp.delay(115).duration(260)} style={styles.fatigueChip}>
                <ResourceFatigueStateChip model={resultFatigueState} />
              </Animated.View>
            ) : null}

            {showMapBeforeAfter && mapBeforeAfterSummary?.impact ? (
              <Animated.View entering={FadeInUp.delay(118).duration(260)} style={styles.mapImpactCard}>
                <EventMapImpactSummaryCard
                  impact={mapBeforeAfterSummary.impact}
                  compact={(result.day ?? currentDay) <= 2}
                />
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInUp.delay(120).duration(280)}>
              <EventResultFieldNoteCard note={viewModel.fieldNote} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).duration(260)}>
              <EventResultProgressStrips strips={viewModel.progressStrips} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(170).duration(260)}>
              <EventResultInfoCard model={viewModel.infoCard} />
            </Animated.View>

            {result.butterflyHint ? (
              <Animated.View
                entering={FadeInUp.delay(190).duration(260)}
                style={[
                  styles.butterflyHintCard,
                  result.butterflyHint.tone === 'warning'
                    ? styles.butterflyHintWarning
                    : result.butterflyHint.tone === 'opportunity'
                      ? styles.butterflyHintOpportunity
                      : styles.butterflyHintInfo,
                ]}>
                <Text style={styles.butterflyHintTitle} numberOfLines={1}>
                  {result.butterflyHint.title}
                </Text>
                <Text style={styles.butterflyHintText} numberOfLines={2}>
                  {result.butterflyHint.text}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInUp.delay(210).duration(280)}>
              <EventResultActionRows
                primaryTitle={viewModel.actions.primaryTitle}
                primarySubtitle={viewModel.actions.primarySubtitle}
                secondaryTitle={viewModel.actions.secondaryTitle}
                secondarySubtitle={viewModel.actions.secondarySubtitle}
                showSecondary={viewModel.actions.showSecondary}
                onPrimaryPress={handlePrimaryCta}
                onSecondaryPress={goReports}
              />
            </Animated.View>
          </>
        )}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    paddingTop: 4,
    gap: 14,
  },
  postPilotChip: {
    marginHorizontal: 18,
    minWidth: 0,
  },
  resultGuidance: {
    marginHorizontal: 18,
    minWidth: 0,
    flexShrink: 1,
  },
  missingBox: {
    marginHorizontal: 18,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  missingBody: {
    fontSize: 14,
    color: eventDetail.textMuted,
    lineHeight: 20,
  },
  mapImpactCard: {
    marginHorizontal: 18,
    minWidth: 0,
    flexShrink: 1,
  },
  fatigueChip: {
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  domainResult: {
    marginTop: spacing.sm,
    minWidth: 0,
    flexShrink: 1,
  },
  butterflyHintCard: {
    marginHorizontal: 18,
    borderRadius: eventDetail.smallRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 4,
    minWidth: 0,
  },
  butterflyHintInfo: {
    backgroundColor: colors.secondaryMuted,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  butterflyHintWarning: {
    backgroundColor: colors.warningMuted,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  butterflyHintOpportunity: {
    backgroundColor: colors.successMuted,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  butterflyHintTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  butterflyHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textDark,
    lineHeight: 17,
  },
});
