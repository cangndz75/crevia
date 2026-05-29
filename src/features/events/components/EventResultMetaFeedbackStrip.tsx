import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type Props = {
  lines: string[];
};

export function EventResultMetaFeedbackStrip({ lines }: Props) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {lines.map((line) => (
        <View key={line} style={styles.line}>
          <Text style={styles.text} numberOfLines={1}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    minWidth: 0,
  },
  line: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
    minWidth: 0,
  },
});
