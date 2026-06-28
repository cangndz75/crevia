import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { PlanOptionStats } from '@/features/events/utils/eventPlanOptionsPresentation';

type PlanOptionStatsRowProps = {
  stats: PlanOptionStats;
  selected?: boolean;
};

export function PlanOptionStatsRow({ stats, selected = false }: PlanOptionStatsRowProps) {
  return (
    <View style={[styles.row, selected && styles.rowSelected]}>
      <StatCell label="Risk" value={stats.risk} />
      <View style={styles.divider} />
      <StatCell label="Maliyet" value={stats.cost} />
      <View style={styles.divider} />
      <StatCell label="Etki" value={stats.impact} />
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(6, 63, 59, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  rowSelected: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(6, 63, 59, 0.08)',
  },
});
