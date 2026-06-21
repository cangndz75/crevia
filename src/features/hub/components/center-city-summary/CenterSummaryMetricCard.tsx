import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { centerSummaryTokens as tokens } from '@/features/hub/theme/centerCitySummaryTokens';
import type { CenterSummaryMetricView } from '@/features/hub/utils/centerCitySummaryUiPresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const accentColors = {
  green: {
    icon: tokens.colors.green,
    value: tokens.colors.deepGreen,
    bar: tokens.colors.green,
    iconBg: 'rgba(63, 143, 90, 0.14)',
  },
  gold: {
    icon: tokens.colors.gold,
    value: '#8A6A12',
    bar: tokens.colors.gold,
    iconBg: 'rgba(215, 169, 40, 0.16)',
  },
  blue: {
    icon: tokens.colors.blue,
    value: tokens.colors.blue,
    bar: tokens.colors.blue,
    iconBg: 'rgba(47, 111, 180, 0.14)',
  },
} as const;

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'people-outline': 'people-outline',
    'construct-outline': 'construct-outline',
    'happy-outline': 'happy-outline',
    'flag-outline': 'flag-outline',
    'pulse-outline': 'pulse-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'star-outline': 'star-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type CenterSummaryMetricCardProps = {
  metric: CenterSummaryMetricView;
  compact?: boolean;
};

export function CenterSummaryMetricCard({ metric, compact = false }: CenterSummaryMetricCardProps) {
  const accent = accentColors[metric.accent];
  const iconSize = compact ? 14 : 16;
  const iconCircle = compact ? 26 : 30;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={metric.accessibilityLabel}>
      <View
        style={[
          styles.iconCircle,
          {
            width: iconCircle,
            height: iconCircle,
            borderRadius: iconCircle / 2,
            backgroundColor: accent.iconBg,
          },
        ]}>
        <Ionicons name={resolveIcon(metric.iconKey)} size={iconSize} color={accent.icon} />
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
        {metric.label}
      </Text>

      <View style={styles.valueRow}>
        <Text
          style={[styles.value, compact && styles.valueCompact, { color: accent.value }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}>
          {metric.valueText}
        </Text>
        {metric.trendUp ? (
          <Text style={[styles.trend, { color: accent.value }]} accessibilityElementsHidden>
            ↑
          </Text>
        ) : null}
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${metric.percent}%`,
              backgroundColor: accent.bar,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.metricCard,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: tokens.colors.muted,
    minHeight: 26,
  },
  titleCompact: {
    fontSize: 10,
    lineHeight: 12,
    minHeight: 24,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  valueCompact: {
    fontSize: 20,
    lineHeight: 22,
  },
  trend: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 78, 69, 0.08)',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
