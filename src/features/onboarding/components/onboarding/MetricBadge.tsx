import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { FloatingMetricData } from '@/features/onboarding/data/onboardingData';
import { MiniTrendSparkline } from '@/features/onboarding/components/onboarding/MiniTrendSparkline';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { onboardingRadii } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

type MetricBadgeProps = {
  metric: FloatingMetricData;
  compact?: boolean;
};

export function MetricBadge({ metric, compact }: MetricBadgeProps) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={[styles.iconWrap, { backgroundColor: metric.accentMuted }]}>
        <Ionicons name={metric.icon} size={compact ? 12 : 14} color={metric.accent} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {metric.label}
      </Text>
      <Text style={styles.value}>{metric.value}</Text>
      {metric.trend ? (
        <View style={styles.trendRow}>
          <Text
            style={[
              styles.trend,
              { color: metric.trendUp ? onboardingTokens.success : onboardingTokens.dangerSoft },
            ]}>
            {metric.trend}
          </Text>
          <MiniTrendSparkline color={metric.accent} up={metric.trendUp} />
        </View>
      ) : (
        <MiniTrendSparkline color={metric.accent} up={metric.trendUp ?? true} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.md,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: spacing.sm,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    minWidth: 96,
  },
  compact: {
    minWidth: 88,
    padding: 6,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: onboardingTokens.textMain,
    letterSpacing: -0.2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  trend: {
    fontSize: 9,
    fontWeight: '700',
  },
});
