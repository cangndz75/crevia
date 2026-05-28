import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportAuthoritySummaryProps = {
  lines: string[];
  compact?: boolean;
};

export function ReportAuthoritySummary({
  lines,
  compact = false,
}: ReportAuthoritySummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  const visibleLines = compact ? lines.slice(0, 2) : lines.slice(0, 3);

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
        <Text style={typography.label}>Yetki Güveni</Text>
      </View>
      {!compact ? (
        <Text style={styles.hint}>Resmi unvan günlük değişmez</Text>
      ) : null}
      <View style={styles.lines}>
        {visibleLines.map((line, index) => (
          <Text key={`authority-${index}`} style={styles.line}>
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
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
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
