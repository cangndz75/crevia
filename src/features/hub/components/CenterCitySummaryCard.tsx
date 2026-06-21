import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { CenterStatusStrip } from '@/features/hub/components/center-city-summary/CenterStatusStrip';
import { CenterSummaryHeroIllustration } from '@/features/hub/components/center-city-summary/CenterSummaryHeroIllustration';
import { CenterSummaryMetricCard } from '@/features/hub/components/center-city-summary/CenterSummaryMetricCard';
import {
  CENTER_SUMMARY_COMPACT_WIDTH,
  centerSummaryTokens as tokens,
} from '@/features/hub/theme/centerCitySummaryTokens';
import type { CenterCitySummary } from '@/features/hub/utils/centerCitySummaryPresentation';
import {
  buildCenterSummaryMetricViews,
  buildCenterSummaryStatusView,
} from '@/features/hub/utils/centerCitySummaryUiPresentation';

export function CenterCitySummaryCard({ summary }: { summary: CenterCitySummary }) {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth <= CENTER_SUMMARY_COMPACT_WIDTH;

  const metrics = useMemo(
    () => buildCenterSummaryMetricViews(summary, { compact }),
    [summary, compact],
  );
  const status = useMemo(() => buildCenterSummaryStatusView(summary), [summary]);

  return (
    <View style={styles.section} accessibilityLabel={summary.accessibilityLabel}>
      <View style={styles.card}>
        <CenterSummaryHeroIllustration
          illustrationKey={summary.illustrationKey}
          title={summary.title}
          subtitle={summary.subtitle}
          compact={compact}
        />

        <View style={[styles.body, { marginTop: -tokens.layout.metricsOverlap }]}>
          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <CenterSummaryMetricCard key={metric.id} metric={metric} compact={compact} />
            ))}
          </View>

          <CenterStatusStrip status={status} compact={compact} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    minWidth: 0,
  },
  card: {
    borderRadius: tokens.radius.summaryCard,
    backgroundColor: tokens.colors.creamBg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadow,
  },
  body: {
    paddingHorizontal: tokens.spacing.internalPadding,
    paddingBottom: tokens.spacing.internalPadding,
    gap: tokens.spacing.gap,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.metricGap,
    minWidth: 0,
  },
});
