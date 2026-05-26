import { StyleSheet, View } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { REGION_CARDS } from '@/features/onboarding/data/onboardingData';
import { PilotRegionCard } from '@/features/onboarding/components/onboarding/PilotRegionCard';
import { PillTag } from '@/features/onboarding/components/onboarding/PillTag';
import { spacing } from '@/ui/theme/spacing';

type RegionOnboardingPageProps = {
  selectedId: PilotDistrictId;
  onSelect: (id: PilotDistrictId) => void;
};

export function RegionOnboardingPage({ selectedId, onSelect }: RegionOnboardingPageProps) {
  return (
    <View style={styles.wrap}>
      <PillTag label="3 farklı başlangıç" icon="star-outline" />
      <View style={styles.list}>
        {REGION_CARDS.map((region, index) => (
          <PilotRegionCard
            key={region.id}
            region={region}
            selected={selectedId === region.id}
            onPress={() => onSelect(region.id)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  list: {
    width: '100%',
    gap: spacing.md,
  },
});
