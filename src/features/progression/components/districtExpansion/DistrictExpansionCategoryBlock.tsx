import { StyleSheet, Text, View } from 'react-native';

import type { DistrictUnlockCategoryBlock } from '@/core/progression/districtOperationUnlockBindingTypes';
import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionItemCard } from '@/features/progression/components/districtExpansion/DistrictExpansionItemCard';
import { DISTRICT_EXPANSION_THEME } from '@/features/progression/utils/districtExpansionTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionCategoryBlockProps = {
  block: DistrictUnlockCategoryBlock;
  onItemPress?: (item: DistrictUnlockBindingItem) => void;
};

export function DistrictExpansionCategoryBlock({
  block,
  onItemPress,
}: DistrictExpansionCategoryBlockProps) {
  if (block.totalCount === 0) {
    return null;
  }

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
          {block.activeCount}/{block.totalCount}
        </Text>
      </View>

      {block.previewItems.length > 0 ? (
        <View style={styles.grid}>
          {block.previewItems.map((item) => (
            <DistrictExpansionItemCard
              key={item.id}
              item={item}
              compact
              onPress={onItemPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: DISTRICT_EXPANSION_THEME.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: DISTRICT_EXPANSION_THEME.border,
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
    color: DISTRICT_EXPANSION_THEME.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 15,
  },
  count: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    flexShrink: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
