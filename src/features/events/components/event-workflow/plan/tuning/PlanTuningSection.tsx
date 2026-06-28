import { StyleSheet, View } from 'react-native';

import type {
  EventPlanTuningPresentation,
  PlanTuningValues,
  TuningControlKey,
  TuningLevel,
} from '@/features/events/utils/eventPlanTuningPresentation';

import { EceForecastCard } from './EceForecastCard';
import { LiveImpactSummary } from './LiveImpactSummary';
import { PlanTuningAccordion } from './PlanTuningAccordion';
import { RefinePlanCTA } from './RefinePlanCTA';

type PlanTuningSectionProps = {
  tuningPresentation: EventPlanTuningPresentation;
  isAccordionOpen: boolean;
  tuningValues: PlanTuningValues;
  reducedMotion?: boolean;
  onToggleAccordion: () => void;
  onResetToStandard: () => void;
  onValueChange: (key: TuningControlKey, value: TuningLevel) => void;
  onRefinePlan: () => void;
};

export function PlanTuningSection({
  tuningPresentation,
  isAccordionOpen,
  tuningValues,
  reducedMotion = false,
  onToggleAccordion,
  onResetToStandard,
  onValueChange,
  onRefinePlan,
}: PlanTuningSectionProps) {
  return (
    <View style={styles.wrap}>
      <PlanTuningAccordion
        accordion={tuningPresentation.accordion}
        isOpen={isAccordionOpen}
        values={tuningValues}
        reducedMotion={reducedMotion}
        onToggle={onToggleAccordion}
        onReset={onResetToStandard}
        onValueChange={onValueChange}
      />
      <LiveImpactSummary
        liveImpact={tuningPresentation.liveImpact}
        reducedMotion={reducedMotion}
      />
      <EceForecastCard
        forecast={tuningPresentation.eceForecast}
        reducedMotion={reducedMotion}
      />
      <RefinePlanCTA
        cta={tuningPresentation.refineCta}
        reducedMotion={reducedMotion}
        onPress={onRefinePlan}
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
