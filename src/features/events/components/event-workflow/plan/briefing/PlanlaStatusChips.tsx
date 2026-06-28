import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';

type PlanlaStatusChipsProps = {
  status: EventPlanBriefingPresentation['status'];
  reducedMotion?: boolean;
};

export function PlanlaStatusChips({ status, reducedMotion = false }: PlanlaStatusChipsProps) {
  return (
    <View style={styles.row}>
      <StatusChip
        label={status.priority}
        tone="amber"
        direction="left"
        delay={0}
        reducedMotion={reducedMotion}
      />
      <StatusChip
        label={status.state}
        tone="teal"
        direction="right"
        delay={50}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

function StatusChip({
  label,
  tone,
  direction,
  delay,
  reducedMotion,
}: {
  label: string;
  tone: 'amber' | 'teal';
  direction: 'left' | 'right';
  delay: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateX = useSharedValue(reducedMotion ? 0 : direction === 'left' ? -8 : 8);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(delay, withTiming(1, { duration: 220 }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 220 }));
  }, [delay, opacity, reducedMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const toneStyle = tone === 'amber' ? styles.chipAmber : styles.chipTeal;
  const dotStyle = tone === 'amber' ? styles.dotAmber : styles.dotTeal;
  const textStyle = tone === 'amber' ? styles.textAmber : styles.textTeal;

  return (
    <Animated.View style={[styles.chip, toneStyle, animatedStyle]}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={[styles.chipText, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: eventDetail.screenPadding,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
  },
  chipAmber: {
    backgroundColor: 'rgba(216, 167, 46, 0.13)',
    borderColor: 'rgba(216, 167, 46, 0.28)',
  },
  chipTeal: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderColor: 'rgba(11, 107, 97, 0.16)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAmber: {
    backgroundColor: '#D9A646',
  },
  dotTeal: {
    backgroundColor: eventDetail.teal,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  textAmber: {
    color: '#9E6E0D',
  },
  textTeal: {
    color: eventDetail.tealDark,
  },
});
