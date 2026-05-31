import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { EventCard } from '@/core/models/EventCard';
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
      <LiveOperationDecisionCard
        model={cardModel}
        onSelectOption={(optionId) => resolveMicroDecision(cardModel.id, optionId)}
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
});
