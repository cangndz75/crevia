import { StyleSheet, Text, View } from 'react-native';

import type { DailyReport } from '@/core/models/DailyReport';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const STATUS_LABELS = {
  fulfilled: 'Başarılı',
  partial: 'Kısmi Başarı',
  failed: 'Başarısız',
} as const;

type Props = {
  result?: DailyReport['dailyPriorityResult'];
  day1Line?: string | null;
};

export function ReportDailyPrioritySummary({ result, day1Line }: Props) {
  if (day1Line) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Günün Önceliği</Text>
        <Text style={styles.body}>{day1Line}</Text>
      </View>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Günün Önceliği</Text>
      <Text style={styles.headline}>
        {result.title} · {STATUS_LABELS[result.status]}
      </Text>
      <Text style={styles.body}>{result.text}</Text>
      {result.carryOverText ? (
        <Text style={styles.carryOver}>{result.carryOverText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  carryOver: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
