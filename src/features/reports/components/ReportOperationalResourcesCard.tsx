import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import type { DailyReport } from '@/core/models/DailyReport';
import {
  buildOperationalResourceEngineInputFromStore,
  buildOperationalResourceReportModel,
} from '@/core/operationalResources/operationalResourcePresentation';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  report: DailyReport;
  compact?: boolean;
};

export function ReportOperationalResourcesCard({ report, compact = false }: Props) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationalResources = useGameStore((s) => s.operationalResources);

  const model = useMemo(() => {
    const input = buildOperationalResourceEngineInputFromStore({
      gameState,
      monetization,
      operationSignals,
      dailyOperationsPlan,
      assignments,
      microDecisionState,
      crisisActionState,
      operationalResources,
    });
    return buildOperationalResourceReportModel(input, report.day);
  }, [
    gameState,
    monetization,
    operationSignals,
    dailyOperationsPlan,
    assignments,
    microDecisionState,
    crisisActionState,
    operationalResources,
    report.day,
  ]);

  if (!model.visible && !model.educationalLine) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        {model.educationalLine ? (
          <Text style={styles.educational} numberOfLines={2}>
            {model.educationalLine}
          </Text>
        ) : null}
        {model.lines.map((line) => (
          <Text key={line} style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        ))}
      </View>
    </View>
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
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
    backgroundColor: '#F4FBF8',
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  educational: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  line: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
