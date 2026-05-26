import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import {
  deriveHubMetricCards,
  type HubMetricCard,
} from '@/features/hub/utils/hubDerived';
import { getMetricIcon } from '@/features/hub/utils/hubAssets';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function MetricTile({ m }: { m: HubMetricCard }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.iconBadge, { backgroundColor: m.muted }]}>
        <HubAssetImage
          source={getMetricIcon(m.icon)}
          containerStyle={styles.iconImage}
          contentFit="contain"
        />
      </View>
      <Text style={styles.label}>{m.label}</Text>
      <Text style={styles.value}>{m.value}</Text>
      {m.showTrend ? (
        <Text style={[styles.trend, { color: m.trendUp ? colors.success : colors.danger }]}>
          {m.trend}
        </Text>
      ) : (
        <Text style={[styles.trend, { color: colors.textSecondary }]}>{m.trend}</Text>
      )}
    </View>
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
    <Animated.View entering={FadeIn.duration(250)} style={styles.wrap}>
      {metrics.map((m) => (
        <MetricTile key={m.id} m={m} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 2,
  },
  iconImage: {
    width: 26,
    height: 26,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  trend: {
    fontSize: 9,
    fontWeight: '700',
  },
});
