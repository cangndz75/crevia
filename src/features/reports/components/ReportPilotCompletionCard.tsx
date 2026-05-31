import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const PILOT_COMPLETION_CARD_ENTERING = FadeInUp.delay(160)
  .duration(300)
  .springify()
  .damping(22);

import { buildReportPilotCompletionCtaModel } from '@/core/monetization';
import {
  pilotCompletionGradeChipTone,
  type PilotCompletionSummary,
} from '@/core/pilotCompletion';
import { buildProgressionBridgePilotReportLines } from '@/core/progression';
import { useGameStore } from '@/store/useGameStore';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportPilotCompletionCardProps = {
  summary: PilotCompletionSummary;
  compact?: boolean;
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

export function ReportPilotCompletionCard({
  summary,
  compact = false,
}: ReportPilotCompletionCardProps) {
  const router = useRouter();
  const pilot = useGameStore((s) => s.gameState.pilot);
  const lastPilotScore = useGameStore((s) => s.lastPilotScore);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);

  const completionCta = useMemo(
    () =>
      buildReportPilotCompletionCtaModel({
        gameState,
        monetization,
      }),
    [gameState, monetization],
  );

  const progressionLines = useMemo(
    () =>
      buildProgressionBridgePilotReportLines({
        authorityState: pilot.authorityState,
        badgeState: pilot.badgeState,
        currentDay: pilot.currentPilotDay,
        lastPilotScore,
        selectedDistrictId: pilot.selectedDistrictId,
      }),
    [
      lastPilotScore,
      pilot.authorityState,
      pilot.badgeState,
      pilot.currentPilotDay,
      pilot.selectedDistrictId,
    ],
  );

  const scoreLabel =
    summary.score > 0 ? `${summary.score}/100` : summary.gradeLabel;

  return (
    <Animated.View entering={PILOT_COMPLETION_CARD_ENTERING}>
      <GameCard padding={compact ? 'md' : 'lg'} style={styles.card}>
        <View style={styles.seasonBadge}>
          <Text style={styles.seasonBadgeText} numberOfLines={1}>
            Sezon Sonu Değerlendirmesi
          </Text>
        </View>

        <View style={styles.headRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="ribbon-outline" size={20} color={colors.hubGoldDark} />
          </View>
          <View style={styles.headText}>
            <Text style={styles.title} numberOfLines={2}>
              Pilot Görev Tamamlandı
            </Text>
            {!compact ? (
              <Text style={styles.body} numberOfLines={3}>
                7 günlük pilot bölge yönetimin tamamlandı. Kararların, mahalle
                dengesi ve kaynak yönetimin ana operasyon için değerlendirildi.
              </Text>
            ) : (
              <Text style={styles.bodyCompact} numberOfLines={2}>
                7 günlük pilot dönemi tamamlandı. Performansın ana operasyon
                önizlemesine yansıtıldı.
              </Text>
            )}
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
          <SummaryStat
            label="En güçlü alan"
            value={summary.strongestMetricLabel ?? 'Operasyon dengesi'}
          />
          {!compact ? (
            <>
              <SummaryStat label="Yönetim tarzı" value={summary.managementStyleLabel} />
              <SummaryStat
                label="Geliştirilecek alan"
                value={summary.weakestMetricLabel ?? 'Kaynak yönetimi'}
              />
            </>
          ) : null}
        </View>

        {!compact ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {summary.subtitle}
          </Text>
        ) : null}

        {summary.authorityTitle ? (
          <View style={styles.authoritySection}>
            <Text style={styles.authoritySectionLabel} numberOfLines={1}>
              Üst Yönetim Değerlendirmesi
            </Text>
            <Text style={styles.authorityTitle} numberOfLines={2}>
              {summary.authorityTitle}
            </Text>
            {summary.authoritySubtitle ? (
              <Text style={styles.authoritySubtitle} numberOfLines={2}>
                {summary.authoritySubtitle}
              </Text>
            ) : null}
            {(summary.authorityLines ?? []).slice(0, compact ? 1 : 2).map((line, index) => (
              <Text key={`authority-line-${index}`} style={styles.authorityLine} numberOfLines={2}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {progressionLines ? (
          <View style={styles.progressionSection}>
            <Text style={styles.progressionScope} numberOfLines={2}>
              {progressionLines.scopeLine}
            </Text>
            <Text style={styles.progressionTrust} numberOfLines={2}>
              {progressionLines.trustLine}
            </Text>
          </View>
        ) : null}

        <GameButton
          title={completionCta.title}
          onPress={() => router.push(completionCta.route as never)}
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
    overflow: 'hidden',
  },
  seasonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: `${colors.hubGold}55`,
  },
  seasonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: 0.2,
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
    minWidth: 0,
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
  bodyCompact: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textSecondary,
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
    minWidth: 0,
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
  authoritySection: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authoritySectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  authorityTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  authoritySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  authorityLine: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  progressionSection: {
    gap: 4,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.16)',
  },
  progressionScope: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    lineHeight: 17,
  },
  progressionTrust: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 17,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
