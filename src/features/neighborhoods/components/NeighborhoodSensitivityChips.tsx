import { StyleSheet, Text, View } from 'react-native';

import {
  getNeighborhoodToneColors,
  getTopNeighborhoodSensitivityChips,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityPresentation';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  neighborhoodId: string | null | undefined;
  labels?: string[];
  limit?: number;
};

export function NeighborhoodSensitivityChips({
  neighborhoodId,
  labels,
  limit = 2,
}: Props) {
  const chips =
    labels ?? getTopNeighborhoodSensitivityChips(neighborhoodId, limit);
  const tone = getNeighborhoodToneColors(neighborhoodId);

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {chips.map((label) => (
        <View
          key={label}
          style={[
            styles.chip,
            { backgroundColor: tone.bg, borderColor: tone.border },
          ]}>
          <Text style={[styles.chipText, { color: tone.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
