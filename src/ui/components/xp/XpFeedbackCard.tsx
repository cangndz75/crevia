import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { formatAuthorityLabel } from '@/core/xp/authorityLabels';
import type { XpBreakdown } from '@/core/xp/types';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export type XpFeedbackCardProps = {
  xpBreakdown: XpBreakdown;
  leveledUp?: boolean;
  previousLevel?: number;
  newLevel?: number;
  unlockedAuthorities?: string[];
};

export function XpFeedbackCard({
  xpBreakdown,
  leveledUp = false,
  previousLevel,
  newLevel,
  unlockedAuthorities = [],
}: XpFeedbackCardProps) {
  const total = Math.max(0, xpBreakdown.total);
  const items = xpBreakdown.items.filter((item) => item.amount > 0);

  if (total <= 0 && items.length === 0) {
    return null;
  }

  const showLevelUp =
    leveledUp &&
    previousLevel != null &&
    newLevel != null &&
    newLevel > previousLevel;

  return (
    <View style={[styles.card, leveledUp && styles.cardLeveledUp, shadows.card]}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="star" size={20} color={colors.hubGoldDark} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.totalTitle}>+{total.toLocaleString('tr-TR')} XP Kazandın</Text>
          <Text style={styles.subtitle}>
            Kararının etkileri ilerlemene işlendi.
          </Text>
        </View>
      </View>

      {items.length > 0 ? (
        <View style={styles.breakdownList}>
          {items.map((item, index) => (
            <View
              key={`${item.category}-${item.title}-${index}`}
              style={styles.breakdownRow}>
              <Text style={styles.breakdownAmount}>
                +{item.amount.toLocaleString('tr-TR')}
              </Text>
              <View style={styles.breakdownTextCol}>
                <Text style={styles.breakdownTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.breakdownDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {showLevelUp ? (
        <View style={styles.levelUpBlock}>
          <View style={styles.levelUpHead}>
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.levelUpTitle}>Seviye Atladın!</Text>
          </View>
          <Text style={styles.levelUpTransition}>
            Seviye {previousLevel} → Seviye {newLevel}
          </Text>
          {unlockedAuthorities.length > 0 ? (
            <View style={styles.authoritiesBlock}>
              <Text style={styles.authoritiesHeading}>Yeni yetkiler açıldı</Text>
              {unlockedAuthorities.map((authorityId) => (
                <View key={authorityId} style={styles.authorityRow}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color={colors.secondary}
                  />
                  <Text style={styles.authorityLabel}>
                    {formatAuthorityLabel(authorityId)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
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
    gap: spacing.md,
  },
  cardLeveledUp: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: spacing.xs,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  breakdownList: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    minWidth: 36,
  },
  breakdownTextCol: {
    flex: 1,
    gap: 2,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownDescription: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  levelUpBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  levelUpHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelUpTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  levelUpTransition: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  authoritiesBlock: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  authoritiesHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  authorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
});
