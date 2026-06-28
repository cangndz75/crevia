import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { ContextFitBadge } from '@/features/events/utils/decisionTradeoffTypes';

const BADGE_TONE_STYLE: Record<
  ContextFitBadge['tone'],
  { bg: string; text: string; border: string }
> = {
  strong_match: {
    bg: 'rgba(11, 107, 97, 0.14)',
    text: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.24)',
  },
  risky_choice: {
    bg: 'rgba(220, 90, 90, 0.10)',
    text: '#B42318',
    border: 'rgba(220, 90, 90, 0.20)',
  },
  resource_friendly: {
    bg: 'rgba(62, 158, 106, 0.12)',
    text: '#1A7A5C',
    border: 'rgba(62, 158, 106, 0.22)',
  },
  social_strong: {
    bg: 'rgba(11, 107, 97, 0.12)',
    text: eventDetail.tealDark,
    border: 'rgba(11, 107, 97, 0.20)',
  },
  tomorrow_risk: {
    bg: 'rgba(217, 147, 61, 0.12)',
    text: '#B45309',
    border: 'rgba(217, 147, 61, 0.24)',
  },
  neutral: {
    bg: 'rgba(6, 63, 59, 0.06)',
    text: eventDetail.textMuted,
    border: 'rgba(6, 63, 59, 0.10)',
  },
};

type ContextFitBadgeViewProps = {
  badge: ContextFitBadge;
};

export function ContextFitBadgeView({ badge }: ContextFitBadgeViewProps) {
  const tone = BADGE_TONE_STYLE[badge.tone];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.label, { color: tone.text }]} numberOfLines={1}>
        {badge.label}
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
    marginTop: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
  },
});
