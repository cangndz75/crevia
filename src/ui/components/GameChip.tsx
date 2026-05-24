import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export type GameChipTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

type GameChipProps = {
  label: string;
  tone?: GameChipTone;
};

const toneStyles: Record<
  GameChipTone,
  { bg: string; text: string }
> = {
  success: { bg: colors.successMuted, text: colors.success },
  warning: { bg: colors.warningMuted, text: colors.warning },
  danger: { bg: colors.dangerMuted, text: colors.danger },
  info: { bg: colors.secondaryMuted, text: colors.secondary },
  neutral: { bg: colors.background, text: colors.textSecondary },
  purple: { bg: colors.purpleMuted, text: colors.purple },
};

export function GameChip({ label, tone = 'neutral' }: GameChipProps) {
  const palette = toneStyles[tone];

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
