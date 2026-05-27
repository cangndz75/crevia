import { StyleSheet, View } from 'react-native';

import { AuthorityBadgeCard } from '@/features/progression/components/authorities/AuthorityBadgeCard';
import type { AuthorityGridItem } from '@/features/progression/utils/authoritiesScreenModel';
import { spacing } from '@/ui/theme/spacing';

type AuthorityBadgeGridProps = {
  items: AuthorityGridItem[];
};

export function AuthorityBadgeGrid({ items }: AuthorityBadgeGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <AuthorityBadgeCard key={item.id} item={item} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
