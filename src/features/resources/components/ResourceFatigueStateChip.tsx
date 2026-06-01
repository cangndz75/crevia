import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ResourceFatigueVisualModel } from '@/core/resources/resourceFatigueVisualTypes';
import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  model: ResourceFatigueVisualModel | null | undefined;
  compact?: boolean;
};

const TONE_STYLES = {
  teal: { bg: mapUi.mint, border: 'rgba(15, 143, 134, 0.2)', text: mapUi.teal },
  mint: { bg: 'rgba(123, 196, 184, 0.18)', border: 'rgba(15, 143, 134, 0.15)', text: mapUi.teal },
  amber: { bg: mapUi.goldSoft, border: mapUi.goldBorder, text: '#8A6510' },
  coral: { bg: '#FFF6EE', border: 'rgba(229, 154, 34, 0.3)', text: '#9A5B12' },
  neutral: { bg: '#F4F7F6', border: 'rgba(100, 130, 125, 0.2)', text: mapUi.textSecondary },
} as const;

export function ResourceFatigueStateChip({ model, compact = false }: Props) {
  if (!model?.visible) return null;

  const palette = TONE_STYLES[model.tone] ?? TONE_STYLES.neutral;
  const iconName = resolveIoniconForRegistryKey(model.iconKey);

  return (
    <View
      style={[
        styles.chip,
        compact && styles.chipCompact,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <Ionicons name={iconName} size={compact ? 12 : 14} color={palette.text} />
      <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {model.shortLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '700',
  },
});
