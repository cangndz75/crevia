import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import {
  deriveHubMetricCards,
  type HubMetricCard,
} from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const iconMap: Record<
  HubMetricCard['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  operasyon: 'bus-outline',
  halk: 'people-outline',
  butce: 'cash-outline',
  ekip: 'person-outline',
};

function MetricTile({
  metric,
  index,
}: {
  metric: HubMetricCard;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[styles.tile, shadows.soft]}>
      <View style={styles.tileTop}>
        <View style={[styles.iconCircle, { backgroundColor: metric.muted }]}>
          <Ionicons
            name={iconMap[metric.icon]}
            size={18}
            color={metric.accent}
          />
        </View>
        <View
          style={[
            styles.trendPill,
            {
              backgroundColor: metric.trendUp
                ? colors.successMuted
                : colors.dangerMuted,
            },
          ]}>
          <Text
            style={[
              styles.trendText,
              { color: metric.trendUp ? colors.success : colors.danger },
            ]}>
            {metric.trend}
          </Text>
        </View>
      </View>
      <Text style={styles.value}>{metric.value}</Text>
      <Text style={styles.label}>{metric.label}</Text>
    </Animated.View>
  );
}

export function HubMetricsGrid() {
  const input = useHubDerivedInput();
  const resources = useGameStore((s) => s.resources);
  const metrics = useMemo(
    () => deriveHubMetricCards(input, resources),
    [input, resources],
  );

  return (
    <View style={styles.grid}>
      {metrics.map((m, i) => (
        <MetricTile key={m.id} metric={m} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    minHeight: 96,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
