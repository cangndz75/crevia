import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

import type { EventAdvisorNote, EventCard, EventDecision } from '@/core/models/EventCard';
import {
  getButterflyHintBody,
  getDecisionResultDescription,
  getDecisionResultTitle,
  getDecisionStyleChipTone,
  getDecisionStyleLabel,
  getFieldNoteForEvent,
  getMetricEffectRows,
  hasButterflyHint,
} from '@/features/events/utils/eventDecisionPresentation';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventDecisionResultPhaseProps = {
  decision: EventDecision;
  event: EventCard;
  eventAdvisor: EventAdvisorNote;
  showPilotReportCta: boolean;
  bottomPadding: number;
  onGoToHub: () => void;
  onGoToPilotReport: () => void;
};

const metricToneStyles = {
  positive: { bg: colors.successMuted, text: colors.success },
  negative: { bg: colors.dangerMuted, text: colors.danger },
  neutral: { bg: colors.background, text: colors.textSecondary },
  xp: { bg: colors.purpleMuted, text: colors.purple },
} as const;

export function EventDecisionResultPhase({
  decision,
  event,
  eventAdvisor,
  showPilotReportCta,
  bottomPadding,
  onGoToHub,
  onGoToPilotReport,
}: EventDecisionResultPhaseProps) {
  const title = getDecisionResultTitle(decision);
  const description = getDecisionResultDescription(decision);
  const styleLabel = getDecisionStyleLabel(decision.decisionStyle);
  const metricRows = getMetricEffectRows(decision.effects);
  const fieldNote = getFieldNoteForEvent(event, eventAdvisor);
  const butterfly = hasButterflyHint(decision);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}>
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.hero}>
          <Animated.View
            entering={ZoomIn.delay(100).duration(360).springify().damping(16)}
            style={styles.heroIcon}>
            <Ionicons name="checkmark-circle" size={52} color={colors.success} />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200).duration(320).springify().damping(22)}>
            <Text style={styles.heroTitle}>{title}</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(320).duration(280)}>
            <Text style={styles.heroBody}>{description}</Text>
          </Animated.View>
          {styleLabel ? (
            <Animated.View entering={FadeIn.delay(400).duration(240)}>
              <GameChip
                label={styleLabel}
                tone={
                  decision.decisionStyle
                    ? getDecisionStyleChipTone(decision.decisionStyle)
                    : 'neutral'
                }
              />
            </Animated.View>
          ) : null}
        </Animated.View>

        {metricRows.length > 0 ? (
          <Animated.View
            entering={FadeInUp.delay(360).duration(300).springify().damping(22)}
            style={styles.section}>
            <SectionHeader
              title="Metrik Etkileri"
              subtitle="Bu kararın anlık etkisi"
              icon="stats-chart-outline"
              iconColor={colors.secondary}
            />
            <View style={styles.metricGrid}>
              {metricRows.map((row, idx) => {
                const palette = metricToneStyles[row.tone];
                return (
                  <Animated.View
                    key={row.key}
                    entering={FadeInUp.delay(440 + idx * 60).duration(280).springify().damping(20)}>
                    <GameCard padding="md" style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{row.label}</Text>
                      <Text style={[styles.metricValue, { color: palette.text }]}>
                        {row.value}
                      </Text>
                    </GameCard>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {fieldNote ? (
          <GameCard soft style={styles.noteCard}>
            <SectionHeader
              title={fieldNote.title}
              icon="chatbubble-ellipses-outline"
              iconColor={colors.secondary}
            />
            <Text style={styles.noteBody}>{fieldNote.body}</Text>
            {fieldNote.attribution ? (
              <Text style={styles.noteAttr}>{fieldNote.attribution}</Text>
            ) : null}
          </GameCard>
        ) : null}

        {butterfly ? (
          <Animated.View entering={FadeInUp.delay(520).duration(320).springify().damping(20)}>
            <GameCard style={styles.butterflyCard}>
              <View style={styles.butterflyHead}>
                <View style={styles.butterflyIcon}>
                  <Ionicons name="git-branch-outline" size={20} color={colors.warning} />
                </View>
                <Text style={styles.butterflyTitle}>Bu karar iz bırakabilir</Text>
              </View>
              <Text style={styles.butterflyBody}>{getButterflyHintBody(decision)}</Text>
            </GameCard>
          </Animated.View>
        ) : null}

        {showPilotReportCta ? (
          <Animated.View
            entering={FadeInUp.delay(580).duration(360).springify().damping(22)}
            style={[styles.pilotCtaCard, shadows.card]}>
            <View style={styles.pilotCtaIcon}>
              <Ionicons name="document-text" size={24} color={colors.hubGoldDark} />
            </View>
            <Text style={styles.pilotCtaTitle}>Pilot Raporu Hazır</Text>
            <Text style={styles.pilotCtaBody}>
              7 günlük operasyon tamamlandı. Sonuçları inceleyip pilotu resmen
              kapatabilirsin.
            </Text>
            <GameButton
              title="Pilot Raporunu Gör"
              onPress={onGoToPilotReport}
              style={styles.pilotCtaBtn}
            />
          </Animated.View>
        ) : null}

        <View style={styles.actions}>
          {!showPilotReportCta ? (
            <GameButton title="Operasyon Merkezine Dön" onPress={onGoToHub} />
          ) : (
            <GameButton
              title="Operasyon Merkezine Dön"
              onPress={onGoToHub}
              variant="secondary"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroIcon: {
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
  heroBody: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textPrimary,
    maxWidth: 340,
  },
  section: {
    gap: 0,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    gap: spacing.xs,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  noteCard: {
    gap: spacing.sm,
  },
  noteBody: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  noteAttr: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.textSecondary,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  pilotCtaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hubGold,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  pilotCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilotCtaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pilotCtaBody: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  pilotCtaBtn: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
