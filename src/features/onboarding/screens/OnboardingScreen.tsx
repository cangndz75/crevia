import { useState } from 'react';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { OnboardingEventsStep } from '@/features/onboarding/components/steps/OnboardingEventsStep';
import { OnboardingRegionStep } from '@/features/onboarding/components/steps/OnboardingRegionStep';
import { OnboardingRoadmapStep } from '@/features/onboarding/components/steps/OnboardingRoadmapStep';
import { OnboardingWelcomeStep } from '@/features/onboarding/components/steps/OnboardingWelcomeStep';
import {
  ONBOARDING_STEPS,
  REGION_OPTIONS,
} from '@/features/onboarding/content/onboardingContent';

type OnboardingScreenProps = {
  onComplete: () => void | Promise<void>;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState(
    REGION_OPTIONS.find((r) => r.recommended)?.id ?? REGION_OPTIONS[0]!.id,
  );
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    null,
  );

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const total = ONBOARDING_STEPS.length;

  const handlePrimary = () => {
    if (isLast) {
      void onComplete();
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
      onSkip={stepIndex === 0 ? () => void onComplete() : undefined}
      skipLabel="Geç">
      {renderStepContent()}
    </OnboardingLayout>
  );
}
