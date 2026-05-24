import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { mockGameData } from '@/core/content/mockGameData';
import { CityPulseMetric } from '@/core/models/CityPulseMetric';
import { AnimatedDonut } from '@/ui/components/AnimatedDonut';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const iconMap: Record<
  CityPulseMetric['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  happy: 'happy-outline',
  cash: 'layers-outline',
  people: 'people-outline',
  alert: 'notifications-outline',
};

const trendColors = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.secondary,
};

function AnimatedMiniBar({
  progress,
  color,
  delay,
}: {
  progress: number;
  color: string;
  delay: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const playFill = useCallback(
    (width: number) => {
      if (width <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withDelay(
        delay,
        withTiming(width * progress, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
        }),
      );
    },
    [delay, fillWidth, progress],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setTrackWidth(w);
      playFill(w);
    },
    [playFill],
  );

  useFocusEffect(
    useCallback(() => {
      playFill(trackWidth);
    }, [playFill, trackWidth]),
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View style={styles.miniBarTrack} onLayout={onLayout}>
      <Animated.View style={[styles.miniBarFill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

function StatCard({
  metric,
  index,
}: {
  metric: CityPulseMetric;
  index: number;
}) {
  const delay = index * 100;
  const trendColor = trendColors[metric.trendTone];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[styles.card, shadows.card]}>
      {metric.variant === 'ring' ? (
        <AnimatedDonut
          progress={metric.progress}
          color={metric.color}
          trackColor={metric.mutedColor}
          label={metric.value.replace('%', '')}
          delay={delay + 100}
        />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: metric.mutedColor }]}>
          <Ionicons
            name={iconMap[metric.icon]}
            size={20}
            color={metric.color}
          />
        </View>
      )}

      <Text style={styles.cardLabel} numberOfLines={2}>
        {metric.label}
      </Text>

      {metric.variant !== 'ring' ? (
        <Text style={styles.cardValue} numberOfLines={1}>
          {metric.value}
        </Text>
      ) : null}

      <Text style={[styles.trend, { color: trendColor }]} numberOfLines={1}>
        {metric.trendValue}
      </Text>

      <AnimatedMiniBar
        progress={metric.progress}
        color={metric.color}
        delay={delay + 200}
      />
    </Animated.View>
  );
}

export function HubStatCards() {
  return (
    <View style={styles.row}>
      {mockGameData.cityPulse.map((metric, index) => (
        <StatCard key={metric.id} metric={metric} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
  },
  cardValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  trend: {
    fontSize: 10,
    fontWeight: '700',
  },
  miniBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
