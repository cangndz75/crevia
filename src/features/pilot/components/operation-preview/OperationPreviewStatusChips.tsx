import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { OperationPreviewChipView } from '@/features/pilot/hooks/useOperationPreviewState';
import type { StatusChipItem } from '@/features/pilot/components/operation-preview/operationPreviewData';

export type { OperationPreviewChipView };
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const CHIP_PALETTE: Record<
  StatusChipItem['tone'],
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: colors.successMuted,
    border: `${colors.success}44`,
    text: colors.success,
    icon: colors.success,
  },
  info: {
    bg: colors.secondaryMuted,
    border: `${colors.secondary}44`,
    text: colors.secondary,
    icon: colors.secondary,
  },
  warning: {
    bg: colors.hubGoldMuted,
    border: `${colors.hubGold}66`,
    text: colors.hubGoldDark,
    icon: colors.hubGoldDark,
  },
};

function StatusChip({
  item,
  index,
}: {
  item: OperationPreviewChipView;
  index: number;
}) {
  const palette = CHIP_PALETTE[item.tone];
  const inactive = !item.active;

  return (
    <Animated.View
      entering={FadeInUp.delay(40 + index * 40).duration(280).springify().damping(22)}
      style={[
        styles.chip,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: inactive ? 0.45 : 1,
        },
      ]}>
      <Ionicons
        name={item.icon}
        size={12}
        color={inactive ? colors.textSecondary : palette.icon}
      />
      <Text
        style={[
          styles.chipText,
          { color: inactive ? colors.textSecondary : palette.text },
        ]}
        numberOfLines={1}>
        {item.label}
      </Text>
    </Animated.View>
  );
}

export type PersonalizedPreviewChip = {
  id: string;
  label: string;
  tone: StatusChipItem['tone'];
};

type OperationPreviewStatusChipsProps = {
  chips: OperationPreviewChipView[];
  personalizedChips?: PersonalizedPreviewChip[] | null;
};

export function OperationPreviewStatusChips({
  chips,
  personalizedChips,
}: OperationPreviewStatusChipsProps) {
  const items =
    personalizedChips && personalizedChips.length > 0
      ? personalizedChips.map((chip) => ({
          id: chip.id,
          label: chip.label,
          icon: 'checkmark-circle' as const,
          tone: chip.tone,
          active: true,
        }))
      : chips;

  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <StatusChip key={item.id} item={item} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});
