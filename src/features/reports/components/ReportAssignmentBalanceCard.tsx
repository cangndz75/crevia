import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildAssignmentEngineInputFromGameStore,
  buildAssignmentReportModel,
} from '@/core/assignments';
import type { DailyReport } from '@/core/models/DailyReport';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';

type Props = {
  report: DailyReport;
  compact?: boolean;
};

export function ReportAssignmentBalanceCard({ report, compact = false }: Props) {
  const storeSlice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      operationSignals: s.operationSignals,
      advisorState: s.advisorState,
      dailyOperationsPlan: s.dailyOperationsPlan,
      assignments: s.assignments,
      tutorialState: s.tutorialState,
    })),
  );
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);

  const model = useMemo(() => {
    const input = buildAssignmentEngineInputFromGameStore(storeSlice);
    return buildAssignmentReportModel(input, report);
  }, [storeSlice, isDay1, report]);

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
          key={`assign-line-${index}`}
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
    minWidth: 0,
    borderWidth: 1,
  },
  cardCompact: {
    padding: 12,
  },
  tonePositive: {
    backgroundColor: '#E8F7F2',
    borderColor: 'rgba(15, 143, 134, 0.2)',
  },
  toneNeutral: {
    backgroundColor: '#F8FBFA',
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  toneWarning: {
    backgroundColor: '#FFF6E8',
    borderColor: 'rgba(214, 162, 60, 0.35)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#063F3B',
  },
  line: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F5C57',
    flexShrink: 1,
  },
  footer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8480',
    marginTop: 4,
  },
});
