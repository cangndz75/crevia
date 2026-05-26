import { useState } from 'react';

import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { OnboardingEventsStep } from '@/features/onboarding/components/steps/OnboardingEventsStep';
import { OnboardingRegionStep } from '@/features/onboarding/components/steps/OnboardingRegionStep';
import { OnboardingRoadmapStep } from '@/features/onboarding/components/steps/OnboardingRoadmapStep';
import { OnboardingWelcomeStep } from '@/features/onboarding/components/steps/OnboardingWelcomeStep';
import { ONBOARDING_STEPS } from '@/features/onboarding/content/onboardingContent';

type OnboardingScreenProps = {
  onComplete: (districtId: PilotDistrictId) => void | Promise<void>;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] =
    useState<PilotDistrictId>(DEFAULT_PILOT_DISTRICT_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    null,
  );

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const total = ONBOARDING_STEPS.length;

  const finishOnboarding = (districtId: PilotDistrictId) => {
    void onComplete(districtId);
  };

  const handlePrimary = () => {
    if (isLast) {
      finishOnboarding(selectedRegionId);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const primaryLabel = isLast
    ? 'Oyuna Başla'
    : stepIndex === 0
      ? 'Devam'
      : 'Devam';

  const primaryDisabled =
    step.id === 'events' && selectedDecisionId == null;

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return <OnboardingWelcomeStep />;
      case 'region':
        return (
          <OnboardingRegionStep
            selectedId={selectedRegionId}
            onSelect={setSelectedRegionId}
          />
        );
      case 'events':
        return (
          <OnboardingEventsStep
            selectedDecisionId={selectedDecisionId}
            onSelectDecision={setSelectedDecisionId}
          />
        );
      case 'roadmap':
        return <OnboardingRoadmapStep />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      stepIndex={stepIndex}
      totalSteps={total}
      title={step.title}
      body={step.body}
      primaryLabel={primaryLabel}
      onPrimary={handlePrimary}
      primaryDisabled={primaryDisabled}
      onBack={stepIndex > 0 ? () => setStepIndex((i) => i - 1) : undefined}
      onSkip={
        stepIndex === 0
          ? () => finishOnboarding(DEFAULT_PILOT_DISTRICT_ID)
          : undefined
      }
      skipLabel="Geç">
      {renderStepContent()}
    </OnboardingLayout>
  );
}
