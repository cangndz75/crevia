import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import { AuthoritiesTabPanel } from '@/features/progression/components/authorities/AuthoritiesTabPanel';
import {
  AuthorityTabsPill,
  type AuthorityTabKey,
} from '@/features/progression/components/authorities/AuthorityTabsPill';
import { BadgeShowcaseDetailModal } from '@/features/progression/components/badgeShowcase/BadgeShowcaseDetailModal';
import { BadgeShowcaseItemCard } from '@/features/progression/components/badgeShowcase/BadgeShowcaseItemCard';
import { DistrictExpansionItemCard } from '@/features/progression/components/districtExpansion/DistrictExpansionItemCard';
import { GrowthBadgeCollectionHero } from '@/features/progression/components/growth/GrowthBadgeCollectionHero';
import { GrowthNextUnlockCard } from '@/features/progression/components/growth/GrowthNextUnlockCard';
import { GrowthManagerStyleCard } from '@/features/progression/components/growth/GrowthManagerStyleCard';
import { GrowthPeriodFocusCard } from '@/features/progression/components/growth/GrowthPeriodFocusCard';
import { GrowthScreenHeader } from '@/features/progression/components/growth/GrowthScreenHeader';
import { GrowthSectionHeader } from '@/features/progression/components/growth/GrowthSectionHeader';
import { GrowthUnlockNetworkHero } from '@/features/progression/components/growth/GrowthUnlockNetworkHero';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { buildDominantStrategyDetector } from '@/core/dominantStrategyDetector';
import { buildDominantStrategyInputFromPersistedHistory } from '@/core/strategyHistory/strategyHistoryModel';
import { buildGrowthScreenPresentation } from '@/features/progression/utils/growthScreenPresentation';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { spacing } from '@/ui/theme/spacing';

export function ProgressionScreen() {
  const status = useGameStatus();
  const totalXp = useGameStore((s) => s.playerProgress?.totalXp ?? 0);
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const badgeState = useGameStore((s) => s.gameState.pilot.badgeState);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const gameDay = useGameStore((s) => s.gameState.city.day);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const socialPulse = useGameStore((s) => s.socialPulseState);
  const dailyGoalState = useGameStore((s) => s.dailyGoalState);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const strategyHistory = useGameStore((s) => s.strategyHistory);
  const maintenanceBacklogRuntime = useGameStore((s) => s.maintenanceBacklogRuntime);
  const [tab, setTab] = useState<AuthorityTabKey>('authorities');
  const [selectedBadge, setSelectedBadge] = useState<BadgeShowcaseItem | null>(null);

  const presentation = useMemo(() => {
    const dominantStrategy = buildDominantStrategyDetector(
      buildDominantStrategyInputFromPersistedHistory(strategyHistory, gameDay),
    );
    return buildGrowthScreenPresentation({
      totalXp,
      pilotDay,
      gameDay,
      playerName: status.playerName,
      role: status.role,
      level: status.level,
      metaLine: `${status.currentDay}. Gün · ${status.selectedDistrictName}`,
      resourceLabel: status.budgetFormatted,
      xp: status.xp,
      xpTarget: status.xpTarget,
      xpProgress: status.xpProgress,
      authorityState,
      badgeState,
      dailyGoalState,
      mainOperationSeason,
      operationSignals,
      socialPulse,
      decisionHistory: decisionHistory.map((record) => ({
        day: record.day,
        decisionLabel: record.decisionLabel,
        eventTitle: record.eventTitle,
      })),
      strategyHistory,
      dominantStrategy,
      maintenanceBacklogRuntime,
      socialPulseState: socialPulse,
    });
  }, [
    authorityState,
    badgeState,
    dailyGoalState,
    decisionHistory,
    gameDay,
    maintenanceBacklogRuntime,
    mainOperationSeason,
    operationSignals,
    pilotDay,
    socialPulse,
    status,
    strategyHistory,
    totalXp,
  ]);

  return (
    <GameScreenShell
      headerVariant="none"
      backgroundColor={growth.canvas}
      contentStyle={styles.content}
      reserveTabBarInset>
      <GrowthScreenHeader model={presentation.header} />

      {presentation.managerStyle.visible ? (
        <GrowthManagerStyleCard model={presentation.managerStyle} />
      ) : null}

      <GrowthPeriodFocusCard model={presentation.periodFocus} />

      <View style={styles.tabBarSlot}>
        <AuthorityTabsPill active={tab} onChange={setTab} />
      </View>

      {tab === 'authorities' ? (
        <AuthoritiesTabPanel model={presentation.authoritiesTab} />
      ) : tab === 'badges' ? (
        <Animated.View entering={FadeIn.duration(280)} style={styles.tabPanel}>
          <GrowthBadgeCollectionHero {...presentation.badgesTab.hero} />
          <GrowthSectionHeader title="Hedef Rozetler" />
          <View style={styles.badgeGrid}>
            {presentation.badgesTab.badgeItems.map((item) => (
              <BadgeShowcaseItemCard
                key={item.id}
                item={item}
                grid
                onPress={setSelectedBadge}
              />
            ))}
          </View>
          <BadgeShowcaseDetailModal
            item={selectedBadge}
            visible={selectedBadge != null}
            onClose={() => setSelectedBadge(null)}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(280)} style={styles.tabPanel}>
          <GrowthUnlockNetworkHero {...presentation.expansionsTab.hero} />
          <GrowthSectionHeader
            title="Mahalle Açılımları"
            countLabel={presentation.expansionsTab.countLabel}
          />
          <View style={styles.expansionList}>
            {presentation.expansionsTab.districtItems.map((item) => (
              <DistrictExpansionItemCard key={item.id} item={item} />
            ))}
          </View>
          <GrowthNextUnlockCard model={presentation.expansionsTab.nextUnlock} />
        </Animated.View>
      )}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: growth.sectionGap,
    paddingTop: spacing.xs,
  },
  tabBarSlot: {
    position: 'relative',
    zIndex: 20,
    elevation: 20,
  },
  tabPanel: {
    gap: growth.sectionGap,
    paddingBottom: spacing.xl,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    columnGap: spacing.sm,
  },
  expansionList: {
    gap: 10,
  },
});
