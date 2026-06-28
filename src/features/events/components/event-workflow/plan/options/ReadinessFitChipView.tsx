import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { ReadinessFitChip } from '@/features/events/utils/decisionTradeoffTypes';

const BADGE_TONE_STYLE: Record<
  ReadinessFitChip['tone'],
  { bg: string; text: string; border: string }
> = {
  strong_match: {
    bg: 'rgba(11, 107, 97, 0.14)',
    text: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.24)',
  },
  weak_match: {
    bg: 'rgba(217, 147, 61, 0.12)',
    text: '#B45309',
    border: 'rgba(217, 147, 61, 0.24)',
  },
  risky: {
    bg: 'rgba(220, 90, 90, 0.10)',
    text: '#B42318',
    border: 'rgba(220, 90, 90, 0.20)',
  },
  neutral: {
    bg: 'rgba(6, 63, 59, 0.06)',
    text: eventDetail.textMuted,
    border: 'rgba(6, 63, 59, 0.10)',
  },
};

type ReadinessFitChipViewProps = {
  badge: ReadinessFitChip;
};

export function ReadinessFitChipView({ badge }: ReadinessFitChipViewProps) {
  const tone = BADGE_TONE_STYLE[badge.tone];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.label, { color: tone.text }]} numberOfLines={1}>
        Hazırlık: {badge.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
  },
});
