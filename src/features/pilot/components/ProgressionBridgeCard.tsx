import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  buildProgressionPreviewStatusLabel,
  type ProgressionBridgeSummary,
  type ProgressionUnlockPreview,
  type ProgressionUnlockPreviewStatus,
} from '@/core/progression';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ProgressionBridgeCardProps = {
  summary: ProgressionBridgeSummary;
};

function statusToneStyle(status: ProgressionUnlockPreviewStatus) {
  switch (status) {
    case 'completed':
      return {
        chipBg: colors.successMuted,
        chipBorder: 'rgba(59,175,122,0.24)',
        chipText: colors.success,
        bar: colors.success,
      };
    case 'near':
      return {
        chipBg: colors.hubGoldMuted,
        chipBorder: 'rgba(212,160,23,0.24)',
        chipText: colors.hubGoldDark,
        bar: colors.hubGold,
      };
    case 'available_preview':
      return {
        chipBg: colors.secondaryMuted,
        chipBorder: 'rgba(91,143,212,0.22)',
        chipText: colors.secondary,
        bar: colors.secondary,
      };
    default:
      return {
        chipBg: colors.backgroundAlt,
        chipBorder: colors.border,
        chipText: colors.textSecondary,
        bar: colors.primary,
      };
  }
}

function PreviewItemRow({
  preview,
  compact = false,
}: {
  preview: ProgressionUnlockPreview;
  compact?: boolean;
}) {
  const tone = statusToneStyle(preview.status);

  return (
    <View style={[styles.itemRow, compact && styles.itemRowCompact]}>
      <View style={styles.itemHead}>
        <Text style={styles.itemTitle} numberOfLines={compact ? 1 : 2}>
          {preview.title}
        </Text>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: tone.chipBg, borderColor: tone.chipBorder },
          ]}>
          <Text style={[styles.statusChipText, { color: tone.chipText }]} numberOfLines={1}>
            {buildProgressionPreviewStatusLabel(preview.status)}
          </Text>
        </View>
      </View>
      {!compact ? (
        <Text style={styles.itemReason} numberOfLines={2}>
          {preview.reasonLine}
        </Text>
      ) : null}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, Math.max(0, preview.progressPercent))}%`,
              backgroundColor: tone.bar,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function ProgressionBridgeCard({ summary }: ProgressionBridgeCardProps) {
  if (!summary.visible) {
    return null;
  }

  const secondaryItems = summary.previewItems.filter(
    (item) => item.id !== summary.primaryPreview?.id,
  );

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(320).springify().damping(22)}>
      <GameCard padding="lg" style={styles.card} soft>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="map-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{summary.title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {summary.subtitle}
            </Text>
          </View>
        </View>

        {summary.primaryPreview ? (
          <View style={styles.primaryBlock}>
            <PreviewItemRow preview={summary.primaryPreview} />
          </View>
        ) : null}

        {secondaryItems.length > 0 ? (
          <View style={styles.secondaryList}>
            {secondaryItems.slice(0, 3).map((preview) => (
              <PreviewItemRow key={preview.id} preview={preview} compact />
            ))}
          </View>
        ) : null}

        {summary.nextActionLine ? (
          <Text style={styles.nextAction} numberOfLines={2}>
            {summary.nextActionLine}
          </Text>
        ) : null}
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: `${colors.primary}22`,
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
    backgroundColor: colors.primaryMuted,
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
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryBlock: {
    gap: spacing.xs,
  },
  secondaryList: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemRow: {
    gap: 6,
  },
  itemRowCompact: {
    gap: 4,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemTitle: {
    flex: 1,
    ...typography.body,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 17,
  },
  itemReason: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  statusChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  nextAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 17,
  },
});
