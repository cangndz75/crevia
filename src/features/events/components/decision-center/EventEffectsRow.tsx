import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { buildCompactEffectChips } from '@/features/events/utils/eventUiHelpers';
import type { EventPreviewEffects } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const TONE_STYLES = {
  positive: {
    bg: colors.successMuted,
    text: colors.success,
    icon: 'happy-outline' as const,
  },
  negative: {
    bg: colors.dangerMuted,
    text: colors.danger,
    icon: 'sad-outline' as const,
  },
  neutral: {
    bg: colors.background,
    text: colors.textSecondary,
    icon: 'remove-outline' as const,
  },
  xp: {
    bg: colors.purpleMuted,
    text: colors.purple,
    icon: 'star' as const,
  },
  risk: {
    bg: colors.primaryMuted,
    text: colors.primary,
    icon: 'alert-circle-outline' as const,
  },
  budget: {
    bg: '#FCE8EC',
    text: colors.danger,
    icon: 'wallet-outline' as const,
  },
};

type EventEffectsRowProps = {
  effects: EventPreviewEffects;
  showTitle?: boolean;
};

export function EventEffectsRow({
  effects,
  showTitle = false,
}: EventEffectsRowProps) {
  const chips = buildCompactEffectChips(effects);

  if (chips.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {showTitle ? <Text style={styles.sectionTitle}>ETKİLER</Text> : null}
      <View style={styles.row}>
        {chips.map((chip) => {
          const palette = TONE_STYLES[chip.tone];
          return (
            <View
              key={chip.key}
              style={[styles.chip, { backgroundColor: palette.bg }]}>
              <Ionicons name={palette.icon} size={12} color={palette.text} />
              <Text style={[styles.chipText, { color: palette.text }]}>
                {chip.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
