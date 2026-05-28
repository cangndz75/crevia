import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  getNeighborhoodArchetypeLabel,
  getNeighborhoodToneColors,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityPresentation';
import {
  getNeighborhoodIdentity,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { NeighborhoodRepresentativeQuote } from './NeighborhoodRepresentativeQuote';
import { NeighborhoodSensitivityChips } from './NeighborhoodSensitivityChips';

type Props = {
  neighborhoodId: string | null | undefined;
  compact?: boolean;
};

export function NeighborhoodIdentityMiniCard({
  neighborhoodId,
  compact = false,
}: Props) {
  const normalized = normalizeNeighborhoodId(neighborhoodId);
  if (!normalized) {
    return null;
  }

  const identity = getNeighborhoodIdentity(normalized);
  const tone = getNeighborhoodToneColors(normalized);
  const strength = identity.strengths[0];
  const vulnerability = identity.vulnerabilities[0];

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={identity.iconName as keyof typeof Ionicons.glyphMap}
            size={16}
            color={tone.text}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {identity.shortName} · {identity.tagline}
          </Text>
          <View style={[styles.archetypeChip, { borderColor: tone.border }]}>
            <Text style={[styles.archetypeText, { color: tone.text }]}>
              {getNeighborhoodArchetypeLabel(normalized)}
            </Text>
          </View>
        </View>
      </View>

      <NeighborhoodRepresentativeQuote
        neighborhoodId={normalized}
        compact={compact}
      />

      <NeighborhoodSensitivityChips
        neighborhoodId={normalized}
        labels={
          compact
            ? [strength, vulnerability].filter(Boolean)
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  archetypeChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  archetypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
