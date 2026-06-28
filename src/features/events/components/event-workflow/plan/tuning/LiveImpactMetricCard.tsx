import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { LiveImpactMetric } from '@/features/events/utils/eventPlanTuningPresentation';

type IconName = ComponentProps<typeof Ionicons>['name'];

const METRIC_ICON: Record<LiveImpactMetric['id'], IconName> = {
  risk: 'shield-outline',
  cost: 'cash-outline',
  trust: 'shield-checkmark-outline',
  visibility: 'eye-outline',
};

const METRIC_TONE: Record<
  LiveImpactMetric['tone'],
  { bg: string; icon: string; value: string }
> = {
  warning: { bg: 'rgba(217, 95, 80, 0.10)', icon: '#D95F50', value: '#C0564A' },
  info: { bg: 'rgba(59, 130, 246, 0.10)', icon: '#3B82F6', value: '#2563EB' },
  positive: { bg: 'rgba(62, 158, 106, 0.12)', icon: eventDetail.teal, value: eventDetail.tealDark },
  social: { bg: 'rgba(120, 86, 180, 0.12)', icon: '#7856B4', value: '#5C3F96' },
};

type LiveImpactMetricCardProps = {
  metric: LiveImpactMetric;
  highlight?: boolean;
  reducedMotion?: boolean;
};

export function LiveImpactMetricCard({
  metric,
  highlight = false,
  reducedMotion = false,
}: LiveImpactMetricCardProps) {
  const tone = METRIC_TONE[metric.tone];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!highlight || reducedMotion) return;
    scale.value = 1.03;
    opacity.value = 0.82;
    scale.value = withTiming(1, { duration: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [highlight, metric.value, opacity, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: tone.bg }, animatedStyle]}>
      <Ionicons name={METRIC_ICON[metric.id]} size={15} color={tone.icon} />
      <Text style={[styles.value, { color: tone.value }]} numberOfLines={1}>
        {metric.value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {metric.subtitle}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
    minHeight: 88,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: eventDetail.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
});
