import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  checkDecisionAffordability,
  type DecisionAffordabilityCheck,
} from '@/core/economy/economyAffordability';
import { AdvisorRecommendationBar } from '@/features/events/components/AdvisorRecommendationBar';
import { EventContainerContextCard } from '@/features/events/components/EventContainerContextCard';
import { EventDetailsAccordion } from '@/features/events/components/EventDetailsAccordion';
import { EventHeader } from '@/features/events/components/EventHeader';
import { EventInsightCard } from '@/features/events/components/EventInsightCard';
import { EventStatusTimeline } from '@/features/events/components/EventStatusTimeline';
import { FieldNoteCard } from '@/features/events/components/FieldNoteCard';
import { NeighborhoodIdentityMiniCard } from '@/features/neighborhoods/components/NeighborhoodIdentityMiniCard';
import { FieldResourcesCard } from '@/features/events/components/FieldResourcesCard';
import { QuickDecisionActions } from '@/features/events/components/QuickDecisionActions';
import { EventInspectPhase } from '@/features/events/components/event-workflow/EventInspectPhase';
import { EventPlanPhase } from '@/features/events/components/event-workflow/EventPlanPhase';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { StickyActionButton } from '@/features/events/components/StickyActionButton';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { PLAN_WORKFLOW_FOOTER_EXTRA } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  EVENT_WORKFLOW_FOOTER_EXTRA,
  type OperationWorkflowStepId,
} from '@/features/events/utils/eventWorkflowPresentation';
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
import { formatUrgencyLabel, getRiskLevelLabel } from '@/core/content/mockGameData';
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

  const event = useGameStore((s) => s.gameState.events.find((e) => e.id === eventId));
  const applyDecisionAction = useGameStore((s) => s.applyDecision);
  const economyState = useGameStore((s) => s.economyState);
  const personnelState = useGameStore(selectPersonnelState);
  const eventAdvisor = useGameStore((s) => s.gameState.eventAdvisor);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const isDay1Tutorial = useGameStore(selectIsDay1TutorialActive);
  const dailyEventSet = useGameStore((s) => s.gameState.pilot.dailyEventSet);
  const containerState = useGameStore(selectContainerState);

  const [applying, setApplying] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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

  const timelineStatus = useMemo(() => {
    const gameStatus = dailyEventSet?.eventStatuses?.[eventId] ?? null;
    return resolveEventTimelineStatus(eventId, gameStatus);
  }, [dailyEventSet, eventId]);

  const useOperationWorkflow = timelineStatus === 'review';
  const showInspectPhase = useOperationWorkflow && operationStep === 'inspect';
  const showPlanPhase = useOperationWorkflow && operationStep === 'plan';

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
    return eventDetail.ctaHeight + safe + 34;
  }, [insets.bottom, showInspectPhase, showPlanPhase]);

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

  const timelineHighlight = useTutorialHighlight('event_detail', 'event_status_timeline');
  const insightHighlight = useTutorialHighlight('event_detail', 'event_insight_card');
  const resourcesHighlight = useTutorialHighlight('event_detail', 'field_resources_card');
  const decisionsHighlight = useTutorialHighlight('event_detail', 'quick_decisions');

  const compactLayout = width < 360;
  const titleSize = compactLayout ? 32 : width < 390 ? 36 : 40;
  const titleLineHeight = Math.round(titleSize * 1.08);
  const officerCardWidth = width < 340 ? 100 : compactLayout ? 108 : 118;

  const goToHub = useCallback(() => {
    router.replace('/');
  }, [router]);

  const showInsufficientSourceAlert = useCallback(
    (affordability: DecisionAffordabilityCheck) => {
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
      Alert.alert('Karar seç', 'Devam etmek için bir hızlı işlem seç.', [
        { text: 'Tamam' },
      ]);
      return;
    }
    applySelectedDecision();
  }, [applySelectedDecision, effectiveSelectedId]);

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

  const priorityLabel = getRiskLevelLabel(event.riskLevel);

  if (showInspectPhase) {
    return (
      <View style={styles.root}>
        <EventHeader />
        <EventInspectPhase
          event={event}
          bottomPadding={bottomPadding}
          onOpenPlanning={() => setOperationStep('plan')}
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
        <EventHeader />
        <EventPlanPhase
          event={event}
          bottomPadding={bottomPadding}
          onConfirmPlan={() => setOperationStep('assign')}
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
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {formatUrgencyLabel(event.urgencyHours)}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  Öncelik: {priorityLabel}
                </Text>
              </View>
            </View>
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

        <TutorialTarget
          targetKey="quick_decisions"
          highlighted={decisionsHighlight}>
          <QuickDecisionActions
            actions={quickActions}
            selectedDecisionId={effectiveSelectedId}
            onSelect={setSelectedDecisionId}
          />
        </TutorialTarget>

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
