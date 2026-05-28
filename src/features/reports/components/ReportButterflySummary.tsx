import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportButterflySummaryProps = {
  lines: string[];
};

export function ReportButterflySummary({ lines }: ReportButterflySummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
        <Text style={typography.label}>Karar Yankısı</Text>
      </View>
      <View style={styles.lines}>
        {lines.slice(0, 2).map((line, index) => (
          <Text
            key={`butterfly-report-${index}`}
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
