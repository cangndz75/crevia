import Animated, { FadeInUp } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import {
  buildOperationSignalsEngineInput,
  buildOperationSignalsReportModel,
} from '@/core/operations';
import type { DailyReport } from '@/core/models/DailyReport';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';

type ReportOperationSignalsCardProps = {
  report: DailyReport;
  compact?: boolean;
};

const TONE_STYLES = {
  positive: { pill: 'rgba(15, 143, 134, 0.12)', text: '#0F8F86' },
  neutral: { pill: 'rgba(100, 130, 125, 0.12)', text: '#5E726E' },
  warning: { pill: 'rgba(214, 162, 60, 0.2)', text: '#B8860B' },
  critical: { pill: 'rgba(200, 90, 70, 0.18)', text: '#C45A46' },
} as const;

export function ReportOperationSignalsCard({
  report,
  compact = false,
}: ReportOperationSignalsCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const postPilotOperation = useGameStore(
    (s) => s.gameState.pilot.postPilotOperation,
  );

  const postPilotLight = useMemo(() => {
    if (pilotStatus !== 'completed') return false;
    const postPilot = normalizePostPilotOperationState(postPilotOperation, {
      pilotStatus: 'completed',
      currentPilotDay: gameState.pilot.currentPilotDay,
    });
    return postPilot.phase === 'main_operation_light';
  }, [pilotStatus, postPilotOperation, gameState.pilot.currentPilotDay]);

  const model = useMemo(() => {
    const engineInput = buildOperationSignalsEngineInput({
      gameState,
      personnelState,
      vehicleState,
      containerState,
      decisionHistory,
      operationSignals,
      isDay1Tutorial: isDay1,
    });
    return buildOperationSignalsReportModel({
      engineInput,
      report,
      postPilotLight,
    });
  }, [
    gameState,
    personnelState,
    vehicleState,
    containerState,
    operationSignals,
    decisionHistory,
    isDay1,
    report,
    postPilotLight,
  ]);

  const tone = TONE_STYLES[model.overallTone];

  return (
    <Animated.View
      entering={FadeInUp.delay(60).duration(240).springify().damping(22)}
      style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone.pill }]}>
          <Text style={[styles.pillText, { color: tone.text }]} numberOfLines={1}>
            {model.overallLabel}
          </Text>
        </View>
      </View>
      {model.lines.map((line, index) => (
        <Text key={`line-${index}`} style={styles.line} numberOfLines={2}>
          {line}
        </Text>
      ))}
      <Text style={styles.footer} numberOfLines={1}>
        {model.footerNote}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7FBF9',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4A46',
    flex: 1,
    flexShrink: 1,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  line: {
    fontSize: 12,
    lineHeight: 17,
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
