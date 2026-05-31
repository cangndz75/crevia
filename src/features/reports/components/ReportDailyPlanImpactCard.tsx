import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import {
  buildDailyPlanReportModel,
  buildDailyPlanningEngineInputFromStore,
} from '@/core/dailyPlanning';
import type { DailyReport } from '@/core/models/DailyReport';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';

type ReportDailyPlanImpactCardProps = {
  report: DailyReport;
  compact?: boolean;
};

export function ReportDailyPlanImpactCard({
  report,
  compact = false,
}: ReportDailyPlanImpactCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const advisorState = useGameStore((s) => s.advisorState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);

  const model = useMemo(() => {
    const input = buildDailyPlanningEngineInputFromStore({
      gameState,
      operationSignals,
      advisorState,
      dailyOperationsPlan,
      isDay1Tutorial: isDay1,
    });
    return buildDailyPlanReportModel(input, report);
  }, [
    gameState,
    operationSignals,
    advisorState,
    dailyOperationsPlan,
    isDay1,
    report,
  ]);

  if (model.lines.length === 0) {
    return null;
  }

  const toneStyle =
    model.tone === 'positive'
      ? styles.tonePositive
      : model.tone === 'warning'
        ? styles.toneWarning
        : styles.toneNeutral;

  return (
    <View style={[styles.card, compact && styles.cardCompact, toneStyle]}>
      <Text style={styles.title} numberOfLines={1}>
        {model.title}
      </Text>
      {model.lines.map((line, index) => (
        <Text
          key={`plan-line-${index}`}
          style={styles.line}
          numberOfLines={compact ? 2 : 3}
          ellipsizeMode="tail">
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
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    minWidth: 0,
  },
  cardCompact: {
    padding: 12,
    gap: 4,
  },
  tonePositive: {
    backgroundColor: '#F4FBF8',
    borderColor: 'rgba(15, 143, 134, 0.14)',
  },
  toneNeutral: {
    backgroundColor: '#FFFCF7',
    borderColor: 'rgba(15, 143, 134, 0.1)',
  },
  toneWarning: {
    backgroundColor: '#FFF8EE',
    borderColor: 'rgba(214, 162, 60, 0.25)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4A46',
    flexShrink: 1,
  },
  line: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  footer: {
    fontSize: 11,
    color: '#6B7F7B',
    flexShrink: 1,
    marginTop: 2,
  },
});
