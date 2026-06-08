import { StyleSheet, View } from 'react-native';

import { PilotRegionCard } from '@/features/onboarding/components/onboarding/PilotRegionCard';
import { ONBOARDING_DISTRICT_OPTIONS } from '@/features/onboarding/utils/onboardingContinuationConstants';
import type { OnboardingPilotDistrictId } from '@/features/onboarding/utils/onboardingContinuationTypes';

type RegionOnboardingPageProps = {
  selectedId: OnboardingPilotDistrictId | null;
  onSelect: (id: OnboardingPilotDistrictId) => void;
  compact?: boolean;
};

export function RegionOnboardingPage({
  selectedId,
  onSelect,
  compact = false,
}: RegionOnboardingPageProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {ONBOARDING_DISTRICT_OPTIONS.map((region, index) => (
        <PilotRegionCard
          key={region.id}
          region={region}
          selected={selectedId === region.id}
          onPress={() => onSelect(region.id)}
          index={index}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingBottom: 10,
  },
  wrapCompact: {
    gap: 8,
    paddingBottom: 4,
  },
});
