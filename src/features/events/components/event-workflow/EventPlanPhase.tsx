import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { buildEventCarryOverHint, shouldShowCarryOverMemory } from '@/core/carryOver';
import { buildEventDomainPlanFocus, shouldShowEventDomainFocus } from '@/core/events/eventDomainPresentation';
import { EventCarryOverHintCard } from '@/features/events/components/EventCarryOverHintCard';
import { EventAdvisorHintCard } from '@/features/events/components/EventAdvisorHintCard';
import { EventDomainImpactFocusCard } from '@/features/events/components/EventDomainImpactFocusCard';
import { OperationImpactPreviewStrip } from '@/features/events/components/OperationImpactPreviewStrip';
import { useGameStore } from '@/store/useGameStore';
import { PlanDetailsInspectSection } from '@/features/events/components/event-workflow/plan/PlanDetailsInspectSection';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { PlanOptionPicker } from '@/features/events/components/event-workflow/plan/PlanOptionPicker';
import { PlanSummaryCard } from '@/features/events/components/event-workflow/plan/PlanSummaryCard';
import { PlanWorkflowFooter } from '@/features/events/components/event-workflow/plan/PlanWorkflowFooter';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import type { EventCard } from '@/core/models/EventCard';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildPlanDisplayOptions,
  buildPlanSummaryUi,
} from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import {
  buildPlanScreenModel,
  type PlanOptionId,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onConfirmPlan: () => void;
  phaseHint?: string | null;
};

export function EventPlanPhase({
  event,
  bottomPadding,
  onConfirmPlan,
  phaseHint = null,
}: EventPlanPhaseProps) {
  const model = useMemo(() => buildPlanScreenModel(event), [event]);
  const [selectedId, setSelectedId] = useState<PlanOptionId>(model.recommendedOptionId);

  const selectedPlan = model.planByOption[selectedId];
  const displayOptions = useMemo(() => buildPlanDisplayOptions(model), [model]);
  const summaryUi = useMemo(
    () => buildPlanSummaryUi(selectedId, selectedPlan),
    [selectedId, selectedPlan],
  );

  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  const currentDay = useGameStore((s) => s.gameState.city.day);
  const lastDailyReport = useGameStore((s) => s.lastDailyReport);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const planDomainModel = useMemo(
    () => buildEventDomainPlanFocus(event, event.day ?? currentDay),
    [currentDay, event],
  );
  const showPlanDomain =
    shouldShowEventDomainFocus(
      event.day ?? currentDay,
      'plan',
      planDomainModel.focus,
    );
  const planCarryOver = useMemo(
    () =>
      buildEventCarryOverHint({
        day: event.day ?? currentDay,
        currentEvent: event,
        lastDailyReport,
        recentDecisions: decisionHistory,
        eventDomainFocus: planDomainModel,
      }),
    [currentDay, decisionHistory, event, lastDailyReport, planDomainModel],
  );
  const showPlanCarryOver = shouldShowCarryOverMemory(event.day ?? currentDay, 'plan', {
    day: event.day ?? currentDay,
    currentEvent: event,
    lastDailyReport,
    recentDecisions: decisionHistory,
    eventDomainFocus: planDomainModel,
  });

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}>
        <PlanEventSummaryCard
          title={event.title}
          location={event.district}
          priorityLabel={model.priorityLabel}
          remainingLabel={model.remainingLabel}
          thumbnail={thumbnail}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="plan" compact />
        </View>

        <EventAdvisorHintCard event={event} />

        {showPlanDomain ? (
          <EventDomainImpactFocusCard model={planDomainModel} compact />
        ) : null}

        {showPlanCarryOver && planCarryOver?.visible ? (
          <EventCarryOverHintCard memory={planCarryOver} compact />
        ) : null}

        <OperationImpactPreviewStrip event={event} />

        <PlanOptionPicker
          options={displayOptions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <View style={styles.summaryGap}>
          <PlanSummaryCard summary={summaryUi} />
        </View>

        <View style={styles.detailsGap}>
          <PlanDetailsInspectSection
            selectedPlanId={selectedId}
            selectedPlan={selectedPlan}
          />
        </View>
      </ScrollView>

      <PlanWorkflowFooter onPress={onConfirmPlan} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: 14,
    paddingTop: 2,
  },
  stepperGap: {
    marginTop: -2,
    marginBottom: -2,
  },
  summaryGap: {
    marginTop: 2,
  },
  detailsGap: {
    marginTop: 4,
  },
});
