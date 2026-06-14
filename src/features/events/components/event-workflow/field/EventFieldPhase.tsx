import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PersonnelImpactPreview } from '@/core/personnel/personnelPresentation';
import type { VehicleImpactPreview } from '@/core/vehicles/vehiclePresentation';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  buildMicroDecisionCardModel,
  buildMicroDecisionPresentationInput,
} from '@/core/microDecisions';
import { shouldHideAdvancedSystemForFirstTenMinutes } from '@/core/onboarding/firstTenMinutesPresentation';
import { getActiveMicroDecisions } from '@/core/microDecisions/microDecisionState';
import { operationMotionFieldCompleteHighlightMs, operationMotionFieldStepDurationMs } from '@/core/motion/operationMotionTokens';
import { EventFieldAssignmentSummary } from '@/features/events/components/assignment/EventFieldAssignmentSummary';
import { FieldNoteCard } from '@/features/events/components/FieldNoteCard';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { FieldImpactMetricsRow } from '@/features/events/components/event-workflow/field/FieldImpactMetricsRow';
import { FieldWorkflowFooter } from '@/features/events/components/event-workflow/field/FieldWorkflowFooter';
import { EventFieldMicroDecisionCard } from '@/features/events/components/event-workflow/field/EventFieldMicroDecisionCard';
import {
  FieldAdvisorCommentCard,
  FieldAssignmentEffectStrip,
  FieldPhaseHeader,
  FieldPlanSummaryStrip,
  FieldTimelineList,
} from '@/features/events/components/event-workflow/field/FieldMotionSections';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventFieldPhasePresentation,
  mapMicroDecisionCardToFieldPresentation,
  type EventFieldInteractionState,
} from '@/features/events/utils/eventFieldPhasePresentation';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import { buildFieldScreenModel } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { resolveInspectDistrictId } from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

const TIMELINE_MAX_INDEX = 4;

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
  selectedPlanStrategyId?: EventPlanStrategyId | null;
  selectedPlanStrategyLabel?: string | null;
  isDay1LearningEvent?: boolean;
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
  selectedPlanStrategyId = null,
  selectedPlanStrategyLabel = null,
  isDay1LearningEvent = false,
}: Props) {
  const reducedMotion = useCreviaReducedMotion();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const microDecisionState = useGameStore((s) => s.microDecisionState);

  const [interactionState, setInteractionState] =
    useState<EventFieldInteractionState>('running');
  const [timelineStepIndex, setTimelineStepIndex] = useState(0);

  const legacyModel = useMemo(
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

  const microDecisionCardModel = useMemo(() => {
    if (shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions')) {
      return null;
    }
    const input = buildMicroDecisionPresentationInput({
      day: gameState.city.day,
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
    const related = getActiveMicroDecisions(microDecisionState).find(
      (d) => d.relatedEventId === event.id,
    );
    if (!related) return null;
    return buildMicroDecisionCardModel(input, related, { compact: true });
  }, [
    advisorState,
    assignments,
    crisisState,
    dailyOperationsPlan,
    event.id,
    gameState,
    mainOperationSeason,
    microDecisionState,
    monetization,
    operationSignals,
  ]);

  const microDecisionPresentation = useMemo(
    () =>
      microDecisionCardModel
        ? mapMicroDecisionCardToFieldPresentation(microDecisionCardModel)
        : null,
    [microDecisionCardModel],
  );

  const hasPendingMicroDecision = Boolean(microDecisionPresentation);

  const authorityGameplayContext = useMemo(
    () =>
      buildAuthorityGameplayPresentationContext({
        authorityState: gameState.pilot.authorityState,
        day: gameDay,
        isDay1LearningEvent,
      }),
    [gameDay, gameState.pilot.authorityState, isDay1LearningEvent],
  );

  const presentation = useMemo(
    () =>
      buildEventFieldPhasePresentation({
        event,
        assignment,
        selectedPlanStrategyId,
        selectedPlanStrategyLabel,
        interactionState,
        timelineStepIndex,
        microDecision: microDecisionPresentation,
        day: gameDay,
        isDay1LearningEvent,
        reducedMotion,
        authorityGameplayContext,
      }),
    [
      assignment,
      authorityGameplayContext,
      event,
      gameDay,
      interactionState,
      isDay1LearningEvent,
      microDecisionPresentation,
      reducedMotion,
      selectedPlanStrategyId,
      selectedPlanStrategyLabel,
      timelineStepIndex,
    ],
  );

  useEffect(() => {
    if (interactionState === 'completed') return;

    if (hasPendingMicroDecision) {
      setInteractionState('paused_for_decision');
      return;
    }

    if (interactionState === 'paused_for_decision') {
      setInteractionState('running');
    }

    if (reducedMotion) {
      setTimelineStepIndex(TIMELINE_MAX_INDEX);
      const timer = setTimeout(() => {
        setInteractionState('completed');
      }, operationMotionFieldCompleteHighlightMs(true));
      return () => clearTimeout(timer);
    }

    if (timelineStepIndex >= TIMELINE_MAX_INDEX) {
      const highlightMs = operationMotionFieldCompleteHighlightMs(reducedMotion);
      const timer = setTimeout(() => {
        setInteractionState('completed');
      }, highlightMs);
      return () => clearTimeout(timer);
    }

    const stepMs = operationMotionFieldStepDurationMs(reducedMotion);
    const timer = setTimeout(() => {
      setTimelineStepIndex((index) => Math.min(index + 1, TIMELINE_MAX_INDEX));
    }, stepMs);

    return () => clearTimeout(timer);
  }, [
    hasPendingMicroDecision,
    interactionState,
    reducedMotion,
    timelineStepIndex,
  ]);

  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  const handleComplete = useCallback(() => {
    if (interactionState !== 'completed') return;
    if (presentation.primaryCta.actionKey !== 'view_result') return;
    onComplete();
  }, [interactionState, onComplete, presentation.primaryCta.actionKey]);

  const footerDisabled =
    interactionState !== 'completed' || completeDisabled || applying;
  const footerLoading = applying;

  const footerSummary = useMemo(() => {
    if (interactionState === 'completed') {
      return `${presentation.selectedPlan.label} · operasyon tamamlandı`;
    }
    if (interactionState === 'paused_for_decision') {
      return 'Mikro karar bekleniyor';
    }
    return `${presentation.selectedPlan.label} · ${presentation.timeline.helperText ?? 'Takip ediliyor'}`;
  }, [interactionState, presentation.selectedPlan.label, presentation.timeline.helperText]);

  return (
    <View
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}>
        <PlanEventSummaryCard
          title={event.title}
          location={event.district}
          priorityLabel={`Sahada · ${event.district}`}
          remainingLabel={legacyModel.progressLabel}
          thumbnail={thumbnail}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="field" compact />
        </View>

        <FieldPhaseHeader
          title={presentation.title}
          subtitle={presentation.subtitle}
          liveLabel="Ekip yönlendirildi"
        />

        <FieldPlanSummaryStrip
          plan={presentation.selectedPlan}
          reducedMotion={reducedMotion}
        />

        <FieldAssignmentEffectStrip
          effect={presentation.assignmentEffect}
          reducedMotion={reducedMotion}
        />

        <FieldTimelineList
          timeline={presentation.timeline}
          operationStatus={presentation.operationStatus}
          reducedMotion={reducedMotion}
        />

        <EventFieldMicroDecisionCard
          event={event}
          microDecision={microDecisionPresentation}
          cardModel={microDecisionCardModel}
        />

        <EventFieldAssignmentSummary event={event} />

        <FieldImpactMetricsRow metrics={legacyModel.impactMetrics} />

        <FieldAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />

        <FieldNoteCard body={legacyModel.fieldNote} compact />
      </ScrollView>

      <FieldWorkflowFooter
        summaryLine={footerSummary}
        onPress={handleComplete}
        disabled={footerDisabled}
        loading={footerLoading}
        ctaLabel={presentation.primaryCta.label}
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
