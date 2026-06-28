import { StyleSheet, View } from 'react-native';

import type { EventCard } from '@/core/models/EventCard';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';

import { PlanlaHeader } from './PlanlaHeader';
import { PlanlaProgressStepper } from './PlanlaProgressStepper';
import { PlanlaStatusChips } from './PlanlaStatusChips';
import { RecommendedPlanPreviewCard } from './RecommendedPlanPreviewCard';
import { SignalSummaryCard } from './SignalSummaryCard';
import { StrategyBriefCard } from './StrategyBriefCard';

type PlanlaBriefingSectionProps = {
  event: EventCard;
  briefing: EventPlanBriefingPresentation;
  compact?: boolean;
  reducedMotion?: boolean;
  onBack?: () => void;
  onRecommendedPlanPress?: () => void;
};

export function PlanlaBriefingSection({
  event,
  briefing,
  compact = false,
  reducedMotion = false,
  onBack,
  onRecommendedPlanPress,
}: PlanlaBriefingSectionProps) {
  return (
    <View style={styles.wrap}>
      <PlanlaHeader
        header={briefing.header}
        compact={compact}
        reducedMotion={reducedMotion}
        onBack={onBack}
      />
      <PlanlaStatusChips status={briefing.status} reducedMotion={reducedMotion} />
      <PlanlaProgressStepper
        steps={briefing.stepper}
        accessibilityLabel={briefing.stepperAccessibilityLabel}
        reducedMotion={reducedMotion}
      />
      <StrategyBriefCard
        event={event}
        brief={briefing.brief}
        suitability={briefing.suitability}
        reducedMotion={reducedMotion}
      />
      <SignalSummaryCard
        eyebrow={briefing.signalsEyebrow}
        signals={briefing.signals}
        reducedMotion={reducedMotion}
      />
      <RecommendedPlanPreviewCard
        recommendedPlan={briefing.recommendedPlan}
        reducedMotion={reducedMotion}
        onPress={onRecommendedPlanPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingTop: 4,
  },
});
