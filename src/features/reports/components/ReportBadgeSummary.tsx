import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildReportBadgeSummaryModel,
  type ReportBadgeSummaryModel,
} from '@/core/badges/badgePresentation';
import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ReportBadgeSummaryProps = {
  evaluation?: BadgeEvaluationSnapshot | null;
  compact?: boolean;
};

type ChipProps = {
  label: string;
  tone?: 'gold' | 'neutral' | 'teal';
};

function SummaryChip({ label, tone = 'neutral' }: ChipProps) {
  const toneStyle =
    tone === 'gold'
      ? styles.chipGold
      : tone === 'teal'
        ? styles.chipTeal
        : styles.chipNeutral;

  return (
    <View style={[styles.chip, toneStyle]}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function EarnedContent({
  model,
  compact,
}: {
  model: ReportBadgeSummaryModel;
  compact: boolean;
}) {
  const badge = model.primaryBadge;
  if (!badge) return null;

  return (
    <>
      <View style={styles.chipRow}>
        <SummaryChip label="Yeni Rozet" tone="gold" />
        <SummaryChip label={badge.rarityLabel} tone="teal" />
        {!compact ? (
          <SummaryChip label={badge.categoryLabel} tone="neutral" />
        ) : null}
      </View>

      <Text style={[styles.badgeTitle, compact && styles.badgeTitleCompact]} numberOfLines={2}>
        {badge.title}
      </Text>

      {!compact ? (
        <Text style={styles.badgeDescription} numberOfLines={2}>
          {badge.description}
        </Text>
      ) : (
        <Text style={styles.badgeDescriptionCompact} numberOfLines={1}>
          {badge.description}
        </Text>
      )}

      {model.extraEarnedCount > 0 ? (
        <Text style={styles.extraEarned} numberOfLines={1}>
          +{model.extraEarnedCount} rozet daha
        </Text>
      ) : null}
    </>
  );
}

function ProgressContent({
  model,
  compact,
}: {
  model: ReportBadgeSummaryModel;
  compact: boolean;
}) {
  const lines = compact ? model.progressLines.slice(0, 1) : model.progressLines;

  return (
    <View style={styles.progressList}>
      {lines.map((line) => (
        <View key={line} style={styles.progressRow}>
          <View style={styles.progressDot} />
          <Text style={styles.progressLine} numberOfLines={1}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReportBadgeSummary({
  evaluation,
  compact = false,
}: ReportBadgeSummaryProps) {
  const model = buildReportBadgeSummaryModel(evaluation);

  if (!model.visible) {
    return null;
  }

  const isEarned = model.mode === 'earned';

  return (
    <GameCard
      padding={compact ? 'md' : 'lg'}
      style={[
        styles.card,
        isEarned ? styles.cardEarned : styles.cardProgress,
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, isEarned && styles.iconWrapEarned]}>
          <Ionicons
            name={isEarned ? 'medal' : 'trending-up'}
            size={16}
            color={isEarned ? colors.hubGoldDark : colors.primary}
          />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {model.title}
        </Text>
      </View>

      {isEarned ? (
        <EarnedContent model={model} compact={compact} />
      ) : (
        <ProgressContent model={model} compact={compact} />
      )}
    </GameCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
  },
  cardEarned: {
    borderColor: 'rgba(212,160,23,0.28)',
    backgroundColor: colors.hubGoldMuted,
  },
  cardProgress: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapEarned: {
    backgroundColor: 'rgba(245,183,49,0.28)',
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    ...typography.label,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  chipGold: {
    backgroundColor: 'rgba(245,183,49,0.22)',
    borderColor: 'rgba(212,160,23,0.35)',
  },
  chipTeal: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(26,143,138,0.2)',
  },
  chipNeutral: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.15,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  badgeTitleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  badgeDescription: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  badgeDescriptionCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  extraEarned: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hubGoldDark,
    marginTop: 2,
  },
  progressList: {
    gap: 6,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressLine: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
