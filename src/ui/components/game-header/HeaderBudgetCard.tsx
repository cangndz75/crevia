import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HeaderBudgetCardProps = {
  amount: string;
  deltaLabel?: string | null;
  deltaNegative?: boolean;
  /** Dashboard varyantında daha geniş kart */
  prominent?: boolean;
  light?: boolean;
};

export function HeaderBudgetCard({
  amount,
  deltaLabel,
  deltaNegative,
  prominent = false,
  light = false,
}: HeaderBudgetCardProps) {
  return (
    <View
      style={[
        styles.card,
        prominent && styles.cardProminent,
        light ? styles.cardLight : styles.cardDefault,
        !light && shadows.soft,
      ]}>
      <Text style={[styles.label, light && styles.labelLight]}>Bütçe</Text>
      <Text
        style={[
          styles.amount,
          prominent && styles.amountProminent,
          light && styles.amountLight,
        ]}
        numberOfLines={1}>
        {amount}
      </Text>
      {deltaLabel ? (
        <Text
          style={[
            styles.delta,
            deltaNegative && styles.deltaNeg,
            light && styles.deltaLight,
          ]}>
          {deltaLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignItems: 'flex-end',
    minWidth: 88,
    flexShrink: 0,
  },
  cardDefault: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.xpGold}66`,
  },
  cardLight: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  cardProminent: {
    minWidth: 104,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  labelLight: {
    color: 'rgba(255,255,255,0.65)',
  },
  amount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  amountProminent: {
    fontSize: 15,
  },
  amountLight: {
    color: colors.textInverse,
  },
  delta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    marginTop: 1,
  },
  deltaNeg: {
    color: colors.danger,
  },
  deltaLight: {
    color: '#A8F0C8',
  },
});
