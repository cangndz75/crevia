import { StyleSheet, Text, View } from 'react-native';

import type { DerivedRiskSummary } from '@/features/risks/utils/deriveDay1Risks';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type RiskSummaryRowProps = {
  summary: DerivedRiskSummary;
};

export function RiskSummaryRow({ summary }: RiskSummaryRowProps) {
  const items = [
    {
      key: 'total',
      label: 'Toplam Risk',
      value: String(summary.total),
      bg: colors.summaryDangerBg,
      color: colors.danger,
    },
    {
      key: 'active',
      label: 'Aktif Tehdit',
      value: String(summary.activeThreats),
      bg: colors.summaryWarningBg,
      color: colors.warning,
    },
    {
      key: 'critical',
      label: 'Kritik',
      value: String(summary.critical),
      bg: colors.summaryCriticalBg,
      color: colors.critical,
    },
  ] as const;

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.key}
          style={[styles.card, { backgroundColor: item.bg }, shadows.soft]}>
          <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
          <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    fontSize: 9,
    textAlign: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
});
