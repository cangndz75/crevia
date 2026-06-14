import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import { calculateAssignmentCompatibility } from '@/core/assignments/assignmentEngine';
import {
  buildAssignmentEngineInputFromGameStore,
} from '@/core/assignments/assignmentPresentation';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import {
  operationMotionDispatchSentDurationMs,
} from '@/core/motion/operationMotionTokens';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { EventDecisionList } from '@/features/events/components/EventDecisionList';
import { QuickDecisionActions } from '@/features/events/components/QuickDecisionActions';
import { EventAssignmentPanel } from '@/features/events/components/assignment/EventAssignmentPanel';
import { DispatchCommandCard } from '@/features/events/components/event-workflow/dispatch/DispatchCommandCard';
import {
  DispatchAdvisorCommentCard,
  DispatchCompatibilityStrip,
  DispatchPhaseHeader,
  DispatchPlanSummaryStrip,
  DispatchRouteStepStrip,
} from '@/features/events/components/event-workflow/dispatch/DispatchMotionSections';
import { DispatchWorkflowFooter } from '@/features/events/components/event-workflow/dispatch/DispatchWorkflowFooter';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { FieldResourcesCard } from '@/features/events/components/FieldResourcesCard';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { OperationImpactPreviewStrip } from '@/features/events/components/OperationImpactPreviewStrip';
import { OnboardingFocusHint } from '@/features/onboarding/components/OnboardingFocusHint';
import type { OnboardingHint } from '@/core/onboarding/onboardingTypes';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldResourceRow, ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import {
  buildEventDispatchPhasePresentation,
  type EventDispatchInteractionState,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildDispatchScreenModel,
} from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { resolveInspectDistrictId } from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

type Props = {
  event: EventCard;
  bottomPadding: number;
  quickActions: ResolvedQuickAction[];
  fieldResources: FieldResourceRow[];
  selectedDecisionId: string | null;
  selectedDecisionTitle?: string;
  onSelectDecision: (decisionId: string) => void;
  affordabilityByDecisionId: Record<string, DecisionAffordabilityCheck>;
  onDispatch: () => void;
  dispatchDisabled?: boolean;
  decisionCardHint?: OnboardingHint | null;
  onDismissHint?: (id: string) => void;
  resourcesHighlighted?: boolean;
  decisionsHighlighted?: boolean;
  compactTutorial?: boolean;
  phaseHint?: string | null;
  gameDay?: number;
  assignment?: EventAssignmentState | null;
  selectedPlanStrategyId?: EventPlanStrategyId | null;
  selectedPlanStrategyLabel?: string | null;
  isDay1LearningEvent?: boolean;
};

export function EventDispatchPhase({
  event,
  bottomPadding,
  quickActions,
  fieldResources,
  selectedDecisionId,
  selectedDecisionTitle,
  onSelectDecision,
  affordabilityByDecisionId,
  onDispatch,
  dispatchDisabled = false,
  decisionCardHint,
  onDismissHint,
  resourcesHighlighted = false,
  decisionsHighlighted = false,
  compactTutorial = false,
  phaseHint = null,
  gameDay = 1,
  assignment = null,
  selectedPlanStrategyId = null,
  selectedPlanStrategyLabel = null,
  isDay1LearningEvent = false,
}: Props) {
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const [dispatchInteractionState, setDispatchInteractionState] =
    useState<EventDispatchInteractionState>('idle');

  const selectedDecision = useMemo(
    () => event.decisions.find((d) => d.id === selectedDecisionId) ?? null,
    [event.decisions, selectedDecisionId],
  );

  const assignmentCompatibility = useMemo(() => {
    if (!assignment) return null;
    const storeSlice = useGameStore.getState();
    const input = buildAssignmentEngineInputFromGameStore(storeSlice);
    return calculateAssignmentCompatibility(input, event, assignment);
  }, [assignment, event]);

  const assignmentReady =
    compactTutorial ||
    assignment?.status === 'confirmed' ||
    assignment?.status === 'dispatched';

  const authorityGameplayContext = useMemo(
    () =>
      buildAuthorityGameplayPresentationContext({
        authorityState,
        day: gameDay,
        isDay1LearningEvent,
      }),
    [authorityState, gameDay, isDay1LearningEvent],
  );

  const presentation = useMemo(
    () =>
      buildEventDispatchPhasePresentation({
        event,
        assignment,
        compatibility: assignmentCompatibility,
        selectedPlanStrategyId,
        selectedPlanStrategyLabel,
        assignmentReady,
        hasSelectedDecision: Boolean(selectedDecisionId),
        dispatchInteractionState,
        day: gameDay,
        isDay1LearningEvent,
        reducedMotion,
        authorityGameplayContext,
      }),
    [
      assignment,
      assignmentCompatibility,
      assignmentReady,
      authorityGameplayContext,
      dispatchInteractionState,
      event,
      gameDay,
      isDay1LearningEvent,
      reducedMotion,
      selectedDecisionId,
      selectedPlanStrategyId,
      selectedPlanStrategyLabel,
    ],
  );

  const legacyModel = useMemo(
    () =>
      buildDispatchScreenModel({
        event,
        selectedDecision,
        selectedPlanStrategyLabel: presentation.selectedPlan.label,
      }),
    [event, presentation.selectedPlan.label, selectedDecision],
  );

  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  const quickDecisionIds = useMemo(
    () => quickActions.map((a) => a.decision.id),
    [quickActions],
  );

  const routeHighlight =
    dispatchInteractionState === 'dispatching' || dispatchInteractionState === 'sent';

  const footerSummary = useMemo(() => {
    if (dispatchInteractionState === 'dispatching') {
      return presentation.dispatchFeedback.helperText ?? presentation.dispatchFeedback.label;
    }
    if (dispatchInteractionState === 'sent') {
      return presentation.dispatchFeedback.label;
    }
    const planPart = `Plan: ${presentation.selectedPlan.label}`;
    const decisionPart = selectedDecisionTitle ?? legacyModel.footerSummaryLine;
    return `${planPart} · ${decisionPart}`;
  }, [
    dispatchInteractionState,
    legacyModel.footerSummaryLine,
    presentation.dispatchFeedback.helperText,
    presentation.dispatchFeedback.label,
    presentation.selectedPlan.label,
    selectedDecisionTitle,
  ]);

  const handleFooterPress = useCallback(() => {
    if (dispatchDisabled || dispatchInteractionState !== 'idle') return;
    if (presentation.primaryCta.actionKey !== 'send_to_field') return;
    setDispatchInteractionState('dispatching');
  }, [
    dispatchDisabled,
    dispatchInteractionState,
    presentation.primaryCta.actionKey,
  ]);

  useEffect(() => {
    if (dispatchInteractionState !== 'dispatching') return;

    const dispatchMs = presentation.dispatchFeedback.durationMs;
    const timer = setTimeout(() => {
      setDispatchInteractionState('sent');
    }, dispatchMs);

    return () => clearTimeout(timer);
  }, [dispatchInteractionState, presentation.dispatchFeedback.durationMs]);

  useEffect(() => {
    if (dispatchInteractionState !== 'sent') return;

    const sentMs = operationMotionDispatchSentDurationMs(reducedMotion);
    const timer = setTimeout(() => {
      onDispatch();
    }, sentMs);

    return () => clearTimeout(timer);
  }, [dispatchInteractionState, onDispatch, reducedMotion]);

  const footerDisabled =
    dispatchDisabled || dispatchInteractionState !== 'idle';
  const footerLoading = dispatchInteractionState === 'dispatching';

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
          priorityLabel={legacyModel.priorityLabel}
          remainingLabel={legacyModel.remainingLabel}
          thumbnail={thumbnail}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="assign" compact />
        </View>

        <DispatchPhaseHeader
          title={presentation.title}
          subtitle={presentation.subtitle}
        />

        <DispatchPlanSummaryStrip
          plan={presentation.selectedPlan}
          reducedMotion={reducedMotion}
        />

        <DispatchCommandCard model={legacyModel} />

        <EventAssignmentPanel event={event} compactTutorial={compactTutorial} />

        <DispatchCompatibilityStrip
          compatibility={presentation.compatibility}
          reducedMotion={reducedMotion}
        />

        <DispatchRouteStepStrip
          route={presentation.routePreview}
          highlight={routeHighlight}
          reducedMotion={reducedMotion}
        />

        {dispatchInteractionState !== 'idle' ? (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText} numberOfLines={1}>
              {presentation.dispatchFeedback.label}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionGap}>
          <TutorialTarget
            targetKey="field_resources_card"
            highlighted={resourcesHighlighted}>
            <FieldResourcesCard rows={fieldResources} compact />
          </TutorialTarget>
        </View>

        {decisionCardHint && onDismissHint ? (
          <OnboardingFocusHint
            hint={decisionCardHint}
            onDismiss={() => onDismissHint(decisionCardHint.id)}
          />
        ) : null}

        <DispatchAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />

        {selectedDecision ? (
          <OperationImpactPreviewStrip event={event} decision={selectedDecision} />
        ) : (
          <OperationImpactPreviewStrip event={event} />
        )}

        <TutorialTarget targetKey="quick_decisions" highlighted={decisionsHighlighted}>
          <QuickDecisionActions
            event={event}
            actions={quickActions}
            selectedDecisionId={selectedDecisionId}
            onSelect={onSelectDecision}
            affordabilityByDecisionId={affordabilityByDecisionId}
            variant="compact"
            sectionTitle="Kaynak seçimi"
          />
        </TutorialTarget>

        {!compactTutorial ? (
          <View style={styles.sectionGap}>
            <EventDecisionList
              event={event}
              selectedDecisionId={selectedDecisionId}
              onSelect={onSelectDecision}
              affordabilityByDecisionId={affordabilityByDecisionId}
              excludeDecisionIds={quickDecisionIds}
              variant="full"
              title="Alternatif yönlendirmeler"
            />
          </View>
        ) : null}
      </ScrollView>

      <DispatchWorkflowFooter
        summaryLine={footerSummary}
        onPress={handleFooterPress}
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
  sectionGap: {
    marginTop: -2,
  },
  feedbackBanner: {
    marginHorizontal: eventDetail.screenPadding,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: eventDetail.smallRadius,
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.2)',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
});
