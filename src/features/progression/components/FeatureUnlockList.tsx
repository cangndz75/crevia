import { StyleSheet, Text, View } from 'react-native';

import { PROGRESSION_UNLOCKS } from '@/features/progression/content/progressionUnlocks';
import { selectXp, useGameStore } from '@/store/useGameStore';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function FeatureUnlockList() {
  const xp = useGameStore(selectXp);

  const unlockedCount = PROGRESSION_UNLOCKS.filter(
    (item) => xp >= item.xpRequired,
  ).length;

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Özellik Kilidi"
        icon="lock-open-outline"
        iconColor={colors.authority}
      />
      <Text style={styles.hint}>
        {unlockedCount}/{PROGRESSION_UNLOCKS.length} özellik açıldı · Gün 1
        simülasyonu
      </Text>
      <View style={styles.list}>
        {PROGRESSION_UNLOCKS.map((item) => {
          const unlocked = xp >= item.xpRequired;
          const remaining = Math.max(0, item.xpRequired - xp);

          return (
            <GameCard
              key={item.id}
              padding="md"
              style={[styles.card, unlocked && styles.cardUnlocked]}>
              <View style={styles.cardRow}>
                <View style={styles.cardBody}>
                  <Text style={typography.subtitle}>{item.title}</Text>
                  <Text style={typography.caption}>
                    {item.xpRequired} XP gerekiyor
                  </Text>
                </View>
                <GameChip
                  label={unlocked ? 'Açıldı' : `${remaining} XP kaldı`}
                  tone={unlocked ? 'success' : 'warning'}
                />
              </View>
            </GameCard>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    opacity: 0.92,
  },
  cardUnlocked: {
    borderColor: colors.success,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
