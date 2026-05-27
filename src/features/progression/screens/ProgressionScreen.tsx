import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthorityBadgeGrid } from '@/features/progression/components/authorities/AuthorityBadgeGrid';
import { BadgesTabPanel } from '@/features/progression/components/authorities/BadgesTabPanel';
import { CollectionProgressCard } from '@/features/progression/components/authorities/CollectionProgressCard';
import { ProgressionScreenIntro } from '@/features/progression/components/authorities/ProgressionScreenIntro';
import {
  ProgressionSegmentTabs,
  type ProgressionTabKey,
} from '@/features/progression/components/authorities/ProgressionSegmentTabs';
import { WeeklyUnlockablesSection } from '@/features/progression/components/authorities/WeeklyUnlockablesCard';
import { deriveAuthoritiesScreenModel } from '@/features/progression/utils/authoritiesScreenModel';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function ProgressionScreen() {
  const totalXp = useGameStore((s) => s.playerProgress?.totalXp ?? 0);
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const [tab, setTab] = useState<ProgressionTabKey>('authorities');

  const model = useMemo(
    () => deriveAuthoritiesScreenModel(totalXp, pilotDay),
    [totalXp, pilotDay],
  );

  return (
    <GameScreenShell
      screenTitle="Yetkiler"
      backgroundColor={colors.background}
      contentStyle={styles.content}>
      <ProgressionScreenIntro />
      <ProgressionSegmentTabs active={tab} onChange={setTab} />

      {tab === 'authorities' ? (
        <View style={styles.panel}>
          <CollectionProgressCard
            collected={model.collectionCollected}
            total={model.collectionTotal}
            progress={model.collectionProgress}
          />
          <WeeklyUnlockablesSection
            daysLeft={model.daysLeftThisWeek}
            items={model.weeklyItems}
          />
          <AuthorityBadgeGrid items={model.gridItems} />
        </View>
      ) : (
        <BadgesTabPanel
          collectionCollected={model.collectionCollected}
          collectionTotal={model.collectionTotal}
          collectionProgress={model.collectionProgress}
          badgeTabItems={model.badgeTabItems}
        />
      )}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  panel: {
    gap: spacing.lg,
  },
});
