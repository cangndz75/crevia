import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';

const PILOT_SUMMARY_ENTERING = FadeInUp.duration(340).springify().damping(22);
const PILOT_BUTTERFLY_ENTERING = FadeIn.delay(200).duration(300);
const PILOT_REPORT_CTA_ENTERING = FadeInUp.delay(260)
  .duration(360)
  .springify()
  .damping(22);
const PILOT_COMPLETED_CTA_ENTERING = FadeIn.delay(340).duration(300);
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type PilotReportSummaryCardProps = {
  context: PilotReportContext;
};

export function PilotReportSummaryCard({ context }: PilotReportSummaryCardProps) {
  const router = useRouter();

  return (
    <Animated.View
      entering={PILOT_SUMMARY_ENTERING}
      style={styles.stack}>
      <GameCard padding="lg" style={styles.summaryCard}>
        <SectionHeader
          title="Pilot Gün Özeti"
          subtitle={context.completedPilotDayLabel}
          icon="map-outline"
          iconColor={colors.primary}
        />

        <View style={styles.chipRow}>
          <GameChip label={context.completedPilotThemeLabel} tone={context.reportTone} />
          <GameChip label={context.completedPilotDayTitle} tone="neutral" />
        </View>

        <Text style={styles.headline}>{context.headline}</Text>
        <Text style={styles.summary}>{context.summary}</Text>

        <View style={styles.goalBox}>
          <Text style={styles.goalLabel}>Günün hedefi</Text>
          <Text style={styles.goalText}>{context.completedPilotGoal}</Text>
        </View>

        {context.todayImpactHint ? (
          <View style={styles.impactBox}>
            <Ionicons name="pulse-outline" size={16} color={colors.secondary} />
            <Text style={styles.impactText}>{context.todayImpactHint}</Text>
          </View>
        ) : null}

        <View style={styles.nextBox}>
          <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.nextHint}>{context.nextHint}</Text>
        </View>

        {context.nextPilotDayLabel && context.nextPilotThemeLabel ? (
          <Text style={styles.nextMeta}>
            {context.nextPilotDayLabel} · {context.nextPilotThemeLabel}
            {context.nextPilotDayTitle ? ` — ${context.nextPilotDayTitle}` : ''}
          </Text>
        ) : null}
      </GameCard>

      {context.showButterflyCallback ? (
        <Animated.View entering={PILOT_BUTTERFLY_ENTERING}>
          <GameCard padding="lg" style={styles.butterflyCard}>
            <View style={styles.butterflyHead}>
              <View style={styles.butterflyIcon}>
                <Ionicons name="git-branch-outline" size={18} color={colors.warning} />
              </View>
              <Text style={styles.butterflyTitle}>
                {context.butterflyCallbackTitle}
              </Text>
            </View>
            <Text style={styles.butterflyBody}>{context.butterflyCallbackBody}</Text>
          </GameCard>
        </Animated.View>
      ) : null}

      {context.showPilotReportCta ? (
        <Animated.View
          entering={PILOT_REPORT_CTA_ENTERING}
          style={[styles.ctaCard, shadows.card]}>
          <View style={styles.ctaIcon}>
            <Ionicons name="document-text" size={22} color={colors.hubGoldDark} />
          </View>
          <Text style={styles.ctaTitle}>Pilot Raporu Hazır</Text>
          <Text style={styles.ctaBody}>
            7 günlük operasyon tamamlandı. Sonuçları görüntüleyip pilotu resmen
            kapatabilirsin.
          </Text>
          <GameButton
            title="Pilot Raporunu Gör"
            onPress={() => router.push('/events/pilot-final-report')}
            style={styles.ctaBtn}
          />
        </Animated.View>
      ) : null}

      {context.showCompletedReportCta ? (
        <Animated.View entering={PILOT_COMPLETED_CTA_ENTERING}>
        <GameCard padding="lg" style={styles.completedCard}>
          <View style={styles.completedHead}>
            <Ionicons name="trophy" size={22} color={colors.hubGoldDark} />
            <Text style={styles.completedTitle}>Pilot Tamamlandı</Text>
            {context.finalResultStatusChip ? (
              <GameChip label={context.finalResultStatusChip} tone="purple" />
            ) : null}
          </View>
          {context.finalResultScore != null ? (
            <Text style={styles.completedScore}>
              Final skor: {context.finalResultScore}/100
            </Text>
          ) : null}
          <GameButton
            title="Raporu Tekrar Gör"
            onPress={() => router.push('/events/pilot-final-report')}
            variant="secondary"
          />
        </GameCard>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  headline: {
    ...typography.subtitle,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  summary: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  goalBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  goalText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  impactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
  },
  impactText: {
    flex: 1,
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  nextBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextHint: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
  },
  nextMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  butterflyCard: {
    borderColor: colors.warningMuted,
    backgroundColor: colors.warningMuted,
    gap: spacing.sm,
  },
  butterflyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  butterflyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  butterflyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  butterflyBody: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hubGold,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ctaBody: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  ctaBtn: {
    marginTop: spacing.sm,
  },
  completedCard: {
    gap: spacing.sm,
    borderColor: colors.purpleMuted,
  },
  completedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  completedTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 120,
  },
  completedScore: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
