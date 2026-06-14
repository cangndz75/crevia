import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import { operationInspectScanConfig } from '@/core/motion/motionPresets';
import type { EventCard } from '@/core/models/EventCard';
import {
  EventInspectAdvisorCommentCard,
  EventInspectFindingCard,
  EventInspectScanArea,
} from '@/features/events/components/event-workflow/EventInspectFindingCard';
import { EventWorkflowFooter } from '@/features/events/components/event-workflow/EventWorkflowFooter';
import { EventWorkflowHero } from '@/features/events/components/event-workflow/EventWorkflowHero';
import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import { SignalSummaryCard } from '@/features/events/components/event-workflow/SignalSummaryCard';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { buildEventResultDistrictContextLine } from '@/features/events/utils/eventResultPresentation';
import {
  buildEventInspectPhasePresentation,
  type EventInspectInteractionState,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  getInspectNeighborhoodHero,
} from '@/features/events/utils/eventWorkflowAssets';
import {
  buildInspectHeroChips,
  buildSignalSummary,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

type EventInspectPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onOpenPlanning: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

export function EventInspectPhase({
  event,
  bottomPadding,
  onOpenPlanning,
  phaseHint = null,
  gameDay = 1,
  isDay1LearningEvent = false,
}: EventInspectPhaseProps) {
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const hasRevealedRef = useRef(false);
  const [interactionState, setInteractionState] = useState<EventInspectInteractionState>(() =>
    hasRevealedRef.current ? 'revealed' : 'idle',
  );

  const signalSummary = useMemo(() => buildSignalSummary(event), [event]);
  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const heroImage = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );
  const districtContextLine = useMemo(
    () => buildEventResultDistrictContextLine(event),
    [event],
  );

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
      buildEventInspectPhasePresentation({
        event,
        interactionState,
        reducedMotion,
        day: gameDay,
        isDay1LearningEvent,
        authorityGameplayContext,
      }),
    [
      authorityGameplayContext,
      event,
      gameDay,
      interactionState,
      isDay1LearningEvent,
      reducedMotion,
    ],
  );

  const scanConfig = useMemo(
    () => operationInspectScanConfig(reducedMotion),
    [reducedMotion],
  );

  useEffect(() => {
    if (interactionState !== 'analyzing') return;

    const durationMs = reducedMotion ? 0 : scanConfig.durationMs;
    const timer = setTimeout(() => {
      hasRevealedRef.current = true;
      setInteractionState('revealed');
    }, durationMs);

    return () => clearTimeout(timer);
  }, [interactionState, reducedMotion, scanConfig.durationMs]);

  const handleCtaPress = useCallback(() => {
    if (presentation.primaryCta.actionKey === 'start_inspection') {
      if (reducedMotion) {
        hasRevealedRef.current = true;
        setInteractionState('revealed');
        return;
      }
      setInteractionState('analyzing');
      return;
    }

    if (presentation.primaryCta.actionKey === 'go_to_plan') {
      onOpenPlanning();
    }
  }, [onOpenPlanning, presentation.primaryCta.actionKey, reducedMotion]);

  const showPreScanContext = interactionState === 'idle';

  return (
    <View
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}>
        <EventWorkflowHero
          title={event.title}
          location={event.district}
          priorityLabel={heroChips.priority}
          remainingLabel={heroChips.remaining}
          heroImage={heroImage}
        />

        {districtContextLine ? (
          <Text style={styles.districtContext} numberOfLines={1}>
            {districtContextLine}
          </Text>
        ) : null}

        <View style={styles.phaseHeader}>
          <Text style={styles.phaseTitle}>{presentation.title}</Text>
          {presentation.domainLabel ? (
            <View style={styles.domainPill}>
              <Text style={styles.domainPillText} numberOfLines={1}>
                {presentation.domainLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.summary} numberOfLines={3}>
          {presentation.summary}
        </Text>

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <View style={styles.stepperGap}>
          <EventWorkflowStepper activeStep="inspect" />
        </View>

        {showPreScanContext ? <SignalSummaryCard items={signalSummary} /> : null}

        {!presentation.showFindings ? (
          <EventInspectScanArea
            isAnalyzing={interactionState === 'analyzing'}
            scanDurationMs={presentation.scanHint.estimatedDurationMs}
            reducedMotion={reducedMotion}
            eventTitle={event.title}
          />
        ) : null}

        {presentation.showFindings ? (
          <View style={styles.findingsList}>
            {presentation.findings.map((finding, index) => (
              <EventInspectFindingCard
                key={finding.id}
                finding={finding}
                index={index}
                reducedMotion={reducedMotion}
              />
            ))}
          </View>
        ) : null}

        {presentation.showAdvisorComment && presentation.advisorComment ? (
          <EventInspectAdvisorCommentCard
            title={presentation.advisorComment.title}
            text={presentation.advisorComment.text}
            tone={presentation.advisorComment.tone}
            reducedMotion={reducedMotion}
          />
        ) : null}
      </ScrollView>

      <EventWorkflowFooter
        hint={presentation.footerHint}
        ctaLabel={presentation.primaryCta.label}
        onPress={handleCtaPress}
        disabled={!presentation.primaryCta.enabled}
        loading={interactionState === 'analyzing'}
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
  },
  phaseHeader: {
    marginHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: -4,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  domainPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 97, 0.1)',
    maxWidth: '45%',
  },
  domainPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  summary: {
    marginHorizontal: eventDetail.screenPadding,
    marginTop: -8,
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  stepperGap: {
    marginTop: -4,
  },
  findingsList: {
    gap: 10,
  },
  districtContext: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 15,
    flexShrink: 1,
    minWidth: 0,
    marginHorizontal: eventDetail.screenPadding,
    marginTop: -8,
  },
});
