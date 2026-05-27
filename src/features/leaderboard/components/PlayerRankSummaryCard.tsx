import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import {
  formatLeaderboardScore,
  getPerformanceComment,
} from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type PlayerRankSummaryCardProps = {
  entry: LeaderboardEntry;
  rank: number | null;
};

export function PlayerRankSummaryCard({ entry, rank }: PlayerRankSummaryCardProps) {
  const rankLabel = rank != null ? `#${rank}` : '—';

  return (
    <View style={[styles.outer, shadows.card]}>
      <LinearGradient
        colors={['#1A7F7B', '#1A8F8A', '#2BB5A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.topRow}>
          <View style={styles.rankPill}>
            <Text style={styles.rankText}>{rankLabel}</Text>
          </View>
          <Text style={styles.scoreLabel}>Belediye Performans Puanı</Text>
        </View>

        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.score}>{formatLeaderboardScore(entry.score)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.neighborhood}>{entry.neighborhoodName}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaHint}>
            Zorluk x{entry.difficultyMultiplier.toFixed(2)}
          </Text>
        </View>

        <Text style={styles.comment}>{getPerformanceComment(entry.score)}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
  },
  gradient: {
    padding: spacing.md,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rankPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  scoreLabel: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  score: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -1,
    lineHeight: 38,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  neighborhood: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
  metaDot: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  metaHint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  comment: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 16,
  },
});
