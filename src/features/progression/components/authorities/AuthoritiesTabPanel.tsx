import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GrowthAuthorityProgressCard } from '@/features/progression/components/growth/GrowthAuthorityProgressCard';
import { GrowthDailyTasksSection } from '@/features/progression/components/growth/GrowthDailyTasksSection';
import { GrowthNextTargetCard } from '@/features/progression/components/growth/GrowthNextTargetCard';
import { GrowthRecentAuthoritiesStrip } from '@/features/progression/components/growth/GrowthRecentAuthoritiesStrip';
import type { GrowthAuthoritiesTabModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';

type AuthoritiesTabPanelProps = {
  model: GrowthAuthoritiesTabModel;
};

export function AuthoritiesTabPanel({ model }: AuthoritiesTabPanelProps) {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      <GrowthAuthorityProgressCard model={model.authorityProgress} />
      <GrowthRecentAuthoritiesStrip items={model.recentAuthorities} />
      <GrowthNextTargetCard model={model.nextTarget} />
      <GrowthDailyTasksSection tasks={model.dailyTasks} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: growth.sectionGap,
    paddingBottom: 8,
  },
});
