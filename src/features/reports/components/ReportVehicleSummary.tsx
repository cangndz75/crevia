import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { GameCard } from '@/ui/components/GameCard';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportVehicleSummaryProps = {
  lines: string[];
};

export function ReportVehicleSummary({ lines }: ReportVehicleSummaryProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <CreviaAssetImage
          source={creviaAssets.vehicles.fieldOperatorTruck}
          containerStyle={styles.headerAsset}
          contentFit="contain"
        />
        <Text style={typography.label}>Araç Filosu</Text>
      </View>
      <Text style={styles.hint}>Gün sonu filo özeti</Text>
      <View style={styles.lines}>
        {lines.map((line, index) => (
          <Text key={`vehicle-report-${index}`} style={styles.line} numberOfLines={3}>
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
  headerAsset: {
    width: 28,
    height: 28,
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
