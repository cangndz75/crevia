import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { PlanBriefingSignal } from '@/features/events/utils/eventPlanBriefingPresentation';
import { shadows } from '@/ui/theme/shadows';

import { planBriefingStyles } from './planBriefingStyles';

type SignalSummaryCardProps = {
  eyebrow: string;
  signals: PlanBriefingSignal[];
  reducedMotion?: boolean;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

const SIGNAL_ICON: Record<PlanBriefingSignal['key'], IconName> = {
  risk: 'shield-outline',
  readiness: 'water-outline',
  neighborhood: 'people-outline',
};

const SIGNAL_TONE = {
  warning: {
    bubble: 'rgba(217, 95, 80, 0.12)',
    icon: '#D95F50',
    pillBg: 'rgba(216, 167, 46, 0.16)',
    pillText: '#9E6E0D',
  },
  positive: {
    bubble: 'rgba(11, 107, 97, 0.10)',
    icon: eventDetail.teal,
    pillBg: 'rgba(11, 107, 97, 0.12)',
    pillText: eventDetail.tealDark,
  },
  social: {
    bubble: 'rgba(120, 86, 180, 0.12)',
    icon: '#7856B4',
    pillBg: 'rgba(120, 86, 180, 0.14)',
    pillText: '#5C3F96',
  },
} as const;

export function SignalSummaryCard({
  eyebrow,
  signals,
  reducedMotion = false,
}: SignalSummaryCardProps) {
  return (
    <View style={[planBriefingStyles.card, shadows.soft, styles.card]}>
      <Text style={planBriefingStyles.eyebrow}>{eyebrow}</Text>
      <View style={styles.list}>
        {signals.map((signal, index) => (
          <SignalRow
            key={signal.key}
            signal={signal}
            index={index}
            isLast={index === signals.length - 1}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

function SignalRow({
  signal,
  index,
  isLast,
  reducedMotion,
}: {
  signal: PlanBriefingSignal;
  index: number;
  isLast: boolean;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 8);
  const tone = SIGNAL_TONE[signal.tone];
  const icon = SIGNAL_ICON[signal.key] ?? 'pulse-outline';

  useEffect(() => {
    if (reducedMotion) return;
    const delay = index * 70;
    opacity.value = withDelay(delay, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 220 }));
  }, [index, opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.row, !isLast && styles.rowDivider, animatedStyle]}
      accessibilityRole="text"
      accessibilityLabel={`${signal.label}, ${signal.value}. ${signal.body}`}>
      <View style={[styles.iconBubble, { backgroundColor: tone.bubble }]}>
        <Ionicons name={icon} size={16} color={tone.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>
          {signal.label}: {signal.value}
        </Text>
        <Text style={styles.body}>{signal.body}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: tone.pillBg }]}>
        <Text style={[styles.pillText, { color: tone.pillText }]} numberOfLines={1}>
          {signal.value}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 63, 59, 0.06)',
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    minWidth: 52,
    alignItems: 'center',
    flexShrink: 0,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
