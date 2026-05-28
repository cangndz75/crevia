import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  buildLiveFlowStoreSliceFromGameStore,
  selectHubTodayFlowLines,
  type LiveFlowStoreSlice,
} from '@/core/liveFlow/liveFlowSelectors';
import type { LiveFlowEntry } from '@/core/liveFlow';
import { renderHighlightedText } from '@/features/hub/components/hubUiHelpers';
import { useOnboardingHubVisibility } from '@/features/onboarding/hooks/useOnboardingHubVisibility';
import {
  clampHubTodayFlowLines,
  DAY1_FLOW_PLACEHOLDER_LINE,
  DAY1_FLOW_TIMELINE_PREVIEW_LINES,
} from '@/features/hub/hubUiPresentation';
import { selectDay1TutorialEventId } from '@/features/tutorial/tutorialSelectors';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type FlowDisplayLine = {
  id: string;
  text: string;
  tone: LiveFlowEntry['tone'];
  icon: keyof typeof Ionicons.glyphMap;
  relatedEventId?: string;
};

const TONE_STYLE: Record<
  LiveFlowEntry['tone'],
  { nodeBg: string; nodeIcon: string; boxBg: string; boxBorder: string; text: string }
> = {
  positive: {
    nodeBg: colors.success,
    nodeIcon: '#fff',
    boxBg: '#EDF8F1',
    boxBorder: '#B8E6CB',
    text: '#1F6B42',
  },
  info: {
    nodeBg: colors.primary,
    nodeIcon: '#fff',
    boxBg: '#EEF6FC',
    boxBorder: '#B8D9F0',
    text: '#1D4E89',
  },
  warning: {
    nodeBg: colors.hubGold,
    nodeIcon: '#fff',
    boxBg: '#FFF8E8',
    boxBorder: '#F5DFA8',
    text: '#7A5510',
  },
  neutral: {
    nodeBg: colors.textSecondary,
    nodeIcon: '#fff',
    boxBg: colors.backgroundAlt,
    boxBorder: colors.border,
    text: colors.textSecondary,
  },
};

function toneToIcon(tone: LiveFlowEntry['tone'], index: number): keyof typeof Ionicons.glyphMap {
  if (tone === 'positive') return 'checkmark-circle';
  if (tone === 'warning') return 'scale-outline';
  if (tone === 'info') return index === 0 ? 'checkmark-circle' : 'map-outline';
  return 'ellipse-outline';
}

export function HubTodayFlowStrip() {
  const router = useRouter();
  const hubVis = useOnboardingHubVisibility();
  const day1EventId = useGameStore(selectDay1TutorialEventId);
  const flowSlice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      eventPool: s.eventPool,
      decisionHistory: s.decisionHistory,
      lastDecisionResult: s.lastDecisionResult,
      lastDailyReport: s.lastDailyReport,
      dailyPriorityByDay: s.dailyPriorityByDay,
      dailyGoalsByDay: s.dailyGoalsByDay,
      isDay1Tutorial: selectIsDay1TutorialActive(s),
      currentDay: s.gameState.city.day,
    })),
  );

  const showFlow = hubVis.showTodayFlow;
  const showPlaceholder = hubVis.showTodayFlowPlaceholder;

  const lines = useMemo(() => {
    const slice: LiveFlowStoreSlice = {
      gameState: flowSlice.gameState,
      eventPool: flowSlice.eventPool,
      decisionHistory: flowSlice.decisionHistory,
      lastDecisionResult: flowSlice.lastDecisionResult,
      lastDailyReport: flowSlice.lastDailyReport,
      dailyPriorityByDay: flowSlice.dailyPriorityByDay,
      dailyGoalsByDay: flowSlice.dailyGoalsByDay,
      isDay1Tutorial: flowSlice.isDay1Tutorial,
    };
    const raw = selectHubTodayFlowLines(buildLiveFlowStoreSliceFromGameStore(slice));
    return clampHubTodayFlowLines(raw);
  }, [flowSlice]);

  const displayLines: FlowDisplayLine[] = useMemo(() => {
    if (showFlow && lines.length > 0) {
      return lines.map((line, index) => ({
        id: line.id,
        text: line.text,
        tone: line.tone,
        icon: (line.iconName as keyof typeof Ionicons.glyphMap) ?? toneToIcon(line.tone, index),
        relatedEventId: line.relatedEventId,
      }));
    }
    if (showPlaceholder && lines.length === 0) {
      return DAY1_FLOW_TIMELINE_PREVIEW_LINES.map((text, index) => ({
        id: `preview-${index}`,
        text,
        tone: (index === 0 ? 'info' : 'neutral') as LiveFlowEntry['tone'],
        icon: index === 0 ? 'checkmark-circle' : 'ellipse-outline',
      }));
    }
    return [
      {
        id: 'placeholder',
        text: DAY1_FLOW_PLACEHOLDER_LINE,
        tone: 'neutral' as const,
        icon: 'ellipse-outline',
      },
    ];
  }, [lines, showFlow, showPlaceholder]);

  if (!showFlow && !showPlaceholder) {
    return null;
  }

  const goToEvent = (eventId?: string) => {
    const id = eventId ?? day1EventId;
    if (!id) return;
    playLightImpactHaptic();
    router.push(`/events/${id}`);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Ionicons name="git-network-outline" size={18} color={colors.headerTealDark} />
        <Text style={styles.title}>Bugünün Akışı</Text>
      </View>

      <View style={[styles.card, shadows.soft]}>
        {displayLines.map((line, index) => (
          <FlowRow
            key={line.id}
            line={line}
            index={index}
            isLast={index === displayLines.length - 1}
            onPress={
              line.relatedEventId
                ? () => goToEvent(line.relatedEventId)
                : index === 0 && day1EventId && showPlaceholder
                  ? () => goToEvent()
                  : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

function FlowRow({
  line,
  index,
  isLast,
  onPress,
}: {
  line: FlowDisplayLine;
  index: number;
  isLast: boolean;
  onPress?: () => void;
}) {
  const palette = TONE_STYLE[line.tone];

  const row = (
    <View style={styles.row}>
      <View style={styles.railCol}>
        {!isLast ? <View style={[styles.rail, { backgroundColor: palette.boxBorder }]} /> : null}
        <View style={[styles.node, { backgroundColor: palette.nodeBg }]}>
          <Ionicons name={line.icon} size={13} color={palette.nodeIcon} />
        </View>
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: palette.boxBg,
            borderColor: palette.boxBorder,
          },
        ]}>
        <Text style={[styles.bubbleText, { color: palette.text }]} numberOfLines={3}>
          {line.text.includes('**')
            ? renderHighlightedText(
                line.text,
                { ...styles.bubbleText, color: palette.text },
                styles.bubbleBold,
              )
            : line.text}
        </Text>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color={palette.text} />
        ) : null}
      </View>
    </View>
  );

  const animated = (
    <Animated.View
      entering={FadeInUp.delay(index * 45)
        .duration(220)
        .springify()
        .damping(22)}>
      {row}
    </Animated.View>
  );

  if (!onPress) return animated;

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
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 52,
  },
  railCol: {
    width: 28,
    alignItems: 'center',
  },
  rail: {
    position: 'absolute',
    top: 28,
    bottom: -8,
    width: 2,
    left: 13,
    borderRadius: 1,
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    zIndex: 1,
  },
  bubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    minWidth: 0,
  },
  bubbleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  bubbleBold: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
});
