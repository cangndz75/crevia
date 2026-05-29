import { StyleSheet, Text, View } from 'react-native';

import type { EndOfDayImpactMetric } from '@/features/reports/utils/endOfDayReportPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  metrics: EndOfDayImpactMetric[];
};

const TONE_STYLES = {
  teal: {
    bg: colors.primaryMuted,
    border: 'rgba(26,143,138,0.18)',
    value: colors.primary,
  },
  mint: {
    bg: colors.successMuted,
    border: 'rgba(59,175,122,0.18)',
    value: colors.success,
  },
  gold: {
    bg: colors.hubGoldMuted,
    border: 'rgba(212,160,23,0.22)',
    value: colors.hubGoldDark,
  },
  warn: {
    bg: colors.warningMuted,
    border: 'rgba(232,155,46,0.22)',
    value: colors.warning,
  },
} as const;

function ImpactMetricCell({ metric }: { metric: EndOfDayImpactMetric }) {
  const tone = TONE_STYLES[metric.tone];

  return (
    <View
      style={[
        styles.cell,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <Text style={[styles.value, { color: tone.value }]} numberOfLines={1}>
        {metric.value}
      </Text>
    </View>
  );
}

export function EndOfDayReportImpactStrip({ metrics }: Props) {
  const visible = metrics.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, shadows.soft]}>
      <Text style={styles.heading} numberOfLines={1}>
        Bugünkü Ana Etki
      </Text>
      <View style={styles.row}>
        {visible.map((metric) => (
          <ImpactMetricCell key={metric.key} metric={metric} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
