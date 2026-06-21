import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthoritiesTabPanel } from '@/features/progression/components/authorities/AuthoritiesTabPanel';
import {
  AuthorityTabsPill,
  type AuthorityTabKey,
} from '@/features/progression/components/authorities/AuthorityTabsPill';
import { BadgeShowcasePanel } from '@/features/progression/components/badgeShowcase/BadgeShowcasePanel';
import { DistrictExpansionBindingPanel } from '@/features/progression/components/districtExpansion/DistrictExpansionBindingPanel';
import { CollectionProgressHeroCard } from '@/features/progression/components/authorities/CollectionProgressHeroCard';
import {
  AUTHORITY_COLLECTION_THEME,
  buildCollectionHeroModel,
} from '@/features/progression/utils/authorityCollectionPresentation';
import { deriveAuthoritiesScreenModel } from '@/features/progression/utils/authoritiesScreenModel';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { spacing } from '@/ui/theme/spacing';

export function ProgressionScreen() {
  const totalXp = useGameStore((s) => s.playerProgress?.totalXp ?? 0);
  const pilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);
  const badgeState = useGameStore((s) => s.gameState.pilot.badgeState);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const gameDay = useGameStore((s) => s.gameState.city.day);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const socialPulse = useGameStore((s) => s.socialPulseState);
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

  return (
    <GameScreenShell
      screenTitle="Başarılar"
      backgroundColor={AUTHORITY_COLLECTION_THEME.screenBg}
      contentStyle={styles.content}>
      <CollectionProgressHeroCard {...heroModel} />
      <AuthorityTabsPill active={tab} onChange={setTab} />

      {tab === 'authorities' ? (
        <AuthoritiesTabPanel
          authorityState={authorityState}
          pilotDay={pilotDay}
          totalXp={totalXp}
        />
      ) : tab === 'badges' ? (
        <BadgeShowcasePanel badgeState={badgeState} pilotDay={pilotDay} />
      ) : (
        <DistrictExpansionBindingPanel
          currentDay={gameDay}
          pilotDay={pilotDay}
          authorityState={authorityState}
          mainOperationSeason={mainOperationSeason}
          operationSignals={operationSignals}
          socialPulse={socialPulse}
        />
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
