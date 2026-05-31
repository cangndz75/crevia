import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import { EventAdvisorHintCard } from '@/features/events/components/EventAdvisorHintCard';
import { OperationImpactPreviewStrip } from '@/features/events/components/OperationImpactPreviewStrip';
import { EventDecisionList } from '@/features/events/components/EventDecisionList';
import { QuickDecisionActions } from '@/features/events/components/QuickDecisionActions';
import { EventAssignmentPanel } from '@/features/events/components/assignment/EventAssignmentPanel';
import { DispatchCommandCard } from '@/features/events/components/event-workflow/dispatch/DispatchCommandCard';
import { DispatchWorkflowFooter } from '@/features/events/components/event-workflow/dispatch/DispatchWorkflowFooter';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { FieldResourcesCard } from '@/features/events/components/FieldResourcesCard';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { OnboardingFocusHint } from '@/features/onboarding/components/OnboardingFocusHint';
import type { OnboardingHint } from '@/core/onboarding/onboardingTypes';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldResourceRow, ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildDispatchScreenModel,
} from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { resolveInspectDistrictId } from '@/features/events/utils/eventWorkflowPresentation';

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
  /** Day 1 tutorial: alternatif karar listesini gizle, akışı sade tut. */
  compactTutorial?: boolean;
  phaseHint?: string | null;
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
}: Props) {
  const selectedDecision = useMemo(
    () => event.decisions.find((d) => d.id === selectedDecisionId) ?? null,
    [event.decisions, selectedDecisionId],
  );

  const model = useMemo(
    () => buildDispatchScreenModel({ event, selectedDecision }),
    [event, selectedDecision],
  );

  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  const quickDecisionIds = useMemo(
    () => quickActions.map((a) => a.decision.id),
    [quickActions],
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
          <EventWorkflowStepper activeStep="assign" compact />
        </View>

        <DispatchCommandCard model={model} />

        <EventAssignmentPanel event={event} compactTutorial={compactTutorial} />

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

        <EventAdvisorHintCard event={event} />

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
        summaryLine={selectedDecisionTitle ?? model.footerSummaryLine}
        onPress={onDispatch}
        disabled={dispatchDisabled}
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
});
