import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HubBadgeShowcaseSummary } from '@/features/hub/utils/hubBadgeShowcaseModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubBadgeShowcaseChipProps = {
  summary: HubBadgeShowcaseSummary;
};

export function HubBadgeShowcaseChip({ summary }: HubBadgeShowcaseChipProps) {
  const router = useRouter();

  if (!summary.visible) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadows.soft, pressed && styles.pressed]}
      onPress={() => router.push('/progression' as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${summary.countLabel}. ${summary.ctaLabel}`}>
      <View style={styles.iconWrap}>
        <Ionicons name="medal-outline" size={14} color={colors.hubGoldDark} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.count} numberOfLines={1}>
          {summary.countLabel}
        </Text>
        {summary.nearUnlockTitle ? (
          <Text style={styles.near} numberOfLines={1}>
            {summary.nearUnlockTitle}
          </Text>
        ) : (
          <Text style={styles.near} numberOfLines={1}>
            {summary.headline}
          </Text>
        )}
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{summary.ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </View>
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
    minHeight: 52,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  near: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
});
