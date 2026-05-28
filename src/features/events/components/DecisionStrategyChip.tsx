import { StyleSheet, Text, View } from 'react-native';

import type { DecisionStrategyTone } from '@/features/events/utils/decisionTradeoffPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

const TONE_STYLES: Record<
  DecisionStrategyTone,
  { bg: string; text: string; border: string }
> = {
  action: { bg: '#E8F4FD', text: '#1D4E89', border: 'rgba(29, 78, 137, 0.15)' },
  balanced: { bg: '#EEF4FC', text: '#334155', border: 'rgba(51, 65, 85, 0.12)' },
  social: { bg: '#F3E8FF', text: '#6B21A8', border: 'rgba(107, 33, 168, 0.12)' },
  resource: { bg: '#E8F7EF', text: '#0B6B61', border: 'rgba(11, 107, 97, 0.15)' },
  long_term: { bg: '#EDE9FE', text: '#5B21B6', border: 'rgba(91, 33, 182, 0.12)' },
  neutral: { bg: colors.backgroundAlt, text: colors.textSecondary, border: colors.border },
  risky: { bg: colors.warningMuted, text: colors.warning, border: 'rgba(234, 179, 8, 0.2)' },
  supportive: { bg: colors.successMuted, text: colors.success, border: 'rgba(34, 197, 94, 0.15)' },
  technical: { bg: '#F1F5F9', text: '#475569', border: 'rgba(71, 85, 105, 0.12)' },
};

type DecisionStrategyChipProps = {
  label: string;
  tone: DecisionStrategyTone;
};

export function DecisionStrategyChip({ label, tone }: DecisionStrategyChipProps) {
  const palette = TONE_STYLES[tone] ?? TONE_STYLES.balanced;
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
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
    borderWidth: 1,
    maxWidth: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
