import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { SocialPulseSummary } from '../utils/socialUiModel';

type Props = { data: SocialPulseSummary };

function MiniTrendLine({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const h = 28;
  const w = 56;
  const step = w / (points.length - 1);

  return (
    <View style={{ width: w, height: h }}>
      {points.map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x - 1.5,
              top: y - 1.5,
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.primary,
            }}
          />
        );
      })}
    </View>
  );
}

function KpiPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.kpiPill}>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function SocialPulseSummaryCard({ data }: Props) {
  const trendColor = data.trendDelta >= 0 ? colors.success : colors.danger;
  const trendSign = data.trendDelta >= 0 ? '+' : '';
  const statusBg =
    data.score >= 70
      ? colors.successMuted
      : data.score >= 50
        ? colors.warningMuted
        : colors.dangerMuted;
  const statusColor =
    data.score >= 70
      ? colors.success
      : data.score >= 50
        ? colors.warning
        : colors.danger;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View style={styles.headerLabel}>
            <Ionicons name="pulse-outline" size={14} color={colors.primary} />
            <Text style={styles.headerText}>GENEL SOSYAL NABIZ</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreBig}>{data.score}</Text>
            <Text style={styles.scoreMax}>/ {data.maxScore}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {data.statusLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={1}>
            {data.description}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <MiniTrendLine points={data.weeklyTrend} />
          <View style={styles.kpiRow}>
            <KpiPill
              label="Trend"
              value={`${trendSign}${data.trendDelta}`}
              color={trendColor}
            />
            <KpiPill
              label="Memnun"
              value={`${data.satisfactionPercent}%`}
              color={colors.primary}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    flexWrap: 'wrap',
  },
  scoreBig: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  scoreMax: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginLeft: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiPill: {
    alignItems: 'center',
    gap: 1,
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
