import { StyleSheet, View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { PilotRegionCard } from '@/features/onboarding/components/onboarding/PilotRegionCard';
import { REGION_CARDS } from '@/features/onboarding/data/onboardingData';

type RegionOnboardingPageProps = {
  selectedId: PilotDistrictId;
  onSelect: (id: PilotDistrictId) => void;
  compact?: boolean;
};

export function RegionOnboardingPage({
  selectedId,
  onSelect,
  compact = false,
}: RegionOnboardingPageProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {REGION_CARDS.map((region, index) => (
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
