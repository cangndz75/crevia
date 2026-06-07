import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CompactPilotRoadmap } from '@/features/onboarding/components/onboarding/CompactPilotRoadmap';
import { PilotLaunchPreviewCard } from '@/features/onboarding/components/onboarding/PilotLaunchPreviewCard';
import { PilotSetupSummary } from '@/features/onboarding/components/onboarding/PilotSetupSummary';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';
import { isOnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';
import { buildOnboardingRoadmapPreview } from '@/features/onboarding/utils/onboardingRoadmapPresentation';

type RoadmapOnboardingPageProps = {
  compact?: boolean;
  districtId: PilotDistrictId;
  decisionId: string;
};

export function RoadmapOnboardingPage({
  compact = false,
  districtId,
  decisionId,
}: RoadmapOnboardingPageProps) {
  const starterDecision: OnboardingStarterDecisionId = isOnboardingStarterDecisionId(decisionId)
    ? decisionId
    : 'fast';

  const preview = useMemo(
    () => buildOnboardingRoadmapPreview(districtId, starterDecision),
    [districtId, starterDecision],
  );

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <PilotSetupSummary preview={preview} compact={compact} />
      <CompactPilotRoadmap compact={compact} />
      <PilotLaunchPreviewCard preview={preview} compact={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
    paddingBottom: 8,
  },
  wrapCompact: {
    gap: 8,
    paddingBottom: 4,
  },
});
