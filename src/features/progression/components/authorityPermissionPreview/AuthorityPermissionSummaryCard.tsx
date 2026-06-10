import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewSummary } from '@/core/authority/authorityPermissionPreviewTypes';
import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import { AUTHORITY_PERMISSION_PREVIEW_THEME } from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionSummaryCardProps = {
  summary: AuthorityPermissionPreviewSummary;
};

export function AuthorityPermissionSummaryCard({
  summary,
}: AuthorityPermissionSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>Yetki İzinleri</Text>
          <Text style={styles.rank} numberOfLines={1}>
            {summary.currentRankTitle}
          </Text>
          <Text style={styles.prestige} numberOfLines={1}>
            {summary.prestigeLabel}
          </Text>
        </View>
        <Text style={styles.count}>{summary.activeCountLabel}</Text>
      </View>

      {summary.nextRankTitle ? (
        <Text style={styles.nextRank} numberOfLines={1}>
          Sıradaki: {summary.nextRankTitle}
        </Text>
      ) : null}

      <Text style={styles.headline} numberOfLines={2}>
        {summary.headline}
      </Text>
      <Text style={styles.subline} numberOfLines={3}>
        {summary.subline}
      </Text>

      <View style={styles.progressRow}>
        <AnimatedProgressBar
          progress={summary.progressRatio}
          color={colors.secondary}
          trackColor="rgba(123, 91, 184, 0.12)"
          height={8}
        />
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{summary.progressLabel}</Text>
          <Text style={styles.progressPercent}>{summary.progressPercentLabel}</Text>
        </View>
      </View>

      {summary.promotionHint ? (
        <View style={styles.hintChip}>
          <Ionicons name="sparkles-outline" size={12} color={colors.hubGoldDark} />
          <Text style={styles.hintText} numberOfLines={2}>
            {summary.promotionHint}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AUTHORITY_PERMISSION_PREVIEW_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: AUTHORITY_PERMISSION_PREVIEW_THEME.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
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
    fontSize: 17,
    fontWeight: '800',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  prestige: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  count: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  nextRank: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    lineHeight: 20,
  },
  subline: {
    fontSize: 12,
    fontWeight: '500',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    lineHeight: 17,
  },
  progressRow: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.hubGoldDark,
    lineHeight: 15,
  },
});
