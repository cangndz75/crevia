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

import { useShallow } from 'zustand/react/shallow';

import { useGameStore } from '@/store/useGameStore';
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
  cash: 'wallet-outline',
  people: 'people-outline',
  alert: 'pulse-outline',
};

const trendToneColors = {
  success: { bg: colors.successMuted, text: colors.success },
  warning: { bg: colors.warningMuted, text: colors.warning },
  danger: { bg: colors.dangerMuted, text: colors.danger },
  info: { bg: colors.secondaryMuted, text: colors.secondary },
};

function getStatusLabel(progress: number): string {
  if (progress >= 0.6) return 'Stabil';
  if (progress >= 0.4) return 'Dikkat';
  return 'Kritik';
}

function AnimatedMiniBar({
  progress,
  color,
  mutedColor,
  delay,
}: {
  progress: number;
  color: string;
  mutedColor: string;
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
    <View
      style={[styles.miniBarTrack, { backgroundColor: mutedColor }]}
      onLayout={onLayout}>
      <Animated.View
        style={[styles.miniBarFill, { backgroundColor: color }, fillStyle]}
      />
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
  const tone = trendToneColors[metric.trendTone];
  const statusLabel = getStatusLabel(metric.progress);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[styles.card, shadows.card]}>
      <View style={[styles.accentStrip, { backgroundColor: metric.color }]} />

      <View style={styles.cardContent}>
        <View style={styles.iconRow}>
          {metric.variant === 'ring' ? (
            <AnimatedDonut
              progress={metric.progress}
              color={metric.color}
              trackColor={metric.mutedColor}
              label={metric.value.replace('%', '')}
              delay={delay + 100}
              size={48}
            />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: metric.mutedColor }]}>
              <Ionicons
                name={iconMap[metric.icon]}
                size={18}
                color={metric.color}
              />
            </View>
          )}

          <View style={[styles.trendPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.trendPillText, { color: tone.text }]}>
              {metric.trendValue}
            </Text>
          </View>
        </View>

        <Text style={styles.cardValue} numberOfLines={1}>
          {metric.variant === 'ring'
            ? `${Math.round(metric.progress * 100)}%`
            : metric.value}
        </Text>

        <Text style={styles.cardLabel} numberOfLines={1}>
          {metric.label}
        </Text>

        <AnimatedMiniBar
          progress={metric.progress}
          color={metric.color}
          mutedColor={metric.mutedColor}
          delay={delay + 200}
        />

        <Text style={[styles.statusLabel, { color: tone.text }]}>
          {statusLabel}
        </Text>
      </View>
    </Animated.View>
  );
}

export function HubStatCards() {
  const cityPulse = useGameStore(
    useShallow((s) => s.gameState.cityPulse),
  );

  return (
    <View style={styles.grid}>
      {cityPulse.map((metric, index) => (
        <StatCard key={metric.id} metric={metric} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 14,
    gap: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  trendPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
