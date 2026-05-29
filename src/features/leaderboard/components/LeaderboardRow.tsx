import { StyleSheet, Text, View } from 'react-native';

import { LeaderboardDynamicAvatar } from '@/features/leaderboard/components/LeaderboardDynamicAvatar';
import type { LeaderboardRowModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type LeaderboardRowProps = {
  model: LeaderboardRowModel;
  compact?: boolean;
};

export function LeaderboardRow({ model, compact = false }: LeaderboardRowProps) {
  return (
    <View
      style={[
        styles.row,
        shadows.soft,
        model.isCurrentPlayer && styles.rowCurrent,
        compact && styles.rowCompact,
      ]}>
      <Text
        style={[styles.rankNum, model.isCurrentPlayer && styles.rankNumCurrent]}
        numberOfLines={1}>
        {model.rankLabel}
      </Text>

      <LeaderboardDynamicAvatar
        avatar={model.avatar}
        size={compact ? 38 : 42}
        highlighted={model.isCurrentPlayer}
      />

      <View style={styles.mainCol}>
        <Text
          style={[styles.name, model.isCurrentPlayer && styles.nameCurrent]}
          numberOfLines={1}>
          {model.displayName}
          {model.isCurrentPlayer ? ' · Sen' : ''}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {model.subtitle}
        </Text>
      </View>

      <Text
        style={[styles.score, model.isCurrentPlayer && styles.scoreCurrent]}
        numberOfLines={1}>
        {model.scoreLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 0,
  },
  rowCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rowCompact: {
    paddingVertical: 8,
  },
  rankNum: {
    width: 24,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
    flexShrink: 0,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  nameCurrent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  score: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    maxWidth: '32%',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  scoreCurrent: {
    color: colors.primary,
  },
});
