import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthorityPermissionPreviewPanel } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionPreviewPanel';
import { LargeBadgePreviewCard } from '@/features/progression/components/authorities/LargeBadgePreviewCard';
import { WeeklyUnlockCard } from '@/features/progression/components/authorities/WeeklyUnlockCard';
import { WeeklyUnlockSectionHeader } from '@/features/progression/components/authorities/WeeklyUnlockSectionHeader';
import type { BadgePreviewModel } from '@/features/progression/utils/authorityCollectionPresentation';
import type { WeeklyUnlockItem } from '@/features/progression/utils/authoritiesScreenModel';
import { spacing } from '@/ui/theme/spacing';

type AuthoritiesTabPanelProps = {
  daysLeft: number;
  weeklyItems: WeeklyUnlockItem[];
  previewItems: BadgePreviewModel[];
  authorityState: unknown;
  pilotDay: number;
  totalXp?: number;
};

export function AuthoritiesTabPanel({
  daysLeft,
  weeklyItems,
  previewItems,
  authorityState,
  pilotDay,
  totalXp = 0,
}: AuthoritiesTabPanelProps) {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      <AuthorityPermissionPreviewPanel
        authorityState={authorityState}
        pilotDay={pilotDay}
        totalXp={totalXp}
      />

      <WeeklyUnlockSectionHeader daysLeft={daysLeft} />

      <View style={styles.grid}>
        {weeklyItems.map((item, index) => (
          <WeeklyUnlockCard key={item.id} item={item} index={index} />
        ))}
      </View>

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
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
