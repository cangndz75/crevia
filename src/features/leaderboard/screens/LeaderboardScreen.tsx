import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LeaderboardCategory, LeaderboardPeriod } from '@/core/leaderboard/leaderboardTypes';
import { LeaderboardCategoryTabs } from '@/features/leaderboard/components/LeaderboardCategoryTabs';
import { LeaderboardEmptyState } from '@/features/leaderboard/components/LeaderboardEmptyState';
import { LeaderboardHeader } from '@/features/leaderboard/components/LeaderboardHeader';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { LeaderboardPeriodTabs } from '@/features/leaderboard/components/LeaderboardPeriodTabs';
import { LeaderboardPlayerHighlightCard } from '@/features/leaderboard/components/LeaderboardPlayerHighlightCard';
import { LeaderboardPodiumStrip } from '@/features/leaderboard/components/LeaderboardPodiumStrip';
import { LeaderboardPrestigeHero } from '@/features/leaderboard/components/LeaderboardPrestigeHero';
import { useLeaderboardScreenData } from '@/features/leaderboard/hooks/useLeaderboardScreenData';
import {
  buildLeaderboardRowModels,
  buildLeaderboardScreenPresentation,
} from '@/features/leaderboard/utils/leaderboardPresentation';
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

  const presentation = useMemo(
    () =>
      buildLeaderboardScreenPresentation({
        entries: data.entries,
        listEntries: data.listEntries,
        topThree: data.topThree,
        bestEntry: data.bestEntry,
        currentEntry: data.currentEntry,
        rank: data.rank,
        hasPlayerScore: data.hasPlayerScore,
      }),
    [data],
  );

  const highlightRow = useMemo(() => {
    if (!data.showSeparateCurrentRow || !data.currentEntry || data.rank == null) {
      return null;
    }
    const allRows = buildLeaderboardRowModels(data.entries);
    return (
      allRows.find((row) => row.isCurrentPlayer) ?? {
        rankLabel: String(data.rank),
        displayName: data.currentEntry.playerName,
        scoreLabel: presentation.playerHighlight.scoreLabel,
        subtitle: `${data.currentEntry.title} · ${data.currentEntry.neighborhoodName}`,
        avatar: presentation.playerHighlight.avatar,
        isCurrentPlayer: true,
      }
    );
  }, [data, presentation.playerHighlight]);

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
        <LeaderboardPrestigeHero model={presentation.hero} />

        {presentation.podium.length > 0 ? (
          <LeaderboardPodiumStrip podium={presentation.podium} />
        ) : null}

        <LeaderboardPlayerHighlightCard model={presentation.playerHighlight} />

        <LeaderboardCategoryTabs value={category} onChange={setCategory} />
        <LeaderboardPeriodTabs value={period} onChange={setPeriod} />

        <LeaderboardList
          rows={presentation.rows}
          highlightRow={highlightRow}
          showSeparateHighlight={data.showSeparateCurrentRow}
        />

        {presentation.showEmptyState ? (
          <LeaderboardEmptyState
            message={presentation.emptyMessage}
            ctaLabel={presentation.emptyCtaLabel}
            onGoHub={handleGoHub}
          />
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
});
