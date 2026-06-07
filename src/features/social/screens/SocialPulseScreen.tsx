import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAnalyticsAccessModeFromGameState } from '@/core/analytics/analyticsRuntime';
import { breadcrumbSocialPulseOpened } from '@/core/crashPerformance/crashBreadcrumbs';
import { startScreenTiming } from '@/core/crashPerformance/performanceLite';
import { resolveEventCardById } from '@/core/liveFlow/eventLifecycleEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import type { SocialQuickActionType } from '@/core/social/socialTypes';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import {
  selectLastDecisionResult,
  selectPostPilotOperation,
  selectSocialPulseStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { HotSocialTopicCard } from '../components/HotSocialTopicCard';
import { NeighborhoodSocialRiskStrip } from '../components/NeighborhoodSocialRiskStrip';
import { SocialActionButton } from '../components/SocialActionButton';
import { SocialDecisionEchoCard } from '../components/SocialDecisionEchoCard';
import { SocialMentionInlineList } from '../components/SocialMentionInlineList';
import { SocialNavHeader } from '../components/SocialNavHeader';
import { SocialOutcomeHistoryCard } from '../components/SocialOutcomeHistoryCard';
import { SocialPostPilotContextChip } from '../components/SocialPostPilotContextChip';
import { SocialPulseHeaderCard } from '../components/SocialPulseHeaderCard';
import { SocialTipBanner } from '../components/SocialTipBanner';
import { buildSocialPulseUiBundle } from '../utils/socialUiMappers';
import { buildSocialPulseScreenViewModel } from '../utils/socialPulsePresentation';

const QUICK_ACTION_BY_BUTTON: Record<string, SocialQuickActionType> = {
  explain: 'communicate',
  deploy: 'dispatch_team',
  silent: 'stay_silent',
};

const FEEDBACK_DISMISS_MS = 3500;

export function SocialPulseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const currentDay = gameState.city.day;
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const postPilotOperation = useGameStore(selectPostPilotOperation);
  const lastDecisionResult = useGameStore(selectLastDecisionResult);
  const eventPool = useGameStore((s) => s.eventPool);
  const activeEvents = useGameStore((s) => s.gameState.events);
  const operationSignals = useGameStore(
    (s) => s.operationSignals as OperationSignalsState,
  );
  const isDay1Compact = useGameStore(selectIsDay1TutorialEligible);
  const applySocialQuickAction = useGameStore((s) => s.applySocialQuickAction);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    startScreenTiming('SocialPulseScreen', { day: currentDay, surface: 'social' });
    breadcrumbSocialPulseOpened({
      day: currentDay,
      phase: getAnalyticsAccessModeFromGameState(gameState, monetization),
    });
  }, [currentDay, gameState, monetization]);

  const postPilotPhase = useMemo(() => {
    const normalized = normalizePostPilotOperationState(postPilotOperation, {
      pilotStatus,
      currentPilotDay: currentDay,
    });
    return normalized?.phase ?? null;
  }, [currentDay, pilotStatus, postPilotOperation]);

  const lastDecisionEvent = useMemo(
    () =>
      lastDecisionResult?.eventId
        ? resolveEventCardById(lastDecisionResult.eventId, activeEvents, eventPool)
        : undefined,
    [activeEvents, eventPool, lastDecisionResult?.eventId],
  );

  const viewModel = useMemo(
    () =>
      buildSocialPulseScreenViewModel({
        socialPulseState,
        currentDay,
        postPilotPhase,
        lastDecisionResult,
        lastDecisionEvent,
        eventPool,
        operationSignals,
        isDay1Compact,
      }),
    [
      currentDay,
      eventPool,
      isDay1Compact,
      lastDecisionEvent,
      lastDecisionResult,
      operationSignals,
      postPilotPhase,
      socialPulseState,
    ],
  );

  const outcomeBundle = useMemo(
    () => buildSocialPulseUiBundle(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );

  useEffect(() => {
    if (!actionFeedback) {
      return undefined;
    }
    const timer = setTimeout(() => setActionFeedback(null), FEEDBACK_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  const handleAction = useCallback(
    (actionId: string) => {
      const quickAction = QUICK_ACTION_BY_BUTTON[actionId];
      if (!quickAction) {
        return;
      }

      const result = applySocialQuickAction({
        topicId: viewModel.hotTopic.isMockFallback
          ? undefined
          : viewModel.hotTopic.topicId,
        action: quickAction,
        day: currentDay,
      });
      setActionFeedback(result.message);
    },
    [
      applySocialQuickAction,
      currentDay,
      viewModel.hotTopic.isMockFallback,
      viewModel.hotTopic.topicId,
    ],
  );

  return (
    <View style={styles.root}>
      <SocialNavHeader onBack={() => router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <SocialPulseHeaderCard model={viewModel.header} />

        {viewModel.postPilotContextLine ? (
          <SocialPostPilotContextChip line={viewModel.postPilotContextLine} />
        ) : null}

        <NeighborhoodSocialRiskStrip neighborhoods={viewModel.neighborhoods} />

        <View style={styles.hotSection}>
          <HotSocialTopicCard topic={viewModel.hotTopic} />

          {actionFeedback ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText} numberOfLines={2}>
                {actionFeedback}
              </Text>
            </View>
          ) : null}

          {viewModel.hotTopic.actions.length > 0 ? (
            <Animated.View entering={FadeInUp.delay(220).duration(320)} style={styles.actionsStack}>
              {viewModel.hotTopic.actions.map((action) => (
                <SocialActionButton
                  key={action.id}
                  action={action}
                  onPress={handleAction}
                />
              ))}
            </Animated.View>
          ) : null}
        </View>

        <SocialMentionInlineList
          model={viewModel.mentions}
          onViewAll={() => router.push('/social/mentions' as Href)}
        />

        {viewModel.decisionEcho ? (
          <SocialDecisionEchoCard
            echo={viewModel.decisionEcho}
            compact={viewModel.decisionEcho.visibility === 'compact'}
          />
        ) : null}

        {viewModel.showOutcomeHistory ? (
          <View style={styles.exploreSection}>
            <SocialOutcomeHistoryCard
              outcomes={outcomeBundle.outcomes}
              onPress={() => router.push('/social/outcome-history' as Href)}
            />
          </View>
        ) : null}

        <SocialTipBanner text={viewModel.tipLine} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  body: {
    gap: 14,
    paddingTop: spacing.sm,
  },
  hotSection: {
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  feedbackBanner: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 0,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 17,
    flexShrink: 1,
  },
  actionsStack: {
    gap: 8,
  },
  exploreSection: {
    paddingHorizontal: spacing.lg,
  },
});
