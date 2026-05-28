import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardAvatar } from '@/features/leaderboard/components/LeaderboardAvatar';
import {
  formatLeaderboardScoreBpp,
  getEntryGemTier,
  getEntryTrendDirection,
} from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  rank: number;
  compact?: boolean;
};

const GEM_COLORS = {
  blue: colors.secondary,
  orange: colors.warning,
} as const;

export function LeaderboardRow({ entry, rank, compact = false }: LeaderboardRowProps) {
  const trend = getEntryTrendDirection(entry.id, rank);
  const gemTier = getEntryGemTier(entry.id);
  const gemColor = GEM_COLORS[gemTier];

  return (
    <View
      style={[
        styles.row,
        shadows.soft,
        entry.isCurrentPlayer && styles.rowCurrent,
        compact && styles.rowCompact,
      ]}>
      <Text style={[styles.rankNum, entry.isCurrentPlayer && styles.rankNumCurrent]}>
        {rank}
      </Text>

      <LeaderboardAvatar
        entryKey={entry.id}
        size={compact ? 40 : 44}
        borderColor={entry.isCurrentPlayer ? colors.primary : colors.border}
        borderWidth={2}
      />

      <View style={styles.mainCol}>
        <Text
          style={[styles.name, entry.isCurrentPlayer && styles.nameCurrent]}
          numberOfLines={1}>
          {entry.playerName}
          {entry.isCurrentPlayer ? ' (Sen)' : ''}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {entry.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {entry.neighborhoodName}
          </Text>
        </View>
      </View>

      <View style={styles.trailingCol}>
        <View style={styles.badgeRow}>
          <Ionicons name="diamond" size={14} color={gemColor} />
          {trend === 'up' ? (
            <Ionicons name="trending-up" size={14} color={colors.success} />
          ) : trend === 'down' ? (
            <Ionicons name="trending-down" size={14} color={colors.danger} />
          ) : (
            <Ionicons name="remove" size={14} color={colors.textSecondary} />
          )}
        </View>
        <Text style={[styles.score, entry.isCurrentPlayer && styles.scoreCurrent]}>
          {formatLeaderboardScoreBpp(entry.score)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rowCompact: {
    paddingVertical: 10,
  },
  rankNum: {
    width: 22,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rankNumCurrent: {
    color: colors.primary,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  nameCurrent: {
    color: colors.primary,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  location: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  trailingCol: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 88,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  score: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  scoreCurrent: {
    color: colors.primary,
  },
});
