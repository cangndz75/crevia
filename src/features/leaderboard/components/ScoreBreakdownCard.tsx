import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardScoreBreakdown } from '@/core/leaderboard/leaderboardTypes';
import {
  BREAKDOWN_LABELS,
  getBreakdownHighlights,
} from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ScoreBreakdownCardProps = {
  breakdown: LeaderboardScoreBreakdown;
};

function BreakdownBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
      </View>
    </View>
  );
}

export function ScoreBreakdownCard({ breakdown }: ScoreBreakdownCardProps) {
  const { strongest, weakest } = getBreakdownHighlights(breakdown);
  const rows = Object.entries(breakdown) as Array<
    [keyof LeaderboardScoreBreakdown, number]
  >;

  return (
    <View style={[styles.card, shadows.soft]}>
      <Text style={styles.title}>Skor Kırılımı</Text>
      <Text style={styles.subtitle}>Belediye Performans Puanı bileşenleri (0–100)</Text>

      <View style={styles.bars}>
        {rows.map(([key, value]) => (
          <BreakdownBar key={key} label={BREAKDOWN_LABELS[key]} value={value} />
        ))}
      </View>

      <View style={styles.insights}>
        <Text style={styles.insightStrong}>
          Güçlü alan: {strongest.label}
        </Text>
        <Text style={styles.insightWeak}>
          Gelişim alanı: {weakest.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: -6,
  },
  bars: {
    gap: 8,
  },
  barRow: {
    gap: 4,
  },
  barHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  insights: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  insightStrong: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  insightWeak: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
});
