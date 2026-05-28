import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SocialQuickActionType } from '@/core/social/socialTypes';
import {
  selectSocialPulseStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { HotSocialTopicCard } from '../components/HotSocialTopicCard';
import { NeighborhoodSocialRiskStrip } from '../components/NeighborhoodSocialRiskStrip';
import { SocialActionButton } from '../components/SocialActionButton';
import { SocialLiveMentionsCard } from '../components/SocialLiveMentionsCard';
import { SocialNavHeader } from '../components/SocialNavHeader';
import { SocialOutcomeHistoryCard } from '../components/SocialOutcomeHistoryCard';
import { SocialPulseSummaryCard } from '../components/SocialPulseSummaryCard';
import { buildSocialPulseUiBundle } from '../utils/socialUiMappers';
import { MOCK_SOCIAL_PULSE } from '../utils/socialUiModel';

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
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const applySocialQuickAction = useGameStore((s) => s.applySocialQuickAction);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const {
    summary,
    neighborhoods,
    outcomes,
    mentions,
    activeMentionCount,
    hotTopic,
  } = useMemo(
    () => buildSocialPulseUiBundle(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );

  const mockActions = MOCK_SOCIAL_PULSE.hotTopic.actions;

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
        topicId: hotTopic.isMockFallback ? undefined : hotTopic.topicId,
        action: quickAction,
        day: currentDay,
      });
      setActionFeedback(result.message);
    },
    [applySocialQuickAction, currentDay, hotTopic.isMockFallback, hotTopic.topicId],
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
        <SocialPulseSummaryCard data={summary} />

        <NeighborhoodSocialRiskStrip neighborhoods={neighborhoods} />

        <View style={styles.crisisSection}>
          <HotSocialTopicCard topic={hotTopic} />

          {actionFeedback ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText} numberOfLines={3}>
                {actionFeedback}
              </Text>
            </View>
          ) : null}

          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={styles.actionsStack}>
            {mockActions.slice(0, 2).map((action) => (
              <SocialActionButton
                key={action.id}
                action={action}
                onPress={handleAction}
              />
            ))}
          </Animated.View>
        </View>

        <View style={styles.exploreSection}>
          <SocialOutcomeHistoryCard
            outcomes={outcomes}
            onPress={() => router.push('/social/outcome-history' as Href)}
          />
          <SocialLiveMentionsCard
            mentions={mentions}
            activeMentionCount={activeMentionCount}
            onPress={() => router.push('/social/mentions' as Href)}
          />
        </View>
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
    gap: 16,
    paddingTop: spacing.sm,
  },
  crisisSection: {
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  feedbackBanner: {
    alignSelf: 'stretch',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 17,
  },
  actionsStack: {
    gap: 10,
  },
  exploreSection: {
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
});
