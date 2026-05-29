import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldImpactMetric } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';

type Props = {
  metrics: FieldImpactMetric[];
};

const TONE_COLORS = {
  teal: eventDetail.tealDark,
  gold: '#9A5E12',
  warn: eventDetail.orange,
  neutral: eventDetail.textMuted,
} as const;

export function FieldImpactMetricsRow({ metrics }: Props) {
  return (
    <View style={styles.row}>
      {metrics.map((metric) => (
        <View key={metric.key} style={styles.cell}>
          <Text
            style={[styles.value, { color: TONE_COLORS[metric.tone] }]}
            numberOfLines={1}>
            {metric.value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: eventDetail.screenPadding,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: eventDetail.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
});
