import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import { DAY1_GOALS_PLACEHOLDER } from '@/core/onboarding/onboardingPresentation';
import { selectOnboardingHubVisibilityFromStore } from '@/core/onboarding/onboardingSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HubDailyGoalCardProps = {
  onEndDay: () => void;
};

export function HubDailyGoalCard({ onEndDay }: HubDailyGoalCardProps) {
  const goal = useGameStore((s) => selectPrimaryDailyGoal(s.dailyGoalState));
  const showGoalsPlaceholder = useGameStore((s) => {
    if (selectPrimaryDailyGoal(s.dailyGoalState)) return false;
    const day = s.gameState.city.day;
    if (day > 2) return false;
    const vis = selectOnboardingHubVisibilityFromStore({
      gameState: s.gameState,
      tutorialState: s.tutorialState,
      dailyPriorityState: s.dailyPriorityState,
      dailyGoalState: s.dailyGoalState,
      lastDecisionResult: s.lastDecisionResult,
      lastDailyReport: s.lastDailyReport,
      decisionHistory: s.decisionHistory,
      onboardingDismissedHintIds: s.onboardingDismissedHintIds,
    });
    return day <= 2 && !vis.showDailyPrioritySelection;
  });
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value < 1 ? 0.94 : 1,
  }));

  if (!goal) {
    if (!showGoalsPlaceholder) return null;
    return (
      <View style={[styles.panel, shadows.card]}>
        <View style={styles.goalSection}>
          <View style={styles.trophyCircle}>
            <Ionicons name="flag-outline" size={18} color={colors.hubGoldDark} />
          </View>
          <View style={styles.goalContent}>
            <Text style={styles.sectionLabel}>GÜNLÜK HEDEF</Text>
            <Text style={styles.goalText}>{DAY1_GOALS_PLACEHOLDER}</Text>
          </View>
        </View>
      </View>
    );
  }

  const progressRatio = goal.progressPercent / 100;

  return (
    <View style={[styles.panel, shadows.card]}>
      <View style={styles.goalSection}>
        <View style={styles.trophyCircle}>
          <Ionicons
            name={goal.isCompleted ? 'checkmark-circle' : 'trophy'}
            size={18}
            color={colors.hubGoldDark}
          />
        </View>

        <View style={styles.goalContent}>
          <Text style={styles.sectionLabel}>GÜNLÜK HEDEF</Text>
          <Text style={styles.goalText} numberOfLines={2}>
            {goal.title}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${Math.round(progressRatio * 100)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              %{goal.progressPercent} ilerleme
            </Text>
          </View>
        </View>

        <View style={styles.reward}>
          <Text style={styles.rewardLabel}>Ödül</Text>
          <Text style={styles.xp}>+{goal.rewardXp ?? 0} XP</Text>
        </View>
      </View>

      <View style={styles.endDayFooter}>
        <AnimatedPressable
          onPress={onEndDay}
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          accessibilityRole="button"
          accessibilityLabel="Günü bitir"
          style={[styles.endDayBtn, animatedStyle]}>
          <LinearGradient
            colors={['#0F4A47', colors.headerTealDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.endDayGradient}>
            <View style={styles.endDayLeft}>
              <View style={styles.flagBadge}>
                <Ionicons name="flag" size={15} color="#FFFFFF" />
              </View>
              <View style={styles.endDayTextCol}>
                <Text style={styles.endDayTitle}>Günü Bitir</Text>
                <Text style={styles.endDayHint}>Günün raporunu gör</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={19} color="rgba(255,255,255,0.95)" />
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E8D9B8',
    overflow: 'hidden',
  },
  goalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.hubGoldMuted,
  },
  trophyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hubGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.hubGoldDark,
    letterSpacing: 0.9,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  progressRow: {
    gap: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.hubGold,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reward: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hubGold,
    gap: 1,
  },
  rewardLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  xp: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  endDayFooter: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
    backgroundColor: '#FFFCF7',
  },
  endDayBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#0D3D3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  endDayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 14,
  },
  endDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flagBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  endDayTextCol: {
    gap: 2,
  },
  endDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.25,
  },
  endDayHint: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
});
