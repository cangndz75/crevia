import { StyleSheet, View } from 'react-native';

import type { ResourceFatigueVisualSummary } from '@/core/resources/resourceFatigueVisualTypes';

import { ResourceFatigueStateChip } from './ResourceFatigueStateChip';

type Props = {
  summary: ResourceFatigueVisualSummary | null | undefined;
  compact?: boolean;
  maxItems?: number;
};

export function ResourceFatigueSummaryStrip({
  summary,
  compact = false,
  maxItems = 2,
}: Props) {
  if (!summary?.visibleStates.length) return null;

  const items = summary.visibleStates.slice(0, maxItems);

  return (
    <View style={[styles.strip, compact && styles.stripCompact]}>
      {items.map((model) => (
        <ResourceFatigueStateChip key={model.id} model={model} compact={compact} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
    marginTop: 8,
  },
  stripCompact: {
    marginTop: 6,
    gap: 4,
  },
});
