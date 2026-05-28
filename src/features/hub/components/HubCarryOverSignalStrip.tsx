import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  buildCarryOverHubLines,
  getCarryOverToneStyle,
} from '@/core/carryOver/carryOverPresentation';
import { selectCarryOverSignalsForDay } from '@/core/carryOver/carryOverSelectors';
import { selectOnboardingHubVisibilityFromStore } from '@/core/onboarding/onboardingSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubCarryOverSignalStrip() {
  const showStrip = useGameStore(
    (s) =>
      selectOnboardingHubVisibilityFromStore({
        gameState: s.gameState,
        tutorialState: s.tutorialState,
        dailyPriorityState: s.dailyPriorityState,
        dailyGoalState: s.dailyGoalState,
        lastDecisionResult: s.lastDecisionResult,
        lastDailyReport: s.lastDailyReport,
        decisionHistory: s.decisionHistory,
        onboardingDismissedHintIds: s.onboardingDismissedHintIds,
      }).showCarryOverStrip,
  );
  const slice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      dailyPriorityByDay: s.dailyPriorityByDay,
      dailyGoalsByDay: s.dailyGoalsByDay,
      lastDailyReport: s.lastDailyReport,
    })),
  );

  if (!showStrip) {
    return null;
  }

  const signals = selectCarryOverSignalsForDay(slice);
  const lines = buildCarryOverHubLines(signals);
  if (lines.length === 0) {
    return null;
  }

  const primary = lines[0]!;
  const toneStyle = getCarryOverToneStyle(primary.tone);

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: toneStyle.bg,
          borderColor: toneStyle.border,
        },
      ]}>
      <Text style={[styles.label, { color: toneStyle.text }]}>Dünden Kalan</Text>
      <Text style={[styles.text, { color: toneStyle.text }]} numberOfLines={2}>
        {primary.label}
        {lines.length > 1 ? ` · ${lines[1]!.label}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
    maxWidth: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
});
