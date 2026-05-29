import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostPilotEventContextChip } from '@/features/events/components/PostPilotEventContextChip';
import { DecisionResultActionBar } from '@/features/events/components/DecisionResultActionBar';
import { DecisionResultHeader } from '@/features/events/components/DecisionResultHeader';
import { EventResultFieldNoteCard } from '@/features/events/components/EventResultFieldNoteCard';
import { EventResultHeroCard } from '@/features/events/components/EventResultHeroCard';
import { EventResultImpactMetricsRow } from '@/features/events/components/EventResultImpactMetricsRow';
import { EventResultMetaFeedbackStrip } from '@/features/events/components/EventResultMetaFeedbackStrip';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { buildEventResultViewModel } from '@/features/events/utils/eventResultPresentation';
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
  const snapshot = useGameStore(selectLastDecisionResult);
  const lastDailyReport = useGameStore(selectLastDailyReport);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const activeEvents = useGameStore((s) => s.gameState.events);
  const solvedEvents = useGameStore((s) => s.gameState.solvedEvents);

  const result = snapshot ?? createEmptyDecisionResultFallback();
  const isMissing = snapshot == null;

  const relatedEvent = useMemo(
    () => resolveEventForResult(result, activeEvents, solvedEvents),
    [activeEvents, result, solvedEvents],
  );

  const preferEndDay =
    !isMissing &&
    lastDailyReport != null &&
    lastDailyReport.day === currentDay &&
    activeEvents.length === 0;

  const viewModel = useMemo(
    () =>
      buildEventResultViewModel(result, {
        event: relatedEvent,
        preferEndDayCta: preferEndDay,
        isFallback: isMissing,
      }),
    [isMissing, preferEndDay, relatedEvent, result],
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
        contentContainerStyle={styles.scroll}>
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
              <Animated.View entering={FadeIn.duration(220)}>
                <PostPilotEventContextChip event={relatedEvent} />
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInUp.duration(300).springify().damping(22)}>
              <EventResultHeroCard model={viewModel.hero} />
              {viewModel.districtContextLine ? (
                <Text style={styles.districtContext} numberOfLines={1}>
                  {viewModel.districtContextLine}
                </Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).duration(280)}>
              <EventResultImpactMetricsRow metrics={viewModel.metrics} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(120).duration(280)}>
              <EventResultFieldNoteCard note={viewModel.fieldNote} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).duration(260)}>
              <EventResultMetaFeedbackStrip lines={viewModel.metaLines} />
            </Animated.View>

            {result.butterflyHint ? (
              <Animated.View
                entering={FadeInUp.delay(180).duration(260)}
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
          </>
        )}
      </ScrollView>

      <DecisionResultActionBar
        primaryLabel={viewModel.nextStep.primaryCtaLabel}
        onPrimaryPress={handlePrimaryCta}
        onGoHub={goHub}
      />
      <TutorialCoachOverlay
        screen="decision_result"
        bottomOffset={Math.max(insets.bottom, 12) + 88}
      />
      {coachHint && !legacyTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
          bottomOffset={Math.max(insets.bottom, 12) + 88}
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
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 4,
    paddingBottom: spacing.xl,
    gap: 12,
  },
  missingBox: {
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
  districtContext: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 15,
    flexShrink: 1,
    minWidth: 0,
  },
  butterflyHintCard: {
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
