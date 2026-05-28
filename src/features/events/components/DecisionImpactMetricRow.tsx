import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DecisionMetricChange } from '@/features/events/types/decisionResultTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';

type DecisionImpactMetricRowProps = {
  metrics: DecisionMetricChange[];
};

const SHORT_LABELS: Record<DecisionMetricChange['key'], string> = {
  publicSatisfaction: 'Halk',
  budget: 'Bütçe',
  personnelMorale: 'Moral',
  operationRisk: 'Risk',
};

function formatDelta(metric: DecisionMetricChange): string {
  const { delta, key } = metric;
  if (delta === 0) return '0';
  const sign = delta > 0 ? '+' : '';
  if (key === 'budget') {
    const abs = Math.abs(delta);
    if (abs >= 1000) {
      return `${sign}${Math.round(delta / 1000)}K`;
    }
  }
  return `${sign}${delta}`;
}

function toneForMetric(metric: DecisionMetricChange) {
  if (metric.direction === 'flat') {
    return {
      bg: colors.backgroundAlt,
      text: colors.textSecondary,
      icon: 'remove-outline' as const,
    };
  }
  if (metric.isGood) {
    return {
      bg: colors.successMuted,
      text: colors.success,
      icon: metric.direction === 'up' ? ('arrow-up' as const) : ('arrow-down' as const),
    };
  }
  return {
    bg: colors.dangerMuted,
    text: colors.danger,
    icon: metric.direction === 'up' ? ('arrow-up' as const) : ('arrow-down' as const),
  };
}

export function DecisionImpactMetricRow({ metrics }: DecisionImpactMetricRowProps) {
  return (
    <View style={styles.row}>
      {metrics.map((metric) => {
        const tone = toneForMetric(metric);
        return (
          <View key={metric.key} style={[styles.card, { backgroundColor: tone.bg }]}>
            <Text style={styles.label}>{SHORT_LABELS[metric.key]}</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.delta, { color: tone.text }]}>
                {formatDelta(metric)}
              </Text>
              <Ionicons name={tone.icon} size={14} color={tone.text} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '25%',
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  delta: {
    fontSize: 15,
    fontWeight: '800',
  },
});
