import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LeaderboardCategory, LeaderboardPeriod } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardCategoryTabs } from '@/features/leaderboard/components/LeaderboardCategoryTabs';
import { LeaderboardEmptyState } from '@/features/leaderboard/components/LeaderboardEmptyState';
import { LeaderboardHeader } from '@/features/leaderboard/components/LeaderboardHeader';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { LeaderboardPeriodTabs } from '@/features/leaderboard/components/LeaderboardPeriodTabs';
import { LeaderboardPodium } from '@/features/leaderboard/components/LeaderboardPodium';
import { LeaderboardStatsRow } from '@/features/leaderboard/components/LeaderboardStatsRow';
import { useLeaderboardScreenData } from '@/features/leaderboard/hooks/useLeaderboardScreenData';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const data = useLeaderboardScreenData(category, period);

  const handleGoHub = () => {
    router.push('/');
  };

  return (
    <View style={styles.root}>
      <LeaderboardHeader onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md) + tabBarHeight,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <LeaderboardPodium topThree={data.topThree} />

        <View style={styles.statsGap}>
          <LeaderboardStatsRow stats={data.stats} />
        </View>

        <LeaderboardCategoryTabs value={category} onChange={setCategory} />
        <LeaderboardPeriodTabs value={period} onChange={setPeriod} />

        <LeaderboardList
          listEntries={data.listEntries}
          entries={data.entries}
          currentEntry={data.currentEntry}
          rank={data.rank}
          showSeparateCurrentRow={data.showSeparateCurrentRow}
        />

        {!data.hasPlayerScore ? (
          <LeaderboardEmptyState onGoHub={handleGoHub} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingTop: 0,
  },
  statsGap: {
    marginTop: 6,
  },
});
