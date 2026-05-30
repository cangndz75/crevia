import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAILY_PRIORITY_CHOICES } from '@/core/dailyPriority/dailyPriorityConstants';
import { playSelectionHaptic } from '@/core/feedback/hapticFeedback';
import {
  getDailyPriorityChoice,
  getDailyPriorityStatusLabel,
  getDailyPriorityToneColors,
  getLatestPriorityImpactText,
} from '@/core/dailyPriority/dailyPriorityPresentation';
import { isDailyPrioritySelectionRequired } from '@/core/dailyPriority/dailyPrioritySelectors';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { renderHighlightedText } from '@/features/hub/components/hubUiHelpers';
import { useOnboardingHubVisibility } from '@/features/onboarding/hooks/useOnboardingHubVisibility';
import {
  DAY1_PLAN_CHIP,
  DAY1_PLAN_STEPS,
  DAY1_PLAN_TITLE,
} from '@/features/hub/hubUiPresentation';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

function useDay1PlanProgressPercent(): number {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const goal = useGameStore((s) => selectPrimaryDailyGoal(s.dailyGoalState));
  const hasDecision = useGameStore((s) =>
    s.decisionHistory.some((r) => r.day === currentDay),
  );

  if (goal?.progressPercent != null) return goal.progressPercent;
  if (hasDecision) return 66;
  return 40;
}

export function HubDailyPriorityCard() {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const priorityState = useGameStore((s) => s.dailyPriorityState);
  const hasDecisionToday = useGameStore((s) =>
    s.decisionHistory.some((r) => r.day === currentDay),
  );
  const isDay1Eligible = useGameStore(selectIsDay1TutorialEligible);
  const hubVis = useOnboardingHubVisibility();
  const selectDailyPriority = useGameStore((s) => s.selectDailyPriority);
  const progressPercent = useDay1PlanProgressPercent();

  const needsSelection = isDailyPrioritySelectionRequired(
    priorityState,
    currentDay,
    isDay1Eligible,
  );

  if (!hubVis.showDailyPrioritySelection && hubVis.showDailyPriorityCompact) {
    return (
      <View style={styles.day1Wrap}>
        <View style={[styles.day1Card, shadows.card]}>
          <LinearGradient
            colors={['#F0FAF8', '#FFFFFF', '#FFFBF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.day1Gradient}>
            <View style={styles.day1TopRow}>
              <View style={styles.day1HeaderLeft}>
                <View style={styles.compassCircle}>
                  <Ionicons name="compass" size={20} color="#fff" />
                </View>
                <View style={styles.day1Titles}>
                  <Text style={styles.day1Title}>{DAY1_PLAN_TITLE}</Text>
                  <View style={styles.day1Chip}>
                    <Text style={styles.day1ChipText}>{DAY1_PLAN_CHIP}</Text>
                  </View>
                </View>
              </View>
              <HubAssetImage
                source={hubAssets.day1Plan.heroBuilding}
                containerStyle={styles.heroImageWrap}
                contentFit="contain"
              />
            </View>

            <Text style={styles.day1Body}>
              {renderHighlightedText(
                'İlk gün hedefin: temel müdahaleyi **öğrenmek**.',
                styles.day1Body,
                styles.day1BodyHighlight,
              )}
            </Text>

            <View style={styles.stepsFooter}>
              <View style={styles.stepsRow}>
                {DAY1_PLAN_STEPS.map((step, index) => {
                  const done = index === 0 || (index === 1 && hasDecisionToday);
                  const locked = !done && index > 0;
                  return (
                    <View key={step.label} style={styles.stepCol}>
                      <View style={styles.stepNodeRow}>
                        {index > 0 ? (
                          <View style={[styles.stepDash, done && styles.stepDashDone]} />
                        ) : null}
                        <View
                          style={[
                            styles.stepCircle,
                            done && styles.stepCircleDone,
                            locked && styles.stepCircleLocked,
                          ]}>
                          {done ? (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          ) : locked ? (
                            <Ionicons
                              name="lock-closed"
                              size={12}
                              color={colors.textSecondary}
                            />
                          ) : (
                            <Ionicons
                              name={step.icon}
                              size={14}
                              color={colors.headerTealDark}
                            />
                          )}
                        </View>
                        {index < DAY1_PLAN_STEPS.length - 1 ? (
                          <View
                            style={[
                              styles.stepDash,
                              index === 0 && hasDecisionToday && styles.stepDashDone,
                            ]}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[styles.stepLabel, done && styles.stepLabelDone]}
                        numberOfLines={1}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.progressCorner}>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
                <HubAssetImage
                  source={hubAssets.day1Plan.progressChest}
                  containerStyle={styles.progressChest}
                  contentFit="contain"
                />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (needsSelection) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.selectionCard, shadows.soft]}>
          <Text style={styles.selectionTitle}>Bugünkü Önceliğini Seç</Text>
          <Text style={styles.selectionSubtitle} numberOfLines={2}>
            Günün kararlarını hangi dengeyle yöneteceğini belirle.
          </Text>
          <View style={styles.choiceList}>
            {DAILY_PRIORITY_CHOICES.map((choice) => (
              <PriorityChoiceRow
                key={choice.key}
                choiceKey={choice.key}
                title={choice.title}
                promise={choice.promiseText}
                iconName={choice.iconName}
                onSelect={() => {
                  playSelectionHaptic();
                  selectDailyPriority(choice.key);
                }}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (!priorityState?.selectedKey) {
    return null;
  }

  const tone = getDailyPriorityToneColors(priorityState.selectedKey);
  const latest = getLatestPriorityImpactText(priorityState);

  return (
    <View style={styles.wrap}>
      <View style={[styles.activeCard, shadows.soft]}>
        <View style={styles.activeHeader}>
          <View style={[styles.activeIcon, { backgroundColor: tone.bg }]}>
            <Ionicons
              name={
                getDailyPriorityChoice(priorityState.selectedKey)
                  .iconName as keyof typeof Ionicons.glyphMap
              }
              size={18}
              color={tone.text}
            />
          </View>
          <View style={styles.activeBody}>
            <Text style={styles.activeTitle} numberOfLines={1}>
              {getDailyPriorityChoice(priorityState.selectedKey).title}
            </Text>
            <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusChipText, { color: tone.text }]}>
                {getDailyPriorityStatusLabel(priorityState.status)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrackActive}>
            <View
              style={[
                styles.progressFillActive,
                {
                  width: `${priorityState.progressPercent}%`,
                  backgroundColor: tone.text,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>%{priorityState.progressPercent}</Text>
        </View>
        {latest ? (
          <Text style={styles.impactLine} numberOfLines={1}>
            {latest}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PriorityChoiceRow({
  choiceKey,
  title,
  promise,
  iconName,
  onSelect,
}: {
  choiceKey: DailyPriorityKey;
  title: string;
  promise: string;
  iconName: string;
  onSelect: () => void;
}) {
  const tone = getDailyPriorityToneColors(choiceKey);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.choiceRow,
        { borderColor: tone.border, backgroundColor: tone.bg },
        getPressFeedbackStyle({ pressed }),
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={[styles.choiceIcon, { backgroundColor: 'rgba(255,255,255,0.75)' }]}>
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={18}
          color={tone.text}
        />
      </View>
      <View style={styles.choiceBody}>
        <Text style={styles.choiceTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.choicePromise} numberOfLines={1}>
          {promise}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tone.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
  },
  day1Wrap: {
    paddingHorizontal: spacing.lg,
  },
  day1Card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.14)',
  },
  day1Gradient: {
    padding: 16,
    gap: 14,
  },
  day1TopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  day1HeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  compassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.headerTealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day1Titles: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  day1Title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  day1Chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  day1ChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  heroImageWrap: {
    width: 96,
    height: 72,
  },
  day1Body: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  day1BodyHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  stepsFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  progressCorner: {
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.headerTealDark,
  },
  progressChest: {
    width: 28,
    height: 28,
  },
  stepsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    minWidth: 0,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepDash: {
    flex: 1,
    height: 2,
    maxWidth: 28,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  stepDashDone: {
    backgroundColor: colors.primary,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: colors.headerTealDark,
    borderColor: colors.headerTealDark,
  },
  stepCircleLocked: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.headerTealDark,
    fontWeight: '800',
  },
  selectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  selectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  choiceList: {
    gap: 8,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  choicePromise: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.1)',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrackActive: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  progressFillActive: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  impactLine: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
