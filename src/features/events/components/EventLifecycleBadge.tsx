import { StyleSheet, Text, View } from 'react-native';

import { getLifecycleToneColors } from '@/core/liveFlow/liveFlowPresentation';
import type { EventLifecycleMeta } from '@/core/liveFlow';

type Props = {
  lifecycle: EventLifecycleMeta;
  compact?: boolean;
};

export function EventLifecycleBadge({ lifecycle, compact = false }: Props) {
  const colors = getLifecycleToneColors(lifecycle.tone);

  return (
    <View
      style={[
        styles.chip,
        compact ? styles.chipCompact : null,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}>
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {lifecycle.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
