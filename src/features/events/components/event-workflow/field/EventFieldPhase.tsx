import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import {
  operationMotionFieldCompleteHighlightMs,
  operationMotionFieldStepDurationMs,
} from '@/core/motion/operationMotionTokens';
import { FieldWorkflowFooter } from '@/features/events/components/event-workflow/field/FieldWorkflowFooter';
import { EventFieldMicroDecisionCard } from '@/features/events/components/event-workflow/field/EventFieldMicroDecisionCard';
import {
  FieldAdvisorCommentCard,
  FieldFeedbackList,
  FieldFirstImpactPanel,
  FieldPhaseHeading,
  FieldProgressStepper,
  FieldResourcePulsePanel,
  FieldSecondaryActionsRow,
  FieldStatusHeroCard,
} from '@/features/events/components/event-workflow/field/FieldMotionSections';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { OperationPhaseBridgeCard } from '@/features/events/components/event-workflow/OperationPhaseBridgeCard';
import { OperationPhaseContentEnter } from '@/features/events/components/event-workflow/OperationPhaseContentEnter';
import { OperationPhaseProgressRail } from '@/features/events/components/event-workflow/OperationPhaseProgressRail';
import { OperationPhaseShellHeader } from '@/features/events/components/event-workflow/OperationPhaseShellHeader';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventFieldPhasePresentation,
  mapMicroDecisionCardToFieldPresentation,
  type EventFieldActionKey,
  type EventFieldInteractionState,
} from '@/features/events/utils/eventFieldPhasePresentation';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

const TIMELINE_MAX_INDEX = 2;

type Props = {
  event: EventCard;
  decision: EventDecision | null;
  fieldNote: string;
  bottomPadding: number;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
  onComplete: () => void;
  onBack?: () => void;
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
  decision: _decision,
  fieldNote: _fieldNote,
  bottomPadding,
  personnelPreview: _personnelPreview = null,
  vehiclePreview: _vehiclePreview = null,
  onComplete,
  onBack,
  completeDisabled = false,
  applying = false,
  phaseHint = null,
  gameDay = 1,
  assignment = null,
  selectedPlanStrategyId = null,
  selectedPlanStrategyLabel = null,
  isDay1LearningEvent = false,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const maintenanceBacklogRuntime = useGameStore((s) => s.maintenanceBacklogRuntime);

  const [interactionState, setInteractionState] =
    useState<EventFieldInteractionState>('running');
  const [timelineStepIndex, setTimelineStepIndex] = useState(0);

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
        maintenanceBacklogRuntime,
      }),
    [
      assignment,
      authorityGameplayContext,
      event,
      gameDay,
      interactionState,
      isDay1LearningEvent,
      maintenanceBacklogRuntime,
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

  const handleComplete = useCallback(() => {
    if (interactionState !== 'completed') return;
    if (presentation.primaryCta.actionKey !== 'view_result') return;
    onComplete();
  }, [interactionState, onComplete, presentation.primaryCta.actionKey]);

  const handleSecondaryAction = useCallback((_actionKey: EventFieldActionKey) => {
    // Presentation-only helpers; gameplay navigation intentionally deferred.
  }, []);

  const footerDisabled =
    interactionState !== 'completed' || completeDisabled || applying;
  const footerLoading = applying;
  const footerCtaLabel =
    footerDisabled && !footerLoading
      ? presentation.primaryCta.disabledLabel
      : presentation.primaryCta.label;

  const footerSummary = useMemo(() => {
    if (interactionState === 'completed') {
      return `${presentation.selectedPlan.label} · operasyon tamamlandı`;
    }
    if (interactionState === 'paused_for_decision') {
      return 'Mikro karar bekleniyor';
    }
    return `${presentation.selectedPlan.label} · ${presentation.timeline.helperText ?? 'Saha sinyali izleniyor'}`;
  }, [
    interactionState,
    presentation.selectedPlan.label,
    presentation.timeline.helperText,
  ]);

  const compact = width < 370;

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(
              bottomPadding,
              108 + Math.max(insets.bottom, 12),
            ),
          },
        ]}>
        <OperationPhaseShellHeader
          shell={{
            ...presentation.phaseTransition.shell,
            subtitle:
              presentation.subtitle ?? presentation.phaseTransition.shell.subtitle,
          }}
          compact={compact}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />

        <OperationPhaseProgressRail
          progress={presentation.phaseTransition.progress}
          reducedMotion={reducedMotion}
        />

        <FieldPhaseHeading
          heading={presentation.phaseHeading}
          description={presentation.phaseDescription}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        {presentation.phaseTransition.bridge ? (
          <OperationPhaseBridgeCard
            bridge={presentation.phaseTransition.bridge}
            reducedMotion={reducedMotion}
            index={2}
          />
        ) : null}

        <OperationPhaseContentEnter reducedMotion={reducedMotion} index={3}>
        <FieldStatusHeroCard hero={presentation.statusHero} reducedMotion={reducedMotion} />

        <FieldProgressStepper
          timeline={presentation.timeline}
          operationStatus={presentation.operationStatus}
          reducedMotion={reducedMotion}
        />

        <FieldFeedbackList
          feedback={presentation.fieldFeedback}
          reducedMotion={reducedMotion}
        />

        <FieldFirstImpactPanel
          impact={presentation.firstImpact}
          reducedMotion={reducedMotion}
        />

        <FieldResourcePulsePanel
          pulse={presentation.resourcePulse}
          reducedMotion={reducedMotion}
        />

        <EventFieldMicroDecisionCard
          event={event}
          microDecision={microDecisionPresentation}
          cardModel={microDecisionCardModel}
        />

        <FieldAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />

        <FieldSecondaryActionsRow
          actions={presentation.actions}
          reducedMotion={reducedMotion}
          onActionPress={handleSecondaryAction}
        />
        </OperationPhaseContentEnter>
      </ScrollView>

      <FieldWorkflowFooter
        summaryLine={footerSummary}
        onPress={handleComplete}
        disabled={footerDisabled}
        loading={footerLoading}
        ctaLabel={footerCtaLabel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    gap: 12,
    paddingTop: 8,
    minWidth: 0,
  },
});
