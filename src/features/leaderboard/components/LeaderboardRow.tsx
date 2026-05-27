import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import {
  formatLeaderboardScore,
  PODIUM_RANK_STYLES,
} from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  rank: number;
  compact?: boolean;
};

export function LeaderboardRow({ entry, rank, compact = false }: LeaderboardRowProps) {
  const podium = rank <= 3 ? PODIUM_RANK_STYLES[rank as 1 | 2 | 3] : null;

  return (
    <View
      style={[
        styles.row,
        entry.isCurrentPlayer && styles.rowCurrent,
        compact && styles.rowCompact,
      ]}>
      <View
        style={[
          styles.rankBadge,
          podium ? { backgroundColor: podium.bg, borderColor: podium.accent } : null,
        ]}>
        <Text
          style={[
            styles.rankText,
            podium ? { color: podium.accent } : null,
            entry.isCurrentPlayer && !podium ? styles.rankTextCurrent : null,
          ]}>
          {rank}
        </Text>
      </View>

      <View style={styles.mainCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, entry.isCurrentPlayer && styles.nameCurrent]} numberOfLines={1}>
            {entry.playerName}
            {entry.isCurrentPlayer ? ' (Sen)' : ''}
          </Text>
          {podium ? (
            <Ionicons name="medal-outline" size={14} color={podium.accent} />
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {entry.title} · {entry.neighborhoodName}
        </Text>
      </View>

      <View style={styles.scoreCol}>
        <Text style={[styles.score, entry.isCurrentPlayer && styles.scoreCurrent]}>
          {formatLeaderboardScore(entry.score)}
        </Text>
        {entry.isCurrentPlayer ? (
          <Text style={styles.youTag}>Sen</Text>
        ) : (
          <Text style={styles.trendHint}>BPP</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCurrent: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  rowCompact: {
    paddingVertical: 8,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  rankTextCurrent: {
    color: colors.primary,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  nameCurrent: {
    color: colors.primary,
  },
  meta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scoreCol: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 58,
  },
  score: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  scoreCurrent: {
    color: colors.primary,
  },
  youTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  trendHint: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
});
