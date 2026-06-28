import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import { calculateAssignmentCompatibility } from '@/core/assignments/assignmentEngine';
import { buildAssignmentEngineInputFromGameStore } from '@/core/assignments/assignmentPresentation';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import { operationMotionDispatchSentDurationMs } from '@/core/motion/operationMotionTokens';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { EventDecisionList } from '@/features/events/components/EventDecisionList';
import { QuickDecisionActions } from '@/features/events/components/QuickDecisionActions';
import { EventAssignmentPanel } from '@/features/events/components/assignment/EventAssignmentPanel';
import {
  DispatchAdvisorCommentCard,
  DispatchBlockersList,
  DispatchPhaseHeading,
  DispatchPlanSummaryStrip,
  DispatchReadinessPanel,
  DispatchResourceSummaryCard,
  DispatchRouteStepStrip,
  DispatchSecondaryActionsRow,
} from '@/features/events/components/event-workflow/dispatch/DispatchMotionSections';
import { DispatchWorkflowFooter } from '@/features/events/components/event-workflow/dispatch/DispatchWorkflowFooter';
import { OnboardingFocusHint } from '@/features/onboarding/components/OnboardingFocusHint';
import type { OnboardingHint } from '@/core/onboarding/onboardingTypes';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { OperationPhaseBridgeCard } from '@/features/events/components/event-workflow/OperationPhaseBridgeCard';
import { OperationPhaseContentEnter } from '@/features/events/components/event-workflow/OperationPhaseContentEnter';
import { OperationPhaseProgressRail } from '@/features/events/components/event-workflow/OperationPhaseProgressRail';
import { OperationPhaseShellHeader } from '@/features/events/components/event-workflow/OperationPhaseShellHeader';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldResourceRow, ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import {
  buildEventDispatchPhasePresentation,
  type EventDispatchActionKey,
  type EventDispatchInteractionState,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
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
  onBack?: () => void;
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
  fieldResources: _fieldResources,
  selectedDecisionId,
  selectedDecisionTitle,
  onSelectDecision,
  affordabilityByDecisionId,
  onDispatch,
  onBack,
  dispatchDisabled = false,
  decisionCardHint,
  onDismissHint,
  resourcesHighlighted: _resourcesHighlighted = false,
  decisionsHighlighted = false,
  compactTutorial = false,
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
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const maintenanceBacklogRuntime = useGameStore((s) => s.maintenanceBacklogRuntime);
  const [dispatchInteractionState, setDispatchInteractionState] =
    useState<EventDispatchInteractionState>('idle');

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
        maintenanceBacklogRuntime,
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
      maintenanceBacklogRuntime,
      reducedMotion,
      selectedDecisionId,
      selectedPlanStrategyId,
      selectedPlanStrategyLabel,
    ],
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
    const planPart = presentation.selectedPlan.label;
    const decisionPart = selectedDecisionTitle ?? 'Operasyon hazır';
    return `${planPart} · ${decisionPart}`;
  }, [
    dispatchInteractionState,
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

  const handleSecondaryAction = useCallback((_actionKey: EventDispatchActionKey) => {
    // Presentation-only helpers; gameplay navigation intentionally deferred.
  }, []);

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
    dispatchDisabled || dispatchInteractionState !== 'idle' || !presentation.primaryCta.enabled;
  const footerLoading = dispatchInteractionState === 'dispatching';
  const footerCtaLabel =
    footerDisabled && !footerLoading
      ? presentation.primaryCta.disabledLabel
      : presentation.primaryCta.label;
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
          shell={presentation.phaseTransition.shell}
          compact={compact}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />

        <OperationPhaseProgressRail
          progress={presentation.phaseTransition.progress}
          reducedMotion={reducedMotion}
        />

        <DispatchPhaseHeading
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
        <DispatchPlanSummaryStrip
          plan={presentation.selectedPlan}
          reducedMotion={reducedMotion}
        />

        <DispatchReadinessPanel
          readiness={presentation.readiness}
          reducedMotion={reducedMotion}
        />

        <DispatchResourceSummaryCard
          summary={presentation.resourceSummary}
          reducedMotion={reducedMotion}
        />

        <EventAssignmentPanel event={event} compactTutorial={compactTutorial} />

        <DispatchRouteStepStrip
          route={presentation.routePreview}
          highlight={routeHighlight}
          reducedMotion={reducedMotion}
        />

        <DispatchBlockersList
          blockers={presentation.blockers}
          reducedMotion={reducedMotion}
        />

        {dispatchInteractionState !== 'idle' ? (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText} numberOfLines={1}>
              {presentation.dispatchFeedback.label}
            </Text>
          </View>
        ) : null}

        <DispatchAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />

        <DispatchSecondaryActionsRow
          actions={presentation.actions}
          reducedMotion={reducedMotion}
          onActionPress={handleSecondaryAction}
        />

        {decisionCardHint && onDismissHint ? (
          <OnboardingFocusHint
            hint={decisionCardHint}
            onDismiss={() => onDismissHint(decisionCardHint.id)}
          />
        ) : null}

        {compactTutorial ? (
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
        ) : null}

        {compactTutorial ? (
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
        </OperationPhaseContentEnter>
      </ScrollView>

      <DispatchWorkflowFooter
        summaryLine={footerSummary}
        onPress={handleFooterPress}
        disabled={footerDisabled}
        loading={footerLoading}
        ctaLabel={footerCtaLabel}
        warningSubline={presentation.primaryCta.warningSubline}
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
