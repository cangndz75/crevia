import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { DAY1_FLOW_PLACEHOLDER } from '@/core/onboarding/onboardingPresentation';
import { selectOnboardingHubVisibilityFromStore } from '@/core/onboarding/onboardingSelectors';
import { getLifecycleToneColors } from '@/core/liveFlow/liveFlowPresentation';
import {
  buildLiveFlowStoreSliceFromGameStore,
  selectHubTodayFlowLines,
  type LiveFlowStoreSlice,
} from '@/core/liveFlow/liveFlowSelectors';
import type { LiveFlowEntry } from '@/core/liveFlow';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubTodayFlowStrip() {
  const router = useRouter();
  const { lines, isDay1, showFlow, showPlaceholder } = useGameStore(
    useShallow((s) => {
      const slice: LiveFlowStoreSlice = {
        gameState: s.gameState,
        eventPool: s.eventPool,
        decisionHistory: s.decisionHistory,
        lastDecisionResult: s.lastDecisionResult,
        lastDailyReport: s.lastDailyReport,
        dailyPriorityByDay: s.dailyPriorityByDay,
        dailyGoalsByDay: s.dailyGoalsByDay,
        isDay1Tutorial: selectIsDay1TutorialActive(s),
      };
      const hubVis = selectOnboardingHubVisibilityFromStore({
        gameState: s.gameState,
        tutorialState: s.tutorialState,
        dailyPriorityState: s.dailyPriorityState,
        dailyGoalState: s.dailyGoalState,
        lastDecisionResult: s.lastDecisionResult,
        lastDailyReport: s.lastDailyReport,
        decisionHistory: s.decisionHistory,
        onboardingDismissedHintIds: s.onboardingDismissedHintIds,
      });
      return {
        lines: selectHubTodayFlowLines(buildLiveFlowStoreSliceFromGameStore(slice)),
        isDay1: selectIsDay1TutorialActive(s) && s.gameState.city.day === 1,
        showFlow: hubVis.showTodayFlow,
        showPlaceholder: hubVis.showTodayFlowPlaceholder,
      };
    }),
  );

  if (!showFlow && showPlaceholder) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Bugünün Akışı</Text>
        <View style={[styles.row, styles.placeholderRow]}>
          <Text style={styles.placeholderText}>{DAY1_FLOW_PLACEHOLDER}</Text>
        </View>
      </View>
    );
  }

  if (!showFlow || lines.length === 0) {
    if (!showPlaceholder) return null;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Bugünün Akışı</Text>
        <View style={[styles.row, styles.placeholderRow]}>
          <Text style={styles.placeholderText}>{DAY1_FLOW_PLACEHOLDER}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bugünün Akışı</Text>
      <View style={styles.list}>
        {lines.map((line, index) => (
          <FlowLine
            key={line.id}
            line={line}
            index={index}
            onPress={
              line.relatedEventId
                ? () => router.push(`/events/${line.relatedEventId}`)
                : undefined
            }
            muted={isDay1}
          />
        ))}
      </View>
    </View>
  );
}

function FlowLine({
  line,
  index,
  onPress,
  muted,
}: {
  line: LiveFlowEntry;
  index: number;
  onPress?: () => void;
  muted?: boolean;
}) {
  const tone = getLifecycleToneColors(muted ? 'neutral' : line.tone);
  const icon = (line.iconName ?? 'ellipse-outline') as keyof typeof Ionicons.glyphMap;
  const accentRow =
    !muted &&
    (line.tone === 'warning' ||
      line.type === 'follow_up_created' ||
      line.type === 'decision_resolved');

  const content = (
    <View
      style={[
        styles.row,
        { backgroundColor: tone.bg, borderColor: tone.border },
        accentRow ? styles.rowAccent : null,
      ]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Ionicons name={icon} size={14} color={tone.text} style={styles.icon} />
      <Text style={[styles.text, { color: tone.text }]} numberOfLines={2}>
        {line.text}
      </Text>
      {onPress ? (
        <Ionicons name="chevron-forward" size={14} color={tone.text} />
      ) : null}
    </View>
  );

  const animated = (
    <Animated.View
      entering={FadeInUp.delay(index * 50)
        .duration(220)
        .springify()
        .damping(22)}>
      {content}
    </Animated.View>
  );

  if (!onPress) {
    return animated;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => getPressFeedbackStyle({ pressed })}>
      {animated}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  rowAccent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  placeholderRow: {
    backgroundColor: '#F5F3EF',
    borderColor: '#E5E1D8',
  },
  placeholderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8578',
    lineHeight: 14,
  },
});
