import { StyleSheet, Text, View } from 'react-native';

import { buildReportBadgeSummaryModel } from '@/core/badges/badgePresentation';
import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';
import { ReportAuthoritySummary } from '@/features/reports/components/ReportAuthoritySummary';
import { ReportBadgeSummary } from '@/features/reports/components/ReportBadgeSummary';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  authorityLines: string[];
  badgeEvaluation?: BadgeEvaluationSnapshot | null;
  compact?: boolean;
};

export function EndOfDayReportMetaProgressSection({
  authorityLines,
  badgeEvaluation,
  compact = false,
}: Props) {
  const hasAuthority = authorityLines.length > 0;
  const badgeVisible = buildReportBadgeSummaryModel(badgeEvaluation).visible;

  if (!hasAuthority && !badgeVisible) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} numberOfLines={1}>
        Yetki ve Rozet
      </Text>
      <View style={[styles.stack, compact && styles.stackCompact]}>
        {hasAuthority ? (
          <ReportAuthoritySummary lines={authorityLines} compact={compact} />
        ) : null}
        <ReportBadgeSummary evaluation={badgeEvaluation} compact={compact} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
  stack: {
    gap: spacing.sm,
  },
  stackCompact: {
    gap: 8,
  },
});
