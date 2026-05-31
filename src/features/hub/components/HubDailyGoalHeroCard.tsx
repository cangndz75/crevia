import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  formatGoalProgress,
  getDailyGoalIcon,
} from '@/core/dailyGoals/dailyGoalPresentation';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import { formatHubTaskRewardLabel } from '@/features/hub/utils/hubScreenPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { useGameStore } from '@/store/useGameStore';
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
          stroke={HUB_PREMIUM_COLORS.goldSoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={HUB_PREMIUM_COLORS.gold}
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
    flexShrink: 0,
  },
  label: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '800',
    color: '#9A7B28',
  },
});

type HubDailyGoalHeroCardProps = {
  imageSource?: ImageSource;
};

export function HubDailyGoalHeroCard({ imageSource }: HubDailyGoalHeroCardProps) {
  const goal = useGameStore((s) => selectPrimaryDailyGoal(s.dailyGoalState));

  const rewardLabel = useMemo(
    () => formatHubTaskRewardLabel(goal?.rewardXp),
    [goal?.rewardXp],
  );

  if (!goal) {
    return null;
  }

  const iconName = getDailyGoalIcon(goal) as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      style={[styles.card, hubPremiumShadowCard()]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          {imageSource ? (
            <HubAssetImage
              source={imageSource}
              containerStyle={styles.assetSlot}
              contentFit="contain"
            />
          ) : (
            <Ionicons name={iconName} size={15} color="#9A7B28" />
          )}
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Günlük hedef
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {goal.title}
          </Text>
          <View style={styles.progressRow}>
            {rewardLabel ? (
              <View style={styles.rewardPill}>
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
        <ProgressRing percent={goal.progressPercent} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: HUB_PREMIUM_COLORS.card,
    borderRadius: HUB_PREMIUM_RADIUS.goal,
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.borderSoft,
    padding: 16,
    gap: 10,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: HUB_PREMIUM_COLORS.gold,
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  assetSlot: {
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A7B28',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rewardPill: {
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: HUB_PREMIUM_RADIUS.pill,
    maxWidth: '70%',
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A7B28',
  },
  progressMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textMuted,
    flexShrink: 1,
  },
});
