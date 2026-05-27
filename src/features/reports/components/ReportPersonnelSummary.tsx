import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportPersonnelSummaryProps = {
  lines: string[];
};

export function ReportPersonnelSummary({ lines }: ReportPersonnelSummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="people-outline" size={18} color={colors.secondary} />
        <Text style={typography.label}>Personel Özeti</Text>
      </View>
      <Text style={styles.hint}>Yarın için ekip önerileri</Text>
      <View style={styles.lines}>
        {lines.map((line, index) => (
          <Text key={`personnel-${index}`} style={styles.line}>
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
