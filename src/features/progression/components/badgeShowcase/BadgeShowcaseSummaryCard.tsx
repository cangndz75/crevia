import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { BadgeShowcaseSummary } from '@/core/badges/badgeShowcaseTypes';
import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import { BADGE_SHOWCASE_THEME } from '@/features/progression/utils/badgeShowcaseTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type BadgeShowcaseSummaryCardProps = {
  summary: BadgeShowcaseSummary;
};

export function BadgeShowcaseSummaryCard({ summary }: BadgeShowcaseSummaryCardProps) {
  const featuredTitle = summary.featuredBadges[0]?.title;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="medal-outline" size={18} color={colors.hubGoldDark} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>Rozet Vitrini</Text>
          <Text style={styles.prestige} numberOfLines={1}>
            {summary.prestigeLabel}
          </Text>
        </View>
        <Text style={styles.count} accessibilityLabel={`${summary.countLabel} rozet kazanıldı`}>
          {summary.countLabel}
        </Text>
      </View>

      <Text style={styles.headline} numberOfLines={2}>
        {summary.headline}
      </Text>
      <Text style={styles.subline} numberOfLines={3}>
        {summary.subline}
      </Text>

      <View style={styles.progressRow}>
        <AnimatedProgressBar
          progress={summary.completionRatio}
          color={colors.primary}
          trackColor="rgba(15, 143, 134, 0.12)"
          height={8}
        />
        <Text style={styles.progressLabel}>{summary.progressPercentLabel}</Text>
      </View>

      {featuredTitle ? (
        <View style={styles.featuredChip}>
          <Ionicons name="sparkles-outline" size={12} color={colors.hubGoldDark} />
          <Text style={styles.featuredText} numberOfLines={1}>
            Öne çıkan: {featuredTitle}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BADGE_SHOWCASE_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: BADGE_SHOWCASE_THEME.border,
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
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.22)',
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
    color: BADGE_SHOWCASE_THEME.textPrimary,
    letterSpacing: -0.2,
  },
  prestige: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  count: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    lineHeight: 20,
  },
  subline: {
    fontSize: 12,
    fontWeight: '500',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 17,
  },
  progressRow: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    textAlign: 'right',
  },
  featuredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.hubGoldMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hubGoldDark,
    flexShrink: 1,
  },
});
