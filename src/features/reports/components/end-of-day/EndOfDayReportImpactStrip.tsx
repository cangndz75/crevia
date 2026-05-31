import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { EndOfDayImpactMetric } from '@/features/reports/utils/endOfDayReportPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  metrics: EndOfDayImpactMetric[];
};

const METRIC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  public: 'people',
  team: 'shield-checkmark',
  budget: 'diamond',
};

const TONE_STYLES = {
  teal: {
    bg: '#E8F7F0',
    border: 'rgba(26,143,138,0.14)',
    valueColor: colors.primary,
    iconBg: colors.primaryMuted,
    icon: colors.primary,
    trend: colors.success,
  },
  mint: {
    bg: '#EEF8FC',
    border: 'rgba(36,119,168,0.14)',
    valueColor: '#2477A8',
    iconBg: '#DCEEFF',
    icon: '#2477A8',
    trend: colors.success,
  },
  gold: {
    bg: colors.hubGoldMuted,
    border: 'rgba(212,160,23,0.22)',
    valueColor: colors.hubGoldDark,
    iconBg: '#FFF1C9',
    icon: colors.hubGoldDark,
    trend: colors.hubGoldDark,
  },
  warn: {
    bg: colors.warningMuted,
    border: 'rgba(232,155,46,0.22)',
    valueColor: colors.warning,
    iconBg: colors.warningMuted,
    icon: colors.warning,
    trend: colors.danger,
  },
} as const;

function ImpactMetricCell({ metric }: { metric: EndOfDayImpactMetric }) {
  const tone = TONE_STYLES[metric.tone];
  const iconName = METRIC_ICONS[metric.key] ?? 'analytics-outline';

  return (
    <View style={[styles.cell, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: tone.iconBg }]}>
        <Ionicons name={iconName} size={16} color={tone.icon} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: tone.valueColor }]} numberOfLines={1}>
          {metric.value}
        </Text>
        <Ionicons name="arrow-up" size={12} color={tone.trend} />
      </View>
    </View>
  );
}

export function EndOfDayReportImpactStrip({ metrics }: Props) {
  const visible = metrics.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, shadows.soft]}>
      <View style={styles.headingRow}>
        <Ionicons name="sparkles" size={14} color={colors.hubGoldDark} />
        <Text style={styles.heading} numberOfLines={1}>
          Bugünkü Ana Etki
        </Text>
      </View>
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: spacing.md,
    gap: spacing.sm,
    minWidth: 0,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
});
