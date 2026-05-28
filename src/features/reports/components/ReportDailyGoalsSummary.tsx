import { StyleSheet, Text, View } from 'react-native';

import type { DailyGoalReportResult } from '@/core/dailyGoals/dailyGoalTypes';
import { getDailyGoalStatusLabel } from '@/core/dailyGoals/dailyGoalPresentation';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { typography } from '@/ui/theme/typography';

type ReportDailyGoalsSummaryProps = {
  results?: DailyGoalReportResult[];
  tutorialLine?: string | null;
};

const STATUS_COLORS: Record<
  DailyGoalReportResult['status'],
  string
> = {
  completed: colors.success,
  failed: colors.danger,
  at_risk: colors.warning,
  active: colors.textSecondary,
};

export function ReportDailyGoalsSummary({
  results,
  tutorialLine,
}: ReportDailyGoalsSummaryProps) {
  if (tutorialLine) {
    return (
      <GameCard padding="lg" style={styles.card}>
        <Text style={typography.label}>Günlük Hedefler</Text>
        <Text style={styles.line}>• {tutorialLine}</Text>
      </GameCard>
    );
  }

  if (!results?.length) {
    return null;
  }

  return (
    <GameCard padding="lg" style={styles.card}>
      <Text style={typography.label}>Günlük Hedefler</Text>
      <View style={styles.list}>
        {results.map((item) => (
          <View key={`${item.title}-${item.status}`} style={styles.row}>
            <Text style={[styles.badge, { color: STATUS_COLORS[item.status] }]}>
              {getDailyGoalStatusLabel(
                item.status === 'active'
                  ? 'active'
                  : item.status === 'completed'
                    ? 'completed'
                    : item.status === 'failed'
                      ? 'failed'
                      : 'at_risk',
              )}
            </Text>
            <Text style={styles.line} numberOfLines={2}>
              {item.resultText}
            </Text>
          </View>
        ))}
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  list: {
    gap: 8,
  },
  row: {
    gap: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  line: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
});
