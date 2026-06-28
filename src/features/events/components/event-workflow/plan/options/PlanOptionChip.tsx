import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanOptionChipProps = {
  label: string;
  tone?: 'default' | 'recommended';
};

export function PlanOptionChip({ label, tone = 'default' }: PlanOptionChipProps) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'recommended' ? styles.chipRecommended : styles.chipDefault,
      ]}>
      <Text
        style={[
          styles.chipText,
          tone === 'recommended' ? styles.chipTextRecommended : styles.chipTextDefault,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipDefault: {
    backgroundColor: 'rgba(11, 107, 97, 0.06)',
    borderColor: 'rgba(11, 107, 97, 0.10)',
  },
  chipRecommended: {
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
    borderColor: 'rgba(11, 107, 97, 0.18)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextDefault: {
    color: eventDetail.tealDark,
  },
  chipTextRecommended: {
    color: eventDetail.tealDark,
  },
});
