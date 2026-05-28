import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportCarryOverSummaryProps = {
  lines: string[];
  /** Karar yankısı satırları varsa carry-over kısaltılır. */
  compact?: boolean;
};

export function ReportCarryOverSummary({
  lines,
  compact = false,
}: ReportCarryOverSummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  const display = lines.slice(0, compact ? 1 : 2);

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={typography.label}>Dünden Kalan</Text>
      </View>
      <View style={styles.lines}>
        {display.map((line, index) => (
          <Text
            key={`carry-over-report-${index}`}
            style={styles.line}
            numberOfLines={2}>
            • {line}
          </Text>
        ))}
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lines: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  line: {
    ...typography.body,
    lineHeight: 21,
    color: colors.textPrimary,
  },
});
