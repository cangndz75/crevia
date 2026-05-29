import { StyleSheet, Text, View } from 'react-native';

import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow';
import type { LeaderboardRowModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { LEADERBOARD_UI_COPY } from '@/features/leaderboard/utils/leaderboardPresentation';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardListProps = {
  rows: LeaderboardRowModel[];
  highlightRow?: LeaderboardRowModel | null;
  showSeparateHighlight?: boolean;
};

export function LeaderboardList({
  rows,
  highlightRow,
  showSeparateHighlight = false,
}: LeaderboardListProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {LEADERBOARD_UI_COPY.listSection}
      </Text>
      <View style={styles.list}>
        {rows.map((model) => (
          <LeaderboardRow key={`${model.rankLabel}-${model.displayName}`} model={model} />
        ))}
      </View>

      {showSeparateHighlight && highlightRow ? (
        <View style={styles.highlightWrap}>
          <Text style={styles.highlightLabel} numberOfLines={1}>
            {LEADERBOARD_UI_COPY.yourRank}
          </Text>
          <LeaderboardRow model={highlightRow} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  list: {
    gap: 8,
  },
  highlightWrap: {
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});
