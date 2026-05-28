import { StyleSheet, Text, View } from 'react-native';

import type { DecisionRiskLevel } from '@/features/events/utils/decisionTradeoffPresentation';
import { formatDecisionRiskLabel } from '@/features/events/utils/decisionTradeoffPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

const RISK_STYLES: Record<
  DecisionRiskLevel,
  { bg: string; text: string; border: string }
> = {
  low: { bg: colors.successMuted, text: colors.success, border: 'rgba(34, 197, 94, 0.15)' },
  balanced: { bg: colors.backgroundAlt, text: colors.textSecondary, border: colors.border },
  caution: { bg: colors.warningMuted, text: colors.warning, border: 'rgba(234, 179, 8, 0.2)' },
  high: { bg: '#FEECEC', text: '#B42318', border: 'rgba(180, 35, 24, 0.15)' },
};

type DecisionRiskChipProps = {
  level: DecisionRiskLevel;
};

export function DecisionRiskChip({ level }: DecisionRiskChipProps) {
  const palette = RISK_STYLES[level];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {formatDecisionRiskLabel(level)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
