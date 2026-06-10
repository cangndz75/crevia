import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DistrictOperationUnlockBindingSummary } from '@/core/progression/districtOperationUnlockBindingTypes';
import { DISTRICT_EXPANSION_THEME } from '@/features/progression/utils/districtExpansionTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictExpansionSummaryCardProps = {
  summary: DistrictOperationUnlockBindingSummary;
};

export function DistrictExpansionSummaryCard({ summary }: DistrictExpansionSummaryCardProps) {
  const nextTitle = summary.nextDistricts[0]?.title ?? summary.recommendedNextStep?.title;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>Şehir Açılımları</Text>
          <Text style={styles.phase} numberOfLines={1}>
            {summary.currentPhaseLabel}
          </Text>
          <Text style={styles.authority} numberOfLines={1}>
            {summary.currentAuthorityLabel}
          </Text>
        </View>
        <Text style={styles.count}>
          {summary.activeDistrictCount}/{summary.totalDistrictCount}
        </Text>
      </View>

      {nextTitle ? (
        <Text style={styles.next} numberOfLines={1}>
          Sıradaki: {nextTitle}
        </Text>
      ) : null}

      <Text style={styles.headline} numberOfLines={2}>
        {summary.headline}
      </Text>
      <Text style={styles.subline} numberOfLines={3}>
        {summary.subline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DISTRICT_EXPANSION_THEME.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: DISTRICT_EXPANSION_THEME.border,
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
    backgroundColor: colors.primaryMuted,
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
    color: DISTRICT_EXPANSION_THEME.textPrimary,
  },
  phase: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  authority: {
    fontSize: 10,
    fontWeight: '600',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
  },
  count: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  next: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
    lineHeight: 20,
  },
  subline: {
    fontSize: 12,
    fontWeight: '500',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 17,
  },
});
