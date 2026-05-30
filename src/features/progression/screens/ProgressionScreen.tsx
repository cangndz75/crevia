import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthoritiesTabPanel } from '@/features/progression/components/authorities/AuthoritiesTabPanel';
import {
  AuthorityTabsPill,
  type AuthorityTabKey,
} from '@/features/progression/components/authorities/AuthorityTabsPill';
import { BadgesTabPanel } from '@/features/progression/components/authorities/BadgesTabPanel';
import { CollectionProgressHeroCard } from '@/features/progression/components/authorities/CollectionProgressHeroCard';
import {
  AUTHORITY_COLLECTION_THEME,
  buildAuthorityBadgePreviewModels,
  buildCollectionHeroModel,
  buildWeeklyUnlockModels,
} from '@/features/progression/utils/authorityCollectionPresentation';
import { deriveAuthoritiesScreenModel } from '@/features/progression/utils/authoritiesScreenModel';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { spacing } from '@/ui/theme/spacing';

export function ProgressionScreen() {
  const totalXp = useGameStore((s) => s.playerProgress?.totalXp ?? 0);
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const badgeState = useGameStore((s) => s.gameState.pilot.badgeState);
  const [tab, setTab] = useState<AuthorityTabKey>('authorities');

  const model = useMemo(
    () => deriveAuthoritiesScreenModel(totalXp, pilotDay),
    [totalXp, pilotDay],
  );

  const heroModel = useMemo(
    () =>
      buildCollectionHeroModel(badgeState, pilotDay, {
        collected: model.collectionCollected,
        total: model.collectionTotal,
        progress: model.collectionProgress,
      }),
    [badgeState, pilotDay, model.collectionCollected, model.collectionProgress, model.collectionTotal],
  );

  const weeklyItems = useMemo(
    () => buildWeeklyUnlockModels(model.weeklyItems),
    [model.weeklyItems],
  );

  const previewItems = useMemo(
    () => buildAuthorityBadgePreviewModels(model.gridItems),
    [model.gridItems],
  );

  return (
    <GameScreenShell
      screenTitle="Yetkiler"
      backgroundColor={AUTHORITY_COLLECTION_THEME.screenBg}
      contentStyle={styles.content}>
      <CollectionProgressHeroCard {...heroModel} />
      <AuthorityTabsPill active={tab} onChange={setTab} />

      {tab === 'authorities' ? (
        <AuthoritiesTabPanel
          daysLeft={model.daysLeftThisWeek}
          weeklyItems={weeklyItems}
          previewItems={previewItems}
        />
      ) : (
        <BadgesTabPanel badgeTabItems={model.badgeTabItems} />
      )}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
    paddingTop: spacing.sm,
  },
});
