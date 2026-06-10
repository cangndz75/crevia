import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileAuthorityPermissionPreviewCardProps = {
  summary: AuthorityPermissionPreviewCompactSummary;
};

export function ProfileAuthorityPermissionPreviewCard({
  summary,
}: ProfileAuthorityPermissionPreviewCardProps) {
  const router = useRouter();

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="key-outline" size={16} color={colors.secondary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>Yetki İzinleri</Text>
          <Text style={styles.subline} numberOfLines={2}>
            {summary.headline}
          </Text>
        </View>
      </View>

      <Text style={styles.count}>{summary.activeCountLabel}</Text>

      {summary.nextPermissionTitle ? (
        <Text style={styles.next} numberOfLines={1}>
          Sıradaki: {summary.nextPermissionTitle}
        </Text>
      ) : null}

      <Pressable
        style={styles.cta}
        onPress={() => router.push('/progression' as Href)}
        accessibilityRole="button"
        accessibilityLabel={summary.ctaLabel}>
        <Text style={styles.ctaText}>{summary.ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
      </Pressable>
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
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(123,91,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subline: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  count: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  next: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    minHeight: 36,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
});
