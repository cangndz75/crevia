import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildDailyGoalHint,
  formatGoalProgress,
  getDailyGoalIcon,
  getDailyGoalStatusLabel,
  getDailyGoalTone,
} from '@/core/dailyGoals/dailyGoalPresentation';
import { selectDailyGoalsForHub } from '@/core/dailyGoals/dailyGoalSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const TONE_STYLES = {
  success: {
    chipBg: colors.successMuted,
    chipText: colors.success,
    bar: colors.success,
  },
  warning: {
    chipBg: colors.warningMuted,
    chipText: colors.warning,
    bar: colors.warning,
  },
  danger: {
    chipBg: colors.dangerMuted,
    chipText: colors.danger,
    bar: colors.danger,
  },
  info: {
    chipBg: colors.secondaryMuted,
    chipText: colors.secondary,
    bar: colors.secondary,
  },
  neutral: {
    chipBg: colors.backgroundAlt,
    chipText: colors.textSecondary,
    bar: colors.border,
  },
} as const;

export function HubDailyGoalsCard() {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const dailyGoalState = useGameStore((s) => s.dailyGoalState);

  const goals = selectDailyGoalsForHub(dailyGoalState);
  const primary = goals.find((g) => g.priority === 'primary');
  const secondaries = goals.filter((g) => g.priority === 'secondary');
  const dailyPriorityKey = useGameStore((s) => s.dailyPriorityState?.selectedKey);
  const hint = buildDailyGoalHint(dailyGoalState?.goals ?? [], dailyPriorityKey);

  if (goals.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bugünün Hedefleri</Text>
        <View style={styles.dayChip}>
          <Text style={styles.dayChipText}>Gün {currentDay}</Text>
        </View>
      </View>

      {primary ? (
        <GoalRow goal={primary} large />
      ) : null}

      {secondaries.length > 0 ? (
        <View style={styles.secondaryList}>
          {secondaries.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </View>
      ) : null}

      {hint ? (
        <Text style={styles.hint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function GoalRow({
  goal,
  large = false,
}: {
  goal: import('@/core/dailyGoals/dailyGoalTypes').DailyGoal;
  large?: boolean;
}) {
  const tone = getDailyGoalTone(goal.status);
  const palette = TONE_STYLES[tone];
  const iconName = getDailyGoalIcon(goal) as keyof typeof Ionicons.glyphMap;

  return (
    <View style={[styles.goalRow, large && styles.goalRowLarge]}>
      <View style={[styles.iconWrap, large && styles.iconWrapLarge]}>
        <Ionicons name={iconName} size={large ? 18 : 15} color={colors.primary} />
      </View>
      <View style={styles.goalBody}>
        <View style={styles.goalTop}>
          <Text style={[styles.goalTitle, large && styles.goalTitleLarge]} numberOfLines={2}>
            {goal.title}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: palette.chipBg }]}>
            <Text style={[styles.statusChipText, { color: palette.chipText }]}>
              {getDailyGoalStatusLabel(goal.status)}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${goal.progressPercent}%`,
                backgroundColor: palette.bar,
              },
            ]}
          />
        </View>
        <Text style={styles.progressMeta}>
          {formatGoalProgress(goal)}
          {!large ? ` · ${goal.shortLabel}` : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dayChip: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  goalRowLarge: {
    paddingVertical: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  goalBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  goalTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 16,
  },
  goalTitleLarge: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  secondaryList: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
});
