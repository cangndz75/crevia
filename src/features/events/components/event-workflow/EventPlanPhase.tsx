import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventWorkflowStepper } from '@/features/events/components/event-workflow/EventWorkflowStepper';
import {
  EventPlanAdvisorCommentCard,
  EventPlanImpactPreviewCard,
  EventPlanStrategyCardView,
  PlanInspectSummaryStrip,
} from '@/features/events/components/event-workflow/plan/EventPlanStrategyBoard';
import { PlanEventSummaryCard } from '@/features/events/components/event-workflow/plan/PlanEventSummaryCard';
import { PlanWorkflowFooter } from '@/features/events/components/event-workflow/plan/PlanWorkflowFooter';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import type { EventCard } from '@/core/models/EventCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventPlanPhasePresentation,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { getInspectNeighborhoodHero } from '@/features/events/utils/eventWorkflowAssets';
import {
  buildInspectHeroChips,
  resolveInspectDistrictId,
} from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { useCreviaReducedMotion } from '@/shared/motion';

type EventPlanPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  selectedStrategyId: EventPlanStrategyId;
  onSelectStrategy: (strategyId: EventPlanStrategyId) => void;
  onConfirmPlan: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

export function EventPlanPhase({
  event,
  bottomPadding,
  selectedStrategyId,
  onSelectStrategy,
  onConfirmPlan,
  phaseHint = null,
  gameDay = 1,
  isDay1LearningEvent = false,
}: EventPlanPhaseProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);

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
      buildEventPlanPhasePresentation({
        event,
        selectedStrategyId,
        day: gameDay,
        isDay1LearningEvent,
        authorityGameplayContext,
      }),
    [
      authorityGameplayContext,
      event,
      gameDay,
      isDay1LearningEvent,
      selectedStrategyId,
    ],
  );

  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const thumbnail = useMemo(
    () => getInspectNeighborhoodHero(resolveInspectDistrictId(event)),
    [event],
  );

  return (
    <View
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: bottomPadding },
        ]}>
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {presentation.title}
          </Text>
          {presentation.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {presentation.subtitle}
            </Text>
          ) : null}
        </View>

        <EventWorkflowStepper activeStep="plan" />

        <PlanEventSummaryCard
          title={event.title}
          location={event.district}
          priorityLabel={heroChips.priority}
          remainingLabel={heroChips.remaining}
          thumbnail={thumbnail}
        />

        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}

        <PlanInspectSummaryStrip
          items={presentation.inspectSummary}
          reducedMotion={reducedMotion}
        />

        <View style={styles.strategyList}>
          {presentation.strategies.map((strategy) => (
            <EventPlanStrategyCardView
              key={strategy.id}
              strategy={strategy}
              onSelect={() => onSelectStrategy(strategy.id)}
              reducedMotion={reducedMotion}
            />
          ))}
        </View>

        <EventPlanImpactPreviewCard
          preview={presentation.impactPreview}
          reducedMotion={reducedMotion}
        />

        <EventPlanAdvisorCommentCard
          comment={presentation.advisorComment}
          reducedMotion={reducedMotion}
        />
      </ScrollView>

      <PlanWorkflowFooter
        onPress={onConfirmPlan}
        disabled={!presentation.primaryCta.enabled}
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
    gap: 12,
  },
  headerBlock: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  strategyList: {
    gap: 10,
  },
});
