import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { AuthorityRoadmap } from '@/features/progression/components/AuthorityRoadmap';
import { CareerSummaryCard } from '@/features/progression/components/CareerSummaryCard';
import { ComingSoonAuthorityGrid } from '@/features/progression/components/ComingSoonAuthorityGrid';
import { NextAuthorityCard } from '@/features/progression/components/NextAuthorityCard';
import { UnlockedAuthoritiesSection } from '@/features/progression/components/UnlockedAuthoritiesSection';
import { deriveProgressionState } from '@/features/progression/utils/progressionDerived';
import { useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function ProgressionScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.lg;

  const { role, level, xp, xpToNextLevel } = useGameStore(
    useShallow((s) => ({
      role: s.gameState.player.role,
      level: s.gameState.player.level,
      xp: s.gameState.player.xp,
      xpToNextLevel: s.gameState.player.xpToNextLevel,
    })),
  );

  const derived = useMemo(() => deriveProgressionState(xp), [xp]);

  return (
    <View style={styles.root}>
      <View style={[styles.pageHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={typography.hero}>Yetkiler</Text>
        <Text style={styles.subtitle}>
          Operasyon kariyerini geliştir, yeni sistemleri aç.
        </Text>
        <Text style={styles.milestoneMeta}>
          {derived.milestoneUnlockedCount}/{derived.milestoneTotal} özellik
          kilidi açıldı
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}>
        <CareerSummaryCard
          role={role}
          level={level}
          xp={xp}
          xpToNextLevel={xpToNextLevel}
        />

        <NextAuthorityCard nextNode={derived.nextNode} xp={xp} />

        <AuthorityRoadmap branches={derived.branches} />

        <UnlockedAuthoritiesSection nodes={derived.unlockedFeatureNodes} />

        <ComingSoonAuthorityGrid />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  milestoneMeta: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.progressionBg,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
});
