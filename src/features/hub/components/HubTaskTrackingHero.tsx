import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  formatGoalProgress,
  getDailyGoalIcon,
} from '@/core/dailyGoals/dailyGoalPresentation';
import { formatHubTaskRewardLabel } from '@/features/hub/utils/hubScreenPresentation';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveHubStatusStrip } from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function ProgressRing({
  percent,
  size = 52,
  strokeWidth = 5,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={colors.hubGoldTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={colors.hubGold}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={ringStyles.label}>{Math.round(percent)}%</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
});

function StatusPill({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <View style={pillStyles.pill}>
      <View style={[pillStyles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color="#FFFFFF" />
      </View>
      <View style={pillStyles.textCol}>
        <Text style={pillStyles.value}>{value}</Text>
        <Text style={pillStyles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    ...shadows.soft,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

type HubTaskTrackingHeroProps = {
  variant?: 'default' | 'compact' | 'focus';
};

export function HubTaskTrackingHero({ variant = 'default' }: HubTaskTrackingHeroProps) {
  const isCompact = variant === 'compact';
  const isFocus = variant === 'focus';
  const input = useHubDerivedInput();
  const resources = useGameStore((s) => s.resources);
  const goal = useGameStore((s) => selectPrimaryDailyGoal(s.dailyGoalState));

  const statusItems = useMemo(() => {
    const items = deriveHubStatusStrip(input, resources);
    return items.filter((item) => item.id === 'risk' || item.id === 'activeEvents');
  }, [input, resources]);

  const rewardLabel = formatHubTaskRewardLabel(goal?.rewardXp);

  if (!goal) {
    return (
      <Animated.View
        entering={FadeIn.duration(240)}
        style={[
          styles.row,
          styles.rowFallback,
          isCompact && styles.rowCompact,
          shadows.card,
        ]}>
        <View style={[styles.statusColFull, isCompact && styles.statusColFullCompact]}>
          {statusItems.map((item) => (
            <StatusPill
              key={item.id}
              icon={item.id === 'risk' ? 'warning' : 'alert-circle'}
              iconBg={item.accent}
              value={item.value}
              label={item.label}
            />
          ))}
        </View>
      </Animated.View>
    );
  }

  const iconName = getDailyGoalIcon(goal) as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      style={[
        styles.row,
        isCompact && styles.rowCompact,
        isFocus && styles.rowFocus,
        shadows.card,
      ]}>
      <View style={[styles.goalCard, isCompact && styles.goalCardCompact]}>
        <View style={styles.goalHeader}>
          <View style={[styles.trophyWrap, isCompact && styles.trophyWrapCompact]}>
            <Ionicons
              name={iconName}
              size={isCompact ? 14 : 16}
              color={colors.hubGoldDark}
            />
          </View>
          <Text style={styles.sectionLabel} numberOfLines={1}>
            {isFocus ? 'Bugünkü odak' : 'Günlük hedef'}
          </Text>
        </View>

        <View style={styles.goalBody}>
          <View style={styles.goalTextCol}>
            <Text
              style={[styles.goalTitle, isCompact && styles.goalTitleCompact]}
              numberOfLines={2}>
              {goal.title}
            </Text>
            {!isCompact ? (
              <Text style={styles.goalDesc} numberOfLines={2}>
                {goal.description}
              </Text>
            ) : null}
            <View style={styles.rewardRow}>
              {rewardLabel ? (
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardText} numberOfLines={1}>
                    {rewardLabel}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.progressMeta} numberOfLines={1}>
                {formatGoalProgress(goal)}
              </Text>
            </View>
          </View>
          <ProgressRing
            percent={goal.progressPercent}
            size={isCompact ? 44 : 52}
            strokeWidth={isCompact ? 4 : 5}
          />
        </View>
      </View>

      {!isCompact && !isFocus ? (
        <View style={styles.statusCol}>
          {statusItems.map((item) => (
            <StatusPill
              key={item.id}
              icon={item.id === 'risk' ? 'warning' : 'alert-circle'}
              iconBg={item.accent}
              value={item.value}
              label={item.label}
            />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    zIndex: 2,
  },
  rowCompact: {
    marginTop: spacing.xs,
  },
  rowFocus: {
    marginTop: spacing.sm,
  },
  rowFallback: {
    marginTop: spacing.sm,
    zIndex: 2,
    marginHorizontal: spacing.lg,
  },
  goalCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
    padding: 12,
    gap: 8,
    minWidth: 0,
  },
  goalCardCompact: {
    padding: 10,
    gap: 6,
    borderRadius: radius.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trophyWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: colors.hubGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyWrapCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  goalBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  goalTitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  goalDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 14,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.hubGoldMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    flexShrink: 1,
    minWidth: 0,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
    flexShrink: 1,
  },
  progressMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusCol: {
    width: 108,
    maxWidth: '34%',
    flexShrink: 0,
    gap: 6,
    justifyContent: 'center',
  },
  statusColFull: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  statusColFullCompact: {
    flexDirection: 'column',
  },
});
