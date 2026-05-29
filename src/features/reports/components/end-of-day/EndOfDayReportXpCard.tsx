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
  const hasPoints = totalXp > 0;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={14} color={colors.hubGoldDark} />
          </View>
          <Text style={styles.heading} numberOfLines={1}>
            Operasyon Puanı
          </Text>
          {hasPoints ? (
            <>
              <Text style={styles.total} numberOfLines={1}>
                +{totalXp.toLocaleString('tr-TR')} puan
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            </>
          ) : (
            <Text style={styles.empty} numberOfLines={1}>
              Bugün puan kazanılmadı
            </Text>
          )}
        </View>
        <View style={styles.trophy}>
          <Ionicons name="ribbon" size={28} color={colors.hubGold} />
        </View>
      </View>

      {breakdown.length > 0 ? (
        <View style={styles.breakdown}>
          {breakdown.map((item) => (
            <View key={item.label} style={styles.breakdownItem}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.breakdownLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.breakdownAmount} numberOfLines={1}>
                +{item.amount.toLocaleString('tr-TR')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
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
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  total: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trophy: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hubGoldTrack,
    flexShrink: 0,
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
    minWidth: 0,
  },
  breakdownLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
});
