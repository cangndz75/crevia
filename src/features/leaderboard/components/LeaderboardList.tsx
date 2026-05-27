import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardListProps = {
  topTen: LeaderboardEntry[];
  entries: LeaderboardEntry[];
  currentEntry: LeaderboardEntry | null;
  rank: number | null;
  showSeparateCurrentRow: boolean;
};

function resolveRank(entries: LeaderboardEntry[], entryId: string): number {
  const index = entries.findIndex((item) => item.id === entryId);
  return index >= 0 ? index + 1 : 0;
}

export function LeaderboardList({
  topTen,
  entries,
  currentEntry,
  rank,
  showSeparateCurrentRow,
}: LeaderboardListProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Sıralama</Text>
        <Text style={styles.caption}>İlk 10 · yerel mock liste</Text>
      </View>

      <View style={styles.list}>
        {topTen.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={resolveRank(entries, entry.id)}
          />
        ))}
      </View>

      {showSeparateCurrentRow && currentEntry && rank != null ? (
        <View style={styles.yourRankWrap}>
          <Text style={styles.yourRankLabel}>Senin sıran</Text>
          <LeaderboardRow entry={currentEntry} rank={rank} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  list: {
    gap: 8,
  },
  yourRankWrap: {
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  yourRankLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.2,
  },
});
