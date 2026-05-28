import { StyleSheet, Text } from 'react-native';

import { colors } from '@/ui/theme/colors';

type DecisionTradeoffLineProps = {
  text: string;
  numberOfLines?: number;
  compact?: boolean;
};

export function DecisionTradeoffLine({
  text,
  numberOfLines = 2,
  compact = false,
}: DecisionTradeoffLineProps) {
  return (
    <Text
      style={[styles.text, compact && styles.textCompact]}
      numberOfLines={numberOfLines}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
