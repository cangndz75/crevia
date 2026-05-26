import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  LEGACY_METRICS,
  type LegacyMetricItem,
} from '@/features/pilot/components/operation-preview/operationPreviewData';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const METRIC_PALETTE: Record<
  LegacyMetricItem['tone'],
  { bg: string; icon: string }
> = {
  green: { bg: colors.successMuted, icon: colors.success },
  gold: { bg: colors.hubGoldMuted, icon: colors.hubGoldDark },
  blue: { bg: colors.secondaryMuted, icon: colors.secondary },
  cream: { bg: colors.background, icon: colors.textPrimary },
};

type OperationPreviewLegacyCardProps = {
  values?: Partial<Record<string, string>>;
};

function LegacyMetricChip({
  item,
  displayValue,
}: {
  item: LegacyMetricItem;
  displayValue?: string;
}) {
  const palette = METRIC_PALETTE[item.tone];

  return (
    <View style={[styles.metricChip, { backgroundColor: palette.bg }]}>
      <View style={styles.metricIcon}>
        <Ionicons name={item.icon} size={14} color={palette.icon} />
      </View>
      <View style={styles.metricText}>
        <Text style={styles.metricLabel} numberOfLines={1}>
          {item.label}
        </Text>
        {displayValue ? (
          <Text style={[styles.metricValue, { color: palette.icon }]}>
            {displayValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function OperationPreviewLegacyCard({
  values,
}: OperationPreviewLegacyCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(220).duration(340).springify().damping(22)}>
      <GameCard
        padding="lg"
        style={[styles.card, shadows.soft]}
        soft>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="git-merge-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Pilot Kararların Boşa Gitmiyor</Text>
            <Text style={styles.body}>
              Pilot sürecindeki performansın, ana operasyondaki başlangıç dengen
              üzerinde etkili olacak.
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {LEGACY_METRICS.map((item) => (
            <LegacyMetricChip
              key={item.id}
              item={item}
              displayValue={values?.[item.id]}
            />
          ))}
        </View>
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: `${colors.primary}33`,
    backgroundColor: colors.primaryMuted,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  body: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricChip: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    minWidth: 140,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
  },
});
