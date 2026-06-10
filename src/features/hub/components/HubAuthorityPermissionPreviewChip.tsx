import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubAuthorityPermissionPreviewChipProps = {
  summary: AuthorityPermissionPreviewCompactSummary;
};

export function HubAuthorityPermissionPreviewChip({
  summary,
}: HubAuthorityPermissionPreviewChipProps) {
  const router = useRouter();

  if (!summary.visible || !summary.nextPermissionLine) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadows.soft, pressed && styles.pressed]}
      onPress={() => router.push('/progression' as Href)}
      accessibilityRole="button"
      accessibilityLabel={summary.nextPermissionLine}>
      <View style={styles.iconWrap}>
        <Ionicons name="key-outline" size={14} color={colors.secondary} />
      </View>
      <Text style={styles.line} numberOfLines={1}>
        {summary.nextPermissionLine}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
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
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 0,
  },
});
