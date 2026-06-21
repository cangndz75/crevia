import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildAuthorityPermissionPreviewSummary } from '@/core/authority/authorityPermissionPreviewModel';
import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionDetailModal } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionDetailModal';
import { AuthorityPermissionItemCard } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionItemCard';
import { ProgressionSectionHeader } from '@/features/progression/components/authorities/ProgressionSectionHeader';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionPreviewPanelProps = {
  authorityState: unknown;
  pilotDay: number;
  totalXp?: number;
};

export function AuthorityPermissionPreviewPanel({
  authorityState,
  pilotDay,
  totalXp = 0,
}: AuthorityPermissionPreviewPanelProps) {
  const [selectedItem, setSelectedItem] = useState<AuthorityPermissionPreviewItem | null>(null);

  const summary = useMemo(
    () =>
      buildAuthorityPermissionPreviewSummary({
        authorityState,
        day: pilotDay,
        xp: totalXp,
      }),
    [authorityState, pilotDay, totalXp],
  );

  const handleItemPress = (item: AuthorityPermissionPreviewItem) => {
    setSelectedItem(item);
  };

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <ProgressionSectionHeader
        title="Yetki İzinleri"
        countLabel={summary.activeCountLabel}
        icon="ribbon-outline"
      />

      <View style={styles.grid}>
        {summary.allItems.map((item) => (
          <AuthorityPermissionItemCard
            key={item.id}
            item={item}
            grid
            onPress={handleItemPress}
          />
        ))}
      </View>

      <AuthorityPermissionDetailModal
        item={selectedItem}
        visible={selectedItem != null}
        onClose={() => setSelectedItem(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    columnGap: spacing.sm,
  },
});
