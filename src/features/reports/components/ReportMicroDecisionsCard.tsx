import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import {
  buildMicroDecisionPresentationInput,
  buildMicroDecisionReportModel,
} from '@/core/microDecisions';
import type { DailyReport } from '@/core/models/DailyReport';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type ReportMicroDecisionsCardProps = {
  report: DailyReport;
  compact?: boolean;
};

const TONE_STYLES = {
  positive: { pill: 'rgba(15, 143, 134, 0.12)', text: '#0F8F86' },
  neutral: { pill: 'rgba(100, 130, 125, 0.12)', text: '#5E726E' },
  warning: { pill: 'rgba(214, 162, 60, 0.2)', text: '#B8860B' },
  critical: { pill: 'rgba(200, 90, 70, 0.15)', text: '#C45A46' },
} as const;

export function ReportMicroDecisionsCard({
  report,
  compact = false,
}: ReportMicroDecisionsCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);

  const model = useMemo(() => {
    if (isDay1 || report.day <= 2) return undefined;
    const input = buildMicroDecisionPresentationInput({
      day: report.day,
      gameState,
      monetization,
      operationSignals,
      crisisState,
      dailyOperationsPlan,
      assignments,
      mainOperationSeason,
      advisorState,
      microDecisionState,
    });
    return buildMicroDecisionReportModel(input, report.day);
  }, [
    report.day,
    gameState,
    monetization,
    operationSignals,
    crisisState,
    dailyOperationsPlan,
    assignments,
    mainOperationSeason,
    advisorState,
    microDecisionState,
    isDay1,
  ]);

  if (!model) return null;

  const tone = TONE_STYLES[model.tone];

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <View style={[styles.pill, { backgroundColor: tone.pill }]}>
        <Text style={[styles.pillText, { color: tone.text }]} numberOfLines={1}>
          {model.title}
        </Text>
      </View>
      {model.lines.map((line, index) => (
        <Text key={`md-line-${index}`} style={styles.line} numberOfLines={3}>
          {line}
        </Text>
      ))}
      <Text style={styles.footer} numberOfLines={2}>
        {model.footerNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFCF8',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    fontSize: 13,
    color: '#3D4F4C',
    lineHeight: 18,
    flexShrink: 1,
  },
  footer: {
    fontSize: 11,
    color: '#7A8E8A',
    fontStyle: 'italic',
  },
});
