import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { LeaderboardCategory } from '@/core/leaderboard/leaderboardTypes';
import { LEADERBOARD_CATEGORY_OPTIONS } from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardCategoryTabsProps = {
  value: LeaderboardCategory;
  onChange: (category: LeaderboardCategory) => void;
};

export function LeaderboardCategoryTabs({
  value,
  onChange,
}: LeaderboardCategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {LEADERBOARD_CATEGORY_OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Ionicons
              name={option.icon}
              size={14}
              color={active ? colors.textInverse : colors.textSecondary}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
