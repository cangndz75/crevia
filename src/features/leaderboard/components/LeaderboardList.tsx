import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardListProps = {
  listEntries: LeaderboardEntry[];
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
  listEntries,
  entries,
  currentEntry,
  rank,
  showSeparateCurrentRow,
}: LeaderboardListProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.list}>
        {listEntries.map((entry) => (
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
    gap: 8,
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
