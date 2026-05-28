import { StyleSheet, Text, View } from 'react-native';

import { getNeighborhoodRepresentative } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  neighborhoodId: string | null | undefined;
  compact?: boolean;
};

export function NeighborhoodRepresentativeQuote({
  neighborhoodId,
  compact = false,
}: Props) {
  const rep = getNeighborhoodRepresentative(neighborhoodId);

  return (
    <View style={styles.wrap}>
      <Text style={styles.name} numberOfLines={1}>
        {rep.name}
        <Text style={styles.role}> · {rep.role}</Text>
      </Text>
      <Text
        style={[styles.quote, compact && styles.quoteCompact]}
        numberOfLines={compact ? 2 : 3}>
        {rep.quote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  role: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  quote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  quoteCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
