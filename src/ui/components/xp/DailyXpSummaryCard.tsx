import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DailyXpReport } from '@/core/xp/xpReport';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export type DailyXpSummaryCardProps = {
  report: DailyXpReport;
  currentLevel?: number;
  currentLevelXp?: number;
  nextLevelXp?: number;
  xpToNextLevel?: number;
};

export function DailyXpSummaryCard({
  report,
  currentLevel,
  currentLevelXp,
  nextLevelXp,
  xpToNextLevel,
}: DailyXpSummaryCardProps) {
  const hasXp = report.totalXp > 0;
  const showLevelProgress =
    currentLevel != null &&
    currentLevelXp != null &&
    nextLevelXp != null &&
    xpToNextLevel != null;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="star-outline" size={18} color={colors.hubGoldDark} />
        </View>
        <Text style={styles.heading}>Bugünkü XP</Text>
      </View>

      {hasXp ? (
        <>
          <Text style={styles.totalValue}>
            +{report.totalXp.toLocaleString('tr-TR')} XP
          </Text>
          <Text style={styles.subtitle}>
            Bugünkü kararların ilerlemene işlendi.
          </Text>

          <View style={styles.categoryList}>
            {report.categories.map((group) => (
              <View
                key={`${group.category}-${group.label}`}
                style={styles.categoryRow}>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {group.label}
                </Text>
                <Text style={styles.categoryAmount}>
                  +{group.total.toLocaleString('tr-TR')} XP
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>Bugün XP kazanılmadı</Text>
      )}

      {showLevelProgress ? (
        <View style={styles.levelBlock}>
          <Text style={styles.levelTitle}>Seviye {currentLevel}</Text>
          <Text style={styles.levelDetail}>
            {currentLevelXp!.toLocaleString('tr-TR')}/
            {nextLevelXp!.toLocaleString('tr-TR')} XP
          </Text>
          <Text style={styles.levelRemaining}>
            {xpToNextLevel!.toLocaleString('tr-TR')} XP kaldı
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  categoryList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  levelBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    gap: 2,
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  levelDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  levelRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
