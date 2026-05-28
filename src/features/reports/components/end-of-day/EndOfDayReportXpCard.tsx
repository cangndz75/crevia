import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { EndOfDayXpBreakdownItem } from '@/features/reports/utils/endOfDayReportPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  totalXp: number;
  subtitle: string;
  breakdown: EndOfDayXpBreakdownItem[];
};

export function EndOfDayReportXpCard({ totalXp, subtitle, breakdown }: Props) {
  const hasXp = totalXp > 0;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={16} color={colors.hubGoldDark} />
          </View>
          <Text style={styles.heading}>Bugünkü XP</Text>
          {hasXp ? (
            <>
              <Text style={styles.total}>+{totalXp.toLocaleString('tr-TR')} XP</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </>
          ) : (
            <Text style={styles.empty}>Bugün XP kazanılmadı</Text>
          )}
        </View>
        <View style={styles.trophy}>
          <Ionicons name="ribbon" size={36} color={colors.hubGold} />
          <Text style={styles.trophyXp}>XP</Text>
        </View>
      </View>

      {breakdown.length > 0 ? (
        <>
          <View style={styles.divider} />
          <View style={styles.breakdown}>
            {breakdown.map((item) => (
              <View key={item.label} style={styles.breakdownItem}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.breakdownLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.breakdownAmount}>
                  +{item.amount.toLocaleString('tr-TR')} XP
                </Text>
              </View>
            ))}
          </View>
        </>
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
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  total: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F39C12',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  trophy: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hubGoldTrack,
  },
  trophyXp: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
    marginTop: -4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
    minWidth: 140,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
