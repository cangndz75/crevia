import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildDistrictOperationUnlockBindingSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import type { DistrictUnlockBindingItem } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionDetailModal } from '@/features/progression/components/districtExpansion/DistrictExpansionDetailModal';
import { DistrictExpansionItemCard } from '@/features/progression/components/districtExpansion/DistrictExpansionItemCard';
import { ProgressionSectionHeader } from '@/features/progression/components/authorities/ProgressionSectionHeader';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionBindingPanelProps = {
  currentDay: number;
  pilotDay: number;
  authorityState: unknown;
  mainOperationSeason?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
};

export function DistrictExpansionBindingPanel({
  currentDay,
  pilotDay,
  authorityState,
  mainOperationSeason,
  operationSignals,
  socialPulse,
}: DistrictExpansionBindingPanelProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictUnlockBindingItem | null>(null);

  const summary = useMemo(
    () =>
      buildDistrictOperationUnlockBindingSummary({
        currentDay,
        pilotDay,
        authorityState,
        mainOperationSeason,
        operationSignals,
        socialPulse,
      }),
    [
      authorityState,
      currentDay,
      mainOperationSeason,
      operationSignals,
      pilotDay,
      socialPulse,
    ],
  );

  const countLabel = `Aktif: ${summary.activeDistrictCount} / ${summary.totalDistrictCount}`;

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <ProgressionSectionHeader
        title="Mahalle Açılımları"
        countLabel={countLabel}
        icon="map-outline"
      />

      <View style={styles.grid}>
        {summary.allDistrictItems.map((item) => (
          <DistrictExpansionItemCard
            key={item.id}
            item={item}
            grid
            onPress={setSelectedDistrict}
          />
        ))}
      </View>

      <DistrictExpansionDetailModal
        item={selectedDistrict}
        visible={selectedDistrict != null}
        onClose={() => setSelectedDistrict(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    columnGap: spacing.sm,
  },
});
