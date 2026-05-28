import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DecisionImpactMetricRow } from '@/features/events/components/DecisionImpactMetricRow';
import { DecisionResultActionBar } from '@/features/events/components/DecisionResultActionBar';
import { DecisionResultHeader } from '@/features/events/components/DecisionResultHeader';
import { DecisionSubsystemOutcomeCard } from '@/features/events/components/DecisionSubsystemOutcomeCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { DecisionResultSummaryTone } from '@/features/events/types/decisionResultTypes';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import {
  selectLastDailyReport,
  selectLastDecisionResult,
  useGameStore,
} from '@/store/useGameStore';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

const RESULT_TONE_LABELS: Record<DecisionResultSummaryTone, string> = {
  positive: 'Olumlu Sonuç',
  mixed: 'Dengeli Sonuç',
  negative: 'Riskli Sonuç',
  neutral: 'Nötr Sonuç',
};

const HERO_GRADIENTS: Record<
  DecisionResultSummaryTone,
  readonly [string, string, string]
> = {
  positive: ['#FFFFFF', '#EEF9F3', '#DDF4E8'],
  mixed: ['#FFFFFF', '#FFF8EC', '#FDF4E6'],
  negative: ['#FFFFFF', '#FFF5F4', '#FDEEED'],
  neutral: ['#FFFFFF', '#F5F4F1', '#EBF2FA'],
};

const CHIP_COLORS: Record<DecisionResultSummaryTone, { bg: string; text: string }> =
  {
    positive: { bg: colors.successMuted, text: colors.success },
    mixed: { bg: colors.warningMuted, text: colors.warning },
    negative: { bg: colors.dangerMuted, text: colors.danger },
    neutral: { bg: colors.secondaryMuted, text: colors.secondary },
  };

export function DecisionResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snapshot = useGameStore(selectLastDecisionResult);
  const lastDailyReport = useGameStore(selectLastDailyReport);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const result = snapshot ?? createEmptyDecisionResultFallback();
  const isMissing = snapshot == null;

  const goHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const secondary = useMemo(() => {
    if (isMissing) return null;

    if (lastDailyReport && lastDailyReport.day === currentDay) {
      return { label: 'Raporu Gör', route: '/reports' as const };
    }

    const hasSocial = result.subsystemOutcomes.some((o) => o.key === 'social');
    if (hasSocial) {
      return { label: 'Sosyal Nabız', route: '/social' as const };
    }

    const hasContainerOrVehicle = result.subsystemOutcomes.some(
      (o) => o.key === 'container' || o.key === 'vehicle',
    );
    if (hasContainerOrVehicle) {
      return { label: 'Haritayı Aç', route: '/risks' as const };
    }

    return null;
  }, [currentDay, isMissing, lastDailyReport, result.subsystemOutcomes]);

  const chipColors = CHIP_COLORS[result.resultTone];
  const heroGradient = HERO_GRADIENTS[result.resultTone];

  return (
    <View style={styles.root}>
      <DecisionResultHeader
        day={result.day}
        neighborhoodName={result.neighborhoodName}
        eventType={result.eventType}
        onClose={goHub}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {isMissing ? (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>{result.summaryTitle}</Text>
            <Text style={styles.missingBody}>{result.summaryText}</Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeIn.duration(360)}>
              <LinearGradient
                colors={[...heroGradient]}
                style={styles.heroCard}>
                <View style={[styles.statusChip, { backgroundColor: chipColors.bg }]}>
                  <Text style={[styles.statusChipText, { color: chipColors.text }]}>
                    {RESULT_TONE_LABELS[result.resultTone]}
                  </Text>
                </View>
                <Text style={styles.summaryTitle}>{result.summaryTitle}</Text>
                <Text style={styles.summaryText}>{result.summaryText}</Text>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {result.eventTitle}
                </Text>
                <Text style={styles.decisionLine} numberOfLines={2}>
                  Seçilen karar: {result.decisionTitle}
                </Text>
              </LinearGradient>
            </Animated.View>

            {result.dailyGoalImpact ? (
              <View style={styles.goalImpactCard}>
                <Text style={styles.goalImpactText}>{result.dailyGoalImpact}</Text>
              </View>
            ) : null}

            {result.dailyPriorityImpact ? (
              <View style={styles.goalImpactCard}>
                <Text style={styles.goalImpactLabel}>Günlük Öncelik Etkisi</Text>
                <Text style={styles.goalImpactTitle}>
                  {result.dailyPriorityImpact.title}
                </Text>
                <Text style={styles.goalImpactText}>
                  {result.dailyPriorityImpact.text}
                </Text>
              </View>
            ) : null}

            <Animated.View entering={FadeInUp.delay(120).duration(320)}>
              <DecisionImpactMetricRow metrics={result.metricChanges} />
            </Animated.View>

            {result.subsystemOutcomes.length > 0 ? (
              <Animated.View
                entering={FadeInUp.delay(200).duration(320)}
                style={styles.outcomeGrid}>
                {result.subsystemOutcomes.map((outcome) => (
                  <DecisionSubsystemOutcomeCard
                    key={outcome.key}
                    outcome={outcome}
                  />
                ))}
              </Animated.View>
            ) : null}

            {result.highlightLines.length > 0 ? (
              <View style={styles.linesCard}>
                <Text style={styles.linesTitle}>Kazançlar</Text>
                {result.highlightLines.map((line) => (
                  <Text key={line} style={styles.lineGood}>
                    • {line}
                  </Text>
                ))}
              </View>
            ) : null}

            {result.riskLines.length > 0 ? (
              <View style={styles.linesCard}>
                <Text style={styles.linesTitle}>Dikkat Edilecekler</Text>
                {result.riskLines.map((line) => (
                  <Text key={line} style={styles.lineRisk}>
                    • {line}
                  </Text>
                ))}
              </View>
            ) : null}

            {result.nextSuggestion ? (
              <View style={styles.suggestionCard}>
                <Text style={styles.suggestionText}>{result.nextSuggestion}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <DecisionResultActionBar
        onGoHub={goHub}
        secondaryLabel={secondary?.label}
        onSecondaryPress={
          secondary ? () => router.push(secondary.route) : undefined
        }
      />
      <TutorialCoachOverlay
        screen="decision_result"
        bottomOffset={Math.max(insets.bottom, 12) + 88}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 4,
    paddingBottom: spacing.xl,
    gap: 14,
  },
  heroCard: {
    borderRadius: eventDetail.cardRadius,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    shadowColor: '#063F3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.3,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 20,
  },
  eventTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  decisionLine: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.teal,
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  linesCard: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  linesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.textDark,
    marginBottom: 2,
  },
  lineGood: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    lineHeight: 17,
  },
  lineRisk: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
    lineHeight: 17,
  },
  suggestionCard: {
    backgroundColor: eventDetail.mintSoft,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 18,
  },
  goalImpactCard: {
    backgroundColor: eventDetail.mintSoft,
    borderRadius: eventDetail.smallRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.14)',
  },
  goalImpactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  goalImpactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  goalImpactText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
    lineHeight: 17,
  },
  missingBox: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  missingBody: {
    fontSize: 14,
    color: eventDetail.textMuted,
    lineHeight: 20,
  },
});
