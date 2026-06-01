import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { EventCard } from '@/core/models/EventCard';
import { buildAssignmentAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackCreviaEvent, trackOncePerRuntime } from '@/core/analytics/analyticsRuntime';
import { buildEventDomainFieldFocus } from '@/core/events/eventDomainPresentation';
import {
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import {
  buildMicroDecisionCardModel,
  buildMicroDecisionPresentationInput,
} from '@/core/microDecisions';
import { shouldHideAdvancedSystemForFirstTenMinutes } from '@/core/onboarding/firstTenMinutesPresentation';
import { getActiveMicroDecisions } from '@/core/microDecisions/microDecisionState';
import { LiveOperationDecisionCard } from '@/features/hub/components/LiveOperationDecisionCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { useGameStore } from '@/store/useGameStore';

type Props = {
  event: EventCard;
};

export function EventFieldMicroDecisionCard({ event }: Props) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const resolveMicroDecision = useGameStore((s) => s.resolveMicroDecision);

  const cardModel = useMemo(() => {
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
    if (!related) return undefined;
    return buildMicroDecisionCardModel(input, related, { compact: true });
  }, [
    event,
    event.id,
    gameState,
    monetization,
    operationSignals,
    crisisState,
    dailyOperationsPlan,
    assignments,
    mainOperationSeason,
    advisorState,
    microDecisionState,
  ]);

  const fieldDomainHint = useMemo(() => {
    const related = getActiveMicroDecisions(microDecisionState).find(
      (d) => d.relatedEventId === event.id,
    );
    return buildEventDomainFieldFocus(event, related ?? null, gameState.city.day);
  }, [event, gameState.city.day, microDecisionState]);

  const fatiguePrimary = useMemo(() => {
    if (shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions')) return null;
    const domain = inferResourceDomainFromEventFocus(fieldDomainHint?.model?.focus);
    return buildResourceFatigueVisualSummary({
      day: gameState.city.day,
      surface: 'field',
      domain,
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        overall: { status: operationSignals.overall.status },
      },
      activeEvent: event,
      eventDomainFocus: fieldDomainHint?.model,
    }).primaryState;
  }, [event, fieldDomainHint?.model, gameState, operationalResources, operationSignals]);

  useEffect(() => {
    if (!cardModel) return;
    trackOncePerRuntime(
      `micro_decision_seen:${cardModel.id}`,
      'micro_decision_seen',
      buildAssignmentAnalyticsPayload(event, undefined, gameState, monetization),
    );
  }, [cardModel, event, gameState, monetization]);

  if (
    shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions') ||
    !cardModel
  ) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.badge} numberOfLines={1}>
        Saha bildirimi
      </Text>
      {fieldDomainHint.hintLine ? (
        <Text style={styles.domainHint} numberOfLines={2}>
          {fieldDomainHint.hintLine}
        </Text>
      ) : null}
      <ResourceFatigueStateChip model={fatiguePrimary} compact />
      <LiveOperationDecisionCard
        model={cardModel}
        onSelectOption={(optionId) => {
          resolveMicroDecision(cardModel.id, optionId);
          trackCreviaEvent(
            'micro_decision_resolved',
            buildAssignmentAnalyticsPayload(event, undefined, gameState, monetization),
            { optionId },
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: eventDetail.sectionGap / 2,
    minWidth: 0,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F8F86',
    letterSpacing: 0.2,
  },
  domainHint: {
    fontSize: 12,
    color: '#4A5F5B',
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 17,
  },
});
