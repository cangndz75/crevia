import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PersonnelImpactPreview } from '@/core/personnel/personnelPresentation';
import type { VehicleImpactPreview } from '@/core/vehicles/vehiclePresentation';
import { buildActiveTaskRouteForEvent } from '@/core/activeTaskRoutes/activeTaskRouteUiPresentation';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { EventFieldAssignmentSummary } from '@/features/events/components/assignment/EventFieldAssignmentSummary';
import { FieldNoteCard } from '@/features/events/components/FieldNoteCard';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { FieldImpactMetricsRow } from '@/features/events/components/event-workflow/field/FieldImpactMetricsRow';
import { FieldWorkflowFooter } from '@/features/events/components/event-workflow/field/FieldWorkflowFooter';
import { EventFieldMicroDecisionCard } from '@/features/events/components/event-workflow/field/EventFieldMicroDecisionCard';
import { LiveOperationCard } from '@/features/events/components/event-workflow/field/LiveOperationCard';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import { buildFieldScreenModel } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { resolveInspectDistrictId } from '@/features/events/utils/eventWorkflowPresentation';

type Props = {
  event: EventCard;
  decision: EventDecision | null;
  fieldNote: string;
  bottomPadding: number;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
  onComplete: () => void;
  completeDisabled?: boolean;
  applying?: boolean;
  phaseHint?: string | null;
  gameDay?: number;
  assignment?: EventAssignmentState | null;
  operationSignals?: unknown;
  operationalResources?: unknown;
  crisisState?: unknown;
};

export function EventFieldPhase({
  event,
  decision,
  fieldNote,
  bottomPadding,
  personnelPreview = null,
  vehiclePreview = null,
  onComplete,
  completeDisabled = false,
  applying = false,
  phaseHint = null,
  gameDay = 1,
  assignment = null,
  operationSignals,
  operationalResources,
  crisisState,
}: Props) {
  const routePreview = useMemo(
    () =>
      buildActiveTaskRouteForEvent({
        day: gameDay,
        activeEvent: event,
        assignment: assignment ?? undefined,
        operationSignals: operationSignals as never,
        operationalResources,
        crisisState,
        isFieldPhase: true,
      }),
    [assignment, crisisState, event, gameDay, operationSignals, operationalResources],
  );
  const routeAnalyticsContext = useMemo(
    () => ({
      day: gameDay,
      isPostPilot: gameDay >= 8,
      source: 'live_operation_route_phase',
    }),
    [gameDay],
  );

  const model = useMemo(
    () =>
      buildFieldScreenModel({
        event,
        decision,
        fieldNote,
        personnelPreview,
        vehiclePreview,
      }),
    [decision, event, fieldNote, personnelPreview, vehiclePreview],
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
          priorityLabel={`Sahada · ${event.district}`}
          remainingLabel={model.progressLabel}
          thumbnail={thumbnail}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="field" compact />
        </View>

        <LiveOperationCard
          model={model}
          routePreview={routePreview}
          analyticsContext={routeAnalyticsContext}
        />

        <EventFieldMicroDecisionCard event={event} />

        <EventFieldAssignmentSummary event={event} />

        <FieldImpactMetricsRow metrics={model.impactMetrics} />

        <FieldNoteCard body={model.fieldNote} compact />
      </ScrollView>

      <FieldWorkflowFooter
        summaryLine={model.footerSummaryLine}
        onPress={onComplete}
        disabled={completeDisabled}
        loading={applying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: eventDetail.sectionGap,
    paddingTop: 4,
    minWidth: 0,
  },
  stepperGap: {
    marginTop: -2,
    marginBottom: -2,
  },
});
