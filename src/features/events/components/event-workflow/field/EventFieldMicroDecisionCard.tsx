import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventCard } from '@/core/models/EventCard';
import { buildAssignmentAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackCreviaEvent, trackOncePerRuntime } from '@/core/analytics/analyticsRuntime';
import { buildEventDomainFieldFocus } from '@/core/events/eventDomainPresentation';
import {
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import { shouldHideAdvancedSystemForFirstTenMinutes } from '@/core/onboarding/firstTenMinutesPresentation';
import { getActiveMicroDecisions } from '@/core/microDecisions/microDecisionState';
import type { MicroDecisionCardModel } from '@/core/microDecisions/microDecisionTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventFieldMicroDecisionPresentation } from '@/features/events/utils/eventFieldPhasePresentation';
import { useGameStore } from '@/store/useGameStore';
import { CreviaMotionView } from '@/shared/motion';
import { operationMotionFieldMicroRevealMs } from '@/core/motion/operationMotionTokens';
import { useCreviaReducedMotion } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

const OPTION_TONE_COLOR: Record<
  EventFieldMicroDecisionPresentation['options'][number]['tone'],
  string
> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
};

type Props = {
  event: EventCard;
  microDecision?: EventFieldMicroDecisionPresentation | null;
  cardModel?: MicroDecisionCardModel | null;
};

export function EventFieldMicroDecisionCard({
  event,
  microDecision = null,
  cardModel = null,
}: Props) {
  const reducedMotion = useCreviaReducedMotion();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const resolveMicroDecision = useGameStore((s) => s.resolveMicroDecision);

  const fieldDomainHint = useMemo(() => {
    const related = getActiveMicroDecisions(microDecisionState).find(
      (d) => d.relatedEventId === event.id,
    );
    return buildEventDomainFieldFocus(event, related ?? null, gameState.city.day);
  }, [event, gameState.city.day, microDecisionState]);

  const fatiguePrimary = useMemo(() => {
    if (shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions')) {
      return null;
    }
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
    if (!microDecision) return;
    trackOncePerRuntime(
      `micro_decision_seen:${microDecision.id}`,
      'micro_decision_seen',
      buildAssignmentAnalyticsPayload(event, undefined, gameState, monetization),
    );
  }, [event, gameState, microDecision, monetization]);

  if (
    shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'live_micro_decisions') ||
    !microDecision
  ) {
    return null;
  }

  const revealMs = operationMotionFieldMicroRevealMs(reducedMotion);

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
      reducedMotion={reducedMotion || revealMs === 0}
      style={styles.wrap}>
      <Text style={styles.badge} numberOfLines={1}>
        {microDecision.sourceLabel || 'Saha bildirimi'}
      </Text>
      {fieldDomainHint.hintLine ? (
        <Text style={styles.domainHint} numberOfLines={2}>
          {fieldDomainHint.hintLine}
        </Text>
      ) : null}
      <ResourceFatigueStateChip model={fatiguePrimary} compact />

      <View style={[styles.card, shadows.soft]}>
        <Text style={styles.title} numberOfLines={2}>
          {microDecision.title}
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          {microDecision.body}
        </Text>

        <View style={styles.options}>
          {microDecision.options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => {
                resolveMicroDecision(microDecision.id, option.id);
                trackCreviaEvent(
                  'micro_decision_resolved',
                  buildAssignmentAnalyticsPayload(event, undefined, gameState, monetization),
                  { optionId: option.id },
                );
              }}
              style={({ pressed }) => [
                styles.option,
                { borderColor: `${OPTION_TONE_COLOR[option.tone]}44` },
                pressed && styles.optionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}>
              <Text
                style={[styles.optionLabel, { color: OPTION_TONE_COLOR[option.tone] }]}
                numberOfLines={1}>
                {option.label}
              </Text>
              {option.helperText ? (
                <Text style={styles.optionHelper} numberOfLines={2}>
                  {option.helperText}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      {cardModel?.advisorLine ? (
        <Text style={styles.advisorLine} numberOfLines={2}>
          {cardModel.advisorLine}
        </Text>
      ) : null}
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: eventDetail.sectionGap / 2,
    minWidth: 0,
    marginHorizontal: eventDetail.screenPadding,
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
  card: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  options: {
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionHelper: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 15,
  },
  advisorLine: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 16,
  },
});
