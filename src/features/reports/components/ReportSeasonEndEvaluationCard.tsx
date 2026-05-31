import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildSeasonEndDetailSheetModel,
  buildSeasonEndReportCardModel,
  type SeasonEndEvaluationInput,
} from '@/core/seasonEnd';
import type { DailyReport } from '@/core/models/DailyReport';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

import { SeasonEndEvaluationDetailSheet } from './SeasonEndEvaluationDetailSheet';

type ReportSeasonEndEvaluationCardProps = {
  report: DailyReport;
  compact?: boolean;
};

const TONE_BG = {
  positive: 'rgba(232, 248, 245, 0.95)',
  neutral: 'rgba(247, 243, 235, 0.95)',
  warning: 'rgba(255, 248, 235, 0.95)',
  critical: 'rgba(255, 242, 235, 0.95)',
} as const;

const TONE_ACCENT = {
  positive: '#0F8F86',
  neutral: '#5C7A75',
  warning: '#C9922E',
  critical: '#C45C4A',
} as const;

export function ReportSeasonEndEvaluationCard({
  report: _report,
  compact = false,
}: ReportSeasonEndEvaluationCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const crisisState = useGameStore((s) => s.crisisState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const socialPulseState = useGameStore((s) => s.socialPulseState);

  const [sheetVisible, setSheetVisible] = useState(false);

  const input: SeasonEndEvaluationInput = useMemo(
    () => ({
      gameState,
      monetization,
      mainOperationSeason,
      operationSignals,
      operationalResources,
      crisisState,
      crisisActionState,
      assignments,
      microDecisionState,
      socialPulseState,
    }),
    [
      gameState,
      monetization,
      mainOperationSeason,
      operationSignals,
      operationalResources,
      crisisState,
      crisisActionState,
      assignments,
      microDecisionState,
      socialPulseState,
    ],
  );

  const cardModel = useMemo(
    () => buildSeasonEndReportCardModel(input),
    [input],
  );

  const sheetModel = useMemo(() => {
    if (!sheetVisible) {
      return undefined;
    }
    return buildSeasonEndDetailSheetModel(input);
  }, [input, sheetVisible]);

  const handleOpenSheet = useCallback(() => setSheetVisible(true), []);
  const handleCloseSheet = useCallback(() => setSheetVisible(false), []);

  if (!cardModel) {
    return null;
  }

  const showCta = Boolean(cardModel.ctaLabel && sheetModel);

  return (
    <>
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: TONE_BG[cardModel.tone] ?? TONE_BG.neutral,
              borderColor: `${TONE_ACCENT[cardModel.tone] ?? TONE_ACCENT.neutral}33`,
            },
          ]}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            Sezon 1 tamamlandı
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {cardModel.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {cardModel.subtitle}
          </Text>
          <View style={styles.ratingRow}>
            <View
              style={[
                styles.ratingPill,
                {
                  backgroundColor: `${TONE_ACCENT[cardModel.tone]}22`,
                },
              ]}>
              <Text
                style={[styles.ratingPillText, { color: TONE_ACCENT[cardModel.tone] }]}
                numberOfLines={1}>
                {cardModel.ratingLabel}
              </Text>
            </View>
            <Text style={styles.scoreLabel} numberOfLines={1}>
              {cardModel.overallScoreLabel}
            </Text>
          </View>
          <Text style={styles.summary} numberOfLines={2}>
            {cardModel.summary}
          </Text>
          {cardModel.highlights.map((highlight) => (
            <View key={highlight.id} style={styles.highlightRow}>
              <Text style={styles.highlightTitle} numberOfLines={1}>
                {highlight.title}
              </Text>
              <Text style={styles.highlightSummary} numberOfLines={2}>
                {highlight.summary}
              </Text>
            </View>
          ))}
          {showCta ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cardModel.ctaLabel}
              onPress={handleOpenSheet}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}>
              <Text style={styles.ctaText} numberOfLines={1}>
                {cardModel.ctaLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {showCta ? (
        <SeasonEndEvaluationDetailSheet
          visible={sheetVisible}
          model={sheetModel}
          onClose={handleCloseSheet}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    gap: 8,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#0F8F86',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  ratingPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  highlightRow: {
    gap: 2,
    minWidth: 0,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  highlightSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  cta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#0F8F86',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
