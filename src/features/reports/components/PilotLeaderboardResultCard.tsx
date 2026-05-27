import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import {
  formatLeaderboardScore,
  getBreakdownHighlights,
  getPilotFinalPerformanceComment,
} from '@/features/leaderboard/utils/leaderboardUiModel';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export type PilotLeaderboardResultCardProps = {
  entry: LeaderboardEntry;
  rank: number | null;
  totalEntries: number;
  onOpenLeaderboard: () => void;
};

export function PilotLeaderboardResultCard({
  entry,
  rank,
  totalEntries,
  onOpenLeaderboard,
}: PilotLeaderboardResultCardProps) {
  const { strongest, weakest } = getBreakdownHighlights(entry.breakdown);
  const rankLabel =
    rank != null ? `#${rank} / ${totalEntries}` : `— / ${totalEntries}`;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.headRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>Belediye Performans Puanı</Text>
          <Text style={styles.title}>Pilot Performans Sonucu</Text>
        </View>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.scoreValue}>{formatLeaderboardScore(entry.score)}</Text>
        <View style={styles.rankTitleCol}>
          <Text style={styles.rankText}>{rankLabel}</Text>
          <Text style={styles.rankCaption}>Pilot sıralaması</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.playerTitle}>{entry.title}</Text>
        <Text style={styles.neighborhood}>{entry.neighborhoodName}</Text>
      </View>

      <Text style={styles.comment}>
        {getPilotFinalPerformanceComment(entry.score)}
      </Text>

      <View style={styles.pillRow}>
        <View style={[styles.pill, styles.pillStrong]}>
          <Text style={styles.pillLabel}>Güçlü alan</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {strongest.label}
          </Text>
        </View>
        <View style={[styles.pill, styles.pillWeak]}>
          <Text style={styles.pillLabel}>Gelişim alanı</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {weakest.label}
          </Text>
        </View>
      </View>

      <GameButton
        title="Liderlikte Gör"
        onPress={onOpenLeaderboard}
        variant="secondary"
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  docIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.25,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  rankTitleCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: -0.2,
  },
  rankCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  playerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  neighborhood: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  comment: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3,
    minWidth: 0,
  },
  pillStrong: {
    backgroundColor: colors.successMuted,
    borderColor: 'rgba(59,175,122,0.22)',
  },
  pillWeak: {
    backgroundColor: colors.warningMuted,
    borderColor: 'rgba(232,155,46,0.22)',
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  pillValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: 2,
  },
});
