import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type SummaryCard = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  sublabel?: string;
};

type Props = {
  cards: SummaryCard[];
};

export function MapSummaryCards({ cards }: Props) {
  return (
    <View style={styles.row}>
      {cards.map((card, i) => (
        <View key={i} style={[styles.card, shadows.soft]}>
          <View style={[styles.iconCircle, { backgroundColor: `${card.iconColor}18` }]}>
            <Ionicons name={card.icon} size={18} color={card.iconColor} />
          </View>
          <Text style={styles.value}>{card.value}</Text>
          <Text style={styles.label} numberOfLines={1}>{card.label}</Text>
          {card.sublabel ? (
            <Text style={styles.sublabel} numberOfLines={1}>{card.sublabel}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
});
