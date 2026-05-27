import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type DetailRow = { label: string; value: string };

type EventDetailsAccordionProps = {
  expanded: boolean;
  onToggle: () => void;
  rows: DetailRow[];
};

export function EventDetailsAccordion({
  expanded,
  onToggle,
  rows,
}: EventDetailsAccordionProps) {
  const targetHeight = rows.length * 34 + 12;
  const height = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(expanded ? targetHeight : 0, { duration: 220 });
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 220 });
  }, [expanded, height, rotation, targetHeight]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: height.value > 0 ? 1 : 0,
    maxHeight: height.value,
    overflow: 'hidden' as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.strip, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Diğer detaylar"
        accessibilityState={{ expanded }}>
        <Text style={styles.stripTitle}>DİĞER DETAYLAR</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={eventDetail.teal} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.content, contentStyle]}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.value} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  pressed: {
    opacity: 0.9,
  },
  stripTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: eventDetail.tealDark,
  },
  content: {
    marginTop: 8,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: eventDetail.textMuted,
    flexShrink: 0,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.textDark,
    flex: 1,
    textAlign: 'right',
  },
});
