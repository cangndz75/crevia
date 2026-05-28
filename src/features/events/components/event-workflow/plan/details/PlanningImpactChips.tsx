import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanningImpactChipsProps = {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'warning';
};

const TONE_STYLES = {
  positive: { bg: eventDetail.mint, text: eventDetail.tealDark },
  neutral: { bg: '#F0F2F1', text: eventDetail.textMuted },
  warning: { bg: '#FFF4E5', text: '#9A5E12' },
} as const;

export function PlanningImpactChips({
  label,
  value,
  tone = 'neutral',
}: PlanningImpactChipsProps) {
  const colors = TONE_STYLES[tone];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
});
