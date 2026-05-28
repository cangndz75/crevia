import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  MAIN_OPERATION_PREVIEW_ROUTE,
  pilotCompletionGradeChipTone,
  type PilotCompletionSummary,
} from '@/core/pilotCompletion';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportPilotCompletionCardProps = {
  summary: PilotCompletionSummary;
};

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function ReportPilotCompletionCard({ summary }: ReportPilotCompletionCardProps) {
  const router = useRouter();

  const scoreLabel =
    summary.score > 0 ? `${summary.score}/100` : summary.gradeLabel;

  return (
    <Animated.View entering={FadeInUp.delay(160).duration(300).springify().damping(22)}>
      <GameCard padding="lg" style={styles.card}>
        <View style={styles.headRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="ribbon-outline" size={20} color={colors.hubGoldDark} />
          </View>
          <View style={styles.headText}>
            <Text style={styles.title}>Pilot Görev Tamamlandı</Text>
            <Text style={styles.body}>
              7 günlük pilot bölge yönetimin tamamlandı. Kararların, mahalle
              dengesi ve kaynak yönetimin ana operasyon için değerlendirildi.
            </Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          <GameChip
            label={`Pilot · ${summary.gradeLabel}`}
            tone={pilotCompletionGradeChipTone(summary.grade)}
          />
          <GameChip label={summary.managementStyleLabel} tone="purple" />
        </View>

        <View style={styles.statsGrid}>
          <SummaryStat label="Pilot skoru" value={scoreLabel} />
          <SummaryStat label="Yönetim tarzı" value={summary.managementStyleLabel} />
          <SummaryStat
            label="En güçlü alan"
            value={summary.strongestMetricLabel ?? 'Operasyon dengesi'}
          />
          <SummaryStat
            label="Geliştirilecek alan"
            value={summary.weakestMetricLabel ?? 'Kaynak yönetimi'}
          />
        </View>

        <Text style={styles.subtitle}>{summary.subtitle}</Text>

        <GameButton
          title="Ana Operasyonu Önizle"
          onPress={() => router.push(MAIN_OPERATION_PREVIEW_ROUTE)}
          style={styles.cta}
        />
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: `${colors.hubGold}66`,
    backgroundColor: '#FFFDF8',
  },
  headRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.hubGold}55`,
  },
  headText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    fontWeight: '800',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    width: '47%',
    minWidth: 120,
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    ...typography.caption,
    color: colors.hubGoldDark,
    lineHeight: 18,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
