import { StyleSheet, Text, View } from 'react-native';

import type { DecisionPriorityFit } from '@/features/events/utils/decisionTradeoffPresentation';
import { formatDecisionPriorityFitLabel } from '@/features/events/utils/decisionTradeoffPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

const FIT_STYLES: Record<
  Exclude<DecisionPriorityFit, 'neutral'>,
  { bg: string; text: string }
> = {
  supports: { bg: colors.successMuted, text: colors.success },
  indirect: { bg: colors.backgroundAlt, text: colors.textSecondary },
  resource_pressure: { bg: colors.warningMuted, text: colors.warning },
  risks: { bg: '#FEECEC', text: '#B42318' },
};

type DecisionPriorityFitChipProps = {
  fit: DecisionPriorityFit;
};

export function DecisionPriorityFitChip({ fit }: DecisionPriorityFitChipProps) {
  const label = formatDecisionPriorityFitLabel(fit);
  if (!label) return null;
  const palette = FIT_STYLES[fit as keyof typeof FIT_STYLES] ?? FIT_STYLES.indirect;
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    maxWidth: '100%',
    flexShrink: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
