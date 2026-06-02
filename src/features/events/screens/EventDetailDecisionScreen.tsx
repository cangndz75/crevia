import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ASSIGNMENT_COPY } from '@/core/assignments/assignmentConstants';
import { getEventAssignment } from '@/core/assignments/assignmentState';
import {
  buildAssignmentAnalyticsPayload,
  buildDecisionAnalyticsPayload,
  sanitizeAnalyticsEventType,
} from '@/core/analytics/analyticsPayloadBuilders';
import { buildCommonAnalyticsBase } from '@/core/analytics/analyticsRuntime';
import { trackCreviaEvent, trackOncePerRuntime } from '@/core/analytics/analyticsRuntime';
import {
  checkDecisionAffordability,
  type DecisionAffordabilityCheck,
} from '@/core/economy/economyAffordability';
import {
  playSuccessHaptic,
  playWarningHaptic,
} from '@/core/feedback/hapticFeedback';
import { AdvisorRecommendationBar } from '@/features/events/components/AdvisorRecommendationBar';
import { EventAdvisorHintCard } from '@/features/events/components/EventAdvisorHintCard';
import { OperationImpactPreviewStrip } from '@/features/events/components/OperationImpactPreviewStrip';
import { EventContainerContextCard } from '@/features/events/components/EventContainerContextCard';
import { EventDetailsAccordion } from '@/features/events/components/EventDetailsAccordion';
import { EventHeader } from '@/features/events/components/EventHeader';
import { EventInsightCard } from '@/features/events/components/EventInsightCard';
import { EventStatusTimeline } from '@/features/events/components/EventStatusTimeline';
import { FieldNoteCard } from '@/features/events/components/FieldNoteCard';
import { NeighborhoodIdentityMiniCard } from '@/features/neighborhoods/components/NeighborhoodIdentityMiniCard';
import { FieldResourcesCard } from '@/features/events/components/FieldResourcesCard';
import { EventDecisionList } from '@/features/events/components/EventDecisionList';
import { QuickDecisionActions } from '@/features/events/components/QuickDecisionActions';
import { EventInspectPhase } from '@/features/events/components/event-workflow/EventInspectPhase';
import { EventPlanPhase } from '@/features/events/components/event-workflow/EventPlanPhase';
import { EventDispatchPhase } from '@/features/events/components/event-workflow/dispatch/EventDispatchPhase';
import { EventFieldPhase } from '@/features/events/components/event-workflow/field/EventFieldPhase';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { StickyActionButton } from '@/features/events/components/StickyActionButton';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { PLAN_WORKFLOW_FOOTER_EXTRA } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  DISPATCH_WORKFLOW_FOOTER_EXTRA,
  FIELD_WORKFLOW_FOOTER_EXTRA,
} from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import {
  buildFirstEventGuidanceModel,
  buildWorkflowStepHintModel,
} from '@/core/onboarding/onboardingPresentation';
import {
  EVENT_WORKFLOW_FOOTER_EXTRA,
  type OperationWorkflowStepId,
} from '@/features/events/utils/eventWorkflowPresentation';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { selectPersonnelImpactPreviewForDecision } from '@/core/personnel/personnelPresentation';
import { selectVehicleImpactPreviewForDecision } from '@/core/vehicles/vehiclePresentation';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import { selectEventContainerContext } from '@/core/containers/containerSelectors';
import { mergeAdvisorWithContainerLine } from '@/core/containers/containerUiHelpers';
import {
  buildEventDetailsRows,
  buildFieldResources,
  getAdvisorRecommendation,
  getDefaultQuickActionId,
  getFieldNoteBody,
  getOfficerRoleLabel,
  kindFromDecisionId,
  resolveEventTimelineStatus,
  resolveQuickActions,
  resolveSelectedDecision,
  splitEventTitle,
} from '@/features/events/utils/eventDetailDecisionUtils';
import { getFieldNoteForEvent } from '@/features/events/utils/eventDecisionPresentation';
import {
  buildEventLifecycleContext,
  buildEventLifecycleMeta,
  getDecisionRecordForEvent,
  resolveEventCardById,
} from '@/core/liveFlow/eventLifecycleEngine';
import { getPilotRhythmChipLabel } from '@/core/events/pilotRhythmPresentation';
import { buildEventCarryOverHint, shouldShowCarryOverMemory } from '@/core/carryOver';
import {
  buildEventDetailCombinedFocusPresentation,
  shouldShowEventDomainFocus,
} from '@/core/events/eventDomainPresentation';
import { EventCarryOverHintCard } from '@/features/events/components/EventCarryOverHintCard';
import { EventDomainFocusStrip } from '@/features/events/components/EventDomainFocusStrip';
import { ResolvedEventSummaryCard } from '@/features/events/components/ResolvedEventSummaryCard';
import { buildEventDetailHeaderChips } from '@/features/events/utils/decisionTradeoffPresentation';
import { OnboardingFocusHint } from '@/features/onboarding/components/OnboardingFocusHint';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import {
  TutorialCoachOverlay,
  useTutorialHighlight,
} from '@/features/tutorial/TutorialCoachOverlay';
import { TutorialTarget } from '@/features/tutorial/TutorialTarget';
import { selectIsDay1TutorialActive } from '@/features/tutorial/tutorialSelectors';
import {
  useGameStore,
  selectContainerState,
  selectPersonnelState,
  selectVehicleStateFromStore,
} from '@/store/useGameStore';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type EventDetailDecisionScreenProps = {
  eventId: string;
};

export function EventDetailDecisionScreen({ eventId }: EventDetailDecisionScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [operationStep, setOperationStep] = useState<OperationWorkflowStepId>('inspect');

  const event = useGameStore((s) =>
    resolveEventCardById(eventId, s.gameState.events, s.eventPool),
  );
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const lastDecisionResult = useGameStore((s) => s.lastDecisionResult);
  const applyDecisionAction = useGameStore((s) => s.applyDecision);
  const refreshAssignmentForEvent = useGameStore((s) => s.refreshAssignmentForEvent);
  const confirmEventAssignment = useGameStore((s) => s.confirmEventAssignment);
  const markAssignmentDispatched = useGameStore((s) => s.markAssignmentDispatched);
  const assignments = useGameStore((s) => s.assignments);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const crisisState = useGameStore((s) => s.crisisState);
  const economyState = useGameStore((s) => s.economyState);
  const personnelState = useGameStore(selectPersonnelState);
  const eventAdvisor = useGameStore((s) => s.gameState.eventAdvisor);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const currentDay = gameState.city.day;
  const isDay1Tutorial = useGameStore(selectIsDay1TutorialActive);
  const dailyEventSet = useGameStore((s) => s.gameState.pilot.dailyEventSet);
  const containerState = useGameStore(selectContainerState);
  const vehicleState = useGameStore(selectVehicleStateFromStore);
  const dailyPriorityKey = useGameStore((s) => s.dailyPriorityState?.selectedKey);
  const fieldDuty = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.fieldDuty : undefined;
  });
  const routePreparation = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.routePreparation : undefined;
  });
  const neighborhoodPatrol = useGameStore((s) => {
    const day = s.gameState.city.day;
    const hub = s.hubQuickActionState;
    return hub.day === day ? hub.neighborhoodPatrol : undefined;
  });
  const neighborhoods = useGameStore((s) => s.neighborhoods);
  const resources = useGameStore((s) => s.resources);

  const [applying, setApplying] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const lifecycle = useMemo(() => {
    if (!event) return null;
    const ctx = buildEventLifecycleContext({
      currentDay,
      decisionHistory,
      solvedEventIds: useGameStore.getState().gameState.solvedEvents.map((e) => e.id),
      lastDecisionResult: lastDecisionResult ?? undefined,
      isDay1Tutorial,
    });
    return buildEventLifecycleMeta(event, ctx, decisionHistory);
  }, [event, currentDay, decisionHistory, lastDecisionResult, isDay1Tutorial]);

  const decisionRecord = useMemo(
    () => (event ? getDecisionRecordForEvent(event.id, decisionHistory) : undefined),
    [event, decisionHistory],
  );

  const quickActions = useMemo(
    () => (event ? resolveQuickActions(event) : []),
    [event],
  );

  const defaultDecisionId = useMemo(
    () => (event ? getDefaultQuickActionId(resolveQuickActions(event)) : null),
    [event],
  );

  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const { decisionId: effectiveSelectedId, decision: selectedDecision } = useMemo(
    () =>
      event
        ? resolveSelectedDecision(
            event,
            quickActions,
            selectedDecisionId,
            defaultDecisionId,
          )
        : { decisionId: null, decision: null },
    [defaultDecisionId, event, quickActions, selectedDecisionId],
  );

  useEffect(() => {
    if (
      selectedDecisionId &&
      event &&
      !event.decisions.some((d) => d.id === selectedDecisionId)
    ) {
      setSelectedDecisionId(null);
    }
  }, [event, selectedDecisionId]);

  const decisionAffordability = useMemo(() => {
    if (!event) return {};
    return Object.fromEntries(
      event.decisions.map((d) => [
        d.id,
        checkDecisionAffordability({ economyState, decision: d }),
      ]),
    );
  }, [economyState, event]);

  const selectedDecisionAffordability = effectiveSelectedId
    ? decisionAffordability[effectiveSelectedId]
    : undefined;
  const selectedPreviewInsufficient =
    selectedDecisionAffordability != null &&
    selectedDecisionAffordability.cost > 0 &&
    !selectedDecisionAffordability.canAfford;

  const fieldPersonnelPreview = useMemo(() => {
    if (!event || !selectedDecision || selectedPreviewInsufficient) return null;
    return selectPersonnelImpactPreviewForDecision(
      event,
      selectedDecision,
      personnelState,
      currentDay,
      { neighborhoods, resources, fieldDuty, neighborhoodPatrol },
    );
  }, [
    currentDay,
    event,
    fieldDuty,
    neighborhoodPatrol,
    neighborhoods,
    personnelState,
    resources,
    selectedDecision,
    selectedPreviewInsufficient,
  ]);

  const fieldVehiclePreview = useMemo(() => {
    if (!event || !selectedDecision || selectedPreviewInsufficient) return null;
    return selectVehicleImpactPreviewForDecision({
      vehicleState,
      event: {
        id: event.id,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        category: event.category,
        neighborhoodId: event.neighborhoodId,
        districtIds: event.districtIds,
        tags: event.filterTags,
      },
      decision: {
        id: selectedDecision.id,
        title: selectedDecision.title,
        description: selectedDecision.description,
        style: selectedDecision.style,
        decisionStyle: selectedDecision.decisionStyle,
        costs: selectedDecision.costs,
      },
      day: currentDay,
      routePreparation,
    });
  }, [
    currentDay,
    event,
    routePreparation,
    selectedDecision,
    selectedPreviewInsufficient,
    vehicleState,
  ]);

  const timelineStatus = useMemo(() => {
    const gameStatus = dailyEventSet?.eventStatuses?.[eventId] ?? null;
    return resolveEventTimelineStatus(eventId, gameStatus);
  }, [dailyEventSet, eventId]);

  const useOperationWorkflow = timelineStatus === 'review';
  const showInspectPhase = useOperationWorkflow && operationStep === 'inspect';
  const showPlanPhase = useOperationWorkflow && operationStep === 'plan';
  const showDispatchPhase = useOperationWorkflow && operationStep === 'assign';
  const showFieldPhase = useOperationWorkflow && operationStep === 'field';

  const isDay1LearningEvent = event ? isDay1LearningEventId(event.id) : false;

  const firstEventGuidance = useMemo(
    () =>
      buildFirstEventGuidanceModel({
        day: currentDay,
        eventId: event?.id,
        isDay1LearningEvent,
      }),
    [currentDay, event?.id, isDay1LearningEvent],
  );

  const workflowPhaseHint = useMemo(() => {
    const hint = buildWorkflowStepHintModel({
      step: operationStep,
      day: currentDay,
      isDay1LearningEvent,
    });
    return hint.visible ? hint.text : null;
  }, [operationStep, currentDay, isDay1LearningEvent]);

  const inspectPhaseHint = firstEventGuidance.showInspectBanner
    ? firstEventGuidance.inspectHint
    : null;

  const bottomPadding = useMemo(() => {
    const safe = Math.max(insets.bottom, 12);
    if (showInspectPhase) {
      return (
        eventDetail.ctaHeight +
        EVENT_WORKFLOW_FOOTER_EXTRA +
        safe +
        24
      );
    }
    if (showPlanPhase) {
      return eventDetail.ctaHeight + PLAN_WORKFLOW_FOOTER_EXTRA + safe + 24;
    }
    if (showDispatchPhase) {
      return eventDetail.ctaHeight + DISPATCH_WORKFLOW_FOOTER_EXTRA + safe + 24;
    }
    if (showFieldPhase) {
      return eventDetail.ctaHeight + FIELD_WORKFLOW_FOOTER_EXTRA + safe + 24;
    }
    return eventDetail.ctaHeight + safe + 34;
  }, [
    insets.bottom,
    showDispatchPhase,
    showFieldPhase,
    showInspectPhase,
    showPlanPhase,
  ]);

  const fieldNoteBody = useMemo(() => {
    if (!event) return '';
    const note = getFieldNoteForEvent(event, eventAdvisor);
    return note?.body ?? getFieldNoteBody(event);
  }, [event, eventAdvisor]);

  const fieldResources = useMemo(
    () => buildFieldResources(personnelState),
    [personnelState],
  );

  const selectedKind = useMemo(
    () => kindFromDecisionId(quickActions, effectiveSelectedId),
    [quickActions, effectiveSelectedId],
  );

  const containerAdvisorLine = useMemo(() => {
    if (!event) return null;
    const context = selectEventContainerContext(containerState, event);
    return context.advisorLine;
  }, [containerState, event]);

  const advisorText = useMemo(() => {
    const base = getAdvisorRecommendation(
      selectedDecision,
      selectedKind,
      eventAdvisor.body,
    );
    if (!event) return base;
    const includeContainer = isContainerRelevantEvent({
      id: event.id,
      title: event.title,
      category: event.category,
      eventType: event.eventType,
      neighborhoodId: event.neighborhoodId,
      tags: event.filterTags,
    });
    return mergeAdvisorWithContainerLine(
      base,
      containerAdvisorLine,
      includeContainer,
    );
  }, [
    containerAdvisorLine,
    event,
    eventAdvisor.body,
    selectedDecision,
    selectedKind,
  ]);

  const titleLines = useMemo(
    () => (event ? splitEventTitle(event.title) : { line1: '', line2: '' }),
    [event],
  );

  const detailRows = useMemo(
    () => (event ? buildEventDetailsRows(event) : []),
    [event],
  );

  const quickDecisionIds = useMemo(
    () => quickActions.map((a) => a.decision.id),
    [quickActions],
  );

  const headerChips = useMemo(() => {
    if (!event) return [];
    return buildEventDetailHeaderChips({
      event,
      neighborhoodLabel: event.district,
      dailyPriorityKey,
      rhythmLabel: getPilotRhythmChipLabel(event, event.day ?? currentDay),
    });
  }, [currentDay, dailyPriorityKey, event]);

  const domainFocusPresentation = useMemo(
    () =>
      buildEventDetailCombinedFocusPresentation({
        event: event ?? undefined,
        day: event?.day ?? currentDay,
      }),
    [currentDay, event],
  );

  const lastDailyReport = useGameStore((s) => s.lastDailyReport);
  const eventCarryOverHint = useMemo(
    () =>
      buildEventCarryOverHint({
        day: event?.day ?? currentDay,
        currentEvent: event ?? undefined,
        lastDailyReport,
        recentDecisions: decisionHistory,
        eventDomainFocus: domainFocusPresentation.model ?? undefined,
      }),
    [
      currentDay,
      decisionHistory,
      domainFocusPresentation.model,
      event,
      lastDailyReport,
    ],
  );

  const timelineHighlight = useTutorialHighlight('event_detail', 'event_status_timeline');
  const insightHighlight = useTutorialHighlight('event_detail', 'event_insight_card');
  const resourcesHighlight = useTutorialHighlight('event_detail', 'field_resources_card');
  const decisionsHighlight = useTutorialHighlight('event_detail', 'quick_decisions');
  const { focusHint: eventDetailHint, dismissHint } = useOnboardingHint(
    'event_detail',
    undefined,
    'event_detail_intro',
  );
  const { focusHint: decisionCardHint } = useOnboardingHint(
    'event_detail',
    'quick_decisions',
    'decision_card_intro',
  );

  const compactLayout = width < 360;
  const titleSize = compactLayout ? 32 : width < 390 ? 36 : 40;
  const titleLineHeight = Math.round(titleSize * 1.08);
  const officerCardWidth = width < 340 ? 100 : compactLayout ? 108 : 118;

  const goToHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const showInsufficientSourceAlert = useCallback(
    (affordability: DecisionAffordabilityCheck) => {
      playWarningHaptic();
      Alert.alert(
        'Kaynak yetersiz',
        `Bu karar için ${affordability.formattedMissingSource} Kaynak daha gerekiyor.`,
        [{ text: 'Tamam' }],
      );
    },
    [],
  );

  const applySelectedDecision = useCallback(() => {
    if (!event || !effectiveSelectedId || applying) return;

    const decision = event.decisions.find((d) => d.id === effectiveSelectedId);
    if (!decision) return;

    const affordability = decisionAffordability[effectiveSelectedId];
    if (affordability && !affordability.canAfford) {
      showInsufficientSourceAlert(affordability);
      return;
    }

    setApplying(true);
    try {
      const xpResult = applyDecisionAction(eventId, effectiveSelectedId);
      if (xpResult.success === false) {
        if (xpResult.reason === 'insufficient_source') {
          const guardAffordability = checkDecisionAffordability({
            economyState,
            decision,
          });
          showInsufficientSourceAlert(guardAffordability);
        } else if (xpResult.reason === 'already_resolved') {
          Alert.alert(
            'Olay çözüldü',
            'Bu olay için karar zaten verilmiş.',
            [{ text: 'Tamam', onPress: goToHub }],
          );
        } else {
          Alert.alert(
            'Karar uygulanamadı',
            'Karar şu an uygulanamıyor. Tekrar dene veya operasyon merkezine dön.',
            [{ text: 'Tamam' }],
          );
        }
        return;
      }
      playSuccessHaptic();
      if (selectedDecision) {
        trackCreviaEvent(
          'decision_selected',
          buildDecisionAnalyticsPayload(event, selectedDecision, gameState, monetization),
        );
      }
      router.push('/events/decision-result');
    } catch {
      Alert.alert(
        'Karar uygulanamadı',
        'Bu olay artık aktif değil. Operasyon merkezine dönüp güncel listeyi kontrol et.',
        [{ text: 'Tamam', onPress: goToHub }],
      );
    } finally {
      setApplying(false);
    }
  }, [
    applyDecisionAction,
    applying,
    decisionAffordability,
    economyState,
    event,
    eventId,
    goToHub,
    router,
    effectiveSelectedId,
    showInsufficientSourceAlert,
  ]);

  const handleApplyPress = useCallback(() => {
    if (!effectiveSelectedId) {
      Alert.alert('Karar seç', 'Devam etmek için bir kaynak seç.', [
        { text: 'Tamam' },
      ]);
      return;
    }
    applySelectedDecision();
  }, [applySelectedDecision, effectiveSelectedId]);

  const assignmentPrepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!event) return;
    trackOncePerRuntime(
      `first_event_opened:${event.id}`,
      'first_event_opened',
      buildCommonAnalyticsBase(gameState, 'event_plan', monetization),
      { eventType: sanitizeAnalyticsEventType(event) },
    );
  }, [event, gameState, monetization]);

  useEffect(() => {
    if (!event || operationStep !== 'assign') return;
    trackOncePerRuntime(
      `assignment_seen:${event.id}`,
      'assignment_seen',
      buildAssignmentAnalyticsPayload(
        event,
        getEventAssignment(assignments, event.id),
        gameState,
        monetization,
      ),
    );
  }, [assignments, event, gameState, monetization, operationStep]);

  useEffect(() => {
    if (!event || operationStep !== 'field') return;
    trackOncePerRuntime(
      `field_phase_started:${event.id}`,
      'field_phase_started',
      buildAssignmentAnalyticsPayload(
        event,
        getEventAssignment(assignments, event.id),
        gameState,
        monetization,
      ),
    );
  }, [assignments, event, gameState, monetization, operationStep]);

  useEffect(() => {
    if (!event || operationStep !== 'assign') return;
    if (assignmentPrepRef.current === event.id) return;
    assignmentPrepRef.current = event.id;
    refreshAssignmentForEvent(event.id);
    if (isDay1Tutorial) {
      confirmEventAssignment(event.id);
    }
  }, [
    event,
    operationStep,
    isDay1Tutorial,
    refreshAssignmentForEvent,
    confirmEventAssignment,
  ]);

  const eventAssignment = event
    ? getEventAssignment(assignments, event.id)
    : undefined;
  const assignmentReady =
    isDay1Tutorial ||
    eventAssignment?.status === 'confirmed' ||
    eventAssignment?.status === 'dispatched';

  const handleDispatchPress = useCallback(() => {
    if (!effectiveSelectedId) {
      Alert.alert('Kaynak seç', 'Sahaya yönlendirmek için bir karar seç.', [
        { text: 'Tamam' },
      ]);
      return;
    }
    const affordability = decisionAffordability[effectiveSelectedId];
    if (affordability && !affordability.canAfford) {
      showInsufficientSourceAlert(affordability);
      return;
    }
    if (!isDay1Tutorial) {
      const assignment = event
        ? getEventAssignment(useGameStore.getState().assignments, event.id)
        : undefined;
      if (
        !assignment ||
        (assignment.status !== 'confirmed' && assignment.status !== 'dispatched')
      ) {
        Alert.alert('Atama gerekli', ASSIGNMENT_COPY.dispatchBlocked, [
          { text: 'Tamam' },
        ]);
        return;
      }
    }
    if (event) {
      markAssignmentDispatched(event.id);
    }
    setOperationStep('field');
  }, [
    decisionAffordability,
    effectiveSelectedId,
    event,
    isDay1Tutorial,
    markAssignmentDispatched,
    showInsufficientSourceAlert,
  ]);

  if (!event) {
    return (
      <View style={styles.notFound}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="archive-outline" size={40} color={colors.textSecondary} />
        </View>
        <Text style={styles.notFoundTitle}>Bu olay artık aktif değil</Text>
        <Text style={styles.notFoundBody}>
          Bu olay çözümlenmiş veya gün değişmiş olabilir.
        </Text>
        <GameButton
          title="Operasyon Merkezine Dön"
          onPress={goToHub}
          style={styles.notFoundBtn}
        />
      </View>
    );
  }

  if (lifecycle?.status === 'archived') {
    return (
      <View style={styles.notFound}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="archive-outline" size={40} color={colors.textSecondary} />
        </View>
        <Text style={styles.notFoundTitle}>Arşivlendi</Text>
        <Text style={styles.notFoundBody}>
          Bu olay önceki günden arşivlendi. Güncel operasyon merkezinden devam et.
        </Text>
        <GameButton
          title="Operasyon Merkezine Dön"
          onPress={goToHub}
          style={styles.notFoundBtn}
        />
      </View>
    );
  }

  if (lifecycle?.status === 'resolved_today') {
    return (
      <View style={styles.root}>
        <EventHeader />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPadding, paddingTop: spacing.md },
          ]}>
          <ResolvedEventSummaryCard
            event={event}
            lifecycle={lifecycle}
            decisionRecord={decisionRecord}
            onBackToHub={goToHub}
          />
        </ScrollView>
      </View>
    );
  }

  if (showInspectPhase) {
    return (
      <View style={styles.root}>
        <EventHeader />
        <EventInspectPhase
          event={event}
          bottomPadding={bottomPadding}
          onOpenPlanning={() => setOperationStep('plan')}
          phaseHint={inspectPhaseHint}
        />
        <TutorialCoachOverlay
          screen="event_detail"
          bottomOffset={
            eventDetail.ctaHeight +
            EVENT_WORKFLOW_FOOTER_EXTRA +
            Math.max(insets.bottom, 12)
          }
        />
      </View>
    );
  }

  if (showPlanPhase) {
    return (
      <View style={styles.root}>
        <EventPlanPhase
          event={event}
          bottomPadding={bottomPadding}
          onConfirmPlan={() => setOperationStep('assign')}
          phaseHint={workflowPhaseHint}
        />
        <TutorialCoachOverlay
          screen="event_detail"
          bottomOffset={
            eventDetail.ctaHeight +
            PLAN_WORKFLOW_FOOTER_EXTRA +
            Math.max(insets.bottom, 12)
          }
        />
      </View>
    );
  }

  if (showDispatchPhase) {
    return (
      <View style={styles.root}>
        <EventHeader />
        <EventDispatchPhase
          event={event}
          bottomPadding={bottomPadding}
          quickActions={quickActions}
          fieldResources={fieldResources}
          selectedDecisionId={effectiveSelectedId}
          selectedDecisionTitle={selectedDecision?.title}
          onSelectDecision={setSelectedDecisionId}
          affordabilityByDecisionId={decisionAffordability}
          onDispatch={handleDispatchPress}
          dispatchDisabled={!effectiveSelectedId || !assignmentReady}
          decisionCardHint={decisionCardHint}
          onDismissHint={(id) => dismissHint(id)}
          resourcesHighlighted={resourcesHighlight}
          decisionsHighlighted={decisionsHighlight}
          compactTutorial={isDay1Tutorial}
          phaseHint={workflowPhaseHint}
          gameDay={currentDay}
          assignment={eventAssignment ?? null}
          operationSignals={operationSignals}
          operationalResources={operationalResources}
          crisisState={crisisState}
        />
        <TutorialCoachOverlay
          screen="event_detail"
          bottomOffset={
            eventDetail.ctaHeight +
            DISPATCH_WORKFLOW_FOOTER_EXTRA +
            Math.max(insets.bottom, 12)
          }
        />
      </View>
    );
  }

  if (showFieldPhase) {
    return (
      <View style={styles.root}>
        <EventHeader />
        <EventFieldPhase
          event={event}
          decision={selectedDecision}
          fieldNote={fieldNoteBody}
          bottomPadding={bottomPadding}
          personnelPreview={fieldPersonnelPreview}
          vehiclePreview={fieldVehiclePreview}
          onComplete={handleApplyPress}
          completeDisabled={!effectiveSelectedId || applying}
          applying={applying}
          phaseHint={workflowPhaseHint}
          gameDay={currentDay}
          assignment={eventAssignment ?? null}
          operationSignals={operationSignals}
          operationalResources={operationalResources}
          crisisState={crisisState}
        />
        <TutorialCoachOverlay
          screen="event_detail"
          bottomOffset={
            eventDetail.ctaHeight +
            FIELD_WORKFLOW_FOOTER_EXTRA +
            Math.max(insets.bottom, 12)
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <EventHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}>
        {useOperationWorkflow ? (
          <View style={styles.workflowStepperWrap}>
            <EventWorkflowStepper activeStep={operationStep} />
          </View>
        ) : null}

        <View style={styles.titleSection}>
          <View style={styles.titleLeft}>
            <Text
              style={[
                styles.mainTitle,
                { fontSize: titleSize, lineHeight: titleLineHeight },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail">
              {titleLines.line1}
            </Text>
            {titleLines.line2 ? (
              <Text
                style={[
                  styles.mainTitle,
                  { fontSize: titleSize, lineHeight: titleLineHeight },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {titleLines.line2}
              </Text>
            ) : null}
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={eventDetail.teal} />
              <Text style={styles.locationText} numberOfLines={1}>
                {event.district}
              </Text>
            </View>
          </View>

          <View style={[styles.officerCard, { width: officerCardWidth }]}>
            <LinearGradient
              colors={['#FFFFFF', eventDetail.mintSoft]}
              style={styles.avatar}>
              <Ionicons name="person" size={22} color={eventDetail.teal} />
            </LinearGradient>
            <Text style={styles.officerRole} numberOfLines={2}>
              {getOfficerRoleLabel(currentDay)}
            </Text>
            <Text style={styles.officerDay}>Gün {event.day ?? currentDay}</Text>
            {domainFocusPresentation.headline ? (
              <Text style={styles.themeFocusLine} numberOfLines={1}>
                {domainFocusPresentation.headline}
              </Text>
            ) : null}
            {domainFocusPresentation.subline && !domainFocusPresentation.compact ? (
              <Text style={styles.themeFocusSubline} numberOfLines={2}>
                {domainFocusPresentation.subline}
              </Text>
            ) : null}
            {headerChips.length > 0 ? (
              <View style={styles.chipRow}>
                {headerChips.map((chip) => (
                  <View key={chip.key} style={styles.chip}>
                    <Text style={styles.chipText} numberOfLines={1}>
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {!useOperationWorkflow ? (
          <TutorialTarget
            targetKey="event_status_timeline"
            highlighted={timelineHighlight}>
            <EventStatusTimeline activeStatus={timelineStatus} />
          </TutorialTarget>
        ) : null}

        <View style={styles.sectionGap}>
          <TutorialTarget
            targetKey="event_insight_card"
            highlighted={insightHighlight}>
            <EventInsightCard event={event} />
          </TutorialTarget>
        </View>

        {event &&
        domainFocusPresentation.model &&
        shouldShowEventDomainFocus(
          event.day ?? currentDay,
          'inspect',
          domainFocusPresentation.model.focus,
        ) ? (
          <View style={styles.sectionGap}>
            <EventDomainFocusStrip
              model={domainFocusPresentation.model}
              surface="inspect"
              compact={domainFocusPresentation.compact || isDay1Tutorial}
            />
          </View>
        ) : null}

        {event &&
        eventCarryOverHint?.visible &&
        shouldShowCarryOverMemory(event.day ?? currentDay, 'event_detail', {
          day: event.day ?? currentDay,
          currentEvent: event,
          lastDailyReport,
          recentDecisions: decisionHistory,
          eventDomainFocus: domainFocusPresentation.model ?? undefined,
        }) ? (
          <View style={styles.sectionGap}>
            <EventCarryOverHintCard
              memory={eventCarryOverHint}
              compact={isDay1Tutorial}
            />
          </View>
        ) : null}

        {eventDetailHint ? (
          <OnboardingFocusHint
            hint={eventDetailHint}
            onDismiss={() => dismissHint(eventDetailHint.id)}
          />
        ) : null}

        <FieldNoteCard body={fieldNoteBody} />

        {event ? (
          <View style={styles.sectionGap}>
            <NeighborhoodIdentityMiniCard
              neighborhoodId={event.neighborhoodId ?? event.district}
              compact={isDay1Tutorial}
            />
          </View>
        ) : null}

        {event ? (
          <EventContainerContextCard event={event} containerState={containerState} />
        ) : null}

        <View style={styles.sectionGap}>
          <TutorialTarget
            targetKey="field_resources_card"
            highlighted={resourcesHighlight}>
            <FieldResourcesCard rows={fieldResources} />
          </TutorialTarget>
        </View>

        {decisionCardHint ? (
          <OnboardingFocusHint
            hint={decisionCardHint}
            onDismiss={() => dismissHint(decisionCardHint.id)}
          />
        ) : null}

        {event ? <EventAdvisorHintCard event={event} /> : null}

        {event && selectedDecision ? (
          <OperationImpactPreviewStrip
            event={event}
            decision={selectedDecision}
            compact={isDay1Tutorial}
          />
        ) : null}

        <TutorialTarget
          targetKey="quick_decisions"
          highlighted={decisionsHighlight}>
          <QuickDecisionActions
            event={event}
            actions={quickActions}
            selectedDecisionId={effectiveSelectedId}
            onSelect={setSelectedDecisionId}
            affordabilityByDecisionId={decisionAffordability}
            variant="quick"
          />
        </TutorialTarget>

        <View style={styles.sectionGap}>
          <EventDecisionList
            event={event}
            selectedDecisionId={effectiveSelectedId}
            onSelect={setSelectedDecisionId}
            affordabilityByDecisionId={decisionAffordability}
            excludeDecisionIds={quickDecisionIds}
            variant="full"
          />
        </View>

        <View style={styles.sectionGap}>
          <EventDetailsAccordion
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((v) => !v)}
            rows={detailRows}
          />
        </View>

        <View style={styles.sectionGap}>
          <AdvisorRecommendationBar text={advisorText} />
        </View>
      </ScrollView>

      <StickyActionButton
        onPress={handleApplyPress}
        disabled={!effectiveSelectedId || applying}
        loading={applying}
      />
      <TutorialCoachOverlay
        screen="event_detail"
        bottomOffset={eventDetail.ctaHeight + Math.max(insets.bottom, 12)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    gap: eventDetail.sectionGap,
    paddingTop: 4,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: eventDetail.screenPadding,
  },
  titleLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  mainTitle: {
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flex: 1,
  },
  officerCard: {
    flexShrink: 0,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    shadowColor: '#063F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  officerRole: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textDark,
    textAlign: 'center',
    lineHeight: 13,
  },
  officerDay: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  themeFocusLine: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.teal,
    marginBottom: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  themeFocusSubline: {
    fontSize: 9,
    fontWeight: '500',
    color: eventDetail.textMuted,
    marginBottom: 4,
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 12,
  },
  chipRow: {
    gap: 4,
    width: '100%',
  },
  chip: {
    backgroundColor: eventDetail.mint,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
  sectionGap: {
    marginTop: 2,
  },
  workflowStepperWrap: {
    marginBottom: -4,
  },
  notFound: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: eventDetail.bg,
  },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notFoundTitle: {
    ...typography.title,
    textAlign: 'center',
  },
  notFoundBody: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  notFoundBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
