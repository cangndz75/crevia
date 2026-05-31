import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { getReportBadgeSlotImage } from '@/core/assets/creviaAssetPresentation';
import { buildReportBadgeSlots } from '@/features/reports/presentation/reportScreenPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  evaluation?: BadgeEvaluationSnapshot | null;
};

export function ReportBadgeStatusCard({ evaluation }: Props) {
  const slots = buildReportBadgeSlots(evaluation);

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <CreviaAssetImage
          source={creviaAssets.reports.icons.dailyTaskCoin}
          containerStyle={styles.headerAsset}
          contentFit="contain"
        />
        <Text style={styles.title} numberOfLines={1}>
          ROZET DURUMU
        </Text>
      </View>
      <View style={styles.slotRow}>
        {slots.map((slot, index) => (
          <View
            key={slot.id}
            style={[styles.slot, slot.active ? styles.slotActive : styles.slotLocked]}>
            <CreviaAssetImage
              source={getReportBadgeSlotImage(slot.active, index)}
              containerStyle={styles.slotAsset}
              contentFit="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.18)',
    padding: 12,
    gap: 10,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  headerAsset: {
    width: 16,
    height: 16,
  },
  slotAsset: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slotActive: {
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.35)',
  },
  slotLocked: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    opacity: 0.85,
  },
});
