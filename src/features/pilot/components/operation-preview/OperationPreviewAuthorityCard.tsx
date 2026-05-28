import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { OperationPreviewAuthoritySummary } from '@/core/authority/authorityPresentation';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type OperationPreviewAuthorityCardProps = {
  summary: OperationPreviewAuthoritySummary;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function OperationPreviewAuthorityCard({
  summary,
}: OperationPreviewAuthorityCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(180).duration(320).springify().damping(22)}>
      <GameCard padding="lg" style={styles.card} soft>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Yetki Durumu</Text>
            <Text style={styles.body}>
              Resmi unvan yalnızca dönem sonu değerlendirmesiyle güncellenir.
            </Text>
          </View>
        </View>

        <View style={styles.rows}>
          <SummaryRow label="Mevcut Yetki" value={summary.currentRankLabel} />
          <SummaryRow label="Son Değerlendirme" value={summary.evaluationLabel} />
          <SummaryRow
            label="Ana Operasyon İçin"
            value={summary.mainOperationRequirementLabel}
          />
        </View>
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: `${colors.secondary}33`,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.subtitle,
    fontWeight: '800',
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    gap: 2,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
