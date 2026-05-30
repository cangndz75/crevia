import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { PlanSummaryUi } from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanSummaryCardProps = {
  summary: PlanSummaryUi;
};

function SummaryColumn({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.column}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PlanSummaryCard({ summary }: PlanSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="clipboard-outline" size={18} color={eventDetail.tealDark} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          Plan Özeti
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <SummaryColumn label="Süre" value={summary.duration} />
        <View style={styles.divider} />
        <SummaryColumn label="Tahmini Maliyet" value={summary.cost} />
        <View style={styles.divider} />
        <SummaryColumn label="Tahmini Başarı" value={summary.success} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 96,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    textAlign: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(6, 63, 59, 0.12)',
    marginVertical: 2,
  },
});
