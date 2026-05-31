import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EventAdvisorHintCard } from '@/features/events/components/EventAdvisorHintCard';
import { OperationImpactPreviewStrip } from '@/features/events/components/OperationImpactPreviewStrip';
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
