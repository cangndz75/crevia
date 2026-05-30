import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { LargeBadgePreviewCard } from '@/features/progression/components/authorities/LargeBadgePreviewCard';
import {
  buildAuthorityBadgePreviewModels,
  type BadgePreviewModel,
} from '@/features/progression/utils/authorityCollectionPresentation';
import type { AuthorityGridItem } from '@/features/progression/utils/authoritiesScreenModel';
import { spacing } from '@/ui/theme/spacing';

type BadgesTabPanelProps = {
  badgeTabItems: AuthorityGridItem[];
};

export function BadgesTabPanel({ badgeTabItems }: BadgesTabPanelProps) {
  const previewItems: BadgePreviewModel[] = buildAuthorityBadgePreviewModels(badgeTabItems);

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={styles.grid}>
        {previewItems.map((item, index) => (
          <LargeBadgePreviewCard key={item.id} item={item} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
