import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const summaryConfig = [
  {
    key: 'total',
    label: 'Toplam Risk',
    getValue: () => String(mockGameData.riskSummary.total),
    bg: colors.summaryDangerBg,
    color: colors.danger,
  },
  {
    key: 'active',
    label: 'Aktif Tehdit',
    getValue: () => String(mockGameData.riskSummary.activeThreats),
    bg: colors.summaryWarningBg,
    color: colors.warning,
  },
  {
    key: 'critical',
    label: 'Kritik',
    getValue: () => String(mockGameData.riskSummary.critical),
    bg: colors.summaryCriticalBg,
    color: colors.critical,
  },
] as const;

export function RiskSummaryRow() {
  return (
    <View style={styles.row}>
      {summaryConfig.map((item) => (
        <View
          key={item.key}
          style={[styles.card, { backgroundColor: item.bg }, shadows.soft]}>
          <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
          <Text style={[styles.value, { color: item.color }]}>
            {item.getValue()}
          </Text>
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
