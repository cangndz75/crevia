import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type Props = {
  lines: string[];
};

export function ReportQuickActionsSummary({ lines }: Props) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={typography.label}>Günlük Hazırlıklar</Text>
      {lines.map((line) => (
        <Text key={line} style={typography.body} numberOfLines={2}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
