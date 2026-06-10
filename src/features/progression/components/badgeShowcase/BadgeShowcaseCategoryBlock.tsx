import { StyleSheet, Text, View } from 'react-native';

import type {
  BadgeShowcaseCategoryBlock as BadgeShowcaseCategoryBlockModel,
  BadgeShowcaseItem,
} from '@/core/badges/badgeShowcaseTypes';
import { BadgeShowcaseItemCard } from '@/features/progression/components/badgeShowcase/BadgeShowcaseItemCard';
import { BADGE_SHOWCASE_THEME } from '@/features/progression/utils/badgeShowcaseTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type BadgeShowcaseCategoryBlockProps = {
  block: BadgeShowcaseCategoryBlockModel;
  onItemPress?: (item: BadgeShowcaseItem) => void;
};

export function BadgeShowcaseCategoryBlock({
  block,
  onItemPress,
}: BadgeShowcaseCategoryBlockProps) {
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{block.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {block.subtitle}
          </Text>
        </View>
        <Text style={styles.count}>
          {block.earnedCount}/{block.totalCount}
        </Text>
      </View>

      <View style={styles.grid}>
        {block.previewItems.map((item) => (
          <BadgeShowcaseItemCard
            key={item.id}
            item={item}
            compact
            onPress={onItemPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: BADGE_SHOWCASE_THEME.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: BADGE_SHOWCASE_THEME.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 15,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
