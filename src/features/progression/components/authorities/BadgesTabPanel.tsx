import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthorityBadgeGrid } from '@/features/progression/components/authorities/AuthorityBadgeGrid';
import { CollectionProgressCard } from '@/features/progression/components/authorities/CollectionProgressCard';
import type { AuthoritiesScreenModel } from '@/features/progression/utils/authoritiesScreenModel';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type BadgesTabPanelProps = Pick<
  AuthoritiesScreenModel,
  | 'collectionCollected'
  | 'collectionTotal'
  | 'collectionProgress'
  | 'badgeTabItems'
>;

export function BadgesTabPanel({
  collectionCollected,
  collectionTotal,
  collectionProgress,
  badgeTabItems,
}: BadgesTabPanelProps) {
  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <CollectionProgressCard
        collected={collectionCollected}
        total={collectionTotal}
        progress={collectionProgress}
      />
      <Text style={styles.sectionLabel}>Rozet Koleksiyonun</Text>
      <Text style={styles.sectionHint}>
        Aktif yetkiler ve yakında açılacak sistemler rozet olarak koleksiyonuna
        eklenir.
      </Text>
      <AuthorityBadgeGrid items={badgeTabItems} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  sectionLabel: {
    ...typography.subtitle,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionHint: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
});
