import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportSocialSummaryProps = {
  lines: string[];
};

export function ReportSocialSummary({ lines }: ReportSocialSummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
        <Text style={typography.label}>Sosyal Nabız</Text>
      </View>
      <Text style={styles.hint}>Gün sonu topluluk özeti</Text>
      <View style={styles.lines}>
        {lines.map((line, index) => (
          <Text
            key={`social-report-${index}`}
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
