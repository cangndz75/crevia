import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { DistrictOperationUnlockBindingCompactSummary } from '@/core/progression/districtOperationUnlockBindingTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubDistrictExpansionChipProps = {
  summary: DistrictOperationUnlockBindingCompactSummary;
};

export function HubDistrictExpansionChip({ summary }: HubDistrictExpansionChipProps) {
  const router = useRouter();

  if (!summary.visible || !summary.nextExpansionLine) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadows.soft, pressed && styles.pressed]}
      onPress={() => router.push('/progression' as Href)}
      accessibilityRole="button"
      accessibilityLabel={summary.nextExpansionLine}>
      <Ionicons name="map-outline" size={14} color={colors.primary} />
      <Text style={styles.line} numberOfLines={1}>
        {summary.nextExpansionLine}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.92,
  },
  line: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 0,
  },
});
