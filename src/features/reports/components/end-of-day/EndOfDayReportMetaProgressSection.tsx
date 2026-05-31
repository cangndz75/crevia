import { StyleSheet, View } from 'react-native';

import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';
import { buildReportBadgeSummaryModel } from '@/core/badges/badgePresentation';
import { ReportAuthoritySummary } from '@/features/reports/components/ReportAuthoritySummary';
import { ReportBadgeStatusCard } from '@/features/reports/components/ReportBadgeStatusCard';

type Props = {
  authorityLines: string[];
  badgeEvaluation?: BadgeEvaluationSnapshot | null;
  compact?: boolean;
  /** Yetki kartı ayrı premium bileşende; yalnızca rozet şeridi */
  badgeOnly?: boolean;
};

export function EndOfDayReportMetaProgressSection({
  authorityLines,
  badgeEvaluation,
  compact = false,
  badgeOnly = false,
}: Props) {
  const badgeModel = buildReportBadgeSummaryModel(badgeEvaluation);
  const showAuthority = !badgeOnly;
  const showBadge = badgeModel.visible || !compact;

  if (!showAuthority && !showBadge) {
    return null;
  }

  if (badgeOnly && !showBadge) {
    return null;
  }

  return (
    <View style={badgeOnly ? styles.badgeOnly : styles.row}>
      {showAuthority ? (
        <ReportAuthoritySummary lines={authorityLines} compact={compact} />
      ) : null}
      {showBadge ? (
        <ReportBadgeStatusCard evaluation={badgeEvaluation} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  badgeOnly: {
    minWidth: 0,
  },
});
