import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { RiskListCard } from '@/features/risks/components/RiskListCard';
import { RiskRegisterHeader } from '@/features/risks/components/RiskRegisterHeader';
import { RiskSummaryRow } from '@/features/risks/components/RiskSummaryRow';
import { deriveDay1Risks } from '@/features/risks/utils/deriveDay1Risks';
import {
  selectActiveEvents,
  selectDay,
  useGameMetrics,
  useGameStore,
} from '@/store/useGameStore';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function RisksScreen() {
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.lg;

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
    <View style={styles.root}>
      <RiskRegisterHeader />
      <RiskSummaryRow summary={summary} />

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listScroll: {
    flex: 1,
    backgroundColor: colors.riskListBg,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyHint: {
    marginTop: spacing.sm,
  },
});
