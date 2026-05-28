import { StyleSheet, Text, View } from 'react-native';

import type { PlanningDetailStat } from '@/features/events/utils/eventWorkflowPlanDetails';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanningDetailStatsRowProps = {
  stats: PlanningDetailStat[];
  columns?: 2;
};

function valueColor(tone: PlanningDetailStat['tone']) {
  switch (tone) {
    case 'positive':
      return '#1A7A5C';
    case 'warning':
      return '#B45309';
    case 'accent':
      return eventDetail.tealDark;
    default:
      return eventDetail.textDark;
  }
}

export function PlanningDetailStatsRow({
  stats,
  columns = 2,
}: PlanningDetailStatsRowProps) {
  return (
    <View style={[styles.grid, columns === 2 && styles.gridTwoCol]}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.cell, columns === 2 && styles.cellHalf]}>
          <Text style={styles.label} numberOfLines={1}>
            {stat.label}
          </Text>
          <Text
            style={[styles.value, { color: valueColor(stat.tone) }]}
            numberOfLines={2}>
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  cellHalf: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
});
