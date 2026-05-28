import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PlanningDetailsSection } from '@/features/events/components/event-workflow/plan/details/PlanningDetailsSection';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { PlanOptionPicker } from '@/features/events/components/event-workflow/plan/PlanOptionPicker';
import { PlanWorkflowFooter } from '@/features/events/components/event-workflow/plan/PlanWorkflowFooter';
import { RecommendedPlanCard } from '@/features/events/components/event-workflow/plan/RecommendedPlanCard';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventCard } from '@/core/models/EventCard';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildPlanScreenModel,
  type PlanOptionId,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onConfirmPlan: () => void;
};

export function EventPlanPhase({
  event,
  bottomPadding,
  onConfirmPlan,
}: EventPlanPhaseProps) {
  const model = useMemo(() => buildPlanScreenModel(event), [event]);
  const [selectedId, setSelectedId] = useState<PlanOptionId>(model.recommendedOptionId);

  const selectedPlan = model.planByOption[selectedId];
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

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="plan" compact />
        </View>

        <RecommendedPlanCard plan={selectedPlan} planId={selectedId} selected />

        <View style={styles.optionsGap}>
          <PlanOptionPicker
            options={model.options}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </View>

        <View style={styles.detailsGap}>
          <PlanningDetailsSection
            event={event}
            selectedPlan={selectedPlan}
            selectedPlanId={selectedId}
          />
        </View>
      </ScrollView>

      <PlanWorkflowFooter
        summaryLine={selectedPlan.summaryLine}
        onPress={onConfirmPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: 12,
    paddingTop: 2,
  },
  stepperGap: {
    marginTop: -2,
    marginBottom: -2,
  },
  optionsGap: {
    marginTop: 2,
  },
  detailsGap: {
    marginTop: 6,
  },
});
