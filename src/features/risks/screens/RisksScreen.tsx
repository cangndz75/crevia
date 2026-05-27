import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RiskListCard } from '@/features/risks/components/RiskListCard';
import { RiskSummaryRow } from '@/features/risks/components/RiskSummaryRow';
import { deriveDay1Risks } from '@/features/risks/utils/deriveDay1Risks';
import {
  selectActiveEvents,
  selectDay,
  useGameMetrics,
  useGameStore,
} from '@/store/useGameStore';
import { GameCard } from '@/ui/components/GameCard';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function RisksScreen() {
  const day = useGameStore(selectDay);
  const activeEvents = useGameStore(selectActiveEvents);
  const metrics = useGameMetrics();
  const neighborhoods = useGameStore((s) => s.neighborhoods);

  const { risks, summary, emptyMessage } = useMemo(
    () =>
      deriveDay1Risks({
        day,
        activeEvents,
        metrics,
        neighborhoods,
      }),
    [day, activeEvents, metrics, neighborhoods],
  );

  return (
    <GameScreenShell
      screenTitle="Harita"
      backgroundColor={colors.riskListBg}
      contentStyle={styles.content}>
      <View style={styles.pageIntro}>
        <Text style={typography.caption}>
          Gün {day} · Aktif tehditler ve önlemler
        </Text>
      </View>

      <RiskSummaryRow summary={summary} />

      {emptyMessage ? (
        <GameCard padding="lg" soft>
          <Text style={typography.subtitle}>{emptyMessage}</Text>
          <Text style={[typography.caption, styles.emptyHint]}>
            Metrikler ve aktif olaylar değiştikçe bu liste güncellenir.
          </Text>
        </GameCard>
      ) : null}

      {risks.map((risk) => (
        <RiskListCard key={risk.id} risk={risk} />
      ))}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  pageIntro: {
    gap: spacing.xs,
  },
  emptyHint: {
    marginTop: spacing.sm,
  },
});
