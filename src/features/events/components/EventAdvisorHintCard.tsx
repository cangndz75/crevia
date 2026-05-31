import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADVISOR_COPY } from '@/core/advisors/advisorConstants';
import {
  buildAdvisorEventHintModel,
  buildAdvisorPresentationContextFromStore,
} from '@/core/advisors/advisorPresentation';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { EventCard } from '@/core/models/EventCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import {
  selectAdvisorState,
  useGameStore,
} from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';

type EventAdvisorHintCardProps = {
  event: EventCard;
};

export function EventAdvisorHintCard({ event }: EventAdvisorHintCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const advisorState = useGameStore(selectAdvisorState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);
  const askEventHint = useGameStore((s) => s.askAdvisorForEventHint);
  const [detailed, setDetailed] = useState(false);

  const ctx = useMemo(
    () =>
      buildAdvisorPresentationContextFromStore({
        gameState,
        advisorState,
        personnelState,
        vehicleState,
        containerState,
        operationSignals,
        isDay1Tutorial: isDay1,
      }),
    [
      gameState,
      advisorState,
      personnelState,
      vehicleState,
      containerState,
      operationSignals,
      isDay1,
    ],
  );

  const model = useMemo(
    () =>
      buildAdvisorEventHintModel({
        ctx,
        advisorState,
        event,
        detailed,
      }),
    [ctx, advisorState, event, detailed],
  );

  const canAsk = advisorState.dailyUsesRemaining > 0;

  const handleAsk = () => {
    playLightImpactHaptic();
    if (!canAsk) return;
    askEventHint(event.id);
    setDetailed(true);
  };

  const body =
    detailed && model.secondaryInsights[0]
      ? `${model.primaryInsight?.body ?? ''} ${model.secondaryInsights[0].body}`
      : model.primaryInsight?.body ?? '';

  return (
    <LinearGradient
      colors={[eventDetail.mintSoft, '#FFFFFF']}
      style={styles.card}
      accessibilityRole="summary">
      <View style={styles.headerRow}>
        <View style={styles.dot} />
        <Text style={styles.title} numberOfLines={1}>
          {ADVISOR_COPY.eventHintTitle}
        </Text>
        <View style={styles.clarityChip}>
          <Text style={styles.clarityText} numberOfLines={1}>
            {model.clarityLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.body} numberOfLines={detailed ? 4 : 2} ellipsizeMode="tail">
        {canAsk || !detailed
          ? body
          : ADVISOR_COPY.eventUsesExhausted}
      </Text>
      {model.limitedSignalFooter ? (
        <Text style={styles.footerHint} numberOfLines={1}>
          {model.limitedSignalFooter}
        </Text>
      ) : null}
      <Pressable
        onPress={handleAsk}
        disabled={!canAsk}
        accessibilityRole="button"
        accessibilityLabel={canAsk ? model.ctaLabel : ADVISOR_COPY.eventUsesExhausted}
        accessibilityState={{ disabled: !canAsk }}
        style={({ pressed }) => [
          styles.cta,
          !canAsk && styles.ctaMuted,
          getPressFeedbackStyle({ pressed: pressed && canAsk, disabled: !canAsk }),
        ]}>
        <Text
          style={[styles.ctaText, !canAsk && styles.ctaTextMuted]}
          numberOfLines={2}>
          {canAsk ? model.ctaLabel : ADVISOR_COPY.eventUsesExhausted}
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.14)',
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: eventDetail.teal,
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
    letterSpacing: 0.3,
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
  },
  clarityChip: {
    backgroundColor: 'rgba(198, 235, 220, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: '42%',
    flexShrink: 1,
  },
  clarityText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2A6B64',
    flexShrink: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  footerHint: {
    fontSize: 10,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: eventDetail.tealDark,
    maxWidth: '100%',
    minWidth: 0,
  },
  ctaMuted: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    flexShrink: 1,
  },
  ctaTextMuted: {
    color: '#5E726E',
    fontWeight: '500',
  },
});
