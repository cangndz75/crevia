import { StyleSheet, Text, View } from 'react-native';

import type { AdvisorSeniorityModel } from '@/core/advisors/advisorSeniorityTypes';

type Props = {
  model: AdvisorSeniorityModel | null | undefined;
  compact?: boolean;
};

export function AdvisorDepthInsightBlock({ model, compact = false }: Props) {
  if (!model?.visible || !model.insightLine.trim()) return null;

  return (
    <View style={[styles.block, compact && styles.blockCompact]}>
      <Text style={styles.insight} numberOfLines={model.maxLines}>
        {model.insightLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    minWidth: 0,
    flexShrink: 1,
    paddingTop: 2,
  },
  blockCompact: {
    paddingTop: 0,
  },
  insight: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5A5550',
    flexShrink: 1,
    minWidth: 0,
  },
});
