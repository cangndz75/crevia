import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { EndOfDayMetricCardModel } from '@/features/reports/utils/endOfDayReportPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  cards: EndOfDayMetricCardModel[];
};

const FOOTER_COLORS = {
  default: colors.textSecondary,
  accent: '#1A8F8A',
  success: colors.success,
  danger: colors.danger,
} as const;

function MetricCard({ card }: { card: EndOfDayMetricCardModel }) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: card.iconBg }]}>
          <Ionicons
            name={card.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={card.iconColor}
          />
        </View>
        {card.showChevron ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        ) : null}
      </View>
      <Text style={styles.cardTitle}>{card.title}</Text>
      {card.detailLines?.length ? (
        <View style={styles.detailList}>
          {card.detailLines.map((line) => (
            <Text key={line.label} style={styles.detailLine}>
              {line.label}{' '}
              <Text style={styles.detailValue}>{line.value}</Text>
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.value} numberOfLines={2}>
          {card.value}
        </Text>
      )}
      <View style={styles.footerRow}>
        {card.footerTone === 'success' ? (
          <View style={styles.statusDot} />
        ) : null}
        <Text
          style={[
            styles.footer,
            { color: FOOTER_COLORS[card.footerTone ?? 'default'] },
          ]}
          numberOfLines={2}>
          {card.footer}
        </Text>
        {card.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{card.badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function EndOfDayReportMetricGrid({ cards }: Props) {
  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.key} style={styles.cell}>
          <MetricCard card={card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48.5%',
    flexGrow: 1,
    minWidth: 150,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 132,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  detailList: {
    gap: 2,
  },
  detailLine: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  detailValue: {
    fontWeight: '800',
    color: '#3498DB',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingTop: spacing.xs,
  },
  footer: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});
