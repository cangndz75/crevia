import { StyleSheet, Text, View } from 'react-native';

import type { AdvisorSeniorityModel } from '@/core/advisors/advisorSeniorityTypes';

type Props = {
  model: AdvisorSeniorityModel | null | undefined;
  compact?: boolean;
};

const TONE_COLORS: Record<AdvisorSeniorityModel['tone'], { bg: string; text: string; border: string }> = {
  learning: { bg: 'rgba(63, 92, 107, 0.08)', text: '#3F5C6B', border: 'rgba(63, 92, 107, 0.14)' },
  calm: { bg: 'rgba(15, 107, 100, 0.08)', text: '#0F6B64', border: 'rgba(15, 107, 100, 0.14)' },
  operational: { bg: 'rgba(15, 107, 100, 0.1)', text: '#0F4A46', border: 'rgba(15, 107, 100, 0.18)' },
  strategic: { bg: 'rgba(154, 107, 18, 0.08)', text: '#7A5A10', border: 'rgba(154, 107, 18, 0.16)' },
  cautious: { bg: 'rgba(74, 95, 91, 0.1)', text: '#4A5F5B', border: 'rgba(74, 95, 91, 0.16)' },
};

export function AdvisorSeniorityBadge({ model, compact = false }: Props) {
  if (!model?.visible) return null;

  const palette = TONE_COLORS[model.tone];
  const label = compact ? model.shortTitle : model.shortTitle;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
});
