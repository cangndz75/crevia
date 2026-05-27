import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DecisionEffectPill } from '@/features/events/utils/eventDecisionPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type DecisionEffectPillsProps = {
  pills: DecisionEffectPill[];
};

const toneStyles = {
  positive: { bg: colors.successMuted, text: colors.success },
  negative: { bg: colors.dangerMuted, text: colors.danger },
  neutral: { bg: colors.background, text: colors.textSecondary },
  gold: { bg: colors.hubGoldMuted, text: colors.hubGoldDark },
  teal: { bg: colors.primaryMuted, text: colors.primary },
};

export function DecisionEffectPills({ pills }: DecisionEffectPillsProps) {
  if (pills.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {pills.map((pill) => {
        const palette = toneStyles[pill.tone];
        return (
          <View
            key={pill.key}
            style={[styles.pill, { backgroundColor: palette.bg }]}>
            <Text style={[styles.pillText, { color: palette.text }]}>
              {pill.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
