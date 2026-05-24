import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { AppScreen } from '@/ui/components/AppScreen';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const toneColor = {
  positive: colors.success,
  negative: colors.danger,
  neutral: colors.textPrimary,
};

export function ReportScreen() {
  const { dailyReport } = mockGameData;

  return (
    <AppScreen>
      <Text style={typography.title}>{dailyReport.title}</Text>
      <Text style={typography.caption}>Gün özeti ve kazanımlar</Text>

      <View style={styles.stats}>
        {dailyReport.stats.map((stat) => (
          <GameCard key={stat.label} padding="md" style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text
              style={[
                typography.stat,
                stat.tone ? { color: toneColor[stat.tone] } : null,
              ]}>
              {stat.value}
            </Text>
          </GameCard>
        ))}
      </View>

      <GameCard soft padding="lg">
        <Text style={typography.label}>Ödül</Text>
        <View style={styles.rewardRow}>
          <Text style={typography.subtitle}>{dailyReport.rewardTitle}</Text>
          <GameChip label="Kazanıldı" tone="purple" />
        </View>
        {dailyReport.rewardDescription ? (
          <Text style={[typography.caption, styles.rewardDesc]}>
            {dailyReport.rewardDescription}
          </Text>
        ) : null}
      </GameCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.sm,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  rewardDesc: {
    marginTop: spacing.sm,
  },
});
