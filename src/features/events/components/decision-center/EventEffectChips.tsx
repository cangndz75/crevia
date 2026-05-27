import { StyleSheet, Text, View } from 'react-native';

import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import type { PremiumEffectChip } from '@/features/events/utils/eventUiHelpers';

const TONE_STYLES: Record<
  PremiumEffectChip['tone'],
  { bg: string; text: string }
> = {
  positive: { bg: eventsScreen.resolvedMuted, text: eventsScreen.resolved },
  negative: { bg: eventsScreen.criticalMuted, text: eventsScreen.critical },
  neutral: { bg: '#F5F4F1', text: eventsScreen.textMuted },
  xp: { bg: eventsScreen.opportunityMuted, text: eventsScreen.opportunity },
  risk: { bg: '#E6F5F4', text: eventsScreen.teal },
  budget: { bg: eventsScreen.criticalMuted, text: eventsScreen.critical },
};

type EventEffectChipsProps = {
  chips: PremiumEffectChip[];
  compact?: boolean;
};

export function EventEffectChips({ chips, compact = false }: EventEffectChipsProps) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const palette = TONE_STYLES[chip.tone];
        return (
          <View
            key={chip.key}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              { backgroundColor: palette.bg },
            ]}>
            <Text
              style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}
              numberOfLines={1}>
              {chip.friendlyLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
  labelCompact: {
    fontSize: 10,
  },
});
