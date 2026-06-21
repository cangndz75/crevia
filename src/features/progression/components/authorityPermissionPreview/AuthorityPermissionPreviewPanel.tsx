import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionDetailModal } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionDetailModal';
import { AuthorityPermissionItemCard } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionItemCard';
import { AuthorityManagementSummaryCard } from '@/features/progression/components/authorities/AuthorityManagementSummaryCard';
import { AuthorityPermissionStatusBar } from '@/features/progression/components/authorities/AuthorityPermissionStatusBar';
import { buildAuthorityPermissionsTabViewModel } from '@/features/progression/utils/authorityPermissionsTabPresentation';
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

  const viewModel = useMemo(
    () =>
      buildAuthorityPermissionsTabViewModel({
        authorityState,
        pilotDay,
        totalXp,
      }),
    [authorityState, pilotDay, totalXp],
  );

  const handleItemPress = (item: AuthorityPermissionPreviewItem) => {
    setSelectedItem(item);
  };

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <AuthorityManagementSummaryCard model={viewModel.managementCard} />

      <AuthorityPermissionStatusBar counts={viewModel.statusCounts} />

      <View style={styles.grid}>
        {viewModel.gridItems.map((item) => (
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
