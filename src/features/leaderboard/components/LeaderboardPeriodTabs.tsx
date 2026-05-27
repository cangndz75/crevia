import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardPeriod } from '@/core/leaderboard/leaderboardTypes';
import { LEADERBOARD_PERIOD_OPTIONS } from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardPeriodTabsProps = {
  value: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
};

export function LeaderboardPeriodTabs({
  value,
  onChange,
}: LeaderboardPeriodTabsProps) {
  return (
    <View style={styles.wrap}>
      {LEADERBOARD_PERIOD_OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: 3,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
});
