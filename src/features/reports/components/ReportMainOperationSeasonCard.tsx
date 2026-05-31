import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildReportMainOperationSeasonModel,
  type MainOperationPresentationExtras,
} from '@/core/mainOperation';
import type { DailyReport } from '@/core/models/DailyReport';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type ReportMainOperationSeasonCardProps = {
  report: DailyReport;
  compact?: boolean;
};

const TONE_BG = {
  positive: 'rgba(15, 143, 134, 0.1)',
  neutral: 'rgba(100, 130, 125, 0.1)',
  warning: 'rgba(214, 162, 60, 0.15)',
  critical: 'rgba(214, 162, 60, 0.15)',
} as const;

const CHIP_TONE = {
  positive: '#0F8F86',
  neutral: '#5C7A75',
  warning: '#C9922E',
  critical: '#C45C4A',
} as const;

export function ReportMainOperationSeasonCard({
  report,
  compact = false,
}: ReportMainOperationSeasonCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const assignments = useGameStore((s) => s.assignments);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const microDecisionState = useGameStore((s) => s.microDecisionState);

  const extras: MainOperationPresentationExtras = useMemo(
    () => ({
      operationSignals,
      assignments,
      crisisState,
      dailyOperationsPlan,
      microDecisionState,
    }),
    [
      operationSignals,
      assignments,
      crisisState,
      dailyOperationsPlan,
      microDecisionState,
    ],
  );

  const model = useMemo(
    () =>
      buildReportMainOperationSeasonModel(
        gameState,
        monetization,
        mainOperationSeason,
        extras,
      ),
    [gameState, monetization, mainOperationSeason, extras, report.day],
  );

  if (!model.visible) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[
          styles.card,
          { backgroundColor: TONE_BG[model.tone] ?? TONE_BG.neutral },
        ]}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        {model.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {model.subtitle}
          </Text>
        ) : null}
        {model.seasonDayLabel ? (
          <Text style={styles.seasonDay} numberOfLines={1}>
            {model.seasonDayLabel}
          </Text>
        ) : null}
        {model.topLine ? (
          <Text style={styles.topLine} numberOfLines={2}>
            {model.topLine}
          </Text>
        ) : null}
        {model.lines.map((line) => (
          <Text key={line} style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        ))}
        {model.goalChips.length > 0 ? (
          <View style={styles.chips}>
            {model.goalChips.map((chip) => (
              <View key={chip.id} style={styles.chip}>
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {chip.label}
                </Text>
                <Text
                  style={[
                    styles.chipValue,
                    { color: CHIP_TONE[chip.tone] ?? CHIP_TONE.neutral },
                  ]}
                  numberOfLines={1}>
                  {chip.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {model.footerNote ? (
          <Text style={styles.footer} numberOfLines={2}>
            {model.footerNote}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  seasonDay: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  topLine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  line: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '48%',
    minWidth: 0,
    flexGrow: 1,
  },
  chipLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
