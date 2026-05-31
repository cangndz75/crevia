import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildAssignmentEngineInputFromGameStore,
  buildAssignmentImpactPreviewModel,
} from '@/core/assignments';
import { buildCrisisImpactPreviewModel } from '@/core/crisis';
import { buildDailyPlanImpactPreviewModel, buildDailyPlanningEngineInputFromStore } from '@/core/dailyPlanning';
import {
  buildOperationImpactPreviewModel,
  buildOperationSignalsEngineInput,
} from '@/core/operations';
import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  DAY1_EVENT_PLAN_COPY,
  shouldHideAdvancedSystemForFirstTenMinutes,
} from '@/core/onboarding/firstTenMinutesPresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';

type OperationImpactPreviewStripProps = {
  event: EventCard;
  decision?: EventDecision;
  compact?: boolean;
};

const TONE_STYLES = {
  positive: {
    bg: '#E8F7F2',
    border: 'rgba(15, 143, 134, 0.2)',
    text: '#0F6B64',
  },
  neutral: {
    bg: '#F4F7F6',
    border: 'rgba(100, 130, 125, 0.2)',
    text: '#4A5F5B',
  },
  warning: {
    bg: '#FFF6E8',
    border: 'rgba(214, 162, 60, 0.35)',
    text: '#9A6B12',
  },
  critical: {
    bg: '#FFF0EC',
    border: 'rgba(200, 90, 70, 0.3)',
    text: '#B84A38',
  },
} as const;

export function OperationImpactPreviewStrip({
  event,
  decision,
  compact = false,
}: OperationImpactPreviewStripProps) {
  const gameState = useGameStore((s) => s.gameState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const advisorState = useGameStore((s) => s.advisorState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const tutorialState = useGameStore((s) => s.tutorialState);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const hideAdvancedImpacts = shouldHideAdvancedSystemForFirstTenMinutes(
    gameState,
    'advanced_operation_impacts',
  );

  const planPreview = useMemo(() => {
    if (hideAdvancedImpacts) return null;
    if (isDay1 && compact) return null;
    const input = buildDailyPlanningEngineInputFromStore({
      gameState,
      operationSignals,
      advisorState,
      dailyOperationsPlan,
      isDay1Tutorial: isDay1,
    });
    return buildDailyPlanImpactPreviewModel(input, event, decision);
  }, [
    gameState,
    operationSignals,
    advisorState,
    dailyOperationsPlan,
    isDay1,
    event,
    decision,
    compact,
  ]);

  const assignmentPreview = useMemo(() => {
    if (hideAdvancedImpacts) return null;
    const input = buildAssignmentEngineInputFromGameStore({
      gameState,
      operationSignals,
      advisorState,
      dailyOperationsPlan,
      assignments,
      tutorialState,
    });
    return buildAssignmentImpactPreviewModel(input, event);
  }, [
    gameState,
    operationSignals,
    advisorState,
    dailyOperationsPlan,
    assignments,
    tutorialState,
    event,
  ]);

  const crisisPreview = useMemo(() => {
    if (isDay1) return null;
    return buildCrisisImpactPreviewModel(
      gameState,
      monetization,
      crisisState,
      {
        gameState,
        operationSignals,
        assignments,
        dailyOperationsPlan,
        mainOperationSeason,
        event,
        decision,
      },
    );
  }, [
    gameState,
    monetization,
    crisisState,
    operationSignals,
    assignments,
    dailyOperationsPlan,
    mainOperationSeason,
    isDay1,
    event,
    decision,
  ]);

  const model = useMemo(() => {
    if (hideAdvancedImpacts) return null;
    if (isDay1 && compact) return null;
    const engineInput = buildOperationSignalsEngineInput({
      gameState,
      personnelState,
      vehicleState,
      containerState,
      decisionHistory,
      operationSignals,
      isDay1Tutorial: isDay1,
    });
    return buildOperationImpactPreviewModel(engineInput, event, decision);
  }, [
    gameState,
    personnelState,
    vehicleState,
    containerState,
    operationSignals,
    decisionHistory,
    isDay1,
    event,
    decision,
    compact,
  ]);

  if (hideAdvancedImpacts) {
    return (
      <View
        style={[styles.strip, styles.stripCompact, { backgroundColor: '#E8F7F2', borderColor: 'rgba(15, 143, 134, 0.2)' }]}
        accessibilityRole="summary">
        <Text style={[styles.body, { color: '#0F6B64' }]} numberOfLines={1}>
          {DAY1_EVENT_PLAN_COPY.planSupport}
        </Text>
      </View>
    );
  }

  if (!model) {
    return null;
  }

  const tone = TONE_STYLES[model.tone];

  return (
    <View
      style={[
        styles.strip,
        { backgroundColor: tone.bg, borderColor: tone.border },
        compact && styles.stripCompact,
      ]}
      accessibilityRole="summary">
      <View style={styles.header}>
        <Text style={[styles.title, { color: tone.text }]} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={[styles.severity, { color: tone.text }]} numberOfLines={1}>
          {model.severityLabel}
        </Text>
      </View>
      <Text style={[styles.body, { color: tone.text }]} numberOfLines={2}>
        {model.summary}
      </Text>
      {planPreview?.visible ? (
        <Text style={[styles.planLine, { color: tone.text }]} numberOfLines={2}>
          {planPreview.summary}
        </Text>
      ) : null}
      {assignmentPreview?.visible ? (
        <Text style={[styles.planLine, { color: tone.text }]} numberOfLines={2}>
          {assignmentPreview.summary}
        </Text>
      ) : null}
      {crisisPreview?.visible ? (
        <Text style={[styles.planLine, { color: tone.text }]} numberOfLines={2}>
          {crisisPreview.summary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 4,
    minWidth: 0,
  },
  stripCompact: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  severity: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 0,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
  },
  planLine: {
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
    fontStyle: 'italic',
  },
});
